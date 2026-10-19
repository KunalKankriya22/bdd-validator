import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import moment from 'moment';

import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';

import { ExtractDialogComponent } from './extract-dialog';
import { ExtractDialogData, ReExtractBatch } from '../rextract.model';

describe('ExtractDialogComponent', () => {
  let component: ExtractDialogComponent;
  let fixture: ComponentFixture<ExtractDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ExtractDialogComponent>>;

  const mockBatch: ReExtractBatch = {
    batchId: '0806-18-RG1001',
    contractId: 'MDWRG0097',
    resultParmId: 'R8216336',
    chapterId: 'CH01',
    insertDate: '06-26-2025 13:45:00',
    profileSetId: 'PROF1',
    profileSeqNo: 1,
    unitCount: 5
  };

  const mockDialogData: ExtractDialogData = {
    contractId: 'MDWRG0097',
    resultParmId: 'R8216336',
    selectedBatch: mockBatch,
    batches: [mockBatch]
  };

  beforeEach(() => {

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);



      TestBed.configureTestingModule({
      imports: [ExtractDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    })
      .overrideComponent(ExtractDialogComponent, {
        set: {
          providers: [
            { provide: DateAdapter, useClass: MomentDateAdapter },
            { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
          ]
        }
      });


    


      dialogRefSpy.close.calls.reset();


    fixture = TestBed.createComponent(ExtractDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Initialization', () => {


    it('should initialize form with current date and time', () => {
      const now = moment();
      const extractDate = component.form.get('extractDate')?.value;
      const extractTime = component.form.get('extractTime')?.value;

      expect(moment(extractDate).isSame(now, 'day')).toBeTrue();
      expect(extractTime).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should default Generate RSM Report checkbox to checked', () => {
      expect(component.form.get('generateRsmReport')?.value).toBeTrue();
    });


  });

  describe('Form Validation', () => {
    it('should require extract date', () => {
      component.form.patchValue({ extractDate: null });
      fixture.detectChanges();

      expect(component.form.get('extractDate')?.hasError('required')).toBeTrue();
    });

    it('should require extract time', () => {
      component.form.patchValue({ extractTime: '' });
      fixture.detectChanges();

      expect(component.form.get('extractTime')?.hasError('required')).toBeTrue();
    });

    it('should validate time format (HH:mm)', () => {
      const timeControl = component.form.get('extractTime');

      timeControl?.setValue('25:00'); // Invalid hour
      expect(timeControl?.hasError('invalidTime')).toBeTrue();

      timeControl?.setValue('12:60'); // Invalid minute
      expect(timeControl?.hasError('invalidTime')).toBeTrue();

      timeControl?.setValue('14:30'); // Valid
      expect(timeControl?.valid).toBeTrue();
    });

    it('should show error when date field is invalid and touched', () => {
      component.form.get('extractDate')?.setValue(null);
      component.form.get('extractDate')?.markAsTouched();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('mat-error'));
      expect(errorElement).toBeTruthy();
      expect(errorElement.nativeElement.textContent).toContain('Date is required');
    });
  });

  describe('Set Current Time', () => {
    it('should set current date and time when button clicked', () => {
      const pastDate = moment().subtract(1, 'day');
      component.form.patchValue({
        extractDate: pastDate,
        extractTime: '10:00'
      });

      component.onSetCurrentTime();
      fixture.detectChanges();

      const now = moment();
      const updatedDate = component.form.get('extractDate')?.value;
      const updatedTime = component.form.get('extractTime')?.value;

      expect(moment(updatedDate).isSame(now, 'day')).toBeTrue();
      expect(updatedTime).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should mark form as touched after setting current time', () => {
      component.onSetCurrentTime();

      expect(component.form.touched).toBeTrue();
    });
  });

  describe('Extract Action', () => {




    it('should combine date and time correctly in ISO format', () => {
      const testDate = moment('2026-06-15');
      component.form.patchValue({
        extractDate: testDate,
        extractTime: '14:30',
        generateRsmReport: false
      });

      component.onExtract();

      const closeCall = dialogRefSpy.close.calls.mostRecent();
      const result = closeCall.args[0];

      expect(result.success).toBeTrue();
      expect(result.extractDate).toBeTruthy();
      expect(moment(result.extractDate).format('YYYY-MM-DD HH:mm')).toBe('2026-06-15 14:30');
    });


  });
  describe('Accessibility', () => {


    it('should have aria-invalid on invalid fields', () => {
      // Use the time field with an invalid, non-empty value ('25:00').
      // Angular Material v20's MatInput host binding removes aria-invalid
      // when (empty && required), so we must test with a non-empty invalid value
      // to get errorState=true instead of null.
      component.form.get('extractTime')?.setValue('25:00');
      component.form.get('extractTime')?.markAsTouched();
      fixture.detectChanges();

      const timeInput = fixture.debugElement.query(By.css('#' + component['elementId']('extractTime')));
      expect(timeInput.nativeElement.getAttribute('aria-invalid')).toBe('true');
    });

    it('should link error messages with aria-describedby', () => {
      component.form.get('extractTime')?.setValue('');
      component.form.get('extractTime')?.markAsTouched();
      fixture.detectChanges();

      const timeInput = fixture.debugElement.query(By.css('#' + component['elementId']('extractTime')));
      const errorId = component['errorId']('extractTime');

      expect(timeInput.nativeElement.getAttribute('aria-describedby')).toContain(errorId);
    });

    it('should have unique IDs for all form elements', () => {
      const dateInput = fixture.debugElement.query(By.css('#' + component['elementId']('extractDate')));
      const timeInput = fixture.debugElement.query(By.css('#' + component['elementId']('extractTime')));

      expect(dateInput).toBeTruthy();
      expect(timeInput).toBeTruthy();
      expect(component['elementId']('extractDate')).not.toBe(component['elementId']('extractTime'));
    });


  });

  describe('Unique ID Generation', () => {
    it('should generate unique component IDs across instances', () => {
      const fixture2 = TestBed.createComponent(ExtractDialogComponent);
      const component2 = fixture2.componentInstance;

      expect(component['componentId']).not.toBe(component2['componentId']);
      expect(component['elementId']('extractDate')).not.toBe(component2['elementId']('extractDate'));
    });
  });

  describe('UI Elements', () => {


    it('should display section heading', () => {
      const heading = fixture.debugElement.query(By.css('h3'));
      expect(heading.nativeElement.textContent).toContain('Enter Extract Time');
    });

    it('should have close button with icon', () => {
      const closeButton = fixture.debugElement.query(By.css('.close-button'));
      expect(closeButton).toBeTruthy();

      const icon = closeButton.query(By.css('mat-icon'));
      expect(icon.nativeElement.textContent).toContain('close');
    });

    it('should have SET CURRENT TIME button', () => {
      const setTimeButton = fixture.debugElement.query(By.css('.set-time-button'));
      expect(setTimeButton).toBeTruthy();
      expect(setTimeButton.nativeElement.textContent).toContain('SET CURRENT TIME');
    });

    it('should have Generate RSM Report checkbox', () => {
      const checkbox = fixture.debugElement.query(By.css('mat-checkbox'));
      expect(checkbox).toBeTruthy();
      expect(checkbox.nativeElement.textContent).toContain('Generate RSM Report');
    });

    it('should have CANCEL and EXTRACT action buttons', () => {
      const buttons = fixture.debugElement.queryAll(By.css('mat-dialog-actions button'));
      expect(buttons.length).toBe(2);
      expect(buttons[0].nativeElement.textContent).toContain('CANCEL');
      expect(buttons[1].nativeElement.textContent).toContain('EXTRACT');
    });
  });
});
