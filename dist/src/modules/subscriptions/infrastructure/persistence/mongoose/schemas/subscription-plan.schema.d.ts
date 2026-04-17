import { Document } from 'mongoose';
export type SubscriptionPlanDocument = SubscriptionPlan & Document;
export declare class SubscriptionPlan {
    name: string;
    nameAr: string;
    description?: string;
    descriptionAr?: string;
    price: number;
    durationDays: number;
    features: string[];
    featuresAr: string[];
    isActive: boolean;
    tier: string;
    sortOrder: number;
    metadata: Record<string, any>;
}
export declare const SubscriptionPlanSchema: import("mongoose").Schema<SubscriptionPlan, import("mongoose").Model<SubscriptionPlan, any, any, any, (Document<unknown, any, SubscriptionPlan, any, import("mongoose").DefaultSchemaOptions> & SubscriptionPlan & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, SubscriptionPlan, any, import("mongoose").DefaultSchemaOptions> & SubscriptionPlan & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}), any, SubscriptionPlan>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    name?: import("mongoose").SchemaDefinitionProperty<string, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    nameAr?: import("mongoose").SchemaDefinitionProperty<string, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string | undefined, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    descriptionAr?: import("mongoose").SchemaDefinitionProperty<string | undefined, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    price?: import("mongoose").SchemaDefinitionProperty<number, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    durationDays?: import("mongoose").SchemaDefinitionProperty<number, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    features?: import("mongoose").SchemaDefinitionProperty<string[], SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    featuresAr?: import("mongoose").SchemaDefinitionProperty<string[], SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isActive?: import("mongoose").SchemaDefinitionProperty<boolean, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    tier?: import("mongoose").SchemaDefinitionProperty<string, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    sortOrder?: import("mongoose").SchemaDefinitionProperty<number, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metadata?: import("mongoose").SchemaDefinitionProperty<Record<string, any>, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, SubscriptionPlan>;
