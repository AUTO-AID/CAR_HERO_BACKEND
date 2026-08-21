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
     * ثلاثون لا عشرون: الفنّي قد يكون يقود أو يداه تحت سيارة. والزيادة عنها
     * تتراكم — خمس محاولات × 45 ثانية تعني أربع دقائق يقضيها العميل ينظر إلى
     * «جارٍ البحث»، ومعظم القبولات تقع في العشر الأولى على أي حال.
     */
    offerWindowSeconds: parseInt(process.env.PROVIDER_OFFER_WINDOW_SECONDS || '30', 10),
    // كم فنّياً نجرّب داخل الجولة الواحدة قبل انتظار الجولة التالية.
    maxDispatchAttempts: parseInt(process.env.PROVIDER_MAX_DISPATCH_ATTEMPTS || '5', 10),
    // الفاصل الذي يوصي به الخادم للتطبيق لإرسال الموقع أثناء الطلب النشِط.
    locationIntervalSeconds: parseInt(process.env.PROVIDER_LOCATION_INTERVAL_SECONDS || '15', 10),
    /**
     * أنصاف أقطار البحث بالترتيب. نطاق ثابت واحد (25 كم) كان قد يعرض الطلب
     * على فنّي يبعد 24 كم — نحو ساعة قيادة في زحام دمشق — بينما فنّي على بُعد
     * 3 كم كان مشغولاً لثلاثين ثانية فقط. التدرّج يمنح القريب أولوية حقيقية
     * ولا يتّسع إلا حين لا يوجد أحد.
     */
    dispatchRadiiKm: (process.env.PROVIDER_DISPATCH_RADII_KM || '10,20,30')
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
     * تأكيد إتمام الخدمة تلقائياً. حجز أرباح الفنّي رهينة فعلٍ لا مصلحة
     * للعميل في أدائه ظلمٌ ومصدر شكاوى — والتذكير يمنحه فرصة حقيقية أولاً.
     */
    autoConfirmAfterHours: parseInt(process.env.ORDER_AUTO_CONFIRM_AFTER_HOURS || '24', 10),
    confirmReminderAfterHours: parseInt(process.env.ORDER_CONFIRM_REMINDER_AFTER_HOURS || '2', 10),
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
