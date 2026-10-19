import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { InterdictionQueryService } from './interdiction-query.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('InterdictionQueryService', () => {
  let service: InterdictionQueryService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockInterdictions = [
    {
      donorInterdictionCode: 'INT001',
      codeMeaning: 'Test Interdiction',
      effectiveDate: '2026-01-01',
      terminationDate: null,
      unitId: '1234567',
      reasonForInterdiction: 'Test reason',
      userInactiveClass: 'CLASS1',
      chapterId: 'CH01',
      warehouseId: 'WH01'
    }
  ];

  const mockUserInactiveClasses = [
    { userInactiveClass: 'CLASS1' },
    { userInactiveClass: 'CLASS2' }
  ];

  const mockInterdictionCodes = [
    { donorInterdictionCode: 'INT001', codeMeaning: 'Test Interdiction' },
    { donorInterdictionCode: 'INT002', codeMeaning: 'Another Interdiction' }
  ];

  // TODO: Uncomment when Other Holds functionality is completed
  // const mockOtherHolds = [
  //   {
  //     donorInterdictionCode: 'HOLD1',
  //     codeMeaning: 'Test Hold',
  //     effectiveDate: '2026-02-01',
  //     terminationDate: null,
  //     reasonForInterdiction: 'Test hold reason'
  //   }
  // ];

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['post', 'get']);

    TestBed.configureTestingModule({
      providers: [
        InterdictionQueryService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(InterdictionQueryService);
  });

  describe('getInterdictions', () => {
    it('should fetch interdictions successfully', (done) => {
      apiServiceSpy.post.and.returnValue(of({ data: mockInterdictions }));

      service.getInterdictions({ searchKeyword: 'test' }).subscribe({
        next: (result) => {
          expect(result).toEqual(mockInterdictions);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.DONOR_FUNCTIONS.INTERDICTION_QUERY.GET,
            { searchKeyword: 'test' }
          );
          done();
        }
      });
    });

    it('should handle error when fetching interdictions', (done) => {
      const error = new Error('API Error');
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.getInterdictions({}).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });

  });

  describe('addInterdictionsAnd', () => {
    it('should add interdictions with AND logic', (done) => {
      const payload = {
        donorInterdictionCodes: ['INT001', 'INT002'],
        effectiveDate: '2026-01-01',
        unitId: '1234567',
        userInactiveClass: 'CLASS1'
      };
      apiServiceSpy.post.and.returnValue(of({ success: true }));

      service.addInterdictionsAnd(payload).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.DONOR_FUNCTIONS.INTERDICTION_QUERY.ADD_AND,
            payload
          );
          done();
        }
      });
    });

    it('should handle error when adding interdictions (AND)', (done) => {
      const error = new Error('API Error');
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.addInterdictionsAnd({} as any).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('addInterdictionsOr', () => {
    it('should add interdictions with OR logic', (done) => {
      const payload = {
        donorInterdictionCodes: ['INT001', 'INT002'],
        effectiveDate: '2026-01-01',
        unitId: '1234567',
        userInactiveClass: 'CLASS1'
      };
      apiServiceSpy.post.and.returnValue(of({ success: true }));

      service.addInterdictionsOr(payload).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.DONOR_FUNCTIONS.INTERDICTION_QUERY.ADD_OR,
            payload
          );
          done();
        }
      });
    });

    it('should handle error when adding interdictions (OR)', (done) => {
      const error = new Error('API Error');
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.addInterdictionsOr({} as any).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('getUserInactiveClasses', () => {
    it('should fetch user inactive classes successfully', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockUserInactiveClasses }));

      service.getUserInactiveClasses().subscribe({
        next: (result) => {
          expect(result).toEqual(['CLASS1', 'CLASS2']);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.DONOR_FUNCTIONS.INTERDICTION_QUERY.USER_INACTIVE_CLASSES
          );
          done();
        }
      });
    });


    it('should handle error when fetching user inactive classes', (done) => {
      const error = new Error('API Error');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getUserInactiveClasses().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('getDonorInterdictionCodes', () => {
    it('should fetch donor interdiction codes successfully', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockInterdictionCodes }));

      service.getDonorInterdictionCodes().subscribe({
        next: (result) => {
          expect(result).toEqual(mockInterdictionCodes);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.DONOR_FUNCTIONS.INTERDICTION_QUERY.INTERDICTION_CODES
          );
          done();
        }
      });
    });


    it('should handle error when fetching interdiction codes', (done) => {
      const error = new Error('API Error');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getDonorInterdictionCodes().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  // TODO: Uncomment when Other Holds functionality is completed
  // describe('getOtherHolds', () => {
  //   it('should fetch other holds successfully', (done) => {
  //     const unitId = '1234567';
  //     apiServiceSpy.get.and.returnValue(of({ data: mockOtherHolds }));

  //     service.getOtherHolds(unitId).subscribe({
  //       next: (result) => {
  //         expect(result).toEqual(mockOtherHolds);
  //         expect(apiServiceSpy.get).toHaveBeenCalledWith(
  //           API.DONOR_FUNCTIONS.INTERDICTION_QUERY.OTHER_HOLDS(unitId)
  //         );
  //         done();
  //       }
  //     });
  //   });

  //   it('should return empty array when data is null', (done) => {
  //     apiServiceSpy.get.and.returnValue(of({ data: null }));

  //     service.getOtherHolds('1234567').subscribe({
  //       next: (result) => {
  //         expect(result).toEqual([]);
  //         done();
  //       }
  //     });
  //   });

  //   it('should handle error when fetching other holds', (done) => {
  //     const error = new Error('API Error');
  //     apiServiceSpy.get.and.returnValue(throwError(() => error));

  //     service.getOtherHolds('1234567').subscribe({
  //       error: (err) => {
  //         expect(err).toBe(error);
  //         done();
  //       }
  //     });
  //   });
  // });
});
