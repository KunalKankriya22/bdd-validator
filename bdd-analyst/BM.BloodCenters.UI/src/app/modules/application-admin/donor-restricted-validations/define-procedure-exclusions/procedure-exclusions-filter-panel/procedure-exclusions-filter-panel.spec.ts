import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProcedureExclusionsFilterPanel } from './procedure-exclusions-filter-panel';
import { DefineProcedureExclusionsService } from '../services/define-procedure-exclusions.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { DefineProcedureExclusionsFilterValue } from '../models/define-procedure-exclusions.model';

describe('ProcedureExclusionsFilterPanel', () => {
  let component: ProcedureExclusionsFilterPanel;
  let fixture: ComponentFixture<ProcedureExclusionsFilterPanel>;
  let mockService: jasmine.SpyObj<DefineProcedureExclusionsService>;

  const mockFilterResponse = {
    data: [{
      donationTypes: [
        { key: '99 - Not Recorded', value: '99' },
        { key: 'AL - Allogeneic', value: 'AL' },
        { key: 'AU - Autologous', value: 'AU' }
      ],
      procedureCodes: [
        { key: '99 - Not Present', value: '99' },
        { key: 'BM - Bone Marrow', value: 'BM' },
        { key: 'WB - Whole Blood', value: 'WB' }
      ],
      interdictionCodes: [
        { key: 'CODE001 - Description 1', value: 'CODE001' },
        { key: 'CODE002 - Description 2', value: 'CODE002' },
        { key: 'CODE003 - Description 3', value: 'CODE003' }
      ]
    }]
  };

  const mockCurrentFilters: DefineProcedureExclusionsFilterValue = {
    donationType: 'AL',
    procedureCode: 'BM',
    interdictionCode: 'CODE001'
  };

  beforeEach(() => {
    mockService = jasmine.createSpyObj('DefineProcedureExclusionsService', [
      'getProcedureExclusionsFilters',
      'getLookups'
    ]);
    mockService.getProcedureExclusionsFilters.and.returnValue(of(mockFilterResponse));
    mockService.getLookups.and.returnValue(of({ data: [] }));

    TestBed.configureTestingModule({
      imports: [
        ProcedureExclusionsFilterPanel,
        NoopAnimationsModule
      ],
      providers: [
        { provide: DefineProcedureExclusionsService, useValue: mockService }
      ]
    });
  });

  beforeEach(() => {
    mockService.getProcedureExclusionsFilters.calls.reset();
    mockService.getProcedureExclusionsFilters.and.returnValue(of(mockFilterResponse));

    fixture = TestBed.createComponent(ProcedureExclusionsFilterPanel);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should initialize with empty arrays for options', () => {
      expect(component.filteredDonationTypes()).toEqual([]);
      expect(component.filteredProcedures()).toEqual([]);
      expect(component.filteredInterdictions()).toEqual([]);
    });
  });

  describe('ngOnInit', () => {
    it('should initialize form with empty string values when no currentFilters', () => {
      fixture.detectChanges();

      expect(component.filterForm.get('donationType')?.value).toBeNull();
      expect(component.filterForm.get('procedureCode')?.value).toBeNull();
      expect(component.filterForm.get('interdictionCode')?.value).toBeNull();
    });

    it('should initialize form with currentFilters values', () => {
      component.currentFilters = mockCurrentFilters;
      fixture.detectChanges();

      expect(component.filterForm.get('donationType')?.value).toBe('AL');
      expect(component.filterForm.get('procedureCode')?.value).toBe('BM');
      expect(component.filterForm.get('interdictionCode')?.value).toBe('CODE001');
    });
  });

  describe('loadFilterOptions', () => {
    it('should load filter options from service', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockService.getProcedureExclusionsFilters).toHaveBeenCalled();
      expect(component.filteredDonationTypes().length).toBe(3);
      expect(component.filteredProcedures().length).toBe(3);
      expect(component.filteredInterdictions().length).toBe(3);
    }));

    it('should map key-value pairs correctly for donation types', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.filteredDonationTypes()[0].key).toBe('99 - Not Recorded');
      expect(component.filteredDonationTypes()[0].value).toBe('99');
      expect(component.filteredDonationTypes()[1].key).toBe('AL - Allogeneic');
      expect(component.filteredDonationTypes()[1].value).toBe('AL');
    }));

    it('should map key-value pairs correctly for procedure codes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.filteredProcedures()[0].key).toBe('99 - Not Present');
      expect(component.filteredProcedures()[0].value).toBe('99');
      expect(component.filteredProcedures()[1].key).toBe('BM - Bone Marrow');
      expect(component.filteredProcedures()[1].value).toBe('BM');
    }));

    it('should handle empty response gracefully', fakeAsync(() => {
      mockService.getProcedureExclusionsFilters.and.returnValue(of({}));

      fixture.detectChanges();
      tick();

      expect(component.filteredDonationTypes()).toEqual([]);
      expect(component.filteredProcedures()).toEqual([]);
      expect(component.filteredInterdictions()).toEqual([]);
    }));

    it('should handle error and set empty arrays', fakeAsync(() => {
      mockService.getProcedureExclusionsFilters.and.returnValue(throwError(() => new Error('API Error')));

      fixture.detectChanges();
      tick();

      expect(component.filteredDonationTypes()).toEqual([]);
      expect(component.filteredProcedures()).toEqual([]);
      expect(component.filteredInterdictions()).toEqual([]);
      expect(component.isLoadingFilters).toBe(false);
    }));

    it('should handle response with data array structure', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.filteredDonationTypes().length).toBe(3);
      expect(component.filteredProcedures().length).toBe(3);
      expect(component.filteredInterdictions().length).toBe(3);
    }));
  });

  describe('onClear', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form to empty values', () => {
      component.filterForm.patchValue({
        donationType: 'AL',
        procedureCode: 'BM',
        interdictionCode: 'CODE001'
      });

      component.onClear();

      expect(component.filterForm.get('donationType')?.value).toBeNull();
      expect(component.filterForm.get('procedureCode')?.value).toBeNull();
      expect(component.filterForm.get('interdictionCode')?.value).toBeNull();
    });

    it('should clear partially filled form', () => {
      component.filterForm.patchValue({
        donationType: 'AL',
        procedureCode: '',
        interdictionCode: 'CODE001'
      });

      component.onClear();

      expect(component.filterForm.get('donationType')?.value).toBeNull();
      expect(component.filterForm.get('procedureCode')?.value).toBeNull();
      expect(component.filterForm.get('interdictionCode')?.value).toBeNull();
    });
  });

  describe('Form Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update form value when donation type changes', () => {
      component.filterForm.patchValue({ donationType: 'AL' });
      expect(component.filterForm.get('donationType')?.value).toBe('AL');
    });

    it('should update form value when procedure code changes', () => {
      component.filterForm.patchValue({ procedureCode: 'BM' });
      expect(component.filterForm.get('procedureCode')?.value).toBe('BM');
    });

    it('should update form value when interdiction code changes', () => {
      component.filterForm.patchValue({ interdictionCode: 'CODE001' });
      expect(component.filterForm.get('interdictionCode')?.value).toBe('CODE001');
    });

    it('should allow all fields to be empty', () => {
      component.filterForm.patchValue({
        donationType: '',
        procedureCode: '',
        interdictionCode: ''
      });

      expect(component.filterForm.valid).toBe(true);
    });
  });

  describe('Filter Options Population', () => {
    it('should populate donation type options with key-value pairs', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.filteredDonationTypes().length).toBeGreaterThan(0);
      expect(component.filteredDonationTypes()[0].key).toBeDefined();
      expect(component.filteredDonationTypes()[0].value).toBeDefined();
    }));

    it('should populate procedure options with key-value pairs', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.filteredProcedures().length).toBeGreaterThan(0);
      expect(component.filteredProcedures()[0].key).toBeDefined();
      expect(component.filteredProcedures()[0].value).toBeDefined();
    }));

    it('should populate interdiction options as key-value objects', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.filteredInterdictions().length).toBeGreaterThan(0);
      expect(component.filteredInterdictions()[0].key).toBeDefined();
      expect(component.filteredInterdictions()[0].value).toBeDefined();
    }));
  });

  describe('Edge Cases', () => {
    it('should handle null currentFilters gracefully', () => {
      component.currentFilters = null;
      fixture.detectChanges();

      expect(component.filterForm.get('donationType')?.value).toBeNull();
    });

    it('should handle undefined filter data', fakeAsync(() => {
      mockService.getProcedureExclusionsFilters.and.returnValue(of({
        data: [{
          donationTypes: undefined,
          procedureCodes: undefined,
          interdictionCodes: undefined
        }] as any
      }));

      fixture.detectChanges();
      tick();

      expect(component.filteredDonationTypes()).toEqual([]);
      expect(component.filteredProcedures()).toEqual([]);
      expect(component.filteredInterdictions()).toEqual([]);
    }));

    it('should handle null arrays in filter data', fakeAsync(() => {
      mockService.getProcedureExclusionsFilters.and.returnValue(of({
        data: [{
          donationTypes: null,
          procedureCodes: null,
          interdictionCodes: null
        }] as any
      }));

      fixture.detectChanges();
      tick();

      expect(component.filteredDonationTypes()).toEqual([]);
      expect(component.filteredProcedures()).toEqual([]);
      expect(component.filteredInterdictions()).toEqual([]);
    }));
  });

  describe('Integration Scenarios', () => {
    it('should handle complete filter application workflow', fakeAsync(() => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();
      tick();

      // Set filters
      component.filterForm.patchValue({
        donationType: 'AL',
        procedureCode: 'BM',
        interdictionCode: 'CODE001'
      });

      // Apply filters
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({
        donationType: 'AL',
        procedureCode: 'BM',
        interdictionCode: 'CODE001'
      });

      // Clear filters
      component.onClear();

      expect(component.filterForm.get('donationType')?.value).toBeNull();
    }));

    it('should initialize with currentFilters and then clear', () => {
      component.currentFilters = mockCurrentFilters;
      fixture.detectChanges();

      expect(component.filterForm.get('donationType')?.value).toBe('AL');

      component.onClear();

      expect(component.filterForm.get('donationType')?.value).toBeNull();
    });
  });
});
