/**
 * Login Use Case
 * Handles the administrative login logic.
 */
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IAdminRepository } from '../../domain/repositories/admin.repository.interface';
import { AdminLoginDto } from '../../dto/admin-login.dto';
import { PasswordUtil, TokenUtil } from '../../../../shared/utils';
import { IJwtPayload } from '../../../../shared/interfaces';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(IAdminRepository)
    private readonly adminRepository: IAdminRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(loginDto: AdminLoginDto) {
    const { email, password } = loginDto;

    // 1. Find admin by email
    const admin = await this.adminRepository.findByEmail(email);
    if (!admin) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 2. Check if active
    if (!admin.canLogin()) {
      throw new UnauthorizedException('Admin account is deactivated');
    }

    // 3. Verify password
    const isPasswordValid = await PasswordUtil.compare(password, admin.password!);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 4. Generate tokens
    const payload: IJwtPayload = {
      userId: admin.id,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
    };

    const tokens = await TokenUtil.generateTokens(
      payload,
      this.jwtService,
      this.configService,
    );

    // 5. Update refresh token
    const refreshTokenHash = await PasswordUtil.hash(tokens.refreshToken);
    await this.adminRepository.updateRefreshToken(admin.id, refreshTokenHash);

    return {
      message: 'Login successful',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      ...tokens,
    };
  }
}
