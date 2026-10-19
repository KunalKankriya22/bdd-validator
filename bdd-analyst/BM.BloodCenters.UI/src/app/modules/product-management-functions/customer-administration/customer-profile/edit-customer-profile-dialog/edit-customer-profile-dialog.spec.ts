import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import moment from 'moment';

import { EditCustomerProfileDialog, EditCustomerProfileDialogData } from './edit-customer-profile-dialog';
import { CustomerProfileApiService } from '../services/customer-profile-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { CustomerProfileDto } from '../models/customer-profile.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('EditCustomerProfileDialog', () => {
  let component: EditCustomerProfileDialog;
  let fixture: ComponentFixture<EditCustomerProfileDialog>;
  let apiServiceSpy: jasmine.SpyObj<CustomerProfileApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<EditCustomerProfileDialog>>;

  const mockCustomerProfile: CustomerProfileDto = {
    customerId: 'OBK-EX0022',
    chapterId: 'DAL',
    name: 'Okinawa Japan Hospital',
    customerType: 'EX',
    customerTypeDesc: 'Export customer',
    shortName: 'Okinawa',
    alphaKey: null,
    intFlag: 'Y',
    address1: '876 Heartbeat Lane, Suite 1000',
    address2: 'Research Triangle Park',
    address3: null,
    city: 'Tokyo',
    state: null,
    zip: '27709',
    country: 'Japan',
    phoneNo: '9876543219',
    phoneExt: '123',
    faxNo: null,
    intPhone: '8976543219',
    telexNo: '2345234',
    codFlag: 'Y',
    returnAcceptedFlag: 'Y',
    arAccount: '81234567',
    fiPriceSchNo: '2',
    priceChangeFlag: 'Y',
    ednGenFlag: 'Y',
    plasmaFileType: null,
    phApprFlag: 'N',
    insApprFlag: 'Y',
    effDate: '2025-01-11',
    termDate: null,
    lastModifiedDate: '2025-01-11T08:32:00Z',
    payeeId: null,
    customerTypeDescription: 'EX- Export customer',
    payeeName: null
  };

  const mockDialogData: EditCustomerProfileDialogData = {
    customerProfile: { ...mockCustomerProfile }
  };

  function setup(profileOverride?: CustomerProfileDto) {
    const data: EditCustomerProfileDialogData = {
      customerProfile: profileOverride ?? { ...mockCustomerProfile }
    };

    apiServiceSpy = jasmine.createSpyObj('CustomerProfileApiService', [
      'updateCustomerProfile', 'getCustomerProfileById', 'getCustomerTypes', 'getStateCodes', 'getPayees', 'getPlasmaFileTypes'
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    headerServiceSpy = createMockHeaderService();
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    apiServiceSpy.getCustomerTypes.and.returnValue(of([
      { code: 'EX', description: 'Export customer' },
      { code: 'MG', description: 'Manufacturing' }
    ]));
    apiServiceSpy.getStateCodes.and.returnValue(of([
      { code: 'TX', description: 'Texas' },
      { code: 'CA', description: 'California' }
    ]));
    apiServiceSpy.getPayees.and.returnValue(of([]));
    apiServiceSpy.getPlasmaFileTypes.and.returnValue(of([
      { code: 'P1', description: 'Plasma Type 1' }
    ]));
    apiServiceSpy.getCustomerProfileById.and.returnValue(of(profileOverride ?? mockCustomerProfile));

    TestBed.configureTestingModule({
      imports: [EditCustomerProfileDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: CustomerProfileApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });

    fixture = TestBed.createComponent(EditCustomerProfileDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    setup();
  });

  describe('Initialization', () => {

    it('should populate core form fields from customer profile data', () => {
      expect(component.customerForm.get('name')?.value).toBe('Okinawa Japan Hospital');
      expect(component.customerForm.get('customerType')?.value).toBe('EX');
      expect(component.customerForm.get('shortName')?.value).toBe('Okinawa');
      expect(component.customerForm.get('intFlag')?.value).toBe('Y');
      expect(component.customerForm.get('address1')?.value).toBe('876 Heartbeat Lane, Suite 1000');
      expect(component.customerForm.get('city')?.value).toBe('Tokyo');
      expect(component.customerForm.get('country')?.value).toBe('Japan');
      expect(component.customerForm.get('codFlag')?.value).toBe('Y');
      expect(component.customerForm.get('returnAcceptedFlag')?.value).toBe('Y');
      expect(component.customerForm.get('arAccount')?.value).toBe('81234567');
    });

    it('should populate effDate from profile', () => {
      const effDate = component.customerForm.get('effDate')?.value;
      expect(effDate).toBeTruthy();
    });

    it('should set last modified display', () => {
      expect(component['lastModifiedDisplay']).toContain('Last Modified:');
      expect(component['lastModifiedDisplay']).toContain('11-JAN-2025');
    });

    it('should load dropdown data on init', () => {
      expect(apiServiceSpy.getCustomerTypes).toHaveBeenCalled();
      expect(apiServiceSpy.getStateCodes).toHaveBeenCalled();
      expect(apiServiceSpy.getPayees).toHaveBeenCalled();
      expect(apiServiceSpy.getPlasmaFileTypes).toHaveBeenCalled();
    });

    it('should set international zipMaxLength to 10 on init (intFlag=Y)', () => {
      // intFlag is 'Y' in mock profile - international
      expect(component['zipMaxLength']).toBe(10);
    });
  });

  describe('Effective Date', () => {

    it('should call updateValueAndValidity on termDate when onEffectiveDateChange is called', () => {
      const termCtrl = component.customerForm.get('termDate');
      spyOn(termCtrl!, 'updateValueAndValidity');

      component.onEffectiveDateChange();

      expect(termCtrl?.updateValueAndValidity).toHaveBeenCalled();
    });

    it('should mark effDate as touched when onEffectiveDateChange is called', () => {
      const effCtrl = component.customerForm.get('effDate');
      spyOn(effCtrl!, 'markAsTouched');

      component.onEffectiveDateChange();

      expect(effCtrl?.markAsTouched).toHaveBeenCalled();
    });

    it('should call onEffectiveDateInput without throwing', () => {
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: { value: '11-JAN-2025' } });
      expect(() => component.onEffectiveDateInput(event)).not.toThrow();
    });
  });

  describe('International/Domestic Toggle', () => {

    it('should set zipMaxLength to 10 when switching to international', fakeAsync(() => {
      component.customerForm.get('intFlag')?.setValue('N');
      tick();
      component.customerForm.get('intFlag')?.setValue('Y');
      tick();
      expect(component['zipMaxLength']).toBe(10);
    }));

    it('should set zipMaxLength to 15 when switching to domestic', fakeAsync(() => {
      component.customerForm.get('intFlag')?.setValue('N');
      tick();
      expect(component['zipMaxLength']).toBe(15);
    }));

    it('should make state optional when international', () => {
      component.customerForm.get('intFlag')?.setValue('Y');
      component.customerForm.get('state')?.setValue('');
      component.customerForm.get('state')?.updateValueAndValidity();
      expect(component.customerForm.get('state')?.valid).toBe(true);
    });

    it('should make state required when domestic', () => {
      component.customerForm.get('intFlag')?.setValue('N');
      component.customerForm.get('state')?.setValue('');
      component.customerForm.get('state')?.updateValueAndValidity();
      expect(component.customerForm.get('state')?.valid).toBe(false);
    });
  });

  describe('Save', () => {

    it('should call updateCustomerProfile on save', fakeAsync(() => {
      const updatedProfile = { ...mockCustomerProfile, name: 'Updated Name' };
      apiServiceSpy.updateCustomerProfile.and.returnValue(of(updatedProfile));

      component.customerForm.get('name')?.setValue('Updated Name');
      component.onSave();
      tick();

      expect(apiServiceSpy.updateCustomerProfile).toHaveBeenCalledWith(
        'OBK-EX0022',
        jasmine.objectContaining({ name: 'Updated Name' })
      );
    }));

    it('should show success snackbar and close dialog on save success', fakeAsync(() => {
      apiServiceSpy.updateCustomerProfile.and.returnValue(of(mockCustomerProfile));

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    }));

    it('should show error snackbar on save failure', fakeAsync(() => {
      apiServiceSpy.updateCustomerProfile.and.returnValue(throwError(() => ({ error: { message: 'Save failed' } })));

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should not save when form is invalid', () => {
      component.customerForm.get('name')?.setValue('');

      component.onSave();

      expect(apiServiceSpy.updateCustomerProfile).not.toHaveBeenCalled();
    });
  });

  describe('Dropdown Error Handling', () => {

    it('should show error when getCustomerTypes fails', () => {
      TestBed.resetTestingModule();

      apiServiceSpy = jasmine.createSpyObj('CustomerProfileApiService', [
        'updateCustomerProfile', 'getCustomerProfileById', 'getCustomerTypes', 'getStateCodes', 'getPayees', 'getPlasmaFileTypes'
      ]);
      apiServiceSpy.getCustomerTypes.and.returnValue(throwError(() => new Error('fail')));
      apiServiceSpy.getStateCodes.and.returnValue(of([]));
      apiServiceSpy.getPayees.and.returnValue(of([]));
      apiServiceSpy.getPlasmaFileTypes.and.returnValue(of([]));
      apiServiceSpy.getCustomerProfileById.and.returnValue(of(mockCustomerProfile));
      snackbarServiceSpy = createMockSnackbarService();
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
      headerServiceSpy = createMockHeaderService();

      TestBed.configureTestingModule({
        imports: [EditCustomerProfileDialog, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: { customerProfile: { ...mockCustomerProfile } } },
          { provide: CustomerProfileApiService, useValue: apiServiceSpy },
          { provide: SnackbarService, useValue: snackbarServiceSpy },
          { provide: HeaderService, useValue: headerServiceSpy }
        ]
      });

      fixture = TestBed.createComponent(EditCustomerProfileDialog);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });

    it('should show error when getPlasmaFileTypes fails', () => {
      TestBed.resetTestingModule();
      apiServiceSpy = jasmine.createSpyObj('CustomerProfileApiService', [
        'updateCustomerProfile', 'getCustomerProfileById', 'getCustomerTypes', 'getStateCodes', 'getPayees', 'getPlasmaFileTypes'
      ]);
      apiServiceSpy.getCustomerTypes.and.returnValue(of([]));
      apiServiceSpy.getStateCodes.and.returnValue(of([]));
      apiServiceSpy.getPayees.and.returnValue(of([]));
      apiServiceSpy.getPlasmaFileTypes.and.returnValue(throwError(() => new Error('fail')));
      apiServiceSpy.getCustomerProfileById.and.returnValue(of(mockCustomerProfile));
      snackbarServiceSpy = createMockSnackbarService();
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
      headerServiceSpy = createMockHeaderService();

      TestBed.configureTestingModule({
        imports: [EditCustomerProfileDialog, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: { customerProfile: { ...mockCustomerProfile } } },
          { provide: CustomerProfileApiService, useValue: apiServiceSpy },
          { provide: SnackbarService, useValue: snackbarServiceSpy },
          { provide: HeaderService, useValue: headerServiceSpy }
        ]
      });

      fixture = TestBed.createComponent(EditCustomerProfileDialog);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });
  });

  describe('Search Controls (dropdown filtering)', () => {

    it('should filter customerTypes by code', () => {
      component['customerTypeSearchCtrl'].setValue('EX');
      const filtered = component['filteredCustomerTypes'];
      expect(filtered.some(t => t.code === 'EX')).toBe(true);
    });

    it('should filter customerTypes by description', () => {
      component['customerTypeSearchCtrl'].setValue('Export');
      const filtered = component['filteredCustomerTypes'];
      expect(filtered.some(t => t.code === 'EX')).toBe(true);
    });

    it('should filter customerTypes to empty when no match', () => {
      component['customerTypeSearchCtrl'].setValue('ZZZNOMATCH');
      expect(component['filteredCustomerTypes'].length).toBe(0);
    });

    it('should filter stateCodes by code', () => {
      component['stateSearchCtrl'].setValue('TX');
      const filtered = component['filteredStateCodes'];
      expect(filtered.some(s => s.code === 'TX')).toBe(true);
    });

    it('should filter stateCodes by description', () => {
      component['stateSearchCtrl'].setValue('California');
      const filtered = component['filteredStateCodes'];
      expect(filtered.some(s => s.code === 'CA')).toBe(true);
    });

    it('should filter plasmaTypes', () => {
      component['plasmaTypeSearchCtrl'].setValue('P1');
      const filtered = component['filteredPlasmaTypes'];
      expect(filtered.some(t => t.code === 'P1')).toBe(true);
    });

    it('should show all customerTypes when search is cleared', () => {
      component['customerTypeSearchCtrl'].setValue('EX');
      component['customerTypeSearchCtrl'].setValue('');
      expect(component['filteredCustomerTypes'].length).toBe(2);
    });
  });

  describe('Phone Formatting', () => {

    it('toUpperCase should convert input value to uppercase', () => {
      const input = document.createElement('input');
      input.value = 'hello';
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: input });
      Object.defineProperty(input, 'selectionStart', { value: 0, writable: true });
      Object.defineProperty(input, 'selectionEnd', { value: 5, writable: true });

      component['toUpperCase'](event);
      expect(input.value).toBe('HELLO');
    });

    it('onlyNumbers should allow digit keys', () => {
      const event = new KeyboardEvent('keydown', { key: '5' });
      expect(component['onlyNumbers'](event)).toBe(true);
    });

    it('onlyNumbers should allow Backspace', () => {
      const event = new KeyboardEvent('keydown', { key: 'Backspace' });
      expect(component['onlyNumbers'](event)).toBe(true);
    });

    it('onlyNumbers should allow Tab', () => {
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      expect(component['onlyNumbers'](event)).toBe(true);
    });

    it('onlyNumbers should allow Ctrl+A', () => {
      const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });
      expect(component['onlyNumbers'](event)).toBe(true);
    });

    it('onlyNumbers should prevent non-digit keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
      const result = component['onlyNumbers'](event);
      expect(result).toBe(false);
    });

    it('stripPhoneOnFocus should strip non-digits from phone field', () => {
      component.customerForm.get('phoneNo')?.setValue('123-456-7890', { emitEvent: false });
      component['stripPhoneOnFocus']('phoneNo');
      expect(component.customerForm.get('phoneNo')?.value).toBe('1234567890');
    });

    it('stripPhoneOnFocus should do nothing when field is empty', () => {
      component.customerForm.get('phoneNo')?.setValue('', { emitEvent: false });
      expect(() => component['stripPhoneOnFocus']('phoneNo')).not.toThrow();
    });

    it('formatPhoneOnBlur should format 10-digit number with dashes', () => {
      component.customerForm.get('phoneNo')?.setValue('1234567890', { emitEvent: false });
      component['formatPhoneOnBlur']('phoneNo');
      expect(component.customerForm.get('phoneNo')?.value).toBe('123-456-7890');
    });

    it('formatPhoneOnBlur should format 7-digit number with dash', () => {
      component.customerForm.get('phoneNo')?.setValue('1234567', { emitEvent: false });
      component['formatPhoneOnBlur']('phoneNo');
      expect(component.customerForm.get('phoneNo')?.value).toBe('123-4567');
    });

    it('formatPhoneOnBlur should do nothing for empty field', () => {
      component.customerForm.get('phoneNo')?.setValue('', { emitEvent: false });
      expect(() => component['formatPhoneOnBlur']('phoneNo')).not.toThrow();
    });
  });

  describe('Termination Date', () => {

    it('should mark termDate as touched on onTerminationDateChange', () => {
      const termCtrl = component.customerForm.get('termDate');
      spyOn(termCtrl!, 'markAsTouched');
      component['onTerminationDateChange']();
      expect(termCtrl?.markAsTouched).toHaveBeenCalled();
    });

    it('onTerminationDateInput should not throw', () => {
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: { value: '11-JAN-2026' } });
      expect(() => component['onTerminationDateInput'](event)).not.toThrow();
    });

    it('terminationDateFilter should return true for null date', () => {
      expect(component['terminationDateFilter'](null)).toBe(true);
    });

    it('terminationDateFilter should return true for date after effDate', () => {
      component.customerForm.get('effDate')?.setValue(moment('2025-01-01'));
      const futureDate = moment('2025-06-01');
      expect(component['terminationDateFilter'](futureDate)).toBe(true);
    });

    it('terminationDateFilter should return false for date before effDate', () => {
      component.customerForm.get('effDate')?.setValue(moment('2025-06-01'));
      const pastDate = moment('2025-01-01');
      expect(component['terminationDateFilter'](pastDate)).toBe(false);
    });

    it('getTerminationDateError should return a string', () => {
      expect(typeof component['getTerminationDateError']()).toBe('string');
    });
  });

  describe('Clear All', () => {

    it('should clear core editable fields', () => {
      component.onClearAll();

      expect(component.customerForm.get('name')?.value).toBe('');
      expect(component.customerForm.get('customerType')?.value).toBe('');
      expect(component.customerForm.get('shortName')?.value).toBe('');
      expect(component.customerForm.get('address1')?.value).toBe('');
      expect(component.customerForm.get('country')?.value).toBe('USA');
      expect(component.customerForm.get('termDate')?.value).toBeNull();
    });

    it('should not clear effDate on clear all', () => {
      const effDateBefore = component.customerForm.get('effDate')?.value;
      component.onClearAll();
      expect(component.customerForm.get('effDate')?.value).toEqual(effDateBefore);
    });
  });
});
