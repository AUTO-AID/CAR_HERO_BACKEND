import { BadRequestException } from '@nestjs/common';
import { AdminProvidersService } from './admin-providers.service';
import { RegistrationStatus } from '../../../../core/enums/status.enum';

/**
 * `registrationStatus` تعرضه اللوحة وتَعدّ به، و`isApproved` يُرشّح عليه
 * التوزيع. افتراقهما ينتج فنّياً «معتمَداً» في كل شاشة ولا يصله طلب واحد —
 * بلا خطأ ولا إشارة، فقط شكوى لا تفسير لها.
 */
describe('AdminProvidersService · approval flag invariant', () => {
  // الدالة خاصّة عمداً؛ نناديها مباشرةً لأن ما نختبره هو القاعدة لا المسار
  const align = (update: Record<string, any>) => {
    (AdminProvidersService.prototype as any).alignApprovalFlags.call(null, update);
    return update;
  };

  it('derives isApproved from registrationStatus', () => {
    expect(align({ registrationStatus: RegistrationStatus.APPROVED }).isApproved).toBe(true);
    expect(align({ registrationStatus: RegistrationStatus.PENDING }).isApproved).toBe(false);
  });

  it('derives registrationStatus from isApproved', () => {
    expect(align({ isApproved: true }).registrationStatus).toBe(RegistrationStatus.APPROVED);
    expect(align({ isApproved: false }).registrationStatus).toBe(RegistrationStatus.PENDING);
  });

  it('stops a rejected provider from staying eligible for dispatch', () => {
    // الرفض بلا `isActive: false` يُبقيه مرشّحاً في `queryCandidates`
    const out = align({ registrationStatus: RegistrationStatus.REJECTED });
    expect(out.isApproved).toBe(false);
    expect(out.isActive).toBe(false);
    expect(out.accountStatus).toBe('suspended');
  });

  it('refuses a contradictory pair instead of silently picking one', () => {
    expect(() =>
      align({ registrationStatus: RegistrationStatus.APPROVED, isApproved: false }),
    ).toThrow(BadRequestException);
  });

  it('accepts a matching pair', () => {
    expect(() =>
      align({ registrationStatus: RegistrationStatus.APPROVED, isApproved: true }),
    ).not.toThrow();
  });

  it('leaves an update that touches neither field alone', () => {
    const out = align({ businessName: 'ورشة النخبة' });
    expect(out).toEqual({ businessName: 'ورشة النخبة' });
  });
});
