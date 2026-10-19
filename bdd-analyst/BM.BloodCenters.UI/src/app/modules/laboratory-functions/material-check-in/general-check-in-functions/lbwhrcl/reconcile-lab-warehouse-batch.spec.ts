import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { ReconcileLabWarehouseBatchComponent } from './reconcile-lab-warehouse-batch';
import { ReconcileLabWarehouseBatchApiService } from './services/reconcile-lab-warehouse-batch-api.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  BatchHeaderDto,
  BatchDetailDto,
  BatchDetailUiModel,
  ReasonCodeDto,
  ReconcileBatchResponseDto,
} from './models/reconcile-lab-warehouse-batch.model';
import { AddReconciliationReasonDialogResult } from './add-reconciliation-reason-dialog/add-reconciliation-reason-dialog';
import { Subject } from 'rxjs';
import { createMockSnackbarService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ReconcileLabWarehouseBatchComponent', () => {
  let updatedRow: any;
  let dialogRefSpy: any;
  let component: ReconcileLabWarehouseBatchComponent;
  let fixture: ComponentFixture<ReconcileLabWarehouseBatchComponent>;
  let apiServiceSpy: jasmine.SpyObj<ReconcileLabWarehouseBatchApiService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let chapterChangedSubject: Subject<void>;

  const mockReasonCodes: ReasonCodeDto[] = [
    { code: 'DMGD', codeDesc: 'Damaged during transport' },
    { code: 'EXPD', codeDesc: 'Expired product' },
    { code: 'LOST', codeDesc: 'Lost in transit' },
  ];

  const mockBatchHeader: BatchHeaderDto = {
    batchId: 'BATCH001',
    createDate: '11-JAN-2026',
    toWarehouse: 'B',
    toWhDesc: 'Blood Center Technologies',
    batchStatus: 'CLOSE',
  };

  const mockBatchDetails: BatchDetailDto[] = [
    {
      batchId: 'BATCH001',
      unitId: 'W12342402705',
      chkDigit: '12',
      productCode: 'E009X00',
      productCodeDesc: 'Red Blood Cells (AS54)',
      aliquot: 'Q',
      reconReason: null,
      reasonCdDesc: null,
      reconDetail: null,
      collDate: '15-DEC-2023',
    },
    {
      batchId: 'BATCH001',
      unitId: 'W12342402705',
      chkDigit: '34',
      productCode: 'E009X00',
      productCodeDesc: 'Red Blood Cells (AS54)',
      aliquot: 'D',
      reconReason: null,
      reasonCdDesc: null,
      reconDetail: null,
      collDate: '16-DEC-2023',
    },
  ];

  const toUiModel = (d: BatchDetailDto) => ({
    ...d,
    selected: false,
    rowId: `${d.unitId}_${d.productCode || ''}_${d.aliquot || ''}`,
  });

  beforeEach(async () => {
    chapterChangedSubject = new Subject<void>();
    apiServiceSpy = jasmine.createSpyObj('ReconcileLabWarehouseBatchApiService', [
      'getBatches',
      'getBatchHeader',
      'getBatchDetails',
      'getReasonCodes',
      'reconcileBatch',
    ]);
    dialogSpy = createMockMatDialog();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy().and.returnValue({
        title: 'Reconcile Lab Warehouse Batch',
        subtitle: 'Review and resolve transfer batches',
      }),
    });
    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChangedSubject.asObservable() });
    snackbarServiceSpy = createMockSnackbarService();

    apiServiceSpy.getBatches.and.returnValue(of([{ batchId: 'BATCH001', createDate: '11-JAN-2026' }]));
    apiServiceSpy.getReasonCodes.and.returnValue(of(mockReasonCodes));
    apiServiceSpy.getBatchHeader.and.returnValue(of(mockBatchHeader));
    apiServiceSpy.getBatchDetails.and.returnValue(of(mockBatchDetails));

    await TestBed.configureTestingModule({
      imports: [ReconcileLabWarehouseBatchComponent, NoopAnimationsModule],
      providers: [
        { provide: ReconcileLabWarehouseBatchApiService, useValue: apiServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {} }, params: of({}) } },
      ],
    })
    .overrideProvider(MatDialog, { useValue: dialogSpy })
    .compileComponents();

    fixture = TestBed.createComponent(ReconcileLabWarehouseBatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Initialization', () => {
    it('should load reason codes on init', () => {
      expect(apiServiceSpy.getReasonCodes).toHaveBeenCalled();
      expect(component.reasonCodes()).toEqual(mockReasonCodes);
    });

    it('should load batches on init', () => {
      expect(apiServiceSpy.getBatches).toHaveBeenCalled();
      expect(component.batches().length).toBe(1);
    });

    it('should handle error when loading batches fails', fakeAsync(() => {
      apiServiceSpy.getBatches.and.returnValue(throwError(() => new Error('Network error')));
      (component as any).loadBatches();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should handle error when loading reason codes fails', fakeAsync(() => {
      apiServiceSpy.getReasonCodes.and.returnValue(throwError(() => new Error('Network error')));
      (component as any).loadReasonCodes();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));
  });

  describe('Batch Search Filtering', () => {
    it('should filter batches by search term', () => {
      component.batches.set([
        { batchId: 'BATCH001', createDate: '11-JAN-2026' },
        { batchId: 'BATCH002', createDate: '12-JAN-2026' },
        { batchId: 'TEST001', createDate: '13-JAN-2026' },
      ]);
      component.batchSearchControl.setValue('BATCH');
      expect(component.filteredBatches().length).toBe(2);
    });

    it('should show all batches when search is empty', () => {
      component.batches.set([
        { batchId: 'BATCH001', createDate: '11-JAN-2026' },
        { batchId: 'TEST001', createDate: '13-JAN-2026' },
      ]);
      component.batchSearchControl.setValue('');
      expect(component.filteredBatches().length).toBe(2);
    });

    it('should be case-insensitive when filtering', () => {
      component.batches.set([
        { batchId: 'BATCH001', createDate: '11-JAN-2026' },
      ]);
      component.batchSearchControl.setValue('batch');
      expect(component.filteredBatches().length).toBe(1);
    });

    it('should show all batches when search term is null', () => {
      component.batches.set([
        { batchId: 'BATCH001', createDate: '11-JAN-2026' },
        { batchId: 'OTHER999', createDate: '13-JAN-2026' },
      ]);
      component.batchSearchControl.setValue(null);
      expect(component.filteredBatches().length).toBe(2);
    });

    it('should return empty when no batches match', () => {
      component.batches.set([
        { batchId: 'BATCH001', createDate: '11-JAN-2026' },
      ]);
      component.batchSearchControl.setValue('ZZZZZ');
      expect(component.filteredBatches().length).toBe(0);
    });
  });

  describe('Retrieve Batch', () => {
    it('should not retrieve when form is invalid', () => {
      component.searchForm.patchValue({ batchId: null });
      component.searchForm.markAllAsTouched();
      component.onRetrieve();
      expect(apiServiceSpy.getBatchHeader).not.toHaveBeenCalled();
    });

    it('should retrieve batch header and details when form is valid', fakeAsync(() => {
      component.searchForm.patchValue({ batchId: 'BATCH001' });

      component.onRetrieve();
      tick();

      expect(apiServiceSpy.getBatchHeader).toHaveBeenCalledWith('BATCH001');
      expect(apiServiceSpy.getBatchDetails).toHaveBeenCalledWith('BATCH001');
      expect(component.batchHeader()).toEqual(mockBatchHeader);
      expect(component.batchDetails().length).toBe(2);
    }));

    it('should show error when batch header not found', fakeAsync(() => {
      apiServiceSpy.getBatchHeader.and.returnValue(of(null as any));
      apiServiceSpy.getBatchDetails.and.returnValue(of([]));
      component.searchForm.patchValue({ batchId: 'INVALID' });

      component.onRetrieve();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Batch not found or invalid status');
    }));

    it('should handle error on batch retrieval', fakeAsync(() => {
      apiServiceSpy.getBatchHeader.and.returnValue(throwError(() => new Error('Server error')));
      apiServiceSpy.getBatchDetails.and.returnValue(throwError(() => new Error('Server error')));
      component.searchForm.patchValue({ batchId: 'BATCH001' });

      component.onRetrieve();
      tick();

      expect(component.loading()).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should reset loading after retrieval completes', fakeAsync(() => {
      component.searchForm.patchValue({ batchId: 'BATCH001' });
      component.onRetrieve();
      tick();
      expect(component.loading()).toBeFalse();
      expect(component.batchDetails().length).toBe(2);
    }));

    it('should transform details into UI models with rowId and selected=false', fakeAsync(() => {
      component.searchForm.patchValue({ batchId: 'BATCH001' });
      component.onRetrieve();
      tick();

      const detail = component.batchDetails()[0];
      expect(detail.selected).toBeFalse();
      expect(detail.rowId).toBe('W12342402705_E009X00_Q');
    }));

    it('should generate rowId with empty strings for null productCode and aliquot', fakeAsync(() => {
      const detailNoProduct: BatchDetailDto = {
        batchId: 'BATCH001',
        unitId: 'U999',
        chkDigit: null,
        productCode: null,
        productCodeDesc: null,
        aliquot: null,
        reconReason: null,
        reasonCdDesc: null,
        reconDetail: null,
        collDate: null,
      };
      apiServiceSpy.getBatchDetails.and.returnValue(of([detailNoProduct]));

      component.searchForm.patchValue({ batchId: 'BATCH001' });
      component.onRetrieve();
      tick();

      expect(component.batchDetails()[0].rowId).toBe('U999__');
    }));

    it('should mark form as touched when invalid', () => {
      component.searchForm.reset();
      component.onRetrieve();
      expect(component.searchForm.get('batchId')?.touched).toBeTrue();
    });
  });

  describe('Clear All', () => {
    it('should clear form and all data', () => {
      component.searchForm.patchValue({ batchId: 'BATCH001' });
      component.batchHeader.set(mockBatchHeader);
      component.batchDetails.set(mockBatchDetails.map(toUiModel));

      component.clearAll();

      expect(component.searchForm.get('batchId')?.value).toBeNull();
      expect(component.batchHeader()).toBeNull();
      expect(component.batchDetails().length).toBe(0);
      expect(component.selectedRows().size).toBe(0);
    });
  });

  describe('Selection', () => {
    beforeEach(() => {
      component.batchDetails.set(mockBatchDetails.map(toUiModel));
    });

    it('should update selected rows on selection change', () => {
      const selected = [component.batchDetails()[0]];
      component.onSelectionChange(selected);

      expect(component.selectedRows().size).toBe(1);
      expect(component.hasSelectedRows()).toBeTrue();
    });

    it('should compute selected row count correctly', () => {
      const selected = [component.batchDetails()[0], component.batchDetails()[1]];
      component.onSelectionChange(selected);

      expect(component.selectedRowCount()).toBe(2);
    });

    it('should handle empty selection change', () => {
      component.onSelectionChange([]);
      expect(component.selectedRows().size).toBe(0);
      expect(component.hasSelectedRows()).toBeFalse();
    });
  });

  describe('Add Reconciliation Reason Dialog', () => {
    beforeEach(() => {
      component.batchDetails.set(mockBatchDetails.map(toUiModel));
    });

    it('should show error when no rows selected', () => {
      component.selectedRows.set(new Set());
      component.openAddReconciliationDialog();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please select at least one unit');
    });

    it('should apply reconciliation reason after dialog closes', fakeAsync(() => {
      const selected = [component.batchDetails()[0]];
      component.onSelectionChange(selected);

      const dialogResult: AddReconciliationReasonDialogResult = {
        reconReason: 'DMGD',
        reconDetail: 'Test detail',
      };

      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(dialogResult));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.openAddReconciliationDialog();
      tick();

      updatedRow = component.batchDetails()[0];
      expect(updatedRow.reconReason).toBe('DMGD');
      expect(updatedRow.reasonCdDesc).toBe('Damaged during transport');
      expect(updatedRow.reconDetail).toBe('Test detail');
    }));

    it('should not apply reason when dialog is cancelled', fakeAsync(() => {
      const selected = [component.batchDetails()[0]];
      component.onSelectionChange(selected);

      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.openAddReconciliationDialog();
      tick();

      expect(component.batchDetails()[0].reconReason).toBeNull();
    }));

    it('should set reasonCdDesc to null when reason code not found', fakeAsync(() => {
      const selected = [component.batchDetails()[0]];
      component.onSelectionChange(selected);

      const dialogResult: AddReconciliationReasonDialogResult = {
        reconReason: 'UNKNOWN_CODE',
        reconDetail: 'Detail text',
      };

      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(dialogResult));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.openAddReconciliationDialog();
      tick();

      expect(component.batchDetails()[0].reconReason).toBe('UNKNOWN_CODE');
      expect(component.batchDetails()[0].reasonCdDesc).toBeNull();
    }));

    it('should set reconDetail to null when reconDetail is empty string', fakeAsync(() => {
      const selected = [component.batchDetails()[0]];
      component.onSelectionChange(selected);

      const dialogResult: AddReconciliationReasonDialogResult = {
        reconReason: 'DMGD',
        reconDetail: '',
      };

      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(dialogResult));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.openAddReconciliationDialog();
      tick();

      expect(component.batchDetails()[0].reconDetail).toBeNull();
    }));

    it('should not modify unselected rows when applying reason', fakeAsync(() => {
      const selected = [component.batchDetails()[0]];
      component.onSelectionChange(selected);

      const dialogResult: AddReconciliationReasonDialogResult = {
        reconReason: 'DMGD',
        reconDetail: 'Only first row',
      };

      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(dialogResult));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.openAddReconciliationDialog();
      tick();

      expect(component.batchDetails()[1].reconReason).toBeNull();
      expect(component.batchDetails()[1].reconDetail).toBeNull();
    }));

    it('should clear table selection after applying reason', fakeAsync(() => {
      const selected = [component.batchDetails()[0]];
      component.onSelectionChange(selected);

      const dialogResult: AddReconciliationReasonDialogResult = {
        reconReason: 'DMGD',
        reconDetail: 'Test',
      };

      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(dialogResult));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.openAddReconciliationDialog();
      tick();

      expect(component.selectedRows().size).toBe(0);
    }));
  });

  describe('Edit Row', () => {
    beforeEach(() => {
      component.batchDetails.set(mockBatchDetails.map(toUiModel));
    });

    it('should open dialog for a single row via onEditRow', fakeAsync(() => {
      const row = component.batchDetails()[0];

      const dialogResult: AddReconciliationReasonDialogResult = {
        reconReason: 'LOST',
        reconDetail: 'Missing from shipment',
      };

      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(dialogResult));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onEditRow(row);
      tick();

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(component.batchDetails()[0].reconReason).toBe('LOST');
      expect(component.batchDetails()[0].reconDetail).toBe('Missing from shipment');
    }));

    it('should not change data when edit dialog is cancelled', fakeAsync(() => {
      const row = component.batchDetails()[0];

      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onEditRow(row);
      tick();

      expect(component.batchDetails()[0].reconReason).toBeNull();
    }));
  });

  describe('Row Actions', () => {
    it('should call onEditRow when row action is edit', fakeAsync(() => {
      component.batchDetails.set(mockBatchDetails.map(toUiModel));
      const row = component.batchDetails()[0];

      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onRowAction({ action: 'edit', row });
      tick();

      expect(dialogSpy.open).toHaveBeenCalled();
    }));

    it('should not open dialog for non-edit actions', () => {
      component.batchDetails.set(mockBatchDetails.map(toUiModel));
      dialogSpy.open.calls.reset();
      component.onRowAction({ action: 'delete', row: component.batchDetails()[0] });
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });
  });

  describe('Clear All Reasons', () => {
    it('should clear all reconciliation reasons from batch details', () => {
      const detailsWithReasons = mockBatchDetails.map(d => ({
        ...toUiModel(d),
        reconReason: 'DMGD',
        reasonCdDesc: 'Damaged during transport',
        reconDetail: 'Test',
      }));

      component.batchDetails.set(detailsWithReasons);

      component.clearAllReasons();

      component.batchDetails().forEach(detail => {
        expect(detail.reconReason).toBeNull();
        expect(detail.reasonCdDesc).toBeNull();
        expect(detail.reconDetail).toBeNull();
      });
    });
  });

  describe('Save Reconciliation', () => {
    it('should not save when not all items have reasons', () => {
      component.batchDetails.set(mockBatchDetails.map(toUiModel));
      component.onSave();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Please add reconciliation reasons to all units before saving'
      );
    });

    it('should not save when batch header is null', () => {
      const detailsWithReasons = mockBatchDetails.map(d => ({
        ...toUiModel(d),
        reconReason: 'DMGD',
      }));
      component.batchDetails.set(detailsWithReasons);
      component.batchHeader.set(null);

      component.onSave();

      expect(apiServiceSpy.reconcileBatch).not.toHaveBeenCalled();
    });

    it('should save when all items have reasons', fakeAsync(() => {
      const detailsWithReasons = mockBatchDetails.map(d => ({
        ...toUiModel(d),
        reconReason: 'DMGD',
        reasonCdDesc: 'Damaged during transport',
        reconDetail: 'Test',
      }));

      component.batchHeader.set(mockBatchHeader);
      component.batchDetails.set(detailsWithReasons);

      const mockResponse: ReconcileBatchResponseDto = {
        batchId: 'BATCH001',
        itemsReconciled: 2,
        pendingCount: 0,
      };

      apiServiceSpy.reconcileBatch.and.returnValue(of(mockResponse));

      component.onSave();
      tick();

      expect(apiServiceSpy.reconcileBatch).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith(
        '2 Unit IDs of Batch ID BATCH001 have been reconciled.'
      );
    }));

    it('should show singular message when 1 item reconciled', fakeAsync(() => {
      const singleDetail = [mockBatchDetails[0]].map(d => ({
        ...toUiModel(d),
        reconReason: 'DMGD',
      }));

      component.batchHeader.set(mockBatchHeader);
      component.batchDetails.set(singleDetail);

      const mockResponse: ReconcileBatchResponseDto = {
        batchId: 'BATCH001',
        itemsReconciled: 1,
        pendingCount: 0,
      };

      apiServiceSpy.reconcileBatch.and.returnValue(of(mockResponse));

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith(
        '1 Unit ID of Batch ID BATCH001 have been reconciled.'
      );
    }));

    it('should handle save error', fakeAsync(() => {
      const detailsWithReasons = mockBatchDetails.map(d => ({
        ...toUiModel(d),
        reconReason: 'DMGD',
      }));

      component.batchHeader.set(mockBatchHeader);
      component.batchDetails.set(detailsWithReasons);
      apiServiceSpy.reconcileBatch.and.returnValue(throwError(() => new Error('Save failed')));

      component.onSave();
      tick();

      expect(component.saving()).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should clear form and reload after successful save', fakeAsync(() => {
      const detailsWithReasons = mockBatchDetails.map(d => ({
        ...toUiModel(d),
        reconReason: 'DMGD',
        reconDetail: 'Test',
      }));

      component.batchHeader.set(mockBatchHeader);
      component.batchDetails.set(detailsWithReasons);
      component.searchForm.patchValue({ batchId: 'BATCH001' });

      const mockResponse: ReconcileBatchResponseDto = {
        batchId: 'BATCH001',
        itemsReconciled: 2,
        pendingCount: 0,
      };
      apiServiceSpy.reconcileBatch.and.returnValue(of(mockResponse));

      component.onSave();
      tick();

      expect(component.searchForm.get('batchId')?.value).toBeNull();
      expect(component.batchHeader()).toBeNull();
      expect(component.batchDetails().length).toBe(0);
    }));

    it('should map reconDetail as undefined when null in save request', fakeAsync(() => {
      const detailsWithReasons = mockBatchDetails.map(d => ({
        ...toUiModel(d),
        reconReason: 'DMGD',
        reconDetail: null,
        collDate: null,
      }));

      component.batchHeader.set(mockBatchHeader);
      component.batchDetails.set(detailsWithReasons);

      const mockResponse: ReconcileBatchResponseDto = {
        batchId: 'BATCH001',
        itemsReconciled: 2,
        pendingCount: 0,
      };
      apiServiceSpy.reconcileBatch.and.returnValue(of(mockResponse));

      component.onSave();
      tick();

      const callArgs = apiServiceSpy.reconcileBatch.calls.mostRecent().args[0];
      expect(callArgs.batchId).toBe('BATCH001');
      expect(callArgs.details.length).toBe(2);
      expect(callArgs.details[0].reconDetail).toBeUndefined();
      expect(callArgs.details[0].collDate).toBeUndefined();
    }));

    it('should include collDate in save request when present', fakeAsync(() => {
      const detailsWithReasons = mockBatchDetails.map(d => ({
        ...toUiModel(d),
        reconReason: 'DMGD',
        reconDetail: 'Detail',
      }));

      component.batchHeader.set(mockBatchHeader);
      component.batchDetails.set(detailsWithReasons);

      const mockResponse: ReconcileBatchResponseDto = {
        batchId: 'BATCH001',
        itemsReconciled: 2,
        pendingCount: 0,
      };
      apiServiceSpy.reconcileBatch.and.returnValue(of(mockResponse));

      component.onSave();
      tick();

      const callArgs = apiServiceSpy.reconcileBatch.calls.mostRecent().args[0];
      expect(callArgs.details[0].collDate).toBe('15-DEC-2023');
    }));
  });

  describe('Sort', () => {
    beforeEach(() => {
      component.batchDetails.set(mockBatchDetails.map(toUiModel));
    });

    it('should sort ascending on unitId', () => {
      component.onSortChange({ column: 'unitId', direction: 'A' });
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
    });

    it('should sort descending on unitId', () => {
      component.onSortChange({ column: 'unitId', direction: 'D' });
      expect(component.tableConfig.sortConfig?.direction).toBe('D');
    });

    it('should reset sort on default direction', () => {
      component.onSortChange({ column: 'unitId', direction: 'default' });
      expect(component.tableConfig.sortConfig?.direction).toBe('default');
    });

    it('should not sort on non-unitId columns', () => {
      const original = [...component.batchDetails()];
      component.onSortChange({ column: 'productCode', direction: 'A' });
      expect(component.batchDetails().length).toBe(original.length);
    });

    it('should handle sort with no column specified', () => {
      component.onSortChange({ column: '', direction: 'default' });
      expect(component.batchDetails().length).toBe(2);
    });

    it('should update tableConfig sortConfig after sort', () => {
      component.onSortChange({ column: 'unitId', direction: 'A' });
      expect(component.tableConfig.sortConfig).toEqual({ column: 'unitId', direction: 'A' });
    });
  });

  describe('Computed Values', () => {
    it('should compute totalReconcileUnits correctly', () => {
      component.batchDetails.set(mockBatchDetails.map(toUiModel));
      expect(component.totalReconcileUnits()).toBe(2);
    });

    it('should compute warehouseTransfer correctly', () => {
      component.batchHeader.set(mockBatchHeader);
      expect(component.warehouseTransfer()).toContain('B - Blood Center Technologies');
    });

    it('should return empty string for warehouseTransfer when no header', () => {
      component.batchHeader.set(null);
      expect(component.warehouseTransfer()).toBe('');
    });

    it('should compute canSave correctly when all items have reasons', () => {
      const detailsWithReasons = mockBatchDetails.map(d => ({
        ...toUiModel(d),
        reconReason: 'DMGD',
      }));

      component.batchDetails.set(detailsWithReasons);
      expect(component.canSave()).toBeTrue();
    });

    it('should compute canSave as false when items missing reasons', () => {
      component.batchDetails.set(mockBatchDetails.map(toUiModel));
      expect(component.canSave()).toBeFalse();
    });

    it('should compute canSave as false when no details', () => {
      component.batchDetails.set([]);
      expect(component.canSave()).toBeFalse();
    });

    it('should compute allReasonsAssigned correctly', () => {
      const detailsWithReasons = mockBatchDetails.map(d => ({
        ...toUiModel(d),
        reconReason: 'DMGD',
      }));
      component.batchDetails.set(detailsWithReasons);
      expect(component.allReasonsAssigned()).toBeTrue();
    });

    it('should compute allReasonsAssigned as false when details are empty', () => {
      component.batchDetails.set([]);
      expect(component.allReasonsAssigned()).toBeFalse();
    });

    it('should compute allReasonsAssigned as false when some reasons are missing', () => {
      const details = mockBatchDetails.map(toUiModel);
      details[0].reconReason = 'DMGD';
      component.batchDetails.set(details);
      expect(component.allReasonsAssigned()).toBeFalse();
    });

    it('should compute hasAnyReasonAssigned correctly', () => {
      const details = mockBatchDetails.map(toUiModel);
      details[0] = { ...details[0], reconReason: 'DMGD' };
      component.batchDetails.set(details);
      expect(component.hasAnyReasonAssigned()).toBeTrue();
    });

    it('should compute hasAnyReasonAssigned as false when no reasons assigned', () => {
      component.batchDetails.set(mockBatchDetails.map(toUiModel));
      expect(component.hasAnyReasonAssigned()).toBeFalse();
    });

    it('should compute showEmptyState correctly', () => {
      component.loading.set(false);
      component.batchDetails.set([]);
      expect(component.showEmptyState()).toBeTrue();
    });

    it('should compute showEmptyState as false when loading', () => {
      component.loading.set(true);
      component.batchDetails.set([]);
      expect(component.showEmptyState()).toBeFalse();
    });

    it('should compute showEmptyState as false when details exist', () => {
      component.loading.set(false);
      component.batchDetails.set(mockBatchDetails.map(toUiModel));
      expect(component.showEmptyState()).toBeFalse();
    });

    it('should compute showTable correctly', () => {
      component.loading.set(false);
      component.batchDetails.set(mockBatchDetails.map(toUiModel));
      expect(component.showTable()).toBeTrue();
    });

    it('should compute showTable as false when loading', () => {
      component.loading.set(true);
      component.batchDetails.set(mockBatchDetails.map(toUiModel));
      expect(component.showTable()).toBeFalse();
    });

    it('should compute showTable as false when no details', () => {
      component.loading.set(false);
      component.batchDetails.set([]);
      expect(component.showTable()).toBeFalse();
    });

    it('should compute totalReconcileUnits as 0 when empty', () => {
      component.batchDetails.set([]);
      expect(component.totalReconcileUnits()).toBe(0);
    });

    it('should compute hasSelectedRows as false when no selection', () => {
      component.selectedRows.set(new Set());
      expect(component.hasSelectedRows()).toBeFalse();
    });

    it('should compute selectedRowCount as 0 when no selection', () => {
      component.selectedRows.set(new Set());
      expect(component.selectedRowCount()).toBe(0);
    });
  });

  describe('Table Configuration', () => {
    it('should build table config on init', () => {
      expect(component.tableConfig).toBeDefined();
      expect(component.tableConfig.columns.length).toBe(6);
    });

    it('should have selection enabled', () => {
      expect(component.tableConfig.enableSelection).toBeTrue();
    });

    it('should format unitId with aliquot for components', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'unitId');
      const row = { productCode: 'E009X00', aliquot: 'Q' } as BatchDetailUiModel;
      expect(col?.valueFormatter?.('W123', row)).toBe('W123-Q');
    });

    it('should format unitId without aliquot for whole units', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'unitId');
      const row = { productCode: null, aliquot: null } as unknown as BatchDetailUiModel;
      expect(col?.valueFormatter?.('W123', row)).toBe('W123');
    });

    it('should format productCode with dash when null', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'productCode');
      expect(col?.valueFormatter?.(null, {} as BatchDetailUiModel)).toBe('-');
    });

    it('should format productCodeDesc with dash when null', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'productCodeDesc');
      expect(col?.valueFormatter?.(null, {} as BatchDetailUiModel)).toBe('-');
    });

    it('should format reconReason as empty when null', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'reconReason');
      expect(col?.valueFormatter?.(null, {} as BatchDetailUiModel)).toBe('');
    });

    it('should format reasonCdDesc as empty when null', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'reasonCdDesc');
      expect(col?.valueFormatter?.(null, {} as BatchDetailUiModel)).toBe('');
    });

    it('should format reconDetail as empty when null', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'reconDetail');
      expect(col?.valueFormatter?.(null, {} as BatchDetailUiModel)).toBe('');
    });

    it('should have sortConfig with default column and direction', () => {
      expect(component.tableConfig.sortConfig).toEqual({ column: 'unitId', direction: 'D' });
    });

    it('should have stickyHeader enabled', () => {
      expect(component.tableConfig.stickyHeader).toBeTrue();
    });

    it('should have selectionKey set to rowId', () => {
      expect(component.tableConfig.selectionKey).toBe('rowId');
    });

    it('should have empty message configured', () => {
      expect(component.tableConfig.emptyMessage).toBe('No Results to Display');
    });

    it('should have enableRowHighlight enabled', () => {
      expect(component.tableConfig.enableRowHighlight).toBeTrue();
    });

    it('should have unitId column as sortable', () => {
      const unitIdCol = component.tableConfig.columns.find(c => c.key === 'unitId');
      expect(unitIdCol!.sortable).toBeTrue();
    });

    it('should have productCode column as not sortable', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'productCode');
      expect(col!.sortable).toBeFalse();
    });
  });

  describe('Date Formatting', () => {
    it('should format valid dates correctly', () => {
      const formatted = component.formatDate('2024-01-15');
      expect(formatted).toMatch(/\d{2}-[A-Z]{3}-\d{4}/);
    });

    it('should return dash for null date', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return dash for undefined date', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('should return dash for invalid date', () => {
      expect(component.formatDate('not-a-date')).toBe('-');
    });

    it('should return dash for empty string', () => {
      expect(component.formatDate('')).toBe('-');
    });

    it('should format Date object correctly', () => {
      const result = component.formatDate(new Date('2024-06-15'));
      expect(result).toMatch(/\d{2}-[A-Z]{3}-\d{4}/);
    });
  });

  describe('TrackBy', () => {
    it('should generate unique track key from unitId, productCode and aliquot', () => {
      const item = toUiModel(mockBatchDetails[0]) as BatchDetailUiModel;
      const key = component.trackByUnitId(0, item);
      expect(key).toBe('W12342402705-E009X00-Q');
    });

    it('should handle null productCode and aliquot', () => {
      const item = { ...toUiModel(mockBatchDetails[0]), productCode: null, aliquot: null } as unknown as BatchDetailUiModel;
      const key = component.trackByUnitId(0, item);
      expect(key).toBe('W12342402705--');
    });

    it('should handle item with null productCode', () => {
      const item = { ...toUiModel(mockBatchDetails[0]), productCode: null };
      const result = component.trackByUnitId(0, item);
      expect(result).toBe('W12342402705--Q');
    });

    it('should handle item with null aliquot', () => {
      const item = { ...toUiModel(mockBatchDetails[0]), aliquot: null };
      const result = component.trackByUnitId(0, item);
      expect(result).toBe('W12342402705-E009X00-');
    });
  });

  describe('Form Controls', () => {
    it('should expose form controls via f getter', () => {
      expect(component.f).toBeDefined();
      expect(component.f['batchId']).toBeDefined();
    });
  });

  describe('Lifecycle', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should call buildTableConfig, loadBatches, loadReasonCodes, setupBatchSearch, and subscribeToChapterChanges on init', () => {
      expect(apiServiceSpy.getBatches).toHaveBeenCalled();
      expect(apiServiceSpy.getReasonCodes).toHaveBeenCalled();
      expect(component.tableConfig).toBeDefined();
    });
  });

  describe('Chapter Change Subscription', () => {
    it('should clear all and reload batches when chapter changes', fakeAsync(() => {
      component.searchForm.patchValue({ batchId: 'BATCH001' });
      component.batchHeader.set(mockBatchHeader);
      component.batchDetails.set(mockBatchDetails.map(toUiModel));

      apiServiceSpy.getBatches.calls.reset();

      chapterChangedSubject.next();
      tick();

      expect(component.searchForm.get('batchId')?.value).toBeNull();
      expect(component.batchHeader()).toBeNull();
      expect(component.batchDetails().length).toBe(0);
      expect(apiServiceSpy.getBatches).toHaveBeenCalled();
    }));
  });

  describe('Load Batches', () => {
    it('should set batches and filteredBatches on success', () => {
      const batchList = [
        { batchId: 'B1', createDate: '01-JAN-2026' },
        { batchId: 'B2', createDate: '02-JAN-2026' },
      ];
      apiServiceSpy.getBatches.and.returnValue(of(batchList));

      chapterChangedSubject.next();

      expect(component.batches().length).toBe(2);
      expect(component.filteredBatches().length).toBe(2);
    });

    it('should handle error loading batches', fakeAsync(() => {
      apiServiceSpy.getBatches.and.returnValue(throwError(() => ({ error: { message: 'Batch load error' } })));
      chapterChangedSubject.next();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should reset batch search control on successful load', () => {
      component.batchSearchControl.setValue('something');
      apiServiceSpy.getBatches.and.returnValue(of([{ batchId: 'B1', createDate: '01-JAN-2026' }]));
      chapterChangedSubject.next();
      expect(component.batchSearchControl.value).toBe('');
    });
  });

  describe('Load Errors', () => {
    it('should handle error loading reason codes', () => {
      apiServiceSpy.getReasonCodes.and.returnValue(throwError(() => ({ error: { message: 'Reason code error' } })));
      try {
        const newFixture = TestBed.createComponent(ReconcileLabWarehouseBatchComponent);
        newFixture.detectChanges();
      } catch (e) {
        // Template errors may occur, we just need the init
      }
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });
  });

  describe('Search Form Validation', () => {
    it('should be invalid when batchId is null', () => {
      component.searchForm.patchValue({ batchId: null });
      expect(component.searchForm.invalid).toBeTrue();
    });

    it('should be valid when batchId has value', () => {
      component.searchForm.patchValue({ batchId: 'BATCH001' });
      expect(component.searchForm.valid).toBeTrue();
    });

    it('should require batchId', () => {
      expect(component.searchForm.get('batchId')?.hasError('required')).toBeTrue();
    });
  });

  describe('Header Config', () => {
    it('should have default breadcrumbs with Home', () => {
      expect(component.headerConfig.breadcrumbs).toBeDefined();
      expect(component.headerConfig.breadcrumbs!.length).toBeGreaterThan(0);
      expect(component.headerConfig.breadcrumbs![0].label).toBe('Home');
    });
  });

  describe('ID Generation', () => {
    it('should generate element IDs with component prefix', () => {
      const id = component['elementId']('batchId');
      expect(id).toContain('reconcile-lab-warehouse-batch-');
      expect(id).toContain('-batchId');
    });

    it('should generate error IDs with component prefix and error suffix', () => {
      const id = component['errorId']('batchId');
      expect(id).toContain('reconcile-lab-warehouse-batch-');
      expect(id).toContain('-batchId-error');
    });

    it('should generate label IDs with component prefix and label suffix', () => {
      const id = component['labelId']('batchId');
      expect(id).toContain('reconcile-lab-warehouse-batch-');
      expect(id).toContain('-batchId-label');
    });
  });

  describe('Clear Table Selection', () => {
    it('should reset selectedRows when clearTableSelection is called', () => {
      component.selectedRows.set(new Set(mockBatchDetails.map(toUiModel)));
      component['clearTableSelection']();
      expect(component.selectedRows().size).toBe(0);
    });

    it('should handle clearTableSelection when dataTable is not available', () => {
      expect(() => component['clearTableSelection']()).not.toThrow();
    });
  });
});
