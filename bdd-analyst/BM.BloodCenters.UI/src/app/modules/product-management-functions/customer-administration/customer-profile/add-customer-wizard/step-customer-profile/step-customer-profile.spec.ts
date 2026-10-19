import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, of, throwError } from 'rxjs';
import moment from 'moment';

import { StepCustomerProfileComponent } from './step-customer-profile';
import { AddCustomerWizardApiService } from '../add-customer-wizard-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { CustomerProfileDto } from '../../models/customer-profile.model';

// ── Mock data ────────────────────────────────────────────────────────────────

const mockCustomerTypes = [
  { code: 'HO', description: 'Hospital' },
  { code: 'EX', description: 'Export' }
];

const mockStateCodes = [
  { code: 'TX', description: 'Texas' },
  { code: 'CA', description: 'California' }
];

const mockPayees = [
  { customerId: 'PAY001', name: 'Payee One' },
  { customerId: 'PAY002', name: 'Payee Two' }
];

const mockPlasmaTypes = [
  { code: 'P1', description: 'Plasma Type 1' },
  { code: 'P2', description: 'Plasma Type 2' }
];

const mockSavedCustomer: CustomerProfileDto = {
  customerId: 'CUST-001',
  chapterId: '0001',
  name: 'Test Customer',
  customerType: 'HO',
  shortName: 'TEST',
  alphaKey: 'TST',
  intFlag: 'N',
  address1: '123 Main St',
  address2: 'Suite 100',
  address3: null,
  city: 'Dallas',
  state: 'TX',
  zip: '75201',
  country: 'USA',
  phoneNo: '2145550100',
  faxNo: '2145550200',
  intPhone: null,
  telexNo: null,
  codFlag: 'N',
  returnAcceptedFlag: 'Y',
  arAccount: 'AR001',
  fiPriceSchNo: '01',
  priceChangeFlag: null,
  ednGenFlag: 'Y',
  plasmaFileType: null,
  phApprFlag: null,
  insApprFlag: null,
  effDate: '2099-06-01',
  termDate: '2099-12-31',
  lastModifiedDate: null,
  payeeId: 'PAY001'
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('StepCustomerProfileComponent', () => {
  let component: StepCustomerProfileComponent;
  let fixture: ComponentFixture<StepCustomerProfileComponent>;
  let apiServiceSpy: jasmine.SpyObj<AddCustomerWizardApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let chapterChanged$: Subject<void>;

  function buildComponent(savedData?: CustomerProfileDto | null) {
    apiServiceSpy = jasmine.createSpyObj('AddCustomerWizardApiService', [
      'getCustomerTypes', 'getStateCodes', 'getPayees', 'getPlasmaFileTypes',
      'createCustomerProfile', 'updateCustomerProfile'
    ]);
    snackbarServiceSpy = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError', 'showInfo']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['dismiss']);
    chapterChanged$ = new Subject<void>();

    apiServiceSpy.getCustomerTypes.and.returnValue(of(mockCustomerTypes));
    apiServiceSpy.getStateCodes.and.returnValue(of(mockStateCodes));
    apiServiceSpy.getPayees.and.returnValue(of(mockPayees));
    apiServiceSpy.getPlasmaFileTypes.and.returnValue(of(mockPlasmaTypes));

    const headerServiceMock = {
      chapterChanged$: chapterChanged$.asObservable(),
      chapterTimeZone: signal('-05:00')
    };

    TestBed.configureTestingModule({
      imports: [StepCustomerProfileComponent, NoopAnimationsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AddCustomerWizardApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: HeaderService, useValue: headerServiceMock }
      ]
    });

    fixture = TestBed.createComponent(StepCustomerProfileComponent);
    component = fixture.componentInstance;

    if (savedData !== undefined) {
      component.savedData = savedData ?? null;
    }

    spyOn(console, 'error');

    fixture.detectChanges(); // triggers ngOnInit
  }

  /** Fill form with valid data so onSubmit passes validation */
  function fillValidForm() {
    component.customerForm.patchValue({
      name: 'Valid Customer',
      customerType: 'HO',
      shortName: 'VALID',
      address1: '100 Test Rd',
      city: 'DALLAS',
      state: 'TX',
      zip: '75201',
      country: 'USA',
      codFlag: 'N',
      returnAcceptedFlag: 'Y',
      arAccount: 'AR999',
      effDate: moment().add(1, 'day')
    });
  }

  // ── Default setup (new customer, no savedData) ────────────────────────────

  beforeEach(() => {
    buildComponent();
  });

  // ── Creation & form initialisation ────────────────────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialise the form with all expected controls', () => {
    const expectedControls = [
      'name', 'customerType', 'shortName', 'alphaKey', 'intFlag',
      'address1', 'address2', 'address3', 'city', 'state', 'zip', 'country',
      'phoneNo', 'faxNo', 'intPhone', 'telexNo',
      'codFlag', 'returnAcceptedFlag', 'arAccount', 'fiPriceSchNo',
      'ednGenFlag', 'plasmaFileType', 'effDate', 'termDate', 'payeeId'
    ];
    for (const ctrl of expectedControls) {
      expect(component.customerForm.get(ctrl)).toBeTruthy(`missing control: ${ctrl}`);
    }
  });

  // ── Default values for new customer ───────────────────────────────────────

  it('should default intFlag to N for a new customer', () => {
    expect(component.customerForm.get('intFlag')?.value).toBe('N');
  });

  it('should default country to USA for a new customer', () => {
    expect(component.customerForm.get('country')?.value).toBe('USA');
  });

  // ── isInternational getter ────────────────────────────────────────────────

  describe('isInternational', () => {
    it('should return false when intFlag is N', () => {
      component.customerForm.get('intFlag')?.setValue('N');
      expect((component as any).isInternational).toBeFalse();
    });

    it('should return true when intFlag is Y', () => {
      component.customerForm.get('intFlag')?.setValue('Y');
      expect((component as any).isInternational).toBeTrue();
    });
  });

  // ── f getter ──────────────────────────────────────────────────────────────

  it('should return form controls via f getter', () => {
    const controls = (component as any).f;
    expect(controls['name']).toBe(component.customerForm.controls['name']);
  });

  // ── ID helper methods ─────────────────────────────────────────────────────

  describe('ID helpers', () => {
    it('should generate element IDs with component prefix', () => {
      const id = (component as any).elementId('name');
      expect(id).toContain('step-customer-profile-');
      expect(id).toContain('-name');
    });

    it('should generate error IDs', () => {
      const id = (component as any).errorId('name');
      expect(id).toContain('-name-error');
    });

    it('should generate label IDs', () => {
      const id = (component as any).labelId('name');
      expect(id).toContain('-name-label');
    });
  });

  // ── loadDropdownData ──────────────────────────────────────────────────────

  describe('loadDropdownData', () => {
    it('should call all four dropdown API methods', () => {
      expect(apiServiceSpy.getCustomerTypes).toHaveBeenCalled();
      expect(apiServiceSpy.getStateCodes).toHaveBeenCalled();
      expect(apiServiceSpy.getPayees).toHaveBeenCalled();
      expect(apiServiceSpy.getPlasmaFileTypes).toHaveBeenCalled();
    });

    it('should populate customer types on success', () => {
      expect((component as any).customerTypes()).toEqual(mockCustomerTypes);
      expect((component as any).filteredCustomerTypes).toEqual(mockCustomerTypes);
    });

    it('should populate state codes on success', () => {
      expect((component as any).stateCodes()).toEqual(mockStateCodes);
      expect((component as any).filteredStateCodes).toEqual(mockStateCodes);
    });

    it('should populate payees on success', () => {
      expect((component as any).payees()).toEqual(mockPayees);
      expect((component as any).filteredPayees).toEqual(mockPayees);
    });

    it('should populate plasma types on success', () => {
      expect((component as any).plasmaTypes()).toEqual(mockPlasmaTypes);
      expect((component as any).filteredPlasmaTypes).toEqual(mockPlasmaTypes);
    });

    it('should set loading to false after plasma types load (last call)', () => {
      expect((component as any).loading()).toBeFalse();
    });

    it('should emit loadingChange true then false', () => {
      const emitSpy = spyOn(component.loadingChange, 'emit');
      (component as any).loadDropdownData();
      expect(emitSpy).toHaveBeenCalledWith(true);
      expect(emitSpy).toHaveBeenCalledWith(false);
    });
  });

  describe('loadDropdownData errors', () => {
    it('should show error when customer types fail', fakeAsync(() => {
      apiServiceSpy.getCustomerTypes.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadDropdownData();
      tick(5000);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load customer types');
    }));

    it('should show error when state codes fail', fakeAsync(() => {
      apiServiceSpy.getStateCodes.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadDropdownData();
      tick(5000);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load state codes');
    }));

    it('should show error when payees fail', fakeAsync(() => {
      apiServiceSpy.getPayees.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadDropdownData();
      tick(5000);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load payees');
    }));

    it('should show error when plasma types fail', fakeAsync(() => {
      apiServiceSpy.getPlasmaFileTypes.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadDropdownData();
      tick(5000);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load plasma file types');
    }));

    it('should set loading to false even when plasma types fail', () => {
      apiServiceSpy.getPlasmaFileTypes.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadDropdownData();
      expect((component as any).loading()).toBeFalse();
    });
  });

  // ── intFlag form listener ─────────────────────────────────────────────────

  describe('intFlag changes', () => {
    it('should set zipMaxLength to 10 for international', () => {
      component.customerForm.get('intFlag')?.setValue('Y');
      expect((component as any).zipMaxLength).toBe(10);
    });

    it('should set zipMaxLength to 5 for domestic', () => {
      component.customerForm.get('intFlag')?.setValue('Y');
      component.customerForm.get('intFlag')?.setValue('N');
      expect((component as any).zipMaxLength).toBe(5);
    });

    it('should make state not required for international', () => {
      component.customerForm.get('intFlag')?.setValue('Y');
      component.customerForm.get('state')?.setValue('');
      component.customerForm.get('state')?.updateValueAndValidity();
      expect(component.customerForm.get('state')?.valid).toBeTrue();
    });

    it('should make state required for domestic', () => {
      component.customerForm.get('intFlag')?.setValue('N');
      component.customerForm.get('state')?.setValue('');
      component.customerForm.get('state')?.updateValueAndValidity();
      expect(component.customerForm.get('state')?.hasError('required')).toBeTrue();
    });
  });

  // ── effDate form listener ─────────────────────────────────────────────────

  describe('effDate changes', () => {
    it('should update termDate validity when effDate changes', () => {
      const termCtrl = component.customerForm.get('termDate');
      const spy = spyOn(termCtrl!, 'updateValueAndValidity').and.callThrough();
      component.customerForm.get('effDate')?.setValue(moment().add(2, 'days'));
      expect(spy).toHaveBeenCalled();
    });
  });

  // ── Search filtering ──────────────────────────────────────────────────────

  describe('search controls', () => {
    it('should filter customer types by code', () => {
      (component as any).customerTypeSearchCtrl.setValue('ho');
      expect((component as any).filteredCustomerTypes.length).toBe(1);
      expect((component as any).filteredCustomerTypes[0].code).toBe('HO');
    });

    it('should filter customer types by description', () => {
      (component as any).customerTypeSearchCtrl.setValue('export');
      expect((component as any).filteredCustomerTypes.length).toBe(1);
      expect((component as any).filteredCustomerTypes[0].code).toBe('EX');
    });

    it('should filter state codes by code', () => {
      (component as any).stateSearchCtrl.setValue('tx');
      expect((component as any).filteredStateCodes.length).toBe(1);
      expect((component as any).filteredStateCodes[0].code).toBe('TX');
    });

    it('should filter state codes by description', () => {
      (component as any).stateSearchCtrl.setValue('cali');
      expect((component as any).filteredStateCodes.length).toBe(1);
      expect((component as any).filteredStateCodes[0].code).toBe('CA');
    });

    it('should filter payees by customerId', () => {
      (component as any).payeeSearchCtrl.setValue('pay001');
      expect((component as any).filteredPayees.length).toBe(1);
      expect((component as any).filteredPayees[0].customerId).toBe('PAY001');
    });

    it('should filter payees by name', () => {
      (component as any).payeeSearchCtrl.setValue('two');
      expect((component as any).filteredPayees.length).toBe(1);
      expect((component as any).filteredPayees[0].name).toBe('Payee Two');
    });

    it('should filter plasma types by code', () => {
      (component as any).plasmaTypeSearchCtrl.setValue('p1');
      expect((component as any).filteredPlasmaTypes.length).toBe(1);
      expect((component as any).filteredPlasmaTypes[0].code).toBe('P1');
    });

    it('should filter plasma types by description', () => {
      (component as any).plasmaTypeSearchCtrl.setValue('type 2');
      expect((component as any).filteredPlasmaTypes.length).toBe(1);
      expect((component as any).filteredPlasmaTypes[0].code).toBe('P2');
    });

    it('should show all items when search is cleared', () => {
      (component as any).customerTypeSearchCtrl.setValue('ho');
      expect((component as any).filteredCustomerTypes.length).toBe(1);
      (component as any).customerTypeSearchCtrl.setValue('');
      expect((component as any).filteredCustomerTypes.length).toBe(2);
    });
  });

  // ── toUpperCase ───────────────────────────────────────────────────────────

  describe('toUpperCase', () => {
    it('should convert input value to uppercase', () => {
      const input = {
        value: 'hello',
        selectionStart: 2,
        selectionEnd: 2,
        setSelectionRange: jasmine.createSpy('setSelectionRange')
      };
      const event = { target: input } as unknown as Event;
      (component as any).toUpperCase(event);
      expect(input.value).toBe('HELLO');
      expect(input.setSelectionRange).toHaveBeenCalledWith(2, 2);
    });
  });

  // ── onlyNumbers ───────────────────────────────────────────────────────────

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

  // ── stripPhoneOnFocus ─────────────────────────────────────────────────────

  describe('stripPhoneOnFocus', () => {
    it('should strip non-digit characters from a formatted phone', () => {
      component.customerForm.get('phoneNo')?.setValue('214-555-0100');
      (component as any).stripPhoneOnFocus('phoneNo');
      expect(component.customerForm.get('phoneNo')?.value).toBe('2145550100');
    });

    it('should not change a digits-only value', () => {
      component.customerForm.get('phoneNo')?.setValue('2145550100');
      (component as any).stripPhoneOnFocus('phoneNo');
      expect(component.customerForm.get('phoneNo')?.value).toBe('2145550100');
    });

    it('should do nothing when control value is empty', () => {
      component.customerForm.get('phoneNo')?.setValue('');
      (component as any).stripPhoneOnFocus('phoneNo');
      expect(component.customerForm.get('phoneNo')?.value).toBe('');
    });

    it('should do nothing when control value is null', () => {
      component.customerForm.get('phoneNo')?.setValue(null);
      (component as any).stripPhoneOnFocus('phoneNo');
      expect(component.customerForm.get('phoneNo')?.value).toBeNull();
    });
  });

  // ── formatPhoneOnBlur ─────────────────────────────────────────────────────

  describe('formatPhoneOnBlur', () => {
    it('should format a 10-digit number as xxx-xxx-xxxx', () => {
      component.customerForm.get('phoneNo')?.setValue('2145550100');
      (component as any).formatPhoneOnBlur('phoneNo');
      expect(component.customerForm.get('phoneNo')?.value).toBe('214-555-0100');
    });

    it('should format a 7-digit number as xxx-xxxx', () => {
      component.customerForm.get('phoneNo')?.setValue('5550100');
      (component as any).formatPhoneOnBlur('phoneNo');
      expect(component.customerForm.get('phoneNo')?.value).toBe('555-0100');
    });

    it('should not format other digit lengths', () => {
      component.customerForm.get('phoneNo')?.setValue('12345');
      (component as any).formatPhoneOnBlur('phoneNo');
      expect(component.customerForm.get('phoneNo')?.value).toBe('12345');
    });

    it('should do nothing when control value is empty', () => {
      component.customerForm.get('phoneNo')?.setValue('');
      (component as any).formatPhoneOnBlur('phoneNo');
      expect(component.customerForm.get('phoneNo')?.value).toBe('');
    });

    it('should do nothing when control value is null', () => {
      component.customerForm.get('phoneNo')?.setValue(null);
      (component as any).formatPhoneOnBlur('phoneNo');
      expect(component.customerForm.get('phoneNo')?.value).toBeNull();
    });
  });

  // ── Date event handlers ───────────────────────────────────────────────────

  describe('onEffectiveDateChange', () => {
    it('should update termDate validity and mark effDate as touched', () => {
      const termCtrl = component.customerForm.get('termDate')!;
      const updateSpy = spyOn(termCtrl, 'updateValueAndValidity');
      const effCtrl = component.customerForm.get('effDate')!;
      const touchSpy = spyOn(effCtrl, 'markAsTouched');
      (component as any).onEffectiveDateChange();
      expect(updateSpy).toHaveBeenCalled();
      expect(touchSpy).toHaveBeenCalled();
    });
  });

  describe('onTerminationDateChange', () => {
    it('should mark termDate as touched', () => {
      const termCtrl = component.customerForm.get('termDate')!;
      const touchSpy = spyOn(termCtrl, 'markAsTouched');
      (component as any).onTerminationDateChange();
      expect(touchSpy).toHaveBeenCalled();
    });
  });

  describe('onEffectiveDateInput', () => {
    it('should delegate to DateFieldValidationUtility.handleStartDateInput', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleStartDateInput');
      const event = { target: { value: '01-JAN-2030' } } as unknown as Event;
      (component as any).onEffectiveDateInput(event);
      expect(spy).toHaveBeenCalledWith('01-JAN-2030', component.customerForm.get('effDate'));
    });
  });

  describe('onTerminationDateInput', () => {
    it('should delegate to DateFieldValidationUtility.handleEndDateInput', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const event = { target: { value: '31-DEC-2030' } } as unknown as Event;
      (component as any).onTerminationDateInput(event);
      expect(spy).toHaveBeenCalledWith('31-DEC-2030', component.customerForm.get('termDate'));
    });
  });

  describe('getEffectiveDateError', () => {
    it('should delegate to DateFieldValidationUtility.getEffectiveDateError', () => {
      const spy = spyOn(DateFieldValidationUtility, 'getEffectiveDateError').and.returnValue('test error');
      const result = (component as any).getEffectiveDateError();
      expect(spy).toHaveBeenCalledWith(component.customerForm);
      expect(result).toBe('test error');
    });
  });

  describe('getTerminationDateError', () => {
    it('should delegate to DateFieldValidationUtility.getTerminationDateError', () => {
      const spy = spyOn(DateFieldValidationUtility, 'getTerminationDateError').and.returnValue('term error');
      const result = (component as any).getTerminationDateError();
      expect(spy).toHaveBeenCalledWith(component.customerForm);
      expect(result).toBe('term error');
    });
  });

  // ── terminationDateFilter ─────────────────────────────────────────────────

  describe('terminationDateFilter', () => {
    it('should return true for null dates', () => {
      expect((component as any).terminationDateFilter(null)).toBeTrue();
    });

    it('should return false for a date before the effective date', () => {
      const effDate = moment('2030-06-15');
      component.customerForm.get('effDate')?.setValue(effDate);
      const before = moment('2030-06-10');
      expect((component as any).terminationDateFilter(before)).toBeFalse();
    });

    it('should return true for a date equal to the effective date', () => {
      const effDate = moment('2030-06-15');
      component.customerForm.get('effDate')?.setValue(effDate);
      const same = moment('2030-06-15');
      expect((component as any).terminationDateFilter(same)).toBeTrue();
    });

    it('should return true for a date after the effective date', () => {
      const effDate = moment('2030-06-15');
      component.customerForm.get('effDate')?.setValue(effDate);
      const after = moment('2030-06-20');
      expect((component as any).terminationDateFilter(after)).toBeTrue();
    });

    it('should return true when no effective date is set', () => {
      component.customerForm.get('effDate')?.setValue(null);
      const date = moment('2030-06-10');
      expect((component as any).terminationDateFilter(date)).toBeTrue();
    });
  });

  // ── updateTerminationMinDate ──────────────────────────────────────────────

  describe('updateTerminationMinDate', () => {
    it('should fall back to minDate when effDate is null', () => {
      component.customerForm.get('effDate')?.setValue(null);
      (component as any).updateTerminationMinDate();
      expect((component as any).terminationMinDate).toEqual((component as any).minDate);
    });

    it('should use effective date when it is after minDate', () => {
      const future = moment().add(30, 'days');
      component.customerForm.get('effDate')?.setValue(future);
      (component as any).updateTerminationMinDate();
      expect((component as any).terminationMinDate.format('YYYY-MM-DD')).toBe(future.format('YYYY-MM-DD'));
    });

    it('should use minDate when effective date is before minDate', () => {
      const past = moment('2000-01-01');
      component.customerForm.get('effDate')?.setValue(past);
      (component as any).updateTerminationMinDate();
      expect((component as any).terminationMinDate.format('YYYY-MM-DD')).toBe((component as any).minDate.format('YYYY-MM-DD'));
    });

    it('should handle a Date object for effective date', () => {
      const dateObj = new Date(Date.now() + 30 * 86400000); // 30 days from now
      component.customerForm.get('effDate')?.setValue(dateObj);
      (component as any).updateTerminationMinDate();
      expect(moment.isMoment((component as any).terminationMinDate)).toBeTrue();
    });
  });

  // ── showErrorAndAutoDismiss ───────────────────────────────────────────────

  describe('showErrorAndAutoDismiss', () => {
    it('should call snackbarService.showError and auto-dismiss after 5s', fakeAsync(() => {
      (component as any).showErrorAndAutoDismiss('Test error');
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Test error');
      tick(5000);
      expect(snackBarSpy.dismiss).toHaveBeenCalled();
    }));
  });

  // ── onSubmit ──────────────────────────────────────────────────────────────

  describe('onSubmit', () => {
    it('should set submitted to true', () => {
      (component as any).onSubmit();
      expect((component as any).submitted()).toBeTrue();
    });

    it('should mark all controls as touched', () => {
      const spy = spyOn(component.customerForm, 'markAllAsTouched');
      (component as any).onSubmit();
      expect(spy).toHaveBeenCalled();
    });

    it('should not call the API when the form is invalid', fakeAsync(() => {
      (component as any).onSubmit();
      tick(5000);
      expect(apiServiceSpy.createCustomerProfile).not.toHaveBeenCalled();
      expect(apiServiceSpy.updateCustomerProfile).not.toHaveBeenCalled();
    }));

    it('should show error snackbar when form is invalid', fakeAsync(() => {
      (component as any).onSubmit();
      tick(5000);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please correct the errors in the form');
    }));

    describe('create (no savedData)', () => {
      const createdCustomer: CustomerProfileDto = {
        ...mockSavedCustomer,
        customerId: 'NEW-001'
      };

      beforeEach(() => {
        fillValidForm();
        apiServiceSpy.createCustomerProfile.and.returnValue(of(createdCustomer));
      });

      it('should call createCustomerProfile with payload', fakeAsync(() => {
        (component as any).onSubmit();
        tick(5000);
        expect(apiServiceSpy.createCustomerProfile).toHaveBeenCalled();
        const payload = apiServiceSpy.createCustomerProfile.calls.mostRecent().args[0];
        expect(payload.customerId).toBe('');
        expect(payload.name).toBe('Valid Customer');
      }));

      it('should emit savingChange true then false', fakeAsync(() => {
        const spy = spyOn(component.savingChange, 'emit');
        (component as any).onSubmit();
        tick(5000);
        expect(spy).toHaveBeenCalledWith(true);
        expect(spy).toHaveBeenCalledWith(false);
      }));

      it('should show success snackbar', fakeAsync(() => {
        (component as any).onSubmit();
        tick(5000);
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Customer profile created successfully');
      }));

      it('should emit saveSuccess with the result', fakeAsync(() => {
        const spy = spyOn(component.saveSuccess, 'emit');
        (component as any).onSubmit();
        tick(5000);
        expect(spy).toHaveBeenCalledWith(createdCustomer);
      }));

      it('should uppercase shortName and city in payload', fakeAsync(() => {
        component.customerForm.get('shortName')?.setValue('lower');
        component.customerForm.get('city')?.setValue('lower');
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createCustomerProfile.calls.mostRecent().args[0];
        expect(payload.shortName).toBe('LOWER');
        expect(payload.city).toBe('LOWER');
      }));

      it('should strip phone formatting in payload', fakeAsync(() => {
        component.customerForm.get('phoneNo')?.setValue('214-555-0100');
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createCustomerProfile.calls.mostRecent().args[0];
        expect(payload.phoneNo).toBe('2145550100');
      }));

      it('should format effDate as YYYY-MM-DD in payload', fakeAsync(() => {
        const date = moment('2030-06-15');
        component.customerForm.get('effDate')?.setValue(date);
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createCustomerProfile.calls.mostRecent().args[0];
        expect(payload.effDate).toBe('2030-06-15');
      }));

      it('should set termDate to null when not provided', fakeAsync(() => {
        component.customerForm.get('termDate')?.setValue(null);
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createCustomerProfile.calls.mostRecent().args[0];
        expect(payload.termDate).toBeNull();
      }));
    });

    describe('update (savedData with customerId)', () => {
      const updatedCustomer: CustomerProfileDto = { ...mockSavedCustomer };

      beforeEach(() => {
        // Rebuild with savedData to enable update path
        TestBed.resetTestingModule();
        buildComponent(mockSavedCustomer);
        fillValidForm();
        apiServiceSpy.updateCustomerProfile.and.returnValue(of(updatedCustomer));
      });

      it('should call updateCustomerProfile with customerId', fakeAsync(() => {
        (component as any).onSubmit();
        tick(5000);
        expect(apiServiceSpy.updateCustomerProfile).toHaveBeenCalled();
        const [id] = apiServiceSpy.updateCustomerProfile.calls.mostRecent().args;
        expect(id).toBe('CUST-001');
      }));

      it('should show update success message', fakeAsync(() => {
        (component as any).onSubmit();
        tick(5000);
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Customer profile updated successfully');
      }));
    });

    describe('API error handling', () => {
      beforeEach(() => {
        fillValidForm();
      });

      it('should show default error message when error has no details', fakeAsync(() => {
        apiServiceSpy.createCustomerProfile.and.returnValue(
          throwError(() => ({ error: {} }))
        );
        (component as any).onSubmit();
        tick(5000);
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to save customer profile');
      }));

      it('should show nested errorResponse.error message', fakeAsync(() => {
        apiServiceSpy.createCustomerProfile.and.returnValue(
          throwError(() => ({
            error: { errorResponse: { error: 'Duplicate AR account' } }
          }))
        );
        (component as any).onSubmit();
        tick(5000);
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Duplicate AR account');
      }));

      it('should show error.message when errorResponse is missing', fakeAsync(() => {
        apiServiceSpy.createCustomerProfile.and.returnValue(
          throwError(() => ({
            error: { message: 'Server validation failed' }
          }))
        );
        (component as any).onSubmit();
        tick(5000);
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Server validation failed');
      }));

      it('should set saving to false on error', fakeAsync(() => {
        apiServiceSpy.createCustomerProfile.and.returnValue(
          throwError(() => ({ error: {} }))
        );
        (component as any).onSubmit();
        tick(5000);
        expect((component as any).saving()).toBeFalse();
      }));

      it('should log error to console', fakeAsync(() => {
        const err = { error: {} };
        apiServiceSpy.createCustomerProfile.and.returnValue(throwError(() => err));
        (component as any).onSubmit();
        tick(5000);
        expect(console.error).toHaveBeenCalled();
      }));
    });
  });

  // ── chapterChanged$ ──────────────────────────────────────────────────────

  describe('chapterChanged$', () => {
    it('should update effDate and termDate validators when chapter changes', () => {
      const effCtrl = component.customerForm.get('effDate')!;
      const termCtrl = component.customerForm.get('termDate')!;
      const effSpy = spyOn(effCtrl, 'setValidators').and.callThrough();
      const termSpy = spyOn(termCtrl, 'setValidators').and.callThrough();

      chapterChanged$.next();

      expect(effSpy).toHaveBeenCalled();
      expect(termSpy).toHaveBeenCalled();
    });

    it('should call updateValueAndValidity on effDate and termDate', () => {
      const effCtrl = component.customerForm.get('effDate')!;
      const termCtrl = component.customerForm.get('termDate')!;
      const effSpy = spyOn(effCtrl, 'updateValueAndValidity').and.callThrough();
      const termSpy = spyOn(termCtrl, 'updateValueAndValidity').and.callThrough();

      chapterChanged$.next();

      expect(effSpy).toHaveBeenCalled();
      expect(termSpy).toHaveBeenCalled();
    });
  });

  // ── ngOnDestroy ───────────────────────────────────────────────────────────

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

  // ── With savedData ────────────────────────────────────────────────────────

  describe('with savedData', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      buildComponent(mockSavedCustomer);
    });

    it('should populate form with saved customer data', () => {
      expect(component.customerForm.get('name')?.value).toBe('Test Customer');
      expect(component.customerForm.get('customerType')?.value).toBe('HO');
      expect(component.customerForm.get('shortName')?.value).toBe('TEST');
      expect(component.customerForm.get('alphaKey')?.value).toBe('TST');
      expect(component.customerForm.get('intFlag')?.value).toBe('N');
      expect(component.customerForm.get('address1')?.value).toBe('123 Main St');
      expect(component.customerForm.get('address2')?.value).toBe('Suite 100');
      expect(component.customerForm.get('city')?.value).toBe('Dallas');
      expect(component.customerForm.get('state')?.value).toBe('TX');
      expect(component.customerForm.get('zip')?.value).toBe('75201');
      expect(component.customerForm.get('country')?.value).toBe('USA');
    });

    it('should convert effDate string to moment', () => {
      const value = component.customerForm.get('effDate')?.value;
      expect(moment.isMoment(value)).toBeTrue();
      expect(value.format('YYYY-MM-DD')).toBe('2099-06-01');
    });

    it('should convert termDate string to moment', () => {
      const value = component.customerForm.get('termDate')?.value;
      expect(moment.isMoment(value)).toBeTrue();
      expect(value.format('YYYY-MM-DD')).toBe('2099-12-31');
    });

    it('should populate billing fields from saved data', () => {
      expect(component.customerForm.get('codFlag')?.value).toBe('N');
      expect(component.customerForm.get('returnAcceptedFlag')?.value).toBe('Y');
      expect(component.customerForm.get('arAccount')?.value).toBe('AR001');
      expect(component.customerForm.get('fiPriceSchNo')?.value).toBe('01');
      expect(component.customerForm.get('ednGenFlag')?.value).toBe('Y');
      expect(component.customerForm.get('payeeId')?.value).toBe('PAY001');
    });
  });

  describe('with savedData without dates', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      const dataNoDate = { ...mockSavedCustomer, effDate: '', termDate: null } as any;
      buildComponent(dataNoDate);
    });

    it('should not set effDate when saved effDate is empty', () => {
      // effDate from initForm default is null, savedData had empty string
      // The patchValue won't override effDate, and the if-block (this.savedData.effDate) is falsy
      const value = component.customerForm.get('effDate')?.value;
      expect(value).toBeNull();
    });

    it('should not set termDate when saved termDate is null', () => {
      const value = component.customerForm.get('termDate')?.value;
      expect(value).toBeNull();
    });
  });

  // ── Form validation rules ─────────────────────────────────────────────────

  describe('form validation', () => {
    it('should require name', () => {
      component.customerForm.get('name')?.setValue('');
      expect(component.customerForm.get('name')?.hasError('required')).toBeTrue();
    });

    it('should require customerType', () => {
      component.customerForm.get('customerType')?.setValue('');
      expect(component.customerForm.get('customerType')?.hasError('required')).toBeTrue();
    });

    it('should require shortName', () => {
      component.customerForm.get('shortName')?.setValue('');
      expect(component.customerForm.get('shortName')?.hasError('required')).toBeTrue();
    });

    it('should require address1', () => {
      component.customerForm.get('address1')?.setValue('');
      expect(component.customerForm.get('address1')?.hasError('required')).toBeTrue();
    });

    it('should require city', () => {
      component.customerForm.get('city')?.setValue('');
      expect(component.customerForm.get('city')?.hasError('required')).toBeTrue();
    });

    it('should require state when domestic', () => {
      component.customerForm.get('intFlag')?.setValue('N');
      component.customerForm.get('state')?.setValue('');
      expect(component.customerForm.get('state')?.hasError('required')).toBeTrue();
    });

    it('should require zip', () => {
      component.customerForm.get('zip')?.setValue('');
      expect(component.customerForm.get('zip')?.hasError('required')).toBeTrue();
    });

    it('should require country', () => {
      component.customerForm.get('country')?.setValue('');
      expect(component.customerForm.get('country')?.hasError('required')).toBeTrue();
    });

    it('should require codFlag', () => {
      component.customerForm.get('codFlag')?.setValue('');
      expect(component.customerForm.get('codFlag')?.hasError('required')).toBeTrue();
    });

    it('should require returnAcceptedFlag', () => {
      component.customerForm.get('returnAcceptedFlag')?.setValue('');
      expect(component.customerForm.get('returnAcceptedFlag')?.hasError('required')).toBeTrue();
    });

    it('should require arAccount', () => {
      component.customerForm.get('arAccount')?.setValue('');
      expect(component.customerForm.get('arAccount')?.hasError('required')).toBeTrue();
    });

    it('should require effDate', () => {
      component.customerForm.get('effDate')?.setValue(null);
      expect(component.customerForm.get('effDate')?.hasError('required')).toBeTrue();
    });
  });
});
