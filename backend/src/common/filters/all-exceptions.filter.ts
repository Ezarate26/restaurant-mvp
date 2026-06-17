import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/** Manejo centralizado de errores: nunca filtra stack traces al cliente. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: unknown = 'Error interno';
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      message =
        typeof body === 'string'
          ? body
          : (body as { message?: unknown }).message ?? body;
    }

    if (status >= 500) {
      this.logger.error(
        `${req.method} ${req.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception)
      );
    } else {
      this.logger.warn(`${req.method} ${req.url} -> ${status}`);
    }

    res.status(status).json({
      statusCode: status,
      error: message,
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}
