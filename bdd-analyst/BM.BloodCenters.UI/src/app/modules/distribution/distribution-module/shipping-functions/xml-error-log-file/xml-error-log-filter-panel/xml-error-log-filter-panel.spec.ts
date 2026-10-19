import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import moment from 'moment';

import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

import { XmlErrorLogFilterPanel } from './xml-error-log-filter-panel';
import {
  PlasmaFileTypeDto,
  XmlErrorLogFilterValue,
} from '../models/xml-error-log.model';

describe('XmlErrorLogFilterPanel', () => {
  let component: XmlErrorLogFilterPanel;
  let fixture: ComponentFixture<XmlErrorLogFilterPanel>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;
  const mockToday = moment();

  const mockPlasmaFileTypes: PlasmaFileTypeDto[] = [
    { code: 'PF1', description: 'Plasma File Type 1' },
    { code: 'PF2', description: 'Plasma File Type 2' },
    { code: 'PF3', description: 'Plasma File Type 3' },
  ];

  beforeEach(async () => {
    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate']);
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(mockToday.clone());

    await TestBed.configureTestingModule({
      imports: [XmlErrorLogFilterPanel, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(XmlErrorLogFilterPanel);
    component = fixture.componentInstance;
    component.plasmaFileTypes = mockPlasmaFileTypes;
    fixture.detectChanges();
  });

  describe('Form Initialization', () => {

    it('should initialize filtered plasma file types with all types', () => {
      expect(component.filteredPlasmaFileTypes()).toEqual(mockPlasmaFileTypes);
    });
  });

  describe('Form Population with Current Filters', () => {
    it('should populate form when currentFilters provided', () => {
      const comp = TestBed.createComponent(XmlErrorLogFilterPanel).componentInstance;
      comp.plasmaFileTypes = mockPlasmaFileTypes;
      comp.currentFilters = {
        plasmaFileType: 'PF1',
        logDate: '2024-06-15T00:00:00',
      };

      comp.ngOnInit();

      expect(comp.filterForm.get('plasmaFileType')?.value).toBe('PF1');
      expect(comp.filterForm.get('logDate')?.value).toBeTruthy();
    });

    it('should handle null currentFilters', () => {
      const comp = TestBed.createComponent(XmlErrorLogFilterPanel).componentInstance;
      comp.plasmaFileTypes = mockPlasmaFileTypes;
      comp.currentFilters = null;

      comp.ngOnInit();

      expect(comp.filterForm.get('plasmaFileType')?.value).toBeNull();
      expect(comp.filterForm.get('logDate')?.value).toBeNull();
    });
  });
  describe('onApply', () => {



    it('should format logDate as YYYY-MM-DDT00:00:00', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        plasmaFileType: null,
        logDate: moment('2024-06-15'),
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.logDate).toBe('2024-06-15T00:00:00');
    });
  });
  describe('Date Validation', () => {


    it('should return error message for matDatepickerParse', () => {
      const control = component.filterForm.get('logDate');
      control?.setErrors({ matDatepickerParse: { text: 'bad' } });
      control?.markAsTouched();

      expect(component.getLogDateError()).toBe('Date is invalid');
    });

  });
  describe('hasFormChanged', () => {
    it('should return true when no initial filters and form has values', () => {
      component.filterForm.patchValue({ plasmaFileType: 'PF1' });

      expect(component['hasFormChanged']()).toBe(true);
    });

    it('should return false when form matches initial filters', () => {
      const comp = TestBed.createComponent(XmlErrorLogFilterPanel).componentInstance;
      comp.plasmaFileTypes = mockPlasmaFileTypes;
      comp.currentFilters = { plasmaFileType: 'PF1', logDate: null };
      comp.ngOnInit();

      expect(comp['hasFormChanged']()).toBe(false);
    });

    it('should return true when form differs from initial filters', () => {
      const comp = TestBed.createComponent(XmlErrorLogFilterPanel).componentInstance;
      comp.plasmaFileTypes = mockPlasmaFileTypes;
      comp.currentFilters = { plasmaFileType: 'PF1', logDate: null };
      comp.ngOnInit();

      comp.filterForm.patchValue({ plasmaFileType: 'PF2' });

      expect(comp['hasFormChanged']()).toBe(true);
    });
  });

  describe('ngOnDestroy', () => {
    it('should clean up subscriptions', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('onClear', () => {
    it('should reset form to null values', () => {
      component.filterForm.patchValue({
        plasmaFileType: 'PF1',
        logDate: moment('2024-06-15'),
      });

      component.onClear();

      expect(component.filterForm.get('plasmaFileType')?.value).toBeNull();
      expect(component.filterForm.get('logDate')?.value).toBeNull();
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
    it('should be disabled when form is invalid', () => {
      component.filterForm.get('logDate')?.setErrors({ invalidDate: true });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be disabled when no values are set', () => {
      component.filterForm.patchValue({ plasmaFileType: null, logDate: null });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be disabled when form has not changed from initial filters', () => {
      const comp = TestBed.createComponent(XmlErrorLogFilterPanel).componentInstance;
      comp.plasmaFileTypes = mockPlasmaFileTypes;
      comp.currentFilters = { plasmaFileType: 'PF1', logDate: null };
      comp.ngOnInit();

      // Form matches initial - no change
      expect(comp.isApplyDisabled).toBeTrue();
    });

    it('should be enabled when form has values and has changed', () => {
      component.filterForm.patchValue({ plasmaFileType: 'PF1' });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be disabled when logDate has matDatepickerParse error', () => {
      component.filterForm.get('logDate')?.setErrors({ matDatepickerParse: { text: 'bad' } });
      component.filterForm.patchValue({ plasmaFileType: 'PF1' });

      expect(component.isApplyDisabled).toBeTrue();
    });
  });

  describe('onLogDateInput', () => {
    it('should mark logDate control dirty and touched', fakeAsync(() => {
      const event = { target: { value: '15-Jun-2024' } } as unknown as Event;

      component.onLogDateInput(event);
      tick(10);

      const control = component.filterForm.get('logDate');
      expect(control?.dirty).toBeTrue();
      expect(control?.touched).toBeTrue();
    }));

    it('should set invalidDate error when input has value but control has no parsed value', fakeAsync(() => {
      component.filterForm.get('logDate')?.setValue(null);
      const event = { target: { value: 'invalid-date' } } as unknown as Event;

      component.onLogDateInput(event);
      tick(10);

      expect(component.filterForm.get('logDate')?.hasError('invalidDate')).toBeTrue();
    }));

    it('should handle empty input value without setting error', fakeAsync(() => {
      const event = { target: { value: '  ' } } as unknown as Event;

      component.onLogDateInput(event);
      tick(10);

      const control = component.filterForm.get('logDate');
      // trimmed value is empty, so no invalidDate error set
      expect(control?.hasError('invalidDate')).toBeFalsy();
    }));
  });

  describe('onLogDateBlur', () => {
    it('should restore raw input when control has no value and input has text', fakeAsync(() => {
      const input = { value: 'bad-date' } as HTMLInputElement;
      component['logDateRawInput'] = 'bad-date';
      component.filterForm.get('logDate')?.setValue(null);

      component.onLogDateBlur(input);
      tick(10);

      // When inputValue is truthy and controlValue is null, it sets input.value to logDateRawInput
      expect(input.value).toBe('bad-date');
      expect(component.filterForm.get('logDate')?.hasError('invalidDate')).toBeTrue();
    }));

    it('should clear errors when input is empty and no control value', fakeAsync(() => {
      const input = { value: '' } as HTMLInputElement;
      component['logDateRawInput'] = '';
      component.filterForm.get('logDate')?.setValue(null);

      component.onLogDateBlur(input);
      tick(10);

      expect(component.filterForm.get('logDate')?.errors).toBeNull();
    }));

    it('should mark control as touched on blur', fakeAsync(() => {
      const input = { value: '' } as HTMLInputElement;

      component.onLogDateBlur(input);
      tick(10);

      expect(component.filterForm.get('logDate')?.touched).toBeTrue();
    }));
  });

  describe('getLogDateError', () => {
    it('should return empty string when control is not touched or dirty', () => {
      const control = component.filterForm.get('logDate');
      // Control is pristine and untouched by default, with no errors
      control?.setErrors(null);

      expect(component.getLogDateError()).toBe('');
    });

    it('should return error message for invalidDate', () => {
      const control = component.filterForm.get('logDate');
      control?.setErrors({ invalidDate: true });

      expect(component.getLogDateError()).toBe('Date is invalid');
    });

    it('should return error message for matDatepickerParse', () => {
      const control = component.filterForm.get('logDate');
      control?.setErrors({ matDatepickerParse: { text: 'bad' } });
      control?.markAsTouched();

      expect(component.getLogDateError()).toBe('Date is invalid');
    });
  });

  describe('Search filter for plasma file types', () => {
    it('should filter plasma file types by code', () => {
      component['plasmaFileTypeSearchCtrl'].setValue('PF1');

      expect(component.filteredPlasmaFileTypes().length).toBe(1);
      expect(component.filteredPlasmaFileTypes()[0].code).toBe('PF1');
    });

    it('should filter plasma file types by description', () => {
      component['plasmaFileTypeSearchCtrl'].setValue('Type 2');

      expect(component.filteredPlasmaFileTypes().length).toBe(1);
      expect(component.filteredPlasmaFileTypes()[0].code).toBe('PF2');
    });

    it('should show all types when search is cleared', () => {
      component['plasmaFileTypeSearchCtrl'].setValue('PF1');
      expect(component.filteredPlasmaFileTypes().length).toBe(1);

      component['plasmaFileTypeSearchCtrl'].setValue('');
      expect(component.filteredPlasmaFileTypes().length).toBe(3);
    });

    it('should return empty when no match found', () => {
      component['plasmaFileTypeSearchCtrl'].setValue('ZZZZ');

      expect(component.filteredPlasmaFileTypes().length).toBe(0);
    });
  });

  describe('populateFormWithCurrentFilters (moment handling)', () => {
    it('should handle moment date in currentFilters', () => {
      const comp = TestBed.createComponent(XmlErrorLogFilterPanel).componentInstance;
      comp.plasmaFileTypes = mockPlasmaFileTypes;
      comp.currentFilters = {
        plasmaFileType: 'PF1',
        logDate: '2024-06-15T00:00:00',
      };
      comp.ngOnInit();

      const logDate = comp.filterForm.get('logDate')?.value;
      expect(logDate).toBeTruthy();
      expect(moment.isMoment(logDate)).toBeTrue();
    });

    it('should handle null logDate in currentFilters', () => {
      const comp = TestBed.createComponent(XmlErrorLogFilterPanel).componentInstance;
      comp.plasmaFileTypes = mockPlasmaFileTypes;
      comp.currentFilters = { plasmaFileType: 'PF2', logDate: null };
      comp.ngOnInit();

      expect(comp.filterForm.get('logDate')?.value).toBeNull();
    });
  });

  describe('hasFormChanged (additional edge cases)', () => {
    it('should return false when filterForm is undefined', () => {
      const comp = TestBed.createComponent(XmlErrorLogFilterPanel).componentInstance;
      comp.plasmaFileTypes = mockPlasmaFileTypes;
      // Don't call ngOnInit so filterForm is not set
      expect(comp['hasFormChanged']()).toBe(false);
    });

    it('should detect change when logDate is added', () => {
      const comp = TestBed.createComponent(XmlErrorLogFilterPanel).componentInstance;
      comp.plasmaFileTypes = mockPlasmaFileTypes;
      comp.currentFilters = { plasmaFileType: 'PF1', logDate: null };
      comp.ngOnInit();

      comp.filterForm.patchValue({ logDate: moment('2024-06-15') });

      expect(comp['hasFormChanged']()).toBe(true);
    });
  });

  describe('Future Date Validation', () => {
    it('should set maxDate from ChapterTimezoneService on init', () => {
      expect(component.maxDate).toBeTruthy();
      expect(moment.isMoment(component.maxDate)).toBeTrue();
    });

    it('should return "Date cannot be in future" for matDatepickerMax error', () => {
      const control = component.filterForm.get('logDate');
      control?.setErrors({ matDatepickerMax: true });
      expect(component.getLogDateError()).toBe('Date cannot be in future');
    });

    it('should disable APPLY when logDate has matDatepickerMax error', () => {
      component.filterForm.get('logDate')?.setErrors({ matDatepickerMax: true });
      component.filterForm.patchValue({ plasmaFileType: 'PF1' });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should set matDatepickerMax error on blur for a future date', fakeAsync(() => {
      const futureDate = moment().add(1, 'day');
      component.filterForm.get('logDate')?.setValue(futureDate);
      const input = { value: futureDate.format('DD-MMM-YYYY') } as HTMLInputElement;

      component.onLogDateBlur(input);
      tick(10);

      expect(component.filterForm.get('logDate')?.hasError('matDatepickerMax')).toBeTrue();
    }));

    it('should clear matDatepickerMax error on blur for a past date', fakeAsync(() => {
      const pastDate = moment().subtract(1, 'day');
      component.filterForm.get('logDate')?.setValue(pastDate);
      const input = { value: pastDate.format('DD-MMM-YYYY') } as HTMLInputElement;

      component.onLogDateBlur(input);
      tick(10);

      expect(component.filterForm.get('logDate')?.hasError('matDatepickerMax')).toBeFalsy();
      expect(component.filterForm.get('logDate')?.errors).toBeNull();
    }));
  });
});
