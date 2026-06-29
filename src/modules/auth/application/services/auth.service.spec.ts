import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../../../core/constants';

describe('AuthService OTP flow', () => {
  let userModel: any;
  let providerModel: any;
  let logoutModel: any;
  let pendingRegistrationModel: any;
  let adminModel: any;
  let jwtService: any;
  let configService: any;
  let otpService: any;
  let notificationsService: any;
  let service: AuthService;

  const phoneNumber = '+963991234567';

  beforeEach(() => {
    userModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    };
    providerModel = {
      create: jest.fn(),
      findOne: jest.fn(),
    };
    logoutModel = {};
    pendingRegistrationModel = {
      findOneAndUpdate: jest.fn(),
      findOne: jest.fn(),
      deleteOne: jest.fn(),
    };
    adminModel = {
      findOne: jest.fn(),
    };
    jwtService = {
      signAsync: jest
        .fn()
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token'),
    };
    configService = {
      getOrThrow: jest.fn((key: string) => `${key}-value`),
      get: jest.fn((key: string) => `${key}-value`),
    };
    otpService = {
      generateAndSaveForPending: jest.fn(),
      createResponse: jest.fn((phone: string) => ({
        message: SUCCESS_MESSAGES.AUTH.OTP_SENT,
        phoneNumber: phone,
        expiresIn: 300,
      })),
    };
    notificationsService = {
      createNotification: jest.fn(),
    };

    service = new AuthService(
      userModel,
      providerModel,
      logoutModel,
      pendingRegistrationModel,
      adminModel,
      jwtService,
      configService,
      otpService,
      notificationsService,
    );
  });

  it('registers a pending customer and triggers OTP generation', async () => {
    userModel.findOne.mockResolvedValue(null);
    pendingRegistrationModel.findOneAndUpdate.mockResolvedValue({});

    await expect(
      service.register({
        fullName: 'Ahmad Ali',
        phoneNumber,
        password: 'Password1',
        accountType: 'customer',
        isTermsAccepted: true,
      }),
    ).resolves.toEqual({
      message: SUCCESS_MESSAGES.AUTH.OTP_SENT,
      phoneNumber,
      expiresIn: 300,
    });

    expect(pendingRegistrationModel.findOneAndUpdate).toHaveBeenCalledWith(
      { phoneNumber },
      expect.objectContaining({
        fullName: 'Ahmad Ali',
        phoneNumber,
        accountType: 'customer',
        isTermsAccepted: true,
        expiresAt: expect.any(Date),
      }),
      { upsert: true, new: true },
    );
    expect(otpService.generateAndSaveForPending).toHaveBeenCalledWith(
      phoneNumber,
    );
  });

  it('does not register a phone number that already belongs to a user', async () => {
    userModel.findOne.mockResolvedValue({ phoneNumber });

    await expect(
      service.register({
        fullName: 'Ahmad Ali',
        phoneNumber,
        password: 'Password1',
        accountType: 'customer',
        isTermsAccepted: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(pendingRegistrationModel.findOneAndUpdate).not.toHaveBeenCalled();
    expect(otpService.generateAndSaveForPending).not.toHaveBeenCalled();
  });

  it('verifies the correct OTP, creates the user, deletes the pending registration, and returns tokens', async () => {
    const pendingRegistration = buildPendingRegistration();
    const userDoc = buildUserDocument();

    pendingRegistrationModel.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(pendingRegistration),
    });
    userModel.findOne.mockResolvedValue(null);
    userModel.create.mockResolvedValue(userDoc);
    pendingRegistrationModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

    await expect(
      service.verifyOtp({ phoneNumber, otpCode: '654321' }),
    ).resolves.toMatchObject({
      user: expect.objectContaining({
        phoneNumber,
        isVerified: true,
      }),
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    expect(userModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        phoneNumber,
        accountType: 'customer',
        isVerified: true,
        isActive: true,
      }),
    );
    expect(pendingRegistrationModel.deleteOne).toHaveBeenCalledWith({
      phoneNumber,
    });
  });

  it('rejects an invalid OTP and increments the attempt counter', async () => {
    const pendingRegistration = buildPendingRegistration();

    pendingRegistrationModel.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(pendingRegistration),
    });

    await expect(
      service.verifyOtp({ phoneNumber, otpCode: '000000' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(pendingRegistration.otpAttempts).toBe(1);
    expect(pendingRegistration.save).toHaveBeenCalledTimes(1);
    expect(userModel.create).not.toHaveBeenCalled();
  });

  it('rejects an expired OTP without creating a user', async () => {
    const pendingRegistration = buildPendingRegistration({
      otpExpiresAt: new Date(Date.now() - 1000),
    });

    pendingRegistrationModel.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(pendingRegistration),
    });

    await expect(
      service.verifyOtp({ phoneNumber, otpCode: '654321' }),
    ).rejects.toThrow(ERROR_MESSAGES.OTP.EXPIRED);

    expect(userModel.create).not.toHaveBeenCalled();
  });

  it('rejects OTP verification when no pending registration exists', async () => {
    pendingRegistrationModel.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.verifyOtp({ phoneNumber, otpCode: '654321' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  function buildPendingRegistration(overrides: Record<string, any> = {}) {
    return {
      fullName: 'Ahmad Ali',
      phoneNumber,
      password: 'hashed-password',
      accountType: 'customer',
      isTermsAccepted: true,
      otpCode: '654321',
      otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
      otpAttempts: 0,
      save: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    };
  }

  function buildUserDocument(overrides: Record<string, any> = {}) {
    const user: any = {
      _id: { toString: () => 'user-id' },
      fullName: 'Ahmad Ali',
      phoneNumber,
      accountType: 'customer',
      isPremium: false,
      isVerified: true,
      isActive: true,
      refreshToken: null,
      save: jest.fn().mockResolvedValue(undefined),
      toObject: jest.fn(() => ({
        _id: 'user-id',
        fullName: 'Ahmad Ali',
        phoneNumber,
        accountType: 'customer',
        isPremium: false,
        isVerified: true,
        isActive: true,
      })),
      ...overrides,
    };

    return user;
  }
});
