import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = 'An error occurred';
    let errors = null;

    if (typeof exceptionResponse === 'object') {
      const resp = exceptionResponse as any;
      message = resp.message || message;
      errors = resp.errors || null;
    } else {
      message = exceptionResponse as string;
    }

    this.logger.error(`HTTP ${status} Error: ${message}`, exception.stack);

    const errorResponse = {
      success: false,
      statusCode: status,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}

