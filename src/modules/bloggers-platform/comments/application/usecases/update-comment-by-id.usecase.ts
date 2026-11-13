import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsCommandRepository } from '../../infrastructure/comments.command-repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class UpdateCommentById extends Command<void> {
    constructor(
        public readonly commentId: string,
        public readonly userId: string,
        public readonly content: string,
    ) {
        super();
    }
}

@CommandHandler(UpdateCommentById)
export class UpdateCommentByIdHandler implements ICommandHandler<UpdateCommentById> {
    constructor(
        private commentsCommandRepository: CommentsCommandRepository,
    ) {}

    async execute({
        commentId,
        userId,
        content,
    }: UpdateCommentById): Promise<void> {
        // console.warn('<---- commentId to be found: ', commentId);

        const comment =
            await this.commentsCommandRepository.SQLfindCommentById(commentId);

        if (!comment) {
            throw new DomainException({
                code: DomainExceptionCode.CommentNotFound,
                message: 'Comment not found',
            });
        }

        // console.warn('<---- commentId which was found: ', comment?.id);



        if (userId !== comment.userId) {
            throw new DomainException({
                code: DomainExceptionCode.Forbidden,
                message: 'Forbidden to update comment',
            });
        }

        const isContentChanged = comment.updateComment({ content });
        if (isContentChanged) {
            await this.commentsCommandRepository.SQLsaveUpdate(comment);
        }
    }
}
