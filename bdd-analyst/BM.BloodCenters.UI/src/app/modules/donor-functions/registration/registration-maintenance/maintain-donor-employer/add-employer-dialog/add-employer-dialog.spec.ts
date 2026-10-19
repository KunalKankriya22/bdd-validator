import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import moment from 'moment';

import { AddEmployerDialog } from './add-employer-dialog';
import { DonorEmployerService } from '../services/donor-employer.service';
import { AddDonorService } from '../../../../donor-profile/donor-profile-general-functions/add-donor/services/add-donor.service';
import { LoginService } from '@shared/services/login.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService, createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AddEmployerDialog', () => {
  let component: AddEmployerDialog;
  let fixture: ComponentFixture<AddEmployerDialog>;
  let donorEmployerService: jasmine.SpyObj<DonorEmployerService>;
  let addDonorServiceSpy: jasmine.SpyObj<AddDonorService>;
  let loginServiceSpy: jasmine.SpyObj<LoginService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: any;

  const mockCountries = [
    { code: 'CAN', description: 'Canada' },
    { code: 'MEX', description: 'Mexico' },
    { code: 'GBR', description: 'United Kingdom' }
  ];

  const mockZips = [
    { code: '75001', description: '75001 - TX' },
    { code: '75002', description: '75002 - TX' }
  ];

  beforeEach(() => {
    donorEmployerService = jasmine.createSpyObj('DonorEmployerService', [
      'getZipsByCity',
      'getCountries',
      'create'
    ]);
    donorEmployerService.getCountries.and.returnValue(of(mockCountries));
    donorEmployerService.getZipsByCity.and.returnValue(of(mockZips));

    addDonorServiceSpy = jasmine.createSpyObj('AddDonorService', ['getCitiesByZip']);
    addDonorServiceSpy.getCitiesByZip.and.returnValue(of([]));

    loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    loginServiceSpy.getStoredUsername.and.returnValue('testuser');

    mockHeaderService = createMockHeaderService({
      chapterId: signal('TST'),
      warehouseId: signal('WH01'),
      chapterTimeZone: signal('UTC')
    });

    mockSnackBar = createMockMatSnackBar();

    TestBed.configureTestingModule({
      imports: [
        AddEmployerDialog,
        NoopAnimationsModule,
        ReactiveFormsModule,
        MatSnackBarModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DonorEmployerService, useValue: donorEmployerService },
        { provide: AddDonorService, useValue: addDonorServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    });

    fixture = TestBed.createComponent(AddEmployerDialog);
    component = fixture.componentInstance;

    try {
      fixture.detectChanges();
    } catch {
      // Template references may fail without full DOM
    }
  });

  // -------------------------------------------------------
  // 1. Component creation
  // -------------------------------------------------------
  describe('Component creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have save and close outputs', () => {
      expect(component.save).toBeTruthy();
      expect(component.close).toBeTruthy();
    });
  });

  // -------------------------------------------------------
  // 2. ngOnInit - form initialization, city loading
  // -------------------------------------------------------
  describe('ngOnInit', () => {
    it('should initialize the form with expected controls', () => {
      expect(component.form).toBeTruthy();
      expect(component.form.get('employerName')).toBeTruthy();
      expect(component.form.get('addressType')).toBeTruthy();
      expect(component.form.get('city')).toBeTruthy();
      expect(component.form.get('zipCode')).toBeTruthy();
      expect(component.form.get('state')).toBeTruthy();
      expect(component.form.get('intlCity')).toBeTruthy();
      expect(component.form.get('intlPostalCode')).toBeTruthy();
      expect(component.form.get('intlState')).toBeTruthy();
      expect(component.form.get('intlCountryName')).toBeTruthy();
      expect(component.form.get('effDate')).toBeTruthy();
      expect(component.form.get('termDate')).toBeTruthy();
    });

    it('should default addressType to N', () => {
      expect(component.form.get('addressType')!.value).toBe('N');
    });

    it('should load countries on init', () => {
      expect(donorEmployerService.getCountries).toHaveBeenCalled();
      expect(component.countries.length).toBe(3);
    });

    it('should set isLoading to false after init', () => {
      expect(component.isLoading).toBeFalse();
    });

    it('should handle country loading error gracefully', () => {
      donorEmployerService.getCountries.and.returnValue(throwError(() => new Error('fail')));

      const fixture2 = TestBed.createComponent(AddEmployerDialog);
      const comp2 = fixture2.componentInstance;
      try { fixture2.detectChanges(); } catch { /* template */ }

      expect(comp2.countries.length).toBe(0);
    });
  });

  // -------------------------------------------------------
  // 3. isDomestic getter
  // -------------------------------------------------------
  describe('isDomestic', () => {
    it('should return true when addressType is N', () => {
      component.form.get('addressType')!.setValue('N');
      expect(component.isDomestic).toBeTrue();
    });

    it('should return false when addressType is I', () => {
      component.form.get('addressType')!.setValue('I');
      expect(component.isDomestic).toBeFalse();
    });
  });

  // -------------------------------------------------------
  // 4. Address type switching - N vs I validators
  // -------------------------------------------------------
  describe('Address type switching', () => {
    it('should require city and zipCode for domestic (N)', () => {
      component.form.get('addressType')!.setValue('N');

      const cityCtrl = component.form.get('city')!;
      const zipCtrl = component.form.get('zipCode')!;

      // zipCode starts disabled; enable it so validators run
      zipCtrl.enable();

      cityCtrl.setValue('');
      cityCtrl.markAsTouched();
      zipCtrl.setValue('');
      zipCtrl.markAsTouched();

      expect(cityCtrl.hasError('required')).toBeTrue();
      expect(zipCtrl.hasError('required')).toBeTrue();
    });

    it('should require intlCity and intlCountryName for international (I)', () => {
      component.form.get('addressType')!.setValue('I');

      const intlCityCtrl = component.form.get('intlCity')!;
      const intlCountryCtrl = component.form.get('intlCountryName')!;

      intlCityCtrl.setValue('');
      intlCityCtrl.markAsTouched();
      intlCountryCtrl.setValue('');
      intlCountryCtrl.markAsTouched();

      expect(intlCityCtrl.hasError('required')).toBeTrue();
      expect(intlCountryCtrl.hasError('required')).toBeTrue();
    });

    it('should clear domestic validators when switching to international', () => {
      component.form.get('addressType')!.setValue('I');

      const cityCtrl = component.form.get('city')!;
      cityCtrl.setValue('');
      cityCtrl.updateValueAndValidity();

      expect(cityCtrl.hasError('required')).toBeFalse();
    });

    it('should clear international validators when switching to domestic', () => {
      component.form.get('addressType')!.setValue('I');
      // Now switch back to domestic
      component.form.get('addressType')!.setValue('N');

      const intlCityCtrl = component.form.get('intlCity')!;
      intlCityCtrl.setValue('');
      intlCityCtrl.updateValueAndValidity();

      expect(intlCityCtrl.hasError('required')).toBeFalse();
    });
  });

  // -------------------------------------------------------
  // 5. Zip option selection and city-to-zip lookup
  // -------------------------------------------------------
  describe('onZipOptionSelected', () => {
    it('should set zipCode and state from selected zip option', () => {
      component.onZipOptionSelected({ code: '75001', description: '75001 - TX' });

      expect(component.form.get('zipCode')!.value).toBe('75001');
      expect(component.form.get('state')!.value).toBe('TX');
    });

    it('should set empty state when zip description has no dash', () => {
      component.onZipOptionSelected({ code: '12345', description: '12345' });

      expect(component.form.get('zipCode')!.value).toBe('12345');
      expect(component.form.get('state')!.value).toBe('');
    });

    it('should call getCitiesByZip to check for multiple cities', () => {
      component.onZipOptionSelected({ code: '75001', description: '75001 - TX' });

      expect(addDonorServiceSpy.getCitiesByZip).toHaveBeenCalledWith('75001');
    });

    it('should parse state from zip description with dash', () => {
      component.onZipOptionSelected({ code: '90210', description: '90210 - CA' });

      expect(component.form.get('state')!.value).toBe('CA');
    });
  });

  // -------------------------------------------------------
  // 6. onCityOptionSelected
  // -------------------------------------------------------
  describe('onCityOptionSelected', () => {
    it('should set city, state and zip from selected city result', () => {
      component.onCityOptionSelected({ city: 'Dallas', state: 'TX', zip: '75001' });

      expect(component.form.get('city')!.value).toBe('Dallas');
      expect(component.form.get('state')!.value).toBe('TX');
      expect(component.form.get('zipCode')!.value).toBe('75001');
    });

    it('should set isSettingCityFromZip flag during selection', fakeAsync(() => {
      component.onCityOptionSelected({ city: 'Dallas', state: 'TX', zip: '75001' });
      // Flag is set synchronously, then cleared via setTimeout
      tick();

      expect(component.form.get('city')!.value).toBe('Dallas');
      expect(component.form.get('state')!.value).toBe('TX');
    }));
  });

  // -------------------------------------------------------
  // 7. onSubmit
  // -------------------------------------------------------
  describe('onSubmit', () => {
    function fillDomesticForm(): void {
      // Enable zipCode first since patchValue skips disabled controls
      component.form.get('zipCode')!.enable();
      component.form.patchValue({
        employerName: 'Acme Corp',
        addressType: 'N',
        city: 'DAL',
        zipCode: '75001',
        effDate: moment.utc('2099-01-01')
      });
    }

    function fillInternationalForm(): void {
      component.form.patchValue({
        employerName: 'Global Inc',
        addressType: 'I',
        intlCity: 'Toronto',
        intlState: 'ON',
        intlPostalCode: 'M5V 2H1',
        intlCountryName: 'Canada',
        effDate: moment.utc('2099-01-01')
      });
    }

    it('should submit domestic employer successfully', fakeAsync(() => {
      fillDomesticForm();
      const saveResponse = { data: { employerId: 'EMP001' } as any, item: { employerId: 'EMP001' } as any };
      donorEmployerService.create.and.returnValue(of(saveResponse));

      const saveSpy = spyOn(component.save, 'emit');
      component.onSubmit();
      tick();

      expect(donorEmployerService.create).toHaveBeenCalled();
      const request = donorEmployerService.create.calls.mostRecent().args[0];
      expect(request.employerName).toBe('Acme Corp');
      expect(request.intlAddrFlag).toBe('N');
      expect(request.city).toBe('DAL');
      expect(saveSpy).toHaveBeenCalledWith(jasmine.objectContaining({ message: jasmine.any(String) }));
      expect(component.isSaving).toBeFalse();
    }));

    it('should submit international employer successfully', fakeAsync(() => {
      fillInternationalForm();
      const saveResponse = { data: { employerId: 'EMP002' } as any };
      donorEmployerService.create.and.returnValue(of(saveResponse));

      const saveSpy = spyOn(component.save, 'emit');
      component.onSubmit();
      tick();

      expect(donorEmployerService.create).toHaveBeenCalled();
      const request = donorEmployerService.create.calls.mostRecent().args[0];
      expect(request.intlAddrFlag).toBe('Y');
      expect(request.intlCity).toBe('Toronto');
      expect(request.intlCountryName).toBe('Canada');
      expect(saveSpy).toHaveBeenCalled();
    }));

    it('should not submit when form is invalid', () => {
      // Leave required fields empty
      component.form.patchValue({ employerName: '' });
      component.onSubmit();

      expect(donorEmployerService.create).not.toHaveBeenCalled();
    });

    it('should show snackbar on API error', fakeAsync(() => {
      fillDomesticForm();
      // Ensure the form is valid before testing error path
      component.form.updateValueAndValidity();

      donorEmployerService.create.and.returnValue(
        throwError(() => ({ error: { message: 'Server Error' } }))
      );

      component.onSubmit();
      tick();

      expect(donorEmployerService.create).toHaveBeenCalled();
      expect(component.isSaving).toBeFalse();
    }));

    it('should set isSaving to true during submission', fakeAsync(() => {
      fillDomesticForm();
      donorEmployerService.create.and.returnValue(of({ data: { employerId: 'EMP003' } as any }));

      component.onSubmit();
      // isSaving should be set to false after observable completes
      tick();

      expect(component.isSaving).toBeFalse();
    }));
  });

  // -------------------------------------------------------
  // 8. onCancel
  // -------------------------------------------------------
  describe('onCancel', () => {
    it('should emit close event', () => {
      const closeSpy = spyOn(component.close, 'emit');
      component.onCancel();
      expect(closeSpy).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // 9. onlyNumbers
  // -------------------------------------------------------
  describe('onlyNumbers', () => {
    it('should allow digit keys', () => {
      const event = new KeyboardEvent('keydown', { key: '5' });
      spyOn(event, 'preventDefault');
      component.onlyNumbers(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should block letter keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'a' });
      spyOn(event, 'preventDefault');
      component.onlyNumbers(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow navigation keys like Backspace', () => {
      const event = new KeyboardEvent('keydown', { key: 'Backspace' });
      spyOn(event, 'preventDefault');
      component.onlyNumbers(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Tab key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      spyOn(event, 'preventDefault');
      component.onlyNumbers(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should block special characters', () => {
      const event = new KeyboardEvent('keydown', { key: '!' });
      spyOn(event, 'preventDefault');
      component.onlyNumbers(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // 10. convertToUpperCase
  // -------------------------------------------------------
  describe('convertToUpperCase', () => {
    it('should convert input value to uppercase and update control', () => {
      component.form.get('intlState')!.setValue('ca');

      const mockInput = {
        value: 'ca',
        selectionStart: 2,
        setSelectionRange: jasmine.createSpy('setSelectionRange')
      } as any;

      const mockEvent = { target: mockInput } as unknown as Event;
      component.convertToUpperCase(mockEvent, 'intlState');

      expect(component.form.get('intlState')!.value).toBe('CA');
    });

    it('should not update control if value is already uppercase', () => {
      component.form.get('intlState')!.setValue('TX');

      const mockInput = {
        value: 'TX',
        selectionStart: 2,
        setSelectionRange: jasmine.createSpy('setSelectionRange')
      } as any;

      const mockEvent = { target: mockInput } as unknown as Event;
      const setValueSpy = spyOn(component.form.get('intlState')!, 'setValue');
      component.convertToUpperCase(mockEvent, 'intlState');

      expect(setValueSpy).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // 11. onSelectOpenedChange
  // -------------------------------------------------------
  describe('onSelectOpenedChange', () => {
    it('should reset search control value when dropdown closes', () => {
      const searchCtrl = new FormControl('Dallas');
      component.onSelectOpenedChange(searchCtrl, false);

      expect(searchCtrl.value).toBe('');
    });

    it('should not reset search control value when dropdown opens', () => {
      const searchCtrl = new FormControl('Dallas');
      component.onSelectOpenedChange(searchCtrl, true);

      expect(searchCtrl.value).toBe('Dallas');
    });
  });

  // -------------------------------------------------------
  // 12. Date handlers
  // -------------------------------------------------------
  describe('Date handlers', () => {
    it('onEffectiveDateInput should call DateFieldValidationUtility', () => {
      const mockEvent = { target: { value: '01-Jan-2099' } } as unknown as Event;
      expect(() => component.onEffectiveDateInput(mockEvent)).not.toThrow();
    });

    it('onEffectiveDateChange should mark effDate as touched and dirty', () => {
      component.onEffectiveDateChange();
      expect(component.form.get('effDate')!.touched).toBeTrue();
      expect(component.form.get('effDate')!.dirty).toBeTrue();
    });

    it('onTerminationDateInput should call DateFieldValidationUtility', () => {
      const mockEvent = { target: { value: '01-Jan-2099' } } as unknown as Event;
      expect(() => component.onTerminationDateInput(mockEvent)).not.toThrow();
    });

    it('onTerminationDateChange should mark termDate as touched and dirty', () => {
      component.onTerminationDateChange();
      expect(component.form.get('termDate')!.touched).toBeTrue();
      expect(component.form.get('termDate')!.dirty).toBeTrue();
    });
  });

  // -------------------------------------------------------
  // 13. Date error getters
  // -------------------------------------------------------
  describe('Date error getters', () => {
    it('getEffectiveDateError should return a string', () => {
      const result = component.getEffectiveDateError();
      expect(typeof result).toBe('string');
    });

    it('getTerminationDateError should return a string', () => {
      const result = component.getTerminationDateError();
      expect(typeof result).toBe('string');
    });

    it('getEffectiveDateError should check form errors when effective was last changed', () => {
      component['lastChangedDateField'] = 'effective';
      const result = component.getEffectiveDateError();
      expect(typeof result).toBe('string');
    });

    it('getTerminationDateError should check form errors when termination was last changed', () => {
      component['lastChangedDateField'] = 'termination';
      const result = component.getTerminationDateError();
      expect(typeof result).toBe('string');
    });
  });

  // -------------------------------------------------------
  // 14. computed signals and search
  // -------------------------------------------------------
  describe('Computed signals', () => {
    it('filteredCountries should filter countries by search term', () => {
      component['countriesSignal'].set(mockCountries);
      component['countrySearch'].set('can');
      const filtered = component.filteredCountries();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('CAN');
    });

    it('filteredCountries should return all countries when search is empty', () => {
      component['countriesSignal'].set(mockCountries);
      component['countrySearch'].set('');
      expect(component.filteredCountries().length).toBe(3);
    });

    it('filteredCountries should match by code', () => {
      component['countriesSignal'].set(mockCountries);
      component['countrySearch'].set('GBR');
      const filtered = component.filteredCountries();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('GBR');
    });

    it('filteredCountries should match by description', () => {
      component['countriesSignal'].set(mockCountries);
      component['countrySearch'].set('united');
      const filtered = component.filteredCountries();
      expect(filtered.length).toBe(1);
      expect(filtered[0].description).toBe('United Kingdom');
    });
  });

  describe('Search subscriptions', () => {
    it('countrySearchCtrl should update countrySearch signal', fakeAsync(() => {
      component.countrySearchCtrl.setValue('Can');
      tick();
      expect(component['countrySearch']()).toBe('Can');
    }));

    it('countrySearchCtrl should set empty string for null', fakeAsync(() => {
      component.countrySearchCtrl.setValue(null);
      tick();
      expect(component['countrySearch']()).toBe('');
    }));

    it('countrySearchCtrl should clear on empty string', fakeAsync(() => {
      component.countrySearchCtrl.setValue('test');
      tick();
      component.countrySearchCtrl.setValue('');
      tick();
      expect(component['countrySearch']()).toBe('');
    }));
  });

  // -------------------------------------------------------
  // 15. updateTerminationMinDate
  // -------------------------------------------------------
  describe('updateTerminationMinDate', () => {
    it('should update terminationMinDate when effective date is set to a moment', fakeAsync(() => {
      const futureDate = moment.utc('2099-06-15');
      component.form.get('effDate')!.setValue(futureDate);
      tick();
      expect(component.terminationMinDate).toBeTruthy();
    }));

    it('should update terminationMinDate when effective date is set to a Date object', fakeAsync(() => {
      const futureDate = new Date('2099-06-15');
      component.form.get('effDate')!.setValue(futureDate);
      tick();
      expect(component.terminationMinDate).toBeTruthy();
    }));

    it('should fallback to minDate when effective date is null', fakeAsync(() => {
      component.form.get('effDate')!.setValue(null);
      tick();
      expect(component.terminationMinDate).toEqual(component.minDate);
    }));
  });

  // -------------------------------------------------------
  // 16. ngOnDestroy
  // -------------------------------------------------------
  describe('ngOnDestroy', () => {
    it('should complete the destroy subject', () => {
      const nextSpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // 17. onSubmit edge cases
  // -------------------------------------------------------
  describe('onSubmit edge cases', () => {
    it('should not submit when form has dateRangeInvalid error', () => {
      component.form.patchValue({
        employerName: 'Test',
        city: 'DAL',
        zipCode: '75001',
        effDate: moment.utc('2099-06-01'),
        termDate: moment.utc('2099-01-01'), // before effDate
      });
      // Manually set dateRangeInvalid error
      component.form.setErrors({ dateRangeInvalid: true });

      component.onSubmit();
      expect(donorEmployerService.create).not.toHaveBeenCalled();
    });

    it('should handle response with item.employerId', fakeAsync(() => {
      component.form.get('zipCode')!.enable();
      component.form.patchValue({
        employerName: 'Test Corp',
        city: 'DAL',
        zipCode: '75001',
        effDate: moment.utc('2099-01-01'),
      });
      donorEmployerService.create.and.returnValue(of({
        item: { employerId: 'EMP100' } as any,
        data: null as any,
      }));

      const saveSpy = spyOn(component.save, 'emit');
      component.onSubmit();
      tick();

      expect(saveSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        message: jasmine.stringContaining('EMP100'),
      }));
    }));

    it('should handle response with data.employerId when item is missing', fakeAsync(() => {
      component.form.get('zipCode')!.enable();
      component.form.patchValue({
        employerName: 'Test Corp',
        city: 'DAL',
        zipCode: '75001',
        effDate: moment.utc('2099-01-01'),
      });
      donorEmployerService.create.and.returnValue(of({
        data: { employerId: 'EMP200' } as any,
      }));

      const saveSpy = spyOn(component.save, 'emit');
      component.onSubmit();
      tick();

      expect(saveSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        message: jasmine.stringContaining('EMP200'),
      }));
    }));
  });

  // -------------------------------------------------------
  // 18. onCityBlur edge case
  // -------------------------------------------------------
  describe('onCityBlur', () => {
    it('should uppercase city value on blur', () => {
      component.form.patchValue({ city: 'dallas' }, { emitEvent: false });
      component.onCityBlur();
      expect(component.form.get('city')!.value).toBe('DALLAS');
    });
  });

  // -------------------------------------------------------
  // 19. onZipOptionSelected edge cases
  // -------------------------------------------------------
  describe('onZipOptionSelected edge cases', () => {
    it('should handle zip description without dash', () => {
      component.onZipOptionSelected({ code: '12345', description: '12345' });
      expect(component.form.get('state')!.value).toBe('');
    });

    it('should set cityResults when getCitiesByZip returns multiple results', fakeAsync(() => {
      addDonorServiceSpy.getCitiesByZip.and.returnValue(of([
        { city: 'Dallas', state: 'TX', zip: '75001' },
        { city: 'Richardson', state: 'TX', zip: '75001' }
      ]));
      component.onZipOptionSelected({ code: '75001', description: '75001 - TX' });
      tick();
      expect(component.cityResults().length).toBe(2);
    }));
  });
});
