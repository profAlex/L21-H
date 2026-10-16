import { Test, TestingModule } from '@nestjs/testing';
import { SQLBlog } from '../../domain/sql-blog.entity';
import { DeleteBlogByIdCommand, DeleteBlogByIdCommandHandler } from './delete-blog-by-id.usecase';
import { BlogsCommandRepository } from '../../infrastructure/blogs.command-repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

describe('DeleteBlogByIdCommandHandler', () => {
    let handler: DeleteBlogByIdCommandHandler;
    let blogsCommandRepository: jest.Mocked<BlogsCommandRepository>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DeleteBlogByIdCommandHandler,
                {
                    provide: BlogsCommandRepository,
                    useValue: {
                        SQLfindBlogById: jest.fn(),
                        SQLsaveUpdate: jest.fn(),
                    },
                },
            ],
        }).compile();

        handler = module.get<DeleteBlogByIdCommandHandler>(DeleteBlogByIdCommandHandler);
        blogsCommandRepository = module.get(BlogsCommandRepository);
    });

    it('should throw DomainException if blog to delete is not found', async () => {
        // Arrange
        const blogId = 'non-existent-id';
        const command = new DeleteBlogByIdCommand(blogId);

        blogsCommandRepository.SQLfindBlogById.mockResolvedValue(null);

        // Act & Assert
        await expect(handler.execute(command)).rejects.toThrow(DomainException);
        await expect(handler.execute(command)).rejects.toMatchObject({
            code: DomainExceptionCode.BlogNotFound,
            message: `Blog with id ${blogId} not found`,
        });
        expect(blogsCommandRepository.SQLsaveUpdate).not.toHaveBeenCalled();
    });

    it('should successfully mark blog as deleted and save it', async () => {
        // Arrange
        const blogId = 'existing-blog-id';
        const command = new DeleteBlogByIdCommand(blogId);

        // Мокаем доменную сущность со шпионом на метод makeDeleted
        const mockBlogEntity = {
            id: blogId,
            deletedAt: null,
            makeDeleted: jest.fn(),
        } as unknown as SQLBlog;

        blogsCommandRepository.SQLfindBlogById.mockResolvedValue(mockBlogEntity);
        blogsCommandRepository.SQLsaveUpdate.mockResolvedValue(undefined);

        // Act
        await handler.execute(command);

        // Assert
        expect(blogsCommandRepository.SQLfindBlogById).toHaveBeenCalledWith(blogId);
        expect(mockBlogEntity.makeDeleted).toHaveBeenCalledTimes(1);
        expect(blogsCommandRepository.SQLsaveUpdate).toHaveBeenCalledTimes(1);
        expect(blogsCommandRepository.SQLsaveUpdate).toHaveBeenCalledWith(mockBlogEntity);
    });
});