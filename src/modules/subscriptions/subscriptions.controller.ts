import { Controller } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}
}
