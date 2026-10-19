import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError, Subject } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { SpAntigenRaritiesComponent } from './sp-antigen-rarities.component';
import { SpAntigenRarityService } from './services/sp-antigen-rarity.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { SpAntigenRarity } from './models/sp-antigen-rarity.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('SpAntigenRaritiesComponent', () => {
  let component: SpAntigenRaritiesComponent;
  let fixture: ComponentFixture<SpAntigenRaritiesComponent>;
  let mockService: jasmine.SpyObj<SpAntigenRarityService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let chapterChanged$: Subject<void>;

  const mockTableData: SpAntigenRarity[] = [
    {
      rarityCode: 'R1',
      rarityDescription: 'Rarity Level 1',
      effDate: new Date('2020-01-01'),
      termDate: null,
      lastModifiedDate: new Date('2024-03-15')
    },
    {
      rarityCode: 'R2',
      rarityDescription: 'Rarity Level 2',
      effDate: new Date('2020-01-01'),
      termDate: new Date('2025-12-31'),
      lastModifiedDate: new Date('2024-03-15')
    }
  ];

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    mockService = jasmine.createSpyObj('SpAntigenRarityService', [
      'getAntigenRarities',
      'getAntigenRarityById',
      'createAntigenRarity',
      'updateAntigenRarity',
      'deleteAntigenRarity'
    ]);
    mockLoggingService = jasmine.createSpyObj('LoggingService', ['log', 'error', 'warn', 'debug']);
    mockSnackbarService = createMockSnackbarService();
    mockHeaderService = createMockHeaderService({ chapterChanged$: chapterChanged$ });

    mockService.getAntigenRarities.and.returnValue(
      of({ success: true, message: 'Success', statusCode: 200, data: mockTableData, total: 2 })
    );



      TestBed.configureTestingModule({
      imports: [
        SpAntigenRaritiesComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SpAntigenRarityService, useValue: mockService },
        { provide: LoggingService, useValue: mockLoggingService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: HeaderService, useValue: mockHeaderService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(SpAntigenRaritiesComponent);
    component = fixture.componentInstance;


    });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {

    it('should have edit and delete row actions', () => {
      const actions = component.tableConfig.rowActions;
      expect(actions).toBeDefined();
      expect(actions!.find(action => action.action === 'edit')).toBeDefined();
      expect(actions!.find(action => action.action === 'delete')).toBeDefined();
    });

    it('should initialize table columns with correct configuration', () => {
      const columns = component.tableConfig.columns;
      expect(columns.length).toBe(4);
      expect(columns[0].key).toBe('rarityCode');
      expect(columns[0].header).toBe('Rarity Code');
      expect(columns[0].sortable).toBe(true);
      expect(columns[1].key).toBe('rarityDescription');
      expect(columns[1].header).toBe('Description');
      expect(columns[1].sortable).toBe(true);
      expect(columns[2].key).toBe('effDate');
      expect(columns[2].header).toBe('Effective Date');
      expect(columns[2].sortable).toBe(true);
      expect(columns[3].key).toBe('termDate');
      expect(columns[3].header).toBe('Termination Date');
    });

    it('should initialize pagination with default values', () => {
      const pagination = component.tableConfig.pagination;
      expect(pagination).toBeDefined();
      expect(pagination!.pageSize).toBe(25);
      expect(pagination!.pageIndex).toBe(0);
      expect(pagination!.totalRecords).toBe(0);
      expect(pagination!.pageSizeOptions).toEqual([10, 25, 50, 100]);
      expect(pagination!.showFirstLastButtons).toBe(true);
    });

    it('should initialize table config with sticky header and actions', () => {
      expect(component.tableConfig.stickyHeader).toBe(true);
      expect(component.tableConfig.stickyActionsColumn).toBe(true);
      expect(component.tableConfig.showPagination).toBe(true);
    });

    it('should initialize table config with empty and loading messages', () => {
      expect(component.tableConfig.emptyMessage).toBe('No antigen rarities available to display');
      expect(component.tableConfig.loadingMessage).toBe('Loading antigen rarities...');
    });

    it('should initialize with default state values', () => {
      expect(component.dataSource).toEqual([]);
      expect(component.isLoading).toBe(false);
      expect(component.hasError).toBe(false);
      expect(component.errorMessage).toBe('');
      expect(component.requestState).toEqual({});
    });

    it('should have edit row action with correct properties', () => {
      const editAction = component.tableConfig.rowActions!.find(a => a.action === 'edit');
      expect(editAction).toBeDefined();
      expect(editAction!.icon).toBe('edit');
      expect(editAction!.label).toBe('Edit antigen rarity');
      expect(editAction!.ariaLabel).toBe('Edit antigen rarity');
      expect(editAction!.color).toBe('default');
    });

    it('should have delete row action with correct properties', () => {
      const deleteAction = component.tableConfig.rowActions!.find(a => a.action === 'delete');
      expect(deleteAction).toBeDefined();
      expect(deleteAction!.icon).toBe('delete');
      expect(deleteAction!.label).toBe('Delete antigen rarity');
      expect(deleteAction!.ariaLabel).toBe('Delete antigen rarity');
      expect(deleteAction!.color).toBe('warn');
    });
  });

  describe('Lifecycle', () => {
    it('should call loadTableData and subscribeToChapterChanges on ngOnInit', () => {
      spyOn(component, 'loadTableData');
      component.ngOnInit();
      expect(component.loadTableData).toHaveBeenCalled();
    });

    it('should load data on ngOnInit via service call', () => {
      fixture.detectChanges();
      expect(mockService.getAntigenRarities).toHaveBeenCalled();
    });

    it('should complete the destroy$ subject on ngOnDestroy', () => {
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should unsubscribe from service calls on destroy', () => {
      // Set up a long-running observable
      const subject = new Subject<any>();
      mockService.getAntigenRarities.and.returnValue(subject.asObservable());

      fixture.detectChanges(); // triggers ngOnInit -> loadTableData
      component.isLoading = true;

      // Destroy the component
      component.ngOnDestroy();

      // Emit after destroy - should NOT update the component
      subject.next({ success: true, data: mockTableData, total: 5, statusCode: 200, message: '' });

      // isLoading should still be true because the subscription was cancelled
      expect(component.isLoading).toBe(true);
    });

    it('should unsubscribe from chapter changes on destroy', () => {
      fixture.detectChanges();
      const callCountAfterInit = mockService.getAntigenRarities.calls.count();

      component.ngOnDestroy();

      // Emit chapter change after destroy
      chapterChanged$.next();

      // Should NOT have triggered additional load
      expect(mockService.getAntigenRarities.calls.count()).toBe(callCountAfterInit);
    });
  });

  describe('Data Loading', () => {

    it('should handle successful data load', () => {
      // Act
      component.loadTableData();

      // Assert
      expect(component.dataSource).toEqual(mockTableData);
      expect(component.tableConfig.pagination!.totalRecords).toBe(2);
      expect(component.isLoading).toBeFalsy();
      expect(component.hasError).toBeFalsy();
    });

    it('should set isLoading to true at the start of loadTableData', () => {
      const subject = new Subject<any>();
      mockService.getAntigenRarities.and.returnValue(subject.asObservable());

      component.loadTableData();

      expect(component.isLoading).toBe(true);
      expect(component.hasError).toBe(false);
    });

    it('should handle error during data load', () => {
      // Arrange
      const error = new Error('Network error');
      mockService.getAntigenRarities.and.returnValue(throwError(() => error));

      // Act
      component.loadTableData();

      // Assert
      expect(component.hasError).toBe(true);
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Failed to load data. Please try again.');
      expect(mockLoggingService.error).toHaveBeenCalledWith('Error loading antigen rarities:', error);
    });

    it('should handle response with null data', () => {
      // Arrange
      mockService.getAntigenRarities.and.returnValue(
        of({ success: true, message: 'Success', statusCode: 200, data: null as any, total: 0 })
      );

      // Act
      component.loadTableData();

      // Assert
      expect(component.dataSource).toEqual([]);
    });

    it('should handle response with undefined total', () => {
      // Arrange
      mockService.getAntigenRarities.and.returnValue(
        of({ success: true, message: 'Success', statusCode: 200, data: mockTableData, total: undefined as any })
      );

      // Act
      component.loadTableData();

      // Assert
      expect(component.tableConfig.pagination!.totalRecords).toBe(0);
    });

    it('should reset hasError to false before loading', () => {
      // Arrange - set error state
      component.hasError = true;
      component.errorMessage = 'Previous error';

      // Act
      component.loadTableData();

      // Assert
      expect(component.hasError).toBe(false);
    });

    it('should use default pageIndex 0 when pagination pageIndex is undefined', () => {
      // Arrange
      component.tableConfig.pagination!.pageIndex = undefined as any;
      component.tableConfig.pagination!.pageSize = 25;

      // Act
      component.loadTableData();

      // Assert - skip should be 0 * 25 = 0
      expect(mockService.getAntigenRarities).toHaveBeenCalledWith(25, 0, component.requestState);
    });

    it('should use default pageSize 25 when pagination pageSize is undefined', () => {
      // Arrange
      component.tableConfig.pagination!.pageIndex = 0;
      component.tableConfig.pagination!.pageSize = undefined as any;

      // Act
      component.loadTableData();

      // Assert
      expect(mockService.getAntigenRarities).toHaveBeenCalledWith(25, 0, component.requestState);
    });

    it('should reload data when chapter changes', () => {
      // Arrange
      fixture.detectChanges();
      const initialCallCount = mockService.getAntigenRarities.calls.count();

      // Act
      chapterChanged$.next();

      // Assert
      expect(mockService.getAntigenRarities.calls.count()).toBe(initialCallCount + 1);
    });
  });

  describe('Pagination', () => {

    it('should calculate correct skip value for pagination', () => {
      // Arrange
      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 25;

      // Act
      component.loadTableData();

      // Assert
      expect(mockService.getAntigenRarities).toHaveBeenCalledWith(25, 50, component.requestState);
    });

    it('should update pagination and reload on page change', () => {
      // Arrange
      const pageEvent = { pageIndex: 3, pageSize: 50, length: 100 };

      // Act
      component.onPageChange(pageEvent);

      // Assert
      expect(component.tableConfig.pagination!.pageIndex).toBe(3);
      expect(component.tableConfig.pagination!.pageSize).toBe(50);
      expect(mockService.getAntigenRarities).toHaveBeenCalled();
    });

    it('should calculate skip correctly with different page sizes', () => {
      // Arrange
      component.tableConfig.pagination!.pageIndex = 1;
      component.tableConfig.pagination!.pageSize = 10;

      // Act
      component.loadTableData();

      // Assert
      expect(mockService.getAntigenRarities).toHaveBeenCalledWith(10, 10, component.requestState);
    });

    it('should calculate skip correctly for page 0', () => {
      // Arrange
      component.tableConfig.pagination!.pageIndex = 0;
      component.tableConfig.pagination!.pageSize = 50;

      // Act
      component.loadTableData();

      // Assert
      expect(mockService.getAntigenRarities).toHaveBeenCalledWith(50, 0, component.requestState);
    });
  });

  describe('Sorting', () => {
    it('should handle sort change with ascending order', () => {
      // Arrange
      fixture.detectChanges();
      const sortEvent = { column: 'rarityCode', direction: 'A' as const };

      // Act
      component.onSortChange(sortEvent);

      // Assert
      expect(component.requestState.sortColumn).toBe('RarityCode');
      expect(component.requestState.sortOrder).toBe('ASC');
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should handle sort change with descending order', () => {
      // Arrange
      fixture.detectChanges();
      const sortEvent = { column: 'rarityDescription', direction: 'D' as const };

      // Act
      component.onSortChange(sortEvent);

      // Assert
      expect(component.requestState.sortColumn).toBe('RarityDescription');
      expect(component.requestState.sortOrder).toBe('DESC');
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should clear sort when direction is default', () => {
      // Arrange
      component.requestState.sortColumn = 'RarityCode';
      component.requestState.sortOrder = 'ASC';
      const sortEvent = { column: 'rarityCode', direction: 'default' as const };

      // Act
      component.onSortChange(sortEvent);

      // Assert
      expect(component.requestState.sortColumn).toBeUndefined();
      expect(component.requestState.sortOrder).toBeUndefined();
    });

    it('should reset page index to 0 on sort change', () => {
      // Arrange
      component.tableConfig.pagination!.pageIndex = 5;
      const sortEvent = { column: 'rarityCode', direction: 'A' as const };

      // Act
      component.onSortChange(sortEvent);

      // Assert
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should map effDate column correctly', () => {
      // Arrange
      const sortEvent = { column: 'effDate', direction: 'A' as const };

      // Act
      component.onSortChange(sortEvent);

      // Assert
      expect(component.requestState.sortColumn).toBe('EffDate');
    });

    it('should use column name directly if not in column map', () => {
      // Arrange
      const sortEvent = { column: 'unknownColumn', direction: 'A' as const };

      // Act
      component.onSortChange(sortEvent);

      // Assert
      expect(component.requestState.sortColumn).toBe('unknownColumn');
    });

    it('should reload data after sort change', () => {
      // Arrange
      fixture.detectChanges();
      const callCountBefore = mockService.getAntigenRarities.calls.count();
      const sortEvent = { column: 'rarityCode', direction: 'A' as const };

      // Act
      component.onSortChange(sortEvent);

      // Assert
      expect(mockService.getAntigenRarities.calls.count()).toBe(callCountBefore + 1);
    });
  });

  describe('Row Actions', () => {

    it('should handle edit row action via onRowAction', () => {
      // Arrange
      const event = { action: 'edit', row: mockTableData[0] };

      // Act
      component.onRowAction(event);

      // Assert
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith(
        'Edit functionality will be implemented in the next phase'
      );
    });

    it('should handle delete row action', () => {
      // Arrange
      const event = { action: 'delete', row: mockTableData[0] };

      // Act
      component.onRowAction(event);

      // Assert
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith(
        'Delete functionality will be implemented in the next phase'
      );
    });

    it('should call editRecord method', () => {
      // Arrange
      spyOn(component, 'editRecord');
      const event = { action: 'edit', row: mockTableData[0] };

      // Act
      component.onRowAction(event);

      // Assert
      expect(component.editRecord).toHaveBeenCalledWith(mockTableData[0]);
    });

    it('should call deleteRecord method', () => {
      // Arrange
      spyOn(component, 'deleteRecord');
      const event = { action: 'delete', row: mockTableData[0] };

      // Act
      component.onRowAction(event);

      // Assert
      expect(component.deleteRecord).toHaveBeenCalledWith(mockTableData[0]);
    });

    it('should not call any method for unknown action', () => {
      // Arrange
      spyOn(component, 'editRecord');
      spyOn(component, 'deleteRecord');
      const event = { action: 'unknown', row: mockTableData[0] };

      // Act
      component.onRowAction(event);

      // Assert
      expect(component.editRecord).not.toHaveBeenCalled();
      expect(component.deleteRecord).not.toHaveBeenCalled();
    });

    it('should show success snackbar when createRecord is called', () => {
      // Act
      component.createRecord();

      // Assert
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith(
        'Add functionality will be implemented in the next phase'
      );
    });

    it('should show success snackbar when editRecord is called directly', () => {
      // Act
      component.editRecord(mockTableData[0]);

      // Assert
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith(
        'Edit functionality will be implemented in the next phase'
      );
    });

    it('should show success snackbar when deleteRecord is called directly', () => {
      // Act
      component.deleteRecord(mockTableData[1]);

      // Assert
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith(
        'Delete functionality will be implemented in the next phase'
      );
    });
  });

  describe('Date Formatting', () => {

    it('should return "-" for null dates', () => {
      // Act
      const formatted = (component as any).formatDate(null);

      // Assert
      expect(formatted).toBe('-');
    });

    it('should format a valid Date object', () => {
      // Arrange
      const date = new Date('2024-03-15');

      // Act
      const formatted = (component as any).formatDate(date);

      // Assert
      expect(formatted).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
      expect(formatted).toContain('2024');
      expect(formatted).toContain('MAR');
    });

    it('should format a valid date string', () => {
      // Arrange
      const dateStr = '2025-12-31';

      // Act
      const formatted = (component as any).formatDate(dateStr);

      // Assert
      expect(formatted).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
      expect(formatted).toContain('2025');
      expect(formatted).toContain('DEC');
    });

    it('should pad single-digit days with leading zero', () => {
      // Arrange
      const date = new Date('2024-01-05');

      // Act
      const formatted = (component as any).formatDate(date);

      // Assert
      expect(formatted).toMatch(/^05-/);
    });

    it('should format date with column valueFormatter', () => {
      // Arrange
      const columns = component.tableConfig.columns;
      const effDateColumn = columns.find(c => c.key === 'effDate');

      // Act
      const formatted = effDateColumn!.valueFormatter!(new Date('2024-06-15'));

      // Assert
      expect(formatted).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
      expect(formatted).toContain('JUN');
    });

    it('should format termDate with column valueFormatter', () => {
      // Arrange
      const columns = component.tableConfig.columns;
      const termDateColumn = columns.find(c => c.key === 'termDate');

      // Act
      const formatted = termDateColumn!.valueFormatter!(null);

      // Assert
      expect(formatted).toBe('-');
    });
  });
});
