/**
 * API endpoint constants for Instrument Interface API Manager
 * All endpoint paths are defined here for consistency and maintainability
 */
export const INSTRUMENT_INTERFACE_API_ENDPOINTS = {
  BASE: '/api/v1/instrument-interface',

  CHAPTERS: '/api/v1/instrument-interface/chapters',

  INSTRUMENTS: '/api/v1/instrument-interface/instruments',

  RAW_DATA: (take: number, skip: number) =>
    `/api/v1/instrument-interface/raw-data/${take}/${skip}`,

  PENDING_FILE_IDS: (chapterId: string, instrumentId: string) =>
    `/api/v1/instrument-interface/pending-file-ids/${chapterId}/${instrumentId}`,

  UPLOAD_STATUS: (take: number, skip: number) =>
    `/api/v1/instrument-interface/upload-status/${take}/${skip}`,

  FILE_IDS: (chapterId: string, instrumentId: string, source: string = 'both') =>
    `/api/v1/instrument-interface/file-ids/${chapterId}/${instrumentId}?source=${source}`,

  TEST_BATCH_IDS: (chapterId: string, instrumentId: string) =>
    `/api/v1/instrument-interface/test-batch-ids/${chapterId}/${instrumentId}`,

  MACHINE_TEST_IDS: (chapterId: string, instrumentId: string) =>
    `/api/v1/instrument-interface/machine-test-ids/${chapterId}/${instrumentId}`,

  UNIT_DETAILS: '/api/v1/instrument-interface/upload-status/units',

  ERROR_HANDLING: {
    LIST: (take: number, skip: number) =>
      `/api/v1/instrument-interface/error-handling/${take}/${skip}`,

    FILTER: (take: number, skip: number) =>
      `/api/v1/instrument-interface/error-handling/filter/${take}/${skip}`,

    DETAILS: (chapterId: string, machineId: string, machineTestId: string, errorCode: string) =>
      `/api/v1/instrument-interface/error-handling/${encodeURIComponent(chapterId)}/${encodeURIComponent(machineId)}/${encodeURIComponent(machineTestId)}/${encodeURIComponent(errorCode)}`,

    CREATE: '/api/v1/instrument-interface/error-handling',

    UPDATE: '/api/v1/instrument-interface/error-handling',
  },

  LOG_FILES: (instrumentId: string) =>
    `/api/v1/instrument-interface/logs/${instrumentId}`,

  LOG_FILE_CONTENT: (parmId: string) =>
    `/api/v1/instrument-interface/logs/${parmId}/content`,

  LOG_FILE_DOWNLOAD: (parmId: string) =>
    `/api/v1/instrument-interface/logs/${parmId}/download`,

  UPLOAD: '/api/v1/instrument-interface/upload',

  MANUAL_UPLOAD: '/api/v1/instrument-interface/manual-upload',

  UPLOAD_STATUSES: (chapterId: string, instrumentId: string) =>
    `/api/v1/instrument-interface/upload-statuses/${chapterId}/${instrumentId}`,

  REPORT_ACTION_URL: '/api/v1/user-utilities/report-action/url',

  USER_DETAILS: (userId: string) =>
    `/api/v1/user-utilities/user-details/${encodeURIComponent(userId)}`,
} as const;
