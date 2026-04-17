export declare class ReviewEntity {
    readonly id: string;
    readonly user: string;
    readonly provider: string;
    readonly rating: number;
    readonly order?: string | undefined;
    readonly booking?: string | undefined;
    readonly comment?: string | undefined;
    readonly serviceQuality?: number | undefined;
    readonly punctuality?: number | undefined;
    readonly professionalism?: number | undefined;
    readonly valueForMoney?: number | undefined;
    readonly images: string[];
    readonly providerResponse?: string | undefined;
    readonly providerRespondedAt?: Date | undefined;
    readonly isVisible: boolean;
    readonly isFlagged: boolean;
    readonly flagReason?: string | undefined;
    readonly helpfulCount: number;
    readonly helpfulVoters: string[];
    readonly createdAt?: Date | undefined;
    readonly updatedAt?: Date | undefined;
    constructor(id: string, user: string, provider: string, rating: number, order?: string | undefined, booking?: string | undefined, comment?: string | undefined, serviceQuality?: number | undefined, punctuality?: number | undefined, professionalism?: number | undefined, valueForMoney?: number | undefined, images?: string[], providerResponse?: string | undefined, providerRespondedAt?: Date | undefined, isVisible?: boolean, isFlagged?: boolean, flagReason?: string | undefined, helpfulCount?: number, helpfulVoters?: string[], createdAt?: Date | undefined, updatedAt?: Date | undefined);
    private validate;
    static create(props: {
        user: string;
        provider: string;
        rating: number;
        order?: string;
        booking?: string;
        comment?: string;
        serviceQuality?: number;
        punctuality?: number;
        professionalism?: number;
        valueForMoney?: number;
        images?: string[];
    }): ReviewEntity;
}
