import { BookingStatus } from '../enums/booking-status.enum';
import { PaymentStatus } from '../enums/payment-status.enum';

export class BookingLocation {
  type: string;
  coordinates: number[]; // [longitude, latitude]
  address?: string;
}

export class Booking {
  id?: string;
  bookingNumber: string;
  isScheduled: boolean;
  user: string; // User ID
  provider?: string; // Provider ID (Optional at start)
  vehicle?: string; // Vehicle ID
  service: string; // Service ID
  
  status: BookingStatus;
  
  location: BookingLocation;

  scheduledDate?: Date;
  scheduledTime?: string;
  estimatedDuration?: number;
  
  serviceName: string;
  servicePrice: number;
  selectedOptions?: Array<{ name: string; price: number }>;
  
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  
  promoCode?: string;
  
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentId?: string;
  
  confirmedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  
  cancellationReason?: string;
  cancelledBy?: string;
  
  userNotes?: string;
  providerNotes?: string;
  
  reminderEnabled?: boolean;
  reminderSentAt?: Date;
  
  rating?: number;
  review?: string; // Review ID
  
  metadata?: Record<string, any>;
  
  createdAt?: Date;
  updatedAt?: Date;

  constructor(partial: Partial<Booking>) {
    Object.assign(this, partial);
    if (!this.location) {
        this.location = { type: 'Point', coordinates: [0, 0] };
    }
  }
}
