declare const _default: () => {
    app: {
        nodeEnv: string;
        port: number;
        apiPrefix: string;
    };
    database: {
        uri: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshSecret: string;
        refreshExpiresIn: string;
    };
    otp: {
        expiryMinutes: number;
    };
    firebase: {
        projectId: string | undefined;
        privateKey: string | undefined;
        clientEmail: string | undefined;
    };
    sms: {
        provider: string;
        twilio: {
            accountSid: string | undefined;
            authToken: string | undefined;
            phoneNumber: string | undefined;
        };
    };
    redis: {
        host: string;
        port: number;
    };
    upload: {
        maxFileSize: number;
        dest: string;
    };
};
export default _default;
