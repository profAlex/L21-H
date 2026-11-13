import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { SQLUserViewDto } from '../../api/view-dto/users.view-dto';
import { UsersQueryRepository } from '../../infrastructure/query/users.query-repository';
import { GetUsersQueryParams } from '../../api/input-dto/get-users-query-params.input-dto';

export class GetAllUsers extends Query<PaginatedViewDto<SQLUserViewDto>> {
    constructor(
        public readonly query: GetUsersQueryParams,
    ) {
        super();
    }
}

@QueryHandler(GetAllUsers)
export class GetAllUsersQueryHandler implements IQueryHandler<GetAllUsers> {
    constructor(
        private usersQueryRepository: UsersQueryRepository,
    ) {}

    async execute({query}: GetAllUsers): Promise<PaginatedViewDto<SQLUserViewDto>> {

        return this.usersQueryRepository.getAllUsers(query);
    }
}