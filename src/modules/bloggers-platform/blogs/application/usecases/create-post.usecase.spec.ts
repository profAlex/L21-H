import { CreatePostForBlogCommand, CreatePostForBlogHandler } from './create-post.usecase';
import { BlogsQueryRepository } from '../../infrastructure/query/blogs.query-repository';
import { PostsCommandRepository } from '../../../posts/infrastructure/posts.command-repository';
import { Test, TestingModule } from '@nestjs/testing';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';


describe('CreatePostForBlogHandler', () => {
    let handler: CreatePostForBlogHandler;
    let blogsQueryRepository: jest.Mocked<BlogsQueryRepository>;
    let postsCommandRepository: jest.Mocked<PostsCommandRepository>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreatePostForBlogHandler,
                {
                    provide: BlogsQueryRepository,
                    useValue: {
                        SQLifBlogExists: jest.fn(),
                    },
                },
                {
                    provide: PostsCommandRepository,
                    useValue: {
                        SQLsaveCreate: jest.fn(),
                    },
                },
            ],
        }).compile();

        handler = module.get<CreatePostForBlogHandler>(CreatePostForBlogHandler);
        blogsQueryRepository = module.get(BlogsQueryRepository);
        postsCommandRepository = module.get(PostsCommandRepository);
    });

    it('should throw DomainException if blog does not exist', async () => {
        // Arrange
        const blogId = 'non-existent-blog';
        const command = new CreatePostForBlogCommand(blogId, {
            title: 'Test Post',
            shortDescription: 'Short desc',
            content: 'Content text',
        });

        blogsQueryRepository.SQLifBlogExists.mockResolvedValue(false);

        // Act & Assert
        await expect(handler.execute(command)).rejects.toThrow(DomainException);
        await expect(handler.execute(command)).rejects.toMatchObject({
            code: DomainExceptionCode.BlogNotFound,
            message: `Blog with id ${blogId} not found`,
        });
        expect(postsCommandRepository.SQLsaveCreate).not.toHaveBeenCalled();
    });

    it('should successfully create and save post if blog exists', async () => {
        // Arrange
        const blogId = 'existing-blog-id';
        const postInput = {
            title: 'Test Post',
            shortDescription: 'Short desc',
            content: 'Content text',
        };
        const command = new CreatePostForBlogCommand(blogId, postInput);
        const expectedPostId = 'new-post-uuid-123';

        blogsQueryRepository.SQLifBlogExists.mockResolvedValue(true);
        postsCommandRepository.SQLsaveCreate.mockResolvedValue(expectedPostId);

        // Act
        const result = await handler.execute(command);

        // Assert
        expect(result).toBe(expectedPostId);
        expect(blogsQueryRepository.SQLifBlogExists).toHaveBeenCalledWith(blogId);
        expect(postsCommandRepository.SQLsaveCreate).toHaveBeenCalledTimes(1);
        expect(postsCommandRepository.SQLsaveCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                title: postInput.title,
                shortDescription: postInput.shortDescription,
                content: postInput.content,
                blogId: blogId,
            }),
        );
    });
});