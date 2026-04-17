import { Document, Types } from 'mongoose';
import { TransactionType } from '../../../../../../core/enums/status.enum';
export type WalletDocument = Wallet & Document;
export type TransactionDocument = Transaction & Document;
export declare class Wallet {
    ownerId: Types.ObjectId;
    ownerType: string;
    balance: number;
    loyaltyPoints: number;
    pendingBalance: number;
    currency: string;
    isActive: boolean;
    metadata: Record<string, any>;
}
export declare const WalletSchema: import("mongoose").Schema<Wallet, import("mongoose").Model<Wallet, any, any, any, (Document<unknown, any, Wallet, any, import("mongoose").DefaultSchemaOptions> & Wallet & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Wallet, any, import("mongoose").DefaultSchemaOptions> & Wallet & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, Wallet>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Wallet, Document<unknown, {}, Wallet, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    ownerId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Wallet, Document<unknown, {}, Wallet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    ownerType?: import("mongoose").SchemaDefinitionProperty<string, Wallet, Document<unknown, {}, Wallet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    balance?: import("mongoose").SchemaDefinitionProperty<number, Wallet, Document<unknown, {}, Wallet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    loyaltyPoints?: import("mongoose").SchemaDefinitionProperty<number, Wallet, Document<unknown, {}, Wallet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    pendingBalance?: import("mongoose").SchemaDefinitionProperty<number, Wallet, Document<unknown, {}, Wallet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    currency?: import("mongoose").SchemaDefinitionProperty<string, Wallet, Document<unknown, {}, Wallet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isActive?: import("mongoose").SchemaDefinitionProperty<boolean, Wallet, Document<unknown, {}, Wallet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metadata?: import("mongoose").SchemaDefinitionProperty<Record<string, any>, Wallet, Document<unknown, {}, Wallet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Wallet>;
export declare class Transaction {
    transactionNumber: string;
    wallet: Types.ObjectId;
    ownerId: Types.ObjectId;
    ownerType: string;
    type: TransactionType;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    description: string;
    referenceType?: string;
    referenceId?: Types.ObjectId;
    paymentMethod?: string;
    paymentId?: string;
    status: string;
    pointsEarned: number;
    pointsRedeemed: number;
    metadata: Record<string, any>;
}
export declare const TransactionSchema: import("mongoose").Schema<Transaction, import("mongoose").Model<Transaction, any, any, any, (Document<unknown, any, Transaction, any, import("mongoose").DefaultSchemaOptions> & Transaction & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Transaction, any, import("mongoose").DefaultSchemaOptions> & Transaction & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, Transaction>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Transaction, Document<unknown, {}, Transaction, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    transactionNumber?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    wallet?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    ownerId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    ownerType?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    type?: import("mongoose").SchemaDefinitionProperty<TransactionType, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    amount?: import("mongoose").SchemaDefinitionProperty<number, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    balanceBefore?: import("mongoose").SchemaDefinitionProperty<number, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    balanceAfter?: import("mongoose").SchemaDefinitionProperty<number, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    referenceType?: import("mongoose").SchemaDefinitionProperty<string | undefined, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    referenceId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    paymentMethod?: import("mongoose").SchemaDefinitionProperty<string | undefined, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    paymentId?: import("mongoose").SchemaDefinitionProperty<string | undefined, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    pointsEarned?: import("mongoose").SchemaDefinitionProperty<number, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    pointsRedeemed?: import("mongoose").SchemaDefinitionProperty<number, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metadata?: import("mongoose").SchemaDefinitionProperty<Record<string, any>, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Transaction>;
