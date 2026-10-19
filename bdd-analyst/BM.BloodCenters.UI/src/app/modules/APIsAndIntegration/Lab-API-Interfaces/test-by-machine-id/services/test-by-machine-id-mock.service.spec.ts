import { TestBed } from '@angular/core/testing';
import { TestByMachineIdMockService } from './test-by-machine-id-mock.service';

describe('TestByMachineIdMockService', () => {
  let service: TestByMachineIdMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TestByMachineIdMockService]
    });

    service = TestBed.inject(TestByMachineIdMockService);
  });

  describe('Instrument IDs', () => {
    it('should return instrument ID options as a non-empty array', (done) => {
      service.getInstrumentIds().subscribe((result) => {
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should return error when error simulation is enabled', (done) => {
      (service as any).SIMULATE_ERROR = true;

      service.getInstrumentIds().subscribe({
        error: (err: Error) => {
          expect(err.message).toContain('instrument IDs');
          done();
        }
      });
    });
  });

  describe('Instrument Test IDs', () => {
    it('should return instrument test ID options as a non-empty array', (done) => {
      service.getInstrumentTestIds().subscribe((result) => {
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should return error when error simulation is enabled', (done) => {
      (service as any).SIMULATE_ERROR = true;

      service.getInstrumentTestIds().subscribe({
        error: (err: Error) => {
          expect(err.message).toContain('instrument test IDs');
          done();
        }
      });
    });
  });

  describe('Test Data Retrieval', () => {
    it('should return test data for STANDARD scenario with given params', (done) => {
      service.getTestData({ instrumentId: 'S201', testId: 'MPX' }).subscribe((result) => {
        expect(result).toBeDefined();
        expect(result.instrumentTests).toBeDefined();
        done();
      });
    });

    it('should use default instrumentId and testId when empty strings provided', (done) => {
      service.getTestData({ instrumentId: '', testId: '' }).subscribe((result) => {
        expect(result).toBeDefined();
        done();
      });
    });

    it('should return empty data for EMPTY scenario', (done) => {
      (service as any).SCENARIO = 'EMPTY';

      service.getTestData({ instrumentId: 'S201', testId: 'MPX' }).subscribe((result) => {
        expect(result).toBeDefined();
        done();
      });
    });

    it('should return single row data for SINGLE_ROW scenario', (done) => {
      (service as any).SCENARIO = 'SINGLE_ROW';

      service.getTestData({ instrumentId: 'S201', testId: 'MPX' }).subscribe((result) => {
        expect(result).toBeDefined();
        done();
      });
    });

    it('should return error when error simulation is enabled', (done) => {
      (service as any).SIMULATE_ERROR = true;

      service.getTestData({ instrumentId: 'S201', testId: 'MPX' }).subscribe({
        error: (err: Error) => {
          expect(err.message).toContain('test data');
          done();
        }
      });
    });
  });

  describe('Save Bulk Test Data', () => {
    it('should return success response with counts matching input lengths', (done) => {
      const dto = {
        InstrumentTests: [{ id: 1 }, { id: 2 }] as any[],
        ApplicationSchedulingTests: [{ id: 3 }] as any[]
      };

      service.saveBulkTestData(dto).subscribe((result) => {
        expect(result.success).toBe(true);
        expect(result.data.instrumentTestsUpdated).toBe(2);
        expect(result.data.applicationTestsUpdated).toBe(1);
        done();
      });
    });

    it('should handle empty/undefined arrays gracefully', (done) => {
      service.saveBulkTestData({} as any).subscribe((result) => {
        expect(result.success).toBe(true);
        expect(result.data.instrumentTestsUpdated).toBe(0);
        expect(result.data.applicationTestsUpdated).toBe(0);
        done();
      });
    });

    it('should return error when error simulation is enabled', (done) => {
      (service as any).SIMULATE_ERROR = true;

      service.saveBulkTestData({} as any).subscribe({
        error: (err: Error) => {
          expect(err.message).toContain('save test data');
          done();
        }
      });
    });
  });

  describe('Test Options', () => {
    it('should return test and result options', (done) => {
      service.getTestOptions().subscribe((result) => {
        expect(result.tests).toBeDefined();
        expect(Array.isArray(result.tests)).toBe(true);
        expect(result.results).toBeDefined();
        expect(Array.isArray(result.results)).toBe(true);
        done();
      });
    });

    it('should return error when error simulation is enabled', (done) => {
      (service as any).SIMULATE_ERROR = true;

      service.getTestOptions().subscribe({
        error: (err: Error) => {
          expect(err.message).toContain('test options');
          done();
        }
      });
    });
  });
});
