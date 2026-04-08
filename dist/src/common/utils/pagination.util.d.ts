export interface PaginationOptions {
    page?: number;
    limit?: number;
}
export interface PaginationResult<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}
export declare const getPaginationParams: (options: PaginationOptions) => {
    skip: number;
    limit: number;
};
export declare const createPaginationResult: <T>(data: T[], total: number, page: number, limit: number) => PaginationResult<T>;
