import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { TranslateModule } from '@ngx-translate/core';
import { CorrectImportedUnitDataComponent } from './correct-imported-unit-data';
import { CorrectImportedUnitDataApiService } from './services/correct-imported-unit-data-api.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ComponentAttributeModel, AttributeGroupLov, AttributeCodeLov, ProductCodeLov } from './models/correct-imported-unit-data.model';
import { provideRouter } from '@angular/router';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('CorrectImportedUnitDataComponent', () => {
  let component: CorrectImportedUnitDataComponent;
  let fixture: ComponentFixture<CorrectImportedUnitDataComponent>;
  let apiServiceSpy: jasmine.SpyObj<CorrectImportedUnitDataApiService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let loginServiceSpy: jasmine.SpyObj<LoginService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;

  const mockAttributeGroups: AttributeGroupLov[] = [
    { code: 'ATTR', description: 'Attribute Group 1' },
    { code: 'QUAL', description: 'Quality Attributes' }
  ];

  const mockAttributeCodes: AttributeCodeLov[] = [
    { code: 'CODE01', description: 'Code Description 1' },
    { code: 'CODE02', description: 'Code Description 2' }
  ];

  const mockProductCodes: ProductCodeLov[] = [
    { code: 'RBC001', description: 'Red Blood Cells' },
    { code: 'PLT01', description: 'Platelets' }
  ];

  const mockComponentAttribute: ComponentAttributeModel = {
    unitId: '12345678',
    chapterId: 'CH01',
    productCode: 'RBC001',
    attributeGroup: 'ATTR',
    attributeCode: 'CODE01',
    originalImportedProduct: 'ORIG001',
    attributeGroupDescription: 'Attribute Group',
    attributeCodeDescription: 'Code Description',
    insertDate: '2024-01-01T00:00:00Z',
    insertUserId: 'USER01',
    programId: 'IMUUNITS',
    contractId: 'CONTRACT01',
    externalUnitId: 'EXT12345',
    receivedDate: '2024-01-01T00:00:00Z',
    batchId: 'BATCH001',
    checkInUser: 'USER01',
    checkInDate: '2024-01-01T00:00:00Z',
    aboLabel: 'A+',
    expirationDate: '2024-12-31T00:00:00Z',
    licenseFlag: 'Y',
    componentPrefix: null
  };

  let chapterChangedSubject: Subject<void>;

  beforeEach(() => {
    chapterChangedSubject = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('CorrectImportedUnitDataApiService', [
      'getComponentAttributes',
      'getComponentAttributeById',
      'createComponentAttribute',
      'updateComponentAttribute',
      'deleteComponentAttribute',
      'saveComponentAttribute',
      'getAttributeGroups',
      'getAttributeCodes',
      'getProductCodes',
      'getUnitCodeScheme',
      'getAboLabels',
      'getValidProductCodes',
      'getContracts'
    ]);
    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChangedSubject.asObservable() });
    loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    snackbarServiceSpy = createMockSnackbarService();

    apiServiceSpy.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
    apiServiceSpy.getAttributeCodes.and.returnValue(of(mockAttributeCodes));
    apiServiceSpy.getProductCodes.and.returnValue(of(mockProductCodes));
    apiServiceSpy.getUnitCodeScheme.and.returnValue(of('I'));
    apiServiceSpy.getAboLabels.and.returnValue(of([]));
    apiServiceSpy.getValidProductCodes.and.returnValue(of([]));
    apiServiceSpy.getComponentAttributes.and.returnValue(of({ data: [mockComponentAttribute], total: 1 }));
    apiServiceSpy.saveComponentAttribute.and.returnValue(of(undefined));
    loginServiceSpy.getStoredUsername.and.returnValue('testuser');

    TestBed.configureTestingModule({
      imports: [CorrectImportedUnitDataComponent, NoopAnimationsModule, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: CorrectImportedUnitDataApiService, useValue: apiServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy }
      ]
    });

    apiServiceSpy.getComponentAttributes.calls.reset();
    apiServiceSpy.getComponentAttributeById.calls.reset();
    apiServiceSpy.createComponentAttribute.calls.reset();
    apiServiceSpy.updateComponentAttribute.calls.reset();
    apiServiceSpy.deleteComponentAttribute.calls.reset();
    apiServiceSpy.saveComponentAttribute.calls.reset();
    apiServiceSpy.getAttributeGroups.calls.reset();
    apiServiceSpy.getAttributeCodes.calls.reset();
    apiServiceSpy.getProductCodes.calls.reset();
    apiServiceSpy.getUnitCodeScheme.calls.reset();
    apiServiceSpy.getAboLabels.calls.reset();
    apiServiceSpy.getValidProductCodes.calls.reset();
    apiServiceSpy.getContracts.calls.reset();
    headerServiceSpy.getCurrentChapterId.calls.reset();
    headerServiceSpy.getCurrentWarehouseId.calls.reset();
    loginServiceSpy.getStoredUsername.calls.reset();

    apiServiceSpy.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
    apiServiceSpy.getAttributeCodes.and.returnValue(of(mockAttributeCodes));
    apiServiceSpy.getProductCodes.and.returnValue(of(mockProductCodes));
    apiServiceSpy.getUnitCodeScheme.and.returnValue(of('I'));
    apiServiceSpy.getAboLabels.and.returnValue(of([]));
    apiServiceSpy.getValidProductCodes.and.returnValue(of([]));
    apiServiceSpy.getComponentAttributes.and.returnValue(of({ data: [mockComponentAttribute], total: 1 }));
    apiServiceSpy.saveComponentAttribute.and.returnValue(of(undefined));
    loginServiceSpy.getStoredUsername.and.returnValue('testuser');

    fixture = TestBed.createComponent(CorrectImportedUnitDataComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should load attribute groups on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getAttributeGroups).toHaveBeenCalled();
      expect(component.attributeGroups().length).toBe(2);
    }));
  });

  describe('Error State', () => {
    it('should handle error on retrieve failure', fakeAsync(() => {
      fixture.detectChanges();
      apiServiceSpy.getComponentAttributes.and.returnValue(throwError(() => ({ status: 500 })));

      component.searchForm.patchValue({ productCode: 'RBC001' });
      component.unitIdValidated.set(true);
      component.validatedUnitId.set('12345678');

      component.onRetrieve();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Failed to retrieve unit data. Please try again.'
      );
    }));
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require product code', () => {
      component.searchForm.get('productCode')?.setValue('');
      component.searchForm.get('productCode')?.markAsTouched();
      fixture.detectChanges();

      expect(component.searchForm.get('productCode')?.hasError('required')).toBeTrue();
    });

    it('should have Product Code as dropdown (mat-select) not text input', () => {
      fixture.detectChanges();

      const productCodeSelect = fixture.debugElement.query(By.css('mat-select[formControlName="productCode"]'));
      const productCodeInput = fixture.debugElement.query(By.css('input[formControlName="productCode"]'));

      expect(productCodeSelect).toBeTruthy();
      expect(productCodeInput).toBeFalsy();
    });
  });

  describe('Retrieve Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should retrieve unit data when form is valid', fakeAsync(() => {
      component.validatedUnitId.set('12345678');
      component.unitIdValidated.set(true);
      component.searchForm.patchValue({
        productCode: 'RBC001'
      });

      component.onRetrieve();
      tick();

      expect(apiServiceSpy.getComponentAttributes).toHaveBeenCalledWith(
        100,
        0,
        { unitId: '12345678', productCode: 'RBC001' }
      );
      expect(component.unitRetrieved()).toBeTrue();
      expect(component.attributeRows().length).toBe(1);
    }));
  });

  describe('Clear All Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset all forms and state', () => {
      component.searchForm.patchValue({ productCode: 'RBC001' });
      component.unitRetrieved.set(true);
      component.attributeRows.set([
        {
          id: '1',
          attributeGroup: 'ATTR',
          attributeCode: 'CODE01',
          attributeGroupDescription: 'Group',
          attributeCodeDescription: 'Code',
          isNew: false,
          isDirty: false
        }
      ]);

      component.onClearAll();

      expect(component.searchForm.value).toEqual({ productCode: null });
      expect(component.unitRetrieved()).toBeFalse();
      expect(component.attributeRows().length).toBe(0);
    });
  });

  describe('Add Row Functionality', () => {
    it('should add new attribute row', () => {
      const initialLength = component.attributeRows().length;

      component.onAddRow();

      expect(component.attributeRows().length).toBe(initialLength + 1);
      const newRow = component.attributeRows()[component.attributeRows().length - 1];
      expect(newRow.isNew).toBeTrue();
      expect(newRow.attributeGroup).toBe('');
      expect(newRow.attributeCode).toBe('');
    });
  });

  describe('Delete Row Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should remove new row without API call', () => {
      const newRow = {
        id: 'new-1',
        attributeGroup: '',
        attributeCode: '',
        attributeGroupDescription: '',
        attributeCodeDescription: '',
        isNew: true,
        isDirty: false
      };

      component.attributeRows.set([newRow]);

      component.onDeleteRow(newRow);

      expect(component.attributeRows().length).toBe(0);
      expect(apiServiceSpy.deleteComponentAttribute).not.toHaveBeenCalled();
    });
  });

  describe('Attribute Group/Code Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update row when attribute group changes', () => {
      const row = {
        id: '1',
        attributeGroup: '',
        attributeCode: '',
        attributeGroupDescription: '',
        attributeCodeDescription: '',
        isNew: true,
        isDirty: false
      };

      component.onAttributeGroupChange(row, 'ATTR');

      expect(row.attributeGroup).toBe('ATTR');
      expect(row.isDirty).toBeTrue();
      expect(row.attributeGroupDescription).toBe('Attribute Group 1');
    });

    it('should update row when attribute code changes', () => {
      const row = {
        id: '1',
        attributeGroup: 'ATTR',
        attributeCode: '',
        attributeGroupDescription: 'Group',
        attributeCodeDescription: '',
        isNew: true,
        isDirty: false
      };

      component.rowAttributeCodes.set(row.id, mockAttributeCodes);

      component.onAttributeCodeChange(row, 'CODE01');

      expect(row.attributeCode).toBe('CODE01');
      expect(row.isDirty).toBeTrue();
      expect(row.attributeCodeDescription).toBe('Code Description 1');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have proper main content structure', () => {
      const mainContent = fixture.debugElement.query(By.css('.main-content'));
      expect(mainContent).toBeTruthy();
      const contentArea = fixture.debugElement.query(By.css('.content-area'));
      expect(contentArea).toBeTruthy();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW TEST BLOCKS BELOW
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Unit Validation Callbacks', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set validated state and load product codes on unit validated', fakeAsync(() => {
      component.onUnitValidated({ parsedUnitId: 'U1234567', manualUnitId: null } as any);
      tick();

      expect(component.unitIdValidated()).toBeTrue();
      expect(component.validatedUnitId()).toBe('U1234567');
      expect(apiServiceSpy.getUnitCodeScheme).toHaveBeenCalledWith('U1234567');
      expect(apiServiceSpy.getProductCodes).toHaveBeenCalledWith('U1234567', 'I');
      expect(component.productCodes().length).toBe(2);
      expect(component.productCodesLoading()).toBeFalse();
    }));

    it('should use manualUnitId as fallback when parsedUnitId is null', fakeAsync(() => {
      component.onUnitValidated({ parsedUnitId: null, manualUnitId: 'MANUAL01' } as any);
      tick();

      expect(component.validatedUnitId()).toBe('MANUAL01');
      expect(component.unitIdValidated()).toBeTrue();
    }));

    it('should reset previous state on new validation', fakeAsync(() => {
      component.unitRetrieved.set(true);
      component.attributeRows.set([{
        id: '1', attributeGroup: 'A', attributeCode: 'B',
        attributeGroupDescription: '', attributeCodeDescription: '',
        isNew: false, isDirty: false
      }]);

      component.onUnitValidated({ parsedUnitId: 'U9999999', manualUnitId: null } as any);
      tick();

      expect(component.unitRetrieved()).toBeFalse();
      expect(component.attributeRows().length).toBe(0);
    }));

    it('should clear all state on unit cleared', () => {
      component.unitIdValidated.set(true);
      component.validatedUnitId.set('U1234567');
      component.unitRetrieved.set(true);
      component.productCodes.set(mockProductCodes);
      component.aboLabels.set([{ code: 'A', description: 'A Pos' }]);
      component.attributeRows.set([{
        id: '1', attributeGroup: 'A', attributeCode: 'B',
        attributeGroupDescription: '', attributeCodeDescription: '',
        isNew: false, isDirty: false
      }]);

      component.onUnitCleared();

      expect(component.unitIdValidated()).toBeFalse();
      expect(component.validatedUnitId()).toBeNull();
      expect(component.unitRetrieved()).toBeFalse();
      expect(component.productCodes().length).toBe(0);
      expect(component.aboLabels().length).toBe(0);
      expect(component.attributeRows().length).toBe(0);
    });
  });

  describe('Search Filters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter product codes by search term', () => {
      component.productCodes.set(mockProductCodes);
      component.productCodeSearch.setValue('RBC');

      expect(component.filteredProductCodes.length).toBe(1);
      expect(component.filteredProductCodes[0].code).toBe('RBC001');
    });

    it('should show all product codes when search is cleared', () => {
      component.productCodes.set(mockProductCodes);
      component.productCodeSearch.setValue('RBC');
      component.productCodeSearch.setValue('');

      expect(component.filteredProductCodes.length).toBe(2);
    });

    it('should filter attribute groups by search term', () => {
      component.attributeGroups.set(mockAttributeGroups);
      component.attribGroupSearch.setValue('Quality');

      expect(component.filteredAttributeGroups.length).toBe(1);
      expect(component.filteredAttributeGroups[0].code).toBe('QUAL');
    });

    it('should filter attribute codes by search term for current row', () => {
      const row = { id: 'r1', attributeGroup: 'ATTR', attributeCode: '', attributeGroupDescription: '', attributeCodeDescription: '', isNew: true, isDirty: false };
      (component as any).currentOpenCodeRow = row;
      component.rowAttributeCodes.set('r1', mockAttributeCodes);

      component.attribCodeSearch.setValue('CODE01');

      expect(component.filteredCodesByRow['r1'].length).toBe(1);
      expect(component.filteredCodesByRow['r1'][0].code).toBe('CODE01');
    });

    it('should not filter attribute codes when no current row', () => {
      (component as any).currentOpenCodeRow = null;
      const initialCodes = { ...component.filteredCodesByRow };
      component.attribCodeSearch.setValue('test');
      expect(component.filteredCodesByRow).toEqual(initialCodes);
    });

    it('should filter ABO labels by search term', () => {
      const mockLabels = [
        { code: 'A', description: 'A Positive' },
        { code: 'B', description: 'B Negative' }
      ];
      component.aboLabels.set(mockLabels);
      component.aboLabelSearch.setValue('Positive');

      expect(component.filteredAboLabels.length).toBe(1);
      expect(component.filteredAboLabels[0].code).toBe('A');
    });

    it('should filter valid product codes by search term', () => {
      const mockValid = [
        { code: 'RBC001', description: 'Red Blood Cells' },
        { code: 'PLT01', description: 'Platelets' }
      ];
      component.validProductCodes.set(mockValid);
      component.validProductCodeSearch.setValue('Plate');

      expect(component.filteredValidProductCodes.length).toBe(1);
      expect(component.filteredValidProductCodes[0].code).toBe('PLT01');
    });

    it('should load valid product codes when product code with type is selected', fakeAsync(() => {
      component.productCodes.set([
        { code: 'RBC001', description: 'Red Blood Cells', productType: 'WB' }
      ]);
      (component as any).unitCodeScheme = 'I';

      component.searchForm.get('productCode')?.setValue('RBC001');
      tick();

      expect(apiServiceSpy.getValidProductCodes).toHaveBeenCalledWith('I', 'WB');
    }));

    it('should clear valid product codes when product code deselected', fakeAsync(() => {
      component.validProductCodes.set([{ code: 'A', description: 'B' }]);
      component.searchForm.get('productCode')?.setValue(null);
      tick();

      expect(component.validProductCodes().length).toBe(0);
    }));
  });

  describe('Expiration Date Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set invalidFormat error for incorrect format', () => {
      component.unitDetailsForm.get('expirationDate')?.setValue('bad-format');
      component.onExpiryDateBlur();

      expect(component.unitDetailsForm.get('expirationDate')?.hasError('invalidFormat')).toBeTrue();
    });

    it('should set invalidDateTime error for invalid date values', () => {
      component.unitDetailsForm.get('expirationDate')?.setValue('32-JAN-2025 14:30');
      component.onExpiryDateBlur();

      expect(component.unitDetailsForm.get('expirationDate')?.hasError('invalidDateTime')).toBeTrue();
    });

    it('should set pastDate error for expired date', () => {
      component.unitDetailsForm.get('expirationDate')?.setValue('01-JAN-2020 14:30');
      component.onExpiryDateBlur();

      expect(component.unitDetailsForm.get('expirationDate')?.hasError('pastDate')).toBeTrue();
    });

    it('should clear errors for valid future date', () => {
      component.unitDetailsForm.get('expirationDate')?.setValue('01-JAN-2099 14:30');
      component.onExpiryDateBlur();

      expect(component.unitDetailsForm.get('expirationDate')?.errors).toBeNull();
    });

    it('should clear errors for empty value', () => {
      component.unitDetailsForm.get('expirationDate')?.setErrors({ invalidFormat: true });
      component.unitDetailsForm.get('expirationDate')?.setValue('');
      component.onExpiryDateBlur();

      expect(component.unitDetailsForm.get('expirationDate')?.errors).toBeNull();
    });
  });

  describe('Save Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should save successfully and clear state', fakeAsync(() => {
      component.unitRetrieved.set(true);
      component.validatedUnitId.set('12345678');
      component.searchForm.patchValue({ productCode: 'RBC001' });
      component.attributeRows.set([{
        id: '1', attributeGroup: 'ATTR', attributeCode: 'CODE01',
        attributeGroupDescription: 'Group', attributeCodeDescription: 'Code',
        isNew: false, isDirty: false
      }]);

      component.onSave();
      tick();

      expect(apiServiceSpy.saveComponentAttribute).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
      expect(component.unitRetrieved()).toBeFalse();
    }));

    it('should not save when canSave returns false', () => {
      component.unitRetrieved.set(false);
      component.onSave();
      expect(apiServiceSpy.saveComponentAttribute).not.toHaveBeenCalled();
    });

    it('should handle save error', fakeAsync(() => {
      component.unitRetrieved.set(true);
      component.validatedUnitId.set('12345678');
      component.searchForm.patchValue({ productCode: 'RBC001' });
      component.attributeRows.set([{
        id: '1', attributeGroup: 'ATTR', attributeCode: 'CODE01',
        attributeGroupDescription: 'Group', attributeCodeDescription: 'Code',
        isNew: false, isDirty: false
      }]);
      apiServiceSpy.saveComponentAttribute.and.returnValue(throwError(() => ({ status: 500 })));

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component.loading()).toBeFalse();
    }));

    it('should include formatted expiration date in payload', fakeAsync(() => {
      component.unitRetrieved.set(true);
      component.validatedUnitId.set('12345678');
      component.searchForm.patchValue({ productCode: 'RBC001' });
      component.unitDetailsForm.patchValue({ expirationDate: '15-JAN-2099 10:30' });
      component.attributeRows.set([{
        id: '1', attributeGroup: 'ATTR', attributeCode: 'CODE01',
        attributeGroupDescription: 'Group', attributeCodeDescription: 'Code',
        isNew: false, isDirty: false
      }]);

      component.onSave();
      tick();

      const payload = apiServiceSpy.saveComponentAttribute.calls.mostRecent().args[0];
      expect(payload.expiryDate).toBe('2099-01-15T10:30:00');
    }));

    it('should set newProductCode when details product code differs from search', fakeAsync(() => {
      component.unitRetrieved.set(true);
      component.validatedUnitId.set('12345678');
      component.searchForm.patchValue({ productCode: 'RBC001' });
      component.unitDetailsForm.patchValue({ productCode: 'PLT01' });
      component.attributeRows.set([{
        id: '1', attributeGroup: 'ATTR', attributeCode: 'CODE01',
        attributeGroupDescription: 'Group', attributeCodeDescription: 'Code',
        isNew: false, isDirty: false
      }]);

      component.onSave();
      tick();

      const payload = apiServiceSpy.saveComponentAttribute.calls.mostRecent().args[0];
      expect(payload.newProductCode).toBe('PLT01');
    }));

    it('should include systemLabelDecision when ABO label matches known label', fakeAsync(() => {
      component.unitRetrieved.set(true);
      component.validatedUnitId.set('12345678');
      component.searchForm.patchValue({ productCode: 'RBC001' });
      component.aboLabels.set([{ code: 'A', description: 'A Positive' }]);
      component.unitDetailsForm.patchValue({ aboLabel: 'A' });
      component.attributeRows.set([{
        id: '1', attributeGroup: 'ATTR', attributeCode: 'CODE01',
        attributeGroupDescription: 'Group', attributeCodeDescription: 'Code',
        isNew: false, isDirty: false
      }]);

      component.onSave();
      tick();

      const payload = apiServiceSpy.saveComponentAttribute.calls.mostRecent().args[0];
      expect(payload.systemLabelDecision).toBe('A');
    }));
  });

  describe('Cancel Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should re-retrieve when unit is already retrieved', fakeAsync(() => {
      component.unitRetrieved.set(true);
      component.validatedUnitId.set('12345678');
      component.unitIdValidated.set(true);
      component.searchForm.patchValue({ productCode: 'RBC001' });

      component.onCancel();
      tick();

      expect(apiServiceSpy.getComponentAttributes).toHaveBeenCalled();
    }));

    it('should clear all when unit is not retrieved', () => {
      component.unitRetrieved.set(false);

      component.onCancel();

      expect(component.unitRetrieved()).toBeFalse();
      expect(component.attributeRows().length).toBe(0);
    });
  });

  describe('Select Interactions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset group search on group select opened', () => {
      component.attribGroupSearch.setValue('test', { emitEvent: false });
      component.onGroupSelectOpened();

      expect(component.attribGroupSearch.value).toBe('');
      expect(component.filteredAttributeGroups.length).toBe(component.attributeGroups().length);
    });

    it('should set current row and load codes on attribute code select opened', fakeAsync(() => {
      const row = {
        id: 'r1', attributeGroup: 'ATTR', attributeCode: '',
        attributeGroupDescription: '', attributeCodeDescription: '',
        isNew: true, isDirty: false
      };
      (component as any).unitCodeScheme = 'I';

      component.onAttributeCodeSelectOpened(row);
      tick();

      expect(apiServiceSpy.getAttributeCodes).toHaveBeenCalledWith('ATTR', 'I');
    }));
  });

  describe('Attribute Code Loading', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).unitCodeScheme = 'I';
    });

    it('should load and cache attribute codes for a row', fakeAsync(() => {
      const row = {
        id: 'r1', attributeGroup: 'ATTR', attributeCode: '',
        attributeGroupDescription: '', attributeCodeDescription: '',
        isNew: true, isDirty: false
      };

      component.loadAttributeCodesForRow(row);
      tick();

      expect(component.rowAttributeCodes.get('r1')).toBeDefined();
      expect(component.rowAttributeCodes.get('r1')!.length).toBe(2);
    }));

    it('should auto-select when only one code available', fakeAsync(() => {
      apiServiceSpy.getAttributeCodes.and.returnValue(of([{ code: 'ONLY1', description: 'Only Code' }]));
      const row = {
        id: 'r2', attributeGroup: 'ATTR', attributeCode: '',
        attributeGroupDescription: '', attributeCodeDescription: '',
        isNew: true, isDirty: false
      };

      component.loadAttributeCodesForRow(row);
      tick();

      expect(row.attributeCode).toBe('ONLY1');
      expect(row.isDirty).toBeTrue();
    }));

    it('should skip loading if group is empty', fakeAsync(() => {
      const row = {
        id: 'r3', attributeGroup: '', attributeCode: '',
        attributeGroupDescription: '', attributeCodeDescription: '',
        isNew: true, isDirty: false
      };

      component.loadAttributeCodesForRow(row);
      tick();

      expect(apiServiceSpy.getAttributeCodes).not.toHaveBeenCalled();
    }));

    it('should skip loading if codes already cached', fakeAsync(() => {
      const row = {
        id: 'r4', attributeGroup: 'ATTR', attributeCode: '',
        attributeGroupDescription: '', attributeCodeDescription: '',
        isNew: true, isDirty: false
      };
      component.rowAttributeCodes.set('r4', mockAttributeCodes);

      component.loadAttributeCodesForRow(row);
      tick();

      expect(apiServiceSpy.getAttributeCodes).not.toHaveBeenCalled();
    }));

    it('should handle load error with fallback to stored code', fakeAsync(() => {
      apiServiceSpy.getAttributeCodes.and.returnValue(throwError(() => new Error('Network error')));
      const row = {
        id: 'r5', attributeGroup: 'ATTR', attributeCode: 'EXISTING',
        attributeGroupDescription: '', attributeCodeDescription: 'Existing Code',
        isNew: false, isDirty: false
      };

      component.loadAttributeCodesForRow(row);
      tick();

      expect(component.rowAttributeCodes.get('r5')?.length).toBe(1);
      expect(component.rowAttributeCodes.get('r5')![0].code).toBe('EXISTING');
    }));

    it('should inject historical code not returned by API', fakeAsync(() => {
      apiServiceSpy.getAttributeCodes.and.returnValue(of([{ code: 'NEW1', description: 'New Code' }]));
      const row = {
        id: 'r6', attributeGroup: 'ATTR', attributeCode: 'OLD_CODE',
        attributeGroupDescription: '', attributeCodeDescription: 'Old Code',
        isNew: false, isDirty: false
      };

      component.loadAttributeCodesForRow(row);
      tick();

      const codes = component.rowAttributeCodes.get('r6')!;
      expect(codes.length).toBe(2);
      expect(codes.some(c => c.code === 'OLD_CODE')).toBeTrue();
    }));
  });

  describe('canSave Computed', () => {
    it('should return true when all conditions met', () => {
      fixture.detectChanges();
      component.unitRetrieved.set(true);
      component.attributeRows.set([{
        id: '1', attributeGroup: 'ATTR', attributeCode: 'CODE01',
        attributeGroupDescription: 'G', attributeCodeDescription: 'C',
        isNew: false, isDirty: false
      }]);

      expect((component as any).canSave()).toBeTrue();
    });

    it('should return false when no rows', () => {
      fixture.detectChanges();
      component.unitRetrieved.set(true);
      component.attributeRows.set([]);

      expect((component as any).canSave()).toBeFalse();
    });

    it('should return false when rows have empty group', () => {
      fixture.detectChanges();
      component.unitRetrieved.set(true);
      component.attributeRows.set([{
        id: '1', attributeGroup: '', attributeCode: 'CODE01',
        attributeGroupDescription: '', attributeCodeDescription: '',
        isNew: true, isDirty: false
      }]);

      expect((component as any).canSave()).toBeFalse();
    });

    it('should return false when unit not retrieved', () => {
      fixture.detectChanges();
      component.unitRetrieved.set(false);
      component.attributeRows.set([{
        id: '1', attributeGroup: 'ATTR', attributeCode: 'CODE01',
        attributeGroupDescription: '', attributeCodeDescription: '',
        isNew: false, isDirty: false
      }]);

      expect((component as any).canSave()).toBeFalse();
    });

    it('should return false when rows have empty code', () => {
      fixture.detectChanges();
      component.unitRetrieved.set(true);
      component.attributeRows.set([{
        id: '1', attributeGroup: 'ATTR', attributeCode: '',
        attributeGroupDescription: '', attributeCodeDescription: '',
        isNew: true, isDirty: false
      }]);

      expect((component as any).canSave()).toBeFalse();
    });
  });

  describe('Chapter Changes', () => {
    it('should clear and reload on chapter change', fakeAsync(() => {
      fixture.detectChanges();

      component.unitRetrieved.set(true);
      component.attributeRows.set([{
        id: '1', attributeGroup: 'A', attributeCode: 'B',
        attributeGroupDescription: '', attributeCodeDescription: '',
        isNew: false, isDirty: false
      }]);

      chapterChangedSubject.next();
      tick();

      expect(component.unitRetrieved()).toBeFalse();
      expect(component.attributeRows().length).toBe(0);
      expect(apiServiceSpy.getAttributeGroups).toHaveBeenCalled();
    }));
  });

  describe('Row Actions', () => {
    it('should handle delete row action via onRowAction', () => {
      fixture.detectChanges();
      const row = {
        id: 'test-1', attributeGroup: 'ATTR', attributeCode: 'CODE01',
        attributeGroupDescription: '', attributeCodeDescription: '',
        isNew: true, isDirty: false
      };
      component.attributeRows.set([row]);

      component.onRowAction({ action: 'delete', row });

      expect(component.attributeRows().length).toBe(0);
    });

    it('should clean up row attribute codes cache on delete', () => {
      fixture.detectChanges();
      const row = {
        id: 'del-1', attributeGroup: 'ATTR', attributeCode: 'CODE01',
        attributeGroupDescription: '', attributeCodeDescription: '',
        isNew: true, isDirty: false
      };
      component.attributeRows.set([row]);
      component.rowAttributeCodes.set('del-1', mockAttributeCodes);
      component.filteredCodesByRow = { 'del-1': mockAttributeCodes };

      component.onDeleteRow(row);

      expect(component.rowAttributeCodes.has('del-1')).toBeFalse();
      expect(component.filteredCodesByRow['del-1']).toBeUndefined();
    });
  });

  describe('Retrieve Edge Cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should populate unit details from first record', fakeAsync(() => {
      component.validatedUnitId.set('12345678');
      component.unitIdValidated.set(true);
      component.searchForm.patchValue({ productCode: 'RBC001' });

      component.onRetrieve();
      tick();

      expect(component.unitDetailsFormControls['contractId'].value).toBe('CONTRACT01');
      expect(component.unitDetailsFormControls['batchId'].value).toBe('BATCH001');
    }));

    it('should not retrieve with invalid search form', fakeAsync(() => {
      component.unitIdValidated.set(true);
      component.validatedUnitId.set('12345678');
      component.searchForm.get('productCode')?.setValue('');

      component.onRetrieve();
      tick();

      expect(apiServiceSpy.getComponentAttributes).not.toHaveBeenCalled();
    }));

    it('should inject historical attribute groups not in active list', fakeAsync(() => {
      const historicalAttr: ComponentAttributeModel = {
        ...mockComponentAttribute,
        attributeGroup: 'HIST',
        attributeGroupDescription: 'Historical Group'
      };
      apiServiceSpy.getComponentAttributes.and.returnValue(of({ data: [historicalAttr], total: 1 }));

      component.validatedUnitId.set('12345678');
      component.unitIdValidated.set(true);
      component.searchForm.patchValue({ productCode: 'RBC001' });

      component.onRetrieve();
      tick();

      const groups = component.attributeGroups();
      expect(groups.some(g => g.code === 'HIST')).toBeTrue();
    }));

    it('should show success snackbar with attribute count', fakeAsync(() => {
      component.validatedUnitId.set('12345678');
      component.unitIdValidated.set(true);
      component.searchForm.patchValue({ productCode: 'RBC001' });

      component.onRetrieve();
      tick();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith(
        jasmine.stringContaining('1 attribute(s)')
      );
    }));
  });

  describe('Attribute Group Change', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).unitCodeScheme = 'I';
    });

    it('should clear attribute code and load new codes on group change', fakeAsync(() => {
      const row = {
        id: 'gc-1', attributeGroup: 'OLD', attributeCode: 'OLDCODE',
        attributeGroupDescription: '', attributeCodeDescription: 'Old desc',
        isNew: false, isDirty: false
      };
      component.attributeRows.set([row]);

      component.onAttributeGroupChange(row, 'ATTR');
      tick();

      expect(row.attributeGroup).toBe('ATTR');
      expect(row.attributeCode).toBe('');
      expect(row.attributeCodeDescription).toBe('');
      expect(row.isDirty).toBeTrue();
      expect(row.attributeGroupDescription).toBe('Attribute Group 1');
    }));
  });

  describe('Form Accessors', () => {
    it('should expose searchFormControls', () => {
      fixture.detectChanges();
      expect(component.searchFormControls['productCode']).toBeDefined();
    });

    it('should expose unitDetailsFormControls', () => {
      fixture.detectChanges();
      expect(component.unitDetailsFormControls['contractId']).toBeDefined();
      expect(component.unitDetailsFormControls['expirationDate']).toBeDefined();
    });
  });
});
