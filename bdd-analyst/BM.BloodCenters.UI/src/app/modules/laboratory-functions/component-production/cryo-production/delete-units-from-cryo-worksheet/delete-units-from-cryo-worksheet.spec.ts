import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { DeleteUnitsFromCryoWorksheetComponent } from './delete-units-from-cryo-worksheet';
import { SnackbarService } from '../../../../../shared/services/snackbar.service';
import { MenuService } from '../../../../../shared/services/menu.service';
import { HeaderService } from '../../../../../shared/services/header.service';
import { DeleteCryoUnitsService } from './services/delete-cryo-units.service';
import { createMockHeaderService, createMockMatDialog, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  CryoWorksheetUnit,
  CryoWorksheetLovResponse,
  DeleteCryoUnitsResponse,
} from './models/delete-cryo-units.model';

describe('DeleteUnitsFromCryoWorksheetComponent', () => {
  let component: DeleteUnitsFromCryoWorksheetComponent;
  let fixture: ComponentFixture<DeleteUnitsFromCryoWorksheetComponent>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockMenuService: jasmine.SpyObj<MenuService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockService: jasmine.SpyObj<DeleteCryoUnitsService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {

    // Create mock services
    mockSnackbarService = createMockSnackbarService();

    mockMenuService = jasmine.createSpyObj('MenuService', ['getMenuItemsSignal', 'findMenuItemByPath']);
    // Mock menu service to return empty signal
    mockMenuService.getMenuItemsSignal.and.returnValue(signal([]));

    mockHeaderService = createMockHeaderService();

    mockService = jasmine.createSpyObj('DeleteCryoUnitsService', [
      'getWorksheets',
      'getWorksheetUnits',
      'deleteUnits',
    ]);

    mockDialog = createMockMatDialog();

    // Default mock responses
    mockService.getWorksheets.and.returnValue(
      of({
        success: true,
        message: 'Worksheets retrieved successfully',
        statusCode: 200,
        data: [],
        totalCount: 0,
      } as CryoWorksheetLovResponse)
    );



      TestBed.configureTestingModule({
      imports: [
        DeleteUnitsFromCryoWorksheetComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: MenuService, useValue: mockMenuService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: DeleteCryoUnitsService, useValue: mockService },
        { provide: MatDialog, useValue: mockDialog },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {} },
            params: of({}),
            queryParams: of({}),
          },
        },
      ],
    });


    


      mockMenuService.getMenuItemsSignal.calls.reset();


      mockMenuService.findMenuItemByPath.calls.reset();


      mockService.getWorksheets.calls.reset();


      mockService.getWorksheetUnits.calls.reset();


      mockService.deleteUnits.calls.reset();


      mockDialog.open.calls.reset();


      mockMenuService.getMenuItemsSignal.and.returnValue(signal([]));


    fixture = TestBed.createComponent(DeleteUnitsFromCryoWorksheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  it('should load worksheet IDs on init', () => {
    expect(mockService.getWorksheets).toHaveBeenCalledWith(100, 0);
  });

  it('should initialize with empty worksheet units', () => {
    expect(component['worksheetUnits']()).toEqual([]);
  });

  it('should mark field as touched when retrieving without worksheet ID', () => {
    component['worksheetIdControl'].setValue('');
    component['onRetrieveWorksheet']();

    expect(component['worksheetIdControl'].touched).toBe(true);
  });

  it('should load units when worksheet is selected', () => {
    const mockUnits: CryoWorksheetUnit[] = [
      {
        sequence: 1,
        unitId: 'W1234-18-031310-Z',
        productCode: 'PC',
        productDescription: 'POOLED CRYOPRECIPITATE',
        bloodGroup: 'O',
        rh: 'POS',
        collectionDate: '10-JAN-2025',
        expirationDate: '10-JAN-2026',
        status: 'AVAILABLE',
      },
    ];

    mockService.getWorksheetUnits.and.returnValue(of(mockUnits));

    component['worksheetIdControl'].setValue('101609-CY1239');
    component['onRetrieveWorksheet']();

    expect(mockService.getWorksheetUnits).toHaveBeenCalledWith('101609-CY1239', 1000, 0);
    expect(component['worksheetUnits']().length).toBe(1);
    // Verify that sequence header is updated with count
    expect(component['tableConfig'].columns[0].header).toBe('Sequence (1)');
  });



  it('should handle API error when loading units', () => {
    const error = { status: 400, error: { errorCode: '0054', message: 'Invalid worksheet' } };
    mockService.getWorksheetUnits.and.returnValue(throwError(() => error));

    component['worksheetIdControl'].setValue('101609-CY1239');
    component['onRetrieveWorksheet']();

    expect(mockSnackbarService.showError).toHaveBeenCalledWith('Invalid worksheet ID or all units already thawed');
  });

  it('should clear worksheet and reset form on clear', () => {
    component['worksheetIdControl'].setValue('101609-CY1239');
    component['worksheetUnits'].set([
      {
        sequence: 1,
        unitId: 'W1234-18-031310-Z',
        productCode: 'PC',
        productDescription: 'POOLED CRYOPRECIPITATE',
        bloodGroup: 'O',
        rh: 'POS',
        collectionDate: '10-JAN-2025',
        expirationDate: '10-JAN-2026',
        status: 'AVAILABLE',
      },
    ]);

    component['onClearWorksheet']();

    expect(component['worksheetIdControl'].value).toBeNull();
    expect(component['worksheetUnits']()).toEqual([]);
    expect(component['hasRetrieved']()).toBe(false);
    // Verify that sequence header is reset to (0)
    expect(component['tableConfig'].columns[0].header).toBe('Sequence (0)');
  });

  it('should update selected units on selection change', () => {
    const units: CryoWorksheetUnit[] = [
      {
        sequence: 1,
        unitId: 'W1234-18-031310-Z',
        productCode: 'PC',
        productDescription: 'POOLED CRYOPRECIPITATE',
        bloodGroup: 'O',
        rh: 'POS',
        collectionDate: '10-JAN-2025',
        expirationDate: '10-JAN-2026',
        status: 'AVAILABLE',
      },
    ];

    component['onSelectionChange'](units);

    expect(component['selectedUnits']()).toEqual(units);
    expect(component['selectedCount']()).toBe(1);
  });



  it('should clear multiple selections', () => {
    const units: CryoWorksheetUnit[] = [
      {
        sequence: 1,
        unitId: 'W1234-18-031310-Z',
        productCode: 'PC',
        productDescription: 'POOLED CRYOPRECIPITATE',
        bloodGroup: 'O',
        rh: 'POS',
        collectionDate: '10-JAN-2025',
        expirationDate: '10-JAN-2026',
        status: 'AVAILABLE',
      },
      {
        sequence: 2,
        unitId: 'W5678-18-031309-Z',
        productCode: 'PC',
        productDescription: 'POOLED CRYOPRECIPITATE',
        bloodGroup: 'A',
        rh: 'POS',
        collectionDate: '10-JAN-2025',
        expirationDate: '10-JAN-2026',
        status: 'AVAILABLE',
      },
      {
        sequence: 3,
        unitId: 'W9012-18-031308-Z',
        productCode: 'PC',
        productDescription: 'POOLED CRYOPRECIPITATE',
        bloodGroup: 'B',
        rh: 'POS',
        collectionDate: '10-JAN-2025',
        expirationDate: '10-JAN-2026',
        status: 'AVAILABLE',
      },
    ];

    // Select all 3 units
    component['selectedUnits'].set(units);
    component['externalSelectedIds'].set(new Set(['W1234-18-031310-Z', 'W5678-18-031309-Z', 'W9012-18-031308-Z']));

    // Mock DataTable with all pages selected (header checkbox scenario)
    if (component['dataTable']) {
      component['dataTable']['selectedIds'] = new Set(['W1234-18-031310-Z', 'W5678-18-031309-Z', 'W9012-18-031308-Z']);
      component['dataTable']['selectedRows'] = units;
      component['dataTable']['isAllSelected'] = true;
      component['dataTable']['isAllPagesSelected'] = true;
    }

    // Verify all are selected
    expect(component['selectedCount']()).toBe(3);
    expect(component['externalSelectedIds']().size).toBe(3);

    // Clear all selections
    component['clearAllSelections']();

    // Verify all cleared
    expect(component['selectedCount']()).toBe(0);
    expect(component['externalSelectedIds']().size).toBe(0);
    expect(component['hasSelection']()).toBe(false);

    // Verify DataTable internal state is also cleared
    if (component['dataTable']) {
      expect(component['dataTable']['selectedIds'].size).toBe(0);
      expect(component['dataTable']['selectedRows'].length).toBe(0);
      expect(component['dataTable']['isAllSelected']).toBe(false);
      expect(component['dataTable']['isAllPagesSelected']).toBe(false);
    }
  });







  it('should clear form and reload worksheets after successful deletion', () => {
    const mockDialogRef = {
      afterClosed: () => of(true),
    };
    mockDialog.open.and.returnValue(mockDialogRef as any);

    const mockResponse: DeleteCryoUnitsResponse = {
      success: true,
      message: 'TRANSACTION COMMITTED',
      errorCode: '8010',
      statusCode: 200,
    };
    mockService.deleteUnits.and.returnValue(of(mockResponse));

    component['worksheetIdControl'].setValue('101609-CY1239');
    component['selectedUnits'].set([
      {
        sequence: 1,
        unitId: 'W1234-18-031310-Z',
        productCode: 'PC',
        productDescription: 'POOLED CRYOPRECIPITATE',
        bloodGroup: 'O',
        rh: 'POS',
        collectionDate: '10-JAN-2025',
        expirationDate: '10-JAN-2026',
        status: 'AVAILABLE',
      },
    ]);

    // Spy on onClearWorksheet and loadWorksheetIds
    spyOn<any>(component, 'onClearWorksheet');
    spyOn<any>(component, 'loadWorksheetIds');

    component['onDeleteSelected']();

    expect(mockService.deleteUnits).toHaveBeenCalledWith({
      cryoWorksheetId: '101609-CY1239',
      unitIds: ['W1234-18-031310-Z'],
    });

    // Should clear form and reload worksheets, NOT refresh unit list
    expect(component['onClearWorksheet']).toHaveBeenCalled();
    expect(component['loadWorksheetIds']).toHaveBeenCalled();
  });



  it('should handle error code 0054 correctly', () => {
    const error = {
      status: 400,
      error: { errorCode: '0054', message: 'Invalid worksheet' },
    };

    component['handleApiError'](error, 'Default message');

    expect(mockSnackbarService.showError).toHaveBeenCalledWith(
      'Invalid worksheet ID or all units already thawed'
    );
  });

  it('should handle error code 8013 correctly', () => {
    const error = {
      status: 400,
      error: { errorCode: '8013', message: 'No changes to commit' },
    };

    component['handleApiError'](error, 'Default message');

    expect(mockSnackbarService.showError).toHaveBeenCalledWith('No units selected for deletion');
  });

  it('should handle error code 0230 correctly', () => {
    const error = {
      status: 500,
      error: { errorCode: '0230', message: 'Commit failed' },
    };

    component['handleApiError'](error, 'Default message');

    expect(mockSnackbarService.showError).toHaveBeenCalledWith(
      'Failed to commit changes - transaction rolled back. Please try again.'
    );
  });

  it('should sort units in ascending order', () => {
    component['worksheetUnits'].set([
      {
        sequence: 3,
        unitId: 'W1234-18-031308-Z',
        productCode: 'PC',
        productDescription: 'POOLED CRYOPRECIPITATE',
        bloodGroup: 'O',
        rh: 'POS',
        collectionDate: '10-JAN-2025',
        expirationDate: '10-JAN-2026',
        status: 'AVAILABLE',
      },
      {
        sequence: 1,
        unitId: 'W1234-18-031310-Z',
        productCode: 'PC',
        productDescription: 'POOLED CRYOPRECIPITATE',
        bloodGroup: 'O',
        rh: 'POS',
        collectionDate: '10-JAN-2025',
        expirationDate: '10-JAN-2026',
        status: 'AVAILABLE',
      },
      {
        sequence: 2,
        unitId: 'W1234-18-031309-Z',
        productCode: 'PC',
        productDescription: 'POOLED CRYOPRECIPITATE',
        bloodGroup: 'O',
        rh: 'POS',
        collectionDate: '10-JAN-2025',
        expirationDate: '10-JAN-2026',
        status: 'AVAILABLE',
      },
    ]);

    component['onSortChange']({ column: 'sequence', direction: 'A' });

    const sorted = component['worksheetUnits']();
    expect(sorted[0].sequence).toBe(1);
    expect(sorted[1].sequence).toBe(2);
    expect(sorted[2].sequence).toBe(3);
  });

  it('should sort units in descending order', () => {
    component['worksheetUnits'].set([
      {
        sequence: 1,
        unitId: 'W1234-18-031310-Z',
        productCode: 'PC',
        productDescription: 'POOLED CRYOPRECIPITATE',
        bloodGroup: 'O',
        rh: 'POS',
        collectionDate: '10-JAN-2025',
        expirationDate: '10-JAN-2026',
        status: 'AVAILABLE',
      },
      {
        sequence: 2,
        unitId: 'W1234-18-031309-Z',
        productCode: 'PC',
        productDescription: 'POOLED CRYOPRECIPITATE',
        bloodGroup: 'O',
        rh: 'POS',
        collectionDate: '10-JAN-2025',
        expirationDate: '10-JAN-2026',
        status: 'AVAILABLE',
      },
      {
        sequence: 3,
        unitId: 'W1234-18-031308-Z',
        productCode: 'PC',
        productDescription: 'POOLED CRYOPRECIPITATE',
        bloodGroup: 'O',
        rh: 'POS',
        collectionDate: '10-JAN-2025',
        expirationDate: '10-JAN-2026',
        status: 'AVAILABLE',
      },
    ]);

    component['onSortChange']({ column: 'sequence', direction: 'D' });

    const sorted = component['worksheetUnits']();
    expect(sorted[0].sequence).toBe(3);
    expect(sorted[1].sequence).toBe(2);
    expect(sorted[2].sequence).toBe(1);
  });



  it('should reset to default sort order', () => {
    component['worksheetUnits'].set([
      {
        sequence: 2,
        unitId: 'W1234-18-031309-Z',
        productCode: 'PC',
        productDescription: 'POOLED CRYOPRECIPITATE',
        bloodGroup: 'O',
        rh: 'POS',
        collectionDate: '10-JAN-2025',
        expirationDate: '10-JAN-2026',
        status: 'AVAILABLE',
      },
      {
        sequence: 3,
        unitId: 'W1234-18-031308-Z',
        productCode: 'PC',
        productDescription: 'POOLED CRYOPRECIPITATE',
        bloodGroup: 'O',
        rh: 'POS',
        collectionDate: '10-JAN-2025',
        expirationDate: '10-JAN-2026',
        status: 'AVAILABLE',
      },
      {
        sequence: 1,
        unitId: 'W1234-18-031310-Z',
        productCode: 'PC',
        productDescription: 'POOLED CRYOPRECIPITATE',
        bloodGroup: 'O',
        rh: 'POS',
        collectionDate: '10-JAN-2025',
        expirationDate: '10-JAN-2026',
        status: 'AVAILABLE',
      },
    ]);

    component['onSortChange']({ column: 'sequence', direction: 'default' });

    const sorted = component['worksheetUnits']();
    expect(sorted[0].sequence).toBe(1);
    expect(sorted[1].sequence).toBe(2);
    expect(sorted[2].sequence).toBe(3);
  });

  it('should update external selection IDs when selection changes', () => {
    const units: CryoWorksheetUnit[] = [
      {
        sequence: 1,
        unitId: 'W1234-18-031310-Z',
        productCode: 'PC',
        productDescription: 'POOLED CRYOPRECIPITATE',
        bloodGroup: 'O',
        rh: 'POS',
        collectionDate: '10-JAN-2025',
        expirationDate: '10-JAN-2026',
        status: 'AVAILABLE',
      },
      {
        sequence: 2,
        unitId: 'W5678-18-031309-Z',
        productCode: 'PC',
        productDescription: 'POOLED CRYOPRECIPITATE',
        bloodGroup: 'A',
        rh: 'POS',
        collectionDate: '10-JAN-2025',
        expirationDate: '10-JAN-2026',
        status: 'AVAILABLE',
      },
    ];

    component['onSelectionChange'](units);

    const externalIds = component['externalSelectedIds']();
    expect(externalIds.size).toBe(2);
    expect(externalIds.has('W1234-18-031310-Z')).toBe(true);
    expect(externalIds.has('W5678-18-031309-Z')).toBe(true);
  });

  it('should update hasSelection computed signal when selection changes', () => {
    expect(component['hasSelection']()).toBe(false);

    const units: CryoWorksheetUnit[] = [
      {
        sequence: 1,
        unitId: 'W1234-18-031310-Z',
        productCode: 'PC',
        productDescription: 'POOLED CRYOPRECIPITATE',
        bloodGroup: 'O',
        rh: 'POS',
        collectionDate: '10-JAN-2025',
        expirationDate: '10-JAN-2026',
        status: 'AVAILABLE',
      },
    ];

    component['onSelectionChange'](units);
    expect(component['hasSelection']()).toBe(true);
  });







  it('should update sequence header count to match worksheet units', () => {
    const mockUnits: CryoWorksheetUnit[] = [
      {
        sequence: 1,
        unitId: 'W1234-18-031310-Z',
        productCode: 'PC',
        productDescription: 'POOLED CRYOPRECIPITATE',
        bloodGroup: 'O',
        rh: 'POS',
        collectionDate: '10-JAN-2025',
        expirationDate: '10-JAN-2026',
        status: 'AVAILABLE',
      },
      {
        sequence: 2,
        unitId: 'W5678-18-031309-Z',
        productCode: 'PC',
        productDescription: 'POOLED CRYOPRECIPITATE',
        bloodGroup: 'A',
        rh: 'POS',
        collectionDate: '10-JAN-2025',
        expirationDate: '10-JAN-2026',
        status: 'AVAILABLE',
      },
      {
        sequence: 3,
        unitId: 'W9012-18-031308-Z',
        productCode: 'PC',
        productDescription: 'POOLED CRYOPRECIPITATE',
        bloodGroup: 'B',
        rh: 'POS',
        collectionDate: '10-JAN-2025',
        expirationDate: '10-JAN-2026',
        status: 'AVAILABLE',
      },
    ];

    mockService.getWorksheetUnits.and.returnValue(of(mockUnits));

    component['worksheetIdControl'].setValue('101609-CY1239');
    component['onRetrieveWorksheet']();

    expect(component['tableConfig'].columns[0].header).toBe('Sequence (3)');
  });

  it('should clear header checkbox when all pages are selected', () => {
    const units: CryoWorksheetUnit[] = [
      {
        sequence: 1,
        unitId: 'W1234-18-031310-Z',
        productCode: 'PC',
        productDescription: 'POOLED CRYOPRECIPITATE',
        bloodGroup: 'O',
        rh: 'POS',
        collectionDate: '10-JAN-2025',
        expirationDate: '10-JAN-2026',
        status: 'AVAILABLE',
      },
    ];

    // Simulate header checkbox being checked (select all pages)
    component['selectedUnits'].set(units);
    component['externalSelectedIds'].set(new Set(['W1234-18-031310-Z']));

    // Mock DataTable with isAllPagesSelected = true (header checkbox checked)
    if (component['dataTable']) {
      component['dataTable']['selectedIds'] = new Set(['W1234-18-031310-Z']);
      component['dataTable']['selectedRows'] = units;
      component['dataTable']['isAllSelected'] = true;
      component['dataTable']['isAllPagesSelected'] = true;
    }

    // Clear all selections
    component['clearAllSelections']();

    // Verify DataTable's header checkbox flag is cleared
    if (component['dataTable']) {
      expect(component['dataTable']['isAllPagesSelected']).toBe(false);
      expect(component['dataTable']['isAllSelected']).toBe(false);
      expect(component['dataTable']['selectedIds'].size).toBe(0);
      expect(component['dataTable']['selectedRows'].length).toBe(0);
    }

    expect(component['selectedCount']()).toBe(0);
  });




});
