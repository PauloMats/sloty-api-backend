"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemindersProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const emails_service_1 = require("../emails/emails.service");
let RemindersProcessor = class RemindersProcessor extends bullmq_1.WorkerHost {
    emailsService;
    constructor(emailsService) {
        super();
        this.emailsService = emailsService;
    }
    async process(job) {
        if (job.name === 'send-reminder') {
            await this.emailsService.sendReminder(job.data.appointmentId, job.data.template);
        }
    }
};
exports.RemindersProcessor = RemindersProcessor;
exports.RemindersProcessor = RemindersProcessor = __decorate([
    (0, bullmq_1.Processor)('reminders'),
    __metadata("design:paramtypes", [emails_service_1.EmailsService])
], RemindersProcessor);
//# sourceMappingURL=reminders.processor.js.map