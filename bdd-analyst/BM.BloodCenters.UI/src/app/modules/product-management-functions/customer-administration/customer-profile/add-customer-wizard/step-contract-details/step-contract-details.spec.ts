import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, of, throwError } from 'rxjs';
import moment from 'moment';

import { StepContractDetailsComponent } from './step-contract-details';
import { AddCustomerWizardApiService } from '../add-customer-wizard-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

// ── Mock data ────────────────────────────────────────────────────────────────

const mockSavedContract = {
  contractId: 'CTR-001',
  rotationFlag: 'Y',
  rotation: 'Y',
  hospitalLevel: 'A1',
  poNumber: 'PO-12345',
  creditLimit: 5000,
  startTerm: '2099-01-01',
  endTerm: '2099-06-30',
  effDate: '2099-03-01',
  termDate: '2099-12-31'
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('StepContractDetailsComponent', () => {
  let component: StepContractDetailsComponent;
  let fixture: ComponentFixture<StepContractDetailsComponent>;
  let apiServiceSpy: jasmine.SpyObj<AddCustomerWizardApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let chapterChanged$: Subject<void>;

  function buildComponent(opts: {
    savedData?: any;
    customerId?: string;
  } = {}) {
    apiServiceSpy = jasmine.createSpyObj('AddCustomerWizardApiService', [
      'createContract', 'updateContract', 'getContracts'
    ]);
    snackbarServiceSpy = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError', 'showInfo']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['dismiss']);
    chapterChanged$ = new Subject<void>();

    const headerServiceMock = {
      chapterChanged$: chapterChanged$.asObservable(),
      chapterTimeZone: signal('-05:00')
    };

    TestBed.configureTestingModule({
      imports: [StepContractDetailsComponent, NoopAnimationsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AddCustomerWizardApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: HeaderService, useValue: headerServiceMock }
      ]
    });

    fixture = TestBed.createComponent(StepContractDetailsComponent);
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

  /**
   * Fill the contract form with valid near-future data for create tests.
   * Includes fixture.detectChanges() to sync MatDatepicker [min] bindings.
   */
  function fillValidContract() {
    component.contractForm.patchValue({
      rotation: 'Y',
      hospitalLevel: 'A1',
      poNumber: 'PO-123',
      creditLimit: 5000,
      startTerm: moment().add(1, 'day'),
      endTerm: moment().add(30, 'days'),
      effDate: moment().add(1, 'day'),
      termDate: moment().add(60, 'days')
    });
    component.contractForm.markAsDirty();
    fixture.detectChanges(); // sync MatDatepicker [min] template bindings
  }

  // ── Default setup (new, no savedData) ────────────────────────────────────

  beforeEach(() => {
    buildComponent();
  });

  // ── Creation & form initialisation ────────────────────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialise a FormGroup', () => {
    expect(component.contractForm).toBeTruthy();
  });

  it('should initialise form with expected controls', () => {
    const expectedControls = [
      'rotation', 'hospitalLevel', 'poNumber', 'creditLimit',
      'startTerm', 'endTerm', 'effDate', 'termDate'
    ];
    for (const ctrl of expectedControls) {
      expect(component.contractForm.get(ctrl)).toBeTruthy(`missing control: ${ctrl}`);
    }
  });

  // ── Default values ───────────────────────────────────────────────────────

  it('should default rotation to Y', () => {
    expect(component.contractForm.get('rotation')?.value).toBe('Y');
  });

  it('should default hospitalLevel to empty string', () => {
    expect(component.contractForm.get('hospitalLevel')?.value).toBe('');
  });

  it('should default poNumber to empty string', () => {
    expect(component.contractForm.get('poNumber')?.value).toBe('');
  });

  it('should default creditLimit to null', () => {
    expect(component.contractForm.get('creditLimit')?.value).toBeNull();
  });

  it('should default startTerm to null', () => {
    expect(component.contractForm.get('startTerm')?.value).toBeNull();
  });

  it('should default endTerm to null', () => {
    expect(component.contractForm.get('endTerm')?.value).toBeNull();
  });

  it('should default effDate to null', () => {
    expect(component.contractForm.get('effDate')?.value).toBeNull();
  });

  it('should default termDate to null', () => {
    expect(component.contractForm.get('termDate')?.value).toBeNull();
  });

  // ── f getter ─────────────────────────────────────────────────────────────

  it('should return form controls via f getter', () => {
    const controls = (component as any).f;
    expect(controls).toBe(component.contractForm.controls);
  });

  // ── ID helper methods ─────────────────────────────────────────────────────

  describe('ID helpers', () => {
    it('should generate element IDs with component prefix', () => {
      const id = (component as any).elementId('poNumber');
      expect(id).toContain('contract-details-');
      expect(id).toContain('-poNumber');
    });

    it('should generate error IDs', () => {
      const id = (component as any).errorId('creditLimit');
      expect(id).toContain('contract-details-');
      expect(id).toContain('-creditLimit-error');
    });

    it('should generate label IDs', () => {
      const id = (component as any).labelId('effDate');
      expect(id).toContain('contract-details-');
      expect(id).toContain('-effDate-label');
    });
  });

  // ── ngOnInit ─────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should set minDate from DateFieldValidationUtility', () => {
      expect((component as any).minDate).toBeTruthy();
    });

    it('should set terminationMinDate equal to minDate initially', () => {
      expect((component as any).terminationMinDate.format('YYYY-MM-DD'))
        .toBe((component as any).minDate.format('YYYY-MM-DD'));
    });
  });

  // ── chapterChanged$ ──────────────────────────────────────────────────────

  describe('chapterChanged$', () => {
    it('should update minDate when chapter changes', () => {
      chapterChanged$.next();
      expect((component as any).minDate).toBeTruthy();
    });

    it('should update effDate validators when chapter changes', () => {
      const effCtrl = component.contractForm.get('effDate')!;
      const spy = spyOn(effCtrl, 'setValidators').and.callThrough();
      chapterChanged$.next();
      expect(spy).toHaveBeenCalled();
    });

    it('should call updateValueAndValidity on effDate when chapter changes', () => {
      const effCtrl = component.contractForm.get('effDate')!;
      const spy = spyOn(effCtrl, 'updateValueAndValidity').and.callThrough();
      chapterChanged$.next();
      expect(spy).toHaveBeenCalled();
    });

    it('should update termDate validators when chapter changes', () => {
      const termCtrl = component.contractForm.get('termDate')!;
      const spy = spyOn(termCtrl, 'setValidators').and.callThrough();
      chapterChanged$.next();
      expect(spy).toHaveBeenCalled();
    });

    it('should call updateValueAndValidity on termDate when chapter changes', () => {
      const termCtrl = component.contractForm.get('termDate')!;
      const spy = spyOn(termCtrl, 'updateValueAndValidity').and.callThrough();
      chapterChanged$.next();
      expect(spy).toHaveBeenCalled();
    });

    it('should call updateTerminationMinDate when chapter changes', () => {
      const effDate = moment().add(30, 'days');
      component.contractForm.get('effDate')?.setValue(effDate);
      chapterChanged$.next();
      expect((component as any).terminationMinDate).toBeTruthy();
    });
  });

  // ── setupFormListeners ───────────────────────────────────────────────────

  describe('setupFormListeners', () => {
    it('should update termDate validity when effDate changes', () => {
      const termCtrl = component.contractForm.get('termDate')!;
      const spy = spyOn(termCtrl, 'updateValueAndValidity').and.callThrough();
      component.contractForm.get('effDate')?.setValue(moment().add(2, 'days'));
      expect(spy).toHaveBeenCalled();
    });

    it('should update endTerm validity when startTerm changes', () => {
      const endCtrl = component.contractForm.get('endTerm')!;
      const spy = spyOn(endCtrl, 'updateValueAndValidity').and.callThrough();
      component.contractForm.get('startTerm')?.setValue(moment().add(2, 'days'));
      expect(spy).toHaveBeenCalled();
    });
  });

  // ── getEffectiveDateError ────────────────────────────────────────────────

  describe('getEffectiveDateError', () => {
    it('should delegate to DateFieldValidationUtility.getEffectiveDateError', () => {
      const spy = spyOn(DateFieldValidationUtility, 'getEffectiveDateError').and.returnValue('eff error');
      const result = (component as any).getEffectiveDateError();
      expect(spy).toHaveBeenCalledWith(component.contractForm);
      expect(result).toBe('eff error');
    });
  });

  // ── getTerminationDateError ──────────────────────────────────────────────

  describe('getTerminationDateError', () => {
    it('should delegate to DateFieldValidationUtility.getTerminationDateError', () => {
      const spy = spyOn(DateFieldValidationUtility, 'getTerminationDateError').and.returnValue('term error');
      const result = (component as any).getTerminationDateError();
      expect(spy).toHaveBeenCalledWith(component.contractForm);
      expect(result).toBe('term error');
    });
  });

  // ── updateTerminationMinDate ─────────────────────────────────────────────

  describe('updateTerminationMinDate', () => {
    it('should use minDate when effDate is null', () => {
      component.contractForm.get('effDate')?.setValue(null);
      (component as any).updateTerminationMinDate();
      expect((component as any).terminationMinDate.format('YYYY-MM-DD'))
        .toBe((component as any).minDate.format('YYYY-MM-DD'));
    });

    it('should use effective date when it is a valid moment after minDate', () => {
      const future = moment().add(30, 'days');
      component.contractForm.get('effDate')?.setValue(future);
      (component as any).updateTerminationMinDate();
      expect((component as any).terminationMinDate.format('YYYY-MM-DD'))
        .toBe(future.format('YYYY-MM-DD'));
    });

    it('should use minDate when effective date is a valid moment before minDate', () => {
      const past = moment('2000-01-01');
      component.contractForm.get('effDate')?.setValue(past);
      (component as any).updateTerminationMinDate();
      expect((component as any).terminationMinDate.format('YYYY-MM-DD'))
        .toBe((component as any).minDate.format('YYYY-MM-DD'));
    });

    it('should handle effective date as native Date object after minDate', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      component.contractForm.get('effDate')?.setValue(futureDate);
      (component as any).updateTerminationMinDate();
      const expectedMoment = moment(futureDate);
      expect((component as any).terminationMinDate.format('YYYY-MM-DD'))
        .toBe(expectedMoment.format('YYYY-MM-DD'));
    });

    it('should handle effective date as native Date object before minDate', () => {
      const pastDate = new Date('2000-01-01');
      component.contractForm.get('effDate')?.setValue(pastDate);
      (component as any).updateTerminationMinDate();
      expect((component as any).terminationMinDate.format('YYYY-MM-DD'))
        .toBe((component as any).minDate.format('YYYY-MM-DD'));
    });

    it('should use minDate when effDate is an invalid moment', () => {
      component.contractForm.get('effDate')?.setValue(moment.invalid());
      (component as any).updateTerminationMinDate();
      expect((component as any).terminationMinDate.format('YYYY-MM-DD'))
        .toBe((component as any).minDate.format('YYYY-MM-DD'));
    });

    it('should fall back to minDate when effDate has no value', () => {
      component.contractForm.get('effDate')?.setValue('');
      (component as any).updateTerminationMinDate();
      expect((component as any).terminationMinDate).toBeTruthy();
    });
  });

  // ── onEffectiveDateChange ────────────────────────────────────────────────

  describe('onEffectiveDateChange', () => {
    it('should update termDate validity', () => {
      const termCtrl = component.contractForm.get('termDate')!;
      const spy = spyOn(termCtrl, 'updateValueAndValidity');
      (component as any).onEffectiveDateChange();
      expect(spy).toHaveBeenCalled();
    });

    it('should mark effDate as touched', () => {
      const effCtrl = component.contractForm.get('effDate')!;
      const spy = spyOn(effCtrl, 'markAsTouched');
      (component as any).onEffectiveDateChange();
      expect(spy).toHaveBeenCalled();
    });
  });

  // ── onTerminationDateChange ──────────────────────────────────────────────

  describe('onTerminationDateChange', () => {
    it('should mark termDate as touched', () => {
      const termCtrl = component.contractForm.get('termDate')!;
      const spy = spyOn(termCtrl, 'markAsTouched');
      (component as any).onTerminationDateChange();
      expect(spy).toHaveBeenCalled();
    });
  });

  // ── onEffectiveDateInput ─────────────────────────────────────────────────

  describe('onEffectiveDateInput', () => {
    it('should delegate to DateFieldValidationUtility.handleStartDateInput', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleStartDateInput');
      const event = { target: { value: '01-JAN-2099' } } as unknown as Event;
      (component as any).onEffectiveDateInput(event);
      expect(spy).toHaveBeenCalledWith('01-JAN-2099', component.contractForm.get('effDate'));
    });
  });

  // ── onTerminationDateInput ───────────────────────────────────────────────

  describe('onTerminationDateInput', () => {
    it('should delegate to DateFieldValidationUtility.handleEndDateInput', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const event = { target: { value: '31-DEC-2099' } } as unknown as Event;
      (component as any).onTerminationDateInput(event);
      expect(spy).toHaveBeenCalledWith('31-DEC-2099', component.contractForm.get('termDate'));
    });
  });

  // ── onStartTermChange ────────────────────────────────────────────────────

  describe('onStartTermChange', () => {
    it('should update endTerm validity', () => {
      const endCtrl = component.contractForm.get('endTerm')!;
      const spy = spyOn(endCtrl, 'updateValueAndValidity');
      (component as any).onStartTermChange();
      expect(spy).toHaveBeenCalled();
    });

    it('should mark startTerm as touched', () => {
      const startCtrl = component.contractForm.get('startTerm')!;
      const spy = spyOn(startCtrl, 'markAsTouched');
      (component as any).onStartTermChange();
      expect(spy).toHaveBeenCalled();
    });
  });

  // ── onEndTermChange ──────────────────────────────────────────────────────

  describe('onEndTermChange', () => {
    it('should mark endTerm as touched', () => {
      const endCtrl = component.contractForm.get('endTerm')!;
      const spy = spyOn(endCtrl, 'markAsTouched');
      (component as any).onEndTermChange();
      expect(spy).toHaveBeenCalled();
    });
  });

  // ── onStartTermInput ─────────────────────────────────────────────────────

  describe('onStartTermInput', () => {
    it('should delegate to DateFieldValidationUtility.handleEndDateInput', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const event = { target: { value: '15-JAN-2099' } } as unknown as Event;
      (component as any).onStartTermInput(event);
      expect(spy).toHaveBeenCalledWith('15-JAN-2099', component.contractForm.get('startTerm'));
    });
  });

  // ── onEndTermInput ───────────────────────────────────────────────────────

  describe('onEndTermInput', () => {
    it('should delegate to DateFieldValidationUtility.handleEndDateInput', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const event = { target: { value: '30-JUN-2099' } } as unknown as Event;
      (component as any).onEndTermInput(event);
      expect(spy).toHaveBeenCalledWith('30-JUN-2099', component.contractForm.get('endTerm'));
    });
  });

  // ── getStartTermError ────────────────────────────────────────────────────

  describe('getStartTermError', () => {
    it('should return empty string when control is not touched or dirty', () => {
      const result = (component as any).getStartTermError();
      expect(result).toBe('');
    });

    it('should return empty string when control has no errors', () => {
      const ctrl = component.contractForm.get('startTerm')!;
      ctrl.markAsTouched();
      ctrl.setErrors(null);
      const result = (component as any).getStartTermError();
      expect(result).toBe('');
    });

    it('should return "Start Term is invalid" for matDatepickerParse error', () => {
      const ctrl = component.contractForm.get('startTerm')!;
      ctrl.markAsTouched();
      ctrl.setErrors({ matDatepickerParse: true });
      const result = (component as any).getStartTermError();
      expect(result).toBe('Start Term is invalid');
    });

    it('should return "Start Term is invalid" for invalidDate error', () => {
      const ctrl = component.contractForm.get('startTerm')!;
      ctrl.markAsTouched();
      ctrl.setErrors({ invalidDate: true });
      const result = (component as any).getStartTermError();
      expect(result).toBe('Start Term is invalid');
    });

    it('should return "Start Term is invalid" for invalidDateFormat error', () => {
      const ctrl = component.contractForm.get('startTerm')!;
      ctrl.markAsTouched();
      ctrl.setErrors({ invalidDateFormat: true });
      const result = (component as any).getStartTermError();
      expect(result).toBe('Start Term is invalid');
    });

    it('should return error when control is dirty but not touched', () => {
      const ctrl = component.contractForm.get('startTerm')!;
      ctrl.markAsDirty();
      ctrl.setErrors({ invalidDate: true });
      const result = (component as any).getStartTermError();
      expect(result).toBe('Start Term is invalid');
    });
  });

  // ── getEndTermError ──────────────────────────────────────────────────────

  describe('getEndTermError', () => {
    it('should return empty string when control is not touched or dirty', () => {
      const result = (component as any).getEndTermError();
      expect(result).toBe('');
    });

    it('should return empty string when control has no errors', () => {
      const ctrl = component.contractForm.get('endTerm')!;
      ctrl.markAsTouched();
      ctrl.setErrors(null);
      const result = (component as any).getEndTermError();
      expect(result).toBe('');
    });

    it('should return "End Term is invalid" for matDatepickerParse error', () => {
      const ctrl = component.contractForm.get('endTerm')!;
      ctrl.markAsTouched();
      ctrl.setErrors({ matDatepickerParse: true });
      const result = (component as any).getEndTermError();
      expect(result).toBe('End Term is invalid');
    });

    it('should return "End Term is invalid" for invalidDate error', () => {
      const ctrl = component.contractForm.get('endTerm')!;
      ctrl.markAsTouched();
      ctrl.setErrors({ invalidDate: true });
      const result = (component as any).getEndTermError();
      expect(result).toBe('End Term is invalid');
    });

    it('should return "End Term is invalid" for invalidDateFormat error', () => {
      const ctrl = component.contractForm.get('endTerm')!;
      ctrl.markAsTouched();
      ctrl.setErrors({ invalidDateFormat: true });
      const result = (component as any).getEndTermError();
      expect(result).toBe('End Term is invalid');
    });

    it('should return matDatepickerMin error message', () => {
      const ctrl = component.contractForm.get('endTerm')!;
      ctrl.markAsTouched();
      ctrl.setErrors({ matDatepickerMin: true });
      const result = (component as any).getEndTermError();
      expect(result).toBe('End Term must be on or after Start Term');
    });

    it('should return error when control is dirty but not touched', () => {
      const ctrl = component.contractForm.get('endTerm')!;
      ctrl.markAsDirty();
      ctrl.setErrors({ invalidDate: true });
      const result = (component as any).getEndTermError();
      expect(result).toBe('End Term is invalid');
    });
  });

  // ── terminationDateFilter ────────────────────────────────────────────────

  describe('terminationDateFilter', () => {
    it('should return true for null dates', () => {
      expect((component as any).terminationDateFilter(null)).toBeTrue();
    });

    it('should return true when no effective date is set', () => {
      component.contractForm.get('effDate')?.setValue(null);
      const date = moment('2099-06-15');
      expect((component as any).terminationDateFilter(date)).toBeTrue();
    });

    it('should return false for a date before the effective date', () => {
      const effDate = moment('2099-06-15');
      component.contractForm.get('effDate')?.setValue(effDate);
      const before = moment('2099-06-10');
      expect((component as any).terminationDateFilter(before)).toBeFalse();
    });

    it('should return true for a date equal to the effective date', () => {
      const effDate = moment('2099-06-15');
      component.contractForm.get('effDate')?.setValue(effDate);
      const same = moment('2099-06-15');
      expect((component as any).terminationDateFilter(same)).toBeTrue();
    });

    it('should return true for a date after the effective date', () => {
      const effDate = moment('2099-06-15');
      component.contractForm.get('effDate')?.setValue(effDate);
      const after = moment('2099-06-20');
      expect((component as any).terminationDateFilter(after)).toBeTrue();
    });
  });

  // ── endTermDateFilter ────────────────────────────────────────────────────

  describe('endTermDateFilter', () => {
    it('should return true for null dates', () => {
      expect((component as any).endTermDateFilter(null)).toBeTrue();
    });

    it('should return true when no start term is set', () => {
      component.contractForm.get('startTerm')?.setValue(null);
      const date = moment('2099-06-15');
      expect((component as any).endTermDateFilter(date)).toBeTrue();
    });

    it('should return false for a date before the start term', () => {
      const startTerm = moment('2099-06-15');
      component.contractForm.get('startTerm')?.setValue(startTerm);
      const before = moment('2099-06-10');
      expect((component as any).endTermDateFilter(before)).toBeFalse();
    });

    it('should return true for a date equal to the start term', () => {
      const startTerm = moment('2099-06-15');
      component.contractForm.get('startTerm')?.setValue(startTerm);
      const same = moment('2099-06-15');
      expect((component as any).endTermDateFilter(same)).toBeTrue();
    });

    it('should return true for a date after the start term', () => {
      const startTerm = moment('2099-06-15');
      component.contractForm.get('startTerm')?.setValue(startTerm);
      const after = moment('2099-06-20');
      expect((component as any).endTermDateFilter(after)).toBeTrue();
    });
  });

  // ── onlyNumbers ───────────────────────────────────────────────────────────

  describe('onlyNumbers', () => {
    it('should allow digit keys (charCode 48-57)', () => {
      const event = { which: 50, keyCode: 50, ctrlKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent non-digit keys', () => {
      const event = { which: 65, keyCode: 65, ctrlKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeFalse();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow backspace (charCode 8)', () => {
      const event = { which: 8, keyCode: 8, ctrlKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
    });

    it('should allow tab (charCode 9)', () => {
      const event = { which: 9, keyCode: 9, ctrlKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
    });

    it('should allow delete (charCode 46)', () => {
      const event = { which: 46, keyCode: 46, ctrlKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
    });

    it('should allow escape (charCode 27)', () => {
      const event = { which: 27, keyCode: 27, ctrlKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
    });

    it('should allow enter (charCode 13)', () => {
      const event = { which: 13, keyCode: 13, ctrlKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
    });

    it('should allow decimal point numpad (charCode 110)', () => {
      const event = { which: 110, keyCode: 110, ctrlKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
    });

    it('should allow decimal point (charCode 190)', () => {
      const event = { which: 190, keyCode: 190, ctrlKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
    });

    it('should allow Ctrl+A (charCode 65)', () => {
      const event = { which: 65, keyCode: 65, ctrlKey: true, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
    });

    it('should allow Ctrl+C (charCode 67)', () => {
      const event = { which: 67, keyCode: 67, ctrlKey: true, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
    });

    it('should allow Ctrl+V (charCode 86)', () => {
      const event = { which: 86, keyCode: 86, ctrlKey: true, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
    });

    it('should allow Ctrl+X (charCode 88)', () => {
      const event = { which: 88, keyCode: 88, ctrlKey: true, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
    });

    it('should allow home key (charCode 36)', () => {
      const event = { which: 36, keyCode: 36, ctrlKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
    });

    it('should allow end key (charCode 35)', () => {
      const event = { which: 35, keyCode: 35, ctrlKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
    });

    it('should allow arrow left (charCode 37)', () => {
      const event = { which: 37, keyCode: 37, ctrlKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
    });

    it('should allow arrow right (charCode 39)', () => {
      const event = { which: 39, keyCode: 39, ctrlKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
    });

    it('should use keyCode when which is 0', () => {
      const event = { which: 0, keyCode: 50, ctrlKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      expect((component as any).onlyNumbers(event)).toBeTrue();
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
      const spy = spyOn(component.contractForm, 'markAllAsTouched');
      (component as any).onSubmit();
      expect(spy).toHaveBeenCalled();
    });

    it('should not call API when form is invalid', fakeAsync(() => {
      (component as any).onSubmit();
      tick(5000);
      expect(apiServiceSpy.createContract).not.toHaveBeenCalled();
      expect(apiServiceSpy.updateContract).not.toHaveBeenCalled();
    }));

    it('should show error snackbar when form is invalid', fakeAsync(() => {
      (component as any).onSubmit();
      tick(5000);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please correct the errors in the form');
    }));

    it('should emit savedData and skip API call when savedData exists and form is not dirty', () => {
      TestBed.resetTestingModule();
      buildComponent({ savedData: mockSavedContract });

      const emitSpy = spyOn(component.saveSuccess, 'emit');
      (component as any).onSubmit();
      expect(emitSpy).toHaveBeenCalledWith(mockSavedContract);
      expect(apiServiceSpy.createContract).not.toHaveBeenCalled();
      expect(apiServiceSpy.updateContract).not.toHaveBeenCalled();
    });

    describe('create (no savedData)', () => {
      const savedContracts = [{ contractId: 'CTR-NEW', rotationFlag: 'Y', creditLimit: 5000 }];

      beforeEach(() => {
        fillValidContract();
        apiServiceSpy.createContract.and.returnValue(of({ contractId: 'CTR-NEW' }));
        apiServiceSpy.getContracts.and.returnValue(of(savedContracts));
      });

      it('should call createContract with customerId and payload', fakeAsync(() => {
        (component as any).onSubmit();
        tick(5000);
        expect(apiServiceSpy.createContract).toHaveBeenCalled();
        const [custId, payload] = apiServiceSpy.createContract.calls.mostRecent().args;
        expect(custId).toBe('');
        expect(payload.rotationFlag).toBe('Y');
        expect(payload.creditLimit).toBe(5000);
      }));

      it('should emit savingChange true then false', fakeAsync(() => {
        const spy = spyOn(component.savingChange, 'emit');
        (component as any).onSubmit();
        tick(5000);
        expect(spy).toHaveBeenCalledWith(true);
        expect(spy).toHaveBeenCalledWith(false);
      }));

      it('should show success snackbar on success', fakeAsync(() => {
        (component as any).onSubmit();
        tick(5000);
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Contract details saved successfully');
      }));

      it('should emit saveSuccess with contracts from API', fakeAsync(() => {
        const spy = spyOn(component.saveSuccess, 'emit');
        (component as any).onSubmit();
        tick(5000);
        expect(spy).toHaveBeenCalledWith(savedContracts[0]);
      }));

      it('should emit payload when getContracts returns empty array', fakeAsync(() => {
        apiServiceSpy.getContracts.and.returnValue(of([]));
        const spy = spyOn(component.saveSuccess, 'emit');
        (component as any).onSubmit();
        tick(5000);
        const emitted = spy.calls.mostRecent().args[0];
        expect(emitted.rotationFlag).toBe('Y');
        expect(emitted.creditLimit).toBe(5000);
      }));

      it('should emit payload when getContracts returns null', fakeAsync(() => {
        apiServiceSpy.getContracts.and.returnValue(of(null as any));
        const spy = spyOn(component.saveSuccess, 'emit');
        (component as any).onSubmit();
        tick(5000);
        const emitted = spy.calls.mostRecent().args[0];
        expect(emitted.rotationFlag).toBe('Y');
      }));

      it('should set saving to false on success', fakeAsync(() => {
        (component as any).onSubmit();
        tick(5000);
        expect((component as any).saving()).toBeFalse();
      }));

      it('should format rotation as Y or N in payload', fakeAsync(() => {
        component.contractForm.get('rotation')?.setValue('N');
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createContract.calls.mostRecent().args[1];
        expect(payload.rotationFlag).toBe('N');
      }));

      it('should set rotationFlag to N for non-Y values', fakeAsync(() => {
        component.contractForm.get('rotation')?.setValue('X');
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createContract.calls.mostRecent().args[1];
        expect(payload.rotationFlag).toBe('N');
      }));

      it('should set hospitalLevel to null when empty', fakeAsync(() => {
        component.contractForm.get('hospitalLevel')?.setValue('');
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createContract.calls.mostRecent().args[1];
        expect(payload.hospitalLevel).toBeNull();
      }));

      it('should set poNumber to null when empty', fakeAsync(() => {
        component.contractForm.get('poNumber')?.setValue('');
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createContract.calls.mostRecent().args[1];
        expect(payload.poNumber).toBeNull();
      }));

      it('should format effDate as YYYY-MM-DD in payload', fakeAsync(() => {
        // Must also update termDate to avoid dateRangeValidator failure
        component.contractForm.get('effDate')?.setValue(moment('2099-06-15'));
        component.contractForm.get('termDate')?.setValue(moment('2099-12-31'));
        fixture.detectChanges();
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createContract.calls.mostRecent().args[1];
        expect(payload.effDate).toBe('2099-06-15');
      }));

      it('should format startTerm as YYYY-MM-DD in payload', fakeAsync(() => {
        // Must also update endTerm to avoid matDatepickerMin error
        component.contractForm.get('startTerm')?.setValue(moment('2099-01-15'));
        component.contractForm.get('endTerm')?.setValue(moment('2099-07-15'));
        fixture.detectChanges();
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createContract.calls.mostRecent().args[1];
        expect(payload.startTerm).toBe('2099-01-15');
      }));

      it('should set startTerm to null when not provided', fakeAsync(() => {
        component.contractForm.get('startTerm')?.setValue(null);
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createContract.calls.mostRecent().args[1];
        expect(payload.startTerm).toBeNull();
      }));

      it('should format endTerm as YYYY-MM-DD in payload', fakeAsync(() => {
        component.contractForm.get('endTerm')?.setValue(moment('2099-06-30'));
        fixture.detectChanges();
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createContract.calls.mostRecent().args[1];
        expect(payload.endTerm).toBe('2099-06-30');
      }));

      it('should set endTerm to null when not provided', fakeAsync(() => {
        component.contractForm.get('endTerm')?.setValue(null);
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createContract.calls.mostRecent().args[1];
        expect(payload.endTerm).toBeNull();
      }));

      it('should set termDate to null when not provided', fakeAsync(() => {
        component.contractForm.get('termDate')?.setValue(null);
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createContract.calls.mostRecent().args[1];
        expect(payload.termDate).toBeNull();
      }));

      it('should format termDate as YYYY-MM-DD in payload', fakeAsync(() => {
        component.contractForm.get('termDate')?.setValue(moment('2099-12-31'));
        fixture.detectChanges();
        (component as any).onSubmit();
        tick(5000);
        const payload = apiServiceSpy.createContract.calls.mostRecent().args[1];
        expect(payload.termDate).toBe('2099-12-31');
      }));
    });

    describe('update (savedData with contractId)', () => {
      beforeEach(() => {
        TestBed.resetTestingModule();
        buildComponent({ savedData: mockSavedContract, customerId: 'CUST-001' });
        // Make form dirty by changing a non-date field to avoid MatDatepicker [min] conflicts
        component.contractForm.get('hospitalLevel')?.setValue('B2');
        component.contractForm.get('hospitalLevel')?.markAsDirty();
        component.contractForm.markAsDirty();

        apiServiceSpy.updateContract.and.returnValue(of({ contractId: 'CTR-001' }));
        apiServiceSpy.getContracts.and.returnValue(of([mockSavedContract]));
      });

      it('should call updateContract with customerId and contractId', fakeAsync(() => {
        (component as any).onSubmit();
        tick(5000);
        expect(apiServiceSpy.updateContract).toHaveBeenCalled();
        const [custId, contractId] = apiServiceSpy.updateContract.calls.mostRecent().args;
        expect(custId).toBe('CUST-001');
        expect(contractId).toBe('CTR-001');
      }));

      it('should show update success snackbar', fakeAsync(() => {
        (component as any).onSubmit();
        tick(5000);
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Contract details updated successfully');
      }));

      it('should emit saveSuccess with contracts from API on update', fakeAsync(() => {
        const spy = spyOn(component.saveSuccess, 'emit');
        (component as any).onSubmit();
        tick(5000);
        expect(spy).toHaveBeenCalledWith(mockSavedContract);
      }));

      it('should emit payload when getContracts returns empty on update', fakeAsync(() => {
        apiServiceSpy.getContracts.and.returnValue(of([]));
        const spy = spyOn(component.saveSuccess, 'emit');
        (component as any).onSubmit();
        tick(5000);
        const emitted = spy.calls.mostRecent().args[0];
        expect(emitted.rotationFlag).toBe('Y');
      }));

      it('should set saving to false on update success', fakeAsync(() => {
        (component as any).onSubmit();
        tick(5000);
        expect((component as any).saving()).toBeFalse();
      }));

      it('should emit savingChange false on update success', fakeAsync(() => {
        const spy = spyOn(component.savingChange, 'emit');
        (component as any).onSubmit();
        tick(5000);
        expect(spy).toHaveBeenCalledWith(false);
      }));

      it('should not call createContract during update', fakeAsync(() => {
        (component as any).onSubmit();
        tick(5000);
        expect(apiServiceSpy.createContract).not.toHaveBeenCalled();
      }));
    });

    describe('API error handling - create', () => {
      beforeEach(() => {
        fillValidContract();
      });

      it('should show default error message when error has no details', fakeAsync(() => {
        apiServiceSpy.createContract.and.returnValue(throwError(() => ({ error: {} })));
        (component as any).onSubmit();
        tick(5000);
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to save contract details');
      }));

      it('should show nested errorResponse.error message', fakeAsync(() => {
        apiServiceSpy.createContract.and.returnValue(
          throwError(() => ({
            error: { errorResponse: { error: 'Duplicate contract' } }
          }))
        );
        (component as any).onSubmit();
        tick(5000);
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Duplicate contract');
      }));

      it('should show error.message when errorResponse is missing', fakeAsync(() => {
        apiServiceSpy.createContract.and.returnValue(
          throwError(() => ({
            error: { message: 'Server validation failed' }
          }))
        );
        (component as any).onSubmit();
        tick(5000);
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Server validation failed');
      }));

      it('should set saving to false on error', fakeAsync(() => {
        apiServiceSpy.createContract.and.returnValue(throwError(() => ({ error: {} })));
        (component as any).onSubmit();
        tick(5000);
        expect((component as any).saving()).toBeFalse();
      }));

      it('should emit savingChange false on error', fakeAsync(() => {
        apiServiceSpy.createContract.and.returnValue(throwError(() => ({ error: {} })));
        const spy = spyOn(component.savingChange, 'emit');
        (component as any).onSubmit();
        tick(5000);
        expect(spy).toHaveBeenCalledWith(false);
      }));

      it('should log error to console', fakeAsync(() => {
        apiServiceSpy.createContract.and.returnValue(throwError(() => ({ error: {} })));
        (component as any).onSubmit();
        tick(5000);
        expect(console.error).toHaveBeenCalled();
      }));
    });

    describe('API error handling - update', () => {
      beforeEach(() => {
        TestBed.resetTestingModule();
        buildComponent({ savedData: mockSavedContract, customerId: 'CUST-001' });
        // Make form dirty by changing a non-date field
        component.contractForm.get('hospitalLevel')?.setValue('C3');
        component.contractForm.get('hospitalLevel')?.markAsDirty();
        component.contractForm.markAsDirty();
      });

      it('should show default error message when update error has no details', fakeAsync(() => {
        apiServiceSpy.updateContract.and.returnValue(throwError(() => ({ error: {} })));
        (component as any).onSubmit();
        tick(5000);
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to update contract details');
      }));

      it('should show nested errorResponse.error message on update error', fakeAsync(() => {
        apiServiceSpy.updateContract.and.returnValue(
          throwError(() => ({
            error: { errorResponse: { error: 'Contract conflict' } }
          }))
        );
        (component as any).onSubmit();
        tick(5000);
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Contract conflict');
      }));

      it('should show error.message on update error', fakeAsync(() => {
        apiServiceSpy.updateContract.and.returnValue(
          throwError(() => ({
            error: { message: 'Update validation failed' }
          }))
        );
        (component as any).onSubmit();
        tick(5000);
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Update validation failed');
      }));

      it('should set saving to false on update error', fakeAsync(() => {
        apiServiceSpy.updateContract.and.returnValue(throwError(() => ({ error: {} })));
        (component as any).onSubmit();
        tick(5000);
        expect((component as any).saving()).toBeFalse();
      }));

      it('should emit savingChange false on update error', fakeAsync(() => {
        apiServiceSpy.updateContract.and.returnValue(throwError(() => ({ error: {} })));
        const spy = spyOn(component.savingChange, 'emit');
        (component as any).onSubmit();
        tick(5000);
        expect(spy).toHaveBeenCalledWith(false);
      }));

      it('should log error to console on update error', fakeAsync(() => {
        apiServiceSpy.updateContract.and.returnValue(throwError(() => ({ error: {} })));
        (component as any).onSubmit();
        tick(5000);
        expect(console.error).toHaveBeenCalled();
      }));
    });
  });

  // ── ngOnDestroy ───────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should call next on destroy$', () => {
      const destroy$ = (component as any).destroy$ as Subject<void>;
      const spy = spyOn(destroy$, 'next');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });

    it('should complete the destroy$ subject', () => {
      const destroy$ = (component as any).destroy$ as Subject<void>;
      const spy = spyOn(destroy$, 'complete');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });
  });

  // ── With savedData ────────────────────────────────────────────────────────

  describe('with savedData', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      buildComponent({ savedData: mockSavedContract });
    });

    it('should populate form with saved contract data', () => {
      expect(component.contractForm.get('rotation')?.value).toBe('Y');
      expect(component.contractForm.get('hospitalLevel')?.value).toBe('A1');
      expect(component.contractForm.get('poNumber')?.value).toBe('PO-12345');
      expect(component.contractForm.get('creditLimit')?.value).toBe(5000);
    });

    it('should convert startTerm string to moment', () => {
      const value = component.contractForm.get('startTerm')?.value;
      expect(moment.isMoment(value)).toBeTrue();
      expect(value.format('YYYY-MM-DD')).toBe('2099-01-01');
    });

    it('should convert endTerm string to moment', () => {
      const value = component.contractForm.get('endTerm')?.value;
      expect(moment.isMoment(value)).toBeTrue();
      expect(value.format('YYYY-MM-DD')).toBe('2099-06-30');
    });

    it('should convert effDate string to moment', () => {
      const value = component.contractForm.get('effDate')?.value;
      expect(moment.isMoment(value)).toBeTrue();
      expect(value.format('YYYY-MM-DD')).toBe('2099-03-01');
    });

    it('should convert termDate string to moment', () => {
      const value = component.contractForm.get('termDate')?.value;
      expect(moment.isMoment(value)).toBeTrue();
      expect(value.format('YYYY-MM-DD')).toBe('2099-12-31');
    });

    it('should use rotationFlag over rotation when populating', () => {
      TestBed.resetTestingModule();
      const dataWithFlag = { ...mockSavedContract, rotationFlag: 'N', rotation: 'Y' };
      buildComponent({ savedData: dataWithFlag });
      expect(component.contractForm.get('rotation')?.value).toBe('N');
    });

    it('should fall back to rotation when rotationFlag is absent', () => {
      TestBed.resetTestingModule();
      const dataWithoutFlag = { ...mockSavedContract, rotationFlag: undefined };
      buildComponent({ savedData: dataWithoutFlag });
      expect(component.contractForm.get('rotation')?.value).toBe('Y');
    });
  });

  describe('with savedData without dates', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      const dataNoDate = {
        ...mockSavedContract,
        startTerm: null,
        endTerm: null,
        effDate: null,
        termDate: null
      };
      buildComponent({ savedData: dataNoDate });
    });

    it('should not set startTerm when saved startTerm is null', () => {
      const value = component.contractForm.get('startTerm')?.value;
      expect(value).toBeNull();
    });

    it('should not set endTerm when saved endTerm is null', () => {
      const value = component.contractForm.get('endTerm')?.value;
      expect(value).toBeNull();
    });

    it('should not set effDate when saved effDate is null', () => {
      const value = component.contractForm.get('effDate')?.value;
      expect(value).toBeNull();
    });

    it('should not set termDate when saved termDate is null', () => {
      const value = component.contractForm.get('termDate')?.value;
      expect(value).toBeNull();
    });
  });

  // ── Form validation rules ─────────────────────────────────────────────────

  describe('form validation', () => {
    it('should require creditLimit', () => {
      component.contractForm.get('creditLimit')?.setValue(null);
      expect(component.contractForm.get('creditLimit')?.hasError('required')).toBeTrue();
    });

    it('should require effDate', () => {
      component.contractForm.get('effDate')?.setValue(null);
      expect(component.contractForm.get('effDate')?.hasError('required')).toBeTrue();
    });

    it('should enforce min 0 on creditLimit', () => {
      component.contractForm.get('creditLimit')?.setValue(-1);
      expect(component.contractForm.get('creditLimit')?.hasError('min')).toBeTrue();
    });

    it('should enforce max 9999999.99 on creditLimit', () => {
      component.contractForm.get('creditLimit')?.setValue(10000000);
      expect(component.contractForm.get('creditLimit')?.hasError('max')).toBeTrue();
    });

    it('should accept creditLimit at 0', () => {
      component.contractForm.get('creditLimit')?.setValue(0);
      expect(component.contractForm.get('creditLimit')?.hasError('min')).toBeFalse();
    });

    it('should accept creditLimit at 9999999.99', () => {
      component.contractForm.get('creditLimit')?.setValue(9999999.99);
      expect(component.contractForm.get('creditLimit')?.hasError('max')).toBeFalse();
    });

    it('should enforce maxLength 2 on hospitalLevel', () => {
      component.contractForm.get('hospitalLevel')?.setValue('ABC');
      expect(component.contractForm.get('hospitalLevel')?.hasError('maxlength')).toBeTrue();
    });

    it('should allow hospitalLevel with 2 characters', () => {
      component.contractForm.get('hospitalLevel')?.setValue('AB');
      expect(component.contractForm.get('hospitalLevel')?.hasError('maxlength')).toBeFalse();
    });

    it('should enforce maxLength 12 on poNumber', () => {
      component.contractForm.get('poNumber')?.setValue('1234567890123');
      expect(component.contractForm.get('poNumber')?.hasError('maxlength')).toBeTrue();
    });

    it('should allow poNumber with 12 characters', () => {
      component.contractForm.get('poNumber')?.setValue('123456789012');
      expect(component.contractForm.get('poNumber')?.hasError('maxlength')).toBeFalse();
    });

    it('should not require startTerm', () => {
      component.contractForm.get('startTerm')?.setValue(null);
      expect(component.contractForm.get('startTerm')?.hasError('required')).toBeFalsy();
    });

    it('should not require endTerm', () => {
      component.contractForm.get('endTerm')?.setValue(null);
      expect(component.contractForm.get('endTerm')?.hasError('required')).toBeFalsy();
    });

    it('should not require termDate', () => {
      component.contractForm.get('termDate')?.setValue(null);
      expect(component.contractForm.get('termDate')?.hasError('required')).toBeFalsy();
    });

    it('should not require hospitalLevel', () => {
      component.contractForm.get('hospitalLevel')?.setValue('');
      expect(component.contractForm.get('hospitalLevel')?.hasError('required')).toBeFalsy();
    });

    it('should not require poNumber', () => {
      component.contractForm.get('poNumber')?.setValue('');
      expect(component.contractForm.get('poNumber')?.hasError('required')).toBeFalsy();
    });

    it('should have dateRangeValidator at form level', () => {
      const effDate = moment('2099-12-31');
      const termDate = moment('2099-01-01');
      component.contractForm.get('effDate')?.setValue(effDate);
      component.contractForm.get('termDate')?.setValue(termDate);
      component.contractForm.updateValueAndValidity();
      expect(component.contractForm.hasError('dateRangeInvalid')).toBeTrue();
    });

    it('should not have dateRangeInvalid when termDate is after effDate', () => {
      const effDate = moment('2099-01-01');
      const termDate = moment('2099-12-31');
      component.contractForm.get('effDate')?.setValue(effDate);
      component.contractForm.get('termDate')?.setValue(termDate);
      component.contractForm.updateValueAndValidity();
      expect(component.contractForm.hasError('dateRangeInvalid')).toBeFalse();
    });
  });
});
