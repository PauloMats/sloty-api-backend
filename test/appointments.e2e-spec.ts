import request from 'supertest';
import { AppointmentsController } from '../src/appointments/appointments.controller';
import { AppointmentsService } from '../src/appointments/appointments.service';
import { createTestApp } from './test-app.factory';

describe('AppointmentsController (e2e)', () => {
  it('creates an appointment via HTTP', async () => {
    const appointmentsService = {
      create: jest.fn().mockResolvedValue({
        id: 'appt_1',
        status: 'PENDING',
      }),
    };

    const app = await createTestApp({
      controllers: [AppointmentsController],
      providers: [
        {
          provide: AppointmentsService,
          useValue: appointmentsService,
        },
      ],
    });

    await request(app.getHttpServer())
      .post('/v1/appointments')
      .set('Idempotency-Key', 'idem-1')
      .send({
        businessId: 'biz_1',
        serviceId: 'svc_1',
        startAt: '2026-04-14T15:00:00.000Z',
      })
      .expect(201)
      .expect((response) => {
        const body = response.body as { id: string };
        expect(body.id).toBe('appt_1');
      });

    await app.close();
  });
});
