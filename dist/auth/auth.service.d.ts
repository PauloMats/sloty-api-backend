import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, LogoutDto, RefreshTokenDto, RegisterBusinessDto, RegisterClientDto } from './dto/auth.dto';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    registerClient(dto: RegisterClientDto): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    registerBusiness(dto: RegisterBusinessDto): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        business: {
            name: string;
            description: string | null;
            slug: string;
            category: string | null;
            phone: string | null;
            email: string | null;
            addressLine1: string | null;
            addressLine2: string | null;
            city: string | null;
            state: string | null;
            zipCode: string | null;
            country: string | null;
            latitude: number | null;
            longitude: number | null;
            timezone: string;
            status: import("@prisma/client").$Enums.BusinessStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            ownerId: string;
        };
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    refresh(dto: RefreshTokenDto): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    logout(dto: LogoutDto): Promise<{
        success: boolean;
    }>;
    me(user: AuthenticatedUser): Promise<{
        id: string;
        name: string;
        email: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    private createSession;
    private sanitizeUser;
    private verifyRefreshToken;
    private findMatchingRefreshToken;
}
