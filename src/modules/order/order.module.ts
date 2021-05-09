import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { OrderController } from './order.controller';
import { OrderService } from './order.service';

import { OrderRepository } from './repositories/order.repository';
import { OrderTransactionRepository } from './repositories/transaction.repository';

import { OrderProcessor } from '../../queues/order.processor';

import config from '../../config';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderRepository, OrderTransactionRepository]),
    BullModule.registerQueue({
      name: 'order',
    }),
    ClientsModule.register([
      {
        name: 'AUTH_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: [config.amqp.url],
          queue: config.amqp.auth_queue,
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
    ClientsModule.register([
      {
        name: 'PAYMENT_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: [config.amqp.url],
          queue: config.amqp.payment_queue,
          queueOptions: {
            durable: false,
          },
        },
      },
    ])
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderProcessor],
})
export class OrderModule {}
