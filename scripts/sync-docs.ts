import * as fs from 'fs';
import * as path from 'path';

/**
 * سكربت مسح ذكي (Smart Regex Scanner)
 * يقوم بقراءة ملفات الـ Controllers واستخراج الـ Endpoints بدون الحاجة لتشغيل التطبيق
 */

function walk(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.controller.ts')) {
            results.push(file);
        }
    });
    return results;
}

function syncDocs() {
    console.log('🔍 جاري مسح شامل لكل ملفات الـ Backend...');
    
    const controllers = walk(path.join(__dirname, '..', 'src'));
    const categories: any = {};

    controllers.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        
        // 1. استخراج اسم المتحكم (Prefix)
        const controllerMatch = content.match(/@Controller\(['"]?([^'"]*)['"]?\)/);
        if (!controllerMatch) return;
        let prefix = controllerMatch[1] || '';
        if (prefix.startsWith('/')) prefix = prefix.substring(1);

        // 2. تحديد اسم الوحدة (Module Name) بشكل أدق من المسار
        let moduleName = '';
        const parts = file.split(path.sep);
        const modulesIndex = parts.indexOf('modules');
        if (modulesIndex !== -1 && parts[modulesIndex + 1]) {
            moduleName = parts[modulesIndex + 1];
        } else {
            moduleName = path.basename(path.dirname(file)).replace('controllers', '').replace('presentation', '') || 'general';
        }

        // تحسين مسمى القسم
        const categoryMap: any = {
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

        // 3. استخراج الدوال (Methods) - تحسين الـ Regex ليشمل الجميع
        const methodRegex = /@(Get|Post|Put|Delete|Patch)\(['"]?([^'"]*)['"]?\)/g;
        
        let match;
        while ((match = methodRegex.exec(content)) !== null) {
            const [fullMatch, method, subPath] = match;
            
            // البحث عن الوصف (ApiOperation) في الأسطر القريبة قبل الـ Method
            const lookAround = content.substring(Math.max(0, match.index - 200), Math.min(content.length, match.index + 50));
            const apiMatch = lookAround.match(/@ApiOperation\({?\s*summary:\s*['"]([^'"]+)['"]/);
            const summary = apiMatch ? apiMatch[1] : 'لا يوجد وصف متاح';

            // تنظيف المسار
            let cleanSubPath = subPath || '';
            if (cleanSubPath.startsWith('/')) cleanSubPath = cleanSubPath.substring(1);
            
            let fullPath = `api/v1/${prefix}/${cleanSubPath}`.replace(/\/+/g, '/').replace(/\/$/, "");
            if (!fullPath.startsWith('/')) fullPath = '/' + fullPath;
            
            // منع التكرار
            if (!categories[categoryName].endpoints.find((e: any) => e.path === fullPath && e.method === method.toUpperCase())) {
                categories[categoryName].endpoints.push({
                    method: method.toUpperCase(),
                    path: fullPath,
                    description: summary
                });
            }
        }
    });

    const finalData = Object.values(categories).filter((c: any) => c.endpoints.length > 0);
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
