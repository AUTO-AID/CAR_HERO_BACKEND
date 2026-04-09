import { MessageType } from '../../../database/schemas/chat.schema';
export declare class LocationDto {
    lat: number;
    lng: number;
    address?: string;
}
export declare class SendMessageDto {
    chatId: string;
    message: string;
    type?: MessageType;
    fileUrl?: string;
    location?: LocationDto;
}
export declare class CreateChatDto {
    participantId: string;
    orderId?: string;
}
