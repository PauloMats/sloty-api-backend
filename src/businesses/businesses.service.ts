import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BusinessStatus, Prisma, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto, ListBusinessesQueryDto, UpdateBusinessDto } from './dto/business.dto';

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function calculateDistanceKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

  async list(query: ListBusinessesQueryDto = {}) {
    const where: Prisma.BusinessWhereInput = {
      status: BusinessStatus.ACTIVE,
      ...(query.city
        ? {
            city: {
              contains: query.city,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(query.category
        ? {
            OR: [
              {
                category: {
                  contains: query.category,
                  mode: 'insensitive',
                },
              },
              {
                categoryRef: {
                  slug: query.category,
                },
              },
            ],
          }
        : {}),
    };
    const businesses = await this.prisma.business.findMany({
      where: {
        ...where,
      },
      include: {
        categoryRef: true,
        services: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: query.limit ?? 50,
    });

    if (query.lat === undefined || query.lng === undefined) {
      return businesses;
    }

    const radiusKm = query.radiusKm ?? 25;
    return businesses
      .map((business) => {
        if (business.latitude === null || business.longitude === null) {
          return {
            ...business,
            distanceKm: null,
          };
        }

        return {
          ...business,
          distanceKm: Number(
            calculateDistanceKm(
              { lat: query.lat as number, lng: query.lng as number },
              { lat: business.latitude, lng: business.longitude },
            ).toFixed(2),
          ),
        };
      })
      .filter((business) => business.distanceKm === null || business.distanceKm <= radiusKm)
      .sort((left, right) => (left.distanceKm ?? Number.MAX_SAFE_INTEGER) - (right.distanceKm ?? Number.MAX_SAFE_INTEGER));
  }

  getById(businessId: string) {
    return this.prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      include: {
        categoryRef: true,
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
        categoryRef: true,
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
