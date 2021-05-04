import { Connection, EntityRepository, Repository } from 'typeorm';
import { InjectConnection } from '@nestjs/typeorm';

import { ITransaction } from '../interfaces/transaction.interface';

import { OrderTransaction } from '../entities/transaction.entity';

@EntityRepository(OrderTransaction)
export class OrderTransactionRepository extends Repository<ITransaction> {
  constructor(@InjectConnection() private readonly connection: Connection) {
    super();
  }
}
