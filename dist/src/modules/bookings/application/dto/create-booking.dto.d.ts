declare class SelectedOptionDto {
    name: string;
    price: number;
}
export declare class CreateBookingDto {
    serviceId: string;
    coordinates: number[];
    address?: string;
    isScheduled?: boolean;
    scheduledDate?: string;
    scheduledTime?: string;
    vehicleId?: string;
    selectedOptions?: SelectedOptionDto[];
    promoCode?: string;
    userNotes?: string;
    paymentMethod: string;
}
export {};
