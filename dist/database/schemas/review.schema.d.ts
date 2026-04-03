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
    providerResponse?: string;
    providerRespondedAt?: Date;
    isVisible: boolean;
    isFlagged: boolean;
    flagReason?: string;
    helpfulCount: number;
    helpfulVoters: Types.ObjectId[];
    metadata: Record<string, any>;
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
    providerResponse?: import("mongoose").SchemaDefinitionProperty<string | undefined, Review, Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    providerRespondedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Review, Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isVisible?: import("mongoose").SchemaDefinitionProperty<boolean, Review, Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isFlagged?: import("mongoose").SchemaDefinitionProperty<boolean, Review, Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    flagReason?: import("mongoose").SchemaDefinitionProperty<string | undefined, Review, Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    helpfulCount?: import("mongoose").SchemaDefinitionProperty<number, Review, Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    helpfulVoters?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId[], Review, Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metadata?: import("mongoose").SchemaDefinitionProperty<Record<string, any>, Review, Document<unknown, {}, Review, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Review & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Review>;
