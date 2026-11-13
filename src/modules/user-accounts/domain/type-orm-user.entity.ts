import { Column, Entity, OneToMany } from 'typeorm';
import { BaseDBEntity } from '../../../core/postgres_db_entities/baseDBEntity';
import { UserSession } from '../../authorisation/domain/type-orm-session.entity';


@Entity('users')
export class User extends BaseDBEntity {
    @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
    login: string;

    @Column({ type: 'varchar', length: 255, name: 'password_hash', nullable: false })
    password_hash: string;

    @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
    email: string;

    @Column({ type: 'varchar', length: 255, name: 'first_name', nullable: false })
    first_name: string;

    @Column({ type: 'varchar', length: 255, name: 'last_name', nullable: true })
    last_name: string | null = null;

    @Column({ type: 'boolean', default: false, name: 'is_email_confirmed', nullable: false })
    is_email_confirmed: boolean = false;

    @Column({ type: 'varchar', length: 255, name: 'email_confirmation_code', nullable: true })
    email_confirmation_code: string | null = null;

    @Column({ type: 'timestamptz', name: 'email_confirmation_expiration_date', nullable: true })
    email_confirmation_expiration_date: Date | null = null;

    @Column({ type: 'varchar', length: 255, name: 'recovery_code', nullable: true })
    recovery_code: string | null = null;

    @Column({ type: 'timestamptz', name: 'recovery_code_expiration_date', nullable: true })
    recovery_code_expiration_date: Date | null = null;

    @OneToMany(() => UserSession, (session) => session.user)
    sessions: UserSession[];
}