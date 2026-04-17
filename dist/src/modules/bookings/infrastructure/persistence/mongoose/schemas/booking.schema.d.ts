import { Document, Types } from 'mongoose';
import { BookingStatus, PaymentStatus } from '../../../../../../core/enums/status.enum';
export type BookingDocument = Booking & Document;
declare class GeoLocation {
    type: string;
    coordinates: number[];
}
export declare class Booking {
    bookingNumber: string;
    user: Types.ObjectId;
    provider?: Types.ObjectId;
    service: Types.ObjectId;
    vehicle: Types.ObjectId;
    status: BookingStatus;
    scheduledDate: Date;
    totalPrice: number;
    location: GeoLocation;
    address?: string;
    paymentStatus: PaymentStatus;
    paymentMethod?: string;
    userNotes?: string;
    review?: Types.ObjectId;
}
export declare const BookingSchema: import("mongoose").Schema<Booking, import("mongoose").Model<Booking, any, any, any, (Document<unknown, any, Booking, any, import("mongoose").DefaultSchemaOptions> & Booking & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Booking, any, import("mongoose").DefaultSchemaOptions> & Booking & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, Booking>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Booking, Document<unknown, {}, Booking, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    bookingNumber?: import("mongoose").SchemaDefinitionProperty<string, Booking, Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    user?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Booking, Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    provider?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Booking, Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    service?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Booking, Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    vehicle?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Booking, Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<BookingStatus, Booking, Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    scheduledDate?: import("mongoose").SchemaDefinitionProperty<Date, Booking, Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    totalPrice?: import("mongoose").SchemaDefinitionProperty<number, Booking, Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    location?: import("mongoose").SchemaDefinitionProperty<GeoLocation, Booking, Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    address?: import("mongoose").SchemaDefinitionProperty<string | undefined, Booking, Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    paymentStatus?: import("mongoose").SchemaDefinitionProperty<PaymentStatus, Booking, Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    paymentMethod?: import("mongoose").SchemaDefinitionProperty<string | undefined, Booking, Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    userNotes?: import("mongoose").SchemaDefinitionProperty<string | undefined, Booking, Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    review?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Booking, Document<unknown, {}, Booking, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Booking & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Booking>;
export {};
