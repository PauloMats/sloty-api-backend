import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import {
  LoginDto,
  LogoutDto,
  RefreshTokenDto,
  RegisterBusinessDto,
  RegisterClientDto,
} from './dto/auth.dto';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async registerClient(dto: RegisterClientDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      throw new ConflictException({
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
        role: UserRole.CLIENT,
      },
    });

    const tokens = await this.createSession(user.id, user.email, user.role);
    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async registerBusiness(dto: RegisterBusinessDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      throw new ConflictException({
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
          role: UserRole.OWNER,
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
          role: UserRole.OWNER,
        },
      });

      return [userRecord, businessRecord] as const;
    });

    const tokens = await this.createSession(user.id, user.email, user.role);
    return {
      user: this.sanitizeUser(user),
      business,
      tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    const validPassword = await argon2.verify(user.passwordHash, dto.password);
    if (!validPassword) {
      throw new UnauthorizedException({
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

  async refresh(dto: RefreshTokenDto) {
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
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_INVALID',
        message: 'Refresh token is invalid.',
      });
    }

    const validToken = await argon2.verify(storedToken.tokenHash, dto.refreshToken);
    if (!validToken) {
      throw new UnauthorizedException({
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

  async logout(dto: LogoutDto) {
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

  async me(user: AuthenticatedUser) {
    const currentUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.sub },
    });

    return this.sanitizeUser(currentUser);
  }

  private async createSession(userId: string, email: string, role: UserRole) {
    const payload = { sub: userId, email, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES') as never,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES') as never,
      }),
    ]);

    const decodedRefreshToken = this.jwtService.decode(refreshToken) as { exp?: number } | null;
    if (!decodedRefreshToken?.exp) {
      throw new BadRequestException({
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

  private sanitizeUser<T extends Prisma.UserGetPayload<Record<string, never>>>(user: T) {
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

  private async verifyRefreshToken(refreshToken: string) {
    try {
      return await this.jwtService.verifyAsync<{ sub: string; email: string; role: UserRole }>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_INVALID',
        message: 'Refresh token is invalid.',
      });
    }
  }

  private async findMatchingRefreshToken(
    tokens: { id: string; tokenHash: string }[],
    refreshToken: string,
  ) {
    for (const token of tokens) {
      if (await argon2.verify(token.tokenHash, refreshToken)) {
        return token;
      }
    }

    return null;
  }
}
