import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { VmorService } from './valid-multiple-observation-results.service';
import { ApiService } from '@shared/services/api.service';

describe('VmorService', () => {
  let service: VmorService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);
    TestBed.configureTestingModule({
      providers: [
        VmorService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });
    service = TestBed.inject(VmorService);
  });

  const methods: { name: string; call: () => any; verb: 'get' | 'post' }[] = [
    { name: 'getTests', call: () => service.getTests(), verb: 'get' },
    { name: 'getBandResults', call: () => service.getBandResults('T1'), verb: 'get' },
    { name: 'saveBandResults', call: () => service.saveBandResults({} as any), verb: 'post' },
  ];

  methods.forEach(({ name, call, verb }) => {
    it(`${name} extracts nested data.data from API response`, (done) => {
      const items = [{ id: '1', value: 'A' }];
      apiSpy[verb].and.returnValue(of({ data: { data: items } }));

      call().subscribe((result: any) => {
        expect(result).toEqual(items);
        done();
      });
    });
  });

  it('saveBandResults posts the payload to the save endpoint', (done) => {
    const payload = { testId: 'T1', results: [] };
    apiSpy.post.and.returnValue(of({ data: { data: [] } }));

    service.saveBandResults(payload as any).subscribe(() => {
      expect(apiSpy.post.calls.mostRecent().args[1]).toEqual(payload);
      done();
    });
  });
});
