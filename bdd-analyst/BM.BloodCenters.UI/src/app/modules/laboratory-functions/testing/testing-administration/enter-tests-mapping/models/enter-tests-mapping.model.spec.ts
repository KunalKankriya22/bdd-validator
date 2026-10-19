import {
  ContractDropdownItem,
  TestDropdownItem,
  TestMappingRow,
  TestMappingSaveRequest,
  TestMappingRowPayload,
  SaveResponse,
  WarningItem,
} from './enter-tests-mapping.model';

describe('EnterTestsMapping Models', () => {
  describe('TestDropdownItem', () => {
    it('should create a valid test dropdown item', () => {
      const item: TestDropdownItem = {
        testGroup: 'GROUP-A',
        testId: 'T001',
        testDesc: 'Test description',
      };

      expect(item.testGroup).toBe('GROUP-A');
      expect(item.testId).toBe('T001');
      expect(item.testDesc).toBe('Test description');
    });

    it('should allow null testGroup', () => {
      const item: TestDropdownItem = {
        testGroup: null,
        testId: 'T002',
        testDesc: 'No group test',
      };

      expect(item.testGroup).toBeNull();
      expect(item.testId).toBe('T002');
    });
  });

  describe('TestMappingRow', () => {
    it('should create a valid mapping row with all fields', () => {
      const row: TestMappingRow = {
        testId: 'T001',
        testDesc: 'Test description',
        cbcTestId: 'CBC001',
        effDate: '2026-06-14',
        termDate: '2026-12-31',
        modifiedDate: '2026-06-01',
      };

      expect(row.testId).toBe('T001');
      expect(row.testDesc).toBe('Test description');
      expect(row.cbcTestId).toBe('CBC001');
      expect(row.effDate).toBe('2026-06-14');
      expect(row.termDate).toBe('2026-12-31');
      expect(row.modifiedDate).toBe('2026-06-01');
    });

    it('should allow null optional fields', () => {
      const row: TestMappingRow = {
        testId: 'T001',
        testDesc: null,
        cbcTestId: null,
        effDate: null,
        termDate: null,
        modifiedDate: null,
      };

      expect(row.testDesc).toBeNull();
      expect(row.cbcTestId).toBeNull();
      expect(row.effDate).toBeNull();
      expect(row.termDate).toBeNull();
      expect(row.modifiedDate).toBeNull();
    });
  });

  describe('TestMappingSaveRequest', () => {
    it('should create a valid save request', () => {
      const request: TestMappingSaveRequest = {
        contractId: 'C001',
        rows: [
          {
            testId: 'T001',
            cbcTestId: 'CBC001',
            effDate: '2026-06-14',
            termDate: null,
          },
        ],
      };

      expect(request.contractId).toBe('C001');
      expect(request.rows.length).toBe(1);
      expect(request.rows[0].testId).toBe('T001');
    });

  });

  describe('TestMappingRowPayload', () => {
    it('should create a valid row payload', () => {
      const payload: TestMappingRowPayload = {
        testId: 'T001',
        cbcTestId: 'CBC001',
        effDate: '2026-06-14',
        termDate: '2026-12-31',
      };

      expect(payload.testId).toBe('T001');
      expect(payload.cbcTestId).toBe('CBC001');
      expect(payload.effDate).toBe('2026-06-14');
      expect(payload.termDate).toBe('2026-12-31');
    });

    it('should allow null optional fields', () => {
      const payload: TestMappingRowPayload = {
        testId: 'T001',
        cbcTestId: null,
        effDate: null,
        termDate: null,
      };

      expect(payload.cbcTestId).toBeNull();
      expect(payload.effDate).toBeNull();
      expect(payload.termDate).toBeNull();
    });
  });

  describe('SaveResponse', () => {
    it('should create a valid save response', () => {
      const response: SaveResponse = {
        status: 'OK',
        message: 'Saved successfully',
        warnings: [],
      };

      expect(response.status).toBe('OK');
      expect(response.message).toBe('Saved successfully');
      expect(response.warnings.length).toBe(0);
    });

    it('should create a response with warnings', () => {
      const response: SaveResponse = {
        status: 'WARNING',
        message: 'Saved with warnings',
        warnings: [
          { code: 'W001', message: 'Duplicate mapping detected' },
          { code: 'W002', message: 'Effective date is today' },
        ],
      };

      expect(response.status).toBe('WARNING');
      expect(response.warnings.length).toBe(2);
      expect(response.warnings[0].code).toBe('W001');
      expect(response.warnings[1].message).toBe('Effective date is today');
    });
  });
});
