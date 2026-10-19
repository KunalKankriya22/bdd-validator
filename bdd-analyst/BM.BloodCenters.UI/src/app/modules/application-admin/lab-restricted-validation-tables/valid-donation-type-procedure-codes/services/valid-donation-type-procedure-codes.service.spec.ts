import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ValidDonationTypeProcedureCodesService } from './valid-donation-type-procedure-codes.service';
import { ApiService } from '@shared/services/api.service';
import {
  ValidDonationTypeProcedureCodesModel,
  ValidDonationTypeProcedureCodesParamsDto,
  ValidDonationTypeProcedureCodesDto,
  UpdateValidDonationTypeProcedureCodesDto,
  AttributeCodeDropdown
} from '../models/valid-donation-type-procedure-codes.model';

describe('ValidDonationTypeProcedureCodesService', () => {
  let service: ValidDonationTypeProcedureCodesService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj<ApiService>('ApiService', [
      'get',
      'post',
      'put',
      'delete'
    ]);

    TestBed.configureTestingModule({
      providers: [
        ValidDonationTypeProcedureCodesService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(ValidDonationTypeProcedureCodesService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  /* ===============================
     GET VALID DONATION TYPE/PROCEDURE CODES
  =============================== */
  describe('getValidDonationTypeProcedureCodes', () => {
    it('should fetch valid donation type/procedure codes with pagination and filters', (done) => {
      const mockData: ValidDonationTypeProcedureCodesModel[] = [
        {
          donationType: 'WB',
          procedureCode: 'WBL',
          attribGroup: 'PROC',
          attribCode: 'TEST1',
          effectiveDate: '2024-01-01',
          modificationDate: '2024-01-15',
          sortSequence: 1
        },
        {
          donationType: 'PLT',
          procedureCode: 'APLT',
          attribGroup: 'QUAL',
          attribCode: 'TEST2',
          effectiveDate: '2024-02-01',
          modificationDate: '2024-02-15',
          sortSequence: 2
        }
      ];

      const mockResponse = {
        success: true,
        message: 'Success',
        data: mockData,
        total: 2
      };

      const params: ValidDonationTypeProcedureCodesParamsDto = {
        searchKeyword: 'test',
        donationType: 'WB',
        sort: 'A'
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getValidDonationTypeProcedureCodes(10, 0, params).subscribe(response => {
        expect(response.data).toEqual(mockData);
        expect(response.totalRecords).toBe(2);
        expect(response.data.length).toBe(2);
        expect(response.data[0].donationType).toBe('WB');
        expect(response.data[1].attribCode).toBe('TEST2');
        done();
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        jasmine.any(String),
        params
      );
    });


    it('should handle error when fetching data fails', (done) => {
      const mockError = { error: 'Server error' };

      apiServiceSpy.post.and.returnValue(throwError(() => mockError));

      service.getValidDonationTypeProcedureCodes(10, 0, {}).subscribe({
        next: () => done.fail('Expected error'),
        error: (error) => {
          expect(error).toEqual(mockError);
          done();
        }
      });
    });

    it('should handle pagination correctly', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        data: [],
        total: 100
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getValidDonationTypeProcedureCodes(25, 50, {}).subscribe(response => {
        expect(response.totalRecords).toBe(100);
        done();
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        jasmine.any(String),
        {}
      );
    });
  });

  /* ===============================
     ADD ATTRIBUTE MAPPING
  =============================== */
  describe('addAttributeMapping', () => {
    it('should call POST to add new attribute mapping', (done) => {
      const payload: ValidDonationTypeProcedureCodesDto = {
        donationType: 'WB',
        procedureCode: 'WBL',
        attribGroup: 'PROC',
        attribCode: 'TEST1',
        effectiveDate: '2024-01-01',
        sortSequence: 1
      };

      const mockResponse = {
        success: true,
        message: 'Attribute mapping added successfully'
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.addAttributeMapping(payload).subscribe(response => {
        expect(response.success).toBeTrue();
        expect(response.message).toBe('Attribute mapping added successfully');
        done();
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        jasmine.any(String),
        payload
      );
    });

    it('should handle error when adding attribute mapping fails', (done) => {
      const payload: ValidDonationTypeProcedureCodesDto = {
        donationType: 'WB',
        procedureCode: 'WBL',
        attribGroup: 'PROC',
        attribCode: 'TEST1',
        effectiveDate: '2024-01-01',
        sortSequence: 1
      };

      const mockError = { error: 'Failed to add attribute mapping' };

      apiServiceSpy.post.and.returnValue(throwError(() => mockError));

      service.addAttributeMapping(payload).subscribe({
        next: () => done.fail('Expected error'),
        error: (error) => {
          expect(error).toEqual(mockError);
          done();
        }
      });
    });
  });

  /* ===============================
     UPDATE ATTRIBUTE MAPPING
  =============================== */
  describe('updateAttributeMapping', () => {
    it('should call PUT to update existing attribute mapping', (done) => {
      const payload: UpdateValidDonationTypeProcedureCodesDto = {
        currentDonationType: 'WB',
        currentProcedureCode: 'WBL',
        currentAttribGroup: 'PROC',
        currentAttribCode: 'TEST1',
        currentEffectiveDate: '2024-01-01',
        sortSequence: 5
      };

      const mockResponse = {
        success: true,
        message: 'Attribute mapping updated successfully'
      };

      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.updateAttributeMapping(payload).subscribe(response => {
        expect(response.success).toBeTrue();
        expect(response.message).toBe('Attribute mapping updated successfully');
        done();
      });

      expect(apiServiceSpy.put).toHaveBeenCalledWith(
        jasmine.any(String),
        payload
      );
    });

    it('should handle error when updating attribute mapping fails', (done) => {
      const payload: UpdateValidDonationTypeProcedureCodesDto = {
        currentDonationType: 'WB',
        currentProcedureCode: 'WBL',
        currentAttribGroup: 'PROC',
        currentAttribCode: 'TEST1',
        currentEffectiveDate: '2024-01-01',
        sortSequence: 5
      };

      const mockError = { error: 'Failed to update attribute mapping' };

      apiServiceSpy.put.and.returnValue(throwError(() => mockError));

      service.updateAttributeMapping(payload).subscribe({
        next: () => done.fail('Expected error'),
        error: (error) => {
          expect(error).toEqual(mockError);
          done();
        }
      });
    });
  });

  /* ===============================
     GET FILTER OPTIONS
  =============================== */
  describe('getFilterOptions', () => {
    it('should fetch filter options successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        data: [{
          donationTypes: ['WB', 'PLT', 'RBC'],
          procedureCodes: ['WBL', 'APLT', 'RBC1'],
          attribGroups: ['PROC', 'QUAL', 'TEST'],
          attribCodes: ['CODE1', 'CODE2']
        }]
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getFilterOptions().subscribe(response => {
        expect(response.donationTypes.length).toBe(3);
        expect(response.procedureCodes.length).toBe(3);
        expect(response.attribGroups.length).toBe(3);
        expect(response.attribCodes.length).toBe(2);
        expect(response.donationTypes[0]).toBe('WB');
        done();
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith(jasmine.any(String));
    });

    it('should return empty arrays when no filter data is available', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        data: []
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getFilterOptions().subscribe(response => {
        expect(response.donationTypes).toEqual([]);
        expect(response.procedureCodes).toEqual([]);
        expect(response.attribGroups).toEqual([]);
        expect(response.attribCodes).toEqual([]);
        done();
      });
    });

    it('should handle error when fetching filter options fails', (done) => {
      const mockError = { error: 'Failed to fetch filter options' };

      apiServiceSpy.get.and.returnValue(throwError(() => mockError));

      service.getFilterOptions().subscribe({
        next: () => done.fail('Expected error'),
        error: (error) => {
          expect(error).toEqual(mockError);
          done();
        }
      });
    });
  });

  /* ===============================
     GET ATTRIBUTE CODES
  =============================== */
  describe('getAttributeCodes', () => {
    it('should fetch attribute codes successfully', (done) => {
      const mockAttributeCodes: AttributeCodeDropdown[] = [
        { attribCode: 'CODE1', description: 'Test Code 1' },
        { attribCode: 'CODE2', description: 'Test Code 2' },
        { attribCode: 'CODE3', description: 'Test Code 3' }
      ];

      const mockResponse = {
        success: true,
        message: 'Success',
        data: mockAttributeCodes
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAttributeCodes().subscribe(response => {
        expect(response.length).toBe(3);
        expect(response[0].attribCode).toBe('CODE1');
        expect(response[1].description).toBe('Test Code 2');
        done();
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith(jasmine.any(String));
    });

    it('should return empty array when no attribute codes are available', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        data: undefined
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAttributeCodes().subscribe(response => {
        expect(response).toEqual([]);
        done();
      });
    });

    it('should handle error when fetching attribute codes fails', (done) => {
      const mockError = { error: 'Failed to fetch attribute codes' };

      apiServiceSpy.get.and.returnValue(throwError(() => mockError));

      service.getAttributeCodes().subscribe({
        next: () => done.fail('Expected error'),
        error: (error) => {
          expect(error).toEqual(mockError);
          done();
        }
      });
    });
  });
});
