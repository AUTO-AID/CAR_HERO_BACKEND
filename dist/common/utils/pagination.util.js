"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaginationResult = exports.getPaginationParams = void 0;
const getPaginationParams = (options) => {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const skip = (page - 1) * limit;
    return { skip, limit };
};
exports.getPaginationParams = getPaginationParams;
const createPaginationResult = (data, total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };
};
exports.createPaginationResult = createPaginationResult;
//# sourceMappingURL=pagination.util.js.map