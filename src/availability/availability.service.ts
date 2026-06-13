import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AppointmentStatus,
  Prisma,
  Service as CatalogService,
} from '@prisma/client';
import { DateTime } from 'luxon';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { BusinessesService } from '../businesses/businesses.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  calculateSlots,
  SlotCalculatorAvailabilityEntry,
  SlotCalculatorOccupiedInterval,
} from './slot-calculator';
import {
  AvailabilityRangeQueryDto,
  AvailabilitySlotsQueryDto,
  CreateBusinessClosureDto,
  SetWeeklyAvailabilityDto,
} from './dto/availability.dto';

type PrismaClientLike = PrismaService | Prisma.TransactionClient;

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessesService: BusinessesService,
  ) {}

  async setWeeklyAvailability(
    user: AuthenticatedUser,
    businessId: string,
    dto: SetWeeklyAvailabilityDto,
  ) {
    await this.businessesService.assertCanManageBusiness(user, businessId);
    return this.prisma.$transaction(async (tx) => {
      await tx.weeklyAvailability.deleteMany({ where: { businessId } });
      await tx.weeklyAvailability.createMany({
        data: dto.entries.map((entry) => ({
          businessId,
          dayOfWeek: entry.dayOfWeek,
          startTime: entry.startTime,
          endTime: entry.endTime,
          isActive: entry.isActive ?? true,
        })),
      });

      return tx.weeklyAvailability.findMany({
        where: { businessId },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });
    });
  }

  async getWeeklyAvailability(businessId: string) {
    return this.prisma.weeklyAvailability.findMany({
      where: { businessId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async createClosure(
    user: AuthenticatedUser,
    businessId: string,
    dto: CreateBusinessClosureDto,
  ) {
    await this.businessesService.assertCanManageBusiness(user, businessId);

    if (new Date(dto.startsAt) >= new Date(dto.endsAt)) {
      throw new BadRequestException({
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

  listClosures(businessId: string) {
    return this.prisma.businessClosure.findMany({
      where: { businessId },
      orderBy: { startsAt: 'asc' },
    });
  }

  async deleteClosure(user: AuthenticatedUser, businessId: string, closureId: string) {
    await this.businessesService.assertCanManageBusiness(user, businessId);
    await this.prisma.businessClosure.deleteMany({
      where: { id: closureId, businessId },
    });

    return { success: true };
  }

  async getAvailableSlots(
    businessId: string,
    serviceId: string,
    query: AvailabilitySlotsQueryDto,
  ) {
    return this.buildSlotsForDate(this.prisma, businessId, serviceId, query.date);
  }

  async getAvailableRange(
    businessId: string,
    serviceId: string,
    query: AvailabilityRangeQueryDto,
  ) {
    const start = DateTime.fromISO(query.startDate);
    const end = DateTime.fromISO(query.endDate);

    if (end < start) {
      throw new BadRequestException({
        code: 'INVALID_DATE_RANGE',
        message: 'endDate must be equal to or after startDate.',
      });
    }

    const results: Array<{ date: string; slots: Awaited<ReturnType<AvailabilityService['getAvailableSlots']>> }> =
      [];
    let cursor = start;

    while (cursor <= end) {
      const date = cursor.toISODate() as string;
      results.push({
        date,
        slots: await this.buildSlotsForDate(this.prisma, businessId, serviceId, date),
      });
      cursor = cursor.plus({ days: 1 });
    }

    return results;
  }

  async assertSlotAvailable(
    prisma: PrismaClientLike,
    businessId: string,
    serviceId: string,
    startAt: Date,
  ) {
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        businessId,
        isActive: true,
      },
    });

    if (!service) {
      throw new NotFoundException({
        code: 'SERVICE_NOT_FOUND',
        message: 'Service not found for the selected business.',
      });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException({
        code: 'BUSINESS_NOT_FOUND',
        message: 'Business not found.',
      });
    }

    const dateInBusinessTimezone = DateTime.fromJSDate(startAt, { zone: 'utc' })
      .setZone(business.timezone)
      .toISODate();

    const slots = await this.buildSlotsForDate(prisma, businessId, serviceId, dateInBusinessTimezone as string);
    const matchedSlot = slots.find((slot) => new Date(slot.startAt).getTime() === startAt.getTime());

    if (!matchedSlot) {
      throw new ConflictException({
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

  private async buildSlotsForDate(
    prisma: PrismaClientLike,
    businessId: string,
    serviceId: string,
    date: string,
  ) {
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
      throw new NotFoundException({
        code: 'AVAILABILITY_CONTEXT_NOT_FOUND',
        message: 'Business or service not found.',
      });
    }

    const localDayStart = DateTime.fromISO(date, { zone: business.timezone }).startOf('day');
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
            in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
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
    return calculateSlots({
      date,
      timezone: business.timezone,
      service: {
        durationMinutes: service.durationMinutes,
        bufferBeforeMinutes: service.bufferBeforeMinutes,
        bufferAfterMinutes: service.bufferAfterMinutes,
      },
      weeklyAvailability: weeklyAvailability as SlotCalculatorAvailabilityEntry[],
      closures,
      occupiedIntervals,
    });
  }

  private buildOccupiedIntervals(
    appointments: Array<{
      startAt: Date;
      endAt: Date;
      service: CatalogService;
    }>,
  ): SlotCalculatorOccupiedInterval[] {
    return appointments.map((appointment) => ({
      startsAt: DateTime.fromJSDate(appointment.startAt)
        .minus({ minutes: appointment.service.bufferBeforeMinutes })
        .toJSDate(),
      endsAt: DateTime.fromJSDate(appointment.endAt)
        .plus({ minutes: appointment.service.bufferAfterMinutes })
        .toJSDate(),
    }));
  }
}
