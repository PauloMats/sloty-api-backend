export declare class CreateAppointmentDto {
    businessId: string;
    serviceId: string;
    startAt: string;
    clientId?: string;
    staffUserId?: string;
    notes?: string;
    source?: string;
}
export declare class CancelAppointmentDto {
    reason?: string;
}
export declare class AppointmentRangeQueryDto {
    startDate: string;
    endDate: string;
}
