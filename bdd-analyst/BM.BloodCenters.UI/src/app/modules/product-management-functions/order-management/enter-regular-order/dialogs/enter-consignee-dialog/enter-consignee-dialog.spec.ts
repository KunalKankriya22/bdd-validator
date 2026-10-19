import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import {
  EnterConsigneeDialogComponent,
  EnterConsigneeDialogData,
} from './enter-consignee-dialog';
import { RegularOrderApiService } from '../../services/regular-order-api.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('EnterConsigneeDialogComponent', () => {
  let component: EnterConsigneeDialogComponent;
  let fixture: ComponentFixture<EnterConsigneeDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<EnterConsigneeDialogComponent>>;
  let apiServiceSpy: jasmine.SpyObj<RegularOrderApiService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const mockDialogData: EnterConsigneeDialogData = {
    customerId: 'CUST-001',
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    apiServiceSpy = jasmine.createSpyObj('RegularOrderApiService', [
      'createConsignee',
    ]);
    headerServiceSpy = createMockHeaderService();

    // Default return values
    apiServiceSpy.createConsignee.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [EnterConsigneeDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: RegularOrderApiService, useValue: apiServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EnterConsigneeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ─── Component creation ───────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── Form creation ────────────────────────────────────────────────

  describe('form creation', () => {
    it('should create consigneeForm', () => {
      expect(component.consigneeForm).toBeTruthy();
    });

    it('should have consigneeId control', () => {
      expect(component.consigneeForm.get('consigneeId')).toBeTruthy();
    });

    it('should have name control', () => {
      expect(component.consigneeForm.get('name')).toBeTruthy();
    });

    it('should have shortName control', () => {
      expect(component.consigneeForm.get('shortName')).toBeTruthy();
    });

    it('should have address1 control', () => {
      expect(component.consigneeForm.get('address1')).toBeTruthy();
    });

    it('should have address2 control', () => {
      expect(component.consigneeForm.get('address2')).toBeTruthy();
    });

    it('should have city control', () => {
      expect(component.consigneeForm.get('city')).toBeTruthy();
    });

    it('should have state control', () => {
      expect(component.consigneeForm.get('state')).toBeTruthy();
    });

    it('should have zip control', () => {
      expect(component.consigneeForm.get('zip')).toBeTruthy();
    });

    it('should have country control', () => {
      expect(component.consigneeForm.get('country')).toBeTruthy();
    });

    it('should have phoneNo control', () => {
      expect(component.consigneeForm.get('phoneNo')).toBeTruthy();
    });

    it('should have faxNo control', () => {
      expect(component.consigneeForm.get('faxNo')).toBeTruthy();
    });

    it('should have effDate control', () => {
      expect(component.consigneeForm.get('effDate')).toBeTruthy();
    });

    it('should have termDate control', () => {
      expect(component.consigneeForm.get('termDate')).toBeTruthy();
    });
  });

  // ─── Validation: required fields ─────────────────────────────────

  describe('required field validation', () => {
    it('should require consigneeId', () => {
      component.consigneeForm.get('consigneeId')?.setValue('');
      expect(component.consigneeForm.get('consigneeId')?.hasError('required')).toBe(true);
    });

    it('should require name', () => {
      component.consigneeForm.get('name')?.setValue('');
      expect(component.consigneeForm.get('name')?.hasError('required')).toBe(true);
    });

    it('should require effDate', () => {
      component.consigneeForm.get('effDate')?.setValue(null);
      expect(component.consigneeForm.get('effDate')?.hasError('required')).toBe(true);
    });

    it('should not require shortName', () => {
      component.consigneeForm.get('shortName')?.setValue('');
      expect(component.consigneeForm.get('shortName')?.hasError('required')).toBe(false);
    });

    it('should not require termDate', () => {
      component.consigneeForm.get('termDate')?.setValue(null);
      expect(component.consigneeForm.get('termDate')?.hasError('required')).toBe(false);
    });
  });

  // ─── Validation: max length ───────────────────────────────────────

  describe('max length validation', () => {
    it('should validate consigneeId max length of 10', () => {
      component.consigneeForm.get('consigneeId')?.setValue('12345678901'); // 11 chars
      expect(component.consigneeForm.get('consigneeId')?.hasError('maxlength')).toBe(true);
    });

    it('should allow consigneeId at max length of 10', () => {
      component.consigneeForm.get('consigneeId')?.setValue('1234567890'); // 10 chars
      expect(component.consigneeForm.get('consigneeId')?.hasError('maxlength')).toBe(false);
    });

    it('should validate name max length of 50', () => {
      component.consigneeForm.get('name')?.setValue('a'.repeat(51));
      expect(component.consigneeForm.get('name')?.hasError('maxlength')).toBe(true);
    });

    it('should allow name at max length of 50', () => {
      component.consigneeForm.get('name')?.setValue('a'.repeat(50));
      expect(component.consigneeForm.get('name')?.hasError('maxlength')).toBe(false);
    });

    it('should validate shortName max length of 15', () => {
      component.consigneeForm.get('shortName')?.setValue('a'.repeat(16));
      expect(component.consigneeForm.get('shortName')?.hasError('maxlength')).toBe(true);
    });

    it('should validate address1 max length of 60', () => {
      component.consigneeForm.get('address1')?.setValue('a'.repeat(61));
      expect(component.consigneeForm.get('address1')?.hasError('maxlength')).toBe(true);
    });

    it('should validate zip max length of 10', () => {
      component.consigneeForm.get('zip')?.setValue('a'.repeat(11));
      expect(component.consigneeForm.get('zip')?.hasError('maxlength')).toBe(true);
    });

    it('should validate phoneNo max length of 20', () => {
      component.consigneeForm.get('phoneNo')?.setValue('a'.repeat(21));
      expect(component.consigneeForm.get('phoneNo')?.hasError('maxlength')).toBe(true);
    });
  });

  // ─── Validation: effective date not in past ───────────────────────

  describe('effective date validation', () => {
    it('should have an effectiveDateNotPast validator on effDate', () => {
      const pastDate = moment().subtract(10, 'days');
      component.consigneeForm.get('effDate')?.setValue(pastDate);
      component.consigneeForm.get('effDate')?.updateValueAndValidity();
      // The effectiveDateNotPast validator should mark the control as invalid
      expect(component.consigneeForm.get('effDate')?.valid).toBe(false);
    });
  });

  // ─── Validation: cross-field date range ───────────────────────────

  describe('cross-field date range validation', () => {
    it('should be invalid when termDate is before effDate', () => {
      const futureDate = moment().add(10, 'days');
      const earlierDate = moment().add(5, 'days');

      component.consigneeForm.get('effDate')?.setValue(futureDate);
      component.consigneeForm.get('termDate')?.setValue(earlierDate);
      component.consigneeForm.updateValueAndValidity();

      // The cross-field validator should set an error on the form group
      expect(component.consigneeForm.errors).toBeTruthy();
    });

    it('should be valid when termDate is after effDate', () => {
      const futureDate = moment().add(5, 'days');
      const laterDate = moment().add(10, 'days');

      component.consigneeForm.get('consigneeId')?.setValue('C001');
      component.consigneeForm.get('name')?.setValue('Test');
      component.consigneeForm.get('effDate')?.setValue(futureDate);
      component.consigneeForm.get('termDate')?.setValue(laterDate);
      component.consigneeForm.updateValueAndValidity();

      // No cross-field error should be present
      const crossFieldError = component.consigneeForm.errors?.['dateRangeInvalid'] ||
                              component.consigneeForm.errors?.['terminationBeforeEffective'];
      expect(crossFieldError).toBeFalsy();
    });
  });

  // ─── Error message helpers ────────────────────────────────────────

  describe('error message helpers', () => {
    it('should return an error message from getEffectiveDateError', () => {
      component.consigneeForm.get('effDate')?.setValue(null);
      component.consigneeForm.get('effDate')?.markAsTouched();
      const errorMsg = component.getEffectiveDateError();
      expect(typeof errorMsg).toBe('string');
    });

    it('should return an error message from getTerminationDateError', () => {
      const errorMsg = component.getTerminationDateError();
      expect(typeof errorMsg).toBe('string');
    });
  });

  // ─── onSave: valid form ───────────────────────────────────────────

  describe('onSave with valid form', () => {
    beforeEach(() => {
      component.consigneeForm.get('consigneeId')?.setValue('C001');
      component.consigneeForm.get('name')?.setValue('Test Consignee');
      component.consigneeForm.get('effDate')?.setValue(moment().add(5, 'days'));
      component.consigneeForm.updateValueAndValidity();
    });

    it('should call apiService.createConsignee on save with valid form', () => {
      component.onSave();
      expect(apiServiceSpy.createConsignee).toHaveBeenCalled();
    });

    it('should call createConsignee with the correct customerId', () => {
      component.onSave();
      expect(apiServiceSpy.createConsignee).toHaveBeenCalledWith(
        'CUST-001',
        jasmine.objectContaining({ consigneeId: 'C001', name: 'Test Consignee' })
      );
    });

    it('should close dialog with result on successful save', () => {
      apiServiceSpy.createConsignee.and.returnValue(of({}));
      component.onSave();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(
        jasmine.objectContaining({ saved: true, consigneeId: 'C001' })
      );
    });

    it('should set saving to false after successful save', () => {
      apiServiceSpy.createConsignee.and.returnValue(of({}));
      component.onSave();
      expect(component.saving()).toBe(false);
    });

    it('should trim consigneeId before sending', () => {
      component.consigneeForm.get('consigneeId')?.setValue('  C001  ');
      component.onSave();
      expect(apiServiceSpy.createConsignee).toHaveBeenCalledWith(
        'CUST-001',
        jasmine.objectContaining({ consigneeId: 'C001' })
      );
    });

    it('should trim name before sending', () => {
      component.consigneeForm.get('name')?.setValue('  Test Name  ');
      component.onSave();
      expect(apiServiceSpy.createConsignee).toHaveBeenCalledWith(
        'CUST-001',
        jasmine.objectContaining({ name: 'Test Name' })
      );
    });
  });

  // ─── onSave: invalid form ────────────────────────────────────────

  describe('onSave with invalid form', () => {
    it('should not call createConsignee when form is invalid', () => {
      // form is invalid because consigneeId and name are empty, effDate is null
      component.onSave();
      expect(apiServiceSpy.createConsignee).not.toHaveBeenCalled();
    });

    it('should mark all controls as touched on invalid save', () => {
      const markSpy = spyOn(component.consigneeForm, 'markAllAsTouched');
      component.onSave();
      expect(markSpy).toHaveBeenCalled();
    });

    it('should not close dialog when form is invalid', () => {
      component.onSave();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });
  });

  // ─── onSave: API error ────────────────────────────────────────────

  describe('onSave with API error', () => {
    beforeEach(() => {
      component.consigneeForm.get('consigneeId')?.setValue('C001');
      component.consigneeForm.get('name')?.setValue('Test Consignee');
      component.consigneeForm.get('effDate')?.setValue(moment().add(5, 'days'));
      component.consigneeForm.updateValueAndValidity();
    });

    it('should set saving to false on API error', () => {
      apiServiceSpy.createConsignee.and.returnValue(throwError(() => new Error('API error')));
      component.onSave();
      expect(component.saving()).toBe(false);
    });

    it('should not close dialog on API error', () => {
      apiServiceSpy.createConsignee.and.returnValue(throwError(() => new Error('API error')));
      component.onSave();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });
  });

  // ─── onSave: saving signal ────────────────────────────────────────

  describe('saving signal', () => {
    it('should initialize saving as false', () => {
      expect(component.saving()).toBe(false);
    });
  });

  // ─── onCancel ─────────────────────────────────────────────────────

  describe('onCancel', () => {
    it('should close dialog without data on cancel', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });

    it('should close dialog exactly once on cancel', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Template ─────────────────────────────────────────────────────

  describe('template', () => {
    it('should display "New Consignee (Ship To)" as the dialog title', () => {
      const titleEl = fixture.nativeElement.querySelector('[mat-dialog-title], h2');
      expect(titleEl).toBeTruthy();
      expect(titleEl.textContent).toContain('New Consignee (Ship To)');
    });

    it('should have a Save button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const saveBtn = Array.from(buttons).find(
        (btn: any) => btn.textContent.trim() === 'Save'
      );
      expect(saveBtn).toBeTruthy();
    });

    it('should have a Cancel button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const cancelBtn = Array.from(buttons).find(
        (btn: any) => btn.textContent.trim() === 'Cancel'
      );
      expect(cancelBtn).toBeTruthy();
    });

    it('should disable Save button when form is invalid', () => {
      // Form is invalid by default (required fields empty)
      fixture.detectChanges();
      const saveBtn = fixture.nativeElement.querySelector('button[color="primary"]');
      expect(saveBtn.disabled).toBe(true);
    });

    it('should disable Save button when saving is in progress', () => {
      // Make form valid
      component.consigneeForm.get('consigneeId')?.setValue('C001');
      component.consigneeForm.get('name')?.setValue('Test');
      component.consigneeForm.get('effDate')?.setValue(moment().add(5, 'days'));
      component.saving.set(true);
      fixture.detectChanges();

      const saveBtn = fixture.nativeElement.querySelector('button[color="primary"]');
      expect(saveBtn.disabled).toBe(true);
    });
  });

  // ─── ngOnDestroy ──────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should call next on destroy$ subject', () => {
      const destroySub = (component as any).destroy$;
      const nextSpy = spyOn(destroySub, 'next');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
    });

    it('should call complete on destroy$ subject', () => {
      const destroySub = (component as any).destroy$;
      const completeSpy = spyOn(destroySub, 'complete');
      component.ngOnDestroy();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should stop state search filtering after destroy', fakeAsync(() => {
      component.states.set([
        { code: 'CA', description: 'California' },
        { code: 'NY', description: 'New York' },
      ]);
      component.filteredStates.set(component.states());

      component.ngOnDestroy();
      component.stateSearchCtrl.setValue('CA');
      tick(200);
      // filteredStates should remain unchanged (still 2 items)
      expect(component.filteredStates().length).toBe(2);
    }));
  });

  // ─── Data injection ───────────────────────────────────────────────

  describe('data injection', () => {
    it('should inject dialog data with customerId', () => {
      expect(component.data.customerId).toBe('CUST-001');
    });
  });
});
