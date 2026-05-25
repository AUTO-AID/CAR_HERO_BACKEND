const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');

async function main() {
  const dbPath = path.resolve('E:/all_project/CarHero/mongodb-data');
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }

  console.log(`Starting MongoMemoryServer with dbPath: ${dbPath}`);
  
  const mongoServer = await MongoMemoryServer.create({
    binary: {
      version: '6.0.16',
    },
    instance: {
      port: 27017,
      dbPath: dbPath,
      storageEngine: 'wiredTiger',
    },
  });

  console.log(`MongoDB Memory Server started successfully!`);
  console.log(`URI: ${mongoServer.getUri()}`);
  console.log(`Port: 27017`);
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
