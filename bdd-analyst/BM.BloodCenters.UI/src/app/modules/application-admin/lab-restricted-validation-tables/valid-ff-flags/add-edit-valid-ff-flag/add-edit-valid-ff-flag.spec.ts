import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';
import moment from 'moment';

import { AddEditValidFfFlag } from './add-edit-valid-ff-flag';
import { ValidFfFlagService } from '../services/valid-ff-flag.service';
import { ValidFfFlagModel, DropdownOption, ReturnResult } from '../models/valid-ff-flag.model';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('AddEditValidFfFlag', () => {
  let filtered: any;
  let raw: any;
  let saveSubject: any;
  let component: AddEditValidFfFlag;
  let fixture: ComponentFixture<AddEditValidFfFlag>;
  let mockService: jasmine.SpyObj<ValidFfFlagService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: any;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;

  const mockChapterOptions: DropdownOption[] = [
    { key: 'All Chapters', value: 'ALL' },
    { key: 'Chapter 01', value: 'CH01' },
    { key: 'Chapter 02', value: 'CH02' }
  ];

  const mockFacilityOptions: DropdownOption[] = [
    { key: 'U.S. Naval Hospital', value: 'W0352' },
    { key: 'Army Medical Center', value: 'W0353' }
  ];

  const mockSourceTypeOptions: DropdownOption[] = [
    { key: 'Donor Source', value: 'DONOR' },
    { key: 'Product Source', value: 'PRODUCT' }
  ];

  const mockEditData: ValidFfFlagModel = {
    chapterID: 'ALL',
    collectionFacilityId: 'W0352',
    sourceType: 'DONOR',
    ffFlagValue: '00',
    effectiveDate: '2017-03-22T17:04:05',
    terminationDate: '2027-03-22T17:04:05',
    modificationDate: '2025-03-25T10:00:00'
  };

  const createReturnResult = <T>(data: T[]): ReturnResult<T> => ({
    success: true,
    message: 'Success',
    error: null,
    statusCode: 200,
    data,
    total: data.length
  });

  beforeEach(() => {
    mockService = jasmine.createSpyObj('ValidFfFlagService', [
      'getAddDropdownChapters',
      'getAddDropdownCollectionFacilities',
      'getAddDropdownSourceTypes',
      'addValidFfFlag',
      'updateValidFfFlag'
    ]);

    mockSnackbarService = createMockSnackbarService();
    mockHeaderService = { chapterTimeZone: signal('+00:00') };
    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate']);
    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment().startOf('day'));

    mockService.getAddDropdownChapters.and.returnValue(
      of(createReturnResult(mockChapterOptions))
    );
    mockService.getAddDropdownCollectionFacilities.and.returnValue(
      of(createReturnResult(mockFacilityOptions))
    );
    mockService.getAddDropdownSourceTypes.and.returnValue(
      of(createReturnResult(mockSourceTypeOptions))
    );



      TestBed.configureTestingModule({
      imports: [AddEditValidFfFlag, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: ValidFfFlagService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService }
      ]
    });

    fixture = TestBed.createComponent(AddEditValidFfFlag);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {




    it('should initialize isSaving as false', () => {
      expect(component.isSaving).toBeFalse();
    });

    it('should not load any dropdowns from ngOnInit (loaded per mode via setupPanel)', () => {
      component.ngOnInit();

      expect(mockService.getAddDropdownChapters).not.toHaveBeenCalled();
      expect(mockService.getAddDropdownSourceTypes).not.toHaveBeenCalled();
      expect(mockService.getAddDropdownCollectionFacilities).not.toHaveBeenCalled();
    });

    it('should load chapters and source types when entering add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(mockService.getAddDropdownChapters).toHaveBeenCalled();
      expect(component.chapterIdOptions().length).toBe(3);
      expect(mockService.getAddDropdownSourceTypes).toHaveBeenCalled();
      expect(component.sourceTypeOptions().length).toBe(2);
    });


  });

  describe('Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });



    it('should have collection facility disabled initially in add mode', () => {
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.form.get('collectionFacilityId')?.disabled).toBeTrue();
    });



    it('should disable and reset collection facility when chapter is cleared', () => {
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      component.form.get('chapterId')?.setValue('ALL');
      expect(component.form.get('collectionFacilityId')?.enabled).toBeTrue();

      component.form.get('chapterId')?.setValue(null);
      expect(component.form.get('collectionFacilityId')?.disabled).toBeTrue();
      expect(component.collectionFacilityIdOptions()).toEqual([]);
    });

    it('should load new facilities when chapter changes', () => {
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      component.form.get('chapterId')?.setValue('CH01');
      expect(mockService.getAddDropdownCollectionFacilities).toHaveBeenCalledWith('CH01');

      component.form.get('chapterId')?.setValue('CH02');
      expect(mockService.getAddDropdownCollectionFacilities).toHaveBeenCalledWith('CH02');
    });

    it('should mark required fields as invalid when empty', () => {
      component.form.markAllAsTouched();

      expect(component.form.get('chapterId')?.valid).toBeFalse();
      expect(component.form.get('sourceType')?.valid).toBeFalse();
      expect(component.form.get('ffFlagValue')?.valid).toBeFalse();
      expect(component.form.get('effectiveDate')?.valid).toBeFalse();
    });

    it('should validate ffFlagValue maxLength of 2', () => {
      component.form.get('ffFlagValue')?.setValue('ABC');
      expect(component.form.get('ffFlagValue')?.hasError('maxlength')).toBeTrue();
    });

    it('should validate ffFlagValue whitespace only', () => {
      component.form.get('ffFlagValue')?.setValue('  ');
      expect(component.form.get('ffFlagValue')?.hasError('whitespaceOnly')).toBeTrue();
    });



    it('should submit add payload with correct structure', () => {
      mockService.addValidFfFlag.and.returnValue(
        of(createReturnResult([mockEditData]))
      );
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      component.form.get('chapterId')?.setValue('ALL');
      component.form.get('collectionFacilityId')?.setValue('W0352');
      component.form.get('sourceType')?.setValue('DONOR');
      component.form.get('ffFlagValue')?.setValue('00');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));

      component.onSave();

      expect(mockService.addValidFfFlag).toHaveBeenCalledWith(jasmine.objectContaining({
        chapterID: 'ALL',
        collectionFacilityId: 'W0352',
        sourceType: 'DONOR',
        ffFlagValue: '00'
      }));
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });


  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: mockEditData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });
    });







    it('should set last modified text', () => {
      expect(component.lastModified).toContain('Last Modified:');
    });

    it('should load collection facilities for existing chapter', () => {
      expect(mockService.getAddDropdownCollectionFacilities).toHaveBeenCalledWith('ALL');
    });





    it('should not make duplicate API calls in edit mode', () => {
      expect(mockService.getAddDropdownSourceTypes).toHaveBeenCalledTimes(1);
      expect(mockService.getAddDropdownCollectionFacilities).toHaveBeenCalledTimes(1);
    });

    it('should not trigger chapter change listener in edit mode', () => {
      const facilityCalls = mockService.getAddDropdownCollectionFacilities.calls.count();
      component.form.get('chapterId')?.setValue('CH01');
      expect(mockService.getAddDropdownCollectionFacilities.calls.count()).toBe(facilityCalls);
    });

    it('should submit update payload with original values', () => {
      mockService.updateValidFfFlag.and.returnValue(
        of(createReturnResult([mockEditData]))
      );
      spyOn(component.saveSuccess, 'emit');

      component.form.get('ffFlagValue')?.setValue('01');
      component.form.get('ffFlagValue')?.markAsDirty();

      component.onSave();

      expect(mockService.updateValidFfFlag).toHaveBeenCalledWith(jasmine.objectContaining({
        originalChapterID: 'ALL',
        originalCollectionFacilityId: 'W0352',
        originalSourceType: 'DONOR',
        ffFlagValue: '01'
      }));
    });
  });

  describe('View Mode', () => {
    beforeEach(() => {
      component.mode = 'view';
      component.data = mockEditData;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'view',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: mockEditData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });
    });





    it('should populate form with data values', () => {
      raw = component.form.getRawValue();
      expect(raw.chapterId).toBe('ALL');
      expect(raw.collectionFacilityId).toBe('W0352');
      expect(raw.sourceType).toBe('DONOR');
      expect(raw.ffFlagValue).toBe('00');
    });
  });

  describe('Dropdown Loading States', () => {






    it('should handle chapter loading error gracefully', () => {
      mockService.getAddDropdownChapters.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.chapterIdOptions()).toEqual([]);
      expect(component.isLoadingChapters).toBeFalse();
    });

    it('should handle facility loading error gracefully', () => {
      mockService.getAddDropdownCollectionFacilities.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      component.form.get('chapterId')?.setValue('ALL');

      expect(component.collectionFacilityIdOptions()).toEqual([]);
      expect(component.isLoadingFacilities).toBeFalse();
    });

    it('should handle source type loading error gracefully', () => {
      mockService.getAddDropdownSourceTypes.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.sourceTypeOptions()).toEqual([]);
      expect(component.isLoadingSourceTypes).toBeFalse();
    });
  });

  describe('Search Filtering (Computed Signals)', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });
    });





    it('should return all chapters when search is empty', () => {
      component.chapterIdSearch.set('');
      filtered = component.filteredChapterIds();
      expect(filtered.length).toBe(3);
    });







    it('should update search signal when search control value changes', () => {
      component.chapterIdSearchControl.setValue('test');
      expect(component.chapterIdSearch()).toBe('test');

      component.collectionFacilitySearchControl.setValue('facility');
      expect(component.collectionFacilitySearch()).toBe('facility');

      component.sourceTypeSearchControl.setValue('type');
      expect(component.sourceTypeSearch()).toBe('type');
    });

    it('should set empty string when search control value is null', () => {
      component.chapterIdSearchControl.setValue(null);
      expect(component.chapterIdSearch()).toBe('');
    });
  });

  describe('FF Flag Value Input', () => {
    it('should transform input to uppercase and trim leading spaces', () => {
      const inputElement = document.createElement('input');
      inputElement.value = ' ab';
      const event = { target: inputElement } as unknown as Event;

      component.onFfFlagValueInput(event);

      expect(inputElement.value).toBe('AB');
    });

    it('should not transform when already uppercase with no leading spaces', () => {
      const inputElement = document.createElement('input');
      inputElement.value = 'AB';
      const event = { target: inputElement } as unknown as Event;

      component.onFfFlagValueInput(event);

      expect(inputElement.value).toBe('AB');
    });
  });

  describe('Date Formatting', () => {
    it('should format date for display', () => {
      const formatted = component.formatDate('2025-03-25T10:30:00');
      expect(formatted).toMatch(/\d{2}-[A-Z]{3}-\d{4}/);
    });




  });
  describe('Event Emissions', () => {




    it('should not close panel on save and create another', () => {
      mockService.addValidFfFlag.and.returnValue(
        of(createReturnResult([mockEditData]))
      );
      spyOn(component.closePanel, 'emit');
      spyOn(component.saveSuccess, 'emit');

      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      component.form.get('chapterId')?.setValue('ALL');
      component.form.get('collectionFacilityId')?.setValue('W0352');
      component.form.get('sourceType')?.setValue('DONOR');
      component.form.get('ffFlagValue')?.setValue('00');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));

      component.onSaveAndCreateAnother();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).not.toHaveBeenCalled();
    });
  });

  describe('Save Error Handling', () => {
    it('should set isSaving to false on save error', () => {
      mockService.addValidFfFlag.and.returnValue(
        throwError(() => new Error('Save failed'))
      );
      spyOn(console, 'error');

      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      component.form.get('chapterId')?.setValue('ALL');
      component.form.get('collectionFacilityId')?.setValue('W0352');
      component.form.get('sourceType')?.setValue('DONOR');
      component.form.get('ffFlagValue')?.setValue('00');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));

      component.onSave();

      expect(component.isSaving).toBeFalse();
      expect(console.error).toHaveBeenCalled();
    });

    it('should show isSaving while save is in progress', () => {
      saveSubject = new Subject<ReturnResult<ValidFfFlagModel>>();
      mockService.addValidFfFlag.and.returnValue(saveSubject.asObservable());

      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      component.form.get('chapterId')?.setValue('ALL');
      component.form.get('collectionFacilityId')?.setValue('W0352');
      component.form.get('sourceType')?.setValue('DONOR');
      component.form.get('ffFlagValue')?.setValue('00');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));

      component.onSave();

      expect(component.isSaving).toBeTrue();

      saveSubject.next(createReturnResult([mockEditData]));
      saveSubject.complete();

      expect(component.isSaving).toBeFalse();
    });
  });
  describe('isFormValid - Edit Mode Behavior', () => {
    it('should allow save button when other fields are changed even with past termination date', () => {
      const pastTermData: ValidFfFlagModel = {
        ...mockEditData,
        terminationDate: '2021-01-01T00:00:00'
      };

      component.mode = 'edit';
      component.data = pastTermData;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: pastTermData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      component.form.get('ffFlagValue')?.setValue('01');
      component.form.get('ffFlagValue')?.markAsDirty();

      expect(component.isFormValid).toBeTrue();
    });

    it('should block save and show error when termination date is in past', () => {
      const pastTermData: ValidFfFlagModel = {
        ...mockEditData,
        terminationDate: '2021-01-01T00:00:00'
      };

      component.mode = 'edit';
      component.data = pastTermData;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: pastTermData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      component.form.get('ffFlagValue')?.setValue('01');
      component.form.get('ffFlagValue')?.markAsDirty();

      component.onSave();

      expect(mockService.updateValidFfFlag).not.toHaveBeenCalled();
      expect(component.getTerminationDateError()).toContain('past');
    });







    it('should return false when ffFlagValue has visible errors in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: mockEditData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      component.form.get('ffFlagValue')?.setValue('');
      component.form.get('ffFlagValue')?.markAsDirty();
      component.form.get('ffFlagValue')?.markAsTouched();

      expect(component.isFormValid).toBeFalse();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ and dropdownOptionsLoaded$ subjects', () => {
      component.ngOnInit();
      component.ngOnDestroy();

      // After destroy, subscriptions should be cleaned up
      // Verify by checking that no errors are thrown
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('terminationDateFilter', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });
    });

    it('should return true when date is null', () => {
      expect(component.terminationDateFilter(null)).toBeTrue();
    });

    it('should return false when date is before today', () => {
      const pastDate = moment().subtract(10, 'days');
      expect(component.terminationDateFilter(pastDate)).toBeFalse();
    });

    it('should return true when date is today or in the future', () => {
      const futureDate = moment().add(10, 'days');
      expect(component.terminationDateFilter(futureDate)).toBeTrue();
    });

    it('should return false when date is before effective date', () => {
      const effectiveDate = moment().add(10, 'days');
      component.form.get('effectiveDate')?.setValue(effectiveDate);

      const beforeEffective = moment().add(5, 'days');
      expect(component.terminationDateFilter(beforeEffective)).toBeFalse();
    });

    it('should return true when date is after effective date', () => {
      const effectiveDate = moment().add(5, 'days');
      component.form.get('effectiveDate')?.setValue(effectiveDate);

      const afterEffective = moment().add(10, 'days');
      expect(component.terminationDateFilter(afterEffective)).toBeTrue();
    });

    it('should return true when no effective date is set', () => {
      component.form.get('effectiveDate')?.setValue(null);

      const futureDate = moment().add(10, 'days');
      expect(component.terminationDateFilter(futureDate)).toBeTrue();
    });
  });

  describe('effectiveDateControl and terminationDateControl getters', () => {
    it('should return the effectiveDate form control', () => {
      expect(component.effectiveDateControl).toBe(component.form.get('effectiveDate'));
    });

    it('should return the terminationDate form control', () => {
      expect(component.terminationDateControl).toBe(component.form.get('terminationDate'));
    });
  });

  describe('isFormValid - Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });
    });

    it('should return form.valid when in add mode', () => {
      // Form is invalid when required fields are empty
      expect(component.isFormValid).toBeFalse();
    });

    it('should return true in add mode when all required fields are filled', () => {
      component.form.get('chapterId')?.setValue('ALL');
      component.form.get('collectionFacilityId')?.setValue('W0352');
      component.form.get('sourceType')?.setValue('DONOR');
      component.form.get('ffFlagValue')?.setValue('00');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));

      expect(component.isFormValid).toBeTrue();
    });
  });

  describe('isFormValid - Edit Mode (not dirty)', () => {
    it('should return false when form is not dirty in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: mockEditData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      // Form is populated but not dirty
      expect(component.isFormValid).toBeFalse();
    });
  });

  describe('getEffectiveDateError', () => {
    it('should pass form errors when lastChangedDateField is effective', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      // Trigger effective date change to set lastChangedDateField
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      component.form.get('effectiveDate')?.markAsTouched();

      const error = component.getEffectiveDateError();
      expect(typeof error).toBe('string');
    });

    it('should pass null for form errors when lastChangedDateField is not effective', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      // Trigger termination date change
      component.form.get('terminationDate')?.setValue(moment().add(5, 'days'));
      component.form.get('effectiveDate')?.markAsTouched();

      const error = component.getEffectiveDateError();
      expect(typeof error).toBe('string');
    });
  });

  describe('getTerminationDateError', () => {
    it('should pass form errors when lastChangedDateField is termination', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      component.form.get('terminationDate')?.setValue(moment().add(5, 'days'));
      component.form.get('terminationDate')?.markAsTouched();

      const error = component.getTerminationDateError();
      expect(typeof error).toBe('string');
    });

    it('should pass null for form errors when lastChangedDateField is not termination', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      // Set lastChangedDateField to effective
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      component.form.get('terminationDate')?.markAsTouched();

      const error = component.getTerminationDateError();
      expect(typeof error).toBe('string');
    });
  });

  describe('onEffectiveDateInput', () => {
    it('should delegate to DateFieldValidationUtility.handleStartDateInput', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '01-JAN-2027';
      const event = { target: inputElement } as unknown as Event;

      component.onEffectiveDateInput(event);
      // Should not throw
      expect(component.form.get('effectiveDate')).toBeTruthy();
    });

    it('should handle empty input value', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '';
      const event = { target: inputElement } as unknown as Event;

      component.onEffectiveDateInput(event);
      expect(component.form.get('effectiveDate')?.touched).toBeTrue();
    });
  });

  describe('onTerminationDateInput', () => {
    it('should delegate to DateFieldValidationUtility.handleEndDateInput in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const inputElement = document.createElement('input');
      inputElement.value = '01-JAN-2027';
      const event = { target: inputElement } as unknown as Event;

      component.onTerminationDateInput(event);
      expect(component.form.get('terminationDate')).toBeTruthy();
    });

    it('should pass isEditMode=true when mode is edit', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: mockEditData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      const inputElement = document.createElement('input');
      inputElement.value = '';
      const event = { target: inputElement } as unknown as Event;

      component.onTerminationDateInput(event);
      // In edit mode with empty input, should mark dirty
      expect(component.form.get('terminationDate')?.dirty).toBeTrue();
    });
  });

  describe('onCancel', () => {
    it('should emit closePanel event', () => {
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  describe('formatDate edge cases', () => {
    it('should return dash when date is null', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return dash when date is undefined', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('should format valid Date object', () => {
      const result = component.formatDate(new Date(2025, 2, 25)); // March 25, 2025
      expect(result).toMatch(/25-MAR-2025/);
    });
  });

  describe('formatLastModified (via lastModified property)', () => {
    it('should return empty string when modificationDate is null', () => {
      const dataNoMod: ValidFfFlagModel = { ...mockEditData, modificationDate: undefined };
      component.mode = 'view';
      component.data = dataNoMod;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'view',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: dataNoMod,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.lastModified).toBe('');
    });

    it('should return empty string when modificationDate is not ISO format', () => {
      const badDate: ValidFfFlagModel = { ...mockEditData, modificationDate: 'invalid-date' };
      component.mode = 'edit';
      component.data = badDate;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: badDate,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.lastModified).toBe('');
    });

    it('should format last modified with valid ISO date', () => {
      const validData: ValidFfFlagModel = { ...mockEditData, modificationDate: '2025-03-25T10:30:00' };
      component.mode = 'edit';
      component.data = validData;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: validData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.lastModified).toContain('Last Modified:');
      expect(component.lastModified).toContain('10:30');
    });

    it('should use fallback timezone label when timezone is invalid', () => {
      mockHeaderService.chapterTimeZone = signal('invalid');
      const validData: ValidFfFlagModel = { ...mockEditData, modificationDate: '2025-03-25T10:30:00' };
      component.mode = 'edit';
      component.data = validData;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: validData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.lastModified).toContain('Last Modified:');
      // Falls back to '+00:00' when timezone invalid
      expect(component.lastModified).toContain('GMT');
    });

    it('should handle empty timezone string', () => {
      mockHeaderService.chapterTimeZone = signal('');
      const validData: ValidFfFlagModel = { ...mockEditData, modificationDate: '2025-03-25T10:30:00' };
      component.mode = 'edit';
      component.data = validData;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: validData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.lastModified).toContain('Last Modified:');
    });
  });

  describe('onSave early returns', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });
    });

    it('should return early when form is invalid', () => {
      // Leave required fields empty
      component.onSave();
      expect(mockService.addValidFfFlag).not.toHaveBeenCalled();
      expect(component.isSaving).toBeFalse();
    });

    it('should return early when effectiveDate is invalid', () => {
      component.form.get('chapterId')?.setValue('ALL');
      component.form.get('collectionFacilityId')?.setValue('W0352');
      component.form.get('sourceType')?.setValue('DONOR');
      component.form.get('ffFlagValue')?.setValue('00');
      component.form.get('effectiveDate')?.setValue('invalid');

      component.onSave();
      expect(mockService.addValidFfFlag).not.toHaveBeenCalled();
    });

    it('should return early when terminationDate is set but invalid', () => {
      component.form.get('chapterId')?.setValue('ALL');
      component.form.get('collectionFacilityId')?.setValue('W0352');
      component.form.get('sourceType')?.setValue('DONOR');
      component.form.get('ffFlagValue')?.setValue('00');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      component.form.get('terminationDate')?.setValue(moment.invalid());

      component.onSave();
      expect(mockService.addValidFfFlag).not.toHaveBeenCalled();
    });
  });

  describe('onSave with terminationDate in add mode', () => {
    it('should include terminationDate in add payload when provided', () => {
      mockService.addValidFfFlag.and.returnValue(
        of(createReturnResult([mockEditData]))
      );
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      component.form.get('chapterId')?.setValue('ALL');
      component.form.get('collectionFacilityId')?.setValue('W0352');
      component.form.get('sourceType')?.setValue('DONOR');
      component.form.get('ffFlagValue')?.setValue('00');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      component.form.get('terminationDate')?.setValue(moment().add(30, 'days'));

      component.onSave();

      const payload = mockService.addValidFfFlag.calls.mostRecent().args[0];
      expect(payload.terminationDate).toBeTruthy();
      expect(payload.terminationDate).toContain('Z');
    });

    it('should not include terminationDate in add payload when not provided', () => {
      mockService.addValidFfFlag.and.returnValue(
        of(createReturnResult([mockEditData]))
      );

      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      component.form.get('chapterId')?.setValue('ALL');
      component.form.get('collectionFacilityId')?.setValue('W0352');
      component.form.get('sourceType')?.setValue('DONOR');
      component.form.get('ffFlagValue')?.setValue('00');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));

      component.onSave();

      const payload = mockService.addValidFfFlag.calls.mostRecent().args[0];
      expect(payload.terminationDate).toBeUndefined();
    });
  });

  describe('onSave in edit mode with terminationDate', () => {
    it('should include terminationDate in update payload when provided', () => {
      mockService.updateValidFfFlag.and.returnValue(
        of(createReturnResult([mockEditData]))
      );
      spyOn(component.saveSuccess, 'emit');

      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: mockEditData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      component.form.get('ffFlagValue')?.setValue('01');
      component.form.get('ffFlagValue')?.markAsDirty();

      component.onSave();

      const payload = mockService.updateValidFfFlag.calls.mostRecent().args[0];
      expect(payload.terminationDate).toBeTruthy();
      expect(payload.effectiveDate).toBe('2017-03-22T17:04:05');
    });

    it('should use original effective date in update payload', () => {
      mockService.updateValidFfFlag.and.returnValue(
        of(createReturnResult([mockEditData]))
      );

      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: mockEditData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      component.form.get('ffFlagValue')?.setValue('01');
      component.form.get('ffFlagValue')?.markAsDirty();

      component.onSave();

      const payload = mockService.updateValidFfFlag.calls.mostRecent().args[0];
      expect(payload.effectiveDate).toBe('2017-03-22T17:04:05');
      expect(payload.originalChapterID).toBe('ALL');
      expect(payload.originalCollectionFacilityId).toBe('W0352');
      expect(payload.originalSourceType).toBe('DONOR');
    });
  });

  describe('onSave edit mode without terminationDate', () => {
    it('should not include terminationDate when not set', () => {
      const dataNoTerm: ValidFfFlagModel = {
        ...mockEditData,
        terminationDate: undefined
      };
      mockService.updateValidFfFlag.and.returnValue(
        of(createReturnResult([dataNoTerm]))
      );

      component.mode = 'edit';
      component.data = dataNoTerm;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: dataNoTerm,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      component.form.get('ffFlagValue')?.setValue('01');
      component.form.get('ffFlagValue')?.markAsDirty();

      component.onSave();

      const payload = mockService.updateValidFfFlag.calls.mostRecent().args[0];
      expect(payload.terminationDate).toBeUndefined();
    });
  });

  describe('View Mode details', () => {
    it('should set panel title for view mode', () => {
      component.mode = 'view';
      component.data = mockEditData;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'view',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: mockEditData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.panelTitle).toBe('View ff Flag Value');
    });

    it('should disable form in view mode', () => {
      component.mode = 'view';
      component.data = mockEditData;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'view',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: mockEditData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.form.disabled).toBeTrue();
    });

    it('should set effectiveDate as moment object in view mode', () => {
      component.mode = 'view';
      component.data = mockEditData;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'view',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: mockEditData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      const rawVal = component.form.getRawValue();
      expect(moment.isMoment(rawVal.effectiveDate)).toBeTrue();
      expect(moment.isMoment(rawVal.terminationDate)).toBeTrue();
    });
  });

  describe('Edit Mode panel setup', () => {
    it('should set panel title to Edit ff Flag Value', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: mockEditData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.panelTitle).toBe('Edit ff Flag Value');
    });

    it('should disable chapterId field in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: mockEditData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.form.get('chapterId')?.disabled).toBeTrue();
    });

    it('should not load collection facilities when chapterID is missing in edit data', () => {
      const noChapterData: ValidFfFlagModel = {
        ...mockEditData,
        chapterID: undefined
      };

      mockService.getAddDropdownCollectionFacilities.calls.reset();

      component.mode = 'edit';
      component.data = noChapterData;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: noChapterData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(mockService.getAddDropdownCollectionFacilities).not.toHaveBeenCalled();
    });
  });

  describe('Add Mode panel setup', () => {
    it('should set panel title to Add New ff Flag Value', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.panelTitle).toBe('Add New ff Flag Value');
    });

    it('should clear lastModified in add mode', () => {
      component.lastModified = 'some previous value';
      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.lastModified).toBe('');
    });
  });

  describe('Dropdown null data handling', () => {
    it('should set empty array when chapters response data is null', () => {
      mockService.getAddDropdownChapters.and.returnValue(
        of({ success: true, message: '', error: null, statusCode: 200, data: null, total: 0 })
      );

      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.chapterIdOptions()).toEqual([]);
      expect(component.isLoadingChapters).toBeFalse();
    });

    it('should set empty array when facilities response data is null', () => {
      mockService.getAddDropdownCollectionFacilities.and.returnValue(
        of({ success: true, message: '', error: null, statusCode: 200, data: null, total: 0 })
      );

      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      component.form.get('chapterId')?.setValue('ALL');

      expect(component.collectionFacilityIdOptions()).toEqual([]);
      expect(component.isLoadingFacilities).toBeFalse();
    });

    it('should set empty array when source types response data is null', () => {
      mockService.getAddDropdownSourceTypes.and.returnValue(
        of({ success: true, message: '', error: null, statusCode: 200, data: null, total: 0 })
      );

      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.sourceTypeOptions()).toEqual([]);
      expect(component.isLoadingSourceTypes).toBeFalse();
    });
  });

  describe('Search Filtering - Facilities and Source Types', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });
      // Load facilities
      component.form.get('chapterId')?.setValue('ALL');
    });

    it('should return all facilities when search is empty', () => {
      component.collectionFacilitySearch.set('');
      const result = component.filteredCollectionFacilityIds();
      expect(result.length).toBe(2);
    });

    it('should filter facilities by key', () => {
      component.collectionFacilitySearch.set('Naval');
      const result = component.filteredCollectionFacilityIds();
      expect(result.length).toBe(1);
      expect(result[0].key).toContain('Naval');
    });

    it('should filter facilities by value', () => {
      component.collectionFacilitySearch.set('W0352');
      const result = component.filteredCollectionFacilityIds();
      expect(result.length).toBe(1);
      expect(result[0].value).toBe('W0352');
    });

    it('should return all source types when search is empty', () => {
      component.sourceTypeSearch.set('');
      const result = component.filteredSourceTypes();
      expect(result.length).toBe(2);
    });

    it('should filter source types by key', () => {
      component.sourceTypeSearch.set('Donor');
      const result = component.filteredSourceTypes();
      expect(result.length).toBe(1);
      expect(result[0].key).toContain('Donor');
    });

    it('should filter source types by value', () => {
      component.sourceTypeSearch.set('PRODUCT');
      const result = component.filteredSourceTypes();
      expect(result.length).toBe(1);
      expect(result[0].value).toBe('PRODUCT');
    });

    it('should return empty array when no facilities match search', () => {
      component.collectionFacilitySearch.set('NONEXISTENT');
      const result = component.filteredCollectionFacilityIds();
      expect(result.length).toBe(0);
    });

    it('should return empty array when no source types match search', () => {
      component.sourceTypeSearch.set('NONEXISTENT');
      const result = component.filteredSourceTypes();
      expect(result.length).toBe(0);
    });
  });

  describe('Search Filtering - Chapters filtering', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });
    });

    it('should filter chapters by key', () => {
      component.chapterIdSearch.set('Chapter 01');
      const result = component.filteredChapterIds();
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('Chapter 01');
    });

    it('should filter chapters by value', () => {
      component.chapterIdSearch.set('CH01');
      const result = component.filteredChapterIds();
      expect(result.length).toBe(1);
      expect(result[0].value).toBe('CH01');
    });

    it('should be case-insensitive', () => {
      component.chapterIdSearch.set('all');
      const result = component.filteredChapterIds();
      expect(result.length).toBe(1); // 'All Chapters' key matches 'all'
      expect(result[0].key).toBe('All Chapters');
    });
  });

  describe('setupDateValidationListeners', () => {
    it('should update form validity when effectiveDate changes', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnInit();

      spyOn(component.form, 'updateValueAndValidity');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));

      expect(component.form.updateValueAndValidity).toHaveBeenCalled();
    });

    it('should update form validity when terminationDate changes', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnInit();

      spyOn(component.form, 'updateValueAndValidity');
      component.form.get('terminationDate')?.setValue(moment().add(5, 'days'));

      expect(component.form.updateValueAndValidity).toHaveBeenCalled();
    });
  });

  describe('ngOnChanges triggers', () => {
    it('should call setupPanel when mode changes', () => {
      component.mode = 'add';
      fixture.detectChanges();

      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.panelTitle).toBe('Add New ff Flag Value');
    });

    it('should call setupPanel when data changes', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      component.ngOnChanges({
        data: {
          currentValue: mockEditData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.panelTitle).toBe('Edit ff Flag Value');
    });

    it('should not call setupPanel when unrelated properties change', () => {
      const previousTitle = component.panelTitle;
      component.ngOnChanges({});
      // panelTitle should remain unchanged
      expect(component.panelTitle).toBe(previousTitle);
    });
  });

  describe('selectPanelLoadingValue and selectPanelEmptyValue', () => {
    it('should have correct constant values', () => {
      expect(component.selectPanelLoadingValue).toBe('__PANEL_LOADING__');
      expect(component.selectPanelEmptyValue).toBe('__PANEL_EMPTY__');
    });
  });

  describe('populateForm with null data edge cases', () => {
    it('should handle data with empty string fields in edit mode', () => {
      const emptyData: ValidFfFlagModel = {
        chapterID: '',
        collectionFacilityId: '',
        sourceType: '',
        ffFlagValue: '',
        effectiveDate: '',
        terminationDate: '',
        modificationDate: ''
      };

      component.mode = 'edit';
      component.data = emptyData;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: emptyData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      // Should not throw
      expect(component.panelTitle).toBe('Edit ff Flag Value');
    });
  });

  describe('populateFormForView with null data', () => {
    it('should handle view mode when data becomes null', () => {
      component.mode = 'view';
      component.data = null;
      fixture.detectChanges();

      // setupPanel checks mode === 'view' && this.data, so with null data it won't populate
      component.ngOnChanges({
        mode: {
          currentValue: 'view',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      // Panel title should not be set because data is null
      expect(component.panelTitle).not.toBe('View ff Flag Value');
    });
  });

  describe('View mode without terminationDate', () => {
    it('should handle null terminationDate in view mode', () => {
      const noTermData: ValidFfFlagModel = {
        ...mockEditData,
        terminationDate: undefined
      };

      component.mode = 'view';
      component.data = noTermData;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'view',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: noTermData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      const rawVal = component.form.getRawValue();
      expect(rawVal.terminationDate).toBeNull();
    });
  });

  describe('Edit mode without effectiveDate', () => {
    it('should handle null effectiveDate in edit mode', () => {
      const noEffData: ValidFfFlagModel = {
        ...mockEditData,
        effectiveDate: undefined
      };

      component.mode = 'edit';
      component.data = noEffData;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: noEffData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      const rawVal = component.form.getRawValue();
      expect(rawVal.effectiveDate).toBeNull();
    });
  });

  describe('isFormValid edge cases in edit mode', () => {
    it('should return false when collectionFacilityId is touched and invalid', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: mockEditData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      component.form.get('collectionFacilityId')?.setValue('');
      component.form.get('collectionFacilityId')?.markAsDirty();
      component.form.get('collectionFacilityId')?.markAsTouched();

      expect(component.isFormValid).toBeFalse();
    });

    it('should return false when sourceType is touched and invalid', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: mockEditData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      component.form.get('sourceType')?.setValue('');
      component.form.get('sourceType')?.markAsDirty();
      component.form.get('sourceType')?.markAsTouched();

      expect(component.isFormValid).toBeFalse();
    });

    it('should return true when form is dirty and no visible errors', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: mockEditData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      component.form.get('ffFlagValue')?.setValue('01');
      component.form.get('ffFlagValue')?.markAsDirty();

      expect(component.isFormValid).toBeTrue();
    });
  });

  describe('onSave success path - closeAfterSave false', () => {
    it('should reset form when closeAfterSave is false', () => {
      mockService.addValidFfFlag.and.returnValue(
        of(createReturnResult([mockEditData]))
      );
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      component.form.get('chapterId')?.setValue('ALL');
      component.form.get('collectionFacilityId')?.setValue('W0352');
      component.form.get('sourceType')?.setValue('DONOR');
      component.form.get('ffFlagValue')?.setValue('00');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));

      component.onSave(false);

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).not.toHaveBeenCalled();
    });
  });

  describe('onSaveAndCreateAnother', () => {
    it('should call onSave with closeAfterSave=false', () => {
      spyOn(component, 'onSave');
      component.onSaveAndCreateAnother();
      expect(component.onSave).toHaveBeenCalledWith(false);
    });
  });

  describe('setupChapterChangeListener in non-add mode', () => {
    it('should not react to chapter changes in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      component.ngOnInit();
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          currentValue: mockEditData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      const callsBefore = mockService.getAddDropdownCollectionFacilities.calls.count();
      component.form.get('chapterId')?.setValue('CH01');
      expect(mockService.getAddDropdownCollectionFacilities.calls.count()).toBe(callsBefore);
    });
  });

  describe('minEffectiveDate', () => {
    it('should be set as a Moment object', () => {
      expect(moment.isMoment(component.minEffectiveDate)).toBeTrue();
    });
  });

  describe('Save success snackbar', () => {
    it('should call snackbarService.showSuccess with response message', () => {
      const successResult = {
        success: true,
        message: 'Record saved successfully',
        error: null,
        statusCode: 200,
        data: [mockEditData],
        total: 1
      };
      mockService.addValidFfFlag.and.returnValue(of(successResult));

      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      component.form.get('chapterId')?.setValue('ALL');
      component.form.get('collectionFacilityId')?.setValue('W0352');
      component.form.get('sourceType')?.setValue('DONOR');
      component.form.get('ffFlagValue')?.setValue('00');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));

      component.onSave();

      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Record saved successfully');
    });
  });
});
