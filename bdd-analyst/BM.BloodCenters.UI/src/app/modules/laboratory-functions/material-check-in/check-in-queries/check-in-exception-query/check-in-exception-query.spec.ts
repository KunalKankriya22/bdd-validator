import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import moment from 'moment';

import { CheckInExceptionQuery } from './check-in-exception-query';
import { CheckInExceptionQueryService } from './services/check-in-exception-query.service';
import {
  CheckInExceptionResult,
  TubeOnlyUnit,
  NoBagUnit
} from './models/check-in-exception-query.model';

describe('CheckInExceptionQuery', () => {
  let date: any;
  let component: CheckInExceptionQuery;
  let fixture: ComponentFixture<CheckInExceptionQuery>;
  let checkInServiceSpy: jasmine.SpyObj<CheckInExceptionQueryService>;

  const mockTubesOnlyData: TubeOnlyUnit[] = [
    {
      unitId: 'W123418031306',
      tubeCheckInDate: '2025-01-11T00:00:00Z',
      tubeCheckInDateFormatted: '11-JAN-2025'
    },
    {
      unitId: 'W123418031307',
      tubeCheckInDate: '2025-01-10T00:00:00Z',
      tubeCheckInDateFormatted: '10-DEC-2025'
    }
  ];

  const mockNoBagData: NoBagUnit[] = [
    {
      unitId: '0714600',
      collectionDate: '2025-01-11T00:00:00Z',
      collectionDateFormatted: '11-JAN-2025'
    },
    {
      unitId: '7146011',
      collectionDate: '2025-01-10T00:00:00Z',
      collectionDateFormatted: '10-DEC-2025'
    },
    {
      unitId: 'W123418031308',
      collectionDate: '2020-02-02T00:00:00Z',
      collectionDateFormatted: '02-FEB-2020'
    }
  ];

  const mockResult: CheckInExceptionResult = {
    tubesOnlyCheckedIn: mockTubesOnlyData,
    noBagCheckedIn: mockNoBagData,
    totalTubesOnly: 2,
    totalNoBag: 5
  };

  beforeEach(() => {

    checkInServiceSpy = jasmine.createSpyObj('CheckInExceptionQueryService', [
      'queryCheckInExceptions',
      'formatDateForApi'
    ]);

    checkInServiceSpy.queryCheckInExceptions.and.returnValue(of(mockResult));
    checkInServiceSpy.formatDateForApi.and.callFake((date: Date | null) => {
      if (!date) return '';
      return moment(date).format('YYYY-MM-DD');
    });



      TestBed.configureTestingModule({
      imports: [CheckInExceptionQuery, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CheckInExceptionQueryService, useValue: checkInServiceSpy }
      ]
    });

      checkInServiceSpy.queryCheckInExceptions.and.returnValue(of(mockResult));


      checkInServiceSpy.formatDateForApi.and.callFake((date: Date | null) => {
        if (!date) return '';
        return moment(date).format('YYYY-MM-DD');
      });

    fixture = TestBed.createComponent(CheckInExceptionQuery);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Initialization', () => {


    it('should initialize form with empty date fields', () => {
      expect(component.form.get('startDate')?.value).toBeNull();
      expect(component.form.get('endDate')?.value).toBeNull();
    });





    it('should have no initial results', () => {
      expect((component as any).hasResults()).toBeFalse();
      expect((component as any).tubesOnlyData().length).toBe(0);
      expect((component as any).noBagData().length).toBe(0);
    });
  });

  describe('Form Validation', () => {
    it('should mark both date fields as required', () => {
      component.form.get('startDate')?.markAsTouched();
      component.form.get('endDate')?.markAsTouched();
      fixture.detectChanges();

      expect(component.form.get('startDate')?.hasError('required')).toBeTrue();
      expect(component.form.get('endDate')?.hasError('required')).toBeTrue();
    });

    it('should validate future dates for Start Date', () => {
      const futureDate = moment().add(1, 'day').toDate();
      component.form.patchValue({ startDate: futureDate });
      component.form.get('startDate')?.markAsTouched();
      fixture.detectChanges();

      expect(component.form.get('startDate')?.hasError('futureDate')).toBeTrue();
    });

    it('should validate future dates for End Date', () => {
      const futureDate = moment().add(1, 'day').toDate();
      component.form.patchValue({ endDate: futureDate });
      component.form.get('endDate')?.markAsTouched();
      fixture.detectChanges();

      expect(component.form.get('endDate')?.hasError('futureDate')).toBeTrue();
    });

    it('should allow today as Start Date', () => {
      const today = moment().startOf('day').toDate();
      component.form.patchValue({ startDate: today });
      component.form.get('startDate')?.markAsTouched();
      fixture.detectChanges();

      expect(component.form.get('startDate')?.hasError('futureDate')).toBeFalsy();
    });

    it('should validate End Date >= Start Date', () => {
      const startDate = moment('2025-01-15').toDate();
      const endDate = moment('2025-01-10').toDate();

      component.form.patchValue({ startDate, endDate });
      component.onDateChange();
      fixture.detectChanges();

      expect(component.form.get('endDate')?.hasError('endBeforeStart')).toBeTrue();
    });

    it('should allow End Date equal to Start Date', () => {
      date = moment('2025-01-15').toDate();
      component.form.patchValue({ startDate: date, endDate: date });
      component.onDateChange();
      fixture.detectChanges();

      expect(component.form.get('endDate')?.hasError('endBeforeStart')).toBeFalsy();
    });


  });

  describe('RETRIEVE Button', () => {


    it('should call service when form is valid', fakeAsync(() => {
      const startDate = moment('2025-01-01').toDate();
      const endDate = moment('2025-01-31').toDate();
      component.form.patchValue({ startDate, endDate });

      component.onRetrieve();
      tick();

      expect(checkInServiceSpy.queryCheckInExceptions).toHaveBeenCalled();
      expect(checkInServiceSpy.formatDateForApi).toHaveBeenCalledWith(startDate);
      expect(checkInServiceSpy.formatDateForApi).toHaveBeenCalledWith(endDate);
    }));



    it('should populate data and totals on successful API call', fakeAsync(() => {
      component.form.patchValue({
        startDate: moment('2025-01-01').toDate(),
        endDate: moment('2025-01-31').toDate()
      });

      component.onRetrieve();
      tick();

      expect((component as any).tubesOnlyData().length).toBe(2);
      expect((component as any).noBagData().length).toBe(3);
      expect((component as any).totalTubesOnly()).toBe(2);
      expect((component as any).totalNoBag()).toBe(5);
      expect((component as any).hasResults()).toBeTrue();
    }));

    it('should handle API errors with errorResponse', fakeAsync(() => {
      checkInServiceSpy.queryCheckInExceptions.and.returnValue(
        throwError(() => ({
          error: {
            errorResponse: { errorCode: '0060', error: 'Collection date cannot be greater than today\'s date' }
          }
        }))
      );

      component.form.patchValue({
        startDate: moment('2025-01-01').toDate(),
        endDate: moment('2025-01-31').toDate()
      });

      component.onRetrieve();
      tick();

      expect((component as any).loading()).toBeFalse();
      expect((component as any).error()).toBe('Collection date cannot be greater than today\'s date');
    }));
  });
  describe('Search Functionality', () => {
    beforeEach(() => {
      (component as any).tubesOnlyData.set(mockTubesOnlyData);
      (component as any).noBagData.set(mockNoBagData);
      (component as any).filteredTubesOnly.set(mockTubesOnlyData);
      (component as any).filteredNoBag.set(mockNoBagData);
    });

    it('should filter Tubes Only data by unit ID', () => {
      component.onTubesOnlySearch({ target: { value: 'W1234180313' } } as any);
      expect((component as any).filteredTubesOnly().length).toBe(2);
    });

    it('should show all Tubes Only data when search is empty', () => {
      component.onTubesOnlySearch({ target: { value: '' } } as any);
      expect((component as any).filteredTubesOnly().length).toBe(mockTubesOnlyData.length);
    });




  });

  describe('Sorting Functionality', () => {
    beforeEach(() => {
      (component as any).tubesOnlyData.set(mockTubesOnlyData);
      (component as any).filteredTubesOnly.set([...mockTubesOnlyData]);
      (component as any).noBagData.set(mockNoBagData);
      (component as any).filteredNoBag.set([...mockNoBagData]);
    });

    it('should sort Tubes Only by Unit ID ascending', () => {
      component.onSortChange('tubesOnly', 'unitId');
      const sorted = (component as any).filteredTubesOnly();
      expect(sorted[0].unitId).toBe('W123418031306');
    });

    it('should sort Tubes Only by Unit ID descending', () => {
      component.onSortChange('tubesOnly', 'unitId');
      component.onSortChange('tubesOnly', 'unitId');
      const sorted = (component as any).filteredTubesOnly();
      expect(sorted[0].unitId).toBe('W123418031307');
    });

    it('should sort No Bag by Tube ID ascending', () => {
      component.onSortChange('noBag', 'tubeId');
      const sorted = (component as any).filteredNoBag();
      expect(sorted[0].unitId).toBe('0714600');
    });

    it('should return unfold_more icon for unsorted column', () => {
      expect(component.getSortIcon('tubesOnly', 'unitId')).toBe('unfold_more');
    });

    it('should return arrow_upward icon after first sort click', () => {
      component.onSortChange('tubesOnly', 'unitId');
      expect(component.getSortIcon('tubesOnly', 'unitId')).toBe('arrow_upward');
    });

    it('should return arrow_downward icon after second sort click', () => {
      component.onSortChange('tubesOnly', 'unitId');
      component.onSortChange('tubesOnly', 'unitId');
      expect(component.getSortIcon('tubesOnly', 'unitId')).toBe('arrow_downward');
    });
  });

  describe('Accessibility', () => {


    it('should have date input fields', () => {
      const startDateInput = fixture.debugElement.query(By.css('[formControlName="startDate"]'));
      const endDateInput = fixture.debugElement.query(By.css('[formControlName="endDate"]'));
      expect(startDateInput).toBeTruthy();
      expect(endDateInput).toBeTruthy();
    });


  });
  describe('RETRIEVE Button State (datesChanged)', () => {
    it('should disable RETRIEVE after successful data load', fakeAsync(() => {
      component.form.patchValue({
        startDate: moment('2025-01-01').toDate(),
        endDate: moment('2025-01-31').toDate()
      });

      expect(component.isRetrieveDisabled).toBeFalse();

      component.onRetrieve();
      tick();

      expect(component.isRetrieveDisabled).toBeTrue();
    }));

    it('should re-enable RETRIEVE after date change', fakeAsync(() => {
      component.form.patchValue({
        startDate: moment('2025-01-01').toDate(),
        endDate: moment('2025-01-31').toDate()
      });

      component.onRetrieve();
      tick();
      expect(component.isRetrieveDisabled).toBeTrue();

      component.onDateChange();
      expect(component.isRetrieveDisabled).toBeFalse();
    }));

    it('should re-enable RETRIEVE after CLEAR ALL', fakeAsync(() => {
      component.form.patchValue({
        startDate: moment('2025-01-01').toDate(),
        endDate: moment('2025-01-31').toDate()
      });

      component.onRetrieve();
      tick();

      component.onClearAll();
      expect(component.isRetrieveDisabled).toBeTrue();
    }));
  });

  describe('CLEAR ALL Button State', () => {
    it('should disable CLEAR ALL when form empty and no results', () => {
      expect(component.isClearAllDisabled).toBeTrue();
    });

    it('should enable CLEAR ALL when dates are filled', () => {
      component.form.patchValue({
        startDate: moment('2025-01-01').toDate(),
        endDate: moment('2025-01-31').toDate()
      });
      expect(component.isClearAllDisabled).toBeFalse();
    });

    it('should enable CLEAR ALL when results exist', fakeAsync(() => {
      component.form.patchValue({
        startDate: moment('2025-01-01').toDate(),
        endDate: moment('2025-01-31').toDate()
      });
      component.onRetrieve();
      tick();

      expect(component.isClearAllDisabled).toBeFalse();
    }));
  });
});
