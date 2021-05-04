import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { Validator } from 'validator-module';
import { ObjectSchema } from 'joi';

import { validateMessage } from '../utils/localeUtils';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(
    private schema: ObjectSchema,
    private indicator: 'params' | 'query' | 'body',
  ) {}

  transform(value: any, metadata: ArgumentMetadata): any {
    if (metadata.type !== this.indicator) {
      return value;
    }
    const validator = new Validator({ _errorCallback: validateMessage });
    const wrappedSchema = this.schema.label('data requested');
    const result = validator.validate(wrappedSchema, value);

    if (result.error) {
      throw new BadRequestException(result.message);
    }

    return result.data.__group || result.data;
  }
}
