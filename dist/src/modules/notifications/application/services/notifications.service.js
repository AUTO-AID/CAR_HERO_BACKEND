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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationsService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const schedule_1 = require("@nestjs/schedule");
const notification_schema_1 = require("../infrastructure/persistence/mongoose/schemas/notification.schema");
const status_enum_1 = require("../../../../core/enums/status.enum");
const notifications_gateway_1 = require("./notifications.gateway");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    notificationModel;
    gateway;
    bookingRepository;
    logger = new common_1.Logger(NotificationsService_1.name);
    constructor(notificationModel, gateway, bookingRepository) {
        this.notificationModel = notificationModel;
        this.gateway = gateway;
        this.bookingRepository = bookingRepository;
    }
    async createNotification(dto) {
        const notification = await this.notificationModel.create({
            recipientId: new mongoose_2.Types.ObjectId(dto.recipientId),
            recipientType: dto.recipientType,
            title: dto.title,
            body: dto.body,
            type: dto.type,
            data: dto.data || {},
        });
        this.gateway.sendToUser(dto.recipientId, notification);
        const unreadCount = await this.getUnreadCount(dto.recipientId);
        this.gateway.emitUnreadCount(dto.recipientId, unreadCount);
        this.logger.log(`Notification created and sent to user ${dto.recipientId}`);
        return notification;
    }
    async getNotifications(recipientId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [notifications, total] = await Promise.all([
            this.notificationModel
                .find({ recipientId: new mongoose_2.Types.ObjectId(recipientId) })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            this.notificationModel.countDocuments({ recipientId: new mongoose_2.Types.ObjectId(recipientId) }).exec(),
        ]);
        return {
            notifications,
            total,
            page,
            limit,
        };
    }
    async getUnreadCount(recipientId) {
        return this.notificationModel
            .countDocuments({ recipientId: new mongoose_2.Types.ObjectId(recipientId), isRead: false })
            .exec();
    }
    async markAsRead(id, userId) {
        const notification = await this.notificationModel.findOneAndUpdate({ _id: new mongoose_2.Types.ObjectId(id), recipientId: new mongoose_2.Types.ObjectId(userId) }, { isRead: true, readAt: new Date() }, { new: true }).exec();
        if (notification) {
            const unreadCount = await this.getUnreadCount(userId);
            this.gateway.emitUnreadCount(userId, unreadCount);
        }
        return notification;
    }
    async markAllAsRead(recipientId) {
        await this.notificationModel.updateMany({ recipientId: new mongoose_2.Types.ObjectId(recipientId), isRead: false }, { isRead: true, readAt: new Date() });
        this.gateway.emitUnreadCount(recipientId, 0);
    }
    async handleBookingReminders() {
        this.logger.log('Checking for upcoming booking reminders...');
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        const fortyFiveMinsFromNow = new Date(now.getTime() + 45 * 60 * 1000);
        const upcomingBookings = await this.bookingRepository.findAll({
            status: 'confirmed',
            scheduledDate: { $gte: fortyFiveMinsFromNow, $lte: oneHourFromNow }
        });
        for (const booking of upcomingBookings.data) {
            const b = booking;
            await this.createNotification({
                recipientId: b.user,
                recipientType: 'user',
                title: 'Booking Reminder 🚗',
                body: `Your booking ${b.bookingNumber} for ${b.serviceName} is starting in about an hour.`,
                type: status_enum_1.NotificationType.REMINDER,
                data: { bookingId: b.id, bookingNumber: b.bookingNumber, type: 'booking' }
            });
            if (b.provider) {
                await this.createNotification({
                    recipientId: b.provider,
                    recipientType: 'provider',
                    title: 'Upcoming Service Reminder 🛠️',
                    body: `You have a service appointment ${b.bookingNumber} in one hour.`,
                    type: status_enum_1.NotificationType.REMINDER,
                    data: { bookingId: b.id, bookingNumber: b.bookingNumber, type: 'booking' }
                });
            }
        }
    }
};
exports.NotificationsService = NotificationsService;
__decorate([
    (0, schedule_1.Cron)('0 */15 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "handleBookingReminders", null);
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(notification_schema_1.Notification.name)),
    __param(2, (0, common_1.Inject)('IBookingRepository')),
    __metadata("design:paramtypes", [mongoose_2.Model, typeof (_a = typeof notifications_gateway_1.NotificationsGateway !== "undefined" && notifications_gateway_1.NotificationsGateway) === "function" ? _a : Object, Object])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map