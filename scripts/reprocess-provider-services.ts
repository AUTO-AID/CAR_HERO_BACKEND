/**
 * إعادة ترجمة خدمات المزوّدين المسجَّلين قبل ربط نموذج الموقع باللوحة.
 *
 * نموذج الموقع يرسل تخصّصات نصّية (`mechanical`, `towing`, `detailing`) بينما
 * لوحة المزوّد تقرأ `services` بمعرّفات كتالوج المنصّة. `resolveCatalogSelection`
 * تجسر بينهما، لكنها تعمل **عند الإنشاء** — فمن سجّل قبلها بقيت وثيقته تحمل
 * التخصّصات النصّية و`services` فارغاً، وصفحة «خدماتي وأسعاري» عنده فارغة وإن
 * ملأ كل شيء عند التسجيل.
 *
 * يستدعي هذا السكربت منطق الترجمة نفسه من `ManageProvidersUseCase` — لا نسخة
 * منه: نسختان تتباعدان عند أوّل تعديل، فيُصلح السكربت بقاعدة والخادم بأخرى.
 *
 * الاستعمال:
 *   npm run providers:reprocess-services -- --dry     # عرض ما سيتغيّر بلا كتابة
 *   npm run providers:reprocess-services              # التنفيذ الفعلي
 *   npm run providers:reprocess-services -- --id=<providerId>
 */
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppModule } from '../src/app.module';
import {
  ManageProvidersUseCase,
  WEBSITE_SPECIALTY_CATEGORY,
} from '../src/modules/providers/application/use-cases/manage-providers.use-case';
import { Provider } from '../src/modules/providers/infrastructure/persistence/mongoose/schemas/provider.schema';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry');
const onlyId = args.find((arg) => arg.startsWith('--id='))?.split('=')[1];

const declaredSpecialties = (provider: any): string[] => {
  const requested: string[] = provider?.requestedServices || [];
  const listed: string[] = (provider?.services_list || [])
    .map((service: any) => service?.service_id)
    .filter(Boolean);
  return (requested.length ? requested : listed).filter(Boolean);
};

/**
 * تخصّص الموقع نصّ، وخدمة الكتالوج ObjectId — وهذا هو الفارق الذي نبحث عنه.
 *
 * والشرط الثاني ضروري: قاعدة الإنتاج تحوي آلاف المزوّدين المستوردين بمفردات
 * ثالثة (`tire_puncture`, `wheel_alignment`) لا تعرفها خريطة الموقع. عدّهم
 * ضمن «بحاجة إلى إعادة ترجمة» يضخّم الرقم بلا معنى، لأن الترجمة ستتخطّاهم
 * على أي حال.
 */
const needsReprocessing = (provider: any) => {
  const declared = declaredSpecialties(provider);
  if (!declared.length) return false;
  if (declared.every((id) => Types.ObjectId.isValid(id))) return false;
  return declared.some((id) => Boolean(WEBSITE_SPECIALTY_CATEGORY[id]));
};

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const providerModel = app.get<Model<any>>(getModelToken(Provider.name));
    const manageProviders = app.get(ManageProvidersUseCase);

    const filter = onlyId ? { _id: new Types.ObjectId(onlyId) } : {};
    const providers = await providerModel.find(filter).lean().exec();

    const stale = providers.filter(needsReprocessing);
    console.log(
      `فُحص ${providers.length} مزوّداً — ${stale.length} منهم بحاجة إلى إعادة ترجمة.`,
    );
    if (!isDryRun && !onlyId && stale.length > 50) {
      // نطاق واسع: قواعد الإنتاج تحوي مزوّدين مستوردين لا مسجَّلين من النموذج،
      // وإعادة ترجمتهم جملةً تكتب فوق خدماتهم. يُفرض العرض أولاً.
      console.log(
        `
⚠  هذا يمسّ ${stale.length} وثيقة. راجع الناتج بـ --dry أوّلاً،
` +
          `   أو عالج واحداً واحداً بـ --id=<providerId>.
` +
          `   للمتابعة رغم ذلك: أضف --force`,
      );
      if (!args.includes('--force')) return;
    }
    if (isDryRun) console.log('(وضع العرض فقط — لن يُكتب شيء)\n');

    let updated = 0;
    let skipped = 0;

    for (const provider of stale) {
      const id = provider._id.toString();
      const label = provider.businessName || provider.phone || id;

      if (isDryRun) {
        console.log(`  • ${label}: ${declaredSpecialties(provider).join(', ')}`);
        continue;
      }

      try {
        const result = await manageProviders.reprocessRegistrationServices(id);
        if (result) {
          updated += 1;
          console.log(`  ✓ ${label} — ${(result as any).services?.length ?? 0} خدمة`);
        } else {
          // لا فئة من فئات الكتالوج تطابق تخصّصاته، أو الكتالوج فارغ.
          // تُترك الوثيقة كما هي بدل تفريغ خدماتها.
          skipped += 1;
          console.log(`  – ${label}: لا يوجد ما يُترجَم — تُركت كما هي`);
        }
      } catch (error) {
        skipped += 1;
        console.error(`  ✗ ${label}: ${(error as Error).message}`);
      }
    }

    if (!isDryRun) console.log(`\nتم تحديث ${updated} — تُخطّي ${skipped}.`);
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
