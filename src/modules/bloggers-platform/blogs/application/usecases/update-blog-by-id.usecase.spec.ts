import { UpdateBlogCommand, UpdateBlogHandler } from './update-blog-by-id.usecase';
import { BlogsCommandRepository } from '../../infrastructure/blogs.command-repository';
import { Test, TestingModule } from '@nestjs/testing';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { SQLBlog } from '../../domain/sql-blog.entity';


describe('UpdateBlogHandler', () => {
    let handler: UpdateBlogHandler;
    let blogsCommandRepository: jest.Mocked<BlogsCommandRepository>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UpdateBlogHandler,
                {
                    provide: BlogsCommandRepository,
                    useValue: {
                        SQLfindBlogById: jest.fn(),
                        SQLsaveUpdate: jest.fn(),
                    },
                },
            ],
        }).compile();

        handler = module.get<UpdateBlogHandler>(UpdateBlogHandler);
        blogsCommandRepository = module.get(BlogsCommandRepository);
    });

    it('should throw DomainException if blog to update is not found', async () => {
        // Arrange
        const blogId = 'non-existent-id';
        const dto = { name: 'Updated Name', description: 'Updated Desc', websiteUrl: 'https://updated.com' };
        const command = new UpdateBlogCommand(blogId, dto);

        blogsCommandRepository.SQLfindBlogById.mockResolvedValue(null);

        // Act & Assert
        await expect(handler.execute(command)).rejects.toThrow(DomainException);
        await expect(handler.execute(command)).rejects.toMatchObject({
            code: DomainExceptionCode.BlogNotFound,
            message: `Blog with id ${blogId} not found`,
        });
        expect(blogsCommandRepository.SQLsaveUpdate).not.toHaveBeenCalled();
    });

    it('should successfully update blog and save it if blog exists', async () => {
        // Arrange
        const blogId = 'existing-blog-id';
        const dto = { name: 'Updated Name', description: 'Updated Desc', websiteUrl: 'https://updated.com' };
        const command = new UpdateBlogCommand(blogId, dto);

        // Создаем мок сущности блога со шпионом (jest.spyOn) на метод updateBlog
        const mockBlogEntity = {
            id: blogId,
            name: 'Old Name',
            description: 'Old Desc',
            websiteUrl: 'https://old.com',
            updateBlog: jest.fn(),
        } as unknown as SQLBlog;

        blogsCommandRepository.SQLfindBlogById.mockResolvedValue(mockBlogEntity);
        blogsCommandRepository.SQLsaveUpdate.mockResolvedValue(undefined);

        // Act
        await handler.execute(command);

        // Assert
        expect(blogsCommandRepository.SQLfindBlogById).toHaveBeenCalledWith(blogId);
        expect(mockBlogEntity.updateBlog).toHaveBeenCalledTimes(1);
        expect(mockBlogEntity.updateBlog).toHaveBeenCalledWith(dto);
        expect(blogsCommandRepository.SQLsaveUpdate).toHaveBeenCalledTimes(1);
        expect(blogsCommandRepository.SQLsaveUpdate).toHaveBeenCalledWith(mockBlogEntity);
    });
});