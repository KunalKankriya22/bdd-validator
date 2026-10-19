// API Response wrapper interface
export interface MobilePcLaptopRegisterApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: MobilePcLaptopRegisterRawData[];
  total: number;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

// Raw data interface matching API response
export interface MobilePcLaptopRegisterRawData {
  laptopId: string;
  ltTempId: string;
  chapterId: string;
  insertDate: string;
  insertUser: string;
  currentSeq: number;
  incrementBy: number;
  refreshDate: string;
  location: string;
  detail1: string;
  detail2: string;
  detail3: string;
  detail4: string;
}

// Mapped model used in component
export interface MobilePcLaptopRegisterModel {
  id?: number;
  chapter?: string;
  chapterId?: string;
  laptopId?: string;
  temporaryId?: string;
  currentSequence?: number;
  auditIncrement?: number;
  refreshDate?: Date;
  location?: string;
  detail1?: string;
  detail2?: string;
  detail3?: string;
  detail4?: string;
  createdBy?: string;
  createdDate?: Date;
  modifiedBy?: string;
  modifiedDate?: Date;
}

export interface MobilePcLaptopRegisterParamsDto {
  searchKeyword?: string;
  chapterId?: string;
  refreshDatePeriod?: string;
  refreshDate?: string;
  sort?: 'A' | 'D';
}

export interface MobilePcLaptopRegisterFilterValue {
  chapter?: string;
  period?: string;
  refreshDate?: Date;
}

// DTO matching API request body for POST (Add)
export interface MobilePcLaptopRegisterDto {
  laptopId: string;
  ltTempId: string;
  chapterId: string;
  currentSeq: number;
  incrementBy: number | null;
  refreshDate: string;
  location: string;
  detail1: string;
  detail2: string;
  detail3: string;
  detail4: string;
}

// DTO matching API request body for PUT (Update)
export interface UpdateMobilePcLaptopRegisterDto {
  OldLaptopId: string;   // original laptop ID to identify record
  OldChapterId: string;  // original chapter ID to identify record
  newLaptopId: string;   // new laptop ID value
  ltTempId: string;
  chapterId: string;
  currentSeq: number;
  incrementBy: number | null;
  refreshDate: string;
  location: string;
  detail1: string;
  detail2: string;
  detail3: string;
  detail4: string;
}

export interface ChapterLookup {
  chapterId: string;
  chapterName: string;
}
