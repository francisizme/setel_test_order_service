import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { BadRequestException } from '@nestjs/common';
import * as faker from 'faker';
import * as i18n from 'i18n';
import * as path from 'path';
import { Observable } from 'rxjs';

import { OrderController } from './order.controller';
import { OrderService } from './order.service';

import { IOrder, IOrderCreate } from './interfaces/order.interface';
import { IUser } from './interfaces/user.interface';
import { ITransactionDetails } from './interfaces/transaction.interface';

import { EOrderState } from '../../utils/enum';
import { orderMessage } from '../../utils/localeUtils';

class OrderServiceFake {
  async updateState(): Promise<void> {}
  async create(): Promise<void> {}
  async checkState(): Promise<void> {}
}

class ObserverFake extends Observable<any> {
  async toPromise(): Promise<void> {}
}

class AuthClientFake {
  send() {}
}

class PaymentClientFake {
  emit() {}
}

describe('OrderController', () => {
  i18n.configure({
    locales: ['en'],
    directory: path.join(__dirname, '../../config/locales'),
    objectNotation: true,
  });
  let controller: OrderController;
  let service: OrderService;
  let authClient: ClientProxy;
  let paymentClient: ClientProxy;
  let authObserver: Observable<any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useClass: OrderServiceFake,
        },
        {
          provide: 'AUTH_CLIENT',
          useClass: AuthClientFake,
        },
        {
          provide: 'PAYMENT_CLIENT',
          useClass: PaymentClientFake,
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
    service = module.get<OrderService>(OrderService);
    authClient = module.get<ClientProxy>('AUTH_CLIENT');
    paymentClient = module.get<ClientProxy>('PAYMENT_CLIENT');
    authObserver = new ObserverFake();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create an Order', async () => {
    const code = faker.git.shortSha();
    const d = new Date();
    const input: IOrderCreate = {
      order_code: code,
      payment_type: 1,
      user_token: faker.git.shortSha(),
    };
    const mockedOrder: IOrder = {
      id: 1,
      code,
      user_id: 1,
      created_at: d,
      updated_at: d,
      transactions: [],
    };
    const mockedUser: IUser = {
      id: 1,
      full_name: faker.name.firstName(),
      username: faker.internet.userName(),
      created_at: d,
      updated_at: d,
    };
    const authClientSendSpy = jest.spyOn(authClient, 'send').mockReturnValue(authObserver);
    const authClientPromiseSpy = jest.spyOn(authObserver, 'toPromise').mockResolvedValue(mockedUser);
    const paymentClientSendSpy = jest.spyOn(paymentClient, 'emit');
    const serviceCreateSpy = jest.spyOn(service, 'create').mockResolvedValue(mockedOrder);

    const order = await controller.create(input);

    expect(authClientSendSpy).toHaveBeenCalledWith('verifyToken', input.user_token);
    expect(authClientPromiseSpy).toHaveBeenCalled();
    expect(serviceCreateSpy).toHaveBeenCalledWith({
      ...input,
      user_id: mockedUser.id,
    });
    expect(paymentClientSendSpy).toHaveBeenCalledWith('pay', {
      order_id: mockedOrder.id,
      user_token: input.user_token,
      payment_type: input.payment_type,
    });
    expect(order).toBe(mockedOrder);
  });

  it('should return error if invalid user token', async () => {
    const code = faker.git.shortSha();
    const input: IOrderCreate = {
      order_code: code,
      payment_type: 1,
      user_token: faker.git.shortSha(),
    };
    const authClientSendSpy = jest.spyOn(authClient, 'send').mockReturnValue(authObserver);
    const authClientPromiseSpy = jest.spyOn(authObserver, 'toPromise').mockResolvedValue(null);
    const paymentClientSendSpy = jest.spyOn(paymentClient, 'emit');
    const serviceCreateSpy = jest.spyOn(service, 'create');

    try {
      await controller.create(input);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      expect(e).toHaveProperty('message', orderMessage('en', 'INVALID_TOKEN'));
    }

    expect(authClientSendSpy).toHaveBeenCalledWith('verifyToken', input.user_token);
    expect(authClientPromiseSpy).toHaveBeenCalled();
    expect(paymentClientSendSpy).not.toHaveBeenCalled();
    expect(serviceCreateSpy).not.toHaveBeenCalled();
  });

  it('should return current state of the Order', async () => {
    const orderId = 1;
    const mockedState: ITransactionDetails = {
      state: EOrderState.cancelled,
      created_at: new Date(),
      order: {} as IOrder,
      id: 1,
      state_text: EOrderState[EOrderState.cancelled],
    };
    const checkStateSpy = jest.spyOn(service, 'checkState').mockResolvedValue(mockedState);

    const state = await controller.checkState(orderId);

    expect(checkStateSpy).toHaveBeenCalledWith(orderId);
    expect(state).toBe(mockedState);
  });

  it('should update state of the Order to confirmed', async () => {
    const orderId = 1;
    const updateStateSpy = jest.spyOn(service, 'updateState');

    await controller.confirm(orderId);

    expect(updateStateSpy).toHaveBeenCalledWith(orderId, EOrderState.confirmed);
  });

  it('should update state of the Order to cancelled', async () => {
    const orderId = 1;
    const updateStateSpy = jest.spyOn(service, 'updateState');

    await controller.cancel(orderId);

    expect(updateStateSpy).toHaveBeenCalledWith(orderId, EOrderState.cancelled);
  });
});
