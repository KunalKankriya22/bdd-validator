import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { AddEditAddFunctionsService } from './add-edit-add-function.service';
import { environment } from 'src/environments/environment';

describe('AddEditAddFunctionsService', () => {
  let service: AddEditAddFunctionsService;
  let httpSpy: jasmine.SpyObj<HttpClient>;
  const baseEndpoint = `${environment.apiUrl}/api/v1/system-admin/add-functions`;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('HttpClient', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        AddEditAddFunctionsService,
        { provide: HttpClient, useValue: spy }
      ]
    });

    service = TestBed.inject(AddEditAddFunctionsService);
    httpSpy = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
  });

  describe('getDetail', () => {
    it('should GET function detail with FCN_ID as a string param', (done) => {
      const mockResponse = { id: 42, name: 'TestFcn' };
      httpSpy.get.and.returnValue(of(mockResponse));

      service.getDetail(42).subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(httpSpy.get).toHaveBeenCalledWith(
          `${baseEndpoint}/detail`,
          { params: { FCN_ID: '42' } }
        );
        done();
      });
    });
  });

  describe('getIconsList', () => {
    it('should GET the icons list from the icons endpoint', (done) => {
      const mockIcons = [{ icon: 'star' }];
      httpSpy.get.and.returnValue(of(mockIcons));

      service.getIconsList().subscribe(result => {
        expect(result).toEqual(mockIcons);
        expect(httpSpy.get).toHaveBeenCalledWith(`${baseEndpoint}/icons`);
        done();
      });
    });
  });

  describe('add / edit', () => {
    it('should POST new function data to the base endpoint', (done) => {
      const data = { name: 'NewFcn' };
      httpSpy.post.and.returnValue(of({ success: true }));

      service.add(data).subscribe(result => {
        expect(result).toEqual({ success: true });
        expect(httpSpy.post).toHaveBeenCalledWith(baseEndpoint, data);
        done();
      });
    });

    it('should PUT updated function data with id appended to the URL', (done) => {
      const data = { name: 'UpdatedFcn' };
      httpSpy.put.and.returnValue(of({ success: true }));

      service.edit(5, data).subscribe(result => {
        expect(result).toEqual({ success: true });
        expect(httpSpy.put).toHaveBeenCalledWith(`${baseEndpoint}/5`, data);
        done();
      });
    });
  });
});
