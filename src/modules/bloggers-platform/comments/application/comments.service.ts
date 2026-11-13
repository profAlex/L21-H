import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { GetCommentsQueryParams } from '../api/input-dto/get-comments-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { PostsQueryRepository } from '../../posts/infrastructure/query/posts.query-repository';
import { CommentsQueryRepository } from '../infrastructure/query/comments.query-repository';
import { CommentsCommandRepository } from '../infrastructure/comments.command-repository';
import { CreateCommentApiInputDto } from '../api/input-dto/create-comment.api.input-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class CommentsService {
    constructor(
        private postsQueryRepository: PostsQueryRepository,
        private commentsQueryRepository: CommentsQueryRepository,
        private commentsCommandRepository: CommentsCommandRepository,
    ) {
        console.log('CommentsService created');
    }

}
