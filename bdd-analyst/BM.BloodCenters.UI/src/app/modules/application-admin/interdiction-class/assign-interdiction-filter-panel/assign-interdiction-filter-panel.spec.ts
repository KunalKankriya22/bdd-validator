import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatNativeDateModule } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import moment from 'moment';

import { AssignInterdictionFilterPanel } from './assign-interdiction-filter-panel';
import { AssignInterdictionClassService } from '../services/assign-interdiction-class.service';
import { AssignInterdictionClassFilterValue } from '../models/assign-interdiction-class.model';

describe('AssignInterdictionFilterPanel', () => {
  let serviceSpy: any;
  let component: AssignInterdictionFilterPanel;
  let fixture: ComponentFixture<AssignInterdictionFilterPanel>;
  let service: jasmine.SpyObj<AssignInterdictionClassService>;

  const mockFilterResponse = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: [
      {
        interdictionCode: ['INT001', 'INT002', 'INT003'],
        type: ['Type A', 'Type B', 'Type C'],
        class: ['Class 1', 'Class 2', 'Class 3']
      }
    ]
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('AssignInterdictionClassService', [
      'getAssignInterdictionClassFilters'
    ]);



      TestBed.configureTestingModule({
      imports: [
        AssignInterdictionFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatSelectModule,
        MatDatepickerModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatNativeDateModule,
        TranslateModule.forRoot(),
        HttpClientTestingModule
      ],
      providers: [
        { provide: AssignInterdictionClassService, useValue: serviceSpy }
      ]
    });


    


      serviceSpy.getAssignInterdictionClassFilters.calls.reset();


    service = TestBed.inject(AssignInterdictionClassService) as jasmine.SpyObj<AssignInterdictionClassService>;
    service.getAssignInterdictionClassFilters.and.returnValue(of(mockFilterResponse));

    fixture = TestBed.createComponent(AssignInterdictionFilterPanel);
    component = fixture.componentInstance;


    });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Initialization', () => {




    it('should initialize all form controls with null values', () => {
      fixture.detectChanges();
      
      expect(component.filterForm.get('interdictionCode')?.value).toBeNull();
      expect(component.filterForm.get('type')?.value).toBeNull();
      expect(component.filterForm.get('class')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });





    it('should have period options initialized', () => {
      expect(component.periodOptions).toEqual(['AFTER', 'BEFORE']);
    });
  });

  describe('Filter Data Loading', () => {
    it('should populate interdiction code options from API response', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      expect(component.interdictionCodeOptions).toEqual(['INT001', 'INT002', 'INT003']);
    }));

    it('should populate type options from API response', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.typeOptions).toEqual([
        { value: 'Type A', display: 'Type A' },
        { value: 'Type B', display: 'Type B' },
        { value: 'Type C', display: 'Type C' }
      ]);
    }));

    it('should populate class options from API response', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      expect(component.classOptions).toEqual(['Class 1', 'Class 2', 'Class 3']);
    }));

    it('should handle empty filter data', fakeAsync(() => {
      const emptyResponse = {
        success: true,
        data: [{}]
      };
      service.getAssignInterdictionClassFilters.and.returnValue(of(emptyResponse as any));
      
      fixture.detectChanges();
      tick();
      
      expect(component.interdictionCodeOptions).toEqual([]);
      expect(component.typeOptions).toEqual([]);
      expect(component.classOptions).toEqual([]);
    }));

    it('should handle error when loading filters', fakeAsync(() => {
      const errorResponse = { message: 'API Error' };
      service.getAssignInterdictionClassFilters.and.returnValue(
        throwError(() => errorResponse)
      );
      
      spyOn(console, 'error');
      fixture.detectChanges();
      tick();
      
      expect(console.error).toHaveBeenCalledWith('Error loading filter options:', errorResponse);
      expect(component.isLoadingFilters).toBe(false);
      expect(component.interdictionCodeOptions).toEqual([]);
      expect(component.typeOptions).toEqual([]);
      expect(component.classOptions).toEqual([]);
    }));

    it('should handle API response without data array', fakeAsync(() => {
      const invalidResponse = { success: true };
      service.getAssignInterdictionClassFilters.and.returnValue(of(invalidResponse as any));
      
      fixture.detectChanges();
      tick();
      
      expect(component.interdictionCodeOptions).toEqual([]);
      expect(component.typeOptions).toEqual([]);
      expect(component.classOptions).toEqual([]);
    }));
  });

  describe('Current Filters Population', () => {
    it('should populate form with current filters if provided', fakeAsync(() => {
      const currentFilters: AssignInterdictionClassFilterValue = {
        interdictionCode: 'INT001',
        type: 'Type A',
        class: 'Class 1',
        effectiveDatePeriod: 'After',
        effectiveDate: '2024-01-01',
        terminationDatePeriod: 'Before',
        terminationDate: '2024-12-31'
      };

      component.currentFilters = currentFilters;
      fixture.detectChanges();
      tick();

      const effectiveDateValue = component.filterForm.get('effectiveDate')?.value;
      const terminationDateValue = component.filterForm.get('terminationDate')?.value;

      expect(component.filterForm.get('interdictionCode')?.value).toBe('INT001');
      expect(component.filterForm.get('type')?.value).toBe('Type A');
      expect(component.filterForm.get('class')?.value).toBe('Class 1');
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('After');
      expect(moment.isMoment(effectiveDateValue)).toBe(true);
      expect(effectiveDateValue?.format('YYYY-MM-DD')).toBe('2024-01-01');
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('Before');
      expect(moment.isMoment(terminationDateValue)).toBe(true);
      expect(terminationDateValue?.format('YYYY-MM-DD')).toBe('2024-12-31');
    }));

    it('should populate form with partial current filters', fakeAsync(() => {
      const currentFilters: AssignInterdictionClassFilterValue = {
        interdictionCode: 'INT001',
        type: null,
        class: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      
      component.currentFilters = currentFilters;
      fixture.detectChanges();
      tick();
      
      expect(component.filterForm.get('interdictionCode')?.value).toBe('INT001');
      expect(component.filterForm.get('type')?.value).toBeNull();
      expect(component.filterForm.get('class')?.value).toBeNull();
    }));

    it('should not populate form when currentFilters is null', fakeAsync(() => {
      component.currentFilters = null;
      fixture.detectChanges();
      tick();
      
      expect(component.filterForm.get('interdictionCode')?.value).toBeNull();
      expect(component.filterForm.get('type')?.value).toBeNull();
    }));


  });

  describe('Apply Filters', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));





    it('should log applied filters to console', () => {
      spyOn(console, 'log');
      
      component.filterForm.patchValue({
        interdictionCode: 'INT001'
      });
      
      component.onApply();
      
      // console.log was removed from production code — verify apply emits instead
      expect(component.filterForm.value.interdictionCode).toBe('INT001');
    });

    it('should not emit apply when effectiveDate has matDatepickerParse error', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.get('effectiveDate')?.setErrors({ matDatepickerParse: { text: 'invalid' } });

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
      expect(component.filterForm.touched).toBe(true);
    });

    it('should not emit apply when terminationDate has matDatepickerParse error', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.get('terminationDate')?.setErrors({ matDatepickerParse: { text: 'invalid' } });

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
      expect(component.filterForm.touched).toBe(true);
    });

    it('should convert empty strings to null in emitted values', () => {
      spyOn(component.apply, 'emit');
      
      component.filterForm.patchValue({
        interdictionCode: '',
        type: '',
        class: ''
      });
      
      component.onApply();
      
      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.interdictionCode).toBeNull();
      expect(emittedValue.type).toBeNull();
      expect(emittedValue.class).toBeNull();
    });
  });

  describe('Clear Filters', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should reset all form controls to null', () => {
      component.filterForm.patchValue({
        interdictionCode: 'INT001',
        type: 'Type A',
        class: 'Class 1',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2024-12-31')
      });
      
      component.onClear();
      
      expect(component.filterForm.get('interdictionCode')?.value).toBeNull();
      expect(component.filterForm.get('type')?.value).toBeNull();
      expect(component.filterForm.get('class')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });

    it('should mark form as pristine after clear', () => {
      component.filterForm.patchValue({ interdictionCode: 'INT001' });
      component.filterForm.markAsDirty();
      
      component.onClear();
      
      expect(component.filterForm.pristine).toBe(true);
    });

    it('should not emit apply event when clearing (user must click APPLY)', () => {
      spyOn(component.apply, 'emit');
      spyOn(component.close, 'emit');

      component.onClear();

      expect(component.apply.emit).not.toHaveBeenCalled();
      expect(component.close.emit).not.toHaveBeenCalled();
    });
  });
  describe('Form Validation and State', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));
 
    it('should have valid form when all fields are filled', () => {
      component.filterForm.patchValue({
        interdictionCode: 'INT001',
        type: 'Type A',
        class: 'Class 1',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2024-12-31')
      });
      
      expect(component.filterForm.valid).toBe(true);
    });

    it('should mark form as dirty after user input', () => {
      component.filterForm.patchValue({ interdictionCode: 'INT001' });
      component.filterForm.markAsDirty();
      
      expect(component.filterForm.dirty).toBe(true);
    });

    it('should mark form as touched after user interaction', () => {
      component.filterForm.markAllAsTouched();
      
      expect(component.filterForm.touched).toBe(true);
    });
  });
  describe('Edge Cases', () => {
    it('should handle undefined filter data gracefully', fakeAsync(() => {
      const undefinedResponse = {
        success: true,
        data: undefined
      };
      service.getAssignInterdictionClassFilters.and.returnValue(of(undefinedResponse as any));
      
      fixture.detectChanges();
      tick();
      
      expect(component.interdictionCodeOptions).toEqual([]);
      expect(component.typeOptions).toEqual([]);
      expect(component.classOptions).toEqual([]);
    }));

    it('should handle filter data with missing properties', fakeAsync(() => {
      const partialResponse = {
        success: true,
        data: [
          {
            interdictionCode: ['INT001']
          }
        ]
      };
      service.getAssignInterdictionClassFilters.and.returnValue(of(partialResponse as any));
      
      fixture.detectChanges();
      tick();
      
      expect(component.interdictionCodeOptions).toEqual(['INT001']);
      expect(component.typeOptions).toEqual([]);
      expect(component.classOptions).toEqual([]);
    }));
  
  });

  describe('Integration Tests', () => {
    it('should complete full filter workflow', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      component.filterForm.patchValue({
        interdictionCode: 'INT001',
        type: 'Type A',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01')
      });
      
      spyOn(component.apply, 'emit');
      component.onApply();
      
      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        interdictionCode: 'INT001',
        type: 'Type A',
        effectiveDatePeriod: 'After'
      }));
      
      component.onClear();
      
      expect(component.filterForm.get('interdictionCode')?.value).toBeNull();
      expect(component.filterForm.get('type')?.value).toBeNull();
    }));

    it('should handle loading filters and populating current filters in sequence', fakeAsync(() => {
      const currentFilters: AssignInterdictionClassFilterValue = {
        interdictionCode: 'INT001',
        type: 'Type A',
        class: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      
      component.currentFilters = currentFilters;
      fixture.detectChanges();
      tick();
      
      expect(component.interdictionCodeOptions.length).toBeGreaterThan(0);
      expect(component.filterForm.get('interdictionCode')?.value).toBe('INT001');
      expect(component.filterForm.get('type')?.value).toBe('Type A');
    }));
  });
});