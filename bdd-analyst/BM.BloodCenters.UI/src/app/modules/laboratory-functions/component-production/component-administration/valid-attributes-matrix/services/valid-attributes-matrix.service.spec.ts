import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ValidAttributesMatrixService } from './valid-attributes-matrix.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ValidAttributesMatrix,
  CreateValidAttributesMatrixDto,
  UpdateValidAttributesMatrixDto,
  ValidAttributesMatrixParamsDto,
  ApiResponse,
  AttributeGroupDropdown,
  AttributeCodeDropdown,
  ModifierCodeDropdown
} from '../models/valid-attributes-matrix.model';

describe('ValidAttributesMatrixService', () => {
  let service: ValidAttributesMatrixService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockRecord: ValidAttributesMatrix = {
    attribAddedGroup: '+',
    attribAddedCode: '+01',
    attribDeletedGroup: null,
    attribDeletedCode: 'V0001073',
    deleteModifierCode: 'M0007',
    addModifierCode: 'M0012',
    associatedAttribGroup: null,
    associatedAttribCode: 'V0001071',
    effDate: '2024-01-01',
    termDate: null,
    lastModifiedDate: '2024-01-01',
    auditKey: 12345,
    programId: 'VATTRMAT',
    attribAddedGroupDesc: 'Product Group Modifier',
    attribAddedCodeDesc: 'Washed'
  };

  const mockApiResponse: ApiResponse<ValidAttributesMatrix[]> = {
    success: true,
    data: [mockRecord],
    total: 1,
    statusCode: 200,
    message: 'Success'
  };

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        ValidAttributesMatrixService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });

    service = TestBed.inject(ValidAttributesMatrixService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getValidAttributesMatrix', () => {
    it('should fetch with params', (done) => {
      const params: ValidAttributesMatrixParamsDto = { attribAddedCode: '+01', searchKeyword: 'A' };
      apiServiceSpy.post.and.returnValue(of(mockApiResponse));

      service.getValidAttributesMatrix(25, 0, params).subscribe({
        next: (response) => {
          expect(response).toEqual(mockApiResponse);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(API.VALID_ATTRIBUTES_MATRIX.LIST(25, 0), params);
          done();
        }
      });
    });

  });

  describe('getValidAttributesMatrixById', () => {
    it('should fetch by composite key', (done) => {
      const mockResponse: ApiResponse<ValidAttributesMatrix[]> = {
        success: true, data: [mockRecord], statusCode: 200, message: 'Success'
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getValidAttributesMatrixById('+', '+01').subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.VALID_ATTRIBUTES_MATRIX.GET_BY_ID('+', '+01'));
          done();
        }
      });
    });

    it('should append query params for deletedCode and associatedCode', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockApiResponse));

      service.getValidAttributesMatrixById('+', '+01', 'V0001073', 'V0001071').subscribe({
        next: () => {
          const url = apiServiceSpy.get.calls.mostRecent().args[0] as string;
          expect(url).toContain('attribDeletedCode=');
          expect(url).toContain('associatedAttribCode=');
          done();
        }
      });
    });
  });

  describe('createValidAttributesMatrix', () => {
    it('should create a new entry', (done) => {
      const dto: CreateValidAttributesMatrixDto = {
        attribAddedGroup: '+',
        attribAddedCode: '+01',
        effDate: '2024-01-01',
        termDate: null
      };
      const mockResponse: ApiResponse<unknown> = {
        success: true, data: null, statusCode: 201, message: 'Created'
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.createValidAttributesMatrix(dto).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(apiServiceSpy.post).toHaveBeenCalled();
          const callArgs = apiServiceSpy.post.calls.mostRecent().args;
          expect(callArgs[0]).toBe(API.VALID_ATTRIBUTES_MATRIX.CREATE);
          expect(callArgs[1]).toEqual(dto);
          done();
        }
      });
    });
  });

  describe('updateValidAttributesMatrix', () => {
    it('should update an entry with query params', (done) => {
      const dto: UpdateValidAttributesMatrixDto = {
        deleteModifierCode: 'M0007',
        addModifierCode: 'M0012',
        effDate: '2024-01-01',
        termDate: '2024-12-31'
      };
      const mockResponse: ApiResponse<unknown> = {
        success: true, data: null, statusCode: 200, message: 'Updated'
      };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.updateValidAttributesMatrix('+', '+01', dto, 'V0001073', 'V0001071').subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          const url = apiServiceSpy.put.calls.mostRecent().args[0] as string;
          expect(url).toContain('attribDeletedCode=');
          expect(url).toContain('associatedAttribCode=');
          done();
        }
      });
    });
  });

  describe('deleteValidAttributesMatrix', () => {
    it('should delete an entry', (done) => {
      const mockResponse: ApiResponse<boolean> = {
        success: true, data: true, statusCode: 200, message: 'Deleted'
      };
      apiServiceSpy.delete.and.returnValue(of(mockResponse));

      service.deleteValidAttributesMatrix('+', '+01').subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(apiServiceSpy.delete).toHaveBeenCalled();
          done();
        }
      });
    });
  });

  describe('getAttributeGroups', () => {
    it('should fetch attribute groups', (done) => {
      const mockGroups: AttributeGroupDropdown[] = [
        { code: '+', codeDesc: 'Product Group Modifier' }
      ];
      apiServiceSpy.get.and.returnValue(of(mockGroups));

      service.getAttributeGroups().subscribe({
        next: (groups) => {
          expect(groups).toEqual(mockGroups);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.VALID_ATTRIBUTES_MATRIX.ATTRIBUTE_GROUPS());
          done();
        }
      });
    });

    it('should pass searchParam when provided', (done) => {
      apiServiceSpy.get.and.returnValue(of([]));

      service.getAttributeGroups('test').subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.VALID_ATTRIBUTES_MATRIX.ATTRIBUTE_GROUPS('test'));
          done();
        }
      });
    });
  });

  describe('getAttributeCodes', () => {
    it('should fetch all attribute codes when no group specified', (done) => {
      const mockCodes: AttributeCodeDropdown[] = [
        { attribCode: '+01', attribDesc: 'Washed' }
      ];
      apiServiceSpy.get.and.returnValue(of(mockCodes));

      service.getAttributeCodes().subscribe({
        next: (codes) => {
          expect(codes).toEqual(mockCodes);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.VALID_ATTRIBUTES_MATRIX.ATTRIBUTE_CODES(undefined, undefined));
          done();
        }
      });
    });

    it('should fetch attribute codes for a specific group', (done) => {
      const mockCodes: AttributeCodeDropdown[] = [
        { attribCode: '+01', attribDesc: 'Washed' }
      ];
      apiServiceSpy.get.and.returnValue(of(mockCodes));

      service.getAttributeCodes('+').subscribe({
        next: (codes) => {
          expect(codes).toEqual(mockCodes);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.VALID_ATTRIBUTES_MATRIX.ATTRIBUTE_CODES('+', undefined));
          done();
        }
      });
    });
  });

  describe('getDeletedAttributeCodes', () => {
    it('should fetch deleted attribute codes', (done) => {
      const mockCodes: AttributeCodeDropdown[] = [
        { attribCode: 'V0001073', attribDesc: 'Deleted Code 1' }
      ];
      apiServiceSpy.get.and.returnValue(of(mockCodes));

      service.getDeletedAttributeCodes().subscribe({
        next: (codes) => {
          expect(codes).toEqual(mockCodes);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.VALID_ATTRIBUTES_MATRIX.DELETED_ATTRIBUTE_CODES(undefined, undefined));
          done();
        }
      });
    });

    it('should pass searchParam when provided', (done) => {
      apiServiceSpy.get.and.returnValue(of([]));

      service.getDeletedAttributeCodes(undefined, 'test').subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.VALID_ATTRIBUTES_MATRIX.DELETED_ATTRIBUTE_CODES(undefined, 'test'));
          done();
        }
      });
    });
  });

  describe('getAssociatedAttributeCodes', () => {
    it('should fetch associated attribute codes', (done) => {
      const mockCodes: AttributeCodeDropdown[] = [
        { attribCode: 'E0300N0001', attribDesc: 'Some description' }
      ];
      apiServiceSpy.get.and.returnValue(of(mockCodes));

      service.getAssociatedAttributeCodes().subscribe({
        next: (codes) => {
          expect(codes).toEqual(mockCodes);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.VALID_ATTRIBUTES_MATRIX.ASSOCIATED_ATTRIBUTE_CODES(undefined, undefined));
          done();
        }
      });
    });

    it('should pass searchParam when provided', (done) => {
      apiServiceSpy.get.and.returnValue(of([]));

      service.getAssociatedAttributeCodes(undefined, 'test').subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.VALID_ATTRIBUTES_MATRIX.ASSOCIATED_ATTRIBUTE_CODES(undefined, 'test'));
          done();
        }
      });
    });
  });

  describe('getModifierCodes', () => {
    it('should fetch modifier codes', (done) => {
      const mockCodes: ModifierCodeDropdown[] = [
        { code: 'M0007', description: 'Modifier 7' }
      ];
      apiServiceSpy.get.and.returnValue(of(mockCodes));

      service.getModifierCodes().subscribe({
        next: (codes) => {
          expect(codes).toEqual(mockCodes);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.VALID_ATTRIBUTES_MATRIX.MODIFIER_CODES());
          done();
        }
      });
    });
  });
});
