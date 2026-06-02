const fs = require('fs');
const path = require('path');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value, 'utf8');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function flatten(items, parents = []) {
  const requests = [];
  for (const item of items || []) {
    const nextParents = [...parents, item.name];
    if (item.request) {
      requests.push({
        item,
        parents,
        name: item.name,
        key: requestKey(item),
      });
    }
    if (item.item) requests.push(...flatten(item.item, nextParents));
  }
  return requests;
}

function requestPath(item) {
  const url = item.request?.url;
  if (Array.isArray(url?.path)) return `/${url.path.join('/')}`;
  const raw = typeof url === 'string' ? url : url?.raw || '';
  return raw
    .replace(/^{{base_url}}/, '')
    .replace(/^https?:\/\/[^/]+(?:\/api\/v1)?/, '')
    .split('?')[0];
}

function normalizedPath(item) {
  return requestPath(item)
    .replace(/{{[^}]+}}/g, ':id')
    .replace(/:[A-Za-z][A-Za-z0-9_]*/g, ':id');
}

function requestKey(item) {
  return `${item.request?.method || 'GET'} ${normalizedPath(item)}`;
}

function createCollection(source, name, description, items) {
  return {
    info: {
      ...clone(source.info),
      name,
      description,
    },
    ...(source.auth ? { auth: clone(source.auth) } : {}),
    ...(source.event ? { event: clone(source.event) } : {}),
    item: items,
  };
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

function filterEnvironment(environment, collection, name) {
  const required = collectVariables(collection);
  required.add('base_url');
  const values = (environment.values || []).filter((item) => required.has(item.key));
  const available = new Set(values.map((item) => item.key));
  for (const key of required) {
    if (!available.has(key)) {
      values.push({
        key,
        value: '',
        type: 'default',
        enabled: true,
      });
    }
  }
  return {
    ...clone(environment),
    name,
    values,
  };
}

function safeFileName(product) {
  return `car_hero_${product.replace(/-/g, '_')}`;
}

module.exports = {
  clone,
  collectVariables,
  createCollection,
  filterEnvironment,
  flatten,
  normalizedPath,
  readJson,
  requestKey,
  requestPath,
  safeFileName,
  writeJson,
  writeText,
};
