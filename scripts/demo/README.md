# سكربتات تجهيز العرض التقديمي (مناقشة التخرّج)

كلّها **مؤقّتة** ومصمّمة للتراجع الكامل. تعمل على القاعدة المحلية مباشرةً لا
عبر الـAPI: ما تفعله (تفعيل ألفَي مزوّد، إغلاق آلاف الطلبات) ليس فعلاً يملكه
أي مستخدم، ولا يجوز أن يوجد له مسار HTTP يُستدعى من الخارج.

## الترتيب

```bash
# مرّة واحدة قبل كل شيء
node scripts/demo/backup-demo-state.cjs        # نسخة احتياطية → mongodb-dumps/pre-demo-<تاريخ>
node scripts/demo/assign-provider-services.cjs # خدمات وأسعار لكل مزوّد
node scripts/demo/release-stale-orders.cjs --all  # تحرير المشغولين بطلبات بذر عالقة
node scripts/demo/activate-all-providers.cjs   # تفعيل الاتصال للمعتمَدين

# قبل كل محاولة تصوير
node scripts/demo/preflight-demo.cjs           # لا تبدأ إن سقط شيء

# بعد كل محاولة تصوير
node scripts/demo/reset-demo-provider.cjs      # نبضات التتبّع نقلت الورشة — تُعاد

# تحقّق شامل عبر الـAPI (اختياري، يُنشئ عميلاً مؤقّتاً ويحذفه)
node scripts/demo/verify-demo-flow.cjs --password "<كلمة مرور مزوّد العرض>"
```

## التراجع بعد المناقشة

```bash
node scripts/demo/restore-demo-state.cjs "<مسار مجلّد النسخة>"
```

ثم — خارج هذه السكربتات — أعِد `DEMO_MODE = false` في
`car-hero-app-provider/src/config/demoMode.js`.

## ما لا تلمسه هذه السكربتات

- **مزوّد العرض `+963947091764`**: خدماته وأسعاره وموقعه كما ضبطها صاحبه، ويبقى
  `offline` ليضغط الزرّ بيده أمام اللجنة.
- **المزوّدون المعلّقون والمرفوضون** (٧٦): مادة عرض شاشة الموافقات في لوحة
  الأدمن، وتفعيلهم يمحو تلك القصّة.
