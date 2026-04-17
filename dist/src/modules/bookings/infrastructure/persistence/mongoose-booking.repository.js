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
exports.MongooseBookingRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const booking_entity_1 = require("../../domain/entities/booking.entity");
const booking_schema_1 = require("./booking.schema");
const booking_status_enum_1 = require("../../domain/enums/booking-status.enum");
let MongooseBookingRepository = class MongooseBookingRepository {
    bookingModel;
    constructor(bookingModel) {
        this.bookingModel = bookingModel;
    }
    async create(booking) {
        const created = new this.bookingModel(booking);
        const saved = await created.save();
        return this.mapToDomain(saved);
    }
    async findById(id) {
        const doc = await this.bookingModel.findById(id).exec();
        return doc ? this.mapToDomain(doc) : null;
    }
    async findByBookingNumber(bookingNumber) {
        const doc = await this.bookingModel.findOne({ bookingNumber }).exec();
        return doc ? this.mapToDomain(doc) : null;
    }
    async findAll(filters = {}, options = {}) {
        const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
        const cleanedFilters = { ...filters };
        const [docs, total] = await Promise.all([
            this.bookingModel.find(cleanedFilters).sort(sort).skip(skip).limit(limit).exec(),
            this.bookingModel.countDocuments(cleanedFilters).exec(),
        ]);
        return {
            data: docs.map(doc => this.mapToDomain(doc)),
            total,
        };
    }
    async findNearby(longitude, latitude, maxDistanceInMeters) {
        const docs = await this.bookingModel.find({
            status: booking_status_enum_1.BookingStatus.PENDING,
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude],
                    },
                    $maxDistance: maxDistanceInMeters,
                },
            },
        }).exec();
        return docs.map(doc => this.mapToDomain(doc));
    }
    async findPendingOlderThan(date) {
        const docs = await this.bookingModel.find({
            status: booking_status_enum_1.BookingStatus.PENDING,
            createdAt: { $lt: date },
        }).exec();
        return docs.map(doc => this.mapToDomain(doc));
    }
    async getStats() {
        const stats = await this.bookingModel.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]);
        const total = stats.reduce((acc, curr) => acc + curr.count, 0);
        const formattedStats = stats.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});
        return {
            total,
            breakdown: formattedStats,
        };
    }
    async update(id, updates) {
        const doc = await this.bookingModel
            .findByIdAndUpdate(id, { $set: updates }, { new: true })
            .exec();
        return doc ? this.mapToDomain(doc) : null;
    }
    async updateStatus(id, status) {
        const updates = { status };
        const now = new Date();
        if (status === booking_status_enum_1.BookingStatus.IN_PROGRESS)
            updates.startedAt = now;
        if (status === booking_status_enum_1.BookingStatus.COMPLETED)
            updates.completedAt = now;
        const doc = await this.bookingModel
            .findByIdAndUpdate(id, { $set: updates }, { new: true })
            .exec();
        return doc ? this.mapToDomain(doc) : null;
    }
    async delete(id) {
        const result = await this.bookingModel.deleteOne({ _id: id }).exec();
        return result.deletedCount > 0;
    }
    mapToDomain(doc) {
        const obj = doc.toJSON();
        const domainObj = new booking_entity_1.Booking({
            ...obj,
            id: obj._id.toString(),
            user: obj.user.toString(),
            provider: obj.provider ? obj.provider.toString() : undefined,
            vehicle: obj.vehicle ? obj.vehicle.toString() : undefined,
            service: obj.service.toString(),
            review: obj.review ? obj.review.toString() : undefined,
        });
        return domainObj;
    }
};
exports.MongooseBookingRepository = MongooseBookingRepository;
exports.MongooseBookingRepository = MongooseBookingRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(booking_schema_1.BookingDocument.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], MongooseBookingRepository);
//# sourceMappingURL=mongoose-booking.repository.js.map