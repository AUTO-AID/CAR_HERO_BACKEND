import { CustomerExperienceController } from './customer-experience.controller';

describe('CustomerExperienceController', () => {
  const service = {
    listAddresses: jest.fn(),
    createAddress: jest.fn(),
    updateAddress: jest.fn(),
    setDefaultAddress: jest.fn(),
    deleteAddress: jest.fn(),
    listPaymentMethods: jest.fn(),
    createPaymentMethod: jest.fn(),
    updatePaymentMethod: jest.fn(),
    setDefaultPaymentMethod: jest.fn(),
    deletePaymentMethod: jest.fn(),
    listOffers: jest.fn(),
    applyOffer: jest.fn(),
    listWashPlans: jest.fn(),
    createWashPlan: jest.fn(),
    updateWashPlan: jest.fn(),
    deleteWashPlan: jest.fn(),
    generateWashPlanBooking: jest.fn(),
    registerDevice: jest.fn(),
    unregisterDevice: jest.fn(),
  };
  const controller = new CustomerExperienceController(service as any);

  beforeEach(() => jest.clearAllMocks());

  it('uses the authenticated customer id for owned resources', async () => {
    await controller.createAddress('user-1', { label: 'Home' } as any);
    await controller.setDefaultPaymentMethod('user-1', 'method-1');
    await controller.createWashPlan('user-1', { vehicleId: 'vehicle-1' } as any);
    await controller.registerDevice('user-1', { fcmToken: 'token', platform: 'android' });

    expect(service.createAddress).toHaveBeenCalledWith('user-1', { label: 'Home' });
    expect(service.setDefaultPaymentMethod).toHaveBeenCalledWith('user-1', 'method-1');
    expect(service.createWashPlan).toHaveBeenCalledWith('user-1', { vehicleId: 'vehicle-1' });
    expect(service.registerDevice).toHaveBeenCalledWith('user-1', { fcmToken: 'token', platform: 'android' });
  });

  it('applies an offer only for the authenticated customer', async () => {
    await controller.applyOffer('user-1', 'offer-1', { orderId: 'order-1' });
    expect(service.applyOffer).toHaveBeenCalledWith('user-1', 'offer-1', { orderId: 'order-1' });
  });
});
