type TemplateInput = {
    businessName: string;
    serviceName: string;
    appointmentLocalStart: string;
    appointmentLocalEnd: string;
    clientName: string;
};
type EmailTemplateResult = {
    subject: string;
    html: string;
    text: string;
};
export type AppointmentEmailTemplate = 'appointment-created-client' | 'appointment-created-business' | 'appointment-confirmed-client' | 'appointment-cancelled-client' | 'appointment-reminder-24h' | 'appointment-reminder-2h';
export declare function renderAppointmentEmailTemplate(template: AppointmentEmailTemplate, input: TemplateInput): EmailTemplateResult;
export {};
