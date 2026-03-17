import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessesService } from '../businesses/businesses.service';
import { CreateCatalogServiceDto, UpdateCatalogServiceDto } from './dto/service.dto';

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessesService: BusinessesService,
  ) {}

  async create(user: AuthenticatedUser, businessId: string, dto: CreateCatalogServiceDto) {
    await this.businessesService.assertCanManageBusiness(user, businessId);
    return this.prisma.service.create({
      data: {
        businessId,
        name: dto.name,
        description: dto.description,
        durationMinutes: dto.durationMinutes,
        priceCents: dto.priceCents,
        currency: dto.currency,
        bufferBeforeMinutes: dto.bufferBeforeMinutes ?? 0,
        bufferAfterMinutes: dto.bufferAfterMinutes ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  list(businessId: string) {
    return this.prisma.service.findMany({
      where: { businessId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(
    user: AuthenticatedUser,
    businessId: string,
    serviceId: string,
    dto: UpdateCatalogServiceDto,
  ) {
    await this.businessesService.assertCanManageBusiness(user, businessId);
    const service = await this.prisma.service.findFirstOrThrow({
      where: {
        id: serviceId,
        businessId,
      },
    });
    return this.prisma.service.update({
      where: { id: service.id },
      data: dto,
    });
  }

  async remove(user: AuthenticatedUser, businessId: string, serviceId: string) {
    await this.businessesService.assertCanManageBusiness(user, businessId);
    const service = await this.prisma.service.findFirstOrThrow({
      where: {
        id: serviceId,
        businessId,
      },
    });
    await this.prisma.service.delete({
      where: { id: service.id },
    });

    return {
      success: true,
    };
  }
}
