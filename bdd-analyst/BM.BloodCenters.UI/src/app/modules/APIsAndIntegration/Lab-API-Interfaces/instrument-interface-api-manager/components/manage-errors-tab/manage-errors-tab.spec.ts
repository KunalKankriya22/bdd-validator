import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange, SimpleChanges } from '@angular/core';
import { ManageErrorsTab } from './manage-errors-tab';
import { InstrumentInterfaceService } from '../../services/instrument-interface.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import { PageEvent } from '@angular/material/paginator';

describe('ManageErrorsTab', () => {
  let component: ManageErrorsTab;
  let fixture: ComponentFixture<ManageErrorsTab>;
  let mockService: jasmine.SpyObj<InstrumentInterfaceService>;
  let mockSnackbar: jasmine.SpyObj<SnackbarService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  const mockErrorCodes = [
    { machineTestId: 'MT001', errorCode: 'E01', errorDesc: 'Test error', skipLevel: 'S', effDate: '2024-01-01' },
    { machineTestId: 'MT002', errorCode: 'E02', errorDesc: 'Another error', skipLevel: 'A', effDate: '2024-02-01' },
  ];

  const mockMachineTestIds = [
    { machineTestId: 'MT001', testId: 'T001' },
    { machineTestId: 'MT002', testId: 'T002' },
  ];

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('InstrumentInterfaceService', [
      'getErrorCodes',
      'getMachineTestIds',
      'filterErrorCodes',
      'addErrorCode',
      'updateErrorCode',
      'getErrorCodeDetails',
    ]);
    mockSnackbar = createMockSnackbarService();
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

    mockService.getErrorCodes.and.returnValue(of([]));
    mockService.getMachineTestIds.and.returnValue(of(mockMachineTestIds));
    mockService.filterErrorCodes.and.returnValue(of({ data: mockErrorCodes, total: 2 }));
    mockService.addErrorCode.and.returnValue(of({ message: 'Added successfully' }));
    mockService.updateErrorCode.and.returnValue(of({ message: 'Updated successfully' }));
    mockService.getErrorCodeDetails.and.returnValue(of({ item: mockErrorCodes[0] }));

    await TestBed.configureTestingModule({
      imports: [ManageErrorsTab, NoopAnimationsModule],
      providers: [
        { provide: InstrumentInterfaceService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbar },
        { provide: MatDialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageErrorsTab);
    component = fixture.componentInstance;
    component.chapterId = 'DAL';
    component.instrumentId = 'S201';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reset all state when inputs change via ngOnChanges', () => {
    // Arrange
    component.searchText.set('some search');
    component.pageIndex.set(3);
    component.pageSize.set(50);
    component.sortDirection.set('asc');
    component.sortColumn.set('errorCode');
    component.filterChips = [{ key: 'test', label: 'Test', value: 'test', removable: true }];

    const changes: SimpleChanges = {
      chapterId: new SimpleChange('OLD', 'NEW', false),
    };

    // Act
    component.ngOnChanges(changes);

    // Assert
    expect(component.errorCodeList()).toEqual([]);
    expect(component.paginatedData()).toEqual([]);
    expect(component.totalItems()).toBe(0);
    expect(component.hasLoadedData()).toBe(false);
    expect(component.loading()).toBe(false);
    expect(component.searchText()).toBe('');
    expect(component.pageIndex()).toBe(0);
    expect(component.pageSize()).toBe(25);
    expect(component.sortDirection()).toBe('desc');
    expect(component.sortColumn()).toBe('machineTestId');
    expect(component.filterChips).toEqual([]);
  });

  it('should load machine test IDs successfully', () => {
    // Arrange - mockService already configured

    // Act
    component.loadMachineTestIds();

    // Assert
    expect(mockService.getMachineTestIds).toHaveBeenCalledWith('DAL', 'S201');
    expect(component.machineTestIds()).toEqual(mockMachineTestIds);
  });

  it('should set machineTestIds to empty array on getMachineTestIds error', () => {
    // Arrange
    mockService.getMachineTestIds.and.returnValue(throwError(() => new Error('API error')));

    // Act
    component.loadMachineTestIds();

    // Assert
    expect(component.machineTestIds()).toEqual([]);
  });

  it('should not load machine test IDs when chapterId is missing', () => {
    // Arrange
    component.chapterId = '';

    // Act
    component.loadMachineTestIds();

    // Assert
    expect(mockService.getMachineTestIds).not.toHaveBeenCalled();
  });

  it('should load error codes with pagination and set data signals', () => {
    // Arrange - defaults are set

    // Act
    component.loadErrorCodes();

    // Assert
    expect(component.loading()).toBe(false);
    expect(mockService.filterErrorCodes).toHaveBeenCalledWith(25, 0, jasmine.objectContaining({
      chapterId: 'DAL',
      machineId: 'S201',
      searchItem: '',
    }));
    expect(component.paginatedData()).toEqual(mockErrorCodes);
    expect(component.totalItems()).toBe(2);
    expect(component.hasLoadedData()).toBe(true);
  });

  it('should clear data on loadErrorCodes error', () => {
    // Arrange
    mockService.filterErrorCodes.and.returnValue(throwError(() => new Error('Server error')));

    // Act
    component.loadErrorCodes();

    // Assert
    expect(component.paginatedData()).toEqual([]);
    expect(component.totalItems()).toBe(0);
    expect(component.hasLoadedData()).toBe(true);
    expect(component.loading()).toBe(false);
  });

  it('should not load error codes when instrumentId is missing', () => {
    // Arrange
    component.instrumentId = '';

    // Act
    component.loadErrorCodes();

    // Assert
    expect(mockService.filterErrorCodes).not.toHaveBeenCalled();
  });

  it('should reset page index and load error codes on search', () => {
    // Arrange
    component.pageIndex.set(5);

    // Act
    component.onSearch('test search');

    // Assert
    expect(component.searchText()).toBe('test search');
    expect(component.pageIndex()).toBe(0);
    expect(mockService.filterErrorCodes).toHaveBeenCalled();
  });

  it('should cycle sort direction for the same column: asc -> desc -> clear -> asc', () => {
    // Arrange - default sortColumn is 'machineTestId', sortDirection is 'desc'
    component.sortColumn.set('errorCode');
    component.sortDirection.set('asc');

    // Act - asc -> desc
    component.onSort('errorCode');

    // Assert
    expect(component.sortDirection()).toBe('desc');

    // Act - desc -> '' (clear)
    component.onSort('errorCode');

    // Assert
    expect(component.sortDirection()).toBe('');
    expect(component.sortColumn()).toBe('');

    // Arrange - sort a new column
    // Act - different column -> asc
    component.onSort('machineTestId');

    // Assert
    expect(component.sortColumn()).toBe('machineTestId');
    expect(component.sortDirection()).toBe('asc');
  });

  it('should return correct sort icon for each state', () => {
    // Arrange
    component.sortColumn.set('machineTestId');
    component.sortDirection.set('asc');

    // Act & Assert - active column asc
    expect(component.getSortIcon('machineTestId')).toBe('arrow_upward');

    // Arrange
    component.sortDirection.set('desc');

    // Act & Assert - active column desc
    expect(component.getSortIcon('machineTestId')).toBe('arrow_downward');

    // Act & Assert - different column
    expect(component.getSortIcon('errorCode')).toBe('unfold_more');
  });

  it('should update pagination and reload on page change', () => {
    // Arrange
    const pageEvent: PageEvent = { pageIndex: 2, pageSize: 50, length: 100 };

    // Act
    component.onPageChange(pageEvent);

    // Assert
    expect(component.pageIndex()).toBe(2);
    expect(component.pageSize()).toBe(50);
    expect(mockService.filterErrorCodes).toHaveBeenCalled();
  });

  it('should toggle filter open state', () => {
    // Arrange
    expect(component.isFilterOpen).toBe(false);

    // Act
    component.toggleFilter();

    // Assert
    expect(component.isFilterOpen).toBe(true);

    // Act
    component.toggleFilter();

    // Assert
    expect(component.isFilterOpen).toBe(false);
  });

  it('should apply filters, close panel, reset page, and reload', () => {
    // Arrange
    component.isFilterOpen = true;
    component.pageIndex.set(3);
    const filters = {
      machineTestId: 'MT001',
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null,
    };

    // Act
    component.onFilterApply(filters);

    // Assert
    expect(component.currentFilters()).toEqual(filters);
    expect(component.isFilterOpen).toBe(false);
    expect(component.pageIndex()).toBe(0);
    expect(mockService.filterErrorCodes).toHaveBeenCalled();
  });

  it('should close filter panel on onFilterClose', () => {
    // Arrange
    component.isFilterOpen = true;

    // Act
    component.onFilterClose();

    // Assert
    expect(component.isFilterOpen).toBe(false);
  });

  it('should remove a specific filter chip and reload data', () => {
    // Arrange
    component.currentFilters.set({
      machineTestId: 'MT001',
      effDatePeriod: 'after',
      effDate: new Date('2024-01-01'),
      termDatePeriod: null,
      termDate: null,
    });
    component.pageIndex.set(2);

    // Act
    component.removeFilterChip('machineTestId');

    // Assert
    expect(component.currentFilters().machineTestId).toBeNull();
    expect(component.pageIndex()).toBe(0);
    expect(mockService.filterErrorCodes).toHaveBeenCalled();
  });

  it('should clear all filters and reload data', () => {
    // Arrange
    component.currentFilters.set({
      machineTestId: 'MT001',
      effDatePeriod: 'after',
      effDate: new Date('2024-01-01'),
      termDatePeriod: 'before',
      termDate: new Date('2024-12-31'),
    });
    component.filterChips = [{ key: 'test', label: 'Test', value: 'v', removable: true }];
    component.pageIndex.set(4);

    // Act
    component.clearAllFilters();

    // Assert
    expect(component.currentFilters().machineTestId).toBeNull();
    expect(component.currentFilters().effDate).toBeNull();
    expect(component.currentFilters().termDate).toBeNull();
    expect(component.filterChips).toEqual([]);
    expect(component.pageIndex()).toBe(0);
    expect(mockService.filterErrorCodes).toHaveBeenCalled();
  });

  it('should remove effDate chip and clear both effDate and effDatePeriod', () => {
    // Arrange
    component.currentFilters.set({
      machineTestId: null,
      effDatePeriod: 'after',
      effDate: new Date('2024-06-01'),
      termDatePeriod: null,
      termDate: null,
    });

    // Act
    component.removeFilterChip('effDate');

    // Assert
    expect(component.currentFilters().effDate).toBeNull();
    expect(component.currentFilters().effDatePeriod).toBeNull();
  });

  it('should remove termDate chip and clear both termDate and termDatePeriod', () => {
    // Arrange
    component.currentFilters.set({
      machineTestId: null,
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: 'before',
      termDate: new Date('2024-12-31'),
    });

    // Act
    component.removeFilterChip('termDate');

    // Assert
    expect(component.currentFilters().termDate).toBeNull();
    expect(component.currentFilters().termDatePeriod).toBeNull();
  });

  it('should compute machineTestIdStrings from machineTestIds signal', () => {
    // Arrange
    component.machineTestIds.set([
      { machineTestId: 'MT001', testId: 'T001' },
      { machineTestId: 'MT002', testId: 'T002' },
      { machineTestId: 'MT003', testId: 'T003' },
    ]);

    // Act & Assert
    expect(component.machineTestIdStrings()).toEqual(['MT001', 'MT002', 'MT003']);
  });

  it('should return empty array for machineTestIdStrings when no machineTestIds', () => {
    // Arrange
    component.machineTestIds.set([]);

    // Act & Assert
    expect(component.machineTestIdStrings()).toEqual([]);
  });

  it('should return index from trackByIndex', () => {
    expect(component.trackByIndex(0)).toBe(0);
    expect(component.trackByIndex(5)).toBe(5);
    expect(component.trackByIndex(99)).toBe(99);
  });

  it('should reset state when instrumentId changes via ngOnChanges', () => {
    // Arrange
    component.searchText.set('some search');
    component.pageIndex.set(2);

    const changes: SimpleChanges = {
      instrumentId: new SimpleChange('OLD_INST', 'NEW_INST', false),
    };

    // Act
    component.ngOnChanges(changes);

    // Assert
    expect(component.errorCodeList()).toEqual([]);
    expect(component.paginatedData()).toEqual([]);
    expect(component.totalItems()).toBe(0);
    expect(component.hasLoadedData()).toBe(false);
    expect(component.searchText()).toBe('');
    expect(component.pageIndex()).toBe(0);
    expect(component.filterChips).toEqual([]);
  });

  it('should not reset state when unrelated inputs change via ngOnChanges', () => {
    // Arrange
    component.searchText.set('preserved');
    component.pageIndex.set(3);

    const changes: SimpleChanges = {
      someOtherInput: new SimpleChange('A', 'B', false),
    };

    // Act
    component.ngOnChanges(changes);

    // Assert
    expect(component.searchText()).toBe('preserved');
    expect(component.pageIndex()).toBe(3);
  });

  it('should not load machine test IDs when instrumentId is missing', () => {
    // Arrange
    component.instrumentId = '';

    // Act
    component.loadMachineTestIds();

    // Assert
    expect(mockService.getMachineTestIds).not.toHaveBeenCalled();
  });

  it('should not load error codes when chapterId is missing', () => {
    // Arrange
    component.chapterId = '';

    // Act
    component.loadErrorCodes();

    // Assert
    expect(mockService.filterErrorCodes).not.toHaveBeenCalled();
  });

  it('should handle non-array response data in loadErrorCodes', () => {
    // Arrange
    mockService.filterErrorCodes.and.returnValue(of({ data: null as any, total: 0 }));

    // Act
    component.loadErrorCodes();

    // Assert
    expect(component.paginatedData()).toEqual([]);
    expect(component.totalItems()).toBe(0);
    expect(component.hasLoadedData()).toBe(true);
    expect(component.loading()).toBe(false);
  });

  it('should handle missing total in loadErrorCodes response', () => {
    // Arrange
    mockService.filterErrorCodes.and.returnValue(of({ data: mockErrorCodes, total: undefined as any }));

    // Act
    component.loadErrorCodes();

    // Assert
    expect(component.paginatedData()).toEqual(mockErrorCodes);
    expect(component.totalItems()).toBe(0);
    expect(component.hasLoadedData()).toBe(true);
  });

  it('should pass correct pagination skip when pageIndex > 0', () => {
    // Arrange
    component.pageIndex.set(2);
    component.pageSize.set(10);

    // Act
    component.loadErrorCodes();

    // Assert
    expect(mockService.filterErrorCodes).toHaveBeenCalledWith(10, 20, jasmine.any(Object));
  });

  it('should set sortDirection to asc when sorting a new column', () => {
    // Arrange
    component.sortColumn.set('machineTestId');
    component.sortDirection.set('desc');

    // Act
    component.onSort('errorCode');

    // Assert
    expect(component.sortColumn()).toBe('errorCode');
    expect(component.sortDirection()).toBe('asc');
    expect(component.pageIndex()).toBe(0);
  });

  it('should cycle from empty sortDirection to asc for same column', () => {
    // Arrange
    component.sortColumn.set('errorCode');
    component.sortDirection.set('');

    // Act
    component.onSort('errorCode');

    // Assert
    expect(component.sortDirection()).toBe('asc');
  });

  it('should open add error dialog and save on result', () => {
    // Arrange
    const mockResult = { errorCode: 'E99', errorDesc: 'New error', machineTestId: 'MT001' };
    const dialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => of(mockResult)
    } as any);

    // Act
    component.openAddErrorDialog();

    // Assert
    expect(dialogOpenSpy).toHaveBeenCalled();
    const dialogConfig = dialogOpenSpy.calls.mostRecent().args[1] as any;
    expect(dialogConfig.data.mode).toBe('add');
    expect(dialogConfig.data.chapterId).toBe('DAL');
    expect(dialogConfig.data.instrumentId).toBe('S201');
    expect(mockService.addErrorCode).toHaveBeenCalledWith(mockResult, 'DAL', 'S201');
    expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('Added successfully');
  });

  it('should use default message when addErrorCode response has no message', () => {
    // Arrange
    const mockResult = { errorCode: 'E99', errorDesc: 'New error', machineTestId: 'MT001' };
    spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => of(mockResult)
    } as any);
    mockService.addErrorCode.and.returnValue(of({ message: '' }));

    // Act
    component.openAddErrorDialog();

    // Assert
    expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('New error Code E99 added successfully.');
  });

  it('should not call addErrorCode when add dialog is dismissed', () => {
    // Arrange
    spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => of(null)
    } as any);

    // Act
    component.openAddErrorDialog();

    // Assert
    expect(mockService.addErrorCode).not.toHaveBeenCalled();
  });

  it('should not call addErrorCode when add dialog returns undefined', () => {
    // Arrange
    spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => of(undefined)
    } as any);

    // Act
    component.openAddErrorDialog();

    // Assert
    expect(mockService.addErrorCode).not.toHaveBeenCalled();
  });

  it('should open edit error dialog, fetch details, and update on result', () => {
    // Arrange
    const errorCode: any = { machineTestId: 'MT001', errorCode: 'E01', errorDesc: 'Test error' };
    const updatedResult = { errorCode: 'E01', errorDesc: 'Updated error', machineTestId: 'MT001' };
    const dialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => of(updatedResult)
    } as any);

    // Act
    component.openEditErrorDialog(errorCode);

    // Assert
    expect(mockService.getErrorCodeDetails).toHaveBeenCalledWith('DAL', 'S201', 'MT001', 'E01');
    expect(component.loading()).toBe(false);
    expect(dialogOpenSpy).toHaveBeenCalled();
    const dialogConfig = dialogOpenSpy.calls.mostRecent().args[1] as any;
    expect(dialogConfig.data.mode).toBe('edit');
    expect(dialogConfig.data.errorCode).toEqual(mockErrorCodes[0]);
    expect(mockService.updateErrorCode).toHaveBeenCalledWith(updatedResult, 'DAL', 'S201');
    expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('Updated successfully');
  });

  it('should use default message when updateErrorCode response has no message', () => {
    // Arrange
    const errorCode: any = { machineTestId: 'MT001', errorCode: 'E01', errorDesc: 'Test error' };
    const updatedResult = { errorCode: 'E01', errorDesc: 'Updated error', machineTestId: 'MT001' };
    spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => of(updatedResult)
    } as any);
    mockService.updateErrorCode.and.returnValue(of({ message: '' }));

    // Act
    component.openEditErrorDialog(errorCode);

    // Assert
    expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('Error Code E01 updated successfully.');
  });

  it('should fallback to errorCode param when getErrorCodeDetails response has no item', () => {
    // Arrange
    const errorCode: any = { machineTestId: 'MT001', errorCode: 'E01', errorDesc: 'Original' };
    const dialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => of(null)
    } as any);
    mockService.getErrorCodeDetails.and.returnValue(of({ item: null }));

    // Act
    component.openEditErrorDialog(errorCode);

    // Assert
    const dialogConfig = dialogOpenSpy.calls.mostRecent().args[1] as any;
    expect(dialogConfig.data.errorCode).toEqual(errorCode);
  });

  it('should not call updateErrorCode when edit dialog is dismissed', () => {
    // Arrange
    const errorCode: any = { machineTestId: 'MT001', errorCode: 'E01', errorDesc: 'Test error' };
    spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => of(null)
    } as any);

    // Act
    component.openEditErrorDialog(errorCode);

    // Assert
    expect(mockService.updateErrorCode).not.toHaveBeenCalled();
  });

  it('should handle getErrorCodeDetails error in openEditErrorDialog', () => {
    // Arrange
    const errorCode: any = { machineTestId: 'MT001', errorCode: 'E01', errorDesc: 'Test error' };
    const dialogOpenSpy = spyOn((component as any).dialog, 'open');
    mockService.getErrorCodeDetails.and.returnValue(throwError(() => new Error('Details fetch failed')));

    // Act
    component.openEditErrorDialog(errorCode);

    // Assert
    expect(component.loading()).toBe(false);
    expect(dialogOpenSpy).not.toHaveBeenCalled();
  });

  it('should show error snackbar when updateErrorCode fails with error.errors array', () => {
    // Arrange
    const errorCode: any = { machineTestId: 'MT001', errorCode: 'E01', errorDesc: 'Test error' };
    const updatedResult = { errorCode: 'E01', errorDesc: 'Updated error', machineTestId: 'MT001' };
    spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => of(updatedResult)
    } as any);
    mockService.updateErrorCode.and.returnValue(
      throwError(() => ({ error: { errors: ['Duplicate entry', 'Invalid date'] } }))
    );

    // Act
    component.openEditErrorDialog(errorCode);

    // Assert
    expect(mockSnackbar.showError).toHaveBeenCalledWith('Duplicate entry, Invalid date');
  });

  it('should show error snackbar when updateErrorCode fails with modelErrors', () => {
    // Arrange
    const errorCode: any = { machineTestId: 'MT001', errorCode: 'E01', errorDesc: 'Test error' };
    const updatedResult = { errorCode: 'E01', errorDesc: 'Updated error', machineTestId: 'MT001' };
    spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => of(updatedResult)
    } as any);
    mockService.updateErrorCode.and.returnValue(
      throwError(() => ({
        error: {
          modelErrors: {
            errorCode: ['Error code is required'],
            machineTestId: ['Machine test ID is invalid'],
          }
        }
      }))
    );

    // Act
    component.openEditErrorDialog(errorCode);

    // Assert
    expect(mockSnackbar.showError).toHaveBeenCalledWith('Error code is required; Machine test ID is invalid');
  });

  it('should show error snackbar when updateErrorCode fails with error.message', () => {
    // Arrange
    const errorCode: any = { machineTestId: 'MT001', errorCode: 'E01', errorDesc: 'Test error' };
    const updatedResult = { errorCode: 'E01', errorDesc: 'Updated error', machineTestId: 'MT001' };
    spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => of(updatedResult)
    } as any);
    mockService.updateErrorCode.and.returnValue(
      throwError(() => ({ error: { message: 'Server validation failed' } }))
    );

    // Act
    component.openEditErrorDialog(errorCode);

    // Assert
    expect(mockSnackbar.showError).toHaveBeenCalledWith('Server validation failed');
  });

  it('should show error snackbar with err.message when updateErrorCode fails without error object', () => {
    // Arrange
    const errorCode: any = { machineTestId: 'MT001', errorCode: 'E01', errorDesc: 'Test error' };
    const updatedResult = { errorCode: 'E01', errorDesc: 'Updated error', machineTestId: 'MT001' };
    spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => of(updatedResult)
    } as any);
    mockService.updateErrorCode.and.returnValue(
      throwError(() => ({ message: 'Network error' }))
    );

    // Act
    component.openEditErrorDialog(errorCode);

    // Assert
    expect(mockSnackbar.showError).toHaveBeenCalledWith('Network error');
  });

  it('should show default error message when updateErrorCode fails with empty error', () => {
    // Arrange
    const errorCode: any = { machineTestId: 'MT001', errorCode: 'E01', errorDesc: 'Test error' };
    const updatedResult = { errorCode: 'E01', errorDesc: 'Updated error', machineTestId: 'MT001' };
    spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => of(updatedResult)
    } as any);
    mockService.updateErrorCode.and.returnValue(
      throwError(() => ({}))
    );

    // Act
    component.openEditErrorDialog(errorCode);

    // Assert
    expect(mockSnackbar.showError).toHaveBeenCalledWith('Failed to update error code.');
  });

  it('should show error snackbar with modelErrors when values are not arrays', () => {
    // Arrange
    const errorCode: any = { machineTestId: 'MT001', errorCode: 'E01', errorDesc: 'Test error' };
    const updatedResult = { errorCode: 'E01', errorDesc: 'Updated error', machineTestId: 'MT001' };
    spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => of(updatedResult)
    } as any);
    mockService.updateErrorCode.and.returnValue(
      throwError(() => ({
        error: {
          modelErrors: {
            field1: 'Single error string',
          }
        }
      }))
    );

    // Act
    component.openEditErrorDialog(errorCode);

    // Assert
    expect(mockSnackbar.showError).toHaveBeenCalledWith('Single error string');
  });

  it('should fall through to error.message when modelErrors is empty object', () => {
    // Arrange
    const errorCode: any = { machineTestId: 'MT001', errorCode: 'E01', errorDesc: 'Test error' };
    const updatedResult = { errorCode: 'E01', errorDesc: 'Updated error', machineTestId: 'MT001' };
    spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => of(updatedResult)
    } as any);
    mockService.updateErrorCode.and.returnValue(
      throwError(() => ({
        error: {
          modelErrors: {},
          message: 'Fallback message'
        }
      }))
    );

    // Act
    component.openEditErrorDialog(errorCode);

    // Assert
    expect(mockSnackbar.showError).toHaveBeenCalledWith('Fallback message');
  });

  it('should not modify filters for unknown chip key in removeFilterChip', () => {
    // Arrange
    const originalFilters = {
      machineTestId: 'MT001',
      effDatePeriod: 'after' as string | null,
      effDate: new Date('2024-01-01') as Date | null,
      termDatePeriod: null,
      termDate: null,
    };
    component.currentFilters.set(originalFilters);

    // Act
    component.removeFilterChip('unknownKey');

    // Assert
    expect(component.currentFilters().machineTestId).toBe('MT001');
    expect(component.currentFilters().effDate).toEqual(new Date('2024-01-01'));
    expect(component.pageIndex()).toBe(0);
  });

  it('should pass searchText to filterErrorCodes payload', () => {
    // Arrange
    component.searchText.set('glucose');

    // Act
    component.loadErrorCodes();

    // Assert
    expect(mockService.filterErrorCodes).toHaveBeenCalledWith(
      25,
      0,
      jasmine.objectContaining({ searchItem: 'glucose' })
    );
  });

  it('should pass filter dates to filterErrorCodes payload', () => {
    // Arrange
    component.currentFilters.set({
      machineTestId: 'MT001',
      effDatePeriod: 'after',
      effDate: new Date('2024-06-01'),
      termDatePeriod: 'before',
      termDate: new Date('2024-12-31'),
    });

    // Act
    component.loadErrorCodes();

    // Assert
    expect(mockService.filterErrorCodes).toHaveBeenCalledWith(
      25,
      0,
      jasmine.objectContaining({
        periodEffDate: 'after',
        periodTermDate: 'before',
      })
    );
  });

  it('should pass sortDirection to filterErrorCodes payload', () => {
    // Arrange
    component.sortDirection.set('asc');

    // Act
    component.loadErrorCodes();

    // Assert
    expect(mockService.filterErrorCodes).toHaveBeenCalledWith(
      25,
      0,
      jasmine.objectContaining({ sortDirection: 'asc' })
    );
  });

  it('should pass null sortDirection when empty string', () => {
    // Arrange
    component.sortDirection.set('');

    // Act
    component.loadErrorCodes();

    // Assert
    expect(mockService.filterErrorCodes).toHaveBeenCalledWith(
      25,
      0,
      jasmine.objectContaining({ sortDirection: null })
    );
  });

  it('should set loading to true before filterErrorCodes call', () => {
    // Arrange
    let loadingDuringCall = false;
    mockService.filterErrorCodes.and.callFake(() => {
      loadingDuringCall = component.loading();
      return of({ data: [], total: 0 });
    });

    // Act
    component.loadErrorCodes();

    // Assert
    expect(loadingDuringCall).toBe(true);
    expect(component.loading()).toBe(false);
  });

  it('should have correct displayedColumns', () => {
    expect(component.displayedColumns).toEqual([
      'machineTestId',
      'errorCode',
      'errorDescription',
      'skipAbort',
      'effectiveDate',
      'terminationDate',
      'actions',
    ]);
  });

  it('should have correct searchConfig', () => {
    expect(component.searchConfig.placeholder).toBe('Search by machine test ID, error code or description');
    expect(component.searchConfig.debounceTime).toBe(300);
    expect(component.searchConfig.searchOnEnterOnly).toBe(true);
    expect(component.searchConfig.minLength).toBe(1);
  });

  it('should call loadMachineTestIds when loadErrorCodes is called', () => {
    // Arrange
    spyOn(component, 'loadMachineTestIds');

    // Act
    component.loadErrorCodes();

    // Assert
    expect(component.loadMachineTestIds).toHaveBeenCalled();
  });

  it('should reload error codes after successful add', () => {
    // Arrange
    const mockResult = { errorCode: 'E99', errorDesc: 'New error', machineTestId: 'MT001' };
    spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => of(mockResult)
    } as any);
    mockService.filterErrorCodes.calls.reset();

    // Act
    component.openAddErrorDialog();

    // Assert - loadErrorCodes is called after successful add
    expect(mockService.filterErrorCodes).toHaveBeenCalled();
  });

  it('should reload error codes after successful edit update', () => {
    // Arrange
    const errorCode: any = { machineTestId: 'MT001', errorCode: 'E01', errorDesc: 'Test error' };
    const updatedResult = { errorCode: 'E01', errorDesc: 'Updated error', machineTestId: 'MT001' };
    spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => of(updatedResult)
    } as any);
    mockService.filterErrorCodes.calls.reset();

    // Act
    component.openEditErrorDialog(errorCode);

    // Assert
    expect(mockService.filterErrorCodes).toHaveBeenCalled();
  });

  it('should pass machineTestIds to add dialog data', () => {
    // Arrange
    component.machineTestIds.set(mockMachineTestIds);
    const dialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => of(null)
    } as any);

    // Act
    component.openAddErrorDialog();

    // Assert
    const dialogConfig = dialogOpenSpy.calls.mostRecent().args[1] as any;
    expect(dialogConfig.data.machineTestIds).toEqual(mockMachineTestIds);
  });

  it('should pass machineTestIds to edit dialog data', () => {
    // Arrange
    component.machineTestIds.set(mockMachineTestIds);
    const errorCode: any = { machineTestId: 'MT001', errorCode: 'E01', errorDesc: 'Test error' };
    const dialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => of(null)
    } as any);

    // Act
    component.openEditErrorDialog(errorCode);

    // Assert
    const dialogConfig = dialogOpenSpy.calls.mostRecent().args[1] as any;
    expect(dialogConfig.data.machineTestIds).toEqual(mockMachineTestIds);
  });

  it('should handle errors array with empty array in extractErrorMessage', () => {
    // Arrange
    const errorCode: any = { machineTestId: 'MT001', errorCode: 'E01', errorDesc: 'Test error' };
    const updatedResult = { errorCode: 'E01', errorDesc: 'Updated error', machineTestId: 'MT001' };
    spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => of(updatedResult)
    } as any);
    mockService.updateErrorCode.and.returnValue(
      throwError(() => ({
        error: { errors: [], message: 'Fallback to message' }
      }))
    );

    // Act
    component.openEditErrorDialog(errorCode);

    // Assert - empty errors array falls through to error.message
    expect(mockSnackbar.showError).toHaveBeenCalledWith('Fallback to message');
  });
});
