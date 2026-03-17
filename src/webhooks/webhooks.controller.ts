import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { AuthenticatedRequest } from '../common/types/request-context.type';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@Public()
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('stripe')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  stripe(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    return this.webhooksService.receiveStripeWebhook(request, body);
  }

  @Post('resend')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  resend(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    return this.webhooksService.receiveResendWebhook(request, body);
  }
}
