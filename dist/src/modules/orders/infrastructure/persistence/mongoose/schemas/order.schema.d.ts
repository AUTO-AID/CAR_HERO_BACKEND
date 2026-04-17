import { Document, Types } from 'mongoose';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../../../../../../core/enums/status.enum';
export type OrderDocument = Order & Document;
declare class GeoLocation {
    type: string;
    coordinates: number[];
}
export declare class Order {
    orderNumber: string;
    user: Types.ObjectId;
    provider?: Types.ObjectId;
    service: Types.ObjectId;
    vehicle?: Types.ObjectId;
    status: OrderStatus;
    totalAmount: number;
    discountAmount: number;
    payableAmount: number;
    location: GeoLocation;
    address?: string;
    isScheduled: boolean;
    scheduledAt?: Date;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod;
    paymentId?: string;
    userNotes?: string;
    providerNotes?: string;
    images: string[];
    acceptedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    cancelledAt?: Date;
    cancellationReason?: string;
    cancelledBy?: string;
    review?: Types.ObjectId;
    rating?: number;
    metadata: Record<string, any>;
}
export declare const OrderSchema: import("mongoose").Schema<Order, import("mongoose").Model<Order, any, any, any, (Document<unknown, any, Order, any, import("mongoose").DefaultSchemaOptions> & Order & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Order, any, import("mongoose").DefaultSchemaOptions> & Order & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, Order>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Order, Document<unknown, {}, Order, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    orderNumber?: import("mongoose").SchemaDefinitionProperty<string, Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    user?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    provider?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    service?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    vehicle?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<OrderStatus, Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    totalAmount?: import("mongoose").SchemaDefinitionProperty<number, Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    discountAmount?: import("mongoose").SchemaDefinitionProperty<number, Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    payableAmount?: import("mongoose").SchemaDefinitionProperty<number, Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    location?: import("mongoose").SchemaDefinitionProperty<GeoLocation, Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    address?: import("mongoose").SchemaDefinitionProperty<string | undefined, Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isScheduled?: import("mongoose").SchemaDefinitionProperty<boolean, Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    scheduledAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    paymentStatus?: import("mongoose").SchemaDefinitionProperty<PaymentStatus, Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    paymentMethod?: PaymentMethod;
    paymentId?: import("mongoose").SchemaDefinitionProperty<string | undefined, Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    userNotes?: import("mongoose").SchemaDefinitionProperty<string | undefined, Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    providerNotes?: import("mongoose").SchemaDefinitionProperty<string | undefined, Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    images?: import("mongoose").SchemaDefinitionProperty<string[], Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    acceptedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    startedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    completedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    cancelledAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    cancellationReason?: import("mongoose").SchemaDefinitionProperty<string | undefined, Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    cancelledBy?: import("mongoose").SchemaDefinitionProperty<string | undefined, Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    review?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    rating?: import("mongoose").SchemaDefinitionProperty<number | undefined, Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metadata?: import("mongoose").SchemaDefinitionProperty<Record<string, any>, Order, Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Order>;
export {};
