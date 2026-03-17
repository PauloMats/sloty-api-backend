import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { BusinessesService } from '../businesses/businesses.service';
import { PrismaService } from '../prisma/prisma.service';
import { AvailabilityRangeQueryDto, AvailabilitySlotsQueryDto, CreateBusinessClosureDto, SetWeeklyAvailabilityDto } from './dto/availability.dto';
type PrismaClientLike = PrismaService | Prisma.TransactionClient;
export declare class AvailabilityService {
    private readonly prisma;
    private readonly businessesService;
    constructor(prisma: PrismaService, businessesService: BusinessesService);
    setWeeklyAvailability(user: AuthenticatedUser, businessId: string, dto: SetWeeklyAvailabilityDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        businessId: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
    }[]>;
    getWeeklyAvailability(businessId: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        businessId: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
    }[]>;
    createClosure(user: AuthenticatedUser, businessId: string, dto: CreateBusinessClosureDto): Promise<{
        id: string;
        createdAt: Date;
        businessId: string;
        startsAt: Date;
        endsAt: Date;
        reason: string | null;
    }>;
    listClosures(businessId: string): Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        businessId: string;
        startsAt: Date;
        endsAt: Date;
        reason: string | null;
    }[]>;
    deleteClosure(user: AuthenticatedUser, businessId: string, closureId: string): Promise<{
        success: boolean;
    }>;
    getAvailableSlots(businessId: string, serviceId: string, query: AvailabilitySlotsQueryDto): Promise<import("./slot-calculator").SlotResult[]>;
    getAvailableRange(businessId: string, serviceId: string, query: AvailabilityRangeQueryDto): Promise<{
        date: string;
        slots: Awaited<ReturnType<AvailabilityService["getAvailableSlots"]>>;
    }[]>;
    assertSlotAvailable(prisma: PrismaClientLike, businessId: string, serviceId: string, startAt: Date): Promise<{
        service: {
            name: string;
            description: string | null;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            businessId: string;
            durationMinutes: number;
            priceCents: number;
            currency: string;
            bufferBeforeMinutes: number;
            bufferAfterMinutes: number;
        };
        business: {
            name: string;
            description: string | null;
            slug: string;
            category: string | null;
            phone: string | null;
            email: string | null;
            addressLine1: string | null;
            addressLine2: string | null;
            city: string | null;
            state: string | null;
            zipCode: string | null;
            country: string | null;
            latitude: number | null;
            longitude: number | null;
            timezone: string;
            status: import("@prisma/client").$Enums.BusinessStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            ownerId: string;
        };
        endAt: Date;
    }>;
    private buildSlotsForDate;
    private buildOccupiedIntervals;
}
export {};
