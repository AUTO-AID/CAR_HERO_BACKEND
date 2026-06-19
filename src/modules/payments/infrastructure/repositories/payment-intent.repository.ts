import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentIntentDocument } from '../persistence/mongoose/schemas/payment-intent.schema';
import { PaymentIntent } from '../../domain/entities/payment-intent.entity';

@Injectable()
export class PaymentIntentRepository {
  constructor(
    @InjectModel('PaymentIntentDocument') private readonly model: Model<PaymentIntentDocument>
  ) {}

  private mapToDomain(doc: PaymentIntentDocument): PaymentIntent {
    return new PaymentIntent(
      doc._id.toString(),
      doc.userId.toString(),
      doc.amount,
      doc.purpose,
      doc.status,
      doc.currency,
      doc.referenceId,
      doc.gatewayUrl,
      doc.targetId,
      doc.metadata,
      (doc as any).createdAt,
      (doc as any).updatedAt,
    );
  }

  async create(data: Partial<PaymentIntent>): Promise<PaymentIntent> {
    const doc = new this.model(data);
    await doc.save();
    return this.mapToDomain(doc);
  }

  async findByReferenceId(referenceId: string): Promise<PaymentIntent | null> {
    const doc = await this.model.findOne({ referenceId });
    return doc ? this.mapToDomain(doc) : null;
  }

  async updateStatus(referenceId: string, status: 'success' | 'failed'): Promise<PaymentIntent> {
    const doc = await this.model.findOneAndUpdate(
      { referenceId },
      { $set: { status } },
      { new: true }
    );
    if (!doc) throw new NotFoundException('Payment intent not found');
    return this.mapToDomain(doc);
  }
}
