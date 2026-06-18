import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message;
      error = exception.name;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle known Prisma errors
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'A record with this value already exists.';
        error = 'ConflictException';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found.';
        error = 'NotFoundException';
      } else {
        status = HttpStatus.BAD_REQUEST;
        message = 'Database request error.';
        error = 'DatabaseError';
      }
    }

    this.logger.error(
      `[${request.method}] ${request.url} → ${status}: ${JSON.stringify(message)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
