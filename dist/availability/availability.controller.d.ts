import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { AvailabilityRangeQueryDto, AvailabilitySlotsQueryDto, CreateBusinessClosureDto, SetWeeklyAvailabilityDto } from './dto/availability.dto';
import { AvailabilityService } from './availability.service';
export declare class AvailabilityController {
    private readonly availabilityService;
    constructor(availabilityService: AvailabilityService);
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
    listClosures(businessId: string): import("@prisma/client").Prisma.PrismaPromise<{
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
    getSlots(businessId: string, serviceId: string, query: AvailabilitySlotsQueryDto): Promise<import("./slot-calculator").SlotResult[]>;
    getSlotsInRange(businessId: string, serviceId: string, query: AvailabilityRangeQueryDto): Promise<{
        date: string;
        slots: Awaited<ReturnType<AvailabilityService["getAvailableSlots"]>>;
    }[]>;
}
