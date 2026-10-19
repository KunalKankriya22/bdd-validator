import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { PagqSearchFormComponent } from './pagq-search-form.component';
import { ProductsWithAntigensService } from '../../services/products-with-antigens.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';
import {
  ProductTypeOption,
  AboRhTypeOption,
  InventoryClassOption,
  AntigenGroupOption,
  WarehouseOption,
  ValidAntigenOption,
  AntigenGroupDetail
} from '../../models/products-with-antigens.models';

describe('PagqSearchFormComponent', () => {
  let spy: any;
  let component: PagqSearchFormComponent;
  let fixture: ComponentFixture<PagqSearchFormComponent>;
  let serviceSpy: jasmine.SpyObj<ProductsWithAntigensService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const mockProductTypes: ProductTypeOption[] = [
    { productType: 'RBC', description: 'Red Blood Cells' },
    { productType: 'PLT', description: 'Platelets' }
  ];

  const mockAboRhTypes: AboRhTypeOption[] = [
    { aboCode: 'O+', aboDescription: 'O Positive' }
  ];

  const mockInventoryClasses: InventoryClassOption[] = [
    { code: 'I1', description: 'Class 1' }
  ];

  const mockAntigenGroups: AntigenGroupOption[] = [
    { code: 'RH', description: 'Rh Group', isRarityMatrix: false }
  ];

  const mockWarehouses: WarehouseOption[] = [
    { code: '1', description: 'Main Warehouse' }
  ];

  const mockValidAntigens: ValidAntigenOption[] = [
    { testId: 'D', testDescription: 'D Antigen', testGroup: 'RH' },
    { testId: 'K', testDescription: 'K Antigen', testGroup: 'KELL' }
  ];

  beforeEach(() => {
    spy = jasmine.createSpyObj('ProductsWithAntigensService', [
      'getProductTypes',
      'getAboRhTypes',
      'getInventoryClasses',
      'getAntigenGroups',
      'getWarehouses',
      'getValidAntigens',
      'getAntigenGroupDetail'
    ]);

    spy.getProductTypes.and.returnValue(of(mockProductTypes));
    spy.getAboRhTypes.and.returnValue(of(mockAboRhTypes));
    spy.getInventoryClasses.and.returnValue(of(mockInventoryClasses));
    spy.getAntigenGroups.and.returnValue(of(mockAntigenGroups));
    spy.getWarehouses.and.returnValue(of(mockWarehouses));
    spy.getValidAntigens.and.returnValue(of(mockValidAntigens));

    dialogSpy = createMockMatDialog();
    headerServiceSpy = createMockHeaderService({ warehouseId: signal('1') });

    TestBed.configureTestingModule({
      imports: [PagqSearchFormComponent, NoopAnimationsModule],
      providers: [
        { provide: ProductsWithAntigensService, useValue: spy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });

    spy.getProductTypes.calls.reset();
    spy.getAboRhTypes.calls.reset();
    spy.getInventoryClasses.calls.reset();
    spy.getAntigenGroups.calls.reset();
    spy.getWarehouses.calls.reset();
    spy.getValidAntigens.calls.reset();
    spy.getAntigenGroupDetail.calls.reset();
    spy.getProductTypes.and.returnValue(of(mockProductTypes));
    spy.getAboRhTypes.and.returnValue(of(mockAboRhTypes));
    spy.getInventoryClasses.and.returnValue(of(mockInventoryClasses));
    spy.getAntigenGroups.and.returnValue(of(mockAntigenGroups));
    spy.getWarehouses.and.returnValue(of(mockWarehouses));
    spy.getValidAntigens.and.returnValue(of(mockValidAntigens));

    serviceSpy = TestBed.inject(ProductsWithAntigensService) as jasmine.SpyObj<ProductsWithAntigensService>;
    fixture = TestBed.createComponent(PagqSearchFormComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should load all dropdown options on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(serviceSpy.getProductTypes).toHaveBeenCalled();
      expect(serviceSpy.getAboRhTypes).toHaveBeenCalled();
      expect(serviceSpy.getInventoryClasses).toHaveBeenCalled();
      expect(serviceSpy.getAntigenGroups).toHaveBeenCalled();
      expect(serviceSpy.getWarehouses).toHaveBeenCalled();
      expect(serviceSpy.getValidAntigens).toHaveBeenCalled();
    }));

    it('should populate dropdown signals with data', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component['productTypes']().length).toBe(2);
      expect(component['aboRhTypes']().length).toBe(1);
      expect(component['inventoryClasses']().length).toBe(1);
      expect(component['antigenGroups']().length).toBe(1);
      expect(component['warehouses']().length).toBe(1);
      expect(component['validAntigens']().length).toBe(2);
    }));

    it('should set loadingDropdowns to false after valid antigens load', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component['loadingDropdowns']()).toBeFalse();
    }));

    it('should handle error loading valid antigens and set loadingDropdowns false', fakeAsync(() => {
      spy.getValidAntigens.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      tick();

      expect(component['loadingDropdowns']()).toBeFalse();
    }));

    it('should auto-select current warehouse when it exists in options', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.searchForm.get('warehouseId')?.value).toBe('1');
    }));

    it('should not auto-select warehouse when current warehouse is not in options', fakeAsync(() => {
      headerServiceSpy.getCurrentWarehouseId.and.returnValue('NOTFOUND');
      fixture.detectChanges();
      tick();

      expect(component.searchForm.get('warehouseId')?.value).toBeNull();
    }));
  });

  describe('Dropdown Error Handling', () => {
    it('should handle error loading product types', fakeAsync(() => {
      spy.getProductTypes.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      tick();

      expect(component['productTypes']()).toEqual([]);
    }));

    it('should handle error loading ABO/Rh types', fakeAsync(() => {
      spy.getAboRhTypes.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      tick();

      expect(component['aboRhTypes']()).toEqual([]);
    }));

    it('should handle error loading inventory classes', fakeAsync(() => {
      spy.getInventoryClasses.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      tick();

      expect(component['inventoryClasses']()).toEqual([]);
    }));

    it('should handle error loading antigen groups', fakeAsync(() => {
      spy.getAntigenGroups.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      tick();

      expect(component['antigenGroups']()).toEqual([]);
    }));

    it('should handle error loading warehouses', fakeAsync(() => {
      spy.getWarehouses.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      tick();

      expect(component['warehouses']()).toEqual([]);
    }));
  });

  describe('Antigen Group Auto-Fill', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should auto-fill antigen criteria when antigen group is selected', fakeAsync(() => {
      const mockGroupDetail: AntigenGroupDetail = {
        groupCode: 'RH',
        groupDescription: 'Rh Group',
        antigens: [
          { antigenId: 'D', result: 'P' },
          { antigenId: 'C', result: 'N' }
        ]
      };

      serviceSpy.getAntigenGroupDetail.and.returnValue(of(mockGroupDetail));

      component.searchForm.patchValue({ antigenGroup: 'RH' });
      tick();

      expect(serviceSpy.getAntigenGroupDetail).toHaveBeenCalledWith('RH');
      expect(component['selectedAntigenCriteria']().length).toBe(2);
      expect(component['selectedAntigenCriteria']()[0].antigenId).toBe('D');
    }));

    it('should clear antigenRequiredError when group detail loads', fakeAsync(() => {
      const mockGroupDetail: AntigenGroupDetail = {
        groupCode: 'RH',
        groupDescription: 'Rh Group',
        antigens: [{ antigenId: 'D', result: 'P' }]
      };

      serviceSpy.getAntigenGroupDetail.and.returnValue(of(mockGroupDetail));
      component['antigenRequiredError'].set(true);

      component.searchForm.patchValue({ antigenGroup: 'RH' });
      tick();

      expect(component['antigenRequiredError']()).toBeFalse();
    }));

    it('should handle error when loading antigen group detail', fakeAsync(() => {
      serviceSpy.getAntigenGroupDetail.and.returnValue(throwError(() => new Error('Not found')));

      component.searchForm.patchValue({ antigenGroup: 'INVALID' });
      tick();

      expect(serviceSpy.getAntigenGroupDetail).toHaveBeenCalledWith('INVALID');
      expect(component['error']()).toBe('Failed to load antigen group details');
    }));

    it('should handle detail response with undefined antigens', fakeAsync(() => {
      const mockGroupDetail = {
        groupCode: 'ARD',
        groupDescription: 'ARD Group',
        antigens: undefined
      } as any;

      serviceSpy.getAntigenGroupDetail.and.returnValue(of(mockGroupDetail));

      component.searchForm.patchValue({ antigenGroup: 'ARD' });
      tick();

      expect(component['selectedAntigenCriteria']()).toEqual([]);
      expect(component['antigenRequiredError']()).toBeFalse();
    }));

    it('should not call getAntigenGroupDetail when group is cleared', fakeAsync(() => {
      component.searchForm.patchValue({ antigenGroup: null });
      tick();

      expect(serviceSpy.getAntigenGroupDetail).not.toHaveBeenCalled();
    }));
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require product type', () => {
      const productTypeControl = component.searchForm.get('productType');
      expect(productTypeControl?.hasError('required')).toBeTrue();

      productTypeControl?.setValue('RBC');
      expect(productTypeControl?.hasError('required')).toBeFalse();
    });

    it('should have maxLength 5 on productType', () => {
      const ctrl = component.searchForm.get('productType');
      ctrl?.setValue('ABCDEF');
      expect(ctrl?.hasError('maxlength')).toBeTrue();
    });

    it('should have maxLength 2 on inventoryClass', () => {
      const ctrl = component.searchForm.get('inventoryClass');
      ctrl?.setValue('ABC');
      expect(ctrl?.hasError('maxlength')).toBeTrue();
    });

    it('should have maxLength 1 on warehouseId', () => {
      const ctrl = component.searchForm.get('warehouseId');
      ctrl?.setValue('AB');
      expect(ctrl?.hasError('maxlength')).toBeTrue();
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not emit search when form is invalid', () => {
      const emitSpy = spyOn(component.search, 'emit');
      component.onSubmit();
      expect(emitSpy).not.toHaveBeenCalled();
      expect(component['submitted']()).toBeTrue();
    });

    it('should not emit search when no antigen criteria', () => {
      const emitSpy = spyOn(component.search, 'emit');
      component.searchForm.patchValue({ productType: 'RBC' });
      component.onSubmit();
      expect(emitSpy).not.toHaveBeenCalled();
      expect(component['antigenRequiredError']()).toBeTrue();
    });

    it('should emit search with valid form and antigen criteria', () => {
      const emitSpy = spyOn(component.search, 'emit');
      component.searchForm.patchValue({ productType: 'RBC' });
      component['selectedAntigenCriteria'].set([{ antigenId: 'D', result: 'P' }]);

      component.onSubmit();

      expect(emitSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          productType: 'RBC',
          antigenCriteria: [{ antigenId: 'D', result: 'P' }]
        })
      );
      expect(component['antigenRequiredError']()).toBeFalse();
    });

    it('should include optional fields in search request when set', () => {
      const emitSpy = spyOn(component.search, 'emit');
      component.searchForm.patchValue({
        productType: 'RBC',
        aboRh: 'O+',
        inventoryClass: 'I1',
        antigenGroup: 'RH',
        warehouseId: '1'
      });
      component['selectedAntigenCriteria'].set([{ antigenId: 'D', result: 'P' }]);

      component.onSubmit();

      expect(emitSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          productType: 'RBC',
          aboRh: 'O+',
          inventoryClass: 'I1',
          antigenGroup: 'RH',
          warehouseId: '1'
        })
      );
    });
  });

  describe('Clear', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form and criteria on clear', () => {
      const clearEmitSpy = spyOn(component.clear, 'emit');
      component.searchForm.patchValue({ productType: 'RBC' });
      component['selectedAntigenCriteria'].set([{ antigenId: 'D', result: 'P' }]);
      component['submitted'].set(true);

      component.onClear();

      expect(component.searchForm.get('productType')?.value).toBeNull();
      expect(component['selectedAntigenCriteria']()).toEqual([]);
      expect(component['submitted']()).toBeFalse();
      expect(clearEmitSpy).toHaveBeenCalled();
    });
  });

  describe('Remove Antigen Criteria', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should remove specified antigen from criteria', () => {
      component['selectedAntigenCriteria'].set([
        { antigenId: 'D', result: 'P' },
        { antigenId: 'K', result: 'N' }
      ]);

      component.removeAntigenCriteria('D');

      expect(component['selectedAntigenCriteria']().length).toBe(1);
      expect(component['selectedAntigenCriteria']()[0].antigenId).toBe('K');
    });

    it('should handle removing non-existent antigen', () => {
      component['selectedAntigenCriteria'].set([{ antigenId: 'D', result: 'P' }]);
      component.removeAntigenCriteria('NONEXISTENT');
      expect(component['selectedAntigenCriteria']().length).toBe(1);
    });
  });

  describe('Antigen Filter Dialog', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open antigen filter dialog', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
      dialogRefSpy.afterClosed.and.returnValue(of(undefined));
      (component as any).dialog = { open: jasmine.createSpy('open').and.returnValue(dialogRefSpy) };

      component.openAntigenFilterDialog();
      expect((component as any).dialog.open).toHaveBeenCalled();
    });

    it('should set criteria from dialog result and auto-submit', fakeAsync(() => {
      const mockResult = { criteria: [{ antigenId: 'D', result: 'P' as const }] };
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
      dialogRefSpy.afterClosed.and.returnValue(of(mockResult));
      (component as any).dialog = { open: jasmine.createSpy('open').and.returnValue(dialogRefSpy) };

      component.searchForm.patchValue({ productType: 'RBC' });
      const emitSpy = spyOn(component.search, 'emit');

      component.openAntigenFilterDialog();
      tick();

      expect(component['selectedAntigenCriteria']()).toEqual(mockResult.criteria);
      expect(component['antigenRequiredError']()).toBeFalse();
      expect(emitSpy).toHaveBeenCalled();
    }));

    it('should not update criteria when dialog is cancelled', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
      dialogRefSpy.afterClosed.and.returnValue(of(undefined));
      (component as any).dialog = { open: jasmine.createSpy('open').and.returnValue(dialogRefSpy) };

      component['selectedAntigenCriteria'].set([{ antigenId: 'D', result: 'P' }]);

      component.openAntigenFilterDialog();
      tick();

      expect(component['selectedAntigenCriteria']().length).toBe(1);
    }));
  });

  describe('Search Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter product types by type code', () => {
      component['productTypeSearchCtrl'].setValue('RBC');
      const filtered = component['filteredProductTypes']();
      expect(filtered.length).toBe(1);
      expect(filtered[0].productType).toBe('RBC');
    });

    it('should filter product types by description', () => {
      component['productTypeSearchCtrl'].setValue('Plate');
      const filtered = component['filteredProductTypes']();
      expect(filtered.length).toBe(1);
      expect(filtered[0].productType).toBe('PLT');
    });

    it('should return all product types when no search text', () => {
      expect(component['filteredProductTypes']().length).toBe(2);
    });

    it('should filter ABO/Rh types by description', () => {
      component['aboRhSearchCtrl'].setValue('Pos');
      const filtered = component['filteredAboRhTypes']();
      expect(filtered.length).toBe(1);
    });

    it('should return all ABO/Rh types when no search text', () => {
      expect(component['filteredAboRhTypes']().length).toBe(1);
    });

    it('should filter inventory classes by code', () => {
      component['inventoryClassSearchCtrl'].setValue('I1');
      const filtered = component['filteredInventoryClasses']();
      expect(filtered.length).toBe(1);
    });

    it('should filter antigen groups by code', () => {
      component['antigenGroupSearchCtrl'].setValue('RH');
      const filtered = component['filteredAntigenGroups']();
      expect(filtered.length).toBe(1);
    });

    it('should filter warehouses by description', () => {
      component['warehouseSearchCtrl'].setValue('Main');
      const filtered = component['filteredWarehouses']();
      expect(filtered.length).toBe(1);
    });

    it('should return empty when no match for product types', () => {
      component['productTypeSearchCtrl'].setValue('ZZZZZ');
      expect(component['filteredProductTypes']().length).toBe(0);
    });
  });

  describe('Form Controls Getter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return form controls', () => {
      const controls = component.f;
      expect(controls['productType']).toBeDefined();
      expect(controls['aboRh']).toBeDefined();
      expect(controls['inventoryClass']).toBeDefined();
      expect(controls['antigenGroup']).toBeDefined();
      expect(controls['warehouseId']).toBeDefined();
    });
  });

  describe('Element ID Generators', () => {
    it('should generate element IDs', () => {
      const id = component['elementId']('test');
      expect(id).toContain('pagq-search-form-');
      expect(id).toContain('-test');
    });

    it('should generate error IDs', () => {
      const id = component['errorId']('field');
      expect(id).toContain('pagq-search-form-');
      expect(id).toContain('-field-error');
    });
  });

  describe('Lifecycle', () => {
    it('should clean up on destroy', () => {
      fixture.detectChanges();
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
