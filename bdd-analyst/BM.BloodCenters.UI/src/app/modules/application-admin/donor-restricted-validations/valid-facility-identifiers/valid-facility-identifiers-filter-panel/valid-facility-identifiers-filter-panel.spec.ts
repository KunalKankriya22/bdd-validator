import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DateAdapter } from '@angular/material/core';
import { of, throwError } from 'rxjs';

import { ValidFacilityIdentifiersFilterPanel } from './valid-facility-identifiers-filter-panel';
import { ValidFacilityIdentifiersService, ChapterLookup } from '../services/valid-facility-identifiers.service';

describe('ValidFacilityIdentifiersFilterPanel', () => {
  let component: ValidFacilityIdentifiersFilterPanel;
  let fixture: ComponentFixture<ValidFacilityIdentifiersFilterPanel>;
  let mockService: jasmine.SpyObj<ValidFacilityIdentifiersService>;
  let mockDateAdapter: jasmine.SpyObj<DateAdapter<any>>;

  const mockChapters: ChapterLookup[] = [
    { chapterId: 'AB12', chapterName: 'Alpha Chapter' },
    { chapterId: 'CD34', chapterName: 'Beta Chapter' },
    { chapterId: 'EF56', chapterName: 'Gamma Chapter' }
  ];

  beforeEach(() => {
    mockService = jasmine.createSpyObj('ValidFacilityIdentifiersService', ['getChapters']);
    mockDateAdapter = jasmine.createSpyObj('DateAdapter', ['parse', 'format']);

    mockService.getChapters.and.returnValue(of(mockChapters));

    mockDateAdapter.parse.and.callFake((value: any) => {
      if (value && typeof value === 'string') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
      }
      return null;
    });
    mockDateAdapter.format.and.callFake((date: any) => {
      if (!date) return '';
      const d = date instanceof Date ? date : new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = monthNames[d.getMonth()];
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    });

    TestBed.configureTestingModule({
      imports: [
        ValidFacilityIdentifiersFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: ValidFacilityIdentifiersService, useValue: mockService },
        { provide: DateAdapter, useValue: mockDateAdapter }
      ]
    });

    fixture = TestBed.createComponent(ValidFacilityIdentifiersFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load chapters on init', () => {
    expect(mockService.getChapters).toHaveBeenCalled();
    expect(component.chapters).toEqual(mockChapters);
    expect(component.filteredChapters).toEqual(mockChapters);
    expect(component.isLoadingChapters).toBe(false);
  });

  it('should initialize form with null values when no current filters', () => {
    component.currentFilters = null;
    component.ngOnInit();

    expect(component.filterForm.value.chapterId).toBeNull();
    expect(component.filterForm.value.effectivePeriod).toBeNull();
    expect(component.filterForm.value.effectiveDate).toBeNull();
    expect(component.filterForm.value.terminationPeriod).toBeNull();
    expect(component.filterForm.value.terminationDate).toBeNull();
  });

  it('should preserve all filter values on init when currentFilters provided', () => {
    const effectiveDate = new Date('2024-01-01');
    const terminationDate = new Date('2024-12-31');

    component.currentFilters = {
      chapterId: 'AB12',
      effectivePeriod: 'Before',
      effectiveDate: effectiveDate,
      terminationPeriod: 'After',
      terminationDate: terminationDate
    };

    component.ngOnInit();

    expect(component.filterForm.value.chapterId).toBe('AB12');
    expect(component.filterForm.value.effectivePeriod).toBe('Before');
    expect(component.filterForm.value.effectiveDate).toBe(effectiveDate);
    expect(component.filterForm.value.terminationPeriod).toBe('After');
    expect(component.filterForm.value.terminationDate).toBe(terminationDate);
  });

  describe('loadChapterIds (service interaction)', () => {
    it('should set isLoadingChapters to false and clear arrays on error', () => {
      mockService.getChapters.and.returnValue(throwError(() => new Error('Network error')));

      component.ngOnInit();

      expect(component.isLoadingChapters).toBe(false);
      expect(component.chapters).toEqual([]);
      expect(component.filteredChapters).toEqual([]);
    });
  });

  describe('Chapter Search Filtering', () => {
    it('should filter chapters based on chapterId search term', () => {
      expect(component.filteredChapters).toEqual(mockChapters);

      component.chapterSearchControl.setValue('AB');
      fixture.detectChanges();

      expect(component.filteredChapters.length).toBe(1);
      expect(component.filteredChapters[0].chapterId).toBe('AB12');
    });

    it('should filter chapters based on chapterName search term', () => {
      component.chapterSearchControl.setValue('Beta');
      fixture.detectChanges();

      expect(component.filteredChapters.length).toBe(1);
      expect(component.filteredChapters[0].chapterId).toBe('CD34');
    });

    it('should be case-insensitive when filtering by chapterId', () => {
      component.chapterSearchControl.setValue('cd');
      fixture.detectChanges();

      expect(component.filteredChapters.length).toBe(1);
      expect(component.filteredChapters[0].chapterId).toBe('CD34');
    });

    it('should be case-insensitive when filtering by chapterName', () => {
      component.chapterSearchControl.setValue('gamma');
      fixture.detectChanges();

      expect(component.filteredChapters.length).toBe(1);
      expect(component.filteredChapters[0].chapterId).toBe('EF56');
    });

    it('should show all chapters when search is empty string', () => {
      component.chapterSearchControl.setValue('AB');
      fixture.detectChanges();
      expect(component.filteredChapters.length).toBe(1);

      component.chapterSearchControl.setValue('');
      fixture.detectChanges();

      expect(component.filteredChapters).toEqual(mockChapters);
    });

    it('should return empty array when no chapters match search', () => {
      component.chapterSearchControl.setValue('XYZ');
      fixture.detectChanges();

      expect(component.filteredChapters).toEqual([]);
    });

    it('should handle null search value', () => {
      component.chapterSearchControl.setValue(null);
      fixture.detectChanges();

      expect(component.filteredChapters).toEqual(mockChapters);
    });
  });

  describe('Period Validation', () => {
    it('should show error when effective date is set but period is not', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2024-01-01'),
        effectivePeriod: ''
      });
      fixture.detectChanges();

      expect(component.effectiveDatePeriodError).toBe('Period is required');
    });

    it('should show error when effective date is set but period is null', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2024-01-01'),
        effectivePeriod: null
      });
      fixture.detectChanges();

      expect(component.effectiveDatePeriodError).toBe('Period is required');
    });

    it('should not show error when both effective date and period are set', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2024-01-01'),
        effectivePeriod: 'After'
      });
      fixture.detectChanges();

      expect(component.effectiveDatePeriodError).toBe('');
    });

    it('should not show error when neither effective date nor period are set', () => {
      component.filterForm.patchValue({
        effectiveDate: null,
        effectivePeriod: null
      });
      fixture.detectChanges();

      expect(component.effectiveDatePeriodError).toBe('');
    });

    it('should show error when termination date is set but period is not', () => {
      component.filterForm.patchValue({
        terminationDate: new Date('2024-12-31'),
        terminationPeriod: ''
      });
      fixture.detectChanges();

      expect(component.terminationDatePeriodError).toBe('Period is required');
    });

    it('should show error when termination date is set but period is null', () => {
      component.filterForm.patchValue({
        terminationDate: new Date('2024-12-31'),
        terminationPeriod: null
      });
      fixture.detectChanges();

      expect(component.terminationDatePeriodError).toBe('Period is required');
    });

    it('should not show error when both termination date and period are set', () => {
      component.filterForm.patchValue({
        terminationDate: new Date('2024-12-31'),
        terminationPeriod: 'Before'
      });
      fixture.detectChanges();

      expect(component.terminationDatePeriodError).toBe('');
    });

    it('should not show error when neither termination date nor period are set', () => {
      component.filterForm.patchValue({
        terminationDate: null,
        terminationPeriod: null
      });
      fixture.detectChanges();

      expect(component.terminationDatePeriodError).toBe('');
    });

    it('should clear effective period error when period is later set', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2024-01-01'),
        effectivePeriod: ''
      });
      fixture.detectChanges();
      expect(component.effectiveDatePeriodError).toBe('Period is required');

      component.filterForm.patchValue({ effectivePeriod: 'After' });
      fixture.detectChanges();

      expect(component.effectiveDatePeriodError).toBe('');
    });

    it('should clear termination period error when period is later set', () => {
      component.filterForm.patchValue({
        terminationDate: new Date('2024-12-31'),
        terminationPeriod: ''
      });
      fixture.detectChanges();
      expect(component.terminationDatePeriodError).toBe('Period is required');

      component.filterForm.patchValue({ terminationPeriod: 'Before' });
      fixture.detectChanges();

      expect(component.terminationDatePeriodError).toBe('');
    });

    it('should mark effectiveDate control as touched when value changes and not already touched', () => {
      const control = component.filterForm.get('effectiveDate');
      expect(control!.touched).toBe(false);

      control!.setValue(new Date('2024-06-15'));
      fixture.detectChanges();

      expect(control!.touched).toBe(true);
    });

    it('should mark terminationDate control as touched when value changes and not already touched', () => {
      const control = component.filterForm.get('terminationDate');
      expect(control!.touched).toBe(false);

      control!.setValue(new Date('2024-06-15'));
      fixture.detectChanges();

      expect(control!.touched).toBe(true);
    });

    it('should not re-mark effectiveDate as touched if already touched', () => {
      const control = component.filterForm.get('effectiveDate');
      control!.markAsTouched();
      const markAsTouchedSpy = spyOn(control!, 'markAsTouched');

      control!.setValue(new Date('2024-06-15'));
      fixture.detectChanges();

      expect(markAsTouchedSpy).not.toHaveBeenCalled();
    });

    it('should not re-mark terminationDate as touched if already touched', () => {
      const control = component.filterForm.get('terminationDate');
      control!.markAsTouched();
      const markAsTouchedSpy = spyOn(control!, 'markAsTouched');

      control!.setValue(new Date('2024-06-15'));
      fixture.detectChanges();

      expect(markAsTouchedSpy).not.toHaveBeenCalled();
    });
  });

  describe('onApply', () => {
    it('should emit filters when validation passes', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        chapterId: 'AB12',
        effectivePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationPeriod: 'Before',
        terminationDate: new Date('2024-12-31')
      });
      fixture.detectChanges();

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({
        chapterId: 'AB12',
        effectivePeriod: 'After',
        effectiveDate: jasmine.any(Date),
        terminationPeriod: 'Before',
        terminationDate: jasmine.any(Date)
      });
    });

    it('should not emit when effectiveDatePeriodError exists', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        effectiveDate: new Date('2024-01-01'),
        effectivePeriod: ''
      });
      fixture.detectChanges();

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    });

    it('should not emit when terminationDatePeriodError exists', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        terminationDate: new Date('2024-12-31'),
        terminationPeriod: ''
      });
      fixture.detectChanges();

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    });

    it('should emit null for empty form values', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        chapterId: 'AB12',
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      });
      fixture.detectChanges();

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({
        chapterId: 'AB12',
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      });
    });

    it('should convert falsy chapterId to null', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        chapterId: '',
        effectivePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationPeriod: null,
        terminationDate: null
      });
      fixture.detectChanges();

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({ chapterId: null })
      );
    });
  });

  describe('onClear', () => {
    it('should reset all form fields to null', () => {
      component.filterForm.patchValue({
        chapterId: 'AB12',
        effectivePeriod: 'Before',
        effectiveDate: new Date('2024-01-01'),
        terminationPeriod: 'After',
        terminationDate: new Date('2024-12-31')
      });

      component.onClear();

      expect(component.filterForm.value.chapterId).toBeNull();
      expect(component.filterForm.value.effectivePeriod).toBeNull();
      expect(component.filterForm.value.effectiveDate).toBeNull();
      expect(component.filterForm.value.terminationPeriod).toBeNull();
      expect(component.filterForm.value.terminationDate).toBeNull();
    });

    it('should clear all error messages', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2024-01-01'),
        effectivePeriod: ''
      });
      fixture.detectChanges();
      expect(component.effectiveDatePeriodError).toBe('Period is required');

      component.onClear();

      expect(component.effectiveDatePeriodError).toBe('');
      expect(component.terminationDatePeriodError).toBe('');
    });

    it('should clear raw input values', () => {
      (component as any).effectiveDateRawInput = 'some invalid text';
      (component as any).terminationDateRawInput = 'other invalid text';

      component.onClear();

      expect((component as any).effectiveDateRawInput).toBe('');
      expect((component as any).terminationDateRawInput).toBe('');
    });

    it('should clear control errors on effectivePeriod and terminationPeriod', () => {
      const effectivePeriodCtrl = component.filterForm.get('effectivePeriod');
      const terminationPeriodCtrl = component.filterForm.get('terminationPeriod');
      effectivePeriodCtrl!.setErrors({ required: true });
      terminationPeriodCtrl!.setErrors({ required: true });

      component.onClear();

      expect(effectivePeriodCtrl!.errors).toBeNull();
      expect(terminationPeriodCtrl!.errors).toBeNull();
    });
  });

  describe('onClose', () => {
    it('should emit close event', () => {
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('isApplyDisabled', () => {
    it('should return true when effectiveDatePeriodError is set', () => {
      component.effectiveDatePeriodError = 'Period is required';
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when terminationDatePeriodError is set', () => {
      component.terminationDatePeriodError = 'Period is required';
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when effectiveDate has invalidDate error', () => {
      component.filterForm.get('effectiveDate')!.setErrors({ invalidDate: true });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when effectiveDate has invalidDateFormat error', () => {
      component.filterForm.get('effectiveDate')!.setErrors({ invalidDateFormat: true });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when effectiveDate has matDatepickerParse error', () => {
      component.filterForm.get('effectiveDate')!.setErrors({ matDatepickerParse: { text: 'bad' } });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when terminationDate has invalidDate error', () => {
      component.filterForm.get('terminationDate')!.setErrors({ invalidDate: true });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when terminationDate has invalidDateFormat error', () => {
      component.filterForm.get('terminationDate')!.setErrors({ invalidDateFormat: true });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when terminationDate has matDatepickerParse error', () => {
      component.filterForm.get('terminationDate')!.setErrors({ matDatepickerParse: { text: 'bad' } });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when no fields have any value', () => {
      component.filterForm.patchValue({
        chapterId: null,
        effectiveDate: null,
        terminationDate: null,
        effectivePeriod: null,
        terminationPeriod: null
      });
      component.effectiveDatePeriodError = '';
      component.terminationDatePeriodError = '';

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return false when chapterId has a value', () => {
      component.filterForm.patchValue({
        chapterId: 'AB12',
        effectiveDate: null,
        terminationDate: null
      });
      component.effectiveDatePeriodError = '';
      component.terminationDatePeriodError = '';

      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return false when effectiveDate has a value', () => {
      component.filterForm.patchValue({
        chapterId: null,
        effectiveDate: new Date('2024-01-01'),
        effectivePeriod: 'After',
        terminationDate: null
      });
      component.effectiveDatePeriodError = '';
      component.terminationDatePeriodError = '';

      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return false when terminationDate has a value', () => {
      component.filterForm.patchValue({
        chapterId: null,
        effectiveDate: null,
        terminationDate: new Date('2024-12-31'),
        terminationPeriod: 'Before'
      });
      component.effectiveDatePeriodError = '';
      component.terminationDatePeriodError = '';

      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return true when chapterId is empty string (falsy)', () => {
      component.filterForm.patchValue({
        chapterId: '',
        effectiveDate: null,
        terminationDate: null
      });
      component.effectiveDatePeriodError = '';
      component.terminationDatePeriodError = '';

      expect(component.isApplyDisabled).toBe(true);
    });
  });

  describe('Raw Input Handling', () => {
    it('should store raw effective date input', () => {
      const event = { target: { value: 'invalid date text' } } as any;

      component.onEffectiveDateInput(event);

      expect((component as any).effectiveDateRawInput).toBe('invalid date text');
    });

    it('should store raw termination date input', () => {
      const event = { target: { value: 'invalid date text' } } as any;

      component.onTerminationDateInput(event);

      expect((component as any).terminationDateRawInput).toBe('invalid date text');
    });

    it('should restore invalid effective date text on blur when control has no value and input is empty', fakeAsync(() => {
      const mockInput = { value: '' } as HTMLInputElement;
      (component as any).effectiveDateRawInput = 'invalid text';
      component.filterForm.get('effectiveDate')!.setValue(null);

      component.onEffectiveDateBlur(mockInput);
      tick(1);

      expect(mockInput.value).toBe('invalid text');
    }));

    it('should restore invalid termination date text on blur when control has no value and input is empty', fakeAsync(() => {
      const mockInput = { value: '' } as HTMLInputElement;
      (component as any).terminationDateRawInput = 'invalid text';
      component.filterForm.get('terminationDate')!.setValue(null);

      component.onTerminationDateBlur(mockInput);
      tick(1);

      expect(mockInput.value).toBe('invalid text');
    }));

    it('should not restore effective date text when input already has value', fakeAsync(() => {
      const mockInput = { value: '01-JAN-2024' } as HTMLInputElement;
      (component as any).effectiveDateRawInput = 'invalid text';

      component.onEffectiveDateBlur(mockInput);
      tick(1);

      expect(mockInput.value).toBe('01-JAN-2024');
    }));

    it('should not restore termination date text when control has value', fakeAsync(() => {
      const mockInput = { value: '' } as HTMLInputElement;
      (component as any).terminationDateRawInput = 'invalid text';
      component.filterForm.get('terminationDate')!.setValue(new Date('2024-12-31'));

      component.onTerminationDateBlur(mockInput);
      tick(1);

      expect(mockInput.value).toBe('');
    }));

    it('should parse valid date on effective date blur and set control value', fakeAsync(() => {
      const validDate = new Date('2024-01-15');
      mockDateAdapter.parse.and.returnValue({ isValid: () => true } as any);
      mockDateAdapter.format.and.returnValue('15-JAN-2024');

      const mockInput = { value: '01/15/2024' } as HTMLInputElement;
      (component as any).effectiveDateRawInput = '';
      component.filterForm.get('effectiveDate')!.setValue(null);

      component.onEffectiveDateBlur(mockInput);
      tick(1);

      expect(mockInput.value).toBe('15-JAN-2024');
      expect(component.filterForm.get('effectiveDate')!.value).toBeTruthy();
    }));

    it('should set invalidDate error on effective date blur when parse fails', fakeAsync(() => {
      mockDateAdapter.parse.and.returnValue({ isValid: () => false } as any);

      const mockInput = { value: 'bad-date' } as HTMLInputElement;
      (component as any).effectiveDateRawInput = '';
      component.filterForm.get('effectiveDate')!.setValue(null);

      component.onEffectiveDateBlur(mockInput);
      tick(1);

      expect(component.filterForm.get('effectiveDate')!.hasError('invalidDate')).toBe(true);
      expect(component.filterForm.get('effectiveDate')!.touched).toBe(true);
    }));

    it('should set invalidDate error when parse returns null on effective date blur', fakeAsync(() => {
      mockDateAdapter.parse.and.returnValue(null);

      const mockInput = { value: 'xyzzy' } as HTMLInputElement;
      (component as any).effectiveDateRawInput = '';
      component.filterForm.get('effectiveDate')!.setValue(null);

      component.onEffectiveDateBlur(mockInput);
      tick(1);

      // parse returns null, so parsed?.isValid() is falsy, enters else-if (control exists)
      expect(component.filterForm.get('effectiveDate')!.hasError('invalidDate')).toBe(true);
    }));

    it('should clear invalidDate error on effective date blur when input is empty', fakeAsync(() => {
      const control = component.filterForm.get('effectiveDate')!;
      control.setErrors({ invalidDate: true });

      const mockInput = { value: '' } as HTMLInputElement;
      (component as any).effectiveDateRawInput = '';

      component.onEffectiveDateBlur(mockInput);
      tick(1);

      expect(control.hasError('invalidDate')).toBe(false);
    }));

    it('should clear invalidDate error on effective date blur when control has valid value', fakeAsync(() => {
      const control = component.filterForm.get('effectiveDate')!;
      control.setValue(new Date('2024-06-15'));
      control.setErrors({ invalidDate: true });

      const mockInput = { value: '15-JUN-2024' } as HTMLInputElement;
      (component as any).effectiveDateRawInput = '';

      component.onEffectiveDateBlur(mockInput);
      tick(1);

      expect(control.hasError('invalidDate')).toBe(false);
    }));

    it('should preserve other errors when clearing invalidDate on effective date blur', fakeAsync(() => {
      const control = component.filterForm.get('effectiveDate')!;
      control.setErrors({ invalidDate: true, otherError: true });

      const mockInput = { value: '' } as HTMLInputElement;
      (component as any).effectiveDateRawInput = '';

      component.onEffectiveDateBlur(mockInput);
      tick(1);

      expect(control.hasError('invalidDate')).toBe(false);
      expect(control.hasError('otherError')).toBe(true);
    }));

    it('should parse valid date on termination date blur and set control value', fakeAsync(() => {
      mockDateAdapter.parse.and.returnValue({ isValid: () => true } as any);
      mockDateAdapter.format.and.returnValue('31-DEC-2024');

      const mockInput = { value: '12/31/2024' } as HTMLInputElement;
      (component as any).terminationDateRawInput = '';
      component.filterForm.get('terminationDate')!.setValue(null);

      component.onTerminationDateBlur(mockInput);
      tick(1);

      expect(mockInput.value).toBe('31-DEC-2024');
      expect(component.filterForm.get('terminationDate')!.value).toBeTruthy();
    }));

    it('should set invalidDate error on termination date blur when parse fails', fakeAsync(() => {
      mockDateAdapter.parse.and.returnValue({ isValid: () => false } as any);

      const mockInput = { value: 'bad-date' } as HTMLInputElement;
      (component as any).terminationDateRawInput = '';
      component.filterForm.get('terminationDate')!.setValue(null);

      component.onTerminationDateBlur(mockInput);
      tick(1);

      expect(component.filterForm.get('terminationDate')!.hasError('invalidDate')).toBe(true);
      expect(component.filterForm.get('terminationDate')!.touched).toBe(true);
    }));

    it('should clear invalidDate error on termination date blur when input is empty', fakeAsync(() => {
      const control = component.filterForm.get('terminationDate')!;
      control.setErrors({ invalidDate: true });

      const mockInput = { value: '' } as HTMLInputElement;
      (component as any).terminationDateRawInput = '';

      component.onTerminationDateBlur(mockInput);
      tick(1);

      expect(control.hasError('invalidDate')).toBe(false);
    }));

    it('should preserve other errors when clearing invalidDate on termination date blur', fakeAsync(() => {
      const control = component.filterForm.get('terminationDate')!;
      control.setErrors({ invalidDate: true, anotherError: true });

      const mockInput = { value: '' } as HTMLInputElement;
      (component as any).terminationDateRawInput = '';

      component.onTerminationDateBlur(mockInput);
      tick(1);

      expect(control.hasError('invalidDate')).toBe(false);
      expect(control.hasError('anotherError')).toBe(true);
    }));

    it('should not restore effective date text when raw input is empty', fakeAsync(() => {
      const mockInput = { value: '' } as HTMLInputElement;
      (component as any).effectiveDateRawInput = '';
      component.filterForm.get('effectiveDate')!.setValue(null);

      component.onEffectiveDateBlur(mockInput);
      tick(1);

      expect(mockInput.value).toBe('');
    }));

    it('should not restore termination date text when raw input is empty', fakeAsync(() => {
      const mockInput = { value: '' } as HTMLInputElement;
      (component as any).terminationDateRawInput = '';
      component.filterForm.get('terminationDate')!.setValue(null);

      component.onTerminationDateBlur(mockInput);
      tick(1);

      expect(mockInput.value).toBe('');
    }));
  });

  describe('Initial Validation', () => {
    it('should run validation on init when current filters are provided with missing period', () => {
      component.currentFilters = {
        chapterId: 'AB12',
        effectivePeriod: '',
        effectiveDate: new Date('2024-01-01'),
        terminationPeriod: null,
        terminationDate: null
      };

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.effectiveDatePeriodError).toBe('Period is required');
    });

    it('should not set error on init when current filters have correct period', () => {
      component.currentFilters = {
        chapterId: 'AB12',
        effectivePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationPeriod: 'Before',
        terminationDate: new Date('2024-12-31')
      };

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.effectiveDatePeriodError).toBe('');
      expect(component.terminationDatePeriodError).toBe('');
    });

    it('should not run validation on init when no current filters', () => {
      component.currentFilters = null;
      component.effectiveDatePeriodError = '';
      component.terminationDatePeriodError = '';

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.effectiveDatePeriodError).toBe('');
      expect(component.terminationDatePeriodError).toBe('');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
