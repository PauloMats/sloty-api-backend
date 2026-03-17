import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { EmailsModule } from '../emails/emails.module';
import { WebhooksProcessor } from '../queue/webhooks.processor';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [BillingModule, EmailsModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhooksProcessor],
  exports: [WebhooksService],
})
export class WebhooksModule {}
