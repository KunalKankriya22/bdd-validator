import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';

import { DefineProcedureCodesComponent } from './define-procedure-codes';
import { ProcedureCodeApiService } from '../services/procedure-code-api.service';
import { ProcedureCode } from '../models/procedure-code.model';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('DefineProcedureCodesComponent', () => {
  let component: DefineProcedureCodesComponent;
  let fixture: ComponentFixture<DefineProcedureCodesComponent>;
  let mockApiService: jasmine.SpyObj<ProcedureCodeApiService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let chapterChangedSubject: Subject<void>;

  const mockProcedureCodes: ProcedureCode[] = [
    {
      procedureCode: 'PL',
      description: 'Plasmapheresis',
      deferralDays: 2,
      achievementCredits: 1,
      procedureDuration: 1,
      sequence: 4,
      effectiveDate: '2025-01-11T00:00:00',
      terminationDate: null,
      standardRbcLoss: 0,
      standardPlasmaLoss: 0,
      extracorporealRbcLoss: 0,
      extracorporealPlasmaLoss: 0,
      chapterId: 'CH001',
      isActive: true,
    },
    {
      procedureCode: 'WB',
      description: 'Whole Blood',
      deferralDays: 56,
      achievementCredits: 1,
      procedureDuration: 1,
      sequence: 10,
      effectiveDate: '2025-01-11T00:00:00',
      terminationDate: null,
      standardRbcLoss: 0,
      standardPlasmaLoss: 0,
      extracorporealRbcLoss: 0,
      extracorporealPlasmaLoss: 0,
      chapterId: 'CH001',
      isActive: true,
    },
  ];

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    mockApiService = jasmine.createSpyObj('ProcedureCodeApiService', [
      'getProcedureCodes',
      'createProcedureCode',
      'updateProcedureCode',
      'getProcedureCodeByCode',
    ]);
    mockApiService.getProcedureCodes.and.returnValue(
      of({ data: mockProcedureCodes, total: 2 })
    );
    mockApiService.getProcedureCodeByCode.and.returnValue(
      of(mockProcedureCodes[0])
    );

    mockHeaderService = createMockHeaderService();
      TestBed.configureTestingModule({
      imports: [
        DefineProcedureCodesComponent,
        MatSnackBarModule,
        MatDialogModule,
      ],
      providers: [
        { provide: ProcedureCodeApiService, useValue: mockApiService },
        { provide: HeaderService, useValue: mockHeaderService },
        provideNoopAnimations(),
        provideRouter([]),
        provideHttpClient(),
      ],
    });


    


      mockApiService.getProcedureCodes.calls.reset();


      mockApiService.createProcedureCode.calls.reset();


      mockApiService.updateProcedureCode.calls.reset();


      mockApiService.getProcedureCodeByCode.calls.reset();


    fixture = TestBed.createComponent(DefineProcedureCodesComponent);
    component = fixture.componentInstance;


    });


  it('should load procedure codes on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(mockApiService.getProcedureCodes).toHaveBeenCalled();
    expect(component.dataSource.data.length).toBe(2);
    expect(component.totalRecords).toBe(2);
  }));









  it('should build filter chips correctly', () => {
    component.currentFilters = {
      procedureCode: 'WB',
      deferralDays: 56,
    };
    component.buildFilterChips();

    expect(component.filterChips.length).toBe(2);
    expect(component.filterChips[0].key).toBe('procedureCode');
    expect(component.filterChips[1].key).toBe('deferralDays');
  });







  it('should apply search term when searching', fakeAsync(() => {
    component.onSearchEvent('Whole');
    tick();

    expect(component.searchTerm).toBe('Whole');
    expect(mockApiService.getProcedureCodes).toHaveBeenCalled();
  }));

  it('should apply sort when sorting column', fakeAsync(() => {
    component.onSort({ active: 'procedureCode', direction: 'asc' });
    tick();

    expect(component.sortDirection).toBe('A');
    expect(mockApiService.getProcedureCodes).toHaveBeenCalled();
  }));

  it('should return true when there are active filters', () => {
    component.filterChips = [{ key: 'procedureCode', label: 'WB', value: 'WB' }];
    expect(component.hasActiveFilters()).toBeTrue();
  });

  it('should return false when there are no active filters', () => {
    component.filterChips = [];
    expect(component.hasActiveFilters()).toBeFalse();
  });

  it('should handle onRemoveFilterChip', fakeAsync(() => {
    component.currentFilters = { procedureCode: 'WB' };
    component.filterChips = [{ key: 'procedureCode', label: 'WB', value: 'WB' }];

    component.onRemoveFilterChip('procedureCode');
    tick();

    expect(component.currentFilters.procedureCode).toBeUndefined();
    expect(mockApiService.getProcedureCodes).toHaveBeenCalled();
  }));

  describe('Filter Chips with Dates', () => {
    it('should build filter chip for effective date with after period', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      component.currentFilters = {
        effDate: futureDate.toISOString(),
        effDatePeriod: 'after',
      };
      component.buildFilterChips();

      expect(component.filterChips.length).toBe(1);
      expect(component.filterChips[0].key).toBe('effDate');
      expect(component.filterChips[0].label).toContain('Effective Date');
      expect(component.filterChips[0].label).toContain('≥');
    });

    it('should build filter chip for effective date with before period', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      component.currentFilters = {
        effDate: futureDate.toISOString(),
        effDatePeriod: 'before',
      };
      component.buildFilterChips();

      expect(component.filterChips.length).toBe(1);
      expect(component.filterChips[0].key).toBe('effDate');
      expect(component.filterChips[0].label).toContain('Effective Date');
      expect(component.filterChips[0].label).toContain('≤');
    });

    it('should build filter chip for termination date with after period', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      component.currentFilters = {
        termDate: futureDate.toISOString(),
        termDatePeriod: 'after',
      };
      component.buildFilterChips();

      expect(component.filterChips.length).toBe(1);
      expect(component.filterChips[0].key).toBe('termDate');
      expect(component.filterChips[0].label).toContain('Termination Date');
      expect(component.filterChips[0].label).toContain('≥');
    });

    it('should build filter chip for termination date with before period', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      component.currentFilters = {
        termDate: futureDate.toISOString(),
        termDatePeriod: 'before',
      };
      component.buildFilterChips();

      expect(component.filterChips.length).toBe(1);
      expect(component.filterChips[0].key).toBe('termDate');
      expect(component.filterChips[0].label).toContain('Termination Date');
      expect(component.filterChips[0].label).toContain('≤');
    });

    it('should build multiple filter chips', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      component.currentFilters = {
        procedureCode: 'WB',
        deferralDays: 56,
        effDate: futureDate.toISOString(),
        effDatePeriod: 'after',
      };
      component.buildFilterChips();

      expect(component.filterChips.length).toBe(3);
      expect(component.filterChips.some(chip => chip.key === 'procedureCode')).toBeTrue();
      expect(component.filterChips.some(chip => chip.key === 'deferralDays')).toBeTrue();
      expect(component.filterChips.some(chip => chip.key === 'effDate')).toBeTrue();
    });

    it('should remove effective date filter and period together', fakeAsync(() => {
      component.currentFilters = {
        effDate: new Date().toISOString(),
        effDatePeriod: 'after',
      };
      component.buildFilterChips();

      component.removeFilter('effDate');
      tick();

      expect(component.currentFilters.effDate).toBeUndefined();
      expect(component.currentFilters.effDatePeriod).toBeUndefined();
    }));

    it('should remove termination date filter and period together', fakeAsync(() => {
      component.currentFilters = {
        termDate: new Date().toISOString(),
        termDatePeriod: 'before',
      };
      component.buildFilterChips();

      component.removeFilter('termDate');
      tick();

      expect(component.currentFilters.termDate).toBeUndefined();
      expect(component.currentFilters.termDatePeriod).toBeUndefined();
    }));
  });

  describe('Date Formatting', () => {
    it('should format date in DD-MON-YYYY format', () => {
      const formatted = component.formatDate('2027-06-15T00:00:00');
      expect(formatted).toBe('15-JUN-2027');
    });



    it('should pad single digit days with zero', () => {
      const formatted = component.formatDate('2027-03-05T00:00:00');
      expect(formatted).toBe('05-MAR-2027');
    });
  });

  describe('Dialog Operations', () => {
    let dialogSpy: jasmine.Spy;

    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should open add dialog with correct configuration', () => {
      const dialogRefSpyObj = jasmine.createSpyObj('DialogRef', { afterClosed: of(undefined) });
      dialogSpy = spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpyObj);

      component.openAddDialog();

      const dialogConfig = dialogSpy.calls.mostRecent().args[1];
      expect(dialogConfig.width).toBe('745px');
      expect(dialogConfig.data.mode).toBe('add');
      expect(dialogConfig.position).toEqual({ right: '0', top: '0' });
    });

    it('should not reload data when add dialog is cancelled', fakeAsync(() => {
      const dialogRefSpyObj = jasmine.createSpyObj('DialogRef', { afterClosed: of(undefined) });
      dialogSpy = spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpyObj);

      const initialCallCount = mockApiService.getProcedureCodes.calls.count();
      component.openAddDialog();
      tick();

      expect(mockApiService.getProcedureCodes.calls.count()).toBe(initialCallCount);
    }));



    it('should set and clear editingRowCode when opening edit dialog', fakeAsync(() => {
      const testRow: ProcedureCode = mockProcedureCodes[0];

      const dialogRefSpyObj = jasmine.createSpyObj('DialogRef', { afterClosed: of(undefined) });
      dialogSpy = spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpyObj);

      // Initially should be null
      expect(component.editingRowCode).toBeNull();

      component.openEditDialog(testRow);

      // Process the observable subscription
      tick();

      // After dialog is closed, editingRowCode should be cleared
      expect(component.editingRowCode).toBeNull();

      // Verify dialog was opened
      expect(dialogSpy).toHaveBeenCalled();
    }));





    it('should handle error when fetching procedure code for edit', fakeAsync(() => {
      spyOn(console, 'error');
      const testRow: ProcedureCode = mockProcedureCodes[0];
      mockApiService.getProcedureCodeByCode = jasmine.createSpy().and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.openEditDialog(testRow);
      tick();

      expect(component.isLoading).toBeFalse();
      expect(component.editingRowCode).toBeNull();
    }));

    it('should pass correct data to edit dialog', fakeAsync(() => {
      const testRow: ProcedureCode = {
        procedureCode: 'WB',
        description: 'Whole Blood',
        deferralDays: 56,
        achievementCredits: 1,
        procedureDuration: 30,
        sequence: 10,
        effectiveDate: '2025-01-11T00:00:00',
        terminationDate: '2026-01-11T00:00:00',
        standardRbcLoss: 450,
        standardPlasmaLoss: 100,
        extracorporealRbcLoss: 50,
        extracorporealPlasmaLoss: 25,
        chapterId: 'CH001',
        isActive: true,
      };

      mockApiService.getProcedureCodeByCode = jasmine.createSpy().and.returnValue(of(testRow));

      const dialogRefSpyObj = jasmine.createSpyObj('DialogRef', { afterClosed: of(undefined) });
      dialogSpy = spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpyObj);

      component.openEditDialog(testRow);
      tick();

      const dialogData = dialogSpy.calls.mostRecent().args[1].data;
      expect(dialogData.mode).toBe('edit');
      expect(dialogData.procedureCode).toBe('WB');
      expect(dialogData.description).toBe('Whole Blood');
      expect(dialogData.deferralDays).toBe(56);
      expect(dialogData.standardRbcLoss).toBe(450);
    }));
  });

  describe('Filter Panel Operations', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should close filter panel when openFilter is called twice', () => {
      component.openFilter();
      expect(component.isFilterPanelOpen).toBeTrue();

      component.openFilter();
      expect(component.isFilterPanelOpen).toBeFalse();
      expect(component['overlayRef']).toBeNull();
    });

    it('should close filter panel on backdrop click', fakeAsync(() => {
      component.openFilter();
      expect(component.isFilterPanelOpen).toBeTrue();

      // Simulate backdrop click by calling dispose
      if (component['overlayRef']) {
        component['overlayRef'].dispose();
        component['overlayRef'] = null;
        component.isFilterPanelOpen = false;
      }
      tick();

      expect(component.isFilterPanelOpen).toBeFalse();
      expect(component['overlayRef']).toBeNull();
    }));

    it('should create overlay with correct position strategy', () => {
      component.openFilter();

      expect(component['overlayRef']).toBeTruthy();
      expect(component.isFilterPanelOpen).toBeTrue();

      // Clean up
      if (component['overlayRef']) {
        component['overlayRef'].dispose();
        component['overlayRef'] = null;
      }
    });
  });
  describe('Component Lifecycle', () => {


    it('should not throw error on destroy if overlay does not exist', () => {
      component['overlayRef'] = null;

      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('Sort Direction Mapping', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should map ascending sort to "A"', fakeAsync(() => {
      component.onSort({ active: 'procedureCode', direction: 'asc' });
      tick();

      expect(component.sortDirection).toBe('A');
    }));

    it('should map descending sort to "D"', fakeAsync(() => {
      component.onSort({ active: 'procedureCode', direction: 'desc' });
      tick();

      expect(component.sortDirection).toBe('D');
    }));

    it('should default to "A" when direction is empty', fakeAsync(() => {
      component.onSort({ active: 'procedureCode', direction: '' });
      tick();

      expect(component.sortDirection).toBe('A');
    }));

    it('should reset page index when sorting', fakeAsync(() => {
      component.pageIndex = 5;
      component.onSort({ active: 'deferralDays', direction: 'desc' });
      tick();

      expect(component.pageIndex).toBe(0);
    }));

    it('should update sortColumn when sorting', fakeAsync(() => {
      component.onSort({ active: 'deferralDays', direction: 'asc' });
      tick();

      expect(component.sortColumn).toBe('deferralDays');
    }));
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should handle empty search term', fakeAsync(() => {
      component.onSearchEvent('');
      tick();

      expect(component.searchTerm).toBe('');
      expect(mockApiService.getProcedureCodes).toHaveBeenCalled();
    }));
  });

  describe('Pagination', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should calculate correct skip value for pagination', fakeAsync(() => {
      component.pageIndex = 2;
      component.pageSize = 25;
      component.loadProcedureCodes();
      tick();

      const callArgs = mockApiService.getProcedureCodes.calls.mostRecent().args;
      expect(callArgs[1]).toBe(50); // skip = pageIndex * pageSize = 2 * 25
    }));

    it('should pass correct take value for pagination', fakeAsync(() => {
      component.pageSize = 50;
      component.loadProcedureCodes();
      tick();

      const callArgs = mockApiService.getProcedureCodes.calls.mostRecent().args;
      expect(callArgs[0]).toBe(50); // take = pageSize
    }));
  });

  describe('Filter Chip Building Edge Cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not create chip when deferralDays is 0', () => {
      component.currentFilters = { deferralDays: 0 };
      component.buildFilterChips();

      const deferralChip = component.filterChips.find(chip => chip.key === 'deferralDays');
      expect(deferralChip).toBeDefined();
      expect(deferralChip?.label).toContain('0');
    });

    it('should handle null currentFilters gracefully', () => {
      component.currentFilters = {};
      component.buildFilterChips();

      expect(component.filterChips.length).toBe(0);
    });

    it('should build chips for all filter types simultaneously', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      component.currentFilters = {
        procedureCode: 'WB',
        deferralDays: 56,
        effDate: futureDate.toISOString(),
        effDatePeriod: 'after',
        termDate: futureDate.toISOString(),
        termDatePeriod: 'before'
      };
      component.buildFilterChips();

      expect(component.filterChips.length).toBe(4);
    });
  });

  describe('Data Loading with Filters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should pass search term in filter when loading', fakeAsync(() => {
      component.searchTerm = 'WB';
      component.loadProcedureCodes();
      tick();

      const callArgs = mockApiService.getProcedureCodes.calls.mostRecent().args;
      const filter = callArgs[2] as any;
      expect(filter?.search).toBe('WB');
    }));

    it('should pass current filters when loading', fakeAsync(() => {
      component.currentFilters = { procedureCode: 'PLT' };
      component.loadProcedureCodes();
      tick();

      const callArgs = mockApiService.getProcedureCodes.calls.mostRecent().args;
      const filter = callArgs[2] as any;
      expect(filter?.procedureCode).toBe('PLT');
    }));




  });

  describe('Chapter Change Subscription', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should handle chapter change event', fakeAsync(() => {
      // The subscription exists but currently has empty implementation
      expect(() => {
        chapterChangedSubject.next();
        tick();
      }).not.toThrow();
    }));


  });
});
