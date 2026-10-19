/**
 * User Account interface for user administration
 */
export interface UserAccount {
    userId: string;
    name: string;
    userClass: string;
    labCode: string;
    effectiveDate: string;
    terminationDate?: string;
    isActive?: boolean;
    email?: string;
}

/**
 * Pagination interface
 */
export interface PaginationState {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}
