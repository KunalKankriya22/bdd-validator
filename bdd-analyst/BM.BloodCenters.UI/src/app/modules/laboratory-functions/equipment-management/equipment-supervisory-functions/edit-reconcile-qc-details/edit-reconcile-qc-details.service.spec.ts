import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { EditReconcileQcDetailsService, ApiResponse } from './edit-reconcile-qc-details.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { HttpParams } from '@angular/common/http';

describe('EditReconcileQcDetailsService', () => {
  let service: EditReconcileQcDetailsService;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        EditReconcileQcDetailsService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(EditReconcileQcDetailsService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  // ── getEquipmentTypes ────────────────────────────────────────────────────────

  describe('getEquipmentTypes', () => {
    it('should return data array when response has data', (done) => {
      // Arrange
      const mockData = [{ code: 'EQ1', description: 'Type 1' }];
      apiService.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockData }));

      // Act
      service.getEquipmentTypes().subscribe((result) => {
        // Assert
        expect(result).toEqual(mockData);
        expect(apiService.get).toHaveBeenCalledWith(API.EQUIPMENT_QC_SUP.EQUIPMENT_TYPES);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      // Arrange
      apiService.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: null }));

      // Act
      service.getEquipmentTypes().subscribe((result) => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });
  });

  // ── getEquipmentIds ──────────────────────────────────────────────────────────

  describe('getEquipmentIds', () => {
    it('should pass equipmentType as HttpParam and return data', (done) => {
      // Arrange
      const mockData = [{ equipId: 'E1', equipReference: 'REF1' }];
      apiService.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockData }));

      // Act
      service.getEquipmentIds('THERM').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockData);
        const params = apiService.get.calls.mostRecent().args[1] as { params: HttpParams };
        expect(params.params.get('equipmentType')).toBe('THERM');
        done();
      });
    });
  });

  // ── getEquipmentReferences ───────────────────────────────────────────────────

  describe('getEquipmentReferences', () => {
    it('should pass equipmentType and equipmentId as HttpParams', (done) => {
      // Arrange
      apiService.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [] }));

      // Act
      service.getEquipmentReferences('THERM', 'E1').subscribe(() => {
        // Assert
        const params = apiService.get.calls.mostRecent().args[1] as { params: HttpParams };
        expect(params.params.get('equipmentType')).toBe('THERM');
        expect(params.params.get('equipmentId')).toBe('E1');
        done();
      });
    });
  });

  // ── getQcEvents ──────────────────────────────────────────────────────────────

  describe('getQcEvents', () => {
    it('should pass equipmentReference as HttpParam and return data', (done) => {
      // Arrange
      const mockData = [{ qcReference: 'QC1', qcType: 'T', qcDate: '2024-01-01', qcStatus: 'P' }];
      apiService.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockData }));

      // Act
      service.getQcEvents('REF1').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockData);
        const params = apiService.get.calls.mostRecent().args[1] as { params: HttpParams };
        expect(params.params.get('equipmentReference')).toBe('REF1');
        done();
      });
    });
  });

  // ── getQcHeader ──────────────────────────────────────────────────────────────

  describe('getQcHeader', () => {
    it('should return first item from data array', (done) => {
      // Arrange
      const mockHeader = { equipReference: 'REF1', qcReference: 'QC1' } as any;
      apiService.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [mockHeader] }));

      // Act
      service.getQcHeader('QC1').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockHeader);
        expect(apiService.get).toHaveBeenCalledWith(API.EQUIPMENT_QC_SUP.QC_HEADER('QC1'));
        done();
      });
    });

    it('should return null when data is empty or null', (done) => {
      // Arrange
      apiService.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [] }));

      // Act
      service.getQcHeader('QC1').subscribe((result) => {
        // Assert
        expect(result).toBeNull();
        done();
      });
    });
  });

  // ── getQcDetails ─────────────────────────────────────────────────────────────

  describe('getQcDetails', () => {
    it('should return data array for given qcReference', (done) => {
      // Arrange
      const mockDetails = [{ qcReference: 'QC1', qcId: 'D1', arrangeBy: 1 }] as any[];
      apiService.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockDetails }));

      // Act
      service.getQcDetails('QC1').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockDetails);
        expect(apiService.get).toHaveBeenCalledWith(API.EQUIPMENT_QC_SUP.QC_DETAILS('QC1'));
        done();
      });
    });
  });

  // ── getQcTypes ───────────────────────────────────────────────────────────────

  describe('getQcTypes', () => {
    it('should pass equipmentType as HttpParam and return data', (done) => {
      // Arrange
      const mockData = [{ qcType: 'T1', description: 'Type 1' }];
      apiService.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockData }));

      // Act
      service.getQcTypes('THERM').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockData);
        const params = apiService.get.calls.mostRecent().args[1] as { params: HttpParams };
        expect(params.params.get('equipmentType')).toBe('THERM');
        done();
      });
    });
  });

  // ── getQcResults ─────────────────────────────────────────────────────────────

  describe('getQcResults', () => {
    it('should return data array', (done) => {
      // Arrange
      const mockData = [{ code: 'R1', description: 'Pass' }];
      apiService.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockData }));

      // Act
      service.getQcResults().subscribe((result) => {
        // Assert
        expect(result).toEqual(mockData);
        expect(apiService.get).toHaveBeenCalledWith(API.EQUIPMENT_QC_SUP.QC_RESULTS);
        done();
      });
    });
  });

  // ── getUsers ─────────────────────────────────────────────────────────────────

  describe('getUsers', () => {
    it('should return data array', (done) => {
      // Arrange
      const mockData = [{ userId: 'U1', userName: 'John' }];
      apiService.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockData }));

      // Act
      service.getUsers().subscribe((result) => {
        // Assert
        expect(result).toEqual(mockData);
        expect(apiService.get).toHaveBeenCalledWith(API.EQUIPMENT_QC_SUP.USERS);
        done();
      });
    });
  });

  // ── getReviewCode ────────────────────────────────────────────────────────────

  describe('getReviewCode', () => {
    it('should return reviewCode from first item', (done) => {
      // Arrange
      apiService.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [{ reviewCode: 'RC1' }] }));

      // Act
      service.getReviewCode('THERM', 'QT1').subscribe((result) => {
        // Assert
        expect(result).toBe('RC1');
        const params = apiService.get.calls.mostRecent().args[1] as { params: HttpParams };
        expect(params.params.get('equipmentType')).toBe('THERM');
        expect(params.params.get('qcType')).toBe('QT1');
        done();
      });
    });

    it('should return null when data is empty', (done) => {
      // Arrange
      apiService.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [] }));

      // Act
      service.getReviewCode('THERM', 'QT1').subscribe((result) => {
        // Assert
        expect(result).toBeNull();
        done();
      });
    });
  });

  // ── parseBarcode ─────────────────────────────────────────────────────────────

  describe('parseBarcode', () => {
    it('should POST barcode and return first item', (done) => {
      // Arrange
      const mockParsed = { equipmentReference: 'REF1', isValid: true } as any;
      apiService.post.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [mockParsed] }));

      // Act
      service.parseBarcode('BC123').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockParsed);
        expect(apiService.post).toHaveBeenCalledWith(API.EQUIPMENT_QC_SUP.PARSE_BARCODE, { barcode: 'BC123' });
        done();
      });
    });

    it('should return null when data is empty', (done) => {
      // Arrange
      apiService.post.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [] }));

      // Act
      service.parseBarcode('BC123').subscribe((result) => {
        // Assert
        expect(result).toBeNull();
        done();
      });
    });
  });

  // ── updateQcDetails ──────────────────────────────────────────────────────────

  describe('updateQcDetails', () => {
    it('should PUT details to the correct endpoint', (done) => {
      // Arrange
      const body = { details: [{ qcId: 'D1', arrangeBy: 1, actualValue: '5' }] };
      const mockResponse = { success: true, message: 'OK', statusCode: 200, data: null };
      apiService.put.and.returnValue(of(mockResponse));

      // Act
      service.updateQcDetails('QC1', body).subscribe((result) => {
        // Assert
        expect(apiService.put).toHaveBeenCalledWith(API.EQUIPMENT_QC_SUP.QC_DETAILS('QC1'), body);
        expect(result).toEqual(mockResponse);
        done();
      });
    });
  });

  // ── updateQcHeader ───────────────────────────────────────────────────────────

  describe('updateQcHeader', () => {
    it('should PUT header to the correct endpoint', (done) => {
      // Arrange
      const body = { qcType: 'T1', qcResult1: 'P' } as any;
      const mockResponse = { success: true, message: 'OK', statusCode: 200, data: null };
      apiService.put.and.returnValue(of(mockResponse));

      // Act
      service.updateQcHeader('QC1', body).subscribe((result) => {
        // Assert
        expect(apiService.put).toHaveBeenCalledWith(API.EQUIPMENT_QC_SUP.QC_HEADER('QC1'), body);
        expect(result).toEqual(mockResponse);
        done();
      });
    });
  });
});
