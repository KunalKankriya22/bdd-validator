import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GradedDonorsQueryService } from './graded-donors-query.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  GradedDonorsQueryParams,
  GradedDonationsQueryResponse,
  GradedDonorsQueryResponse,
  UnitHoldsQueryResponse,
  DonorHoldsQueryResponse,
  NewGradedDonationsApiResponse,
  UnitHoldsQueryRequest,
  DonorHoldsQueryRequest
} from '../models/graded-donors-query.model';
import { of, throwError } from 'rxjs';
import moment from 'moment';

describe('GradedDonorsQueryService', () => {
  let service: GradedDonorsQueryService;
  let apiService: jasmine.SpyObj<ApiService>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        GradedDonorsQueryService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(GradedDonorsQueryService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('queryGradedDonations', () => {
    it('should query graded donations successfully with all parameters', (done) => {
      // Arrange
      const params: GradedDonorsQueryParams = {
        lastName: 'Smith',
        unitId: 'W12345',
        fromDate: new Date('2025-01-01'),
        toDate: new Date('2025-01-31'),
        take: 50,
        skip: 0
      };

      const mockApiResponse: NewGradedDonationsApiResponse = {
        success: true,
        statusCode: 200,
        data: [
          {
            transactionId: 'TR001',
            unitId: 'W12345',
            unitIdWithCheckDigit: 'W12345-6',
            lastName: 'Smith',
            firstName: 'John',
            dateOfBirth: '2025-01-15',
            gender: 'M',
            ssn: '***-**-1234',
            activeFlag: 'Y',
            insertDate: '2025-01-20T10:30:00',
            insertUser: 'USER1',
            gradedDonors: [
              {
                donorId: 'DN001',
                grade: 3,
                dgmId: 271,
                lastName: 'Smith',
                firstName: 'John',
                dateOfBirth: '2025-01-15',
                gender: 'M',
                potentialDuplicateFlag: 'A'
              }
            ]
          }
        ],
        total: 1
      };

      apiService.post.and.returnValue(of(mockApiResponse));

      // Act
      service.queryGradedDonations(params).subscribe(response => {
        // Assert
        expect(response.success).toBe(true);
        expect(response.data.length).toBe(1);
        expect(response.data[0].unitDeferId).toBe('W12345-6'); // Maps from unitIdWithCheckDigit
        expect(response.data[0].sex).toBe('M'); // Maps from gender
        expect(response.data[0].status).toBe('Active'); // Maps from activeFlag = 'Y'
        expect(response.data[0].dateOfBirth).toBe('15-JAN-2025');
        expect(response.data[0].insertDate).toContain('JAN-2025');
        expect(response.data[0].donorId).toBe('DN001'); // From first gradedDonor
        expect(apiService.post).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.GRADED_DONORS_QUERY.SEARCH,
          jasmine.objectContaining({
            LastName: 'Smith',
            EffectiveUnitId: 'W12345',
            UnitDeferId: 'W12345'
          })
        );
        done();
      });
    });

    it('should query graded donations with minimal parameters', (done) => {
      // Arrange
      const params: GradedDonorsQueryParams = {
        unitId: 'W12345'
      };

      const mockApiResponse: NewGradedDonationsApiResponse = {
        success: true,
        statusCode: 200,
        data: [],
        total: 0
      };

      apiService.post.and.returnValue(of(mockApiResponse));

      // Act
      service.queryGradedDonations(params).subscribe(response => {
        // Assert
        expect(response.success).toBe(true);
        expect(response.data.length).toBe(0);
        expect(apiService.post).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.GRADED_DONORS_QUERY.SEARCH,
          {
            LastName: null,
            EffectiveUnitId: 'W12345',
            UnitDeferId: 'W12345',
            FromDate: null,
            ToDate: null,
            Take: null,
            Skip: null,
            SortBy: null,
            SortOrder: null
          }
        );
        done();
      });
    });

    it('should send all fields with null for unpopulated values', (done) => {
      const params: GradedDonorsQueryParams = {
        unitId: '00000806',
        unitDeferId: '00000806'
      };

      const mockApiResponse: GradedDonationsQueryResponse = {
        success: true,
        statusCode: 200,
        data: [],
        total: 0
      };

      apiService.post.and.returnValue(of(mockApiResponse));

      service.queryGradedDonations(params).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.GRADED_DONORS_QUERY.SEARCH,
          {
            LastName: null,
            EffectiveUnitId: '00000806',
            UnitDeferId: '00000806',
            FromDate: null,
            ToDate: null,
            Take: null,
            Skip: null,
            SortBy: null,
            SortOrder: null
          }
        );
        done();
      });
    });


    it('should format dates correctly for API request', (done) => {
      // Arrange
      const fromDate = new Date('2025-01-15');
      const toDate = new Date('2025-01-31');
      const params: GradedDonorsQueryParams = {
        fromDate: fromDate,
        toDate: toDate
      };

      const mockApiResponse: GradedDonationsQueryResponse = {
        success: true,
        statusCode: 200,
        data: [],
        total: 0
      };

      apiService.post.and.returnValue(of(mockApiResponse));

      // Act
      service.queryGradedDonations(params).subscribe(() => {
        // Assert
        expect(apiService.post).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.GRADED_DONORS_QUERY.SEARCH,
          jasmine.objectContaining({
            FromDate: '2025-01-15',
            ToDate: '2025-01-31'
          })
        );
        done();
      });
    });

    it('should trim whitespace from string parameters in request body', (done) => {
      const params: GradedDonorsQueryParams = {
        lastName: '  Smith  ',
        unitId: '  00000806  ',
        unitDeferId: '  00000806  '
      };

      apiService.post.and.returnValue(of({ success: true, data: [], total: 0 }));

      service.queryGradedDonations(params).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.GRADED_DONORS_QUERY.SEARCH,
          jasmine.objectContaining({
            LastName: 'Smith',
            EffectiveUnitId: '00000806',
            UnitDeferId: '00000806'
          })
        );
        done();
      });
    });

    it('should preserve zero values for take and skip parameters', (done) => {
      // Arrange
      const params: GradedDonorsQueryParams = {
        unitId: 'W12345',
        take: 0,
        skip: 0
      };

      const mockApiResponse: GradedDonationsQueryResponse = {
        success: true,
        statusCode: 200,
        data: [],
        total: 0
      };

      apiService.post.and.returnValue(of(mockApiResponse));

      // Act
      service.queryGradedDonations(params).subscribe(() => {
        // Assert
        expect(apiService.post).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.GRADED_DONORS_QUERY.SEARCH,
          jasmine.objectContaining({
            Take: 0,
            Skip: 0
          })
        );
        done();
      });
    });
  });

  describe('queryGradedDonors', () => {
    it('should query graded donors successfully and flatten nested gradedDonors', (done) => {
      // Arrange
      const params: GradedDonorsQueryParams = {
        lastName: 'Smith',
        unitId: 'W12345'
      };

      const mockApiResponse: NewGradedDonationsApiResponse = {
        success: true,
        statusCode: 200,
        data: [
          {
            transactionId: 'TR001',
            unitId: 'W12345',
            unitIdWithCheckDigit: 'W12345-6',
            lastName: 'Smith',
            firstName: 'John',
            dateOfBirth: '2025-01-15',
            gender: 'M',
            ssn: '***-**-1234',
            activeFlag: 'Y',
            insertDate: '2025-01-20T10:30:00',
            insertUser: 'USER1',
            gradedDonors: [
              {
                donorId: 'DN001',
                grade: 3,
                dgmId: 271,
                lastName: 'Smith',
                firstName: 'John',
                dateOfBirth: '2025-01-15',
                gender: 'M',
                potentialDuplicateFlag: 'A'
              },
              {
                donorId: 'DN002',
                grade: 5,
                dgmId: 213,
                lastName: 'Smith',
                firstName: 'Jane',
                dateOfBirth: '2025-01-16',
                gender: 'F',
                potentialDuplicateFlag: 'B'
              }
            ]
          }
        ],
        total: 1
      };

      apiService.post.and.returnValue(of(mockApiResponse));

      // Act
      service.queryGradedDonors(params).subscribe(response => {
        // Assert - should flatten nested gradedDonors array
        expect(response.success).toBe(true);
        expect(response.data.length).toBe(2); // Two donors flattened from nested array
        expect(response.data[0].donorId).toBe('DN001');
        expect(response.data[0].matchGrade).toBe('3'); // grade converted to string
        expect(response.data[0].dgmLocation).toBe('271'); // dgmId converted to string
        expect(response.data[0].sex).toBe('M'); // gender mapped to sex
        expect(response.data[0].mergeFlag).toBe('A'); // potentialDuplicateFlag
        expect(response.data[0].unitDeferId).toBe('W12345-6'); // From parent unitIdWithCheckDigit
        expect(response.data[0].dateOfBirth).toBe('15-JAN-2025');
        expect(response.data[1].donorId).toBe('DN002');
        expect(response.total).toBe(2); // Total count of flattened donors
        done();
      });
    });


    it('should send same GradedDonorsQueryParamDto body as queryGradedDonations', (done) => {
      const params: GradedDonorsQueryParams = {
        unitId: '00000806',
        unitDeferId: '00000806'
      };

      apiService.post.and.returnValue(of({ success: true, data: [], total: 0 }));

      service.queryGradedDonors(params).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.GRADED_DONORS_QUERY.SEARCH,
          {
            LastName: null,
            EffectiveUnitId: '00000806',
            UnitDeferId: '00000806',
            FromDate: null,
            ToDate: null,
            Take: null,
            Skip: null,
            SortBy: null,
            SortOrder: null
          }
        );
        done();
      });
    });

    it('should transform multiple donor records correctly', (done) => {
      // Arrange
      const params: GradedDonorsQueryParams = {
        lastName: 'Smith'
      };

      // Use new API format with nested gradedDonors array
      const mockApiResponse: NewGradedDonationsApiResponse = {
        success: true,
        statusCode: 200,
        data: [
          {
            transactionId: 'TR001',
            unitId: 'W12345',
            unitIdWithCheckDigit: 'W12345-6',
            lastName: 'Smith',
            firstName: 'John',
            dateOfBirth: '1990-03-15',
            gender: 'M',
            ssn: '***-**-1234',
            activeFlag: 'Y',
            insertDate: '2025-01-20T10:30:00',
            insertUser: 'USER1',
            gradedDonors: [
              {
                donorId: 'DN001',
                grade: 3,
                dgmId: 271,
                lastName: 'Smith',
                firstName: 'John',
                dateOfBirth: '1990-03-15',
                gender: 'M',
                potentialDuplicateFlag: 'Y'
              },
              {
                donorId: 'DN002',
                grade: 5,
                dgmId: 213,
                lastName: 'Smith',
                firstName: 'Jane',
                dateOfBirth: '1985-07-22',
                gender: 'F',
                potentialDuplicateFlag: 'N'
              }
            ]
          }
        ],
        total: 1
      };

      apiService.post.and.returnValue(of(mockApiResponse));

      // Act
      service.queryGradedDonors(params).subscribe(response => {
        // Assert - should flatten nested gradedDonors
        expect(response.data.length).toBe(2);
        expect(response.data[0].dateOfBirth).toBe('15-MAR-1990');
        expect(response.data[1].dateOfBirth).toBe('22-JUL-1985');
        done();
      });
    });
  });

  describe('queryUnitHolds', () => {
    it('should query unit holds successfully with transactionId', (done) => {
      // Arrange
      const transactionId = 'TR12345';
      const chapterId = 'CHAP001';
      const userId = 'USER1';

      const mockApiResponse: any = {
        success: true,
        statusCode: 200,
        data: [
          {
            interType: 'HOLDS',
            interCode: 'QC001',
            description: 'Pending quality control review',
            entryDate: '2026-05-14T10:30:00',
            releaseDate: '2026-05-20'
          }
        ],
        total: 1
      };

      apiService.post.and.returnValue(of(mockApiResponse));

      // Act
      service.queryUnitHolds(transactionId, chapterId, userId).subscribe(response => {
        // Assert
        expect(response.success).toBe(true);
        expect(response.data.length).toBe(1);
        expect(response.data[0].type).toBe('HOLDS');
        expect(response.data[0].code).toBe('QC001');
        expect(response.data[0].entryDate).toContain('MAY-2026'); // Date formatted for display
        expect(response.data[0].terminationDate).toContain('MAY-2026'); // Date formatted for display
        expect(apiService.post).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.GRADED_DONORS_QUERY.UNIT_HOLDS,
          jasmine.objectContaining({ transactionId })
        );
        done();
      });
    });

  });

  describe('queryDonorHolds', () => {
    it('should query donor holds successfully with donorId', (done) => {
      // Arrange
      const donorId = 'DN001';
      const chapterId = 'CHAP001';
      const userId = 'USER1';

      const mockApiResponse: any = {
        success: true,
        statusCode: 200,
        data: [
          {
            interType: 'HOLDS',
            interCode: 'MED001',
            description: 'Low hemoglobin',
            unitId: 'UNIT001',
            entryDate: '2026-05-10T11:00:00',
            effDate: '2026-05-10',
            releaseDate: '2026-06-10'
          }
        ],
        total: 1
      };

      apiService.post.and.returnValue(of(mockApiResponse));

      // Act
      service.queryDonorHolds(donorId, chapterId, userId).subscribe(response => {
        // Assert
        expect(response.success).toBe(true);
        expect(response.data.length).toBe(1);
        expect(response.data[0].type).toBe('HOLDS');
        expect(response.data[0].code).toBe('MED001');
        expect(response.data[0].unitId).toBe('UNIT001');
        expect(response.data[0].entryDate).toContain('MAY-2026'); // Date formatted for display
        expect(response.data[0].effectiveDate).toContain('MAY-2026'); // Date formatted for display
        expect(response.data[0].terminationDate).toContain('JUN-2026'); // Date formatted for display
        expect(apiService.post).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.GRADED_DONORS_QUERY.DONOR_HOLDS,
          jasmine.objectContaining({ donorId })
        );
        done();
      });
    });

  });

  describe('getLastNamesLov', () => {
    it('should get last names list successfully', (done) => {
      // Arrange
      const mockResponse = {
        success: true,
        data: ['Smith', 'Johnson', 'Williams']
      };

      apiService.get.and.returnValue(of(mockResponse));

      // Act
      service.getLastNamesLov().subscribe(lastNames => {
        // Assert
        expect(lastNames.length).toBe(3);
        expect(lastNames).toContain('Smith');
        expect(apiService.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.GRADED_DONORS_QUERY.LAST_NAMES_LOV
        );
        done();
      });
    });


    it('should handle empty last names response', (done) => {
      // Arrange
      const mockResponse = {
        success: true,
        data: []
      };

      apiService.get.and.returnValue(of(mockResponse));

      // Act
      service.getLastNamesLov().subscribe(lastNames => {
        // Assert
        expect(lastNames.length).toBe(0);
        done();
      });
    });

    it('should handle API error for last names', (done) => {
      // Arrange
      apiService.get.and.returnValue(throwError(() => new Error('Not available')));

      // Act
      service.getLastNamesLov().subscribe(
        () => fail('should have failed'),
        (error) => {
          // Assert
          expect(error.message).toContain('not available');
          done();
        }
      );
    });
  });

  describe('getUnitIdsLov', () => {
    it('should get unit IDs list successfully with lastName', (done) => {
      // Arrange
      const mockResponse = {
        success: true,
        data: [
          { unitId: 'W12345', lastName: 'SMITH' },
          { unitId: 'W54321', lastName: 'DOE' },
          { unitId: 'W99999', lastName: 'JONES' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      // Act
      service.getUnitIdsLov().subscribe(unitIds => {
        // Assert
        expect(unitIds.length).toBe(3);
        expect(unitIds[0].unitId).toBe('W12345');
        expect(unitIds[0].lastName).toBe('SMITH');
        expect(unitIds[0].displayValue).toBe('W12345 - SMITH');
        expect(apiService.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.GRADED_DONORS_QUERY.UNIT_IDS_LOV
        );
        done();
      });
    });

    it('should handle unit IDs as array of objects with lastName', (done) => {
      // Arrange
      const mockResponse = {
        success: true,
        data: [
          { unitId: 'W12345', lastName: 'SMITH' },
          { unitId: 'W54321', lastName: 'DOE' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      // Act
      service.getUnitIdsLov().subscribe(unitIds => {
        // Assert
        expect(unitIds.length).toBe(2);
        expect(unitIds[0].unitId).toBe('W12345');
        expect(unitIds[0].displayValue).toBe('W12345 - SMITH');
        done();
      });
    });

    it('should format displayValue with unitId only when lastName is empty', (done) => {
      // Arrange
      const mockResponse = {
        success: true,
        data: [
          { unitId: 'W12345', lastName: '' },
          { unitId: 'W54321', lastName: 'DOE' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      // Act
      service.getUnitIdsLov().subscribe(unitIds => {
        // Assert
        expect(unitIds.length).toBe(2);
        expect(unitIds[0].displayValue).toBe('W12345');
        expect(unitIds[1].displayValue).toBe('W54321 - DOE');
        done();
      });
    });

    it('should handle API error for unit IDs', (done) => {
      // Arrange
      apiService.get.and.returnValue(throwError(() => new Error('Not available')));

      // Act
      service.getUnitIdsLov().subscribe(
        () => fail('should have failed'),
        (error) => {
          // Assert
          expect(error.message).toContain('not available');
          done();
        }
      );
    });

    it('should filter out empty unit IDs from objects array', (done) => {
      // Arrange - mimics real API response with empty unitId values
      const mockResponse = {
        success: true,
        data: [
          { unitId: 'W12345', lastName: 'SMITH' },
          { unitId: '', lastName: 'JONES' },
          { unitId: 'W54321', lastName: 'BROWN' },
          { unitId: '   ', lastName: 'DAVIS' },
          { unitId: 'W99999', lastName: 'MILLER' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      // Act
      service.getUnitIdsLov().subscribe(unitIds => {
        // Assert - should only have 3 valid unit IDs
        expect(unitIds.length).toBe(3);
        expect(unitIds.some(u => u.unitId === 'W12345')).toBe(true);
        expect(unitIds.some(u => u.unitId === 'W54321')).toBe(true);
        expect(unitIds.some(u => u.unitId === 'W99999')).toBe(true);
        expect(unitIds.some(u => u.unitId === '')).toBe(false);
        expect(unitIds.some(u => u.unitId === '   ')).toBe(false);
        done();
      });
    });
  });

  describe('getLastNamesLov - filtering empty values', () => {
    it('should filter out empty last names from objects array', (done) => {
      // Arrange
      const mockResponse = {
        success: true,
        data: [
          { unitId: 'W12345', lastName: 'SMITH' },
          { unitId: 'W54321', lastName: '' },
          { unitId: 'W99999', lastName: 'JONES' },
          { unitId: 'W11111', lastName: '   ' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      // Act
      service.getLastNamesLov().subscribe(lastNames => {
        // Assert - should only have 2 valid last names
        expect(lastNames.length).toBe(2);
        expect(lastNames).toContain('SMITH');
        expect(lastNames).toContain('JONES');
        expect(lastNames).not.toContain('');
        expect(lastNames).not.toContain('   ');
        done();
      });
    });

    it('should filter out empty last names from strings array', (done) => {
      // Arrange
      const mockResponse = {
        success: true,
        data: ['SMITH', '', 'JONES', '   ', 'BROWN']
      };

      apiService.get.and.returnValue(of(mockResponse));

      // Act
      service.getLastNamesLov().subscribe(lastNames => {
        // Assert
        expect(lastNames.length).toBe(3);
        expect(lastNames).toContain('SMITH');
        expect(lastNames).not.toContain('');
        done();
      });
    });
  });

  describe('Date Formatting', () => {
    it('should format date for display correctly', (done) => {
      // Arrange
      const params: GradedDonorsQueryParams = {
        unitId: 'W12345'
      };

      const mockApiResponse: GradedDonationsQueryResponse = {
        success: true,
        statusCode: 200,
        data: [
          {
            unitDeferId: 'W12345',
            lastName: 'Smith',
            firstName: 'John',
            dateOfBirth: '1990-03-15',
            sex: 'M',
            status: 'Pending',
            insertDate: '2025-01-20T10:30:00',
            insertUser: 'USER1'
          }
        ],
        total: 1
      };

      apiService.post.and.returnValue(of(mockApiResponse));

      // Act
      service.queryGradedDonations(params).subscribe(response => {
        // Assert
        expect(response.data[0].dateOfBirth).toBe('15-MAR-1990');
        expect(response.data[0].insertDate).toMatch(/\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}/);
        done();
      });
    });


  });

  describe('Edge Cases', () => {
    it('should handle response with no data property', (done) => {
      // Arrange
      const params: GradedDonorsQueryParams = {
        unitId: 'W12345'
      };

      const mockApiResponse: any = {
        success: true,
        statusCode: 200,
        total: 0
      };

      apiService.post.and.returnValue(of(mockApiResponse));

      // Act
      service.queryGradedDonations(params).subscribe(response => {
        // Assert
        expect(response.success).toBe(true);
        done();
      });
    });

    it('should handle large dataset transformation', (done) => {
      // Arrange
      const params: GradedDonorsQueryParams = {
        lastName: 'Smith'
      };

      const mockData = Array(100).fill(null).map((_, i) => ({
        unitDeferId: `W${i}`,
        lastName: 'Smith',
        firstName: 'John',
        dateOfBirth: '1990-01-15',
        sex: 'M',
        status: 'Pending',
        insertDate: '2025-01-20T10:30:00',
        insertUser: 'USER1'
      }));

      const mockApiResponse: GradedDonationsQueryResponse = {
        success: true,
        statusCode: 200,
        data: mockData,
        total: 100
      };

      apiService.post.and.returnValue(of(mockApiResponse));

      // Act
      service.queryGradedDonations(params).subscribe(response => {
        // Assert
        expect(response.data.length).toBe(100);
        expect(response.data[0].dateOfBirth).toBe('15-JAN-1990');
        done();
      });
    });
  });
});
