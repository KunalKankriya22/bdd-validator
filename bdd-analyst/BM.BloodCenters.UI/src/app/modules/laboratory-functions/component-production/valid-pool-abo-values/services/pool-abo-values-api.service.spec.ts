import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { PoolAboValuesApiService } from './pool-abo-values-api.service';
import { ApiService } from '@shared/services/api.service';

describe('PoolAboValuesApiService', () => {
  let service: PoolAboValuesApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    // Arrange
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        PoolAboValuesApiService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(PoolAboValuesApiService);
  });

  describe('getValidAboPooledSldList', () => {
    it('should return list of Valid ABO Pooled SLD records with default sort', (done) => {
      // Arrange
      const mockResponse = {
        success: true,
        message: 'Successfully fetched Valid ABO Pooled SLD records',
        statusCode: 200,
        data: [
          {
            opos: 'Y',
            oneg: 'N',
            apos: 'Y',
            aneg: 'N',
            bpos: 'N',
            bneg: 'N',
            abpos: 'N',
            abneg: 'N',
            unitSchemeType: 'I',
            rhLabelFlag: 'Y',
            poolSld: 'AB01',
            poolSldDesc: 'ABO Group AB01',
            effDate: '01-Jan-2025',
            termDate: '31-Dec-2025',
            auditKey: 'ABCD1234'
          }
        ]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getValidAboPooledSldList().subscribe((result) => {
        // Assert
        expect(result.length).toBe(1);
        expect(result[0].poolSld).toBe('AB01');
        expect(result[0].unitSchemeType).toBe('I');
        expect(result[0].rhLabelFlag).toBe('Y');
        done();
      });
    });


    it('should handle error when fetching list', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('API error')));

      // Act
      service.getValidAboPooledSldList().subscribe({
        error: (error) => {
          // Assert
          expect(error.message).toBe('API error');
          done();
        }
      });
    });

  });

  describe('searchValidAboPooledSld', () => {
    it('should return paginated search results with total count', (done) => {
      // Arrange
      const mockResponse = {
        success: true,
        message: 'Successfully retrieved records.',
        statusCode: 200,
        data: [
          {
            opos: 'Y',
            oneg: 'N',
            apos: 'Y',
            aneg: 'N',
            bpos: 'N',
            bneg: 'N',
            abpos: 'N',
            abneg: 'N',
            unitSchemeType: 'I',
            rhLabelFlag: 'Y',
            poolSld: 'AB01',
            poolSldDesc: 'A Pos / B Pos',
            effDate: '01-Jan-2025',
            termDate: '',
            auditKey: '12345'
          }
        ],
        total: 42
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.searchValidAboPooledSld(10, 0, {}).subscribe((result) => {
        // Assert
        expect(result.success).toBeTrue();
        expect(result.statusCode).toBe(200);
        expect(result.data.length).toBe(1);
        expect(result.total).toBe(42);
        expect(result.data[0].poolSld).toBe('AB01');
        done();
      });
    });

    it('should send correct pagination parameters', (done) => {
      // Arrange
      const mockResponse = { success: true, data: [], total: 0 };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.searchValidAboPooledSld(25, 50, {}).subscribe(() => {
        // Assert
        const url = apiServiceSpy.post.calls.mostRecent().args[0];
        expect(url).toContain('/25/50');
        done();
      });
    });

    it('should send filter parameters in request body', (done) => {
      // Arrange
      const mockResponse = { success: true, data: [], total: 0 };
      apiServiceSpy.post.and.returnValue(of(mockResponse));
      const searchRequest = {
        poolSld: 'AB01',
        unitSchemeType: 'I',
        rhLabelFlag: 'Y',
        searchItem: 'test',
        sortDirection: 'DESC'
      };

      // Act
      service.searchValidAboPooledSld(10, 0, searchRequest).subscribe(() => {
        // Assert
        const requestBody = apiServiceSpy.post.calls.mostRecent().args[1];
        expect(requestBody).toEqual(searchRequest);
        done();
      });
    });


    it('should handle error when searching', (done) => {
      // Arrange
      apiServiceSpy.post.and.returnValue(throwError(() => new Error('API error')));

      // Act
      service.searchValidAboPooledSld(10, 0, {}).subscribe({
        error: (error) => {
          // Assert
          expect(error.message).toBe('API error');
          done();
        }
      });
    });

    it('should handle 400 error for null request body', (done) => {
      // Arrange
      const errorResponse = {
        success: false,
        message: 'Request body is null',
        statusCode: 400
      };
      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      // Act
      service.searchValidAboPooledSld(10, 0, {}).subscribe({
        error: (error) => {
          // Assert
          expect(error.statusCode).toBe(400);
          done();
        }
      });
    });
  });

  describe('createValidAboPooledSld', () => {
    it('should create a Valid ABO Pooled SLD record', (done) => {
      // Arrange
      const mockResponse = {
        success: true,
        message: 'Valid ABO Pooled SLD record created successfully.',
        statusCode: 201,
        data: {
          opos: 'Y',
          oneg: 'N',
          apos: 'Y',
          aneg: 'N',
          bpos: 'N',
          bneg: 'N',
          abpos: 'N',
          abneg: 'N',
          unitSchemeType: 'I',
          rhLabelFlag: 'Y',
          poolSld: 'AB01',
          poolSldDesc: 'ABO Group AB01',
          effDate: '2025-01-01T00:00:00',
          termDate: '2025-12-31T00:00:00',
          auditKey: 'ABCD1234'
        }
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.createValidAboPooledSld({
        opos: 'Y',
        oneg: 'N',
        apos: 'Y',
        aneg: 'N',
        bpos: 'N',
        bneg: 'N',
        abpos: 'N',
        abneg: 'N',
        unitSchemeType: 'I',
        rhLabelFlag: 'Y',
        poolSld: 'AB01',
        effDate: '2025-01-01T00:00:00',
        termDate: '2025-12-31T00:00:00'
      }).subscribe((result) => {
        // Assert
        expect(result.success).toBeTrue();
        expect(result.statusCode).toBe(201);
        expect(result.data.poolSld).toBe('AB01');
        done();
      });
    });

  });

  describe('updateValidAboPooledSld', () => {
    it('should update a Valid ABO Pooled SLD record', (done) => {
      // Arrange
      const mockResponse = {
        success: true,
        message: 'Valid ABO Pooled SLD record updated successfully.',
        statusCode: 200,
        data: {
          auditKey: 'ABCD1234',
          opos: 'Y',
          oneg: 'Y',
          apos: 'N',
          aneg: 'N',
          bpos: 'N',
          bneg: 'N',
          abpos: 'N',
          abneg: 'N',
          unitSchemeType: 'C',
          rhLabelFlag: 'N',
          poolSld: 'AB01',
          poolSldDesc: 'ABO Group AB01',
          effDate: '2025-02-01T00:00:00',
          termDate: '2025-12-31T00:00:00'
        }
      };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      // Act
      service.updateValidAboPooledSld('ABCD1234', {
        opos: 'Y',
        oneg: 'Y',
        apos: 'N',
        aneg: 'N',
        bpos: 'N',
        bneg: 'N',
        abpos: 'N',
        abneg: 'N',
        unitSchemeType: 'C',
        rhLabelFlag: 'N',
        poolSld: 'AB01',
        poolSldDesc: 'ABO Group AB01',
        effDate: '2025-02-01T00:00:00',
        termDate: '2025-12-31T00:00:00'
      }).subscribe((result) => {
        // Assert
        expect(result.success).toBeTrue();
        expect(result.data.auditKey).toBe('ABCD1234');
        expect(result.data.unitSchemeType).toBe('C');
        done();
      });
    });

  });

  describe('getPoolSldLookup', () => {
    it('should return Pool SLD lookup values', (done) => {
      // Arrange
      const mockResponse = {
        success: true,
        message: 'Successfully fetched Pool SLD lookup values',
        statusCode: 200,
        data: [
          { aboLabel: 'AB01', aboShortName: 'ABO Group AB01' },
          { aboLabel: 'AB02', aboShortName: 'ABO Group AB02' },
          { aboLabel: 'O+', aboShortName: 'O Positive' }
        ]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getPoolSldLookup().subscribe((result) => {
        // Assert
        expect(result.length).toBe(3);
        expect(result[0].aboLabel).toBe('AB01');
        expect(result[0].aboShortName).toBe('ABO Group AB01');
        done();
      });
    });

    it('should handle error when fetching lookup', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('API error')));

      // Act
      service.getPoolSldLookup().subscribe({
        error: (error) => {
          // Assert
          expect(error.message).toBe('API error');
          done();
        }
      });
    });

  });
});
