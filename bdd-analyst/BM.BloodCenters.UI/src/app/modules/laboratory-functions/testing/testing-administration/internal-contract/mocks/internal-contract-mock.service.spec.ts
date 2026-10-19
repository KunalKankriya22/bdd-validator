import { TestBed } from '@angular/core/testing';
import { InternalContractMockService } from './internal-contract-mock.service';

describe('InternalContractMockService', () => {
  let service: InternalContractMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InternalContractMockService]
    });

    service = TestBed.inject(InternalContractMockService);
  });

  describe('Contract List with Filtering', () => {
    it('should return paginated contracts', (done) => {
      service.getInternalContracts(5, 0, {} as any).subscribe((result) => {
        expect(result.data.length).toBeLessThanOrEqual(5);
        expect(result.total).toBeGreaterThan(0);
        done();
      });
    });

    it('should filter by search keyword matching company or contractId', (done) => {
      service.getInternalContracts(10, 0, { searchKeyword: 'Brooke' } as any).subscribe((result) => {
        result.data.forEach(c =>
          expect(
            c.company.toLowerCase().includes('brooke') ||
            c.contractId.toLowerCase().includes('brooke')
          ).toBe(true)
        );
        done();
      });
    });

    it('should filter by chapterId', (done) => {
      service.getInternalContracts(10, 0, { chapterId: 'DAL' } as any).subscribe((result) => {
        result.data.forEach(c => expect(c.chapterId).toBe('DAL'));
        done();
      });
    });

    it('should filter by contractType', (done) => {
      service.getInternalContracts(10, 0, { contractType: 'OU' } as any).subscribe((result) => {
        result.data.forEach(c => expect(c.contractType).toBe('OU'));
        done();
      });
    });

    it('should filter by effective date with After period', (done) => {
      service.getInternalContracts(10, 0, {
        effectiveDate: '2025-01-01',
        effectivePeriod: 'After'
      } as any).subscribe((result) => {
        result.data.forEach(c =>
          expect(new Date(c.effDate) >= new Date('2025-01-01')).toBe(true)
        );
        done();
      });
    });

    it('should filter by termination date with Before period', (done) => {
      service.getInternalContracts(10, 0, {
        terminationDate: '2031-01-01',
        terminationPeriod: 'Before'
      } as any).subscribe((result) => {
        result.data.forEach(c => {
          expect(c.termDate).toBeDefined();
          expect(new Date(c.termDate!) <= new Date('2031-01-01')).toBe(true);
        });
        done();
      });
    });

    it('should return empty when no contracts match filter', (done) => {
      service.getInternalContracts(10, 0, { searchKeyword: 'ZZZZZZNOTFOUND' } as any).subscribe((result) => {
        expect(result.data.length).toBe(0);
        expect(result.total).toBe(0);
        done();
      });
    });
  });

  describe('Get Contract By ID', () => {
    it('should return contract details for a valid ID', (done) => {
      service.getById('DAIN0001').subscribe((result) => {
        expect(result.contract.contractId).toBe('DAIN0001');
        expect(result.address).toBeDefined();
        expect(result.contacts.length).toBeGreaterThan(0);
        expect(result.tests.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should throw error for invalid contract ID', () => {
      expect(() => service.getById('NONEXISTENT')).toThrow();
    });
  });

  describe('Create Contract', () => {
    it('should return a generated contract ID on creation', (done) => {
      const request = {
        contract: { chapterId: 'DAL', contractType: 'IN' }
      } as any;

      service.create(request).subscribe((result) => {
        expect(result.contractId).toBeDefined();
        expect(result.message).toContain('created');
        done();
      });
    });
  });

  describe('Update Contract', () => {
    it('should return success message on update', (done) => {
      service.update('DAIN0001', {} as any).subscribe((result) => {
        expect(result.contractId).toBe('DAIN0001');
        expect(result.message).toContain('updated');
        done();
      });
    });
  });

  describe('Delete Contract', () => {
    it('should complete without error', (done) => {
      service.delete('DAIN0001').subscribe({
        complete: () => done()
      });
    });
  });

  describe('Lookup Methods', () => {
    it('should return contract types', (done) => {
      service.getContractTypes().subscribe((result) => {
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].codeType).toBe('CONTR');
        done();
      });
    });

    it('should return barcode protocols', (done) => {
      service.getBarcodeProtocols().subscribe((result) => {
        expect(result.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should return valid tests', (done) => {
      service.getValidTests().subscribe((result) => {
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].testId).toBeDefined();
        done();
      });
    });

    it('should return states', (done) => {
      service.getStates().subscribe((result) => {
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].stateCode).toBeDefined();
        done();
      });
    });

    it('should return countries', (done) => {
      service.getCountries().subscribe((result) => {
        expect(result.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should return chapters', (done) => {
      service.getChapters().subscribe((result) => {
        expect(result.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should return active chapters excluding inactive ones', (done) => {
      service.getActiveChapters().subscribe((result) => {
        const ids = result.map(c => c.chapterId);
        expect(ids).not.toContain('MIA');
        done();
      });
    });
  });
});
