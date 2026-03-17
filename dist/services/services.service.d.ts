import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessesService } from '../businesses/businesses.service';
import { CreateCatalogServiceDto, UpdateCatalogServiceDto } from './dto/service.dto';
export declare class ServicesService {
    private readonly prisma;
    private readonly businessesService;
    constructor(prisma: PrismaService, businessesService: BusinessesService);
    create(user: AuthenticatedUser, businessId: string, dto: CreateCatalogServiceDto): Promise<{
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
    }>;
    list(businessId: string): import("@prisma/client").Prisma.PrismaPromise<{
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
    }[]>;
    update(user: AuthenticatedUser, businessId: string, serviceId: string, dto: UpdateCatalogServiceDto): Promise<{
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
    }>;
    remove(user: AuthenticatedUser, businessId: string, serviceId: string): Promise<{
        success: boolean;
    }>;
}
