import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PathogenReductionManagerService } from './pathogen-reduction-manager.service';
import { environment } from '../../../../../../../environments/environment';
import {
  PathogenReductionDetailsDto,
  CheckSuitabilityRequestDto,
  CheckSuitabilityResponseDto,
  SaveSuitabilityRequestDto,
  UpdateSuitabilityRequestDto,
  SterileDockingRequestDto,
  UpdateIntermediateProcessRequestDto,
  UpdateFinalTransferRequestDto,
  SaveFinalProductsRequestDto,
  ProductCategoryDto,
  PathogenConfigDto,
  PathogenReductionStatusDto,
  SuspensionTypeDto,
  VolumeTypeSetDto,
  EquipmentSerialNumberDto,
  IlluminatorEquipmentTypeDto,
  SterileDockingMachineDto,
  WaferLotNumberDto,
  SetLotNumberDto
} from '../models/pathogen-reduction.model';

describe('PathogenReductionManagerService', () => {
  let service: PathogenReductionManagerService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/pathogen-reduction`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PathogenReductionManagerService]
    });
    service = TestBed.inject(PathogenReductionManagerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getPathogenReductionDetails', () => {
    it('should retrieve pathogen reduction details without product code', () => {
      const unitId = '00123456789012';
      const mockDetails: PathogenReductionDetailsDto = {
        unitId: unitId,
        chapterId: '001',
        productCode: 'PLT01',
        suitabilityDate: '2024-06-14T10:30:00Z',
        suitabilityUser: 'USER01',
        sterileDockDate: null,
        sterileDockUser: null,
        illuminationStartTime: null,
        illuminationEndTime: null,
        treatmentStartTime: null,
        treatmentEndTime: null,
        cadEndTime: null,
        finalTransferDate: null,
        finalTransferUser: null,
        numBags: null,
        insertDate: '2024-06-14T10:30:00Z',
        insertUser: 'USER01'
      };

      service.getPathogenReductionDetails(unitId).subscribe(details => {
        expect(details).toEqual(mockDetails);
      });

      const req = httpMock.expectOne(`${baseUrl}/${encodeURIComponent(unitId)}`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'Success', data: mockDetails });
    });

    it('should retrieve pathogen reduction details with product code', () => {
      const unitId = '00123456789012';
      const prodCode = 'PLT01';
      const mockDetails: PathogenReductionDetailsDto = {
        unitId: unitId,
        chapterId: '001',
        productCode: prodCode,
        suitabilityDate: '2024-06-14T10:30:00Z',
        suitabilityUser: 'USER01',
        sterileDockDate: null,
        sterileDockUser: null,
        illuminationStartTime: null,
        illuminationEndTime: null,
        treatmentStartTime: null,
        treatmentEndTime: null,
        cadEndTime: null,
        finalTransferDate: null,
        finalTransferUser: null,
        numBags: null,
        insertDate: '2024-06-14T10:30:00Z',
        insertUser: 'USER01'
      };

      service.getPathogenReductionDetails(unitId, prodCode).subscribe(details => {
        expect(details).toEqual(mockDetails);
      });

      const req = httpMock.expectOne(`${baseUrl}/${encodeURIComponent(unitId)}?prodCode=${prodCode}`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'Success', data: mockDetails });
    });
  });

  describe('getProductCategories', () => {
    it('should retrieve product categories', () => {
      const mockCategories: ProductCategoryDto[] = [
        { productCategory: 'PLT', categoryDescription: 'Platelets' },
        { productCategory: 'PLAS', categoryDescription: 'Plasma' }
      ];

      service.getProductCategories().subscribe(categories => {
        expect(categories).toEqual(mockCategories);
        expect(categories.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/product-categories`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'Success', data: mockCategories });
    });
  });

  describe('getConfiguration', () => {
    it('should retrieve configuration ranges', () => {
      const mockConfig: PathogenConfigDto[] = [
        {
          productCategory: 'PLT',
          parameterName: 'RBC_CONTENT',
          minValue: 0.0,
          maxValue: 0.5,
          effDate: '2024-01-01T00:00:00Z',
          termDate: null
        }
      ];

      service.getConfiguration().subscribe(config => {
        expect(config).toEqual(mockConfig);
      });

      const req = httpMock.expectOne(`${baseUrl}/config`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'Success', data: mockConfig });
    });
  });

  describe('getStatusOverview', () => {
    it('should retrieve status overview', () => {
      const mockStatus: PathogenReductionStatusDto = {
        totalUnits: 150,
        suitableUnits: 140,
        unsuitableUnits: 10,
        completedUnits: 120,
        inProgressUnits: 20,
        pendingSuitabilityCheck: 30
      };

      service.getStatusOverview().subscribe(status => {
        expect(status).toEqual(mockStatus);
      });

      const req = httpMock.expectOne(`${baseUrl}/status`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'Success', data: mockStatus });
    });
  });

  describe('checkSuitability', () => {
    it('should check suitability and return suitable result', () => {
      const request: CheckSuitabilityRequestDto = {
        unitId: '00123456789012',
        productCode: 'PLT01'
      };

      const mockResponse: CheckSuitabilityResponseDto[] = [{
        unitId: '00123456789012',
        productCode: 'PLT01',
        isSuitable: true,
        reasons: []
      }];

      service.checkSuitability(request).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response[0].isSuitable).toBeTrue();
      });

      const req = httpMock.expectOne(`${baseUrl}/check-suitability`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ success: true, statusCode: 200, message: 'Success', data: mockResponse });
    });

    it('should check suitability and return unsuitable result with reasons', () => {
      const request: CheckSuitabilityRequestDto = {
        unitId: '00123456789999',
        productCode: 'PLT01'
      };

      const mockResponse: CheckSuitabilityResponseDto[] = [{
        unitId: '00123456789999',
        productCode: 'PLT01',
        isSuitable: false,
        reasons: ['RBC content (0.8) exceeds maximum allowed (0.5)']
      }];

      service.checkSuitability(request).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response[0].isSuitable).toBeFalse();
        expect(response[0].reasons.length).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/check-suitability`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, statusCode: 200, message: 'Success', data: mockResponse });
    });
  });

  describe('saveSuitability', () => {
    it('should save suitability record', () => {
      const request: SaveSuitabilityRequestDto = {
        unitId: '00123456789012',
        productCode: 'PLT01',
        suitabilityDate: '2024-06-14T10:30:00Z',
        suitabilityUser: 'USER01'
      };

      const mockResponse = { unitId: '00123456789012' };

      service.saveSuitability(request).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/suitability`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ success: true, statusCode: 201, message: 'Success', data: mockResponse });
    });
  });

  describe('updateSuitability', () => {
    it('should update suitability record', () => {
      const request: UpdateSuitabilityRequestDto = {
        unitId: '00123456789012',
        productCode: 'PLT02',
        suitabilityDate: '2024-06-14T11:00:00Z',
        suitabilityUser: 'USER02'
      };

      service.updateSuitability(request).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/suitability`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush({ success: true, statusCode: 200, message: 'Success' });
    });
  });

  describe('insertSterileDocking', () => {
    it('should insert sterile docking record', () => {
      const request: SterileDockingRequestDto = {
        unitId: '00123456789012',
        procCode: 'PROC01',
        weldMachine: 'WELD01',
        waferLotNo: 'WAFER123',
        setLotNo: 'SET456',
        weldOk: 'Y',
        dockDate: '2024-06-14T11:00:00Z',
        dockUser: 'USER01'
      };

      const mockResponse = { result: 0, message: 'Success' };

      service.insertSterileDocking(request).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/sterile-docking`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ success: true, statusCode: 200, message: 'Success', data: mockResponse });
    });
  });

  describe('updateIntermediateProcess', () => {
    it('should update intermediate process with all times', () => {
      const request: UpdateIntermediateProcessRequestDto = {
        unitId: '00123456789012',
        illuminationStartTime: '2024-06-14T11:30:00Z',
        illuminationEndTime: '2024-06-14T13:30:00Z',
        treatmentStartTime: '2024-06-14T14:00:00Z',
        treatmentEndTime: '2024-06-14T16:00:00Z'
      };

      service.updateIntermediateProcess(request).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/intermediate-process`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush({ success: true, statusCode: 200, message: 'Success' });
    });

    it('should update intermediate process with partial times', () => {
      const request: UpdateIntermediateProcessRequestDto = {
        unitId: '00123456789012',
        illuminationStartTime: '2024-06-14T11:30:00Z',
        illuminationEndTime: '2024-06-14T13:30:00Z'
      };

      service.updateIntermediateProcess(request).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/intermediate-process`);
      expect(req.request.method).toBe('PUT');
      req.flush({ success: true, statusCode: 200, message: 'Success' });
    });
  });

  describe('updateFinalTransfer', () => {
    it('should update final transfer', () => {
      const request: UpdateFinalTransferRequestDto = {
        unitId: '00123456789012',
        cadEndTime: '2024-06-14T16:30:00Z',
        numBags: 3,
        finalTransferDate: '2024-06-14T17:00:00Z',
        finalTransferUser: 'USER01'
      };

      service.updateFinalTransfer(request).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/final-transfer`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush({ success: true, statusCode: 200, message: 'Success' });
    });
  });

  describe('saveFinalProducts', () => {
    it('should save final products', () => {
      const request: SaveFinalProductsRequestDto = {
        sourceUnitId: '00123456789012',
        finalProducts: [
          { finalUnitId: '00123456789013', productCode: 'PLT01', volume: 250.0 },
          { finalUnitId: '00123456789014', productCode: 'PLT01', volume: 250.0 },
          { finalUnitId: '00123456789015', productCode: 'PLT01', volume: 250.0 }
        ]
      };

      const mockResponse = { count: 3 };

      service.saveFinalProducts(request).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.count).toBe(3);
      });

      const req = httpMock.expectOne(`${baseUrl}/final-products`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ success: true, statusCode: 201, message: 'Success', data: mockResponse });
    });
  });

  describe('getSuspensionTypes', () => {
    it('should retrieve suspension types', () => {
      const mockSuspensionTypes: SuspensionTypeDto[] = [
        { suspensionType: 'PAS-3', description: 'Platelet Additive Solution 3' },
        { suspensionType: 'PAS-5', description: 'Platelet Additive Solution 5' }
      ];

      service.getSuspensionTypes().subscribe(types => {
        expect(types).toEqual(mockSuspensionTypes);
        expect(types.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/suspension-types`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'Success', data: mockSuspensionTypes });
    });
  });

  describe('getVolumeTypeSets', () => {
    it('should retrieve volume type sets', () => {
      const mockVolumeTypeSets: VolumeTypeSetDto[] = [
        { volumeTypeSet: 'LV', description: 'Low Volume' },
        { volumeTypeSet: 'HV', description: 'High Volume' }
      ];

      service.getVolumeTypeSets().subscribe(sets => {
        expect(sets).toEqual(mockVolumeTypeSets);
        expect(sets.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/volume-type-sets`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'Success', data: mockVolumeTypeSets });
    });
  });

  describe('getEquipmentSerialNumbers', () => {
    it('should retrieve equipment serial numbers for a specific equipment type', () => {
      const equipType = 'AMIC';
      const mockSerialNumbers: EquipmentSerialNumberDto[] = [
        { serialNumber: 'SN001', equipmentType: 'AMIC' },
        { serialNumber: 'SN002', equipmentType: 'AMIC' }
      ];

      service.getEquipmentSerialNumbers(equipType).subscribe(serials => {
        expect(serials).toEqual(mockSerialNumbers);
        expect(serials.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/equipment-serial-numbers/${encodeURIComponent(equipType)}`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'Success', data: mockSerialNumbers });
    });
  });

  describe('getIlluminatorEquipmentTypes', () => {
    it('should retrieve illuminator equipment types', () => {
      const mockEquipmentTypes: IlluminatorEquipmentTypeDto[] = [
        { equipmentType: 'AMIC', description: 'AMIC Illuminator' },
        { equipmentType: 'INTERCEPT', description: 'INTERCEPT Blood System' }
      ];

      service.getIlluminatorEquipmentTypes().subscribe(types => {
        expect(types).toEqual(mockEquipmentTypes);
        expect(types.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/illuminator-equipment-types`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'Success', data: mockEquipmentTypes });
    });
  });

  describe('getSterileDockingMachines', () => {
    it('should retrieve sterile docking machines', () => {
      const mockMachines: SterileDockingMachineDto[] = [
        { machineId: 'DOCK001', description: 'Sterile Docking Machine 1' },
        { machineId: 'DOCK002', description: 'Sterile Docking Machine 2' }
      ];

      service.getSterileDockingMachines().subscribe(machines => {
        expect(machines).toEqual(mockMachines);
        expect(machines.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/sterile-docking-machines`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'Success', data: mockMachines });
    });
  });

  describe('getWaferLotNumbers', () => {
    it('should retrieve wafer lot numbers', () => {
      const mockWaferLots: WaferLotNumberDto[] = [
        { lotNumber: 'WL001', expirationDate: '2024-12-31' },
        { lotNumber: 'WL002', expirationDate: null }
      ];

      service.getWaferLotNumbers().subscribe(lots => {
        expect(lots).toEqual(mockWaferLots);
        expect(lots.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/wafer-lot-numbers`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'Success', data: mockWaferLots });
    });
  });

  describe('getSetLotNumbers', () => {
    it('should retrieve set lot numbers for a specific volume type set', () => {
      const volumeTypeSet = 'LV';
      const mockSetLots: SetLotNumberDto[] = [
        { lotNumber: 'SL001', volumeTypeSet: 'LV', expirationDate: '2024-11-30' },
        { lotNumber: 'SL002', volumeTypeSet: 'LV', expirationDate: '2024-12-15' }
      ];

      service.getSetLotNumbers(volumeTypeSet).subscribe(lots => {
        expect(lots).toEqual(mockSetLots);
        expect(lots.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/set-lot-numbers/${encodeURIComponent(volumeTypeSet)}`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'Success', data: mockSetLots });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 error for unit not found', () => {
      const unitId = 'INVALID';

      service.getPathogenReductionDetails(unitId).subscribe(
        () => fail('should have failed with 404 error'),
        error => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${baseUrl}/${encodeURIComponent(unitId)}`);
      req.flush(
        { success: false, statusCode: 404, message: 'Not found' },
        { status: 404, statusText: 'Not Found' }
      );
    });

  });

  describe('getQueryStatus', () => {
    it('should retrieve query status', () => {
      const mockData = [{ unitId: 'U1', status: 'IN_CAD', cadTimeElapsed: 120 }];
      service.getQueryStatus().subscribe(status => {
        expect(status).toEqual(mockData as any);
      });
      const req = httpMock.expectOne(`${baseUrl}/query-status`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'Success', data: mockData });
    });
  });

  describe('getUnitDetails', () => {
    it('should retrieve unit details', () => {
      const unitId = '00123456789012';
      const mockData = { unitId, collectionDate: '2024-06-14' };
      service.getUnitDetails(unitId).subscribe(details => {
        expect(details).toEqual(mockData as any);
      });
      const req = httpMock.expectOne(`${baseUrl}/units/${encodeURIComponent(unitId)}`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'Success', data: [mockData] });
    });
  });

  describe('getProductCodes', () => {
    it('should retrieve product codes without category', () => {
      const mockData = [{ productCode: 'PLT01', description: 'Platelets' }];
      const collectionDate = new Date(2024, 5, 14); // June 14, 2024
      service.getProductCodes('U1', collectionDate).subscribe(codes => {
        expect(codes).toEqual(mockData as any);
      });
      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/product-codes` &&
        r.params.get('unitId') === 'U1' &&
        r.params.get('collectionDate') === '2024-06-14' &&
        !r.params.has('productCategory')
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'Success', data: mockData });
    });

    it('should retrieve product codes with category', () => {
      const mockData = [{ productCode: 'PLT01' }];
      service.getProductCodes('U1', new Date(2024, 5, 14), 'PLT').subscribe(codes => {
        expect(codes).toEqual(mockData as any);
      });
      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/product-codes` &&
        r.params.get('productCategory') === 'PLT'
      );
      req.flush({ success: true, statusCode: 200, message: 'Success', data: mockData });
    });
  });

  describe('getProductDetails', () => {
    it('should return product details when found', () => {
      const mockData = { unitId: 'U1', weight: 250.0, volume: 240.5 };
      service.getProductDetails('U1', 'PLT01', new Date(2024, 5, 14)).subscribe(details => {
        expect(details).toEqual(mockData as any);
      });
      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/product-details` &&
        r.params.get('unitId') === 'U1' &&
        r.params.get('productCode') === 'PLT01'
      );
      req.flush({ success: true, statusCode: 200, message: 'Success', data: [mockData] });
    });

    it('should return null when no product details', () => {
      service.getProductDetails('U1', 'PLT01', new Date(2024, 5, 14)).subscribe(details => {
        expect(details).toBeNull();
      });
      const req = httpMock.expectOne(r => r.url === `${baseUrl}/product-details`);
      req.flush({ success: true, statusCode: 200, message: 'Success', data: [] });
    });
  });

  describe('getSpecificGravity', () => {
    it('should return specific gravity value', () => {
      service.getSpecificGravity('PLT01').subscribe(sg => {
        expect(sg).toBe(1.03);
      });
      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/specific-gravity` &&
        r.params.get('productCode') === 'PLT01'
      );
      req.flush({ success: true, specificGravity: 1.03 });
    });

    it('should default to 1.025 when specificGravity is 0/null', () => {
      service.getSpecificGravity('PLT01').subscribe(sg => {
        expect(sg).toBe(1.025);
      });
      const req = httpMock.expectOne(r => r.url === `${baseUrl}/specific-gravity`);
      req.flush({ success: true, specificGravity: 0 });
    });

    it('should return 1.025 on error', () => {
      service.getSpecificGravity('PLT01').subscribe(sg => {
        expect(sg).toBe(1.025);
      });
      const req = httpMock.expectOne(r => r.url === `${baseUrl}/specific-gravity`);
      req.flush('Error', { status: 500, statusText: 'Error' });
    });
  });

  describe('getInterimProductCodes', () => {
    it('should retrieve without category', () => {
      const mockData = [{ productCode: 'PLT-PR' }];
      service.getInterimProductCodes().subscribe(codes => {
        expect(codes).toEqual(mockData as any);
      });
      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/interim-product-codes` &&
        !r.params.has('productCategory')
      );
      req.flush({ success: true, statusCode: 200, message: 'Success', data: mockData });
    });

    it('should retrieve with category', () => {
      const mockData = [{ productCode: 'PLT-PR' }];
      service.getInterimProductCodes('PLT').subscribe(codes => {
        expect(codes).toEqual(mockData as any);
      });
      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/interim-product-codes` &&
        r.params.get('productCategory') === 'PLT'
      );
      req.flush({ success: true, statusCode: 200, message: 'Success', data: mockData });
    });
  });

  describe('getCadProductCodes', () => {
    it('should retrieve without cadProdCode', () => {
      const mockData = [{ productCode: 'CAD01' }];
      service.getCadProductCodes('PLT', 'SUIT01').subscribe(codes => {
        expect(codes).toEqual(mockData as any);
      });
      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/cad-product-codes` &&
        r.params.get('productCategory') === 'PLT' &&
        r.params.get('suitProdCode') === 'SUIT01' &&
        !r.params.has('cadProdCode')
      );
      req.flush({ success: true, statusCode: 200, message: 'Success', data: mockData });
    });

    it('should retrieve with cadProdCode', () => {
      const mockData = [{ productCode: 'CAD01' }];
      service.getCadProductCodes('PLT', 'SUIT01', 'CAD01').subscribe(codes => {
        expect(codes).toEqual(mockData as any);
      });
      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/cad-product-codes` &&
        r.params.get('cadProdCode') === 'CAD01'
      );
      req.flush({ success: true, statusCode: 200, message: 'Success', data: mockData });
    });
  });

  describe('calculateIntendedUse', () => {
    it('should calculate intended use', () => {
      const request = { unitId: 'U1', baseProductCode: 'PLT01' };
      const mockResult = { fullProductCode: 'PLT01V00' };
      service.calculateIntendedUse(request).subscribe(result => {
        expect(result).toEqual(mockResult as any);
      });
      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/calculate-intended-use` &&
        r.params.get('unitId') === 'U1' &&
        r.params.get('baseProductCode') === 'PLT01'
      );
      req.flush({ success: true, statusCode: 200, message: 'Success', data: [mockResult] });
    });
  });

  describe('getChapters', () => {
    it('should retrieve chapters', () => {
      const mockData = [{ chapterId: '001', chapterName: 'Chapter 1' }];
      service.getChapters().subscribe(chapters => {
        expect(chapters).toEqual(mockData as any);
      });
      const req = httpMock.expectOne(`${baseUrl}/chapters`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'Success', data: mockData });
    });
  });

  describe('getRemoveBagEnabled', () => {
    it('should return true when enabled', () => {
      service.getRemoveBagEnabled().subscribe(enabled => {
        expect(enabled).toBeTrue();
      });
      const req = httpMock.expectOne(`${baseUrl}/remove-bag-enabled`);
      req.flush({ success: true, statusCode: 200, message: 'Success', data: [true] });
    });

    it('should return false when disabled', () => {
      service.getRemoveBagEnabled().subscribe(enabled => {
        expect(enabled).toBeFalse();
      });
      const req = httpMock.expectOne(`${baseUrl}/remove-bag-enabled`);
      req.flush({ success: true, statusCode: 200, message: 'Success', data: [false] });
    });
  });

  describe('getFinalProducts', () => {
    it('should retrieve final products', () => {
      const unitId = 'U1';
      const mockData = [{ finalUnitId: 'F1', productCode: 'PLT01' }];
      service.getFinalProducts(unitId, 'SUIT01').subscribe(products => {
        expect(products).toEqual(mockData as any);
      });
      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/${encodeURIComponent(unitId)}/final-products` &&
        r.params.get('suitProdCode') === 'SUIT01'
      );
      req.flush({ success: true, statusCode: 200, message: 'Success', data: mockData });
    });
  });

  describe('reprintLabel', () => {
    it('should POST reprint label request', () => {
      const request = { unitId: 'U1', productCode: 'PLT01' } as any;
      const mockResponse = { success: true, statusCode: 200, message: 'Success', data: [{ printed: true }] };
      service.reprintLabel(request).subscribe(response => {
        expect(response.success).toBeTrue();
      });
      const req = httpMock.expectOne(`${baseUrl}/reprint-label`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  describe('uploadData', () => {
    it('should POST FormData with file and chapterId', () => {
      const file = new File(['csv content'], 'test.csv', { type: 'text/csv' });
      const mockResponse = { successCount: 5, errorCount: 0, errors: [], results: [] };
      service.uploadData(file, '001').subscribe(result => {
        expect(result.successCount).toBe(5);
      });
      const req = httpMock.expectOne(`${baseUrl}/upload`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBeTrue();
      req.flush({ success: true, statusCode: 200, message: 'Success', data: [mockResponse] });
    });
  });

  describe('getPathogenReductionDetails with tab', () => {
    it('should pass tab parameter', () => {
      const unitId = '00123456789012';
      service.getPathogenReductionDetails(unitId, 'PLT01', 'suitability').subscribe();
      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/${encodeURIComponent(unitId)}` &&
        r.params.get('prodCode') === 'PLT01' &&
        r.params.get('tab') === 'suitability'
      );
      req.flush({ success: true, statusCode: 200, message: 'Success', data: [{}] });
    });
  });
});
