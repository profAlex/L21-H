import {
    CreateDateColumn,
    DeleteDateColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn,
} from 'typeorm';

export abstract class BaseDBEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn({ type: 'timestamptz', nullable: true })
    public createdAt: Date | null = null;

    @UpdateDateColumn({ type: 'timestamptz', nullable: true })
    public updatedAt: Date | null = null;

    @DeleteDateColumn({type: 'timestamptz' , nullable: true})
    public deletedAt: Date | null = null;

    @VersionColumn({ type: 'int' })
    public version: number = 1;
}