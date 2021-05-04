import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { OrderRepository } from './repositories/order.repository';
import { OrderTransactionRepository } from './repositories/transaction.repository';

import { IOrder, IOrderCreate } from './interfaces/order.interface';
import { commonMessage, orderMessage } from '../../utils/localeUtils';
import { EOrderState } from '../../utils/enum';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(OrderRepository)
    private readonly orderRepository: OrderRepository,
    @InjectRepository(OrderTransactionRepository)
    private readonly transactionRepository: OrderTransactionRepository,
  ) {}

  async create(input: IOrderCreate): Promise<IOrder> {
    const order = await this.orderRepository.findOne({
      code: input.order.code,
    });
    if (order) {
      throw new BadRequestException(commonMessage('en', 'DUPLICATE', 'code'));
    }

    const createdOrder = await this.orderRepository.save(input.order);
    await this.transactionRepository.save({
      order: createdOrder,
      state: EOrderState.created,
    });

    return createdOrder;
  }

  async get(input: string | number): Promise<IOrder> {
    const order = await this.orderRepository.findOne({
      where: [{ id: input }, { code: input }],
      relations: ['transactions'],
    });

    if (!order) {
      throw new NotFoundException(orderMessage('en', 'NOT_FOUND'));
    }

    return order;
  }
}
