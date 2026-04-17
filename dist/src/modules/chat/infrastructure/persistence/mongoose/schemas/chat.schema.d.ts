import { Document, Types } from 'mongoose';
export type ChatDocument = Chat & Document;
declare class Message {
    senderId: Types.ObjectId;
    content: string;
    type: string;
    sentAt: Date;
    isRead: boolean;
    attachmentUrl?: string;
}
export declare class Chat {
    orderId: Types.ObjectId;
    participants: Types.ObjectId[];
    messages: Message[];
    isActive: boolean;
    lastMessageAt?: Date;
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
    orderId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Chat, Document<unknown, {}, Chat, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Chat & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    participants?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId[], Chat, Document<unknown, {}, Chat, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Chat & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    messages?: import("mongoose").SchemaDefinitionProperty<Message[], Chat, Document<unknown, {}, Chat, {
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
    lastMessageAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Chat, Document<unknown, {}, Chat, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Chat & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Chat>;
export {};
