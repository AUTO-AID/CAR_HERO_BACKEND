import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AiRecommendationService } from '../ai-recommendation.service';
import { Provider } from '../../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import { AiRecommendationLog } from '../../../infrastructure/schemas/ai-recommendation-log.schema';
import { ProviderMetrics } from '../../../infrastructure/schemas/provider-metrics.schema';
import { RuleBasedRecommendationProvider } from '../../../infrastructure/providers/rule-based.provider';
import { MlRecommendationProvider } from '../../../infrastructure/providers/ml-model.provider';
import { ProviderScoringService } from '../provider-scoring.service';
import { RecommendProviderDto } from '../../dtos/recommend-provider.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('AiRecommendationService', () => {
  let service: AiRecommendationService;
  let providerModelMock: any;
  let logModelMock: any;
  let metricsModelMock: any;
  let scoringService: ProviderScoringService;
  let moduleRef: TestingModule;

  // Mock Providers
  const mockProviders = [
    {
      _id: new Types.ObjectId(),
      businessName: 'ورشة الوفاء الممتازة',
      phone: '+963933111222',
      logo: 'logo1.png',
      category: 'towing',
      serviceCategories: ['towing'],
      isActive: true,
      isApproved: true,
      city: 'Damascus',
      serviceRadiusKm: 25,
      location: { type: 'Point', coordinates: [36.29128, 33.5138] }, // [lng, lat]
      averageRating: 4.8,
      totalReviews: 50,
      emergency247: true,
    },
    {
      _id: new Types.ObjectId(),
      businessName: 'ورشة السلام السريعة',
      phone: '+963944333444',
      logo: 'logo2.png',
      category: 'towing',
      serviceCategories: ['towing'],
      isActive: true,
      isApproved: true,
      city: 'Damascus',
      serviceRadiusKm: 15,
      location: { type: 'Point', coordinates: [36.27128, 33.5038] },
      averageRating: 4.2,
      totalReviews: 12,
      emergency247: false,
    }
  ];

  // Mock Metrics
  const mockMetrics = [
    {
      provider: mockProviders[0]._id,
      averageRating: 4.8,
      totalReviews: 50,
      completedOrders: 120,
      cancellationRate: 0.02,
      averageResponseTime: 12,
      serviceSpecializationScores: new Map([['towing', 0.95]]),
      cityPerformance: new Map([['Damascus', { totalOrders: 100, completionRate: 0.98, averageRating: 4.8 }]]),
      last30DaysPerformance: { totalOrders: 30, completionRate: 0.97, averageRating: 4.8 },
      peakHourPerformance: { totalOrders: 15, completionRate: 0.95, averageRating: 4.7 }
    },
    {
      provider: mockProviders[1]._id,
      averageRating: 4.2,
      totalReviews: 12,
      completedOrders: 40,
      cancellationRate: 0.08,
      averageResponseTime: 25,
      serviceSpecializationScores: new Map([['towing', 0.80]]),
      cityPerformance: new Map([['Damascus', { totalOrders: 30, completionRate: 0.92, averageRating: 4.2 }]]),
      last30DaysPerformance: { totalOrders: 10, completionRate: 0.90, averageRating: 4.1 },
      peakHourPerformance: { totalOrders: 5, completionRate: 0.88, averageRating: 4.0 }
    }
  ];

  const providerQuery = (results: any[]) => ({
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(results),
  });

  beforeEach(async () => {
    // Define Mocks
    providerModelMock = {
      find: jest.fn().mockImplementation((query) => {
        let results = [...mockProviders];
        if (query && query._id && query._id.$nin) {
          const ninStrings = query._id.$nin.map(id => id.toString());
          results = results.filter(p => !ninStrings.includes(p._id.toString()));
        }
        return providerQuery(results);
      }),
    };

    // Log model needs to act like a constructor and have a save method
    logModelMock = jest.fn().mockImplementation((dto) => {
      return {
        ...dto,
        _id: new Types.ObjectId(),
        createdAt: new Date(),
        save: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          ...dto,
          createdAt: new Date(),
        }),
      };
    });

    metricsModelMock = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMetrics),
      }),
    };

    moduleRef = await Test.createTestingModule({
      providers: [
        AiRecommendationService,
        ProviderScoringService,
        RuleBasedRecommendationProvider,
        MlRecommendationProvider,
        {
          provide: getModelToken(Provider.name),
          useValue: providerModelMock,
        },
        {
          provide: getModelToken(AiRecommendationLog.name),
          useValue: logModelMock,
        },
        {
          provide: getModelToken(ProviderMetrics.name),
          useValue: metricsModelMock,
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<AiRecommendationService>(AiRecommendationService);
    scoringService = moduleRef.get<ProviderScoringService>(ProviderScoringService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // 1. Test Scoring Calculation
  describe('Scoring Calculation', () => {
    it('should correctly calculate scoring breakdown components using ProviderScoringService', () => {
      const clientLat = 33.5138;
      const clientLng = 36.29128;
      const provider = mockProviders[0];
      const metrics = mockMetrics[0];

      const scoreResult = scoringService.scoreProvider(
        provider as any,
        clientLat,
        clientLng,
        'emergency',
        'Damascus',
        'towing',
        undefined,
        metrics
      );

      // Verify that all 10 criteria breakdown numbers are defined and normalized between 0 and 1
      expect(scoreResult).toBeDefined();
      expect(scoreResult.score).toBeGreaterThan(0);
      expect(scoreResult.score).toBeLessThanOrEqual(100);
      expect(scoreResult.confidence).toBeGreaterThan(0);
      expect(scoreResult.confidence).toBeLessThanOrEqual(1.0);
      
      const breakdown = scoreResult.scoringBreakdown;
      expect(breakdown).toBeDefined();
      expect(breakdown.distance).toBeGreaterThanOrEqual(0);
      expect(breakdown.distance).toBeLessThanOrEqual(1);
      expect(breakdown.rating).toBeGreaterThanOrEqual(0);
      expect(breakdown.rating).toBeLessThanOrEqual(1);
      expect(breakdown.serviceMatch).toBeGreaterThanOrEqual(0);
      expect(breakdown.serviceMatch).toBeLessThanOrEqual(1);
      expect(breakdown.workingHours).toBeGreaterThanOrEqual(0);
      expect(breakdown.workingHours).toBeLessThanOrEqual(1);
      expect(breakdown.emergencySupport).toBeGreaterThanOrEqual(0);
      expect(breakdown.emergencySupport).toBeLessThanOrEqual(1);
      expect(breakdown.expectedResponseTime).toBeGreaterThanOrEqual(0);
      expect(breakdown.expectedResponseTime).toBeLessThanOrEqual(1);
      expect(breakdown.completedOrders).toBeGreaterThanOrEqual(0);
      expect(breakdown.completedOrders).toBeLessThanOrEqual(1);
      expect(breakdown.cancellationRate).toBeGreaterThanOrEqual(0);
      expect(breakdown.cancellationRate).toBeLessThanOrEqual(1);
      expect(breakdown.cityMatch).toBeGreaterThanOrEqual(0);
      expect(breakdown.cityMatch).toBeLessThanOrEqual(1);
      expect(breakdown.urgencyAlignment).toBeGreaterThanOrEqual(0);
      expect(breakdown.urgencyAlignment).toBeLessThanOrEqual(1);
    });
  });

  // 2. Test Provider Ranking
  describe('Provider Ranking', () => {
    it('should recommend and sort providers by score in descending order', async () => {
      const dto: RecommendProviderDto = {
        serviceCategory: 'towing',
        city: 'Damascus',
        location: { lat: 33.5138, lng: 36.29128 },
        urgencyLevel: 'emergency',
      };

      const result = await service.recommend(dto);

      expect(result).toBeDefined();
      expect(result.recommendations.length).toBe(1);

      // Verify that the list is sorted in descending order of score
      const recommendations = result.recommendations;
      for (let i = 0; i < recommendations.length - 1; i++) {
        expect(recommendations[i].score).toBeGreaterThanOrEqual(recommendations[i + 1].score);
      }

      // First provider (الوفاء) has higher rating, completed orders, and active emergency support, so it should rank first
      expect(recommendations[0].providerName).toBe('ورشة الوفاء الممتازة');
    });
  });

  // 3. Test No Provider Case and Fallback
  describe('No Provider Case & Fallback Query', () => {
    it('should execute fallback query when primary category search yields no providers', async () => {
      // Primary category search returns empty, fallback query returns providers
      providerModelMock.find
        .mockReturnValueOnce(providerQuery([])) // primary query empty
        .mockReturnValueOnce(providerQuery([mockProviders[1]])); // fallback query returns one

      const dto: RecommendProviderDto = {
        serviceCategory: 'non_existent_category',
        city: 'Damascus',
        location: { lat: 33.5138, lng: 36.29128 },
        urgencyLevel: 'standard',
      };

      const result = await service.recommend(dto);

      expect(result).toBeDefined();
      expect(result.criteria.isFallbackUsed).toBe(true);
      expect(result.recommendations.length).toBe(1);
      expect(result.recommendations[0].providerName).toBe('ورشة السلام السريعة');
    });

    it('should return failed status and empty recommendations list when no providers match at all', async () => {
      // Both primary search and fallback query return empty
      providerModelMock.find.mockReturnValue(providerQuery([]));

      const dto: RecommendProviderDto = {
        serviceCategory: 'any_category',
        city: 'Damascus',
        location: { lat: 33.5138, lng: 36.29128 },
        urgencyLevel: 'standard',
      };

      const result = await service.recommend(dto);

      expect(result).toBeDefined();
      expect(result.recommendations.length).toBe(0);
      expect(result.confidence).toBe(0.0);
      expect(result.reasons).toContain('لم يتم العثور على أي مزودي خدمة متوفرين');
    });
  });

  // 4. Test Logging System
  describe('Recommendation Logging System', () => {
    it('should save a log entry to MongoDB on recommendation success', async () => {
      const dto: RecommendProviderDto = {
        serviceCategory: 'towing',
        city: 'Damascus',
        location: { lat: 33.5138, lng: 36.29128 },
        urgencyLevel: 'emergency',
      };

      const result = await service.recommend(dto, '507f1f77bcf86cd799439011');

      // Check that the logModel was instantiated to create a log entry
      expect(logModelMock).toHaveBeenCalled();
      expect(result.recommendationId).toBeDefined();
    });

    it('should save a failed log entry to MongoDB on recommendation failure', async () => {
      // Setup both queries empty
      providerModelMock.find.mockReturnValue(providerQuery([]));

      const dto: RecommendProviderDto = {
        serviceCategory: 'towing',
        city: 'Damascus',
        location: { lat: 33.5138, lng: 36.29128 },
        urgencyLevel: 'emergency',
      };

      const result = await service.recommend(dto, '507f1f77bcf86cd799439011');

    });
  });

  // 5. Test ML Model Mode via FastAPI
  describe('ML Model Recommendation via FastAPI', () => {
    let axiosPostSpy: jest.SpyInstance;

    beforeEach(() => {
      process.env.AI_RECOMMENDATION_MODE = 'ml_model';
      process.env.AI_SERVICE_URL = 'http://localhost:8000';
      const axios = require('axios');
      axiosPostSpy = jest.spyOn(axios, 'post').mockResolvedValue({
        data: {
          predictions: [
            { providerId: mockProviders[0]._id.toString(), score: 95.5 },
            { providerId: mockProviders[1]._id.toString(), score: 72.0 }
          ]
        }
      });
    });

    afterEach(() => {
      delete process.env.AI_RECOMMENDATION_MODE;
      delete process.env.AI_SERVICE_URL;
      if (axiosPostSpy) {
        axiosPostSpy.mockRestore();
      }
    });

    it('should call FastAPI microservice and return prediction scores', async () => {
      const dto: RecommendProviderDto = {
        serviceCategory: 'towing',
        city: 'Damascus',
        location: { lat: 33.5138, lng: 36.29128 },
        urgencyLevel: 'emergency',
      };

      const result = await service.recommend(dto);

      expect(result).toBeDefined();
      expect(result.modelType).toBe('ml_model');
      expect(result.recommendations.length).toBe(1);
      expect(result.recommendations[0].score).toBe(95.5);
      expect(result.recommendations[0].providerName).toBe('ورشة الوفاء الممتازة');

      expect(axiosPostSpy).toHaveBeenCalled();
      const callArgs = axiosPostSpy.mock.calls[0];
      expect(callArgs[0]).toBe('http://localhost:8000/predict');
      expect(callArgs[1].candidates.length).toBe(2);
    });

    it('should fall back to Rule-Based provider if FastAPI call throws an error', async () => {
      const axios = require('axios');
      axiosPostSpy.mockRejectedValue(new Error('Connection timed out'));

      const dto: RecommendProviderDto = {
        serviceCategory: 'towing',
        city: 'Damascus',
        location: { lat: 33.5138, lng: 36.29128 },
        urgencyLevel: 'emergency',
      };

      const result = await service.recommend(dto);

      expect(result).toBeDefined();
      expect(result.modelType).toBe('rule_based');
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0].providerName).toBe('ورشة الوفاء الممتازة');
    });
  });

  // 6. Test Redis Caching Logic
  describe('Redis Caching Logic', () => {
    let cacheManagerMock: any;

    beforeEach(() => {
      cacheManagerMock = moduleRef.get(CACHE_MANAGER);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return cached recommendation results on cache hit without querying DB or model', async () => {
      const cachedResult = {
        recommendationId: 'cached_rec_123',
        criteria: { serviceCategory: 'towing', city: 'Damascus' },
        recommendations: [{ providerName: 'Cached Provider', score: 99.9 }],
        timestamp: new Date(),
        modelType: 'rule_based',
        modelVersion: 'v1',
        confidence: 0.95,
        reasons: ['من الكاش'],
        rankedProviders: []
      };

      jest.spyOn(cacheManagerMock, 'get').mockResolvedValue(cachedResult);
      const dbFindSpy = jest.spyOn(providerModelMock, 'find');

      const dto: RecommendProviderDto = {
        serviceCategory: 'towing',
        city: 'Damascus',
        location: { lat: 33.5138, lng: 36.29128 },
        urgencyLevel: 'emergency',
      };

      const result = await service.recommend(dto);

      expect(result).toBeDefined();
      expect(result.recommendationId).toBe('cached_rec_123');
      expect(result.recommendations[0].providerName).toBe('Cached Provider');
      expect(dbFindSpy).not.toHaveBeenCalled();
    });

    it('should fetch from DB and set recommendation cache on cache miss', async () => {
      jest.spyOn(cacheManagerMock, 'get').mockResolvedValue(null);
      const cacheSetSpy = jest.spyOn(cacheManagerMock, 'set');

      const dto: RecommendProviderDto = {
        serviceCategory: 'towing',
        city: 'Damascus',
        location: { lat: 33.5138, lng: 36.29128 },
        urgencyLevel: 'emergency',
      };

      const result = await service.recommend(dto);

      expect(result).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(cacheSetSpy).toHaveBeenCalled();
      
      const setCalls = cacheSetSpy.mock.calls;
      const recOutCall = setCalls.find(call => call[0].startsWith('ai_rec_out:'));
      expect(recOutCall).toBeDefined();
      expect(recOutCall[1].recommendationId).toBe(result.recommendationId);
      expect(recOutCall[2]).toBe(60000);
    });
  });

  // 7. Test Epsilon-Greedy Exploration
  describe('Epsilon-Greedy Exploration', () => {
    let mathRandomSpy: jest.SpyInstance;

    beforeEach(() => {
      mathRandomSpy = jest.spyOn(Math, 'random');
    });

    afterEach(() => {
      mathRandomSpy.mockRestore();
    });

    it('should inject an emerging provider when random value triggers exploration', async () => {
      // Trigger exploration (< 0.05)
      mathRandomSpy.mockReturnValue(0.01);

      // Mock RuleBasedRecommendationProvider to only recommend 1 provider, so candidates count (2) > recommended count (1)
      const ruleBasedProvider = moduleRef.get(RuleBasedRecommendationProvider);
      jest.spyOn(ruleBasedProvider, 'recommend').mockResolvedValue({
        modelType: 'rule_based',
        modelVersion: 'v1',
        confidence: 0.9,
        reasons: ['قريب'],
        rankedProviders: [
          {
            provider: mockProviders[0],
            providerId: mockProviders[0]._id.toString(),
            providerName: mockProviders[0].businessName,
            phone: mockProviders[0].phone,
            logo: mockProviders[0].logo,
            category: mockProviders[0].category,
            averageRating: mockProviders[0].averageRating,
            totalReviews: mockProviders[0].totalReviews,
            score: 95.0,
            confidence: 0.9,
            scoringBreakdown: {
              distance: 0.9, rating: 0.9, serviceMatch: 1.0, workingHours: 1.0,
              emergencySupport: 1.0, expectedResponseTime: 0.9, completedOrders: 0.9,
              cancellationRate: 0.9, cityMatch: 1.0, urgencyAlignment: 1.0
            },
            reasons: ['قريب']
          }
        ]
      } as any);

      const originalMetrics = mockMetrics[1].completedOrders;
      mockMetrics[1].completedOrders = 3; // Make provider[1] emerging

      const dto: RecommendProviderDto = {
        serviceCategory: 'towing',
        city: 'Damascus',
        location: { lat: 33.5138, lng: 36.29128 },
        urgencyLevel: 'emergency',
      };

      const result = await service.recommend(dto);

      expect(result).toBeDefined();
      const lastRec = result.recommendations[result.recommendations.length - 1];
      expect(lastRec.isExploration).toBe(true);
      expect(lastRec.reasons[0]).toContain('ورشة جديدة صاعدة');

      mockMetrics[1].completedOrders = originalMetrics;
    });

    it('should NOT inject an emerging provider when random value is above epsilon', async () => {
      // Skip exploration (> 0.05)
      mathRandomSpy.mockReturnValue(0.99);

      const dto: RecommendProviderDto = {
        serviceCategory: 'towing',
        city: 'Damascus',
        location: { lat: 33.5138, lng: 36.29128 },
        urgencyLevel: 'emergency',
      };

      const result = await service.recommend(dto);

      expect(result).toBeDefined();
      for (const rec of result.recommendations) {
        expect(rec.isExploration).toBeFalsy();
      }
    });
  });

  // 8. Test Provider Exclusion Filter
  describe('Provider Exclusion Filter', () => {
    it('should exclude specified provider IDs from recommendation list', async () => {
      const dto: RecommendProviderDto = {
        serviceCategory: 'towing',
        city: 'Damascus',
        location: { lat: 33.5138, lng: 36.29128 },
        urgencyLevel: 'emergency',
        excludeProviderIds: [mockProviders[0]._id.toString()]
      };

      const result = await service.recommend(dto);

      expect(result).toBeDefined();
      expect(result.recommendations.length).toBe(1);
      // The first provider is excluded, so it must return the second one
      expect(result.recommendations[0].providerName).toBe('ورشة السلام السريعة');
    });
  });
});
