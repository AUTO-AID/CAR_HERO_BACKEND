/**
 * Pagination Utilities
 * Helper functions for pagination
 */

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Get pagination parameters
 */
export const getPaginationParams = (
  options: PaginationOptions,
): { skip: number; limit: number } => {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 10));
  const skip = (page - 1) * limit;

  return { skip, limit };
};

/**
 * Create pagination result
 */
export const createPaginationResult = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginationResult<T> => {
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
