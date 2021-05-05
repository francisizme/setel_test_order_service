import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { OrderController } from './order.controller';
import { OrderService } from './order.service';

import { OrderRepository } from './repositories/order.repository';
import { OrderTransactionRepository } from './repositories/transaction.repository';

import { OrderProcessor } from '../../queues/order.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderRepository, OrderTransactionRepository]),
    BullModule.registerQueue({
      name: 'order',
    }),
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderProcessor],
})
export class OrderModule {}
