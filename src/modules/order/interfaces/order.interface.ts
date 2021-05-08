import { Order } from '../entities/order.entity';

export type IOrder = Order;

export interface IOrderCreate {
  order_code: string;
  user_token: string;
  payment_type: number;
}
