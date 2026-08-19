/**
 * MongoDB Configuration
 * Mongoose connection factory for NestJS
 */
import { ConfigService } from '@nestjs/config';
import { MongooseModuleAsyncOptions } from '@nestjs/mongoose';

/**
 * هل يشير الرابط إلى قاعدة بيانات على هذا الجهاز؟
 */
function isLocalUri(uri: string): boolean {
  return /(^|\/\/|@)(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:|\/)/i.test(uri);
}

/**
 * يمنع الخلفية من الإقلاع على قاعدة بيانات محلية.
 *
 * كل العملاء — التطبيق والموقع ولوحة الإدارة ولوحة المزوّد — يتصلون
 * بالخلفية لا بقاعدة البيانات، فهذه الدالة هي النقطة الوحيدة التي تقرّر
 * أي قاعدة يعمل عليها النظام كله.
 *
 * وثلاثة سكربتات تشغيل كانت تكتب `$env:MONGODB_URI` فوق قيمة `.env`
 * ومتغيّر البيئة يتفوّق عليها، فيعمل النظام على المحلية بلا أي تحذير —
 * تبدو البيانات قديمة فحسب. الحارس هنا يجعل ذلك خطأ إقلاع صريحاً بدل
 * عطل صامت.
 *
 * للعمل على قاعدة محلية عمداً (اختبارات، عمل دون إنترنت):
 *     ALLOW_LOCAL_DB=true
 */
export function assertGlobalDatabase(uri: string | undefined): string {
  if (!uri) {
    throw new Error(
      'MONGODB_URI غير مضبوط. اضبطه في ملف .env على رابط Atlas.',
    );
  }

  const allowLocal = String(process.env.ALLOW_LOCAL_DB).toLowerCase() === 'true';

  if (isLocalUri(uri) && !allowLocal) {
    throw new Error(
      [
        '',
        '  ✖ رُفض الإقلاع: الخلفية تحاول الاتصال بقاعدة بيانات محلية.',
        '',
        `    الرابط الحالي : ${uri}`,
        '    المطلوب       : رابط Atlas من MONGODB_URI في .env',
        '',
        '  السبب الأرجح أنك شغّلت الخلفية بأحد أوامر التشغيل المحلي:',
        '      npm run dev:local  /  start:dev:local  /  dev:local:demo',
        '  وهي تكتب متغيّر البيئة فوق قيمة .env.',
        '',
        '  للعمل على Atlas:',
        '      npm run start:dev',
        '',
        '  وإن كنت تريد المحلية عمداً:',
        '      ALLOW_LOCAL_DB=true npm run dev:local',
        '',
      ].join('\n'),
    );
  }

  return uri;
}

export const mongoConfig: MongooseModuleAsyncOptions = {
  useFactory: async (configService: ConfigService) => {
    const uri = assertGlobalDatabase(configService.get<string>('database.uri'));

    if (String(process.env.ALLOW_LOCAL_DB).toLowerCase() === 'true' && isLocalUri(uri)) {
      // تحذير ظاهر: العمل على المحلية استثناء مقصود، لا الوضع الطبيعي
      console.warn('\n  ⚠  ALLOW_LOCAL_DB=true — الخلفية تعمل على قاعدة بيانات محلية، لا Atlas.\n');
    }

    return {
      uri,
      retryWrites: true,
      w: 'majority',
    };
  },
  inject: [ConfigService],
};
