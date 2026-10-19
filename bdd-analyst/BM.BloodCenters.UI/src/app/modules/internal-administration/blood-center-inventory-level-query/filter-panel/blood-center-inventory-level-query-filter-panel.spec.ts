import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { BloodCenterInventoryLevelQueryFilterPanel } from './blood-center-inventory-level-query-filter-panel';
import { BloodCenterInventoryLevelQueryService } from '../services/blood-center-inventory-level-query.service';
import {
  ProductTypeDto,
  BloodTypeDto,
  AttributeGroupDto,
  AttributeCodeDto
} from '../interfaces/inventory-level.interface';

describe('BloodCenterInventoryLevelQueryFilterPanel', () => {
  let component: BloodCenterInventoryLevelQueryFilterPanel;
  let fixture: ComponentFixture<BloodCenterInventoryLevelQueryFilterPanel>;
  let serviceSpy: jasmine.SpyObj<BloodCenterInventoryLevelQueryService>;

  const mockProductTypes: ProductTypeDto[] = [
    { code: 'PLAS', description: 'Plasma' },
    { code: 'PRBC', description: 'Red Blood Cells' }
  ];

  const mockBloodTypes: BloodTypeDto[] = [
    { code: 'ON', description: 'O Negative' },
    { code: 'OP', description: 'O Positive' }
  ];

  const mockAttributeGroups: AttributeGroupDto[] = [
    { code: 'CMV' },
    { code: 'IRRAD' }
  ];

  const mockAttributeCodes: AttributeCodeDto[] = [
    { code: 'NEG', description: 'Negative' },
    { code: 'POS', description: 'Positive' }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('BloodCenterInventoryLevelQueryService', [
      'getProductTypes',
      'getBloodTypes',
      'getAttributeGroups',
      'getAttributeCodes'
    ]);

    serviceSpy.getProductTypes.and.returnValue(of(mockProductTypes));
    serviceSpy.getBloodTypes.and.returnValue(of(mockBloodTypes));
    serviceSpy.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
    serviceSpy.getAttributeCodes.and.returnValue(of(mockAttributeCodes));



      TestBed.configureTestingModule({
      imports: [BloodCenterInventoryLevelQueryFilterPanel, NoopAnimationsModule],
      providers: [
        { provide: BloodCenterInventoryLevelQueryService, useValue: serviceSpy }
      ]
    });


    


      serviceSpy.getProductTypes.calls.reset();


      serviceSpy.getBloodTypes.calls.reset();


      serviceSpy.getAttributeGroups.calls.reset();


      serviceSpy.getAttributeCodes.calls.reset();


      serviceSpy.getProductTypes.and.returnValue(of(mockProductTypes));


      serviceSpy.getBloodTypes.and.returnValue(of(mockBloodTypes));


      serviceSpy.getAttributeGroups.and.returnValue(of(mockAttributeGroups));


      serviceSpy.getAttributeCodes.and.returnValue(of(mockAttributeCodes));


    fixture = TestBed.createComponent(BloodCenterInventoryLevelQueryFilterPanel);
    component = fixture.componentInstance;


    });
  describe('Filter Options Loading', () => {
    it('should load product types', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.productTypes()).toEqual(mockProductTypes);
    }));

    it('should load blood types', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.bloodTypes()).toEqual(mockBloodTypes);
    }));

    it('should load attribute groups', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.attributeGroups()).toEqual(mockAttributeGroups);
    }));

    it('should handle blood types load error gracefully', fakeAsync(() => {
      serviceSpy.getBloodTypes.and.returnValue(throwError(() => new Error('Network error')));
      fixture.detectChanges();
      tick();
      expect(component.bloodTypes()).toEqual([]);
    }));

    it('should handle attribute groups load error gracefully', fakeAsync(() => {
      serviceSpy.getAttributeGroups.and.returnValue(throwError(() => new Error('Network error')));
      fixture.detectChanges();
      tick();
      expect(component.attributeGroups()).toEqual([]);
    }));
  });

  describe('Initialization with currentFilters', () => {
    it('should load attribute codes when currentFilters has attributeGroup', fakeAsync(() => {
      component.currentFilters = { productType: 'PLAS', attributeGroup: 'CMV', attributeCode: 'NEG' };
      fixture.detectChanges();
      tick();

      expect(serviceSpy.getAttributeCodes).toHaveBeenCalledWith('CMV');
      expect(component.attributeCodes()).toEqual(mockAttributeCodes);
    }));

    it('should pre-populate form fields from currentFilters', fakeAsync(() => {
      component.currentFilters = { productType: 'PLAS', bloodType: 'ON' };
      fixture.detectChanges();
      tick();

      expect(component.filterForm.get('productType')?.value).toBe('PLAS');
      expect(component.filterForm.get('bloodType')?.value).toBe('ON');
    }));

    it('should not load attribute codes when currentFilters has no attributeGroup', fakeAsync(() => {
      component.currentFilters = { productType: 'PLAS' };
      fixture.detectChanges();
      tick();

      expect(serviceSpy.getAttributeCodes).not.toHaveBeenCalled();
    }));

    it('should initialize form with null values when currentFilters is empty object', fakeAsync(() => {
      component.currentFilters = {};
      fixture.detectChanges();
      tick();

      expect(component.filterForm.get('productType')?.value).toBeNull();
      expect(component.filterForm.get('bloodType')?.value).toBeNull();
      expect(component.filterForm.get('attributeGroup')?.value).toBeNull();
      expect(component.filterForm.get('attributeCode')?.value).toBeNull();
    }));

    it('should initialize form with null when currentFilters is null', fakeAsync(() => {
      component.currentFilters = null;
      fixture.detectChanges();
      tick();

      expect(component.filterForm.get('productType')?.value).toBeNull();
      expect(component.filterForm.get('attributeCode')?.value).toBeNull();
    }));
  });

  describe('Attribute Group Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should load attribute codes when attribute group is selected', fakeAsync(() => {
      component.filterForm.patchValue({ attributeGroup: 'CMV' });
      tick();

      expect(serviceSpy.getAttributeCodes).toHaveBeenCalledWith('CMV');
      expect(component.attributeCodes()).toEqual(mockAttributeCodes);
    }));

    it('should clear attribute code when attribute group changes', fakeAsync(() => {
      component.filterForm.patchValue({ attributeGroup: 'CMV' });
      tick();

      component.filterForm.patchValue({ attributeGroup: 'IRRAD' });
      tick();

      expect(component.filterForm.get('attributeCode')?.value).toBeNull();
    }));

    it('should clear attribute codes when attribute group is deselected', fakeAsync(() => {
      component.filterForm.patchValue({ attributeGroup: 'CMV' });
      tick();

      component.filterForm.patchValue({ attributeGroup: null });
      tick();

      expect(component.attributeCodes()).toEqual([]);
    }));

    it('should clear selectedAttributeCodeDesc when attribute group changes', fakeAsync(() => {
      component.filterForm.patchValue({ attributeGroup: 'CMV' });
      tick();
      component.selectedAttributeCodeDesc.set('Negative');

      component.filterForm.patchValue({ attributeGroup: 'IRRAD' });
      tick();

      expect(component.selectedAttributeCodeDesc()).toBe('');
    }));
  });

  // Gap 1: blood types reload when product type changes
  describe('Blood Type Cascade (Gap 1)', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      serviceSpy.getBloodTypes.calls.reset();
      serviceSpy.getBloodTypes.and.returnValue(of(mockBloodTypes));
    }));

    it('should reload blood types when product type changes', fakeAsync(() => {
      component.filterForm.patchValue({ productType: 'PLAS' });
      tick();

      expect(serviceSpy.getBloodTypes).toHaveBeenCalledWith('MI', 'PLAS');
      expect(component.bloodTypes()).toEqual(mockBloodTypes);
    }));

    it('should reload all blood types when product type is cleared', fakeAsync(() => {
      component.filterForm.patchValue({ productType: 'PLAS' });
      tick();
      serviceSpy.getBloodTypes.calls.reset();
      serviceSpy.getBloodTypes.and.returnValue(of(mockBloodTypes));

      component.filterForm.patchValue({ productType: null });
      tick();

      expect(serviceSpy.getBloodTypes).toHaveBeenCalledWith('MI', undefined);
    }));

    it('should reset blood type selection when product type changes', fakeAsync(() => {
      component.filterForm.patchValue({ bloodType: 'ON' });
      tick();

      component.filterForm.patchValue({ productType: 'PLAS' });
      tick();

      expect(component.filterForm.get('bloodType')?.value).toBeNull();
    }));

    it('should load blood types filtered by currentFilters productType on init', fakeAsync(() => {
      serviceSpy.getBloodTypes.calls.reset();
      serviceSpy.getBloodTypes.and.returnValue(of(mockBloodTypes));
      component.currentFilters = { productType: 'PRBC' };
      component.ngOnInit();
      tick();

      expect(serviceSpy.getBloodTypes).toHaveBeenCalledWith('MI', 'PRBC');
    }));
  });

  // Gap 2: auto-apply when attribute code is selected
  describe('Auto-Apply on Attribute Code (Gap 2)', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({ attributeGroup: 'CMV' });
      tick();
    }));

    it('should NOT auto-emit apply when attribute code is selected (WCAG 3.2.2)', fakeAsync(() => {
      let emitted: any;
      component.apply.subscribe(f => (emitted = f));

      component.filterForm.get('attributeCode')?.enable({ emitEvent: false });
      component.filterForm.patchValue({ attributeCode: 'NEG' });
      tick();

      // Auto-apply removed for WCAG 3.2.2: user must click APPLY explicitly
      expect(emitted).toBeUndefined();
    }));

    it('should not auto-emit apply when attribute code is cleared', fakeAsync(() => {
      let emitCount = 0;
      component.apply.subscribe(() => emitCount++);

      component.filterForm.get('attributeCode')?.setValue(null);
      tick();

      expect(emitCount).toBe(0);
    }));
  });

  // Gap 5: description hints shown for selected values
  describe('Description Hints (Gap 5)', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set selectedProductTypeDesc when product type is selected', fakeAsync(() => {
      serviceSpy.getBloodTypes.and.returnValue(of(mockBloodTypes));
      component.filterForm.patchValue({ productType: 'PLAS' });
      tick();

      expect(component.selectedProductTypeDesc()).toBe('Plasma');
    }));

    it('should clear selectedProductTypeDesc when product type is cleared', fakeAsync(() => {
      serviceSpy.getBloodTypes.and.returnValue(of(mockBloodTypes));
      component.filterForm.patchValue({ productType: 'PLAS' });
      tick();
      component.filterForm.patchValue({ productType: null });
      tick();

      expect(component.selectedProductTypeDesc()).toBe('');
    }));

    it('should set selectedBloodTypeDesc when blood type is selected', fakeAsync(() => {
      component.filterForm.patchValue({ bloodType: 'ON' });
      tick();

      expect(component.selectedBloodTypeDesc()).toBe('O Negative');
    }));

    it('should set selectedAttributeCodeDesc when attribute code is selected', fakeAsync(() => {
      component.filterForm.patchValue({ attributeGroup: 'CMV' });
      tick();
      component.filterForm.get('attributeCode')?.enable({ emitEvent: false });
      component.filterForm.get('attributeCode')?.setValue('NEG');
      tick();

      expect(component.selectedAttributeCodeDesc()).toBe('Negative');
    }));

    it('should clear all descriptions on onClear', fakeAsync(() => {
      serviceSpy.getBloodTypes.and.returnValue(of(mockBloodTypes));
      component.selectedProductTypeDesc.set('Plasma');
      component.selectedBloodTypeDesc.set('O Negative');
      component.selectedAttributeCodeDesc.set('Negative');

      component.onClear();
      tick();

      expect(component.selectedProductTypeDesc()).toBe('');
      expect(component.selectedBloodTypeDesc()).toBe('');
      expect(component.selectedAttributeCodeDesc()).toBe('');
    }));
  });



  describe('Clear Filters', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({
        productType: 'PLAS',
        bloodType: 'ON',
        attributeGroup: 'CMV'
      });
    }));



    it('should clear attribute codes on clear', () => {
      component.onClear();

      expect(component.attributeCodes()).toEqual([]);
    });

    it('should reset all form fields on clear', () => {
      component.onClear();

      expect(component.filterForm.get('productType')?.value).toBeNull();
      expect(component.filterForm.get('bloodType')?.value).toBeNull();
      expect(component.filterForm.get('attributeGroup')?.value).toBeNull();
    });
  });

  describe('Apply and Close', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should emit filters on onApply', () => {
      component.filterForm.patchValue({ productType: 'PLAS', bloodType: 'ON' });

      let emitted: any;
      component.apply.subscribe(f => (emitted = f));
      component.onApply();

      expect(emitted).toEqual(jasmine.objectContaining({ productType: 'PLAS', bloodType: 'ON' }));
    });

    it('should emit null for empty fields on onApply', () => {
      let emitted: any;
      component.apply.subscribe(f => (emitted = f));
      component.onApply();

      expect(emitted.productType).toBeNull();
      expect(emitted.bloodType).toBeNull();
      expect(emitted.attributeGroup).toBeNull();
      expect(emitted.attributeCode).toBeNull();
    });

    it('should emit close event on onClose', () => {
      let closed = false;
      component.close.subscribe(() => (closed = true));
      component.onClose();

      expect(closed).toBe(true);
    });
  });

  describe('Attribute Code Disabled State', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should be disabled when no attributeGroup is selected', () => {
      expect(component.isAttributeCodeDisabled).toBe(true);
    });

    it('should be enabled when attributeGroup is selected', fakeAsync(() => {
      component.filterForm.patchValue({ attributeGroup: 'CMV' });
      tick();

      expect(component.isAttributeCodeDisabled).toBe(false);
    }));

    it('should be disabled again after attributeGroup is cleared', fakeAsync(() => {
      component.filterForm.patchValue({ attributeGroup: 'CMV' });
      tick();

      component.filterForm.patchValue({ attributeGroup: null });
      tick();

      expect(component.isAttributeCodeDisabled).toBe(true);
    }));
  });

  describe('Filter Panel Lifecycle', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      fixture.detectChanges();
      const nextSpy = spyOn((component as any).destroy$, 'next').and.callThrough();
      const completeSpy = spyOn((component as any).destroy$, 'complete').and.callThrough();
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Select Opened Change', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should clear search control value when select panel closes', () => {
      component.productTypeSearchCtrl.setValue('plas');
      component.onSelectOpenedChange(component.productTypeSearchCtrl, false);
      expect(component.productTypeSearchCtrl.value).toBe('');
    });

    it('should not clear search control when select panel opens', () => {
      component.productTypeSearchCtrl.setValue('plas');
      component.onSelectOpenedChange(component.productTypeSearchCtrl, true);
      expect(component.productTypeSearchCtrl.value).toBe('plas');
    });
  });

  describe('Filtered Dropdown Lists', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return all product types when search is empty', () => {
      expect(component.filteredProductTypes()).toEqual(mockProductTypes);
    });

    it('should filter product types by partial description (case-insensitive)', fakeAsync(() => {
      component.productTypeSearchCtrl.setValue('plas');
      tick();

      expect(component.filteredProductTypes().length).toBe(1);
      expect(component.filteredProductTypes()[0].code).toBe('PLAS');
    }));

    it('should filter product types by code', fakeAsync(() => {
      component.productTypeSearchCtrl.setValue('PRBC');
      tick();

      expect(component.filteredProductTypes().length).toBe(1);
      expect(component.filteredProductTypes()[0].code).toBe('PRBC');
    }));

    it('should return empty list when no product types match', fakeAsync(() => {
      component.productTypeSearchCtrl.setValue('zzz_no_match');
      tick();

      expect(component.filteredProductTypes().length).toBe(0);
    }));

    it('should filter blood types by code search', fakeAsync(() => {
      component.bloodTypeSearchCtrl.setValue('on');
      tick();

      expect(component.filteredBloodTypes().length).toBe(1);
      expect(component.filteredBloodTypes()[0].code).toBe('ON');
    }));

    it('should return all blood types when blood type search is empty', () => {
      expect(component.filteredBloodTypes()).toEqual(mockBloodTypes);
    });

    it('should filter attribute groups by code', fakeAsync(() => {
      component.attributeGroupSearchCtrl.setValue('CMV');
      tick();

      expect(component.filteredAttributeGroups().length).toBe(1);
      expect(component.filteredAttributeGroups()[0].code).toBe('CMV');
    }));
  });

  describe('Error Handling', () => {
    it('should handle product types load error gracefully', fakeAsync(() => {
      serviceSpy.getProductTypes.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      fixture.detectChanges();
      tick();

      expect(component.productTypes()).toEqual([]);
    }));

    it('should handle attribute codes load error gracefully', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      serviceSpy.getAttributeCodes.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      component.filterForm.patchValue({ attributeGroup: 'CMV' });
      tick();

      expect(component.attributeCodes()).toEqual([]);
    }));
  });
});
