import { BadRequestException, Injectable } from '@nestjs/common';
import { BusinessMode, OrderStatus } from '@prisma/client';
import { BusinessesService } from '../businesses/businesses.service';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuItemDto, CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';

const ORDER_INCLUDE = {
  business: true,
  client: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
  address: true,
  items: {
    include: {
      menuItem: true,
    },
  },
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessesService: BusinessesService,
  ) {}

  listMenu(businessId: string) {
    return this.prisma.menuItem.findMany({
      where: { businessId, isAvailable: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async createMenuItem(user: AuthenticatedUser, businessId: string, dto: CreateMenuItemDto) {
    await this.businessesService.assertCanManageBusiness(user, businessId);
    return this.prisma.menuItem.create({
      data: {
        businessId,
        name: dto.name,
        description: dto.description,
        priceCents: dto.priceCents,
        currency: dto.currency ?? 'BRL',
      },
    });
  }

  async createOrder(user: AuthenticatedUser, dto: CreateOrderDto) {
    const business = await this.prisma.business.findUniqueOrThrow({
      where: { id: dto.businessId },
    });

    if (business.mode !== BusinessMode.DELIVERY_ORDER && business.mode !== BusinessMode.HYBRID) {
      throw new BadRequestException({
        code: 'BUSINESS_MODE_INCOMPATIBLE',
        message: 'Business must support delivery orders.',
      });
    }

    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        businessId: dto.businessId,
        id: { in: dto.items.map((item) => item.menuItemId) },
        isAvailable: true,
      },
    });
    const menuById = new Map(menuItems.map((item) => [item.id, item]));

    if (menuById.size !== new Set(dto.items.map((item) => item.menuItemId)).size) {
      throw new BadRequestException({
        code: 'MENU_ITEM_UNAVAILABLE',
        message: 'One or more menu items are unavailable.',
      });
    }

    const subtotalCents = dto.items.reduce((total, item) => {
      const menuItem = menuById.get(item.menuItemId)!;
      return total + menuItem.priceCents * item.quantity;
    }, 0);
    const deliveryFeeCents = dto.fulfillmentType === 'PICKUP' ? 0 : 500;
    const totalCents = subtotalCents + deliveryFeeCents;

    return this.prisma.order.create({
      data: {
        businessId: dto.businessId,
        clientId: user.sub,
        addressId: dto.addressId,
        fulfillmentType: dto.fulfillmentType ?? 'DELIVERY',
        subtotalCents,
        deliveryFeeCents,
        totalCents,
        currency: 'BRL',
        notes: dto.notes,
        items: {
          create: dto.items.map((item) => {
            const menuItem = menuById.get(item.menuItemId)!;
            return {
              menuItemId: menuItem.id,
              nameSnapshot: menuItem.name,
              unitPriceCents: menuItem.priceCents,
              quantity: item.quantity,
              notes: item.notes,
            };
          }),
        },
      },
      include: ORDER_INCLUDE,
    });
  }

  listMine(user: AuthenticatedUser) {
    return this.prisma.order.findMany({
      where: { clientId: user.sub },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async listBusinessOrders(user: AuthenticatedUser, businessId: string) {
    await this.businessesService.assertCanManageBusiness(user, businessId);
    return this.prisma.order.findMany({
      where: { businessId },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(
    user: AuthenticatedUser,
    businessId: string,
    orderId: string,
    dto: UpdateOrderStatusDto,
  ) {
    await this.businessesService.assertCanManageBusiness(user, businessId);

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: dto.status,
        acceptedAt:
          dto.status === OrderStatus.ACCEPTED || dto.status === OrderStatus.PREPARING
            ? new Date()
            : undefined,
        completedAt: dto.status === OrderStatus.COMPLETED ? new Date() : undefined,
        cancelledAt:
          dto.status === OrderStatus.CANCELLED || dto.status === OrderStatus.REJECTED
            ? new Date()
            : undefined,
      },
      include: ORDER_INCLUDE,
    });
  }
}
