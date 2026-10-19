import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError, Subject } from 'rxjs';
import { SimpleChange, SimpleChanges } from '@angular/core';
import { AddEditAssociateLetter } from './add-edit-associate-letter';
import { AssociateLetterToInterdictionService } from '../services/associate-letter-to-interdiction.service';
import { AssociateLetterToInterdictionModel } from '../models/associate-letter-to-interdiction.model';
import moment from 'moment';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AddEditAssociateLetter', () => {
  let serviceSpy: any;
  let component: AddEditAssociateLetter;
  let fixture: ComponentFixture<AddEditAssociateLetter>;
  let service: jasmine.SpyObj<AssociateLetterToInterdictionService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const nextMonth = moment().add(1, 'month').startOf('day');
  const nextYear = moment().add(1, 'year').startOf('day');

  const mockRecord: AssociateLetterToInterdictionModel = {
    interCode: 'D01',
    interDesc: 'Deferred - Travel',
    donationType: 'WB',
    donationDesc: 'Whole Blood',
    letterId: 'LTR001',
    effDate: '2025-01-01T00:00:00',
    termDate: '2025-12-31T00:00:00',
    insertDate: '2025-01-01T12:00:00',
    insertUser: 'admin'
  };

  const mockInterdictions = [
    { interCode: 'D01', interDesc: 'Deferred - Travel' },
    { interCode: 'D02', interDesc: 'Deferred - Medical' }
  ];

  const mockDonationTypes = [
    { donationType: 'WB', description: 'Whole Blood' },
    { donationType: 'PLT', description: 'Platelets' }
  ];

  const mockLetters = [
    { letterCode: 'N', letterId: 'LTR001', letterTitle: 'Deferral Notification' },
    { letterCode: 'N', letterId: 'LTR002', letterTitle: 'Post-Donation Letter' }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('AssociateLetterToInterdictionService', [
      'create',
      'update',
      'getInterdictionsDropdown',
      'getDonationTypesDropdown',
      'getLettersDropdown'
    ]);
    const snackBarSpy = createMockMatSnackBar();



      TestBed.configureTestingModule({
imports: [AddEditAssociateLetter, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: AssociateLetterToInterdictionService, useValue: serviceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    });


    });



  beforeEach(() => {


      serviceSpy.create.calls.reset();


      serviceSpy.update.calls.reset();


      serviceSpy.getInterdictionsDropdown.calls.reset();


      serviceSpy.getDonationTypesDropdown.calls.reset();


      serviceSpy.getLettersDropdown.calls.reset();


    service = TestBed.inject(AssociateLetterToInterdictionService) as jasmine.SpyObj<AssociateLetterToInterdictionService>;

    service.getInterdictionsDropdown.and.returnValue(of(mockInterdictions));
    service.getDonationTypesDropdown.and.returnValue(of(mockDonationTypes));
    service.getLettersDropdown.and.returnValue(of(mockLetters));

    fixture = TestBed.createComponent(AddEditAssociateLetter);
    component = fixture.componentInstance;

    // Access the actual snackBar instance the component uses (standalone component
    // may not use TestBed-level provider due to MatSnackBarModule import)
    const actualSnackBar = (component as any).snackBar;
    if (!jasmine.isSpy(actualSnackBar.open)) {
      spyOn(actualSnackBar, 'open');
    } else {
      actualSnackBar.open.calls.reset();
    }
    snackBar = actualSnackBar;

    });

  describe('Component Creation', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have default mode as add', () => {
      expect(component.mode).toBe('add');
    });

    it('should have default data as null', () => {
      expect(component.data).toBeNull();
    });

    it('should initialize with default property values', () => {
      expect(component.isSaving).toBe(false);
      expect(component.isLoadingDropdowns).toBe(false);
      expect(component.interdictionDescription).toBe('-');
      expect(component.donationDescription).toBe('-');
    });
  });

  describe('ngOnInit', () => {
    it('should initialize form on init', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.form).toBeTruthy();
      expect(component.form.get('interCode')).toBeTruthy();
      expect(component.form.get('donationType')).toBeTruthy();
      expect(component.form.get('letterId')).toBeTruthy();
      expect(component.form.get('effDate')).toBeTruthy();
      expect(component.form.get('termDate')).toBeTruthy();
    });

    it('should load dropdown options on init', () => {
      fixture.detectChanges();
      expect(service.getInterdictionsDropdown).toHaveBeenCalled();
      expect(service.getDonationTypesDropdown).toHaveBeenCalled();
      expect(service.getLettersDropdown).toHaveBeenCalled();
    });

    it('should populate dropdown data after loading', () => {
      fixture.detectChanges();
      expect(component.interdictionOptions).toEqual(mockInterdictions);
      expect(component.filteredInterdictionOptions).toEqual(mockInterdictions);
      expect(component.donationTypeOptions).toEqual(mockDonationTypes);
      expect(component.filteredDonationTypeOptions).toEqual(mockDonationTypes);
      expect(component.letterOptions).toEqual(mockLetters);
      expect(component.filteredLetterOptions).toEqual(mockLetters);
    });

    it('should set isLoadingDropdowns to false after letters load', () => {
      fixture.detectChanges();
      expect(component.isLoadingDropdowns).toBe(false);
    });

    it('should populate form for edit mode during init', () => {
      component.mode = 'edit';
      component.data = mockRecord;
      fixture.detectChanges();
      expect(component.editModeValues.interCode).toBe('D01');
      expect(component.form.get('interCode')?.disabled).toBe(true);
    });

    it('should not populate form for edit mode if data is null', () => {
      component.mode = 'edit';
      component.data = null;
      fixture.detectChanges();
      expect(component.editModeValues.interCode).toBe('');
    });
  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should reinitialize form when mode changes', () => {
      component.mode = 'edit';
      component.data = mockRecord;
      const changes: SimpleChanges = {
        mode: new SimpleChange('add', 'edit', false)
      };
      component.ngOnChanges(changes);
      expect(component.form.get('interCode')?.disabled).toBe(true);
    });

    it('should reinitialize form when data changes', () => {
      component.mode = 'edit';
      component.data = mockRecord;
      const changes: SimpleChanges = {
        data: new SimpleChange(null, mockRecord, false)
      };
      component.ngOnChanges(changes);
      expect(component.editModeValues.interCode).toBe('D01');
    });

    it('should reset descriptions during reinitialize', () => {
      component.interdictionDescription = 'Some Desc';
      component.donationDescription = 'Some Other Desc';
      const changes: SimpleChanges = {
        mode: new SimpleChange('add', 'add', false)
      };
      component.ngOnChanges(changes);
      expect(component.interdictionDescription).toBe('-');
      expect(component.donationDescription).toBe('-');
    });

    it('should not reinitialize if form is not yet created', () => {
      const freshFixture = TestBed.createComponent(AddEditAssociateLetter);
      const freshComponent = freshFixture.componentInstance;
      // form is undefined before detectChanges
      const changes: SimpleChanges = {
        mode: new SimpleChange('add', 'edit', false)
      };
      // should not throw
      expect(() => freshComponent.ngOnChanges(changes)).not.toThrow();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      fixture.detectChanges();
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should create form with required validators in add mode', () => {
      expect(component.form.get('interCode')?.hasError('required')).toBe(true);
      expect(component.form.get('donationType')?.hasError('required')).toBe(true);
      expect(component.form.get('letterId')?.hasError('required')).toBe(true);
      expect(component.form.get('effDate')?.hasError('required')).toBe(true);
    });

    it('should be valid when all required fields are filled in add mode', () => {
      component.form.patchValue({
        interCode: 'D01',
        donationType: 'WB',
        letterId: 'LTR001',
        effDate: nextMonth.clone()
      });
      fixture.detectChanges();
      expect(component.form.valid).toBe(true);
    });

    it('should invalidate when termination date is before effective date', () => {
      component.form.patchValue({
        effDate: nextYear.clone(),
        termDate: nextMonth.clone()
      });
      fixture.detectChanges();
      expect(component.form.hasError('dateRangeInvalid')).toBe(true);
    });

    it('should be valid when termination date equals effective date', () => {
      component.form.patchValue({
        interCode: 'D01',
        donationType: 'WB',
        letterId: 'LTR001',
        effDate: nextMonth.clone(),
        termDate: nextMonth.clone()
      });
      fixture.detectChanges();
      expect(component.form.hasError('dateRangeInvalid')).toBe(false);
    });

    it('should not require termDate (optional field)', () => {
      component.form.patchValue({
        interCode: 'D01',
        donationType: 'WB',
        letterId: 'LTR001',
        effDate: nextMonth.clone(),
        termDate: null
      });
      fixture.detectChanges();
      expect(component.form.valid).toBe(true);
    });
  });

  describe('Edit Mode Population', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockRecord;
      fixture.detectChanges();
    });

    it('should populate edit mode display values', () => {
      expect(component.editModeValues.interCode).toBe('D01');
      expect(component.editModeValues.interDesc).toBe('Deferred - Travel');
      expect(component.editModeValues.donationType).toBe('WB');
      expect(component.editModeValues.donationDesc).toBe('Whole Blood');
      expect(component.editModeValues.letterId).toBe('LTR001');
    });

    it('should disable key fields in edit mode', () => {
      expect(component.form.get('interCode')?.disabled).toBe(true);
      expect(component.form.get('donationType')?.disabled).toBe(true);
      expect(component.form.get('letterId')?.disabled).toBe(true);
      expect(component.form.get('effDate')?.disabled).toBe(true);
    });

    it('should keep termination date enabled in edit mode', () => {
      expect(component.form.get('termDate')?.disabled).toBe(false);
    });

    it('should format effDate for display in editModeValues', () => {
      expect(component.editModeValues.effDate).toBeTruthy();
      expect(component.editModeValues.effDate).not.toBe('-');
    });

    it('should format insertDate for display in editModeValues', () => {
      expect(component.editModeValues.insertDate).toBeTruthy();
    });

    it('should store original values for edit mode', () => {
      expect(component['originalInterCode']).toBe('D01');
      expect(component['originalDonationType']).toBe('WB');
      expect(component['originalLetterId']).toBe('LTR001');
      expect(component['originalEffDate']).toBeTruthy();
    });

    it('should store initialTermDate for change detection', () => {
      expect(component['initialTermDate']).not.toBeNull();
    });

    it('should handle record with null termDate in edit mode', () => {
      const recordNoTermDate: AssociateLetterToInterdictionModel = {
        ...mockRecord,
        termDate: null
      };
      const freshFixture = TestBed.createComponent(AddEditAssociateLetter);
      const freshComponent = freshFixture.componentInstance;
      freshComponent.mode = 'edit';
      freshComponent.data = recordNoTermDate;
      freshFixture.detectChanges();
      expect(freshComponent['initialTermDate']).toBeNull();
    });

    it('should handle record with missing optional fields', () => {
      const minimalRecord: AssociateLetterToInterdictionModel = {
        interCode: undefined,
        interDesc: undefined,
        donationType: undefined,
        donationDesc: undefined,
        letterId: undefined,
        effDate: null,
        termDate: null,
        insertDate: null
      };
      const freshFixture = TestBed.createComponent(AddEditAssociateLetter);
      const freshComponent = freshFixture.componentInstance;
      freshComponent.mode = 'edit';
      freshComponent.data = minimalRecord;
      freshFixture.detectChanges();
      expect(freshComponent.editModeValues.interCode).toBe('-');
      expect(freshComponent.editModeValues.interDesc).toBe('-');
      expect(freshComponent.editModeValues.donationType).toBe('-');
      expect(freshComponent.editModeValues.donationDesc).toBe('-');
      expect(freshComponent.editModeValues.letterId).toBe('-');
      expect(freshComponent.editModeValues.effDate).toBe('-');
      expect(freshComponent.editModeValues.insertDate).toBe('');
    });

    it('should clear validators on disabled fields in edit mode', () => {
      expect(component.form.get('interCode')?.errors).toBeNull();
      expect(component.form.get('donationType')?.errors).toBeNull();
      expect(component.form.get('letterId')?.errors).toBeNull();
      expect(component.form.get('effDate')?.errors).toBeNull();
    });
  });

  describe('Getters', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    describe('panelTitle', () => {
      it('should return "Link Letter to Interdiction" in add mode', () => {
        component.mode = 'add';
        expect(component.panelTitle).toBe('Link Letter to Interdiction');
      });

      it('should return "Edit Rule" in edit mode', () => {
        component.mode = 'edit';
        expect(component.panelTitle).toBe('Edit Rule');
      });
    });

    describe('saveButtonLabel', () => {
      it('should return "ADD" in add mode', () => {
        component.mode = 'add';
        expect(component.saveButtonLabel).toBe('ADD');
      });

      it('should return "SAVE" in edit mode', () => {
        component.mode = 'edit';
        expect(component.saveButtonLabel).toBe('SAVE');
      });
    });

    describe('isFormValid', () => {
      it('should return true when form is valid in add mode', () => {
        component.form.patchValue({
          interCode: 'D01',
          donationType: 'WB',
          letterId: 'LTR001',
          effDate: nextMonth.clone()
        });
        expect(component.isFormValid).toBe(true);
      });

      it('should return false when form is invalid in add mode', () => {
        expect(component.isFormValid).toBe(false);
      });

      it('should return false in edit mode when form has not changed', () => {
        const freshFixture = TestBed.createComponent(AddEditAssociateLetter);
        const freshComponent = freshFixture.componentInstance;
        freshComponent.mode = 'edit';
        freshComponent.data = mockRecord;
        freshFixture.detectChanges();
        // Form is valid but no changes made
        expect(freshComponent.isFormValid).toBe(false);
      });

      it('should return true in edit mode when termination date has changed', () => {
        const freshFixture = TestBed.createComponent(AddEditAssociateLetter);
        const freshComponent = freshFixture.componentInstance;
        freshComponent.mode = 'edit';
        freshComponent.data = mockRecord;
        freshFixture.detectChanges();
        freshComponent.form.patchValue({ termDate: nextYear.clone() });
        expect(freshComponent.isFormValid).toBe(true);
      });
    });
  });

  describe('onCancel', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should emit closePanel event', () => {
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  describe('Search Filters', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should filter interdiction options by interCode', () => {
      component.interdictionSearchControl.setValue('D01');
      expect(component.filteredInterdictionOptions.length).toBe(1);
      expect(component.filteredInterdictionOptions[0].interCode).toBe('D01');
    });

    it('should filter interdiction options by interDesc', () => {
      component.interdictionSearchControl.setValue('Medical');
      expect(component.filteredInterdictionOptions.length).toBe(1);
      expect(component.filteredInterdictionOptions[0].interCode).toBe('D02');
    });

    it('should show all interdiction options when search is empty', () => {
      component.interdictionSearchControl.setValue('');
      expect(component.filteredInterdictionOptions.length).toBe(2);
    });

    it('should handle null search term for interdictions', () => {
      component.interdictionSearchControl.setValue(null);
      expect(component.filteredInterdictionOptions.length).toBe(2);
    });

    it('should filter donation type options by donationType', () => {
      component.donationTypeSearchControl.setValue('PLT');
      expect(component.filteredDonationTypeOptions.length).toBe(1);
      expect(component.filteredDonationTypeOptions[0].donationType).toBe('PLT');
    });

    it('should filter donation type options by description', () => {
      component.donationTypeSearchControl.setValue('Whole');
      expect(component.filteredDonationTypeOptions.length).toBe(1);
      expect(component.filteredDonationTypeOptions[0].donationType).toBe('WB');
    });

    it('should show all donation type options when search is empty', () => {
      component.donationTypeSearchControl.setValue('');
      expect(component.filteredDonationTypeOptions.length).toBe(2);
    });

    it('should filter letter options by letterCode', () => {
      component.letterSearchControl.setValue('N');
      expect(component.filteredLetterOptions.length).toBe(2);
    });

    it('should filter letter options by letterId', () => {
      component.letterSearchControl.setValue('LTR002');
      expect(component.filteredLetterOptions.length).toBe(1);
      expect(component.filteredLetterOptions[0].letterId).toBe('LTR002');
    });

    it('should filter letter options by letterTitle', () => {
      component.letterSearchControl.setValue('Post-Donation');
      expect(component.filteredLetterOptions.length).toBe(1);
      expect(component.filteredLetterOptions[0].letterId).toBe('LTR002');
    });

    it('should show all letter options when search is empty', () => {
      component.letterSearchControl.setValue('');
      expect(component.filteredLetterOptions.length).toBe(2);
    });

    it('should return no results when search term does not match', () => {
      component.interdictionSearchControl.setValue('NONEXISTENT');
      expect(component.filteredInterdictionOptions.length).toBe(0);
    });
  });

  describe('Description Updates', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should update interdiction description when interCode changes', () => {
      component.form.get('interCode')?.setValue('D01');
      expect(component.interdictionDescription).toBe('Deferred - Travel');
    });

    it('should set interdiction description to "-" when no match found', () => {
      component.form.get('interCode')?.setValue('UNKNOWN');
      expect(component.interdictionDescription).toBe('-');
    });

    it('should update donation description when donationType changes', () => {
      component.form.get('donationType')?.setValue('WB');
      expect(component.donationDescription).toBe('Whole Blood');
    });

    it('should set donation description to "-" when no match found', () => {
      component.form.get('donationType')?.setValue('UNKNOWN');
      expect(component.donationDescription).toBe('-');
    });
  });

  describe('Date Validation Setup', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should update termDate validity when effDate changes', () => {
      const termDateControl = component.form.get('termDate');
      const updateSpy = spyOn(termDateControl!, 'updateValueAndValidity');
      component.form.get('effDate')?.setValue(nextMonth.clone());
      expect(updateSpy).toHaveBeenCalled();
    });

    it('should track lastChangedDateField as effective when effDate changes', () => {
      component.form.get('effDate')?.setValue(nextMonth.clone());
      expect(component['lastChangedDateField']).toBe('effective');
    });

    it('should track lastChangedDateField as termination when termDate changes', () => {
      component.form.get('termDate')?.setValue(nextYear.clone());
      expect(component['lastChangedDateField']).toBe('termination');
    });
  });

  describe('terminationDateFilter', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return true for null date', () => {
      expect(component.terminationDateFilter(null)).toBe(true);
    });

    it('should return true when no effective date is set', () => {
      expect(component.terminationDateFilter(moment())).toBe(true);
    });

    it('should return false when date is before effective date', () => {
      component.form.get('effDate')?.setValue(nextYear.clone());
      const beforeEffDate = nextMonth.clone();
      expect(component.terminationDateFilter(beforeEffDate)).toBe(false);
    });

    it('should return true when date is on or after effective date', () => {
      component.form.get('effDate')?.setValue(nextMonth.clone());
      const afterEffDate = nextYear.clone();
      expect(component.terminationDateFilter(afterEffDate)).toBe(true);
    });

    it('should return true when date equals effective date', () => {
      const date = nextMonth.clone();
      component.form.get('effDate')?.setValue(date.clone());
      expect(component.terminationDateFilter(date.clone())).toBe(true);
    });
  });

  describe('Add Operation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should not call service when form is invalid', () => {
      component.onSave();
      expect(service.create).not.toHaveBeenCalled();
    });

    it('should mark form as touched when save is attempted with invalid form', () => {
      component.onSave();
      expect(component.form.get('interCode')?.touched).toBe(true);
      expect(component.form.get('donationType')?.touched).toBe(true);
    });

    it('should call create service method with correct payload', () => {
      service.create.and.returnValue(of({ success: true, message: 'Created', statusCode: 201 }));

      component.form.patchValue({
        interCode: 'D01',
        donationType: 'WB',
        letterId: 'LTR001',
        effDate: nextMonth.clone(),
        termDate: null
      });
      fixture.detectChanges();

      component.onSave();

      expect(service.create).toHaveBeenCalled();
      const payload = service.create.calls.mostRecent().args[0];
      expect(payload.interCode).toBe('D01');
      expect(payload.donationType).toBe('WB');
      expect(payload.letterId).toBe('LTR001');
    });

    it('should include termDate in payload when set', () => {
      service.create.and.returnValue(of({ success: true, message: 'Created', statusCode: 201 }));

      component.form.patchValue({
        interCode: 'D01',
        donationType: 'WB',
        letterId: 'LTR001',
        effDate: nextMonth.clone(),
        termDate: nextYear.clone()
      });
      fixture.detectChanges();

      component.onSave();

      const payload = service.create.calls.mostRecent().args[0];
      expect(payload.termDate).toBeTruthy();
    });

    it('should set isSaving to true during save', () => {
      const saveSubject = new Subject<any>();
      service.create.and.returnValue(saveSubject.asObservable());

      component.form.patchValue({
        interCode: 'D01',
        donationType: 'WB',
        letterId: 'LTR001',
        effDate: nextMonth.clone()
      });
      fixture.detectChanges();

      component.onSave();
      expect(component.isSaving).toBe(true);

      saveSubject.next({ success: true, message: 'Created', statusCode: 201 });
      saveSubject.complete();
      expect(component.isSaving).toBe(false);
    });

    it('should emit closePanel and saveSuccess on successful add', (done) => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');
      service.create.and.returnValue(of({ success: true, message: 'Created', statusCode: 201 }));

      component.form.patchValue({
        interCode: 'D01',
        donationType: 'WB',
        letterId: 'LTR001',
        effDate: nextMonth.clone()
      });
      fixture.detectChanges();

      component.onSave();

      setTimeout(() => {
        expect(component.saveSuccess.emit).toHaveBeenCalled();
        expect(component.closePanel.emit).toHaveBeenCalled();
        done();
      });
    });

    it('should show success snackbar on successful add', () => {
      service.create.and.returnValue(of({ success: true, message: 'Created', statusCode: 201 }));

      component.form.patchValue({
        interCode: 'D01',
        donationType: 'WB',
        letterId: 'LTR001',
        effDate: nextMonth.clone()
      });
      fixture.detectChanges();

      component.onSave();

      expect(snackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('LTR001'),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    });

    it('should handle 409 conflict error without closing panel', (done) => {
      const errorResponse = {
        error: {
          statusCode: 409,
          errorCode: '18132',
          errorResponse: {
            errorCode: '18132',
            errorMessage: 'Duplicate interdiction code and donation type combination'
          }
        }
      };
      service.create.and.returnValue(throwError(() => errorResponse));
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        interCode: 'D01',
        donationType: 'WB',
        letterId: 'LTR001',
        effDate: nextMonth.clone()
      });
      fixture.detectChanges();

      component.onSave();

      setTimeout(() => {
        expect(component.isSaving).toBe(false);
        expect(component.closePanel.emit).not.toHaveBeenCalled();
        done();
      });
    });

    it('should show error snackbar on 409 conflict error', () => {
      const errorResponse = {
        error: {
          statusCode: 409,
          errorCode: '18132',
          errorResponse: {
            errorCode: '18132',
            errorMessage: 'Duplicate record'
          }
        }
      };
      service.create.and.returnValue(throwError(() => errorResponse));

      component.form.patchValue({
        interCode: 'D01',
        donationType: 'WB',
        letterId: 'LTR001',
        effDate: nextMonth.clone()
      });
      fixture.detectChanges();

      component.onSave();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Duplicate record',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });
  });

  describe('Update Operation', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockRecord;
      fixture.detectChanges();
    });

    it('should call update service method', () => {
      service.update.and.returnValue(of({ success: true, message: 'Updated', statusCode: 200 }));

      component.form.patchValue({ termDate: nextYear.clone() });
      fixture.detectChanges();

      component.onSave();

      expect(service.update).toHaveBeenCalled();
      expect(service.update.calls.mostRecent().args[0]).toBe('D01');
      expect(service.update.calls.mostRecent().args[1]).toBe('WB');
      expect(service.update.calls.mostRecent().args[2]).toBe('LTR001');
    });

    it('should pass correct update payload with original effDate', () => {
      service.update.and.returnValue(of({ success: true, message: 'Updated', statusCode: 200 }));

      component.form.patchValue({ termDate: nextYear.clone() });
      fixture.detectChanges();

      component.onSave();

      const payload = service.update.calls.mostRecent().args[3];
      expect(payload.effDate).toBeTruthy();
      expect(payload.termDate).toBeTruthy();
    });

    it('should show success snackbar with originalLetterId on update', () => {
      service.update.and.returnValue(of({ success: true, message: 'Updated', statusCode: 200 }));

      component.form.patchValue({ termDate: nextYear.clone() });
      fixture.detectChanges();

      component.onSave();

      expect(snackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('LTR001'),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    });

    it('should emit saveSuccess and closePanel on successful update', () => {
      service.update.and.returnValue(of({ success: true, message: 'Updated', statusCode: 200 }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({ termDate: nextYear.clone() });
      fixture.detectChanges();

      component.onSave();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should set isSaving to false after update error', () => {
      service.update.and.returnValue(throwError(() => ({ error: { message: 'Error' } })));

      component.form.patchValue({ termDate: nextYear.clone() });
      fixture.detectChanges();

      component.onSave();

      expect(component.isSaving).toBe(false);
    });

    it('should handle update payload with undefined termDate when cleared', () => {
      service.update.and.returnValue(of({ success: true, message: 'Updated', statusCode: 200 }));

      component.form.patchValue({ termDate: null });
      fixture.detectChanges();

      component.onSave();

      const payload = service.update.calls.mostRecent().args[3];
      expect(payload.termDate).toBeUndefined();
    });
  });

  describe('Save And Create Another', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should reset form after saving', fakeAsync(() => {
      service.create.and.returnValue(of({ success: true, message: 'Created', statusCode: 201 }));
      spyOn(component.saveSuccess, 'emit');

      component.form.patchValue({
        interCode: 'D01',
        donationType: 'WB',
        letterId: 'LTR001',
        effDate: nextMonth.clone()
      });
      fixture.detectChanges();

      component.onSave(true);
      tick();

      expect(service.create).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.form.get('interCode')?.value).toBe('');
      expect(component.form.get('donationType')?.value).toBe('');
      expect(component.form.get('letterId')?.value).toBe('');
    }));

    it('should reset descriptions after createAnother', fakeAsync(() => {
      service.create.and.returnValue(of({ success: true, message: 'Created', statusCode: 201 }));

      component.form.patchValue({
        interCode: 'D01',
        donationType: 'WB',
        letterId: 'LTR001',
        effDate: nextMonth.clone()
      });
      component.interdictionDescription = 'Some Desc';
      component.donationDescription = 'Other Desc';
      fixture.detectChanges();

      component.onSave(true);
      tick();

      expect(component.interdictionDescription).toBe('-');
      expect(component.donationDescription).toBe('-');
    }));

    it('should mark form as untouched and pristine after createAnother', fakeAsync(() => {
      service.create.and.returnValue(of({ success: true, message: 'Created', statusCode: 201 }));

      component.form.patchValue({
        interCode: 'D01',
        donationType: 'WB',
        letterId: 'LTR001',
        effDate: nextMonth.clone()
      });
      fixture.detectChanges();

      component.onSave(true);
      tick();

      expect(component.form.touched).toBe(false);
      expect(component.form.pristine).toBe(true);
    }));

    it('should not emit closePanel when createAnother is true', fakeAsync(() => {
      service.create.and.returnValue(of({ success: true, message: 'Created', statusCode: 201 }));
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        interCode: 'D01',
        donationType: 'WB',
        letterId: 'LTR001',
        effDate: nextMonth.clone()
      });
      fixture.detectChanges();

      component.onSave(true);
      tick();

      expect(component.closePanel.emit).not.toHaveBeenCalled();
    }));

  });

  describe('handleApiError', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();

      component.form.patchValue({
        interCode: 'D01',
        donationType: 'WB',
        letterId: 'LTR001',
        effDate: nextMonth.clone()
      });
      fixture.detectChanges();
    });

    it('should show error message for 409 conflict with errorCode 18132', () => {
      const error = {
        error: {
          statusCode: 409,
          errorResponse: {
            errorCode: '18132',
            errorMessage: 'Duplicate record'
          }
        }
      };
      service.create.and.returnValue(throwError(() => error));
      component.onSave();
      expect(snackBar.open).toHaveBeenCalledWith('Duplicate record', 'DISMISS', jasmine.any(Object));
    });

    it('should show error message for errorCode 18188', () => {
      const error = {
        error: {
          errorCode: '18188',
          errorResponse: {
            errorCode: '18188',
            errorMessage: 'Conflict error 18188'
          }
        }
      };
      service.create.and.returnValue(throwError(() => error));
      component.onSave();
      expect(snackBar.open).toHaveBeenCalledWith('Conflict error 18188', 'DISMISS', jasmine.any(Object));
    });

    it('should show default 409 message when no errorMessage provided', () => {
      const error = {
        error: {
          statusCode: 409
        }
      };
      service.create.and.returnValue(throwError(() => error));
      component.onSave();
      expect(snackBar.open).toHaveBeenCalledWith(
        'A record with this combination already exists.',
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should show error message for 404 not found', () => {
      const error = {
        error: {
          statusCode: 404,
          errorResponse: {
            errorMessage: 'Item not found'
          }
        }
      };
      service.create.and.returnValue(throwError(() => error));
      component.onSave();
      expect(snackBar.open).toHaveBeenCalledWith('Item not found', 'DISMISS', jasmine.any(Object));
    });

    it('should show default 404 message when no errorMessage provided', () => {
      const error = {
        error: {
          statusCode: 404
        }
      };
      service.create.and.returnValue(throwError(() => error));
      component.onSave();
      expect(snackBar.open).toHaveBeenCalledWith('Record not found.', 'DISMISS', jasmine.any(Object));
    });

    it('should show custom error message when errorMessage is available', () => {
      const error = {
        error: {
          statusCode: 500,
          errorResponse: {
            errorMessage: 'Server issue occurred'
          }
        }
      };
      service.create.and.returnValue(throwError(() => error));
      component.onSave();
      expect(snackBar.open).toHaveBeenCalledWith('Server issue occurred', 'DISMISS', jasmine.any(Object));
    });

    it('should show generic error message when no error details provided', () => {
      const error = { error: {} };
      service.create.and.returnValue(throwError(() => error));
      component.onSave();
      expect(snackBar.open).toHaveBeenCalledWith('An error occurred. Please try again.', 'DISMISS', jasmine.any(Object));
    });

    it('should show error message from error.error.message', () => {
      const error = {
        error: {
          message: 'Custom error message from API'
        }
      };
      service.create.and.returnValue(throwError(() => error));
      component.onSave();
      expect(snackBar.open).toHaveBeenCalledWith('Custom error message from API', 'DISMISS', jasmine.any(Object));
    });

    it('should show error message from error.error.errorResponse.error', () => {
      const error = {
        error: {
          statusCode: 500,
          errorResponse: {
            error: 'An internal error occurred'
          }
        }
      };
      service.create.and.returnValue(throwError(() => error));
      component.onSave();
      expect(snackBar.open).toHaveBeenCalledWith('An internal error occurred', 'DISMISS', jasmine.any(Object));
    });
  });

  describe('Dropdown Loading Errors', () => {
    it('should handle interdiction dropdown load error', () => {
      service.getInterdictionsDropdown.and.returnValue(throwError(() => new Error('fail')));
      service.getDonationTypesDropdown.and.returnValue(of(mockDonationTypes));
      service.getLettersDropdown.and.returnValue(of(mockLetters));

      const freshFixture = TestBed.createComponent(AddEditAssociateLetter);
      const freshComponent = freshFixture.componentInstance;
      const freshSnackBar = (freshComponent as any).snackBar;
      if (!jasmine.isSpy(freshSnackBar.open)) {
        spyOn(freshSnackBar, 'open');
      } else {
        freshSnackBar.open.calls.reset();
      }
      freshFixture.detectChanges();

      expect(freshComponent.interdictionOptions).toEqual([]);
      expect(freshComponent.filteredInterdictionOptions).toEqual([]);
      expect(freshSnackBar.open).toHaveBeenCalledWith('Failed to load interdiction codes.', 'Close', jasmine.any(Object));
    });

    it('should handle donation types dropdown load error', () => {
      service.getInterdictionsDropdown.and.returnValue(of(mockInterdictions));
      service.getDonationTypesDropdown.and.returnValue(throwError(() => new Error('fail')));
      service.getLettersDropdown.and.returnValue(of(mockLetters));

      const freshFixture = TestBed.createComponent(AddEditAssociateLetter);
      const freshComponent = freshFixture.componentInstance;
      const freshSnackBar = (freshComponent as any).snackBar;
      if (!jasmine.isSpy(freshSnackBar.open)) {
        spyOn(freshSnackBar, 'open');
      } else {
        freshSnackBar.open.calls.reset();
      }
      freshFixture.detectChanges();

      expect(freshComponent.donationTypeOptions).toEqual([]);
      expect(freshComponent.filteredDonationTypeOptions).toEqual([]);
      expect(freshSnackBar.open).toHaveBeenCalledWith('Failed to load donation types.', 'Close', jasmine.any(Object));
    });

    it('should handle letters dropdown load error', () => {
      service.getInterdictionsDropdown.and.returnValue(of(mockInterdictions));
      service.getDonationTypesDropdown.and.returnValue(of(mockDonationTypes));
      service.getLettersDropdown.and.returnValue(throwError(() => new Error('fail')));

      const freshFixture = TestBed.createComponent(AddEditAssociateLetter);
      const freshComponent = freshFixture.componentInstance;
      const freshSnackBar = (freshComponent as any).snackBar;
      if (!jasmine.isSpy(freshSnackBar.open)) {
        spyOn(freshSnackBar, 'open');
      } else {
        freshSnackBar.open.calls.reset();
      }
      freshFixture.detectChanges();

      expect(freshComponent.letterOptions).toEqual([]);
      expect(freshComponent.filteredLetterOptions).toEqual([]);
      expect(freshComponent.isLoadingDropdowns).toBe(false);
      expect(freshSnackBar.open).toHaveBeenCalledWith('Failed to load letter codes.', 'Close', jasmine.any(Object));
    });
  });

  describe('onEffectiveDateBlur', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should mark effDate control as touched', fakeAsync(() => {
      component.onEffectiveDateBlur();
      tick(1);
      expect(component.form.get('effDate')?.touched).toBe(true);
    }));

    it('should handle blur when no ViewChild input element exists', fakeAsync(() => {
      component.effectiveDateInput = undefined;
      expect(() => {
        component.onEffectiveDateBlur();
        tick(1);
      }).not.toThrow();
    }));
  });

  describe('onTerminationDateBlur', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should mark termDate control as touched', fakeAsync(() => {
      component.onTerminationDateBlur();
      tick(1);
      expect(component.form.get('termDate')?.touched).toBe(true);
    }));

    it('should handle blur when no ViewChild input element exists', fakeAsync(() => {
      component.terminationDateInput = undefined;
      expect(() => {
        component.onTerminationDateBlur();
        tick(1);
      }).not.toThrow();
    }));
  });

  describe('Error Messages', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return error message for interCode required', () => {
      const control = component.form.get('interCode');
      control?.setValue('');
      control?.markAsTouched();
      expect(component.getInterdictionCodeError()).toBe('Interdiction Code is required');
    });

    it('should return error message for donationType required', () => {
      const control = component.form.get('donationType');
      control?.setValue('');
      control?.markAsTouched();
      expect(component.getDonationTypeError()).toBe('Donation Type is required');
    });

    it('should return error message for letterId required', () => {
      const control = component.form.get('letterId');
      control?.setValue('');
      control?.markAsTouched();
      expect(component.getLetterIdError()).toBe('Letter Code is required');
    });

    it('should return error message for effectiveDate required', () => {
      const control = component.form.get('effDate');
      control?.setValue(null);
      control?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    });

    it('should return empty string when fields not touched', () => {
      expect(component.getInterdictionCodeError()).toBe('');
      expect(component.getDonationTypeError()).toBe('');
      expect(component.getLetterIdError()).toBe('');
    });

    it('should return empty string for interCode when control has value', () => {
      const control = component.form.get('interCode');
      control?.setValue('D01');
      control?.markAsTouched();
      expect(component.getInterdictionCodeError()).toBe('');
    });

    it('should return empty string for donationType when control has value', () => {
      const control = component.form.get('donationType');
      control?.setValue('WB');
      control?.markAsTouched();
      expect(component.getDonationTypeError()).toBe('');
    });

    it('should return empty string for letterId when control has value', () => {
      const control = component.form.get('letterId');
      control?.setValue('LTR001');
      control?.markAsTouched();
      expect(component.getLetterIdError()).toBe('');
    });

    it('should return empty string for getEffectiveDateError when no control', () => {
      spyOn(component.form, 'get').and.returnValue(null);
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return empty string for getTerminationDateError when no control', () => {
      spyOn(component.form, 'get').and.returnValue(null);
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return termination date error from DateFieldValidationUtility', () => {
      const control = component.form.get('termDate');
      control?.markAsTouched();
      control?.setErrors({ invalidDate: true });
      const error = component.getTerminationDateError();
      expect(error).toBeTruthy();
    });
  });

  describe('getEffectiveDateError with input value', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return invalid date error when input has value but control does not', () => {
      component.effectiveDateInput = {
        nativeElement: { value: 'invalid-date' }
      } as any;
      const control = component.form.get('effDate');
      control?.setValue(null);
      control?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective date is invalid');
    });

    it('should return required error when input is empty and control is null', () => {
      component.effectiveDateInput = {
        nativeElement: { value: '' }
      } as any;
      const control = component.form.get('effDate');
      control?.setValue(null);
      control?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    });
  });

  describe('getTerminationDateError with input value', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return invalid date error when input has value but control does not', () => {
      component.terminationDateInput = {
        nativeElement: { value: 'invalid-date' }
      } as any;
      const control = component.form.get('termDate');
      control?.setValue(null);
      control?.markAsTouched();
      expect(component.getTerminationDateError()).toBe('Termination date is invalid');
    });
  });

  describe('hasFormChanged (edit mode)', () => {
    it('should return false when termination date has not changed', () => {
      component.mode = 'edit';
      component.data = mockRecord;
      fixture.detectChanges();
      // No changes made to termDate
      expect(component.isFormValid).toBe(false);
    });

    it('should return true when termination date has changed to a different value', () => {
      component.mode = 'edit';
      component.data = mockRecord;
      fixture.detectChanges();
      component.form.patchValue({ termDate: nextYear.clone() });
      expect(component.isFormValid).toBe(true);
    });

    it('should return true when termination date is cleared', () => {
      component.mode = 'edit';
      component.data = mockRecord;
      fixture.detectChanges();
      component.form.patchValue({ termDate: null });
      // initialTermDate was set from mockRecord.termDate, clearing it is a change
      expect(component['initialTermDate']).not.toBeNull();
      expect(component.isFormValid).toBe(true);
    });

    it('should always return true for add mode regardless of form changes', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.form.patchValue({
        interCode: 'D01',
        donationType: 'WB',
        letterId: 'LTR001',
        effDate: nextMonth.clone()
      });
      expect(component.isFormValid).toBe(true);
    });
  });

  describe('formatDateForDisplay', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return dash for null date', () => {
      expect(component['formatDateForDisplay'](null)).toBe('-');
    });

    it('should return dash for undefined date', () => {
      expect(component['formatDateForDisplay'](undefined)).toBe('-');
    });

    it('should format valid date string as DD-MMM-YYYY uppercase', () => {
      const result = component['formatDateForDisplay']('2025-01-15T00:00:00');
      expect(result).toBe('15-JAN-2025');
    });
  });

  describe('Constant values', () => {
    it('should have selectPanelLoadingValue', () => {
      expect(component.selectPanelLoadingValue).toBe('__PANEL_LOADING__');
    });

    it('should have selectPanelEmptyValue', () => {
      expect(component.selectPanelEmptyValue).toBe('__PANEL_EMPTY__');
    });
  });

  describe('Edit mode initializeForm validators', () => {
    it('should not include effectiveDateNotPastValidator in edit mode', () => {
      component.mode = 'edit';
      component.data = mockRecord;
      fixture.detectChanges();

      // In edit mode, effDate is disabled and has no effectiveDatePast validator
      const control = component.form.get('effDate');
      // Set a past date - should not trigger effectiveDatePast error since validator not present in edit mode
      control?.enable();
      control?.setValue(moment('2020-01-01'));
      expect(control?.hasError('effectiveDatePast')).toBe(false);
    });
  });

  describe('validateEffectiveDateInput', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should set invalidDate error when input has value but control has no value', fakeAsync(() => {
      component.effectiveDateInput = {
        nativeElement: { value: 'bad-date' }
      } as any;
      component.form.get('effDate')?.setValue(null);

      // Trigger via effDate valueChanges in add mode
      component['validateEffectiveDateInput']();

      expect(component.form.get('effDate')?.hasError('invalidDate')).toBe(true);
    }));

    it('should clear invalidDate error when input is empty', fakeAsync(() => {
      component.effectiveDateInput = {
        nativeElement: { value: '' }
      } as any;
      const control = component.form.get('effDate');
      control?.setErrors({ invalidDate: true });

      component['validateEffectiveDateInput']();

      expect(control?.hasError('invalidDate')).toBe(false);
    }));

    it('should clear invalidDate error when control has a valid value', fakeAsync(() => {
      component.effectiveDateInput = {
        nativeElement: { value: '01-JAN-2030' }
      } as any;
      const control = component.form.get('effDate');
      control?.setValue(moment('2030-01-01'));
      control?.setErrors({ invalidDate: true });

      component['validateEffectiveDateInput']();

      expect(control?.hasError('invalidDate')).toBe(false);
    }));

    it('should preserve other errors when clearing invalidDate', fakeAsync(() => {
      component.effectiveDateInput = {
        nativeElement: { value: '' }
      } as any;
      const control = component.form.get('effDate');
      control?.setErrors({ invalidDate: true, required: true });

      component['validateEffectiveDateInput']();

      expect(control?.hasError('invalidDate')).toBe(false);
      expect(control?.hasError('required')).toBe(true);
    }));
  });

  describe('validateTerminationDateInput', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should set invalidDate error when input has value but control has no value', () => {
      component.terminationDateInput = {
        nativeElement: { value: 'bad-date' }
      } as any;
      component.form.get('termDate')?.setValue(null);

      component['validateTerminationDateInput']();

      expect(component.form.get('termDate')?.hasError('invalidDate')).toBe(true);
    });

    it('should clear invalidDate error when input is empty', () => {
      component.terminationDateInput = {
        nativeElement: { value: '' }
      } as any;
      const control = component.form.get('termDate');
      control?.setErrors({ invalidDate: true });

      component['validateTerminationDateInput']();

      expect(control?.hasError('invalidDate')).toBe(false);
    });

    it('should clear invalidDate error when control has a valid value', () => {
      component.terminationDateInput = {
        nativeElement: { value: '01-JAN-2030' }
      } as any;
      const control = component.form.get('termDate');
      control?.setValue(moment('2030-01-01'));
      control?.setErrors({ invalidDate: true });

      component['validateTerminationDateInput']();

      expect(control?.hasError('invalidDate')).toBe(false);
    });

    it('should preserve other errors when clearing invalidDate', () => {
      component.terminationDateInput = {
        nativeElement: { value: '' }
      } as any;
      const control = component.form.get('termDate');
      control?.setErrors({ invalidDate: true, someOtherError: true });

      component['validateTerminationDateInput']();

      expect(control?.hasError('invalidDate')).toBe(false);
      expect(control?.hasError('someOtherError')).toBe(true);
    });
  });

  describe('effDateErrorMatcher and termDateErrorMatcher', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should have effDateErrorMatcher defined', () => {
      expect(component.effDateErrorMatcher).toBeTruthy();
      expect(component.effDateErrorMatcher.isErrorState).toBeDefined();
    });

    it('should have termDateErrorMatcher defined', () => {
      expect(component.termDateErrorMatcher).toBeTruthy();
      expect(component.termDateErrorMatcher.isErrorState).toBeDefined();
    });
  });

  describe('minDate', () => {
    it('should have minDate set', () => {
      expect(component.minDate).toBeTruthy();
    });
  });
});
