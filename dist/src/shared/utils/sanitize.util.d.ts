export declare class SanitizeUtil {
    static user(user: any): any;
    static users(users: any[]): any[];
    static sanitizeFields<T extends Record<string, any>>(obj: T, fieldsToRemove: string[]): Partial<T>;
    static deepSanitize(obj: any): any;
}
