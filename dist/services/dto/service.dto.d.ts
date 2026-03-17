export declare class CreateCatalogServiceDto {
    name: string;
    description?: string;
    durationMinutes: number;
    priceCents: number;
    currency: string;
    bufferBeforeMinutes?: number;
    bufferAfterMinutes?: number;
    isActive?: boolean;
}
declare const UpdateCatalogServiceDto_base: import("@nestjs/common").Type<Partial<CreateCatalogServiceDto>>;
export declare class UpdateCatalogServiceDto extends UpdateCatalogServiceDto_base {
}
export {};
