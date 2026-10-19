import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { GenerateOutdatesPicklistService } from './generate-outdates-picklist.service';
import { environment } from '../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import { OutdatesSearchRequest, OutdatesDetailRequest, CommitOutdatesRequest } from '../models/generate-outdates-picklist.model';

describe('GenerateOutdatesPicklistService', () => {
  let service: GenerateOutdatesPicklistService;
  let httpMock: HttpTestingController;

  const normalize = (endpoint: string) => endpoint.replace(/^\//, '');

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GenerateOutdatesPicklistService]
    });

    service = TestBed.inject(GenerateOutdatesPicklistService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getSummary', () => {
    it('should POST to summary endpoint with request body', () => {
      const request: OutdatesSearchRequest = {
        outdateAsOf: '2018-03-13T00:06:00.000Z',
        inventoryClass: 'RB'
      };

      service.getSummary(request).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.length).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/${normalize(API.GENERATE_OUTDATES_PICKLIST.SUMMARY)}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({
        success: true,
        data: [{ productType: 'PLT', bloodType: '11', bloodTypeDescription: 'A Pos', quantity: 11 }]
      });
    });

  });

  describe('getDetails', () => {
    it('should POST to details endpoint with query params', () => {
      const request: OutdatesDetailRequest = {
        outdateAsOf: '2018-03-13T00:06:00.000Z',
        productType: 'PLT',
        bloodType: '11'
      };

      service.getDetails(request, 25, 0).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(r =>
        r.url.includes(normalize(API.GENERATE_OUTDATES_PICKLIST.DETAILS)) &&
        r.params.get('productType') === 'PLT' &&
        r.params.get('bloodType') === '11' &&
        r.params.get('take') === '25' &&
        r.params.get('skip') === '0'
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeNull();
      req.flush({ success: true, data: [] });
    });

    it('should not include bloodType param when bloodType is empty', () => {
      const request: OutdatesDetailRequest = {
        outdateAsOf: '2018-03-13T00:06:00.000Z',
        productType: 'PLT',
        bloodType: ''
      };

      service.getDetails(request, 25, 0).subscribe();

      const req = httpMock.expectOne(r =>
        r.url.includes(normalize(API.GENERATE_OUTDATES_PICKLIST.DETAILS)) &&
        r.params.get('productType') === 'PLT' &&
        !r.params.has('bloodType')
      );
      req.flush({ success: true, data: [] });
    });

    it('should include inventoryClass param when provided', () => {
      const request: OutdatesDetailRequest = {
        outdateAsOf: '2018-03-13T00:06:00.000Z',
        productType: 'PLT',
        bloodType: '11',
        inventoryClass: 'RB'
      };

      service.getDetails(request, 25, 0).subscribe();

      const req = httpMock.expectOne(r =>
        r.url.includes(normalize(API.GENERATE_OUTDATES_PICKLIST.DETAILS)) &&
        r.params.get('inventoryClass') === 'RB'
      );
      req.flush({ success: true, data: [] });
    });

    it('should use default take=100 and skip=0 when not provided', () => {
      const request: OutdatesDetailRequest = {
        outdateAsOf: '2018-03-13T00:06:00.000Z',
        productType: 'PLT',
        bloodType: '11'
      };

      service.getDetails(request).subscribe();

      const req = httpMock.expectOne(r =>
        r.params.get('take') === '100' &&
        r.params.get('skip') === '0'
      );
      req.flush({ success: true, data: [] });
    });
  });
  describe('commitOutdates', () => {
    it('should POST to commit endpoint with request body', () => {
      const request: CommitOutdatesRequest = {
        outdateAsOf: '2018-03-13T00:06:00.000Z',
        inventoryClass: 'RB'
      };

      service.commitOutdates(request).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.pickSlipId).toBe('PS-001');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/${normalize(API.GENERATE_OUTDATES_PICKLIST.COMMIT)}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({
        success: true,
        data: { pickSlipId: 'PS-001', orderNo: 'ORD-001', productCount: 28 }
      });
    });

  });

  describe('getInventoryClasses', () => {
    it('should GET the inventory-classes endpoint and return data', () => {
      const mockClasses = [
        { code: 'RB', description: 'Regular Blood' },
        { code: 'AU', description: 'Autologous' }
      ];

      service.getInventoryClasses().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data).toEqual(mockClasses);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/${normalize(API.GENERATE_OUTDATES_PICKLIST.INVENTORY_CLASSES)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockClasses });
    });

    it('should handle error from inventory-classes endpoint', () => {
      let errorCaught = false;

      service.getInventoryClasses().subscribe({
        error: () => { errorCaught = true; }
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/${normalize(API.GENERATE_OUTDATES_PICKLIST.INVENTORY_CLASSES)}`
      );
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('getReportStatus', () => {
    it('should GET report status with encoded reportName and parmId', () => {
      const reportName = 'SCROUTDT';
      const parmId = 'USER_061926_1';

      service.getReportStatus(reportName, parmId).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.item?.statusCode).toBe('C');
      });

      const req = httpMock.expectOne(r =>
        r.url.includes('report-status') &&
        r.url.includes(encodeURIComponent(reportName)) &&
        r.url.includes(encodeURIComponent(parmId))
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, item: { statusCode: 'C' } });
    });

    it('should handle error from report status endpoint', () => {
      let errorCaught = false;

      service.getReportStatus('SCROUTDT', 'USER_001').subscribe({
        error: () => { errorCaught = true; }
      });

      const req = httpMock.expectOne(r => r.url.includes('report-status'));
      req.flush('Not found', { status: 404, statusText: 'Not Found' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('getReportUrl', () => {
    it('should POST to report-action/perform with correct body', () => {
      const parmId = 'USER_061926_1';
      const reportName = 'SCROUTDT';
      const userName = 'TESTUSER';

      service.getReportUrl(parmId, reportName, userName).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.item?.fileName).toBe('SCROUTDT_100_USER.pdf');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/${normalize('/api/v1/user-utilities/report-action/perform')}`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        parmId,
        reportName,
        userName,
        action: 'R'
      });
      req.flush({ success: true, item: { fileName: 'SCROUTDT_100_USER.pdf' } });
    });

    it('should handle error from report-action endpoint', () => {
      let errorCaught = false;

      service.getReportUrl('USER_001', 'SCROUTDT', 'TESTUSER').subscribe({
        error: () => { errorCaught = true; }
      });

      const req = httpMock.expectOne(r => r.url.includes('report-action'));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('pollReportUntilComplete', () => {
    it('should complete and emit result when first poll returns status C', fakeAsync(() => {
      let result: any;
      const statusResponse = { item: { statusCode: 'C' } };

      spyOn(service, 'getReportStatus').and.returnValue(of(statusResponse));

      service.pollReportUntilComplete('SCROUTDT', 'USER_001').subscribe(r => {
        result = r;
      });

      tick(0);

      expect(result).toBeTruthy();
      expect(result.item.statusCode).toBe('C');

      discardPeriodicTasks();
    }));

    it('should complete and emit result when first poll returns status F', fakeAsync(() => {
      let result: any;
      const statusResponse = { item: { statusCode: 'F' } };

      spyOn(service, 'getReportStatus').and.returnValue(of(statusResponse));

      service.pollReportUntilComplete('SCROUTDT', 'USER_001').subscribe(r => {
        result = r;
      });

      tick(0);

      expect(result.item.statusCode).toBe('F');

      discardPeriodicTasks();
    }));

    it('should poll multiple times before completing when status is S then C', fakeAsync(() => {
      let result: any;
      let callCount = 0;

      spyOn(service, 'getReportStatus').and.callFake(() => {
        callCount++;
        const statusCode = callCount >= 2 ? 'C' : 'S';
        return of({ item: { statusCode } });
      });

      service.pollReportUntilComplete('SCROUTDT', 'USER_001').subscribe(r => {
        result = r;
      });

      tick(0);    // First poll → S, takeWhile passes through
      tick(3000); // Second poll → C, takeWhile emits inclusive and completes

      expect(callCount).toBe(2);
      expect(result.item.statusCode).toBe('C');

      discardPeriodicTasks();
    }));

    it('should use catchError to return F status when maxAttempts is reached on error', fakeAsync(() => {
      let result: any;

      spyOn(service, 'getReportStatus').and.returnValue(
        throwError(() => new Error('Network error'))
      );

      service.pollReportUntilComplete('SCROUTDT', 'USER_001', 1).subscribe(r => {
        result = r;
      });

      tick(0);

      // With maxAttempts=1, attempts(1) >= maxAttempts(1) → statusCode 'F'
      expect(result.item.statusCode).toBe('F');

      discardPeriodicTasks();
    }));

    it('should use catchError to return S status when attempts have not reached maxAttempts', fakeAsync(() => {
      let result: any;
      let callCount = 0;

      spyOn(service, 'getReportStatus').and.callFake(() => {
        callCount++;
        if (callCount === 1) {
          return throwError(() => new Error('Transient error'));
        }
        return of({ item: { statusCode: 'C' } });
      });

      service.pollReportUntilComplete('SCROUTDT', 'USER_001', 5).subscribe(r => {
        result = r;
      });

      tick(0);    // First poll → error → catchError returns S (attempts 1 < maxAttempts 5)
      tick(3000); // Second poll → C, completes

      expect(callCount).toBe(2);
      expect(result.item.statusCode).toBe('C');

      discardPeriodicTasks();
    }));
  });
});
