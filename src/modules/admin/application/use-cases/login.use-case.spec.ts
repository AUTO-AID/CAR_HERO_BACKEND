import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginUseCase } from './login.use-case';
import { IAdminRepository } from '../../domain/repositories/admin.repository.interface';
import { AdminEntity } from '../../domain/entities/admin.entity';
import { Role } from '../../../../common/enums/roles.enum';
import { PasswordUtil, TokenUtil } from '../../../../shared/utils';

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase;
  let adminRepository: jest.Mocked<IAdminRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    adminRepository = {
      findByEmail: jest.fn(),
      updateRefreshToken: jest.fn(),
    } as any;

    jwtService = {} as any;
    configService = {} as any;

    loginUseCase = new LoginUseCase(adminRepository, jwtService, configService);
  });

  it('should throw UnauthorizedException if admin not found', async () => {
    adminRepository.findByEmail.mockResolvedValue(null);

    await expect(loginUseCase.execute({ email: 'test@test.com', password: 'password' }))
      .rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if admin is deactivated', async () => {
    const admin = new AdminEntity('1', 'test@test.com', 'Test', Role.ADMIN, false, []);
    adminRepository.findByEmail.mockResolvedValue(admin);

    await expect(loginUseCase.execute({ email: 'test@test.com', password: 'password' }))
      .rejects.toThrow(UnauthorizedException);
  });

  // More tests would involve mocking PasswordUtil and TokenUtil which might be tricky 
  // without proper dependency injection for utils, but this demonstrates the approach.
});
