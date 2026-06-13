import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { CreateMenuItemDto, CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Public()
  @Get('businesses/:businessId/menu-items')
  listMenu(@Param('businessId') businessId: string) {
    return this.ordersService.listMenu(businessId);
  }

  @Post('businesses/:businessId/menu-items')
  @ApiBearerAuth()
  createMenuItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('businessId') businessId: string,
    @Body() dto: CreateMenuItemDto,
  ) {
    return this.ordersService.createMenuItem(user, businessId, dto);
  }

  @Post('orders')
  @ApiBearerAuth()
  createOrder(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(user, dto);
  }

  @Get('orders/me')
  @ApiBearerAuth()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.listMine(user);
  }

  @Get('businesses/:businessId/orders')
  @ApiBearerAuth()
  listBusinessOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Param('businessId') businessId: string,
  ) {
    return this.ordersService.listBusinessOrders(user, businessId);
  }

  @Patch('businesses/:businessId/orders/:orderId/status')
  @ApiBearerAuth()
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('businessId') businessId: string,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(user, businessId, orderId, dto);
  }
}
