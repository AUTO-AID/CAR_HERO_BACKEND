import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetProfileUseCase } from './get-profile.use-case';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserEntity, UserAccountType } from '../../domain/entities/user.entity';

describe('GetProfileUseCase', () => {
  let useCase: GetProfileUseCase;
  let repository: jest.Mocked<IUserRepository>;

  const mockUser = new UserEntity(
    'user-123',
    'Ahmad Mohammad',
    '+963991234567',
    UserAccountType.CUSTOMER,
  );

  beforeEach(async () => {
    const mockRepository = {
      findById: jest.fn(),
      findByPhoneNumber: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProfileUseCase,
        {
          provide: IUserRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetProfileUseCase>(GetProfileUseCase);
    repository = module.get(IUserRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return user profile when user exists', async () => {
    repository.findById.mockResolvedValue(mockUser);

    const result = await useCase.execute('user-123');

    expect(result).toEqual(mockUser);
    expect(repository.findById).toHaveBeenCalledWith('user-123');
  });

  it('should throw NotFoundException when user does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute('non-existent')).rejects.toThrow(NotFoundException);
    expect(repository.findById).toHaveBeenCalledWith('non-existent');
  });
});
