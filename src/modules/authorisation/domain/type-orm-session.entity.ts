import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../../user-accounts/domain/type-orm-user.entity';
import { BaseDBEntity } from '../../../core/postgres_db_entities/baseDBEntity';

@Entity('user_sessions')
export class UserSession extends BaseDBEntity {
    @Column({ type: 'uuid', name: 'user_id', nullable: false })
    userId: string;

    @Column({ type: 'uuid', name: 'device_uuid', nullable: false })
    deviceUuid: string;

    @Column({ type: 'varchar', length: 255, name: 'device_name', nullable: false })
    deviceName: string;

    @Column({ type: 'varchar', length: 45, name: 'device_ip', nullable: false })
    deviceIp: string;

    @Column({ type: 'timestamptz', name: 'issued_at', nullable: false })
    issuedAt: Date;

    @Column({ type: 'timestamptz', name: 'expires_at', nullable: false })
    expiresAt: Date;

    @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}