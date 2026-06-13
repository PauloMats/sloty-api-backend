import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { BusinessesService } from '../businesses/businesses.service';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto, StartConversationDto } from './dto/conversation.dto';

const CONVERSATION_INCLUDE = {
  client: {
    select: {
      id: true,
      name: true,
    },
  },
  business: {
    select: {
      id: true,
      name: true,
      ownerId: true,
    },
  },
  appointment: {
    select: {
      id: true,
      startAt: true,
      status: true,
    },
  },
  serviceRequest: {
    select: {
      id: true,
      title: true,
      status: true,
    },
  },
  messages: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
};

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessesService: BusinessesService,
  ) {}

  async listMine(user: AuthenticatedUser) {
    const managedBusinessIds = await this.getManagedBusinessIds(user);
    return this.prisma.conversation.findMany({
      where: {
        OR: [{ clientId: user.sub }, { businessId: { in: managedBusinessIds } }],
      },
      include: CONVERSATION_INCLUDE,
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  }

  async start(user: AuthenticatedUser, dto: StartConversationDto) {
    const context = await this.resolveContextClientId(user, dto);

    const existing = await this.prisma.conversation.findFirst({
      where: {
        businessId: dto.businessId,
        clientId: context.clientId,
        appointmentId: dto.appointmentId,
        serviceRequestId: dto.serviceRequestId,
      },
      include: CONVERSATION_INCLUDE,
    });

    if (existing) {
      return existing;
    }

    return this.prisma.conversation.create({
      data: {
        businessId: dto.businessId,
        clientId: context.clientId,
        appointmentId: dto.appointmentId,
        serviceRequestId: dto.serviceRequestId,
      },
      include: CONVERSATION_INCLUDE,
    });
  }

  async getById(user: AuthenticatedUser, conversationId: string) {
    const conversation = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversationId },
      include: CONVERSATION_INCLUDE,
    });
    await this.assertCanAccessConversation(user, conversation);
    return conversation;
  }

  async sendMessage(user: AuthenticatedUser, conversationId: string, dto: SendMessageDto) {
    const conversation = await this.getById(user, conversationId);
    const body = dto.body.trim();

    if (!body) {
      throw new BadRequestException({
        code: 'EMPTY_MESSAGE',
        message: 'Message body cannot be empty.',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderId: user.sub,
          body,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      await tx.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      return message;
    });
  }

  private async resolveContextClientId(user: AuthenticatedUser, dto: StartConversationDto) {
    if (dto.appointmentId) {
      const appointment = await this.prisma.appointment.findUniqueOrThrow({
        where: { id: dto.appointmentId },
      });

      if (appointment.businessId !== dto.businessId) {
        throw new BadRequestException({
          code: 'CONVERSATION_CONTEXT_MISMATCH',
          message: 'Appointment does not belong to the selected business.',
        });
      }

      if (appointment.clientId !== user.sub) {
        await this.businessesService.assertCanManageBusiness(user, dto.businessId);
      }

      return { clientId: appointment.clientId };
    }

    if (dto.serviceRequestId) {
      const request = await this.prisma.serviceRequest.findUniqueOrThrow({
        where: { id: dto.serviceRequestId },
      });

      if (request.clientId !== user.sub) {
        await this.businessesService.assertCanManageBusiness(user, dto.businessId);
        const proposal = await this.prisma.serviceRequestProposal.findUnique({
          where: {
            requestId_businessId: {
              requestId: request.id,
              businessId: dto.businessId,
            },
          },
        });

        if (!proposal) {
          throw new ForbiddenException({
            code: 'CONVERSATION_REQUIRES_PROPOSAL',
            message: 'Business must send a proposal before starting a request conversation.',
          });
        }
      }

      return { clientId: request.clientId };
    }

    return { clientId: user.sub };
  }

  private async assertCanAccessConversation(
    user: AuthenticatedUser,
    conversation: { clientId: string; businessId: string },
  ) {
    if (user.role === UserRole.ADMIN || conversation.clientId === user.sub) {
      return;
    }

    try {
      await this.businessesService.assertCanManageBusiness(user, conversation.businessId);
    } catch {
      throw new ForbiddenException({
        code: 'CONVERSATION_ACCESS_FORBIDDEN',
        message: 'You do not have access to this conversation.',
      });
    }
  }

  private async getManagedBusinessIds(user: AuthenticatedUser) {
    if (user.role === UserRole.ADMIN) {
      const businesses = await this.prisma.business.findMany({
        select: { id: true },
      });
      return businesses.map((business) => business.id);
    }

    const businesses = await this.prisma.business.findMany({
      where: {
        OR: [
          { ownerId: user.sub },
          {
            members: {
              some: {
                userId: user.sub,
                isActive: true,
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    return businesses.map((business) => business.id);
  }
}
