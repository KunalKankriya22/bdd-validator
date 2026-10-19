import { TestBed } from '@angular/core/testing';
import { HttpContext } from '@angular/common/http';
import { of } from 'rxjs';
import { AttributeCodesApiService } from './attribute-codes-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import {
  AttributeCodeFormValue,
  AttributeCodeQueryParamsDto
} from '../models/attribute-codes.model';

describe('AttributeCodesApiService', () => {
  let service: AttributeCodesApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  // Full backend DTO with all fields populated
  const mockValidAttributeDto = {
    attribGroup: 'ABO',
    attribCode: 'A1',
    attribDesc: 'A1 Subgroup',
    price: 25.50,
    unitSchemeType: 'C',
    statusFlag: 'A',
    interCode: 'IC001',
    stopLabelFlag: 'N',
    assignAfterLabelFlag: 'Y',
    showOnLabelFlag: 'Y',
    deleteAllowed: 'Y',
    attribCustom: 'N',
    normalStockFlag: 'Y',
    creditFlag: 'Y',
    serviceCode: 'SVC01',
    attribLabel: 'A1 Label',
    attribAbbrev: 'A1',
    attribPosition: 3,
    attribType: 'T',
    exclusivityFlag: 'N',
    eqCode128AttribGroup: 'EQ_GRP',
    eqCode128AttribCode: 'EQ_CODE',
    effDate: '2024-01-01',
    termDate: '2025-12-31',
    programId: 'VATTRIB',
    lastModifiedDate: '2024-06-15'
  };

  // Minimal DTO with only required fields (simulates partial update response)
  const mockMinimalDto = {
    attribGroup: 'ABO',
    attribCode: 'A1',
    attribDesc: 'A1 Subgroup',
    unitSchemeType: 'C'
  };

  const mockFormValue: AttributeCodeFormValue = {
    attributeCode: 'A1',
    description: 'A1 Subgroup',
    unitScheme: 'C',
    statusFlag: 'A',
    attributeType: 'T',
    attributeLabel: 'A1 Label',
    attributeAbbrev: 'A1',
    attributePosition: 3,
    normalStockFlag: 'Y',
    assignAfterLabelFlag: 'Y',
    effectiveDate: { format: (fmt: string) => '2024-01-01' } as any,
    terminationDate: { format: (fmt: string) => '2025-12-31' } as any,
    interCode: 'IC001',
    stopLabelFlag: 'N',
    showOnLabelFlag: 'Y',
    attributeCustom: 'N',
    creditFlag: 'Y',
    exclusivityFlag: 'N',
    deleteAllowed: 'Y',
    price: 25.50,
    serviceCode: 'SVC01'
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        AttributeCodesApiService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(AttributeCodesApiService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  // ---------------------------------------------------------------
  // getAttributeCodes
  // ---------------------------------------------------------------
  describe('getAttributeCodes', () => {
    it('should map queryDto fields to API body and return mapped data with total', (done) => {
      const queryDto: AttributeCodeQueryParamsDto = {
        attribGroup: 'ABO',
        attributeCode: 'A1',
        searchKeyword: 'sub',
        sortColumn: 'attribCode',
        sortOrder: 'asc',
        stopLabelFlag: 'N',
        exclusivityFlag: 'Y',
        effectiveDateFrom: '2024-01-01',
        effectiveDateTo: '2024-12-31',
        terminationDateFrom: '2025-01-01',
        terminationDateTo: '2025-12-31'
      };

      apiServiceSpy.post.and.returnValue(of({
        success: true,
        data: [mockValidAttributeDto],
        total: 1,
        statusCode: 200,
        message: 'Success'
      }));

      service.getAttributeCodes(25, 0, queryDto).subscribe({
        next: (result) => {
          expect(result.total).toBe(1);
          expect(result.data.length).toBe(1);

          // Verify API was called with correct URL and mapped body
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.VALID_ATTRIBUTES.GET_ALL(25, 0),
            jasmine.objectContaining({
              attribGroup: 'ABO',
              attribCode: 'A1',
              searchKeyword: 'sub',
              sortColumn: 'attribCode',
              sortOrder: 'asc',
              stopLabelFlag: 'N',
              exclusivityFlag: 'Y',
              effectiveDateFrom: '2024-01-01',
              effectiveDateTo: '2024-12-31',
              terminationDateFrom: '2025-01-01',
              terminationDateTo: '2025-12-31'
            })
          );

          // Verify frontend model mapping
          const mapped = result.data[0];
          expect(mapped.attributeGroup).toBe('ABO');
          expect(mapped.attributeCode).toBe('A1');
          expect(mapped.description).toBe('A1 Subgroup');
          expect(mapped.price).toBe(25.50);
          expect(mapped.unitSchemeType).toBe('C');
          expect(mapped.statusFlag).toBe('A');
          expect(mapped.interCode).toBe('IC001');
          expect(mapped.stopLabelFlag).toBe('N');
          expect(mapped.assignAfterLabelFlag).toBe('Y');
          expect(mapped.showOnLabelFlag).toBe('Y');
          expect(mapped.deleteAllowed).toBe('Y');
          expect(mapped.attributeCustom).toBe('N');
          expect(mapped.normalStockFlag).toBe('Y');
          expect(mapped.creditFlag).toBe('Y');
          expect(mapped.serviceCode).toBe('SVC01');
          expect(mapped.attributeLabel).toBe('A1 Label');
          expect(mapped.attributeAbbrev).toBe('A1');
          expect(mapped.attributePosition).toBe(3);
          expect(mapped.attributeType).toBe('T');
          expect(mapped.exclusivityFlag).toBe('N');
          expect(mapped.eqCode128AttributeGroup).toBe('EQ_GRP');
          expect(mapped.eqCode128AttributeCode).toBe('EQ_CODE');
          expect(mapped.effectiveDate).toBe('2024-01-01');
          expect(mapped.terminationDate).toBe('2025-12-31');
          expect(mapped.programId).toBe('VATTRIB');
          expect(mapped.lastModifiedDate).toBe('2024-06-15');
          done();
        }
      });
    });

    it('should use default empty queryDto when none provided', (done) => {
      apiServiceSpy.post.and.returnValue(of({
        success: true,
        data: [mockValidAttributeDto],
        total: 1,
        statusCode: 200,
        message: 'Success'
      }));

      service.getAttributeCodes(10, 0).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.post.calls.mostRecent().args;
          const body = callArgs[1] as any;
          expect(body.attribGroup).toBeUndefined();
          expect(body.attribCode).toBeUndefined();
          expect(body.searchKeyword).toBeUndefined();
          done();
        }
      });
    });

    it('should return empty data array and zero total when response.data is null', (done) => {
      apiServiceSpy.post.and.returnValue(of({
        success: true,
        data: null,
        total: null,
        statusCode: 200,
        message: 'Success'
      }));

      service.getAttributeCodes(10, 0).subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          expect(result.total).toBe(0);
          done();
        }
      });
    });

    it('should return empty data array and zero total when response.data is undefined', (done) => {
      apiServiceSpy.post.and.returnValue(of({
        success: true,
        statusCode: 200,
        message: 'Success'
      } as any));

      service.getAttributeCodes(10, 0).subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          expect(result.total).toBe(0);
          done();
        }
      });
    });

    it('should apply default null/empty values for optional DTO fields', (done) => {
      apiServiceSpy.post.and.returnValue(of({
        success: true,
        data: [mockMinimalDto],
        total: 1,
        statusCode: 200,
        message: 'Success'
      }));

      service.getAttributeCodes(10, 0).subscribe({
        next: (result) => {
          const mapped = result.data[0];
          expect(mapped.price).toBeNull();
          expect(mapped.statusFlag).toBe('');
          expect(mapped.interCode).toBeNull();
          expect(mapped.stopLabelFlag).toBe('');
          expect(mapped.assignAfterLabelFlag).toBe('');
          expect(mapped.showOnLabelFlag).toBe('');
          expect(mapped.deleteAllowed).toBeNull();
          expect(mapped.attributeCustom).toBe('');
          expect(mapped.normalStockFlag).toBe('');
          expect(mapped.creditFlag).toBe('');
          expect(mapped.serviceCode).toBeNull();
          expect(mapped.attributeLabel).toBeNull();
          expect(mapped.attributeAbbrev).toBeNull();
          expect(mapped.attributePosition).toBeNull();
          expect(mapped.attributeType).toBe('');
          expect(mapped.exclusivityFlag).toBe('');
          expect(mapped.eqCode128AttributeGroup).toBeNull();
          expect(mapped.eqCode128AttributeCode).toBeNull();
          expect(mapped.effectiveDate).toBeNull();
          expect(mapped.terminationDate).toBeNull();
          expect(mapped.programId).toBeNull();
          expect(mapped.lastModifiedDate).toBeNull();
          done();
        }
      });
    });

    it('should throw when a DTO in the array is null', (done) => {
      apiServiceSpy.post.and.returnValue(of({
        success: true,
        data: [null],
        total: 1,
        statusCode: 200,
        message: 'Success'
      }));

      service.getAttributeCodes(10, 0).subscribe({
        error: (err) => {
          expect(err.message).toBe('Server returned invalid data format');
          done();
        }
      });
    });

    it('should throw when a DTO in the array is undefined', (done) => {
      apiServiceSpy.post.and.returnValue(of({
        success: true,
        data: [undefined],
        total: 1,
        statusCode: 200,
        message: 'Success'
      }));

      service.getAttributeCodes(10, 0).subscribe({
        error: (err) => {
          expect(err.message).toBe('Server returned invalid data format');
          done();
        }
      });
    });

    it('should throw when a DTO is missing attribGroup', (done) => {
      apiServiceSpy.post.and.returnValue(of({
        success: true,
        data: [{ attribCode: 'A1', attribDesc: 'Test' }],
        total: 1,
        statusCode: 200,
        message: 'Success'
      }));

      service.getAttributeCodes(10, 0).subscribe({
        error: (err) => {
          expect(err.message).toBe('Server response missing required fields (attribGroup or attribCode)');
          done();
        }
      });
    });

    it('should throw when a DTO is missing attribCode', (done) => {
      apiServiceSpy.post.and.returnValue(of({
        success: true,
        data: [{ attribGroup: 'ABO', attribDesc: 'Test' }],
        total: 1,
        statusCode: 200,
        message: 'Success'
      }));

      service.getAttributeCodes(10, 0).subscribe({
        error: (err) => {
          expect(err.message).toBe('Server response missing required fields (attribGroup or attribCode)');
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------
  // createAttributeCode
  // ---------------------------------------------------------------
  describe('createAttributeCode', () => {
    it('should map form value to create DTO and return mapped model on success', (done) => {
      apiServiceSpy.post.and.returnValue(of({
        success: true,
        data: mockValidAttributeDto,
        statusCode: 201,
        message: 'Created'
      }));

      service.createAttributeCode('ABO', mockFormValue).subscribe({
        next: (result) => {
          expect(result.attributeGroup).toBe('ABO');
          expect(result.attributeCode).toBe('A1');
          expect(result.description).toBe('A1 Subgroup');

          // Verify API was called with the correct endpoint
          const callArgs = apiServiceSpy.post.calls.mostRecent().args;
          expect(callArgs[0]).toBe(API.VALID_ATTRIBUTES.CREATE);

          // Verify the create DTO mapping
          const payload = callArgs[1] as any;
          expect(payload.attribGroup).toBe('ABO');
          expect(payload.attribCode).toBe('A1');
          expect(payload.attribDesc).toBe('A1 Subgroup');
          expect(payload.unitSchemeType).toBe('C');
          expect(payload.statusFlag).toBe('A');
          expect(payload.attribType).toBe('T');
          expect(payload.attribLabel).toBe('A1 Label');
          expect(payload.attribAbbrev).toBe('A1');
          expect(payload.attribPosition).toBe(3);
          expect(payload.normalStockFlag).toBe('Y');
          expect(payload.assignAfterLabelFlag).toBe('Y');
          expect(payload.effDate).toBe('2024-01-01');
          expect(payload.termDate).toBe('2025-12-31');
          expect(payload.interCode).toBe('IC001');
          expect(payload.stopLabelFlag).toBe('N');
          expect(payload.showOnLabelFlag).toBe('Y');
          expect(payload.attribCustom).toBe('N');
          expect(payload.creditFlag).toBe('Y');
          expect(payload.exclusivityFlag).toBe('N');
          expect(payload.deleteAllowed).toBe('Y');
          expect(payload.price).toBe(25.50);
          expect(payload.serviceCode).toBe('SVC01');
          done();
        }
      });
    });

    it('should use HttpContext with SKIP_ERROR_TOAST', (done) => {
      apiServiceSpy.post.and.returnValue(of({
        success: true,
        data: mockValidAttributeDto,
        statusCode: 201,
        message: 'Created'
      }));

      service.createAttributeCode('ABO', mockFormValue).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.post.calls.mostRecent().args;
          const options = callArgs[2] as any;
          expect(options).toBeDefined();
          expect(options.context).toBeDefined();
          expect(options.context instanceof HttpContext).toBeTrue();
          expect(options.context.get(SKIP_ERROR_TOAST)).toBeTrue();
          done();
        }
      });
    });

    it('should throw error when response.success is false', (done) => {
      apiServiceSpy.post.and.returnValue(of({
        success: false,
        data: null,
        statusCode: 409,
        errorCode: 'DUPLICATE_ENTRY',
        message: 'Attribute code already exists'
      }));

      service.createAttributeCode('ABO', mockFormValue).subscribe({
        error: (err) => {
          expect(err.error.message).toBe('Attribute code already exists');
          expect(err.error.statusCode).toBe(409);
          expect(err.error.errorCode).toBe('DUPLICATE_ENTRY');
          expect(err.message).toBe('Attribute code already exists');
          expect(err.status).toBe(409);
          done();
        }
      });
    });

    it('should default status to 400 when statusCode is falsy in error response', (done) => {
      apiServiceSpy.post.and.returnValue(of({
        success: false,
        data: null,
        statusCode: 0,
        message: 'Unknown error'
      }));

      service.createAttributeCode('ABO', mockFormValue).subscribe({
        error: (err) => {
          expect(err.status).toBe(400);
          done();
        }
      });
    });

    it('should default statusFlag to "A" for ALERT group when form statusFlag is empty', (done) => {
      const formWithoutStatus: AttributeCodeFormValue = {
        ...mockFormValue,
        statusFlag: ''
      };
      apiServiceSpy.post.and.returnValue(of({
        success: true,
        data: mockValidAttributeDto,
        statusCode: 201,
        message: 'Created'
      }));

      service.createAttributeCode('ALERT', formWithoutStatus).subscribe({
        next: () => {
          const payload = apiServiceSpy.post.calls.mostRecent().args[1] as any;
          expect(payload.statusFlag).toBe('A');
          done();
        }
      });
    });

    it('should default statusFlag to "H" for non-ALERT groups when form statusFlag is empty', (done) => {
      const formWithoutStatus: AttributeCodeFormValue = {
        ...mockFormValue,
        statusFlag: ''
      };
      apiServiceSpy.post.and.returnValue(of({
        success: true,
        data: mockValidAttributeDto,
        statusCode: 201,
        message: 'Created'
      }));

      service.createAttributeCode('ABO', formWithoutStatus).subscribe({
        next: () => {
          const payload = apiServiceSpy.post.calls.mostRecent().args[1] as any;
          expect(payload.statusFlag).toBe('H');
          done();
        }
      });
    });

    it('should handle ALERT group case-insensitively', (done) => {
      const formWithoutStatus: AttributeCodeFormValue = {
        ...mockFormValue,
        statusFlag: ''
      };
      apiServiceSpy.post.and.returnValue(of({
        success: true,
        data: mockValidAttributeDto,
        statusCode: 201,
        message: 'Created'
      }));

      service.createAttributeCode('alert', formWithoutStatus).subscribe({
        next: () => {
          const payload = apiServiceSpy.post.calls.mostRecent().args[1] as any;
          expect(payload.statusFlag).toBe('A');
          done();
        }
      });
    });

    it('should default unitSchemeType to "C" when form unitScheme is empty', (done) => {
      const formWithoutScheme: AttributeCodeFormValue = {
        ...mockFormValue,
        unitScheme: ''
      };
      apiServiceSpy.post.and.returnValue(of({
        success: true,
        data: mockValidAttributeDto,
        statusCode: 201,
        message: 'Created'
      }));

      service.createAttributeCode('ABO', formWithoutScheme).subscribe({
        next: () => {
          const payload = apiServiceSpy.post.calls.mostRecent().args[1] as any;
          expect(payload.unitSchemeType).toBe('C');
          done();
        }
      });
    });

    it('should set effDate and termDate to null when dates are null', (done) => {
      const formWithoutDates: AttributeCodeFormValue = {
        ...mockFormValue,
        effectiveDate: null,
        terminationDate: null
      };
      apiServiceSpy.post.and.returnValue(of({
        success: true,
        data: mockValidAttributeDto,
        statusCode: 201,
        message: 'Created'
      }));

      service.createAttributeCode('ABO', formWithoutDates).subscribe({
        next: () => {
          const payload = apiServiceSpy.post.calls.mostRecent().args[1] as any;
          expect(payload.effDate).toBeNull();
          expect(payload.termDate).toBeNull();
          done();
        }
      });
    });

    it('should use provided statusFlag over default when present', (done) => {
      const formWithExplicitStatus: AttributeCodeFormValue = {
        ...mockFormValue,
        statusFlag: 'I'
      };
      apiServiceSpy.post.and.returnValue(of({
        success: true,
        data: mockValidAttributeDto,
        statusCode: 201,
        message: 'Created'
      }));

      service.createAttributeCode('ABO', formWithExplicitStatus).subscribe({
        next: () => {
          const payload = apiServiceSpy.post.calls.mostRecent().args[1] as any;
          expect(payload.statusFlag).toBe('I');
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------
  // updateAttributeCode
  // ---------------------------------------------------------------
  describe('updateAttributeCode', () => {
    it('should map form value to update DTO and return mapped model on success', (done) => {
      apiServiceSpy.put.and.returnValue(of({
        success: true,
        data: mockValidAttributeDto,
        statusCode: 200,
        message: 'Updated'
      }));

      service.updateAttributeCode('ABO', 'A1', 'C', mockFormValue).subscribe({
        next: (result) => {
          expect(result.attributeGroup).toBe('ABO');
          expect(result.attributeCode).toBe('A1');

          // Verify API was called with correct URL
          const callArgs = apiServiceSpy.put.calls.mostRecent().args;
          expect(callArgs[0]).toBe(API.VALID_ATTRIBUTES.UPDATE('ABO', 'A1', 'C'));

          // Verify the update DTO mapping (no attribGroup/attribCode in update)
          const payload = callArgs[1] as any;
          expect(payload.attribDesc).toBe('A1 Subgroup');
          expect(payload.unitSchemeType).toBe('C');
          expect(payload.attribType).toBe('T');
          expect(payload.attribLabel).toBe('A1 Label');
          expect(payload.attribAbbrev).toBe('A1');
          expect(payload.attribPosition).toBe(3);
          expect(payload.normalStockFlag).toBe('Y');
          expect(payload.assignAfterLabelFlag).toBe('Y');
          expect(payload.effDate).toBe('2024-01-01');
          expect(payload.termDate).toBe('2025-12-31');
          expect(payload.interCode).toBe('IC001');
          expect(payload.stopLabelFlag).toBe('N');
          expect(payload.showOnLabelFlag).toBe('Y');
          expect(payload.attribCustom).toBe('N');
          expect(payload.creditFlag).toBe('Y');
          expect(payload.exclusivityFlag).toBe('N');
          expect(payload.deleteAllowed).toBe('Y');
          expect(payload.price).toBe(25.50);
          expect(payload.serviceCode).toBe('SVC01');
          expect(payload.statusFlag).toBe('A');

          // Verify update DTO does NOT include attribGroup or attribCode
          expect(payload.attribGroup).toBeUndefined();
          expect(payload.attribCode).toBeUndefined();
          done();
        }
      });
    });

    it('should use HttpContext with SKIP_ERROR_TOAST', (done) => {
      apiServiceSpy.put.and.returnValue(of({
        success: true,
        data: mockValidAttributeDto,
        statusCode: 200,
        message: 'Updated'
      }));

      service.updateAttributeCode('ABO', 'A1', 'C', mockFormValue).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.put.calls.mostRecent().args;
          const options = callArgs[2] as any;
          expect(options).toBeDefined();
          expect(options.context).toBeDefined();
          expect(options.context instanceof HttpContext).toBeTrue();
          expect(options.context.get(SKIP_ERROR_TOAST)).toBeTrue();
          done();
        }
      });
    });

    it('should throw error when response.success is false', (done) => {
      apiServiceSpy.put.and.returnValue(of({
        success: false,
        data: null,
        statusCode: 422,
        errorCode: 'VALIDATION_ERROR',
        message: 'Validation failed'
      }));

      service.updateAttributeCode('ABO', 'A1', 'C', mockFormValue).subscribe({
        error: (err) => {
          expect(err.error.message).toBe('Validation failed');
          expect(err.error.statusCode).toBe(422);
          expect(err.error.errorCode).toBe('VALIDATION_ERROR');
          expect(err.message).toBe('Validation failed');
          expect(err.status).toBe(422);
          done();
        }
      });
    });

    it('should default status to 400 when statusCode is falsy in error response', (done) => {
      apiServiceSpy.put.and.returnValue(of({
        success: false,
        data: null,
        statusCode: 0,
        message: 'Unknown error'
      }));

      service.updateAttributeCode('ABO', 'A1', 'C', mockFormValue).subscribe({
        error: (err) => {
          expect(err.status).toBe(400);
          done();
        }
      });
    });

    it('should throw when response is null', (done) => {
      apiServiceSpy.put.and.returnValue(of(null as any));

      service.updateAttributeCode('ABO', 'A1', 'C', mockFormValue).subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
          done();
        }
      });
    });

    it('should throw when response.data is null (success true but no data)', (done) => {
      apiServiceSpy.put.and.returnValue(of({
        success: true,
        data: null,
        statusCode: 200,
        message: 'Updated'
      }));

      service.updateAttributeCode('ABO', 'A1', 'C', mockFormValue).subscribe({
        error: (err) => {
          expect(err.message).toBe('Invalid response from server - missing data field');
          done();
        }
      });
    });

    it('should throw when response.data is undefined', (done) => {
      apiServiceSpy.put.and.returnValue(of({
        success: true,
        statusCode: 200,
        message: 'Updated'
      } as any));

      service.updateAttributeCode('ABO', 'A1', 'C', mockFormValue).subscribe({
        error: (err) => {
          expect(err.message).toBe('Invalid response from server - missing data field');
          done();
        }
      });
    });

    it('should default statusFlag to "H" in update DTO when form statusFlag is empty', (done) => {
      const formWithoutStatus: AttributeCodeFormValue = {
        ...mockFormValue,
        statusFlag: ''
      };
      apiServiceSpy.put.and.returnValue(of({
        success: true,
        data: mockValidAttributeDto,
        statusCode: 200,
        message: 'Updated'
      }));

      service.updateAttributeCode('ABO', 'A1', 'C', formWithoutStatus).subscribe({
        next: () => {
          const payload = apiServiceSpy.put.calls.mostRecent().args[1] as any;
          expect(payload.statusFlag).toBe('H');
          done();
        }
      });
    });

    it('should map optional fields with defaults in update DTO', (done) => {
      const minimalForm: AttributeCodeFormValue = {
        attributeCode: 'A1',
        description: 'A1 Subgroup',
        attributeType: null,
        normalStockFlag: 'Y',
        assignAfterLabelFlag: 'N',
        effectiveDate: null,
        terminationDate: null
      };
      apiServiceSpy.put.and.returnValue(of({
        success: true,
        data: mockValidAttributeDto,
        statusCode: 200,
        message: 'Updated'
      }));

      service.updateAttributeCode('ABO', 'A1', 'C', minimalForm).subscribe({
        next: () => {
          const payload = apiServiceSpy.put.calls.mostRecent().args[1] as any;
          expect(payload.attribType).toBe('');
          expect(payload.attribLabel).toBeNull();
          expect(payload.attribAbbrev).toBeNull();
          expect(payload.attribPosition).toBeNull();
          expect(payload.effDate).toBeNull();
          expect(payload.termDate).toBeNull();
          expect(payload.interCode).toBeNull();
          expect(payload.stopLabelFlag).toBe('N');
          expect(payload.showOnLabelFlag).toBe('Y');
          expect(payload.attribCustom).toBe('N');
          expect(payload.creditFlag).toBe('Y');
          expect(payload.exclusivityFlag).toBe('Y');
          expect(payload.deleteAllowed).toBe('Y');
          expect(payload.price).toBeNull();
          expect(payload.serviceCode).toBeNull();
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------
  // getAttributeGroups
  // ---------------------------------------------------------------
  describe('getAttributeGroups', () => {
    it('should fetch and map attribute groups', (done) => {
      apiServiceSpy.get.and.returnValue(of({
        success: true,
        data: [
          { code: 'ABO', codeDesc: 'ABO Blood Group' },
          { code: 'RH', codeDesc: 'Rh Factor' }
        ],
        statusCode: 200,
        message: 'Success'
      }));

      service.getAttributeGroups().subscribe({
        next: (groups) => {
          expect(groups.length).toBe(2);
          expect(groups[0].code).toBe('ABO');
          expect(groups[0].description).toBe('ABO Blood Group');
          expect(groups[1].code).toBe('RH');
          expect(groups[1].description).toBe('Rh Factor');
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.VALID_ATTRIBUTES.ATTRIBUTE_GROUPS);
          done();
        }
      });
    });

    it('should return empty array when response.data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({
        success: true,
        data: null,
        statusCode: 200,
        message: 'Success'
      }));

      service.getAttributeGroups().subscribe({
        next: (groups) => {
          expect(groups).toEqual([]);
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------
  // getAttributeCodesDropdown
  // ---------------------------------------------------------------
  describe('getAttributeCodesDropdown', () => {
    it('should send correct attribGroup and map to value/label', (done) => {
      apiServiceSpy.post.and.returnValue(of({
        success: true,
        data: [
          { attribCode: 'A1', attribGroup: 'ABO', attribDesc: 'A1 Sub' },
          { attribCode: 'B', attribGroup: 'ABO', attribDesc: 'B Type' }
        ],
        total: 2,
        statusCode: 200,
        message: 'Success'
      }));

      service.getAttributeCodesDropdown('ABO').subscribe({
        next: (items) => {
          expect(items.length).toBe(2);
          expect(items[0].value).toBe('A1');
          expect(items[0].label).toBe('A1');
          expect(items[1].value).toBe('B');
          expect(items[1].label).toBe('B');

          // Verify called with GET_ALL(100, 0) and the attribGroup body
          const callArgs = apiServiceSpy.post.calls.mostRecent().args;
          expect(callArgs[0]).toBe(API.VALID_ATTRIBUTES.GET_ALL(100, 0));
          expect(callArgs[1]).toEqual({ attribGroup: 'ABO' });
          done();
        }
      });
    });

    it('should return empty array when response.data is null', (done) => {
      apiServiceSpy.post.and.returnValue(of({
        success: true,
        data: null,
        statusCode: 200,
        message: 'Success'
      }));

      service.getAttributeCodesDropdown('ABO').subscribe({
        next: (items) => {
          expect(items).toEqual([]);
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------
  // getInterdictionCodes
  // ---------------------------------------------------------------
  describe('getInterdictionCodes', () => {
    it('should use default statusFlag "A" and call correct endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of({
        data: [
          { interCode: 'IC001', interDesc: 'Interdiction 1' }
        ]
      }));

      service.getInterdictionCodes().subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.VALID_ATTRIBUTES.INTERDICTION_CODES('A')
          );
          done();
        }
      });
    });

    it('should accept custom statusFlag', (done) => {
      apiServiceSpy.get.and.returnValue(of({
        data: []
      }));

      service.getInterdictionCodes('I').subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.VALID_ATTRIBUTES.INTERDICTION_CODES('I')
          );
          done();
        }
      });
    });

    it('should handle response as direct array', (done) => {
      apiServiceSpy.get.and.returnValue(of([
        { interCode: 'IC001', interDesc: 'Interdiction 1' },
        { interCode: 'IC002', interDesc: 'Interdiction 2' }
      ]));

      service.getInterdictionCodes().subscribe({
        next: (items) => {
          expect(items.length).toBe(2);
          expect(items[0].value).toBe('IC001');
          expect(items[0].label).toBe('IC001');
          expect(items[0].description).toBe('Interdiction 1');
          expect(items[1].value).toBe('IC002');
          expect(items[1].label).toBe('IC002');
          expect(items[1].description).toBe('Interdiction 2');
          done();
        }
      });
    });

    it('should handle response with data property (lowercase)', (done) => {
      apiServiceSpy.get.and.returnValue(of({
        data: [
          { interCode: 'IC001', interDesc: 'Interdiction 1' }
        ]
      }));

      service.getInterdictionCodes().subscribe({
        next: (items) => {
          expect(items.length).toBe(1);
          expect(items[0].value).toBe('IC001');
          expect(items[0].label).toBe('IC001');
          expect(items[0].description).toBe('Interdiction 1');
          done();
        }
      });
    });

    it('should handle response with Data property (uppercase)', (done) => {
      apiServiceSpy.get.and.returnValue(of({
        Data: [
          { InterCode: 'IC001', InterDesc: 'Interdiction 1' }
        ]
      }));

      service.getInterdictionCodes().subscribe({
        next: (items) => {
          expect(items.length).toBe(1);
          expect(items[0].value).toBe('IC001');
          expect(items[0].label).toBe('IC001');
          expect(items[0].description).toBe('Interdiction 1');
          done();
        }
      });
    });

    it('should handle PascalCase field names in items', (done) => {
      apiServiceSpy.get.and.returnValue(of([
        { InterCode: 'IC003', InterDesc: 'PascalCase Item' }
      ]));

      service.getInterdictionCodes().subscribe({
        next: (items) => {
          expect(items.length).toBe(1);
          expect(items[0].value).toBe('IC003');
          expect(items[0].label).toBe('IC003');
          expect(items[0].description).toBe('PascalCase Item');
          done();
        }
      });
    });

    it('should return empty strings when interCode and interDesc are missing', (done) => {
      apiServiceSpy.get.and.returnValue(of([
        {}
      ]));

      service.getInterdictionCodes().subscribe({
        next: (items) => {
          expect(items.length).toBe(1);
          expect(items[0].value).toBe('');
          expect(items[0].label).toBe('');
          expect(items[0].description).toBe('');
          done();
        }
      });
    });

    it('should return empty array when response has no data property and is not an array', (done) => {
      apiServiceSpy.get.and.returnValue(of({}));

      service.getInterdictionCodes().subscribe({
        next: (items) => {
          expect(items).toEqual([]);
          done();
        }
      });
    });
  });
});
