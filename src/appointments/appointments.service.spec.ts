import { AppointmentEventType, AppointmentStatus, UserRole } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConflictException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { sha256 } from '../common/utils/hash.util';
import { serializeDeterministic } from '../common/utils/serialization.util';

describe('AppointmentsService', () => {
  const createService = () => {
    const prisma = {
      idempotencyKey: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const availabilityService = {
      assertSlotAvailable: jest.fn(),
    };
    const businessesService = {
      assertCanManageBusiness: jest.fn(),
    };
    const eventEmitter = {
      emitAsync: jest.fn(),
    } as unknown as EventEmitter2;

    const service = new AppointmentsService(
      prisma as never,
      availabilityService as never,
      businessesService as never,
      eventEmitter,
    );

    return {
      service,
      prisma,
      availabilityService,
      businessesService,
      eventEmitter,
    };
  };

  it('returns cached response when idempotency key already has a stored body', async () => {
    const { service, prisma } = createService();
    const cachedResponse = { id: 'appt_1', status: 'PENDING' };
    const dto = {
      businessId: 'biz_1',
      serviceId: 'svc_1',
      startAt: '2026-04-14T15:00:00.000Z',
    };
    prisma.idempotencyKey.findUnique.mockResolvedValue({
      requestHash: sha256(
        serializeDeterministic({
          userId: 'user_1',
          dto,
        }),
      ),
      responseBody: cachedResponse,
    });

    const result = await service.create(
      {
        sub: 'user_1',
        email: 'client@example.com',
        role: UserRole.CLIENT,
      },
      dto,
      'idem-1',
    );

    expect(result).toEqual(cachedResponse);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('creates an appointment inside a transaction and emits an internal event', async () => {
    const { service, prisma, availabilityService, eventEmitter } = createService();
    prisma.idempotencyKey.findUnique.mockResolvedValue(null);

    const createdAppointment = {
      id: 'appt_1',
      businessId: 'biz_1',
      serviceId: 'svc_1',
      clientId: 'client_1',
      startAt: new Date('2026-04-14T15:00:00.000Z'),
      endAt: new Date('2026-04-14T15:45:00.000Z'),
      status: AppointmentStatus.PENDING,
      business: { id: 'biz_1', name: 'Studio SLOTY', timezone: 'America/Fortaleza' },
      service: { id: 'svc_1', name: 'Corte', durationMinutes: 45, bufferBeforeMinutes: 0, bufferAfterMinutes: 0 },
      client: { id: 'client_1', name: 'Julia', email: 'client@example.com' },
      staffUser: null,
      events: [],
    };

    const tx = {
      idempotencyKey: {
        upsert: jest.fn(),
        update: jest.fn(),
      },
      $queryRaw: jest.fn(),
      appointment: {
        create: jest.fn().mockResolvedValue(createdAppointment),
        findUniqueOrThrow: jest.fn().mockResolvedValue(createdAppointment),
      },
      appointmentEvent: {
        create: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    prisma.$transaction.mockImplementation(async (callback: (input: typeof tx) => Promise<unknown>) =>
      callback(tx),
    );
    availabilityService.assertSlotAvailable.mockResolvedValue({
      service: { id: 'svc_1' },
      endAt: new Date('2026-04-14T15:45:00.000Z'),
    });

    const result = await service.create(
      {
        sub: 'client_1',
        email: 'client@example.com',
        role: UserRole.CLIENT,
      },
      {
        businessId: 'biz_1',
        serviceId: 'svc_1',
        startAt: '2026-04-14T15:00:00.000Z',
      },
      'idem-2',
    );

    expect(tx.appointment.create).toHaveBeenCalled();
    expect(tx.appointmentEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: AppointmentEventType.CREATED,
        }),
      }),
    );
    expect(eventEmitter.emitAsync).toHaveBeenCalledWith('appointment.created', {
      appointmentId: 'appt_1',
    });
    expect(result).toEqual(createdAppointment);
  });

  it('throws conflict when idempotency key is reused with a different payload', async () => {
    const { service, prisma } = createService();
    prisma.idempotencyKey.findUnique.mockResolvedValue({
      requestHash: 'other-hash',
      responseBody: null,
    });

    await expect(
      service.create(
        {
          sub: 'user_1',
          email: 'client@example.com',
          role: UserRole.CLIENT,
        },
        {
          businessId: 'biz_1',
          serviceId: 'svc_1',
          startAt: '2026-04-14T15:00:00.000Z',
        },
        'idem-3',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
