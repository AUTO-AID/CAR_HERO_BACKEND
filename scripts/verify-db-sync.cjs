/**
 * يقارن عدد المستندات في كل مجموعة بين قاعدتَي بيانات.
 *
 * يُستدعى بعد النقل للتأكّد من أن Atlas صارت نسخة مطابقة للمحلية، بدل
 * الاكتفاء بأن mongorestore لم يُرجع خطأ — فالأمر قد ينجح جزئياً.
 *
 *   node scripts/verify-db-sync.cjs <sourceUri> <targetUri>
 *
 * يخرج بالرمز 0 عند التطابق التام، و1 عند وجود أي فرق.
 */

const { MongoClient } = require('mongodb');

async function collectionCounts(uri, label) {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 20000 });
  try {
    await client.connect();
    const db = client.db();
    const collections = await db.listCollections({}, { nameOnly: true }).toArray();
    const counts = {};
    for (const { name } of collections) {
      if (name.startsWith('system.')) continue;
      counts[name] = await db.collection(name).countDocuments();
    }
    return counts;
  } catch (error) {
    console.error(`  تعذّر الاتصال بـ${label}: ${error.message}`);
    throw error;
  } finally {
    await client.close().catch(() => {});
  }
}

(async () => {
  const [sourceUri, targetUri] = process.argv.slice(2);
  if (!sourceUri || !targetUri) {
    console.error('Usage: node scripts/verify-db-sync.cjs <sourceUri> <targetUri>');
    process.exit(2);
  }

  const [source, target] = await Promise.all([
    collectionCounts(sourceUri, 'المحلية'),
    collectionCounts(targetUri, 'Atlas'),
  ]);

  const names = [...new Set([...Object.keys(source), ...Object.keys(target)])].sort();
  const pad = (s, n) => String(s).padEnd(n, ' ');

  console.log('');
  console.log(`  ${pad('المجموعة', 28)} ${pad('المحلية', 10)} ${pad('Atlas', 10)} الحالة`);
  console.log(`  ${'-'.repeat(62)}`);

  let mismatches = 0;
  let totalSource = 0;
  let totalTarget = 0;

  for (const name of names) {
    const a = source[name] ?? 0;
    const b = target[name] ?? 0;
    totalSource += a;
    totalTarget += b;
    const ok = a === b;
    if (!ok) mismatches += 1;
    console.log(`  ${pad(name, 28)} ${pad(a, 10)} ${pad(b, 10)} ${ok ? 'مطابق' : 'مختلف <<<'}`);
  }

  console.log(`  ${'-'.repeat(62)}`);
  console.log(`  ${pad('الإجمالي', 28)} ${pad(totalSource, 10)} ${pad(totalTarget, 10)}`);
  console.log('');

  if (mismatches > 0) {
    console.error(`  ${mismatches} مجموعة غير مطابقة.`);
    process.exit(1);
  }
  console.log(`  كل المجموعات مطابقة (${names.length} مجموعة، ${totalTarget} مستند).`);
  process.exit(0);
})().catch((error) => {
  console.error('  فشل التحقّق:', error.message);
  process.exit(1);
});
