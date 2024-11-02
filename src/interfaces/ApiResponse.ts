export interface ApiResponse<T> {
    data: T | null;
    message: string;
    error: boolean;
    pagination?: {
        currentPage: number;
        itemsPerPage: number;
        totalItems: number;
        totalPages: number;
    };
}