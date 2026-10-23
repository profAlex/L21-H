import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_sessions')
export class UserSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Реальная колонка в базе для Foreign Key
    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    // Связь назад к пользователю
    @ManyToOne(() => User, (user) => user.sessions, {
        onDelete: 'CASCADE' // Дублирует твой SQL on delete cascade
    })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'uuid' })
    device_uuid: string;

    @Column({ length: 255 })
    device_name: string;

    @Column({ length: 45 })
    device_ip: string;

    @Column({ type: 'timestamp with time zone' })
    issued_at: Date;

    @Column({ type: 'timestamp with time zone' })
    expires_at: Date;
}