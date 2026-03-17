"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSlots = calculateSlots;
const luxon_1 = require("luxon");
function calculateSlots({ date, timezone, service, weeklyAvailability, closures, occupiedIntervals, slotIntervalMinutes = 15, }) {
    const localDate = luxon_1.DateTime.fromISO(date, { zone: timezone }).startOf('day');
    const localDayOfWeek = localDate.weekday % 7;
    const matchingWindows = weeklyAvailability.filter((entry) => entry.isActive !== false && entry.dayOfWeek === localDayOfWeek);
    const durationMinutes = service.durationMinutes + service.bufferBeforeMinutes + service.bufferAfterMinutes;
    const closureIntervals = closures.map((closure) => luxon_1.Interval.fromDateTimes(luxon_1.DateTime.fromJSDate(closure.startsAt), luxon_1.DateTime.fromJSDate(closure.endsAt)));
    const occupied = occupiedIntervals.map((interval) => luxon_1.Interval.fromDateTimes(luxon_1.DateTime.fromJSDate(interval.startsAt), luxon_1.DateTime.fromJSDate(interval.endsAt)));
    const slots = [];
    for (const window of matchingWindows) {
        const [windowStartHour, windowStartMinute] = window.startTime.split(':').map(Number);
        const [windowEndHour, windowEndMinute] = window.endTime.split(':').map(Number);
        const windowStart = localDate.set({
            hour: windowStartHour,
            minute: windowStartMinute,
        });
        const windowEnd = localDate.set({
            hour: windowEndHour,
            minute: windowEndMinute,
        });
        let currentStart = windowStart.plus({ minutes: service.bufferBeforeMinutes });
        const latestStart = windowEnd.minus({
            minutes: service.durationMinutes + service.bufferAfterMinutes,
        });
        while (currentStart <= latestStart) {
            const actualEnd = currentStart.plus({ minutes: service.durationMinutes });
            const occupiedStart = currentStart.minus({ minutes: service.bufferBeforeMinutes }).toUTC();
            const occupiedEnd = actualEnd.plus({ minutes: service.bufferAfterMinutes }).toUTC();
            const candidateInterval = luxon_1.Interval.fromDateTimes(occupiedStart, occupiedEnd);
            const hasConflict = closureIntervals.some((interval) => interval.overlaps(candidateInterval)) ||
                occupied.some((interval) => interval.overlaps(candidateInterval));
            if (!hasConflict && candidateInterval.length('minutes') >= durationMinutes) {
                slots.push({
                    startAt: currentStart.toUTC().toISO(),
                    endAt: actualEnd.toUTC().toISO(),
                    localStart: currentStart.toISO(),
                    localEnd: actualEnd.toISO(),
                });
            }
            currentStart = currentStart.plus({ minutes: slotIntervalMinutes });
        }
    }
    return slots;
}
//# sourceMappingURL=slot-calculator.js.map