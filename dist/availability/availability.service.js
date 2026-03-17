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
exports.AvailabilityService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const luxon_1 = require("luxon");
const businesses_service_1 = require("../businesses/businesses.service");
const prisma_service_1 = require("../prisma/prisma.service");
const slot_calculator_1 = require("./slot-calculator");
let AvailabilityService = class AvailabilityService {
    prisma;
    businessesService;
    constructor(prisma, businessesService) {
        this.prisma = prisma;
        this.businessesService = businessesService;
    }
    async setWeeklyAvailability(user, businessId, dto) {
        await this.businessesService.assertCanManageBusiness(user, businessId);
        return this.prisma.$transaction(async (tx) => {
            await tx.weeklyAvailability.deleteMany({ where: { businessId } });
            await tx.weeklyAvailability.createMany({
                data: dto.entries.map((entry) => ({
                    businessId,
                    dayOfWeek: entry.dayOfWeek,
                    startTime: entry.startTime,
                    endTime: entry.endTime,
                })),
            });
            return tx.weeklyAvailability.findMany({
                where: { businessId },
                orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
            });
        });
    }
    async getWeeklyAvailability(businessId) {
        return this.prisma.weeklyAvailability.findMany({
            where: { businessId },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        });
    }
    async createClosure(user, businessId, dto) {
        await this.businessesService.assertCanManageBusiness(user, businessId);
        if (new Date(dto.startsAt) >= new Date(dto.endsAt)) {
            throw new common_1.BadRequestException({
                code: 'INVALID_CLOSURE_RANGE',
                message: 'Closure end must be after start.',
            });
        }
        return this.prisma.businessClosure.create({
            data: {
                businessId,
                startsAt: new Date(dto.startsAt),
                endsAt: new Date(dto.endsAt),
                reason: dto.reason,
            },
        });
    }
    listClosures(businessId) {
        return this.prisma.businessClosure.findMany({
            where: { businessId },
            orderBy: { startsAt: 'asc' },
        });
    }
    async deleteClosure(user, businessId, closureId) {
        await this.businessesService.assertCanManageBusiness(user, businessId);
        await this.prisma.businessClosure.deleteMany({
            where: { id: closureId, businessId },
        });
        return { success: true };
    }
    async getAvailableSlots(businessId, serviceId, query) {
        return this.buildSlotsForDate(this.prisma, businessId, serviceId, query.date);
    }
    async getAvailableRange(businessId, serviceId, query) {
        const start = luxon_1.DateTime.fromISO(query.startDate);
        const end = luxon_1.DateTime.fromISO(query.endDate);
        if (end < start) {
            throw new common_1.BadRequestException({
                code: 'INVALID_DATE_RANGE',
                message: 'endDate must be equal to or after startDate.',
            });
        }
        const results = [];
        let cursor = start;
        while (cursor <= end) {
            const date = cursor.toISODate();
            results.push({
                date,
                slots: await this.buildSlotsForDate(this.prisma, businessId, serviceId, date),
            });
            cursor = cursor.plus({ days: 1 });
        }
        return results;
    }
    async assertSlotAvailable(prisma, businessId, serviceId, startAt) {
        const service = await prisma.service.findFirst({
            where: {
                id: serviceId,
                businessId,
                isActive: true,
            },
        });
        if (!service) {
            throw new common_1.NotFoundException({
                code: 'SERVICE_NOT_FOUND',
                message: 'Service not found for the selected business.',
            });
        }
        const business = await prisma.business.findUnique({
            where: { id: businessId },
        });
        if (!business) {
            throw new common_1.NotFoundException({
                code: 'BUSINESS_NOT_FOUND',
                message: 'Business not found.',
            });
        }
        const dateInBusinessTimezone = luxon_1.DateTime.fromJSDate(startAt, { zone: 'utc' })
            .setZone(business.timezone)
            .toISODate();
        const slots = await this.buildSlotsForDate(prisma, businessId, serviceId, dateInBusinessTimezone);
        const matchedSlot = slots.find((slot) => new Date(slot.startAt).getTime() === startAt.getTime());
        if (!matchedSlot) {
            throw new common_1.ConflictException({
                code: 'SLOT_UNAVAILABLE',
                message: 'The requested slot is no longer available.',
            });
        }
        return {
            service,
            business,
            endAt: new Date(matchedSlot.endAt),
        };
    }
    async buildSlotsForDate(prisma, businessId, serviceId, date) {
        const business = await prisma.business.findUnique({
            where: { id: businessId },
        });
        const service = await prisma.service.findFirst({
            where: {
                id: serviceId,
                businessId,
                isActive: true,
            },
        });
        if (!business || !service) {
            throw new common_1.NotFoundException({
                code: 'AVAILABILITY_CONTEXT_NOT_FOUND',
                message: 'Business or service not found.',
            });
        }
        const localDayStart = luxon_1.DateTime.fromISO(date, { zone: business.timezone }).startOf('day');
        const localDayEnd = localDayStart.endOf('day');
        const dayStartUtc = localDayStart.toUTC().toJSDate();
        const dayEndUtc = localDayEnd.toUTC().toJSDate();
        const [weeklyAvailability, closures, appointments] = await Promise.all([
            prisma.weeklyAvailability.findMany({
                where: { businessId },
                orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
            }),
            prisma.businessClosure.findMany({
                where: {
                    businessId,
                    startsAt: { lte: dayEndUtc },
                    endsAt: { gte: dayStartUtc },
                },
            }),
            prisma.appointment.findMany({
                where: {
                    businessId,
                    status: {
                        in: [client_1.AppointmentStatus.PENDING, client_1.AppointmentStatus.CONFIRMED],
                    },
                    startAt: { lte: dayEndUtc },
                    endAt: { gte: dayStartUtc },
                },
                include: {
                    service: true,
                },
            }),
        ]);
        const occupiedIntervals = this.buildOccupiedIntervals(appointments);
        return (0, slot_calculator_1.calculateSlots)({
            date,
            timezone: business.timezone,
            service: {
                durationMinutes: service.durationMinutes,
                bufferBeforeMinutes: service.bufferBeforeMinutes,
                bufferAfterMinutes: service.bufferAfterMinutes,
            },
            weeklyAvailability: weeklyAvailability,
            closures,
            occupiedIntervals,
        });
    }
    buildOccupiedIntervals(appointments) {
        return appointments.map((appointment) => ({
            startsAt: luxon_1.DateTime.fromJSDate(appointment.startAt)
                .minus({ minutes: appointment.service.bufferBeforeMinutes })
                .toJSDate(),
            endsAt: luxon_1.DateTime.fromJSDate(appointment.endAt)
                .plus({ minutes: appointment.service.bufferAfterMinutes })
                .toJSDate(),
        }));
    }
};
exports.AvailabilityService = AvailabilityService;
exports.AvailabilityService = AvailabilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        businesses_service_1.BusinessesService])
], AvailabilityService);
//# sourceMappingURL=availability.service.js.map