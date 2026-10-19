import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import moment, { Moment } from 'moment';

import { DateTimePickerDialogComponent, DateTimePickerData } from './datetime-picker-dialog.component';

describe('DateTimePickerDialogComponent', () => {
  let component: DateTimePickerDialogComponent;
  let fixture: ComponentFixture<DateTimePickerDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<DateTimePickerDialogComponent>>;
  let mockData: DateTimePickerData;

  beforeEach(() => {

    const currentDateTime = moment();
    const minDate = moment().subtract(1, 'year');

    mockData = {
      currentDateTime: currentDateTime,
      minDate: minDate
    };

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);



      TestBed.configureTestingModule({
imports: [
        DateTimePickerDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockData }
      ]
    });


    });



  beforeEach(() => {


      dialogRefSpy.close.calls.reset();


    fixture = TestBed.createComponent(DateTimePickerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  it('should initialize with provided date and time', () => {
    expect(component.dateControl.value).toEqual(mockData.currentDateTime);
    expect(component.hourControl.value).toBe(mockData.currentDateTime.hours());
    expect(component.minuteControl.value).toBe(mockData.currentDateTime.minutes());
  });

  // it('should format preview datetime correctly', () => {
  //   const preview = component.getPreviewDateTime();
  //   expect(preview).toMatch(/^\d{2}-[A-Z]{3}-\d{2} \d{2}:\d{2}$/);
  // });

  it('should return "Invalid date/time" when date control is invalid', () => {
    component.dateControl.setValue(null);
    const preview = component.getPreviewDateTime();
    expect(preview).toBe('Invalid date/time');
  });

  it('should return "Invalid date/time" when hour control is invalid', () => {
    component.hourControl.setValue(25); // Invalid hour
    const preview = component.getPreviewDateTime();
    expect(preview).toBe('Invalid date/time');
  });

  it('should return "Invalid date/time" when minute control is invalid', () => {
    component.minuteControl.setValue(-1); // Invalid minute
    const preview = component.getPreviewDateTime();
    expect(preview).toBe('Invalid date/time');
  });

  it('should validate hour between 0 and 23', () => {
    component.hourControl.setValue(0);
    expect(component.hourControl.valid).toBeTrue();

    component.hourControl.setValue(23);
    expect(component.hourControl.valid).toBeTrue();

    component.hourControl.setValue(24);
    expect(component.hourControl.valid).toBeFalse();

    component.hourControl.setValue(-1);
    expect(component.hourControl.valid).toBeFalse();
  });

  it('should validate minute between 0 and 59', () => {
    component.minuteControl.setValue(0);
    expect(component.minuteControl.valid).toBeTrue();

    component.minuteControl.setValue(59);
    expect(component.minuteControl.valid).toBeTrue();

    component.minuteControl.setValue(60);
    expect(component.minuteControl.valid).toBeFalse();

    component.minuteControl.setValue(-1);
    expect(component.minuteControl.valid).toBeFalse();
  });

  it('should combine date and time correctly', () => {
    const testDate = moment('2026-06-15');
    const testHour = 14;
    const testMinute = 30;

    component.dateControl.setValue(testDate);
    component.hourControl.setValue(testHour);
    component.minuteControl.setValue(testMinute);

    const combined = component.getCombinedDateTime();

    expect(combined).toBeTruthy();
    expect(combined?.date()).toBe(15);
    expect(combined?.month()).toBe(5); // June is month 5 (0-indexed)
    expect(combined?.year()).toBe(2026);
    expect(combined?.hours()).toBe(14);
    expect(combined?.minutes()).toBe(30);
    expect(combined?.seconds()).toBe(0);
  });


  it('should check validity correctly', () => {
    // All valid
    component.dateControl.setValue(moment());
    component.hourControl.setValue(10);
    component.minuteControl.setValue(30);
    expect(component.isValid()).toBeTrue();

    // Invalid date
    component.dateControl.setValue(null);
    expect(component.isValid()).toBeFalse();

    // Reset date, invalid hour
    component.dateControl.setValue(moment());
    component.hourControl.setValue(25);
    expect(component.isValid()).toBeFalse();

    // Reset hour, invalid minute
    component.hourControl.setValue(10);
    component.minuteControl.setValue(60);
    expect(component.isValid()).toBeFalse();
  });


  it('should close dialog with combined datetime on confirm when valid', () => {
    const testDate = moment('2026-06-15');
    component.dateControl.setValue(testDate);
    component.hourControl.setValue(14);
    component.minuteControl.setValue(30);

    component.onConfirm();

    expect(dialogRefSpy.close).toHaveBeenCalled();
    const closedWith = dialogRefSpy.close.calls.mostRecent().args[0] as Moment;
    expect(closedWith).toBeTruthy();
    expect(closedWith.hours()).toBe(14);
    expect(closedWith.minutes()).toBe(30);
  });


  it('should handle moment object as date value', () => {
    const momentDate = moment('2026-06-15');
    component.dateControl.setValue(momentDate);
    component.hourControl.setValue(10);
    component.minuteControl.setValue(30);

    const combined = component.getCombinedDateTime();
    expect(combined).toBeTruthy();
    expect(combined?.isSame(momentDate, 'day')).toBeTrue();
  });


  it('should have correct dialog data', () => {
    expect(component.data).toEqual(mockData);
    expect(component.data.currentDateTime).toEqual(mockData.currentDateTime);
    expect(component.data.minDate).toEqual(mockData.minDate);
  });
});
