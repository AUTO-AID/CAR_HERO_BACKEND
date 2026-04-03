/**
 * Parse ObjectId Pipe
 * Validates and transforms string to MongoDB ObjectId
 */
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, Types.ObjectId> {
  transform(value: string, metadata: ArgumentMetadata): Types.ObjectId {
    const isValid = Types.ObjectId.isValid(value);

    if (!isValid) {
      throw new BadRequestException(`Invalid ObjectId: ${value}`);
    }

    return new Types.ObjectId(value);
  }
}
