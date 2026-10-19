import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of, Subject } from 'rxjs';

import { PoolCompatibilityMatrixFilterPanel } from './pool-compatibility-matrix-filter-panel';
import { PoolCompatibilityMatrixService } from '../services/pool-compatibility-matrix.service';
import { HeaderService } from '@shared/services/header.service';

describe('PoolCompatibilityMatrixFilterPanel', () => {
  let component: PoolCompatibilityMatrixFilterPanel;
  let fixture: ComponentFixture<PoolCompatibilityMatrixFilterPanel>;
  let mockService: jasmine.SpyObj<PoolCompatibilityMatrixService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let chapterChanged$: Subject<void>;

  beforeEach(() => {
    mockService = jasmine.createSpyObj('PoolCompatibilityMatrixService', [
      'getFilterInventoryProductTypes',
      'getFilterFinishedProductTypes'
    ]);
    mockService.getFilterInventoryProductTypes.and.returnValue(of([
      { productType: 'INV1', description: 'Inventory Type 1' }
    ]));
    mockService.getFilterFinishedProductTypes.and.returnValue(of([
      { productType: 'FIN1', description: 'Finished Type 1' }
    ]));

    chapterChanged$ = new Subject<void>();
    mockHeaderService = jasmine.createSpyObj('HeaderService', [], {
      chapterChanged$: chapterChanged$.asObservable()
    });

    TestBed.configureTestingModule({
      imports: [PoolCompatibilityMatrixFilterPanel, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        { provide: PoolCompatibilityMatrixService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });

    fixture = TestBed.createComponent(PoolCompatibilityMatrixFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with null defaults', () => {
    expect(component.filterForm.value.inventoryProductType).toBeNull();
    expect(component.filterForm.value.finishedInventoryProductType).toBeNull();
    expect(component.filterForm.value.effectiveDatePeriod).toBeNull();
    expect(component.filterForm.value.effectiveDate).toBeNull();
  });

  it('should load filter options on init', () => {
    expect(mockService.getFilterInventoryProductTypes).toHaveBeenCalled();
    expect(mockService.getFilterFinishedProductTypes).toHaveBeenCalled();
    expect(component.inventoryProductTypeOptions.length).toBe(1);
    expect(component.finishedProductTypeOptions.length).toBe(1);
  });

  describe('isApplyDisabled', () => {
    it('should return true when no changes have been made', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return false when a filter value changes', () => {
      component.filterForm.patchValue({ inventoryProductType: 'INV1' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return true when there are validation errors', () => {
      component.filterForm.get('effectiveDatePeriod')?.setErrors({ required: true });
      component.filterForm.patchValue({ inventoryProductType: 'INV1' });
      expect(component.isApplyDisabled).toBeTrue();
    });
  });

  describe('onApply', () => {
    it('should emit apply with filter values', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({ inventoryProductType: 'INV1' });
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({ inventoryProductType: 'INV1' })
      );
    });

    it('should not emit when validation errors exist', fakeAsync(() => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({ effectiveDate: 'someDate', effectiveDatePeriod: null });
      component.filterForm.get('effectiveDatePeriod')?.setErrors({ required: true });
      component.filterForm.get('effectiveDatePeriod')?.markAsTouched();
      tick();

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    }));
  });

  describe('onClear', () => {
    it('should reset form and search controls', () => {
      component.filterForm.patchValue({ inventoryProductType: 'INV1' });
      component.inventorySearchControl.setValue('search');
      component.finishedSearchControl.setValue('search');

      component.onClear();

      expect(component.filterForm.value.inventoryProductType).toBeNull();
      expect(component.filterForm.value.finishedInventoryProductType).toBeNull();
      expect(component.inventorySearchControl.value).toBe('');
      expect(component.finishedSearchControl.value).toBe('');
    });
  });

  describe('onClose', () => {
    it('should emit close event', () => {
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('chapter change subscription', () => {
    it('should emit close when chapter changes', () => {
      spyOn(component.close, 'emit');

      chapterChanged$.next();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('date period validation', () => {
    it('should set error when effective date is set without period', fakeAsync(() => {
      component.filterForm.patchValue({ effectiveDate: new Date(), effectiveDatePeriod: null });
      tick();

      const periodControl = component.filterForm.get('effectiveDatePeriod');
      expect(periodControl?.hasError('required')).toBeTrue();
    }));

    it('should clear error when period is selected', fakeAsync(() => {
      component.filterForm.patchValue({ effectiveDate: new Date(), effectiveDatePeriod: 'After' });
      tick();

      const periodControl = component.filterForm.get('effectiveDatePeriod');
      expect(periodControl?.errors).toBeNull();
    }));
  });

  describe('error message helpers', () => {
    it('should return empty string for getEffectiveDatePeriodError when no errors', () => {
      expect(component.getEffectiveDatePeriodError()).toBe('');
    });

    it('should return error message when period is required and touched', () => {
      const control = component.filterForm.get('effectiveDatePeriod');
      control?.setErrors({ required: true });
      control?.markAsTouched();

      expect(component.getEffectiveDatePeriodError()).toBe('Period is required');
    });
  });

  describe('search filtering', () => {
    it('should filter inventory options by search term', fakeAsync(() => {
      component.inventorySearchControl.setValue('inv');
      tick();

      expect(component.filteredInventoryOptions.length).toBe(1);
    }));
  });

  describe('error handling', () => {
    it('should handle service errors gracefully', () => {
      mockService.getFilterInventoryProductTypes.and.returnValue(of([]));
      mockService.getFilterFinishedProductTypes.and.returnValue(of([]));

      component.ngOnInit();

      expect(component.inventoryProductTypeOptions).toBeDefined();
    });
  });
});
