import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ChangeLabelPrinterService } from './change-label-printer.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('ChangeLabelPrinterService', () => {
  let service: ChangeLabelPrinterService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        ChangeLabelPrinterService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(ChangeLabelPrinterService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getLabelPrinters', () => {
    it('should get label printers', (done) => {
      const mockResponse = { data: [{ printerId: 'P1', name: 'Printer 1' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getLabelPrinters().subscribe(result => {
        expect(result).toEqual(mockResponse as any);
        done();
      });
    });
  });

  describe('getTieTagPrinters', () => {
    it('should get tie tag printers', (done) => {
      const mockResponse = { data: [{ printerId: 'TT1', name: 'TieTag 1' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTieTagPrinters().subscribe(result => {
        expect(result).toEqual(mockResponse as any);
        done();
      });
    });
  });

  describe('getProcessingFacilities', () => {
    it('should get processing facilities', (done) => {
      const mockResponse = { data: [{ facilityId: 'F1', name: 'Facility 1' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getProcessingFacilities().subscribe(result => {
        expect(result).toEqual(mockResponse as any);
        done();
      });
    });
  });

  describe('getProcessingFacilityDetails', () => {
    it('should get facility details by audit key', (done) => {
      const mockResponse = { data: { auditKey: 123, facilityName: 'Main' } };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getProcessingFacilityDetails(123).subscribe(result => {
        expect(result).toEqual(mockResponse as any);
        done();
      });
    });
  });

  describe('saveSettings', () => {
    it('should post save settings request', (done) => {
      const request = { labelPrinterId: 'P1', tieTagPrinterId: 'TT1' } as any;
      const mockResponse = { data: { labelPrinterId: 'P1' } };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.saveSettings(request).subscribe(result => {
        expect(result).toEqual(mockResponse as any);
        done();
      });
    });
  });
});
