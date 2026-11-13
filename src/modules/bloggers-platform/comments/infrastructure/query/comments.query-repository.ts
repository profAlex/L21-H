
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
    SQLCommentViewDto,
} from '../../api/view-dto/comments.view-dto';
import { GetCommentsQueryParams } from '../../api/input-dto/get-comments-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { SortDirection } from '../../../../../core/dto/base.query-params.input-dto';
import { FlattenMaps, Types } from 'mongoose';
import { LikeStatus } from '../../../../../core/enums/like-status.enum';
import { CommentLikesQueryRepository } from '../../../likes/infrastructure/query/comment-likes.query-repository';
import { DataSource } from 'typeorm';


export interface SQLcommentQueryRawDto {
    id: string;
    content: string;
    userId: string;
    userLogin: string | null; // Защищает от NULL
    createdAt: Date | string; // Защищает от объекта Date
    likesCount: number | string; // Защищает от строк из COUNT()
    dislikesCount: number | string; // Защищает от строк из COUNT()
    myStatus: string;
}

@Injectable()
export class CommentsQueryRepository {
    constructor(
        private readonly commentLikesQueryRepository: CommentLikesQueryRepository,
        private readonly dataSource: DataSource,
    ) {}


    async SQLgetCommentById(
        commentId: string,
        userId?: string | undefined,
    ): Promise<SQLCommentViewDto | null> {
        // {
        //     "id": "string",
        //     "content": "string",
        //     "commentatorInfo": {
        //         "userId": "string",
        //         "userLogin": "string"
        //     },
        //     "createdAt": "2026-09-25T19:08:52.356Z",
        //     "likesInfo": {
        //         "likesCount": 0,
        //         "dislikesCount": 0,
        //         "myStatus": "None"
        //     }
        // }

        const commentInfoQuery = `
            SELECT c.id,
                   c.content,
                   c.user_id                  AS "userId",
                   u.login                    AS "userLogin",
                   c.created_at               AS "createdAt",
                   c.likes_count              AS "likesCount",
                   c.dislikes_count           AS "dislikesCount",
                   COALESCE(l.status, 'None') AS "myStatus"
            FROM public.comments c
                     -- Пользователя и лайки соединяем через LEFT JOIN (юзер может быть удален, а лайка может не быть)
                     LEFT JOIN public.users u ON c.user_id = u.id AND u.deleted_at IS NULL
                     LEFT JOIN public.comment_likes l ON c.id = l.comment_id AND l.user_id = $1

                -- Пост и Блог проверяем строго через INNER JOIN 
                     INNER JOIN public.posts p ON c.post_id = p.id
                     INNER JOIN public.blogs b ON p.blog_id = b.id
            WHERE c.id = $2
              -- Вся цепочка родительских объектов должна быть не удалена, чтобы гарантировать lazy cascade soft deletion
              AND c.deleted_at IS NULL
              AND p.deleted_at IS NULL
              AND b.deleted_at IS NULL;
        `;

        const [commentRow] = await this.dataSource.query<
            SQLcommentQueryRawDto[]
        >(commentInfoQuery, [userId ?? null, commentId]);

        if (!commentRow) {
            return null;
        }

        return SQLCommentViewDto.mapSQLRowToView(commentRow);
    }

    async SQLgetCommentsByPostId({
        postId,
        query,
        userId,
    }: {
        postId: string;
        query: GetCommentsQueryParams;
        userId?: string | undefined;
    }): Promise<PaginatedViewDto<SQLCommentViewDto>> {
        // ITEMS VIEW STRUCTURE
        /*
        {
            "pagesCount": 0,
            "page": 0,
            "pageSize": 0,
            "totalCount": 0,
            "items": [
                {
                    "id": "string",
                    "content": "string",
                    "commentatorInfo": {
                        "userId": "string",
                        "userLogin": "string"
                    },
                    "createdAt": "2026-10-01T20:37:02.725Z",
                    "likesInfo": {
                        "likesCount": 0,
                        "dislikesCount": 0,
                        "myStatus": "None"
                    }
                }
            ]
        }
        */

        const { sortBy, sortDirection, pageNumber, pageSize } = query;

        const sortingMap: Record<string, string> = {
            id: 'c.id',
            content: 'c.content',
            createdAt: 'c.created_at',
        };

        const sortingClause = sortingMap[sortBy] || 'c.created_at';
        const directionClause =
            sortDirection?.trim().toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const limit = pageSize;
        const offset = query.calculateSkip();

        const commentInfoQuery = `
            SELECT c.id,
                   c.content,
                   c.user_id                   AS "userId",
                   u.login                     AS "userLogin",
                   c.created_at                AS "createdAt",
                   c.likes_count               AS "likesCount",
                   c.dislikes_count            AS "dislikesCount",
                   COALESCE(cl.status, 'None') AS "myStatus"
            FROM comments c
                     LEFT JOIN users u ON u.id = c.user_id
                     LEFT JOIN comment_likes cl ON c.id = cl.comment_id AND cl.user_id = $1
                     INNER JOIN public.posts p ON p.id = c.post_id
                     INNER JOIN public.blogs b ON b.id = p.blog_id
            WHERE c.post_id = $2
              AND c.deleted_at IS NULL
              AND p.deleted_at IS NULL
              AND b.deleted_at IS NULL
            ORDER BY ${sortingClause} ${directionClause}
            LIMIT $3 OFFSET $4;
        `;

        const countQuery = `
            SELECT COUNT(*)::int AS "totalCount"
            FROM public.comments c
                 INNER JOIN public.posts p ON p.id = c.post_id
                 INNER JOIN public.blogs b ON b.id = p.blog_id
            WHERE c.deleted_at IS NULL
              AND p.deleted_at IS NULL
              AND b.deleted_at IS NULL
              AND c.post_id = $1;
        `;

        const [commentRows, countResult] = await Promise.all([
            this.dataSource.query<SQLcommentQueryRawDto[]>(commentInfoQuery, [
                userId ?? null,
                postId,
                limit,
                offset,
            ]),
            this.dataSource.query<{ totalCount: number }[]>(countQuery, [
                postId,
            ]),
        ]);

        const totalCount = countResult[0]?.totalCount ?? 0;

        // сразу возвращаем пустой результат и не делаем 2-й запрос если постов нет
        if (!commentRows.length) {
            return PaginatedViewDto.mapToView<SQLCommentViewDto>({
                items: [],
                page: pageNumber,
                size: pageSize,
                totalCount: totalCount,
            });
        }

        return PaginatedViewDto.mapToView<SQLCommentViewDto>({
            items: commentRows.map((comment) =>
                SQLCommentViewDto.mapSQLRowToView(comment),
            ),
            page: pageNumber,
            size: pageSize,
            totalCount: totalCount,
        });
    }
}
