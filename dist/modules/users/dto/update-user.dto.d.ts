export declare class UpdateUserDto {
    fullName?: string;
    profileImage?: string;
    preferences?: {
        language?: string;
        notifications?: {
            push?: boolean;
            sms?: boolean;
            email?: boolean;
        };
    };
}
