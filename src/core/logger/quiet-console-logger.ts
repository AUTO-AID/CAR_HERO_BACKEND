/**
 * كل إقلاع لهذه الخلفية يطبع أكثر من مئتي سطر: سطر لكل وحدة في
 * `InstanceLoader`، وسطر لكل مسار في `RouterExplorer`/`RoutesResolver`،
 * وسطر لكل حدث Socket في `WebSocketsController`. مفيدة عند تتبّع ترتيب
 * التحميل، لكنها تُغرق الإقلاع العادي وتُخفي السطر المهم فعلاً: هل اتصلت
 * القاعدة، وهل نجح الإقلاع، وأي تحذير أو خطأ حقيقي.
 *
 * تُكتم هذه السياقات الأربعة فقط عند مستوى `log`. التحذيرات والأخطاء —
 * ومنها أخطاء نفس هذه الوحدات — تمرّ دائماً بلا مساس.
 */
import { ConsoleLogger } from '@nestjs/common';

const SILENCED_LOG_CONTEXTS = new Set([
  'InstanceLoader',
  'RoutesResolver',
  'RouterExplorer',
  'WebSocketsController',
]);

export class QuietConsoleLogger extends ConsoleLogger {
  log(message: unknown, ...optionalParams: unknown[]) {
    const context = optionalParams[optionalParams.length - 1];
    if (typeof context === 'string' && SILENCED_LOG_CONTEXTS.has(context)) {
      return;
    }
    super.log(message, ...optionalParams);
  }
}
