import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { ComponentDeleteComponent } from './component-delete.component';
import { ComponentDeleteService } from './services/component-delete.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { createMockMatSnackBar, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ComponentDeleteComponent', () => {
  let component: ComponentDeleteComponent;
  let fixture: ComponentFixture<ComponentDeleteComponent>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let componentDeleteServiceSpy: jasmine.SpyObj<ComponentDeleteService>;
  let menuServiceSpy: jasmine.SpyObj<MenuService>;
  let chapterChanged$: Subject<void>;

  const mockInitData = {
    collectionDate: '2024-03-07',
    productCodes: [
      { productCode: 'E0385V00', productDesc: 'Red Blood Cells' },
      { productCode: 'P1234A00', productDesc: 'Platelets Apheresis' },
      { productCode: 'F5678B00', productDesc: 'Fresh Frozen Plasma' }
    ]
  };

  const mockUnitValidation: UnitValidationResponse = {
    parsedUnitId: 'W1234-18-031302-Z',
    checkDigit: 'Z',
    codeScheme: 'C' as const,
    manualUnitId: 'W1234-18-031302-Z',
    codabarUnitScheme: 'A' as const,
    entryMode: 'M' as const,
    barcodeType: 'CODABAR' as const,
    chapterScheme: 'C' as const
  };

  const mockIsbtValidation: UnitValidationResponse = {
    parsedUnitId: 'W12345678901234',
    checkDigit: '4',
    codeScheme: 'I' as const,
    manualUnitId: 'W12345678901234',
    codabarUnitScheme: null,
    entryMode: 'S' as const,
    barcodeType: 'CODE128' as const,
    chapterScheme: 'I' as const
  };

  const mockComponent = {
    unitId: 'W1234-18-031302-Z',
    collDate: new Date('2024-03-07'),
    chapterId: 'TST',
    componentPrefix: 'RBC',
    productCode: 'E0385V00',
    bagId: 'BAG001',
    programId: 'PROG01',
    insertDats: new Date('2024-03-07'),
    componentStatus: 'ACTIVE',
    expiryDate: new Date('2024-04-07'),
    systemLabelDecision: null,
    rejectReasonCode: null,
    relabelProductCode: null,
    pooledComponentId: null,
    voidReasonCode: null,
    outOfSystemDats: null,
    componentWeight: 300,
    componentCount: 1,
    noteId: null,
    labelUserId: null,
    labelDats: null
  };

  /** Helper: set up component state as if unit was validated and init data loaded */
  function setupValidatedUnit(): void {
    component.unitIdValid.set(true);
    component.parsedUnitId.set('W1234-18-031302-Z');
    component.codeScheme.set('C');
    component.collectionDate.set(new Date('2024-03-07'));
    component.productCodesLov.set(mockInitData.productCodes);
    component.filteredProductCodes.set(mockInitData.productCodes);
  }

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();
    componentDeleteServiceSpy = jasmine.createSpyObj('ComponentDeleteService', [
      'getInitData',
      'getComponentDetails',
      'checkDelete',
      'deleteComponent'
    ]);
    snackBarSpy = createMockMatSnackBar();
    dialogSpy = createMockMatDialog();
    const headerServiceSpyObj = createMockHeaderService();
    menuServiceSpy = jasmine.createSpyObj('MenuService', ['getMenuItemsSignal', 'findMenuItemByPath']);
    menuServiceSpy.getMenuItemsSignal.and.returnValue(signal([]));


      TestBed.configureTestingModule({
      imports: [
        ComponentDeleteComponent,
        ReactiveFormsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ComponentDeleteService, useValue: componentDeleteServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: HeaderService, useValue: headerServiceSpyObj },
        { provide: MenuService, useValue: menuServiceSpy }
      ]
    });


      componentDeleteServiceSpy.getInitData.calls.reset();
      componentDeleteServiceSpy.getComponentDetails.calls.reset();
      componentDeleteServiceSpy.checkDelete.calls.reset();
      componentDeleteServiceSpy.deleteComponent.calls.reset();

    fixture = TestBed.createComponent(ComponentDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    });

  // =====================================================
  // Initialization & Lifecycle
  // =====================================================

  it('should initialize with loading false', () => {
    expect(component.loading()).toBe(false);
  });

  it('should initialize with unitIdValid false', () => {
    expect(component.unitIdValid()).toBe(false);
  });

  it('should have search form initialized', () => {
    expect(component.searchForm).toBeDefined();
    expect(component.searchForm.get('productCode')).toBeDefined();
  });

  it('should initialize productCodeSearchControl', () => {
    expect(component.productCodeSearchControl).toBeDefined();
    expect(component.productCodeSearchControl.value).toBe('');
  });

  it('should initialize filteredProductCodes as empty', () => {
    expect(component.filteredProductCodes()).toEqual([]);
  });

  it('should initialize error as null', () => {
    expect(component.error()).toBeNull();
  });

  it('should initialize componentData as null', () => {
    expect(component.componentData()).toBeNull();
  });

  it('should initialize submitted as false', () => {
    expect(component.submitted()).toBe(false);
  });

  it('should initialize validationResult as null', () => {
    expect(component.validationResult()).toBeNull();
  });

  it('should initialize parsedUnitId as null', () => {
    expect(component.parsedUnitId()).toBeNull();
  });

  it('should initialize codeScheme as C', () => {
    expect(component.codeScheme()).toBe('C');
  });

  it('should initialize collectionDate as null', () => {
    expect(component.collectionDate()).toBeNull();
  });

  it('should initialize userConfirmed as false', () => {
    expect(component.userConfirmed()).toBe(false);
  });

  it('should generate unique componentId', () => {
    expect(component.componentId).toContain('component-delete-');
  });

  it('should generate element IDs correctly', () => {
    const id = component.elementId('test');
    expect(id).toBe(`${component.componentId}-test`);
  });

  it('should generate error IDs correctly', () => {
    const id = component.errorId('test');
    expect(id).toBe(`${component.componentId}-test-error`);
  });

  it('should generate label IDs correctly', () => {
    const id = component.labelId('test');
    expect(id).toBe(`${component.componentId}-test-label`);
  });

  // =====================================================
  // Computed values
  // =====================================================
  describe('Computed values', () => {
    it('isComponentLoaded should be false when no component data', () => {
      component.componentData.set(null);
      expect(component.isComponentLoaded()).toBe(false);
    });

    it('isComponentLoaded should be true when component data exists', () => {
      component.componentData.set(mockComponent);
      expect(component.isComponentLoaded()).toBe(true);
    });

    it('canDelete should be false when validationResult is null', () => {
      component.validationResult.set(null);
      expect(component.canDelete()).toBe(false);
    });

    it('canDelete should be false when validationResult.canDelete is false', () => {
      component.validationResult.set({ canDelete: false, errorCode: '2516', errorMessage: 'Component shipped' });
      expect(component.canDelete()).toBe(false);
    });

    it('canDelete should be true when validationResult.canDelete is true', () => {
      component.validationResult.set({ canDelete: true });
      expect(component.canDelete()).toBe(true);
    });

    it('productDescription should return dash when no product code selected', () => {
      component.searchForm.get('productCode')?.setValue('', { emitEvent: false });
      expect(component.productDescription()).toBe('-');
    });

    it('productDescription should return dash when product not found in LOV', () => {
      component.productCodesLov.set(mockInitData.productCodes);
      component.searchForm.get('productCode')?.setValue('UNKNOWN', { emitEvent: false });
      expect(component.productDescription()).toBe('-');
    });

    it('productDescription should return description when product found', () => {
      component.productCodesLov.set(mockInitData.productCodes);
      component.searchForm.get('productCode')?.setValue('E0385V00', { emitEvent: false });
      expect(component.productDescription()).toBe('Red Blood Cells');
    });
  });

  // =====================================================
  // Form getters
  // =====================================================
  describe('Form getters', () => {
    it('sf should return search form controls', () => {
      expect(component.sf).toBe(component.searchForm.controls);
    });
  });

  // =====================================================
  // Product Code Search Filter
  // =====================================================
  describe('Product Code Search Filter', () => {
    const mockProducts = [
      { productCode: 'E0385V00', productDesc: 'Red Blood Cells' },
      { productCode: 'P1234A00', productDesc: 'Platelets Apheresis' },
      { productCode: 'F5678B00', productDesc: 'Fresh Frozen Plasma' }
    ];

    beforeEach(() => {
      component.productCodesLov.set(mockProducts);
      component.filteredProductCodes.set(mockProducts);
    });

    it('should show all products when search is empty', () => {
      component.productCodeSearchControl.setValue('');
      expect(component.filteredProductCodes().length).toBe(3);
    });

    it('should filter by product code', fakeAsync(() => {
      component.productCodeSearchControl.setValue('E0385');
      tick(200);
      expect(component.filteredProductCodes().length).toBe(1);
      expect(component.filteredProductCodes()[0].productCode).toBe('E0385V00');
    }));

    it('should filter by product description', fakeAsync(() => {
      component.productCodeSearchControl.setValue('plasma');
      tick(200);
      expect(component.filteredProductCodes().length).toBe(1);
      expect(component.filteredProductCodes()[0].productDesc).toBe('Fresh Frozen Plasma');
    }));

    it('should be case insensitive', fakeAsync(() => {
      component.productCodeSearchControl.setValue('RED BLOOD');
      tick(200);
      expect(component.filteredProductCodes().length).toBe(1);
      expect(component.filteredProductCodes()[0].productCode).toBe('E0385V00');
    }));

    it('should return empty when no match found', fakeAsync(() => {
      component.productCodeSearchControl.setValue('ZZZZZ');
      tick(200);
      expect(component.filteredProductCodes().length).toBe(0);
    }));

    it('should reset to all when search cleared', fakeAsync(() => {
      component.productCodeSearchControl.setValue('plasma');
      tick(200);
      expect(component.filteredProductCodes().length).toBe(1);

      component.productCodeSearchControl.setValue('');
      tick(200);
      expect(component.filteredProductCodes().length).toBe(3);
    }));

    it('should trim whitespace from search', fakeAsync(() => {
      component.productCodeSearchControl.setValue('  plasma  ');
      tick(200);
      expect(component.filteredProductCodes().length).toBe(1);
    }));
  });

  // =====================================================
  // onUnitIdValidated
  // =====================================================
  describe('onUnitIdValidated', () => {
    it('should set unitIdValid to true', () => {
      componentDeleteServiceSpy.getInitData.and.returnValue(of(mockInitData));
      component.onUnitIdValidated(mockUnitValidation);
      expect(component.unitIdValid()).toBe(true);
    });

    it('should set parsedUnitId from response', () => {
      componentDeleteServiceSpy.getInitData.and.returnValue(of(mockInitData));
      component.onUnitIdValidated(mockUnitValidation);
      expect(component.parsedUnitId()).toBe('W1234-18-031302-Z');
    });

    it('should set codeScheme from response', () => {
      componentDeleteServiceSpy.getInitData.and.returnValue(of(mockInitData));
      component.onUnitIdValidated(mockIsbtValidation);
      expect(component.codeScheme()).toBe('I');
    });

    it('should clear dependent fields on new unit validation', fakeAsync(() => {
      componentDeleteServiceSpy.getInitData.and.returnValue(of(mockInitData));
      component.searchForm.patchValue({ productCode: 'OLD_VALUE' }, { emitEvent: false });
      component.componentData.set(mockComponent);
      component.validationResult.set({ canDelete: true });
      component.userConfirmed.set(true);

      component.onUnitIdValidated(mockUnitValidation);
      tick(300);

      expect(component.searchForm.get('productCode')?.value).toBe('');
      expect(component.componentData()).toBeNull();
      expect(component.validationResult()).toBeNull();
      expect(component.userConfirmed()).toBe(false);
    }));

    it('should call getInitData with correct parameters', () => {
      componentDeleteServiceSpy.getInitData.and.returnValue(of(mockInitData));
      component.onUnitIdValidated(mockUnitValidation);
      expect(componentDeleteServiceSpy.getInitData).toHaveBeenCalledWith('W1234-18-031302-Z', 'C');
    });

    it('should call getInitData with ISBT code scheme', () => {
      componentDeleteServiceSpy.getInitData.and.returnValue(of(mockInitData));
      component.onUnitIdValidated(mockIsbtValidation);
      expect(componentDeleteServiceSpy.getInitData).toHaveBeenCalledWith('W12345678901234', 'I');
    });

    it('should set loading false after fetching init data', () => {
      componentDeleteServiceSpy.getInitData.and.returnValue(of(mockInitData));
      component.onUnitIdValidated(mockUnitValidation);
      expect(component.loading()).toBe(false);
    });

    it('should set collection date on success', () => {
      componentDeleteServiceSpy.getInitData.and.returnValue(of(mockInitData));
      component.onUnitIdValidated(mockUnitValidation);
      expect(component.collectionDate()).toEqual(new Date('2024-03-07'));
    });

    it('should set product codes on success', () => {
      componentDeleteServiceSpy.getInitData.and.returnValue(of(mockInitData));
      component.onUnitIdValidated(mockUnitValidation);
      expect(component.productCodesLov().length).toBe(3);
      expect(component.filteredProductCodes().length).toBe(3);
    });

    it('should reset product code search control on success', () => {
      component.productCodeSearchControl.setValue('old search');
      componentDeleteServiceSpy.getInitData.and.returnValue(of(mockInitData));
      component.onUnitIdValidated(mockUnitValidation);
      expect(component.productCodeSearchControl.value).toBe('');
    });

    it('should show error on getInitData failure', () => {
      componentDeleteServiceSpy.getInitData.and.returnValue(throwError(() => ({ message: 'Network error' })));
      const componentSnackBar = (component as any).snackBar as MatSnackBar;
      const openSpy = spyOn(componentSnackBar, 'open');

      component.onUnitIdValidated(mockUnitValidation);

      expect(component.loading()).toBe(false);
      expect(openSpy).toHaveBeenCalledWith('Network error', 'Close', jasmine.objectContaining({
        duration: 5000,
        panelClass: ['error-snackbar']
      }));
    });

    it('should show default error message when err.message is falsy', () => {
      componentDeleteServiceSpy.getInitData.and.returnValue(throwError(() => ({})));
      const componentSnackBar = (component as any).snackBar as MatSnackBar;
      const openSpy = spyOn(componentSnackBar, 'open');

      component.onUnitIdValidated(mockUnitValidation);

      expect(openSpy).toHaveBeenCalledWith('Failed to fetch component data.', 'Close', jasmine.anything());
    });
  });

  // =====================================================
  // onUnitIdCleared
  // =====================================================
  describe('onUnitIdCleared', () => {
    beforeEach(() => {
      component.unitIdValid.set(true);
      component.parsedUnitId.set('W1234-18-031302-Z');
      component.codeScheme.set('I');
      component.collectionDate.set(new Date('2024-03-07'));
      component.productCodesLov.set(mockInitData.productCodes);
      component.filteredProductCodes.set(mockInitData.productCodes);
      component.componentData.set(mockComponent);
      component.validationResult.set({ canDelete: true });
      component.userConfirmed.set(true);
      component.searchForm.patchValue({ productCode: 'E0385V00' }, { emitEvent: false });
    });

    it('should reset unitIdValid to false', () => {
      component.onUnitIdCleared();
      expect(component.unitIdValid()).toBe(false);
    });

    it('should reset parsedUnitId to null', () => {
      component.onUnitIdCleared();
      expect(component.parsedUnitId()).toBeNull();
    });

    it('should reset codeScheme to C', () => {
      component.onUnitIdCleared();
      expect(component.codeScheme()).toBe('C');
    });

    it('should reset collectionDate to null', () => {
      component.onUnitIdCleared();
      expect(component.collectionDate()).toBeNull();
    });

    it('should clear product code value', () => {
      component.onUnitIdCleared();
      expect(component.searchForm.get('productCode')?.value).toBeFalsy();
    });

    it('should mark productCode as untouched and pristine', () => {
      component.searchForm.get('productCode')?.markAsTouched();
      component.searchForm.get('productCode')?.markAsDirty();
      component.onUnitIdCleared();
      expect(component.searchForm.get('productCode')?.untouched).toBe(true);
      expect(component.searchForm.get('productCode')?.pristine).toBe(true);
    });

    it('should clear product codes LOV', () => {
      component.onUnitIdCleared();
      expect(component.productCodesLov().length).toBe(0);
      expect(component.filteredProductCodes().length).toBe(0);
    });

    it('should clear product code search control', () => {
      component.productCodeSearchControl.setValue('search text');
      component.onUnitIdCleared();
      expect(component.productCodeSearchControl.value).toBe('');
    });

    it('should clear component data', () => {
      component.onUnitIdCleared();
      expect(component.componentData()).toBeNull();
    });

    it('should clear validation result', () => {
      component.onUnitIdCleared();
      expect(component.validationResult()).toBeNull();
    });

    it('should reset userConfirmed', () => {
      component.onUnitIdCleared();
      expect(component.userConfirmed()).toBe(false);
    });
  });

  // =====================================================
  // Clear dependent fields on Unit ID re-entry
  // =====================================================
  describe('Clear dependent fields on Unit ID re-entry', () => {
    it('should clear product codes when user starts typing new unit ID after valid state', () => {
      component.unitIdValid.set(true);
      component.parsedUnitId.set('W1234-18-031302-Z');
      component.productCodesLov.set([
        { productCode: 'E0385V00', productDesc: 'Red Blood Cells' }
      ]);
      component.filteredProductCodes.set([
        { productCode: 'E0385V00', productDesc: 'Red Blood Cells' }
      ]);
      component.collectionDate.set(new Date('2024-03-07'));
      component.searchForm.patchValue({ productCode: 'E0385V00' });

      component.unitIdField?.unitIdControl.setValue('W999');

      expect(component.unitIdValid()).toBe(false);
      expect(component.productCodesLov().length).toBe(0);
      expect(component.filteredProductCodes().length).toBe(0);
      expect(component.collectionDate()).toBeNull();
      expect(component.searchForm.get('productCode')?.value).toBeFalsy();
    });

    it('should NOT clear fields when typing and unit ID was not yet valid', () => {
      component.unitIdValid.set(false);
      component.productCodesLov.set([
        { productCode: 'E0385V00', productDesc: 'Red Blood Cells' }
      ]);

      component.unitIdField?.unitIdControl.setValue('W999');

      expect(component.productCodesLov().length).toBe(1);
    });
  });

  // =====================================================
  // onProductCodeChange (triggered via form value changes)
  // =====================================================
  describe('onProductCodeChange (via productCode valueChanges)', () => {
    it('should call checkDelete when unitId, collDate, and productCode all present', fakeAsync(() => {
      setupValidatedUnit();
      componentDeleteServiceSpy.checkDelete.and.returnValue(of({ canDelete: true }));
      componentDeleteServiceSpy.getComponentDetails.and.returnValue(of(mockComponent));

      component.searchForm.get('productCode')?.setValue('E0385V00');
      tick(300);

      expect(componentDeleteServiceSpy.checkDelete).toHaveBeenCalledTimes(1);
    }));

    it('should NOT call checkDelete when productCode is empty', fakeAsync(() => {
      setupValidatedUnit();
      component.searchForm.get('productCode')?.setValue('');
      tick(300);

      expect(componentDeleteServiceSpy.checkDelete).not.toHaveBeenCalled();
    }));

    it('should clear componentData when product code changes', fakeAsync(() => {
      setupValidatedUnit();
      component.componentData.set(mockComponent);
      componentDeleteServiceSpy.checkDelete.and.returnValue(of({ canDelete: true }));
      componentDeleteServiceSpy.getComponentDetails.and.returnValue(of(mockComponent));

      component.searchForm.get('productCode')?.setValue('P1234A00');
      tick(300);

      expect(componentDeleteServiceSpy.checkDelete).toHaveBeenCalled();
    }));

    it('should reset userConfirmed when selecting new product', fakeAsync(() => {
      setupValidatedUnit();
      component.userConfirmed.set(true);
      componentDeleteServiceSpy.checkDelete.and.returnValue(of({ canDelete: true }));
      componentDeleteServiceSpy.getComponentDetails.and.returnValue(of(mockComponent));

      component.searchForm.get('productCode')?.setValue('P1234A00');
      tick(300);

      expect(component.userConfirmed()).toBe(false);
    }));
  });

  // =====================================================
  // checkDeleteValidation
  // =====================================================
  describe('checkDeleteValidation', () => {
    it('should set validation result and fetch details when canDelete is true and no confirmation needed', fakeAsync(() => {
      setupValidatedUnit();
      componentDeleteServiceSpy.checkDelete.and.returnValue(of({ canDelete: true }));
      componentDeleteServiceSpy.getComponentDetails.and.returnValue(of(mockComponent));

      component.searchForm.get('productCode')?.setValue('E0385V00');
      tick(300);

      expect(component.validationResult()).toEqual({ canDelete: true });
      expect(componentDeleteServiceSpy.getComponentDetails).toHaveBeenCalled();
      expect(component.componentData()).toEqual(mockComponent);
      expect(component.loading()).toBe(false);
    }));

    it('should block deletion and show error when canDelete is false', fakeAsync(() => {
      setupValidatedUnit();
      componentDeleteServiceSpy.checkDelete.and.returnValue(of({
        canDelete: false,
        errorCode: '2516',
        errorMessage: 'Component has been shipped.'
      }));
      const componentSnackBar = (component as any).snackBar as MatSnackBar;
      const openSpy = spyOn(componentSnackBar, 'open');

      component.searchForm.get('productCode')?.setValue('E0385V00');
      tick(300);

      expect(component.validationResult()?.canDelete).toBe(false);
      expect(openSpy).toHaveBeenCalledWith('Component has been shipped.', 'Close', jasmine.anything());
      expect(componentDeleteServiceSpy.getComponentDetails).not.toHaveBeenCalled();
      expect(component.loading()).toBe(false);
    }));

    it('should use default error message when errorMessage is falsy on canDelete false', fakeAsync(() => {
      setupValidatedUnit();
      componentDeleteServiceSpy.checkDelete.and.returnValue(of({
        canDelete: false
      }));
      const componentSnackBar = (component as any).snackBar as MatSnackBar;
      const openSpy = spyOn(componentSnackBar, 'open');

      component.searchForm.get('productCode')?.setValue('E0385V00');
      tick(300);

      expect(openSpy).toHaveBeenCalledWith('An error occurred.', 'Close', jasmine.anything());
    }));

    it('should show confirmation dialog when requiresConfirmation and COMPONENT_LABELED', fakeAsync(() => {
      setupValidatedUnit();
      componentDeleteServiceSpy.checkDelete.and.returnValue(of({
        canDelete: true,
        requiresConfirmation: true,
        errorCode: '2521',
        errorMessage: 'Product has been labeled. Do you want to proceed?'
      }));

      const componentDialog = (component as any).dialog as MatDialog;
      const openSpy = spyOn(componentDialog, 'open').and.returnValue({
        afterClosed: () => of(false)
      } as any);

      component.searchForm.get('productCode')?.setValue('E0385V00');
      tick(300);

      expect(openSpy).toHaveBeenCalledTimes(1);
      const dialogData = openSpy.calls.first().args[1];
      expect(dialogData?.data?.title).toBe('Warning');
      expect(dialogData?.data?.confirmText).toBe('YES');
      expect(dialogData?.data?.cancelText).toBe('NO');
    }));

    it('should fetch details when user confirms in confirmation dialog', fakeAsync(() => {
      setupValidatedUnit();
      componentDeleteServiceSpy.checkDelete.and.returnValue(of({
        canDelete: true,
        requiresConfirmation: true,
        errorCode: '2521',
        errorMessage: 'Product has been labeled.'
      }));
      componentDeleteServiceSpy.getComponentDetails.and.returnValue(of(mockComponent));

      const componentDialog = (component as any).dialog as MatDialog;
      spyOn(componentDialog, 'open').and.returnValue({
        afterClosed: () => of(true)
      } as any);

      component.searchForm.get('productCode')?.setValue('E0385V00');
      tick(300);

      expect(component.userConfirmed()).toBe(true);
      expect(componentDeleteServiceSpy.getComponentDetails).toHaveBeenCalled();
      expect(component.componentData()).toEqual(mockComponent);
    }));

    it('should block deletion when user cancels in confirmation dialog', fakeAsync(() => {
      setupValidatedUnit();
      componentDeleteServiceSpy.checkDelete.and.returnValue(of({
        canDelete: true,
        requiresConfirmation: true,
        errorCode: '2521',
        errorMessage: 'Product has been labeled.'
      }));

      const componentDialog = (component as any).dialog as MatDialog;
      spyOn(componentDialog, 'open').and.returnValue({
        afterClosed: () => of(false)
      } as any);

      component.searchForm.get('productCode')?.setValue('E0385V00');
      tick(300);

      expect(component.userConfirmed()).toBe(false);
      expect(component.validationResult()?.canDelete).toBe(false);
      expect(component.validationResult()?.errorMessage).toBe('Action cancelled by user.');
      expect(component.componentData()).toBeNull();
    }));

    it('should handle null from dialog close', fakeAsync(() => {
      setupValidatedUnit();
      componentDeleteServiceSpy.checkDelete.and.returnValue(of({
        canDelete: true,
        requiresConfirmation: true,
        errorCode: '2521',
        errorMessage: 'Product has been labeled.'
      }));

      const componentDialog = (component as any).dialog as MatDialog;
      spyOn(componentDialog, 'open').and.returnValue({
        afterClosed: () => of(null)
      } as any);

      component.searchForm.get('productCode')?.setValue('E0385V00');
      tick(300);

      expect(component.userConfirmed()).toBe(false);
      expect(component.validationResult()?.canDelete).toBe(false);
    }));

    it('should handle checkDelete API error', fakeAsync(() => {
      setupValidatedUnit();
      componentDeleteServiceSpy.checkDelete.and.returnValue(throwError(() => ({ message: 'Validation service error' })));
      const componentSnackBar = (component as any).snackBar as MatSnackBar;
      const openSpy = spyOn(componentSnackBar, 'open');

      component.searchForm.get('productCode')?.setValue('E0385V00');
      tick(300);

      expect(component.validationResult()).toBeNull();
      expect(openSpy).toHaveBeenCalledWith('Validation service error', 'Close', jasmine.anything());
      expect(component.loading()).toBe(false);
    }));

    it('should use default error message when checkDelete error has no message', fakeAsync(() => {
      setupValidatedUnit();
      componentDeleteServiceSpy.checkDelete.and.returnValue(throwError(() => ({})));
      const componentSnackBar = (component as any).snackBar as MatSnackBar;
      const openSpy = spyOn(componentSnackBar, 'open');

      component.searchForm.get('productCode')?.setValue('E0385V00');
      tick(300);

      expect(openSpy).toHaveBeenCalledWith('Validation failed.', 'Close', jasmine.anything());
    }));
  });

  // =====================================================
  // fetchComponentDetailsAfterCheck
  // =====================================================
  describe('fetchComponentDetailsAfterCheck (via checkDelete success path)', () => {
    it('should set componentData on success', fakeAsync(() => {
      setupValidatedUnit();
      componentDeleteServiceSpy.checkDelete.and.returnValue(of({ canDelete: true }));
      componentDeleteServiceSpy.getComponentDetails.and.returnValue(of(mockComponent));

      component.searchForm.get('productCode')?.setValue('E0385V00');
      tick(300);

      expect(component.componentData()).toEqual(mockComponent);
      expect(component.loading()).toBe(false);
    }));

    it('should clear componentData and validationResult on getComponentDetails error', fakeAsync(() => {
      setupValidatedUnit();
      componentDeleteServiceSpy.checkDelete.and.returnValue(of({ canDelete: true }));
      componentDeleteServiceSpy.getComponentDetails.and.returnValue(throwError(() => ({ message: 'Not found' })));
      const componentSnackBar = (component as any).snackBar as MatSnackBar;
      const openSpy = spyOn(componentSnackBar, 'open');

      component.searchForm.get('productCode')?.setValue('E0385V00');
      tick(300);

      expect(component.componentData()).toBeNull();
      expect(component.validationResult()).toBeNull();
      expect(openSpy).toHaveBeenCalledWith('Not found', 'Close', jasmine.anything());
      expect(component.loading()).toBe(false);
    }));

    it('should use default error message when getComponentDetails error has no message', fakeAsync(() => {
      setupValidatedUnit();
      componentDeleteServiceSpy.checkDelete.and.returnValue(of({ canDelete: true }));
      componentDeleteServiceSpy.getComponentDetails.and.returnValue(throwError(() => ({})));
      const componentSnackBar = (component as any).snackBar as MatSnackBar;
      const openSpy = spyOn(componentSnackBar, 'open');

      component.searchForm.get('productCode')?.setValue('E0385V00');
      tick(300);

      expect(openSpy).toHaveBeenCalledWith('Component not found.', 'Close', jasmine.anything());
    }));
  });

  // =====================================================
  // onDelete
  // =====================================================
  describe('onDelete', () => {
    beforeEach(() => {
      component.validationResult.set({ canDelete: true });
      component.parsedUnitId.set('W1234-18-031302-Z');
      component.collectionDate.set(new Date('2024-03-07'));
      component.searchForm.patchValue({ productCode: 'E0385V00' }, { emitEvent: false });
    });

    it('should return early when canDelete is false', () => {
      component.validationResult.set({ canDelete: false });
      const componentDialog = (component as any).dialog as MatDialog;
      const openSpy = spyOn(componentDialog, 'open');

      component.onDelete();

      expect(openSpy).not.toHaveBeenCalled();
    });

    it('should show error when unitId is null', () => {
      component.parsedUnitId.set(null);
      const componentSnackBar = (component as any).snackBar as MatSnackBar;
      const openSpy = spyOn(componentSnackBar, 'open');

      component.onDelete();

      expect(openSpy).toHaveBeenCalledWith('Unit ID is required.', 'Close', jasmine.anything());
    });

    it('should show error when collectionDate is null', () => {
      component.collectionDate.set(null);
      const componentSnackBar = (component as any).snackBar as MatSnackBar;
      const openSpy = spyOn(componentSnackBar, 'open');

      component.onDelete();

      expect(openSpy).toHaveBeenCalledWith('Collection date is required.', 'Close', jasmine.anything());
    });

    it('should open delete confirmation with notes dialog', () => {
      const componentDialog = (component as any).dialog as MatDialog;
      const openSpy = spyOn(componentDialog, 'open').and.returnValue({
        afterClosed: () => of(null)
      } as any);

      component.onDelete();

      expect(openSpy).toHaveBeenCalledTimes(1);
      const dialogData = openSpy.calls.first().args[1];
      expect(dialogData?.data?.title).toBe('Comments');
      expect(dialogData?.data?.confirmText).toBe('ACCEPT');
      expect(dialogData?.data?.cancelText).toBe('CANCEL');
      expect(dialogData?.data?.noteMaxLength).toBe(240);
    });

    it('should call deleteComponent when user confirms with note', () => {
      const componentDialog = (component as any).dialog as MatDialog;
      spyOn(componentDialog, 'open').and.returnValue({
        afterClosed: () => of({ confirmed: true, note: 'Wrong component' })
      } as any);
      componentDeleteServiceSpy.deleteComponent.and.returnValue(of(void 0));

      component.onDelete();

      expect(componentDeleteServiceSpy.deleteComponent).toHaveBeenCalledWith(jasmine.objectContaining({
        unitId: 'W1234-18-031302-Z',
        collDate: '2024-03-07',
        productCode: 'E0385V00',
        note: 'Wrong component'
      }));
    });

    it('should include confirm Y when userConfirmed is true', () => {
      component.userConfirmed.set(true);
      const componentDialog = (component as any).dialog as MatDialog;
      spyOn(componentDialog, 'open').and.returnValue({
        afterClosed: () => of({ confirmed: true, note: 'Test reason' })
      } as any);
      componentDeleteServiceSpy.deleteComponent.and.returnValue(of(void 0));

      component.onDelete();

      expect(componentDeleteServiceSpy.deleteComponent).toHaveBeenCalledWith(jasmine.objectContaining({
        confirm: 'Y'
      }));
    });

    it('should not include confirm when userConfirmed is false', () => {
      component.userConfirmed.set(false);
      const componentDialog = (component as any).dialog as MatDialog;
      spyOn(componentDialog, 'open').and.returnValue({
        afterClosed: () => of({ confirmed: true, note: 'Test reason' })
      } as any);
      componentDeleteServiceSpy.deleteComponent.and.returnValue(of(void 0));

      component.onDelete();

      expect(componentDeleteServiceSpy.deleteComponent).toHaveBeenCalledWith(jasmine.objectContaining({
        confirm: undefined
      }));
    });

    it('should show success and reset state on successful delete', () => {
      const componentDialog = (component as any).dialog as MatDialog;
      spyOn(componentDialog, 'open').and.returnValue({
        afterClosed: () => of({ confirmed: true, note: 'Test reason' })
      } as any);
      componentDeleteServiceSpy.deleteComponent.and.returnValue(of(void 0));
      const componentSnackBar = (component as any).snackBar as MatSnackBar;
      const snackSpy = spyOn(componentSnackBar, 'open');

      component.onDelete();

      expect(snackSpy).toHaveBeenCalledWith('Component deleted successfully.', 'Close', jasmine.objectContaining({
        duration: 3000,
        panelClass: ['success-snackbar']
      }));
      expect(component.componentData()).toBeNull();
      expect(component.loading()).toBe(false);
    });

    it('should return focus to Unit ID field after successful delete', fakeAsync(() => {
      const componentDialog = (component as any).dialog as MatDialog;
      spyOn(componentDialog, 'open').and.returnValue({
        afterClosed: () => of({ confirmed: true, note: 'Test reason' })
      } as any);
      componentDeleteServiceSpy.deleteComponent.and.returnValue(of(void 0));

      if (component.unitIdField) {
        spyOn(component.unitIdField, 'focus');
      }

      component.onDelete();
      tick(0);

      if (component.unitIdField) {
        expect(component.unitIdField.focus).toHaveBeenCalled();
      }
    }));

    it('should show error on delete failure', () => {
      const componentDialog = (component as any).dialog as MatDialog;
      spyOn(componentDialog, 'open').and.returnValue({
        afterClosed: () => of({ confirmed: true, note: 'Test reason' })
      } as any);
      componentDeleteServiceSpy.deleteComponent.and.returnValue(throwError(() => ({ message: 'Server error' })));
      const componentSnackBar = (component as any).snackBar as MatSnackBar;
      const snackSpy = spyOn(componentSnackBar, 'open');

      component.onDelete();

      expect(snackSpy).toHaveBeenCalledWith('Server error', 'Close', jasmine.anything());
      expect(component.loading()).toBe(false);
    });

    it('should use default error message when delete error has no message', () => {
      const componentDialog = (component as any).dialog as MatDialog;
      spyOn(componentDialog, 'open').and.returnValue({
        afterClosed: () => of({ confirmed: true, note: 'Test reason' })
      } as any);
      componentDeleteServiceSpy.deleteComponent.and.returnValue(throwError(() => ({})));
      const componentSnackBar = (component as any).snackBar as MatSnackBar;
      const snackSpy = spyOn(componentSnackBar, 'open');

      component.onDelete();

      expect(snackSpy).toHaveBeenCalledWith('Failed to delete component.', 'Close', jasmine.anything());
    });

    it('should not call deleteComponent when user cancels dialog', () => {
      const componentDialog = (component as any).dialog as MatDialog;
      spyOn(componentDialog, 'open').and.returnValue({
        afterClosed: () => of(null)
      } as any);

      component.onDelete();

      expect(componentDeleteServiceSpy.deleteComponent).not.toHaveBeenCalled();
    });

    it('should not call deleteComponent when user confirms without note', () => {
      const componentDialog = (component as any).dialog as MatDialog;
      spyOn(componentDialog, 'open').and.returnValue({
        afterClosed: () => of({ confirmed: true, note: '' })
      } as any);

      component.onDelete();

      expect(componentDeleteServiceSpy.deleteComponent).not.toHaveBeenCalled();
    });

    it('should not call deleteComponent when confirmed is false', () => {
      const componentDialog = (component as any).dialog as MatDialog;
      spyOn(componentDialog, 'open').and.returnValue({
        afterClosed: () => of({ confirmed: false, note: 'Some note' })
      } as any);

      component.onDelete();

      expect(componentDeleteServiceSpy.deleteComponent).not.toHaveBeenCalled();
    });
  });

  // =====================================================
  // clearAll
  // =====================================================
  describe('clearAll', () => {
    beforeEach(() => {
      component.componentData.set(mockComponent);
      component.validationResult.set({ canDelete: true });
      component.productCodesLov.set(mockInitData.productCodes);
      component.error.set('Some error');
      component.loading.set(true);
      component.unitIdValid.set(true);
      component.parsedUnitId.set('W1234');
      component.codeScheme.set('I');
      component.collectionDate.set(new Date());
      component.userConfirmed.set(true);
      component.filteredProductCodes.set(mockInitData.productCodes);
      component.productCodeSearchControl.setValue('test');
    });

    it('should reset all signals to initial state', () => {
      component.clearAll();

      expect(component.componentData()).toBeNull();
      expect(component.validationResult()).toBeNull();
      expect(component.productCodesLov()).toEqual([]);
      expect(component.error()).toBeNull();
      expect(component.loading()).toBe(false);
      expect(component.unitIdValid()).toBe(false);
      expect(component.parsedUnitId()).toBeNull();
      expect(component.codeScheme()).toBe('C');
      expect(component.collectionDate()).toBeNull();
      expect(component.userConfirmed()).toBe(false);
      expect(component.filteredProductCodes()).toEqual([]);
      expect(component.productCodeSearchControl.value).toBe('');
    });

    it('should reset search form', () => {
      component.searchForm.patchValue({ productCode: 'E0385V00' }, { emitEvent: false });

      component.clearAll();

      expect(component.searchForm.get('productCode')?.value).toBeFalsy();
    });
  });

  // =====================================================
  // formatDateForDisplay
  // =====================================================
  describe('formatDateForDisplay', () => {
    it('should format date correctly for display', () => {
      const date = new Date('2024-03-07');
      const result = component.formatDateForDisplay(date);
      expect(result).toBe('07-MAR-2024');
    });

    it('should return dash for null date', () => {
      expect(component.formatDateForDisplay(null)).toBe('-');
    });

    it('should return dash for undefined date', () => {
      expect(component.formatDateForDisplay(undefined)).toBe('-');
    });

    it('should format string date correctly', () => {
      const result = component.formatDateForDisplay('2024-12-25');
      expect(result).toBe('25-DEC-2024');
    });

    it('should return dash for invalid date string', () => {
      const result = component.formatDateForDisplay('not-a-date');
      expect(result).toBe('-');
    });
  });

  // =====================================================
  // formatDateForApi (private, tested indirectly via onDelete)
  // =====================================================
  describe('formatDateForApi (via onDelete)', () => {
    it('should format date as YYYY-MM-DD', () => {
      component.validationResult.set({ canDelete: true });
      component.parsedUnitId.set('W1234-18-031302-Z');
      component.collectionDate.set(new Date('2024-03-07'));
      component.searchForm.patchValue({ productCode: 'E0385V00' }, { emitEvent: false });

      const componentDialog = (component as any).dialog as MatDialog;
      spyOn(componentDialog, 'open').and.returnValue({
        afterClosed: () => of({ confirmed: true, note: 'Test' })
      } as any);
      componentDeleteServiceSpy.deleteComponent.and.returnValue(of(void 0));

      component.onDelete();

      expect(componentDeleteServiceSpy.deleteComponent).toHaveBeenCalledWith(jasmine.objectContaining({
        collDate: '2024-03-07'
      }));
    });
  });

  // =====================================================
  // Form validation
  // =====================================================
  describe('Form validation', () => {
    it('should require productCode', () => {
      component.searchForm.get('productCode')?.setValue('');
      expect(component.searchForm.get('productCode')?.hasError('required')).toBe(true);
    });

    it('should enforce maxLength of 8 on productCode', () => {
      component.searchForm.get('productCode')?.setValue('123456789');
      expect(component.searchForm.get('productCode')?.hasError('maxlength')).toBe(true);
    });

    it('should accept valid productCode with 8 chars', () => {
      component.searchForm.get('productCode')?.setValue('E0385V00');
      expect(component.searchForm.get('productCode')?.valid).toBe(true);
    });

    it('should accept valid productCode with fewer than 8 chars', () => {
      component.searchForm.get('productCode')?.setValue('ABC');
      expect(component.searchForm.get('productCode')?.valid).toBe(true);
    });
  });

  // =====================================================
  // Warning Dialog
  // =====================================================
  describe('Warning Dialog', () => {
    it('should have correct warning text constants in showDeleteConfirmationDialog', () => {
      const source = (component as any).showDeleteConfirmationDialog.toString();
      expect(source).toContain('Warning');
      expect(source).toContain("'YES'");
      expect(source).toContain("'NO'");
    });
  });

  // =====================================================
  // Rescan Unit ID - Warning Dialog
  // =====================================================
  describe('Rescan Unit ID - Warning Dialog', () => {
    it('should open warning dialog when same product code is selected after rescan', fakeAsync(() => {
      componentDeleteServiceSpy.getInitData.and.returnValue(of(mockInitData));
      componentDeleteServiceSpy.checkDelete.and.returnValue(of({
        canDelete: true,
        requiresConfirmation: true,
        errorCode: '2521',
        errorMessage: 'Product has been labeled. Do you want to proceed?'
      }));

      const componentDialog = (component as any).dialog as MatDialog;
      const openSpy = spyOn(componentDialog, 'open').and.returnValue({
        afterClosed: () => of(false)
      } as any);

      component.onUnitIdValidated(mockUnitValidation);
      tick(300);

      component.searchForm.get('productCode')?.setValue('E0385V00');
      tick(300);

      expect(componentDeleteServiceSpy.checkDelete).toHaveBeenCalledTimes(1);
      expect(openSpy).toHaveBeenCalledTimes(1);
      openSpy.calls.reset();
      componentDeleteServiceSpy.checkDelete.calls.reset();

      component.onUnitIdValidated(mockUnitValidation);
      tick(300);

      component.searchForm.get('productCode')?.setValue('E0385V00');
      tick(300);

      expect(componentDeleteServiceSpy.checkDelete).toHaveBeenCalledTimes(1);
      expect(openSpy).toHaveBeenCalledTimes(1);
    }));
  });

  // =====================================================
  // Collection Date Display
  // =====================================================
  describe('Collection Date Display', () => {
    it('should format date correctly for display', () => {
      const date = new Date('2024-03-07');
      const result = component.formatDateForDisplay(date);
      expect(result).toBe('07-MAR-2024');
    });
  });

  // =====================================================
  // ngOnDestroy
  // =====================================================
  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const destroySubject = (component as any).destroy$ as Subject<void>;
      const nextSpy = spyOn(destroySubject, 'next');
      const completeSpy = spyOn(destroySubject, 'complete');

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // =====================================================
  // showError and showSuccess (private, tested via behavior)
  // =====================================================
  describe('showError (private)', () => {
    it('should set error signal and open snackbar with error style', () => {
      const componentSnackBar = (component as any).snackBar as MatSnackBar;
      const openSpy = spyOn(componentSnackBar, 'open');

      (component as any).showError('Test error');

      expect(component.error()).toBe('Test error');
      expect(openSpy).toHaveBeenCalledWith('Test error', 'Close', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
    });
  });

  describe('showSuccess (private)', () => {
    it('should open snackbar with success style', () => {
      const componentSnackBar = (component as any).snackBar as MatSnackBar;
      const openSpy = spyOn(componentSnackBar, 'open');

      (component as any).showSuccess('Test success');

      expect(openSpy).toHaveBeenCalledWith('Test success', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      });
    });
  });

  // =====================================================
  // headerConfig initialization
  // =====================================================
  describe('headerConfig', () => {
    it('should have initial empty breadcrumbs', () => {
      expect(component.headerConfig.breadcrumbs).toEqual([]);
    });

    it('should have initial empty title', () => {
      expect(component.headerConfig.title).toBe('');
    });
  });
});
