export interface AccessClass {
    type: string;
    code: string;
    description: string;
    effectiveDate: string;
    terminationDate: string;
    status: 'Active' | 'Inactive';
}

export interface AttachedUser {
    userId: string;
    name?: string;
    level: number;
}

export interface BreadcrumbItem {
    label: string;
    url?: string;
    active?: boolean;
}