import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import {
  AddReconciliationReasonDialogComponent,
  AddReconciliationReasonDialogData,
  AddReconciliationReasonDialogResult,
} from './add-reconciliation-reason-dialog';
import { ReasonCodeDto, BatchDetailDto } from '../models/reconcile-lab-warehouse-batch.model';

describe('AddReconciliationReasonDialogComponent', () => {
  let component: AddReconciliationReasonDialogComponent;
  let fixture: ComponentFixture<AddReconciliationReasonDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddReconciliationReasonDialogComponent>>;

  const mockReasonCodes: ReasonCodeDto[] = [
    { code: 'DMGD', codeDesc: 'Damaged during transport' },
    { code: 'EXPD', codeDesc: 'Expired product' },
    { code: 'LOST', codeDesc: 'Lost in transit' },
  ];

  const mockSelectedUnits: BatchDetailDto[] = [
    {
      batchId: 'BATCH001',
      unitId: 'UNIT001234567',
      chkDigit: '12',
      productCode: 'RBC00101',
      productCodeDesc: 'Red Blood Cells',
      aliquot: '01',
      reconReason: null,
      reasonCdDesc: null,
      reconDetail: null,
      collDate: '15-DEC-2023',
    },
    {
      batchId: 'BATCH001',
      unitId: 'UNIT002345678',
      chkDigit: '34',
      productCode: null,
      productCodeDesc: null,
      aliquot: null,
      reconReason: null,
      reasonCdDesc: null,
      reconDetail: null,
      collDate: '16-DEC-2023',
    },
  ];

  const mockDialogData: AddReconciliationReasonDialogData = {
    reasonCodes: mockReasonCodes,
    selectedUnits: mockSelectedUnits,
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close'], {
      _containerInstance: { _elementRef: { nativeElement: document.createElement('div') } },
    });

    await TestBed.configureTestingModule({
      imports: [AddReconciliationReasonDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddReconciliationReasonDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with empty values', () => {
      expect(component.form.get('reconReason')?.value).toBe('');
      expect(component.form.get('reconDetail')?.value).toBe('');
    });

    it('should display correct selected unit count', () => {
      expect(component.selectedUnitCount).toBe(2);

      const subtitle = fixture.debugElement.query(By.css('.dialog-subtitle'));
      expect(subtitle.nativeElement.textContent).toContain('2 Unit IDs selected');
    });

    it('should display singular "Unit ID" when only one selected', () => {
      component.data.selectedUnits = [mockSelectedUnits[0]];
      fixture.detectChanges();

      const subtitle = fixture.debugElement.query(By.css('.dialog-subtitle'));
      expect(subtitle.nativeElement.textContent).toContain('1 Unit ID selected');
    });

    it('should set maxDetailLength to 240', () => {
      expect(component.maxDetailLength).toBe(240);
    });
  });

  describe('Form Validation', () => {
    it('should mark reconReason as required', () => {
      const control = component.form.get('reconReason');
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should validate maxlength for reconDetail', () => {
      const control = component.form.get('reconDetail');
      const longText = 'a'.repeat(241);
      control?.setValue(longText);

      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should accept reconDetail within maxlength', () => {
      const control = component.form.get('reconDetail');
      const validText = 'a'.repeat(240);
      control?.setValue(validText);

      expect(control?.hasError('maxlength')).toBeFalse();
    });

    it('should be valid when reconReason is set', () => {
      component.form.patchValue({ reconReason: 'DMGD' });
      expect(component.form.valid).toBeTrue();
    });
  });

  describe('Reason Codes Dropdown', () => {
    it('should display all reason codes', () => {
      const select = fixture.debugElement.query(By.css('mat-select'));
      select.nativeElement.click();
      fixture.detectChanges();

      const options = document.querySelectorAll('mat-option');
      expect(options.length).toBe(3);
    });

    it('should format reason code display correctly', () => {
      const formatted = component.formatReasonCode(mockReasonCodes[0]);
      expect(formatted).toBe('DMGD - Damaged during transport');
    });
  });

  describe('Selected Code Description', () => {
    it('should return empty string when no code selected', () => {
      expect(component.selectedCodeDescription).toBe('');
    });

    it('should return description when code is selected', () => {
      component.form.patchValue({ reconReason: 'DMGD' });
      expect(component.selectedCodeDescription).toBe('Damaged during transport');
    });

    it('should return empty string when code not found in list', () => {
      component.form.patchValue({ reconReason: 'UNKNOWN' });
      expect(component.selectedCodeDescription).toBe('');
    });
  });

  describe('Character Count', () => {
    it('should display 0 characters initially', () => {
      expect(component.detailCharCount).toBe(0);
    });

    it('should update character count as user types', () => {
      component.form.patchValue({ reconDetail: 'Test details' });
      expect(component.detailCharCount).toBe(12);
    });

    it('should display character count in hint', () => {
      component.form.patchValue({ reconDetail: 'Test' });
      fixture.detectChanges();

      const hint = fixture.debugElement.query(By.css('mat-hint'));
      expect(hint.nativeElement.textContent.trim()).toContain('236/240');
    });
  });

  describe('Cancel Action', () => {
    it('should close dialog with null on cancel', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
    });
  });

  describe('Add Action', () => {
    it('should set submitted flag when attempting to submit', () => {
      component.onAdd();
      expect(component.submitted()).toBeTrue();
    });

    it('should not submit when form is invalid', () => {
      component.onAdd();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should submit when form is valid', () => {
      component.form.patchValue({
        reconReason: 'DMGD',
        reconDetail: 'Test details',
      });

      component.onAdd();

      const expectedResult: AddReconciliationReasonDialogResult = {
        reconReason: 'DMGD',
        reconDetail: 'Test details',
      };

      expect(dialogRefSpy.close).toHaveBeenCalledWith(expectedResult);
    });

    it('should submit with empty reconDetail if not provided', () => {
      component.form.patchValue({
        reconReason: 'EXPD',
      });

      component.onAdd();

      const expectedResult: AddReconciliationReasonDialogResult = {
        reconReason: 'EXPD',
        reconDetail: '',
      };

      expect(dialogRefSpy.close).toHaveBeenCalledWith(expectedResult);
    });
  });

  describe('Error Messages', () => {
    it('should show required error for reconReason', () => {
      component.form.get('reconReason')?.markAsTouched();
      fixture.detectChanges();

      const error = fixture.debugElement.query(By.css('mat-error'));
      expect(error.nativeElement.textContent.trim()).toBe('Reconciliation Code is required');
    });
  });

  describe('Form Controls', () => {
    it('should expose form controls via f getter', () => {
      expect(component.f['reconReason']).toBeDefined();
      expect(component.f['reconDetail']).toBeDefined();
    });
  });
});
