import { LikeStatus } from '../../../../../core/enums/like-status.enum';
import { SQLcommentQueryRawDto } from '../../infrastructure/query/comments.query-repository';


// вспомогательная функция для конвертации значения в тип enum LikeStatus
function isLikeStatus(value: any): value is LikeStatus {
    return Object.values(LikeStatus).includes(value);
}


export class SQLCommentViewDto {
    id: string;
    content: string;
    commentatorInfo: {
        userId: string;
        userLogin: string;
    };
    createdAt: string;
    likesInfo: {
        likesCount: number;
        dislikesCount: number;
        myStatus: LikeStatus;
    };

    static mapSQLRowToView(
        raw: SQLcommentQueryRawDto
    ): SQLCommentViewDto {
        const dto = new SQLCommentViewDto();

        dto.id = raw.id;
        dto.content = raw.content;
        dto.commentatorInfo = {
            userId: raw.userId,
            userLogin: raw.userLogin ?? 'Unknown User',
        };

        // пытаемся сформировать дату из пришедшего значения string или Date
        const parsedDate = new Date(raw.createdAt);

        // если полученное значение .getTime() это не number то это несогласованное состояние данных, по хорошему это надо править
        if (isNaN(parsedDate.getTime())) {
            throw new Error(`Data integrity issue: Invalid createdAt timestamp for comment ${raw.id}`);
        }

        dto.createdAt = parsedDate.toISOString();
        dto.likesInfo = {
            likesCount: Number(raw.likesCount ?? 0),
            dislikesCount: Number(raw.dislikesCount ?? 0),
            myStatus: isLikeStatus(raw.myStatus)
                ? raw.myStatus
                : LikeStatus.None
        };

        return dto;
    }
}