export interface SpecialInstructionDropdownItem {
  specialInstruction: string;
  description: string;
}

export interface SpecialInstructionLine {
  lineNumber: number;
  lineText: string;
}

export interface SpecialInstructionsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: SpecialInstructionLine[];
  total: number;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

export interface SaveSpecialInstructionsRequest {
  labelCode: string;
  lines: { lineNumber: number; lineText: string }[];
}

export interface SpecialInstructionRow {
  lineNumber: number;
  lineText: string;
  isNew?: boolean;
  isDirty?: boolean;
  originalLineText?: string;
}
