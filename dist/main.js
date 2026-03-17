"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = __importDefault(require("@fastify/helmet"));
const app_module_1 = require("./app.module");
const config_1 = require("@nestjs/config");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const prisma_service_1 = require("./prisma/prisma.service");
async function bootstrap() {
    const adapter = new platform_fastify_1.FastifyAdapter({
        logger: {
            transport: process.env.NODE_ENV === 'development'
                ? {
                    target: 'pino-pretty',
                    options: {
                        translateTime: 'SYS:standard',
                        colorize: true,
                        ignore: 'pid,hostname',
                    },
                }
                : undefined,
        },
    });
    const app = await core_1.NestFactory.create(app_module_1.AppModule, adapter, {
        rawBody: true,
    });
    const configService = app.get(config_1.ConfigService);
    await app.register(helmet_1.default);
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    const swaggerEnabled = configService.get('SWAGGER_ENABLED') === 'true';
    if (swaggerEnabled) {
        const config = new swagger_1.DocumentBuilder()
            .setTitle('SLOTY API')
            .setDescription('REST API for SLOTY local business appointments.')
            .setVersion('1.0.0')
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('docs', app, document, {
            swaggerOptions: {
                persistAuthorization: true,
            },
        });
    }
    const corsOrigins = configService
        .get('CORS_ORIGINS', '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean) || [];
    app.enableCors({
        origin: corsOrigins.length > 0 ? corsOrigins : true,
        credentials: true,
    });
    app.enableShutdownHooks();
    app.get(prisma_service_1.PrismaService).enableShutdownHooks(app);
    const port = configService.get('PORT', 3000);
    await app.listen(port, '0.0.0.0');
}
bootstrap();
//# sourceMappingURL=main.js.map