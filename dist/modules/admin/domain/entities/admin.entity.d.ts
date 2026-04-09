import { Role } from '../../../../common/enums/roles.enum';
export declare class AdminEntity {
    readonly id: string;
    readonly email: string;
    readonly name: string;
    readonly role: Role;
    readonly isActive: boolean;
    readonly permissions: string[];
    readonly password?: string | undefined;
    readonly avatar?: string | undefined;
    readonly lastLoginAt?: Date | undefined;
    readonly lastLoginIp?: string | undefined;
    readonly refreshToken?: string | undefined;
    readonly metadata?: Record<string, any> | undefined;
    constructor(id: string, email: string, name: string, role: Role, isActive: boolean, permissions: string[], password?: string | undefined, avatar?: string | undefined, lastLoginAt?: Date | undefined, lastLoginIp?: string | undefined, refreshToken?: string | undefined, metadata?: Record<string, any> | undefined);
    hasPermission(permission: string): boolean;
    canLogin(): boolean;
}
