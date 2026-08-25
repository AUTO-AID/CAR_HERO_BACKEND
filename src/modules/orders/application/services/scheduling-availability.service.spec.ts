import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { businessDayName } from '../../../../core/utils/business-time.util';
import { Provider } from '../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import { Order } from '../../infrastructure/persistence/mongoose/schemas/order.schema';
import { SchedulingAvailabilityService } from './scheduling-availability.service';

const PROVIDER_ID = '65f000000000000000000099';

/** بعد ثلاثة أيام، منتصف النهار في دمشق (UTC+3) — وسط أي دوام معقول */
function futureNoon(): Date {
  const date = new Date(Date.now() + 3 * 86_400_000);
  date.setUTCHours(9, 0, 0, 0);
  return date;
}

const fullWeek = (overrides: Record<string, any> = {}) =>
  ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => ({
    day,
    open: '09:00',
    close: '21:00',
    isClosed: false,
    ...(overrides[day] ?? {}),
  }));

describe('SchedulingAvailabilityService — ساعات العمل', () => {
  let service: SchedulingAvailabilityService;
  let providerDoc: any;

  beforeEach(async () => {
    providerDoc = {
      _id: PROVIDER_ID,
      isActive: true,
      isApproved: true,
      workingHours: [],
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulingAvailabilityService,
        {
          provide: getModelToken(Provider.name),
          useValue: {
            // دالّة لا قيمة: الاختبار يعدّل `providerDoc` بعد البناء
            findById: () => ({ lean: () => ({ exec: () => Promise.resolve(providerDoc) }) }),
          },
        },
        {
          provide: getModelToken(Order.name),
          useValue: {
            find: () => ({ select: () => ({ lean: () => ({ exec: () => Promise.resolve([]) }) }) }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              ({ 'booking.defaultWindow.open': '09:00', 'booking.defaultWindow.close': '21:00' })[
                key
              ],
          },
        },
      ],
    }).compile();

    service = module.get(SchedulingAvailabilityService);
  });

  /**
   * العلّة: `workingHours` افتراضها `[]` في المخطّط، ومسار التسجيل عبر الموقع
   * وحده يملؤها. وكان غياب السجلّ يُقرأ إغلاقاً، فيصير كل مزوّد جاء من غير ذلك
   * المسار مغلقاً سبعة أيام في الأسبوع إلى الأبد — لا يُقبل لديه حجزٌ واحد.
   */
  it('يقرأ مزوّداً بلا ساعات منشورة بالنافذة الافتراضية لا كمغلق', async () => {
    await expect(service.assertAvailable(PROVIDER_ID, futureNoon(), 60)).resolves.toBeUndefined();
  });

  it('يفرض النافذة الافتراضية فعلاً — موعد بعد إغلاقها يُرفض', async () => {
    const late = new Date(Date.now() + 3 * 86_400_000);
    late.setUTCHours(20, 0, 0, 0); // ٢٣:٠٠ في دمشق، بعد ٢١:٠٠

    await expect(service.assertAvailable(PROVIDER_ID, late, 60)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  /**
   * الحدّ الآخر للإصلاح: النافذة الافتراضية للقائمة **الفارغة** وحدها. من كتب
   * ستة أيام وأسقط السابع يقصد إغلاقه، وفتحُه له بحجّة «لا سجلّ لليوم» ينقض
   * قراراً صريحاً.
   */
  it('يحترم إغلاقاً مقصوداً: يوم غائب من قائمة منشورة يبقى مغلقاً', async () => {
    const target = futureNoon();
    providerDoc.workingHours = fullWeek().filter((item) => item.day !== businessDayName(target));

    await expect(service.assertAvailable(PROVIDER_ID, target, 60)).rejects.toThrow(
      'Provider is closed at the requested time',
    );
  });

  it('يحترم isClosed الصريح', async () => {
    const target = futureNoon();
    providerDoc.workingHours = fullWeek({ [businessDayName(target)]: { isClosed: true } });

    await expect(service.assertAvailable(PROVIDER_ID, target, 60)).rejects.toThrow(
      'Provider is closed at the requested time',
    );
  });

  it('يمرّر موعداً داخل ساعات منشورة', async () => {
    providerDoc.workingHours = fullWeek();

    await expect(service.assertAvailable(PROVIDER_ID, futureNoon(), 60)).resolves.toBeUndefined();
  });
});
