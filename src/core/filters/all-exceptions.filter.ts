import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // رسالة داخلية تُعرض للعميل (`exception.message`) تسرّب تفاصيل تقنية —
    // أوضحها أخطاء Mongoose/BSON مثل «Cast to ObjectId failed…». الاستثناءات
    // المقصودة (`HttpException`) تحمل رسالة مُعدّة للعرض فتمرّ؛ أمّا الخطأ غير
    // المتوقّع فيُسجَّل كاملاً ويعود للعميل برسالة عامّة لا نصّ قاعدة البيانات.
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || message;
    }

    this.logger.error(
      `Unhandled Exception: ${
        exception instanceof Error ? exception.message : message
      }`,
      exception instanceof Error ? exception.stack : 'No stack trace',
    );

    const errorResponse = {
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}

