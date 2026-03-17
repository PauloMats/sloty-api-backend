"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderAppointmentEmailTemplate = renderAppointmentEmailTemplate;
function renderAppointmentEmailTemplate(template, input) {
    const baseLines = [
        `Negocio: ${input.businessName}`,
        `Servico: ${input.serviceName}`,
        `Inicio: ${input.appointmentLocalStart}`,
        `Fim: ${input.appointmentLocalEnd}`,
        `Cliente: ${input.clientName}`,
    ];
    const definitions = {
        'appointment-created-client': {
            subject: `Seu agendamento em ${input.businessName} foi criado`,
            html: `<p>Ola ${input.clientName}, seu agendamento foi criado.</p><p>${baseLines.join('<br />')}</p>`,
            text: `Ola ${input.clientName}, seu agendamento foi criado.\n${baseLines.join('\n')}`,
        },
        'appointment-created-business': {
            subject: `Novo agendamento recebido em ${input.businessName}`,
            html: `<p>Um novo agendamento foi criado.</p><p>${baseLines.join('<br />')}</p>`,
            text: `Um novo agendamento foi criado.\n${baseLines.join('\n')}`,
        },
        'appointment-confirmed-client': {
            subject: `Seu agendamento em ${input.businessName} foi confirmado`,
            html: `<p>Ola ${input.clientName}, seu agendamento foi confirmado.</p><p>${baseLines.join('<br />')}</p>`,
            text: `Ola ${input.clientName}, seu agendamento foi confirmado.\n${baseLines.join('\n')}`,
        },
        'appointment-cancelled-client': {
            subject: `Seu agendamento em ${input.businessName} foi cancelado`,
            html: `<p>Ola ${input.clientName}, seu agendamento foi cancelado.</p><p>${baseLines.join('<br />')}</p>`,
            text: `Ola ${input.clientName}, seu agendamento foi cancelado.\n${baseLines.join('\n')}`,
        },
        'appointment-reminder-24h': {
            subject: `Lembrete: voce tem um agendamento em 24h`,
            html: `<p>Ola ${input.clientName}, este e um lembrete do seu agendamento em 24 horas.</p><p>${baseLines.join('<br />')}</p>`,
            text: `Ola ${input.clientName}, este e um lembrete do seu agendamento em 24 horas.\n${baseLines.join('\n')}`,
        },
        'appointment-reminder-2h': {
            subject: `Lembrete: seu agendamento comeca em 2h`,
            html: `<p>Ola ${input.clientName}, este e um lembrete do seu agendamento em 2 horas.</p><p>${baseLines.join('<br />')}</p>`,
            text: `Ola ${input.clientName}, este e um lembrete do seu agendamento em 2 horas.\n${baseLines.join('\n')}`,
        },
    };
    return definitions[template];
}
//# sourceMappingURL=appointment-email.templates.js.map