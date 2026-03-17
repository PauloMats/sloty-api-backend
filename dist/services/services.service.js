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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const businesses_service_1 = require("../businesses/businesses.service");
let ServicesService = class ServicesService {
    prisma;
    businessesService;
    constructor(prisma, businessesService) {
        this.prisma = prisma;
        this.businessesService = businessesService;
    }
    async create(user, businessId, dto) {
        await this.businessesService.assertCanManageBusiness(user, businessId);
        return this.prisma.service.create({
            data: {
                businessId,
                name: dto.name,
                description: dto.description,
                durationMinutes: dto.durationMinutes,
                priceCents: dto.priceCents,
                currency: dto.currency,
                bufferBeforeMinutes: dto.bufferBeforeMinutes ?? 0,
                bufferAfterMinutes: dto.bufferAfterMinutes ?? 0,
                isActive: dto.isActive ?? true,
            },
        });
    }
    list(businessId) {
        return this.prisma.service.findMany({
            where: { businessId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async update(user, businessId, serviceId, dto) {
        await this.businessesService.assertCanManageBusiness(user, businessId);
        const service = await this.prisma.service.findFirstOrThrow({
            where: {
                id: serviceId,
                businessId,
            },
        });
        return this.prisma.service.update({
            where: { id: service.id },
            data: dto,
        });
    }
    async remove(user, businessId, serviceId) {
        await this.businessesService.assertCanManageBusiness(user, businessId);
        const service = await this.prisma.service.findFirstOrThrow({
            where: {
                id: serviceId,
                businessId,
            },
        });
        await this.prisma.service.delete({
            where: { id: service.id },
        });
        return {
            success: true,
        };
    }
};
exports.ServicesService = ServicesService;
exports.ServicesService = ServicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        businesses_service_1.BusinessesService])
], ServicesService);
//# sourceMappingURL=services.service.js.map