import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ExtractResultsDialogComponent } from './extract-results-dialog';
import { ExtractResultsDialogData } from '../../models/confirmatory-extraction.model';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { By } from '@angular/platform-browser';
import moment from 'moment';

describe('ExtractResultsDialogComponent', () => {
  let chapterTimezoneServiceSpy: any;
  let dialogRefSpy: any;
  let component: ExtractResultsDialogComponent;
  let fixture: ComponentFixture<ExtractResultsDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ExtractResultsDialogComponent>>;

  const mockDialogData: ExtractResultsDialogData = {
    extractId: 'EXT001',
    selectedUnitIds: ['U00001', 'U00002', 'U00003'],
    unitsCount: 3
  };

  beforeEach(() => {

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', [
      'fetchChapterTimezone',
      'isChapterLocalDateAvailable',
      'getChapterLocalDate',
      'getChapterLocalDateTime',
      'convertLocalToGmt',
      'convertGmtToLocal',
    ]);
    chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(false);
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment().startOf('day'));
    chapterTimezoneServiceSpy.getChapterLocalDateTime.and.returnValue(moment());



      TestBed.configureTestingModule({
imports: [ExtractResultsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
      ]
    });


    });



  beforeEach(() => {


      dialogRefSpy.close.calls.reset();


      chapterTimezoneServiceSpy.fetchChapterTimezone.calls.reset();


      chapterTimezoneServiceSpy.isChapterLocalDateAvailable.calls.reset();


      chapterTimezoneServiceSpy.getChapterLocalDate.calls.reset();


      chapterTimezoneServiceSpy.getChapterLocalDateTime.calls.reset();


      chapterTimezoneServiceSpy.convertLocalToGmt.calls.reset();


      chapterTimezoneServiceSpy.convertGmtToLocal.calls.reset();


      chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(false);


      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment().startOf('day'));


      chapterTimezoneServiceSpy.getChapterLocalDateTime.and.returnValue(moment());


    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<ExtractResultsDialogComponent>>;
    fixture = TestBed.createComponent(ExtractResultsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Initialization', () => {

    it('should initialize form with current date and time', () => {
      expect(component.form.get('date')?.value).toBeTruthy();
      expect(component.form.get('time')?.value).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should initialize printTestSeriesReport as checked', () => {
      expect(component.form.get('printTestSeriesReport')?.value).toBeTrue();
    });

  });
  describe('Form Validation', () => {
    it('should require date field', () => {
      const dateControl = component.form.get('date');
      dateControl?.setValue(null);

      expect(dateControl?.hasError('required')).toBeTrue();
      expect(component.form.invalid).toBeTrue();
    });

    it('should require time field', () => {
      const timeControl = component.form.get('time');
      timeControl?.setValue('');

      expect(timeControl?.hasError('required')).toBeTrue();
      expect(component.form.invalid).toBeTrue();
    });

    it('should validate time format', () => {
      const timeControl = component.form.get('time');

      timeControl?.setValue('25:00'); // Invalid hour
      expect(timeControl?.hasError('pattern')).toBeTrue();

      timeControl?.setValue('12:60'); // Invalid minute
      expect(timeControl?.hasError('pattern')).toBeTrue();

      timeControl?.setValue('12:30'); // Valid
      expect(timeControl?.hasError('pattern')).toBeFalse();
    });

  });

  describe('Set Current Time', () => {
    it('should update date and time to current', () => {
      const now = moment();

      component.setCurrentTime();

      const dateValue = component.form.get('date')?.value as moment.Moment;
      const timeValue = component.form.get('time')?.value as string;

      expect(dateValue.isSame(now, 'day')).toBeTrue();
      expect(timeValue).toMatch(/^\d{2}:\d{2}$/);
    });

  });

  describe('Form Submission', () => {

    it('should submit with afterTime when future date/time selected', () => {
      const futureDate = moment().add(2, 'hours');

      component.form.patchValue({
        date: futureDate,
        time: futureDate.format('HH:mm'),
        printTestSeriesReport: true
      });

      component.onSubmit();

      expect(dialogRef.close).toHaveBeenCalledWith(
        jasmine.objectContaining({
          afterTime: jasmine.any(String),
          generateSeriesReport: true
        })
      );

      const result = dialogRef.close.calls.mostRecent().args[0];
      expect(result.afterTime).toBeTruthy();
    });

    it('should submit with null afterTime when current/past time selected', () => {
      const pastDate = moment().subtract(1, 'hour');

      component.form.patchValue({
        date: pastDate,
        time: pastDate.format('HH:mm'),
        printTestSeriesReport: false
      });

      component.onSubmit();

      expect(dialogRef.close).toHaveBeenCalledWith({
        afterTime: null,
        generateSeriesReport: false
      });
    });

    it('should include generateSeriesReport value', () => {
      const now = moment();

      component.form.patchValue({
        date: now,
        time: now.format('HH:mm'),
        printTestSeriesReport: false
      });

      component.onSubmit();

      const result = dialogRef.close.calls.mostRecent().args[0];
      expect(result.generateSeriesReport).toBeFalse();
    });
  });
  describe('UI Elements', () => {


    it('should have required validation on date and time fields', () => {
      expect(component.form.get('date')?.hasError('required')).toBeFalse(); // initialized with current date
      expect(component.form.get('time')?.hasError('required')).toBeFalse(); // initialized with current time

      component.form.get('date')?.setValue(null);
      component.form.get('time')?.setValue('');

      expect(component.form.get('date')?.hasError('required')).toBeTrue();
      expect(component.form.get('time')?.hasError('required')).toBeTrue();
    });

    it('should display Print Test Series Report checkbox', () => {
      const checkbox = fixture.debugElement.query(By.css('mat-checkbox'));
      expect(checkbox).toBeTruthy();
      expect(checkbox.nativeElement.textContent).toContain('Print a Test Series Report');
    });
  });
});
