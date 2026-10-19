import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { EnterControlValuesService } from './enter-control-values.service';
import { ApiService } from '@shared/services/api.service';

describe('EnterControlValuesService', () => {
  let service: EnterControlValuesService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);
    TestBed.configureTestingModule({
      providers: [
        EnterControlValuesService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });
    service = TestBed.inject(EnterControlValuesService);
  });

  describe('list-returning GET methods (data || Data || [] fallback)', () => {
    const listMethods: { name: string; call: () => any; verb: 'get' | 'post' }[] = [
      { name: 'getTestBatchOptions', call: () => service.getTestBatchOptions(), verb: 'get' },
      { name: 'getTestOptions', call: () => service.getTestOptions('TB1'), verb: 'get' },
      { name: 'getRunOptions', call: () => service.getRunOptions('T1', 'P'), verb: 'get' },
      { name: 'getKitOptions', call: () => service.getKitOptions('T1'), verb: 'get' },
      { name: 'getDeviceOptions', call: () => service.getDeviceOptions('RC1'), verb: 'get' },
      { name: 'getReagentLovOptions', call: () => service.getReagentLovOptions('T1', 'RC1'), verb: 'get' },
      { name: 'getReagents', call: () => service.getReagents('TK1', 'CH1'), verb: 'get' },
      { name: 'getUnits', call: () => service.getUnits('TB1', 'T1', 'CH1'), verb: 'get' },
    ];

    listMethods.forEach(({ name, call, verb }) => {
      it(`${name} returns data from "data" property`, (done) => {
        const items = [{ id: '1' }];
        apiSpy[verb].and.returnValue(of({ data: items }));
        call().subscribe((result: any) => {
          expect(result).toEqual(items);
          done();
        });
      });

      it(`${name} falls back to "Data" property`, (done) => {
        const items = [{ id: '2' }];
        apiSpy[verb].and.returnValue(of({ Data: items }));
        call().subscribe((result: any) => {
          expect(result).toEqual(items);
          done();
        });
      });

      it(`${name} returns empty array when neither property exists`, (done) => {
        apiSpy[verb].and.returnValue(of({}));
        call().subscribe((result: any) => {
          expect(result).toEqual([]);
          done();
        });
      });
    });
  });

  describe('item-returning methods (item || Item fallback)', () => {
    const itemMethods: { name: string; call: () => any; verb: 'get' | 'post' }[] = [
      { name: 'getBatchDetail', call: () => service.getBatchDetail('TB1', 'T1'), verb: 'get' },
      { name: 'retrieve', call: () => service.retrieve({ tbId: 'TB1', testId: 'T1', testKitId: 'TK1' }), verb: 'post' },
      { name: 'validateParameter', call: () => service.validateParameter({} as any), verb: 'post' },
      { name: 'save', call: () => service.save({} as any), verb: 'post' },
    ];

    itemMethods.forEach(({ name, call, verb }) => {
      it(`${name} returns "item" property when present`, (done) => {
        const detail = { id: 'X' };
        apiSpy[verb].and.returnValue(of({ item: detail }));
        call().subscribe((result: any) => {
          expect(result).toEqual(detail);
          done();
        });
      });

      it(`${name} falls back to "Item" property`, (done) => {
        const detail = { id: 'Y' };
        apiSpy[verb].and.returnValue(of({ Item: detail }));
        call().subscribe((result: any) => {
          expect(result).toEqual(detail);
          done();
        });
      });
    });
  });

  it('getKitOptions appends kitLotNumber query param when provided', (done) => {
    apiSpy.get.and.returnValue(of({ data: [] }));
    service.getKitOptions('T1', 'LOT-42').subscribe(() => {
      const url: string = apiSpy.get.calls.mostRecent().args[0];
      expect(url).toContain('kitLotNumber=LOT-42');
      done();
    });
  });

  it('validateParameter passes SKIP_ERROR_TOAST http context', (done) => {
    apiSpy.post.and.returnValue(of({ item: {} }));
    service.validateParameter({} as any).subscribe(() => {
      const options = apiSpy.post.calls.mostRecent().args[2];
      expect(options?.context).toBeTruthy();
      done();
    });
  });
});
