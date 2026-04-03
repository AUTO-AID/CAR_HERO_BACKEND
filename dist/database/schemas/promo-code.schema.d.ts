import { Document, Types } from 'mongoose';
export type PromoCodeDocument = PromoCode & Document;
export declare class PromoCode {
    code: string;
    description: string;
    discountType: string;
    discountValue: number;
    maxDiscount?: number;
    minOrderAmount: number;
    maxUsageTotal?: number;
    maxUsagePerUser?: number;
    usedCount: number;
    usedBy: Types.ObjectId[];
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    applicableServices: string[];
    newUsersOnly: boolean;
    subscribersOnly: boolean;
    metadata: Record<string, any>;
}
export declare const PromoCodeSchema: import("mongoose").Schema<PromoCode, import("mongoose").Model<PromoCode, any, any, any, (Document<unknown, any, PromoCode, any, import("mongoose").DefaultSchemaOptions> & PromoCode & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, PromoCode, any, import("mongoose").DefaultSchemaOptions> & PromoCode & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, PromoCode>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PromoCode, Document<unknown, {}, PromoCode, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    code?: import("mongoose").SchemaDefinitionProperty<string, PromoCode, Document<unknown, {}, PromoCode, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string, PromoCode, Document<unknown, {}, PromoCode, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    discountType?: import("mongoose").SchemaDefinitionProperty<string, PromoCode, Document<unknown, {}, PromoCode, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    discountValue?: import("mongoose").SchemaDefinitionProperty<number, PromoCode, Document<unknown, {}, PromoCode, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    maxDiscount?: import("mongoose").SchemaDefinitionProperty<number | undefined, PromoCode, Document<unknown, {}, PromoCode, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    minOrderAmount?: import("mongoose").SchemaDefinitionProperty<number, PromoCode, Document<unknown, {}, PromoCode, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    maxUsageTotal?: import("mongoose").SchemaDefinitionProperty<number | undefined, PromoCode, Document<unknown, {}, PromoCode, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    maxUsagePerUser?: import("mongoose").SchemaDefinitionProperty<number | undefined, PromoCode, Document<unknown, {}, PromoCode, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    usedCount?: import("mongoose").SchemaDefinitionProperty<number, PromoCode, Document<unknown, {}, PromoCode, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    usedBy?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId[], PromoCode, Document<unknown, {}, PromoCode, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    startDate?: import("mongoose").SchemaDefinitionProperty<Date, PromoCode, Document<unknown, {}, PromoCode, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    endDate?: import("mongoose").SchemaDefinitionProperty<Date, PromoCode, Document<unknown, {}, PromoCode, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isActive?: import("mongoose").SchemaDefinitionProperty<boolean, PromoCode, Document<unknown, {}, PromoCode, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    applicableServices?: import("mongoose").SchemaDefinitionProperty<string[], PromoCode, Document<unknown, {}, PromoCode, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    newUsersOnly?: import("mongoose").SchemaDefinitionProperty<boolean, PromoCode, Document<unknown, {}, PromoCode, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    subscribersOnly?: import("mongoose").SchemaDefinitionProperty<boolean, PromoCode, Document<unknown, {}, PromoCode, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metadata?: import("mongoose").SchemaDefinitionProperty<Record<string, any>, PromoCode, Document<unknown, {}, PromoCode, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, PromoCode>;
