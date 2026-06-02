const fs = require('fs');
const path = require('path');
const config = require('./config.cjs');
const { readJson, safeFileName } = require('./lib.cjs');

const apiKey = process.env.POSTMAN_API_KEY;
const workspaceId = process.env.POSTMAN_WORKSPACE_ID;
const products = (process.env.POSTMAN_PRODUCTS || 'master,app,provider-dashboard,admin-dashboard,website,ai,shared')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

if (!apiKey || !workspaceId) {
  console.error('Set POSTMAN_API_KEY and POSTMAN_WORKSPACE_ID before publishing.');
  process.exit(1);
}

async function request(method, endpoint, body) {
  const response = await fetch(`https://api.getpostman.com${endpoint}`, {
    method,
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${method} ${endpoint} failed (${response.status}): ${JSON.stringify(payload)}`);
  return payload;
}

async function main() {
  const existing = await request('GET', `/collections?workspace=${encodeURIComponent(workspaceId)}`);
  const collections = existing.collections || [];
  const existingEnvironments = await request('GET', `/environments?workspace=${encodeURIComponent(workspaceId)}`);
  const environments = existingEnvironments.environments || [];

  for (const product of products) {
    const base = safeFileName(product);
    const collectionFile = path.join(config.outputDir, product, `${base}.postman_collection.json`);
    const environmentFile = path.join(config.outputDir, product, `${base}.local.postman_environment.json`);
    if (!fs.existsSync(collectionFile) || !fs.existsSync(environmentFile)) {
      throw new Error(`Missing generated files for ${product}. Run npm run postman:generate.`);
    }
    const collection = readJson(collectionFile);
    const match = collections.find((item) => item.name === collection.info.name);

    if (match) {
      await request('PUT', `/collections/${match.uid}`, { collection });
      console.log(`Updated: ${collection.info.name}`);
    } else {
      await request('POST', `/collections?workspace=${encodeURIComponent(workspaceId)}`, { collection });
      console.log(`Created: ${collection.info.name}`);
    }

    const environment = readJson(environmentFile);
    const environmentMatch = environments.find((item) => item.name === environment.name);
    if (environmentMatch) {
      await request('PUT', `/environments/${environmentMatch.uid}`, { environment });
      console.log(`Updated environment: ${environment.name}`);
    } else {
      await request('POST', `/environments?workspace=${encodeURIComponent(workspaceId)}`, { environment });
      console.log(`Created environment: ${environment.name}`);
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
