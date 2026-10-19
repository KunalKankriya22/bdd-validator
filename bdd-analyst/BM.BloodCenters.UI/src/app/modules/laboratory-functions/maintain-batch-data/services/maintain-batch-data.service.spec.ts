import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { MaintainBatchDataService } from './maintain-batch-data.service';
import { ApiService } from '@shared/services/api.service';

describe('MaintainBatchDataService', () => {
  let service: MaintainBatchDataService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'put']);

    TestBed.configureTestingModule({
      providers: [
        MaintainBatchDataService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(MaintainBatchDataService);
  });

  [
    { name: 'getBatchLov', verb: 'get', args: [] },
    { name: 'getBatchById', verb: 'get', args: ['B1'] },
    { name: 'updateBatch', verb: 'put', args: [{ batchId: 'B1' }] },
  ].forEach(({ name, verb, args }) => {
    it(`${name} should delegate to apiService.${verb}`, (done) => {
      (apiSpy as any)[verb].and.returnValue(of({ data: [], item: null, success: true, message: '' }));

      (service as any)[name](...args).subscribe(() => {
        expect((apiSpy as any)[verb]).toHaveBeenCalled();
        done();
      });
    });
  });
});
