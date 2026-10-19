import { TestBed } from '@angular/core/testing';
import { DiscardBagService } from './discard-bag.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';

describe('DiscardBagService', () => {
  let service: DiscardBagService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        DiscardBagService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(DiscardBagService);
  });

  // -----------------------------------------------------------------------
  // getRejectReasons
  // -----------------------------------------------------------------------
  describe('getRejectReasons', () => {
    it('should return mapped reject reasons', (done) => {
      // Arrange
      const reasons = [{ code: 'R1', description: 'Reason 1' }];
      apiSpy.get.and.returnValue(of({ data: reasons, success: true, message: '', statusCode: 200 }));

      // Act
      service.getRejectReasons().subscribe((result) => {
        // Assert
        expect(result).toEqual(reasons);
        done();
      });
    });

    it('should propagate error', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(throwError(() => new Error('fail')));

      // Act
      service.getRejectReasons().subscribe({ error: (e) => { expect(e).toBeTruthy(); done(); } });
    });
  });

  // -----------------------------------------------------------------------
  // validateUnitForDiscard
  // -----------------------------------------------------------------------
  describe('validateUnitForDiscard', () => {
    it('should return first item from data array', (done) => {
      // Arrange
      const validation = { isValid: true, unitId: 'U1', hasBagsAvailable: true, availableCatalogCount: 3 };
      apiSpy.get.and.returnValue(of({ data: [validation], success: true, message: '', statusCode: 200 }));

      // Act
      service.validateUnitForDiscard('U1', 'CH1').subscribe((result) => {
        // Assert
        expect(result).toEqual(validation);
        done();
      });
    });

    it('should throw when data is empty', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(of({ data: [], success: true, message: '', statusCode: 200 }));

      // Act
      service.validateUnitForDiscard('U1').subscribe({
        error: (e) => {
          // Assert
          expect(e.message).toBe('No validation data returned');
          done();
        },
      });
    });

    it('should propagate error', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(throwError(() => new Error('fail')));

      // Act
      service.validateUnitForDiscard('U1').subscribe({ error: (e) => { expect(e).toBeTruthy(); done(); } });
    });
  });

  // -----------------------------------------------------------------------
  // getAvailableCatalogs
  // -----------------------------------------------------------------------
  describe('getAvailableCatalogs', () => {
    it('should return catalog strings', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(of({ data: ['CAT001', 'CAT002'], success: true, message: '', statusCode: 200 }));

      // Act
      service.getAvailableCatalogs('U1', 'CH1').subscribe((result) => {
        // Assert
        expect(result).toEqual(['CAT001', 'CAT002']);
        done();
      });
    });

    it('should propagate error', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(throwError(() => new Error('fail')));

      // Act
      service.getAvailableCatalogs('U1').subscribe({ error: (e) => { expect(e).toBeTruthy(); done(); } });
    });
  });

  // -----------------------------------------------------------------------
  // discardBag
  // -----------------------------------------------------------------------
  describe('discardBag', () => {
    it('should return first item from response data', (done) => {
      // Arrange
      const responseItem = { unitId: 'U1', collectionDate: '2024-01-01', componentPrefix: 1, catalogNumber: 'CAT001', rejectReasonCode: 'R1', componentStatus: 'D' };
      apiSpy.post.and.returnValue(of({ data: [responseItem], success: true, message: '', statusCode: 200 }));

      // Act
      service.discardBag({ unitId: 'U1', catalogNumber: 'CAT001', rejectReasonCode: 'R1' }).subscribe((result) => {
        // Assert
        expect(result).toEqual(responseItem);
        done();
      });
    });

    it('should throw when data is empty', (done) => {
      // Arrange
      apiSpy.post.and.returnValue(of({ data: [], success: true, message: '', statusCode: 200 }));

      // Act
      service.discardBag({ unitId: 'U1', catalogNumber: 'CAT001', rejectReasonCode: 'R1' }).subscribe({
        error: (e) => {
          // Assert
          expect(e.message).toBe('No data returned from discard API');
          done();
        },
      });
    });

    it('should propagate error', (done) => {
      // Arrange
      apiSpy.post.and.returnValue(throwError(() => new Error('fail')));

      // Act
      service.discardBag({} as any).subscribe({ error: (e) => { expect(e).toBeTruthy(); done(); } });
    });
  });
});
