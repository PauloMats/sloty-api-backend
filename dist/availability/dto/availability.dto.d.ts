export declare class WeeklyAvailabilityEntryDto {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}
export declare class SetWeeklyAvailabilityDto {
    entries: WeeklyAvailabilityEntryDto[];
}
export declare class CreateBusinessClosureDto {
    startsAt: string;
    endsAt: string;
    reason?: string;
}
export declare class AvailabilitySlotsQueryDto {
    date: string;
}
export declare class AvailabilityRangeQueryDto {
    startDate: string;
    endDate: string;
}
