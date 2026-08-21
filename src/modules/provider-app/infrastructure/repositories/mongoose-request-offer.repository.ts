import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OfferStatus, RequestOfferEntity } from '../../domain/entities/request-offer.entity';
import {
  CloseRequestOfferData,
  CloseRequestOfferOptions,
  CreateRequestOfferData,
  IRequestOfferRepository,
} from '../../domain/repositories/request-offer.repository.interface';
import { RequestOffer, RequestOfferDocument } from '../persistence/mongoose/schemas/request-offer.schema';

@Injectable()
export class MongooseRequestOfferRepository implements IRequestOfferRepository {
  constructor(
    @InjectModel(RequestOffer.name)
    private readonly offerModel: Model<RequestOfferDocument>,
  ) {}

  private mapToEntity(doc: any): RequestOfferEntity {
    return new RequestOfferEntity(
      doc._id.toString(),
      doc.order?._id?.toString() ?? doc.order?.toString(),
      doc.provider?._id?.toString() ?? doc.provider?.toString(),
      doc.orderNumber,
      doc.status,
      doc.attempt ?? 1,
      doc.round ?? 1,
      doc.offeredAt,
      doc.expiresAt,
      doc.respondedAt,
      doc.distanceMeters,
      doc.etaMinutes,
      doc.reason,
    );
  }

  private toObjectId(value: string): Types.ObjectId | null {
    return Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : null;
  }

  async create(data: CreateRequestOfferData): Promise<RequestOfferEntity> {
    const order = this.toObjectId(data.orderId);
    const provider = this.toObjectId(data.providerId);
    // معرّف غير صالح هنا يعني خطأ برمجياً لا مدخلاً من مستخدم: تمريره إلى
    // Mongoose كـ null كان يُنشئ عرضاً يتيماً لا يطابقه أي استعلام لاحق.
    if (!order || !provider) {
      throw new Error(`Invalid offer identifiers (order=${data.orderId}, provider=${data.providerId})`);
    }

    const doc = await this.offerModel.create({
      order,
      provider,
      orderNumber: data.orderNumber,
      status: OfferStatus.OFFERED,
      attempt: data.attempt,
      round: data.round,
      offeredAt: new Date(),
      expiresAt: data.expiresAt,
      distanceMeters: data.distanceMeters,
      etaMinutes: data.etaMinutes,
    });
    return this.mapToEntity(doc);
  }

  async findById(id: string): Promise<RequestOfferEntity | null> {
    const objectId = this.toObjectId(id);
    if (!objectId) return null;
    const doc = await this.offerModel.findById(objectId).lean().exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  async findOpenForProvider(providerId: string): Promise<RequestOfferEntity | null> {
    const provider = this.toObjectId(providerId);
    if (!provider) return null;
    const doc = await this.offerModel
      .findOne({ provider, status: OfferStatus.OFFERED, expiresAt: { $gt: new Date() } })
      .sort({ offeredAt: -1 })
      .lean()
      .exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  async findOpenForOrderAndProvider(orderId: string, providerId: string): Promise<RequestOfferEntity | null> {
    const order = this.toObjectId(orderId);
    const provider = this.toObjectId(providerId);
    if (!order || !provider) return null;
    const doc = await this.offerModel
      .findOne({ order, provider, status: OfferStatus.OFFERED })
      .sort({ attempt: -1 })
      .lean()
      .exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  async findExcludedProviderIds(orderId: string, round: number): Promise<string[]> {
    const order = this.toObjectId(orderId);
    if (!order) return [];
    const ids = await this.offerModel
      .distinct('provider', {
        order,
        // الرفض الصريح يُستبعد للأبد؛ وما جُرّب في هذه الجولة لا يُكرَّر فيها.
        $or: [{ status: OfferStatus.REJECTED }, { round }],
      })
      .exec();
    return ids.map((id: any) => id.toString());
  }

  async countAttemptsInRound(orderId: string, round: number): Promise<number> {
    const order = this.toObjectId(orderId);
    if (!order) return 0;
    return this.offerModel.countDocuments({ order, round }).exec();
  }

  async findOpenForOrder(orderId: string): Promise<RequestOfferEntity[]> {
    const order = this.toObjectId(orderId);
    if (!order) return [];
    const docs = await this.offerModel.find({ order, status: OfferStatus.OFFERED }).lean().exec();
    return docs.map((doc) => this.mapToEntity(doc));
  }

  async countAttempts(orderId: string): Promise<number> {
    const order = this.toObjectId(orderId);
    if (!order) return 0;
    return this.offerModel.countDocuments({ order }).exec();
  }

  async closeIfOpen(
    id: string,
    data: CloseRequestOfferData,
    options: CloseRequestOfferOptions = {},
  ): Promise<RequestOfferEntity | null> {
    const objectId = this.toObjectId(id);
    if (!objectId) return null;

    // الشرطان جزء من الاستعلام لا فحص سابق له: هو ما يجعل الإغلاق ذرّياً فلا
    // ينجح القبول ومسح المهلة معاً على العرض نفسه.
    const filter: Record<string, any> = { _id: objectId, status: OfferStatus.OFFERED };
    if (options.requireUnexpired) filter.expiresAt = { $gt: new Date() };

    const doc = await this.offerModel
      .findOneAndUpdate(
        filter,
        { $set: { status: data.status, reason: data.reason, respondedAt: new Date() } },
        { new: true },
      )
      .lean()
      .exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  async closeAllOpenForOrder(orderId: string, data: CloseRequestOfferData): Promise<number> {
    const order = this.toObjectId(orderId);
    if (!order) return 0;
    const result = await this.offerModel
      .updateMany(
        { order, status: OfferStatus.OFFERED },
        { $set: { status: data.status, reason: data.reason, respondedAt: new Date() } },
      )
      .exec();
    return result.modifiedCount ?? 0;
  }

  async findExpired(now: Date, limit: number): Promise<RequestOfferEntity[]> {
    const docs = await this.offerModel
      .find({ status: OfferStatus.OFFERED, expiresAt: { $lte: now } })
      .sort({ expiresAt: 1 })
      .limit(limit)
      .lean()
      .exec();
    return docs.map((doc) => this.mapToEntity(doc));
  }
}
