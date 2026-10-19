import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { DaylightSavingsFilterPanel } from './daylight-savings-filter-panel';
import { DaylightSavingsFilterValue, DaylightSavingsFilterLov } from '../models/daylight-savings.model';
import { DaylightSavingsService } from '../services/daylight-savings.service';

describe('DaylightSavingsFilterPanel', () => {
  let component: DaylightSavingsFilterPanel;
  let fixture: ComponentFixture<DaylightSavingsFilterPanel>;
  let mockService: jasmine.SpyObj<DaylightSavingsService>;

  const mockFilterLovData: DaylightSavingsFilterLov = {
    chapterId: ['DAL', 'NYC', 'LAX'],
    chapterName: ['Dallas Blood Center', 'New York Blood Center', 'Los Angeles Blood Center'],
    timeZone: ['GMT-05:00', 'GMT-06:00', 'GMT-07:00', 'GMT-08:00'],
    timeZoneRegion: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'],
    dstOffSet: [-8, -7, -6, -5, -4, 0, 1, 2]
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DaylightSavingsService', ['getDaylightSavingsFilters']);
    mockService.getDaylightSavingsFilters.and.returnValue(of({
      success: true,
      message: '',
      error: null,
      statusCode: 200,
      data: [mockFilterLovData],
      total: 1
    }));



      TestBed.configureTestingModule({
      imports: [
        DaylightSavingsFilterPanel,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatFormFieldModule,
        MatInputModule],
      providers: [
        { provide: DaylightSavingsService, useValue: mockService }
      ]
    });


    


      mockService.getDaylightSavingsFilters.calls.reset();


    fixture = TestBed.createComponent(DaylightSavingsFilterPanel);
    component = fixture.componentInstance;


    });


  describe('Initialization', () => {
    it('should initialize the form with null values', () => {
      fixture.detectChanges();

      expect(component.filterForm).toBeDefined();
      expect(component.filterForm.get('chapterId')?.value).toBeNull();
      expect(component.filterForm.get('chapterName')?.value).toBeNull();
      expect(component.filterForm.get('timeZone')?.value).toBeNull();
      expect(component.filterForm.get('dstOffSet')?.value).toBeNull();
    });

    it('should have predefined chapter ID options', () => {
      fixture.detectChanges();

      expect(component.chapterIdOptions).toBeDefined();
      expect(component.chapterIdOptions.length).toBeGreaterThan(0);
    });

    it('should have predefined chapter name options', () => {
      fixture.detectChanges();

      expect(component.chapterNameOptions).toBeDefined();
      expect(component.chapterNameOptions.length).toBeGreaterThan(0);
    });

    it('should have predefined time zone options', () => {
      fixture.detectChanges();

      expect(component.timeZoneOptions).toBeDefined();
      expect(component.timeZoneOptions.length).toBeGreaterThan(0);
    });

    it('should populate form with current filters if provided', () => {
      const currentFilters: DaylightSavingsFilterValue = {
        chapterId: 'DAL',
        chapterName: 'Dallas Blood Center',
        timeZone: 'GMT-06:00',
        dstOffSet: -6
      };
      component.currentFilters = currentFilters;

      fixture.detectChanges();

      expect(component.filterForm.get('chapterId')?.value).toBe('DAL');
      expect(component.filterForm.get('chapterName')?.value).toBe('Dallas Blood Center');
      expect(component.filterForm.get('timeZone')?.value).toBe('GMT-06:00');
      expect(component.filterForm.get('dstOffSet')?.value).toBe(-6);
    });



    it('should handle partial current filters', () => {
      const partialFilters: DaylightSavingsFilterValue = {
        chapterId: 'NYC',
        chapterName: null,
        timeZone: null,
        dstOffSet: null
      };
      component.currentFilters = partialFilters;

      fixture.detectChanges();

      expect(component.filterForm.get('chapterId')?.value).toBe('NYC');
      expect(component.filterForm.get('chapterName')?.value).toBeNull();
      expect(component.filterForm.get('timeZone')?.value).toBeNull();
      expect(component.filterForm.get('dstOffSet')?.value).toBeNull();
    });
  });

  describe('Form Interactions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update form value when chapter ID is selected', () => {
      component.filterForm.get('chapterId')?.setValue('DAL');

      expect(component.filterForm.get('chapterId')?.value).toBe('DAL');
    });

    it('should update form value when chapter name is selected', () => {
      component.filterForm.get('chapterName')?.setValue('Dallas Blood Center');

      expect(component.filterForm.get('chapterName')?.value).toBe('Dallas Blood Center');
    });

    it('should update form value when time zone is selected', () => {
      component.filterForm.get('timeZone')?.setValue('GMT-06:00');

      expect(component.filterForm.get('timeZone')?.value).toBe('GMT-06:00');
    });

    it('should update form value when DST offset is entered', () => {
      component.filterForm.get('dstOffSet')?.setValue(-6);

      expect(component.filterForm.get('dstOffSet')?.value).toBe(-6);
    });

    it('should allow multiple form fields to be set', () => {
      component.filterForm.patchValue({
        chapterId: 'NYC',
        chapterName: 'New York Blood Center',
        timeZone: 'GMT-05:00',
        dstOffSet: -5
      });

      expect(component.filterForm.value).toEqual({
        chapterId: 'NYC',
        chapterName: 'New York Blood Center',
        timeZone: 'GMT-05:00',
        dstOffSet: -5
      });
    });
  });




  describe('Template Bindings', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should render CLEAR ALL button', () => {
      const clearButton = fixture.nativeElement.querySelector('button[mat-stroked-button]');
      expect(clearButton).toBeTruthy();
      expect(clearButton.textContent.trim()).toBe('CLEAR ALL');
    });



    it('should render APPLY button', () => {
      const applyButton = fixture.nativeElement.querySelector('button[mat-raised-button]');
      expect(applyButton).toBeTruthy();
      expect(applyButton.textContent.trim()).toBe('APPLY');
    });



    it('should render all three mat-select fields', () => {
      const selects = fixture.nativeElement.querySelectorAll('mat-select');
      expect(selects.length).toBe(3);
    });



    it('should render filter panel header', () => {
      const header = fixture.nativeElement.querySelector('.filter-panel__header h2');
      expect(header).toBeTruthy();
      expect(header.textContent.trim()).toBe('Filters');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have proper ARIA attributes on section', () => {
      const section = fixture.nativeElement.querySelector('section');
      expect(section.getAttribute('role')).toBe('dialog');
      expect(section.getAttribute('aria-modal')).toBe('true');
      expect(section.getAttribute('aria-labelledby')).toBe('filter-title');
    });

    it('should have heading with correct id', () => {
      const heading = fixture.nativeElement.querySelector('#filter-title');
      expect(heading).toBeTruthy();
      expect(heading.tagName).toBe('H2');
    });


  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should allow applying filters multiple times', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        chapterId: 'DAL',
        chapterName: null,
        timeZone: null,
        dstOffSet: null
      });

      component.onApply();
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledTimes(2);
    });
  });

  describe('Filter Options', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should include common chapter IDs', () => {
      expect(component.chapterIdOptions).toContain('DAL');
      expect(component.chapterIdOptions).toContain('NYC');
      expect(component.chapterIdOptions).toContain('LAX');
    });

    it('should include common time zones', () => {
      expect(component.timeZoneOptions).toContain('GMT-05:00');
      expect(component.timeZoneOptions).toContain('GMT-06:00');
      expect(component.timeZoneOptions).toContain('GMT-07:00');
    });

  });



  describe('Custom Validators', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    describe('integerValidator', () => {




      it('should return null for valid integer', () => {
        const control = component.filterForm.get('dstOffSet');
        control?.setValue(60);

        expect(control?.hasError('notInteger')).toBeFalsy();
      });

      it('should return error for decimal number', () => {
        const control = component.filterForm.get('dstOffSet');
        control?.setValue(5.5);

        expect(control?.hasError('notInteger')).toBeTruthy();
      });

      it('should return error for float number', () => {
        const control = component.filterForm.get('dstOffSet');
        control?.setValue(10.75);

        expect(control?.hasError('notInteger')).toBeTruthy();
      });

      it('should accept zero as valid integer', () => {
        const control = component.filterForm.get('dstOffSet');
        control?.setValue(0);

        expect(control?.hasError('notInteger')).toBeFalsy();
      });
    });
  });

  describe('DST Offset Range Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate minimum value of 0', () => {
      const control = component.filterForm.get('dstOffSet');
      control?.setValue(-1);

      expect(control?.hasError('min')).toBeTruthy();
      expect(control?.valid).toBeFalsy();
    });

    it('should accept 0 as minimum valid value', () => {
      const control = component.filterForm.get('dstOffSet');
      control?.setValue(0);

      expect(control?.hasError('min')).toBeFalsy();
    });

    it('should validate maximum value of 120', () => {
      const control = component.filterForm.get('dstOffSet');
      control?.setValue(121);

      expect(control?.hasError('max')).toBeTruthy();
      expect(control?.valid).toBeFalsy();
    });

    it('should accept 120 as maximum valid value', () => {
      const control = component.filterForm.get('dstOffSet');
      control?.setValue(120);

      expect(control?.hasError('max')).toBeFalsy();
    });

    it('should accept value within range', () => {
      const control = component.filterForm.get('dstOffSet');
      control?.setValue(60);

      expect(control?.hasError('min')).toBeFalsy();
      expect(control?.hasError('max')).toBeFalsy();
      expect(control?.valid).toBeTruthy();
    });


  });



  describe('getDstOffsetError()', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should return error message for non-integer value', () => {
      const control = component.filterForm.get('dstOffSet');
      control?.setValue(5.5);
      control?.markAsTouched();

      expect(component.getDstOffsetError()).toBe('Enter valid number');
    });

    it('should return error message for value below minimum', () => {
      const control = component.filterForm.get('dstOffSet');
      control?.setValue(-1);
      control?.markAsTouched();

      expect(component.getDstOffsetError()).toBe('DST Offset must be at least 0');
    });

    it('should return error message for value above maximum', () => {
      const control = component.filterForm.get('dstOffSet');
      control?.setValue(121);
      control?.markAsTouched();

      expect(component.getDstOffsetError()).toBe('DST Offset cannot exceed 120 minutes');
    });

    it('should return error message when control is dirty', () => {
      const control = component.filterForm.get('dstOffSet');
      control?.setValue(150);
      control?.markAsDirty();

      expect(component.getDstOffsetError()).toBe('DST Offset cannot exceed 120 minutes');
    });




  });

  describe('onDstOffsetInput()', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });







    it('should handle missing control gracefully', () => {
      spyOn(component.filterForm, 'get').and.returnValue(null);

      expect(() => component.onDstOffsetInput()).not.toThrow();
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    describe('Chapter ID Search', () => {
      it('should filter chapter IDs based on search term', () => {
        component.chapterIdSearchControl.setValue('DAL');

        expect(component.filteredChapterIdOptions).toContain('DAL');
        expect(component.filteredChapterIdOptions.length).toBeLessThanOrEqual(component.chapterIdOptions.length);
      });





      it('should filter partial matches', () => {
        component.chapterIdSearchControl.setValue('LA');

        expect(component.filteredChapterIdOptions).toContain('LAX');
      });


    });

    describe('Chapter Name Search', () => {
      it('should filter chapter names based on search term', () => {
        component.chapterNameSearchControl.setValue('Dallas');

        expect(component.filteredChapterNameOptions).toContain('Dallas Blood Center');
      });





      it('should filter partial matches', () => {
        component.chapterNameSearchControl.setValue('Blood');

        expect(component.filteredChapterNameOptions.length).toBeGreaterThan(0);
      });
    });

    describe('Time Zone Search', () => {
      it('should filter time zones based on search term', () => {
        component.timeZoneSearchControl.setValue('GMT-06');

        expect(component.filteredTimeZoneOptions).toContain('GMT-06:00');
      });





      it('should filter partial matches', () => {
        component.timeZoneSearchControl.setValue('05');

        expect(component.filteredTimeZoneOptions).toContain('GMT-05:00');
      });
    });
  });

  describe('Service Error Handling', () => {
    it('should handle service error gracefully', () => {
      mockService.getDaylightSavingsFilters.and.returnValue(
        throwError(() => new Error('Service error'))
      );

      fixture.detectChanges();

      expect(component.chapterIdOptions).toEqual([]);
      expect(component.chapterNameOptions).toEqual([]);
      expect(component.timeZoneOptions).toEqual([]);
      expect(component.filteredChapterIdOptions).toEqual([]);
      expect(component.filteredChapterNameOptions).toEqual([]);
      expect(component.filteredTimeZoneOptions).toEqual([]);
      expect(component.isLoadingFilters).toBeFalsy();
    });




  });
  describe('Filter Options Loading', () => {


    it('should populate options from service response', () => {
      fixture.detectChanges();

      expect(component.chapterIdOptions).toEqual(['DAL', 'NYC', 'LAX']);
      expect(component.chapterNameOptions).toEqual(['Dallas Blood Center', 'New York Blood Center', 'Los Angeles Blood Center']);
      expect(component.timeZoneOptions).toEqual(['GMT-05:00', 'GMT-06:00', 'GMT-07:00', 'GMT-08:00']);
    });

    it('should initialize filtered options with all options', () => {
      fixture.detectChanges();

      expect(component.filteredChapterIdOptions).toEqual(component.chapterIdOptions);
      expect(component.filteredChapterNameOptions).toEqual(component.chapterNameOptions);
      expect(component.filteredTimeZoneOptions).toEqual(component.timeZoneOptions);
    });

    it('should handle empty data array from service', () => {
      mockService.getDaylightSavingsFilters.and.returnValue(of({
        success: true,
        message: '',
        error: null,
        statusCode: 200,
        data: [],
        total: 0
      }));

      fixture.detectChanges();

      expect(component.chapterIdOptions).toEqual([]);
    });


  });
});
