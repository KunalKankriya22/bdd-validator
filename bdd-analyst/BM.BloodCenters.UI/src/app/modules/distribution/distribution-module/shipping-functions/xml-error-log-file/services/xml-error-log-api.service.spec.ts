import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { XmlErrorLogApiService } from './xml-error-log-api.service';
import { API } from '@core/constants/api.constants';

describe('XmlErrorLogApiService', () => {
  let service: XmlErrorLogApiService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    httpSpy = jasmine.createSpyObj('HttpClient', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        XmlErrorLogApiService,
        { provide: HttpClient, useValue: httpSpy },
      ],
    });

    service = TestBed.inject(XmlErrorLogApiService);
  });

  describe('getPlasmaFileTypes', () => {
    it('should call GET on plasma file types endpoint', (done) => {
      const mockResponse = { success: true, data: [{ code: 'PFT1', description: 'Type 1' }] };
      httpSpy.get.and.returnValue(of(mockResponse));

      service.getPlasmaFileTypes().subscribe((result) => {
        expect(httpSpy.get).toHaveBeenCalledWith(API.XML_ERROR_LOG.PLASMA_FILE_TYPES);
        expect(result).toEqual(mockResponse as any);
        done();
      });
    });
  });

  describe('searchLogEntries', () => {
    it('should post search request', (done) => {
      const mockResponse = { success: true, data: [{ logId: 1 }] };
      const request = { fileType: 'PFT1' } as any;
      httpSpy.post.and.returnValue(of(mockResponse));

      service.searchLogEntries(request).subscribe((result) => {
        expect(httpSpy.post).toHaveBeenCalledWith(API.XML_ERROR_LOG.SEARCH, request);
        expect(result).toEqual(mockResponse as any);
        done();
      });
    });
  });
});
