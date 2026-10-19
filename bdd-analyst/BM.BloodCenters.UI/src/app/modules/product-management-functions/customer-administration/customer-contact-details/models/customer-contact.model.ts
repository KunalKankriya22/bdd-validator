export interface CustomerContactDto {
  customerId: string;
  chapterId?: string;
  instId?: string;
  customerName?: string;
  contactType?: string;
  contactTypeDesc?: string;
  firstName?: string;
  lastName?: string;
  salutation?: string;
  title?: string;
  dayPhoneNo?: string;
  nightPhoneNo?: string;
  faxNo?: string;
  telexNo?: string | null;
  effDate: string;
  termDate?: string | null;
  lastModifiedDate?: string;
}

export interface CreateCustomerContactRequestDto {
  customerId: string;
  contactType: string;
  firstName: string;
  lastName: string;
  dayPhoneNo: string;
  effDate: string;
  salutation?: string | null;
  title?: string | null;
  nightPhoneNo?: string | null;
  faxNo?: string | null;
  termDate?: string | null;
}

export interface UpdateCustomerContactRequestDto {
  instId: string;
  newContactType?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  salutation?: string | null;
  title?: string | null;
  dayPhoneNo?: string | null;
  nightPhoneNo?: string | null;
  faxNo?: string | null;
  effDate: string;
  termDate?: string | null;
}

export interface ContactTypeDto {
  code: string;
  description: string;
}

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
