import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ProductCurrentStatusService } from './product-current-status.service';
import { ApiService } from '@shared/services/api.service';

describe('ProductCurrentStatusService', () => {
  let service: ProductCurrentStatusService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);
    TestBed.configureTestingModule({
      providers: [
        ProductCurrentStatusService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });
    service = TestBed.inject(ProductCurrentStatusService);
  });

  it('getSummary posts query and extracts res.data', (done) => {
    const summary = { totalUnits: 5 };
    apiSpy.post.and.returnValue(of({ data: summary }));

    service.getSummary({} as any).subscribe((result) => {
      expect(result).toEqual(summary as any);
      done();
    });
  });

  describe('LOV methods with nullish coalescing to empty array', () => {
    const lovMethods: { name: string; call: () => any }[] = [
      { name: 'getProductCodeLov', call: () => service.getProductCodeLov('U1', 'ISBT') },
      { name: 'getAliquotLov', call: () => service.getAliquotLov('U1', 'PC1') },
    ];

    lovMethods.forEach(({ name, call }) => {
      it(`${name} returns data when present`, (done) => {
        const items = [{ code: 'A' }];
        apiSpy.get.and.returnValue(of({ data: items }));

        call().subscribe((result: any) => {
          expect(result).toEqual(items);
          done();
        });
      });

      it(`${name} returns empty array when data is null`, (done) => {
        apiSpy.get.and.returnValue(of({ data: null }));

        call().subscribe((result: any) => {
          expect(result).toEqual([]);
          done();
        });
      });
    });
  });
});
