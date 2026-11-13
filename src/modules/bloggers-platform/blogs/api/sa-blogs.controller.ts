import { BlogsQueryRepository } from '../infrastructure/query/blogs.query-repository';
import { ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetBlogsQueryParams } from './input-dto/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { SQLBlogViewDto } from './view-dto/blogs.view-dto';
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { BasicAuthGuard } from '../../../authorisation/guards/basic/basic.auth-guard';
import { GetPostsQueryParams } from '../../posts/api/input-dto/get-posts-query-params.input-dto';
import { ExtractUserIfExistsFromRequest } from '../../../authorisation/decorators/extract-user-if-exists.decorator';
import { UserAccessTokenContextDto } from '../../../authorisation/guards/dto/user-access-token-context.dto';
import { SQLPostViewDto } from '../../posts/api/view-dto/posts.view-dto';
import { GetPostsByBlogIdQuery } from '../application/usecases/get-posts-by-blog-id.usecase';
import { CreateBlogInputDto } from './input-dto/blogs.input-dto';
import { GetBlogByIdQuery } from '../application/usecases/get-blog-by-id.usecase';
import { CreateBlogCommand } from '../application/usecases/create-blog.usecase';
import { CreateBlogPostInputDto } from './input-dto/create-blog-post.input-dto';
import { GetPostById } from '../../posts/application/usecases/get-post-by-id.usecase';
import { CreatePostForBlogCommand } from '../application/usecases/create-post.usecase';
import { UpdateBlogInputDto } from '../dto/create-blog.dto';
import { UpdateBlogCommand, UpdateBlogHandler } from '../application/usecases/update-blog-by-id.usecase';
import { SQLUpdatePostInputDto, UpdatePostInputDto } from '../../posts/dto/create-post-input.dto';
import {
    UpdatePostByBlogIdPostIdCommand,
} from '../application/usecases/update-post-by-blog-id-post-id.usecase';
import { DeleteBlogByIdCommand } from '../application/usecases/delete-blog-by-id.usecase';
import { DeletePostByBlogIdPostIdCommand } from '../application/usecases/delete-post-by-blog-id-post-id.usecase';

@ApiTags('SA Blogs endpoint')
@Controller('sa/blogs')
export class SaBlogsController {
    constructor(
        private blogsQueryRepository: BlogsQueryRepository,
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {
        console.log('SuperAdmin BlogsController created');
    }

    // Returns blogs with paging
    @UseGuards(BasicAuthGuard)
    @Get()
    @HttpCode(HttpStatus.OK)
    async getALlBlogs(
        @Query() query: GetBlogsQueryParams,
    ): Promise<PaginatedViewDto<SQLBlogViewDto>> {
        // тут все-таки не делать USEcase?
        // Query (Запросы) — только читают данные (SELECT). Их НЕ оборачивают в Use Cases,
        // а вызывают напрямую через Query Repository из контроллера.

        return this.blogsQueryRepository.SQLgetAllBlogs(query);
    }


    // Create new blog
    @UseGuards(BasicAuthGuard)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createNewBlog(
        @Body() body: CreateBlogInputDto,
    ): Promise<SQLBlogViewDto> {
        const blogId = await this.commandBus.execute<string>(
            new CreateBlogCommand(body),
        );

        // console.log("blogId received:", blogId);

        return this.queryBus.execute<SQLBlogViewDto>(
            new GetBlogByIdQuery(blogId),
        );
    }


    // Update existing Blog by id with InputModel
    @UseGuards(BasicAuthGuard)
    @Put(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updateBlogById(
        @Param('id') id: string,
        @Body() body: UpdateBlogInputDto,
    ): Promise<void> {
        return this.commandBus.execute<void>(
            new UpdateBlogCommand(id, body)
        );
    }


    // Delete blog specified by id
    @UseGuards(BasicAuthGuard)
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteBlogById(@Param('id') id: string): Promise<void> {
        // return this.blogsService.deleteBlogById(id);
        return this.commandBus.execute<void>(
            new DeleteBlogByIdCommand(id)
        );
    }


    // Create new post for specific blog
    @UseGuards(BasicAuthGuard)
    @Post(':blogId/posts')
    @HttpCode(HttpStatus.CREATED)
    async createPostByBlogId(
        @Param('blogId') blogId: string,
        @Body() body: CreateBlogPostInputDto,
    ): Promise<SQLPostViewDto> {
        // создаем пост получаем его ID
        const postId = await this.commandBus.execute<string>(
            new CreatePostForBlogCommand(blogId, body),
        );

        // вызываем query-хэндлер для получения готового SQLPostViewDto
        return this.queryBus.execute<SQLPostViewDto>(
            new GetPostById(postId, undefined),
        );
    }


    // Returns all posts for specified blog
    @UseGuards(BasicAuthGuard)
    @Get(':blogId/posts')
    @HttpCode(HttpStatus.OK)
    async getPostsByBlogId(
        @Param('blogId') blogId: string,
        @Query() query: GetPostsQueryParams,
        @ExtractUserIfExistsFromRequest() user: UserAccessTokenContextDto,
    ): Promise<PaginatedViewDto<SQLPostViewDto>> {
        return this.queryBus.execute<PaginatedViewDto<SQLPostViewDto>>(
            new GetPostsByBlogIdQuery(blogId, query, user?.userId),
        );
    }


    // Update existing post by user id and blog id with SQLUpdatePostInputDto
    @UseGuards(BasicAuthGuard)
    @Put(':blogId/posts/:postId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updatePostByBlogIdAndPostId(
        @Param('blogId') blogId: string,
        @Param('postId') postId: string,
        @Body() body: SQLUpdatePostInputDto,
    ): Promise<void> {
        return this.commandBus.execute<void>(
            new UpdatePostByBlogIdPostIdCommand(blogId, postId, body),
        );
    }


    // Delete post specified by user id and blog id
    @UseGuards(BasicAuthGuard)
    @Delete(':blogId/posts/:postId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deletePostByBlogIdAndPostId(
        @Param('blogId') blogId: string,
        @Param('postId') postId: string,
    ): Promise<void> {
        return this.commandBus.execute<void>(
            new DeletePostByBlogIdPostIdCommand(blogId, postId),
        );
    }
}
