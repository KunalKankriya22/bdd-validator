import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { EmfProcessesService } from './emf-processes.service';
import { ApiService } from '@shared/services/api.service';

describe('EmfProcessesService', () => {
  let service: EmfProcessesService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        EmfProcessesService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(EmfProcessesService);
  });

  it('getProcessCodes should return mapped data and totalRecords', (done) => {
    apiSpy.post.and.returnValue(of({ success: true, message: '', error: null, statusCode: 200, data: [{ procCode: 'P1' }], total: 1 }));

    service.getProcessCodes(10, 0).subscribe((result) => {
      expect(result).toEqual({ data: [{ procCode: 'P1' }] as any, totalRecords: 1 });
      done();
    });
  });

  it('addProcessCode should POST payload', (done) => {
    const payload = { procCode: 'P1', procDesc: 'Desc', effDate: null, termDate: null };
    const response = { success: true, message: 'OK', statusCode: 200 };
    apiSpy.post.and.returnValue(of(response));

    service.addProcessCode(payload).subscribe((result) => {
      expect(result).toEqual(response as any);
      done();
    });
  });

  it('updateProcessCode should PUT payload', (done) => {
    const payload = { procCode: 'P1', procDesc: 'Desc', effDate: null, termDate: null };
    const response = { success: true, message: 'OK', statusCode: 200 };
    apiSpy.put.and.returnValue(of(response));

    service.updateProcessCode(payload).subscribe((result) => {
      expect(result).toEqual(response as any);
      done();
    });
  });

  it('getProcessCodeById should return mapped item', (done) => {
    const detail = { procCode: 'P1', procDesc: 'Desc' };
    apiSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, item: detail }));

    service.getProcessCodeById('P1').subscribe((result) => {
      expect(result).toEqual(detail as any);
      done();
    });
  });
});
