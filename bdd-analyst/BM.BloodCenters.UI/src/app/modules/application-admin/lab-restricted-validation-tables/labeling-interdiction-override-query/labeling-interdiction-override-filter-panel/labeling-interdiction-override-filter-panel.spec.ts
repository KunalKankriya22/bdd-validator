import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LabelingInterdictionOverrideFilterPanel } from './labeling-interdiction-override-filter-panel';
import { LabelingInterdictionOverrideQueryService } from '../services/labeling-interdiction-override-query.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { LabelingInterdictionOverrideFilterValue } from '../models/labeling-interdiction-override-query.model';

describe('LabelingInterdictionOverrideFilterPanel', () => {
  let component: LabelingInterdictionOverrideFilterPanel;
  let fixture: ComponentFixture<LabelingInterdictionOverrideFilterPanel>;
  let mockService: jasmine.SpyObj<LabelingInterdictionOverrideQueryService>;

  const mockFilterDropdownResponse = {
    cueOptions: [
      { value: 'DDC001', key: 'Decision 001' },
      { value: 'DDC002', key: 'Decision 002' },
      { value: 'DDC003', key: 'Decision 003' }
    ],
    typeOptions: [
      { value: 'I', key: 'Initial' },
      { value: 'H', key: 'Hold' },
      { value: 'B', key: 'Bio' }
    ]
  };

  const mockCurrentFilters: LabelingInterdictionOverrideFilterValue = {
    cue: 'DDC001',
    type: 'TypeA',
    effectiveDatePeriod: 'After',
    effectiveDate: new Date('2025-01-01'),
    terminationDatePeriod: null,
    terminationDate: null
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('LabelingInterdictionOverrideQueryService', [
      'getLabelingInterdictionOverrideQueryFilters',
      'getFilterDropdown'
    ]);
    mockService.getLabelingInterdictionOverrideQueryFilters.and.returnValue(of({} as any));
    mockService.getFilterDropdown.and.returnValue(of(mockFilterDropdownResponse));



      TestBed.configureTestingModule({
imports: [
        LabelingInterdictionOverrideFilterPanel],
      providers: [
        { provide: LabelingInterdictionOverrideQueryService, useValue: mockService }
      ]
    });


    });



  beforeEach(() => {


      mockService.getLabelingInterdictionOverrideQueryFilters.calls.reset();


      mockService.getFilterDropdown.calls.reset();


      mockService.getLabelingInterdictionOverrideQueryFilters.and.returnValue(of({} as any));


      mockService.getFilterDropdown.and.returnValue(of(mockFilterDropdownResponse));


    fixture = TestBed.createComponent(LabelingInterdictionOverrideFilterPanel);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {


    it('should initialize with empty cueOptions', () => {
      expect(component.cueOptions).toEqual([]);
    });

    it('should initialize with empty interTypeOptions by default', () => {
      expect(component.interTypeOptions).toEqual([]);
    });

    it('should initialize with period options', () => {
      expect(component.periodOptions).toEqual([
        { value: 'after', display: 'After' },
        { value: 'before', display: 'Before' }
      ]);
    });

  });

  describe('ngOnInit', () => {


    it('should initialize effectiveDatePeriod with null by default', () => {
      fixture.detectChanges();

      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
    });

    it('should initialize form with currentFilters values', () => {
      component.currentFilters = mockCurrentFilters;
      fixture.detectChanges();

      expect(component.filterForm.get('donorDecisionCode')?.value).toBe('DDC001');
      expect(component.filterForm.get('interType')?.value).toBe('TypeA');
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('After');
      expect(component.filterForm.get('effectiveDate')?.value).toEqual(new Date('2025-01-01'));
    });

  });

  describe('loadFilterOptions', () => {
    it('should load cue options from service via getFilterDropdown', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockService.getFilterDropdown).toHaveBeenCalled();
      expect(component.cueOptions).toEqual([
        { value: 'DDC001', display: 'DDC001 - Decision 001' },
        { value: 'DDC002', display: 'DDC002 - Decision 002' },
        { value: 'DDC003', display: 'DDC003 - Decision 003' }
      ]);
    }));


    it('should handle response with cue options', fakeAsync(() => {
      mockService.getFilterDropdown.and.returnValue(of({
        cueOptions: [
          { value: 'DDC001', key: 'Desc 001' },
          { value: 'DDC002', key: 'Desc 002' }
        ],
        typeOptions: []
      }));

      fixture.detectChanges();
      tick();

      expect(component.cueOptions).toEqual([
        { value: 'DDC001', display: 'DDC001 - Desc 001' },
        { value: 'DDC002', display: 'DDC002 - Desc 002' }
      ]);
    }));



    it('should set interTypeOptions to empty when no type data', fakeAsync(() => {
      mockService.getFilterDropdown.and.returnValue(of({
        cueOptions: [{ value: 'DDC001', key: 'Desc' }],
        typeOptions: []
      }));

      fixture.detectChanges();
      tick();

      expect(component.interTypeOptions).toEqual([]);
    }));

    it('should populate interTypeOptions from typeOptions data', fakeAsync(() => {
      mockService.getFilterDropdown.and.returnValue(of({
        cueOptions: [{ value: 'DDC001', key: 'Desc' }],
        typeOptions: [
          { value: 'I', key: 'Initial' },
          { value: 'H', key: 'Hold' },
          { value: 'B', key: 'Bio' }
        ]
      }));

      fixture.detectChanges();
      tick();

      expect(component.interTypeOptions).toEqual([
        { value: 'I', display: 'I - Initial' },
        { value: 'H', display: 'H - Hold' },
        { value: 'B', display: 'B - Bio' }
      ]);
    }));

    it('should set interTypeOptions to empty when typeOptions is empty', fakeAsync(() => {
      mockService.getFilterDropdown.and.returnValue(of({
        cueOptions: [],
        typeOptions: []
      }));

      fixture.detectChanges();
      tick();

      expect(component.interTypeOptions).toEqual([]);
    }));
  });

  describe('interTypeOptions', () => {
    it('should initialize with empty interTypeOptions', () => {
      expect(component.interTypeOptions).toEqual([]);
    });

    it('should load interTypeOptions from getFilterDropdown response', fakeAsync(() => {
      mockService.getFilterDropdown.and.returnValue(of({
        cueOptions: [{ value: 'DDC001', key: 'Desc1' }, { value: 'DDC002', key: 'Desc2' }],
        typeOptions: [
          { value: 'I', key: 'Initial' },
          { value: 'H', key: 'Hold' },
          { value: 'N', key: 'NFT' }
        ]
      }));

      fixture.detectChanges();
      tick();

      expect(component.interTypeOptions).toEqual([
        { value: 'I', display: 'I - Initial' },
        { value: 'H', display: 'H - Hold' },
        { value: 'N', display: 'N - NFT' }
      ]);
    }));
  });

  describe('onApply', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should include effectiveDatePeriod only when effectiveDate is set', () => {
      spyOn(component.apply, 'emit');
      const effDate = new Date('2025-06-15');

      component.filterForm.patchValue({
        donorDecisionCode: null,
        interType: null,
        effectiveDatePeriod: 'Before',
        effectiveDate: effDate,
        terminationDatePeriod: 'After',
        terminationDate: null
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.effectiveDatePeriod).toBe('Before');
      expect(emittedValue.effectiveDate).toEqual(effDate);
    });


    it('should include terminationDatePeriod only when terminationDate is set', () => {
      spyOn(component.apply, 'emit');
      const termDate = new Date('2025-12-31');

      component.filterForm.patchValue({
        donorDecisionCode: null,
        interType: null,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: 'On',
        terminationDate: termDate
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.terminationDatePeriod).toBe('On');
      expect(emittedValue.terminationDate).toEqual(termDate);
    });
  });

  describe('onClear', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should reset effectiveDatePeriod to null', () => {
      component.filterForm.patchValue({ effectiveDatePeriod: 'Before' });

      component.onClear();

      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
    });

    it('should reset terminationDatePeriod to null', () => {
      component.filterForm.patchValue({ terminationDatePeriod: 'On' });

      component.onClear();

      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
    });
  });
  describe('Integration Tests', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should allow selecting cue and applying filter', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        donorDecisionCode: 'DDC001',
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2025-01-01')
      });
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        cue: 'DDC001'
      }));
    });

    it('should allow clearing and reapplying filters', () => {
      component.filterForm.patchValue({
        donorDecisionCode: 'DDC001',
        interType: 'TypeA'
      });

      component.onClear();

      expect(component.filterForm.get('donorDecisionCode')?.value).toBeNull();
      expect(component.filterForm.get('interType')?.value).toBeNull();

      component.filterForm.patchValue({ donorDecisionCode: 'DDC002' });
      expect(component.filterForm.get('donorDecisionCode')?.value).toBe('DDC002');
    });
  });

  describe('Response Structure Handling', () => {
    it('should handle response with cue and type options', fakeAsync(() => {
      mockService.getFilterDropdown.and.returnValue(of({
        cueOptions: [{ value: 'A', key: 'Desc A' }, { value: 'B', key: 'Desc B' }],
        typeOptions: []
      }));

      fixture.detectChanges();
      tick();

      expect(component.cueOptions).toEqual([
        { value: 'A', display: 'A - Desc A' },
        { value: 'B', display: 'B - Desc B' }
      ]);
    }));

    it('should handle missing cueOptions property', fakeAsync(() => {
      mockService.getFilterDropdown.and.returnValue(of({
        cueOptions: [],
        typeOptions: []
      }));

      fixture.detectChanges();
      tick();

      expect(component.cueOptions).toEqual([]);
    }));

  });
});
