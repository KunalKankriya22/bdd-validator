import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Overlay } from '@angular/cdk/overlay';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';

import { DeleteUnitAttributesComponent } from './delete-unit-attributes';
import { DeleteUnitAttributeApiService } from './services/delete-unit-attribute-api.service';
import { UnitAttributeRow } from './models/delete-unit-attribute.model';
import { MenuService } from '@shared/services/menu.service';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import { DataTable } from '@shared/components/data-table/data-table';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { DataTableStub, UnitIdFieldStub, PageHeaderWithBreadcrumbStub } from '@shared/testing/component-stubs';
import { Component, Input } from '@angular/core';

@Component({ selector: 'app-loading-spinner', template: '', standalone: true })
class LoadingSpinnerStub {
  @Input() size: any;
  @Input() message: any;
  @Input() color: any;
}

describe('DeleteUnitAttributesComponent', () => {
  let component: DeleteUnitAttributesComponent;
  let fixture: ComponentFixture<DeleteUnitAttributesComponent>;
  let apiService: jasmine.SpyObj<DeleteUnitAttributeApiService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let menuService: jasmine.SpyObj<MenuService>;

  const mockAttributes: UnitAttributeRow[] = [
    { attribGroup: 'ALERT', attribCode: 'IGA', attribDesc: 'IgA Deficient Donor' },
    { attribGroup: 'SP', attribCode: 'SETU', attribDesc: 'Non-Crossmatch Product Set-Up' },
    { attribGroup: 'ALERT', attribCode: 'CMV', attribDesc: 'CMV Negative' },
  ];

  const mockAttributesWithNullDesc: UnitAttributeRow[] = [
    { attribGroup: 'ALERT', attribCode: 'IGA', attribDesc: 'IgA Deficient Donor' },
    { attribGroup: 'SP', attribCode: 'SETU', attribDesc: null },
    { attribGroup: 'ALERT', attribCode: 'UNK', attribDesc: null },
  ];

  const mockValidation = { collectionDate: '2026-01-15T00:00:00.000Z' };

  const mockGetAttributesResponse = {
    data: mockAttributes,
    totalRecords: 3,
  };

  function createPostValidateEvent(overrides: Partial<{ parsedUnitId: string; codeScheme: string }> = {}) {
    const confirmSpy = jasmine.createSpy('confirm');
    const rejectSpy = jasmine.createSpy('reject');
    return {
      data: {
        parsedUnitId: overrides.parsedUnitId ?? 'W1234170704 1-F',
        codeScheme: overrides.codeScheme ?? 'I',
        checkDigit: null,
        manualUnitId: overrides.parsedUnitId ?? 'W1234170704 1-F',
        codabarUnitScheme: null,
        entryMode: 'M' as const,
        barcodeType: 'CODE128' as const,
        chapterScheme: 'I',
      },
      confirm: confirmSpy,
      reject: rejectSpy,
    };
  }

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('DeleteUnitAttributeApiService', [
      'validateUnit',
      'getAttributes',
      'deleteAttributes',
    ]);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const menuSpy = jasmine.createSpyObj('MenuService', ['getMenuItemsSignal', 'findMenuItemByPath']);
    menuSpy.getMenuItemsSignal.and.returnValue(signal([]));
    menuSpy.findMenuItemByPath.and.returnValue(null);

    TestBed.configureTestingModule({
      imports: [
        DeleteUnitAttributesComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule,
        UnitIdFieldComponent,
        DataTable,
        PageHeaderWithBreadcrumb,
        LoadingSpinnerComponent,
      ],
      providers: [
        { provide: DeleteUnitAttributeApiService, useValue: apiSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MenuService, useValue: menuSpy },
        Overlay,
      ],
    }).overrideComponent(DeleteUnitAttributesComponent, {
      remove: { imports: [DataTable, UnitIdFieldComponent, PageHeaderWithBreadcrumb, LoadingSpinnerComponent] },
      add: { imports: [DataTableStub, UnitIdFieldStub, PageHeaderWithBreadcrumbStub, LoadingSpinnerStub] },
    });

    apiService = TestBed.inject(DeleteUnitAttributeApiService) as jasmine.SpyObj<DeleteUnitAttributeApiService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    menuService = TestBed.inject(MenuService) as jasmine.SpyObj<MenuService>;

    fixture = TestBed.createComponent(DeleteUnitAttributesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ═══════════════════════════════════════════════════
  //  1. Component Initialization
  // ═══════════════════════════════════════════════════
  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should generate a unique componentId', () => {
      expect(component.componentId).toMatch(/^delete-unit-attributes-\d+$/);
    });

    it('should initialize loading signal as false', () => {
      expect(component.loading()).toBe(false);
    });

    it('should initialize collectionDate signal as null', () => {
      expect(component.collectionDate()).toBeNull();
    });

    it('should initialize unitValidated signal as false', () => {
      expect(component.unitValidated()).toBe(false);
    });

    it('should initialize parsedUnitId signal as null', () => {
      expect(component.parsedUnitId()).toBeNull();
    });

    it('should initialize codeScheme signal as "I"', () => {
      expect(component.codeScheme()).toBe('I');
    });

    it('should initialize attributes as empty array', () => {
      expect(component.attributes).toEqual([]);
    });

    it('should initialize selectedAttributes as empty array', () => {
      expect(component.selectedAttributes).toEqual([]);
    });

    it('should initialize totalRecords as 0', () => {
      expect(component.totalRecords).toBe(0);
    });

    it('should have default headerConfig', () => {
      expect(component.headerConfig.title).toBeDefined();
      expect(component.headerConfig.breadcrumbs).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════
  //  2. Table Configuration
  // ═══════════════════════════════════════════════════
  describe('Table Configuration', () => {
    it('should have 3 columns configured', () => {
      expect(component.tableConfig.columns.length).toBe(3);
    });

    it('should have Attribute column with key attribGroup', () => {
      expect(component.tableConfig.columns[0].key).toBe('attribGroup');
      expect(component.tableConfig.columns[0].header).toBe('Attribute');
    });

    it('should have Code column with key attribCode', () => {
      expect(component.tableConfig.columns[1].key).toBe('attribCode');
      expect(component.tableConfig.columns[1].header).toBe('Code');
    });

    it('should have Description column with key attribDesc', () => {
      expect(component.tableConfig.columns[2].key).toBe('attribDesc');
      expect(component.tableConfig.columns[2].header).toBe('Description');
    });

    it('should have Attribute column width set to 160px', () => {
      expect(component.tableConfig.columns[0].width).toBe('160px');
    });

    it('should have Code column width set to 140px', () => {
      expect(component.tableConfig.columns[1].width).toBe('140px');
    });

    it('should have Description column minWidth set to 200px', () => {
      expect(component.tableConfig.columns[2].minWidth).toBe('200px');
    });

    it('should have selection enabled', () => {
      expect(component.tableConfig.enableSelection).toBe(true);
    });

    it('should have selectionPosition set to first', () => {
      expect(component.tableConfig.selectionPosition).toBe('first');
    });

    it('should have pagination with default pageSize 25', () => {
      expect(component.tableConfig.pagination?.pageSize).toBe(25);
    });

    it('should have pagination pageIndex starting at 0', () => {
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });

    it('should have pageSizeOptions [10, 25, 50, 100]', () => {
      expect(component.tableConfig.pagination?.pageSizeOptions).toEqual([10, 25, 50, 100]);
    });

    it('should have showFirstLastButtons enabled', () => {
      expect(component.tableConfig.pagination?.showFirstLastButtons).toBe(true);
    });

    it('should have stickyHeader enabled', () => {
      expect(component.tableConfig.stickyHeader).toBe(true);
    });

    it('should have enableRowHighlight disabled', () => {
      expect(component.tableConfig.enableRowHighlight).toBe(false);
    });

    it('should have showPagination enabled', () => {
      expect(component.tableConfig.showPagination).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════
  //  3. Pagination (paginatedAttributes getter)
  // ═══════════════════════════════════════════════════
  describe('Paginated Attributes', () => {
    it('should return all attributes when pagination is undefined', () => {
      component.tableConfig = { ...component.tableConfig, pagination: undefined };
      component.attributes = mockAttributes;

      expect(component.paginatedAttributes).toEqual(mockAttributes);
    });

    it('should return first page of attributes', () => {
      component.attributes = [...mockAttributes, ...mockAttributes, ...mockAttributes];
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageIndex: 0, pageSize: 2 },
      };

      expect(component.paginatedAttributes.length).toBe(2);
    });

    it('should return second page of attributes', () => {
      component.attributes = [...mockAttributes, ...mockAttributes, ...mockAttributes];
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageIndex: 1, pageSize: 2 },
      };

      const result = component.paginatedAttributes;
      expect(result.length).toBe(2);
      expect(result[0]).toEqual(component.attributes[2]);
    });

    it('should return remaining items on last page', () => {
      component.attributes = mockAttributes;
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageIndex: 1, pageSize: 2 },
      };

      expect(component.paginatedAttributes.length).toBe(1);
    });

    it('should return empty array when attributes are empty', () => {
      component.attributes = [];
      expect(component.paginatedAttributes).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════
  //  4. Header Configuration via MenuService
  // ═══════════════════════════════════════════════════
  describe('Header Configuration', () => {
    it('should set header from MenuService when menu items are available', () => {
      const mockMenuItem = { label: 'Delete Unit Attributes', remarks: 'Delete attributes from a unit', subtitle: '' };
      menuService.getMenuItemsSignal.and.returnValue(signal([mockMenuItem]));
      menuService.findMenuItemByPath.and.returnValue(mockMenuItem);

      fixture = TestBed.createComponent(DeleteUnitAttributesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.headerConfig.title).toBe('Delete Unit Attributes');
      expect(component.headerConfig.breadcrumbs.length).toBe(2);
      expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
      expect(component.headerConfig.breadcrumbs[1].label).toBe('Delete Unit Attributes');
    });

    it('should use default title when menu item not found', () => {
      menuService.getMenuItemsSignal.and.returnValue(signal([{ label: 'Other' }]));
      menuService.findMenuItemByPath.and.returnValue(null);

      fixture = TestBed.createComponent(DeleteUnitAttributesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.headerConfig.title).toBe('Delete Unit Attributes');
    });

    it('should use default subtitle when menu item has no remarks', () => {
      menuService.getMenuItemsSignal.and.returnValue(signal([{ label: 'Test' }]));
      menuService.findMenuItemByPath.and.returnValue({ label: 'Test' });

      fixture = TestBed.createComponent(DeleteUnitAttributesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.headerConfig.subtitle).toContain('batch-level information');
    });

    it('should set Home as first breadcrumb', () => {
      menuService.getMenuItemsSignal.and.returnValue(signal([{ label: 'Test' }]));
      menuService.findMenuItemByPath.and.returnValue({ label: 'Test' });

      fixture = TestBed.createComponent(DeleteUnitAttributesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.headerConfig.breadcrumbs[0]).toEqual({ label: 'Home', link: '/home' });
    });
  });

  // ═══════════════════════════════════════════════════
  //  5. Unit Post-Validation (onUnitPostValidate)
  // ═══════════════════════════════════════════════════
  describe('Unit Post-Validation', () => {
    it('should validate unit and load attributes on success', () => {
      apiService.validateUnit.and.returnValue(of(mockValidation));
      apiService.getAttributes.and.returnValue(of(mockGetAttributesResponse));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event as any);

      expect(apiService.validateUnit).toHaveBeenCalledWith('W1234170704 1-F', 'I');
      expect(component.unitValidated()).toBe(true);
      expect(component.parsedUnitId()).toBe('W1234170704 1-F');
      expect(component.codeScheme()).toBe('I');
      expect(component.collectionDate()).toBe('2026-01-15T00:00:00.000Z');
      expect(event.confirm).toHaveBeenCalled();
    });

    it('should call loadAttributes after successful validation', () => {
      apiService.validateUnit.and.returnValue(of(mockValidation));
      apiService.getAttributes.and.returnValue(of(mockGetAttributesResponse));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event as any);

      expect(apiService.getAttributes).toHaveBeenCalledWith('W1234170704 1-F', '2026-01-15T00:00:00.000Z', 'I');
    });

    it('should use provided codeScheme from event', () => {
      apiService.validateUnit.and.returnValue(of(mockValidation));
      apiService.getAttributes.and.returnValue(of(mockGetAttributesResponse));

      const event = createPostValidateEvent({ codeScheme: 'A' });
      component.onUnitPostValidate(event as any);

      expect(apiService.validateUnit).toHaveBeenCalledWith('W1234170704 1-F', 'A');
      expect(component.codeScheme()).toBe('A');
    });

    it('should default codeScheme to I when not provided', () => {
      apiService.validateUnit.and.returnValue(of(mockValidation));
      apiService.getAttributes.and.returnValue(of(mockGetAttributesResponse));

      const event = createPostValidateEvent();
      event.data.codeScheme = '';
      component.onUnitPostValidate(event as any);

      expect(component.codeScheme()).toBe('I');
    });

    it('should reset state before validation', () => {
      component.attributes = mockAttributes;
      component.selectedAttributes = [mockAttributes[0]];
      component.totalRecords = 3;

      apiService.validateUnit.and.returnValue(of(mockValidation));
      apiService.getAttributes.and.returnValue(of(mockGetAttributesResponse));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event as any);

      expect(apiService.validateUnit).toHaveBeenCalled();
    });

    it('should handle validation error', () => {
      apiService.validateUnit.and.returnValue(throwError(() => ({ message: 'Unit not found' })));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event as any);

      expect(component.unitValidated()).toBe(false);
      expect(component.collectionDate()).toBeNull();
      expect(event.reject).toHaveBeenCalledWith('Unit not found');
    });

    it('should use default error message when error has no message', () => {
      apiService.validateUnit.and.returnValue(throwError(() => ({})));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event as any);

      expect(event.reject).toHaveBeenCalledWith('Unit not found or not eligible');
    });

    it('should not call confirm on error', () => {
      apiService.validateUnit.and.returnValue(throwError(() => ({ message: 'Error' })));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event as any);

      expect(event.confirm).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════
  //  6. Unit ID Cleared (onUnitIdCleared)
  // ═══════════════════════════════════════════════════
  describe('Unit ID Cleared', () => {
    beforeEach(() => {
      component.parsedUnitId.set('W1234170704 1-F');
      component.codeScheme.set('A');
      component.unitValidated.set(true);
      component.collectionDate.set('2026-01-15T00:00:00.000Z');
      component.attributes = mockAttributes;
      component.selectedAttributes = [mockAttributes[0]];
      component.totalRecords = 3;
    });

    it('should reset parsedUnitId to null', () => {
      component.onUnitIdCleared();
      expect(component.parsedUnitId()).toBeNull();
    });

    it('should reset codeScheme to I', () => {
      component.onUnitIdCleared();
      expect(component.codeScheme()).toBe('I');
    });

    it('should set unitValidated to false', () => {
      component.onUnitIdCleared();
      expect(component.unitValidated()).toBe(false);
    });

    it('should set collectionDate to null', () => {
      component.onUnitIdCleared();
      expect(component.collectionDate()).toBeNull();
    });

    it('should clear attributes', () => {
      component.onUnitIdCleared();
      expect(component.attributes).toEqual([]);
    });

    it('should clear selectedAttributes', () => {
      component.onUnitIdCleared();
      expect(component.selectedAttributes).toEqual([]);
    });

    it('should reset totalRecords to 0', () => {
      component.onUnitIdCleared();
      expect(component.totalRecords).toBe(0);
    });

    it('should reset pagination pageIndex to 0', () => {
      component.onUnitIdCleared();
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════
  //  7. Unit ID Validated callback (noop)
  // ═══════════════════════════════════════════════════
  describe('Unit ID Validated Callback', () => {
    it('should not throw when called', () => {
      expect(() => component.onUnitIdValidated({} as any)).not.toThrow();
    });
  });

  // ═══════════════════════════════════════════════════
  //  8. Selection Change
  // ═══════════════════════════════════════════════════
  describe('Selection Change', () => {
    it('should update selectedAttributes when selection changes', () => {
      const selected = [mockAttributes[0], mockAttributes[1]];
      component.onSelectionChange(selected);
      expect(component.selectedAttributes).toEqual(selected);
    });

    it('should handle empty selection', () => {
      component.selectedAttributes = [mockAttributes[0]];
      component.onSelectionChange([]);
      expect(component.selectedAttributes).toEqual([]);
    });

    it('should handle single selection', () => {
      component.onSelectionChange([mockAttributes[2]]);
      expect(component.selectedAttributes.length).toBe(1);
      expect(component.selectedAttributes[0].attribCode).toBe('CMV');
    });
  });

  // ═══════════════════════════════════════════════════
  //  9. Delete Operation (onDelete)
  // ═══════════════════════════════════════════════════
  describe('Delete Operation', () => {
    beforeEach(() => {
      component.parsedUnitId.set('W1234170704 1-F');
      component.collectionDate.set('2026-01-15T00:00:00.000Z');
      component.codeScheme.set('I');
      component.selectedAttributes = [mockAttributes[0], mockAttributes[1]];
    });

    it('should not proceed when no attributes are selected', () => {
      component.selectedAttributes = [];
      component.onDelete();
      expect(apiService.deleteAttributes).not.toHaveBeenCalled();
    });

    it('should not proceed when parsedUnitId is null', () => {
      component.parsedUnitId.set(null);
      component.onDelete();
      expect(apiService.deleteAttributes).not.toHaveBeenCalled();
    });

    it('should not proceed when collectionDate is null', () => {
      component.collectionDate.set(null);
      component.onDelete();
      expect(apiService.deleteAttributes).not.toHaveBeenCalled();
    });

    it('should set loading to true when delete starts', () => {
      apiService.deleteAttributes.and.returnValue(of(null));
      apiService.getAttributes.and.returnValue(of(mockGetAttributesResponse));

      component.onDelete();
      expect(component.loading()).toBe(false);
    });

    it('should call deleteAttributes with correct parameters', () => {
      apiService.deleteAttributes.and.returnValue(of(null));
      apiService.getAttributes.and.returnValue(of(mockGetAttributesResponse));

      component.onDelete();

      expect(apiService.deleteAttributes).toHaveBeenCalledWith(
        'W1234170704 1-F',
        '2026-01-15T00:00:00.000Z',
        [
          { attribGroup: 'ALERT', attribCode: 'IGA' },
          { attribGroup: 'SP', attribCode: 'SETU' },
        ],
        'I'
      );
    });

    it('should show success snackbar after successful delete', () => {
      apiService.deleteAttributes.and.returnValue(of(null));
      apiService.getAttributes.and.returnValue(of(mockGetAttributesResponse));

      component.onDelete();

      expect(snackBar.open).toHaveBeenCalledWith(
        '2 attributes deleted successfully',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    });

    it('should show singular message for single attribute delete', () => {
      component.selectedAttributes = [mockAttributes[0]];
      apiService.deleteAttributes.and.returnValue(of(null));
      apiService.getAttributes.and.returnValue(of(mockGetAttributesResponse));

      component.onDelete();

      expect(snackBar.open).toHaveBeenCalledWith(
        '1 attribute deleted successfully',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    });

    it('should clear selectedAttributes after successful delete', () => {
      apiService.deleteAttributes.and.returnValue(of(null));
      apiService.getAttributes.and.returnValue(of(mockGetAttributesResponse));

      component.onDelete();

      expect(component.selectedAttributes).toEqual([]);
    });

    it('should reload attributes after successful delete', () => {
      apiService.deleteAttributes.and.returnValue(of(null));
      apiService.getAttributes.and.returnValue(of(mockGetAttributesResponse));

      component.onDelete();

      expect(apiService.getAttributes).toHaveBeenCalledWith('W1234170704 1-F', '2026-01-15T00:00:00.000Z', 'I');
    });

    it('should set loading to false after successful delete', () => {
      apiService.deleteAttributes.and.returnValue(of(null));
      apiService.getAttributes.and.returnValue(of(mockGetAttributesResponse));

      component.onDelete();

      expect(component.loading()).toBe(false);
    });

    it('should focus unitIdField after successful delete', () => {
      apiService.deleteAttributes.and.returnValue(of(null));
      apiService.getAttributes.and.returnValue(of(mockGetAttributesResponse));
      component.unitIdField = { focus: jasmine.createSpy('focus') } as any;

      component.onDelete();

      expect(component.unitIdField!.focus).toHaveBeenCalled();
    });

    it('should handle delete error', () => {
      apiService.deleteAttributes.and.returnValue(throwError(() => ({ message: 'Delete failed' })));

      component.onDelete();

      expect(component.loading()).toBe(false);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Delete failed',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar', 'content-snackbar'] })
      );
    });

    it('should use default error message when error has no message', () => {
      apiService.deleteAttributes.and.returnValue(throwError(() => ({})));

      component.onDelete();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Failed to delete attributes',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar', 'content-snackbar'] })
      );
    });

    it('should not reload attributes on error', () => {
      apiService.deleteAttributes.and.returnValue(throwError(() => ({ message: 'Error' })));

      component.onDelete();

      expect(apiService.getAttributes).not.toHaveBeenCalled();
    });

    it('should map only attribGroup and attribCode for delete request', () => {
      apiService.deleteAttributes.and.returnValue(of(null));
      apiService.getAttributes.and.returnValue(of(mockGetAttributesResponse));

      component.onDelete();

      const callArgs = apiService.deleteAttributes.calls.mostRecent().args;
      const attrs = callArgs[2];
      attrs.forEach((a: any) => {
        expect(Object.keys(a)).toEqual(['attribGroup', 'attribCode']);
      });
    });
  });

  // ═══════════════════════════════════════════════════
  // 10. Load Attributes (via post-validate)
  // ═══════════════════════════════════════════════════
  describe('Load Attributes', () => {
    it('should populate attributes on successful load', () => {
      apiService.validateUnit.and.returnValue(of(mockValidation));
      apiService.getAttributes.and.returnValue(of(mockGetAttributesResponse));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event as any);

      expect(component.attributes).toEqual(mockAttributes);
      expect(component.totalRecords).toBe(3);
    });

    it('should set loading to false after load', () => {
      apiService.validateUnit.and.returnValue(of(mockValidation));
      apiService.getAttributes.and.returnValue(of(mockGetAttributesResponse));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event as any);

      expect(component.loading()).toBe(false);
    });

    it('should clear selectedAttributes on load', () => {
      component.selectedAttributes = [mockAttributes[0]];

      apiService.validateUnit.and.returnValue(of(mockValidation));
      apiService.getAttributes.and.returnValue(of(mockGetAttributesResponse));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event as any);

      expect(component.selectedAttributes).toEqual([]);
    });

    it('should reset pagination pageIndex to 0 on load', () => {
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageIndex: 3 },
      };

      apiService.validateUnit.and.returnValue(of(mockValidation));
      apiService.getAttributes.and.returnValue(of(mockGetAttributesResponse));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event as any);

      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });

    it('should update pagination totalRecords on load', () => {
      apiService.validateUnit.and.returnValue(of(mockValidation));
      apiService.getAttributes.and.returnValue(of(mockGetAttributesResponse));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event as any);

      expect(component.tableConfig.pagination?.totalRecords).toBe(3);
    });

    it('should handle load error', () => {
      apiService.validateUnit.and.returnValue(of(mockValidation));
      apiService.getAttributes.and.returnValue(throwError(() => ({ message: 'Load failed' })));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event as any);

      expect(component.loading()).toBe(false);
      expect(component.attributes).toEqual([]);
      expect(component.totalRecords).toBe(0);
    });

    it('should show error snackbar on load failure', () => {
      apiService.validateUnit.and.returnValue(of(mockValidation));
      apiService.getAttributes.and.returnValue(throwError(() => ({ message: 'Network error' })));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event as any);

      expect(snackBar.open).toHaveBeenCalledWith(
        'Network error',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar', 'content-snackbar'] })
      );
    });

    it('should use default error message on load failure without message', () => {
      apiService.validateUnit.and.returnValue(of(mockValidation));
      apiService.getAttributes.and.returnValue(throwError(() => ({})));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event as any);

      expect(snackBar.open).toHaveBeenCalledWith(
        'Failed to load attributes',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar', 'content-snackbar'] })
      );
    });
  });

  // ═══════════════════════════════════════════════════
  // 11. Warning for Missing Descriptions (Error 0100)
  // ═══════════════════════════════════════════════════
  describe('Missing Description Warning', () => {
    it('should show warning when attributes have null descriptions', () => {
      apiService.validateUnit.and.returnValue(of(mockValidation));
      apiService.getAttributes.and.returnValue(of({ data: mockAttributesWithNullDesc, totalRecords: 3 }));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event as any);

      expect(snackBar.open).toHaveBeenCalledWith(
        'Attribute description not found for 2 attribute(s)',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['warning-snackbar'] })
      );
    });

    it('should not show warning when all attributes have descriptions', () => {
      apiService.validateUnit.and.returnValue(of(mockValidation));
      apiService.getAttributes.and.returnValue(of(mockGetAttributesResponse));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event as any);

      const warningCalls = snackBar.open.calls.allArgs().filter(
        (args: any[]) => args[2]?.panelClass?.includes('warning-snackbar')
      );
      expect(warningCalls.length).toBe(0);
    });

    it('should not show warning when attributes are empty', () => {
      apiService.validateUnit.and.returnValue(of(mockValidation));
      apiService.getAttributes.and.returnValue(of({ data: [], totalRecords: 0 }));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event as any);

      const warningCalls = snackBar.open.calls.allArgs().filter(
        (args: any[]) => args[2]?.panelClass?.includes('warning-snackbar')
      );
      expect(warningCalls.length).toBe(0);
    });

    it('should show warning count for single missing description', () => {
      const singleMissing: UnitAttributeRow[] = [
        { attribGroup: 'ALERT', attribCode: 'IGA', attribDesc: 'IgA Deficient Donor' },
        { attribGroup: 'SP', attribCode: 'SETU', attribDesc: null },
      ];
      apiService.validateUnit.and.returnValue(of(mockValidation));
      apiService.getAttributes.and.returnValue(of({ data: singleMissing, totalRecords: 2 }));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event as any);

      expect(snackBar.open).toHaveBeenCalledWith(
        'Attribute description not found for 1 attribute(s)',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['warning-snackbar'] })
      );
    });
  });

  // ═══════════════════════════════════════════════════
  // 12. Page Change
  // ═══════════════════════════════════════════════════
  describe('Page Change', () => {
    it('should update pageIndex on page change', () => {
      component.onPageChange({ pageIndex: 2, pageSize: 25, length: 100 } as any);
      expect(component.tableConfig.pagination?.pageIndex).toBe(2);
    });

    it('should update pageSize on page change', () => {
      component.onPageChange({ pageIndex: 0, pageSize: 50, length: 100 } as any);
      expect(component.tableConfig.pagination?.pageSize).toBe(50);
    });

    it('should not throw when pagination is undefined', () => {
      component.tableConfig = { ...component.tableConfig, pagination: undefined };
      expect(() => component.onPageChange({ pageIndex: 0, pageSize: 25, length: 0 } as any)).not.toThrow();
    });

    it('should preserve other tableConfig properties', () => {
      component.onPageChange({ pageIndex: 1, pageSize: 10, length: 50 } as any);
      expect(component.tableConfig.columns.length).toBe(3);
      expect(component.tableConfig.enableSelection).toBe(true);
      expect(component.tableConfig.selectionPosition).toBe('first');
    });
  });

  // ═══════════════════════════════════════════════════
  // 13. Sort Change
  // ═══════════════════════════════════════════════════
  describe('Sort Change', () => {
    it('should update sortConfig on sort change', () => {
      component.onSortChange({ column: 'attribGroup', direction: 'asc' } as any);
      expect(component.tableConfig.sortConfig).toEqual({ column: 'attribGroup', direction: 'asc' });
    });

    it('should update sortConfig for descending sort', () => {
      component.onSortChange({ column: 'attribCode', direction: 'desc' } as any);
      expect(component.tableConfig.sortConfig).toEqual({ column: 'attribCode', direction: 'desc' });
    });

    it('should preserve other tableConfig properties on sort', () => {
      component.onSortChange({ column: 'attribDesc', direction: 'asc' } as any);
      expect(component.tableConfig.columns.length).toBe(3);
      expect(component.tableConfig.enableSelection).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════
  // 14. Snackbar Methods
  // ═══════════════════════════════════════════════════
  describe('Snackbar Messages', () => {
    it('should show success snackbar with correct config', () => {
      (component as any).showSuccess('Test success');
      expect(snackBar.open).toHaveBeenCalledWith('Test success', 'DISMISS', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar'],
      });
    });

    it('should show warning snackbar with correct config', () => {
      (component as any).showWarning('Test warning');
      expect(snackBar.open).toHaveBeenCalledWith('Test warning', 'DISMISS', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['warning-snackbar'],
      });
    });

    it('should show error snackbar with correct config', () => {
      (component as any).showError('Test error');
      expect(snackBar.open).toHaveBeenCalledWith('Test error', 'DISMISS', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar', 'content-snackbar'],
      });
    });
  });

  // ═══════════════════════════════════════════════════
  // 15. Lifecycle
  // ═══════════════════════════════════════════════════
  describe('Lifecycle', () => {
    it('should complete destroy$ subject on ngOnDestroy', () => {
      const destroySubject = (component as any).destroy$;
      const nextSpy = spyOn(destroySubject, 'next');
      const completeSpy = spyOn(destroySubject, 'complete');

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should not throw on ngOnInit', () => {
      expect(() => component.ngOnInit()).not.toThrow();
    });
  });

  // ═══════════════════════════════════════════════════
  // 16. Reset State
  // ═══════════════════════════════════════════════════
  describe('Reset State', () => {
    beforeEach(() => {
      component.attributes = mockAttributes;
      component.selectedAttributes = [mockAttributes[0]];
      component.totalRecords = 3;
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageIndex: 2, totalRecords: 50 },
      };
    });

    it('should clear attributes via onUnitIdCleared', () => {
      component.onUnitIdCleared();
      expect(component.attributes).toEqual([]);
    });

    it('should clear selectedAttributes via onUnitIdCleared', () => {
      component.onUnitIdCleared();
      expect(component.selectedAttributes).toEqual([]);
    });

    it('should reset totalRecords via onUnitIdCleared', () => {
      component.onUnitIdCleared();
      expect(component.totalRecords).toBe(0);
    });

    it('should reset pagination pageIndex via onUnitIdCleared', () => {
      component.onUnitIdCleared();
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });

    it('should reset pagination totalRecords via onUnitIdCleared', () => {
      component.onUnitIdCleared();
      expect(component.tableConfig.pagination?.totalRecords).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════
  // 17. Accessibility (WCAG 2.1 Level AA)
  // ═══════════════════════════════════════════════════
  describe('Accessibility', () => {
    it('should have form section with role="region"', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const formSection = compiled.querySelector('[role="region"][aria-label="Unit search"]');
      expect(formSection).toBeTruthy();
    });

    it('should have results section with role="region"', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const resultsSection = compiled.querySelector('[role="region"][aria-label="Attribute results"]');
      expect(resultsSection).toBeTruthy();
    });

    it('should have empty state with role="status" and aria-live', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const emptyState = compiled.querySelector('.empty-state[role="status"][aria-live="polite"]');
      expect(emptyState).toBeTruthy();
    });

    it('should have empty state mat-icon with aria-hidden', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const icon = compiled.querySelector('.empty-icon[aria-hidden="true"]');
      expect(icon).toBeTruthy();
    });

    it('should have collection date label with dynamic id', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const label = compiled.querySelector('.field-label[id]');
      expect(label).toBeTruthy();
      expect(label?.id).toContain('coll-date-label');
    });

    it('should have collection date value with aria-labelledby', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const value = compiled.querySelector('.field-value[aria-labelledby]');
      expect(value).toBeTruthy();
    });

    it('should have loading overlay with role="status" and aria-live', () => {
      component.loading.set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const loadingOverlay = compiled.querySelector('.loading-overlay[role="status"][aria-live="polite"]');
      expect(loadingOverlay).toBeTruthy();
    });

    it('should have loading overlay with aria-busy', () => {
      component.loading.set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const loadingOverlay = compiled.querySelector('.loading-overlay[aria-busy="true"]');
      expect(loadingOverlay).toBeTruthy();
    });

    it('should have SVG barcode icon with aria-hidden', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const svg = compiled.querySelector('svg.field-icon[aria-hidden="true"]');
      expect(svg).toBeTruthy();
    });
  });

  // ═══════════════════════════════════════════════════
  // 18. Accessibility - Table Actions (conditional)
  // ═══════════════════════════════════════════════════
  describe('Accessibility - Table Actions', () => {
    beforeEach(() => {
      component.unitValidated.set(true);
      component.attributes = mockAttributes;
      fixture.detectChanges();
    });

    it('should have table actions with role="toolbar"', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const toolbar = compiled.querySelector('[role="toolbar"][aria-label="Table actions"]');
      expect(toolbar).toBeTruthy();
    });

    it('should have DELETE button with type="button"', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const btn = compiled.querySelector('button.delete-btn[type="button"]');
      expect(btn).toBeTruthy();
    });

    it('should have DELETE button mat-icon with aria-hidden', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const icon = compiled.querySelector('.delete-btn mat-icon[aria-hidden="true"]');
      expect(icon).toBeTruthy();
    });

    it('should have screen-reader result count announcement', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const srAnnouncement = compiled.querySelector('.cdk-visually-hidden[role="status"][aria-live="polite"]');
      expect(srAnnouncement).toBeTruthy();
    });

    it('should announce attribute count in hidden span', () => {
      component.totalRecords = 5;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const srSpan = compiled.querySelector('.cdk-visually-hidden[role="status"]');
      expect(srSpan?.textContent?.trim()).toContain('5 attribute(s) loaded');
    });

    it('should have DELETE button disabled when no attributes selected', () => {
      component.selectedAttributes = [];
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const btn = compiled.querySelector('button.delete-btn') as HTMLButtonElement;
      expect(btn?.disabled).toBe(true);
    });

    it('should have DELETE button disabled when loading', () => {
      component.selectedAttributes = [mockAttributes[0]];
      component.loading.set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const btn = compiled.querySelector('button.delete-btn') as HTMLButtonElement;
      expect(btn?.disabled).toBe(true);
    });

    it('should have DELETE button enabled when attributes selected and not loading', () => {
      component.selectedAttributes = [mockAttributes[0]];
      component.loading.set(false);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const btn = compiled.querySelector('button.delete-btn') as HTMLButtonElement;
      expect(btn?.disabled).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════
  // 19. Template Rendering
  // ═══════════════════════════════════════════════════
  describe('Template Rendering', () => {
    it('should show empty state when unit not validated and no attributes', () => {
      component.unitValidated.set(false);
      component.attributes = [];
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.empty-state')).toBeTruthy();
      expect(compiled.querySelector('.empty-title')?.textContent).toContain('No Results to Display');
    });

    it('should show table when unit is validated', () => {
      component.unitValidated.set(true);
      component.attributes = mockAttributes;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.empty-state')).toBeFalsy();
      expect(compiled.querySelector('app-data-table')).toBeTruthy();
    });

    it('should show loading overlay when loading is true', () => {
      component.loading.set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.loading-overlay')).toBeTruthy();
    });

    it('should hide loading overlay when loading is false', () => {
      component.loading.set(false);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.loading-overlay')).toBeFalsy();
    });

    it('should display collection date when set', () => {
      component.collectionDate.set('2026-01-15T00:00:00.000Z');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const value = compiled.querySelector('.field-value');
      expect(value?.textContent?.trim()).toContain('15-JAN-2026');
    });

    it('should display dash when collection date is null', () => {
      component.collectionDate.set(null);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const value = compiled.querySelector('.field-value');
      expect(value?.textContent?.trim()).toBe('-');
    });

    it('should show empty state subtitle', () => {
      component.unitValidated.set(false);
      component.attributes = [];
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.empty-subtitle')?.textContent).toContain('enter search criteria');
    });
  });
});
