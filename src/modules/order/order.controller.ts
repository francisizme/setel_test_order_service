import { BadRequestException, Body, Controller, Get, Inject, Param, Post, Put, UsePipes } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { OrderService } from './order.service';
import { OrderCreateSchema } from './order.schema';

import { IOrder, IOrderCreate } from './interfaces/order.interface';
import { ITransactionDetails } from './interfaces/transaction.interface';
import { IUser } from './interfaces/user.interface';

import { JoiValidationPipe } from '../../pipes/validation.pipe';

import { EOrderState } from '../../utils/enum';
import { orderMessage } from '../../utils/localeUtils';

@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('PAYMENT_SERVICE') private readonly paymentClient: ClientProxy,
  ) {}

  @Get(':orderId([0-9]+)')
  async checkState(
    @Param('orderId') orderId: number,
  ): Promise<ITransactionDetails> {
    return this.orderService.checkState(orderId);
  }

  @Post()
  @UsePipes(new JoiValidationPipe(OrderCreateSchema, 'body'))
  async create(@Body() input: IOrderCreate): Promise<IOrder> {
    const user: IUser = await this.authClient
      .send('verifyToken', input.user_token)
      .toPromise();

    if (!user) {
      throw new BadRequestException(orderMessage('en', 'INVALID_TOKEN'));
    }

    const order = await this.orderService.create({
      ...input,
      user_id: user.id,
    });

    await this._performPayment(order, input);

    return order;
  }

  @Put('cancel/:orderId([0-9]+)')
  async cancel(@Param('orderId') orderId: number): Promise<void> {
    return this.orderService.updateState(orderId, EOrderState.cancelled);
  }

  @Put('confirm/:orderId([0-9]+)')
  async confirm(@Param('orderId') orderId: number): Promise<void> {
    return this.orderService.updateState(orderId, EOrderState.confirmed);
  }

  private async _performPayment(
    order: IOrder,
    orderCreateInfo: IOrderCreate,
  ): Promise<void> {
    const isPaid = await this.paymentClient
      .send('pay', {
        order_id: order.id,
        user_token: orderCreateInfo.user_token,
        payment_type: orderCreateInfo.payment_type,
      })
      .toPromise();

    await this.orderService.updateState(
      order.id,
      isPaid ? EOrderState.confirmed : EOrderState.cancelled,
    );
  }
}
