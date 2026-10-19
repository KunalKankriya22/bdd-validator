import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SampleTransferInApiService } from './sample-transfer-in-api.service';
import { ApiService } from '../../../../../../../shared/services/api.service';

describe('SampleTransferInApiService', () => {
  let service: SampleTransferInApiService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        SampleTransferInApiService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(SampleTransferInApiService);
  });

  // -----------------------------------------------------------------------
  // getBoxes  (?? [] pattern representative)
  // -----------------------------------------------------------------------
  describe('getBoxes', () => {
    it('returns data when present', (done) => {
      const data = [{ id: 'B1' }];
      apiSpy.get.and.returnValue(of({ data }));

      service.getBoxes('CHECK_IN').subscribe(result => {
        expect(result).toEqual(data as any);
        expect(apiSpy.get).toHaveBeenCalled();
        done();
      });
    });

    it('returns empty array when data is null', (done) => {
      apiSpy.get.and.returnValue(of({ data: null }));

      service.getBoxes('CHECK_IN').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // validateBox  (?? null pattern representative)
  // -----------------------------------------------------------------------
  describe('validateBox', () => {
    it('returns data when present', (done) => {
      const data = { valid: true };
      apiSpy.get.and.returnValue(of({ data }));

      service.validateBox('B1', 'CHECK_IN').subscribe(result => {
        expect(result).toEqual(data as any);
        done();
      });
    });

    it('returns null when data is absent', (done) => {
      apiSpy.get.and.returnValue(of({ data: null }));

      service.validateBox('B1', 'CHECK_IN').subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getBoxSamples
  // -----------------------------------------------------------------------
  describe('getBoxSamples', () => {
    it('returns sample list', (done) => {
      const data = [{ sampleId: 'S1' }];
      apiSpy.get.and.returnValue(of({ data }));

      service.getBoxSamples('B1', 'CHECK_IN').subscribe(result => {
        expect(result).toEqual(data as any);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getContracts
  // -----------------------------------------------------------------------
  describe('getContracts', () => {
    it('returns contract list', (done) => {
      const data = [{ contractId: 'C1' }];
      apiSpy.get.and.returnValue(of({ data }));

      service.getContracts('term').subscribe(result => {
        expect(result).toEqual(data as any);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getProfiles
  // -----------------------------------------------------------------------
  describe('getProfiles', () => {
    it('returns profile list', (done) => {
      const data = [{ profileId: 'P1' }];
      apiSpy.get.and.returnValue(of({ data }));

      service.getProfiles('C1').subscribe(result => {
        expect(result).toEqual(data as any);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getBatches
  // -----------------------------------------------------------------------
  describe('getBatches', () => {
    it('returns batch list', (done) => {
      const data = [{ batchId: 'BT1' }];
      apiSpy.get.and.returnValue(of({ data }));

      service.getBatches('C1').subscribe(result => {
        expect(result).toEqual(data as any);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // generateBatch  (?.batchId ?? '' pattern)
  // -----------------------------------------------------------------------
  describe('generateBatch', () => {
    it('returns batchId when present', (done) => {
      apiSpy.post.and.returnValue(of({ data: { batchId: 'NEW1' } }));

      service.generateBatch('C1', '2024-01-01').subscribe(result => {
        expect(result).toBe('NEW1');
        expect(apiSpy.post).toHaveBeenCalled();
        done();
      });
    });

    it('returns empty string when data is null', (done) => {
      apiSpy.post.and.returnValue(of({ data: null }));

      service.generateBatch().subscribe(result => {
        expect(result).toBe('');
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getSampleTypes
  // -----------------------------------------------------------------------
  describe('getSampleTypes', () => {
    it('returns sample type list', (done) => {
      const data = [{ code: 'ST1' }];
      apiSpy.get.and.returnValue(of({ data }));

      service.getSampleTypes().subscribe(result => {
        expect(result).toEqual(data as any);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getTests
  // -----------------------------------------------------------------------
  describe('getTests', () => {
    it('returns test list', (done) => {
      const data = [{ testId: 'T1' }];
      apiSpy.get.and.returnValue(of({ data }));

      service.getTests().subscribe(result => {
        expect(result).toEqual(data as any);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getOverrideReasons
  // -----------------------------------------------------------------------
  describe('getOverrideReasons', () => {
    it('returns override reason list', (done) => {
      const data = [{ code: 'R1' }];
      apiSpy.get.and.returnValue(of({ data }));

      service.getOverrideReasons().subscribe(result => {
        expect(result).toEqual(data as any);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getOverrideHolds
  // -----------------------------------------------------------------------
  describe('getOverrideHolds', () => {
    it('returns override hold list', (done) => {
      const data = [{ code: 'H1' }];
      apiSpy.get.and.returnValue(of({ data }));

      service.getOverrideHolds().subscribe(result => {
        expect(result).toEqual(data as any);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getOverrideComments
  // -----------------------------------------------------------------------
  describe('getOverrideComments', () => {
    it('returns override comment list', (done) => {
      const data = [{ code: 'CM1' }];
      apiSpy.get.and.returnValue(of({ data }));

      service.getOverrideComments().subscribe(result => {
        expect(result).toEqual(data as any);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // checkIn  (no map, passes HttpContext)
  // -----------------------------------------------------------------------
  describe('checkIn', () => {
    it('posts check-in request and returns response', (done) => {
      const mockResponse = { success: true };
      apiSpy.post.and.returnValue(of(mockResponse));

      service.checkIn({ boxId: 'B1' } as any).subscribe(result => {
        expect(result).toEqual(mockResponse as any);
        expect(apiSpy.post).toHaveBeenCalled();
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // validateOverrideUser  (no map, passes HttpContext)
  // -----------------------------------------------------------------------
  describe('validateOverrideUser', () => {
    it('posts credentials and returns response', (done) => {
      const mockResponse = { success: true };
      apiSpy.post.and.returnValue(of(mockResponse));

      service.validateOverrideUser('user1', 'pass1').subscribe(result => {
        expect(result).toEqual(mockResponse as any);
        expect(apiSpy.post).toHaveBeenCalled();
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // validateContract
  // -----------------------------------------------------------------------
  describe('validateContract', () => {
    it('returns validation result when present', (done) => {
      const data = { valid: true };
      apiSpy.get.and.returnValue(of({ data }));

      service.validateContract('C1').subscribe(result => {
        expect(result).toEqual(data as any);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getBarcodeScheme
  // -----------------------------------------------------------------------
  describe('getBarcodeScheme', () => {
    it('returns barcode scheme when present', (done) => {
      const data = { scheme: 'ISBT' };
      apiSpy.get.and.returnValue(of({ data }));

      service.getBarcodeScheme('C1').subscribe(result => {
        expect(result).toEqual(data as any);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // checkDuplicateSample
  // -----------------------------------------------------------------------
  describe('checkDuplicateSample', () => {
    it('returns duplicate check result', (done) => {
      const data = { isDuplicate: false };
      apiSpy.get.and.returnValue(of({ data }));

      service.checkDuplicateSample('B1', 'U1', 'WB').subscribe(result => {
        expect(result).toEqual(data as any);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // validateUnit  (no map)
  // -----------------------------------------------------------------------
  describe('validateUnit', () => {
    it('returns validation response', (done) => {
      const mockResponse = { success: true };
      apiSpy.get.and.returnValue(of(mockResponse));

      service.validateUnit('U1').subscribe(result => {
        expect(result).toEqual(mockResponse as any);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getSampleData
  // -----------------------------------------------------------------------
  describe('getSampleData', () => {
    it('returns sample data when present', (done) => {
      const data = { unitId: 'U1' };
      apiSpy.get.and.returnValue(of({ data }));

      service.getSampleData('U1', 'B1').subscribe(result => {
        expect(result).toEqual(data as any);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // copyUnits
  // -----------------------------------------------------------------------
  describe('copyUnits', () => {
    it('returns copy result when present', (done) => {
      const data = { copied: true };
      apiSpy.post.and.returnValue(of({ data }));

      service.copyUnits('B1', 'EU1').subscribe(result => {
        expect(result).toEqual(data as any);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // saveAdhocTests  (no map)
  // -----------------------------------------------------------------------
  describe('saveAdhocTests', () => {
    it('posts adhoc tests and returns response', (done) => {
      const mockResponse = { success: true };
      apiSpy.post.and.returnValue(of(mockResponse));

      service.saveAdhocTests('C1', 'PS1', ['T1', 'T2']).subscribe(result => {
        expect(result).toEqual(mockResponse as any);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getNotations
  // -----------------------------------------------------------------------
  describe('getNotations', () => {
    it('returns notation list', (done) => {
      const data = [{ code: 'N1' }];
      apiSpy.get.and.returnValue(of({ data }));

      service.getNotations('U1').subscribe(result => {
        expect(result).toEqual(data as any);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // deleteNotation  (no map)
  // -----------------------------------------------------------------------
  describe('deleteNotation', () => {
    it('deletes notation and returns response', (done) => {
      const mockResponse = { success: true };
      apiSpy.delete.and.returnValue(of(mockResponse));

      service.deleteNotation('N1', 'U1').subscribe(result => {
        expect(result).toEqual(mockResponse as any);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // updateNotation  (no map)
  // -----------------------------------------------------------------------
  describe('updateNotation', () => {
    it('puts notation update and returns response', (done) => {
      const mockResponse = { success: true };
      apiSpy.put.and.returnValue(of(mockResponse));

      service.updateNotation({ notationCode: 'N1', unitId: 'U1', effDate: '2024-01-01' }).subscribe(result => {
        expect(result).toEqual(mockResponse as any);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // updateSampleDetail  (no map)
  // -----------------------------------------------------------------------
  describe('updateSampleDetail', () => {
    it('puts sample detail update and returns response', (done) => {
      const mockResponse = { success: true };
      apiSpy.put.and.returnValue(of(mockResponse));

      service.updateSampleDetail({ sampleId: 'S1' } as any).subscribe(result => {
        expect(result).toEqual(mockResponse as any);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getNotationAccess  (?? { canAdd: false, canDelete: false, message: '' } pattern)
  // -----------------------------------------------------------------------
  describe('getNotationAccess', () => {
    it('returns access result when present', (done) => {
      const data = { canAdd: true, canDelete: true, message: 'OK' };
      apiSpy.get.and.returnValue(of({ data }));

      service.getNotationAccess().subscribe(result => {
        expect(result).toEqual(data as any);
        done();
      });
    });

    it('returns default access when data is null', (done) => {
      apiSpy.get.and.returnValue(of({ data: null }));

      service.getNotationAccess().subscribe(result => {
        expect(result).toEqual({ canAdd: false, canDelete: false, message: '' });
        done();
      });
    });
  });
});
