import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Prisma } from '@prisma/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const basePayload = {
      timestamp: new Date().toISOString(),
      path: request.url,
      details: null as unknown,
    };

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const payload =
        typeof exceptionResponse === 'string'
          ? { code: 'HTTP_ERROR', message: exceptionResponse, details: null }
          : (exceptionResponse as Record<string, unknown>);

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

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const status =
        exception.code === 'P2002'
          ? HttpStatus.CONFLICT
          : exception.code === 'P2025'
            ? HttpStatus.NOT_FOUND
            : HttpStatus.BAD_REQUEST;

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

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
      details: null,
      timestamp: basePayload.timestamp,
      path: basePayload.path,
    });
  }

  private defaultCode(status: number) {
    const defaultCodes: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
    };

    return defaultCodes[status] ?? 'HTTP_ERROR';
  }
}
