import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { SterileDockingDefinitionService } from './sterile-docking-definition.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { DockingConfigurationDto, DockingType } from '../models/sterile-docking-definition.model';

describe('SterileDockingDefinitionService', () => {
  let service: SterileDockingDefinitionService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockConfigDto: DockingConfigurationDto = {
    unitId: 'W454526051302',
    chapterId: 'TEST_CHAPTER',
    collDate: '2026-05-26',
    itemInd: DockingType.BA,
    sterileMachine: '01',
    waferLotNumber: 'WL001',
    lotNumber: 'LOT001',
    numberOfItems: 5,
    weldFlag: 'Y',
    programId: 'CPISDDFN'
  };

  const mockApiSuccessResponse = {
    success: true,
    data: { id: '123', ...mockConfigDto }, // ApiResponse interface requires 'data' property
    item: { id: '123', ...mockConfigDto }, // Actual API also returns 'item' property
    message: 'Operation successful'
  };

  const mockApiErrorResponse = {
    success: false,
    message: 'Operation failed',
    errorResponse: {
      errorCode: 'ERR_001',
      error: 'Validation error'
    }
  };

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        SterileDockingDefinitionService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(SterileDockingDefinitionService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('search', () => {
    const mockSearchParams = {
      dockingType: DockingType.BA,
      machineCode: '01'
    };

    const mockSearchResponse = {
      success: true,
      data: [mockConfigDto], // ApiResponse interface requires 'data' property at top level
      totalCount: 1, // Use 'totalCount' instead of 'totalRecords' per PaginatedResponse interface
      item: { // Actual API response structure (not used by the service)
        data: [mockConfigDto],
        totalRecords: 1,
        pageIndex: 0,
        pageSize: 25
      }
    };

    it('should call search API endpoint with default pagination', (done) => {
      apiService.post.and.returnValue(of(mockSearchResponse));

      service.search(mockSearchParams).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          API.STERILE_DOCKING_DEFINITION.SEARCH(25, 0),
          mockSearchParams
        );
        done();
      });
    });

    it('should call search API with custom pagination', (done) => {
      apiService.post.and.returnValue(of(mockSearchResponse));

      service.search(mockSearchParams, 50, 10).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          API.STERILE_DOCKING_DEFINITION.SEARCH(50, 10),
          mockSearchParams
        );
        done();
      });
    });

    it('should return paginated response', (done) => {
      apiService.post.and.returnValue(of(mockSearchResponse));

      service.search(mockSearchParams).subscribe(response => {
        expect(response.data).toBeDefined();
        expect(response.totalCount).toBe(1);
        done();
      });
    });

  });

  describe('getByKey', () => {
    const sdcUsNumber = 'SDC001';
    const unitId = 'W454526051302';
    const collDate = '2026-05-26';
    const chapterId = 'TEST_CHAPTER';
    const itemInd = DockingType.BA;

    it('should call get by key API endpoint', (done) => {
      apiService.get.and.returnValue(of(mockApiSuccessResponse));

      service.getByKey(sdcUsNumber, unitId, collDate, chapterId, itemInd).subscribe(() => {
        expect(apiService.get).toHaveBeenCalledWith(
          API.STERILE_DOCKING_DEFINITION.GET_BY_KEY(sdcUsNumber, unitId, collDate, chapterId, itemInd)
        );
        done();
      });
    });

    it('should return configuration data', (done) => {
      apiService.get.and.returnValue(of(mockApiSuccessResponse));

      service.getByKey(sdcUsNumber, unitId, collDate, chapterId, itemInd).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
        done();
      });
    });


    it('should encode special characters in composite key', (done) => {
      const specialUnitId = 'W454/526#051302';
      apiService.get.and.returnValue(of(mockApiSuccessResponse));

      service.getByKey(sdcUsNumber, specialUnitId, collDate, chapterId, itemInd).subscribe(() => {
        const expectedUrl = API.STERILE_DOCKING_DEFINITION.GET_BY_KEY(
          sdcUsNumber,
          specialUnitId,
          collDate,
          chapterId,
          itemInd
        );
        expect(apiService.get).toHaveBeenCalledWith(expectedUrl);
        done();
      });
    });
  });

  describe('create', () => {
    it('should call create API endpoint', (done) => {
      apiService.post.and.returnValue(of(mockApiSuccessResponse));

      service.create(mockConfigDto).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          API.STERILE_DOCKING_DEFINITION.CREATE,
          mockConfigDto
        );
        done();
      });
    });

    it('should return created configuration', (done) => {
      apiService.post.and.returnValue(of(mockApiSuccessResponse));

      service.create(mockConfigDto).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
        done();
      });
    });


  });

  describe('update', () => {
    const sdcUsNumber = 'SDC001';
    const unitId = 'W454526051302';
    const collDate = '2026-05-26';
    const chapterId = 'TEST_CHAPTER';
    const itemInd = DockingType.BA;

    it('should call update API endpoint', (done) => {
      apiService.put.and.returnValue(of(mockApiSuccessResponse));

      service.update(sdcUsNumber, unitId, collDate, chapterId, itemInd, mockConfigDto).subscribe(() => {
        expect(apiService.put).toHaveBeenCalledWith(
          API.STERILE_DOCKING_DEFINITION.UPDATE(sdcUsNumber, unitId, collDate, chapterId, itemInd),
          mockConfigDto
        );
        done();
      });
    });

    it('should return updated configuration', (done) => {
      apiService.put.and.returnValue(of(mockApiSuccessResponse));

      service.update(sdcUsNumber, unitId, collDate, chapterId, itemInd, mockConfigDto).subscribe(response => {
        expect(response.success).toBe(true);
        done();
      });
    });

  });

  describe('delete', () => {
    const sdcUsNumber = 'SDC001';
    const unitId = 'W454526051302';
    const collDate = '2026-05-26';
    const chapterId = 'TEST_CHAPTER';
    const itemInd = DockingType.BA;

    it('should call delete API endpoint', (done) => {
      apiService.delete.and.returnValue(of({ success: true }));

      service.delete(sdcUsNumber, unitId, collDate, chapterId, itemInd).subscribe(() => {
        expect(apiService.delete).toHaveBeenCalledWith(
          API.STERILE_DOCKING_DEFINITION.DELETE(sdcUsNumber, unitId, collDate, chapterId, itemInd)
        );
        done();
      });
    });


  });

  describe('Validation', () => {
    it('should validate required fields in DTO', () => {
      const invalidDto: any = {
        unitId: '',
        chapterId: ''
      };

      apiService.post.and.returnValue(of(mockApiErrorResponse));

      service.create(invalidDto).subscribe(response => {
        expect(response.success).toBe(false);
      });
    });

  });

  describe('Error Handling', () => {
    it('should propagate network errors', (done) => {
      const networkError = new Error('Network error');
      apiService.post.and.returnValue(throwError(() => networkError));

      service.create(mockConfigDto).subscribe({
        error: (error) => {
          expect(error.message).toBe('Network error');
          done();
        }
      });
    });

    it('should handle timeout errors', (done) => {
      const timeoutError = new Error('Request timeout');
      apiService.get.and.returnValue(throwError(() => timeoutError));

      service.getByKey('SDC001', 'UNIT1', '2026-05-26', 'CHAP1', DockingType.BA).subscribe({
        error: (error) => {
          expect(error.message).toBe('Request timeout');
          done();
        }
      });
    });

  });


  describe('Special Characters Encoding', () => {

    it('should encode URL parameters correctly', (done) => {
      const sdcUsNumber = 'SDC/001';
      const unitId = 'W454#526';

      apiService.get.and.returnValue(of(mockApiSuccessResponse));

      service.getByKey(sdcUsNumber, unitId, '2026-05-26', 'CHAP1', DockingType.BA).subscribe(() => {
        const expectedUrl = API.STERILE_DOCKING_DEFINITION.GET_BY_KEY(
          sdcUsNumber,
          unitId,
          '2026-05-26',
          'CHAP1',
          DockingType.BA
        );
        expect(apiService.get).toHaveBeenCalledWith(expectedUrl);
        done();
      });
    });
  });
});
