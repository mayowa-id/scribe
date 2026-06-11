import { PaginatedResultDto } from '../infra/pagination/paginated-result.dto';

export class PaginationUtil {
  static paginate<T>(data: T[], total: number, page: number, limit: number): PaginatedResultDto<T> {
    return {
      data,
      total,
      page,
      limit,
    };
  }

  static getSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }
}
