import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LabWarehouseCheckInApiService } from './lab-warehouse-check-in-api.service';
import { ApiService } from '@shared/services/api.service';

describe('LabWarehouseCheckInApiService', () => {
  let service: LabWarehouseCheckInApiService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        LabWarehouseCheckInApiService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(LabWarehouseCheckInApiService);
  });

  describe('POST methods returning response.item', () => {
    const cases: { method: 'validateUnit' | 'validateProduct' | 'checkin'; payload: any; mockItem: any }[] = [
      { method: 'validateUnit', payload: { unitNumber: 'U1' }, mockItem: { isValid: true } },
      { method: 'validateProduct', payload: { productCode: 'P1' }, mockItem: { isValid: true } },
      { method: 'checkin', payload: { unitNumber: 'U1' }, mockItem: { checkinId: '1' } },
    ];

    cases.forEach(({ method, payload, mockItem }) => {
      it(`${method} should POST and return response.item`, (done) => {
        apiSpy.post.and.returnValue(of({ item: mockItem }));

        service[method](payload).subscribe((result: any) => {
          expect(result).toEqual(mockItem);
          done();
        });
      });
    });
  });

  it('getHistory should GET and return response.item', (done) => {
    const mockItem = { records: [] };
    apiSpy.get.and.returnValue(of({ item: mockItem }));

    service.getHistory('2024-01-01').subscribe((result) => {
      expect(result).toEqual(mockItem as any);
      done();
    });
  });
});
