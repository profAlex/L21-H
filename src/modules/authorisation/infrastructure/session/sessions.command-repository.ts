import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { SQLUserSession } from '../../domain/sql-session.entity';
import { UserSession } from '../../domain/type-orm-session.entity';
import { User } from '../../../user-accounts/domain/type-orm-user.entity';

export type SessionParameters = {
    userId: string;
    deviceId: string;
    expiresAt: Date;
    issuedAt: Date;
};

type SoftDeleteSessionsParams = {
    userId: string;
    sessionId: string;
};

@Injectable()
export class SessionsCommandRepository {
    constructor(
        @InjectDataSource() protected dataSource: DataSource,
        @InjectRepository(UserSession)
        private readonly userSessionRepository: Repository<UserSession>,
    ) {}

    // async SQLsave(session: SQLUserSession): Promise<void> {
    //     const query = `
    //         INSERT INTO public."user_sessions" ("id",
    //                                             "user_id",
    //                                             "device_uuid",
    //                                             "device_name",
    //                                             "device_ip",
    //                                             "issued_at",
    //                                             "expires_at",
    //                                             "created_at",
    //                                             "deleted_at")
    //         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT ("id") DO
    //         UPDATE SET
    //             "issued_at" = EXCLUDED."issued_at",
    //             "expires_at" = EXCLUDED."expires_at",
    //             "deleted_at" = EXCLUDED."deleted_at";
    //     `;
    //
    //     const parameters = [
    //         session.id,
    //         session.userId,
    //         session.deviceId,
    //         session.deviceName,
    //         session.deviceIp,
    //         session.issuedAt,
    //         session.expiresAt,
    //         session.createdAt,
    //         session.deletedAt,
    //     ];
    //
    //     await this.dataSource.query(query, parameters);
    // }

    async SQLsave(sessionDomain: SQLUserSession): Promise<void> {
        // сначала простой класс сессии (доменная сущность) превращаем в TypeORM сущность (Db-модель)
        const sessionEntity = UserSession.fromDomain(sessionDomain);

        // сохраняем с помощью встроенного вспомогательного объекта TypeORM - Repository
        // save работает по принципу upsert: если id уже есть, обновит; если нет — создаст.
        await this.userSessionRepository.save(sessionEntity);

        // Может быть использовать repository.insert()?? если данный метод только создает новые объекты
    }

    async toTestCreateDb() {
        // // return this.dataSource.query(`CREATE DATABASE "Sprint17"
        // // WITH
        // // OWNER = neondb_owner
        // // ENCODING = 'UTF8'
        // // LOCALE_PROVIDER = 'builtin'
        // // CONNECTION LIMIT = -1
        // // IS_TEMPLATE = False;`);
        //
        // return this.dataSource.query(`CREATE TABLE IF NOT EXISTS "users" (
        //     "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        //     "login" VARCHAR(255) NOT NULL UNIQUE,
        //     "password_hash" VARCHAR(255) NOT NULL,
        //     "email" VARCHAR(255) NOT NULL UNIQUE,
        //     "first_name" VARCHAR(255) NOT NULL,
        //     "last_name" VARCHAR(255) NULL,
        //     "is_email_confirmed" BOOLEAN NOT NULL DEFAULT FALSE,
        //     "email_confirmation_code" VARCHAR(255) NULL,
        //     "email_confirmation_expiration_date" TIMESTAMPTZ NULL,
        //     "recovery_code" VARCHAR(255) NULL,
        //     "recovery_code_expiration_date" TIMESTAMPTZ NULL,
        //     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        //     "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        //     "deleted_at" TIMESTAMPTZ NULL
        // );
        //
        // -- Частичный уникальный индекс для recovery_code (чтобы NULL не считался дубликатом)
        // CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_recovery_code_unique"
        // ON "users" ("recovery_code")
        // WHERE "recovery_code" IS NOT NULL;
        //
        //
        // -- 2. Таблица сессий девайсов
        // CREATE TABLE IF NOT EXISTS "user_sessions" (
        //     "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        //     "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        //     "device_uuid" UUID NOT NULL,
        //     "device_name" VARCHAR(255) NOT NULL,
        //     "device_ip" VARCHAR(45) NOT NULL,
        //     "issued_at" TIMESTAMPTZ NOT NULL,
        //     "expires_at" TIMESTAMPTZ NOT NULL,
        //     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        //     "deleted_at" TIMESTAMPTZ NULL
        // );
        //
        // -- Индекс для быстрого поиска всех сессий конкретного юзера
        // CREATE INDEX IF NOT EXISTS "idx_user_sessions_user_id" ON "user_sessions" ("user_id");`);
    }

    // async SQLfindSessionBySessionId(
    //     sessionId: string,
    // ): Promise<SQLUserSession | null> {
    //     const query = `
    //         SELECT "id",
    //                "user_id",
    //                "device_uuid",
    //                "device_name",
    //                "device_ip",
    //                "issued_at",
    //                "expires_at",
    //                "created_at",
    //                "deleted_at"
    //         FROM public."user_sessions"
    //         WHERE "id" = $1
    //           AND "deleted_at" IS NULL;
    //     `;
    //
    //     const [sessionRow] = await this.dataSource.query(query, [sessionId]);
    //
    //     if (!sessionRow) {
    //         return null;
    //     }
    //
    //     return SQLUserSession.reconstructInstance(sessionRow);
    // }

    async SQLfindSessionBySessionId(
        sessionId: string,
    ): Promise<SQLUserSession | null> {
        const sessionEntity = await this.userSessionRepository.findOne({
            where: {
                id: sessionId,
                deleted_at: IsNull(), // проверяем, что сессия не удалена
            },
        });

        if (!sessionEntity) {
            return null;
        }

        // избегаем протекания информации о структуре бд в методы описывающие доменную сущность
        // путем переноса логики маппинга в нестатический метод вытащенной сущности TypeORM бд
        return sessionEntity.toDomain();
    }


    async SQLfindSessionByDeviceId(
        deviceId: string,
    ): Promise<SQLUserSession | null> {
        const query = `
            SELECT "id",
                   "user_id",
                   "device_uuid",
                   "device_name",
                   "device_ip",
                   "issued_at",
                   "expires_at",
                   "created_at",
                   "deleted_at"
            FROM public."user_sessions"
            WHERE "device_uuid" = $1
              AND "deleted_at" IS NULL;
        `;

        const [sessionRow] = await this.dataSource.query(query, [deviceId]);

        if (!sessionRow) {
            return null;
        }

        return SQLUserSession.reconstructInstance(sessionRow);
    }
}
