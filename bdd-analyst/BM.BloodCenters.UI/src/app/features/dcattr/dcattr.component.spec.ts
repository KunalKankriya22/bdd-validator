import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { signal } from '@angular/core';
import { DcattrComponent } from './dcattr.component';
import { DcattrService } from './dcattr.service';
import { MenuService } from '@shared/services/menu.service';
import { UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';
import { createMockMatSnackBar, createMockMatDialog } from '@shared/testing/common-mocks';
import { DeletableAttributeDto, ProductCodeDto, DeletedEntry } from './dcattr.models';

describe('DcattrComponent', () => {
  let component: DcattrComponent;
  let fixture: ComponentFixture<DcattrComponent>;
  let dcattrServiceSpy: jasmine.SpyObj<DcattrService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let defaultDialogRef: jasmine.SpyObj<MatDialogRef<any>>;
  let menuServiceSpy: jasmine.SpyObj<MenuService>;

  // ---- helpers ----
  function makeProductCode(overrides: Partial<ProductCodeDto> = {}): ProductCodeDto {
    return {
      productCode: 'RBC001',
      productShortName: 'Red Blood Cells',
      productType: 'WB',
      ...overrides
    };
  }

  function makeAttribute(overrides: Partial<DeletableAttributeDto> = {}): DeletableAttributeDto {
    return {
      attribCode: 'CMV',
      attribDesc: 'CMV Negative',
      attribType: 'C',
      ...overrides
    };
  }

  function setupValidatedUnit(): void {
    component.collectionDate.set('2026-01-15T00:00:00Z');
    component.unitValidated.set(true);
    component.parsedUnitId.set('12345678901234');
  }

  function makePostValidateEvent(
    overrides: Partial<{ parsedUnitId: string; codeScheme: string }> = {}
  ): UnitIdPostValidateEvent {
    return {
      data: {
        parsedUnitId: '12345678901234',
        codeScheme: 'I',
        ...overrides
      },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject')
    } as unknown as UnitIdPostValidateEvent;
  }

  beforeEach(() => {
    dcattrServiceSpy = jasmine.createSpyObj('DcattrService', [
      'validateUnit',
      'getDeletableAttributes',
      'getProductCodes',
      'previewNewProductCode',
      'deleteAttribute',
      'getAttributeHistory',
      'reprintLabel'
    ]);
    dcattrServiceSpy.validateUnit.and.returnValue(of({ collectionDate: '2026-01-15T00:00:00Z' }));
    dcattrServiceSpy.getDeletableAttributes.and.returnValue(of([]));
    dcattrServiceSpy.getProductCodes.and.returnValue(of([]));
    dcattrServiceSpy.previewNewProductCode.and.returnValue(of({ newProductCode: '', newProductDescription: '' }));
    dcattrServiceSpy.deleteAttribute.and.returnValue(of({ newProductCode: '' }));
    dcattrServiceSpy.getAttributeHistory.and.returnValue(of([]));
    dcattrServiceSpy.reprintLabel.and.returnValue(of({}));

    snackBarSpy = createMockMatSnackBar();

    defaultDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
    defaultDialogRef.afterClosed.and.returnValue(of(false));

    dialogSpy = createMockMatDialog();
    dialogSpy.open.and.returnValue(defaultDialogRef);

    menuServiceSpy = jasmine.createSpyObj('MenuService', ['getMenuItemsSignal', 'findMenuItemByPath']);
    menuServiceSpy.getMenuItemsSignal.and.returnValue(signal([]));
    menuServiceSpy.findMenuItemByPath.and.returnValue(undefined);

    TestBed.configureTestingModule({
      imports: [DcattrComponent, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        { provide: DcattrService, useValue: dcattrServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MenuService, useValue: menuServiceSpy }
      ]
    });

    // Override at component level so the mock takes precedence over
    // the standalone component's own MatDialogModule import
    TestBed.overrideComponent(DcattrComponent, {
      add: { providers: [{ provide: MatDialog, useValue: dialogSpy }] }
    });

    fixture = TestBed.createComponent(DcattrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ──────────── Initialization ────────────

  describe('Initialization', () => {
    it('should generate unique component ID', () => {
      expect(component.componentId).toMatch(/^dcattr-\d+$/);
    });

    it('should initialize form with required validators', () => {
      expect(component.form).toBeTruthy();
      expect(component.form.get('productCode')?.hasError('required')).toBeTrue();
      expect(component.form.get('attribCode')?.hasError('required')).toBeTrue();
    });

    it('should generate unique IDs across multiple instances', () => {
      const fixture2 = TestBed.createComponent(DcattrComponent);
      const component2 = fixture2.componentInstance;
      expect(component.componentId).not.toBe(component2.componentId);
      expect(component.elementId('productCode')).not.toBe(component2.elementId('productCode'));
    });

    it('should produce element, error, and label IDs', () => {
      expect(component.elementId('test')).toContain('test');
      expect(component.errorId('test')).toContain('test-error');
      expect(component.labelId('test')).toContain('test-label');
    });
  });

  // ──────────── Computed signals ────────────

  describe('Computed signals', () => {
    it('isTypeA should return true when selectedAttribType is A', () => {
      component.selectedAttribType.set('A');
      expect(component.isTypeA()).toBeTrue();
    });

    it('isTypeA should return false when selectedAttribType is not A', () => {
      component.selectedAttribType.set('C');
      expect(component.isTypeA()).toBeFalse();
    });

    it('isReprintEnabled should return true when newProductCode set, not typeA, not verificationStarted', () => {
      component.newProductCode.set('RBC002');
      component.selectedAttribType.set('C');
      component.verificationStarted.set(false);
      expect(component.isReprintEnabled()).toBeTrue();
    });

    it('isReprintEnabled should return false when no newProductCode', () => {
      component.newProductCode.set(null);
      expect(component.isReprintEnabled()).toBeFalse();
    });

    it('isReprintEnabled should return false when type is A', () => {
      component.newProductCode.set('RBC002');
      component.selectedAttribType.set('A');
      expect(component.isReprintEnabled()).toBeFalse();
    });

    it('isReprintEnabled should return false when verification started', () => {
      component.newProductCode.set('RBC002');
      component.selectedAttribType.set('C');
      component.verificationStarted.set(true);
      expect(component.isReprintEnabled()).toBeFalse();
    });
  });

  // ──────────── paginatedEntries ────────────

  describe('paginatedEntries', () => {
    it('should return paginated slice of deletedEntries', () => {
      // Arrange
      const entries: DeletedEntry[] = Array.from({ length: 30 }, (_, i) => ({
        unitId: `U${i}`,
        productCode: 'P1',
        productDescription: 'Desc',
        attribCode: 'A1',
        attribDescription: 'Attr',
        newProductCode: 'P2',
        newProductDescription: 'New',
        verifyProduct: 'P2'
      }));
      component.deletedEntries = entries;
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageIndex: 0, pageSize: 10 }
      };

      // Act
      const result = component.paginatedEntries;

      // Assert
      expect(result.length).toBe(10);
      expect(result[0].unitId).toBe('U0');
    });

    it('should return second page correctly', () => {
      // Arrange
      const entries: DeletedEntry[] = Array.from({ length: 30 }, (_, i) => ({
        unitId: `U${i}`,
        productCode: 'P1',
        productDescription: 'Desc',
        attribCode: 'A1',
        attribDescription: 'Attr',
        newProductCode: 'P2',
        newProductDescription: 'New',
        verifyProduct: 'P2'
      }));
      component.deletedEntries = entries;
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageIndex: 1, pageSize: 10 }
      };

      // Act
      const result = component.paginatedEntries;

      // Assert
      expect(result.length).toBe(10);
      expect(result[0].unitId).toBe('U10');
    });

    it('should return all entries when pagination config is undefined', () => {
      // Arrange
      const entries: DeletedEntry[] = [
        { unitId: 'U1', productCode: 'P1', productDescription: 'D', attribCode: 'A1', attribDescription: 'D', newProductCode: 'P2', newProductDescription: 'N', verifyProduct: 'P2' }
      ];
      component.deletedEntries = entries;
      component.tableConfig = { ...component.tableConfig, pagination: undefined };

      // Act
      const result = component.paginatedEntries;

      // Assert
      expect(result.length).toBe(1);
    });
  });

  // ──────────── onUnitPostValidate ────────────

  describe('onUnitPostValidate', () => {
    it('should validate unit and set state on success', fakeAsync(() => {
      // Arrange
      dcattrServiceSpy.validateUnit.and.returnValue(of({ collectionDate: '2026-01-15T00:00:00Z' }));
      dcattrServiceSpy.getProductCodes.and.returnValue(of([makeProductCode()]));
      const event = makePostValidateEvent();

      // Act
      component.onUnitPostValidate(event);
      tick();

      // Assert
      expect(component.collectionDate()).toBe('2026-01-15T00:00:00Z');
      expect(component.parsedUnitId()).toBe('12345678901234');
      expect(component.unitValidated()).toBeTrue();
      expect(component.codeScheme()).toBe('I');
      expect(event.confirm).toHaveBeenCalled();
      expect(dcattrServiceSpy.getProductCodes).toHaveBeenCalledWith('12345678901234', '2026-01-15T00:00:00Z', 'I');
    }));

    it('should use codeScheme from event data', fakeAsync(() => {
      // Arrange
      dcattrServiceSpy.validateUnit.and.returnValue(of({ collectionDate: '2026-01-15' }));
      dcattrServiceSpy.getProductCodes.and.returnValue(of([]));
      const event = makePostValidateEvent({ codeScheme: 'E' });

      // Act
      component.onUnitPostValidate(event);
      tick();

      // Assert
      expect(component.codeScheme()).toBe('E');
    }));

    it('should default codeScheme to I when event has no codeScheme', fakeAsync(() => {
      // Arrange
      dcattrServiceSpy.validateUnit.and.returnValue(of({ collectionDate: '2026-01-15' }));
      dcattrServiceSpy.getProductCodes.and.returnValue(of([]));
      const event = makePostValidateEvent({ codeScheme: undefined });

      // Act
      component.onUnitPostValidate(event);
      tick();

      // Assert
      expect(component.codeScheme()).toBe('I');
    }));

    it('should reject with error message on validation failure', fakeAsync(() => {
      // Arrange
      dcattrServiceSpy.validateUnit.and.returnValue(
        throwError(() => ({ message: 'Unit not found' }))
      );
      const event = makePostValidateEvent();

      // Act
      component.onUnitPostValidate(event);
      tick();

      // Assert
      expect(component.unitValidated()).toBeFalse();
      expect(component.collectionDate()).toBeNull();
      expect(event.reject).toHaveBeenCalledWith('Unit not found');
    }));

    it('should use fallback error message when err.message is missing', fakeAsync(() => {
      // Arrange
      dcattrServiceSpy.validateUnit.and.returnValue(throwError(() => ({})));
      const event = makePostValidateEvent();

      // Act
      component.onUnitPostValidate(event);
      tick();

      // Assert
      expect(event.reject).toHaveBeenCalledWith('Unit not found or not eligible');
    }));
  });

  // ──────────── onUnitIdCleared ────────────

  describe('onUnitIdCleared', () => {
    it('should reset unit-related state', () => {
      // Arrange
      setupValidatedUnit();
      component.productCodes.set([makeProductCode()]);

      // Act
      component.onUnitIdCleared();

      // Assert
      expect(component.parsedUnitId()).toBeNull();
      expect(component.codeScheme()).toBe('I');
      expect(component.unitValidated()).toBeFalse();
      expect(component.collectionDate()).toBeNull();
    });
  });

  // ──────────── Load Product Codes ────────────

  describe('loadProductCodes (via onUnitPostValidate)', () => {
    it('should set productCodes and filteredProductCodes on success', fakeAsync(() => {
      // Arrange
      const codes = [makeProductCode({ productCode: 'PLT001' })];
      dcattrServiceSpy.validateUnit.and.returnValue(of({ collectionDate: '2026-01-15' }));
      dcattrServiceSpy.getProductCodes.and.returnValue(of(codes));

      // Act
      component.onUnitPostValidate(makePostValidateEvent());
      tick();

      // Assert
      expect(component.productCodes()).toEqual(codes);
      expect(component.filteredProductCodes()).toEqual(codes);
    }));

    it('should clear productCodes on load error', fakeAsync(() => {
      // Arrange
      dcattrServiceSpy.validateUnit.and.returnValue(of({ collectionDate: '2026-01-15' }));
      dcattrServiceSpy.getProductCodes.and.returnValue(throwError(() => new Error('fail')));

      // Act
      component.onUnitPostValidate(makePostValidateEvent());
      tick();

      // Assert
      expect(component.productCodes()).toEqual([]);
    }));
  });

  // ──────────── Load Deletable Attributes ────────────

  describe('Load Deletable Attributes', () => {
    beforeEach(() => {
      setupValidatedUnit();
      component.form.get('productCode')?.enable();
    });

    it('should load deletable attributes when product code selected', fakeAsync(() => {
      // Arrange
      const mockAttributes = [
        makeAttribute({ attribCode: 'CMV', attribType: 'C' }),
        makeAttribute({ attribCode: 'IRRAD', attribDesc: 'Irradiated', attribType: 'M' })
      ];
      dcattrServiceSpy.getDeletableAttributes.and.returnValue(of(mockAttributes));

      // Act
      component.form.get('productCode')?.setValue('RBC001');
      component.onProductCodeChange();
      tick();

      // Assert
      expect(dcattrServiceSpy.getDeletableAttributes).toHaveBeenCalledWith(
        '12345678901234',
        '2026-01-15T00:00:00Z',
        'RBC001',
        'I'
      );
      expect(component.attributes().length).toBe(2);
    }));

    it('should set server error when no deletable attributes found', fakeAsync(() => {
      // Arrange
      dcattrServiceSpy.getDeletableAttributes.and.returnValue(of([]));

      // Act
      component.form.get('productCode')?.setValue('RBC001');
      component.onProductCodeChange();
      tick();

      // Assert
      expect(component.form.get('productCode')?.hasError('serverError')).toBeTrue();
    }));

    it('should handle error when loading attributes fails', fakeAsync(() => {
      // Arrange
      dcattrServiceSpy.getDeletableAttributes.and.returnValue(
        throwError(() => ({ message: 'Failed to load attributes' }))
      );

      // Act
      component.form.get('productCode')?.setValue('RBC001');
      component.onProductCodeChange();
      tick();

      // Assert
      expect(component.form.get('productCode')?.hasError('serverError')).toBeTrue();
    }));

    it('should not load attributes when unitId or collDate is missing', fakeAsync(() => {
      // Arrange
      component.parsedUnitId.set(null);
      component.collectionDate.set(null);

      // Act
      component.form.get('productCode')?.setValue('RBC001');
      component.onProductCodeChange();
      tick();

      // Assert
      expect(dcattrServiceSpy.getDeletableAttributes).not.toHaveBeenCalled();
    }));

    it('should reset dependent fields when product code changes', fakeAsync(() => {
      // Arrange
      component.attributes.set([makeAttribute()]);
      component.newProductCode.set('RBC002');
      component.selectedAttribType.set('C');

      // Act
      component.form.get('productCode')?.setValue('PLT001');
      component.onProductCodeChange();
      tick();

      // Assert
      expect(component.form.get('attribCode')?.value).toBe('');
      expect(component.form.get('verifyProdCode')?.value).toBe('');
      expect(component.newProductCode()).toBeNull();
      expect(component.selectedAttribType()).toBeNull();
    }));

    it('should not load attributes when product code is cleared', fakeAsync(() => {
      // Arrange
      dcattrServiceSpy.getDeletableAttributes.calls.reset();

      // Act
      component.form.get('productCode')?.setValue('');
      component.onProductCodeChange();
      tick();

      // Assert
      expect(dcattrServiceSpy.getDeletableAttributes).not.toHaveBeenCalled();
      expect(component.selectedProductCode()).toBeNull();
    }));
  });

  // ──────────── onAttribCodeChange ────────────

  describe('onAttribCodeChange', () => {
    beforeEach(() => {
      setupValidatedUnit();
      component.form.get('productCode')?.setValue('RBC001');
    });

    it('should do nothing when attribCode is empty', () => {
      // Arrange
      component.form.get('attribCode')?.setValue('');

      // Act
      component.onAttribCodeChange();

      // Assert
      expect(dcattrServiceSpy.previewNewProductCode).not.toHaveBeenCalled();
      expect(dcattrServiceSpy.deleteAttribute).not.toHaveBeenCalled();
    });

    it('should do nothing when attribCode is same as lastProcessedAttribCode', () => {
      // Arrange
      component.attributes.set([makeAttribute({ attribCode: 'CMV', attribType: 'C' })]);
      component.form.get('attribCode')?.setValue('CMV');
      component.onAttribCodeChange(); // first call processes it
      dcattrServiceSpy.previewNewProductCode.calls.reset();

      // Act
      component.onAttribCodeChange(); // second call should be skipped

      // Assert
      expect(dcattrServiceSpy.previewNewProductCode).not.toHaveBeenCalled();
    });

    it('should do nothing when attribCode is not found in attributes list', () => {
      // Arrange
      component.attributes.set([makeAttribute({ attribCode: 'CMV' })]);
      component.form.get('attribCode')?.setValue('UNKNOWN');

      // Act
      component.onAttribCodeChange();

      // Assert
      expect(dcattrServiceSpy.previewNewProductCode).not.toHaveBeenCalled();
    });

    it('should call executeDelete for type A attributes', fakeAsync(() => {
      // Arrange
      component.attributes.set([makeAttribute({ attribCode: 'DEL', attribType: 'A' })]);
      component.form.get('attribCode')?.setValue('DEL');
      dcattrServiceSpy.deleteAttribute.and.returnValue(of({ newProductCode: 'RBC001' }));

      // Act
      component.onAttribCodeChange();
      tick();

      // Assert — selectedAttribType resets to null after successful sync delete
      expect(dcattrServiceSpy.deleteAttribute).toHaveBeenCalled();
    }));

    it('should call previewNewProductCode for type C attributes', fakeAsync(() => {
      // Arrange
      component.attributes.set([makeAttribute({ attribCode: 'CMV', attribType: 'C' })]);
      component.form.get('attribCode')?.setValue('CMV');
      dcattrServiceSpy.previewNewProductCode.and.returnValue(
        of({ newProductCode: 'RBC002', newProductDescription: 'Modified RBC' })
      );

      // Act
      component.onAttribCodeChange();
      tick();

      // Assert
      expect(component.selectedAttribType()).toBe('C');
      expect(dcattrServiceSpy.previewNewProductCode).toHaveBeenCalled();
      expect(component.newProductCode()).toBe('RBC002');
    }));

    it('should call previewNewProductCode for type M attributes', fakeAsync(() => {
      // Arrange
      component.attributes.set([makeAttribute({ attribCode: 'MOD', attribDesc: 'Modified', attribType: 'M' })]);
      component.form.get('attribCode')?.setValue('MOD');
      dcattrServiceSpy.previewNewProductCode.and.returnValue(
        of({ newProductCode: 'RBC003', newProductDescription: 'RBC Modified' })
      );

      // Act
      component.onAttribCodeChange();
      tick();

      // Assert
      expect(component.selectedAttribType()).toBe('M');
      expect(component.newProductCode()).toBe('RBC003');
    }));

    it('should clear previous state before processing new attribute', fakeAsync(() => {
      // Arrange
      component.newProductCode.set('OLD_CODE');
      component.verificationStarted.set(true);
      component.attributes.set([makeAttribute({ attribCode: 'CMV', attribType: 'C' })]);
      component.form.get('attribCode')?.setValue('CMV');
      dcattrServiceSpy.previewNewProductCode.and.returnValue(
        of({ newProductCode: 'NEW_CODE', newProductDescription: '' })
      );

      // Act
      component.onAttribCodeChange();
      tick();

      // Assert
      expect(component.verificationStarted()).toBeFalse();
    }));
  });

  // ──────────── Preview New Product Code ────────────

  describe('Preview New Product Code', () => {
    beforeEach(() => {
      setupValidatedUnit();
      component.form.get('productCode')?.setValue('RBC001');
      component.attributes.set([makeAttribute({ attribCode: 'CMV', attribType: 'C' })]);
    });

    it('should preview new product code when attribute selected', fakeAsync(() => {
      // Arrange
      const mockResponse = { newProductCode: 'RBC002', newProductDescription: 'RBC Modified' };
      dcattrServiceSpy.previewNewProductCode.and.returnValue(of(mockResponse));

      // Act
      component.form.get('attribCode')?.setValue('CMV');
      component.onAttribCodeChange();
      tick();

      // Assert
      expect(dcattrServiceSpy.previewNewProductCode).toHaveBeenCalledWith({
        unitId: '12345678901234',
        collDate: '2026-01-15T00:00:00Z',
        productCode: 'RBC001',
        attribCode: 'CMV',
        codeScheme: 'I'
      });
      expect(component.newProductCode()).toBe('RBC002');
      expect(component.newProductCodeDescription()).toBe('RBC Modified');
    }));

    it('should set filteredVerifyCodes with only the new product code', fakeAsync(() => {
      // Arrange
      dcattrServiceSpy.previewNewProductCode.and.returnValue(
        of({ newProductCode: 'RBC002', newProductDescription: 'Modified' })
      );

      // Act
      component.form.get('attribCode')?.setValue('CMV');
      component.onAttribCodeChange();
      tick();

      // Assert
      const filtered = component.filteredVerifyCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].productCode).toBe('RBC002');
    }));

    it('should handle null newProductDescription in preview response', fakeAsync(() => {
      // Arrange
      dcattrServiceSpy.previewNewProductCode.and.returnValue(
        of({ newProductCode: 'RBC002', newProductDescription: null as any })
      );

      // Act
      component.form.get('attribCode')?.setValue('CMV');
      component.onAttribCodeChange();
      tick();

      // Assert
      expect(component.newProductCodeDescription()).toBeNull();
    }));

    it('should handle error when preview fails', fakeAsync(() => {
      // Arrange
      dcattrServiceSpy.previewNewProductCode.and.returnValue(
        throwError(() => ({ message: 'Product code generation failed' }))
      );

      // Act
      component.form.get('attribCode')?.setValue('CMV');
      component.onAttribCodeChange();
      tick();

      // Assert
      expect(component.newProductCode()).toBeNull();
      expect(component.form.get('attribCode')?.hasError('serverError')).toBeTrue();
    }));

    it('should use fallback error message when preview error has no message', fakeAsync(() => {
      // Arrange
      dcattrServiceSpy.previewNewProductCode.and.returnValue(throwError(() => ({})));

      // Act
      component.form.get('attribCode')?.setValue('CMV');
      component.onAttribCodeChange();
      tick();

      // Assert
      expect(component.form.get('attribCode')?.hasError('serverError')).toBeTrue();
    }));
  });

  // ──────────── onVerifyProductCode ────────────

  describe('onVerifyProductCode', () => {
    beforeEach(() => {
      setupValidatedUnit();
      component.form.get('productCode')?.setValue('RBC001');
      component.selectedAttribType.set('C');
    });

    it('should do nothing when verifyProdCode is empty', () => {
      // Arrange
      component.form.get('verifyProdCode')?.setValue('');
      component.newProductCode.set('RBC002');

      // Act
      component.onVerifyProductCode();

      // Assert
      expect(dcattrServiceSpy.deleteAttribute).not.toHaveBeenCalled();
    });

    it('should do nothing when newProductCode is null', () => {
      // Arrange
      component.form.get('verifyProdCode')?.setValue('RBC002');
      component.newProductCode.set(null);

      // Act
      component.onVerifyProductCode();

      // Assert
      expect(dcattrServiceSpy.deleteAttribute).not.toHaveBeenCalled();
    });

    it('should set error when verify code does not match new product code', () => {
      // Arrange
      component.form.get('verifyProdCode')?.setValue('WRONG');
      component.newProductCode.set('RBC002');

      // Act
      component.onVerifyProductCode();

      // Assert
      expect(component.form.get('verifyProdCode')?.hasError('serverError')).toBeTrue();
    });

    it('should call executeDelete when verify code matches new product code', fakeAsync(() => {
      // Arrange
      component.newProductCode.set('RBC002');
      component.form.get('attribCode')?.setValue('CMV');
      component.form.get('verifyProdCode')?.setValue('RBC002');
      component.attributes.set([makeAttribute({ attribCode: 'CMV', attribType: 'C' })]);
      dcattrServiceSpy.deleteAttribute.and.returnValue(of({ newProductCode: 'RBC002' }));

      // Act
      component.onVerifyProductCode();
      tick();

      // Assert
      expect(component.form.get('verifyProdCode')?.errors).toBeNull();
      expect(dcattrServiceSpy.deleteAttribute).toHaveBeenCalled();
    }));
  });

  // ──────────── executeDelete ────────────

  describe('executeDelete (via onAttribCodeChange for type A / onVerifyProductCode for type C)', () => {
    beforeEach(() => {
      setupValidatedUnit();
      component.form.get('productCode')?.setValue('RBC001');
      component.productCodes.set([makeProductCode({ productCode: 'RBC001', productShortName: 'Red Blood Cells' })]);
    });

    it('should add entry to deletedEntries on successful type A delete', fakeAsync(() => {
      // Arrange
      component.attributes.set([makeAttribute({ attribCode: 'DEL', attribDesc: 'Delete Attr', attribType: 'A' })]);
      component.form.get('attribCode')?.setValue('DEL');
      dcattrServiceSpy.deleteAttribute.and.returnValue(of({ newProductCode: 'RBC001' }));

      // Act
      component.onAttribCodeChange();
      tick();

      // Assert
      expect(component.deletedEntries.length).toBe(1);
      const entry = component.deletedEntries[0];
      expect(entry.unitId).toBe('12345678901234');
      expect(entry.productCode).toBe('RBC001');
      expect(entry.productDescription).toBe('Red Blood Cells');
      expect(entry.attribCode).toBe('DEL');
      expect(entry.newProductCode).toBe('-'); // type A uses '-'
      expect(entry.verifyProduct).toBe('-');
      expect(snackBarSpy.open).toHaveBeenCalledWith('Attribute deleted successfully', 'DISMISS', jasmine.any(Object));
    }));

    it('should add entry with new product code for type C delete', fakeAsync(() => {
      // Arrange
      component.attributes.set([makeAttribute({ attribCode: 'CMV', attribType: 'C' })]);
      component.newProductCode.set('RBC002');
      component.newProductCodeDescription.set('Modified RBC');
      component.form.get('attribCode')?.setValue('CMV');
      component.form.get('verifyProdCode')?.setValue('RBC002');
      dcattrServiceSpy.deleteAttribute.and.returnValue(of({ newProductCode: 'RBC002' }));

      // Act
      component.onVerifyProductCode();
      tick();

      // Assert
      expect(component.deletedEntries.length).toBe(1);
      const entry = component.deletedEntries[0];
      expect(entry.newProductCode).toBe('RBC002');
      expect(entry.newProductDescription).toBe('Modified RBC');
      expect(entry.verifyProduct).toBe('RBC002');
    }));

    it('should use dash for missing product description', fakeAsync(() => {
      // Arrange
      component.productCodes.set([]); // no matching product code
      component.attributes.set([makeAttribute({ attribCode: 'DEL', attribType: 'A' })]);
      component.form.get('attribCode')?.setValue('DEL');
      dcattrServiceSpy.deleteAttribute.and.returnValue(of({ newProductCode: 'RBC001' }));

      // Act
      component.onAttribCodeChange();
      tick();

      // Assert
      expect(component.deletedEntries[0].productDescription).toBe('-');
    }));

    it('should handle delete error and set attribCode error', fakeAsync(() => {
      // Arrange
      component.attributes.set([makeAttribute({ attribCode: 'DEL', attribType: 'A' })]);
      component.form.get('attribCode')?.setValue('DEL');
      dcattrServiceSpy.deleteAttribute.and.returnValue(
        throwError(() => ({ message: 'Cannot delete' }))
      );

      // Act
      component.onAttribCodeChange();
      tick();

      // Assert
      expect(component.loading()).toBeFalse();
      expect(component.form.get('attribCode')?.hasError('serverError')).toBeTrue();
    }));

    it('should use fallback error message when delete error has no message', fakeAsync(() => {
      // Arrange
      component.attributes.set([makeAttribute({ attribCode: 'DEL', attribType: 'A' })]);
      component.form.get('attribCode')?.setValue('DEL');
      dcattrServiceSpy.deleteAttribute.and.returnValue(throwError(() => ({})));

      // Act
      component.onAttribCodeChange();
      tick();

      // Assert
      expect(component.form.get('attribCode')?.hasError('serverError')).toBeTrue();
    }));

    it('should reset form state after successful delete', fakeAsync(() => {
      // Arrange
      component.attributes.set([makeAttribute({ attribCode: 'DEL', attribType: 'A' })]);
      component.form.get('attribCode')?.setValue('DEL');
      dcattrServiceSpy.deleteAttribute.and.returnValue(of({ newProductCode: 'RBC001' }));

      // Act
      component.onAttribCodeChange();
      tick();

      // Assert — resetAfterDelete preserves unit context so user can
      // delete multiple attributes without re-scanning (FMB next_record)
      expect(component.parsedUnitId()).toBe('12345678901234');
      expect(component.unitValidated()).toBeTrue();
      expect(component.selectedProductCode()).toBeNull();
    }));

    it('should not call deleteAttribute when missing required fields', fakeAsync(() => {
      // Arrange
      component.parsedUnitId.set(null); // missing unitId
      component.attributes.set([makeAttribute({ attribCode: 'DEL', attribType: 'A' })]);
      component.form.get('attribCode')?.setValue('DEL');

      // Act
      component.onAttribCodeChange();
      tick();

      // Assert
      expect(dcattrServiceSpy.deleteAttribute).not.toHaveBeenCalled();
    }));
  });

  // ──────────── Clear All ────────────

  describe('onClearAll', () => {
    it('should reset form and state on clear all', () => {
      // Arrange
      component.collectionDate.set('2026-01-15T00:00:00Z');
      component.unitValidated.set(true);
      component.newProductCode.set('RBC002');
      component.selectedAttribType.set('C');
      component.verificationStarted.set(true);
      component.submitted.set(true);

      // Act
      component.onClearAll();

      // Assert
      expect(component.collectionDate()).toBeNull();
      expect(component.unitValidated()).toBeFalse();
      expect(component.newProductCode()).toBeNull();
      expect(component.selectedAttribType()).toBeNull();
      expect(component.verificationStarted()).toBeFalse();
      expect(component.submitted()).toBeFalse();
      expect(component.parsedUnitId()).toBeNull();
      expect(component.selectedProductCode()).toBeNull();
    });
  });

  // ──────────── onOpenHistory ────────────

  describe('onOpenHistory', () => {
    it('should show error when no unit or product code is available', () => {
      // Arrange
      component.parsedUnitId.set(null);
      component.collectionDate.set(null);

      // Act
      component.onOpenHistory();

      // Assert
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Please validate a unit and select a product code first',
        'DISMISS',
        jasmine.any(Object)
      );
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should show error when unitId is set but productCode is empty', () => {
      // Arrange
      setupValidatedUnit();
      component.form.get('productCode')?.setValue('');

      // Act
      component.onOpenHistory();

      // Assert
      expect(snackBarSpy.open).toHaveBeenCalled();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should open dialog when all required fields are present', () => {
      // Arrange
      setupValidatedUnit();
      component.form.get('productCode')?.setValue('RBC001');

      // Act
      component.onOpenHistory();

      // Assert
      expect(dialogSpy.open).toHaveBeenCalled();
      const callArgs = dialogSpy.open.calls.mostRecent().args;
      expect(callArgs[1]?.data).toEqual({
        unitId: '12345678901234',
        collDate: '2026-01-15T00:00:00Z',
        productCode: 'RBC001'
      });
    });
  });

  // ──────────── onReprint ────────────

  describe('onReprint', () => {
    it('should show error when missing required fields', () => {
      // Arrange
      component.parsedUnitId.set(null);
      component.newProductCode.set(null);

      // Act
      component.onReprint();

      // Assert
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'New product code must be generated before reprinting',
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should show error when verification has started', () => {
      // Arrange
      setupValidatedUnit();
      component.newProductCode.set('RBC002');
      component.verificationStarted.set(true);

      // Act
      component.onReprint();

      // Assert
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Cannot reprint after verification has started',
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should call reprintLabel service on success', fakeAsync(() => {
      // Arrange
      setupValidatedUnit();
      component.newProductCode.set('RBC002');
      component.verificationStarted.set(false);
      dcattrServiceSpy.reprintLabel.and.returnValue(of({}));

      // Act
      component.onReprint();
      tick();

      // Assert
      expect(dcattrServiceSpy.reprintLabel).toHaveBeenCalledWith({
        unitId: '12345678901234',
        collDate: '2026-01-15T00:00:00Z',
        newProductCode: 'RBC002'
      });
      expect(component.loading()).toBeFalse();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Label reprint request processed successfully',
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should handle reprint error', fakeAsync(() => {
      // Arrange
      setupValidatedUnit();
      component.newProductCode.set('RBC002');
      component.verificationStarted.set(false);
      dcattrServiceSpy.reprintLabel.and.returnValue(
        throwError(() => ({ message: 'Printer offline' }))
      );

      // Act
      component.onReprint();
      tick();

      // Assert
      expect(component.loading()).toBeFalse();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Printer offline',
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should use fallback error message when reprint error has no message', fakeAsync(() => {
      // Arrange
      setupValidatedUnit();
      component.newProductCode.set('RBC002');
      component.verificationStarted.set(false);
      dcattrServiceSpy.reprintLabel.and.returnValue(throwError(() => ({})));

      // Act
      component.onReprint();
      tick();

      // Assert
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Failed to reprint label',
        'DISMISS',
        jasmine.any(Object)
      );
    }));
  });

  // ──────────── onPageChange ────────────

  describe('onPageChange', () => {
    it('should update pagination config', () => {
      // Act
      component.onPageChange({ pageIndex: 2, pageSize: 50 });

      // Assert
      expect(component.tableConfig.pagination?.pageIndex).toBe(2);
      expect(component.tableConfig.pagination?.pageSize).toBe(50);
    });

    it('should not throw when pagination is undefined', () => {
      // Arrange
      component.tableConfig = { ...component.tableConfig, pagination: undefined };

      // Act & Assert
      expect(() => component.onPageChange({ pageIndex: 0, pageSize: 25 })).not.toThrow();
    });
  });

  // ──────────── onSortChange ────────────

  describe('onSortChange', () => {
    it('should sort entries ascending', () => {
      // Arrange
      component.deletedEntries = [
        { unitId: 'B', productCode: 'P1', productDescription: '', attribCode: '', attribDescription: '', newProductCode: '', newProductDescription: '', verifyProduct: '' },
        { unitId: 'A', productCode: 'P1', productDescription: '', attribCode: '', attribDescription: '', newProductCode: '', newProductDescription: '', verifyProduct: '' }
      ];

      // Act
      component.onSortChange({ column: 'unitId', direction: 'A' });

      // Assert
      expect(component.deletedEntries[0].unitId).toBe('A');
      expect(component.deletedEntries[1].unitId).toBe('B');
    });

    it('should sort entries descending', () => {
      // Arrange
      component.deletedEntries = [
        { unitId: 'A', productCode: 'P1', productDescription: '', attribCode: '', attribDescription: '', newProductCode: '', newProductDescription: '', verifyProduct: '' },
        { unitId: 'B', productCode: 'P1', productDescription: '', attribCode: '', attribDescription: '', newProductCode: '', newProductDescription: '', verifyProduct: '' }
      ];

      // Act
      component.onSortChange({ column: 'unitId', direction: 'D' });

      // Assert
      expect(component.deletedEntries[0].unitId).toBe('B');
      expect(component.deletedEntries[1].unitId).toBe('A');
    });

    it('should update tableConfig sortConfig', () => {
      // Act
      component.onSortChange({ column: 'productCode', direction: 'A' });

      // Assert
      expect(component.tableConfig.sortConfig?.column).toBe('productCode');
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
    });
  });

  // ──────────── updateTableConfig ────────────

  describe('updateTableConfig (via delete)', () => {
    it('should update unit ID column header with count and totalRecords', fakeAsync(() => {
      // Arrange
      setupValidatedUnit();
      component.form.get('productCode')?.setValue('RBC001');
      component.productCodes.set([makeProductCode()]);
      component.attributes.set([makeAttribute({ attribCode: 'DEL', attribType: 'A' })]);
      component.form.get('attribCode')?.setValue('DEL');
      dcattrServiceSpy.deleteAttribute.and.returnValue(of({ newProductCode: 'RBC001' }));

      // Act
      component.onAttribCodeChange();
      tick();

      // Assert
      const unitIdCol = component.tableConfig.columns.find(c => c.key === 'unitId');
      expect(unitIdCol?.header).toContain('Unit ID');
      expect(unitIdCol?.header).toContain('1');
      expect(component.tableConfig.pagination?.totalRecords).toBe(1);
    }));
  });

  // ──────────── Display helpers ────────────

  describe('Display helpers', () => {
    it('getProductCodeDescription should return description for selected product', () => {
      // Arrange
      component.productCodes.set([makeProductCode({ productCode: 'RBC001', productShortName: 'Red Blood Cells' })]);
      component.form.get('productCode')?.setValue('RBC001');

      // Act & Assert
      expect(component.getProductCodeDescription()).toBe('Red Blood Cells');
    });

    it('getProductCodeDescription should return dash when no product code selected', () => {
      // Arrange
      component.form.get('productCode')?.setValue('');

      // Act & Assert
      expect(component.getProductCodeDescription()).toBe('-');
    });

    it('getProductCodeDescription should return dash when product code not found', () => {
      // Arrange
      component.productCodes.set([]);
      component.form.get('productCode')?.setValue('UNKNOWN');

      // Act & Assert
      expect(component.getProductCodeDescription()).toBe('-');
    });

    it('getAttributeDescription should return description for known attribute', () => {
      // Arrange
      component.attributes.set([makeAttribute({ attribCode: 'CMV', attribDesc: 'CMV Negative' })]);

      // Act & Assert
      expect(component.getAttributeDescription('CMV')).toBe('CMV Negative');
    });

    it('getAttributeDescription should return dash for unknown attribute', () => {
      expect(component.getAttributeDescription('UNKNOWN')).toBe('-');
    });

    it('getAttributeDescription should return dash for undefined', () => {
      expect(component.getAttributeDescription(undefined)).toBe('-');
    });

    it('getAttribTypeDisplay should return Attribute for A', () => {
      expect(component.getAttribTypeDisplay('A')).toBe('Attribute');
    });

    it('getAttribTypeDisplay should return Convert for C', () => {
      expect(component.getAttribTypeDisplay('C')).toBe('Convert');
    });

    it('getAttribTypeDisplay should return Modify for M', () => {
      expect(component.getAttribTypeDisplay('M')).toBe('Modify');
    });

    it('getAttribTypeDisplay should return raw type for unknown', () => {
      expect(component.getAttribTypeDisplay('X')).toBe('X');
    });
  });

  // ──────────── filterCodes / filterAttributes ────────────

  describe('Search filtering', () => {
    it('should filter product codes by productCode', fakeAsync(() => {
      // Arrange
      component.productCodes.set([
        makeProductCode({ productCode: 'RBC001', productShortName: 'Red Blood Cells' }),
        makeProductCode({ productCode: 'PLT001', productShortName: 'Platelets' })
      ]);

      // Act
      component.productCodeSearchCtrl.setValue('rbc');
      tick();

      // Assert
      expect(component.filteredProductCodes().length).toBe(1);
      expect(component.filteredProductCodes()[0].productCode).toBe('RBC001');
    }));

    it('should filter product codes by productShortName', fakeAsync(() => {
      // Arrange
      component.productCodes.set([
        makeProductCode({ productCode: 'RBC001', productShortName: 'Red Blood Cells' }),
        makeProductCode({ productCode: 'PLT001', productShortName: 'Platelets' })
      ]);

      // Act
      component.productCodeSearchCtrl.setValue('plate');
      tick();

      // Assert
      expect(component.filteredProductCodes().length).toBe(1);
      expect(component.filteredProductCodes()[0].productCode).toBe('PLT001');
    }));

    it('should return all product codes when search is empty', fakeAsync(() => {
      // Arrange
      component.productCodes.set([
        makeProductCode({ productCode: 'RBC001' }),
        makeProductCode({ productCode: 'PLT001' })
      ]);

      // Act
      component.productCodeSearchCtrl.setValue('');
      tick();

      // Assert
      expect(component.filteredProductCodes().length).toBe(2);
    }));

    it('should filter verify codes similarly', fakeAsync(() => {
      // Arrange
      component.productCodes.set([
        makeProductCode({ productCode: 'RBC001' }),
        makeProductCode({ productCode: 'PLT001' })
      ]);

      // Act
      component.verifySearchCtrl.setValue('plt');
      tick();

      // Assert
      expect(component.filteredVerifyCodes().length).toBe(1);
    }));

    it('should filter attributes by attribCode', fakeAsync(() => {
      // Arrange
      component.attributes.set([
        makeAttribute({ attribCode: 'CMV', attribDesc: 'CMV Negative' }),
        makeAttribute({ attribCode: 'IRRAD', attribDesc: 'Irradiated' })
      ]);

      // Act
      component.attribCodeSearchCtrl.setValue('cmv');
      tick();

      // Assert
      expect(component.filteredAttributes().length).toBe(1);
      expect(component.filteredAttributes()[0].attribCode).toBe('CMV');
    }));

    it('should filter attributes by attribDesc', fakeAsync(() => {
      // Arrange
      component.attributes.set([
        makeAttribute({ attribCode: 'CMV', attribDesc: 'CMV Negative' }),
        makeAttribute({ attribCode: 'IRRAD', attribDesc: 'Irradiated' })
      ]);

      // Act
      component.attribCodeSearchCtrl.setValue('irrad');
      tick();

      // Assert
      expect(component.filteredAttributes().length).toBe(1);
    }));

    it('should return all attributes when search is empty', fakeAsync(() => {
      // Arrange
      component.attributes.set([
        makeAttribute({ attribCode: 'CMV' }),
        makeAttribute({ attribCode: 'IRRAD' })
      ]);

      // Act
      component.attribCodeSearchCtrl.setValue('');
      tick();

      // Assert
      expect(component.filteredAttributes().length).toBe(2);
    }));
  });

  // ──────────── Form Validation ────────────

  describe('Form Validation', () => {
    it('should validate maxLength for product code', () => {
      component.form.get('productCode')?.setValue('TOOLONGPC');
      expect(component.form.get('productCode')?.hasError('maxlength')).toBeTrue();
    });

    it('should validate maxLength for verify product code', () => {
      component.form.get('verifyProdCode')?.enable();
      component.form.get('verifyProdCode')?.setValue('TOOLONGPC');
      expect(component.form.get('verifyProdCode')?.hasError('maxlength')).toBeTrue();
    });

    it('f getter should return form controls', () => {
      expect(component.f['productCode']).toBeTruthy();
      expect(component.f['attribCode']).toBeTruthy();
      expect(component.f['verifyProdCode']).toBeTruthy();
    });
  });

  // ──────────── ngOnDestroy ────────────

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject without error', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
