import { Document, Types } from 'mongoose';
export type MaintenanceRecordDocument = MaintenanceRecord & Document;
export declare class MaintenanceRecord {
    vehicle: Types.ObjectId;
    user: Types.ObjectId;
    serviceType: string;
    description?: string;
    date: Date;
    mileage?: number;
    cost?: number;
    provider?: string;
    location?: string;
    invoiceNumber?: string;
    parts: string[];
    notes?: string;
    attachments: string[];
}
export declare const MaintenanceRecordSchema: import("mongoose").Schema<MaintenanceRecord, import("mongoose").Model<MaintenanceRecord, any, any, any, (Document<unknown, any, MaintenanceRecord, any, import("mongoose").DefaultSchemaOptions> & MaintenanceRecord & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, MaintenanceRecord, any, import("mongoose").DefaultSchemaOptions> & MaintenanceRecord & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, MaintenanceRecord>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MaintenanceRecord, Document<unknown, {}, MaintenanceRecord, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<MaintenanceRecord & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    vehicle?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, MaintenanceRecord, Document<unknown, {}, MaintenanceRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MaintenanceRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    user?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, MaintenanceRecord, Document<unknown, {}, MaintenanceRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MaintenanceRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    serviceType?: import("mongoose").SchemaDefinitionProperty<string, MaintenanceRecord, Document<unknown, {}, MaintenanceRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MaintenanceRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string | undefined, MaintenanceRecord, Document<unknown, {}, MaintenanceRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MaintenanceRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    date?: import("mongoose").SchemaDefinitionProperty<Date, MaintenanceRecord, Document<unknown, {}, MaintenanceRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MaintenanceRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    mileage?: import("mongoose").SchemaDefinitionProperty<number | undefined, MaintenanceRecord, Document<unknown, {}, MaintenanceRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MaintenanceRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    cost?: import("mongoose").SchemaDefinitionProperty<number | undefined, MaintenanceRecord, Document<unknown, {}, MaintenanceRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MaintenanceRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    provider?: import("mongoose").SchemaDefinitionProperty<string | undefined, MaintenanceRecord, Document<unknown, {}, MaintenanceRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MaintenanceRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    location?: import("mongoose").SchemaDefinitionProperty<string | undefined, MaintenanceRecord, Document<unknown, {}, MaintenanceRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MaintenanceRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    invoiceNumber?: import("mongoose").SchemaDefinitionProperty<string | undefined, MaintenanceRecord, Document<unknown, {}, MaintenanceRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MaintenanceRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    parts?: import("mongoose").SchemaDefinitionProperty<string[], MaintenanceRecord, Document<unknown, {}, MaintenanceRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MaintenanceRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    notes?: import("mongoose").SchemaDefinitionProperty<string | undefined, MaintenanceRecord, Document<unknown, {}, MaintenanceRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MaintenanceRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    attachments?: import("mongoose").SchemaDefinitionProperty<string[], MaintenanceRecord, Document<unknown, {}, MaintenanceRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MaintenanceRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, MaintenanceRecord>;
