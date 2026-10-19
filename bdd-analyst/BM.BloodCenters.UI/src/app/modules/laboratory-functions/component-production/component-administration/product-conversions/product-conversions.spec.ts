import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { ProductConversionsComponent, getProductConversionsPaginatorIntl } from './product-conversions';
import { ProductConversionsService } from './services/product-conversions.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('ProductConversionsComponent', () => {
  let mockPageHeaderService: any;
  let component: ProductConversionsComponent;
  let fixture: ComponentFixture<ProductConversionsComponent>;
  let mockService: jasmine.SpyObj<ProductConversionsService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let chapterSubject: Subject<void>;

  const mockData = [
    {
      sourceProductCode: '00150',
      sourceProductDesc: 'CPD Whole Blood',
      targetProductCode: '04900',
      targetProductDesc: 'Red Blood Cells Washed',
      effDate: '2025-06-09',
      termDate: null,
      lastModifiedDate: '2025-01-30T08:32:00',
      programId: 'VPRODCON',
    },
  ];

  beforeEach(() => {

    chapterSubject = new Subject<void>();

    mockService = jasmine.createSpyObj('ProductConversionsService', [
      'getProductConversions',
      'getSourceProducts',
      'getTargetProducts',
      'createProductConversion',
      'updateProductConversion',
    ]);
    mockService.getProductConversions.and.returnValue(of({ data: mockData, totalRecords: 1 }));

    mockHeaderService = createMockHeaderService({ chapterChanged$: chapterSubject.asObservable() });
    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: signal({ title: 'Product Conversions (ISBT \'SP\'/Codabar)', subtitle: '' }),
    });
    mockPageHeaderService.getTitle.and.returnValue('Product Conversions');
    mockPageHeaderService.getSubtitle.and.returnValue('');



      TestBed.configureTestingModule({
      imports: [
        ProductConversionsComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ProductConversionsService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
      ],
    });




      mockService.getProductConversions.calls.reset();
      mockService.getSourceProducts.calls.reset();
      mockService.getTargetProducts.calls.reset();
      mockService.createProductConversion.calls.reset();
      mockService.updateProductConversion.calls.reset();
      mockPageHeaderService.getTitle.calls.reset();
      mockPageHeaderService.getSubtitle.calls.reset();

      mockService.getProductConversions.and.returnValue(of({ data: mockData, totalRecords: 1 }));
      mockPageHeaderService.getTitle.and.returnValue('Product Conversions');
      mockPageHeaderService.getSubtitle.and.returnValue('');

    fixture = TestBed.createComponent(ProductConversionsComponent);
    component = fixture.componentInstance;
    });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('getProductConversionsPaginatorIntl', () => {
    it('should return a MatPaginatorIntl with custom itemsPerPageLabel', () => {
      const intl = getProductConversionsPaginatorIntl();
      expect(intl.itemsPerPageLabel).toBe('Rows per page:');
    });
  });

  describe('initialization', () => {
    it('should initialize headerConfig with breadcrumbs and actions', () => {
      expect(component.headerConfig.breadcrumbs.length).toBeGreaterThanOrEqual(1);
      expect(component.headerConfig.breadcrumbs[0]).toEqual({ label: 'Home', link: '/home' });
      expect(component.headerConfig.actions!.length).toBe(1);
      expect(component.headerConfig.actions![0].label).toBe('ADD NEW');
    });

    it('should initialize tableConfig with columns and row actions', () => {
      expect(component.tableConfig.columns.length).toBe(6);
      expect(component.tableConfig.columns[0].key).toBe('sourceProductCode');
      expect(component.tableConfig.columns[1].key).toBe('sourceProductDesc');
      expect(component.tableConfig.columns[2].key).toBe('targetProductCode');
      expect(component.tableConfig.columns[3].key).toBe('targetProductDesc');
      expect(component.tableConfig.columns[4].key).toBe('effDate');
      expect(component.tableConfig.columns[5].key).toBe('termDate');
      expect(component.tableConfig.rowActions!.length).toBe(1);
      expect(component.tableConfig.rowActions![0].action).toBe('edit');
    });

    it('should initialize pagination with default values', () => {
      expect(component.tableConfig.pagination!.pageSize).toBe(25);
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
      expect(component.tableConfig.pagination!.totalRecords).toBe(0);
      expect(component.tableConfig.pagination!.pageSizeOptions).toEqual([10, 25, 50, 100]);
    });

    it('should initialize sort config with default values', () => {
      expect(component.tableConfig.sortConfig!.column).toBe('sourceProductCode');
      expect(component.tableConfig.sortConfig!.direction).toBe('default');
    });

    it('should initialize searchConfig with expected placeholder', () => {
      expect(component.searchConfig.placeholder).toBe(
        'Search by Source Code, Source Description, Target Code or Target Description'
      );
      expect(component.searchConfig.minLength).toBe(2);
      expect(component.searchConfig.searchOnEnterOnly).toBeTrue();
    });

    it('should initialize default state values', () => {
      expect(component.isLoading).toBeFalse();
      expect(component.hasError).toBeFalse();
      expect(component.errorMessage).toBe('');
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should have termDate column valueFormatter return -- for null', () => {
      const termDateCol = component.tableConfig.columns.find(c => c.key === 'termDate');
      expect(termDateCol).toBeTruthy();
      expect(termDateCol!.valueFormatter!(null as any, {} as any)).toBe('--');
    });

    it('should have termDate column valueFormatter format non-null values', () => {
      const termDateCol = component.tableConfig.columns.find(c => c.key === 'termDate');
      expect(termDateCol).toBeTruthy();
      const result = termDateCol!.valueFormatter!('2025-06-09', {} as any);
      expect(result).toBeTruthy();
      expect(result).not.toBe('--');
    });

    it('should have effDate column with valueFormatter', () => {
      const effDateCol = component.tableConfig.columns.find(c => c.key === 'effDate');
      expect(effDateCol).toBeTruthy();
      expect(effDateCol!.valueFormatter).toBeDefined();
      const result = effDateCol!.valueFormatter!('2025-06-09', {} as any);
      expect(result).toBeTruthy();
    });

    it('should call createRecord when header ADD NEW action is clicked', () => {
      spyOn(component, 'createRecord');
      component.headerConfig.actions![0].onClick();
      expect(component.createRecord).toHaveBeenCalled();
    });
  });

  describe('ngOnInit', () => {
    it('should call loadData on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(mockService.getProductConversions).toHaveBeenCalled();
    }));

    it('should set isLoading to false after data loads', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.isLoading).toBeFalse();
    }));

    it('should populate dataSource after successful load', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.dataSource).toEqual(mockData as any);
    }));

    it('should set totalRecords after successful load', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.tableConfig.pagination!.totalRecords).toBe(1);
    }));
  });

  describe('loadData', () => {
    it('should set isLoading to true and hasError to false when loading starts', () => {
      mockService.getProductConversions.and.returnValue(new Subject().asObservable() as any);
      component.loadData();
      expect(component.isLoading).toBeTrue();
      expect(component.hasError).toBeFalse();
    });

    it('should call service with correct page number and page size', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 50;
      component.loadData();
      tick();
      expect(mockService.getProductConversions).toHaveBeenCalledWith(3, 50, component.requestState);
    }));

    it('should use default page number 1 when pageIndex is 0', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 0;
      component.tableConfig.pagination!.pageSize = 25;
      component.loadData();
      tick();
      expect(mockService.getProductConversions).toHaveBeenCalledWith(1, 25, component.requestState);
    }));

    it('should handle error response', fakeAsync(() => {
      mockService.getProductConversions.and.returnValue(throwError(() => new Error('Server error')));
      component.loadData();
      tick();
      expect(component.hasError).toBeTrue();
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('Failed to load product conversions. Please try again.');
    }));

    it('should pass requestState to service call', fakeAsync(() => {
      component.requestState = { searchKeyword: 'test', sortColumn: 'sourceProductCode', sortOrder: 'asc' };
      component.loadData();
      tick();
      expect(mockService.getProductConversions).toHaveBeenCalledWith(
        1, 25, { searchKeyword: 'test', sortColumn: 'sourceProductCode', sortOrder: 'asc' }
      );
    }));
  });

  describe('onSearch', () => {
    it('should set searchKeyword and reload data', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      mockService.getProductConversions.calls.reset();

      component.onSearch('blood');
      tick();

      expect(component.requestState.searchKeyword).toBe('blood');
      expect(mockService.getProductConversions).toHaveBeenCalled();
    }));

    it('should set searchKeyword to null when search text is empty', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      mockService.getProductConversions.calls.reset();

      component.onSearch('');
      tick();

      expect(component.requestState.searchKeyword).toBeNull();
      expect(mockService.getProductConversions).toHaveBeenCalled();
    }));

    it('should reset pageIndex to 0', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.tableConfig.pagination!.pageIndex = 3;
      component.onSearch('test');
      tick();

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    }));
  });

  describe('onPageChange', () => {
    it('should update pagination and reload data', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      mockService.getProductConversions.calls.reset();

      component.onPageChange({ pageIndex: 2, pageSize: 50 } as any);
      tick();

      expect(component.tableConfig.pagination!.pageIndex).toBe(2);
      expect(component.tableConfig.pagination!.pageSize).toBe(50);
      expect(mockService.getProductConversions).toHaveBeenCalledWith(3, 50, component.requestState);
    }));
  });

  describe('onSortChange', () => {
    it('should update sort config and request state', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      mockService.getProductConversions.calls.reset();

      component.onSortChange({ column: 'targetProductCode', direction: 'asc' } as any);
      tick();

      expect(component.tableConfig.sortConfig!.column).toBe('targetProductCode');
      expect(component.tableConfig.sortConfig!.direction).toBe('asc');
      expect(component.requestState.sortColumn).toBe('targetProductCode');
      expect(component.requestState.sortOrder).toBe('asc');
      expect(mockService.getProductConversions).toHaveBeenCalled();
    }));

    it('should set sortOrder to null when direction is default', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onSortChange({ column: 'sourceProductCode', direction: 'default' } as any);
      tick();

      expect(component.requestState.sortOrder).toBeNull();
    }));

    it('should set sortOrder to desc when direction is desc', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onSortChange({ column: 'effDate', direction: 'desc' } as any);
      tick();

      expect(component.requestState.sortOrder).toBe('desc');
    }));
  });

  describe('onRowAction', () => {
    it('should handle row action for edit', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const row = mockData[0] as any;
      component.onRowAction({ action: 'edit', row } as any);

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
    }));

    it('should set activeRow on dataTableComponent when available', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const row = mockData[0] as any;
      const mockDataTable = { activeRow: null } as any;
      component.dataTableComponent = mockDataTable;
      component.onRowAction({ action: 'edit', row } as any);

      expect(mockDataTable.activeRow).toBe(row);
    }));

    it('should not set activeRow when dataTableComponent is undefined', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).dataTableComponent = undefined;
      const row = mockData[0] as any;

      expect(() => {
        component.onRowAction({ action: 'edit', row } as any);
      }).not.toThrow();
    }));

    it('should not open side panel for non-edit actions', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.sidePanelOpen = false;
      const row = mockData[0] as any;
      component.onRowAction({ action: 'delete', row } as any);

      expect(component.sidePanelOpen).toBeFalse();
    }));
  });

  describe('createRecord', () => {
    it('should open side panel in add mode', () => {
      component.sidePanelOpen = false;
      component.createRecord();

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelOpen).toBeTrue();
    });

    it('should clear any existing sidePanelData', () => {
      component.sidePanelData = mockData[0] as any;
      component.createRecord();

      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('editRecord', () => {
    it('should open side panel in edit mode with the record', () => {
      const record = mockData[0] as any;
      component.editRecord(record);

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(record);
      expect(component.sidePanelOpen).toBeTrue();
    });
  });

  describe('closeSidePanel', () => {
    it('should close side panel and clear data', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockData[0] as any;

      component.closeSidePanel();

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('onSaveSuccess', () => {
    it('should reload data', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      mockService.getProductConversions.calls.reset();

      component.onSaveSuccess();
      tick();

      expect(mockService.getProductConversions).toHaveBeenCalled();
    }));
  });

  describe('onModeChange', () => {
    it('should handle mode change to add', () => {
      component.sidePanelData = mockData[0] as any;
      component.onModeChange('add');

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should handle mode change to edit without clearing data', () => {
      component.sidePanelData = mockData[0] as any;
      component.onModeChange('edit');

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockData[0] as any);
    });
  });

  describe('handleKeyboardShortcut', () => {
    it('should call createRecord on Alt+C', () => {
      spyOn(component, 'createRecord');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.createRecord).toHaveBeenCalled();
    });

    it('should call createRecord on Alt+C (uppercase)', () => {
      spyOn(component, 'createRecord');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'C' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.createRecord).toHaveBeenCalled();
    });

    it('should close side panel on Escape when panel is open', () => {
      component.sidePanelOpen = true;
      spyOn(component, 'closeSidePanel');
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.closeSidePanel).toHaveBeenCalled();
    });

    it('should not close side panel on Escape when panel is closed', () => {
      component.sidePanelOpen = false;
      spyOn(component, 'closeSidePanel');
      const event = new KeyboardEvent('keydown', { key: 'Escape' });

      component.handleKeyboardShortcut(event);

      expect(component.closeSidePanel).not.toHaveBeenCalled();
    });

    it('should not react to other keys', () => {
      spyOn(component, 'createRecord');
      spyOn(component, 'closeSidePanel');
      const event = new KeyboardEvent('keydown', { key: 'a' });

      component.handleKeyboardShortcut(event);

      expect(component.createRecord).not.toHaveBeenCalled();
      expect(component.closeSidePanel).not.toHaveBeenCalled();
    });

    it('should not call createRecord when Alt is not held with C', () => {
      spyOn(component, 'createRecord');
      const event = new KeyboardEvent('keydown', { key: 'c', altKey: false });

      component.handleKeyboardShortcut(event);

      expect(component.createRecord).not.toHaveBeenCalled();
    });
  });

  describe('subscribeToChapterChanges', () => {
    it('should reload data when chapter changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      mockService.getProductConversions.calls.reset();

      chapterSubject.next();
      tick();

      expect(mockService.getProductConversions).toHaveBeenCalled();
    }));
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy subject and unsubscribe', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      mockService.getProductConversions.calls.reset();

      component.ngOnDestroy();

      // After destroy, chapter changes should not trigger loadData
      chapterSubject.next();
      tick();

      expect(mockService.getProductConversions).not.toHaveBeenCalled();
    }));
  });

  describe('effect for pageHeaderData', () => {
    it('should update headerConfig when pageHeaderData signal changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.headerConfig.title).toBe('Product Conversions (ISBT \'SP\'/Codabar)');
      expect(component.headerConfig.breadcrumbs.length).toBe(2);
      expect(component.headerConfig.breadcrumbs[1].label).toBe('Product Conversions (ISBT \'SP\'/Codabar)');
    }));
  });
});
