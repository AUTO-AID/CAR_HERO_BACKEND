import { OrderStatus } from '../../../../core/enums/status.enum';
import { OrderEntity } from '../entities/order.entity';

export interface ProviderTrackingUpdate {
  coordinates: number[];
  accuracy?: number;
  heading?: number;
  speed?: number;
}

export interface IOrderRepository {
  create(order: Partial<OrderEntity>): Promise<OrderEntity>;
  findById(id: string): Promise<OrderEntity | null>;
  findByOrderNumber(orderNumber: string): Promise<OrderEntity | null>;
  findByCriteria(criteria: any, pagination: { page: number; limit: number }): Promise<{ orders: OrderEntity[]; total: number }>;
  update(id: string, data: Partial<OrderEntity>): Promise<OrderEntity>;
  delete(id: string): Promise<boolean>;
  search(query: string): Promise<OrderEntity[]>;
  getStats(period: string): Promise<any>;
  findByDateRange(from: Date, to: Date, status?: string): Promise<OrderEntity[]>;
  addReview(id: string, rating: number, comment?: string): Promise<OrderEntity>;
  updateProviderLocation(id: string, tracking: ProviderTrackingUpdate): Promise<OrderEntity>;
  updatePaymentDetails(id: string, paymentId: string, paymentMethod?: string): Promise<OrderEntity>;
  cancelOrder(id: string, reason: string, cancelledBy?: string): Promise<OrderEntity>;
  findExpiredPendingOrders(hours: number): Promise<OrderEntity[]>;

  /**
   * الفنّيون المرتبطون بطلب في إحدى الحالات المعطاة — أي المنشغلون الآن.
   *
   * الحالات تُمرَّر ولا تُثبَّت هنا: أيّها «يشغل الفنّي» قرارُ نطاقٍ يخصّ
   * المُنادي، وتثبيتها كان يجعل كل استعمال مختلف يحتاج دالّة ثانية.
   *
   * مشتركة بين `create-order` (ليختار مرشّحاً أوّل يستطيع القبول فعلاً) و
   * `ProviderDispatchService` (ليستبعد المنشغلين من كل جولة). نسختان من
   * الاستعلام نفسه هما ما تنشأ بينهما الفجوات — وهذه إحداها بالضبط.
   */
  findProviderIdsWithActiveOrders(statuses: OrderStatus[]): Promise<string[]>;

  /**
   * حجزُ ردّ نقاط الولاء على هذا الطلب — **علامةٌ بشرطٍ داخل الاستعلام**.
   *
   * يُرجع عدد النقاط لمن ظفر بالعلامة، و`0` لمن وجدها مرفوعة سلفاً. فرعُ الردّ
   * في `CancelOrderUseCase` كان شرطه وجود `metadata.pointsRedeemed` وحده، وهو
   * حقلٌ لا يُمسح عند الإلغاء — فكل نداء إلغاء يقرؤه فيردّ النقاط من جديد.
   *
   * وهو النمط نفسه الذي يحرس المنح في `AwardLoyaltyPointsUseCase`
   * (`metadata.loyaltyPointsAwarded`) و`fulfillOrderPayment` — ومسار الردّ كان
   * الطرف الوحيد من الاقتصاد بلا نظيره. وفحصٌ قبل الكتابة لا يكفي: نداءان
   * متزامنان يقرآن كلاهما «لم تُردّ» فيردّان.
   */
  claimPointsRefund(id: string): Promise<number>;

  /**
   * إعادة العلامة عند فشل الإيداع — كي لا يبقى الطلب مُعلَّماً بردٍّ لم يقع
   * فتضيع نقاط العميل صامتة. نظيرها في `AwardLoyaltyPointsUseCase`.
   */
  releasePointsRefundClaim(id: string): Promise<void>;
}

export const IOrderRepository = Symbol('IOrderRepository');
