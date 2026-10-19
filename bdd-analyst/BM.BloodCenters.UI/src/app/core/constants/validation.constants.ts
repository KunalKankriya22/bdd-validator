export const VALIDATION = {
  EMAIL: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 128,

    MESSAGES: {
      REQUIRED: 'VALIDATION.EMAIL.REQUIRED',
      INVALID: 'VALIDATION.EMAIL.INVALID',
      MIN_LENGTH: 'VALIDATION.EMAIL.MIN_LENGTH',
      NOT_FOUND: 'VALIDATION.EMAIL.NOT_FOUND',
    },
  },

  FORGOT_PASSWORD: {
    MESSAGES: {
      FAILED: 'VALIDATION.FORGOT_PASSWORD.FAILED',
    },
  },

  RESET_PASSWORD: {
    MESSAGES: {
      TOKEN_EXPIRED: 'Sorry, your reset password link is no longer valid. You can request another one below.',
      SUCCESS: 'Your password has been successfully updated.',
      FAILED: 'Failed to reset password. Please try again.',
      PASSWORD_MISMATCH: "Password doesn't match",
    },
  },
  ASSIGN_WAREHOUSE: {
    MESSAGES:{
      TERMINATION_DATE: 'VALIDATION.ASSIGN_WAREHOUSE.TERMINATION_DATE'
    }
  },

  INSTITUTION: {
    LIMITS: {
      STATE_LENGTH: 2,
      CONTRACT_PREFIX_LENGTH: 3,
      PHONE_MAX_DIGITS: 10,
      PIPE_RULE_LIMIT: 40,
    },

    MESSAGES: {
      REQUIRED: 'VALIDATION.INSTITUTION.REQUIRED',
      MAX_LENGTH: 'VALIDATION.INSTITUTION.MAX_LENGTH',
      MIN_LENGTH: 'VALIDATION.INSTITUTION.MIN_LENGTH',

      STATE_REQUIRED: 'VALIDATION.INSTITUTION.STATE_REQUIRED',
      STATE_LENGTH: 'VALIDATION.INSTITUTION.STATE_LENGTH',

      CONTRACT_PREFIX: 'VALIDATION.INSTITUTION.CONTRACT_PREFIX',
      ALPHABETIC_ONLY: 'VALIDATION.INSTITUTION.ALPHABETIC_ONLY',

      NUMBERS_ONLY: 'VALIDATION.INSTITUTION.NUMBERS_ONLY',
      MAX_DIGITS: 'VALIDATION.INSTITUTION.MAX_DIGITS',
      EXACT_DIGITS: 'VALIDATION.INSTITUTION.EXACT_DIGITS',

      INTERNATIONAL_PHONE_FAX_INVALID_CHARS:
        'VALIDATION.INSTITUTION.INTERNATIONAL_PHONE_FAX_INVALID_CHARS',

      DATE_IN_PAST: 'VALIDATION.INSTITUTION.DATE_IN_PAST',

      PIPE_RULE: 'VALIDATION.INSTITUTION.PIPE_RULE',

      INVALID_PREFIX: 'VALIDATION.INSTITUTION.INVALID_PREFIX'
,
      INVALID_REGISTRATION_NUMBER: 'VALIDATION.INSTITUTION.INVALID_REGISTRATION_NUMBER'
    },
  },
} as const;

export const VALIDATION_REPORT_MASTER = {
  REPORT_MASTER_TABLE: {
    LIMITS: {
      SEARCH_MIN_LENGTH: 1,
      SEARCH_MAX_LENGTH: 100,
      DESCRIPTION_MAX_LENGTH: 100,
      DESCRIPTION_TRUNCATE_LENGTH: 50,
      MIN_PAGE_SIZE: 10,
      MAX_PAGE_SIZE: 100,
      DEFAULT_PAGE_SIZE: 25,
    },

    MESSAGES: {
      LOAD_FAILED: 'VALIDATION.REPORT_MASTER_TABLE.MESSAGES.LOAD_FAILED',
      DELETE_FAILED: 'VALIDATION.REPORT_MASTER_TABLE.MESSAGES.DELETE_FAILED',
      NO_DATA: 'VALIDATION.REPORT_MASTER_TABLE.MESSAGES.NO_DATA',
    },
  },
} as const;

export const VALIDATION_VALID_ABO = {
  VALID_ABO_TABLE: {
    LIMITS: {
      DEFAULT_PAGE_SIZE: 25,
      DESCRIPTION_TRUNCATE_LENGTH: 50,
      CODE_MAX_LENGTH: 5,
      CODE_MIN_LENGTH: 1,
      DESCRIPTION_MAX_LENGTH: 20,
      MNEMONIC_MAX_LENGTH: 12,
      GROUP_MAX: 99999,
      GROUP_MIN: 0,
      SEQUENCE_MAX: 99,
      SEQUENCE_MIN: 0,
      SEARCH_MIN_LENGTH: 1,
      SEARCH_MAX_LENGTH: 100
    },
    MESSAGES: {
      LOAD_ERROR: 'Failed to load Valid ABO data. Please try again later.',
      CREATE_SUCCESS: 'Valid ABO record created successfully',
      CREATE_ERROR: 'Failed to create Valid ABO record',
      UPDATE_SUCCESS: 'Valid ABO record updated successfully',
      UPDATE_ERROR: 'Failed to update Valid ABO record',
      DELETE_SUCCESS: 'Valid ABO record deleted successfully',
      DELETE_ERROR: 'Failed to delete Valid ABO record',
      NO_DATA: 'No Valid ABO records available to display'
    }
  }
} as const;

export const VALIDATION_INVENTORY_PRODUCT_TYPES = {
  INVENTORY_PRODUCT_TYPES_TABLE: {
    LIMITS: {
      DEFAULT_PAGE_SIZE: 10,
      DESCRIPTION_TRUNCATE_LENGTH: 50,
      PRODUCT_TYPE_MAX_LENGTH: 5,
      PRODUCT_TYPE_MIN_LENGTH: 1,
      SHORT_NAME_MAX_LENGTH: 10,
      DESCRIPTION_MAX_LENGTH: 50,
      LIFE_SPAN_IND_MAX_LENGTH: 2,
      LIFE_SPAN_MAX: 99999,
      LIFE_SPAN_MIN: 0,

      // Unit-specific maximum values (client-side UX validation)
      // Backend has authoritative database-driven validation
      LIFE_SPAN_MAX_HOURS: 8760,   // 365 days
      LIFE_SPAN_MAX_DAYS: 1825,    // 5 years
      LIFE_SPAN_MAX_YEARS: 1,

      PRICE_MAX: 999999.99,
      PRICE_MIN: -999999.99,  // Allow negative prices for legacy parity
      TEMP_MAX: 999.99,
      TEMP_MIN: -999.99,
      SORT_SEQUENCE_MAX: 99,
      SORT_SEQUENCE_MIN: 0,
      PRODUCT_GROUPING_MAX_LENGTH: 50,
      SEARCH_MIN_LENGTH: 1,
      SEARCH_MAX_LENGTH: 100
    },
    MESSAGES: {
      LOAD_ERROR: 'Failed to load Inventory Product Types data. Please try again later.',
      CREATE_SUCCESS: 'Inventory Product Type created successfully',
      CREATE_ERROR: 'Failed to create Inventory Product Type',
      UPDATE_SUCCESS: 'Inventory Product Type updated successfully',
      UPDATE_ERROR: 'Failed to update Inventory Product Type',
      DELETE_SUCCESS: 'Inventory Product Type deleted successfully',
      DELETE_ERROR: 'Failed to delete Inventory Product Type',
      NO_DATA: 'No Inventory Product Types available to display'
    }
  }
} as const;

export const VALIDATION_ASSIGN_INTERDICTION_CLASS = {
  ASSIGN_INTERDICTION_CLASS: {
    LIMITS: {
      SEARCH_MIN_LENGTH: 3,
      SEARCH_MAX_LENGTH: 100,
      SEARCH_DEBOUNCE_TIME: 300,

      DEFAULT_PAGE_SIZE: 10,
      MIN_PAGE_SIZE: 10,
      MAX_PAGE_SIZE: 100,

      INTERDICTION_CODE_MAX_LENGTH: 50,
      DESCRIPTION_MAX_LENGTH: 200,
      DESCRIPTION_TRUNCATE_LENGTH: 50,
      TYPE_MAX_LENGTH: 50,
      CLASS_MAX_LENGTH: 50,

      MAX_FILTER_RESULTS: 100,
    },

    MESSAGES: {
      LOADING: 'ASSIGN_INTERDICTION_CLASS.TABLE.LOADING',
      NO_DATA: 'ASSIGN_INTERDICTION_CLASS.TABLE.EMPTY_STATE',

      LOAD_FAILED: 'ASSIGN_INTERDICTION_CLASS.MESSAGES.LOAD_ERROR',
      CREATE_FAILED: 'ASSIGN_INTERDICTION_CLASS.MESSAGES.CREATE_ERROR',
      UPDATE_FAILED: 'ASSIGN_INTERDICTION_CLASS.MESSAGES.UPDATE_ERROR',

      CREATE_SUCCESS: 'ASSIGN_INTERDICTION_CLASS.MESSAGES.CREATE_SUCCESS',
      UPDATE_SUCCESS: 'ASSIGN_INTERDICTION_CLASS.MESSAGES.UPDATE_SUCCESS',

      SEARCH_PLACEHOLDER: 'ASSIGN_INTERDICTION_CLASS.SEARCH.PLACEHOLDER',
      NO_SEARCH_RESULTS: 'ASSIGN_INTERDICTION_CLASS.SEARCH.NO_RESULTS',
    }
  }
} as const;

export const VALIDATION_POOL_COMPATIBILITY_MATRIX = {
  POOL_COMPATIBILITY_MATRIX_TABLE: {
    LIMITS: {
      DEFAULT_PAGE_SIZE: 25,
      SEARCH_MIN_LENGTH: 1,
      SEARCH_MAX_LENGTH: 100,
      WORK_OPTION_MAX_LENGTH: 5,
      PRODUCT_TYPE_MAX_LENGTH: 5
    },
    MESSAGES: {
      LOAD_ERROR: 'Failed to load Pool Compatibility Matrix data. Please try again later.',
      CREATE_SUCCESS: 'Pool compatibility record created successfully',
      CREATE_ERROR: 'Failed to create pool compatibility record',
      UPDATE_SUCCESS: 'Pool compatibility record updated successfully',
      UPDATE_ERROR: 'Failed to update pool compatibility record',
      BATCH_SUCCESS: 'All records created successfully',
      BATCH_PARTIAL_SUCCESS: 'records created successfully',
      BATCH_PARTIAL_FAILED: 'failed',
      NO_DATA: 'No pool compatibility records available to display'
    }
  }
} as const;

export const VALIDATION_REPORT_ACTIONS = {
  REPORT_ACTIONS_LIST: {
    LIMITS: {
      DEFAULT_PAGE_SIZE: 25,
      SEARCH_MIN_LENGTH: 1,
      SEARCH_MAX_LENGTH: 100,
      MIN_PAGE_SIZE: 10,
      MAX_PAGE_SIZE: 100,
    },
    MESSAGES: {
      LOAD_ERROR: 'Failed to load reports. Please try again.',
      DELETE_SUCCESS: 'Report deleted successfully',
      DELETE_ERROR: 'Failed to delete report',
      REVIEW_ERROR: 'Failed to open report for review',
      NO_REPORTS: 'No reports currently available for review',
      MUST_BE_COMPLETED: 'Report must be completed before review',
    },
  },
} as const;

export const VALIDATION_SYSTEM_ADMINISTRATION = {
  APPLICATION_SEQUENCE_NUMBERS: {
    LIMITS: {
      // .NET Int32 maximum value (2^31 - 1)
      // This aligns with backend ApplicationSequenceNumberDto.MaxNumber and .StartingNumber (int?)
      INT32_MAX: 2147483647,
      INT32_MIN: 0,
      NUMBER_TYPE_MAX_LENGTH: 20,
      DEFAULT_PAGE_SIZE: 25,
      SEARCH_MIN_LENGTH: 1,
      SEARCH_MAX_LENGTH: 100,
    },
    MESSAGES: {
      MAX_NUMBER_REQUIRED: 'Max Number is required',
      MAX_NUMBER_MIN: 'Max Number must be 0 or greater',
      MAX_NUMBER_MAX: 'Max Number must not exceed 2,147,483,647',
    },
  },
} as const;

/**
 * User Access Level Constants
 * Defines minimum access levels required for specific permissions
 */
export const USER_ACCESS_LEVELS = {
  /** Minimum access level required for supervisor permissions */
  SUPERVISOR_MINIMUM: 9,
} as const;


