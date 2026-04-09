import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdateProfileUseCase } from './update-profile.use-case';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserEntity, UserAccountType } from '../../domain/entities/user.entity';

describe('UpdateProfileUseCase', () => {
  let useCase: UpdateProfileUseCase;
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
      update: jest.fn(),
      // other methods mocked as needed
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateProfileUseCase,
        {
          provide: IUserRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateProfileUseCase>(UpdateProfileUseCase);
    repository = module.get(IUserRepository) as any;
  });

  it('should update user profile successfully', async () => {
    const updateDto = { fullName: 'New Name' };
    const updatedUser = { ...mockUser, fullName: 'New Name' } as UserEntity;
    
    repository.findById.mockResolvedValue(mockUser);
    repository.update.mockResolvedValue(updatedUser);

    const result = await useCase.execute('user-123', updateDto);

    expect(result.fullName).toBe('New Name');
    expect(repository.update).toHaveBeenCalledWith('user-123', updateDto);
  });

  it('should throw NotFoundException if user to update does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute('invalid-id', { fullName: 'New' }))
      .rejects.toThrow(NotFoundException);
  });
});
