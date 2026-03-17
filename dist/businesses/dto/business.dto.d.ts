import { BusinessStatus } from '@prisma/client';
export declare class CreateBusinessDto {
    name: string;
    slug: string;
    description?: string;
    category?: string;
    phone?: string;
    email?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    timezone: string;
    status: BusinessStatus;
}
declare const UpdateBusinessDto_base: import("@nestjs/common").Type<Partial<CreateBusinessDto>>;
export declare class UpdateBusinessDto extends UpdateBusinessDto_base {
}
export {};
