const fs = require('fs');

function decodeJwt(token) {
  if (!token) return 'null';
  try {
    const parts = token.split('.');
    const payload = Buffer.from(parts[1], 'base64').toString('utf8');
    return JSON.parse(payload);
  } catch (e) {
    return 'invalid: ' + e.message;
  }
}

// Let's read the audit results for Audit #172
const results = JSON.parse(fs.readFileSync('postman_audit_results.json', 'utf8'));
const r172 = results.find(r => r.id === 172);
console.log('Result 172 URL:', r172.url);
console.log('Result 172 Code:', r172.code);
console.log('Result 172 Response:', r172.response);
