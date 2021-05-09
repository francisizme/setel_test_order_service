import * as dotenv from 'dotenv';
import * as path from 'path';

// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const envPath = process.env.NODE_ENV === 'development' ? '.env' : `.env.${process.env.NODE_ENV}`;

const envFound = dotenv.config({
  path: path.join(__dirname, `../../../${envPath}`),
});
if (envFound.error) {
  // This error should crash whole process

  // eslint-disable-next-line prettier/prettier
  throw new Error('Couldn\'t find .env file');
}

export default {
  /**
   * Your favorite port
   */
  port: Number(process.env.PORT),
  servicePort: Number(process.env.SERVICE_PORT),

  /**
   * Database config
   */

  database: {
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USER,
    pass: process.env.DATABASE_PASS,
    dbName: process.env.DATABASE_NAME,
  },

  redis: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    auth: process.env.REDIS_AUTH,
    db: Number(process.env.REDIS_DB),
  },

  amqp: {
    url: process.env.AMQP_URL,
    auth_queue: process.env.AMQP_AUTH_QUEUE,
    order_queue: process.env.AMQP_ORDER_QUEUE,
    payment_queue: process.env.AMQP_PAYMENT_QUEUE,
  },
};
