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
export declare function calculateSlots({ date, timezone, service, weeklyAvailability, closures, occupiedIntervals, slotIntervalMinutes, }: CalculateSlotsInput): SlotResult[];
export {};
