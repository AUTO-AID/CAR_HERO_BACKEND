import { Document } from 'mongoose';
export type SettingDocument = Setting & Document;
export declare class Setting {
    key: string;
    value: any;
    description?: string;
    group: string;
    isPublic: boolean;
}
export declare const SettingSchema: import("mongoose").Schema<Setting, import("mongoose").Model<Setting, any, any, any, (Document<unknown, any, Setting, any, import("mongoose").DefaultSchemaOptions> & Setting & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Setting, any, import("mongoose").DefaultSchemaOptions> & Setting & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}), any, Setting>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Setting, Document<unknown, {}, Setting, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Setting & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    key?: import("mongoose").SchemaDefinitionProperty<string, Setting, Document<unknown, {}, Setting, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Setting & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    value?: import("mongoose").SchemaDefinitionProperty<any, Setting, Document<unknown, {}, Setting, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Setting & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string | undefined, Setting, Document<unknown, {}, Setting, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Setting & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    group?: import("mongoose").SchemaDefinitionProperty<string, Setting, Document<unknown, {}, Setting, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Setting & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isPublic?: import("mongoose").SchemaDefinitionProperty<boolean, Setting, Document<unknown, {}, Setting, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Setting & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Setting>;
