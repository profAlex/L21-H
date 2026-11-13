import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../../user-accounts/domain/type-orm-user.entity';
import { BaseDBEntity } from '../../../core/postgres_db_entities/baseDBEntity';

@Entity('user_sessions')
export class UserSession extends BaseDBEntity {
    @Column({ type: 'uuid', name: 'user_id', nullable: false })
    user_id: string;

    @Column({ type: 'uuid', name: 'device_uuid', nullable: false })
    device_uuid: string;

    @Column({ type: 'varchar', length: 255, name: 'device_name', nullable: false })
    device_name: string;

    @Column({ type: 'varchar', length: 45, name: 'device_ip', nullable: false })
    device_ip: string;

    @Column({ type: 'timestamptz', name: 'issued_at', nullable: false })
    issued_at: Date;

    @Column({ type: 'timestamptz', name: 'expires_at', nullable: false })
    expires_at: Date;

    @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}