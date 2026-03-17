import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import Stripe from 'stripe';
import { Webhook } from 'svix';
import { WebhookProvider } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedRequest } from '../common/types/request-context.type';
import { BillingService } from '../billing/billing.service';
import { EmailsService, ResendWebhookPayload } from '../emails/emails.service';

function isStripePlaceholderKey(value?: string | null) {
  return !value || value === 'sk_test_xxx';
}

@Injectable()
export class WebhooksService {
  private readonly stripe: Stripe | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly billingService: BillingService,
    private readonly emailsService: EmailsService,
    @InjectQueue('webhooks') private readonly webhooksQueue: Queue,
  ) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = isStripePlaceholderKey(apiKey) ? null : new Stripe(apiKey ?? '');
  }

  async receiveStripeWebhook(request: AuthenticatedRequest, body: unknown) {
    const event = this.verifyStripeWebhook(request, body);
    const webhookEvent = await this.persistWebhook(
      WebhookProvider.STRIPE,
      event.id,
      event.type,
      event,
    );

    await this.webhooksQueue.add(
      'process-stripe-webhook',
      { webhookEventId: webhookEvent.id },
      {
        jobId: `stripe:${event.id}`,
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    );

    return { received: true };
  }

  async receiveResendWebhook(request: AuthenticatedRequest, body: unknown) {
    const event = this.verifyResendWebhook(request, body);
    const externalEventId = `${event.type}:${event.data?.email_id ?? 'unknown'}`;
    const webhookEvent = await this.persistWebhook(
      WebhookProvider.RESEND,
      externalEventId,
      event.type,
      event,
    );

    await this.webhooksQueue.add(
      'process-resend-webhook',
      { webhookEventId: webhookEvent.id },
      {
        jobId: `resend:${externalEventId}`,
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    );

    return { received: true };
  }

  async processWebhook(webhookEventId: string) {
    const event = await this.prisma.webhookEvent.findUniqueOrThrow({
      where: { id: webhookEventId },
    });

    if (event.provider === WebhookProvider.STRIPE) {
      await this.billingService.processStripeWebhook(event.payload as unknown as Stripe.Event);
    }

    if (event.provider === WebhookProvider.RESEND) {
      await this.emailsService.processResendWebhook(event.payload as unknown as ResendWebhookPayload);
    }

    await this.prisma.webhookEvent.update({
      where: { id: webhookEventId },
      data: {
        processedAt: new Date(),
      },
    });
  }

  private verifyStripeWebhook(request: AuthenticatedRequest, body: unknown) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    const signature = request.headers['stripe-signature'];

    if (
      this.stripe &&
      webhookSecret &&
      signature &&
      request.rawBody &&
      this.configService.get<string>('NODE_ENV') !== 'test'
    ) {
      return this.stripe.webhooks.constructEvent(
        Buffer.isBuffer(request.rawBody) ? request.rawBody : Buffer.from(request.rawBody),
        signature,
        webhookSecret,
      );
    }

    return body as Stripe.Event;
  }

  private verifyResendWebhook(request: AuthenticatedRequest, body: unknown) {
    const webhookSecret = this.configService.get<string>('RESEND_WEBHOOK_SECRET');

    if (
      webhookSecret &&
      request.rawBody &&
      request.headers['svix-id'] &&
      request.headers['svix-signature'] &&
      request.headers['svix-timestamp'] &&
      this.configService.get<string>('NODE_ENV') !== 'test'
    ) {
      const webhook = new Webhook(webhookSecret);
      return webhook.verify(
        Buffer.isBuffer(request.rawBody) ? request.rawBody.toString('utf-8') : String(request.rawBody),
        {
          'svix-id': String(request.headers['svix-id']),
          'svix-signature': String(request.headers['svix-signature']),
          'svix-timestamp': String(request.headers['svix-timestamp']),
        },
      ) as ResendWebhookPayload;
    }

    return body as ResendWebhookPayload;
  }

  private async persistWebhook(
    provider: WebhookProvider,
    externalEventId: string,
    type: string,
    payload: unknown,
  ) {
    return this.prisma.webhookEvent.upsert({
      where: {
        provider_externalEventId: {
          provider,
          externalEventId,
        },
      },
      create: {
        provider,
        externalEventId,
        type,
        payload: payload as never,
      },
      update: {
        type,
        payload: payload as never,
      },
    });
  }
}
