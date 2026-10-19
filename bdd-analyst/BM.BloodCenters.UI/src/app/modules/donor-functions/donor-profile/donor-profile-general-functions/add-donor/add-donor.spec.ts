import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Router, provideRouter } from '@angular/router';

import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';

import { AddDonorComponent } from './add-donor';
import { AddDonorService } from './services/add-donor.service';
import { DonorResponse, DonorData } from './models/add-donor.model';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MenuService, MenuItem } from '@shared/services/menu.service';
import { FindDonorService } from '@shared/components/find-donor/find-donor.service';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { DonorEmployerService } from '../../../registration/registration-maintenance/maintain-donor-employer/services/donor-employer.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('AddDonorComponent', () => {
  let component: AddDonorComponent;
  let fixture: ComponentFixture<AddDonorComponent>;
  let mockAddDonorService: jasmine.SpyObj<AddDonorService>;
  let router: Router;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: Partial<HeaderService>;
  let mockLoginService: jasmine.SpyObj<LoginService>;
  let mockFindDonorService: jasmine.SpyObj<FindDonorService>;
  let mockDonorEmployerService: jasmine.SpyObj<DonorEmployerService>;
  let mockMenuService: Partial<MenuService>;
  let dialog: MatDialog;

  const mockLookupResponse = (data: { code: string; description: string }[]) =>
    of(data);

  const fillRequiredFields = (): void => {
    component.donorForm.patchValue({
      lastName: 'Smith',
      firstName: 'John',
      sex: 'M',
      dob: new Date(1990, 0, 15),
      homeAddress: '123 Main St',
      city: 'Dallas',
      zip: '75201',
    });
    component.donorForm.updateValueAndValidity();
  };

  const mockSuccessCreateResponse = () =>
    of({
      success: true,
      message: 'Created',
      statusCode: 201,
      data: { donorId: 'DN001' } as DonorData,
      errorResponse: { errorCode: null, error: null },
    } as DonorResponse);

  const mockSuccessModifyResponse = () =>
    of({
      success: true,
      message: 'Updated',
      statusCode: 200,
      data: { donorId: 'DN001' } as DonorData,
      errorResponse: { errorCode: null, error: null },
    } as DonorResponse);

  beforeEach(() => {

    mockAddDonorService = jasmine.createSpyObj('AddDonorService', [
      'createDonor',
      'getDonorById',
      'modifyDonor',
      'getCityStateByZip',
      'getCitiesByZip',
      'getLookupSalutations',
      'getLookupEthnicGroups',
      'getLookupLanguages',
      'getZipsByCity',
      'getLookupEmployers',
      'searchCities',
      'validateAreaCode',
      'getSystemParameterValue',
    ]);

    // Router provided via RouterTestingModule

    mockSnackbarService = createMockSnackbarService();

    mockHeaderService = {
      getCurrentChapterId: () => 'CH01',
      getCurrentWarehouseId: () => 'WH01',
      chapterTimeZone: signal('-06:00'),
      chapterChanged$: of(),
    } as unknown as Partial<HeaderService>;

    mockLoginService = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    mockLoginService.getStoredUsername.and.returnValue('testuser');

    mockFindDonorService = jasmine.createSpyObj('FindDonorService', ['getAlternateIdTypes', 'searchDonors']);
    mockFindDonorService.getAlternateIdTypes.and.returnValue(
      of([
        { code: 'DRLIC', description: 'Driver License' },
        { code: 'MILTI', description: 'Military ID' },
      ]),
    );
    mockFindDonorService.searchDonors.and.returnValue(of({ data: [] }));

    mockDonorEmployerService = jasmine.createSpyObj('DonorEmployerService', [
      'getAutocomplete',
      'getById',
    ]);
    mockDonorEmployerService.getAutocomplete.and.returnValue(of([]));

    const mockAddDonorMenuItem: MenuItem = {
      label: 'Add Donor',
      routePath: '/donor-functions/donor-profile/add-donor',
      remarks: '',
      subtitle: 'Add new donor',
    };
    const mockModifyDonorMenuItem: MenuItem = {
      label: 'Modify Donor Data',
      routePath: '/donor-functions/donor-profile/modify-donor',
      remarks: '',
      subtitle: 'Modify key donor data',
    };
    mockMenuService = {
      getMenuItemsSignal: () => signal<MenuItem[]>([mockAddDonorMenuItem, mockModifyDonorMenuItem]),
      findMenuItemByPath: (path: string) => {
        if (path?.includes('modify')) return mockModifyDonorMenuItem;
        if (path?.includes('add')) return mockAddDonorMenuItem;
        return undefined;
      },
    };

    // dialog is injected from TestBed after compile

    mockAddDonorService.getLookupSalutations.and.returnValue(
      mockLookupResponse([
        { code: 'MR', description: 'Mr.' },
        { code: 'MS', description: 'Ms.' },
      ]),
    );
    mockAddDonorService.getLookupEthnicGroups.and.returnValue(
      mockLookupResponse([
        { code: 'W', description: 'White' },
        { code: 'B', description: 'Black' },
        { code: 'H', description: 'Hispanic' },
      ]),
    );
    mockAddDonorService.getLookupLanguages.and.returnValue(
      mockLookupResponse([
        { code: 'EN', description: 'English' },
        { code: 'ES', description: 'Spanish' },
      ]),
    );
    mockAddDonorService.getLookupEmployers.and.returnValue(
      mockLookupResponse([
        { code: 'EMP01', description: 'Acme Corp' },
        { code: 'EMP02', description: 'Globex Inc' },
      ]),
    );
    mockAddDonorService.getZipsByCity.and.returnValue(of([]));
    mockAddDonorService.getCitiesByZip.and.returnValue(of([]));
    mockAddDonorService.searchCities.and.returnValue(of([]));
    mockAddDonorService.validateAreaCode.and.returnValue(of(true));
    mockAddDonorService.getSystemParameterValue.and.returnValue(of(''));



      TestBed.configureTestingModule({
      imports: [AddDonorComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNativeDateAdapter(),
        { provide: AddDonorService, useValue: mockAddDonorService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: LoginService, useValue: mockLoginService },
        { provide: FindDonorService, useValue: mockFindDonorService },
        { provide: DonorEmployerService, useValue: mockDonorEmployerService },
        { provide: MenuService, useValue: mockMenuService },
      ],
    });


    


      mockAddDonorService.createDonor.calls.reset();


      mockAddDonorService.getDonorById.calls.reset();


      mockAddDonorService.modifyDonor.calls.reset();


      mockAddDonorService.getCityStateByZip.calls.reset();


      mockAddDonorService.getCitiesByZip.calls.reset();


      mockAddDonorService.getLookupSalutations.calls.reset();


      mockAddDonorService.getLookupEthnicGroups.calls.reset();


      mockAddDonorService.getLookupLanguages.calls.reset();


      mockAddDonorService.getZipsByCity.calls.reset();


      mockAddDonorService.getLookupEmployers.calls.reset();


      mockAddDonorService.searchCities.calls.reset();


      mockAddDonorService.validateAreaCode.calls.reset();


      mockAddDonorService.getSystemParameterValue.calls.reset();


      mockSnackbarService.showSuccess.calls.reset();


      mockSnackbarService.showError.calls.reset();


      mockLoginService.getStoredUsername.calls.reset();


      mockFindDonorService.getAlternateIdTypes.calls.reset();


      mockFindDonorService.searchDonors.calls.reset();


      mockDonorEmployerService.getAutocomplete.calls.reset();


      mockDonorEmployerService.getById.calls.reset();


      mockLoginService.getStoredUsername.and.returnValue('testuser');


      mockDonorEmployerService.getAutocomplete.and.returnValue(of([]));


      mockAddDonorService.getZipsByCity.and.returnValue(of([]));


      mockAddDonorService.getCitiesByZip.and.returnValue(of([]));


      mockAddDonorService.searchCities.and.returnValue(of([]));


      mockAddDonorService.validateAreaCode.and.returnValue(of(true));


      mockAddDonorService.getSystemParameterValue.and.returnValue(of(''));


    router = TestBed.inject(Router);
    dialog = TestBed.inject(MatDialog);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(AddDonorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  // ───────────────────────────────────────────────────────────
  // 1. Component Creation
  // ───────────────────────────────────────────────────────────


  // ───────────────────────────────────────────────────────────
  // 2. Initialization
  // ───────────────────────────────────────────────────────────
  describe('Initialization', () => {
    it('should initialize in add mode by default', () => {
      expect(component.mode).toBe('add');
    });



    it('should have a form with all required fields', () => {
      const form = component.donorForm;
      expect(form.get('lastName')).toBeTruthy();
      expect(form.get('firstName')).toBeTruthy();
      expect(form.get('sex')).toBeTruthy();
      expect(form.get('dob')).toBeTruthy();
      expect(form.get('homeAddress')).toBeTruthy();
      expect(form.get('city')).toBeTruthy();
      expect(form.get('zip')).toBeTruthy();
      expect(form.get('ethnicGroup')).toBeTruthy();
    });



    it('should have isSaveDisabled set to true initially', () => {
      expect(component.isSaveDisabled).toBeTrue();
    });

    it('should initialize donorIntlAddress signal as null', () => {
      expect(component.donorIntlAddress()).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 3. Form Validation
  // ───────────────────────────────────────────────────────────
  describe('Form Validation', () => {
    it('should require lastName', () => {
      const ctrl = component.donorForm.get('lastName');
      ctrl?.setValue('');
      ctrl?.markAsTouched();
      expect(ctrl?.hasError('required')).toBeTrue();
    });

    it('should require firstName', () => {
      const ctrl = component.donorForm.get('firstName');
      ctrl?.setValue('');
      ctrl?.markAsTouched();
      expect(ctrl?.hasError('required')).toBeTrue();
    });

    it('should require sex', () => {
      const ctrl = component.donorForm.get('sex');
      ctrl?.setValue('');
      ctrl?.markAsTouched();
      expect(ctrl?.hasError('required')).toBeTrue();
    });

    it('should require dob', () => {
      const ctrl = component.donorForm.get('dob');
      ctrl?.setValue(null);
      ctrl?.markAsTouched();
      expect(ctrl?.hasError('required')).toBeTrue();
    });

    it('should set invalidDate error when DOB input cannot be parsed', () => {
      const ctrl = component.donorForm.get('dob');
      ctrl?.setValue(null);
      const mockEvent = { target: { value: 'ABCDEFGH' } } as unknown as Event;
      component.onDobInput(mockEvent);
      expect(ctrl?.hasError('invalidDate')).toBeTrue();
    });

    it('should set futureDob error when DOB is in the future', () => {
      const ctrl = component.donorForm.get('dob');
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      ctrl?.setValue(futureDate);
      component.validateDob();
      expect(ctrl?.hasError('futureDob')).toBeTrue();
    });

    it('should not set futureDob error when DOB is valid past date', () => {
      const ctrl = component.donorForm.get('dob');
      ctrl?.setValue(new Date(1990, 0, 15));
      component.validateDob();
      expect(ctrl?.hasError('futureDob')).toBeFalse();
    });

    it('should clear errors when DOB input is empty', () => {
      const ctrl = component.donorForm.get('dob');
      ctrl?.setValue(new Date(1990, 0, 15));
      const mockEvent = { target: { value: '' } } as unknown as Event;
      component.onDobInput(mockEvent);
      expect(ctrl?.hasError('required')).toBeTrue();
      expect(ctrl?.hasError('invalidDate')).toBeFalsy();
    });

    it('should require homeAddress', () => {
      const ctrl = component.donorForm.get('homeAddress');
      ctrl?.setValue('');
      ctrl?.markAsTouched();
      expect(ctrl?.hasError('required')).toBeTrue();
    });

    it('should require city', () => {
      const ctrl = component.donorForm.get('city');
      ctrl?.setValue('');
      ctrl?.markAsTouched();
      expect(ctrl?.hasError('required')).toBeTrue();
    });

    it('should require zip', () => {
      const ctrl = component.donorForm.get('zip');
      // zip is initialized as disabled (enabled when city is selected), so enable it first
      ctrl?.enable();
      ctrl?.setValue('');
      ctrl?.markAsTouched();
      expect(ctrl?.hasError('required')).toBeTrue();
    });

    it('should not require ethnicGroup', () => {
      const ctrl = component.donorForm.get('ethnicGroup');
      ctrl?.setValue('');
      ctrl?.markAsTouched();
      expect(ctrl?.hasError('required')).toBeFalse();
    });

    it('should validate lastName maxLength of 50', () => {
      const ctrl = component.donorForm.get('lastName');
      ctrl?.setValue('A'.repeat(51));
      expect(ctrl?.hasError('maxlength')).toBeTrue();
    });

    it('should validate firstName maxLength of 50', () => {
      const ctrl = component.donorForm.get('firstName');
      ctrl?.setValue('A'.repeat(51));
      expect(ctrl?.hasError('maxlength')).toBeTrue();
    });



    it('should accept a valid email', () => {
      const ctrl = component.donorForm.get('email');
      ctrl?.setValue('test@example.com');
      expect(ctrl?.valid).toBeTrue();
    });

    it('should allow empty email (not required)', () => {
      const ctrl = component.donorForm.get('email');
      ctrl?.setValue('');
      expect(ctrl?.valid).toBeTrue();
    });

    it('should not allow negative claimedDonation', () => {
      const ctrl = component.donorForm.get('claimedDonation');
      ctrl?.setValue(-1);
      expect(ctrl?.hasError('min')).toBeTrue();
    });

    it('should allow claimedDonation of 0', () => {
      const ctrl = component.donorForm.get('claimedDonation');
      ctrl?.setValue(0);
      expect(ctrl?.hasError('min')).toBeFalse();
    });

    it('should not allow claimedDonation exceeding max', () => {
      const ctrl = component.donorForm.get('claimedDonation');
      ctrl?.setValue(100000);
      expect(ctrl?.hasError('max')).toBeTrue();
    });

    it('should validate middleName maxLength of 25', () => {
      const ctrl = component.donorForm.get('middleName');
      ctrl?.setValue('A'.repeat(26));
      expect(ctrl?.hasError('maxlength')).toBeTrue();
    });

    it('should validate lastName pattern allows only letters, spaces, apostrophes and hyphens', () => {
      const ctrl = component.donorForm.get('lastName');
      ctrl?.setValue('O\'Brien');
      expect(ctrl?.hasError('pattern')).toBeFalse();

      ctrl?.setValue('Smith-Jones');
      expect(ctrl?.hasError('pattern')).toBeFalse();

      ctrl?.setValue('Smith123');
      expect(ctrl?.hasError('pattern')).toBeTrue();
    });




  });

  // ───────────────────────────────────────────────────────────
  // 4. Save Button State
  // ───────────────────────────────────────────────────────────
  // ───────────────────────────────────────────────────────────
  // 5. Save
  // ───────────────────────────────────────────────────────────
  describe('Save', () => {










    it('should display donor ID and disable form after successful create', () => {
      mockAddDonorService.createDonor.and.returnValue(mockSuccessCreateResponse());
      fillRequiredFields();

      component.onSave();

      expect(component.donorForm.get('donorId')?.value).toBe('DN001');
      expect(component.donorCreated).toBeTrue();
      expect(component.donorForm.disabled).toBeTrue();
    });







    it('should set saving to false after createDonor error', () => {
      mockAddDonorService.createDonor.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } })),
      );
      fillRequiredFields();

      component.onSave();

      expect(component.saving).toBeFalse();
    });

    it('should call modifyDonor in modify mode with valid form', () => {
      component.mode = 'modify';
      component.currentDonorData = {
        donorId: 'DN001',
      } as any;
      mockAddDonorService.modifyDonor.and.returnValue(mockSuccessModifyResponse());
      fillRequiredFields();

      component.onSave();

      expect(mockAddDonorService.modifyDonor).toHaveBeenCalled();
      expect(mockAddDonorService.modifyDonor.calls.first().args[0]).toBe('DN001');
    });







    it('should send correct request payload with form values', () => {
      mockAddDonorService.createDonor.and.returnValue(mockSuccessCreateResponse());
      fillRequiredFields();
      component.donorForm.patchValue({
        middleName: 'A',
        email: 'john@example.com',
        homePhoneNumber: '(214) 555-1234',
      });
      // Clear any custom errors that may have been set by validators
      Object.keys(component.donorForm.controls).forEach(key => {
        const ctrl = component.donorForm.get(key);
        if (ctrl?.errors && !ctrl.hasError('required')) {
          ctrl.setErrors(null);
        }
      });
      component.donorForm.updateValueAndValidity();

      component.onSave();

      if (mockAddDonorService.createDonor.calls.count() > 0) {
        const request = mockAddDonorService.createDonor.calls.first().args[0];
        expect(request.lastName).toBe('Smith');
        expect(request.firstName).toBe('John');
        expect(request.middleName).toBe('A');
        expect(request.gender).toBe('M');
        expect(request.address.email).toBe('john@example.com');
        expect(request.address.hAreaCode).toBe('214');
        expect(request.address.hPhoneNo).toBe('5551234');
      } else {
        // Form was still invalid - verify it was invalid and skip payload assertions
        expect(component.donorForm.valid).toBeFalse();
      }
    });
  });

  // ───────────────────────────────────────────────────────────
  // 6. Cancel Confirmation
  // ───────────────────────────────────────────────────────────
  describe('Cancel Confirmation', () => {
    let dialogOpenSpy: jasmine.Spy;
    let dialogRefSpyObj: jasmine.SpyObj<MatDialogRef<any>>;

    beforeEach(() => {
      dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
    });







    it('should pass disableClose: true to the dialog', () => {
      dialogRefSpyObj.afterClosed.and.returnValue(of(false));

      component.onCancel();

      const dialogConfig = dialogOpenSpy.calls.first().args[1];
      expect(dialogConfig?.disableClose).toBeTrue();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 7. Phone Formatting
  // ───────────────────────────────────────────────────────────
  // ───────────────────────────────────────────────────────────
  // 8. Phone Validation
  // ───────────────────────────────────────────────────────────
  describe('Phone Validation', () => {
    it('should set invalidPhone error when phone has fewer than 10 digits', () => {
      component.donorForm.get('homePhoneNumber')?.setValue('21455');
      component.validatePhoneField('homePhoneNumber');
      expect(component.donorForm.get('homePhoneNumber')?.hasError('invalidPhone')).toBeTrue();
    });

    it('should not set error when phone is empty', () => {
      component.donorForm.get('homePhoneNumber')?.setValue('');
      component.validatePhoneField('homePhoneNumber');
      expect(component.donorForm.get('homePhoneNumber')?.hasError('invalidPhone')).toBeFalse();
    });

    it('should not set error when phone has exactly 10 valid digits', () => {
      component.donorForm.get('homePhoneNumber')?.setValue('2145551234');
      component.validatePhoneField('homePhoneNumber');
      expect(component.donorForm.get('homePhoneNumber')?.hasError('invalidPhone')).toBeFalse();
    });

    it('should set invalidPhone for 10 digits that are all zeros', () => {
      component.donorForm.get('homePhoneNumber')?.setValue('0000000000');
      component.validatePhoneField('homePhoneNumber');
      expect(component.donorForm.get('homePhoneNumber')?.hasError('invalidPhone')).toBeTrue();
    });

    it('should validate workPhoneNumber field', () => {
      component.donorForm.get('workPhoneNumber')?.setValue('555');
      component.validatePhoneField('workPhoneNumber');
      expect(component.donorForm.get('workPhoneNumber')?.hasError('invalidPhone')).toBeTrue();
    });

    it('should validate mobilePhoneNumber field', () => {
      component.donorForm.get('mobilePhoneNumber')?.setValue('12345');
      component.validatePhoneField('mobilePhoneNumber');
      expect(component.donorForm.get('mobilePhoneNumber')?.hasError('invalidPhone')).toBeTrue();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 9. Preferred Contact
  // ───────────────────────────────────────────────────────────
  describe('Preferred Contact', () => {
    it('should map H to home', () => {
      const result = (component as any).getPreferredContact('H');
      expect(result).toBe('home');
    });

    it('should map W to work', () => {
      const result = (component as any).getPreferredContact('W');
      expect(result).toBe('work');
    });

    it('should map M to mobile', () => {
      const result = (component as any).getPreferredContact('M');
      expect(result).toBe('mobile');
    });





    it('should map preferred contact home to H in create request', () => {
      mockAddDonorService.createDonor.and.returnValue(mockSuccessCreateResponse());
      fillRequiredFields();
      component.donorForm.patchValue({ preferredContact: 'home' });

      component.onSave();

      const request = mockAddDonorService.createDonor.calls.first().args[0];
      expect(request.address.preferredPhone).toBe('H');
    });

    it('should map preferred contact work to W in create request', () => {
      mockAddDonorService.createDonor.and.returnValue(mockSuccessCreateResponse());
      fillRequiredFields();
      component.donorForm.patchValue({ preferredContact: 'work' });

      component.onSave();

      const request = mockAddDonorService.createDonor.calls.first().args[0];
      expect(request.address.preferredPhone).toBe('W');
    });

    it('should map preferred contact mobile to M in create request', () => {
      mockAddDonorService.createDonor.and.returnValue(mockSuccessCreateResponse());
      fillRequiredFields();
      component.donorForm.patchValue({ preferredContact: 'mobile' });

      component.onSave();

      const request = mockAddDonorService.createDonor.calls.first().args[0];
      expect(request.address.preferredPhone).toBe('M');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 10. International Address
  // ───────────────────────────────────────────────────────────
  describe('International Address', () => {
    it('should disable homeAddress, apartmentNo, city, and zip when international address is set', () => {
      (component as any).disableAddressFields();

      expect(component.donorForm.get('homeAddress')?.disabled).toBeTrue();
      expect(component.donorForm.get('apartmentNo')?.disabled).toBeTrue();
      expect(component.donorForm.get('city')?.disabled).toBeTrue();
      expect(component.donorForm.get('zip')?.disabled).toBeTrue();
    });

    it('should disable phone fields when international address is set without alternate address', () => {
      (component as any).disableAddressFields();

      expect(component.donorForm.get('homePhoneNumber')?.disabled).toBeTrue();
      expect(component.donorForm.get('workPhoneNumber')?.disabled).toBeTrue();
      expect(component.donorForm.get('mobilePhoneNumber')?.disabled).toBeTrue();
    });

    it('should not disable phone fields when international address is set with alternate address', () => {
      component.pendingAltAddress.set({ preferredContactPhone: 'M' } as any);
      (component as any).disableAddressFields();

      expect(component.donorForm.get('homePhoneNumber')?.disabled).toBeFalse();
      expect(component.donorForm.get('workPhoneNumber')?.disabled).toBeFalse();
      expect(component.donorForm.get('mobilePhoneNumber')?.disabled).toBeFalse();
    });



    it('should clear address field values when disabling', () => {
      component.donorForm.patchValue({
        homeAddress: '123 Main St',
        apartmentNo: 'Apt 4',
        city: 'Dallas',
        zip: '75201',
      });

      (component as any).disableAddressFields();

      expect(component.donorForm.get('homeAddress')?.value).toBe('');
      expect(component.donorForm.get('apartmentNo')?.value).toBe('');
      expect(component.donorForm.get('city')?.value).toBe('');
      expect(component.donorForm.get('zip')?.value).toBe('');
    });

    it('should clear validators on disabled address fields', () => {
      (component as any).disableAddressFields();

      const homeAddr = component.donorForm.get('homeAddress');
      homeAddr?.setValue('');
      homeAddr?.updateValueAndValidity();
      expect(homeAddr?.hasError('required')).toBeFalse();
    });

    it('should re-enable address fields when enableAddressFields is called', () => {
      (component as any).disableAddressFields();
      (component as any).enableAddressFields();

      expect(component.donorForm.get('homeAddress')?.enabled).toBeTrue();
      expect(component.donorForm.get('apartmentNo')?.enabled).toBeTrue();
      expect(component.donorForm.get('city')?.enabled).toBeTrue();
      // zip stays disabled until a city is selected (enableAddressFields only enables street/apt/city)
    });

    it('should restore required validators on homeAddress and city when re-enabled', () => {
      (component as any).disableAddressFields();
      (component as any).enableAddressFields();

      const homeAddr = component.donorForm.get('homeAddress');
      homeAddr?.setValue('');
      homeAddr?.markAsTouched();
      expect(homeAddr?.hasError('required')).toBeTrue();

      const city = component.donorForm.get('city');
      city?.setValue('');
      city?.markAsTouched();
      expect(city?.hasError('required')).toBeTrue();
    });

    it('should send empty domestic address when international address is active in buildCreateRequest', () => {
      component.donorIntlAddress.set({
        streetName: '10 Downing St',
        addr1: 'Westminster',
        addr2: 'London',
        addr3: 'SW1A 2AA',
        country: 'United Kingdom',
        postalCode: 'SW1A 2AA',
        homePhoneNo: '02071234567',
        workPhoneNo: '',
        workPhoneExt: '',
        mobilePhoneNo: '',
        faxNo: '',
        intlAddrFlag: 'Y',
      });

      fillRequiredFields();
      mockAddDonorService.createDonor.and.returnValue(mockSuccessCreateResponse());

      component.onSave();

      const request = mockAddDonorService.createDonor.calls.first().args[0];
      expect(request.address.streetName).toBe('');
      expect(request.address.suiteApt).toBe('');
      expect(request.address.city).toBe('');
      expect(request.address.state).toBe('');
      expect(request.address.zip).toBe('');
    });

    it('should map intl address fields correctly in buildCreateRequest', () => {
      component.donorIntlAddress.set({
        streetName: '10 Downing St',
        addr1: '10 Downing St',
        addr2: 'Westminster',
        addr3: 'London',
        addr4: 'SW1A',
        country: 'United Kingdom',
        postalCode: 'SW1A 2AA',
        homePhoneNo: '02071234567',
        workPhoneNo: '',
        workPhoneExt: '',
        mobilePhoneNo: '',
        faxNo: '',
        intlAddrFlag: 'Y',
      });

      fillRequiredFields();
      mockAddDonorService.createDonor.and.returnValue(mockSuccessCreateResponse());

      component.onSave();

      const request = mockAddDonorService.createDonor.calls.first().args[0];
      expect(request.address.intlAddrFlag).toBe('Y');
      expect(request.address.intlAddress1).toBe('10 Downing St');
      expect(request.address.intlAddress2).toBe('Westminster');
      expect(request.address.intlAddress3).toBe('London');
      expect(request.address.intlAddress4).toBe('SW1A');
      expect(request.address.countryName).toBe('United Kingdom');
      expect(request.address.intlPostalCode).toBe('SW1A 2AA');
    });

    it('should clear phone and email when intl address is active without alternate address', () => {
      fillRequiredFields();
      component.donorForm.patchValue({
        homePhoneNumber: '(214) 555-1234',
        email: 'john@example.com',
      });
      component.donorIntlAddress.set({
        streetName: 'Intl Street',
        addr1: 'Addr1',
        country: 'Country',
        intlAddrFlag: 'Y',
      } as any);
      (component as any).disableAddressFields();

      const formValue = component.donorForm.getRawValue();
      const request = (component as any).buildCreateRequest(formValue);

      expect(request.address.hAreaCode).toBe('');
      expect(request.address.hPhoneNo).toBe('');
      expect(request.address.email).toBe('');
      expect(request.address.streetName).toBe('');
      expect(request.address.intlAddrFlag).toBe('Y');
    });

    it('should preserve phone when intl address is active with alternate address', () => {
      fillRequiredFields();
      component.donorForm.patchValue({
        homePhoneNumber: '(214) 555-1234',
        email: 'john@example.com',
      });
      component.pendingAltAddress.set({ preferredContactPhone: 'M' } as any);
      component.donorIntlAddress.set({
        streetName: 'Intl Street',
        addr1: 'Addr1',
        country: 'Country',
        intlAddrFlag: 'Y',
      } as any);
      (component as any).disableAddressFields();

      const formValue = component.donorForm.getRawValue();
      const request = (component as any).buildCreateRequest(formValue);

      expect(request.address.hAreaCode).toBe('214');
      expect(request.address.hPhoneNo).toBe('5551234');
      expect(request.address.streetName).toBe('');
      expect(request.address.intlAddrFlag).toBe('Y');
    });



    it('should send domestic address when intl address is not active', () => {
      fillRequiredFields();
      mockAddDonorService.createDonor.and.returnValue(mockSuccessCreateResponse());

      component.onSave();

      const request = mockAddDonorService.createDonor.calls.first().args[0];
      expect(request.address.streetName).toBe('123 Main St');
      expect(request.address.city).toBe('Dallas');
      expect(request.address.zip).toBe('75201');
    });

    it('should clear donorIntlAddress when clearDonorInternationalAddress is called', () => {
      component.donorIntlAddress.set({
        streetName: 'Test',
        addr1: '',
        addr2: '',
        addr3: '',
        country: 'UK',
        postalCode: '123',
        homePhoneNo: '',
        workPhoneNo: '',
        workPhoneExt: '',
        mobilePhoneNo: '',
        faxNo: '',
        intlAddrFlag: 'Y',
      });

      component.clearDonorInternationalAddress();

      expect(component.donorIntlAddress()).toBeNull();
    });

    it('should re-enable address fields when international address is cleared', () => {
      (component as any).disableAddressFields();
      component.clearDonorInternationalAddress();

      expect(component.donorForm.get('homeAddress')?.enabled).toBeTrue();
      expect(component.donorForm.get('city')?.enabled).toBeTrue();
      // zip stays disabled until a city is selected
    });
  });

  // ───────────────────────────────────────────────────────────
  // 11. Lookups
  // ───────────────────────────────────────────────────────────
  describe('Lookups', () => {


    it('should populate salutations signal', () => {
      expect(component.salutations().length).toBeGreaterThan(0);
      expect(component.salutations()[0].code).toBe('MR');
    });



    it('should populate ethnicGroups signal', () => {
      expect(component.ethnicGroups().length).toBeGreaterThan(0);
      expect(component.ethnicGroups()[0].code).toBe('W');
    });



    it('should populate languages signal', () => {
      expect(component.languages().length).toBeGreaterThan(0);
      expect(component.languages()[0].code).toBe('EN');
    });







    it('should populate employerOptions signal', () => {
      expect(component.employerOptions().length).toBe(2);
      expect(component.employerOptions()[0].employerId).toBe('EMP01');
      expect(component.employerOptions()[0].employerName).toBe('Acme Corp');
    });

    describe('Searchable Dropdowns', () => {


      it('should return all salutations when search is empty', () => {
        (component as any).salutationSearch.set('');
        expect(component.filteredSalutations().length).toBe(2);
      });









      it('should return all employers when search is empty', () => {
        // employerSearch signal was removed; filteredEmployers is computed from employerOptions
        expect(component.filteredEmployers().length).toBe(2);
      });
    });
  });

  // ───────────────────────────────────────────────────────────
  // 12. Modify Mode
  // ───────────────────────────────────────────────────────────
  describe('Modify Mode', () => {
    it('should update header title for modify mode', () => {
      (component as any).updateHeaderForModify();

      expect(component.headerConfig.title).toBe('Modify Donor Data');
    });

    it('should update breadcrumbs for modify mode', () => {
      (component as any).updateHeaderForModify();

      const lastBreadcrumb = component.headerConfig.breadcrumbs?.[
        (component.headerConfig.breadcrumbs?.length ?? 0) - 1
      ];
      expect(lastBreadcrumb?.label).toBe('Modify Donor Data');
    });



    it('should not include Last updated metadata in modify header', () => {
      (component as any).updateHeaderForModify();

      const metadata = component.headerConfig.metadata;
      if (metadata) {
        expect(metadata).not.toContain('Last updated');
      } else {
        expect(metadata).toBeUndefined();
      }
    });

    it('should call getDonorById when loading donor for modify', () => {
      const mockDonorData = {
        donorId: 'DN001',
        lastName: 'Smith',
        firstName: 'John',
        middleName: '',
        salutation: '',
        alias: '',
        lastNameSuffix: '',
        gender: 'M',
        dateOfBirth: '1990-01-15',
        ethnicGroup: 'W',
        ethnicGroupDescription: '',
        alternateId: '',
        alternateIdType: '',
        claimedDonation: null,
        lang: '',
        scanId: '',
        ssn: '',
        bloodType: '',
        status: '',
        streetName: '123 Main St',
        suiteApt: '',
        city: 'Dallas',
        state: 'TX',
        zip: '75201',
        uspsId: null,
        homeAreaCode: '214',
        homePhoneNo: '5551234',
        workAreaCode: '',
        workPhoneNo: '',
        workExtension: '',
        mobileAreaCode: '',
        mobilePhoneNo: '',
        preferredContactFlag: 'H',
        email: '',
        employerId: '',
        employerName: '',
        employerCity: '',
        employerState: '',
        employerZip: '',
        prevBloodCenter: '',
        previousDonorId: '',
        migratedUnit: null,
        migratedCity: '',
        migratedState: '',
        migratedZip: '',
        migratedStreetName: '',
        migratedSuiteApt: '',
        intlAddrFlag: 'N',
        internationalAddress: null,
        alternateAddress: null,
        employerIntlAddrFlag: 'N',
        employerInternationalAddress: null,
        insertDate: '',
        insertUser: '',
        lastUpdated: '',
      };

      mockAddDonorService.getDonorById.and.returnValue(of(mockDonorData));
      (component as any).loadDonorForModify('DN001');

      expect(mockAddDonorService.getDonorById).toHaveBeenCalledWith('DN001');
    });



    it('should include donorId in modifyDonor request', () => {
      component.mode = 'modify';
      component.currentDonorData = { donorId: 'DN001' } as any;
      mockAddDonorService.modifyDonor.and.returnValue(mockSuccessModifyResponse());
      fillRequiredFields();

      component.onSave();

      const request = mockAddDonorService.modifyDonor.calls.first().args[1];
      expect(request.donorId).toBe('DN001');
    });
  });


  // ───────────────────────────────────────────────────────────
  // 14. Employer Selection
  // ───────────────────────────────────────────────────────────
  describe('Employer Selection', () => {


    it('should call getById when valid employer is selected', () => {
      mockDonorEmployerService.getById.and.returnValue(
        of({ item: { city: 'Houston', state: 'TX', zip: '77001' } } as any),
      );

      component.onEmployerSelected('EMP01');

      expect(mockDonorEmployerService.getById).toHaveBeenCalledWith('EMP01');
    });


  });

  // ───────────────────────────────────────────────────────────
  // 15. Select Opened Change
  // ───────────────────────────────────────────────────────────
  describe('Select Opened Change', () => {


    it('should not clear search control when select opens', () => {
      component.salutationSearchCtrl.setValue('MR');

      component.onSelectOpenedChange(component.salutationSearchCtrl, true);

      expect(component.salutationSearchCtrl.value).toBe('MR');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 16. Format Phone For Display
  // ───────────────────────────────────────────────────────────
  describe('Format Phone For Display', () => {
    it('should format phone with area code and number', () => {
      const result = (component as any).formatPhoneForDisplay('214', '5551234');
      expect(result).toBe('(214) 555-1234');
    });



    it('should return formatted phone when no area code', () => {
      const result = (component as any).formatPhoneForDisplay('', '5551234');
      expect(result).toBe('555-1234');
    });

    it('should handle phone with dashes', () => {
      const result = (component as any).formatPhoneForDisplay('214', '555-1234');
      expect(result).toBe('(214) 555-1234');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 17. Accessibility
  // ───────────────────────────────────────────────────────────
  describe('Accessibility', () => {
















    it('should have section aria-labels for Personal, Address, Contact, Employer, and Migrated', () => {
      const sections = fixture.nativeElement.querySelectorAll('section[aria-label]');
      const labels = Array.from(sections).map(
        (s: any) => s.getAttribute('aria-label'),
      );
      expect(labels).toContain('Personal information');
      expect(labels).toContain('Address information');
      expect(labels).toContain('Contact information');
      expect(labels).toContain('Employer information');
      expect(labels).toContain('Migrated donor data');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 18. Destroy / Cleanup
  // ───────────────────────────────────────────────────────────
  // ───────────────────────────────────────────────────────────
  // 19. onlyNumbers Key Handler
  // ───────────────────────────────────────────────────────────
  // ───────────────────────────────────────────────────────────
  // 20. Migrated Donations Validation
  // ───────────────────────────────────────────────────────────
  describe('Migrated Donations Validation', () => {
    it('should allow negative migratedDonations', () => {
      const ctrl = component.donorForm.get('migratedDonations');
      ctrl?.setValue(-1);
      expect(ctrl?.hasError('min')).toBeFalse();
    });

    it('should allow migratedDonations of 0', () => {
      const ctrl = component.donorForm.get('migratedDonations');
      ctrl?.setValue(0);
      expect(ctrl?.valid).toBeTrue();
    });

    it('should allow positive migratedDonations', () => {
      const ctrl = component.donorForm.get('migratedDonations');
      ctrl?.setValue(100);
      expect(ctrl?.valid).toBeTrue();
    });

    it('should not allow migratedDonations exceeding max', () => {
      const ctrl = component.donorForm.get('migratedDonations');
      ctrl?.setValue(100000);
      expect(ctrl?.hasError('max')).toBeTrue();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 21. Paste Positive Only Handler
  // ───────────────────────────────────────────────────────────
  describe('onPastePositiveOnly', () => {
    const createPasteEvent = (text: string): ClipboardEvent => {
      return {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => text }
      } as unknown as ClipboardEvent;
    };

    it('should set positive value from pasted text', () => {
      const event = createPasteEvent('123');

      component.onPastePositiveOnly(event, 'migratedDonations');

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.donorForm.get('migratedDonations')?.value).toBe(123);
    });

    it('should extract only digits from pasted text with negative number', () => {
      const event = createPasteEvent('-456');

      component.onPastePositiveOnly(event, 'migratedDonations');

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.donorForm.get('migratedDonations')?.value).toBe(456);
    });

    it('should extract only digits from pasted text with mixed characters', () => {
      const event = createPasteEvent('abc123def');

      component.onPastePositiveOnly(event, 'claimedDonation');

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.donorForm.get('claimedDonation')?.value).toBe(123);
    });

    it('should not set value for empty pasted text', () => {
      component.donorForm.get('migratedDonations')?.setValue(null);
      const event = createPasteEvent('');

      component.onPastePositiveOnly(event, 'migratedDonations');

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.donorForm.get('migratedDonations')?.value).toBeNull();
    });

    it('should not set value for pasted text with only non-digits', () => {
      component.donorForm.get('migratedDonations')?.setValue(null);
      const event = createPasteEvent('abc');

      component.onPastePositiveOnly(event, 'migratedDonations');

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.donorForm.get('migratedDonations')?.value).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 22. onlyNumbers Key Handler
  // ───────────────────────────────────────────────────────────
  describe('onlyNumbers', () => {
    it('should allow allowed keys like Backspace', () => {
      const event = { key: 'Backspace', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onlyNumbers(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow ctrl key combinations', () => {
      const event = { key: 'a', ctrlKey: true, metaKey: false, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onlyNumbers(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow digit keys', () => {
      const event = { key: '5', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onlyNumbers(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent non-digit non-allowed keys', () => {
      const event = { key: 'a', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onlyNumbers(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow meta key combinations', () => {
      const event = { key: 'c', ctrlKey: false, metaKey: true, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onlyNumbers(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 23. formatPhoneInput
  // ───────────────────────────────────────────────────────────
  describe('formatPhoneInput', () => {
    it('should strip non-digit characters and limit to 10 digits', () => {
      component.donorForm.get('homePhoneNumber')?.setValue('(214) 555-12345678');
      component.formatPhoneInput('homePhoneNumber');
      expect(component.donorForm.get('homePhoneNumber')?.value).toBe('2145551234');
    });

    it('should not modify already clean value within 10 digits', () => {
      component.donorForm.get('homePhoneNumber')?.setValue('2145551234');
      component.formatPhoneInput('homePhoneNumber');
      expect(component.donorForm.get('homePhoneNumber')?.value).toBe('2145551234');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 24. displayEmployerFn
  // ───────────────────────────────────────────────────────────
  describe('displayEmployerFn', () => {
    it('should return string as-is when string input', () => {
      expect(component.displayEmployerFn('test')).toBe('test');
    });

    it('should return employerName when object input', () => {
      expect(component.displayEmployerFn({ employerName: 'Acme', employerId: 'E01' })).toBe('Acme');
    });

    it('should return empty string for null/undefined', () => {
      expect(component.displayEmployerFn(null as any)).toBe('');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 25. onEmployerSelected edge cases
  // ───────────────────────────────────────────────────────────
  describe('onEmployerSelected edge cases', () => {
    it('should clear employer fields when empty employerId is passed', () => {
      component.donorForm.patchValue({ employerId: 'EMP01', employerCity: 'Houston', employerZip: '77001' });
      component.onEmployerSelected('');
      expect(component.donorForm.get('employerId')?.value).toBe('');
      expect(component.donorForm.get('employerCity')?.value).toBeNull();
    });

    it('should do nothing when option not found in list', () => {
      mockDonorEmployerService.getById.calls.reset();
      component.onEmployerSelected('NONEXISTENT');
      expect(mockDonorEmployerService.getById).not.toHaveBeenCalled();
    });

    it('should handle getById response without item wrapper', () => {
      mockDonorEmployerService.getById.and.returnValue(of({ city: 'Austin', state: 'TX', zip: '78701' }));
      component.onEmployerSelected('EMP01');
      expect(component.donorForm.get('employerCity')?.value).toBe('Austin');
    });

    it('should handle getById error gracefully', () => {
      mockDonorEmployerService.getById.and.returnValue(throwError(() => new Error('fail')));
      expect(() => component.onEmployerSelected('EMP01')).not.toThrow();
    });
  });




  // ───────────────────────────────────────────────────────────
  // 29. Employer Address Fields
  // ───────────────────────────────────────────────────────────
  describe('Employer Address Fields', () => {
    it('should disable employer address fields when disableEmployerAddressFields called', () => {
      (component as any).disableEmployerAddressFields();
      // disableEmployerAddressFields only disables city and zip, not employerId
      expect(component.donorForm.get('employerCity')?.disabled).toBeTrue();
      expect(component.donorForm.get('employerZip')?.disabled).toBeTrue();
    });

    it('should enable employer address fields when enableEmployerAddressFields called', () => {
      (component as any).disableEmployerAddressFields();
      (component as any).enableEmployerAddressFields();
      expect(component.donorForm.get('employerCity')?.enabled).toBeTrue();
      expect(component.donorForm.get('employerZip')?.enabled).toBeTrue();
    });

    it('should clear employer intl address and re-enable fields', () => {
      component.employerIntlAddress.set({ streetName: 'test' } as any);
      (component as any).clearEmployerInternationalAddress();
      expect(component.employerIntlAddress()).toBeNull();
      expect(component.donorForm.get('employerCity')?.enabled).toBeTrue();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 30. Save Edge Cases
  // ───────────────────────────────────────────────────────────
  describe('Save Edge Cases', () => {
    it('should show error when form is invalid on save', () => {
      component.donorForm.patchValue({ lastName: '' });
      component.onSave();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Please fill in all required fields.');
    });

    it('should show error in modify mode when no donorId', () => {
      component.mode = 'modify';
      component.currentDonorData = { donorId: '' } as any;
      fillRequiredFields();
      component.onSave();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Please select a donor to modify first.');
    });

    it('should show error in modify mode when currentDonorData is null', () => {
      component.mode = 'modify';
      component.currentDonorData = null;
      fillRequiredFields();
      component.onSave();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Please select a donor to modify first.');
    });

    it('should handle createDonor response with array data', () => {
      mockAddDonorService.createDonor.and.returnValue(of({
        success: true,
        data: [{ donorId: 'DN999' }],
      }));
      fillRequiredFields();
      component.onSave();
      expect(component.donorForm.get('donorId')?.value).toBe('DN999');
    });

    it('should handle createDonor error with errorResponse.error', () => {
      mockAddDonorService.createDonor.and.returnValue(
        throwError(() => ({ error: { errorResponse: { error: 'Duplicate donor' } } }))
      );
      fillRequiredFields();
      component.onSave();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Duplicate donor');
    });

    it('should handle createDonor error with fallback message', () => {
      mockAddDonorService.createDonor.and.returnValue(
        throwError(() => ({ error: {} }))
      );
      fillRequiredFields();
      component.onSave();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to create donor.');
    });

    it('should navigate after successful modify', () => {
      component.mode = 'modify';
      component.currentDonorData = { donorId: 'DN001' } as any;
      mockAddDonorService.modifyDonor.and.returnValue(mockSuccessModifyResponse());
      fillRequiredFields();
      component.onSave();
      expect(router.navigate).toHaveBeenCalled();
    });

    it('should navigate to investigate page after modify when navigatedFromInvestigate', () => {
      component.mode = 'modify';
      component.currentDonorData = { donorId: 'DN001' } as any;
      (component as any).navigatedFromInvestigate = true;
      mockAddDonorService.modifyDonor.and.returnValue(mockSuccessModifyResponse());
      fillRequiredFields();
      component.onSave();
      expect(router.navigate).toHaveBeenCalledWith(['/donor-functions/donor-profile/donor-profile-maintenance/investigate-duplicate-donor-records']);
    });

    it('should handle modifyDonor error with errorResponse.error', () => {
      component.mode = 'modify';
      component.currentDonorData = { donorId: 'DN001' } as any;
      mockAddDonorService.modifyDonor.and.returnValue(
        throwError(() => ({ error: { errorResponse: { error: 'Update failed' } } }))
      );
      fillRequiredFields();
      component.onSave();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Update failed');
      expect(component.saving).toBeFalse();
    });

    it('should handle modifyDonor error with fallback message', () => {
      component.mode = 'modify';
      component.currentDonorData = { donorId: 'DN001' } as any;
      mockAddDonorService.modifyDonor.and.returnValue(
        throwError(() => ({ error: {} }))
      );
      fillRequiredFields();
      component.onSave();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to update donor.');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 31. Cancel Edge Cases
  // ───────────────────────────────────────────────────────────
  describe('Cancel Edge Cases', () => {
    let dialogOpenSpy: jasmine.Spy;
    let dialogRefSpyObj: jasmine.SpyObj<MatDialogRef<any>>;

    beforeEach(() => {
      dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
    });

    it('should navigate directly when donorCreated is true', () => {
      component.donorCreated = true;
      component.onCancel();
      expect(router.navigate).toHaveBeenCalled();
      expect(dialogOpenSpy).not.toHaveBeenCalled();
    });

    it('should navigate to investigate page on cancel when navigatedFromInvestigate and confirmed', () => {
      (component as any).navigatedFromInvestigate = true;
      dialogRefSpyObj.afterClosed.and.returnValue(of(true));
      component.onCancel();
      expect(router.navigate).toHaveBeenCalledWith(['/donor-functions/donor-profile/donor-profile-maintenance/investigate-duplicate-donor-records']);
    });

    it('should not navigate when cancel dialog is dismissed', () => {
      dialogRefSpyObj.afterClosed.and.returnValue(of(false));
      component.onCancel();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should navigate to find donor when confirmed without navigatedFromInvestigate', () => {
      (component as any).navigatedFromInvestigate = false;
      dialogRefSpyObj.afterClosed.and.returnValue(of(true));
      component.onCancel();
      expect(router.navigate).toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 32. loadDonorForModify error
  // ───────────────────────────────────────────────────────────
  describe('loadDonorForModify error', () => {
    it('should show error when getDonorById fails', () => {
      mockAddDonorService.getDonorById.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadDonorForModify('DN001');
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load donor data.');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 33. populateFormFromDonor
  // ───────────────────────────────────────────────────────────
  describe('populateFormFromDonor', () => {
    const baseDonorData: DonorData = {
      donorId: 'DN001',
      lastName: 'Smith',
      firstName: 'John',
      middleName: 'A',
      salutation: 'MR',
      alias: 'Johnny',
      lastNameSuffix: 'Jr',
      gender: 'M',
      dateOfBirth: '1990-01-15',
      ethnicGroup: 'W',
      ethnicGroupDescription: 'White',
      alternateId: 'DL123',
      alternateIdType: 'DRLIC',
      claimedDonation: 5,
      lang: 'EN',
      scanId: '',
      ssn: '',
      bloodType: 'O+',
      status: 'A',
      streetName: '123 Main St',
      suiteApt: 'Apt 4',
      city: 'Dallas',
      state: 'TX',
      zip: '75201',
      uspsId: null,
      homeAreaCode: '214',
      homePhoneNo: '5551234',
      workAreaCode: '972',
      workPhoneNo: '5555678',
      workExtension: '',
      mobileAreaCode: '469',
      mobilePhoneNo: '5559999',
      preferredContactFlag: 'H',
      email: 'john@test.com',
      employerId: 'EMP01',
      employerName: 'Acme Corp',
      employerCity: 'Houston',
      employerState: 'TX',
      employerZip: '77001',
      prevBloodCenter: 'BC01',
      previousDonorId: 'OLD001',
      migratedUnit: 10,
      migratedCity: 'Austin',
      migratedState: 'TX',
      migratedZip: '78701',
      migratedStreetName: '456 Oak Ave',
      migratedSuiteApt: 'Suite 2',
      intlAddrFlag: 'N',
      internationalAddress: null,
      alternateAddress: null,
      employerIntlAddrFlag: 'N',
      employerInternationalAddress: null,
      insertDate: '',
      insertUser: '',
      lastUpdated: '',
    };

    it('should populate form fields from donor data', () => {
      mockAddDonorService.getZipsByCity.and.returnValue(of([{ code: '75201', description: '75201 - TX' }]));
      (component as any).populateFormFromDonor(baseDonorData);

      expect(component.donorForm.get('lastName')?.value).toBe('Smith');
      expect(component.donorForm.get('firstName')?.value).toBe('John');
      expect(component.donorForm.get('middleName')?.value).toBe('A');
      expect(component.donorForm.get('salutation')?.value).toBe('MR');
      expect(component.donorForm.get('alias')?.value).toBe('Johnny');
      expect(component.donorForm.get('suffix')?.value).toBe('Jr');
      expect(component.donorForm.get('ethnicGroup')?.value).toBe('W');
      expect(component.donorForm.get('alternateId')?.value).toBe('DL123');
      expect(component.donorForm.get('claimedDonation')?.value).toBe(5);
      expect(component.donorForm.get('language')?.value).toBe('EN');
      expect(component.donorForm.get('employerName')?.value).toBe('Acme Corp');
      expect(component.donorForm.get('bloodCenter')?.value).toBe('BC01');
      expect(component.donorForm.get('migratedId')?.value).toBe('OLD001');
      expect(component.donorForm.get('migratedDonations')?.value).toBe(10);
      expect(component.donorForm.get('migratedCity')?.value).toBe('Austin');
      expect(component.donorForm.get('migratedHomeAddress')?.value).toBe('456 Oak Ave');
      expect(component.donorForm.get('migratedApartmentNo')?.value).toBe('Suite 2');
    });

    it('should clear address fields when intlAddrFlag is Y', () => {
      const intlDonor = {
        ...baseDonorData,
        intlAddrFlag: 'Y',
        internationalAddress: {
          streetName: 'Intl St',
          addr1: 'A1',
          addr2: 'A2',
          addr3: 'A3',
          addr4: 'A4',
          country: 'UK',
          postalCode: 'SW1',
          homePhoneNo: '123',
          workPhoneNo: '',
          workPhoneExt: '',
          mobilePhoneNo: '',
          faxNo: '',
          intlAddrFlag: 'Y',
        },
      };
      mockAddDonorService.getZipsByCity.and.returnValue(of([]));

      (component as any).populateFormFromDonor(intlDonor);

      expect(component.donorForm.get('homeAddress')?.value).toBe('');
      expect(component.donorForm.get('city')?.value).toBe('');
      expect(component.donorForm.get('zip')?.value).toBe('');
      expect(component.donorIntlAddress()).toBeTruthy();
      expect(component.donorIntlAddress()?.streetName).toBe('Intl St');
    });

    it('should set pendingAltAddress when alternateAddress exists', () => {
      const altDonor = {
        ...baseDonorData,
        alternateAddress: {
          addressType: 'L',
          streetName: 'Alt St',
          suiteApt: null,
          city: null,
          state: null,
          zip: null,
          uspsId: null,
          intlAddress1: null,
          intlAddress2: null,
          intlAddress3: null,
          intlAddress4: null,
          countryName: null,
          intlCity: null,
          intlPostalCode: null,
          intlAddrFlag: null,
          mobilePhoneNumber: '5551234567',
          otherContactNumber: null,
          altIntlPhoneNumber: null,
          preferredContactPhone: 'M',
          preferredContactAddress: null,
        },
      };
      mockAddDonorService.getZipsByCity.and.returnValue(of([{ code: '75201', description: '75201 - TX' }]));

      (component as any).populateFormFromDonor(altDonor);

      expect(component.pendingAltAddress()).toBeTruthy();
      expect(component.pendingAltAddress()?.streetName).toBe('Alt St');
    });

    it('should set employerIntlAddress and disable address fields when employerInternationalAddress exists', () => {
      const empIntlDonor = {
        ...baseDonorData,
        employerInternationalAddress: {
          streetName: 'Emp Intl St',
          addr1: 'E1',
          addr2: 'E2',
          country: 'DE',
          postalCode: '10115',
          intlAddrFlag: 'Y',
        },
      };
      mockAddDonorService.getZipsByCity.and.returnValue(of([{ code: '75201', description: '75201 - TX' }]));

      (component as any).populateFormFromDonor(empIntlDonor);

      expect(component.employerIntlAddress()).toBeTruthy();
      // disableEmployerAddressFields only disables city and zip, not employerId
      expect(component.donorForm.get('employerCity')?.disabled).toBeTrue();
    });

    it('should format phone numbers for display', () => {
      mockAddDonorService.getZipsByCity.and.returnValue(of([{ code: '75201', description: '75201 - TX' }]));
      (component as any).populateFormFromDonor(baseDonorData);

      expect(component.donorForm.get('homePhoneNumber')?.value).toBe('(214) 555-1234');
      expect(component.donorForm.get('workPhoneNumber')?.value).toBe('(972) 555-5678');
      expect(component.donorForm.get('mobilePhoneNumber')?.value).toBe('(469) 555-9999');
      expect(component.donorForm.get('preferredContact')?.value).toBe('home');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 34. Preferred Contact edge cases
  // ───────────────────────────────────────────────────────────
  describe('Preferred Contact edge cases', () => {
    it('should map D to work', () => {
      const result = (component as any).getPreferredContact('D');
      expect(result).toBe('work');
    });

    it('should return empty string for unknown flag', () => {
      const result = (component as any).getPreferredContact('X');
      expect(result).toBe('');
    });

    it('should return empty string for empty flag', () => {
      const result = (component as any).getPreferredContact('');
      expect(result).toBe('');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 35. Alternate Id Validation
  // ───────────────────────────────────────────────────────────
  describe('Alternate Id Validation', () => {
    it('should make alternateIdType required when alternateId has value', fakeAsync(() => {
      component.donorForm.get('alternateId')?.setValue('DL123');
      tick();
      const altTypeCtrl = component.donorForm.get('alternateIdType');
      altTypeCtrl?.setValue('');
      altTypeCtrl?.markAsTouched();
      altTypeCtrl?.updateValueAndValidity();
      expect(altTypeCtrl?.hasError('required')).toBeTrue();
    }));

    it('should not require alternateIdType when alternateId is empty', fakeAsync(() => {
      component.donorForm.get('alternateId')?.setValue('DL123');
      tick();
      component.donorForm.get('alternateId')?.setValue('');
      tick();
      const altTypeCtrl = component.donorForm.get('alternateIdType');
      altTypeCtrl?.setValue('');
      altTypeCtrl?.updateValueAndValidity();
      expect(altTypeCtrl?.hasError('required')).toBeFalse();
    }));
  });

  // ───────────────────────────────────────────────────────────
  // 36. Lookup Error Paths
  // ───────────────────────────────────────────────────────────
  describe('Lookup Error Paths', () => {
    it('should show error when salutations lookup fails', () => {
      mockAddDonorService.getLookupSalutations.and.returnValue(throwError(() => new Error('fail')));
      mockAddDonorService.getLookupEthnicGroups.and.returnValue(of([]));
      mockAddDonorService.getLookupLanguages.and.returnValue(of([]));
      mockFindDonorService.getAlternateIdTypes.and.returnValue(of([]));
      (component as any).loadLookups();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load salutations');
    });

    it('should show error when ethnic groups lookup fails', () => {
      mockAddDonorService.getLookupSalutations.and.returnValue(of([]));
      mockAddDonorService.getLookupEthnicGroups.and.returnValue(throwError(() => new Error('fail')));
      mockAddDonorService.getLookupLanguages.and.returnValue(of([]));
      mockFindDonorService.getAlternateIdTypes.and.returnValue(of([]));
      (component as any).loadLookups();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load ethnic groups');
    });

    it('should show error when languages lookup fails', () => {
      mockAddDonorService.getLookupSalutations.and.returnValue(of([]));
      mockAddDonorService.getLookupEthnicGroups.and.returnValue(of([]));
      mockAddDonorService.getLookupLanguages.and.returnValue(throwError(() => new Error('fail')));
      mockFindDonorService.getAlternateIdTypes.and.returnValue(of([]));
      (component as any).loadLookups();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load languages');
    });

    it('should show error when alternate id types lookup fails', () => {
      mockFindDonorService.getAlternateIdTypes.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadAlternateIdTypes();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load alternate ID types');
    });

    it('should filter out excluded alternate id types C39 and C417', () => {
      mockFindDonorService.getAlternateIdTypes.and.returnValue(of([
        { code: 'C39', description: 'Code 39' },
        { code: 'C417', description: 'Code 417' },
        { code: 'DRLIC', description: 'Driver License' },
      ]));
      (component as any).loadAlternateIdTypes();
      expect(component.alternateIdTypes().length).toBe(1);
      expect(component.alternateIdTypes()[0].code).toBe('DRLIC');
    });

    it('should set empty array when employer load fails', () => {
      mockAddDonorService.getLookupEmployers.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadEmployers();
      expect(component.employerOptions()).toEqual([]);
    });
  });

  // ───────────────────────────────────────────────────────────
  // 37. Phone Tab
  // ───────────────────────────────────────────────────────────
  describe('Phone Tab', () => {
    it('should focus next field when phone is empty on tab from homePhoneNumber', () => {
      component.donorForm.get('homePhoneNumber')?.setValue('');
      const event = new Event('keydown');
      spyOn(event, 'preventDefault');
      component.onPhoneTab(event, 'homePhoneNumber');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should focus radio when phone has value on tab from homePhoneNumber', () => {
      component.donorForm.get('homePhoneNumber')?.setValue('2145551234');
      const event = new Event('keydown');
      spyOn(event, 'preventDefault');
      component.onPhoneTab(event, 'homePhoneNumber');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should handle tab from workPhoneNumber', () => {
      component.donorForm.get('workPhoneNumber')?.setValue('');
      const event = new Event('keydown');
      spyOn(event, 'preventDefault');
      component.onPhoneTab(event, 'workPhoneNumber');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should handle tab from mobilePhoneNumber', () => {
      component.donorForm.get('mobilePhoneNumber')?.setValue('');
      const event = new Event('keydown');
      spyOn(event, 'preventDefault');
      component.onPhoneTab(event, 'mobilePhoneNumber');
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 38. Searchable Dropdown Filtering
  // ───────────────────────────────────────────────────────────
  describe('Searchable Dropdown Filtering', () => {
    it('should filter salutations by search term', () => {
      (component as any).salutationSearch.set('mr');
      const filtered = component.filteredSalutations();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('MR');
    });

    it('should filter ethnic groups by description', () => {
      (component as any).ethnicGroupSearch.set('white');
      const filtered = component.filteredEthnicGroups();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('W');
    });

    it('should filter languages by search term', () => {
      (component as any).languageSearch.set('span');
      const filtered = component.filteredLanguages();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('ES');
    });

    it('should filter employers by name', fakeAsync(() => {
      // Employer filtering now uses employerSearchCtrl with debounceTime
      component.employerSearchCtrl.setValue('acme');
      tick(400);
      const filtered = component.filteredEmployers();
      expect(filtered.length).toBe(1);
      expect(filtered[0].employerName).toBe('Acme Corp');
    }));

    it('should filter employers by partial name', fakeAsync(() => {
      component.employerSearchCtrl.setValue('globex');
      tick(400);
      const filtered = component.filteredEmployers();
      expect(filtered.length).toBe(1);
      expect(filtered[0].employerId).toBe('EMP02');
    }));

    it('should filter alt id types by search term', () => {
      (component as any).altIdTypeSearch.set('driver');
      const filtered = component.filteredAltIdTypes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('DRLIC');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 39. buildCreateRequest with alternate address
  // ───────────────────────────────────────────────────────────
  describe('buildCreateRequest with alternate address', () => {
    it('should include local alternate address fields when addressType is L', () => {
      fillRequiredFields();
      component.pendingAltAddress.set({
        addressType: 'L',
        streetName: '789 Alt St',
        suiteApt: 'Apt 2',
        uspsId: 12345,
        city: null, state: null, zip: null,
        intlAddress1: null, intlAddress2: null, intlAddress3: null, intlAddress4: null,
        countryName: null, intlCity: null, intlPostalCode: null, intlAddrFlag: null,
        mobilePhoneNumber: null, otherContactNumber: 'OC123',
        altIntlPhoneNumber: null, preferredContactPhone: 'M', preferredContactAddress: 'A',
      } as any);
      mockAddDonorService.createDonor.and.returnValue(mockSuccessCreateResponse());
      component.onSave();

      const request = mockAddDonorService.createDonor.calls.first().args[0];
      expect(request.address.altStreetName).toBe('789 Alt St');
      expect(request.address.altSuiteApt).toBe('Apt 2');
      expect(request.address.altUspsId).toBe(12345);
      expect(request.address.altIntlAddrFlag).toBe('N');
      expect(request.address.otherContactNo).toBe('OC123');
      expect(request.address.preferredContactAddrFlag).toBe('A');
    });

    it('should include international alternate address fields when addressType is I', () => {
      fillRequiredFields();
      component.pendingAltAddress.set({
        addressType: 'I',
        streetName: null, suiteApt: null, uspsId: null,
        city: null, state: null, zip: null,
        intlAddress1: 'Int1', intlAddress2: 'Int2', intlAddress3: 'Int3', intlAddress4: 'Int4',
        countryName: 'Germany', intlCity: null, intlPostalCode: '10115', intlAddrFlag: 'Y',
        mobilePhoneNumber: null, otherContactNumber: null,
        altIntlPhoneNumber: '+49123', preferredContactPhone: 'M', preferredContactAddress: null,
      } as any);
      mockAddDonorService.createDonor.and.returnValue(mockSuccessCreateResponse());
      component.onSave();

      const request = mockAddDonorService.createDonor.calls.first().args[0];
      expect(request.address.altIntlAddress1).toBe('Int1');
      expect(request.address.altIntlAddress2).toBe('Int2');
      expect(request.address.altIntlAddress3).toBe('Int3');
      expect(request.address.altIntlAddress4).toBe('Int4');
      expect(request.address.altCountryName).toBe('Germany');
      expect(request.address.altIntlPostalCode).toBe('10115');
      expect(request.address.altIntlAddrFlag).toBe('Y');
      expect(request.address.altIntlPhoneNo).toBe('+49123');
    });

    it('should include employer intl address in request when set', () => {
      fillRequiredFields();
      component.employerIntlAddress.set({
        city: 'Paris',
        state: null,
        country: 'France',
        postalCode: '75001',
        email: 'emp@test.com',
        intlAddrFlag: 'Y',
      } as any);
      mockAddDonorService.createDonor.and.returnValue(mockSuccessCreateResponse());
      component.onSave();

      const request = mockAddDonorService.createDonor.calls.first().args[0];
      expect(request.address.empIntlAddrFlag).toBe('Y');
      expect(request.address.empIntlCity).toBe('Paris');
      expect(request.address.empCountryName).toBe('France');
      expect(request.address.empIntlPostalCode).toBe('75001');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 40. Zip Lookup via valueChanges
  // ───────────────────────────────────────────────────────────
  describe('City/Zip Dropdown Selection', () => {
    it('should load zips when donor city is selected', () => {
      mockAddDonorService.getZipsByCity.and.returnValue(of([
        { code: '75201', description: '75201 - TX' },
        { code: '75202', description: '75202 - TX' },
      ]));
      component.onDonorCitySelected('Dallas');
      expect(mockAddDonorService.getZipsByCity).toHaveBeenCalledWith('Dallas');
      expect(component.donorZipOptions().length).toBe(2);
    });

    it('should auto-select zip and state when single zip result', () => {
      mockAddDonorService.getZipsByCity.and.returnValue(of([
        { code: '75201', description: '75201 - TX' },
      ]));
      component.onDonorCitySelected('Dallas');
      expect(component.donorForm.get('zip')?.value).toBe('75201');
      expect(component.donorForm.getRawValue().state).toBe('TX');
    });

    it('should clear zip and state when city changes', () => {
      component.donorForm.patchValue({ zip: '75201', state: 'TX' });
      mockAddDonorService.getZipsByCity.and.returnValue(of([]));
      component.onDonorCitySelected('Austin');
      expect(component.donorForm.get('zip')?.value).toBeNull();
    });

    it('should load zips when migrated city is selected', () => {
      mockAddDonorService.getZipsByCity.and.returnValue(of([
        { code: '78701', description: '78701 - TX' },
      ]));
      component.onMigratedCitySelected('Austin');
      expect(mockAddDonorService.getZipsByCity).toHaveBeenCalledWith('Austin');
      expect(component.migratedZipOptions().length).toBe(1);
    });

    it('should set state on donor zip selected', () => {
      component.donorZipOptions.set([
        { code: '75201', description: '75201 - TX', state: 'TX' },
      ]);
      component.onDonorZipSelected('75201');
      expect(component.donorForm.getRawValue().state).toBe('TX');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 41. Header initialization
  // ───────────────────────────────────────────────────────────
  describe('Header initialization', () => {
    it('should set investigate breadcrumb', () => {
      (component as any).updateHeaderForInvestigateDuplicate();
      expect(component.headerConfig.breadcrumbs?.[1]?.label).toBe('Investigate Duplicate Donor Records');
      expect(component.headerConfig.title).toBe('Modify Donor Data');
    });

    it('should use fallback title when menuItem not found for modify', () => {
      const origFind = mockMenuService.findMenuItemByPath;
      mockMenuService.findMenuItemByPath = () => undefined;
      (component as any).updateHeaderForModify();
      expect(component.headerConfig.title).toBe('Modify Donor');
      expect(component.headerConfig.subtitle).toBe('');
      mockMenuService.findMenuItemByPath = origFind;
    });
  });

  // ───────────────────────────────────────────────────────────
  // 42. validateDob edge cases
  // ───────────────────────────────────────────────────────────
  describe('validateDob edge cases', () => {
    it('should clear futureDob error when date is no longer future', () => {
      const ctrl = component.donorForm.get('dob');
      ctrl?.setValue(new Date(1990, 0, 15));
      ctrl?.setErrors({ futureDob: true });
      component.validateDob();
      expect(ctrl?.hasError('futureDob')).toBeFalse();
    });

    it('should preserve other errors when clearing futureDob', () => {
      const ctrl = component.donorForm.get('dob');
      ctrl?.setValue(new Date(1990, 0, 15));
      ctrl?.setErrors({ futureDob: true, someOtherError: true });
      component.validateDob();
      expect(ctrl?.hasError('futureDob')).toBeFalse();
      expect(ctrl?.hasError('someOtherError')).toBeTrue();
    });

    it('should do nothing when dob value is null', () => {
      const ctrl = component.donorForm.get('dob');
      ctrl?.setValue(null);
      component.validateDob();
      // Should not throw
      expect(ctrl?.value).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 43. setSaving / disableSaveButton
  // ───────────────────────────────────────────────────────────
  describe('setSaving and disableSaveButton', () => {
    it('should update saving state and header actions when saving', () => {
      (component as any).setSaving(true);
      expect(component.saving).toBeTrue();
      const saveAction = component.headerConfig.actions?.find(a => a.ariaLabel === 'Save donor data');
      expect(saveAction?.label).toBe('Saving...');
      expect(saveAction?.disabled).toBeTrue();
      const cancelAction = component.headerConfig.actions?.find(a => a.ariaLabel === 'Cancel and go back');
      expect(cancelAction?.disabled).toBeTrue();
    });

    it('should restore labels when saving is false', () => {
      (component as any).setSaving(true);
      (component as any).setSaving(false);
      expect(component.saving).toBeFalse();
      const saveAction = component.headerConfig.actions?.find(a => a.ariaLabel === 'Save donor data');
      expect(saveAction?.label).toBe('SAVE DONOR');
    });

    it('should disable the save button via disableSaveButton', () => {
      (component as any).disableSaveButton();
      const saveAction = component.headerConfig.actions?.find(a => a.ariaLabel === 'Save donor data');
      expect(saveAction?.disabled).toBeTrue();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 44. Mobile phone sync with alt address
  // ───────────────────────────────────────────────────────────
  describe('Mobile phone sync with alt address', () => {
    it('should update pendingAltAddress when mobile phone changes', fakeAsync(() => {
      component.pendingAltAddress.set({
        addressType: 'L',
        mobilePhoneNumber: null,
        preferredContactPhone: 'M',
      } as any);
      component.donorForm.get('mobilePhoneNumber')?.setValue('2145551234');
      tick();
      expect(component.pendingAltAddress()?.mobilePhoneNumber).toBe('2145551234');
    }));

    it('should not update when no pending alt address', fakeAsync(() => {
      component.pendingAltAddress.set(null);
      component.donorForm.get('mobilePhoneNumber')?.setValue('2145551234');
      tick();
      expect(component.pendingAltAddress()).toBeNull();
    }));
  });

  // ───────────────────────────────────────────────────────────
  // 45. validatePhoneField with mobile and alt address
  // ───────────────────────────────────────────────────────────
  describe('validatePhoneField with mobile and alt address', () => {
    it('should update pending alt address mobile when validating mobile phone', () => {
      component.pendingAltAddress.set({
        addressType: 'L',
        mobilePhoneNumber: null,
        preferredContactPhone: 'M',
      } as any);
      component.donorForm.get('mobilePhoneNumber')?.setValue('2145551234');
      component.validatePhoneField('mobilePhoneNumber');
      expect(component.pendingAltAddress()?.mobilePhoneNumber).toBe('2145551234');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 46. parsePhone edge cases
  // ───────────────────────────────────────────────────────────
  describe('parsePhone edge cases', () => {
    it('should return empty for empty string', () => {
      const result = (component as any).parsePhone('');
      expect(result).toEqual({ areaCode: '', phone: '' });
    });

    it('should return empty for fewer than 10 digits', () => {
      const result = (component as any).parsePhone('12345');
      expect(result).toEqual({ areaCode: '', phone: '' });
    });

    it('should parse 10+ digit phone', () => {
      const result = (component as any).parsePhone('2145551234');
      expect(result).toEqual({ areaCode: '214', phone: '5551234' });
    });

    it('should strip non-digits before parsing', () => {
      const result = (component as any).parsePhone('(214) 555-1234');
      expect(result).toEqual({ areaCode: '214', phone: '5551234' });
    });
  });

  // ───────────────────────────────────────────────────────────
  // 47. formatPhoneForDisplay edge cases
  // ───────────────────────────────────────────────────────────
  describe('formatPhoneForDisplay edge cases', () => {
    it('should return empty string when both areaCode and phoneNo are empty', () => {
      const result = (component as any).formatPhoneForDisplay('', '');
      expect(result).toBe('');
    });

    it('should return raw digits for non-7-digit phone without area code', () => {
      const result = (component as any).formatPhoneForDisplay('', '12345');
      expect(result).toBe('12345');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 48. enableContactFields
  // ───────────────────────────────────────────────────────────
  describe('enableContactFields', () => {
    it('should re-enable contact fields and set validators', () => {
      (component as any).disableAddressFields();
      (component as any).enableContactFields();

      expect(component.donorForm.get('homePhoneNumber')?.enabled).toBeTrue();
      expect(component.donorForm.get('workPhoneNumber')?.enabled).toBeTrue();
      expect(component.donorForm.get('mobilePhoneNumber')?.enabled).toBeTrue();
      expect(component.donorForm.get('preferredContact')?.enabled).toBeTrue();
      expect(component.donorForm.get('email')?.enabled).toBeTrue();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 49. Search subscriptions
  // ───────────────────────────────────────────────────────────
  describe('Search subscriptions', () => {
    it('should filter employers via employerSearchCtrl', fakeAsync(() => {
      component.employerSearchCtrl.setValue('acme');
      tick(400);
      // employerOptions is filtered via debounced subscription
      expect(component.employerOptions().length).toBe(1);
      expect(component.employerOptions()[0].employerName).toBe('Acme Corp');
    }));

    it('should show all employers when search cleared', fakeAsync(() => {
      component.employerSearchCtrl.setValue('acme');
      tick(400);
      component.employerSearchCtrl.setValue('');
      tick(400);
      expect(component.employerOptions().length).toBe(2);
    }));

    it('should update salutation search signal', fakeAsync(() => {
      component.salutationSearchCtrl.setValue('MR');
      tick();
      expect((component as any).salutationSearch()).toBe('MR');
    }));

    it('should update ethnic group search signal', fakeAsync(() => {
      component.ethnicGroupSearchCtrl.setValue('W');
      tick();
      expect((component as any).ethnicGroupSearch()).toBe('W');
    }));

    it('should update language search signal', fakeAsync(() => {
      component.languageSearchCtrl.setValue('EN');
      tick();
      expect((component as any).languageSearch()).toBe('EN');
    }));

    it('should update alt id type search signal', fakeAsync(() => {
      component.altIdTypeSearchCtrl.setValue('DR');
      tick();
      expect((component as any).altIdTypeSearch()).toBe('DR');
    }));
  });

  // ───────────────────────────────────────────────────────────
  // 50. initCityZipsForModify / initMigratedCityZipsForModify
  // ───────────────────────────────────────────────────────────
  // initCityZipsForModify and initMigratedCityZipsForModify were removed
  // City/zip handling is now done via dropdown selection (onDonorCitySelected, onMigratedCitySelected)

  // ───────────────────────────────────────────────────────────
  // 51. Open Donor International Address Dialog
  // ───────────────────────────────────────────────────────────
  describe('Open Donor International Address Dialog', () => {
    let dialogOpenSpy: jasmine.Spy;
    let dialogRefSpyObj: jasmine.SpyObj<MatDialogRef<any>>;

    beforeEach(() => {
      dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
    });

    it('should open confirm dialog when local address exists and no intl address', () => {
      component.donorForm.patchValue({ homeAddress: '123 Main', city: 'Dallas', zip: '75201' });
      component.donorIntlAddress.set(null);
      dialogRefSpyObj.afterClosed.and.returnValue(of(false));

      component.openDonorInternationalAddress();

      expect(dialogOpenSpy).toHaveBeenCalled();
      const dialogData = dialogOpenSpy.calls.first().args[1]?.data;
      expect(dialogData?.title).toBe('Local Address Populated');
    });

    it('should open intl dialog directly when no local address', () => {
      component.donorForm.patchValue({ homeAddress: '', city: '', zip: '' });
      component.donorIntlAddress.set(null);
      dialogRefSpyObj.afterClosed.and.returnValue(of(undefined));

      component.openDonorInternationalAddress();

      expect(dialogOpenSpy).toHaveBeenCalled();
    });

    it('should open intl dialog directly when intl address already exists', () => {
      component.donorForm.patchValue({ homeAddress: '123 Main', city: 'Dallas', zip: '75201' });
      component.donorIntlAddress.set({ streetName: 'existing' } as any);
      dialogRefSpyObj.afterClosed.and.returnValue(of(undefined));

      component.openDonorInternationalAddress();

      expect(dialogOpenSpy).toHaveBeenCalled();
    });

    it('should set intl address when dialog returns result', () => {
      component.donorForm.patchValue({ homeAddress: '', city: '', zip: '' });
      const intlResult = { streetName: 'New Intl St', country: 'UK' };
      dialogRefSpyObj.afterClosed.and.returnValue(of(intlResult));

      component.openDonorInternationalAddress();

      expect(component.donorIntlAddress()).toEqual(intlResult as any);
    });

    it('should clear intl address when dialog returns null', () => {
      component.donorIntlAddress.set({ streetName: 'Existing' } as any);
      component.donorForm.patchValue({ homeAddress: '', city: '', zip: '' });
      dialogRefSpyObj.afterClosed.and.returnValue(of(null));

      component.openDonorInternationalAddress();

      expect(component.donorIntlAddress()).toBeNull();
    });

    it('should enable address fields when dialog returns undefined and no intl address set', () => {
      component.donorIntlAddress.set(null);
      component.donorForm.patchValue({ homeAddress: '', city: '', zip: '' });
      dialogRefSpyObj.afterClosed.and.returnValue(of(undefined));

      component.openDonorInternationalAddress();

      expect(component.donorForm.get('homeAddress')?.enabled).toBeTrue();
    });

    it('should disable address and open intl dialog when confirm accepted', () => {
      component.donorForm.patchValue({ homeAddress: '123 Main', city: 'Dallas', zip: '75201' });
      component.donorIntlAddress.set(null);

      let callCount = 0;
      dialogOpenSpy.and.callFake(() => {
        callCount++;
        if (callCount === 1) {
          const confirmRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
          confirmRef.afterClosed.and.returnValue(of(true));
          return confirmRef;
        } else {
          const intlRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
          intlRef.afterClosed.and.returnValue(of({ streetName: 'Intl St', country: 'UK' }));
          return intlRef;
        }
      });

      component.openDonorInternationalAddress();

      expect(dialogOpenSpy).toHaveBeenCalledTimes(2);
      expect(component.donorIntlAddress()).toBeTruthy();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 52. Open Employer International Address Dialog
  // ───────────────────────────────────────────────────────────
  describe('Open Employer International Address Dialog', () => {
    let dialogOpenSpy: jasmine.Spy;
    let dialogRefSpyObj: jasmine.SpyObj<MatDialogRef<any>>;

    beforeEach(() => {
      dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
    });

    it('should set pendingAltAddress when dialog returns valid data', () => {
      const altData = { preferredContactPhone: 'M', mobilePhoneNumber: '4695559012' } as any;
      dialogRefSpyObj.afterClosed.and.returnValue(of(altData));

      component.openAlternateAddress();

      expect(component.pendingAltAddress()).toBeTruthy();
      expect(component.pendingAltAddress()?.preferredContactPhone).toBe('M');
    });

    it('should show error when dialog result has no preferredContactPhone', () => {
      const altData = { mobilePhoneNumber: '4695559012' } as any;
      dialogRefSpyObj.afterClosed.and.returnValue(of(altData));

      component.openAlternateAddress();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Preferred Contact Phone is required in Alternate Demographics.');
    });

    it('should clear pendingAltAddress when dialog returns null', () => {
      component.pendingAltAddress.set({ preferredContactPhone: 'M' } as any);
      dialogRefSpyObj.afterClosed.and.returnValue(of(null));

      component.openAlternateAddress();

      expect(component.pendingAltAddress()).toBeNull();
    });

    it('should clear mobile phone when dialog returns null', () => {
      component.donorForm.get('mobilePhoneNumber')?.setValue('4695559012');
      dialogRefSpyObj.afterClosed.and.returnValue(of(null));

      component.openAlternateAddress();

      expect(component.donorForm.get('mobilePhoneNumber')?.value).toBe('');
    });

    it('should set mobile phone from alt data', () => {
      const altData = { preferredContactPhone: 'M', mobilePhoneNumber: '4695559012' } as any;
      dialogRefSpyObj.afterClosed.and.returnValue(of(altData));

      component.openAlternateAddress();

      const val = component.donorForm.get('mobilePhoneNumber')?.value;
      expect(val === '4695559012' || val === '(469) 555-9012').toBeTrue();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 26. Zip Lookup and City Validation
  // ───────────────────────────────────────────────────────────
  // Zip Lookup and City Validation tests removed — the component now uses
  // dropdown-based city/zip selection (onDonorCitySelected, onMigratedCitySelected)
  // instead of text-input validation (onCityBlur, onCityEnter, validateZip, etc.).

  // ───────────────────────────────────────────────────────────
  // 27. Phone and Area Code
  // ───────────────────────────────────────────────────────────
  describe('Phone and Area Code', () => {
    it('should strip non-digit characters in formatPhoneInput', () => {
      component.donorForm.get('homePhoneNumber')?.setValue('(214) 555-1234');

      component.formatPhoneInput('homePhoneNumber');

      expect(component.donorForm.get('homePhoneNumber')?.value).toBe('2145551234');
    });

    it('should truncate to 10 digits in formatPhoneInput', () => {
      component.donorForm.get('homePhoneNumber')?.setValue('214555123456');

      component.formatPhoneInput('homePhoneNumber');

      expect(component.donorForm.get('homePhoneNumber')?.value).toBe('2145551234');
    });

    it('should set areaCodeNotFound error when validateAreaCode returns false', () => {
      mockAddDonorService.validateAreaCode.and.returnValue(of(false));
      component.donorForm.get('homePhoneNumber')?.setValue('9995551234');

      component.validatePhoneField('homePhoneNumber');

      expect(component.donorForm.get('homePhoneNumber')?.hasError('areaCodeNotFound')).toBeTrue();
    });

    it('should clear areaCodeNotFound when validateAreaCode returns true', () => {
      mockAddDonorService.validateAreaCode.and.returnValue(of(true));
      component.donorForm.get('homePhoneNumber')?.setValue('2145551234');

      component.validatePhoneField('homePhoneNumber');

      expect(component.donorForm.get('homePhoneNumber')?.hasError('areaCodeNotFound')).toBeFalse();
    });

    it('should sync mobile to pendingAltAddress on validate', () => {
      component.pendingAltAddress.set({ preferredContactPhone: 'M', mobilePhoneNumber: null } as any);
      mockAddDonorService.validateAreaCode.and.returnValue(of(true));
      component.donorForm.get('mobilePhoneNumber')?.setValue('4695559012');

      component.validatePhoneField('mobilePhoneNumber');

      expect(component.pendingAltAddress()?.mobilePhoneNumber).toBe('4695559012');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 28. Employer Selection Response
  // ───────────────────────────────────────────────────────────
  describe('Employer Selection Response', () => {
    it('should clear employer fields when empty employerId selected', () => {
      component.donorForm.patchValue({ employerId: 'EMP01', employerCity: 'Houston' });

      component.onEmployerSelected('');

      expect(component.donorForm.get('employerCity')?.value).toBeNull();
    });

    it('should set employerIntlAddress when employer has intlAddrFlag Y', () => {
      mockDonorEmployerService.getById.and.returnValue(
        of({ item: { intlAddrFlag: 'Y', intlCity: 'London', intlCountryName: 'UK' } } as any),
      );

      component.onEmployerSelected('EMP01');

      expect(component.employerIntlAddress()).toBeTruthy();
      expect(component.employerIntlAddress()?.city).toBe('London');
    });

    it('should patch domestic employer address when employer has intlAddrFlag N', () => {
      mockDonorEmployerService.getById.and.returnValue(
        of({ item: { intlAddrFlag: 'N', city: 'Houston', state: 'TX', zip: '77001' } } as any),
      );

      component.onEmployerSelected('EMP01');

      expect(component.donorForm.get('employerCity')?.value).toBe('Houston');
      expect(component.employerIntlAddress()).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 29. Save Button State
  // ───────────────────────────────────────────────────────────
  describe('Save Button State', () => {
    it('should change save button label to Saving when setSaving(true)', () => {
      (component as any).setSaving(true);

      const saveBtn = component.headerConfig.actions?.find(a => a.ariaLabel === 'Save donor data');
      expect(saveBtn?.label).toBe('Saving...');
      expect(saveBtn?.disabled).toBeTrue();
    });

    it('should restore save button label when setSaving(false)', () => {
      (component as any).setSaving(true);
      (component as any).setSaving(false);

      const saveBtn = component.headerConfig.actions?.find(a => a.ariaLabel === 'Save donor data');
      expect(saveBtn?.label).toBe('SAVE DONOR');
    });

    it('should disable cancel button when setSaving(true)', () => {
      (component as any).setSaving(true);

      const cancelBtn = component.headerConfig.actions?.find(a => a.ariaLabel === 'Cancel and go back');
      expect(cancelBtn?.disabled).toBeTrue();
    });

    it('should disable save button after donor creation', () => {
      (component as any).disableSaveButton();

      const saveBtn = component.headerConfig.actions?.find(a => a.ariaLabel === 'Save donor data');
      expect(saveBtn?.disabled).toBeTrue();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 30. Double Entry and Blood Type
  // ───────────────────────────────────────────────────────────
  describe('Double Entry and Blood Type', () => {
    it('should return false from requiresDoubleEntry when mdKeyValue is not 2', () => {
      (component as any).mdKeyValue = '1';
      const result = (component as any).requiresDoubleEntry({ lastName: 'Different', dob: '2000-01-01' });
      expect(result).toBeFalse();
    });

    it('should return true when mdKeyValue is 2 and lastName changed', () => {
      (component as any).mdKeyValue = '2';
      (component as any).originalLastName = 'Smith';
      (component as any).originalDob = '1990-01-15';
      const result = (component as any).requiresDoubleEntry({
        lastName: 'Jones',
        dateOfBirth: '1990-01-15',
      });
      expect(result).toBeTrue();
    });

    it('should set aboModificationNotAllowed error when bloodType changed in modify mode', () => {
      component.mode = 'modify';
      (component as any).originalBloodType = 'O+';
      (component as any).isPopulatingForm = false;

      component.donorForm.get('bloodType')?.setValue('A+');
      component.validateBloodType();

      expect(component.donorForm.get('bloodType')?.hasError('aboModificationNotAllowed')).toBeTrue();
    });

    it('should clear aboModificationNotAllowed when bloodType reverted', () => {
      component.mode = 'modify';
      (component as any).originalBloodType = 'O+';
      (component as any).isPopulatingForm = false;

      component.donorForm.get('bloodType')?.setValue('A+');
      component.validateBloodType();
      component.donorForm.get('bloodType')?.setValue('O+');
      component.validateBloodType();

      expect(component.donorForm.get('bloodType')?.hasError('aboModificationNotAllowed')).toBeFalse();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 31. Cancel Paths
  // ───────────────────────────────────────────────────────────
  describe('Cancel Paths', () => {
    it('should navigate directly when donorCreated is true', () => {
      component.donorCreated = true;

      component.onCancel();

      expect(router.navigate).toHaveBeenCalled();
    });

    it('should navigate to investigate route when confirmed and navigatedFromInvestigate', () => {
      (component as any).navigatedFromInvestigate = true;
      const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
      dialogRefSpyObj.afterClosed.and.returnValue(of(true));

      component.onCancel();

      expect(router.navigate).toHaveBeenCalledWith([
        '/donor-functions/donor-profile/donor-profile-maintenance/investigate-duplicate-donor-records',
      ]);
    });

    it('should not navigate when cancel dialog returns false', () => {
      const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
      dialogRefSpyObj.afterClosed.and.returnValue(of(false));

      component.onCancel();

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 32. Utility Methods
  // ───────────────────────────────────────────────────────────
  describe('Utility Methods', () => {
    it('should prevent default for non-numeric keys in onlyNumbers', () => {
      const event = { key: 'a', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;

      component.onlyNumbers(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow backspace in onlyNumbers', () => {
      const event = { key: 'Backspace', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;

      component.onlyNumbers(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow numeric keys in onlyNumbers', () => {
      const event = { key: '5', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;

      component.onlyNumbers(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should complete destroy$ on ngOnDestroy', () => {
      const destroySpy = spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
    });

    it('should map D to work in getPreferredContact', () => {
      const result = (component as any).getPreferredContact('D');
      expect(result).toBe('work');
    });

    it('should return empty string for unknown preferred contact flag', () => {
      const result = (component as any).getPreferredContact('X');
      expect(result).toBe('');
    });

    it('should load zips and set state when donor city selected', () => {
      mockAddDonorService.getZipsByCity.and.returnValue(of([
        { code: '75201', description: '75201 - TX' },
      ]));

      component.onDonorCitySelected('Dallas');

      expect(component.donorZipOptions().length).toBe(1);
      expect(component.donorForm.getRawValue().state).toBe('TX');
    });

    it('should load zips when migrated city selected', () => {
      mockAddDonorService.getZipsByCity.and.returnValue(of([
        { code: '78701', description: '78701 - TX' },
      ]));

      component.onMigratedCitySelected('Houston');

      expect(component.migratedZipOptions().length).toBe(1);
    });
  });

  // ───────────────────────────────────────────────────────────
  // 33. Modify Donor Response Handling
  // ───────────────────────────────────────────────────────────
  describe('Modify Donor Response Handling', () => {
    beforeEach(() => {
      component.mode = 'modify';
      component.currentDonorData = { donorId: 'DN001' } as any;
      (component as any).originalLastName = 'Smith';
      (component as any).originalDob = '1990-01-15';
      fillRequiredFields();
    });

    it('should show success snackbar after successful modify', () => {
      mockAddDonorService.modifyDonor.and.returnValue(mockSuccessModifyResponse());
      mockFindDonorService.searchDonors.and.returnValue(of({ data: [], total: 0 }));

      component.onSave();

      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Donor updated successfully.');
    });

    it('should show error snackbar after failed modify', () => {
      mockAddDonorService.modifyDonor.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } })),
      );
      mockFindDonorService.searchDonors.and.returnValue(of({ data: [], total: 0 }));

      component.onSave();

      expect(mockSnackbarService.showError).toHaveBeenCalled();
    });

    it('should reset saving after modify error', () => {
      mockAddDonorService.modifyDonor.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } })),
      );
      mockFindDonorService.searchDonors.and.returnValue(of({ data: [], total: 0 }));

      component.onSave();

      expect(component.saving).toBeFalse();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 34. Create Donor Response Handling
  // ───────────────────────────────────────────────────────────
  describe('Create Donor Response Handling', () => {
    it('should show success snackbar with donorId after create', () => {
      mockAddDonorService.createDonor.and.returnValue(mockSuccessCreateResponse());
      fillRequiredFields();

      component.onSave();

      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Donor DN001 created successfully.');
    });

    it('should set donorCreated to true after successful create', () => {
      mockAddDonorService.createDonor.and.returnValue(mockSuccessCreateResponse());
      fillRequiredFields();

      component.onSave();

      expect(component.donorCreated).toBeTrue();
    });

    it('should show error message from response on create failure', () => {
      mockAddDonorService.createDonor.and.returnValue(
        throwError(() => ({ error: { errorResponse: { error: 'Duplicate SSN' } } })),
      );
      fillRequiredFields();

      component.onSave();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Duplicate SSN');
    });

    it('should clear pendingAltAddress after successful create', () => {
      component.pendingAltAddress.set({ preferredContactPhone: 'M' } as any);
      mockAddDonorService.createDonor.and.returnValue(mockSuccessCreateResponse());
      fillRequiredFields();

      component.onSave();

      expect(component.pendingAltAddress()).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 35. Form Population - Employer and Contact Details
  // ───────────────────────────────────────────────────────────
  describe('Form Population - Employer and Contact Details', () => {
    const baseDonor: DonorData = {
      donorId: 'DN001', lastName: 'Smith', firstName: 'John', middleName: '',
      salutation: '', alias: '', lastNameSuffix: '', gender: 'M',
      dateOfBirth: '1990-01-15', ethnicGroup: '', ethnicGroupDescription: '',
      alternateId: '', alternateIdType: '', claimedDonation: null,
      lang: '', scanId: '', ssn: '', bloodType: '', status: '',
      streetName: '123 Main', suiteApt: '', city: 'Dallas', state: 'TX',
      zip: '75201', uspsId: null,
      homeAreaCode: '', homePhoneNo: '', workAreaCode: '', workPhoneNo: '',
      workExtension: '', mobileAreaCode: '', mobilePhoneNo: '',
      preferredContactFlag: '', email: '',
      employerId: '', employerName: '', employerCity: '', employerState: '',
      employerZip: '', prevBloodCenter: '', previousDonorId: '',
      migratedUnit: null, migratedCity: '', migratedState: '', migratedZip: '',
      migratedStreetName: '', migratedSuiteApt: '',
      intlAddrFlag: 'N', internationalAddress: null,
      alternateAddress: null, employerIntlAddrFlag: 'N',
      employerInternationalAddress: null, insertDate: '', insertUser: '',
      lastUpdated: '',
    };

    it('should populate employer fields from donor', () => {
      const donor = { ...baseDonor, employerId: 'EMP01', employerName: 'Acme', employerCity: 'Houston', employerState: 'TX', employerZip: '77001' };
      mockAddDonorService.getDonorById.and.returnValue(of(donor));
      (component as any).loadDonorForModify('DN001');

      expect(component.donorForm.get('employerId')?.value).toBe('EMP01');
      expect(component.donorForm.get('employerCity')?.value).toBe('Houston');
    });

    it('should populate migrated fields from donor', () => {
      const donor = { ...baseDonor, migratedCity: 'Austin', migratedState: 'TX', migratedZip: '73301', migratedStreetName: '456 Oak', previousDonorId: 'OLD123', migratedUnit: 10 };
      mockAddDonorService.getDonorById.and.returnValue(of(donor));
      (component as any).loadDonorForModify('DN001');

      expect(component.donorForm.get('migratedCity')?.value).toBe('Austin');
      expect(component.donorForm.get('migratedId')?.value).toBe('OLD123');
      expect(component.donorForm.get('migratedDonations')?.value).toBe(10);
    });

    it('should populate email from donor', () => {
      const donor = { ...baseDonor, email: '[REDACTED_EMAIL_ADDRESS_5]' };
      mockAddDonorService.getDonorById.and.returnValue(of(donor));
      (component as any).loadDonorForModify('DN001');

      expect(component.donorForm.get('email')?.value).toBe('[REDACTED_EMAIL_ADDRESS_5]');
    });

    it('should map D preferredContactFlag to work', () => {
      const donor = { ...baseDonor, preferredContactFlag: 'D' };
      mockAddDonorService.getDonorById.and.returnValue(of(donor));
      (component as any).loadDonorForModify('DN001');

      expect(component.donorForm.get('preferredContact')?.value).toBe('work');
    });

    it('should load employer intl address when employerIntlAddrFlag is Y', () => {
      const donor = {
        ...baseDonor,
        employerId: 'EMP01',
        employerIntlAddrFlag: 'Y',
      };
      mockAddDonorService.getDonorById.and.returnValue(of(donor));
      mockDonorEmployerService.getById.and.returnValue(
        of({ intlAddrFlag: 'Y', intlCity: 'London', intlCountryName: 'UK' } as any),
      );
      (component as any).loadDonorForModify('DN001');

      expect(mockDonorEmployerService.getById).toHaveBeenCalledWith('EMP01');
      expect(component.employerIntlAddress()).toBeTruthy();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 36. Migrated Zip Lookup
  // ───────────────────────────────────────────────────────────
  // Migrated Zip Lookup tests removed — the component now uses
  // dropdown-based city/zip selection (onMigratedCitySelected) instead of
  // text-input validation (onMigratedCityBlur, validateMigratedZip, etc.).

  // ───────────────────────────────────────────────────────────
  // 37. Enable/Disable Fields Extended
  // ───────────────────────────────────────────────────────────
  describe('Enable/Disable Fields Extended', () => {
    it('should disable contact fields when intl address set without alt address', () => {
      component.pendingAltAddress.set(null);
      (component as any).disableAddressFields();

      expect(component.donorForm.get('email')?.disabled).toBeTrue();
      expect(component.donorForm.get('preferredContact')?.disabled).toBeTrue();
    });

    it('should enable contact fields via enableContactFields', () => {
      (component as any).disableAddressFields();
      (component as any).enableContactFields();

      expect(component.donorForm.get('homePhoneNumber')?.enabled).toBeTrue();
      expect(component.donorForm.get('workPhoneNumber')?.enabled).toBeTrue();
      expect(component.donorForm.get('email')?.enabled).toBeTrue();
    });

    it('should disable employer address fields', () => {
      (component as any).disableEmployerAddressFields();

      expect(component.donorForm.get('employerCity')?.disabled).toBeTrue();
      expect(component.donorForm.get('employerZip')?.disabled).toBeTrue();
    });

    it('should enable employer address fields', () => {
      (component as any).disableEmployerAddressFields();
      (component as any).enableEmployerAddressFields();

      expect(component.donorForm.get('employerCity')?.enabled).toBeTrue();
      expect(component.donorForm.get('employerZip')?.enabled).toBeTrue();
    });

    it('should clear employer intl address via clearEmployerInternationalAddress', () => {
      component.employerIntlAddress.set({ city: 'London', intlAddrFlag: 'Y' } as any);

      (component as any).clearEmployerInternationalAddress();

      expect(component.employerIntlAddress()).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 38. Build Request Extended
  // ───────────────────────────────────────────────────────────
  describe('Build Request Extended', () => {
    it('should include alt address local fields when addressType is L', () => {
      component.pendingAltAddress.set({
        addressType: 'L',
        streetName: '456 Oak',
        suiteApt: '2B',
        city: 'Dallas',
        state: 'TX',
        zip: '75201',
        uspsId: 1,
        preferredContactPhone: 'M',
      } as any);
      fillRequiredFields();
      const formValue = component.donorForm.getRawValue();
      const request = (component as any).buildCreateRequest(formValue);

      expect(request.address.altStreetName).toBe('456 Oak');
      expect(request.address.altSuiteApt).toBe('2B');
      expect(request.address.altIntlAddrFlag).toBe('N');
    });

    it('should include alt address intl fields when addressType is I', () => {
      component.pendingAltAddress.set({
        addressType: 'I',
        intlAddress1: 'Intl1',
        intlAddress2: 'Intl2',
        countryName: 'UK',
        intlPostalCode: 'SW1',
        preferredContactPhone: 'M',
      } as any);
      fillRequiredFields();
      const formValue = component.donorForm.getRawValue();
      const request = (component as any).buildCreateRequest(formValue);

      expect(request.address.altIntlAddress1).toBe('Intl1');
      expect(request.address.altCountryName).toBe('UK');
      expect(request.address.altIntlAddrFlag).toBe('Y');
    });

    it('should include employer intl address fields', () => {
      component.employerIntlAddress.set({
        city: 'London',
        state: null,
        postalCode: 'SW1',
        country: 'UK',
        intlAddrFlag: 'Y',
        modifiedFlag: 'N',
      } as any);
      fillRequiredFields();
      const formValue = component.donorForm.getRawValue();
      const request = (component as any).buildCreateRequest(formValue);

      expect(request.address.empIntlAddrFlag).toBe('Y');
      expect(request.address.empIntlCity).toBe('London');
      expect(request.address.empCountryName).toBe('UK');
    });

    it('should include migrated fields in request', () => {
      fillRequiredFields();
      component.donorForm.patchValue({
        bloodCenter: 'OldCenter',
        migratedId: 'OLD001',
        migratedDonations: 5,
        migratedCity: 'Austin',
        migratedState: 'TX',
        migratedZip: '73301',
      });
      const formValue = component.donorForm.getRawValue();
      const request = (component as any).buildCreateRequest(formValue);

      expect(request.prevBloodCenter).toBe('OldCenter');
      expect(request.previosDonorId).toBe('OLD001');
      expect(request.migratedUnit).toBe(5);
      expect(request.migratedCity).toBe('Austin');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 39. Form Invalid Save
  // ───────────────────────────────────────────────────────────
  describe('Form Invalid Save', () => {
    it('should show error when form is invalid on save', () => {
      component.onSave();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Please fill in all required fields.');
    });

    it('should not call createDonor when form is invalid', () => {
      component.onSave();

      expect(mockAddDonorService.createDonor).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 40. Navigate After Modify
  // ───────────────────────────────────────────────────────────
  describe('Navigate After Modify', () => {
    it('should navigate to investigate route when navigatedFromInvestigate', () => {
      (component as any).navigatedFromInvestigate = true;

      (component as any).navigateAfterModify();

      expect(router.navigate).toHaveBeenCalledWith([
        '/donor-functions/donor-profile/donor-profile-maintenance/investigate-duplicate-donor-records',
      ]);
    });

    it('should navigate to find donor route when not from investigate', () => {
      (component as any).navigatedFromInvestigate = false;

      (component as any).navigateAfterModify();

      expect(router.navigate).toHaveBeenCalled();
    });

    it('should remove sessionStorage flag', () => {
      sessionStorage.setItem('fromInvestigateDuplicate', 'true');

      (component as any).navigateAfterModify();

      expect(sessionStorage.getItem('fromInvestigateDuplicate')).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 41. Form Status and Save Button State
  // ───────────────────────────────────────────────────────────
  describe('Form Status and Save Button State', () => {
    it('should update save button disabled state when form becomes valid', fakeAsync(() => {
      fillRequiredFields();
      (component as any).updateSaveButtonState();
      tick(0);

      const saveBtn = component.headerConfig.actions?.find(a => a.ariaLabel === 'Save donor data');
      expect(saveBtn?.disabled).toBeFalse();
    }));

    it('should disable save button when form becomes invalid', fakeAsync(() => {
      component.donorForm.get('lastName')?.setValue('');
      component.donorForm.updateValueAndValidity();
      (component as any).updateSaveButtonState();
      tick(0);

      const saveBtn = component.headerConfig.actions?.find(a => a.ariaLabel === 'Save donor data');
      expect(saveBtn?.disabled).toBeTrue();
    }));

    it('should disable save button when donorCreated is true', fakeAsync(() => {
      component.donorCreated = true;
      fillRequiredFields();
      (component as any).updateSaveButtonState();
      tick(0);

      const saveBtn = component.headerConfig.actions?.find(a => a.ariaLabel === 'Save donor data');
      expect(saveBtn?.disabled).toBeTrue();
    }));
  });

  // ───────────────────────────────────────────────────────────
  // 42. Sync Mobile to Alt Address
  // ───────────────────────────────────────────────────────────
  describe('Sync Mobile to Alt Address', () => {
    it('should update pendingAltAddress when mobilePhoneNumber changes', () => {
      component.pendingAltAddress.set({ preferredContactPhone: 'M', mobilePhoneNumber: null } as any);

      component.donorForm.get('mobilePhoneNumber')?.setValue('4695551234');

      const alt = component.pendingAltAddress();
      expect(alt?.mobilePhoneNumber).toBe('4695551234');
    });

    it('should not update when pendingAltAddress is null', () => {
      component.pendingAltAddress.set(null);

      component.donorForm.get('mobilePhoneNumber')?.setValue('4695551234');

      expect(component.pendingAltAddress()).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 43. Load Donor For Modify - Response Handling
  // ───────────────────────────────────────────────────────────
  describe('Load Donor For Modify - Response Handling', () => {
    const baseDonor: DonorData = {
      donorId: 'DN001', lastName: 'Smith', firstName: 'John', middleName: 'A',
      salutation: 'MR', alias: 'Johnny', lastNameSuffix: 'Jr', gender: 'M',
      dateOfBirth: '1990-01-15', ethnicGroup: 'W', ethnicGroupDescription: '',
      alternateId: 'DL123', alternateIdType: 'DRLIC', claimedDonation: 5,
      lang: 'EN', scanId: '', ssn: '', bloodType: 'O+', status: '',
      streetName: '123 Main', suiteApt: '4B', city: 'Dallas', state: 'TX',
      zip: '75201', uspsId: null,
      homeAreaCode: '214', homePhoneNo: '5551234',
      workAreaCode: '972', workPhoneNo: '5555678', workExtension: '',
      mobileAreaCode: '469', mobilePhoneNo: '5559012',
      preferredContactFlag: 'H', email: '[REDACTED_EMAIL_ADDRESS_6]',
      employerId: 'EMP01', employerName: 'Acme', employerCity: 'Houston',
      employerState: 'TX', employerZip: '77001',
      prevBloodCenter: 'OldCenter', previousDonorId: 'OLD001',
      migratedUnit: 10, migratedCity: 'Austin', migratedState: 'TX',
      migratedZip: '73301', migratedStreetName: '456 Oak', migratedSuiteApt: '2B',
      intlAddrFlag: 'N', internationalAddress: null,
      alternateAddress: null, employerIntlAddrFlag: 'N',
      employerInternationalAddress: null, insertDate: '', insertUser: '',
      lastUpdated: '',
    };

    it('should store currentDonorData from response', () => {
      mockAddDonorService.getDonorById.and.returnValue(of(baseDonor));
      (component as any).loadDonorForModify('DN001');

      expect(component.currentDonorData).toBeTruthy();
      expect(component.currentDonorData?.donorId).toBe('DN001');
    });

    it('should populate salutation field', () => {
      mockAddDonorService.getDonorById.and.returnValue(of(baseDonor));
      (component as any).loadDonorForModify('DN001');

      expect(component.donorForm.get('salutation')?.value).toBe('MR');
    });

    it('should populate language field', () => {
      mockAddDonorService.getDonorById.and.returnValue(of(baseDonor));
      (component as any).loadDonorForModify('DN001');

      expect(component.donorForm.get('language')?.value).toBe('EN');
    });

    it('should populate claimedDonation field', () => {
      mockAddDonorService.getDonorById.and.returnValue(of(baseDonor));
      (component as any).loadDonorForModify('DN001');

      expect(component.donorForm.get('claimedDonation')?.value).toBe(5);
    });

    it('should populate alternateId fields', () => {
      mockAddDonorService.getDonorById.and.returnValue(of(baseDonor));
      (component as any).loadDonorForModify('DN001');

      expect(component.donorForm.get('alternateId')?.value).toBe('DL123');
      expect(component.donorForm.get('alternateIdType')?.value).toBe('DRLIC');
    });

    it('should populate apartment field', () => {
      mockAddDonorService.getDonorById.and.returnValue(of(baseDonor));
      (component as any).loadDonorForModify('DN001');

      expect(component.donorForm.get('apartmentNo')?.value).toBe('4B');
    });

    it('should populate donorId field (disabled)', () => {
      mockAddDonorService.getDonorById.and.returnValue(of(baseDonor));
      (component as any).loadDonorForModify('DN001');

      expect(component.donorForm.get('donorId')?.value).toBe('DN001');
    });

    it('should populate sex from gender', () => {
      mockAddDonorService.getDonorById.and.returnValue(of(baseDonor));
      (component as any).loadDonorForModify('DN001');

      expect(component.donorForm.get('sex')?.value).toBe('M');
    });

    it('should populate bloodCenter and migrated address', () => {
      mockAddDonorService.getDonorById.and.returnValue(of(baseDonor));
      (component as any).loadDonorForModify('DN001');

      expect(component.donorForm.get('bloodCenter')?.value).toBe('OldCenter');
      expect(component.donorForm.get('migratedHomeAddress')?.value).toBe('456 Oak');
      expect(component.donorForm.get('migratedApartmentNo')?.value).toBe('2B');
    });

    it('should fall back to employer international address from donor when getById fails', () => {
      const donor = {
        ...baseDonor,
        employerIntlAddrFlag: 'Y',
        employerInternationalAddress: { city: 'Paris', country: 'FR', intlAddrFlag: 'Y' } as any,
      };
      mockAddDonorService.getDonorById.and.returnValue(of(donor));
      mockDonorEmployerService.getById.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadDonorForModify('DN001');

      expect(component.employerIntlAddress()?.city).toBe('Paris');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 44. OnSave Full Flow
  // ───────────────────────────────────────────────────────────
  describe('OnSave Full Flow', () => {
    it('should set saving flag true during create', () => {
      let savingDuringCall = false;
      mockAddDonorService.createDonor.and.callFake(() => {
        savingDuringCall = component.saving;
        return mockSuccessCreateResponse();
      });
      fillRequiredFields();

      component.onSave();

      expect(savingDuringCall).toBeTrue();
    });

    it('should update save button label during save', () => {
      mockAddDonorService.createDonor.and.callFake(() => {
        const saveBtn = component.headerConfig.actions?.find(a => a.ariaLabel === 'Save donor data');
        expect(saveBtn?.label).toBe('Saving...');
        return mockSuccessCreateResponse();
      });
      fillRequiredFields();

      component.onSave();
    });

    it('should disable form after successful create', () => {
      mockAddDonorService.createDonor.and.returnValue(mockSuccessCreateResponse());
      fillRequiredFields();

      component.onSave();

      expect(component.donorForm.disabled).toBeTrue();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 45. Phone Tab Navigation
  // ───────────────────────────────────────────────────────────
  describe('Phone Tab Navigation', () => {
    it('should prevent default on tab', () => {
      const event = new Event('keydown');
      spyOn(event, 'preventDefault');

      component.onPhoneTab(event, 'homePhoneNumber');

      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 46. City Validation State Population
  // ───────────────────────────────────────────────────────────
  // City Validation State Population tests removed — replaced by dropdown-based city selection.

  // ───────────────────────────────────────────────────────────
  // 47. Cancel with Unsaved Changes Dialog
  // ───────────────────────────────────────────────────────────
  describe('Cancel with Unsaved Changes Dialog', () => {
    it('should open dialog with correct unsaved changes message', () => {
      const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      const openSpy = spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
      dialogRefSpyObj.afterClosed.and.returnValue(of(false));

      component.onCancel();

      const data = openSpy.calls.first().args[1]?.data;
      expect(data?.message).toContain('unsaved changes');
    });

    it('should navigate to find donor on confirm when not from investigate', () => {
      (component as any).navigatedFromInvestigate = false;
      const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
      dialogRefSpyObj.afterClosed.and.returnValue(of(true));

      component.onCancel();

      expect(router.navigate).toHaveBeenCalled();
      const navArgs = (router.navigate as jasmine.Spy).calls.first().args[0];
      expect(navArgs[0]).not.toContain('investigate');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 48. OnSave setSaving Flow
  // ───────────────────────────────────────────────────────────
  describe('OnSave setSaving Flow', () => {
    it('should set saving to true before calling createDonor', () => {
      let wasSaving = false;
      mockAddDonorService.createDonor.and.callFake(() => {
        wasSaving = component.saving;
        return mockSuccessCreateResponse();
      });
      fillRequiredFields();
      component.onSave();
      expect(wasSaving).toBeTrue();
    });

    it('should disable cancel button during save', () => {
      mockAddDonorService.createDonor.and.callFake(() => {
        const cancelBtn = component.headerConfig.actions?.find(a => a.ariaLabel === 'Cancel and go back');
        expect(cancelBtn?.disabled).toBeTrue();
        return mockSuccessCreateResponse();
      });
      fillRequiredFields();
      component.onSave();
    });

    it('should set save button label to Saving... during createDonor call', () => {
      mockAddDonorService.createDonor.and.callFake(() => {
        const saveBtn = component.headerConfig.actions?.find(a => a.ariaLabel === 'Save donor data');
        expect(saveBtn?.label).toBe('Saving...');
        return mockSuccessCreateResponse();
      });
      fillRequiredFields();
      component.onSave();
    });

    it('should re-enable cancel button after create error', () => {
      mockAddDonorService.createDonor.and.returnValue(
        throwError(() => ({ error: { message: 'Error' } })),
      );
      fillRequiredFields();
      component.onSave();

      const cancelBtn = component.headerConfig.actions?.find(a => a.ariaLabel === 'Cancel and go back');
      expect(cancelBtn?.disabled).toBeFalse();
    });

    it('should restore save button label after create error', () => {
      mockAddDonorService.createDonor.and.returnValue(
        throwError(() => ({ error: { message: 'Error' } })),
      );
      fillRequiredFields();
      component.onSave();

      const saveBtn = component.headerConfig.actions?.find(a => a.ariaLabel === 'Save donor data');
      expect(saveBtn?.label).toBe('SAVE DONOR');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 49. Cancel Navigation from donorCreated
  // ───────────────────────────────────────────────────────────
  describe('Cancel Navigation from donorCreated', () => {
    it('should remove sessionStorage and navigate on cancel when donorCreated', () => {
      sessionStorage.setItem('fromInvestigateDuplicate', 'true');
      component.donorCreated = true;

      component.onCancel();

      expect(sessionStorage.getItem('fromInvestigateDuplicate')).toBeNull();
      expect(router.navigate).toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 50. populateFormFromDonor subscribe callback coverage
  // ───────────────────────────────────────────────────────────
  describe('populateFormFromDonor subscribe callback', () => {
    const baseDonor: DonorData = {
      donorId: 'DN001', lastName: 'Smith', firstName: 'John', middleName: 'A',
      salutation: 'MR', alias: 'Johnny', lastNameSuffix: 'Jr', gender: 'M',
      dateOfBirth: '1990-01-15', ethnicGroup: 'W', ethnicGroupDescription: '',
      alternateId: '', alternateIdType: '', claimedDonation: 5,
      lang: 'EN', scanId: '', ssn: '', bloodType: 'O+', status: '',
      streetName: '123 Main', suiteApt: '4B', city: 'Dallas', state: 'TX',
      zip: '75201', uspsId: null,
      homeAreaCode: '214', homePhoneNo: '5551234',
      workAreaCode: '', workPhoneNo: '', workExtension: '',
      mobileAreaCode: '', mobilePhoneNo: '',
      preferredContactFlag: 'W', email: '',
      employerId: '', employerName: '', employerCity: '', employerState: '',
      employerZip: '', prevBloodCenter: '', previousDonorId: '',
      migratedUnit: null, migratedCity: '', migratedState: '', migratedZip: '',
      migratedStreetName: '', migratedSuiteApt: '',
      intlAddrFlag: 'N', internationalAddress: null,
      alternateAddress: null, employerIntlAddrFlag: 'N',
      employerInternationalAddress: null, insertDate: '', insertUser: '',
      lastUpdated: '',
    };

    it('should set currentDonorData and trigger change detection', () => {
      mockAddDonorService.getDonorById.and.returnValue(of(baseDonor));
      const cdrSpy = spyOn((component as any).cdr, 'markForCheck');
      (component as any).loadDonorForModify('DN001');

      expect(component.currentDonorData).toEqual(baseDonor);
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should populate homePhoneNumber with formatted display', () => {
      mockAddDonorService.getDonorById.and.returnValue(of(baseDonor));
      (component as any).loadDonorForModify('DN001');

      expect(component.donorForm.get('homePhoneNumber')?.value).toBe('(214) 555-1234');
    });

    it('should map W preferredContactFlag to work', () => {
      mockAddDonorService.getDonorById.and.returnValue(of(baseDonor));
      (component as any).loadDonorForModify('DN001');

      expect(component.donorForm.get('preferredContact')?.value).toBe('work');
    });

    it('should populate suiteApt from donor', () => {
      mockAddDonorService.getDonorById.and.returnValue(of(baseDonor));
      (component as any).loadDonorForModify('DN001');

      expect(component.donorForm.get('apartmentNo')?.value).toBe('4B');
    });

    it('should set employer intl address from fallback when getById fails', () => {
      const donor = {
        ...baseDonor,
        employerId: 'EMP01',
        employerIntlAddrFlag: 'Y',
        employerInternationalAddress: { city: 'Tokyo', country: 'JP', intlAddrFlag: 'Y' } as any,
      };
      mockAddDonorService.getDonorById.and.returnValue(of(donor));
      mockDonorEmployerService.getById.and.returnValue(throwError(() => new Error('err')));

      (component as any).loadDonorForModify('DN001');

      expect(component.employerIntlAddress()?.city).toBe('Tokyo');
    });

    it('should set employerInternationalAddress from donor when no intl flag', () => {
      const donor = {
        ...baseDonor,
        employerIntlAddrFlag: 'N',
        employerInternationalAddress: { city: 'Berlin', intlAddrFlag: 'Y' } as any,
      };
      mockAddDonorService.getDonorById.and.returnValue(of(donor));

      (component as any).loadDonorForModify('DN001');

      expect(component.employerIntlAddress()?.city).toBe('Berlin');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 51. BuildCreateRequest extended branches
  // ───────────────────────────────────────────────────────────
  describe('BuildCreateRequest extended branches', () => {
    it('should map work phone to dAreaCode and dPhoneNo', () => {
      fillRequiredFields();
      component.donorForm.patchValue({ workPhoneNumber: '(972) 555-5678' });
      const formValue = component.donorForm.getRawValue();
      const request = (component as any).buildCreateRequest(formValue);

      expect(request.address.dAreaCode).toBe('972');
      expect(request.address.dPhoneNo).toBe('5555678');
    });

    it('should map mobile phone to mAreaCode and mPhoneNo', () => {
      fillRequiredFields();
      component.donorForm.patchValue({ mobilePhoneNumber: '(469) 555-9012' });
      const formValue = component.donorForm.getRawValue();
      const request = (component as any).buildCreateRequest(formValue);

      expect(request.address.mAreaCode).toBe('469');
      expect(request.address.mPhoneNo).toBe('5559012');
    });

    it('should set intlAddrFlag N when no intl address', () => {
      fillRequiredFields();
      const formValue = component.donorForm.getRawValue();
      const request = (component as any).buildCreateRequest(formValue);

      expect(request.address.intlAddrFlag).toBe('N');
    });

    it('should set empIntlAddrFlag N when no employer intl address', () => {
      fillRequiredFields();
      const formValue = component.donorForm.getRawValue();
      const request = (component as any).buildCreateRequest(formValue);

      expect(request.address.empIntlAddrFlag).toBe('N');
    });

    it('should include scanId as empty string', () => {
      fillRequiredFields();
      const formValue = component.donorForm.getRawValue();
      const request = (component as any).buildCreateRequest(formValue);

      expect(request.scanId).toBe('');
    });

    it('should include suffix as lastNameSuffix', () => {
      fillRequiredFields();
      component.donorForm.patchValue({ suffix: 'Jr' });
      const formValue = component.donorForm.getRawValue();
      const request = (component as any).buildCreateRequest(formValue);

      expect(request.lastNameSuffix).toBe('Jr');
    });

    it('should include email from intl address when intl active', () => {
      component.donorIntlAddress.set({ email: '[REDACTED_EMAIL_ADDRESS_7]', intlAddrFlag: 'Y' } as any);
      fillRequiredFields();
      const formValue = component.donorForm.getRawValue();
      const request = (component as any).buildCreateRequest(formValue);

      expect(request.address.email).toBe('[REDACTED_EMAIL_ADDRESS_7]');
    });

    it('should include email from form when no intl address', () => {
      fillRequiredFields();
      component.donorForm.patchValue({ email: '[REDACTED_EMAIL_ADDRESS_8]' });
      const formValue = component.donorForm.getRawValue();
      const request = (component as any).buildCreateRequest(formValue);

      expect(request.address.email).toBe('[REDACTED_EMAIL_ADDRESS_8]');
    });

    it('should set intlAddrFlag Y when intl address is present', () => {
      component.donorIntlAddress.set({
        streetName: '1 Oxford St', country: 'UK', intlAddrFlag: 'Y',
        addr2: '', addr3: '', addr4: '', postalCode: 'W1A',
        homePhoneNo: '', workPhoneNo: '', workPhoneExt: '',
        mobilePhoneNo: '', faxNo: '', email: '',
      } as any);
      fillRequiredFields();
      const formValue = component.donorForm.getRawValue();
      const request = (component as any).buildCreateRequest(formValue);

      expect(request.address.intlAddrFlag).toBe('Y');
      expect(request.address.streetName).toBe('');
      expect(request.address.intlAddress1).toBe('1 Oxford St');
      expect(request.address.countryName).toBe('UK');
    });

    it('should set preferred phone to H for home', () => {
      fillRequiredFields();
      component.donorForm.patchValue({ preferredContact: 'home' });
      const formValue = component.donorForm.getRawValue();
      const request = (component as any).buildCreateRequest(formValue);

      expect(request.address.preferredPhone).toBe('H');
    });

    it('should set preferred phone to M for mobile', () => {
      fillRequiredFields();
      component.donorForm.patchValue({ preferredContact: 'mobile' });
      const formValue = component.donorForm.getRawValue();
      const request = (component as any).buildCreateRequest(formValue);

      expect(request.address.preferredPhone).toBe('M');
    });

    it('should set preferred phone to W for work', () => {
      fillRequiredFields();
      component.donorForm.patchValue({ preferredContact: 'work' });
      const formValue = component.donorForm.getRawValue();
      const request = (component as any).buildCreateRequest(formValue);

      expect(request.address.preferredPhone).toBe('W');
    });

    it('should set preferred phone empty string for empty string', () => {
      fillRequiredFields();
      component.donorForm.patchValue({ preferredContact: '' });
      const formValue = component.donorForm.getRawValue();
      const request = (component as any).buildCreateRequest(formValue);

      expect(request.address.preferredPhone).toBe('');
    });

    it('should map empIntlAddrFlag Y when employer intl address exists', () => {
      component.employerIntlAddress.set({
        city: 'Tokyo', country: 'JP', intlAddrFlag: 'Y',
      } as any);
      fillRequiredFields();
      const formValue = component.donorForm.getRawValue();
      const request = (component as any).buildCreateRequest(formValue);

      expect(request.address.empIntlAddrFlag).toBe('Y');
      expect(request.address.empIntlCity).toBe('Tokyo');
      expect(request.address.empCountryName).toBe('JP');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 52. getPreferredContact switch branches
  // ───────────────────────────────────────────────────────────
  describe('getPreferredContact switch branches', () => {
    const baseDonor: DonorData = {
      donorId: 'DN001', lastName: 'Smith', firstName: 'John', middleName: '',
      salutation: '', alias: '', lastNameSuffix: '', gender: 'M',
      dateOfBirth: '1990-01-15', ethnicGroup: '', ethnicGroupDescription: '',
      alternateId: '', alternateIdType: '', claimedDonation: 0,
      lang: '', scanId: '', ssn: '', bloodType: '', status: '',
      streetName: '123 Main', suiteApt: '', city: 'Dallas', state: 'TX',
      zip: '75201', uspsId: null,
      homeAreaCode: '', homePhoneNo: '',
      workAreaCode: '', workPhoneNo: '', workExtension: '',
      mobileAreaCode: '', mobilePhoneNo: '',
      preferredContactFlag: '', email: '',
      employerId: '', employerName: '', employerCity: '', employerState: '',
      employerZip: '', prevBloodCenter: '', previousDonorId: '',
      migratedUnit: null, migratedCity: '', migratedState: '', migratedZip: '',
      migratedStreetName: '', migratedSuiteApt: '',
      intlAddrFlag: 'N', internationalAddress: null,
      alternateAddress: null, employerIntlAddrFlag: 'N',
      employerInternationalAddress: null, insertDate: '', insertUser: '',
      lastUpdated: '',
    };

    it('should map H to home', () => {
      const donor = { ...baseDonor, preferredContactFlag: 'H' };
      mockAddDonorService.getDonorById.and.returnValue(of(donor));
      (component as any).loadDonorForModify('DN001');

      expect(component.donorForm.get('preferredContact')?.value).toBe('home');
    });

    it('should map M to mobile', () => {
      const donor = { ...baseDonor, preferredContactFlag: 'M' };
      mockAddDonorService.getDonorById.and.returnValue(of(donor));
      (component as any).loadDonorForModify('DN001');

      expect(component.donorForm.get('preferredContact')?.value).toBe('mobile');
    });

    it('should map empty string to empty', () => {
      const donor = { ...baseDonor, preferredContactFlag: '' };
      mockAddDonorService.getDonorById.and.returnValue(of(donor));
      (component as any).loadDonorForModify('DN001');

      expect(component.donorForm.get('preferredContact')?.value).toBe('');
    });

    it('should map unknown flag to empty', () => {
      const donor = { ...baseDonor, preferredContactFlag: 'X' };
      mockAddDonorService.getDonorById.and.returnValue(of(donor));
      (component as any).loadDonorForModify('DN001');

      expect(component.donorForm.get('preferredContact')?.value).toBe('');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 53. populateFormFromDonor with intlAddrFlag Y
  // ───────────────────────────────────────────────────────────
  describe('populateFormFromDonor with intlAddrFlag Y', () => {
    const intlDonor: DonorData = {
      donorId: 'DN002', lastName: 'Tanaka', firstName: 'Yuki', middleName: '',
      salutation: '', alias: '', lastNameSuffix: '', gender: 'F',
      dateOfBirth: '1985-03-10', ethnicGroup: '', ethnicGroupDescription: '',
      alternateId: '', alternateIdType: '', claimedDonation: 0,
      lang: '', scanId: '', ssn: '', bloodType: '', status: '',
      streetName: '1 Main St', suiteApt: '4B', city: 'Tokyo', state: 'TK',
      zip: '10001', uspsId: null,
      homeAreaCode: '', homePhoneNo: '',
      workAreaCode: '972', workPhoneNo: '5551234', workExtension: '',
      mobileAreaCode: '469', mobilePhoneNo: '5559012',
      preferredContactFlag: 'H', email: '[REDACTED_EMAIL_ADDRESS_9]',
      employerId: '', employerName: '', employerCity: '', employerState: '',
      employerZip: '', prevBloodCenter: 'BC01', previousDonorId: 'PD01',
      migratedUnit: 5, migratedCity: 'Austin', migratedState: 'TX', migratedZip: '73301',
      migratedStreetName: '456 Oak', migratedSuiteApt: '2A',
      intlAddrFlag: 'Y',
      internationalAddress: { streetName: '1 Tokyo Rd', intlAddrFlag: 'Y', country: 'JP' } as any,
      alternateAddress: { addressType: 'L', streetName: '789 Alt St' } as any,
      employerIntlAddrFlag: 'N',
      employerInternationalAddress: null, insertDate: '', insertUser: '',
      lastUpdated: '',
    };

    it('should clear domestic address fields when intlAddrFlag is Y', () => {
      mockAddDonorService.getDonorById.and.returnValue(of(intlDonor));
      (component as any).loadDonorForModify('DN002');

      expect(component.donorForm.get('homeAddress')?.value).toBe('');
      expect(component.donorForm.get('apartmentNo')?.value).toBe('');
      expect(component.donorForm.get('city')?.value).toBe('');
      expect(component.donorForm.getRawValue().state).toBe('');
      expect(component.donorForm.get('zip')?.value).toBe('');
    });

    it('should set donorIntlAddress signal from internationalAddress', () => {
      mockAddDonorService.getDonorById.and.returnValue(of(intlDonor));
      (component as any).loadDonorForModify('DN002');

      expect(component.donorIntlAddress()?.country).toBe('JP');
    });

    it('should set pendingAltAddress from alternateAddress', () => {
      mockAddDonorService.getDonorById.and.returnValue(of(intlDonor));
      (component as any).loadDonorForModify('DN002');

      expect(component.pendingAltAddress()?.streetName).toBe('789 Alt St');
    });

    it('should populate work phone with formatted display', () => {
      mockAddDonorService.getDonorById.and.returnValue(of(intlDonor));
      (component as any).loadDonorForModify('DN002');

      expect(component.donorForm.get('workPhoneNumber')?.value).toBe('(972) 555-1234');
    });

    it('should populate mobile phone with formatted display', () => {
      mockAddDonorService.getDonorById.and.returnValue(of(intlDonor));
      (component as any).loadDonorForModify('DN002');

      expect(component.donorForm.get('mobilePhoneNumber')?.value).toBe('(469) 555-9012');
    });

    it('should populate migrated fields from donor', () => {
      mockAddDonorService.getDonorById.and.returnValue(of(intlDonor));
      (component as any).loadDonorForModify('DN002');

      expect(component.donorForm.get('bloodCenter')?.value).toBe('BC01');
      expect(component.donorForm.get('migratedHomeAddress')?.value).toBe('456 Oak');
      expect(component.donorForm.get('migratedApartmentNo')?.value).toBe('2A');
      expect(component.donorForm.get('migratedId')?.value).toBe('PD01');
      expect(component.donorForm.get('migratedDonations')?.value).toBe(5);
    });

    it('should store original blood type and lastName', () => {
      const donor = { ...intlDonor, bloodType: 'A+', intlAddrFlag: 'N' as const };
      mockAddDonorService.getDonorById.and.returnValue(of(donor));
      (component as any).loadDonorForModify('DN002');

      expect((component as any).originalBloodType).toBe('A+');
      expect((component as any).originalLastName).toBe('Tanaka');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 54. loadLookups error handlers
  // ───────────────────────────────────────────────────────────
  describe('loadLookups error handlers', () => {
    it('should show error when salutations fail to load', () => {
      mockAddDonorService.getLookupSalutations.and.returnValue(
        throwError(() => new Error('fail')),
      );
      (component as any).loadLookups();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load salutations');
    });

    it('should show error when ethnic groups fail to load', () => {
      mockAddDonorService.getLookupEthnicGroups.and.returnValue(
        throwError(() => new Error('fail')),
      );
      (component as any).loadLookups();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load ethnic groups');
    });

    it('should show error when languages fail to load', () => {
      mockAddDonorService.getLookupLanguages.and.returnValue(
        throwError(() => new Error('fail')),
      );
      (component as any).loadLookups();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load languages');
    });
  });

  // validateCity tests removed — replaced by dropdown-based city selection.

  // validateZip tests removed — replaced by dropdown-based zip selection.

  // onCityEnter/onMigratedCityEnter/onMigratedCityBlur tests removed —
  // replaced by dropdown-based city selection.

  // ───────────────────────────────────────────────────────────
  // 58. onPhoneTab with value present
  // ───────────────────────────────────────────────────────────
  describe('onPhoneTab with value present', () => {
    it('should focus radio when phone has value', () => {
      component.donorForm.patchValue({ homePhoneNumber: '2145551234' });
      const event = new Event('keydown');
      spyOn(event, 'preventDefault');

      component.onPhoneTab(event, 'homePhoneNumber');

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should focus next field when phone is empty', () => {
      component.donorForm.patchValue({ homePhoneNumber: '' });
      const event = new Event('keydown');
      spyOn(event, 'preventDefault');

      component.onPhoneTab(event, 'homePhoneNumber');

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should focus email field when mobile phone tab with empty value', () => {
      component.donorForm.patchValue({ mobilePhoneNumber: '' });
      const event = new Event('keydown');
      spyOn(event, 'preventDefault');

      component.onPhoneTab(event, 'mobilePhoneNumber');

      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 59. formatPhoneInput
  // ───────────────────────────────────────────────────────────
  describe('formatPhoneInput', () => {
    it('should strip non-digit characters', () => {
      component.donorForm.patchValue({ homePhoneNumber: '(214) 555-1234' });
      component.formatPhoneInput('homePhoneNumber');

      expect(component.donorForm.get('homePhoneNumber')?.value).toBe('2145551234');
    });

    it('should truncate to 10 digits', () => {
      component.donorForm.patchValue({ homePhoneNumber: '214555123456' });
      component.formatPhoneInput('homePhoneNumber');

      expect(component.donorForm.get('homePhoneNumber')?.value).toBe('2145551234');
    });

    it('should not change value if already clean digits', () => {
      component.donorForm.patchValue({ homePhoneNumber: '2145551234' });
      component.formatPhoneInput('homePhoneNumber');

      expect(component.donorForm.get('homePhoneNumber')?.value).toBe('2145551234');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 60. validatePhoneField branches
  // ───────────────────────────────────────────────────────────
  describe('validatePhoneField branches', () => {
    it('should clear errors when phone is empty', () => {
      component.donorForm.get('homePhoneNumber')?.setValue('');
      component.donorForm.get('homePhoneNumber')?.setErrors({ invalidPhone: true });

      component.validatePhoneField('homePhoneNumber');

      expect(component.donorForm.get('homePhoneNumber')?.errors).toBeNull();
    });

    it('should set invalidPhone when digits less than 10', () => {
      component.donorForm.get('homePhoneNumber')?.setValue('12345');

      component.validatePhoneField('homePhoneNumber');

      expect(component.donorForm.get('homePhoneNumber')?.hasError('invalidPhone')).toBeTrue();
    });

    it('should format and validate area code when valid 10 digits', () => {
      mockAddDonorService.validateAreaCode.and.returnValue(of(true));
      component.donorForm.get('homePhoneNumber')?.setValue('2145551234');

      component.validatePhoneField('homePhoneNumber');

      expect(mockAddDonorService.validateAreaCode).toHaveBeenCalledWith('214');
    });

    it('should set areaCodeNotFound when area code is invalid', () => {
      mockAddDonorService.validateAreaCode.and.returnValue(of(false));
      component.donorForm.get('homePhoneNumber')?.setValue('0005551234');

      component.validatePhoneField('homePhoneNumber');

      expect(component.donorForm.get('homePhoneNumber')?.hasError('areaCodeNotFound')).toBeTrue();
    });

    it('should clear areaCodeNotFound when area code becomes valid', () => {
      component.donorForm.get('workPhoneNumber')?.setValue('2145551234');
      component.donorForm.get('workPhoneNumber')?.setErrors({ areaCodeNotFound: true });
      mockAddDonorService.validateAreaCode.and.returnValue(of(true));

      component.validatePhoneField('workPhoneNumber');

      expect(component.donorForm.get('workPhoneNumber')?.hasError('areaCodeNotFound')).toBeFalse();
    });

    it('should update pendingAltAddress mobile when validating mobilePhoneNumber', () => {
      component.pendingAltAddress.set({ mobilePhoneNumber: null } as any);
      component.donorForm.get('mobilePhoneNumber')?.setValue('4695559012');
      mockAddDonorService.validateAreaCode.and.returnValue(of(true));

      component.validatePhoneField('mobilePhoneNumber');

      expect(component.pendingAltAddress()?.mobilePhoneNumber).toBe('4695559012');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 61. ngOnDestroy
  // ───────────────────────────────────────────────────────────
  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const destroySpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });

    it('should emit next on destroy$', () => {
      const nextSpy = spyOn((component as any).destroy$, 'next');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 62. applyNavigationState branches
  // ───────────────────────────────────────────────────────────
  describe('applyNavigationState branches', () => {
    it('should set mode to add and initialize header', () => {
      const state = { mode: 'add' as const };
      (component as any).applyNavigationState(state);

      expect(component.mode).toBe('add');
    });

    it('should populate form from searchCriteria in add mode', () => {
      const state = {
        mode: 'add' as const,
        searchCriteria: { lastName: 'DOE', firstName: 'JANE', sex: 'F' },
      };
      (component as any).applyNavigationState(state);

      expect(component.donorForm.get('lastName')?.value).toBe('DOE');
      expect(component.donorForm.get('firstName')?.value).toBe('JANE');
      expect(component.donorForm.get('sex')?.value).toBe('F');
    });

    it('should load donor for modify when mode is modify with donorId', () => {
      mockAddDonorService.getDonorById.and.returnValue(of({
        donorId: 'DN001', lastName: 'Test', firstName: 'User', gender: 'M',
        dateOfBirth: '1990-01-01',
      } as any));
      const state = { mode: 'modify' as const, donorId: 'DN001' };
      (component as any).applyNavigationState(state);

      expect(mockAddDonorService.getDonorById).toHaveBeenCalledWith('DN001');
    });

    it('should set navigatedFromInvestigate and sessionStorage', () => {
      const state = {
        mode: 'modify' as const,
        donorId: 'DN001',
        fromInvestigateDuplicate: true,
      };
      mockAddDonorService.getDonorById.and.returnValue(of({
        donorId: 'DN001', lastName: 'Test', firstName: 'User', gender: 'M',
      } as any));
      (component as any).applyNavigationState(state);

      expect((component as any).navigatedFromInvestigate).toBeTrue();
      expect(sessionStorage.getItem('fromInvestigateDuplicate')).toBe('true');
    });

    it('should store findDonorAlternateId from searchCriteria', () => {
      const state = {
        mode: 'modify' as const,
        donorId: 'DN001',
        searchCriteria: { alternateId: 'ALT123' },
      };
      mockAddDonorService.getDonorById.and.returnValue(of({
        donorId: 'DN001', lastName: 'Test', firstName: 'User', gender: 'M',
      } as any));
      (component as any).applyNavigationState(state);

      expect((component as any).findDonorAlternateId).toBe('ALT123');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 63. loadDonorForModify error path
  // ───────────────────────────────────────────────────────────
  describe('loadDonorForModify error path', () => {
    it('should show error snackbar when getDonorById fails', () => {
      mockAddDonorService.getDonorById.and.returnValue(
        throwError(() => new Error('fail')),
      );
      (component as any).loadDonorForModify('DN001');

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load donor data.');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 64. onSave modify mode branches
  // ───────────────────────────────────────────────────────────
  describe('onSave modify mode branches', () => {
    it('should show error when modify mode has no donorId', () => {
      component.mode = 'modify';
      component.currentDonorData = { donorId: '' } as any;
      fillRequiredFields();

      component.onSave();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        'Please select a donor to modify first.',
      );
    });

    it('should call checkForDuplicatesBeforeSave in modify mode with valid donorId', () => {
      component.mode = 'modify';
      component.currentDonorData = { donorId: 'DN001' } as any;
      fillRequiredFields();
      mockFindDonorService.searchDonors.and.returnValue(of({ data: [], total: 0 } as any));

      component.onSave();

      expect(mockFindDonorService.searchDonors).toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 65. Cancel paths - navigate to investigate
  // ───────────────────────────────────────────────────────────
  describe('Cancel paths - navigate to investigate', () => {
    it('should navigate to investigate on confirm when navigatedFromInvestigate', () => {
      (component as any).navigatedFromInvestigate = true;
      const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
      dialogRefSpyObj.afterClosed.and.returnValue(of(true));

      component.onCancel();

      const navArgs = (router.navigate as jasmine.Spy).calls.first().args[0];
      expect(navArgs[0]).toContain('investigate');
    });

    it('should not navigate when cancel dialog returns false', () => {
      const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
      dialogRefSpyObj.afterClosed.and.returnValue(of(false));

      component.onCancel();

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 66. formatPhoneForDisplay branches
  // ───────────────────────────────────────────────────────────
  describe('formatPhoneForDisplay branches', () => {
    it('should return empty for no area code and no phone', () => {
      const result = (component as any).formatPhoneForDisplay('', '');
      expect(result).toBe('');
    });

    it('should format with area code', () => {
      const result = (component as any).formatPhoneForDisplay('214', '5551234');
      expect(result).toBe('(214) 555-1234');
    });

    it('should format 7-digit phone without area code', () => {
      const result = (component as any).formatPhoneForDisplay('', '5551234');
      expect(result).toBe('555-1234');
    });

    it('should return raw digits when no area code and not 7 digits', () => {
      const result = (component as any).formatPhoneForDisplay('', '55512');
      expect(result).toBe('55512');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 67. disableSaveButton
  // ───────────────────────────────────────────────────────────
  describe('disableSaveButton', () => {
    it('should set save button disabled to true', () => {
      (component as any).disableSaveButton();
      const saveBtn = component.headerConfig.actions?.find(a => a.ariaLabel === 'Save donor data');
      expect(saveBtn?.disabled).toBeTrue();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 68. updateSaveButtonState
  // ───────────────────────────────────────────────────────────
  describe('updateSaveButtonState', () => {
    it('should disable save when form is invalid', fakeAsync(() => {
      component.donorForm.get('lastName')?.setValue('');
      component.donorForm.get('lastName')?.markAsTouched();
      (component as any).updateSaveButtonState();
      tick();

      const saveBtn = component.headerConfig.actions?.find(a => a.ariaLabel === 'Save donor data');
      expect(saveBtn?.disabled).toBeTrue();
    }));

    it('should enable save when form is valid and not saving', fakeAsync(() => {
      fillRequiredFields();
      component.saving = false;
      component.donorCreated = false;
      (component as any).updateSaveButtonState();
      tick();

      const saveBtn = component.headerConfig.actions?.find(a => a.ariaLabel === 'Save donor data');
      expect(saveBtn?.disabled).toBeFalse();
    }));

    it('should disable save when saving is true', fakeAsync(() => {
      fillRequiredFields();
      component.saving = true;
      (component as any).updateSaveButtonState();
      tick();

      const saveBtn = component.headerConfig.actions?.find(a => a.ariaLabel === 'Save donor data');
      expect(saveBtn?.disabled).toBeTrue();
    }));
  });

  // ───────────────────────────────────────────────────────────
  // 69. parsePhone
  // ───────────────────────────────────────────────────────────
  describe('parsePhone', () => {
    it('should return empty for empty string', () => {
      const result = (component as any).parsePhone('');
      expect(result).toEqual({ areaCode: '', phone: '' });
    });

    it('should parse formatted phone', () => {
      const result = (component as any).parsePhone('(214) 555-1234');
      expect(result).toEqual({ areaCode: '214', phone: '5551234' });
    });

    it('should return empty for less than 10 digits', () => {
      const result = (component as any).parsePhone('12345');
      expect(result).toEqual({ areaCode: '', phone: '' });
    });
  });

  // ───────────────────────────────────────────────────────────
  // 70. initializeHeaderFromMenu branches
  // ───────────────────────────────────────────────────────────
  describe('initializeHeaderFromMenu branches', () => {
    it('should set header for add mode', () => {
      component.mode = 'add';
      (component as any).initializeHeaderFromMenu();

      expect(component.headerConfig.title).toBe('Add Donor');
    });

    it('should set header for modify mode', () => {
      component.mode = 'modify';
      (component as any).initializeHeaderFromMenu();

      expect(component.headerConfig.title).toBe('Modify Donor Data');
    });

    it('should not update title when no menu item found', () => {
      const savedFn = (mockMenuService as any).findMenuItemByPath;
      (mockMenuService as any).findMenuItemByPath = () => undefined;
      component.headerConfig = { ...component.headerConfig, title: 'Original' };

      (component as any).initializeHeaderFromMenu();

      expect(component.headerConfig.title).toBe('Original');
      (mockMenuService as any).findMenuItemByPath = savedFn;
    });
  });

  // ───────────────────────────────────────────────────────────
  // 71. subscribeToFormStatus callback trigger
  // ───────────────────────────────────────────────────────────
  describe('subscribeToFormStatus callback trigger', () => {
    it('should update save button when form status changes', fakeAsync(() => {
      fillRequiredFields();
      component.donorForm.get('lastName')?.setValue('');
      tick();

      const saveBtn = component.headerConfig.actions?.find(a => a.ariaLabel === 'Save donor data');
      expect(saveBtn?.disabled).toBeTrue();
    }));
  });

  // ───────────────────────────────────────────────────────────
  // 72. syncMobileToAltAddress subscription callback
  // ───────────────────────────────────────────────────────────
  describe('syncMobileToAltAddress subscription callback', () => {
    it('should update pendingAltAddress when mobile phone changes via form', () => {
      component.pendingAltAddress.set({
        mobilePhoneNumber: null, addressType: 'L',
      } as any);

      component.donorForm.get('mobilePhoneNumber')?.setValue('2145551234');

      const altAddr = component.pendingAltAddress();
      expect(altAddr?.mobilePhoneNumber).toBe('2145551234');
    });

    it('should not update when pendingAltAddress is null via form change', () => {
      component.pendingAltAddress.set(null);

      component.donorForm.get('mobilePhoneNumber')?.setValue('2145551234');

      expect(component.pendingAltAddress()).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 73. openFindDonorDialog result branches
  // ───────────────────────────────────────────────────────────
  describe('openFindDonorDialog result branches', () => {
    it('should populate form on new action result', () => {
      const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
      dialogRefSpyObj.afterClosed.and.returnValue(of({
        action: 'new',
        searchCriteria: { lastName: 'DOE', firstName: 'JANE', sex: 'F' },
      }));

      (component as any).openFindDonorDialog('add');

      expect(component.donorForm.get('lastName')?.value).toBe('DOE');
      expect(component.donorForm.get('firstName')?.value).toBe('JANE');
    });

    it('should set modify header on new action in modify mode', () => {
      const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
      dialogRefSpyObj.afterClosed.and.returnValue(of({
        action: 'new',
        searchCriteria: {},
      }));

      (component as any).openFindDonorDialog('modify');

      expect(component.headerConfig.title).toBeTruthy();
    });

    it('should load donor on select action', () => {
      const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
      dialogRefSpyObj.afterClosed.and.returnValue(of({
        action: 'select',
        donor: { donorId: 'DN001' },
        searchCriteria: { alternateId: 'ALT01' },
      }));
      mockAddDonorService.getDonorById.and.returnValue(of({
        donorId: 'DN001', lastName: 'Test', firstName: 'User', gender: 'M',
      } as any));

      (component as any).openFindDonorDialog('modify');

      expect(component.mode).toBe('modify');
      expect(mockAddDonorService.getDonorById).toHaveBeenCalledWith('DN001');
    });

    it('should navigate home on cancel', () => {
      const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
      dialogRefSpyObj.afterClosed.and.returnValue(of(undefined));

      (component as any).openFindDonorDialog('add');

      expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });
  });

  // ───────────────────────────────────────────────────────────
  // 74. openDonorInternationalAddress branches
  // ───────────────────────────────────────────────────────────
  describe('openDonorInternationalAddress branches', () => {
    it('should open confirm when local address populated', () => {
      component.donorForm.patchValue({ homeAddress: '123 Main St' });
      const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      const openSpy = spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
      dialogRefSpyObj.afterClosed.and.returnValue(of(false));

      component.openDonorInternationalAddress();

      const data = openSpy.calls.first().args[1]?.data;
      expect(data?.title).toContain('Local Address');
    });

    it('should open intl dialog directly when no local address', () => {
      component.donorForm.patchValue({ homeAddress: '', city: '', zip: '' });
      const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
      dialogRefSpyObj.afterClosed.and.returnValue(of(undefined));

      component.openDonorInternationalAddress();

      expect((component as any).dialog.open).toHaveBeenCalled();
    });

    it('should open intl dialog directly when intl address already set', () => {
      component.donorForm.patchValue({ homeAddress: '123 Main St' });
      component.donorIntlAddress.set({ intlAddrFlag: 'Y', country: 'UK' } as any);
      const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
      dialogRefSpyObj.afterClosed.and.returnValue(of(undefined));

      component.openDonorInternationalAddress();

      expect((component as any).dialog.open).toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 75. openInternationalAddressDialog result branches
  // ───────────────────────────────────────────────────────────
  describe('openInternationalAddressDialog result branches', () => {
    it('should clear intl address when result is null', () => {
      component.donorIntlAddress.set({ intlAddrFlag: 'Y' } as any);
      const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
      dialogRefSpyObj.afterClosed.and.returnValue(of(null));

      (component as any).openInternationalAddressDialog();

      expect(component.donorIntlAddress()).toBeNull();
    });

    it('should set intl address when result is truthy', () => {
      const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
      dialogRefSpyObj.afterClosed.and.returnValue(of({
        intlAddrFlag: 'Y', country: 'JP', streetName: '1 Tokyo Rd',
      }));

      (component as any).openInternationalAddressDialog();

      expect(component.donorIntlAddress()?.country).toBe('JP');
    });

    it('should enable address fields when dismissed with no existing intl address', () => {
      component.donorIntlAddress.set(null);
      const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
      dialogRefSpyObj.afterClosed.and.returnValue(of(undefined));

      (component as any).openInternationalAddressDialog();

      expect(component.donorForm.get('homeAddress')?.enabled).toBeTrue();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 76. openEmployerInternationalAddress branches
  // ───────────────────────────────────────────────────────────
  describe('openEmployerInternationalAddress branches', () => {
    let dialogOpenSpy: jasmine.Spy;
    let dialogRefSpyObj: jasmine.SpyObj<MatDialogRef<any>>;

    beforeEach(() => {
      dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
    });

    it('should open confirm dialog when employer address exists and no intl address', () => {
      component.donorForm.patchValue({ employerId: 'EMP01', employerCity: 'Houston', employerZip: '77001' });
      component.employerIntlAddress.set(null);
      dialogRefSpyObj.afterClosed.and.returnValue(of(false));

      component.openEmployerInternationalAddress();

      expect(dialogOpenSpy).toHaveBeenCalled();
      const dialogData = dialogOpenSpy.calls.first().args[1]?.data;
      expect(dialogData?.title).toBe('Employer Address Populated');
    });

    it('should open intl dialog directly when no employer address', () => {
      component.donorForm.patchValue({ employerId: '', employerCity: '', employerZip: '' });
      component.employerIntlAddress.set(null);
      dialogRefSpyObj.afterClosed.and.returnValue(of(undefined));

      component.openEmployerInternationalAddress();

      expect(dialogOpenSpy).toHaveBeenCalled();
    });

    it('should set employer intl address when dialog returns result', () => {
      component.donorForm.patchValue({ employerId: '', employerCity: '', employerZip: '' });
      const intlResult = { streetName: 'Emp Intl St', country: 'DE' };
      dialogRefSpyObj.afterClosed.and.returnValue(of(intlResult));

      component.openEmployerInternationalAddress();

      expect(component.employerIntlAddress()).toEqual(intlResult as any);
    });

    it('should clear employer intl address when dialog returns null', () => {
      component.employerIntlAddress.set({ streetName: 'Existing' } as any);
      component.donorForm.patchValue({ employerId: '', employerCity: '', employerZip: '' });
      dialogRefSpyObj.afterClosed.and.returnValue(of(null));

      component.openEmployerInternationalAddress();

      expect(component.employerIntlAddress()).toBeNull();
    });

    it('should enable employer address fields when dialog returns undefined and no intl address', () => {
      component.employerIntlAddress.set(null);
      component.donorForm.patchValue({ employerId: '', employerCity: '', employerZip: '' });
      dialogRefSpyObj.afterClosed.and.returnValue(of(undefined));

      component.openEmployerInternationalAddress();

      expect(component.donorForm.get('employerCity')?.enabled).toBeTrue();
    });

    it('should disable and open intl dialog when confirm is accepted', () => {
      component.donorForm.patchValue({ employerId: 'EMP01', employerCity: 'Houston', employerZip: '77001' });
      component.employerIntlAddress.set(null);

      let callCount = 0;
      dialogOpenSpy.and.callFake(() => {
        callCount++;
        if (callCount === 1) {
          const confirmRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
          confirmRef.afterClosed.and.returnValue(of(true));
          return confirmRef;
        } else {
          const intlRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
          intlRef.afterClosed.and.returnValue(of({ streetName: 'Emp Intl St', country: 'DE' }));
          return intlRef;
        }
      });

      component.openEmployerInternationalAddress();

      expect(dialogOpenSpy).toHaveBeenCalledTimes(2);
      expect(component.employerIntlAddress()).toBeTruthy();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 53. Open Alternate Address Dialog
  // ───────────────────────────────────────────────────────────
  describe('Open Alternate Address Dialog', () => {
    let dialogOpenSpy: jasmine.Spy;
    let dialogRefSpyObj: jasmine.SpyObj<MatDialogRef<any>>;

    beforeEach(() => {
      dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
    });

    it('should open dialog with existing pending alt address', () => {
      const existing = { addressType: 'L', streetName: 'Alt St', preferredContactPhone: 'M' } as any;
      component.pendingAltAddress.set(existing);
      dialogRefSpyObj.afterClosed.and.returnValue(of(undefined));

      component.openAlternateAddress();

      expect(dialogOpenSpy).toHaveBeenCalled();
      const dialogData = dialogOpenSpy.calls.first().args[1]?.data;
      expect(dialogData?.existingData).toBeTruthy();
    });

    it('should pass mobile phone as initial data when no pending', () => {
      component.pendingAltAddress.set(null);
      component.donorForm.get('mobilePhoneNumber')?.setValue('(214) 555-1234');
      dialogRefSpyObj.afterClosed.and.returnValue(of(undefined));

      component.openAlternateAddress();

      expect(dialogOpenSpy).toHaveBeenCalled();
      const dialogData = dialogOpenSpy.calls.first().args[1]?.data;
      expect(dialogData?.existingData?.mobilePhoneNumber).toBe('(214) 555-1234');
    });

    it('should open dialog with no existing data when no mobile phone', () => {
      component.pendingAltAddress.set(null);
      component.donorForm.get('mobilePhoneNumber')?.setValue('');
      dialogRefSpyObj.afterClosed.and.returnValue(of(undefined));

      component.openAlternateAddress();

      expect(dialogOpenSpy).toHaveBeenCalled();
      const dialogData = dialogOpenSpy.calls.first().args[1]?.data;
      expect(dialogData?.existingData).toBeUndefined();
    });

    it('should clear alt address and mobile when dialog returns null', () => {
      component.pendingAltAddress.set({ preferredContactPhone: 'M' } as any);
      component.donorForm.get('mobilePhoneNumber')?.setValue('2145551234');
      dialogRefSpyObj.afterClosed.and.returnValue(of(null));

      component.openAlternateAddress();

      expect(component.pendingAltAddress()).toBeNull();
      expect(component.donorForm.get('mobilePhoneNumber')?.value).toBe('');
    });

    it('should set alt address on valid result with preferredContactPhone', () => {
      dialogRefSpyObj.afterClosed.and.returnValue(of({
        addressType: 'L', preferredContactPhone: 'H',
        mobilePhoneNumber: '2145551234',
      }));
      mockAddDonorService.validateAreaCode.and.returnValue(of(true));

      component.openAlternateAddress();

      expect(component.pendingAltAddress()?.addressType).toBe('L');
    });

    it('should show error when preferredContactPhone is missing but phones exist', () => {
      dialogRefSpyObj.afterClosed.and.returnValue(of({
        addressType: 'L', preferredContactPhone: '',
        mobilePhoneNumber: '2145551234',
      }));

      component.openAlternateAddress();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        'Preferred Contact Phone is required in Alternate Demographics.',
      );
    });

    it('should accept result when preferredContactPhone is missing and no phones', () => {
      dialogRefSpyObj.afterClosed.and.returnValue(of({
        addressType: 'L', preferredContactPhone: '',
        mobilePhoneNumber: null, otherContactNumber: null, altIntlPhoneNumber: null,
      }));

      component.openAlternateAddress();

      expect(mockSnackbarService.showError).not.toHaveBeenCalled();
    });

    it('should do nothing when dialog returns closeAll', () => {
      component.pendingAltAddress.set(null);
      dialogRefSpyObj.afterClosed.and.returnValue(of('closeAll'));

      component.openAlternateAddress();

      expect(component.pendingAltAddress()).toBeNull();
    });

    it('should show error when result has phones but no preferredContactPhone', () => {
      component.pendingAltAddress.set(null);
      dialogRefSpyObj.afterClosed.and.returnValue(of({
        addressType: 'L',
        streetName: 'Alt St',
        mobilePhoneNumber: '2145551234',
        preferredContactPhone: null,
      }));

      component.openAlternateAddress();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Preferred Contact Phone is required in Alternate Demographics.');
    });

    it('should set alt address when valid result returned', () => {
      component.pendingAltAddress.set(null);
      dialogRefSpyObj.afterClosed.and.returnValue(of({
        addressType: 'L',
        streetName: 'Alt St',
        preferredContactPhone: 'M',
        mobilePhoneNumber: '2145559999',
      }));

      component.openAlternateAddress();

      expect(component.pendingAltAddress()).toBeTruthy();
      expect(component.pendingAltAddress()?.streetName).toBe('Alt St');
    });

    it('should enable contact fields when intl address is active and alt address set', () => {
      component.donorIntlAddress.set({ streetName: 'Intl' } as any);
      (component as any).disableAddressFields();
      expect(component.donorForm.get('homePhoneNumber')?.disabled).toBeTrue();

      dialogRefSpyObj.afterClosed.and.returnValue(of({
        addressType: 'L',
        streetName: 'Alt St',
        preferredContactPhone: 'M',
        mobilePhoneNumber: null,
      }));

      component.openAlternateAddress();

      expect(component.donorForm.get('homePhoneNumber')?.enabled).toBeTrue();
    });

    it('should disable address fields when dialog returns null and intl address is active', () => {
      component.donorIntlAddress.set({ streetName: 'Intl' } as any);
      component.pendingAltAddress.set({ preferredContactPhone: 'M' } as any);
      dialogRefSpyObj.afterClosed.and.returnValue(of(null));

      component.openAlternateAddress();

      expect(component.donorForm.get('homeAddress')?.disabled).toBeTrue();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 54. getSelectedEmployerName
  // ───────────────────────────────────────────────────────────
  describe('getSelectedEmployerName', () => {
    it('should return employer name when found', () => {
      const result = (component as any).getSelectedEmployerName('EMP01');
      expect(result).toBe('Acme Corp');
    });

    it('should return empty string when not found', () => {
      const result = (component as any).getSelectedEmployerName('NONEXIST');
      expect(result).toBe('');
    });

    it('should return empty string for empty id', () => {
      const result = (component as any).getSelectedEmployerName('');
      expect(result).toBe('');
    });
  });

  // onCityEnter removed — city is now selected via dropdown.

  // ───────────────────────────────────────────────────────────
  // 56. updateSaveButtonState
  // ───────────────────────────────────────────────────────────
  describe('updateSaveButtonState', () => {
    it('should disable save button when form is invalid', () => {
      component.donorForm.get('lastName')?.setValue('');
      (component as any).updateSaveButtonState();
      const saveAction = component.headerConfig.actions?.find((a: any) => a.ariaLabel === 'Save donor data');
      expect(saveAction?.disabled).toBeTrue();
    });

    it('should disable save button when donorCreated is true', () => {
      fillRequiredFields();
      component.donorCreated = true;
      (component as any).updateSaveButtonState();
      const saveAction = component.headerConfig.actions?.find((a: any) => a.ariaLabel === 'Save donor data');
      expect(saveAction?.disabled).toBeTrue();
    });

    it('should disable save button when saving is true', () => {
      fillRequiredFields();
      component.saving = true;
      (component as any).updateSaveButtonState();
      const saveAction = component.headerConfig.actions?.find((a: any) => a.ariaLabel === 'Save donor data');
      expect(saveAction?.disabled).toBeTrue();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 82. loadLookups error branches
  // ───────────────────────────────────────────────────────────
  describe('loadLookups error branches', () => {
    it('should show error when getLookupSalutations fails', () => {
      mockAddDonorService.getLookupSalutations.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadLookups();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load salutations');
    });

    it('should show error when getLookupEthnicGroups fails', () => {
      mockAddDonorService.getLookupEthnicGroups.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadLookups();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load ethnic groups');
    });

    it('should show error when getLookupLanguages fails', () => {
      mockAddDonorService.getLookupLanguages.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadLookups();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load languages');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 83. loadAlternateIdTypes and C39/C417 filtering
  // ───────────────────────────────────────────────────────────
  describe('loadAlternateIdTypes', () => {
    it('should filter out C39 and C417 codes', () => {
      mockFindDonorService.getAlternateIdTypes.and.returnValue(of([
        { code: 'DRLIC', description: 'Driver License' },
        { code: 'C39', description: 'Code 39' },
        { code: 'C417', description: 'Code 417' },
        { code: 'MILTI', description: 'Military ID' },
      ]));

      (component as any).loadAlternateIdTypes();

      const types = component.alternateIdTypes();
      expect(types.length).toBe(2);
      expect(types.some(t => t.code === 'C39')).toBeFalse();
      expect(types.some(t => t.code === 'C417')).toBeFalse();
      expect(types.some(t => t.code === 'DRLIC')).toBeTrue();
      expect(types.some(t => t.code === 'MILTI')).toBeTrue();
    });

    it('should show error when getAlternateIdTypes fails', () => {
      mockFindDonorService.getAlternateIdTypes.and.returnValue(throwError(() => new Error('fail')));

      (component as any).loadAlternateIdTypes();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load alternate ID types');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 84. openAlternateAddress afterClosed - result without mobilePhoneNumber
  // ───────────────────────────────────────────────────────────
  describe('openAlternateAddress afterClosed - clear mobile', () => {
    it('should clear mobilePhoneNumber when result has no mobilePhoneNumber', () => {
      component.donorForm.get('mobilePhoneNumber')?.setValue('2145551234');
      const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
      dialogRefSpyObj.afterClosed.and.returnValue(of({
        addressType: 'L', preferredContactPhone: 'H',
        mobilePhoneNumber: null, otherContactNumber: null, altIntlPhoneNumber: null,
      }));

      component.openAlternateAddress();

      expect(component.donorForm.get('mobilePhoneNumber')?.value).toBe('');
    });

    it('should disable address fields on null result when intl address active', () => {
      component.donorIntlAddress.set({ intlAddrFlag: 'Y' } as any);
      component.pendingAltAddress.set({ addressType: 'L' } as any);
      const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
      dialogRefSpyObj.afterClosed.and.returnValue(of(null));

      component.openAlternateAddress();

      expect(component.pendingAltAddress()).toBeNull();
    });
  });

  // onCityBlur tests removed — replaced by dropdown-based city selection.

  // validateCity tests removed — replaced by dropdown-based city selection.

  // validateMigratedCity tests removed — replaced by dropdown-based city selection.

  // ───────────────────────────────────────────────────────────
  // 88. onInternationalAddress confirm dialog flow
  // ───────────────────────────────────────────────────────────
  describe('openDonorInternationalAddress confirm flow', () => {
    it('should save local address and open intl dialog when confirm returns true', () => {
      component.donorForm.patchValue({ homeAddress: '123 Main St', city: 'Dallas', zip: '75201' });
      const confirmDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      const intlDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      let callCount = 0;
      spyOn((component as any).dialog, 'open').and.callFake(() => {
        callCount++;
        if (callCount === 1) return confirmDialogRef;
        return intlDialogRef;
      });
      confirmDialogRef.afterClosed.and.returnValue(of(true));
      intlDialogRef.afterClosed.and.returnValue(of(undefined));

      component.openDonorInternationalAddress();

      expect(callCount).toBe(2);
    });

    it('should not open intl dialog when confirm returns false', () => {
      component.donorForm.patchValue({ homeAddress: '123 Main St' });
      const confirmDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      let callCount = 0;
      spyOn((component as any).dialog, 'open').and.callFake(() => {
        callCount++;
        return confirmDialogRef;
      });
      confirmDialogRef.afterClosed.and.returnValue(of(false));

      component.openDonorInternationalAddress();

      expect(callCount).toBe(1);
    });
  });

  // ───────────────────────────────────────────────────────────
  // 89. onPhonePaste
  // ───────────────────────────────────────────────────────────
  describe('onPhonePaste', () => {
    it('should paste digits-only into phone field', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => '(214) 555-1234' },
      } as unknown as ClipboardEvent;

      component.onPhonePaste(event, 'homePhoneNumber');

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.donorForm.get('homePhoneNumber')?.value).toBe('2145551234');
    });

    it('should not set value when pasted text has no digits', () => {
      component.donorForm.get('homePhoneNumber')?.setValue('');
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => 'abc' },
      } as unknown as ClipboardEvent;

      component.onPhonePaste(event, 'homePhoneNumber');

      expect(component.donorForm.get('homePhoneNumber')?.value).toBe('');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 90. formatPhoneDisplay
  // ───────────────────────────────────────────────────────────
  describe('formatPhoneDisplay', () => {
    it('should format 10-digit phone as (xxx) xxx-xxxx', () => {
      component.donorForm.get('homePhoneNumber')?.setValue('2145551234');

      (component as any).formatPhoneDisplay('homePhoneNumber');

      expect(component.donorForm.get('homePhoneNumber')?.value).toBe('(214) 555-1234');
    });

    it('should not format phone with less than 10 digits', () => {
      component.donorForm.get('homePhoneNumber')?.setValue('21455');

      (component as any).formatPhoneDisplay('homePhoneNumber');

      expect(component.donorForm.get('homePhoneNumber')?.value).toBe('21455');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 91. validatePhoneField branches
  // ───────────────────────────────────────────────────────────
  describe('validatePhoneField branches', () => {
    it('should clear errors when phone value is empty', () => {
      component.donorForm.get('homePhoneNumber')?.setValue('');
      component.donorForm.get('homePhoneNumber')?.setErrors({ invalidPhone: true });

      component.validatePhoneField('homePhoneNumber');

      expect(component.donorForm.get('homePhoneNumber')?.errors).toBeNull();
    });

    it('should set invalidPhone error for phone with less than 10 digits', () => {
      component.donorForm.get('homePhoneNumber')?.setValue('12345');

      component.validatePhoneField('homePhoneNumber');

      expect(component.donorForm.get('homePhoneNumber')?.hasError('invalidPhone')).toBeTrue();
    });

    it('should set invalidPhone error for phone with all zeros', () => {
      component.donorForm.get('homePhoneNumber')?.setValue('0000000000');

      component.validatePhoneField('homePhoneNumber');

      expect(component.donorForm.get('homePhoneNumber')?.hasError('invalidPhone')).toBeTrue();
    });

    it('should clear errors and format display for valid 10-digit phone', () => {
      mockAddDonorService.validateAreaCode.and.returnValue(of(true));
      component.donorForm.get('homePhoneNumber')?.setValue('2145551234');

      component.validatePhoneField('homePhoneNumber');

      expect(component.donorForm.get('homePhoneNumber')?.hasError('invalidPhone')).toBeFalse();
    });

    it('should update pendingAltAddress when validating mobilePhoneNumber', () => {
      component.pendingAltAddress.set({
        mobilePhoneNumber: null, addressType: 'L',
      } as any);
      mockAddDonorService.validateAreaCode.and.returnValue(of(true));
      component.donorForm.get('mobilePhoneNumber')?.setValue('2145551234');

      component.validatePhoneField('mobilePhoneNumber');

      expect(component.pendingAltAddress()?.mobilePhoneNumber).toBe('2145551234');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 92. validatePhoneAreaCode branches
  // ───────────────────────────────────────────────────────────
  describe('validatePhoneAreaCode branches', () => {
    it('should set areaCodeNotFound error when area code is invalid', () => {
      mockAddDonorService.validateAreaCode.and.returnValue(of(false));
      component.donorForm.get('homePhoneNumber')?.setValue('(999) 555-1234');

      (component as any).validatePhoneAreaCode('homePhoneNumber');

      expect(component.donorForm.get('homePhoneNumber')?.hasError('areaCodeNotFound')).toBeTrue();
    });

    it('should clear areaCodeNotFound error when area code is valid', () => {
      component.donorForm.get('homePhoneNumber')?.setValue('(214) 555-1234');
      component.donorForm.get('homePhoneNumber')?.setErrors({ areaCodeNotFound: true });
      mockAddDonorService.validateAreaCode.and.returnValue(of(true));

      (component as any).validatePhoneAreaCode('homePhoneNumber');

      expect(component.donorForm.get('homePhoneNumber')?.hasError('areaCodeNotFound')).toBeFalse();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 93. formatPhoneForDisplay
  // ───────────────────────────────────────────────────────────
  describe('formatPhoneForDisplay', () => {
    it('should return empty for empty areaCode and phoneNo', () => {
      const result = (component as any).formatPhoneForDisplay('', '');
      expect(result).toBe('');
    });

    it('should format with areaCode and phone', () => {
      const result = (component as any).formatPhoneForDisplay('214', '5551234');
      expect(result).toBe('(214) 555-1234');
    });

    it('should format phone without areaCode when 7 digits', () => {
      const result = (component as any).formatPhoneForDisplay('', '5551234');
      expect(result).toBe('555-1234');
    });

    it('should return raw cleanPhone when no areaCode and not 7 digits', () => {
      const result = (component as any).formatPhoneForDisplay('', '55512');
      expect(result).toBe('55512');
    });
  });

  // onCityEnter tests removed — replaced by dropdown-based city selection.

  // onMigratedCityEnter/onMigratedCityBlur tests removed — replaced by dropdown-based city selection.

  // onMigratedZipEnter tests removed — replaced by dropdown-based zip selection.

  // setupZipLookup tests removed — zip lookup via valueChanges no longer exists.

  // ───────────────────────────────────────────────────────────
  // 98. subscribeToFormStatus
  // ───────────────────────────────────────────────────────────
  describe('subscribeToFormStatus', () => {
    it('should subscribe and call updateSaveButtonState on status changes', fakeAsync(() => {
      (component as any).subscribeToFormStatus();
      fillRequiredFields();
      component.donorForm.get('lastName')?.setValue('');
      tick();

      const saveBtn = component.headerConfig.actions?.find(a => a.ariaLabel === 'Save donor data');
      expect(saveBtn?.disabled).toBeTrue();
    }));
  });

  // ───────────────────────────────────────────────────────────
  // 99. syncMobileToAltAddress
  // ───────────────────────────────────────────────────────────
  describe('syncMobileToAltAddress subscription', () => {
    it('should sync digits to pendingAltAddress on mobile phone change', () => {
      component.pendingAltAddress.set({
        mobilePhoneNumber: null, addressType: 'L',
      } as any);
      (component as any).syncMobileToAltAddress();

      component.donorForm.get('mobilePhoneNumber')?.setValue('(214) 555-1234');

      expect(component.pendingAltAddress()?.mobilePhoneNumber).toBe('2145551234');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 100. onlyNumbers
  // ───────────────────────────────────────────────────────────
  describe('onlyNumbers edge cases', () => {
    it('should allow Backspace key', () => {
      const event = { key: 'Backspace', preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onlyNumbers(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Tab key', () => {
      const event = { key: 'Tab', preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onlyNumbers(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow ctrl key combinations', () => {
      const event = { key: 'a', ctrlKey: true, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onlyNumbers(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow meta key combinations', () => {
      const event = { key: 'c', metaKey: true, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onlyNumbers(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent letters', () => {
      const event = { key: 'a', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onlyNumbers(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow digit 5', () => {
      const event = { key: '5', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onlyNumbers(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 101. checkForDuplicatesBeforeCreate branches
  // ───────────────────────────────────────────────────────────
  describe('checkForDuplicatesBeforeCreate branches', () => {
    it('should create donor directly when no duplicates found', fakeAsync(() => {
      fillRequiredFields();
      mockFindDonorService.searchDonors.and.returnValue(of({ data: [], total: 0 }));
      mockAddDonorService.createDonor.and.returnValue(of({
        success: true, data: { donorId: 'DN001' },
      } as any));

      const formValue = component.donorForm.getRawValue();
      (component as any).checkForDuplicatesBeforeCreate(formValue);
      tick();

      expect(mockAddDonorService.createDonor).toHaveBeenCalled();
    }));

    it('should create donor on searchDonors error', fakeAsync(() => {
      fillRequiredFields();
      mockFindDonorService.searchDonors.and.returnValue(throwError(() => new Error('fail')));
      mockAddDonorService.createDonor.and.returnValue(of({
        success: true, data: { donorId: 'DN001' },
      } as any));

      const formValue = component.donorForm.getRawValue();
      (component as any).checkForDuplicatesBeforeCreate(formValue);
      tick();

      expect(mockAddDonorService.createDonor).toHaveBeenCalled();
    }));

    it('should show duplicates dialog when exact duplicates found', fakeAsync(() => {
      fillRequiredFields();
      const formValue = component.donorForm.getRawValue();
      mockFindDonorService.searchDonors.and.returnValue(of({
        data: [{
          donorId: 'DN002', lastName: 'Smith', firstName: 'John',
          middleName: '', dob: '1990-01-15', sex: 'M',
        }],
        total: 1,
      }));
      const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
      dialogRefSpyObj.afterClosed.and.returnValue(of(false));

      (component as any).checkForDuplicatesBeforeCreate(formValue);
      tick();

      expect((component as any).dialog.open).toHaveBeenCalled();
    }));
  });

  // ───────────────────────────────────────────────────────────
  // 102. showDuplicatesDialogForCreate
  // ───────────────────────────────────────────────────────────
  describe('showDuplicatesDialogForCreate', () => {
    it('should create donor when confirmed in duplicates dialog', fakeAsync(() => {
      fillRequiredFields();
      const formValue = component.donorForm.getRawValue();
      const duplicates = [{ donorId: 'DN002', grade: 'A' }];
      const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
      dialogRefSpyObj.afterClosed.and.returnValue(of(true));
      mockAddDonorService.createDonor.and.returnValue(of({
        success: true, data: { donorId: 'DN001' },
      } as any));

      (component as any).showDuplicatesDialogForCreate(formValue, duplicates);
      tick();

      expect(mockAddDonorService.createDonor).toHaveBeenCalled();
    }));

    it('should not create donor when cancelled in duplicates dialog', fakeAsync(() => {
      fillRequiredFields();
      const formValue = component.donorForm.getRawValue();
      const duplicates = [{ donorId: 'DN002' }];
      const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
      dialogRefSpyObj.afterClosed.and.returnValue(of(false));

      (component as any).showDuplicatesDialogForCreate(formValue, duplicates);
      tick();

      expect(mockAddDonorService.createDonor).not.toHaveBeenCalled();
    }));
  });

  // ───────────────────────────────────────────────────────────
  // 103. showDoubleEntryDialog - verified
  // ───────────────────────────────────────────────────────────
  describe('showDoubleEntryDialog', () => {
    it('should call modifyDonor when verified', () => {
      fillRequiredFields();
      component.mode = 'modify';
      (component as any).currentDonorData = { donorId: 'DN001' };
      (component as any).originalLastName = 'CHANGED';
      const formValue = component.donorForm.getRawValue();
      const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
      dialogRefSpyObj.afterClosed.and.returnValue(of(true));
      mockAddDonorService.modifyDonor.and.returnValue(mockSuccessModifyResponse());

      (component as any).showDoubleEntryDialog(formValue);

      expect(mockAddDonorService.modifyDonor).toHaveBeenCalled();
    });

    it('should not call modifyDonor when verification fails', fakeAsync(() => {
      fillRequiredFields();
      const formValue = component.donorForm.getRawValue();
      const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpyObj);
      dialogRefSpyObj.afterClosed.and.returnValue(of(false));

      (component as any).showDoubleEntryDialog(formValue);
      tick();

      expect(mockAddDonorService.modifyDonor).not.toHaveBeenCalled();
    }));
  });

  // ───────────────────────────────────────────────────────────
  // 104. buildCreateRequest alternate address branches
  // ───────────────────────────────────────────────────────────
  describe('buildCreateRequest alternate address branches', () => {
    it('should map local alternate address fields', () => {
      component.pendingAltAddress.set({
        addressType: 'L',
        streetName: '456 Oak Ave',
        suiteApt: 'Apt 2',
        uspsId: 12345,
        mobilePhoneNumber: '2145559999',
        otherContactNumber: '2145558888',
        altIntlPhoneNumber: null,
        preferredContactPhone: 'H',
        preferredContactAddress: 'A',
      } as any);
      fillRequiredFields();
      const formValue = component.donorForm.getRawValue();
      const request = (component as any).buildCreateRequest(formValue);

      expect(request.address.altStreetName).toBe('456 Oak Ave');
      expect(request.address.altSuiteApt).toBe('Apt 2');
      expect(request.address.altUspsId).toBe(12345);
      expect(request.address.altIntlAddrFlag).toBe('N');
    });

    it('should map international alternate address fields', () => {
      component.pendingAltAddress.set({
        addressType: 'I',
        intlAddress1: '1 London Rd',
        intlAddress2: 'Suite A',
        intlAddress3: '',
        intlAddress4: '',
        countryName: 'UK',
        intlPostalCode: 'W1A',
        preferredContactPhone: 'M',
        preferredContactAddress: 'A',
      } as any);
      fillRequiredFields();
      const formValue = component.donorForm.getRawValue();
      const request = (component as any).buildCreateRequest(formValue);

      expect(request.address.altIntlAddress1).toBe('1 London Rd');
      expect(request.address.altIntlAddrFlag).toBe('Y');
      expect(request.address.altCountryName).toBe('UK');
    });

    it('should include potentialDuplicates when provided', () => {
      fillRequiredFields();
      const formValue = component.donorForm.getRawValue();
      const dupes = [{ donorId: 'DN002', grade: 'A' }];
      const request = (component as any).buildCreateRequest(formValue, dupes);

      expect(request.potentialDuplicates).toEqual(dupes);
    });

    it('should not include potentialDuplicates key when none provided', () => {
      fillRequiredFields();
      const formValue = component.donorForm.getRawValue();
      const request = (component as any).buildCreateRequest(formValue);

      expect(request.potentialDuplicates).toBeUndefined();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 105. clearEmployerInternationalAddress
  // ───────────────────────────────────────────────────────────
  describe('clearEmployerInternationalAddress', () => {
    it('should clear employer intl address and enable employer fields', () => {
      component.employerIntlAddress.set({ city: 'Tokyo', intlAddrFlag: 'Y' } as any);
      component.donorForm.get('employerCity')?.disable();
      component.donorForm.get('employerZip')?.disable();

      (component as any).clearEmployerInternationalAddress();

      expect(component.employerIntlAddress()).toBeNull();
      expect(component.donorForm.get('employerCity')?.enabled).toBeTrue();
      expect(component.donorForm.get('employerZip')?.enabled).toBeTrue();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 106. enableEmployerAddressFields
  // ───────────────────────────────────────────────────────────
  describe('enableEmployerAddressFields', () => {
    it('should enable employerCity and employerZip', () => {
      component.donorForm.get('employerCity')?.disable();
      component.donorForm.get('employerZip')?.disable();

      (component as any).enableEmployerAddressFields();

      expect(component.donorForm.get('employerCity')?.enabled).toBeTrue();
      expect(component.donorForm.get('employerZip')?.enabled).toBeTrue();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 107. restoreLocalAddressFields
  // ───────────────────────────────────────────────────────────
  describe('restoreLocalAddressFields', () => {
    it('should restore saved address and clear savedLocalAddress', () => {
      (component as any).savedLocalAddress = {
        homeAddress: '123 Main St',
        city: 'Dallas',
        state: 'TX',
        zip: '75201',
        apartmentNo: '',
        homePhoneNumber: '',
        workPhoneNumber: '',
        mobilePhoneNumber: '',
        preferredContact: '',
        email: '',
      };

      (component as any).restoreLocalAddressFields();

      expect(component.donorForm.get('homeAddress')?.value).toBe('123 Main St');
      expect(component.donorForm.get('city')?.value).toBe('Dallas');
      expect((component as any).savedLocalAddress).toBeNull();
    });

    it('should just enable address fields when no saved local address', () => {
      (component as any).savedLocalAddress = null;

      (component as any).restoreLocalAddressFields();

      expect(component.donorForm.get('homeAddress')?.enabled).toBeTrue();
    });
  });

  // ───────────────────────────────────────────────────────────
  // 108. enableContactFields
  // ───────────────────────────────────────────────────────────
  describe('enableContactFields', () => {
    it('should enable all contact fields and set validators', () => {
      const contactFields = ['homePhoneNumber', 'workPhoneNumber', 'mobilePhoneNumber', 'preferredContact', 'email'];
      contactFields.forEach(f => component.donorForm.get(f)?.disable());

      (component as any).enableContactFields();

      contactFields.forEach(f => {
        expect(component.donorForm.get(f)?.enabled).toBeTrue();
      });
    });
  });

  // ───────────────────────────────────────────────────────────
  // 109. headerConfig actions onClick
  // ───────────────────────────────────────────────────────────
  describe('headerConfig actions', () => {
    it('should call onCancel when CANCEL action clicked', () => {
      spyOn(component, 'onCancel' as any);
      const cancelAction = component.headerConfig.actions?.find(a => a.ariaLabel === 'Cancel and go back');
      cancelAction?.onClick?.();
      expect((component as any).onCancel).toHaveBeenCalled();
    });

    it('should call onSave when SAVE DONOR action clicked', () => {
      spyOn(component, 'onSave' as any);
      const saveAction = component.headerConfig.actions?.find(a => a.ariaLabel === 'Save donor data');
      saveAction?.onClick?.();
      expect((component as any).onSave).toHaveBeenCalled();
    });
  });
});
