/**
 * محتوى الإشعارات — مصدر واحد لكل النصوص التي تصل المستخدم
 *
 * كانت النصوص مكتوبة سطراً داخل كل use-case بالإنجليزية، بينما التطبيق عربي
 * بالكامل، وكانت حالة الطلب تُحقن خاماً (`status changed to in_progress`).
 * أي نص يظهر للمستخدم يجب أن يمرّ من هنا.
 *
 * تسميات الحالات مطابقة لـ newapp2/carApp/src/services/orderStatus.js — أي
 * تعديل هناك يجب أن ينعكس هنا.
 */
import { OrderStatus } from '../../../core/enums/status.enum';

const ORDER_STATUS_LABELS: Record<string, string> = {
  [OrderStatus.PENDING]: 'بانتظار القبول',
  [OrderStatus.ACCEPTED]: 'تم القبول',
  [OrderStatus.PROVIDER_ASSIGNED]: 'تم تعيين الفني',
  [OrderStatus.PROVIDER_EN_ROUTE]: 'الفني في الطريق',
  [OrderStatus.PROVIDER_ARRIVED]: 'وصل الفني',
  [OrderStatus.IN_PROGRESS]: 'قيد التنفيذ',
  [OrderStatus.AWAITING_CUSTOMER_CONFIRMATION]: 'بانتظار تأكيدك',
  [OrderStatus.COMPLETED]: 'مكتمل',
  [OrderStatus.CANCELLED]: 'ملغى',
  [OrderStatus.REJECTED]: 'مرفوض',
};

/** لا تُعيد أبداً الحالة الخام بالإنجليزية للمستخدم */
export function orderStatusLabel(status?: string): string {
  if (!status) return 'غير محددة';
  return ORDER_STATUS_LABELS[status] ?? 'حالة غير معروفة';
}

/** اسم الخدمة قد يغيب (المخطط لا يخزّنه دائماً) — لا نطبع "undefined" أبداً */
export function serviceLabel(name?: string | null): string {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  return trimmed || 'الخدمة المطلوبة';
}

/**
 * أسماء الخدمات في القاعدة تبدأ غالباً بكلمة «خدمة» ("خدمة السحب")، فإضافة
 * البادئة تُنتج «لخدمة خدمة السحب». نضيفها فقط عند غيابها.
 */
function servicePhrase(name?: string | null): string {
  const label = serviceLabel(name);
  return label.startsWith('خدمة') ? `لـ${label}` : `لخدمة ${label}`;
}

function formatDateTime(value?: Date | string | null): string {
  if (!value) return 'موعد غير محدد';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'موعد غير محدد';
  return new Intl.DateTimeFormat('ar-SY', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Damascus',
  }).format(date);
}

export interface NotificationContent {
  title: string;
  body: string;
}

export const notificationContent = {
  /** تغيّرت حالة الطلب — نسخة العميل */
  orderStatusChangedForUser(orderNumber: string, status: string): NotificationContent {
    return {
      title: 'تحديث على طلبك',
      body: `طلبك رقم ${orderNumber} أصبح: ${orderStatusLabel(status)}`,
    };
  },

  /** تغيّرت حالة الطلب — نسخة المزوّد */
  orderStatusChangedForProvider(orderNumber: string, status: string): NotificationContent {
    return {
      title: 'تحديث حالة الطلب',
      body: `الطلب رقم ${orderNumber} أصبح: ${orderStatusLabel(status)}`,
    };
  },

  /** وصل طلب جديد إلى المزوّد */
  newOrderForProvider(orderNumber: string, serviceName?: string | null): NotificationContent {
    return {
      title: 'طلب جديد',
      body: `وصلك طلب جديد رقم ${orderNumber} ${servicePhrase(serviceName)}`,
    };
  },

  /**
   * عُرض طلب على الفنّي ضمن نافذة ردّ محدودة — إشعار تطبيق الفنّي الميداني.
   * يذكر المهلة صراحةً لأن الإشعار قد يصل والهاتف مقفل، والفنّي يقرّر من نصّه
   * وحده إن كان يستحق فتح التطبيق الآن.
   */
  newRequestOfferForProvider(
    serviceName: string | null | undefined,
    seconds: number,
    distanceKm?: number | null,
  ): NotificationContent {
    const distance = typeof distanceKm === 'number' ? ` على بُعد ${distanceKm} كم` : '';
    return {
      title: 'طلب خدمة جديد',
      body: `${serviceLabel(serviceName)}${distance} — لديك ${seconds} ثانية للرد.`,
    };
  },

  /**
   * انقضى سقف البحث ولم يُقبل الطلب — إشعار العميل.
   *
   * النصّ يقول إن الطلب **أُلغي** لا إننا «ما زلنا نبحث»: البحث انتهى فعلاً،
   * والوعد بمتابعته يترك العميل ينتظر على الطريق ما لن يأتي.
   */
  noProviderAvailableForOrder(orderNumber: string): NotificationContent {
    return {
      title: 'تعذّر إيجاد فنّي متاح',
      body: `لم نتمكّن من إيجاد فنّي متاح قريب لطلبك رقم ${orderNumber}، وتم إلغاؤه. يمكنك المحاولة مجدداً أو التواصل مع الدعم.`,
    };
  },

  /** ثغرة تغطية: طلب سقط دون فنّي — إشعار الإدارة لا العميل */
  coverageGapForAdmin(
    orderNumber: string,
    serviceName?: string | null,
    address?: string | null,
  ): NotificationContent {
    const where = address?.trim() ? ` في ${address.trim()}` : '';
    return {
      title: 'ثغرة تغطية: طلب بلا فنّي',
      body: `الطلب ${orderNumber} (${serviceLabel(serviceName)})${where} أُلغي لعدم وجود فنّي متاح خلال مدة البحث.`,
    };
  },

  /** حجز مجدول أُسند إلى الفنّي — لا مهلة ردّ هنا، الموعد بعيد */
  bookingAssignedToProvider(orderNumber: string, scheduledAt?: Date | string | null): NotificationContent {
    return {
      title: 'حجز جديد مُسند إليك',
      body: `لديك حجز رقم ${orderNumber} بموعد ${formatDateTime(scheduledAt)}. يمكنك الاعتذار عنه قبل الموعد بوقت كافٍ.`,
    };
  },

  /** اقترب موعد الحجز ويُطلب تأكيده */
  bookingConfirmationDue(orderNumber: string, scheduledAt?: Date | string | null): NotificationContent {
    return {
      title: 'أكّد حجزك القادم',
      body: `اقترب موعد الحجز رقم ${orderNumber} (${formatDateTime(scheduledAt)}). أكّده الآن وإلا أُسند إلى فنّي آخر.`,
    };
  },

  /** تذكير العميل بتأكيد إتمام الخدمة قبل التأكيد التلقائي */
  confirmCompletionReminder(orderNumber: string, hoursLeft: number): NotificationContent {
    return {
      title: 'أكّد إتمام الخدمة',
      body: `أنهى الفنّي الخدمة للطلب رقم ${orderNumber}. أكّد إتمامها خلال ${hoursLeft} ساعة، وإلا سيُؤكَّد تلقائياً.`,
    };
  },

  /** أُكّد الإتمام تلقائياً بعد انقضاء مهلة العميل */
  completionAutoConfirmed(orderNumber: string): NotificationContent {
    return {
      title: 'تم إغلاق الطلب تلقائياً',
      body: `لم يصلنا تأكيدك للطلب رقم ${orderNumber} خلال المهلة، فأُغلق تلقائياً. تواصل مع الدعم إن كان لديك اعتراض.`,
    };
  },

  /** أُسند الطلب إلى المزوّد */
  orderAssignedToProvider(orderNumber: string): NotificationContent {
    return {
      title: 'تم إسناد طلب إليك',
      body: `تم إسناد الطلب رقم ${orderNumber} إليك، يرجى مراجعة التفاصيل والبدء.`,
    };
  },

  /** رسالة محادثة جديدة */
  newChatMessage(preview: string, senderName?: string | null): NotificationContent {
    const from = senderName?.trim();
    return {
      title: 'رسالة جديدة',
      body: from ? `${from}: ${preview}` : preview,
    };
  },

  /** مزوّد جديد بانتظار الموافقة — إشعار للإدارة */
  providerRegistrationPending(providerName: string): NotificationContent {
    return {
      title: 'طلب تسجيل مزوّد جديد',
      body: `المزوّد "${providerName}" بانتظار مراجعة طلب التسجيل والموافقة عليه.`,
    };
  },

  /** قُبل تسجيل المزوّد */
  providerApproved(): NotificationContent {
    return {
      title: 'تمت الموافقة على حسابك 🎉',
      body: 'أهلاً بك في كار هيرو! حسابك مفعّل الآن ويمكنك البدء باستقبال الطلبات.',
    };
  },

  /** رُفض تسجيل المزوّد */
  providerRejected(reason?: string | null): NotificationContent {
    const trimmed = typeof reason === 'string' ? reason.trim() : '';
    return {
      title: 'تحديث على طلب التسجيل',
      body: trimmed
        ? `نأسف، لم تتم الموافقة على طلب تسجيلك. السبب: ${trimmed}`
        : 'نأسف، لم تتم الموافقة على طلب تسجيلك. يرجى التواصل مع الدعم لمعرفة التفاصيل.',
    };
  },

  /** حجز غسيل دوري تم إنشاؤه تلقائياً */
  recurringWashBooked(scheduledAt?: Date | string | null): NotificationContent {
    return {
      title: 'تم حجز موعد الغسيل الدوري',
      body: `موعد الغسيل القادم لسيارتك: ${formatDateTime(scheduledAt)}`,
    };
  },
};
