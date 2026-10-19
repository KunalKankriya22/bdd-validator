import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { TranslateService } from '@ngx-translate/core';

import { ReconcileTransportBatchComponent } from './reconcile-transport-batch';
import { ReconcileTransportBatchApiService } from './services/reconcile-transport-batch-api.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockHeaderService, createMockMatDialog, createMockSnackbarService, createMockTranslateService } from '@shared/testing/common-mocks';
import {
  BatchHeaderDto,
  BatchReconciliationDto,
  ReasonCodeDto,
  TransportDetailUiModel,
  ReconcileBatchResponseDto,
} from './models/reconcile-transport-batch.model';

describe('ReconcileTransportBatchComponent', () => {
  let translateSpy: any;
  let headerSpy: any;
  let pageHeaderSpy: any;
  let dialogSpyObj: any;
  let apiSpy: any;
  let component: ReconcileTransportBatchComponent;
  let fixture: ComponentFixture<ReconcileTransportBatchComponent>;
  let apiServiceSpy: jasmine.SpyObj<ReconcileTransportBatchApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const mockBatches: BatchHeaderDto[] = [
    {
      batchId: 'B001',
      createDate: '2026-05-20T10:30:00Z',
      toWarehouse: 'WH001',
      toWarehouseDescription: 'Main Warehouse',
    },
    {
      batchId: 'B002',
      createDate: '2026-05-22T14:15:00Z',
      toWarehouse: 'WH002',
      toWarehouseDescription: 'Secondary Warehouse',
    },
  ];

  const mockBatchDetails: BatchReconciliationDto = {
    batchId: 'B001',
    createDate: '2026-05-20T10:30:00Z',
    toWarehouse: 'WH001',
    toWarehouseDescription: 'Main Warehouse',
    currentWarehouse: 'Laboratory A',
    unreceivedUnits: [
      {
        unitId: 'U123456789',
        checkDigit: '01',
        productCode: 'RBC001',
        aliquot: '01',
        collectionDate: '2026-05-15',
        expirationDate: '2026-06-15T23:59:00Z',
        reconReason: null,
        reasonDescription: null,
        reconDetail: null,
      },
      {
        unitId: 'U987654321',
        checkDigit: '02',
        productCode: 'PLT001',
        aliquot: '01',
        collectionDate: '2026-05-16',
        expirationDate: '2026-05-25T23:59:00Z',
        reconReason: null,
        reasonDescription: null,
        reconDetail: null,
      },
    ],
  };

  const mockReasonCodes: ReasonCodeDto[] = [
    { code: 'DMGD', description: 'Unit damaged during transport' },
    { code: 'LEAK', description: 'Leaking container' },
    { code: 'TEMP', description: 'Temperature out of range' },
  ];

  beforeEach(() => {

    apiSpy = jasmine.createSpyObj('ReconcileTransportBatchApiService', [
      'getBatches',
      'getBatchDetails',
      'getReasonCodes',
      'reconcileBatch',
    ]);
    const snackbarSpy = createMockSnackbarService();
    dialogSpyObj = createMockMatDialog();
    pageHeaderSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle'], {
      pageHeaderData: jasmine.createSpy().and.returnValue(null),
    });
    pageHeaderSpy.getTitle.and.returnValue('Reconcile Transport Batch');
    headerSpy = createMockHeaderService();
    translateSpy = createMockTranslateService();
    translateSpy.instant.and.callFake((key: string) => key);
    translateSpy.get.and.callFake((key: string) => of(key));

    apiSpy.getBatches.and.returnValue(of(mockBatches));
    apiSpy.getBatchDetails.and.returnValue(of(mockBatchDetails));
    apiSpy.getReasonCodes.and.returnValue(of(mockReasonCodes));



      TestBed.configureTestingModule({
      imports: [ReconcileTransportBatchComponent, NoopAnimationsModule],
      providers: [
        { provide: ReconcileTransportBatchApiService, useValue: apiSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: MatDialog, useValue: dialogSpyObj },
        { provide: PageHeaderService, useValue: pageHeaderSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: TranslateService, useValue: translateSpy },
      ],
    });


    


      apiSpy.getBatches.calls.reset();


      apiSpy.getBatchDetails.calls.reset();


      apiSpy.getReasonCodes.calls.reset();


      apiSpy.reconcileBatch.calls.reset();


      dialogSpyObj.open.calls.reset();


      pageHeaderSpy.getTitle.calls.reset();


      headerSpy.getCurrentChapterTimezone.calls.reset();


      pageHeaderSpy.getTitle.and.returnValue('Reconcile Transport Batch');
      translateSpy.instant.and.callFake((key: string) => key);


      translateSpy.get.and.callFake((key: string) => of(key));


      apiSpy.getBatches.and.returnValue(of(mockBatches));


      apiSpy.getBatchDetails.and.returnValue(of(mockBatchDetails));


      apiSpy.getReasonCodes.and.returnValue(of(mockReasonCodes));


    apiServiceSpy = TestBed.inject(
      ReconcileTransportBatchApiService
    ) as jasmine.SpyObj<ReconcileTransportBatchApiService>;
    snackbarServiceSpy = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    pageHeaderServiceSpy = TestBed.inject(
      PageHeaderService
    ) as jasmine.SpyObj<PageHeaderService>;
    headerServiceSpy = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;

    fixture = TestBed.createComponent(ReconcileTransportBatchComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {


    it('should initialize form with null batch ID', () => {
      fixture.detectChanges();
      expect(component.searchForm.get('batchId')?.value).toBeNull();
    });

    it('should load batches on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getBatches).toHaveBeenCalled();
      expect(component.batches()).toEqual(mockBatches);
    }));

    it('should load reason codes on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getReasonCodes).toHaveBeenCalled();
      expect(component.reasonCodes()).toEqual(mockReasonCodes);
    }));
  });

  describe('Batch Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load batch details when batch selected', fakeAsync(() => {
      component.searchForm.get('batchId')?.setValue('B001');
      component.onBatchBlur();
      tick();

      expect(apiServiceSpy.getBatchDetails).toHaveBeenCalledWith('B001');
      expect(component.batchDetails()).toEqual(mockBatchDetails);
      expect(component.tableData().length).toBe(2);
    }));




  });

  describe('Empty State', () => {




    it('should not show empty state when data present', () => {
      fixture.detectChanges();
      component.loading.set(false);
      component.tableData.set([{ unitId: 'U123', rowId: 'test' } as TransportDetailUiModel]);
      fixture.detectChanges();

      expect(component.tableData().length).toBe(1);
      expect(component.loading()).toBeFalse();
      expect(component.showEmptyState()).toBeFalse();
    });
  });
  describe('Clear All', () => {
    it('should clear form and data', () => {
      component.searchForm.get('batchId')?.setValue('B001');
      component.batchDetails.set(mockBatchDetails);
      component.tableData.set([{} as TransportDetailUiModel]);

      component.clearAll();

      expect(component.searchForm.get('batchId')?.value).toBeNull();
      expect(component.batchDetails()).toBeNull();
      expect(component.tableData()).toEqual([]);
    });
  });

  describe('Selection', () => {
    const mockUnits: TransportDetailUiModel[] = [
      {
        ...mockBatchDetails.unreceivedUnits[0],
        selected: false,
        rowId: 'U123456789_RBC001_01',
      },
    ];

    it('should update selected rows on selection change', () => {
      component.onSelectionChange(mockUnits);

      expect(component.selectedRows().size).toBe(1);
      expect(component.hasSelectedRows()).toBeTrue();
    });

    it('should show selected count when rows selected', () => {
      component.selectedRows.set(new Set(mockUnits));

      expect(component.selectedRowCount()).toBe(1);
    });
  });

  describe('Reconciliation', () => {
    it('should open dialog when ADD RECONCILIATION CODE clicked', () => {
      const mockUnits: TransportDetailUiModel[] = [
        {
          ...mockBatchDetails.unreceivedUnits[0],
          selected: true,
          rowId: 'U123456789_RBC001_01',
        },
      ];
      component.selectedRows.set(new Set(mockUnits));
      component.reasonCodes.set(mockReasonCodes);

      // Spy on the component's own MatDialog instance (standalone components have their own injector)
      const componentDialog = (component as any).dialog as MatDialog;
      const openSpy = spyOn(componentDialog, 'open').and.returnValue({
        afterClosed: () => of(null),
      } as any);

      component.openAddReconciliationDialog();

      expect(openSpy).toHaveBeenCalled();
    });



    it('should clear all reconciliation reasons', () => {
      const mockData: TransportDetailUiModel[] = [
        {
          ...mockBatchDetails.unreceivedUnits[0],
          selected: false,
          rowId: 'U123456789_RBC001_01',
          reconReason: 'DMGD',
          reasonDescription: 'Damaged',
          reconDetail: 'Broken',
        },
      ];
      component.tableData.set(mockData);

      component.clearAllReasons();

      const updatedData = component.tableData();
      expect(updatedData[0].reconReason).toBeNull();
      expect(updatedData[0].reasonDescription).toBeNull();
      expect(updatedData[0].reconDetail).toBeNull();
    });
  });

  describe('Save', () => {
    const mockResponse: ReconcileBatchResponseDto = {
      batchId: 'B001',
      unitsReconciled: 2,
      unitsQuarantined: 1,
      batchStatus: 'RECON',
    };

    beforeEach(() => {
      component.batchDetails.set(mockBatchDetails);
      const mockData: TransportDetailUiModel[] = mockBatchDetails.unreceivedUnits.map(
        (unit, idx) => ({
          ...unit,
          selected: false,
          rowId: `${unit.unitId}_${unit.productCode}_${unit.aliquot}`,
        })
      );
      component.tableData.set(mockData);
      apiServiceSpy.reconcileBatch.and.returnValue(of(mockResponse));
    });

    it('should save reconciliation successfully', fakeAsync(() => {
      component.onSave();
      tick();

      expect(apiServiceSpy.reconcileBatch).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    }));






  });

  describe('Computed Values', () => {
    it('should compute warehouse transfer string', () => {
      component.batchDetails.set(mockBatchDetails);

      const transfer = component.warehouseTransfer();

      expect(transfer).toContain('WH01');
      expect(transfer).toContain('Test Warehouse');
    });

    it('should format created date', () => {
      component.batchDetails.set(mockBatchDetails);

      const date = component.createdOn();

      expect(date).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should show dash when no created date', () => {
      component.batchDetails.set(null);

      expect(component.createdOn()).toBe('-');
    });

    it('should return dash for createdOn when details has no createDate', () => {
      component.batchDetails.set({
        ...mockBatchDetails,
        createDate: '',
      });

      expect(component.createdOn()).toBe('-');
    });
  });

  describe('Batch Input', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should convert input to uppercase and restore cursor position', () => {
      const mockEvent = {
        target: {
          value: 'b001',
          selectionStart: 4,
          setSelectionRange: jasmine.createSpy('setSelectionRange'),
        },
      } as any;

      component.onBatchInput(mockEvent);

      expect(mockEvent.target.value).toBe('B001');
      expect(mockEvent.target.setSelectionRange).toHaveBeenCalledWith(4, 4);
    });

    it('should not restore cursor when selectionStart is null', () => {
      const mockEvent = {
        target: {
          value: 'test',
          selectionStart: null,
          setSelectionRange: jasmine.createSpy('setSelectionRange'),
        },
      } as any;

      component.onBatchInput(mockEvent);

      expect(mockEvent.target.value).toBe('TEST');
      expect(mockEvent.target.setSelectionRange).not.toHaveBeenCalled();
    });

    it('should handle empty input value', () => {
      const mockEvent = {
        target: {
          value: '',
          selectionStart: 0,
          setSelectionRange: jasmine.createSpy('setSelectionRange'),
        },
      } as any;

      component.onBatchInput(mockEvent);

      expect(mockEvent.target.value).toBe('');
    });

    it('should filter batches based on uppercase input', () => {
      const mockEvent = {
        target: {
          value: 'B001',
          selectionStart: 4,
          setSelectionRange: jasmine.createSpy('setSelectionRange'),
        },
      } as any;

      component.onBatchInput(mockEvent);

      const filtered = component.filteredBatches();
      expect(filtered.length).toBe(1);
      expect(filtered[0].batchId).toBe('B001');
    });

    it('should update form control value to uppercase', () => {
      const mockEvent = {
        target: {
          value: 'b002',
          selectionStart: 4,
          setSelectionRange: jasmine.createSpy('setSelectionRange'),
        },
      } as any;

      component.onBatchInput(mockEvent);

      expect(component.searchForm.get('batchId')?.value).toBe('B002');
    });

    it('should show all batches when input matches multiple', () => {
      const mockEvent = {
        target: {
          value: 'B00',
          selectionStart: 3,
          setSelectionRange: jasmine.createSpy('setSelectionRange'),
        },
      } as any;

      component.onBatchInput(mockEvent);

      expect(component.filteredBatches().length).toBe(2);
    });
  });

  describe('Batch Selected (Autocomplete)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set form value and load batch details on autocomplete selection', fakeAsync(() => {
      const event = { option: { value: 'B001' } } as MatAutocompleteSelectedEvent;

      component.onBatchSelected(event);
      tick();

      expect(component.searchForm.get('batchId')?.value).toBe('B001');
      expect(apiServiceSpy.getBatchDetails).toHaveBeenCalledWith('B001');
    }));

    it('should load batch details and populate table data', fakeAsync(() => {
      const event = { option: { value: 'B001' } } as MatAutocompleteSelectedEvent;

      component.onBatchSelected(event);
      tick();

      expect(component.batchDetails()).toEqual(mockBatchDetails);
      expect(component.tableData().length).toBe(2);
    }));
  });

  describe('Batch Blur - Additional Cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not load details when batchId is null', () => {
      component.searchForm.get('batchId')?.setValue(null);

      component.onBatchBlur();

      expect(apiServiceSpy.getBatchDetails).not.toHaveBeenCalled();
    });

    it('should not load details when batchId is empty string', () => {
      component.searchForm.get('batchId')?.setValue('');

      component.onBatchBlur();

      expect(apiServiceSpy.getBatchDetails).not.toHaveBeenCalled();
    });

    it('should not load details when batch not in list', () => {
      component.searchForm.get('batchId')?.setValue('NONEXISTENT');

      component.onBatchBlur();

      expect(apiServiceSpy.getBatchDetails).not.toHaveBeenCalled();
    });

    it('should not load details when batchId matches lastLoadedBatchId', fakeAsync(() => {
      component.searchForm.get('batchId')?.setValue('B001');
      component.onBatchBlur();
      tick();

      apiServiceSpy.getBatchDetails.calls.reset();

      component.onBatchBlur();

      expect(apiServiceSpy.getBatchDetails).not.toHaveBeenCalled();
    }));

    it('should normalize batchId to uppercase before matching', fakeAsync(() => {
      component.searchForm.get('batchId')?.setValue('b001');
      component.onBatchBlur();
      tick();

      expect(apiServiceSpy.getBatchDetails).toHaveBeenCalledWith('B001');
    }));
  });

  describe('Load Batch Details - Additional Cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should prevent duplicate API calls for same batchId', fakeAsync(() => {
      component.onBatchSelected({ option: { value: 'B001' } } as MatAutocompleteSelectedEvent);
      tick();

      apiServiceSpy.getBatchDetails.calls.reset();

      component.onBatchSelected({ option: { value: 'B001' } } as MatAutocompleteSelectedEvent);
      tick();

      expect(apiServiceSpy.getBatchDetails).not.toHaveBeenCalled();
    }));

    it('should show error snackbar when details response is null', fakeAsync(() => {
      apiServiceSpy.getBatchDetails.and.returnValue(of(null));

      component.onBatchSelected({ option: { value: 'B001' } } as MatAutocompleteSelectedEvent);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Batch not found or invalid status');
      expect(component.batchDetails()).toBeNull();
    }));

    it('should handle API error when loading batch details', fakeAsync(() => {
      apiServiceSpy.getBatchDetails.and.returnValue(throwError(() => ({ status: 500 })));

      component.onBatchSelected({ option: { value: 'B001' } } as MatAutocompleteSelectedEvent);
      tick();

      expect(component.loading()).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should transform unreceived units to UI models with composite rowId', fakeAsync(() => {
      component.onBatchSelected({ option: { value: 'B001' } } as MatAutocompleteSelectedEvent);
      tick();

      const data = component.tableData();
      expect(data.length).toBe(2);
      expect(data[0].selected).toBeFalse();
      expect(data[0].rowId).toBe('U123456789_RBC001_01');
      expect(data[1].rowId).toBe('U987654321_PLT001_01');
    }));

    it('should clear existing table selection before loading new batch', fakeAsync(() => {
      component.selectedRows.set(new Set([{} as TransportDetailUiModel]));

      component.onBatchSelected({ option: { value: 'B001' } } as MatAutocompleteSelectedEvent);
      tick();

      expect(component.selectedRows().size).toBe(0);
    }));

    it('should set loading to true during API call and false after', fakeAsync(() => {
      const detailsSubject = new Subject<BatchReconciliationDto | null>();
      apiServiceSpy.getBatchDetails.and.returnValue(detailsSubject.asObservable());

      component.onBatchSelected({ option: { value: 'B001' } } as MatAutocompleteSelectedEvent);

      expect(component.loading()).toBeTrue();
      expect(component.tableData().length).toBe(0);

      detailsSubject.next(mockBatchDetails);
      detailsSubject.complete();
      tick();

      expect(component.loading()).toBeFalse();
    }));

    it('should handle units with empty productCode and aliquot in rowId', fakeAsync(() => {
      const detailsWithEmpty: BatchReconciliationDto = {
        ...mockBatchDetails,
        unreceivedUnits: [{
          unitId: 'U111',
          checkDigit: '01',
          productCode: '',
          aliquot: '',
          reconReason: null,
          reasonDescription: null,
          reconDetail: null,
        }],
      };
      apiServiceSpy.getBatchDetails.and.returnValue(of(detailsWithEmpty));

      component.onBatchSelected({ option: { value: 'B001' } } as MatAutocompleteSelectedEvent);
      tick();

      const data = component.tableData();
      expect(data[0].rowId).toBe('U111__');
    }));
  });

  describe('Load Batches - Error Handling', () => {
    it('should show error when loading batches fails', fakeAsync(() => {
      apiServiceSpy.getBatches.and.returnValue(throwError(() => ({ status: 500 })));

      fixture.detectChanges();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));
  });

  describe('Load Reason Codes - Error Handling', () => {
    it('should show error when loading reason codes fails', fakeAsync(() => {
      apiServiceSpy.getReasonCodes.and.returnValue(throwError(() => ({ status: 500 })));

      fixture.detectChanges();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));
  });

  describe('Open Reconciliation Dialog - Additional Cases', () => {
    it('should show error when no units selected', () => {
      component.selectedRows.set(new Set());

      component.openAddReconciliationDialog();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please select at least one unit');
    });

    it('should apply reconciliation reason when dialog returns result', fakeAsync(() => {
      fixture.detectChanges();

      const mockUnits: TransportDetailUiModel[] = [{
        ...mockBatchDetails.unreceivedUnits[0],
        selected: true,
        rowId: 'U123456789_RBC001_01',
      }];
      component.selectedRows.set(new Set(mockUnits));
      component.reasonCodes.set(mockReasonCodes);
      component.tableData.set(mockUnits);

      const dialogResult = { reconReason: 'DMGD', reconDetail: 'Test detail' };
      const componentDialog = (component as any).dialog as MatDialog;
      spyOn(componentDialog, 'open').and.returnValue({
        afterClosed: () => of(dialogResult),
      } as any);

      component.openAddReconciliationDialog();
      tick();

      const data = component.tableData();
      expect(data[0].reconReason).toBe('DMGD');
      expect(data[0].reasonDescription).toBe('Unit damaged during transport');
      expect(data[0].reconDetail).toBe('Test detail');
    }));

    it('should not apply reason when dialog is cancelled', fakeAsync(() => {
      fixture.detectChanges();

      const mockUnits: TransportDetailUiModel[] = [{
        ...mockBatchDetails.unreceivedUnits[0],
        selected: true,
        rowId: 'U123456789_RBC001_01',
      }];
      component.selectedRows.set(new Set(mockUnits));
      component.tableData.set(mockUnits);

      const componentDialog = (component as any).dialog as MatDialog;
      spyOn(componentDialog, 'open').and.returnValue({
        afterClosed: () => of(null),
      } as any);

      component.openAddReconciliationDialog();
      tick();

      const data = component.tableData();
      expect(data[0].reconReason).toBeNull();
    }));

    it('should only update matching units and leave others unchanged', fakeAsync(() => {
      fixture.detectChanges();

      const allUnits: TransportDetailUiModel[] = mockBatchDetails.unreceivedUnits.map(u => ({
        ...u,
        selected: false,
        rowId: `${u.unitId}_${u.productCode}_${u.aliquot}`,
      }));
      component.tableData.set(allUnits);
      component.reasonCodes.set(mockReasonCodes);

      const selectedUnits = [allUnits[0]];
      component.selectedRows.set(new Set(selectedUnits));

      const dialogResult = { reconReason: 'LEAK', reconDetail: '' };
      const componentDialog = (component as any).dialog as MatDialog;
      spyOn(componentDialog, 'open').and.returnValue({
        afterClosed: () => of(dialogResult),
      } as any);

      component.openAddReconciliationDialog();
      tick();

      const data = component.tableData();
      expect(data[0].reconReason).toBe('LEAK');
      expect(data[0].reasonDescription).toBe('Leaking container');
      expect(data[1].reconReason).toBeNull();
    }));

    it('should handle reason code not found in list', fakeAsync(() => {
      fixture.detectChanges();

      const mockUnits: TransportDetailUiModel[] = [{
        ...mockBatchDetails.unreceivedUnits[0],
        selected: true,
        rowId: 'U123456789_RBC001_01',
      }];
      component.selectedRows.set(new Set(mockUnits));
      component.tableData.set(mockUnits);
      component.reasonCodes.set(mockReasonCodes);

      const dialogResult = { reconReason: 'UNKNOWN', reconDetail: 'Some note' };
      const componentDialog = (component as any).dialog as MatDialog;
      spyOn(componentDialog, 'open').and.returnValue({
        afterClosed: () => of(dialogResult),
      } as any);

      component.openAddReconciliationDialog();
      tick();

      const data = component.tableData();
      expect(data[0].reconReason).toBe('UNKNOWN');
      expect(data[0].reasonDescription).toBeNull();
    }));

    it('should set reconDetail to null when empty string provided', fakeAsync(() => {
      fixture.detectChanges();

      const mockUnits: TransportDetailUiModel[] = [{
        ...mockBatchDetails.unreceivedUnits[0],
        selected: true,
        rowId: 'U123456789_RBC001_01',
      }];
      component.selectedRows.set(new Set(mockUnits));
      component.tableData.set(mockUnits);
      component.reasonCodes.set(mockReasonCodes);

      const dialogResult = { reconReason: 'DMGD', reconDetail: '' };
      const componentDialog = (component as any).dialog as MatDialog;
      spyOn(componentDialog, 'open').and.returnValue({
        afterClosed: () => of(dialogResult),
      } as any);

      component.openAddReconciliationDialog();
      tick();

      const data = component.tableData();
      expect(data[0].reconDetail).toBeNull();
    }));

    it('should clear table selection after applying reconciliation reason', fakeAsync(() => {
      fixture.detectChanges();

      const mockUnits: TransportDetailUiModel[] = [{
        ...mockBatchDetails.unreceivedUnits[0],
        selected: true,
        rowId: 'U123456789_RBC001_01',
      }];
      component.selectedRows.set(new Set(mockUnits));
      component.tableData.set(mockUnits);
      component.reasonCodes.set(mockReasonCodes);

      const dialogResult = { reconReason: 'DMGD', reconDetail: 'Test' };
      const componentDialog = (component as any).dialog as MatDialog;
      spyOn(componentDialog, 'open').and.returnValue({
        afterClosed: () => of(dialogResult),
      } as any);

      component.openAddReconciliationDialog();
      tick();

      expect(component.selectedRows().size).toBe(0);
    }));
  });

  describe('Save - Additional Cases', () => {
    it('should show error when no batchId available', () => {
      component.batchDetails.set(null);

      component.onSave();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please select a batch');
      expect(apiServiceSpy.reconcileBatch).not.toHaveBeenCalled();
    });

    it('should handle save API error', fakeAsync(() => {
      component.batchDetails.set(mockBatchDetails);
      component.tableData.set(mockBatchDetails.unreceivedUnits.map(u => ({
        ...u,
        selected: false,
        rowId: `${u.unitId}_${u.productCode}_${u.aliquot}`,
      })));
      apiServiceSpy.reconcileBatch.and.returnValue(throwError(() => ({ status: 500 })));

      component.onSave();
      tick();

      expect(component.saving()).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should fall back to units length when response unitsReconciled is null', fakeAsync(() => {
      component.batchDetails.set(mockBatchDetails);
      const mockData = mockBatchDetails.unreceivedUnits.map(u => ({
        ...u,
        selected: false,
        rowId: `${u.unitId}_${u.productCode}_${u.aliquot}`,
      }));
      component.tableData.set(mockData);
      apiServiceSpy.reconcileBatch.and.returnValue(of({
        batchId: 'B001',
        unitsReconciled: null as any,
        unitsQuarantined: 0,
        batchStatus: 'RECON',
      }));

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith(
        jasmine.stringContaining("2 Unit ID's")
      );
    }));

    it('should use singular form for single unit reconciled', fakeAsync(() => {
      component.batchDetails.set(mockBatchDetails);
      component.tableData.set([{
        ...mockBatchDetails.unreceivedUnits[0],
        selected: false,
        rowId: 'test',
      }]);
      apiServiceSpy.reconcileBatch.and.returnValue(of({
        batchId: 'B001',
        unitsReconciled: 1,
        unitsQuarantined: 0,
        batchStatus: 'RECON',
      }));

      component.onSave();
      tick();

      const successMsg = snackbarServiceSpy.showSuccess.calls.mostRecent().args[0];
      expect(successMsg).toContain('1 Unit ID for');
    }));

    it('should set saving to true during API call and false after completion', fakeAsync(() => {
      const saveSubject = new Subject<any>();
      component.batchDetails.set(mockBatchDetails);
      component.tableData.set([{
        ...mockBatchDetails.unreceivedUnits[0],
        selected: false,
        rowId: 'test',
      }]);
      apiServiceSpy.reconcileBatch.and.returnValue(saveSubject.asObservable());

      component.onSave();

      expect(component.saving()).toBeTrue();

      saveSubject.next({
        batchId: 'B001',
        unitsReconciled: 1,
        unitsQuarantined: 0,
        batchStatus: 'RECON',
      });
      saveSubject.complete();
      tick();

      expect(component.saving()).toBeFalse();
    }));

    it('should clear form and reload batches after successful save', fakeAsync(() => {
      fixture.detectChanges();
      apiServiceSpy.getBatches.calls.reset();

      component.batchDetails.set(mockBatchDetails);
      component.tableData.set(mockBatchDetails.unreceivedUnits.map(u => ({
        ...u,
        selected: false,
        rowId: `${u.unitId}_${u.productCode}_${u.aliquot}`,
      })));
      apiServiceSpy.reconcileBatch.and.returnValue(of({
        batchId: 'B001',
        unitsReconciled: 2,
        unitsQuarantined: 0,
        batchStatus: 'RECON',
      }));

      component.onSave();
      tick();

      expect(component.searchForm.get('batchId')?.value).toBeNull();
      expect(component.batchDetails()).toBeNull();
      expect(component.tableData().length).toBe(0);
      expect(apiServiceSpy.getBatches).toHaveBeenCalled();
    }));

    it('should map table data to ReconcileUnitDto for API request', fakeAsync(() => {
      component.batchDetails.set(mockBatchDetails);
      const mockData: TransportDetailUiModel[] = [{
        unitId: 'U123',
        productCode: 'RBC',
        aliquot: '01',
        checkDigit: '01',
        reconReason: 'DMGD',
        reconDetail: 'Broken seal',
        selected: false,
        rowId: 'test',
      }];
      component.tableData.set(mockData);
      apiServiceSpy.reconcileBatch.and.returnValue(of({
        batchId: 'B001',
        unitsReconciled: 1,
        unitsQuarantined: 0,
        batchStatus: 'RECON',
      }));

      component.onSave();
      tick();

      const request = apiServiceSpy.reconcileBatch.calls.mostRecent().args[1];
      expect(request.units[0].unitId).toBe('U123');
      expect(request.units[0].productCode).toBe('RBC');
      expect(request.units[0].aliquot).toBe('01');
      expect(request.units[0].reconReason).toBe('DMGD');
      expect(request.units[0].reconDetail).toBe('Broken seal');
    }));

    it('should convert falsy reconReason and reconDetail to undefined in request', fakeAsync(() => {
      component.batchDetails.set(mockBatchDetails);
      component.tableData.set([{
        unitId: 'U123',
        productCode: 'RBC',
        aliquot: '01',
        checkDigit: '01',
        reconReason: null,
        reconDetail: null,
        selected: false,
        rowId: 'test',
      }]);
      apiServiceSpy.reconcileBatch.and.returnValue(of({
        batchId: 'B001',
        unitsReconciled: 1,
        unitsQuarantined: 0,
        batchStatus: 'RECON',
      }));

      component.onSave();
      tick();

      const request = apiServiceSpy.reconcileBatch.calls.mostRecent().args[1];
      expect(request.units[0].reconReason).toBeUndefined();
      expect(request.units[0].reconDetail).toBeUndefined();
    }));
  });

  describe('Sort', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should sort ascending by unitId', () => {
      const data: TransportDetailUiModel[] = [
        { ...mockBatchDetails.unreceivedUnits[1], selected: false, rowId: 'r2' },
        { ...mockBatchDetails.unreceivedUnits[0], selected: false, rowId: 'r1' },
      ];
      component.tableData.set(data);

      component.onSortChange({ column: 'unitId', direction: 'A' });

      const sorted = component.tableData();
      expect(sorted[0].unitId).toBe('U123456789');
      expect(sorted[1].unitId).toBe('U987654321');
    });

    it('should sort descending by unitId', () => {
      const data: TransportDetailUiModel[] = [
        { ...mockBatchDetails.unreceivedUnits[0], selected: false, rowId: 'r1' },
        { ...mockBatchDetails.unreceivedUnits[1], selected: false, rowId: 'r2' },
      ];
      component.tableData.set(data);

      component.onSortChange({ column: 'unitId', direction: 'D' });

      const sorted = component.tableData();
      expect(sorted[0].unitId).toBe('U987654321');
      expect(sorted[1].unitId).toBe('U123456789');
    });

    it('should not sort for default direction', () => {
      const data: TransportDetailUiModel[] = [
        { ...mockBatchDetails.unreceivedUnits[1], selected: false, rowId: 'r2' },
        { ...mockBatchDetails.unreceivedUnits[0], selected: false, rowId: 'r1' },
      ];
      component.tableData.set(data);

      component.onSortChange({ column: '', direction: 'default' as any });

      const result = component.tableData();
      expect(result.length).toBe(2);
    });

    it('should return 0 for non-unitId column sort', () => {
      const data: TransportDetailUiModel[] = [
        { ...mockBatchDetails.unreceivedUnits[1], selected: false, rowId: 'r2' },
        { ...mockBatchDetails.unreceivedUnits[0], selected: false, rowId: 'r1' },
      ];
      component.tableData.set(data);

      component.onSortChange({ column: 'productCode', direction: 'A' });

      expect(component.tableData().length).toBe(2);
    });

    it('should update tableConfig sortConfig after sort', () => {
      component.onSortChange({ column: 'unitId', direction: 'A' });

      expect(component.tableConfig.sortConfig).toEqual({ column: 'unitId', direction: 'A' });
    });

    it('should update tableConfig sortConfig for descending', () => {
      component.onSortChange({ column: 'unitId', direction: 'D' });

      expect(component.tableConfig.sortConfig).toEqual({ column: 'unitId', direction: 'D' });
    });
  });

  describe('Date Formatting via DateFieldValidationUtility', () => {
    it('should format createdOn using formatDateForUI', () => {
      component.batchDetails.set(mockBatchDetails);
      const result = component.createdOn();
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should return dash for createdOn when no details', () => {
      component.batchDetails.set(null);
      expect(component.createdOn()).toBe('-');
    });

    it('should format expirationDate using formatDateTimeForUI', () => {
      fixture.detectChanges();
      const col = component.tableConfig.columns.find(c => c.key === 'expirationDate');
      const result = col?.valueFormatter?.('2026-06-15T23:59:00Z', {} as any);
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}, \d{2}:\d{2}$/);
    });

    it('should return dash for expirationDate when null', () => {
      fixture.detectChanges();
      const col = component.tableConfig.columns.find(c => c.key === 'expirationDate');
      const result = col?.valueFormatter?.(null as any, {} as any);
      expect(result).toBe('-');
    });
  });

  describe('TrackBy', () => {
    it('should return rowId for tracking', () => {
      const item = { rowId: 'test-row-id' } as TransportDetailUiModel;
      expect(component.trackByUnitId(0, item)).toBe('test-row-id');
    });

    it('should return different rowId for different items', () => {
      const item1 = { rowId: 'row-1' } as TransportDetailUiModel;
      const item2 = { rowId: 'row-2' } as TransportDetailUiModel;
      expect(component.trackByUnitId(0, item1)).not.toBe(component.trackByUnitId(1, item2));
    });
  });

  describe('Row Action', () => {
    it('should handle row action without error', () => {
      expect(() => component.onRowAction({ action: 'test', row: {} as any })).not.toThrow();
    });
  });

  describe('Form Controls Accessor', () => {
    it('should return form controls via f getter', () => {
      expect(component.f).toBe(component.searchForm.controls);
    });

    it('should provide access to batchId control', () => {
      expect(component.f['batchId']).toBeTruthy();
    });
  });

  describe('Additional Computed Values', () => {
    it('should return empty string for warehouseTransfer when no details', () => {
      component.batchDetails.set(null);
      expect(component.warehouseTransfer()).toBe('');
    });

    it('should format warehouseTransfer as code - description', () => {
      component.batchDetails.set(mockBatchDetails);
      expect(component.warehouseTransfer()).toBe('WH01 - Test Warehouse');
    });

    it('should return false for canSave when no data', () => {
      component.tableData.set([]);
      expect(component.canSave()).toBeFalse();
    });

    it('should return false for canSave when not all units have reason codes', () => {
      component.tableData.set([
        { ...mockBatchDetails.unreceivedUnits[0], selected: false, rowId: 'r1', reconReason: 'DMGD' } as TransportDetailUiModel,
        { ...mockBatchDetails.unreceivedUnits[1], selected: false, rowId: 'r2', reconReason: null } as TransportDetailUiModel,
      ]);
      expect(component.canSave()).toBeFalse();
    });

    it('should return true for canSave when all units have reason codes', () => {
      component.tableData.set([
        { ...mockBatchDetails.unreceivedUnits[0], selected: false, rowId: 'r1', reconReason: 'DMGD' } as TransportDetailUiModel,
        { ...mockBatchDetails.unreceivedUnits[1], selected: false, rowId: 'r2', reconReason: 'LEAK' } as TransportDetailUiModel,
      ]);
      expect(component.canSave()).toBeTrue();
    });

    it('should show empty state when not loading and no data', () => {
      component.loading.set(false);
      component.tableData.set([]);
      expect(component.showEmptyState()).toBeTrue();
    });

    it('should not show empty state when loading', () => {
      component.loading.set(true);
      component.tableData.set([]);
      expect(component.showEmptyState()).toBeFalse();
    });

    it('should show table when not loading and data present', () => {
      component.loading.set(false);
      component.tableData.set([{ unitId: 'U1' } as TransportDetailUiModel]);
      expect(component.showTable()).toBeTrue();
    });

    it('should not show table when loading', () => {
      component.loading.set(true);
      component.tableData.set([{ unitId: 'U1' } as TransportDetailUiModel]);
      expect(component.showTable()).toBeFalse();
    });

    it('should not show table when no data and not loading', () => {
      component.loading.set(false);
      component.tableData.set([]);
      expect(component.showTable()).toBeFalse();
    });

    it('should return dash for sentTo when no details', () => {
      component.batchDetails.set(null);
      expect(component.sentTo()).toBe('-');
    });

    it('should return dash for sentTo when warehouse description is empty', () => {
      component.batchDetails.set({
        ...mockBatchDetails,
        toWarehouseDescription: '',
      });
      expect(component.sentTo()).toBe('-');
    });

    it('should return warehouse description for sentTo', () => {
      component.batchDetails.set(mockBatchDetails);
      expect(component.sentTo()).toBe('Main Warehouse');
    });

    it('should return false for hasAnyReasonAssigned when no reasons assigned', () => {
      component.tableData.set([
        { reconReason: null } as TransportDetailUiModel,
        { reconReason: null } as TransportDetailUiModel,
      ]);
      expect(component.hasAnyReasonAssigned()).toBeFalse();
    });

    it('should return true for hasAnyReasonAssigned when some have reasons', () => {
      component.tableData.set([
        { reconReason: 'DMGD' } as TransportDetailUiModel,
        { reconReason: null } as TransportDetailUiModel,
      ]);
      expect(component.hasAnyReasonAssigned()).toBeTrue();
    });

    it('should return true for hasAnyReasonAssigned when all have reasons', () => {
      component.tableData.set([
        { reconReason: 'DMGD' } as TransportDetailUiModel,
        { reconReason: 'LEAK' } as TransportDetailUiModel,
      ]);
      expect(component.hasAnyReasonAssigned()).toBeTrue();
    });
  });

  describe('Table Config Value Formatters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format unitId with check digit suffix', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'unitId');
      const result = col?.valueFormatter?.('U123', { checkDigit: '-01' } as any);
      expect(result).toBe('U123-01');
    });

    it('should format unitId without check digit', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'unitId');
      const result = col?.valueFormatter?.('U123', { checkDigit: '' } as any);
      expect(result).toBe('U123');
    });

    it('should format unitId with null check digit', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'unitId');
      const result = col?.valueFormatter?.('U123', { checkDigit: null } as any);
      expect(result).toBe('U123');
    });

    it('should format productCode with value', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'productCode');
      const result = col?.valueFormatter?.('RBC001', {} as any);
      expect(result).toBe('RBC001');
    });

    it('should format productCode as dash when empty', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'productCode');
      const result = col?.valueFormatter?.('', {} as any);
      expect(result).toBe('-');
    });

    it('should format productCode as dash when null', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'productCode');
      const result = col?.valueFormatter?.(null as any, {} as any);
      expect(result).toBe('-');
    });

    it('should format reconReason with value', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'reconReason');
      const result = col?.valueFormatter?.('DMGD', {} as any);
      expect(result).toBe('DMGD');
    });

    it('should format reconReason as dash when empty', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'reconReason');
      const result = col?.valueFormatter?.('', {} as any);
      expect(result).toBe('-');
    });

    it('should format reasonDescription with value', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'reasonDescription');
      const result = col?.valueFormatter?.('Damaged', {} as any);
      expect(result).toBe('Damaged');
    });

    it('should format reasonDescription as dash when empty', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'reasonDescription');
      const result = col?.valueFormatter?.('', {} as any);
      expect(result).toBe('-');
    });

    it('should format reconDetail with value', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'reconDetail');
      const result = col?.valueFormatter?.('Some detail', {} as any);
      expect(result).toBe('Some detail');
    });

    it('should format reconDetail as dash when empty', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'reconDetail');
      const result = col?.valueFormatter?.('', {} as any);
      expect(result).toBe('-');
    });

    it('should format expirationDate via formatDateTimeForUI', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'expirationDate');
      const result = col?.valueFormatter?.('2026-06-15T23:59:00Z', {} as any);
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}, \d{2}:\d{2}$/);
    });

    it('should format expirationDate as dash when null', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'expirationDate');
      const result = col?.valueFormatter?.(null as any, {} as any);
      expect(result).toBe('-');
    });
  });

  describe('Clear Table Selection', () => {
    it('should clear selectedRows when dataTable is not available', () => {
      component.selectedRows.set(new Set([{} as TransportDetailUiModel]));

      (component as any).clearTableSelection();

      expect(component.selectedRows().size).toBe(0);
    });

    it('should clear dataTable state when dataTable is available', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Load batch details to populate table
      component.onBatchSelected({ option: { value: 'B001' } } as MatAutocompleteSelectedEvent);
      tick();
      fixture.detectChanges();

      component.selectedRows.set(new Set([{} as TransportDetailUiModel]));

      (component as any).clearTableSelection();

      expect(component.selectedRows().size).toBe(0);
    }));
  });

  describe('Clear All - Additional Cases', () => {
    it('should reset currentPage to 0', () => {
      component.currentPage.set(3);

      component.clearAll();

      expect(component.currentPage()).toBe(0);
    });

    it('should reset lastLoadedBatchId to null', fakeAsync(() => {
      fixture.detectChanges();

      component.onBatchSelected({ option: { value: 'B001' } } as MatAutocompleteSelectedEvent);
      tick();

      component.clearAll();

      // After clearing, loading the same batch should work again
      apiServiceSpy.getBatchDetails.calls.reset();
      component.onBatchSelected({ option: { value: 'B001' } } as MatAutocompleteSelectedEvent);
      tick();

      expect(apiServiceSpy.getBatchDetails).toHaveBeenCalledWith('B001');
    }));
  });

  describe('Lifecycle - ngOnDestroy', () => {
    it('should emit and complete destroy$ subject', () => {
      const nextSpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Lifecycle - ngAfterViewInit', () => {
    it('should clone tableConfig after view init', () => {
      fixture.detectChanges();

      const configBefore = component.tableConfig;
      component.ngAfterViewInit();

      expect(component.tableConfig).not.toBe(configBefore);
      expect(component.tableConfig.columns.length).toBe(configBefore.columns.length);
    });
  });

  describe('Search Form Validation', () => {
    it('should have required validator on batchId', () => {
      const batchIdControl = component.searchForm.get('batchId');
      batchIdControl?.setValue(null);
      expect(batchIdControl?.valid).toBeFalse();
      expect(batchIdControl?.errors?.['required']).toBeTruthy();
    });

    it('should be valid when batchId has a value', () => {
      const batchIdControl = component.searchForm.get('batchId');
      batchIdControl?.setValue('B001');
      expect(batchIdControl?.valid).toBeTrue();
    });
  });

  describe('Batch Search Setup', () => {
    it('should set filteredBatches to all batches initially', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.filteredBatches().length).toBe(mockBatches.length);
    }));

    it('should filter batches when form control value changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.searchForm.get('batchId')?.setValue('B001');
      tick();

      const filtered = component.filteredBatches();
      expect(filtered.length).toBe(1);
      expect(filtered[0].batchId).toBe('B001');
    }));

    it('should show all batches when search term is empty', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.searchForm.get('batchId')?.setValue('B001');
      tick();

      component.searchForm.get('batchId')?.setValue('');
      tick();

      expect(component.filteredBatches().length).toBe(mockBatches.length);
    }));
  });

  describe('Table Config Build', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have correct number of columns', () => {
      expect(component.tableConfig.columns.length).toBe(6);
    });

    it('should have unitId column as sortable', () => {
      const unitIdCol = component.tableConfig.columns.find(c => c.key === 'unitId');
      expect(unitIdCol?.sortable).toBeTrue();
    });

    it('should have non-sortable columns except unitId', () => {
      const nonSortable = component.tableConfig.columns.filter(c => c.key !== 'unitId');
      nonSortable.forEach(col => {
        expect(col.sortable).toBeFalse();
      });
    });

    it('should have selection enabled', () => {
      expect(component.tableConfig.enableSelection).toBeTrue();
    });

    it('should use rowId as selection key', () => {
      expect(component.tableConfig.selectionKey).toBe('rowId');
    });

    it('should have default sort on unitId ascending', () => {
      expect(component.tableConfig.sortConfig).toEqual({ column: 'unitId', direction: 'A' });
    });

    it('should have empty row actions', () => {
      expect(component.tableConfig.rowActions?.length).toBe(0);
    });
  });

  describe('Pagination', () => {
    it('should have default page size of 25', () => {
      expect(component.pageSize()).toBe(25);
    });

    it('should have page size options', () => {
      expect(component.pageSizeOptions).toEqual([10, 25, 50, 100]);
    });

    it('should have default current page of 0', () => {
      expect(component.currentPage()).toBe(0);
    });
  });

  describe('Component ID Generation', () => {
    it('should have a unique component ID', () => {
      expect(component['componentId']).toMatch(/^reconcile-transport-batch-\d+$/);
    });

    it('should generate element IDs with component prefix', () => {
      const id = component['elementId']('test');
      expect(id).toContain(component['componentId']);
      expect(id).toContain('test');
    });

    it('should generate error IDs with error suffix', () => {
      const id = component['errorId']('field');
      expect(id).toContain('field-error');
    });

    it('should generate label IDs with label suffix', () => {
      const id = component['labelId']('field');
      expect(id).toContain('field-label');
    });
  });

});
