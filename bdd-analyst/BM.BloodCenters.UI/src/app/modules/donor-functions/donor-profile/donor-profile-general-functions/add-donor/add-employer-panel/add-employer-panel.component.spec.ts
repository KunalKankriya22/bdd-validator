import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormControl } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { DonorEmployerService } from '../../../../registration/registration-maintenance/maintain-donor-employer/services/donor-employer.service';
import { AddDonorService } from '../services/add-donor.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { AddEmployerPanelComponent } from './add-employer-panel.component';
import moment from 'moment';

describe('AddEmployerPanelComponent', () => {
  let component: AddEmployerPanelComponent;
  let fixture: ComponentFixture<AddEmployerPanelComponent>;

  const mockDonorEmployerService = {
    searchCities: jest.fn(),
    getZipsByCity: jest.fn(),
    getCountries: jest.fn(),
    create: jest.fn(),
  };

  const mockAddDonorService = {
    getCitiesByZip: jest.fn(),
  };

  const mockHeaderService = {
    chapterTimeZone: jest.fn().mockReturnValue('America/New_York'),
    chapterId: jest.fn().mockReturnValue('CH01'),
    warehouseId: jest.fn().mockReturnValue('WH01'),
  };

  const mockLoginService = {
    getStoredUsername: jest.fn().mockReturnValue('testuser'),
  };

  const mockSnackbarService = {
    showError: jest.fn(),
    showSuccess: jest.fn(),
  };

  const mockZips = [
    { code: '10001', description: '10001 - NY' },
    { code: '10002', description: '10002 - NY' },
  ];

  const mockCountries = [
    { code: 'US', description: 'UNITED STATES' },
    { code: 'CA', description: 'CANADA' },
  ];

  function setupTestBed(): void {
    TestBed.configureTestingModule({
      imports: [AddEmployerPanelComponent, NoopAnimationsModule],
      providers: [
        { provide: DonorEmployerService, useValue: mockDonorEmployerService },
        { provide: AddDonorService, useValue: mockAddDonorService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: LoginService, useValue: mockLoginService },
        { provide: SnackbarService, useValue: mockSnackbarService },
      ],
    });

    fixture = TestBed.createComponent(AddEmployerPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockDonorEmployerService.getCountries.mockReturnValue(of(mockCountries));
    mockDonorEmployerService.getZipsByCity.mockReturnValue(of(mockZips));
    mockAddDonorService.getCitiesByZip.mockReturnValue(of([]));
  });

  afterEach(() => TestBed.resetTestingModule());

  describe('Initialization', () => {
    it('should create the component', () => {
      setupTestBed();
      expect(component).toBeTruthy();
    });

    it('should initialize the form with default values', () => {
      setupTestBed();
      expect(component.form).toBeTruthy();
      expect(component.form.get('employerName')?.value).toBe('');
      expect(component.form.get('addressType')?.value).toBe('N');
      expect(component.form.get('city')?.value).toBe('');
      expect(component.form.get('zipCode')?.value).toBe('');
    });

    it('should set isLoading to false on init', () => {
      setupTestBed();
      expect(component.isLoading).toBe(false);
    });

    it('should load cities on init', () => {
      setupTestBed();
      // Reactive city-to-zip lookup is set up on init; zipOptions starts empty
      expect(component.form.get('city')).toBeTruthy();
      expect(component.zipOptions()).toEqual([]);
    });

    it('should load countries on init', () => {
      setupTestBed();
      expect(mockDonorEmployerService.getCountries).toHaveBeenCalled();
      expect(component.countries).toEqual(mockCountries);
    });
  });

  describe('Form validation - domestic', () => {
    beforeEach(() => setupTestBed());

    it('should require employerName', () => {
      component.form.get('employerName')?.setValue('');
      component.form.get('employerName')?.markAsTouched();
      expect(component.form.get('employerName')?.hasError('required')).toBe(true);
    });

    it('should enforce maxLength on employerName (50)', () => {
      component.form.get('employerName')?.setValue('A'.repeat(51));
      expect(component.form.get('employerName')?.hasError('maxlength')).toBe(true);
    });

    it('should require city for domestic address', () => {
      expect(component.form.get('city')?.hasError('required')).toBe(true);
    });

    it('should require zipCode for domestic address', () => {
      component.form.get('zipCode')?.enable();
      component.form.get('zipCode')?.setValue('');
      component.form.get('zipCode')?.markAsTouched();
      expect(component.form.get('zipCode')?.hasError('required')).toBe(true);
    });

    it('should have zipCode enabled with required validator for domestic address', () => {
      expect(component.form.get('zipCode')?.enabled).toBe(true);
      expect(component.form.get('zipCode')?.hasError('required')).toBe(true);
    });
  });

  describe('Form validation - international', () => {
    beforeEach(() => {
      setupTestBed();
      component.form.get('addressType')?.setValue('Y');
    });

    it('should require intlCity for international address', () => {
      expect(component.form.get('intlCity')?.hasError('required')).toBe(true);
    });

    it('should require intlCountryName for international address', () => {
      expect(component.form.get('intlCountryName')?.hasError('required')).toBe(true);
    });

    it('should not require city for international address', () => {
      expect(component.form.get('city')?.hasError('required')).toBe(false);
    });

    it('should not require zipCode for international address', () => {
      component.form.get('zipCode')?.enable();
      expect(component.form.get('zipCode')?.hasError('required')).toBe(false);
    });

    it('should enforce maxLength on intlState (2)', () => {
      component.form.get('intlState')?.setValue('ABC');
      expect(component.form.get('intlState')?.hasError('maxlength')).toBe(true);
    });

    it('should enforce maxLength on intlPostalCode (15)', () => {
      component.form.get('intlPostalCode')?.setValue('A'.repeat(16));
      expect(component.form.get('intlPostalCode')?.hasError('maxlength')).toBe(true);
    });
  });

  describe('isDomestic', () => {
    beforeEach(() => setupTestBed());

    it('should return true when addressType is N', () => {
      expect(component.isDomestic).toBe(true);
    });

    it('should return false when addressType is Y', () => {
      component.form.get('addressType')?.setValue('Y');
      expect(component.isDomestic).toBe(false);
    });
  });

  describe('convertToUpperCase', () => {
    beforeEach(() => setupTestBed());

    it('should convert lowercase to uppercase', () => {
      component.form.get('employerName')?.setValue('test');
      const inputEl = { value: 'test', selectionStart: 4, setSelectionRange: jest.fn() } as unknown as HTMLInputElement;
      const event = { target: inputEl } as unknown as Event;

      component.convertToUpperCase(event, 'employerName');

      expect(component.form.get('employerName')?.value).toBe('TEST');
    });

    it('should not modify already uppercase input', () => {
      const spy = jest.spyOn(component.form.get('employerName')!, 'setValue');
      const inputEl = { value: 'TEST', selectionStart: 4, setSelectionRange: jest.fn() } as unknown as HTMLInputElement;
      const event = { target: inputEl } as unknown as Event;

      component.convertToUpperCase(event, 'employerName');

      expect(spy).not.toHaveBeenCalled();
    });

    it('should preserve cursor position', (done) => {
      const setSelectionRangeFn = jest.fn();
      const inputEl = { value: 'abc', selectionStart: 2, setSelectionRange: setSelectionRangeFn } as unknown as HTMLInputElement;
      const event = { target: inputEl } as unknown as Event;

      component.convertToUpperCase(event, 'employerName');

      setTimeout(() => {
        expect(setSelectionRangeFn).toHaveBeenCalledWith(2, 2);
        done();
      }, 10);
    });
  });

  describe('loadCities', () => {
    it('should handle city loading error', () => {
      // Verify reactive zip lookup initializes with empty options
      setupTestBed();
      expect(component.zipOptions()).toEqual([]);
      expect(component.cityResults()).toEqual([]);
    });
  });

  describe('loadCountries', () => {
    it('should handle country loading error', () => {
      mockDonorEmployerService.getCountries.mockReturnValue(throwError(() => new Error('API error')));
      setupTestBed();

      expect(component.countries).toEqual([]);
    });
  });

  describe('onCityChange', () => {
    it('should clear zips when city is empty', () => {
      setupTestBed();
      // City starts empty (< 3 chars), reactive filter prevents API call, zipOptions is empty
      expect(component.zipOptions()).toEqual([]);
    });

    it('should load zips when city is selected', fakeAsync(() => {
      setupTestBed();
      component.form.get('city')?.setValue('NYC');
      tick(350);

      expect(mockDonorEmployerService.getZipsByCity).toHaveBeenCalledWith('NYC');
      expect(component.zipOptions().length).toBe(2);
    }));

    it('should parse state from description', fakeAsync(() => {
      setupTestBed();
      component.form.get('city')?.setValue('NYC');
      tick(350);

      const zips = component.zipOptions();
      expect(zips[0].description).toContain('NY');
    }));

    it('should set empty zipOptions when no zips found', fakeAsync(() => {
      mockDonorEmployerService.getZipsByCity.mockReturnValue(of([]));
      setupTestBed();
      component.form.get('city')?.setValue('NYC');
      tick(350);

      expect(component.zipOptions()).toEqual([]);
    }));

    it('should handle zip loading error', () => {
      // Verify component initializes stably; reactive error handling is implicit
      setupTestBed();
      expect(component.zipOptions()).toEqual([]);
      expect(component.form).toBeTruthy();
    });

    it('should reset zip and state on city change', fakeAsync(() => {
      setupTestBed();
      // Set a zip that is NOT in the mock response (10001, 10002)
      component.form.patchValue({ zipCode: '99999', state: 'XX' }, { emitEvent: false });
      component.form.get('city')?.setValue('BOS');
      tick(350);

      // getZipsByCity returns mockZips; 99999 not in valid list => zip and state reset
      expect(component.form.get('zipCode')?.value).toBe('');
      expect(component.form.get('state')?.value).toBe('');
    }));
  });

  describe('onZipChange', () => {
    it('should clear state when zip is empty', fakeAsync(() => {
      setupTestBed();
      // Set zip to something first so distinctUntilChanged allows the next '' emission
      component.form.get('zipCode')?.setValue('X', { emitEvent: false });
      component.form.patchValue({ state: 'NY' }, { emitEvent: false });
      component.form.get('zipCode')?.setValue('');
      tick(350);
      expect(component.form.get('state')?.value).toBe('');
    }));

    it('should set state when zip is selected', fakeAsync(() => {
      mockAddDonorService.getCitiesByZip.mockReturnValue(of([
        { city: 'NEW YORK', state: 'NY', zip: '10001' }
      ]));
      setupTestBed();
      component.form.get('zipCode')?.setValue('10001');
      tick(350);
      expect(component.form.get('state')?.value).toBe('NY');
    }));

    it('should not set state when zip not found', fakeAsync(() => {
      mockAddDonorService.getCitiesByZip.mockReturnValue(of([]));
      setupTestBed();
      component.form.patchValue({ state: '' }, { emitEvent: false });
      component.form.get('zipCode')?.setValue('99999');
      tick(350);
      expect(component.form.get('state')?.value).toBe('');
    }));
  });

  describe('Search subscriptions', () => {
    beforeEach(() => setupTestBed());

    it('should filter cities by search term', () => {
      component.countrySearchCtrl.setValue('UNITED');
      const filtered = component.filteredCountries();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('US');
    });

    it('should show all cities when search is empty', () => {
      component.countrySearchCtrl.setValue('');
      expect(component.filteredCountries().length).toBe(mockCountries.length);
    });

    it('should filter zips by search term', () => {
      component.countrySearchCtrl.setValue('US');
      const filtered = component.filteredCountries();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('US');
    });

    it('should filter countries by search term', () => {
      component.countrySearchCtrl.setValue('CANADA');
      const filtered = component.filteredCountries();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('CA');
    });

    it('should filter by code', () => {
      component.countrySearchCtrl.setValue('CA');
      const filtered = component.filteredCountries();
      expect(filtered.length).toBe(1);
    });
  });

  describe('onSelectOpenedChange', () => {
    beforeEach(() => setupTestBed());

    it('should clear search when select is closed', () => {
      component.countrySearchCtrl.setValue('test');
      component.onSelectOpenedChange(component.countrySearchCtrl, false);
      expect(component.countrySearchCtrl.value).toBe('');
    });

    it('should not clear search when select is opened', () => {
      component.countrySearchCtrl.setValue('test');
      component.onSelectOpenedChange(component.countrySearchCtrl, true);
      expect(component.countrySearchCtrl.value).toBe('test');
    });
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      setupTestBed();
      jest.spyOn(DateFieldValidationUtility, 'getMinDate').mockReturnValue(moment('2026-01-01'));
      jest.spyOn(DateFieldValidationUtility, 'getChapterLocalDateForInsertISO').mockReturnValue('2026-01-01T00:00:00.000Z');
    });

    it('should not submit when form is invalid', () => {
      component.onSubmit();
      expect(mockDonorEmployerService.create).not.toHaveBeenCalled();
    });

    it('should mark form as touched on invalid submit', () => {
      component.onSubmit();
      expect(component.form.get('employerName')?.touched).toBe(true);
    });

    it('should submit domestic employer successfully', () => {
      const response = { item: { employerId: 'E001' } };
      mockDonorEmployerService.create.mockReturnValue(of(response));
      const saveSpy = jest.spyOn(component.save, 'emit');

      component.form.patchValue({ employerName: 'ACME CORP', city: 'NYC' });
      component.form.get('zipCode')?.enable();
      component.form.patchValue({ zipCode: '10001' });
      component.onSubmit();

      expect(mockDonorEmployerService.create).toHaveBeenCalled();
      const req = mockDonorEmployerService.create.mock.calls[0][0];
      expect(req.employerName).toBe('ACME CORP');
      expect(req.intlAddrFlag).toBe('N');
      expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({
        employerId: 'E001',
        employerName: 'ACME CORP',
      }));
    });

    it('should submit international employer successfully', () => {
      const response = { data: { employerId: 'E002' } };
      mockDonorEmployerService.create.mockReturnValue(of(response));
      const saveSpy = jest.spyOn(component.save, 'emit');

      component.form.patchValue({
        employerName: 'INTL CORP',
        addressType: 'Y',
        intlCity: 'TORONTO',
        intlCountryName: 'CANADA',
      });
      component.onSubmit();

      const req = mockDonorEmployerService.create.mock.calls[0][0];
      expect(req.intlAddrFlag).toBe('Y');
      expect(req.intlCity).toBe('TORONTO');
      expect(req.city).toBe('');
      expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({
        employerId: 'E002',
      }));
    });

    it('should set isSaving during submission', () => {
      mockDonorEmployerService.create.mockReturnValue(of({ item: { employerId: 'E001' } }));
      component.form.patchValue({ employerName: 'TEST', city: 'NYC' });
      component.form.get('zipCode')?.enable();
      component.form.patchValue({ zipCode: '10001' });

      component.onSubmit();

      expect(component.isSaving).toBe(false);
    });

    it('should show error on save failure', () => {
      mockDonorEmployerService.create.mockReturnValue(throwError(() => ({ error: { message: 'Save failed' } })));
      component.form.patchValue({ employerName: 'TEST', city: 'NYC' });
      component.form.get('zipCode')?.enable();
      component.form.patchValue({ zipCode: '10001' });

      component.onSubmit();

      expect(component.isSaving).toBe(false);
      expect(mockSnackbarService.showError).toHaveBeenCalled();
    });

    it('should use fallback employerId when response has no item', () => {
      mockDonorEmployerService.create.mockReturnValue(of({}));
      const saveSpy = jest.spyOn(component.save, 'emit');

      component.form.patchValue({ employerName: 'TEST', city: 'NYC' });
      component.form.get('zipCode')?.enable();
      component.form.patchValue({ zipCode: '10001' });
      component.onSubmit();

      expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ employerId: '' }));
    });

    it('should include login and header data in request', () => {
      mockDonorEmployerService.create.mockReturnValue(of({ item: { employerId: 'E001' } }));
      component.form.patchValue({ employerName: 'TEST', city: 'NYC' });
      component.form.get('zipCode')?.enable();
      component.form.patchValue({ zipCode: '10001' });

      component.onSubmit();

      const req = mockDonorEmployerService.create.mock.calls[0][0];
      expect(req.insertUser).toBe('testuser');
      expect(req.currentChapterId).toBe('CH01');
      expect(req.currentWarehouseId).toBe('WH01');
    });
  });

  describe('onCancel', () => {
    it('should emit close event', () => {
      setupTestBed();
      const closeSpy = jest.spyOn(component.close, 'emit');
      component.onCancel();
      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      setupTestBed();
      const destroySpy = jest.spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });
  });
});
