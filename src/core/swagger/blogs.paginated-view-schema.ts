import { PaginatedViewDto } from '../dto/base.paginated.view-dto';
import { SQLBlogViewDto } from '../../modules/bloggers-platform/blogs/api/view-dto/blogs.view-dto';
import { ApiProperty } from '@nestjs/swagger';

export class SwaggerBlogsPaginatedViewDto extends PaginatedViewDto<SQLBlogViewDto> {
    @ApiProperty({ type: [SQLBlogViewDto], description: 'Список блогов' })
    items!: SQLBlogViewDto[];
}
