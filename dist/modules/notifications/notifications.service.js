"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const admin = __importStar(require("firebase-admin"));
const notification_schema_1 = require("../../database/schemas/notification.schema");
const status_enum_1 = require("../../common/enums/status.enum");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    notificationModel;
    configService;
    logger = new common_1.Logger(NotificationsService_1.name);
    firebaseInitialized = false;
    constructor(notificationModel, configService) {
        this.notificationModel = notificationModel;
        this.configService = configService;
    }
    async onModuleInit() {
        await this.initializeFirebase();
    }
    async initializeFirebase() {
        try {
            const projectId = this.configService.get('firebase.projectId');
            const privateKey = this.configService.get('firebase.privateKey');
            const clientEmail = this.configService.get('firebase.clientEmail');
            if (projectId && privateKey && clientEmail) {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId,
                        privateKey,
                        clientEmail,
                    }),
                });
                this.firebaseInitialized = true;
                this.logger.log('Firebase Admin SDK initialized');
            }
            else {
                this.logger.warn('Firebase credentials not configured');
            }
        }
        catch (error) {
            this.logger.error('Failed to initialize Firebase', error);
        }
    }
    async send(dto, fcmToken) {
        const notification = await this.notificationModel.create({
            recipientId: dto.recipientId,
            recipientType: dto.recipientType,
            title: dto.title,
            body: dto.body,
            type: dto.type || status_enum_1.NotificationType.SYSTEM,
            data: dto.data,
            imageUrl: dto.imageUrl,
            referenceType: dto.referenceType,
            referenceId: dto.referenceId,
        });
        if (fcmToken && this.firebaseInitialized) {
            try {
                await admin.messaging().send({
                    token: fcmToken,
                    notification: {
                        title: dto.title,
                        body: dto.body,
                        imageUrl: dto.imageUrl,
                    },
                    data: dto.data
                        ? Object.fromEntries(Object.entries(dto.data).map(([k, v]) => [k, String(v)]))
                        : undefined,
                    android: {
                        priority: 'high',
                        notification: {
                            channelId: 'default',
                            priority: 'high',
                        },
                    },
                    apns: {
                        payload: {
                            aps: {
                                sound: 'default',
                                badge: 1,
                            },
                        },
                    },
                });
                notification.isPushSent = true;
                notification.pushSentAt = new Date();
                await notification.save();
                this.logger.log(`Push notification sent to ${dto.recipientId}`);
            }
            catch (error) {
                notification.pushError = error.message;
                await notification.save();
                this.logger.error(`Failed to send push notification: ${error.message}`);
            }
        }
        return notification;
    }
    async getNotifications(recipientId, recipientType, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [notifications, total] = await Promise.all([
            this.notificationModel
                .find({ recipientId, recipientType })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.notificationModel.countDocuments({ recipientId, recipientType }).exec(),
        ]);
        const unreadCount = await this.notificationModel
            .countDocuments({ recipientId, recipientType, isRead: false })
            .exec();
        return {
            notifications,
            total,
            page,
            limit,
            unreadCount,
        };
    }
    async markAsRead(id) {
        return this.notificationModel
            .findByIdAndUpdate(id, { isRead: true, readAt: new Date() }, { new: true })
            .exec();
    }
    async markAllAsRead(recipientId, recipientType) {
        await this.notificationModel.updateMany({ recipientId, recipientType, isRead: false }, { isRead: true, readAt: new Date() });
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(notification_schema_1.Notification.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        config_1.ConfigService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map