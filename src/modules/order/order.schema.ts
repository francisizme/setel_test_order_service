import { Joi, joiErrorHandler } from 'validator-module';

export const OrderCreateSchema = Joi.object({
  code: Joi.string()
    .max(255)
    .required()
    .group('order')
    .error(joiErrorHandler()),
  user_id: Joi.number().required().group('order').error(joiErrorHandler()),
  payment_type: Joi.number()
    .required()
    .group('payment')
    .error(joiErrorHandler()),
});
