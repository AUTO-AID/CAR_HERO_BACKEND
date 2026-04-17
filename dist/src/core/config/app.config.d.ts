export declare const appConfig: (() => {
    name: string;
    port: number;
    nodeEnv: string;
    apiPrefix: string;
    cors: {
        origin: string;
        credentials: boolean;
    };
    throttle: {
        ttl: number;
        limit: number;
    };
    otp: {
        length: number;
        expiresIn: number;
        maxAttempts: number;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    name: string;
    port: number;
    nodeEnv: string;
    apiPrefix: string;
    cors: {
        origin: string;
        credentials: boolean;
    };
    throttle: {
        ttl: number;
        limit: number;
    };
    otp: {
        length: number;
        expiresIn: number;
        maxAttempts: number;
    };
}>;
