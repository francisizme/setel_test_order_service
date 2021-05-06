import { Order } from '../entities/order.entity';
import { EPaymentType } from '../../../utils/enum';

export type IOrder = Order;

export interface IOrderCreate {
  order_code: string;
  user_token: string;
  payment_type: EPaymentType;
}
