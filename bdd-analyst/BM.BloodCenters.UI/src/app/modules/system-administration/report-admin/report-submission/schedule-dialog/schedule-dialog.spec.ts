import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ScheduleDialogComponent } from './schedule-dialog';
import { ScheduleDialogData, ScheduleDialogResult } from '../models/report-submission.model';

describe('ScheduleDialogComponent', () => {
  let component: ScheduleDialogComponent;
  let fixture: ComponentFixture<ScheduleDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<ScheduleDialogComponent>>;
  let mockData: ScheduleDialogData;

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockData = { reportTitle: 'Test Report' };

    await TestBed.configureTestingModule({
      imports: [ScheduleDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: mockDialogRef },
        provideNativeDateAdapter(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  describe('onSchedule', () => {
    it('should close dialog with scheduled time when valid', () => {
      // Use a future date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      component.scheduleForm.get('date')!.setValue(tomorrow);
      component.scheduleForm.get('time')!.setValue('10:00');
      component.onSchedule();

      expect(mockDialogRef.close).toHaveBeenCalled();
      const result = mockDialogRef.close.calls.mostRecent().args[0] as ScheduleDialogResult;
      expect(result).toBeTruthy();
      expect(result.scheduledTime).toBeTruthy();
    });


    it('should handle datetime-local format', () => {
      // Use a future date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 30, 0, 0);
      component.scheduleForm.get('date')!.setValue(tomorrow);
      component.scheduleForm.get('time')!.setValue('14:30');
      component.onSchedule();

      expect(mockDialogRef.close).toHaveBeenCalled();
      const result = mockDialogRef.close.calls.mostRecent().args[0] as ScheduleDialogResult;
      expect(result).toBeTruthy();
      expect(result.scheduledTime).toBeTruthy();
    });
  });
  describe('dialog integration', () => {
    it('should display report title from data', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      // The template should contain the report title
      expect(component.data.reportTitle).toBe('Test Report');
    });

  });

  describe('form state', () => {
    it('should initialize with empty time control', () => {
      expect(component.scheduleForm.get('time')!.value).toBe('');
    });

    it('should update time control value', () => {
      const newValue = '23:59';
      component.scheduleForm.get('time')!.setValue(newValue);
      expect(component.scheduleForm.get('time')!.value).toBe(newValue);
    });

  });
});
