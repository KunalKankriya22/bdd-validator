/**
 * Error codes for Component Delete validation
 * Maps to VALID_ERRORS_LAB table error codes
 */
export const ComponentDeleteErrorCodes = {
  /** Unit ID not found or invalid format */
  UNIT_ID_INVALID: '1210',

  /** Invalid date format */
  DATE_FORMAT_INVALID: '1203',

  /** Product code not valid for this unit */
  PRODUCT_CODE_INVALID: '1205',

  /** Component not found */
  COMPONENT_NOT_FOUND: '1146',

  /** Component has been shipped */
  COMPONENT_SHIPPED: '2516',

  /** Component returned from customer */
  COMPONENT_RETURNED_FROM_CUSTOMER: '2517',

  /** Component in distribution */
  COMPONENT_IN_DISTRIBUTION: '2518',

  /** Component packed */
  COMPONENT_PACKED: '2519',

  /** Component returned to lab */
  COMPONENT_RETURNED_TO_LAB: '2520',

  /** Component labeled (show confirmation) */
  COMPONENT_LABELED: '2521',

  /** Standard deletion confirmation */
  CONFIRM_DELETION: '2522'
} as const;

export type ComponentDeleteErrorCode = typeof ComponentDeleteErrorCodes[keyof typeof ComponentDeleteErrorCodes];
