import { Reflector } from '@nestjs/core';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../../../../core/constants';
import { Role } from '../../../../core/enums/roles.enum';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { OrdersController } from './orders.controller';

/**
 * ثلاثة مسارات إدارية كانت محروسة بـ`JwtAuthGuard` وحده — وهو يُثبت **مَن**
 * المستخدم لا **ما يحقّ له**. وحالات الاستخدام خلفها لا تستقبل `currentUser`
 * إطلاقاً (لا ملكية تُفحص ولا ترشيح يُطبَّق)، فكان أي عميل مسجَّل يقرأ طلبات
 * النظام كلّها — و`search` يعمل `$lookup` على users و providers فتعود أسماء
 * العملاء وأرقام هواتفهم.
 *
 * الاختبار على البيانات الوصفية لا على النداء: الحارس يعمل في طبقة Nest قبل
 * أن يصل الطلب إلى الدالّة، فاستدعاؤها مباشرةً في اختبار وحدة يتخطّاه ولا
 * يثبت شيئاً. ما يهمّ أن يبقى الوسم موجوداً في المستقبل.
 */
describe('OrdersController — admin-only surface', () => {
  const reflector = new Reflector();

  const guardsOn = (handler: any) => Reflect.getMetadata(GUARDS_METADATA, handler) ?? [];
  const rolesOn = (handler: any) => reflector.get<string[]>(ROLES_KEY, handler) ?? [];

  describe.each([
    ['searchOrders', OrdersController.prototype.searchOrders],
    ['exportReport', OrdersController.prototype.exportReport],
    ['getStats', OrdersController.prototype.getStats],
  ])('%s', (_name, handler) => {
    it('runs the RolesGuard alongside the JWT guard', () => {
      expect(guardsOn(handler)).toEqual(expect.arrayContaining([JwtAuthGuard, RolesGuard]));
    });

    it('requires the admin role', () => {
      expect(rolesOn(handler)).toContain(Role.ADMIN);
    });
  });

  // القائمة العادية تبقى مفتوحة للجميع: ترشيحها بالملكية مكتوب داخل الدالّة
  // نفسها (`req.user.role !== 'admin'` → طلباتي فقط)، فلا يصحّ إغلاقها.
  it('leaves the ownership-filtered list open to every authenticated caller', () => {
    expect(rolesOn(OrdersController.prototype.getAllOrders)).toHaveLength(0);
    expect(guardsOn(OrdersController.prototype.getAllOrders)).not.toContain(RolesGuard);
  });
});
