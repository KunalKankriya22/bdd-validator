import { TestBed } from '@angular/core/testing';
import { InterdictionQueryMockService } from './interdiction-query-mock.service';

describe('InterdictionQueryMockService', () => {
  let service: InterdictionQueryMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InterdictionQueryMockService]
    });

    service = TestBed.inject(InterdictionQueryMockService);
  });

  describe('Interdiction Codes', () => {
    it('should return interdiction codes when option type is Interdiction', (done) => {
      service.getInterdictionCodes('Interdiction').subscribe((result) => {
        expect(result.length).toBeGreaterThan(0);
        result.forEach(item => expect(item.type).toBe('Interdiction'));
        done();
      });
    });

    it('should return hold codes when option type is Hold', (done) => {
      service.getInterdictionCodes('Hold').subscribe((result) => {
        expect(result.length).toBeGreaterThan(0);
        result.forEach(item => expect(item.type).toBe('Hold'));
        done();
      });
    });
  });

  describe('All Codes', () => {
    it('should return combined interdiction and hold codes', (done) => {
      service.getAllCodes().subscribe((result) => {
        const types = new Set(result.map(r => r.type));
        expect(types.has('Interdiction')).toBe(true);
        expect(types.has('Hold')).toBe(true);
        done();
      });
    });
  });

  describe('Donation Retrieval', () => {
    it('should return donation records for valid query params', (done) => {
      service.retrieveDonations({ option: 'Interdiction', code: 'INTER' }).subscribe((result) => {
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        done();
      });
    });
  });

  describe('Donor Retrieval', () => {
    it('should return empty donor records array', (done) => {
      service.retrieveDonors({ option: 'Interdiction', code: 'INTER' }).subscribe((result) => {
        expect(Array.isArray(result)).toBe(true);
        done();
      });
    });
  });

  describe('Other Holds', () => {
    it('should return holds for a known unit ID', (done) => {
      service.getOtherHolds('W12342402705-Q').subscribe((result) => {
        expect(result.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should return empty array for unknown unit ID', (done) => {
      service.getOtherHolds('UNKNOWN-ID').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('Filter Options', () => {
    it('should return donation type options', () => {
      const types = service.getDonationTypes();
      expect(types).toContain('ALL');
      expect(types).toContain('WB');
    });

    it('should return show released options', () => {
      const options = service.getShowReleasedOptions();
      expect(options).toContain('Yes');
      expect(options).toContain('No');
    });

    it('should return period options', () => {
      const options = service.getPeriodOptions();
      expect(options).toContain('After');
      expect(options).toContain('Before');
    });

    it('should return user inactive class options', (done) => {
      service.getUserInactiveClassOptions().subscribe((result) => {
        expect(result.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should return operation options', () => {
      const options = service.getOperationOptions();
      expect(options).toContain('-');
      expect(options).toContain('ADD');
    });
  });

  describe('Add Interdictions', () => {
    it('should return success for AND logic', (done) => {
      service.addInterdictionsAnd({ codes: ['INTER'] }).subscribe((result) => {
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should return success for OR logic', (done) => {
      service.addInterdictionsOr({ codes: ['INTER'] }).subscribe((result) => {
        expect(result.success).toBe(true);
        done();
      });
    });
  });
});
