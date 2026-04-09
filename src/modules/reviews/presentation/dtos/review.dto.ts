import { IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, Min, Max, IsUUID, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: '60d5ecb8b392d66514703902', required: false })
  @IsOptional()
  @IsMongoId()
  orderId?: string;

  @ApiProperty({ example: '60d5ecb8b392d66514703903', required: false })
  @IsOptional()
  @IsMongoId()
  bookingId?: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Excellent service!', required: false })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  serviceQuality?: number;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  punctuality?: number;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  professionalism?: number;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  valueForMoney?: number;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class ProviderResponseDto {
  @ApiProperty({ example: 'Thank you for your feedback!' })
  @IsNotEmpty()
  @IsString()
  response: string;
}

export class ReviewQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
