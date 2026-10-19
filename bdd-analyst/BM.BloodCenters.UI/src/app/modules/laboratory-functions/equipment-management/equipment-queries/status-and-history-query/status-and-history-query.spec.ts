import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { PageHeaderService } from '@shared/services/page-header.service';
import { StatusAndHistoryQueryComponent } from './status-and-history-query';
import { EquipmentStatusQueryApiService } from './services/equipment-status-query-api.service';
import { of, throwError } from 'rxjs';

describe('StatusAndHistoryQueryComponent', () => {
  let component: StatusAndHistoryQueryComponent;
  let fixture: ComponentFixture<StatusAndHistoryQueryComponent>;
  let apiServiceSpy: jasmine.SpyObj<EquipmentStatusQueryApiService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;

  const emptyResult = { success: true, message: '', statusCode: 200, data: [], totalCount: 0 };

  const mockEquipTypes = [
    { code: 'FRIDGE', description: 'Refrigerator' },
    { code: 'CENT', description: 'Centrifuge' },
    { code: 'WASHER', description: 'Cell Washer' },
    { code: 'PRESS', description: 'Component Press' },
  ];

  const mockStatuses = [
    { code: 'IN', description: 'In Operation' },
    { code: 'OT', description: 'Out of Service' },
    { code: 'ST', description: 'Standby' },
  ];

  const mockEquipIds = [
    { code: 'E001', reference: 'EQ-000001', serviceDates: 'Service from: 01-15-22 to: Present' },
    { code: 'E002', reference: 'EQ-000002', serviceDates: 'Not yet in service.' },
    { code: 'E003', reference: 'EQ-000003', serviceDates: 'Service from: 03-01-24 to: 06-30-25' },
  ];

  const mockTableRow = {
    chapterId: 'OBK', equipType: 'FRIDGE', equipId: 'E001', equipReference: 'EQ-000001',
    serialNumber: 'SN-12345', location: 'CENT', status: 'IN', statusDescription: 'In Operation',
    firstProductionDate: '2024-01-15', lastProductionDate: null,
  };

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('EquipmentStatusQueryApiService', [
      'getEquipmentList', 'getEquipmentTypes', 'getEquipmentStatuses',
      'getEquipmentIds', 'getEquipmentReferences', 'getStatistics',
      'getEquipmentById', 'getEquipmentParmValues',
    ]);
    apiServiceSpy.getEquipmentTypes.and.returnValue(of({ ...emptyResult, data: mockEquipTypes, totalCount: 4 }));
    apiServiceSpy.getEquipmentStatuses.and.returnValue(of({ ...emptyResult, data: mockStatuses, totalCount: 3 }));
    apiServiceSpy.getEquipmentIds.and.returnValue(of({ ...emptyResult, data: mockEquipIds, totalCount: 3 }));
    apiServiceSpy.getEquipmentList.and.returnValue(of({ ...emptyResult, data: [mockTableRow], totalCount: 1 }));

    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle', 'getCurrentMenuItem'], {
      pageHeaderData: signal({ title: 'Status and History Query', subtitle: 'Equipment status and history query.' }),
    });

    await TestBed.configureTestingModule({
      imports: [StatusAndHistoryQueryComponent, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: EquipmentStatusQueryApiService, useValue: apiServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusAndHistoryQueryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Component lifecycle ──────────────────────────────────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load equipment types on init', () => {
    expect(apiServiceSpy.getEquipmentTypes).toHaveBeenCalled();
    expect(component.allEquipTypes().length).toBe(4);
  });

  it('should load statuses on init', () => {
    expect(apiServiceSpy.getEquipmentStatuses).toHaveBeenCalled();
    expect(component.allStatuses().length).toBe(3);
  });

  it('should have empty data source initially', () => {
    expect(component.dataSource).toEqual([]);
    expect(component.hasSearched).toBeFalse();
  });

  it('should set loading flags to false after API calls complete', () => {
    expect(component.isLoadingEquipTypes).toBeFalse();
    expect(component.isLoadingStatuses).toBeFalse();
  });

  // ── isRetrieveDisabled ────────────────────────────────────────────────────────

  it('should have retrieve button disabled when no filters are selected', () => {
    expect(component.isRetrieveDisabled).toBeTrue();
  });

  it('should have retrieve button enabled when equipmentType is selected', () => {
    component.equipmentTypeControl.setValue('FRIDGE');
    expect(component.isRetrieveDisabled).toBeFalse();
  });

  it('should have retrieve button enabled when status is selected', () => {
    component.statusControl.setValue('IN');
    expect(component.isRetrieveDisabled).toBeFalse();
  });

  it('should disable retrieve button while loading', () => {
    component.equipmentTypeControl.setValue('FRIDGE');
    component.isLoading = true;
    expect(component.isRetrieveDisabled).toBeTrue();
  });

  it('should disable retrieve after successful retrieve (no dirty change)', () => {
    component.equipmentTypeControl.setValue('FRIDGE');
    component.onRetrieve();
    expect(component.isRetrieved).toBeTrue();
    expect(component.isDirtyAfterRetrieve).toBeFalse();
    expect(component.isRetrieveDisabled).toBeTrue();
  });

  it('should re-enable retrieve after filter change post-retrieve', () => {
    component.equipmentTypeControl.setValue('FRIDGE');
    component.onRetrieve();
    component.onEquipmentTypeChange('CENT');
    expect(component.isDirtyAfterRetrieve).toBeTrue();
    expect(component.isRetrieveDisabled).toBeFalse();
  });

  // ── isClearAllDisabled ────────────────────────────────────────────────────────

  it('should have clear all disabled when everything is empty and no search done', () => {
    expect(component.isClearAllDisabled).toBeTrue();
  });

  it('should enable clear all when equipmentType has value', () => {
    component.equipmentTypeControl.setValue('FRIDGE');
    expect(component.isClearAllDisabled).toBeFalse();
  });

  it('should enable clear all when status has value', () => {
    component.statusControl.setValue('IN');
    expect(component.isClearAllDisabled).toBeFalse();
  });

  it('should enable clear all when isRetrieved is true', () => {
    component.equipmentTypeControl.setValue('FRIDGE');
    component.onRetrieve();
    expect(component.isClearAllDisabled).toBeFalse();
  });

  // ── onRetrieve ────────────────────────────────────────────────────────────────

  it('should not call API when retrieve is disabled', () => {
    component.onRetrieve();
    expect(apiServiceSpy.getEquipmentList).not.toHaveBeenCalled();
  });

  it('should call getEquipmentList with correct filters on retrieve', () => {
    component.equipmentTypeControl.setValue('FRIDGE');
    component.equipmentIdControl.enable();
    component.equipmentIdControl.setValue('E001');
    component.equipmentReferenceNo = 'EQ-000001';
    component.statusControl.setValue('IN');

    component.onRetrieve();

    expect(apiServiceSpy.getEquipmentList).toHaveBeenCalledWith(
      jasmine.objectContaining({
        equipmentType: 'FRIDGE',
        equipmentId: 'E001',
        reference: 'EQ-000001',
        status: 'IN',
      }),
    );
  });

  it('should populate dataSource on successful retrieve', () => {
    component.equipmentTypeControl.setValue('FRIDGE');
    component.onRetrieve();
    expect(component.dataSource.length).toBe(1);
    expect(component.dataSource[0].equipId).toBe('E001');
  });

  it('should set hasSearched and isRetrieved to true after retrieve', () => {
    component.equipmentTypeControl.setValue('FRIDGE');
    component.onRetrieve();
    expect(component.hasSearched).toBeTrue();
    expect(component.isRetrieved).toBeTrue();
  });

  it('should handle API error on retrieve gracefully', () => {
    apiServiceSpy.getEquipmentList.and.returnValue(throwError(() => new Error('Server error')));
    component.equipmentTypeControl.setValue('FRIDGE');
    component.onRetrieve();

    expect(component.hasError).toBeTrue();
    expect(component.dataSource).toEqual([]);
    expect(component.isLoading).toBeFalse();
  });

  // ── onClearAll ────────────────────────────────────────────────────────────────

  it('should clear all filters on clearAll', () => {
    component.equipmentTypeControl.setValue('FRIDGE');
    component.statusControl.setValue('IN');
    component.equipmentDescription = 'Refrigerator';
    component.equipmentReferenceNo = 'EQ-000001';
    component.hasSearched = true;
    component.isRetrieved = true;
    component.dataSource = [mockTableRow as any];

    component.onClearAll();

    expect(component.equipmentTypeControl.value).toBeNull();
    expect(component.equipmentIdControl.value).toBeNull();
    expect(component.statusControl.value).toBeNull();
    expect(component.equipmentDescription).toBe('');
    expect(component.equipmentReferenceNo).toBe('');
    expect(component.hasSearched).toBeFalse();
    expect(component.isRetrieved).toBeFalse();
    expect(component.isDirtyAfterRetrieve).toBeFalse();
    expect(component.hasError).toBeFalse();
    expect(component.dataSource).toEqual([]);
  });

  it('should disable equipmentId control on clearAll', () => {
    component.equipmentTypeControl.setValue('FRIDGE');
    component.onEquipmentTypeChange('FRIDGE');
    component.onClearAll();
    expect(component.equipmentIdControl.disabled).toBeTrue();
  });

  it('should clear equipment IDs dropdown data on clearAll', () => {
    component.allEquipIds.set(mockEquipIds);
    component.onClearAll();
    expect(component.allEquipIds().length).toBe(0);
  });

  // ── Cascading dropdowns ───────────────────────────────────────────────────────

  it('should load equipment IDs when equipment type is selected', () => {
    component.onEquipmentTypeChange('FRIDGE');
    expect(apiServiceSpy.getEquipmentIds).toHaveBeenCalledWith('FRIDGE');
    expect(component.equipmentIdControl.enabled).toBeTrue();
  });

  it('should set equipment description when type is selected', () => {
    component.onEquipmentTypeChange('FRIDGE');
    expect(component.equipmentDescription).toBe('Refrigerator');
  });

  it('should clear equipment description when type is deselected', () => {
    component.onEquipmentTypeChange('FRIDGE');
    component.onEquipmentTypeChange(null);
    expect(component.equipmentDescription).toBe('');
  });

  it('should disable equipmentId when type is deselected', () => {
    component.onEquipmentTypeChange('FRIDGE');
    component.onEquipmentTypeChange(null);
    expect(component.equipmentIdControl.disabled).toBeTrue();
  });

  it('should reset equipmentId and reference when type changes', () => {
    component.onEquipmentTypeChange('FRIDGE');
    component.equipmentIdControl.setValue('E001');
    component.equipmentReferenceNo = 'EQ-000001';

    component.onEquipmentTypeChange('CENT');

    expect(component.equipmentIdControl.value).toBeNull();
    expect(component.equipmentReferenceNo).toBe('');
  });

  it('should auto-fill reference when equipment ID is selected', () => {
    component.allEquipIds.set(mockEquipIds);
    component.onEquipmentIdChange('E001');
    expect(component.equipmentReferenceNo).toBe('EQ-000001');
  });

  it('should clear reference when equipment ID is deselected', () => {
    component.onEquipmentIdChange(null);
    expect(component.equipmentReferenceNo).toBe('');
  });

  it('should handle equipment ID not found in list', () => {
    component.allEquipIds.set(mockEquipIds);
    component.onEquipmentIdChange('E999');
    expect(component.equipmentReferenceNo).toBe('');
  });

  // ── Dirty tracking ────────────────────────────────────────────────────────────

  it('should mark dirty on type change after retrieve', () => {
    component.equipmentTypeControl.setValue('FRIDGE');
    component.onRetrieve();
    expect(component.isDirtyAfterRetrieve).toBeFalse();

    component.onEquipmentTypeChange('CENT');
    expect(component.isDirtyAfterRetrieve).toBeTrue();
  });

  it('should mark dirty on status change after retrieve', () => {
    component.statusControl.setValue('IN');
    component.onRetrieve();
    component.onStatusChange('OT');
    expect(component.isDirtyAfterRetrieve).toBeTrue();
  });

  it('should not mark dirty if not yet retrieved', () => {
    component.onEquipmentTypeChange('FRIDGE');
    expect(component.isDirtyAfterRetrieve).toBeFalse();
  });

  // ── API error handling ────────────────────────────────────────────────────────

  it('should handle equipment types load error', () => {
    apiServiceSpy.getEquipmentTypes.and.returnValue(throwError(() => new Error('Error')));

    const freshFixture = TestBed.createComponent(StatusAndHistoryQueryComponent);
    const freshComponent = freshFixture.componentInstance;
    freshFixture.detectChanges();

    expect(freshComponent.allEquipTypes().length).toBe(0);
    expect(freshComponent.isLoadingEquipTypes).toBeFalse();
  });

  it('should handle statuses load error', () => {
    apiServiceSpy.getEquipmentStatuses.and.returnValue(throwError(() => new Error('Error')));

    const freshFixture = TestBed.createComponent(StatusAndHistoryQueryComponent);
    const freshComponent = freshFixture.componentInstance;
    freshFixture.detectChanges();

    expect(freshComponent.allStatuses().length).toBe(0);
    expect(freshComponent.isLoadingStatuses).toBeFalse();
  });

  it('should handle equipment IDs load error', () => {
    apiServiceSpy.getEquipmentIds.and.returnValue(throwError(() => new Error('Error')));
    component.onEquipmentTypeChange('FRIDGE');
    expect(component.allEquipIds().length).toBe(0);
    expect(component.isLoadingEquipIds).toBeFalse();
  });

  it('should handle null data in API response', () => {
    apiServiceSpy.getEquipmentList.and.returnValue(of({ success: true, message: '', statusCode: 200, data: null as any, totalCount: 0 }));
    component.equipmentTypeControl.setValue('FRIDGE');
    component.onRetrieve();
    expect(component.dataSource).toEqual([]);
  });

  // ── Row actions ───────────────────────────────────────────────────────────────

  it('should open equipment details on details action', () => {
    component.onRowAction({ action: 'details', row: mockTableRow as any });
    expect(component.isDetailsViewOpen).toBeTrue();
    expect(component.detailsRow).toBe(mockTableRow as any);
  });

  it('should close statistics panel when opening details', () => {
    component.isStatsPanelOpen = true;
    component.onRowAction({ action: 'details', row: mockTableRow as any });
    expect(component.isStatsPanelOpen).toBeFalse();
  });

  it('should open statistics panel on statistics action', () => {
    component.onRowAction({ action: 'statistics', row: mockTableRow as any });
    expect(component.isStatsPanelOpen).toBeTrue();
    expect(component.statsPanelRow).toBe(mockTableRow as any);
  });

  it('should close details view', () => {
    component.openEquipmentDetails(mockTableRow as any);
    component.closeDetailsView();
    expect(component.isDetailsViewOpen).toBeFalse();
    expect(component.detailsRow).toBeNull();
  });

  it('should close statistics panel', () => {
    component.openEquipmentStatistics(mockTableRow as any);
    component.closeStatisticsPanel();
    expect(component.isStatsPanelOpen).toBeFalse();
    expect(component.statsPanelRow).toBeNull();
  });

  // ── Sort ──────────────────────────────────────────────────────────────────────

  it('should update request state on sort change and reload', () => {
    component.hasSearched = true;
    component.onSortChange({ column: 'equipType', direction: 'A' });
    expect(component.requestState.sortColumn).toBe('equipType');
    expect(component.requestState.sortOrder).toBe('ASC');
    expect(apiServiceSpy.getEquipmentList).toHaveBeenCalled();
  });

  it('should clear sort on default direction', () => {
    component.hasSearched = true;
    component.onSortChange({ column: 'equipType', direction: 'default' });
    expect(component.requestState.sortColumn).toBeNull();
    expect(component.requestState.sortOrder).toBeNull();
  });

  it('should set DESC sort order', () => {
    component.hasSearched = true;
    component.onSortChange({ column: 'location', direction: 'D' });
    expect(component.requestState.sortOrder).toBe('DESC');
  });

  // ── Keyboard shortcut ─────────────────────────────────────────────────────────

  it('should trigger retrieve on Alt+S when not disabled', () => {
    component.equipmentTypeControl.setValue('FRIDGE');
    const event = new KeyboardEvent('keydown', { key: 's', altKey: true });
    spyOn(event, 'preventDefault');
    component.onKeyDown(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(apiServiceSpy.getEquipmentList).toHaveBeenCalled();
  });

  it('should not trigger retrieve on Alt+S when disabled', () => {
    const event = new KeyboardEvent('keydown', { key: 's', altKey: true });
    spyOn(event, 'preventDefault');
    component.onKeyDown(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(apiServiceSpy.getEquipmentList).not.toHaveBeenCalled();
  });

  it('should not trigger on non-Alt+S keys', () => {
    component.equipmentTypeControl.setValue('FRIDGE');
    const event = new KeyboardEvent('keydown', { key: 's', altKey: false });
    component.onKeyDown(event);
    expect(apiServiceSpy.getEquipmentList).not.toHaveBeenCalled();
  });

  // ── Computed signal filters ───────────────────────────────────────────────────

  it('should filter equipment types by search term', () => {
    component.equipTypeSearchCtrl.setValue('fridge');
    component.allEquipTypes.update(v => [...v]);
    const filtered = component.filteredEquipTypes();
    expect(filtered.length).toBe(1);
    expect(filtered[0].code).toBe('FRIDGE');
  });

  it('should return all types when search is empty', () => {
    component.equipTypeSearchCtrl.setValue('');
    component.allEquipTypes.update(v => [...v]);
    expect(component.filteredEquipTypes().length).toBe(4);
  });

  it('should filter equipment IDs by code or reference', () => {
    component.allEquipIds.set(mockEquipIds);
    component.equipIdSearchCtrl.setValue('E002');
    component.allEquipIds.update(v => [...v]);
    const filtered = component.filteredEquipIds();
    expect(filtered.length).toBe(1);
    expect(filtered[0].code).toBe('E002');
  });

  it('should filter statuses by search term', () => {
    component.statusSearchCtrl.setValue('out');
    component.allStatuses.update(v => [...v]);
    const filtered = component.filteredStatuses();
    expect(filtered.length).toBe(1);
    expect(filtered[0].code).toBe('OT');
  });

  // ── Table config ──────────────────────────────────────────────────────────────

  it('should have 8 columns defined', () => {
    expect(component.tableConfig.columns.length).toBe(8);
  });

  it('should have 2 row actions (details and statistics)', () => {
    expect(component.tableConfig.rowActions!.length).toBe(2);
    expect(component.tableConfig.rowActions![0].action).toBe('details');
    expect(component.tableConfig.rowActions![1].action).toBe('statistics');
  });

  // ── loadTableData guard ───────────────────────────────────────────────────────

  it('should not load table data if hasSearched is false', () => {
    component.hasSearched = false;
    component.loadTableData();
    expect(apiServiceSpy.getEquipmentList).not.toHaveBeenCalled();
  });

  // ── ngOnDestroy ───────────────────────────────────────────────────────────────

  it('should complete destroy$ on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    component.ngOnDestroy();
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});
