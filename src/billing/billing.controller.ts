import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { BillingService } from './billing.service';
import { CreateSubscriptionCheckoutDto } from './dto/billing.dto';

@ApiTags('Billing')
@ApiBearerAuth()
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('checkout/subscription')
  createCheckoutSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSubscriptionCheckoutDto,
  ) {
    return this.billingService.createCheckoutSession(user, dto);
  }

  @Get('subscription/me')
  getMySubscription(@CurrentUser() user: AuthenticatedUser) {
    return this.billingService.getMySubscription(user);
  }
}
