/**
 * TypeScript models for Q&A Library
 * Maps to backend DTOs from DonorSurveyManagerController
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

/** Gender enum mapping (Frontend ↔ Backend) */
export const GENDER_MAP = {
  'ALL': 'A',
  'MALE': 'M',
  'FEMALE': 'F'
} as const;

export const GENDER_REVERSE_MAP = {
  'A': 'ALL',
  'M': 'MALE',
  'F': 'FEMALE'
} as const;

/** Response Type enum mapping (Frontend ↔ Backend) */
export const RESPONSE_TYPE_MAP = {
  'Single': 'S',
  'Multiple': 'M',
  'Comment': 'C',
  'Ranking': 'R'
} as const;

export const RESPONSE_TYPE_REVERSE_MAP = {
  'S': 'Single',
  'M': 'Multiple',
  'C': 'Comment',
  'R': 'Ranking'
} as const;

export type GenderFrontend = 'ALL' | 'MALE' | 'FEMALE' | '';  // Empty string for initial state
export type GenderBackend = 'A' | 'M' | 'F';
export type ResponseTypeFrontend = 'Single' | 'Multiple' | 'Comment' | 'Ranking' | '';  // Empty string for optional field
export type ResponseTypeBackend = 'S' | 'M' | 'C' | 'R';

// ============================================================================
// BACKEND DTOs (from API)
// ============================================================================

/**
 * GET /donor-survey-manager/questions
 * Response DTO for question list
 */
export interface SurveyQuestionResponseDto {
  chapterId: string;
  questionCode: string;
  questionDesc: string;
  typeOfSurvey?: string | null;
  gender: GenderBackend;
  responseType: ResponseTypeBackend;
  effDate: string;  // ISO date string
  termDate?: string | null;  // ISO date string
  isEditable: number;  // 0 = not editable, 1 = editable
}

/**
 * POST /donor-survey-manager/questions
 * Request DTO for creating question
 */
export interface CreateSurveyQuestionDto {
  questionCode: string;
  questionDesc: string;
  typeOfSurvey?: string | null;
  gender: GenderBackend;
  responseType: ResponseTypeBackend;
  effDate: string;  // ISO date string
  termDate?: string | null;  // ISO date string
}

/**
 * PUT /donor-survey-manager/questions/{questionCode}
 * Request DTO for updating question
 */
export interface UpdateSurveyQuestionDto {
  questionDesc: string;
  gender: GenderBackend;
  responseType: ResponseTypeBackend;
  effDate: string;  // ISO date string
  termDate?: string | null;  // ISO date string
}

/**
 * GET /donor-survey-manager/questions/{questionCode}/answers
 * Response DTO for answer list
 */
export interface SurveyAnswerResponseDto {
  chapterId: string;
  questionCode: string;
  answerCode: string;
  answerDesc: string;
  displaySeq?: number | null;
  effDate: string;  // ISO date string
  termDate?: string | null;  // ISO date string
  isEditable: number;  // 0 = not editable, 1 = editable
}

/**
 * PUT /donor-survey-manager/questions/{questionCode}/answers
 * Request DTO for saving answers (batch)
 */
export interface SaveSurveyAnswerDto {
  answerCode: string;
  answerDesc: string;
  displaySeq: number;
  effDate: string;  // ISO date string
  termDate?: string | null;  // ISO date string
}

// ============================================================================
// FRONTEND MODELS (used in components)
// ============================================================================

/**
 * Question model used in frontend components
 */
export interface Question {
  questionCode: string;
  questionText: string;
  sex: GenderFrontend;
  responseType: ResponseTypeFrontend;
  effectiveDate: Date | null;
  terminationDate: Date | null;
  answerOptions?: Answer[];
  commentConfig?: CommentConfig | null;
  isEditable: boolean;
}

/**
 * Answer model used in frontend components
 */
export interface Answer {
  sequence: number;
  answerCode: string;
  answerCodeDescription: string;
  effectiveDate: Date | null;
  terminationDate: Date | null;
  auditKey: number;  // 0 = new (not saved), >0 = existing (saved)
  isEditable: boolean;  // true = can edit/delete, false = locked (used in donor responses)
  errors?: { [key: string]: string };
}

/**
 * Comment configuration (UI-only, not persisted to backend)
 */
export interface CommentConfig {
  characterLimit: number;
  answerCode: string;
  answerDesc: string;
  effectiveDate: Date | null;
  terminationDate: Date | null;
}

/**
 * Save event emitted from detail form
 * Includes change flags for conditional API calls
 */
export interface QuestionSaveEvent {
  question: Question;
  questionChanged: boolean;  // True if question fields changed (EDIT mode only)
  answersChanged: boolean;   // True if answers added/deleted/edited (EDIT mode only)
}

/**
 * Filter values (client-side filtering only)
 */
export interface QaLibraryFilters {
  sex?: GenderFrontend | null;
  responseType?: ResponseTypeFrontend | null;
  effectiveDatePeriod?: 'After' | 'Before' | null;
  effectiveDate?: Date | null;
  terminationDatePeriod?: 'After' | 'Before' | null;
  terminationDate?: Date | null;
}
