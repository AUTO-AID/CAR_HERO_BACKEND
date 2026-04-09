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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongooseOrderRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const order_entity_1 = require("../../domain/entities/order.entity");
const order_schema_1 = require("../../../../database/schemas/order.schema");
const status_enum_1 = require("../../../../common/enums/status.enum");
let MongooseOrderRepository = class MongooseOrderRepository {
    orderModel;
    constructor(orderModel) {
        this.orderModel = orderModel;
    }
    mapToEntity(doc) {
        return new order_entity_1.OrderEntity(doc._id.toString(), doc.orderNumber, doc.user.toString(), doc.service.toString(), doc.status, doc.total, { type: doc.userLocation.type, coordinates: doc.userLocation.coordinates }, doc.provider?.toString(), doc.vehicle?.toString(), doc.serviceName, doc.servicePrice, doc.scheduledAt, doc.isScheduled, doc.paymentStatus, doc.paymentMethod, doc.userNotes, doc.createdAt, doc.updatedAt);
    }
    async create(order) {
        const created = new this.orderModel({
            ...order,
            user: order.userId,
            service: order.serviceId,
            provider: order.providerId,
            vehicle: order.vehicleId,
        });
        const doc = await created.save();
        return this.mapToEntity(doc);
    }
    async findById(id) {
        const doc = await this.orderModel.findById(id).exec();
        return doc ? this.mapToEntity(doc) : null;
    }
    async findByOrderNumber(orderNumber) {
        const doc = await this.orderModel.findOne({ orderNumber }).exec();
        return doc ? this.mapToEntity(doc) : null;
    }
    async findByCriteria(criteria, pagination) {
        const skip = (pagination.page - 1) * pagination.limit;
        const [docs, total] = await Promise.all([
            this.orderModel.find(criteria)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pagination.limit)
                .exec(),
            this.orderModel.countDocuments(criteria),
        ]);
        return {
            orders: docs.map(doc => this.mapToEntity(doc)),
            total,
        };
    }
    async update(id, data) {
        const doc = await this.orderModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
        if (!doc)
            throw new Error('Order not found');
        return this.mapToEntity(doc);
    }
    async delete(id) {
        const result = await this.orderModel.findByIdAndDelete(id).exec();
        return !!result;
    }
    async search(query) {
        const searchRegex = new RegExp(query, 'i');
        const docs = await this.orderModel.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $lookup: {
                    from: 'providers',
                    localField: 'provider',
                    foreignField: '_id',
                    as: 'providerDetails'
                }
            },
            {
                $match: {
                    $or: [
                        { orderNumber: searchRegex },
                        { serviceName: searchRegex },
                        { 'userDetails.fullName': searchRegex },
                        { 'providerDetails.businessName': searchRegex }
                    ]
                }
            },
            { $limit: 50 },
            { $sort: { createdAt: -1 } }
        ]).exec();
        return docs.map(doc => this.mapToEntity({ ...doc, _id: doc._id }));
    }
    async getStats(period) {
        const stats = await this.orderModel.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$total' }
                }
            }
        ]).exec();
        const result = stats.reduce((acc, curr) => {
            acc[curr._id] = { count: curr.count, revenue: curr.totalRevenue };
            return acc;
        }, {});
        return result;
    }
    async findByDateRange(from, to, status) {
        const query = {
            createdAt: { $gte: from, $lte: to }
        };
        if (status)
            query.status = status;
        const docs = await this.orderModel.find(query).sort({ createdAt: 1 }).exec();
        return docs.map(doc => this.mapToEntity(doc));
    }
    async addReview(id, rating, comment) {
        const doc = await this.orderModel.findByIdAndUpdate(id, {
            $set: {
                rating,
                'metadata.reviewComment': comment
            }
        }, { new: true }).exec();
        if (!doc)
            throw new Error('Order not found');
        return this.mapToEntity(doc);
    }
    async updateProviderLocation(id, coordinates) {
        const doc = await this.orderModel.findByIdAndUpdate(id, {
            $set: {
                providerLocation: {
                    type: 'Point',
                    coordinates: coordinates
                }
            }
        }, { new: true }).exec();
        if (!doc)
            throw new Error('Order not found');
        return this.mapToEntity(doc);
    }
    async updatePaymentDetails(id, paymentId, paymentMethod) {
        const doc = await this.orderModel.findByIdAndUpdate(id, {
            $set: {
                paymentId,
                paymentMethod: paymentMethod || 'online',
                paymentStatus: status_enum_1.PaymentStatus.COMPLETED
            }
        }, { new: true }).exec();
        if (!doc)
            throw new Error('Order not found');
        return this.mapToEntity(doc);
    }
    async cancelOrder(id, reason, cancelledBy) {
        const doc = await this.orderModel.findByIdAndUpdate(id, {
            $set: {
                status: status_enum_1.OrderStatus.CANCELLED,
                cancelledAt: new Date(),
                cancellationReason: reason,
                cancelledBy: cancelledBy || 'user'
            }
        }, { new: true }).exec();
        if (!doc)
            throw new Error('Order not found');
        return this.mapToEntity(doc);
    }
    async findExpiredPendingOrders(hours) {
        const expirationDate = new Date();
        expirationDate.setHours(expirationDate.getHours() - hours);
        const docs = await this.orderModel.find({
            status: status_enum_1.OrderStatus.PENDING,
            createdAt: { $lt: expirationDate }
        }).exec();
        return docs.map(doc => this.mapToEntity(doc));
    }
};
exports.MongooseOrderRepository = MongooseOrderRepository;
exports.MongooseOrderRepository = MongooseOrderRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], MongooseOrderRepository);
//# sourceMappingURL=mongoose-order.repository.js.map