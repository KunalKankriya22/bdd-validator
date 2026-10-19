export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface DonorLookupDto {
  donorId: string;
  donorName: string;
  displayValue: string;
}

export interface TieTagDto {
  interdictionCode: string;
  tieTagText: string;
  numberOfLabel: number;
}

export interface PrintInstructionDto {
  sequence: number;
  printInstruction: string;
}

export interface PrinterDto {
  code: string;
  description?: string;
}

export interface PrintTieTagsRequestDto {
  donorId: string;
  interdictionCode?: string;
  numberOfLabels: number;
  printer: string;
}
