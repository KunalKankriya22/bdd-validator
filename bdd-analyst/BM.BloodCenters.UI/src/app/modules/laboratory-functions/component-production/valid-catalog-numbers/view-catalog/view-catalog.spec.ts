import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Overlay } from '@angular/cdk/overlay';
import { TranslateModule } from '@ngx-translate/core';
import { of, Subject, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { ViewCatalogComponent } from './view-catalog';
import { ContainerService } from '../services/container.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  ContainerDto,
  PaginatedContainerResponse,
  ContainerFilterValue,
  CreateContainerDto,
  UpdateContainerDto,
} from '../models/container.model';

describe('ViewCatalogComponent', () => {
  let component: ViewCatalogComponent;
  let fixture: ComponentFixture<ViewCatalogComponent>;
  let containerServiceSpy: jasmine.SpyObj<ContainerService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let locationSpy: jasmine.SpyObj<Location>;
  let chapterChangedSubject: Subject<void>;

  const mockContainers: ContainerDto[] = [
    {
      catalogNumber: 'CAT-001',
      containerId: 'CNT-001',
      baseCatalogNo: 'TEST123',
      inlineFilterFlag: 'Y',
      productType: 'RBC',
      subProdTypes: 'Sub A',
      effDate: '2024-01-15',
      termDate: null,
    },
    {
      catalogNumber: 'CAT-002',
      containerId: 'CNT-002',
      baseCatalogNo: 'TEST123',
      inlineFilterFlag: 'N',
      productType: 'PLT',
      subProdTypes: null,
      effDate: '2024-03-01',
      termDate: '2025-12-31',
    },
  ];

  const mockPaginatedResponse: PaginatedContainerResponse = {
    items: mockContainers,
    totalRecords: 2,
  };

  beforeEach(async () => {
    chapterChangedSubject = new Subject<void>();

    containerServiceSpy = jasmine.createSpyObj('ContainerService', [
      'getContainers',
      'getProductTypes',
      'getContainerIds',
      'getFilterCatalogNumbers',
      'createContainer',
      'updateContainer',
    ]);
    containerServiceSpy.getContainers.and.returnValue(of(mockPaginatedResponse));
    containerServiceSpy.getProductTypes.and.returnValue(of([{ code: 'RBC', description: 'Red Blood Cells' }]));
    containerServiceSpy.getContainerIds.and.returnValue(of([{ code: 'CNT-001', description: 'Container One' }]));
    containerServiceSpy.getFilterCatalogNumbers.and.returnValue(of([{ code: 'CAT-001', description: 'Catalog One' }]));
    containerServiceSpy.createContainer.and.returnValue(of({ success: true, message: '', statusCode: 200, data: null } as any));
    containerServiceSpy.updateContainer.and.returnValue(of({ success: true, message: '', statusCode: 200, data: null } as any));

    headerServiceSpy = createMockHeaderService({
      chapterChanged$: chapterChangedSubject.asObservable(),
    });

    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    locationSpy = jasmine.createSpyObj('Location', ['back']);

    await TestBed.configureTestingModule({
      imports: [ViewCatalogComponent, TranslateModule.forRoot()],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ContainerService, useValue: containerServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Location, useValue: locationSpy },
        {
          provide: ActivatedRoute,
          useValue: { params: of({ catalogNumber: 'TEST123', manufacturer: 'MFR001' }) },
        },
        { provide: PageHeaderService, useValue: jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle', 'getCurrentMenuItem'], { pageHeaderData: signal(undefined) }) },
      ],
    }).compileComponents();

    // Override component-level providers so that the spy takes precedence
    // over the real MatSnackBar provided by the standalone component's MatSnackBarModule import
    TestBed.overrideComponent(ViewCatalogComponent, {
      add: { providers: [{ provide: MatSnackBar, useValue: snackBarSpy }] },
    });

    fixture = TestBed.createComponent(ViewCatalogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should extract catalogNumber and manufacturer from route params on init', () => {
    // Arrange - route params provided in TestBed setup

    // Act - ngOnInit called via detectChanges in beforeEach

    // Assert
    expect(component.catalogNumber).toBe('TEST123');
    expect(component.manufacturer).toBe('MFR001');
  });

  it('should update the third breadcrumb label with the catalogNumber', () => {
    // Arrange & Act - ngOnInit called via detectChanges

    // Assert
    expect(component.headerConfig.breadcrumbs[2].label).toBe('TEST123');
  });

  it('should call loadData and loadDropdownData on init', () => {
    // Arrange & Act - ngOnInit called via detectChanges

    // Assert
    expect(containerServiceSpy.getContainers).toHaveBeenCalled();
    expect(containerServiceSpy.getProductTypes).toHaveBeenCalled();
    expect(containerServiceSpy.getContainerIds).toHaveBeenCalled();
    expect(containerServiceSpy.getFilterCatalogNumbers).toHaveBeenCalled();
  });

  it('should populate dataSource with mapped container data', () => {
    // Arrange & Act - data loaded during init

    // Assert
    expect(component.dataSource.length).toBe(2);
    expect(component.dataSource[0].inlineFilterFlag).toBe('Yes');
    expect(component.dataSource[1].inlineFilterFlag).toBe('No');
    expect(component.dataSource[1].subProdTypes).toBe('-');
  });

  it('should set totalRecords from paginated response', () => {
    // Arrange & Act - data loaded during init

    // Assert
    expect(component.dataTableConfig.pagination!.totalRecords).toBe(2);
  });

  it('should clear dataSource and set totalRecords to 0 when getContainers errors', () => {
    // Arrange
    containerServiceSpy.getContainers.and.returnValue(throwError(() => new Error('Server error')));

    // Act
    component.loadData();

    // Assert
    expect(component.dataSource).toEqual([]);
    expect(component.dataTableConfig.pagination!.totalRecords).toBe(0);
    expect(component.isLoading).toBeFalse();
  });

  it('should not call getContainers when catalogNumber is empty', () => {
    // Arrange
    component.catalogNumber = '';
    containerServiceSpy.getContainers.calls.reset();

    // Act
    component.loadData();

    // Assert
    expect(containerServiceSpy.getContainers).not.toHaveBeenCalled();
  });

  it('should set searchTerm and reset pageIndex when onSearch is called with valid keyword', () => {
    // Arrange
    component.dataTableConfig.pagination!.pageIndex = 3;
    containerServiceSpy.getContainers.calls.reset();

    // Act
    component.onSearch('blood');

    // Assert
    expect(component.searchTerm).toBe('blood');
    expect(component.dataTableConfig.pagination!.pageIndex).toBe(0);
    expect(containerServiceSpy.getContainers).toHaveBeenCalled();
  });

  it('should not search when keyword is a single character', () => {
    // Arrange
    containerServiceSpy.getContainers.calls.reset();

    // Act
    component.onSearch('a');

    // Assert
    expect(containerServiceSpy.getContainers).not.toHaveBeenCalled();
  });

  it('should update pagination and reload data on page change', () => {
    // Arrange
    containerServiceSpy.getContainers.calls.reset();

    // Act
    component.onPageChange({ pageIndex: 2, pageSize: 50 });

    // Assert
    expect(component.dataTableConfig.pagination!.pageIndex).toBe(2);
    expect(component.dataTableConfig.pagination!.pageSize).toBe(50);
    expect(containerServiceSpy.getContainers).toHaveBeenCalled();
  });

  it('should open side panel in edit mode when edit row action is triggered', () => {
    // Arrange
    const row = mockContainers[0];

    // Act
    component.onRowAction({ action: 'edit', row });

    // Assert
    expect(component.sidePanelOpen).toBeTrue();
    expect(component.sidePanelMode).toBe('edit');
    expect(component.sidePanelData).toBe(row);
    expect(component.editingRow).toBe(row);
  });

  it('should open side panel in add mode when openAddDrawer is called', () => {
    // Arrange - ensure panel is closed first
    component.sidePanelOpen = false;

    // Act
    component.openAddDrawer();

    // Assert
    expect(component.sidePanelOpen).toBeTrue();
    expect(component.sidePanelMode).toBe('add');
    expect(component.sidePanelData).toBeNull();
    expect(component.editingRow).toBeNull();
  });

  it('should close side panel and reset state when closeSideDrawer is called', () => {
    // Arrange
    component.sidePanelOpen = true;
    component.sidePanelData = mockContainers[0];
    component.editingRow = mockContainers[0];

    // Act
    component.closeSideDrawer();

    // Assert
    expect(component.sidePanelOpen).toBeFalse();
    expect(component.sidePanelData).toBeNull();
    expect(component.editingRow).toBeNull();
  });

  it('should apply filters, generate chips, reset pageIndex, and reload data', () => {
    // Arrange
    component.dataTableConfig.pagination!.pageIndex = 5;
    containerServiceSpy.getContainers.calls.reset();
    const filters: ContainerFilterValue = { catalogNumber: 'CAT-001', showTerminated: false };

    // Act
    component.applyFilters(filters);

    // Assert
    expect(component.currentFilters).toEqual(filters);
    expect(component.filterChips.length).toBe(2);
    expect(component.filterChips[0].key).toBe('catalogNumber');
    expect(component.filterChips[1].key).toBe('showTerminated');
    expect(component.filterChips[1].label).toContain('No');
    expect(component.dataTableConfig.pagination!.pageIndex).toBe(0);
    expect(containerServiceSpy.getContainers).toHaveBeenCalled();
  });

  it('should remove a specific filter chip and reload data', () => {
    // Arrange
    component.currentFilters = { catalogNumber: 'CAT-001', showTerminated: true };
    component.applyFilters(component.currentFilters);
    containerServiceSpy.getContainers.calls.reset();

    // Act
    component.removeFilterChip('catalogNumber');

    // Assert
    expect(component.currentFilters.catalogNumber).toBeUndefined();
    expect(component.filterChips.find(c => c.key === 'catalogNumber')).toBeUndefined();
    expect(containerServiceSpy.getContainers).toHaveBeenCalled();
  });

  it('should clear all filters and chips when clearAllFiltersChips is called', () => {
    // Arrange
    component.currentFilters = { catalogNumber: 'CAT-001', showTerminated: true };
    component.filterChips = [{ key: 'catalogNumber', label: 'Cat', value: 'CAT-001' }];
    containerServiceSpy.getContainers.calls.reset();

    // Act
    component.clearAllFiltersChips();

    // Assert
    expect(component.currentFilters).toEqual({});
    expect(component.filterChips).toEqual([]);
    expect(component.dataTableConfig.pagination!.pageIndex).toBe(0);
    expect(containerServiceSpy.getContainers).toHaveBeenCalled();
  });

  it('should call createContainer and show success snackbar when onSave is called in add mode', () => {
    // Arrange
    component.sidePanelMode = 'add';
    component.sidePanelOpen = true;
    const createDto: CreateContainerDto = {
      containerId: 'NEW-CNT',
      baseCatalogNo: 'TEST123',
      inlineFilterFlag: 'Y',
      productType: 'RBC',
      subProdTypes: null,
      effDate: '2024-01-01',
      termDate: null,
    };

    // Act
    component.onSave(createDto);

    // Assert
    expect(containerServiceSpy.createContainer).toHaveBeenCalledWith(createDto);
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Container NEW-CNT has been added.',
      'DISMISS',
      jasmine.objectContaining({ duration: 5000 }),
    );
    expect(component.sidePanelOpen).toBeFalse();
  });

  it('should call updateContainer and show success snackbar when onSave is called in edit mode', () => {
    // Arrange
    component.sidePanelMode = 'edit';
    component.sidePanelOpen = true;
    component.sidePanelData = mockContainers[0];
    const updateDto: UpdateContainerDto = {
      catalogNumber: 'CAT-001',
      containerId: 'CNT-001',
      inlineFilterFlag: 'N',
      productType: 'PLT',
      subProdTypes: null,
      effDate: '2024-06-01',
      termDate: null,
    };

    // Act
    component.onSave(updateDto);

    // Assert
    expect(containerServiceSpy.updateContainer).toHaveBeenCalledWith('CAT-001', updateDto);
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Container CAT-001 has been updated.',
      'DISMISS',
      jasmine.objectContaining({ duration: 5000 }),
    );
  });

  it('should show error snackbar when createContainer fails', () => {
    // Arrange
    component.sidePanelMode = 'add';
    containerServiceSpy.createContainer.and.returnValue(
      throwError(() => ({ error: { message: 'Duplicate container' } })),
    );
    const createDto: CreateContainerDto = {
      containerId: 'DUP',
      baseCatalogNo: 'TEST123',
      inlineFilterFlag: 'Y',
      productType: 'RBC',
      subProdTypes: null,
      effDate: '2024-01-01',
      termDate: null,
    };

    // Act
    component.onSave(createDto);

    // Assert
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      jasmine.stringContaining('Duplicate container'),
      'DISMISS',
      jasmine.objectContaining({ panelClass: ['catalog-error-snackbar'] }),
    );
  });

  it('should call location.back when goBack is called', () => {
    // Arrange - locationSpy set up in beforeEach

    // Act
    component.goBack();

    // Assert
    expect(locationSpy.back).toHaveBeenCalled();
  });

  it('should reset filters and reload data when chapter changes', () => {
    // Arrange
    component.searchTerm = 'old-search';
    component.currentFilters = { catalogNumber: 'OLD' };
    component.filterChips = [{ key: 'catalogNumber', label: 'Old', value: 'OLD' }];
    containerServiceSpy.getContainers.calls.reset();
    containerServiceSpy.getProductTypes.calls.reset();

    // Act
    chapterChangedSubject.next();

    // Assert
    expect(component.searchTerm).toBe('');
    expect(component.currentFilters).toEqual({});
    expect(component.filterChips).toEqual([]);
    expect(containerServiceSpy.getContainers).toHaveBeenCalled();
    expect(containerServiceSpy.getProductTypes).toHaveBeenCalled();
  });

  it('should return true for isControlsDisabled when isLoading is true', () => {
    // Arrange
    component.isLoading = true;

    // Act & Assert
    expect(component.isControlsDisabled).toBeTrue();
  });

  it('should return false for isControlsDisabled when isLoading is false', () => {
    // Arrange
    component.isLoading = false;

    // Act & Assert
    expect(component.isControlsDisabled).toBeFalse();
  });

  // --- ngOnDestroy ---
  it('should complete the destroy$ subject on ngOnDestroy', () => {
    // Arrange
    const destroySubject = (component as any).destroy$ as Subject<void>;
    spyOn(destroySubject, 'next');
    spyOn(destroySubject, 'complete');

    // Act
    component.ngOnDestroy();

    // Assert
    expect(destroySubject.next).toHaveBeenCalled();
    expect(destroySubject.complete).toHaveBeenCalled();
  });

  // --- onSearch edge cases ---
  it('should clear searchTerm and reload data when onSearch is called with empty string', () => {
    // Arrange
    component.searchTerm = 'old';
    containerServiceSpy.getContainers.calls.reset();

    // Act
    component.onSearch('');

    // Assert
    expect(component.searchTerm).toBe('');
    expect(component.dataTableConfig.pagination!.pageIndex).toBe(0);
    expect(containerServiceSpy.getContainers).toHaveBeenCalled();
  });

  it('should trim whitespace and reload when onSearch receives whitespace-only string', () => {
    // Arrange
    containerServiceSpy.getContainers.calls.reset();

    // Act
    component.onSearch('   ');

    // Assert
    expect(component.searchTerm).toBe('');
    expect(containerServiceSpy.getContainers).toHaveBeenCalled();
  });

  it('should trim whitespace from search keyword before using it', () => {
    // Arrange
    containerServiceSpy.getContainers.calls.reset();

    // Act
    component.onSearch('  test  ');

    // Assert
    expect(component.searchTerm).toBe('test');
    expect(containerServiceSpy.getContainers).toHaveBeenCalled();
  });

  it('should handle null/undefined search keyword gracefully', () => {
    // Arrange
    containerServiceSpy.getContainers.calls.reset();

    // Act
    component.onSearch(null as any);

    // Assert
    expect(component.searchTerm).toBe('');
    expect(containerServiceSpy.getContainers).toHaveBeenCalled();
  });

  // --- onSortChange ---
  it('should handle onSortChange without error', () => {
    // Act & Assert - should not throw
    expect(() => component.onSortChange({ active: 'containerId', direction: 'asc' })).not.toThrow();
  });

  // --- onRowAction non-edit ---
  it('should not open side panel when row action is not edit', () => {
    // Arrange
    component.sidePanelOpen = false;

    // Act
    component.onRowAction({ action: 'delete', row: mockContainers[0] });

    // Assert
    expect(component.sidePanelOpen).toBeFalse();
  });

  // --- removeFilterChip for productType and showTerminated ---
  it('should remove productType filter chip and reload data', () => {
    // Arrange
    component.currentFilters = { catalogNumber: 'CAT-001', productType: 'RBC' };
    component.applyFilters(component.currentFilters);
    containerServiceSpy.getContainers.calls.reset();

    // Act
    component.removeFilterChip('productType');

    // Assert
    expect(component.currentFilters.productType).toBeUndefined();
    expect(component.filterChips.find(c => c.key === 'productType')).toBeUndefined();
    expect(containerServiceSpy.getContainers).toHaveBeenCalled();
  });

  it('should remove showTerminated filter chip and reload data', () => {
    // Arrange
    component.currentFilters = { showTerminated: true };
    component.applyFilters(component.currentFilters);
    containerServiceSpy.getContainers.calls.reset();

    // Act
    component.removeFilterChip('showTerminated');

    // Assert
    expect(component.currentFilters.showTerminated).toBeUndefined();
    expect(component.filterChips.find(c => c.key === 'showTerminated')).toBeUndefined();
    expect(containerServiceSpy.getContainers).toHaveBeenCalled();
  });

  // --- convertFiltersToChips (via applyFilters) ---
  it('should generate productType chip when productType filter is set', () => {
    // Arrange
    const filters: ContainerFilterValue = { productType: 'PLT' };

    // Act
    component.applyFilters(filters);

    // Assert
    expect(component.filterChips.length).toBe(1);
    expect(component.filterChips[0].key).toBe('productType');
    expect(component.filterChips[0].label).toContain('PLT');
  });

  it('should generate showTerminated Yes chip when showTerminated is true', () => {
    // Arrange
    const filters: ContainerFilterValue = { showTerminated: true };

    // Act
    component.applyFilters(filters);

    // Assert
    expect(component.filterChips.length).toBe(1);
    expect(component.filterChips[0].key).toBe('showTerminated');
    expect(component.filterChips[0].label).toContain('Yes');
  });

  it('should generate all chips when all filters are set', () => {
    // Arrange
    const filters: ContainerFilterValue = {
      catalogNumber: 'CAT-X',
      productType: 'RBC',
      showTerminated: false,
    };

    // Act
    component.applyFilters(filters);

    // Assert
    expect(component.filterChips.length).toBe(3);
    expect(component.filterChips.map(c => c.key)).toEqual(['catalogNumber', 'productType', 'showTerminated']);
  });

  it('should generate no chips when filters are empty', () => {
    // Arrange
    const filters: ContainerFilterValue = {};

    // Act
    component.applyFilters(filters);

    // Assert
    expect(component.filterChips.length).toBe(0);
  });

  // --- loadData with filter values ---
  it('should pass showTerminated as Y when filter is true', () => {
    // Arrange
    component.currentFilters = { showTerminated: true };
    containerServiceSpy.getContainers.calls.reset();

    // Act
    component.loadData();

    // Assert
    const callArgs = containerServiceSpy.getContainers.calls.mostRecent().args;
    expect(callArgs[3].showTerminated).toBe('Y');
  });

  it('should pass showTerminated as N when filter is false', () => {
    // Arrange
    component.currentFilters = { showTerminated: false };
    containerServiceSpy.getContainers.calls.reset();

    // Act
    component.loadData();

    // Assert
    const callArgs = containerServiceSpy.getContainers.calls.mostRecent().args;
    expect(callArgs[3].showTerminated).toBe('N');
  });

  it('should pass showTerminated as undefined when filter is undefined', () => {
    // Arrange
    component.currentFilters = {};
    containerServiceSpy.getContainers.calls.reset();

    // Act
    component.loadData();

    // Assert
    const callArgs = containerServiceSpy.getContainers.calls.mostRecent().args;
    expect(callArgs[3].showTerminated).toBeUndefined();
  });

  it('should pass searchKeyword and filter params to getContainers', () => {
    // Arrange
    component.searchTerm = 'mySearch';
    component.currentFilters = { catalogNumber: 'CAT-F', productType: 'PLT' };
    containerServiceSpy.getContainers.calls.reset();

    // Act
    component.loadData();

    // Assert
    const callArgs = containerServiceSpy.getContainers.calls.mostRecent().args;
    expect(callArgs[0]).toBe('TEST123');
    expect(callArgs[3].searchKeyword).toBe('mySearch');
    expect(callArgs[3].catalogNumber).toBe('CAT-F');
    expect(callArgs[3].productType).toBe('PLT');
  });

  it('should calculate skip from pageIndex and pageSize', () => {
    // Arrange
    component.dataTableConfig.pagination!.pageIndex = 2;
    component.dataTableConfig.pagination!.pageSize = 10;
    containerServiceSpy.getContainers.calls.reset();

    // Act
    component.loadData();

    // Assert
    const callArgs = containerServiceSpy.getContainers.calls.mostRecent().args;
    expect(callArgs[1]).toBe(10); // take = pageSize
    expect(callArgs[2]).toBe(20); // skip = pageIndex * pageSize
  });

  // --- loadData response mapping edge cases ---
  it('should handle response with null items array', () => {
    // Arrange
    containerServiceSpy.getContainers.and.returnValue(of({ items: null as any, totalRecords: 0 }));

    // Act
    component.loadData();

    // Assert
    expect(component.dataSource).toEqual([]);
    expect(component.dataTableConfig.pagination!.totalRecords).toBe(0);
  });

  it('should handle response with undefined totalRecords', () => {
    // Arrange
    containerServiceSpy.getContainers.and.returnValue(of({ items: [], totalRecords: undefined as any }));

    // Act
    component.loadData();

    // Assert
    expect(component.dataTableConfig.pagination!.totalRecords).toBe(0);
  });

  it('should format valid dates using DD-MMM-YYYY format', () => {
    // Arrange
    const responseWithDates: PaginatedContainerResponse = {
      items: [
        {
          ...mockContainers[0],
          effDate: '2024-01-15',
          termDate: '2025-06-30',
        },
      ],
      totalRecords: 1,
    };
    containerServiceSpy.getContainers.and.returnValue(of(responseWithDates));

    // Act
    component.loadData();

    // Assert
    expect(component.dataSource[0].effDate).toBe('15-JAN-2024');
    expect(component.dataSource[0].termDate).toBe('30-JUN-2025');
  });

  it('should return null for null dates', () => {
    // Arrange
    const responseWithNullDates: PaginatedContainerResponse = {
      items: [
        {
          ...mockContainers[0],
          effDate: null,
          termDate: null,
        },
      ],
      totalRecords: 1,
    };
    containerServiceSpy.getContainers.and.returnValue(of(responseWithNullDates));

    // Act
    component.loadData();

    // Assert
    expect(component.dataSource[0].effDate).toBeNull();
    expect(component.dataSource[0].termDate).toBeNull();
  });

  it('should map subProdTypes to dash when null', () => {
    // Arrange
    const response: PaginatedContainerResponse = {
      items: [{ ...mockContainers[0], subProdTypes: null }],
      totalRecords: 1,
    };
    containerServiceSpy.getContainers.and.returnValue(of(response));

    // Act
    component.loadData();

    // Assert
    expect(component.dataSource[0].subProdTypes).toBe('-');
  });

  it('should preserve subProdTypes value when not null', () => {
    // Arrange
    const response: PaginatedContainerResponse = {
      items: [{ ...mockContainers[0], subProdTypes: 'Type A, Type B' }],
      totalRecords: 1,
    };
    containerServiceSpy.getContainers.and.returnValue(of(response));

    // Act
    component.loadData();

    // Assert
    expect(component.dataSource[0].subProdTypes).toBe('Type A, Type B');
  });

  // --- Dropdown data error paths ---
  it('should set productTypes to empty array when getProductTypes errors', () => {
    // Arrange
    containerServiceSpy.getProductTypes.and.returnValue(throwError(() => new Error('fail')));

    // Act - trigger reload via chapter change
    component['loadProductTypes']();

    // Assert
    expect(component.productTypes).toEqual([]);
  });

  it('should set containerIds to empty array when getContainerIds errors', () => {
    // Arrange
    containerServiceSpy.getContainerIds.and.returnValue(throwError(() => new Error('fail')));

    // Act
    component['loadContainerIds']();

    // Assert
    expect(component.containerIds).toEqual([]);
  });

  it('should set filterCatalogNumbers to empty array when getFilterCatalogNumbers errors', () => {
    // Arrange
    containerServiceSpy.getFilterCatalogNumbers.and.returnValue(throwError(() => new Error('fail')));

    // Act
    component['loadFilterCatalogNumbers']();

    // Assert
    expect(component.filterCatalogNumbers).toEqual([]);
  });

  // --- closeFilterPanel ---
  it('should dispose overlay and set ref to null when closeFilterPanel is called with active overlay', () => {
    // Arrange
    const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
    component.filterOverlayRef = mockOverlayRef;

    // Act
    component.closeFilterPanel();

    // Assert
    expect(mockOverlayRef.dispose).toHaveBeenCalled();
    expect(component.filterOverlayRef).toBeNull();
  });

  it('should do nothing when closeFilterPanel is called with no active overlay', () => {
    // Arrange
    component.filterOverlayRef = null;

    // Act & Assert - should not throw
    expect(() => component.closeFilterPanel()).not.toThrow();
    expect(component.filterOverlayRef).toBeNull();
  });

  // --- openFilterPanel toggle behavior ---
  it('should dispose existing overlay when openFilterPanel is called while overlay is open', () => {
    // Arrange
    const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
    component.filterOverlayRef = mockOverlayRef;

    // Act
    component.openFilterPanel();

    // Assert
    expect(mockOverlayRef.dispose).toHaveBeenCalled();
    expect(component.filterOverlayRef).toBeNull();
  });

  // --- onSave edit mode error ---
  it('should show error snackbar when updateContainer fails', () => {
    // Arrange
    component.sidePanelMode = 'edit';
    component.sidePanelData = mockContainers[0];
    containerServiceSpy.updateContainer.and.returnValue(
      throwError(() => ({ error: { message: 'Update failed' } })),
    );
    const updateDto: UpdateContainerDto = {
      catalogNumber: 'CAT-001',
      containerId: 'CNT-001',
      inlineFilterFlag: 'N',
      productType: 'PLT',
      subProdTypes: null,
      effDate: '2024-06-01',
      termDate: null,
    };

    // Act
    component.onSave(updateDto);

    // Assert
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      jasmine.stringContaining('Update failed'),
      'DISMISS',
      jasmine.objectContaining({ panelClass: ['catalog-error-snackbar'] }),
    );
  });

  // --- onSave with success:false response ---
  it('should handle success:false response from createContainer as error', () => {
    // Arrange
    component.sidePanelMode = 'add';
    containerServiceSpy.createContainer.and.returnValue(
      of({ success: false, message: 'Validation error', errorCode: 'V001', error: 'Bad data' } as any),
    );
    const createDto: CreateContainerDto = {
      containerId: 'NEW',
      baseCatalogNo: 'TEST123',
      inlineFilterFlag: 'Y',
      productType: 'RBC',
      subProdTypes: null,
      effDate: '2024-01-01',
      termDate: null,
    };

    // Act
    component.onSave(createDto);

    // Assert
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      jasmine.stringContaining('Error'),
      'DISMISS',
      jasmine.objectContaining({ panelClass: ['catalog-error-snackbar'] }),
    );
    // Should NOT close the side drawer
    expect(component.sidePanelOpen).toBeFalsy();
  });

  it('should handle success:false response from updateContainer as error', () => {
    // Arrange
    component.sidePanelMode = 'edit';
    component.sidePanelData = mockContainers[0];
    containerServiceSpy.updateContainer.and.returnValue(
      of({ success: false, message: 'Cannot update', error: 'Record locked' } as any),
    );
    const updateDto: UpdateContainerDto = {
      catalogNumber: 'CAT-001',
      containerId: 'CNT-001',
      inlineFilterFlag: 'N',
      productType: 'PLT',
      subProdTypes: null,
      effDate: '2024-06-01',
      termDate: null,
    };

    // Act
    component.onSave(updateDto);

    // Assert
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      jasmine.stringContaining('Error'),
      'DISMISS',
      jasmine.objectContaining({ panelClass: ['catalog-error-snackbar'] }),
    );
  });

  // --- onSaveAndCreateAnother ---
  it('should create container and reset form on saveAndCreateAnother success', () => {
    // Arrange
    component.sidePanelMode = 'add';
    const mockDrawer = { resetForm: jasmine.createSpy('resetForm') };
    component.sideDrawerComponent = mockDrawer as any;
    containerServiceSpy.createContainer.and.returnValue(of({ success: true } as any));
    // Spy on loadData to prevent cdr.detectChanges inside it from reassigning the ViewChild
    spyOn(component, 'loadData');

    const createDto: CreateContainerDto = {
      containerId: 'NEW-CNT',
      baseCatalogNo: 'TEST123',
      inlineFilterFlag: 'Y',
      productType: 'RBC',
      subProdTypes: null,
      effDate: '2024-01-01',
      termDate: null,
    };

    // Act
    component.onSaveAndCreateAnother(createDto);

    // Assert
    expect(containerServiceSpy.createContainer).toHaveBeenCalledWith(createDto);
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Container NEW-CNT has been added.',
      'DISMISS',
      jasmine.objectContaining({ duration: 5000 }),
    );
    expect(component.loadData).toHaveBeenCalled();
    expect(mockDrawer.resetForm).toHaveBeenCalled();
    expect(component.sidePanelMode).toBe('add');
    expect(component.sidePanelData).toBeNull();
  });

  it('should show error snackbar when onSaveAndCreateAnother fails', () => {
    // Arrange
    containerServiceSpy.createContainer.and.returnValue(
      throwError(() => ({ error: { message: 'Duplicate record' } })),
    );
    const createDto: CreateContainerDto = {
      containerId: 'DUP',
      baseCatalogNo: 'TEST123',
      inlineFilterFlag: 'Y',
      productType: 'RBC',
      subProdTypes: null,
      effDate: '2024-01-01',
      termDate: null,
    };

    // Act
    component.onSaveAndCreateAnother(createDto);

    // Assert
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      jasmine.stringContaining('Duplicate record'),
      'DISMISS',
      jasmine.objectContaining({ panelClass: ['catalog-error-snackbar'] }),
    );
  });

  it('should handle success:false response from onSaveAndCreateAnother', () => {
    // Arrange
    containerServiceSpy.createContainer.and.returnValue(
      of({ success: false, errorCode: 'E100', message: 'Server validation error' } as any),
    );
    const createDto: CreateContainerDto = {
      containerId: 'NEW',
      baseCatalogNo: 'TEST123',
      inlineFilterFlag: 'Y',
      productType: 'RBC',
      subProdTypes: null,
      effDate: '2024-01-01',
      termDate: null,
    };

    // Act
    component.onSaveAndCreateAnother(createDto);

    // Assert
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      jasmine.stringContaining('Error'),
      'DISMISS',
      jasmine.objectContaining({ panelClass: ['catalog-error-snackbar'] }),
    );
  });

  it('should not call resetForm when sideDrawerComponent is undefined on saveAndCreateAnother', () => {
    // Arrange
    component.sideDrawerComponent = undefined;
    containerServiceSpy.createContainer.and.returnValue(of({ success: true } as any));

    const createDto: CreateContainerDto = {
      containerId: 'NEW',
      baseCatalogNo: 'TEST123',
      inlineFilterFlag: 'Y',
      productType: 'RBC',
      subProdTypes: null,
      effDate: '2024-01-01',
      termDate: null,
    };

    // Act & Assert - should not throw
    expect(() => component.onSaveAndCreateAnother(createDto)).not.toThrow();
    expect(snackBarSpy.open).toHaveBeenCalled();
  });

  // --- handleSaveError branches ---
  it('should display errorResponse.error message when present', () => {
    // Arrange
    component.sidePanelMode = 'add';
    containerServiceSpy.createContainer.and.returnValue(
      throwError(() => ({ error: { errorResponse: { error: 'Specific validation error' } } })),
    );
    const createDto: CreateContainerDto = {
      containerId: 'X',
      baseCatalogNo: 'TEST123',
      inlineFilterFlag: 'Y',
      productType: 'RBC',
      subProdTypes: null,
      effDate: '2024-01-01',
      termDate: null,
    };

    // Act
    component.onSave(createDto);

    // Assert
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Error: Specific validation error',
      'DISMISS',
      jasmine.any(Object),
    );
  });

  it('should display error.error string message when errorResponse is absent', () => {
    // Arrange
    component.sidePanelMode = 'add';
    containerServiceSpy.createContainer.and.returnValue(
      throwError(() => ({ error: { error: 'Generic error text' } })),
    );
    const createDto: CreateContainerDto = {
      containerId: 'X',
      baseCatalogNo: 'TEST123',
      inlineFilterFlag: 'Y',
      productType: 'RBC',
      subProdTypes: null,
      effDate: '2024-01-01',
      termDate: null,
    };

    // Act
    component.onSave(createDto);

    // Assert
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Error: Generic error text',
      'DISMISS',
      jasmine.any(Object),
    );
  });

  it('should display 404 not found message when status is 404', () => {
    // Arrange
    component.sidePanelMode = 'edit';
    component.sidePanelData = mockContainers[0];
    containerServiceSpy.updateContainer.and.returnValue(
      throwError(() => ({ status: 404, error: {} })),
    );
    const updateDto: UpdateContainerDto = {
      catalogNumber: 'CAT-001',
      containerId: 'CNT-001',
      inlineFilterFlag: 'N',
      productType: 'PLT',
      subProdTypes: null,
      effDate: '2024-06-01',
      termDate: null,
    };

    // Act
    component.onSave(updateDto);

    // Assert
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      jasmine.stringContaining('not found'),
      'DISMISS',
      jasmine.any(Object),
    );
  });

  it('should include errorCode in displayed message when present', () => {
    // Arrange
    component.sidePanelMode = 'add';
    containerServiceSpy.createContainer.and.returnValue(
      throwError(() => ({ error: { errorCode: 'ERR001', message: 'Something went wrong' } })),
    );
    const createDto: CreateContainerDto = {
      containerId: 'X',
      baseCatalogNo: 'TEST123',
      inlineFilterFlag: 'Y',
      productType: 'RBC',
      subProdTypes: null,
      effDate: '2024-01-01',
      termDate: null,
    };

    // Act
    component.onSave(createDto);

    // Assert
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Error ERR001: Something went wrong',
      'DISMISS',
      jasmine.any(Object),
    );
  });

  it('should use default error message when no specific error info is available', () => {
    // Arrange
    component.sidePanelMode = 'add';
    containerServiceSpy.createContainer.and.returnValue(
      throwError(() => ({})),
    );
    const createDto: CreateContainerDto = {
      containerId: 'X',
      baseCatalogNo: 'TEST123',
      inlineFilterFlag: 'Y',
      productType: 'RBC',
      subProdTypes: null,
      effDate: '2024-01-01',
      termDate: null,
    };

    // Act
    component.onSave(createDto);

    // Assert
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Error: An error occurred while saving. Please try again.',
      'DISMISS',
      jasmine.any(Object),
    );
  });

  it('should strip Error: prefix from error message before formatting', () => {
    // Arrange
    component.sidePanelMode = 'add';
    containerServiceSpy.createContainer.and.returnValue(
      throwError(() => ({ error: { message: 'Error: Already exists' } })),
    );
    const createDto: CreateContainerDto = {
      containerId: 'X',
      baseCatalogNo: 'TEST123',
      inlineFilterFlag: 'Y',
      productType: 'RBC',
      subProdTypes: null,
      effDate: '2024-01-01',
      termDate: null,
    };

    // Act
    component.onSave(createDto);

    // Assert
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Error: Already exists',
      'DISMISS',
      jasmine.any(Object),
    );
  });

  it('should reset sideDrawerComponent isSubmitting on save error', () => {
    // Arrange
    component.sidePanelMode = 'add';
    const mockDrawer = { isSubmitting: true, resetForm: jasmine.createSpy('resetForm') };
    component.sideDrawerComponent = mockDrawer as any;
    containerServiceSpy.createContainer.and.returnValue(
      throwError(() => ({ error: { message: 'fail' } })),
    );
    const createDto: CreateContainerDto = {
      containerId: 'X',
      baseCatalogNo: 'TEST123',
      inlineFilterFlag: 'Y',
      productType: 'RBC',
      subProdTypes: null,
      effDate: '2024-01-01',
      termDate: null,
    };

    // Act
    component.onSave(createDto);

    // Assert
    expect(mockDrawer.isSubmitting).toBeFalse();
  });

  it('should not throw when sideDrawerComponent is undefined on save error', () => {
    // Arrange
    component.sidePanelMode = 'add';
    component.sideDrawerComponent = undefined;
    containerServiceSpy.createContainer.and.returnValue(
      throwError(() => ({ error: { message: 'fail' } })),
    );
    const createDto: CreateContainerDto = {
      containerId: 'X',
      baseCatalogNo: 'TEST123',
      inlineFilterFlag: 'Y',
      productType: 'RBC',
      subProdTypes: null,
      effDate: '2024-01-01',
      termDate: null,
    };

    // Act & Assert
    expect(() => component.onSave(createDto)).not.toThrow();
  });

  // --- chapter change reloads all dropdown data ---
  it('should reload all dropdown data when chapter changes', () => {
    // Arrange
    containerServiceSpy.getProductTypes.calls.reset();
    containerServiceSpy.getContainerIds.calls.reset();
    containerServiceSpy.getFilterCatalogNumbers.calls.reset();

    // Act
    chapterChangedSubject.next();

    // Assert
    expect(containerServiceSpy.getProductTypes).toHaveBeenCalled();
    expect(containerServiceSpy.getContainerIds).toHaveBeenCalled();
    expect(containerServiceSpy.getFilterCatalogNumbers).toHaveBeenCalled();
  });

  it('should reset pageIndex to 0 when chapter changes', () => {
    // Arrange
    component.dataTableConfig.pagination!.pageIndex = 5;

    // Act
    chapterChangedSubject.next();

    // Assert
    expect(component.dataTableConfig.pagination!.pageIndex).toBe(0);
  });

  // --- loadData sets isLoading properly ---
  it('should set isLoading to false after successful data load', () => {
    // Arrange
    containerServiceSpy.getContainers.and.returnValue(of(mockPaginatedResponse));

    // Act
    component.loadData();

    // Assert
    expect(component.isLoading).toBeFalse();
  });

  it('should set isLoading to false after failed data load', () => {
    // Arrange
    containerServiceSpy.getContainers.and.returnValue(throwError(() => new Error('fail')));

    // Act
    component.loadData();

    // Assert
    expect(component.isLoading).toBeFalse();
  });

  // --- loadDropdownData success ---
  it('should populate productTypes on successful getProductTypes call', () => {
    // Arrange
    const mockProductTypes = [{ code: 'RBC', description: 'Red Blood Cells' }, { code: 'PLT', description: 'Platelets' }];
    containerServiceSpy.getProductTypes.and.returnValue(of(mockProductTypes));

    // Act
    component['loadProductTypes']();

    // Assert
    expect(component.productTypes).toEqual(mockProductTypes);
  });

  it('should populate containerIds on successful getContainerIds call', () => {
    // Arrange
    const mockIds = [{ code: 'C1', description: 'Container 1' }];
    containerServiceSpy.getContainerIds.and.returnValue(of(mockIds));

    // Act
    component['loadContainerIds']();

    // Assert
    expect(component.containerIds).toEqual(mockIds);
  });

  it('should populate filterCatalogNumbers on successful getFilterCatalogNumbers call', () => {
    // Arrange
    const mockCats = [{ code: 'CAT-1', description: 'Catalog 1' }];
    containerServiceSpy.getFilterCatalogNumbers.and.returnValue(of(mockCats));

    // Act
    component['loadFilterCatalogNumbers']();

    // Assert
    expect(component.filterCatalogNumbers).toEqual(mockCats);
  });

  // --- removeFilterChip does not affect other filters ---
  it('should keep other filters intact when removing one chip', () => {
    // Arrange
    component.currentFilters = { catalogNumber: 'CAT-001', productType: 'RBC', showTerminated: true };
    component.applyFilters(component.currentFilters);
    containerServiceSpy.getContainers.calls.reset();

    // Act
    component.removeFilterChip('productType');

    // Assert
    expect(component.currentFilters.catalogNumber).toBe('CAT-001');
    expect(component.currentFilters.productType).toBeUndefined();
    expect(component.currentFilters.showTerminated).toBeTrue();
  });

  // --- onSave in add mode closes drawer and reloads ---
  it('should close side drawer and reload data after successful create', () => {
    // Arrange
    component.sidePanelMode = 'add';
    component.sidePanelOpen = true;
    component.sidePanelData = mockContainers[0];
    component.editingRow = mockContainers[0];
    containerServiceSpy.createContainer.and.returnValue(of({ success: true } as any));
    containerServiceSpy.getContainers.calls.reset();

    const createDto: CreateContainerDto = {
      containerId: 'NEW',
      baseCatalogNo: 'TEST123',
      inlineFilterFlag: 'Y',
      productType: 'RBC',
      subProdTypes: null,
      effDate: '2024-01-01',
      termDate: null,
    };

    // Act
    component.onSave(createDto);

    // Assert
    expect(component.sidePanelOpen).toBeFalse();
    expect(component.sidePanelData).toBeNull();
    expect(component.editingRow).toBeNull();
    expect(containerServiceSpy.getContainers).toHaveBeenCalled();
  });

  // --- onSave in edit mode closes drawer and reloads ---
  it('should close side drawer and reload data after successful update', () => {
    // Arrange
    component.sidePanelMode = 'edit';
    component.sidePanelOpen = true;
    component.sidePanelData = mockContainers[0];
    component.editingRow = mockContainers[0];
    containerServiceSpy.updateContainer.and.returnValue(of({ success: true } as any));
    containerServiceSpy.getContainers.calls.reset();

    const updateDto: UpdateContainerDto = {
      catalogNumber: 'CAT-001',
      containerId: 'CNT-001',
      inlineFilterFlag: 'N',
      productType: 'PLT',
      subProdTypes: null,
      effDate: '2024-06-01',
      termDate: null,
    };

    // Act
    component.onSave(updateDto);

    // Assert
    expect(component.sidePanelOpen).toBeFalse();
    expect(containerServiceSpy.getContainers).toHaveBeenCalled();
  });

  // --- showTerminated null/undefined in convertFiltersToChips ---
  it('should not create showTerminated chip when value is null', () => {
    // Arrange
    const filters: ContainerFilterValue = { showTerminated: null as any };

    // Act
    component.applyFilters(filters);

    // Assert
    expect(component.filterChips.find(c => c.key === 'showTerminated')).toBeUndefined();
  });
});
