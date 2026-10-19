import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { QaLibraryFilterPanelComponent } from './qa-library-filter-panel.component';
import { QaLibraryFilters } from '../../models/qa-library.models';
import { HeaderService } from '@shared/services/header.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';

describe('QaLibraryFilterPanelComponent', () => {
  let component: QaLibraryFilterPanelComponent;
  let fixture: ComponentFixture<QaLibraryFilterPanelComponent>;

  const mockFilters: QaLibraryFilters = {
    sex: 'MALE',
    responseType: 'Single',
    effectiveDatePeriod: 'After',
    effectiveDate: new Date('2024-01-01'),
    terminationDatePeriod: 'Before',
    terminationDate: new Date('2024-12-31')
  };

  const mockHeaderService = {
    chapterTimeZone: signal('America/New_York')
  };

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [
        QaLibraryFilterPanelComponent,
        ReactiveFormsModule],
      providers: [
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(QaLibraryFilterPanelComponent);
    component = fixture.componentInstance;


    });

  describe('date adapter', () => {
    it('should use ChapterAwareDateAdapter', () => {
      fixture.detectChanges();
      const adapter = fixture.debugElement.injector.get(DateAdapter);
      expect(adapter).toBeInstanceOf(ChapterAwareDateAdapter);
    });


    it('should fall back gracefully when timezone is UTC', () => {
      mockHeaderService.chapterTimeZone.set('UTC');
      fixture.detectChanges();
      const adapter = fixture.debugElement.injector.get(DateAdapter) as ChapterAwareDateAdapter;
      expect(() => adapter.today()).not.toThrow();
    });
  });

  describe('initialization', () => {

    it('should populate form with currentFilters when provided', () => {
      component.currentFilters = mockFilters;
      component.ngOnInit();

      expect(component.filterForm.get('sex')?.value).toBe('MALE');
      expect(component.filterForm.get('responseType')?.value).toBe('Single');
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('After');
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('Before');
    });


    it('should setup valueChanges subscriptions', () => {
      component.ngOnInit();

      component.showEffectiveDatePeriodError = true;
      component.filterForm.get('effectiveDate')?.setValue(new Date());

      // Subscription should be active - changing effectiveDate should clear the error flag
      expect(component.showEffectiveDatePeriodError).toBe(false);
    });
  });

  describe('period validation - effDatePeriodRequired', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should return true when date is set but period is not', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2024-01-01'),
        effectiveDatePeriod: null
      });

      expect(component.effDatePeriodRequired).toBe(true);
    });

    it('should return false when both date and period are set', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2024-01-01'),
        effectiveDatePeriod: 'After'
      });

      expect(component.effDatePeriodRequired).toBe(false);
    });

    it('should return false when neither date nor period are set', () => {
      component.filterForm.patchValue({
        effectiveDate: null,
        effectiveDatePeriod: null
      });

      expect(component.effDatePeriodRequired).toBe(false);
    });

    it('should return false when date is not set but period is', () => {
      component.filterForm.patchValue({
        effectiveDate: null,
        effectiveDatePeriod: 'After'
      });

      expect(component.effDatePeriodRequired).toBe(false);
    });
  });

  describe('period validation - termDatePeriodRequired', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should return true when date is set but period is not', () => {
      component.filterForm.patchValue({
        terminationDate: new Date('2024-12-31'),
        terminationDatePeriod: null
      });

      expect(component.termDatePeriodRequired).toBe(true);
    });

    it('should return false when both date and period are set', () => {
      component.filterForm.patchValue({
        terminationDate: new Date('2024-12-31'),
        terminationDatePeriod: 'Before'
      });

      expect(component.termDatePeriodRequired).toBe(false);
    });

    it('should return false when neither date nor period are set', () => {
      component.filterForm.patchValue({
        terminationDate: null,
        terminationDatePeriod: null
      });

      expect(component.termDatePeriodRequired).toBe(false);
    });
  });


  describe('apply operation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });


    it('should not emit when effective date period is required', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        effectiveDate: new Date('2024-01-01'),
        effectiveDatePeriod: null
      });

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
      expect(component.showEffectiveDatePeriodError).toBe(true);
    });

    it('should not emit when termination date period is required', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        terminationDate: new Date('2024-12-31'),
        terminationDatePeriod: null
      });

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
      expect(component.showTerminationDatePeriodError).toBe(true);
    });




    it('should emit complete filter object', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue(mockFilters);

      component.onApply();

      const emittedFilters = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedFilters.sex).toBe('MALE');
      expect(emittedFilters.responseType).toBe('Single');
      expect(emittedFilters.effectiveDatePeriod).toBe('After');
      expect(emittedFilters.terminationDatePeriod).toBe('Before');
    });
  });

  describe('error flag management', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should clear effective date error when date changes', () => {
      component.showEffectiveDatePeriodError = true;

      component.filterForm.get('effectiveDate')?.setValue(new Date('2024-01-01'));

      expect(component.showEffectiveDatePeriodError).toBe(false);
    });

    it('should clear effective date error when period changes', () => {
      component.showEffectiveDatePeriodError = true;

      component.filterForm.get('effectiveDatePeriod')?.setValue('After');

      expect(component.showEffectiveDatePeriodError).toBe(false);
    });

    it('should clear termination date error when date changes', () => {
      component.showTerminationDatePeriodError = true;

      component.filterForm.get('terminationDate')?.setValue(new Date('2024-12-31'));

      expect(component.showTerminationDatePeriodError).toBe(false);
    });

    it('should clear termination date error when period changes', () => {
      component.showTerminationDatePeriodError = true;

      component.filterForm.get('terminationDatePeriod')?.setValue('Before');

      expect(component.showTerminationDatePeriodError).toBe(false);
    });
  });

  describe('filter combinations', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should handle single filter selection', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        sex: 'FEMALE'
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({ sex: 'FEMALE' })
      );
    });

    it('should handle multiple filter selections', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        sex: 'MALE',
        responseType: 'Multiple',
        effectiveDate: new Date('2024-01-01'),
        effectiveDatePeriod: 'After'
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          sex: 'MALE',
          responseType: 'Multiple',
          effectiveDatePeriod: 'After'
        })
      );
    });

    it('should handle only period filters', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        effectiveDate: new Date('2024-01-01'),
        effectiveDatePeriod: 'After',
        terminationDate: new Date('2024-12-31'),
        terminationDatePeriod: 'Before'
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          effectiveDatePeriod: 'After',
          terminationDatePeriod: 'Before'
        })
      );
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should handle null currentFilters gracefully', () => {
      component.currentFilters = null;

      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should handle partial currentFilters', () => {
      component.currentFilters = {
        sex: 'MALE',
        responseType: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.ngOnInit();

      expect(component.filterForm.get('sex')?.value).toBe('MALE');
      expect(component.filterForm.get('responseType')?.value).toBeNull();
    });

    it('should handle rapid apply clicks', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({ sex: 'MALE' });

      component.onApply();
      component.onApply();
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledTimes(3);
    });

    it('should handle rapid clear clicks', () => {
      component.filterForm.patchValue(mockFilters);

      component.onClear();
      component.onClear();

      expect(component.filterForm.get('sex')?.value).toBeNull();
    });

    it('should apply filters after clearing', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue(mockFilters);

      component.onClear();
      component.filterForm.patchValue({ responseType: 'Comment' });
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({ responseType: 'Comment' })
      );
    });
  });

});
