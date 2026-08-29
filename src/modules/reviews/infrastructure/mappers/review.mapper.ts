import { Types } from 'mongoose';
import { ReviewDocument } from '../../../../modules/reviews/infrastructure/persistence/mongoose/schemas/review.schema';
import { ReviewEntity } from '../../domain/entities/review.entity';

export class ReviewMapper {
  static toEntity(doc: ReviewDocument): ReviewEntity {
    return new ReviewEntity(
      doc._id.toString(),
      doc.user.toString(),
      doc.provider.toString(),
      doc.rating,
      doc.order?.toString(),
      doc.comment,
      doc.serviceQuality,
      doc.punctuality,
      doc.professionalism,
      doc.valueForMoney,
      doc.images,
      doc.providerResponse,
      doc.providerRespondedAt,
      doc.isVisible,
      doc.isFlagged,
      doc.flagReason,
      doc.helpfulCount,
      doc.helpfulVoters.map(v => v.toString()),
      (doc as any).createdAt,
      (doc as any).updatedAt,
    );
  }

  /**
   * `user`/`provider`/`order` يُحوَّلان صراحةً إلى ObjectId.
   *
   * `Review.order` مخطَّط بـ`@Prop({ type: Types.ObjectId, ref: 'Order' })`،
   * لكن `SchemaFactory.createForClass` في هذا المشروع لا يترجم هذا التصريح
   * إلى نوع يحوّل تلقائياً — يبقى الحقل `Mixed` عملياً، فتُحفَظ السلسلة النصّية
   * كما وصلت. النتيجة: مراجعة بحقل `order` نصّياً تفلت من فهرس
   * `order_1 unique` (النوع مختلف عن ObjectId في نظر MongoDB)، فيمرّ فحص
   * «هل رُوجعت هذه الخدمة من قبل؟» (`findByOrder`، الذي يحوّل بحثه صراحةً)
   * دون أن يجدها — ثم تصطدم المحاولة الثانية بخطأ E11000 مباشرةً من القاعدة
   * بدل رسالة عربية مفهومة.
   *
   * نفس الفخّ الذي وُثِّق وأُصلح في `mongoose-order.repository.ts` بمساعد
   * `toObjectId()`، وفي مستودعات المركبات والاشتراكات — الإصلاح هنا يطبّق
   * الدرس نفسه على آخر موضع كتابة لم يُصلَح.
   */
  static toPersistence(entity: ReviewEntity): any {
    return {
      user: new Types.ObjectId(entity.user),
      provider: new Types.ObjectId(entity.provider),
      order: entity.order ? new Types.ObjectId(entity.order) : undefined,
      rating: entity.rating,
      comment: entity.comment,
      serviceQuality: entity.serviceQuality,
      punctuality: entity.punctuality,
      professionalism: entity.professionalism,
      valueForMoney: entity.valueForMoney,
      images: entity.images,
      providerResponse: entity.providerResponse,
      providerRespondedAt: entity.providerRespondedAt,
      isVisible: entity.isVisible,
      isFlagged: entity.isFlagged,
      flagReason: entity.flagReason,
      helpfulCount: entity.helpfulCount,
      helpfulVoters: entity.helpfulVoters,
    };
  }
}
