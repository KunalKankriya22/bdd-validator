import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { IsbtAttributeLookupApiService } from './isbt-attribute-lookup-api.service';
import { ApiService } from '@shared/services/api.service';
import { of } from 'rxjs';
import {
  IsbtAttributeDto,
  IsbtAttributeGroupDto,
  ProductFormulaDto,
  ProductLovOption,
  AttributeGroupLovOption,
  AttributeCodeLovOption,
  IsbtAttributeSearchParams,
} from '../models/isbt-attribute-lookup.model';

describe('IsbtAttributeLookupApiService', () => {
  let service: IsbtAttributeLookupApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockAttributes: IsbtAttributeDto[] = [
    { attribCode: 'V001', attribGroup: 'A', description: 'Test Attribute' } as any,
  ];

  const mockAttributeGroup: IsbtAttributeGroupDto = {
    code: 'A', description: 'Group A'
  } as any;

  const mockProductFormula: ProductFormulaDto = {
    productCode: 'RBC', description: 'Red Blood Cells'
  } as any;

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        IsbtAttributeLookupApiService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(IsbtAttributeLookupApiService);
  });

  describe('searchAttributes', () => {
    it('should call apiService.get with attribGroup param', () => {
      const params: IsbtAttributeSearchParams = { attribGroup: 'A' };
      apiServiceSpy.get.and.returnValue(of({ data: mockAttributes }));

      service.searchAttributes(params).subscribe(result => {
        expect(result).toEqual(mockAttributes);
      });

      expect(apiServiceSpy.get).toHaveBeenCalled();
    });

    it('should return empty array when response data is null', () => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));
      const params: IsbtAttributeSearchParams = { attribGroup: '' };

      service.searchAttributes(params).subscribe(result => {
        expect(result).toEqual([]);
      });
    });


  });

  describe('getAttributeGroup', () => {
    it('should call apiService.get with code', () => {
      apiServiceSpy.get.and.returnValue(of({ data: mockAttributeGroup }));

      service.getAttributeGroup('A').subscribe(result => {
        expect(result).toEqual(mockAttributeGroup);
      });

      expect(apiServiceSpy.get).toHaveBeenCalled();
    });
  });

  describe('getAttributeGroupsLov', () => {
    it('should return attribute groups', () => {
      const groups: AttributeGroupLovOption[] = [{ code: 'A', description: 'Group A' } as any];
      apiServiceSpy.get.and.returnValue(of({ data: groups }));

      service.getAttributeGroupsLov().subscribe(result => {
        expect(result).toEqual(groups);
      });
    });

  });

  describe('getNewCodesLov', () => {
    it('should return new codes', () => {
      const codes: AttributeCodeLovOption[] = [{ code: 'V001', description: 'Test' } as any];
      apiServiceSpy.get.and.returnValue(of({ data: codes }));

      service.getNewCodesLov().subscribe(result => {
        expect(result).toEqual(codes);
      });
    });
  });

  describe('getOldCodesLov', () => {
    it('should return old codes', () => {
      const codes: AttributeCodeLovOption[] = [{ code: 'O001', description: 'Old Test' } as any];
      apiServiceSpy.get.and.returnValue(of({ data: codes }));

      service.getOldCodesLov().subscribe(result => {
        expect(result).toEqual(codes);
      });
    });
  });

  describe('getProductFormula', () => {
    it('should call apiService.get with product code', () => {
      apiServiceSpy.get.and.returnValue(of({ data: mockProductFormula }));

      service.getProductFormula('RBC').subscribe(result => {
        expect(result).toEqual(mockProductFormula);
      });

      expect(apiServiceSpy.get).toHaveBeenCalled();
    });
  });

  describe('getProductsLov', () => {
    it('should return product LOV options', () => {
      const products: ProductLovOption[] = [{ productCode: 'RBC', description: 'Red Blood Cells' } as any];
      apiServiceSpy.get.and.returnValue(of({ data: products }));

      service.getProductsLov().subscribe(result => {
        expect(result).toEqual(products);
      });
    });

  });

  describe('getGroupMapping', () => {
    it('should return mapped group code for new-to-old', () => {
      apiServiceSpy.get.and.returnValue(of({ data: { mappedGroupCode: 'OA' } }));

      service.getGroupMapping('new-to-old', 'A').subscribe(result => {
        expect(result).toBe('OA');
      });
    });

    it('should return mapped group code for old-to-new', () => {
      apiServiceSpy.get.and.returnValue(of({ data: { mappedGroupCode: 'A' } }));

      service.getGroupMapping('old-to-new', 'OA').subscribe(result => {
        expect(result).toBe('A');
      });
    });
  });
});
