export interface Donor {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    bloodType: BloodType;
    dateOfBirth: Date;
    address?: Address;
    lastDonationDate?: Date;
    totalDonations: number;
    eligibleToDonate: boolean;
}

export enum BloodType {
    APositive = 'A+',
    ANegative = 'A-',
    BPositive = 'B+',
    BNegative = 'B-',
    OPositive = 'O+',
    ONegative = 'O-',
    ABPositive = 'AB+',
    ABNegative = 'AB-'
}

export interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export interface ApiResponse<T> {
    data: T;
    message: string;
    success: boolean;
    errors?: string[];
}

export interface PaginatedResponse<T> {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
