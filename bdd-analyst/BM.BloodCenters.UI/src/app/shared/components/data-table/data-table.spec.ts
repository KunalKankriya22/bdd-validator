import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataTable } from './data-table';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleChange } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { DataTableConfig, TableColumn, RowAction } from '@shared/interfaces/data-table.interface';

describe('DataTable', () => {
  let component: DataTable;
  let fixture: ComponentFixture<DataTable>;
  let translateService: TranslateService;

  const mockColumns: TableColumn[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      width: '100px'
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      truncate: true,
      truncateLength: 20
    },
    {
      key: 'email',
      header: 'Email',
      sortable: false
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      valueFormatter: (value) => value.toUpperCase()
    }
  ];

  const mockRowActions: RowAction[] = [
    {
      icon: 'edit',
      label: 'Edit',
      action: 'edit',
      color: 'primary'
    },
    {
      icon: 'delete',
      label: 'Delete',
      action: 'delete',
      color: 'warn',
      disabled: (row: any) => row.status === 'archived'
    }
  ];

  const mockData = [
    { id: 1, name: 'John Doe', email: '[REDACTED_EMAIL_ADDRESS_1]', status: 'active' },
    { id: 2, name: 'Jane Smith with a very long name that should be truncated', email: '[REDACTED_EMAIL_ADDRESS_2]', status: 'inactive' },
    { id: 3, name: 'Bob Johnson', email: '[REDACTED_EMAIL_ADDRESS_3]', status: 'archived' }
  ];

  const mockConfig: DataTableConfig = {
    columns: mockColumns,
    rowActions: mockRowActions,
    pagination: {
      pageSize: 10,
      pageIndex: 0,
      totalRecords: 100,
      pageSizeOptions: [5, 10, 25, 50]
    },
    sortConfig: {
      column: 'id',
      direction: 'A'
    },
    stickyHeader: true,
    emptyMessage: 'No records found',
    loadingMessage: 'Loading...'
  };

  beforeEach(() => {

      TestBed.configureTestingModule({
      imports: [
        DataTable,
        TranslateModule.forRoot()]
    });

    

    fixture = TestBed.createComponent(DataTable);
    component = fixture.componentInstance;
    translateService = TestBed.inject(TranslateService);

    });

  describe('ngOnChanges', () => {
    it('should update displayed columns when config changes', () => {
      component.config = mockConfig;
      component.ngOnChanges({
        config: new SimpleChange(null, mockConfig, true)
      });

      expect(component.displayedColumns).toEqual(['id', 'name', 'email', 'status', 'actions']);
    });

    it('should update displayed columns without actions if no row actions defined', () => {
      const configWithoutActions = { ...mockConfig, rowActions: [] };
      component.config = configWithoutActions;
      component.ngOnChanges({
        config: new SimpleChange(null, configWithoutActions, true)
      });

      expect(component.displayedColumns).toEqual(['id', 'name', 'email', 'status']);
    });

    it('should update dataSource when data changes', () => {
      component.data = mockData;
      component.ngOnChanges({
        data: new SimpleChange(null, mockData, true)
      });

      expect(component.dataSource.data).toEqual(mockData);
    });
  });

  describe('updateDisplayedColumns', () => {
    it('should include actions column when row actions are defined', () => {
      component.config = mockConfig;
      component.ngOnChanges({
        config: new SimpleChange(null, mockConfig, true)
      });

      expect(component.displayedColumns).toContain('actions');
    });

    it('should not include actions column when row actions are empty', () => {
      const configWithoutActions = { ...mockConfig, rowActions: [] };
      component.config = configWithoutActions;
      component.ngOnChanges({
        config: new SimpleChange(null, configWithoutActions, true)
      });

      expect(component.displayedColumns).not.toContain('actions');
    });
  });

  describe('onPageChange', () => {

    it('should handle undefined previousPageIndex', () => {
      spyOn(component.pageChange, 'emit');
      const pageEvent: PageEvent = {
        pageIndex: 1,
        pageSize: 25,
        previousPageIndex: undefined,
        length: 100
      };

      component.onPageChange(pageEvent);

      expect(component.pageChange.emit).toHaveBeenCalledWith({
        pageIndex: 1,
        pageSize: 25,
        previousPageIndex: 0
      });
    });
  });

  describe('toggleSort', () => {
    beforeEach(() => {
      component.config = mockConfig;
    });


    it('should cycle from default to ascending on first click', () => {
      spyOn(component.sortChange, 'emit');
      component.config.sortConfig = { column: 'name', direction: 'default' };
      const column = mockColumns.find(col => col.key === 'name');

      component.toggleSort(column);

      expect(component.sortChange.emit).toHaveBeenCalledWith({
        column: 'name',
        direction: 'A'
      });
    });

    it('should cycle from ascending to descending', () => {
      spyOn(component.sortChange, 'emit');
      component.config.sortConfig = { column: 'name', direction: 'A' };
      const column = mockColumns.find(col => col.key === 'name');

      component.toggleSort(column);

      expect(component.sortChange.emit).toHaveBeenCalledWith({
        column: 'name',
        direction: 'D'
      });
    });

    it('should cycle from descending to ascending (no default state)', () => {
      spyOn(component.sortChange, 'emit');
      component.config.sortConfig = { column: 'name', direction: 'D' };
      const column = mockColumns.find(col => col.key === 'name');

      component.toggleSort(column);

      expect(component.sortChange.emit).toHaveBeenCalledWith({
        column: 'name',
        direction: 'A'
      });
    });

    it('should start with ascending when sorting different column', () => {
      spyOn(component.sortChange, 'emit');
      component.config.sortConfig = { column: 'id', direction: 'A' };
      const column = mockColumns.find(col => col.key === 'name');

      component.toggleSort(column);

      expect(component.sortChange.emit).toHaveBeenCalledWith({
        column: 'name',
        direction: 'A'
      });
    });
  });

  describe('getSortIcon', () => {
    beforeEach(() => {
      component.config = mockConfig;
    });


    it('should return arrow_upward for ascending sort', () => {
      component.config.sortConfig = { column: 'name', direction: 'A' };
      const column = mockColumns.find(col => col.key === 'name');
      const icon = component.getSortIcon(column);

      expect(icon).toBe('arrow_upward');
    });

    it('should return arrow_downward for descending sort', () => {
      component.config.sortConfig = { column: 'name', direction: 'D' };
      const column = mockColumns.find(col => col.key === 'name');
      const icon = component.getSortIcon(column);

      expect(icon).toBe('arrow_downward');
    });

    it('should return unfold_more for default/no sort', () => {
      component.config.sortConfig = { column: 'name', direction: 'default' };
      const column = mockColumns.find(col => col.key === 'name');
      const icon = component.getSortIcon(column);

      expect(icon).toBe('unfold_more');
    });

  });

  describe('getSortAriaLabel', () => {
    beforeEach(() => {
      component.config = mockConfig;
    });



    it('should return ascending state label', () => {
      component.config.sortConfig = { column: 'name', direction: 'A' };
      const column = mockColumns.find(col => col.key === 'name');
      const label = component.getSortAriaLabel(column);

      expect(label).toBe('Sort by Name. Sorted ascending');
    });

    it('should return descending state label', () => {
      component.config.sortConfig = { column: 'name', direction: 'D' };
      const column = mockColumns.find(col => col.key === 'name');
      const label = component.getSortAriaLabel(column);

      expect(label).toBe('Sort by Name. Sorted descending');
    });

    it('should return not sorted state label', () => {
      component.config.sortConfig = { column: 'id', direction: 'A' };
      const column = mockColumns.find(col => col.key === 'name');
      const label = component.getSortAriaLabel(column);

      expect(label).toBe('Sort by Name. Not sorted');
    });
  });

  describe('isSortActive', () => {
    beforeEach(() => {
      component.config = mockConfig;
    });

    it('should return true for actively sorted column', () => {
      component.config.sortConfig = { column: 'name', direction: 'A' };
      const column = mockColumns.find(col => col.key === 'name');

      expect(component.isSortActive(column)).toBe(true);
    });

    it('should return false for default direction', () => {
      component.config.sortConfig = { column: 'name', direction: 'default' };
      const column = mockColumns.find(col => col.key === 'name');

      expect(component.isSortActive(column)).toBe(false);
    });

    it('should return false for different column', () => {
      component.config.sortConfig = { column: 'id', direction: 'A' };
      const column = mockColumns.find(col => col.key === 'name');

      expect(component.isSortActive(column)).toBe(false);
    });
  });

  describe('actionsColumnHeader', () => {
    it('should render actionsColumnHeader text in the actions column header', () => {
      const configWithHeader = {
        ...mockConfig,
        actionsColumnHeader: 'Action'
      };
      component.config = configWithHeader;
      component.data = mockData;
      component.ngOnChanges({
        config: new SimpleChange(null, configWithHeader, true),
        data: new SimpleChange(null, mockData, true)
      });
      fixture.detectChanges();

      const actionsHeader = fixture.nativeElement.querySelector('.data-table__actions-header');
      expect(actionsHeader).toBeTruthy();
      expect(actionsHeader.textContent.trim()).toBe('Action');
    });

    it('should render empty actions column header when actionsColumnHeader is not set', () => {
      component.config = mockConfig;
      component.data = mockData;
      component.ngOnChanges({
        config: new SimpleChange(null, mockConfig, true),
        data: new SimpleChange(null, mockData, true)
      });
      fixture.detectChanges();

      const actionsHeader = fixture.nativeElement.querySelector('.data-table__actions-header');
      expect(actionsHeader).toBeTruthy();
      expect(actionsHeader.textContent.trim()).toBe('');
    });
  });

  describe('isRowActionVisible', () => {
    it('should return true when no show function defined', () => {
      const action = { ...mockRowActions[0] };
      const row = mockData[0];

      expect(component.isRowActionVisible(action, row)).toBe(true);
    });

  });

  describe('isRowActionDisabled', () => {
    it('should return false when no disabled function defined', () => {
      const action = { ...mockRowActions[0] };
      const row = mockData[0];

      expect(component.isRowActionDisabled(action, row)).toBe(false);
    });

  });

  describe('getCellValue', () => {
    it('should return formatted value when valueFormatter is defined', () => {
      const column = mockColumns.find(col => col.key === 'status');
      const row = mockData[0];

      const value = component.getCellValue(column, row);

      expect(value).toBe('ACTIVE');
    });

    it('should return string value when no formatter defined', () => {
      const column = mockColumns.find(col => col.key === 'name');
      const row = mockData[0];

      const value = component.getCellValue(column, row);

      expect(value).toBe('John Doe');
    });

    it('should return dash for null value', () => {
      const column = mockColumns.find(col => col.key === 'name');
      const row = { ...mockData[0], name: null };

      const value = component.getCellValue(column, row);

      expect(value).toBe('-');
    });

    it('should return dash for undefined value', () => {
      const column = mockColumns.find(col => col.key === 'name');
      const row = { ...mockData[0], name: undefined };

      const value = component.getCellValue(column, row);

      expect(value).toBe('-');
    });
  });

  describe('getTooltipText', () => {

    it('should return full text when value exceeds truncate length', () => {
      const column = mockColumns.find(col => col.key === 'name' && col.truncate);
      const row = mockData[1];

      const tooltip = component.getTooltipText(column, row);

      expect(tooltip).toBe(mockData[1].name);
    });

  });

  describe('truncateText', () => {
    it('should return full text when under truncate length', () => {
      const column = mockColumns.find(col => col.key === 'name' && col.truncate);
      const row = mockData[0];

      const truncated = component.truncateText(column, row);

      expect(truncated).toBe('John Doe');
    });

    it('should truncate text at word boundary and add ellipsis', () => {
      const column = mockColumns.find(col => col.key === 'name' && col.truncate);
      const row = mockData[1];

      const truncated = component.truncateText(column, row);

      expect(truncated).toContain('...');
      expect(truncated.length).toBeLessThan(mockData[1].name.length);
    });

    it('should use default truncate length of 50 when not specified', () => {
      const column = { ...mockColumns.find(col => col.key === 'name'), truncate: true, truncateLength: undefined };
      const longText = 'A'.repeat(100);
      const row = { ...mockData[0], name: longText };

      const truncated = component.truncateText(column, row);

      expect(truncated.length).toBeLessThanOrEqual(54);
    });
  });
  describe('getRowAriaLabel', () => {
    beforeEach(() => {
      component.config = mockConfig;
    });

    it('should return correct aria label for row', () => {
      const row = mockData[0];
      const label = component.getRowAriaLabel(row, 0);

      expect(label).toBe('Table row 1');
    });

    it('should return correct aria label for different index', () => {
      const row = mockData[2];
      const label = component.getRowAriaLabel(row, 2);

      expect(label).toBe('Table row 3');
    });
  });
  describe('empty state', () => {

    it('should display custom empty message', () => {
      const customConfig = { ...mockConfig, emptyMessage: 'Custom empty message' };
      component.config = customConfig;
      component.data = [];
      component.loading = false;
      component.ngOnChanges({
        config: new SimpleChange(null, customConfig, true),
        data: new SimpleChange(null, [], true)
      });
      fixture.detectChanges();

      const emptyMessage = fixture.nativeElement.querySelector('.data-table__empty-message');
      expect(emptyMessage.textContent.trim()).toContain('Custom empty message');
    });
  });
  describe('onMenuOpened', () => {
    it('should set activeMenuRow to the provided row', () => {
      const testRow = mockData[0];

      component.onMenuOpened(testRow);

      expect(component.activeMenuRow).toBe(testRow);
    });

    it('should update activeMenuRow when called with a different row', () => {
      component.activeMenuRow = mockData[0];

      component.onMenuOpened(mockData[1]);

      expect(component.activeMenuRow).toBe(mockData[1]);
    });
  });

  describe('onMenuClosed', () => {
    it('should clear activeMenuRow', () => {
      component.activeMenuRow = mockData[0];

      component.onMenuClosed();

      expect(component.activeMenuRow).toBeNull();
    });

    it('should handle being called when activeMenuRow is already null', () => {
      component.activeMenuRow = null;

      component.onMenuClosed();

      expect(component.activeMenuRow).toBeNull();
    });
  });

  describe('isMenuActive', () => {
    it('should return true when the provided row matches activeMenuRow', () => {
      const testRow = mockData[0];
      component.activeMenuRow = testRow;

      const result = component.isMenuActive(testRow);

      expect(result).toBeTrue();
    });

    it('should return false when the provided row does not match activeMenuRow', () => {
      component.activeMenuRow = mockData[0];

      const result = component.isMenuActive(mockData[1]);

      expect(result).toBeFalse();
    });

    it('should return false when activeMenuRow is null', () => {
      component.activeMenuRow = null;

      const result = component.isMenuActive(mockData[0]);

      expect(result).toBeFalse();
    });
  });

  describe('onDocumentClick', () => {
    it('should clear activeRow when clicking outside the table', () => {
      component.config = mockConfig;
      component.activeRow = mockData[0];
      const externalElement = document.createElement('div');
      document.body.appendChild(externalElement);
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: externalElement });
      component.onDocumentClick(event);
      expect(component.activeRow).toBeNull();
      document.body.removeChild(externalElement);
    });

    it('should not clear activeRow when keepActiveRow is true', () => {
      component.config = mockConfig;
      component.keepActiveRow = true;
      component.activeRow = mockData[0];
      const event = new MouseEvent('click');
      component.onDocumentClick(event);
      expect(component.activeRow).toBe(mockData[0]);
    });

    it('should not clear activeRow when clicking inside the table', () => {
      component.config = mockConfig;
      component.activeRow = mockData[0];
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: fixture.nativeElement });
      component.onDocumentClick(event);
      expect(component.activeRow).toBe(mockData[0]);
    });
  });

  describe('ngOnChanges additional branches', () => {
    it('should handle externalSelectedIds change', () => {
      component.config = { ...mockConfig, selectionKey: 'id', enableSelection: true };
      component.data = mockData;
      const externalIds = new Set([1, 2]);
      component.externalSelectedIds = externalIds;
      component.ngOnChanges({
        config: new SimpleChange(null, component.config, true),
        data: new SimpleChange(null, mockData, true),
        externalSelectedIds: new SimpleChange(undefined, externalIds, true)
      });
      expect(component.selectedIds.has(1)).toBe(true);
      expect(component.selectedIds.has(2)).toBe(true);
    });

    it('should set activeRow to null when highlightedRow changes', () => {
      component.config = mockConfig;
      component.activeRow = mockData[0];
      component.highlightedRow = mockData[1];
      component.ngOnChanges({
        highlightedRow: new SimpleChange(null, mockData[1], false)
      });
      expect(component.activeRow).toBeNull();
    });

    it('should handle null data gracefully', () => {
      component.config = mockConfig;
      component.data = null as any;
      component.ngOnChanges({
        data: new SimpleChange(mockData, null, false)
      });
      expect(component.dataSource.data).toEqual([]);
    });
  });

  describe('shouldShowTable and shouldShowEmptyState', () => {
    it('should return true for shouldShowTable when data exists', () => {
      component.config = mockConfig;
      component.dataSource.data = mockData;
      expect(component.shouldShowTable).toBe(true);
    });

    it('should return false for shouldShowTable when data is empty and showTableOnEmpty is false', () => {
      component.config = { ...mockConfig, showTableOnEmpty: false };
      component.dataSource.data = [];
      expect(component.shouldShowTable).toBe(false);
    });

    it('should return true for shouldShowTable when data is empty but showTableOnEmpty is true', () => {
      component.config = { ...mockConfig, showTableOnEmpty: true };
      component.dataSource.data = [];
      expect(component.shouldShowTable).toBe(true);
    });

    it('should return true for shouldShowEmptyState when data is empty and showTableOnEmpty is false', () => {
      component.config = { ...mockConfig, showTableOnEmpty: false };
      component.dataSource.data = [];
      expect(component.shouldShowEmptyState).toBe(true);
    });

    it('should return false for shouldShowEmptyState when data exists', () => {
      component.config = mockConfig;
      component.dataSource.data = mockData;
      expect(component.shouldShowEmptyState).toBe(false);
    });
  });

  describe('buildGroupHeaderColumns', () => {
    it('should build group header columns from columnGroups', () => {
      const configWithGroups = {
        ...mockConfig,
        columnGroups: [{ startColumn: 'name', endColumn: 'email', label: 'Contact Info' }]
      };
      component.config = configWithGroups;
      component.ngOnChanges({
        config: new SimpleChange(null, configWithGroups, true)
      });
      expect(component.groupHeaderColumns.length).toBeGreaterThan(0);
      expect(component.groupHeaderColumnDefs.length).toBeGreaterThan(0);
    });

    it('should handle empty columnGroups', () => {
      component.config = { ...mockConfig, columnGroups: [] };
      component.ngOnChanges({
        config: new SimpleChange(null, component.config, true)
      });
      expect(component.groupHeaderColumns.length).toBe(0);
    });
  });

  describe('getGroupHeaderColspan and getGroupHeaderLabel', () => {
    it('should return colspan for a known group header key', () => {
      component.groupHeaderColumns = [{ key: 'group_name', label: 'Contact Info', colspan: 2 }];
      expect(component.getGroupHeaderColspan('group_name')).toBe(2);
    });

    it('should return 1 for unknown key', () => {
      component.groupHeaderColumns = [];
      expect(component.getGroupHeaderColspan('unknown')).toBe(1);
    });

    it('should return label for known key', () => {
      component.groupHeaderColumns = [{ key: 'group_name', label: 'Contact Info', colspan: 2 }];
      expect(component.getGroupHeaderLabel('group_name')).toBe('Contact Info');
    });

    it('should return empty string for unknown key', () => {
      component.groupHeaderColumns = [];
      expect(component.getGroupHeaderLabel('unknown')).toBe('');
    });
  });

  describe('updateDisplayedColumns with selection and expand', () => {
    it('should add select column at the end by default when enableSelection', () => {
      component.config = { ...mockConfig, enableSelection: true };
      component.ngOnChanges({
        config: new SimpleChange(null, component.config, true)
      });
      const cols = component.displayedColumns;
      expect(cols[cols.length - 1]).toBe('select');
    });

    it('should add select column at the beginning when selectionPosition is first', () => {
      component.config = { ...mockConfig, enableSelection: true, selectionPosition: 'first' };
      component.ngOnChanges({
        config: new SimpleChange(null, component.config, true)
      });
      expect(component.displayedColumns[0]).toBe('select');
    });

    it('should add expand column when expandTemplate is set', () => {
      component.config = mockConfig;
      component.expandTemplate = {} as any;
      component.ngOnChanges({
        config: new SimpleChange(null, mockConfig, true),
        expandTemplate: new SimpleChange(null, component.expandTemplate, true)
      });
      expect(component.displayedColumns[0]).toBe('expand');
    });
  });

  describe('toggleSort edge cases', () => {
    it('should not emit when column is not sortable', () => {
      component.config = mockConfig;
      spyOn(component.sortChange, 'emit');
      const nonSortableCol = mockColumns.find(col => col.key === 'email');
      component.toggleSort(nonSortableCol);
      expect(component.sortChange.emit).not.toHaveBeenCalled();
    });

    it('should handle no sortConfig', () => {
      component.config = { ...mockConfig, sortConfig: undefined };
      spyOn(component.sortChange, 'emit');
      const col = mockColumns.find(c => c.key === 'id');
      component.toggleSort(col);
      expect(component.sortChange.emit).toHaveBeenCalledWith({ column: 'id', direction: 'A' });
    });
  });

  describe('getSortIcon edge cases', () => {
    it('should return empty string for non-sortable column', () => {
      component.config = mockConfig;
      const col = mockColumns.find(c => c.key === 'email');
      expect(component.getSortIcon(col)).toBe('');
    });

    it('should use custom icon map', () => {
      component.config = { ...mockConfig, sortIconMap: { ascending: 'up', descending: 'down', default: 'neutral' }, sortConfig: { column: 'id', direction: 'A' } };
      const col = mockColumns.find(c => c.key === 'id');
      expect(component.getSortIcon(col)).toBe('up');
    });

    it('should return unfold_more for unsorted sortable column', () => {
      component.config = { ...mockConfig, sortConfig: { column: 'name', direction: 'A' } };
      const col = mockColumns.find(c => c.key === 'id');
      expect(component.getSortIcon(col)).toBe('unfold_more');
    });
  });

  describe('getSortAriaLabel edge cases', () => {
    it('should return column header for non-sortable column', () => {
      component.config = mockConfig;
      const col = mockColumns.find(c => c.key === 'email');
      expect(component.getSortAriaLabel(col)).toBe('Email');
    });
  });

  describe('onRowActionClick', () => {
    it('should emit rowAction and set activeRow when enableRowHighlight', () => {
      component.config = { ...mockConfig, enableRowHighlight: true };
      spyOn(component.rowAction, 'emit');
      component.onRowActionClick('edit', mockData[0]);
      expect(component.activeRow).toBe(mockData[0]);
      expect(component.rowAction.emit).toHaveBeenCalledWith({ action: 'edit', row: mockData[0] });
    });

    it('should not set activeRow when enableRowHighlight is falsy', () => {
      component.config = { ...mockConfig, enableRowHighlight: undefined };
      spyOn(component.rowAction, 'emit');
      component.onRowActionClick('edit', mockData[0]);
      expect(component.activeRow).toBeNull();
    });
  });

  describe('isRowActionVisible with functions', () => {
    it('should use visible function when provided', () => {
      const action = { visible: (row: any) => row.status === 'active' };
      expect(component.isRowActionVisible(action, mockData[0])).toBe(true);
      expect(component.isRowActionVisible(action, mockData[2])).toBe(false);
    });

    it('should use show function when provided', () => {
      const action = { show: (row: any) => row.status === 'active' };
      expect(component.isRowActionVisible(action, mockData[0])).toBe(true);
    });
  });

  describe('isRowActionDisabled with function', () => {
    it('should use disabled function when provided', () => {
      const action = mockRowActions[1];
      expect(component.isRowActionDisabled(action, mockData[2])).toBe(true);
      expect(component.isRowActionDisabled(action, mockData[0])).toBe(false);
    });
  });

  describe('getActionAriaLabel', () => {
    it('should replace placeholders with row values', () => {
      const action = { ariaLabel: 'Edit {{name}}' };
      expect(component.getActionAriaLabel(action, mockData[0])).toBe('Edit John Doe');
    });

    it('should return empty string when no ariaLabel or label', () => {
      const action = {};
      expect(component.getActionAriaLabel(action, mockData[0])).toBe('');
    });

    it('should handle null value in placeholder', () => {
      const action = { ariaLabel: 'Edit {{name}}' };
      const row = { ...mockData[0], name: null };
      expect(component.getActionAriaLabel(action, row)).toBe('Edit ');
    });

    it('should use label when ariaLabel is not set', () => {
      const action = { label: 'Delete {{id}}' };
      expect(component.getActionAriaLabel(action, mockData[0])).toBe('Delete 1');
    });
  });

  describe('getCellValue additional branches', () => {
    it('should return dash for empty string value', () => {
      const col = mockColumns.find(c => c.key === 'name');
      const row = { ...mockData[0], name: '' };
      expect(component.getCellValue(col, row)).toBe('-');
    });

    it('should return dash for whitespace-only string', () => {
      const col = mockColumns.find(c => c.key === 'name');
      const row = { ...mockData[0], name: '   ' };
      expect(component.getCellValue(col, row)).toBe('-');
    });

    it('should return dash when valueFormatter returns null', () => {
      const col = { key: 'status', header: 'Status', valueFormatter: () => null };
      expect(component.getCellValue(col, mockData[0])).toBe('-');
    });

    it('should return dash when valueFormatter returns empty string', () => {
      const col = { key: 'status', header: 'Status', valueFormatter: () => '' };
      expect(component.getCellValue(col, mockData[0])).toBe('-');
    });

    it('should handle non-string formatter return', () => {
      const col = { key: 'id', header: 'ID', valueFormatter: (v: any) => v * 10 };
      expect(component.getCellValue(col, mockData[0])).toBe('10');
    });
  });

  describe('getFooterValue', () => {
    it('should return empty string when no footerData', () => {
      component.config = { ...mockConfig, footerData: undefined };
      expect(component.getFooterValue('id')).toBe('');
    });

    it('should return value when footerData has the key', () => {
      component.config = { ...mockConfig, footerData: { id: 'Total: 3' } };
      expect(component.getFooterValue('id')).toBe('Total: 3');
    });

    it('should return empty string for null value in footerData', () => {
      component.config = { ...mockConfig, footerData: { id: null } };
      expect(component.getFooterValue('id')).toBe('');
    });
  });

  describe('getTooltipText additional', () => {
    it('should return null for non-truncated column', () => {
      const col = mockColumns.find(c => c.key === 'email');
      expect(component.getTooltipText(col, mockData[0])).toBeNull();
    });

    it('should return null when text is short', () => {
      const col = mockColumns.find(c => c.key === 'name' && c.truncate);
      expect(component.getTooltipText(col, mockData[0])).toBeNull();
    });
  });

  describe('showTooltipIfOverflowing', () => {
    it('should disable tooltip when no overflow', () => {
      const el = document.createElement('div');
      Object.defineProperty(el, 'scrollWidth', { value: 100 });
      Object.defineProperty(el, 'clientWidth', { value: 200 });
      const tooltip = { disabled: false } as any;
      component.showTooltipIfOverflowing(el, tooltip);
      expect(tooltip.disabled).toBe(true);
    });

    it('should enable tooltip when overflowing', () => {
      const el = document.createElement('div');
      Object.defineProperty(el, 'scrollWidth', { value: 300 });
      Object.defineProperty(el, 'clientWidth', { value: 200 });
      const tooltip = { disabled: true } as any;
      component.showTooltipIfOverflowing(el, tooltip);
      expect(tooltip.disabled).toBe(false);
    });
  });

  describe('trackByIndex', () => {
    it('should return the index', () => {
      expect(component.trackByIndex(5)).toBe(5);
    });
  });

  describe('hasIconActions and shouldUseMenu', () => {
    it('hasIconActions returns true when actions have icons', () => {
      component.config = mockConfig;
      expect(component.hasIconActions()).toBe(true);
    });

    it('hasIconActions returns false when no actions', () => {
      component.config = { ...mockConfig, rowActions: [] };
      expect(component.hasIconActions()).toBe(false);
    });

    it('hasIconActions returns false when actions have no icons', () => {
      component.config = { ...mockConfig, rowActions: [{ label: 'Edit', action: 'edit' }] };
      expect(component.hasIconActions()).toBe(false);
    });

    it('shouldUseMenu returns false when no actions', () => {
      component.config = { ...mockConfig, rowActions: [] };
      expect(component.shouldUseMenu()).toBe(false);
    });

    it('shouldUseMenu returns true when multiple actions without icons', () => {
      component.config = { ...mockConfig, rowActions: [{ label: 'Edit', action: 'edit' }, { label: 'Delete', action: 'delete' }] };
      expect(component.shouldUseMenu()).toBe(true);
    });

    it('shouldUseMenu returns false when actions have icons', () => {
      component.config = mockConfig;
      expect(component.shouldUseMenu()).toBe(false);
    });
  });

  describe('toggleSelectAll', () => {
    beforeEach(() => {
      component.config = { ...mockConfig, enableSelection: true, selectionKey: 'id' };
      component.data = mockData;
      component.dataSource.data = mockData;
    });

    it('should select all rows when none selected', () => {
      spyOn(component.selectionChange, 'emit');
      component.isAllSelected = false;
      component.isAllPagesSelected = false;
      component.toggleSelectAll();
      expect(component.isAllPagesSelected).toBe(true);
      expect(component.isAllSelected).toBe(true);
      expect(component.selectedIds.size).toBe(3);
      expect(component.selectionChange.emit).toHaveBeenCalled();
    });

    it('should deselect all rows when all selected', () => {
      spyOn(component.selectionChange, 'emit');
      component.isAllSelected = true;
      component.isAllPagesSelected = true;
      component.selectedIds = new Set([1, 2, 3]);
      component.selectedRows = [...mockData];
      component.toggleSelectAll();
      expect(component.selectedIds.size).toBe(0);
      expect(component.selectedRows.length).toBe(0);
      expect(component.isAllSelected).toBe(false);
      expect(component.selectionChange.emit).toHaveBeenCalled();
    });
  });

  describe('toggleRowSelection', () => {
    beforeEach(() => {
      component.config = { ...mockConfig, enableSelection: true, selectionKey: 'id', pagination: { pageSize: 10, pageIndex: 0, totalRecords: 3, pageSizeOptions: [10] } };
      component.data = mockData;
      component.dataSource.data = mockData;
    });

    it('should add row to selection', () => {
      spyOn(component.selectionChange, 'emit');
      component.toggleRowSelection(mockData[0]);
      expect(component.selectedIds.has(1)).toBe(true);
      expect(component.selectionChange.emit).toHaveBeenCalled();
    });

    it('should remove row from selection', () => {
      component.selectedIds.add(1);
      component.selectedRows = [mockData[0]];
      spyOn(component.selectionChange, 'emit');
      component.toggleRowSelection(mockData[0]);
      expect(component.selectedIds.has(1)).toBe(false);
      expect(component.selectionChange.emit).toHaveBeenCalled();
    });

    it('should use object reference when no selectionKey', () => {
      component.config = { ...mockConfig, enableSelection: true, selectionKey: undefined };
      spyOn(component.selectionChange, 'emit');
      component.toggleRowSelection(mockData[0]);
      expect(component.selectedRows).toContain(mockData[0]);
      // Toggle off
      component.toggleRowSelection(mockData[0]);
      expect(component.selectedRows).not.toContain(mockData[0]);
    });
  });

  describe('isRowSelectable', () => {
    it('should return true by default', () => {
      component.config = mockConfig;
      expect(component.isRowSelectable(mockData[0])).toBe(true);
    });

    it('should use isRowSelectable function when provided', () => {
      component.config = { ...mockConfig, isRowSelectable: (row: any) => row.status !== 'archived' };
      expect(component.isRowSelectable(mockData[0])).toBe(true);
      expect(component.isRowSelectable(mockData[2])).toBe(false);
    });
  });

  describe('isRowSelected', () => {
    it('should return true when row id is in selectedIds', () => {
      component.config = { ...mockConfig, selectionKey: 'id' };
      component.selectedIds.add(1);
      expect(component.isRowSelected(mockData[0])).toBe(true);
    });

    it('should fall back to includes check when no selectionKey', () => {
      component.config = { ...mockConfig, selectionKey: undefined };
      component.selectedRows = [mockData[0]];
      expect(component.isRowSelected(mockData[0])).toBe(true);
      expect(component.isRowSelected(mockData[1])).toBe(false);
    });
  });

  describe('onRowClick', () => {
    it('should toggle activeRow and emit rowClick', () => {
      component.config = mockConfig;
      spyOn(component.rowClick, 'emit');
      component.onRowClick(mockData[0]);
      expect(component.activeRow).toBe(mockData[0]);
      expect(component.rowClick.emit).toHaveBeenCalledWith(mockData[0]);
    });

    it('should deactivate row on second click', () => {
      component.config = mockConfig;
      component.activeRow = mockData[0];
      spyOn(component.rowClick, 'emit');
      component.onRowClick(mockData[0]);
      expect(component.activeRow).toBeNull();
    });

    it('should not toggle activeRow when enableRowHighlight is false', () => {
      component.config = { ...mockConfig, enableRowHighlight: false };
      spyOn(component.rowClick, 'emit');
      component.onRowClick(mockData[0]);
      expect(component.activeRow).toBeNull();
      expect(component.rowClick.emit).toHaveBeenCalled();
    });
  });

  describe('isRowActive', () => {
    it('should return true when row is activeRow', () => {
      component.config = mockConfig;
      component.activeRow = mockData[0];
      expect(component.isRowActive(mockData[0])).toBe(true);
    });

    it('should return true when row is in selectedRows', () => {
      component.config = mockConfig;
      component.selectedRows = [mockData[0]];
      expect(component.isRowActive(mockData[0])).toBe(true);
    });

    it('should return true when row is activeMenuRow', () => {
      component.config = mockConfig;
      component.activeMenuRow = mockData[0];
      expect(component.isRowActive(mockData[0])).toBe(true);
    });

    it('should return true when highlightedRow matches', () => {
      component.config = mockConfig;
      component.highlightedRow = mockData[0];
      expect(component.isRowActive(mockData[0])).toBe(true);
    });

    it('should return false when highlightedRow is set but does not match', () => {
      component.config = mockConfig;
      component.highlightedRow = mockData[1];
      component.activeRow = null;
      component.selectedRows = [];
      component.activeMenuRow = null;
      expect(component.isRowActive(mockData[0])).toBe(false);
    });
  });

  describe('toggleRowExpand', () => {
    it('should emit rowExpandToggle and stop propagation', () => {
      spyOn(component.rowExpandToggle, 'emit');
      const event = new Event('click');
      spyOn(event, 'stopPropagation');
      component.toggleRowExpand(event, mockData[0]);
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.rowExpandToggle.emit).toHaveBeenCalledWith(mockData[0]);
    });
  });

  describe('isRowExpanded', () => {
    it('should use row reference when no expandRowKey', () => {
      component.expandedRows = new Set([mockData[0]]);
      expect(component.isRowExpanded(mockData[0])).toBe(true);
      expect(component.isRowExpanded(mockData[1])).toBe(false);
    });

    it('should use expandRowKey when set', () => {
      component.expandRowKey = 'id';
      component.expandedRows = new Set([1]);
      expect(component.isRowExpanded(mockData[0])).toBe(true);
      expect(component.isRowExpanded(mockData[1])).toBe(false);
    });
  });

  describe('allRowsExpanded', () => {
    it('should return true when all rows are expanded', () => {
      component.dataSource.data = mockData;
      component.expandedRows = new Set(mockData);
      expect(component.allRowsExpanded).toBe(true);
    });

    it('should return false when no data', () => {
      component.dataSource.data = [];
      component.expandedRows = new Set();
      expect(component.allRowsExpanded).toBe(false);
    });

    it('should return false when not all rows expanded', () => {
      component.dataSource.data = mockData;
      component.expandedRows = new Set([mockData[0]]);
      expect(component.allRowsExpanded).toBe(false);
    });
  });

  describe('toggleExpandAll', () => {
    it('should emit expandAllToggle and stop propagation', () => {
      component.dataSource.data = mockData;
      component.expandedRows = new Set();
      spyOn(component.expandAllToggle, 'emit');
      const event = new Event('click');
      spyOn(event, 'stopPropagation');
      component.toggleExpandAll(event);
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.expandAllToggle.emit).toHaveBeenCalledWith(true);
    });
  });

});
