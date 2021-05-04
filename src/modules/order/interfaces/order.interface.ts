import { Order } from '../entities/order.entity';
import { EPaymentType } from '../../../utils/enum';

export type IOrder = Order;

export interface IOrderCreate {
  order: {
    code: string;
    user_id: number;
  };
  payment: {
    payment_type: EPaymentType;
  };
}
