import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BusinessMode,
  Prisma,
  ServiceProposalStatus,
  ServiceRequestStatus,
} from '@prisma/client';
import { BusinessesService } from '../businesses/businesses.service';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateServiceProposalDto,
  CreateServiceRequestDto,
  ListServiceRequestsQueryDto,
} from './dto/service-request.dto';

const REQUEST_INCLUDE = {
  category: true,
  address: true,
  client: {
    select: {
      id: true,
      name: true,
    },
  },
  proposals: {
    include: {
      business: {
        select: {
          id: true,
          ownerId: true,
          name: true,
          category: true,
          city: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' as const },
  },
};

const PUBLIC_REQUEST_INCLUDE = {
  category: true,
  client: {
    select: {
      id: true,
      name: true,
    },
  },
  proposals: {
    select: {
      id: true,
      businessId: true,
      status: true,
      createdAt: true,
    },
  },
};

@Injectable()
export class ServiceRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessesService: BusinessesService,
  ) {}

  create(user: AuthenticatedUser, dto: CreateServiceRequestDto) {
    return this.prisma.serviceRequest.create({
      data: {
        clientId: user.sub,
        categoryId: dto.categoryId,
        addressId: dto.addressId,
        title: dto.title,
        description: dto.description,
        city: dto.city,
        state: dto.state,
        latitude: dto.latitude,
        longitude: dto.longitude,
        budgetMinCents: dto.budgetMinCents,
        budgetMaxCents: dto.budgetMaxCents,
        currency: dto.currency ?? 'BRL',
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
      include: REQUEST_INCLUDE,
    });
  }

  listOpen(query: ListServiceRequestsQueryDto = {}) {
    return this.prisma.serviceRequest.findMany({
      where: {
        status: query.status ?? ServiceRequestStatus.OPEN,
        city: query.city
          ? {
              contains: query.city,
              mode: 'insensitive',
            }
          : undefined,
        categoryId: query.categoryId,
      },
      include: PUBLIC_REQUEST_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  listMine(user: AuthenticatedUser) {
    return this.prisma.serviceRequest.findMany({
      where: { clientId: user.sub },
      include: REQUEST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(user: AuthenticatedUser, requestId: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: REQUEST_INCLUDE,
    });

    if (!request) {
      throw new NotFoundException({
        code: 'SERVICE_REQUEST_NOT_FOUND',
        message: 'Service request not found.',
      });
    }

    if (request.clientId === user.sub) {
      return request;
    }

    const canSeeProposal = request.proposals.some(
      (proposal) => proposal.business.ownerId === user.sub,
    );

    if (!canSeeProposal) {
      throw new ForbiddenException({
        code: 'SERVICE_REQUEST_ACCESS_FORBIDDEN',
        message: 'You do not have access to this service request.',
      });
    }

    return request;
  }

  async createProposal(
    user: AuthenticatedUser,
    requestId: string,
    dto: CreateServiceProposalDto,
  ) {
    await this.businessesService.assertCanManageBusiness(user, dto.businessId);

    const [request, business] = await Promise.all([
      this.prisma.serviceRequest.findUnique({ where: { id: requestId } }),
      this.prisma.business.findUnique({ where: { id: dto.businessId } }),
    ]);

    if (!request || request.status !== ServiceRequestStatus.OPEN) {
      throw new BadRequestException({
        code: 'SERVICE_REQUEST_NOT_OPEN',
        message: 'Only open requests can receive proposals.',
      });
    }

    if (!business) {
      throw new NotFoundException({
        code: 'BUSINESS_NOT_FOUND',
        message: 'Business not found.',
      });
    }

    if (
      business.mode !== BusinessMode.ON_DEMAND_REQUEST &&
      business.mode !== BusinessMode.HYBRID
    ) {
      throw new BadRequestException({
        code: 'BUSINESS_MODE_INCOMPATIBLE',
        message: 'Business must support on-demand requests to send proposals.',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const proposal = await tx.serviceRequestProposal.create({
        data: {
          requestId,
          businessId: dto.businessId,
          message: dto.message,
          estimatedPriceCents: dto.estimatedPriceCents,
          estimatedDurationMinutes: dto.estimatedDurationMinutes,
        },
      });

      await tx.serviceRequest.update({
        where: { id: requestId },
        data: { status: ServiceRequestStatus.IN_NEGOTIATION },
      });

      return proposal;
    });
  }

  async acceptProposal(user: AuthenticatedUser, requestId: string, proposalId: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.clientId !== user.sub) {
      throw new ForbiddenException({
        code: 'SERVICE_REQUEST_ACCESS_FORBIDDEN',
        message: 'Only the requester can accept a proposal.',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const proposal = await tx.serviceRequestProposal.findFirstOrThrow({
        where: { id: proposalId, requestId },
      });

      await tx.serviceRequestProposal.updateMany({
        where: { requestId, id: { not: proposal.id } },
        data: { status: ServiceProposalStatus.REJECTED },
      });

      await tx.serviceRequest.update({
        where: { id: requestId },
        data: {
          status: ServiceRequestStatus.ACCEPTED,
          acceptedProposalId: proposal.id,
        },
      });

      return tx.serviceRequestProposal.update({
        where: { id: proposal.id },
        data: { status: ServiceProposalStatus.ACCEPTED },
      });
    });
  }
}
