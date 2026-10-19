import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { TrayDefinitionFilterPanel } from './tray-definition-filter-panel';
import { TrayDefinitionService } from '../services/tray-definition.service';
import { HeaderService } from '@shared/services/header.service';
import { TrayDefinitionFilterValue, TrayStatusLovDto } from '../models/tray-definition.model';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('TrayDefinitionFilterPanel', () => {
  let component: TrayDefinitionFilterPanel;
  let fixture: ComponentFixture<TrayDefinitionFilterPanel>;
  let trayDefinitionServiceSpy: jasmine.SpyObj<TrayDefinitionService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const mockStatusOptions: TrayStatusLovDto[] = [
    { code: 'IN', description: 'In Stock' },
    { code: 'OU', description: 'Out of Stock' }
  ];

  beforeEach(async () => {
    trayDefinitionServiceSpy = jasmine.createSpyObj('TrayDefinitionService', [
      'getTrayStatusLov'
    ]);
    headerServiceSpy = createMockHeaderService();
    trayDefinitionServiceSpy.getTrayStatusLov.and.returnValue(of(mockStatusOptions));
    headerServiceSpy.getCurrentChapterId.and.returnValue('0001');
    headerServiceSpy.getCurrentChapterTimezone.and.returnValue('America/New_York');

    await TestBed.configureTestingModule({
      imports: [TrayDefinitionFilterPanel, NoopAnimationsModule],
      providers: [
        { provide: TrayDefinitionService, useValue: trayDefinitionServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TrayDefinitionFilterPanel);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {

    it('should load tray status options on init', () => {
      fixture.detectChanges();

      expect(trayDefinitionServiceSpy.getTrayStatusLov).toHaveBeenCalled();
      expect(component.trayStatusOptions).toEqual(mockStatusOptions);
    });

    it('should handle error when loading status options', () => {
      trayDefinitionServiceSpy.getTrayStatusLov.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      spyOn(console, 'error');
      fixture.detectChanges();

      expect(component.isLoadingOptions).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });

    it('should initialize form with currentFilters when provided', () => {
      const currentFilters: TrayDefinitionFilterValue = {
        trayStatus: 'IN',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-06-01'),
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2024-12-31')
      };
      component.currentFilters = currentFilters;
      fixture.detectChanges();

      expect(component.filterForm.get('trayStatus')?.value).toBe('IN');
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('After');
    });

    it('should initialize form with null values when no currentFilters', () => {
      component.currentFilters = null;
      fixture.detectChanges();

      expect(component.filterForm.get('trayStatus')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
    });
  });

  describe('validateEffDatePeriod', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set effDatePeriodRequired to true and mark period invalid when date set but no period', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2024-06-01'),
        effectiveDatePeriod: null
      });

      component.validateEffDatePeriod();

      expect(component.effDatePeriodRequired).toBe(true);
      expect(component.filterForm.get('effectiveDatePeriod')?.hasError('required')).toBe(true);
    });

    it('should set effDatePeriodRequired to false and clear period errors when period is provided', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2024-06-01'),
        effectiveDatePeriod: 'After'
      });

      component.validateEffDatePeriod();

      expect(component.effDatePeriodRequired).toBe(false);
      expect(component.filterForm.get('effectiveDatePeriod')?.errors).toBeNull();
    });

    it('should set effDatePeriodRequired to false when date is null', () => {
      component.filterForm.patchValue({
        effectiveDate: null,
        effectiveDatePeriod: null
      });

      component.validateEffDatePeriod();

      expect(component.effDatePeriodRequired).toBe(false);
    });
  });

  describe('validateTermDatePeriod', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set termDatePeriodRequired to true and mark period invalid when date set but no period', () => {
      component.filterForm.patchValue({
        terminationDate: new Date('2024-12-31'),
        terminationDatePeriod: null
      });

      component.validateTermDatePeriod();

      expect(component.termDatePeriodRequired).toBe(true);
      expect(component.filterForm.get('terminationDatePeriod')?.hasError('required')).toBe(true);
    });

    it('should set termDatePeriodRequired to false and clear period errors when period is provided', () => {
      component.filterForm.patchValue({
        terminationDate: new Date('2024-12-31'),
        terminationDatePeriod: 'Before'
      });

      component.validateTermDatePeriod();

      expect(component.termDatePeriodRequired).toBe(false);
      expect(component.filterForm.get('terminationDatePeriod')?.errors).toBeNull();
    });

    it('should set termDatePeriodRequired to false when termination date is null', () => {
      component.filterForm.patchValue({
        terminationDate: null,
        terminationDatePeriod: null
      });

      component.validateTermDatePeriod();

      expect(component.termDatePeriodRequired).toBe(false);
    });
  });

  describe('isApplyDisabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should be true when no filter is selected', () => {
      component.filterForm.reset();
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be false when trayStatus is selected', () => {
      component.filterForm.patchValue({ trayStatus: 'IN' });
      component.effDatePeriodRequired = false;
      component.termDatePeriodRequired = false;
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should be true when effDatePeriodRequired is true', () => {
      component.filterForm.patchValue({
        trayStatus: 'IN',
        effectiveDate: new Date('2024-06-01')
      });
      component.effDatePeriodRequired = true;
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be true when termDatePeriodRequired is true', () => {
      component.filterForm.patchValue({
        trayStatus: 'IN',
        terminationDate: new Date('2024-12-31')
      });
      component.termDatePeriodRequired = true;
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be false when effectiveDate with period is selected', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2024-06-01'),
        effectiveDatePeriod: 'After'
      });
      component.effDatePeriodRequired = false;
      component.termDatePeriodRequired = false;
      expect(component.isApplyDisabled).toBe(false);
    });
  });

  describe('getEffDateError and getTermDateError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string when effectiveDate control is not touched or dirty', () => {
      expect(component.getEffDateError()).toBe('');
    });

    it('should return error message when effectiveDate has invalidDate error and is touched', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();

      expect(component.getEffDateError()).toBe('Effective Date is invalid');
    });

    it('should return error message when effectiveDate has invalidDateFormat error and is dirty', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setErrors({ invalidDateFormat: true });
      control?.markAsDirty();

      expect(component.getEffDateError()).toBe('Effective Date is invalid');
    });

    it('should return empty string when terminationDate control is not touched', () => {
      expect(component.getTermDateError()).toBe('');
    });

    it('should return error message when terminationDate has invalidDate error and is touched', () => {
      const control = component.filterForm.get('terminationDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();

      expect(component.getTermDateError()).toBe('Termination Date is invalid');
    });

    it('should return error message when terminationDate has matDatepickerParse error and is dirty', () => {
      const control = component.filterForm.get('terminationDate');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsDirty();

      expect(component.getTermDateError()).toBe('Termination Date is invalid');
    });
  });

  describe('onEffDateInput and onTermDateInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear effectiveDate control when input is empty', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      control?.markAsDirty();

      const event = { target: { value: '' } } as unknown as Event;
      component.onEffDateInput(event);

      expect(control?.value).toBeNull();
      expect(control?.errors).toBeNull();
    });

    it('should mark effectiveDate touched and dirty when input has value but control has no value', () => {
      const control = component.filterForm.get('effectiveDate');

      const event = { target: { value: '01-JAN-2024' } } as unknown as Event;
      component.onEffDateInput(event);

      expect(control?.touched).toBe(true);
      expect(control?.dirty).toBe(true);
    });

    it('should not set invalidDate error when effectiveDate control already has a moment value', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setValue(new Date('2024-01-01'));

      const event = { target: { value: '01-JAN-2024' } } as unknown as Event;
      component.onEffDateInput(event);

      expect(control?.hasError('invalidDate')).toBeFalsy();
    });

    it('should clear terminationDate control when input is empty', () => {
      const control = component.filterForm.get('terminationDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();

      const event = { target: { value: '' } } as unknown as Event;
      component.onTermDateInput(event);

      expect(control?.value).toBeNull();
      expect(control?.errors).toBeNull();
    });

    it('should mark terminationDate touched and dirty when input has value but no control value', () => {
      const control = component.filterForm.get('terminationDate');

      const event = { target: { value: '31-DEC-2024' } } as unknown as Event;
      component.onTermDateInput(event);

      expect(control?.touched).toBe(true);
      expect(control?.dirty).toBe(true);
    });
  });

  describe('Apply Filters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit filters with correct values when onApply called', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        trayStatus: 'IN',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-06-01'),
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2024-12-31')
      });

      component.onApply();

      const emitted = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emitted.trayStatus).toBe('IN');
      expect(emitted.effectiveDatePeriod).toBe('After');
      expect(emitted.terminationDatePeriod).toBe('Before');
    });

    it('should emit null for empty date period when date is not set', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        trayStatus: 'IN',
        effectiveDatePeriod: 'After',
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: null
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.effectiveDatePeriod).toBeNull();
      expect(emittedValue.terminationDatePeriod).toBeNull();
    });
  });

  describe('Clear All', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form to initial values', () => {
      component.filterForm.patchValue({
        trayStatus: 'IN',
        effectiveDatePeriod: 'Before',
        effectiveDate: new Date('2024-06-01'),
        terminationDatePeriod: 'After',
        terminationDate: new Date('2024-12-31')
      });

      component.onClearAll();

      expect(component.filterForm.get('trayStatus')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });

    it('should reset period required flags when cleared', () => {
      component.effDatePeriodRequired = true;
      component.termDatePeriodRequired = true;

      component.onClearAll();

      expect(component.effDatePeriodRequired).toBe(false);
      expect(component.termDatePeriodRequired).toBe(false);
    });
  });

  describe('onClose', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit close event when onClose is called', () => {
      spyOn(component.close, 'emit');
      component.onClose();
      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('hasActiveFilters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false when no filter is set', () => {
      component.filterForm.reset();
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should return true when tray status is set', () => {
      component.filterForm.patchValue({
        trayStatus: 'IN',
        effectiveDate: null,
        terminationDate: null
      });

      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should return true when effective date is set', () => {
      component.filterForm.patchValue({
        trayStatus: null,
        effectiveDate: new Date('2024-06-01'),
        terminationDate: null
      });

      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should return true when termination date is set', () => {
      component.filterForm.patchValue({
        trayStatus: null,
        effectiveDate: null,
        terminationDate: new Date('2024-12-31')
      });

      expect(component.hasActiveFilters()).toBe(true);
    });
  });

  describe('Date period validation via reactive form changes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark effDatePeriodRequired when effectiveDate changes and period is missing', fakeAsync(() => {
      component.filterForm.get('effectiveDate')?.setValue(new Date('2024-06-01'));
      tick();

      expect(component.effDatePeriodRequired).toBe(true);
    }));

    it('should clear effDatePeriodRequired when effectiveDatePeriod is set', fakeAsync(() => {
      component.filterForm.get('effectiveDate')?.setValue(new Date('2024-06-01'));
      tick();

      component.filterForm.get('effectiveDatePeriod')?.setValue('After');
      tick();

      expect(component.effDatePeriodRequired).toBe(false);
    }));

    it('should mark termDatePeriodRequired when terminationDate changes and period is missing', fakeAsync(() => {
      component.filterForm.get('terminationDate')?.setValue(new Date('2024-12-31'));
      tick();

      expect(component.termDatePeriodRequired).toBe(true);
    }));

    it('should clear termDatePeriodRequired when terminationDatePeriod is set', fakeAsync(() => {
      component.filterForm.get('terminationDate')?.setValue(new Date('2024-12-31'));
      tick();

      component.filterForm.get('terminationDatePeriod')?.setValue('Before');
      tick();

      expect(component.termDatePeriodRequired).toBe(false);
    }));
  });
});
