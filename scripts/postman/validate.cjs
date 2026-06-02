const fs = require('fs');
const path = require('path');
const config = require('./config.cjs');
const {
  collectVariables,
  flatten,
  readJson,
  requestKey,
  safeFileName,
} = require('./lib.cjs');

const products = ['master', 'app', 'provider-dashboard', 'admin-dashboard', 'website', 'ai', 'shared'];
let failed = false;

function error(message) {
  failed = true;
  console.error(`[ERROR] ${message}`);
}

function collectionFile(product) {
  const base = safeFileName(product);
  return path.join(config.outputDir, product, `${base}.postman_collection.json`);
}

function environmentFile(product) {
  const base = safeFileName(product);
  return path.join(config.outputDir, product, `${base}.local.postman_environment.json`);
}

function assertUniqueRequests(product, collection) {
  const seen = new Map();
  for (const entry of flatten(collection.item)) {
    const count = (seen.get(entry.key) || 0) + 1;
    seen.set(entry.key, count);
  }
  for (const [key, count] of seen.entries()) {
    const intentionalAiExamples = key === 'POST /ai/recommend-provider';
    if (count > 1 && !intentionalAiExamples) error(`${product} contains ${count} copies of ${key}`);
  }
}

function assertEnvironment(product, collection, environment) {
  const available = new Set((environment.values || []).map((item) => item.key));
  for (const variable of collectVariables(collection)) {
    if (!available.has(variable)) error(`${product} environment is missing {{${variable}}}`);
  }
}

function keys(collection) {
  return new Set(flatten(collection.item).map(({ item }) => requestKey(item)));
}

function main() {
  if (!fs.existsSync(config.outputDir)) {
    error('Generated collections are missing. Run npm run postman:generate first.');
  }

  const collections = {};
  for (const product of products) {
    const collectionPath = collectionFile(product);
    const envPath = environmentFile(product);
    if (!fs.existsSync(collectionPath) || !fs.existsSync(envPath)) {
      error(`${product} generated collection or environment is missing`);
      continue;
    }
    collections[product] = readJson(collectionPath);
    const environment = readJson(envPath);
    assertUniqueRequests(product, collections[product]);
    assertEnvironment(product, collections[product], environment);
  }

  if (collections.master) {
    const masterKeys = keys(collections.master);
    const assignedKeys = new Set();
    for (const product of ['app', 'provider-dashboard', 'admin-dashboard', 'website', 'ai']) {
      if (!collections[product]) continue;
      keys(collections[product]).forEach((key) => assignedKeys.add(key));
    }
    for (const key of masterKeys) {
      if (!assignedKeys.has(key)) error(`No product collection owns ${key}`);
    }
    console.log(`Master coverage: ${assignedKeys.size}/${masterKeys.size} unique endpoints assigned`);
  }

  if (failed) process.exit(1);
  console.log('Postman generated collections are valid.');
}

main();
