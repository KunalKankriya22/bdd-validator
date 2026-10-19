import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { EnterReagentsApiService } from './enter-reagents-into-repository-api.service';
import { ApiService } from '@shared/services/api.service';
import {
  ReagentStoreDto,
  CreateReagentStoreRequestDto,
  UpdateReagentStoreRequestDto,
  ReagentStoreQueryDto,
  TestLookupDto,
  ReagentTypeLookupDto,
  ReagentCodeLookupDto,
  SupplierLookupDto,
  CodeLookupDto,
  ApiResponse,
} from '../models/enter-reagents-into-repository.model';

describe('EnterReagentsApiService', () => {
  let service: EnterReagentsApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockReagent: ReagentStoreDto = {
    reagentId: 'RG001',
    testId: 'TST01',
    reagentType: 'ANTI',
    reagentCode: 'RC01',
    reagentStatus: 'A',
    receivedDate: '2026-01-01',
    expiryDate: '2027-01-01',
    supplierCode: 'SUP01',
    kitLotNumber: null,
    lotNumber: 'LOT001',
    containerId: null,
    controlInd: null,
    minStorageTemp: 2,
    maxStorageTemp: 8,
    storageLocation: 'LOC01',
    noOfTests: 100,
    visualQcFlag: 'Y',
    rejectReasonCode: null,
    disposition: null,
    licensedApproved: 'Y',
    packageInsertDate: null,
    labCode: null,
    chapterId: 'CH01',
    noteId: null,
    note: null,
    receivedBy: null
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        EnterReagentsApiService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(EnterReagentsApiService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getAll', () => {
    it('should return data and totalCount', (done) => {
      // Arrange
      const query: ReagentStoreQueryDto = { testId: 'TST01' };
      const mockResponse: ApiResponse<ReagentStoreDto[]> = {
        success: true,
        data: [mockReagent],
        totalCount: 1,
        statusCode: 200
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.getAll(10, 0, query).subscribe({
        next: (result) => {
          // Assert
          expect(result.data.length).toBe(1);
          expect(result.totalCount).toBe(1);
          expect(apiServiceSpy.post).toHaveBeenCalled();
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('getById', () => {
    it('should return reagent from response item', (done) => {
      // Arrange
      const mockResponse: ApiResponse<ReagentStoreDto> = {
        success: true,
        data: null as any,
        item: mockReagent,
        statusCode: 200
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getById('RG001', 'TST01').subscribe({
        next: (result) => {
          // Assert
          expect(result.reagentId).toBe('RG001');
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('create', () => {
    it('should post create request and return response', (done) => {
      // Arrange
      const dto = { testId: 'TST01', reagentType: 'ANTI', reagentCode: 'RC01', lotNumber: 'LOT001', noOfTests: 100, visualQcFlag: 'Y' } as CreateReagentStoreRequestDto;
      const mockResponse: ApiResponse<ReagentStoreDto> = { success: true, data: mockReagent, statusCode: 201 };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.create(dto).subscribe({
        next: (result) => {
          // Assert
          expect(result.success).toBe(true);
          expect(apiServiceSpy.post).toHaveBeenCalled();
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('update', () => {
    it('should put update request and return response', (done) => {
      // Arrange
      const dto = { lotNumber: 'LOT002', status: 'A' } as UpdateReagentStoreRequestDto;
      const mockResponse: ApiResponse<ReagentStoreDto> = { success: true, data: mockReagent, statusCode: 200 };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      // Act
      service.update('RG001', 'TST01', dto).subscribe({
        next: (result) => {
          // Assert
          expect(result.success).toBe(true);
          expect(apiServiceSpy.put).toHaveBeenCalled();
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('getTests', () => {
    it('should return test lookup array', (done) => {
      // Arrange
      const mockTests: TestLookupDto[] = [{ testId: 'TST01', testDesc: 'Test 1' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockTests }));

      // Act
      service.getTests().subscribe({
        next: (result) => {
          // Assert
          expect(result.length).toBe(1);
          expect(result[0].testId).toBe('TST01');
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('getReagentTypes', () => {
    it('should return reagent type lookup array', (done) => {
      // Arrange
      const mockTypes: ReagentTypeLookupDto[] = [{ code: 'ANTI', codeDesc: 'Antisera' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockTypes }));

      // Act
      service.getReagentTypes().subscribe({
        next: (result) => {
          // Assert
          expect(result.length).toBe(1);
          expect(result[0].code).toBe('ANTI');
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('getReagentCodes', () => {
    it('should return reagent code lookup array', (done) => {
      // Arrange
      const mockCodes: ReagentCodeLookupDto[] = [{ reagentCode: 'RC01', reagentName: 'Reagent 1' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockCodes }));

      // Act
      service.getReagentCodes('TST01').subscribe({
        next: (result) => {
          // Assert
          expect(result.length).toBe(1);
          expect(result[0].reagentCode).toBe('RC01');
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('getSuppliers', () => {
    it('should return supplier lookup array', (done) => {
      // Arrange
      const mockSuppliers: SupplierLookupDto[] = [{ supplierCode: 'SUP01', supplierName: 'Supplier 1' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockSuppliers }));

      // Act
      service.getSuppliers().subscribe({
        next: (result) => {
          // Assert
          expect(result.length).toBe(1);
          expect(result[0].supplierCode).toBe('SUP01');
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('getContainerTypes', () => {
    it('should return container type lookup array', (done) => {
      // Arrange
      const mockContainers: CodeLookupDto[] = [{ code: 'VL', codeDesc: 'Vial' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockContainers }));

      // Act
      service.getContainerTypes().subscribe({
        next: (result) => {
          // Assert
          expect(result.length).toBe(1);
          expect(result[0].code).toBe('VL');
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('getStorageLocations', () => {
    it('should return storage location lookup array', (done) => {
      // Arrange
      const mockLocations: CodeLookupDto[] = [{ code: 'LOC01', codeDesc: 'Refrigerator 1' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockLocations }));

      // Act
      service.getStorageLocations().subscribe({
        next: (result) => {
          // Assert
          expect(result.length).toBe(1);
          expect(result[0].code).toBe('LOC01');
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('getRejectReasons', () => {
    it('should return reject reason lookup array', (done) => {
      // Arrange
      const mockReasons: CodeLookupDto[] = [{ code: 'EXP', codeDesc: 'Expired' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockReasons }));

      // Act
      service.getRejectReasons().subscribe({
        next: (result) => {
          // Assert
          expect(result.length).toBe(1);
          expect(result[0].code).toBe('EXP');
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('getControlIndicators', () => {
    it('should return control indicator lookup array', (done) => {
      // Arrange
      const mockIndicators: CodeLookupDto[] = [{ code: 'POS', codeDesc: 'Positive Control' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockIndicators }));

      // Act
      service.getControlIndicators().subscribe({
        next: (result) => {
          // Assert
          expect(result.length).toBe(1);
          expect(result[0].code).toBe('POS');
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });
});
