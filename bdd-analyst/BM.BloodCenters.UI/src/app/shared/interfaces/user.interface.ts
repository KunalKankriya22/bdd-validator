export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName?: string;
    roles: string[];
    permissions: string[];
    isActive: boolean;
    lastLogin?: Date;
}

export interface AuthToken {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
}

