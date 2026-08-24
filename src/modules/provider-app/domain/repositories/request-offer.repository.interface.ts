import { OfferStatus, RequestOfferEntity } from '../entities/request-offer.entity';

export interface CreateRequestOfferData {
  orderId: string;
  providerId: string;
  orderNumber: string;
  attempt: number;
  round: number;
  expiresAt: Date;
  distanceMeters?: number;
  etaMinutes?: number;
}

export interface CloseRequestOfferData {
  status: OfferStatus;
  reason?: string;
}

export interface CloseRequestOfferOptions {
  /**
   * يشترط أن تكون المهلة سارية لحظة الكتابة.
   *
   * القبول وحده يحتاجه: «مفتوح» في قاعدة البيانات تعني `status = offered` فقط،
   * وقد تكون المهلة انقضت دون أن يمرّ المسح الدوري بعد. بدون هذا الشرط كان
   * القبول المتأخّر ينجح على عرض ميّت.
   */
  requireUnexpired?: boolean;
}

export const IRequestOfferRepository = Symbol('IRequestOfferRepository');

export interface IRequestOfferRepository {
  create(data: CreateRequestOfferData): Promise<RequestOfferEntity>;

  findById(id: string): Promise<RequestOfferEntity | null>;

  /** آخر عرض مفتوح على هذا الفنّي — هو ما تعرضه شاشة «طلب وارد» */
  findOpenForProvider(providerId: string): Promise<RequestOfferEntity | null>;

  /** العرض المفتوح لهذا الطلب على هذا الفنّي تحديداً */
  findOpenForOrderAndProvider(orderId: string, providerId: string): Promise<RequestOfferEntity | null>;

  /**
   * الفنّيون الذين لا يجوز عرض هذا الطلب عليهم الآن:
   * من رفض صراحةً في أي جولة (قال لا)، ومن جُرّب في هذه الجولة أياً كانت
   * نتيجته. من انقضت مهلته في جولة سابقة **ليس منهم** — ربما كان يقود.
   */
  findExcludedProviderIds(orderId: string, round: number): Promise<string[]>;

  /** عدد العروض التي أُطلقت في هذه الجولة — سقفها `maxDispatchAttempts` */
  countAttemptsInRound(orderId: string, round: number): Promise<number>;

  /** العروض التي ما تزال مفتوحة على هذا الطلب */
  findOpenForOrder(orderId: string): Promise<RequestOfferEntity[]>;

  /**
   * كل فنّي يحمل عرضاً حيّاً الآن — على **أي** طلب كان.
   *
   * الفنّي أثناء نافذة ردّه موردٌ محجوز: عرضٌ ثانٍ يصله يستبدل الأول على شاشته
   * ويُعيد العدّاد من أوّله، فيجد نفسه ينظر إلى طلب غير الذي كان يقرّر بشأنه.
   * والطلب الأول يبقى معروضاً عليه في الخادم حتى تنقضي مهلته كاملةً — نافذة
   * تُحرق على فنّي لم يرَ الطلب أصلاً، وعميلٌ ينتظرها بلا سبب.
   *
   * المنتهية مهلتها لا تُحسب: صاحبها فارغ اليدين وإن لم يمرّ المسح عليه بعد.
   */
  findProviderIdsWithOpenOffers(): Promise<string[]>;

  /** أعلى رقم محاولة سُجّل لهذا الطلب */
  countAttempts(orderId: string): Promise<number>;

  /**
   * إغلاق ذرّي: يُغلق العرض فقط إن كان ما يزال مفتوحاً. القبول والانتهاء قد
   * يتسابقان (ضغطة الفنّي مقابل مسح المهلة)، والإغلاق غير الشرطي كان يسمح
   * للاثنين بالنجاح معاً.
   */
  closeIfOpen(
    id: string,
    data: CloseRequestOfferData,
    options?: CloseRequestOfferOptions,
  ): Promise<RequestOfferEntity | null>;

  /** إغلاق كل عروض هذا الطلب التي ما تزال مفتوحة (عند الإلغاء أو الإسناد) */
  closeAllOpenForOrder(orderId: string, data: CloseRequestOfferData): Promise<number>;

  /**
   * ردّ عرضٍ سُجّل «مقبولاً» ثم تبيّن أن الطلب لم يعد متاحاً.
   *
   * الفوز بالعرض ذرّي لكنه لا يقفل الطلب: قد يُلغيه العميل في نفس اللحظة، فيبقى
   * العرض «مقبولاً» فوق طلب ملغى — يُحسب قبولاً في التقارير ولم يقع.
   *
   * مشروط بـ`accepted` عمداً: لا يردّ إلا ما سجّلناه نحن قبل سطور، فلا يتحوّل
   * إلى كتابة غير مشروطة تدهس نتيجة مسارٍ آخر.
   */
  releaseAccepted(id: string, reason: string): Promise<RequestOfferEntity | null>;

  /** العروض التي انقضت مهلتها وما تزال مفتوحة — تقرؤها مهمّة المسح الدورية */
  findExpired(now: Date, limit: number): Promise<RequestOfferEntity[]>;
}
