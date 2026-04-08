"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const mongoose_1 = require("@nestjs/mongoose");
const app_module_1 = require("./src/app.module");
const admin_schema_1 = require("./src/database/schemas/admin.schema");
const bcrypt = __importStar(require("bcrypt"));
async function updateAdminPasswords() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    try {
        const adminModel = app.get((0, mongoose_1.getModelToken)(admin_schema_1.Admin.name));
        const pass1 = await bcrypt.hash('Mohamed@123', 10);
        const pass2 = await bcrypt.hash('Nather@789', 10);
        await adminModel.updateOne({ email: 'mohammedmarawi3@gmail.com' }, { $set: { password: pass1 } });
        console.log('✅ Updated Mohammad\'s password to: Mohamed@123');
        await adminModel.updateOne({ email: 'natherayyan@gmail.com' }, { $set: { password: pass2 } });
        console.log('✅ Updated Nather\'s password to: Nather@789');
    }
    catch (error) {
        console.error('❌ Update failed:', error);
    }
    finally {
        await app.close();
        process.exit(0);
    }
}
updateAdminPasswords();
//# sourceMappingURL=update-passwords.js.map