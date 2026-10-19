export interface ValidateUnitResponseDto {
  unitId: string;
  collDate: string;
  chapterId: string;
  isValid: boolean;
}

export interface AboLabelOverrideRecord {
  unitId: string;
  productCode: string;
  componentPrefix: string;
  productDescription: string;
  overrideDats: string;
  overrideDatsLocal: string;
  oldLabelDecision: string;
  oldLabelDescription: string;
  newLabelDecision: string;
  newLabelDescription: string;
  overrideCode: string;
  overrideCodeDescription: string;
  overrideUserId: string;
  collDate: string;
  chapterId: string;
  commentNoteId: number;
  noteText: string;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  total: number;
}
