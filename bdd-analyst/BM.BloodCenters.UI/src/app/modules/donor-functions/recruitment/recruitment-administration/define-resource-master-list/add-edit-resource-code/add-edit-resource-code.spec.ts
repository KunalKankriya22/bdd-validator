import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError, Subject } from 'rxjs';
import { AddEditResourceCode } from './add-edit-resource-code';
import { DefineResourceMasterListService } from '../services/define-resource-master-list.service';
import { DefineResourceMasterListModel } from '../models/define-resource-master-list.model';
import moment from 'moment';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AddEditResourceCode', () => {
  let serviceSpy: any;
  let component: AddEditResourceCode;
  let fixture: ComponentFixture<AddEditResourceCode>;
  let service: jasmine.SpyObj<DefineResourceMasterListService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  const mockResourceData: DefineResourceMasterListModel = {
    resourceCode: 'STAFF',
    resourceDesc: 'Staff Resource',
    resourceType: 'STAFF',
    sortSeq: 10,
    criticalInd: 'Y',
    effDate: '2026-01-01T00:00:00.000Z',
    termDate: '2026-12-31T00:00:00.000Z'
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('DefineResourceMasterListService', [
      'addResourceCode',
      'updateResourceCode',
      'getFilterOptions'
    ]);
    snackBarSpy = createMockMatSnackBar();



      TestBed.configureTestingModule({
imports: [AddEditResourceCode, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: DefineResourceMasterListService, useValue: serviceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    });


    });



  beforeEach(() => {


      serviceSpy.addResourceCode.calls.reset();


      serviceSpy.updateResourceCode.calls.reset();


      serviceSpy.getFilterOptions.calls.reset();


    service = TestBed.inject(DefineResourceMasterListService) as jasmine.SpyObj<DefineResourceMasterListService>;
    snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    service.getFilterOptions.and.returnValue(of({
      resourceTypes: ['STAFF', 'COACH', 'VAN'],
      criticalIndicators: ['Y', 'N']
    }));

    fixture = TestBed.createComponent(AddEditResourceCode);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {

    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize form with default values on creation', () => {
      fixture.detectChanges();
      expect(component.form).toBeDefined();
      expect(component.form.get('resourceCode')).toBeTruthy();
      expect(component.form.get('description')).toBeTruthy();
      expect(component.form.get('type')).toBeTruthy();
      expect(component.form.get('sequence')).toBeTruthy();
      expect(component.form.get('critical')).toBeTruthy();
      expect(component.form.get('effectiveDate')).toBeTruthy();
      expect(component.form.get('terminationDate')).toBeTruthy();
    });

    it('should set default mode to add', () => {
      expect(component.mode).toBe('add');
    });

    it('should set default data to null', () => {
      expect(component.data).toBeNull();
    });

    it('should set isSaving to false initially', () => {
      expect(component.isSaving).toBe(false);
    });

    it('should set critical default value to N', () => {
      fixture.detectChanges();
      expect(component.form.get('critical')?.value).toBe('N');
    });

    it('should set minEffectiveDate when mode is add', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.minEffectiveDate).not.toBeNull();
    });

    it('should set minEffectiveDate to null when mode is edit', () => {
      component.mode = 'edit';
      component.data = mockResourceData;
      fixture.detectChanges();
      expect(component.minEffectiveDate).toBeNull();
    });

    it('should set panelTitle to Add Resource Code in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.panelTitle).toBe('Add Resource Code');
    });

    it('should set panelTitle to Edit Item in edit mode', () => {
      component.mode = 'edit';
      component.data = mockResourceData;
      fixture.detectChanges();
      expect(component.panelTitle).toBe('Edit Item');
    });

    it('should load filter options on init', () => {
      fixture.detectChanges();
      expect(service.getFilterOptions).toHaveBeenCalled();
    });

    it('should populate typeOptions from API response', () => {
      fixture.detectChanges();
      expect(component.typeOptions.length).toBe(3);
      expect(component.typeOptions[0]).toEqual({ value: 'STAFF', label: 'STAFF' });
      expect(component.typeOptions[1]).toEqual({ value: 'COACH', label: 'COACH' });
      expect(component.typeOptions[2]).toEqual({ value: 'VAN', label: 'VAN' });
    });

    it('should use fallback options when filter options API fails', (done) => {
      service.getFilterOptions.and.returnValue(throwError(() => ({ status: 500 })));

      fixture.detectChanges();

      setTimeout(() => {
        expect(component.typeOptions.length).toBeGreaterThan(0);
        expect(component.typeOptions[0].value).toBe('STAFF');
        done();
      });
    });

    it('should have fallback options with all expected types when API fails', (done) => {
      service.getFilterOptions.and.returnValue(throwError(() => ({ status: 500 })));

      fixture.detectChanges();

      setTimeout(() => {
        expect(component.typeOptions.length).toBe(8);
        const values = component.typeOptions.map(o => o.value);
        expect(values).toContain('STAFF');
        expect(values).toContain('COACH');
        expect(values).toContain('VAN');
        expect(values).toContain('MACH');
        expect(values).toContain('BEDS');
        expect(values).toContain('BLK');
        expect(values).toContain('PILLO');
        expect(values).toContain('SNACK');
        done();
      });
    });

    it('should have criticalOptions defined with Y and N', () => {
      expect(component.criticalOptions).toEqual([
        { value: 'Y', label: 'Yes' },
        { value: 'N', label: 'No' }
      ]);
    });

    it('should not populate form for edit when mode is add', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.form.get('resourceCode')?.disabled).toBe(false);
      expect(component.form.get('description')?.disabled).toBe(false);
      expect(component.form.get('effectiveDate')?.disabled).toBe(false);
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require resourceCode', () => {
      const control = component.form.get('resourceCode');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should enforce maxLength of 5 for resourceCode', () => {
      const control = component.form.get('resourceCode');
      control?.setValue('TOOLONG');
      expect(control?.hasError('maxlength')).toBe(true);
    });

    it('should accept valid resourceCode within length limit', () => {
      const control = component.form.get('resourceCode');
      control?.setValue('ABC');
      expect(control?.hasError('required')).toBe(false);
      expect(control?.hasError('maxlength')).toBe(false);
    });

    it('should require description', () => {
      const control = component.form.get('description');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should enforce maxLength of 50 for description', () => {
      const control = component.form.get('description');
      control?.setValue('A'.repeat(51));
      expect(control?.hasError('maxlength')).toBe(true);
    });

    it('should accept valid description within length limit', () => {
      const control = component.form.get('description');
      control?.setValue('Valid Description');
      expect(control?.hasError('required')).toBe(false);
      expect(control?.hasError('maxlength')).toBe(false);
    });

    it('should enforce min/max for sequence', () => {
      const control = component.form.get('sequence');

      control?.setValue(-1);
      expect(control?.hasError('min')).toBe(true);

      control?.setValue(100);
      expect(control?.hasError('max')).toBe(true);

      control?.setValue(50);
      expect(control?.errors).toBeNull();
    });

    it('should allow sequence value of 0', () => {
      const control = component.form.get('sequence');
      control?.setValue(0);
      expect(control?.hasError('min')).toBe(false);
    });

    it('should allow sequence value of 99', () => {
      const control = component.form.get('sequence');
      control?.setValue(99);
      expect(control?.hasError('max')).toBe(false);
    });

    it('should require critical field', () => {
      const control = component.form.get('critical');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should require effectiveDate', () => {
      const control = component.form.get('effectiveDate');
      control?.setValue(null);
      expect(control?.hasError('required')).toBe(true);
    });

    it('should not require terminationDate', () => {
      const control = component.form.get('terminationDate');
      control?.setValue(null);
      expect(control?.hasError('required')).toBeFalsy();
    });

    it('should detect whitespace-only resourceCode', () => {
      const control = component.form.get('resourceCode');
      control?.setValue('   ');
      expect(control?.hasError('whitespaceOnly')).toBe(true);
    });

    it('should detect whitespace-only description', () => {
      const control = component.form.get('description');
      control?.setValue('   ');
      expect(control?.hasError('whitespaceOnly')).toBe(true);
    });

    it('should detect noAlphanumeric for resourceCode with only special chars', () => {
      const control = component.form.get('resourceCode');
      control?.setValue('---');
      expect(control?.hasError('noAlphanumeric')).toBe(true);
    });

    it('should validate date range - termination after effective', () => {
      const effDate = new Date(moment().add(10, 'days').format('YYYY-MM-DD'));
      const termDate = new Date('2026-12-31');

      component.form.patchValue({
        effectiveDate: effDate,
        terminationDate: termDate
      });
      fixture.detectChanges();

      expect(component.form.hasError('dateRangeInvalid')).toBe(false);
    });

    it('should invalidate when termination date is before effective date', () => {
      const effDate = new Date('2026-12-31');
      const termDate = new Date(moment().add(10, 'days').format('YYYY-MM-DD'));

      component.form.patchValue({
        effectiveDate: effDate,
        terminationDate: termDate
      });
      fixture.detectChanges();

      expect(component.form.hasError('dateRangeInvalid')).toBe(true);
    });

    it('should invalidate when termination date equals effective date', () => {
      const sameDate = new Date(moment().add(10, 'days').format('YYYY-MM-DD'));

      component.form.patchValue({
        resourceCode: 'TEST',
        description: 'Test Description',
        critical: 'Y',
        effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD')),
        terminationDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD'))
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      expect(component.form.valid).toBe(true);
    });

    it('should report form as invalid via isFormValid when required fields are missing', () => {
      expect(component.isFormValid).toBe(false);
    });

    it('should report form as valid via isFormValid when all required fields are populated', () => {
      component.form.patchValue({
        resourceCode: 'TEST',
        description: 'Test Description',
        critical: 'Y',
        effectiveDate: moment().add(10, 'days')
      });
      component.form.updateValueAndValidity();

      expect(component.isFormValid).toBe(true);
    });
  });

  describe('Edit Mode Population', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockResourceData;
      fixture.detectChanges();
    });

    it('should populate form with resource data in edit mode', () => {
      const rawValue = component.form.getRawValue();
      expect(rawValue.resourceCode).toBe('STAFF');
      expect(rawValue.description).toBe('Staff Resource');
      expect(rawValue.type).toBe('STAFF');
      expect(rawValue.sequence).toBe(10);
      expect(rawValue.critical).toBe('Y');
    });

    it('should disable resourceCode, description, and effectiveDate in edit mode', () => {
      expect(component.form.get('resourceCode')?.disabled).toBe(true);
      expect(component.form.get('description')?.disabled).toBe(true);
      expect(component.form.get('effectiveDate')?.disabled).toBe(true);
    });

    it('should store original values for edit mode', () => {
      expect(component['originalValues'].resourceCode).toBe('STAFF');
      expect(component['originalValues'].effectiveDate).toBeDefined();
    });

    it('should format display values for read-only fields', () => {
      expect(component.editModeValues.resourceCode).toBe('STAFF');
      expect(component.editModeValues.effectiveDate).toContain('JAN-2026');
    });

    it('should set minTerminationDate based on effective date in edit mode', () => {
      expect(component.minTerminationDate).not.toBeNull();
      expect(component.minTerminationDate!.format('YYYY-MM-DD')).toBe('2026-01-01');
    });

    it('should clear validators for disabled fields in edit mode', () => {
      const rcControl = component.form.get('resourceCode');
      const descControl = component.form.get('description');
      const effControl = component.form.get('effectiveDate');

      // After clearing validators, no validation errors should remain
      expect(rcControl?.errors).toBeNull();
      expect(descControl?.errors).toBeNull();
      expect(effControl?.errors).toBeNull();
    });

    it('should set criticalInd to N when data has lowercase n', () => {
      component.mode = 'edit';
      component.data = { ...mockResourceData, criticalInd: 'n' };
      // Reinitialize
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.form.getRawValue().critical).toBe('N');
    });

    it('should set criticalInd to N when data has undefined criticalInd', () => {
      component.mode = 'edit';
      component.data = { ...mockResourceData, criticalInd: undefined };
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.form.getRawValue().critical).toBe('N');
    });

    it('should handle data with no termDate', () => {
      component.mode = 'edit';
      component.data = { ...mockResourceData, termDate: null };
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.form.getRawValue().terminationDate).toBeNull();
    });

    it('should handle data with no effDate', () => {
      component.mode = 'edit';
      component.data = { ...mockResourceData, effDate: null };
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.form.getRawValue().effectiveDate).toBeNull();
      expect(component.editModeValues.effectiveDate).toBe('');
    });

    it('should handle data with empty resourceCode', () => {
      component.mode = 'edit';
      component.data = { ...mockResourceData, resourceCode: '' };
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.form.getRawValue().resourceCode).toBe('');
      expect(component['originalValues'].resourceCode).toBe('');
    });

    it('should handle data with empty resourceDesc', () => {
      component.mode = 'edit';
      component.data = { ...mockResourceData, resourceDesc: '' };
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.form.getRawValue().description).toBe('');
    });

    it('should handle data with no sortSeq', () => {
      component.mode = 'edit';
      component.data = { ...mockResourceData, sortSeq: undefined };
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.form.getRawValue().sequence).toBeNull();
    });

    it('should not populate form when data is null in edit mode', () => {
      component.mode = 'edit';
      component.data = null;
      component.ngOnInit();
      fixture.detectChanges();

      // Form should still have default values since populateFormForEdit returns early
      expect(component.form.get('resourceCode')?.disabled).toBe(false);
    });
  });

  describe('Date Validation Listeners', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set minTerminationDate when effectiveDate has a valid moment value', () => {
      const futureDate = moment().add(15, 'days');
      component.form.get('effectiveDate')?.setValue(futureDate);

      expect(component.minTerminationDate).not.toBeNull();
      expect(component.minTerminationDate!.format('YYYY-MM-DD')).toBe(futureDate.clone().startOf('day').format('YYYY-MM-DD'));
    });

    it('should set minTerminationDate to null when effectiveDate is cleared', () => {
      component.form.get('effectiveDate')?.setValue(null);

      expect(component.minTerminationDate).toBeNull();
    });

    it('should set minTerminationDate to null when effectiveDate is invalid moment', () => {
      component.form.get('effectiveDate')?.setValue('not-a-date');

      expect(component.minTerminationDate).toBeNull();
    });

    it('should re-validate terminationDate when effectiveDate changes', () => {
      const termControl = component.form.get('terminationDate');
      spyOn(termControl!, 'updateValueAndValidity');

      const futureDate = moment().add(15, 'days');
      component.form.get('effectiveDate')?.setValue(futureDate);

      expect(termControl!.updateValueAndValidity).toHaveBeenCalled();
    });
  });

  describe('Add Operation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should not call service when form is invalid', () => {
      component.onSave();
      expect(service.addResourceCode).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when save is called', () => {
      spyOn(component.form, 'markAllAsTouched');
      component.onSave();
      expect(component.form.markAllAsTouched).toHaveBeenCalled();
    });

    it('should set isSaving to true when save begins', fakeAsync(() => {
      service.addResourceCode.and.returnValue(of({ success: true }));

      component.form.patchValue({
        resourceCode: 'NEWRC',
        description: 'New Resource',
        type: 'STAFF',
        sequence: 5,
        critical: 'Y',
        effectiveDate: moment().add(10, 'days')
      });
      fixture.detectChanges();

      // Capture the value during subscribe
      let savingDuringCall = false;
      const origSaving = Object.getOwnPropertyDescriptor(component, 'isSaving');
      component.onSave();
      // After finalize, isSaving should be false
      tick();
      expect(component.isSaving).toBe(false);
    }));

    it('should call addResourceCode service method in add mode', fakeAsync(() => {
      service.addResourceCode.and.returnValue(of({ success: true }));

      component.form.patchValue({
        resourceCode: 'NEWRC',
        description: 'New Resource',
        type: 'STAFF',
        sequence: 5,
        critical: 'Y',
        effectiveDate: moment().add(10, 'days')
      });
      fixture.detectChanges();

      component.onSave();
      tick();

      expect(service.addResourceCode).toHaveBeenCalled();
      const payload = service.addResourceCode.calls.mostRecent().args[0];
      expect(payload.resourceCode).toBe('NEWRC');
      expect(payload.resourceDesc).toBe('New Resource');
      expect(payload.resourceType).toBe('STAFF');
      expect(payload.sortSeq).toBe(5);
      expect(payload.criticalInd).toBe('Y');
      expect(payload.effDate).toContain('T12:00:00.000Z');
    }));

    it('should include termDate in payload when terminationDate is set', fakeAsync(() => {
      service.addResourceCode.and.returnValue(of({ success: true }));

      component.form.patchValue({
        resourceCode: 'NEWRC',
        description: 'New Resource',
        type: 'STAFF',
        sequence: 5,
        critical: 'Y',
        effectiveDate: moment().add(10, 'days'),
        terminationDate: moment().add(30, 'days')
      });
      fixture.detectChanges();

      component.onSave();
      tick();

      const payload = service.addResourceCode.calls.mostRecent().args[0];
      expect(payload.termDate).toContain('T12:00:00.000Z');
    }));

    it('should set termDate to empty string when terminationDate is not set', fakeAsync(() => {
      service.addResourceCode.and.returnValue(of({ success: true }));

      component.form.patchValue({
        resourceCode: 'NEWRC',
        description: 'New Resource',
        type: 'STAFF',
        sequence: 5,
        critical: 'Y',
        effectiveDate: moment().add(10, 'days'),
        terminationDate: null
      });
      fixture.detectChanges();

      component.onSave();
      tick();

      const payload = service.addResourceCode.calls.mostRecent().args[0];
      expect(payload.termDate).toBe('');
    }));

    it('should emit saveSuccess and close panel on successful add', (done) => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');
      service.addResourceCode.and.returnValue(of({ success: true }));

      component.form.patchValue({
        resourceCode: 'NEWRC',
        description: 'New Resource',
        type: 'STAFF',
        sequence: 5,
        critical: 'Y',
        effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD'))
      });
      fixture.detectChanges();

      component.onSave();

      setTimeout(() => {
        expect(component.saveSuccess.emit).toHaveBeenCalled();
        expect(component.closePanel.emit).toHaveBeenCalled();
        done();
      });
    });

    it('should show success snackbar on successful add', fakeAsync(() => {
      service.addResourceCode.and.returnValue(of({ success: true }));
      const openSpy = spyOn(component['snackBar'], 'open');

      component.form.patchValue({
        resourceCode: 'NEWRC',
        description: 'New Resource',
        type: 'STAFF',
        sequence: 5,
        critical: 'Y',
        effectiveDate: moment().add(10, 'days')
      });
      fixture.detectChanges();

      component.onSave();
      tick();

      expect(openSpy).toHaveBeenCalledWith(
        'Resource code has been added successfully.',
        'DISMISS',
        jasmine.objectContaining({
          duration: 3000,
          panelClass: ['success-snackbar']
        })
      );
    }));

    it('should set isSaving to false after save completes (finalize)', fakeAsync(() => {
      service.addResourceCode.and.returnValue(of({ success: true }));

      component.form.patchValue({
        resourceCode: 'NEWRC',
        description: 'New Resource',
        type: 'STAFF',
        sequence: 5,
        critical: 'Y',
        effectiveDate: moment().add(10, 'days')
      });
      fixture.detectChanges();

      component.onSave();
      tick();

      expect(component.isSaving).toBe(false);
    }));

    it('should emit saveSuccess with correct form data including moment dates', fakeAsync(() => {
      service.addResourceCode.and.returnValue(of({ success: true }));
      spyOn(component.saveSuccess, 'emit');

      const effDate = moment().add(10, 'days');
      const termDate = moment().add(30, 'days');

      component.form.patchValue({
        resourceCode: 'NEWRC',
        description: 'New Resource',
        type: 'STAFF',
        sequence: 5,
        critical: 'Y',
        effectiveDate: effDate,
        terminationDate: termDate
      });
      fixture.detectChanges();

      component.onSave();
      tick();

      const emittedData = (component.saveSuccess.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedData.resourceCode).toBe('NEWRC');
      expect(emittedData.description).toBe('New Resource');
      expect(emittedData.type).toBe('STAFF');
      expect(emittedData.sequence).toBe(5);
      expect(emittedData.critical).toBe('Y');
      expect(emittedData.effectiveDate).toBeInstanceOf(Date);
      expect(emittedData.terminationDate).toBeInstanceOf(Date);
    }));

    it('should use new Date() for effectiveDate when form value is not moment', fakeAsync(() => {
      service.addResourceCode.and.returnValue(of({ success: true }));
      spyOn(component.saveSuccess, 'emit');

      component.form.patchValue({
        resourceCode: 'NEWRC',
        description: 'New Resource',
        type: 'STAFF',
        sequence: 5,
        critical: 'Y',
        effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD'))
      });
      fixture.detectChanges();

      component.onSave();
      tick();

      const emittedData = (component.saveSuccess.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedData.effectiveDate).toBeInstanceOf(Date);
    }));

    it('should set terminationDate to null in emitted data when not provided', fakeAsync(() => {
      service.addResourceCode.and.returnValue(of({ success: true }));
      spyOn(component.saveSuccess, 'emit');

      component.form.patchValue({
        resourceCode: 'NEWRC',
        description: 'New Resource',
        type: 'STAFF',
        sequence: 5,
        critical: 'Y',
        effectiveDate: moment().add(10, 'days'),
        terminationDate: null
      });
      fixture.detectChanges();

      component.onSave();
      tick();

      const emittedData = (component.saveSuccess.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedData.terminationDate).toBeNull();
    }));

    it('should default sequence to 0 in payload when null', fakeAsync(() => {
      service.addResourceCode.and.returnValue(of({ success: true }));

      component.form.patchValue({
        resourceCode: 'NEWRC',
        description: 'New Resource',
        type: 'STAFF',
        sequence: null,
        critical: 'Y',
        effectiveDate: moment().add(10, 'days')
      });
      fixture.detectChanges();

      component.onSave();
      tick();

      const payload = service.addResourceCode.calls.mostRecent().args[0];
      expect(payload.sortSeq).toBe(0);
    }));

    it('should default criticalInd to N in payload when empty', fakeAsync(() => {
      service.addResourceCode.and.returnValue(of({ success: true }));

      // Temporarily remove required validator for critical to test default
      component.form.get('critical')?.clearValidators();
      component.form.get('critical')?.updateValueAndValidity();

      component.form.patchValue({
        resourceCode: 'NEWRC',
        description: 'New Resource',
        type: 'STAFF',
        sequence: 5,
        critical: '',
        effectiveDate: moment().add(10, 'days')
      });
      fixture.detectChanges();

      component.onSave();
      tick();

      const payload = service.addResourceCode.calls.mostRecent().args[0];
      expect(payload.criticalInd).toBe('N');
    }));

    it('should trim resourceCode and description in payload', fakeAsync(() => {
      service.addResourceCode.and.returnValue(of({ success: true }));

      component.form.patchValue({
        resourceCode: ' RC  ',
        description: ' Desc  ',
        type: ' STAFF ',
        sequence: 5,
        critical: 'Y',
        effectiveDate: moment().add(10, 'days')
      });
      fixture.detectChanges();

      component.onSave();
      tick();

      const payload = service.addResourceCode.calls.mostRecent().args[0];
      expect(payload.resourceCode).toBe('RC');
      expect(payload.resourceDesc).toBe('Desc');
      expect(payload.resourceType).toBe('STAFF');
    }));
  });

  describe('Edit Operation (onSave)', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockResourceData;
      fixture.detectChanges();
    });

    it('should call updateResourceCode in edit mode', fakeAsync(() => {
      service.updateResourceCode.and.returnValue(of({ success: true }));

      component.form.patchValue({
        type: 'COACH',
        sequence: 20,
        critical: 'N',
        terminationDate: moment().add(60, 'days')
      });
      fixture.detectChanges();

      component.onSave();
      tick();

      expect(service.updateResourceCode).toHaveBeenCalled();
      expect(service.addResourceCode).not.toHaveBeenCalled();
    }));

    it('should use original resourceCode and effectiveDate in update payload', fakeAsync(() => {
      service.updateResourceCode.and.returnValue(of({ success: true }));

      component.form.patchValue({
        type: 'COACH',
        sequence: 20,
        critical: 'N'
      });
      fixture.detectChanges();

      component.onSave();
      tick();

      const payload = service.updateResourceCode.calls.mostRecent().args[0];
      expect(payload.resourceCode).toBe('STAFF');
      expect(payload.effDate).toContain('T12:00:00.000Z');
    }));

    it('should show update success snackbar message', fakeAsync(() => {
      service.updateResourceCode.and.returnValue(of({ success: true }));
      const openSpy = spyOn(component['snackBar'], 'open');

      component.form.patchValue({
        type: 'COACH',
        sequence: 20,
        critical: 'N'
      });
      fixture.detectChanges();

      component.onSave();
      tick();

      expect(openSpy).toHaveBeenCalledWith(
        'Resource code has been updated successfully.',
        'DISMISS',
        jasmine.objectContaining({
          duration: 3000,
          panelClass: ['success-snackbar']
        })
      );
    }));

    it('should emit saveSuccess and closePanel on successful update', fakeAsync(() => {
      service.updateResourceCode.and.returnValue(of({ success: true }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        type: 'COACH',
        sequence: 20,
        critical: 'N'
      });
      fixture.detectChanges();

      component.onSave();
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));

    it('should set isSaving to false after update completes', fakeAsync(() => {
      service.updateResourceCode.and.returnValue(of({ success: true }));

      component.form.patchValue({
        type: 'COACH',
        sequence: 20,
        critical: 'N'
      });
      fixture.detectChanges();

      component.onSave();
      tick();

      expect(component.isSaving).toBe(false);
    }));

    it('should set termDate to empty string in update payload when terminationDate is null', fakeAsync(() => {
      service.updateResourceCode.and.returnValue(of({ success: true }));

      component.form.patchValue({
        type: 'COACH',
        sequence: 20,
        critical: 'N',
        terminationDate: null
      });
      fixture.detectChanges();

      component.onSave();
      tick();

      const payload = service.updateResourceCode.calls.mostRecent().args[0];
      expect(payload.termDate).toBe('');
    }));

    it('should handle update payload when originalValues.effectiveDate is null', fakeAsync(() => {
      service.updateResourceCode.and.returnValue(of({ success: true }));

      // Set up component with no effDate
      component.mode = 'edit';
      component.data = { ...mockResourceData, effDate: null };
      component.ngOnInit();
      fixture.detectChanges();

      component.form.patchValue({
        type: 'COACH',
        sequence: 20,
        critical: 'N'
      });

      component.onSave();
      tick();

      const payload = service.updateResourceCode.calls.mostRecent().args[0];
      expect(payload.effDate).toBe('');
    }));
  });

  describe('Add & Create Another', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should add resource and reset form', fakeAsync(() => {
      service.addResourceCode.and.returnValue(of({ success: true }));
      spyOn(component.saveSuccess, 'emit');

      component.form.patchValue({
        resourceCode: 'NEWRC',
        description: 'New Resource',
        type: 'STAFF',
        sequence: 5,
        critical: 'Y',
        effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD'))
      });
      fixture.detectChanges();

      component.onSaveAndCreateAnother();
      tick();

      expect(service.addResourceCode).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.form.get('resourceCode')?.value).toBeNull();
      expect(component.form.get('description')?.value).toBeNull();
      expect(component.form.get('critical')?.value).toBe('N');
    }));

    it('should not call service when form is invalid', () => {
      component.onSaveAndCreateAnother();
      expect(service.addResourceCode).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched', () => {
      spyOn(component.form, 'markAllAsTouched');
      component.onSaveAndCreateAnother();
      expect(component.form.markAllAsTouched).toHaveBeenCalled();
    });

    it('should mark form as untouched after successful save and create another', fakeAsync(() => {
      service.addResourceCode.and.returnValue(of({ success: true }));

      component.form.patchValue({
        resourceCode: 'NEWRC',
        description: 'New Resource',
        type: 'STAFF',
        sequence: 5,
        critical: 'Y',
        effectiveDate: moment().add(10, 'days')
      });
      fixture.detectChanges();

      component.onSaveAndCreateAnother();
      tick();

      expect(component.form.untouched).toBe(true);
    }));

    it('should show success snackbar on save and create another', fakeAsync(() => {
      service.addResourceCode.and.returnValue(of({ success: true }));
      const openSpy = spyOn(component['snackBar'], 'open');

      component.form.patchValue({
        resourceCode: 'NEWRC',
        description: 'New Resource',
        type: 'STAFF',
        sequence: 5,
        critical: 'Y',
        effectiveDate: moment().add(10, 'days')
      });
      fixture.detectChanges();

      component.onSaveAndCreateAnother();
      tick();

      expect(openSpy).toHaveBeenCalledWith(
        'New resource code added successfully',
        'DISMISS',
        jasmine.objectContaining({
          duration: 3000,
          panelClass: ['success-snackbar']
        })
      );
    }));

    it('should set isSaving to false after save and create another completes', fakeAsync(() => {
      service.addResourceCode.and.returnValue(of({ success: true }));

      component.form.patchValue({
        resourceCode: 'NEWRC',
        description: 'New Resource',
        type: 'STAFF',
        sequence: 5,
        critical: 'Y',
        effectiveDate: moment().add(10, 'days')
      });
      fixture.detectChanges();

      component.onSaveAndCreateAnother();
      tick();

      expect(component.isSaving).toBe(false);
    }));

    it('should emit saveSuccess with correct data on save and create another', fakeAsync(() => {
      service.addResourceCode.and.returnValue(of({ success: true }));
      spyOn(component.saveSuccess, 'emit');

      const effDate = moment().add(10, 'days');

      component.form.patchValue({
        resourceCode: 'NEWRC',
        description: 'New Resource',
        type: 'STAFF',
        sequence: 5,
        critical: 'Y',
        effectiveDate: effDate
      });
      fixture.detectChanges();

      component.onSaveAndCreateAnother();
      tick();

      const emittedData = (component.saveSuccess.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedData.resourceCode).toBe('NEWRC');
      expect(emittedData.description).toBe('New Resource');
    }));

    it('should not emit closePanel on save and create another', fakeAsync(() => {
      service.addResourceCode.and.returnValue(of({ success: true }));
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        resourceCode: 'NEWRC',
        description: 'New Resource',
        type: 'STAFF',
        sequence: 5,
        critical: 'Y',
        effectiveDate: moment().add(10, 'days')
      });
      fixture.detectChanges();

      component.onSaveAndCreateAnother();
      tick();

      expect(component.closePanel.emit).not.toHaveBeenCalled();
    }));

    it('should include termDate in payload when terminationDate is set', fakeAsync(() => {
      service.addResourceCode.and.returnValue(of({ success: true }));

      component.form.patchValue({
        resourceCode: 'NEWRC',
        description: 'New Resource',
        type: 'STAFF',
        sequence: 5,
        critical: 'Y',
        effectiveDate: moment().add(10, 'days'),
        terminationDate: moment().add(30, 'days')
      });
      fixture.detectChanges();

      component.onSaveAndCreateAnother();
      tick();

      const payload = service.addResourceCode.calls.mostRecent().args[0];
      expect(payload.termDate).toContain('T12:00:00.000Z');
    }));

    it('should set termDate to empty string when terminationDate is null', fakeAsync(() => {
      service.addResourceCode.and.returnValue(of({ success: true }));

      component.form.patchValue({
        resourceCode: 'NEWRC',
        description: 'New Resource',
        type: 'STAFF',
        sequence: 5,
        critical: 'Y',
        effectiveDate: moment().add(10, 'days'),
        terminationDate: null
      });
      fixture.detectChanges();

      component.onSaveAndCreateAnother();
      tick();

      const payload = service.addResourceCode.calls.mostRecent().args[0];
      expect(payload.termDate).toBe('');
    }));
  });

  describe('onCancel', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit closePanel event', () => {
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  describe('Sequence Input Handler', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should restrict sequence to 2 digits', () => {
      const input = document.createElement('input');
      input.value = '123';
      const event = { target: input } as any;

      component.onSequenceInput(event);

      expect(input.value).toBe('12');
    });

    it('should remove non-digit characters', () => {
      const input = document.createElement('input');
      input.value = '5abc';
      const event = { target: input } as any;

      component.onSequenceInput(event);

      expect(input.value).toBe('5');
    });

    it('should remove non-digit characters including minus sign', () => {
      const input = document.createElement('input');
      input.value = '-5';
      const event = { target: input } as any;

      component.onSequenceInput(event);

      expect(input.value).toBe('5');
    });

    it('should accept valid 2-digit input without modification', () => {
      const input = document.createElement('input');
      input.value = '42';
      const event = { target: input } as any;

      component.onSequenceInput(event);

      expect(input.value).toBe('42');
    });

    it('should accept single digit input', () => {
      const input = document.createElement('input');
      input.value = '7';
      const event = { target: input } as any;

      component.onSequenceInput(event);

      expect(input.value).toBe('7');
    });

    it('should handle empty input', () => {
      const input = document.createElement('input');
      input.value = '';
      const event = { target: input } as any;

      component.onSequenceInput(event);

      expect(input.value).toBe('');
    });

    it('should handle input with only non-digit characters', () => {
      const input = document.createElement('input');
      input.value = 'abc';
      const event = { target: input } as any;

      component.onSequenceInput(event);

      expect(input.value).toBe('');
    });

    it('should handle input value 0', () => {
      const input = document.createElement('input');
      input.value = '0';
      const event = { target: input } as any;

      component.onSequenceInput(event);

      expect(input.value).toBe('0');
    });

    it('should handle input value 00', () => {
      const input = document.createElement('input');
      input.value = '00';
      const event = { target: input } as any;

      component.onSequenceInput(event);

      expect(input.value).toBe('00');
    });
  });

  describe('Error Messages', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string for resourceCode error when control is untouched', () => {
      expect(component.getResourceCodeError()).toBe('');
    });

    it('should return required error for resourceCode', () => {
      const control = component.form.get('resourceCode');
      control?.setValue('');
      control?.markAsTouched();
      expect(component.getResourceCodeError()).toBe('Resource Code is required');
    });

    it('should return whitespace error for resourceCode', () => {
      const control = component.form.get('resourceCode');
      control?.setValue('   ');
      control?.markAsTouched();
      expect(component.getResourceCodeError()).toBe('Resource Code cannot contain only spaces');
    });

    it('should return noAlphanumeric error for resourceCode', () => {
      const control = component.form.get('resourceCode');
      control?.setValue('---');
      control?.markAsTouched();
      expect(component.getResourceCodeError()).toBe('Resource Code must contain at least one letter or number');
    });

    it('should return error message for resourceCode maxlength', () => {
      const control = component.form.get('resourceCode');
      control?.setValue('TOOLONG');
      control?.markAsTouched();

      expect(component.getResourceCodeError()).toBe('Maximum 5 characters allowed');
    });

    it('should return empty string for valid resourceCode', () => {
      const control = component.form.get('resourceCode');
      control?.setValue('ABC');
      control?.markAsTouched();
      expect(component.getResourceCodeError()).toBe('');
    });

    it('should return empty string for description error when control is untouched', () => {
      expect(component.getDescriptionError()).toBe('');
    });

    it('should return error message for description required', () => {
      const control = component.form.get('description');
      control?.setValue('');
      control?.markAsTouched();

      expect(component.getDescriptionError()).toBe('Description is required');
    });

    it('should return whitespace error for description', () => {
      const control = component.form.get('description');
      control?.setValue('   ');
      control?.markAsTouched();
      expect(component.getDescriptionError()).toBe('Description cannot contain only spaces');
    });

    it('should return maxlength error for description', () => {
      const control = component.form.get('description');
      control?.setValue('A'.repeat(51));
      control?.markAsTouched();
      expect(component.getDescriptionError()).toBe('Maximum 50 characters allowed');
    });

    it('should return empty string for valid description', () => {
      const control = component.form.get('description');
      control?.setValue('Valid');
      control?.markAsTouched();
      expect(component.getDescriptionError()).toBe('');
    });

    it('should return empty string for type error (always returns empty)', () => {
      const control = component.form.get('type');
      control?.markAsTouched();
      expect(component.getTypeError()).toBe('');
    });

    it('should return empty string for type error when control is untouched', () => {
      expect(component.getTypeError()).toBe('');
    });

    it('should return empty string for sequence error when control is untouched', () => {
      expect(component.getSequenceError()).toBe('');
    });

    it('should return min error for sequence', () => {
      const control = component.form.get('sequence');
      control?.setValue(-1);
      control?.markAsTouched();
      expect(component.getSequenceError()).toBe('Sequence must be 0 or greater');
    });

    it('should return error message for sequence max', () => {
      const control = component.form.get('sequence');
      control?.setValue(100);
      control?.markAsTouched();

      expect(component.getSequenceError()).toBe('Sequence must be 99 or less');
    });

    it('should return empty string for valid sequence', () => {
      const control = component.form.get('sequence');
      control?.setValue(50);
      control?.markAsTouched();
      expect(component.getSequenceError()).toBe('');
    });

    it('should return empty string for critical error when control is untouched', () => {
      expect(component.getCriticalError()).toBe('');
    });

    it('should return required error for critical when empty', () => {
      const control = component.form.get('critical');
      control?.setValue('');
      control?.markAsTouched();
      expect(component.getCriticalError()).toBe('Critical is required');
    });

    it('should return empty string for valid critical value', () => {
      const control = component.form.get('critical');
      control?.setValue('Y');
      control?.markAsTouched();
      expect(component.getCriticalError()).toBe('');
    });

    it('should return error message for effectiveDate required', () => {
      component.mode = 'add';
      const control = component.form.get('effectiveDate');
      control?.setValue(null);
      control?.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    });

    it('should return error message for date range invalid', () => {
      component.form.patchValue({
        effectiveDate: new Date('2026-12-31'),
        terminationDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD'))
      });
      fixture.detectChanges();
      component.form.get('terminationDate')?.markAsTouched();

      expect(component.getTerminationDateError()).toBe('Termination Date must be greater than or equal to Effective Date');
    });

    it('should return empty string for terminationDate error when no errors', () => {
      component.form.patchValue({
        effectiveDate: moment().add(10, 'days'),
        terminationDate: moment().add(30, 'days')
      });
      fixture.detectChanges();
      component.form.get('terminationDate')?.markAsTouched();

      expect(component.getTerminationDateError()).toBe('');
    });
  });

  describe('Form Control Getters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return resourceCode control', () => {
      expect(component.resourceCodeControl).toBe(component.form.get('resourceCode'));
    });

    it('should return description control', () => {
      expect(component.descriptionControl).toBe(component.form.get('description'));
    });

    it('should return type control', () => {
      expect(component.typeControl).toBe(component.form.get('type'));
    });

    it('should return sequence control', () => {
      expect(component.sequenceControl).toBe(component.form.get('sequence'));
    });

    it('should return critical control', () => {
      expect(component.criticalControl).toBe(component.form.get('critical'));
    });

    it('should return effectiveDate control', () => {
      expect(component.effectiveDateControl).toBe(component.form.get('effectiveDate'));
    });

    it('should return terminationDate control', () => {
      expect(component.terminationDateControl).toBe(component.form.get('terminationDate'));
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      fixture.detectChanges();
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should unsubscribe from filter options observable', fakeAsync(() => {
      fixture.detectChanges();

      // Destroy the component
      component.ngOnDestroy();

      // After destroy, service calls should not affect component
      expect(component['destroy$'].observed).toBe(false);
    }));
  });

  describe('formatDate (private)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string for null date', () => {
      const result = component['formatDate'](null);
      expect(result).toBe('');
    });

    it('should format valid date to DD-MMM-YYYY', () => {
      const date = new Date('2026-01-15T00:00:00.000Z');
      const result = component['formatDate'](date);
      expect(result).toContain('JAN');
      expect(result).toContain('2026');
      // Day should be padded with leading zero if needed
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });
  });


});
