export type PressureLevel = 'healthy' | 'watch' | 'pressured' | 'critical';
export type RecommendationPriority = 'low' | 'medium' | 'high' | 'critical';

export type PressureInput = {
  ordersCount: number;
  previousOrdersCount: number;
  activeProviders: number;
  cancelledOrders: number;
  rejectedOrders: number;
  unassignedOrders: number;
  avgResponseMinutes: number;
};

export type PressureResult = {
  pressureScore: number;
  level: PressureLevel;
  ordersPerProvider: number;
  cancelRate: number;
  unassignedRate: number;
  recentGrowthRate: number;
  componentScores: {
    ordersPerProvider: number;
    cancelRate: number;
    responseTime: number;
    unassigned: number;
    growth: number;
  };
};

export type RecruitmentRecommendationInput = PressureInput & {
  city: string;
  governorate?: string;
  serviceId: string;
  serviceName: string;
};

export class PressureScoreEngine {
  calculate(input: PressureInput): PressureResult {
    const ordersCount = this.positive(input.ordersCount);
    const activeProviders = this.positive(input.activeProviders);
    const ordersPerProvider = activeProviders > 0 ? ordersCount / activeProviders : ordersCount;
    const cancelRate = ordersCount > 0
      ? ((this.positive(input.cancelledOrders) + this.positive(input.rejectedOrders)) / ordersCount) * 100
      : 0;
    const unassignedRate = ordersCount > 0 ? (this.positive(input.unassignedOrders) / ordersCount) * 100 : 0;
    const recentGrowthRate = this.growthRate(ordersCount, this.positive(input.previousOrdersCount));

    const componentScores = {
      ordersPerProvider: this.clamp((ordersPerProvider / 18) * 100),
      cancelRate: this.clamp(cancelRate * 2.2),
      responseTime: this.scale(this.positive(input.avgResponseMinutes), 15, 60),
      unassigned: this.clamp(unassignedRate * 1.7),
      growth: this.clamp(recentGrowthRate),
    };

    let pressureScore = (
      componentScores.ordersPerProvider * 0.3
      + componentScores.cancelRate * 0.2
      + componentScores.responseTime * 0.2
      + componentScores.unassigned * 0.2
      + componentScores.growth * 0.1
    );

    if (ordersCount > 0 && activeProviders === 0) {
      pressureScore = Math.max(pressureScore, 88);
    }

    pressureScore = Math.round(this.clamp(pressureScore));

    return {
      pressureScore,
      level: this.levelFor(pressureScore),
      ordersPerProvider: Number(ordersPerProvider.toFixed(2)),
      cancelRate: Number(cancelRate.toFixed(1)),
      unassignedRate: Number(unassignedRate.toFixed(1)),
      recentGrowthRate: Number(recentGrowthRate.toFixed(1)),
      componentScores: {
        ordersPerProvider: Math.round(componentScores.ordersPerProvider),
        cancelRate: Math.round(componentScores.cancelRate),
        responseTime: Math.round(componentScores.responseTime),
        unassigned: Math.round(componentScores.unassigned),
        growth: Math.round(componentScores.growth),
      },
    };
  }

  createRecruitmentRecommendation(input: RecruitmentRecommendationInput) {
    const pressure = this.calculate(input);
    if (pressure.pressureScore < 70 && input.activeProviders > 0) {
      return null;
    }

    const recommendedProviders = this.recommendedProviderCount(input, pressure);
    const priority = this.priorityFor(pressure.pressureScore, input.activeProviders, input.ordersCount);
    const reasons = this.reasonsFor(input, pressure);

    return {
      type: 'provider_recruitment',
      priority,
      city: input.city,
      governorate: input.governorate,
      serviceId: input.serviceId,
      serviceName: input.serviceName,
      recommendedProviders,
      reason: reasons[0] || 'Demand pressure is above the operational threshold',
      reasons,
      evidence: {
        ordersCount: input.ordersCount,
        previousOrdersCount: input.previousOrdersCount,
        activeProviders: input.activeProviders,
        ordersPerProvider: pressure.ordersPerProvider,
        cancelRate: pressure.cancelRate,
        unassignedRate: pressure.unassignedRate,
        avgResponseMinutes: input.avgResponseMinutes,
        pressureScore: pressure.pressureScore,
        level: pressure.level,
      },
    };
  }

  private recommendedProviderCount(input: PressureInput, pressure: PressureResult) {
    if (input.ordersCount > 0 && input.activeProviders === 0) return Math.min(Math.max(Math.ceil(input.ordersCount / 8), 1), 5);
    if (pressure.pressureScore >= 85) return Math.min(Math.max(Math.ceil(pressure.ordersPerProvider / 10), 2), 5);
    if (pressure.pressureScore >= 70) return Math.min(Math.max(Math.ceil(pressure.ordersPerProvider / 14), 1), 3);
    return 1;
  }

  private reasonsFor(input: PressureInput, pressure: PressureResult) {
    const reasons: string[] = [];
    if (input.ordersCount > 0 && input.activeProviders === 0) reasons.push('Demand exists but no active provider covers this service in the area');
    if (pressure.ordersPerProvider >= 12) reasons.push('Orders per active provider are above the healthy workload threshold');
    if (pressure.cancelRate >= 18) reasons.push('Cancellation or rejection rate is high');
    if (pressure.unassignedRate >= 15) reasons.push('A notable share of requests is not assigned to providers');
    if (input.avgResponseMinutes >= 30) reasons.push('Average provider response time is increasing');
    if (pressure.recentGrowthRate >= 30) reasons.push('Recent demand growth is accelerating compared with the previous period');
    return reasons;
  }

  private priorityFor(score: number, activeProviders: number, ordersCount: number): RecommendationPriority {
    if (ordersCount > 0 && activeProviders === 0) return 'critical';
    if (score >= 85) return 'critical';
    if (score >= 75) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  private levelFor(score: number): PressureLevel {
    if (score >= 85) return 'critical';
    if (score >= 70) return 'pressured';
    if (score >= 40) return 'watch';
    return 'healthy';
  }

  private growthRate(current: number, previous: number) {
    if (previous <= 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private scale(value: number, healthy: number, critical: number) {
    if (value <= healthy) return 0;
    if (value >= critical) return 100;
    return ((value - healthy) / (critical - healthy)) * 100;
  }

  private positive(value: number | undefined | null) {
    return Math.max(Number(value || 0), 0);
  }

  private clamp(value: number) {
    return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  }
}
