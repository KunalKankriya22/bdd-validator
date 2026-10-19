import {
  InstrumentIdOption,
  InstrumentTestIdOption,
  LifeTrackTestOption,
  TestByMachineIdResponse,
  InstrumentTestModel,
  ApplicationSchedulingTestModel
} from '../models/test-by-machine-id.model';

/**
 * Mock data for Test by Machine ID component
 * This file contains all mock data for testing the UI without backend
 */

export const MOCK_INSTRUMENT_IDS: InstrumentIdOption[] = [
  { instrumentId: 'S201', description: 'Cobas s 201' },
  { instrumentId: 'S202', description: 'Cobas s 202' },
  { instrumentId: 'ARC', description: 'Architect i2000SR' },
  { instrumentId: 'ORTHO', description: 'Ortho Vision' }
];

export const MOCK_INSTRUMENT_TEST_IDS: InstrumentTestIdOption[] = [
  { testId: 'MPX', description: 'Multiplex Panel' },
  { testId: 'HIV', description: 'HIV Antibody' },
  { testId: 'HCV', description: 'Hepatitis C' },
  { testId: 'HBV', description: 'Hepatitis B' }
];

export const MOCK_TEST_OPTIONS: { tests: LifeTrackTestOption[]; results: string[] } = {
  tests: [
    { testId: 'MPX V2.0', description: 'Multiplex v2.0 Panel' },
    { testId: 'MPX', description: 'Multiplex Panel' },
    { testId: 'NHIV', description: 'NAT HIV-1' },
    { testId: 'NHBV', description: 'NAT HBV' },
    { testId: 'NHCV', description: 'NAT HCV' },
    { testId: 'HIV', description: 'HIV Antibody' },
    { testId: 'HBV', description: 'Hepatitis B' },
    { testId: 'HCV', description: 'Hepatitis C' }
  ],
  results: [
    'R',
    'N',
    'NR'
  ]
};

export const MOCK_INSTRUMENT_TESTS: InstrumentTestModel[] = [
  {
    instrumentId: 'S201',
    testId: 'MPX',
    test1: 'MPX V2.0',
    result1: 'R',
    test2: 'MPX V2.0',
    result2: 'N',
    test3: 'MPX V2.0',
    result3: 'N',
    test4: 'MPX V2.0',
    result4: 'N',
    test5: 'MPX V2.0',
    result5: 'N',
    poolSize: 1,
    auditKey: 1001
  },
  {
    instrumentId: 'S201',
    testId: 'MPX',
    test1: 'MPX V2.0',
    result1: 'R',
    test2: 'MPX V2.0',
    result2: 'R',
    test3: 'MPX V2.0',
    result3: 'R',
    test4: 'MPX V2.0',
    result4: 'R',
    test5: 'MPX V2.0',
    result5: 'R',
    poolSize: 1,
    auditKey: 1002
  },
  {
    instrumentId: 'S201',
    testId: 'MPX',
    test1: 'MPX V2.0',
    result1: 'N',
    test2: 'MPX V2.0',
    result2: 'R',
    test3: 'MPX',
    result3: 'R',
    test4: 'MPX',
    result4: 'R',
    test5: 'MPX',
    result5: 'R',
    poolSize: 1,
    auditKey: 1003
  },
  {
    instrumentId: 'S201',
    testId: 'MPX',
    test1: 'MPX V2.0',
    result1: 'N',
    test2: 'MPX V2.0',
    result2: 'HIVv',
    test3: 'MPX V2.0',
    result3: 'HIVv',
    test4: 'MPX V2.0',
    result4: 'R',
    test5: 'MPX V2.0',
    result5: 'R',
    poolSize: 1,
    auditKey: 1004
  }
];

export const MOCK_APPLICATION_SCHEDULING_TESTS: ApplicationSchedulingTestModel[] = [
  {
    instrumentId: 'S201',
    testId: 'MPX',
    test1: 'NHIV',
    result1: 'R',
    test2: 'NHBV',
    result2: 'N',
    test3: 'NHCV',
    result3: 'N',
    defTest4: 'MPX',
    result4: 'N',
    defTest5: 'iMPX',
    result5: 'N',
    defTest6: '',
    result6: '',
    effectiveDate: new Date('2025-01-11'),
    terminationDate: null,
    auditKey: 2001
  },
  {
    instrumentId: 'S201',
    testId: 'MPX',
    test1: 'NHIV',
    result1: 'R',
    test2: 'NHBV',
    result2: 'R',
    test3: 'NHCV',
    result3: 'R',
    defTest4: 'mpx',
    result4: 'R',
    defTest5: 'iMPX',
    result5: 'R',
    defTest6: '',
    result6: 'R',
    effectiveDate: new Date('2025-01-11'),
    terminationDate: new Date('2026-12-31'),
    auditKey: 2002
  },
  {
    instrumentId: 'S201',
    testId: 'MPX',
    test1: 'NHIV',
    result1: 'NR',
    test2: 'NHBV',
    result2: 'R',
    test3: 'NHCV',
    result3: 'R',
    defTest4: 'MPX',
    result4: 'R',
    defTest5: 'iMPX',
    result5: 'R',
    defTest6: '',
    result6: '',
    effectiveDate: new Date('2025-01-11'),
    terminationDate: null,
    auditKey: 2003
  },
  {
    instrumentId: 'S201',
    testId: 'MPX',
    test1: 'NHIV',
    result1: 'NR',
    test2: 'NHBV',
    result2: 'R',
    test3: 'NHCV',
    result3: 'R',
    defTest4: 'MPX',
    result4: 'R',
    defTest5: 'iMPX',
    result5: 'R',
    defTest6: '',
    result6: '',
    effectiveDate: new Date('2025-01-11'),
    terminationDate: null,
    auditKey: 2004
  }
];

/**
 * Get mock response for a specific instrument and test ID combination
 */
export function getMockTestDataResponse(instrumentId: string, testId: string): TestByMachineIdResponse {
  // Filter data based on instrumentId and testId (for demo purposes, returning all data)
  // In a real scenario, you would filter based on the parameters
  const instrumentTests = MOCK_INSTRUMENT_TESTS.filter(
    item => item.instrumentId === instrumentId && item.testId === testId
  );
  const applicationSchedulingTests = MOCK_APPLICATION_SCHEDULING_TESTS.filter(
    item => item.instrumentId === instrumentId && item.testId === testId
  );

  return {
    instrumentTests,
    applicationSchedulingTests,
    totalRecords: instrumentTests.length
  };
}

/**
 * Simulate different scenarios for testing
 */
export const MOCK_SCENARIOS: Record<string, TestByMachineIdResponse> = {
  // Empty state - no data found
  EMPTY: {
    instrumentTests: [],
    applicationSchedulingTests: [],
    totalRecords: 0
  },

  // Standard data
  STANDARD: {
    instrumentTests: MOCK_INSTRUMENT_TESTS,
    applicationSchedulingTests: MOCK_APPLICATION_SCHEDULING_TESTS,
    totalRecords: MOCK_INSTRUMENT_TESTS.length
  },

  // Single row
  SINGLE_ROW: {
    instrumentTests: [MOCK_INSTRUMENT_TESTS[0]],
    applicationSchedulingTests: [MOCK_APPLICATION_SCHEDULING_TESTS[0]],
    totalRecords: 1
  }
};
