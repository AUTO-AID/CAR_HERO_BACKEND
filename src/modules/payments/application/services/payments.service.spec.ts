import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { PaymentsService } from './payments.service';
import { ChamCashService } from './cham-cash.service';
import { PaymentIntentRepository } from '../../infrastructure/repositories/payment-intent.repository';
import { Order } from '../../../orders/infrastructure/persistence/mongoose/schemas/order.schema';
import { PaymentStatus } from '../../../../core/enums/status.enum';

const ORDER_ID = new Types.ObjectId().toString();
const USER_ID = new Types.ObjectId().toString();

describe('PaymentsService · order payments via Cham Cash', () => {
  let service: PaymentsService;

  const intents = { create: jest.fn(), findByReferenceId: jest.fn(), updateStatus: jest.fn() };
  const chamCash = {
    generateCheckoutUrl: jest.fn().mockReturnValue('https://gateway.test/checkout'),
    verifySignature: jest.fn().mockReturnValue(true),
  };
  const wallets = { executeTransaction: jest.fn() };
  const orders = { findOne: jest.fn(), findOneAndUpdate: jest.fn() };

  const selectLean = (value: unknown) => ({
    select: () => ({ lean: () => ({ exec: () => Promise.resolve(value) }) }),
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    chamCash.verifySignature.mockReturnValue(true);
    chamCash.generateCheckoutUrl.mockReturnValue('https://gateway.test/checkout');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PaymentIntentRepository, useValue: intents },
        { provide: ChamCashService, useValue: chamCash },
        { provide: 'IWalletRepository', useValue: wallets },
        { provide: getModelToken(Order.name), useValue: orders },
      ],
    }).compile();

    service = module.get(PaymentsService);
  });

  describe('initializePayment', () => {
    it('charges the order balance, not the amount the client sent', async () => {
      orders.findOne.mockReturnValue(
        selectLean({ payableAmount: 50_000, paymentStatus: PaymentStatus.PENDING }),
      );
      intents.create.mockImplementation((doc: any) => Promise.resolve({ id: 'i1', ...doc }));

      await service.initializePayment(USER_ID, 100, 'order_payment', ORDER_ID);

      expect(intents.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 50_000 }));
      expect(chamCash.generateCheckoutUrl).toHaveBeenCalledWith(expect.any(String), 50_000);
    });

    it('still trusts the client amount for a wallet top-up', async () => {
      intents.create.mockImplementation((doc: any) => Promise.resolve({ id: 'i2', ...doc }));

      await service.initializePayment(USER_ID, 7_500, 'wallet_topup');

      expect(orders.findOne).not.toHaveBeenCalled();
      expect(intents.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 7_500 }));
    });

    it('refuses an order payment without a usable order id', async () => {
      await expect(service.initializePayment(USER_ID, 100, 'order_payment', 'not-an-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it("refuses an order that is not the caller's", async () => {
      orders.findOne.mockReturnValue(selectLean(null));

      await expect(service.initializePayment(USER_ID, 100, 'order_payment', ORDER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('refuses an order already settled', async () => {
      orders.findOne.mockReturnValue(
        selectLean({ payableAmount: 50_000, paymentStatus: PaymentStatus.COMPLETED }),
      );

      await expect(service.initializePayment(USER_ID, 100, 'order_payment', ORDER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('refuses an order whose balance loyalty points already cleared', async () => {
      orders.findOne.mockReturnValue(selectLean({ payableAmount: 0, paymentStatus: PaymentStatus.PENDING }));

      await expect(service.initializePayment(USER_ID, 100, 'order_payment', ORDER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('handleWebhook', () => {
    const success = { referenceId: 'REF-1', status: 'success', transactionId: 'TXN-9' };

    it('settles the order and records platform earnings', async () => {
      intents.findByReferenceId.mockResolvedValue({
        id: 'i1',
        userId: USER_ID,
        amount: 50_000,
        purpose: 'order_payment',
        status: 'pending',
        targetId: ORDER_ID,
      });
      orders.findOneAndUpdate.mockReturnValue({
        exec: () => Promise.resolve({ _id: new Types.ObjectId(ORDER_ID), orderNumber: 'CH-1' }),
      });
      wallets.executeTransaction.mockResolvedValue(undefined);

      await service.handleWebhook(success, 'sig');

      const [[filter, update]] = orders.findOneAndUpdate.mock.calls;
      expect(filter.paymentStatus).toEqual({ $ne: PaymentStatus.COMPLETED });
      expect(update.$set.paymentMethod).toBe('cham_cash');
      expect(update.$set.paymentStatus).toBe(PaymentStatus.COMPLETED);
      expect(wallets.executeTransaction).toHaveBeenCalled();
    });

    it('does not double-credit when the gateway retries', async () => {
      intents.findByReferenceId.mockResolvedValue({
        id: 'i1',
        userId: USER_ID,
        amount: 50_000,
        purpose: 'order_payment',
        status: 'pending',
        targetId: ORDER_ID,
      });
      // الاستعلام المشروط لا يطابق شيئاً حين يكون الطلب مدفوعاً أصلاً
      orders.findOneAndUpdate.mockReturnValue({ exec: () => Promise.resolve(null) });

      await service.handleWebhook(success, 'sig');

      expect(wallets.executeTransaction).not.toHaveBeenCalled();
    });

    it('rejects an unsigned webhook', async () => {
      chamCash.verifySignature.mockReturnValue(false);

      await expect(service.handleWebhook(success, 'bad')).rejects.toThrow(BadRequestException);
      expect(orders.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });
});
