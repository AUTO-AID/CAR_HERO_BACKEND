import { Injectable } from '@nestjs/common';
import { Provider } from '../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import { ProviderStatus } from '../../../../core/enums/status.enum';
import { RECOMMENDATION_WEIGHTS, RECOMMENDATION_CONSTANTS } from '../../../../config/constants';

@Injectable()
export class ProviderScoringService {
  /**
   * Calculate recommendation score for a provider based on client criteria and historical metrics.
   * NOTE: Integrates provider_metrics data to dynamically score availability, performance, 
   * response time, and cancellations based on real historical data.
   */
  scoreProvider(
    provider: Provider,
    clientLat: number,
    clientLng: number,
    urgencyLevel: string,
    city: string,
    serviceCategory: string,
    preferredTimeStr?: string,
    metrics?: any // Optional: ProviderMetrics document if exists
  ) {
    const providerId = (provider as any)._id?.toString();
    const providerName = provider.businessName;

    // 1. Distance Calculation & Score (Normalized 0 - 1)
    const providerCoords = provider.location?.coordinates || [0, 0]; // [lng, lat]
    const providerLng = providerCoords[0];
    const providerLat = providerCoords[1];
    const distanceKm = this.getHaversineDistance(clientLat, clientLng, providerLat, providerLng);
    const distanceScore = this.calculateDistanceScore(distanceKm, provider.serviceRadiusKm);

    // 2. Rating Score (Normalized 0 - 1)
    // Use metrics rating if available, fallback to provider profile stats
    const avgRating = metrics ? (metrics.averageRating || 0) : (provider.averageRating || 0);
    const reviewsCount = metrics ? (metrics.totalReviews || 0) : (provider.totalReviews || 0);
    const ratingScore = this.calculateRatingScore(avgRating, reviewsCount);

    // 3. Service Match Score (Normalized 0 - 1)
    let serviceMatchScore = this.calculateServiceMatchScore(provider, serviceCategory);
    // Incorporate historical category specialization score if available
    if (metrics?.serviceSpecializationScores) {
      const specMap = metrics.serviceSpecializationScores;
      const specScore = specMap instanceof Map ? specMap.get(serviceCategory) : specMap[serviceCategory];
      if (typeof specScore === 'number') {
        serviceMatchScore = 0.4 * serviceMatchScore + 0.6 * specScore;
      }
    }

    // 4. Availability Score (Normalized 0 - 1)
    // If peak hours requested, check historical peak hour performance
    const availabilityInfo = this.calculateAvailabilityScore(provider, urgencyLevel, preferredTimeStr);
    let workingHoursScore = availabilityInfo.score;

    const targetDate = preferredTimeStr ? new Date(preferredTimeStr) : new Date();
    const isPeakHour = this.checkIsPeakHour(targetDate);
    if (isPeakHour && metrics?.peakHourPerformance?.completionRate) {
      workingHoursScore = 0.5 * workingHoursScore + 0.5 * metrics.peakHourPerformance.completionRate;
    }

    // 5. Emergency Support Score (Normalized 0 - 1)
    const hasEmergencySupport = provider.emergency247 || provider.is_emergency;
    const emergencySupportScore = hasEmergencySupport ? 1.0 : 0.0;

    // 6. Expected Response Time Score (Normalized 0 - 1)
    // Combine real-time status expectation with historical average response speed
    const responseTimeInfo = this.calculateExpectedResponseTimeScore(provider, urgencyLevel);
    let estimatedMinutes = responseTimeInfo.estimatedMinutes;
    if (metrics?.averageResponseTime && metrics.averageResponseTime > 0) {
      estimatedMinutes = 0.4 * estimatedMinutes + 0.6 * metrics.averageResponseTime;
    }
    const expectedResponseTimeScore = Math.max(0.0, 1.0 - estimatedMinutes / 120.0);

    // 7. Completed Orders Score (Normalized 0 - 1)
    const totalOrdersCount = metrics ? (metrics.completedOrders || 0) : (provider.totalOrders || 0);
    const completedOrdersScore = this.calculateCompletedOrdersScore(totalOrdersCount);

    // 8. Cancellation Rate Score (Normalized 0 - 1)
    const rate = metrics && typeof metrics.cancellationRate === 'number' 
      ? metrics.cancellationRate 
      : (typeof (provider as any).metadata?.cancellationRate === 'number' ? (provider as any).metadata.cancellationRate : 0.05);
    const cancellationRateScore = Math.max(0.0, 1.0 - rate);

    // 9. City Match Score (Normalized 0 - 1)
    let cityMatchScore = this.calculateCityMatchScore(provider, city);
    // Incorporate historical city completion rate if available
    if (metrics?.cityPerformance) {
      const cityMap = metrics.cityPerformance;
      const cityPerf = cityMap instanceof Map ? cityMap.get(city) : cityMap[city];
      if (cityPerf && typeof cityPerf.completionRate === 'number') {
        cityMatchScore = 0.5 * cityMatchScore + 0.5 * cityPerf.completionRate;
      }
    }

    // 10. Urgency Alignment Score (Normalized 0 - 1)
    const urgencyAlignmentScore = this.calculateUrgencyAlignmentScore(provider, urgencyLevel);

    // Collect Normalized Breakdown (Each value between 0 and 1)
    const scoringBreakdown = {
      distance: distanceScore,
      rating: ratingScore,
      serviceMatch: serviceMatchScore,
      workingHours: workingHoursScore,
      emergencySupport: emergencySupportScore,
      expectedResponseTime: expectedResponseTimeScore,
      completedOrders: completedOrdersScore,
      cancellationRate: cancellationRateScore,
      cityMatch: cityMatchScore,
      urgencyAlignment: urgencyAlignmentScore,
    };

    // Calculate Overall Weighted Score (Normalized to 0 - 100)
    let totalScore = 0;
    totalScore += scoringBreakdown.distance * RECOMMENDATION_WEIGHTS.distance;
    totalScore += scoringBreakdown.rating * RECOMMENDATION_WEIGHTS.rating;
    totalScore += scoringBreakdown.serviceMatch * RECOMMENDATION_WEIGHTS.serviceMatch;
    totalScore += scoringBreakdown.workingHours * RECOMMENDATION_WEIGHTS.workingHours;
    totalScore += scoringBreakdown.emergencySupport * RECOMMENDATION_WEIGHTS.emergencySupport;
    totalScore += scoringBreakdown.expectedResponseTime * RECOMMENDATION_WEIGHTS.expectedResponseTime;
    totalScore += scoringBreakdown.completedOrders * RECOMMENDATION_WEIGHTS.completedOrders;
    totalScore += scoringBreakdown.cancellationRate * RECOMMENDATION_WEIGHTS.cancellationRate;
    totalScore += scoringBreakdown.cityMatch * RECOMMENDATION_WEIGHTS.cityMatch;
    totalScore += scoringBreakdown.urgencyAlignment * RECOMMENDATION_WEIGHTS.urgencyAlignment;

    totalScore = parseFloat(Math.min(100, Math.max(0, totalScore)).toFixed(2));

    // Calculate Confidence Score (Normalized 0 - 1)
    const confidence = this.calculateConfidence(provider, providerCoords, reviewsCount, metrics);

    // Generate Reasons (Explaining why the provider is recommended in Arabic)
    const reasons = this.generateReasons(
      provider,
      distanceKm,
      availabilityInfo.isOpen,
      Math.round(estimatedMinutes),
      Math.round(rate * 100)
    );

    return {
      providerId,
      providerName,
      score: totalScore,
      confidence,
      scoringBreakdown,
      reasons,
      rawDistanceKm: parseFloat(distanceKm.toFixed(2)),
    };
  }

  /**
   * Helper: Calculate distance using Haversine formula
   */
  private getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * 1. Distance scoring (Normalized 0 - 1)
   */
  private calculateDistanceScore(distanceKm: number, serviceRadiusKm?: number): number {
    let score = 0;
    if (distanceKm <= 2) {
      score = 1.0;
    } else if (distanceKm <= 5) {
      score = 0.85;
    } else if (distanceKm <= 10) {
      score = 0.70;
    } else if (distanceKm <= 20) {
      score = 0.50;
    } else if (distanceKm <= 50) {
      score = Math.max(0.1, 1.0 - distanceKm / 50.0);
    } else {
      score = 0.05;
    }

    // Apply 50% penalty if beyond provider's coverage radius
    if (serviceRadiusKm && serviceRadiusKm > 0 && distanceKm > serviceRadiusKm) {
      score = score * 0.5;
    }

    return score;
  }

  /**
   * 2. Rating scoring using Bayesian Average (Normalized 0 - 1)
   */
  private calculateRatingScore(averageRating: number, totalReviews: number): number {
    const defaultRating = RECOMMENDATION_CONSTANTS.defaultGlobalRating;
    const m = RECOMMENDATION_CONSTANTS.minReviewsForConfidence;
    
    // Bayesian Average = (v * R + m * C) / (v + m)
    const bayesianRating = (totalReviews * averageRating + m * defaultRating) / (totalReviews + m);

    // Convert 1-5 scale rating to 0-1 score
    return bayesianRating / 5.0;
  }

  /**
   * 3. Service Match Score (Normalized 0 - 1)
   */
  private calculateServiceMatchScore(provider: Provider, serviceCategory: string): number {
    const categoryLower = serviceCategory.toLowerCase();
    
    const businessCategory = (provider.category || '').toLowerCase();
    if (businessCategory === categoryLower) {
      return 1.0;
    }

    const hasInServiceCategories = provider.serviceCategories?.some(
      sc => sc.toLowerCase() === categoryLower
    );
    if (hasInServiceCategories) {
      return 1.0;
    }

    const hasInTags = provider.tags?.some(t => t.toLowerCase() === categoryLower);
    if (hasInTags) {
      return 0.7;
    }

    const hasInServicesList = provider.services_list?.some(
      s => (s.name || '').toLowerCase().includes(categoryLower)
    );
    if (hasInServicesList) {
      return 0.5;
    }

    return 0.1;
  }

  /**
   * 4. Availability Score (Normalized 0 - 1)
   */
  private calculateAvailabilityScore(
    provider: Provider,
    urgencyLevel: string,
    preferredTimeStr?: string
  ): { score: number; isOpen: boolean } {
    if (urgencyLevel === 'emergency') {
      const isEmergencyProvider = provider.emergency247 || provider.is_emergency;
      return {
        score: isEmergencyProvider ? 1.0 : 0.2,
        isOpen: isEmergencyProvider
      };
    }

    const targetDate = preferredTimeStr ? new Date(preferredTimeStr) : new Date();
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDay = daysOfWeek[targetDate.getDay()];
    const targetMinutes = targetDate.getHours() * 60 + targetDate.getMinutes();

    let isOpen = false;
    let score = 0.3; // base score for closed/unknown hours

    const workingHour = provider.workingHours?.find(wh => wh.day.toLowerCase() === targetDay.toLowerCase());

    if (workingHour) {
      if (workingHour.isClosed) {
        isOpen = false;
        score = 0.1;
      } else {
        const openMin = this.timeToMinutes(workingHour.open || '09:00');
        const closeMin = this.timeToMinutes(workingHour.close || '18:00');
        
        if (targetMinutes >= openMin && targetMinutes <= closeMin) {
          isOpen = true;
          score = 1.0;
        } else {
          isOpen = false;
          score = 0.3;
        }
      }
    } else {
      // Standard hours fallback
      const openMin = 9 * 60; // 09:00
      const closeMin = 18 * 60; // 18:00
      if (targetMinutes >= openMin && targetMinutes <= closeMin) {
        isOpen = true;
        score = 0.8;
      }
    }

    return {
      score,
      isOpen
    };
  }

  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  }

  private checkIsPeakHour(date: Date): boolean {
    const hour = date.getHours();
    return (hour >= 8 && hour <= 11) || (hour >= 16 && hour <= 20);
  }

  /**
   * 6. Expected Response Time Score (Normalized 0 - 1)
   */
  private calculateExpectedResponseTimeScore(
    provider: Provider,
    urgencyLevel: string
  ): { score: number; estimatedMinutes: number } {
    let estimatedMinutes = RECOMMENDATION_CONSTANTS.offlineResponseTimeMinutes;

    if (urgencyLevel === 'emergency' && (provider.emergency247 || provider.is_emergency)) {
      estimatedMinutes = RECOMMENDATION_CONSTANTS.emergencyResponseTimeMinutes;
    } else if (provider.status === ProviderStatus.ONLINE) {
      estimatedMinutes = RECOMMENDATION_CONSTANTS.onlineResponseTimeMinutes;
    } else if (provider.status === ProviderStatus.BUSY) {
      estimatedMinutes = RECOMMENDATION_CONSTANTS.busyResponseTimeMinutes;
    }

    const score = Math.max(0.0, 1.0 - estimatedMinutes / 120.0);

    return {
      score,
      estimatedMinutes
    };
  }

  /**
   * 7. Completed Orders Score (Normalized 0 - 1)
   */
  private calculateCompletedOrdersScore(totalOrders: number): number {
    if (totalOrders >= 100) return 1.0;
    if (totalOrders >= 50) return 0.9;
    if (totalOrders >= 20) return 0.75;
    if (totalOrders >= 5) return 0.5;
    return 0.2;
  }

  /**
   * 9. City Match Score (Normalized 0 - 1)
   */
  private calculateCityMatchScore(provider: Provider, city: string): number {
    const searchCity = city.toLowerCase();
    const pCity = (provider.city || '').toLowerCase();
    const pGov = (provider.governorate || '').toLowerCase();

    if (pCity === searchCity) {
      return 1.0;
    }
    if (pGov === searchCity) {
      return 0.8;
    }

    const isCovered = provider.coverageAreas?.some(
      area => area.toLowerCase().includes(searchCity)
    );
    if (isCovered) {
      return 0.7;
    }

    return 0.1;
  }

  /**
   * 10. Urgency Alignment Score (Normalized 0 - 1)
   */
  private calculateUrgencyAlignmentScore(provider: Provider, urgencyLevel: string): number {
    if (urgencyLevel === 'emergency') {
      return (provider.emergency247 || provider.is_emergency) ? 1.0 : 0.1;
    }
    return 1.0; // Normal requests can be served by any provider
  }

  /**
   * Confidence score calculation (Normalized 0 - 1)
   */
  private calculateConfidence(provider: Provider, coords: number[], reviewsCount: number, metrics?: any): number {
    // 1. Rating confidence (grows with review volume: 1 - e^(-reviews / 5))
    const ratingConfidence = 1.0 - Math.exp(-reviewsCount / 5.0);

    // 2. Availability data richness (1.0 if working hours exist, 0.5 otherwise)
    const workingHoursCompleteness = (provider.workingHours && provider.workingHours.length > 0) ? 1.0 : 0.5;

    // 3. Location precision (1.0 if valid geo coords, 0.0 if not)
    const locationPrecision = (coords[0] !== 0 || coords[1] !== 0) ? 1.0 : 0.0;

    // 4. Boost confidence if we have rich historical metrics (up to +0.1)
    let metricsBoost = 0;
    if (metrics && metrics.totalOrders > 30) {
      metricsBoost = 0.1;
    }

    // Weighted Confidence
    const confidence = 0.45 * ratingConfidence + 0.25 * workingHoursCompleteness + 0.2 * locationPrecision + metricsBoost;
    return parseFloat(Math.min(1.0, confidence).toFixed(2));
  }

  /**
   * Generate reasons for recommendation in Arabic
   */
  private generateReasons(
    provider: Provider,
    distanceKm: number,
    isOpenNow: boolean,
    responseTimeMin: number,
    cancellationRatePercent: number
  ): string[] {
    const reasons: string[] = [];

    if (distanceKm <= 3) {
      reasons.push(`قريب جداً من موقعك الحالي (على بعد ${distanceKm.toFixed(1)} كم)`);
    } else if (distanceKm <= 8) {
      reasons.push(`يتواجد على مسافة قريبة نسبياً (${distanceKm.toFixed(1)} كم)`);
    }

    if (provider.averageRating && provider.averageRating >= 4.5) {
      reasons.push(`تقييمه ممتاز (${provider.averageRating.toFixed(1)}/5) بناءً على رضا العملاء`);
    }

    if (provider.emergency247 || provider.is_emergency) {
      reasons.push('يدعم خدمات الاستجابة السريعة والطوارئ 24/7');
    }

    if (responseTimeMin <= 20) {
      reasons.push(`سرعة استجابة متوقعة فائقة (حوالي ${responseTimeMin} دقيقة)`);
    }

    if (provider.experienceYears && provider.experienceYears >= 5) {
      reasons.push(`يمتلك خبرة فنية ممتازة تفوق ${provider.experienceYears} سنوات`);
    }

    if (provider.totalOrders && provider.totalOrders >= 30) {
      reasons.push(`أنجز بنجاح أكثر من ${provider.totalOrders} طلب سابق في النظام`);
    }

    if (cancellationRatePercent <= 3) {
      reasons.push('يتميز بنسبة التزام عالية جداً ونادر الإلغاء للطلبات');
    }

    // Default reason if reasons is empty
    if (reasons.length === 0) {
      reasons.push('يطابق المعايير الفنية والجغرافية المطلوبة لخدمتك');
    }

    return reasons;
  }
}
