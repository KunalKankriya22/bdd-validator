import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { AddEditDaylightSavings } from './add-edit-daylight-savings';
import { DaylightSavingsService } from '../services/daylight-savings.service';
import { DaylightSavingsModel } from '../models/daylight-savings.model';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AddEditDaylightSavings', () => {
  let component: AddEditDaylightSavings;
  let fixture: ComponentFixture<AddEditDaylightSavings>;
  let mockService: jasmine.SpyObj<DaylightSavingsService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockChaptersResponse = [
    { chapterId: 'DAL', chapterName: 'Dallas Blood Center' },
    { chapterId: 'NYC', chapterName: 'New York Blood Center' },
    { chapterId: 'LAX', chapterName: 'Los Angeles Blood Center' }
  ];

  const mockDropdownResponse = {
    success: true,
    message: '',
    error: null,
    statusCode: 200,
    data: [{
      timeZone: ['GMT-05:00', 'GMT-06:00', 'GMT-07:00', 'GMT-08:00'],
      timeZoneRegion: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles']
    }],
    total: 1
  };

  const mockDaylightSavingsRecord: DaylightSavingsModel = {
    chapterId: 'DAL',
    chapterName: 'Dallas Blood Center',
    startTime: '2026-03-09T02:00:00.000Z',
    endTime: '2026-11-02T02:00:00.000Z',
    baseOffSet: '-6',
    dstOffSet: -5,
    timeZone: 'GMT-06:00',
    timeZoneRegion: 'America/Chicago'
  };

  const mockTimeZoneRegionsResponse = {
    success: true,
    message: '',
    error: null,
    statusCode: 200,
    data: [{
      timeZoneRegion: ['America/Chicago', 'America/Denver', 'America/Boise']
    }],
    total: 1
  };

  const mockSaveResponse = {
    success: true,
    message: 'Record saved successfully',
    error: null,
    statusCode: 200,
    data: null,
    total: 0
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DaylightSavingsService', [
      'getChapters',
      'getDaylightSavingsDropdown',
      'addDaylightSavings',
      'updateDaylightSavings',
      'getTimeZoneRegionsByOffset'
    ]);
    mockSnackBar = createMockMatSnackBar();

    mockService.getChapters.and.returnValue(of(mockChaptersResponse));
    mockService.getDaylightSavingsDropdown.and.returnValue(of(mockDropdownResponse));
    mockService.addDaylightSavings.and.returnValue(of(mockSaveResponse));
    mockService.updateDaylightSavings.and.returnValue(of(mockSaveResponse));
    mockService.getTimeZoneRegionsByOffset.and.returnValue(of(mockTimeZoneRegionsResponse));



      TestBed.configureTestingModule({
      imports: [
        AddEditDaylightSavings,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatFormFieldModule,
        MatInputModule,
        MatSnackBarModule,
        MatDatepickerModule],
      providers: [
        provideHttpClient(),
        { provide: DaylightSavingsService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
        { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] }
      ]
    });


    


      mockService.getChapters.calls.reset();


      mockService.getDaylightSavingsDropdown.calls.reset();


      mockService.addDaylightSavings.calls.reset();


      mockService.updateDaylightSavings.calls.reset();


      mockService.getTimeZoneRegionsByOffset.calls.reset();


      mockService.getChapters.and.returnValue(of(mockChaptersResponse));


      mockService.getDaylightSavingsDropdown.and.returnValue(of(mockDropdownResponse));


      mockService.addDaylightSavings.and.returnValue(of(mockSaveResponse));


      mockService.updateDaylightSavings.and.returnValue(of(mockSaveResponse));


      mockService.getTimeZoneRegionsByOffset.and.returnValue(of(mockTimeZoneRegionsResponse));


    fixture = TestBed.createComponent(AddEditDaylightSavings);
    component = fixture.componentInstance;


    });


  describe('Initialization', () => {


    it('should load chapters on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockService.getChapters).toHaveBeenCalledTimes(1);
      expect(component.chapterOptions.length).toBe(3);
      expect(component.filteredChapterOptions.length).toBe(3);
    }));



    it('should handle chapters API failure gracefully', () => {
      mockService.getChapters.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();

      expect(component.chapterOptions).toEqual([]);
      expect(component.filteredChapterOptions).toEqual([]);
      expect(component.isLoadingOptions).toBe(false);
    });

    it('should handle dropdown API failure gracefully', () => {
      mockService.getDaylightSavingsDropdown.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();

      expect(component.isLoadingOptions).toBe(false);
    });
  });

  describe('Add Mode', () => {
    beforeEach(fakeAsync(() => {
      // Manually trigger ngOnChanges to call setupPanel()
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      fixture.detectChanges();
      tick();
    }));





    it('should require chapterId field', () => {
      expect(component.form.get('chapterId')?.hasError('required')).toBe(true);
    });

    it('should filter chapters when searching', fakeAsync(() => {
      // All chapters should be loaded initially
      expect(component.filteredChapterOptions.length).toBe(3);

      // Search for 'dal' - should match Dallas
      component.chapterSearchControl.setValue('dal');
      tick();
      expect(component.filteredChapterOptions.length).toBe(1);
      expect(component.filteredChapterOptions[0].id).toBe('DAL');

      // Search for 'Blood' - should match all three chapters (Dallas, New York, Los Angeles)
      component.chapterSearchControl.setValue('Blood');
      tick();
      expect(component.filteredChapterOptions.length).toBe(3);

      // Clear search - should show all chapters
      component.chapterSearchControl.setValue('');
      tick();
      expect(component.filteredChapterOptions.length).toBe(3);
    }));

    it('should require startDateTime field', () => {
      expect(component.form.get('startDateTime')?.hasError('required')).toBe(true);
    });

    it('should require endDateTime field', () => {
      expect(component.form.get('endDateTime')?.hasError('required')).toBe(true);
    });

    it('should require timeZoneRegion field', () => {
      // The field starts disabled, so enable it to test required validation
      const control = component.form.get('timeZoneRegion');
      control?.enable();
      expect(control?.hasError('required')).toBe(true);
    });

    it('should require dstOffSet field', () => {
      const control = component.form.get('dstOffSet');
      control?.setValue(null);
      expect(control?.hasError('required')).toBe(true);
    });

    it('should validate dstOffSet min value (must be >= 0)', () => {
      const control = component.form.get('dstOffSet');
      control?.setValue(-1);
      expect(control?.hasError('min')).toBe(true);
    });

    it('should validate dstOffSet max value', () => {
      const control = component.form.get('dstOffSet');
      control?.setValue(121);
      expect(control?.hasError('max')).toBe(true);
    });




  });

  describe('Edit Mode', () => {
    beforeEach(fakeAsync(() => {
      // Set mode and data
      component.mode = 'edit';
      component.data = mockDaylightSavingsRecord;

      // Initialize the component (calls ngOnInit, starts loading dropdowns)
      fixture.detectChanges();

      // Manually call ngOnChanges to trigger setupPanel() in edit mode
      // (Setting properties directly doesn't trigger Angular's @Input change detection)
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: mockDaylightSavingsRecord,
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      // Now process all async operations
      tick(); // Complete getChapters and getDaylightSavingsDropdown, emit dropdownOptionsLoaded$
      fixture.detectChanges(); // Process any synchronous updates
      tick(); // dropdownOptionsLoaded$ subscription processes, sets timezone, calls getTimeZoneRegionsByOffset
      fixture.detectChanges(); // Process valueChanges subscription
      tick(); // Complete getTimeZoneRegionsByOffset, set pending timezone region
      fixture.detectChanges(); // Process all DOM updates
      tick(); // Ensure all async operations are complete
    }));











    it('should store originalStartTime when populating form in edit mode', () => {
      expect(component['originalStartTime']).toBe('2026-03-09T02:00:00.000Z');
    });

    it('should populate startDateTime in DD-MMM-YYYY HH:mm format', () => {
      const startDateTimeValue = component.form.get('startDateTime')?.value;
      expect(startDateTimeValue).toMatch(/^\d{2}-[A-Z]{3}-\d{4}\s\d{2}:\d{2}$/);
    });

    it('should populate endDateTime in DD-MMM-YYYY HH:mm format', () => {
      const endDateTimeValue = component.form.get('endDateTime')?.value;
      expect(endDateTimeValue).toMatch(/^\d{2}-[A-Z]{3}-\d{4}\s\d{2}:\d{2}$/);
    });
  });

  describe('Form Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));





    it('should validate startDateTime format', () => {
      const control = component.form.get('startDateTime');

      // Valid format
      control?.setValue('02-JAN-2025 14:30');
      expect(control?.hasError('invalidFormat')).toBeFalsy();

      // Invalid formats
      control?.setValue('2-JAN-2025 14:30'); // Single digit day
      expect(control?.hasError('invalidFormat')).toBe(true);

      control?.setValue('02-JAN-25 14:30'); // 2-digit year
      expect(control?.hasError('invalidFormat')).toBe(true);

      control?.setValue('02/JAN/2025 14:30'); // Wrong separators
      expect(control?.hasError('invalidFormat')).toBe(true);

      control?.setValue('02-JAN-2025 14'); // Missing minutes
      expect(control?.hasError('invalidFormat')).toBe(true);
    });



    it('should validate endDateTime format', () => {
      const control = component.form.get('endDateTime');

      // Valid format
      control?.setValue('03-JAN-2025 15:30');
      expect(control?.hasError('invalidFormat')).toBeFalsy();

      // Invalid format
      control?.setValue('03-JANUARY-2025 15:30'); // Full month name
      expect(control?.hasError('invalidFormat')).toBe(true);
    });



    it('should allow null baseOffSet', () => {
      const control = component.form.get('baseOffSet');

      control?.setValue(null);
      expect(control?.hasError('required')).toBe(false);
    });



    it('should validate dstOffSet within range 0 to 120', () => {
      const control = component.form.get('dstOffSet');

      control?.setValue(0);
      expect(control?.valid).toBe(true);

      control?.setValue(120);
      expect(control?.valid).toBe(true);

      control?.setValue(0);
      expect(control?.valid).toBe(true);
    });

    it('should validate invalid month names', () => {
      const control = component.form.get('startDateTime');

      control?.setValue('02-ABC-2025 14:30');
      expect(control?.hasError('invalidDateTime')).toBe(true);
    });





    it('should validate that end datetime is after start datetime', fakeAsync(() => {
      const futureStart = moment().add(1, 'day').format('DD-MMM-YYYY HH:mm').toUpperCase();
      const futureEnd = moment().add(1, 'day').subtract(1, 'hour').format('DD-MMM-YYYY HH:mm').toUpperCase();

      component.form.patchValue({
        chapterId: 'DAL',
        startDateTime: futureStart,
        endDateTime: futureEnd, // Before start (1 hour earlier same day)
        timeZoneRegion: 'America/Chicago',
        dstOffSet: 60
      });

      component.form.updateValueAndValidity();
      tick();

      expect(component.form.hasError('invalidDateRange')).toBe(true);
    }));


  });



  describe('onSaveAndCreateAnother()', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should call onSave with closeAfterSave=false', () => {
      spyOn(component, 'onSave');

      component.onSaveAndCreateAnother();

      expect(component.onSave).toHaveBeenCalledWith(false);
    });
  });

  describe('onCancel()', () => {


    it('should not save when cancel is clicked', () => {
      component.onCancel();

      expect(mockService.addDaylightSavings).not.toHaveBeenCalled();
      expect(mockService.updateDaylightSavings).not.toHaveBeenCalled();
    });
  });

  describe('onChapterChange()', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';

      // Manually trigger ngOnChanges to call setupPanel()
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      fixture.detectChanges();
      tick(); // Wait for async operations (chapter options to load)
    }));

    it('should update chapterName when valid chapterId is selected', () => {
      component.onChapterChange('DAL');

      expect(component.form.get('chapterName')?.value).toBe('Dallas Blood Center');
    });

    it('should update chapterName for different chapter', () => {
      component.onChapterChange('NYC');

      expect(component.form.get('chapterName')?.value).toBe('New York Blood Center');
    });

    it('should not update chapterName when invalid chapterId is provided', () => {
      component.form.get('chapterName')?.setValue('');
      component.onChapterChange('INVALID');

      expect(component.form.get('chapterName')?.value).toBe('');
    });

    it('should handle empty chapter id', () => {
      component.form.get('chapterName')?.setValue('Dallas Blood Center');
      component.onChapterChange('');

      expect(component.form.get('chapterName')?.value).toBe('Dallas Blood Center');
    });
  });
});
