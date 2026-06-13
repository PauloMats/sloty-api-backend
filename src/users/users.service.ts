import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserAddressDto, UpdateMeDto, UpdateUserAddressDto } from './dto/user.dto';

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
}
