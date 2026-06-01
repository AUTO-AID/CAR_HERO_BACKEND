const { MongoMemoryServer } = require('mongodb-memory-server');
const { spawn } = require('child_process');
const path = require('path');

async function start() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log(`\n==========================================`);
  console.log(`Mock MongoDB started at: ${uri}`);
  console.log(`==========================================\n`);

  const env = { ...process.env, MONGODB_URI: uri };
  
  const child = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'start:dev'], {
    env,
    stdio: 'inherit',
    cwd: process.cwd(),
    shell: true
  });

  child.on('close', (code) => {
    mongod.stop();
    process.exit(code);
  });

  process.on('SIGINT', async () => {
    await mongod.stop();
    child.kill('SIGINT');
    process.exit(0);
  });
}

start().catch(console.error);
