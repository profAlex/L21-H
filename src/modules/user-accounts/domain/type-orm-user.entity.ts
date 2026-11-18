import { Column, Entity, OneToMany } from 'typeorm';
import { BaseDBEntity } from '../../../core/postgres_db_entities/baseDBEntity';
import { UserSession } from '../../authorisation/domain/type-orm-session.entity';
import { SQLUser } from './sql-user.entitry';


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

    // Статический метод для перекладывания данных из доменной модели в TypeORM-сущность
    static fromDomain(domainUser: SQLUser): User {
        const userEntity = new User();

        userEntity.id = domainUser.id;
        userEntity.login = domainUser.login;
        userEntity.email = domainUser.email;
        userEntity.password_hash = domainUser.passwordHash;
        userEntity.is_email_confirmed = domainUser.isEmailConfirmed;

        // Мапим вложенные объекты домена в плоские колонки базы данных
        userEntity.email_confirmation_code = domainUser.emailConfirmationInfo.confirmationCode;
        userEntity.email_confirmation_expiration_date = domainUser.emailConfirmationInfo.expirationDate;

        userEntity.first_name = domainUser.name.firstName;
        userEntity.last_name = domainUser.name.lastName;

        userEntity.created_at = domainUser.createdAt;
        userEntity.updated_at = domainUser.updatedAt;
        userEntity.deleted_at = domainUser.deletedAt;

        userEntity.recovery_code = domainUser.recoveryCode;
        userEntity.recovery_code_expiration_date = domainUser.recoveryCodeExpirationDate;

        return userEntity;
    }

    toDomain(): SQLUser {
        return SQLUser.reconstruct({
            id: this.id,
            login: this.login,
            email: this.email,
            passwordHash: this.password_hash,
            isEmailConfirmed: this.is_email_confirmed,
            emailConfirmationCode: this.email_confirmation_code,
            emailConfirmationExpirationDate: this.email_confirmation_expiration_date,
            firstName: this.first_name,
            lastName: this.last_name,
            createdAt: this.created_at,
            updatedAt: this.updated_at,
            deletedAt: this.deleted_at,
            recoveryCode: this.recovery_code,
            recoveryCodeExpirationDate: this.recovery_code_expiration_date,
        });
    }
}