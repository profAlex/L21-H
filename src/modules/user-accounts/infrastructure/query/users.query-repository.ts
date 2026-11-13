import { SQLUserViewDto } from '../../api/view-dto/users.view-dto';
import { Injectable } from '@nestjs/common';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { GetUsersQueryParams } from '../../api/input-dto/get-users-query-params.input-dto';
import { SQLMeViewDto } from '../../../authorisation/api/view-dto/me.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { Brackets, DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../domain/type-orm-user.entity';

interface UserDbRow {
    id: string;
    login: string;
    email: string;
    created_at: Date;
}

@Injectable()
export class UsersQueryRepository {
    constructor(
        private readonly dataSource: DataSource,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) {}

    async SQLgetByIdOrNotFoundFail(id: string): Promise<SQLUserViewDto> {
        const [user] = await this.dataSource.query<UserDbRow[]>(`
            SELECT id, login, email, created_at
            FROM users
            WHERE id = $1 AND deleted_at IS NULL`,[id]);

        if (!user) {
            // throw new NotFoundException('user not found');
            throw new DomainException({
                code: DomainExceptionCode.UserNotFound,
                message: 'User not found',
            });
        }

        return SQLUserViewDto.mapFromDbRow(user);
    }

    // async getMeByIdOrNotFoundFail(id: string): Promise<MeViewDto> {
    //     const user = await this.UserModel.findOne({
    //         _id: id,
    //         deletedAt: null,
    //     }).lean();
    //
    //     if (!user) {
    //         // throw new NotFoundException('user not found');
    //         throw new DomainException({
    //             code: DomainExceptionCode.UserNotFound,
    //             message: 'User not found',
    //         });
    //     }
    //
    //     return MeViewDto.mapToView(user);
    // }

    async SQLgetMeByIdOrNotFoundFail(id: string): Promise<SQLMeViewDto> {
        // все алиасы без двойных кавычек принудительно приводятся к нижнему регистру (userid)!
        const meQuery = `
            SELECT id AS "userId", login, email
            FROM public."users"
            WHERE id = $1 AND deleted_at IS NULL;
        `;

        const [userRow] = await this.dataSource.query<{userId:string, login:string, email:string}[]>(meQuery, [id]);


        if (!userRow) {
            // throw new NotFoundException('user not found');
            throw new DomainException({
                code: DomainExceptionCode.UserNotFound,
                message: 'User not found',
            });
        }

        return SQLMeViewDto.mapToView(userRow);
    }

    // async getAllUsers(
    //     query: GetUsersQueryParams,
    // ): Promise<PaginatedViewDto<UserViewDto>> {
    //     const filter: Record<string, any> = {
    //         deletedAt: null,
    //     };
    //
    //     const orConditions: any[] = [];
    //
    //     // дальнейший блог if - это дополнительнве проверки в дополнение к дефолтным, назначаемым в классе GetBlogsQueryParams
    //     // 1) Если пользователь не ввел поисковое слово, query.searchNameTerm будет равен null.
    //     // В таком случае, если нет проверки if: программа попытается добавить в MongoDB условие
    //     // { name: { $regex: null } }. База либо вернет ошибку, либо (что хуже) попытается
    //     // найти документы, где имя буквально равно null.
    //     // С проверкой if(query.searchNameTerm) код просто не зайдет внутрь if, и массив $or
    //     // не создается. Запрос остается чистым.
    //
    //     // 2) Защита от пустых строк
    //     // Иногда пользователи присылают ?searchNameTerm=. В этом случае в DTO может попасть
    //     // пустая строка "".
    //     // if (query.searchNameTerm) отфильтрует это (так как пустая строка — это falsy),
    //     // и база не будет нагружена бесполезным поиском по пустому регулярному выражению.
    //     if (query.searchLoginTerm) {
    //         orConditions.push({
    //             login: { $regex: query.searchLoginTerm, $options: 'i' },
    //         });
    //     }
    //
    //     if (query.searchEmailTerm) {
    //         orConditions.push({
    //             email: { $regex: query.searchEmailTerm, $options: 'i' },
    //         });
    //     }
    //
    //     if (orConditions.length > 0) {
    //         filter.$or = orConditions;
    //     }
    //
    //     const users = await this.UserModel.find(filter)
    //         .sort({ [query.sortBy]: query.sortDirection })
    //         .skip(query.calculateSkip())
    //         .limit(query.pageSize);
    //
    //     const totalCount = await this.UserModel.countDocuments(filter);
    //
    //     const items = users.map(UserViewDto.mapToView);
    //
    //     return PaginatedViewDto.mapToView({
    //         items,
    //         totalCount,
    //         page: query.pageNumber,
    //         size: query.pageSize,
    //     });
    // }

    async getAllUsers(
        query: GetUsersQueryParams,
    ): Promise<PaginatedViewDto<SQLUserViewDto>> {
        // создаем экземпляр билдера
        const queryBuilder = this.userRepository.createQueryBuilder('user');

        // Исключаем мягко удаленные (если не используете WithDeleted глобально)
        queryBuilder.where('user.deleted_at IS NULL');

        // Условия поиска (OR по login или email, case-insensitive ILIKE)
        if (query.searchLoginTerm || query.searchEmailTerm) {
            queryBuilder.andWhere(
                new Brackets((qb) => {
                    if (query.searchLoginTerm) {
                        qb.orWhere('user.login ILIKE :login', { login: `%${query.searchLoginTerm}%` });
                    }
                    if (query.searchEmailTerm) {
                        qb.orWhere('user.email ILIKE :email', { email: `%${query.searchEmailTerm}%` });
                    }
                }),
            );
        }

        // Безопасная сортировка (whitelist полей)
        const allowedSortColumns: Record<string, string> = {
            createdAt: 'user.created_at',
            login: 'user.login',
            email: 'user.email',
        };

        const sortByColumn = allowedSortColumns[query.sortBy] || 'user.created_at';
        const sortDirection = (query.sortDirection && query.sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC';

        queryBuilder.orderBy(sortByColumn, sortDirection);

        // Пагинация
        const skip = query.calculateSkip();
        queryBuilder.skip(skip).take(query.pageSize);

        // Выбираем нужные поля (чтобы не тянуть лишнее)
        queryBuilder.select(['user.id', 'user.login', 'user.email', 'user.created_at']);

        // Параллельно получаем элементы и общее количество
        const [usersRows, totalCount] = await queryBuilder.getManyAndCount();

        // Маппим в DTO
        const items = usersRows.map((row) =>
            SQLUserViewDto.mapFromDbRow({
                id: row.id,
                login: row.login,
                email: row.email,
                created_at: row.created_at,
            })
        );

        return PaginatedViewDto.mapToView({
            items,
            totalCount,
            page: query.pageNumber,
            size: query.pageSize,
        });
        // маппим плоские SQL-строки в DTO
        // const items = usersRows.map((row) => ({
        //     id: row.id,
        //     login: row.login,
        //     email: row.email,
        //     createdAt: row.created_at instanceof Date
        //         ? row.created_at.toISOString()
        //         : new Date(row.created_at).toISOString(),
        // }));

    }

    // async findUserByLogin(
    //     loginOrEmail: string,
    // ): Promise<UserAuthInternalDto | null> {
    //     const user = await this.UserModel.findOne({
    //         $or: [{ login: loginOrEmail }, { email: loginOrEmail }],
    //         $and: [{ deletedAt: null }],
    //     })
    //         .select(
    //             '_id email passwordHash login isEmailConfirmed deletedAt name',
    //         )
    //         .lean();
    //
    //     if (!user) {
    //         return null;
    //     }
    //
    //     return UserAuthInternalDto.mapToView(user);
    // }

    /* language = SQL */
    async SQLfindUserByLogin(
        loginOrEmail: string,
    ): Promise<{id:string, passwordHash:string} | null> {
        const query = `
            SELECT 
                id AS "id", 
                password_hash AS "passwordHash" 
            FROM users
            WHERE (login = $1 OR email = $1) AND deleted_at IS NULL; 
        `;

        const [usersRow] = await this.dataSource.query<{id:string, passwordHash:string}[]>(query,[loginOrEmail]);

        if (!usersRow) {
            return null;
        }

        return usersRow;
    }


    // async checkIfUserExists(
    //     login: string,
    //     email: string,
    // ): Promise<'login' | 'email' | null> {
    //     // Проверяем отдельно занят ли логин а потом емейл, т.к. логика платформенных тестов требует указания field: login при отсутствии логина,
    //     // поэтмоу разделяем ошибки, но можно попробовать вернуть всегда тут такую ошибку
    //     const loginCount = await this.UserModel.countDocuments({
    //         login: login,
    //         deletedAt: null,
    //     });
    //     if (loginCount > 0) return 'login';
    //
    //     // прроверяем, занят ли email
    //     const emailCount = await this.UserModel.countDocuments({
    //         email: email,
    //         deletedAt: null,
    //     });
    //     if (emailCount > 0) return 'email';
    //
    //     // ничего не занято
    //     return null;
    // }

    // async checkIfUserExists(login: string, email: string): Promise<boolean> {
    //     return await this.UserModel.countDocuments({
    //         $or: [{login: login},{email: email}],
    //         deletedAt: null
    //     })>0;
    // }

    // async findUserByConfirmationCode(
    //     confirmationCode: string,
    // ): Promise<UserDocument | null> {
    //     return this.UserModel.findOne({
    //         $and: [
    //             { 'emailConfirmationInfo.confirmationCode': confirmationCode },
    //             {
    //                 'emailConfirmationInfo.expirationDate': {
    //                     $gte: new Date(),
    //                 },
    //             }, //Date.now() в JavaScript возвращает число (таймстамп в миллисекундах, например 1716924800000). Но в схеме Mongoose поле expirationDate имеет тип Date (хранится как полноценный ISODate объект).
    //             { deletedAt: null },
    //         ],
    //     });
    // }
    //
    // async findConfirmedUserByEmail(
    //     sentEmail: string,
    // ): Promise<UserDocument | null> {
    //     return this.UserModel.findOne({
    //         $and: [
    //             { email: sentEmail },
    //             { isEmailConfirmed: true },
    //             { deletedAt: null },
    //         ],
    //     });
    // }
    //
    // async findUserByRecoveryCode(
    //     sentRevoceryCode: string,
    // ): Promise<UserDocument | null> {
    //     return this.UserModel.findOne({
    //         $and: [
    //             { recoveryCode: sentRevoceryCode },
    //             { recoveryCodeExpirationDate: { $gte: new Date() } },
    //             { deletedAt: null },
    //         ],
    //     });
    // }
    //
    // async findNotConfirmedByEmail(
    //     sentEmail: string,
    // ): Promise<UserDocument | null> {
    //     return this.UserModel.findOne({
    //         $and: [
    //             { email: sentEmail },
    //             { isEmailConfirmed: false },
    //             { deletedAt: null },
    //         ],
    //     });
    // }

}
