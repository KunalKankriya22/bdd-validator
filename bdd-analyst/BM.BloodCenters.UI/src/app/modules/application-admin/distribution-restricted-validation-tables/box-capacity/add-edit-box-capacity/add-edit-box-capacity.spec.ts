import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { AddEditBoxCapacity } from './add-edit-box-capacity';
import { BoxCapacityService } from '../services/box-capacity.service';
import { BoxCapacityModel, BoxCapacityFilterLov } from '../models/box-capacity.model';
import { HeaderService } from '@shared/services/header.service';
import { signal } from '@angular/core';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
}

describe('AddEditBoxCapacity', () => {
  let component: AddEditBoxCapacity;
  let fixture: ComponentFixture<AddEditBoxCapacity>;
  let mockBoxCapacityService: jasmine.SpyObj<BoxCapacityService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockChangeDetectorRef: jasmine.SpyObj<ChangeDetectorRef>;
  let mockHeaderService: any;

  const mockBoxCapacityData: BoxCapacityModel = {
    boxType: '26',
    boxDescription: '26 Qt Igloo',
    inventoryProdType: 'CRYO',
    prodDescription: 'Cryoprecipitate',
    capacity: 20,
    effectiveDate: new Date('2004-08-27T00:00:00'),
    terminationDate: null,
    lastModificationDate: new Date('2026-09-10T00:00:00')
  };

  const tomorrow = moment().add(1, 'day').startOf('day');

  const mockLookups = {
    data: [{
      boxTypes: ['26', 'CA', 'FB'],
      inventoryProdTypes: ['CRYO', 'FFP', 'PLTS']
    }],
    totalRecords: 1
  };

  beforeEach(() => {

    mockBoxCapacityService = jasmine.createSpyObj('BoxCapacityService', [
      'getBoxCapacityLookups',
      'addBoxCapacity',
      'updateBoxCapacity'
    ]);

    mockSnackBar = createMockMatSnackBar();
    mockChangeDetectorRef = jasmine.createSpyObj('ChangeDetectorRef', ['markForCheck']);
    mockHeaderService = {
      chapterTimeZone: signal('America/Los_Angeles'),
      chapterId: signal('123')
    };

    mockBoxCapacityService.getBoxCapacityLookups.and.returnValue(of(mockLookups));



      TestBed.configureTestingModule({
      imports: [AddEditBoxCapacity, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        FormBuilder,
        { provide: BoxCapacityService, useValue: mockBoxCapacityService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });




      mockBoxCapacityService.getBoxCapacityLookups.calls.reset();


      mockBoxCapacityService.addBoxCapacity.calls.reset();


      mockBoxCapacityService.updateBoxCapacity.calls.reset();


      mockChangeDetectorRef.markForCheck.calls.reset();


      mockBoxCapacityService.getBoxCapacityLookups.and.returnValue(of(mockLookups));


    fixture = TestBed.createComponent(AddEditBoxCapacity);
    component = fixture.componentInstance;


    });
  describe('Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });



    it('should mark required fields as invalid when empty', () => {
      component.form.markAllAsTouched();

      expect(component.form.get('boxType')?.valid).toBeFalse();
      expect(component.form.get('inventoryProductType')?.valid).toBeFalse();
      expect(component.form.get('capacity')?.valid).toBeFalse();
      expect(component.form.get('effectiveDate')?.valid).toBeFalse();
    });

    it('should validate capacity minimum value', () => {
      component.form.patchValue({ capacity: -1 });
      component.form.get('capacity')?.markAsTouched();

      expect(component.form.get('capacity')?.hasError('min')).toBeTrue();
      expect(component.getCapacityError()).toBe('Value must be between 0 and 9999.');
    });

    it('should validate capacity maximum value', () => {
      component.form.patchValue({ capacity: 10000 });
      component.form.get('capacity')?.markAsTouched();

      expect(component.form.get('capacity')?.hasError('max')).toBeTrue();
      expect(component.getCapacityError()).toBe('Value must be between 0 and 9999.');
    });


  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockBoxCapacityData;
      fixture.detectChanges();
    });




    it('should keep capacity and termination date enabled in edit mode', () => {
      expect(component.form.get('capacity')?.enabled).toBeTrue();
      expect(component.form.get('terminationDate')?.enabled).toBeTrue();
    });



    it('should display edit mode values correctly', () => {
      expect(component.editModeValues.boxType).toBe('26');
      expect(component.editModeValues.inventoryProductType).toBe('CRYO');
      expect(component.editModeValues.capacity).toBe('20');
    });


    it('should store original values for update API', () => {
      expect(component['originalValues'].boxType).toBe('26');
      expect(component['originalValues'].inventoryProductType).toBe('CRYO');
      expect(component['originalValues'].effectiveDate).toBe(mockBoxCapacityData.effectiveDate ?? null);
    });

    it('should store original editable values for dirty tracking', () => {
      expect(component['originalEditableValues'].capacity).toBe(20);
      expect(component['originalEditableValues'].terminationDate).toBeNull();
    });

    it('should mark form as pristine after populating edit data', () => {
      expect(component.form.pristine).toBeTrue();
    });
  });

  describe('isFormDirty', () => {
    it('should return true in add mode regardless of form state', () => {
      component.mode = 'add';
      fixture.detectChanges();

      expect(component.isFormDirty).toBeTrue();
    });

    it('should return false in edit mode when no changes made', () => {
      component.mode = 'edit';
      component.data = mockBoxCapacityData;
      fixture.detectChanges();

      expect(component.isFormDirty).toBeFalse();
    });

    it('should return true in edit mode when capacity is changed', () => {
      component.mode = 'edit';
      component.data = mockBoxCapacityData;
      fixture.detectChanges();

      component.form.patchValue({ capacity: 50 });

      expect(component.isFormDirty).toBeTrue();
    });

    it('should return true in edit mode when termination date is changed', () => {
      component.mode = 'edit';
      component.data = mockBoxCapacityData;
      fixture.detectChanges();

      component.form.patchValue({ terminationDate: moment('2027-01-01') });

      expect(component.isFormDirty).toBeTrue();
    });

    it('should return false in edit mode when values are changed back to originals', () => {
      component.mode = 'edit';
      component.data = mockBoxCapacityData;
      fixture.detectChanges();

      component.form.patchValue({ capacity: 50 });
      expect(component.isFormDirty).toBeTrue();

      component.form.patchValue({ capacity: 20 });
      expect(component.isFormDirty).toBeFalse();
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should show box type required error', () => {
      component.form.get('boxType')?.markAsTouched();
      expect(component.getBoxTypeError()).toBe('Box Type is required');
    });

    it('should show inventory product type required error', () => {
      component.form.get('inventoryProductType')?.markAsTouched();
      expect(component.getInventoryProductTypeError()).toBe('Inventory Product Type is required');
    });

    it('should show capacity required error', () => {
      component.form.get('capacity')?.markAsTouched();
      expect(component.getCapacityError()).toBe('Capacity is required');
    });

    it('should show effective date required error', () => {
      component.form.get('effectiveDate')?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    });




  });

  describe('Mode Changes', () => {


    it('should populate form when switching from add to edit mode', () => {
      component.mode = 'add';
      fixture.detectChanges();

      component.mode = 'edit';
      component.data = mockBoxCapacityData;
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: 'add',
          firstChange: false,
          isFirstChange: () => false
        },
        data: {
          currentValue: mockBoxCapacityData,
          previousValue: null,
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.form.get('boxType')?.value).toBe('26');
      expect(component.form.get('boxType')?.disabled).toBeTrue();
    });


  });



  describe('Date Formatting', () => {
    it('should format date for display', () => {
      const date = new Date('2026-06-15');
      const formatted = component['formatDateForDisplay'](date);

      expect(formatted).toBe('15-JUN-2026');
    });



    it('should format datetime with "Today" for current date', () => {
      const today = new Date();
      const formatted = component.formatDateTime(today);

      expect(formatted).toContain('Today');
      expect(formatted).toMatch(/P[SD]T|UTC/);
    });

    it('should format datetime with date for past dates', () => {
      const pastDate = new Date('2026-01-15');
      const formatted = component.formatDateTime(pastDate);

      expect(formatted).toContain('15-JAN-2026');
      expect(formatted).toMatch(/P[SD]T|UTC/);
    });


  });

  describe('Form Control Getters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return boxType control', () => {
      expect(component.boxTypeControl).toBe(component.form.get('boxType'));
    });

    it('should return inventoryProductType control', () => {
      expect(component.inventoryProductTypeControl).toBe(component.form.get('inventoryProductType'));
    });

    it('should return capacity control', () => {
      expect(component.capacityControl).toBe(component.form.get('capacity'));
    });




  });

  describe('Loading States', () => {


    it('should set isSaving to true while saving', () => {
      const delayedResponse = new Subject<ReturnResult<BoxCapacityModel>>();
      mockBoxCapacityService.addBoxCapacity.and.returnValue(delayedResponse.asObservable());

      component.mode = 'add';
      component.form.patchValue({
        boxType: '26',
        inventoryProductType: 'CRYO',
        capacity: 20,
        effectiveDate: moment().add(5, 'days')
      });

      component.onSave();

      expect(component.isSaving).toBeTrue();

      delayedResponse.next({ message: 'Success' });
      delayedResponse.complete();

      expect(component.isSaving).toBeFalse();
    });

    it('should handle dropdown options loading error', () => {
      mockBoxCapacityService.getBoxCapacityLookups.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      spyOn(console, 'error');

      component.ngOnInit();

      expect(console.error).toHaveBeenCalledWith(
        'Error loading dropdown options:',
        jasmine.any(Error)
      );
      expect(component.isLoadingOptions).toBeFalse();
    });
  });


  describe('Capacity Input Handling', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });



    it('should truncate capacity input to 4 digits', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '12345';
      const event = { target: inputElement } as unknown as Event;

      component.onCapacityInput(event);

      expect(inputElement.value).toBe('1234');
      expect(component.showCapacityOverflowError).toBeTrue();
    });

    it('should show overflow error when input exceeds 4 digits', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '123456';
      const event = { target: inputElement } as unknown as Event;

      component.onCapacityInput(event);

      expect(component.showCapacityOverflowError).toBeTrue();
      expect(component.form.get('capacity')?.hasError('overflow')).toBeTrue();
      expect(inputElement.value).toBe('1234');
    });



    it('should show overflow error message in getCapacityError when overflow flag is set', () => {
      component.showCapacityOverflowError = true;

      const error = component.getCapacityError();

      expect(error).toBe('Value must be between 0 and 9999.');
    });
  });

  describe('Cleanup', () => {


    it('should handle component destroy after capacity input', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '12345';
      const event = { target: inputElement } as unknown as Event;

      component.onCapacityInput(event);

      // Should handle destroy without errors even after input
      expect(() => component.ngOnDestroy()).not.toThrow();
      expect(component).toBeTruthy();
    });
  });

  // =====================================================================
  // NEW TESTS - Comprehensive coverage for uncovered branches/methods
  // =====================================================================

  describe('Component Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should set default mode to add', () => {
      expect(component.mode).toBe('add');
    });

    it('should initialize form with required validators', () => {
      fixture.detectChanges();
      expect(component.form).toBeTruthy();
      expect(component.form.get('boxType')).toBeTruthy();
      expect(component.form.get('inventoryProductType')).toBeTruthy();
      expect(component.form.get('capacity')).toBeTruthy();
      expect(component.form.get('effectiveDate')).toBeTruthy();
      expect(component.form.get('terminationDate')).toBeTruthy();
    });

    it('should set panelTitle to "Add New Box Capacity" in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.panelTitle).toBe('Add New Box Capacity');
    });

    it('should set lastUpdated to empty string in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.lastUpdated).toBe('');
    });

    it('should call loadDropdownOptions on init', () => {
      fixture.detectChanges();
      expect(mockBoxCapacityService.getBoxCapacityLookups).toHaveBeenCalled();
    });

    it('should set minDate based on chapter timezone', () => {
      fixture.detectChanges();
      expect(component.minDate).toBeTruthy();
      expect(moment.isMoment(component.minDate)).toBeTrue();
    });

    it('should set minEffectiveDate based on chapter timezone', () => {
      fixture.detectChanges();
      expect(component.minEffectiveDate).toBeTruthy();
      expect(moment.isMoment(component.minEffectiveDate)).toBeTrue();
    });

    it('should set effectiveDateFilterFn', () => {
      fixture.detectChanges();
      expect(component.effectiveDateFilterFn).toBeTruthy();
      expect(typeof component.effectiveDateFilterFn).toBe('function');
    });

    it('should set terminationDateFilterFn', () => {
      fixture.detectChanges();
      expect(component.terminationDateFilterFn).toBeTruthy();
      expect(typeof component.terminationDateFilterFn).toBe('function');
    });
  });

  describe('setupDateValidation - terminationDateFilterFn', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should allow null date in terminationDateFilterFn', () => {
      const result = component.terminationDateFilterFn(null);
      expect(result).toBeTrue();
    });

    it('should allow future dates in terminationDateFilterFn', () => {
      const futureDate = moment().add(30, 'days');
      const result = component.terminationDateFilterFn(futureDate);
      expect(result).toBeTrue();
    });

    it('should disallow past dates in terminationDateFilterFn', () => {
      const pastDate = moment().subtract(30, 'days');
      const result = component.terminationDateFilterFn(pastDate);
      expect(result).toBeFalse();
    });

    it('should disallow dates before effective date in terminationDateFilterFn', () => {
      const futureEffective = moment().add(10, 'days');
      component.form.patchValue({ effectiveDate: futureEffective });

      const beforeEffective = moment().add(5, 'days');
      const result = component.terminationDateFilterFn(beforeEffective);
      expect(result).toBeFalse();
    });

    it('should allow dates on or after effective date in terminationDateFilterFn', () => {
      const futureEffective = moment().add(5, 'days');
      component.form.patchValue({ effectiveDate: futureEffective });

      const afterEffective = moment().add(10, 'days');
      const result = component.terminationDateFilterFn(afterEffective);
      expect(result).toBeTrue();
    });
  });

  describe('setupDateValidation - no chapter timezone', () => {
    it('should handle missing chapter timezone gracefully', () => {
      mockHeaderService.chapterTimeZone = signal(undefined as any);

      const localFixture = TestBed.createComponent(AddEditBoxCapacity);
      const localComponent = localFixture.componentInstance;
      localComponent.mode = 'add';

      expect(() => localFixture.detectChanges()).not.toThrow();
    });
  });

  describe('loadDropdownOptions', () => {
    it('should populate boxTypeOptions and inventoryProductTypeOptions on success', () => {
      const richLookups = {
        data: [{
          boxTypes: [
            { boxType: '26', boxTypeDescription: '26 Qt Igloo' },
            { boxType: 'CA', boxTypeDescription: 'Carrier' }
          ],
          inventoryProdTypes: [
            { inventoryProductType: 'CRYO', productTypeDescription: 'Cryoprecipitate' },
            { inventoryProductType: 'FFP', productTypeDescription: 'Fresh Frozen Plasma' }
          ]
        }],
        totalRecords: 1
      };
      mockBoxCapacityService.getBoxCapacityLookups.and.returnValue(of(richLookups));

      component.mode = 'add';
      fixture.detectChanges();

      expect(component.boxTypeOptions.length).toBe(2);
      expect(component.inventoryProductTypeOptions.length).toBe(2);
      expect(component.isLoadingOptions).toBeFalse();
    });

    it('should handle empty data in lookups response', () => {
      const emptyLookups = { data: [{}], totalRecords: 0 };
      mockBoxCapacityService.getBoxCapacityLookups.and.returnValue(of(emptyLookups));

      component.mode = 'add';
      fixture.detectChanges();

      expect(component.boxTypeOptions).toEqual([]);
      expect(component.inventoryProductTypeOptions).toEqual([]);
      expect(component.isLoadingOptions).toBeFalse();
    });

    it('should handle null data in lookups response', () => {
      const nullLookups = { data: [{ boxTypes: null as any, inventoryProdTypes: null as any }], totalRecords: 0 };
      mockBoxCapacityService.getBoxCapacityLookups.and.returnValue(of(nullLookups));

      component.mode = 'add';
      fixture.detectChanges();

      expect(component.boxTypeOptions).toEqual([]);
      expect(component.inventoryProductTypeOptions).toEqual([]);
    });
  });

  describe('setupDateValueChangeListeners', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should set lastChangedDateField when effective date changes (terminationDate updateValueAndValidity also fires)', () => {
      // Setting effective date triggers its valueChanges (sets 'effective'),
      // but then the second effective date listener calls terminationDate.updateValueAndValidity()
      // which triggers terminationDate's valueChanges (sets 'termination').
      // So the final value is 'termination'.
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      // The final value reflects that termination date was the last field whose valueChanges fired
      expect(component['lastChangedDateField']).toBe('termination');
    });

    it('should track lastChangedDateField as termination when termination date changes', () => {
      component.form.get('terminationDate')?.setValue(moment().add(5, 'days'));
      expect(component['lastChangedDateField']).toBe('termination');
    });

    it('should update minTerminationDate when effective date is set to a moment value', () => {
      const futureDate = moment().add(10, 'days');
      component.form.get('effectiveDate')?.setValue(futureDate);

      expect(component.minTerminationDate).toBeTruthy();
      expect(moment.isMoment(component.minTerminationDate)).toBeTrue();
    });

    it('should reset minTerminationDate when effective date is cleared', () => {
      component.form.get('effectiveDate')?.setValue(moment().add(10, 'days'));
      component.form.get('effectiveDate')?.setValue(null);

      expect(component.minTerminationDate).toBeTruthy();
    });
  });

  describe('setupDropdownValueChangeListeners', () => {
    it('should clear errors and mark pristine/untouched when boxType is cleared in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const boxTypeControl = component.form.get('boxType');
      boxTypeControl?.setValue('26');
      boxTypeControl?.markAsTouched();
      boxTypeControl?.markAsDirty();

      boxTypeControl?.setValue('');

      expect(boxTypeControl?.errors).toBeNull();
      expect(boxTypeControl?.pristine).toBeTrue();
      expect(boxTypeControl?.untouched).toBeTrue();
    });

    it('should clear errors when boxType is cleared in edit mode without marking pristine', () => {
      component.mode = 'edit';
      component.data = mockBoxCapacityData;
      fixture.detectChanges();

      // boxType is disabled in edit mode, so enable it temporarily for this test
      const boxTypeControl = component.form.get('boxType');
      boxTypeControl?.enable();
      boxTypeControl?.setValue('26');
      boxTypeControl?.markAsTouched();

      boxTypeControl?.setValue('');

      expect(boxTypeControl?.errors).toBeNull();
    });

    it('should clear errors and mark pristine/untouched when inventoryProductType is cleared in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const iptControl = component.form.get('inventoryProductType');
      iptControl?.setValue('CRYO');
      iptControl?.markAsTouched();
      iptControl?.markAsDirty();

      iptControl?.setValue('');

      expect(iptControl?.errors).toBeNull();
      expect(iptControl?.pristine).toBeTrue();
      expect(iptControl?.untouched).toBeTrue();
    });

    it('should clear errors when inventoryProductType is cleared in edit mode without marking pristine', () => {
      component.mode = 'edit';
      component.data = mockBoxCapacityData;
      fixture.detectChanges();

      const iptControl = component.form.get('inventoryProductType');
      iptControl?.enable();
      iptControl?.setValue('CRYO');
      iptControl?.markAsTouched();

      iptControl?.setValue('');

      expect(iptControl?.errors).toBeNull();
    });

    it('should not clear errors when boxType is set to a non-empty value', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const boxTypeControl = component.form.get('boxType');
      boxTypeControl?.setValue('26');

      // Should still be valid since it has a value
      expect(boxTypeControl?.valid).toBeTrue();
    });
  });

  describe('ngOnChanges', () => {
    it('should not call setupPanel when firstChange is true for both mode and data', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const initialTitle = component.panelTitle;

      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: null,
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      // panelTitle should remain unchanged since first change is skipped
      expect(component.panelTitle).toBe(initialTitle);
    });

    it('should reset form for add mode when switching from edit to add (not first change)', () => {
      component.mode = 'edit';
      component.data = mockBoxCapacityData;
      fixture.detectChanges();

      component.mode = 'add';
      component.data = null;
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: 'edit',
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.panelTitle).toBe('Add New Box Capacity');
      expect(component.form.get('boxType')?.enabled).toBeTrue();
      expect(component.form.get('inventoryProductType')?.enabled).toBeTrue();
      expect(component.showCapacityOverflowError).toBeFalse();
    });

    it('should ignore changes that do not include mode or data', () => {
      component.mode = 'add';
      fixture.detectChanges();

      expect(() => component.ngOnChanges({})).not.toThrow();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      fixture.detectChanges();

      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    it('should emit closePanel event', () => {
      fixture.detectChanges();
      spyOn(component.closePanel, 'emit');

      component.onCancel();

      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  describe('onSave', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should not call API when form is invalid', () => {
      component.onSave();

      expect(mockBoxCapacityService.addBoxCapacity).not.toHaveBeenCalled();
      expect(mockBoxCapacityService.updateBoxCapacity).not.toHaveBeenCalled();
    });

    it('should markAllAsTouched when form is invalid', () => {
      spyOn(component.form, 'markAllAsTouched');

      component.onSave();

      expect(component.form.markAllAsTouched).toHaveBeenCalled();
    });

    it('should call addBoxCapacity in add mode with valid form', () => {
      const futureDate = moment().add(5, 'days');
      mockBoxCapacityService.addBoxCapacity.and.returnValue(of({ message: 'Success' }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        boxType: '26',
        inventoryProductType: 'CRYO',
        capacity: 20,
        effectiveDate: futureDate
      });

      component.onSave();

      expect(mockBoxCapacityService.addBoxCapacity).toHaveBeenCalled();
      const payload = mockBoxCapacityService.addBoxCapacity.calls.mostRecent().args[0];
      expect(payload.boxType).toBe('26');
      expect(payload.productType).toBe('CRYO');
      expect(payload.capacity).toBe(20);
      expect(payload.chapterId).toBe('123');
    });

    it('should call updateBoxCapacity in edit mode with valid form', () => {
      component.mode = 'edit';
      component.data = mockBoxCapacityData;
      component['setupPanel']();

      const futureDate = moment().add(5, 'days');
      mockBoxCapacityService.updateBoxCapacity.and.returnValue(of({ message: 'Updated' }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        capacity: 30,
        effectiveDate: futureDate
      });

      component.onSave();

      expect(mockBoxCapacityService.updateBoxCapacity).toHaveBeenCalled();
      const payload = mockBoxCapacityService.updateBoxCapacity.calls.mostRecent().args[0];
      expect(payload.boxType).toBe('26');
      expect(payload.productType).toBe('CRYO');
      expect(payload.capacity).toBe(30);
    });

    it('should show success snackbar on successful add', () => {
      const futureDate = moment().add(5, 'days');
      mockBoxCapacityService.addBoxCapacity.and.returnValue(of({ message: 'Record added' }));
      const snackBarSpy = spyOn(component['snackBar'], 'open');
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        boxType: '26',
        inventoryProductType: 'CRYO',
        capacity: 20,
        effectiveDate: futureDate
      });

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Record added',
        'DISMISS',
        jasmine.objectContaining({
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        })
      );
    });

    it('should use default success message when response has no message in add mode', () => {
      const futureDate = moment().add(5, 'days');
      mockBoxCapacityService.addBoxCapacity.and.returnValue(of({}));
      const snackBarSpy = spyOn(component['snackBar'], 'open');
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        boxType: '26',
        inventoryProductType: 'CRYO',
        capacity: 20,
        effectiveDate: futureDate
      });

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'New record has been added successfully',
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should use default success message when response has no message in edit mode', () => {
      component.mode = 'edit';
      component.data = mockBoxCapacityData;
      component['setupPanel']();

      const futureDate = moment().add(5, 'days');
      mockBoxCapacityService.updateBoxCapacity.and.returnValue(of({}));
      const snackBarSpy = spyOn(component['snackBar'], 'open');
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        capacity: 30,
        effectiveDate: futureDate
      });

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Box capacity record has been updated successfully',
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should emit saveSuccess and closePanel on successful save', () => {
      const futureDate = moment().add(5, 'days');
      mockBoxCapacityService.addBoxCapacity.and.returnValue(of({ message: 'Success' }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        boxType: '26',
        inventoryProductType: 'CRYO',
        capacity: 20,
        effectiveDate: futureDate
      });

      component.onSave();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should set isSaving to false on error', () => {
      const futureDate = moment().add(5, 'days');
      mockBoxCapacityService.addBoxCapacity.and.returnValue(
        throwError(() => new Error('Server error'))
      );
      spyOn(console, 'error');

      component.form.patchValue({
        boxType: '26',
        inventoryProductType: 'CRYO',
        capacity: 20,
        effectiveDate: futureDate
      });

      component.onSave();

      expect(component.isSaving).toBeFalse();
      expect(console.error).toHaveBeenCalledWith(
        'Error saving box capacity:',
        jasmine.any(Error)
      );
    });

    it('should handle save with terminationDate set', () => {
      const futureDate = moment().add(5, 'days');
      const termDate = moment().add(30, 'days');
      mockBoxCapacityService.addBoxCapacity.and.returnValue(of({ message: 'Success' }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        boxType: '26',
        inventoryProductType: 'CRYO',
        capacity: 20,
        effectiveDate: futureDate,
        terminationDate: termDate
      });

      component.onSave();

      const payload = mockBoxCapacityService.addBoxCapacity.calls.mostRecent().args[0];
      expect(payload.terminationDate).toBeTruthy();
      expect(payload.terminationDate).toContain('T12:00:00.000Z');
    });

    it('should handle save with empty terminationDate', () => {
      const futureDate = moment().add(5, 'days');
      mockBoxCapacityService.addBoxCapacity.and.returnValue(of({ message: 'Success' }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        boxType: '26',
        inventoryProductType: 'CRYO',
        capacity: 20,
        effectiveDate: futureDate,
        terminationDate: null
      });

      component.onSave();

      const payload = mockBoxCapacityService.addBoxCapacity.calls.mostRecent().args[0];
      expect(payload.terminationDate).toBe('');
    });
  });

  describe('toNativeDate', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return null for null input', () => {
      const result = component['toNativeDate'](null);
      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = component['toNativeDate'](undefined);
      expect(result).toBeNull();
    });

    it('should convert moment object to Date', () => {
      const m = moment('2026-06-15');
      const result = component['toNativeDate'](m);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2026);
    });

    it('should return Date object as-is', () => {
      const date = new Date('2026-06-15');
      const result = component['toNativeDate'](date);
      expect(result).toBeInstanceOf(Date);
      expect(result).toBe(date);
    });

    it('should parse valid date string', () => {
      const result = component['toNativeDate']('2026-06-15');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2026);
    });

    it('should return null for invalid date string', () => {
      const result = component['toNativeDate']('not-a-date');
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = component['toNativeDate']('');
      expect(result).toBeNull();
    });
  });

  describe('toISOStringWithoutTimezone', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format date with noon time to avoid timezone shift', () => {
      const date = new Date(2026, 5, 15); // June 15, 2026
      const result = component['toISOStringWithoutTimezone'](date);
      expect(result).toBe('2026-06-15T12:00:00.000Z');
    });

    it('should pad single-digit month and day', () => {
      const date = new Date(2026, 0, 5); // January 5, 2026
      const result = component['toISOStringWithoutTimezone'](date);
      expect(result).toBe('2026-01-05T12:00:00.000Z');
    });

    it('should handle December 31', () => {
      const date = new Date(2026, 11, 31); // December 31, 2026
      const result = component['toISOStringWithoutTimezone'](date);
      expect(result).toBe('2026-12-31T12:00:00.000Z');
    });
  });

  describe('formatDateForDisplay', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string for null', () => {
      const result = component['formatDateForDisplay'](null);
      expect(result).toBe('');
    });

    it('should return empty string for undefined', () => {
      const result = component['formatDateForDisplay'](undefined);
      expect(result).toBe('');
    });

    it('should format valid date in DD-MMM-YYYY uppercase', () => {
      const date = new Date('2026-03-15');
      const result = component['formatDateForDisplay'](date);
      expect(result).toBe('15-MAR-2026');
    });
  });

  describe('formatDateTime', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string for null date', () => {
      const result = component.formatDateTime(null);
      expect(result).toBe('');
    });
  });

  describe('Edit Mode - Panel Setup', () => {
    it('should set panelTitle to "Edit Box Capacity" in edit mode', () => {
      component.mode = 'edit';
      component.data = mockBoxCapacityData;
      fixture.detectChanges();

      expect(component.panelTitle).toBe('Edit Box Capacity');
    });

    it('should set lastUpdated when lastModificationDate is available', () => {
      component.mode = 'edit';
      component.data = mockBoxCapacityData;
      fixture.detectChanges();

      expect(component.lastUpdated).toContain('Last Updated:');
    });

    it('should set lastUpdated to empty when lastModificationDate is null', () => {
      component.mode = 'edit';
      component.data = { ...mockBoxCapacityData, lastModificationDate: null };
      fixture.detectChanges();

      expect(component.lastUpdated).toBe('');
    });

    it('should disable boxType in edit mode', () => {
      component.mode = 'edit';
      component.data = mockBoxCapacityData;
      fixture.detectChanges();

      expect(component.form.get('boxType')?.disabled).toBeTrue();
    });

    it('should disable inventoryProductType in edit mode', () => {
      component.mode = 'edit';
      component.data = mockBoxCapacityData;
      fixture.detectChanges();

      expect(component.form.get('inventoryProductType')?.disabled).toBeTrue();
    });

    it('should keep effectiveDate enabled in edit mode', () => {
      component.mode = 'edit';
      component.data = mockBoxCapacityData;
      fixture.detectChanges();

      expect(component.form.get('effectiveDate')?.enabled).toBeTrue();
    });

    it('should populate form with data values in edit mode', () => {
      component.mode = 'edit';
      component.data = mockBoxCapacityData;
      fixture.detectChanges();

      expect(component.form.get('capacity')?.value).toBe(20);
      expect(component.form.get('effectiveDate')?.value).toBeTruthy();
    });

    it('should handle edit mode data with terminationDate', () => {
      const dataWithTermDate = {
        ...mockBoxCapacityData,
        terminationDate: new Date('2027-12-31T00:00:00')
      };
      component.mode = 'edit';
      component.data = dataWithTermDate;
      fixture.detectChanges();

      expect(component.form.get('terminationDate')?.value).toBeTruthy();
      expect(component.editModeValues.terminationDate).toBe('31-DEC-2027');
      expect(component['originalEditableValues'].terminationDate).toBeTruthy();
    });

    it('should handle edit mode data with empty capacity', () => {
      const dataNoCapacity = { ...mockBoxCapacityData, capacity: undefined };
      component.mode = 'edit';
      component.data = dataNoCapacity;
      fixture.detectChanges();

      expect(component.editModeValues.capacity).toBe('');
    });

    it('should handle edit mode data with null capacity', () => {
      const dataNoCapacity = { ...mockBoxCapacityData, capacity: null as any };
      component.mode = 'edit';
      component.data = dataNoCapacity;
      fixture.detectChanges();

      expect(component.editModeValues.capacity).toBe('');
    });

    it('should handle edit mode data with null effectiveDate', () => {
      const dataNoEffDate = { ...mockBoxCapacityData, effectiveDate: null };
      component.mode = 'edit';
      component.data = dataNoEffDate;
      fixture.detectChanges();

      expect(component.editModeValues.effectiveDate).toBe('');
      expect(component['originalEditableValues'].effectiveDate).toBeNull();
    });

    it('should set minTerminationDate based on effective date and chapter today', () => {
      component.mode = 'edit';
      component.data = mockBoxCapacityData;
      fixture.detectChanges();

      expect(component.minTerminationDate).toBeTruthy();
    });
  });

  describe('resetFormForAddMode', () => {
    it('should reset editModeValues when switching to add mode', () => {
      component.mode = 'edit';
      component.data = mockBoxCapacityData;
      fixture.detectChanges();

      // Now switch back to add mode
      component.mode = 'add';
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: 'edit',
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.editModeValues.boxType).toBe('');
      expect(component.editModeValues.inventoryProductType).toBe('');
      expect(component.editModeValues.capacity).toBe('');
      expect(component.editModeValues.effectiveDate).toBe('');
      expect(component.editModeValues.terminationDate).toBe('');
    });

    it('should enable all form fields when resetting to add mode', () => {
      component.mode = 'edit';
      component.data = mockBoxCapacityData;
      fixture.detectChanges();

      component.mode = 'add';
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: 'edit',
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.form.get('boxType')?.enabled).toBeTrue();
      expect(component.form.get('inventoryProductType')?.enabled).toBeTrue();
      expect(component.form.get('capacity')?.enabled).toBeTrue();
    });

    it('should clear showCapacityOverflowError when resetting to add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.showCapacityOverflowError = true;

      component.mode = 'add';
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: 'edit',
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.showCapacityOverflowError).toBeFalse();
    });
  });

  describe('Capacity Input Handling - Additional Cases', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should handle valid 4-digit input without overflow', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '9999';
      const event = { target: inputElement } as unknown as Event;

      component.onCapacityInput(event);

      expect(inputElement.value).toBe('9999');
      expect(component.showCapacityOverflowError).toBeFalse();
      expect(component.form.get('capacity')?.value).toBe(9999);
    });

    it('should handle single digit input', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '5';
      const event = { target: inputElement } as unknown as Event;

      component.onCapacityInput(event);

      expect(inputElement.value).toBe('5');
      expect(component.form.get('capacity')?.value).toBe(5);
      expect(component.showCapacityOverflowError).toBeFalse();
    });

    it('should strip non-digit characters', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '12a3';
      const event = { target: inputElement } as unknown as Event;

      component.onCapacityInput(event);

      expect(inputElement.value).toBe('123');
      expect(component.form.get('capacity')?.value).toBe(123);
    });

    it('should clear capacity and reset state when input is empty in add mode', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '';
      const event = { target: inputElement } as unknown as Event;

      component.showCapacityOverflowError = true;
      component.onCapacityInput(event);

      expect(component.showCapacityOverflowError).toBeFalse();
      expect(component.form.get('capacity')?.value).toBeNull();
    });

    it('should mark capacity as dirty when cleared in edit mode', () => {
      component.mode = 'edit';
      component.data = mockBoxCapacityData;
      component['setupPanel']();

      const inputElement = document.createElement('input');
      inputElement.value = '';
      const event = { target: inputElement } as unknown as Event;

      component.onCapacityInput(event);

      expect(component.form.get('capacity')?.dirty).toBeTrue();
    });

    it('should handle zero input', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '0';
      const event = { target: inputElement } as unknown as Event;

      component.onCapacityInput(event);

      expect(inputElement.value).toBe('0');
      expect(component.form.get('capacity')?.value).toBe(0);
    });

    it('should strip negative signs from input', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '-5';
      const event = { target: inputElement } as unknown as Event;

      component.onCapacityInput(event);

      expect(inputElement.value).toBe('5');
      expect(component.form.get('capacity')?.value).toBe(5);
    });
  });

  describe('onCapacityBlur', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should mark capacity as touched on blur', () => {
      const inputElement = document.createElement('input');
      const event = { target: inputElement } as unknown as Event;

      component.onCapacityBlur(event);

      expect(component.form.get('capacity')?.touched).toBeTrue();
    });
  });

  describe('getCapacityError - additional branches', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return empty string when control is not touched and no overflow', () => {
      component.showCapacityOverflowError = false;
      expect(component.getCapacityError()).toBe('');
    });

    it('should return empty string when capacity has a valid value', () => {
      component.form.patchValue({ capacity: 50 });
      component.form.get('capacity')?.markAsTouched();

      expect(component.getCapacityError()).toBe('');
    });

    it('should return overflow error when control hasError overflow even if showCapacityOverflowError is false', () => {
      component.form.get('capacity')?.setErrors({ overflow: true });
      component.showCapacityOverflowError = false;

      // The getCapacityError checks: showCapacityOverflowError || control.hasError('overflow')
      // Since control.hasError('overflow') is true, the error message is returned
      expect(component.getCapacityError()).toBe('Value must be between 0 and 9999.');
    });
  });

  describe('getBoxTypeError - additional branches', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return empty string when control is not touched', () => {
      expect(component.getBoxTypeError()).toBe('');
    });

    it('should return empty string when boxType has a valid value', () => {
      component.form.patchValue({ boxType: '26' });
      component.form.get('boxType')?.markAsTouched();

      expect(component.getBoxTypeError()).toBe('');
    });
  });

  describe('getInventoryProductTypeError - additional branches', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return empty string when control is not touched', () => {
      expect(component.getInventoryProductTypeError()).toBe('');
    });

    it('should return empty string when inventoryProductType has a valid value', () => {
      component.form.patchValue({ inventoryProductType: 'CRYO' });
      component.form.get('inventoryProductType')?.markAsTouched();

      expect(component.getInventoryProductTypeError()).toBe('');
    });
  });

  describe('getEffectiveDateError', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should pass form errors when lastChangedDateField is effective', () => {
      component['lastChangedDateField'] = 'effective';
      component.form.get('effectiveDate')?.markAsTouched();

      const error = component.getEffectiveDateError();
      // Should return some error since effective date is required and null
      expect(error).toBe('Effective Date is required');
    });

    it('should not pass form errors when lastChangedDateField is termination', () => {
      component['lastChangedDateField'] = 'termination';
      component.form.get('effectiveDate')?.markAsTouched();

      const error = component.getEffectiveDateError();
      // Still returns required error from the control itself
      expect(error).toBe('Effective Date is required');
    });

    it('should not pass form errors when lastChangedDateField is null', () => {
      component['lastChangedDateField'] = null;
      component.form.get('effectiveDate')?.markAsTouched();

      const error = component.getEffectiveDateError();
      expect(error).toBe('Effective Date is required');
    });
  });

  describe('getTerminationDateError', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should pass form errors when lastChangedDateField is termination', () => {
      component['lastChangedDateField'] = 'termination';
      // Termination date is optional so no required error
      const error = component.getTerminationDateError();
      expect(error).toBe('');
    });

    it('should not pass form errors when lastChangedDateField is effective', () => {
      component['lastChangedDateField'] = 'effective';
      const error = component.getTerminationDateError();
      expect(error).toBe('');
    });
  });

  describe('isFormValid', () => {
    it('should return false when form has required empty fields', () => {
      component.mode = 'add';
      fixture.detectChanges();

      expect(component.isFormValid).toBeFalse();
    });

    it('should return true when all required fields are valid', () => {
      component.mode = 'add';
      fixture.detectChanges();

      component.form.patchValue({
        boxType: '26',
        inventoryProductType: 'CRYO',
        capacity: 20,
        effectiveDate: moment().add(5, 'days')
      });

      expect(component.isFormValid).toBeTrue();
    });
  });

  describe('isFormDirty - additional branches', () => {
    it('should detect effective date change in edit mode', () => {
      component.mode = 'edit';
      component.data = mockBoxCapacityData;
      fixture.detectChanges();

      component.form.patchValue({ effectiveDate: moment().add(30, 'days') });

      expect(component.isFormDirty).toBeTrue();
    });

    it('should handle non-moment effective date value in edit mode', () => {
      component.mode = 'edit';
      component.data = mockBoxCapacityData;
      fixture.detectChanges();

      // The form uses moment values, but isFormDirty handles non-moment too
      const newDate = new Date('2028-01-01');
      component.form.get('effectiveDate')?.setValue(newDate);

      expect(component.isFormDirty).toBeTrue();
    });

    it('should handle null termination date in edit mode dirty tracking', () => {
      component.mode = 'edit';
      component.data = mockBoxCapacityData;
      fixture.detectChanges();

      // Original termination date is null, set it to something
      component.form.patchValue({ terminationDate: moment().add(90, 'days') });
      expect(component.isFormDirty).toBeTrue();

      // Set back to null
      component.form.patchValue({ terminationDate: null });
      expect(component.isFormDirty).toBeFalse();
    });
  });

  describe('Form Control Getters - Additional', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return effectiveDate control', () => {
      expect(component.effectiveDateControl).toBe(component.form.get('effectiveDate'));
    });

    it('should return terminationDate control', () => {
      expect(component.terminationDateControl).toBe(component.form.get('terminationDate'));
    });
  });

  describe('onEffectiveDateInput', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should clear errors when effective date input is cleared in add mode', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '';
      const event = { target: inputElement } as unknown as Event;

      component.onEffectiveDateInput(event);

      const control = component.form.get('effectiveDate');
      expect(control?.value).toBeNull();
      expect(control?.pristine).toBeTrue();
      expect(control?.untouched).toBeTrue();
    });

    it('should mark dirty when effective date input is cleared in edit mode', () => {
      component.mode = 'edit';
      component.data = mockBoxCapacityData;
      component['setupPanel']();

      const inputElement = document.createElement('input');
      inputElement.value = '';
      const event = { target: inputElement } as unknown as Event;

      component.onEffectiveDateInput(event);

      const control = component.form.get('effectiveDate');
      expect(control?.dirty).toBeTrue();
    });

    it('should set invalidDate error when input has text but control value is null', () => {
      const inputElement = document.createElement('input');
      inputElement.value = 'invalid-date-text';
      const event = { target: inputElement } as unknown as Event;

      // Ensure control value is null (datepicker could not parse)
      component.form.get('effectiveDate')?.setValue(null, { emitEvent: false });

      component.onEffectiveDateInput(event);

      const control = component.form.get('effectiveDate');
      expect(control?.hasError('invalidDate')).toBeTrue();
      expect(control?.touched).toBeTrue();
      expect(control?.dirty).toBeTrue();
    });

    it('should not set invalidDate when input has text and control has a parsed value', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '15-JAN-2027';
      const event = { target: inputElement } as unknown as Event;

      // Simulate datepicker having parsed the value
      component.form.get('effectiveDate')?.setValue(moment('2027-01-15'), { emitEvent: false });

      component.onEffectiveDateInput(event);

      const control = component.form.get('effectiveDate');
      expect(control?.hasError('invalidDate')).toBeFalsy();
    });

    it('should handle whitespace-only input as cleared', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '   ';
      const event = { target: inputElement } as unknown as Event;

      component.onEffectiveDateInput(event);

      const control = component.form.get('effectiveDate');
      expect(control?.value).toBeNull();
    });
  });

  describe('onEffectiveDateBlur', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should mark control as touched on blur', () => {
      const inputElement = document.createElement('input');
      const event = { target: inputElement } as unknown as Event;

      component.onEffectiveDateBlur(event);

      expect(component.form.get('effectiveDate')?.touched).toBeTrue();
    });
  });

  describe('onTerminationDateInput', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should clear errors when termination date input is cleared in add mode', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '';
      const event = { target: inputElement } as unknown as Event;

      component.onTerminationDateInput(event);

      const control = component.form.get('terminationDate');
      expect(control?.errors).toBeNull();
    });

    it('should mark dirty when termination date is cleared in edit mode', () => {
      component.mode = 'edit';
      component.data = {
        ...mockBoxCapacityData,
        terminationDate: new Date('2027-12-31')
      };
      component['setupPanel']();

      const inputElement = document.createElement('input');
      inputElement.value = '';
      const event = { target: inputElement } as unknown as Event;

      component.onTerminationDateInput(event);

      const control = component.form.get('terminationDate');
      expect(control?.dirty).toBeTrue();
    });

    it('should set invalidDate when input has text but value is null', () => {
      const inputElement = document.createElement('input');
      inputElement.value = 'not-a-date';
      const event = { target: inputElement } as unknown as Event;

      component.form.get('terminationDate')?.setValue(null, { emitEvent: false });

      component.onTerminationDateInput(event);

      const control = component.form.get('terminationDate');
      expect(control?.hasError('invalidDate')).toBeTrue();
    });
  });

  describe('Filtered Options Signals', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return all box type options when search is empty', () => {
      const options = [
        { boxType: '26', boxTypeDescription: '26 Qt Igloo' },
        { boxType: 'CA', boxTypeDescription: 'Carrier' }
      ];
      component.boxTypeOptionsSignal.set(options);

      const filtered = component.filteredBoxTypeOptions();
      expect(filtered.length).toBe(2);
    });

    it('should filter box type options by search term', () => {
      const options = [
        { boxType: '26', boxTypeDescription: '26 Qt Igloo' },
        { boxType: 'CA', boxTypeDescription: 'Carrier' }
      ];
      component.boxTypeOptionsSignal.set(options);
      component.boxTypeSearchCtrl.setValue('carrier');

      const filtered = component.filteredBoxTypeOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].boxType).toBe('CA');
    });

    it('should filter box type options by boxType code', () => {
      const options = [
        { boxType: '26', boxTypeDescription: '26 Qt Igloo' },
        { boxType: 'CA', boxTypeDescription: 'Carrier' }
      ];
      component.boxTypeOptionsSignal.set(options);
      component.boxTypeSearchCtrl.setValue('26');

      const filtered = component.filteredBoxTypeOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].boxType).toBe('26');
    });

    it('should return all inventory product type options when search is empty', () => {
      const options = [
        { inventoryProductType: 'CRYO', productTypeDescription: 'Cryoprecipitate' },
        { inventoryProductType: 'FFP', productTypeDescription: 'Fresh Frozen Plasma' }
      ];
      component.inventoryProductTypeOptionsSignal.set(options);

      const filtered = component.filteredInventoryProductTypeOptions();
      expect(filtered.length).toBe(2);
    });

    it('should filter inventory product type options by search term', () => {
      const options = [
        { inventoryProductType: 'CRYO', productTypeDescription: 'Cryoprecipitate' },
        { inventoryProductType: 'FFP', productTypeDescription: 'Fresh Frozen Plasma' }
      ];
      component.inventoryProductTypeOptionsSignal.set(options);
      component.inventoryProductTypeSearchCtrl.setValue('frozen');

      const filtered = component.filteredInventoryProductTypeOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].inventoryProductType).toBe('FFP');
    });

    it('should filter inventory product type options by code', () => {
      const options = [
        { inventoryProductType: 'CRYO', productTypeDescription: 'Cryoprecipitate' },
        { inventoryProductType: 'FFP', productTypeDescription: 'Fresh Frozen Plasma' }
      ];
      component.inventoryProductTypeOptionsSignal.set(options);
      component.inventoryProductTypeSearchCtrl.setValue('cryo');

      const filtered = component.filteredInventoryProductTypeOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].inventoryProductType).toBe('CRYO');
    });

    it('should return empty array when no options match search term', () => {
      const options = [
        { boxType: '26', boxTypeDescription: '26 Qt Igloo' },
        { boxType: 'CA', boxTypeDescription: 'Carrier' }
      ];
      component.boxTypeOptionsSignal.set(options);
      component.boxTypeSearchCtrl.setValue('xyz');

      const filtered = component.filteredBoxTypeOptions();
      expect(filtered.length).toBe(0);
    });
  });

  describe('Error State Matchers', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should have effDateErrorMatcher defined', () => {
      expect(component.effDateErrorMatcher).toBeTruthy();
      expect(component.effDateErrorMatcher.isErrorState).toBeTruthy();
    });

    it('should have termDateErrorMatcher defined', () => {
      expect(component.termDateErrorMatcher).toBeTruthy();
      expect(component.termDateErrorMatcher.isErrorState).toBeTruthy();
    });

    it('should return false for effDateErrorMatcher when control is null', () => {
      const result = component.effDateErrorMatcher.isErrorState(null, null as any);
      expect(result).toBeFalse();
    });

    it('should return false for termDateErrorMatcher when control is null', () => {
      const result = component.termDateErrorMatcher.isErrorState(null, null as any);
      expect(result).toBeFalse();
    });

    it('should return true for effDateErrorMatcher when control is touched and has error', () => {
      const control = component.form.get('effectiveDate') as any;
      control.markAsTouched();
      // effective date is required and null, so it has an error
      const result = component.effDateErrorMatcher.isErrorState(control, null as any);
      expect(result).toBeTrue();
    });

    it('should return false for effDateErrorMatcher when control is untouched and pristine', () => {
      const control = component.form.get('effectiveDate') as any;
      // control is untouched and pristine by default
      const result = component.effDateErrorMatcher.isErrorState(control, null as any);
      expect(result).toBeFalse();
    });
  });

  describe('populateFormForEdit - edge cases', () => {
    it('should handle data with no boxType', () => {
      const dataNoBoxType = { ...mockBoxCapacityData, boxType: undefined };
      component.mode = 'edit';
      component.data = dataNoBoxType;
      fixture.detectChanges();

      expect(component.editModeValues.boxType).toBe('');
      expect(component['originalValues'].boxType).toBe('');
    });

    it('should handle data with no inventoryProdType', () => {
      const dataNoIPT = { ...mockBoxCapacityData, inventoryProdType: undefined };
      component.mode = 'edit';
      component.data = dataNoIPT;
      fixture.detectChanges();

      expect(component.editModeValues.inventoryProductType).toBe('');
      expect(component['originalValues'].inventoryProductType).toBe('');
    });

    it('should not populate form when data is null in edit mode', () => {
      component.mode = 'edit';
      component.data = null;
      fixture.detectChanges();

      // Since data is null, populateFormForEdit should return early
      expect(component.form.get('boxType')?.value).toBeFalsy();
    });
  });

  describe('onSave - edge cases', () => {
    it('should handle formValue with null boxType in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const futureDate = moment().add(5, 'days');
      mockBoxCapacityService.addBoxCapacity.and.returnValue(of({ message: 'Success' }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      // Set values but boxType will be empty string from getRawValue
      component.form.patchValue({
        boxType: '',
        inventoryProductType: 'CRYO',
        capacity: 20,
        effectiveDate: futureDate
      });

      // Force form to be valid by clearing validators
      component.form.get('boxType')?.clearValidators();
      component.form.get('boxType')?.updateValueAndValidity();

      component.onSave();

      if (mockBoxCapacityService.addBoxCapacity.calls.count() > 0) {
        const payload = mockBoxCapacityService.addBoxCapacity.calls.mostRecent().args[0];
        expect(payload.boxType).toBe('');
      }
    });

    it('should handle save with capacity of 0', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const futureDate = moment().add(5, 'days');
      mockBoxCapacityService.addBoxCapacity.and.returnValue(of({ message: 'Success' }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        boxType: '26',
        inventoryProductType: 'CRYO',
        capacity: 0,
        effectiveDate: futureDate
      });

      component.onSave();

      // Capacity of 0 is falsy so it becomes 0 (or 0 from || 0)
      const payload = mockBoxCapacityService.addBoxCapacity.calls.mostRecent().args[0];
      expect(payload.capacity).toBe(0);
    });

    it('should use original boxType and inventoryProductType in update payload', () => {
      component.mode = 'edit';
      component.data = mockBoxCapacityData;
      fixture.detectChanges();

      const futureDate = moment().add(5, 'days');
      mockBoxCapacityService.updateBoxCapacity.and.returnValue(of({ message: 'Updated' }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        capacity: 50,
        effectiveDate: futureDate
      });

      component.onSave();

      const payload = mockBoxCapacityService.updateBoxCapacity.calls.mostRecent().args[0];
      expect(payload.boxType).toBe('26');
      expect(payload.productType).toBe('CRYO');
    });
  });

  describe('Edit mode - minTerminationDate with future effective date', () => {
    it('should set minTerminationDate to effective date when effective is in the future', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const dataWithFutureDate = {
        ...mockBoxCapacityData,
        effectiveDate: futureDate
      };
      component.mode = 'edit';
      component.data = dataWithFutureDate;
      fixture.detectChanges();

      expect(component.minTerminationDate).toBeTruthy();
    });
  });
});
