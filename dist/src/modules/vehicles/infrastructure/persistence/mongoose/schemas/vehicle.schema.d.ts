import { Document, Types } from 'mongoose';
export type VehicleDocument = Vehicle & Document;
export declare class Vehicle {
    user: Types.ObjectId;
    make: string;
    model: string;
    year: number;
    plateNumber: string;
    color?: string;
    vin?: string;
    image?: string;
    isActive: boolean;
    isDefault: boolean;
    metadata: Record<string, any>;
}
export declare const VehicleSchema: import("mongoose").Schema<Vehicle, import("mongoose").Model<Vehicle, any, any, any, (Document<unknown, any, Vehicle, any, import("mongoose").DefaultSchemaOptions> & Vehicle & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Vehicle, any, import("mongoose").DefaultSchemaOptions> & Vehicle & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, Vehicle>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Vehicle, Document<unknown, {}, Vehicle, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Vehicle & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    user?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Vehicle, Document<unknown, {}, Vehicle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Vehicle & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    make?: import("mongoose").SchemaDefinitionProperty<string, Vehicle, Document<unknown, {}, Vehicle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Vehicle & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    model?: import("mongoose").SchemaDefinitionProperty<string, Vehicle, Document<unknown, {}, Vehicle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Vehicle & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    year?: import("mongoose").SchemaDefinitionProperty<number, Vehicle, Document<unknown, {}, Vehicle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Vehicle & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    plateNumber?: import("mongoose").SchemaDefinitionProperty<string, Vehicle, Document<unknown, {}, Vehicle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Vehicle & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    color?: import("mongoose").SchemaDefinitionProperty<string | undefined, Vehicle, Document<unknown, {}, Vehicle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Vehicle & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    vin?: import("mongoose").SchemaDefinitionProperty<string | undefined, Vehicle, Document<unknown, {}, Vehicle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Vehicle & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    image?: import("mongoose").SchemaDefinitionProperty<string | undefined, Vehicle, Document<unknown, {}, Vehicle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Vehicle & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isActive?: import("mongoose").SchemaDefinitionProperty<boolean, Vehicle, Document<unknown, {}, Vehicle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Vehicle & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isDefault?: import("mongoose").SchemaDefinitionProperty<boolean, Vehicle, Document<unknown, {}, Vehicle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Vehicle & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metadata?: import("mongoose").SchemaDefinitionProperty<Record<string, any>, Vehicle, Document<unknown, {}, Vehicle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Vehicle & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Vehicle>;
