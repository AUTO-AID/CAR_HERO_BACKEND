const fs = require('fs');
const path = require('path');

const apiKey = process.env.POSTMAN_API_KEY;
const workspaceId = process.env.POSTMAN_WORKSPACE_ID;
const collectionsDir = path.resolve(__dirname, '../../postman/collections');
const selectedProducts = process.env.POSTMAN_PRODUCTS
  ? new Set(process.env.POSTMAN_PRODUCTS.split(',').map((value) => value.trim()).filter(Boolean))
  : null;

const legacyCollectionNames = [
  'Car Hero - Backend Master API',
  'Car Hero - Shared API',
];
const legacyEnvironmentNames = [
  'Car Hero - master - Local',
  'Car Hero - shared - Local',
];

if (!apiKey || !workspaceId) {
  console.error('Set POSTMAN_API_KEY and POSTMAN_WORKSPACE_ID before publishing.');
  process.exit(1);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function onlyFile(files, suffix, product) {
  const matches = files.filter((file) => file.endsWith(suffix));
  if (matches.length !== 1) throw new Error(`${product} must contain exactly one ${suffix} file`);
  return matches[0];
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

async function deleteLegacy(items, names, endpoint) {
  for (const name of names) {
    const match = items.find((item) => item.name === name);
    if (!match) continue;
    await request('DELETE', `/${endpoint}/${match.uid}`);
    console.log(`Deleted legacy ${endpoint.slice(0, -1)}: ${name}`);
  }
}

async function main() {
  const existingCollections = (await request('GET', `/collections?workspace=${encodeURIComponent(workspaceId)}`)).collections || [];
  const existingEnvironments = (await request('GET', `/environments?workspace=${encodeURIComponent(workspaceId)}`)).environments || [];

  await deleteLegacy(existingCollections, legacyCollectionNames, 'collections');
  await deleteLegacy(existingEnvironments, legacyEnvironmentNames, 'environments');

  const products = fs.readdirSync(collectionsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((product) => !selectedProducts || selectedProducts.has(product))
    .sort();

  for (const product of products) {
    const productDir = path.join(collectionsDir, product);
    const files = fs.readdirSync(productDir);
    const collection = readJson(path.join(productDir, onlyFile(files, '.postman_collection.json', product)));
    const environment = readJson(path.join(productDir, onlyFile(files, '.postman_environment.json', product)));

    const collectionMatch = existingCollections.find((item) => item.name === collection.info.name);
    if (collectionMatch) {
      await request('PUT', `/collections/${collectionMatch.uid}`, { collection });
      console.log(`Updated: ${collection.info.name}`);
    } else {
      await request('POST', `/collections?workspace=${encodeURIComponent(workspaceId)}`, { collection });
      console.log(`Created: ${collection.info.name}`);
    }

    const environmentMatch = existingEnvironments.find((item) => item.name === environment.name);
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
