import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { Overlay } from '@angular/cdk/overlay';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';

import { RecheckProductsFromInventoryComponent } from './recheck-products-from-inventory';
import { RecheckProductsService } from './services/recheck-products.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { UnitIdPostValidateEvent } from '@shared/components/unit-id-field';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ValidateUnitResponse,
  AvailableComponent,
  ValidateComponentResponse,
  RecheckResultResponse,
  RecheckTableEntry,
} from './models/recheck-products.model';
import { TableSortEvent } from '@shared/interfaces/data-table.interface';

describe('RecheckProductsFromInventoryComponent', () => {
  let component: RecheckProductsFromInventoryComponent;
  let fixture: ComponentFixture<RecheckProductsFromInventoryComponent>;
  let serviceSpy: jasmine.SpyObj<RecheckProductsService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;

  const mockValidateResponse: ValidateUnitResponse = {
    unitId: 'W123417031601',
    collectionDate: '2023-05-20T00:00:00',
    isEligible: true,
    availableComponents: [
      { productCode: 'E0701V00', productDescription: 'Fresh Frozen Plasma CPD/XX/<=18C' },
    ],
    hasInterdictions: false,
    warnings: [],
  };

  const mockValidateComponentResponse: ValidateComponentResponse = {
    productCode: 'E0701V00',
    description: 'Fresh Frozen Plasma CPD/XX/<=18C',
    expiryDate: '2026-03-16T23:59:00',
    componentStatus: 'S',
    isEligible: true,
    warnings: [],
  };

  const mockRecheckResult: RecheckResultResponse = {
    unitId: 'W123417031601',
    productCode: 'E0701V00',
    productDescription: 'Fresh Frozen Plasma CPD/XX/<=18C',
    expiryDate: '2026-03-16T23:59:00',
    previousStatus: 'S',
    newStatus: 'L',
    recheckDate: '2026-06-17T00:00:00',
    recheckUser: 'NITOR1',
    warehouseId: 'H',
    warnings: [],
  };

  const mockUnitValidationData: UnitValidationResponse = {
    parsedUnitId: 'W123417031601',
    checkDigit: null,
    codeScheme: 'I',
    manualUnitId: 'W123417031601',
    codabarUnitScheme: null,
    entryMode: 'S',
    barcodeType: 'CODE128',
    chapterScheme: 'I',
  };

  function createPostValidateEvent(data?: Partial<UnitValidationResponse>): UnitIdPostValidateEvent {
    return {
      data: { ...mockUnitValidationData, ...data },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };
  }

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('RecheckProductsService', [
      'validateUnit',
      'getAvailableComponents',
      'validateComponent',
      'processRecheck',
    ]);

    snackbarSpy = createMockSnackbarService();

    serviceSpy.validateUnit.and.returnValue(of(mockValidateResponse));
    serviceSpy.getAvailableComponents.and.returnValue(of(mockValidateResponse.availableComponents));
    serviceSpy.validateComponent.and.returnValue(of(mockValidateComponentResponse));
    serviceSpy.processRecheck.and.returnValue(of(mockRecheckResult));

    const headerServiceMock = {
      chapterChanged$: new Subject<void>(),
      chapterTimeZone: () => 'UTC',
      getCurrentChapterId: () => 'DAL',
      getCurrentWarehouseId: () => 'H',
      chapterId: signal('DAL'),
      warehouseId: signal('H'),
    };

      TestBed.configureTestingModule({
      imports: [
        RecheckProductsFromInventoryComponent,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideHttpClient(),
        { provide: RecheckProductsService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({}),
          },
        },
        Overlay,
      ],
    });

    

      serviceSpy.validateUnit.calls.reset();

      serviceSpy.getAvailableComponents.calls.reset();

      serviceSpy.validateComponent.calls.reset();

      serviceSpy.processRecheck.calls.reset();

      serviceSpy.validateUnit.and.returnValue(of(mockValidateResponse));

      serviceSpy.getAvailableComponents.and.returnValue(of(mockValidateResponse.availableComponents));

      serviceSpy.validateComponent.and.returnValue(of(mockValidateComponentResponse));

      serviceSpy.processRecheck.and.returnValue(of(mockRecheckResult));

    fixture = TestBed.createComponent(RecheckProductsFromInventoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    });

  it('should initialize with empty form and no entries', () => {
    expect(component.searchForm).toBeDefined();
    expect(component.searchForm.get('productCode')?.value).toBe('');
    expect(component.entries()).toEqual([]);
    expect(component.entriesCount()).toBe(0);
  });

  it('should enforce maxLength(8) on productCode', () => {
    const productCodeControl = component.searchForm.get('productCode');
    productCodeControl?.setValue('123456789');
    expect(productCodeControl?.hasError('maxlength')).toBe(true);
  });

  it('should call validateUnit via onUnitPostValidate', fakeAsync(() => {
    const event = createPostValidateEvent();

    component.onUnitPostValidate(event);
    tick();

    expect(serviceSpy.validateUnit).toHaveBeenCalled();
    expect(event.confirm).toHaveBeenCalled();
  }));


  it('should add entry to table when single product auto-selects', fakeAsync(() => {
    const event = createPostValidateEvent();

    component.onUnitPostValidate(event);
    tick();

    expect(component.entries().length).toBe(1);
    expect(component.entriesCount()).toBe(1);
    expect(component.entries()[0].unitId).toBe('W123417031601');
    expect(component.entries()[0].productCode).toBe('E0701V00');
    expect(component.entries()[0].expiryDate).toBe('2026-03-16T23:59:00');
  }));

  it('should reject postValidate on validation failure', fakeAsync(() => {
    serviceSpy.validateUnit.and.returnValue(
      throwError(() => ({
        error: { errorCode: '0063', message: 'Collection date not present' },
      })),
    );

    const event = createPostValidateEvent();

    component.onUnitPostValidate(event);
    tick();

    expect(component.isProcessing()).toBeFalse();
    expect(event.reject).toHaveBeenCalled();
    expect(component.entries()).toEqual([]);
  }));

  it('should reject postValidate on already-rechecked error', fakeAsync(() => {
    serviceSpy.validateUnit.and.returnValue(
      throwError(() => ({
        error: { errorCode: '0023', message: 'Already rechecked' },
      })),
    );

    const event = createPostValidateEvent();

    component.onUnitPostValidate(event);
    tick();

    expect(component.isProcessing()).toBeFalse();
    expect(event.reject).toHaveBeenCalledWith('Product already rechecked into Blood Centers Lab.');
  }));

  it('should use mapped error message for known error codes', fakeAsync(() => {
    serviceSpy.validateUnit.and.returnValue(
      throwError(() => ({
        error: { errorCode: '9794' },
      })),
    );

    const event = createPostValidateEvent();

    component.onUnitPostValidate(event);
    tick();

    expect(event.reject).toHaveBeenCalledWith('This is a pooled product.');
  }));


  it('should clear unit-related state on onUnitCleared', () => {
    component['storedParsedUnitId'].set('W123417031601');
    component.collectionDate.set('2023-05-20T00:00:00');
    component.availableComponents.set(mockValidateResponse.availableComponents);
    component.searchForm.get('productCode')?.setValue('E0701V00');

    component.onUnitCleared();

    expect(component['storedParsedUnitId']()).toBe('');
    expect(component.collectionDate()).toBe('');
    expect(component.availableComponents()).toEqual([]);
    expect(component.searchForm.get('productCode')?.value).toBe('');
  });


  it('should store collectionDate after successful validation', fakeAsync(() => {
    const multiComponentResponse: ValidateUnitResponse = {
      ...mockValidateResponse,
      availableComponents: [
        { productCode: 'E0701V00', productDescription: 'Fresh Frozen Plasma CPD/XX/<=18C' },
        { productCode: 'RBC01', productDescription: 'Red Blood Cells' },
      ],
    };
    serviceSpy.validateUnit.and.returnValue(of(multiComponentResponse));

    const event = createPostValidateEvent();

    component.onUnitPostValidate(event);
    tick();

    expect(component.collectionDate()).toBe('2023-05-20T00:00:00');
  }));


  it('should set selectedProduct when a product code is selected', () => {
    component.availableComponents.set(mockValidateResponse.availableComponents);
    component.searchForm.get('productCode')?.setValue('E0701V00');

    expect(component.selectedProduct()).toBeTruthy();
    expect(component.selectedProduct()?.productCode).toBe('E0701V00');
    expect(component.selectedProduct()?.productDescription).toBe('Fresh Frozen Plasma CPD/XX/<=18C');
  });

  it('should clear selectedProduct when product code is cleared', () => {
    component.availableComponents.set(mockValidateResponse.availableComponents);
    component.searchForm.get('productCode')?.setValue('E0701V00');
    expect(component.selectedProduct()).toBeTruthy();

    component.searchForm.get('productCode')?.setValue('');
    expect(component.selectedProduct()).toBeNull();
  });

  it('should show interdiction warnings from validate-unit response', fakeAsync(() => {
    const responseWithInterdictions: ValidateUnitResponse = {
      ...mockValidateResponse,
      hasInterdictions: true,
      warnings: [{ code: '9791', message: 'Interdiction(s) found' }],
    };
    serviceSpy.validateUnit.and.returnValue(of(responseWithInterdictions));

    const event = createPostValidateEvent();
    component.onUnitPostValidate(event);
    tick();

    expect(snackbarSpy.showInfo).toHaveBeenCalledWith('Interdiction(s) found');
  }));

  describe('Fix 1: Timezone - formatExpirationDate uses chapter timezone', () => {
    it('should format expiration date using chapter timezone', () => {
      const result = component.formatExpirationDate('2026-03-16T23:59:00Z');
      expect(result).toMatch(/^\d{2} [A-Z]{3} \d{4} \d{2}:\d{2}$/);
    });

    it('should return empty string for empty value', () => {
      expect(component.formatExpirationDate('')).toBe('');
    });

    it('should throw for invalid date input', () => {
      expect(() => component.formatExpirationDate('not-a-date')).toThrow();
    });
  });

  describe('Fix 2: Label - input card shows Effective Date', () => {
    it('should display Effective Date label in input card when product is selected', () => {
      component.availableComponents.set(mockValidateResponse.availableComponents);
      (component as any).selectedProductCode.set('E0701V00');
      component.componentExpiryDate.set('2026-03-16T23:59:00');
      fixture.detectChanges();

      const labels = fixture.nativeElement.querySelectorAll('.field-label');
      const dateLabel = Array.from(labels).find(
        (el: any) => el.textContent.trim() === 'Expiration Date',
      );
      expect(dateLabel).toBeTruthy();
    });
  });

  describe('Fix 3: Duplicate entry prevention', () => {
    it('should prevent duplicate unit/product combination from being processed', fakeAsync(() => {
      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(component.entries().length).toBe(1);

      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20T00:00:00');
      component.searchForm.get('productCode')?.setValue('E0701V00');

      serviceSpy.validateComponent.calls.reset();
      component.processProductSelection();

      expect(serviceSpy.validateComponent).not.toHaveBeenCalled();
      expect(snackbarSpy.showError).toHaveBeenCalledWith(
        'This unit/product combination has already been processed.',
      );
    }));

    it('should allow different product code for same unit', fakeAsync(() => {
      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(component.entries().length).toBe(1);

      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20T00:00:00');
      component.searchForm.get('productCode')?.setValue('RBC01');

      serviceSpy.validateComponent.calls.reset();
      component.processProductSelection();

      expect(serviceSpy.validateComponent).toHaveBeenCalled();
    }));
  });

  describe('Fix 4: Error handling - success check and stale state', () => {
    it('should handle validateComponent returning success:false by throwing to error handler', fakeAsync(() => {
      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20T00:00:00');
      component.searchForm.get('productCode')?.setValue('E0701V00');

      serviceSpy.validateComponent.and.returnValue(
        of({ ...mockValidateComponentResponse, success: false } as any),
      );

      component.processProductSelection();
      tick();

      expect(component.isProcessing()).toBeFalse();
      expect(serviceSpy.processRecheck).not.toHaveBeenCalled();
    }));

    it('should handle processRecheck returning success:false in next handler', fakeAsync(() => {
      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20T00:00:00');
      component.searchForm.get('productCode')?.setValue('E0701V00');

      serviceSpy.processRecheck.and.returnValue(
        of({ ...mockRecheckResult, success: false } as any),
      );

      component.processProductSelection();
      tick();

      expect(component.isProcessing()).toBeFalse();
      expect(component.isTransacting()).toBeFalse();
      expect(component.componentExpiryDate()).toBeNull();
      expect(component.entries().length).toBe(0);
    }));
  });

  describe('Fix 5: chapterId in processRecheck request', () => {
    it('should include chapterId in the processRecheck request', fakeAsync(() => {
      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      const processCall = serviceSpy.processRecheck.calls.mostRecent();
      expect(processCall.args[0].chapterId).toBe('DAL');
    }));
  });

  describe('Fix 6: Clear stale componentExpiryDate on error', () => {
    it('should clear componentExpiryDate when processRecheck fails', fakeAsync(() => {
      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20T00:00:00');
      component.searchForm.get('productCode')?.setValue('E0701V00');

      serviceSpy.processRecheck.and.returnValue(
        throwError(() => ({ error: { errorCode: '0230', message: 'Transaction failed' } })),
      );

      component.processProductSelection();
      tick();

      expect(component.componentExpiryDate()).toBeNull();
      expect(component.isProcessing()).toBeFalse();
      expect(component.isTransacting()).toBeFalse();
      expect(snackbarSpy.showError).toHaveBeenCalled();
    }));

    it('should clear componentExpiryDate when validateComponent fails', fakeAsync(() => {
      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20T00:00:00');
      component.searchForm.get('productCode')?.setValue('E0701V00');

      serviceSpy.validateComponent.and.returnValue(
        throwError(() => ({ error: { errorCode: '9795', message: 'Product has already expired' } })),
      );

      component.processProductSelection();
      tick();

      expect(component.componentExpiryDate()).toBeNull();
      expect(component.isProcessing()).toBeFalse();
    }));
  });

  describe('onSortChange', () => {
    it('should update sortConfig with ascending direction', () => {
      const event: TableSortEvent = { column: 'productCode', direction: 'A' };
      component.onSortChange(event);
      expect(component.dataTableConfig.sortConfig).toEqual({ column: 'productCode', direction: 'A' });
    });

    it('should update sortConfig with descending direction', () => {
      const event: TableSortEvent = { column: 'unitId', direction: 'D' };
      component.onSortChange(event);
      expect(component.dataTableConfig.sortConfig).toEqual({ column: 'unitId', direction: 'D' });
    });

    it('should update sortConfig with default direction', () => {
      const event: TableSortEvent = { column: 'unitId', direction: 'default' };
      component.onSortChange(event);
      expect(component.dataTableConfig.sortConfig).toEqual({ column: 'unitId', direction: 'default' });
    });
  });

  describe('tableData computed sorting', () => {
    const entryA: RecheckTableEntry = { unitId: 'A001', productCode: 'PC1', productDescription: 'Desc A', expiryDate: null };
    const entryB: RecheckTableEntry = { unitId: 'B001', productCode: 'PC2', productDescription: 'Desc B', expiryDate: '2026-01-01' };

    it('should return data in original order when direction is default', () => {
      component.entries.set([entryB, entryA]);
      component.onSortChange({ column: 'unitId', direction: 'default' });
      expect(component.tableData()[0].unitId).toBe('B001');
      expect(component.tableData()[1].unitId).toBe('A001');
    });

    it('should sort ascending when direction is A', () => {
      component.entries.set([entryB, entryA]);
      component.onSortChange({ column: 'unitId', direction: 'A' });
      expect(component.tableData()[0].unitId).toBe('A001');
      expect(component.tableData()[1].unitId).toBe('B001');
    });

    it('should sort descending when direction is D', () => {
      component.entries.set([entryA, entryB]);
      component.onSortChange({ column: 'unitId', direction: 'D' });
      expect(component.tableData()[0].unitId).toBe('B001');
      expect(component.tableData()[1].unitId).toBe('A001');
    });

    it('should handle null values in sort column', () => {
      component.entries.set([entryA, entryB]);
      component.onSortChange({ column: 'expiryDate', direction: 'A' });
      const sorted = component.tableData();
      expect(sorted.length).toBe(2);
    });
  });

  describe('filteredProducts computed', () => {
    beforeEach(() => {
      component.availableComponents.set([
        { productCode: 'E0701V00', productDescription: 'Fresh Frozen Plasma' },
        { productCode: 'RBC01', productDescription: 'Red Blood Cells' },
        { productCode: 'PLT01', productDescription: 'Platelets' },
      ]);
    });

    it('should return all products when search is empty', () => {
      component.productCodeSearchControl.setValue('');
      expect(component.filteredProducts().length).toBe(3);
    });

    it('should filter by product code', () => {
      component.productCodeSearchControl.setValue('RBC');
      expect(component.filteredProducts().length).toBe(1);
      expect(component.filteredProducts()[0].productCode).toBe('RBC01');
    });

    it('should filter by product description', () => {
      component.productCodeSearchControl.setValue('Plasma');
      expect(component.filteredProducts().length).toBe(1);
      expect(component.filteredProducts()[0].productCode).toBe('E0701V00');
    });

    it('should be case insensitive', () => {
      component.productCodeSearchControl.setValue('rbc');
      expect(component.filteredProducts().length).toBe(1);
      expect(component.filteredProducts()[0].productCode).toBe('RBC01');
    });

    it('should return empty when no matches', () => {
      component.productCodeSearchControl.setValue('NONEXISTENT');
      expect(component.filteredProducts().length).toBe(0);
    });
  });

  describe('selectedProduct computed', () => {
    it('should return null when no product code is selected', () => {
      component.availableComponents.set([
        { productCode: 'E0701V00', productDescription: 'Fresh Frozen Plasma' },
      ]);
      expect(component.selectedProduct()).toBeNull();
    });

    it('should return null when selected code does not match any component', () => {
      component.availableComponents.set([
        { productCode: 'E0701V00', productDescription: 'Fresh Frozen Plasma' },
      ]);
      component.searchForm.get('productCode')?.setValue('NONEXISTENT');
      expect(component.selectedProduct()).toBeNull();
    });
  });

  describe('onProductSelected', () => {
    it('should delegate to processProductSelection', () => {
      spyOn(component, 'processProductSelection');
      component.onProductSelected();
      expect(component.processProductSelection).toHaveBeenCalled();
    });
  });

  describe('onUnitValidated', () => {
    it('should be callable without side effects', () => {
      expect(() => component.onUnitValidated(mockUnitValidationData)).not.toThrow();
    });
  });

  describe('processProductSelection additional branches', () => {
    it('should return early when product code is empty', () => {
      component.searchForm.get('productCode')?.setValue('');
      component.processProductSelection();
      expect(serviceSpy.validateComponent).not.toHaveBeenCalled();
    });

    it('should return early when product code is whitespace only', () => {
      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20');
      component.searchForm.get('productCode')?.setValue('   ');
      component.processProductSelection();
      expect(serviceSpy.validateComponent).not.toHaveBeenCalled();
    });

    it('should show error when unitId is missing', () => {
      component.searchForm.get('productCode')?.setValue('E0701V00');
      component['storedParsedUnitId'].set('');
      component.collectionDate.set('2023-05-20');
      component.processProductSelection();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Please scan a Unit ID first.');
      expect(serviceSpy.validateComponent).not.toHaveBeenCalled();
    });

    it('should show error when collectionDate is missing', () => {
      component.searchForm.get('productCode')?.setValue('E0701V00');
      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('');
      component.processProductSelection();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Please scan a Unit ID first.');
      expect(serviceSpy.validateComponent).not.toHaveBeenCalled();
    });

    it('should trim and uppercase the product code before validation', fakeAsync(() => {
      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20T00:00:00');
      component.searchForm.get('productCode')?.setValue('  e0701v00  ');

      component.processProductSelection();
      tick();

      const validateCall = serviceSpy.validateComponent.calls.mostRecent();
      expect(validateCall.args[0].productCode).toBe('E0701V00');
    }));

    it('should show warnings from successful processRecheck response', fakeAsync(() => {
      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20T00:00:00');
      component.searchForm.get('productCode')?.setValue('E0701V00');

      const resultWithWarnings: RecheckResultResponse = {
        ...mockRecheckResult,
        warnings: [
          { code: 'W1', message: 'Warning one' },
          { code: 'W2', message: 'Warning two' },
        ],
      };
      serviceSpy.processRecheck.and.returnValue(of(resultWithWarnings));

      component.processProductSelection();
      tick();

      expect(snackbarSpy.showInfo).toHaveBeenCalledWith('Warning one');
      expect(snackbarSpy.showInfo).toHaveBeenCalledWith('Warning two');
    }));

    it('should show success toast with entry count after processing', fakeAsync(() => {
      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20T00:00:00');
      component.searchForm.get('productCode')?.setValue('E0701V00');

      component.processProductSelection();
      tick();

      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('1 unit(s) validated successfully.');
    }));

    it('should set isTransacting during processRecheck call', fakeAsync(() => {
      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20T00:00:00');
      component.searchForm.get('productCode')?.setValue('E0701V00');

      let capturedIsTransacting = false;
      serviceSpy.processRecheck.and.callFake(() => {
        capturedIsTransacting = component.isTransacting();
        return of(mockRecheckResult);
      });

      component.processProductSelection();
      tick();

      expect(capturedIsTransacting).toBeTrue();
      expect(component.isTransacting()).toBeFalse();
    }));

    it('should set componentExpiryDate from validateComponent response', fakeAsync(() => {
      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20T00:00:00');
      component.searchForm.get('productCode')?.setValue('E0701V00');

      const validateResp: ValidateComponentResponse = {
        ...mockValidateComponentResponse,
        expiryDate: '2027-01-01T00:00:00',
      };
      serviceSpy.validateComponent.and.returnValue(of(validateResp));

      let capturedExpiryDate: string | null = null;
      serviceSpy.processRecheck.and.callFake(() => {
        capturedExpiryDate = component.componentExpiryDate();
        return of(mockRecheckResult);
      });

      component.processProductSelection();
      tick();

      expect(capturedExpiryDate).toBe('2027-01-01T00:00:00');
    }));

    it('should set componentExpiryDate to null when validateComponent response has no expiryDate', fakeAsync(() => {
      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20T00:00:00');
      component.searchForm.get('productCode')?.setValue('E0701V00');

      const validateResp: ValidateComponentResponse = {
        ...mockValidateComponentResponse,
        expiryDate: null,
      };
      serviceSpy.validateComponent.and.returnValue(of(validateResp));

      let capturedExpiryDate: string | null = 'should-be-null';
      serviceSpy.processRecheck.and.callFake(() => {
        capturedExpiryDate = component.componentExpiryDate();
        return of(mockRecheckResult);
      });

      component.processProductSelection();
      tick();

      expect(capturedExpiryDate).toBeNull();
    }));

    it('should prepend new entry to entries array', fakeAsync(() => {
      component.entries.set([
        { unitId: 'EXISTING', productCode: 'PC1', productDescription: 'Existing', expiryDate: null },
      ]);

      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20T00:00:00');
      component.searchForm.get('productCode')?.setValue('E0701V00');

      component.processProductSelection();
      tick();

      expect(component.entries().length).toBe(2);
      expect(component.entries()[0].unitId).toBe('W123417031601');
      expect(component.entries()[1].unitId).toBe('EXISTING');
    }));

    it('should pass chapterId in validateComponent request', fakeAsync(() => {
      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20T00:00:00');
      component.searchForm.get('productCode')?.setValue('E0701V00');

      component.processProductSelection();
      tick();

      const call = serviceSpy.validateComponent.calls.mostRecent();
      expect(call.args[0].chapterId).toBe('DAL');
    }));
  });

  describe('populateAvailableComponents', () => {
    it('should show error when zero components are returned', fakeAsync(() => {
      const emptyResponse: ValidateUnitResponse = {
        ...mockValidateResponse,
        availableComponents: [],
      };
      serviceSpy.validateUnit.and.returnValue(of(emptyResponse));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('No valid products found for this unit.');
      expect(component.isProcessing()).toBeFalse();
    }));

    it('should stop processing and open product select when multiple components returned', fakeAsync(() => {
      const multiResponse: ValidateUnitResponse = {
        ...mockValidateResponse,
        availableComponents: [
          { productCode: 'E0701V00', productDescription: 'Fresh Frozen Plasma' },
          { productCode: 'RBC01', productDescription: 'Red Blood Cells' },
        ],
      };
      serviceSpy.validateUnit.and.returnValue(of(multiResponse));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(component.availableComponents().length).toBe(2);
      expect(component.isProcessing()).toBeFalse();
      expect(event.confirm).toHaveBeenCalled();
    }));

    it('should auto-select and process when exactly one component returned', fakeAsync(() => {
      const singleResponse: ValidateUnitResponse = {
        ...mockValidateResponse,
        availableComponents: [
          { productCode: 'E0701V00', productDescription: 'Fresh Frozen Plasma CPD/XX/<=18C' },
        ],
      };
      serviceSpy.validateUnit.and.returnValue(of(singleResponse));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(component.searchForm.get('productCode')?.value).toBe('');
      expect(serviceSpy.validateComponent).toHaveBeenCalled();
      expect(component.entries().length).toBe(1);
    }));

    it('should handle null availableComponents from response', fakeAsync(() => {
      const nullResponse = {
        ...mockValidateResponse,
        availableComponents: undefined as any,
      };
      serviceSpy.validateUnit.and.returnValue(of(nullResponse));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('No valid products found for this unit.');
    }));
  });

  describe('chapter change subscription', () => {
    it('should reset all state when chapter changes', () => {
      component.entries.set([
        { unitId: 'W123', productCode: 'E0701V00', productDescription: 'Test', expiryDate: null },
      ]);
      component['storedParsedUnitId'].set('W123');
      component.collectionDate.set('2023-05-20');
      component.isProcessing.set(true);
      component.availableComponents.set([{ productCode: 'X', productDescription: 'Y' }]);

      const headerService = TestBed.inject(HeaderService) as any;
      headerService.chapterChanged$.next();

      expect(component.entries().length).toBe(0);
      expect(component['storedParsedUnitId']()).toBe('');
      expect(component.collectionDate()).toBe('');
      expect(component.isProcessing()).toBeFalse();
      expect(component.availableComponents()).toEqual([]);
    });

    it('should reset pagination on chapter change', () => {
      component.entries.set([
        { unitId: 'W123', productCode: 'E0701V00', productDescription: 'Test', expiryDate: null },
      ]);
      if (component.dataTableConfig.pagination) {
        component.dataTableConfig.pagination.pageIndex = 3;
        component.dataTableConfig.pagination.totalRecords = 50;
      }

      const headerService = TestBed.inject(HeaderService) as any;
      headerService.chapterChanged$.next();

      expect(component.dataTableConfig.pagination?.pageIndex).toBe(0);
      expect(component.dataTableConfig.pagination?.totalRecords).toBe(0);
    });
  });

  describe('formatProductDescription', () => {
    it('should return text before pipe separator', () => {
      expect(component.formatProductDescription('Fresh Frozen Plasma|Other Info')).toBe('Fresh Frozen Plasma');
    });

    it('should return full text when no pipe present', () => {
      expect(component.formatProductDescription('Fresh Frozen Plasma')).toBe('Fresh Frozen Plasma');
    });

    it('should return empty string for empty input', () => {
      expect(component.formatProductDescription('')).toBe('');
    });

    it('should trim whitespace around the result', () => {
      expect(component.formatProductDescription('  Fresh Frozen Plasma  |Other')).toBe('Fresh Frozen Plasma');
    });

    it('should handle multiple pipe characters', () => {
      expect(component.formatProductDescription('Part1|Part2|Part3')).toBe('Part1');
    });
  });

  describe('extractErrorMessage via onUnitPostValidate', () => {
    it('should return error.message when no matching error code', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(
        throwError(() => ({
          error: { message: 'Custom error message' },
        })),
      );

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Custom error message');
    }));

    it('should return errorResponse.error when available', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(
        throwError(() => ({
          error: { errorResponse: { error: 'Nested error message' } },
        })),
      );

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Nested error message');
    }));

    it('should use errorCode from errorResponse when present', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(
        throwError(() => ({
          error: { errorResponse: { errorCode: '0104' } },
        })),
      );

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Not available in inventory.');
    }));

    it('should return default message for non-object errors', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(
        throwError(() => 'simple string error'),
      );

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Error validating unit');
    }));

    it('should return default message for null error', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(
        throwError(() => null),
      );

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Error validating unit');
    }));

    it('should map errorCode 0080 to Field must be entered', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(
        throwError(() => ({ error: { errorCode: '0080' } })),
      );

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Field must be entered.');
    }));

    it('should map errorCode 0122 to No components found', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(
        throwError(() => ({ error: { errorCode: '0122' } })),
      );

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(event.reject).toHaveBeenCalledWith('No components found.');
    }));

    it('should map errorCode 1205 to Invalid product code', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(
        throwError(() => ({ error: { errorCode: '1205' } })),
      );

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Invalid product code.');
    }));

    it('should map errorCode 9797 to Multiple aliquots found', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(
        throwError(() => ({ error: { errorCode: '9797' } })),
      );

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Multiple aliquots found.');
    }));
  });

  describe('handleError via processProductSelection', () => {
    it('should show error via snackbar when processRecheck fails with known code', fakeAsync(() => {
      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20T00:00:00');
      component.searchForm.get('productCode')?.setValue('E0701V00');

      serviceSpy.processRecheck.and.returnValue(
        throwError(() => ({ error: { errorCode: '0023' } })),
      );

      component.processProductSelection();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Product already rechecked into Blood Centers Lab.');
    }));

    it('should show default error message when processRecheck fails with unknown error', fakeAsync(() => {
      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20T00:00:00');
      component.searchForm.get('productCode')?.setValue('E0701V00');

      serviceSpy.processRecheck.and.returnValue(
        throwError(() => ({})),
      );

      component.processProductSelection();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Error processing recheck');
    }));
  });

  describe('onUnitPostValidate interdiction branches', () => {
    it('should show generic interdiction message when hasInterdictions true but warnings array is empty', fakeAsync(() => {
      const response: ValidateUnitResponse = {
        ...mockValidateResponse,
        hasInterdictions: true,
        warnings: [],
      };
      serviceSpy.validateUnit.and.returnValue(of(response));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(snackbarSpy.showInfo).toHaveBeenCalledWith('Interdiction(s) found for this unit.');
    }));

    it('should not show any interdiction message when hasInterdictions is false', fakeAsync(() => {
      const response: ValidateUnitResponse = {
        ...mockValidateResponse,
        hasInterdictions: false,
        warnings: [],
      };
      serviceSpy.validateUnit.and.returnValue(of(response));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(snackbarSpy.showInfo).not.toHaveBeenCalled();
    }));

    it('should show each individual warning message when hasInterdictions with multiple warnings', fakeAsync(() => {
      const response: ValidateUnitResponse = {
        ...mockValidateResponse,
        hasInterdictions: true,
        warnings: [
          { code: 'W1', message: 'Warning 1' },
          { code: 'W2', message: 'Warning 2' },
          { code: 'W3', message: 'Warning 3' },
        ],
      };
      serviceSpy.validateUnit.and.returnValue(of(response));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(snackbarSpy.showInfo).toHaveBeenCalledTimes(3);
      expect(snackbarSpy.showInfo).toHaveBeenCalledWith('Warning 1');
      expect(snackbarSpy.showInfo).toHaveBeenCalledWith('Warning 2');
      expect(snackbarSpy.showInfo).toHaveBeenCalledWith('Warning 3');
    }));
  });

  describe('ngOnDestroy', () => {
    it('should emit and complete the destroy$ subject', () => {
      const nextSpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('clearInputsForNextScan after successful processing', () => {
    it('should reset storedParsedUnitId and collectionDate after processing', fakeAsync(() => {
      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(component.entries().length).toBe(1);
      expect(component['storedParsedUnitId']()).toBe('');
      expect(component.collectionDate()).toBe('');
      expect(component.componentExpiryDate()).toBeNull();
      expect(component.availableComponents()).toEqual([]);
    }));

    it('should reset productCode form control after processing', fakeAsync(() => {
      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      const productCodeCtrl = component.searchForm.get('productCode');
      expect(productCodeCtrl?.value).toBe('');
      expect(productCodeCtrl?.pristine).toBeTrue();
      expect(productCodeCtrl?.untouched).toBeTrue();
    }));
  });

  describe('updatePaginationTotal', () => {
    it('should update pagination totalRecords when entry is added', fakeAsync(() => {
      expect(component.dataTableConfig.pagination?.totalRecords).toBe(0);

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(component.dataTableConfig.pagination?.totalRecords).toBe(1);
    }));
  });

  describe('entriesCount computed', () => {
    it('should return 0 initially', () => {
      expect(component.entriesCount()).toBe(0);
    });

    it('should reflect entries length when entries are added', () => {
      component.entries.set([
        { unitId: 'U1', productCode: 'P1', productDescription: 'D1', expiryDate: null },
        { unitId: 'U2', productCode: 'P2', productDescription: 'D2', expiryDate: null },
      ]);
      expect(component.entriesCount()).toBe(2);
    });

    it('should update when entries are cleared', () => {
      component.entries.set([
        { unitId: 'U1', productCode: 'P1', productDescription: 'D1', expiryDate: null },
      ]);
      expect(component.entriesCount()).toBe(1);
      component.entries.set([]);
      expect(component.entriesCount()).toBe(0);
    });
  });

  describe('dataTableConfig column valueFormatters', () => {
    it('should format productDescription column via valueFormatter', () => {
      const col = component.dataTableConfig.columns.find(c => c.key === 'productDescription');
      expect(col?.valueFormatter).toBeDefined();
      expect(col!.valueFormatter!('Test Description|Extra')).toBe('Test Description');
    });

    it('should format expiryDate column via valueFormatter for empty value', () => {
      const col = component.dataTableConfig.columns.find(c => c.key === 'expiryDate');
      expect(col?.valueFormatter).toBeDefined();
      expect(col!.valueFormatter!('')).toBe('');
    });
  });

  describe('productCodeSearchControl valueChanges', () => {
    it('should update filteredProducts when search value changes', () => {
      component.availableComponents.set([
        { productCode: 'ABC123', productDescription: 'Product A' },
        { productCode: 'XYZ789', productDescription: 'Product B' },
      ]);

      component.productCodeSearchControl.setValue('ABC');
      expect(component.filteredProducts().length).toBe(1);
      expect(component.filteredProducts()[0].productCode).toBe('ABC123');
    });

    it('should handle null value from search control', () => {
      component.availableComponents.set([
        { productCode: 'ABC123', productDescription: 'Product A' },
      ]);

      component.productCodeSearchControl.setValue(null);
      expect(component.filteredProducts().length).toBe(1);
    });
  });

  describe('headerConfig initialization', () => {
    it('should have correct default breadcrumbs', () => {
      expect(component.headerConfig.breadcrumbs?.length).toBe(2);
      expect(component.headerConfig.breadcrumbs?.[0].label).toBe('Home');
      expect(component.headerConfig.breadcrumbs?.[0].link).toBe('/home');
    });

    it('should have correct default title', () => {
      expect(component.headerConfig.title).toBe('Re-Check Products from Inventory');
    });

    it('should have correct default subtitle', () => {
      expect(component.headerConfig.subtitle).toContain('Re-check inventory products');
    });
  });

  describe('dataTableConfig initialization', () => {
    it('should have 4 columns configured', () => {
      expect(component.dataTableConfig.columns.length).toBe(4);
    });

    it('should have unitId column as sortable', () => {
      const unitIdCol = component.dataTableConfig.columns.find(c => c.key === 'unitId');
      expect(unitIdCol?.sortable).toBeTrue();
    });

    it('should have productCode column as non-sortable', () => {
      const col = component.dataTableConfig.columns.find(c => c.key === 'productCode');
      expect(col?.sortable).toBeFalse();
    });

    it('should have pagination configured with default page size of 25', () => {
      expect(component.dataTableConfig.pagination?.pageSize).toBe(25);
    });

    it('should have sticky header enabled', () => {
      expect(component.dataTableConfig.stickyHeader).toBeTrue();
    });

    it('should have selection disabled', () => {
      expect(component.dataTableConfig.enableSelection).toBeFalse();
    });

    it('should have correct empty messages', () => {
      expect(component.dataTableConfig.emptyMessage).toBe('No Results to Display');
      expect(component.dataTableConfig.emptySubMessage).toBe('Scan or enter a Unit ID to begin.');
    });
  });

  describe('onUnitCleared additional assertions', () => {
    it('should reset productCodeSearchControl', () => {
      component.productCodeSearchControl.setValue('test');
      component.onUnitCleared();
      expect(component.productCodeSearchControl.value).toBe('');
    });

    it('should reset componentExpiryDate', () => {
      component.componentExpiryDate.set('2026-01-01');
      component.onUnitCleared();
      expect(component.componentExpiryDate()).toBeNull();
    });
  });

  describe('searchForm initialization', () => {
    it('should have productCode control', () => {
      expect(component.searchForm.get('productCode')).toBeTruthy();
    });

    it('should have maxLength validator on productCode', () => {
      const ctrl = component.searchForm.get('productCode');
      ctrl?.setValue('12345678');
      expect(ctrl?.valid).toBeTrue();
      ctrl?.setValue('123456789');
      expect(ctrl?.hasError('maxlength')).toBeTrue();
    });

    it('should update selectedProductCode signal when productCode value changes', () => {
      component.availableComponents.set([
        { productCode: 'TEST01', productDescription: 'Test Product' },
      ]);
      component.searchForm.get('productCode')?.setValue('TEST01');
      expect(component.selectedProduct()?.productCode).toBe('TEST01');
    });
  });

  describe('isProcessing and isTransacting signals', () => {
    it('should initialize isProcessing as false', () => {
      expect(component.isProcessing()).toBeFalse();
    });

    it('should initialize isTransacting as false', () => {
      expect(component.isTransacting()).toBeFalse();
    });

    it('should set isProcessing to true during onUnitPostValidate', fakeAsync(() => {
      let capturedIsProcessing = false;
      serviceSpy.validateUnit.and.callFake(() => {
        capturedIsProcessing = component.isProcessing();
        return of(mockValidateResponse);
      });

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(capturedIsProcessing).toBeTrue();
    }));
  });

  describe('onTablePageChange', () => {
    it('should update page index and page size', () => {
      component.onTablePageChange({ pageIndex: 2, pageSize: 50 });
      expect(component.dataTableConfig.pagination?.pageIndex).toBe(2);
      expect(component.dataTableConfig.pagination?.pageSize).toBe(50);
    });

    it('should update paginatedData based on page', () => {
      const entries: RecheckTableEntry[] = Array.from({ length: 30 }, (_, i) => ({
        unitId: `U${i}`, productCode: `P${i}`, productDescription: `D${i}`, expiryDate: null,
      }));
      component.entries.set(entries);

      component.onTablePageChange({ pageIndex: 1, pageSize: 10 });
      expect(component.paginatedData().length).toBe(10);
      expect(component.paginatedData()[0].unitId).toBe('U10');
    });
  });

  describe('showExpiredProductConfirmation dialog flow', () => {
    it('should open dialog and process with bypass when user confirms', fakeAsync(() => {
      const dialogSubject = new Subject<boolean>();
      spyOn(component['dialog'], 'open').and.returnValue({ afterClosed: () => dialogSubject.asObservable() } as any);

      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20T00:00:00');
      component.searchForm.get('productCode')?.setValue('E0701V00');

      serviceSpy.validateComponent.and.returnValue(
        throwError(() => ({
          error: { errorCode: '9795', item: { expiryDate: '2025-01-01T00:00:00' } },
        })),
      );

      component.processProductSelection();
      tick();

      expect(component['dialog'].open).toHaveBeenCalled();
      expect(component.componentExpiryDate()).toBe('2025-01-01T00:00:00');

      serviceSpy.processRecheck.and.returnValue(of(mockRecheckResult));
      dialogSubject.next(true);
      tick();

      expect(serviceSpy.processRecheck).toHaveBeenCalled();
      const call = serviceSpy.processRecheck.calls.mostRecent();
      expect(call.args[0].allowExpired).toBeTrue();
      expect(component.entries().length).toBe(1);
    }));

    it('should clear inputs when user declines expired product dialog', fakeAsync(() => {
      const dialogSubject = new Subject<boolean>();
      spyOn(component['dialog'], 'open').and.returnValue({ afterClosed: () => dialogSubject.asObservable() } as any);

      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20T00:00:00');
      component.searchForm.get('productCode')?.setValue('E0701V00');

      serviceSpy.validateComponent.and.returnValue(
        throwError(() => ({
          error: { errorCode: '9795' },
        })),
      );

      component.processProductSelection();
      tick();

      dialogSubject.next(false);
      tick(200);

      expect(serviceSpy.processRecheck).not.toHaveBeenCalled();
      expect(component['storedParsedUnitId']()).toBe('');
    }));
  });

  describe('processRecheckWithExpiredBypass error handling', () => {
    it('should handle success:false response from processRecheck with expired bypass', fakeAsync(() => {
      const dialogSubject = new Subject<boolean>();
      spyOn(component['dialog'], 'open').and.returnValue({ afterClosed: () => dialogSubject.asObservable() } as any);

      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20T00:00:00');
      component.searchForm.get('productCode')?.setValue('E0701V00');

      serviceSpy.validateComponent.and.returnValue(
        throwError(() => ({ error: { errorCode: '9795' } })),
      );

      component.processProductSelection();
      tick();

      serviceSpy.processRecheck.and.returnValue(
        of({ ...mockRecheckResult, success: false } as any),
      );
      dialogSubject.next(true);
      tick();

      expect(component.isTransacting()).toBeFalse();
      expect(snackbarSpy.showError).toHaveBeenCalled();
      expect(component.entries().length).toBe(0);
    }));

    it('should handle error from processRecheck with expired bypass', fakeAsync(() => {
      const dialogSubject = new Subject<boolean>();
      spyOn(component['dialog'], 'open').and.returnValue({ afterClosed: () => dialogSubject.asObservable() } as any);

      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20T00:00:00');
      component.searchForm.get('productCode')?.setValue('E0701V00');

      serviceSpy.validateComponent.and.returnValue(
        throwError(() => ({ error: { errorCode: '9795' } })),
      );

      component.processProductSelection();
      tick();

      serviceSpy.processRecheck.and.returnValue(
        throwError(() => ({ error: { errorCode: '0230' } })),
      );
      dialogSubject.next(true);
      tick();

      expect(component.isTransacting()).toBeFalse();
      expect(component.componentExpiryDate()).toBeNull();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Transaction failed. Please try again.');
    }));
  });

  describe('processProductSelection - empty product code shows error', () => {
    it('should show error snackbar when product code is empty', () => {
      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20T00:00:00');
      component.searchForm.get('productCode')?.setValue('');

      component.processProductSelection();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Please select a product code.');
      expect(serviceSpy.validateComponent).not.toHaveBeenCalled();
    });
  });

  describe('codeScheme and entryMode defaults', () => {
    it('should default codeScheme to C when event data has no codeScheme', fakeAsync(() => {
      const event = createPostValidateEvent({ codeScheme: undefined as any });

      component.onUnitPostValidate(event);
      tick();

      const validateCall = serviceSpy.validateComponent.calls.mostRecent();
      expect(validateCall.args[0].codeScheme).toBe('C');
    }));

    it('should default entryMode to S when event data has no entryMode', fakeAsync(() => {
      const event = createPostValidateEvent({ entryMode: undefined as any });

      component.onUnitPostValidate(event);
      tick();

      const processCall = serviceSpy.processRecheck.calls.mostRecent();
      expect(processCall.args[0].entryMode).toBe('S');
    }));
  });

  describe('validateComponent non-9795 error branch', () => {
    it('should clear componentExpiryDate and show error for non-9795 error codes', fakeAsync(() => {
      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20T00:00:00');
      component.searchForm.get('productCode')?.setValue('E0701V00');
      component.componentExpiryDate.set('2026-01-01');

      serviceSpy.validateComponent.and.returnValue(
        throwError(() => ({ error: { errorCode: '1205', message: 'Invalid product code' } })),
      );

      component.processProductSelection();
      tick();

      expect(component.componentExpiryDate()).toBeNull();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Invalid product code.');
    }));
  });

  describe('extractErrorCode branches', () => {
    it('should extract errorCode from error.error.errorCode', fakeAsync(() => {
      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20T00:00:00');
      component.searchForm.get('productCode')?.setValue('E0701V00');

      serviceSpy.validateComponent.and.returnValue(
        throwError(() => ({ error: { errorCode: '9795' } })),
      );

      spyOn(component['dialog'], 'open').and.returnValue({ afterClosed: () => of(false) } as any);

      component.processProductSelection();
      tick(200);

      expect(component['dialog'].open).toHaveBeenCalled();
    }));

    it('should extract errorCode from error.error.errorResponse.errorCode', fakeAsync(() => {
      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20T00:00:00');
      component.searchForm.get('productCode')?.setValue('E0701V00');

      serviceSpy.validateComponent.and.returnValue(
        throwError(() => ({ error: { errorResponse: { errorCode: '9795' } } })),
      );

      spyOn(component['dialog'], 'open').and.returnValue({ afterClosed: () => of(false) } as any);

      component.processProductSelection();
      tick(200);

      expect(component['dialog'].open).toHaveBeenCalled();
    }));

    it('should return null for non-object error', fakeAsync(() => {
      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20T00:00:00');
      component.searchForm.get('productCode')?.setValue('E0701V00');

      serviceSpy.validateComponent.and.returnValue(
        throwError(() => 'string error'),
      );

      component.processProductSelection();
      tick();

      expect(component.componentExpiryDate()).toBeNull();
      expect(snackbarSpy.showError).toHaveBeenCalled();
    }));
  });

  describe('handleRecheckSuccess with no warnings', () => {
    it('should not call showInfo when response has null warnings', fakeAsync(() => {
      component['storedParsedUnitId'].set('W123417031601');
      component.collectionDate.set('2023-05-20T00:00:00');
      component.searchForm.get('productCode')?.setValue('E0701V00');

      const resultNoWarnings: RecheckResultResponse = {
        ...mockRecheckResult,
        warnings: null as any,
      };
      serviceSpy.processRecheck.and.returnValue(of(resultNoWarnings));

      component.processProductSelection();
      tick();

      expect(snackbarSpy.showInfo).not.toHaveBeenCalled();
      expect(component.entries().length).toBe(1);
    }));
  });

  describe('pagination without config', () => {
    it('should handle missing sortConfig gracefully', () => {
      component.dataTableConfig.sortConfig = undefined;
      expect(() => component.onSortChange({ column: 'unitId', direction: 'A' })).not.toThrow();
    });
  });
});
