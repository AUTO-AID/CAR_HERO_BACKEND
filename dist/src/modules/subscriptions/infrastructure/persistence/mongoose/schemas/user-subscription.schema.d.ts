import { Document, Types } from 'mongoose';
export type UserSubscriptionDocument = UserSubscription & Document;
export declare class UserSubscription {
    user: Types.ObjectId;
    plan: Types.ObjectId;
    startDate: Date;
    endDate: Date;
    status: string;
    autoRenew: boolean;
    cancelledAt?: Date;
    lastPaymentId?: string;
    amountPaid: number;
    metadata: Record<string, any>;
}
export declare const UserSubscriptionSchema: import("mongoose").Schema<UserSubscription, import("mongoose").Model<UserSubscription, any, any, any, (Document<unknown, any, UserSubscription, any, import("mongoose").DefaultSchemaOptions> & UserSubscription & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, UserSubscription, any, import("mongoose").DefaultSchemaOptions> & UserSubscription & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, UserSubscription>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, UserSubscription, Document<unknown, {}, UserSubscription, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<UserSubscription & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    user?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, UserSubscription, Document<unknown, {}, UserSubscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserSubscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    plan?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, UserSubscription, Document<unknown, {}, UserSubscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserSubscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    startDate?: import("mongoose").SchemaDefinitionProperty<Date, UserSubscription, Document<unknown, {}, UserSubscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserSubscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    endDate?: import("mongoose").SchemaDefinitionProperty<Date, UserSubscription, Document<unknown, {}, UserSubscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserSubscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, UserSubscription, Document<unknown, {}, UserSubscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserSubscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    autoRenew?: import("mongoose").SchemaDefinitionProperty<boolean, UserSubscription, Document<unknown, {}, UserSubscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserSubscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    cancelledAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, UserSubscription, Document<unknown, {}, UserSubscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserSubscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastPaymentId?: import("mongoose").SchemaDefinitionProperty<string | undefined, UserSubscription, Document<unknown, {}, UserSubscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserSubscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    amountPaid?: import("mongoose").SchemaDefinitionProperty<number, UserSubscription, Document<unknown, {}, UserSubscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserSubscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metadata?: import("mongoose").SchemaDefinitionProperty<Record<string, any>, UserSubscription, Document<unknown, {}, UserSubscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserSubscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, UserSubscription>;
