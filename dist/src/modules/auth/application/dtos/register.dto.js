"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class RegisterDto {
    fullName;
    phoneNumber;
    password;
    accountType;
    isTermsAccepted;
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Ahmad Mohammad Ali',
        description: 'Full name of the user',
    }),
    (0, class_validator_1.IsString)({ message: 'Full name must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Full name is required' }),
    (0, class_validator_1.MinLength)(3, { message: 'Full name must be at least 3 characters' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '+963991234567',
        description: 'Syrian phone number (must start with +963)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Phone number is required' }),
    (0, class_validator_1.Matches)(/^\+963\d{9}$/, {
        message: 'Phone number must start with +963 followed by 9 digits (example: +963991234567)',
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Ahmed@123',
        description: 'Password (min 8 chars, must contain uppercase letter and number)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Password is required' }),
    (0, class_validator_1.MinLength)(8, { message: 'Password must be at least 8 characters' }),
    (0, class_validator_1.Matches)(/^(?=.*[A-Z])(?=.*\d)/, {
        message: 'Password must contain at least one uppercase letter and one number',
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'customer',
        description: 'Account type',
        enum: ['customer', 'provider', 'admin'],
        default: 'customer',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['customer', 'provider', 'admin']),
    __metadata("design:type", String)
], RegisterDto.prototype, "accountType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: true,
        description: 'User acceptance of terms and conditions',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Terms and conditions must be accepted' }),
    (0, class_validator_1.Equals)(true, { message: 'Terms and conditions must be accepted' }),
    __metadata("design:type", Boolean)
], RegisterDto.prototype, "isTermsAccepted", void 0);
//# sourceMappingURL=register.dto.js.map