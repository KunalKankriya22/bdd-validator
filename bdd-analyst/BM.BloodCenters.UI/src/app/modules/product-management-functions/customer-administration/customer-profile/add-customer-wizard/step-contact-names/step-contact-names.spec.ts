import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, of, throwError } from 'rxjs';
import moment from 'moment';

import { StepContactNamesComponent } from './step-contact-names';
import { AddCustomerWizardApiService } from '../add-customer-wizard-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

// -- Mock data ----------------------------------------------------------------

const mockContactTypes = [
  { code: 'CT1', description: 'Primary Contact' },
  { code: 'CT2', description: 'Secondary Contact' }
];

const mockSavedContact = {
  instId: 'INST-001',
  contactType: 'CT1',
  firstName: 'John',
  lastName: 'Doe',
  salutation: 'Mr',
  title: 'Director',
  dayPhoneNo: '2145550100',
  nightPhoneNo: '7135550200',
  faxNo: '8175550300',
  effDate: '2099-01-01',
  termDate: '2099-12-31'
};

// -- Suite --------------------------------------------------------------------

describe('StepContactNamesComponent', () => {
  let component: StepContactNamesComponent;
  let fixture: ComponentFixture<StepContactNamesComponent>;
  let apiServiceSpy: jasmine.SpyObj<AddCustomerWizardApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let chapterChanged$: Subject<void>;

  function buildComponent(opts: {
    savedData?: any[];
    customerId?: string;
  } = {}) {
    apiServiceSpy = jasmine.createSpyObj('AddCustomerWizardApiService', [
      'getContactTypes', 'createContact', 'getContacts'
    ]);
    snackbarServiceSpy = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError', 'showInfo']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['dismiss']);
    chapterChanged$ = new Subject<void>();

    apiServiceSpy.getContactTypes.and.returnValue(of(mockContactTypes));

    const headerServiceMock = {
      chapterChanged$: chapterChanged$.asObservable(),
      chapterTimeZone: signal('-05:00')
    };

    TestBed.configureTestingModule({
      imports: [StepContactNamesComponent, NoopAnimationsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AddCustomerWizardApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: HeaderService, useValue: headerServiceMock }
      ]
    });

    fixture = TestBed.createComponent(StepContactNamesComponent);
    component = fixture.componentInstance;

    if (opts.savedData !== undefined) {
      component.savedData = opts.savedData;
    }
    if (opts.customerId !== undefined) {
      component.customerId = opts.customerId;
    }

    spyOn(console, 'error');

    fixture.detectChanges(); // triggers ngOnInit
  }

  /** Fill a contact group at given index with valid data */
  function fillValidContact(index: number = 0) {
    const group = (component as any).contacts.at(index);
    group.patchValue({
      contactType: 'CT1',
      firstName: 'Jane',
      lastName: 'Smith',
      salutation: 'Ms',
      title: 'Manager',
      dayPhone: '2145551234',
      nightPhone: '7135554321',
      faxNumber: '8175559999',
      effDate: moment().add(1, 'day')
    });
  }

  // -- Default setup (new, no savedData) ------------------------------------

  beforeEach(() => {
    buildComponent();
  });

  // -- Creation & form initialisation ----------------------------------------

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialise a FormGroup with a contacts FormArray', () => {
    expect(component.contactForm).toBeTruthy();
    expect((component as any).contacts).toBeTruthy();
    expect((component as any).contacts.length).toBeGreaterThanOrEqual(1);
  });

  it('should add one contact by default when no savedData', () => {
    expect((component as any).contacts.length).toBe(1);
  });

  it('should initialise contact form group with expected controls', () => {
    const group = (component as any).contacts.at(0);
    const expectedControls = [
      'contactType', 'firstName', 'lastName', 'salutation', 'title',
      'dayPhone', 'nightPhone', 'faxNumber', 'effDate', 'termDate'
    ];
    for (const ctrl of expectedControls) {
      expect(group.get(ctrl)).toBeTruthy(`missing control: ${ctrl}`);
    }
  });

  // -- contacts getter -------------------------------------------------------

  it('should return the contacts FormArray via getter', () => {
    const arr = (component as any).contacts;
    expect(arr).toBe(component.contactForm.get('contacts'));
  });

  // -- ID helper methods -----------------------------------------------------

  describe('ID helpers', () => {
    it('should generate element IDs with component prefix and index', () => {
      const id = (component as any).elementId('name', 0);
      expect(id).toContain('contact-names-');
      expect(id).toContain('-0-name');
    });

    it('should generate element IDs without index', () => {
      const id = (component as any).elementId('name');
      expect(id).toContain('contact-names-');
      expect(id).toContain('-name');
      expect(id).not.toContain('-undefined-');
    });

    it('should generate error IDs with index', () => {
      const id = (component as any).errorId('name', 0);
      expect(id).toContain('-0-name-error');
    });

    it('should generate error IDs without index', () => {
      const id = (component as any).errorId('name');
      expect(id).toContain('-name-error');
    });

    it('should generate label IDs with index', () => {
      const id = (component as any).labelId('name', 1);
      expect(id).toContain('-1-name-label');
    });

    it('should generate label IDs without index', () => {
      const id = (component as any).labelId('name');
      expect(id).toContain('-name-label');
    });
  });

  // -- loadContactTypes -------------------------------------------------------

  describe('loadContactTypes', () => {
    it('should call getContactTypes on the API service', () => {
      expect(apiServiceSpy.getContactTypes).toHaveBeenCalled();
    });

    it('should populate contactTypes signal on success', () => {
      expect((component as any).contactTypes()).toEqual(mockContactTypes);
    });

    it('should populate filteredContactTypes on success', () => {
      expect((component as any).filteredContactTypes).toEqual(mockContactTypes);
    });

    it('should set loading to false after contact types load', () => {
      expect((component as any).loading()).toBeFalse();
    });

    it('should emit loadingChange true then false', () => {
      const emitSpy = spyOn(component.loadingChange, 'emit');
      (component as any).loadContactTypes();
      expect(emitSpy).toHaveBeenCalledWith(true);
      expect(emitSpy).toHaveBeenCalledWith(false);
    });

    it('should show error when contact types fail to load', fakeAsync(() => {
      apiServiceSpy.getContactTypes.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadContactTypes();
      tick(5000);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load contact types');
    }));

    it('should set loading to false even when contact types fail', () => {
      apiServiceSpy.getContactTypes.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadContactTypes();
      expect((component as any).loading()).toBeFalse();
    });

    it('should emit loadingChange false on error', () => {
      const emitSpy = spyOn(component.loadingChange, 'emit');
      apiServiceSpy.getContactTypes.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadContactTypes();
      expect(emitSpy).toHaveBeenCalledWith(false);
    });

    it('should log error to console when contact types fail', () => {
      apiServiceSpy.getContactTypes.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadContactTypes();
      expect(console.error).toHaveBeenCalled();
    });
  });

  // -- Search filtering -------------------------------------------------------

  describe('search controls', () => {
    it('should filter contact types by code', () => {
      (component as any).contactTypeSearchCtrl.setValue('ct1');
      expect((component as any).filteredContactTypes.length).toBe(1);
      expect((component as any).filteredContactTypes[0].code).toBe('CT1');
    });

    it('should filter contact types by description', () => {
      (component as any).contactTypeSearchCtrl.setValue('secondary');
      expect((component as any).filteredContactTypes.length).toBe(1);
      expect((component as any).filteredContactTypes[0].code).toBe('CT2');
    });

    it('should show all contact types when search is cleared', () => {
      (component as any).contactTypeSearchCtrl.setValue('ct1');
      expect((component as any).filteredContactTypes.length).toBe(1);
      (component as any).contactTypeSearchCtrl.setValue('');
      expect((component as any).filteredContactTypes.length).toBe(2);
    });

    it('should handle null search term gracefully', () => {
      (component as any).contactTypeSearchCtrl.setValue(null);
      expect((component as any).filteredContactTypes.length).toBe(2);
    });

    it('should return empty list when no match found', () => {
      (component as any).contactTypeSearchCtrl.setValue('nonexistent');
      expect((component as any).filteredContactTypes.length).toBe(0);
    });
  });

  // -- addContact -------------------------------------------------------------

  describe('addContact', () => {
    it('should add a new contact to the form array', () => {
      const initialLength = (component as any).contacts.length;
      (component as any).addContact();
      expect((component as any).contacts.length).toBe(initialLength + 1);
    });

    it('should create a new contact with empty default values', () => {
      (component as any).addContact();
      const lastIndex = (component as any).contacts.length - 1;
      const group = (component as any).contacts.at(lastIndex);
      expect(group.get('contactType')?.value).toBe('');
      expect(group.get('firstName')?.value).toBe('');
      expect(group.get('lastName')?.value).toBe('');
    });
  });

  // -- removeContact ----------------------------------------------------------

  describe('removeContact', () => {
    it('should remove a contact when more than one exists', () => {
      (component as any).addContact();
      expect((component as any).contacts.length).toBe(2);
      (component as any).removeContact(0);
      expect((component as any).contacts.length).toBe(1);
    });

    it('should not remove the last contact', fakeAsync(() => {
      expect((component as any).contacts.length).toBe(1);
      (component as any).removeContact(0);
      tick(5000);
      expect((component as any).contacts.length).toBe(1);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('At least one contact is required');
    }));
  });

  // -- onlyNumbers ------------------------------------------------------------

  describe('onlyNumbers', () => {
    it('should allow digit keys', () => {
      const event = { key: '5', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent non-digit keys', () => {
      const event = { key: 'a', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeFalse();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow Backspace', () => {
      const event = { key: 'Backspace', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
    });

    it('should allow Tab', () => {
      const event = { key: 'Tab', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
    });

    it('should allow Delete', () => {
      const event = { key: 'Delete', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
    });

    it('should allow ArrowLeft', () => {
      const event = { key: 'ArrowLeft', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
    });

    it('should allow ArrowRight', () => {
      const event = { key: 'ArrowRight', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
    });

    it('should allow Home key', () => {
      const event = { key: 'Home', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
    });

    it('should allow End key', () => {
      const event = { key: 'End', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
    });

    it('should allow Ctrl+key combinations', () => {
      const event = { key: 'c', ctrlKey: true, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
    });

    it('should allow Meta+key combinations', () => {
      const event = { key: 'v', ctrlKey: false, metaKey: true, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
    });
  });

  // -- stripPhoneOnFocus ------------------------------------------------------

  describe('stripPhoneOnFocus', () => {
    it('should strip non-digit characters from a formatted phone', () => {
      const group = (component as any).contacts.at(0);
      group.get('dayPhone')?.setValue('214-555-0100');
      (component as any).stripPhoneOnFocus(0, 'dayPhone');
      expect(group.get('dayPhone')?.value).toBe('2145550100');
    });

    it('should not change a digits-only value', () => {
      const group = (component as any).contacts.at(0);
      group.get('dayPhone')?.setValue('2145550100');
      (component as any).stripPhoneOnFocus(0, 'dayPhone');
      expect(group.get('dayPhone')?.value).toBe('2145550100');
    });

    it('should do nothing when control value is empty', () => {
      const group = (component as any).contacts.at(0);
      group.get('dayPhone')?.setValue('');
      (component as any).stripPhoneOnFocus(0, 'dayPhone');
      expect(group.get('dayPhone')?.value).toBe('');
    });

    it('should do nothing when control value is null', () => {
      const group = (component as any).contacts.at(0);
      group.get('dayPhone')?.setValue(null);
      (component as any).stripPhoneOnFocus(0, 'dayPhone');
      expect(group.get('dayPhone')?.value).toBeNull();
    });

    it('should work for nightPhone control', () => {
      const group = (component as any).contacts.at(0);
      group.get('nightPhone')?.setValue('713-555-0200');
      (component as any).stripPhoneOnFocus(0, 'nightPhone');
      expect(group.get('nightPhone')?.value).toBe('7135550200');
    });

    it('should work for faxNumber control', () => {
      const group = (component as any).contacts.at(0);
      group.get('faxNumber')?.setValue('817-555-0300');
      (component as any).stripPhoneOnFocus(0, 'faxNumber');
      expect(group.get('faxNumber')?.value).toBe('8175550300');
    });
  });

  // -- formatPhoneOnBlur ------------------------------------------------------

  describe('formatPhoneOnBlur', () => {
    it('should format a 10-digit number as xxx-xxx-xxxx', () => {
      const group = (component as any).contacts.at(0);
      group.get('dayPhone')?.setValue('2145550100');
      (component as any).formatPhoneOnBlur(0, 'dayPhone');
      expect(group.get('dayPhone')?.value).toBe('214-555-0100');
    });

    it('should format a 7-digit number as xxx-xxxx', () => {
      const group = (component as any).contacts.at(0);
      group.get('dayPhone')?.setValue('5550100');
      (component as any).formatPhoneOnBlur(0, 'dayPhone');
      expect(group.get('dayPhone')?.value).toBe('555-0100');
    });

    it('should not format other digit lengths', () => {
      const group = (component as any).contacts.at(0);
      group.get('dayPhone')?.setValue('12345');
      (component as any).formatPhoneOnBlur(0, 'dayPhone');
      expect(group.get('dayPhone')?.value).toBe('12345');
    });

    it('should do nothing when control value is empty', () => {
      const group = (component as any).contacts.at(0);
      group.get('dayPhone')?.setValue('');
      (component as any).formatPhoneOnBlur(0, 'dayPhone');
      expect(group.get('dayPhone')?.value).toBe('');
    });

    it('should do nothing when control value is null', () => {
      const group = (component as any).contacts.at(0);
      group.get('dayPhone')?.setValue(null);
      (component as any).formatPhoneOnBlur(0, 'dayPhone');
      expect(group.get('dayPhone')?.value).toBeNull();
    });

    it('should work for nightPhone control', () => {
      const group = (component as any).contacts.at(0);
      group.get('nightPhone')?.setValue('7135550200');
      (component as any).formatPhoneOnBlur(0, 'nightPhone');
      expect(group.get('nightPhone')?.value).toBe('713-555-0200');
    });

    it('should work for faxNumber control', () => {
      const group = (component as any).contacts.at(0);
      group.get('faxNumber')?.setValue('8175550300');
      (component as any).formatPhoneOnBlur(0, 'faxNumber');
      expect(group.get('faxNumber')?.value).toBe('817-555-0300');
    });
  });

  // -- Date event handlers ----------------------------------------------------

  describe('onEffectiveDateChange', () => {
    it('should update termDate validity and mark effDate as touched', () => {
      const group = (component as any).contacts.at(0);
      const termCtrl = group.get('termDate')!;
      const updateSpy = spyOn(termCtrl, 'updateValueAndValidity');
      const effCtrl = group.get('effDate')!;
      const touchSpy = spyOn(effCtrl, 'markAsTouched');
      (component as any).onEffectiveDateChange(0);
      expect(updateSpy).toHaveBeenCalled();
      expect(touchSpy).toHaveBeenCalled();
    });
  });

  describe('onTerminationDateChange', () => {
    it('should mark termDate as touched', () => {
      const group = (component as any).contacts.at(0);
      const termCtrl = group.get('termDate')!;
      const touchSpy = spyOn(termCtrl, 'markAsTouched');
      (component as any).onTerminationDateChange(0);
      expect(touchSpy).toHaveBeenCalled();
    });
  });

  describe('onEffectiveDateInput', () => {
    it('should delegate to DateFieldValidationUtility.handleStartDateInput', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleStartDateInput');
      const event = { target: { value: '01-JAN-2030' } } as unknown as Event;
      (component as any).onEffectiveDateInput(event, 0);
      expect(spy).toHaveBeenCalledWith('01-JAN-2030', (component as any).contacts.at(0).get('effDate'));
    });
  });

  describe('onTerminationDateInput', () => {
    it('should delegate to DateFieldValidationUtility.handleEndDateInput', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const event = { target: { value: '31-DEC-2030' } } as unknown as Event;
      (component as any).onTerminationDateInput(event, 0);
      expect(spy).toHaveBeenCalledWith('31-DEC-2030', (component as any).contacts.at(0).get('termDate'));
    });
  });

  describe('getEffectiveDateError', () => {
    it('should delegate to DateFieldValidationUtility.getEffectiveDateError', () => {
      const spy = spyOn(DateFieldValidationUtility, 'getEffectiveDateError').and.returnValue('test error');
      const result = (component as any).getEffectiveDateError(0);
      expect(spy).toHaveBeenCalledWith((component as any).contacts.at(0));
      expect(result).toBe('test error');
    });
  });

  describe('getTerminationDateError', () => {
    it('should delegate to DateFieldValidationUtility.getTerminationDateError', () => {
      const spy = spyOn(DateFieldValidationUtility, 'getTerminationDateError').and.returnValue('term error');
      const result = (component as any).getTerminationDateError(0);
      expect(spy).toHaveBeenCalledWith((component as any).contacts.at(0));
      expect(result).toBe('term error');
    });
  });

  // -- getTerminationMinDate --------------------------------------------------

  describe('getTerminationMinDate', () => {
    it('should return minDate when effDate is null', () => {
      (component as any).contacts.at(0).get('effDate')?.setValue(null);
      const result = (component as any).getTerminationMinDate(0);
      expect(result.format('YYYY-MM-DD')).toBe((component as any).minDate.format('YYYY-MM-DD'));
    });

    it('should use effective date when it is after minDate', () => {
      const future = moment().add(30, 'days');
      (component as any).contacts.at(0).get('effDate')?.setValue(future);
      const result = (component as any).getTerminationMinDate(0);
      expect(result.format('YYYY-MM-DD')).toBe(future.format('YYYY-MM-DD'));
    });

    it('should use minDate when effective date is before minDate', () => {
      const past = moment('2000-01-01');
      (component as any).contacts.at(0).get('effDate')?.setValue(past);
      const result = (component as any).getTerminationMinDate(0);
      expect(result.format('YYYY-MM-DD')).toBe((component as any).minDate.format('YYYY-MM-DD'));
    });

    it('should return minDate when effDate is an invalid moment', () => {
      (component as any).contacts.at(0).get('effDate')?.setValue(moment.invalid());
      const result = (component as any).getTerminationMinDate(0);
      expect(result.format('YYYY-MM-DD')).toBe((component as any).minDate.format('YYYY-MM-DD'));
    });
  });

  // -- setupContactListeners (effDate -> termDate cross-validation) -----------

  describe('setupContactListeners', () => {
    it('should update termDate validity when effDate changes', () => {
      const group = (component as any).contacts.at(0);
      const termCtrl = group.get('termDate');
      const spy = spyOn(termCtrl!, 'updateValueAndValidity').and.callThrough();
      group.get('effDate')?.setValue(moment().add(2, 'days'));
      expect(spy).toHaveBeenCalled();
    });
  });

  // -- showErrorAndAutoDismiss ------------------------------------------------

  describe('showErrorAndAutoDismiss', () => {
    it('should call snackbarService.showError and auto-dismiss after 5s', fakeAsync(() => {
      (component as any).showErrorAndAutoDismiss('Test error');
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Test error');
      tick(5000);
      expect(snackBarSpy.dismiss).toHaveBeenCalled();
    }));
  });

  // -- onSubmit ---------------------------------------------------------------

  describe('onSubmit', () => {
    it('should set submitted to true', () => {
      (component as any).onSubmit();
      expect((component as any).submitted()).toBeTrue();
    });

    it('should mark all controls as touched', () => {
      const spy = spyOn(component.contactForm, 'markAllAsTouched');
      (component as any).onSubmit();
      expect(spy).toHaveBeenCalled();
    });

    it('should not call API when form is invalid', fakeAsync(() => {
      (component as any).onSubmit();
      tick(5000);
      expect(apiServiceSpy.createContact).not.toHaveBeenCalled();
    }));

    it('should show error snackbar when form is invalid', fakeAsync(() => {
      (component as any).onSubmit();
      tick(5000);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please correct the errors in the form');
    }));

    it('should emit savedData and skip API call when savedData exists and form is not dirty', () => {
      TestBed.resetTestingModule();
      buildComponent({ savedData: [mockSavedContact] });

      const emitSpy = spyOn(component.saveSuccess, 'emit');
      // Form is not dirty because we just patched it
      (component as any).onSubmit();
      expect(emitSpy).toHaveBeenCalledWith([mockSavedContact]);
      expect(apiServiceSpy.createContact).not.toHaveBeenCalled();
    });

    // -- Duplicate contact type detection ------------------------------------

    describe('duplicate contact type detection', () => {
      it('should show error when duplicate contact types exist within the form', fakeAsync(() => {
        fillValidContact(0);
        (component as any).addContact();
        fillValidContact(1);
        // Both contacts have CT1
        (component as any).onSubmit();
        tick(5000);
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Duplicate contact type: CT1');
        expect(apiServiceSpy.createContact).not.toHaveBeenCalled();
      }));

      it('should show error when new contact type matches an already-saved contact type', fakeAsync(() => {
        TestBed.resetTestingModule();
        buildComponent({ savedData: [mockSavedContact], customerId: 'CUST-001' });

        // Make form dirty so it does not skip
        component.contactForm.markAsDirty();

        // Change the existing saved contact's type in the form so the form-level
        // duplicate check passes, but the DB check still detects the conflict.
        (component as any).contacts.at(0).patchValue({ contactType: 'CT2' });

        // Add a new contact whose type matches the original savedData type (CT1)
        (component as any).addContact();
        const newIndex = (component as any).contacts.length - 1;
        fillValidContact(newIndex);
        (component as any).contacts.at(newIndex).patchValue({ contactType: 'CT1' });

        (component as any).onSubmit();
        tick(5000);
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Contact type CT1 already exists');
        expect(apiServiceSpy.createContact).not.toHaveBeenCalled();
      }));

      it('should not flag duplicates when contact types are unique', fakeAsync(() => {
        fillValidContact(0);
        (component as any).addContact();
        fillValidContact(1);
        (component as any).contacts.at(1).patchValue({ contactType: 'CT2' });

        apiServiceSpy.createContact.and.returnValue(of({ instId: 'NEW-1' }));
        apiServiceSpy.getContacts.and.returnValue(of([]));

        (component as any).onSubmit();
        tick(5000);
        expect(apiServiceSpy.createContact).toHaveBeenCalled();
      }));
    });

    // -- No new contacts to save (all existing) ------------------------------

    describe('no new contacts to save', () => {
      it('should emit saveSuccess with savedData when all contacts are existing', fakeAsync(() => {
        TestBed.resetTestingModule();
        buildComponent({ savedData: [mockSavedContact], customerId: 'CUST-001' });

        // Make form dirty so it doesn't skip at the dirty check
        component.contactForm.markAsDirty();

        const emitSpy = spyOn(component.saveSuccess, 'emit');
        (component as any).onSubmit();
        tick(5000);
        // All items are existing (have instId), so no API calls should be made
        expect(emitSpy).toHaveBeenCalledWith([mockSavedContact]);
        expect(apiServiceSpy.createContact).not.toHaveBeenCalled();
      }));

      it('should set saving to false when all contacts are existing', fakeAsync(() => {
        TestBed.resetTestingModule();
        buildComponent({ savedData: [mockSavedContact], customerId: 'CUST-001' });
        component.contactForm.markAsDirty();

        const emitSpy = spyOn(component.savingChange, 'emit');
        (component as any).onSubmit();
        tick(5000);
        expect(emitSpy).toHaveBeenCalledWith(false);
      }));
    });

    // -- Create (no savedData) -----------------------------------------------

    describe('create (no savedData)', () => {
      const savedContacts = [
        { instId: 'NEW-001', contactType: 'CT1', firstName: 'Jane' }
      ];

      beforeEach(() => {
        fillValidContact(0);
        apiServiceSpy.createContact.and.returnValue(of({ instId: 'NEW-001' }));
        apiServiceSpy.getContacts.and.returnValue(of(savedContacts));
      });

      it('should call createContact with customerId and payload', fakeAsync(() => {
        (component as any).onSubmit();
        tick(5000);
        expect(apiServiceSpy.createContact).toHaveBeenCalled();
        const [custId, payload] = apiServiceSpy.createContact.calls.mostRecent().args;
        expect(custId).toBe('');
        expect(payload.firstName).toBe('Jane');
        expect(payload.lastName).toBe('Smith');
      }));

      it('should emit savingChange true then false', fakeAsync(() => {
        const spy = spyOn(component.savingChange, 'emit');
        (component as any).onSubmit();
        tick(5000);
        expect(spy).toHaveBeenCalledWith(true);
        expect(spy).toHaveBeenCalledWith(false);
      }));

      it('should show success snackbar with singular message for one contact', fakeAsync(() => {
        (component as any).onSubmit();
        tick(5000);
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('1 contact saved successfully');
      }));

      it('should show success snackbar with plural message for multiple contacts', fakeAsync(() => {
        (component as any).addContact();
        fillValidContact(1);
        (component as any).contacts.at(1).patchValue({ contactType: 'CT2' });
        apiServiceSpy.getContacts.and.returnValue(of([savedContacts[0], { instId: 'NEW-002' }]));
        (component as any).onSubmit();
        tick(5000);
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('2 contacts saved successfully');
      }));

      it('should emit saveSuccess with saved contacts from API', fakeAsync(() => {
        const spy = spyOn(component.saveSuccess, 'emit');
        (component as any).onSubmit();
        tick(5000);
        expect(spy).toHaveBeenCalledWith(savedContacts);
      }));

      it('should strip phone formatting in payload for dayPhoneNo', fakeAsync(() => {
        const group = (component as any).contacts.at(0);
        group.get('dayPhone')?.setValue('214-555-0100');
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createContact.calls.mostRecent().args[1];
        expect(payload.dayPhoneNo).toBe('2145550100');
      }));

      it('should strip phone formatting in payload for nightPhoneNo', fakeAsync(() => {
        const group = (component as any).contacts.at(0);
        group.get('nightPhone')?.setValue('713-555-0200');
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createContact.calls.mostRecent().args[1];
        expect(payload.nightPhoneNo).toBe('7135550200');
      }));

      it('should strip phone formatting in payload for faxNo', fakeAsync(() => {
        const group = (component as any).contacts.at(0);
        group.get('faxNumber')?.setValue('817-555-0300');
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createContact.calls.mostRecent().args[1];
        expect(payload.faxNo).toBe('8175550300');
      }));

      it('should format effDate as YYYY-MM-DD in payload', fakeAsync(() => {
        const group = (component as any).contacts.at(0);
        const date = moment('2030-06-15');
        group.get('effDate')?.setValue(date);
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createContact.calls.mostRecent().args[1];
        expect(payload.effDate).toBe('2030-06-15');
      }));

      it('should set termDate to null when not provided', fakeAsync(() => {
        const group = (component as any).contacts.at(0);
        group.get('termDate')?.setValue(null);
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createContact.calls.mostRecent().args[1];
        expect(payload.termDate).toBeNull();
      }));

      it('should format termDate as YYYY-MM-DD when provided', fakeAsync(() => {
        const group = (component as any).contacts.at(0);
        group.get('termDate')?.setValue(moment('2030-12-31'));
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createContact.calls.mostRecent().args[1];
        expect(payload.termDate).toBe('2030-12-31');
      }));

      it('should set optional fields to null when empty', fakeAsync(() => {
        const group = (component as any).contacts.at(0);
        group.patchValue({ salutation: '', title: '', nightPhone: '', faxNumber: '' });
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createContact.calls.mostRecent().args[1];
        expect(payload.salutation).toBeNull();
        expect(payload.title).toBeNull();
        expect(payload.nightPhoneNo).toBeNull();
        expect(payload.faxNo).toBeNull();
      }));

      it('should map dayPhone form field to dayPhoneNo in payload', fakeAsync(() => {
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createContact.calls.mostRecent().args[1];
        expect(payload.dayPhoneNo).toBeDefined();
        expect(payload.dayPhone).toBeUndefined();
      }));

      it('should map nightPhone form field to nightPhoneNo in payload', fakeAsync(() => {
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createContact.calls.mostRecent().args[1];
        expect(payload.nightPhoneNo).toBeDefined();
        expect(payload.nightPhone).toBeUndefined();
      }));

      it('should map faxNumber form field to faxNo in payload', fakeAsync(() => {
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createContact.calls.mostRecent().args[1];
        expect(payload.faxNo).toBeDefined();
        expect(payload.faxNumber).toBeUndefined();
      }));

      it('should call getContacts after all createContact calls succeed', fakeAsync(() => {
        (component as any).onSubmit();
        tick(5000);
        expect(apiServiceSpy.getContacts).toHaveBeenCalledWith('');
      }));
    });

    // -- API error handling ---------------------------------------------------

    describe('API error handling', () => {
      beforeEach(() => {
        fillValidContact(0);
      });

      it('should show default error message when error has no details', fakeAsync(() => {
        apiServiceSpy.createContact.and.returnValue(throwError(() => ({ error: {} })));
        apiServiceSpy.getContacts.and.returnValue(of([]));
        (component as any).onSubmit();
        tick(5000);
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to save contact details');
      }));

      it('should show nested errorResponse.error message', fakeAsync(() => {
        apiServiceSpy.createContact.and.returnValue(
          throwError(() => ({
            error: { errorResponse: { error: 'Duplicate contact' } }
          }))
        );
        apiServiceSpy.getContacts.and.returnValue(of([]));
        (component as any).onSubmit();
        tick(5000);
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Duplicate contact');
      }));

      it('should show error.message when errorResponse is missing', fakeAsync(() => {
        apiServiceSpy.createContact.and.returnValue(
          throwError(() => ({
            error: { message: 'Server validation failed' }
          }))
        );
        apiServiceSpy.getContacts.and.returnValue(of([]));
        (component as any).onSubmit();
        tick(5000);
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Server validation failed');
      }));

      it('should set saving to false on error', fakeAsync(() => {
        apiServiceSpy.createContact.and.returnValue(throwError(() => ({ error: {} })));
        apiServiceSpy.getContacts.and.returnValue(of([]));
        (component as any).onSubmit();
        tick(5000);
        expect((component as any).saving()).toBeFalse();
      }));

      it('should emit savingChange false on error', fakeAsync(() => {
        apiServiceSpy.createContact.and.returnValue(throwError(() => ({ error: {} })));
        apiServiceSpy.getContacts.and.returnValue(of([]));
        const spy = spyOn(component.savingChange, 'emit');
        (component as any).onSubmit();
        tick(5000);
        expect(spy).toHaveBeenCalledWith(false);
      }));

      it('should log error to console', fakeAsync(() => {
        apiServiceSpy.createContact.and.returnValue(throwError(() => ({ error: {} })));
        apiServiceSpy.getContacts.and.returnValue(of([]));
        (component as any).onSubmit();
        tick(5000);
        expect(console.error).toHaveBeenCalled();
      }));

      it('should refresh savedData on error when contacts exist', fakeAsync(() => {
        const existingContacts = [{ instId: 'EXIST-001', contactType: 'CT1' }];
        apiServiceSpy.createContact.and.returnValue(throwError(() => ({ error: {} })));
        apiServiceSpy.getContacts.and.returnValue(of(existingContacts));
        (component as any).onSubmit();
        tick(5000);
        expect(apiServiceSpy.getContacts).toHaveBeenCalled();
        expect(component.savedData).toEqual(existingContacts);
      }));

      it('should not update savedData on error when getContacts returns empty', fakeAsync(() => {
        apiServiceSpy.createContact.and.returnValue(throwError(() => ({ error: {} })));
        apiServiceSpy.getContacts.and.returnValue(of([]));
        const originalSavedData = component.savedData;
        (component as any).onSubmit();
        tick(5000);
        expect(component.savedData).toEqual(originalSavedData);
      }));

      it('should not update savedData on error when getContacts returns null', fakeAsync(() => {
        apiServiceSpy.createContact.and.returnValue(throwError(() => ({ error: {} })));
        apiServiceSpy.getContacts.and.returnValue(of(null as any));
        const originalSavedData = component.savedData;
        (component as any).onSubmit();
        tick(5000);
        expect(component.savedData).toEqual(originalSavedData);
      }));
    });
  });

  // -- chapterChanged$ --------------------------------------------------------

  describe('chapterChanged$', () => {
    it('should update effDate and termDate validators on all contacts when chapter changes', () => {
      const group = (component as any).contacts.at(0);
      const effCtrl = group.get('effDate')!;
      const termCtrl = group.get('termDate')!;
      const effSpy = spyOn(effCtrl, 'setValidators').and.callThrough();
      const termSpy = spyOn(termCtrl, 'setValidators').and.callThrough();

      chapterChanged$.next();

      expect(effSpy).toHaveBeenCalled();
      expect(termSpy).toHaveBeenCalled();
    });

    it('should call updateValueAndValidity on effDate and termDate', () => {
      const group = (component as any).contacts.at(0);
      const effCtrl = group.get('effDate')!;
      const termCtrl = group.get('termDate')!;
      const effSpy = spyOn(effCtrl, 'updateValueAndValidity').and.callThrough();
      const termSpy = spyOn(termCtrl, 'updateValueAndValidity').and.callThrough();

      chapterChanged$.next();

      expect(effSpy).toHaveBeenCalled();
      expect(termSpy).toHaveBeenCalled();
    });

    it('should update minDate when chapter changes', () => {
      chapterChanged$.next();
      expect((component as any).minDate).toBeTruthy();
    });

    it('should update validators for multiple contacts', () => {
      (component as any).addContact();
      expect((component as any).contacts.length).toBe(2);

      const spies: jasmine.Spy[] = [];
      for (let i = 0; i < (component as any).contacts.length; i++) {
        spies.push(spyOn((component as any).contacts.at(i).get('effDate')!, 'setValidators').and.callThrough());
      }

      chapterChanged$.next();

      spies.forEach(spy => expect(spy).toHaveBeenCalled());
    });
  });

  // -- ngOnDestroy ------------------------------------------------------------

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const destroy$ = (component as any).destroy$ as Subject<void>;
      const spy = spyOn(destroy$, 'complete');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });

    it('should call next on destroy$', () => {
      const destroy$ = (component as any).destroy$ as Subject<void>;
      const spy = spyOn(destroy$, 'next');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });
  });

  // -- With savedData ---------------------------------------------------------

  describe('with savedData', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      buildComponent({ savedData: [mockSavedContact] });
    });

    it('should populate form with saved contact data', () => {
      const group = (component as any).contacts.at(0);
      expect(group.get('contactType')?.value).toBe('CT1');
      expect(group.get('firstName')?.value).toBe('John');
      expect(group.get('lastName')?.value).toBe('Doe');
      expect(group.get('salutation')?.value).toBe('Mr');
      expect(group.get('title')?.value).toBe('Director');
      expect(group.get('dayPhone')?.value).toBe('2145550100');
      expect(group.get('nightPhone')?.value).toBe('7135550200');
      expect(group.get('faxNumber')?.value).toBe('8175550300');
    });

    it('should convert effDate string to moment', () => {
      const value = (component as any).contacts.at(0).get('effDate')?.value;
      expect(moment.isMoment(value)).toBeTrue();
      expect(value.format('YYYY-MM-DD')).toBe('2099-01-01');
    });

    it('should convert termDate string to moment', () => {
      const value = (component as any).contacts.at(0).get('termDate')?.value;
      expect(moment.isMoment(value)).toBeTrue();
      expect(value.format('YYYY-MM-DD')).toBe('2099-12-31');
    });

    it('should not add a default contact when savedData is provided', () => {
      expect((component as any).contacts.length).toBe(1);
    });

    it('should handle multiple saved contacts', () => {
      TestBed.resetTestingModule();
      const secondContact = { ...mockSavedContact, instId: 'INST-002', contactType: 'CT2', firstName: 'Jane' };
      buildComponent({ savedData: [mockSavedContact, secondContact] });
      expect((component as any).contacts.length).toBe(2);
    });

    it('should use dayPhoneNo field for dayPhone', () => {
      const group = (component as any).contacts.at(0);
      expect(group.get('dayPhone')?.value).toBe('2145550100');
    });

    it('should use nightPhoneNo field for nightPhone', () => {
      const group = (component as any).contacts.at(0);
      expect(group.get('nightPhone')?.value).toBe('7135550200');
    });

    it('should use faxNo field for faxNumber', () => {
      const group = (component as any).contacts.at(0);
      expect(group.get('faxNumber')?.value).toBe('8175550300');
    });

    it('should use dayPhone field when dayPhoneNo is absent', () => {
      TestBed.resetTestingModule();
      const dataWithDayPhone = { ...mockSavedContact, dayPhoneNo: undefined, dayPhone: '9725551111' };
      buildComponent({ savedData: [dataWithDayPhone] });
      expect((component as any).contacts.at(0).get('dayPhone')?.value).toBe('9725551111');
    });

    it('should use nightPhone field when nightPhoneNo is absent', () => {
      TestBed.resetTestingModule();
      const dataWithNightPhone = { ...mockSavedContact, nightPhoneNo: undefined, nightPhone: '4695552222' };
      buildComponent({ savedData: [dataWithNightPhone] });
      expect((component as any).contacts.at(0).get('nightPhone')?.value).toBe('4695552222');
    });

    it('should use faxNumber field when faxNo is absent', () => {
      TestBed.resetTestingModule();
      const dataWithFaxNumber = { ...mockSavedContact, faxNo: undefined, faxNumber: '2145553333' };
      buildComponent({ savedData: [dataWithFaxNumber] });
      expect((component as any).contacts.at(0).get('faxNumber')?.value).toBe('2145553333');
    });
  });

  describe('with savedData without dates', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      const dataNoDate = { ...mockSavedContact, effDate: '', termDate: null };
      buildComponent({ savedData: [dataNoDate] });
    });

    it('should not override effDate when saved effDate is empty', () => {
      const group = (component as any).contacts.at(0);
      const value = group.get('effDate')?.value;
      // The empty string is falsy, so the if(contact.effDate) block is skipped
      // The patchValue already sets it to '' but the moment conversion doesn't happen
      expect(value).toBeFalsy();
    });

    it('should not set termDate when saved termDate is null', () => {
      const group = (component as any).contacts.at(0);
      const value = group.get('termDate')?.value;
      expect(value).toBeNull();
    });
  });

  // -- Form validation rules --------------------------------------------------

  describe('form validation', () => {
    it('should require contactType', () => {
      const group = (component as any).contacts.at(0);
      group.get('contactType')?.setValue('');
      expect(group.get('contactType')?.hasError('required')).toBeTrue();
    });

    it('should require firstName', () => {
      const group = (component as any).contacts.at(0);
      group.get('firstName')?.setValue('');
      expect(group.get('firstName')?.hasError('required')).toBeTrue();
    });

    it('should require lastName', () => {
      const group = (component as any).contacts.at(0);
      group.get('lastName')?.setValue('');
      expect(group.get('lastName')?.hasError('required')).toBeTrue();
    });

    it('should require dayPhone', () => {
      const group = (component as any).contacts.at(0);
      group.get('dayPhone')?.setValue('');
      expect(group.get('dayPhone')?.hasError('required')).toBeTrue();
    });

    it('should require effDate', () => {
      const group = (component as any).contacts.at(0);
      group.get('effDate')?.setValue(null);
      expect(group.get('effDate')?.hasError('required')).toBeTrue();
    });

    it('should enforce maxLength on firstName (50)', () => {
      const group = (component as any).contacts.at(0);
      group.get('firstName')?.setValue('a'.repeat(51));
      expect(group.get('firstName')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength on lastName (50)', () => {
      const group = (component as any).contacts.at(0);
      group.get('lastName')?.setValue('a'.repeat(51));
      expect(group.get('lastName')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength on salutation (10)', () => {
      const group = (component as any).contacts.at(0);
      group.get('salutation')?.setValue('a'.repeat(11));
      expect(group.get('salutation')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength on title (10)', () => {
      const group = (component as any).contacts.at(0);
      group.get('title')?.setValue('a'.repeat(11));
      expect(group.get('title')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength on dayPhone (20)', () => {
      const group = (component as any).contacts.at(0);
      group.get('dayPhone')?.setValue('1'.repeat(21));
      expect(group.get('dayPhone')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength on nightPhone (20)', () => {
      const group = (component as any).contacts.at(0);
      group.get('nightPhone')?.setValue('1'.repeat(21));
      expect(group.get('nightPhone')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength on faxNumber (20)', () => {
      const group = (component as any).contacts.at(0);
      group.get('faxNumber')?.setValue('1'.repeat(21));
      expect(group.get('faxNumber')?.hasError('maxlength')).toBeTrue();
    });

    it('should not require salutation', () => {
      const group = (component as any).contacts.at(0);
      group.get('salutation')?.setValue('');
      expect(group.get('salutation')?.hasError('required')).toBeFalsy();
    });

    it('should not require title', () => {
      const group = (component as any).contacts.at(0);
      group.get('title')?.setValue('');
      expect(group.get('title')?.hasError('required')).toBeFalsy();
    });

    it('should not require nightPhone', () => {
      const group = (component as any).contacts.at(0);
      group.get('nightPhone')?.setValue('');
      expect(group.get('nightPhone')?.hasError('required')).toBeFalsy();
    });

    it('should not require faxNumber', () => {
      const group = (component as any).contacts.at(0);
      group.get('faxNumber')?.setValue('');
      expect(group.get('faxNumber')?.hasError('required')).toBeFalsy();
    });

    it('should not require termDate', () => {
      const group = (component as any).contacts.at(0);
      group.get('termDate')?.setValue(null);
      expect(group.get('termDate')?.hasError('required')).toBeFalsy();
    });

    it('should reject non-alphabetic characters in firstName', () => {
      const group = (component as any).contacts.at(0);
      group.get('firstName')?.setValue('John123');
      expect(group.get('firstName')?.hasError('alphabeticOnly')).toBeTrue();
    });

    it('should reject non-alphabetic characters in lastName', () => {
      const group = (component as any).contacts.at(0);
      group.get('lastName')?.setValue('Doe@#');
      expect(group.get('lastName')?.hasError('alphabeticOnly')).toBeTrue();
    });

    it('should reject non-alphabetic characters in salutation', () => {
      const group = (component as any).contacts.at(0);
      group.get('salutation')?.setValue('Mr1');
      expect(group.get('salutation')?.hasError('alphabeticOnly')).toBeTrue();
    });

    it('should reject non-alphabetic characters in title', () => {
      const group = (component as any).contacts.at(0);
      group.get('title')?.setValue('Dir#');
      expect(group.get('title')?.hasError('alphabeticOnly')).toBeTrue();
    });

    it('should allow alphabetic characters with spaces and periods in firstName', () => {
      const group = (component as any).contacts.at(0);
      group.get('firstName')?.setValue('Mary Jo');
      expect(group.get('firstName')?.hasError('alphabeticOnly')).toBeFalsy();
    });

    it('should validate phone number format for dayPhone', () => {
      const group = (component as any).contacts.at(0);
      group.get('dayPhone')?.setValue('123');
      expect(group.get('dayPhone')?.hasError('invalidPhoneNumber')).toBeTrue();
    });

    it('should accept valid 10-digit phone for dayPhone', () => {
      const group = (component as any).contacts.at(0);
      group.get('dayPhone')?.setValue('2145551234');
      expect(group.get('dayPhone')?.hasError('invalidPhoneNumber')).toBeFalsy();
    });

    it('should accept valid 7-digit phone for nightPhone', () => {
      const group = (component as any).contacts.at(0);
      group.get('nightPhone')?.setValue('5551234');
      expect(group.get('nightPhone')?.hasError('invalidPhoneNumber')).toBeFalsy();
    });

    it('should validate phone number format for faxNumber', () => {
      const group = (component as any).contacts.at(0);
      group.get('faxNumber')?.setValue('12345');
      expect(group.get('faxNumber')?.hasError('invalidPhoneNumber')).toBeTrue();
    });
  });

  // -- stripPhone (private) ---------------------------------------------------

  describe('stripPhone', () => {
    it('should strip non-digit characters', () => {
      const result = (component as any).stripPhone('214-555-0100');
      expect(result).toBe('2145550100');
    });

    it('should return null for null input', () => {
      const result = (component as any).stripPhone(null);
      expect(result).toBeNull();
    });

    it('should return digits-only string unchanged', () => {
      const result = (component as any).stripPhone('2145550100');
      expect(result).toBe('2145550100');
    });

    it('should return empty string for empty input', () => {
      const result = (component as any).stripPhone('');
      expect(result).toBe('');
    });
  });
});
