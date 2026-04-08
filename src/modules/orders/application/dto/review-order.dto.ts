import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsNotEmpty, Min, Max, IsOptional } from 'class-validator';

export class ReviewOrderDto {
  @ApiProperty({ example: 5, description: 'Rating from 1 to 5' })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating: number;

  @ApiProperty({ example: 'Excellent service!', description: 'Text review' })
  @IsString()
  @IsOptional()
  comment?: string;
}
