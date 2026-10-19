export interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  errorCode?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
}

export interface CustomerContractDto {
  contractId: string;
  customerId: string;
  customerName?: string;
  location?: string;
  hospitalLevel?: string;
  maxDiscountPct?: number;
  rotationFlag?: string;
  poNumber?: string;
  creditLimit?: number;
  agreedAmount?: number;
  discount?: number;
  usedCredit?: number;
  startTerm?: string;
  endTerm?: string;
  effDate: string;
  termDate?: string | null;
  lastModifiedDate?: string;
  chapterId?: string;
  insertDate?: string;
  insertUser?: string;
  programId?: string;
}

export interface CustomerContractQueryDto {
  customerId: string;
  searchKeyword?: string | null;
  sortColumn?: string;
  sortOrder?: string;
}

export interface CreateCustomerContractRequestDto {
  creditLimit: number;
  effDate: string;
  hospitalLevel?: string | null;
  maxDiscountPct?: number | null;
  rotationFlag?: string | null;
  poNumber?: string | null;
  agreedAmount?: number | null;
  discount?: number | null;
  usedCredit?: number | null;
  startTerm?: string | null;
  endTerm?: string | null;
  termDate?: string | null;
}

export interface UpdateCustomerContractRequestDto {
  contractId: string;
  creditLimit: number;
  effDate: string;
  hospitalLevel?: string | null;
  maxDiscountPct?: number | null;
  rotationFlag?: string | null;
  poNumber?: string | null;
  agreedAmount?: number | null;
  discount?: number | null;
  usedCredit?: number | null;
  startTerm?: string | null;
  endTerm?: string | null;
  termDate?: string | null;
}
