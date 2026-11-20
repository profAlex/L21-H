import { Injectable } from '@nestjs/common';
import { SessionParameters } from '../sessions.command-repository';
import { SQLDeviceViewDto } from '../../../../security/api/view-dto/device.view-dto';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../../../user-accounts/domain/type-orm-user.entity';
import { UserSession } from '../../../domain/type-orm-session.entity';

@Injectable()
export class SessionsQueryRepository {
    constructor(
        private readonly dataSource: DataSource,
        @InjectRepository(User)
        private readonly userSessionRepository: Repository<UserSession>,
    ) {}

    async SQLcheckIfSessionExists({
        userId,
        deviceId,
        expiresAt,
        issuedAt,
    }: SessionParameters): Promise<string | null> {
        // надежнее приводить Date к типу TIMESTAMPTZ? т.к. прямое сравнение через = может не совпасть на миллисекунды
        // всегда добавляйте LIMIT 1, без LIMIT 1 вернет весь массив совпадений, надежнее добавлять
        const query = `
            SELECT id AS "sessionId"
            FROM public."user_sessions"
            WHERE user_id = $1
              AND "device_uuid" = $2
              AND expires_at = $3::timestamptz
              AND issued_at = $4::timestamptz
              AND deleted_at IS NULL
            LIMIT 1;
        `;

        const [sessionRaw] = await this.dataSource.query<
            { sessionId: string }[]
        >(query, [userId, deviceId, expiresAt, issuedAt]);

        if (!sessionRaw) {
            return null;
        }

        return sessionRaw.sessionId;
    }

    // async SQLgetActiveSessionList(userId: string): Promise<SQLDeviceViewDto[]> {
    //     const query = `
    //         SELECT
    //             device_ip,
    //             device_name,
    //             issued_at,
    //             device_uuid
    //         FROM public."user_sessions"
    //         WHERE user_id = $1 AND deleted_at IS NULL;
    //     `;
    //
    //     const resultRows = await this.dataSource.query<{
    //         device_ip: string;
    //         device_name: string;
    //         issued_at: Date | string;
    //         device_uuid: string;
    //     }[]>(query, [userId]);
    //
    //     return resultRows.map((session) => SQLDeviceViewDto.mapToView(session));
    // }

    async SQLgetActiveSessionList(userId: string): Promise<SQLDeviceViewDto[]> {

        const queryBuilder = this.userSessionRepository.createQueryBuilder('us');

        queryBuilder.where('us.deleted_at IS NULL');
        queryBuilder.andWhere('us.user_id = :passedUserId', {
            passedUserId: userId,
        });

        queryBuilder.select([
            'us.device_ip AS "device_ip"',
            'us.device_name AS "device_name"',
            'us.issued_at AS "issued_at"',
            'us.device_uuid AS "device_uuid"',
        ]);

        const resultRows = await queryBuilder.getRawMany<{
            device_ip: string;
            device_name: string;
            issued_at: Date | string;
            device_uuid: string;
        }>();

        return resultRows.map((session) => SQLDeviceViewDto.mapToView(session));
    }
}
