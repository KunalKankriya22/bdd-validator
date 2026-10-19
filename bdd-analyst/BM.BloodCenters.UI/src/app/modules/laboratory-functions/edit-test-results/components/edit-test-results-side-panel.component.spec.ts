import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { EditTestResultsSidePanelComponent, DropdownOption } from './edit-test-results-side-panel.component';
import { UnitTestResultDto } from '../models/edit-test-results.model';

describe('EditTestResultsSidePanelComponent', () => {
  let component: EditTestResultsSidePanelComponent;
  let fixture: ComponentFixture<EditTestResultsSidePanelComponent>;

  const mockTestData: UnitTestResultDto = {
    unitId: 'TEST001',
    testId: 'TST01',
    testSeqNo: 1,
    resultStatus1: 'POS',
    resultStatus2: undefined,
    testDesc: 'HIV Antibody Test',
    tbId: 'TB12345',
    absorbance: '0.06',
    ratio: '2.0',
    voidReason: 'BCMR'
  };

  const mockResultOptions: DropdownOption[] = [
    { code: 'NEG' }, { code: 'POS' }, { code: 'IND' }, { code: 'NR' }
  ];
  const mockEditReasonOptions: DropdownOption[] = [
    { code: 'BCMR' }, { code: 'LAB_ERROR' }, { code: 'RETEST' }, { code: 'OTHER' }
  ];

  beforeAll(async () => {

      await TestBed.configureTestingModule({
        teardown: { destroyAfterEach: false },
      imports: [EditTestResultsSidePanelComponent, NoopAnimationsModule]
    }).compileComponents();

    });

  beforeEach(() => {

    fixture = TestBed.createComponent(EditTestResultsSidePanelComponent);
    component = fixture.componentInstance;

    component.testData = mockTestData;
    component.resultOptions = mockResultOptions;
    component.editReasonOptions = mockEditReasonOptions;

    fixture.detectChanges();

    // Manually trigger ngOnChanges since direct property setting does not trigger it
    component.ngOnChanges({
      testData: new SimpleChange(null, mockTestData, true),
      resultOptions: new SimpleChange(null, mockResultOptions, true),
      editReasonOptions: new SimpleChange(null, mockEditReasonOptions, true)
    });
    fixture.detectChanges();

    });

  describe('Initialization', () => {

    it('should initialize form with controls', () => {
      expect(component.form).toBeTruthy();
      expect(component.form.get('resultStatus1')).toBeTruthy();
      expect(component.form.get('voidReason')).toBeTruthy();
    });

    it('should populate form when testData is provided', () => {
      expect(component.form.get('resultStatus1')?.value).toBe('POS');
      expect(component.form.get('voidReason')?.value).toBe('BCMR');
      expect(component.form.get('testSeqNo')?.value).toBe(1);
    });
  });

  describe('Display Test Information', () => {
    it('should display readonly test ID', () => {
      const testIdValue = fixture.debugElement.query(
        By.css('[aria-labelledby*="testId"]')
      );
      expect(testIdValue.nativeElement.textContent.trim()).toBe('TST01');
    });

    it('should display readonly sequence', () => {
      const seqValue = fixture.debugElement.query(
        By.css('[aria-labelledby*="sequence"]')
      );
      expect(seqValue.nativeElement.textContent.trim()).toBe('1');
    });

    it('should display Abs/Val/Chan value', () => {
      // When absorbance has a value, the field is rendered as an editable input
      expect(component.form.get('absorbance')?.value).toBe('0.06');
    });

    it('should display Ratio value', () => {
      // When ratio has a value, the field is rendered as an editable input
      expect(component.form.get('ratio')?.value).toBe('2.0');
    });

    it('should display readonly Test Batch ID', () => {
      const tbIdValue = fixture.debugElement.query(
        By.css('[aria-labelledby*="testBatchId"]')
      );
      expect(tbIdValue.nativeElement.textContent.trim()).toBe('TB12345');
    });

    it('should show placeholder for missing values', () => {
      component.testData = {
        ...mockTestData,
        absorbance: undefined,
        ratio: undefined
      };
      component.ngOnChanges({
        testData: new SimpleChange(mockTestData, component.testData, false)
      });
      fixture.detectChanges();

      const absorbanceValue = fixture.debugElement.query(
        By.css('[aria-labelledby*="absorbance"]')
      );
      expect(absorbanceValue.nativeElement.textContent.trim()).toBe('–');
    });
  });

  describe('Form Validation', () => {
    it('should require resultStatus1', () => {
      const control = component.form.get('resultStatus1');
      control?.setValue('');
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require voidReason', () => {
      const control = component.form.get('voidReason');
      control?.setValue('');
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should validate maxlength for resultStatus1', () => {
      const control = component.form.get('resultStatus1');
      control?.setValue('12345678901'); // 11 chars
      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should show error message when resultStatus1 is touched and empty', () => {
      const control = component.form.get('resultStatus1');
      control?.markAsTouched();
      control?.setValue('');
      fixture.detectChanges();

      const error = fixture.debugElement.query(By.css('mat-error'));
      expect(error).toBeTruthy();
      expect(error.nativeElement.textContent).toContain('Result is required');
    });
  });

  describe('CLEAR ALL Button', () => {
    it('should preserve testSeqNo after clear', () => {
      component.form.patchValue({
        resultStatus1: 'NEG',
        voidReason: 'LAB_ERROR'
      });

      component.onClearAll();

      expect(component.form.get('testSeqNo')?.value).toBe(1);
    });

    it('should reset form to pristine state', () => {
      component.form.patchValue({
        resultStatus1: 'NEG',
        voidReason: 'LAB_ERROR'
      });
      component.form.markAsDirty();

      component.onClearAll();

      expect(component.form.pristine).toBeTrue();
    });
  });

  describe('SAVE Button', () => {
    it('should set isSubmitting signal on save', () => {
      component.form.patchValue({
        resultStatus1: 'NEG',
        voidReason: 'LAB_ERROR'
      });

      component.onSave();

      expect(component.isSubmitting()).toBeTrue();
    });

    it('should mark all fields as touched on save attempt', () => {
      component.form.patchValue({
        resultStatus1: '',
        voidReason: ''
      });

      component.onSave();

      expect(component.form.get('resultStatus1')?.touched).toBeTrue();
      expect(component.form.get('voidReason')?.touched).toBeTrue();
    });
  });
  describe('Reset Methods', () => {
    it('should reset isSubmitting after successful save', () => {
      component.isSubmitting.set(true);
      component.resetFormAfterSave();
      expect(component.isSubmitting()).toBeFalse();
    });

    it('should reset isSubmitting after error', () => {
      component.isSubmitting.set(true);
      component.resetFormAfterError();
      expect(component.isSubmitting()).toBeFalse();
    });
  });
});
