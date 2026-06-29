import { InternalServerErrorException } from '@nestjs/common';
import { OtpService } from './otp.service';
import { SUCCESS_MESSAGES } from '../../../../core/constants';
import { OtpUtil } from '../../../../core/utils/otp.util';

describe('OtpService', () => {
  let userModel: any;
  let pendingRegistrationModel: any;
  let whatsAppService: any;
  let service: OtpService;

  beforeEach(() => {
    userModel = {
      findOne: jest.fn(),
      updateOne: jest.fn(),
    };
    pendingRegistrationModel = {
      findOne: jest.fn(),
      updateOne: jest.fn(),
    };
    whatsAppService = {
      isClientReady: jest.fn(),
      sendMessage: jest.fn(),
    };

    service = new OtpService(
      userModel,
      pendingRegistrationModel,
      whatsAppService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('generates, saves, and sends a pending registration OTP through WhatsApp', async () => {
    jest.spyOn(OtpUtil, 'generate').mockReturnValue('654321');
    whatsAppService.isClientReady.mockReturnValue(true);
    pendingRegistrationModel.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });
    pendingRegistrationModel.updateOne.mockResolvedValue({ matchedCount: 1 });

    await service.generateAndSaveForPending('+963991234567');

    expect(pendingRegistrationModel.updateOne).toHaveBeenCalledWith(
      { phoneNumber: '+963991234567' },
      {
        $set: {
          otpCode: '654321',
          otpExpiresAt: expect.any(Date),
          otpAttempts: 0,
        },
      },
    );
    expect(whatsAppService.isClientReady).toHaveBeenCalledTimes(1);
    expect(whatsAppService.sendMessage).toHaveBeenCalledWith(
      '+963991234567',
      expect.stringContaining('654321'),
    );
  });

  it('does not save or send a pending OTP when WhatsApp is not ready', async () => {
    whatsAppService.isClientReady.mockReturnValue(false);
    pendingRegistrationModel.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.generateAndSaveForPending('+963991234567'),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    expect(pendingRegistrationModel.updateOne).not.toHaveBeenCalled();
    expect(whatsAppService.sendMessage).not.toHaveBeenCalled();
  });

  it('clears a pending OTP if WhatsApp sending fails after saving it', async () => {
    jest.spyOn(OtpUtil, 'generate').mockReturnValue('654321');
    whatsAppService.isClientReady.mockReturnValue(true);
    whatsAppService.sendMessage.mockRejectedValue(new Error('send failed'));
    pendingRegistrationModel.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });
    pendingRegistrationModel.updateOne.mockResolvedValue({ matchedCount: 1 });

    await expect(
      service.generateAndSaveForPending('+963991234567'),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    expect(pendingRegistrationModel.updateOne).toHaveBeenNthCalledWith(
      2,
      { phoneNumber: '+963991234567' },
      {
        $set: {
          otpCode: null,
          otpExpiresAt: null,
          otpAttempts: 0,
        },
      },
    );
  });

  it('generates, saves, and sends an existing user OTP through WhatsApp', async () => {
    jest.spyOn(OtpUtil, 'generate').mockReturnValue('789012');
    whatsAppService.isClientReady.mockReturnValue(true);
    userModel.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });
    userModel.updateOne.mockResolvedValue({ matchedCount: 1 });

    await service.generateAndSave('+963991234567');

    expect(userModel.updateOne).toHaveBeenCalledWith(
      { phoneNumber: '+963991234567' },
      {
        $set: {
          otpCode: '789012',
          otpExpiresAt: expect.any(Date),
          otpAttempts: 0,
        },
      },
    );
    expect(whatsAppService.sendMessage).toHaveBeenCalledWith(
      '+963991234567',
      expect.stringContaining('789012'),
    );
  });

  it('rejects a resend request while the previous pending OTP is still inside the cooldown window', async () => {
    pendingRegistrationModel.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        otpExpiresAt: new Date(Date.now() + 4 * 60 * 1000),
      }),
    });

    await expect(
      service.generateAndSaveForPending('+963991234567'),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    expect(pendingRegistrationModel.updateOne).not.toHaveBeenCalled();
    expect(whatsAppService.sendMessage).not.toHaveBeenCalled();
  });

  it('creates the public OTP response shape', () => {
    expect(service.createResponse('+963991234567')).toEqual({
      message: SUCCESS_MESSAGES.AUTH.OTP_SENT,
      phoneNumber: '+963991234567',
      expiresIn: 300,
    });
  });

  it('delegates WhatsApp status checks to the WhatsApp service', async () => {
    whatsAppService.isClientReady.mockReturnValue(true);

    await expect(service.checkWhatsAppConnection()).resolves.toBe(true);
    expect(whatsAppService.isClientReady).toHaveBeenCalledTimes(1);
  });
});
