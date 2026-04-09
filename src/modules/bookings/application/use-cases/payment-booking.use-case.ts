import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { Booking } from '../../domain/entities/booking.entity';
import { IWalletRepository } from '../../../../modules/wallet/domain/repositories/wallet.repository.interface';
import { Transaction } from '../../../../modules/wallet/domain/entities/transaction.entity';
import { TransactionType } from '../../../../common/enums/status.enum';

@Injectable()
export class PaymentBookingUseCase {
  constructor(
    @Inject('IBookingRepository')
    private readonly bookingRepository: IBookingRepository,
    @Inject('IWalletRepository')
    private readonly walletRepository: IWalletRepository,
  ) {}

  async getPrice(bookingId: string): Promise<{ total: number; subtotal: number; breakdown: any }> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');

    return {
      total: booking.total,
      subtotal: booking.subtotal,
      breakdown: { tax: booking.tax, discount: booking.discount }
    };
  }

  async pay(userId: string, bookingId: string, method: string): Promise<Booking> {
    const updated = await this.bookingRepository.update(bookingId, {
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: method,
    }) as Booking;

    // 💰 Transaction Record: Document the customer payment in the system
    if (updated.total > 0 && updated.user) {
        await this.walletRepository.executeTransaction('platform_earnings', 'system', async (platformWallet, session) => {
          const balanceBefore = platformWallet.balance;
          platformWallet.deposit(updated.total);
          const balanceAfter = platformWallet.balance;
  
          const transaction = new Transaction(
            Transaction.generateTransactionNumber(),
            platformWallet.id!,
            platformWallet.ownerId,
            platformWallet.ownerType,
            TransactionType.CREDIT,
            updated.total,
            balanceBefore,
            balanceAfter,
            `Payment for booking #${updated.bookingNumber}`,
            undefined,
            'booking',
            updated.id,
            method,
            undefined, // paymentId if available
            'completed'
          );
  
          return { wallet: platformWallet, transaction };
        });
      }

    return updated;
  }

  async usePoints(userId: string, bookingId: string, points: number): Promise<Booking> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');

    // Assume 1 point = 0.5 currency
    const discountAmount = points * 0.5;
    const newTotal = Math.max(0, booking.total - discountAmount);

    return await this.bookingRepository.update(bookingId, {
      discount: (booking.discount || 0) + discountAmount,
      total: newTotal,
      userNotes: (booking.userNotes || '') + ` (Used ${points} points)`
    }) as Booking;
  }
}
