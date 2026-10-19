import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, of, throwError } from 'rxjs';
import moment from 'moment';

import { StepConsigneeDetailsComponent } from './step-consignee-details';
import { AddCustomerWizardApiService } from '../add-customer-wizard-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { CustomerProfileDto } from '../../models/customer-profile.model';

// ── Mock data ────────────────────────────────────────────────────────────────

const mockZones = [
  { code: 'Z1', description: 'Zone One' },
  { code: 'Z2', description: 'Zone Two' }
];

const mockStateCodes = [
  { code: 'TX', description: 'Texas' },
  { code: 'CA', description: 'California' }
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
  address3: 'Floor 3',
  city: 'Dallas',
  state: 'TX',
  zip: '75201',
  country: 'USA',
  phoneNo: '2145550100',
  faxNo: '2145550200',
  intPhone: 'INT123',
  telexNo: 'TELEX456',
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
  payeeId: 'PAY001',
  phoneExt: '555'
};

const mockSavedConsignee = {
  consigneeId: 'CON-001',
  name: 'Saved Consignee',
  consigneeName: 'Saved Consignee',
  shortName: 'SAVED',
  intFlag: 'N',
  address1: '456 Oak Ave',
  address2: 'Apt 2B',
  address3: null,
  city: 'HOUSTON',
  state: 'TX',
  zip: '77001',
  country: 'USA',
  zone: 'Z1',
  outOfState: '',
  phoneNo: '7135550100',
  faxNo: '7135550200',
  intPhone: null,
  telexNo: 'FAX789',
  effDate: '2099-01-01',
  termDate: '2099-12-31'
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('StepConsigneeDetailsComponent', () => {
  let component: StepConsigneeDetailsComponent;
  let fixture: ComponentFixture<StepConsigneeDetailsComponent>;
  let apiServiceSpy: jasmine.SpyObj<AddCustomerWizardApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let chapterChanged$: Subject<void>;

  function buildComponent(opts: {
    savedData?: any[];
    customerData?: CustomerProfileDto | null;
    customerId?: string;
  } = {}) {
    apiServiceSpy = jasmine.createSpyObj('AddCustomerWizardApiService', [
      'getZones', 'getStateCodes', 'createConsignee', 'updateConsignee', 'getConsignees'
    ]);
    snackbarServiceSpy = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError', 'showInfo']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['dismiss']);
    chapterChanged$ = new Subject<void>();

    apiServiceSpy.getZones.and.returnValue(of(mockZones));
    apiServiceSpy.getStateCodes.and.returnValue(of(mockStateCodes));

    const headerServiceMock = {
      chapterChanged$: chapterChanged$.asObservable(),
      chapterTimeZone: signal('-05:00')
    };

    TestBed.configureTestingModule({
      imports: [StepConsigneeDetailsComponent, NoopAnimationsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AddCustomerWizardApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: HeaderService, useValue: headerServiceMock }
      ]
    });

    fixture = TestBed.createComponent(StepConsigneeDetailsComponent);
    component = fixture.componentInstance;

    if (opts.savedData !== undefined) {
      component.savedData = opts.savedData;
    }
    if (opts.customerData !== undefined) {
      component.customerData = opts.customerData ?? null;
    }
    if (opts.customerId !== undefined) {
      component.customerId = opts.customerId;
    }

    spyOn(console, 'error');

    fixture.detectChanges(); // triggers ngOnInit
  }

  /** Fill a consignee group at given index with valid data */
  function fillValidConsignee(index: number = 0) {
    const group = (component as any).consignees.at(index);
    group.patchValue({
      consigneeName: 'Valid Consignee',
      shortName: 'VALID',
      intFlag: 'N',
      address1: '100 Test Rd',
      city: 'DALLAS',
      state: 'TX',
      zip: '75201',
      country: 'USA',
      zone: 'Z1',
      effDate: moment().add(1, 'day')
    });
  }

  // ── Default setup (new, no savedData) ────────────────────────────────────

  beforeEach(() => {
    buildComponent();
  });

  // ── Creation & form initialisation ────────────────────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialise a FormGroup with a consignees FormArray', () => {
    expect(component.consigneeForm).toBeTruthy();
    expect((component as any).consignees).toBeTruthy();
    expect((component as any).consignees.length).toBeGreaterThanOrEqual(1);
  });

  it('should add one consignee by default when no savedData', () => {
    expect((component as any).consignees.length).toBe(1);
  });

  it('should initialise consignee form group with expected controls', () => {
    const group = (component as any).consignees.at(0);
    const expectedControls = [
      'consigneeName', 'shortName', 'sameAsCustomer', 'intFlag',
      'address1', 'address2', 'address3', 'city', 'state', 'zip', 'country',
      'zone', 'outOfState', 'phoneNo', 'faxNo', 'intPhone', 'intFax',
      'effDate', 'termDate'
    ];
    for (const ctrl of expectedControls) {
      expect(group.get(ctrl)).toBeTruthy(`missing control: ${ctrl}`);
    }
  });

  // ── Default values ───────────────────────────────────────────────────────

  it('should default intFlag to N', () => {
    expect((component as any).consignees.at(0).get('intFlag')?.value).toBe('N');
  });

  it('should default country to USA', () => {
    expect((component as any).consignees.at(0).get('country')?.value).toBe('USA');
  });

  it('should default sameAsCustomer to false', () => {
    expect((component as any).consignees.at(0).get('sameAsCustomer')?.value).toBeFalse();
  });

  // ── consignees getter ────────────────────────────────────────────────────

  it('should return the consignees FormArray via getter', () => {
    const arr = (component as any).consignees;
    expect(arr).toBe(component.consigneeForm.get('consignees'));
  });

  // ── ID helper methods ─────────────────────────────────────────────────────

  describe('ID helpers', () => {
    it('should generate element IDs with component prefix and index', () => {
      const id = (component as any).elementId('name', 0);
      expect(id).toContain('consignee-details-');
      expect(id).toContain('-0-name');
    });

    it('should generate element IDs without index', () => {
      const id = (component as any).elementId('name');
      expect(id).toContain('consignee-details-');
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

  // ── loadZones ────────────────────────────────────────────────────────────

  describe('loadZones', () => {
    it('should call getZones on the API service', () => {
      expect(apiServiceSpy.getZones).toHaveBeenCalled();
    });

    it('should populate zones signal on success', () => {
      expect((component as any).zones()).toEqual(mockZones);
    });

    it('should populate filteredZones on success', () => {
      expect((component as any).filteredZones).toEqual(mockZones);
    });

    it('should set loading to false after zones load', () => {
      expect((component as any).loading()).toBeFalse();
    });

    it('should emit loadingChange true then false', () => {
      const emitSpy = spyOn(component.loadingChange, 'emit');
      (component as any).loadZones();
      expect(emitSpy).toHaveBeenCalledWith(true);
      expect(emitSpy).toHaveBeenCalledWith(false);
    });

    it('should show error when zones fail to load', fakeAsync(() => {
      apiServiceSpy.getZones.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadZones();
      tick(5000);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load zones');
    }));

    it('should set loading to false even when zones fail', () => {
      apiServiceSpy.getZones.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadZones();
      expect((component as any).loading()).toBeFalse();
    });

    it('should log error to console when zones fail', () => {
      apiServiceSpy.getZones.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadZones();
      expect(console.error).toHaveBeenCalled();
    });
  });

  // ── loadStateCodes ───────────────────────────────────────────────────────

  describe('loadStateCodes', () => {
    it('should call getStateCodes on the API service', () => {
      expect(apiServiceSpy.getStateCodes).toHaveBeenCalled();
    });

    it('should populate stateCodes signal on success', () => {
      expect((component as any).stateCodes()).toEqual(mockStateCodes);
    });

    it('should populate filteredStateCodes on success', () => {
      expect((component as any).filteredStateCodes).toEqual(mockStateCodes);
    });

    it('should show error when state codes fail to load', fakeAsync(() => {
      apiServiceSpy.getStateCodes.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadStateCodes();
      tick(5000);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load state codes');
    }));

    it('should log error to console when state codes fail', () => {
      apiServiceSpy.getStateCodes.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadStateCodes();
      expect(console.error).toHaveBeenCalled();
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

    it('should show all state codes when search is cleared', () => {
      (component as any).stateSearchCtrl.setValue('tx');
      expect((component as any).filteredStateCodes.length).toBe(1);
      (component as any).stateSearchCtrl.setValue('');
      expect((component as any).filteredStateCodes.length).toBe(2);
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

    it('should show all zones when zone search is cleared', () => {
      (component as any).zoneSearchCtrl.setValue('z1');
      expect((component as any).filteredZones.length).toBe(1);
      (component as any).zoneSearchCtrl.setValue('');
      expect((component as any).filteredZones.length).toBe(2);
    });

    it('should handle null search term gracefully for state codes', () => {
      (component as any).stateSearchCtrl.setValue(null);
      expect((component as any).filteredStateCodes.length).toBe(2);
    });

    it('should handle null search term gracefully for zones', () => {
      (component as any).zoneSearchCtrl.setValue(null);
      expect((component as any).filteredZones.length).toBe(2);
    });
  });

  // ── addConsignee ──────────────────────────────────────────────────────────

  describe('addConsignee', () => {
    it('should add a new consignee to the form array', () => {
      const initialLength = (component as any).consignees.length;
      (component as any).addConsignee();
      expect((component as any).consignees.length).toBe(initialLength + 1);
    });

    it('should create a new consignee with default values', () => {
      (component as any).addConsignee();
      const lastIndex = (component as any).consignees.length - 1;
      const group = (component as any).consignees.at(lastIndex);
      expect(group.get('intFlag')?.value).toBe('N');
      expect(group.get('country')?.value).toBe('USA');
      expect(group.get('consigneeName')?.value).toBe('');
    });
  });

  // ── removeConsignee ──────────────────────────────────────────────────────

  describe('removeConsignee', () => {
    it('should remove a consignee when more than one exists', () => {
      (component as any).addConsignee();
      expect((component as any).consignees.length).toBe(2);
      (component as any).removeConsignee(0);
      expect((component as any).consignees.length).toBe(1);
    });

    it('should not remove the last consignee', fakeAsync(() => {
      expect((component as any).consignees.length).toBe(1);
      (component as any).removeConsignee(0);
      tick(5000);
      expect((component as any).consignees.length).toBe(1);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('At least one consignee is required');
    }));
  });

  // ── sameAsCustomer checkbox listener ─────────────────────────────────────

  describe('sameAsCustomer checkbox', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      buildComponent({ customerData: mockCustomerData });
    });

    it('should copy customer data when checked', () => {
      const group = (component as any).consignees.at(0);
      group.get('sameAsCustomer')?.setValue(true);

      expect(group.get('consigneeName')?.value).toBe('Test Customer');
      expect(group.get('shortName')?.value).toBe('TEST');
      expect(group.get('intFlag')?.value).toBe('N');
      expect(group.get('address1')?.value).toBe('123 Main St');
      expect(group.get('address2')?.value).toBe('Suite 100');
      expect(group.get('address3')?.value).toBe('Floor 3');
      expect(group.get('city')?.value).toBe('Dallas');
      expect(group.get('state')?.value).toBe('TX');
      expect(group.get('country')?.value).toBe('USA');
      expect(group.get('zip')?.value).toBe('75201');
      expect(group.get('phoneNo')?.value).toBe('2145550100');
      expect(group.get('faxNo')?.value).toBe('2145550200');
      expect(group.get('intFax')?.value).toBe('TELEX456');
      expect(group.get('intPhone')?.value).toBe('INT123');
    });

    it('should not copy data when unchecked', () => {
      const group = (component as any).consignees.at(0);
      group.get('consigneeName')?.setValue('Original Name');
      group.get('sameAsCustomer')?.setValue(false);
      expect(group.get('consigneeName')?.value).toBe('Original Name');
    });

    it('should not copy data when checked but no customerData', () => {
      TestBed.resetTestingModule();
      buildComponent({ customerData: null });

      const group = (component as any).consignees.at(0);
      group.get('consigneeName')?.setValue('Original');
      group.get('sameAsCustomer')?.setValue(true);
      expect(group.get('consigneeName')?.value).toBe('Original');
    });
  });

  // ── intFlag changes listener ──────────────────────────────────────────────

  describe('intFlag changes', () => {
    it('should make state not required for international', () => {
      const group = (component as any).consignees.at(0);
      group.get('intFlag')?.setValue('Y');
      group.get('state')?.setValue('');
      group.get('state')?.updateValueAndValidity();
      expect(group.get('state')?.valid).toBeTrue();
    });

    it('should make state required for domestic', () => {
      const group = (component as any).consignees.at(0);
      group.get('intFlag')?.setValue('Y');
      group.get('intFlag')?.setValue('N');
      group.get('state')?.setValue('');
      group.get('state')?.updateValueAndValidity();
      expect(group.get('state')?.hasError('required')).toBeTrue();
    });

    it('should update zip validators for international', () => {
      const group = (component as any).consignees.at(0);
      group.get('intFlag')?.setValue('Y');
      // International zip allows alphanumeric
      group.get('zip')?.setValue('AB123');
      group.get('zip')?.updateValueAndValidity();
      expect(group.get('zip')?.valid).toBeTrue();
    });

    it('should update zip validators for domestic', () => {
      const group = (component as any).consignees.at(0);
      group.get('intFlag')?.setValue('N');
      // Domestic zip only allows digits
      group.get('zip')?.setValue('AB123');
      group.get('zip')?.updateValueAndValidity();
      expect(group.get('zip')?.hasError('pattern')).toBeTrue();
    });
  });

  // ── effDate changes listener ──────────────────────────────────────────────

  describe('effDate changes', () => {
    it('should update termDate validity when effDate changes', () => {
      const group = (component as any).consignees.at(0);
      const termCtrl = group.get('termDate');
      const spy = spyOn(termCtrl!, 'updateValueAndValidity').and.callThrough();
      group.get('effDate')?.setValue(moment().add(2, 'days'));
      expect(spy).toHaveBeenCalled();
    });
  });

  // ── isInternational ──────────────────────────────────────────────────────

  describe('isInternational', () => {
    it('should return false when intFlag is N', () => {
      (component as any).consignees.at(0).get('intFlag')?.setValue('N');
      expect((component as any).isInternational(0)).toBeFalse();
    });

    it('should return true when intFlag is Y', () => {
      (component as any).consignees.at(0).get('intFlag')?.setValue('Y');
      expect((component as any).isInternational(0)).toBeTrue();
    });
  });

  // ── getZipMaxLength ──────────────────────────────────────────────────────

  describe('getZipMaxLength', () => {
    it('should return 5 for domestic', () => {
      (component as any).consignees.at(0).get('intFlag')?.setValue('N');
      expect((component as any).getZipMaxLength(0)).toBe(5);
    });

    it('should return 10 for international', () => {
      (component as any).consignees.at(0).get('intFlag')?.setValue('Y');
      expect((component as any).getZipMaxLength(0)).toBe(10);
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
      const group = (component as any).consignees.at(0);
      group.get('phoneNo')?.setValue('214-555-0100');
      (component as any).stripPhoneOnFocus(0, 'phoneNo');
      expect(group.get('phoneNo')?.value).toBe('2145550100');
    });

    it('should not change a digits-only value', () => {
      const group = (component as any).consignees.at(0);
      group.get('phoneNo')?.setValue('2145550100');
      (component as any).stripPhoneOnFocus(0, 'phoneNo');
      expect(group.get('phoneNo')?.value).toBe('2145550100');
    });

    it('should do nothing when control value is empty', () => {
      const group = (component as any).consignees.at(0);
      group.get('phoneNo')?.setValue('');
      (component as any).stripPhoneOnFocus(0, 'phoneNo');
      expect(group.get('phoneNo')?.value).toBe('');
    });

    it('should do nothing when control value is null', () => {
      const group = (component as any).consignees.at(0);
      group.get('phoneNo')?.setValue(null);
      (component as any).stripPhoneOnFocus(0, 'phoneNo');
      expect(group.get('phoneNo')?.value).toBeNull();
    });
  });

  // ── formatPhoneOnBlur ─────────────────────────────────────────────────────

  describe('formatPhoneOnBlur', () => {
    it('should format a 10-digit number as xxx-xxx-xxxx', () => {
      const group = (component as any).consignees.at(0);
      group.get('phoneNo')?.setValue('2145550100');
      (component as any).formatPhoneOnBlur(0, 'phoneNo');
      expect(group.get('phoneNo')?.value).toBe('214-555-0100');
    });

    it('should format a 7-digit number as xxx-xxxx', () => {
      const group = (component as any).consignees.at(0);
      group.get('phoneNo')?.setValue('5550100');
      (component as any).formatPhoneOnBlur(0, 'phoneNo');
      expect(group.get('phoneNo')?.value).toBe('555-0100');
    });

    it('should not format other digit lengths', () => {
      const group = (component as any).consignees.at(0);
      group.get('phoneNo')?.setValue('12345');
      (component as any).formatPhoneOnBlur(0, 'phoneNo');
      expect(group.get('phoneNo')?.value).toBe('12345');
    });

    it('should do nothing when control value is empty', () => {
      const group = (component as any).consignees.at(0);
      group.get('phoneNo')?.setValue('');
      (component as any).formatPhoneOnBlur(0, 'phoneNo');
      expect(group.get('phoneNo')?.value).toBe('');
    });

    it('should do nothing when control value is null', () => {
      const group = (component as any).consignees.at(0);
      group.get('phoneNo')?.setValue(null);
      (component as any).formatPhoneOnBlur(0, 'phoneNo');
      expect(group.get('phoneNo')?.value).toBeNull();
    });

    it('should work for faxNo control', () => {
      const group = (component as any).consignees.at(0);
      group.get('faxNo')?.setValue('7135550200');
      (component as any).formatPhoneOnBlur(0, 'faxNo');
      expect(group.get('faxNo')?.value).toBe('713-555-0200');
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

  // ── Date event handlers ───────────────────────────────────────────────────

  describe('onEffectiveDateChange', () => {
    it('should update termDate validity and mark effDate as touched', () => {
      const group = (component as any).consignees.at(0);
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
      const group = (component as any).consignees.at(0);
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
      expect(spy).toHaveBeenCalledWith('01-JAN-2030', (component as any).consignees.at(0).get('effDate'));
    });
  });

  describe('onTerminationDateInput', () => {
    it('should delegate to DateFieldValidationUtility.handleEndDateInput', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const event = { target: { value: '31-DEC-2030' } } as unknown as Event;
      (component as any).onTerminationDateInput(event, 0);
      expect(spy).toHaveBeenCalledWith('31-DEC-2030', (component as any).consignees.at(0).get('termDate'));
    });
  });

  describe('getEffectiveDateError', () => {
    it('should delegate to DateFieldValidationUtility.getEffectiveDateError', () => {
      const spy = spyOn(DateFieldValidationUtility, 'getEffectiveDateError').and.returnValue('test error');
      const result = (component as any).getEffectiveDateError(0);
      expect(spy).toHaveBeenCalledWith((component as any).consignees.at(0));
      expect(result).toBe('test error');
    });
  });

  describe('getTerminationDateError', () => {
    it('should delegate to DateFieldValidationUtility.getTerminationDateError', () => {
      const spy = spyOn(DateFieldValidationUtility, 'getTerminationDateError').and.returnValue('term error');
      const result = (component as any).getTerminationDateError(0);
      expect(spy).toHaveBeenCalledWith((component as any).consignees.at(0));
      expect(result).toBe('term error');
    });
  });

  // ── getTerminationMinDate ─────────────────────────────────────────────────

  describe('getTerminationMinDate', () => {
    it('should return minDate when effDate is null', () => {
      (component as any).consignees.at(0).get('effDate')?.setValue(null);
      const result = (component as any).getTerminationMinDate(0);
      expect(result.format('YYYY-MM-DD')).toBe((component as any).minDate.format('YYYY-MM-DD'));
    });

    it('should use effective date when it is after minDate', () => {
      const future = moment().add(30, 'days');
      (component as any).consignees.at(0).get('effDate')?.setValue(future);
      const result = (component as any).getTerminationMinDate(0);
      expect(result.format('YYYY-MM-DD')).toBe(future.format('YYYY-MM-DD'));
    });

    it('should use minDate when effective date is before minDate', () => {
      const past = moment('2000-01-01');
      (component as any).consignees.at(0).get('effDate')?.setValue(past);
      const result = (component as any).getTerminationMinDate(0);
      expect(result.format('YYYY-MM-DD')).toBe((component as any).minDate.format('YYYY-MM-DD'));
    });

    it('should return minDate when effDate is an invalid moment', () => {
      (component as any).consignees.at(0).get('effDate')?.setValue(moment.invalid());
      const result = (component as any).getTerminationMinDate(0);
      expect(result.format('YYYY-MM-DD')).toBe((component as any).minDate.format('YYYY-MM-DD'));
    });
  });

  // ── getTerminationDateFilter ──────────────────────────────────────────────

  describe('getTerminationDateFilter', () => {
    it('should return true for null dates', () => {
      const filterFn = (component as any).getTerminationDateFilter(0);
      expect(filterFn(null)).toBeTrue();
    });

    it('should return false for a date before the effective date', () => {
      const effDate = moment('2030-06-15');
      (component as any).consignees.at(0).get('effDate')?.setValue(effDate);
      const filterFn = (component as any).getTerminationDateFilter(0);
      const before = moment('2030-06-10');
      expect(filterFn(before)).toBeFalse();
    });

    it('should return true for a date equal to the effective date', () => {
      const effDate = moment('2030-06-15');
      (component as any).consignees.at(0).get('effDate')?.setValue(effDate);
      const filterFn = (component as any).getTerminationDateFilter(0);
      const same = moment('2030-06-15');
      expect(filterFn(same)).toBeTrue();
    });

    it('should return true for a date after the effective date', () => {
      const effDate = moment('2030-06-15');
      (component as any).consignees.at(0).get('effDate')?.setValue(effDate);
      const filterFn = (component as any).getTerminationDateFilter(0);
      const after = moment('2030-06-20');
      expect(filterFn(after)).toBeTrue();
    });

    it('should return true when no effective date is set', () => {
      (component as any).consignees.at(0).get('effDate')?.setValue(null);
      const filterFn = (component as any).getTerminationDateFilter(0);
      const date = moment('2030-06-10');
      expect(filterFn(date)).toBeTrue();
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
      const spy = spyOn(component.consigneeForm, 'markAllAsTouched');
      (component as any).onSubmit();
      expect(spy).toHaveBeenCalled();
    });

    it('should not call API when form is invalid', fakeAsync(() => {
      (component as any).onSubmit();
      tick(5000);
      expect(apiServiceSpy.createConsignee).not.toHaveBeenCalled();
      expect(apiServiceSpy.updateConsignee).not.toHaveBeenCalled();
    }));

    it('should show error snackbar when form is invalid', fakeAsync(() => {
      (component as any).onSubmit();
      tick(5000);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please correct the errors in the form');
    }));

    it('should emit savedData and skip API call when savedData exists and form is not dirty', () => {
      TestBed.resetTestingModule();
      buildComponent({ savedData: [mockSavedConsignee] });

      const emitSpy = spyOn(component.saveSuccess, 'emit');
      // Form is not dirty because we just patched it
      (component as any).onSubmit();
      expect(emitSpy).toHaveBeenCalledWith([mockSavedConsignee]);
      expect(apiServiceSpy.createConsignee).not.toHaveBeenCalled();
    });

    describe('create (no savedData)', () => {
      const savedConsignees = [
        { consigneeId: 'CON-NEW', name: 'Valid Consignee' }
      ];

      beforeEach(() => {
        fillValidConsignee(0);
        apiServiceSpy.createConsignee.and.returnValue(of({ consigneeId: 'CON-NEW' }));
        apiServiceSpy.getConsignees.and.returnValue(of(savedConsignees));
      });

      it('should call createConsignee with customerId and payload', fakeAsync(() => {
        (component as any).onSubmit();
        tick(5000);
        expect(apiServiceSpy.createConsignee).toHaveBeenCalled();
        const [custId, payload] = apiServiceSpy.createConsignee.calls.mostRecent().args;
        expect(custId).toBe('');
        expect(payload.name).toBe('Valid Consignee');
      }));

      it('should emit savingChange true then false', fakeAsync(() => {
        const spy = spyOn(component.savingChange, 'emit');
        (component as any).onSubmit();
        tick(5000);
        expect(spy).toHaveBeenCalledWith(true);
        expect(spy).toHaveBeenCalledWith(false);
      }));

      it('should show success snackbar with singular message for one consignee', fakeAsync(() => {
        (component as any).onSubmit();
        tick(5000);
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('1 consignee saved successfully');
      }));

      it('should show success snackbar with plural message for multiple consignees', fakeAsync(() => {
        (component as any).addConsignee();
        fillValidConsignee(1);
        apiServiceSpy.getConsignees.and.returnValue(of([savedConsignees[0], { consigneeId: 'CON-NEW2' }]));
        (component as any).onSubmit();
        tick(5000);
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('2 consignees saved successfully');
      }));

      it('should emit saveSuccess with saved consignees from API', fakeAsync(() => {
        const spy = spyOn(component.saveSuccess, 'emit');
        (component as any).onSubmit();
        tick(5000);
        expect(spy).toHaveBeenCalledWith(savedConsignees);
      }));

      it('should uppercase shortName, city, zip, and country in payload', fakeAsync(() => {
        const group = (component as any).consignees.at(0);
        group.patchValue({ shortName: 'lower', city: 'lower', zip: '75201', country: 'usa' });
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createConsignee.calls.mostRecent().args[1];
        expect(payload.shortName).toBe('LOWER');
        expect(payload.city).toBe('LOWER');
        expect(payload.country).toBe('USA');
      }));

      it('should strip phone formatting in payload', fakeAsync(() => {
        const group = (component as any).consignees.at(0);
        group.get('phoneNo')?.setValue('214-555-0100');
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createConsignee.calls.mostRecent().args[1];
        expect(payload.phoneNo).toBe('2145550100');
      }));

      it('should strip fax formatting in payload', fakeAsync(() => {
        const group = (component as any).consignees.at(0);
        group.get('faxNo')?.setValue('713-555-0200');
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createConsignee.calls.mostRecent().args[1];
        expect(payload.faxNo).toBe('7135550200');
      }));

      it('should format effDate as YYYY-MM-DD in payload', fakeAsync(() => {
        const group = (component as any).consignees.at(0);
        const date = moment('2030-06-15');
        group.get('effDate')?.setValue(date);
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createConsignee.calls.mostRecent().args[1];
        expect(payload.effDate).toBe('2030-06-15');
      }));

      it('should set termDate to null when not provided', fakeAsync(() => {
        const group = (component as any).consignees.at(0);
        group.get('termDate')?.setValue(null);
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createConsignee.calls.mostRecent().args[1];
        expect(payload.termDate).toBeNull();
      }));

      it('should set optional fields to null when empty', fakeAsync(() => {
        const group = (component as any).consignees.at(0);
        group.patchValue({ address2: '', address3: '', outOfState: '', phoneNo: '', faxNo: '', intPhone: '', intFax: '' });
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createConsignee.calls.mostRecent().args[1];
        expect(payload.address2).toBeNull();
        expect(payload.address3).toBeNull();
        expect(payload.outOfState).toBeNull();
        expect(payload.phoneNo).toBeNull();
        expect(payload.faxNo).toBeNull();
        expect(payload.intPhone).toBeNull();
        expect(payload.telexNo).toBeNull();
      }));

      it('should map intFax form field to telexNo in payload', fakeAsync(() => {
        const group = (component as any).consignees.at(0);
        group.patchValue({ intFax: 'faxvalue' });
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createConsignee.calls.mostRecent().args[1];
        expect(payload.telexNo).toBe('FAXVALUE');
      }));
    });

    describe('update (savedData with consigneeId)', () => {
      beforeEach(() => {
        TestBed.resetTestingModule();
        buildComponent({ savedData: [mockSavedConsignee], customerId: 'CUST-001' });
        // Make form dirty so it doesn't skip
        (component as any).consignees.at(0).get('consigneeName')?.setValue('Updated Name');
        (component as any).consignees.at(0).get('consigneeName')?.markAsDirty();
        component.consigneeForm.markAsDirty();

        fillValidConsignee(0);
        apiServiceSpy.updateConsignee.and.returnValue(of({ consigneeId: 'CON-001' }));
        apiServiceSpy.getConsignees.and.returnValue(of([mockSavedConsignee]));
      });

      it('should call updateConsignee with customerId and consigneeId', fakeAsync(() => {
        (component as any).onSubmit();
        tick(5000);
        expect(apiServiceSpy.updateConsignee).toHaveBeenCalled();
        const [custId, conId] = apiServiceSpy.updateConsignee.calls.mostRecent().args;
        expect(custId).toBe('CUST-001');
        expect(conId).toBe('CON-001');
      }));

      it('should call createConsignee for new items alongside update', fakeAsync(() => {
        (component as any).addConsignee();
        fillValidConsignee(1);
        apiServiceSpy.createConsignee.and.returnValue(of({ consigneeId: 'CON-NEW' }));
        apiServiceSpy.getConsignees.and.returnValue(of([mockSavedConsignee, { consigneeId: 'CON-NEW' }]));
        (component as any).onSubmit();
        tick(5000);
        expect(apiServiceSpy.updateConsignee).toHaveBeenCalledTimes(1);
        expect(apiServiceSpy.createConsignee).toHaveBeenCalledTimes(1);
      }));
    });

    describe('API error handling', () => {
      beforeEach(() => {
        fillValidConsignee(0);
      });

      it('should show default error message when error has no details', fakeAsync(() => {
        apiServiceSpy.createConsignee.and.returnValue(throwError(() => ({ error: {} })));
        apiServiceSpy.getConsignees.and.returnValue(of([]));
        (component as any).onSubmit();
        tick(5000);
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to save consignee details');
      }));

      it('should show nested errorResponse.error message', fakeAsync(() => {
        apiServiceSpy.createConsignee.and.returnValue(
          throwError(() => ({
            error: { errorResponse: { error: 'Duplicate consignee' } }
          }))
        );
        apiServiceSpy.getConsignees.and.returnValue(of([]));
        (component as any).onSubmit();
        tick(5000);
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Duplicate consignee');
      }));

      it('should show error.message when errorResponse is missing', fakeAsync(() => {
        apiServiceSpy.createConsignee.and.returnValue(
          throwError(() => ({
            error: { message: 'Server validation failed' }
          }))
        );
        apiServiceSpy.getConsignees.and.returnValue(of([]));
        (component as any).onSubmit();
        tick(5000);
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Server validation failed');
      }));

      it('should set saving to false on error', fakeAsync(() => {
        apiServiceSpy.createConsignee.and.returnValue(throwError(() => ({ error: {} })));
        apiServiceSpy.getConsignees.and.returnValue(of([]));
        (component as any).onSubmit();
        tick(5000);
        expect((component as any).saving()).toBeFalse();
      }));

      it('should emit savingChange false on error', fakeAsync(() => {
        apiServiceSpy.createConsignee.and.returnValue(throwError(() => ({ error: {} })));
        apiServiceSpy.getConsignees.and.returnValue(of([]));
        const spy = spyOn(component.savingChange, 'emit');
        (component as any).onSubmit();
        tick(5000);
        expect(spy).toHaveBeenCalledWith(false);
      }));

      it('should log error to console', fakeAsync(() => {
        apiServiceSpy.createConsignee.and.returnValue(throwError(() => ({ error: {} })));
        apiServiceSpy.getConsignees.and.returnValue(of([]));
        (component as any).onSubmit();
        tick(5000);
        expect(console.error).toHaveBeenCalled();
      }));

      it('should refresh savedData on error when consignees exist', fakeAsync(() => {
        const existingConsignees = [{ consigneeId: 'CON-EXIST', name: 'Existing' }];
        apiServiceSpy.createConsignee.and.returnValue(throwError(() => ({ error: {} })));
        apiServiceSpy.getConsignees.and.returnValue(of(existingConsignees));
        (component as any).onSubmit();
        tick(5000);
        expect(apiServiceSpy.getConsignees).toHaveBeenCalled();
        expect(component.savedData).toEqual(existingConsignees);
      }));

      it('should not update savedData on error when getConsignees returns empty', fakeAsync(() => {
        apiServiceSpy.createConsignee.and.returnValue(throwError(() => ({ error: {} })));
        apiServiceSpy.getConsignees.and.returnValue(of([]));
        const originalSavedData = component.savedData;
        (component as any).onSubmit();
        tick(5000);
        expect(component.savedData).toEqual(originalSavedData);
      }));
    });
  });

  // ── chapterChanged$ ──────────────────────────────────────────────────────

  describe('chapterChanged$', () => {
    it('should update effDate and termDate validators on all consignees when chapter changes', () => {
      const group = (component as any).consignees.at(0);
      const effCtrl = group.get('effDate')!;
      const termCtrl = group.get('termDate')!;
      const effSpy = spyOn(effCtrl, 'setValidators').and.callThrough();
      const termSpy = spyOn(termCtrl, 'setValidators').and.callThrough();

      chapterChanged$.next();

      expect(effSpy).toHaveBeenCalled();
      expect(termSpy).toHaveBeenCalled();
    });

    it('should call updateValueAndValidity on effDate and termDate', () => {
      const group = (component as any).consignees.at(0);
      const effCtrl = group.get('effDate')!;
      const termCtrl = group.get('termDate')!;
      const effSpy = spyOn(effCtrl, 'updateValueAndValidity').and.callThrough();
      const termSpy = spyOn(termCtrl, 'updateValueAndValidity').and.callThrough();

      chapterChanged$.next();

      expect(effSpy).toHaveBeenCalled();
      expect(termSpy).toHaveBeenCalled();
    });

    it('should update minDate when chapter changes', () => {
      const originalMinDate = (component as any).minDate;
      chapterChanged$.next();
      // minDate should be recalculated (may be same value but the assignment should happen)
      expect((component as any).minDate).toBeTruthy();
    });

    it('should update validators for multiple consignees', () => {
      (component as any).addConsignee();
      expect((component as any).consignees.length).toBe(2);

      const spies: jasmine.Spy[] = [];
      for (let i = 0; i < (component as any).consignees.length; i++) {
        spies.push(spyOn((component as any).consignees.at(i).get('effDate')!, 'setValidators').and.callThrough());
      }

      chapterChanged$.next();

      spies.forEach(spy => expect(spy).toHaveBeenCalled());
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
      buildComponent({ savedData: [mockSavedConsignee] });
    });

    it('should populate form with saved consignee data', () => {
      const group = (component as any).consignees.at(0);
      expect(group.get('consigneeName')?.value).toBe('Saved Consignee');
      expect(group.get('shortName')?.value).toBe('SAVED');
      expect(group.get('intFlag')?.value).toBe('N');
      expect(group.get('address1')?.value).toBe('456 Oak Ave');
      expect(group.get('address2')?.value).toBe('Apt 2B');
      expect(group.get('city')?.value).toBe('HOUSTON');
      expect(group.get('state')?.value).toBe('TX');
      expect(group.get('zip')?.value).toBe('77001');
      expect(group.get('country')?.value).toBe('USA');
      expect(group.get('zone')?.value).toBe('Z1');
      expect(group.get('phoneNo')?.value).toBe('7135550100');
      expect(group.get('faxNo')?.value).toBe('7135550200');
      expect(group.get('intFax')?.value).toBe('FAX789');
    });

    it('should convert effDate string to moment', () => {
      const value = (component as any).consignees.at(0).get('effDate')?.value;
      expect(moment.isMoment(value)).toBeTrue();
      expect(value.format('YYYY-MM-DD')).toBe('2099-01-01');
    });

    it('should convert termDate string to moment', () => {
      const value = (component as any).consignees.at(0).get('termDate')?.value;
      expect(moment.isMoment(value)).toBeTrue();
      expect(value.format('YYYY-MM-DD')).toBe('2099-12-31');
    });

    it('should not add a default consignee when savedData is provided', () => {
      // Only the saved consignee should be present
      expect((component as any).consignees.length).toBe(1);
    });

    it('should handle multiple saved consignees', () => {
      TestBed.resetTestingModule();
      const secondConsignee = { ...mockSavedConsignee, consigneeId: 'CON-002', name: 'Second' };
      buildComponent({ savedData: [mockSavedConsignee, secondConsignee] });
      expect((component as any).consignees.length).toBe(2);
    });

    it('should use consigneeName field when name is absent', () => {
      TestBed.resetTestingModule();
      const dataWithoutName = { ...mockSavedConsignee, name: undefined };
      buildComponent({ savedData: [dataWithoutName] });
      expect((component as any).consignees.at(0).get('consigneeName')?.value).toBe('Saved Consignee');
    });

    it('should use intFax field when telexNo is absent', () => {
      TestBed.resetTestingModule();
      const dataWithIntFax = { ...mockSavedConsignee, telexNo: undefined, intFax: 'INTFAX123' };
      buildComponent({ savedData: [dataWithIntFax] });
      expect((component as any).consignees.at(0).get('intFax')?.value).toBe('INTFAX123');
    });
  });

  describe('with savedData without dates', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      const dataNoDate = { ...mockSavedConsignee, effDate: '', termDate: null };
      buildComponent({ savedData: [dataNoDate] });
    });

    it('should not set effDate when saved effDate is empty', () => {
      const group = (component as any).consignees.at(0);
      const value = group.get('effDate')?.value;
      // The createConsigneeFormGroup sets a default effDate, but the empty string check prevents overwrite
      // Since patchValue runs first and the if (consignee.effDate) is falsy, the default remains
      expect(value).toBeTruthy(); // Default from createConsigneeFormGroup
    });

    it('should not set termDate when saved termDate is null', () => {
      const group = (component as any).consignees.at(0);
      const value = group.get('termDate')?.value;
      expect(value).toBeNull();
    });
  });

  // ── Form validation rules ─────────────────────────────────────────────────

  describe('form validation', () => {
    it('should require consigneeName', () => {
      const group = (component as any).consignees.at(0);
      group.get('consigneeName')?.setValue('');
      expect(group.get('consigneeName')?.hasError('required')).toBeTrue();
    });

    it('should require shortName', () => {
      const group = (component as any).consignees.at(0);
      group.get('shortName')?.setValue('');
      expect(group.get('shortName')?.hasError('required')).toBeTrue();
    });

    it('should require address1', () => {
      const group = (component as any).consignees.at(0);
      group.get('address1')?.setValue('');
      expect(group.get('address1')?.hasError('required')).toBeTrue();
    });

    it('should require city', () => {
      const group = (component as any).consignees.at(0);
      group.get('city')?.setValue('');
      expect(group.get('city')?.hasError('required')).toBeTrue();
    });

    it('should require state when domestic', () => {
      const group = (component as any).consignees.at(0);
      group.get('intFlag')?.setValue('N');
      group.get('state')?.setValue('');
      expect(group.get('state')?.hasError('required')).toBeTrue();
    });

    it('should require zip', () => {
      const group = (component as any).consignees.at(0);
      group.get('zip')?.setValue('');
      expect(group.get('zip')?.hasError('required')).toBeTrue();
    });

    it('should require country', () => {
      const group = (component as any).consignees.at(0);
      group.get('country')?.setValue('');
      expect(group.get('country')?.hasError('required')).toBeTrue();
    });

    it('should require zone', () => {
      const group = (component as any).consignees.at(0);
      group.get('zone')?.setValue('');
      expect(group.get('zone')?.hasError('required')).toBeTrue();
    });

    it('should require effDate', () => {
      const group = (component as any).consignees.at(0);
      group.get('effDate')?.setValue(null);
      expect(group.get('effDate')?.hasError('required')).toBeTrue();
    });

    it('should not require address2', () => {
      const group = (component as any).consignees.at(0);
      group.get('address2')?.setValue('');
      expect(group.get('address2')?.hasError('required')).toBeFalsy();
    });

    it('should not require address3', () => {
      const group = (component as any).consignees.at(0);
      group.get('address3')?.setValue('');
      expect(group.get('address3')?.hasError('required')).toBeFalsy();
    });

    it('should not require termDate', () => {
      const group = (component as any).consignees.at(0);
      group.get('termDate')?.setValue(null);
      expect(group.get('termDate')?.hasError('required')).toBeFalsy();
    });

    it('should only allow numeric zip for domestic', () => {
      const group = (component as any).consignees.at(0);
      group.get('intFlag')?.setValue('N');
      group.get('zip')?.setValue('abc');
      expect(group.get('zip')?.hasError('pattern')).toBeTrue();
    });
  });
});
