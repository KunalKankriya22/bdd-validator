import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { AutoDirProductsComponent } from './auto-dir-products';
import { AutoDirProductsApiService } from './services/auto-dir-products-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  AutoDirProductsFilterForm,
  AutoDirProductsUnitDto,
  AutoDirProductsSearchResponse
} from './models/auto-dir-products.model';

describe('AutoDirProductsComponent', () => {
  let apiSpy: any;
  let component: AutoDirProductsComponent;
  let fixture: ComponentFixture<AutoDirProductsComponent>;
  let apiServiceSpy: jasmine.SpyObj<AutoDirProductsApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;

  const mockUnit: AutoDirProductsUnitDto = {
    unitId: 'UNIT001',
    checkDigit: '12',
    collectionDate: new Date('2024-05-15'),
    donorDecisionDisplay: 'AU',
    patientId: 'PAT001',
    patientName: 'Doe, John',
    hospitalId: 'HOSP001',
    hospitalShortName: 'Test Hospital',
    needByDate: new Date('2024-06-15'),
    surgeryDate: new Date('2024-06-20'),
    surgeryId: 'SURG001',
    comments: 'Pre-surgical autologous donation',
    productTypes: ['RBC', 'PLT'],
    components: [
      {
        productType: 'RBC',
        productCode: 'E0100',
        productDescription: 'Red Blood Cells',
        expiryDate: new Date('2024-06-14'),
        shipProduct: 'Y'
      }
    ]
  };

  const mockSearchResponse: AutoDirProductsSearchResponse = {
    data: [mockUnit],
    total: 1
  };

  beforeEach(() => {

    apiSpy = jasmine.createSpyObj('AutoDirProductsApiService', [
      'searchProducts',
      'getByUnitId',
      'getHospitals',
      'getPatients'
    ]);
    const snackbarSpy = createMockSnackbarService();

    // Mock the lookup methods to return empty arrays
    apiSpy.getHospitals.and.returnValue(of([]));
    apiSpy.getPatients.and.returnValue(of([]));



      TestBed.configureTestingModule({
      imports: [AutoDirProductsComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AutoDirProductsApiService, useValue: apiSpy },
        { provide: SnackbarService, useValue: snackbarSpy }
      ]
    });


    


      apiSpy.searchProducts.calls.reset();


      apiSpy.getByUnitId.calls.reset();


      apiSpy.getHospitals.calls.reset();


      apiSpy.getPatients.calls.reset();


      apiSpy.getHospitals.and.returnValue(of([]));


      apiSpy.getPatients.and.returnValue(of([]));


    fixture = TestBed.createComponent(AutoDirProductsComponent);
    component = fixture.componentInstance;
    apiServiceSpy = TestBed.inject(AutoDirProductsApiService) as jasmine.SpyObj<AutoDirProductsApiService>;
    snackbarServiceSpy = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;


    });
  describe('Search Functionality', () => {
    it('should search successfully with valid criteria', fakeAsync(() => {
      apiServiceSpy.searchProducts.and.returnValue(of(mockSearchResponse));

      const filters: AutoDirProductsFilterForm = {
        unitId: 'UNIT001',
        fromDate: null,
        toDate: null,
        needByDate: null,
        surgeryDate: null,
        hospitalId: null,
        patientId: null,
        orderBy: 'UNIT'
      };

      fixture.detectChanges();
      component.onSearch(filters);
      tick();

      expect(apiServiceSpy.searchProducts).toHaveBeenCalled();
      expect(component.units()).toEqual([mockUnit]);
      expect(component.totalRecords()).toBe(1);
      expect(component.searched()).toBe(true);
      expect(component.loading()).toBe(false);
    }));



    it('should validate date range - toDate before fromDate', () => {
      const filters: AutoDirProductsFilterForm = {
        unitId: null,
        fromDate: new Date('2024-12-31'),
        toDate: new Date('2024-01-01'),
        needByDate: null,
        surgeryDate: null,
        hospitalId: null,
        patientId: null,
        orderBy: 'UNIT'
      };

      fixture.detectChanges();
      component.onSearch(filters);

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('7023 - To Date cannot be before From Date');
      expect(apiServiceSpy.searchProducts).not.toHaveBeenCalled();
    });

    it('should validate surgery date - before need by date', () => {
      const filters: AutoDirProductsFilterForm = {
        unitId: 'UNIT001',
        fromDate: null,
        toDate: null,
        needByDate: new Date('2024-06-20'),
        surgeryDate: new Date('2024-06-15'),
        hospitalId: null,
        patientId: null,
        orderBy: 'UNIT'
      };

      fixture.detectChanges();
      component.onSearch(filters);

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('2319 - Surgery Date cannot be before Need By Date');
      expect(apiServiceSpy.searchProducts).not.toHaveBeenCalled();
    });



    it('should generate filter chips on search', fakeAsync(() => {
      apiServiceSpy.searchProducts.and.returnValue(of(mockSearchResponse));

      const filters: AutoDirProductsFilterForm = {
        unitId: 'UNIT001',
        fromDate: new Date('2024-01-01'),
        toDate: null,
        needByDate: null,
        surgeryDate: null,
        hospitalId: 'HOSP001',
        patientId: null,
        orderBy: 'UNIT'
      };

      fixture.detectChanges();
      component.onSearch(filters);
      tick();

      expect(component.filterChips().length).toBeGreaterThan(0);
    }));



    it('should handle search errors', fakeAsync(() => {
      const error = {
        error: { message: 'Internal server error' },
        message: 'HTTP Error'
      };
      apiServiceSpy.searchProducts.and.returnValue(throwError(() => error));

      const filters: AutoDirProductsFilterForm = {
        unitId: 'UNIT001',
        fromDate: null,
        toDate: null,
        needByDate: null,
        surgeryDate: null,
        hospitalId: null,
        patientId: null,
        orderBy: 'UNIT'
      };

      fixture.detectChanges();
      component.onSearch(filters);
      tick();

      expect(component.error()).toBeTruthy();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component.loading()).toBe(false);
    }));
  });

  describe('Clear Filters', () => {
    it('should clear all filters and reset state', fakeAsync(() => {
      apiServiceSpy.searchProducts.and.returnValue(of(mockSearchResponse));

      const filters: AutoDirProductsFilterForm = {
        unitId: 'UNIT001',
        fromDate: null,
        toDate: null,
        needByDate: null,
        surgeryDate: null,
        hospitalId: null,
        patientId: null,
        orderBy: 'UNIT'
      };

      fixture.detectChanges();
      component.onSearch(filters);
      tick();

      expect(component.units().length).toBe(1);

      component.onClearFilters();

      expect(component.units()).toEqual([]);
      expect(component.totalRecords()).toBe(0);
      expect(component.searched()).toBe(false);
      expect(component.filterChips()).toEqual([]);
      expect(component.pageIndex).toBe(0);
    }));
  });

  describe('Filter Chips', () => {
    it('should remove individual filter chip and re-search', fakeAsync(() => {
      apiServiceSpy.searchProducts.and.returnValue(of(mockSearchResponse));

      const filters: AutoDirProductsFilterForm = {
        unitId: 'UNIT001',
        fromDate: null,
        toDate: null,
        needByDate: null,
        surgeryDate: null,
        hospitalId: 'HOSP001',
        patientId: null,
        orderBy: 'UNIT'
      };

      fixture.detectChanges();
      component.onSearch(filters);
      tick();

      const chips = component.filterChips();
      const removableChip = chips.find(c => c.key === 'hospitalId' && c.removable);

      if (removableChip) {
        component.onRemoveFilterChip(removableChip);
        tick();

        expect(apiServiceSpy.searchProducts).toHaveBeenCalledTimes(2);
      }
    }));




  });
  describe('Unit Selection', () => {
    it('should select a unit', () => {
      const unit: any = { unitId: 'UNIT001', donorDecisionDisplay: 'Autologous' };

      expect(component.isUnitSelected('UNIT001')).toBe(false);

      component.selectUnit(unit);
      expect(component.isUnitSelected('UNIT001')).toBe(true);
      expect(component.selectedUnit()).toEqual(unit);
    });

    it('should change selected unit when a different unit is clicked', () => {
      const unit1: any = { unitId: 'UNIT001', donorDecisionDisplay: 'Autologous' };
      const unit2: any = { unitId: 'UNIT002', donorDecisionDisplay: 'Directed' };

      component.selectUnit(unit1);
      expect(component.isUnitSelected('UNIT001')).toBe(true);

      component.selectUnit(unit2);
      expect(component.isUnitSelected('UNIT001')).toBe(false);
      expect(component.isUnitSelected('UNIT002')).toBe(true);
    });
  });

  describe('Helper Methods', () => {


    it('should get donor decision label', () => {
      expect(component.getDonorDecisionLabel('AU')).toBe('Autologous');
      expect(component.getDonorDecisionLabel('DI')).toBe('Directed');
      expect(component.getDonorDecisionLabel('XX')).toBe('XX');
    });




  });
  describe('Error State', () => {
    it('should show error message', () => {
      component['error'].set('Test error message');
      component['loading'].set(false);
      fixture.detectChanges();

      const errorContainer = fixture.debugElement.query(By.css('.error-container'));
      expect(errorContainer).toBeTruthy();
      expect(errorContainer.nativeElement.textContent).toContain('Test error message');
    });


  });
});
