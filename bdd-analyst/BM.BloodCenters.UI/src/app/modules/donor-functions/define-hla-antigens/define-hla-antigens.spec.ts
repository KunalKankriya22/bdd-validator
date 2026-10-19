import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { DefineHLAAntigensComponent } from './define-hla-antigens';
import { HlaAntigensService } from './services/hla-antigens.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { HlaAntigenModel, HlaAntigenFilterValue } from './models/hla-antigens.model';
import { createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('DefineHLAAntigensComponent', () => {
  let dialogRefSpy: any;
  let component: DefineHLAAntigensComponent;
  let fixture: ComponentFixture<DefineHLAAntigensComponent>;
  let serviceSpy: jasmine.SpyObj<HlaAntigensService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const mockAntigens: HlaAntigenModel[] = [
    {
      locus: 'A',
      locusDescription: 'HLA-A',
      epitopeId: '1',
      epitopeSuperI: null,
      effDate: '2024-01-01',
      termDate: null
    },
    {
      locus: 'B',
      locusDescription: 'HLA-B',
      epitopeId: '7',
      epitopeSuperI: '8',
      effDate: '2024-02-01',
      termDate: '2025-12-31'
    }
  ];

  const chapterChanged$ = new Subject<void>();

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('HlaAntigensService', [
      'getHlaAntigens',
      'getLocusCodes'
    ]);
    dialogSpy = createMockMatDialog();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({
        title: 'Define HLA Antigens',
        subtitle: 'Manage HLA antigen definitions'
      })
    });
    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });

    serviceSpy.getHlaAntigens.and.returnValue(
      of({ data: mockAntigens, total: 2 })
    );
    serviceSpy.getLocusCodes.and.returnValue(of([]));



      TestBed.configureTestingModule({
      imports: [
        DefineHLAAntigensComponent,
        MatDialogModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideNoopAnimations(),
        { provide: HlaAntigensService, useValue: serviceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: ActivatedRoute, useValue: {} }
      ]
    });
    fixture = TestBed.createComponent(DefineHLAAntigensComponent);
    component = fixture.componentInstance;


    });
  describe('Search Functionality', () => {
    it('should load data with search keyword', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onSearch('test');
      tick();

      expect(serviceSpy.getHlaAntigens).toHaveBeenCalledWith(
        25,
        0,
        jasmine.objectContaining({ searchKeyword: 'test' })
      );
    }));


  });
  describe('Filter Functionality', () => {


    it('should apply filters and load data', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const filters: HlaAntigenFilterValue = {
        antigen: '1',
        associatedAntigen: null,
        effectiveDatePeriod: 'After',
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.onApplyFilters(filters);
      tick();

      expect(component.appliedFilters).toEqual(filters);
      expect(component.isFilterOpen).toBe(false);
      expect(serviceSpy.getHlaAntigens).toHaveBeenCalled();
    }));






  });

  describe('Create Record', () => {


    it('should reload data after successful create', fakeAsync(() => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ action: 'save' }));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      fixture.detectChanges();
      tick();

      const initialCalls = serviceSpy.getHlaAntigens.calls.count();
      component.createRecord();
      tick();

      expect(serviceSpy.getHlaAntigens.calls.count()).toBe(initialCalls + 1);
    }));


  });

  describe('Chapter Change Handling', () => {
    it('should reset state and reload data on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.appliedFilters = {
        antigen: '1',
        associatedAntigen: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.filterChips = [{ key: 'antigen', label: 'Antigen: 1', value: '1' }];
      component.searchText = 'test';
      component.isFilterOpen = true;

      const initialCalls = serviceSpy.getHlaAntigens.calls.count();
      chapterChanged$.next();
      tick();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(component.searchText).toBe('');
      expect(component.isFilterOpen).toBe(false);
      expect(serviceSpy.getHlaAntigens.calls.count()).toBe(initialCalls + 1);
    }));
  });

  describe('Date Formatting', () => {
    it('should format date as DD-MON-YYYY', () => {
      const formatted = component['formatDate']('2024-01-15');
      expect(formatted).toBe('15-JAN-2024');
    });




  });

  describe('Table Configuration', () => {
    it('should have correct column definitions', () => {
      expect(component.tableConfig.columns.length).toBe(6);
      expect(component.tableConfig.columns[0].key).toBe('locus');
      expect(component.tableConfig.columns[1].key).toBe('locusDescription');
      expect(component.tableConfig.columns[2].key).toBe('epitopeId');
      expect(component.tableConfig.columns[3].key).toBe('epitopeSuperI');
      expect(component.tableConfig.columns[4].key).toBe('effDate');
      expect(component.tableConfig.columns[5].key).toBe('termDate');
    });



    it('should have sticky actions column', () => {
      expect(component.tableConfig.stickyActionsColumn).toBe(true);
    });
  });

  describe('Pagination', () => {
    it('should update page config and reload', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onPageChange({ pageIndex: 2, pageSize: 50, previousPageIndex: 1 });
      tick();

      expect(component.tableConfig.pagination?.pageIndex).toBe(2);
      expect(component.tableConfig.pagination?.pageSize).toBe(50);
      expect(serviceSpy.getHlaAntigens).toHaveBeenCalled();
    }));
  });

  describe('Sort Functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set ascending sort and reload', () => {
      component.onSortChange({ column: 'locus', direction: 'A' });
      expect(component.requestState.sortOrder).toBe('ASC');
      expect(component.requestState.sortColumn).toBe('locus');
    });

    it('should set descending sort and reload', () => {
      component.onSortChange({ column: 'locus', direction: 'D' });
      expect(component.requestState.sortOrder).toBe('DESC');
    });

    it('should clear sort for default direction', () => {
      component.requestState.sortOrder = 'ASC';
      component.requestState.sortColumn = 'locus';
      component.onSortChange({ column: 'locus', direction: 'default' });
      expect(component.requestState.sortOrder).toBeUndefined();
      expect(component.requestState.sortColumn).toBeUndefined();
    });
  });

  describe('Filter Toggle', () => {
    it('should toggle filter open state', () => {
      expect(component.isFilterOpen).toBeFalse();
      component.toggleFilter();
      expect(component.isFilterOpen).toBeTrue();
      component.toggleFilter();
      expect(component.isFilterOpen).toBeFalse();
    });
  });

  describe('Clear All Filters', () => {
    it('should clear filters and preserve search keyword', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.requestState.searchKeyword = 'test';
      component.appliedFilters = { antigen: '1', associatedAntigen: null, effectiveDatePeriod: null, effectiveDate: null, terminationDatePeriod: null, terminationDate: null };
      component.filterChips = [{ key: 'antigen', label: 'Antigen: 1', value: '1' }];

      component.onClearAllFilters();
      tick();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(component.requestState.searchKeyword).toBe('test');
      expect(serviceSpy.getHlaAntigens).toHaveBeenCalled();
    }));
  });

  describe('Remove Filter Chip', () => {
    it('should remove chip and reload', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.appliedFilters = { antigen: '1', associatedAntigen: null, effectiveDatePeriod: null, effectiveDate: null, terminationDatePeriod: null, terminationDate: null };
      component.filterChips = [{ key: 'antigen', label: 'Antigen: 1', value: '1' }];

      component.onRemoveFilterChip('antigen');
      tick();

      expect(serviceSpy.getHlaAntigens).toHaveBeenCalled();
    }));
  });

  describe('isSearchAndFilterDisabled', () => {
    it('should be true when loading', () => {
      component.isLoading = true;
      expect(component.isSearchAndFilterDisabled).toBeTrue();
    });

    it('should be true when has error', () => {
      component.hasError = true;
      expect(component.isSearchAndFilterDisabled).toBeTrue();
    });

    it('should be false normally', () => {
      component.isLoading = false;
      component.hasError = false;
      expect(component.isSearchAndFilterDisabled).toBeFalse();
    });
  });

  describe('Load Data Error', () => {
    it('should set hasError on API failure', fakeAsync(() => {
      serviceSpy.getHlaAntigens.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      tick();

      expect(component.hasError).toBeTrue();
      expect(component.isLoading).toBeFalse();
    }));
  });

  describe('Create Record edge cases', () => {
    it('should not open dialog if already open', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.isDialogOpen = true;

      component.createRecord();

      expect(dialogSpy.open).not.toHaveBeenCalled();
    }));

    it('should not reload when dialog cancelled', fakeAsync(() => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ action: 'cancel' }));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      fixture.detectChanges();
      tick();
      const callsBefore = serviceSpy.getHlaAntigens.calls.count();

      component.createRecord();
      tick();

      expect(serviceSpy.getHlaAntigens.calls.count()).toBe(callsBefore);
      expect(component.isDialogOpen).toBeFalse();
    }));
  });

  describe('Format Date', () => {
    it('should return dash for null', () => {
      expect(component['formatDate'](null)).toBe('-');
    });

    it('should return dash for undefined', () => {
      expect(component['formatDate'](undefined)).toBe('-');
    });
  });

  describe('Column value formatters', () => {
    it('epitopeSuperI formatter returns dash for null', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'epitopeSuperI');
      expect(col?.valueFormatter?.(null, mockAntigens[0])).toBe('-');
    });

    it('epitopeSuperI formatter returns value when present', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'epitopeSuperI');
      expect(col?.valueFormatter?.('8', mockAntigens[1])).toBe('8');
    });

    it('effDate formatter returns formatted date', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'effDate');
      const result = col?.valueFormatter?.('2024-01-15', mockAntigens[0]);
      expect(result).toBe('15-JAN-2024');
    });

    it('termDate formatter returns dash for null', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'termDate');
      expect(col?.valueFormatter?.(null, mockAntigens[0])).toBe('-');
    });
  });
});
