/**
 * Bookings Module
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from '../../database/schemas/booking.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class BookingsModule {}
