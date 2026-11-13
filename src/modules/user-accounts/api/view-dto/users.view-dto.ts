import { Types } from 'mongoose';
import { SQLUser } from '../../domain/sql-user.entitry';
import { User } from '../../domain/type-orm-user.entity';
import { UserDbRow } from '../../infrastructure/users.command-repository';

// export class UserViewDto {
//     id: string;
//     login: string;
//     email: string;
//     createdAt: string;
//
//     static mapToView(user: UserDocument): UserViewDto {
//         const dto = new UserViewDto();
//
//         dto.email = user.email;
//         dto.login = user.login;
//         dto.id = user._id.toString();
//         dto.createdAt = new Date(user.createdAt).toISOString();
//         //dto.firstName = user.name.firstName;
//         //dto.lastName = user.name.lastName;
//
//         return dto;
//     }
// }

export class SQLUserViewDto {
    id: string;
    login: string;
    email: string;
    createdAt: string;

    private constructor(data: { id: string; login: string; email: string; createdAt: string }) {
        this.id = data.id;
        this.login = data.login;
        this.email = data.email;
        this.createdAt = data.createdAt;
    }

    // Для сырых строк из PostgreSQL (snake_case)
    static mapFromDbRow(row: UserDbRow): SQLUserViewDto {
        return new SQLUserViewDto({
            id: row.id,
            login: row.login,
            email: row.email,
            createdAt: row.created_at instanceof Date
                ? row.created_at.toISOString()
                : new Date(row.created_at).toISOString(),
        });
    }

    // Для доменных объектов SQLUser (camelCase)
    static mapToView(user: SQLUser): SQLUserViewDto {
        return new SQLUserViewDto({
            id: user.id,
            login: user.login,
            email: user.email,
            createdAt: user.createdAt instanceof Date
                ? user.createdAt.toISOString()
                : new Date(user.createdAt).toISOString(),
        });
    }
}