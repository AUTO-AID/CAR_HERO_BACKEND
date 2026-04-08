import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { Types } from 'mongoose';
export declare class ParseObjectIdPipe implements PipeTransform<string, Types.ObjectId> {
    transform(value: string, metadata: ArgumentMetadata): Types.ObjectId;
}
