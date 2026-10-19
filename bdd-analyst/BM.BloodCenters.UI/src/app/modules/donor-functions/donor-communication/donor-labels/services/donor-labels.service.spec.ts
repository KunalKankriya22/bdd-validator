import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { DonorLabelsService } from './donor-labels.service';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { API } from 'src/app/core/constants/api.constants';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import {
  DonorLabelSearchRequest,
  UpdatePrintFlagsRequest,
  GenerateLabelsRequest,
  PrintLabelsRequest,
  SearchResponse,
  ActionResponse,
  DonorLabelDto
} from '../models/donor-labels.model';

describe('DonorLabelsService', () => {
  let service: DonorLabelsService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const mockDonorLabel: DonorLabelDto = {
    donorId: '123456',
    donorName: 'Doe, John',
    dateOfBirth: '1980-05-15',
    gender: 'M',
    totalDonations: 1,
    gallons: 0,
    lastDonationDate: '2024-05-01',
    lastUnitId: 'W633324081002',
    collectionDate: '2024-05-01',
    communicationCode: 'FRTTM',
    printFlag: 'N',
    insertDate: '2024-05-01T10:00:00Z',
    insertUser: 'JSMITH'
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);
    headerServiceSpy = createMockHeaderService();
    TestBed.configureTestingModule({
      providers: [
        DonorLabelsService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });

    service = TestBed.inject(DonorLabelsService);
  });


  describe('searchDonorLabels', () => {
    it('should search for donor labels and return results', (done) => {
      const request: DonorLabelSearchRequest = {
        searchType: 'FirstTimeFixed',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        printerName: 'LP001'
      };

      const mockResponse: SearchResponse<DonorLabelDto> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockDonorLabel],
        totalCount: 1
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchDonorLabels(request).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.totalCount).toBe(1);
        expect(result.data[0].donorId).toBe('123456');
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.DONOR_COMMUNICATION.DONOR_LABELS.SEARCH(100, 0),
          request
        );
        done();
      });
    });



    it('should handle search errors', (done) => {
      const request: DonorLabelSearchRequest = {
        searchType: 'FirstTimeFixed',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };

      const errorResponse = { error: { message: 'Search failed' } };
      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.searchDonorLabels(request).subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('updatePrintFlags', () => {
    it('should update print flags for multiple records', (done) => {
      const request: UpdatePrintFlagsRequest = {
        printFlag: 'Y',
        records: [
          { donorId: '123456', collectionDate: '2024-05-01' },
          { donorId: '789012', collectionDate: '2024-06-15' }
        ]
      };

      const mockResponse: ActionResponse = {
        success: true,
        statusCode: 200,
        message: 'Updated successfully',
        data: [{
          updatedCount: 2,
          message: 'Successfully updated 2 print flag(s)'
        }]
      };

      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.updatePrintFlags(request).subscribe(result => {
        expect(result.updatedCount).toBe(2);
        expect(apiServiceSpy.put).toHaveBeenCalledWith(
          API.DONOR_COMMUNICATION.DONOR_LABELS.UPDATE_PRINT_FLAGS,
          request
        );
        done();
      });
    });

    it('should handle update errors', (done) => {
      const request: UpdatePrintFlagsRequest = {
        printFlag: 'N',
        records: [
          { donorId: '123456', collectionDate: '2024-05-01' }
        ]
      };

      const errorResponse = { error: { message: 'Update failed' } };
      apiServiceSpy.put.and.returnValue(throwError(() => errorResponse));

      service.updatePrintFlags(request).subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('generateLabels', () => {
    it('should generate labels successfully', (done) => {
      const request: GenerateLabelsRequest = {
        searchType: 'FirstTimeFixed',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };

      const mockResponse: ActionResponse = {
        success: true,
        statusCode: 200,
        message: 'Labels generated',
        data: [{
          generatedCount: 25,
          skippedCount: 0,
          totalProcessed: 25,
          message: 'Label generation complete. Generated: 25, Skipped: 0'
        }]
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.generateLabels(request).subscribe(result => {
        expect(result.generatedCount).toBe(25);
        expect(result.skippedCount).toBe(0);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.DONOR_COMMUNICATION.DONOR_LABELS.GENERATE,
          request
        );
        done();
      });
    });

    it('should handle generation with gallon filter', (done) => {
      const request: GenerateLabelsRequest = {
        searchType: 'GallonDonors',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        gallonNumber: 5
      };

      const mockResponse: ActionResponse = {
        success: true,
        statusCode: 200,
        message: 'Labels generated',
        data: [{
          generatedCount: 10,
          skippedCount: 0,
          totalProcessed: 10,
          message: 'Label generation complete. Generated: 10, Skipped: 0'
        }]
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.generateLabels(request).subscribe(result => {
        expect(result.generatedCount).toBe(10);
        done();
      });
    });
  });

  describe('printLabels', () => {
    it('should submit print job successfully', (done) => {
      const request: PrintLabelsRequest = {
        searchType: 'GallonDonors',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        gallonNumber: 3,
        printerName: 'LP001'
      };

      const mockResponse: ActionResponse = {
        success: true,
        statusCode: 200,
        message: 'Print job submitted',
        data: [{
          parmId: 'DCIDNLBL000001',
          serverName: 'rep_server1',
          reportName: 'DCRDNLBL'
        }]
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.printLabels(request).subscribe(result => {
        expect(result.parmId).toBe('DCIDNLBL000001');
        expect(result.reportName).toBe('DCRDNLBL');
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.DONOR_COMMUNICATION.DONOR_LABELS.PRINT,
          request
        );
        done();
      });
    });

    it('should handle print job errors', (done) => {
      const request: PrintLabelsRequest = {
        searchType: 'FirstTimeFixed',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        printerName: 'INVALID'
      };

      const errorResponse = {
        error: {
          errorCode: '9772',
          message: 'Printer not found'
        }
      };

      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.printLabels(request).subscribe({
        error: (error) => {
          expect(error.error.errorCode).toBe('9772');
          done();
        }
      });
    });
  });

  describe('getPrinters', () => {
    it('should get printers for current warehouse', (done) => {
      const mockPrinters = [
        { printerName: 'LP001', printerDescription: 'Label Printer 1' },
        { printerName: 'LP002', printerDescription: 'Label Printer 2' }
      ];

      const mockResponse = {
        data: mockPrinters
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getPrinters().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].printerName).toBe('LP001');
        expect(headerServiceSpy.getCurrentWarehouseId).toHaveBeenCalled();
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.SYSTEM_ADMIN.VALID_WAREHOUSE_USERS.LOV_PRINTERS('WH01')
        );
        done();
      });
    });



    it('should handle missing data in response', (done) => {
      const mockResponse = {};

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getPrinters().subscribe(result => {
        expect(result.length).toBe(0);
        done();
      });
    });
  });

  describe('getDropdownValues', () => {
    it('should get dropdown values and convert to frontend format', (done) => {
      const mockBackendResponse = {
        success: true,
        data: [
          {
            searchTypes: [
              { code: 'FirstTimeFixed', description: 'First Time Donors' },
              { code: 'GallonDonors', description: 'Gallon Donors' }
            ],
            printers: [
              { code: 'LP001', description: 'Label Printer 1' },
              { code: 'LP002', description: 'Label Printer 2' }
            ]
          }
        ]
      };

      apiServiceSpy.get.and.returnValue(of(mockBackendResponse));

      service.getDropdownValues().subscribe(result => {
        expect(result.searchTypes.length).toBe(2);
        expect(result.printers.length).toBe(2);
        expect(result.searchTypes[0].value).toBe('FirstTimeFixed');
        expect(result.searchTypes[0].label).toBe('First Time Donors');
        expect(result.printers[0].printerName).toBe('LP001');
        expect(result.printers[0].printerDescription).toBe('Label Printer 1');
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_COMMUNICATION.DONOR_LABELS.DROPDOWN
        );
        done();
      });
    });

    it('should handle backend response with missing descriptions', (done) => {
      const mockBackendResponse = {
        success: true,
        data: [
          {
            searchTypes: [
              { code: 'FirstTimeFixed' },
              { code: 'GallonDonors' }
            ],
            printers: [
              { code: 'LP001' }
            ]
          }
        ]
      };

      apiServiceSpy.get.and.returnValue(of(mockBackendResponse));

      service.getDropdownValues().subscribe(result => {
        expect(result.searchTypes[0].label).toBe('FirstTimeFixed'); // Uses code when description missing
        expect(result.printers[0].printerDescription).toBeUndefined();
        done();
      });
    });












  });
});
