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
exports.BusinessesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let BusinessesService = class BusinessesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(user, dto) {
        if (user.role !== client_1.UserRole.OWNER && user.role !== client_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException({
                code: 'BUSINESS_CREATE_FORBIDDEN',
                message: 'Only owners and admins can create businesses.',
            });
        }
        return this.prisma.business.create({
            data: {
                ...dto,
                ownerId: user.sub,
            },
        });
    }
    async getMyBusiness(user) {
        const business = await this.findFirstAccessibleBusiness(user);
        if (!business) {
            throw new common_1.NotFoundException({
                code: 'BUSINESS_NOT_FOUND',
                message: 'No business found for current user.',
            });
        }
        return business;
    }
    async updateMyBusiness(user, dto) {
        const business = await this.getMyBusiness(user);
        await this.assertCanManageBusiness(user, business.id);
        return this.prisma.business.update({
            where: { id: business.id },
            data: dto,
        });
    }
    list() {
        return this.prisma.business.findMany({
            where: {
                status: client_1.BusinessStatus.ACTIVE,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    getById(businessId) {
        return this.prisma.business.findUniqueOrThrow({
            where: { id: businessId },
            include: {
                services: {
                    where: { isActive: true },
                },
            },
        });
    }
    getPublicById(businessId) {
        return this.prisma.business.findUniqueOrThrow({
            where: { id: businessId },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                category: true,
                phone: true,
                email: true,
                addressLine1: true,
                addressLine2: true,
                city: true,
                state: true,
                zipCode: true,
                country: true,
                timezone: true,
                status: true,
                services: {
                    where: { isActive: true },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
    }
    async assertCanManageBusiness(user, businessId) {
        if (user.role === client_1.UserRole.ADMIN) {
            return;
        }
        const business = await this.prisma.business.findUnique({
            where: { id: businessId },
            select: { ownerId: true },
        });
        if (!business) {
            throw new common_1.NotFoundException({
                code: 'BUSINESS_NOT_FOUND',
                message: 'Business not found.',
            });
        }
        if (business.ownerId === user.sub) {
            return;
        }
        const membership = await this.prisma.businessMember.findFirst({
            where: {
                businessId,
                userId: user.sub,
                isActive: true,
                role: {
                    in: [client_1.UserRole.OWNER, client_1.UserRole.STAFF],
                },
            },
        });
        if (!membership) {
            throw new common_1.ForbiddenException({
                code: 'BUSINESS_ACCESS_FORBIDDEN',
                message: 'You do not have access to manage this business.',
            });
        }
    }
    async findFirstAccessibleBusiness(user) {
        if (user.role === client_1.UserRole.ADMIN) {
            return this.prisma.business.findFirst({
                orderBy: { createdAt: 'asc' },
            });
        }
        const ownedBusiness = await this.prisma.business.findFirst({
            where: { ownerId: user.sub },
            orderBy: { createdAt: 'asc' },
        });
        if (ownedBusiness) {
            return ownedBusiness;
        }
        return this.prisma.business.findFirst({
            where: {
                members: {
                    some: {
                        userId: user.sub,
                        isActive: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
};
exports.BusinessesService = BusinessesService;
exports.BusinessesService = BusinessesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BusinessesService);
//# sourceMappingURL=businesses.service.js.map