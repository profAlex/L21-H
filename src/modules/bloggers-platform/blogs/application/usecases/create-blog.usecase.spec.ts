// create-blog.command-handler.spec.ts
import { Test, TestingModule } from '@nestjs/testing';

import { BlogsCommandRepository } from '../../infrastructure/blogs.command-repository';
import { CreateBlogCommand, CreateBlogCommandHandler } from './create-blog.usecase';

describe('CreateBlogCommandHandler', () => {
    let handler: CreateBlogCommandHandler;
    let blogsCommandRepository: jest.Mocked<BlogsCommandRepository>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateBlogCommandHandler,
                {
                    provide: BlogsCommandRepository,
                    useValue: {
                        SQLsaveCreate: jest.fn(),
                    },
                },
            ],
        }).compile();

        handler = module.get<CreateBlogCommandHandler>(CreateBlogCommandHandler);
        blogsCommandRepository = module.get(BlogsCommandRepository);
    });

    it('should successfully create a blog and return created blog id', async () => {
        // Arrange
        const command = new CreateBlogCommand({
            name: 'Test Blog',
            description: 'Test Description',
            websiteUrl: 'https://test-blog.com',
        });

        const expectedBlogId = 'generated-uuid-12345';
        blogsCommandRepository.SQLsaveCreate.mockResolvedValue(expectedBlogId);

        // Act
        const result = await handler.execute(command);

        // Assert
        expect(result).toBe(expectedBlogId);
        expect(blogsCommandRepository.SQLsaveCreate).toHaveBeenCalledTimes(1);

        // Проверяем, что в репозиторий передался экземпляр сущности SQLBlog с нужными полями
        expect(blogsCommandRepository.SQLsaveCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Test Blog',
                description: 'Test Description',
                websiteUrl: 'https://test-blog.com',
            }),
        );
    });
});