import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { RequestWithId } from '../middleware/request-id.middleware';
import { StructuredLogger } from '../utils/structured-logger';

interface AuthedRequest extends RequestWithId {
  user?: { id?: string };
}

/**
 * Catches every unhandled exception and turns it into a structured JSON
 * error body carrying the request-id, plus a structured JSON log line with
 * timestamp/user_id/endpoint/error_type/stack_trace for audit/observability.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<AuthedRequest>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttp ? exception.getResponse() : undefined;

    const message = isHttp
      ? typeof exceptionResponse === 'string'
        ? exceptionResponse
        : ((exceptionResponse as { message?: string | string[] })?.message ?? exception.message)
      : 'Internal server error';

    const errorType = isHttp ? exception.constructor.name : 'UnhandledException';
    const stack = exception instanceof Error ? exception.stack : undefined;

    StructuredLogger.error({
      message: Array.isArray(message) ? message.join('; ') : String(message),
      requestId: request?.requestId,
      userId: request?.user?.id,
      endpoint: `${request?.method} ${request?.originalUrl}`,
      errorType,
      stack,
    });

    response.status(status).json({
      statusCode: status,
      requestId: request?.requestId,
      error: errorType,
      message,
      path: request?.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }
}
