import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateOrderTrackingLocationDto {
  @ApiProperty({ example: [31.2357, 30.0444], description: '[longitude, latitude]' })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  coordinates: number[];

  @ApiProperty({ example: 8, required: false, description: 'GPS accuracy in meters' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;

  @ApiProperty({ example: 145, required: false, description: 'Heading in degrees' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @ApiProperty({ example: 12.5, required: false, description: 'Speed in meters per second' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  speed?: number;
}
