export declare class CreateReviewDto {
    orderId?: string;
    bookingId?: string;
    rating: number;
    comment?: string;
    serviceQuality?: number;
    punctuality?: number;
    professionalism?: number;
    valueForMoney?: number;
    images?: string[];
}
export declare class ProviderResponseDto {
    response: string;
}
export declare class ReviewQueryDto {
    page?: number;
    limit?: number;
}
