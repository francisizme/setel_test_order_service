import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { OrderModule } from './modules/order/order.module';

import config from './config';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: config.redis.host,
        port: config.redis.port,
      },
    }),
    OrderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
