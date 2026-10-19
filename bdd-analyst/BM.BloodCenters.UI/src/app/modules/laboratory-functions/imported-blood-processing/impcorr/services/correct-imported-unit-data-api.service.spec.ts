import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CorrectImportedUnitDataApiService } from './correct-imported-unit-data-api.service';
import { ApiService } from '@shared/services/api.service';
import { ComponentAttributeDto, CreateComponentAttributeRequestDto } from '../models/correct-imported-unit-data.model';

describe('CorrectImportedUnitDataApiService', () => {
  let service: CorrectImportedUnitDataApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockDto: ComponentAttributeDto = {
    unitId: '12345678',
    chapterId: 'CH01',
    productCode: 'RBC001',
    attribGroup: 'ATTR',
    attribCode: 'CODE01',
    orgImportedProd: 'ORIG001',
    attributeGroupDesc: 'Attribute Group',
    attributeCodeDesc: 'Code Description',
    insertDate: '2024-01-01T00:00:00Z',
    insertUserId: 'USER01',
    programId: 'IMUUNITS',
    collDate: '2024-01-01T00:00:00Z',
    contractId: 'CONTRACT01',
    collId: 'COLL001',
    unitExpiryDate: '2024-12-31T00:00:00Z',
    barCodeProtocol: 'ISBT',
    chkDigit: '5',
    collYear: '2024',
    donorDecisionCode: 'A',
    interCode: 'INT001',
    osUnitId: 'EXT12345',
    receivedDate: '2024-01-01T00:00:00Z',
    batchId: 'BATCH001',
    componentPrefix: 'RBC',
    systemLabelDecision: 'A',
    systemLabelDecisionDesc: 'A+',
    componentExpiryDate: '2024-12-31T00:00:00Z',
    labelUserId: 'USER01',
    labelDats: '2024-01-01T00:00:00Z',
    impLicenseFlag: 'Y'
  };

  const mockApiResponse = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: mockDto
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        CorrectImportedUnitDataApiService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(CorrectImportedUnitDataApiService);
  });

  describe('getComponentAttributes', () => {
    it('should retrieve paginated component attributes', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [mockDto],
        totalCount: 1
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getComponentAttributes(10, 0, { unitId: '12345678' }).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.total).toBe(1);
        expect(result.data[0].unitId).toBe('12345678');
        done();
      });
    });

    it('should handle empty data response', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: null as any,
        totalCount: 0
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getComponentAttributes(10, 0, {}).subscribe(result => {
        expect(result.data.length).toBe(0);
        expect(result.total).toBe(0);
        done();
      });
    });
  });

  describe('getComponentAttributeById', () => {
    it('should retrieve component attribute by composite key', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockApiResponse));

      service.getComponentAttributeById('12345678', 'CH01', 'RBC001', 'ATTR', 'CODE01').subscribe(result => {
        expect(result.unitId).toBe('12345678');
        expect(result.attributeGroup).toBe('ATTR');
        expect(result.attributeCode).toBe('CODE01');
        done();
      });
    });
  });

  describe('createComponentAttribute', () => {
    it('should create component attribute successfully', (done) => {
      const createResponse = {
        success: true,
        message: 'Created',
        statusCode: 201,
        data: mockDto
      };
      apiServiceSpy.post.and.returnValue(of(createResponse));

      const request: CreateComponentAttributeRequestDto = {
        unitId: '12345678',
        chapterId: 'CH01',
        productCode: 'RBC001',
        attribGroup: 'ATTR',
        attribCode: 'CODE01'
      };

      service.createComponentAttribute(request).subscribe(result => {
        expect(result.unitId).toBe('12345678');
        expect(result.attributeGroup).toBe('ATTR');
        done();
      });
    });

    it('should throw error when create response indicates failure', (done) => {
      const errorResponse = {
        success: false,
        message: 'Duplicate entry',
        statusCode: 400,
        errorCode: 'DUPLICATE',
        data: null as any
      };
      apiServiceSpy.post.and.returnValue(of(errorResponse));

      const request: CreateComponentAttributeRequestDto = {
        unitId: '12345678',
        chapterId: 'CH01',
        productCode: 'RBC001',
        attribGroup: 'ATTR',
        attribCode: 'CODE01'
      };

      service.createComponentAttribute(request).subscribe({
        next: () => fail('should have thrown error'),
        error: (err) => {
          expect(err.error.message).toBe('Duplicate entry');
          done();
        }
      });
    });
  });

  describe('updateComponentAttribute', () => {
    it('should update component attribute successfully', (done) => {
      const updateResponse = {
        success: true,
        message: 'Component attribute updated successfully.',
        statusCode: 200,
        data: { ...mockDto, orgImportedProd: 'UPDATED001' }
      };

      apiServiceSpy.put.and.returnValue(of(updateResponse));

      service.updateComponentAttribute('12345678', 'CH01', 'RBC001', 'ATTR', 'CODE01', { orgImportedProd: 'UPDATED001' })
        .subscribe(result => {
          expect(result.originalImportedProduct).toBe('UPDATED001');
          done();
        });
    });

    it('should throw error when update response indicates failure', (done) => {
      const errorResponse = {
        success: false,
        message: 'Update failed',
        statusCode: 400,
        errorCode: 'ERR',
        data: null as any
      };
      apiServiceSpy.put.and.returnValue(of(errorResponse));

      service.updateComponentAttribute('U1', 'C1', 'P1', 'G1', 'A1', {}).subscribe({
        next: () => fail('should have thrown'),
        error: (err) => {
          expect(err.error.message).toBe('Update failed');
          done();
        }
      });
    });
  });

  describe('deleteComponentAttribute', () => {
    it('should delete component attribute successfully', (done) => {
      const deleteResponse = {
        success: true,
        message: 'Component attribute deleted successfully',
        statusCode: 200,
        data: undefined as any
      };

      apiServiceSpy.delete.and.returnValue(of(deleteResponse));

      service.deleteComponentAttribute('12345678', 'CH01', 'RBC001', 'ATTR', 'CODE01')
        .subscribe(() => {
          expect(true).toBe(true);
          done();
        });
    });

    it('should throw error when delete response indicates failure', (done) => {
      const errorResponse = {
        success: false,
        message: 'Delete failed',
        statusCode: 400,
        errorCode: 'ERR',
        data: undefined as any
      };
      apiServiceSpy.delete.and.returnValue(of(errorResponse));

      service.deleteComponentAttribute('U1', 'C1', 'P1', 'G1', 'A1').subscribe({
        next: () => fail('should have thrown'),
        error: (err) => {
          expect(err.error.message).toBe('Delete failed');
          done();
        }
      });
    });
  });

  describe('getAttributeGroups', () => {
    it('should retrieve attribute groups dropdown', (done) => {
      const mockResponse = {
        success: true,
        message: 'Attribute groups retrieved successfully.',
        statusCode: 200,
        data: [
          { code: 'ATTR', description: 'Attribute Group 1' },
          { code: 'QUAL', description: 'Quality Attributes' }
        ]
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAttributeGroups().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('ATTR');
        expect(result[0].description).toBe('Attribute Group 1');
        done();
      });
    });

    it('should handle null data in attribute groups response', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: null as any
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAttributeGroups().subscribe(result => {
        expect(result.length).toBe(0);
        done();
      });
    });
  });

  describe('getAttributeCodes', () => {
    it('should retrieve attribute codes for a group', (done) => {
      const mockResponse = {
        success: true,
        message: 'Attribute codes retrieved successfully.',
        statusCode: 200,
        data: [
          { code: 'CODE01', description: 'Code Description 1' },
          { code: 'CODE02', description: 'Code Description 2' }
        ]
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAttributeCodes('ATTR', 'I').subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('CODE01');
        expect(result[0].description).toBe('Code Description 1');
        done();
      });
    });
  });

  describe('getContracts', () => {
    it('should retrieve contracts', (done) => {
      const mockResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        data: [
          { code: 'C001', description: 'Contract 1' },
          { code: 'C002', description: 'Contract 2' }
        ]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getContracts().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('C001');
        done();
      });
    });

    it('should handle null data in contracts response', (done) => {
      const mockResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        data: null as any
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getContracts().subscribe(result => {
        expect(result.length).toBe(0);
        done();
      });
    });
  });

  describe('getProductCodes', () => {
    it('should retrieve product codes for a unit', (done) => {
      const mockResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        data: [
          { productCode: 'RBC001', productDesc: 'Red Blood Cells', productType: 'WB' }
        ]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getProductCodes('12345678', 'I').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('RBC001');
        expect(result[0].description).toBe('Red Blood Cells');
        expect(result[0].productType).toBe('WB');
        done();
      });
    });

    it('should handle null data in product codes response', (done) => {
      const mockResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        data: null as any
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getProductCodes('12345678', 'I').subscribe(result => {
        expect(result.length).toBe(0);
        done();
      });
    });
  });

  describe('getUnitCodeScheme', () => {
    it('should retrieve unit code scheme', (done) => {
      const mockResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        data: { codeScheme: 'E' }
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getUnitCodeScheme('12345678').subscribe(result => {
        expect(result).toBe('E');
        done();
      });
    });

    it('should default to I when codeScheme is null', (done) => {
      const mockResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        data: { codeScheme: null }
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getUnitCodeScheme('12345678').subscribe(result => {
        expect(result).toBe('I');
        done();
      });
    });

    it('should default to I when data is null', (done) => {
      const mockResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        data: null as any
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getUnitCodeScheme('12345678').subscribe(result => {
        expect(result).toBe('I');
        done();
      });
    });
  });

  describe('getAboLabels', () => {
    it('should retrieve ABO labels', (done) => {
      const mockResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        data: [
          { code: 'A', description: 'A Positive' },
          { code: 'B', description: 'B Negative' }
        ]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAboLabels('I').subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('A');
        expect(result[0].description).toBe('A Positive');
        done();
      });
    });

    it('should handle null data in ABO labels response', (done) => {
      const mockResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        data: null as any
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAboLabels('I').subscribe(result => {
        expect(result.length).toBe(0);
        done();
      });
    });
  });

  describe('getValidProductCodes', () => {
    it('should retrieve valid product codes', (done) => {
      const mockResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        data: [
          { productCode: 'RBC001', productShortName: 'RBC' }
        ]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getValidProductCodes('I', 'WB').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('RBC001');
        expect(result[0].description).toBe('RBC');
        done();
      });
    });

    it('should handle null data in valid product codes response', (done) => {
      const mockResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        data: null as any
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getValidProductCodes('I', 'WB').subscribe(result => {
        expect(result.length).toBe(0);
        done();
      });
    });
  });

  describe('saveComponentAttribute', () => {
    it('should save successfully', (done) => {
      const response = {
        success: true,
        message: 'Saved',
        statusCode: 200,
        data: null
      };
      apiServiceSpy.post.and.returnValue(of(response));

      service.saveComponentAttribute({
        unitId: '12345678',
        productCode: 'RBC001',
        newProductCode: null,
        systemLabelDecision: null,
        expiryDate: null,
        impLicenseFlag: null,
        componentPrefix: null,
        attributes: [{ attribGroup: 'ATTR', attribCode: 'CODE01' }]
      }).subscribe({
        next: () => {
          expect(true).toBeTrue();
          done();
        }
      });
    });

    it('should throw error when save response indicates failure', (done) => {
      const response = {
        success: false,
        message: 'Save failed',
        statusCode: 400,
        errorCode: 'INVALID',
        data: null
      };
      apiServiceSpy.post.and.returnValue(of(response));

      service.saveComponentAttribute({
        unitId: '12345678',
        productCode: 'RBC001',
        newProductCode: null,
        systemLabelDecision: null,
        expiryDate: null,
        impLicenseFlag: null,
        componentPrefix: null,
        attributes: []
      }).subscribe({
        next: () => fail('should have thrown'),
        error: (err) => {
          expect(err.error.message).toBe('Save failed');
          done();
        }
      });
    });
  });

  describe('mapToModel', () => {
    it('should throw error when DTO is null', (done) => {
      const response = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: null as any
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getComponentAttributeById('12345678', 'CH01', 'RBC001', 'ATTR', 'CODE01')
        .subscribe({
          next: () => fail('should have thrown error'),
          error: (error) => {
            expect(error.message).toBe('Server returned invalid data format');
            done();
          }
        });
    });

    it('should map DTO with empty fields without error', (done) => {
      const dtoWithEmptyField = {
        ...mockDto,
        unitId: ''
      };

      const response = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: dtoWithEmptyField
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getComponentAttributeById('12345678', 'CH01', 'RBC001', 'ATTR', 'CODE01')
        .subscribe(result => {
          expect(result.unitId).toBe('');
          done();
        });
    });

    it('should map null optional fields to null', (done) => {
      const dtoWithNulls = {
        ...mockDto,
        orgImportedProd: null,
        attributeGroupDesc: null,
        attributeCodeDesc: null,
        programId: null,
        contractId: null,
        osUnitId: null,
        receivedDate: null,
        batchId: null,
        labelUserId: null,
        labelDats: null,
        systemLabelDecision: null,
        componentExpiryDate: null,
        impLicenseFlag: null,
        componentPrefix: null
      };

      const response = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: dtoWithNulls
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getComponentAttributeById('12345678', 'CH01', 'RBC001', 'ATTR', 'CODE01')
        .subscribe(result => {
          expect(result.originalImportedProduct).toBeNull();
          expect(result.attributeGroupDescription).toBeNull();
          expect(result.contractId).toBeNull();
          expect(result.externalUnitId).toBeNull();
          expect(result.checkInUser).toBeNull();
          expect(result.aboLabel).toBeNull();
          expect(result.expirationDate).toBeNull();
          expect(result.licenseFlag).toBeNull();
          expect(result.componentPrefix).toBeNull();
          done();
        });
    });
  });
});
