import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError, EMPTY, Subject } from 'rxjs';

import { DeleteUnitInLabSystemComponent } from './delete-unit-in-lab-system.component';
import { DeleteUnitConfirmDialogComponent } from './delete-unit-confirm-dialog.component';
import { DeleteUnitService } from './services/delete-unit.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ValidateUnitResponse, ValidateUnitItem } from './models/delete-unit.model';
import { UnitValidationResponse } from '@shared/components/unit-id-field';
import { createMockMatSnackBar, createMockMatDialog } from '@shared/testing/common-mocks';

describe('DeleteUnitInLabSystemComponent', () => {
  let component: DeleteUnitInLabSystemComponent;
  let fixture: ComponentFixture<DeleteUnitInLabSystemComponent>;
  let mockDeleteUnitService: jasmine.SpyObj<DeleteUnitService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  const mockValidateResponse: ValidateUnitResponse = {
    success: true,
    message: 'Unit found',
    statusCode: 200,
    item: {
      canDelete: true,
      unitId: 'TEST123',
      validationErrors: [],
      unitReferences: [
        { tableName: 'DONATIONS', columnName: 'UNIT_ID', recordCount: 1, hasRecords: true },
        { tableName: 'COMPONENTS', columnName: 'UNIT_ID', recordCount: 0, hasRecords: false }
      ],
      hasPooledProducts: false,
      hasActiveComponents: false,
      unitExists: true
    },
    errorResponse: {
      errorCode: '',
      error: ''
    }
  };

  beforeEach(() => {

    mockDeleteUnitService = jasmine.createSpyObj('DeleteUnitService', ['validateUnit', 'deleteUnit']);
    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: jasmine.createSpy('pageHeaderData').and.returnValue({
        title: 'Delete Unit in Lab System',
        subtitle: 'Remove unit data from laboratory tables'
      })
    });
    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      events: EMPTY
    });
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');
    mockSnackBar = createMockMatSnackBar();

    // Create a more complete MatDialog spy with required internal properties
    mockDialog = createMockMatDialog();
    (mockDialog as any)._openDialogsAtThisLevel = [];
    (mockDialog as any).openDialogs = [];
    (mockDialog as any)._getAfterAllClosed = () => EMPTY;
    (mockDialog as any)._afterAllClosedAtThisLevel = new Subject<void>();
    (mockDialog as any)._afterOpenedAtThisLevel = new Subject<any>();
    (mockDialog as any).afterAllClosed = EMPTY;
    (mockDialog as any).afterOpened = EMPTY;



      TestBed.configureTestingModule({
imports: [
        DeleteUnitInLabSystemComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: DeleteUnitService, useValue: mockDeleteUnitService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: Router, useValue: mockRouter },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: ActivatedRoute, useValue: {} }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).overrideProvider(MatDialog, { useValue: mockDialog });


    });



  beforeEach(() => {


      mockDeleteUnitService.validateUnit.calls.reset();


      mockDeleteUnitService.deleteUnit.calls.reset();


      mockPageHeaderService.getTitle.calls.reset();


      mockPageHeaderService.getSubtitle.calls.reset();


      mockRouter.navigate.calls.reset();


      mockRouter.createUrlTree.calls.reset();


      mockRouter.serializeUrl.calls.reset();


      mockDialog.open.calls.reset();


      mockRouter.createUrlTree.and.returnValue({} as any);


      mockRouter.serializeUrl.and.returnValue('');


    fixture = TestBed.createComponent(DeleteUnitInLabSystemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });
  describe('Search Functionality', () => {

    it('should search for unit when unitIdField is valid', fakeAsync(() => {
      mockDeleteUnitService.validateUnit.and.returnValue(of(mockValidateResponse));

      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('TEST123');

      component.onSearch();
      tick();

      expect(mockDeleteUnitService.validateUnit).toHaveBeenCalledWith({ unitId: 'TEST123' });
      expect(component.unitFound()).toBeTruthy();
      expect(component.unitData()).toEqual(mockValidateResponse);
    }));


    it('should append -* to 13-character Unit IDs before validation', fakeAsync(() => {
      mockDeleteUnitService.validateUnit.and.returnValue(of(mockValidateResponse));

      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('W043223041151');

      component.onSearch();
      tick();

      expect(mockDeleteUnitService.validateUnit).toHaveBeenCalledWith({ unitId: 'W043223041151-*' });
      expect(component.unitFound()).toBeTruthy();
    }));
  });

  describe('Delete Functionality', () => {
    beforeEach(fakeAsync(() => {
      mockDeleteUnitService.validateUnit.and.returnValue(of(mockValidateResponse));
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('TEST123');
      component.onSearch();
      tick();
      fixture.detectChanges();
      // Reset snackBar spy after setup
      mockSnackBar.open.calls.reset();
    }));


    it('should delete unit when confirmed', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('dialogRef', { afterClosed: of(true) });
      mockDialog.open.and.returnValue(dialogRefSpy);
      mockDeleteUnitService.deleteUnit.and.returnValue(of({ success: true, message: 'Unit deleted', statusCode: 200, errorResponse: { errorCode: '', error: '' } }));

      // Spy on the component's private snackBar directly
      const componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      component.onDelete();
      tick();
      flush();
      fixture.detectChanges();

      expect(mockDeleteUnitService.deleteUnit).toHaveBeenCalledWith({ unitId: 'TEST123', confirmed: true });
      expect(componentSnackBar.open).toHaveBeenCalled();
    }));


    it('should handle delete error', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('dialogRef', { afterClosed: of(true) });
      mockDialog.open.and.returnValue(dialogRefSpy);
      const error = { error: { message: 'Delete failed' } };
      mockDeleteUnitService.deleteUnit.and.returnValue(throwError(() => error));

      // Spy on the component's private snackBar directly
      const componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      component.onDelete();
      tick();
      flush();
      fixture.detectChanges();

      expect(componentSnackBar.open).toHaveBeenCalled();
      expect(component.deleting()).toBeFalsy();
    }));

    it('should append -* to 13-character Unit IDs before deletion', fakeAsync(() => {
      // Reset to test with 13-character Unit ID
      component.unitFound.set(false);
      component.unitData.set(null);

      const response13Char = { ...mockValidateResponse, item: { ...mockValidateResponse.item, unitId: 'W043223041151' } };
      mockDeleteUnitService.validateUnit.and.returnValue(of(response13Char));

      // Use the existing spies from beforeEach and change return values
      (Object.getOwnPropertyDescriptor(component.unitIdField, 'parsedUnitId')!.get as jasmine.Spy).and.returnValue('W043223041151');

      component.onSearch();
      tick();
      fixture.detectChanges();

      const dialogRefSpy = jasmine.createSpyObj('dialogRef', { afterClosed: of(true) });
      mockDialog.open.and.returnValue(dialogRefSpy);
      mockDeleteUnitService.deleteUnit.and.returnValue(of({ success: true, message: 'Unit deleted', statusCode: 200, errorResponse: { errorCode: '', error: '' } }));

      component.onDelete();
      tick();
      flush();
      fixture.detectChanges();

      expect(mockDeleteUnitService.deleteUnit).toHaveBeenCalledWith({ unitId: 'W043223041151-*', confirmed: true });
    }));

    it('should handle API-level failure even with 200 status (success: false)', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('dialogRef', { afterClosed: of(true) });
      mockDialog.open.and.returnValue(dialogRefSpy);

      const failureResponse = {
        success: false,
        errorCode: '1234',
        error: 'Unit cannot be deleted',
        message: 'Unit cannot be deleted',
        statusCode: 200
      };
      mockDeleteUnitService.deleteUnit.and.returnValue(of(failureResponse));

      // Spy on the component's private snackBar directly
      const componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      component.onDelete();
      tick();
      flush();
      fixture.detectChanges();

      expect(componentSnackBar.open).toHaveBeenCalledWith(
        'Error 1234: Unit cannot be deleted',
        'DISMISS',
        jasmine.objectContaining({
          panelClass: ['error-snackbar']
        })
      );
      expect(component.deleting()).toBeFalse();
    }));

    it('should handle API-level failure with errorResponse structure', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('dialogRef', { afterClosed: of(true) });
      mockDialog.open.and.returnValue(dialogRefSpy);

      const failureResponse = {
        success: false,
        errorResponse: {
          errorCode: '5678',
          error: 'Invalid unit state'
        },
        statusCode: 200
      };
      mockDeleteUnitService.deleteUnit.and.returnValue(of(failureResponse));

      // Spy on the component's private snackBar directly
      const componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      component.onDelete();
      tick();
      flush();
      fixture.detectChanges();

      expect(componentSnackBar.open).toHaveBeenCalledWith(
        'Error 5678: Invalid unit state',
        'DISMISS',
        jasmine.objectContaining({
          panelClass: ['error-snackbar']
        })
      );
    }));

    it('should handle API-level failure without error code', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('dialogRef', { afterClosed: of(true) });
      mockDialog.open.and.returnValue(dialogRefSpy);

      const failureResponse = {
        success: false,
        message: 'Delete operation failed',
        statusCode: 200
      };
      mockDeleteUnitService.deleteUnit.and.returnValue(of(failureResponse));

      // Spy on the component's private snackBar directly
      const componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      component.onDelete();
      tick();
      flush();
      fixture.detectChanges();

      expect(componentSnackBar.open).toHaveBeenCalledWith(
        'Delete operation failed',
        'DISMISS',
        jasmine.objectContaining({
          panelClass: ['error-snackbar']
        })
      );
    }));
  });

  // Input validation tests removed - now handled by shared unit-id-field component

  describe('Table Search', () => {
    beforeEach(fakeAsync(() => {
      mockDeleteUnitService.validateUnit.and.returnValue(of(mockValidateResponse));
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('TEST123');
      component.onSearch();
      tick();
      fixture.detectChanges();
    }));


    it('should show all data when search is empty', () => {
      component.onTableSearch('');
      const filtered = component.filteredTableData();
      expect(filtered.length).toBe(2);
    });

  });

  describe('Reset Functionality', () => {
    it('should reset form and state', () => {
      component.unitFound.set(true);
      component.unitData.set(mockValidateResponse);
      spyOn(component.unitIdField, 'clear');

      component.onReset();

      expect(component.unitIdField.clear).toHaveBeenCalled();
      expect(component.unitFound()).toBeFalsy();
      expect(component.unitData()).toBeNull();
    });
  });
  describe('Computed Properties', () => {
    it('should compute canDelete correctly when unit can be deleted', fakeAsync(() => {
      mockDeleteUnitService.validateUnit.and.returnValue(of(mockValidateResponse));
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('TEST123');
      component.onSearch();
      tick();
      fixture.detectChanges();

      expect(component.canDelete()).toBeTruthy();
    }));

    it('should compute canDelete as false when unit cannot be deleted', fakeAsync(() => {
      const cannotDeleteResponse = { ...mockValidateResponse, item: { ...mockValidateResponse.item, canDelete: false } };
      mockDeleteUnitService.validateUnit.and.returnValue(of(cannotDeleteResponse));
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('TEST123');
      component.onSearch();
      tick();
      fixture.detectChanges();

      expect(component.canDelete()).toBeFalsy();
    }));

    it('should compute canDelete as false when deleting', fakeAsync(() => {
      mockDeleteUnitService.validateUnit.and.returnValue(of(mockValidateResponse));
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('TEST123');
      component.onSearch();
      tick();

      component.deleting.set(true);
      fixture.detectChanges();

      expect(component.canDelete()).toBeFalsy();
    }));
  });

  describe('Cleanup', () => {
    it('should complete destroy$ on component destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize signals with default values', () => {
      expect(component.loading()).toBeFalse();
      expect(component.searching()).toBeFalse();
      expect(component.deleting()).toBeFalse();
      expect(component.unitFound()).toBeFalse();
      expect(component.unitData()).toBeNull();
      expect(component.tableData()).toEqual([]);
      expect(component.tableSearchText()).toBe('');
    });

    it('should have correct unitIdLabel', () => {
      expect(component.unitIdLabel).toBe('Unit ID');
    });

    it('should have correct table search configuration', () => {
      expect(component.tableSearchConfig.placeholder).toBe('Search');
      expect(component.tableSearchConfig.minLength).toBe(1);
      expect(component.tableSearchConfig.searchOnEnterOnly).toBeTrue();
      expect(component.tableSearchConfig.debounceTime).toBe(300);
    });

    it('should have correct table configuration', () => {
      expect(component.tableConfig.showPagination).toBeFalse();
      expect(component.tableConfig.stickyHeader).toBeTrue();
      expect(component.tableConfig.columns.length).toBe(2);
    });

    it('should define two table columns with correct keys', () => {
      expect(component.columns.length).toBe(2);
      expect(component.columns[0].key).toBe('tableName');
      expect(component.columns[1].key).toBe('hasRecords');
    });
  });

  describe('ngOnInit', () => {
    it('should execute without errors', () => {
      expect(() => component.ngOnInit()).not.toThrow();
    });
  });

  describe('onUnitValidated', () => {
    it('should call onSearch when unit is validated', () => {
      spyOn(component, 'onSearch');
      const mockData = { data: { parsedUnitId: 'TEST123' } } as any;
      component.onUnitValidated(mockData);
      expect(component.onSearch).toHaveBeenCalled();
    });
  });

  describe('onUnitCleared', () => {
    it('should reset all state when unit is cleared', () => {
      component.unitFound.set(true);
      component.unitData.set(mockValidateResponse);
      component.tableData.set(mockValidateResponse.item.unitReferences);
      component.tableSearchText.set('DONATIONS');

      component.onUnitCleared();

      expect(component.unitFound()).toBeFalse();
      expect(component.unitData()).toBeNull();
      expect(component.tableData()).toEqual([]);
      expect(component.tableSearchText()).toBe('');
    });
  });

  describe('Search Edge Cases', () => {
    it('should return early when unitIdField is not valid', () => {
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(false);
      component.onSearch();
      expect(mockDeleteUnitService.validateUnit).not.toHaveBeenCalled();
    });

    it('should return early when parsedUnitId is null', () => {
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue(null);
      component.onSearch();
      expect(mockDeleteUnitService.validateUnit).not.toHaveBeenCalled();
    });

    it('should return early when parsedUnitId is empty string', () => {
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('');
      component.onSearch();
      expect(mockDeleteUnitService.validateUnit).not.toHaveBeenCalled();
    });

    it('should set searching to false after search completes', fakeAsync(() => {
      mockDeleteUnitService.validateUnit.and.returnValue(of(mockValidateResponse));
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('TEST123');

      component.onSearch();
      tick();

      expect(component.searching()).toBeFalse();
    }));

    it('should show error when response success is false', fakeAsync(() => {
      const failedResponse = { ...mockValidateResponse, success: false, message: 'Validation failed' };
      mockDeleteUnitService.validateUnit.and.returnValue(of(failedResponse));
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('TEST123');

      const componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      component.onSearch();
      tick();

      expect(component.unitFound()).toBeFalse();
      expect(component.searching()).toBeFalse();
      expect(componentSnackBar.open).toHaveBeenCalledWith(
        'Validation failed', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));

    it('should show error when unitExists is false', fakeAsync(() => {
      const noUnitResponse = {
        ...mockValidateResponse,
        success: true,
        message: 'Unit not found',
        item: { ...mockValidateResponse.item, unitExists: false }
      };
      mockDeleteUnitService.validateUnit.and.returnValue(of(noUnitResponse));
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('TEST123');

      const componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      component.onSearch();
      tick();

      expect(component.unitFound()).toBeFalse();
      expect(componentSnackBar.open).toHaveBeenCalledWith(
        'Unit not found', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));

    it('should use default message when response message is empty on failure', fakeAsync(() => {
      const noMsgResponse = { ...mockValidateResponse, success: false, message: '' };
      mockDeleteUnitService.validateUnit.and.returnValue(of(noMsgResponse));
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('TEST123');

      const componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      component.onSearch();
      tick();

      expect(componentSnackBar.open).toHaveBeenCalledWith(
        'Unit not found in any tables', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));

    it('should handle HTTP error during search', fakeAsync(() => {
      const error = { error: { message: 'Server error' } };
      mockDeleteUnitService.validateUnit.and.returnValue(throwError(() => error));
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('TEST123');

      const componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      component.onSearch();
      tick();

      expect(component.searching()).toBeFalse();
      expect(componentSnackBar.open).toHaveBeenCalledWith(
        'Server error', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));

    it('should set tableData from unitReferences on successful search', fakeAsync(() => {
      mockDeleteUnitService.validateUnit.and.returnValue(of(mockValidateResponse));
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('TEST123');

      component.onSearch();
      tick();

      expect(component.tableData()).toEqual(mockValidateResponse.item.unitReferences);
    }));

    it('should clear previous state before starting a new search', fakeAsync(() => {
      component.unitFound.set(true);
      component.unitData.set(mockValidateResponse);
      component.tableData.set(mockValidateResponse.item.unitReferences);

      mockDeleteUnitService.validateUnit.and.returnValue(of(mockValidateResponse));
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('TEST123');

      component.onSearch();
      tick();

      expect(component.unitFound()).toBeTrue();
    }));
  });

  describe('Delete Edge Cases', () => {
    it('should return early when unitData is null', () => {
      component.unitData.set(null);
      component.onDelete();
      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('should return early when unitData item is null', () => {
      component.unitData.set({ ...mockValidateResponse, item: null as any });
      component.onDelete();
      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('should return early when unitData item unitId is empty', () => {
      component.unitData.set({
        ...mockValidateResponse,
        item: { ...mockValidateResponse.item, unitId: '' }
      });
      component.onDelete();
      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('should not call deleteUnit when dialog is cancelled', fakeAsync(() => {
      component.unitData.set(mockValidateResponse);
      component.unitFound.set(true);

      const dialogRefSpy = jasmine.createSpyObj('dialogRef', { afterClosed: of(false) });
      mockDialog.open.and.returnValue(dialogRefSpy);

      component.onDelete();
      tick();

      expect(mockDialog.open).toHaveBeenCalled();
      expect(mockDeleteUnitService.deleteUnit).not.toHaveBeenCalled();
    }));

    it('should not call deleteUnit when dialog returns null', fakeAsync(() => {
      component.unitData.set(mockValidateResponse);
      component.unitFound.set(true);

      const dialogRefSpy = jasmine.createSpyObj('dialogRef', { afterClosed: of(null) });
      mockDialog.open.and.returnValue(dialogRefSpy);

      component.onDelete();
      tick();

      expect(mockDeleteUnitService.deleteUnit).not.toHaveBeenCalled();
    }));

    it('should open dialog with correct configuration', fakeAsync(() => {
      component.unitData.set(mockValidateResponse);
      component.unitFound.set(true);

      const dialogRefSpy = jasmine.createSpyObj('dialogRef', { afterClosed: of(false) });
      mockDialog.open.and.returnValue(dialogRefSpy);

      component.onDelete();
      tick();

      expect(mockDialog.open).toHaveBeenCalledWith(
        DeleteUnitConfirmDialogComponent,
        jasmine.objectContaining({
          width: '490px',
          disableClose: true,
          hasBackdrop: true,
          data: { unitId: 'TEST123' }
        })
      );
    }));

    it('should reset form after successful deletion', fakeAsync(() => {
      component.unitData.set(mockValidateResponse);
      component.unitFound.set(true);
      spyOn(component.unitIdField, 'clear');

      const dialogRefSpy = jasmine.createSpyObj('dialogRef', { afterClosed: of(true) });
      mockDialog.open.and.returnValue(dialogRefSpy);
      mockDeleteUnitService.deleteUnit.and.returnValue(of({
        success: true, message: 'Deleted', statusCode: 200
      }));

      const componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      component.onDelete();
      tick();
      flush();

      expect(component.deleting()).toBeFalse();
      expect(component.unitFound()).toBeFalse();
      expect(component.unitData()).toBeNull();
      expect(component.tableData()).toEqual([]);
    }));

    it('should show success snackbar with correct message after deletion', fakeAsync(() => {
      component.unitData.set(mockValidateResponse);
      component.unitFound.set(true);
      spyOn(component.unitIdField, 'clear');

      const dialogRefSpy = jasmine.createSpyObj('dialogRef', { afterClosed: of(true) });
      mockDialog.open.and.returnValue(dialogRefSpy);
      mockDeleteUnitService.deleteUnit.and.returnValue(of({
        success: true, message: 'Deleted', statusCode: 200
      }));

      const componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      component.onDelete();
      tick();
      flush();

      expect(componentSnackBar.open).toHaveBeenCalledWith(
        'Unit deleted in lab system successfully.', 'DISMISS',
        jasmine.objectContaining({
          duration: 8000,
          panelClass: ['success-snackbar']
        })
      );
    }));

    it('should handle API failure with no error fields using fallback message', fakeAsync(() => {
      component.unitData.set(mockValidateResponse);
      component.unitFound.set(true);

      const dialogRefSpy = jasmine.createSpyObj('dialogRef', { afterClosed: of(true) });
      mockDialog.open.and.returnValue(dialogRefSpy);
      mockDeleteUnitService.deleteUnit.and.returnValue(of({
        success: false, statusCode: 200
      }));

      const componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      component.onDelete();
      tick();
      flush();

      expect(componentSnackBar.open).toHaveBeenCalledWith(
        'Failed to delete unit', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
      expect(component.deleting()).toBeFalse();
    }));

    it('should handle API failure with only error field and no errorCode', fakeAsync(() => {
      component.unitData.set(mockValidateResponse);
      component.unitFound.set(true);

      const dialogRefSpy = jasmine.createSpyObj('dialogRef', { afterClosed: of(true) });
      mockDialog.open.and.returnValue(dialogRefSpy);
      mockDeleteUnitService.deleteUnit.and.returnValue(of({
        success: false, error: 'Something went wrong', statusCode: 200
      }));

      const componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      component.onDelete();
      tick();
      flush();

      expect(componentSnackBar.open).toHaveBeenCalledWith(
        'Something went wrong', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));

    it('should handle HTTP error during deletion', fakeAsync(() => {
      component.unitData.set(mockValidateResponse);
      component.unitFound.set(true);

      const dialogRefSpy = jasmine.createSpyObj('dialogRef', { afterClosed: of(true) });
      mockDialog.open.and.returnValue(dialogRefSpy);
      mockDeleteUnitService.deleteUnit.and.returnValue(throwError(() => ({ error: { message: 'Network error' } })));

      const componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      component.onDelete();
      tick();
      flush();

      expect(component.deleting()).toBeFalse();
      expect(componentSnackBar.open).toHaveBeenCalledWith(
        'Network error', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));
  });

  describe('Navigation', () => {
    it('should navigate to laboratory-functions on cancel', () => {
      component.onCancel();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/laboratory-functions']);
    });
  });

  describe('focusSearch', () => {
    it('should reset form when focusSearch is called', () => {
      component.unitFound.set(true);
      component.unitData.set(mockValidateResponse);
      spyOn(component.unitIdField, 'clear');

      component.focusSearch();

      expect(component.unitFound()).toBeFalse();
      expect(component.unitData()).toBeNull();
      expect(component.unitIdField.clear).toHaveBeenCalled();
    });
  });

  describe('onTableSearch', () => {
    it('should set tableSearchText signal', () => {
      component.onTableSearch('test');
      expect(component.tableSearchText()).toBe('test');
    });

    it('should update tableSearchText to empty string', () => {
      component.tableSearchText.set('previous');
      component.onTableSearch('');
      expect(component.tableSearchText()).toBe('');
    });
  });

  describe('Filtered Table Data', () => {
    beforeEach(() => {
      component.tableData.set(mockValidateResponse.item.unitReferences);
    });

    it('should return all data when search text is empty', () => {
      component.tableSearchText.set('');
      expect(component.filteredTableData().length).toBe(2);
    });

    it('should filter by table name', () => {
      component.tableSearchText.set('DONATIONS');
      const filtered = component.filteredTableData();
      expect(filtered.length).toBe(1);
      expect(filtered[0].tableName).toBe('DONATIONS');
    });

    it('should return empty array when no match found', () => {
      component.tableSearchText.set('NONEXISTENT');
      expect(component.filteredTableData().length).toBe(0);
    });

    it('should be case insensitive', () => {
      component.tableSearchText.set('donations');
      expect(component.filteredTableData().length).toBe(1);
    });

    it('should trim whitespace from search text', () => {
      component.tableSearchText.set('  DONATIONS  ');
      expect(component.filteredTableData().length).toBe(1);
    });

    it('should return all data when search text is only whitespace', () => {
      component.tableSearchText.set('   ');
      expect(component.filteredTableData().length).toBe(2);
    });

    it('should match partial table names', () => {
      component.tableSearchText.set('COMP');
      const filtered = component.filteredTableData();
      expect(filtered.length).toBe(1);
      expect(filtered[0].tableName).toBe('COMPONENTS');
    });
  });

  describe('Error Message Extraction', () => {
    it('should extract error with errorCode and errorDescription nested format', fakeAsync(() => {
      const error = { error: { error: { errorCode: 'E001', errorDescription: 'Deep nested error' } } };
      mockDeleteUnitService.validateUnit.and.returnValue(throwError(() => error));
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('TEST123');

      const componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      component.onSearch();
      tick();

      expect(componentSnackBar.open).toHaveBeenCalledWith(
        'Error: E001 : Deep nested error', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));

    it('should extract error with errorResponse format', fakeAsync(() => {
      const error = { error: { errorResponse: { errorCode: 'E002', error: 'Response level error' } } };
      mockDeleteUnitService.validateUnit.and.returnValue(throwError(() => error));
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('TEST123');

      const componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      component.onSearch();
      tick();

      expect(componentSnackBar.open).toHaveBeenCalledWith(
        'Error: E002 : Response level error', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));

    it('should extract error with errorCode and message format', fakeAsync(() => {
      const error = { error: { errorCode: 'E003', message: 'Coded error message' } };
      mockDeleteUnitService.validateUnit.and.returnValue(throwError(() => error));
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('TEST123');

      const componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      component.onSearch();
      tick();

      expect(componentSnackBar.open).toHaveBeenCalledWith(
        'Error: E003 : Coded error message', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));

    it('should extract error with only error.error.message', fakeAsync(() => {
      const error = { error: { message: 'Simple error message' } };
      mockDeleteUnitService.validateUnit.and.returnValue(throwError(() => error));
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('TEST123');

      const componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      component.onSearch();
      tick();

      expect(componentSnackBar.open).toHaveBeenCalledWith(
        'Simple error message', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));

    it('should extract error with only error.message', fakeAsync(() => {
      const error = { message: 'Top level error message' };
      mockDeleteUnitService.validateUnit.and.returnValue(throwError(() => error));
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('TEST123');

      const componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      component.onSearch();
      tick();

      expect(componentSnackBar.open).toHaveBeenCalledWith(
        'Top level error message', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));

    it('should use default message when error has no recognizable structure', fakeAsync(() => {
      const error = { someUnknownProp: 'value' };
      mockDeleteUnitService.validateUnit.and.returnValue(throwError(() => error));
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('TEST123');

      const componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      component.onSearch();
      tick();

      expect(componentSnackBar.open).toHaveBeenCalledWith(
        'Unit not found. Please verify the Unit ID.', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));
  });

  describe('canDelete - additional branches', () => {
    it('should be false when loading is true', () => {
      component.unitFound.set(true);
      component.unitData.set(mockValidateResponse);
      component.loading.set(true);
      expect(component.canDelete()).toBeFalse();
    });

    it('should be false when unitFound is false', () => {
      component.unitFound.set(false);
      component.unitData.set(mockValidateResponse);
      expect(component.canDelete()).toBeFalse();
    });

    it('should be false when unitData is null', () => {
      component.unitFound.set(true);
      component.unitData.set(null);
      expect(component.canDelete()).toBeFalse();
    });

    it('should be false when item is null', () => {
      component.unitFound.set(true);
      component.unitData.set({ ...mockValidateResponse, item: null as any });
      expect(component.canDelete()).toBeFalse();
    });
  });

  describe('Table Columns', () => {
    it('should format hasRecords as Yes when true', () => {
      const hasRecordsCol = component.columns.find(c => c.key === 'hasRecords');
      expect(hasRecordsCol).toBeTruthy();
      expect(hasRecordsCol!.valueFormatter!(true)).toBe('Yes');
    });

    it('should format hasRecords as -- when false', () => {
      const hasRecordsCol = component.columns.find(c => c.key === 'hasRecords');
      expect(hasRecordsCol!.valueFormatter!(false)).toBe('--');
    });

    it('should have tableName column with 50% width', () => {
      const tableNameCol = component.columns.find(c => c.key === 'tableName');
      expect(tableNameCol).toBeTruthy();
      expect(tableNameCol!.width).toBe('50%');
      expect(tableNameCol!.sortable).toBeFalse();
    });

    it('should have hasRecords column with 50% width', () => {
      const hasRecordsCol = component.columns.find(c => c.key === 'hasRecords');
      expect(hasRecordsCol!.width).toBe('50%');
      expect(hasRecordsCol!.sortable).toBeFalse();
    });
  });

  describe('Header Configuration', () => {
    it('should have default headerConfig with empty values', () => {
      expect(component.headerConfig).toBeTruthy();
      expect(component.headerConfig.title).toBeDefined();
    });
  });
});
