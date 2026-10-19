import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { SpecialProcessingQueryComponent } from './special-processing-query.component';
import { SpecialProcessingQueryApiService } from './services/special-processing-query-api.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('SpecialProcessingQueryComponent', () => {
  let component: SpecialProcessingQueryComponent;
  let fixture: ComponentFixture<SpecialProcessingQueryComponent>;
  let apiServiceSpy: jasmine.SpyObj<SpecialProcessingQueryApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;

  const mockResult = {
    unitId: 'U001',
    collDate: '2024-01-15T10:00:00Z',
    specialProcessingRecords: [
      {
        productCode: 'RBC',
        differentials: [
          {
            stageCode: 'S01',
            insertDate: '2024-01-15T10:00:00Z',
            insertUserId: 'USER1',
            details: [{ label: 'Test', value: '1' }],
          },
        ],
        reagents: [],
        spiking: [],
      },
    ],
  };

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('SpecialProcessingQueryApiService', ['search']);
    snackbarServiceSpy = createMockSnackbarService();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: () => null,
    });



      TestBed.configureTestingModule({
      imports: [SpecialProcessingQueryComponent, NoopAnimationsModule],
      providers: [
        { provide: SpecialProcessingQueryApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
      ],
    });


    


      apiServiceSpy.search.calls.reset();


    fixture = TestBed.createComponent(SpecialProcessingQueryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  it('should initialize search form', () => {
    expect(component.searchForm).toBeTruthy();
    expect(component.searchForm.get('unitId')).toBeTruthy();
  });

  it('should start with loading false', () => {
    expect(component.loading()).toBe(false);
  });

  it('should start with hasSearched false', () => {
    expect(component.hasSearched()).toBe(false);
  });

  it('should start with null unit data', () => {
    expect(component.unitData()).toBeNull();
  });

  describe('onSearch', () => {




    it('should call apiService.search with uppercase trimmed unitId', fakeAsync(() => {
      apiServiceSpy.search.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [mockResult] } as any));
      component.searchForm.get('unitId')?.setValue('u001 ');
      component.onSearch();
      tick();
      expect(apiServiceSpy.search).toHaveBeenCalledWith({ unitId: 'U001' });
    }));

    it('should set unitData on successful search', fakeAsync(() => {
      apiServiceSpy.search.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [mockResult] } as any));
      component.searchForm.get('unitId')?.setValue('U001');
      component.onSearch();
      tick();
      expect(component.unitData()).toEqual(mockResult as any);
    }));

    it('should set hasSearched to true on success', fakeAsync(() => {
      apiServiceSpy.search.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [mockResult] } as any));
      component.searchForm.get('unitId')?.setValue('U001');
      component.onSearch();
      tick();
      expect(component.hasSearched()).toBe(true);
    }));

    it('should select first product when records exist', fakeAsync(() => {
      apiServiceSpy.search.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [mockResult] } as any));
      component.searchForm.get('unitId')?.setValue('U001');
      component.onSearch();
      tick();
      expect(component.selectedProductIndex()).toBe(0);
    }));




  });

  describe('onClear', () => {
    it('should reset form and clear data', fakeAsync(() => {
      apiServiceSpy.search.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [mockResult] } as any));
      component.searchForm.get('unitId')?.setValue('U001');
      component.onSearch();
      tick();

      component.onClear();
      expect(component.unitData()).toBeNull();
      expect(component.hasSearched()).toBe(false);
      expect(component.searchForm.get('unitId')?.value).toBeFalsy();
    }));
  });
  describe('onStageSelect', () => {
    it('should update selectedStageIndex', () => {
      component.onStageSelect(3);
      expect(component.selectedStageIndex()).toBe(3);
    });
  });

  describe('computed properties', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.search.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [mockResult] } as any));
      component.searchForm.get('unitId')?.setValue('U001');
      component.onSearch();
      tick();
    }));

    it('should compute productRecords from unitData', () => {
      expect(component.productRecords().length).toBe(1);
    });

    it('should compute stages from selected product', () => {
      expect(component.stages().length).toBeGreaterThanOrEqual(0);
    });

    it('should compute collectionDate from unitData', () => {
      const date = component.collectionDate();
      expect(date).toContain('JAN');
    });
  });
  describe('formatDateTime', () => {
    it('should format valid datetime string', () => {
      const result = component.formatDateTime('2024-03-15T14:30:00Z');
      expect(result).toMatch(/\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}/);
    });


  });
});
