import { Joi, joiErrorHandler } from 'validator-module';

export const OrderCreateSchema = Joi.object({
  order_code: Joi.string().max(255).required().error(joiErrorHandler()),
  user_token: Joi.string().required().error(joiErrorHandler()),
  payment_type: Joi.number().required().error(joiErrorHandler()),
});
