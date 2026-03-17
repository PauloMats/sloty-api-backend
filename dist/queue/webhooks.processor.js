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
exports.WebhooksProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const webhooks_service_1 = require("../webhooks/webhooks.service");
let WebhooksProcessor = class WebhooksProcessor extends bullmq_1.WorkerHost {
    webhooksService;
    constructor(webhooksService) {
        super();
        this.webhooksService = webhooksService;
    }
    async process(job) {
        if (job.name === 'process-stripe-webhook' || job.name === 'process-resend-webhook') {
            await this.webhooksService.processWebhook(job.data.webhookEventId);
        }
    }
};
exports.WebhooksProcessor = WebhooksProcessor;
exports.WebhooksProcessor = WebhooksProcessor = __decorate([
    (0, bullmq_1.Processor)('webhooks'),
    __metadata("design:paramtypes", [webhooks_service_1.WebhooksService])
], WebhooksProcessor);
//# sourceMappingURL=webhooks.processor.js.map