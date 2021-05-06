import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Order } from './order.entity';

@Entity()
export class OrderTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column()
  state: number;

  @CreateDateColumn()
  created_at: Date;
}
