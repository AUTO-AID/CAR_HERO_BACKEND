import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CustomerExperienceService } from './customer-experience.service';

@Injectable()
export class CustomerExperienceCronService {
  constructor(private readonly customerExperience: CustomerExperienceService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async generateDueWashBookings() {
    await this.customerExperience.processDueWashPlans();
  }
}
