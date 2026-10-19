/**
 * Survey Question Models and Interfaces
 * For Q&A Library and Template Question assignment
 */

/**
 * Survey Question Model (from Q&A Library)
 */
export interface SurveyQuestionModel {
  questionId: string;
  description: string;
  sex?: 'Male' | 'Female' | 'All' | 'M' | 'F' | 'A' | null;
  parentQuestionId?: string | null;
  parentQuestionAnswer?: string | null;
  flag?: string | null;
  chapterId: string;
  responseType?: string;
  isActive?: boolean;
  lastModified?: string;
  termDate?: string;
}

/**
 * Template Question Model (assigned to a template)
 */
export interface TemplateQuestionModel {
  sequence: number;
  questionId: string;
  description: string;
  sex?: 'Male' | 'Female' | 'All' | 'M' | 'F' | 'A' | null;
  parentQuestionId?: string | null;
  parentQuestionAnswer?: string | null;
  flag?: string | null;
}

/**
 * DTO for assigning questions to template
 */
export interface AssignQuestionsDto {
  templateId: string;
  chapterId: string;
  questions: {
    questionId: string;
    sequence: number;
    sex?: string | null;
    parentQuestionId?: string | null;
    flag?: string | null;
  }[];
}

/**
 * DTO for updating question sequence
 */
export interface UpdateQuestionSequenceDto {
  templateId: string;
  chapterId: string;
  sequences: {
    questionId: string;
    sequence: number;
  }[];
}

/**
 * Filter options for questions
 */
export interface QuestionFilterOptions {
  searchKeyword?: string;
  sex?: string[];
  hasParent?: boolean;
}

/**
 * Parent Question Option (for dropdown)
 */
export interface ParentQuestionOption {
  questionId: string;
  description: string;
}

/**
 * Question Answer Model (from API)
 */
export interface QuestionAnswerModel {
  chapterId: string;
  questionCode: string;
  answerCode: string;
  answerDesc: string;
  displaySeq: number;
  effDate: string;
  isEditable: number;
}
