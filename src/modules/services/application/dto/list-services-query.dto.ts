import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ServiceCategory } from '../../../../core/enums/status.enum';

export class ListServicesQueryDto {
  @ApiPropertyOptional({ enum: ServiceCategory })
  @IsEnum(ServiceCategory)
  @IsOptional()
  category?: ServiceCategory;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsOptional()
  isEmergency?: boolean;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsOptional()
  isSystemService?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
