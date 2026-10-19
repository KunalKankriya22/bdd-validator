import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { DeleteUnitAttributeApiService } from './delete-unit-attribute-api.service';
import {
  ApiResponse,
  DuattrUnitValidationResult,
  UnitAttributeRow,
  AttributeToDelete
} from '../models/delete-unit-attribute.model';

describe('DeleteUnitAttributeApiService', () => {
  let service: DeleteUnitAttributeApiService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('HttpClient', ['get', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        DeleteUnitAttributeApiService,
        { provide: HttpClient, useValue: spy }
      ]
    });

    service = TestBed.inject(DeleteUnitAttributeApiService);
    httpSpy = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
  });

  describe('validateUnit', () => {
    it('should return validation result on success', (done) => {
      // Arrange
      const mockValidation: DuattrUnitValidationResult = { collectionDate: '2026-01-15' };
      const mockResponse: ApiResponse<DuattrUnitValidationResult> = {
        success: true,
        data: mockValidation,
        statusCode: 200,
        message: 'Success'
      };
      httpSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.validateUnit('U001', 'ISBT').subscribe({
        next: (result) => {
          // Assert
          expect(result.collectionDate).toBe('2026-01-15');
          expect(httpSpy.get).toHaveBeenCalled();
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('getAttributes', () => {
    it('should return data and totalRecords', (done) => {
      // Arrange
      const mockAttributes: UnitAttributeRow[] = [
        { attribGroup: 'GRP1', attribCode: 'A01', attribDesc: 'Attribute 1' }
      ];
      const mockResponse: ApiResponse<UnitAttributeRow[]> = {
        success: true,
        data: mockAttributes,
        total: 1,
        statusCode: 200
      };
      httpSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getAttributes('U001', '2026-01-15', 'ISBT').subscribe({
        next: (result) => {
          // Assert
          expect(result.data.length).toBe(1);
          expect(result.totalRecords).toBe(1);
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('deleteAttributes', () => {
    it('should delete attributes and return data on success', (done) => {
      // Arrange
      const attributes: AttributeToDelete[] = [{ attribGroup: 'GRP1', attribCode: 'A01' }];
      const mockResponse: ApiResponse<unknown> = {
        success: true,
        data: null,
        statusCode: 200,
        message: 'Deleted'
      };
      httpSpy.delete.and.returnValue(of(mockResponse));

      // Act
      service.deleteAttributes('U001', '2026-01-15', attributes, 'ISBT').subscribe({
        next: () => {
          // Assert
          expect(httpSpy.delete).toHaveBeenCalled();
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });
});
