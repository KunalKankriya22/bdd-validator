import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BleedTimeDetailsDialog } from './bleed-time-details-dialog';
import {
  BleedTimeDetailsDialogData,
  ArmUsedValue,
} from '../../../modules/donor-functions/donor-functions-components/donor-registration/models/donor-registration.model';

describe('BleedTimeDetailsDialog', () => {
  let component: BleedTimeDetailsDialog;
  let fixture: ComponentFixture<BleedTimeDetailsDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<BleedTimeDetailsDialog>>;

  const defaultData: BleedTimeDetailsDialogData = {
    employees: [{ staffNo: 'E001', employeeName: 'John Doe' }],
    selectedArm: '' as ArmUsedValue,
    doubleStickId: 'N',
    currentDriveDate: '2026-01-15',
    leftArm: {
      startTime1: '', startPhleb1: '', endTime1: '', endPhleb1: '',
      startTime2: '', startPhleb2: '', endTime2: '', endPhleb2: '',
    },
    rightArm: {
      startTime1: '', startPhleb1: '', endTime1: '', endPhleb1: '',
      startTime2: '', startPhleb2: '', endTime2: '', endPhleb2: '',
    },
    other: {
      startTime1: '', startPhleb1: '', endTime1: '', endPhleb1: '',
      startTime2: '', startPhleb2: '', endTime2: '', endPhleb2: '',
    },
    drawStartTime: '',
    mrsLoss: '',
    phlebotomistLoss: '',
  };

  const createComponent = (data: Partial<BleedTimeDetailsDialogData> = {}) => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    const mergedData = { ...defaultData, ...data };

    TestBed.configureTestingModule({
      imports: [BleedTimeDetailsDialog, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mergedData },
      ],
    });

    fixture = TestBed.createComponent(BleedTimeDetailsDialog);
    component = fixture.componentInstance;
    try {
      fixture.detectChanges();
    } catch (_) {
      // Template may reference elements not available in unit test
    }
  };

  // -------------------------------------------------------
  // 1. Component creation
  // -------------------------------------------------------
  describe('Component creation', () => {
    beforeEach(() => createComponent());

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have a form defined', () => {
      expect(component.form).toBeTruthy();
    });
  });

  // -------------------------------------------------------
  // 2. Constructor - initializes form from data
  // -------------------------------------------------------
  describe('Constructor', () => {
    it('should initialize employees from data', () => {
      createComponent({ employees: [{ staffNo: 'S1', employeeName: 'Alice' }] });
      expect(component.employees.length).toBe(1);
      expect(component.employees[0].staffNo).toBe('S1');
    });

    it('should default employees to empty array when not provided', () => {
      createComponent({ employees: undefined as any });
      expect(component.employees).toEqual([]);
    });

    it('should set selectedArm from data', () => {
      createComponent({ selectedArm: 'L' });
      expect(component.selectedArm).toBe('L');
    });

    it('should default selectedArm to empty string when not provided', () => {
      createComponent({ selectedArm: undefined as any });
      expect(component.selectedArm).toBe('');
    });

    it('should initialize form fields from left arm data', () => {
      createComponent({
        selectedArm: 'L',
        leftArm: {
          startTime1: '08:30', startPhleb1: 'ABC', endTime1: '09:00', endPhleb1: 'DEF',
          startTime2: '', startPhleb2: '', endTime2: '', endPhleb2: '',
        },
      });
      expect(component.form.get('leftStartTime1')?.value).toBe('08:30');
      expect(component.form.get('leftStartPhleb1')?.value).toBe('ABC');
      expect(component.form.get('leftEndTime1')?.value).toBe('09:00');
    });

    it('should initialize doubleStickId from data', () => {
      createComponent({ doubleStickId: 'Y' });
      expect(component.form.get('doubleStickId')?.value).toBe('Y');
    });

    it('should apply arm selection enabling left fields for L', () => {
      createComponent({ selectedArm: 'L' });
      expect(component.isLeftEnabled).toBe(true);
      expect(component.isRightEnabled).toBe(false);
      expect(component.isOtherEnabled).toBe(false);
    });

    it('should apply arm selection enabling both fields for B', () => {
      createComponent({ selectedArm: 'B' });
      expect(component.isLeftEnabled).toBe(true);
      expect(component.isRightEnabled).toBe(true);
      expect(component.isOtherEnabled).toBe(false);
    });
  });

  // -------------------------------------------------------
  // 3. formatTimeOnBlur
  // -------------------------------------------------------
  describe('formatTimeOnBlur', () => {
    beforeEach(() => createComponent({ selectedArm: 'L' }));

    it('should leave already-formatted time unchanged', () => {
      component.form.get('leftStartTime1')?.setValue('08:30');
      component.formatTimeOnBlur('leftStartTime1');
      expect(component.form.get('leftStartTime1')?.value).toBe('08:30');
    });

    it('should format 3-digit input with leading zero', () => {
      component.form.get('leftStartTime1')?.setValue('830');
      component.formatTimeOnBlur('leftStartTime1');
      expect(component.form.get('leftStartTime1')?.value).toBe('08:30');
    });

    it('should format 4-digit input by inserting colon', () => {
      component.form.get('leftStartTime1')?.setValue('1430');
      component.formatTimeOnBlur('leftStartTime1');
      expect(component.form.get('leftStartTime1')?.value).toBe('14:30');
    });

    it('should not modify value with invalid/short input', () => {
      component.form.get('leftStartTime1')?.setValue('12');
      component.formatTimeOnBlur('leftStartTime1');
      // Only 2 digits, does not reach the 3 or 4-digit branch so value stays as-is
      expect(component.form.get('leftStartTime1')?.value).toBe('12');
    });

    it('should do nothing for a non-existent control', () => {
      expect(() => component.formatTimeOnBlur('nonExistentField')).not.toThrow();
    });
  });

  // -------------------------------------------------------
  // 4. onPhlebBlur
  // -------------------------------------------------------
  describe('onPhlebBlur', () => {
    beforeEach(() => createComponent({ selectedArm: 'L' }));

    it('should convert phlebotomist value to uppercase', () => {
      component.form.get('leftStartPhleb1')?.setValue('abc');
      component.onPhlebBlur('leftStartPhleb1');
      expect(component.form.get('leftStartPhleb1')?.value).toBe('ABC');
    });

    it('should leave already uppercase value unchanged', () => {
      component.form.get('leftStartPhleb1')?.setValue('XYZ');
      component.onPhlebBlur('leftStartPhleb1');
      expect(component.form.get('leftStartPhleb1')?.value).toBe('XYZ');
    });

    it('should not throw for empty value', () => {
      component.form.get('leftStartPhleb1')?.setValue('');
      expect(() => component.onPhlebBlur('leftStartPhleb1')).not.toThrow();
    });
  });

  // -------------------------------------------------------
  // 5. onDoubleStickChange
  // -------------------------------------------------------
  describe('onDoubleStickChange', () => {
    it('should enable second-stick left fields when Y and arm is L', () => {
      createComponent({ selectedArm: 'L', doubleStickId: 'N' });
      component.form.get('doubleStickId')?.setValue('Y');
      component.onDoubleStickChange();
      expect(component.form.get('leftStartTime2')?.enabled).toBe(true);
      expect(component.form.get('leftEndTime2')?.enabled).toBe(true);
    });

    it('should enable second-stick right fields when Y and arm is R', () => {
      createComponent({ selectedArm: 'R', doubleStickId: 'N' });
      component.form.get('doubleStickId')?.setValue('Y');
      component.onDoubleStickChange();
      expect(component.form.get('rightStartTime2')?.enabled).toBe(true);
      expect(component.form.get('rightEndTime2')?.enabled).toBe(true);
    });

    it('should enable both second-stick fields when Y and arm is B', () => {
      createComponent({ selectedArm: 'B', doubleStickId: 'N' });
      component.form.get('doubleStickId')?.setValue('Y');
      component.onDoubleStickChange();
      expect(component.form.get('leftStartTime2')?.enabled).toBe(true);
      expect(component.form.get('rightStartTime2')?.enabled).toBe(true);
    });

    it('should disable and clear second-stick fields when set to N', () => {
      createComponent({ selectedArm: 'B', doubleStickId: 'Y' });
      // Ensure the second stick fields have values
      component.form.get('leftStartTime2')?.setValue('10:00');
      component.form.get('rightStartTime2')?.setValue('11:00');

      component.form.get('doubleStickId')?.setValue('N');
      component.onDoubleStickChange();

      expect(component.form.get('leftStartTime2')?.value).toBe('');
      expect(component.form.get('rightStartTime2')?.value).toBe('');
      expect(component.form.get('leftStartTime2')?.disabled).toBe(true);
      expect(component.form.get('rightStartTime2')?.disabled).toBe(true);
    });
  });

  // -------------------------------------------------------
  // 6. onArmSelectionChange
  // -------------------------------------------------------
  describe('onArmSelectionChange', () => {
    beforeEach(() => createComponent());

    it('should enable left fields and disable right/other for L', () => {
      component.onArmSelectionChange('L');
      expect(component.selectedArm).toBe('L');
      expect(component.isLeftEnabled).toBe(true);
      expect(component.isRightEnabled).toBe(false);
      expect(component.isOtherEnabled).toBe(false);
      expect(component.form.get('leftStartTime1')?.enabled).toBe(true);
      expect(component.form.get('rightStartTime1')?.disabled).toBe(true);
      expect(component.form.get('otherTime')?.disabled).toBe(true);
    });

    it('should enable right fields and disable left/other for R', () => {
      component.onArmSelectionChange('R');
      expect(component.selectedArm).toBe('R');
      expect(component.isLeftEnabled).toBe(false);
      expect(component.isRightEnabled).toBe(true);
      expect(component.isOtherEnabled).toBe(false);
      expect(component.form.get('rightStartTime1')?.enabled).toBe(true);
      expect(component.form.get('leftStartTime1')?.disabled).toBe(true);
    });

    it('should enable both left and right fields for B', () => {
      component.onArmSelectionChange('B');
      expect(component.selectedArm).toBe('B');
      expect(component.isLeftEnabled).toBe(true);
      expect(component.isRightEnabled).toBe(true);
      expect(component.isOtherEnabled).toBe(false);
      expect(component.form.get('leftStartTime1')?.enabled).toBe(true);
      expect(component.form.get('rightStartTime1')?.enabled).toBe(true);
    });

    it('should enable other fields and disable left/right for O', () => {
      component.onArmSelectionChange('O');
      expect(component.selectedArm).toBe('O');
      expect(component.isLeftEnabled).toBe(false);
      expect(component.isRightEnabled).toBe(false);
      expect(component.isOtherEnabled).toBe(true);
      expect(component.form.get('otherTime')?.enabled).toBe(true);
      expect(component.form.get('leftStartTime1')?.disabled).toBe(true);
      expect(component.form.get('rightStartTime1')?.disabled).toBe(true);
    });
  });

  // -------------------------------------------------------
  // 7. hasTimeErrors
  // -------------------------------------------------------
  describe('hasTimeErrors', () => {
    beforeEach(() => createComponent({ selectedArm: 'L' }));

    it('should return false when there are no time errors', () => {
      component.form.get('leftStartTime1')?.setValue('08:30');
      expect(component.hasTimeErrors()).toBe(false);
    });

    it('should return true when an enabled time field has a pattern error and is touched', () => {
      const ctrl = component.form.get('leftStartTime1');
      ctrl?.setValue('99:99');
      ctrl?.markAsTouched();
      expect(component.hasTimeErrors()).toBe(true);
    });

    it('should return false when time field has pattern error but is not touched', () => {
      const ctrl = component.form.get('leftStartTime1');
      ctrl?.setValue('99:99');
      ctrl?.markAsUntouched();
      expect(component.hasTimeErrors()).toBe(false);
    });

    it('should return false when time field has pattern error but is disabled', () => {
      // Right arm fields are disabled when selectedArm is L
      const ctrl = component.form.get('rightStartTime1');
      ctrl?.setValue('99:99');
      ctrl?.markAsTouched();
      expect(component.hasTimeErrors()).toBe(false);
    });
  });

  // -------------------------------------------------------
  // 8. onApply
  // -------------------------------------------------------
  describe('onApply', () => {
    it('should close dialog with apply result when no time errors', () => {
      createComponent({ selectedArm: 'L' });
      component.form.get('leftStartTime1')?.setValue('08:30');
      component.onApply();
      expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
      const result = dialogRefSpy.close.calls.mostRecent().args[0];
      expect(result.action).toBe('apply');
      expect(result.selectedArm).toBe('L');
      expect(result.data).toBeDefined();
    });

    it('should not close dialog when there are time errors', () => {
      createComponent({ selectedArm: 'L' });
      component.form.get('leftStartTime1')?.setValue('99:99');
      component.onApply();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should auto-format time fields before checking errors', () => {
      createComponent({ selectedArm: 'L' });
      component.form.get('leftStartTime1')?.setValue('830');
      component.onApply();
      expect(component.form.get('leftStartTime1')?.value).toBe('08:30');
      expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------
  // 9. onClearAll
  // -------------------------------------------------------
  describe('onClearAll', () => {
    beforeEach(() => createComponent({
      selectedArm: 'L',
      leftArm: {
        startTime1: '08:30', startPhleb1: 'ABC', endTime1: '09:00', endPhleb1: 'DEF',
        startTime2: '', startPhleb2: '', endTime2: '', endPhleb2: '',
      },
    }));

    it('should reset form values', () => {
      component.onClearAll();
      expect(component.form.get('leftStartTime1')?.value).toBeFalsy();
      expect(component.form.get('leftStartPhleb1')?.value).toBeFalsy();
    });

    it('should preserve the current arm selection', () => {
      component.onArmSelectionChange('L');
      component.onClearAll();
      expect(component.selectedArm).toBe('L');
      expect(component.isLeftEnabled).toBe(true);
    });

    it('should mark form as pristine and untouched', () => {
      component.form.markAsDirty();
      component.form.markAsTouched();
      component.onClearAll();
      expect(component.form.pristine).toBe(true);
      expect(component.form.untouched).toBe(true);
    });

    it('should restore currentDriveDate after reset', () => {
      component.onClearAll();
      expect(component.form.get('currentDriveDate')?.value).toBe('2026-01-15');
    });
  });

  // -------------------------------------------------------
  // 10. onClose
  // -------------------------------------------------------
  describe('onClose', () => {
    beforeEach(() => createComponent());

    it('should close dialog with cancel action', () => {
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
      const result = dialogRefSpy.close.calls.mostRecent().args[0];
      expect(result.action).toBe('cancel');
    });

    it('should not include data in cancel result', () => {
      component.onClose();
      const result = dialogRefSpy.close.calls.mostRecent().args[0];
      expect(result.data).toBeUndefined();
    });
  });

  // -------------------------------------------------------
  // 11. initForm null-coalescing branches
  // -------------------------------------------------------
  describe('initForm null-coalescing fallbacks', () => {
    it('should default all left arm fields to empty string when leftArm is undefined', () => {
      createComponent({ selectedArm: 'L', leftArm: undefined as any });
      expect(component.form.get('leftStartTime1')?.value).toBe('');
      expect(component.form.get('leftStartPhleb1')?.value).toBe('');
      expect(component.form.get('leftEndTime1')?.value).toBe('');
      expect(component.form.get('leftEndPhleb1')?.value).toBe('');
      expect(component.form.get('leftStartTime2')?.value).toBe('');
      expect(component.form.get('leftStartPhleb2')?.value).toBe('');
      expect(component.form.get('leftEndTime2')?.value).toBe('');
      expect(component.form.get('leftEndPhleb2')?.value).toBe('');
    });

    it('should default all right arm fields to empty string when rightArm is undefined', () => {
      createComponent({ selectedArm: 'R', rightArm: undefined as any });
      expect(component.form.get('rightStartTime1')?.value).toBe('');
      expect(component.form.get('rightStartPhleb1')?.value).toBe('');
      expect(component.form.get('rightEndTime1')?.value).toBe('');
      expect(component.form.get('rightEndPhleb1')?.value).toBe('');
    });

    it('should default other fields to empty string when other is undefined', () => {
      createComponent({ selectedArm: 'O', other: undefined as any });
      expect(component.form.get('otherTime')?.value).toBe('');
      expect(component.form.get('otherPhleb')?.value).toBe('');
      expect(component.form.get('otherEndTime')?.value).toBe('');
    });

    it('should default doubleStickId to N when undefined', () => {
      createComponent({ doubleStickId: undefined as any });
      expect(component.form.get('doubleStickId')?.value).toBe('N');
    });

    it('should default currentDriveDate to empty string when undefined', () => {
      createComponent({ currentDriveDate: undefined as any });
      expect(component.form.get('currentDriveDate')?.value).toBe('');
    });

    it('should default drawStartTime to empty string when undefined', () => {
      createComponent({ drawStartTime: undefined as any });
      expect(component.form.get('drawStartTime')?.value).toBe('');
    });

    it('should default mrsLoss and phlebotomistLoss to empty string when undefined', () => {
      createComponent({ mrsLoss: undefined as any, phlebotomistLoss: undefined as any });
      expect(component.form.get('mrsLoss')?.value).toBe('');
      expect(component.form.get('phlebotomistLoss')?.value).toBe('');
    });
  });

  // -------------------------------------------------------
  // 12. applyArmSelection with doubleStick = Y
  // -------------------------------------------------------
  describe('applyArmSelection when doubleStick is Y', () => {
    it('should keep left second-stick fields enabled when arm is L and doubleStick is Y', () => {
      createComponent({ selectedArm: 'L', doubleStickId: 'Y' });
      expect(component.form.get('leftStartTime2')?.enabled).toBe(true);
      expect(component.form.get('leftEndTime2')?.enabled).toBe(true);
      expect(component.form.get('leftStartPhleb2')?.enabled).toBe(true);
      expect(component.form.get('leftEndPhleb2')?.enabled).toBe(true);
    });

    it('should keep right second-stick fields enabled when arm is R and doubleStick is Y', () => {
      createComponent({ selectedArm: 'R', doubleStickId: 'Y' });
      expect(component.form.get('rightStartTime2')?.enabled).toBe(true);
      expect(component.form.get('rightEndTime2')?.enabled).toBe(true);
      expect(component.form.get('rightStartPhleb2')?.enabled).toBe(true);
      expect(component.form.get('rightEndPhleb2')?.enabled).toBe(true);
    });

    it('should keep both left and right second-stick fields enabled when arm is B and doubleStick is Y', () => {
      createComponent({ selectedArm: 'B', doubleStickId: 'Y' });
      expect(component.form.get('leftStartTime2')?.enabled).toBe(true);
      expect(component.form.get('leftEndTime2')?.enabled).toBe(true);
      expect(component.form.get('rightStartTime2')?.enabled).toBe(true);
      expect(component.form.get('rightEndTime2')?.enabled).toBe(true);
    });

    it('should disable second-stick fields when arm changes from L to R while doubleStick is N', () => {
      createComponent({ selectedArm: 'L', doubleStickId: 'N' });
      component.onArmSelectionChange('R');
      expect(component.form.get('leftStartTime2')?.disabled).toBe(true);
      expect(component.form.get('leftEndTime2')?.disabled).toBe(true);
      expect(component.form.get('rightStartTime2')?.disabled).toBe(true);
      expect(component.form.get('rightEndTime2')?.disabled).toBe(true);
    });
  });

  // -------------------------------------------------------
  // 13. onDoubleStickChange when arm is O
  // -------------------------------------------------------
  describe('onDoubleStickChange with arm O', () => {
    it('should NOT enable any second-stick fields when arm is O and doubleStick is Y', () => {
      createComponent({ selectedArm: 'O', doubleStickId: 'N' });
      component.form.get('doubleStickId')?.setValue('Y');
      component.onDoubleStickChange();
      expect(component.form.get('leftStartTime2')?.disabled).toBe(true);
      expect(component.form.get('leftEndTime2')?.disabled).toBe(true);
      expect(component.form.get('rightStartTime2')?.disabled).toBe(true);
      expect(component.form.get('rightEndTime2')?.disabled).toBe(true);
    });
  });

  // -------------------------------------------------------
  // 14. formatTimeOnBlur with 5+ digit input
  // -------------------------------------------------------
  describe('formatTimeOnBlur edge cases', () => {
    beforeEach(() => createComponent({ selectedArm: 'L' }));

    it('should not format value when stripped digits are 5 or more characters', () => {
      component.form.get('leftStartTime1')?.setValue('12345');
      component.formatTimeOnBlur('leftStartTime1');
      // 5 digits: does not match 3-digit or 4-digit branch, value is unchanged (stripped)
      expect(component.form.get('leftStartTime1')?.value).toBe('12345');
    });

    it('should not format value when stripped digits are 1 character', () => {
      component.form.get('leftStartTime1')?.setValue('5');
      component.formatTimeOnBlur('leftStartTime1');
      expect(component.form.get('leftStartTime1')?.value).toBe('5');
    });

    it('should handle empty/null value without error', () => {
      component.form.get('leftStartTime1')?.setValue(null);
      expect(() => component.formatTimeOnBlur('leftStartTime1')).not.toThrow();
    });
  });

  // -------------------------------------------------------
  // 15. onPhlebBlur when control does not exist
  // -------------------------------------------------------
  describe('onPhlebBlur edge cases', () => {
    beforeEach(() => createComponent({ selectedArm: 'L' }));

    it('should not throw when control does not exist', () => {
      expect(() => component.onPhlebBlur('nonExistentControl')).not.toThrow();
    });
  });

  // -------------------------------------------------------
  // 16. toggleFields - explicit enable/disable paths
  // -------------------------------------------------------
  describe('toggleFields via arm selection changes', () => {
    it('should enable left fields then disable them on arm change', () => {
      createComponent({ selectedArm: 'L' });
      expect(component.form.get('leftStartTime1')?.enabled).toBe(true);
      expect(component.form.get('leftEndTime1')?.enabled).toBe(true);
      // Now switch to R - left fields should be disabled
      component.onArmSelectionChange('R');
      expect(component.form.get('leftStartTime1')?.disabled).toBe(true);
      expect(component.form.get('leftEndTime1')?.disabled).toBe(true);
      // And right fields should be enabled
      expect(component.form.get('rightStartTime1')?.enabled).toBe(true);
      expect(component.form.get('rightEndTime1')?.enabled).toBe(true);
    });

    it('should disable other fields when switching from O to L', () => {
      createComponent({ selectedArm: 'O' });
      expect(component.form.get('otherTime')?.enabled).toBe(true);
      expect(component.form.get('otherPhleb')?.enabled).toBe(true);
      component.onArmSelectionChange('L');
      expect(component.form.get('otherTime')?.disabled).toBe(true);
      expect(component.form.get('otherPhleb')?.disabled).toBe(true);
    });

    it('should enable other fields when switching from L to O', () => {
      createComponent({ selectedArm: 'L' });
      expect(component.form.get('otherTime')?.disabled).toBe(true);
      component.onArmSelectionChange('O');
      expect(component.form.get('otherTime')?.enabled).toBe(true);
      expect(component.form.get('otherEndTime')?.enabled).toBe(true);
      expect(component.form.get('otherPhleb')?.enabled).toBe(true);
    });
  });

  // -------------------------------------------------------
  // 17. hasTimeErrors - null control branch
  // -------------------------------------------------------
  describe('hasTimeErrors edge cases', () => {
    it('should return false when a time field control is removed from form', () => {
      createComponent({ selectedArm: 'L' });
      // Remove a time field control to trigger the null branch
      component.form.removeControl('leftStartTime1');
      expect(component.hasTimeErrors()).toBe(false);
    });

    it('should still detect errors in remaining controls after one is removed', () => {
      createComponent({ selectedArm: 'L' });
      component.form.removeControl('leftStartTime1');
      // Set an error on another enabled field
      const ctrl = component.form.get('leftEndTime1');
      ctrl?.setValue('99:99');
      ctrl?.markAsTouched();
      expect(component.hasTimeErrors()).toBe(true);
    });
  });

  // -------------------------------------------------------
  // 18. onClearAll with currentDriveDate undefined
  // -------------------------------------------------------
  describe('onClearAll edge cases', () => {
    it('should set currentDriveDate to empty string when data has no currentDriveDate', () => {
      createComponent({ selectedArm: 'L', currentDriveDate: undefined as any });
      component.onClearAll();
      expect(component.form.get('currentDriveDate')?.value).toBe('');
    });
  });
});
