import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { EquipmentMasterCodeService } from './equipment-master-code.service';
import { ApiService } from '@shared/services/api.service';

describe('EquipmentMasterCodeService', () => {
  let service: EquipmentMasterCodeService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        EquipmentMasterCodeService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(EquipmentMasterCodeService);
  });

  describe('GET dropdown methods', () => {
    const cases: { method: 'getCodeTypes' | 'getUserGroups' }[] = [
      { method: 'getCodeTypes' },
      { method: 'getUserGroups' },
    ];

    cases.forEach(({ method }) => {
      it(`${method} should return mapped data array`, (done) => {
        const items = [{ code: 'X' }];
        apiSpy.get.and.returnValue(of({ data: items }));

        service[method]().subscribe((result: any) => {
          expect(result).toEqual(items);
          done();
        });
      });
    });
  });

  it('getByCodeType should return data and total', (done) => {
    apiSpy.get.and.returnValue(of({ data: [{ code: 'C1' }], total: 1 }));

    service.getByCodeType('TYPE1').subscribe((result) => {
      expect(result).toEqual({ data: [{ code: 'C1' }] as any, total: 1 });
      done();
    });
  });

  it('create should POST and return result', (done) => {
    const response = { data: [{ code: 'NEW' }] };
    apiSpy.post.and.returnValue(of(response));

    service.create({ codeType: 'T', code: 'NEW' } as any).subscribe((result) => {
      expect(result).toEqual(response as any);
      done();
    });
  });

  it('update should PUT and return result', (done) => {
    const response = { data: [{ code: 'UPD' }] };
    apiSpy.put.and.returnValue(of(response));

    service.update('TYPE1', 'C1', { description: 'Updated' } as any).subscribe((result) => {
      expect(result).toEqual(response as any);
      done();
    });
  });

  it('delete should DELETE and return result', (done) => {
    const response = { data: true };
    apiSpy.delete.and.returnValue(of(response));

    service.delete('TYPE1', 'C1').subscribe((result) => {
      expect(result).toEqual(response as any);
      done();
    });
  });
});
