import request from 'supertest';
import { AvailabilityController } from '../src/availability/availability.controller';
import { AvailabilityService } from '../src/availability/availability.service';
import { createTestApp } from './test-app.factory';

describe('AvailabilityController (e2e)', () => {
  it('returns public slots for a service and date', async () => {
    const availabilityService = {
      getAvailableSlots: jest.fn().mockResolvedValue([
        {
          startAt: '2026-04-14T15:00:00.000Z',
          endAt: '2026-04-14T15:45:00.000Z',
          localStart: '2026-04-14T12:00:00.000-03:00',
          localEnd: '2026-04-14T12:45:00.000-03:00',
        },
      ]),
    };

    const app = await createTestApp({
      controllers: [AvailabilityController],
      providers: [
        {
          provide: AvailabilityService,
          useValue: availabilityService,
        },
      ],
    });

    await request(app.getHttpServer())
      .get(
        '/v1/availability/businesses/biz_1/services/svc_1/slots?date=2026-04-14',
      )
      .expect(200)
      .expect((response) => {
        const body = response.body as Array<{ startAt: string }>;
        expect(body).toHaveLength(1);
        expect(body[0].startAt).toBe('2026-04-14T15:00:00.000Z');
      });

    await app.close();
  });
});
