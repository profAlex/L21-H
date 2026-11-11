import {
    CreateDateColumn,
    DeleteDateColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn,
} from 'typeorm';

export abstract class BaseDBEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn({ type: 'timestamptz', nullable: false })
    public createdAt: Date = new Date(Date.now());

    @UpdateDateColumn({ type: 'timestamptz', nullable: false })
    public updatedAt: Date = new Date(Date.now());

    @DeleteDateColumn({type: 'timestamptz' , nullable: true})
    public deletedAt: Date | null = null;

    @VersionColumn({ type: 'int' })
    public version: number = 1;
}