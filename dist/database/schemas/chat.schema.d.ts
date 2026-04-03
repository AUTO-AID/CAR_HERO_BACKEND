import { Document, Types } from 'mongoose';
export type ChatDocument = Chat & Document;
export type MessageDocument = Message & Document;
export declare class Chat {
    user?: Types.ObjectId;
    provider?: Types.ObjectId;
    order?: Types.ObjectId;
    booking?: Types.ObjectId;
    lastMessage?: string;
    lastMessageAt?: Date;
    lastMessageBy?: string;
    userUnreadCount: number;
    providerUnreadCount: number;
    isActive: boolean;
    metadata: Record<string, any>;
}
export declare const ChatSchema: import("mongoose").Schema<Chat, import("mongoose").Model<Chat, any, any, any, (Document<unknown, any, Chat, any, import("mongoose").DefaultSchemaOptions> & Chat & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Chat, any, import("mongoose").DefaultSchemaOptions> & Chat & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, Chat>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Chat, Document<unknown, {}, Chat, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Chat & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    user?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Chat, Document<unknown, {}, Chat, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Chat & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    provider?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Chat, Document<unknown, {}, Chat, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Chat & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    order?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Chat, Document<unknown, {}, Chat, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Chat & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    booking?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Chat, Document<unknown, {}, Chat, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Chat & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastMessage?: import("mongoose").SchemaDefinitionProperty<string | undefined, Chat, Document<unknown, {}, Chat, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Chat & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastMessageAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Chat, Document<unknown, {}, Chat, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Chat & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastMessageBy?: import("mongoose").SchemaDefinitionProperty<string | undefined, Chat, Document<unknown, {}, Chat, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Chat & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    userUnreadCount?: import("mongoose").SchemaDefinitionProperty<number, Chat, Document<unknown, {}, Chat, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Chat & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    providerUnreadCount?: import("mongoose").SchemaDefinitionProperty<number, Chat, Document<unknown, {}, Chat, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Chat & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isActive?: import("mongoose").SchemaDefinitionProperty<boolean, Chat, Document<unknown, {}, Chat, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Chat & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metadata?: import("mongoose").SchemaDefinitionProperty<Record<string, any>, Chat, Document<unknown, {}, Chat, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Chat & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Chat>;
export declare class Message {
    chat: Types.ObjectId;
    senderType: string;
    senderId: Types.ObjectId;
    content: string;
    type: string;
    mediaUrl?: string;
    mediaType?: string;
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    isRead: boolean;
    readAt?: Date;
    isDeleted: boolean;
    deletedAt?: Date;
    metadata: Record<string, any>;
}
export declare const MessageSchema: import("mongoose").Schema<Message, import("mongoose").Model<Message, any, any, any, (Document<unknown, any, Message, any, import("mongoose").DefaultSchemaOptions> & Message & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Message, any, import("mongoose").DefaultSchemaOptions> & Message & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, Message>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Message, Document<unknown, {}, Message, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    chat?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    senderType?: import("mongoose").SchemaDefinitionProperty<string, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    senderId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    content?: import("mongoose").SchemaDefinitionProperty<string, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    type?: import("mongoose").SchemaDefinitionProperty<string, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    mediaUrl?: import("mongoose").SchemaDefinitionProperty<string | undefined, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    mediaType?: import("mongoose").SchemaDefinitionProperty<string | undefined, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    location?: import("mongoose").SchemaDefinitionProperty<{
        latitude: number;
        longitude: number;
        address?: string;
    } | undefined, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isRead?: import("mongoose").SchemaDefinitionProperty<boolean, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    readAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isDeleted?: import("mongoose").SchemaDefinitionProperty<boolean, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    deletedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metadata?: import("mongoose").SchemaDefinitionProperty<Record<string, any>, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Message>;
