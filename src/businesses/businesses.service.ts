import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BusinessStatus, Prisma, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto, UpdateBusinessDto } from './dto/business.dto';

@Injectable()
export class BusinessesService {
  constructor(private readonly prisma: PrismaService) {}

  create(user: AuthenticatedUser, dto: CreateBusinessDto) {
    if (user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException({
        code: 'BUSINESS_CREATE_FORBIDDEN',
        message: 'Only owners and admins can create businesses.',
      });
    }

    return this.prisma.business.create({
      data: {
        ...dto,
        ownerId: user.sub,
      },
    });
  }

  async getMyBusiness(user: AuthenticatedUser) {
    const business = await this.findFirstAccessibleBusiness(user);
    if (!business) {
      throw new NotFoundException({
        code: 'BUSINESS_NOT_FOUND',
        message: 'No business found for current user.',
      });
    }

    return business;
  }

  async updateMyBusiness(user: AuthenticatedUser, dto: UpdateBusinessDto) {
    const business = await this.getMyBusiness(user);
    await this.assertCanManageBusiness(user, business.id);
    return this.prisma.business.update({
      where: { id: business.id },
      data: dto,
    });
  }

  list() {
    return this.prisma.business.findMany({
      where: {
        status: BusinessStatus.ACTIVE,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  getById(businessId: string) {
    return this.prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      include: {
        services: {
          where: { isActive: true },
        },
      },
    });
  }

  getPublicById(businessId: string) {
    return this.prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        category: true,
        phone: true,
        email: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        timezone: true,
        status: true,
        services: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async assertCanManageBusiness(user: AuthenticatedUser, businessId: string) {
    if (user.role === UserRole.ADMIN) {
      return;
    }

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });

    if (!business) {
      throw new NotFoundException({
        code: 'BUSINESS_NOT_FOUND',
        message: 'Business not found.',
      });
    }

    if (business.ownerId === user.sub) {
      return;
    }

    const membership = await this.prisma.businessMember.findFirst({
      where: {
        businessId,
        userId: user.sub,
        isActive: true,
        role: {
          in: [UserRole.OWNER, UserRole.STAFF],
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException({
        code: 'BUSINESS_ACCESS_FORBIDDEN',
        message: 'You do not have access to manage this business.',
      });
    }
  }

  private async findFirstAccessibleBusiness(user: AuthenticatedUser) {
    if (user.role === UserRole.ADMIN) {
      return this.prisma.business.findFirst({
        orderBy: { createdAt: 'asc' },
      });
    }

    const ownedBusiness = await this.prisma.business.findFirst({
      where: { ownerId: user.sub },
      orderBy: { createdAt: 'asc' },
    });

    if (ownedBusiness) {
      return ownedBusiness;
    }

    return this.prisma.business.findFirst({
      where: {
        members: {
          some: {
            userId: user.sub,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
