"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_2 = require("bullmq");
const stripe_1 = __importDefault(require("stripe"));
const svix_1 = require("svix");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const billing_service_1 = require("../billing/billing.service");
const emails_service_1 = require("../emails/emails.service");
function isStripePlaceholderKey(value) {
    return !value || value === 'sk_test_xxx';
}
let WebhooksService = class WebhooksService {
    prisma;
    configService;
    billingService;
    emailsService;
    webhooksQueue;
    stripe;
    constructor(prisma, configService, billingService, emailsService, webhooksQueue) {
        this.prisma = prisma;
        this.configService = configService;
        this.billingService = billingService;
        this.emailsService = emailsService;
        this.webhooksQueue = webhooksQueue;
        const apiKey = this.configService.get('STRIPE_SECRET_KEY');
        this.stripe = isStripePlaceholderKey(apiKey) ? null : new stripe_1.default(apiKey ?? '');
    }
    async receiveStripeWebhook(request, body) {
        const event = this.verifyStripeWebhook(request, body);
        const webhookEvent = await this.persistWebhook(client_1.WebhookProvider.STRIPE, event.id, event.type, event);
        await this.webhooksQueue.add('process-stripe-webhook', { webhookEventId: webhookEvent.id }, {
            jobId: `stripe:${event.id}`,
            removeOnComplete: 100,
            removeOnFail: 100,
        });
        return { received: true };
    }
    async receiveResendWebhook(request, body) {
        const event = this.verifyResendWebhook(request, body);
        const externalEventId = `${event.type}:${event.data?.email_id ?? 'unknown'}`;
        const webhookEvent = await this.persistWebhook(client_1.WebhookProvider.RESEND, externalEventId, event.type, event);
        await this.webhooksQueue.add('process-resend-webhook', { webhookEventId: webhookEvent.id }, {
            jobId: `resend:${externalEventId}`,
            removeOnComplete: 100,
            removeOnFail: 100,
        });
        return { received: true };
    }
    async processWebhook(webhookEventId) {
        const event = await this.prisma.webhookEvent.findUniqueOrThrow({
            where: { id: webhookEventId },
        });
        if (event.provider === client_1.WebhookProvider.STRIPE) {
            await this.billingService.processStripeWebhook(event.payload);
        }
        if (event.provider === client_1.WebhookProvider.RESEND) {
            await this.emailsService.processResendWebhook(event.payload);
        }
        await this.prisma.webhookEvent.update({
            where: { id: webhookEventId },
            data: {
                processedAt: new Date(),
            },
        });
    }
    verifyStripeWebhook(request, body) {
        const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
        const signature = request.headers['stripe-signature'];
        if (this.stripe &&
            webhookSecret &&
            signature &&
            request.rawBody &&
            this.configService.get('NODE_ENV') !== 'test') {
            return this.stripe.webhooks.constructEvent(Buffer.isBuffer(request.rawBody) ? request.rawBody : Buffer.from(request.rawBody), signature, webhookSecret);
        }
        return body;
    }
    verifyResendWebhook(request, body) {
        const webhookSecret = this.configService.get('RESEND_WEBHOOK_SECRET');
        if (webhookSecret &&
            request.rawBody &&
            request.headers['svix-id'] &&
            request.headers['svix-signature'] &&
            request.headers['svix-timestamp'] &&
            this.configService.get('NODE_ENV') !== 'test') {
            const webhook = new svix_1.Webhook(webhookSecret);
            return webhook.verify(Buffer.isBuffer(request.rawBody) ? request.rawBody.toString('utf-8') : String(request.rawBody), {
                'svix-id': String(request.headers['svix-id']),
                'svix-signature': String(request.headers['svix-signature']),
                'svix-timestamp': String(request.headers['svix-timestamp']),
            });
        }
        return body;
    }
    async persistWebhook(provider, externalEventId, type, payload) {
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
                payload: payload,
            },
            update: {
                type,
                payload: payload,
            },
        });
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, bullmq_1.InjectQueue)('webhooks')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        billing_service_1.BillingService,
        emails_service_1.EmailsService,
        bullmq_2.Queue])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map