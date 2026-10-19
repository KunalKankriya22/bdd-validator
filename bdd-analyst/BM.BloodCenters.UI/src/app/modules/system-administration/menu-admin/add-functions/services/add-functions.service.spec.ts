import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AddFunctionsService, AddFunctionsResponse, AddFunctionsFiltersResponse } from './add-functions.service';

describe('AddFunctionsService', () => {
  let service: AddFunctionsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AddFunctionsService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AddFunctionsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getFilters', () => {
    it('should GET filter options', (done: DoneFn) => {
      const mock: AddFunctionsFiltersResponse = { functionTypes: ['A'], functionScopes: ['B'] };

      service.getFilters().subscribe(result => {
        expect(result).toEqual(mock);
        done();
      });

      const req = httpMock.expectOne('/api/v1/system-admin/add-functions/filters');
      expect(req.request.method).toBe('GET');
      req.flush(mock);
    });
  });

  describe('getAddFunctions', () => {
    it('should GET with pagination and all filter params', (done: DoneFn) => {
      const mock: AddFunctionsResponse = { success: true, message: '', statusCode: 200, data: [], total: 0 };

      service.getAddFunctions(5, 25, {
        searchKeyword: 'test',
        functionType: 'FT',
        scope: 'SC',
        sortColumn: 'col',
        sortDirection: 'ASC'
      }).subscribe(result => {
        expect(result).toEqual(mock);
        done();
      });

      const req = httpMock.expectOne(r =>
        r.url === '/api/v1/system-admin/add-functions' &&
        r.params.get('Skip') === '5' &&
        r.params.get('Take') === '25' &&
        r.params.get('SearchKeyword') === 'test' &&
        r.params.get('FcnType') === 'FT' &&
        r.params.get('FcnScope') === 'SC' &&
        r.params.get('SortColumn') === 'col' &&
        r.params.get('Sort') === 'ASC'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mock);
    });
  });

  describe('CRUD operations', () => {
    const fnData = { fcnId: 'F1', fcnIcon: '', fcnUrl: '', execName: 'EX1', fcnType: '', fcnScope: '', p1Name: '', p2Name: '', p3Name: '', remarks: '' };

    it('createAddFunction should POST', (done: DoneFn) => {
      service.createAddFunction(fnData).subscribe(() => done());

      const req = httpMock.expectOne('/api/v1/system-admin/add-functions');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(fnData);
      req.flush({});
    });

    it('updateAddFunction should PUT', (done: DoneFn) => {
      service.updateAddFunction(fnData).subscribe(() => done());

      const req = httpMock.expectOne('/api/v1/system-admin/add-functions');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(fnData);
      req.flush({});
    });

    it('deleteAddFunction should DELETE by executableName', (done: DoneFn) => {
      service.deleteAddFunction('EX1').subscribe(() => done());

      const req = httpMock.expectOne('/api/v1/system-admin/add-functions/EX1');
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });
});
