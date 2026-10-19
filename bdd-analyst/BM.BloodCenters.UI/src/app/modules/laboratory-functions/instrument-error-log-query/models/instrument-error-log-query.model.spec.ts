import {
  InstrumentErrorLogRecord,
  InstrumentErrorLogSearchRequest,
  InstrumentErrorLogResponse,
} from './instrument-error-log-query.model';

describe('InstrumentErrorLogQuery Models', () => {
  describe('InstrumentErrorLogRecord', () => {
    it('should create a valid record', () => {
      const record: InstrumentErrorLogRecord = {
        moduleName: 'TESTMOD',
        insertDats: '13-JUN-2026 10:30:00',
        userId: 'USER01',
        statementId: 'STMT001',
        errorKey: 'ERR-001',
        errorDesc: 'Test error description',
        expandKey: '0',
      };

      expect(record.moduleName).toBe('TESTMOD');
      expect(record.insertDats).toBe('13-JUN-2026 10:30:00');
      expect(record.userId).toBe('USER01');
      expect(record.statementId).toBe('STMT001');
      expect(record.errorKey).toBe('ERR-001');
      expect(record.errorDesc).toBe('Test error description');
      expect(record.expandKey).toBe('0');
    });
  });

  describe('InstrumentErrorLogSearchRequest', () => {
    it('should create a request with required fields only', () => {
      const request: InstrumentErrorLogSearchRequest = {
        startDate: '2026-06-01',
        endDate: '2026-06-13',
      };

      expect(request.startDate).toBe('2026-06-01');
      expect(request.endDate).toBe('2026-06-13');
      expect(request.moduleName).toBeUndefined();
      expect(request.sortColumn).toBeUndefined();
      expect(request.sortOrder).toBeUndefined();
    });

    it('should create a request with all optional fields', () => {
      const request: InstrumentErrorLogSearchRequest = {
        startDate: '2026-06-01',
        endDate: '2026-06-13',
        moduleName: 'TESTMOD',
        sortColumn: 'ModuleName',
        sortOrder: 'ASC',
      };

      expect(request.moduleName).toBe('TESTMOD');
      expect(request.sortColumn).toBe('ModuleName');
      expect(request.sortOrder).toBe('ASC');
    });
  });

  describe('InstrumentErrorLogResponse', () => {
    it('should create a valid response', () => {
      const response: InstrumentErrorLogResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          {
            moduleName: 'TESTMOD',
            insertDats: '13-JUN-2026 10:30:00',
            userId: 'USER01',
            statementId: 'STMT001',
            errorKey: 'ERR-001',
            errorDesc: 'Test error',
            expandKey: '0',
          },
        ],
        total: 1,
      };

      expect(response.success).toBeTrue();
      expect(response.statusCode).toBe(200);
      expect(response.data.length).toBe(1);
      expect(response.total).toBe(1);
    });

  });
});
