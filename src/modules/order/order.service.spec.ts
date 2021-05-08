import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bull';
import { Repository } from 'typeorm';
import * as faker from 'faker';
import * as i18n from 'i18n';
import * as path from 'path';
import { Queue } from 'bull';

import { OrderService } from './order.service';

import { Order } from './entities/order.entity';
import { OrderTransaction } from './entities/transaction.entity';

import { IOrder, IOrderCreate } from './interfaces/order.interface';
import { ITransaction } from './interfaces/transaction.interface';

import { EOrderState } from '../../utils/enum';
import { commonMessage, orderMessage } from '../../utils/localeUtils';

class OrderTransactionRepositoryFake {
  async save(): Promise<void> {}
}

class OrderRepositoryFake {
  async save(): Promise<void> {}
  async findOne(): Promise<void> {}
}

class OrderQueueFake {
  async add(): Promise<void> {}
}

describe('OrderService', () => {
  i18n.configure({
    locales: ['en'],
    directory: path.join(__dirname, '../../config/locales'),
    objectNotation: true,
  });
  let service: OrderService;
  let orderRepository: Repository<IOrder>;
  let transactionRepository: Repository<ITransaction>;
  let orderQueue: Queue;
  const userId = 1;
  const d = new Date();

  beforeEach(async () => {
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
        {
          provide: getQueueToken('order'),
          useClass: OrderQueueFake,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    orderRepository = module.get<Repository<IOrder>>(getRepositoryToken(Order));
    transactionRepository = module.get<Repository<ITransaction>>(getRepositoryToken(OrderTransaction));
    orderQueue = module.get<Queue>(getQueueToken('order'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an Order', async () => {
    const code = faker.git.shortSha().toUpperCase();
    const orderInput: IOrderCreate = {
      order_code: code,
      payment_type: 1,
    } as IOrderCreate;
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

    const orderSaveSpy = jest.spyOn(orderRepository, 'save').mockResolvedValue(mockedOrder);
    const transactionSaveSpy = jest.spyOn(transactionRepository, 'save');

    const order = await service.create({ ...orderInput, user_id: userId });

    expect(orderSaveSpy).toHaveBeenCalledWith({
      code: orderInput.order_code,
      user_id: userId,
    });
    expect(transactionSaveSpy).toHaveBeenCalledWith(transactionInput);
    expect(order).toBe(mockedOrder);
  });

  it('should return error if Order code is duplicate', async () => {
    const code = faker.git.shortSha().toUpperCase();
    const orderInput: IOrderCreate = {
      order_code: code,
      payment_type: 1,
    } as IOrderCreate;
    const mockedOrder: IOrder = {
      id: 1,
      code,
      created_at: d,
      updated_at: d,
      user_id: 1,
      transactions: [],
    };

    const orderFindOneSpy = jest.spyOn(orderRepository, 'findOne').mockResolvedValue(mockedOrder);
    const orderSaveSpy = jest.spyOn(orderRepository, 'save');

    try {
      await service.create({ ...orderInput, user_id: userId });
    } catch (e) {
      expect(orderFindOneSpy).toHaveBeenCalledWith({
        code: orderInput.order_code,
      });
      expect(e).toBeInstanceOf(BadRequestException);
      expect(e).toHaveProperty('message', commonMessage('en', 'DUPLICATE', 'order_code'));
    }

    expect(orderSaveSpy).not.toHaveBeenCalled();
  });

  it('should return an Order by order ID', async () => {
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
    const orderFindOneSpy = jest.spyOn(orderRepository, 'findOne').mockResolvedValue(mockedOrder);

    const order = await service.get(orderId);

    expect(orderFindOneSpy).toHaveBeenCalledWith({
      where: [{ id: orderId }, { code: orderId }],
      relations: ['transactions'],
    });
    expect(order).toBe(mockedOrder);
  });

  it('should return an Order by order code', async () => {
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
    const orderFindOneSpy = jest.spyOn(orderRepository, 'findOne').mockResolvedValue(mockedOrder);

    const order = await service.get(code);

    expect(orderFindOneSpy).toHaveBeenCalledWith({
      where: [{ id: code }, { code }],
      relations: ['transactions'],
    });
    expect(order).toBe(mockedOrder);
  });

  it('should return not found when Order is not exist', async () => {
    const orderFindOneSpy = jest.spyOn(orderRepository, 'findOne').mockResolvedValue(null);
    const orderId = 1;

    try {
      await service.get(orderId);
    } catch (e) {
      expect(e).toBeInstanceOf(NotFoundException);
      expect(e).toHaveProperty('message', orderMessage('en', 'NOT_FOUND'));
    }

    expect(orderFindOneSpy).toHaveBeenCalledWith({
      where: [{ id: orderId }, { code: orderId }],
      relations: ['transactions'],
    });
  });

  it('should update state of an Order', async () => {
    const orderId = 1;
    const mockedOrder: IOrder = {
      id: orderId,
      code: faker.git.shortSha(),
      user_id: 1,
      created_at: d,
      updated_at: d,
      transactions: [
        {
          id: 1,
          state: EOrderState.created,
          created_at: d,
        } as ITransaction,
      ],
    };
    const orderFindOneSpy = jest.spyOn(orderRepository, 'findOne').mockResolvedValue(mockedOrder);
    const transactionSaveSpy = jest.spyOn(transactionRepository, 'save');

    await service.updateState(orderId, EOrderState.cancelled);

    expect(orderFindOneSpy).toHaveBeenCalledWith({
      where: { id: orderId },
      relations: ['transactions'],
    });
    expect(transactionSaveSpy).toHaveBeenCalledWith({
      order: mockedOrder,
      state: EOrderState.cancelled,
    });
  });

  it('should return error if updating state for non-exist Order', async () => {
    const orderFindOneSpy = jest.spyOn(orderRepository, 'findOne').mockResolvedValue(null);
    const transactionSaveSpy = jest.spyOn(transactionRepository, 'save');
    const orderId = 1;

    try {
      await service.updateState(orderId, EOrderState.cancelled);
    } catch (e) {
      expect(e).toBeInstanceOf(NotFoundException);
      expect(e).toHaveProperty('message', orderMessage('en', 'NOT_FOUND'));
    }

    expect(orderFindOneSpy).toHaveBeenCalledWith({
      where: { id: orderId },
      relations: ['transactions'],
    });
    expect(transactionSaveSpy).not.toHaveBeenCalled();
  });

  it('should return error if updating a delivered Order', async () => {
    const orderId = 1;
    const mockedOrder: IOrder = {
      id: orderId,
      code: faker.git.shortSha(),
      user_id: 1,
      created_at: d,
      updated_at: d,
      transactions: [
        {
          id: 1,
          state: EOrderState.delivered,
          created_at: d,
        } as ITransaction,
      ],
    };
    const orderFindOneSpy = jest.spyOn(orderRepository, 'findOne').mockResolvedValue(mockedOrder);
    const transactionSaveSpy = jest.spyOn(transactionRepository, 'save');

    try {
      await service.updateState(orderId, EOrderState.cancelled);
    } catch (e) {
      expect(e).toBeInstanceOf(NotAcceptableException);
      expect(e).toHaveProperty('message', orderMessage('en', 'NOT_ALLOWED_TO_UPDATE_DELIVERED'));
    }
    expect(orderFindOneSpy).toHaveBeenCalledWith({
      where: { id: orderId },
      relations: ['transactions'],
    });
    expect(transactionSaveSpy).not.toHaveBeenCalled();
  });

  it('should return error if updating a cancelled Order', async () => {
    const orderId = 1;
    const mockedOrder: IOrder = {
      id: orderId,
      code: faker.git.shortSha(),
      user_id: 1,
      created_at: d,
      updated_at: d,
      transactions: [
        {
          id: 1,
          state: EOrderState.cancelled,
          created_at: d,
        } as ITransaction,
      ],
    };
    const orderFindOneSpy = jest.spyOn(orderRepository, 'findOne').mockResolvedValue(mockedOrder);
    const transactionSaveSpy = jest.spyOn(transactionRepository, 'save');
    const orderQueueSpy = jest.spyOn(orderQueue, 'add');

    try {
      await service.updateState(orderId, EOrderState.confirmed);
    } catch (e) {
      expect(e).toBeInstanceOf(NotAcceptableException);
      expect(e).toHaveProperty('message', orderMessage('en', 'NOT_ALLOWED_TO_UPDATE_CANCELLED'));
    }
    expect(orderFindOneSpy).toHaveBeenCalledWith({
      where: { id: orderId },
      relations: ['transactions'],
    });
    expect(transactionSaveSpy).not.toHaveBeenCalled();
    expect(orderQueueSpy).not.toHaveBeenCalled();
  });

  it('should check state of an Order', async () => {
    const orderId = 1;
    const mockedState: ITransaction = {
      id: 1,
      state: EOrderState.cancelled,
      created_at: d,
    } as ITransaction;
    const mockedOrder: IOrder = {
      id: orderId,
      code: faker.git.shortSha(),
      created_at: d,
      updated_at: d,
      user_id: 1,
      transactions: [mockedState],
    };
    const orderFindOneSpy = jest.spyOn(orderRepository, 'findOne').mockResolvedValue(mockedOrder);

    const state = await service.checkState(orderId);

    expect(orderFindOneSpy).toHaveBeenCalledWith({
      where: { id: orderId },
      relations: ['transactions'],
    });
    expect(state).toStrictEqual({
      ...mockedState,
      state_text: EOrderState[mockedState.state],
    });
  });

  it('should return error if checking state of a non-exist Order', async () => {
    const orderId = 1;
    const orderFindOneSpy = jest.spyOn(orderRepository, 'findOne').mockResolvedValue(null);

    try {
      await service.checkState(orderId);
    } catch (e) {
      expect(e).toBeInstanceOf(NotFoundException);
      expect(e).toHaveProperty('message', orderMessage('en', 'NOT_FOUND'));
    }

    expect(orderFindOneSpy).toHaveBeenCalledWith({
      where: { id: orderId },
      relations: ['transactions'],
    });
  });

  it('should deliver the Order after a certain of seconds', async () => {
    const orderId = 1;
    const mockedOrder: IOrder = {
      id: orderId,
      code: faker.git.shortSha(),
      user_id: 1,
      created_at: d,
      updated_at: d,
      transactions: [
        {
          id: 1,
          state: EOrderState.created,
          created_at: d,
        } as ITransaction,
      ],
    };
    const orderFindOneSpy = jest.spyOn(orderRepository, 'findOne').mockResolvedValue(mockedOrder);
    const transactionSaveSpy = jest.spyOn(transactionRepository, 'save');
    const addQueueSpy = jest.spyOn(orderQueue, 'add');

    await service.updateState(orderId, EOrderState.confirmed);

    expect(orderFindOneSpy).toHaveBeenCalledWith({
      where: { id: orderId },
      relations: ['transactions'],
    });
    expect(transactionSaveSpy).toHaveBeenCalledWith({
      order: mockedOrder,
      state: EOrderState.confirmed,
    });
    expect(addQueueSpy).toHaveBeenCalledWith(mockedOrder.id, { delay: 5000 });
  });

  it('should update state of the Order to deliver', async () => {
    const orderId = 1;
    const mockedOrder: IOrder = {
      id: orderId,
      code: faker.git.shortSha(),
      user_id: 1,
      created_at: d,
      updated_at: d,
      transactions: [
        {
          id: 1,
          state: EOrderState.created,
          created_at: d,
        } as ITransaction,
        {
          id: 1,
          state: EOrderState.confirmed,
          created_at: d,
        } as ITransaction,
      ],
    };
    const transactionSaveSpy = jest.spyOn(transactionRepository, 'save');
    const findOneSpy = jest.spyOn(orderRepository, 'findOne').mockResolvedValue(mockedOrder);

    await service.deliverOrder(orderId);

    expect(findOneSpy).toHaveBeenCalledWith({ where: { id: orderId }, relations: ['transactions'] });
    expect(transactionSaveSpy).toHaveBeenCalledWith({ order: mockedOrder, state: EOrderState.delivered });
  });

  it('should do nothing if state of the Order is not confirm', async () => {
    const orderId = 1;
    const mockedOrder: IOrder = {
      id: orderId,
      code: faker.git.shortSha(),
      user_id: 1,
      created_at: d,
      updated_at: d,
      transactions: [
        {
          id: 1,
          state: EOrderState.created,
          created_at: d,
        } as ITransaction,
      ],
    };
    const transactionSaveSpy = jest.spyOn(transactionRepository, 'save');
    const findOneSpy = jest.spyOn(orderRepository, 'findOne').mockResolvedValue(mockedOrder);

    await service.deliverOrder(orderId);

    expect(findOneSpy).toHaveBeenCalledWith({ where: { id: orderId }, relations: ['transactions'] });
    expect(transactionSaveSpy).not.toHaveBeenCalled();
  });
});
