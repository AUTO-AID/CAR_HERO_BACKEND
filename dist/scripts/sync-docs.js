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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        }
        else if (file.endsWith('.controller.ts')) {
            results.push(file);
        }
    });
    return results;
}
function syncDocs() {
    console.log('🔍 جاري مسح شامل لكل ملفات الـ Backend...');
    const controllers = walk(path.join(__dirname, '..', 'src'));
    const categories = {};
    controllers.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const controllerMatch = content.match(/@Controller\(['"]?([^'"]*)['"]?\)/);
        if (!controllerMatch)
            return;
        let prefix = controllerMatch[1] || '';
        if (prefix.startsWith('/'))
            prefix = prefix.substring(1);
        let moduleName = '';
        const parts = file.split(path.sep);
        const modulesIndex = parts.indexOf('modules');
        if (modulesIndex !== -1 && parts[modulesIndex + 1]) {
            moduleName = parts[modulesIndex + 1];
        }
        else {
            moduleName = path.basename(path.dirname(file)).replace('controllers', '').replace('presentation', '') || 'general';
        }
        const categoryMap = {
            'auth': 'المصادقة (Auth)',
            'admin': 'الإدارة (Admin)',
            'orders': 'الطلبات (Orders)',
            'bookings': 'الحجوزات (Bookings)',
            'wallet': 'المحفظة (Wallet)',
            'users': 'المستخدمين (Users)',
            'providers': 'المزودين (Providers)',
            'chat': 'المحادثة (Chat)',
            'notifications': 'الإشعارات (Notifications)',
            'reviews': 'التقييمات (Reviews)',
            'vehicles': 'المركبات (Vehicles)'
        };
        const categoryName = categoryMap[moduleName.toLowerCase()] || (moduleName.charAt(0).toUpperCase() + moduleName.slice(1));
        if (!categories[categoryName]) {
            categories[categoryName] = {
                id: moduleName.toLowerCase(),
                category: categoryName,
                description: `إدارة عمليات ${categoryName}`,
                endpoints: []
            };
        }
        const methodRegex = /@(Get|Post|Put|Delete|Patch)\(['"]?([^'"]*)['"]?\)/g;
        let match;
        while ((match = methodRegex.exec(content)) !== null) {
            const [fullMatch, method, subPath] = match;
            const lookAround = content.substring(Math.max(0, match.index - 200), Math.min(content.length, match.index + 50));
            const apiMatch = lookAround.match(/@ApiOperation\({?\s*summary:\s*['"]([^'"]+)['"]/);
            const summary = apiMatch ? apiMatch[1] : 'لا يوجد وصف متاح';
            let cleanSubPath = subPath || '';
            if (cleanSubPath.startsWith('/'))
                cleanSubPath = cleanSubPath.substring(1);
            let fullPath = `api/v1/${prefix}/${cleanSubPath}`.replace(/\/+/g, '/').replace(/\/$/, "");
            if (!fullPath.startsWith('/'))
                fullPath = '/' + fullPath;
            if (!categories[categoryName].endpoints.find((e) => e.path === fullPath && e.method === method.toUpperCase())) {
                categories[categoryName].endpoints.push({
                    method: method.toUpperCase(),
                    path: fullPath,
                    description: summary
                });
            }
        }
    });
    const finalData = Object.values(categories).filter((c) => c.endpoints.length > 0);
    const fileContent = `/**
 * تم توليد هذا الملف تلقائياً بواسطة Smart Scanner
 * تاريخ التحديث: ${new Date().toLocaleString('ar-EG')}
 */

const endpointsData = ${JSON.stringify(finalData, null, 4)};`;
    const targetPath = path.join(__dirname, '..', '..', 'endpoints', 'data.js');
    fs.writeFileSync(targetPath, fileContent);
    console.log(`✅ تم المزامنة بنجاح! تم العثور على ${finalData.length} وحدات.`);
}
syncDocs();
//# sourceMappingURL=sync-docs.js.map