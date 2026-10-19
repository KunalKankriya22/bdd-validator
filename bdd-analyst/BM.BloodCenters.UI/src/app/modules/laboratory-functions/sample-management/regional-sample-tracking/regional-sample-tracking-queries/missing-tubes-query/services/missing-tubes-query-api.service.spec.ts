import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { MissingTubesQueryApiService } from './missing-tubes-query-api.service';

describe('MissingTubesQueryApiService', () => {
  let service: MissingTubesQueryApiService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    httpSpy = jasmine.createSpyObj('HttpClient', ['get']);

    TestBed.configureTestingModule({
      providers: [
        MissingTubesQueryApiService,
        { provide: HttpClient, useValue: httpSpy },
      ],
    });

    service = TestBed.inject(MissingTubesQueryApiService);
  });

  [
    { name: 'getContracts', args: [] },
    { name: 'getBatches', args: ['C1'] },
    { name: 'getMissingReasons', args: [] },
    { name: 'query', args: ['C1', 'B1'] },
  ].forEach(({ name, args }) => {
    it(`${name} should delegate to http.get`, (done) => {
      httpSpy.get.and.returnValue(of({ success: true, data: [] }));

      (service as any)[name](...args).subscribe(() => {
        expect(httpSpy.get).toHaveBeenCalled();
        done();
      });
    });
  });
});
