import { Document, Types } from 'mongoose';
import { BookingStatus } from '../../domain/enums/booking-status.enum';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
export declare class LocationSchema {
    type: string;
    coordinates: number[];
    address: string;
}
export declare class BookingDocument extends Document {
    bookingNumber: string;
    isScheduled: boolean;
    user: Types.ObjectId;
    provider: Types.ObjectId;
    vehicle: Types.ObjectId;
    service: Types.ObjectId;
    status: BookingStatus;
    location: LocationSchema;
    scheduledDate: Date;
    scheduledTime: string;
    estimatedDuration: number;
    serviceName: string;
    servicePrice: number;
    selectedOptions: Array<{
        name: string;
        price: number;
    }>;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    promoCode: string;
    paymentStatus: PaymentStatus;
    paymentMethod: string;
    paymentId: string;
    confirmedAt: Date;
    startedAt: Date;
    completedAt: Date;
    cancelledAt: Date;
    cancellationReason: string;
    cancelledBy: string;
    userNotes: string;
    providerNotes: string;
    reminderEnabled: boolean;
    reminderSentAt: Date;
    rating: number;
    review: Types.ObjectId;
    metadata: Record<string, any>;
}
export declare const BookingSchema: import("mongoose").Schema<BookingDocument, import("mongoose").Model<BookingDocument, any, any, any, (Document<unknown, any, BookingDocument, any, import("mongoose").DefaultSchemaOptions> & BookingDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, BookingDocument, any, import("mongoose").DefaultSchemaOptions> & BookingDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}), any, BookingDocument>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, BookingDocument, Document<unknown, {}, BookingDocument, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    provider?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    user?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<BookingStatus, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    location?: import("mongoose").SchemaDefinitionProperty<LocationSchema, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    total?: import("mongoose").SchemaDefinitionProperty<number, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    bookingNumber?: import("mongoose").SchemaDefinitionProperty<string, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isScheduled?: import("mongoose").SchemaDefinitionProperty<boolean, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    vehicle?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    service?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    scheduledDate?: import("mongoose").SchemaDefinitionProperty<Date, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    scheduledTime?: import("mongoose").SchemaDefinitionProperty<string, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    estimatedDuration?: import("mongoose").SchemaDefinitionProperty<number, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    serviceName?: import("mongoose").SchemaDefinitionProperty<string, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    servicePrice?: import("mongoose").SchemaDefinitionProperty<number, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    selectedOptions?: import("mongoose").SchemaDefinitionProperty<{
        name: string;
        price: number;
    }[], BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    subtotal?: import("mongoose").SchemaDefinitionProperty<number, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    discount?: import("mongoose").SchemaDefinitionProperty<number, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    tax?: import("mongoose").SchemaDefinitionProperty<number, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    promoCode?: import("mongoose").SchemaDefinitionProperty<string, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    paymentStatus?: import("mongoose").SchemaDefinitionProperty<PaymentStatus, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    paymentMethod?: import("mongoose").SchemaDefinitionProperty<string, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    paymentId?: import("mongoose").SchemaDefinitionProperty<string, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    confirmedAt?: import("mongoose").SchemaDefinitionProperty<Date, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    startedAt?: import("mongoose").SchemaDefinitionProperty<Date, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    completedAt?: import("mongoose").SchemaDefinitionProperty<Date, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    cancelledAt?: import("mongoose").SchemaDefinitionProperty<Date, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    cancellationReason?: import("mongoose").SchemaDefinitionProperty<string, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    cancelledBy?: import("mongoose").SchemaDefinitionProperty<string, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    userNotes?: import("mongoose").SchemaDefinitionProperty<string, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    providerNotes?: import("mongoose").SchemaDefinitionProperty<string, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reminderEnabled?: import("mongoose").SchemaDefinitionProperty<boolean, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reminderSentAt?: import("mongoose").SchemaDefinitionProperty<Date, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    rating?: import("mongoose").SchemaDefinitionProperty<number, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    review?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metadata?: import("mongoose").SchemaDefinitionProperty<Record<string, any>, BookingDocument, Document<unknown, {}, BookingDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BookingDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, BookingDocument>;
