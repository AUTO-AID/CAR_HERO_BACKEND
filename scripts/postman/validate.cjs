const fs = require('fs');
const path = require('path');

const collectionsDir = path.resolve(__dirname, '../../postman/collections');
let failed = false;

function error(message) {
  failed = true;
  console.error(`[ERROR] ${message}`);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (cause) {
    error(`${file} is not valid JSON: ${cause.message}`);
    return null;
  }
}

function flatten(items) {
  return (items || []).flatMap((item) => [
    ...(item.request ? [item] : []),
    ...flatten(item.item),
  ]);
}

function requestPath(item) {
  const url = item.request?.url;
  if (Array.isArray(url?.path)) return `/${url.path.join('/')}`;
  return (typeof url === 'string' ? url : url?.raw || '')
    .replace(/^{{base_url}}/, '')
    .replace(/^https?:\/\/[^/]+(?:\/api\/v1)?/, '')
    .split('?')[0];
}

function requestKey(item) {
  return `${item.request?.method || 'GET'} ${requestPath(item)
    .replace(/{{[^}]+}}/g, ':id')
    .replace(/:[A-Za-z][A-Za-z0-9_]*/g, ':id')}`;
}

function collectVariables(value, result = new Set()) {
  if (typeof value === 'string') {
    for (const match of value.matchAll(/{{([^}]+)}}/g)) result.add(match[1]);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectVariables(item, result));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectVariables(item, result));
  }
  return result;
}

function matchingFile(files, suffix, product) {
  const matches = files.filter((file) => file.endsWith(suffix));
  if (matches.length !== 1) {
    error(`${product} must contain exactly one ${suffix} file`);
    return null;
  }
  return matches[0];
}

function requireAppContract(requests, availableVariables) {
  const requiredVariables = [
    'base_url', 'ws_url', 'access_token', 'phone_number', 'otp_code',
    'refresh_token', 'participant_id', 'payment_id', 'provider_id', 'service_id',
    'vehicle_id', 'order_id', 'address_id', 'payment_method_id', 'offer_id',
    'wash_plan_id', 'device_token', 'longitude', 'latitude', 'max_distance_km',
  ];
  for (const variable of requiredVariables) {
    if (!availableVariables.has(variable)) error(`app environment is missing required {{${variable}}}`);
  }

  const byKey = new Map(requests.map((request) => [requestKey(request), request]));
  const requiredEndpoints = [
    'POST /orders/:id/customer-confirm-completion',
    'POST /customer/wash-plans/:id/generate-booking',
    'POST /orders/:id/payment/verify',
    'POST /wallet/redeem-points',
    'POST /customer/offers/:id/apply',
    'GET /providers/nearby',
  ];
  for (const endpoint of requiredEndpoints) {
    if (!byKey.has(endpoint)) error(`app collection is missing required endpoint: ${endpoint}`);
  }

  const nearbyUrl = byKey.get('GET /providers/nearby')?.request?.url?.raw || '';
  for (const variable of ['longitude', 'latitude', 'max_distance_km']) {
    if (!nearbyUrl.includes(`{{${variable}}}`)) {
      error(`app GET /providers/nearby must use {{${variable}}}`);
    }
  }

  const requiredBodyKeys = {
    'POST /auth/register': ['fullName', 'phoneNumber', 'password', 'accountType', 'isTermsAccepted'],
    'POST /auth/reset-password': ['phoneNumber', 'otpCode', 'newPassword'],
    'POST /orders/:id/payment/verify': ['paymentId', 'paymentMethod'],
    'POST /wallet/redeem-points': ['points', 'orderId'],
    'POST /customer/offers/:id/apply': ['orderId'],
    'POST /customer/wash-plans': ['vehicleId', 'addressId', 'visitsPerMonth', 'washType', 'preferredTimeSlot', 'reminderEnabled'],
  };
  for (const [endpoint, expectedKeys] of Object.entries(requiredBodyKeys)) {
    const request = byKey.get(endpoint);
    if (!request) {
      error(`app collection is missing body contract endpoint: ${endpoint}`);
      continue;
    }
    try {
      const body = JSON.parse(request.request?.body?.raw || '{}');
      const actualKeys = Object.keys(body).sort();
      const wantedKeys = [...expectedKeys].sort();
      if (JSON.stringify(actualKeys) !== JSON.stringify(wantedKeys)) {
        error(`app ${endpoint} body keys must be exactly: ${wantedKeys.join(', ')}`);
      }
    } catch {
      error(`app ${endpoint} must contain a valid JSON body example`);
    }
  }
}

function main() {
  const products = fs.readdirSync(collectionsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (!products.length) error('No product collections found.');

  for (const product of products) {
    const productDir = path.join(collectionsDir, product);
    const files = fs.readdirSync(productDir);
    const collectionFile = matchingFile(files, '.postman_collection.json', product);
    const environmentFile = matchingFile(files, '.postman_environment.json', product);
    if (!collectionFile || !environmentFile) continue;

    const collection = readJson(path.join(productDir, collectionFile));
    const environment = readJson(path.join(productDir, environmentFile));
    if (!collection || !environment) continue;

    const requests = flatten(collection.item);
    const availableVariables = new Set((environment.values || []).map((item) => item.key));
    const baseUrl = (environment.values || []).find((item) => item.key === 'base_url')?.value || '';
    for (const variable of collectVariables(collection)) {
      if (!availableVariables.has(variable)) error(`${product} environment is missing {{${variable}}}`);
    }

    const seen = new Map();
    for (const request of requests) seen.set(requestKey(request), (seen.get(requestKey(request)) || 0) + 1);
    if (/\/api\/v1\/?$/.test(baseUrl)) {
      for (const request of requests) {
        const raw = typeof request.request?.url === 'string' ? request.request.url : request.request?.url?.raw || '';
        if (raw.startsWith('{{base_url}}/v1/')) {
          error(`${product} contains duplicated API version segment: ${request.request?.method || 'GET'} ${raw}`);
        }
      }
    }
    for (const [key, count] of seen.entries()) {
      const intentionalAiExamples = key === 'POST /ai/recommend-provider';
      if (count > 1 && !intentionalAiExamples) error(`${product} contains ${count} copies of ${key}`);
    }
    if (product === 'app') requireAppContract(requests, availableVariables);

    console.log(`${product}: ${requests.length} requests, ${availableVariables.size} environment variables`);
  }

  if (failed) process.exit(1);
  console.log('Direct Postman product collections are valid.');
}

main();
