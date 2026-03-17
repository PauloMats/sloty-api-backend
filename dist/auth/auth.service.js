"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const argon2 = __importStar(require("argon2"));
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    configService;
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async registerClient(dto) {
        const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existingUser) {
            throw new common_1.ConflictException({
                code: 'EMAIL_ALREADY_IN_USE',
                message: 'Email is already registered.',
            });
        }
        const passwordHash = await argon2.hash(dto.password);
        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                passwordHash,
                role: client_1.UserRole.CLIENT,
            },
        });
        const tokens = await this.createSession(user.id, user.email, user.role);
        return {
            user: this.sanitizeUser(user),
            tokens,
        };
    }
    async registerBusiness(dto) {
        const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existingUser) {
            throw new common_1.ConflictException({
                code: 'EMAIL_ALREADY_IN_USE',
                message: 'Email is already registered.',
            });
        }
        const [user, business] = await this.prisma.$transaction(async (tx) => {
            const passwordHash = await argon2.hash(dto.password);
            const userRecord = await tx.user.create({
                data: {
                    name: dto.name,
                    email: dto.email,
                    phone: dto.phone,
                    passwordHash,
                    role: client_1.UserRole.OWNER,
                },
            });
            const businessRecord = await tx.business.create({
                data: {
                    ownerId: userRecord.id,
                    name: dto.business.name,
                    slug: dto.business.slug,
                    description: dto.business.description,
                    category: dto.business.category,
                    phone: dto.business.phone,
                    email: dto.business.email ?? dto.email,
                    addressLine1: dto.business.addressLine1,
                    addressLine2: dto.business.addressLine2,
                    city: dto.business.city,
                    state: dto.business.state,
                    zipCode: dto.business.zipCode,
                    country: dto.business.country,
                    latitude: dto.business.latitude,
                    longitude: dto.business.longitude,
                    timezone: dto.business.timezone,
                    status: dto.business.status,
                },
            });
            await tx.businessMember.create({
                data: {
                    businessId: businessRecord.id,
                    userId: userRecord.id,
                    role: client_1.UserRole.OWNER,
                },
            });
            return [userRecord, businessRecord];
        });
        const tokens = await this.createSession(user.id, user.email, user.role);
        return {
            user: this.sanitizeUser(user),
            business,
            tokens,
        };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException({
                code: 'INVALID_CREDENTIALS',
                message: 'Invalid email or password.',
            });
        }
        const validPassword = await argon2.verify(user.passwordHash, dto.password);
        if (!validPassword) {
            throw new common_1.UnauthorizedException({
                code: 'INVALID_CREDENTIALS',
                message: 'Invalid email or password.',
            });
        }
        const tokens = await this.createSession(user.id, user.email, user.role);
        return {
            user: this.sanitizeUser(user),
            tokens,
        };
    }
    async refresh(dto) {
        const payload = await this.verifyRefreshToken(dto.refreshToken);
        const storedToken = await this.prisma.refreshToken.findFirst({
            where: {
                userId: payload.sub,
                revokedAt: null,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!storedToken) {
            throw new common_1.UnauthorizedException({
                code: 'REFRESH_TOKEN_INVALID',
                message: 'Refresh token is invalid.',
            });
        }
        const validToken = await argon2.verify(storedToken.tokenHash, dto.refreshToken);
        if (!validToken) {
            throw new common_1.UnauthorizedException({
                code: 'REFRESH_TOKEN_INVALID',
                message: 'Refresh token is invalid.',
            });
        }
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: payload.sub },
        });
        await this.prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { revokedAt: new Date() },
        });
        const tokens = await this.createSession(user.id, user.email, user.role);
        return {
            user: this.sanitizeUser(user),
            tokens,
        };
    }
    async logout(dto) {
        const payload = await this.verifyRefreshToken(dto.refreshToken);
        const tokens = await this.prisma.refreshToken.findMany({
            where: {
                userId: payload.sub,
                revokedAt: null,
            },
        });
        const matchingToken = await this.findMatchingRefreshToken(tokens, dto.refreshToken);
        if (matchingToken) {
            await this.prisma.refreshToken.update({
                where: { id: matchingToken.id },
                data: { revokedAt: new Date() },
            });
        }
        return {
            success: true,
        };
    }
    async me(user) {
        const currentUser = await this.prisma.user.findUniqueOrThrow({
            where: { id: user.sub },
        });
        return this.sanitizeUser(currentUser);
    }
    async createSession(userId, email, role) {
        const payload = { sub: userId, email, role };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.getOrThrow('JWT_ACCESS_SECRET'),
                expiresIn: this.configService.getOrThrow('JWT_ACCESS_EXPIRES'),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.getOrThrow('JWT_REFRESH_EXPIRES'),
            }),
        ]);
        const decodedRefreshToken = this.jwtService.decode(refreshToken);
        if (!decodedRefreshToken?.exp) {
            throw new common_1.BadRequestException({
                code: 'REFRESH_TOKEN_ERROR',
                message: 'Could not create refresh token.',
            });
        }
        await this.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash: await argon2.hash(refreshToken),
                expiresAt: new Date(decodedRefreshToken.exp * 1000),
            },
        });
        return {
            accessToken,
            refreshToken,
        };
    }
    sanitizeUser(user) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
    async verifyRefreshToken(refreshToken) {
        try {
            return await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException({
                code: 'REFRESH_TOKEN_INVALID',
                message: 'Refresh token is invalid.',
            });
        }
    }
    async findMatchingRefreshToken(tokens, refreshToken) {
        for (const token of tokens) {
            if (await argon2.verify(token.tokenHash, refreshToken)) {
                return token;
            }
        }
        return null;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map