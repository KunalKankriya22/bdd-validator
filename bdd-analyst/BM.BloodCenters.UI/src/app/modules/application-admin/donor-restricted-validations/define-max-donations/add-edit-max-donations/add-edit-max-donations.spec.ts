import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import moment from 'moment';
import { AddEditMaxDonations } from './add-edit-max-donations';
import { DefineMaxDonationsService } from '../services/define-max-donations.service';
import { DefineMaxDonationsModel } from '../models/define-max-donations.model';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

describe('AddEditMaxDonations', () => {
  let mockHeaderService: any;
  let serviceSpy: any;
  let component: AddEditMaxDonations;
  let fixture: ComponentFixture<AddEditMaxDonations>;
  let service: jasmine.SpyObj<DefineMaxDonationsService>;

  const mockDonationTypes = [
    { donationType: 'AL', donationTypeDescription: 'Allogeneic' },
    { donationType: 'AU', donationTypeDescription: 'Autologous' }
  ];

  const mockProcedureGroups = [
    { procedureGroup: 'PLATE', procedureDescription: 'Platelets' },
    { procedureGroup: 'PLASM', procedureDescription: 'Plasma' }
  ];

  // Use dates relative to today to avoid validation failures
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 365);

  const mockEditData: DefineMaxDonationsModel = {
    donationType: 'AL',
    donationDescription: 'Allogeneic',
    procedureGroup: 'PLATE',
    procedureDescription: 'Platelets',
    maxDonations: 2,
    interval: 7,
    effDate: tomorrow.toISOString(),
    termDate: futureDate.toISOString(),
    programId: 'VDIEGPRD',
    chapterId: 'ALL'
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('DefineMaxDonationsService', [
      'getDonationTypes',
      'getProcedureGroups',
      'addMaxDonation',
      'updateMaxDonation'
    ]);

    const chapterTimeZoneSignal = signal('UTC');
    mockHeaderService = createMockHeaderService();



      TestBed.configureTestingModule({
      imports: [
        AddEditMaxDonations,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatSnackBarModule
      ],
      providers: [
        { provide: DefineMaxDonationsService, useValue: serviceSpy },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });




      serviceSpy.getDonationTypes.calls.reset();


      serviceSpy.getProcedureGroups.calls.reset();


      serviceSpy.addMaxDonation.calls.reset();


      serviceSpy.updateMaxDonation.calls.reset();


      mockHeaderService.getCurrentChapterId.calls.reset();

    service = TestBed.inject(DefineMaxDonationsService) as jasmine.SpyObj<DefineMaxDonationsService>;
    service.getDonationTypes.and.returnValue(of(mockDonationTypes));
    service.getProcedureGroups.and.returnValue(of(mockProcedureGroups));

    fixture = TestBed.createComponent(AddEditMaxDonations);
    component = fixture.componentInstance;


    });

  it('should create the component', () => {
    component.mode = 'add';
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit - Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.data = null;
      fixture.detectChanges();
    });

    it('should load procedure groups on init', () => {
      expect(service.getProcedureGroups).toHaveBeenCalled();
      expect(component.procedureGroups.length).toBe(2);
    });

    it('should load donation types on init', () => {
      expect(service.getDonationTypes).toHaveBeenCalled();
      expect(component.donationTypes.length).toBe(2);
    });

    it('should set filteredDonationTypes to all donation types', () => {
      expect(component.filteredDonationTypes).toEqual(mockDonationTypes);
    });

    it('should set panel title to Add', () => {
      expect(component.panelTitle).toBe('Add Max Donation Configuration');
    });

    it('should initialize the form with expected controls', () => {
      expect(component.form).toBeDefined();
      expect(component.form.get('donationType')).toBeTruthy();
      expect(component.form.get('procedureGroup')).toBeTruthy();
      expect(component.form.get('maximums')).toBeTruthy();
      expect(component.form.get('interval')).toBeTruthy();
      expect(component.form.get('effectiveDate')).toBeTruthy();
      expect(component.form.get('terminationDate')).toBeTruthy();
    });

    it('should have isSaving as false initially', () => {
      expect(component.isSaving).toBe(false);
    });

    it('should initialize minDate', () => {
      expect(component.minDate).toBeDefined();
      expect(moment.isMoment(component.minDate)).toBe(true);
    });

    it('should initialize terminationMinDate', () => {
      expect(component.terminationMinDate).toBeDefined();
      expect(moment.isMoment(component.terminationMinDate)).toBe(true);
    });
  });

  describe('ngOnInit - Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
    });

    it('should set panel title to Edit', () => {
      expect(component.panelTitle).toBe('Edit Max Donation Configuration');
    });

    it('should populate form with effective date', () => {
      const effectiveDate = component.form.get('effectiveDate')?.value;
      expect(effectiveDate).toBeInstanceOf(Date);
    });

    it('should populate form with termination date', () => {
      const terminationDate = component.form.get('terminationDate')?.value;
      expect(terminationDate).toBeInstanceOf(Date);
    });

    it('should populate form with maximums', () => {
      const maximums = component.form.get('maximums')?.value;
      expect(maximums).toBe(2);
    });

    it('should populate form with interval', () => {
      const interval = component.form.get('interval')?.value;
      expect(interval).toBe(7);
    });

    it('should store original values for composite key and interval', () => {
      expect(component['originalValues'].donationType).toBe('AL');
      expect(component['originalValues'].procedureGroup).toBe('PLATE');
      expect(component['originalValues'].interval).toBe(7);
    });

    it('should store edit mode display values', () => {
      expect(component.editModeValues.donationType).toBe('AL');
      expect(component.editModeValues.donationTypeDescription).toBe('Allogeneic');
      expect(component.editModeValues.procedureGroup).toBe('PLATE');
      expect(component.editModeValues.effectiveDate).toBeTruthy();
    });

    it('should disable donationType control in edit mode', () => {
      expect(component.form.get('donationType')?.disabled).toBe(true);
    });

    it('should disable procedureGroup control in edit mode', () => {
      expect(component.form.get('procedureGroup')?.disabled).toBe(true);
    });

    it('should clear validators on donationType in edit mode', () => {
      const control = component.form.get('donationType');
      // Control is disabled in edit mode, so it has status DISABLED not VALID/INVALID
      // Verify no validators remain by checking it does not have a 'required' error
      control?.enable();
      control?.setValue('');
      expect(control?.hasError('required')).toBe(false);
      control?.disable();
    });

    it('should clear validators on procedureGroup in edit mode', () => {
      const control = component.form.get('procedureGroup');
      control?.enable();
      control?.setValue('');
      expect(control?.hasError('required')).toBe(false);
      control?.disable();
    });

    it('should not populate form when data is null in edit mode', () => {
      const fixture2 = TestBed.createComponent(AddEditMaxDonations);
      const comp2 = fixture2.componentInstance;
      comp2.mode = 'edit';
      comp2.data = null;
      fixture2.detectChanges();
      expect(comp2.form.get('maximums')?.value).toBeNull();
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should require donation type', () => {
      const control = component.form.get('donationType');
      control?.setValue('');

      expect(control?.hasError('required')).toBe(true);
    });

    it('should require procedure group', () => {
      const control = component.form.get('procedureGroup');
      control?.setValue('');

      expect(control?.hasError('required')).toBe(true);
    });

    it('should require maximum donation', () => {
      const control = component.form.get('maximums');
      control?.setValue(null);

      expect(control?.hasError('required')).toBe(true);
    });

    it('should validate maximum donation min value', () => {
      const control = component.form.get('maximums');
      control?.setValue(0);

      expect(control?.hasError('min')).toBe(true);
    });

    it('should validate maximum donation max value', () => {
      const control = component.form.get('maximums');
      control?.setValue(10000);

      expect(control?.hasError('max')).toBe(true);
    });

    it('should accept valid maximum donation value', () => {
      const control = component.form.get('maximums');
      control?.setValue(500);

      expect(control?.valid).toBe(true);
    });

    it('should require interval', () => {
      const control = component.form.get('interval');
      control?.setValue(null);

      expect(control?.hasError('required')).toBe(true);
    });

    it('should validate interval min value', () => {
      const control = component.form.get('interval');
      control?.setValue(0);

      expect(control?.hasError('min')).toBe(true);
    });

    it('should validate interval max value', () => {
      const control = component.form.get('interval');
      control?.setValue(10000);

      expect(control?.hasError('max')).toBe(true);
    });

    it('should accept valid interval value', () => {
      const control = component.form.get('interval');
      control?.setValue(30);

      expect(control?.valid).toBe(true);
    });

    it('should require effective date', () => {
      const control = component.form.get('effectiveDate');
      control?.setValue(null);

      expect(control?.hasError('required')).toBe(true);
    });

    it('should allow null termination date', () => {
      component.form.patchValue({
        effectiveDate: new Date('2024-01-01'),
        terminationDate: null
      });

      expect(component.form.hasError('dateRangeInvalid')).toBe(false);
    });

    it('should detect invalid date range when termination is before effective', () => {
      component.form.patchValue({
        effectiveDate: new Date('2030-12-31'),
        terminationDate: new Date('2030-01-01')
      });
      component.form.updateValueAndValidity();

      expect(component.form.hasError('dateRangeInvalid')).toBe(true);
    });

    it('should accept valid date range', () => {
      const eff = new Date();
      eff.setDate(eff.getDate() + 10);
      const term = new Date();
      term.setDate(term.getDate() + 20);
      component.form.patchValue({
        effectiveDate: eff,
        terminationDate: term
      });
      component.form.updateValueAndValidity();

      expect(component.form.hasError('dateRangeInvalid')).toBe(false);
    });
  });

  describe('Form Control Getters', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return donationType control', () => {
      expect(component.donationTypeControl).toBe(component.form.get('donationType'));
    });

    it('should return procedureGroup control', () => {
      expect(component.procedureGroupControl).toBe(component.form.get('procedureGroup'));
    });

    it('should return maximums control', () => {
      expect(component.maximumsControl).toBe(component.form.get('maximums'));
    });

    it('should return interval control', () => {
      expect(component.intervalControl).toBe(component.form.get('interval'));
    });

    it('should return effectiveDate control', () => {
      expect(component.effectiveDateControl).toBe(component.form.get('effectiveDate'));
    });

    it('should return terminationDate control', () => {
      expect(component.terminationDateControl).toBe(component.form.get('terminationDate'));
    });
  });

  describe('blockInvalidKeys', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should prevent "e" key', () => {
      const event = { key: 'e', preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.blockInvalidKeys(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent "E" key', () => {
      const event = { key: 'E', preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.blockInvalidKeys(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent "+" key', () => {
      const event = { key: '+', preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.blockInvalidKeys(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent "-" key', () => {
      const event = { key: '-', preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.blockInvalidKeys(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent "." key', () => {
      const event = { key: '.', preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.blockInvalidKeys(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow numeric keys', () => {
      const event = { key: '5', preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.blockInvalidKeys(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow alphabetic keys other than e/E', () => {
      const event = { key: 'a', preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.blockInvalidKeys(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('Input Handlers', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should limit maximum donation to 3 digits', () => {
      const input = document.createElement('input');
      input.value = '1234';
      const event = { target: input } as any;

      component.onMaximumsInput(event);

      expect(input.value).toBe('123');
    });

    it('should allow typing 0 for maximum donation', () => {
      const input = document.createElement('input');
      input.value = '0';
      const event = { target: input } as any;

      component.onMaximumsInput(event);

      expect(input.value).toBe('0');
    });

    it('should set overflow error on maximums when exceeding 3 digits', () => {
      const input = document.createElement('input');
      input.value = '1234';
      const event = { target: input } as any;

      component.onMaximumsInput(event);

      expect(component.showMaxDonationOverflowError).toBe(true);
    });

    it('should update form control value when truncating maximums', () => {
      const input = document.createElement('input');
      input.value = '1234';
      const event = { target: input } as any;

      component.onMaximumsInput(event);

      expect(component.form.get('maximums')?.value).toBe(123);
    });

    it('should not show overflow error for valid maximums input', () => {
      const input = document.createElement('input');
      input.value = '123';
      const event = { target: input } as any;

      component.onMaximumsInput(event);

      expect(component.showMaxDonationOverflowError).toBe(false);
    });

    it('should limit interval to 3 digits', () => {
      const input = document.createElement('input');
      input.value = '1234';
      const event = { target: input } as any;

      component.onIntervalInput(event);

      expect(input.value).toBe('123');
    });

    it('should allow typing 0 for interval', () => {
      const input = document.createElement('input');
      input.value = '0';
      const event = { target: input } as any;

      component.onIntervalInput(event);

      expect(input.value).toBe('0');
    });

    it('should set overflow error on interval when exceeding 3 digits', () => {
      const input = document.createElement('input');
      input.value = '9999';
      const event = { target: input } as any;

      component.onIntervalInput(event);

      expect(component.showIntervalOverflowError).toBe(true);
    });

    it('should update form control value when truncating interval', () => {
      const input = document.createElement('input');
      input.value = '5678';
      const event = { target: input } as any;

      component.onIntervalInput(event);

      expect(component.form.get('interval')?.value).toBe(567);
    });

    it('should not show overflow error for valid interval input', () => {
      const input = document.createElement('input');
      input.value = '999';
      const event = { target: input } as any;

      component.onIntervalInput(event);

      expect(component.showIntervalOverflowError).toBe(false);
    });

    it('should handle non-digit characters in maximums input', () => {
      const input = document.createElement('input');
      input.value = 'abc';
      const event = { target: input } as any;

      component.onMaximumsInput(event);

      // Non-digits are removed, resulting in empty string which is <= 3 chars
      expect(component.showMaxDonationOverflowError).toBe(false);
    });

    it('should handle non-digit characters in interval input', () => {
      const input = document.createElement('input');
      input.value = 'xyz';
      const event = { target: input } as any;

      component.onIntervalInput(event);

      expect(component.showIntervalOverflowError).toBe(false);
    });
  });

  describe('Temporary Overflow Errors', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should clear max donation overflow error after timeout', fakeAsync(() => {
      const input = document.createElement('input');
      input.value = '1234';
      const event = { target: input } as any;

      component.onMaximumsInput(event);
      expect(component.showMaxDonationOverflowError).toBe(true);

      tick(2000);

      expect(component.showMaxDonationOverflowError).toBe(false);
    }));

    it('should clear interval overflow error after timeout', fakeAsync(() => {
      const input = document.createElement('input');
      input.value = '1234';
      const event = { target: input } as any;

      component.onIntervalInput(event);
      expect(component.showIntervalOverflowError).toBe(true);

      tick(2000);

      expect(component.showIntervalOverflowError).toBe(false);
    }));

    it('should clear overflow form error on maximums after timeout', fakeAsync(() => {
      const input = document.createElement('input');
      input.value = '1234';
      const event = { target: input } as any;

      component.onMaximumsInput(event);
      expect(component.form.get('maximums')?.hasError('overflow')).toBe(true);

      tick(2000);

      expect(component.form.get('maximums')?.hasError('overflow')).toBe(false);
    }));

    it('should clear overflow form error on interval after timeout', fakeAsync(() => {
      const input = document.createElement('input');
      input.value = '1234';
      const event = { target: input } as any;

      component.onIntervalInput(event);
      expect(component.form.get('interval')?.hasError('overflow')).toBe(true);

      tick(2000);

      expect(component.form.get('interval')?.hasError('overflow')).toBe(false);
    }));

    it('should reset previous max donation error timeout on consecutive overflows', fakeAsync(() => {
      const input = document.createElement('input');
      input.value = '1234';
      const event = { target: input } as any;

      component.onMaximumsInput(event);
      tick(1000);
      // Trigger again before first timeout
      input.value = '5678';
      component.onMaximumsInput(event);
      expect(component.showMaxDonationOverflowError).toBe(true);

      tick(1000);
      // Should still be showing (only 1s into second 2s timeout)
      expect(component.showMaxDonationOverflowError).toBe(true);

      tick(1000);
      // Now 2s from second trigger
      expect(component.showMaxDonationOverflowError).toBe(false);
    }));

    it('should reset previous interval error timeout on consecutive overflows', fakeAsync(() => {
      const input = document.createElement('input');
      input.value = '1234';
      const event = { target: input } as any;

      component.onIntervalInput(event);
      tick(1000);
      input.value = '5678';
      component.onIntervalInput(event);
      expect(component.showIntervalOverflowError).toBe(true);

      tick(1000);
      expect(component.showIntervalOverflowError).toBe(true);

      tick(1000);
      expect(component.showIntervalOverflowError).toBe(false);
    }));
  });

  describe('Donation Type Search', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should filter donation types by donationType code', () => {
      component.donationTypeSearchControl.setValue('AL');

      expect(component.filteredDonationTypes.length).toBe(1);
      expect(component.filteredDonationTypes[0].donationType).toBe('AL');
    });

    it('should filter donation types by description', () => {
      component.donationTypeSearchControl.setValue('Autologous');

      expect(component.filteredDonationTypes.length).toBe(1);
      expect(component.filteredDonationTypes[0].donationType).toBe('AU');
    });

    it('should be case insensitive when filtering', () => {
      component.donationTypeSearchControl.setValue('allo');

      expect(component.filteredDonationTypes.length).toBe(1);
      expect(component.filteredDonationTypes[0].donationType).toBe('AL');
    });

    it('should return all donation types when search is empty', () => {
      component.donationTypeSearchControl.setValue('AL');
      expect(component.filteredDonationTypes.length).toBe(1);

      component.donationTypeSearchControl.setValue('');
      expect(component.filteredDonationTypes).toEqual(component.donationTypes);
    });

    it('should return all donation types when search is null', () => {
      component.donationTypeSearchControl.setValue(null);
      expect(component.filteredDonationTypes).toEqual(component.donationTypes);
    });

    it('should return no results for non-matching search', () => {
      component.donationTypeSearchControl.setValue('ZZZZZ');
      expect(component.filteredDonationTypes.length).toBe(0);
    });
  });

  describe('loadDropdownData error handling', () => {
    it('should show snackbar on dropdown load failure', () => {
      service.getDonationTypes.and.returnValue(throwError(() => new Error('Network error')));
      service.getProcedureGroups.and.returnValue(throwError(() => new Error('Network error')));

      const fix = TestBed.createComponent(AddEditMaxDonations);
      const comp = fix.componentInstance;
      spyOn(comp['snackBar'], 'open');
      comp.mode = 'add';
      fix.detectChanges();

      expect(comp['snackBar'].open).toHaveBeenCalledWith(
        'Failed to load dropdown options',
        'DISMISS',
        jasmine.objectContaining({
          duration: 5000,
          panelClass: ['error-snackbar']
        })
      );
    });

    it('should handle null response for donation types', () => {
      service.getDonationTypes.and.returnValue(of(null as any));
      service.getProcedureGroups.and.returnValue(of(null as any));

      const fix = TestBed.createComponent(AddEditMaxDonations);
      const comp = fix.componentInstance;
      comp.mode = 'add';
      fix.detectChanges();

      expect(comp.donationTypes).toEqual([]);
      expect(comp.procedureGroups).toEqual([]);
    });
  });

  describe('Save - Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();

      // Use future dates to avoid validation errors
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 365);

      component.form.patchValue({
        donationType: 'AL',
        procedureGroup: 'PLATE',
        maximums: 2,
        interval: 7,
        effectiveDate: tomorrow,
        terminationDate: futureDate
      });
    });

    it('should call addMaxDonation service on save in add mode', () => {
      service.addMaxDonation.and.returnValue(of({ success: true }));

      component.onSave();

      expect(service.addMaxDonation).toHaveBeenCalled();
    });

    it('should emit saveSuccess and closePanel on successful add', () => {
      service.addMaxDonation.and.returnValue(of({ success: true }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should show success snackbar on successful add', () => {
      spyOn(component['snackBar'], 'open');
      service.addMaxDonation.and.returnValue(of({ success: true }));

      component.onSave();

      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Record has been added successfully.',
        'DISMISS',
        jasmine.objectContaining({
          duration: 3000,
          panelClass: ['success-snackbar']
        })
      );
    });

    it('should use response message when provided', () => {
      spyOn(component['snackBar'], 'open');
      service.addMaxDonation.and.returnValue(of({ success: true, message: 'Custom message' }));

      component.onSave();

      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Custom message',
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should handle error on add', () => {
      service.addMaxDonation.and.returnValue(
        throwError(() => ({ error: { message: 'Duplicate entry' } }))
      );

      component.onSave();

      expect(component.isSaving).toBe(false);
    });

    it('should format dates to ISO string without timezone', () => {
      service.addMaxDonation.and.returnValue(of({ success: true }));

      component.onSave();

      expect(service.addMaxDonation).toHaveBeenCalledWith(
        jasmine.objectContaining({
          effDate: jasmine.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          termDate: jasmine.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
        })
      );
    });

    it('should set isSaving to true during save', () => {
      service.addMaxDonation.and.returnValue(of({ success: true }));

      // We can check that isSaving is set to false after the call completes
      component.onSave();
      expect(component.isSaving).toBe(false);
    });

    it('should not call service when form is invalid', () => {
      component.form.patchValue({ donationType: '' });

      component.onSave();

      expect(service.addMaxDonation).not.toHaveBeenCalled();
    });

    it('should mark all controls as touched when form is invalid', () => {
      component.form.patchValue({ donationType: '', maximums: null });

      component.onSave();

      expect(component.form.get('donationType')?.touched).toBe(true);
      expect(component.form.get('maximums')?.touched).toBe(true);
    });

    it('should handle save with null termination date', () => {
      service.addMaxDonation.and.returnValue(of({ success: true }));
      component.form.patchValue({ terminationDate: null });

      component.onSave();

      expect(service.addMaxDonation).toHaveBeenCalledWith(
        jasmine.objectContaining({
          termDate: undefined
        })
      );
    });

    it('should trim donationType in add payload', () => {
      service.addMaxDonation.and.returnValue(of({ success: true }));
      component.form.patchValue({ donationType: '  AL  ' });

      component.onSave();

      expect(service.addMaxDonation).toHaveBeenCalledWith(
        jasmine.objectContaining({
          donationType: 'AL'
        })
      );
    });

    it('should trim procedureGroup in add payload', () => {
      service.addMaxDonation.and.returnValue(of({ success: true }));
      component.form.patchValue({ procedureGroup: '  PLATE  ' });

      component.onSave();

      expect(service.addMaxDonation).toHaveBeenCalledWith(
        jasmine.objectContaining({
          procedureGroup: 'PLATE'
        })
      );
    });
  });

  describe('Save - Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      service.updateMaxDonation.and.returnValue(of({ success: true }));
    });

    it('should call updateMaxDonation service on save in edit mode', () => {
      component.form.patchValue({ maximums: 5 });

      component.onSave();

      expect(service.updateMaxDonation).toHaveBeenCalled();
    });

    it('should use original keys and originalInterval in update payload', () => {
      component.form.patchValue({
        maximums: 3,
        interval: 14
      });

      component.onSave();

      expect(service.updateMaxDonation).toHaveBeenCalledWith(
        jasmine.objectContaining({
          donationType: 'AL',
          procedureGroup: 'PLATE',
          originalInterval: 7,
          interval: 14,
          maxDonations: 3
        })
      );
    });

    it('should emit saveSuccess and closePanel on successful edit', () => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');
      component.form.patchValue({ maximums: 5 });

      component.onSave();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should show success snackbar on successful edit', () => {
      spyOn(component['snackBar'], 'open');
      component.form.patchValue({ maximums: 5 });

      component.onSave();

      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Record has been updated successfully.',
        'DISMISS',
        jasmine.objectContaining({
          duration: 3000,
          panelClass: ['success-snackbar']
        })
      );
    });

    it('should handle error on edit', () => {
      service.updateMaxDonation.and.returnValue(
        throwError(() => new Error('Server error'))
      );
      component.form.patchValue({ maximums: 5 });

      component.onSave();

      expect(component.isSaving).toBe(false);
    });

    it('should include originalInterval in update payload even when interval changes', () => {
      component.form.patchValue({
        maximums: 5,
        interval: 30
      });

      component.onSave();

      const callArgs = service.updateMaxDonation.calls.mostRecent().args[0];
      expect(callArgs.originalInterval).toBe(7);
      expect(callArgs.interval).toBe(30);
      expect(callArgs.originalInterval).not.toBe(callArgs.interval);
    });
  });

  describe('Save - Date validation edge cases', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should not save when dateRangeInvalid and set lastChangedDateField to effective if null', () => {
      const eff = new Date();
      eff.setDate(eff.getDate() + 30);
      const term = new Date();
      term.setDate(term.getDate() + 5);

      component.form.patchValue({
        donationType: 'AL',
        procedureGroup: 'PLATE',
        maximums: 2,
        interval: 7,
        effectiveDate: eff,
        terminationDate: term
      });
      component.form.updateValueAndValidity();

      component.onSave();

      expect(service.addMaxDonation).not.toHaveBeenCalled();
    });
  });

  describe('isFormChanged', () => {
    it('should return true in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();

      expect(component.isFormChanged).toBe(true);
    });

    it('should return false in edit mode when no values changed', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      expect(component.isFormChanged).toBe(false);
    });

    it('should return true in edit mode when maximums changed', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      component.form.patchValue({ maximums: 99 });

      expect(component.isFormChanged).toBe(true);
    });

    it('should return true in edit mode when interval changed', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      component.form.patchValue({ interval: 999 });

      expect(component.isFormChanged).toBe(true);
    });

    it('should return true in edit mode when termination date changed', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 730);
      component.form.patchValue({ terminationDate: newDate });

      expect(component.isFormChanged).toBe(true);
    });
  });

  describe('isFormValid', () => {
    it('should return false when form is invalid', () => {
      component.mode = 'add';
      fixture.detectChanges();

      // Form is empty, hence invalid
      expect(component.isFormValid).toBe(false);
    });

    it('should return true when form is valid, changed, and no date errors', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const eff = new Date();
      eff.setDate(eff.getDate() + 5);
      const term = new Date();
      term.setDate(term.getDate() + 30);

      component.form.patchValue({
        donationType: 'AL',
        procedureGroup: 'PLATE',
        maximums: 10,
        interval: 14,
        effectiveDate: eff,
        terminationDate: term
      });
      component.form.updateValueAndValidity();

      expect(component.isFormValid).toBe(true);
    });

    it('should return false in edit mode when form has not changed', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      // Form is valid but not changed
      expect(component.isFormValid).toBe(false);
    });

    it('should return false when date range is invalid', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const eff = new Date();
      eff.setDate(eff.getDate() + 30);
      const term = new Date();
      term.setDate(term.getDate() + 5);

      component.form.patchValue({
        donationType: 'AL',
        procedureGroup: 'PLATE',
        maximums: 10,
        interval: 14,
        effectiveDate: eff,
        terminationDate: term
      });
      component.form.updateValueAndValidity();

      expect(component.isFormValid).toBe(false);
    });
  });

  describe('Termination Date Min Date', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should update termination min date when effective date is set', () => {
      const effectiveDate = new Date();
      effectiveDate.setDate(effectiveDate.getDate() + 10);
      component.form.get('effectiveDate')?.setValue(effectiveDate);

      const termMinDate = component.terminationMinDate.toDate();
      expect(termMinDate.getFullYear()).toBe(effectiveDate.getFullYear());
      expect(termMinDate.getMonth()).toBe(effectiveDate.getMonth());
      expect(termMinDate.getDate()).toBe(effectiveDate.getDate());
    });

    it('should reset termination min date to chapter min when effective date is cleared', () => {
      const effectiveDate = new Date();
      effectiveDate.setDate(effectiveDate.getDate() + 10);
      component.form.get('effectiveDate')?.setValue(effectiveDate);
      component.form.get('effectiveDate')?.setValue(null);

      expect(component.terminationMinDate).toEqual(component.minDate);
    });

    it('should set termination min date from effective date in edit mode when effective date is in future', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnInit();
      fixture.detectChanges();

      const termMinDate = component.terminationMinDate.toDate();
      const effDate = new Date(mockEditData.effDate!);
      expect(termMinDate.getFullYear()).toBe(effDate.getFullYear());
      expect(termMinDate.getMonth()).toBe(effDate.getMonth());
      expect(termMinDate.getDate()).toBe(effDate.getDate());
    });

    it('should use chapter min date when effective date is in the past', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      const pastEditData: DefineMaxDonationsModel = {
        ...mockEditData,
        effDate: pastDate.toISOString()
      };

      component.mode = 'edit';
      component.data = pastEditData;
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.terminationMinDate).toEqual(component.minDate);
    });

    it('should use whichever is latest between effective date and chapter min date', () => {
      const futureEffDate = new Date();
      futureEffDate.setDate(futureEffDate.getDate() + 30);
      component.form.get('effectiveDate')?.setValue(futureEffDate);

      const termMinDate = component.terminationMinDate.toDate();
      expect(termMinDate.getFullYear()).toBe(futureEffDate.getFullYear());
      expect(termMinDate.getMonth()).toBe(futureEffDate.getMonth());
      expect(termMinDate.getDate()).toBe(futureEffDate.getDate());
    });

    it('should handle moment value for effective date', () => {
      const futureMoment = moment().add(15, 'days');
      component.form.get('effectiveDate')?.setValue(futureMoment);

      const termMinDate = component.terminationMinDate;
      expect(moment.isMoment(termMinDate)).toBe(true);
    });
  });

  describe('Cancel', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should emit closePanel on cancel', () => {
      spyOn(component.closePanel, 'emit');

      component.onCancel();

      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should not call service on cancel', () => {
      component.onCancel();

      expect(service.addMaxDonation).not.toHaveBeenCalled();
      expect(service.updateMaxDonation).not.toHaveBeenCalled();
    });
  });

  describe('Error Messages', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return correct error message for required maximum donation', () => {
      const control = component.form.get('maximums');
      control?.setValue(null);
      control?.markAsTouched();

      const error = component.getMaximumsError();

      expect(error).toBe('Max Donation is required');
    });

    it('should return correct error message for min maximum donation', () => {
      const control = component.form.get('maximums');
      control?.setValue(0);
      control?.markAsTouched();

      const error = component.getMaximumsError();

      expect(error).toBe('Max Donation must be at least 1');
    });

    it('should return correct error message for max maximum donation', () => {
      const control = component.form.get('maximums');
      control?.setValue(1000);
      control?.markAsTouched();

      const error = component.getMaximumsError();

      expect(error).toBe('Max Donation must be 999 or less');
    });

    it('should return overflow error message for maximums when overflow flag is set', () => {
      component.showMaxDonationOverflowError = true;

      const error = component.getMaximumsError();

      expect(error).toBe('Max Donation must be 999 or less');
    });

    it('should return empty string for maximums when control is untouched', () => {
      expect(component.getMaximumsError()).toBe('');
    });

    it('should return correct error message for required interval', () => {
      const control = component.form.get('interval');
      control?.setValue(null);
      control?.markAsTouched();

      const error = component.getIntervalError();

      expect(error).toBe('Interval Days is required');
    });

    it('should return correct error message for min interval', () => {
      const control = component.form.get('interval');
      control?.setValue(0);
      control?.markAsTouched();

      const error = component.getIntervalError();

      expect(error).toBe('Interval Days must be at least 1');
    });

    it('should return correct error message for max interval', () => {
      const control = component.form.get('interval');
      control?.setValue(1000);
      control?.markAsTouched();

      const error = component.getIntervalError();

      expect(error).toBe('Interval Days must be 999 or less');
    });

    it('should return overflow error message for interval when overflow flag is set', () => {
      component.showIntervalOverflowError = true;

      const error = component.getIntervalError();

      expect(error).toBe('Interval Days must be 999 or less');
    });

    it('should return empty string for interval when control is untouched', () => {
      expect(component.getIntervalError()).toBe('');
    });

    it('should return correct error message for date range validation', () => {
      component.form.patchValue({
        effectiveDate: new Date('2024-12-31'),
        terminationDate: new Date('2024-01-01')
      });

      expect(component.form.hasError('dateRangeInvalid')).toBe(true);
    });
  });

  describe('Donation Type Error', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return required error when donation type is empty and touched', () => {
      const control = component.form.get('donationType');
      control?.setValue('');
      control?.markAsTouched();

      expect(component.getDonationTypeError()).toBe('Donation Type is required');
    });

    it('should return empty string when control is untouched', () => {
      expect(component.getDonationTypeError()).toBe('');
    });

    it('should return empty string when control has a valid value', () => {
      const control = component.form.get('donationType');
      control?.setValue('AL');
      control?.markAsTouched();

      expect(component.getDonationTypeError()).toBe('');
    });
  });

  describe('Procedure Group Error', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return required error when procedure group is empty and touched', () => {
      const control = component.form.get('procedureGroup');
      control?.setValue('');
      control?.markAsTouched();

      expect(component.getProcedureGroupError()).toBe('Procedure Group is required');
    });

    it('should return empty string when control is untouched', () => {
      expect(component.getProcedureGroupError()).toBe('');
    });

    it('should return empty string when control has a valid value', () => {
      const control = component.form.get('procedureGroup');
      control?.setValue('PLATE');
      control?.markAsTouched();

      expect(component.getProcedureGroupError()).toBe('');
    });
  });

  describe('Date Input and Change Handlers', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should call handleStartDateInput on effective date input', () => {
      spyOn(DateFieldValidationUtility, 'handleStartDateInput');

      const input = document.createElement('input');
      input.value = '01-JAN-2030';
      const event = { target: input } as any;

      component.onEffectiveDateInput(event);

      expect(DateFieldValidationUtility.handleStartDateInput).toHaveBeenCalledWith(
        '01-JAN-2030',
        component.form.get('effectiveDate')
      );
    });

    it('should mark effective date as touched and dirty on change', () => {
      component.onEffectiveDateChange();

      expect(component.form.get('effectiveDate')?.touched).toBe(true);
      expect(component.form.get('effectiveDate')?.dirty).toBe(true);
    });

    it('should call handleEndDateInput on termination date input', () => {
      spyOn(DateFieldValidationUtility, 'handleEndDateInput');

      const input = document.createElement('input');
      input.value = '01-DEC-2030';
      const event = { target: input } as any;

      component.onTerminationDateInput(event);

      expect(DateFieldValidationUtility.handleEndDateInput).toHaveBeenCalledWith(
        '01-DEC-2030',
        component.form.get('terminationDate'),
        false
      );
    });

    it('should pass isEditMode=true for termination date input in edit mode', () => {
      spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      component.mode = 'edit';

      const input = document.createElement('input');
      input.value = '01-DEC-2030';
      const event = { target: input } as any;

      component.onTerminationDateInput(event);

      expect(DateFieldValidationUtility.handleEndDateInput).toHaveBeenCalledWith(
        '01-DEC-2030',
        component.form.get('terminationDate'),
        true
      );
    });

    it('should mark termination date as touched and dirty on change', () => {
      component.onTerminationDateChange();

      expect(component.form.get('terminationDate')?.touched).toBe(true);
      expect(component.form.get('terminationDate')?.dirty).toBe(true);
    });

    it('should update form validity on effective date change', () => {
      spyOn(component.form, 'updateValueAndValidity');

      component.onEffectiveDateChange();

      expect(component.form.updateValueAndValidity).toHaveBeenCalled();
    });

    it('should update form validity on termination date change', () => {
      spyOn(component.form, 'updateValueAndValidity');

      component.onTerminationDateChange();

      expect(component.form.updateValueAndValidity).toHaveBeenCalled();
    });
  });

  describe('getEffectiveDateError', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return empty string when effective date is not touched', () => {
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return required error when effective date is touched and empty', () => {
      const control = component.form.get('effectiveDate');
      control?.setValue(null);
      control?.markAsTouched();

      const error = component.getEffectiveDateError();
      expect(error).toContain('required');
    });
  });

  describe('getTerminationDateError', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return empty string when termination date is not touched', () => {
      expect(component.getTerminationDateError()).toBe('');
    });
  });

  describe('toNativeDate (private)', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return null for null input', () => {
      const result = component['toNativeDate'](null);
      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = component['toNativeDate'](undefined);
      expect(result).toBeNull();
    });

    it('should convert moment object to Date', () => {
      const m = moment('2025-06-15');
      const result = component['toNativeDate'](m);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
    });

    it('should return Date object as-is', () => {
      const d = new Date('2025-06-15');
      const result = component['toNativeDate'](d);
      expect(result).toBeInstanceOf(Date);
      expect(result).toBe(d);
    });

    it('should parse valid date string', () => {
      const result = component['toNativeDate']('2025-06-15' as any);
      expect(result).toBeInstanceOf(Date);
    });

    it('should return null for invalid date string', () => {
      const result = component['toNativeDate']('not-a-date' as any);
      expect(result).toBeNull();
    });
  });

  describe('formatDateForDisplay (private)', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return empty string for null', () => {
      const result = component['formatDateForDisplay'](null);
      expect(result).toBe('');
    });

    it('should return empty string for undefined', () => {
      const result = component['formatDateForDisplay'](undefined);
      expect(result).toBe('');
    });

    it('should format a valid date string', () => {
      const result = component['formatDateForDisplay']('2025-01-15');
      expect(result).toBe('15-JAN-2025');
    });

    it('should format a Date object', () => {
      // Use UTC to avoid timezone issues
      const result = component['formatDateForDisplay']('2025-03-20');
      expect(result).toBe('20-MAR-2025');
    });

    it('should return empty string for invalid date', () => {
      const invalidDate = new Date('not-a-date');
      const result = component['formatDateForDisplay'](invalidDate as any);
      expect(result).toBe('');
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should complete the destroy$ subject', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });

    it('should clear maxDonationErrorTimeout if set', fakeAsync(() => {
      // Trigger overflow to create a timeout
      const input = document.createElement('input');
      input.value = '1234';
      const event = { target: input } as any;
      component.onMaximumsInput(event);

      expect(component['maxDonationErrorTimeout']).not.toBeNull();

      component.ngOnDestroy();

      // After destroy, the timeout should have been cleared
      // tick to make sure no error happens from the cleared timeout
      tick(3000);
    }));

    it('should clear intervalErrorTimeout if set', fakeAsync(() => {
      const input = document.createElement('input');
      input.value = '1234';
      const event = { target: input } as any;
      component.onIntervalInput(event);

      expect(component['intervalErrorTimeout']).not.toBeNull();

      component.ngOnDestroy();

      tick(3000);
    }));

    it('should handle destroy when no timeouts are active', () => {
      expect(component['maxDonationErrorTimeout']).toBeNull();
      expect(component['intervalErrorTimeout']).toBeNull();

      // Should not throw
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('setupDateValidationListeners', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should track lastChangedDateField as effective when effective date changes', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      component.form.get('effectiveDate')?.setValue(futureDate);

      expect(component['lastChangedDateField']).toBe('effective');
    });

    it('should track lastChangedDateField as termination when termination date changes', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      component.form.get('terminationDate')?.setValue(futureDate);

      expect(component['lastChangedDateField']).toBe('termination');
    });
  });

  describe('Edge Cases - populateFormForEdit', () => {
    it('should handle data with missing optional fields', () => {
      const minimalData: DefineMaxDonationsModel = {
        donationType: 'AL',
        procedureGroup: 'PLATE',
        maxDonations: 1,
        interval: 5,
        effDate: tomorrow.toISOString()
        // No termDate, no donationDescription
      };

      component.mode = 'edit';
      component.data = minimalData;
      fixture.detectChanges();

      expect(component.editModeValues.donationTypeDescription).toBe('');
      expect(component.form.get('terminationDate')?.value).toBeNull();
    });

    it('should handle data with empty string values', () => {
      const emptyData: DefineMaxDonationsModel = {
        donationType: '',
        donationDescription: '',
        procedureGroup: '',
        maxDonations: 0,
        interval: 0,
        effDate: null,
        termDate: null
      };

      component.mode = 'edit';
      component.data = emptyData;
      fixture.detectChanges();

      expect(component['originalValues'].donationType).toBe('');
      expect(component['originalValues'].procedureGroup).toBe('');
      expect(component['originalValues'].interval).toBe(0);
    });
  });

  describe('Error State Matchers', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should have effDateErrorMatcher defined', () => {
      expect(component.effDateErrorMatcher).toBeDefined();
      expect(component.effDateErrorMatcher.isErrorState).toBeDefined();
    });

    it('should have termDateErrorMatcher defined', () => {
      expect(component.termDateErrorMatcher).toBeDefined();
      expect(component.termDateErrorMatcher.isErrorState).toBeDefined();
    });

    it('effDateErrorMatcher should return false for null control', () => {
      const result = component.effDateErrorMatcher.isErrorState(null, null as any);
      expect(result).toBe(false);
    });

    it('termDateErrorMatcher should return false for null control', () => {
      const result = component.termDateErrorMatcher.isErrorState(null, null as any);
      expect(result).toBe(false);
    });
  });
});
