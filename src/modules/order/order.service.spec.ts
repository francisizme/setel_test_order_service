import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as faker from 'faker';
import * as i18n from 'i18n';
import * as path from 'path';

import { OrderService } from './order.service';

import { Order } from './entities/order.entity';
import { OrderTransaction } from './entities/transaction.entity';

import { IOrder, IOrderCreate } from './interfaces/order.interface';
import { ITransaction } from './interfaces/transaction.interface';
import { EOrderState, EPaymentType } from '../../utils/enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { commonMessage, orderMessage } from '../../utils/localeUtils';

class OrderTransactionRepositoryFake {
  async save(): Promise<void> {}
}

class OrderRepositoryFake {
  async save(): Promise<void> {}
  async findOne(): Promise<void> {}
}

describe('OrderService', () => {
  let service: OrderService;
  let orderRepository: Repository<IOrder>;
  let transactionRepository: Repository<ITransaction>;

  beforeEach(async () => {
    i18n.configure({
      locales: ['en'],
      directory: path.join(__dirname, '../../config/locales'),
      objectNotation: true,
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useClass: OrderRepositoryFake,
        },
        {
          provide: getRepositoryToken(OrderTransaction),
          useClass: OrderTransactionRepositoryFake,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    orderRepository = module.get<Repository<IOrder>>(getRepositoryToken(Order));
    transactionRepository = module.get<Repository<ITransaction>>(
      getRepositoryToken(OrderTransaction),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an Order', async () => {
    const code = faker.git.shortSha().toUpperCase();
    const d = new Date();
    const orderInput: IOrderCreate = {
      order: {
        code,
        user_id: 1,
      },
      payment: {
        payment_type: EPaymentType.cash,
      },
    };
    const mockedOrder: IOrder = {
      id: 1,
      code,
      created_at: d,
      updated_at: d,
      user_id: 1,
      transactions: [],
    };
    const transactionInput = {
      state: EOrderState.created,
      order: mockedOrder,
    };

    const orderSaveSpy = jest
      .spyOn(orderRepository, 'save')
      .mockResolvedValue(mockedOrder);
    const transactionSaveSpy = jest.spyOn(transactionRepository, 'save');

    const order = await service.create(orderInput);

    expect(orderSaveSpy).toHaveBeenCalledWith(orderInput.order);
    expect(transactionSaveSpy).toHaveBeenCalledWith(transactionInput);
    expect(order).toBe(mockedOrder);
  });

  it('should return error if Order code is duplicate', async () => {
    const code = faker.git.shortSha().toUpperCase();
    const d = new Date();
    const orderInput: IOrderCreate = {
      order: {
        code,
        user_id: 1,
      },
      payment: {
        payment_type: EPaymentType.cash,
      },
    };
    const mockedOrder: IOrder = {
      id: 1,
      code,
      created_at: d,
      updated_at: d,
      user_id: 1,
      transactions: [],
    };

    const orderFindOneSpy = jest
      .spyOn(orderRepository, 'findOne')
      .mockResolvedValue(mockedOrder);

    try {
      await service.create(orderInput);
    } catch (e) {
      expect(orderFindOneSpy).toHaveBeenCalledWith({
        code: orderInput.order.code,
      });
      expect(e).toBeInstanceOf(BadRequestException);
      expect(e).toHaveProperty(
        'message',
        commonMessage('en', 'DUPLICATE', 'code'),
      );
    }
  });

  it('should return an Order by order ID', async () => {
    const d = new Date();
    const orderId = 1;
    const mockedOrder: IOrder = {
      id: 1,
      code: faker.git.shortSha(),
      created_at: d,
      updated_at: d,
      user_id: 1,
      transactions: [
        {
          id: 1,
          state: EOrderState.created,
          created_at: d,
        } as ITransaction,
      ],
    };
    const orderFindOneSpy = jest
      .spyOn(orderRepository, 'findOne')
      .mockResolvedValue(mockedOrder);

    const order = await service.get(orderId);

    expect(orderFindOneSpy).toHaveBeenCalledWith({
      where: [{ id: orderId }, { code: orderId }],
      relations: ['transactions'],
    });
    expect(order).toBe(mockedOrder);
  });

  it('should return an Order by order code', async () => {
    const d = new Date();
    const code = faker.git.shortSha();
    const mockedOrder: IOrder = {
      id: 1,
      code,
      created_at: d,
      updated_at: d,
      user_id: 1,
      transactions: [
        {
          id: 1,
          state: EOrderState.created,
          created_at: d,
        } as ITransaction,
      ],
    };
    const orderFindOneSpy = jest
      .spyOn(orderRepository, 'findOne')
      .mockResolvedValue(mockedOrder);

    const order = await service.get(code);

    expect(orderFindOneSpy).toHaveBeenCalledWith({
      where: [{ id: code }, { code }],
      relations: ['transactions'],
    });
    expect(order).toBe(mockedOrder);
  });

  it('should return not found when Order is not exist', async () => {
    jest.spyOn(orderRepository, 'findOne').mockResolvedValue(null);

    try {
      await service.get(1);
    } catch (e) {
      expect(e).toBeInstanceOf(NotFoundException);
      expect(e).toHaveProperty('message', orderMessage('en', 'NOT_FOUND'));
    }
  });

  it('should update status of an Order', () => {});

  it('should cancel an Order', () => {});

  it('should check status of an Order', () => {});

  it('should check if the Order is delivered', () => {});
});
