import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LikeStatus } from '../../../../core/enums/like-status.enum';
import { DataSource } from 'typeorm';

function isLikeStatus(val: any): val is LikeStatus {
    return Object.values(LikeStatus).includes(val);
}

@Injectable()
export class PostLikesCommandRepository {
    constructor(
        private readonly dataSource: DataSource,
    ) {}

    async SQLgetLikeByPostIdAndUserId(
        postId: string,
        userId: string,
    ): Promise<LikeStatus | null> {
        const query = `
            SELECT pl.status AS "status"
            FROM post_likes pl
                     INNER JOIN posts p ON p.id = pl.post_id
                     INNER JOIN blogs b ON b.id = p.blog_id
            WHERE pl.post_id = $1
              AND pl.user_id = $2
              AND p.deleted_at IS NULL
              AND b.deleted_at IS NULL
            LIMIT 1;
        `;

        const [result] = await this.dataSource.query<{ status: string }[]>(query, [
            postId,
            userId,
        ]);

        console.warn('<-- postLikeStatus.status value is: ', result?.status);

        if (!result || !isLikeStatus(result.status)) {
            return null;
        }

        return result.status;
    }


    async SQLupdateLikeStatus(
        postId: string,
        userId: string,
        status: LikeStatus,
    ): Promise<void> {
        const query = `
            INSERT INTO post_likes (post_id, user_id, status)
            VALUES ($1, $2, $3)
            ON CONFLICT (post_id,
                user_id) DO UPDATE SET /*comment_id = EXCLUDED.comment_id,
                                       user_id    = EXCLUDED.user_id,*/
                status = EXCLUDED.status,
                added_at = NOW();
        `;

        const queryParams = [postId, userId, status];

        await this.dataSource.query(query, queryParams);
    }
}
