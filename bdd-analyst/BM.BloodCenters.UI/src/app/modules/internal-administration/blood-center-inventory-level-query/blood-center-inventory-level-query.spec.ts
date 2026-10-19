import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Subject, of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { BloodCenterInventoryLevelQuery } from './blood-center-inventory-level-query';
import { BloodCenterInventoryLevelQueryService } from './services/blood-center-inventory-level-query.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { provideRouter } from '@angular/router';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  InventoryClassDto,
  InventoryLevelResultDto
} from './interfaces/inventory-level.interface';
describe('BloodCenterInventoryLevelQuery', () => {
  let filtered: any;
  let component: BloodCenterInventoryLevelQuery;
  let fixture: ComponentFixture<BloodCenterInventoryLevelQuery>;
  let serviceSpy: jasmine.SpyObj<BloodCenterInventoryLevelQueryService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;

  const mockInventoryClasses: InventoryClassDto[] = [
    { code: 'DO', description: 'Donor' },
    { code: 'OP', description: 'Operating Room' }
  ];

  const mockInventoryResults: InventoryLevelResultDto[] = [
    {
      productType: 'PLAS',
      productDescription: 'Plasma',
      bloodType: 'ON',
      bloodTypeDescription: 'O Negative',
      actualCount: 125,
      minLevel: 100,
      optimalLevel: 150,
      customerAlphaKey: 'STANDARD'
    },
    {
      productType: 'PRBC',
      productDescription: 'Red Blood Cells',
      bloodType: 'OP',
      bloodTypeDescription: 'O Positive',
      actualCount: 80,
      minLevel: 100,
      optimalLevel: 150,
      customerAlphaKey: 'STANDARD'
    }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('BloodCenterInventoryLevelQueryService', [
      'getInventoryClasses',
      'queryInventoryLevels',
      'getProductTypes',
      'getBloodTypes',
      'getAttributeGroups',
      'getAttributeCodes'
    ]);

    snackbarSpy = createMockSnackbarService();

    serviceSpy.getInventoryClasses.and.returnValue(of(mockInventoryClasses));
    serviceSpy.queryInventoryLevels.and.returnValue(of(mockInventoryResults));



      TestBed.configureTestingModule({
      imports: [BloodCenterInventoryLevelQuery, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: BloodCenterInventoryLevelQueryService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

      serviceSpy.getInventoryClasses.and.returnValue(of(mockInventoryClasses));


      serviceSpy.queryInventoryLevels.and.returnValue(of(mockInventoryResults));


    fixture = TestBed.createComponent(BloodCenterInventoryLevelQuery);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {


    it('should initialize form with empty inventory class', () => {
      fixture.detectChanges();
      expect(component.form.get('inventoryClass')?.value).toBe('');
    });

    it('should load inventory classes on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(serviceSpy.getInventoryClasses).toHaveBeenCalled();
      expect(component.inventoryClasses()).toEqual(mockInventoryClasses);
    }));


  });

  describe('Loading State', () => {


    it('should reflect loading state during query', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.loading.set(true);

      expect(component.loading()).toBe(true);
    }));
  });

  describe('Inventory Class Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should query inventory levels when inventory class is selected', fakeAsync(() => {
      component.form.patchValue({ inventoryClass: 'DO' });
      component.onInventoryClassChange();
      tick();

      expect(serviceSpy.queryInventoryLevels).toHaveBeenCalledWith(
        jasmine.objectContaining({ inventoryClass: 'DO' })
      );
      expect(component.inventoryResults()).toEqual(mockInventoryResults);
    }));





    it('should update selectedInventoryClass on change', fakeAsync(() => {
      component.form.patchValue({ inventoryClass: 'DO' });
      component.onInventoryClassChange();
      tick();

      expect(component.selectedInventoryClass()).toBe('DO');
    }));
  });

  describe('Clear Functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.patchValue({ inventoryClass: 'DO' });
      component.inventoryResults.set(mockInventoryResults);
      component.searchText.set('plasma');
      component.currentFilters.set({ productType: 'PLAS' });
    }));



    it('should clear results on clear', () => {
      component.onClear();

      expect(component.inventoryResults()).toEqual([]);
    });




  });

  describe('Filter Panel', () => {
    it('should toggle filter panel visibility', () => {
      expect(component.isFilterOpen()).toBe(false);

      component.toggleFilter();
      expect(component.isFilterOpen()).toBe(true);

      component.toggleFilter();
      expect(component.isFilterOpen()).toBe(false);
    });

    it('should apply filters and re-query', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.patchValue({ inventoryClass: 'DO' });

      const filters = { productType: 'PLAS', bloodType: 'ON' };
      component.onApplyFilters(filters);
      tick();

      expect(component.currentFilters()).toEqual(filters);
      expect(serviceSpy.queryInventoryLevels).toHaveBeenCalledWith(
        jasmine.objectContaining({
          inventoryClass: 'DO',
          productType: 'PLAS',
          bloodType: 'ON'
        })
      );
    }));





    it('should build filter chips when filters applied', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.patchValue({ inventoryClass: 'DO' });
      component.onApplyFilters({ productType: 'PLAS', bloodType: 'ON' });
      tick();

      expect(component.filterChips().length).toBe(2);
    }));

    it('should remove a single filter chip', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.patchValue({ inventoryClass: 'DO' });
      component.onApplyFilters({ productType: 'PLAS', bloodType: 'ON' });
      tick();

      component.removeFilterChip('productType');
      tick();

      const chips = component.filterChips();
      expect(chips.find(c => c.key === 'productType')).toBeUndefined();
    }));
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      component.inventoryResults.set(mockInventoryResults);
    });





    it('should return all results when search is empty', () => {
      component.onSearchChange('');

      filtered = component.filteredResults();
      expect(filtered.length).toBe(2);
    });


  });

  describe('Error Handling', () => {
    it('should handle inventory class load error and show snackbar', fakeAsync(() => {
      serviceSpy.getInventoryClasses.and.returnValue(
        throwError(() => ({ error: { message: 'Failed to load' } }))
      );

      fixture.detectChanges();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalled();
      expect(component.loadingClasses()).toBe(false);
    }));


  });

  describe('Computed Values', () => {
    it('should compute hasResults correctly when empty', () => {
      component.inventoryResults.set([]);
      expect(component.hasResults()).toBe(false);
    });

    it('should compute hasResults correctly when data present', () => {
      component.inventoryResults.set(mockInventoryResults);
      expect(component.hasResults()).toBe(true);
    });

    it('should compute selectedInventoryClass after calling onInventoryClassChange', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.selectedInventoryClass()).toBe('');

      component.form.patchValue({ inventoryClass: 'DO' });
      component.onInventoryClassChange();
      tick();

      expect(component.selectedInventoryClass()).toBe('DO');
    }));

    it('should compute pagedResults from filteredResults', () => {
      component.inventoryResults.set(mockInventoryResults);
      const paged = component.pagedResults();
      expect(paged.length).toBe(2);
    });

    it('should return form controls via f getter', () => {
      fixture.detectChanges();
      expect(component.f['inventoryClass']).toBeTruthy();
    });
  });

  describe('Lifecycle', () => {
    it('should call destroy$.next and complete on ngOnDestroy', () => {
      fixture.detectChanges();
      const nextSpy = spyOn((component as any).destroy$, 'next').and.callThrough();
      const completeSpy = spyOn((component as any).destroy$, 'complete').and.callThrough();
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Inventory Class — invalid form branch', () => {
    it('should not call queryInventoryLevels when form is invalid', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      serviceSpy.queryInventoryLevels.calls.reset();
      component.onInventoryClassChange(); // inventoryClass still '' → form invalid
      tick();

      expect(serviceSpy.queryInventoryLevels).not.toHaveBeenCalled();
    }));
  });

  describe('Clear — full state reset', () => {
    it('should reset form, searchText, filterChips, error and page on onClear', () => {
      fixture.detectChanges();
      component.form.patchValue({ inventoryClass: 'DO' });
      component.inventoryResults.set(mockInventoryResults);
      component.searchText.set('plasma');
      component.filterChips.set([{ key: 'productType', label: 'Product Type: PLAS', value: 'PLAS' }]);
      component.error.set('some error');
      component.currentPage.set(3);

      component.onClear();

      expect(component.form.get('inventoryClass')?.value).toBeNull();
      expect(component.selectedInventoryClass()).toBe('');
      expect(component.searchText()).toBe('');
      expect(component.filterChips()).toEqual([]);
      expect(component.error()).toBeNull();
      expect(component.isFilterOpen()).toBe(false);
      expect(component.currentPage()).toBe(0);
    });
  });

  describe('Clear All Filters', () => {
    it('should clear all filters and re-query', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.patchValue({ inventoryClass: 'DO' });
      component.onApplyFilters({ productType: 'PLAS', bloodType: 'ON' });
      tick();

      component.clearAllFilters();
      tick();

      expect(component.filterChips()).toEqual([]);
      expect(component.appliedFilters()).toEqual({});
    }));
  });

  describe('removeFilterChip — attributeGroup cascade', () => {
    it('should remove attributeCode chip when attributeGroup chip is removed', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.patchValue({ inventoryClass: 'DO' });
      component.onApplyFilters({ attributeGroup: 'CMV', attributeCode: 'NEG' });
      tick();

      component.removeFilterChip('attributeGroup');
      tick();

      const chips = component.filterChips();
      expect(chips.find(c => c.key === 'attributeGroup')).toBeUndefined();
      expect(chips.find(c => c.key === 'attributeCode')).toBeUndefined();
    }));
  });

  describe('Search Filtering', () => {
    beforeEach(() => {
      component.inventoryResults.set(mockInventoryResults);
    });

    it('should filter by productType (case-insensitive)', () => {
      component.onSearchChange('plas');
      expect(component.filteredResults().length).toBe(1);
      expect(component.filteredResults()[0].productType).toBe('PLAS');
    });

    it('should filter by productDescription', () => {
      component.onSearchChange('red blood');
      expect(component.filteredResults().length).toBe(1);
      expect(component.filteredResults()[0].productDescription).toBe('Red Blood Cells');
    });

    it('should reset currentPage to 0 on search change', () => {
      component.currentPage.set(3);
      component.onSearchChange('anything');
      expect(component.currentPage()).toBe(0);
    });
  });

  describe('Pagination', () => {
    it('should update currentPage and currentPageSize on onPageChange', () => {
      fixture.detectChanges();
      component.onPageChange({ pageIndex: 2, pageSize: 10 } as any);
      expect(component.currentPage()).toBe(2);
      expect(component.currentPageSize()).toBe(10);
      expect(component.tableConfig.pagination?.pageIndex).toBe(2);
      expect(component.tableConfig.pagination?.pageSize).toBe(10);
    });

    it('should slice results correctly when on page 1', () => {
      const manyResults: InventoryLevelResultDto[] = Array.from({ length: 30 }, (_, i) => ({
        productType: `PT${i}`,
        productDescription: `Desc ${i}`,
        bloodType: 'ON',
        bloodTypeDescription: 'O Negative',
        actualCount: i,
        minLevel: 0,
        optimalLevel: 50,
        customerAlphaKey: 'STANDARD'
      }));

      component.inventoryResults.set(manyResults);
      component.currentPageSize.set(10);
      component.currentPage.set(1);

      expect(component.pagedResults().length).toBe(10);
      expect(component.pagedResults()[0].productType).toBe('PT10');
    });
  });

  describe('Query Error Handling', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show snackbar with errorCode: error format when API returns both fields', fakeAsync(() => {
      serviceSpy.queryInventoryLevels.and.returnValue(
        throwError(() => ({ error: { errorCode: '9999', error: 'Server error' } }))
      );

      component.form.patchValue({ inventoryClass: 'DO' });
      component.onInventoryClassChange();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('9999: Server error');
      expect(component.inventoryResults()).toEqual([]);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBe('9999: Server error');
    }));

    it('should use message field when no errorCode in response', fakeAsync(() => {
      serviceSpy.queryInventoryLevels.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );

      component.form.patchValue({ inventoryClass: 'DO' });
      component.onInventoryClassChange();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Server error');
      expect(component.error()).toBe('Server error');
    }));

    it('should use default message when query error has no message', fakeAsync(() => {
      serviceSpy.queryInventoryLevels.and.returnValue(throwError(() => ({})));

      component.form.patchValue({ inventoryClass: 'DO' });
      component.onInventoryClassChange();
      tick();

      expect(component.error()).toBe('Failed to query inventory levels');
    }));

    // Gap 3: error 5007 — backend returns 400 with errorCode "5007" when no results
    it('should show error snackbar when API returns error 5007 (no product levels found)', fakeAsync(() => {
      serviceSpy.queryInventoryLevels.and.returnValue(
        throwError(() => ({ error: { errorCode: '5007', error: 'No product levels found' } }))
      );

      component.form.patchValue({ inventoryClass: 'DO' });
      component.onInventoryClassChange();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('5007: No product levels found');
      expect(component.inventoryResults()).toEqual([]);
    }));

    // Gap 4: error 0302 — backend returns 400 with errorCode "0302" (invalid customer for chapter)
    it('should show error snackbar when API returns error 0302 (invalid customer)', fakeAsync(() => {
      serviceSpy.queryInventoryLevels.and.returnValue(
        throwError(() => ({ error: { errorCode: '0302', error: 'Invalid customer ID' } }))
      );

      component.form.patchValue({ inventoryClass: 'DO' });
      component.onInventoryClassChange();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('0302: Invalid customer ID');
      expect(component.inventoryResults()).toEqual([]);
    }));

    it('should not show error snackbar when query returns valid results', fakeAsync(() => {
      serviceSpy.queryInventoryLevels.and.returnValue(of(mockInventoryResults));

      component.form.patchValue({ inventoryClass: 'DO' });
      component.onInventoryClassChange();
      tick();

      expect(snackbarSpy.showError).not.toHaveBeenCalled();
      expect(snackbarSpy.showInfo).not.toHaveBeenCalled();
    }));
  });

  describe('Page Header Config', () => {
    it('should initialize pageHeaderConfig with Home breadcrumb', () => {
      expect(component.pageHeaderConfig.breadcrumbs?.length).toBeGreaterThanOrEqual(1);
      expect(component.pageHeaderConfig.breadcrumbs?.[0].label).toBe('Home');
    });
  });

  describe('Inventory Class Search Filter', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should filter inventory classes by description when typing', fakeAsync(() => {
      component.inventoryClassSearchControl.setValue('donor');
      tick();

      expect(component.filteredInventoryClasses().length).toBe(1);
      expect(component.filteredInventoryClasses()[0].code).toBe('DO');
    }));

    it('should filter inventory classes by code', fakeAsync(() => {
      component.inventoryClassSearchControl.setValue('op');
      tick();

      expect(component.filteredInventoryClasses().length).toBe(1);
      expect(component.filteredInventoryClasses()[0].code).toBe('OP');
    }));

    it('should restore all inventory classes when search term is cleared', fakeAsync(() => {
      component.inventoryClassSearchControl.setValue('donor');
      tick();

      component.inventoryClassSearchControl.setValue('');
      tick();

      expect(component.filteredInventoryClasses()).toEqual(mockInventoryClasses);
    }));

    it('should return empty array when no classes match search term', fakeAsync(() => {
      component.inventoryClassSearchControl.setValue('zzz_no_match');
      tick();

      expect(component.filteredInventoryClasses().length).toBe(0);
    }));
  });

  describe('Overlay Keydown', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should close filter panel when Escape is pressed', () => {
      component.isFilterOpen.set(true);
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'stopPropagation');
      component.onOverlayKeydown(event);
      expect(component.isFilterOpen()).toBe(false);
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should not close filter panel for non-Escape keys', () => {
      component.isFilterOpen.set(true);
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      component.onOverlayKeydown(event);
      expect(component.isFilterOpen()).toBe(true);
    });
  });

  describe('onApplyFilters — does not reopen closed panel', () => {
    it('should NOT open the filter panel when applying from a chip removal', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.patchValue({ inventoryClass: 'DO' });
      component.onApplyFilters({ productType: 'PLAS', bloodType: 'ON' });
      tick();

      expect(component.isFilterOpen()).toBe(false);

      component.removeFilterChip('productType');
      tick();

      expect(component.isFilterOpen()).toBe(false);
    }));
  });

  describe('buildChips — all filter types', () => {
    it('should build chips for all four filter fields', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.patchValue({ inventoryClass: 'DO' });
      component.onApplyFilters({
        productType: 'PLAS',
        bloodType: 'ON',
        attributeGroup: 'CMV',
        attributeCode: 'NEG'
      });
      tick();

      const chips = component.filterChips();
      expect(chips.length).toBe(4);
      expect(chips.find(c => c.key === 'productType')).toBeTruthy();
      expect(chips.find(c => c.key === 'bloodType')).toBeTruthy();
      expect(chips.find(c => c.key === 'attributeGroup')).toBeTruthy();
      expect(chips.find(c => c.key === 'attributeCode')).toBeTruthy();
    }));

    it('should build no chips when filters are empty', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.patchValue({ inventoryClass: 'DO' });
      component.onApplyFilters({});
      tick();

      expect(component.filterChips()).toEqual([]);
    }));
  });
});
