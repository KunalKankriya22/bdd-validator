import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { PhysicalFindingsTemplateFilterPanel } from './physical-findings-template-filter-panel';
import { PhysicalFindingsTemplateService } from '../services/physical-findings-template.service';

describe('PhysicalFindingsTemplateFilterPanel', () => {
  let component: PhysicalFindingsTemplateFilterPanel;
  let fixture: ComponentFixture<PhysicalFindingsTemplateFilterPanel>;
  let mockService: jasmine.SpyObj<PhysicalFindingsTemplateService>;

  beforeEach(() => {
    mockService = jasmine.createSpyObj('PhysicalFindingsTemplateService', [
      'getDonationTypes',
      'getAllProcedureCodes'
    ]);
    mockService.getDonationTypes.and.returnValue(of({
      data: [
        { code: 'WB', description: 'Whole Blood' },
        { code: 'PLT', description: 'Platelets' }
      ]
    }));
    mockService.getAllProcedureCodes.and.returnValue(of({
      data: [
        { code: 'PROC1', description: 'Procedure 1' },
        { code: 'PROC2', description: 'Procedure 2' }
      ]
    }));

    TestBed.configureTestingModule({
      imports: [PhysicalFindingsTemplateFilterPanel, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        { provide: PhysicalFindingsTemplateService, useValue: mockService }
      ]
    });

    fixture = TestBed.createComponent(PhysicalFindingsTemplateFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.filterForm.value.showInactive).toBeFalsy();
    expect(component.filterForm.value.donationType).toBeNull();
    expect(component.filterForm.value.procedureCode).toBeNull();
    expect(component.filterForm.value.effectiveDatePeriod).toBeNull();
    expect(component.filterForm.value.effectiveDate).toBeNull();
  });

  it('should load dropdown options on init', () => {
    expect(mockService.getDonationTypes).toHaveBeenCalled();
    expect(mockService.getAllProcedureCodes).toHaveBeenCalled();
    expect(component.donationTypeOptions.length).toBe(2);
    expect(component.procedureCodeOptions.length).toBe(2);
  });

  describe('isApplyDisabled', () => {
    it('should return true when no fields are populated', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return false when showInactive is true', () => {
      component.filterForm.patchValue({ showInactive: true });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return false when donationType is set', () => {
      component.filterForm.patchValue({ donationType: 'WB' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return false when procedureCode is set', () => {
      component.filterForm.patchValue({ procedureCode: 'PROC1' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return true when effectivePeriodRequired is set', () => {
      component.effectivePeriodRequired = true;
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when terminationPeriodRequired is set', () => {
      component.terminationPeriodRequired = true;
      expect(component.isApplyDisabled).toBeTrue();
    });
  });

  describe('onApply', () => {
    it('should emit apply with filter values', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        showInactive: true,
        donationType: 'WB',
        procedureCode: 'PROC1'
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          showInactive: true,
          donationType: 'WB',
          procedureCode: 'PROC1'
        })
      );
    });

    it('should emit null for empty optional fields', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({ showInactive: true });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          donationType: null,
          procedureCode: null,
          effectiveDate: null,
          terminationDate: null
        })
      );
    });
  });

  describe('onClearAll', () => {
    it('should reset form and clear validation flags', () => {
      component.filterForm.patchValue({
        showInactive: true,
        donationType: 'WB',
        procedureCode: 'PROC1'
      });
      component.effectivePeriodRequired = true;
      component.terminationPeriodRequired = true;

      component.onClearAll();

      expect(component.filterForm.value.showInactive).toBeFalsy();
      expect(component.filterForm.value.donationType).toBeNull();
      expect(component.effectivePeriodRequired).toBeFalse();
      expect(component.terminationPeriodRequired).toBeFalse();
    });

    it('should reload dropdowns after clear', () => {
      mockService.getDonationTypes.calls.reset();
      mockService.getAllProcedureCodes.calls.reset();

      component.onClearAll();

      expect(mockService.getDonationTypes).toHaveBeenCalled();
      expect(mockService.getAllProcedureCodes).toHaveBeenCalled();
    });
  });

  describe('onClose', () => {
    it('should emit close event', () => {
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('date period validation', () => {
    it('should set effectivePeriodRequired when date is set without period', fakeAsync(() => {
      component.filterForm.patchValue({ effectiveDate: new Date(), effectiveDatePeriod: null });
      tick();

      component.validateEffectivePeriod();

      expect(component.effectivePeriodRequired).toBeTrue();
    }));

    it('should clear effectivePeriodRequired when period is selected', fakeAsync(() => {
      component.filterForm.patchValue({ effectiveDate: new Date(), effectiveDatePeriod: 'after' });
      tick();

      component.validateEffectivePeriod();

      expect(component.effectivePeriodRequired).toBeFalse();
    }));

    it('should set terminationPeriodRequired when date is set without period', fakeAsync(() => {
      component.filterForm.patchValue({ terminationDate: new Date(), terminationDatePeriod: null });
      tick();

      component.validateTerminationPeriod();

      expect(component.terminationPeriodRequired).toBeTrue();
    }));
  });

  describe('dropdown search', () => {
    it('should filter donation types by search term', fakeAsync(() => {
      component.donationTypeSearchControl.setValue('whole');
      tick();

      expect(component.filteredDonationTypeOptions.length).toBe(1);
      expect(component.filteredDonationTypeOptions[0].value).toBe('WB');
    }));

    it('should filter procedure codes by search term', fakeAsync(() => {
      component.procedureCodeSearchControl.setValue('procedure 1');
      tick();

      expect(component.filteredProcedureCodeOptions.length).toBe(1);
    }));

    it('should show all options when search is empty', fakeAsync(() => {
      component.donationTypeSearchControl.setValue('');
      tick();

      expect(component.filteredDonationTypeOptions.length).toBe(2);
    }));
  });

  describe('dropdown opened handlers', () => {
    it('should clear donation type search and reset filtered list when opened', () => {
      component.donationTypeSearchControl.setValue('test');

      component.onDonationTypeDropdownOpened(true);

      expect(component.donationTypeSearchControl.value).toBe('');
      expect(component.filteredDonationTypeOptions.length).toBe(component.donationTypeOptions.length);
    });

    it('should clear procedure code search and reset filtered list when opened', () => {
      component.procedureCodeSearchControl.setValue('test');

      component.onProcedureCodeDropdownOpened(true);

      expect(component.procedureCodeSearchControl.value).toBe('');
      expect(component.filteredProcedureCodeOptions.length).toBe(component.procedureCodeOptions.length);
    });
  });

  describe('showInactive change', () => {
    it('should reload dropdowns when showInactive changes', fakeAsync(() => {
      mockService.getDonationTypes.calls.reset();
      mockService.getAllProcedureCodes.calls.reset();

      component.filterForm.patchValue({ showInactive: true });
      tick();

      expect(mockService.getDonationTypes).toHaveBeenCalled();
      expect(mockService.getAllProcedureCodes).toHaveBeenCalled();
    }));

    it('should clear donationType and procedureCode when showInactive changes', fakeAsync(() => {
      component.filterForm.patchValue({ donationType: 'WB', procedureCode: 'PROC1' });
      tick();

      component.filterForm.patchValue({ showInactive: true });
      tick();

      expect(component.filterForm.value.donationType).toBeNull();
      expect(component.filterForm.value.procedureCode).toBeNull();
    }));
  });
});
