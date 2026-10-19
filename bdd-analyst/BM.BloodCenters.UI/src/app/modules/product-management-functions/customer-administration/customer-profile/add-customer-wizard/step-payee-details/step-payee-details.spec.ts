import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, of, throwError } from 'rxjs';
import moment from 'moment';

import { StepPayeeDetailsComponent } from './step-payee-details';
import { AddCustomerWizardApiService } from '../add-customer-wizard-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { CustomerProfileDto } from '../../models/customer-profile.model';

// ── Mock data ────────────────────────────────────────────────────────────────

const mockStateCodes = [
  { code: 'TX', description: 'Texas' },
  { code: 'CA', description: 'California' }
];

const mockZones = [
  { code: 'Z1', description: 'Zone One' },
  { code: 'Z2', description: 'Zone Two' }
];

const mockCustomerData: CustomerProfileDto = {
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
  telexNo: 'INTFAX001',
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

const mockSavedData: any = {
  customerId: 'PAY-001',
  name: 'Test Payee',
  shortName: 'TPAY',
  alphaKey: 'TPY',
  intFlag: 'N',
  address1: '456 Oak Ave',
  address2: 'Floor 2',
  address3: 'Bldg A',
  city: 'Austin',
  state: 'TX',
  zip: '73301',
  country: 'USA',
  phoneNo: '5125550100',
  faxNo: '5125550200',
  intPhone: 'INT123',
  telexNo: 'INTFAX999',
  zone: 'Z1',
  outOfState: 'N',
  effDate: '2099-06-01',
  termDate: '2099-12-31'
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('StepPayeeDetailsComponent', () => {
  let component: StepPayeeDetailsComponent;
  let fixture: ComponentFixture<StepPayeeDetailsComponent>;
  let apiServiceSpy: jasmine.SpyObj<AddCustomerWizardApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let chapterChanged$: Subject<void>;

  function buildComponent(
    options?: {
      savedData?: any;
      customerData?: CustomerProfileDto | null;
    }
  ) {
    apiServiceSpy = jasmine.createSpyObj('AddCustomerWizardApiService', [
      'getStateCodes', 'getZones',
      'createCustomerProfile', 'updateCustomerProfile'
    ]);
    snackbarServiceSpy = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError', 'showInfo']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['dismiss']);
    chapterChanged$ = new Subject<void>();

    apiServiceSpy.getStateCodes.and.returnValue(of(mockStateCodes));
    apiServiceSpy.getZones.and.returnValue(of(mockZones));

    const headerServiceMock = {
      chapterChanged$: chapterChanged$.asObservable(),
      chapterTimeZone: signal('-05:00')
    };

    TestBed.configureTestingModule({
      imports: [StepPayeeDetailsComponent, NoopAnimationsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AddCustomerWizardApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: HeaderService, useValue: headerServiceMock }
      ]
    });

    fixture = TestBed.createComponent(StepPayeeDetailsComponent);
    component = fixture.componentInstance;

    if (options?.savedData !== undefined) {
      component.savedData = options.savedData;
    }
    if (options?.customerData !== undefined) {
      component.customerData = options.customerData;
    }

    spyOn(console, 'error');

    fixture.detectChanges(); // triggers ngOnInit
  }

  /** Fill form with valid data so onSubmit passes validation */
  function fillValidForm() {
    component.payeeForm.patchValue({
      payeeName: 'Valid Payee',
      shortName: 'VPAY',
      alphaKey: 'VPY',
      address1: '100 Test Rd',
      city: 'DALLAS',
      state: 'TX',
      zip: '75201',
      country: 'USA',
      effDate: moment().add(1, 'day')
    });
  }

  // ── Default setup (new payee, no savedData) ──────────────────────────────

  beforeEach(() => {
    buildComponent();
  });

  // ── Creation & form initialisation ────────────────────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialise the form with all expected controls', () => {
    const expectedControls = [
      'payeeName', 'shortName', 'alphaKey', 'sameAsCustomer',
      'intFlag', 'address1', 'address2', 'address3',
      'city', 'state', 'zip', 'country',
      'phoneNo', 'faxNo', 'intPhone', 'intFax',
      'zone', 'outOfState', 'effDate', 'termDate'
    ];
    for (const ctrl of expectedControls) {
      expect(component.payeeForm.get(ctrl)).toBeTruthy(`missing control: ${ctrl}`);
    }
  });

  // ── Default values for new payee ──────────────────────────────────────────

  it('should default intFlag to N for a new payee', () => {
    expect(component.payeeForm.get('intFlag')?.value).toBe('N');
  });

  it('should default country to USA for a new payee', () => {
    expect(component.payeeForm.get('country')?.value).toBe('USA');
  });

  it('should default sameAsCustomer to false', () => {
    expect(component.payeeForm.get('sameAsCustomer')?.value).toBe(false);
  });

  // ── isInternational getter ────────────────────────────────────────────────

  describe('isInternational', () => {
    it('should return false when intFlag is N', () => {
      component.payeeForm.get('intFlag')?.setValue('N');
      expect((component as any).isInternational).toBeFalse();
    });

    it('should return true when intFlag is Y', () => {
      component.payeeForm.get('intFlag')?.setValue('Y');
      expect((component as any).isInternational).toBeTrue();
    });
  });

  // ── f getter ──────────────────────────────────────────────────────────────

  it('should return form controls via f getter', () => {
    const controls = (component as any).f;
    expect(controls['payeeName']).toBe(component.payeeForm.controls['payeeName']);
  });

  // ── ID helper methods ─────────────────────────────────────────────────────

  describe('ID helpers', () => {
    it('should generate element IDs with component prefix', () => {
      const id = (component as any).elementId('name');
      expect(id).toContain('payee-details-');
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

  // ── loadStateCodes ────────────────────────────────────────────────────────

  describe('loadStateCodes', () => {
    it('should call getStateCodes on init', () => {
      expect(apiServiceSpy.getStateCodes).toHaveBeenCalled();
    });

    it('should populate state codes on success', () => {
      expect((component as any).stateCodes()).toEqual(mockStateCodes);
      expect((component as any).filteredStateCodes).toEqual(mockStateCodes);
    });

    it('should show error and log when state codes fail', fakeAsync(() => {
      TestBed.resetTestingModule();
      apiServiceSpy = jasmine.createSpyObj('AddCustomerWizardApiService', [
        'getStateCodes', 'getZones',
        'createCustomerProfile', 'updateCustomerProfile'
      ]);
      apiServiceSpy.getStateCodes.and.returnValue(throwError(() => new Error('fail')));
      apiServiceSpy.getZones.and.returnValue(of(mockZones));
      snackbarServiceSpy = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError', 'showInfo']);
      snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['dismiss']);
      chapterChanged$ = new Subject<void>();

      const headerServiceMock = {
        chapterChanged$: chapterChanged$.asObservable(),
        chapterTimeZone: signal('-05:00')
      };

      TestBed.configureTestingModule({
        imports: [StepPayeeDetailsComponent, NoopAnimationsModule],
        schemas: [NO_ERRORS_SCHEMA],
        providers: [
          { provide: AddCustomerWizardApiService, useValue: apiServiceSpy },
          { provide: SnackbarService, useValue: snackbarServiceSpy },
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: HeaderService, useValue: headerServiceMock }
        ]
      });

      fixture = TestBed.createComponent(StepPayeeDetailsComponent);
      component = fixture.componentInstance;
      spyOn(console, 'error');
      fixture.detectChanges();

      tick(5000);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load state codes');
      expect(console.error).toHaveBeenCalled();
    }));
  });

  // ── loadZones ─────────────────────────────────────────────────────────────

  describe('loadZones', () => {
    it('should call getZones on init', () => {
      expect(apiServiceSpy.getZones).toHaveBeenCalled();
    });

    it('should populate zones on success', () => {
      expect((component as any).zones()).toEqual(mockZones);
      expect((component as any).filteredZones).toEqual(mockZones);
    });

    it('should log error when zones fail', fakeAsync(() => {
      TestBed.resetTestingModule();
      apiServiceSpy = jasmine.createSpyObj('AddCustomerWizardApiService', [
        'getStateCodes', 'getZones',
        'createCustomerProfile', 'updateCustomerProfile'
      ]);
      apiServiceSpy.getStateCodes.and.returnValue(of(mockStateCodes));
      apiServiceSpy.getZones.and.returnValue(throwError(() => new Error('zone fail')));
      snackbarServiceSpy = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError', 'showInfo']);
      snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['dismiss']);
      chapterChanged$ = new Subject<void>();

      const headerServiceMock = {
        chapterChanged$: chapterChanged$.asObservable(),
        chapterTimeZone: signal('-05:00')
      };

      TestBed.configureTestingModule({
        imports: [StepPayeeDetailsComponent, NoopAnimationsModule],
        schemas: [NO_ERRORS_SCHEMA],
        providers: [
          { provide: AddCustomerWizardApiService, useValue: apiServiceSpy },
          { provide: SnackbarService, useValue: snackbarServiceSpy },
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: HeaderService, useValue: headerServiceMock }
        ]
      });

      fixture = TestBed.createComponent(StepPayeeDetailsComponent);
      component = fixture.componentInstance;
      spyOn(console, 'error');
      fixture.detectChanges();

      expect(console.error).toHaveBeenCalled();
    }));
  });

  // ── intFlag form listener ─────────────────────────────────────────────────

  describe('intFlag changes', () => {
    it('should set zipMaxLength to 10 for international', () => {
      component.payeeForm.get('intFlag')?.setValue('Y');
      expect((component as any).zipMaxLength).toBe(10);
    });

    it('should set zipMaxLength to 5 for domestic', () => {
      component.payeeForm.get('intFlag')?.setValue('Y');
      component.payeeForm.get('intFlag')?.setValue('N');
      expect((component as any).zipMaxLength).toBe(5);
    });

    it('should make state not required for international', () => {
      component.payeeForm.get('intFlag')?.setValue('Y');
      component.payeeForm.get('state')?.setValue('');
      component.payeeForm.get('state')?.updateValueAndValidity();
      expect(component.payeeForm.get('state')?.valid).toBeTrue();
    });

    it('should make state required for domestic', () => {
      component.payeeForm.get('intFlag')?.setValue('N');
      component.payeeForm.get('state')?.setValue('');
      component.payeeForm.get('state')?.updateValueAndValidity();
      expect(component.payeeForm.get('state')?.hasError('required')).toBeTrue();
    });

    it('should call applyZipValidators on intFlag change', () => {
      // When switching to international, zip pattern should allow alphanumeric
      component.payeeForm.get('intFlag')?.setValue('Y');
      component.payeeForm.get('zip')?.setValue('ABC123');
      component.payeeForm.get('zip')?.updateValueAndValidity();
      // International allows alphanumeric
      expect(component.payeeForm.get('zip')?.hasError('pattern')).toBeFalse();
    });
  });

  // ── effDate form listener ─────────────────────────────────────────────────

  describe('effDate changes', () => {
    it('should update termDate validity when effDate changes', () => {
      const termCtrl = component.payeeForm.get('termDate');
      const spy = spyOn(termCtrl!, 'updateValueAndValidity').and.callThrough();
      component.payeeForm.get('effDate')?.setValue(moment().add(2, 'days'));
      expect(spy).toHaveBeenCalled();
    });
  });

  // ── Search filtering ──────────────────────────────────────────────────────

  describe('search controls', () => {
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

    it('should filter zones by code', () => {
      (component as any).zoneSearchCtrl.setValue('z1');
      expect((component as any).filteredZones.length).toBe(1);
      expect((component as any).filteredZones[0].code).toBe('Z1');
    });

    it('should filter zones by description', () => {
      (component as any).zoneSearchCtrl.setValue('two');
      expect((component as any).filteredZones.length).toBe(1);
      expect((component as any).filteredZones[0].code).toBe('Z2');
    });

    it('should show all states when search is cleared', () => {
      (component as any).stateSearchCtrl.setValue('tx');
      expect((component as any).filteredStateCodes.length).toBe(1);
      (component as any).stateSearchCtrl.setValue('');
      expect((component as any).filteredStateCodes.length).toBe(2);
    });

    it('should show all zones when search is cleared', () => {
      (component as any).zoneSearchCtrl.setValue('z1');
      expect((component as any).filteredZones.length).toBe(1);
      (component as any).zoneSearchCtrl.setValue('');
      expect((component as any).filteredZones.length).toBe(2);
    });

    it('should handle null search term for states', () => {
      (component as any).stateSearchCtrl.setValue(null);
      expect((component as any).filteredStateCodes.length).toBe(2);
    });

    it('should handle null search term for zones', () => {
      (component as any).zoneSearchCtrl.setValue(null);
      expect((component as any).filteredZones.length).toBe(2);
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
      component.payeeForm.get('phoneNo')?.setValue('214-555-0100');
      (component as any).stripPhoneOnFocus('phoneNo');
      expect(component.payeeForm.get('phoneNo')?.value).toBe('2145550100');
    });

    it('should not change a digits-only value', () => {
      component.payeeForm.get('phoneNo')?.setValue('2145550100');
      (component as any).stripPhoneOnFocus('phoneNo');
      expect(component.payeeForm.get('phoneNo')?.value).toBe('2145550100');
    });

    it('should do nothing when control value is empty', () => {
      component.payeeForm.get('phoneNo')?.setValue('');
      (component as any).stripPhoneOnFocus('phoneNo');
      expect(component.payeeForm.get('phoneNo')?.value).toBe('');
    });

    it('should do nothing when control value is null', () => {
      component.payeeForm.get('phoneNo')?.setValue(null);
      (component as any).stripPhoneOnFocus('phoneNo');
      expect(component.payeeForm.get('phoneNo')?.value).toBeNull();
    });
  });

  // ── formatPhoneOnBlur ─────────────────────────────────────────────────────

  describe('formatPhoneOnBlur', () => {
    it('should format a 10-digit number as xxx-xxx-xxxx', () => {
      component.payeeForm.get('phoneNo')?.setValue('2145550100');
      (component as any).formatPhoneOnBlur('phoneNo');
      expect(component.payeeForm.get('phoneNo')?.value).toBe('214-555-0100');
    });

    it('should format a 7-digit number as xxx-xxxx', () => {
      component.payeeForm.get('phoneNo')?.setValue('5550100');
      (component as any).formatPhoneOnBlur('phoneNo');
      expect(component.payeeForm.get('phoneNo')?.value).toBe('555-0100');
    });

    it('should not format other digit lengths', () => {
      component.payeeForm.get('phoneNo')?.setValue('12345');
      (component as any).formatPhoneOnBlur('phoneNo');
      expect(component.payeeForm.get('phoneNo')?.value).toBe('12345');
    });

    it('should do nothing when control value is empty', () => {
      component.payeeForm.get('phoneNo')?.setValue('');
      (component as any).formatPhoneOnBlur('phoneNo');
      expect(component.payeeForm.get('phoneNo')?.value).toBe('');
    });

    it('should do nothing when control value is null', () => {
      component.payeeForm.get('phoneNo')?.setValue(null);
      (component as any).formatPhoneOnBlur('phoneNo');
      expect(component.payeeForm.get('phoneNo')?.value).toBeNull();
    });

    it('should format faxNo the same as phoneNo', () => {
      component.payeeForm.get('faxNo')?.setValue('5125550200');
      (component as any).formatPhoneOnBlur('faxNo');
      expect(component.payeeForm.get('faxNo')?.value).toBe('512-555-0200');
    });
  });

  // ── Date event handlers ───────────────────────────────────────────────────

  describe('onEffectiveDateChange', () => {
    it('should update termDate validity and mark effDate as touched', () => {
      const termCtrl = component.payeeForm.get('termDate')!;
      const updateSpy = spyOn(termCtrl, 'updateValueAndValidity');
      const effCtrl = component.payeeForm.get('effDate')!;
      const touchSpy = spyOn(effCtrl, 'markAsTouched');
      (component as any).onEffectiveDateChange();
      expect(updateSpy).toHaveBeenCalled();
      expect(touchSpy).toHaveBeenCalled();
    });
  });

  describe('onTerminationDateChange', () => {
    it('should mark termDate as touched', () => {
      const termCtrl = component.payeeForm.get('termDate')!;
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
      expect(spy).toHaveBeenCalledWith('01-JAN-2030', component.payeeForm.get('effDate'));
    });
  });

  describe('onTerminationDateInput', () => {
    it('should delegate to DateFieldValidationUtility.handleEndDateInput', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const event = { target: { value: '31-DEC-2030' } } as unknown as Event;
      (component as any).onTerminationDateInput(event);
      expect(spy).toHaveBeenCalledWith('31-DEC-2030', component.payeeForm.get('termDate'));
    });
  });

  describe('getEffectiveDateError', () => {
    it('should delegate to DateFieldValidationUtility.getEffectiveDateError', () => {
      const spy = spyOn(DateFieldValidationUtility, 'getEffectiveDateError').and.returnValue('test error');
      const result = (component as any).getEffectiveDateError();
      expect(spy).toHaveBeenCalledWith(component.payeeForm);
      expect(result).toBe('test error');
    });
  });

  describe('getTerminationDateError', () => {
    it('should delegate to DateFieldValidationUtility.getTerminationDateError', () => {
      const spy = spyOn(DateFieldValidationUtility, 'getTerminationDateError').and.returnValue('term error');
      const result = (component as any).getTerminationDateError();
      expect(spy).toHaveBeenCalledWith(component.payeeForm);
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
      component.payeeForm.get('effDate')?.setValue(effDate);
      const before = moment('2030-06-10');
      expect((component as any).terminationDateFilter(before)).toBeFalse();
    });

    it('should return true for a date equal to the effective date', () => {
      const effDate = moment('2030-06-15');
      component.payeeForm.get('effDate')?.setValue(effDate);
      const same = moment('2030-06-15');
      expect((component as any).terminationDateFilter(same)).toBeTrue();
    });

    it('should return true for a date after the effective date', () => {
      const effDate = moment('2030-06-15');
      component.payeeForm.get('effDate')?.setValue(effDate);
      const after = moment('2030-06-20');
      expect((component as any).terminationDateFilter(after)).toBeTrue();
    });

    it('should return true when no effective date is set', () => {
      component.payeeForm.get('effDate')?.setValue(null);
      const date = moment('2030-06-10');
      expect((component as any).terminationDateFilter(date)).toBeTrue();
    });
  });

  // ── updateTerminationMinDate ──────────────────────────────────────────────

  describe('updateTerminationMinDate', () => {
    it('should fall back to minDate when effDate is null', () => {
      component.payeeForm.get('effDate')?.setValue(null);
      (component as any).updateTerminationMinDate();
      expect((component as any).terminationMinDate).toEqual((component as any).minDate);
    });

    it('should use effective date when it is after minDate', () => {
      const future = moment().add(30, 'days');
      component.payeeForm.get('effDate')?.setValue(future);
      (component as any).updateTerminationMinDate();
      expect((component as any).terminationMinDate.format('YYYY-MM-DD')).toBe(future.format('YYYY-MM-DD'));
    });

    it('should use minDate when effective date is before minDate', () => {
      const past = moment('2000-01-01');
      component.payeeForm.get('effDate')?.setValue(past);
      (component as any).updateTerminationMinDate();
      expect((component as any).terminationMinDate.format('YYYY-MM-DD')).toBe((component as any).minDate.format('YYYY-MM-DD'));
    });

    it('should handle a Date object for effective date', () => {
      const dateObj = new Date(Date.now() + 30 * 86400000); // 30 days from now
      component.payeeForm.get('effDate')?.setValue(dateObj);
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

  // ── sameAsCustomer form listener ──────────────────────────────────────────

  describe('sameAsCustomer checkbox', () => {
    it('should copy customer data when checked and customerData is set', () => {
      TestBed.resetTestingModule();
      buildComponent({ customerData: mockCustomerData });

      component.payeeForm.get('sameAsCustomer')?.setValue(true);

      expect(component.payeeForm.get('payeeName')?.value).toBe('Test Customer');
      expect(component.payeeForm.get('shortName')?.value).toBe('TEST');
      expect(component.payeeForm.get('alphaKey')?.value).toBe('TST');
      expect(component.payeeForm.get('intFlag')?.value).toBe('N');
      expect(component.payeeForm.get('address1')?.value).toBe('123 Main St');
      expect(component.payeeForm.get('address2')?.value).toBe('Suite 100');
      expect(component.payeeForm.get('city')?.value).toBe('Dallas');
      expect(component.payeeForm.get('state')?.value).toBe('TX');
      expect(component.payeeForm.get('zip')?.value).toBe('75201');
      expect(component.payeeForm.get('country')?.value).toBe('USA');
      expect(component.payeeForm.get('phoneNo')?.value).toBe('2145550100');
      expect(component.payeeForm.get('faxNo')?.value).toBe('2145550200');
      expect(component.payeeForm.get('intFax')?.value).toBe('INTFAX001');
    });

    it('should copy effDate and termDate as moment when customerData has dates', () => {
      TestBed.resetTestingModule();
      buildComponent({ customerData: mockCustomerData });

      component.payeeForm.get('sameAsCustomer')?.setValue(true);

      const effValue = component.payeeForm.get('effDate')?.value;
      expect(moment.isMoment(effValue)).toBeTrue();
      expect(effValue.format('YYYY-MM-DD')).toBe('2099-06-01');

      const termValue = component.payeeForm.get('termDate')?.value;
      expect(moment.isMoment(termValue)).toBeTrue();
      expect(termValue.format('YYYY-MM-DD')).toBe('2099-12-31');
    });

    it('should set effDate to null when customerData has no effDate', () => {
      TestBed.resetTestingModule();
      const noDateCustomer = { ...mockCustomerData, effDate: '', termDate: null };
      buildComponent({ customerData: noDateCustomer as any });

      component.payeeForm.get('sameAsCustomer')?.setValue(true);

      expect(component.payeeForm.get('effDate')?.value).toBeNull();
      expect(component.payeeForm.get('termDate')?.value).toBeNull();
    });

    it('should not copy data when checked but customerData is null', () => {
      component.customerData = null;
      component.payeeForm.get('payeeName')?.setValue('Original');
      component.payeeForm.get('sameAsCustomer')?.setValue(true);

      // Value should remain unchanged because the if condition fails
      expect(component.payeeForm.get('payeeName')?.value).toBe('Original');
    });

    it('should not copy data when unchecked', () => {
      TestBed.resetTestingModule();
      buildComponent({ customerData: mockCustomerData });

      component.payeeForm.get('payeeName')?.setValue('Original');
      component.payeeForm.get('sameAsCustomer')?.setValue(false);

      expect(component.payeeForm.get('payeeName')?.value).toBe('Original');
    });

    it('should use fallback values for missing customer fields', () => {
      TestBed.resetTestingModule();
      const sparseCustomer: CustomerProfileDto = {
        ...mockCustomerData,
        shortName: '',
        alphaKey: null,
        intFlag: undefined,
        address2: null,
        address3: null,
        phoneNo: null,
        faxNo: null,
        intPhone: null,
        telexNo: null,
        country: ''
      };
      buildComponent({ customerData: sparseCustomer });

      component.payeeForm.get('sameAsCustomer')?.setValue(true);

      expect(component.payeeForm.get('shortName')?.value).toBe('');
      expect(component.payeeForm.get('alphaKey')?.value).toBe('');
      expect(component.payeeForm.get('intFlag')?.value).toBe('N');
      expect(component.payeeForm.get('address2')?.value).toBe('');
      expect(component.payeeForm.get('country')?.value).toBe('USA');
      expect(component.payeeForm.get('phoneNo')?.value).toBe('');
      expect(component.payeeForm.get('intFax')?.value).toBe('');
    });
  });

  // ── onSubmit ──────────────────────────────────────────────────────────────

  describe('onSubmit', () => {
    it('should set submitted to true', () => {
      (component as any).onSubmit();
      expect((component as any).submitted()).toBeTrue();
    });

    it('should mark all controls as touched', () => {
      const spy = spyOn(component.payeeForm, 'markAllAsTouched');
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
      const createdPayee: CustomerProfileDto = {
        ...mockCustomerData,
        customerId: 'PAY-NEW',
        customerType: 'PA'
      };

      beforeEach(() => {
        fillValidForm();
        apiServiceSpy.createCustomerProfile.and.returnValue(of(createdPayee));
      });

      it('should call createCustomerProfile with payload', fakeAsync(() => {
        (component as any).onSubmit();
        tick(5000);
        expect(apiServiceSpy.createCustomerProfile).toHaveBeenCalled();
        const payload = apiServiceSpy.createCustomerProfile.calls.mostRecent().args[0];
        expect(payload.customerId).toBe('');
        expect(payload.name).toBe('Valid Payee');
        expect(payload.customerType).toBe('PA');
      }));

      it('should emit savingChange true then false', fakeAsync(() => {
        const spy = spyOn(component.savingChange, 'emit');
        (component as any).onSubmit();
        tick(5000);
        expect(spy).toHaveBeenCalledWith(true);
        expect(spy).toHaveBeenCalledWith(false);
      }));

      it('should emit saveSuccess with the result', fakeAsync(() => {
        const spy = spyOn(component.saveSuccess, 'emit');
        (component as any).onSubmit();
        tick(5000);
        expect(spy).toHaveBeenCalledWith(createdPayee);
      }));

      it('should uppercase shortName and city in payload', fakeAsync(() => {
        component.payeeForm.get('shortName')?.setValue('lower');
        component.payeeForm.get('city')?.setValue('lower');
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createCustomerProfile.calls.mostRecent().args[0];
        expect(payload.shortName).toBe('LOWER');
        expect(payload.city).toBe('LOWER');
      }));

      it('should strip phone formatting in payload', fakeAsync(() => {
        component.payeeForm.get('phoneNo')?.setValue('214-555-0100');
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createCustomerProfile.calls.mostRecent().args[0];
        expect(payload.phoneNo).toBe('2145550100');
      }));

      it('should strip fax formatting in payload', fakeAsync(() => {
        component.payeeForm.get('faxNo')?.setValue('512-555-0200');
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createCustomerProfile.calls.mostRecent().args[0];
        expect(payload.faxNo).toBe('5125550200');
      }));

      it('should format effDate as YYYY-MM-DD in payload', fakeAsync(() => {
        const date = moment('2030-06-15');
        component.payeeForm.get('effDate')?.setValue(date);
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createCustomerProfile.calls.mostRecent().args[0];
        expect(payload.effDate).toBe('2030-06-15');
      }));

      it('should set termDate to null when not provided', fakeAsync(() => {
        component.payeeForm.get('termDate')?.setValue(null);
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createCustomerProfile.calls.mostRecent().args[0];
        expect(payload.termDate).toBeNull();
      }));

      it('should format termDate as YYYY-MM-DD when provided', fakeAsync(() => {
        const date = moment('2030-12-31');
        component.payeeForm.get('termDate')?.setValue(date);
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createCustomerProfile.calls.mostRecent().args[0];
        expect(payload.termDate).toBe('2030-12-31');
      }));

      it('should set fixed payload fields for payee type', fakeAsync(() => {
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createCustomerProfile.calls.mostRecent().args[0];
        expect(payload.codFlag).toBe('N');
        expect(payload.returnAcceptedFlag).toBe('Y');
        expect(payload.arAccount).toBe('N/A');
        expect(payload.payeeId).toBeNull();
      }));

      it('should use shortName from form when provided', fakeAsync(() => {
        component.payeeForm.get('shortName')?.setValue('CUSTOM');
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createCustomerProfile.calls.mostRecent().args[0];
        expect(payload.shortName).toBe('CUSTOM');
      }));

      it('should fallback shortName to first 15 chars of payeeName when empty', fakeAsync(() => {
        component.payeeForm.get('shortName')?.setValue('');
        component.payeeForm.get('payeeName')?.setValue('A Very Long Payee Name That Exceeds Fifteen');
        // shortName is required, so need to disable validation
        component.payeeForm.get('shortName')?.clearValidators();
        component.payeeForm.get('shortName')?.updateValueAndValidity();
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createCustomerProfile.calls.mostRecent().args[0];
        expect(payload.shortName).toBe('A VERY LONG PAY');
      }));

      it('should handle null optional fields in payload', fakeAsync(() => {
        component.payeeForm.patchValue({
          address2: '',
          address3: '',
          phoneNo: '',
          faxNo: '',
          intPhone: '',
          intFax: '',
          zone: ''
        });
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createCustomerProfile.calls.mostRecent().args[0];
        expect(payload.address2).toBeNull();
        expect(payload.address3).toBeNull();
        expect(payload.phoneNo).toBeNull();
        expect(payload.faxNo).toBeNull();
        expect(payload.intPhone).toBeNull();
      }));

      it('should set saving signal to true during save', fakeAsync(() => {
        const savingSpy = spyOn(component.savingChange, 'emit');
        (component as any).onSubmit();
        // After calling onSubmit synchronously, saving should have been set to true
        expect(savingSpy).toHaveBeenCalledWith(true);
        tick(5000);
      }));
    });

    describe('update (savedData with customerId)', () => {
      const updatedPayee: CustomerProfileDto = { ...mockCustomerData, customerType: 'PA' };

      beforeEach(() => {
        TestBed.resetTestingModule();
        buildComponent({ savedData: mockSavedData });
        fillValidForm();
        apiServiceSpy.updateCustomerProfile.and.returnValue(of(updatedPayee));
      });

      it('should call updateCustomerProfile with customerId', fakeAsync(() => {
        (component as any).onSubmit();
        tick(5000);
        expect(apiServiceSpy.updateCustomerProfile).toHaveBeenCalled();
        const [id] = apiServiceSpy.updateCustomerProfile.calls.mostRecent().args;
        expect(id).toBe('PAY-001');
      }));

      it('should set customerId in payload from savedData', fakeAsync(() => {
        (component as any).onSubmit();
        tick(5000);
        const [, payload] = apiServiceSpy.updateCustomerProfile.calls.mostRecent().args;
        expect(payload.customerId).toBe('PAY-001');
      }));

      it('should emit saveSuccess with the updated result', fakeAsync(() => {
        const spy = spyOn(component.saveSuccess, 'emit');
        (component as any).onSubmit();
        tick(5000);
        expect(spy).toHaveBeenCalledWith(updatedPayee);
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
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to save payee details');
      }));

      it('should show nested errorResponse.error message', fakeAsync(() => {
        apiServiceSpy.createCustomerProfile.and.returnValue(
          throwError(() => ({
            error: { errorResponse: { error: 'Duplicate payee' } }
          }))
        );
        (component as any).onSubmit();
        tick(5000);
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Duplicate payee');
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

      it('should emit savingChange false on error', fakeAsync(() => {
        const spy = spyOn(component.savingChange, 'emit');
        apiServiceSpy.createCustomerProfile.and.returnValue(
          throwError(() => ({ error: {} }))
        );
        (component as any).onSubmit();
        tick(5000);
        expect(spy).toHaveBeenCalledWith(false);
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
      const effCtrl = component.payeeForm.get('effDate')!;
      const termCtrl = component.payeeForm.get('termDate')!;
      const effSpy = spyOn(effCtrl, 'setValidators').and.callThrough();
      const termSpy = spyOn(termCtrl, 'setValidators').and.callThrough();

      chapterChanged$.next();

      expect(effSpy).toHaveBeenCalled();
      expect(termSpy).toHaveBeenCalled();
    });

    it('should call updateValueAndValidity on effDate and termDate', () => {
      const effCtrl = component.payeeForm.get('effDate')!;
      const termCtrl = component.payeeForm.get('termDate')!;
      const effSpy = spyOn(effCtrl, 'updateValueAndValidity').and.callThrough();
      const termSpy = spyOn(termCtrl, 'updateValueAndValidity').and.callThrough();

      chapterChanged$.next();

      expect(effSpy).toHaveBeenCalled();
      expect(termSpy).toHaveBeenCalled();
    });

    it('should update minDate when chapter changes', () => {
      const originalMinDate = (component as any).minDate;
      chapterChanged$.next();
      // minDate should be recalculated (may or may not be different depending on timezone)
      expect((component as any).minDate).toBeDefined();
      expect(moment.isMoment((component as any).minDate)).toBeTrue();
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
      buildComponent({ savedData: mockSavedData });
    });

    it('should populate form with saved payee data', () => {
      expect(component.payeeForm.get('payeeName')?.value).toBe('Test Payee');
      expect(component.payeeForm.get('shortName')?.value).toBe('TPAY');
      expect(component.payeeForm.get('alphaKey')?.value).toBe('TPY');
      expect(component.payeeForm.get('intFlag')?.value).toBe('N');
      expect(component.payeeForm.get('address1')?.value).toBe('456 Oak Ave');
      expect(component.payeeForm.get('address2')?.value).toBe('Floor 2');
      expect(component.payeeForm.get('address3')?.value).toBe('Bldg A');
      expect(component.payeeForm.get('city')?.value).toBe('Austin');
      expect(component.payeeForm.get('state')?.value).toBe('TX');
      expect(component.payeeForm.get('zip')?.value).toBe('73301');
      expect(component.payeeForm.get('country')?.value).toBe('USA');
      expect(component.payeeForm.get('phoneNo')?.value).toBe('5125550100');
      expect(component.payeeForm.get('faxNo')?.value).toBe('5125550200');
      expect(component.payeeForm.get('intPhone')?.value).toBe('INT123');
      expect(component.payeeForm.get('intFax')?.value).toBe('INTFAX999');
      expect(component.payeeForm.get('zone')?.value).toBe('Z1');
      expect(component.payeeForm.get('outOfState')?.value).toBe('N');
    });

    it('should convert effDate string to moment', () => {
      const value = component.payeeForm.get('effDate')?.value;
      expect(moment.isMoment(value)).toBeTrue();
      expect(value.format('YYYY-MM-DD')).toBe('2099-06-01');
    });

    it('should convert termDate string to moment', () => {
      const value = component.payeeForm.get('termDate')?.value;
      expect(moment.isMoment(value)).toBeTrue();
      expect(value.format('YYYY-MM-DD')).toBe('2099-12-31');
    });
  });

  describe('with savedData without dates', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      const dataNoDate = { ...mockSavedData, effDate: '', termDate: null };
      buildComponent({ savedData: dataNoDate });
    });

    it('should not set effDate when saved effDate is empty', () => {
      const value = component.payeeForm.get('effDate')?.value;
      expect(value).toBeNull();
    });

    it('should not set termDate when saved termDate is null', () => {
      const value = component.payeeForm.get('termDate')?.value;
      expect(value).toBeNull();
    });
  });

  describe('with savedData without intFlag', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      const dataNoIntFlag = { ...mockSavedData, intFlag: undefined };
      buildComponent({ savedData: dataNoIntFlag });
    });

    it('should default intFlag to N when savedData has no intFlag', () => {
      expect(component.payeeForm.get('intFlag')?.value).toBe('N');
    });
  });

  // ── Form validation rules ─────────────────────────────────────────────────

  describe('form validation', () => {
    it('should require payeeName', () => {
      component.payeeForm.get('payeeName')?.setValue('');
      expect(component.payeeForm.get('payeeName')?.hasError('required')).toBeTrue();
    });

    it('should require shortName', () => {
      component.payeeForm.get('shortName')?.setValue('');
      expect(component.payeeForm.get('shortName')?.hasError('required')).toBeTrue();
    });

    it('should require alphaKey', () => {
      component.payeeForm.get('alphaKey')?.setValue('');
      expect(component.payeeForm.get('alphaKey')?.hasError('required')).toBeTrue();
    });

    it('should require address1', () => {
      component.payeeForm.get('address1')?.setValue('');
      expect(component.payeeForm.get('address1')?.hasError('required')).toBeTrue();
    });

    it('should require city', () => {
      component.payeeForm.get('city')?.setValue('');
      expect(component.payeeForm.get('city')?.hasError('required')).toBeTrue();
    });

    it('should require state when domestic', () => {
      component.payeeForm.get('intFlag')?.setValue('N');
      component.payeeForm.get('state')?.setValue('');
      expect(component.payeeForm.get('state')?.hasError('required')).toBeTrue();
    });

    it('should not require state when international', () => {
      component.payeeForm.get('intFlag')?.setValue('Y');
      component.payeeForm.get('state')?.setValue('');
      component.payeeForm.get('state')?.updateValueAndValidity();
      expect(component.payeeForm.get('state')?.hasError('required')).toBeFalsy();
    });

    it('should require zip', () => {
      component.payeeForm.get('zip')?.setValue('');
      expect(component.payeeForm.get('zip')?.hasError('required')).toBeTrue();
    });

    it('should require country', () => {
      component.payeeForm.get('country')?.setValue('');
      expect(component.payeeForm.get('country')?.hasError('required')).toBeTrue();
    });

    it('should require effDate', () => {
      component.payeeForm.get('effDate')?.setValue(null);
      expect(component.payeeForm.get('effDate')?.hasError('required')).toBeTrue();
    });

    it('should not require address2', () => {
      component.payeeForm.get('address2')?.setValue('');
      expect(component.payeeForm.get('address2')?.valid).toBeTrue();
    });

    it('should not require address3', () => {
      component.payeeForm.get('address3')?.setValue('');
      expect(component.payeeForm.get('address3')?.valid).toBeTrue();
    });

    it('should not require termDate', () => {
      component.payeeForm.get('termDate')?.setValue(null);
      expect(component.payeeForm.get('termDate')?.hasError('required')).toBeFalsy();
    });

    it('should validate zip with numeric pattern for domestic', () => {
      component.payeeForm.get('intFlag')?.setValue('N');
      component.payeeForm.get('zip')?.setValue('ABC');
      component.payeeForm.get('zip')?.updateValueAndValidity();
      expect(component.payeeForm.get('zip')?.hasError('pattern')).toBeTrue();
    });

    it('should validate zip allows alphanumeric for international', () => {
      component.payeeForm.get('intFlag')?.setValue('Y');
      component.payeeForm.get('zip')?.setValue('ABC123');
      component.payeeForm.get('zip')?.updateValueAndValidity();
      expect(component.payeeForm.get('zip')?.hasError('pattern')).toBeFalse();
    });
  });

  // ── stripPhone (private) ──────────────────────────────────────────────────

  describe('stripPhone', () => {
    it('should strip non-digit characters from a phone string', () => {
      const result = (component as any).stripPhone('214-555-0100');
      expect(result).toBe('2145550100');
    });

    it('should return null for null input', () => {
      const result = (component as any).stripPhone(null);
      expect(result).toBeNull();
    });

    it('should return empty string for empty input', () => {
      const result = (component as any).stripPhone('');
      expect(result).toBe('');
    });
  });
});
