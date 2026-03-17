"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const event_emitter_1 = require("@nestjs/event-emitter");
const throttler_1 = require("@nestjs/throttler");
const env_validation_1 = require("./config/env.validation");
const prisma_module_1 = require("./prisma/prisma.module");
const queue_module_1 = require("./queue/queue.module");
const health_module_1 = require("./health/health.module");
const access_token_guard_1 = require("./common/guards/access-token.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const businesses_module_1 = require("./businesses/businesses.module");
const services_module_1 = require("./services/services.module");
const availability_module_1 = require("./availability/availability.module");
const appointments_module_1 = require("./appointments/appointments.module");
const emails_module_1 = require("./emails/emails.module");
const notifications_module_1 = require("./notifications/notifications.module");
const billing_module_1 = require("./billing/billing.module");
const webhooks_module_1 = require("./webhooks/webhooks.module");
const uploads_module_1 = require("./uploads/uploads.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                cache: true,
                validate: env_validation_1.validateEnv,
            }),
            event_emitter_1.EventEmitterModule.forRoot(),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60_000,
                    limit: 100,
                },
            ]),
            prisma_module_1.PrismaModule,
            queue_module_1.QueueModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            businesses_module_1.BusinessesModule,
            services_module_1.ServicesModule,
            availability_module_1.AvailabilityModule,
            appointments_module_1.AppointmentsModule,
            emails_module_1.EmailsModule,
            notifications_module_1.NotificationsModule,
            billing_module_1.BillingModule,
            webhooks_module_1.WebhooksModule,
            uploads_module_1.UploadsModule,
            health_module_1.HealthModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: access_token_guard_1.AccessTokenGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map