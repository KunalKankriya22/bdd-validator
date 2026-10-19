import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ModifySddDetailsService } from './modify-sdd-details.service';
import { ApiService } from '@shared/services/api.service';

describe('ModifySddDetailsService', () => {
  let service: ModifySddDetailsService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        ModifySddDetailsService,
        { provide: ApiService, useValue: spy },
      ],
    });

    service = TestBed.inject(ModifySddDetailsService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getProductsByUnit', () => {
    it('should call GET and return product codes', (done) => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: [{ productCode: 'P1' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getProductsByUnit('U001').subscribe({
        next: (result) => {
          expect(result).toEqual([{ productCode: 'P1' }] as any);
          done();
        },
      });
    });
  });

  describe('getFormData', () => {
    it('should call GET and return form data', (done) => {
      const mockFormData = { unitId: 'U001', productCode: 'P1' };
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockFormData }));

      service.getFormData('U001', 'P1').subscribe({
        next: (result) => {
          expect(result).toEqual(mockFormData as any);
          done();
        },
      });
    });
  });

  describe('getLotNumbers', () => {
    it('should call GET and return lot numbers', (done) => {
      const mockData = [{ lotNumber: 'LOT1' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockData }));

      service.getLotNumbers('U001', 'P1').subscribe({
        next: (result) => {
          expect(result).toEqual(mockData as any);
          done();
        },
      });
    });
  });

  describe('getWaferLotNumbers', () => {
    it('should call GET and return wafer lot numbers', (done) => {
      const mockData = [{ waferLot: 'WL1' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockData }));

      service.getWaferLotNumbers().subscribe({
        next: (result) => {
          expect(result).toEqual(mockData as any);
          done();
        },
      });
    });
  });

  describe('getSterileMachines', () => {
    it('should call GET and return machines', (done) => {
      const mockData = [{ machineId: 'M1' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockData }));

      service.getSterileMachines().subscribe({
        next: (result) => {
          expect(result).toEqual(mockData as any);
          done();
        },
      });
    });
  });

  describe('update', () => {
    it('should call PUT with payload', (done) => {
      apiServiceSpy.put.and.returnValue(of({ success: true, message: '', statusCode: 200, data: undefined }));

      service.update({ unitId: 'U001' } as any).subscribe({
        next: () => {
          expect(apiServiceSpy.put).toHaveBeenCalled();
          done();
        },
      });
    });
  });
});
