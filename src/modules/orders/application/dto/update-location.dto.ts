import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateLocationDto {
  @ApiProperty({ example: [31.2357, 30.0444], description: '[longitude, latitude]' })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  coordinates: number[];
}
