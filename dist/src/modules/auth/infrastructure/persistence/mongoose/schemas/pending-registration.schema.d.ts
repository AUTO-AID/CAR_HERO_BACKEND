import { Document } from 'mongoose';
export type PendingRegistrationDocument = PendingRegistration & Document;
export declare class PendingRegistration {
    phoneNumber: string;
    fullName: string;
    password: string;
    accountType: string;
    isTermsAccepted: boolean;
    otpCode: string | null;
    otpExpiresAt: Date | null;
    otpAttempts: number;
    expiresAt: Date;
}
export declare const PendingRegistrationSchema: import("mongoose").Schema<PendingRegistration, import("mongoose").Model<PendingRegistration, any, any, any, (Document<unknown, any, PendingRegistration, any, import("mongoose").DefaultSchemaOptions> & PendingRegistration & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, PendingRegistration, any, import("mongoose").DefaultSchemaOptions> & PendingRegistration & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}), any, PendingRegistration>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PendingRegistration, Document<unknown, {}, PendingRegistration, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<PendingRegistration & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    phoneNumber?: import("mongoose").SchemaDefinitionProperty<string, PendingRegistration, Document<unknown, {}, PendingRegistration, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PendingRegistration & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    fullName?: import("mongoose").SchemaDefinitionProperty<string, PendingRegistration, Document<unknown, {}, PendingRegistration, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PendingRegistration & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    password?: import("mongoose").SchemaDefinitionProperty<string, PendingRegistration, Document<unknown, {}, PendingRegistration, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PendingRegistration & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    accountType?: import("mongoose").SchemaDefinitionProperty<string, PendingRegistration, Document<unknown, {}, PendingRegistration, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PendingRegistration & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isTermsAccepted?: import("mongoose").SchemaDefinitionProperty<boolean, PendingRegistration, Document<unknown, {}, PendingRegistration, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PendingRegistration & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    otpCode?: import("mongoose").SchemaDefinitionProperty<string | null, PendingRegistration, Document<unknown, {}, PendingRegistration, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PendingRegistration & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    otpExpiresAt?: import("mongoose").SchemaDefinitionProperty<Date | null, PendingRegistration, Document<unknown, {}, PendingRegistration, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PendingRegistration & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    otpAttempts?: import("mongoose").SchemaDefinitionProperty<number, PendingRegistration, Document<unknown, {}, PendingRegistration, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PendingRegistration & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    expiresAt?: import("mongoose").SchemaDefinitionProperty<Date, PendingRegistration, Document<unknown, {}, PendingRegistration, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PendingRegistration & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, PendingRegistration>;
