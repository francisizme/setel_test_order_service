import { OrderTransaction } from '../entities/transaction.entity';
import { EOrderState } from '../../../utils/enum';

export type ITransaction = OrderTransaction & {
  state: EOrderState;
};

export interface ITransactionDetails extends ITransaction {
  state_text: string;
}
