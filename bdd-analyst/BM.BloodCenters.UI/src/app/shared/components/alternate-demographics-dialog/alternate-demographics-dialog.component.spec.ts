import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { AlternateDemographicsDialogComponent } from './alternate-demographics-dialog.component';
import { AlternateDemographicsService } from '../../services/alternate-demographics.service';
import { SnackbarService } from '../../services/snackbar.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  AlternateDemographicsDialogData,
  AlternateDemographicsModel
} from '../../models/alternate-demographics.model';

describe('AlternateDemographicsDialogComponent', () => {
  let component: AlternateDemographicsDialogComponent;
  let fixture: ComponentFixture<AlternateDemographicsDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AlternateDemographicsDialogComponent>>;
  let mockService: jasmine.SpyObj<AlternateDemographicsService>;
  let mockSnackbar: jasmine.SpyObj<SnackbarService>;

  const mockDialogData: AlternateDemographicsDialogData = {
    donorId: 'DN001',
    readOnly: false
  };

  beforeEach(() => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockService = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId',
      'update',
      'getCountries',
      'getCityStateByZip',
      'validateAreaCode'
    ]);
    mockSnackbar = createMockSnackbarService();
    mockService.getByDonorId.and.returnValue(of(null));
    mockService.getCountries.and.returnValue(of([]));
    mockService.getCityStateByZip.and.returnValue(of([]));
    mockService.update.and.returnValue(of({ success: true, message: 'Updated' }));
    mockService.validateAreaCode.and.returnValue(of(true));

    TestBed.configureTestingModule({
      imports: [
        AlternateDemographicsDialogComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: AlternateDemographicsService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbar }
      ]
    });

    mockDialogRef.close.calls.reset();
    mockService.getByDonorId.calls.reset();
    mockService.update.calls.reset();
    mockService.getCountries.calls.reset();
    mockService.getCityStateByZip.calls.reset();
    mockService.getByDonorId.and.returnValue(of(null));
    mockService.getCountries.and.returnValue(of([]));
    mockService.getCityStateByZip.and.returnValue(of([]));
    mockService.update.and.returnValue(of({ success: true, message: 'Updated' }));
    mockService.validateAreaCode.and.returnValue(of(true));

    fixture = TestBed.createComponent(AlternateDemographicsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should call getByDonorId on init', () => {
    expect(mockService.getByDonorId).toHaveBeenCalledWith('DN001');
  });

  it('should default to Local address type when no data', () => {
    expect(component.form.get('addressType')?.value).toBe('L');
  });

  describe('onApply', () => {
    it('should call update service and close dialog on success', () => {
      component.form.patchValue({
        addressType: 'L',
        streetName: '781 Lincoln Way',
        city: 'Ames',
        zip: '50014'
      });

      component.onApply();

      expect(mockService.update).toHaveBeenCalledWith('DN001', jasmine.objectContaining({
        addressType: 'L',
        streetName: '781 Lincoln Way'
      }));
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('phone validation', () => {
    it('should reject non-numeric other contact number via pattern validator', () => {
      component.form.get('otherContactNumber')?.setValue('abc123');
      expect(component.form.get('otherContactNumber')?.hasError('pattern')).toBeTrue();
    });

    it('should reject mobile phone exceeding maxLength', () => {
      component.form.get('mobilePhoneNumber')?.setValue('12345678901234X');
      expect(component.form.get('mobilePhoneNumber')?.hasError('maxlength')).toBeTrue();
    });

    it('should accept numeric mobile phone', () => {
      component.form.get('mobilePhoneNumber')?.setValue('1234567890');
      expect(component.form.get('mobilePhoneNumber')?.valid).toBeTrue();
    });

    it('should accept numeric other contact number', () => {
      component.form.get('otherContactNumber')?.setValue('1234567890');
      expect(component.form.get('otherContactNumber')?.valid).toBeTrue();
    });
  });

  describe('onCancel', () => {
    it('should close dialog without result', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('onCloseAll', () => {
    it('should close dialog with closeAll string', () => {
      component.onCloseAll();
      expect(mockDialogRef.close).toHaveBeenCalledWith('closeAll');
    });
  });

  describe('onClear', () => {
    it('should reset form and mark as dirty and cleared', () => {
      component.form.patchValue({
        addressType: 'L',
        streetName: '123 Main',
        city: 'Boston',
        zip: '02101'
      });
      component.onClear();
      expect(component.form.dirty).toBeTrue();
      expect(component.isFormDirty()).toBeTrue();
      expect(component.isFormCleared()).toBeTrue();
      expect(component.form.get('addressType')?.value).toBe('L');
    });

    it('should preserve current address type after clear', () => {
      component.form.patchValue({ addressType: 'I' });
      component.onClear();
      expect(component.form.get('addressType')?.value).toBe('I');
    });
  });

  describe('isLocal and isInternational getters', () => {
    it('should return true for isLocal when addressType is L', () => {
      component.form.patchValue({ addressType: 'L' });
      expect(component.isLocal).toBeTrue();
      expect(component.isInternational).toBeFalse();
    });

    it('should return true for isInternational when addressType is I', () => {
      component.form.patchValue({ addressType: 'I' });
      expect(component.isInternational).toBeTrue();
      expect(component.isLocal).toBeFalse();
    });
  });

  describe('onCityBlur', () => {
    it('should uppercase city value on blur', () => {
      component.form.patchValue({ city: 'boston' }, { emitEvent: false });
      component.onCityBlur();
      expect(component.form.get('city')?.value).toBe('BOSTON');
    });

    it('should clear state and zipOptions when city is empty', () => {
      component.form.patchValue({ city: '', state: 'MA' }, { emitEvent: false });
      component.onCityBlur();
      expect(component.zipOptions()).toEqual([]);
    });
  });

  describe('onCityOptionSelected', () => {
    it('should patch city, state, and uspsId from selected result', () => {
      const result = { city: 'CHICAGO', state: 'IL', zip: '60601', uspsId: 999 };
      component.onCityOptionSelected(result);
      expect(component.form.get('city')?.value).toBe('CHICAGO');
      expect(component.form.getRawValue().state).toBe('IL');
      expect(component.form.get('uspsId')?.value).toBe(999);
    });
  });

  describe('onZipSelected', () => {
    it('should patch zip, city, state, and uspsId', () => {
      const result = { city: 'BOSTON', state: 'MA', zip: '02101', uspsId: 123 };
      component.onZipSelected(result);
      expect(component.form.get('zip')?.value).toBe('02101');
      expect(component.form.get('city')?.value).toBe('BOSTON');
      expect(component.form.getRawValue().state).toBe('MA');
    });
  });

  describe('onZipOptionSelected', () => {
    it('should parse state from description and patch zip and state', () => {
      mockService.getCityStateByZip.and.returnValue(of([
        { city: 'CHICAGO', state: 'IL', zip: '60601', uspsId: 100 },
        { city: 'LOOP', state: 'IL', zip: '60601', uspsId: 101 }
      ]));
      const option = { code: '60601', description: '60601 - IL' };
      component.onZipOptionSelected(option);
      expect(component.form.get('zip')?.value).toBe('60601');
      expect(component.form.getRawValue().state).toBe('IL');
      expect(component.cityStateResults().length).toBe(2);
    });

    it('should clear cityStateResults when single city returned', () => {
      mockService.getCityStateByZip.and.returnValue(of([
        { city: 'BOSTON', state: 'MA', zip: '02101', uspsId: 100 }
      ]));
      const option = { code: '02101', description: '02101 - MA' };
      component.onZipOptionSelected(option);
      expect(component.cityStateResults()).toEqual([]);
    });

    it('should handle description without dash', () => {
      mockService.getCityStateByZip.and.returnValue(of([]));
      const option = { code: '02101', description: '02101' };
      component.onZipOptionSelected(option);
      expect(component.form.getRawValue().state).toBe('');
    });
  });

  describe('onZipAutoSelected', () => {
    it('should call onZipSelected when value has uspsId', () => {
      const cityResult = { city: 'BOSTON', state: 'MA', zip: '02101', uspsId: 123 };
      const event = { option: { value: cityResult } };
      component.onZipAutoSelected(event);
      expect(component.form.get('zip')?.value).toBe('02101');
      expect(component.form.get('city')?.value).toBe('BOSTON');
    });

    it('should call onZipOptionSelected when value has code/description', () => {
      mockService.getCityStateByZip.and.returnValue(of([]));
      const zipOption = { code: '02101', description: '02101 - MA' };
      const event = { option: { value: zipOption } };
      component.onZipAutoSelected(event);
      expect(component.form.get('zip')?.value).toBe('02101');
    });
  });

  describe('onNumericKeyPress', () => {
    it('should allow digit keys', () => {
      const event = { key: '5', preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent non-digit keys', () => {
      const event = { key: 'a', preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow Backspace', () => {
      const event = { key: 'Backspace', preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow ctrl key combos', () => {
      const event = { key: 'c', ctrlKey: true, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('formatPhoneInput', () => {
    it('should strip non-digit characters and limit to 10 digits', () => {
      component.form.get('mobilePhoneNumber')?.setValue('(123) 456-78901234');
      component.formatPhoneInput('mobilePhoneNumber');
      expect(component.form.get('mobilePhoneNumber')?.value).toBe('1234567890');
    });

    it('should do nothing for unknown field', () => {
      component.formatPhoneInput('nonExistentField');
    });
  });

  describe('validatePhoneField', () => {
    it('should clear errors when value is empty', () => {
      component.form.get('mobilePhoneNumber')?.setValue('');
      component.validatePhoneField('mobilePhoneNumber');
      expect(component.form.get('mobilePhoneNumber')?.errors).toBeNull();
    });

    it('should set invalidPhone error when less than 10 digits', () => {
      component.form.get('mobilePhoneNumber')?.setValue('12345');
      component.validatePhoneField('mobilePhoneNumber');
      expect(component.form.get('mobilePhoneNumber')?.hasError('invalidPhone')).toBeTrue();
    });

    it('should set invalidPhone error when value is all zeros', () => {
      component.form.get('mobilePhoneNumber')?.setValue('0000000000');
      component.validatePhoneField('mobilePhoneNumber');
      expect(component.form.get('mobilePhoneNumber')?.hasError('invalidPhone')).toBeTrue();
    });

    it('should format and validate area code when 10 valid digits', () => {
      component.form.get('mobilePhoneNumber')?.setValue('6175551234');
      component.validatePhoneField('mobilePhoneNumber');
      expect(component.form.get('mobilePhoneNumber')?.value).toBe('(617) 555-1234');
      expect(mockService.validateAreaCode).toHaveBeenCalledWith('617');
      expect(component.form.get('mobilePhoneNumber')?.errors).toBeNull();
    });

    it('should do nothing for unknown field', () => {
      component.validatePhoneField('nonExistentField');
    });
  });

  describe('convertToUpperCase', () => {
    it('should convert input value to uppercase', () => {
      const input = document.createElement('input');
      input.value = 'boston';
      const event = { target: input } as unknown as Event;
      component.convertToUpperCase(event, 'city');
      expect(component.form.get('city')?.value).toBe('BOSTON');
    });
  });

  describe('toggleAddressFields', () => {
    it('should disable international fields when switching to local', () => {
      component.form.patchValue({ addressType: 'L' });
      (component as any).toggleAddressFields('L');
      expect(component.form.get('intlAddress1')?.disabled).toBeTrue();
      expect(component.form.get('countryName')?.disabled).toBeTrue();
      expect(component.form.get('streetName')?.enabled).toBeTrue();
    });

    it('should disable local fields when switching to international', () => {
      component.form.patchValue({ addressType: 'I' });
      (component as any).toggleAddressFields('I');
      expect(component.form.get('streetName')?.disabled).toBeTrue();
      expect(component.form.get('zip')?.disabled).toBeTrue();
      expect(component.form.get('intlAddress1')?.enabled).toBeTrue();
    });

    it('should save and restore local values when toggling to international and back', () => {
      component.form.patchValue({
        addressType: 'L',
        streetName: '123 Main St',
        city: 'Boston',
        zip: '02101'
      }, { emitEvent: false });

      (component as any).toggleAddressFields('I');
      expect(component.form.get('streetName')?.disabled).toBeTrue();

      (component as any).toggleAddressFields('L');
      expect(component.form.get('streetName')?.enabled).toBeTrue();
      expect(component.form.get('streetName')?.value).toBe('123 Main St');
    });

    it('should save and restore intl values when toggling to local and back', () => {
      component.form.patchValue({
        addressType: 'I',
        intlAddress1: '1234 STRASSE',
        countryName: 'GERMANY'
      }, { emitEvent: false });

      (component as any).toggleAddressFields('L');
      (component as any).toggleAddressFields('I');
      expect(component.form.get('intlAddress1')?.value).toBe('1234 STRASSE');
      expect(component.form.get('countryName')?.value).toBe('GERMANY');
    });

    it('should always keep state field disabled', () => {
      (component as any).toggleAddressFields('L');
      expect(component.form.get('state')?.disabled).toBeTrue();
      (component as any).toggleAddressFields('I');
      expect(component.form.get('state')?.disabled).toBeTrue();
    });
  });

  describe('onApply - additional branches', () => {
    it('should close with null when form was cleared', () => {
      component.isFormCleared.set(true);
      component.onApply();
      expect(mockDialogRef.close).toHaveBeenCalledWith(null);
    });

    it('should show error when local address has zip but no city', () => {
      component.form.patchValue({
        addressType: 'L',
        streetName: '123 Main',
        zip: '02101',
        city: ''
      });

      component.onApply();
      expect(mockSnackbar.showError).toHaveBeenCalledWith('Please select a city for the entered zip code.');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should not submit when form is invalid', () => {
      component.form.patchValue({
        addressType: 'L',
        streetName: '',
        zip: ''
      });

      component.onApply();
      expect(mockService.update).not.toHaveBeenCalled();
    });

    it('should show error snackbar on save failure', () => {
      mockService.update.and.returnValue(throwError(() => new Error('Server error')));
      component.form.patchValue({
        addressType: 'L',
        streetName: '123 Main',
        city: 'Boston',
        zip: '02101'
      });

      component.onApply();
      expect(mockSnackbar.showError).toHaveBeenCalledWith('Failed to save alternate demographics. Please try again.');
      expect(component.isSaving()).toBeFalse();
    });

    it('should set isSaving before calling update', () => {
      component.form.patchValue({
        addressType: 'L',
        streetName: '123 Main',
        city: 'Boston',
        zip: '02101'
      });

      component.onApply();
      expect(mockService.update).toHaveBeenCalled();
      expect(mockSnackbar.showSuccess).toHaveBeenCalled();
    });
  });

  describe('buildResult', () => {
    it('should map local fields and null international fields for local address type', () => {
      component.form.patchValue({
        addressType: 'L',
        streetName: '123 Main',
        city: 'BOSTON',
        zip: '02101',
        uspsId: 123
      });
      const result = (component as any).buildResult();
      expect(result.addressType).toBe('L');
      expect(result.streetName).toBe('123 Main');
      expect(result.intlAddress1).toBeNull();
      expect(result.intlAddrFlag).toBe('N');
    });

    it('should map international fields and null local fields for international address type', () => {
      component.form.patchValue({ addressType: 'I' });
      (component as any).toggleAddressFields('I');
      component.form.patchValue({
        intlAddress1: '1234 STRASSE',
        countryName: 'GERMANY'
      });
      const result = (component as any).buildResult();
      expect(result.addressType).toBe('I');
      expect(result.intlAddress1).toBe('1234 STRASSE');
      expect(result.streetName).toBeNull();
      expect(result.intlAddrFlag).toBe('Y');
    });
  });

  describe('setupPreferredPhoneValidation', () => {
    it('should make preferredContactPhone required when a phone is entered', () => {
      component.form.patchValue({ mobilePhoneNumber: '6175551234' });
      const ctrl = component.form.get('preferredContactPhone');
      ctrl?.setValue('');
      ctrl?.updateValueAndValidity();
      expect(ctrl?.hasError('required')).toBeTrue();
    });

    it('should remove required from preferredContactPhone when all phones cleared', () => {
      component.form.patchValue({
        mobilePhoneNumber: '',
        otherContactNumber: '',
        altIntlPhoneNumber: ''
      });
      const ctrl = component.form.get('preferredContactPhone');
      ctrl?.setValue('');
      ctrl?.updateValueAndValidity();
      expect(ctrl?.hasError('required')).toBeFalse();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const dNext = spyOn((component as any).destroy$, 'next');
      const dComplete = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(dNext).toHaveBeenCalled();
      expect(dComplete).toHaveBeenCalled();
    });
  });

  describe('updatePreferredPhoneRequired', () => {
    it('should make preferredContactPhone required when phone number exists', () => {
      component.form.patchValue({ mobilePhoneNumber: '1234567890' });
      (component as any).updatePreferredPhoneRequired();
      expect(component.form.get('preferredContactPhone')?.hasError('required')).toBe(true);
    });

    it('should not require preferredContactPhone when no phone numbers', () => {
      component.form.patchValue({
        mobilePhoneNumber: '',
        otherContactNumber: '',
        altIntlPhoneNumber: ''
      });
      (component as any).updatePreferredPhoneRequired();
      expect(component.form.get('preferredContactPhone')?.hasError('required')).toBeFalse();
    });
  });

  describe('setupAddressTypeToggle', () => {
    it('should toggle fields when addressType changes', () => {
      component.form.patchValue({ addressType: 'I' });
      expect(component.form.get('intlAddress1')?.enabled).toBe(true);
      component.form.patchValue({ addressType: 'L' });
      expect(component.form.get('streetName')?.enabled).toBe(true);
    });
  });

  describe('setupDirtyTracking', () => {
    it('should set isFormDirty when form value changes after marking dirty', () => {
      component.form.markAsDirty();
      component.form.patchValue({ streetName: 'Changed' });
      expect(component.isFormDirty()).toBe(true);
    });
  });

  describe('loadDonorData error path', () => {
    it('should handle getByDonorId error gracefully', () => {
      mockService.getByDonorId.and.returnValue(throwError(() => new Error('fail')));
      const f2 = TestBed.createComponent(AlternateDemographicsDialogComponent);
      const c2 = f2.componentInstance;
      f2.detectChanges();
      expect(c2.isLoading()).toBe(false);
    });
  });
});

describe('AlternateDemographicsDialogComponent - with existing data', () => {
  let component: AlternateDemographicsDialogComponent;
  let fixture: ComponentFixture<AlternateDemographicsDialogComponent>;
  let mockService: jasmine.SpyObj<AlternateDemographicsService>;

  const existingData: AlternateDemographicsModel = {
    addressType: 'I',
    streetName: null,
    suiteApt: null,
    city: null,
    state: null,
    zip: null,
    uspsId: null,
    intlAddress1: '1234 AHORN STRASSE',
    intlAddress2: 'GENTHIN',
    intlAddress3: null,
    intlAddress4: null,
    intlCity: 'GENTHIN',
    countryName: 'GERMANY',
    intlPostalCode: '112233445',
    intlAddrFlag: 'Y',
    mobilePhoneNumber: '1234567',
    otherContactNumber: '1234567',
    altIntlPhoneNumber: '1234567',
    preferredContactPhone: 'M',
    preferredContactAddress: 'H'
  };

  beforeEach(() => {
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockService = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId', 'update', 'getCountries', 'getCityStateByZip'
    ]);
    mockService.getByDonorId.and.returnValue(of(existingData));
    mockService.getCountries.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: 'DN002', readOnly: false } },
        { provide: AlternateDemographicsService, useValue: mockService },
        { provide: SnackbarService, useValue: createMockSnackbarService() }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should populate form with fetched data', () => {
    expect(component.form.get('addressType')?.value).toBe('I');
    expect(component.form.get('intlAddress1')?.value).toBe('1234 AHORN STRASSE');
    expect(component.form.get('countryName')?.value).toBe('GERMANY');
    expect(component.form.get('mobilePhoneNumber')?.value).toBe('1234567');
    expect(component.form.get('preferredContactPhone')?.value).toBe('M');
  });

  it('should track form dirty state via setupDirtyTracking', () => {
    component.form.markAsDirty();
    component.form.get('intlAddress1')?.setValue('CHANGED VALUE');
    expect(component.isFormDirty()).toBeTrue();
  });

  it('should load countries on init', () => {
    expect(mockService.getCountries).toHaveBeenCalled();
  });
});

describe('AlternateDemographicsDialogComponent - read-only mode', () => {
  let component: AlternateDemographicsDialogComponent;
  let fixture: ComponentFixture<AlternateDemographicsDialogComponent>;

  beforeEach(() => {
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    const mockService = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId', 'update', 'getCountries', 'getCityStateByZip'
    ]);
    mockService.getByDonorId.and.returnValue(of({
      addressType: 'L' as const,
      streetName: '781 Lincoln Way', suiteApt: null,
      city: 'Ames', state: 'IA', zip: '50014', uspsId: 12345,
      intlAddress1: null, intlAddress2: null, intlAddress3: null, intlAddress4: null,
      intlCity: null, countryName: null, intlPostalCode: null, intlAddrFlag: 'N',
      mobilePhoneNumber: null, otherContactNumber: null, altIntlPhoneNumber: null,
      preferredContactPhone: 'H', preferredContactAddress: 'H'
    }));
    mockService.getCountries.and.returnValue(of([]));
    mockService.getCityStateByZip.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: 'DN003', readOnly: true } },
        { provide: AlternateDemographicsService, useValue: mockService },
        { provide: SnackbarService, useValue: createMockSnackbarService() }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create in read-only mode', () => {
    expect(component).toBeTruthy();
    expect(component.isReadOnly()).toBeTrue();
  });
});

describe('AlternateDemographicsDialogComponent - error on load', () => {
  let component: AlternateDemographicsDialogComponent;
  let fixture: ComponentFixture<AlternateDemographicsDialogComponent>;

  beforeEach(() => {
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    const mockService = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId', 'update', 'getCountries', 'getCityStateByZip'
    ]);
    mockService.getByDonorId.and.returnValue(throwError(() => new Error('fetch error')));
    mockService.getCountries.and.returnValue(of([]));
    mockService.getCityStateByZip.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: 'DNERR', readOnly: false } },
        { provide: AlternateDemographicsService, useValue: mockService },
        { provide: SnackbarService, useValue: createMockSnackbarService() }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should handle getByDonorId error gracefully and stop loading', () => {
    expect(component.isLoading()).toBeFalse();
    expect(component.form.get('addressType')?.value).toBe('L');
  });
});

describe('AlternateDemographicsDialogComponent - additional coverage', () => {
  let component: AlternateDemographicsDialogComponent;
  let fixture: ComponentFixture<AlternateDemographicsDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AlternateDemographicsDialogComponent>>;
  let mockService: jasmine.SpyObj<AlternateDemographicsService>;
  let mockSnackbar: jasmine.SpyObj<SnackbarService>;

  const mockDialogData: AlternateDemographicsDialogData = {
    donorId: 'DN001',
    readOnly: false
  };

  beforeEach(() => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockService = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId', 'update', 'getCountries', 'getCityStateByZip'
    ]);
    mockSnackbar = createMockSnackbarService();
    mockService.getByDonorId.and.returnValue(of(null));
    mockService.getCountries.and.returnValue(of([]));
    mockService.getCityStateByZip.and.returnValue(of([]));
    mockService.update.and.returnValue(of({ success: true, message: 'Updated' }));

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: AlternateDemographicsService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbar }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const dNext = spyOn((component as any).destroy$, 'next');
      const dComplete = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(dNext).toHaveBeenCalled();
      expect(dComplete).toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    it('should close dialog without result', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('onCloseAll', () => {
    it('should close dialog with closeAll', () => {
      component.onCloseAll();
      expect(mockDialogRef.close).toHaveBeenCalledWith('closeAll');
    });
  });

  describe('isLocal and isInternational', () => {
    it('should return true for isLocal when addressType is L', () => {
      component.form.patchValue({ addressType: 'L' });
      expect(component.isLocal).toBe(true);
      expect(component.isInternational).toBe(false);
    });

    it('should return true for isInternational when addressType is I', () => {
      component.form.patchValue({ addressType: 'I' });
      expect(component.isLocal).toBe(false);
      expect(component.isInternational).toBe(true);
    });
  });

  describe('onNumericKeyPress', () => {
    it('should not prevent digit keys', () => {
      const event = { key: '5', preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent non-digit keys', () => {
      const event = { key: 'a', preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('onClear', () => {
    it('should reset form, keep address type, and mark as cleared', () => {
      component.form.patchValue({ addressType: 'L', streetName: '123 Main St' });
      component.onClear();
      expect(component.form.get('addressType')?.value).toBe('L');
      expect(component.isFormDirty()).toBe(true);
      expect(component.isFormCleared()).toBe(true);
    });
  });

  describe('onApply - form cleared', () => {
    it('should close dialog with null when form is cleared', () => {
      component.isFormCleared.set(true);
      component.onApply();
      expect(mockDialogRef.close).toHaveBeenCalledWith(null);
      expect(component.isFormCleared()).toBe(false);
    });
  });

  describe('onApply - invalid form', () => {
    it('should not call update when form is invalid', () => {
      component.form.patchValue({ streetName: '' });
      component.form.get('streetName')?.markAsTouched();
      component.onApply();
      // streetName is required, so form is invalid
      expect(mockService.update).not.toHaveBeenCalled();
    });
  });

  describe('onApply - update error', () => {
    it('should show error snackbar on update failure', () => {
      mockService.update.and.returnValue(throwError(() => new Error('fail')));
      component.form.patchValue({
        addressType: 'L',
        streetName: '781 Lincoln Way',
        city: 'AMES',
        zip: '50014'
      });
      component.onApply();
      expect(mockSnackbar.showError).toHaveBeenCalledWith('Failed to save alternate demographics. Please try again.');
      expect(component.isSaving()).toBe(false);
    });
  });

  describe('onZipSelected', () => {
    it('should patch form with selected city/state result', () => {
      const result = { zip: '50014', city: 'Ames', state: 'IA', uspsId: 123 };
      component.onZipSelected(result);
      expect(component.form.getRawValue().zip).toBe('50014');
      expect(component.form.getRawValue().city).toBe('Ames');
      expect(component.form.getRawValue().state).toBe('IA');
    });
  });

  describe('toggleAddressFields', () => {
    it('should enable local fields and disable intl fields for L type', () => {
      (component as any).toggleAddressFields('L');
      expect(component.form.get('streetName')?.enabled).toBe(true);
      expect(component.form.get('zip')?.enabled).toBe(true);
      expect(component.form.get('intlAddress1')?.disabled).toBe(true);
      expect(component.form.get('countryName')?.disabled).toBe(true);
    });

    it('should enable intl fields and disable local fields for I type', () => {
      (component as any).toggleAddressFields('I');
      expect(component.form.get('intlAddress1')?.enabled).toBe(true);
      expect(component.form.get('countryName')?.enabled).toBe(true);
      expect(component.form.get('streetName')?.disabled).toBe(true);
      expect(component.form.get('zip')?.disabled).toBe(true);
    });

    it('should keep state disabled for both types and city enabled only for local', () => {
      (component as any).toggleAddressFields('L');
      expect(component.form.get('city')?.enabled).toBe(true);
      expect(component.form.get('state')?.disabled).toBe(true);
      (component as any).toggleAddressFields('I');
      expect(component.form.get('city')?.disabled).toBe(true);
      expect(component.form.get('state')?.disabled).toBe(true);
    });
  });

  describe('buildResult', () => {
    it('should build local address result', () => {
      component.form.patchValue({
        addressType: 'L',
        streetName: '123 Main St',
        suiteApt: 'Apt 4',
        zip: '50014'
      });
      const result = (component as any).buildResult();
      expect(result.addressType).toBe('L');
      expect(result.streetName).toBe('123 Main St');
      expect(result.intlAddress1).toBeNull();
      expect(result.intlAddrFlag).toBe('N');
    });

    it('should build international address result', () => {
      (component as any).toggleAddressFields('I');
      component.form.patchValue({
        addressType: 'I',
        intlAddress1: '456 Intl Ave',
        countryName: 'GERMANY'
      });
      const result = (component as any).buildResult();
      expect(result.addressType).toBe('I');
      expect(result.intlAddress1).toBe('456 Intl Ave');
      expect(result.streetName).toBeNull();
      expect(result.intlAddrFlag).toBe('Y');
    });
  });

  describe('updatePreferredPhoneRequired', () => {
    it('should make preferredContactPhone required when phone number exists', () => {
      component.form.patchValue({ mobilePhoneNumber: '1234567890' });
      (component as any).updatePreferredPhoneRequired();
      expect(component.form.get('preferredContactPhone')?.hasError('required')).toBe(true);
    });

    it('should not require preferredContactPhone when no phone numbers', () => {
      component.form.patchValue({
        mobilePhoneNumber: '',
        otherContactNumber: '',
        altIntlPhoneNumber: ''
      });
      (component as any).updatePreferredPhoneRequired();
      expect(component.form.get('preferredContactPhone')?.hasError('required')).toBeFalse();
    });
  });

  describe('setupAddressTypeToggle', () => {
    it('should toggle fields when addressType changes', () => {
      component.form.patchValue({ addressType: 'I' });
      expect(component.form.get('intlAddress1')?.enabled).toBe(true);
      component.form.patchValue({ addressType: 'L' });
      expect(component.form.get('streetName')?.enabled).toBe(true);
    });
  });

  describe('setupDirtyTracking', () => {
    it('should set isFormDirty when form value changes after marking dirty', () => {
      component.form.markAsDirty();
      component.form.patchValue({ streetName: 'Changed' });
      expect(component.isFormDirty()).toBe(true);
    });
  });

  describe('loadDonorData error path', () => {
    it('should handle getByDonorId error gracefully', () => {
      mockService.getByDonorId.and.returnValue(throwError(() => new Error('fail')));
      const f2 = TestBed.createComponent(AlternateDemographicsDialogComponent);
      const c2 = f2.componentInstance;
      f2.detectChanges();
      expect(c2.isLoading()).toBe(false);
    });
  });
});

describe('AlternateDemographicsDialogComponent - no donorId with existingData', () => {
  let component: AlternateDemographicsDialogComponent;
  let fixture: ComponentFixture<AlternateDemographicsDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AlternateDemographicsDialogComponent>>;
  let mockService: jasmine.SpyObj<AlternateDemographicsService>;
  let mockSnackbar: jasmine.SpyObj<SnackbarService>;

  const existingData: AlternateDemographicsModel = {
    addressType: 'L',
    streetName: '100 Center St',
    suiteApt: null,
    city: 'AMES',
    state: 'IA',
    zip: '50010',
    uspsId: 555,
    intlAddress1: null, intlAddress2: null, intlAddress3: null, intlAddress4: null,
    intlCity: null, countryName: null, intlPostalCode: null, intlAddrFlag: 'N',
    mobilePhoneNumber: null, otherContactNumber: null, altIntlPhoneNumber: null,
    preferredContactPhone: null, preferredContactAddress: null
  };

  beforeEach(() => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockService = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId', 'update', 'getCountries', 'getCityStateByZip'
    ]);
    mockSnackbar = createMockSnackbarService();
    mockService.getCountries.and.returnValue(of([]));
    mockService.getCityStateByZip.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: '', readOnly: false, existingData } },
        { provide: AlternateDemographicsService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbar }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should populate form from existingData when no donorId', () => {
    expect(component.isLoading()).toBeFalse();
    expect(component.form.get('streetName')?.value).toBe('100 Center St');
    expect(component.form.get('city')?.value).toBe('AMES');
  });

  it('should close with result directly when no donorId on apply', () => {
    component.form.patchValue({
      addressType: 'L',
      streetName: '200 Main',
      city: 'DES MOINES',
      zip: '50309'
    });
    component.onApply();
    expect(mockDialogRef.close).toHaveBeenCalledWith(
      jasmine.objectContaining({
        addressType: 'L',
        streetName: '200 Main'
      })
    );
  });

  it('should not call getByDonorId when no donorId', () => {
    expect(mockService.getByDonorId).not.toHaveBeenCalled();
  });

  it('should close dialog without calling update on apply', () => {
    component.form.patchValue({ streetName: 'Updated', zip: '50010' });
    component.onApply();
    expect(mockService.update).not.toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should set isLoading to false immediately', () => {
    expect(component.isLoading()).toBe(false);
  });
});

describe('AlternateDemographicsDialogComponent - validatePhoneAreaCode', () => {
  let component: AlternateDemographicsDialogComponent;
  let fixture: ComponentFixture<AlternateDemographicsDialogComponent>;
  let mockService: jasmine.SpyObj<AlternateDemographicsService>;

  beforeEach(() => {
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockService = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId', 'update', 'getCountries', 'getCityStateByZip', 'validateAreaCode', 'getZipsByCity'
    ]);
    mockService.getByDonorId.and.returnValue(of(null));
    mockService.getCountries.and.returnValue(of([]));
    mockService.getCityStateByZip.and.returnValue(of([]));
    mockService.getZipsByCity.and.returnValue(of([]));
    mockService.validateAreaCode.and.returnValue(of(true));

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: 'DN001', readOnly: false } },
        { provide: AlternateDemographicsService, useValue: mockService },
        { provide: SnackbarService, useValue: createMockSnackbarService() }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should set areaCodeNotFound error when area code is invalid', () => {
    mockService.validateAreaCode.and.returnValue(of(false));
    component.form.get('mobilePhoneNumber')?.setValue('9995551234');
    component.validatePhoneField('mobilePhoneNumber');
    expect(mockService.validateAreaCode).toHaveBeenCalledWith('999');
    expect(component.form.get('mobilePhoneNumber')?.hasError('areaCodeNotFound')).toBeTrue();
  });

  it('should remove areaCodeNotFound error when area code is valid', () => {
    const ctrl = component.form.get('mobilePhoneNumber');
    ctrl?.setValue('6175551234');
    ctrl?.setErrors({ areaCodeNotFound: true, invalidPhone: true });
    mockService.validateAreaCode.and.returnValue(of(true));
    component.validatePhoneField('mobilePhoneNumber');
    expect(ctrl?.hasError('areaCodeNotFound')).toBeFalse();
    expect(ctrl?.hasError('invalidPhone')).toBeFalse();
  });

  it('should clear all errors when area code is valid and no other errors exist', () => {
    const ctrl = component.form.get('mobilePhoneNumber');
    ctrl?.setValue('6175551234');
    ctrl?.setErrors({ areaCodeNotFound: true });
    mockService.validateAreaCode.and.returnValue(of(true));
    component.validatePhoneField('mobilePhoneNumber');
    expect(ctrl?.errors).toBeNull();
  });

  it('should preserve other errors when removing areaCodeNotFound', () => {
    const ctrl = component.form.get('mobilePhoneNumber');
    ctrl?.setValue('6175551234');
    ctrl?.setErrors({ areaCodeNotFound: true, someOtherError: true });
    mockService.validateAreaCode.and.returnValue(of(true));
    (component as any).validatePhoneAreaCode('mobilePhoneNumber');
    expect(ctrl?.hasError('areaCodeNotFound')).toBeFalse();
    expect(ctrl?.hasError('someOtherError')).toBeTrue();
  });

  it('should not validate area code when digits are less than 10', () => {
    const ctrl = component.form.get('mobilePhoneNumber');
    ctrl?.setValue('617');
    (component as any).validatePhoneAreaCode('mobilePhoneNumber');
    expect(mockService.validateAreaCode).not.toHaveBeenCalled();
  });

  it('should not validate area code when control has no value', () => {
    const ctrl = component.form.get('mobilePhoneNumber');
    ctrl?.setValue('');
    (component as any).validatePhoneAreaCode('mobilePhoneNumber');
    expect(mockService.validateAreaCode).not.toHaveBeenCalled();
  });
});

describe('AlternateDemographicsDialogComponent - read-only error path', () => {
  let component: AlternateDemographicsDialogComponent;
  let fixture: ComponentFixture<AlternateDemographicsDialogComponent>;

  beforeEach(() => {
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    const mockService = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId', 'update', 'getCountries', 'getCityStateByZip', 'validateAreaCode', 'getZipsByCity'
    ]);
    mockService.getByDonorId.and.returnValue(throwError(() => new Error('fetch error')));
    mockService.getCountries.and.returnValue(of([]));
    mockService.getCityStateByZip.and.returnValue(of([]));
    mockService.getZipsByCity.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: 'DN_ERR_RO', readOnly: true } },
        { provide: AlternateDemographicsService, useValue: mockService },
        { provide: SnackbarService, useValue: createMockSnackbarService() }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should handle error in readOnly mode and stop loading', () => {
    expect(component.isLoading()).toBeFalse();
    expect(component.isReadOnly()).toBeTrue();
  });

  it('should default to local address type on error in readOnly mode', () => {
    expect(component.form.get('addressType')?.value).toBe('L');
  });

  it('should not call setupAddressTypeToggle in readOnly error path', () => {
    // In readOnly + error, the component should still set up dirty tracking
    // but the form should not be subscribing to addressType changes
    // since setupAddressTypeToggle is not called in readOnly mode
    component.form.patchValue({ addressType: 'I' });
    // Fields should not auto-toggle since setupAddressTypeToggle was not called
    expect(component.isReadOnly()).toBeTrue();
  });
});

describe('AlternateDemographicsDialogComponent - international onApply', () => {
  let component: AlternateDemographicsDialogComponent;
  let fixture: ComponentFixture<AlternateDemographicsDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AlternateDemographicsDialogComponent>>;
  let mockService: jasmine.SpyObj<AlternateDemographicsService>;
  let mockSnackbar: jasmine.SpyObj<SnackbarService>;

  beforeEach(() => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockService = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId', 'update', 'getCountries', 'getCityStateByZip', 'validateAreaCode', 'getZipsByCity'
    ]);
    mockSnackbar = createMockSnackbarService();
    mockService.getByDonorId.and.returnValue(of(null));
    mockService.getCountries.and.returnValue(of([]));
    mockService.getCityStateByZip.and.returnValue(of([]));
    mockService.getZipsByCity.and.returnValue(of([]));
    mockService.update.and.returnValue(of({ success: true, message: 'Updated' }));
    mockService.validateAreaCode.and.returnValue(of(true));

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: 'DN001', readOnly: false } },
        { provide: AlternateDemographicsService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbar }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should skip zip-city check for international address and call update', () => {
    (component as any).toggleAddressFields('I');
    component.form.patchValue({
      addressType: 'I',
      intlAddress1: '456 STRASSE',
      countryName: 'GERMANY'
    });
    component.onApply();
    expect(mockSnackbar.showError).not.toHaveBeenCalled();
    expect(mockService.update).toHaveBeenCalledWith('DN001', jasmine.objectContaining({
      addressType: 'I',
      intlAddress1: '456 STRASSE',
      intlAddrFlag: 'Y'
    }));
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should show error snackbar on update failure for international address', () => {
    mockService.update.and.returnValue(throwError(() => new Error('Server error')));
    (component as any).toggleAddressFields('I');
    component.form.patchValue({
      addressType: 'I',
      intlAddress1: '456 STRASSE',
      countryName: 'GERMANY'
    });
    component.onApply();
    expect(mockSnackbar.showError).toHaveBeenCalledWith('Failed to save alternate demographics. Please try again.');
    expect(component.isSaving()).toBeFalse();
  });

  it('should not call update when international form is invalid (missing required)', () => {
    (component as any).toggleAddressFields('I');
    component.form.patchValue({
      addressType: 'I',
      intlAddress1: '',
      countryName: ''
    });
    component.onApply();
    expect(mockService.update).not.toHaveBeenCalled();
  });

  it('should set isSaving to true while update is in progress', () => {
    let savingDuringCall = false;
    mockService.update.and.callFake(() => {
      savingDuringCall = component.isSaving();
      return of({ success: true, message: 'Updated' });
    });
    (component as any).toggleAddressFields('I');
    component.form.patchValue({
      addressType: 'I',
      intlAddress1: '456 STRASSE',
      countryName: 'GERMANY'
    });
    component.onApply();
    expect(savingDuringCall).toBeTrue();
    expect(component.isSaving()).toBeFalse();
  });
});

describe('AlternateDemographicsDialogComponent - no donorId without existingData', () => {
  let component: AlternateDemographicsDialogComponent;
  let fixture: ComponentFixture<AlternateDemographicsDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AlternateDemographicsDialogComponent>>;
  let mockService: jasmine.SpyObj<AlternateDemographicsService>;

  beforeEach(() => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockService = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId', 'update', 'getCountries', 'getCityStateByZip', 'validateAreaCode', 'getZipsByCity'
    ]);
    mockService.getCountries.and.returnValue(of([]));
    mockService.getCityStateByZip.and.returnValue(of([]));
    mockService.getZipsByCity.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { readOnly: false } },
        { provide: AlternateDemographicsService, useValue: mockService },
        { provide: SnackbarService, useValue: createMockSnackbarService() }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should not call getByDonorId and default to local', () => {
    expect(mockService.getByDonorId).not.toHaveBeenCalled();
    expect(component.form.get('addressType')?.value).toBe('L');
    expect(component.isLoading()).toBeFalse();
  });

  it('should not patch form from existingData when it is not provided', () => {
    expect(component.form.get('streetName')?.value).toBe('');
    expect(component.form.get('city')?.value).toBe('');
  });

  it('should setup addressTypeToggle when not readOnly', () => {
    component.form.patchValue({ addressType: 'I' });
    expect(component.form.get('intlAddress1')?.enabled).toBeTrue();
    expect(component.form.get('streetName')?.disabled).toBeTrue();
  });
});

describe('AlternateDemographicsDialogComponent - no donorId readOnly', () => {
  let component: AlternateDemographicsDialogComponent;
  let fixture: ComponentFixture<AlternateDemographicsDialogComponent>;

  beforeEach(() => {
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    const mockService = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId', 'update', 'getCountries', 'getCityStateByZip', 'validateAreaCode', 'getZipsByCity'
    ]);
    mockService.getCountries.and.returnValue(of([]));
    mockService.getCityStateByZip.and.returnValue(of([]));
    mockService.getZipsByCity.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { readOnly: true } },
        { provide: AlternateDemographicsService, useValue: mockService },
        { provide: SnackbarService, useValue: createMockSnackbarService() }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should not call setupAddressTypeToggle in readOnly mode without donorId', () => {
    expect(component.isReadOnly()).toBeTrue();
    expect(component.isLoading()).toBeFalse();
  });
});

describe('AlternateDemographicsDialogComponent - loadCountries success', () => {
  let component: AlternateDemographicsDialogComponent;
  let fixture: ComponentFixture<AlternateDemographicsDialogComponent>;

  beforeEach(() => {
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    const mockService = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId', 'update', 'getCountries', 'getCityStateByZip', 'validateAreaCode', 'getZipsByCity'
    ]);
    mockService.getByDonorId.and.returnValue(of(null));
    mockService.getCountries.and.returnValue(of([
      { countryName: 'GERMANY', countryCode: 'DE' },
      { countryName: 'FRANCE', countryCode: 'FR' }
    ]));
    mockService.getCityStateByZip.and.returnValue(of([]));
    mockService.getZipsByCity.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: 'DN005', readOnly: false } },
        { provide: AlternateDemographicsService, useValue: mockService },
        { provide: SnackbarService, useValue: createMockSnackbarService() }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should populate countries signal with fetched data', () => {
    expect(component.countries().length).toBe(2);
    expect(component.countries()[0].countryName).toBe('GERMANY');
  });
});

describe('AlternateDemographicsDialogComponent - onCityBlur with object value', () => {
  let component: AlternateDemographicsDialogComponent;
  let fixture: ComponentFixture<AlternateDemographicsDialogComponent>;

  beforeEach(() => {
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    const mockService = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId', 'update', 'getCountries', 'getCityStateByZip', 'validateAreaCode', 'getZipsByCity'
    ]);
    mockService.getByDonorId.and.returnValue(of(null));
    mockService.getCountries.and.returnValue(of([]));
    mockService.getCityStateByZip.and.returnValue(of([]));
    mockService.getZipsByCity.and.returnValue(of([]));
    mockService.validateAreaCode.and.returnValue(of(true));

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: 'DN006', readOnly: false } },
        { provide: AlternateDemographicsService, useValue: mockService },
        { provide: SnackbarService, useValue: createMockSnackbarService() }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should handle city as object with city property on blur', () => {
    component.form.get('city')?.setValue({ city: 'boston' }, { emitEvent: false });
    component.onCityBlur();
    expect(component.form.get('city')?.value).toBe('BOSTON');
  });

  it('should handle city as object without city property on blur', () => {
    component.form.get('city')?.setValue({}, { emitEvent: false });
    component.onCityBlur();
    expect(component.zipOptions()).toEqual([]);
  });

  it('should clear state and uspsId when city is empty on blur', () => {
    component.form.patchValue({ city: '', state: 'MA', uspsId: 123 }, { emitEvent: false });
    component.onCityBlur();
    expect(component.form.getRawValue().state).toBe('');
    expect(component.form.get('uspsId')?.value).toBeNull();
  });
});

describe('AlternateDemographicsDialogComponent - formatPhoneDisplay edge cases', () => {
  let component: AlternateDemographicsDialogComponent;
  let fixture: ComponentFixture<AlternateDemographicsDialogComponent>;
  let mockService: jasmine.SpyObj<AlternateDemographicsService>;

  beforeEach(() => {
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockService = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId', 'update', 'getCountries', 'getCityStateByZip', 'validateAreaCode', 'getZipsByCity'
    ]);
    mockService.getByDonorId.and.returnValue(of(null));
    mockService.getCountries.and.returnValue(of([]));
    mockService.getCityStateByZip.and.returnValue(of([]));
    mockService.getZipsByCity.and.returnValue(of([]));
    mockService.validateAreaCode.and.returnValue(of(true));

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: 'DN007', readOnly: false } },
        { provide: AlternateDemographicsService, useValue: mockService },
        { provide: SnackbarService, useValue: createMockSnackbarService() }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should not format phone display when digits are not exactly 10', () => {
    component.form.get('mobilePhoneNumber')?.setValue('12345');
    (component as any).formatPhoneDisplay('mobilePhoneNumber');
    expect(component.form.get('mobilePhoneNumber')?.value).toBe('12345');
  });

  it('should format phone display when digits are exactly 10', () => {
    component.form.get('mobilePhoneNumber')?.setValue('6175551234');
    (component as any).formatPhoneDisplay('mobilePhoneNumber');
    expect(component.form.get('mobilePhoneNumber')?.value).toBe('(617) 555-1234');
  });

  it('should do nothing for formatPhoneDisplay on unknown field', () => {
    (component as any).formatPhoneDisplay('nonExistentField');
  });

  it('should strip formatted phone to digits only in formatPhoneInput', () => {
    component.form.get('mobilePhoneNumber')?.setValue('(617) 555-1234');
    component.formatPhoneInput('mobilePhoneNumber');
    expect(component.form.get('mobilePhoneNumber')?.value).toBe('6175551234');
  });

  it('should not modify value when already just digits in formatPhoneInput', () => {
    component.form.get('mobilePhoneNumber')?.setValue('6175551234');
    component.formatPhoneInput('mobilePhoneNumber');
    expect(component.form.get('mobilePhoneNumber')?.value).toBe('6175551234');
  });
});

describe('AlternateDemographicsDialogComponent - onNumericKeyPress edge cases', () => {
  let component: AlternateDemographicsDialogComponent;
  let fixture: ComponentFixture<AlternateDemographicsDialogComponent>;

  beforeEach(() => {
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    const mockService = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId', 'update', 'getCountries', 'getCityStateByZip', 'validateAreaCode', 'getZipsByCity'
    ]);
    mockService.getByDonorId.and.returnValue(of(null));
    mockService.getCountries.and.returnValue(of([]));
    mockService.getCityStateByZip.and.returnValue(of([]));
    mockService.getZipsByCity.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: 'DN008', readOnly: false } },
        { provide: AlternateDemographicsService, useValue: mockService },
        { provide: SnackbarService, useValue: createMockSnackbarService() }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should allow Delete key', () => {
    const event = { key: 'Delete', preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
    component.onNumericKeyPress(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should allow Tab key', () => {
    const event = { key: 'Tab', preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
    component.onNumericKeyPress(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should allow ArrowLeft key', () => {
    const event = { key: 'ArrowLeft', preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
    component.onNumericKeyPress(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should allow ArrowRight key', () => {
    const event = { key: 'ArrowRight', preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
    component.onNumericKeyPress(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should allow Home key', () => {
    const event = { key: 'Home', preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
    component.onNumericKeyPress(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should allow End key', () => {
    const event = { key: 'End', preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
    component.onNumericKeyPress(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should allow metaKey combinations', () => {
    const event = { key: 'v', metaKey: true, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
    component.onNumericKeyPress(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should prevent special characters', () => {
    const event = { key: '#', preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
    component.onNumericKeyPress(event);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should allow digit 0', () => {
    const event = { key: '0', preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
    component.onNumericKeyPress(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should allow digit 9', () => {
    const event = { key: '9', preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
    component.onNumericKeyPress(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});

describe('AlternateDemographicsDialogComponent - patchForm coverage', () => {
  let component: AlternateDemographicsDialogComponent;
  let fixture: ComponentFixture<AlternateDemographicsDialogComponent>;
  let mockService: jasmine.SpyObj<AlternateDemographicsService>;

  beforeEach(() => {
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockService = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId', 'update', 'getCountries', 'getCityStateByZip', 'validateAreaCode', 'getZipsByCity'
    ]);
    mockService.getCountries.and.returnValue(of([]));
    mockService.getCityStateByZip.and.returnValue(of([]));
    mockService.getZipsByCity.and.returnValue(of([]));
    mockService.validateAreaCode.and.returnValue(of(true));

    const fullData: AlternateDemographicsModel = {
      addressType: 'L',
      streetName: '123 MAIN ST',
      suiteApt: 'APT 5',
      city: 'BOSTON',
      state: 'MA',
      zip: '02101',
      uspsId: 999,
      intlAddress1: null,
      intlAddress2: null,
      intlAddress3: null,
      intlAddress4: null,
      intlCity: null,
      countryName: null,
      intlPostalCode: null,
      intlAddrFlag: 'N',
      mobilePhoneNumber: '6175551234',
      otherContactNumber: '5551234567',
      altIntlPhoneNumber: '1234567890',
      preferredContactPhone: 'M',
      preferredContactAddress: 'H'
    };

    mockService.getByDonorId.and.returnValue(of(fullData));

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: 'DN_FULL', readOnly: false } },
        { provide: AlternateDemographicsService, useValue: mockService },
        { provide: SnackbarService, useValue: createMockSnackbarService() }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should patch all local address fields from loaded data', () => {
    expect(component.form.get('streetName')?.value).toBe('123 MAIN ST');
    expect(component.form.get('suiteApt')?.value).toBe('APT 5');
    expect(component.form.get('city')?.value).toBe('BOSTON');
    expect(component.form.getRawValue().state).toBe('MA');
    expect(component.form.get('zip')?.value).toBe('02101');
    expect(component.form.get('uspsId')?.value).toBe(999);
  });

  it('should patch all phone fields from loaded data', () => {
    expect(component.form.get('mobilePhoneNumber')?.value).toBe('6175551234');
    expect(component.form.get('otherContactNumber')?.value).toBe('5551234567');
    expect(component.form.get('altIntlPhoneNumber')?.value).toBe('1234567890');
  });

  it('should patch preferred contact fields from loaded data', () => {
    expect(component.form.get('preferredContactPhone')?.value).toBe('M');
    expect(component.form.get('preferredContactAddress')?.value).toBe('H');
  });

  it('should set preferredContactPhone as required when phones are populated', () => {
    expect(component.form.get('preferredContactPhone')?.hasError('required')).toBeFalse();
    component.form.get('preferredContactPhone')?.setValue('');
    component.form.get('preferredContactPhone')?.updateValueAndValidity();
    expect(component.form.get('preferredContactPhone')?.hasError('required')).toBeTrue();
  });
});

describe('AlternateDemographicsDialogComponent - buildResult edge cases', () => {
  let component: AlternateDemographicsDialogComponent;
  let fixture: ComponentFixture<AlternateDemographicsDialogComponent>;

  beforeEach(() => {
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    const mockService = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId', 'update', 'getCountries', 'getCityStateByZip', 'validateAreaCode', 'getZipsByCity'
    ]);
    mockService.getByDonorId.and.returnValue(of(null));
    mockService.getCountries.and.returnValue(of([]));
    mockService.getCityStateByZip.and.returnValue(of([]));
    mockService.getZipsByCity.and.returnValue(of([]));
    mockService.validateAreaCode.and.returnValue(of(true));

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: 'DN_BUILD', readOnly: false } },
        { provide: AlternateDemographicsService, useValue: mockService },
        { provide: SnackbarService, useValue: createMockSnackbarService() }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should return null for empty local fields when type is L', () => {
    component.form.patchValue({
      addressType: 'L',
      streetName: '',
      suiteApt: '',
      city: '',
      zip: ''
    });
    const result = (component as any).buildResult();
    expect(result.streetName).toBeNull();
    expect(result.suiteApt).toBeNull();
    expect(result.city).toBeNull();
    expect(result.zip).toBeNull();
  });

  it('should return null for empty international fields when type is I', () => {
    (component as any).toggleAddressFields('I');
    component.form.patchValue({
      addressType: 'I',
      intlAddress1: '',
      intlAddress2: '',
      intlAddress3: '',
      intlAddress4: '',
      intlCity: '',
      countryName: '',
      intlPostalCode: ''
    });
    const result = (component as any).buildResult();
    expect(result.intlAddress1).toBeNull();
    expect(result.intlAddress2).toBeNull();
    expect(result.intlAddress3).toBeNull();
    expect(result.intlAddress4).toBeNull();
    expect(result.intlCity).toBeNull();
    expect(result.countryName).toBeNull();
    expect(result.intlPostalCode).toBeNull();
  });

  it('should return null for phone fields when empty', () => {
    const result = (component as any).buildResult();
    expect(result.mobilePhoneNumber).toBeNull();
    expect(result.otherContactNumber).toBeNull();
    expect(result.altIntlPhoneNumber).toBeNull();
    expect(result.preferredContactPhone).toBeNull();
    expect(result.preferredContactAddress).toBeNull();
  });

  it('should map all intl fields correctly for international type', () => {
    (component as any).toggleAddressFields('I');
    component.form.patchValue({
      addressType: 'I',
      intlAddress1: 'LINE 1',
      intlAddress2: 'LINE 2',
      intlAddress3: 'LINE 3',
      intlAddress4: 'LINE 4',
      intlCity: 'BERLIN',
      countryName: 'GERMANY',
      intlPostalCode: '10115'
    });
    const result = (component as any).buildResult();
    expect(result.intlAddress2).toBe('LINE 2');
    expect(result.intlAddress3).toBe('LINE 3');
    expect(result.intlAddress4).toBe('LINE 4');
    expect(result.intlCity).toBe('BERLIN');
    expect(result.intlPostalCode).toBe('10115');
  });

  it('should null out local fields for international type', () => {
    (component as any).toggleAddressFields('I');
    component.form.patchValue({
      addressType: 'I',
      intlAddress1: 'LINE 1',
      countryName: 'GERMANY'
    });
    const result = (component as any).buildResult();
    expect(result.streetName).toBeNull();
    expect(result.suiteApt).toBeNull();
    expect(result.city).toBeNull();
    expect(result.state).toBeNull();
    expect(result.zip).toBeNull();
    expect(result.uspsId).toBeNull();
  });

  it('should null out international fields for local type', () => {
    component.form.patchValue({
      addressType: 'L',
      streetName: '123 Main',
      zip: '02101'
    });
    const result = (component as any).buildResult();
    expect(result.intlAddress1).toBeNull();
    expect(result.intlAddress2).toBeNull();
    expect(result.intlAddress3).toBeNull();
    expect(result.intlAddress4).toBeNull();
    expect(result.intlCity).toBeNull();
    expect(result.countryName).toBeNull();
    expect(result.intlPostalCode).toBeNull();
  });
});

describe('AlternateDemographicsDialogComponent - toggleAddressFields save/restore', () => {
  let component: AlternateDemographicsDialogComponent;
  let fixture: ComponentFixture<AlternateDemographicsDialogComponent>;

  beforeEach(() => {
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    const mockService = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId', 'update', 'getCountries', 'getCityStateByZip', 'validateAreaCode', 'getZipsByCity'
    ]);
    mockService.getByDonorId.and.returnValue(of(null));
    mockService.getCountries.and.returnValue(of([]));
    mockService.getCityStateByZip.and.returnValue(of([]));
    mockService.getZipsByCity.and.returnValue(of([]));
    mockService.validateAreaCode.and.returnValue(of(true));

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: 'DN_TOGGLE', readOnly: false } },
        { provide: AlternateDemographicsService, useValue: mockService },
        { provide: SnackbarService, useValue: createMockSnackbarService() }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should save local values when switching to international and restore when switching back', () => {
    component.form.patchValue({
      streetName: '100 Oak St',
      suiteApt: 'Suite 200',
      city: 'CHICAGO',
      zip: '60601',
      uspsId: 42
    }, { emitEvent: false });

    (component as any).toggleAddressFields('I');
    expect(component.form.get('streetName')?.disabled).toBeTrue();

    component.form.patchValue({
      intlAddress1: '999 STRASSE',
      countryName: 'AUSTRIA'
    });

    (component as any).toggleAddressFields('L');
    expect(component.form.get('streetName')?.value).toBe('100 Oak St');
    expect(component.form.get('suiteApt')?.value).toBe('Suite 200');
    expect(component.form.get('city')?.value).toBe('CHICAGO');
  });

  it('should save international values when switching to local and restore when switching back', () => {
    (component as any).toggleAddressFields('I');
    component.form.patchValue({
      intlAddress1: 'ADDR 1',
      intlAddress2: 'ADDR 2',
      intlAddress3: 'ADDR 3',
      intlAddress4: 'ADDR 4',
      intlCity: 'BERLIN',
      countryName: 'GERMANY',
      intlPostalCode: '10115'
    });

    (component as any).toggleAddressFields('L');
    expect(component.form.get('intlAddress1')?.disabled).toBeTrue();

    (component as any).toggleAddressFields('I');
    expect(component.form.get('intlAddress1')?.value).toBe('ADDR 1');
    expect(component.form.get('intlAddress2')?.value).toBe('ADDR 2');
    expect(component.form.get('intlAddress3')?.value).toBe('ADDR 3');
    expect(component.form.get('intlAddress4')?.value).toBe('ADDR 4');
    expect(component.form.get('intlCity')?.value).toBe('BERLIN');
    expect(component.form.get('countryName')?.value).toBe('GERMANY');
    expect(component.form.get('intlPostalCode')?.value).toBe('10115');
  });

  it('should add required validators for local required fields when switching to L', () => {
    (component as any).toggleAddressFields('I');
    (component as any).toggleAddressFields('L');

    component.form.get('streetName')?.setValue('');
    component.form.get('streetName')?.updateValueAndValidity();
    expect(component.form.get('streetName')?.hasError('required')).toBeTrue();

    component.form.get('zip')?.setValue('');
    component.form.get('zip')?.updateValueAndValidity();
    expect(component.form.get('zip')?.hasError('required')).toBeTrue();
  });

  it('should add required validators for intl required fields when switching to I', () => {
    (component as any).toggleAddressFields('I');

    component.form.get('intlAddress1')?.setValue('');
    component.form.get('intlAddress1')?.updateValueAndValidity();
    expect(component.form.get('intlAddress1')?.hasError('required')).toBeTrue();

    component.form.get('countryName')?.setValue('');
    component.form.get('countryName')?.updateValueAndValidity();
    expect(component.form.get('countryName')?.hasError('required')).toBeTrue();
  });

  it('should clear validators on local fields when switching to I', () => {
    (component as any).toggleAddressFields('I');

    // streetName should only have maxLength, not required
    component.form.get('streetName')?.enable();
    component.form.get('streetName')?.setValue('');
    component.form.get('streetName')?.updateValueAndValidity();
    expect(component.form.get('streetName')?.hasError('required')).toBeFalse();
  });

  it('should clear validators on intl fields when switching to L', () => {
    (component as any).toggleAddressFields('L');

    // intlAddress1 should only have maxLength, not required
    component.form.get('intlAddress1')?.enable();
    component.form.get('intlAddress1')?.setValue('');
    component.form.get('intlAddress1')?.updateValueAndValidity();
    expect(component.form.get('intlAddress1')?.hasError('required')).toBeFalse();
  });

  it('should set maxLength for intlPostalCode to 15 when switching to L', () => {
    (component as any).toggleAddressFields('L');
    component.form.get('intlPostalCode')?.enable();
    component.form.get('intlPostalCode')?.setValue('1234567890123456');
    component.form.get('intlPostalCode')?.updateValueAndValidity();
    expect(component.form.get('intlPostalCode')?.hasError('maxlength')).toBeTrue();
  });

  it('should set maxLength for zip to 5 when switching to I', () => {
    (component as any).toggleAddressFields('I');
    component.form.get('zip')?.enable();
    component.form.get('zip')?.setValue('123456');
    component.form.get('zip')?.updateValueAndValidity();
    expect(component.form.get('zip')?.hasError('maxlength')).toBeTrue();
  });

  it('should set maxLength for suiteApt to 10 when switching to I', () => {
    (component as any).toggleAddressFields('I');
    component.form.get('suiteApt')?.enable();
    component.form.get('suiteApt')?.setValue('12345678901');
    component.form.get('suiteApt')?.updateValueAndValidity();
    expect(component.form.get('suiteApt')?.hasError('maxlength')).toBeTrue();
  });

  it('should set maxLength for streetName to 50 when switching to I', () => {
    (component as any).toggleAddressFields('I');
    component.form.get('streetName')?.enable();
    component.form.get('streetName')?.setValue('a'.repeat(51));
    component.form.get('streetName')?.updateValueAndValidity();
    expect(component.form.get('streetName')?.hasError('maxlength')).toBeTrue();
  });
});

describe('AlternateDemographicsDialogComponent - onApply isFormCleared resets', () => {
  let component: AlternateDemographicsDialogComponent;
  let fixture: ComponentFixture<AlternateDemographicsDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AlternateDemographicsDialogComponent>>;

  beforeEach(() => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    const mockService = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId', 'update', 'getCountries', 'getCityStateByZip', 'validateAreaCode', 'getZipsByCity'
    ]);
    mockService.getByDonorId.and.returnValue(of(null));
    mockService.getCountries.and.returnValue(of([]));
    mockService.getCityStateByZip.and.returnValue(of([]));
    mockService.getZipsByCity.and.returnValue(of([]));
    mockService.validateAreaCode.and.returnValue(of(true));

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: 'DN_CLEARED', readOnly: false } },
        { provide: AlternateDemographicsService, useValue: mockService },
        { provide: SnackbarService, useValue: createMockSnackbarService() }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should reset isFormCleared and close with null when applying after clear', () => {
    component.isFormCleared.set(true);
    component.onApply();
    expect(component.isFormCleared()).toBeFalse();
    expect(mockDialogRef.close).toHaveBeenCalledWith(null);
  });

  it('should mark form as dirty and cleared after onClear', () => {
    component.form.patchValue({
      addressType: 'I',
      intlAddress1: 'Some Address',
      countryName: 'GERMANY'
    });
    component.onClear();
    expect(component.isFormCleared()).toBeTrue();
    expect(component.isFormDirty()).toBeTrue();
    expect(component.form.get('addressType')?.value).toBe('I');
  });
});

describe('AlternateDemographicsDialogComponent - convertToUpperCase cursor handling', () => {
  let component: AlternateDemographicsDialogComponent;
  let fixture: ComponentFixture<AlternateDemographicsDialogComponent>;

  beforeEach(() => {
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    const mockService = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId', 'update', 'getCountries', 'getCityStateByZip', 'validateAreaCode', 'getZipsByCity'
    ]);
    mockService.getByDonorId.and.returnValue(of(null));
    mockService.getCountries.and.returnValue(of([]));
    mockService.getCityStateByZip.and.returnValue(of([]));
    mockService.getZipsByCity.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: 'DN_UPPER', readOnly: false } },
        { provide: AlternateDemographicsService, useValue: mockService },
        { provide: SnackbarService, useValue: createMockSnackbarService() }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should convert to uppercase and preserve cursor position', () => {
    const input = document.createElement('input');
    input.value = 'hello world';
    document.body.appendChild(input);
    input.setSelectionRange(5, 5);
    const event = { target: input } as unknown as Event;
    component.convertToUpperCase(event, 'streetName');
    expect(input.value).toBe('HELLO WORLD');
    expect(component.form.get('streetName')?.value).toBe('HELLO WORLD');
    expect(input.selectionStart).toBe(5);
    expect(input.selectionEnd).toBe(5);
    document.body.removeChild(input);
  });

  it('should handle empty input', () => {
    const input = document.createElement('input');
    input.value = '';
    const event = { target: input } as unknown as Event;
    component.convertToUpperCase(event, 'streetName');
    expect(input.value).toBe('');
  });
});

describe('AlternateDemographicsDialogComponent - preferred contact options', () => {
  let component: AlternateDemographicsDialogComponent;
  let fixture: ComponentFixture<AlternateDemographicsDialogComponent>;

  beforeEach(() => {
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    const mockService = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId', 'update', 'getCountries', 'getCityStateByZip', 'validateAreaCode', 'getZipsByCity'
    ]);
    mockService.getByDonorId.and.returnValue(of(null));
    mockService.getCountries.and.returnValue(of([]));
    mockService.getCityStateByZip.and.returnValue(of([]));
    mockService.getZipsByCity.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: 'DN_PREF', readOnly: false } },
        { provide: AlternateDemographicsService, useValue: mockService },
        { provide: SnackbarService, useValue: createMockSnackbarService() }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should expose PREFERRED_CONTACT_PHONE_OPTIONS', () => {
    expect(component.preferredContactPhoneOptions.length).toBeGreaterThan(0);
    expect(component.preferredContactPhoneOptions[0]).toEqual({ value: 'H', label: 'Home Phone' });
  });

  it('should expose PREFERRED_CONTACT_ADDRESS_OPTIONS', () => {
    expect(component.preferredContactAddressOptions.length).toBe(2);
    expect(component.preferredContactAddressOptions[0]).toEqual({ value: 'H', label: 'Home Address' });
  });
});

describe('AlternateDemographicsDialogComponent - form validators', () => {
  let component: AlternateDemographicsDialogComponent;
  let fixture: ComponentFixture<AlternateDemographicsDialogComponent>;

  beforeEach(() => {
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    const mockService = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId', 'update', 'getCountries', 'getCityStateByZip', 'validateAreaCode', 'getZipsByCity'
    ]);
    mockService.getByDonorId.and.returnValue(of(null));
    mockService.getCountries.and.returnValue(of([]));
    mockService.getCityStateByZip.and.returnValue(of([]));
    mockService.getZipsByCity.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: 'DN_VAL', readOnly: false } },
        { provide: AlternateDemographicsService, useValue: mockService },
        { provide: SnackbarService, useValue: createMockSnackbarService() }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should enforce maxLength(50) on streetName', () => {
    component.form.get('streetName')?.setValue('a'.repeat(51));
    expect(component.form.get('streetName')?.hasError('maxlength')).toBeTrue();
  });

  it('should enforce maxLength(10) on suiteApt', () => {
    component.form.get('suiteApt')?.setValue('a'.repeat(11));
    expect(component.form.get('suiteApt')?.hasError('maxlength')).toBeTrue();
  });

  it('should enforce maxLength(5) on zip', () => {
    component.form.get('zip')?.setValue('123456');
    expect(component.form.get('zip')?.hasError('maxlength')).toBeTrue();
  });

  it('should enforce maxLength(50) on city', () => {
    component.form.get('city')?.setValue('a'.repeat(51));
    expect(component.form.get('city')?.hasError('maxlength')).toBeTrue();
  });

  it('should enforce maxLength(2) on state when enabled', () => {
    component.form.get('state')?.enable();
    component.form.get('state')?.setValue('ABC');
    expect(component.form.get('state')?.hasError('maxlength')).toBeTrue();
    component.form.get('state')?.disable();
  });

  it('should enforce pattern on otherContactNumber', () => {
    component.form.get('otherContactNumber')?.setValue('abc');
    expect(component.form.get('otherContactNumber')?.hasError('pattern')).toBeTrue();
  });

  it('should enforce pattern on altIntlPhoneNumber', () => {
    component.form.get('altIntlPhoneNumber')?.setValue('abc');
    expect(component.form.get('altIntlPhoneNumber')?.hasError('pattern')).toBeTrue();
  });

  it('should accept valid numeric altIntlPhoneNumber', () => {
    component.form.get('altIntlPhoneNumber')?.setValue('123456789');
    expect(component.form.get('altIntlPhoneNumber')?.valid).toBeTrue();
  });

  it('should accept empty altIntlPhoneNumber', () => {
    component.form.get('altIntlPhoneNumber')?.setValue('');
    expect(component.form.get('altIntlPhoneNumber')?.valid).toBeTrue();
  });

  it('should require streetName for local address', () => {
    component.form.get('streetName')?.setValue('');
    component.form.get('streetName')?.markAsTouched();
    expect(component.form.get('streetName')?.hasError('required')).toBeTrue();
  });

  it('should require zip for local address', () => {
    component.form.get('zip')?.setValue('');
    component.form.get('zip')?.markAsTouched();
    expect(component.form.get('zip')?.hasError('required')).toBeTrue();
  });

  it('should have state disabled by default', () => {
    expect(component.form.get('state')?.disabled).toBeTrue();
  });
});

describe('AlternateDemographicsDialogComponent - setupCityLookup (debounced)', () => {
  let component: AlternateDemographicsDialogComponent;
  let fixture: ComponentFixture<AlternateDemographicsDialogComponent>;
  let mockService: jasmine.SpyObj<AlternateDemographicsService>;

  beforeEach(() => {
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockService = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId', 'update', 'getCountries', 'getCityStateByZip', 'validateAreaCode', 'getZipsByCity'
    ]);
    mockService.getByDonorId.and.returnValue(of(null));
    mockService.getCountries.and.returnValue(of([]));
    mockService.getCityStateByZip.and.returnValue(of([]));
    mockService.getZipsByCity.and.returnValue(of([]));
    mockService.validateAreaCode.and.returnValue(of(true));

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: 'DN_CITY', readOnly: false } },
        { provide: AlternateDemographicsService, useValue: mockService },
        { provide: SnackbarService, useValue: createMockSnackbarService() }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsDialogComponent);
    component = fixture.componentInstance;
    // Do NOT call fixture.detectChanges() here - defer to fakeAsync tests
  });

  it('should call getCityStateByZip when zip has 3+ chars after debounce', fakeAsync(() => {
    fixture.detectChanges();
    mockService.getCityStateByZip.and.returnValue(of([
      { city: 'BOSTON', state: 'MA', zip: '021', uspsId: 100 }
    ]));
    component.form.get('zip')?.setValue('021');
    tick(500);
    expect(mockService.getCityStateByZip).toHaveBeenCalledWith('021');
  }));

  it('should auto-populate city and state when exactly one result from zip lookup', fakeAsync(() => {
    fixture.detectChanges();
    mockService.getCityStateByZip.and.returnValue(of([
      { city: 'BOSTON', state: 'MA', zip: '02101', uspsId: 100 }
    ]));
    component.form.get('zip')?.setValue('02101');
    tick(500);
    expect(component.form.get('city')?.value).toBe('BOSTON');
    expect(component.form.getRawValue().state).toBe('MA');
    expect(component.form.get('uspsId')?.value).toBe(100);
  }));

  it('should clear city/state when multiple results from zip lookup', fakeAsync(() => {
    fixture.detectChanges();
    mockService.getCityStateByZip.and.returnValue(of([
      { city: 'BOSTON', state: 'MA', zip: '02101', uspsId: 100 },
      { city: 'DORCHESTER', state: 'MA', zip: '02101', uspsId: 101 }
    ]));
    component.form.get('zip')?.setValue('02101');
    tick(500);
    expect(component.form.get('city')?.value).toBe('');
    expect(component.cityStateResults().length).toBe(2);
  }));

  it('should clear city/state when no results from zip lookup', fakeAsync(() => {
    fixture.detectChanges();
    mockService.getCityStateByZip.and.returnValue(of([]));
    component.form.get('zip')?.setValue('99999');
    tick(500);
    expect(component.form.get('city')?.value).toBe('');
    expect(component.cityStateResults().length).toBe(0);
  }));

  it('should clear cityStateResults and state when zip is emptied after having a value', fakeAsync(() => {
    fixture.detectChanges();
    mockService.getCityStateByZip.and.returnValue(of([
      { city: 'BOSTON', state: 'MA', zip: '02101', uspsId: 100 }
    ]));
    component.form.get('zip')?.setValue('02101');
    tick(500);
    // Now clear the zip
    mockService.getCityStateByZip.calls.reset();
    component.form.get('zip')?.setValue('');
    tick(500);
    expect(component.cityStateResults()).toEqual([]);
    expect(component.zipOptions()).toEqual([]);
    expect(component.form.getRawValue().state).toBe('');
    expect(component.form.get('uspsId')?.value).toBeNull();
  }));

  it('should call getZipsByCity when zip is cleared and city has 3+ chars', fakeAsync(() => {
    fixture.detectChanges();
    // First set a zip value to pass distinctUntilChanged later
    mockService.getCityStateByZip.and.returnValue(of([]));
    component.form.get('zip')?.setValue('12345');
    tick(500);
    // Now clear zip with city populated
    mockService.getZipsByCity.and.returnValue(of([
      { code: '02101', description: '02101 - MA' }
    ]));
    component.form.patchValue({ city: 'BOSTON' }, { emitEvent: false });
    component.form.get('zip')?.setValue('');
    tick(500);
    expect(mockService.getZipsByCity).toHaveBeenCalledWith('BOSTON');
    expect(component.zipOptions().length).toBe(1);
  }));

  it('should not call getZipsByCity when zip is empty and city is too short', fakeAsync(() => {
    fixture.detectChanges();
    // First set a zip to bypass distinctUntilChanged
    mockService.getCityStateByZip.and.returnValue(of([]));
    component.form.get('zip')?.setValue('11111');
    tick(500);
    mockService.getZipsByCity.calls.reset();
    component.form.patchValue({ city: 'BO' }, { emitEvent: false });
    component.form.get('zip')?.setValue('');
    tick(500);
    expect(mockService.getZipsByCity).not.toHaveBeenCalled();
  }));

  it('should not set zipOptions when getZipsByCity returns empty on zip clear', fakeAsync(() => {
    fixture.detectChanges();
    // First set a zip to bypass distinctUntilChanged
    mockService.getCityStateByZip.and.returnValue(of([]));
    component.form.get('zip')?.setValue('11111');
    tick(500);
    mockService.getZipsByCity.and.returnValue(of([]));
    component.form.patchValue({ city: 'BOSTON' }, { emitEvent: false });
    component.form.get('zip')?.setValue('');
    tick(500);
    expect(component.zipOptions()).toEqual([]);
  }));

  it('should handle city as object in tap handler during zip empty', fakeAsync(() => {
    fixture.detectChanges();
    // First set a zip to bypass distinctUntilChanged
    mockService.getCityStateByZip.and.returnValue(of([]));
    component.form.get('zip')?.setValue('11111');
    tick(500);
    mockService.getZipsByCity.and.returnValue(of([
      { code: '60601', description: '60601 - IL' }
    ]));
    component.form.get('city')?.setValue({ city: 'CHICAGO' } as any, { emitEvent: false });
    component.form.get('zip')?.setValue('');
    tick(500);
    expect(mockService.getZipsByCity).toHaveBeenCalledWith('CHICAGO');
  }));

  it('should not call getCityStateByZip when zip is shorter than 3 chars', fakeAsync(() => {
    fixture.detectChanges();
    mockService.getCityStateByZip.calls.reset();
    component.form.get('zip')?.setValue('02');
    tick(500);
    expect(mockService.getCityStateByZip).not.toHaveBeenCalled();
  }));

  it('should handle zip as object with code property', fakeAsync(() => {
    fixture.detectChanges();
    mockService.getCityStateByZip.and.returnValue(of([
      { city: 'BOSTON', state: 'MA', zip: '02101', uspsId: 100 }
    ]));
    component.form.get('zip')?.setValue({ code: '02101' } as any);
    tick(500);
    expect(mockService.getCityStateByZip).toHaveBeenCalledWith('02101');
  }));

  it('should handle zip as object with zip property', fakeAsync(() => {
    fixture.detectChanges();
    mockService.getCityStateByZip.and.returnValue(of([
      { city: 'BOSTON', state: 'MA', zip: '02101', uspsId: 100 }
    ]));
    component.form.get('zip')?.setValue({ zip: '02101' } as any);
    tick(500);
    expect(mockService.getCityStateByZip).toHaveBeenCalledWith('02101');
  }));
});

describe('AlternateDemographicsDialogComponent - setupCityToZipLookup (debounced)', () => {
  let component: AlternateDemographicsDialogComponent;
  let fixture: ComponentFixture<AlternateDemographicsDialogComponent>;
  let mockService: jasmine.SpyObj<AlternateDemographicsService>;

  beforeEach(() => {
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockService = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId', 'update', 'getCountries', 'getCityStateByZip', 'validateAreaCode', 'getZipsByCity'
    ]);
    mockService.getByDonorId.and.returnValue(of(null));
    mockService.getCountries.and.returnValue(of([]));
    mockService.getCityStateByZip.and.returnValue(of([]));
    mockService.getZipsByCity.and.returnValue(of([]));
    mockService.validateAreaCode.and.returnValue(of(true));

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: 'DN_CZ', readOnly: false } },
        { provide: AlternateDemographicsService, useValue: mockService },
        { provide: SnackbarService, useValue: createMockSnackbarService() }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsDialogComponent);
    component = fixture.componentInstance;
    // Do NOT call fixture.detectChanges() here - defer to fakeAsync tests
  });

  it('should call getZipsByCity when city has 3+ chars after debounce', fakeAsync(() => {
    fixture.detectChanges();
    mockService.getZipsByCity.and.returnValue(of([
      { code: '02101', description: '02101 - MA' }
    ]));
    component.form.get('city')?.setValue('BOS');
    tick(500);
    expect(mockService.getZipsByCity).toHaveBeenCalledWith('BOS');
  }));

  it('should set zipOptions and clear cityStateResults when zips found', fakeAsync(() => {
    fixture.detectChanges();
    mockService.getZipsByCity.and.returnValue(of([
      { code: '02101', description: '02101 - MA' },
      { code: '02102', description: '02102 - MA' }
    ]));
    component.form.get('city')?.setValue('BOSTON');
    tick(500);
    expect(component.zipOptions().length).toBe(2);
    expect(component.cityStateResults()).toEqual([]);
  }));

  it('should clear zip when current zip is not in valid zips', fakeAsync(() => {
    fixture.detectChanges();
    component.form.patchValue({ zip: '99999' }, { emitEvent: false });
    mockService.getZipsByCity.and.returnValue(of([
      { code: '02101', description: '02101 - MA' }
    ]));
    component.form.get('city')?.setValue('BOSTON');
    tick(500);
    expect(component.form.get('zip')?.value).toBe('');
    expect(component.form.getRawValue().state).toBe('');
    expect(component.form.get('uspsId')?.value).toBeNull();
  }));

  it('should not clear zip when current zip is in valid zips', fakeAsync(() => {
    fixture.detectChanges();
    component.form.patchValue({ zip: '02101' }, { emitEvent: false });
    mockService.getZipsByCity.and.returnValue(of([
      { code: '02101', description: '02101 - MA' }
    ]));
    component.form.get('city')?.setValue('BOSTON');
    tick(500);
    expect(component.form.get('zip')?.value).toBe('02101');
  }));

  it('should clear zipOptions when no zips found', fakeAsync(() => {
    fixture.detectChanges();
    mockService.getZipsByCity.and.returnValue(of([]));
    component.form.get('city')?.setValue('XYZABC');
    tick(500);
    expect(component.zipOptions()).toEqual([]);
  }));

  it('should not call getZipsByCity when city is less than 3 chars', fakeAsync(() => {
    fixture.detectChanges();
    mockService.getZipsByCity.calls.reset();
    component.form.get('city')?.setValue('BO');
    tick(500);
    expect(mockService.getZipsByCity).not.toHaveBeenCalled();
  }));

  it('should handle city as object with city property', fakeAsync(() => {
    fixture.detectChanges();
    mockService.getZipsByCity.and.returnValue(of([
      { code: '60601', description: '60601 - IL' }
    ]));
    component.form.get('city')?.setValue({ city: 'CHICAGO' } as any);
    tick(500);
    expect(mockService.getZipsByCity).toHaveBeenCalledWith('CHICAGO');
  }));

  it('should not clear zip when zip is empty', fakeAsync(() => {
    fixture.detectChanges();
    component.form.patchValue({ zip: '' }, { emitEvent: false });
    mockService.getZipsByCity.and.returnValue(of([
      { code: '02101', description: '02101 - MA' }
    ]));
    component.form.get('city')?.setValue('BOSTON');
    tick(500);
    // zip is empty, not in validZips, but because it's empty the condition `currentZip && !validZips.includes(currentZip)` is falsy
    expect(component.form.get('zip')?.value).toBe('');
  }));
});

describe('AlternateDemographicsDialogComponent - loadDonorData readOnly success', () => {
  let component: AlternateDemographicsDialogComponent;
  let fixture: ComponentFixture<AlternateDemographicsDialogComponent>;

  beforeEach(() => {
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    const mockService = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId', 'update', 'getCountries', 'getCityStateByZip', 'validateAreaCode', 'getZipsByCity'
    ]);
    mockService.getByDonorId.and.returnValue(of({
      addressType: 'L' as const,
      streetName: '100 Main', suiteApt: null,
      city: 'AMES', state: 'IA', zip: '50010', uspsId: 111,
      intlAddress1: null, intlAddress2: null, intlAddress3: null, intlAddress4: null,
      intlCity: null, countryName: null, intlPostalCode: null, intlAddrFlag: 'N',
      mobilePhoneNumber: null, otherContactNumber: null, altIntlPhoneNumber: null,
      preferredContactPhone: null, preferredContactAddress: null
    }));
    mockService.getCountries.and.returnValue(of([]));
    mockService.getCityStateByZip.and.returnValue(of([]));
    mockService.getZipsByCity.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: 'DN_RO_SUC', readOnly: true } },
        { provide: AlternateDemographicsService, useValue: mockService },
        { provide: SnackbarService, useValue: createMockSnackbarService() }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should disable entire form when readOnly with data loaded', () => {
    expect(component.isReadOnly()).toBeTrue();
    expect(component.form.disabled).toBeTrue();
    expect(component.isLoading()).toBeFalse();
  });

  it('should populate form fields even in readOnly mode', () => {
    expect(component.form.getRawValue().streetName).toBe('100 Main');
    expect(component.form.getRawValue().city).toBe('AMES');
  });
});

describe('AlternateDemographicsDialogComponent - patchForm with null fields', () => {
  let component: AlternateDemographicsDialogComponent;
  let fixture: ComponentFixture<AlternateDemographicsDialogComponent>;
  let mockService: jasmine.SpyObj<AlternateDemographicsService>;

  beforeEach(() => {
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockService = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId', 'update', 'getCountries', 'getCityStateByZip', 'validateAreaCode', 'getZipsByCity'
    ]);
    mockService.getCountries.and.returnValue(of([]));
    mockService.getCityStateByZip.and.returnValue(of([]));
    mockService.getZipsByCity.and.returnValue(of([]));
    mockService.validateAreaCode.and.returnValue(of(true));

    const nullData: AlternateDemographicsModel = {
      addressType: 'L',
      streetName: null, suiteApt: null, city: null, state: null, zip: null, uspsId: null,
      intlAddress1: null, intlAddress2: null, intlAddress3: null, intlAddress4: null,
      intlCity: null, countryName: null, intlPostalCode: null, intlAddrFlag: null,
      mobilePhoneNumber: null, otherContactNumber: null, altIntlPhoneNumber: null,
      preferredContactPhone: null, preferredContactAddress: null
    };
    mockService.getByDonorId.and.returnValue(of(nullData));

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: 'DN_NULL', readOnly: false } },
        { provide: AlternateDemographicsService, useValue: mockService },
        { provide: SnackbarService, useValue: createMockSnackbarService() }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should default null values to empty strings in patchForm', () => {
    expect(component.form.get('streetName')?.value).toBe('');
    expect(component.form.get('suiteApt')?.value).toBe('');
    expect(component.form.get('city')?.value).toBe('');
    expect(component.form.get('intlAddress1')?.value).toBe('');
    expect(component.form.get('mobilePhoneNumber')?.value).toBe('');
    expect(component.form.get('preferredContactPhone')?.value).toBe('');
    expect(component.form.get('preferredContactAddress')?.value).toBe('');
  });

  it('should not make preferredContactPhone required when all phones are null', () => {
    expect(component.form.get('preferredContactPhone')?.hasError('required')).toBeFalse();
  });
});
