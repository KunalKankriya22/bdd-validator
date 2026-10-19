import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ValidAboService } from './valid-abo.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ValidAboModel,
  ValidAboParamsDto,
  ValidAboFilterLov,
  ValidAboLookupsResponse
} from '../models/valid-abo.model';
import { of, throwError } from 'rxjs';

describe('ValidAboService', () => {
  let service: ValidAboService;
  let apiService: jasmine.SpyObj<ApiService>;

  // Use dynamic dates for testing
  const today = new Date();
  const effectiveDate = new Date(today);
  effectiveDate.setDate(today.getDate() + 1);
  const terminationDate = new Date(today);
  terminationDate.setMonth(today.getMonth() + 6);

  const effectiveDateStr = effectiveDate.toISOString().split('T')[0];
  const terminationDateStr = terminationDate.toISOString().split('T')[0];

  // Expected transformed data (camelCase)
  const mockValidAboData: ValidAboModel[] = [
    {
      code: 'A+',
      description: 'A Positive',
      intendedUse: 'RG-Default',
      unitScheme: 'ISBT128',
      transfusionStatus: 'Transfusable',
      mnemonic1: 'APOS',
      mnemonic2: 'AP',
      group: '1',
      sequence: 1,
      aboGroupOnly: false,
      effectiveDate: effectiveDateStr,
      terminationDate: null
    },
    {
      code: 'B-',
      description: 'B Negative',
      intendedUse: 'EM-Emergency',
      unitScheme: 'Codabar',
      transfusionStatus: 'Not Transfusable',
      mnemonic1: 'BNEG',
      mnemonic2: 'BN',
      group: '2',
      sequence: 2,
      aboGroupOnly: false,
      effectiveDate: effectiveDateStr,
      terminationDate: terminationDateStr
    }
  ];

  // API response data (PascalCase - as returned by backend)
  const mockApiData = [
    {
      Code: 'A+',
      Description: 'A Positive',
      IntendedUse: 'RG-Default',
      UnitScheme: 'ISBT128',
      TransfusionStatus: 'Transfusable',
      Mnemonic1: 'APOS',
      Mnemonic2: 'AP',
      Group: 1,
      Sequence: 1,
      AboGroupOnly: false,
      EffectiveDate: effectiveDateStr,
      TerminationDate: null
    },
    {
      Code: 'B-',
      Description: 'B Negative',
      IntendedUse: 'EM-Emergency',
      UnitScheme: 'Codabar',
      TransfusionStatus: 'Not Transfusable',
      Mnemonic1: 'BNEG',
      Mnemonic2: 'BN',
      Group: 2,
      Sequence: 2,
      AboGroupOnly: false,
      EffectiveDate: effectiveDateStr,
      TerminationDate: terminationDateStr
    }
  ];

  const mockFilterLovData: ValidAboFilterLov = {
    intendedUse: ['EM-Emergency', 'RG-Default', 'AO-Autologous', 'AB-Biohazardous'],
    unitScheme: ['ISBT128', 'Codabar'],
    transfusionStatus: ['Transfusable', 'Not Transfusable', 'Biohazard', 'Manufacturing', 'HOLD']
  };

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ValidAboService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(ValidAboService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getValidAbo', () => {
    it('should fetch valid ABO list successfully', (done) => {
      const take = 10;
      const skip = 0;
      const params: ValidAboParamsDto = {
        searchKeyword: 'test'
      };

      // API returns PascalCase - service transforms to camelCase
      const mockApiResponse = {
        Data: [
          {
            Code: 'A+',
            Description: 'A Positive',
            IntendedUse: 'RG-Default',
            UnitScheme: 'ISBT128',
            TransfusionStatus: 'Transfusable',
            Mnemonic1: 'APOS',
            Mnemonic2: 'AP',
            Group: 1,
            Sequence: 1,
            EffectiveDate: effectiveDateStr,
            TerminationDate: null
          },
          {
            Code: 'B-',
            Description: 'B Negative',
            IntendedUse: 'EM-Emergency',
            UnitScheme: 'Codabar',
            TransfusionStatus: 'Not Transfusable',
            Mnemonic1: 'BNEG',
            Mnemonic2: 'BN',
            Group: 2,
            Sequence: 2,
            EffectiveDate: effectiveDateStr,
            TerminationDate: terminationDateStr
          }
        ],
        Total: 2
      };

      apiService.post.and.returnValue(of(mockApiResponse));

      service.getValidAbo(take, skip, params).subscribe({
        next: (result: { data: ValidAboModel[]; totalRecords: number }) => {
          expect(result.data.length).toBe(2);
          expect(result.data[0].code).toBe('A+');
          expect(result.totalRecords).toBe(2);
          expect(apiService.post).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.VALID_ABO(take, skip),
            params
          );
          done();
        }
      });
    });



    it('should fetch data with filters', (done) => {
      const take = 25;
      const skip = 25;
      const params: ValidAboParamsDto = {
        intendedUse: 'RG-Default',
        unitScheme: 'ISBT128',
        transfusionStatus: 'Transfusable'
      };

      const mockResponse = {
        Success: true,
        Data: [mockApiData[0]],
        Total: 1
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getValidAbo(take, skip, params).subscribe({
        next: (result: { data: ValidAboModel[]; totalRecords: number }) => {
          expect(result.data.length).toBe(1);
          expect(result.totalRecords).toBe(1);
          expect(apiService.post).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.VALID_ABO(take, skip),
            params
          );
          done();
        }
      });
    });


    it('should fetch data with sort parameter', (done) => {
      const take = 10;
      const skip = 0;
      const params: ValidAboParamsDto = {
        sort: 'code:asc'
      };

      const mockResponse = {
        Success: true,
        Data: mockApiData,
        Total: 2
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getValidAbo(take, skip, params).subscribe({
        next: (result: { data: ValidAboModel[]; totalRecords: number }) => {
          expect(result.data).toEqual(mockValidAboData);
          expect(apiService.post).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.VALID_ABO(take, skip),
            params
          );
          done();
        }
      });
    });

    it('should handle error when fetching valid ABO list', (done) => {
      const take = 10;
      const skip = 0;
      const params: ValidAboParamsDto = {};
      const errorResponse = { status: 500, statusText: 'Internal Server Error' };

      apiService.post.and.returnValue(throwError(() => errorResponse));

      service.getValidAbo(take, skip, params).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(500);
          done();
        }
      });
    });

    it('should handle null Data and Total in response', (done) => {
      const take = 10;
      const skip = 0;
      const params: ValidAboParamsDto = {};

      // Response with no Data and no Total -- exercises fallback branches
      const mockResponse = {} as any;

      apiService.post.and.returnValue(of(mockResponse));

      service.getValidAbo(take, skip, params).subscribe({
        next: (result: { data: ValidAboModel[]; totalRecords: number }) => {
          expect(result.data).toEqual([]);
          expect(result.totalRecords).toBe(0);
          done();
        }
      });
    });

    it('should transform null Group to empty string', (done) => {
      const take = 10;
      const skip = 0;
      const params: ValidAboParamsDto = {};

      const mockResponse = {
        Data: [{
          Code: 'O+',
          Description: 'O Positive',
          IntendedUse: 'RG-Default',
          UnitScheme: 'ISBT128',
          TransfusionStatus: 'Transfusable',
          Mnemonic1: 'OPOS',
          Mnemonic2: 'OP',
          Group: null,
          Sequence: 3,
          AboGroupOnly: false,
          EffectiveDate: effectiveDateStr,
          TerminationDate: null
        }],
        Total: 1
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getValidAbo(take, skip, params).subscribe({
        next: (result: { data: ValidAboModel[]; totalRecords: number }) => {
          expect(result.data[0].group).toBe('');
          done();
        }
      });
    });

  });

  describe('getValidAboByCode', () => {
    it('should fetch valid ABO by code successfully', (done) => {
      const code = 'A+';
      const mockResponse = {
        Item: {
          Code: 'A+',
          Description: 'A Positive',
          IntendedUse: 'RG-Default',
          UnitScheme: 'ISBT128',
          TransfusionStatus: 'Transfusable',
          Mnemonic1: 'APOS',
          Mnemonic2: 'AP',
          Group: 1,
          Sequence: 1,
          EffectiveDate: effectiveDateStr,
          TerminationDate: null
        }
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getValidAboByCode(code).subscribe({
        next: (result) => {
          expect(result.code).toBe('A+');
          expect(result.description).toBe('A Positive');
          expect(apiService.get).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.VALID_ABO_BY_CODE(code)
          );
          done();
        }
      });
    });

    it('should handle response with Data array', (done) => {
      const code = 'A+';
      const mockResponse = {
        Data: [{
          Code: 'A+',
          Description: 'A Positive',
          IntendedUse: 'RG-Default',
          UnitScheme: 'ISBT128',
          TransfusionStatus: 'Transfusable',
          Mnemonic1: 'APOS',
          Mnemonic2: 'AP',
          Group: 1,
          Sequence: 1,
          EffectiveDate: effectiveDateStr,
          TerminationDate: null
        }]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getValidAboByCode(code).subscribe({
        next: (result) => {
          expect(result.code).toBe('A+');
          done();
        }
      });
    });

    it('should return empty object when no data found', (done) => {
      const code = 'NOTFOUND';
      const mockResponse = {};

      apiService.get.and.returnValue(of(mockResponse));

      service.getValidAboByCode(code).subscribe({
        next: (result) => {
          expect(result).toEqual({} as ValidAboModel);
          done();
        }
      });
    });

    it('should handle error when fetching by code', (done) => {
      const code = 'INVALID';
      const errorResponse = { status: 404, statusText: 'Not Found' };

      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getValidAboByCode(code).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(404);
          done();
        }
      });
    });
  });

  describe('getValidAboFilters', () => {
    it('should fetch filter LOV data successfully', (done) => {
      const mockResponse = {
        Success: true,
        Data: [mockFilterLovData]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getValidAboFilters().subscribe({
        next: (result) => {
          expect(result.Data).toEqual([mockFilterLovData]);
          expect(apiService.get).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.VALID_ABO_FILTERS
          );
          done();
        }
      });
    });

    it('should handle empty filter LOV response', (done) => {
      const mockResponse = {
        Success: true,
        Data: []
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getValidAboFilters().subscribe({
        next: (result) => {
          expect(result.Data).toEqual([]);
          done();
        }
      });
    });

    it('should handle filter LOV API error', (done) => {
      const errorResponse = { status: 404, statusText: 'Not Found' };

      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getValidAboFilters().subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(404);
          done();
        }
      });
    });
  });

  describe('getValidAboLookups', () => {
    it('should fetch lookup data successfully', (done) => {
      const mockResponse: ValidAboLookupsResponse = {
        intendedUse: [
          { code: 'RG', description: 'RG-Default' },
          { code: 'EM', description: 'EM-Emergency' }
        ],
        unitScheme: [
          { code: 'ISBT', description: 'ISBT128' },
          { code: 'CODA', description: 'Codabar' }
        ],
        transfusionStatus: [
          { code: 'TR', description: 'Transfusable' },
          { code: 'NT', description: 'Not Transfusable' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getValidAboLookups().subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(result.intendedUse.length).toBe(2);
          expect(result.unitScheme.length).toBe(2);
          expect(result.transfusionStatus.length).toBe(2);
          expect(apiService.get).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.VALID_ABO_LOOKUPS
          );
          done();
        }
      });
    });

    it('should handle lookups API error', (done) => {
      const errorResponse = { status: 500, statusText: 'Internal Server Error' };

      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getValidAboLookups().subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(500);
          done();
        }
      });
    });
  });

  describe('createValidAbo', () => {
    it('should create valid ABO successfully', (done) => {
      const payload = {
        code: 'AB+',
        description: 'AB Positive',
        intendedUse: 'RG-Default',
        unitScheme: 'ISBT128',
        transfusionStatus: 'Transfusable',
        mnemonic1: 'ABPOS',
        mnemonic2: 'ABP',
        effectiveDate: effectiveDateStr,
        aboGroupOnly: false
      };

      const mockResponse = {
        Success: true,
        Message: 'Valid ABO created successfully'
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.createValidAbo(payload).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(apiService.post).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.VALID_ABO_CREATE,
            jasmine.objectContaining({
              code: 'AB+',
              description: 'AB Positive',
              intendedUse: 'RG-Default',
              unitScheme: 'ISBT128',
              transfusionStatus: 'Transfusable',
              mnemonic1: 'ABPOS',
              mnemonic2: 'ABP',
              effectiveDate: effectiveDateStr,
              aboGroupOnly: false
            })
          );
          done();
        }
      });
    });

    it('should handle create API error', (done) => {
      const payload = {
        code: 'AB+',
        description: 'AB Positive',
        intendedUse: 'RG-Default',
        unitScheme: 'ISBT128',
        transfusionStatus: 'Transfusable',
        mnemonic1: 'ABPOS',
        mnemonic2: 'ABP',
        effectiveDate: effectiveDateStr,
        aboGroupOnly: false
      };

      const errorResponse = { status: 409, statusText: 'Conflict' };

      apiService.post.and.returnValue(throwError(() => errorResponse));

      service.createValidAbo(payload).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(409);
          done();
        }
      });
    });

    it('should set effectiveDate to empty string when it is not a string and set terminationDate to undefined when falsy', (done) => {
      // Payload with non-string effectiveDate and no terminationDate
      const payload = {
        code: 'O-',
        description: 'O Negative',
        intendedUse: 'RG-Default',
        unitScheme: 'ISBT128',
        transfusionStatus: 'Transfusable',
        mnemonic1: 'ONEG',
        mnemonic2: 'ON',
        effectiveDate: new Date() as any,
        aboGroupOnly: false,
        terminationDate: '' as any
      };

      const mockResponse = { Success: true };
      apiService.post.and.returnValue(of(mockResponse));

      service.createValidAbo(payload).subscribe({
        next: () => {
          const actualPayload = apiService.post.calls.mostRecent().args[1];
          expect(actualPayload.effectiveDate).toBe('');
          expect(actualPayload.terminationDate).toBeUndefined();
          done();
        }
      });
    });

    it('should preserve string terminationDate in payload', (done) => {
      const payload = {
        code: 'O-',
        description: 'O Negative',
        intendedUse: 'RG-Default',
        unitScheme: 'ISBT128',
        transfusionStatus: 'Transfusable',
        mnemonic1: 'ONEG',
        mnemonic2: 'ON',
        effectiveDate: effectiveDateStr,
        terminationDate: terminationDateStr,
        aboGroupOnly: false
      };

      const mockResponse = { Success: true };
      apiService.post.and.returnValue(of(mockResponse));

      service.createValidAbo(payload).subscribe({
        next: () => {
          const actualPayload = apiService.post.calls.mostRecent().args[1];
          expect(actualPayload.terminationDate).toBe(terminationDateStr);
          done();
        }
      });
    });

    it('should set terminationDate to undefined when it is a non-string truthy value', (done) => {
      const payload = {
        code: 'O-',
        description: 'O Negative',
        intendedUse: 'RG-Default',
        unitScheme: 'ISBT128',
        transfusionStatus: 'Transfusable',
        mnemonic1: 'ONEG',
        mnemonic2: 'ON',
        effectiveDate: effectiveDateStr,
        terminationDate: new Date() as any,
        aboGroupOnly: false
      };

      const mockResponse = { Success: true };
      apiService.post.and.returnValue(of(mockResponse));

      service.createValidAbo(payload).subscribe({
        next: () => {
          const actualPayload = apiService.post.calls.mostRecent().args[1];
          expect(actualPayload.terminationDate).toBeUndefined();
          done();
        }
      });
    });

  });

  describe('updateValidAbo', () => {
    it('should update valid ABO successfully', (done) => {
      const code = 'A+';
      const payload = {
        code: 'A+',
        description: 'A Positive Updated',
        intendedUse: 'RG-Default',
        unitScheme: 'ISBT128',
        transfusionStatus: 'Transfusable',
        mnemonic1: 'APOS',
        mnemonic2: 'AP',
        effectiveDate: effectiveDateStr,
        aboGroupOnly: false
      };

      const mockResponse = {
        Success: true,
        Message: 'Valid ABO updated successfully'
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.updateValidAbo(code, payload).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(apiService.put).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.VALID_ABO_UPDATE,
            payload
          );
          done();
        }
      });
    });

    it('should handle update API error', (done) => {
      const code = 'A+';
      const payload = {
        code: 'A+',
        description: 'A Positive Updated',
        intendedUse: 'RG-Default',
        unitScheme: 'ISBT128',
        transfusionStatus: 'Transfusable',
        mnemonic1: 'APOS',
        mnemonic2: 'AP',
        effectiveDate: effectiveDateStr,
        aboGroupOnly: false
      };

      const errorResponse = { status: 400, statusText: 'Bad Request' };

      apiService.put.and.returnValue(throwError(() => errorResponse));

      service.updateValidAbo(code, payload).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(400);
          done();
        }
      });
    });

  });

  describe('deleteValidAbo', () => {
    it('should delete valid ABO successfully', (done) => {
      const code = 'A+';
      const mockResponse = {
        Success: true,
        Message: 'Valid ABO deleted successfully'
      };

      apiService.delete.and.returnValue(of(mockResponse));

      service.deleteValidAbo(code).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(apiService.delete).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.VALID_ABO_DELETE(code)
          );
          done();
        }
      });
    });

    it('should handle delete error', (done) => {
      const code = 'INVALID';
      const errorResponse = { status: 404, statusText: 'Not Found' };

      apiService.delete.and.returnValue(throwError(() => errorResponse));

      service.deleteValidAbo(code).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(404);
          done();
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle large pagination values', (done) => {
      const take = 100;
      const skip = 500;
      const params: ValidAboParamsDto = {};

      const mockResponse = {
        Success: true,
        Data: mockApiData,
        Total: 1000
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getValidAbo(take, skip, params).subscribe({
        next: (result: { data: ValidAboModel[]; totalRecords: number }) => {
          expect(result.totalRecords).toBe(1000);
          expect(apiService.post).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.VALID_ABO(take, skip),
            params
          );
          done();
        }
      });
    });

    it('should handle all filter parameters together', (done) => {
      const take = 10;
      const skip = 0;
      const params: ValidAboParamsDto = {
        intendedUse: 'RG-Default',
        unitScheme: 'ISBT128',
        transfusionStatus: 'Transfusable',
        searchKeyword: 'test',
        sort: 'code:desc'
      };

      const mockResponse = {
        Success: true,
        Data: mockApiData,
        Total: 2
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getValidAbo(take, skip, params).subscribe({
        next: (result: { data: ValidAboModel[]; totalRecords: number }) => {
          expect(result.data).toEqual(mockValidAboData);
          expect(apiService.post).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.VALID_ABO(take, skip),
            params
          );
          done();
        }
      });
    });
  });
});
