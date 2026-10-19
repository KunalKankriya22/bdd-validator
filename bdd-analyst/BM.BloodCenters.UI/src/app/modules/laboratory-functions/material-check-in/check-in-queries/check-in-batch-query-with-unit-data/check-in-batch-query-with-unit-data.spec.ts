import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CheckInBatchQueryWithUnitDataComponent } from './check-in-batch-query-with-unit-data';
import { CheckInBatchQueryApiService } from './services/check-in-batch-query-api.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { BatchUnitDto } from './models/check-in-batch-query.model';
import { createMockTranslateService, createMockPageHeaderService } from '@shared/testing/common-mocks';

describe('CheckInBatchQueryWithUnitDataComponent', () => {
  let component: CheckInBatchQueryWithUnitDataComponent;
  let fixture: ComponentFixture<CheckInBatchQueryWithUnitDataComponent>;
  let mockApiService: jasmine.SpyObj<CheckInBatchQueryApiService>;
  let mockHeaderService: any;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;
  let snackBarOpenSpy: jasmine.Spy;
  let chapterSubject: Subject<void>;

  const mockBatchIds = [
    { batchId: '111619-CB9006' },
    { batchId: '111619-CB9007' },
    { batchId: '220101-CB0001' },
  ];

  const createMockUnit = (overrides: Partial<BatchUnitDto> = {}): BatchUnitDto => ({
    unitId: 'W123418031306',
    chkDigit: '-3',
    collDate: '2025-01-11T00:00:00',
    donorDecisionCode: 'Y',
    catalogNumber: 'TE00CPD100',
    driveId: '166348',
    groupSiteId: '046694',
    redTubeFlag: 'Y',
    redTube2: 'Y',
    purpleTubeFlag: 'Y',
    serumPlasmaInd: 'Y',
    bleedStartTime: '2025-01-11T14:00:00',
    bleedEndTime: '2025-01-11T14:10:00',
    qcCheckinDate: null,
    ...overrides,
  });

  const mockUnits: BatchUnitDto[] = [
    createMockUnit(),
    createMockUnit({
      unitId: 'W123418031307',
      chkDigit: '5',
      collDate: '2025-12-10T00:00:00',
      donorDecisionCode: 'N',
      catalogNumber: 'TE00CPD109',
      driveId: '890109',
      groupSiteId: '890109',
      bleedStartTime: '2025-12-10T15:15:00',
      bleedEndTime: '2025-12-10T15:20:00',
      qcCheckinDate: '2025-12-10T09:30:00',
    }),
    createMockUnit({
      unitId: 'W999918031308',
      chkDigit: null,
      collDate: '2020-02-02T00:00:00',
      donorDecisionCode: null,
      catalogNumber: 'TE00CPD187',
      driveId: null,
      groupSiteId: '047890',
      redTubeFlag: 'N',
      redTube2: 'N',
      purpleTubeFlag: 'N',
      serumPlasmaInd: 'N',
      bleedStartTime: '2020-02-02T07:00:00',
      bleedEndTime: '2020-02-02T07:20:00',
      qcCheckinDate: null,
    }),
  ];

  beforeEach(() => {
    chapterSubject = new Subject<void>();

    mockApiService = jasmine.createSpyObj('CheckInBatchQueryApiService', [
      'getBatchIdsLov',
      'getUnitsByBatchId',
    ]);
    mockHeaderService = {
      chapterChanged$: chapterSubject.asObservable(),
      getCurrentChapterId: jasmine.createSpy().and.returnValue('TST'),
    };
    mockPageHeaderService = createMockPageHeaderService();
    mockTranslateService = createMockTranslateService();

    mockApiService.getBatchIdsLov.and.returnValue(of(mockBatchIds));
    mockApiService.getUnitsByBatchId.and.returnValue(
      of({ units: mockUnits, unitCount: mockUnits.length })
    );
    mockPageHeaderService.getCurrentMenuItem.and.returnValue(undefined);
    mockPageHeaderService.getTitle.and.returnValue('');
    mockPageHeaderService.getSubtitle.and.returnValue('');

    TestBed.configureTestingModule({
      imports: [CheckInBatchQueryWithUnitDataComponent, NoopAnimationsModule],
      providers: [
        { provide: CheckInBatchQueryApiService, useValue: mockApiService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: TranslateService, useValue: mockTranslateService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({}),
          },
        },
      ],
    });

    fixture = TestBed.createComponent(CheckInBatchQueryWithUnitDataComponent);
    component = fixture.componentInstance;
    snackBarOpenSpy = spyOn(component['snackBar'], 'open');
  });

  describe('Initialization', () => {
    it('should load batch IDs on init', () => {
      fixture.detectChanges();
      expect(mockApiService.getBatchIdsLov).toHaveBeenCalled();
      expect(component.allBatchIds.length).toBe(3);
      expect(component.filteredBatchIds.length).toBe(3);
    });

    it('should set page header config with default title when service returns empty', () => {
      mockPageHeaderService.getTitle.and.returnValue('');
      fixture.detectChanges();
      expect(component.pageHeaderConfig.breadcrumbs[1].label).toBe('Check in Batch Query with Unit Data');
    });

    it('should set page header config with service title when available', () => {
      mockPageHeaderService.getTitle.and.returnValue('Custom Title');
      fixture = TestBed.createComponent(CheckInBatchQueryWithUnitDataComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      expect(component.pageHeaderConfig.breadcrumbs[1].label).toBe('Custom Title');
    });

    it('should handle loadBatchIds error gracefully', () => {
      mockApiService.getBatchIdsLov.and.returnValue(throwError(() => new Error('Load failed')));
      fixture.detectChanges();
      expect(component.allBatchIds).toEqual([]);
      expect(component.filteredBatchIds).toEqual([]);
    });

    it('should have correct table config with 12 columns and unitId includes check digit', () => {
      fixture.detectChanges();
      const columns = component.tableConfig.columns;
      expect(columns.length).toBe(12);
      expect(columns[0].key).toBe('unitId');
      expect(columns[0].header).toBe('Unit ID');
      expect(columns[0].valueFormatter).toBeDefined();
    });

    it('should have correct initial state', () => {
      expect(component.allUnits).toEqual([]);
      expect(component.dataSource).toEqual([]);
      expect(component.unitCount).toBe(0);
      expect(component.isLoading).toBe(false);
      expect(component.hasRetrieved).toBe(false);
    });
  });

  describe('Chapter Changes', () => {
    it('should clear data and reload batch IDs when chapter changes', () => {
      fixture.detectChanges();
      component.batchIdControl.setValue('111619-CB9006');
      component.onRetrieve();
      expect(component.allUnits.length).toBe(3);

      mockApiService.getBatchIdsLov.calls.reset();
      chapterSubject.next();

      expect(component.allUnits).toEqual([]);
      expect(component.hasRetrieved).toBe(false);
      expect(mockApiService.getBatchIdsLov).toHaveBeenCalled();
    });
  });

  describe('Batch Autocomplete Filtering', () => {
    it('should filter batch IDs as user types', () => {
      fixture.detectChanges();
      component.batchIdControl.setValue('CB9006');
      expect(component.filteredBatchIds.length).toBe(1);
      expect(component.filteredBatchIds[0].batchId).toBe('111619-CB9006');
    });

    it('should show all batches when input is cleared', () => {
      fixture.detectChanges();
      component.batchIdControl.setValue('CB9006');
      expect(component.filteredBatchIds.length).toBe(1);

      component.batchIdControl.setValue('');
      expect(component.filteredBatchIds.length).toBe(3);
    });

    it('should return no results for non-matching text', () => {
      fixture.detectChanges();
      component.batchIdControl.setValue('ZZZZZ');
      expect(component.filteredBatchIds.length).toBe(0);
    });

    it('should perform case-insensitive filtering', () => {
      fixture.detectChanges();
      component.batchIdControl.setValue('cb9007');
      expect(component.filteredBatchIds.length).toBe(1);
      expect(component.filteredBatchIds[0].batchId).toBe('111619-CB9007');
    });

    it('should reset filtered list when an option is selected', () => {
      fixture.detectChanges();
      component.batchIdControl.setValue('CB9006');
      expect(component.filteredBatchIds.length).toBe(1);

      component.batchIdControl.setValue('111619-CB9006');
      component.onBatchOptionSelected();
      expect(component.filteredBatchIds.length).toBe(3);
    });

    it('should allow free-form batch ID entry for older batches', () => {
      fixture.detectChanges();
      component.batchIdControl.setValue('010120-CB0001');
      component.onRetrieve();
      expect(mockApiService.getUnitsByBatchId).toHaveBeenCalledWith('010120-CB0001');
    });

    it('should toggle dropdown via toggleDropdown', () => {
      fixture.detectChanges();
      const mockEvent = { stopPropagation: jasmine.createSpy() } as any;
      const mockTrigger = { panelOpen: false, openPanel: jasmine.createSpy(), closePanel: jasmine.createSpy() };
      component.autoTrigger = mockTrigger as any;

      component.toggleDropdown(mockEvent);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockTrigger.openPanel).toHaveBeenCalled();
      expect(component.filteredBatchIds.length).toBe(3);
    });

    it('should close dropdown when already open', () => {
      fixture.detectChanges();
      const mockEvent = { stopPropagation: jasmine.createSpy() } as any;
      const mockTrigger = { panelOpen: true, openPanel: jasmine.createSpy(), closePanel: jasmine.createSpy() };
      component.autoTrigger = mockTrigger as any;

      component.toggleDropdown(mockEvent);
      expect(mockTrigger.closePanel).toHaveBeenCalled();
    });
  });

  describe('Retrieve', () => {
    it('should retrieve units when onRetrieve is called with valid batch', () => {
      fixture.detectChanges();
      component.batchIdControl.setValue('111619-CB9006');
      component.onRetrieve();

      expect(mockApiService.getUnitsByBatchId).toHaveBeenCalledWith('111619-CB9006');
      expect(component.allUnits.length).toBe(3);
      expect(component.unitCount).toBe(3);
      expect(component.hasRetrieved).toBe(true);
      expect(component.isLoading).toBe(false);
    });

    it('should not retrieve when batch ID is empty', () => {
      fixture.detectChanges();
      component.batchIdControl.setValue('');
      component.onRetrieve();
      expect(mockApiService.getUnitsByBatchId).not.toHaveBeenCalled();
    });

    it('should not retrieve when control is invalid', () => {
      fixture.detectChanges();
      component.batchIdControl.setValue('');
      component.batchIdControl.markAsTouched();
      component.onRetrieve();
      expect(mockApiService.getUnitsByBatchId).not.toHaveBeenCalled();
    });

    it('should trim batch ID before sending', () => {
      fixture.detectChanges();
      component.batchIdControl.setValue('  111619-CB9006  ');
      component.onRetrieve();
      expect(mockApiService.getUnitsByBatchId).toHaveBeenCalledWith('111619-CB9006');
    });

    it('should reset search keyword on retrieve', () => {
      fixture.detectChanges();
      component.batchIdControl.setValue('111619-CB9006');
      component.onUnitSearch('W123');
      component.onRetrieve();
      expect(component.dataSource.length).toBe(3);
    });
  });

  describe('Error Handling', () => {
    it('should show API error message when error.error.message exists', () => {
      const apiError = { error: { message: 'Batch not found in system', errorCode: '1130' } };
      mockApiService.getUnitsByBatchId.and.returnValue(throwError(() => apiError));

      fixture.detectChanges();
      component.batchIdControl.setValue('111619-CB9006');
      component.onRetrieve();

      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Batch not found in system',
        'Close',
        jasmine.objectContaining({ duration: 5000 })
      );
      expect(component.allUnits).toEqual([]);
      expect(component.isLoading).toBe(false);
    });

    it('should show API error.error.error when message is absent', () => {
      const apiError = { error: { error: 'Server validation failed' } };
      mockApiService.getUnitsByBatchId.and.returnValue(throwError(() => apiError));

      fixture.detectChanges();
      component.batchIdControl.setValue('111619-CB9006');
      component.onRetrieve();

      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Server validation failed',
        'Close',
        jasmine.objectContaining({ duration: 5000 })
      );
    });

    it('should show "Invalid Batch ID" for error code 1130', () => {
      const apiError = { error: { errorCode: '1130' } };
      mockApiService.getUnitsByBatchId.and.returnValue(throwError(() => apiError));

      fixture.detectChanges();
      component.batchIdControl.setValue('111619-CB9006');
      component.onRetrieve();

      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Invalid Batch ID',
        'Close',
        jasmine.objectContaining({ duration: 5000 })
      );
    });

    it('should show "No units found" for error code 0085', () => {
      const apiError = { error: { errorCode: '0085' } };
      mockApiService.getUnitsByBatchId.and.returnValue(throwError(() => apiError));

      fixture.detectChanges();
      component.batchIdControl.setValue('111619-CB9006');
      component.onRetrieve();

      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'No units found for this batch',
        'Close',
        jasmine.objectContaining({ duration: 5000 })
      );
    });

    it('should show generic message for unknown errors', () => {
      mockApiService.getUnitsByBatchId.and.returnValue(throwError(() => new Error('Unknown')));

      fixture.detectChanges();
      component.batchIdControl.setValue('111619-CB9006');
      component.onRetrieve();

      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Failed to retrieve batch data',
        'Close',
        jasmine.objectContaining({ duration: 5000 })
      );
    });

    it('should reset state on error', () => {
      mockApiService.getUnitsByBatchId.and.returnValue(throwError(() => new Error('Error')));

      fixture.detectChanges();
      component.batchIdControl.setValue('111619-CB9006');
      component.onRetrieve();

      expect(component.allUnits).toEqual([]);
      expect(component.dataSource).toEqual([]);
      expect(component.unitCount).toBe(0);
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Clear', () => {
    it('should clear all data when onClear is called', () => {
      fixture.detectChanges();
      component.batchIdControl.setValue('111619-CB9006');
      component.onRetrieve();

      component.onClear();

      expect(component.batchIdControl.value).toBe('');
      expect(component.batchIdControl.touched).toBe(true);
      expect(component.allUnits).toEqual([]);
      expect(component.dataSource).toEqual([]);
      expect(component.unitCount).toBe(0);
      expect(component.hasRetrieved).toBe(false);
    });

    it('should reset pagination on clear', () => {
      fixture.detectChanges();
      component.batchIdControl.setValue('111619-CB9006');
      component.onRetrieve();

      component.onClear();

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
      expect(component.tableConfig.pagination!.totalRecords).toBe(0);
    });

    it('should reset filtered batch IDs to all batch IDs', () => {
      fixture.detectChanges();
      component.batchIdControl.setValue('CB9006');
      expect(component.filteredBatchIds.length).toBe(1);

      component.onClear();
      expect(component.filteredBatchIds.length).toBe(3);
    });
  });

  describe('Unit Search', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.batchIdControl.setValue('111619-CB9006');
      component.onRetrieve();
    });

    it('should filter units by unit ID keyword', () => {
      component.onUnitSearch('W9999');
      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0].unitId).toBe('W999918031308');
    });

    it('should show all units when search keyword is empty', () => {
      component.onUnitSearch('W9999');
      expect(component.dataSource.length).toBe(1);

      component.onUnitSearch('');
      expect(component.dataSource.length).toBe(3);
    });

    it('should handle null keyword gracefully', () => {
      component.onUnitSearch(null as any);
      expect(component.dataSource.length).toBe(3);
    });

    it('should reset pagination pageIndex on search', () => {
      component.onPageChange({ pageIndex: 1, pageSize: 25 });
      component.onUnitSearch('W123');
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });
  });

  describe('Pagination', () => {
    it('should update page index and page size on page change', () => {
      fixture.detectChanges();
      component.batchIdControl.setValue('111619-CB9006');
      component.onRetrieve();

      component.onPageChange({ pageIndex: 1, pageSize: 10 });

      expect(component.tableConfig.pagination!.pageIndex).toBe(1);
      expect(component.tableConfig.pagination!.pageSize).toBe(10);
    });

    it('should paginate data correctly', () => {
      fixture.detectChanges();
      component.batchIdControl.setValue('111619-CB9006');
      component.onRetrieve();

      component.onPageChange({ pageIndex: 0, pageSize: 2 });
      expect(component.dataSource.length).toBe(2);

      component.onPageChange({ pageIndex: 1, pageSize: 2 });
      expect(component.dataSource.length).toBe(1);
    });

    it('should update totalRecords based on filtered data', () => {
      fixture.detectChanges();
      component.batchIdControl.setValue('111619-CB9006');
      component.onRetrieve();
      expect(component.tableConfig.pagination!.totalRecords).toBe(3);

      component.onUnitSearch('W9999');
      expect(component.tableConfig.pagination!.totalRecords).toBe(1);
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.batchIdControl.setValue('111619-CB9006');
      component.onRetrieve();
    });

    it('should sort ascending', () => {
      component.onSortChange({ column: 'unitId', direction: 'A' });
      expect(component.dataSource[0].unitId).toBe('W123418031306');
      expect(component.dataSource[2].unitId).toBe('W999918031308');
    });

    it('should sort descending', () => {
      component.onSortChange({ column: 'unitId', direction: 'D' });
      expect(component.dataSource[0].unitId).toBe('W999918031308');
      expect(component.dataSource[2].unitId).toBe('W123418031306');
    });

    it('should restore original order on default sort', () => {
      component.onSortChange({ column: 'unitId', direction: 'D' });
      component.onSortChange({ column: 'unitId', direction: 'default' });
      expect(component.dataSource[0].unitId).toBe('W123418031306');
    });

    it('should handle sorting with null values', () => {
      component.onSortChange({ column: 'qcCheckinDate', direction: 'A' });
      expect(component.dataSource.length).toBe(3);
    });

    it('should handle sorting with equal values', () => {
      component.onSortChange({ column: 'redTubeFlag', direction: 'A' });
      expect(component.dataSource.length).toBe(3);
    });
  });

  describe('Value Formatters', () => {
    let columns: any[];

    beforeEach(() => {
      fixture.detectChanges();
      columns = component.tableConfig.columns;
    });

    describe('formatYesNo', () => {
      it('should format Y as Yes', () => {
        const cueCol = columns.find((c: any) => c.key === 'donorDecisionCode');
        expect(cueCol.valueFormatter('Y')).toBe('Yes');
      });

      it('should format N as No', () => {
        const cueCol = columns.find((c: any) => c.key === 'donorDecisionCode');
        expect(cueCol.valueFormatter('N')).toBe('No');
      });

      it('should format null as dash', () => {
        const cueCol = columns.find((c: any) => c.key === 'donorDecisionCode');
        expect(cueCol.valueFormatter(null)).toBe('-');
      });

      it('should format empty string as dash', () => {
        const cueCol = columns.find((c: any) => c.key === 'donorDecisionCode');
        expect(cueCol.valueFormatter('')).toBe('-');
      });

      it('should return raw value for unexpected input', () => {
        const cueCol = columns.find((c: any) => c.key === 'donorDecisionCode');
        expect(cueCol.valueFormatter('X')).toBe('X');
      });

      it('should handle lowercase y/n', () => {
        const cueCol = columns.find((c: any) => c.key === 'donorDecisionCode');
        expect(cueCol.valueFormatter('y')).toBe('Yes');
        expect(cueCol.valueFormatter('n')).toBe('No');
      });
    });

    describe('formatDateForDisplay', () => {
      it('should format valid date as DD-MMM-YYYY uppercase', () => {
        const collDateCol = columns.find((c: any) => c.key === 'collDate');
        expect(collDateCol.valueFormatter('2025-01-11T00:00:00')).toBe('11-JAN-2025');
      });

      it('should return empty string for null', () => {
        const collDateCol = columns.find((c: any) => c.key === 'collDate');
        expect(collDateCol.valueFormatter(null)).toBe('');
      });

      it('should return raw value for invalid date', () => {
        const collDateCol = columns.find((c: any) => c.key === 'collDate');
        expect(collDateCol.valueFormatter('not-a-date')).toBe('not-a-date');
      });
    });

    describe('formatDateForDisplay (QC Date)', () => {
      it('should format valid QC date as DD-MMM-YYYY uppercase without time', () => {
        const qcCol = columns.find((c: any) => c.key === 'qcCheckinDate');
        expect(qcCol.valueFormatter('2025-12-10T09:30:00')).toBe('10-DEC-2025');
      });

      it('should return empty string for null QC date', () => {
        const qcCol = columns.find((c: any) => c.key === 'qcCheckinDate');
        expect(qcCol.valueFormatter(null)).toBe('');
      });

      it('should return raw value for invalid QC date', () => {
        const qcCol = columns.find((c: any) => c.key === 'qcCheckinDate');
        expect(qcCol.valueFormatter('invalid-datetime')).toBe('invalid-datetime');
      });
    });

    describe('formatTimeForDisplay', () => {
      it('should format valid datetime as H:mm', () => {
        const timeCol = columns.find((c: any) => c.key === 'bleedStartTime');
        expect(timeCol.valueFormatter('2025-01-11T14:00:00')).toBe('14:00');
      });

      it('should return empty string for null', () => {
        const timeCol = columns.find((c: any) => c.key === 'bleedStartTime');
        expect(timeCol.valueFormatter(null)).toBe('');
      });

      it('should return raw value for invalid time', () => {
        const timeCol = columns.find((c: any) => c.key === 'bleedStartTime');
        expect(timeCol.valueFormatter('bad-time')).toBe('bad-time');
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state before first retrieve', () => {
      expect(component.hasRetrieved).toBe(false);
      expect(component.tableConfig.emptyMessage).toBe('No Results to Display');
      expect(component.tableConfig.emptySubMessage).toBe(
        'Please enter search criteria to view results'
      );
    });

    it('should disable RETRIEVE button when no batch ID is selected', () => {
      component.batchIdControl.setValue('');
      expect(component.batchIdControl.invalid).toBe(true);
    });

    it('should enable RETRIEVE button when a batch ID is selected', () => {
      component.batchIdControl.setValue('111619-CB9006');
      expect(component.batchIdControl.valid).toBe(true);
    });
  });

  describe('Destroy', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      fixture.detectChanges();
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Data Mapping', () => {
    it('should display unitId with check digit when chkDigit is present', () => {
      fixture.detectChanges();
      const unitIdCol = component.tableConfig.columns.find((c: any) => c.key === 'unitId');
      const row = { unitId: 'W123418031306', chkDigit: '-3' } as BatchUnitDto;
      expect(unitIdCol!.valueFormatter!('W123418031306', row)).toBe('W123418031306 -3');
    });

    it('should display unitId without check digit when chkDigit is null', () => {
      fixture.detectChanges();
      const unitIdCol = component.tableConfig.columns.find((c: any) => c.key === 'unitId');
      const row = { unitId: 'W999918031308', chkDigit: null } as BatchUnitDto;
      expect(unitIdCol!.valueFormatter!('W999918031308', row)).toBe('W999918031308');
    });

    it('should return empty string when unitId is empty', () => {
      fixture.detectChanges();
      const unitIdCol = component.tableConfig.columns.find((c: any) => c.key === 'unitId');
      const row = { unitId: '', chkDigit: '-3' } as BatchUnitDto;
      expect(unitIdCol!.valueFormatter!('', row)).toBe('');
    });
  });
});
