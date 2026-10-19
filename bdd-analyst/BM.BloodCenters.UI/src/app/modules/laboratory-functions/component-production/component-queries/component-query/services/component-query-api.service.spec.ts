import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ComponentQueryApiService } from './component-query-api.service';
import { ApiService } from '@shared/services/api.service';

describe('ComponentQueryApiService', () => {
  let service: ComponentQueryApiService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get']);

    TestBed.configureTestingModule({
      providers: [
        ComponentQueryApiService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(ComponentQueryApiService);
  });

  [
    { name: 'getSummary', args: ['U1'] },
    { name: 'getComponents', args: ['U1', 100, 0] },
    { name: 'getConverted', args: ['U1', 100, 0] },
    { name: 'getAttributes', args: ['U1', 'PC1'] },
    { name: 'getInterdictions', args: ['U1', 'PC1'] },
  ].forEach(({ name, args }) => {
    it(`${name} should delegate to apiService.get`, (done) => {
      apiSpy.get.and.returnValue(of({ success: true, data: [] }));

      (service as any)[name](...args).subscribe(() => {
        expect(apiSpy.get).toHaveBeenCalled();
        done();
      });
    });
  });
});
