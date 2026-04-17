import { Document, Types } from 'mongoose';
import { Role } from '../../../../../../core/enums/roles.enum';
import { ProviderStatus, ServiceCategory, RegistrationStatus } from '../../../../../../core/enums/status.enum';
export type ProviderDocument = Provider & Document;
declare class GeoLocation {
    type: string;
    coordinates: number[];
}
declare class WorkingHours {
    day: string;
    open: string;
    close: string;
    isClosed: boolean;
}
declare class BankAccount {
    bankName?: string;
    accountNumber?: string;
    iban?: string;
    accountHolderName?: string;
}
export declare class Provider {
    phone: string;
    email?: string;
    businessName: string;
    ownerName?: string;
    description?: string;
    logo?: string;
    images: string[];
    role: Role;
    status: ProviderStatus;
    registrationStatus: RegistrationStatus;
    rejectionReason?: string;
    isApproved: boolean;
    isActive: boolean;
    location: GeoLocation;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    serviceCategories: ServiceCategory[];
    services: Types.ObjectId[];
    workingHours: WorkingHours[];
    averageRating: number;
    totalReviews: number;
    totalOrders: number;
    otp?: string;
    otpExpiry?: Date;
    refreshToken?: string;
    fcmToken?: string;
    documents: string[];
    bankAccount?: BankAccount;
    commissionRate: number;
    walletBalance: number;
    lastOnlineAt?: Date;
}
export declare const ProviderSchema: import("mongoose").Schema<Provider, import("mongoose").Model<Provider, any, any, any, (Document<unknown, any, Provider, any, import("mongoose").DefaultSchemaOptions> & Provider & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Provider, any, import("mongoose").DefaultSchemaOptions> & Provider & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, Provider>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Provider, Document<unknown, {}, Provider, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    phone?: import("mongoose").SchemaDefinitionProperty<string, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    email?: import("mongoose").SchemaDefinitionProperty<string | undefined, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    businessName?: import("mongoose").SchemaDefinitionProperty<string, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    ownerName?: import("mongoose").SchemaDefinitionProperty<string | undefined, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string | undefined, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    logo?: import("mongoose").SchemaDefinitionProperty<string | undefined, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    images?: import("mongoose").SchemaDefinitionProperty<string[], Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    role?: import("mongoose").SchemaDefinitionProperty<Role, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<ProviderStatus, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    registrationStatus?: import("mongoose").SchemaDefinitionProperty<RegistrationStatus, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    rejectionReason?: import("mongoose").SchemaDefinitionProperty<string | undefined, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isApproved?: import("mongoose").SchemaDefinitionProperty<boolean, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isActive?: import("mongoose").SchemaDefinitionProperty<boolean, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    location?: import("mongoose").SchemaDefinitionProperty<GeoLocation, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    address?: import("mongoose").SchemaDefinitionProperty<string | undefined, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    city?: import("mongoose").SchemaDefinitionProperty<string | undefined, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    state?: import("mongoose").SchemaDefinitionProperty<string | undefined, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    country?: import("mongoose").SchemaDefinitionProperty<string | undefined, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    postalCode?: import("mongoose").SchemaDefinitionProperty<string | undefined, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    serviceCategories?: import("mongoose").SchemaDefinitionProperty<ServiceCategory[], Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    services?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId[], Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    workingHours?: import("mongoose").SchemaDefinitionProperty<WorkingHours[], Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    averageRating?: import("mongoose").SchemaDefinitionProperty<number, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    totalReviews?: import("mongoose").SchemaDefinitionProperty<number, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    totalOrders?: import("mongoose").SchemaDefinitionProperty<number, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    otp?: import("mongoose").SchemaDefinitionProperty<string | undefined, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    otpExpiry?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    refreshToken?: import("mongoose").SchemaDefinitionProperty<string | undefined, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    fcmToken?: import("mongoose").SchemaDefinitionProperty<string | undefined, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    documents?: import("mongoose").SchemaDefinitionProperty<string[], Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    bankAccount?: import("mongoose").SchemaDefinitionProperty<BankAccount | undefined, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    commissionRate?: import("mongoose").SchemaDefinitionProperty<number, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    walletBalance?: import("mongoose").SchemaDefinitionProperty<number, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastOnlineAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Provider, Document<unknown, {}, Provider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Provider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Provider>;
export {};
