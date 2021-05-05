import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { OrderService } from '../modules/order/order.service';

@Processor('order')
export class OrderProcessor {
  constructor(private readonly orderService: OrderService) {}
  @Process()
  async deliver(job: Job) {
    await this.orderService.deliverOrder(job.data);
  }
}
