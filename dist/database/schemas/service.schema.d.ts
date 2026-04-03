import { Document, Types } from 'mongoose';
import { ServiceCategory } from '../../common/enums/status.enum';
export type ServiceDocument = Service & Document;
export declare class Service {
    name: string;
    nameAr: string;
    description?: string;
    descriptionAr?: string;
    category: ServiceCategory;
    icon?: string;
    image?: string;
    basePrice: number;
    discountedPrice: number;
    estimatedDuration: number;
    isActive: boolean;
    isEmergency: boolean;
    sortOrder: number;
    provider?: Types.ObjectId;
    isSystemService: boolean;
    options: {
        name: string;
        nameAr: string;
        price: number;
        isDefault?: boolean;
    }[];
    metadata: Record<string, any>;
}
export declare const ServiceSchema: import("mongoose").Schema<Service, import("mongoose").Model<Service, any, any, any, (Document<unknown, any, Service, any, import("mongoose").DefaultSchemaOptions> & Service & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Service, any, import("mongoose").DefaultSchemaOptions> & Service & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, Service>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Service, Document<unknown, {}, Service, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Service & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    name?: import("mongoose").SchemaDefinitionProperty<string, Service, Document<unknown, {}, Service, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Service & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    nameAr?: import("mongoose").SchemaDefinitionProperty<string, Service, Document<unknown, {}, Service, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Service & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string | undefined, Service, Document<unknown, {}, Service, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Service & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    descriptionAr?: import("mongoose").SchemaDefinitionProperty<string | undefined, Service, Document<unknown, {}, Service, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Service & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    category?: import("mongoose").SchemaDefinitionProperty<ServiceCategory, Service, Document<unknown, {}, Service, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Service & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    icon?: import("mongoose").SchemaDefinitionProperty<string | undefined, Service, Document<unknown, {}, Service, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Service & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    image?: import("mongoose").SchemaDefinitionProperty<string | undefined, Service, Document<unknown, {}, Service, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Service & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    basePrice?: import("mongoose").SchemaDefinitionProperty<number, Service, Document<unknown, {}, Service, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Service & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    discountedPrice?: import("mongoose").SchemaDefinitionProperty<number, Service, Document<unknown, {}, Service, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Service & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    estimatedDuration?: import("mongoose").SchemaDefinitionProperty<number, Service, Document<unknown, {}, Service, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Service & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isActive?: import("mongoose").SchemaDefinitionProperty<boolean, Service, Document<unknown, {}, Service, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Service & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isEmergency?: import("mongoose").SchemaDefinitionProperty<boolean, Service, Document<unknown, {}, Service, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Service & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    sortOrder?: import("mongoose").SchemaDefinitionProperty<number, Service, Document<unknown, {}, Service, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Service & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    provider?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Service, Document<unknown, {}, Service, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Service & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isSystemService?: import("mongoose").SchemaDefinitionProperty<boolean, Service, Document<unknown, {}, Service, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Service & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    options?: import("mongoose").SchemaDefinitionProperty<{
        name: string;
        nameAr: string;
        price: number;
        isDefault?: boolean;
    }[], Service, Document<unknown, {}, Service, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Service & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metadata?: import("mongoose").SchemaDefinitionProperty<Record<string, any>, Service, Document<unknown, {}, Service, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Service & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Service>;
