import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';

import { AppModule } from './app.module';

async function bootstrap() {
  const port = 4001;
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'order_queue',
      queueOptions: {
        durable: false,
      },
    },
  });

  app.listen(() => {
    console.log('Listening the Order Service on port', port);
  });
}
bootstrap();
