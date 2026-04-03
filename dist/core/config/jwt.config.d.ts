export declare const jwtConfig: (() => {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
    algorithm: "HS256" | "HS384" | "HS512" | "RS256";
    issuer: string;
    audience: string;
    ignoreExpiration: boolean;
    verifyOptions: {
        clockTolerance: number;
        maxAge: string;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
    algorithm: "HS256" | "HS384" | "HS512" | "RS256";
    issuer: string;
    audience: string;
    ignoreExpiration: boolean;
    verifyOptions: {
        clockTolerance: number;
        maxAge: string;
    };
}>;
