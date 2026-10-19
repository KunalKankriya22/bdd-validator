import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import moment from 'moment';

import { AddEditPayeeComponent } from './add-edit-payee.component';
import { CustomerPayeeApiService } from '../services/customer-payee-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PayeeCustomerDto, PAYEE_CONSTRAINTS } from '../models/customer-payee.model';
import { CustomerProfileDto } from '../../customer-profile/models/customer-profile.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditPayeeComponent', () => {
  let component: AddEditPayeeComponent;
  let fixture: ComponentFixture<AddEditPayeeComponent>;
  let apiServiceSpy: jasmine.SpyObj<CustomerPayeeApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let chapterChanged$: Subject<void>;

  const mockPayee: PayeeCustomerDto = {
    customerId: 'DAL-PA0004',
    chapterId: 'DAL',
    customerType: 'PA',
    name: 'Parkland Hospital',
    shortName: 'Parkland',
    alphaKey: 'PARKLAND H',
    address1: '3829 Log cabin lane',
    address2: null,
    address3: null,
    city: 'LA',
    state: 'CA',
    zip: '91245',
    country: 'USA',
    phoneNo: '123-123-1234',
    phoneExt: null,
    faxNo: null,
    telexNo: null,
    intPhone: '123-123-1234',
    intFlag: 'Y',
    codFlag: 'N',
    effDate: '30-Jan-2025',
    termDate: null,
    lastModifiedDate: '11-Jan-2025'
  };

  const mockCustomerProfile: Partial<CustomerProfileDto> = {
    customerId: 'OBK-EX0022',
    name: 'Okinawa Japan Hospital',
    address1: '876 Heartbeat Lane, Suite 1000',
    address2: 'Research Triangle Park',
    address3: null,
    city: 'Tokyo',
    state: null,
    zip: '27709',
    country: 'Japan',
    phoneNo: '987-654-3219',
    faxNo: null,
    intPhone: '8976543219',
    telexNo: '2345234',
    intFlag: 'Y'
  } as CustomerProfileDto;

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();
    apiServiceSpy = jasmine.createSpyObj('CustomerPayeeApiService', ['createPayee', 'updatePayee', 'getStateCodes', 'getZones']);
    apiServiceSpy.getStateCodes.and.returnValue(of([]));
    apiServiceSpy.getZones.and.returnValue(of([]));
    snackbarServiceSpy = createMockSnackbarService();
    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });
      TestBed.configureTestingModule({
      imports: [AddEditPayeeComponent, NoopAnimationsModule],
      providers: [
        { provide: CustomerPayeeApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });


    


      apiServiceSpy.createPayee.calls.reset();


      apiServiceSpy.updatePayee.calls.reset();


      apiServiceSpy.getStateCodes.calls.reset();


      apiServiceSpy.getZones.calls.reset();


      apiServiceSpy.getStateCodes.and.returnValue(of([]));


      apiServiceSpy.getZones.and.returnValue(of([]));


    fixture = TestBed.createComponent(AddEditPayeeComponent);
    component = fixture.componentInstance;
    component.customerName = 'Okinawa Japan Hospital';
    component.customerProfile = mockCustomerProfile as CustomerProfileDto;


    });

  describe('Initialization', () => {


    it('should initialize form with all controls', () => {
      fixture.detectChanges();
      expect(component.payeeForm.get('name')).toBeTruthy();
      expect(component.payeeForm.get('shortName')).toBeTruthy();
      expect(component.payeeForm.get('sameAsCustomer')).toBeTruthy();
      expect(component.payeeForm.get('internationalAddress')).toBeTruthy();
      expect(component.payeeForm.get('address1')).toBeTruthy();
      expect(component.payeeForm.get('address2')).toBeTruthy();
      expect(component.payeeForm.get('address3')).toBeTruthy();
      expect(component.payeeForm.get('city')).toBeTruthy();
      expect(component.payeeForm.get('state')).toBeTruthy();
      expect(component.payeeForm.get('zip')).toBeTruthy();
      expect(component.payeeForm.get('country')).toBeTruthy();
      expect(component.payeeForm.get('phoneNo')).toBeTruthy();
      expect(component.payeeForm.get('faxNo')).toBeTruthy();
      expect(component.payeeForm.get('intPhone')).toBeTruthy();
      expect(component.payeeForm.get('telexNo')).toBeTruthy();
      expect(component.payeeForm.get('effectiveDate')).toBeTruthy();
      expect(component.payeeForm.get('terminationDate')).toBeTruthy();
    });

    it('should default country to USA', () => {
      fixture.detectChanges();
      expect(component.payeeForm.get('country')?.value).toBe('USA');
    });
  });

  describe('Panel Title', () => {
    it('should show add title in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.panelTitle).toBe('Add New Payee for Okinawa Japan Hospital');
    });

    it('should show edit title in edit mode', () => {
      component.mode = 'edit';
      fixture.detectChanges();
      expect(component.panelTitle).toBe('Edit Payee for Okinawa Japan Hospital');
    });

    it('should show generic title when customerName is empty', () => {
      component.customerName = '';
      component.mode = 'add';
      expect(component.panelTitle).toBe('Add New Payee');
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should require name', () => {
      const nameControl = component.payeeForm.get('name');
      nameControl?.setValue(null);
      nameControl?.markAsTouched();
      expect(nameControl?.hasError('required')).toBeTrue();
    });

    it('should require address1', () => {
      const control = component.payeeForm.get('address1');
      control?.setValue(null);
      control?.markAsTouched();
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require city', () => {
      const control = component.payeeForm.get('city');
      control?.setValue(null);
      control?.markAsTouched();
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require zip', () => {
      const control = component.payeeForm.get('zip');
      control?.setValue(null);
      control?.markAsTouched();
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require country', () => {
      const control = component.payeeForm.get('country');
      control?.setValue(null);
      control?.markAsTouched();
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require effective date', () => {
      const control = component.payeeForm.get('effectiveDate');
      control?.setValue(null);
      control?.markAsTouched();
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should enforce name max length', () => {
      const nameControl = component.payeeForm.get('name');
      nameControl?.setValue('a'.repeat(PAYEE_CONSTRAINTS.NAME.MAX_LENGTH + 1));
      expect(nameControl?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce address1 max length', () => {
      const control = component.payeeForm.get('address1');
      control?.setValue('a'.repeat(PAYEE_CONSTRAINTS.ADDRESS_1.MAX_LENGTH + 1));
      expect(control?.hasError('maxlength')).toBeTrue();
    });
  });

  describe('International Address Checkbox', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should require state when international address is unchecked', () => {
      component.payeeForm.get('internationalAddress')?.setValue(false);
      const stateControl = component.payeeForm.get('state');
      stateControl?.setValue(null);
      stateControl?.markAsTouched();
      expect(stateControl?.hasError('required')).toBeTrue();
    });

    it('should not require state when international address is checked', () => {
      component.payeeForm.get('internationalAddress')?.setValue(true);
      const stateControl = component.payeeForm.get('state');
      stateControl?.setValue(null);
      stateControl?.markAsTouched();
      expect(stateControl?.hasError('required')).toBeFalsy();
    });
  });

  describe('Same as Customer Checkbox', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should populate address fields from customer profile when checked', () => {
      component.payeeForm.get('sameAsCustomer')?.setValue(true);

      expect(component.payeeForm.get('address1')?.value).toBe('876 Heartbeat Lane, Suite 1000');
      expect(component.payeeForm.get('city')?.value).toBe('Tokyo');
      expect(component.payeeForm.get('country')?.value).toBe('Japan');
      expect(component.payeeForm.get('phoneNo')?.value).toBe('987-654-3219');
    });

    it('should populate address fields from customer profile when same as customer is checked', () => {
      component.payeeForm.get('sameAsCustomer')?.setValue(true);

      expect(component.payeeForm.get('address1')?.value).toBeTruthy();
      expect(component.payeeForm.get('city')?.value).toBeTruthy();
      expect(component.payeeForm.get('country')?.value).toBeTruthy();
      expect(component.payeeForm.get('phoneNo')?.value).toBeTruthy();
    });

    it('should keep address fields enabled when unchecked', () => {
      component.payeeForm.get('sameAsCustomer')?.setValue(true);
      component.payeeForm.get('sameAsCustomer')?.setValue(false);

      expect(component.payeeForm.get('address1')?.enabled).toBeTrue();
      expect(component.payeeForm.get('city')?.enabled).toBeTrue();
      expect(component.payeeForm.get('country')?.enabled).toBeTrue();
    });

    it('should set international address based on customer profile', () => {
      component.payeeForm.get('sameAsCustomer')?.setValue(true);
      expect(component.payeeForm.get('internationalAddress')?.value).toBeTrue();
    });
  });

  describe('Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.data = {
        customerId: '', chapterId: '', customerType: 'PA',
        name: '', shortName: '', alphaKey: '', address1: '',
        city: '', zip: '', intFlag: 'N', codFlag: 'N',
        effDate: '', termDate: null
      } as PayeeCustomerDto;
      fixture.detectChanges();
    });



    it('should show CANCEL and ADD buttons', () => {
      const buttons = fixture.debugElement.queryAll(By.css('.panel-footer button'));
      const buttonTexts = buttons.map(b => b.nativeElement.textContent.trim());
      expect(buttonTexts).toContain('CANCEL');
      expect(buttonTexts).toContain('ADD');
    });











    it('should auto-generate alphaKey from name', () => {
      apiServiceSpy.createPayee.and.returnValue(of({ success: true, item: {} }));

      component.payeeForm.patchValue({
        name: 'Parkland Hospital Dallas',
        shortName: 'Parkland',
        address1: '123 Main',
        city: 'Dallas',
        state: 'TX',
        zip: '75201',
        country: 'USA',
        effectiveDate: moment('2027-01-01')
      });

      component.onSave();

      const callArgs = apiServiceSpy.createPayee.calls.mostRecent().args[0];
      expect(callArgs.alphaKey).toBe('PARKLAND H');
    });






  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockPayee;
      component.ngOnChanges({
        mode: new SimpleChange(null, 'edit', true),
        data: new SimpleChange(null, mockPayee, true)
      });
      fixture.detectChanges();
    });

    it('should show payee ID in read-only display', () => {
      const payeeIdDisplay = fixture.debugElement.query(By.css('.field-display .value'));
      expect(payeeIdDisplay.nativeElement.textContent).toContain('DAL-PA0004');
    });

    it('should show last modified date', () => {
      expect(component.lastModifiedDisplay).toContain('Last Modified');
    });



    it('should set international address checkbox from intFlag', () => {
      expect(component.payeeForm.get('internationalAddress')?.value).toBeTrue();
    });

    it('should show CANCEL, CLEAR ALL, and SAVE buttons', () => {
      const buttons = fixture.debugElement.queryAll(By.css('.panel-footer button'));
      const buttonTexts = buttons.map(b => b.nativeElement.textContent.trim());
      expect(buttonTexts).toContain('CANCEL');
      expect(buttonTexts).toContain('CLEAR ALL');
      expect(buttonTexts).toContain('SAVE');
    });

    it('should call updatePayee on save', () => {
      apiServiceSpy.updatePayee.and.returnValue(of({
        success: true,
        message: 'Changes in Payee DAL-PA0004 have been saved.'
      }));

      component.payeeForm.get('name')?.setValue('Updated Hospital');
      component.onSave();

      expect(apiServiceSpy.updatePayee).toHaveBeenCalledWith(
        'DAL-PA0004',
        jasmine.objectContaining({ name: 'Updated Hospital' })
      );
    });




  });


  describe('Short Name Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should require shortName', () => {
      const control = component.payeeForm.get('shortName');
      control?.setValue(null);
      control?.markAsTouched();
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should enforce shortName max length', () => {
      const control = component.payeeForm.get('shortName');
      control?.setValue('a'.repeat(PAYEE_CONSTRAINTS.SHORT_NAME.MAX_LENGTH + 1));
      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should send shortName as UPPER case on create', () => {
      apiServiceSpy.createPayee.and.returnValue(of({ success: true, item: {} }));

      component.payeeForm.patchValue({
        name: 'Test',
        shortName: 'lowercase',
        address1: '123 Main',
        city: 'Dallas',
        state: 'TX',
        zip: '75201',
        country: 'USA',
        effectiveDate: moment('2027-01-01')
      });

      component.onSave();

      const callArgs = apiServiceSpy.createPayee.calls.mostRecent().args[0];
      expect(callArgs.shortName).toBe('LOWERCASE');
    });
  });

  describe('Phone/Fax Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should reject phone with letters', () => {
      const control = component.payeeForm.get('phoneNo');
      control?.setValue('abc-def-ghij');
      expect(control?.hasError('invalidPhoneNumber')).toBeTrue();
    });

    it('should reject phone with invalid length', () => {
      const control = component.payeeForm.get('phoneNo');
      control?.setValue('12345');
      expect(control?.hasError('invalidPhoneNumber')).toBeTrue();
    });

    it('should accept valid 7-digit phone', () => {
      const control = component.payeeForm.get('phoneNo');
      control?.setValue('555-1234');
      expect(control?.valid).toBeTrue();
    });

    it('should accept valid 10-digit phone', () => {
      const control = component.payeeForm.get('phoneNo');
      control?.setValue('303-555-1234');
      expect(control?.valid).toBeTrue();
    });

    it('should accept valid 8-digit phone', () => {
      const control = component.payeeForm.get('phoneNo');
      control?.setValue('55512345');
      expect(control?.valid).toBeTrue();
    });

    it('should accept valid 12-digit phone', () => {
      const control = component.payeeForm.get('phoneNo');
      control?.setValue('303555123456');
      expect(control?.valid).toBeTrue();
    });

    it('should allow empty phone (optional)', () => {
      const control = component.payeeForm.get('phoneNo');
      control?.setValue(null);
      expect(control?.valid).toBeTrue();
    });

    it('should reject fax with letters', () => {
      const control = component.payeeForm.get('faxNo');
      control?.setValue('jy,jpty,j');
      expect(control?.hasError('invalidPhoneNumber')).toBeTrue();
    });

    it('should accept valid fax number', () => {
      const control = component.payeeForm.get('faxNo');
      control?.setValue('303-555-1234');
      expect(control?.valid).toBeTrue();
    });
  });

  describe('International Address - ZIP Conditional', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should require ZIP for domestic addresses', () => {
      component.payeeForm.get('internationalAddress')?.setValue(false);
      const zipControl = component.payeeForm.get('zip');
      zipControl?.setValue(null);
      zipControl?.markAsTouched();
      expect(zipControl?.hasError('required')).toBeTrue();
    });

    it('should require ZIP for international addresses', () => {
      component.payeeForm.get('internationalAddress')?.setValue(true);
      const zipControl = component.payeeForm.get('zip');
      zipControl?.setValue(null);
      zipControl?.markAsTouched();
      expect(zipControl?.hasError('required')).toBeTrue();
    });

    it('should allow alphanumeric ZIP for international and numeric-only for domestic', () => {
      component.payeeForm.get('internationalAddress')?.setValue(true);
      const zipControl = component.payeeForm.get('zip');
      zipControl?.setValue('ABC123');
      expect(zipControl?.valid).toBeTrue();

      component.payeeForm.get('internationalAddress')?.setValue(false);
      zipControl?.setValue('ABC123');
      expect(zipControl?.hasError('pattern')).toBeTrue();

      zipControl?.setValue('75201');
      expect(zipControl?.valid).toBeTrue();
    });
  });

  describe('onSave — invalid form', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should not call API when form is invalid', () => {
      component.payeeForm.get('name')?.setValue(null);
      component.onSave();
      expect(apiServiceSpy.createPayee).not.toHaveBeenCalled();
    });
  });

  describe('onSave — edit mode no changes', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockPayee;
      component.ngOnChanges({
        mode: new SimpleChange(null, 'edit', true),
        data: new SimpleChange(null, mockPayee, true)
      });
      fixture.detectChanges();
    });

    it('should not call updatePayee when form has no changes', () => {
      component.onSave();
      expect(apiServiceSpy.updatePayee).not.toHaveBeenCalled();
    });
  });

  describe('createPayee error path', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should show error snackbar when createPayee fails', () => {
      apiServiceSpy.createPayee.and.returnValue(throwError(() => ({
        error: { errorCode: '0201', message: 'Validation failed' }
      })));
      component.payeeForm.patchValue({
        name: 'Test Hospital', shortName: 'TEST',
        address1: '123 Main', city: 'Dallas', state: 'TX',
        zip: '75201', country: 'USA', effectiveDate: moment('2027-01-01')
      });
      component.onSave();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component.isSaving).toBeFalse();
    });

    it('should format error with errorResponse.errorCode', () => {
      apiServiceSpy.createPayee.and.returnValue(throwError(() => ({
        error: { errorResponse: { errorCode: '0300', error: 'Failed to create' } }
      })));
      component.payeeForm.patchValue({
        name: 'Test', shortName: 'T',
        address1: '123', city: 'Dallas', state: 'TX',
        zip: '75201', country: 'USA', effectiveDate: moment('2027-01-01')
      });
      component.onSave();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Error 0300: Failed to create');
    });
  });

  describe('onAddAndCreateAnother', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should not call API when form is invalid', () => {
      component.payeeForm.get('name')?.setValue(null);
      component.onAddAndCreateAnother();
      expect(apiServiceSpy.createPayee).not.toHaveBeenCalled();
    });

    it('should create payee and reset form keeping panel open on success', () => {
      apiServiceSpy.createPayee.and.returnValue(of({ success: true, item: { customerId: 'DAL-PA0005' }, message: 'Created' }));
      let closedEmitted = false;
      component.closePanel.subscribe(() => { closedEmitted = true; });

      component.payeeForm.patchValue({
        name: 'Test Hospital', shortName: 'TEST',
        address1: '123 Main', city: 'Dallas', state: 'TX',
        zip: '75201', country: 'USA', effectiveDate: moment('2027-01-01')
      });
      component.onAddAndCreateAnother();

      expect(apiServiceSpy.createPayee).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
      expect(closedEmitted).toBeFalse();
    });

    it('should not call onAddAndCreateAnother in edit mode', () => {
      component.mode = 'edit';
      component.onAddAndCreateAnother();
      expect(apiServiceSpy.createPayee).not.toHaveBeenCalled();
    });
  });

  describe('updatePayee error path', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockPayee;
      component.ngOnChanges({
        mode: new SimpleChange(null, 'edit', true),
        data: new SimpleChange(null, mockPayee, true)
      });
      fixture.detectChanges();
    });

    it('should show error snackbar when updatePayee fails', () => {
      apiServiceSpy.updatePayee.and.returnValue(throwError(() => ({
        error: { errorCode: '5015', message: 'Effective date cannot be in past' }
      })));
      component.payeeForm.get('name')?.setValue('Changed Hospital Name');
      component.onSave();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component.isSaving).toBeFalse();
    });
  });

  describe('onClearAll', () => {
    it('should reset form to defaults in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.payeeForm.get('name')?.setValue('Some Name');
      component.onClearAll();
      expect(component.payeeForm.get('name')?.value).toBeNull();
      expect(component.payeeForm.get('country')?.value).toBe('USA');
    });

    it('should repopulate form from data in edit mode', () => {
      component.mode = 'edit';
      component.data = mockPayee;
      component.ngOnChanges({
        mode: new SimpleChange(null, 'edit', true),
        data: new SimpleChange(null, mockPayee, true)
      });
      fixture.detectChanges();
      component.payeeForm.get('name')?.setValue('Modified Name');
      component.onClearAll();
      expect(component.payeeForm.get('name')?.value).toBe('Parkland Hospital');
    });
  });

  describe('onCancel', () => {
    it('should emit closePanel', () => {
      fixture.detectChanges();
      let emitted = false;
      component.closePanel.subscribe(() => { emitted = true; });
      component.onCancel();
      expect(emitted).toBeTrue();
    });
  });

  describe('Phone Formatting', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should strip non-digits from phone on focus', () => {
      component.payeeForm.get('phoneNo')?.setValue('303-555-1234');
      component.stripPhoneOnFocus('phoneNo');
      expect(component.payeeForm.get('phoneNo')?.value).toBe('3035551234');
    });

    it('should not modify phone if already digits only', () => {
      component.payeeForm.get('phoneNo')?.setValue('3035551234');
      component.stripPhoneOnFocus('phoneNo');
      expect(component.payeeForm.get('phoneNo')?.value).toBe('3035551234');
    });

    it('should not throw when phone value is null on focus', () => {
      component.payeeForm.get('phoneNo')?.setValue(null);
      expect(() => component.stripPhoneOnFocus('phoneNo')).not.toThrow();
    });

    it('should format 10-digit phone on blur', () => {
      component.payeeForm.get('phoneNo')?.setValue('3035551234');
      component.formatPhoneOnBlur('phoneNo');
      expect(component.payeeForm.get('phoneNo')?.value).toBe('303-555-1234');
    });

    it('should format 7-digit phone on blur', () => {
      component.payeeForm.get('phoneNo')?.setValue('5551234');
      component.formatPhoneOnBlur('phoneNo');
      expect(component.payeeForm.get('phoneNo')?.value).toBe('555-1234');
    });

    it('should not reformat phone with other digit count', () => {
      component.payeeForm.get('phoneNo')?.setValue('12345');
      component.formatPhoneOnBlur('phoneNo');
      expect(component.payeeForm.get('phoneNo')?.value).toBe('12345');
    });

    it('should not throw when phone is null on blur', () => {
      component.payeeForm.get('phoneNo')?.setValue(null);
      expect(() => component.formatPhoneOnBlur('phoneNo')).not.toThrow();
    });
  });

  describe('onlyNumbers', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return true for digit key', () => {
      const event = new KeyboardEvent('keydown', { key: '5' });
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should return true for Backspace', () => {
      const event = new KeyboardEvent('keydown', { key: 'Backspace' });
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should return true for Delete', () => {
      const event = new KeyboardEvent('keydown', { key: 'Delete' });
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should return true for Tab', () => {
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should return true for ArrowLeft', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should return true for ctrl+a', () => {
      const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should return true for meta+c', () => {
      const event = new KeyboardEvent('keydown', { key: 'c', metaKey: true });
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should prevent default and return false for letters', () => {
      const event = new KeyboardEvent('keydown', { key: 'a' });
      spyOn(event, 'preventDefault');
      const result = component.onlyNumbers(event);
      expect(result).toBeFalse();
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Date Input Handlers', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should handle effective date input without throwing', () => {
      const input = document.createElement('input');
      input.value = '2027-01-15';
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: input });
      expect(() => component.onEffectiveDateInput(event)).not.toThrow();
    });

    it('should handle termination date input without throwing', () => {
      const input = document.createElement('input');
      input.value = '2028-06-30';
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: input });
      expect(() => component.onTerminationDateInput(event)).not.toThrow();
    });

    it('should allow digit key in date field', () => {
      const event = new KeyboardEvent('keydown', { key: '2' });
      spyOn(event, 'preventDefault');
      component.onDateFieldKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow hyphen key in date field', () => {
      const event = new KeyboardEvent('keydown', { key: '-' });
      spyOn(event, 'preventDefault');
      component.onDateFieldKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Backspace in date field', () => {
      const event = new KeyboardEvent('keydown', { key: 'Backspace' });
      spyOn(event, 'preventDefault');
      component.onDateFieldKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Arrow keys in date field', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      spyOn(event, 'preventDefault');
      component.onDateFieldKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow ctrl+key in date field', () => {
      const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });
      spyOn(event, 'preventDefault');
      component.onDateFieldKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent non-digit non-hyphen key in date field', () => {
      const event = new KeyboardEvent('keydown', { key: 'a' });
      spyOn(event, 'preventDefault');
      component.onDateFieldKeyPress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Date Error Getters', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return string from getEffectiveDateError', () => {
      expect(typeof component.getEffectiveDateError()).toBe('string');
    });

    it('should return string from getTerminationDateError', () => {
      expect(typeof component.getTerminationDateError()).toBe('string');
    });

    it('should return effective date error when lastChangedDateField is effective', () => {
      component.payeeForm.get('effectiveDate')?.setValue(moment('2020-01-01'));
      expect(typeof component.getEffectiveDateError()).toBe('string');
    });

    it('should return termination date error when lastChangedDateField is termination', () => {
      component.payeeForm.get('terminationDate')?.setValue(moment('2020-01-01'));
      expect(typeof component.getTerminationDateError()).toBe('string');
    });
  });

  describe('State and Zone Search', () => {
    beforeEach(() => {
      apiServiceSpy.getStateCodes.and.returnValue(of([
        { code: 'CO', description: 'Colorado' },
        { code: 'CA', description: 'California' }
      ]));
      apiServiceSpy.getZones.and.returnValue(of([
        { code: 'Z1', description: 'Zone 1' },
        { code: 'Z2', description: 'Zone 2' }
      ]));
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should filter states by code on search', () => {
      component.stateSearchCtrl.setValue('co');
      expect(component.filteredStates.length).toBe(1);
      expect(component.filteredStates[0].code).toBe('CO');
    });

    it('should show all states when search is cleared', () => {
      component.stateSearchCtrl.setValue('co');
      component.stateSearchCtrl.setValue('');
      expect(component.filteredStates.length).toBe(2);
    });

    it('should filter zones by description on search', () => {
      component.zoneSearchCtrl.setValue('zone 1');
      expect(component.filteredZones.length).toBe(1);
      expect(component.filteredZones[0].code).toBe('Z1');
    });

    it('should show all zones when search is cleared', () => {
      component.zoneSearchCtrl.setValue('zone 1');
      component.zoneSearchCtrl.setValue('');
      expect(component.filteredZones.length).toBe(2);
    });
  });

  describe('State and Zone Load Errors', () => {
    it('should handle error when loading state codes gracefully', () => {
      apiServiceSpy.getStateCodes.and.returnValue(throwError(() => new Error('State load error')));
      component.mode = 'add';
      spyOn(console, 'error');
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle error when loading zones gracefully', () => {
      apiServiceSpy.getZones.and.returnValue(throwError(() => new Error('Zone load error')));
      component.mode = 'add';
      spyOn(console, 'error');
      expect(() => fixture.detectChanges()).not.toThrow();
    });
  });

  describe('Chapter Changes', () => {
    it('should update minDate when chapter changes', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(() => chapterChanged$.next()).not.toThrow();
    });
  });

  describe('ngOnInit in edit mode', () => {
    it('should configure edit mode validators when mode is edit', () => {
      component.mode = 'edit';
      component.data = mockPayee;
      fixture.detectChanges();
      expect(component.payeeForm).toBeTruthy();
    });
  });

  describe('terminationDateFilter', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return true when date is null', () => {
      expect(component.terminationDateFilter(null)).toBeTrue();
    });

    it('should return true when effective date is not set', () => {
      component.payeeForm.get('effectiveDate')?.setValue(null);
      expect(component.terminationDateFilter(moment('2027-06-01'))).toBeTrue();
    });

    it('should return false when termination date is before effective date', () => {
      component.payeeForm.get('effectiveDate')?.setValue(moment('2027-06-01'));
      expect(component.terminationDateFilter(moment('2027-05-01'))).toBeFalse();
    });

    it('should return true when termination date is same as or after effective date', () => {
      component.payeeForm.get('effectiveDate')?.setValue(moment('2027-06-01'));
      expect(component.terminationDateFilter(moment('2027-06-01'))).toBeTrue();
    });
  });

  describe('populateForm with null optional fields', () => {
    it('should handle null optional fields in edit mode', () => {
      const partialPayee: PayeeCustomerDto = {
        ...mockPayee,
        city: null as any,
        state: null as any,
        zip: null as any,
        zone: null as any,
        phoneNo: null as any,
        faxNo: null as any,
        intPhone: null as any,
        telexNo: null as any,
        address2: null,
        address3: null,
        intFlag: 'N',
        termDate: '30-Jan-2026',
        lastModifiedDate: null as any
      };
      component.mode = 'edit';
      component.data = partialPayee;
      component.ngOnChanges({
        mode: new SimpleChange(null, 'edit', true),
        data: new SimpleChange(null, partialPayee, true)
      });
      fixture.detectChanges();
      expect(component.payeeForm.get('city')?.value).toBeNull();
      expect(component.payeeForm.get('state')?.value).toBeNull();
    });

    it('should use country default when country is null in edit mode', () => {
      const partialPayee: PayeeCustomerDto = { ...mockPayee, country: null as any, intFlag: 'N' };
      component.mode = 'edit';
      component.data = partialPayee;
      component.ngOnChanges({
        mode: new SimpleChange(null, 'edit', true),
        data: new SimpleChange(null, partialPayee, true)
      });
      fixture.detectChanges();
      expect(component.payeeForm.get('country')?.value).toBeTruthy();
    });
  });

  describe('effDateErrorMatcher and termDateErrorMatcher', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return false when control is null', () => {
      expect(component.effDateErrorMatcher.isErrorState(null, null)).toBeFalse();
    });

    it('should return false when control is untouched and pristine', () => {
      const control = component.payeeForm.get('effectiveDate');
      const result = component.effDateErrorMatcher.isErrorState(control as any, null);
      expect(result).toBeFalse();
    });

    it('should invoke the eff lambda when control is touched', () => {
      const control = component.payeeForm.get('effectiveDate');
      control?.markAsTouched();
      expect(() => component.effDateErrorMatcher.isErrorState(control as any, null)).not.toThrow();
    });

    it('should invoke the term lambda when control is dirty', () => {
      const control = component.payeeForm.get('terminationDate');
      control?.markAsDirty();
      expect(() => component.termDateErrorMatcher.isErrorState(control as any, null)).not.toThrow();
    });
  });

  describe('terminationDate valueChanges', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should set lastChangedDateField to termination on terminationDate change', () => {
      component.payeeForm.get('terminationDate')?.setValue(moment('2028-01-01'));
      expect(component.lastChangedDateField).toBe('termination');
    });

    it('should set lastChangedDateField to effective on effectiveDate change', () => {
      component.payeeForm.get('effectiveDate')?.setValue(moment('2027-06-01'));
      expect(component.lastChangedDateField).toBe('effective');
    });

    it('should handle effectiveDate as null (covers !effectiveMoment path)', () => {
      component.payeeForm.get('effectiveDate')?.setValue(null);
      expect(component.terminationMinDate).toBeTruthy();
    });

    it('should handle effectiveDate as JavaScript Date object', () => {
      component.payeeForm.get('effectiveDate')?.setValue(new Date('2030-01-01'));
      expect(component.terminationMinDate).toBeTruthy();
    });

    it('should use minDate when effective date is in the past', () => {
      const pastDate = moment('2020-01-01');
      component.payeeForm.get('effectiveDate')?.setValue(pastDate);
      expect(component.terminationMinDate).toBeTruthy();
    });

    it('should use effective date when it is after minDate', () => {
      const futureDate = moment('2099-12-31');
      component.payeeForm.get('effectiveDate')?.setValue(futureDate);
      expect(component.terminationMinDate.isSame(futureDate)).toBeTrue();
    });
  });

  describe('Checkbox Listeners', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should fill form from customerProfile when sameAsCustomer is checked', () => {
      component.customerProfile = mockCustomerProfile as any;
      component.payeeForm.get('sameAsCustomer')?.setValue(true);
      expect(component.payeeForm.get('address1')?.value).toBe('876 Heartbeat Lane, Suite 1000');
    });

    it('should not fill form when sameAsCustomer is checked but no customerProfile', () => {
      component.customerProfile = null as any;
      component.payeeForm.get('sameAsCustomer')?.setValue(true);
      expect(component.payeeForm.get('address1')?.value).toBeNull();
    });

    it('should not change form when sameAsCustomer is unchecked', () => {
      component.customerProfile = mockCustomerProfile as any;
      component.payeeForm.get('sameAsCustomer')?.setValue(false);
      expect(component.payeeForm.get('address1')?.value).toBeNull();
    });

    it('should set international address change to false (domestic)', () => {
      component.payeeForm.get('internationalAddress')?.setValue(false);
      const stateControl = component.payeeForm.get('state');
      stateControl?.markAsTouched();
      stateControl?.setValue(null);
      expect(stateControl?.hasError('required')).toBeTrue();
    });

    it('should clear state required validator for international address', () => {
      component.payeeForm.get('internationalAddress')?.setValue(true);
      const stateControl = component.payeeForm.get('state');
      stateControl?.setValue(null);
      expect(stateControl?.hasError('required')).toBeFalse();
    });
  });

  describe('formatLastModified edge cases', () => {
    it('should handle invalid date string in edit mode', () => {
      const payeeWithBadDate: PayeeCustomerDto = { ...mockPayee, lastModifiedDate: 'not-a-date', intFlag: 'N' };
      component.mode = 'edit';
      component.data = payeeWithBadDate;
      component.ngOnChanges({
        mode: new SimpleChange(null, 'edit', true),
        data: new SimpleChange(null, payeeWithBadDate, true)
      });
      fixture.detectChanges();
      expect(component.lastModifiedDisplay).toContain('not-a-date');
    });
  });

  describe('panelTitle getter', () => {
    it('should return Add New Payee when no customerName in add mode', () => {
      component.mode = 'add';
      component.customerName = '';
      fixture.detectChanges();
      expect(component.panelTitle).toBe('Add New Payee');
    });

    it('should return Add New Payee for Name when customerName provided in add mode', () => {
      component.mode = 'add';
      component.customerName = 'Test Hospital';
      fixture.detectChanges();
      expect(component.panelTitle).toContain('Add New Payee for Test Hospital');
    });

    it('should return Edit Payee when no customerName in edit mode', () => {
      component.mode = 'edit';
      component.data = mockPayee;
      component.customerName = '';
      component.ngOnChanges({ mode: new SimpleChange(null, 'edit', true), data: new SimpleChange(null, mockPayee, true) });
      fixture.detectChanges();
      expect(component.panelTitle).toBe('Edit Payee');
    });

    it('should return Edit Payee for Name when customerName provided in edit mode', () => {
      component.mode = 'edit';
      component.data = mockPayee;
      component.customerName = 'Test Hospital';
      component.ngOnChanges({ mode: new SimpleChange(null, 'edit', true), data: new SimpleChange(null, mockPayee, true) });
      fixture.detectChanges();
      expect(component.panelTitle).toContain('Edit Payee for Test Hospital');
    });
  });

  describe('isSaveEnabled getter', () => {
    it('should return false when form is invalid', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.isSaveEnabled).toBeFalse();
    });

    it('should return true when form is valid in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.payeeForm.patchValue({
        name: 'Test', shortName: 'T', address1: '123 Main', city: 'Dallas',
        state: 'TX', zip: '75201', country: 'USA', effectiveDate: moment('2027-01-01')
      });
      expect(component.isSaveEnabled).toBeTrue();
    });

    it('should return hasFormChanged in edit mode when form is valid', () => {
      component.mode = 'edit';
      component.data = mockPayee;
      component.ngOnChanges({ mode: new SimpleChange(null, 'edit', true), data: new SimpleChange(null, mockPayee, true) });
      fixture.detectChanges();
      expect(component.isSaveEnabled).toBeFalse();
      component.payeeForm.get('name')?.setValue('Changed Name');
      expect(component.isSaveEnabled).toBeTrue();
    });
  });

  describe('createPayee response edge cases', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should use fallback message when response.message is absent', () => {
      apiServiceSpy.createPayee.and.returnValue(of({ success: true, item: { customerId: 'DAL-PA0005' } }));
      component.payeeForm.patchValue({
        name: 'Test', shortName: 'T', address1: '123', city: 'Dallas',
        state: 'TX', zip: '75201', country: 'USA', effectiveDate: moment('2027-01-01')
      });
      component.onSave();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith(jasmine.stringContaining('DAL-PA0005'));
    });

    it('should use empty customerId fallback when item.customerId is absent', () => {
      apiServiceSpy.createPayee.and.returnValue(of({ success: true, item: {} }));
      component.payeeForm.patchValue({
        name: 'Test', shortName: 'T', address1: '123', city: 'Dallas',
        state: 'TX', zip: '75201', country: 'USA', effectiveDate: moment('2027-01-01')
      });
      component.onSave();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    });

    it('should use fallback error message when no code or details in error', () => {
      apiServiceSpy.createPayee.and.returnValue(throwError(() => ({ error: {} })));
      component.payeeForm.patchValue({
        name: 'Test', shortName: 'T', address1: '123', city: 'Dallas',
        state: 'TX', zip: '75201', country: 'USA', effectiveDate: moment('2027-01-01')
      });
      component.onSave();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to add payee.');
    });

    it('should use errorCode from body directly when no errorResponse', () => {
      apiServiceSpy.createPayee.and.returnValue(throwError(() => ({
        error: { errorCode: 'E001', message: 'Direct error' }
      })));
      component.payeeForm.patchValue({
        name: 'Test', shortName: 'T', address1: '123', city: 'Dallas',
        state: 'TX', zip: '75201', country: 'USA', effectiveDate: moment('2027-01-01')
      });
      component.onSave();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Error E001: Direct error');
    });
  });

  describe('updatePayee response edge cases', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockPayee;
      component.ngOnChanges({ mode: new SimpleChange(null, 'edit', true), data: new SimpleChange(null, mockPayee, true) });
      fixture.detectChanges();
    });

    it('should use fallback message when updatePayee response.message is absent', () => {
      apiServiceSpy.updatePayee.and.returnValue(of({ success: true }));
      component.payeeForm.get('name')?.setValue('Changed Name');
      component.onSave();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith(jasmine.stringContaining('DAL-PA0004'));
    });

    it('should use fallback error message for update when no code', () => {
      apiServiceSpy.updatePayee.and.returnValue(throwError(() => ({ error: {} })));
      component.payeeForm.get('name')?.setValue('Changed Name');
      component.onSave();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to update payee.');
    });
  });

  describe('onSave with dateRangeInvalid error in edit mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockPayee;
      component.ngOnChanges({
        mode: new SimpleChange(null, 'edit', true),
        data: new SimpleChange(null, mockPayee, true)
      });
      fixture.detectChanges();
    });

    it('should return early when dateRangeInvalid error is present in edit mode', () => {
      component.payeeForm.setErrors({ dateRangeInvalid: true });
      component.onSave();
      expect(apiServiceSpy.updatePayee).not.toHaveBeenCalled();
    });
  });

  describe('createPayee with international address', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should set intFlag to Y when internationalAddress is true', () => {
      apiServiceSpy.createPayee.and.returnValue(of({ success: true, item: { customerId: 'DAL-PA0005' }, message: 'Created' }));
      component.payeeForm.patchValue({
        name: 'Intl Hospital', shortName: 'INTL',
        address1: '123 Intl', city: 'Tokyo', zip: 'ABC123',
        country: 'Japan', internationalAddress: true,
        effectiveDate: moment('2027-01-01')
      });
      component.onSave();
      expect(apiServiceSpy.createPayee).toHaveBeenCalledWith(
        jasmine.objectContaining({ intFlag: 'Y' })
      );
    });
  });

  describe('onTerminationDateInput in edit mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockPayee;
      component.ngOnChanges({
        mode: new SimpleChange(null, 'edit', true),
        data: new SimpleChange(null, mockPayee, true)
      });
      fixture.detectChanges();
    });

    it('should handle termination date input in edit mode without throwing', () => {
      const input = document.createElement('input');
      input.value = '2028-06-30';
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: input });
      expect(() => component.onTerminationDateInput(event)).not.toThrow();
    });
  });
});
