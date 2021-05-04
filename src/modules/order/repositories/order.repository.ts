import { Connection, EntityRepository, Repository } from 'typeorm';
import { InjectConnection } from '@nestjs/typeorm';

import { IOrder } from '../interfaces/order.interface';

import { Order } from '../entities/order.entity';

@EntityRepository(Order)
export class OrderRepository extends Repository<IOrder> {
  constructor(@InjectConnection() private readonly connection: Connection) {
    super();
  }
}
