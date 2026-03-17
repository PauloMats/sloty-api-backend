import { UserRole } from '@prisma/client';
import { CreateBusinessDto } from '../../businesses/dto/business.dto';
export declare class RegisterClientDto {
    name: string;
    email: string;
    password: string;
    phone?: string;
}
export declare class RegisterBusinessDto extends RegisterClientDto {
    business: CreateBusinessDto;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class LogoutDto {
    refreshToken: string;
}
export declare class AuthTokensDto {
    accessToken: string;
    refreshToken: string;
}
export declare class AuthUserResponseDto {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: UserRole;
}
export declare class AuthResponseDto {
    user: AuthUserResponseDto;
    tokens: AuthTokensDto;
    business?: Record<string, unknown>;
}
