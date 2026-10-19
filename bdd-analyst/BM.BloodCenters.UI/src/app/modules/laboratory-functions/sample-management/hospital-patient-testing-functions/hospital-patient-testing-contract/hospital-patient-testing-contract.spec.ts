import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { HospitalPatientTestingContractComponent } from './hospital-patient-testing-contract';
import { HospitalPatientTestingContractService } from './services/hospital-patient-testing-contract.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { LoggingService } from '@shared/services/logging.service';
import { Overlay } from '@angular/cdk/overlay';
import { signal } from '@angular/core';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';
import { TestingContractTableModel } from './models/hospital-patient-testing-contract.model';

describe('HospitalPatientTestingContractComponent', () => {
  let component: HospitalPatientTestingContractComponent;
  let fixture: ComponentFixture<HospitalPatientTestingContractComponent>;
  let mockService: jasmine.SpyObj<HospitalPatientTestingContractService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;

  const mockContract: TestingContractTableModel = {
    contractId: 'C001',
    customerType: 'Hospital',
    chapterId: 'CH01',
    description: 'Test Contract',
    unitScheme: 'Standard',
    effDate: '2024-01-01',
    termDate: null
  };

  const mockSearchResponse = {
    data: [mockContract],
    total: 1
  };

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('HospitalPatientTestingContractService', [
      'searchContracts',
      'getActiveContracts',
      'getCustomerTypes',
      'getContractDetail',
      'getContractContacts',
      'getCompanies'
    ]);
    mockService.getActiveContracts.and.returnValue(of([]));
    mockService.getCustomerTypes.and.returnValue(of([]));
    mockService.getCompanies.and.returnValue(of([]));
    mockService.searchContracts.and.returnValue(of(mockSearchResponse));

    mockSnackbarService = createMockSnackbarService();
    mockLoggingService = jasmine.createSpyObj('LoggingService', ['error', 'warn', 'info']);

    const mockHeaderService = createMockHeaderService();
    const mockMenuService = jasmine.createSpyObj('MenuService', ['findMenuItemByPath'], {
      getMenuItemsSignal: signal([])
    });

    await TestBed.configureTestingModule({
      imports: [HospitalPatientTestingContractComponent, NoopAnimationsModule],
      providers: [
        { provide: HospitalPatientTestingContractService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: MenuService, useValue: mockMenuService },
        { provide: LoggingService, useValue: mockLoggingService },
        Overlay
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HospitalPatientTestingContractComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default signal values', () => {
    // Arrange - component already created in beforeEach

    // Act - no action needed, checking initial state

    // Assert
    expect(component.currentView()).toBe('list');
    expect(component.selectedContract()).toBeNull();
    expect(component.isLoading()).toBe(false);
    expect(component.hasSearched()).toBe(false);
    expect(component.dataSource()).toEqual([]);
  });

  it('should initialize form controls with default values', () => {
    // Arrange - component already created

    // Act - no action needed

    // Assert
    expect(component.showTerminatedCtrl.value).toBe('No');
    expect(component.contractIdControl.value).toBeNull();
    expect(component.companyControl.value).toBeNull();
    expect(component.contractSearchCtrl.value).toBe('');
    expect(component.companySearchCtrl.value).toBe('');
  });

  it('should set currentView to wizard when onAddNewContract is called', () => {
    // Arrange
    expect(component.currentView()).toBe('list');

    // Act
    component.onAddNewContract();

    // Assert
    expect(component.currentView()).toBe('wizard');
  });

  it('should set selectedContract and switch to detail view when onViewContract is called', () => {
    // Arrange
    expect(component.currentView()).toBe('list');
    expect(component.selectedContract()).toBeNull();

    // Act
    component.onViewContract(mockContract);

    // Assert
    expect(component.selectedContract()).toEqual(mockContract);
    expect(component.currentView()).toBe('detail');
  });

  it('should reset to list view and clear selectedContract when onBackToList is called', () => {
    // Arrange
    component.onViewContract(mockContract);
    expect(component.currentView()).toBe('detail');

    // Act
    component.onBackToList();

    // Assert
    expect(component.currentView()).toBe('list');
    expect(component.selectedContract()).toBeNull();
  });

  it('should reload data when onBackToList is called and hasSearched is true', () => {
    // Arrange
    component.hasSearched.set(true);
    component.onViewContract(mockContract);
    mockService.searchContracts.calls.reset();

    // Act
    component.onBackToList();

    // Assert
    expect(mockService.searchContracts).toHaveBeenCalled();
  });

  it('should not reload data when onBackToList is called and hasSearched is false', () => {
    // Arrange
    component.onViewContract(mockContract);
    mockService.searchContracts.calls.reset();

    // Act
    component.onBackToList();

    // Assert
    expect(mockService.searchContracts).not.toHaveBeenCalled();
  });

  it('should set hasSearched to true and call searchContracts when onRetrieve is called', () => {
    // Arrange
    expect(component.hasSearched()).toBe(false);

    // Act
    component.onRetrieve();

    // Assert
    expect(component.hasSearched()).toBe(true);
    expect(mockService.searchContracts).toHaveBeenCalled();
  });

  it('should show success snackbar and switch to list view when onContractCreated is called', () => {
    // Arrange
    component.currentView.set('wizard');

    // Act
    component.onContractCreated();

    // Assert
    expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Testing contract created successfully');
    expect(component.currentView()).toBe('list');
  });

  it('should show success snackbar and reload data when onContractUpdated is called with a selected contract', () => {
    // Arrange
    component.selectedContract.set(mockContract);
    mockService.searchContracts.calls.reset();

    // Act
    component.onContractUpdated();

    // Assert
    expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Testing contract updated successfully');
    expect(mockService.searchContracts).toHaveBeenCalled();
  });

  it('should reset all form controls and state when onClearAll is called', () => {
    // Arrange
    component.showTerminatedCtrl.setValue('Yes');
    component.contractIdControl.setValue('C001');
    component.companyControl.setValue('COMP1');
    component.searchTextValue = 'test search';
    component.appliedFilters = { contractId: 'C001', contractType: null, effDatePeriod: 'After', effDate: null, termDatePeriod: 'After', termDate: null };
    component.filterChips = [{ key: 'contractId', label: 'Contract: C001' }];

    // Act
    component.onClearAll();

    // Assert
    expect(component.showTerminatedCtrl.value).toBe('No');
    expect(component.contractIdControl.value).toBeNull();
    expect(component.companyControl.value).toBeNull();
    expect(component.searchTextValue).toBe('');
    expect(component.appliedFilters).toBeNull();
    expect(component.filterChips).toEqual([]);
  });

  it('should set search text and call loadData when onSearch is called and hasSearched is true', () => {
    // Arrange
    component.hasSearched.set(true);
    mockService.searchContracts.calls.reset();

    // Act
    component.onSearch('test query');

    // Assert
    expect(component.searchTextValue).toBe('test query');
    expect(mockService.searchContracts).toHaveBeenCalled();
  });

  it('should set search text but not call loadData when onSearch is called and hasSearched is false', () => {
    // Arrange
    expect(component.hasSearched()).toBe(false);
    mockService.searchContracts.calls.reset();

    // Act
    component.onSearch('test query');

    // Assert
    expect(component.searchTextValue).toBe('test query');
    expect(mockService.searchContracts).not.toHaveBeenCalled();
  });

  it('should call onViewContract when onRowAction receives a view action', () => {
    // Arrange
    spyOn(component, 'onViewContract');
    const event = { action: 'view', row: mockContract };

    // Act
    component.onRowAction(event as any);

    // Assert
    expect(component.onViewContract).toHaveBeenCalledWith(mockContract);
  });

  it('should update pagination and reload data when onPageChange is called', () => {
    // Arrange
    component.hasSearched.set(true);
    component.onRetrieve();
    mockService.searchContracts.calls.reset();

    // Act
    component.onPageChange({ pageIndex: 2, pageSize: 50 } as any);

    // Assert
    expect(component.tableConfig.pagination?.pageIndex).toBe(2);
    expect(component.tableConfig.pagination?.pageSize).toBe(50);
    expect(mockService.searchContracts).toHaveBeenCalled();
  });

  it('should update sort config and reload data when onSortChange is called', () => {
    // Arrange
    component.hasSearched.set(true);
    component.onRetrieve();
    mockService.searchContracts.calls.reset();

    // Act
    component.onSortChange({ column: 'description', direction: 'A' } as any);

    // Assert
    expect(component.tableConfig.sortConfig?.column).toBe('description');
    expect(component.tableConfig.sortConfig?.direction).toBe('A');
    expect(mockService.searchContracts).toHaveBeenCalled();
  });

  it('should set appliedFilters and filterChips and reload data when onApplyFilter is called', () => {
    // Arrange
    const filters = { contractId: 'C001', contractType: null, effDatePeriod: 'After' as const, effDate: null, termDatePeriod: 'After' as const, termDate: null };
    mockService.searchContracts.calls.reset();

    // Act
    component.onApplyFilter(filters);

    // Assert
    expect(component.appliedFilters).toEqual(filters);
    expect(mockService.searchContracts).toHaveBeenCalled();
  });

  it('should clear all filters and reload data when clearAllFilters is called', () => {
    // Arrange
    component.appliedFilters = { contractId: 'C001', contractType: null, effDatePeriod: 'After', effDate: null, termDatePeriod: 'After', termDate: null };
    component.filterChips = [{ key: 'contractId', label: 'Contract: C001' }];
    mockService.searchContracts.calls.reset();

    // Act
    component.clearAllFilters();

    // Assert
    expect(component.appliedFilters).toBeNull();
    expect(component.filterChips).toEqual([]);
    expect(mockService.searchContracts).toHaveBeenCalled();
  });

  it('should show error snackbar and log error when searchContracts fails', () => {
    // Arrange
    mockService.searchContracts.and.returnValue(throwError(() => new Error('API error')));

    // Act
    component.onRetrieve();

    // Assert
    expect(mockLoggingService.error).toHaveBeenCalledWith('Error loading contracts', jasmine.any(Error));
    expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load contracts. Please try again.');
    expect(component.isLoading()).toBe(false);
  });

  it('should populate dataSource and update totalRecords when searchContracts succeeds', () => {
    // Arrange
    const response = { data: [mockContract], total: 42 };
    mockService.searchContracts.and.returnValue(of(response));

    // Act
    component.onRetrieve();

    // Assert
    expect(component.dataSource()).toEqual([mockContract]);
    expect(component.tableConfig.pagination?.totalRecords).toBe(42);
    expect(component.isLoading()).toBe(false);
  });

  it('should initialize isFilterOpen as false and appliedFilters as null', () => {
    // Arrange - component already created

    // Act - no action needed

    // Assert
    expect(component.isFilterOpen).toBe(false);
    expect(component.appliedFilters).toBeNull();
    expect(component.filterChips).toEqual([]);
  });
});
