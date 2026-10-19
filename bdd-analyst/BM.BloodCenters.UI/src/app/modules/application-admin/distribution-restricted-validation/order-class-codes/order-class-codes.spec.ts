import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { OrderClassCodesComponent } from './order-class-codes';
import { OrderClassCodesService } from './services/order-class-codes.service';
import { OrderClassCodesModel } from './models/order-class-codes.model';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockTranslateService } from '@shared/testing/common-mocks';

describe('OrderClassCodesComponent', () => {
  let component: OrderClassCodesComponent;
  let fixture: ComponentFixture<OrderClassCodesComponent>;
  let mockService: jasmine.SpyObj<OrderClassCodesService>;
  let mockHeaderService: any;
  let mockPageHeaderService: any;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  const mockData: OrderClassCodesModel[] = [
    {
      orderClass: 'AD',
      chapterId: 'DAL',
      description: 'After Processing',
      priority: 11,
      hours: 12,
      displayFlag: 'Y',
      effectiveDate: new Date('2026-12-04T00:00:00'),
      terminationDate: new Date('2026-12-18T11:11:49.570Z'),
      editable: true
    }
  ];

  beforeEach(() => {
    mockService = jasmine.createSpyObj('OrderClassCodesService', ['getOrderClassCodes']);

    // Mock HeaderService with signal support
    mockHeaderService = {
      chapterId: signal('DAL'),
      headerConfig: signal({ title: 'Test', subtitle: 'Test' }),
      databasePrefix: signal('TEST'),
      databaseName: signal('testdb'),
      chapterPrintHdr: signal('Test Chapter'),
      warehouseId: signal('WH01'),
      warehouseName: signal('Test Warehouse'),
      chapterName: signal('Test Chapter Name')
    };

    // Mock TranslateService
    mockTranslateService = createMockTranslateService();

    // Mock PageHeaderService with signal support
    mockPageHeaderService = {
      pageHeaderData: signal<{ title: string; subtitle: string } | null>(null)
    };

    mockService.getOrderClassCodes.and.returnValue(
      of({ data: mockData, totalRecords: mockData.length })
    );

    TestBed.configureTestingModule({
      imports: [OrderClassCodesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: OrderClassCodesService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: TranslateService, useValue: mockTranslateService }
      ]
    });

    mockService.getOrderClassCodes.calls.reset();

    fixture = TestBed.createComponent(OrderClassCodesComponent);
    component = fixture.componentInstance;
  });

  it('should load data when chapterId is available via effect', fakeAsync(() => {
    // The effect in constructor will trigger loadData when chapterId signal has value
    fixture.detectChanges(); // Trigger effect
    tick(); // Wait for async operations to complete

    expect(mockService.getOrderClassCodes).toHaveBeenCalledWith(25, 0, component.requestState);
    expect(component.dataSource).toEqual(mockData);
    expect(component.tableConfig.pagination?.totalRecords).toBe(1);
  }));

  it('should set error state when loadData fails', () => {
    mockService.getOrderClassCodes.and.returnValue(throwError(() => ({ status: 500 })));

    component.loadData();

    expect(component.hasError).toBe(true);
    expect(component.isLoading).toBe(false);
    expect(component.errorMessage).toContain('Failed to load order class data');
  });

  describe('Sort Behavior', () => {
    it('should not pass default sort parameter on initial load', () => {
      expect(component.requestState.sort).toBeUndefined();
      expect(component.requestState.prioritySort).toBeUndefined();
    });

    it('should sort only for orderClass and priority columns', () => {
      // Attempt to sort by description column (not allowed)
      component.onSortChange({ column: 'description', direction: 'A' });

      // Should remain unchanged
      expect(component.requestState.sort).toBeUndefined();
      expect(component.requestState.prioritySort).toBeUndefined();

      // Now sort by priority (allowed)
      component.onSortChange({ column: 'priority', direction: 'A' });

      expect(component.tableConfig.sortConfig?.column).toBe('priority');
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
      expect(component.requestState.prioritySort).toBe('A');
      expect(component.requestState.sort).toBeUndefined();
    });

    it('should clear orderClass sort when switching to priority sort', () => {
      component.onSortChange({ column: 'orderClass', direction: 'A' });
      expect(component.requestState.sort).toBe('A');

      component.onSortChange({ column: 'priority', direction: 'D' });
      expect(component.requestState.sort).toBeUndefined();
      expect(component.requestState.prioritySort).toBe('D');
    });
  });

  describe('Row Highlighting', () => {
    it('should set editingRow to original row reference when editing', () => {
      const row = mockData[0];
      component.editRecord(row);

      expect(component.editingRow).toBe(row);
    });

    it('should clear editingRow when closing side panel', () => {
      component.editRecord(mockData[0]);
      expect(component.editingRow).not.toBeNull();

      component.closeSidePanel();

      expect(component.editingRow).toBeNull();
    });

    it('should clear editingRow when creating a new record', () => {
      component.editRecord(mockData[0]);
      expect(component.editingRow).not.toBeNull();

      component.createRecord();

      expect(component.editingRow).toBeNull();
    });
  });

  it('should normalize selected record when editing', () => {
    const row: OrderClassCodesModel = {
      orderClass: 'AD',
      description: 'After Processing',
      displayFlag: undefined,
      priority: undefined,
      hours: undefined,
      effectiveDate: null,
      terminationDate: undefined,
      modificationDate: new Date('2026-12-18T11:11:49.570Z'),
      editable: true
    };

    component.editRecord(row);

    expect(component.sidePanelMode).toBe('edit');
    expect(component.sidePanelOpen).toBe(true);
    expect(component.sidePanelData?.orderClass).toBe('AD');
    expect(component.sidePanelData?.displayFlag).toBe('N');
    expect(component.sidePanelData?.priority).toBe(0);
    expect(component.sidePanelData?.hours).toBe(0);
    expect(component.sidePanelData?.terminationDate).toBeNull();
  });

  it('should open add mode on createRecord', () => {
    component.createRecord();

    expect(component.sidePanelMode).toBe('add');
    expect(component.sidePanelData).toBeNull();
    expect(component.sidePanelOpen).toBe(true);
  });

  it('should open add panel on Alt+C', () => {
    const event = new KeyboardEvent('keydown', { key: 'c', altKey: true });
    spyOn(event, 'preventDefault');

    component.handleKeyboardShortcut(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.sidePanelOpen).toBe(true);
    expect(component.sidePanelMode).toBe('add');
  });

  it('should have ADD NEW RECORD button label', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(component.headerConfig.actions?.[0]?.label).toBe('ADD NEW RECORD');
  }));

  describe('Default Title and Subtitle Fallback', () => {
    it('should include default title in breadcrumbs', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const breadcrumb = component.headerConfig.breadcrumbs.find(b => b.label === 'Order Class Codes');
      expect(breadcrumb).toBeDefined();
      expect(breadcrumb?.link).toBeNull();
    }));
  });
});
