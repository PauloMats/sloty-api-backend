"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let HttpExceptionFilter = class HttpExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const basePayload = {
            timestamp: new Date().toISOString(),
            path: request.url,
            details: null,
        };
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            const payload = typeof exceptionResponse === 'string'
                ? { code: 'HTTP_ERROR', message: exceptionResponse, details: null }
                : exceptionResponse;
            response.status(status).send({
                statusCode: status,
                code: payload.code ?? this.defaultCode(status),
                message: payload.message ?? exception.message,
                timestamp: basePayload.timestamp,
                path: basePayload.path,
                details: payload.details ?? null,
            });
            return;
        }
        if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            const status = exception.code === 'P2002'
                ? common_1.HttpStatus.CONFLICT
                : exception.code === 'P2025'
                    ? common_1.HttpStatus.NOT_FOUND
                    : common_1.HttpStatus.BAD_REQUEST;
            response.status(status).send({
                statusCode: status,
                code: exception.code,
                message: 'Database request failed.',
                details: exception.meta ?? null,
                timestamp: basePayload.timestamp,
                path: basePayload.path,
            });
            return;
        }
        response.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).send({
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred.',
            details: null,
            timestamp: basePayload.timestamp,
            path: basePayload.path,
        });
    }
    defaultCode(status) {
        switch (status) {
            case common_1.HttpStatus.BAD_REQUEST:
                return 'BAD_REQUEST';
            case common_1.HttpStatus.UNAUTHORIZED:
                return 'UNAUTHORIZED';
            case common_1.HttpStatus.FORBIDDEN:
                return 'FORBIDDEN';
            case common_1.HttpStatus.NOT_FOUND:
                return 'NOT_FOUND';
            case common_1.HttpStatus.CONFLICT:
                return 'CONFLICT';
            default:
                return 'HTTP_ERROR';
        }
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map