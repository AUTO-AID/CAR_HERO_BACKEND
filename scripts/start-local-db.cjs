const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const net = require('net');
const path = require('path');

/** هل يستمع أحد على المنفذ؟ */
function portIsOpen(port, host = '127.0.0.1', timeout = 700) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    const done = (open) => {
      socket.destroy();
      resolve(open);
    };
    socket.setTimeout(timeout);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

/**
 * مَن يشغل المنفذ: mongod حيّ على أي مسار بيانات، أم شيء آخر؟
 *
 * لا يكفي أن المنفذ مشغول — قد يكون خادماً آخر تماماً. ومقارنة `dbPath` هي ما
 * يفرّق بين «نسختك تعمل أصلاً» و«mongod آخر يحتلّ منفذك»، والفرق بينهما هو
 * الفرق بين رسالة مطمئنة وبيانات تُقرأ من مكان غير متوقَّع.
 */
async function inspectRunningMongo(port) {
  let client;
  try {
    const { MongoClient } = require('mongodb');
    client = new MongoClient(`mongodb://127.0.0.1:${port}`, { serverSelectionTimeoutMS: 2500 });
    await client.connect();
    const admin = client.db('admin').admin();
    const [status, opts] = await Promise.all([
      admin.serverStatus(),
      admin.command({ getCmdLineOpts: 1 }).catch(() => null),
    ]);
    return {
      isMongo: true,
      version: status.version,
      uptimeSeconds: Math.round(status.uptime),
      dbPath: opts?.parsed?.storage?.dbPath ?? null,
    };
  } catch {
    return { isMongo: false };
  } finally {
    await client?.close().catch(() => {});
  }
}

async function main() {
  const port = parseInt(process.env.MONGO_MEMORY_PORT || '27017', 10);
  const version = process.env.MONGO_MEMORY_VERSION || '8.2.6';
  const dbPath = path.resolve(
    process.env.MONGO_MEMORY_DB_PATH || `E:/all_project/CarHero/mongodb-data-${version.split('.')[0]}`,
  );
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }

  /**
   * نسخة تعمل أصلاً ليست عطلاً — والانهيار عليها كان يُقرأ كذلك.
   *
   * `mongod` يقفل `mongod.lock` ما دام حيّاً، فإقلاع نسخة ثانية على نفس المجلد
   * يفشل بـ`DBPathInUse` وأثرِ استدعاءٍ من أعماق `mongodb-memory-server` —
   * رسالةٌ تبدو كخلل في الأذونات أو تلفٍ في القاعدة، والسبب أبسط من ذلك بكثير:
   * القاعدة مُقلعة منذ دقائق (يُقلعها `npm run dev:local` تلقائياً إن لم تكن
   * تعمل، وهو ما يفعله معظم التشغيل).
   *
   * `start-local-stack.ps1` يحرس هذه الحالة بـ`Test-PortOpen` منذ البداية؛
   * وهذا السكربت — وهو المنادى مباشرةً — لم يكن يحرسها.
   */
  if (await portIsOpen(port)) {
    const running = await inspectRunningMongo(port);

    if (!running.isMongo) {
      console.error(`المنفذ ${port} مشغول بعملية ليست MongoDB.`);
      console.error('أغلق ما يشغله، أو شغّل على منفذ آخر: MONGO_MEMORY_PORT=27018');
      process.exit(1);
    }

    const samePath =
      !running.dbPath || path.resolve(running.dbPath).toLowerCase() === dbPath.toLowerCase();

    if (samePath) {
      console.log(`MongoDB ${running.version} يعمل بالفعل على ${port} — لا حاجة لنسخة ثانية.`);
      console.log(`URI: mongodb://127.0.0.1:${port}/car_hero`);
      console.log(`Database folder: ${running.dbPath ?? dbPath}`);
      console.log(`Uptime: ${running.uptimeSeconds}s`);
      console.log('لإيقافها: Get-Process mongod | Stop-Process');
      return;
    }

    console.error(`المنفذ ${port} يشغله MongoDB على مجلد آخر: ${running.dbPath}`);
    console.error(`والمطلوب هنا: ${dbPath}`);
    console.error('أوقف تلك النسخة أولاً: Get-Process mongod | Stop-Process');
    process.exit(1);
  }

  console.log(`Starting MongoMemoryServer ${version} with dbPath: ${dbPath}`);
  
  const mongoServer = await MongoMemoryServer.create({
    binary: {
      version,
    },
    instance: {
      port,
      dbPath: dbPath,
      storageEngine: 'wiredTiger',
    },
  });

  console.log(`MongoDB Memory Server started successfully!`);
  console.log(`URI: ${mongoServer.getUri()}`);
  console.log(`Port: ${port}`);
  console.log(`Database folder: ${dbPath}`);

  // Keep process alive
  process.on('SIGINT', async () => {
    console.log('Stopping MongoDB Memory Server...');
    await mongoServer.stop();
    process.exit(0);
  });
}

main().catch(err => {
  console.error('Failed to start MongoDB Memory Server:', err);
  process.exit(1);
});
