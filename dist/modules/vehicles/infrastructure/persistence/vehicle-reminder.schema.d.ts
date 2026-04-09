import { Document, Types } from 'mongoose';
import { ReminderType, ReminderFrequency } from '../../domain/entities/vehicle-reminder.entity';
export type VehicleReminderDocument = VehicleReminder & Document;
export declare class VehicleReminder {
    vehicle: Types.ObjectId;
    user: Types.ObjectId;
    type: ReminderType;
    title: string;
    description?: string;
    reminderDate?: Date;
    mileageThreshold?: number;
    currentMileage?: number;
    frequency?: ReminderFrequency;
    isActive: boolean;
    isRecurring: boolean;
    lastTriggeredAt?: Date;
    notes?: string;
}
export declare const VehicleReminderSchema: import("mongoose").Schema<VehicleReminder, import("mongoose").Model<VehicleReminder, any, any, any, (Document<unknown, any, VehicleReminder, any, import("mongoose").DefaultSchemaOptions> & VehicleReminder & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, VehicleReminder, any, import("mongoose").DefaultSchemaOptions> & VehicleReminder & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, VehicleReminder>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, VehicleReminder, Document<unknown, {}, VehicleReminder, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<VehicleReminder & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    vehicle?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, VehicleReminder, Document<unknown, {}, VehicleReminder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VehicleReminder & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    user?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, VehicleReminder, Document<unknown, {}, VehicleReminder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VehicleReminder & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    type?: import("mongoose").SchemaDefinitionProperty<ReminderType, VehicleReminder, Document<unknown, {}, VehicleReminder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VehicleReminder & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    title?: import("mongoose").SchemaDefinitionProperty<string, VehicleReminder, Document<unknown, {}, VehicleReminder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VehicleReminder & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string | undefined, VehicleReminder, Document<unknown, {}, VehicleReminder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VehicleReminder & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reminderDate?: import("mongoose").SchemaDefinitionProperty<Date | undefined, VehicleReminder, Document<unknown, {}, VehicleReminder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VehicleReminder & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    mileageThreshold?: import("mongoose").SchemaDefinitionProperty<number | undefined, VehicleReminder, Document<unknown, {}, VehicleReminder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VehicleReminder & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    currentMileage?: import("mongoose").SchemaDefinitionProperty<number | undefined, VehicleReminder, Document<unknown, {}, VehicleReminder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VehicleReminder & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    frequency?: import("mongoose").SchemaDefinitionProperty<ReminderFrequency | undefined, VehicleReminder, Document<unknown, {}, VehicleReminder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VehicleReminder & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isActive?: import("mongoose").SchemaDefinitionProperty<boolean, VehicleReminder, Document<unknown, {}, VehicleReminder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VehicleReminder & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isRecurring?: import("mongoose").SchemaDefinitionProperty<boolean, VehicleReminder, Document<unknown, {}, VehicleReminder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VehicleReminder & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastTriggeredAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, VehicleReminder, Document<unknown, {}, VehicleReminder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VehicleReminder & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    notes?: import("mongoose").SchemaDefinitionProperty<string | undefined, VehicleReminder, Document<unknown, {}, VehicleReminder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VehicleReminder & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, VehicleReminder>;
