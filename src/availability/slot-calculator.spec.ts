import { calculateSlots } from './slot-calculator';

describe('calculateSlots', () => {
  it('returns slots in UTC and local time based on weekly availability', () => {
    const slots = calculateSlots({
      date: '2026-04-13',
      timezone: 'America/Fortaleza',
      service: {
        durationMinutes: 60,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
      },
      weeklyAvailability: [
        {
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '11:00',
        },
      ],
      closures: [],
      occupiedIntervals: [],
    });

    expect(slots).toHaveLength(5);
    expect(slots[0]).toEqual(
      expect.objectContaining({
        startAt: '2026-04-13T12:00:00.000Z',
        endAt: '2026-04-13T13:00:00.000Z',
      }),
    );
  });

  it('removes slots that overlap closures or occupied intervals', () => {
    const slots = calculateSlots({
      date: '2026-04-13',
      timezone: 'America/Fortaleza',
      service: {
        durationMinutes: 60,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
      },
      weeklyAvailability: [
        {
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '12:00',
        },
      ],
      closures: [
        {
          startsAt: new Date('2026-04-13T12:00:00.000Z'),
          endsAt: new Date('2026-04-13T13:00:00.000Z'),
        },
      ],
      occupiedIntervals: [
        {
          startsAt: new Date('2026-04-13T14:00:00.000Z'),
          endsAt: new Date('2026-04-13T15:00:00.000Z'),
        },
      ],
    });

    expect(slots.map((slot) => slot.startAt)).not.toContain(
      '2026-04-13T12:00:00.000Z',
    );
    expect(slots.map((slot) => slot.startAt)).not.toContain(
      '2026-04-13T14:00:00.000Z',
    );
  });
});
