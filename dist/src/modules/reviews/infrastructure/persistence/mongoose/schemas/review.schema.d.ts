import { Document, Types } from 'mongoose';
export type ReviewDocument = Review & Document;
export declare class Review {
    user: Types.ObjectId;
    provider: Types.ObjectId;
    order?: Types.ObjectId;
    booking?: Types.ObjectId;
    rating: number;
    comment?: string;
    serviceQuality?: number;
    punctuality?: number;
    professionalism?: number;
    valueForMoney?: number;
    images: string[];
    isReported: boolean;
    reportReason?: string;
    response?: {
        comment: string;
        repliedAt: Date;
    };
}
export declare const ReviewSchema: import("mongoose").Schema<Review, import("mongoose").Model<Review, any, any, any, (Document<unknown, any, Review, any, import("mongoose").DefaultSchemaOptions> & Review & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Review, any, import("mongoose").DefaultSchemaOptions> & Review & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, Review>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Review, Document<unknown, {}, Review, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    user?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Review, Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    provider?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Review, Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    order?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Review, Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    booking?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Review, Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    rating?: import("mongoose").SchemaDefinitionProperty<number, Review, Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    comment?: import("mongoose").SchemaDefinitionProperty<string | undefined, Review, Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    serviceQuality?: import("mongoose").SchemaDefinitionProperty<number | undefined, Review, Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    punctuality?: import("mongoose").SchemaDefinitionProperty<number | undefined, Review, Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    professionalism?: import("mongoose").SchemaDefinitionProperty<number | undefined, Review, Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    valueForMoney?: import("mongoose").SchemaDefinitionProperty<number | undefined, Review, Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    images?: import("mongoose").SchemaDefinitionProperty<string[], Review, Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isReported?: import("mongoose").SchemaDefinitionProperty<boolean, Review, Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reportReason?: import("mongoose").SchemaDefinitionProperty<string | undefined, Review, Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    response?: import("mongoose").SchemaDefinitionProperty<{
        comment: string;
        repliedAt: Date;
    } | undefined, Review, Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Review>;
