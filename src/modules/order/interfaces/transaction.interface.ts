import { OrderTransaction } from '../entities/transaction.entity';
import { EOrderState } from '../../../utils/enum';

export type ITransaction = OrderTransaction & {
  state: EOrderState;
};
