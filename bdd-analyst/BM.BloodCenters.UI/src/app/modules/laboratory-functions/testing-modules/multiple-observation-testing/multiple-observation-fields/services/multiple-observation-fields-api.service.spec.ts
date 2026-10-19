import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MofApiService } from './multiple-observation-fields-api.service';
import { ApiService } from '@shared/services/api.service';

describe('MofApiService', () => {
  let service: MofApiService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        MofApiService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(MofApiService);
  });

  describe('GET array methods', () => {
    const cases: { method: keyof MofApiService; args: any[] }[] = [
      { method: 'getTests', args: [] },
      { method: 'getTestTypes', args: ['T1'] },
    ];

    cases.forEach(({ method, args }) => {
      it(`${method} should return extracted array`, (done) => {
        const items = [{ id: '1' }];
        apiSpy.get.and.returnValue(of({ data: items }));

        (service[method] as Function)(...args).subscribe((result: any) => {
          expect(result).toEqual(items);
          done();
        });
      });
    });
  });

  it('getBands should POST and return extracted array', (done) => {
    const items = [{ bandSeq: 1 }];
    apiSpy.post.and.returnValue(of({ data: items }));

    service.getBands('T1', 'TT1').subscribe((result) => {
      expect(result).toEqual(items as any);
      done();
    });
  });

  it('createBand should POST and return extracted item', (done) => {
    const item = { bandSeq: 1 };
    apiSpy.post.and.returnValue(of({ data: item }));

    service.createBand({} as any).subscribe((result) => {
      expect(result).toEqual(item as any);
      done();
    });
  });

  it('updateBand should PUT and return extracted item', (done) => {
    const item = { bandSeq: 1 };
    apiSpy.put.and.returnValue(of({ data: item }));

    service.updateBand('T1', 'TT1', 1, {} as any).subscribe((result) => {
      expect(result).toEqual(item as any);
      done();
    });
  });

  it('deleteBand should call DELETE', (done) => {
    apiSpy.delete.and.returnValue(of(void 0));

    service.deleteBand('T1', 'TT1', 1).subscribe(() => {
      expect(apiSpy.delete).toHaveBeenCalled();
      done();
    });
  });

  it('resequence should PUT and return extracted array', (done) => {
    const items = [{ bandSeq: 1 }, { bandSeq: 2 }];
    apiSpy.put.and.returnValue(of({ data: items }));

    service.resequence({} as any).subscribe((result) => {
      expect(result).toEqual(items as any);
      done();
    });
  });
});
