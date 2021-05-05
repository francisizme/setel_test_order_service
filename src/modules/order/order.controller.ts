import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UsePipes,
} from '@nestjs/common';

import { OrderService } from './order.service';
import { OrderCreateSchema } from './order.schema';

import { IOrder, IOrderCreate } from './interfaces/order.interface';
import { ITransaction } from './interfaces/transaction.interface';

import { JoiValidationPipe } from '../../pipes/validation.pipe';

import { EOrderState } from '../../utils/enum';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get(':orderId([0-9]+)')
  async checkState(@Param('orderId') orderId: number): Promise<ITransaction> {
    return this.orderService.checkState(orderId);
  }

  @Post()
  @UsePipes(new JoiValidationPipe(OrderCreateSchema, 'body'))
  async create(@Body() input: IOrderCreate): Promise<IOrder> {
    return this.orderService.create(input);
  }

  @Put('cancel/:orderId([0-9]+)')
  async cancel(@Param('orderId') orderId: number): Promise<void> {
    return this.orderService.updateState(orderId, EOrderState.cancelled);
  }

  @Put('confirm/:orderId([0-9]+)')
  async confirm(@Param('orderId') orderId: number): Promise<void> {
    return this.orderService.updateState(orderId, EOrderState.confirmed);
  }
}
