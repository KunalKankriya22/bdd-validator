import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProcedureGroupsFilterPanel } from './procedure-groups-filter-panel';
import { DefineProcedureGroupsService } from '../services/define-procedure-groups.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';
import {
  DefineProcedureGroupsFilterValue,
  ProcedureGroupLookup,
  ProcedureCodeLookup,
  CreditCountLookup
} from '../models/define-procedure-groups.model';
import { ChangeDetectorRef } from '@angular/core';

describe('ProcedureGroupsFilterPanel', () => {
  let component: ProcedureGroupsFilterPanel;
  let fixture: ComponentFixture<ProcedureGroupsFilterPanel>;
  let mockService: jasmine.SpyObj<DefineProcedureGroupsService>;
  let changeDetectorRef: ChangeDetectorRef;

  const mockProcedureGroupLookup: ProcedureGroupLookup[] = [
    { code: 'PLASM', description: 'Plasma Collection' },
    { code: 'PLATE', description: 'Platelet Collection' },
    { code: 'WHOLE', description: 'Whole Blood' }
  ];

  const mockProcedureCodeLookup: ProcedureCodeLookup[] = [
    { procedureCode: 'PL', description: 'Plasma' },
    { procedureCode: 'PP', description: 'Plateletpheresis' },
    { procedureCode: 'WB', description: 'Whole Blood' }
  ];

  const mockCreditCountLookup: CreditCountLookup[] = [
    { creditCount: 1, description: 'Credit Count: 1', recordCount: 10 },
    { creditCount: 2, description: 'Credit Count: 2', recordCount: 5 },
    { creditCount: 3, description: 'Credit Count: 3', recordCount: 3 }
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DefineProcedureGroupsService', [
      'getProcedureGroupsFilterLookup',
      'getProcedureCodesFilterLookup',
      'getCreditCountsLookup'
    ]);

    mockService.getProcedureGroupsFilterLookup.and.returnValue(
      of({ success: true, data: mockProcedureGroupLookup, total: 3 })
    );
    mockService.getProcedureCodesFilterLookup.and.returnValue(
      of({ success: true, data: mockProcedureCodeLookup, total: 3 })
    );
    mockService.getCreditCountsLookup.and.returnValue(
      of({ success: true, data: mockCreditCountLookup, total: 3 })
    );



      TestBed.configureTestingModule({
imports: [ProcedureGroupsFilterPanel],
      providers: [
        provideAnimationsAsync(),
        { provide: DefineProcedureGroupsService, useValue: mockService }
      ]
    });


    });



  beforeEach(() => {









    fixture = TestBed.createComponent(ProcedureGroupsFilterPanel);
    component = fixture.componentInstance;
    changeDetectorRef = fixture.debugElement.injector.get(ChangeDetectorRef);


    });

  describe('Component Initialization', () => {

    it('should initialize filter form with all fields', () => {
      fixture.detectChanges();

      expect(component.filterForm).toBeDefined();
      expect(component.filterForm.get('procedureGroupCode')).toBeDefined();
      expect(component.filterForm.get('procedureCode')).toBeDefined();
      expect(component.filterForm.get('donationCredits')).toBeDefined();
      expect(component.filterForm.get('effectiveDatePeriod')).toBeDefined();
      expect(component.filterForm.get('effectiveDate')).toBeDefined();
      expect(component.filterForm.get('terminationDatePeriod')).toBeDefined();
      expect(component.filterForm.get('terminationDate')).toBeDefined();
    });

    it('should have period options defined', () => {
      expect(component.periodOptions).toBeDefined();
      expect(component.periodOptions.length).toBe(2);
      expect(component.periodOptions).toEqual([
        { value: 'After', label: 'After' },
        { value: 'Before', label: 'Before' }
      ]);
    });
  });

  describe('Loading Filter Options', () => {
    it('should load all three lookup types on init', () => {
      fixture.detectChanges();

      expect(mockService.getProcedureGroupsFilterLookup).toHaveBeenCalled();
      expect(mockService.getProcedureCodesFilterLookup).toHaveBeenCalled();
      expect(mockService.getCreditCountsLookup).toHaveBeenCalled();
    });

    it('should populate procedure group options from response', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.procedureGroupOptions).toEqual(mockProcedureGroupLookup);
        done();
      }, 100);
    });

    it('should populate procedure code options from response', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.procedureCodeOptions).toEqual(mockProcedureCodeLookup);
        done();
      }, 100);
    });

    it('should populate credit count options from response', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.creditCountOptions).toEqual(mockCreditCountLookup);
        done();
      }, 100);
    });


    it('should restore form values after data loads', (done) => {
      const initialFilters: DefineProcedureGroupsFilterValue = {
        procedureGroupCode: 'PLASM',
        procedureCode: 'PL',
        donationCredits: 1,
        effectiveDatePeriod: null,
        terminationDatePeriod: null,
        terminationDate: null,
        effectiveDate: null
      };

      component.currentFilters = initialFilters;
      component.ngOnInit();

      setTimeout(() => {
        expect(component.filterForm.get('procedureGroupCode')?.value).toBe('PLASM');
        expect(component.filterForm.get('procedureCode')?.value).toBe('PL');
        expect(component.filterForm.get('donationCredits')?.value).toBe(1);
        done();
      }, 100);
    });
  });
  describe('Form Initialization with Current Filters', () => {
    it('should initialize with current filters if provided', () => {
      const currentFilters: DefineProcedureGroupsFilterValue = {
        procedureGroupCode: 'PLASM',
        procedureCode: 'PL',
        donationCredits: 2,
        effectiveDatePeriod: 'After',
        terminationDatePeriod: null,
        terminationDate: null,
        effectiveDate: new Date('2025-01-01')
      };

      component.currentFilters = currentFilters;
      component.ngOnInit();

      expect(component.filterForm.get('procedureGroupCode')?.value).toBe('PLASM');
      expect(component.filterForm.get('procedureCode')?.value).toBe('PL');
      expect(component.filterForm.get('donationCredits')?.value).toBe(2);
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('After');
      expect(component.filterForm.get('effectiveDate')?.value).toEqual(new Date('2025-01-01'));
    });

    it('should initialize with null values if no current filters', () => {
      component.currentFilters = null;
      component.ngOnInit();

      expect(component.filterForm.get('procedureGroupCode')?.value).toBeNull();
      expect(component.filterForm.get('procedureCode')?.value).toBeNull();
      expect(component.filterForm.get('donationCredits')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    });
  });

  describe('onApply', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should handle donation credits value 0', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        procedureGroupCode: null,
        procedureCode: null,
        donationCredits: 0,
        effectiveDatePeriod: null,
        terminationDatePeriod: null,
        terminationDate: null,
        effectiveDate: null
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.donationCredits).toBe(0);
    });
  });

  describe('onClear', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear all form fields', () => {
      component.filterForm.patchValue({
        procedureGroupCode: 'PLASM',
        procedureCode: 'PL',
        donationCredits: 2,
        effectiveDatePeriod: 'After',
        terminationDatePeriod: null,
        terminationDate: null,
        effectiveDate: new Date('2025-01-01')
      });

      component.onClear();

      expect(component.filterForm.get('procedureGroupCode')?.value).toBeNull();
      expect(component.filterForm.get('procedureCode')?.value).toBeNull();
      expect(component.filterForm.get('donationCredits')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    });

  });
  describe('Data Loading', () => {
    it('should populate procedure group options after load', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.procedureGroupOptions).toEqual(mockProcedureGroupLookup);
        done();
      }, 100);
    });

    it('should populate procedure code options after load', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.procedureCodeOptions).toEqual(mockProcedureCodeLookup);
        done();
      }, 100);
    });

    it('should populate credit count options after load', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.creditCountOptions).toEqual(mockCreditCountLookup);
        done();
      }, 100);
    });
  });

  describe('Integration - Multiple Filters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle all filters applied together', () => {
      spyOn(component.apply, 'emit');

      const allFilters = {
        procedureGroupCode: 'PLASM',
        procedureCode: 'PL',
        donationCredits: 1,
        effectiveDatePeriod: 'After' as const,
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: 'Before' as const,
        terminationDate: new Date('2025-12-31')
      };

      component.filterForm.patchValue(allFilters);
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalled();
      const emitted = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emitted.procedureGroupCode).toBe('PLASM');
      expect(emitted.procedureCode).toBe('PL');
      expect(emitted.donationCredits).toBe(1);
      expect(emitted.effectiveDatePeriod).toBe('After');
      expect(emitted.terminationDatePeriod).toBe('Before');
    });

  });
});
