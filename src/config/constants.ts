/**
 * Recommendation weights and constants for the AI provider recommendation engine.
 * The current system is rule-based and uses normalized weights to calculate weighted scores.
 * This structure is designed to be easily integrated with a machine learning model later (e.g. training weights).
 */
export const RECOMMENDATION_WEIGHTS = {
  distance: 25,            // Weight for proximity to client (0 to 1)
  rating: 15,              // Weight for Bayesian average rating (0 to 1)
  serviceMatch: 15,        // Weight for matching requested service (0 to 1)
  workingHours: 10,        // Weight for availability during requested hours (0 to 1)
  emergencySupport: 10,    // Weight for emergency 24/7 support availability (0 to 1)
  expectedResponseTime: 5, // Weight for estimated response time (0 to 1)
  completedOrders: 10,     // Weight for historical order volume (0 to 1)
  cancellationRate: 5,     // Weight for cancellation rate (0 to 1)
  cityMatch: 3,            // Weight for matching city/governorate (0 to 1)
  urgencyAlignment: 2,     // Weight for alignment with urgency level (0 to 1)
};

export const RECOMMENDATION_CONSTANTS = {
  minReviewsForConfidence: 5,        // Conf threshold for Bayesian Rating
  defaultGlobalRating: 4.0,          // System default global rating
  emergencyResponseTimeMinutes: 20,  // Expected response time for emergency in minutes
  onlineResponseTimeMinutes: 15,     // Expected response time for online status in minutes
  busyResponseTimeMinutes: 60,       // Expected response time for busy status in minutes
  offlineResponseTimeMinutes: 120,   // Expected response time for offline status in minutes
};
