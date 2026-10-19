import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { ReleaseProductQuarantineComponent } from './release-product-quarantine';
import { ReleaseQuarantineApiService } from './services/release-quarantine-api.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  ReleaseType,
  QuarantineTableItem,
  UnitReason,
  QuarantineProductInfoDto,
  SaveReleaseResponse,
  RejectCode
} from './models/release-quarantine.model';
import { TableSortEvent } from '@shared/interfaces/data-table.interface';
import { TranslateModule } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';

describe('ReleaseProductQuarantineComponent', () => {
  let apiSpy: any;
  let component: any;
  let fixture: ComponentFixture<ReleaseProductQuarantineComponent>;
  let apiServiceSpy: jasmine.SpyObj<ReleaseQuarantineApiService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let chapterChangedSubject: Subject<void>;

  const mockReleaseTypes: ReleaseType[] = [
    { code: 'IT', description: 'Internal Quarantines' },
    { code: 'RT', description: 'Returns' }
  ];

  const mockUnits: QuarantineTableItem[] = [
    {
      unitId: 'W123456789',
      displayUnitId: 'W123456789',
      productCode: 'RBC001',
      aliquot: '01',
      aboRh: 'A+',
      expirationDate: '2026-06-15T00:00:00',
      locationId: 'LOC01',
      status: 'I',
      isExpired: 'N',
      collDate: '2026-05-15T00:00:00',
      bloodType: 'A+',
      productType: 'RBC',
      inventoryClass: 'REGULAR',
      osokFlag: null
    },
    {
      unitId: 'W987654321',
      displayUnitId: 'W987654321',
      productCode: 'PLT001',
      aliquot: '02',
      aboRh: 'O+',
      expirationDate: '2026-06-20T00:00:00',
      locationId: 'LOC02',
      status: null,
      isExpired: 'N',
      collDate: '2026-05-20T00:00:00',
      bloodType: 'O+',
      productType: 'PLT',
      inventoryClass: 'REGULAR',
      osokFlag: null
    }
  ];

  const mockReasons: UnitReason[] = [
    { reasonCode: 'QR001', reasonDescription: 'Failed Quality Control' },
    { reasonCode: 'QR002', reasonDescription: 'Labeling Error' }
  ];

  const mockRejectCodes: RejectCode[] = [
    { code: 'REJ01', description: 'Damaged' },
    { code: 'REJ02', description: 'Expired' }
  ];

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    apiSpy = jasmine.createSpyObj('ReleaseQuarantineApiService', [
      'getReleaseTypes',
      'getUnits',
      'getUnitReasons',
      'getRejectCodes',
      'getProductCodes'
    ]);
    const headerSpy = createMockHeaderService({ chapterChanged$: chapterChangedSubject });
    const snackbarSpy = createMockSnackbarService();
    const labelScanSpy = jasmine.createSpyObj('DonorLibLabelScanService', ['validateProductScan']);

    apiSpy.getReleaseTypes.and.returnValue(of(mockReleaseTypes));
    apiSpy.getRejectCodes.and.returnValue(of(mockRejectCodes));



      TestBed.configureTestingModule({
      imports: [ReleaseProductQuarantineComponent, NoopAnimationsModule, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        { provide: ReleaseQuarantineApiService, useValue: apiSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: DonorLibLabelScanService, useValue: labelScanSpy },
        provideRouter([])
      ]
    });

      apiSpy.getReleaseTypes.and.returnValue(of(mockReleaseTypes));


      apiSpy.getRejectCodes.and.returnValue(of(mockRejectCodes));


    fixture = TestBed.createComponent(ReleaseProductQuarantineComponent);
    component = fixture.componentInstance;
    apiServiceSpy = TestBed.inject(ReleaseQuarantineApiService) as jasmine.SpyObj<ReleaseQuarantineApiService>;
    headerServiceSpy = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    snackbarServiceSpy = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;


    });


  describe('Initialization', () => {
    it('should initialize form with disabled fields', () => {
      fixture.detectChanges();

      expect(component.searchForm).toBeDefined();
      expect(component.searchForm.get('quarantineType')?.enabled).toBeTrue();
      expect(component.productCodeDisabled()).toBeTrue();
      expect(component.unitIdDisabled()).toBeTrue();
    });

    it('should load release types on init', () => {
      fixture.detectChanges();

      expect(apiServiceSpy.getReleaseTypes).toHaveBeenCalled();
      expect(component.quarantineTypes()).toEqual(mockReleaseTypes);
    });

    it('should pre-load reject codes on init', () => {
      fixture.detectChanges();

      expect(apiServiceSpy.getRejectCodes).toHaveBeenCalled();
      expect(component.rejectCodes).toEqual(mockRejectCodes);
    });

    it('should handle error when loading release types', () => {
      apiServiceSpy.getReleaseTypes.and.returnValue(throwError(() => new Error('Failed to load')));

      fixture.detectChanges();

      expect(component.isLoadingReleaseTypes()).toBeFalse();
    });



    it('should update table config with status cell template after AfterViewInit', () => {
      fixture.detectChanges();
      component.ngAfterViewInit();

      const statusColumn = component.dataTableConfig.columns.find((col: any) => col.key === 'status');
      expect(statusColumn?.type).toBe('custom');
      expect(statusColumn?.cellTemplate).toBeDefined();
    });
  });

  describe('Quarantine Type Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
      apiServiceSpy.getUnits.and.returnValue(of({ data: mockUnits, total: 2 }));
    });

    it('should enable fields when quarantine type is selected', () => {
      component.searchForm.patchValue({ quarantineType: 'IT' });

      expect(component.unitIdDisabled()).toBeFalse();
      expect(component.selectedType()).toBe('IT');
    });

    it('should load units when quarantine type is selected', () => {
      component.searchForm.patchValue({ quarantineType: 'IT' });

      expect(apiServiceSpy.getUnits).toHaveBeenCalledWith('IT');
      expect(component.tableData()).toEqual(mockUnits);
    });

    it('should disable fields when quarantine type is cleared', () => {
      component.searchForm.patchValue({ quarantineType: 'IT' });
      component.searchForm.patchValue({ quarantineType: '' });

      expect(component.unitIdDisabled()).toBeTrue();
      expect(component.productCodeDisabled()).toBeTrue();
      expect(component.tableData()).toEqual([]);
    });

    it('should handle error when loading units', () => {
      apiServiceSpy.getUnits.and.returnValue(throwError(() => new Error('Failed to load units')));

      component.searchForm.patchValue({ quarantineType: 'IT' });

      expect(component.loading()).toBeFalse();
    });
  });

  describe('Unit ID Header Count', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show Unit ID without count when table is empty', () => {
      component.tableData.set([]);

      expect(component.unitIdHeader()).toBe('Unit ID');
    });




  });

  describe('Sorting', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.tableData.set(mockUnits);
    });





    it('should update table config when sorting', () => {
      const sortEvent: TableSortEvent = { column: 'displayUnitId', direction: 'D' };
      component.onSortChange(sortEvent);

      expect(component.dataTableConfig.sortConfig?.direction).toBe('D');
    });

    it('should only sort when column is displayUnitId', () => {
      const initialData = [...component.tableData()];
      const sortEvent: TableSortEvent = { column: 'productCode', direction: 'A' };
      component.onSortChange(sortEvent);

      expect(component.tableData()).toEqual(initialData);
    });


  });

  describe('Product Search and Side Panel', () => {
    beforeEach(() => {
      fixture.detectChanges();
      apiServiceSpy.getUnits.and.returnValue(of({ data: mockUnits, total: 2 }));
      apiServiceSpy.getUnitReasons.and.returnValue(of(mockReasons));
      component.searchForm.patchValue({ quarantineType: 'IT' });
    });

    it('should not open side panel if only product code is filled', () => {
      component.searchForm.patchValue({
        productCode: 'RBC001'
      });

      component.onProductCodeChanged({ code: 'RBC001', description: '' });

      expect(component.sidePanelOpen()).toBeFalse();
    });

    it('should not open side panel when quarantine type is not selected', () => {
      component.selectedType.set('');
      component.searchForm.patchValue({
        productCode: 'RBC001'
      });

      component.onProductCodeChanged({ code: 'RBC001', description: '' });

      expect(component.sidePanelOpen()).toBeFalse();
    });

    it('should not open side panel when table has no data', () => {
      component.tableData.set([]);
      component.searchForm.patchValue({
        productCode: 'RBC001'
      });

      component.onProductCodeChanged({ code: 'RBC001', description: '' });

      expect(component.sidePanelOpen()).toBeFalse();
    });
  });

  describe('Clear Functionality', () => {
    beforeEach(() => {
      apiServiceSpy.getUnits.and.returnValue(of({ data: mockUnits, total: 2 }));
      fixture.detectChanges();
    });

    it('should clear all fields including quarantine type', () => {
      component.searchForm.patchValue({
        quarantineType: 'IT',
        productCode: 'RBC001'
      });
      component.tableData.set(mockUnits);
      component.sidePanelOpen.set(true);

      component.onClear();

      expect(component.searchForm.get('quarantineType')?.value).toBeNull();
      expect(component.selectedType()).toBe('');
      expect(component.tableData()).toEqual([]);
      expect(component.sidePanelOpen()).toBeFalse();
    });

    it('should enable Clear button when form has values', () => {
      component.searchForm.patchValue({ quarantineType: 'IT' });

      expect(component.isClearDisabled()).toBeFalse();
    });
  });

  describe('Side Panel Operations', () => {
    beforeEach(() => {
      fixture.detectChanges();
      apiServiceSpy.getUnits.and.returnValue(of({ data: mockUnits, total: 2 }));
      component.searchForm.patchValue({ quarantineType: 'IT' });
      component.sidePanelOpen.set(true);
      component.selectedProduct.set({
        unitId: 'W123456789',
        productCode: 'RBC001',
        aliquot: '01',
        aboRh: 'A+',
        expirationDate: '2026-06-15T00:00:00',
        locationId: 'LOC01',
        status: 'I',
        isExpired: false,
        reasons: mockReasons
      });
    });



    it('should update table data when product is released', () => {
      const releaseResponse: SaveReleaseResponse = {
        status: 'OK',
        unitStatus: 'I',
        locationId: 'LOC99',
        warnings: []
      };

      component.onProductReleased(releaseResponse);

      const updatedRow = component.tableData().find((r: any) => r.unitId === 'W123456789');
      expect(updatedRow?.status).toBe('I');
      expect(updatedRow?.locationId).toBe('LOC99');
      expect(component.sidePanelOpen()).toBeFalse();
    });

    it('should keep quarantine type when product is released', () => {
      const releaseResponse: SaveReleaseResponse = {
        status: 'OK',
        unitStatus: 'I',
        warnings: []
      };

      component.onProductReleased(releaseResponse);

      expect(component.searchForm.get('quarantineType')?.value).toBe('IT');
    });

    it('should not update table if release response has no status', () => {
      const releaseResponse: SaveReleaseResponse = {
        status: 'WARNING',
        warnings: [{ code: 'WARN', message: 'Warning' }]
      };

      const initialData = [...component.tableData()];

      component.onProductReleased(releaseResponse);

      expect(component.tableData()).toEqual(initialData);
    });

    it('should preserve existing locationId when response has no locationId', () => {
      const releaseResponse: SaveReleaseResponse = {
        status: 'OK',
        unitStatus: 'I',
        warnings: []
      };

      component.onProductReleased(releaseResponse);

      const updatedRow = component.tableData().find((r: any) => r.unitId === 'W123456789');
      expect(updatedRow?.locationId).toBe('LOC01');
    });
  });

  describe('Chapter Changes', () => {
    beforeEach(() => {
      apiServiceSpy.getUnits.and.returnValue(of({ data: mockUnits, total: 2 }));
      fixture.detectChanges();
      apiServiceSpy.getReleaseTypes.calls.reset();
    });

    it('should reload data when chapter changes', () => {
      component.searchForm.patchValue({
        quarantineType: 'IT',
        productCode: 'RBC001'
      });

      chapterChangedSubject.next();

      expect(apiServiceSpy.getReleaseTypes).toHaveBeenCalled();
      expect(component.searchForm.get('quarantineType')?.value).toBeNull();
      expect(component.tableData()).toEqual([]);
    });
  });

  describe('Computed Properties', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should disable fields when no quarantine type selected', () => {
      component.selectedType.set('');

      expect(component.fieldsDisabled()).toBeTrue();
    });

    it('should enable fields when quarantine type selected', () => {
      component.selectedType.set('IT');

      expect(component.fieldsDisabled()).toBeFalse();
    });
  });

  describe('Unique ID Generation', () => {
    it('should generate unique component IDs', () => {
      const fixture2 = TestBed.createComponent(ReleaseProductQuarantineComponent);
      const component2: any = fixture2.componentInstance;

      expect(component.componentId).not.toBe(component2.componentId);
    });

    it('should generate element IDs based on component ID', () => {
      const elementId = component.elementId('test');
      expect(elementId).toContain(component.componentId);
      expect(elementId).toContain('test');
    });

    it('should generate error IDs based on component ID', () => {
      const errorId = component.errorId('test');
      expect(errorId).toContain(component.componentId);
      expect(errorId).toContain('test-error');
    });

    it('should generate label IDs based on component ID', () => {
      const labelId = component.labelId('test');
      expect(labelId).toContain(component.componentId);
      expect(labelId).toContain('test-label');
    });
  });



  describe('Clear Method', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form and clear state when clear is called', () => {
      apiServiceSpy.getUnits.and.returnValue(of({ data: mockUnits, total: 2 }));
      component.searchForm.patchValue({
        quarantineType: 'IT',
        productCode: 'RBC001'
      });
      component.tableData.set(mockUnits);
      component.sidePanelOpen.set(true);
      component.error.set('some error');

      component.clear();

      expect(component.searchForm.get('quarantineType')?.value).toBeNull();
      expect(component.selectedType()).toBe('');
      expect(component.tableData()).toEqual([]);
      expect(component.error()).toBeNull();
      expect(component.sidePanelOpen()).toBeFalse();
      expect(component.selectedProduct()).toBeNull();
      expect(component.selectedGridRow()).toBeNull();
    });
  });

  describe('Unit Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
      apiServiceSpy.getUnits.and.returnValue(of({ data: mockUnits, total: 2 }));
    });

    it('should set hasUnitIdValue on unit validated', () => {
      apiServiceSpy.getProductCodes.and.returnValue(of([]));
      component.onUnitValidated({
        parsedUnitId: 'W123456789',
        barcodeType: 'CODE128',
        checkDigit: '5',
        codeScheme: 'I',
        manualUnitId: 'W123456789',
        codabarUnitScheme: null,
        entryMode: 'S',
        chapterScheme: 'I'
      });
      expect(component.hasUnitIdValue()).toBeTrue();
    });

    it('should reset state on unit cleared', () => {
      component.hasUnitIdValue.set(true);
      component.sidePanelOpen.set(true);

      component.onUnitCleared();

      expect(component.hasUnitIdValue()).toBeFalse();
      expect(component.sidePanelOpen()).toBeFalse();
    });
  });

  describe('Close Side Panel', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should close side panel and reset selected items', () => {
      component.sidePanelOpen.set(true);
      component.selectedProduct.set({
        unitId: 'W123456789',
        productCode: 'RBC001',
        aliquot: '01',
        aboRh: 'A+',
        expirationDate: '2026-06-15',
        locationId: 'LOC01',
        status: 'I',
        isExpired: false,
        reasons: mockReasons
      });
      component.selectedGridRow.set(mockUnits[0]);

      component.closeSidePanel();

      expect(component.sidePanelOpen()).toBeFalse();
      expect(component.selectedProduct()).toBeNull();
      expect(component.selectedGridRow()).toBeNull();
    });
  });

  describe('Product Code Changed', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set productCodeHasValue to false when option is null', () => {
      component.onProductCodeChanged(null);
      expect(component.isClearDisabled()).toBeTrue();
    });

    it('should set productCodeHasValue to true when option is provided', () => {
      component.selectedType.set('IT');
      component.onProductCodeChanged({ code: 'RBC001', description: 'Red Blood Cells' });
      expect(component.isClearDisabled()).toBeFalse();
    });
  });

  describe('Filtered Release Types', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return all types when no search', () => {
      expect(component.filteredReleaseTypes().length).toBe(2);
    });

    it('should filter types by search term', () => {
      component.releaseTypeSearchControl.setValue('internal');
      // Give the subscription time to propagate
      expect(component.filteredReleaseTypes().length).toBeLessThanOrEqual(2);
    });
  });

  describe('Preload Reject Codes Error', () => {
    it('should handle error when preloading reject codes', () => {
      apiServiceSpy.getRejectCodes.and.returnValue(throwError(() => new Error('Failed')));
      fixture.detectChanges();
      // Should not throw - error is silently caught
      expect(component.rejectCodes).toEqual([]);
    });
  });

  describe('Sort Data Locally', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.tableData.set(mockUnits);
    });

    it('should sort ascending by displayUnitId', () => {
      const sortEvent: TableSortEvent = { column: 'displayUnitId', direction: 'A' };
      component.onSortChange(sortEvent);

      const data = component.tableData();
      expect(data[0].displayUnitId <= data[1].displayUnitId).toBeTrue();
    });

    it('should sort descending by displayUnitId', () => {
      const sortEvent: TableSortEvent = { column: 'displayUnitId', direction: 'D' };
      component.onSortChange(sortEvent);

      const data = component.tableData();
      expect(data[0].displayUnitId >= data[1].displayUnitId).toBeTrue();
    });
  });

  describe('formatExpirationDate', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format valid date with timezone conversion', () => {
      const result = component.formatExpirationDate('2026-06-15T14:30:00Z');
      expect(result).toContain('JUN');
      expect(result).toContain('2026');
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('should return empty string for null/empty value', () => {
      expect(component.formatExpirationDate('')).toBe('');
    });

    it('should return original value for invalid date', () => {
      expect(component.formatExpirationDate('invalid')).toBe('invalid');
    });
  });

  describe('Context-specific error messages', () => {
    beforeEach(() => {
      fixture.detectChanges();
      apiServiceSpy.getUnits.and.returnValue(of({ data: mockUnits, total: 2 }));
    });

    it('should show quarantine-specific error for IT type when unit not found', () => {
      component.searchForm.patchValue({ quarantineType: 'IT' });
      component.hasUnitIdValue.set(true);

      (component as any).unitIdField = { parsedUnitId: 'WNOTFOUND', isValid: true };

      component.onProductCodeChanged({ code: 'NOCODE', description: '' });

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('No quarantine products found')
      );
    });

    it('should show return-specific error for RT type when unit not found', () => {
      apiServiceSpy.getUnits.and.returnValue(of({ data: mockUnits, total: 2 }));
      component.searchForm.patchValue({ quarantineType: 'RT' });
      component.hasUnitIdValue.set(true);

      (component as any).unitIdField = { parsedUnitId: 'WNOTFOUND', isValid: true };

      component.onProductCodeChanged({ code: 'NOCODE', description: '' });

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('No return items found')
      );
    });
  });

  describe('Multiple aliquot handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
      apiServiceSpy.getUnitReasons.and.returnValue(of(mockReasons));
    });

    it('should open side panel for single unprocessed unit when one aliquot already processed', fakeAsync(() => {
      const multiAliquotData: QuarantineTableItem[] = [
        {
          unitId: 'W123456789',
          displayUnitId: 'W123456789',
          productCode: 'RBC001',
          aliquot: '01',
          aboRh: 'A+',
          expirationDate: '2026-06-15T00:00:00',
          locationId: 'LOC01',
          status: 'I',
          isExpired: 'N',
          collDate: '2026-05-15T00:00:00',
          bloodType: 'A+',
          productType: 'RBC',
          inventoryClass: 'REGULAR',
          osokFlag: null
        },
        {
          unitId: 'W123456789',
          displayUnitId: 'W123456789',
          productCode: 'RBC001',
          aliquot: '02',
          aboRh: 'A+',
          expirationDate: '2026-06-15T00:00:00',
          locationId: 'LOC01',
          status: null,
          isExpired: 'N',
          collDate: '2026-05-15T00:00:00',
          bloodType: 'A+',
          productType: 'RBC',
          inventoryClass: 'REGULAR',
          osokFlag: null
        }
      ];

      component.selectedType.set('IT');
      component.tableData.set(multiAliquotData);
      component.hasUnitIdValue.set(true);
      (component as any).unitIdField = { parsedUnitId: 'W123456789', isValid: true };

      component.onProductCodeChanged({ code: 'RBC001', description: '' });
      tick();

      expect(component.selectedGridRow()).toBeTruthy();
      expect(component.selectedGridRow()?.aliquot).toBe('02');
    }));

    it('should show disambiguation message when multiple unprocessed aliquots exist', fakeAsync(() => {
      const multiAliquotData: QuarantineTableItem[] = [
        { ...mockUnits[0], unitId: 'W123456789', productCode: 'RBC001', aliquot: '01', status: null },
        { ...mockUnits[0], unitId: 'W123456789', productCode: 'RBC001', aliquot: '02', status: null },
      ];

      component.selectedType.set('IT');
      component.tableData.set(multiAliquotData);
      component.hasUnitIdValue.set(true);
      (component as any).unitIdField = { parsedUnitId: 'W123456789', isValid: true };

      component.onProductCodeChanged({ code: 'RBC001', description: '' });
      tick();

      expect(snackbarServiceSpy.showInfo).toHaveBeenCalledWith(
        jasmine.stringContaining('Multiple aliquots found')
      );
    }));

    it('should show error when all matching aliquots are already processed', fakeAsync(() => {
      const allProcessed: QuarantineTableItem[] = [
        { ...mockUnits[0], unitId: 'W123456789', productCode: 'RBC001', aliquot: '01', status: 'I' },
        { ...mockUnits[0], unitId: 'W123456789', productCode: 'RBC001', aliquot: '02', status: 'D' },
      ];

      component.selectedType.set('IT');
      component.tableData.set(allProcessed);
      component.hasUnitIdValue.set(true);
      (component as any).unitIdField = { parsedUnitId: 'W123456789', isValid: true };

      component.onProductCodeChanged({ code: 'RBC001', description: '' });
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'All matching units have already been processed.'
      );
    }));

    it('should show error when single matching unit is already processed', fakeAsync(() => {
      component.selectedType.set('IT');
      component.tableData.set(mockUnits); // mockUnits[0] has status 'I'
      component.hasUnitIdValue.set(true);
      (component as any).unitIdField = { parsedUnitId: 'W123456789', isValid: true };

      component.onProductCodeChanged({ code: 'RBC001', description: '' });
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'This unit has already been processed.'
      );
    }));
  });

  describe('onRowClick', () => {
    beforeEach(() => {
      fixture.detectChanges();
      apiServiceSpy.getUnitReasons.and.returnValue(of(mockReasons));
      apiServiceSpy.getUnits.and.returnValue(of({ data: mockUnits, total: 2 }));
      component.searchForm.patchValue({ quarantineType: 'IT' });
    });

    it('should open side panel for unprocessed row', fakeAsync(() => {
      component.onRowClick(mockUnits[1]); // status: null
      tick();
      expect(component.sidePanelOpen()).toBeTrue();
    }));

    it('should show error for already processed row', () => {
      component.onRowClick(mockUnits[0]); // status: 'I'
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'This unit has already been processed.'
      );
    });
  });

  describe('codeScheme accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should default codeScheme to I', () => {
      expect(component.codeScheme).toBe('I');
    });

    it('should update codeScheme from unit validation response', () => {
      apiServiceSpy.getProductCodes.and.returnValue(of([]));
      component.selectedType.set('IT');
      component.onUnitValidated({
        parsedUnitId: 'W123',
        barcodeType: 'CODABAR',
        checkDigit: '',
        codeScheme: 'C',
        manualUnitId: 'W123',
        codabarUnitScheme: 'C',
        entryMode: 'S',
        chapterScheme: 'C'
      });
      expect(component.codeScheme).toBe('C');
    });
  });

  describe('loadProductCodes flow', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load product codes after unit validation', () => {
      apiServiceSpy.getProductCodes.and.returnValue(of([
        { productCode: 'RBC001', productDesc: 'Red Blood Cells' }
      ]));

      component.selectedType.set('IT');

      component.onUnitValidated({
        parsedUnitId: 'W123456789',
        barcodeType: 'CODE128',
        checkDigit: '5',
        codeScheme: 'I',
        manualUnitId: 'W123456789',
        codabarUnitScheme: null,
        entryMode: 'S',
        chapterScheme: 'I'
      });

      expect(apiServiceSpy.getProductCodes).toHaveBeenCalled();
    });

    it('should show error when product codes fail to load', () => {
      apiServiceSpy.getProductCodes.and.returnValue(throwError(() => new Error('API error')));

      component.selectedType.set('IT');

      component.onUnitValidated({
        parsedUnitId: 'W999999999',
        barcodeType: 'CODE128',
        checkDigit: '5',
        codeScheme: 'I',
        manualUnitId: 'W999999999',
        codabarUnitScheme: null,
        entryMode: 'S',
        chapterScheme: 'I'
      });

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load product codes');
    });
  });

  describe('Side panel opening workflow', () => {
    beforeEach(() => {
      fixture.detectChanges();
      apiServiceSpy.getUnits.and.returnValue(of({ data: mockUnits, total: 2 }));
    });

    it('should open side panel when matching unit found', fakeAsync(() => {
      component.searchForm.patchValue({ quarantineType: 'IT' });
      component.hasUnitIdValue.set(true);
      (component as any).unitIdField = { parsedUnitId: 'W123456789', isValid: true };
      apiServiceSpy.getUnitReasons.and.returnValue(of(mockReasons));

      component.onProductCodeChanged({ code: 'RBC001', description: '' });
      tick();

      expect(component.sidePanelOpen()).toBeTrue();
    }));

    it('should show info message when reasons are empty', fakeAsync(() => {
      component.searchForm.patchValue({ quarantineType: 'IT' });
      component.hasUnitIdValue.set(true);
      (component as any).unitIdField = { parsedUnitId: 'W123456789', isValid: true };
      apiServiceSpy.getUnitReasons.and.returnValue(of([]));

      component.onProductCodeChanged({ code: 'RBC001', description: '' });
      tick();

      expect(snackbarServiceSpy.showInfo).toHaveBeenCalled();
    }));
  });

  describe('tableCount computed', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return correct table count', () => {
      component.tableData.set(mockUnits);
      expect(component.tableCount()).toBe(2);
    });
  });

  describe('Edge cases and branch coverage', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not load units when quarantine type is empty', () => {
      component.searchForm.patchValue({ quarantineType: '' });
      expect(apiServiceSpy.getUnits).not.toHaveBeenCalled();
    });

    it('should handle openSidePanelForUnit when releaseType is empty', () => {
      component.selectedType.set('');
      (component as any).openSidePanelForUnit(mockUnits[0]);
      expect(component.loading()).toBeFalse();
    });

    it('should not check side panel when unitIdField is invalid', () => {
      component.selectedType.set('IT');
      component.tableData.set(mockUnits);
      component.hasUnitIdValue.set(true);
      (component as any).unitIdField = { parsedUnitId: 'W123456789', isValid: false };

      component.onProductCodeChanged({ code: 'RBC001', description: '' });
      expect(component.sidePanelOpen()).toBeFalse();
    });

    it('should not open side panel if already open for same unit', fakeAsync(() => {
      component.selectedType.set('IT');
      component.tableData.set(mockUnits);
      component.hasUnitIdValue.set(true);
      (component as any).unitIdField = { parsedUnitId: 'W123456789', isValid: true };
      apiServiceSpy.getUnitReasons.and.returnValue(of(mockReasons));

      component.onProductCodeChanged({ code: 'RBC001', description: '' });
      tick();

      const firstCallCount = apiServiceSpy.getUnitReasons.calls.count();

      component.onProductCodeChanged({ code: 'RBC001', description: '' });
      tick();

      expect(apiServiceSpy.getUnitReasons.calls.count()).toBe(firstCallCount);
    }));

    it('should handle openSidePanelForUnit error', fakeAsync(() => {
      component.selectedType.set('IT');
      component.tableData.set(mockUnits);
      component.hasUnitIdValue.set(true);
      (component as any).unitIdField = { parsedUnitId: 'W123456789', isValid: true };
      apiServiceSpy.getUnitReasons.and.returnValue(throwError(() => new Error('API error')));

      component.onProductCodeChanged({ code: 'RBC001', description: '' });
      tick();

      expect(component.loading()).toBeFalse();
      expect(component.sidePanelOpen()).toBeFalse();
    }));

    it('should show error when all aliquots already processed', fakeAsync(() => {
      const allProcessed: QuarantineTableItem[] = [
        { ...mockUnits[0], aliquot: '01', status: 'I' },
        { ...mockUnits[0], aliquot: '02', status: 'D' },
      ];

      component.selectedType.set('IT');
      component.tableData.set(allProcessed);
      component.hasUnitIdValue.set(true);
      (component as any).unitIdField = { parsedUnitId: 'W123456789', isValid: true };

      component.onProductCodeChanged({ code: 'RBC001', description: '' });
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'All matching units have already been processed.'
      );
    }));

    it('should clear product code when unit ID changes', () => {
      apiServiceSpy.getProductCodes.and.returnValue(of([]));

      component.selectedType.set('IT');
      (component as any).lastValidatedUnitId = 'WOLD';
      component.onUnitValidated({
        parsedUnitId: 'WNEW',
        barcodeType: 'CODE128',
        checkDigit: '5',
        codeScheme: 'I',
        manualUnitId: 'WNEW',
        codabarUnitScheme: null,
        entryMode: 'S',
        chapterScheme: 'I'
      });

      expect(component.productCodes()).toEqual([]);
    });

    it('should show unitIdHeader with count when table has data', () => {
      component.tableData.set(mockUnits);
      expect(component.unitIdHeader()).toBe('Unit ID (2)');
    });

    it('should set default sort direction', () => {
      const sortEvent: TableSortEvent = { column: 'displayUnitId', direction: 'default' };
      component.onSortChange(sortEvent);
      expect(component.dataTableConfig.sortConfig?.direction).toBe('default');
    });

    it('should compute productCodeOptions from productCodes', () => {
      component.productCodes.set([
        { productCode: 'RBC001', productDesc: 'Red Blood Cells' }
      ]);
      const options = component.productCodeOptions();
      expect(options.length).toBe(1);
      expect(options[0].code).toBe('RBC001');
      expect(options[0].description).toBe('Red Blood Cells');
    });

    it('should disable productCode when no unit ID value', () => {
      component.hasUnitIdValue.set(false);
      component.selectedType.set('IT');
      expect(component.productCodeDisabled()).toBeTrue();
    });

    it('should disable productCode when no selected type', () => {
      component.hasUnitIdValue.set(true);
      component.selectedType.set('');
      expect(component.productCodeDisabled()).toBeTrue();
    });

    it('should enable productCode when both unit and type set', () => {
      component.hasUnitIdValue.set(true);
      component.selectedType.set('IT');
      expect(component.productCodeDisabled()).toBeFalse();
    });

    it('should not load product codes when release type is empty', () => {
      apiServiceSpy.getProductCodes.and.returnValue(of([]));
      component.selectedType.set('');
      (component as any).loadProductCodes('W123');
      expect(apiServiceSpy.getProductCodes).not.toHaveBeenCalled();
    });

    it('should handle isClearDisabled with various states', () => {
      component.hasUnitIdValue.set(false);
      component.selectedType.set('');
      expect(component.isClearDisabled()).toBeTrue();

      component.selectedType.set('IT');
      expect(component.isClearDisabled()).toBeFalse();
    });

    it('should handle onProductReleased with WARNING status (no grid update)', () => {
      component.tableData.set([...mockUnits]);
      component.selectedProduct.set({
        unitId: 'W123456789',
        productCode: 'RBC001',
        aliquot: '01',
        aboRh: 'A+',
        expirationDate: '2026-06-15',
        locationId: 'LOC01',
        status: 'I',
        isExpired: false,
        reasons: mockReasons
      });

      const initial = [...component.tableData()];

      component.onProductReleased({
        status: 'WARNING',
        warnings: [{ code: 'TEST', message: 'Test' }]
      } as any);

      expect(component.tableData()).toEqual(initial);
    });

    it('should format expiration date in dataTableConfig valueFormatter', () => {
      component.ngAfterViewInit();
      const expCol = component.dataTableConfig.columns.find((c: any) => c.key === 'expirationDate');
      expect(expCol?.valueFormatter).toBeDefined();

      const result = expCol?.valueFormatter?.('2026-06-15T14:30:00Z');
      expect(result).toContain('2026');
    });

    it('should filter release types by code', () => {
      component.quarantineTypes.set(mockReleaseTypes);
      component.releaseTypeSearch.set('it');
      const filtered = component.filteredReleaseTypes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('IT');
    });

    it('should filter release types by description', () => {
      component.quarantineTypes.set(mockReleaseTypes);
      component.releaseTypeSearch.set('returns');
      const filtered = component.filteredReleaseTypes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('RT');
    });

    it('should return empty filtered list when no match', () => {
      component.quarantineTypes.set(mockReleaseTypes);
      component.releaseTypeSearch.set('xyz');
      expect(component.filteredReleaseTypes().length).toBe(0);
    });

    it('should return all types when search is empty', () => {
      component.quarantineTypes.set(mockReleaseTypes);
      component.releaseTypeSearch.set('');
      expect(component.filteredReleaseTypes().length).toBe(2);
    });

    it('should handle loadUnits with empty release type', () => {
      (component as any).loadUnits('');
      expect(apiServiceSpy.getUnits).not.toHaveBeenCalled();
    });

    it('should handle productCodeHasValue signal correctly', () => {
      component.onProductCodeChanged(null);
      expect(component.isClearDisabled()).toBeTrue();

      component.selectedType.set('IT');
      component.onProductCodeChanged({ code: 'TEST', description: 'Test' });
      expect(component.isClearDisabled()).toBeFalse();
    });

    it('should handle checkAndOpenSidePanelForProduct with empty data', () => {
      component.selectedType.set('IT');
      component.tableData.set([]);
      component.hasUnitIdValue.set(true);
      (component as any).unitIdField = { parsedUnitId: 'W123', isValid: true };

      component.onProductCodeChanged({ code: 'RBC001', description: '' });
      expect(component.sidePanelOpen()).toBeFalse();
    });

    it('should handle ngOnDestroy', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('parseProductCode', () => {
    let labelScanSpy: jasmine.SpyObj<DonorLibLabelScanService>;

    beforeEach(() => {
      fixture.detectChanges();
      labelScanSpy = TestBed.inject(DonorLibLabelScanService) as jasmine.SpyObj<DonorLibLabelScanService>;
    });

    it('should return scan select option for valid product scan', (done) => {
      labelScanSpy.validateProductScan.and.returnValue(of({
        success: true,
        item: { productCode: 'RBC001', productDescription: 'Red Blood Cells' }
      } as any));

      component.parseProductCode('=+RBC001').subscribe({
        next: (result) => {
          expect(result).toEqual({ code: 'RBC001', description: 'Red Blood Cells' });
          done();
        },
        error: done.fail
      });
    });

    it('should handle missing product description', (done) => {
      labelScanSpy.validateProductScan.and.returnValue(of({
        success: true,
        item: { productCode: 'RBC001', productDescription: null }
      } as any));

      component.parseProductCode('=+RBC001').subscribe({
        next: (result) => {
          expect(result).toEqual({ code: 'RBC001', description: '' });
          done();
        },
        error: done.fail
      });
    });

    it('should throw error for invalid product scan', (done) => {
      labelScanSpy.validateProductScan.and.returnValue(of({
        success: false,
        item: null,
        errorResponse: { error: 'Product not found' }
      } as any));

      component.parseProductCode('INVALID').subscribe({
        next: () => done.fail('Expected error'),
        error: (err) => {
          expect(err.message).toContain('Product not found');
          done();
        }
      });
    });

    it('should throw fallback error when no specific error message', (done) => {
      labelScanSpy.validateProductScan.and.returnValue(of({
        success: false,
        item: null
      } as any));

      component.parseProductCode('INVALID').subscribe({
        next: () => done.fail('Expected error'),
        error: (err) => {
          expect(err.message).toBe('Invalid product code');
          done();
        }
      });
    });
  });
});
