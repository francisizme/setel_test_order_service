import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';

import { AppModule } from './app.module';

import config from './config';

async function bootstrap() {
  const port = config.servicePort;
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [config.amqp.url],
      queue: config.amqp.queue,
      queueOptions: {
        durable: false,
      },
    },
  });

  app.listen(() => {
    console.log('Listening the Authentication Service on port', port);
  });
}

bootstrap();
