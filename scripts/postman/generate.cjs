const fs = require('fs');
const path = require('path');
const config = require('./config.cjs');
const {
  clone,
  createCollection,
  filterEnvironment,
  flatten,
  readJson,
  requestPath,
  safeFileName,
  writeJson,
  writeText,
} = require('./lib.cjs');

const PUBLIC_AUTH = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/verify-otp',
  '/auth/resend-otp',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/refresh-token',
]);

function route(item) {
  return requestPath(item).replace(/{{[^}]+}}/g, ':id');
}

function isPublicService(pathname) {
  return pathname === '/services' || pathname.startsWith('/services/:id') ||
    pathname === '/services/categories' || pathname === '/services/emergency' ||
    pathname === '/services/search';
}

function isPublicProvider(pathname) {
  return pathname === '/providers' || pathname === '/providers/:id' ||
    pathname === '/providers/nearby' || pathname === '/providers/top-rated' ||
    pathname === '/providers/apply' || pathname === '/providers/public/governorates' ||
    pathname.startsWith('/reviews/provider/');
}

function classifyBackendItem(item, parents) {
  const pathname = route(item);
  const folder = parents[0] || '';
  const products = new Set();

  if (PUBLIC_AUTH.has(pathname)) {
    products.add('app');
    products.add('provider-dashboard');
    products.add('website');
  }

  if (folder === 'system - app') {
    products.add('app');
    products.add('provider-dashboard');
    products.add('website');
  }
  if (folder === 'users') products.add('app');
  if (folder === 'users - auth') {
    products.add('app');
    products.add('provider-dashboard');
  }
  if (folder === 'vehicles') products.add('app');
  if (folder === 'wallets - wallet') products.add('app');
  if (folder === 'subscription_plans - subscriptions') products.add('app');

  if (folder === 'orders' || folder === 'bookings - scheduled orders') {
    products.add('app');
    products.add('provider-dashboard');
  }
  if (folder === 'notifications' || folder === 'chats - chat') {
    products.add('app');
    products.add('provider-dashboard');
  }
  if (folder === 'orders - status histories') {
    products.add('provider-dashboard');
    if (pathname.includes('/admin/')) products.add('admin-dashboard');
  }

  if (folder === 'providers - wallet') products.add('provider-dashboard');
  if (pathname.startsWith('/providers/me') || pathname.startsWith('/providers/dashboard')) {
    products.add('provider-dashboard');
  }
  if (folder === 'reviews') {
    products.add('app');
    products.add('provider-dashboard');
  }
  if (pathname === '/providers/:id/approve') products.add('admin-dashboard');
  if (folder === 'users - whatsapp') products.add('admin-dashboard');

  if (isPublicService(pathname)) {
    products.add('app');
    products.add('provider-dashboard');
    products.add('website');
  }
  if (isPublicProvider(pathname)) {
    products.add('app');
    products.add('website');
  }

  if (folder.startsWith('admins -') || pathname.startsWith('/admin/') || pathname.startsWith('/v1/admin/')) {
    products.add('admin-dashboard');
  }

  return products;
}

function cloneFolder(name, requests) {
  return {
    name,
    item: requests.map(({ item }) => clone(item)),
  };
}

function productFoldersFromBackend(backend, product) {
  const folders = [];
  for (const folder of backend.item || []) {
    const selected = flatten(folder.item || [], [folder.name])
      .filter(({ item, parents }) => classifyBackendItem(item, parents).has(product));
    if (selected.length) folders.push(cloneFolder(folder.name, selected));
  }
  return folders;
}

function mergeMaster(backend, ai) {
  return createCollection(
    backend,
    'Car Hero - Backend Master API',
    'Complete Car Hero API reference. Product collections are generated from this source and the AI source.',
    [
      ...clone(backend.item || []),
      {
        name: 'ai - recommendation and analytics',
        item: clone(ai.item || []),
      },
    ],
  );
}

function makeEnvironment(baseEnvironment, collection, product) {
  const environment = filterEnvironment(
    baseEnvironment,
    collection,
    `Car Hero - ${product} - Local`,
  );
  if (['app', 'provider-dashboard', 'shared', 'master'].includes(product) &&
      !environment.values.some((item) => item.key === 'ws_url')) {
    environment.values.splice(1, 0, {
      key: 'ws_url',
      value: 'http://localhost:3001/ws',
      type: 'default',
      enabled: true,
    });
  }
  return environment;
}

function teamReadme(product, collection) {
  const requests = flatten(collection.item);
  return `# ${collection.info.name}

Generated from the backend Postman sources. Do not edit this generated file manually.

## Import

Import the collection and its local environment from this folder when working offline.
For daily collaboration, use the synchronized Postman Workspace collection with the same name.

## Local URLs

- API: \`http://localhost:3001/api/v1\`
- WebSocket: \`http://localhost:3001/ws\`

## Requests

This collection contains ${requests.length} requests.

Regenerate all product collections from the backend root:

\`\`\`text
npm run postman:generate
npm run postman:validate
\`\`\`
`;
}

function writeProduct(product, collection, baseEnvironment) {
  const productDir = path.join(config.outputDir, product);
  const baseName = safeFileName(product);
  writeJson(path.join(productDir, `${baseName}.postman_collection.json`), collection);
  writeJson(
    path.join(productDir, `${baseName}.local.postman_environment.json`),
    makeEnvironment(baseEnvironment, collection, product),
  );
  writeText(path.join(productDir, 'README.md'), teamReadme(product, collection));
}

function main() {
  const backend = readJson(config.sources.backend);
  const ai = readJson(config.sources.ai);
  const environment = readJson(config.sources.environment);
  for (const variable of ai.variable || []) {
    if (!environment.values.some((item) => item.key === variable.key)) {
      environment.values.push({
        key: variable.key,
        value: variable.value || '',
        type: 'default',
        enabled: true,
      });
    }
  }
  fs.rmSync(config.outputDir, { recursive: true, force: true });

  const master = mergeMaster(backend, ai);
  writeProduct('master', master, environment);

  const generated = {};
  for (const product of ['app', 'provider-dashboard', 'admin-dashboard', 'website']) {
    const aiItems = product === 'app'
      ? clone((ai.item || []).filter((folder) => folder.name === 'AI Recommendation Engine'))
      : product === 'admin-dashboard'
        ? clone((ai.item || []).filter((folder) => folder.name === 'AI Admin Dashboard Analytics'))
        : [];
    generated[product] = createCollection(
      backend,
      config.products[product].name,
      config.products[product].description,
      [...productFoldersFromBackend(backend, product), ...aiItems],
    );
    writeProduct(product, generated[product], environment);
  }

  generated.ai = createCollection(
    ai,
    config.products.ai.name,
    config.products.ai.description,
    clone(ai.item || []),
  );
  writeProduct('ai', generated.ai, environment);

  const usage = new Map();
  for (const product of ['app', 'provider-dashboard', 'admin-dashboard', 'website']) {
    for (const entry of flatten(generated[product].item)) {
      if (!usage.has(entry.key)) usage.set(entry.key, []);
      usage.get(entry.key).push({ product, entry });
    }
  }
  const sharedItems = [...usage.values()]
    .filter((entries) => entries.length > 1)
    .map((entries) => clone(entries[0].entry.item));
  generated.shared = createCollection(
    backend,
    config.products.shared.name,
    config.products.shared.description,
    [{ name: 'shared endpoints', item: sharedItems }],
  );
  writeProduct('shared', generated.shared, environment);

  const counts = {
    master: flatten(master.item).length,
    ...Object.fromEntries(Object.entries(generated).map(([product, collection]) => [product, flatten(collection.item).length])),
  };
  writeJson(path.join(config.outputDir, 'manifest.json'), {
    generatedBy: 'npm run postman:generate',
    sources: Object.values(config.sources).map((file) => path.relative(config.postmanDir, file)),
    counts,
  });
  console.log('Generated Postman collections:');
  Object.entries(counts).forEach(([product, count]) => console.log(`  ${product}: ${count} requests`));
}

main();
