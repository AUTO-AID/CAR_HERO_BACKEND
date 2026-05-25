const fs = require('fs');
const collection = JSON.parse(fs.readFileSync('e:/all_project/CarHero/CAR_HERO_BACKEND/postman/car_hero_backend.postman_collection.json', 'utf8'));

function findRequest(items) {
  for (const item of items) {
    if (item.item) {
      findRequest(item.item);
    } else if (item.request && item.name === 'POST /reviews') {
      console.log('Found request:', JSON.stringify(item.request, null, 2));
    }
  }
}

findRequest(collection.item);
