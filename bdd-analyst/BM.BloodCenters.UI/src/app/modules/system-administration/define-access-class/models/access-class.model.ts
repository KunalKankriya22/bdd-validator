export interface AttachedUser {
    userId: string;
    name: string;
    level: number;
    effectiveDate: string;
    terminationDate: string;
}

export interface AttachedUsersResponse {
    items?: AttachedUser[];
    data?: AttachedUser[];
}
