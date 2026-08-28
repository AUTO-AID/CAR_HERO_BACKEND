/**
 * Environment Configuration
 * Centralized configuration management using @nestjs/config
 */
export default () => ({
  // Application settings
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || 'api/v1',
  },

  // MongoDB settings
  database: {
    // لا قيمة احتياطية محلية هنا: كانت تعني أن غياب MONGODB_URI يُسقط
    // النظام كله على قاعدة محلية بصمت. الغياب الآن يُوقف الإقلاع
    // برسالة صريحة من assertGlobalDatabase في mongo.config.
    uri: process.env.MONGODB_URI,
  },

  // JWT settings
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // OTP settings
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
  },

  // Provider mobile app (field operations)
  providerApp: {
    /**
     * نافذة الردّ على الطلب الوارد. الخادم هو من يحسمها لا مؤقّت التطبيق،
     * وإلا اختلف ما يراه الفنّي عمّا يقرّره الخادم عند أي تأخير شبكة.
     *
     * خمس وأربعون ثانية: الفنّي الذي يقود أو يداه تحت سيارة لا يلتقط هاتفه في
     * خمس عشرة ثانية، وفواتُ النافذة عنده يُكلّف العميل جولة توزيع كاملة لا
     * ثوانيَ معدودة. الثمن أن النافذة تتراكم على العميل — خمس محاولات تعني نحو
     * ثلاث دقائق ونصف أمام «جارٍ البحث» — ويحدّه أن الطلب ينتقل فوراً عند الرفض
     * أو انتهاء المهلة بلا انتظار دورة المسح.
     */
    offerWindowSeconds: parseInt(process.env.PROVIDER_OFFER_WINDOW_SECONDS || '45', 10),
    /**
     * نافذة الردّ على **الطلب الموجَّه** — وهو المسار الوحيد للطلب الفوري الآن:
     * العميل يرى أقرب ثلاثة ويختار واحداً بعينه (`ChooseProviderScreen`).
     *
     * ثلاثون ثانية لا خمس وأربعون: هنا لا يوجد بديل يُصعَّد إليه، فكل ثانية
     * تمرّ هي ثانية من عمر عميل واقف على الطريق ينتظر ردّ رجل واحد. وحين
     * ينقضي العدّاد يعود إلى قائمته ليختار غيره — فطول النافذة لا يشتري له
     * فرصة إضافية، بل يؤخّر اختياره التالي.
     *
     * وكانت تسعين ثانية **غير مصرَّح بها في هذا الملف أصلاً** — رقماً ساقطاً
     * داخل `ProviderDispatchService` لا يظهر لمن يقرأ الإعدادات ولا يُضبط من
     * البيئة.
     */
    directRequestWindowSeconds: parseInt(process.env.PROVIDER_DIRECT_REQUEST_WINDOW_SECONDS || '30', 10),
    // كم فنّياً نجرّب داخل الجولة الواحدة قبل انتظار الجولة التالية.
    // (الحجز المجدول وحده: الطلب الفوري يختاره العميل بنفسه بلا جولات.)
    maxDispatchAttempts: parseInt(process.env.PROVIDER_MAX_DISPATCH_ATTEMPTS || '5', 10),
    // الفاصل الذي يوصي به الخادم للتطبيق لإرسال الموقع أثناء الطلب النشِط.
    locationIntervalSeconds: parseInt(process.env.PROVIDER_LOCATION_INTERVAL_SECONDS || '15', 10),
    /**
     * سقف البحث الجغرافي — **نطاق واحد: عشرون كيلومتراً**، لا تدرّج.
     *
     * التدرّج (١٠ ← ٢٠ ← ٣٠) كان يخدم إسناداً آلياً يختار فيه الخادمُ فنّياً
     * واحداً ويصعّد عند الرفض: هناك كان توسيع النطاق هو الوسيلة الوحيدة لمنح
     * القريب أولوية على البعيد. أما الآن فالعميل يرى **أقرب ثلاثة داخل
     * العشرين** مرتّبين بالمسافة والسعر والتقييم ويختار بنفسه — فالأولوية
     * صارت بيده، والتدرّج لم يعد يشتري شيئاً سوى تعقيدٍ يُفسّر.
     *
     * والثلاثون أُسقطت لا اختُصرت: فنّي على بُعد ثلاثين كيلومتراً في زحام دمشق
     * يعني قرابة ساعة قيادة — وهو خيار لا يُقدَّم لمن سيّارته متعطّلة الآن.
     *
     * تبقى القائمة قائمةً لا رقماً: `radiiMeters` يمرّ عليها، وإضافة قيمة
     * ثانية من البيئة تُعيد التدرّج بلا تعديل شيفرة.
     */
    dispatchRadiiKm: (process.env.PROVIDER_DISPATCH_RADII_KM || '20')
      .split(',')
      .map((value) => parseInt(value.trim(), 10))
      .filter((value) => Number.isFinite(value) && value > 0),
    /**
     * الانتظار بين جولة وأخرى. قائمة المرشّحين تتغيّر كل دقيقة (فنّي ينهي
     * طلباً، آخر يفتح التطبيق)، فالاستسلام من أول جولة يُهدر ذلك.
     */
    roundIntervalSeconds: parseInt(process.env.PROVIDER_ROUND_INTERVAL_SECONDS || '60', 10),
    /**
     * سقف البحث كلّه. بعده يُلغى الطلب برسالة صريحة بدل تركه معلّقاً ساعتين
     * — والعميل واقف على الطريق.
     */
    searchDeadlineMinutes: parseInt(process.env.PROVIDER_SEARCH_DEADLINE_MINUTES || '10', 10),
    /**
     * الحجز المجدول: متى يتحوّل إلى تأكيد حيّ، ومتى يُقفل باب الاعتذار.
     * تسعون دقيقة لا ستّون: الستّون لا تكفي لإيجاد بديل ووصوله إن اعتذر
     * الفنّي المُسنَد.
     */
    bookingConfirmLeadMinutes: parseInt(process.env.PROVIDER_BOOKING_CONFIRM_LEAD_MINUTES || '90', 10),
    bookingDeclineCutoffMinutes: parseInt(process.env.PROVIDER_BOOKING_DECLINE_CUTOFF_MINUTES || '120', 10),
    /**
     * أقرب لحظة قبل الموعد يبقى فيها البحث عن بديل مجدياً — سقف الحجز، نظير
     * `searchDeadlineMinutes` للطلب الفوري.
     *
     * الحجز يُقاس بما **بقي** لا بما مضى: سقفٌ من لحظة بدء البحث لا معنى له على
     * موعد ثابت. وقياسه بمسطرة الفوري كان يُلغي كل حجز لم يؤكَّد حتماً — نافذة
     * التأكيد (ثلث ما تبقّى) تتجاوز العشر دقائق دائماً، فيقع الإلغاء وأمام
     * الحجز ساعة كاملة كانت تكفي لإيجاد بديل.
     */
    bookingDispatchFloorMinutes: parseInt(process.env.PROVIDER_BOOKING_DISPATCH_FLOOR_MINUTES || '30', 10),
    /**
     * تأكيد إتمام الخدمة تلقائياً. حجز أرباح الفنّي رهينة فعلٍ لا مصلحة
     * للعميل في أدائه ظلمٌ ومصدر شكاوى — والتذكير يمنحه فرصة حقيقية أولاً.
     */
    autoConfirmAfterHours: parseInt(process.env.ORDER_AUTO_CONFIRM_AFTER_HOURS || '24', 10),
    confirmReminderAfterHours: parseInt(process.env.ORDER_CONFIRM_REMINDER_AFTER_HOURS || '2', 10),
  },

  // Scheduled bookings
  booking: {
    /**
     * نافذة العمل المفترضة لمزوّد **لم يُسأل** عن ساعاته بعد.
     *
     * `workingHours` افتراضها `[]` في المخطّط، ومسار التسجيل عبر الموقع وحده
     * هو من يملؤها — فكل مزوّد جاء من غيره كان مغلقاً سبعة أيام في الأسبوع
     * إلى الأبد، ولا يُقبل لديه حجزٌ واحد.
     *
     * والقيمة هنا يجب أن تبقى مطابقة لـ`DEFAULT_WINDOW` في
     * `car-hero-app/src/services/scheduling.js`: التطبيق يبني فتحاته عليها،
     * وافتراقهما يعني فتحةً يعرضها التطبيق ويرفضها الخادم.
     */
    defaultWindow: {
      open: process.env.BOOKING_DEFAULT_OPEN || '09:00',
      close: process.env.BOOKING_DEFAULT_CLOSE || '21:00',
    },
  },

  // Firebase settings
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  },

  // SMS Provider settings
  sms: {
    provider: process.env.SMS_PROVIDER || 'twilio',
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    },
  },

  // Redis settings
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },

  // File upload settings
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    dest: process.env.UPLOAD_DEST || './uploads',
  },
});
