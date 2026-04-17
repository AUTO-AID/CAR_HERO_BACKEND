import { Document } from 'mongoose';
export type PromoCodeDocument = PromoCode & Document;
export declare class PromoCode {
    code: string;
    type: string;
    value: number;
    expiryDate: Date;
    usageLimit: number;
    usageCount: number;
    minOrderAmount?: number;
    isActive: boolean;
    applicableServices: string[];
}
export declare const PromoCodeSchema: import("mongoose").Schema<PromoCode, import("mongoose").Model<PromoCode, any, any, any, (Document<unknown, any, PromoCode, any, import("mongoose").DefaultSchemaOptions> & PromoCode & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, PromoCode, any, import("mongoose").DefaultSchemaOptions> & PromoCode & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}), any, PromoCode>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PromoCode, Document<unknown, {}, PromoCode, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    code?: import("mongoose").SchemaDefinitionProperty<string, PromoCode, Document<unknown, {}, PromoCode, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    type?: import("mongoose").SchemaDefinitionProperty<string, PromoCode, Document<unknown, {}, PromoCode, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    value?: import("mongoose").SchemaDefinitionProperty<number, PromoCode, Document<unknown, {}, PromoCode, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    expiryDate?: import("mongoose").SchemaDefinitionProperty<Date, PromoCode, Document<unknown, {}, PromoCode, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    usageLimit?: import("mongoose").SchemaDefinitionProperty<number, PromoCode, Document<unknown, {}, PromoCode, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    usageCount?: import("mongoose").SchemaDefinitionProperty<number, PromoCode, Document<unknown, {}, PromoCode, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    minOrderAmount?: import("mongoose").SchemaDefinitionProperty<number | undefined, PromoCode, Document<unknown, {}, PromoCode, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isActive?: import("mongoose").SchemaDefinitionProperty<boolean, PromoCode, Document<unknown, {}, PromoCode, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    applicableServices?: import("mongoose").SchemaDefinitionProperty<string[], PromoCode, Document<unknown, {}, PromoCode, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PromoCode & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, PromoCode>;
