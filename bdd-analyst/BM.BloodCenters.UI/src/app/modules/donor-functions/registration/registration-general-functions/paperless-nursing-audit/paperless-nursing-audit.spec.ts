import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ApiService } from '@shared/services/api.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';

import { PaperlessNursingAuditComponent } from './paperless-nursing-audit';
import { PaperlessNursingAuditService } from './services/paperless-nursing-audit.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  AuditOptionDto,
  NursingAuditRecordDto,
  NursingAuditResponse,
} from './models/paperless-nursing-audit.model';
import { RecordDetailDialogComponent } from './components/record-detail-dialog/record-detail-dialog';
import { IncludeExcludeInfoDialogComponent } from './components/include-exclude-info-dialog/include-exclude-info-dialog';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('PaperlessNursingAuditComponent', () => {
  let completeSpy: any;
  let destroySpy: any;
  let dialogRefSpy: any;
  let component: PaperlessNursingAuditComponent;
  let fixture: ComponentFixture<PaperlessNursingAuditComponent>;
  let auditService: jasmine.SpyObj<PaperlessNursingAuditService>;
  let headerService: jasmine.SpyObj<HeaderService>;
  let pageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let matDialog: MatDialog;
  let snackBar: MatSnackBar;
  let chapterChanged$: Subject<void>;

  const mockOptions: AuditOptionDto[] = [
    { code: 'Donation', description: 'Donation' },
    { code: 'Deferral', description: 'Deferral' },
  ];

  const mockRecordOk: NursingAuditRecordDto = {
    sessionId: '26050914302355',
    chapterId: 'CH01',
    idType: 'Donation',
    idValue: 'W12345678',
    displayIdValue: 'W12345678',
    collDate: '2028-03-15T00:00:00',
    donorId: 'D001234',
    status: 'OK',
    reason: null,
    excludeFlag: null,
    driveId: 'DRV001',
  };

  const mockRecordHold: NursingAuditRecordDto = {
    sessionId: '26050914302355',
    chapterId: 'CH01',
    idType: 'Donation',
    idValue: 'W87654321',
    displayIdValue: 'W87654321',
    collDate: '2028-04-01T00:00:00',
    donorId: 'D005678',
    status: 'HOLD',
    reason: 'Incomplete form',
    excludeFlag: null,
    driveId: 'DRV001',
  };

  const mockAuditResponse: NursingAuditResponse = {
    sessionId: '26050914302355',
    records: [mockRecordOk, mockRecordHold],
    summary: { totalCount: 2, okCount: 1, holdCount: 1 },
  };

  beforeEach(() => {
    chapterChanged$ = new Subject<void>();

    auditService = jasmine.createSpyObj('PaperlessNursingAuditService', [
      'getOptions',
      'startAudit',
      'getRecords',
      'updateExcludeFlags',
      'commitAudit',
      'getDriveIds',
      'getAndClearState',
      'saveState',
    ]);
    auditService.getOptions.and.returnValue(of(mockOptions));
    auditService.getDriveIds.and.returnValue(of([]));
    (auditService as any).getAndClearState.and.returnValue(null);
    (auditService as any).saveState.and.stub();

    headerService = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });
    pageHeaderService = jasmine.createSpyObj('PageHeaderService', [
      'getTitle',
      'getSubtitle',
      'getCurrentMenuItem',
    ], {
      pageHeaderData: signal({ title: 'Paperless Nursing Audit', subtitle: 'Audit subtitle' }),
    });

    TestBed.configureTestingModule({
      imports: [PaperlessNursingAuditComponent, NoopAnimationsModule, MatDialogModule, MatSnackBarModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: PaperlessNursingAuditService, useValue: auditService },
        { provide: HeaderService, useValue: headerService },
        { provide: PageHeaderService, useValue: pageHeaderService },
      ],
    });

    auditService.getOptions.and.returnValue(of(mockOptions));
    auditService.getDriveIds.and.returnValue(of([]));

    fixture = TestBed.createComponent(PaperlessNursingAuditComponent);
    component = fixture.componentInstance;

    matDialog = (component as unknown as { dialog: MatDialog }).dialog;
    snackBar = (component as unknown as { snackBar: MatSnackBar }).snackBar;
    spyOn(snackBar, 'open').and.callThrough();

    fixture.detectChanges();
  });

  describe('Initialization', () => {
    it('should load options on init', () => {
      expect(auditService.getOptions).toHaveBeenCalled();
      expect(component.auditOptions).toEqual(mockOptions);
    });

    it('should default idType to first option', () => {
      expect(component.filterForm.get('idType')?.value).toBe('Donation');
    });

    it('should not have data initially', () => {
      expect(component.hasData).toBeFalse();
    });

    it('should have empty records initially', () => {
      expect(component.records.length).toBe(0);
    });

    it('should have zero summary counts initially', () => {
      expect(component.summary.totalCount).toBe(0);
      expect(component.summary.okCount).toBe(0);
      expect(component.summary.holdCount).toBe(0);
    });
  });

  describe('Form Validation', () => {
    it('should require idType', () => {
      component.filterForm.patchValue({ idType: '' });
      expect(component.filterForm.get('idType')?.hasError('required')).toBeTrue();
    });

    it('should require fromDate', () => {
      expect(component.filterForm.get('fromDate')?.hasError('required')).toBeTrue();
    });

    it('should require toDate', () => {
      expect(component.filterForm.get('toDate')?.hasError('required')).toBeTrue();
    });
  });

  describe('Retrieve', () => {
    beforeEach(() => {
      component.filterForm.patchValue({
        idType: 'Donation',
        fromDate: new Date('2025-01-01'),
        toDate: new Date('2025-05-09'),
      });
    });

    it('should invalidate form when from date is after to date', () => {
      component.filterForm.patchValue({
        fromDate: new Date('2025-06-01'),
        toDate: new Date('2025-01-01'),
      });
      component.filterForm.get('fromDate')?.markAsTouched();

      expect(component.filterForm.get('fromDate')?.hasError('dateAfter')).toBeTrue();
      expect(component.filterForm.invalid).toBeTrue();
      expect(component.getFromDateError()).toBe('From date cannot be after To date');

      component.onRetrieve();
      expect(auditService.startAudit).not.toHaveBeenCalled();
    });

    it('should populate records and summary on success', fakeAsync(() => {
      auditService.startAudit.and.returnValue(of(mockAuditResponse));
      component.onRetrieve();
      tick();

      expect(component.records.length).toBe(2);
      expect(component.sessionId).toBe('26050914302355');
      expect(component.hasData).toBeTrue();
      expect(component.summary.totalCount).toBe(2);
      expect(component.summary.okCount).toBe(1);
      expect(component.summary.holdCount).toBe(1);
      expect(component.isLoading).toBeFalse();
    }));

    it('should load drive IDs from API when dates are set', fakeAsync(() => {
      auditService.getDriveIds.and.returnValue(of(['DRV001', 'DRV002']));
      component.filterForm.patchValue({
        fromDate: new Date('2025-02-01'),
        toDate: new Date('2025-05-09'),
      });
      tick();

      expect(auditService.getDriveIds).toHaveBeenCalled();
      expect(component.driveIdOptions).toEqual(['DRV001', 'DRV002']);
    }));

    it('should show error on retrieve failure', fakeAsync(() => {
      auditService.startAudit.and.returnValue(
        throwError(() => ({ error: { message: 'No records found' } })),
      );
      component.onRetrieve();
      tick();

      expect(snackBar.open).toHaveBeenCalledWith(
        'No records found',
        'Close',
        jasmine.any(Object),
      );
      expect(component.isLoading).toBeFalse();
    }));
  });

  describe('Include/Exclude Toggle', () => {
    beforeEach(fakeAsync(() => {
      component.filterForm.patchValue({
        idType: 'Donation',
        fromDate: new Date('2025-01-01'),
        toDate: new Date('2025-05-09'),
      });
      auditService.startAudit.and.returnValue(of(mockAuditResponse));
      component.onRetrieve();
      tick();
    }));

    it('should update excludeFlag and recalculate summary', fakeAsync(() => {
      auditService.updateExcludeFlags.and.returnValue(of(true));
      const record = component.records[0];
      component.onIncludeExcludeChange(record, 'exclude');
      tick();

      expect(record.excludeFlag).toBe('X');
      expect(component.summary.totalCount).toBe(1);
    }));

    it('should revert on API error', fakeAsync(() => {
      auditService.updateExcludeFlags.and.returnValue(
        throwError(() => ({ status: 500 })),
      );
      const record = component.records[0];
      const originalFlag = record.excludeFlag;
      component.onIncludeExcludeChange(record, 'exclude');
      tick();

      expect(record.excludeFlag).toBe(originalFlag);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Failed to update exclude flag.',
        'Close',
        jasmine.any(Object),
      );
    }));
  });

  describe('Filtering', () => {
    beforeEach(fakeAsync(() => {
      component.filterForm.patchValue({
        idType: 'Donation',
        fromDate: new Date('2025-01-01'),
        toDate: new Date('2025-05-09'),
      });
      auditService.startAudit.and.returnValue(of(mockAuditResponse));
      component.onRetrieve();
      tick();
    }));

    it('should apply status filter', () => {
      component.filterStatusValue = 'HOLD';
      component.onFilterApply();

      expect(component.activeStatusFilter).toBe('HOLD');
      expect(component.filterPanelOpen).toBeFalse();
      expect(component.totalFilteredRecords).toBe(1);
    });

    it('should preserve driveId filter across retrieve', fakeAsync(() => {
      component.filterForm.patchValue({ driveId: 'DRV001' });
      expect(component.filterForm.get('driveId')?.value).toBe('DRV001');

      const secondResponse: NursingAuditResponse = {
        sessionId: 'SESSION2',
        records: [{ ...mockRecordOk, driveId: 'DRV999', idValue: 'W99999999', displayIdValue: 'W99999999' }],
        summary: { totalCount: 1, okCount: 1, holdCount: 0 },
      };
      auditService.startAudit.and.returnValue(of(secondResponse));
      component.onRetrieve();
      tick();

      expect(component.filterForm.get('driveId')?.value).toBe('DRV001');
      expect(component.totalFilteredRecords).toBe(0);
    }));

    it('should show all records when driveId is not selected', fakeAsync(() => {
      component.filterForm.patchValue({ driveId: '' });

      const response: NursingAuditResponse = {
        sessionId: 'SESSION3',
        records: [mockRecordOk, mockRecordHold],
        summary: { totalCount: 2, okCount: 1, holdCount: 1 },
      };
      auditService.startAudit.and.returnValue(of(response));
      component.onRetrieve();
      tick();

      expect(component.totalFilteredRecords).toBe(2);
    }));
  });

  describe('Search', () => {
    beforeEach(fakeAsync(() => {
      component.filterForm.patchValue({
        idType: 'Donation',
        fromDate: new Date('2025-01-01'),
        toDate: new Date('2025-05-09'),
      });
      auditService.startAudit.and.returnValue(of(mockAuditResponse));
      component.onRetrieve();
      tick();
    }));

    it('should filter records by unit ID search', () => {
      component.onSearch('W12345678');
      expect(component.totalFilteredRecords).toBe(1);
    });

    it('should show all records when search is cleared', () => {
      component.onSearch('W12345678');
      component.onSearch('');
      expect(component.totalFilteredRecords).toBe(2);
    });
  });

  describe('Commit', () => {
    beforeEach(fakeAsync(() => {
      component.filterForm.patchValue({
        idType: 'Donation',
        fromDate: new Date('2025-01-01'),
        toDate: new Date('2025-05-09'),
      });
      auditService.startAudit.and.returnValue(of(mockAuditResponse));
      component.onRetrieve();
      tick();
    }));

    it('should disable commit when no data', () => {
      component.hasData = false;
      expect(component.isCommitDisabled).toBeTrue();
    });

    it('should enable commit when data exists', () => {
      expect(component.isCommitDisabled).toBeFalse();
    });

    it('should call commitAudit when confirmed', fakeAsync(() => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      spyOn(matDialog, 'open').and.returnValue(dialogRefSpy);
      auditService.commitAudit.and.returnValue(of('Audit committed successfully'));

      component.onCommit();
      tick();

      expect(auditService.commitAudit).toHaveBeenCalledWith('26050914302355');
      expect(snackBar.open).toHaveBeenCalledWith(
        'Audit completed successfully.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] }),
      );
    }));

    it('should not commit when no sessionId', () => {
      component.sessionId = '';
      component.onCommit();
      expect(auditService.commitAudit).not.toHaveBeenCalled();
    });

    it('should show error on commit failure', fakeAsync(() => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      spyOn(matDialog, 'open').and.returnValue(dialogRefSpy);
      auditService.commitAudit.and.returnValue(
        throwError(() => ({ error: { message: 'Commit failed' } }))
      );

      component.onCommit();
      tick();

      expect(snackBar.open).toHaveBeenCalledWith('Commit failed', 'Close', jasmine.any(Object));
      expect(component.isLoading).toBeFalse();
    }));

    it('should not call commitAudit when dialog is cancelled', fakeAsync(() => {
      const cancelDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      cancelDialogRef.afterClosed.and.returnValue(of(false));
      spyOn(matDialog, 'open').and.returnValue(cancelDialogRef);

      component.onCommit();
      tick();

      expect(auditService.commitAudit).not.toHaveBeenCalled();
    }));
  });

  describe('Date Formatting', () => {
    it('should format valid ISO date to DD-MMM-YYYY', () => {
      expect(component.formatDate('2028-01-15T00:00:00')).toBe('15-JAN-2028');
    });

    it('should return empty for null date', () => {
      expect(component.formatDate(null)).toBe('');
    });

    it('should return empty for undefined date', () => {
      expect(component.formatDate(undefined)).toBe('');
    });
  });

  describe('Chapter Changes', () => {
    it('should clear data and reload options when chapter changes', fakeAsync(() => {
      auditService.startAudit.and.returnValue(of(mockAuditResponse));
      component.filterForm.patchValue({
        idType: 'Donation',
        fromDate: new Date('2025-01-01'),
        toDate: new Date('2025-05-09'),
      });
      component.onRetrieve();
      tick();
      expect(component.hasData).toBeTrue();
      chapterChanged$.next();
      tick();

      expect(component.hasData).toBeFalse();
      expect(component.records.length).toBe(0);
      expect(auditService.getOptions).toHaveBeenCalled();
    }));
  });

  describe('Component Cleanup', () => {
    it('should complete destroy$ on component destroy', () => {
      destroySpy = spyOn(component['destroy$'], 'next');
      completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should update search aria label when idType changes to Deferral', () => {
      component.filterForm.patchValue({ idType: 'Deferral' });
      expect(component.searchConfig.ariaLabel).toBe('Search by Deferral ID');
    });
  });

  describe('Navigation - onAuditDetail', () => {
    it('should navigate to audit-donation route for Donation type', () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');
      component.filterForm.patchValue({ idType: 'Donation' });

      component.onAuditDetail(mockRecordOk);

      expect(router.navigate).toHaveBeenCalledWith(
        ['/donor-functions/registration/audit-donation'],
        { queryParams: {
          unitId: mockRecordOk.idValue,
          collectionDate: mockRecordOk.collDate,
          returnUrl: '/donor-functions/registration/registration-general-functions/paperless-nursing-audit',
          parentLabel: 'Paperless Nursing Audit',
        } },
      );
    });

    it('should navigate to donation-deferral-audit-drawer for Deferral type', () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');
      component.filterForm.patchValue({ idType: 'Deferral' });

      const deferralRecord: NursingAuditRecordDto = {
        ...mockRecordOk,
        idType: 'Deferral',
        displayIdValue: 'DEF001',
        idValue: 'DEF001',
      };
      component.onAuditDetail(deferralRecord);

      expect(router.navigate).toHaveBeenCalledWith(
        ['/donor-functions/registration/donation-deferral-audit-drawer'],
        { queryParams: {
          deferralId: 'DEF001',
          returnUrl: '/donor-functions/registration/registration-general-functions/paperless-nursing-audit',
          parentLabel: 'Paperless Nursing Audit',
        } },
      );
    });

    it('should use idValue when displayIdValue is not set for Donation type', () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');
      component.filterForm.patchValue({ idType: 'Donation' });

      const recordNoDisplay: NursingAuditRecordDto = { ...mockRecordOk, displayIdValue: '', idValue: 'RAWVAL' };
      component.onAuditDetail(recordNoDisplay);

      expect(router.navigate).toHaveBeenCalledWith(
        ['/donor-functions/registration/audit-donation'],
        { queryParams: {
          unitId: 'RAWVAL',
          collectionDate: recordNoDisplay.collDate,
          returnUrl: '/donor-functions/registration/registration-general-functions/paperless-nursing-audit',
          parentLabel: 'Paperless Nursing Audit',
        } },
      );
    });
  });

  describe('Dialog - onViewDetails', () => {
    it('should open RecordDetailDialogComponent with the record data', () => {
      const viewDialogRef = jasmine.createSpyObj<MatDialogRef<RecordDetailDialogComponent>>('MatDialogRef', ['afterClosed']);
      spyOn(matDialog, 'open').and.returnValue(viewDialogRef as unknown as MatDialogRef<RecordDetailDialogComponent>);

      component.onViewDetails(mockRecordOk);

      expect(matDialog.open).toHaveBeenCalledWith(RecordDetailDialogComponent, {
        width: '700px',
        data: mockRecordOk,
        autoFocus: false,
      });
    });
  });

  describe('Dialog - onOpenInfoDialog', () => {
    it('should open IncludeExcludeInfoDialogComponent', () => {
      const infoDialogRef = jasmine.createSpyObj<MatDialogRef<IncludeExcludeInfoDialogComponent>>('MatDialogRef', ['afterClosed']);
      spyOn(matDialog, 'open').and.returnValue(infoDialogRef as unknown as MatDialogRef<IncludeExcludeInfoDialogComponent>);

      component.onOpenInfoDialog();

      expect(matDialog.open).toHaveBeenCalledWith(IncludeExcludeInfoDialogComponent, {
        width: '500px',
        autoFocus: false,
      });
    });
  });

  describe('Filter Panel', () => {
    it('should set filterPanelOpen to true when toggled from false', () => {
      component.filterPanelOpen = false;
      component.onToggleFilterPanel();
      expect(component.filterPanelOpen).toBeTrue();
    });

    it('should set filterPanelOpen to false when toggled from true', () => {
      component.filterPanelOpen = true;
      component.onToggleFilterPanel();
      expect(component.filterPanelOpen).toBeFalse();
    });

    it('should clear status filter and close panel on onFilterClear', () => {
      component.filterStatusValue = 'HOLD';
      component.activeStatusFilter = 'HOLD';
      component.filterPanelOpen = true;

      component.onFilterClear();

      expect(component.filterStatusValue).toBeNull();
      expect(component.activeStatusFilter).toBeNull();
      expect(component.filterPanelOpen).toBeFalse();
      expect(component.filterChips.length).toBe(0);
    });

    it('should close filter panel on onFilterClose', () => {
      component.filterPanelOpen = true;
      component.onFilterClose();
      expect(component.filterPanelOpen).toBeFalse();
    });

    it('should clear filter and reload', fakeAsync(() => {
      auditService.startAudit.and.returnValue(of(mockAuditResponse));
      component.filterForm.patchValue({
        idType: 'Donation',
        fromDate: new Date('2025-01-01'),
        toDate: new Date('2025-05-09'),
      });
      component.onRetrieve();
      tick();

      component.filterStatusValue = 'HOLD';
      component.onFilterApply();
      expect(component.activeStatusFilter).toBe('HOLD');

      component.onFilterClear();
      expect(component.activeStatusFilter).toBeNull();
      expect(component.filterStatusValue).toBeNull();
    }));
  });

  describe('Filter Chips', () => {
    beforeEach(fakeAsync(() => {
      component.filterForm.patchValue({
        idType: 'Donation',
        fromDate: new Date('2025-01-01'),
        toDate: new Date('2025-05-09'),
      });
      auditService.startAudit.and.returnValue(of(mockAuditResponse));
      component.onRetrieve();
      tick();
    }));

    it('should remove status chip and re-apply filters on onRemoveChip("status")', () => {
      component.filterStatusValue = 'HOLD';
      component.onFilterApply();
      expect(component.activeStatusFilter).toBe('HOLD');
      expect(component.filterChips.length).toBe(1);

      component.onRemoveChip('status');

      expect(component.activeStatusFilter).toBeNull();
      expect(component.filterStatusValue).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(component.totalFilteredRecords).toBe(2);
    });

    it('should clear all chips and show all records on onClearAllChips', () => {
      component.filterStatusValue = 'OK';
      component.onFilterApply();
      expect(component.filterChips.length).toBe(1);

      component.onClearAllChips();

      expect(component.activeStatusFilter).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(component.totalFilteredRecords).toBe(2);
    });

    it('should not change status filter for unknown chip key in onRemoveChip', () => {
      component.activeStatusFilter = 'HOLD';
      component.onRemoveChip('unknown');
      expect(component.activeStatusFilter).toBe('HOLD');
    });
  });

  describe('Include/Exclude helpers', () => {
    it('getIncludeExcludeValue returns exclude for X flag', () => {
      const record = { ...mockRecordOk, excludeFlag: 'X' as string | null };
      expect(component.getIncludeExcludeValue(record)).toBe('exclude');
    });

    it('getIncludeExcludeValue returns include for null flag', () => {
      const record = { ...mockRecordOk, excludeFlag: null };
      expect(component.getIncludeExcludeValue(record)).toBe('include');
    });

    it('should set include when value is include', fakeAsync(() => {
      auditService.startAudit.and.returnValue(of(mockAuditResponse));
      component.filterForm.patchValue({
        idType: 'Donation',
        fromDate: new Date('2025-01-01'),
        toDate: new Date('2025-05-09'),
      });
      component.onRetrieve();
      tick();

      auditService.updateExcludeFlags.and.returnValue(of(true));
      const record = component.records[0];
      record.excludeFlag = 'X';
      component.onIncludeExcludeChange(record, 'include');
      tick();

      expect(record.excludeFlag).toBeNull();
    }));
  });

  describe('Sort and Pagination', () => {
    beforeEach(fakeAsync(() => {
      component.filterForm.patchValue({
        idType: 'Donation',
        fromDate: new Date('2025-01-01'),
        toDate: new Date('2025-05-09'),
      });
      auditService.startAudit.and.returnValue(of(mockAuditResponse));
      component.onRetrieve();
      tick();
    }));

    it('should apply sort and reset pageIndex on onSortChange', () => {
      component.pageIndex = 2;
      component.onSortChange({ active: 'status', direction: 'asc' });

      expect(component.currentSort).toEqual({ active: 'status', direction: 'asc' });
      expect(component.pageIndex).toBe(0);
    });

    it('should sort records descending on onSortChange with desc direction', () => {
      component.onSortChange({ active: 'status', direction: 'desc' });

      expect(component.currentSort.direction).toBe('desc');
      expect(component.totalFilteredRecords).toBe(2);
    });

    it('should update pageIndex and pageSize on onPageChange', () => {
      component.onPageChange({ pageIndex: 1, pageSize: 10, length: 2 } as PageEvent);

      expect(component.pageIndex).toBe(1);
      expect(component.pageSize).toBe(10);
    });
  });

  describe('Date Error Messages', () => {
    it('should return empty string from getFromDateError when control not touched', () => {
      expect(component.getFromDateError()).toBe('');
    });

    it('should return empty string from getToDateError when control not touched', () => {
      expect(component.getToDateError()).toBe('');
    });

    it('should return dateBefore error for toDate when toDate is before fromDate', () => {
      component.filterForm.get('fromDate')!.setValue(new Date('2025-06-01'));
      component.filterForm.get('toDate')!.setValue(new Date('2025-01-01'));
      component.filterForm.get('toDate')!.markAsTouched();
      component.filterForm.get('toDate')!.updateValueAndValidity();

      expect(component.getToDateError()).toBe('To date cannot be before From date');
    });

    it('should return matDatepickerParse error for fromDate when control has parse error', () => {
      const ctrl = component.filterForm.get('fromDate')!;
      ctrl.setErrors({ matDatepickerParse: { text: 'bad-date' } });
      ctrl.markAsTouched();

      expect(component.getFromDateError()).toBe('From Date is invalid');
    });

    it('should return matDatepickerMax error for fromDate when date is in the future', () => {
      const ctrl = component.filterForm.get('fromDate')!;
      ctrl.setErrors({ matDatepickerMax: { max: new Date(), actual: new Date() } });
      ctrl.markAsTouched();

      expect(component.getFromDateError()).toBe('From Date cannot be a future date');
    });

    it('should return matDatepickerParse error for toDate when control has parse error', () => {
      const ctrl = component.filterForm.get('toDate')!;
      ctrl.setErrors({ matDatepickerParse: { text: 'bad-date' } });
      ctrl.markAsTouched();

      expect(component.getToDateError()).toBe('To Date is invalid');
    });

    it('should return matDatepickerMax error for toDate when date is in the future', () => {
      const ctrl = component.filterForm.get('toDate')!;
      ctrl.setErrors({ matDatepickerMax: { max: new Date(), actual: new Date() } });
      ctrl.markAsTouched();

      expect(component.getToDateError()).toBe('To Date cannot be a future date');
    });

    it('should return required message for toDate', () => {
      const control = component.filterForm.get('toDate');
      control?.markAsTouched();
      expect(component.getToDateError()).toBe('To Collection Date is required');
    });

    it('should return required message for fromDate when input empty', () => {
      const control = component.filterForm.get('fromDate');
      control?.markAsTouched();
      expect(component.getFromDateError()).toBe('From Collection Date is required');
    });
  });

  describe('isRetrieveDisabled', () => {
    it('should be true when form is invalid', () => {
      component.filterForm.patchValue({ idType: '' });
      expect(component.isRetrieveDisabled).toBeTrue();
    });
  });

  describe('loadDriveIds error path', () => {
    it('should reset driveIdOptions to [] when getDriveIds throws', fakeAsync(() => {
      auditService.getDriveIds.and.returnValue(throwError(() => new Error('Network error')));

      component.filterForm.patchValue({
        idType: 'Donation',
        fromDate: new Date('2025-01-01'),
        toDate: new Date('2025-05-09'),
      });
      tick();

      expect(component.driveIdOptions).toEqual([]);
      expect(component.filteredDriveIdOptions).toEqual([]);
      expect(component.isLoadingDriveIds).toBeFalse();
    }));
  });

  describe('loadOptions edge cases', () => {
    it('should not patch idType when options array is empty', fakeAsync(() => {
      auditService.getOptions.and.returnValue(of([]));
      component.filterForm.patchValue({ idType: 'Donation' });
      component['loadOptions']();
      tick();

      expect(component.auditOptions).toEqual([]);
      expect(component.filterForm.get('idType')?.value).toBe('Donation');
    }));

    it('should show error snackbar when getOptions fails', fakeAsync(() => {
      auditService.getOptions.and.returnValue(throwError(() => new Error('Options error')));
      component['loadOptions']();
      tick();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Failed to load audit options.',
        'Close',
        jasmine.any(Object),
      );
    }));
  });

  describe('Load options error on chapter change', () => {
    it('should show error when load options fails via chapter change', fakeAsync(() => {
      auditService.getOptions.and.returnValue(throwError(() => new Error('fail')));
      chapterChanged$.next();
      tick();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Failed to load audit options.',
        'Close',
        jasmine.any(Object)
      );
    }));
  });

  describe('Drive ID filter in applyClientFilters', () => {
    beforeEach(fakeAsync(() => {
      component.filterForm.patchValue({
        idType: 'Donation',
        fromDate: new Date('2025-01-01'),
        toDate: new Date('2025-05-09'),
      });
      auditService.startAudit.and.returnValue(of(mockAuditResponse));
      component.onRetrieve();
      tick();
    }));

    it('should filter displayed records to only those matching the selected driveId', () => {
      component.records = [
        { ...mockRecordOk, driveId: 'DRV001' },
        { ...mockRecordHold, driveId: 'DRV002' },
      ];
      component.filterForm.patchValue({ driveId: 'DRV002' });
      component['applyClientFilters']();

      expect(component.totalFilteredRecords).toBe(1);
      expect(component.dataSource.data[0].driveId).toBe('DRV002');
    });

    it('should show all records when no driveId is selected', () => {
      component.records = [
        { ...mockRecordOk, driveId: 'DRV001' },
        { ...mockRecordHold, driveId: 'DRV002' },
      ];
      component.filterForm.patchValue({ driveId: '' });
      component['applyClientFilters']();

      expect(component.totalFilteredRecords).toBe(2);
    });
  });
});

// ---------------------------------------------------------------------------
// PaperlessNursingAuditService
// ---------------------------------------------------------------------------
describe('PaperlessNursingAuditService', () => {
  let service: PaperlessNursingAuditService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);
    TestBed.configureTestingModule({
      providers: [
        PaperlessNursingAuditService,
        { provide: ApiService, useValue: mockApiService },
      ],
    });
    service = TestBed.inject(PaperlessNursingAuditService);
  });

  it('getOptions returns data[0] on success', (done) => {
    const opts = [{ code: 'D', description: 'Donation' }];
    mockApiService.get.and.returnValue(of({ success: true, data: [opts] }));
    service.getOptions().subscribe((r) => { expect(r).toEqual(opts); done(); });
  });

  it('getOptions returns [] when success=false', (done) => {
    mockApiService.get.and.returnValue(of({ success: false, data: null, message: null }));
    service.getOptions().subscribe((r) => { expect(r).toEqual([]); done(); });
  });

  it('getOptions returns [] when data is empty array', (done) => {
    mockApiService.get.and.returnValue(of({ success: true, data: [] }));
    service.getOptions().subscribe((r) => { expect(r).toEqual([]); done(); });
  });

  it('startAudit returns data[0] on success', (done) => {
    const resp = { sessionId: 'S1', records: [], summary: { totalCount: 0, okCount: 0, holdCount: 0 } };
    mockApiService.post.and.returnValue(of({ success: true, data: [resp] }));
    service.startAudit({ idType: 'Donation', fromDate: '2024-01-01', toDate: '2024-12-31' }).subscribe((r) => {
      expect(r).toEqual(resp);
      done();
    });
  });

  it('startAudit throws when success=false', (done) => {
    mockApiService.post.and.returnValue(of({ success: false, data: null, message: 'Failed' }));
    service.startAudit({ idType: 'Donation', fromDate: '2024-01-01', toDate: '2024-12-31' }).subscribe({
      error: (err) => { expect(err.message).toBe('Failed'); done(); },
    });
  });

  it('startAudit throws with default message when message is null', (done) => {
    mockApiService.post.and.returnValue(of({ success: false, data: null, message: null }));
    service.startAudit({ idType: 'Donation', fromDate: '2024-01-01', toDate: '2024-12-31' }).subscribe({
      error: (err) => { expect(err.message).toBe('Failed to start audit'); done(); },
    });
  });

  it('getRecords returns data[0] on success', (done) => {
    const resp = { sessionId: 'S1', records: [], summary: { totalCount: 0, okCount: 0, holdCount: 0 } };
    mockApiService.get.and.returnValue(of({ success: true, data: [resp] }));
    service.getRecords('S1').subscribe((r) => { expect(r).toEqual(resp); done(); });
  });

  it('getRecords throws when no data', (done) => {
    mockApiService.get.and.returnValue(of({ success: false, data: null, message: 'No records' }));
    service.getRecords('S1').subscribe({
      error: (err) => { expect(err.message).toBe('No records'); done(); },
    });
  });

  it('getRecords throws with default message when message is null', (done) => {
    mockApiService.get.and.returnValue(of({ success: false, data: null, message: null }));
    service.getRecords('S1').subscribe({
      error: (err) => { expect(err.message).toBe('No records found'); done(); },
    });
  });

  it('updateExcludeFlags returns true on success', (done) => {
    mockApiService.put.and.returnValue(of({ success: true }));
    service.updateExcludeFlags('S1', [{ idValue: 'W123', excludeFlag: 'X' }]).subscribe((r) => {
      expect(r).toBeTrue();
      done();
    });
  });

  it('updateExcludeFlags throws when success=false', (done) => {
    mockApiService.put.and.returnValue(of({ success: false, message: 'Update failed' }));
    service.updateExcludeFlags('S1', [{ idValue: 'W123', excludeFlag: 'X' }]).subscribe({
      error: (err) => { expect(err.message).toBe('Update failed'); done(); },
    });
  });

  it('updateExcludeFlags throws with default message when message is null', (done) => {
    mockApiService.put.and.returnValue(of({ success: false, message: null }));
    service.updateExcludeFlags('S1', [{ idValue: 'W123', excludeFlag: null }]).subscribe({
      error: (err) => { expect(err.message).toBe('Failed to update exclude flags'); done(); },
    });
  });

  it('commitAudit returns message on success', (done) => {
    mockApiService.post.and.returnValue(of({ success: true, message: 'Done' }));
    service.commitAudit('S1').subscribe((r) => { expect(r).toBe('Done'); done(); });
  });

  it('commitAudit uses default message when message is null', (done) => {
    mockApiService.post.and.returnValue(of({ success: true, message: null }));
    service.commitAudit('S1').subscribe((r) => { expect(r).toBe('Audit committed successfully'); done(); });
  });

  it('commitAudit throws when success=false', (done) => {
    mockApiService.post.and.returnValue(of({ success: false, message: 'Commit failed' }));
    service.commitAudit('S1').subscribe({
      error: (err) => { expect(err.message).toBe('Commit failed'); done(); },
    });
  });

  it('commitAudit throws with default message when message is null', (done) => {
    mockApiService.post.and.returnValue(of({ success: false, message: null }));
    service.commitAudit('S1').subscribe({
      error: (err) => { expect(err.message).toBe('Commit failed'); done(); },
    });
  });

  it('getDriveIds returns data[0] on success', (done) => {
    const ids = ['DRV001', 'DRV002'];
    mockApiService.get.and.returnValue(of({ success: true, data: [ids] }));
    service.getDriveIds('Donation', '2024-01-01', '2024-12-31').subscribe((r) => {
      expect(r).toEqual(ids);
      done();
    });
  });

  it('getDriveIds returns [] when no data', (done) => {
    mockApiService.get.and.returnValue(of({ success: false, data: null, message: null }));
    service.getDriveIds('Donation', '2024-01-01', '2024-12-31').subscribe((r) => {
      expect(r).toEqual([]);
      done();
    });
  });

  it('getDriveIds returns [] when data is empty', (done) => {
    mockApiService.get.and.returnValue(of({ success: true, data: [] }));
    service.getDriveIds('Donation', '2024-01-01', '2024-12-31').subscribe((r) => {
      expect(r).toEqual([]);
      done();
    });
  });
});

// ---------------------------------------------------------------------------
// RecordDetailDialogComponent
// ---------------------------------------------------------------------------
describe('RecordDetailDialogComponent', () => {
  let component: RecordDetailDialogComponent;
  let fixture: ComponentFixture<RecordDetailDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<RecordDetailDialogComponent>>;

  const mockRecord: NursingAuditRecordDto = {
    sessionId: 'S1',
    chapterId: 'CH01',
    idType: 'Donation',
    idValue: 'W454510974018',
    displayIdValue: 'W454510974018-T',
    collDate: '2024-01-15T00:00:00',
    donorId: 'D001',
    status: 'OK',
    reason: null,
    excludeFlag: null,
    driveId: 'DRV001',
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    await TestBed.configureTestingModule({
      imports: [RecordDetailDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockRecord },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(RecordDetailDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('exposes injected dialog data', () => expect(component.data).toEqual(mockRecord));

  it('formatDate returns - for null', () => expect(component.formatDate(null)).toBe('-'));

  it('formatDate returns - for undefined', () => expect(component.formatDate(undefined)).toBe('-'));

  it('formatDate returns - for empty string', () => expect(component.formatDate('')).toBe('-'));

  it('formatDate returns upper-cased date for valid ISO string', () =>
    expect(component.formatDate('2024-01-15T00:00:00')).toBe('15-JAN-2024'));

  it('formatDate returns - for invalid string', () =>
    expect(component.formatDate('not-a-date')).toBe('-'));

  it('onClose calls dialogRef.close', () => {
    component.onClose();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// IncludeExcludeInfoDialogComponent
// ---------------------------------------------------------------------------
describe('IncludeExcludeInfoDialogComponent', () => {
  let component: IncludeExcludeInfoDialogComponent;
  let fixture: ComponentFixture<IncludeExcludeInfoDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<IncludeExcludeInfoDialogComponent>>;

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    await TestBed.configureTestingModule({
      imports: [IncludeExcludeInfoDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(IncludeExcludeInfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('onClose calls dialogRef.close', () => {
    component.onClose();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});
