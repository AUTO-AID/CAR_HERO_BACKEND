import { Document, Types } from 'mongoose';
export type LogoutDocument = Logout & Document;
export declare class Logout {
    userId: Types.ObjectId;
    refreshTokenHash: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    reason: string;
}
export declare const LogoutSchema: import("mongoose").Schema<Logout, import("mongoose").Model<Logout, any, any, any, (Document<unknown, any, Logout, any, import("mongoose").DefaultSchemaOptions> & Logout & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Logout, any, import("mongoose").DefaultSchemaOptions> & Logout & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, Logout>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Logout, Document<unknown, {}, Logout, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Logout & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Logout, Document<unknown, {}, Logout, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Logout & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    refreshTokenHash?: import("mongoose").SchemaDefinitionProperty<string, Logout, Document<unknown, {}, Logout, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Logout & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    ipAddress?: import("mongoose").SchemaDefinitionProperty<string | undefined, Logout, Document<unknown, {}, Logout, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Logout & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    userAgent?: import("mongoose").SchemaDefinitionProperty<string | undefined, Logout, Document<unknown, {}, Logout, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Logout & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    success?: import("mongoose").SchemaDefinitionProperty<boolean, Logout, Document<unknown, {}, Logout, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Logout & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reason?: import("mongoose").SchemaDefinitionProperty<string, Logout, Document<unknown, {}, Logout, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Logout & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Logout>;
