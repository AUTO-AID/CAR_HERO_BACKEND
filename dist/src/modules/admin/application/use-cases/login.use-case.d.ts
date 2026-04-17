import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IAdminRepository } from '../../domain/repositories/admin.repository.interface';
import { AdminLoginDto } from '../dtos/admin-login.dto';
export declare class LoginUseCase {
    private readonly adminRepository;
    private readonly jwtService;
    private readonly configService;
    constructor(adminRepository: IAdminRepository, jwtService: JwtService, configService: ConfigService);
    execute(loginDto: AdminLoginDto): Promise<any>;
}
