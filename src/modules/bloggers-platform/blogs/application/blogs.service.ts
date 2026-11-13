import {Injectable, NotFoundException} from '@nestjs/common';
import {
    UsersExternalQueryRepository
} from '../../../user-accounts/infrastructure/external-query/users.external-query-repository';
import {UsersExternalService} from '../../../user-accounts/application/users.external-service';
import {InjectModel} from "@nestjs/mongoose";
import {CreateBlogDto} from "../dto/create-blog.dto";
import {BlogsCommandRepository} from "../infrastructure/blogs.command-repository";
import {DomainExceptionCode} from "../../../../core/exceptions/domain-exception-codes";
import {DomainException} from "../../../../core/exceptions/domain-exceptions";

@Injectable()
export class BlogsService {
    constructor(
        private blogsCommandRepository: BlogsCommandRepository,
    ) {
        console.log('BlogsService created');
    }

}
