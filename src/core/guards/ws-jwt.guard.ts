/**
 * WebSocket Authentication Guard
 * Protects WebSocket gateways
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';

/**
 * رمز يميّز «توكن منتهٍ» عن «توكن فاسد» — يقرؤه التطبيق ليجدّد جلسته بدل أن
 * يُسقط المستخدم على شاشة الدخول. النصّ جزء من العقد مع الواجهتين.
 */
export const WS_AUTH_EXPIRED = 'ws_auth_expired';
export const WS_AUTH_INVALID = 'ws_auth_invalid';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const token = this.extractToken(client);

    if (!token) {
      throw new WsException({ code: WS_AUTH_INVALID, message: 'Authentication token not found' });
    }

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret:
          this.configService.get<string>('jwt.secret') ||
          this.configService.get<string>('JWT_SECRET'),
      });
    } catch (error: any) {
      /**
       * الانتهاء ليس فساداً — والخلط بينهما كان يُسكِت التطبيق تماماً.
       *
       * صلاحية توكن الوصول خمس عشرة دقيقة، والمقبس يبقى متّصلاً بعدها: الاتصال
       * لا يُعاد التحقّق منه، لكن **كل رسالة محروسة** تُفحص من جديد. فبعد ربع
       * ساعة من فتح التطبيق صار `provider:join` و`join:order` و`join_chat`
       * و`send_message` تُرفض جميعاً — بلا استدعاء لدالّة الردّ (فلا يعلم
       * المنادي)، وبحدث `exception` لا يستمع له أحد.
       *
       * النتيجة الميدانية: الفنّي أمام تطبيق مفتوح لا يصله عرض واحد، والعميل
       * أمام خريطة متجمّدة مكتوب فوقها «تتبع مباشر». تمييز الحالتين هنا هو ما
       * يسمح للواجهة بتجديد التوكن وإعادة الوصل بدل الصمت.
       */
      const expired = error?.name === 'TokenExpiredError';
      throw new WsException({
        code: expired ? WS_AUTH_EXPIRED : WS_AUTH_INVALID,
        message: expired ? 'Authentication token expired' : 'Invalid authentication token',
      });
    }

    const userId = payload.userId || payload.id || payload._id || payload.sub;
    if (!userId) {
      throw new WsException({ code: WS_AUTH_INVALID, message: 'Invalid authentication token payload' });
    }

    // Attach a normalized user shape so gateways can rely on one id field.
    client.data.user = {
      ...payload,
      id: userId,
      userId,
      _id: userId,
    };

    return true;
  }

  /**
   * **`auth` قبل الترويسة — والترتيب هو الإصلاح.**
   *
   * socket.io يدمج كل فضاءات الأسماء على نفس المضيف في **اتصال فيزيائي واحد**
   * (نفس `Manager`)، فترويسة الـ handshake تخصّ أوّل فضاء اتّصل وحده ولا
   * تتغيّر بعده أبداً. أمّا `handshake.auth` فيُرسَل مع حزمة الاتصال لكل فضاء
   * على حدة.
   *
   * فكان تفضيل الترويسة يعني أمرين، كلاهما مُثبت:
   *   ١ · فضاءان بتوكنين مختلفين على نفس المضيف يُصادَقان بتوكن أوّلهما —
   *       فيُقرأ الفنّي بهوية العميل ويفشل `provider:join` بـ«لا مزوّد مرتبط
   *       بهذا التوكن».
   *   ٢ · التوكن في الترويسة **مجمَّد على لحظة إنشاء الاتصال**، فلا يستفيد من
   *       أي تجديد لاحق للجلسة.
   *
   * `auth` يحلّ الاثنين: خاصٌّ بالفضاء، ويُحدَّث من الواجهة قبل كل إعادة وصل.
   */
  private extractToken(client: Socket): string | undefined {
    const candidates = [
      client.handshake?.auth?.token,
      client.handshake?.headers?.authorization,
      client.handshake?.query?.token,
    ];

    for (const candidate of candidates) {
      const raw = Array.isArray(candidate) ? candidate[0] : candidate;
      if (typeof raw !== 'string' || !raw.trim()) continue;
      return raw.startsWith('Bearer ') ? raw.substring(7).trim() : raw.trim();
    }

    return undefined;
  }
}
