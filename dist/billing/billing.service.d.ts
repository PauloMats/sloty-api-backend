import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BusinessesService } from '../businesses/businesses.service';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionCheckoutDto } from './dto/billing.dto';
export declare class BillingService {
    private readonly prisma;
    private readonly configService;
    private readonly businessesService;
    private readonly stripe;
    constructor(prisma: PrismaService, configService: ConfigService, businessesService: BusinessesService);
    createCheckoutSession(user: AuthenticatedUser, dto: CreateSubscriptionCheckoutDto): Promise<{
        sessionId: string;
        url: string | null;
    }>;
    getMySubscription(user: AuthenticatedUser): Promise<{
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        businessId: string;
        stripeSubscriptionId: string;
        stripePriceId: string;
        currentPeriodStart: Date | null;
        currentPeriodEnd: Date | null;
        cancelAtPeriodEnd: boolean;
    } | null>;
    processStripeWebhook(event: Stripe.Event): Promise<void>;
    assertPremiumFeatureAvailable(businessId: string): Promise<void>;
    private ensureCustomer;
    private handleCheckoutCompleted;
    private handleSubscriptionChanged;
    private handleInvoiceEvent;
}
