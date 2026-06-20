import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUserAddressDto,
  DeleteMyAccountDto,
  UpdateMeDto,
  UpdateNotificationPreferencesDto,
  UpdateUserAddressDto,
} from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  getMe(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  updateMe(userId: string, dto: UpdateMeDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async exportMyData(userId: string) {
    const [
      user,
      addresses,
      notificationPreferences,
      appointments,
      serviceRequests,
      orders,
      messages,
      notifications,
      emailLogs,
    ] = await this.prisma.$transaction([
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.userAddress.findMany({ where: { userId } }),
      this.prisma.userNotificationPreference.findUnique({ where: { userId } }),
      this.prisma.appointment.findMany({
        where: {
          OR: [{ clientId: userId }, { staffUserId: userId }],
        },
        select: {
          id: true,
          businessId: true,
          serviceId: true,
          staffUserId: true,
          startAt: true,
          endAt: true,
          status: true,
          notes: true,
          source: true,
          cancellationReason: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.serviceRequest.findMany({
        where: { clientId: userId },
        include: { proposals: true },
      }),
      this.prisma.order.findMany({
        where: { clientId: userId },
        include: { items: true },
      }),
      this.prisma.message.findMany({
        where: { senderId: userId },
        select: {
          id: true,
          conversationId: true,
          body: true,
          readAt: true,
          createdAt: true,
        },
      }),
      this.prisma.notification.findMany({ where: { userId } }),
      this.prisma.emailLog.findMany({
        where: { userId },
        select: {
          id: true,
          appointmentId: true,
          template: true,
          toEmail: true,
          subject: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      user,
      addresses,
      notificationPreferences,
      appointments,
      serviceRequests,
      orders,
      messages,
      notifications,
      emailLogs,
    };
  }

  async anonymizeMyAccount(userId: string, dto: DeleteMyAccountDto) {
    void dto;
    const anonymousId = randomUUID();
    const anonymousEmail = `deleted-${anonymousId}@privacy.sloty.invalid`;

    await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.userAddress.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({ where: { userId } });
      await tx.userNotificationPreference.deleteMany({ where: { userId } });
      await tx.emailLog.updateMany({
        where: { userId },
        data: { toEmail: anonymousEmail },
      });
      await tx.user.update({
        where: { id: userId },
        data: {
          name: 'Usuario removido',
          email: anonymousEmail,
          phone: null,
          isActive: false,
        },
      });
    });

    return {
      success: true,
      message: 'Account deactivated and direct identifiers anonymized.',
    };
  }

  listAddresses(userId: string) {
    return this.prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  createAddress(userId: string, dto: CreateUserAddressDto) {
    return this.prisma.$transaction(async (tx) => {
      const shouldBeDefault =
        dto.isDefault ||
        (await tx.userAddress.count({
          where: { userId },
        })) === 0;

      if (shouldBeDefault) {
        await tx.userAddress.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.userAddress.create({
        data: {
          userId,
          label: dto.label?.trim() || 'Endereco',
          recipientName: dto.recipientName,
          phone: dto.phone,
          addressLine1: dto.addressLine1,
          addressLine2: dto.addressLine2,
          neighborhood: dto.neighborhood,
          city: dto.city,
          state: dto.state,
          zipCode: dto.zipCode,
          country: dto.country ?? 'BR',
          latitude: dto.latitude,
          longitude: dto.longitude,
          isDefault: shouldBeDefault,
        },
      });
    });
  }

  updateAddress(userId: string, addressId: string, dto: UpdateUserAddressDto) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.userAddress.findFirstOrThrow({
        where: { id: addressId, userId },
      });

      if (dto.isDefault) {
        await tx.userAddress.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.userAddress.update({
        where: { id: current.id },
        data: {
          label: dto.label,
          recipientName: dto.recipientName,
          phone: dto.phone,
          addressLine1: dto.addressLine1,
          addressLine2: dto.addressLine2,
          neighborhood: dto.neighborhood,
          city: dto.city,
          state: dto.state,
          zipCode: dto.zipCode,
          country: dto.country,
          latitude: dto.latitude,
          longitude: dto.longitude,
          isDefault: dto.isDefault,
        },
      });
    });
  }

  setDefaultAddress(userId: string, addressId: string) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.userAddress.findFirstOrThrow({
        where: { id: addressId, userId },
      });

      await tx.userAddress.updateMany({
        where: { userId },
        data: { isDefault: false },
      });

      return tx.userAddress.update({
        where: { id: current.id },
        data: { isDefault: true },
      });
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const deleted = await this.prisma.userAddress.deleteMany({
      where: { id: addressId, userId },
    });

    return { success: deleted.count > 0 };
  }

  getNotificationPreferences(userId: string) {
    return this.prisma.userNotificationPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  updateNotificationPreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ) {
    return this.prisma.userNotificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...dto,
      },
      update: dto,
    });
  }
}
