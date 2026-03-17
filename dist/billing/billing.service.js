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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const stripe_1 = __importDefault(require("stripe"));
const businesses_service_1 = require("../businesses/businesses.service");
const prisma_service_1 = require("../prisma/prisma.service");
function isStripePlaceholderKey(value) {
    return !value || value === 'sk_test_xxx';
}
let BillingService = class BillingService {
    prisma;
    configService;
    businessesService;
    stripe;
    constructor(prisma, configService, businessesService) {
        this.prisma = prisma;
        this.configService = configService;
        this.businessesService = businessesService;
        const apiKey = this.configService.get('STRIPE_SECRET_KEY');
        this.stripe = isStripePlaceholderKey(apiKey) ? null : new stripe_1.default(apiKey ?? '');
    }
    async createCheckoutSession(user, dto) {
        const businessId = dto.businessId ?? (await this.businessesService.getMyBusiness(user)).id;
        await this.businessesService.assertCanManageBusiness(user, businessId);
        const business = await this.prisma.business.findUnique({
            where: { id: businessId },
        });
        if (!business) {
            throw new common_1.NotFoundException({
                code: 'BUSINESS_NOT_FOUND',
                message: 'Business not found.',
            });
        }
        const priceId = dto.priceId ?? this.configService.getOrThrow('STRIPE_PRICE_ID_PRO');
        const frontendUrl = this.configService.getOrThrow('FRONTEND_URL');
        if (!this.stripe ||
            this.configService.get('NODE_ENV') === 'test' ||
            priceId === 'price_xxx') {
            return {
                sessionId: `cs_test_${businessId}`,
                url: `${frontendUrl}/billing/success?session_id=cs_test_${businessId}`,
            };
        }
        const customer = await this.ensureCustomer(businessId, business.email ?? undefined, business.name);
        const session = await this.stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customer.stripeCustomerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: dto.successUrl ?? `${frontendUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: dto.cancelUrl ?? `${frontendUrl}/billing/cancel`,
            client_reference_id: businessId,
            metadata: {
                businessId,
            },
        });
        return {
            sessionId: session.id,
            url: session.url,
        };
    }
    async getMySubscription(user) {
        const business = await this.businessesService.getMyBusiness(user);
        return this.prisma.billingSubscription.findUnique({
            where: { businessId: business.id },
        });
    }
    async processStripeWebhook(event) {
        switch (event.type) {
            case 'checkout.session.completed':
                await this.handleCheckoutCompleted(event.data.object);
                break;
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                await this.handleSubscriptionChanged(event.data.object);
                break;
            case 'invoice.payment_succeeded':
            case 'invoice.payment_failed':
                await this.handleInvoiceEvent(event.data.object, event.type);
                break;
            default:
                break;
        }
    }
    async assertPremiumFeatureAvailable(businessId) {
        const subscription = await this.prisma.billingSubscription.findUnique({
            where: { businessId },
        });
        if (!subscription || !['active', 'trialing'].includes(subscription.status)) {
            throw new common_1.ForbiddenException({
                code: 'SUBSCRIPTION_INACTIVE',
                message: 'Business subscription is not active.',
            });
        }
    }
    async ensureCustomer(businessId, email, name) {
        const existing = await this.prisma.billingCustomer.findUnique({
            where: { businessId },
        });
        if (existing) {
            return existing;
        }
        if (!this.stripe) {
            return this.prisma.billingCustomer.create({
                data: {
                    businessId,
                    stripeCustomerId: `cus_mock_${businessId}`,
                },
            });
        }
        const customer = await this.stripe.customers.create({
            email,
            name,
            metadata: {
                businessId,
            },
        });
        return this.prisma.billingCustomer.create({
            data: {
                businessId,
                stripeCustomerId: customer.id,
            },
        });
    }
    async handleCheckoutCompleted(session) {
        const businessId = session.metadata?.businessId ?? session.client_reference_id;
        if (!businessId) {
            return;
        }
        const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        const stripeSubscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;
        if (!stripeCustomerId || !stripeSubscriptionId) {
            return;
        }
        await this.prisma.billingCustomer.upsert({
            where: { businessId },
            create: {
                businessId,
                stripeCustomerId,
            },
            update: {
                stripeCustomerId,
            },
        });
        await this.prisma.billingSubscription.upsert({
            where: { businessId },
            create: {
                businessId,
                stripeSubscriptionId,
                stripePriceId: this.configService.getOrThrow('STRIPE_PRICE_ID_PRO'),
                status: 'active',
            },
            update: {
                stripeSubscriptionId,
                status: 'active',
            },
        });
    }
    async handleSubscriptionChanged(subscription) {
        const customerId = typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id;
        const billingCustomer = await this.prisma.billingCustomer.findFirst({
            where: { stripeCustomerId: customerId },
        });
        if (!billingCustomer) {
            return;
        }
        await this.prisma.billingSubscription.upsert({
            where: { businessId: billingCustomer.businessId },
            create: {
                businessId: billingCustomer.businessId,
                stripeSubscriptionId: subscription.id,
                stripePriceId: subscription.items.data[0]?.price.id ?? '',
                status: subscription.status,
                currentPeriodStart: new Date(subscription.items.data[0]?.current_period_start ?? Date.now()),
                currentPeriodEnd: new Date(subscription.items.data[0]?.current_period_end ?? Date.now()),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
            update: {
                stripeSubscriptionId: subscription.id,
                stripePriceId: subscription.items.data[0]?.price.id ?? '',
                status: subscription.status,
                currentPeriodStart: new Date(subscription.items.data[0]?.current_period_start ?? Date.now()),
                currentPeriodEnd: new Date(subscription.items.data[0]?.current_period_end ?? Date.now()),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
        });
    }
    async handleInvoiceEvent(invoice, type) {
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        if (!customerId) {
            return;
        }
        const billingCustomer = await this.prisma.billingCustomer.findFirst({
            where: { stripeCustomerId: customerId },
        });
        if (!billingCustomer) {
            return;
        }
        const invoiceWithPaymentIntent = invoice;
        await this.prisma.paymentRecord.create({
            data: {
                businessId: billingCustomer.businessId,
                stripePaymentIntentId: typeof invoiceWithPaymentIntent.payment_intent === 'string'
                    ? invoiceWithPaymentIntent.payment_intent
                    : invoiceWithPaymentIntent.payment_intent?.id,
                amountCents: invoice.amount_paid || invoice.amount_due || 0,
                currency: invoice.currency?.toUpperCase() ?? 'USD',
                type: client_1.PaymentType.SAAS_SUBSCRIPTION,
                status: type === 'invoice.payment_succeeded'
                    ? client_1.PaymentStatus.SUCCEEDED
                    : client_1.PaymentStatus.FAILED,
            },
        });
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        businesses_service_1.BusinessesService])
], BillingService);
//# sourceMappingURL=billing.service.js.map