import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';

import {
  AddReconciliationReasonDialogComponent,
  AddReconciliationReasonDialogData,
} from './add-reconciliation-reason-dialog';
import { ReasonCodeDto, TransportDetailDto } from '../models/reconcile-transport-batch.model';

describe('AddReconciliationReasonDialogComponent', () => {
  let dialogSpy: any;
  let component: AddReconciliationReasonDialogComponent;
  let fixture: ComponentFixture<AddReconciliationReasonDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddReconciliationReasonDialogComponent>>;

  const mockReasonCodes: ReasonCodeDto[] = [
    { code: 'DMGD', description: 'Unit damaged during transport' },
    { code: 'LEAK', description: 'Leaking container' },
    { code: 'TEMP', description: 'Temperature out of range' },
  ];

  const mockSelectedUnits: TransportDetailDto[] = [
    {
      unitId: 'U123456789',
      checkDigit: '01',
      productCode: 'RBC001',
      aliquot: '01',
      collectionDate: '2026-05-15',
      expirationDate: '2026-06-15T23:59:00Z',
      reconReason: null,
      reasonDescription: null,
      reconDetail: null,
    },
    {
      unitId: 'U987654321',
      checkDigit: '02',
      productCode: 'PLT001',
      aliquot: '01',
      collectionDate: '2026-05-16',
      expirationDate: '2026-05-25T23:59:00Z',
      reconReason: null,
      reasonDescription: null,
      reconDetail: null,
    },
  ];

  const mockDialogData: AddReconciliationReasonDialogData = {
    reasonCodes: mockReasonCodes,
    selectedUnits: mockSelectedUnits,
  };

  beforeEach(() => {

    dialogSpy = jasmine.createSpyObj('MatDialogRef', ['close']);



      TestBed.configureTestingModule({
imports: [AddReconciliationReasonDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    });


    });



  beforeEach(() => {


      dialogSpy.close.calls.reset();


    dialogRefSpy = TestBed.inject(MatDialogRef) as jasmine.SpyObj<
      MatDialogRef<AddReconciliationReasonDialogComponent>
    >;

    fixture = TestBed.createComponent(AddReconciliationReasonDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Initialization', () => {

    it('should display correct selected unit count', () => {
      expect(component.selectedUnitCount).toBe(2);

      const subtitle = fixture.debugElement.query(By.css('.dialog-subtitle'));
      expect(subtitle.nativeElement.textContent).toContain('2 Unit IDs selected');
    });

    it('should display singular form for single unit', () => {
      const singleUnitData: AddReconciliationReasonDialogData = {
        ...mockDialogData,
        selectedUnits: [mockSelectedUnits[0]],
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddReconciliationReasonDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: singleUnitData },
        ],
      });

      const newFixture = TestBed.createComponent(AddReconciliationReasonDialogComponent);
      newFixture.detectChanges();

      const subtitle = newFixture.debugElement.query(By.css('.dialog-subtitle'));
      expect(subtitle.nativeElement.textContent).toContain('1 Unit ID selected');
    });

    it('should render all reason codes in dropdown', () => {
      expect(component.filteredReasonCodes().length).toBe(3);
    });
  });

  describe('Form Validation', () => {


    it('should show error when reconReason is touched and empty', () => {
      component.form.get('reconReason')?.markAsTouched();
      component.submitted.set(true);
      fixture.detectChanges();

      const error = fixture.debugElement.query(By.css('mat-error'));
      expect(error).toBeTruthy();
      expect(error.nativeElement.textContent).toContain('Reconciliation Code is required');
    });

    it('should validate maxlength for reconDetail', () => {
      const longText = 'a'.repeat(241);
      component.form.get('reconDetail')?.setValue(longText);

      expect(component.form.get('reconDetail')?.hasError('maxlength')).toBeTrue();
    });

    it('should accept reconDetail up to 240 characters', () => {
      const validText = 'a'.repeat(240);
      component.form.get('reconDetail')?.setValue(validText);

      expect(component.form.get('reconDetail')?.hasError('maxlength')).toBeFalse();
    });
  });

  describe('Computed Values', () => {
    it('should compute selected code description', () => {
      component.form.get('reconReason')?.setValue('DMGD');

      expect(component.selectedCodeDescription()).toBe('Unit damaged during transport');
    });


    it('should compute detail character count', () => {
      component.form.get('reconDetail')?.setValue('Test detail');

      expect(component.detailCharCount()).toBe(11);
    });

    it('should return 0 when detail is empty', () => {
      expect(component.detailCharCount()).toBe(0);
    });

    it('should display character count in hint', () => {
      component.form.get('reconDetail')?.setValue('Test');
      fixture.detectChanges();

      const hint = fixture.debugElement.query(By.css('mat-hint'));
      expect(hint.nativeElement.textContent).toContain('4/240');
    });
  });
  describe('Add Action', () => {


    it('should include empty string for reconDetail when not provided', () => {
      component.form.get('reconReason')?.setValue('TEMP');

      component.onAdd();

      expect(dialogRefSpy.close).toHaveBeenCalledWith({
        reconReason: 'TEMP',
        reconDetail: '',
      });
    });


  });
  describe('Display', () => {
    it('should show reason description when code selected', () => {
      component.form.get('reconReason')?.setValue('LEAK');
      fixture.detectChanges();

      const reasonField = fixture.debugElement.query(By.css('.reason-field__value'));
      expect(reasonField.nativeElement.textContent).toContain('Leaking container');
    });

    it('should show dash when no code selected', () => {
      fixture.detectChanges();

      const reasonField = fixture.debugElement.query(By.css('.reason-field__value'));
      expect(reasonField.nativeElement.textContent).toContain('-');
    });

  });
});
