import { Injectable, Inject, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { BookingStatus } from '../../domain/enums/booking-status.enum';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { Booking } from '../../domain/entities/booking.entity';
import { IWalletRepository } from '../../../../modules/wallet/domain/repositories/wallet.repository.interface';
import { Transaction } from '../../../../modules/wallet/domain/entities/transaction.entity';
import { TransactionType } from '../../../../common/enums/status.enum';

@Injectable()
export class CancelBookingUseCase {
  constructor(
    @Inject('IBookingRepository')
    private readonly bookingRepository: IBookingRepository,
    @Inject('IWalletRepository')
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(bookingId: string, cancelledBy: string, reason: string, isUser: boolean): Promise<Booking> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');

    // SECURITY: IDOR Prevention
    if (isUser && booking.user !== cancelledBy) {
      throw new UnauthorizedException('You are not authorized to cancel this booking. Ownership mismatch.');
    }

    if (!isUser && booking.provider !== cancelledBy) {
      throw new UnauthorizedException('You are not authorized to cancel this booking. Assignment mismatch.');
    }

    // BUSINESS RULES Security: Cannot cancel if it's already past ACCEPTED (e.g., in progress or on the way)
    const activeStatuses = [BookingStatus.ON_THE_WAY, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED];
    if (activeStatuses.includes(booking.status)) {
      throw new BadRequestException('Booking cannot be cancelled once the provider is on the way or has started work.');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled.');
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancelledBy = cancelledBy;
    booking.cancellationReason = reason;

    const updated = await this.bookingRepository.update(bookingId, {
      status: booking.status,
      cancelledAt: booking.cancelledAt,
      cancelledBy: booking.cancelledBy,
      cancellationReason: booking.cancellationReason,
    }) as Booking;

    // 💰 Refund Logic: If booking was paid, return money to user wallet
    if (booking.paymentStatus === PaymentStatus.PAID && booking.total > 0 && booking.user) {
        await this.walletRepository.executeTransaction(booking.user, 'user', async (wallet, session) => {
          const balanceBefore = wallet.balance;
          wallet.deposit(booking.total);
          const balanceAfter = wallet.balance;
  
          const transaction = new Transaction(
            Transaction.generateTransactionNumber(),
            wallet.id!,
            wallet.ownerId,
            wallet.ownerType,
            TransactionType.REFUND,
            booking.total,
            balanceBefore,
            balanceAfter,
            `Refund for cancelled booking #${booking.bookingNumber}`,
            undefined,
            'booking',
            booking.id,
            undefined,
            undefined,
            'completed'
          );
  
          return { wallet, transaction };
        });
  
        // Update payment status to REFUNDED
        await this.bookingRepository.update(bookingId, { paymentStatus: PaymentStatus.REFUNDED });
      }

    return updated;
  }
}
