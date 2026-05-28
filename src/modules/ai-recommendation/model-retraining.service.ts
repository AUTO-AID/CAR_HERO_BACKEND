import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { AiRecommendationLog, AiRecommendationLogDocument } from './schemas/ai-recommendation-log.schema';
import * as path from 'path';
import { spawn } from 'child_process';
import axios from 'axios';

@Injectable()
export class ModelRetrainingService {
  private readonly logger = new Logger(ModelRetrainingService.name);

  constructor(
    @InjectModel(AiRecommendationLog.name)
    private readonly logModel: Model<AiRecommendationLogDocument>,
  ) {}

  /**
   * Weekly Cron Job at Sunday Midnight (00:00)
   */
  @Cron('0 0 * * 0')
  async handleWeeklyRetraining() {
    this.logger.log('Triggering scheduled weekly AI model retraining...');
    try {
      const result = await this.retrainModel();
      this.logger.log(`Scheduled retraining finished: ${JSON.stringify(result)}`);
    } catch (error) {
      this.logger.error(`Scheduled retraining failed: ${error.message}`);
    }
  }

  /**
   * Run model retraining pipeline and notify FastAPI to reload model
   */
  async retrainModel(): Promise<{
    success: boolean;
    logCount: number;
    fallbackUsed: boolean;
    message: string;
    output?: string;
  }> {
    const logCount = await this.logModel.countDocuments({ status: 'success' }).exec();
    const fallbackUsed = logCount < 200;

    this.logger.log(
      `Starting model retraining pipeline. Current successful log count: ${logCount}. Fallback to synthetic: ${fallbackUsed}`,
    );

    const scriptPath = path.join(process.cwd(), 'ai-training', 'train_model.py');
    
    // Determine command based on platform or environment
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

    this.logger.log(`Spawning retraining process: ${pythonCmd} ${scriptPath}`);

    return new Promise((resolve) => {
      const pyProcess = spawn(pythonCmd, [scriptPath], {
        cwd: path.join(process.cwd(), 'ai-training'),
      });

      let stdoutData = '';
      let stderrData = '';

      pyProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      pyProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      pyProcess.on('close', async (code) => {
        if (code !== 0) {
          this.logger.error(`Python retraining script exited with code ${code}. Stderr: ${stderrData}`);
          return resolve({
            success: false,
            logCount,
            fallbackUsed,
            message: `Retraining script exited with code ${code}`,
            output: stderrData || stdoutData,
          });
        }

        this.logger.log('Python retraining completed successfully. Requesting FastAPI model reload...');

        // Trigger FastAPI model reload
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        const reloadUrl = `${aiServiceUrl}/reload`;

        try {
          const reloadResponse = await axios.post(reloadUrl, {}, { timeout: 5000 });
          this.logger.log(`FastAPI model reload response: ${JSON.stringify(reloadResponse.data)}`);
          
          resolve({
            success: true,
            logCount,
            fallbackUsed,
            message: 'Model retrained and loaded successfully by AI service.',
            output: stdoutData,
          });
        } catch (reloadErr) {
          this.logger.error(`FastAPI reload request failed: ${reloadErr.message}`);
          resolve({
            success: true,
            logCount,
            fallbackUsed,
            message: `Model retrained successfully, but reload request failed: ${reloadErr.message}`,
            output: stdoutData,
          });
        }
      });

      pyProcess.on('error', (err) => {
        this.logger.error(`Failed to start python retraining process: ${err.message}`);
        resolve({
          success: false,
          logCount,
          fallbackUsed,
          message: `Failed to spawn python process: ${err.message}`,
        });
      });
    });
  }
}
