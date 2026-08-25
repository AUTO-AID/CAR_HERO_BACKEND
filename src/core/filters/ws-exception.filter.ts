import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

/**
 * رفض البوّابة يجب أن يعود في الـ ack، لا أن يختفي.
 *
 * سلوك Nest الافتراضي حين يرمي معالِج `@SubscribeMessage`: **لا يُستدعى ack
 * إطلاقاً**، ويُبثّ حدث اسمه `exception`. وعميلانا ينتظران الـ ack ويستمعان
 * إلى `error` — فالنتيجة أنّ كل رفض («لست مشاركاً»، «المحادثة غير موجودة»)
 * يظهر للمستخدم بعد اثنتي عشرة ثانية من الصمت كـ«انتهت مهلة الإرسال»،
 * وحقلُ الكتابة مقفل طوال المدّة.
 *
 * وأسوأ منه: `ChatService` يرمي استثناءات HTTP (`ForbiddenException`…) داخل
 * سياق WS، و`BaseWsExceptionFilter` لا يعرفها فيحوّلها إلى
 * «Internal server error» — فيضيع السبب الحقيقي حتى من السجلّ.
 *
 * هنا: `{ success: false, message }` عبر الـ ack — وهو الشكل الذي يفحصه
 * العميلان أصلاً (`if (res && res.success === false)`) — مع إبقاء بثّ
 * `exception` للعملاء الذين يرسلون بلا ack.
 */
@Catch()
export class WsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    // وسائط معالِج WS: (client, data, ack?) — الـ ack موجود فقط إن مرّر
    // العميل دالّة استدعاء مع الـ emit.
    const ack = host.getArgByIndex(2);
    const message = this.messageOf(exception);
    const payload = { success: false, message };

    this.logger.warn(`WS rejection on ${client?.id ?? 'unknown'}: ${message}`);

    if (typeof ack === 'function') {
      ack(payload);
      return;
    }
    client?.emit?.('exception', payload);
  }

  private messageOf(exception: unknown): string {
    if (exception instanceof WsException) {
      const error = exception.getError();
      if (typeof error === 'string') return error;
      return (error as any)?.message ?? 'حدث خطأ في الاتصال';
    }
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') return response;
      const msg = (response as any)?.message;
      return Array.isArray(msg) ? msg[0] : (msg ?? exception.message);
    }
    this.logger.error(`Unhandled WS error: ${(exception as any)?.stack ?? exception}`);
    return 'حدث خطأ غير متوقّع';
  }
}
