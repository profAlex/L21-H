import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Blog } from '../../blogs/domain/type-orm-blog.entity';
import { BaseDBEntity } from '../../../../core/postgres_db_entities/baseDBEntity';

@Entity('posts')
export class Post extends BaseDBEntity {
    @Column({ type: 'uuid', nullable: false })
    blog_id: string;

    @Column({ type: 'varchar', length: 512, nullable: false })
    title: string;

    @Column({ type: 'varchar', length: 1024, nullable: false })
    short_description: string;

    @Column({ type: 'text', nullable: false })
    content: string;

    @Column({ type: 'int', default: 0, nullable: false })
    likes_count: number = 0;

    @Column({ type: 'int', default: 0, nullable: false })
    dislikes_count: number = 0;

    @ManyToOne(() => Blog, (blog) => blog.posts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'blog_id' })
    blog: Blog;
}

// -- auto-generated definition
// create table posts
// (
//     id                uuid                     default gen_random_uuid() not null
// primary key,
//     blog_id           uuid                                               not null
// constraint fk_posts_blog
// references blogs
// on delete cascade,
//     title             varchar(512)                                       not null,
//     short_description varchar(1024)                                      not null,
//     content           text                                               not null,
//     likes_count       integer                  default 0                 not null,
//     dislikes_count    integer                  default 0                 not null,
//     created_at        timestamp with time zone default now()             not null,
//     updated_at        timestamp with time zone default now()             not null,
//     deleted_at        timestamp with time zone
// );