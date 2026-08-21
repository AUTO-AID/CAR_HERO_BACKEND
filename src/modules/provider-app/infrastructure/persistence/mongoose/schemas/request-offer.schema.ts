/**
 * RequestOffer Schema
 * سجلّ عرض الطلب على فنّي ضمن نافذة زمنية محدودة.
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OfferStatus } from '../../../../domain/entities/request-offer.entity';

export type RequestOfferDocument = RequestOffer & Document;

@Schema({
  timestamps: true,
  collection: 'requestoffers',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: any) => {
      delete ret.__v;
      return ret;
    },
  },
})
export class RequestOffer {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  order!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Provider', required: true })
  provider!: Types.ObjectId;

  @Prop({ required: true })
  orderNumber!: string;

  @Prop({ type: String, enum: OfferStatus, default: OfferStatus.OFFERED })
  status!: OfferStatus;

  /** رقم المحاولة على هذا الطلب — يزيد مع كل إعادة توزيع */
  @Prop({ default: 1 })
  attempt!: number;

  /**
   * الجولة التي وقع فيها هذا العرض.
   *
   * الجولة = مرور كامل على أنصاف الأقطار. وهي ما يفرّق بين نوعَي الاستبعاد:
   * من **رفض صراحةً** يبقى مستبعَداً من الطلب كلّه (قال لا)، ومن **انقضت
   * مهلته** يُعاد تجربته في الجولة التالية (ربما كان يقود).
   */
  @Prop({ default: 1 })
  round!: number;

  @Prop({ required: true, default: () => new Date() })
  offeredAt!: Date;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop()
  respondedAt?: Date;

  @Prop()
  distanceMeters?: number;

  @Prop()
  etaMinutes?: number;

  @Prop()
  reason?: string;
}

export const RequestOfferSchema = SchemaFactory.createForClass(RequestOffer);

// عرض واحد فقط لكل (طلب، فنّي، جولة): يمنع ازدواج العرض إن أُعيد إطلاق حدث
// الإنشاء أو تسابقت مهمّة المسح مع إعادة التوزيع — ويسمح في الوقت نفسه بعرضٍ
// جديد على الفنّي ذاته في جولة لاحقة.
RequestOfferSchema.index({ order: 1, provider: 1, round: 1 }, { unique: true });

// مسح المهل الدوري يقرأ بـ (status, expiresAt)، وشاشة «طلب وارد» بـ
// (provider, status).
RequestOfferSchema.index({ status: 1, expiresAt: 1 });
RequestOfferSchema.index({ provider: 1, status: 1, offeredAt: -1 });
RequestOfferSchema.index({ order: 1, offeredAt: -1 });
