export type CreateSessionDomainPayload = {
    userId: string;
    deviceName: string;
    deviceIp: string;
    deviceId: string;
    issuedAt: Date;
    expiresAt: Date;
}