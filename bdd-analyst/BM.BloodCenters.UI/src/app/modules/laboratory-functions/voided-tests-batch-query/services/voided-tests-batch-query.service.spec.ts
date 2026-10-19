import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { VoidedTestsBatchQueryService } from './voided-tests-batch-query.service';
import { ApiService } from '@shared/services/api.service';

describe('VoidedTestsBatchQueryService', () => {
  let service: VoidedTestsBatchQueryService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);
    TestBed.configureTestingModule({
      providers: [
        VoidedTestsBatchQueryService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });
    service = TestBed.inject(VoidedTestsBatchQueryService);
  });

  const methods: { name: string; call: () => any; verb: 'get' | 'post' }[] = [
    { name: 'getBatchIds', call: () => service.getBatchIds(), verb: 'get' },
    { name: 'getTestIds', call: () => service.getTestIds('TB1'), verb: 'get' },
    { name: 'search', call: () => service.search({} as any), verb: 'post' },
  ];

  methods.forEach(({ name, call, verb }) => {
    it(`${name} extracts data array from response`, (done) => {
      const items = [{ id: '1' }];
      apiSpy[verb].and.returnValue(of({ data: items }));

      call().subscribe((result: any) => {
        expect(result).toEqual(items);
        done();
      });
    });

    it(`${name} returns empty array when response.data is falsy`, (done) => {
      apiSpy[verb].and.returnValue(of({ data: null }));

      call().subscribe((result: any) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it(`${name} propagates errors via catchError`, (done) => {
      apiSpy[verb].and.returnValue(throwError(() => new Error('server error')));

      call().subscribe({
        error: (e: any) => {
          expect(e.message).toBe('server error');
          done();
        },
      });
    });
  });
});
