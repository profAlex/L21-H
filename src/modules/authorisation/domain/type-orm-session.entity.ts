import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../../user-accounts/domain/type-orm-user.entity';
import { BaseDBEntity } from '../../../core/postgres_db_entities/baseDBEntity';
import { SQLUserSession } from './sql-session.entity';

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

    // Статический метод для перекладывания данных из доменной модели в TypeORM-сущность
    static fromDomain(domainSession: SQLUserSession): UserSession {
        const sessionEntity = new UserSession();

        sessionEntity.id = domainSession.id;
        sessionEntity.user_id = domainSession.userId;
        sessionEntity.device_uuid = domainSession.deviceId;
        sessionEntity.device_name = domainSession.deviceName;
        sessionEntity.device_ip = domainSession.deviceIp;

        sessionEntity.issued_at = domainSession.issuedAt;
        sessionEntity.expires_at = domainSession.expiresAt;

        sessionEntity.created_at = domainSession.createdAt;
        sessionEntity.deleted_at = domainSession.deletedAt;

        return sessionEntity;
    }

    toDomain(): SQLUserSession {
        return SQLUserSession.reconstructInstance({
            id: this.id,
            userId: this.user_id,         // переводим snake_case в camelCase на границе
            deviceId: this.device_uuid,
            deviceName: this.device_name,
            deviceIp: this.device_ip,
            issuedAt: this.issued_at,
            expiresAt: this.expires_at,
            createdAt: this.created_at,
            deletedAt: this.deleted_at,
        });
    }
}