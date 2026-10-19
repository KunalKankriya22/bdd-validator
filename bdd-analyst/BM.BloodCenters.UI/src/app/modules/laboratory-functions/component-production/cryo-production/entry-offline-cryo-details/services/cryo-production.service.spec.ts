import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CryoProductionService } from './cryo-production.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  CreateCryoProductionDto,
  UpdateCryoProductionDto,
  CryoProductionDto,
  CryoProductionQueryDto,
  ThawMethodDto,
  ApiResponse,
  CryoTemperatureRangeDto,
  CryoFreezeTimeRangeDto,
  UnitValidationRequestDto,
  UnitValidationResultDto,
  CentrifugeValidationDto,
  TemperatureValidationDto,
  FreezeTimeValidationDto,
  CheckBlInterdictionRequestDto,
  CheckBlInterdictionResponseDto,
  UpdateAddOnBagsRequestDto,
  UpdateAddOnBagsResponseDto,
  ValidateCatalogNumberRequestDto,
  ValidateCatalogNumberResponseDto,
  ValidateNewProductRequestDto,
  ValidateNewProductResponseDto
} from '../models/cryo-production.model';

describe('CryoProductionService', () => {
  let service: CryoProductionService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockThawMethods: ThawMethodDto[] = [
    { thawMethod: 'TH01', methodDesc: '37°C Water Bath', minTemp: 35, maxTemp: 39, effDate: '2024-01-01' },
    { thawMethod: 'TH02', methodDesc: 'Room Temperature Thaw', minTemp: 20, maxTemp: 25, effDate: '2024-01-01' },
    { thawMethod: 'TH03', methodDesc: 'Refrigerated Thaw', minTemp: 2, maxTemp: 8, effDate: '2024-01-01' }
  ];

  const mockCryoRecord: CryoProductionDto = {
    unitId: 'UNIT12345',
    collDate: '2026-06-05T00:00:00Z',
    oldProductCode: 'WB',
    oldProductDesc: 'Whole Blood',
    newProductCode: 'CRYO',
    newProductDesc: 'Cryoprecipitate',
    thawMethod: 'TH01',
    thawMethodDesc: '37°C Water Bath',
    thawTemperature: 37.5,
    sepDateTime: '2026-06-05T10:30:00Z',
    freezeTime: null,
    cryoOkFlag: null,
    rejectReasonCode: null,
    catalogNo: 'CAT12345',
    sepInd: 1,
    insertDate: '2026-06-05T10:30:15Z',
    insertUser: 'JDOE'
  };

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        CryoProductionService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(CryoProductionService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  afterEach(() => {
    // No HTTP verification needed as we're using mocked ApiService
  });

  describe('getActiveThawMethods', () => {
    it('should retrieve active thaw methods using GET endpoint', (done) => {
      const mockResponse: ApiResponse<ThawMethodDto[]> = {
        success: true,
        message: 'Active thaw methods retrieved successfully',
        statusCode: 200,
        data: mockThawMethods
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getActiveThawMethods().subscribe({
        next: (methods) => {
          expect(methods).toEqual(mockThawMethods);
          expect(methods.length).toBe(3);
          expect(apiService.get).toHaveBeenCalledWith(
            API.CRYO_PRODUCTION.THAW_METHODS
          );
          done();
        },
        error: done.fail
      });
    });


    it('should handle error when retrieving thaw methods fails', (done) => {
      const errorResponse = { error: { message: 'Server error' } };

      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getActiveThawMethods().subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });

    it('should return empty array when data property is undefined', (done) => {
      const mockResponse: ApiResponse<ThawMethodDto[]> = {
        success: true,
        message: 'Success',
        statusCode: 200
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getActiveThawMethods().subscribe({
        next: (methods) => {
          expect(methods).toEqual([]);
          done();
        },
        error: done.fail
      });
    });
  });

  describe('createCryoSeparation', () => {
    it('should create CRYO separation successfully', (done) => {
      const createDto: CreateCryoProductionDto = {
        unitId: 'UNIT12345',
        workflowMode: 'separation',
        oldProductCode: 'WB',
        newProductCode: 'CRYO',
        thawMethod: 'TH01',
        thawTemperature: 37.5,
        centrifugeId: 'C001',
        sepDateTime: '2026-06-05T10:30:00Z',
        catalogNo: 'CAT12345'
      };

      // Backend returns array in data property
      const mockResponse: ApiResponse<CryoProductionDto[]> = {
        success: true,
        message: 'CRYO separation committed successfully',
        statusCode: 201,
        data: [mockCryoRecord]
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.createCryoSeparation(createDto).subscribe({
        next: (record) => {
          expect(record).toEqual(mockCryoRecord);
          expect(record.unitId).toBe('UNIT12345');
          expect(apiService.post).toHaveBeenCalledWith(
            API.CRYO_PRODUCTION.CREATE,
            createDto
          );
          done();
        },
        error: done.fail
      });
    });

    it('should handle error when data is missing in response', (done) => {
      const createDto: CreateCryoProductionDto = {
        unitId: 'UNIT12345',
        workflowMode: 'separation',
        oldProductCode: 'WB',
        newProductCode: 'CRYO'
      };

      const mockResponse: ApiResponse<CryoProductionDto> = {
        success: true,
        message: 'Success',
        statusCode: 201
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.createCryoSeparation(createDto).subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toBe('No data returned from server');
          done();
        }
      });
    });

  });

  describe('updateCryoRecord', () => {
    it('should update CRYO record with freeze details', (done) => {
      const updateDto: UpdateCryoProductionDto = {
        freezeTime: '2026-06-05T14:00:00Z',
        cryoOkFlag: 'Y'
      };

      const updatedRecord = {
        ...mockCryoRecord,
        freezeTime: '2026-06-05T14:00:00Z',
        cryoOkFlag: 'Y'
      };

      // Backend returns array in data property
      const mockResponse: ApiResponse<CryoProductionDto[]> = {
        success: true,
        message: 'CRYO freeze details saved successfully',
        statusCode: 200,
        data: [updatedRecord]
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.updateCryoRecord('UNIT12345', updateDto).subscribe({
        next: (record) => {
          expect(record.freezeTime).toBe('2026-06-05T14:00:00Z');
          expect(record.cryoOkFlag).toBe('Y');
          expect(apiService.put).toHaveBeenCalledWith(
            API.CRYO_PRODUCTION.UPDATE('UNIT12345'),
            updateDto
          );
          done();
        },
        error: done.fail
      });
    });

    it('should handle 404 error when unit not found', (done) => {
      const updateDto: UpdateCryoProductionDto = {
        freezeTime: '2026-06-05T14:00:00Z',
        cryoOkFlag: 'Y'
      };

      const errorResponse = {
        error: {
          message: 'CRYO record not found for unit UNIT99999',
          statusCode: 404
        }
      };

      apiService.put.and.returnValue(throwError(() => errorResponse));

      service.updateCryoRecord('UNIT99999', updateDto).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error.error.statusCode).toBe(404);
          done();
        }
      });
    });

    it('should encode unit ID in URL', (done) => {
      const updateDto: UpdateCryoProductionDto = {
        freezeTime: '2026-06-05T14:00:00Z',
        cryoOkFlag: 'Y'
      };

      // Backend returns array in data property
      const mockResponse: ApiResponse<CryoProductionDto[]> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [mockCryoRecord]
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.updateCryoRecord('UNIT/12345', updateDto).subscribe({
        next: () => {
          expect(apiService.put).toHaveBeenCalledWith(
            API.CRYO_PRODUCTION.UPDATE('UNIT/12345'),
            updateDto
          );
          done();
        },
        error: done.fail
      });
    });
  });

  describe('getCryoRecordByUnitId', () => {
    it('should retrieve CRYO record by unit ID', (done) => {
      const mockResponse: ApiResponse<CryoProductionDto> = {
        success: true,
        message: 'Record retrieved successfully',
        statusCode: 200,
        data: mockCryoRecord
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getCryoRecordByUnitId('UNIT12345').subscribe({
        next: (record) => {
          expect(record).toEqual(mockCryoRecord);
          expect(record.unitId).toBe('UNIT12345');
          expect(apiService.get).toHaveBeenCalledWith(
            API.CRYO_PRODUCTION.GET_BY_UNIT('UNIT12345')
          );
          done();
        },
        error: done.fail
      });
    });

    it('should handle error when record not found', (done) => {
      const errorResponse = {
        error: {
          message: 'Unit not found or not yet separated',
          statusCode: 404
        }
      };

      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getCryoRecordByUnitId('UNIT99999').subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error.error.statusCode).toBe(404);
          done();
        }
      });
    });

    it('should throw error when data is missing', (done) => {
      const mockResponse: ApiResponse<CryoProductionDto> = {
        success: true,
        message: 'Success',
        statusCode: 200
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getCryoRecordByUnitId('UNIT12345').subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toBe('No data returned from server');
          done();
        }
      });
    });
  });

  describe('searchCryoRecords', () => {
    it('should search CRYO records with pagination', (done) => {
      const query: CryoProductionQueryDto = {
        collDateFrom: '2026-06-01T00:00:00Z',
        collDateTo: '2026-06-30T23:59:59Z',
        cryoOkFlag: 'Y'
      };

      const mockRecords = [mockCryoRecord];
      const mockResponse: ApiResponse<CryoProductionDto[]> = {
        success: true,
        message: 'Data retrieved successfully',
        statusCode: 200,
        data: mockRecords,
        totalCount: 42
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.searchCryoRecords(10, 0, query).subscribe({
        next: (result) => {
          expect(result.data).toEqual(mockRecords);
          expect(result.totalCount).toBe(42);
          expect(apiService.post).toHaveBeenCalledWith(
            API.CRYO_PRODUCTION.SEARCH(10, 0),
            query
          );
          done();
        },
        error: done.fail
      });
    });


    it('should handle pagination parameters correctly', (done) => {
      const query: CryoProductionQueryDto = {};
      const mockResponse: ApiResponse<CryoProductionDto[]> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        totalCount: 0
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.searchCryoRecords(25, 50, query).subscribe({
        next: () => {
          expect(apiService.post).toHaveBeenCalledWith(
            API.CRYO_PRODUCTION.SEARCH(25, 50),
            query
          );
          done();
        },
        error: done.fail
      });
    });
  });

  describe('deleteCryoRecord', () => {
    it('should delete CRYO record successfully', (done) => {
      const mockResponse: ApiResponse<void> = {
        success: true,
        message: 'Record deleted successfully',
        statusCode: 200
      };

      apiService.delete.and.returnValue(of(mockResponse));

      service.deleteCryoRecord('UNIT12345').subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
          expect(apiService.delete).toHaveBeenCalledWith(
            API.CRYO_PRODUCTION.DELETE('UNIT12345')
          );
          done();
        },
        error: done.fail
      });
    });

    it('should handle error when record not found', (done) => {
      const errorResponse = {
        error: {
          message: 'Record not found or already deleted',
          statusCode: 404
        }
      };

      apiService.delete.and.returnValue(throwError(() => errorResponse));

      service.deleteCryoRecord('UNIT99999').subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error.error.statusCode).toBe(404);
          done();
        }
      });
    });

    it('should handle component already labeled error', (done) => {
      const errorResponse = {
        error: {
          message: 'Cannot delete: component already labeled',
          errorCode: '0099'
        }
      };

      apiService.delete.and.returnValue(throwError(() => errorResponse));

      service.deleteCryoRecord('UNIT12345').subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error.error.errorCode).toBe('0099');
          done();
        }
      });
    });
  });

  describe('getTemperatureRanges', () => {
    it('should retrieve temperature ranges for thaw method', (done) => {
      const mockTempRange: CryoTemperatureRangeDto = {
        minTemp: 35,
        maxTemp: 39
      };

      const mockResponse: ApiResponse<CryoTemperatureRangeDto> = {
        success: true,
        message: 'Temperature ranges retrieved successfully',
        statusCode: 200,
        data: mockTempRange
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getTemperatureRanges('TH01').subscribe({
        next: (range) => {
          expect(range).toEqual(mockTempRange);
          expect(range.minTemp).toBe(35);
          expect(range.maxTemp).toBe(39);
          expect(apiService.get).toHaveBeenCalledWith(
            API.CRYO_PRODUCTION.TEMPERATURE_RANGES('TH01')
          );
          done();
        },
        error: done.fail
      });
    });

    it('should handle error when temperature ranges not found', (done) => {
      const errorResponse = {
        error: {
          message: 'Thaw method not found',
          statusCode: 404
        }
      };

      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getTemperatureRanges('INVALID').subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error.error.statusCode).toBe(404);
          done();
        }
      });
    });

    it('should throw error when data is missing', (done) => {
      const mockResponse: ApiResponse<CryoTemperatureRangeDto> = {
        success: true,
        message: 'Success',
        statusCode: 200
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getTemperatureRanges('TH01').subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toBe('No temperature range data returned from server');
          done();
        }
      });
    });
  });

  describe('getFreezeTimeRanges', () => {
    it('should retrieve freeze time ranges for thaw method', (done) => {
      const mockFreezeTimeRange: CryoFreezeTimeRangeDto = {
        minWsFreezeTime: 60,
        maxWsFreezeTime: 480,
        minSepFreezeTime: 5,
        maxSepFreezeTime: 60
      };

      const mockResponse: ApiResponse<CryoFreezeTimeRangeDto> = {
        success: true,
        message: 'Freeze time ranges retrieved successfully',
        statusCode: 200,
        data: mockFreezeTimeRange
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getFreezeTimeRanges('TH01').subscribe({
        next: (range) => {
          expect(range).toEqual(mockFreezeTimeRange);
          expect(range.minWsFreezeTime).toBe(60);
          expect(range.maxWsFreezeTime).toBe(480);
          expect(range.minSepFreezeTime).toBe(5);
          expect(range.maxSepFreezeTime).toBe(60);
          expect(apiService.get).toHaveBeenCalledWith(
            API.CRYO_PRODUCTION.FREEZE_TIME_RANGES('TH01')
          );
          done();
        },
        error: done.fail
      });
    });

    it('should handle error when freeze time ranges not found', (done) => {
      const errorResponse = {
        error: {
          message: 'Thaw method not found',
          statusCode: 404
        }
      };

      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getFreezeTimeRanges('INVALID').subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error.error.statusCode).toBe(404);
          done();
        }
      });
    });

    it('should throw error when data is missing', (done) => {
      const mockResponse: ApiResponse<CryoFreezeTimeRangeDto> = {
        success: true,
        message: 'Success',
        statusCode: 200
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getFreezeTimeRanges('TH01').subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toBe('No freeze time range data returned from server');
          done();
        }
      });
    });
  });

  describe('validateUnit', () => {
    it('should validate unit successfully in separation mode', (done) => {
      const request: UnitValidationRequestDto = {
        unitId: 'UNIT12345',
        workflowMode: 'separation'
      };

      const mockValidationResult: UnitValidationResultDto = {
        isValid: true,
        workflowMode: 'separation',
        oldProductCode: 'WB',
        oldProductDesc: 'Whole Blood',
        newProductCode: 'CRYO',
        newProductDesc: 'Cryoprecipitate',
        catalogNumber: 'CAT123',
        separationType: 'SECOND',
        hasFreeze: false,
        validationErrors: []
      };

      const mockResponse: ApiResponse<UnitValidationResultDto> = {
        success: true,
        message: 'Unit validated successfully',
        statusCode: 200,
        data: mockValidationResult
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.validateUnit(request).subscribe({
        next: (result) => {
          expect(result).toEqual(mockValidationResult);
          expect(result.isValid).toBe(true);
          expect(result.workflowMode).toBe('separation');
          expect(result.oldProductCode).toBe('WB');
          expect(apiService.post).toHaveBeenCalledWith(
            API.CRYO_PRODUCTION.VALIDATE_UNIT,
            request
          );
          done();
        },
        error: done.fail
      });
    });

    it('should validate unit successfully in freeze mode', (done) => {
      const request: UnitValidationRequestDto = {
        unitId: 'UNIT12345',
        workflowMode: 'freeze'
      };

      const mockValidationResult: UnitValidationResultDto = {
        isValid: true,
        workflowMode: 'freeze',
        oldProductCode: 'WB',
        newProductCode: 'CRYO',
        catalogNumber: 'CAT123',
        thawMethod: 'TH01',
        thawTemperature: 37.5,
        sepTime: '2026-06-05T10:30:00Z',
        hasFreeze: false,
        validationErrors: []
      };

      const mockResponse: ApiResponse<UnitValidationResultDto> = {
        success: true,
        message: 'Unit validated successfully',
        statusCode: 200,
        data: mockValidationResult
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.validateUnit(request).subscribe({
        next: (result) => {
          expect(result.workflowMode).toBe('freeze');
          expect(result.hasFreeze).toBe(false);
          expect(result.thawMethod).toBe('TH01');
          done();
        },
        error: done.fail
      });
    });

    it('should return validation errors when unit is invalid', (done) => {
      const request: UnitValidationRequestDto = {
        unitId: 'INVALID',
        workflowMode: 'separation'
      };

      const mockValidationResult: UnitValidationResultDto = {
        isValid: false,
        workflowMode: 'separation',
        hasFreeze: false,
        validationErrors: [
          { errorCode: 'ERR001', message: 'Unit not found in system' },
          { errorCode: 'ERR002', message: 'Invalid product type' }
        ]
      };

      const mockResponse: ApiResponse<UnitValidationResultDto> = {
        success: true,
        message: 'Validation failed',
        statusCode: 200,
        data: mockValidationResult
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.validateUnit(request).subscribe({
        next: (result) => {
          expect(result.isValid).toBe(false);
          expect(result.validationErrors.length).toBe(2);
          expect(result.validationErrors[0].errorCode).toBe('ERR001');
          expect(result.validationErrors[1].message).toBe('Invalid product type');
          done();
        },
        error: done.fail
      });
    });

    it('should handle API error during validation', (done) => {
      const request: UnitValidationRequestDto = {
        unitId: 'UNIT12345',
        workflowMode: 'separation'
      };

      const errorResponse = {
        error: {
          message: 'Database connection failed',
          statusCode: 500
        }
      };

      apiService.post.and.returnValue(throwError(() => errorResponse));

      service.validateUnit(request).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error.error.statusCode).toBe(500);
          done();
        }
      });
    });

    it('should throw error when data is missing', (done) => {
      const request: UnitValidationRequestDto = {
        unitId: 'UNIT12345',
        workflowMode: 'separation'
      };

      const mockResponse: ApiResponse<UnitValidationResultDto> = {
        success: true,
        message: 'Success',
        statusCode: 200
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.validateUnit(request).subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toBe('No validation data returned from server');
          done();
        }
      });
    });

    it('should handle validation without workflowMode', (done) => {
      const request: UnitValidationRequestDto = {
        unitId: 'UNIT12345'
      };

      const mockValidationResult: UnitValidationResultDto = {
        isValid: true,
        workflowMode: 'separation',
        hasFreeze: false,
        validationErrors: []
      };

      const mockResponse: ApiResponse<UnitValidationResultDto> = {
        success: true,
        message: 'Unit validated successfully',
        statusCode: 200,
        data: mockValidationResult
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.validateUnit(request).subscribe({
        next: (result) => {
          expect(result.isValid).toBe(true);
          expect(apiService.post).toHaveBeenCalledWith(
            API.CRYO_PRODUCTION.VALIDATE_UNIT,
            request
          );
          done();
        },
        error: done.fail
      });
    });
  });

  describe('validateCentrifuge', () => {
    it('should validate centrifuge successfully', (done) => {
      const mockResult: CentrifugeValidationDto = {
        isValid: true,
        centrifugeId: 'C001',
        description: 'Centrifuge 001',
        status: 'IN',
        isOnHold: false
      };

      const mockResponse: ApiResponse<CentrifugeValidationDto> = {
        success: true,
        message: 'Centrifuge validated successfully',
        statusCode: 200,
        data: mockResult
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.validateCentrifuge({ centrifugeId: 'C001' }).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResult);
          expect(result.isValid).toBe(true);
          expect(result.isOnHold).toBe(false);
          expect(apiService.post).toHaveBeenCalledWith(
            API.CRYO_PRODUCTION.VALIDATE_CENTRIFUGE,
            { centrifugeId: 'C001' }
          );
          done();
        },
        error: done.fail
      });
    });

    it('should return error when centrifuge is on hold', (done) => {
      const mockResult: CentrifugeValidationDto = {
        isValid: false,
        centrifugeId: 'C002',
        isOnHold: true,
        errorCode: '2071',
        errorMessage: 'This equipment is out of QC.'
      };

      const mockResponse: ApiResponse<CentrifugeValidationDto> = {
        success: true,
        message: 'Validation failed',
        statusCode: 200,
        data: mockResult
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.validateCentrifuge({ centrifugeId: 'C002' }).subscribe({
        next: (result) => {
          expect(result.isValid).toBe(false);
          expect(result.isOnHold).toBe(true);
          expect(result.errorCode).toBe('2071');
          done();
        },
        error: done.fail
      });
    });
  });

  describe('validateTemperature', () => {
    it('should validate temperature within range', (done) => {
      const mockResult: TemperatureValidationDto = {
        isValid: true,
        minTemp: 35,
        maxTemp: 39,
        actualTemp: 37,
        isOutOfRange: false
      };

      const mockResponse: ApiResponse<TemperatureValidationDto> = {
        success: true,
        message: 'Temperature validated successfully',
        statusCode: 200,
        data: mockResult
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.validateTemperature('TH01', 37).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResult);
          expect(result.isValid).toBe(true);
          expect(result.isOutOfRange).toBe(false);
          expect(apiService.post).toHaveBeenCalledWith(
            API.CRYO_PRODUCTION.VALIDATE_TEMPERATURE,
            { thawMethod: 'TH01', temperature: 37 }
          );
          done();
        },
        error: done.fail
      });
    });

    it('should return error when temperature out of range', (done) => {
      const mockResult: TemperatureValidationDto = {
        isValid: false,
        minTemp: 35,
        maxTemp: 39,
        actualTemp: 45,
        isOutOfRange: true,
        errorCode: 'CRTE',
        errorMessage: 'Temperature out of range'
      };

      const mockResponse: ApiResponse<TemperatureValidationDto> = {
        success: true,
        message: 'Validation failed',
        statusCode: 200,
        data: mockResult
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.validateTemperature('TH01', 45).subscribe({
        next: (result) => {
          expect(result.isValid).toBe(false);
          expect(result.isOutOfRange).toBe(true);
          expect(result.errorCode).toBe('CRTE');
          done();
        },
        error: done.fail
      });
    });
  });

  describe('validateFreezeTime', () => {
    it('should validate freeze time successfully', (done) => {
      const mockResult: FreezeTimeValidationDto = {
        isValid: true,
        freezeTime: '2026-06-05T14:00:00Z',
        sepTime: '2026-06-05T10:30:00Z',
        worksheetTime: '2026-06-05T08:00:00Z',
        sepToFreezeHours: 3.5,
        worksheetToFreezeHours: 6,
        minSepFreezeTime: 1,
        maxSepFreezeTime: 8,
        minWsFreezeTime: 1,
        maxWsFreezeTime: 8,
        crwsInterdiction: false,
        crseInterdiction: false
      };

      const mockResponse: ApiResponse<FreezeTimeValidationDto> = {
        success: true,
        message: 'Freeze time validated successfully',
        statusCode: 200,
        data: mockResult
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.validateFreezeTime('UNIT12345', '2026-06-05T14:00:00Z', 'TH01').subscribe({
        next: (result) => {
          expect(result).toEqual(mockResult);
          expect(result.isValid).toBe(true);
          expect(result.crwsInterdiction).toBe(false);
          expect(result.crseInterdiction).toBe(false);
          expect(apiService.post).toHaveBeenCalledWith(
            API.CRYO_PRODUCTION.VALIDATE_FREEZE_TIME,
            { unitId: 'UNIT12345', freezeTime: '2026-06-05T14:00:00Z', thawMethod: 'TH01' }
          );
          done();
        },
        error: done.fail
      });
    });

  });

  describe('checkBlInterdiction', () => {
    it('should check slow bleed interdiction successfully', (done) => {
      const request: CheckBlInterdictionRequestDto = {
        unitId: 'UNIT12345',
        newProductCode: 'CRYO'
      };

      const mockResult: CheckBlInterdictionResponseDto = {
        blInterdictionPlaced: false
      };

      const mockResponse: ApiResponse<CheckBlInterdictionResponseDto> = {
        success: true,
        message: 'BL interdiction check completed',
        statusCode: 200,
        data: mockResult
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.checkBlInterdiction(request).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResult);
          expect(result.blInterdictionPlaced).toBe(false);
          expect(apiService.post).toHaveBeenCalledWith(
            API.CRYO_PRODUCTION.CHECK_BL_INTERDICTION,
            request
          );
          done();
        },
        error: done.fail
      });
    });

  });

  describe('updateAddOnBags', () => {
    it('should update add-on bags successfully', (done) => {
      const request: UpdateAddOnBagsRequestDto = {
        unitId: 'UNIT12345',
        oldProductCode: 'WB',
        newProductCode: 'CRYO',
        collDate: '2026-06-05T00:00:00Z'
      };

      const mockResult: UpdateAddOnBagsResponseDto = {
        rowsUpdated: 2
      };

      const mockResponse: ApiResponse<UpdateAddOnBagsResponseDto> = {
        success: true,
        message: 'Add-on bags updated successfully',
        statusCode: 200,
        data: mockResult
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.updateAddOnBags(request).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResult);
          expect(result.rowsUpdated).toBe(2);
          expect(apiService.put).toHaveBeenCalledWith(
            API.CRYO_PRODUCTION.UPDATE_ADD_ON_BAGS,
            request
          );
          done();
        },
        error: done.fail
      });
    });

    it('should return 0 rows when no add-on bags to update', (done) => {
      const request: UpdateAddOnBagsRequestDto = {
        unitId: 'UNIT12345',
        oldProductCode: 'WB',
        newProductCode: 'CRYO',
        collDate: '2026-06-05T00:00:00Z'
      };

      const mockResult: UpdateAddOnBagsResponseDto = {
        rowsUpdated: 0
      };

      const mockResponse: ApiResponse<UpdateAddOnBagsResponseDto> = {
        success: true,
        message: 'No add-on bags found',
        statusCode: 200,
        data: mockResult
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.updateAddOnBags(request).subscribe({
        next: (result) => {
          expect(result.rowsUpdated).toBe(0);
          done();
        },
        error: done.fail
      });
    });
  });

  describe('validateCatalogNumber', () => {
    it('should validate catalog number successfully', (done) => {
      const request: ValidateCatalogNumberRequestDto = {
        unitId: 'UNIT12345',
        catalogNumber: 'CAT123'
      };

      const mockResult: ValidateCatalogNumberResponseDto = {
        isValid: true
      };

      const mockResponse: ApiResponse<ValidateCatalogNumberResponseDto> = {
        success: true,
        message: 'Catalog number validated successfully',
        statusCode: 200,
        data: mockResult
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.validateCatalogNumber(request).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResult);
          expect(result.isValid).toBe(true);
          expect(apiService.post).toHaveBeenCalledWith(
            API.CRYO_PRODUCTION.VALIDATE_CATALOG_NUMBER,
            request
          );
          done();
        },
        error: done.fail
      });
    });

  });

  describe('validateNewProduct', () => {
    it('should validate new product code successfully', (done) => {
      const request: ValidateNewProductRequestDto = {
        newProductCode: 'CRYO'
      };

      const mockResult: ValidateNewProductResponseDto = {
        isValid: true
      };

      const mockResponse: ApiResponse<ValidateNewProductResponseDto> = {
        success: true,
        message: 'Product code validated successfully',
        statusCode: 200,
        data: mockResult
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.validateNewProduct(request).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResult);
          expect(result.isValid).toBe(true);
          expect(apiService.post).toHaveBeenCalledWith(
            API.CRYO_PRODUCTION.VALIDATE_NEW_PRODUCT,
            request
          );
          done();
        },
        error: done.fail
      });
    });


  describe('getActiveCentrifuges', () => {
    it('should retrieve centrifuges', (done) => {
      apiService.get.and.returnValue(of({ data: [{ centrifugeId: 'C1' }] }));
      service.getActiveCentrifuges().subscribe({
        next: (result) => { expect(result.length).toBe(1); done(); },
        error: done.fail
      });
    });

    it('should return empty array when data is undefined', (done) => {
      apiService.get.and.returnValue(of({ success: true }));
      service.getActiveCentrifuges().subscribe({
        next: (result) => { expect(result).toEqual([]); done(); },
        error: done.fail
      });
    });

    it('should handle error', (done) => {
      apiService.get.and.returnValue(throwError(() => new Error('fail')));
      service.getActiveCentrifuges().subscribe({
        next: () => done.fail('Should error'),
        error: () => done()
      });
    });
  });

  describe('autoSelectProduct', () => {
    it('should auto-select product', (done) => {
      const req = { unitId: 'U1' } as any;
      apiService.post.and.returnValue(of({ data: { productCode: 'CRYO' } }));
      service.autoSelectProduct(req).subscribe({
        next: (result) => { expect(result.productCode).toBe('CRYO'); done(); },
        error: done.fail
      });
    });

    it('should throw when data is missing', (done) => {
      apiService.post.and.returnValue(of({ success: true }));
      service.autoSelectProduct({} as any).subscribe({
        next: () => done.fail('Should error'),
        error: (e) => { expect(e.message).toContain('No product selection data'); done(); }
      });
    });

    it('should handle error', (done) => {
      apiService.post.and.returnValue(throwError(() => new Error('fail')));
      service.autoSelectProduct({} as any).subscribe({
        next: () => done.fail('Should error'),
        error: () => done()
      });
    });
  });

  describe('getCatalogNumbers', () => {
    it('should retrieve catalog numbers', (done) => {
      apiService.get.and.returnValue(of({ data: [{ catalogNo: 'CAT1' }] }));
      service.getCatalogNumbers('U1', 'CRYO').subscribe({
        next: (result) => { expect(result.length).toBe(1); done(); },
        error: done.fail
      });
    });

    it('should return empty array when data is undefined', (done) => {
      apiService.get.and.returnValue(of({ success: true }));
      service.getCatalogNumbers('U1', 'CRYO').subscribe({
        next: (result) => { expect(result).toEqual([]); done(); },
        error: done.fail
      });
    });

    it('should handle error', (done) => {
      apiService.get.and.returnValue(throwError(() => new Error('fail')));
      service.getCatalogNumbers('U1', 'CRYO').subscribe({
        next: () => done.fail('Should error'),
        error: () => done()
      });
    });
  });

  describe('getOldProducts', () => {
    it('should retrieve old products', (done) => {
      apiService.get.and.returnValue(of({ data: [{ productCode: 'WB' }] }));
      service.getOldProducts('U1').subscribe({
        next: (result) => { expect(result.length).toBe(1); done(); },
        error: done.fail
      });
    });

    it('should return empty array when data is undefined', (done) => {
      apiService.get.and.returnValue(of({ success: true }));
      service.getOldProducts('U1').subscribe({
        next: (result) => { expect(result).toEqual([]); done(); },
        error: done.fail
      });
    });

    it('should handle error', (done) => {
      apiService.get.and.returnValue(throwError(() => new Error('fail')));
      service.getOldProducts('U1').subscribe({
        next: () => done.fail('Should error'),
        error: () => done()
      });
    });
  });

  describe('getProductVariants', () => {
    it('should retrieve product variants', (done) => {
      apiService.get.and.returnValue(of({ data: [{ productCode: 'V1' }] }));
      service.getProductVariants('CAT1', 'ACD', 450).subscribe({
        next: (result) => { expect(result.length).toBe(1); done(); },
        error: done.fail
      });
    });

    it('should return empty array when data is undefined', (done) => {
      apiService.get.and.returnValue(of({ success: true }));
      service.getProductVariants('CAT1').subscribe({
        next: (result) => { expect(result).toEqual([]); done(); },
        error: done.fail
      });
    });

    it('should handle error', (done) => {
      apiService.get.and.returnValue(throwError(() => new Error('fail')));
      service.getProductVariants('CAT1').subscribe({
        next: () => done.fail('Should error'),
        error: () => done()
      });
    });
  });

  describe('getSeparationInfo', () => {
    it('should retrieve separation info', (done) => {
      apiService.get.and.returnValue(of({ data: { unitId: 'U1' } }));
      service.getSeparationInfo('U1').subscribe({
        next: (result) => { expect(result.unitId).toBe('U1'); done(); },
        error: done.fail
      });
    });

    it('should throw when data is missing', (done) => {
      apiService.get.and.returnValue(of({ success: true }));
      service.getSeparationInfo('U1').subscribe({
        next: () => done.fail('Should error'),
        error: (e) => { expect(e.message).toContain('No separation info'); done(); }
      });
    });

    it('should handle error', (done) => {
      apiService.get.and.returnValue(throwError(() => new Error('fail')));
      service.getSeparationInfo('U1').subscribe({
        next: () => done.fail('Should error'),
        error: () => done()
      });
    });
  });

  describe('getIntendedUse', () => {
    it('should retrieve intended use', (done) => {
      apiService.get.and.returnValue(of({ data: { intendedUse: 'TRANS' } }));
      service.getIntendedUse('U1', 'CRYO').subscribe({
        next: (result) => { expect(result.intendedUse).toBe('TRANS'); done(); },
        error: done.fail
      });
    });

    it('should throw when data is missing', (done) => {
      apiService.get.and.returnValue(of({ success: true }));
      service.getIntendedUse('U1', 'CRYO').subscribe({
        next: () => done.fail('Should error'),
        error: (e) => { expect(e.message).toContain('No intended use data'); done(); }
      });
    });

    it('should handle error', (done) => {
      apiService.get.and.returnValue(throwError(() => new Error('fail')));
      service.getIntendedUse('U1', 'CRYO').subscribe({
        next: () => done.fail('Should error'),
        error: () => done()
      });
    });
  });

  describe('reprintLabel', () => {
    it('should reprint label and return message', (done) => {
      apiService.post.and.returnValue(of({ message: 'Printed' }));
      service.reprintLabel({ unitId: 'U1' } as any).subscribe({
        next: (result) => { expect(result).toBe('Printed'); done(); },
        error: done.fail
      });
    });

    it('should return default message when response has no message', (done) => {
      apiService.post.and.returnValue(of({}));
      service.reprintLabel({ unitId: 'U1' } as any).subscribe({
        next: (result) => { expect(result).toBe('Label reprinted successfully'); done(); },
        error: done.fail
      });
    });

    it('should handle error', (done) => {
      apiService.post.and.returnValue(throwError(() => new Error('fail')));
      service.reprintLabel({ unitId: 'U1' } as any).subscribe({
        next: () => done.fail('Should error'),
        error: () => done()
      });
    });
  });

  describe('createCryoSeparation - error', () => {
    it('should propagate API error', (done) => {
      apiService.post.and.returnValue(throwError(() => ({ error: 'fail' })));
      service.createCryoSeparation({ unitId: 'U1' } as any).subscribe({
        next: () => done.fail('Should error'),
        error: (e) => { expect(e.error).toBe('fail'); done(); }
      });
    });

    it('should throw when data array is empty', (done) => {
      apiService.post.and.returnValue(of({ data: [] }));
      service.createCryoSeparation({ unitId: 'U1' } as any).subscribe({
        next: () => done.fail('Should error'),
        error: (e) => { expect(e.message).toContain('No data returned'); done(); }
      });
    });
  });

  describe('updateCryoRecord - missing data', () => {
    it('should throw when data is missing', (done) => {
      apiService.put.and.returnValue(of({ success: true }));
      service.updateCryoRecord('U1', {} as any).subscribe({
        next: () => done.fail('Should error'),
        error: (e) => { expect(e.message).toContain('No data returned'); done(); }
      });
    });

    it('should throw when data array is empty', (done) => {
      apiService.put.and.returnValue(of({ data: [] }));
      service.updateCryoRecord('U1', {} as any).subscribe({
        next: () => done.fail('Should error'),
        error: (e) => { expect(e.message).toContain('No data returned'); done(); }
      });
    });
  });

  describe('searchCryoRecords - error', () => {
    it('should propagate error', (done) => {
      apiService.post.and.returnValue(throwError(() => new Error('fail')));
      service.searchCryoRecords(10, 0, {} as any).subscribe({
        next: () => done.fail('Should error'),
        error: () => done()
      });
    });

    it('should return defaults when data/totalCount missing', (done) => {
      apiService.post.and.returnValue(of({ success: true }));
      service.searchCryoRecords(10, 0, {} as any).subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          expect(result.totalCount).toBe(0);
          done();
        },
        error: done.fail
      });
    });
  });

  describe('validateCentrifuge - additional', () => {
    it('should throw when data is missing', (done) => {
      apiService.post.and.returnValue(of({ success: true }));
      service.validateCentrifuge({ centrifugeId: 'C1' }).subscribe({
        next: () => done.fail('Should error'),
        error: (e) => { expect(e.message).toContain('No centrifuge validation data'); done(); }
      });
    });

    it('should handle error', (done) => {
      apiService.post.and.returnValue(throwError(() => new Error('fail')));
      service.validateCentrifuge({ centrifugeId: 'C1' }).subscribe({
        next: () => done.fail('Should error'),
        error: () => done()
      });
    });
  });

  describe('validateTemperature - additional', () => {
    it('should throw when data is missing', (done) => {
      apiService.post.and.returnValue(of({ success: true }));
      service.validateTemperature('TH01', 37).subscribe({
        next: () => done.fail('Should error'),
        error: (e) => { expect(e.message).toContain('No temperature validation data'); done(); }
      });
    });

    it('should handle error', (done) => {
      apiService.post.and.returnValue(throwError(() => new Error('fail')));
      service.validateTemperature('TH01', 37).subscribe({
        next: () => done.fail('Should error'),
        error: () => done()
      });
    });
  });

  describe('validateFreezeTime - additional', () => {
    it('should throw when data is missing', (done) => {
      apiService.post.and.returnValue(of({ success: true }));
      service.validateFreezeTime('U1', '2026-01-01T00:00:00Z', 'TH01').subscribe({
        next: () => done.fail('Should error'),
        error: (e) => { expect(e.message).toContain('No freeze time validation data'); done(); }
      });
    });

    it('should handle error', (done) => {
      apiService.post.and.returnValue(throwError(() => new Error('fail')));
      service.validateFreezeTime('U1', '2026-01-01T00:00:00Z', 'TH01').subscribe({
        next: () => done.fail('Should error'),
        error: () => done()
      });
    });
  });

  describe('checkBlInterdiction - additional', () => {
    it('should throw when data is missing', (done) => {
      apiService.post.and.returnValue(of({ success: true }));
      service.checkBlInterdiction({ unitId: 'U1', newProductCode: 'CRYO' } as any).subscribe({
        next: () => done.fail('Should error'),
        error: (e) => { expect(e.message).toContain('No BL interdiction data'); done(); }
      });
    });

    it('should handle error', (done) => {
      apiService.post.and.returnValue(throwError(() => new Error('fail')));
      service.checkBlInterdiction({ unitId: 'U1', newProductCode: 'CRYO' } as any).subscribe({
        next: () => done.fail('Should error'),
        error: () => done()
      });
    });
  });

  describe('updateAddOnBags - additional', () => {
    it('should throw when data is missing', (done) => {
      apiService.put.and.returnValue(of({ success: true }));
      service.updateAddOnBags({ unitId: 'U1' } as any).subscribe({
        next: () => done.fail('Should error'),
        error: (e) => { expect(e.message).toContain('No add-on bags update data'); done(); }
      });
    });

    it('should handle error', (done) => {
      apiService.put.and.returnValue(throwError(() => new Error('fail')));
      service.updateAddOnBags({ unitId: 'U1' } as any).subscribe({
        next: () => done.fail('Should error'),
        error: () => done()
      });
    });
  });

  describe('validateCatalogNumber - additional', () => {
    it('should throw when data is missing', (done) => {
      apiService.post.and.returnValue(of({ success: true }));
      service.validateCatalogNumber({ unitId: 'U1', catalogNumber: 'C1' } as any).subscribe({
        next: () => done.fail('Should error'),
        error: (e) => { expect(e.message).toContain('No catalog number validation data'); done(); }
      });
    });

    it('should handle error', (done) => {
      apiService.post.and.returnValue(throwError(() => new Error('fail')));
      service.validateCatalogNumber({ unitId: 'U1', catalogNumber: 'C1' } as any).subscribe({
        next: () => done.fail('Should error'),
        error: () => done()
      });
    });
  });

  describe('validateNewProduct - additional', () => {
    it('should throw when data is missing', (done) => {
      apiService.post.and.returnValue(of({ success: true }));
      service.validateNewProduct({ newProductCode: 'CRYO' } as any).subscribe({
        next: () => done.fail('Should error'),
        error: (e) => { expect(e.message).toContain('No new product validation data'); done(); }
      });
    });

    it('should handle error', (done) => {
      apiService.post.and.returnValue(throwError(() => new Error('fail')));
      service.validateNewProduct({ newProductCode: 'CRYO' } as any).subscribe({
        next: () => done.fail('Should error'),
        error: () => done()
      });
    });
  });
});
