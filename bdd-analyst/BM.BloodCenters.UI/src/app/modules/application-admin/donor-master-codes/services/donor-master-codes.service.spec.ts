import { of } from 'rxjs';
import { DonorMasterCodesService, MasterCode, CodeType, ApiResponse, MasterCodeFilter, CodeTypeFilter, CodeTypeResponse, CreateCodeTypeRequest, CreateCodeRequest } from './donor-master-codes.service';
import { ApiService } from '../../../../shared/services/api.service';

describe('DonorMasterCodesService', () => {
  let service: DonorMasterCodesService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['post', 'get', 'put', 'delete']);

    service = new DonorMasterCodesService(mockApiService as any);
  });

  describe('getMasterCodes', () => {
    it('should call apiService.post with correct URL and empty filter when none provided', () => {
      const mockResponse: ApiResponse<MasterCode[]> = {
        data: [],
        message: 'Success',
        statusCode: 200,
        success: true,
        total: 0
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getMasterCodes().subscribe();

      expect(mockApiService.post).toHaveBeenCalledWith('/api/v1/donor-master-codes/10/0', {});
    });

    it('should call apiService.post with custom take and skip values', () => {
      const mockResponse: ApiResponse<MasterCode[]> = {
        data: [],
        message: 'Success',
        statusCode: 200,
        success: true,
        total: 0
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getMasterCodes(25, 50).subscribe();

      expect(mockApiService.post).toHaveBeenCalledWith('/api/v1/donor-master-codes/25/50', {});
    });

    it('should pass filter to apiService.post when provided', () => {
      const filter: MasterCodeFilter = {
        codeType: 'APITY',
        searchKeyword: 'test',
        sort: 'A'
      };
      const mockResponse: ApiResponse<MasterCode[]> = {
        data: [],
        message: 'Success',
        statusCode: 200,
        success: true,
        total: 5
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getMasterCodes(10, 0, filter).subscribe();

      expect(mockApiService.post).toHaveBeenCalledWith('/api/v1/donor-master-codes/10/0', filter);
    });

    it('should map response to { data, total }', () => {
      const mockCodes: MasterCode[] = [
        {
          id: '1',
          codeType: 'APITY',
          code: 'APITY001',
          description: 'Test code',
          effDate: new Date('2025-01-11'),
          termDate: null,
          status: 'Active',
          isActive: true,
          changeControlFlag: 'N'
        }
      ];
      const mockResponse: ApiResponse<MasterCode[]> = {
        data: mockCodes,
        message: 'Success',
        statusCode: 200,
        success: true,
        total: 1
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getMasterCodes().subscribe(result => {
        expect(result.data).toEqual(mockCodes);
        expect(result.total).toBe(1);
      });
    });

    it('should default data to empty array when response.data is null', () => {
      const mockResponse = {
        data: null,
        message: 'Success',
        statusCode: 200,
        success: true,
        total: 0
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getMasterCodes().subscribe(result => {
        expect(result.data).toEqual([]);
      });
    });

    it('should default total to 0 when response.total is undefined', () => {
      const mockResponse = {
        data: [],
        message: 'Success',
        statusCode: 200,
        success: true
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getMasterCodes().subscribe(result => {
        expect(result.total).toBe(0);
      });
    });
  });

  describe('getMasterCodesByType', () => {
    it('should call apiService.post with correct URL including codeType', () => {
      const mockResponse: CodeTypeResponse = {
        codeType: 'APITY',
        description: 'Apheresis Item Type',
        termDate: null,
        items: [],
        total: 0
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getMasterCodesByType('APITY').subscribe();

      expect(mockApiService.post).toHaveBeenCalledWith('/api/v1/donor-master-codes/APITY/10/0', {});
    });

    it('should call apiService.post with custom take and skip values', () => {
      const mockResponse: CodeTypeResponse = {
        codeType: 'APITY',
        description: 'Test',
        termDate: null,
        items: [],
        total: 0
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getMasterCodesByType('APITY', 50, 100).subscribe();

      expect(mockApiService.post).toHaveBeenCalledWith('/api/v1/donor-master-codes/APITY/50/100', {});
    });

    it('should pass filter to apiService.post when provided', () => {
      const filter: CodeTypeFilter = {
        searchKeyword: 'search',
        effectiveDate: new Date('2025-01-01'),
        sort: 'D'
      };
      const mockResponse: CodeTypeResponse = {
        codeType: 'APITY',
        description: 'Test',
        termDate: null,
        items: [],
        total: 0
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getMasterCodesByType('APITY', 10, 0, filter).subscribe();

      expect(mockApiService.post).toHaveBeenCalledWith('/api/v1/donor-master-codes/APITY/10/0', filter);
    });

    it('should map response fields correctly', () => {
      const mockItems: CodeType[] = [
        {
          code: 'C001',
          codeType: 'APITY',
          description: 'Item 1',
          effDate: new Date('2025-01-01'),
          termDate: null
        }
      ];
      const mockResponse: CodeTypeResponse = {
        codeType: 'APITY',
        description: 'Apheresis Item Type',
        termDate: new Date('2026-12-31'),
        items: mockItems,
        total: 1
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getMasterCodesByType('APITY').subscribe(result => {
        expect(result.codeType).toBe('APITY');
        expect(result.description).toBe('Apheresis Item Type');
        expect(result.termDate).toEqual(new Date('2026-12-31'));
        expect(result.items).toEqual(mockItems);
        expect(result.total).toBe(1);
      });
    });

    it('should default items to empty array when response.items is null', () => {
      const mockResponse = {
        codeType: 'APITY',
        description: 'Test',
        termDate: null,
        items: null,
        total: 0
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getMasterCodesByType('APITY').subscribe(result => {
        expect(result.items).toEqual([]);
      });
    });

    it('should default total to 0 when response.total is undefined', () => {
      const mockResponse = {
        codeType: 'APITY',
        description: 'Test',
        termDate: null,
        items: []
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getMasterCodesByType('APITY').subscribe(result => {
        expect(result.total).toBe(0);
      });
    });
  });

  describe('getMasterCodesByCode', () => {
    it('should call apiService.post with correct URL encoding the code', () => {
      const mockResponse: ApiResponse<CodeType[]> = {
        data: [],
        message: 'Success',
        statusCode: 200,
        success: true,
        total: 0
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getMasterCodesByCode('TEST').subscribe();

      expect(mockApiService.post).toHaveBeenCalledWith(
        '/api/v1/donor-master-codes/by-code/25/0?code=TEST',
        jasmine.objectContaining({ searchKeyword: '' })
      );
    });

    it('should use custom take and skip values', () => {
      const mockResponse: ApiResponse<CodeType[]> = {
        data: [],
        message: 'Success',
        statusCode: 200,
        success: true,
        total: 0
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getMasterCodesByCode('ABC', 50, 10).subscribe();

      expect(mockApiService.post).toHaveBeenCalledWith(
        '/api/v1/donor-master-codes/by-code/50/10?code=ABC',
        jasmine.any(Object)
      );
    });

    it('should encode special characters in code parameter', () => {
      const mockResponse: ApiResponse<CodeType[]> = {
        data: [],
        message: 'Success',
        statusCode: 200,
        success: true,
        total: 0
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getMasterCodesByCode('A&B=C').subscribe();

      expect(mockApiService.post).toHaveBeenCalledWith(
        '/api/v1/donor-master-codes/by-code/25/0?code=A%26B%3DC',
        jasmine.any(Object)
      );
    });

    it('should build request body from filter with defaults for missing fields', () => {
      const mockResponse: ApiResponse<CodeType[]> = {
        data: [],
        message: 'Success',
        statusCode: 200,
        success: true,
        total: 0
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getMasterCodesByCode('TEST').subscribe();

      const requestBody = mockApiService.post.calls.mostRecent().args[1];
      expect(requestBody).toEqual({
        searchKeyword: '',
        effectiveDate: undefined,
        terminationDate: undefined,
        effectiveDatePeriod: 'AFTER',
        terminationDatePeriod: 'BEFORE',
        sort: undefined
      });
    });

    it('should use filter values when provided', () => {
      const filter: CodeTypeFilter = {
        searchKeyword: 'search term',
        effectiveDate: new Date('2025-06-01'),
        terminationDate: new Date('2026-01-01'),
        effectiveDatePeriod: 'BEFORE',
        terminationDatePeriod: 'AFTER',
        sort: 'D'
      };
      const mockResponse: ApiResponse<CodeType[]> = {
        data: [],
        message: 'Success',
        statusCode: 200,
        success: true,
        total: 0
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getMasterCodesByCode('TEST', 25, 0, filter).subscribe();

      const requestBody = mockApiService.post.calls.mostRecent().args[1];
      expect(requestBody).toEqual({
        searchKeyword: 'search term',
        effectiveDate: filter.effectiveDate,
        terminationDate: filter.terminationDate,
        effectiveDatePeriod: 'BEFORE',
        terminationDatePeriod: 'AFTER',
        sort: 'D'
      });
    });

    it('should return the raw API response', () => {
      const mockData: CodeType[] = [
        { code: 'C001', codeType: 'APITY', description: 'Item', effDate: new Date(), termDate: null }
      ];
      const mockResponse: ApiResponse<CodeType[]> = {
        data: mockData,
        message: 'Success',
        statusCode: 200,
        success: true,
        total: 1
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getMasterCodesByCode('C001').subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(result.data).toEqual(mockData);
      });
    });
  });

  describe('getMasterCodeById', () => {
    it('should retrieve a single master code by id', () => {
      const mockCode: MasterCode = {
        id: '1',
        codeType: 'APITY',
        code: 'APITY001',
        description: 'Equipment malfunction',
        effDate: new Date('2025-01-11'),
        termDate: null,
        status: 'Active',
        isActive: true,
        changeControlFlag: 'N'
      };

      mockApiService.get.and.returnValue(of(mockCode));

      service.getMasterCodeById('1').subscribe(result => {
        expect(result).toEqual(mockCode);
      });

      expect(mockApiService.get).toHaveBeenCalledWith('/api/v1/donor-master-codes/1');
    });
  });

  describe('createMasterCode', () => {
    it('should post to donor-master-code-types endpoint', () => {
      const request: CreateCodeTypeRequest = {
        codeType: 'NEWTYPE',
        description: 'New Code Type',
        effectiveDate: '2025-01-01',
        terminationDate: null,
        changeControlFlag: 'N',
        loggedInUserName: 'admin',
        chapterId: 'CH01'
      };
      const mockResponse: ApiResponse<CodeType> = {
        data: { code: 'NEWTYPE', codeType: 'NEWTYPE', description: 'New Code Type', effDate: new Date('2025-01-01'), termDate: null },
        message: 'Created',
        statusCode: 201,
        success: true
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.createMasterCode(request).subscribe(result => {
        expect(result).toEqual(mockResponse);
      });

      expect(mockApiService.post).toHaveBeenCalledWith('/api/v1/donor-master-code-types', request);
    });
  });

  describe('createCode', () => {
    it('should post to donor-master-codes endpoint', () => {
      const request: CreateCodeRequest = {
        codeType: 'APITY',
        code: 'NEWCODE',
        description: 'New Code',
        effectiveDate: '2025-03-15',
        terminationDate: null,
        sequence1: 1,
        sequence2: 2,
        sequence3: 3,
        numericalValue: 100,
        changeControlFlag: 'N',
        loggedInUserName: 'admin',
        chapterId: 'CH01'
      };
      const mockResponse: ApiResponse<CodeType> = {
        data: { code: 'NEWCODE', codeType: 'APITY', description: 'New Code', effDate: new Date('2025-03-15'), termDate: null },
        message: 'Created',
        statusCode: 201,
        success: true
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.createCode(request).subscribe(result => {
        expect(result).toEqual(mockResponse);
      });

      expect(mockApiService.post).toHaveBeenCalledWith('/api/v1/donor-master-codes', request);
    });
  });

  describe('updateMasterCode', () => {
    it('should put to donor-master-code-types endpoint with encoded codeType and code', () => {
      const updateData = {
        description: 'Updated Description',
        effectiveDate: '2025-01-01',
        terminationDate: '2026-12-31',
        chapterId: 'CH01',
        loggedInUserName: 'admin'
      };
      mockApiService.put.and.returnValue(of({ success: true }));

      service.updateMasterCode('APITY', 'CODE01', updateData).subscribe(result => {
        expect(result).toEqual({ success: true });
      });

      expect(mockApiService.put).toHaveBeenCalledWith('/api/v1/donor-master-code-types/APITY/CODE01', updateData);
    });

    it('should encode special characters in codeType and code', () => {
      const updateData = { description: 'Test' };
      mockApiService.put.and.returnValue(of({ success: true }));

      service.updateMasterCode('A&B', 'C=D', updateData).subscribe();

      expect(mockApiService.put).toHaveBeenCalledWith('/api/v1/donor-master-code-types/A%26B/C%3DD', updateData);
    });
  });

  describe('updateCode', () => {
    it('should put to donor-master-codes endpoint with encoded codeType and code', () => {
      const updateData = {
        description: 'Updated Code',
        effectiveDate: '2025-06-01',
        terminationDate: null,
        sequence1: 5,
        chapterId: 'CH01',
        loggedInUserName: 'admin'
      };
      mockApiService.put.and.returnValue(of({ success: true }));

      service.updateCode('APITY', 'CODE01', updateData).subscribe(result => {
        expect(result).toEqual({ success: true });
      });

      expect(mockApiService.put).toHaveBeenCalledWith('/api/v1/donor-master-codes/APITY/CODE01', updateData);
    });

    it('should encode special characters in codeType and code', () => {
      const updateData = { description: 'Test' };
      mockApiService.put.and.returnValue(of({ success: true }));

      service.updateCode('X&Y', 'Z=W', updateData).subscribe();

      expect(mockApiService.put).toHaveBeenCalledWith('/api/v1/donor-master-codes/X%26Y/Z%3DW', updateData);
    });
  });

  describe('createCodeType', () => {
    it('should post to donor-master-codes endpoint', () => {
      const codeType: CodeType = {
        code: 'NEW',
        codeType: 'NEWTYPE',
        description: 'New Type',
        effDate: new Date('2025-01-01'),
        termDate: null
      };
      mockApiService.post.and.returnValue(of(codeType));

      service.createCodeType(codeType).subscribe(result => {
        expect(result).toEqual(codeType);
      });

      expect(mockApiService.post).toHaveBeenCalledWith('/api/v1/donor-master-codes', codeType);
    });
  });

  describe('updateCodeType', () => {
    it('should put to donor-master-codes endpoint with id', () => {
      const codeType: CodeType = {
        code: 'UPD',
        codeType: 'UPDTYPE',
        description: 'Updated Type',
        effDate: new Date('2025-01-01'),
        termDate: null
      };
      mockApiService.put.and.returnValue(of(codeType));

      service.updateCodeType('123', codeType).subscribe(result => {
        expect(result).toEqual(codeType);
      });

      expect(mockApiService.put).toHaveBeenCalledWith('/api/v1/donor-master-codes/123', codeType);
    });
  });

  describe('getCodeTypesByCode', () => {
    it('should get code types from correct endpoint', () => {
      const mockCodes: MasterCode[] = [
        {
          id: '1',
          codeType: 'APITY',
          code: 'C001',
          description: 'Type 1',
          effDate: new Date('2025-01-01'),
          termDate: null,
          status: 'Active',
          isActive: true,
          changeControlFlag: 'N'
        }
      ];
      mockApiService.get.and.returnValue(of(mockCodes));

      service.getCodeTypesByCode('C001').subscribe(result => {
        expect(result).toEqual(mockCodes);
      });

      expect(mockApiService.get).toHaveBeenCalledWith('/api/v1/donor-master-codes/C001/code-types');
    });

    it('should return empty array when no code types found', () => {
      mockApiService.get.and.returnValue(of([]));

      service.getCodeTypesByCode('NONEXIST').subscribe(result => {
        expect(result).toEqual([]);
      });

      expect(mockApiService.get).toHaveBeenCalledWith('/api/v1/donor-master-codes/NONEXIST/code-types');
    });
  });

});
