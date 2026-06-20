import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus, PaymentType } from '@prisma/client';
import Stripe from 'stripe';
import { BusinessesService } from '../businesses/businesses.service';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionCheckoutDto } from './dto/billing.dto';

type StripeInvoiceWithPaymentIntent = Stripe.Invoice & {
  payment_intent?: string | Stripe.PaymentIntent | null;
};

function isStripePlaceholderKey(value?: string | null) {
  return !value || value === 'sk_test_xxx';
}

@Injectable()
export class BillingService {
  private readonly stripe: Stripe | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly businessesService: BusinessesService,
  ) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = isStripePlaceholderKey(apiKey)
      ? null
      : new Stripe(apiKey ?? '');
  }

  async createCheckoutSession(
    user: AuthenticatedUser,
    dto: CreateSubscriptionCheckoutDto,
  ) {
    const businessId =
      dto.businessId ?? (await this.businessesService.getMyBusiness(user)).id;
    await this.businessesService.assertCanManageBusiness(user, businessId);

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) {
      throw new NotFoundException({
        code: 'BUSINESS_NOT_FOUND',
        message: 'Business not found.',
      });
    }

    const priceId =
      dto.priceId ??
      this.configService.getOrThrow<string>('STRIPE_PRICE_ID_PRO');
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');

    const nodeEnv = this.configService.get<string>('NODE_ENV');
    if (nodeEnv === 'test' || nodeEnv === 'development') {
      return {
        sessionId: `cs_test_${businessId}`,
        url: `${frontendUrl}/billing/success?session_id=cs_test_${businessId}`,
      };
    }

    if (!this.stripe || priceId === 'price_xxx') {
      throw new ServiceUnavailableException({
        code: 'STRIPE_NOT_CONFIGURED',
        message: 'Stripe billing is not configured.',
      });
    }

    const customer = await this.ensureCustomer(
      businessId,
      business.email ?? undefined,
      business.name,
    );

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url:
        dto.successUrl ??
        `${frontendUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
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

  async getMySubscription(user: AuthenticatedUser) {
    const business = await this.businessesService.getMyBusiness(user);
    return this.prisma.billingSubscription.findUnique({
      where: { businessId: business.id },
    });
  }

  async processStripeWebhook(event: Stripe.Event) {
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

  async assertPremiumFeatureAvailable(businessId: string) {
    const subscription = await this.prisma.billingSubscription.findUnique({
      where: { businessId },
    });

    if (
      !subscription ||
      !['active', 'trialing'].includes(subscription.status)
    ) {
      throw new ForbiddenException({
        code: 'SUBSCRIPTION_INACTIVE',
        message: 'Business subscription is not active.',
      });
    }
  }

  private async ensureCustomer(
    businessId: string,
    email?: string,
    name?: string,
  ) {
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

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const businessId =
      session.metadata?.businessId ?? session.client_reference_id;
    if (!businessId) {
      return;
    }

    const stripeCustomerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;
    const stripeSubscriptionId =
      typeof session.subscription === 'string'
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
        stripePriceId: this.configService.getOrThrow<string>(
          'STRIPE_PRICE_ID_PRO',
        ),
        status: 'active',
      },
      update: {
        stripeSubscriptionId,
        status: 'active',
      },
    });
  }

  private async handleSubscriptionChanged(subscription: Stripe.Subscription) {
    const customerId =
      typeof subscription.customer === 'string'
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
        currentPeriodStart: new Date(
          subscription.items.data[0]?.current_period_start ?? Date.now(),
        ),
        currentPeriodEnd: new Date(
          subscription.items.data[0]?.current_period_end ?? Date.now(),
        ),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      update: {
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0]?.price.id ?? '',
        status: subscription.status,
        currentPeriodStart: new Date(
          subscription.items.data[0]?.current_period_start ?? Date.now(),
        ),
        currentPeriodEnd: new Date(
          subscription.items.data[0]?.current_period_end ?? Date.now(),
        ),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  }

  private async handleInvoiceEvent(
    invoice: Stripe.Invoice,
    type: Stripe.Event.Type,
  ) {
    const customerId =
      typeof invoice.customer === 'string'
        ? invoice.customer
        : invoice.customer?.id;
    if (!customerId) {
      return;
    }

    const billingCustomer = await this.prisma.billingCustomer.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!billingCustomer) {
      return;
    }

    const invoiceWithPaymentIntent = invoice as StripeInvoiceWithPaymentIntent;
    await this.prisma.paymentRecord.create({
      data: {
        businessId: billingCustomer.businessId,
        stripePaymentIntentId:
          typeof invoiceWithPaymentIntent.payment_intent === 'string'
            ? invoiceWithPaymentIntent.payment_intent
            : invoiceWithPaymentIntent.payment_intent?.id,
        amountCents: invoice.amount_paid || invoice.amount_due || 0,
        currency: invoice.currency?.toUpperCase() ?? 'USD',
        type: PaymentType.SAAS_SUBSCRIPTION,
        status:
          type === 'invoice.payment_succeeded'
            ? PaymentStatus.SUCCEEDED
            : PaymentStatus.FAILED,
      },
    });
  }
}
