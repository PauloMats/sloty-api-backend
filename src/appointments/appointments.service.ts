import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AppointmentEventType,
  AppointmentStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { DateTime } from 'luxon';
import { AvailabilityService } from '../availability/availability.service';
import { BusinessesService } from '../businesses/businesses.service';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { sha256 } from '../common/utils/hash.util';
import { serializeDeterministic } from '../common/utils/serialization.util';
import { PrismaService } from '../prisma/prisma.service';
import {
  AppointmentRangeQueryDto,
  CancelAppointmentDto,
  CreateAppointmentDto,
} from './dto/appointment.dto';

const APPOINTMENT_INCLUDE = {
  business: {
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      city: true,
      state: true,
      timezone: true,
    },
  },
  service: true,
  client: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
  staffUser: {
    select: {
      id: true,
      name: true,
    },
  },
  events: {
    orderBy: {
      createdAt: 'asc' as const,
    },
  },
};

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availabilityService: AvailabilityService,
    private readonly businessesService: BusinessesService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    user: AuthenticatedUser,
    dto: CreateAppointmentDto,
    idempotencyKey?: string,
  ) {
    const scope = 'appointments:create';
    const requestHash = sha256(
      serializeDeterministic({
        userId: user.sub,
        dto,
      }),
    );

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
          throw new ConflictException({
            code: 'IDEMPOTENCY_KEY_REUSED',
            message:
              'Idempotency key was already used with a different payload.',
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

      const lockDate = DateTime.fromISO(dto.startAt, {
        zone: 'utc',
      }).toISODate();
      await tx.$queryRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${`${dto.businessId}:${lockDate}`}))`,
      );

      const { service, endAt } =
        await this.availabilityService.assertSlotAvailable(
          tx,
          dto.businessId,
          dto.serviceId,
          new Date(dto.startAt),
        );

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
          status: AppointmentStatus.PENDING,
        },
        include: APPOINTMENT_INCLUDE,
      });

      await tx.appointmentEvent.create({
        data: {
          appointmentId: appointmentRecord.id,
          type: AppointmentEventType.CREATED,
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
            responseBody: JSON.parse(
              JSON.stringify(fullAppointment),
            ) as Prisma.InputJsonValue,
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

  getMyAppointments(user: AuthenticatedUser) {
    return this.prisma.appointment.findMany({
      where: {
        clientId: user.sub,
      },
      include: APPOINTMENT_INCLUDE,
      orderBy: { startAt: 'asc' },
    });
  }

  async getById(user: AuthenticatedUser, appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: APPOINTMENT_INCLUDE,
    });

    if (!appointment) {
      throw new NotFoundException({
        code: 'APPOINTMENT_NOT_FOUND',
        message: 'Appointment not found.',
      });
    }

    await this.assertCanAccessAppointment(user, appointment);
    return appointment;
  }

  async cancel(
    user: AuthenticatedUser,
    appointmentId: string,
    dto: CancelAppointmentDto,
  ) {
    const appointment = await this.getById(user, appointmentId);

    if (appointment.clientId !== user.sub) {
      await this.businessesService.assertCanManageBusiness(
        user,
        appointment.businessId,
      );
    }

    const updated = await this.updateStatus(
      appointmentId,
      AppointmentStatus.CANCELLED,
      AppointmentEventType.CANCELLED,
      user.sub,
      {
        cancellationReason: dto.reason,
        cancelledAt: new Date(),
      },
      {
        reason: dto.reason ?? null,
      },
    );

    await this.eventEmitter.emitAsync('appointment.cancelled', {
      appointmentId: updated.id,
    });
    return updated;
  }

  async confirm(user: AuthenticatedUser, appointmentId: string) {
    const appointment = await this.getById(user, appointmentId);
    await this.businessesService.assertCanManageBusiness(
      user,
      appointment.businessId,
    );

    const updated = await this.updateStatus(
      appointmentId,
      AppointmentStatus.CONFIRMED,
      AppointmentEventType.CONFIRMED,
      user.sub,
      {
        confirmedAt: new Date(),
      },
    );
    await this.eventEmitter.emitAsync('appointment.confirmed', {
      appointmentId: updated.id,
    });
    return updated;
  }

  async complete(user: AuthenticatedUser, appointmentId: string) {
    const appointment = await this.getById(user, appointmentId);
    await this.businessesService.assertCanManageBusiness(
      user,
      appointment.businessId,
    );

    return this.updateStatus(
      appointmentId,
      AppointmentStatus.COMPLETED,
      AppointmentEventType.COMPLETED,
      user.sub,
      {
        completedAt: new Date(),
      },
    );
  }

  async noShow(user: AuthenticatedUser, appointmentId: string) {
    const appointment = await this.getById(user, appointmentId);
    await this.businessesService.assertCanManageBusiness(
      user,
      appointment.businessId,
    );

    return this.updateStatus(
      appointmentId,
      AppointmentStatus.NO_SHOW,
      AppointmentEventType.NO_SHOW,
      user.sub,
      {
        noShowAt: new Date(),
      },
    );
  }

  async listBusinessAppointments(
    user: AuthenticatedUser,
    businessId: string,
    query?: AppointmentRangeQueryDto,
  ) {
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

  calendar(
    user: AuthenticatedUser,
    businessId: string,
    query: AppointmentRangeQueryDto,
  ) {
    return this.listBusinessAppointments(user, businessId, query);
  }

  private async updateStatus(
    appointmentId: string,
    status: AppointmentStatus,
    eventType: AppointmentEventType,
    actorUserId: string,
    appointmentPatch: Prisma.AppointmentUpdateInput,
    payload: Record<string, unknown> = {},
  ) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.appointment.findUniqueOrThrow({
        where: { id: appointmentId },
      });

      if (
        current.status === AppointmentStatus.CANCELLED &&
        status !== AppointmentStatus.CANCELLED
      ) {
        throw new BadRequestException({
          code: 'APPOINTMENT_FINALIZED',
          message: 'Cancelled appointments cannot transition to a new status.',
        });
      }

      await tx.appointment.update({
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
          payload: payload as Prisma.InputJsonValue,
        },
      });

      return tx.appointment.findUniqueOrThrow({
        where: { id: appointmentId },
        include: APPOINTMENT_INCLUDE,
      });
    });
  }

  private async resolveClientId(
    tx: Prisma.TransactionClient,
    user: AuthenticatedUser,
    providedClientId?: string,
  ) {
    if (!providedClientId) {
      return user.sub;
    }

    if (
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.OWNER &&
      user.role !== UserRole.STAFF
    ) {
      throw new ForbiddenException({
        code: 'CLIENT_ASSIGN_FORBIDDEN',
        message: 'Only staff can create appointments for another client.',
      });
    }

    const client = await tx.user.findUnique({
      where: { id: providedClientId },
    });

    if (!client) {
      throw new NotFoundException({
        code: 'CLIENT_NOT_FOUND',
        message: 'Client not found.',
      });
    }

    return client.id;
  }

  private async assertCanAccessAppointment(
    user: AuthenticatedUser,
    appointment: {
      clientId: string;
      businessId: string;
    },
  ) {
    if (user.role === UserRole.ADMIN || appointment.clientId === user.sub) {
      return;
    }

    try {
      await this.businessesService.assertCanManageBusiness(
        user,
        appointment.businessId,
      );
    } catch {
      throw new ForbiddenException({
        code: 'APPOINTMENT_ACCESS_FORBIDDEN',
        message: 'You do not have access to this appointment.',
      });
    }
  }
}
