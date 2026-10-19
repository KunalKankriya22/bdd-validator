import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { AboValuesService } from './abo-values.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  AboValuesModel,
  AboValuesParamsDto,
  AboValuesDto,
  UpdateAboValuesDto
} from '../models/abo-values.model';

describe('AboValuesService', () => {
  let service: AboValuesService;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AboValuesService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(AboValuesService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getAboValues', () => {
    it('should fetch ABO values data successfully', (done) => {
      const mockResponse = {
        success: true,
        data: [
          {
            testedAbo: 'A',
            description: 'A Description',
            intendedUse: 'Transfusion',
            unitScheme: 'C',
            aboLabel: 'A',
            aboDescription: 'Type A',
            bloodTypeCode: 'A',
            transfusionStatus: 'E',
            aboOnly: 'Y',
            alternateAbo: '',
            usageCode: 'U',
            effectiveDate: new Date('2024-01-01'),
            terminationDate: null
          }
        ],
        total: 1
      };

      const params: AboValuesParamsDto = {
        searchKeyword: '',
        sort: ''
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getAboValues(10, 0, params).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.totalRecords).toBe(1);
        expect(apiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.ABO_VALUES(10, 0),
          params
        );
        done();
      });
    });


    it('should propagate other errors', (done) => {
      const params: AboValuesParamsDto = {
        searchKeyword: '',
        sort: ''
      };

      const error500 = {
        status: 500,
        error: { message: 'Internal Server Error' }
      };

      apiService.post.and.returnValue(throwError(() => error500));

      service.getAboValues(10, 0, params).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });
    });
  });

  describe('getAboValuesFilters', () => {
    it('should fetch filter dropdown values successfully', (done) => {
      const mockResponse = {
        success: true,
        data: [
          {
            intendedUse: [{ key: 'Transfusion', value: 'T' }],
            unitScheme: [{ key: 'Component', value: 'C' }],
            transfusionStatus: [{ key: 'Eligible', value: 'E' }]
          }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getAboValuesFilters().subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(apiService.get).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.ABO_VALUES_FILTERS
        );
        done();
      });
    });

    it('should handle errors when fetching filters', (done) => {
      const errorResponse = {
        status: 500,
        error: { message: 'Internal Server Error' }
      };

      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getAboValuesFilters().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });
    });
  });

  describe('getAboValuesDropdowns', () => {
    it('should fetch add/edit dropdown values successfully', (done) => {
      const mockResponse = {
        success: true,
        data: [
          {
            testedABO: [{ key: 'A', value: 'A' }],
            intendedUse: [{ key: 'Transfusion', value: 'T' }],
            unitScheme: [{ key: 'Component', value: 'C' }],
            transfusionStatus: [{ key: 'Eligible', value: 'E' }],
            aboOnly: [{ key: 'Yes', value: 'Y' }, { key: 'No', value: 'N' }]
          }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getAboValuesDropdowns().subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(apiService.get).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.ABO_VALUES_DROPDOWNS
        );
        done();
      });
    });

    it('should handle errors when fetching dropdowns', (done) => {
      const errorResponse = {
        status: 500,
        error: { message: 'Internal Server Error' }
      };

      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getAboValuesDropdowns().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });
    });
  });

  describe('addAboValues', () => {
    it('should add new ABO values record successfully', (done) => {
      const newRecord: AboValuesDto = {
        testedAbo: 'A',
        intendedUse: 'T',
        unitScheme: 'C',
        aboLabel: 'A',
        aboDescription: 'Type A',
        transfusionStatus: 'E',
        bloodTypeCode: 'A',
        aboOnly: 'Y',
        alternateAbo: '',
        usageCode: 'U',
        effectiveDate: '2024-01-01T00:00:00.000Z',
        terminationDate: null
      };

      const mockResponse = {
        success: true,
        message: 'ABO Value added successfully',
        data: []
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.addAboValues(newRecord).subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(apiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.ABO_VALUES_ADD_EDIT,
          newRecord
        );
        done();
      });
    });

    it('should handle duplicate record error (409)', (done) => {
      const newRecord: AboValuesDto = {
        testedAbo: 'A',
        intendedUse: 'T',
        unitScheme: 'C',
        aboLabel: 'A',
        aboDescription: 'Type A',
        transfusionStatus: 'E',
        bloodTypeCode: 'A',
        aboOnly: 'Y',
        alternateAbo: '',
        usageCode: 'U',
        effectiveDate: '2024-01-01T00:00:00.000Z',
        terminationDate: null
      };

      const error409 = {
        status: 409,
        error: { message: 'Record already exists' }
      };

      apiService.post.and.returnValue(throwError(() => error409));

      service.addAboValues(newRecord).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        }
      });
    });
  });

  describe('updateAboValues', () => {
    it('should update ABO values record successfully', (done) => {
      const updateData: UpdateAboValuesDto = {
        auditKey: 2031356,
        originalTestedAbo: 'A',
        originalIntendedUse: 'T',
        originalUnitScheme: 'C',
        intendedUse: 'T',
        unitScheme: 'C',
        aboLabel: 'A Updated',
        aboDescription: 'Type A Updated',
        transfusionStatus: 'E',
        bloodTypeCode: 'A',
        aboOnly: 'Y',
        alternateAbo: '',
        usageCode: 'U',
        effectiveDate: '2024-01-01T00:00:00.000Z',
        terminationDate: null
      };

      const mockResponse = {
        success: true,
        message: 'ABO Value updated successfully',
        data: []
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.updateAboValues(updateData).subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(apiService.put).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.ABO_VALUES_ADD_EDIT,
          updateData
        );
        done();
      });
    });

    it('should handle record not found error (404)', (done) => {
      const updateData: UpdateAboValuesDto = {
        auditKey: 2031356,
        originalTestedAbo: 'A',
        originalIntendedUse: 'T',
        originalUnitScheme: 'C',
        intendedUse: 'T',
        unitScheme: 'C',
        aboLabel: 'A',
        aboDescription: 'Type A',
        transfusionStatus: 'E',
        bloodTypeCode: 'A',
        aboOnly: 'Y',
        alternateAbo: '',
        usageCode: 'U',
        effectiveDate: '2024-01-01T00:00:00.000Z',
        terminationDate: null
      };

      const error404 = {
        status: 404,
        error: { message: 'Record not found' }
      };

      apiService.put.and.returnValue(throwError(() => error404));

      service.updateAboValues(updateData).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });
    });
  });
});
