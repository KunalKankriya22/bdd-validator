import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DateAdapter } from '@angular/material/core';
import { TerritoryFilterPanel } from './territory-filter-panel';
import { TerritoryFilterValue } from '../models/territory.model';

describe('TerritoryFilterPanel', () => {
  let component: TerritoryFilterPanel;
  let fixture: ComponentFixture<TerritoryFilterPanel>;

  const mockGroups = [
    { code: 'CCOLL', description: 'Collection' },
    { code: 'GENER', description: 'General' }
  ];

  const mockTypes = [
    { code: 'TRTMR', description: 'Territory' },
    { code: 'RGION', description: 'Region' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TerritoryFilterPanel, NoopAnimationsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(TerritoryFilterPanel);
    component = fixture.componentInstance;
    component.groups = [...mockGroups];
    component.types = [...mockTypes];
    fixture.detectChanges();
  });

  describe('Initialization', () => {
    it('should initialize form with defaults', () => {
      expect(component.filterForm.get('showTerminated')?.value).toBeFalse();
      expect(component.filterForm.get('territoryGroup')?.value).toBeNull();
      expect(component.filterForm.get('territoryType')?.value).toBeNull();
      expect(component.filterForm.get('effDatePeriod')?.value).toBeNull();
    });

    it('should initialize with current filters if provided', () => {
      component.currentFilters = {
        showTerminated: false,
        territoryGroup: 'CCOLL',
        territoryType: null,
        effDatePeriod: 'Before',
        effDate: null,
        termDatePeriod: 'After',
        termDate: null
      };
      component.ngOnInit();
      expect(component.filterForm.get('showTerminated')?.value).toBeFalse();
      expect(component.filterForm.get('territoryGroup')?.value).toBe('CCOLL');
      expect(component.filterForm.get('effDatePeriod')?.value).toBe('Before');
    });

    it('should initialize filteredGroups with all groups', () => {
      expect(component.filteredGroups).toEqual(mockGroups);
    });

    it('should initialize filteredTypes with all types', () => {
      expect(component.filteredTypes).toEqual(mockTypes);
    });

    it('should set hasActiveFilters to false when no filters are set', () => {
      expect(component.hasActiveFilters).toBe(false);
    });

    it('should set hasActiveFilters to true when currentFilters are provided', () => {
      component.currentFilters = {
        showTerminated: true,
        territoryGroup: null,
        territoryType: null,
        effDatePeriod: null,
        effDate: null,
        termDatePeriod: null,
        termDate: null
      };
      component.ngOnInit();
      expect(component.hasActiveFilters).toBe(true);
    });

    it('should set hasChanges to false initially', () => {
      expect(component.hasChanges).toBe(false);
    });
  });

  describe('Form Value Changes', () => {
    it('should set hasChanges to true when form value changes', () => {
      component.filterForm.patchValue({ territoryGroup: 'CCOLL' });
      expect(component.hasChanges).toBe(true);
    });

    it('should set hasChanges back to false when form returns to original value', () => {
      component.filterForm.patchValue({ territoryGroup: 'CCOLL' });
      expect(component.hasChanges).toBe(true);

      component.filterForm.patchValue({ territoryGroup: null });
      expect(component.hasChanges).toBe(false);
    });

    it('should set hasActiveFilters to true when a filter is set', () => {
      component.filterForm.patchValue({ territoryGroup: 'CCOLL' });
      expect(component.hasActiveFilters).toBe(true);
    });

    it('should set hasActiveFilters true when showTerminated is true', () => {
      component.filterForm.patchValue({ showTerminated: true });
      expect(component.hasActiveFilters).toBe(true);
    });

    it('should set hasActiveFilters true when territoryType is set', () => {
      component.filterForm.patchValue({ territoryType: 'TRTMR' });
      expect(component.hasActiveFilters).toBe(true);
    });

    it('should set hasActiveFilters true when effDatePeriod is set', () => {
      component.filterForm.patchValue({ effDatePeriod: 'after' });
      expect(component.hasActiveFilters).toBe(true);
    });

    it('should set hasActiveFilters true when effDate is set', () => {
      component.filterForm.patchValue({ effDate: new Date() });
      expect(component.hasActiveFilters).toBe(true);
    });

    it('should set hasActiveFilters true when termDatePeriod is set', () => {
      component.filterForm.patchValue({ termDatePeriod: 'before' });
      expect(component.hasActiveFilters).toBe(true);
    });

    it('should set hasActiveFilters true when termDate is set', () => {
      component.filterForm.patchValue({ termDate: new Date() });
      expect(component.hasActiveFilters).toBe(true);
    });
  });

  describe('Search Controls', () => {
    it('should filter groups based on code search', () => {
      component.groupSearchControl.setValue('CCOLL');
      expect(component.filteredGroups.length).toBe(1);
      expect(component.filteredGroups[0].code).toBe('CCOLL');
    });

    it('should filter groups based on description search', () => {
      component.groupSearchControl.setValue('collection');
      expect(component.filteredGroups.length).toBe(1);
      expect(component.filteredGroups[0].description).toBe('Collection');
    });

    it('should show all groups when search is empty', () => {
      component.groupSearchControl.setValue('CCOLL');
      expect(component.filteredGroups.length).toBe(1);

      component.groupSearchControl.setValue('');
      expect(component.filteredGroups.length).toBe(2);
    });

    it('should show no groups when search has no match', () => {
      component.groupSearchControl.setValue('ZZZZZ');
      expect(component.filteredGroups.length).toBe(0);
    });

    it('should filter types based on code search', () => {
      component.typeSearchControl.setValue('TRTMR');
      expect(component.filteredTypes.length).toBe(1);
      expect(component.filteredTypes[0].code).toBe('TRTMR');
    });

    it('should filter types based on description search', () => {
      component.typeSearchControl.setValue('region');
      expect(component.filteredTypes.length).toBe(1);
      expect(component.filteredTypes[0].description).toBe('Region');
    });

    it('should show all types when search is empty', () => {
      component.typeSearchControl.setValue('TRTMR');
      expect(component.filteredTypes.length).toBe(1);

      component.typeSearchControl.setValue('');
      expect(component.filteredTypes.length).toBe(2);
    });

    it('should handle null search value for groups', () => {
      component.groupSearchControl.setValue(null);
      expect(component.filteredGroups.length).toBe(2);
    });

    it('should handle null search value for types', () => {
      component.typeSearchControl.setValue(null);
      expect(component.filteredTypes.length).toBe(2);
    });
  });

  describe('Apply Filters', () => {
    it('should emit apply event with filter values on apply', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({ territoryGroup: 'CCOLL' });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        territoryGroup: 'CCOLL',
        showTerminated: false
      }));
    });

    it('should set hasChanges to false after apply', () => {
      component.filterForm.patchValue({ territoryGroup: 'CCOLL' });
      expect(component.hasChanges).toBe(true);

      component.onApply();

      expect(component.hasChanges).toBe(false);
    });

    it('should clear effDatePeriod when effDate is not set', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({ effDatePeriod: 'after', effDate: null });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        effDatePeriod: null,
        effDate: null
      }));
    });

    it('should preserve effDatePeriod when effDate is set', () => {
      spyOn(component.apply, 'emit');
      const testDate = new Date('2024-06-15');
      component.filterForm.patchValue({ effDatePeriod: 'after', effDate: testDate });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        effDatePeriod: 'after',
        effDate: testDate
      }));
    });

    it('should clear termDatePeriod when termDate is not set', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({ termDatePeriod: 'before', termDate: null });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        termDatePeriod: null,
        termDate: null
      }));
    });

    it('should preserve termDatePeriod when termDate is set', () => {
      spyOn(component.apply, 'emit');
      const testDate = new Date('2025-12-31');
      component.filterForm.patchValue({ termDatePeriod: 'before', termDate: testDate });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        termDatePeriod: 'before',
        termDate: testDate
      }));
    });

    it('should not emit apply when form is invalid', () => {
      spyOn(component.apply, 'emit');
      // Set a date without period to trigger validation error
      component.filterForm.patchValue({ effDate: new Date('2024-06-15'), effDatePeriod: null });
      // Force the validator to run
      component.filterForm.get('effDatePeriod')?.markAsTouched();
      component.filterForm.get('effDatePeriod')?.updateValueAndValidity();

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    });

    it('should emit showTerminated correctly', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({ showTerminated: true });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        showTerminated: true
      }));
    });

    it('should emit territoryType correctly', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({ territoryType: 'TRTMR' });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        territoryType: 'TRTMR'
      }));
    });
  });

  describe('Clear Filters', () => {
    it('should reset form to defaults on clear', () => {
      component.filterForm.patchValue({
        showTerminated: true,
        territoryGroup: 'CCOLL',
        territoryType: 'TRTMR',
        effDatePeriod: 'after',
        effDate: new Date(),
        termDatePeriod: 'before',
        termDate: new Date()
      });

      component.onClear();

      expect(component.filterForm.get('showTerminated')?.value).toBe(false);
      expect(component.filterForm.get('territoryGroup')?.value).toBeNull();
      expect(component.filterForm.get('territoryType')?.value).toBeNull();
      expect(component.filterForm.get('effDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effDate')?.value).toBeNull();
      expect(component.filterForm.get('termDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('termDate')?.value).toBeNull();
    });
  });

  describe('Close', () => {
    it('should emit close event', () => {
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should return required error when effDate is set but effDatePeriod is null', () => {
      component.filterForm.patchValue({ effDate: new Date('2024-06-15'), effDatePeriod: null });
      component.filterForm.get('effDatePeriod')?.markAsTouched();
      component.filterForm.get('effDatePeriod')?.updateValueAndValidity();

      expect(component.filterForm.get('effDatePeriod')?.hasError('required')).toBe(true);
    });

    it('should not return error when effDate is set with effDatePeriod', () => {
      component.filterForm.patchValue({ effDate: new Date('2024-06-15'), effDatePeriod: 'after' });
      component.filterForm.get('effDatePeriod')?.updateValueAndValidity();

      expect(component.filterForm.get('effDatePeriod')?.hasError('required')).toBe(false);
    });

    it('should not return error when effDate is null', () => {
      component.filterForm.patchValue({ effDate: null, effDatePeriod: null });
      component.filterForm.get('effDatePeriod')?.updateValueAndValidity();

      expect(component.filterForm.get('effDatePeriod')?.hasError('required')).toBe(false);
    });

    it('should return required error when termDate is set but termDatePeriod is null', () => {
      component.filterForm.patchValue({ termDate: new Date('2025-12-31'), termDatePeriod: null });
      component.filterForm.get('termDatePeriod')?.markAsTouched();
      component.filterForm.get('termDatePeriod')?.updateValueAndValidity();

      expect(component.filterForm.get('termDatePeriod')?.hasError('required')).toBe(true);
    });

    it('should not return error when termDate is set with termDatePeriod', () => {
      component.filterForm.patchValue({ termDate: new Date('2025-12-31'), termDatePeriod: 'before' });
      component.filterForm.get('termDatePeriod')?.updateValueAndValidity();

      expect(component.filterForm.get('termDatePeriod')?.hasError('required')).toBe(false);
    });

    it('should not return error when termDate is null', () => {
      component.filterForm.patchValue({ termDate: null, termDatePeriod: null });
      component.filterForm.get('termDatePeriod')?.updateValueAndValidity();

      expect(component.filterForm.get('termDatePeriod')?.hasError('required')).toBe(false);
    });

    it('should mark effDatePeriod as touched when effDate changes to a value', () => {
      component.filterForm.get('effDate')?.setValue(new Date('2024-06-15'));
      expect(component.filterForm.get('effDatePeriod')?.touched).toBe(true);
    });

    it('should not mark effDatePeriod as touched when effDate is set to null', () => {
      component.filterForm.get('effDatePeriod')?.markAsUntouched();
      component.filterForm.get('effDate')?.setValue(null);
      expect(component.filterForm.get('effDatePeriod')?.touched).toBe(false);
    });

    it('should mark termDatePeriod as touched when termDate changes to a value', () => {
      component.filterForm.get('termDate')?.setValue(new Date('2025-12-31'));
      expect(component.filterForm.get('termDatePeriod')?.touched).toBe(true);
    });

    it('should update effDatePeriod validity when effDatePeriod changes', () => {
      component.filterForm.patchValue({ effDate: new Date('2024-06-15'), effDatePeriod: null });
      component.filterForm.get('effDatePeriod')?.updateValueAndValidity();
      expect(component.filterForm.get('effDatePeriod')?.hasError('required')).toBe(true);

      component.filterForm.get('effDatePeriod')?.setValue('after');
      expect(component.filterForm.get('effDatePeriod')?.hasError('required')).toBe(false);
    });

    it('should update termDatePeriod validity when termDatePeriod changes', () => {
      component.filterForm.patchValue({ termDate: new Date('2025-12-31'), termDatePeriod: null });
      component.filterForm.get('termDatePeriod')?.updateValueAndValidity();
      expect(component.filterForm.get('termDatePeriod')?.hasError('required')).toBe(true);

      component.filterForm.get('termDatePeriod')?.setValue('before');
      expect(component.filterForm.get('termDatePeriod')?.hasError('required')).toBe(false);
    });
  });

  describe('Error Messages', () => {
    it('should return empty string for effDatePeriod error when control is not touched', () => {
      expect(component.getEffDatePeriodError()).toBe('');
    });

    it('should return "Period is required" for effDatePeriod when touched and required', () => {
      component.filterForm.patchValue({ effDate: new Date('2024-06-15'), effDatePeriod: null });
      component.filterForm.get('effDatePeriod')?.markAsTouched();
      component.filterForm.get('effDatePeriod')?.updateValueAndValidity();

      expect(component.getEffDatePeriodError()).toBe('Period is required');
    });

    it('should return empty string for effDatePeriod when valid', () => {
      component.filterForm.patchValue({ effDate: new Date('2024-06-15'), effDatePeriod: 'after' });
      component.filterForm.get('effDatePeriod')?.markAsTouched();
      component.filterForm.get('effDatePeriod')?.updateValueAndValidity();

      expect(component.getEffDatePeriodError()).toBe('');
    });

    it('should return empty string for termDatePeriod error when control is not touched', () => {
      expect(component.getTermDatePeriodError()).toBe('');
    });

    it('should return "Period is required" for termDatePeriod when touched and required', () => {
      component.filterForm.patchValue({ termDate: new Date('2025-12-31'), termDatePeriod: null });
      component.filterForm.get('termDatePeriod')?.markAsTouched();
      component.filterForm.get('termDatePeriod')?.updateValueAndValidity();

      expect(component.getTermDatePeriodError()).toBe('Period is required');
    });

    it('should return empty string for termDatePeriod when valid', () => {
      component.filterForm.patchValue({ termDate: new Date('2025-12-31'), termDatePeriod: 'before' });
      component.filterForm.get('termDatePeriod')?.markAsTouched();
      component.filterForm.get('termDatePeriod')?.updateValueAndValidity();

      expect(component.getTermDatePeriodError()).toBe('');
    });
  });

  describe('hasDateErrors', () => {
    it('should return false when no date errors', () => {
      expect(component.hasDateErrors).toBe(false);
    });

    it('should return true when effDate has matDatepickerParse error', () => {
      component.filterForm.get('effDate')?.setErrors({ matDatepickerParse: true });
      expect(component.hasDateErrors).toBe(true);
    });

    it('should return true when effDate has invalidDateFormat error', () => {
      component.filterForm.get('effDate')?.setErrors({ invalidDateFormat: true });
      expect(component.hasDateErrors).toBe(true);
    });

    it('should return true when termDate has matDatepickerParse error', () => {
      component.filterForm.get('termDate')?.setErrors({ matDatepickerParse: true });
      expect(component.hasDateErrors).toBe(true);
    });

    it('should return true when termDate has invalidDateFormat error', () => {
      component.filterForm.get('termDate')?.setErrors({ invalidDateFormat: true });
      expect(component.hasDateErrors).toBe(true);
    });
  });

  describe('Date Input Handling', () => {
    it('should set invalidDateFormat error on effDate for invalid input', () => {
      spyOn(component['dateAdapter'], 'parse').and.returnValue(null);

      const event = { target: { value: 'invalid-date' } } as unknown as Event;
      component.onEffDateInput(event);

      expect(component.filterForm.get('effDate')?.hasError('invalidDateFormat')).toBe(true);
    });

    it('should clear invalidDateFormat error on effDate for valid input', () => {
      component.filterForm.get('effDate')?.setErrors({ invalidDateFormat: true });
      spyOn(component['dateAdapter'], 'parse').and.returnValue(new Date());

      const event = { target: { value: '15-JAN-2024' } } as unknown as Event;
      component.onEffDateInput(event);

      expect(component.filterForm.get('effDate')?.hasError('invalidDateFormat')).toBe(false);
    });

    it('should not set error on effDate when input is empty', () => {
      const event = { target: { value: '' } } as unknown as Event;
      component.onEffDateInput(event);

      expect(component.filterForm.get('effDate')?.hasError('invalidDateFormat')).toBe(false);
    });

    it('should mark effDate as touched on input', () => {
      const event = { target: { value: 'test' } } as unknown as Event;
      spyOn(component['dateAdapter'], 'parse').and.returnValue(null);

      component.onEffDateInput(event);

      expect(component.filterForm.get('effDate')?.touched).toBe(true);
    });

    it('should set invalidDateFormat error on termDate for invalid input', () => {
      spyOn(component['dateAdapter'], 'parse').and.returnValue(null);

      const event = { target: { value: 'invalid-date' } } as unknown as Event;
      component.onTermDateInput(event);

      expect(component.filterForm.get('termDate')?.hasError('invalidDateFormat')).toBe(true);
    });

    it('should clear invalidDateFormat error on termDate for valid input', () => {
      component.filterForm.get('termDate')?.setErrors({ invalidDateFormat: true });
      spyOn(component['dateAdapter'], 'parse').and.returnValue(new Date());

      const event = { target: { value: '31-DEC-2025' } } as unknown as Event;
      component.onTermDateInput(event);

      expect(component.filterForm.get('termDate')?.hasError('invalidDateFormat')).toBe(false);
    });

    it('should not set error on termDate when input is empty', () => {
      const event = { target: { value: '' } } as unknown as Event;
      component.onTermDateInput(event);

      expect(component.filterForm.get('termDate')?.hasError('invalidDateFormat')).toBe(false);
    });

    it('should mark termDate as touched on input', () => {
      const event = { target: { value: 'test' } } as unknown as Event;
      spyOn(component['dateAdapter'], 'parse').and.returnValue(null);

      component.onTermDateInput(event);

      expect(component.filterForm.get('termDate')?.touched).toBe(true);
    });

    it('should preserve other errors when clearing invalidDateFormat on effDate', () => {
      component.filterForm.get('effDate')?.setErrors({ invalidDateFormat: true, matDatepickerParse: true });
      spyOn(component['dateAdapter'], 'parse').and.returnValue(new Date());

      const event = { target: { value: '15-JAN-2024' } } as unknown as Event;
      component.onEffDateInput(event);

      expect(component.filterForm.get('effDate')?.hasError('invalidDateFormat')).toBe(false);
      expect(component.filterForm.get('effDate')?.hasError('matDatepickerParse')).toBe(true);
    });

    it('should preserve other errors when clearing invalidDateFormat on termDate', () => {
      component.filterForm.get('termDate')?.setErrors({ invalidDateFormat: true, matDatepickerParse: true });
      spyOn(component['dateAdapter'], 'parse').and.returnValue(new Date());

      const event = { target: { value: '31-DEC-2025' } } as unknown as Event;
      component.onTermDateInput(event);

      expect(component.filterForm.get('termDate')?.hasError('invalidDateFormat')).toBe(false);
      expect(component.filterForm.get('termDate')?.hasError('matDatepickerParse')).toBe(true);
    });
  });

  describe('Date Blur Handling', () => {
    it('should restore raw input on effDate blur when control value is null', fakeAsync(() => {
      (component as any).effDateRawInput = '15-JAN-2024';
      const input = { value: '' } as HTMLInputElement;
      component.filterForm.get('effDate')?.setValue(null);

      component.onEffDateBlur(input);
      tick(1);

      expect(input.value).toBe('15-JAN-2024');
    }));

    it('should not restore raw input on effDate blur when control has value', fakeAsync(() => {
      (component as any).effDateRawInput = '15-JAN-2024';
      const input = { value: '' } as HTMLInputElement;
      component.filterForm.get('effDate')?.setValue(new Date());

      component.onEffDateBlur(input);
      tick(1);

      expect(input.value).toBe('');
    }));

    it('should not restore raw input on effDate blur when raw input is empty', fakeAsync(() => {
      (component as any).effDateRawInput = '';
      const input = { value: '' } as HTMLInputElement;
      component.filterForm.get('effDate')?.setValue(null);

      component.onEffDateBlur(input);
      tick(1);

      expect(input.value).toBe('');
    }));

    it('should not restore raw input on effDate blur when input still has value', fakeAsync(() => {
      (component as any).effDateRawInput = '15-JAN-2024';
      const input = { value: '15-JAN-2024' } as HTMLInputElement;
      component.filterForm.get('effDate')?.setValue(null);

      component.onEffDateBlur(input);
      tick(1);

      expect(input.value).toBe('15-JAN-2024');
    }));

    it('should restore raw input on termDate blur when control value is null', fakeAsync(() => {
      (component as any).termDateRawInput = '31-DEC-2025';
      const input = { value: '' } as HTMLInputElement;
      component.filterForm.get('termDate')?.setValue(null);

      component.onTermDateBlur(input);
      tick(1);

      expect(input.value).toBe('31-DEC-2025');
    }));

    it('should not restore raw input on termDate blur when control has value', fakeAsync(() => {
      (component as any).termDateRawInput = '31-DEC-2025';
      const input = { value: '' } as HTMLInputElement;
      component.filterForm.get('termDate')?.setValue(new Date());

      component.onTermDateBlur(input);
      tick(1);

      expect(input.value).toBe('');
    }));

    it('should not restore raw input on termDate blur when raw input is empty', fakeAsync(() => {
      (component as any).termDateRawInput = '';
      const input = { value: '' } as HTMLInputElement;
      component.filterForm.get('termDate')?.setValue(null);

      component.onTermDateBlur(input);
      tick(1);

      expect(input.value).toBe('');
    }));
  });

  describe('Lifecycle', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('Period Options', () => {
    it('should have after and before period options', () => {
      expect(component.periodOptions).toEqual([
        { value: 'after', display: 'After' },
        { value: 'before', display: 'Before' }
      ]);
    });
  });
});
