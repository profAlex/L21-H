import { Module } from '@nestjs/common';
import { UsersController } from './api/users.controller';
import { UsersCommandRepository } from './infrastructure/users.command-repository';
import { UsersQueryRepository } from './infrastructure/query/users.query-repository';
import { CryptoService } from '../../core/bcrypt/bcrypt.service';
import { GetAllUsersQueryHandler } from './application/usecases/get-all-users.usecase';
import { GetUserByIdOrNotFoundHandler } from './application/usecases/get-user-by-id.usecase';
import { CreateUserHandler } from './application/usecases/create-user.usecase';
import { DeleteUserHandler } from './application/usecases/delete-user.usecase';
import { User } from './domain/type-orm-user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [UsersController],
    providers: [
        DeleteUserHandler,
        GetUserByIdOrNotFoundHandler,
        CreateUserHandler,
        GetAllUsersQueryHandler,
        UsersCommandRepository,
        UsersQueryRepository,
        CryptoService,
    ],
    exports: [],
})
export class UserAccountsModule {}
