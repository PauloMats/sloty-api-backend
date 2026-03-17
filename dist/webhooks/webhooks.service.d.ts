import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedRequest } from '../common/types/request-context.type';
import { BillingService } from '../billing/billing.service';
import { EmailsService } from '../emails/emails.service';
export declare class WebhooksService {
    private readonly prisma;
    private readonly configService;
    private readonly billingService;
    private readonly emailsService;
    private readonly webhooksQueue;
    private readonly stripe;
    constructor(prisma: PrismaService, configService: ConfigService, billingService: BillingService, emailsService: EmailsService, webhooksQueue: Queue);
    receiveStripeWebhook(request: AuthenticatedRequest, body: unknown): Promise<{
        received: boolean;
    }>;
    receiveResendWebhook(request: AuthenticatedRequest, body: unknown): Promise<{
        received: boolean;
    }>;
    processWebhook(webhookEventId: string): Promise<void>;
    private verifyStripeWebhook;
    private verifyResendWebhook;
    private persistWebhook;
}
