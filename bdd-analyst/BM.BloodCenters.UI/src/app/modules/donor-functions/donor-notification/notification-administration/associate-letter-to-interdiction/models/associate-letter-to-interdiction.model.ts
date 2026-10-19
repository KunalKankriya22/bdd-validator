export interface AssociateLetterToInterdictionModel {
  interCode?: string;
  interDesc?: string;
  donationType?: string;
  donationDesc?: string;
  letterId?: string;
  effDate?: string | Date | null;
  termDate?: string | Date | null;
  insertDate?: string | Date | null;
  insertUser?: string;
  chapterId?: string;
  programId?: string;
}

export interface AssociateLetterToInterdictionSearchRequest {
  take?: number;
  skip?: number;
  interCode?: string | null;
  donationType?: string | null;
  letterId?: string | null;
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: 'ASC' | 'DESC' | null;
}

export interface AssociateLetterToInterdictionFilterRequest {
  interCode?: string | null;
  donationType?: string | null;
  letterId?: string | null;
}

export interface AssociateLetterToInterdictionFilterValue {
  interCode: string | null;
  donationType: string | null;
  letterId: string | null;
}

export interface CreateAssociateLetterToInterdictionDto {
  interCode: string;
  donationType: string;
  letterId: string;
  effDate: string;
  termDate?: string;
}

export interface UpdateAssociateLetterToInterdictionDto {
  effDate: string;
  termDate?: string;
}

export interface InterdictionDropdown {
  interCode: string;
  interDesc: string;
}

export interface DonationTypeDropdown {
  donationType: string;
  description: string;
}

export interface LetterDropdown {
  letterCode: string;
  letterId: string;
  letterTitle: string;
}

export interface FilterLetterDropdown {
  letterId: string;
  letterTitle: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  total?: number;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    errorMessage?: string;
    error?: string;
  };
}
