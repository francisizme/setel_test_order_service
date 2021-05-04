import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as path from 'path';
import * as i18n from 'i18n';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  i18n.configure({
    locales: ['en'],
    directory: path.join(__dirname, './config/locales'),
    objectNotation: true,
  });

  await app.listen(3001);
}
bootstrap();
