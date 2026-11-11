import { BaseDBEntity } from '../../../../core/postgres_db_entities/baseDBEntity';
import { Column, Entity, JoinColumn, OneToMany } from 'typeorm';
import { Post } from '../../posts/domain/type-orm-post.entity';

@Entity('blogs')
export class Blog extends BaseDBEntity {
    @Column({ type: 'varchar', length: 256, nullable: false })
    name: string | null = null;

    @Column({ type: 'text', nullable: false })
    description: string | null = null;

    @Column({ type: 'varchar', length: 512, nullable: false })
    website_url: string | null = null;

    @Column({ type: 'boolean', default: false, nullable: false })
    is_membership: boolean = false;

    @OneToMany(() => Post, post => post.blog)
    posts: Post[];
}

// -- auto-generated definition
// create table blogs
// (
//     id            uuid                     default gen_random_uuid() not null
// primary key,
//     name          varchar(256)                                       not null,
//     description   text                                               not null,
//     website_url   varchar(512)                                       not null,
//     is_membership boolean                  default false             not null,
//     created_at    timestamp with time zone default now()             not null,
//     updated_at    timestamp with time zone default now()             not null,
//     deleted_at    timestamp with time zone
// );
//
// alter table blogs
// owner to neondb_owner;
//
// create index idx_blogs_deleted_at
// on blogs (deleted_at)
// where (deleted_at IS NULL);