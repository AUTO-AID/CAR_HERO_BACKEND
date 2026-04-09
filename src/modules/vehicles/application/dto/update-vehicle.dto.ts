/**
 * Update Vehicle DTO
 * Data transfer object for updating vehicle details (all fields optional)
 */
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateVehicleDto } from './create-vehicle.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
  @ApiPropertyOptional({ example: true, description: 'Set as default vehicle' })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
