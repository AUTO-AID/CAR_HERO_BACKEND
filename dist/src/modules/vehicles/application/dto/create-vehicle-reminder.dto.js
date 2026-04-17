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
exports.CreateVehicleReminderDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const vehicle_reminder_entity_1 = require("../../domain/entities/vehicle-reminder.entity");
class CreateVehicleReminderDto {
    type;
    title;
    description;
    reminderDate;
    mileageThreshold;
    currentMileage;
    frequency;
    isRecurring;
    notes;
}
exports.CreateVehicleReminderDto = CreateVehicleReminderDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: vehicle_reminder_entity_1.ReminderType, example: vehicle_reminder_entity_1.ReminderType.OIL_CHANGE, description: 'نوع التذكير' }),
    (0, class_validator_1.IsEnum)(vehicle_reminder_entity_1.ReminderType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateVehicleReminderDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'تغيير زيت المحرك', description: 'عنوان التذكير' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateVehicleReminderDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'كل 5000 كم', description: 'وصف إضافي' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateVehicleReminderDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2025-03-01T10:00:00.000Z', description: 'تاريخ التذكير' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateVehicleReminderDto.prototype, "reminderDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 50000, description: 'عداد السيارة للتذكير بالكم' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateVehicleReminderDto.prototype, "mileageThreshold", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 48000, description: 'عداد السيارة الحالي' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateVehicleReminderDto.prototype, "currentMileage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: vehicle_reminder_entity_1.ReminderFrequency, example: vehicle_reminder_entity_1.ReminderFrequency.MONTHLY, description: 'تكرار التذكير' }),
    (0, class_validator_1.IsEnum)(vehicle_reminder_entity_1.ReminderFrequency),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateVehicleReminderDto.prototype, "frequency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true, description: 'تذكير متكرر' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateVehicleReminderDto.prototype, "isRecurring", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'ملاحظات إضافية', description: 'ملاحظات' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateVehicleReminderDto.prototype, "notes", void 0);
//# sourceMappingURL=create-vehicle-reminder.dto.js.map