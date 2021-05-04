import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderRepository } from './repositories/order.repository';
import { OrderTransactionRepository } from './repositories/transaction.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderRepository, OrderTransactionRepository]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
