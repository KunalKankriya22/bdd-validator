import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import {
  DeferralConfirmationDialogComponent,
  DeferralConfirmationDialogData,
  DeferralConfirmationDialogResult,
} from './deferral-confirmation-dialog';

describe('DeferralConfirmationDialogComponent', () => {
  let component: DeferralConfirmationDialogComponent;
  let fixture: ComponentFixture<DeferralConfirmationDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<DeferralConfirmationDialogComponent>>;

  const defaultDialogData: DeferralConfirmationDialogData = {
    deferralId: 'DEF001',
    donorId: 'DONOR123',
    donorName: 'John Smith',
    driveDate: '2024-06-15',
  };

  const mockDialogData: DeferralConfirmationDialogData = {
    deferralId: 'DEF12345',
    donorId: 'DON123',
    donorName: 'Marvin Rogers',
    driveDate: '2026-05-10',
  };

  function createComponent(data: DeferralConfirmationDialogData = defaultDialogData) {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [DeferralConfirmationDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });

    fixture = TestBed.createComponent(DeferralConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    createComponent();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should inject dialog data correctly', () => {
    expect(component.data).toEqual(defaultDialogData);
  });

  it('should display data from MAT_DIALOG_DATA', () => {
    expect(component.data.deferralId).toBe('DEF001');
    expect(component.data.donorId).toBe('DONOR123');
    expect(component.data.donorName).toBe('John Smith');
  });

  it('should initialize confirmDeferralIdControl as empty with required validator', () => {
    expect(component.confirmDeferralIdControl.value).toBe('');
    expect(component.confirmDeferralIdControl.hasError('required')).toBe(true);
  });

  it('should initialize canConfirm as false', () => {
    expect(component.canConfirm()).toBe(false);
  });

  describe('canConfirm signal', () => {
    it('should be true when a non-empty value is entered', () => {
      component.confirmDeferralIdControl.setValue('DEF');
      expect(component.canConfirm()).toBe(true);
    });

    it('should be false when value is empty string', () => {
      component.confirmDeferralIdControl.setValue('');
      expect(component.canConfirm()).toBe(false);
    });

    it('should be false when value is only whitespace', () => {
      component.confirmDeferralIdControl.setValue('   ');
      expect(component.canConfirm()).toBe(false);
    });

    it('should be true after entering and then changing text', () => {
      component.confirmDeferralIdControl.setValue('DEF12345');
      expect(component.canConfirm()).toBe(true);
      component.confirmDeferralIdControl.setValue('DEF');
      expect(component.canConfirm()).toBe(true);
    });
  });

  describe('hasError computed', () => {
    it('should be true when required error is present', () => {
      component.confirmDeferralIdControl.markAsTouched();
      expect(component.hasError()).toBe(true);
    });

    it('should be true when mismatch error is present', () => {
      component.confirmDeferralIdControl.setErrors({ mismatch: true });
      expect(component.hasError()).toBe(true);
    });

    it('should reflect current control error state', () => {
      component.confirmDeferralIdControl.setValue('DEF12345');
      component.confirmDeferralIdControl.setErrors(null);
      const result = component.confirmDeferralIdControl.hasError('required') || component.confirmDeferralIdControl.hasError('mismatch');
      expect(result).toBe(false);
    });
  });

  describe('valueChanges subscription', () => {
    it('should clear mismatch error when user types a new value', () => {
      // Set mismatch error
      component.confirmDeferralIdControl.setErrors({ mismatch: true });
      expect(component.confirmDeferralIdControl.hasError('mismatch')).toBe(true);

      // Type a new value
      component.confirmDeferralIdControl.setValue('NEW');

      // Mismatch error should be cleared
      expect(component.confirmDeferralIdControl.hasError('mismatch')).toBe(false);
    });
  });

  describe('onConfirm', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      createComponent(mockDialogData);
    });

    it('should close dialog with confirmed: true when IDs match exactly', () => {
      component.confirmDeferralIdControl.setValue('DEF12345');

      component.onConfirm();

      expect(dialogRefSpy.close).toHaveBeenCalledWith(
        { confirmed: true } as DeferralConfirmationDialogResult,
      );
    });

    it('should close dialog with confirmed: true when IDs match case-insensitively', () => {
      component.confirmDeferralIdControl.setValue('def12345');

      component.onConfirm();

      expect(dialogRefSpy.close).toHaveBeenCalledWith(
        { confirmed: true } as DeferralConfirmationDialogResult,
      );
    });

    it('should close dialog with confirmed: true when IDs match with leading/trailing spaces', () => {
      component.confirmDeferralIdControl.setValue('  DEF12345  ');

      component.onConfirm();

      expect(dialogRefSpy.close).toHaveBeenCalledWith(
        { confirmed: true } as DeferralConfirmationDialogResult,
      );
    });

    it('should set mismatch error when IDs do not match (Error 16102)', () => {
      component.confirmDeferralIdControl.setValue('WRONG_ID');

      component.onConfirm();

      expect(component.confirmDeferralIdControl.hasError('mismatch')).toBe(true);
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should mark control as touched and not close when value is empty', () => {
      component.confirmDeferralIdControl.setValue('');

      component.onConfirm();

      expect(component.confirmDeferralIdControl.touched).toBe(true);
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should mark control as touched and not close when value is null', () => {
      component.confirmDeferralIdControl.setValue(null);

      component.onConfirm();

      expect(component.confirmDeferralIdControl.touched).toBe(true);
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    it('should close dialog with confirmed: false', () => {
      component.onCancel();

      expect(dialogRefSpy.close).toHaveBeenCalledWith(
        { confirmed: false } as DeferralConfirmationDialogResult,
      );
    });
  });

  describe('template rendering', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      createComponent(mockDialogData);
    });

    it('should display deferral ID in record details', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const highlightValue = compiled.querySelector('.value.highlight');
      expect(highlightValue?.textContent?.trim()).toBe('DEF12345');
    });

    it('should display donor ID when provided', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const detailRows = compiled.querySelectorAll('.detail-row');
      const donorIdRow = Array.from(detailRows).find(
        (row) => row.querySelector('.label')?.textContent?.trim() === 'Donor ID:',
      );
      expect(donorIdRow?.querySelector('.value')?.textContent?.trim()).toBe('DON123');
    });

    it('should display donor name when provided', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const detailRows = compiled.querySelectorAll('.detail-row');
      const donorNameRow = Array.from(detailRows).find(
        (row) => row.querySelector('.label')?.textContent?.trim() === 'Donor Name:',
      );
      expect(donorNameRow?.querySelector('.value')?.textContent?.trim()).toBe('Marvin Rogers');
    });

    it('should display drive date when provided', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const detailRows = compiled.querySelectorAll('.detail-row');
      const driveDateRow = Array.from(detailRows).find(
        (row) => row.querySelector('.label')?.textContent?.trim() === 'Drive Date:',
      );
      expect(driveDateRow?.querySelector('.value')?.textContent?.trim()).toBe('2026-05-10');
    });

    it('should have confirm button disabled initially', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const confirmBtn = compiled.querySelector('.confirm-button') as HTMLButtonElement;
      expect(confirmBtn.disabled).toBe(true);
    });

    it('should enable confirm button when value is entered', () => {
      component.confirmDeferralIdControl.setValue('DEF12345');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const confirmBtn = compiled.querySelector('.confirm-button') as HTMLButtonElement;
      expect(confirmBtn.disabled).toBe(false);
    });
  });

  describe('with null optional data', () => {
    let nullDataFixture: ComponentFixture<DeferralConfirmationDialogComponent>;
    let nullDataComponent: DeferralConfirmationDialogComponent;

    const nullDialogData: DeferralConfirmationDialogData = {
      deferralId: 'DEF99999',
      donorId: null,
      donorName: null,
      driveDate: null,
    };

    beforeEach(() => {
      TestBed.resetTestingModule();
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

      TestBed.configureTestingModule({
        imports: [DeferralConfirmationDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: nullDialogData },
          { provide: MatDialogRef, useValue: dialogRefSpy },
        ],
      });

      nullDataFixture = TestBed.createComponent(DeferralConfirmationDialogComponent);
      nullDataComponent = nullDataFixture.componentInstance;
      nullDataFixture.detectChanges();
    });

    it('should create component with null optional fields', () => {
      expect(nullDataComponent).toBeTruthy();
    });

    it('should not display donor ID row when donorId is null', () => {
      const compiled = nullDataFixture.nativeElement as HTMLElement;
      const detailRows = compiled.querySelectorAll('.detail-row');
      const donorIdRow = Array.from(detailRows).find(
        (row) => row.querySelector('.label')?.textContent?.trim() === 'Donor ID:',
      );
      expect(donorIdRow).toBeUndefined();
    });

    it('should not display donor name row when donorName is null', () => {
      const compiled = nullDataFixture.nativeElement as HTMLElement;
      const detailRows = compiled.querySelectorAll('.detail-row');
      const donorNameRow = Array.from(detailRows).find(
        (row) => row.querySelector('.label')?.textContent?.trim() === 'Donor Name:',
      );
      expect(donorNameRow).toBeUndefined();
    });

    it('should not display drive date row when driveDate is null', () => {
      const compiled = nullDataFixture.nativeElement as HTMLElement;
      const detailRows = compiled.querySelectorAll('.detail-row');
      const driveDateRow = Array.from(detailRows).find(
        (row) => row.querySelector('.label')?.textContent?.trim() === 'Drive Date:',
      );
      expect(driveDateRow).toBeUndefined();
    });

    it('should still allow confirmation with matching ID', () => {
      nullDataComponent.confirmDeferralIdControl.setValue('DEF99999');
      nullDataComponent.onConfirm();
      expect(dialogRefSpy.close).toHaveBeenCalledWith({ confirmed: true });
    });
  });
});
