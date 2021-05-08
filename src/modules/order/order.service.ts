import { BadRequestException, Injectable, Logger, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { OrderRepository } from './repositories/order.repository';
import { OrderTransactionRepository } from './repositories/transaction.repository';

import { IOrder, IOrderCreate } from './interfaces/order.interface';
import { ITransactionDetails } from './interfaces/transaction.interface';

import { commonMessage, orderMessage } from '../../utils/localeUtils';
import { EOrderState } from '../../utils/enum';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(OrderRepository)
    private readonly orderRepository: OrderRepository,
    @InjectRepository(OrderTransactionRepository)
    private readonly transactionRepository: OrderTransactionRepository,
    @InjectQueue('order') private readonly orderQueue: Queue,
  ) {}

  async create(input: IOrderCreate & { user_id: number }): Promise<IOrder> {
    const order = await this.orderRepository.findOne({
      code: input.order_code,
    });
    if (order) {
      throw new BadRequestException(commonMessage('en', 'DUPLICATE', 'order_code'));
    }

    const createdOrder = await this.orderRepository.save({
      code: input.order_code,
      user_id: input.user_id,
    });
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

  async updateState(orderId: number, state: EOrderState): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['transactions'],
    });
    if (!order) {
      throw new NotFoundException(orderMessage('en', 'NOT_FOUND'));
    }
    if (this._isValidState(order, EOrderState.delivered)) {
      throw new NotAcceptableException(orderMessage('en', 'NOT_ALLOWED_TO_UPDATE_DELIVERED'));
    }
    if (this._isValidState(order, EOrderState.cancelled)) {
      throw new NotAcceptableException(orderMessage('en', 'NOT_ALLOWED_TO_UPDATE_CANCELLED'));
    }

    await this.transactionRepository.save({ order, state });

    if (state === EOrderState.confirmed) {
      this._addQueueToDeliver(order);
    }
  }

  async checkState(orderId: number): Promise<ITransactionDetails> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['transactions'],
    });
    if (!order) {
      throw new NotFoundException(orderMessage('en', 'NOT_FOUND'));
    }

    const states = order.transactions;
    const state = states[states.length - 1];

    return { ...state, state_text: EOrderState[state.state] };
  }

  async deliverOrder(orderId: number): Promise<void> {
    const order = await this.orderRepository.findOne({ where: { id: orderId }, relations: ['transactions'] });
    const states = order.transactions;
    const lastState = states[states.length - 1];
    if (lastState.state !== EOrderState.confirmed) {
      Logger.error('Cannot deliver a non-confirmed Order', null, OrderService.name + '.' + this.deliverOrder.name);
    } else {
      await this.transactionRepository.save({
        order,
        state: EOrderState.delivered,
      });
    }
  }

  //region Private
  private _isValidState(order: IOrder, state: EOrderState): boolean {
    const states = order.transactions;
    const lastState = states[states.length - 1];

    return lastState.state === state;
  }

  private async _addQueueToDeliver(order: IOrder): Promise<void> {
    await this.orderQueue.add(order.id, { delay: 5000 });
  }
  //endregion
}
