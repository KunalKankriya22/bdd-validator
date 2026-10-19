/**
 * Error messages for Report Parameter Code validation.
 * Based on RMREPCD form specifications.
 */
export const REPORT_PARAMETER_ERROR_MESSAGES = {
  // Form initialization errors
  APPLICATION_SYSTEM_NOT_SELECTED: 'Err: Application System not selected.',

  // PARM_CODE validation errors
  DUPLICATE_PARAMETER_CODE: 'Err: Duplicate record for code : {0}',
  PARAMETER_CODE_REQUIRED: 'Parameter code is required',
  PARAMETER_CODE_MAX_LENGTH: 'Parameter code cannot exceed 5 characters',
  PARAMETER_CODE_UPPERCASE: 'Parameter code must be uppercase alphanumeric',

  // CODE_TYPE validation errors
  INVALID_CODE_TYPE: 'Err: Invalid code type',
  PARAMETER_TYPE_REQUIRED: 'Parameter Type is required',

  // DESCRIPTION validation
  DESCRIPTION_REQUIRED: 'Description is required',
  DESCRIPTION_MAX_LENGTH: 'Description cannot exceed 30 characters',

  // PROMPT validation
  PROMPT_REQUIRED: 'Prompt is required',
  PROMPT_MAX_LENGTH: 'Prompt cannot exceed 40 characters',

  // REF_TABLE validation warnings
  TABLE_DOES_NOT_EXIST: 'Warn: Table {0} does not exist',

  // REF_COLUMN validation errors
  TABLE_NAME_NOT_ENTERED: 'Err: Table name not entered',
  COLUMN_DOES_NOT_EXIST: 'Warn: Column {0} does not exist',
  REF_COLUMN_MAX_LENGTH: 'Reference Column cannot exceed 30 characters',

  // REF_TABLE validation
  REF_TABLE_MAX_LENGTH: 'Reference Table cannot exceed 30 characters',

  // Other field validations
  DEFAULT_VALUE_MAX_LENGTH: 'Default Value cannot exceed 15 characters',
  LIST_FORM_NAME_MAX_LENGTH: 'List Form Name cannot exceed 8 characters',

  // Delete validation errors
  CANNOT_DELETE_REFERENCED_BY_REPORTS: 'Err: Can not delete as referenced by reports',

  // General messages
  OPERATION_SUCCESSFUL: 'Operation completed successfully',
  OPERATION_FAILED: 'Operation failed. Please try again.',
  DELETE_CONFIRM_TITLE: 'Confirm Delete',
  DELETE_CONFIRM_MESSAGE: 'Are you sure you want to delete parameter code "{0}"?',
  DELETE_SUCCESS: 'Parameter code "{0}" deleted successfully',
  DELETE_FAILED: 'Failed to delete parameter code',
  CREATE_SUCCESS: 'Parameter with code {0} has been created successfully.',
  UPDATE_SUCCESS: 'Parameter with code {0} has been updated successfully',
  VALIDATION_FAILED: 'Please fix validation errors before saving'
} as const;

/**
 * Valid CODE_TYPE values based on RMREPCD specifications
 */
export const VALID_CODE_TYPES = ['CHAR', 'NUMBER', 'DATE', 'DATETM', 'ODATE'] as const;

export type ValidCodeType = typeof VALID_CODE_TYPES[number];
