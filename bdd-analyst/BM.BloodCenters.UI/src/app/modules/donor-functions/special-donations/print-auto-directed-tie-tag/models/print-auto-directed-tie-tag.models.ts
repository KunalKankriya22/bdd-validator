/**
 * Print Auto/Directed Tie Tag Models
 * Mnemonic: ADTT | Program ID: SDIADTAG
 */

export interface TieTagSearchCriteriaDto {
  patientId?: string;
  lastName?: string;
  firstName?: string;
  dateOfBirth?: string;
  surgeryId?: string;
  surgeryDate?: string;
  searchMode?: string;
}

export interface PatientSearchResultDto {
  patientId: string;
  chapterId: string;
  lastName: string;
  firstName: string | null;
  dateOfBirth: string | null;
  surgeryId: string | null;
  surgeryDate: string | null;
}

export interface TieTagDetailsDto {
  patientId: string;
  patientName: string;
  sex: string | null;
  dateOfBirth: string | null;
  patientType: string | null;
  patientTypeDescription: string | null;
  surgeryId: string;
  surgeryDate: string | null;
  surgeryType: string | null;
  surgeryDescription: string | null;
  physicianId: string | null;
  physicianName: string | null;
  hospitalId: string | null;
  hospitalName: string | null;
  dateNeededBy: string | null;
  unitsRequired: string | null;
  comments: string | null;
  chapterId: string;
}

export interface TieTagDonationDto {
  donorId: string;
  donorName: string;
  phoneNumber: string | null;
  unitId: string;
  checkDigit: string | null;
  collectionDate: string | null;
  product1: string | null;
  print1: string;
  copies1: number;
  product2: string | null;
  print2: string;
  copies2: number;
  product3: string | null;
  print3: string;
  copies3: number;
  seqNo: string | null;
  chapterId: string | null;
}

export interface PatientTypeDto {
  code: string;
  description: string;
  sortSequence2: number;
  sortSequence3: number;
}

export interface AttributeCodeDto {
  code: string;
  codeDescription: string | null;
}

export interface PrinterDto {
  code: string;
  description: string | null;
}

export interface IrradiationPromptDto {
  irradiationPrompt: string;
}

export interface TieTagPrintRequestDto {
  patientId: string;
  surgeryId: string;
  surgeryDate: string;
  dateNeededBy: string | null;
  hospitalId: string;
  printer: string;
  donations: TieTagPrintDonationDto[];
}

export interface TieTagPrintDonationDto {
  seqNo: string;
  unitId: string | null;
  chapterId: string;
  donType: string;
  product1: string | null;
  print1: boolean;
  copies1: number;
  product2: string | null;
  print2: boolean;
  copies2: number;
  product3: string | null;
  print3: boolean;
  copies3: number;
  attributes: Record<string, string> | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
}

export interface DonationWarningDto {
  warningCode: string;
  message: string;
}

export interface DonationsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: TieTagDonationDto[];
  warnings: DonationWarningDto[];
}
