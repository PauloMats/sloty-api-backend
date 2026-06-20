import { DateTime, Interval } from 'luxon';

export interface SlotCalculatorAvailabilityEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

export interface SlotCalculatorClosure {
  startsAt: Date;
  endsAt: Date;
}

export interface SlotCalculatorOccupiedInterval {
  startsAt: Date;
  endsAt: Date;
}

export interface SlotCalculatorServiceConfig {
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
}

export interface SlotResult {
  startAt: string;
  endAt: string;
  localStart: string;
  localEnd: string;
}

interface CalculateSlotsInput {
  date: string;
  timezone: string;
  service: SlotCalculatorServiceConfig;
  weeklyAvailability: SlotCalculatorAvailabilityEntry[];
  closures: SlotCalculatorClosure[];
  occupiedIntervals: SlotCalculatorOccupiedInterval[];
  slotIntervalMinutes?: number;
}

export function calculateSlots({
  date,
  timezone,
  service,
  weeklyAvailability,
  closures,
  occupiedIntervals,
  slotIntervalMinutes = 15,
}: CalculateSlotsInput): SlotResult[] {
  const localDate = DateTime.fromISO(date, { zone: timezone }).startOf('day');
  const localDayOfWeek = localDate.weekday % 7;
  const matchingWindows = weeklyAvailability.filter(
    (entry) => entry.isActive !== false && entry.dayOfWeek === localDayOfWeek,
  );

  const durationMinutes =
    service.durationMinutes +
    service.bufferBeforeMinutes +
    service.bufferAfterMinutes;

  const closureIntervals = closures.map((closure) =>
    Interval.fromDateTimes(
      DateTime.fromJSDate(closure.startsAt),
      DateTime.fromJSDate(closure.endsAt),
    ),
  );
  const occupied = occupiedIntervals.map((interval) =>
    Interval.fromDateTimes(
      DateTime.fromJSDate(interval.startsAt),
      DateTime.fromJSDate(interval.endsAt),
    ),
  );

  const slots: SlotResult[] = [];

  for (const window of matchingWindows) {
    const [windowStartHour, windowStartMinute] = window.startTime
      .split(':')
      .map(Number);
    const [windowEndHour, windowEndMinute] = window.endTime
      .split(':')
      .map(Number);

    const windowStart = localDate.set({
      hour: windowStartHour,
      minute: windowStartMinute,
    });
    const windowEnd = localDate.set({
      hour: windowEndHour,
      minute: windowEndMinute,
    });

    let currentStart = windowStart.plus({
      minutes: service.bufferBeforeMinutes,
    });
    const latestStart = windowEnd.minus({
      minutes: service.durationMinutes + service.bufferAfterMinutes,
    });

    while (currentStart <= latestStart) {
      const actualEnd = currentStart.plus({ minutes: service.durationMinutes });
      const occupiedStart = currentStart
        .minus({ minutes: service.bufferBeforeMinutes })
        .toUTC();
      const occupiedEnd = actualEnd
        .plus({ minutes: service.bufferAfterMinutes })
        .toUTC();
      const candidateInterval = Interval.fromDateTimes(
        occupiedStart,
        occupiedEnd,
      );
      const hasConflict =
        closureIntervals.some((interval) =>
          interval.overlaps(candidateInterval),
        ) || occupied.some((interval) => interval.overlaps(candidateInterval));

      if (
        !hasConflict &&
        candidateInterval.length('minutes') >= durationMinutes
      ) {
        slots.push({
          startAt: currentStart.toUTC().toISO() as string,
          endAt: actualEnd.toUTC().toISO() as string,
          localStart: currentStart.toISO() as string,
          localEnd: actualEnd.toISO() as string,
        });
      }

      currentStart = currentStart.plus({ minutes: slotIntervalMinutes });
    }
  }

  return slots;
}
