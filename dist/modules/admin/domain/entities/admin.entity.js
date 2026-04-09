"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminEntity = void 0;
class AdminEntity {
    id;
    email;
    name;
    role;
    isActive;
    permissions;
    password;
    avatar;
    lastLoginAt;
    lastLoginIp;
    refreshToken;
    metadata;
    constructor(id, email, name, role, isActive, permissions, password, avatar, lastLoginAt, lastLoginIp, refreshToken, metadata) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.role = role;
        this.isActive = isActive;
        this.permissions = permissions;
        this.password = password;
        this.avatar = avatar;
        this.lastLoginAt = lastLoginAt;
        this.lastLoginIp = lastLoginIp;
        this.refreshToken = refreshToken;
        this.metadata = metadata;
    }
    hasPermission(permission) {
        if (this.permissions.includes('all'))
            return true;
        return this.permissions.includes(permission);
    }
    canLogin() {
        return this.isActive;
    }
}
exports.AdminEntity = AdminEntity;
//# sourceMappingURL=admin.entity.js.map