import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ModelRetrainingService } from './model-retraining.service';
import { AiRecommendationLog } from './schemas/ai-recommendation-log.schema';
import { spawn } from 'child_process';
import axios from 'axios';

jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

jest.mock('axios');

describe('ModelRetrainingService', () => {
  let service: ModelRetrainingService;
  let logModelMock: any;

  beforeEach(async () => {
    logModelMock = {
      countDocuments: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(150),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModelRetrainingService,
        {
          provide: getModelToken(AiRecommendationLog.name),
          useValue: logModelMock,
        },
      ],
    }).compile();

    service = module.get<ModelRetrainingService>(ModelRetrainingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should complete retraining successfully and trigger reload', async () => {
    const mockSpawnProcess = {
      stdout: { on: jest.fn().mockImplementation((event, callback) => callback('some python log output')) },
      stderr: { on: jest.fn() },
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'close') {
          callback(0); // Exit code 0
        }
      }),
    };
    (spawn as jest.Mock).mockReturnValue(mockSpawnProcess);
    (axios.post as jest.Mock).mockResolvedValue({ data: { status: 'success' } });

    const result = await service.retrainModel();

    expect(result.success).toBe(true);
    expect(result.fallbackUsed).toBe(true);
    expect(result.logCount).toBe(150);
    expect(spawn).toHaveBeenCalled();
    expect(axios.post).toHaveBeenCalled();
  });

  it('should return failure if python script exits with non-zero code', async () => {
    const mockSpawnProcess = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn().mockImplementation((event, callback) => callback('Some error occurred in script')) },
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'close') {
          callback(1); // Exit code 1
        }
      }),
    };
    (spawn as jest.Mock).mockReturnValue(mockSpawnProcess);

    const result = await service.retrainModel();

    expect(result.success).toBe(false);
    expect(result.message).toContain('Retraining script exited with code 1');
    expect(result.output).toBe('Some error occurred in script');
    expect(spawn).toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });
});
