import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ValidProductSubstitutionService } from './valid-product-substitution.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ValidProductSubstitutionModel,
  ValidProductSubstitutionParamsDto,
  ValidProductSubstitutionFilterLov,
  ValidProductSubstitutionDto,
  UpdateValidProductSubstitutionDto
} from '../models/valid-product-substitution.model';
import { of, throwError } from 'rxjs';
import moment from 'moment';

describe('ValidProductSubstitutionService', () => {
  let service: ValidProductSubstitutionService;
  let apiService: jasmine.SpyObj<ApiService>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ValidProductSubstitutionService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(ValidProductSubstitutionService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getValidProductSubstitution', () => {
    it('should fetch valid product substitution data successfully', (done) => {
      const take = 25;
      const skip = 0;
      const params: ValidProductSubstitutionParamsDto = {
        SearchKeyword: 'test'
      };

      const mockResponse = {
        success: true,
        data: [
          {
            requestProductType: 'WRBC',
            requestProductTypeDescription: 'Washed Red Blood Cells',
            compatibleProductType: 'LRBC',
            compatibleProductTypeDescription: 'LeukoReduced RBC',
            effectiveDate: new Date('1994-09-13'),
            modificationDate: new Date('1994-09-13')
          }
        ],
        total: 1
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getValidProductSubstitution(take, skip, params).subscribe(result => {
        expect(result.data).toEqual(mockResponse.data);
        expect(result.totalRecords).toBe(1);
        expect(apiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.VALID_PRODUCT_SUBSTITUTION(take, skip),
          params
        );
        done();
      });
    });



  });

  describe('getValidProductSubstitutionFilters', () => {
    it('should fetch filter options successfully with code and description', (done) => {
      const mockResponse = {
        requestProductType: [
          { code: 'WRBC', description: 'Washed Red Blood Cells' },
          { code: 'LRBC', description: 'LeukoReduced RBC' },
          { code: 'RBC', description: 'Red Blood Cells' }
        ],
        compatibleProductType: [
          { code: 'LRBC', description: 'LeukoReduced RBC' },
          { code: 'RBC', description: 'Red Blood Cells' },
          { code: 'PRBC', description: 'Packed Red Blood Cells' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getValidProductSubstitutionFilters().subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(result.requestProductType).toBeDefined();
        expect(result.requestProductType!.length).toBe(3);
        expect(result.requestProductType![0].code).toBe('WRBC');
        expect(result.requestProductType![0].description).toBe('Washed Red Blood Cells');
        expect(apiService.get).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.VALID_PRODUCT_SUBSTITUTION_FILTERS
        );
        done();
      });
    });


    it('should handle error when fetching filters', (done) => {
      const errorResponse = { status: 404, statusText: 'Not Found' };

      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getValidProductSubstitutionFilters().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(404);
          done();
        }
      });
    });
  });

  describe('getInventoryProductTypes', () => {
    it('should fetch inventory product types successfully with code and description', (done) => {
      const mockResponse = [
        { code: 'WRBC', description: 'Washed Red Blood Cells' },
        { code: 'LRBC', description: 'LeukoReduced RBC' },
        { code: 'RBC', description: 'Red Blood Cells' },
        { code: 'PRBC', description: 'Packed Red Blood Cells' }
      ];

      apiService.get.and.returnValue(of(mockResponse));

      service.getInventoryProductTypes().subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(result.length).toBe(4);
        expect(result[0].code).toBe('WRBC');
        expect(result[0].description).toBe('Washed Red Blood Cells');
        expect(apiService.get).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.INVENTORY_PRODUCT_TYPES
        );
        done();
      });
    });


    it('should handle error when fetching product types', (done) => {
      const errorResponse = { status: 500, statusText: 'Server Error' };

      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getInventoryProductTypes().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(500);
          done();
        }
      });
    });
  });

  describe('addValidProductSubstitution', () => {
    it('should add new valid product substitution successfully', (done) => {
      const futureDate = moment().add(1, 'month');
      const futureDateString = futureDate.format('YYYY-MM-DD');

      const newData: ValidProductSubstitutionDto = {
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: futureDateString,
        terminationDate: null
      };

      const mockResponse = {
        success: true,
        message: 'Record added successfully',
        item: {
          requestProductType: 'WRBC',
          compatibleProductType: 'LRBC',
          effectiveDate: futureDate.toDate(),
          terminationDate: null
        }
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.addValidProductSubstitution(newData).subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(apiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.VALID_PRODUCT_SUBSTITUTION_ADD_EDIT,
          newData
        );
        done();
      });
    });

    it('should handle error when adding record', (done) => {
      const futureDate = moment().add(1, 'month');
      const futureDateString = futureDate.format('YYYY-MM-DD');

      const newData: ValidProductSubstitutionDto = {
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: futureDateString,
        terminationDate: null
      };

      const errorResponse = { status: 409, statusText: 'Conflict' };

      apiService.post.and.returnValue(throwError(() => errorResponse));

      service.addValidProductSubstitution(newData).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(409);
          done();
        }
      });
    });
  });

  describe('updateValidProductSubstitution', () => {
    it('should update existing valid product substitution successfully', (done) => {
      const futureDate = moment().add(1, 'month');
      const futureTermDate = moment().add(6, 'months');
      const futureDateString = futureDate.format('YYYY-MM-DD');
      const futureTermDateString = futureTermDate.format('YYYY-MM-DD');

      const updateData: UpdateValidProductSubstitutionDto = {
        originalRequestProductType: 'WRBC',
        originalCompatibleProductType: 'LRBC',
        requestProductType: 'WRBC',
        compatibleProductType: 'RBC',
        effectiveDate: futureDateString,
        terminationDate: futureTermDateString
      };

      const mockResponse = {
        success: true,
        message: 'Record updated successfully',
        item: {
          requestProductType: 'WRBC',
          compatibleProductType: 'RBC',
          effectiveDate: futureDate.toDate(),
          terminationDate: futureTermDate.toDate()
        }
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.updateValidProductSubstitution(updateData).subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(apiService.put).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.VALID_PRODUCT_SUBSTITUTION_ADD_EDIT,
          updateData
        );
        done();
      });
    });

    it('should handle error when updating record', (done) => {
      const futureDate = moment().add(1, 'month');
      const futureDateString = futureDate.format('YYYY-MM-DD');

      const updateData: UpdateValidProductSubstitutionDto = {
        originalRequestProductType: 'WRBC',
        originalCompatibleProductType: 'LRBC',
        requestProductType: 'WRBC',
        compatibleProductType: 'RBC',
        effectiveDate: futureDateString,
        terminationDate: null
      };

      const errorResponse = { status: 404, statusText: 'Not Found' };

      apiService.put.and.returnValue(throwError(() => errorResponse));

      service.updateValidProductSubstitution(updateData).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(404);
          done();
        }
      });
    });
  });
});
