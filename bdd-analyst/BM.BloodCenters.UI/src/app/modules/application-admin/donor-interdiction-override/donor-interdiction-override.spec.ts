import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { Overlay } from '@angular/cdk/overlay';
import { of, Subject, throwError } from 'rxjs';

import { TranslateModule } from '@ngx-translate/core';

import { DonorInterdictionOverrideComponent, getDonorInterdictionOverridePaginatorIntl } from './donor-interdiction-override';
import { DonorInterdictionOverrideService } from './services/donor-interdiction-override.service';
import {
  DonorInterdictionOverrideModel,
  DonorInterdictionOverrideFilterValue
} from './models/donor-interdiction-override.model';
import {
  createMockHeaderService,
  createMockPageHeaderService
} from '@shared/testing/common-mocks';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';

describe('DonorInterdictionOverrideComponent', () => {
  let component: DonorInterdictionOverrideComponent;
  let fixture: ComponentFixture<DonorInterdictionOverrideComponent>;
  let service: jasmine.SpyObj<DonorInterdictionOverrideService>;
  let mockHeaderService: any;
  let chapterChanged$: Subject<void>;

  const mockTableData: DonorInterdictionOverrideModel[] = [
    {
      donorDecisionCode: 'ACC',
      decisionDesc: 'Acceptable',
      productType: 'RBC',
      productTypeDesc: 'Red Blood Cells',
      attributeGroup: 'GRP1',
      attributeCode: 'ATTR1',
      interCode: 'HIV',
      interDesc: 'HIV Positive',
      interType: 'P',
      overrideDesc: 'Override description',
      effDate: new Date('2024-01-15'),
      termDate: null
    },
    {
      donorDecisionCode: 'DEF',
      decisionDesc: 'Deferred',
      productType: 'PLT',
      productTypeDesc: 'Platelets',
      attributeGroup: 'GRP2',
      attributeCode: 'ATTR2',
      interCode: 'HBV',
      interDesc: 'Hepatitis B',
      interType: 'T',
      overrideDesc: 'Temporary override',
      effDate: new Date('2025-02-01'),
      termDate: new Date('2025-12-31')
    }
  ];

  const mockApiResponse = { data: mockTableData, totalRecords: 2 };

  beforeEach(() => {
    chapterChanged$ = new Subject<void>();

    service = jasmine.createSpyObj('DonorInterdictionOverrideService', [
      'getDonorInterdictionOverrides',
      'getDropdowns',
      'createOverride',
      'updateOverride'
    ]);
    service.getDonorInterdictionOverrides.and.returnValue(of(mockApiResponse));

    mockHeaderService = createMockHeaderService({
      chapterChanged$: chapterChanged$.asObservable()
    });

    const mockPageHeaderService = createMockPageHeaderService();

    TestBed.configureTestingModule({
      imports: [
        DonorInterdictionOverrideComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: DonorInterdictionOverrideService, useValue: service },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService }
      ]
    });

    fixture = TestBed.createComponent(DonorInterdictionOverrideComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set initial sort to ASC and call loadData', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.requestState.sort).toBe('ASC');
      expect(service.getDonorInterdictionOverrides).toHaveBeenCalled();
    }));

    it('should reload data when chapter changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      service.getDonorInterdictionOverrides.calls.reset();
      chapterChanged$.next();
      tick();

      expect(service.getDonorInterdictionOverrides).toHaveBeenCalledTimes(1);
    }));

    it('should reset page index to 0 on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.tableConfig.pagination!.pageIndex = 3;
      chapterChanged$.next();

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    }));
  });

  describe('loadData', () => {
    it('should populate dataSource and totalRecords on success', (done) => {
      component.loadData();

      // Allow the observable to complete
      setTimeout(() => {
        expect(component.dataSource).toEqual(mockTableData);
        expect(component.tableConfig.pagination!.totalRecords).toBe(2);
        expect(component.isLoading).toBe(false);
        done();
      });
    });

    it('should set hasError on API failure', (done) => {
      service.getDonorInterdictionOverrides.and.returnValue(
        throwError(() => new Error('Server error'))
      );

      component.loadData();

      setTimeout(() => {
        expect(component.hasError).toBe(true);
        expect(component.isLoading).toBe(false);
        expect(component.errorMessage).toContain('Failed to load');
        done();
      });
    });

    it('should calculate skip from pageIndex and pageSize', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 25;

      component.loadData();
      tick();

      expect(service.getDonorInterdictionOverrides).toHaveBeenCalledWith(
        25, // take
        50, // skip = 2 * 25
        component.requestState
      );
    }));
  });

  describe('onSearchEvent', () => {
    it('should set searchKeyword, reset page, and call loadData', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      service.getDonorInterdictionOverrides.calls.reset();

      component.tableConfig.pagination!.pageIndex = 3;
      component.onSearchEvent('HIV');
      tick();

      expect(component.requestState.searchKeyword).toBe('HIV');
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
      expect(service.getDonorInterdictionOverrides).toHaveBeenCalledTimes(1);
    }));

    it('should clear searchKeyword when text is empty', fakeAsync(() => {
      component.requestState.searchKeyword = 'HIV';
      component.onSearchEvent('');
      tick();

      expect(component.requestState.searchKeyword).toBeUndefined();
    }));

    it('should trim whitespace from search text', fakeAsync(() => {
      component.onSearchEvent('  HIV  ');
      tick();

      expect(component.requestState.searchKeyword).toBe('HIV');
    }));
  });

  describe('onPageChange', () => {
    it('should update pagination and call loadData', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      service.getDonorInterdictionOverrides.calls.reset();

      component.onPageChange({ pageIndex: 2, pageSize: 50 } as any);
      tick();

      expect(component.tableConfig.pagination!.pageIndex).toBe(2);
      expect(component.tableConfig.pagination!.pageSize).toBe(50);
      expect(service.getDonorInterdictionOverrides).toHaveBeenCalledTimes(1);
    }));
  });

  describe('onSortChange', () => {
    it('should set sort to ASC when direction is A', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Start from 'default' so the interceptor does not trigger
      component.tableConfig.sortConfig!.column = 'interCode';
      component.tableConfig.sortConfig!.direction = 'default';

      component.onSortChange({ column: 'donorDecisionCode', direction: 'A' });

      expect(component.requestState.sort).toBe('ASC');
      expect(component.tableConfig.sortConfig!.column).toBe('donorDecisionCode');
    }));

    it('should set sort to DESC when direction is D', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.tableConfig.sortConfig!.column = 'donorDecisionCode';
      component.tableConfig.sortConfig!.direction = 'A';

      component.onSortChange({ column: 'donorDecisionCode', direction: 'D' });

      expect(component.requestState.sort).toBe('DESC');
    }));

    it('should cycle to default (clear sort) when D -> A on same column', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Simulate the 3-state cycle: currently at D, shared component sends A
      component.tableConfig.sortConfig!.column = 'donorDecisionCode';
      component.tableConfig.sortConfig!.direction = 'D';

      component.onSortChange({ column: 'donorDecisionCode', direction: 'A' });

      expect(component.tableConfig.sortConfig!.direction).toBe('default');
      expect(component.requestState.sort).toBeUndefined();
    }));
  });

  describe('onRowAction', () => {
    it('should open edit side panel for edit action', () => {
      const record = mockTableData[0];
      component.onRowAction({ action: 'edit', row: record } as any);

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(record);
      expect(component.sidePanelOpen).toBe(true);
    });
  });

  describe('createRecord', () => {
    it('should set side panel to add mode with null data', () => {
      component.createRecord();

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelOpen).toBe(true);
    });
  });

  describe('editRecord', () => {
    it('should set side panel to edit mode with the record', () => {
      const record = mockTableData[1];
      component.editRecord(record);

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(record);
      expect(component.sidePanelOpen).toBe(true);
    });
  });

  describe('closeSidePanel', () => {
    it('should reset sidePanelOpen and sidePanelData', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockTableData[0];

      component.closeSidePanel();

      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('onSaveSuccess', () => {
    it('should reload data', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      service.getDonorInterdictionOverrides.calls.reset();

      component.onSaveSuccess();
      tick();

      expect(service.getDonorInterdictionOverrides).toHaveBeenCalledTimes(1);
    }));
  });

  describe('onModeChange', () => {
    it('should update sidePanelMode', () => {
      component.onModeChange('edit');
      expect(component.sidePanelMode).toBe('edit');
    });

    it('should clear data when switching to add mode', () => {
      component.sidePanelData = mockTableData[0];
      component.onModeChange('add');

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should retain data when switching to edit mode', () => {
      component.sidePanelData = mockTableData[0];
      component.onModeChange('edit');

      expect(component.sidePanelData).toBe(mockTableData[0]);
    });
  });

  describe('applyFilters', () => {
    it('should set appliedFilters, reset page, and reload', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      service.getDonorInterdictionOverrides.calls.reset();

      const filters: DonorInterdictionOverrideFilterValue = {
        donorDecisionCode: 'ACC',
        donorDecisionCodeDisplay: null,
        interType: 'P',
        interTypeDisplay: null,
        effectiveDatePeriod: 'before',
        effectiveDate: '2025-06-01',
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.tableConfig.pagination!.pageIndex = 5;
      component.applyFilters(filters);
      tick();

      expect(component.appliedFilters).toBe(filters);
      expect(component.requestState.donorDecisionCode).toBe('ACC');
      expect(component.requestState.interType).toBe('P');
      expect(component.requestState.effectiveDateBefore).toBe('2025-06-01');
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
      expect(service.getDonorInterdictionOverrides).toHaveBeenCalledTimes(1);
    }));
  });

  describe('clearAllFilters', () => {
    it('should clear all filter-related request state fields and reload', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.requestState.donorDecisionCode = 'ACC';
      component.requestState.interType = 'P';
      component.requestState.searchKeyword = 'HIV';
      component.appliedFilters = {
        donorDecisionCode: 'ACC',
        donorDecisionCodeDisplay: null,
        interType: 'P',
        interTypeDisplay: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      service.getDonorInterdictionOverrides.calls.reset();
      component.clearAllFilters();
      tick();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.requestState.donorDecisionCode).toBeUndefined();
      expect(component.requestState.interType).toBeUndefined();
      // searchKeyword should be preserved (it is not a filter)
      expect(component.requestState.searchKeyword).toBe('HIV');
      expect(service.getDonorInterdictionOverrides).toHaveBeenCalledTimes(1);
    }));
  });

  describe('handleKeyboardShortcut', () => {
    it('should call createRecord on Alt+C', () => {
      spyOn(component, 'createRecord');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });
      component.handleKeyboardShortcut(event);

      expect(component.createRecord).toHaveBeenCalled();
    });

    it('should close side panel on Escape', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockTableData[0];

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.handleKeyboardShortcut(event);

      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('getDonorInterdictionOverridePaginatorIntl', () => {
    it('should return MatPaginatorIntl with "Rows per page:" label', () => {
      const intl = getDonorInterdictionOverridePaginatorIntl();
      expect(intl.itemsPerPageLabel).toBe('Rows per page:');
    });
  });

  describe('ngOnDestroy', () => {
    it('should not throw when overlayRef is null', () => {
      (component as any).overlayRef = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
