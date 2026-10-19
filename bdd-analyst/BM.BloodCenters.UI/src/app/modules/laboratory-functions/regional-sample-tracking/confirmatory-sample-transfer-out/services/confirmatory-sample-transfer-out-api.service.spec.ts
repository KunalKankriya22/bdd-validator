import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ConfirmatorySampleTransferOutApiService } from './confirmatory-sample-transfer-out-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  BoxHeaderDto,
  FacilityDropdownDto,
  SampleTypeDropdownDto,
  TestIdDropdownDto,
  CreateBoxDto,
  UpdateBoxDto,
  AddUnitToBoxDto,
  UpdateUnitInBoxDto,
  AddTestToSampleDto,
  ValidateUnitDto,
  ValidateUnitResponseDto,
  ReturnResult,
} from '../models/confirmatory-sample-transfer-out.model';

describe('ConfirmatorySampleTransferOutApiService', () => {
  let service: ConfirmatorySampleTransferOutApiService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockBoxHeader: BoxHeaderDto = {
    boxId: 'C240010001',
    shipmentNo: 'SHIP001',
    facilityCode: 'LAB1',
    facilityDesc: 'External Lab 1',
    boxStatus: 'O',
    externalFacFlag: 'Y',
    packDate: '2024-01-15T00:00:00Z',
    closedDate: null,
    closedUser: null,
    unitCount: 1,
    units: null,
  };

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        ConfirmatorySampleTransferOutApiService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(ConfirmatorySampleTransferOutApiService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  // ── getOpenBoxes ──────────────────────────────────────────────────────

  describe('getOpenBoxes', () => {
    it('should return boxes from response data', (done) => {
      const mockResponse: ReturnResult<BoxHeaderDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: [mockBoxHeader],
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getOpenBoxes().subscribe({
        next: (boxes) => {
          expect(boxes.length).toBe(1);
          expect(boxes[0].boxId).toBe('C240010001');
          done();
        },
      });

      expect(apiService.get).toHaveBeenCalledWith(API.CONFIRMATORY_SAMPLE_TRANSFER_OUT.GET_OPEN_BOXES);
    });

    it('should return empty array when response data is null', (done) => {
      const mockResponse: ReturnResult<BoxHeaderDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: null as any,
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getOpenBoxes().subscribe({
        next: (boxes) => {
          expect(boxes).toEqual([]);
          done();
        },
      });
    });
  });

  // ── getBoxDetails ─────────────────────────────────────────────────────

  describe('getBoxDetails', () => {
    it('should return the first box from response data', (done) => {
      const mockResponse: ReturnResult<BoxHeaderDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: [mockBoxHeader],
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getBoxDetails('C240010001').subscribe({
        next: (box) => {
          expect(box.boxId).toBe('C240010001');
          done();
        },
      });

      expect(apiService.get).toHaveBeenCalledWith(
        API.CONFIRMATORY_SAMPLE_TRANSFER_OUT.GET_BOX_DETAILS('C240010001')
      );
    });

    it('should throw error when response data is empty', (done) => {
      const mockResponse: ReturnResult<BoxHeaderDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: [],
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getBoxDetails('NOTEXIST').subscribe({
        error: (error) => {
          expect(error.message).toBe('Box not found');
          done();
        },
      });
    });

    it('should throw error when response data is null', (done) => {
      const mockResponse: ReturnResult<BoxHeaderDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: null as any,
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getBoxDetails('NOTEXIST').subscribe({
        error: (error) => {
          expect(error.message).toBe('Box not found');
          done();
        },
      });
    });
  });

  // ── createBox ─────────────────────────────────────────────────────────

  describe('createBox', () => {
    const createDto: CreateBoxDto = {
      facilityCode: 'LAB1',
      shipmentNo: 'SHIP001',
    };

    it('should return the new box id on success', (done) => {
      const mockResponse: ReturnResult<string[]> = {
        success: true,
        statusCode: 201,
        message: 'Created',
        data: ['C240010001'],
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.createBox(createDto).subscribe({
        next: (boxId) => {
          expect(boxId).toBe('C240010001');
          done();
        },
      });

      expect(apiService.post).toHaveBeenCalled();
    });

    it('should throw structured error when success is false', (done) => {
      const mockResponse: ReturnResult<string[]> = {
        success: false,
        statusCode: 400,
        message: 'Facility code is invalid',
        errorCode: '1390',
        data: [],
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.createBox(createDto).subscribe({
        error: (error) => {
          expect(error.message).toContain('Facility code is invalid');
          expect(error.status).toBe(400);
          expect(error.error.errorCode).toBe('1390');
          done();
        },
      });
    });

    it('should default status to 400 when statusCode is falsy', (done) => {
      const mockResponse = {
        success: false,
        statusCode: 0,
        message: 'Error',
        data: [],
      } as any;

      apiService.post.and.returnValue(of(mockResponse));

      service.createBox(createDto).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });
    });
  });

  // ── updateBox ─────────────────────────────────────────────────────────

  describe('updateBox', () => {
    const updateDto: UpdateBoxDto = { facilityCode: 'LAB2', shipmentNo: 'SHIP002' };

    it('should complete without error on success', (done) => {
      const mockResponse: ReturnResult<void> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: undefined as any,
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.updateBox('C240010001', updateDto).subscribe({
        next: () => {
          done();
        },
      });

      expect(apiService.put).toHaveBeenCalled();
    });

    it('should throw structured error when success is false', (done) => {
      const mockResponse: ReturnResult<void> = {
        success: false,
        statusCode: 404,
        message: 'Box not found',
        errorCode: '1400',
        data: undefined as any,
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.updateBox('NOTEXIST', updateDto).subscribe({
        error: (error) => {
          expect(error.message).toBe('Box not found');
          expect(error.status).toBe(404);
          expect(error.error.errorCode).toBe('1400');
          done();
        },
      });
    });

    it('should default status to 404 when statusCode is falsy', (done) => {
      const mockResponse = {
        success: false,
        statusCode: 0,
        message: 'Error',
        data: undefined,
      } as any;

      apiService.put.and.returnValue(of(mockResponse));

      service.updateBox('BOX1', updateDto).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });
    });
  });

  // ── closeBox ──────────────────────────────────────────────────────────

  describe('closeBox', () => {
    it('should complete without error on success', (done) => {
      const mockResponse: ReturnResult<void> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: undefined as any,
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.closeBox('C240010001').subscribe({
        next: () => {
          done();
        },
      });

      expect(apiService.post).toHaveBeenCalled();
    });

    it('should throw structured error when success is false', (done) => {
      const mockResponse: ReturnResult<void> = {
        success: false,
        statusCode: 404,
        message: 'Box not found',
        errorCode: '1401',
        data: undefined as any,
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.closeBox('NOTEXIST').subscribe({
        error: (error) => {
          expect(error.message).toBe('Box not found');
          expect(error.status).toBe(404);
          done();
        },
      });
    });

    it('should default status to 404 when statusCode is falsy', (done) => {
      const mockResponse = {
        success: false,
        statusCode: 0,
        message: 'Error',
        data: undefined,
      } as any;

      apiService.post.and.returnValue(of(mockResponse));

      service.closeBox('BOX1').subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });
    });
  });

  // ── addUnitToBox ──────────────────────────────────────────────────────

  describe('addUnitToBox', () => {
    const addDto: AddUnitToBoxDto = {
      unitId: 'U001',
      collDate: '2024-01-10',
      sampleType: 'SER',
      frozenFlag: 'N',
    };

    it('should return raw ReturnResult on success', (done) => {
      const mockResponse: ReturnResult<string[]> = {
        success: true,
        statusCode: 200,
        message: 'Unit added',
        data: ['U001-01'],
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.addUnitToBox('C240010001', addDto).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(result.data[0]).toBe('U001-01');
          done();
        },
      });

      expect(apiService.post).toHaveBeenCalled();
    });
  });

  // ── updateUnitInBox ───────────────────────────────────────────────────

  describe('updateUnitInBox', () => {
    const updateUnitDto: UpdateUnitInBoxDto = {
      unitId: 'U001',
      collDate: '2024-01-10',
      sampleType: 'SER',
      frozenFlag: 'N',
    };

    it('should complete without error on success', (done) => {
      const mockResponse: ReturnResult<void> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: undefined as any,
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.updateUnitInBox('C240010001', 'U001-01', updateUnitDto).subscribe({
        next: () => {
          done();
        },
      });

      expect(apiService.put).toHaveBeenCalledWith(
        API.CONFIRMATORY_SAMPLE_TRANSFER_OUT.UPDATE_UNIT_IN_BOX('C240010001', 'U001-01'),
        updateUnitDto,
        jasmine.objectContaining({ context: jasmine.anything() })
      );
    });

    it('should throw structured error when success is false', (done) => {
      const mockResponse: ReturnResult<void> = {
        success: false,
        statusCode: 404,
        message: 'Unit not found',
        errorCode: '1410',
        data: undefined as any,
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.updateUnitInBox('C240010001', 'U001-01', updateUnitDto).subscribe({
        error: (error) => {
          expect(error.message).toBe('Unit not found');
          expect(error.status).toBe(404);
          expect(error.error.errorCode).toBe('1410');
          done();
        },
      });
    });

    it('should default status to 404 when statusCode is falsy', (done) => {
      const mockResponse = {
        success: false,
        statusCode: 0,
        message: 'Error',
        data: undefined,
      } as any;

      apiService.put.and.returnValue(of(mockResponse));

      service.updateUnitInBox('BOX1', 'SEQ1', updateUnitDto).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });
    });
  });

  // ── deleteUnitFromBox ─────────────────────────────────────────────────

  describe('deleteUnitFromBox', () => {
    it('should complete without error on success', (done) => {
      const mockResponse: ReturnResult<void> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: undefined as any,
      };

      apiService.delete.and.returnValue(of(mockResponse));

      service.deleteUnitFromBox('C240010001', 'U001-01').subscribe({
        next: () => {
          done();
        },
      });

      expect(apiService.delete).toHaveBeenCalledWith(
        API.CONFIRMATORY_SAMPLE_TRANSFER_OUT.DELETE_UNIT_FROM_BOX('C240010001', 'U001-01'),
        jasmine.objectContaining({ context: jasmine.anything() })
      );
    });

    it('should throw structured error when success is false', (done) => {
      const mockResponse: ReturnResult<void> = {
        success: false,
        statusCode: 404,
        message: 'Unit not found',
        errorCode: '1411',
        data: undefined as any,
      };

      apiService.delete.and.returnValue(of(mockResponse));

      service.deleteUnitFromBox('C240010001', 'U001-01').subscribe({
        error: (error) => {
          expect(error.message).toBe('Unit not found');
          expect(error.status).toBe(404);
          done();
        },
      });
    });

    it('should default status to 404 when statusCode is falsy', (done) => {
      const mockResponse = {
        success: false,
        statusCode: 0,
        message: 'Error',
        data: undefined,
      } as any;

      apiService.delete.and.returnValue(of(mockResponse));

      service.deleteUnitFromBox('BOX1', 'SEQ1').subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });
    });
  });

  // ── addTestToSample ───────────────────────────────────────────────────

  describe('addTestToSample', () => {
    const addTestDto: AddTestToSampleDto = {
      testId: 'T001',
      facilityCode: 'LAB1',
      unitId: 'U001',
      sampleType: 'SER',
      collDate: '2024-01-10',
    };

    it('should complete without error on success', (done) => {
      const mockResponse: ReturnResult<void> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: undefined as any,
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.addTestToSample('U001-01', addTestDto).subscribe({
        next: () => {
          done();
        },
      });

      expect(apiService.post).toHaveBeenCalledWith(
        API.CONFIRMATORY_SAMPLE_TRANSFER_OUT.ADD_TEST_TO_SAMPLE('U001-01'),
        addTestDto,
        jasmine.objectContaining({ context: jasmine.anything() })
      );
    });

    it('should throw structured error when success is false', (done) => {
      const mockResponse: ReturnResult<void> = {
        success: false,
        statusCode: 400,
        message: 'Test already exists',
        errorCode: '1420',
        data: undefined as any,
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.addTestToSample('U001-01', addTestDto).subscribe({
        error: (error) => {
          expect(error.message).toBe('Test already exists');
          expect(error.status).toBe(400);
          done();
        },
      });
    });

    it('should default status to 400 when statusCode is falsy', (done) => {
      const mockResponse = {
        success: false,
        statusCode: 0,
        message: 'Error',
        data: undefined,
      } as any;

      apiService.post.and.returnValue(of(mockResponse));

      service.addTestToSample('SEQ1', addTestDto).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });
    });
  });

  // ── deleteTestFromSample ──────────────────────────────────────────────

  describe('deleteTestFromSample', () => {
    it('should complete without error on success', (done) => {
      const mockResponse: ReturnResult<void> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: undefined as any,
      };

      apiService.delete.and.returnValue(of(mockResponse));

      service.deleteTestFromSample('U001-01', 'T001').subscribe({
        next: () => {
          done();
        },
      });

      expect(apiService.delete).toHaveBeenCalledWith(
        API.CONFIRMATORY_SAMPLE_TRANSFER_OUT.DELETE_TEST_FROM_SAMPLE('U001-01', 'T001'),
        jasmine.objectContaining({ context: jasmine.anything() })
      );
    });

    it('should throw structured error when success is false', (done) => {
      const mockResponse: ReturnResult<void> = {
        success: false,
        statusCode: 404,
        message: 'Test not found',
        errorCode: '1421',
        data: undefined as any,
      };

      apiService.delete.and.returnValue(of(mockResponse));

      service.deleteTestFromSample('U001-01', 'T001').subscribe({
        error: (error) => {
          expect(error.message).toBe('Test not found');
          expect(error.status).toBe(404);
          done();
        },
      });
    });

    it('should default status to 404 when statusCode is falsy', (done) => {
      const mockResponse = {
        success: false,
        statusCode: 0,
        message: 'Error',
        data: undefined,
      } as any;

      apiService.delete.and.returnValue(of(mockResponse));

      service.deleteTestFromSample('SEQ1', 'T1').subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });
    });
  });

  // ── validateUnit ──────────────────────────────────────────────────────

  describe('validateUnit', () => {
    const validateDto: ValidateUnitDto = { unitId: 'U001' };

    const mockValidateResponse: ValidateUnitResponseDto = {
      unitId: 'U001',
      checkDigit: '5',
      collectionDate: '2024-01-10',
      collDate: '2024-01-10',
      chapterId: 'ABC',
      contractId: 'CTR001',
      isValid: true,
      errorCode: null,
      errorMessage: null,
      hasComponents: false,
      componentCount: 0,
    };

    it('should return item when response has item property', (done) => {
      const mockResponse = { item: mockValidateResponse };

      apiService.post.and.returnValue(of(mockResponse));

      service.validateUnit(validateDto).subscribe({
        next: (result) => {
          expect(result.unitId).toBe('U001');
          expect(result.isValid).toBeTrue();
          done();
        },
      });

      expect(apiService.post).toHaveBeenCalled();
    });

    it('should return data[0] when response has data array', (done) => {
      const mockResponse = { data: [mockValidateResponse] };

      apiService.post.and.returnValue(of(mockResponse));

      service.validateUnit(validateDto).subscribe({
        next: (result) => {
          expect(result.unitId).toBe('U001');
          done();
        },
      });
    });

    it('should throw error when response has neither item nor data', (done) => {
      const mockResponse = {};

      apiService.post.and.returnValue(of(mockResponse));

      service.validateUnit(validateDto).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid validation response');
          done();
        },
      });
    });

    it('should throw error when data array is empty', (done) => {
      const mockResponse = { data: [] };

      apiService.post.and.returnValue(of(mockResponse));

      service.validateUnit(validateDto).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid validation response');
          done();
        },
      });
    });
  });

  // ── getActiveFacilities ───────────────────────────────────────────────

  describe('getActiveFacilities', () => {
    it('should return facilities from response data', (done) => {
      const mockFacilities: FacilityDropdownDto[] = [
        { code: 'LAB1', description: 'External Lab 1', isExternal: 'Y' },
      ];
      const mockResponse: ReturnResult<FacilityDropdownDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: mockFacilities,
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getActiveFacilities().subscribe({
        next: (facilities) => {
          expect(facilities.length).toBe(1);
          expect(facilities[0].code).toBe('LAB1');
          done();
        },
      });

      expect(apiService.get).toHaveBeenCalledWith(API.CONFIRMATORY_SAMPLE_TRANSFER_OUT.GET_FACILITIES);
    });

    it('should return empty array when response data is null', (done) => {
      const mockResponse: ReturnResult<FacilityDropdownDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: null as any,
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getActiveFacilities().subscribe({
        next: (facilities) => {
          expect(facilities).toEqual([]);
          done();
        },
      });
    });
  });

  // ── getActiveSampleTypes ──────────────────────────────────────────────

  describe('getActiveSampleTypes', () => {
    it('should return sample types from response data', (done) => {
      const mockSampleTypes: SampleTypeDropdownDto[] = [
        { code: 'SER', description: 'Serum' },
      ];
      const mockResponse: ReturnResult<SampleTypeDropdownDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: mockSampleTypes,
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getActiveSampleTypes().subscribe({
        next: (types) => {
          expect(types.length).toBe(1);
          expect(types[0].code).toBe('SER');
          done();
        },
      });

      expect(apiService.get).toHaveBeenCalledWith(API.CONFIRMATORY_SAMPLE_TRANSFER_OUT.GET_SAMPLE_TYPES);
    });

    it('should return empty array when response data is null', (done) => {
      const mockResponse: ReturnResult<SampleTypeDropdownDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: null as any,
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getActiveSampleTypes().subscribe({
        next: (types) => {
          expect(types).toEqual([]);
          done();
        },
      });
    });
  });

  // ── getActiveTestIds ──────────────────────────────────────────────────

  describe('getActiveTestIds', () => {
    it('should return test ids for a facility', (done) => {
      const mockTests: TestIdDropdownDto[] = [
        { testId: 'T001', testDesc: 'HIV Test', testGroup: 'VIRAL' },
      ];
      const mockResponse: ReturnResult<TestIdDropdownDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: mockTests,
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getActiveTestIds('LAB1').subscribe({
        next: (tests) => {
          expect(tests.length).toBe(1);
          expect(tests[0].testId).toBe('T001');
          done();
        },
      });

      expect(apiService.get).toHaveBeenCalledWith(
        API.CONFIRMATORY_SAMPLE_TRANSFER_OUT.GET_FACILITY_TESTS('LAB1')
      );
    });

    it('should return empty array when response data is null', (done) => {
      const mockResponse: ReturnResult<TestIdDropdownDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: null as any,
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getActiveTestIds('LAB1').subscribe({
        next: (tests) => {
          expect(tests).toEqual([]);
          done();
        },
      });
    });
  });
});
