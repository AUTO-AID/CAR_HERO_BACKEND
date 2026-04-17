import { UserAccountType } from '../../domain/entities/user.entity';
export declare class CreateUserDto {
    fullName: string;
    phoneNumber: string;
    password: string;
    accountType?: UserAccountType;
    isTermsAccepted: boolean;
}
