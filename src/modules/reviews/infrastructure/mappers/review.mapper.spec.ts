import { Types } from 'mongoose';
import { ReviewEntity } from '../../domain/entities/review.entity';
import { ReviewMapper } from './review.mapper';

/**
 * حارس تراجع: `toPersistence` مرّرت `user`/`provider`/`order` نصوصاً خامة
 * لأشهر، وMongoose لم يحوّلها تلقائياً رغم تصريح المخطّط بـ`Types.ObjectId`
 * (`SchemaFactory.createForClass` لا يترجم ذلك التصريح فعلياً هنا). النتيجة
 * كانت مراجعات تفلت من فهرس `order_1 unique` فتصطدم محاولة لاحقة بخطأ
 * E11000 خام بدل رسالة عربية — مؤكَّد عبر ثماني وثائق حقيقية في القاعدة.
 */
describe('ReviewMapper.toPersistence', () => {
  it('يحوّل user و provider و order إلى ObjectId فعلي لا نصّ', () => {
    const entity = ReviewEntity.create({
      user: '6a902f11d5e37fd947a52c8f',
      provider: '6a8ff309332dab3fafba9057',
      order: '6a90a5c1d5e37fd947a566ff',
      rating: 5,
    });

    const persistence = ReviewMapper.toPersistence(entity);

    expect(persistence.user).toBeInstanceOf(Types.ObjectId);
    expect(persistence.provider).toBeInstanceOf(Types.ObjectId);
    expect(persistence.order).toBeInstanceOf(Types.ObjectId);
    expect(persistence.user.toString()).toBe('6a902f11d5e37fd947a52c8f');
    expect(persistence.order.toString()).toBe('6a90a5c1d5e37fd947a566ff');
  });

  it('order يبقى undefined حين يغيب — لا يُجبَر على ObjectId فارغ', () => {
    const entity = ReviewEntity.create({
      user: '6a902f11d5e37fd947a52c8f',
      provider: '6a8ff309332dab3fafba9057',
      rating: 5,
    });

    const persistence = ReviewMapper.toPersistence(entity);

    expect(persistence.order).toBeUndefined();
  });
});
