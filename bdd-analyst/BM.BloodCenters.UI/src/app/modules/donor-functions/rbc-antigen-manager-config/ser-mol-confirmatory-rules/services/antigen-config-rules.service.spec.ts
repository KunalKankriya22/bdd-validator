import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AntigenConfigRulesService } from './antigen-config-rules.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('AntigenConfigRulesService', () => {
  let service: AntigenConfigRulesService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiSpy }],
    });
    service = TestBed.inject(AntigenConfigRulesService);
  });

  it('search posts request and maps data+total', (done) => {
    apiSpy.post.and.returnValue(of({ data: [{ id: 1 }], total: 10 }));

    service.search(10, 0, {} as any).subscribe(result => {
      expect(result).toEqual({ data: [{ id: 1 }] as any, total: 10 });
      expect(apiSpy.post).toHaveBeenCalledWith(API.ANTIGEN_CONFIG_RULES.SEARCH(10, 0), {} as any);
      done();
    });
  });

  it('create posts request to create endpoint', (done) => {
    const mockRes = { success: true };
    apiSpy.post.and.returnValue(of(mockRes));

    service.create({} as any).subscribe(result => {
      expect(result).toEqual(mockRes as any);
      expect(apiSpy.post).toHaveBeenCalledWith(API.ANTIGEN_CONFIG_RULES.CREATE, {} as any);
      done();
    });
  });

  it('update puts request to update endpoint', (done) => {
    const mockRes = { success: true };
    apiSpy.put.and.returnValue(of(mockRes));

    service.update(1, {} as any).subscribe(result => {
      expect(result).toEqual(mockRes as any);
      expect(apiSpy.put).toHaveBeenCalledWith(API.ANTIGEN_CONFIG_RULES.UPDATE(1), {} as any);
      done();
    });
  });

  it('terminate posts to terminate endpoint', (done) => {
    const mockRes = { success: true };
    apiSpy.post.and.returnValue(of(mockRes));

    service.terminate(1).subscribe(result => {
      expect(result).toEqual(mockRes as any);
      expect(apiSpy.post).toHaveBeenCalledWith(API.ANTIGEN_CONFIG_RULES.TERMINATE(1), {});
      done();
    });
  });

  it('delete calls delete endpoint', (done) => {
    const mockRes = { success: true };
    apiSpy.delete.and.returnValue(of(mockRes));

    service.delete(1).subscribe(result => {
      expect(result).toEqual(mockRes as any);
      expect(apiSpy.delete).toHaveBeenCalledWith(API.ANTIGEN_CONFIG_RULES.DELETE(1));
      done();
    });
  });

  it('getFilterOptions gets and maps data array', (done) => {
    apiSpy.get.and.returnValue(of({ data: [{ label: 'opt1' }] }));

    service.getFilterOptions().subscribe(result => {
      expect(result).toEqual([{ label: 'opt1' }] as any);
      done();
    });
  });

  ['getAntigenGroups', 'getAntigenTests', 'getLabelingAntigens'].forEach(method => {
    it(`${method} gets and maps lookup values`, (done) => {
      apiSpy.get.and.returnValue(of({ data: [{ value: 'A' }, { value: 'B' }] }));

      (service as any)[method]().subscribe((result: string[]) => {
        expect(result).toEqual(['A', 'B']);
        done();
      });
    });
  });

  it('getTestIds passes testType and maps values', (done) => {
    apiSpy.get.and.returnValue(of({ data: [{ value: 'T1', description: 'Test 1' }] }));

    service.getTestIds('SER').subscribe(result => {
      expect(result).toEqual([{ value: 'T1', description: 'Test 1' }]);
      expect(apiSpy.get).toHaveBeenCalledWith(API.ANTIGEN_CONFIG_RULES.LOOKUP_TEST_IDS('SER'));
      done();
    });
  });

  it('getCount builds URL with params and maps numeric item', (done) => {
    apiSpy.get.and.returnValue(of({ item: 42 }));

    service.getCount('Rh', 'D', 'Y').subscribe(result => {
      expect(result).toBe(42);
      done();
    });
  });

  it('getCount returns 0 when item is not a number', (done) => {
    apiSpy.get.and.returnValue(of({ item: null }));

    service.getCount().subscribe(result => {
      expect(result).toBe(0);
      done();
    });
  });
});
