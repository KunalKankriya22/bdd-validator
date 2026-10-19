import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { ValidDonationTypeProcedureCodeService } from './valid-donation-type-procedure-code.service';
import { ApiService } from '../../../../../shared/services/api.service';
import { API } from '../../../../../core/constants/api.constants';

describe('ValidDonationTypeProcedureCodeService', () => {
  let service: ValidDonationTypeProcedureCodeService;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ValidDonationTypeProcedureCodeService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(ValidDonationTypeProcedureCodeService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  // ── getValidDonationTypeProcedureCodes ────────────────────────────────────────

  describe('getValidDonationTypeProcedureCodes', () => {
    it('should calculate skip from pageNumber/pageSize and transform data to PascalCase', (done) => {
      // Arrange
      const apiData = [{
        donationType: 'DT1', procedureCode: 'PC1', attribGroup: 'AG1',
        attribCode: 'AC1', effDate: '2024-01-01', termDate: null,
        sortSequence: 1, lastModifiedDate: '2024-01-01', programId: 'P1', status: 'A'
      }];
      apiService.post.and.returnValue(of({ success: true, message: '', statusCode: 200, data: apiData, total: 1, errorResponse: null }));

      // Act
      service.getValidDonationTypeProcedureCodes(2, 10).subscribe((result) => {
        // Assert
        expect(result.data[0].DonationType).toBe('DT1');
        expect(result.data[0].ProcedureCode).toBe('PC1');
        expect(result.totalRecords).toBe(1);
        // pageNumber=2, pageSize=10 => skip=10, take=10
        expect(apiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.VALID_DONATION_PROC_ATTRIBUTES_GET(10, 10),
          jasmine.objectContaining({ searchKeyword: '', donationType: '', procedureCode: '' })
        );
        done();
      });
    });

    it('should use filter params when provided', (done) => {
      // Arrange
      apiService.post.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [], total: 0, errorResponse: null }));
      const params = { searchKeyword: 'test', donationType: 'DT1', procedureCode: 'PC1', attributeGroup: 'AG1', attributeCode: 'AC1', effectiveDate: '2024-01-01', period: 'on', terminationDate: null, terminationPeriod: '', sort: 'donationType asc' };

      // Act
      service.getValidDonationTypeProcedureCodes(1, 25, params).subscribe(() => {
        // Assert
        const payload = apiService.post.calls.mostRecent().args[1] as any;
        expect(payload.searchKeyword).toBe('test');
        expect(payload.donationType).toBe('DT1');
        expect(payload.attribGroup).toBe('AG1');
        expect(payload.attribCode).toBe('AC1');
        expect(payload.effectivePeriod).toBe('on');
        expect(payload.sort).toBe('donationType asc');
        done();
      });
    });

    it('should return empty data and zero totalRecords when response data is null', (done) => {
      // Arrange
      apiService.post.and.returnValue(of({ success: true, message: '', statusCode: 200, data: null, total: null, errorResponse: null }));

      // Act
      service.getValidDonationTypeProcedureCodes(1, 25).subscribe((result) => {
        // Assert
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });
    });
  });

  // ── getFilters ───────────────────────────────────────────────────────────────

  describe('getFilters', () => {
    it('should forkJoin three LOV endpoints and return combined result', (done) => {
      // Arrange
      apiService.get.and.returnValues(
        of({ data: [{ donationType: 'DT1' }] }),
        of({ data: [{ procedureCode: 'PC1' }] }),
        of({ data: [{ attribGroup: 'AG1' }] })
      );

      // Act
      service.getFilters().subscribe((result) => {
        // Assert
        expect(result.success).toBeTrue();
        expect(result.data.donationTypes.length).toBe(1);
        expect(result.data.procedureCodes.length).toBe(1);
        expect(result.data.attributeGroups.length).toBe(1);
        expect(apiService.get).toHaveBeenCalledTimes(3);
        done();
      });
    });

    it('should return empty arrays when responses have no data', (done) => {
      // Arrange
      apiService.get.and.returnValues(
        of({ data: null }),
        of({ data: null }),
        of({ data: null })
      );

      // Act
      service.getFilters().subscribe((result) => {
        // Assert
        expect(result.data.donationTypes).toEqual([]);
        expect(result.data.procedureCodes).toEqual([]);
        expect(result.data.attributeGroups).toEqual([]);
        done();
      });
    });
  });

  // ── getDonationTypes ─────────────────────────────────────────────────────────

  describe('getDonationTypes', () => {
    it('should return data array from LOV endpoint', (done) => {
      // Arrange
      apiService.get.and.returnValue(of({ data: [{ donationType: 'DT1', description: 'Type 1' }] }));

      // Act
      service.getDonationTypes().subscribe((result) => {
        // Assert
        expect(result.data.length).toBe(1);
        expect(apiService.get).toHaveBeenCalledWith(API.APPLICATION_ADMIN.VALID_DONATION_PROC_ATTRIBUTES_DONATION_TYPES_LOV);
        done();
      });
    });
  });

  // ── getProcedureCodes ────────────────────────────────────────────────────────

  describe('getProcedureCodes', () => {
    it('should return data array from LOV endpoint', (done) => {
      // Arrange
      apiService.get.and.returnValue(of({ data: [{ procedureCode: 'PC1' }] }));

      // Act
      service.getProcedureCodes().subscribe((result) => {
        // Assert
        expect(result.data.length).toBe(1);
        expect(apiService.get).toHaveBeenCalledWith(API.APPLICATION_ADMIN.VALID_DONATION_PROC_ATTRIBUTES_PROCEDURE_CODES_LOV);
        done();
      });
    });
  });

  // ── getAttributeGroups ───────────────────────────────────────────────────────

  describe('getAttributeGroups', () => {
    it('should return data array from LOV endpoint', (done) => {
      // Arrange
      apiService.get.and.returnValue(of({ data: [{ attribGroup: 'AG1' }] }));

      // Act
      service.getAttributeGroups().subscribe((result) => {
        // Assert
        expect(result.data.length).toBe(1);
        expect(apiService.get).toHaveBeenCalledWith(API.APPLICATION_ADMIN.VALID_DONATION_PROC_ATTRIBUTES_ATTRIB_GROUPS_LOV);
        done();
      });
    });
  });

  // ── getAttributeCodes ────────────────────────────────────────────────────────

  describe('getAttributeCodes', () => {
    it('should call base URL without query param when no attribGroup provided', (done) => {
      // Arrange
      apiService.get.and.returnValue(of({ data: [{ attribCode: 'AC1' }] }));

      // Act
      service.getAttributeCodes().subscribe((result) => {
        // Assert
        expect(result.data.length).toBe(1);
        expect(apiService.get).toHaveBeenCalledWith(API.APPLICATION_ADMIN.VALID_DONATION_PROC_ATTRIBUTES_ATTRIB_CODES_LOV);
        done();
      });
    });

    it('should append attribGroup query param when provided', (done) => {
      // Arrange
      apiService.get.and.returnValue(of({ data: [] }));

      // Act
      service.getAttributeCodes('GRP1').subscribe(() => {
        // Assert
        const calledUrl = apiService.get.calls.mostRecent().args[0] as string;
        expect(calledUrl).toContain('attribGroup=GRP1');
        done();
      });
    });
  });

  // ── addRecord ────────────────────────────────────────────────────────────────

  describe('addRecord', () => {
    it('should POST data to the add endpoint', (done) => {
      // Arrange
      const dto = { donationType: 'DT1', procedureCode: 'PC1' } as any;
      const mockResponse = { success: true, message: 'Added', statusCode: 200 };
      apiService.post.and.returnValue(of(mockResponse));

      // Act
      service.addRecord(dto).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse);
        expect(apiService.post).toHaveBeenCalledWith(API.APPLICATION_ADMIN.VALID_DONATION_PROC_ATTRIBUTES_ADD, dto);
        done();
      });
    });
  });

  // ── updateRecord ─────────────────────────────────────────────────────────────

  describe('updateRecord', () => {
    it('should PUT data to the update endpoint', (done) => {
      // Arrange
      const dto = { donationType: 'DT1', procedureCode: 'PC1' } as any;
      const mockResponse = { success: true, message: 'Updated', statusCode: 200 };
      apiService.put.and.returnValue(of(mockResponse));

      // Act
      service.updateRecord(dto).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse);
        expect(apiService.put).toHaveBeenCalledWith(API.APPLICATION_ADMIN.VALID_DONATION_PROC_ATTRIBUTES_UPDATE, dto);
        done();
      });
    });
  });

  // ── getAllDropdownOptions ─────────────────────────────────────────────────────

  describe('getAllDropdownOptions', () => {
    it('should forkJoin three LOV endpoints and return combined dropdown data', (done) => {
      // Arrange
      apiService.get.and.returnValues(
        of({ data: [{ donationType: 'DT1' }] }),
        of({ data: [{ procedureCode: 'PC1' }] }),
        of({ data: [{ attribGroup: 'AG1' }] })
      );

      // Act
      service.getAllDropdownOptions().subscribe((result) => {
        // Assert
        expect(result.donationTypes.length).toBe(1);
        expect(result.procedureCodes.length).toBe(1);
        expect(result.attributeGroups.length).toBe(1);
        done();
      });
    });
  });
});
