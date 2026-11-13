import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentApiInputDto {
    // @ApiProperty()
    // relatedPostId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MaxLength(300)
    @MinLength(20)
    content: string = '';

    // @ApiProperty()
    // commentatorInfo: CommentatorInfo;
}
