const fs = require('fs');
const results = JSON.parse(fs.readFileSync('E:/all_project/CarHero/CAR_HERO_BACKEND/postman_audit_results.json', 'utf8'));

const r131 = results.find(r => r.id === 131);
console.log('Result 131:', JSON.stringify(r131, null, 2));
