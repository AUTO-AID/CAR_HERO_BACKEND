import { Document, Types } from 'mongoose';
import { SubscriptionStatus } from '../../common/enums/status.enum';
export type SubscriptionPlanDocument = SubscriptionPlan & Document;
export type SubscriptionDocument = Subscription & Document;
declare class PlanBenefit {
    name: string;
    nameAr: string;
    description?: string;
    value?: string;
}
export declare class SubscriptionPlan {
    name: string;
    nameAr: string;
    description?: string;
    descriptionAr?: string;
    price: number;
    durationDays: number;
    currency: string;
    benefits: PlanBenefit[];
    serviceDiscount: number;
    emergencyDiscount: number;
    freeEmergencyServices: number;
    freeTowingKm: number;
    prioritySupport: boolean;
    loyaltyPointsMultiplier: number;
    isActive: boolean;
    isFeatured: boolean;
    sortOrder: number;
    metadata: Record<string, any>;
}
export declare const SubscriptionPlanSchema: import("mongoose").Schema<SubscriptionPlan, import("mongoose").Model<SubscriptionPlan, any, any, any, (Document<unknown, any, SubscriptionPlan, any, import("mongoose").DefaultSchemaOptions> & SubscriptionPlan & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, SubscriptionPlan, any, import("mongoose").DefaultSchemaOptions> & SubscriptionPlan & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, SubscriptionPlan>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    name?: import("mongoose").SchemaDefinitionProperty<string, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    nameAr?: import("mongoose").SchemaDefinitionProperty<string, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string | undefined, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    descriptionAr?: import("mongoose").SchemaDefinitionProperty<string | undefined, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    price?: import("mongoose").SchemaDefinitionProperty<number, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    durationDays?: import("mongoose").SchemaDefinitionProperty<number, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    currency?: import("mongoose").SchemaDefinitionProperty<string, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    benefits?: import("mongoose").SchemaDefinitionProperty<PlanBenefit[], SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    serviceDiscount?: import("mongoose").SchemaDefinitionProperty<number, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    emergencyDiscount?: import("mongoose").SchemaDefinitionProperty<number, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    freeEmergencyServices?: import("mongoose").SchemaDefinitionProperty<number, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    freeTowingKm?: import("mongoose").SchemaDefinitionProperty<number, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    prioritySupport?: import("mongoose").SchemaDefinitionProperty<boolean, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    loyaltyPointsMultiplier?: import("mongoose").SchemaDefinitionProperty<number, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isActive?: import("mongoose").SchemaDefinitionProperty<boolean, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isFeatured?: import("mongoose").SchemaDefinitionProperty<boolean, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    sortOrder?: import("mongoose").SchemaDefinitionProperty<number, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metadata?: import("mongoose").SchemaDefinitionProperty<Record<string, any>, SubscriptionPlan, Document<unknown, {}, SubscriptionPlan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SubscriptionPlan & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, SubscriptionPlan>;
export declare class Subscription {
    subscriptionNumber: string;
    user: Types.ObjectId;
    plan: Types.ObjectId;
    status: SubscriptionStatus;
    startDate: Date;
    endDate: Date;
    paidAmount: number;
    paymentMethod?: string;
    paymentId?: string;
    emergencyServicesUsed: number;
    towingKmUsed: number;
    autoRenew: boolean;
    renewedAt?: Date;
    cancelledAt?: Date;
    cancellationReason?: string;
    metadata: Record<string, any>;
}
export declare const SubscriptionSchema: import("mongoose").Schema<Subscription, import("mongoose").Model<Subscription, any, any, any, (Document<unknown, any, Subscription, any, import("mongoose").DefaultSchemaOptions> & Subscription & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Subscription, any, import("mongoose").DefaultSchemaOptions> & Subscription & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, Subscription>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Subscription, Document<unknown, {}, Subscription, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Subscription & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    subscriptionNumber?: import("mongoose").SchemaDefinitionProperty<string, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    user?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    plan?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<SubscriptionStatus, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    startDate?: import("mongoose").SchemaDefinitionProperty<Date, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    endDate?: import("mongoose").SchemaDefinitionProperty<Date, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    paidAmount?: import("mongoose").SchemaDefinitionProperty<number, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    paymentMethod?: import("mongoose").SchemaDefinitionProperty<string | undefined, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    paymentId?: import("mongoose").SchemaDefinitionProperty<string | undefined, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    emergencyServicesUsed?: import("mongoose").SchemaDefinitionProperty<number, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    towingKmUsed?: import("mongoose").SchemaDefinitionProperty<number, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    autoRenew?: import("mongoose").SchemaDefinitionProperty<boolean, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    renewedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    cancelledAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    cancellationReason?: import("mongoose").SchemaDefinitionProperty<string | undefined, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metadata?: import("mongoose").SchemaDefinitionProperty<Record<string, any>, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Subscription>;
export {};
