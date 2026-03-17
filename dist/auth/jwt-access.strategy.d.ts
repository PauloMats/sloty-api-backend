import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { Strategy } from 'passport-jwt';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
}
declare const JwtAccessStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtAccessStrategy extends JwtAccessStrategy_base {
    constructor(configService: ConfigService);
    validate(payload: JwtPayload): AuthenticatedUser;
}
export {};
