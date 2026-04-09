import { IsEnum, IsNotEmpty } from 'class-validator';
import { BookingStatus } from '../../domain/enums/booking-status.enum';

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  @IsNotEmpty()
  status: BookingStatus;
}
