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
 * يتحقّق من وجود رابط قاعدة البيانات فقط.
 *
 * كان هنا حارس يرفض الإقلاع على قاعدة محلية، من فترة كان فيها Atlas هو
 * المصدر: ثلاثة سكربتات تشغيل تكتب `$env:MONGODB_URI` فوق قيمة `.env`
 * ومتغيّر البيئة يتفوّق عليها، فيعمل النظام على المحلية بلا أي تحذير —
 * تبدو البيانات قديمة فحسب. والحارس كان يحوّل ذلك العطل الصامت إلى خطأ
 * إقلاع صريح.
 *
 * عاد المشروع كلّه إلى القاعدة المحلية (`mongodb-data-8`)، فصار الحارس
 * يرفض الحالة الاعتيادية ويمنع الخلفية من الإقلاع أصلاً — وأُزيل هو
 * ونظيره في `scripts/start-local-stack.ps1`. `ALLOW_LOCAL_DB` لم يعد
 * يُقرأ في أي مكان.
 */
export function assertGlobalDatabase(uri: string | undefined): string {
  if (!uri) {
    throw new Error('MONGODB_URI غير مضبوط. اضبطه في ملف .env.');
  }

  return uri;
}

/** يخفي كلمة المرور قبل الطباعة — الرابط يحملها نصّاً صريحاً. */
function maskUri(uri: string): string {
  return uri.replace(/:\/\/([^:/@]+):[^@]*@/, '://$1:***@');
}

export const mongoConfig: MongooseModuleAsyncOptions = {
  useFactory: async (configService: ConfigService) => {
    const uri = assertGlobalDatabase(configService.get<string>('database.uri'));

    // سطر واحد يقول أي قاعدة يعمل عليها النظام كلّه: العملاء الأربعة يتصلون
    // بالخلفية لا بالقاعدة، فهذه هي النقطة الوحيدة التي يظهر فيها الجواب.
    console.log(
      `  ▸ MongoDB: ${isLocalUri(uri) ? 'محلية' : 'بعيدة'} — ${maskUri(uri)}`,
    );

    return {
      uri,
      retryWrites: true,
      w: 'majority',
    };
  },
  inject: [ConfigService],
};
