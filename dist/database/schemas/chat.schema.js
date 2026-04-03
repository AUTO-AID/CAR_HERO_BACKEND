"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageSchema = exports.Message = exports.ChatSchema = exports.Chat = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Chat = class Chat {
    user;
    provider;
    order;
    booking;
    lastMessage;
    lastMessageAt;
    lastMessageBy;
    userUnreadCount;
    providerUnreadCount;
    isActive;
    metadata;
};
exports.Chat = Chat;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Chat.prototype, "user", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Provider' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Chat.prototype, "provider", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Order' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Chat.prototype, "order", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Booking' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Chat.prototype, "booking", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Chat.prototype, "lastMessage", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Chat.prototype, "lastMessageAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'user' }),
    __metadata("design:type", String)
], Chat.prototype, "lastMessageBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Chat.prototype, "userUnreadCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Chat.prototype, "providerUnreadCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Chat.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], Chat.prototype, "metadata", void 0);
exports.Chat = Chat = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.__v;
                return ret;
            },
        },
    })
], Chat);
exports.ChatSchema = mongoose_1.SchemaFactory.createForClass(Chat);
exports.ChatSchema.index({ user: 1, provider: 1 });
exports.ChatSchema.index({ order: 1 });
exports.ChatSchema.index({ lastMessageAt: -1 });
let Message = class Message {
    chat;
    senderType;
    senderId;
    content;
    type;
    mediaUrl;
    mediaType;
    location;
    isRead;
    readAt;
    isDeleted;
    deletedAt;
    metadata;
};
exports.Message = Message;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Chat', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Message.prototype, "chat", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Message.prototype, "senderType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Message.prototype, "senderId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Message.prototype, "content", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'text' }),
    __metadata("design:type", String)
], Message.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Message.prototype, "mediaUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Message.prototype, "mediaType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], Message.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Message.prototype, "isRead", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Message.prototype, "readAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Message.prototype, "isDeleted", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Message.prototype, "deletedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], Message.prototype, "metadata", void 0);
exports.Message = Message = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.__v;
                return ret;
            },
        },
    })
], Message);
exports.MessageSchema = mongoose_1.SchemaFactory.createForClass(Message);
exports.MessageSchema.index({ chat: 1, createdAt: -1 });
exports.MessageSchema.index({ senderId: 1 });
//# sourceMappingURL=chat.schema.js.map