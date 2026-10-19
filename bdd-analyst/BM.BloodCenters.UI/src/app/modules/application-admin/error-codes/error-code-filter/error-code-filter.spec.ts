import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ErrorCodesFilterComponent } from './error-code-filter';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { ErrorType, AuditFlag } from '../models/error-code.model';

describe('ErrorCodesFilterComponent', () => {
  let component: ErrorCodesFilterComponent;
  let fixture: ComponentFixture<ErrorCodesFilterComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ErrorCodesFilterComponent>>;

  function createComponent(tabType?: string) {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [
        ErrorCodesFilterComponent,
        NoopAnimationsModule,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: tabType ? { tabType } : {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorCodesFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await createComponent();
  });

  // -------------------------------------------------------
  // Creation & initialization
  // -------------------------------------------------------
  describe('Creation', () => {

    it('should initialize all filter fields to empty/null/false', () => {
      expect(component.codeFrom).toBe('');
      expect(component.codeTo).toBe('');
      expect(component.selectedType).toBeNull();
      expect(component.selectedAudit).toBeNull();
      expect(component.showEmpty).toBe(false);
    });

    it('should initialize filteredTypeOptions with all 6 type options', () => {
      expect(component.filteredTypeOptions.length).toBe(6);
    });

  });

  // -------------------------------------------------------
  // Tab helpers
  // -------------------------------------------------------
  describe('Tab helpers', () => {
    it('isDonorTab should return true when tabType is DONOR', async () => {
      await createComponent('DONOR');
      expect(component.isDonorTab()).toBe(true);
    });

    it('isDonorTab should return false when tabType is LAB', async () => {
      await createComponent('LAB');
      expect(component.isDonorTab()).toBe(false);
    });

    it('isLabTab should return true when tabType is LAB', async () => {
      await createComponent('LAB');
      expect(component.isLabTab()).toBe(true);
    });

    it('isLabTab should return false when tabType is DONOR', async () => {
      await createComponent('DONOR');
      expect(component.isLabTab()).toBe(false);
    });

    it('isDistributionTab should return true when tabType is DISTRIBUTION', async () => {
      await createComponent('DISTRIBUTION');
      expect(component.isDistributionTab()).toBe(true);
    });

    it('isDistributionTab should return false when tabType is DONOR', async () => {
      await createComponent('DONOR');
      expect(component.isDistributionTab()).toBe(false);
    });
  });

  // -------------------------------------------------------
  // close
  // -------------------------------------------------------
  describe('close', () => {
    it('should call dialogRef.close without any value', () => {
      component.close();
      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });
  });

  // -------------------------------------------------------
  // clearAll
  // -------------------------------------------------------
  describe('clearAll', () => {
    it('should reset all filter fields', () => {
      component.codeFrom = '0001';
      component.codeTo = '9999';
      component.selectedType = ErrorType.SHOW_MESSAGE_ONLY;
      component.selectedAudit = AuditFlag.YES;
      component.showEmpty = true;

      component.clearAll();

      expect(component.codeFrom).toBe('');
      expect(component.codeTo).toBe('');
      expect(component.selectedType).toBeNull();
      expect(component.selectedAudit).toBeNull();
      expect(component.showEmpty).toBe(false);
    });


  });

  // -------------------------------------------------------
  // isCodeFromValid
  // -------------------------------------------------------
  describe('isCodeFromValid', () => {
    it('should return true for empty codeFrom', () => {
      component.codeFrom = '';
      expect(component.isCodeFromValid()).toBe(true);
    });

    it('should return false for non-numeric codeFrom', () => {
      component.codeFrom = 'abc';
      expect(component.isCodeFromValid()).toBe(false);
    });

    it('should return true for valid 4-digit code on non-donor tab', () => {
      component.codeFrom = '9999';
      expect(component.isCodeFromValid()).toBe(true);
    });

    it('should return false when code exceeds 9999 on non-donor tab', () => {
      component.codeFrom = '10000';
      expect(component.isCodeFromValid()).toBe(false);
    });

    it('should return true for valid 5-digit code on donor tab', async () => {
      await createComponent('DONOR');
      component.codeFrom = '99999';
      expect(component.isCodeFromValid()).toBe(true);
    });

    it('should return false when code exceeds 99999 on donor tab', async () => {
      await createComponent('DONOR');
      component.codeFrom = '100000';
      expect(component.isCodeFromValid()).toBe(false);
    });

    it('should return true for code 0', () => {
      component.codeFrom = '0';
      expect(component.isCodeFromValid()).toBe(true);
    });
  });

  // -------------------------------------------------------
  // isCodeToValid
  // -------------------------------------------------------
  describe('isCodeToValid', () => {
    it('should return true for empty codeTo', () => {
      component.codeTo = '';
      expect(component.isCodeToValid()).toBe(true);
    });

    it('should return false for non-numeric codeTo', () => {
      component.codeTo = 'xyz';
      expect(component.isCodeToValid()).toBe(false);
    });

    it('should return true for valid 4-digit code on non-donor tab', () => {
      component.codeTo = '5000';
      expect(component.isCodeToValid()).toBe(true);
    });

    it('should return false when code exceeds 9999 on non-donor tab', () => {
      component.codeTo = '10000';
      expect(component.isCodeToValid()).toBe(false);
    });

    it('should return true for valid donor code', async () => {
      await createComponent('DONOR');
      component.codeTo = '99999';
      expect(component.isCodeToValid()).toBe(true);
    });
  });

  // -------------------------------------------------------
  // isRangeValid
  // -------------------------------------------------------
  describe('isRangeValid', () => {
    it('should return true when both fields are empty', () => {
      component.codeFrom = '';
      component.codeTo = '';
      expect(component.isRangeValid()).toBe(true);
    });

    it('should return true when only codeFrom is provided', () => {
      component.codeFrom = '0001';
      component.codeTo = '';
      expect(component.isRangeValid()).toBe(true);
    });

    it('should return true when only codeTo is provided', () => {
      component.codeFrom = '';
      component.codeTo = '9999';
      expect(component.isRangeValid()).toBe(true);
    });

    it('should return true when codeFrom <= codeTo', () => {
      component.codeFrom = '0001';
      component.codeTo = '9999';
      expect(component.isRangeValid()).toBe(true);
    });

    it('should return true when codeFrom equals codeTo', () => {
      component.codeFrom = '0100';
      component.codeTo = '0100';
      expect(component.isRangeValid()).toBe(true);
    });

    it('should return false when codeFrom > codeTo', () => {
      component.codeFrom = '9999';
      component.codeTo = '0001';
      expect(component.isRangeValid()).toBe(false);
    });
  });

  // -------------------------------------------------------
  // isFormValid
  // -------------------------------------------------------
  describe('isFormValid', () => {
    it('should return true when all fields are empty', () => {
      expect(component.isFormValid()).toBe(true);
    });

    it('should return true when both code fields are valid and range is valid', () => {
      component.codeFrom = '0001';
      component.codeTo = '9999';
      expect(component.isFormValid()).toBe(true);
    });

    it('should return false when codeFrom is invalid', () => {
      component.codeFrom = 'abc';
      component.codeTo = '';
      expect(component.isFormValid()).toBe(false);
    });

    it('should return false when codeTo is invalid', () => {
      component.codeFrom = '';
      component.codeTo = 'xyz';
      expect(component.isFormValid()).toBe(false);
    });

    it('should return false when codeFrom > codeTo', () => {
      component.codeFrom = '9999';
      component.codeTo = '0001';
      expect(component.isFormValid()).toBe(false);
    });
  });

  // -------------------------------------------------------
  // getCodeFromError
  // -------------------------------------------------------
  describe('getCodeFromError', () => {


    it('should return numeric error for non-numeric value', () => {
      component.codeFromTouched = true;
      component.codeFrom = 'abc';
      expect(component.getCodeFromError()).toBe('Code must be numeric only');
    });

    it('should return range error when code > 9999 on non-donor tab', () => {
      component.codeFromTouched = true;
      component.codeFrom = '10000';
      expect(component.getCodeFromError()).toBe('Code must be between 0000 and 9999');
    });

    it('should return range error when code > 99999 on donor tab', async () => {
      await createComponent('DONOR');
      component.codeFromTouched = true;
      component.codeFrom = '100000';
      expect(component.getCodeFromError()).toBe('Code must be between 00000 and 99999');
    });

    it('should return range order error when codeFrom > codeTo', () => {
      component.codeFromTouched = true;
      component.codeToTouched = true;
      component.codeFrom = '9999';
      component.codeTo = '0001';
      expect(component.getCodeFromError()).toBe('Code From must be ≤ Code To');
    });

  });

  // -------------------------------------------------------
  // getCodeToError
  // -------------------------------------------------------
  describe('getCodeToError', () => {


    it('should return numeric error for non-numeric value', () => {
      component.codeToTouched = true;
      component.codeTo = 'xyz';
      expect(component.getCodeToError()).toBe('Code must be numeric only');
    });

    it('should return range error when code > 9999 on non-donor tab', () => {
      component.codeToTouched = true;
      component.codeTo = '10000';
      expect(component.getCodeToError()).toBe('Code must be between 0000 and 9999');
    });

    it('should return range order error when codeFrom > codeTo', () => {
      component.codeToTouched = true;
      component.codeFrom = '9999';
      component.codeTo = '0001';
      expect(component.getCodeToError()).toBe('Code To must be ≥ Code From');
    });

  });

  // -------------------------------------------------------
  // hasCodeFromError / hasCodeToError
  // -------------------------------------------------------
  describe('hasCodeFromError', () => {
    it('should return false when not touched', () => {
      component.codeFromTouched = false;
      component.codeFrom = 'abc';
      expect(component.hasCodeFromError).toBe(false);
    });

    it('should return false when codeFrom is empty (optional)', () => {
      component.codeFromTouched = true;
      component.codeFrom = '';
      expect(component.hasCodeFromError).toBe(false);
    });

    it('should return true when touched with invalid numeric code', () => {
      component.codeFromTouched = true;
      component.codeFrom = 'abc';
      expect(component.hasCodeFromError).toBe(true);
    });

    it('should return false when touched with valid code', () => {
      component.codeFromTouched = true;
      component.codeFrom = '0001';
      expect(component.hasCodeFromError).toBe(false);
    });
  });

  describe('hasCodeToError', () => {
    it('should return false when not touched', () => {
      component.codeToTouched = false;
      component.codeTo = 'abc';
      expect(component.hasCodeToError).toBe(false);
    });

    it('should return false when codeTo is empty (optional)', () => {
      component.codeToTouched = true;
      component.codeTo = '';
      expect(component.hasCodeToError).toBe(false);
    });

    it('should return true when touched with invalid numeric code', () => {
      component.codeToTouched = true;
      component.codeTo = 'xyz';
      expect(component.hasCodeToError).toBe(true);
    });

    it('should return false when touched with valid code', () => {
      component.codeToTouched = true;
      component.codeTo = '9999';
      expect(component.hasCodeToError).toBe(false);
    });
  });

  // -------------------------------------------------------
  // isApplyDisabled
  // -------------------------------------------------------
  describe('isApplyDisabled', () => {
    it('should return true when no filters are set', () => {
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return false when codeFrom is set', () => {
      component.codeFrom = '0001';
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return false when codeTo is set', () => {
      component.codeTo = '9999';
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return false when selectedType is set', () => {
      component.selectedType = ErrorType.SHOW_MESSAGE_ONLY;
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return false when selectedAudit is set', () => {
      component.selectedAudit = AuditFlag.YES;
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return false when showEmpty is true', () => {
      component.showEmpty = true;
      expect(component.isApplyDisabled).toBe(false);
    });

  });

  // -------------------------------------------------------
  // onCodeFromInput
  // -------------------------------------------------------
  describe('onCodeFromInput', () => {

    it('should mark codeFromTouched as true', () => {
      const input = document.createElement('input');
      input.value = '0001';
      const event = { target: input } as unknown as Event;

      component.codeFromTouched = false;
      component.onCodeFromInput(event);

      expect(component.codeFromTouched).toBe(true);
    });

    it('should not change codeFrom if already numeric', () => {
      // Pre-set codeFrom to simulate ngModel two-way binding
      component.codeFrom = '1234';
      const input = document.createElement('input');
      input.value = '1234'; // already numeric — handler does not overwrite codeFrom
      const event = { target: input } as unknown as Event;

      component.onCodeFromInput(event);

      expect(component.codeFrom).toBe('1234');
    });
  });

  // -------------------------------------------------------
  // onCodeToInput
  // -------------------------------------------------------
  describe('onCodeToInput', () => {

    it('should mark codeToTouched as true', () => {
      const input = document.createElement('input');
      input.value = '9999';
      const event = { target: input } as unknown as Event;

      component.codeToTouched = false;
      component.onCodeToInput(event);

      expect(component.codeToTouched).toBe(true);
    });
  });

  // -------------------------------------------------------
  // onCodeFromBlur / onCodeToBlur
  // -------------------------------------------------------
  describe('onCodeFromBlur', () => {
    it('should mark codeFromTouched as true', () => {
      component.codeFromTouched = false;
      component.onCodeFromBlur();
      expect(component.codeFromTouched).toBe(true);
    });

    it('should format codeFrom on blur', () => {
      component.codeFrom = '5';
      component.onCodeFromBlur();
      expect(component.codeFrom).toBe('0005');
    });
  });

  describe('onCodeToBlur', () => {
    it('should mark codeToTouched as true', () => {
      component.codeToTouched = false;
      component.onCodeToBlur();
      expect(component.codeToTouched).toBe(true);
    });

    it('should format codeTo on blur', () => {
      component.codeTo = '25';
      component.onCodeToBlur();
      expect(component.codeTo).toBe('0025');
    });
  });

  // -------------------------------------------------------
  // formatCodeFrom / formatCodeTo
  // -------------------------------------------------------
  describe('formatCodeFrom', () => {
    it('should pad single digit to 4 digits', () => {
      component.codeFrom = '5';
      component.formatCodeFrom();
      expect(component.codeFrom).toBe('0005');
    });

    it('should not change already 4-digit code', () => {
      component.codeFrom = '0100';
      component.formatCodeFrom();
      expect(component.codeFrom).toBe('0100');
    });

    it('should not change 5-digit code', () => {
      component.codeFrom = '12345';
      component.formatCodeFrom();
      expect(component.codeFrom).toBe('12345');
    });

    it('should not change empty code', () => {
      component.codeFrom = '';
      component.formatCodeFrom();
      expect(component.codeFrom).toBe('');
    });

    it('should not change non-numeric code', () => {
      component.codeFrom = 'abc';
      component.formatCodeFrom();
      expect(component.codeFrom).toBe('abc');
    });
  });

  describe('formatCodeTo', () => {
    it('should pad two digits to 4 digits', () => {
      component.codeTo = '25';
      component.formatCodeTo();
      expect(component.codeTo).toBe('0025');
    });

    it('should not change already 4-digit code', () => {
      component.codeTo = '9999';
      component.formatCodeTo();
      expect(component.codeTo).toBe('9999');
    });

    it('should not change empty code', () => {
      component.codeTo = '';
      component.formatCodeTo();
      expect(component.codeTo).toBe('');
    });
  });

  // -------------------------------------------------------
  // typeSearchControl filtering
  // -------------------------------------------------------
  describe('typeSearchControl filtering', () => {
    it('should filter type options based on search term', fakeAsync(() => {
      component.typeSearchControl.setValue('warning');
      tick(0);
      const allContainWarning = component.filteredTypeOptions.every(o =>
        o.label.toLowerCase().includes('warning')
      );
      expect(allContainWarning).toBe(true);
    }));

    it('should be case-insensitive when filtering', fakeAsync(() => {
      component.typeSearchControl.setValue('MESSAGE');
      tick(0);
      const allContainMessage = component.filteredTypeOptions.every(o =>
        o.label.toLowerCase().includes('message')
      );
      expect(allContainMessage).toBe(true);
    }));


  });

  // -------------------------------------------------------
  // apply
  // -------------------------------------------------------
  describe('apply', () => {




    it('should close with correct auditFlag NO when selectedAudit is NO', () => {
      component.selectedAudit = AuditFlag.NO;
      component.apply();

      expect(dialogRefSpy.close).toHaveBeenCalledWith(
        jasmine.objectContaining({ auditFlag: AuditFlag.NO })
      );
    });
  });

  // -------------------------------------------------------
  // ngOnDestroy
  // -------------------------------------------------------
});
