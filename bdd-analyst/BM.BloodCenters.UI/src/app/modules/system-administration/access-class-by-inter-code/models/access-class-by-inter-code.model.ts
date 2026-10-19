export interface AccessClass {
  class: string;
  description: string;
  insUser: string;
  insDate: string;
}

export interface AccessClassUser {
  userId: string;
  name: string;
  level: string;
}

export interface AccessClassInterdiction {
  accessClass: string;
  accessClassDescription: string;
  code: string;
  type: string;
  description: string;
  level: string;
  insertDate: string;
}

export interface AccessClassSearchParams {
  interCode?: string;
  take?: number;
  skip?: number;
  sortOrder?: string;
  sortColumn?: string;
}

export interface AccessClassResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: AccessClass[];
  total: number;
}

export interface AccessClassUsersResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: AccessClassUser[];
}

export interface AccessClassInterdictionsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: AccessClassInterdiction[];
}

export interface InterdictionCodeInfo {
  code: string;
  description: string;
  level: string;
}

export interface InterdictionCodeLov {
  interCode: string;
  viewLevel: number | null;
  interDesc: string;
}
