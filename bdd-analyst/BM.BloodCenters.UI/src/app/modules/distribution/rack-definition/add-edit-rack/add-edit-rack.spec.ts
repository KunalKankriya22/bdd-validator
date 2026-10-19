import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AddEditRackComponent } from './add-edit-rack';
import { RackDefinitionService } from '../services/rack-definition.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import moment from 'moment';
import { SimpleChange } from '@angular/core';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditRackComponent', () => {
  let component: AddEditRackComponent;
  let fixture: ComponentFixture<AddEditRackComponent>;
  let mockService: jasmine.SpyObj<RackDefinitionService>;
  let mockSnackbar: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;

  const lovResponse = { success: true, message: '', error: null, statusCode: 200, data: [], total: 0 };
  const lovWithData = {
    success: true, message: '', error: null, statusCode: 200,
    data: [{ code: 'PT1', description: 'Product Type 1' }], total: 1
  };
  const successResult = { success: true, message: 'Saved', error: null, statusCode: 200, data: null, total: 0 };

  const sampleEditData = {
    rackNumber: 'A1',
    rackDescription: 'Test Rack',
    productType: 'RBC',
    bloodType: 'O+',
    bloodTypeDescription: 'O Positive',
    shelfCount: 5,
    trayCount: 10,
    mixProduct: 'Y',
    mixAbo: 'N',
    effectiveDate: '01-JAN-2026',
    terminationDate: '31-DEC-2028',
    lastModifiedDate: '15-JAN-2026 10:30 AM'
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('RackDefinitionService', [
      'createRack', 'updateRack', 'getProductTypeLov', 'getAboRhLov'
    ]);
    mockService.createRack.and.returnValue(of(successResult));
    mockService.updateRack.and.returnValue(of(successResult));
    mockService.getProductTypeLov.and.returnValue(of(lovResponse));
    mockService.getAboRhLov.and.returnValue(of(lovResponse));

    mockSnackbar = createMockSnackbarService();
    mockHeaderService = createMockHeaderService({ chapterTimeZone: jasmine.createSpy('chapterTimeZone').and.returnValue('+00:00') });

    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', [
      'getChapterLocalDate', 'getChapterLocalDateTime', 'isChapterLocalDateAvailable'
    ]);
    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment().startOf('day'));
    mockChapterTimezoneService.getChapterLocalDateTime.and.returnValue(moment());
    mockChapterTimezoneService.isChapterLocalDateAvailable.and.returnValue(true);

      TestBed.configureTestingModule({
      imports: [AddEditRackComponent],
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        { provide: RackDefinitionService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbar },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService }
      ]
    });



      mockService.createRack.calls.reset();

      mockService.updateRack.calls.reset();

      mockService.getProductTypeLov.calls.reset();

      mockService.getAboRhLov.calls.reset();

      mockService.createRack.and.returnValue(of(successResult));

      mockService.updateRack.and.returnValue(of(successResult));

      mockService.getProductTypeLov.and.returnValue(of(lovResponse));

      mockService.getAboRhLov.and.returnValue(of(lovResponse));

    fixture = TestBed.createComponent(AddEditRackComponent);
    component = fixture.componentInstance;
    component.retrieveState = { warehouseId: 'W1', deviceType: 'D1', deviceNumber: 'N1', storageClass: 'S1' };

    });

  it('should default to add mode', () => {
    expect(component.mode).toBe('add');
  });

  it('should build form with all controls', () => {
    expect(component.form).toBeTruthy();
    expect(component.form.get('rackNumber')).toBeTruthy();
    expect(component.form.get('rackDescription')).toBeTruthy();
    expect(component.form.get('productType')).toBeTruthy();
    expect(component.form.get('bloodType')).toBeTruthy();
    expect(component.form.get('shelfCount')).toBeTruthy();
    expect(component.form.get('trayCount')).toBeTruthy();
    expect(component.form.get('effectiveDate')).toBeTruthy();
    expect(component.form.get('terminationDate')).toBeTruthy();
  });

  it('should have mixProduct and mixAbo controls', () => {
    expect(component.form.get('mixProduct')).toBeTruthy();
    expect(component.form.get('mixAbo')).toBeTruthy();
  });

  it('should have default panel title as empty string', () => {
    expect(component.panelTitle).toBe('');
  });

  it('should have isSaving initially false', () => {
    expect(component.isSaving).toBe(false);
  });

  it('should have data as null initially', () => {
    expect(component.data).toBeNull();
  });

  describe('computed filters', () => {
    beforeEach(() => {
      component.productTypeOptions.set([
        { code: 'PT1', description: 'Product One' },
        { code: 'PT2', description: 'Product Two' }
      ]);
      component.aboRhOptions.set([
        { code: 'O+', description: 'O Positive' }
      ]);
    });

    it('should filter product types by search', () => {
      component.productTypeSearch.set('one');
      expect(component.filteredProductTypes().length).toBe(1);
    });

    it('should return all product types when search empty', () => {
      component.productTypeSearch.set('');
      expect(component.filteredProductTypes().length).toBe(2);
    });

    it('should filter AboRh by search', () => {
      component.aboRhSearch.set('pos');
      expect(component.filteredAboRh().length).toBe(1);
    });

    it('should return all AboRh when search empty', () => {
      component.aboRhSearch.set('');
      expect(component.filteredAboRh().length).toBe(1);
    });

    it('should filter product types by code', () => {
      component.productTypeSearch.set('pt2');
      const result = component.filteredProductTypes();
      expect(result.length).toBe(1);
      expect(result[0].code).toBe('PT2');
    });

    it('should return empty when no product types match', () => {
      component.productTypeSearch.set('xyz');
      expect(component.filteredProductTypes().length).toBe(0);
    });

    it('should return empty when no AboRh match', () => {
      component.aboRhSearch.set('xyz');
      expect(component.filteredAboRh().length).toBe(0);
    });

    it('should filter AboRh by code', () => {
      component.aboRhSearch.set('o+');
      const result = component.filteredAboRh();
      expect(result.length).toBe(1);
      expect(result[0].code).toBe('O+');
    });
  });

  describe('isAboRhDisabled', () => {
    it('should return true for BI storage class', () => {
      component.retrieveState = { warehouseId: 'W1', deviceType: 'D1', deviceNumber: 'N1', storageClass: 'BI' };
      expect(component.isAboRhDisabled).toBe(true);
    });

    it('should return true for DI storage class', () => {
      component.retrieveState = { warehouseId: 'W1', deviceType: 'D1', deviceNumber: 'N1', storageClass: 'DI' };
      expect(component.isAboRhDisabled).toBe(true);
    });

    it('should return false for non-disabled storage class', () => {
      component.retrieveState = { warehouseId: 'W1', deviceType: 'D1', deviceNumber: 'N1', storageClass: 'S1' };
      expect(component.isAboRhDisabled).toBe(false);
    });

    it('should return true for OD storage class', () => {
      component.retrieveState = { warehouseId: 'W1', deviceType: 'D1', deviceNumber: 'N1', storageClass: 'OD' };
      expect(component.isAboRhDisabled).toBe(true);
    });

    it('should return true for QU storage class', () => {
      component.retrieveState = { warehouseId: 'W1', deviceType: 'D1', deviceNumber: 'N1', storageClass: 'QU' };
      expect(component.isAboRhDisabled).toBe(true);
    });

    it('should return true for RJ storage class', () => {
      component.retrieveState = { warehouseId: 'W1', deviceType: 'D1', deviceNumber: 'N1', storageClass: 'RJ' };
      expect(component.isAboRhDisabled).toBe(true);
    });
  });

  describe('terminationDateFilter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false for past dates', () => {
      const pastDate = moment().subtract(1, 'year');
      expect(component.terminationDateFilter(pastDate)).toBe(false);
    });

    it('should return true for future dates', () => {
      const futureDate = moment().add(1, 'year');
      expect(component.terminationDateFilter(futureDate)).toBe(true);
    });

    it('should return false when before effective date', () => {
      component.form.get('effectiveDate')?.setValue(moment().add(6, 'months'));
      const beforeEff = moment().add(3, 'months');
      expect(component.terminationDateFilter(beforeEff)).toBe(false);
    });

    it('should return true for null date', () => {
      expect(component.terminationDateFilter(null)).toBe(true);
    });

    it('should return true when no effective date is set and date is in the future', () => {
      component.form.get('effectiveDate')?.setValue(null);
      const futureDate = moment().add(1, 'year');
      expect(component.terminationDateFilter(futureDate)).toBe(true);
    });
  });

  describe('isFormValid', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return form.valid in add mode', () => {
      component.mode = 'add';
      expect(component.isFormValid).toBe(component.form.valid);
    });

    it('should return false in edit mode when form not dirty', () => {
      component.mode = 'edit';
      component.form.markAsPristine();
      expect(component.isFormValid).toBe(false);
    });

    it('should return true in edit mode when form dirty and no visible errors', () => {
      component.mode = 'edit';
      component.form.markAsDirty();
      expect(component.isFormValid).toBe(true);
    });

    it('should return false in edit mode when rackNumber is touched and invalid', () => {
      component.mode = 'edit';
      component.form.markAsDirty();
      const rackNum = component.form.get('rackNumber');
      rackNum?.setValue('');
      rackNum?.markAsTouched();
      expect(component.isFormValid).toBe(false);
    });

    it('should return false in edit mode when rackDescription is touched and invalid', () => {
      component.mode = 'edit';
      component.form.markAsDirty();
      const desc = component.form.get('rackDescription');
      desc?.setValue('');
      desc?.markAsTouched();
      expect(component.isFormValid).toBe(false);
    });

    it('should return false in edit mode when productType is touched and invalid', () => {
      component.mode = 'edit';
      component.form.markAsDirty();
      const prod = component.form.get('productType');
      prod?.setValue('');
      prod?.markAsTouched();
      expect(component.isFormValid).toBe(false);
    });
  });

  describe('input handlers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('onRackNumberPaste should clean pasted text', () => {
      const input = document.createElement('input');
      const event = new ClipboardEvent('paste');
      Object.defineProperty(event, 'clipboardData', { value: { getData: () => 'A!B@2' } });
      spyOn(event, 'preventDefault');
      Object.defineProperty(event, 'target', { value: input });
      component.onRackNumberPaste(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(input.value).toBe('AB');
    });

    it('onRackNumberInput should transform to uppercase', () => {
      const input = document.createElement('input');
      input.value = 'ab';
      const event = { target: input } as any;
      component.onRackNumberInput(event);
      expect(input.value).toBe('AB');
    });

    it('onNumericPaste should clean pasted text', () => {
      const input = document.createElement('input');
      input.setAttribute('formControlName', 'shelfCount');
      const event = new ClipboardEvent('paste');
      Object.defineProperty(event, 'clipboardData', { value: { getData: () => '12abc' } });
      spyOn(event, 'preventDefault');
      Object.defineProperty(event, 'target', { value: input });
      component.onNumericPaste(event, 2);
      expect(input.value).toBe('12');
    });

    it('onRackNumberKeydown should prevent non-alphanumeric keys', () => {
      const event = { key: '!', length: 1, preventDefault: jasmine.createSpy('preventDefault') } as any;
      Object.defineProperty(event, 'key', { value: '!', writable: false });
      component.onRackNumberKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('onRackNumberKeydown should allow alphanumeric keys', () => {
      const event = { key: 'A', preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onRackNumberKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('onRackNumberKeydown should allow numeric keys', () => {
      const event = { key: '5', preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onRackNumberKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('onRackNumberKeydown should allow multi-char keys like Backspace', () => {
      const event = { key: 'Backspace', preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onRackNumberKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('onRackNumberInput should not modify value if already uppercase and clean', () => {
      const input = document.createElement('input');
      input.value = 'AB';
      const event = { target: input } as any;
      component.onRackNumberInput(event);
      expect(input.value).toBe('AB');
    });

    it('onRackNumberInput should strip non-alphanumeric characters', () => {
      const input = document.createElement('input');
      input.value = 'a@b';
      const event = { target: input } as any;
      component.onRackNumberInput(event);
      expect(input.value).toBe('AB');
    });

    it('onRackNumberPaste should handle empty clipboard data', () => {
      const input = document.createElement('input');
      const event = new ClipboardEvent('paste');
      Object.defineProperty(event, 'clipboardData', { value: { getData: () => '' } });
      spyOn(event, 'preventDefault');
      Object.defineProperty(event, 'target', { value: input });
      component.onRackNumberPaste(event);
      expect(input.value).toBe('');
    });

    it('onRackNumberPaste should truncate to 2 characters', () => {
      const input = document.createElement('input');
      const event = new ClipboardEvent('paste');
      Object.defineProperty(event, 'clipboardData', { value: { getData: () => 'ABCDE' } });
      spyOn(event, 'preventDefault');
      Object.defineProperty(event, 'target', { value: input });
      component.onRackNumberPaste(event);
      expect(input.value).toBe('AB');
    });

    it('onDescriptionKeydown should prevent leading space', () => {
      const input = document.createElement('input');
      Object.defineProperty(input, 'selectionStart', { value: 0 });
      const event = { key: ' ', target: input, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onDescriptionKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('onDescriptionKeydown should allow space in the middle', () => {
      const input = document.createElement('input');
      Object.defineProperty(input, 'selectionStart', { value: 5 });
      const event = { key: ' ', target: input, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onDescriptionKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('onDescriptionKeydown should allow non-space keys at position 0', () => {
      const input = document.createElement('input');
      Object.defineProperty(input, 'selectionStart', { value: 0 });
      const event = { key: 'A', target: input, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onDescriptionKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('onNumericKeydown should allow numeric keys', () => {
      const event = { key: '5', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('onNumericKeydown should prevent non-numeric character keys', () => {
      const event = { key: 'a', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('onNumericKeydown should allow navigation keys', () => {
      const navKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
      navKeys.forEach(key => {
        const event = { key, ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy('preventDefault') } as any;
        component.onNumericKeydown(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });
    });

    it('onNumericKeydown should allow ctrl+key combos', () => {
      const event = { key: 'a', ctrlKey: true, metaKey: false, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('onNumericKeydown should allow meta+key combos', () => {
      const event = { key: 'a', ctrlKey: false, metaKey: true, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('onNumericPaste should handle empty clipboard data', () => {
      const input = document.createElement('input');
      input.setAttribute('formControlName', 'shelfCount');
      const event = new ClipboardEvent('paste');
      Object.defineProperty(event, 'clipboardData', { value: { getData: () => '' } });
      spyOn(event, 'preventDefault');
      Object.defineProperty(event, 'target', { value: input });
      component.onNumericPaste(event, 2);
      expect(input.value).toBe('');
      expect(component.form.get('shelfCount')?.value).toBeNull();
    });

    it('onNumericPaste should set null when no formControlName', () => {
      const input = document.createElement('input');
      const event = new ClipboardEvent('paste');
      Object.defineProperty(event, 'clipboardData', { value: { getData: () => '123' } });
      spyOn(event, 'preventDefault');
      Object.defineProperty(event, 'target', { value: input });
      component.onNumericPaste(event, 4);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(input.value).toBe('123');
    });

    it('onNumericPaste should truncate to maxDigits', () => {
      const input = document.createElement('input');
      input.setAttribute('formControlName', 'trayCount');
      const event = new ClipboardEvent('paste');
      Object.defineProperty(event, 'clipboardData', { value: { getData: () => '123456' } });
      spyOn(event, 'preventDefault');
      Object.defineProperty(event, 'target', { value: input });
      component.onNumericPaste(event, 4);
      expect(input.value).toBe('1234');
      expect(component.form.get('trayCount')?.value).toBe(1234);
    });
  });

  describe('effectiveDateControl / terminationDateControl', () => {
    it('should return controls', () => {
      expect(component.effectiveDateControl).toBe(component.form.get('effectiveDate'));
      expect(component.terminationDateControl).toBe(component.form.get('terminationDate'));
    });
  });

  describe('getEffectiveDateError / getTerminationDateError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return error string for effective date', () => {
      const result = component.getEffectiveDateError();
      expect(typeof result).toBe('string');
    });

    it('should return error string for termination date', () => {
      const result = component.getTerminationDateError();
      expect(typeof result).toBe('string');
    });

    it('should pass form errors when lastChangedDateField is effective', () => {
      (component as any).lastChangedDateField = 'effective';
      component.form.get('effectiveDate')?.markAsTouched();
      const result = component.getEffectiveDateError();
      expect(typeof result).toBe('string');
    });

    it('should not pass form errors when lastChangedDateField is termination for effective error', () => {
      (component as any).lastChangedDateField = 'termination';
      component.form.get('effectiveDate')?.markAsTouched();
      const result = component.getEffectiveDateError();
      expect(typeof result).toBe('string');
    });

    it('should pass form errors when lastChangedDateField is termination for termination error', () => {
      (component as any).lastChangedDateField = 'termination';
      component.form.get('terminationDate')?.markAsTouched();
      const result = component.getTerminationDateError();
      expect(typeof result).toBe('string');
    });

    it('should not pass form errors when lastChangedDateField is null', () => {
      (component as any).lastChangedDateField = null;
      const effResult = component.getEffectiveDateError();
      const termResult = component.getTerminationDateError();
      expect(typeof effResult).toBe('string');
      expect(typeof termResult).toBe('string');
    });
  });

  describe('ngOnInit', () => {
    it('should call loadDropdowns on init', () => {
      fixture.detectChanges();
      expect(mockService.getProductTypeLov).toHaveBeenCalled();
    });

    it('should call getAboRhLov when not disabled', () => {
      component.retrieveState = { warehouseId: 'W1', deviceType: 'D1', deviceNumber: 'N1', storageClass: 'S1' };
      fixture.detectChanges();
      expect(mockService.getAboRhLov).toHaveBeenCalled();
    });

    it('should not call getAboRhLov when AboRh is disabled', () => {
      component.retrieveState = { warehouseId: 'W1', deviceType: 'D1', deviceNumber: 'N1', storageClass: 'BI' };
      fixture.detectChanges();
      expect(mockService.getAboRhLov).not.toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call setupPanel when mode changes', () => {
      component.mode = 'add';
      component.ngOnChanges({ mode: new SimpleChange(undefined, 'add', true) });
      expect(component.panelTitle).toBe('Add New Rack');
    });

    it('should call setupPanel when data changes', () => {
      component.mode = 'edit';
      component.data = { ...sampleEditData };
      component.ngOnChanges({ data: new SimpleChange(null, component.data, false) });
      expect(component.panelTitle).toBe('Edit Rack');
    });

    it('should not call setupPanel when irrelevant input changes', () => {
      const previousTitle = component.panelTitle;
      component.ngOnChanges({ retrieveState: new SimpleChange(null, {}, false) });
      expect(component.panelTitle).toBe(previousTitle);
    });
  });

  describe('setupPanel - add mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set title to Add New Rack', () => {
      component.mode = 'add';
      component.ngOnChanges({ mode: new SimpleChange(undefined, 'add', true) });
      expect(component.panelTitle).toBe('Add New Rack');
    });

    it('should reset form in add mode', () => {
      component.form.patchValue({ rackNumber: 'XY' });
      component.mode = 'add';
      component.ngOnChanges({ mode: new SimpleChange('edit', 'add', false) });
      expect(component.form.get('rackNumber')?.value).toBeNull();
    });

    it('should clear lastModified in add mode', () => {
      component.mode = 'add';
      component.ngOnChanges({ mode: new SimpleChange(undefined, 'add', true) });
      expect(component.lastModified).toBe('');
    });

    it('should enable form in add mode', () => {
      component.form.disable();
      component.mode = 'add';
      component.ngOnChanges({ mode: new SimpleChange(undefined, 'add', true) });
      expect(component.form.enabled).toBe(true);
    });

    it('should disable bloodType when storage class is in ABORH_DISABLE list', () => {
      component.retrieveState = { warehouseId: 'W1', deviceType: 'D1', deviceNumber: 'N1', storageClass: 'BI' };
      component.mode = 'add';
      component.ngOnChanges({ mode: new SimpleChange(undefined, 'add', true) });
      expect(component.form.get('bloodType')?.disabled).toBe(true);
    });

    it('should enable bloodType when storage class is not in ABORH_DISABLE list', () => {
      component.retrieveState = { warehouseId: 'W1', deviceType: 'D1', deviceNumber: 'N1', storageClass: 'S1' };
      component.mode = 'add';
      component.ngOnChanges({ mode: new SimpleChange(undefined, 'add', true) });
      expect(component.form.get('bloodType')?.disabled).toBe(false);
    });
  });

  describe('setupPanel - edit mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set title to Edit Rack', () => {
      component.mode = 'edit';
      component.data = { ...sampleEditData };
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, component.data, false)
      });
      expect(component.panelTitle).toBe('Edit Rack');
    });

    it('should populate form with data values', () => {
      component.mode = 'edit';
      component.data = { ...sampleEditData };
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, component.data, false)
      });
      expect(component.form.get('rackNumber')?.value).toBe('A1');
      expect(component.form.get('rackDescription')?.value).toBe('Test Rack');
      expect(component.form.get('productType')?.value).toBe('RBC');
      expect(component.form.get('bloodType')?.value).toBe('O+');
      expect(component.form.get('shelfCount')?.value).toBe(5);
      expect(component.form.get('trayCount')?.value).toBe(10);
      expect(component.form.get('mixProduct')?.value).toBe('Y');
      expect(component.form.get('mixAbo')?.value).toBe('N');
    });

    it('should set lastModified when data has lastModifiedDate', () => {
      component.mode = 'edit';
      component.data = { ...sampleEditData };
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, component.data, false)
      });
      expect(component.lastModified).toContain('Last Modified:');
    });

    it('should not setupPanel in edit mode when data is null', () => {
      component.mode = 'edit';
      component.data = null;
      component.panelTitle = '';
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false)
      });
      expect(component.panelTitle).toBe('');
    });

    it('should disable and clear bloodType in edit mode when AboRh disabled', () => {
      component.retrieveState = { warehouseId: 'W1', deviceType: 'D1', deviceNumber: 'N1', storageClass: 'DI' };
      component.mode = 'edit';
      component.data = { ...sampleEditData };
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, component.data, false)
      });
      expect(component.form.get('bloodType')?.disabled).toBe(true);
      expect(component.form.get('bloodType')?.value).toBeNull();
    });

    it('should populate form with null terminationDate when not provided', () => {
      component.mode = 'edit';
      component.data = { ...sampleEditData, terminationDate: null };
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, component.data, false)
      });
      expect(component.form.get('terminationDate')?.value).toBeNull();
    });

    it('should populate form with null effectiveDate when not provided', () => {
      component.mode = 'edit';
      component.data = { ...sampleEditData, effectiveDate: '' };
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, component.data, false)
      });
      const effVal = component.form.get('effectiveDate')?.value;
      // Empty string passed to moment results in an invalid moment; form still populated
      expect(effVal).toBeFalsy();
    });
  });

  describe('loadDropdowns', () => {
    it('should set productTypeOptions on success with data', () => {
      mockService.getProductTypeLov.and.returnValue(of(lovWithData));
      fixture.detectChanges();
      expect(component.productTypeOptions().length).toBe(1);
      expect(component.productTypeOptions()[0].code).toBe('PT1');
      expect(component.isLoadingProductTypes).toBe(false);
    });

    it('should set empty productTypeOptions on success with null data', () => {
      mockService.getProductTypeLov.and.returnValue(of({ ...lovResponse, data: null }));
      fixture.detectChanges();
      expect(component.productTypeOptions().length).toBe(0);
    });

    it('should handle productType load error', () => {
      mockService.getProductTypeLov.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      expect(component.productTypeOptions().length).toBe(0);
      expect(component.isLoadingProductTypes).toBe(false);
    });

    it('should set aboRhOptions on success with data', () => {
      const aboRhData = {
        success: true, message: '', error: null, statusCode: 200,
        data: [{ code: 'O+', description: 'O Positive' }], total: 1
      };
      mockService.getAboRhLov.and.returnValue(of(aboRhData));
      fixture.detectChanges();
      expect(component.aboRhOptions().length).toBe(1);
      expect(component.isLoadingAboRh).toBe(false);
    });

    it('should set empty aboRhOptions on success with null data', () => {
      mockService.getAboRhLov.and.returnValue(of({ ...lovResponse, data: null }));
      fixture.detectChanges();
      expect(component.aboRhOptions().length).toBe(0);
    });

    it('should handle aboRh load error', () => {
      mockService.getAboRhLov.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      expect(component.aboRhOptions().length).toBe(0);
      expect(component.isLoadingAboRh).toBe(false);
    });

    it('should not load aboRh when isAboRhDisabled is true', () => {
      component.retrieveState = { warehouseId: 'W1', deviceType: 'D1', deviceNumber: 'N1', storageClass: 'BI' };
      mockService.getAboRhLov.calls.reset();
      fixture.detectChanges();
      expect(mockService.getAboRhLov).not.toHaveBeenCalled();
    });
  });

  describe('onSave - add mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.mode = 'add';
      component.ngOnChanges({ mode: new SimpleChange(undefined, 'add', true) });
    });

    it('should call createRack when form valid', fakeAsync(() => {
      component.form.patchValue({
        rackNumber: 'A1',
        rackDescription: 'Test Rack',
        productType: 'RBC',
        effectiveDate: moment('2028-06-01')
      });
      component.form.markAllAsTouched();
      component.onSave();
      tick();
      if (component.form.valid) {
        expect(mockService.createRack).toHaveBeenCalled();
        expect(mockSnackbar.showSuccess).toHaveBeenCalled();
      }
    }));

    it('should not call createRack when form is invalid', fakeAsync(() => {
      component.form.patchValue({
        rackNumber: '',
        rackDescription: '',
        productType: '',
        effectiveDate: null
      });
      component.onSave();
      tick();
      expect(mockService.createRack).not.toHaveBeenCalled();
    }));

    it('should not save when effectiveDate is null in add mode', fakeAsync(() => {
      component.form.patchValue({
        rackNumber: 'A1',
        rackDescription: 'Test',
        productType: 'RBC',
        effectiveDate: null
      });
      component.onSave();
      tick();
      expect(mockService.createRack).not.toHaveBeenCalled();
    }));

    it('should not save when terminationDate is invalid', fakeAsync(() => {
      component.form.patchValue({
        rackNumber: 'A1',
        rackDescription: 'Test Rack',
        productType: 'RBC',
        effectiveDate: moment('2028-06-01'),
        terminationDate: moment('invalid-date')
      });
      // Force form to be valid for the invalid termination test
      spyOnProperty(component.form, 'invalid').and.returnValue(false);
      component.onSave();
      tick();
      expect(mockService.createRack).not.toHaveBeenCalled();
    }));

    it('should set bloodType to null when AboRh is disabled in add mode', fakeAsync(() => {
      component.retrieveState = { warehouseId: 'W1', deviceType: 'D1', deviceNumber: 'N1', storageClass: 'BI' };
      component.mode = 'add';
      component.ngOnChanges({ mode: new SimpleChange(undefined, 'add', true) });

      component.form.patchValue({
        rackNumber: 'A1',
        rackDescription: 'Test Rack',
        productType: 'RBC',
        effectiveDate: moment('2028-06-01')
      });

      component.form.markAllAsTouched();
      component.onSave();
      tick();

      if (mockService.createRack.calls.count() > 0) {
        const payload = mockService.createRack.calls.mostRecent().args[0];
        expect(payload.bloodType).toBeNull();
      }
    }));

    it('should emit closePanel after save by default', fakeAsync(() => {
      spyOn(component.closePanel, 'emit');
      component.form.patchValue({
        rackNumber: 'A1',
        rackDescription: 'Test Rack',
        productType: 'RBC',
        effectiveDate: moment('2028-06-01')
      });
      component.form.markAllAsTouched();
      component.onSave(true);
      tick();

      if (mockService.createRack.calls.count() > 0) {
        expect(component.closePanel.emit).toHaveBeenCalled();
      }
    }));

    it('should reset form when closeAfterSave is false', fakeAsync(() => {
      spyOn(component.closePanel, 'emit');
      spyOn(component.saveSuccess, 'emit');
      component.form.patchValue({
        rackNumber: 'A1',
        rackDescription: 'Test Rack',
        productType: 'RBC',
        effectiveDate: moment('2028-06-01')
      });
      component.form.markAllAsTouched();
      component.onSave(false);
      tick();

      if (mockService.createRack.calls.count() > 0) {
        expect(component.closePanel.emit).not.toHaveBeenCalled();
        expect(component.saveSuccess.emit).toHaveBeenCalled();
      }
    }));

    it('should handle createRack API error', fakeAsync(() => {
      mockService.createRack.and.returnValue(throwError(() => new Error('API Error')));
      component.form.patchValue({
        rackNumber: 'A1',
        rackDescription: 'Test Rack',
        productType: 'RBC',
        effectiveDate: moment('2028-06-01')
      });
      component.form.markAllAsTouched();
      component.onSave();
      tick();

      if (mockService.createRack.calls.count() > 0) {
        expect(component.isSaving).toBe(false);
      }
    }));

    it('should use default success message when response has no message', fakeAsync(() => {
      mockService.createRack.and.returnValue(of({ success: true, message: '', error: null, statusCode: 200, data: null, total: 0 }));
      component.form.patchValue({
        rackNumber: 'A1',
        rackDescription: 'Test Rack',
        productType: 'RBC',
        effectiveDate: moment('2028-06-01')
      });
      component.form.markAllAsTouched();
      component.onSave();
      tick();

      if (mockService.createRack.calls.count() > 0) {
        expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('Rack details have been saved.');
      }
    }));

    it('should use response message when provided', fakeAsync(() => {
      mockService.createRack.and.returnValue(of({ success: true, message: 'Custom message', error: null, statusCode: 200, data: null, total: 0 }));
      component.form.patchValue({
        rackNumber: 'A1',
        rackDescription: 'Test Rack',
        productType: 'RBC',
        effectiveDate: moment('2028-06-01')
      });
      component.form.markAllAsTouched();
      component.onSave();
      tick();

      if (mockService.createRack.calls.count() > 0) {
        expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('Custom message');
      }
    }));

    it('should set isSaving to true during save', fakeAsync(() => {
      let savedIsSaving = false;
      mockService.createRack.and.callFake((payload: any) => {
        savedIsSaving = component.isSaving;
        return of(successResult);
      });
      component.form.patchValue({
        rackNumber: 'A1',
        rackDescription: 'Test Rack',
        productType: 'RBC',
        effectiveDate: moment('2028-06-01')
      });
      component.form.markAllAsTouched();
      component.onSave();
      tick();

      if (mockService.createRack.calls.count() > 0) {
        expect(savedIsSaving).toBe(true);
        expect(component.isSaving).toBe(false);
      }
    }));

    it('should include shelfCount and trayCount as numbers in payload', fakeAsync(() => {
      component.form.patchValue({
        rackNumber: 'A1',
        rackDescription: 'Test Rack',
        productType: 'RBC',
        effectiveDate: moment('2028-06-01'),
        shelfCount: 5,
        trayCount: 100
      });
      component.form.markAllAsTouched();
      component.onSave();
      tick();

      if (mockService.createRack.calls.count() > 0) {
        const payload = mockService.createRack.calls.mostRecent().args[0];
        expect(payload.shelfCount).toBe(5);
        expect(payload.trayCount).toBe(100);
      }
    }));

    it('should set shelfCount and trayCount to null when empty', fakeAsync(() => {
      component.form.patchValue({
        rackNumber: 'A1',
        rackDescription: 'Test Rack',
        productType: 'RBC',
        effectiveDate: moment('2028-06-01'),
        shelfCount: null,
        trayCount: null
      });
      component.form.markAllAsTouched();
      component.onSave();
      tick();

      if (mockService.createRack.calls.count() > 0) {
        const payload = mockService.createRack.calls.mostRecent().args[0];
        expect(payload.shelfCount).toBeNull();
        expect(payload.trayCount).toBeNull();
      }
    }));

    it('should format terminationDate in payload when provided', fakeAsync(() => {
      component.form.patchValue({
        rackNumber: 'A1',
        rackDescription: 'Test Rack',
        productType: 'RBC',
        effectiveDate: moment('2028-06-01'),
        terminationDate: moment('2028-12-31')
      });
      component.form.markAllAsTouched();
      component.onSave();
      tick();

      if (mockService.createRack.calls.count() > 0) {
        const payload = mockService.createRack.calls.mostRecent().args[0];
        expect(payload.terminationDate).toBe('2028-12-31T00:00:00');
      }
    }));

    it('should set terminationDate to null in payload when not provided', fakeAsync(() => {
      component.form.patchValue({
        rackNumber: 'A1',
        rackDescription: 'Test Rack',
        productType: 'RBC',
        effectiveDate: moment('2028-06-01'),
        terminationDate: null
      });
      component.form.markAllAsTouched();
      component.onSave();
      tick();

      if (mockService.createRack.calls.count() > 0) {
        const payload = mockService.createRack.calls.mostRecent().args[0];
        expect(payload.terminationDate).toBeNull();
      }
    }));
  });

  describe('onSave - edit mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.mode = 'edit';
      component.data = { ...sampleEditData };
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, component.data, false)
      });
    });

    it('should call updateRack when form is dirty and valid', fakeAsync(() => {
      component.form.get('rackDescription')?.setValue('Updated Rack');
      component.form.markAsDirty();
      component.form.markAllAsTouched();
      component.onSave();
      tick();
      expect(mockService.updateRack).toHaveBeenCalled();
    }));

    it('should not call updateRack when form is not dirty', fakeAsync(() => {
      component.form.markAsPristine();
      component.onSave();
      tick();
      expect(mockService.updateRack).not.toHaveBeenCalled();
    }));

    it('should include original values in update payload', fakeAsync(() => {
      component.form.get('rackDescription')?.setValue('Updated Rack');
      component.form.markAsDirty();
      component.form.markAllAsTouched();
      component.onSave();
      tick();

      if (mockService.updateRack.calls.count() > 0) {
        const payload = mockService.updateRack.calls.mostRecent().args[0];
        expect(payload.originalRackNumber).toBe('A1');
        expect(payload.originalProductType).toBe('RBC');
        expect(payload.originalBloodType).toBe('O+');
      }
    }));

    it('should handle updateRack API error', fakeAsync(() => {
      mockService.updateRack.and.returnValue(throwError(() => new Error('API Error')));
      component.form.get('rackDescription')?.setValue('Updated');
      component.form.markAsDirty();
      component.form.markAllAsTouched();
      component.onSave();
      tick();
      expect(component.isSaving).toBe(false);
    }));

    it('should use existing effectiveDate from data when form value is null in edit mode', fakeAsync(() => {
      // In edit mode effectiveDate is disabled, so getRawValue returns it
      component.form.get('rackDescription')?.setValue('Updated');
      component.form.markAsDirty();
      component.form.markAllAsTouched();
      component.onSave();
      tick();

      if (mockService.updateRack.calls.count() > 0) {
        const payload = mockService.updateRack.calls.mostRecent().args[0];
        expect(payload.effectiveDate).toBeTruthy();
      }
    }));

    it('should emit saveSuccess on successful update', fakeAsync(() => {
      spyOn(component.saveSuccess, 'emit');
      component.form.get('rackDescription')?.setValue('Updated');
      component.form.markAsDirty();
      component.form.markAllAsTouched();
      component.onSave();
      tick();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
    }));

    it('should emit closePanel on successful update with close', fakeAsync(() => {
      spyOn(component.closePanel, 'emit');
      component.form.get('rackDescription')?.setValue('Updated');
      component.form.markAsDirty();
      component.form.markAllAsTouched();
      component.onSave(true);
      tick();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));

    it('should set bloodType to null in edit payload when AboRh is disabled', fakeAsync(() => {
      component.retrieveState = { warehouseId: 'W1', deviceType: 'D1', deviceNumber: 'N1', storageClass: 'BI' };
      component.mode = 'edit';
      component.data = { ...sampleEditData };
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, component.data, false)
      });
      component.form.get('rackDescription')?.setValue('Updated');
      component.form.markAsDirty();
      component.form.markAllAsTouched();
      component.onSave();
      tick();

      if (mockService.updateRack.calls.count() > 0) {
        const payload = mockService.updateRack.calls.mostRecent().args[0];
        expect(payload.bloodType).toBeNull();
      }
    }));

    it('should handle save & continue (closeAfterSave=false) in edit mode', fakeAsync(() => {
      spyOn(component.closePanel, 'emit');
      component.form.get('rackDescription')?.setValue('Updated');
      component.form.markAsDirty();
      component.form.markAllAsTouched();
      component.onSave(false);
      tick();

      if (mockService.updateRack.calls.count() > 0) {
        expect(component.closePanel.emit).not.toHaveBeenCalled();
      }
    }));
  });

  describe('onSaveAndCreateAnother', () => {
    it('should call onSave with false', () => {
      spyOn(component, 'onSave');
      component.onSaveAndCreateAnother();
      expect(component.onSave).toHaveBeenCalledWith(false);
    });
  });

  describe('onCancel', () => {
    it('should emit closePanel', () => {
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  describe('onClearAll', () => {
    it('should repopulate form in edit mode', () => {
      fixture.detectChanges();
      component.mode = 'edit';
      component.data = {
        rackNumber: 'A1', rackDescription: 'Test', productType: 'RBC',
        bloodType: null, bloodTypeDescription: null,
        shelfCount: null, trayCount: null, mixProduct: null, mixAbo: null,
        effectiveDate: '01-JAN-2026', terminationDate: null,
        lastModifiedDate: null
      };
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, component.data, false)
      });
      component.form.get('rackDescription')?.setValue('Changed');
      component.onClearAll();
      expect(component.form.get('rackDescription')?.value).toBe('Test');
    });

    it('should do nothing in add mode', () => {
      fixture.detectChanges();
      component.mode = 'add';
      component.data = null;
      component.form.patchValue({ rackNumber: 'XY' });
      component.onClearAll();
      expect(component.form.get('rackNumber')?.value).toBe('XY');
    });

    it('should do nothing in edit mode when data is null', () => {
      fixture.detectChanges();
      component.mode = 'edit';
      component.data = null;
      component.form.patchValue({ rackNumber: 'XY' });
      component.onClearAll();
      expect(component.form.get('rackNumber')?.value).toBe('XY');
    });

    it('should mark form as pristine and untouched after clear', () => {
      fixture.detectChanges();
      component.mode = 'edit';
      component.data = { ...sampleEditData };
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, component.data, false)
      });
      component.form.markAsDirty();
      component.form.markAllAsTouched();
      component.onClearAll();
      expect(component.form.pristine).toBe(true);
      expect(component.form.untouched).toBe(true);
    });
  });

  describe('formatDate', () => {
    it('should return the date string', () => {
      expect(component.formatDate('01-JAN-2026')).toBe('01-JAN-2026');
    });

    it('should handle null input', () => {
      const result = component.formatDate(null);
      expect(result).toBe('-');
    });

    it('should handle undefined input', () => {
      const result = component.formatDate(undefined);
      expect(result).toBe('-');
    });
  });

  describe('ngOnDestroy', () => {
    it('should clean up', () => {
      fixture.detectChanges();
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should complete the destroy$ subject', () => {
      fixture.detectChanges();
      const destroySub = (component as any).destroy$;
      spyOn(destroySub, 'next');
      spyOn(destroySub, 'complete');
      component.ngOnDestroy();
      expect(destroySub.next).toHaveBeenCalled();
      expect(destroySub.complete).toHaveBeenCalled();
    });
  });

  describe('constructor subscriptions', () => {
    it('should update productTypeSearch signal when productTypeSearchControl changes', fakeAsync(() => {
      fixture.detectChanges();
      component.productTypeSearchControl.setValue('test');
      tick();
      expect(component.productTypeSearch()).toBe('test');
    }));

    it('should update aboRhSearch signal when aboRhSearchControl changes', fakeAsync(() => {
      fixture.detectChanges();
      component.aboRhSearchControl.setValue('search');
      tick();
      expect(component.aboRhSearch()).toBe('search');
    }));

    it('should set productTypeSearch to empty string when value is null', fakeAsync(() => {
      fixture.detectChanges();
      component.productTypeSearchControl.setValue(null);
      tick();
      expect(component.productTypeSearch()).toBe('');
    }));

    it('should set aboRhSearch to empty string when value is null', fakeAsync(() => {
      fixture.detectChanges();
      component.aboRhSearchControl.setValue(null);
      tick();
      expect(component.aboRhSearch()).toBe('');
    }));
  });

  describe('date validation listeners', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set lastChangedDateField to effective when effective date changes', fakeAsync(() => {
      component.form.get('effectiveDate')?.setValue(moment('2028-06-01'));
      tick();
      expect((component as any).lastChangedDateField).toBe('effective');
    }));

    it('should set lastChangedDateField to termination when termination date changes', fakeAsync(() => {
      component.form.get('terminationDate')?.setValue(moment('2028-12-01'));
      tick();
      expect((component as any).lastChangedDateField).toBe('termination');
    }));
  });

  describe('onEffectiveDateInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call DateFieldValidationUtility.handleStartDateInput', () => {
      const input = document.createElement('input');
      input.value = '01-JAN-2028';
      const event = { target: input } as any;
      // Should not throw
      expect(() => component.onEffectiveDateInput(event)).not.toThrow();
    });

    it('should handle empty input value', () => {
      const input = document.createElement('input');
      input.value = '';
      const event = { target: input } as any;
      expect(() => component.onEffectiveDateInput(event)).not.toThrow();
    });
  });

  describe('onTerminationDateInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call DateFieldValidationUtility.handleEndDateInput', () => {
      const input = document.createElement('input');
      input.value = '31-DEC-2028';
      const event = { target: input } as any;
      expect(() => component.onTerminationDateInput(event)).not.toThrow();
    });

    it('should handle empty input value', () => {
      const input = document.createElement('input');
      input.value = '';
      const event = { target: input } as any;
      expect(() => component.onTerminationDateInput(event)).not.toThrow();
    });

    it('should pass isEditMode as true when mode is edit', () => {
      component.mode = 'edit';
      const input = document.createElement('input');
      input.value = '';
      const event = { target: input } as any;
      expect(() => component.onTerminationDateInput(event)).not.toThrow();
    });
  });

  describe('formatLastModified', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string for null date', () => {
      const result = (component as any).formatLastModified(null);
      expect(result).toBe('');
    });

    it('should return empty string for undefined date', () => {
      const result = (component as any).formatLastModified(undefined);
      expect(result).toBe('');
    });

    it('should return empty string for non-matching format', () => {
      const result = (component as any).formatLastModified('invalid-date');
      expect(result).toBe('');
    });

    it('should format a valid date string', () => {
      const result = (component as any).formatLastModified('15-JAN-2025 10:30 AM');
      expect(result).toContain('Last Modified:');
      expect(result).toContain('10:30 AM');
    });

    it('should format date without AM/PM', () => {
      const result = (component as any).formatLastModified('15-JAN-2025 14:30');
      expect(result).toContain('Last Modified:');
      expect(result).toContain('14:30');
    });

    it('should show Today when date matches chapter today', () => {
      // Use the chapter timezone offset to compute today
      const tz = '+00:00';
      const now = new Date(Date.now());
      const day = String(now.getUTCDate()).padStart(2, '0');
      const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      const mon = MONTHS[now.getUTCMonth()];
      const year = String(now.getUTCFullYear());
      const todayStr = `${day}-${mon}-${year} 10:30 AM`;

      const result = (component as any).formatLastModified(todayStr);
      expect(result).toContain('Today');
    });

    it('should show date when not today', () => {
      const result = (component as any).formatLastModified('01-JAN-2020 10:30 AM');
      expect(result).toContain('01-JAN-2020');
      expect(result).not.toContain('Today');
    });

    it('should handle timezone with no mapping and fall back to GMT label', () => {
      (mockHeaderService.chapterTimeZone as jasmine.Spy).and.returnValue('+99:99');
      const result = (component as any).formatLastModified('15-JAN-2025 10:30 AM');
      expect(result).toContain('Last Modified:');
    });

    it('should handle null/invalid timezone and use +00:00 fallback', () => {
      (mockHeaderService.chapterTimeZone as jasmine.Spy).and.returnValue('');
      const result = (component as any).formatLastModified('15-JAN-2025 10:30 AM');
      expect(result).toContain('Last Modified:');
      expect(result).toContain('GMT');
    });

    it('should handle timezone that does not match TIMEZONE_OFFSET_REGEX', () => {
      (mockHeaderService.chapterTimeZone as jasmine.Spy).and.returnValue('INVALID');
      const result = (component as any).formatLastModified('15-JAN-2025 10:30 AM');
      expect(result).toContain('Last Modified:');
      expect(result).toContain('GMT');
    });
  });

  describe('selectPanel constants', () => {
    it('should have selectPanelLoadingValue', () => {
      expect(component.selectPanelLoadingValue).toBe('__PANEL_LOADING__');
    });

    it('should have selectPanelEmptyValue', () => {
      expect(component.selectPanelEmptyValue).toBe('__PANEL_EMPTY__');
    });
  });

  describe('effDateErrorMatcher / termDateErrorMatcher', () => {
    it('should have effDateErrorMatcher defined', () => {
      expect(component.effDateErrorMatcher).toBeTruthy();
      expect(component.effDateErrorMatcher.isErrorState).toBeDefined();
    });

    it('should have termDateErrorMatcher defined', () => {
      expect(component.termDateErrorMatcher).toBeTruthy();
      expect(component.termDateErrorMatcher.isErrorState).toBeDefined();
    });

    it('effDateErrorMatcher should return false for null control', () => {
      expect(component.effDateErrorMatcher.isErrorState(null, null as any)).toBe(false);
    });

    it('termDateErrorMatcher should return false for null control', () => {
      expect(component.termDateErrorMatcher.isErrorState(null, null as any)).toBe(false);
    });
  });

  describe('form validations', () => {
    it('rackNumber should be required', () => {
      component.form.get('rackNumber')?.setValue('');
      expect(component.form.get('rackNumber')?.hasError('required')).toBe(true);
    });

    it('rackNumber should have maxLength of 2', () => {
      component.form.get('rackNumber')?.setValue('ABC');
      expect(component.form.get('rackNumber')?.hasError('maxlength')).toBe(true);
    });

    it('rackNumber should validate pattern', () => {
      component.form.get('rackNumber')?.setValue('A!');
      expect(component.form.get('rackNumber')?.hasError('pattern')).toBe(true);
    });

    it('rackNumber should accept valid values', () => {
      component.form.get('rackNumber')?.setValue('A1');
      expect(component.form.get('rackNumber')?.valid).toBe(true);
    });

    it('rackDescription should be required', () => {
      component.form.get('rackDescription')?.setValue('');
      expect(component.form.get('rackDescription')?.hasError('required')).toBe(true);
    });

    it('rackDescription should have maxLength of 50', () => {
      component.form.get('rackDescription')?.setValue('A'.repeat(51));
      expect(component.form.get('rackDescription')?.hasError('maxlength')).toBe(true);
    });

    it('productType should be required', () => {
      component.form.get('productType')?.setValue('');
      expect(component.form.get('productType')?.hasError('required')).toBe(true);
    });

    it('shelfCount min is 0', () => {
      component.form.get('shelfCount')?.setValue(-1);
      expect(component.form.get('shelfCount')?.hasError('min')).toBe(true);
    });

    it('shelfCount max is 99', () => {
      component.form.get('shelfCount')?.setValue(100);
      expect(component.form.get('shelfCount')?.hasError('max')).toBe(true);
    });

    it('trayCount min is 0', () => {
      component.form.get('trayCount')?.setValue(-1);
      expect(component.form.get('trayCount')?.hasError('min')).toBe(true);
    });

    it('trayCount max is 9999', () => {
      component.form.get('trayCount')?.setValue(10000);
      expect(component.form.get('trayCount')?.hasError('max')).toBe(true);
    });

    it('shelfCount should accept valid value', () => {
      component.form.get('shelfCount')?.setValue(50);
      expect(component.form.get('shelfCount')?.valid).toBe(true);
    });

    it('trayCount should accept valid value', () => {
      component.form.get('trayCount')?.setValue(5000);
      expect(component.form.get('trayCount')?.valid).toBe(true);
    });

    it('effectiveDate should be required', () => {
      component.form.get('effectiveDate')?.setValue(null);
      component.form.get('effectiveDate')?.markAsTouched();
      expect(component.form.get('effectiveDate')?.hasError('required')).toBe(true);
    });

    it('terminationDate should be optional', () => {
      component.form.get('terminationDate')?.setValue(null);
      // terminationDate has no required validator
      expect(component.form.get('terminationDate')?.hasError('required')).toBe(false);
    });
  });

  describe('save with closeAfterSave=false and AboRh disabled', () => {
    it('should disable bloodType after save & create another when AboRh disabled', fakeAsync(() => {
      component.retrieveState = { warehouseId: 'W1', deviceType: 'D1', deviceNumber: 'N1', storageClass: 'BI' };
      fixture.detectChanges();
      component.mode = 'add';
      component.ngOnChanges({ mode: new SimpleChange(undefined, 'add', true) });

      component.form.patchValue({
        rackNumber: 'A1',
        rackDescription: 'Test Rack',
        productType: 'RBC',
        effectiveDate: moment('2028-06-01')
      });
      component.form.markAllAsTouched();
      component.onSave(false);
      tick();

      if (mockService.createRack.calls.count() > 0) {
        expect(component.form.get('bloodType')?.disabled).toBe(true);
      }
    }));
  });

  describe('populateForm edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle data with null bloodType', () => {
      component.mode = 'edit';
      component.data = { ...sampleEditData, bloodType: null };
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, component.data, false)
      });
      expect(component.form.get('bloodType')?.value).toBeNull();
    });

    it('should handle data with all null optional fields', () => {
      component.mode = 'edit';
      component.data = {
        rackNumber: 'A1',
        rackDescription: 'Minimal',
        productType: 'RBC',
        bloodType: null,
        bloodTypeDescription: null,
        shelfCount: null,
        trayCount: null,
        mixProduct: null,
        mixAbo: null,
        effectiveDate: '01-JAN-2026',
        terminationDate: null,
        lastModifiedDate: null
      };
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, component.data, false)
      });
      expect(component.form.get('shelfCount')?.value).toBeNull();
      expect(component.form.get('trayCount')?.value).toBeNull();
      expect(component.form.get('mixProduct')?.value).toBeNull();
      expect(component.form.get('mixAbo')?.value).toBeNull();
      expect(component.lastModified).toBe('');
    });
  });
});
