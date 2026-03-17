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
exports.AppointmentsService = void 0;
const event_emitter_1 = require("@nestjs/event-emitter");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const luxon_1 = require("luxon");
const availability_service_1 = require("../availability/availability.service");
const businesses_service_1 = require("../businesses/businesses.service");
const hash_util_1 = require("../common/utils/hash.util");
const serialization_util_1 = require("../common/utils/serialization.util");
const prisma_service_1 = require("../prisma/prisma.service");
const APPOINTMENT_INCLUDE = {
    business: true,
    service: true,
    client: true,
    staffUser: true,
    events: {
        orderBy: {
            createdAt: 'asc',
        },
    },
};
let AppointmentsService = class AppointmentsService {
    prisma;
    availabilityService;
    businessesService;
    eventEmitter;
    constructor(prisma, availabilityService, businessesService, eventEmitter) {
        this.prisma = prisma;
        this.availabilityService = availabilityService;
        this.businessesService = businessesService;
        this.eventEmitter = eventEmitter;
    }
    async create(user, dto, idempotencyKey) {
        const scope = 'appointments:create';
        const requestHash = (0, hash_util_1.sha256)((0, serialization_util_1.serializeDeterministic)({
            userId: user.sub,
            dto,
        }));
        if (idempotencyKey) {
            const existingKey = await this.prisma.idempotencyKey.findUnique({
                where: {
                    scope_key: {
                        scope,
                        key: idempotencyKey,
                    },
                },
            });
            if (existingKey) {
                if (existingKey.requestHash !== requestHash) {
                    throw new common_1.ConflictException({
                        code: 'IDEMPOTENCY_KEY_REUSED',
                        message: 'Idempotency key was already used with a different payload.',
                    });
                }
                if (existingKey.responseBody) {
                    return existingKey.responseBody;
                }
            }
        }
        const appointment = await this.prisma.$transaction(async (tx) => {
            if (idempotencyKey) {
                await tx.idempotencyKey.upsert({
                    where: {
                        scope_key: {
                            scope,
                            key: idempotencyKey,
                        },
                    },
                    create: {
                        key: idempotencyKey,
                        scope,
                        requestHash,
                    },
                    update: {},
                });
            }
            const lockDate = luxon_1.DateTime.fromISO(dto.startAt, { zone: 'utc' }).toISODate();
            await tx.$queryRaw(client_1.Prisma.sql `SELECT pg_advisory_xact_lock(hashtext(${`${dto.businessId}:${lockDate}`}))`);
            const { service, endAt } = await this.availabilityService.assertSlotAvailable(tx, dto.businessId, dto.serviceId, new Date(dto.startAt));
            const clientId = await this.resolveClientId(tx, user, dto.clientId);
            const appointmentRecord = await tx.appointment.create({
                data: {
                    businessId: dto.businessId,
                    serviceId: dto.serviceId,
                    clientId,
                    staffUserId: dto.staffUserId,
                    startAt: new Date(dto.startAt),
                    endAt,
                    notes: dto.notes,
                    source: dto.source ?? 'api',
                    status: client_1.AppointmentStatus.PENDING,
                },
                include: APPOINTMENT_INCLUDE,
            });
            await tx.appointmentEvent.create({
                data: {
                    appointmentId: appointmentRecord.id,
                    type: client_1.AppointmentEventType.CREATED,
                    actorUserId: user.sub,
                    payload: {
                        serviceId: service.id,
                        startAt: appointmentRecord.startAt.toISOString(),
                        endAt: appointmentRecord.endAt.toISOString(),
                    },
                },
            });
            const fullAppointment = await tx.appointment.findUniqueOrThrow({
                where: { id: appointmentRecord.id },
                include: APPOINTMENT_INCLUDE,
            });
            if (idempotencyKey) {
                await tx.idempotencyKey.update({
                    where: {
                        scope_key: {
                            scope,
                            key: idempotencyKey,
                        },
                    },
                    data: {
                        responseCode: 201,
                        responseBody: JSON.parse(JSON.stringify(fullAppointment)),
                    },
                });
            }
            return fullAppointment;
        });
        await this.eventEmitter.emitAsync('appointment.created', {
            appointmentId: appointment.id,
        });
        return appointment;
    }
    getMyAppointments(user) {
        return this.prisma.appointment.findMany({
            where: {
                clientId: user.sub,
            },
            include: APPOINTMENT_INCLUDE,
            orderBy: { startAt: 'asc' },
        });
    }
    async getById(user, appointmentId) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: APPOINTMENT_INCLUDE,
        });
        if (!appointment) {
            throw new common_1.NotFoundException({
                code: 'APPOINTMENT_NOT_FOUND',
                message: 'Appointment not found.',
            });
        }
        await this.assertCanAccessAppointment(user, appointment);
        return appointment;
    }
    async cancel(user, appointmentId, dto) {
        const appointment = await this.getById(user, appointmentId);
        if (appointment.clientId !== user.sub) {
            await this.businessesService.assertCanManageBusiness(user, appointment.businessId);
        }
        const updated = await this.updateStatus(appointmentId, client_1.AppointmentStatus.CANCELLED, client_1.AppointmentEventType.CANCELLED, user.sub, {
            cancellationReason: dto.reason,
            cancelledAt: new Date(),
        }, {
            reason: dto.reason ?? null,
        });
        await this.eventEmitter.emitAsync('appointment.cancelled', { appointmentId: updated.id });
        return updated;
    }
    async confirm(user, appointmentId) {
        const appointment = await this.getById(user, appointmentId);
        await this.businessesService.assertCanManageBusiness(user, appointment.businessId);
        const updated = await this.updateStatus(appointmentId, client_1.AppointmentStatus.CONFIRMED, client_1.AppointmentEventType.CONFIRMED, user.sub, {
            confirmedAt: new Date(),
        });
        await this.eventEmitter.emitAsync('appointment.confirmed', { appointmentId: updated.id });
        return updated;
    }
    async complete(user, appointmentId) {
        const appointment = await this.getById(user, appointmentId);
        await this.businessesService.assertCanManageBusiness(user, appointment.businessId);
        return this.updateStatus(appointmentId, client_1.AppointmentStatus.COMPLETED, client_1.AppointmentEventType.COMPLETED, user.sub, {
            completedAt: new Date(),
        });
    }
    async noShow(user, appointmentId) {
        const appointment = await this.getById(user, appointmentId);
        await this.businessesService.assertCanManageBusiness(user, appointment.businessId);
        return this.updateStatus(appointmentId, client_1.AppointmentStatus.NO_SHOW, client_1.AppointmentEventType.NO_SHOW, user.sub, {
            noShowAt: new Date(),
        });
    }
    async listBusinessAppointments(user, businessId, query) {
        await this.businessesService.assertCanManageBusiness(user, businessId);
        return this.prisma.appointment.findMany({
            where: {
                businessId,
                ...(query
                    ? {
                        startAt: {
                            gte: new Date(`${query.startDate}T00:00:00.000Z`),
                            lte: new Date(`${query.endDate}T23:59:59.999Z`),
                        },
                    }
                    : {}),
            },
            include: APPOINTMENT_INCLUDE,
            orderBy: { startAt: 'asc' },
        });
    }
    calendar(user, businessId, query) {
        return this.listBusinessAppointments(user, businessId, query);
    }
    async updateStatus(appointmentId, status, eventType, actorUserId, appointmentPatch, payload = {}) {
        return this.prisma.$transaction(async (tx) => {
            const current = await tx.appointment.findUniqueOrThrow({
                where: { id: appointmentId },
            });
            if (current.status === client_1.AppointmentStatus.CANCELLED && status !== client_1.AppointmentStatus.CANCELLED) {
                throw new common_1.BadRequestException({
                    code: 'APPOINTMENT_FINALIZED',
                    message: 'Cancelled appointments cannot transition to a new status.',
                });
            }
            const appointment = await tx.appointment.update({
                where: { id: appointmentId },
                data: {
                    status,
                    ...appointmentPatch,
                },
                include: APPOINTMENT_INCLUDE,
            });
            await tx.appointmentEvent.create({
                data: {
                    appointmentId,
                    type: eventType,
                    actorUserId,
                    payload: payload,
                },
            });
            return tx.appointment.findUniqueOrThrow({
                where: { id: appointmentId },
                include: APPOINTMENT_INCLUDE,
            });
        });
    }
    async resolveClientId(tx, user, providedClientId) {
        if (!providedClientId) {
            return user.sub;
        }
        if (user.role !== client_1.UserRole.ADMIN &&
            user.role !== client_1.UserRole.OWNER &&
            user.role !== client_1.UserRole.STAFF) {
            throw new common_1.ForbiddenException({
                code: 'CLIENT_ASSIGN_FORBIDDEN',
                message: 'Only staff can create appointments for another client.',
            });
        }
        const client = await tx.user.findUnique({
            where: { id: providedClientId },
        });
        if (!client) {
            throw new common_1.NotFoundException({
                code: 'CLIENT_NOT_FOUND',
                message: 'Client not found.',
            });
        }
        return client.id;
    }
    async assertCanAccessAppointment(user, appointment) {
        if (user.role === client_1.UserRole.ADMIN || appointment.clientId === user.sub) {
            return;
        }
        try {
            await this.businessesService.assertCanManageBusiness(user, appointment.businessId);
        }
        catch {
            throw new common_1.ForbiddenException({
                code: 'APPOINTMENT_ACCESS_FORBIDDEN',
                message: 'You do not have access to this appointment.',
            });
        }
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        availability_service_1.AvailabilityService,
        businesses_service_1.BusinessesService,
        event_emitter_1.EventEmitter2])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map