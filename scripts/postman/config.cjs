const path = require('path');

const postmanDir = path.resolve(__dirname, '../../postman');

module.exports = {
  postmanDir,
  sources: {
    backend: path.join(postmanDir, 'car_hero_backend.postman_collection.json'),
    ai: path.join(postmanDir, 'ai_recommendations.postman_collection.json'),
    environment: path.join(postmanDir, 'car_hero_backend.postman_environment.json'),
  },
  outputDir: path.join(postmanDir, 'generated'),
  products: {
    app: {
      name: 'Car Hero - Customer App API',
      description: 'Customer mobile application endpoints, including provider live tracking.',
    },
    'provider-dashboard': {
      name: 'Car Hero - Provider Dashboard API',
      description: 'Provider dashboard endpoints for operations, services, wallet, and live tracking.',
    },
    'admin-dashboard': {
      name: 'Car Hero - Admin Dashboard API',
      description: 'Administrative dashboard endpoints and AI analytics administration.',
    },
    website: {
      name: 'Car Hero - Public Website API',
      description: 'Public website endpoints for browsing services, providers, and provider applications.',
    },
    ai: {
      name: 'Car Hero - AI API',
      description: 'AI provider recommendation and AI analytics endpoints.',
    },
    shared: {
      name: 'Car Hero - Shared API',
      description: 'Reusable endpoints consumed by more than one Car Hero client.',
    },
  },
};

