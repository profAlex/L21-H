import { Injectable } from '@nestjs/common';
import { SQLPost } from '../domain/sql-post.entitry';
import { DataSource } from 'typeorm';
import { PostQueryRawDto } from './query/posts.query-repository';
import { CounterDirection } from '../../likes/infrastructure/comment-likes.command-repository';


@Injectable()
export class PostsCommandRepository {
    constructor(
        private readonly dataSource: DataSource,
    ) {}


    async SQLsave(post: SQLPost): Promise<void> {
        const query = `
            INSERT INTO public.posts (id,
                                      title,
                                      short_description,
                                      content,
                                      blog_id,
                                      likes_count,
                                      dislikes_count,
                                      created_at,
                                      updated_at,
                                      deleted_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (id) DO UPDATE SET title             = EXCLUDED.title,
                                           short_description = EXCLUDED.short_description,
                                           content           = EXCLUDED.content,
                                           blog_id           = EXCLUDED.blog_id,
                                           likes_count       = EXCLUDED.likes_count,
                                           dislikes_count    = EXCLUDED.dislikes_count,
                                           updated_at        = EXCLUDED.updated_at,
                                           deleted_at        = EXCLUDED.deleted_at;
        `;

        await this.dataSource.query(query, [
            post.id,
            post.title,
            post.shortDescription,
            post.content,
            post.blogId,
            post.likesCount,
            post.dislikesCount,
            post.createdAt,
            post.updatedAt,
            post.deletedAt,
        ]);
    }


    async SQLsaveCreate(post: Omit<SQLPost, 'id'>): Promise<string> {
        const query = `
            INSERT INTO public.posts (
                title,
                short_description,
                content,
                blog_id,
                likes_count,
                dislikes_count,
                created_at,
                updated_at,
                deleted_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id;
        `;

        const queryParams = [
            post.title,
            post.shortDescription,
            post.content,
            post.blogId,
            post.likesCount ?? 0,
            post.dislikesCount ?? 0,
            post.createdAt ? new Date(post.createdAt) : new Date(),
            post.updatedAt ? new Date(post.updatedAt) : new Date(),
            post.deletedAt ? new Date(post.deletedAt) : null, // Защита от undefined
        ];

        const result = await this.dataSource.query(query, queryParams);
        return result[0].id;
    }


    async SQLsaveUpdate(post: SQLPost): Promise<void> {
        const query = `
            UPDATE public.posts
            SET title = $2,
                short_description = $3,
                content = $4,
                likes_count = $5,
                dislikes_count = $6,
                updated_at = $7,
                deleted_at = $8
            WHERE id = $1;
        `;

        const queryParams = [
            post.id,
            post.title,
            post.shortDescription,
            post.content,
            post.likesCount ?? 0,
            post.dislikesCount ?? 0,
            post.updatedAt ? new Date(post.updatedAt) : new Date(),
            post.deletedAt ? new Date(post.deletedAt) : null, // Защита от undefined
        ];

        await this.dataSource.query(query, queryParams);
    }


    async SQLfindSinglePostById({postId, blogId}:{ postId: string, blogId: string}): Promise<SQLPost | null> {

        const findQuery = `
            SELECT 
                    p.id,
                    p.title,
                    p.short_description,
                    p.content,
                    p.blog_id,
                    p.likes_count,
                    p.dislikes_count,
                    p.created_at,
                    p.updated_at,
                    p.deleted_at
            FROM public.posts p
            JOIN public.blogs b ON p.blog_id = b.id
            WHERE p.id = $1 AND p.blog_id = $2 AND b.deleted_at IS NULL AND p.deleted_at IS NULL
            LIMIT 1;
        `;

        const [resultRow] = await this.dataSource.query<PostQueryRawDto[]>(findQuery, [postId, blogId]);

        if (!resultRow) {
            return null;
        }

        return SQLPost.reconstructInstance(resultRow);
    }

    async SQLifPostExists(postId: string): Promise<boolean> {
        const query = `
            SELECT EXISTS (SELECT 1
                           FROM posts p
                                    INNER JOIN blogs b ON (p.blog_id = b.id)

                           WHERE p.id = $1
                             AND p.deleted_at IS NULL
                             AND b.deleted_at IS NULL) AS "exists";
        `;

        const [queryRow] = await this.dataSource.query<{ exists: boolean }[]>(
            query,
            [postId],
        );

        // console.warn('<-- queryRow?.exists inside postgers value is: ', queryRow?.exists);


        return queryRow?.exists ?? false; // на случай если queryRow вернется как undefined по каким-то причинам
    }


    async SQLchangePostLikesCounter(
        postId: string,
        direction: CounterDirection,
    ): Promise<void> {
        const query = `
            UPDATE public.posts
            SET likes_count = GREATEST(0, likes_count + $2)
            WHERE id = $1
              AND deleted_at IS NULL;
        `;

        await this.dataSource.query(query, [postId, direction]);
    }


    async SQLchangePostDislikesCounter(
        postId: string,
        direction: CounterDirection,
    ): Promise<void> {
        const query = `
            UPDATE public.posts
            SET dislikes_count = GREATEST(0, dislikes_count + $2)
            WHERE id = $1
              AND deleted_at IS NULL;
        `;

        await this.dataSource.query(query, [postId, direction]);
    }


    async SQLswitchToLikePostCounter(postId: string): Promise<void> {
        const query = `
            UPDATE public.posts
            SET dislikes_count = GREATEST(0, dislikes_count - 1),
                likes_count    = GREATEST(0, likes_count + 1)
            WHERE id = $1
              AND deleted_at IS NULL;
        `;

        await this.dataSource.query(query, [postId]);
    }


    async SQLswitchToDislikePostCounter(postId: string): Promise<void> {
        const query = `
            UPDATE public.posts
            SET likes_count    = GREATEST(0, likes_count - 1),
                dislikes_count = GREATEST(0, dislikes_count + 1)
            WHERE id = $1
              AND deleted_at IS NULL;
        `;

        await this.dataSource.query(query, [postId]);
    }
}
