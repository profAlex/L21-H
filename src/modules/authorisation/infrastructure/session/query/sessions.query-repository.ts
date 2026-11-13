import { Injectable } from '@nestjs/common';
import { SessionParameters } from '../sessions.command-repository';
import { SQLDeviceViewDto } from '../../../../security/api/view-dto/device.view-dto';
import { DataSource } from 'typeorm';

@Injectable()
export class SessionsQueryRepository {
    constructor(
        private readonly dataSource: DataSource,
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

        const [sessionRaw] = await this.dataSource.query<{sessionId:string}[]>(query, [userId,
            deviceId,
            expiresAt,
            issuedAt]);

        if (!sessionRaw) {
            return null;
        }

        return sessionRaw.sessionId;
    }

    async SQLgetActiveSessionList(userId: string): Promise<SQLDeviceViewDto[]> {
        const query = `
            SELECT
                device_ip,
                device_name,
                issued_at,
                device_uuid
            FROM public."user_sessions"
            WHERE user_id = $1 AND deleted_at IS NULL;
        `;

        const resultRows = await this.dataSource.query<{
            device_ip: string;
            device_name: string;
            issued_at: Date | string;
            device_uuid: string;
        }[]>(query, [userId]);

        return resultRows.map((session) => SQLDeviceViewDto.mapToView(session));
    }
}
