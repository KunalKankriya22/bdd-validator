import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentDeleteService } from './component-delete.service';
import { environment } from '../../../../../environments/environment';

describe('ComponentDeleteService', () => {
  let service: ComponentDeleteService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/laboratory/component-delete`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ComponentDeleteService
      ]
    });
    service = TestBed.inject(ComponentDeleteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getInitData', () => {
    it('should make GET request to init-data endpoint', () => {
      const mockResponse = {
        item: {
          collectionDate: '2024-03-07',
          productCodes: [
            { productCode: 'ED385V00', productDesc: 'RBC Leukocytes Reduced' }
          ]
        }
      };

      service.getInitData('W1234-18-031302-Z', 'I').subscribe(data => {
        expect(data.collectionDate).toBe('2024-03-07');
        expect(data.productCodes.length).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/init-data/W1234-18-031302-Z?codeScheme=I`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getComponentDetails', () => {
    it('should make GET request to component endpoint', () => {
      service.getComponentDetails('W1234-18-031302-Z', '2024-03-07', 'ED385V00')
        .subscribe();

      const req = httpMock.expectOne(
        `${baseUrl}/component/W1234-18-031302-Z/2024-03-07/ED385V00`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ item: {} });
    });
  });

  describe('checkDelete', () => {
    it('should make GET request to check-delete endpoint', () => {
      service.checkDelete('W1234-18-031302-Z', '2024-03-07', 'ED385V00')
        .subscribe();

      const req = httpMock.expectOne(
        `${baseUrl}/check-delete/W1234-18-031302-Z/2024-03-07/ED385V00`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ item: { canDelete: true } });
    });
  });

  describe('deleteComponent', () => {
    it('should make DELETE request with body', () => {
      const deleteRequest = {
        unitId: 'W1234-18-031302-Z',
        collDate: '2024-03-07',
        productCode: 'ED385V00',
        note: 'Test deletion'
      };

      service.deleteComponent(deleteRequest).subscribe();

      const req = httpMock.expectOne(`${baseUrl}`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.body).toEqual(deleteRequest);
      req.flush(null);
    });
  });
});
