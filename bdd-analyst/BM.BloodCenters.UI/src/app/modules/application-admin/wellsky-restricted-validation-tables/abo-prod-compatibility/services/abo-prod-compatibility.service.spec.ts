import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ABOProdCompatibilityService } from './abo-prod-compatibility.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('ABOProdCompatibilityService', () => {
  let service: ABOProdCompatibilityService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiSpy }],
    });
    service = TestBed.inject(ABOProdCompatibilityService);
  });

  it('getABOProdCompatibility posts and maps data+totalRecords', (done) => {
    apiSpy.post.and.returnValue(of({ data: [{ id: 1 }], total: 5 }));

    service.getABOProdCompatibility(10, 0, {} as any).subscribe(result => {
      expect(result).toEqual({ data: [{ id: 1 }] as any, totalRecords: 5 });
      expect(apiSpy.post).toHaveBeenCalledWith(
        API.APPLICATION_ADMIN.ABO_PRODUCT_COMPATIBILITY(10, 0),
        {} as any
      );
      done();
    });
  });

  it('getABOProdCompatibilityFilters gets filter options', (done) => {
    const mockFilters = [{ label: 'Type A' }];
    apiSpy.get.and.returnValue(of(mockFilters));

    service.getABOProdCompatibilityFilters().subscribe(result => {
      expect(result).toEqual(mockFilters as any);
      expect(apiSpy.get).toHaveBeenCalledWith(
        API.APPLICATION_ADMIN.ABO_PRODUCT_COMPATIBILITY_FILTERS
      );
      done();
    });
  });

  it('getAddDropdownValues gets dropdown options', (done) => {
    const mockDropdowns = { productTypes: ['A'], aboTypes: ['O'] };
    apiSpy.get.and.returnValue(of(mockDropdowns));

    service.getAddDropdownValues().subscribe(result => {
      expect(result).toEqual(mockDropdowns as any);
      expect(apiSpy.get).toHaveBeenCalledWith(
        API.APPLICATION_ADMIN.ABO_PRODUCT_COMPATIBILITY_ADD_DROPDOWN_VALUES
      );
      done();
    });
  });

  it('addABOProdCompatibility posts new record', (done) => {
    const mockRes = { success: true };
    apiSpy.post.and.returnValue(of(mockRes));

    service.addABOProdCompatibility({} as any).subscribe(result => {
      expect(result).toEqual(mockRes as any);
      expect(apiSpy.post).toHaveBeenCalledWith(
        API.APPLICATION_ADMIN.ABO_PRODUCT_COMPATIBILITY_ADD_EDIT,
        {} as any
      );
      done();
    });
  });

  it('updateABOProdCompatibility puts updated record', (done) => {
    const mockRes = { success: true };
    apiSpy.put.and.returnValue(of(mockRes));

    service.updateABOProdCompatibility({} as any).subscribe(result => {
      expect(result).toEqual(mockRes as any);
      expect(apiSpy.put).toHaveBeenCalledWith(
        API.APPLICATION_ADMIN.ABO_PRODUCT_COMPATIBILITY_ADD_EDIT,
        {} as any
      );
      done();
    });
  });
});
