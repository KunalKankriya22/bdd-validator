import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { LabTestsFilterPanel } from './lab-tests-filter-panel';
import { LabTestsApiService } from '../services/lab-tests-api.service';
import { LabTestFilterValue, FilterDropdownOptions } from '../models/lab-tests.model';

describe('LabTestsFilterPanel', () => {
  let component: LabTestsFilterPanel;
  let fixture: ComponentFixture<LabTestsFilterPanel>;
  let mockService: jasmine.SpyObj<LabTestsApiService>;

  const mockFilterOptions: FilterDropdownOptions = {
    interdictionCodes: [
      { value: 'D01', display: 'D01' },
      { value: 'D02', display: 'D02' },
      { value: 'D03', display: 'D03' }
    ],
    attributeCodes: [
      { value: 'A01', display: 'A01' }
    ],
    tests: []
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('LabTestsApiService', ['getInterdictionCodesByTestId']);
    mockService.getInterdictionCodesByTestId.and.returnValue(of(mockFilterOptions.interdictionCodes));



      TestBed.configureTestingModule({
      imports: [LabTestsFilterPanel],
      providers: [
        provideHttpClient(),
        { provide: LabTestsApiService, useValue: mockService }
      ]
    });


    


      mockService.getInterdictionCodesByTestId.calls.reset();


      mockService.getInterdictionCodesByTestId.and.returnValue(of(mockFilterOptions.interdictionCodes));


    fixture = TestBed.createComponent(LabTestsFilterPanel);
    component = fixture.componentInstance;
    // Set testId so that loadFilterValues will actually load data
    component.testId = 'ABID';


    });

  describe('Component Initialization', () => {


    it('should have correct initial/repeat options', () => {
      expect(component.initialRepeatOptions.length).toBe(2);
      expect(component.initialRepeatOptions[0]).toEqual({ value: 'I', display: 'I - Initial' });
      expect(component.initialRepeatOptions[1]).toEqual({ value: 'R', display: 'R - Repeat' });
    });

    it('should have correct period options', () => {
      expect(component.periodOptions).toEqual([
        { value: 'After', display: 'After' },
        { value: 'Before', display: 'Before' }
      ]);
    });



    it('should load filter values on ngOnInit', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(mockService.getInterdictionCodesByTestId).toHaveBeenCalledWith('ABID');
      expect(component.interdictionCodeOptionsSignal().length).toBe(3);
    }));

    it('should handle error when loading filter values', fakeAsync(() => {
      // Create a fresh component with error mock
      mockService.getInterdictionCodesByTestId.and.returnValue(throwError(() => new Error('API Error')));

      const errorFixture = TestBed.createComponent(LabTestsFilterPanel);
      const errorComponent = errorFixture.componentInstance;
      errorComponent.testId = 'ABID';

      errorComponent.ngOnInit();
      tick();

      // Error should be handled gracefully without throwing
      expect(errorComponent.interdictionCodeOptionsSignal().length).toBe(0);
      expect(mockService.getInterdictionCodesByTestId).toHaveBeenCalled();
    }));
  });

  describe('Current Filters', () => {
    it('should populate form with current filters on init', fakeAsync(() => {
      component.currentFilters = {
        initialRepeat: 'I',
        interdictionCode: 'D01',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.ngOnInit();
      tick();

      expect(component.filterForm.get('initialRepeat')?.value).toBe('I');
      expect(component.filterForm.get('interdictionCode')?.value).toBe('D01');
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('After');
    }));

    it('should not patch form when currentFilters is null', fakeAsync(() => {
      component.currentFilters = null;

      component.ngOnInit();
      tick();

      expect(component.filterForm.get('initialRepeat')?.value).toBeNull();
    }));
  });

  describe('onApply', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
    }));



    it('should disable apply button when form is empty', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should enable apply button when at least one filter is selected', () => {
      component.filterForm.patchValue({
        initialRepeat: 'I'
      });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should emit all filter fields when all are set', () => {
      spyOn(component.apply, 'emit');
      const testDate = new Date('2024-06-15');

      component.filterForm.patchValue({
        initialRepeat: 'R',
        interdictionCode: 'D02',
        effectiveDatePeriod: 'Before',
        effectiveDate: testDate,
        terminationDatePeriod: 'After',
        terminationDate: testDate
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.initialRepeat).toBe('R');
      expect(emittedValue.interdictionCode).toBe('D02');
      expect(emittedValue.effectiveDatePeriod).toBe('Before');
      expect(emittedValue.terminationDatePeriod).toBe('After');
    });
  });


});
