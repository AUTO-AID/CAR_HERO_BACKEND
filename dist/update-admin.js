"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const mongoose_1 = require("@nestjs/mongoose");
const app_module_1 = require("./src/app.module");
const admin_schema_1 = require("./src/database/schemas/admin.schema");
async function updateAdminName() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    try {
        const adminModel = app.get((0, mongoose_1.getModelToken)(admin_schema_1.Admin.name));
        const result = await adminModel.updateOne({ email: 'natherayyan@gmail.com' }, { $set: { name: 'nather ayyan' } });
        if (result.matchedCount > 0) {
            console.log('✅ Admin name updated successfully to "nather ayyan"');
        }
        else {
            console.log('❌ Admin email not found');
        }
    }
    catch (error) {
        console.error('❌ Update failed:', error);
    }
    finally {
        await app.close();
        process.exit(0);
    }
}
updateAdminName();
//# sourceMappingURL=update-admin.js.map