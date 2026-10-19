import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { SnackbarService } from '@shared/services/snackbar.service';
import { InternationalAddressService } from '@shared/services/international-address.service';
import { CountryModel } from '@shared/models/international-address.model';
import {
  EmployerIntlAddressDialogComponent,
  EmployerIntlAddressResult,
  EmployerIntlAddressDialogData,
} from './employer-intl-address-dialog.component';

describe('EmployerIntlAddressDialogComponent', () => {
  let component: EmployerIntlAddressDialogComponent;
  let fixture: ComponentFixture<EmployerIntlAddressDialogComponent>;

  const mockDialogRef = { close: jest.fn() };
  const mockIntlAddressService = { getCountries: jest.fn() };
  let snackbarShowSuccessSpy: jest.SpyInstance;

  const mockCountries: CountryModel[] = [
    { code: 'US', description: 'UNITED STATES' },
    { code: 'CA', description: 'CANADA' },
    { code: 'MX', description: 'MEXICO' },
    { code: 'GB', description: 'UNITED KINGDOM' },
  ];

  const mockExistingAddress: EmployerIntlAddressResult = {
    city: 'TORONTO',
    state: 'ON',
    postalCode: 'M5V 3L9',
    country: 'CANADA',
    intlAddrFlag: 'Y',
    modifiedFlag: 'N',
  };

  function setupTestBed(dialogData: EmployerIntlAddressDialogData = {}): void {
    TestBed.configureTestingModule({
      imports: [EmployerIntlAddressDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: InternationalAddressService, useValue: mockIntlAddressService },
      ],
    });

    fixture = TestBed.createComponent(EmployerIntlAddressDialogComponent);
    component = fixture.componentInstance;
    snackbarShowSuccessSpy = jest.spyOn((component as any).snackbarService, 'showSuccess');
    fixture.detectChanges();
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockIntlAddressService.getCountries.mockReturnValue(of(mockCountries));
  });

  afterEach(() => TestBed.resetTestingModule());

  describe('Initialization', () => {
    it('should create the component', () => {
      setupTestBed();
      expect(component).toBeTruthy();
    });

    it('should initialize form with empty values when no existing address', () => {
      setupTestBed();
      const formValue = component.addressForm.getRawValue();
      expect(formValue.city).toBe('');
      expect(formValue.postalCode).toBe('');
      expect(formValue.state).toBe('');
      expect(formValue.country).toBe('');
    });

    it('should load countries on init', () => {
      setupTestBed();
      expect(mockIntlAddressService.getCountries).toHaveBeenCalled();
      expect(component.countries()).toEqual(mockCountries);
      expect(component.filteredCountries()).toEqual(mockCountries);
      expect(component.isLoadingCountries()).toBe(false);
    });

    it('should handle country loading error gracefully', () => {
      mockIntlAddressService.getCountries.mockReturnValue(throwError(() => new Error('API error')));
      setupTestBed();

      expect(component.countries()).toEqual([]);
      expect(component.isLoadingCountries()).toBe(false);
    });
  });

  describe('Existing address binding', () => {
    it('should populate form with existing address data', () => {
      setupTestBed({ existingAddress: mockExistingAddress });
      const formValue = component.addressForm.getRawValue();
      expect(formValue.city).toBe('TORONTO');
      expect(formValue.state).toBe('ON');
      expect(formValue.postalCode).toBe('M5V 3L9');
      expect(formValue.country).toBe('CANADA');
    });

    it('should handle null existing address', () => {
      setupTestBed({ existingAddress: null });
      const formValue = component.addressForm.getRawValue();
      expect(formValue.city).toBe('');
      expect(formValue.state).toBe('');
    });

    it('should handle existing address with null optional fields', () => {
      setupTestBed({
        existingAddress: {
          city: 'LONDON',
          state: null,
          postalCode: null,
          country: 'UNITED KINGDOM',
          intlAddrFlag: 'Y',
          modifiedFlag: 'N',
        },
      });
      const formValue = component.addressForm.getRawValue();
      expect(formValue.city).toBe('LONDON');
      expect(formValue.state).toBe('');
      expect(formValue.postalCode).toBe('');
      expect(formValue.country).toBe('UNITED KINGDOM');
    });
  });

  describe('Country search', () => {
    beforeEach(() => setupTestBed());

    it('should filter countries by code', () => {
      component.countrySearchControl.setValue('US');
      expect(component.filteredCountries().length).toBe(1);
      expect(component.filteredCountries()[0].code).toBe('US');
    });

    it('should filter countries by description', () => {
      component.countrySearchControl.setValue('united');
      const filtered = component.filteredCountries();
      expect(filtered.length).toBe(2);
      expect(filtered.map(c => c.code)).toEqual(['US', 'GB']);
    });

    it('should reset filter when search is cleared', () => {
      component.countrySearchControl.setValue('CA');
      expect(component.filteredCountries().length).toBe(1);

      component.countrySearchControl.setValue('');
      expect(component.filteredCountries().length).toBe(mockCountries.length);
    });

    it('should return empty array when no countries match', () => {
      component.countrySearchControl.setValue('XYZ');
      expect(component.filteredCountries().length).toBe(0);
    });
  });

  describe('showCountrySearch', () => {
    it('should return true when 3 or more countries', () => {
      setupTestBed();
      expect(component.showCountrySearch).toBe(true);
    });

    it('should return false when fewer than 3 countries', () => {
      mockIntlAddressService.getCountries.mockReturnValue(
        of([{ code: 'US', description: 'UNITED STATES' }])
      );
      setupTestBed();
      expect(component.showCountrySearch).toBe(false);
    });
  });

  describe('isApplyEnabled', () => {
    beforeEach(() => setupTestBed());

    it('should return false when form is empty', () => {
      expect(component.isApplyEnabled).toBe(false);
    });

    it('should return false when only city is filled (country missing)', () => {
      component.addressForm.patchValue({ city: 'TEST CITY' });
      expect(component.isApplyEnabled).toBe(false);
    });

    it('should return false when only country is filled (city missing)', () => {
      component.addressForm.patchValue({ country: 'CANADA' });
      expect(component.isApplyEnabled).toBe(false);
    });

    it('should return true when city and country are filled', () => {
      component.addressForm.patchValue({ city: 'TEST CITY', country: 'CANADA' });
      expect(component.isApplyEnabled).toBe(true);
    });

    it('should return false when city is only whitespace', () => {
      component.addressForm.patchValue({ city: '   ', country: 'CANADA' });
      expect(component.isApplyEnabled).toBe(false);
    });

    it('should return false after clear when no existing address', () => {
      component.addressForm.patchValue({ city: 'TEST', country: 'CANADA' });
      component.onClear();
      expect(component.isApplyEnabled).toBe(false);
    });
  });

  describe('isClearEnabled', () => {
    beforeEach(() => setupTestBed());

    it('should return false when form is empty', () => {
      expect(component.isClearEnabled).toBe(false);
    });

    it('should return true when city has value', () => {
      component.addressForm.patchValue({ city: 'TEST' });
      expect(component.isClearEnabled).toBe(true);
    });

    it('should return true when state has value', () => {
      component.addressForm.patchValue({ state: 'ON' });
      expect(component.isClearEnabled).toBe(true);
    });

    it('should return true when postalCode has value', () => {
      component.addressForm.patchValue({ postalCode: '12345' });
      expect(component.isClearEnabled).toBe(true);
    });

    it('should return true when country has value', () => {
      component.addressForm.patchValue({ country: 'CANADA' });
      expect(component.isClearEnabled).toBe(true);
    });
  });

  describe('onApply', () => {
    beforeEach(() => setupTestBed());

    it('should close dialog with EmployerIntlAddressResult when form is valid', () => {
      component.addressForm.patchValue({
        city: 'VANCOUVER',
        state: 'BC',
        postalCode: 'V6B 1A1',
        country: 'CANADA',
      });

      component.onApply();

      expect(mockDialogRef.close).toHaveBeenCalledWith(
        expect.objectContaining({
          city: 'VANCOUVER',
          state: 'BC',
          postalCode: 'V6B 1A1',
          country: 'CANADA',
          intlAddrFlag: 'Y',
          modifiedFlag: 'Y',
        })
      );
    });

    it('should show snackbar on successful apply', () => {
      component.addressForm.patchValue({ city: 'TEST', country: 'CANADA' });
      component.onApply();

      expect(snackbarShowSuccessSpy).toHaveBeenCalledWith('International address updated');
    });

    it('should close dialog with null and show snackbar when form is empty', () => {
      component.onApply();

      expect(snackbarShowSuccessSpy).toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalledWith(null);
    });

    it('should set intlAddrFlag to Y when city has value', () => {
      component.addressForm.patchValue({ city: 'CITY', country: 'CANADA' });
      component.onApply();

      const result = mockDialogRef.close.mock.calls[0][0] as EmployerIntlAddressResult;
      expect(result.intlAddrFlag).toBe('Y');
    });

    it('should set state and postalCode to null when empty', () => {
      component.addressForm.patchValue({ city: 'CITY', country: 'CANADA' });
      component.onApply();

      const result = mockDialogRef.close.mock.calls[0][0] as EmployerIntlAddressResult;
      expect(result.state).toBeNull();
      expect(result.postalCode).toBeNull();
    });

    it('should mark form as touched and not close when invalid (city filled, country empty)', () => {
      component.addressForm.patchValue({ city: 'TEST', state: 'ST' });
      component.addressForm.controls.country.markAsDirty();

      component.onApply();

      expect(component.addressForm.controls.country.touched).toBe(true);
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('onClear', () => {
    it('should reset the form', () => {
      setupTestBed();
      component.addressForm.patchValue({
        city: 'TEST', state: 'ST', postalCode: '12345', country: 'CANADA',
      });

      component.onClear();

      const formValue = component.addressForm.getRawValue();
      expect(formValue.city).toBe('');
      expect(formValue.state).toBe('');
      expect(formValue.postalCode).toBe('');
      expect(formValue.country).toBe('');
    });

    it('should enable apply when clearing an existing address', () => {
      setupTestBed({ existingAddress: mockExistingAddress });
      component.onClear();
      expect(component.isApplyEnabled).toBe(true);
    });
  });

  describe('onCancel', () => {
    it('should close dialog without returning data', () => {
      setupTestBed();
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('convertToUpperCase', () => {
    beforeEach(() => setupTestBed());

    it('should convert lowercase input to uppercase', () => {
      component.addressForm.patchValue({ city: 'test' });
      const inputEl = { value: 'test', selectionStart: 4, setSelectionRange: jest.fn() } as unknown as HTMLInputElement;
      const event = { target: inputEl } as unknown as Event;

      component.convertToUpperCase(event, 'city');

      expect(component.addressForm.get('city')?.value).toBe('TEST');
    });

    it('should not modify already uppercase input', () => {
      const spy = jest.spyOn(component.addressForm.get('city')!, 'setValue');
      const inputEl = { value: 'TEST', selectionStart: 4, setSelectionRange: jest.fn() } as unknown as HTMLInputElement;
      const event = { target: inputEl } as unknown as Event;

      component.convertToUpperCase(event, 'city');

      expect(spy).not.toHaveBeenCalled();
    });

    it('should preserve cursor position after conversion', (done) => {
      const setSelectionRangeFn = jest.fn();
      const inputEl = { value: 'abc', selectionStart: 2, setSelectionRange: setSelectionRangeFn } as unknown as HTMLInputElement;
      const event = { target: inputEl } as unknown as Event;

      component.convertToUpperCase(event, 'city');

      setTimeout(() => {
        expect(setSelectionRangeFn).toHaveBeenCalledWith(2, 2);
        done();
      }, 10);
    });
  });

  describe('Form validation', () => {
    beforeEach(() => setupTestBed());

    it('should require city', () => {
      component.addressForm.controls.city.setValue('');
      component.addressForm.controls.city.markAsTouched();
      expect(component.addressForm.controls.city.hasError('required')).toBe(true);
    });

    it('should require country', () => {
      component.addressForm.controls.country.setValue('');
      component.addressForm.controls.country.markAsTouched();
      expect(component.addressForm.controls.country.hasError('required')).toBe(true);
    });

    it('should not require state', () => {
      component.addressForm.controls.state.setValue('');
      expect(component.addressForm.controls.state.valid).toBe(true);
    });

    it('should not require postalCode', () => {
      component.addressForm.controls.postalCode.setValue('');
      expect(component.addressForm.controls.postalCode.valid).toBe(true);
    });

    it('should enforce maxLength on city (50)', () => {
      component.addressForm.controls.city.setValue('A'.repeat(51));
      expect(component.addressForm.controls.city.hasError('maxlength')).toBe(true);
    });

    it('should enforce maxLength on state (50)', () => {
      component.addressForm.controls.state.setValue('A'.repeat(51));
      expect(component.addressForm.controls.state.hasError('maxlength')).toBe(true);
    });

    it('should enforce maxLength on postalCode (15)', () => {
      component.addressForm.controls.postalCode.setValue('A'.repeat(16));
      expect(component.addressForm.controls.postalCode.hasError('maxlength')).toBe(true);
    });

    it('should enforce maxLength on country (50)', () => {
      component.addressForm.controls.country.setValue('A'.repeat(51));
      expect(component.addressForm.controls.country.hasError('maxlength')).toBe(true);
    });

    it('should be valid when city and country are provided', () => {
      component.addressForm.patchValue({ city: 'CITY', country: 'CANADA' });
      expect(component.addressForm.valid).toBe(true);
    });
  });
});
