import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BarCodeFilterPanel } from './bar-code-filter-panel';
import { BarCodeTranslationsService } from '../services/bar-code-translations.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';
import { BarCodeTranslationFilterValue } from '../models/bar-code-translations.model';

describe('BarCodeFilterPanel', () => {
  let component: BarCodeFilterPanel;
  let fixture: ComponentFixture<BarCodeFilterPanel>;
  let mockService: jasmine.SpyObj<BarCodeTranslationsService>;

  beforeEach(() => {
    mockService = jasmine.createSpyObj('BarCodeTranslationsService', [
      'getUsedMachineCodes',
      'getEyeReadTranslations'
    ]);
    mockService.getUsedMachineCodes.and.returnValue(of(['00', '01', '02']));
    mockService.getEyeReadTranslations.and.returnValue(of([' C', ' E', ' F']));

    TestBed.configureTestingModule({
      imports: [BarCodeFilterPanel],
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BarCodeTranslationsService, useValue: mockService }
      ]
    });

    mockService.getUsedMachineCodes.calls.reset();
    mockService.getEyeReadTranslations.calls.reset();
    mockService.getUsedMachineCodes.and.returnValue(of(['00', '01', '02']));
    mockService.getEyeReadTranslations.and.returnValue(of([' C', ' E', ' F']));

    fixture = TestBed.createComponent(BarCodeFilterPanel);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should have periodOptions defined', () => {
      expect(component.periodOptions.length).toBe(2);
      expect(component.periodOptions.map(o => o.value)).toEqual(['BEFORE', 'AFTER']);
    });
  });

  describe('ngOnInit', () => {
    it('should populate machineCodeOptions from API', () => {
      fixture.detectChanges();
      expect(component.machineCodeOptions()).toEqual(['00', '01', '02']);
    });

    it('should populate eyeReadOptions from API', () => {
      fixture.detectChanges();
      expect(component.eyeReadOptions()).toEqual([' C', ' E', ' F']);
    });

    it('should handle dropdown load errors gracefully', () => {
      mockService.getUsedMachineCodes.and.returnValue(throwError(() => new Error('API Error')));
      mockService.getEyeReadTranslations.and.returnValue(throwError(() => new Error('API Error')));
      fixture.detectChanges();
      expect(component.machineCodeOptions()).toEqual([]);
      expect(component.eyeReadOptions()).toEqual([]);
      expect(component.isLoadingMachineCodes).toBe(false);
      expect(component.isLoadingEyeReadCodes).toBe(false);
    });

    it('should populate form from currentFilters', () => {
      component.currentFilters = {
        machineCode: '00', eyeReadTrns: ' C',
        effDate: '2025-11-01T00:00:00Z', effDatePeriod: 'AFTER',
        termDate: null, termDatePeriod: null
      };
      fixture.detectChanges();
      expect(component.filterForm.get('machineCode')?.value).toBe('00');
      expect(component.filterForm.get('eyeReadTrns')?.value).toBe(' C');
      expect(component.filterForm.get('effDatePeriod')?.value).toBe('AFTER');
    });
  });

  describe('Searchable Dropdowns', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter machine codes based on search', () => {
      component.machineCodeSearchControl.setValue('01');
      expect(component.filteredMachineCodes()).toEqual(['01']);
    });

    it('should return all machine codes when search is empty', () => {
      component.machineCodeSearchControl.setValue('');
      expect(component.filteredMachineCodes()).toEqual(['00', '01', '02']);
    });

    it('should filter eye read codes based on search', () => {
      component.eyeReadSearchControl.setValue('C');
      expect(component.filteredEyeReadCodes()).toEqual([' C']);
    });
  });

  describe('Date Fields - Not Mandatory', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not have required validator on effDate', () => {
      const control = component.filterForm.get('effDate');
      control?.setValue(null);
      control?.markAsTouched();
      expect(control?.hasError('required')).toBe(false);
    });

    it('should not have required validator on termDate', () => {
      const control = component.filterForm.get('termDate');
      control?.setValue(null);
      control?.markAsTouched();
      expect(control?.hasError('required')).toBe(false);
    });

    it('should not have required validator on effDatePeriod when no date set', () => {
      const control = component.filterForm.get('effDatePeriod');
      control?.setValue(null);
      control?.markAsTouched();
      expect(control?.hasError('required')).toBe(false);
    });

    it('should not have required validator on termDatePeriod when no date set', () => {
      const control = component.filterForm.get('termDatePeriod');
      control?.setValue(null);
      control?.markAsTouched();
      expect(control?.hasError('required')).toBe(false);
    });

    it('should disable APPLY when no filter values are set', () => {
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should enable APPLY when machine code is selected', () => {
      component.filterForm.patchValue({ machineCode: '00' });
      expect(component.isApplyDisabled).toBe(false);
    });
  });

  describe('onApply', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit null for empty fields', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({ machineCode: '00' });
      component.onApply();
      const emitted = (component.apply.emit as jasmine.Spy).calls.first().args[0] as BarCodeTranslationFilterValue;
      expect(emitted.machineCode).toBe('00');
      expect(emitted.effDate).toBeNull();
      expect(emitted.termDate).toBeNull();
    });
  });

  describe('onClear', () => {
    it('should clear period errors', () => {
      fixture.detectChanges();
      component.filterForm.get('effDatePeriod')?.setErrors({ required: true });
      component.filterForm.get('termDatePeriod')?.setErrors({ required: true });
      component.onClear();
      expect(component.filterForm.get('effDatePeriod')?.errors).toBeNull();
      expect(component.filterForm.get('termDatePeriod')?.errors).toBeNull();
    });
  });
});
