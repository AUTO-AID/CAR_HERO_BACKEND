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
exports.ChatSchema = exports.Chat = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Message = class Message {
    senderId;
    content;
    type;
    sentAt;
    isRead;
    attachmentUrl;
};
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Message.prototype, "senderId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Message.prototype, "content", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['text', 'image', 'location', 'voice'], default: 'text' }),
    __metadata("design:type", String)
], Message.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], Message.prototype, "sentAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Message.prototype, "isRead", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Message.prototype, "attachmentUrl", void 0);
Message = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], Message);
let Chat = class Chat {
    orderId;
    participants;
    messages;
    isActive;
    lastMessageAt;
};
exports.Chat = Chat;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Order', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Chat.prototype, "orderId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: mongoose_2.Types.ObjectId }], required: true }),
    __metadata("design:type", Array)
], Chat.prototype, "participants", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Message], default: [] }),
    __metadata("design:type", Array)
], Chat.prototype, "messages", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Chat.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Chat.prototype, "lastMessageAt", void 0);
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
exports.ChatSchema.index({ orderId: 1 });
exports.ChatSchema.index({ participants: 1 });
exports.ChatSchema.index({ lastMessageAt: -1 });
//# sourceMappingURL=chat.schema.js.map