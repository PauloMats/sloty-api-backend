import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { CreateCatalogServiceDto, UpdateCatalogServiceDto } from './dto/service.dto';
import { ServicesService } from './services.service';
export declare class ServicesController {
    private readonly servicesService;
    constructor(servicesService: ServicesService);
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
