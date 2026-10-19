import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';

import { SpStepAddProductsComponent } from './sp-step-add-products';
import { SpecialOrderApiService } from '../services/special-order-api.service';
import { SpecialOrderItemDto, LookupItem } from '../models/special-order.model';

describe('SpStepAddProductsComponent', () => {
  let component: SpStepAddProductsComponent;
  let fixture: ComponentFixture<SpStepAddProductsComponent>;
  let apiSpy: jasmine.SpyObj<SpecialOrderApiService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('SpecialOrderApiService', [
      'getProductTypesLookup',
      'getBloodTypesLookup',
      'getTiersLookup',
      'getAttributeGroupsLookup',
      'getAttributeCodesLookup',
      'getAntigenCodesLookup',
      'getSourceProductsLookup',
      'checkInventoryStock',
      'getItemAntigens',
      'addItemAntigen',
      'deleteItemAntigen'
    ]);
    // Set default returns for all spies
    apiSpy.getProductTypesLookup.and.returnValue(of([]));
    apiSpy.getBloodTypesLookup.and.returnValue(of([]));
    apiSpy.getTiersLookup.and.returnValue(of([]));
    apiSpy.getAttributeGroupsLookup.and.returnValue(of([]));
    apiSpy.getAttributeCodesLookup.and.returnValue(of([]));
    apiSpy.getAntigenCodesLookup.and.returnValue(of([]));
    apiSpy.getSourceProductsLookup.and.returnValue(of([]));
    apiSpy.checkInventoryStock.and.returnValue(of(null));
    apiSpy.getItemAntigens.and.returnValue(of([]));
    apiSpy.addItemAntigen.and.returnValue(of([]));
    apiSpy.deleteItemAntigen.and.returnValue(of(true));

    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      imports: [
        SpStepAddProductsComponent,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: SpecialOrderApiService, useValue: apiSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    TestBed.overrideComponent(SpStepAddProductsComponent, {
      add: {
        providers: [
          { provide: MatDialog, useValue: dialogSpy },
          { provide: MatSnackBar, useValue: snackBarSpy }
        ]
      }
    });

    fixture = TestBed.createComponent(SpStepAddProductsComponent);
    component = fixture.componentInstance;
  });

  // ── Creation ──

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // ── Form initialization ──

  describe('initializeForm', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should initialize newItemForm with all expected controls', () => {
      expect(component.newItemForm).toBeTruthy();
      const expectedControls = [
        'productType', 'bloodType', 'requiredQty', 'specialFlag',
        'tier', 'group', 'attributeCode', 'antigenCode',
        'attributeSource', 'attributeQty'
      ];
      for (const ctrl of expectedControls) {
        expect(component.newItemForm.get(ctrl)).toBeTruthy(`Missing control: ${ctrl}`);
      }
    });

    it('should set productType as required', () => {
      const ctrl = component.newItemForm.get('productType')!;
      ctrl.setValue('');
      expect(ctrl.hasError('required')).toBeTrue();
    });

    it('should set bloodType as required', () => {
      const ctrl = component.newItemForm.get('bloodType')!;
      ctrl.setValue('');
      expect(ctrl.hasError('required')).toBeTrue();
    });

    it('should set requiredQty as required with min(1) and max(998)', () => {
      const ctrl = component.newItemForm.get('requiredQty')!;
      ctrl.setValue(null);
      expect(ctrl.hasError('required')).toBeTrue();
      ctrl.setValue(0);
      expect(ctrl.hasError('min')).toBeTrue();
      ctrl.setValue(999);
      expect(ctrl.hasError('max')).toBeTrue();
    });

    it('should set specialFlag as required (Gap #12)', () => {
      const ctrl = component.newItemForm.get('specialFlag')!;
      ctrl.setValue('');
      expect(ctrl.hasError('required')).toBeTrue();
    });

    it('should set tier as required', () => {
      const ctrl = component.newItemForm.get('tier')!;
      ctrl.setValue('');
      expect(ctrl.hasError('required')).toBeTrue();
    });

    it('should not set group as required', () => {
      const ctrl = component.newItemForm.get('group')!;
      ctrl.setValue('');
      expect(ctrl.hasError('required')).toBeFalse();
    });

    it('should not set attributeCode as required', () => {
      const ctrl = component.newItemForm.get('attributeCode')!;
      ctrl.setValue('');
      expect(ctrl.hasError('required')).toBeFalse();
    });

    it('should not set antigenCode as required', () => {
      const ctrl = component.newItemForm.get('antigenCode')!;
      ctrl.setValue('');
      expect(ctrl.hasError('required')).toBeFalse();
    });
  });

  // ── Gap #7: requiredQty max(998) validator ──

  describe('Gap #7: requiredQty max(998) validator', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reject values >= 999', () => {
      const ctrl = component.newItemForm.get('requiredQty')!;
      ctrl.setValue(999);
      expect(ctrl.hasError('max')).toBeTrue();
      ctrl.setValue(1000);
      expect(ctrl.hasError('max')).toBeTrue();
    });

    it('should accept values <= 998', () => {
      const ctrl = component.newItemForm.get('requiredQty')!;
      ctrl.setValue(998);
      expect(ctrl.hasError('max')).toBeFalse();
      ctrl.setValue(1);
      expect(ctrl.hasError('max')).toBeFalse();
      ctrl.setValue(500);
      expect(ctrl.hasError('max')).toBeFalse();
    });
  });

  // ── Gap #2: loadLookups passes customerId/consigneeId ──

  describe('Gap #2: loadLookups passes customerId/consigneeId', () => {
    it('should call getProductTypesLookup with customerId and consigneeId', () => {
      component.customerId = 'CUST001';
      component.consigneeId = 'CON001';
      fixture.detectChanges();
      expect(apiSpy.getProductTypesLookup).toHaveBeenCalledWith('CUST001', 'CON001');
    });

    it('should call getAttributeGroupsLookup', () => {
      fixture.detectChanges();
      expect(apiSpy.getAttributeGroupsLookup).toHaveBeenCalled();
    });

    it('should call getAntigenCodesLookup', () => {
      fixture.detectChanges();
      expect(apiSpy.getAntigenCodesLookup).toHaveBeenCalled();
    });
  });

  // ── Gap #2: ngOnChanges reloads product types ──

  describe('Gap #2: ngOnChanges reloads product types', () => {
    beforeEach(() => {
      fixture.detectChanges();
      apiSpy.getProductTypesLookup.calls.reset();
    });

    it('should reload product types when customerId changes', () => {
      component.customerId = 'CUST002';
      component.ngOnChanges({
        customerId: new SimpleChange('CUST001', 'CUST002', false)
      });
      expect(apiSpy.getProductTypesLookup).toHaveBeenCalledWith('CUST002', component.consigneeId);
    });

    it('should reload product types when consigneeId changes', () => {
      component.consigneeId = 'CON002';
      component.ngOnChanges({
        consigneeId: new SimpleChange('CON001', 'CON002', false)
      });
      expect(apiSpy.getProductTypesLookup).toHaveBeenCalledWith(component.customerId, 'CON002');
    });
  });

  // ── watchProductTypeChanges ──

  describe('watchProductTypeChanges', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear blood types, tiers, sources when productType changes', () => {
      const mockBloodTypes: LookupItem[] = [{ code: 'A+', description: 'A Positive' }];
      apiSpy.getBloodTypesLookup.and.returnValue(of(mockBloodTypes));
      apiSpy.getTiersLookup.and.returnValue(of([]));
      apiSpy.getSourceProductsLookup.and.returnValue(of([]));

      component.newItemForm.get('productType')!.setValue('RBC');
      expect(component.newItemForm.get('bloodType')!.value).toBe('');
      expect(component.newItemForm.get('tier')!.value).toBeNull();
      expect(component.newItemForm.get('attributeSource')!.value).toBe('');
    });

    it('should load blood types for selected productType', () => {
      const mockBloodTypes: LookupItem[] = [{ code: 'A+', description: 'A Positive' }];
      apiSpy.getBloodTypesLookup.and.returnValue(of(mockBloodTypes));
      apiSpy.getTiersLookup.and.returnValue(of([]));
      apiSpy.getSourceProductsLookup.and.returnValue(of([]));

      component.newItemForm.get('productType')!.setValue('RBC');
      expect(apiSpy.getBloodTypesLookup).toHaveBeenCalledWith('RBC');
      expect(component.bloodTypes()).toEqual(mockBloodTypes);
      expect(component.filteredBloodTypes()).toEqual(mockBloodTypes);
    });

    it('should load tiers for selected productType', () => {
      const mockTiers = [{ code: '1', description: 'Tier 1', unitPrice: 100 }];
      apiSpy.getBloodTypesLookup.and.returnValue(of([]));
      apiSpy.getTiersLookup.and.returnValue(of(mockTiers));
      apiSpy.getSourceProductsLookup.and.returnValue(of([]));

      component.newItemForm.get('productType')!.setValue('RBC');
      expect(apiSpy.getTiersLookup).toHaveBeenCalledWith('RBC');
      expect(component.tiers()).toEqual(mockTiers);
      expect(component.filteredTiers()).toEqual(mockTiers);
    });

    it('should load source products for selected productType', () => {
      const mockSources: LookupItem[] = [{ code: 'SRC1', description: 'Source 1' }];
      apiSpy.getBloodTypesLookup.and.returnValue(of([]));
      apiSpy.getTiersLookup.and.returnValue(of([]));
      apiSpy.getSourceProductsLookup.and.returnValue(of(mockSources));

      component.newItemForm.get('productType')!.setValue('RBC');
      expect(apiSpy.getSourceProductsLookup).toHaveBeenCalledWith('RBC');
      expect(component.attributeSources()).toEqual(mockSources);
      expect(component.filteredAttributeSources()).toEqual(mockSources);
    });

    it('should not load anything when productType is cleared', () => {
      apiSpy.getBloodTypesLookup.calls.reset();
      apiSpy.getTiersLookup.calls.reset();
      apiSpy.getSourceProductsLookup.calls.reset();

      component.newItemForm.get('productType')!.setValue('');
      expect(apiSpy.getBloodTypesLookup).not.toHaveBeenCalled();
      expect(apiSpy.getTiersLookup).not.toHaveBeenCalled();
      expect(apiSpy.getSourceProductsLookup).not.toHaveBeenCalled();
    });
  });

  // ── watchGroupChanges ──

  describe('watchGroupChanges', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear attribute codes when group changes', () => {
      const mockCodes: LookupItem[] = [{ code: 'ATTR1', description: 'Attribute 1' }];
      apiSpy.getAttributeCodesLookup.and.returnValue(of(mockCodes));

      component.newItemForm.get('group')!.setValue('GRP1');
      expect(component.newItemForm.get('attributeCode')!.value).toBe('');
    });

    it('should load attribute codes for selected group', () => {
      const mockCodes: LookupItem[] = [{ code: 'ATTR1', description: 'Attribute 1' }];
      apiSpy.getAttributeCodesLookup.and.returnValue(of(mockCodes));

      component.newItemForm.get('group')!.setValue('GRP1');
      expect(apiSpy.getAttributeCodesLookup).toHaveBeenCalledWith('GRP1');
      expect(component.attributeCodes()).toEqual(mockCodes);
      expect(component.filteredAttributeCodes()).toEqual(mockCodes);
    });

    it('should not load codes when group is cleared', () => {
      apiSpy.getAttributeCodesLookup.calls.reset();

      component.newItemForm.get('group')!.setValue('');
      expect(apiSpy.getAttributeCodesLookup).not.toHaveBeenCalled();
    });
  });

  // ── Gap #6: POOL/SPLIT validators ──

  describe('Gap #6: POOL/SPLIT validators', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should add required validator to attributeSource when group is POOL', () => {
      component.newItemForm.get('group')!.setValue('POOL');
      const attrSource = component.newItemForm.get('attributeSource')!;
      attrSource.setValue('');
      expect(attrSource.hasError('required')).toBeTrue();
    });

    it('should add required validator to attributeQty when group is SPLIT', () => {
      component.newItemForm.get('group')!.setValue('SPLIT');
      const attrQty = component.newItemForm.get('attributeQty')!;
      attrQty.setValue(null);
      expect(attrQty.hasError('required')).toBeTrue();
    });

    it('should remove validators from attributeSource/attributeQty when group is not POOL/SPLIT', () => {
      // First set to POOL to add validators
      component.newItemForm.get('group')!.setValue('POOL');
      // Then change to a non-POOL/SPLIT value
      component.newItemForm.get('group')!.setValue('OTHER');

      const attrSource = component.newItemForm.get('attributeSource')!;
      const attrQty = component.newItemForm.get('attributeQty')!;
      attrSource.setValue('');
      attrQty.setValue(null);

      expect(attrSource.hasError('required')).toBeFalse();
      expect(attrQty.hasError('required')).toBeFalse();
    });

    it('should clear errors when group changes away from POOL/SPLIT', () => {
      component.newItemForm.get('group')!.setValue('POOL');
      const attrSource = component.newItemForm.get('attributeSource')!;
      const attrQty = component.newItemForm.get('attributeQty')!;
      attrSource.setValue('');
      attrQty.setValue(null);
      // Errors should be present
      expect(attrSource.errors).toBeTruthy();
      expect(attrQty.errors).toBeTruthy();

      // Change away from POOL
      component.newItemForm.get('group')!.setValue('OTHER');
      expect(attrSource.errors).toBeNull();
      expect(attrQty.errors).toBeNull();
    });
  });

  // ── Gap #3: toggleItemExpand / isItemExpanded ──

  describe('Gap #3: toggleItemExpand / isItemExpanded', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.orderData = { orderNo: 'ORD001' };
      component.orderItems = [
        { orderNo: 'ORD001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 5, itemStatus: 'OR', allocatedQty: 0, shippedQty: 0 }
      ] as SpecialOrderItemDto[];
    });

    it('should expand item and add to expandedItems set', () => {
      component.toggleItemExpand(1);
      expect(component.expandedItems().has(1)).toBeTrue();
    });

    it('should collapse item when already expanded', () => {
      component.toggleItemExpand(1);
      expect(component.expandedItems().has(1)).toBeTrue();
      component.toggleItemExpand(1);
      expect(component.expandedItems().has(1)).toBeFalse();
    });

    it('isItemExpanded should return true for expanded item', () => {
      component.toggleItemExpand(1);
      expect(component.isItemExpanded(1)).toBeTrue();
    });

    it('isItemExpanded should return false for non-expanded item', () => {
      expect(component.isItemExpanded(99)).toBeFalse();
    });
  });

  // ── Gap #3: loadItemAntigens ──

  describe('Gap #3: loadItemAntigens', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call getItemAntigens API and update signal when expanding item', () => {
      const mockAntigens = [{ antigenId: 'AG1', antigenDesc: 'Antigen 1' }];
      apiSpy.getItemAntigens.and.returnValue(of(mockAntigens));

      component.orderData = { orderNo: 'ORD001' };
      component.orderItems = [
        { orderNo: 'ORD001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 5, itemStatus: 'OR', allocatedQty: 0, shippedQty: 0 }
      ] as SpecialOrderItemDto[];

      component.toggleItemExpand(1);
      expect(apiSpy.getItemAntigens).toHaveBeenCalledWith('ORD001', 1);
      expect(component.itemAntigens().get(1)).toEqual(mockAntigens);
    });

    it('should not call API when orderNo is missing', () => {
      component.orderData = null;
      apiSpy.getItemAntigens.calls.reset();

      component.toggleItemExpand(1);
      expect(apiSpy.getItemAntigens).not.toHaveBeenCalled();
    });
  });

  // ── Gap #3 + Gap #8: onAddItemAntigen ──

  describe('Gap #3 + Gap #8: onAddItemAntigen', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.orderData = { orderNo: 'ORD001' };
    });

    it('should show duplicate error snackbar when antigen already exists', () => {
      const existingAntigens = [{ antigenId: 'AG1', antigenDesc: 'Antigen 1' }];
      component.itemAntigens.set(new Map([[1, existingAntigens]]));
      component.getExpandedAntigenCodeCtrl(1).setValue('AG1');

      component.onAddItemAntigen(1);
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('AG1 is already added'),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
      expect(apiSpy.addItemAntigen).not.toHaveBeenCalled();
    });

    it('should call addItemAntigen API and update signal on success', () => {
      const newAntigens = [{ antigenId: 'AG1', antigenDesc: 'Antigen 1' }];
      apiSpy.addItemAntigen.and.returnValue(of(newAntigens));
      component.getExpandedAntigenCodeCtrl(1).setValue('AG1');

      component.onAddItemAntigen(1);
      expect(apiSpy.addItemAntigen).toHaveBeenCalledWith('ORD001', 1, 'AG1');
      expect(component.itemAntigens().get(1)).toEqual(newAntigens);
    });

    it('should not call API when antigenCode is empty', () => {
      component.getExpandedAntigenCodeCtrl(1).setValue('');
      component.onAddItemAntigen(1);
      expect(apiSpy.addItemAntigen).not.toHaveBeenCalled();
    });

    it('should not call API when orderNo is missing', () => {
      component.orderData = null;
      component.getExpandedAntigenCodeCtrl(1).setValue('AG1');
      component.onAddItemAntigen(1);
      expect(apiSpy.addItemAntigen).not.toHaveBeenCalled();
    });

    it('should show error snackbar on API failure', () => {
      apiSpy.addItemAntigen.and.returnValue(throwError(() => new Error('Server error')));
      component.getExpandedAntigenCodeCtrl(1).setValue('AG1');

      component.onAddItemAntigen(1);
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Failed to add antigen. Please try again.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });
  });

  // ── Gap #3: onDeleteItemAntigen ──

  describe('Gap #3: onDeleteItemAntigen', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.orderData = { orderNo: 'ORD001' };
    });

    it('should call deleteItemAntigen API', () => {
      apiSpy.deleteItemAntigen.and.returnValue(of(true));
      component.onDeleteItemAntigen(1, 'AG1');
      expect(apiSpy.deleteItemAntigen).toHaveBeenCalledWith('ORD001', 1, 'AG1');
    });

    it('should reload antigens on success', () => {
      apiSpy.deleteItemAntigen.and.returnValue(of(true));
      apiSpy.getItemAntigens.and.returnValue(of([]));

      component.onDeleteItemAntigen(1, 'AG1');
      expect(apiSpy.getItemAntigens).toHaveBeenCalledWith('ORD001', 1);
    });

    it('should not call API when orderNo is missing', () => {
      component.orderData = null;
      apiSpy.deleteItemAntigen.calls.reset();

      component.onDeleteItemAntigen(1, 'AG1');
      expect(apiSpy.deleteItemAntigen).not.toHaveBeenCalled();
    });

    it('should show error snackbar on failure', () => {
      apiSpy.deleteItemAntigen.and.returnValue(throwError(() => new Error('Server error')));

      component.onDeleteItemAntigen(1, 'AG1');
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Failed to delete antigen. Please try again.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });
  });

  // ── Gap #3: onAddItemAttribute ──

  describe('Gap #3: onAddItemAttribute', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should add attribute to itemAttributes map', () => {
      component.getExpandedAttribGroupCtrl(1).setValue('GRP1');
      component.getExpandedAttribCodeCtrl(1).setValue('CODE1');
      component.getExpandedAttribSourceCtrl(1).setValue('SRC1');
      component.getExpandedAttribQtyCtrl(1).setValue(5);

      component.onAddItemAttribute(1);

      const attrs = component.itemAttributes().get(1);
      expect(attrs).toBeTruthy();
      expect(attrs!.length).toBe(1);
      expect(attrs![0]).toEqual(jasmine.objectContaining({
        group: 'GRP1',
        code: 'CODE1',
        source: 'SRC1',
        qty: 5
      }));
    });

    it('should show error when group or code is missing', () => {
      component.getExpandedAttribGroupCtrl(1).setValue('');
      component.getExpandedAttribCodeCtrl(1).setValue('');

      component.onAddItemAttribute(1);
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Group and Code are required to add an attribute',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should reset form controls after adding', () => {
      component.getExpandedAttribGroupCtrl(1).setValue('GRP1');
      component.getExpandedAttribCodeCtrl(1).setValue('CODE1');
      component.getExpandedAttribSourceCtrl(1).setValue('SRC1');
      component.getExpandedAttribQtyCtrl(1).setValue(5);

      component.onAddItemAttribute(1);

      expect(component.getExpandedAttribGroupCtrl(1).value).toBe('');
      expect(component.getExpandedAttribCodeCtrl(1).value).toBe('');
      expect(component.getExpandedAttribSourceCtrl(1).value).toBe('');
      expect(component.getExpandedAttribQtyCtrl(1).value).toBeNull();
    });
  });

  // ── Gap #3: onDeleteItemAttribute ──

  describe('Gap #3: onDeleteItemAttribute', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should remove attribute at specified index', () => {
      // Manually add two attributes
      component.getExpandedAttribGroupCtrl(1).setValue('GRP1');
      component.getExpandedAttribCodeCtrl(1).setValue('CODE1');
      component.onAddItemAttribute(1);

      component.getExpandedAttribGroupCtrl(1).setValue('GRP2');
      component.getExpandedAttribCodeCtrl(1).setValue('CODE2');
      component.onAddItemAttribute(1);

      expect(component.itemAttributes().get(1)!.length).toBe(2);

      component.onDeleteItemAttribute(1, 0);
      const remaining = component.itemAttributes().get(1)!;
      expect(remaining.length).toBe(1);
      expect(remaining[0].group).toBe('GRP2');
    });
  });

  // ── onAddItem ──

  describe('onAddItem', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not emit when form is invalid', () => {
      spyOn(component.itemAdded, 'emit');
      component.onAddItem();
      expect(component.itemAdded.emit).not.toHaveBeenCalled();
    });

    it('should mark form as touched when invalid', () => {
      spyOn(component.newItemForm, 'markAllAsTouched');
      component.onAddItem();
      expect(component.newItemForm.markAllAsTouched).toHaveBeenCalled();
    });

    it('should emit itemAdded with correct DTO when form is valid', () => {
      spyOn(component.itemAdded, 'emit');
      component.tiers.set([{ code: '1', description: 'Tier 1', unitPrice: 150 }]);

      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'A+',
        requiredQty: 5,
        specialFlag: 'Y',
        tier: '1',
        group: '',
        attributeCode: '',
        antigenCode: ''
      });

      component.onAddItem();
      expect(component.itemAdded.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        itemNo: 1,
        productType: 'RBC',
        bloodType: 'A+',
        requiredQty: 5,
        tier: 1,
        unitPrice: 150
      }));
    });

    it('should reset form after adding item', () => {
      component.tiers.set([{ code: '1', description: 'Tier 1', unitPrice: 150 }]);

      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'A+',
        requiredQty: 5,
        specialFlag: 'Y',
        tier: '1'
      });

      component.onAddItem();
      expect(component.newItemForm.get('productType')!.value).toBeFalsy();
    });

    it('should set tier error when tier <= 0', () => {
      spyOn(component.itemAdded, 'emit');
      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'A+',
        requiredQty: 5,
        specialFlag: 'Y',
        tier: '0'
      });

      component.onAddItem();
      expect(component.newItemForm.get('tier')!.hasError('required')).toBeTrue();
      expect(component.itemAdded.emit).not.toHaveBeenCalled();
    });
  });

  // ── onDeleteItem ──

  describe('onDeleteItem', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit itemDeleted with itemNo', () => {
      spyOn(component.itemDeleted, 'emit');
      component.onDeleteItem(3);
      expect(component.itemDeleted.emit).toHaveBeenCalledWith(3);
    });
  });

  // ── nextItemNumber ──

  describe('nextItemNumber', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return 1 when no items exist', () => {
      component.orderItems = [];
      expect(component.nextItemNumber).toBe(1);
    });

    it('should return max itemNo + 1', () => {
      component.orderItems = [
        { orderNo: 'ORD001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 5, itemStatus: 'OR', allocatedQty: 0, shippedQty: 0 },
        { orderNo: 'ORD001', itemNo: 3, productType: 'PLT', bloodType: 'B+', tier: 2, requiredQty: 3, itemStatus: 'OR', allocatedQty: 0, shippedQty: 0 },
        { orderNo: 'ORD001', itemNo: 2, productType: 'FFP', bloodType: 'O+', tier: 1, requiredQty: 2, itemStatus: 'OR', allocatedQty: 0, shippedQty: 0 }
      ] as SpecialOrderItemDto[];
      expect(component.nextItemNumber).toBe(4);
    });
  });

  // ── getItemStatus ──

  describe('getItemStatus', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it("should return 'Ordered' for 'OR'", () => {
      const item = { itemStatus: 'OR' } as SpecialOrderItemDto;
      expect(component.getItemStatus(item)).toBe('Ordered');
    });

    it("should return 'Canceled' for 'CA'", () => {
      const item = { itemStatus: 'CA' } as SpecialOrderItemDto;
      expect(component.getItemStatus(item)).toBe('Canceled');
    });

    it('should return code when not in labels map', () => {
      const item = { itemStatus: 'XX' } as SpecialOrderItemDto;
      expect(component.getItemStatus(item)).toBe('XX');
    });

    it("should default to 'Ordered' when itemStatus is empty", () => {
      const item = { itemStatus: '' } as SpecialOrderItemDto;
      expect(component.getItemStatus(item)).toBe('Ordered');
    });
  });

  // ── getItemBloodType / getItemBloodTypeDisplay ──

  describe('getItemBloodType / getItemBloodTypeDisplay', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it("should return bloodType or '--'", () => {
      expect(component.getItemBloodType({ bloodType: 'A+' } as SpecialOrderItemDto)).toBe('A+');
      expect(component.getItemBloodType({ bloodType: '' } as SpecialOrderItemDto)).toBe('--');
      expect(component.getItemBloodType({} as SpecialOrderItemDto)).toBe('--');
    });

    it('should return bloodTypeDesc when available', () => {
      expect(component.getItemBloodTypeDisplay(
        { bloodType: 'A+', bloodTypeDesc: 'A Positive' } as SpecialOrderItemDto
      )).toBe('A Positive');
    });

    it('should return bloodType when bloodTypeDesc is not available', () => {
      expect(component.getItemBloodTypeDisplay(
        { bloodType: 'A+' } as SpecialOrderItemDto
      )).toBe('A+');
    });

    it("should return '--' when bloodType is empty", () => {
      expect(component.getItemBloodTypeDisplay({ bloodType: '' } as SpecialOrderItemDto)).toBe('--');
      expect(component.getItemBloodTypeDisplay({} as SpecialOrderItemDto)).toBe('--');
    });
  });

  // ── Lazy form control getters ──

  describe('Lazy form control getters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should create and return FormControl for expanded antigen code', () => {
      const ctrl = component.getExpandedAntigenCodeCtrl(1);
      expect(ctrl).toBeInstanceOf(FormControl);
      expect(ctrl.value).toBe('');
    });

    it('should reuse existing FormControl', () => {
      const ctrl1 = component.getExpandedAntigenCodeCtrl(1);
      const ctrl2 = component.getExpandedAntigenCodeCtrl(1);
      expect(ctrl1).toBe(ctrl2);
    });

    it('should create separate controls for different item numbers', () => {
      const ctrl1 = component.getExpandedAntigenCodeCtrl(1);
      const ctrl2 = component.getExpandedAntigenCodeCtrl(2);
      expect(ctrl1).not.toBe(ctrl2);
    });

    it('should create and return FormControl for expanded antigen code search', () => {
      const ctrl = component.getExpandedAntigenCodeSearchCtrl(1);
      expect(ctrl).toBeInstanceOf(FormControl);
    });

    it('should create and return FormControl for expanded attrib group', () => {
      const ctrl = component.getExpandedAttribGroupCtrl(1);
      expect(ctrl).toBeInstanceOf(FormControl);
    });

    it('should create and return FormControl for expanded attrib code', () => {
      const ctrl = component.getExpandedAttribCodeCtrl(1);
      expect(ctrl).toBeInstanceOf(FormControl);
    });

    it('should create and return FormControl for expanded attrib source', () => {
      const ctrl = component.getExpandedAttribSourceCtrl(1);
      expect(ctrl).toBeInstanceOf(FormControl);
    });

    it('should create and return FormControl for expanded attrib qty', () => {
      const ctrl = component.getExpandedAttribQtyCtrl(1);
      expect(ctrl).toBeInstanceOf(FormControl);
      expect(ctrl.value).toBeNull();
    });
  });

  // ── onExpandedGroupChange ──

  describe('onExpandedGroupChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear and load new attribute codes', () => {
      const mockCodes: LookupItem[] = [{ code: 'AC1', description: 'Attr Code 1' }];
      apiSpy.getAttributeCodesLookup.and.returnValue(of(mockCodes));

      component.onExpandedGroupChange(1, 'GRP1');

      expect(apiSpy.getAttributeCodesLookup).toHaveBeenCalledWith('GRP1');
      expect(component.expandedAttributeCodes[1]).toEqual(mockCodes);
      expect(component.filteredExpandedAttributeCodes[1]).toEqual(mockCodes);
      expect(component.getExpandedAttribCodeCtrl(1).value).toBe('');
    });

    it('should not load when group is empty', () => {
      apiSpy.getAttributeCodesLookup.calls.reset();

      component.onExpandedGroupChange(1, '');
      expect(apiSpy.getAttributeCodesLookup).not.toHaveBeenCalled();
      expect(component.expandedAttributeCodes[1]).toEqual([]);
      expect(component.filteredExpandedAttributeCodes[1]).toEqual([]);
    });
  });

  // ── watchRequiredQtyChanges (inventory check) ──

  describe('watchRequiredQtyChanges', () => {
    it('should call checkInventoryStock when qty, productType, and bloodType are all set', fakeAsync(() => {
      apiSpy.checkInventoryStock.and.returnValue(of(null));
      fixture.detectChanges();

      component.newItemForm.get('productType')!.setValue('RBC');
      component.newItemForm.get('bloodType')!.setValue('A+');
      component.newItemForm.get('requiredQty')!.setValue(5);
      tick(600);

      expect(apiSpy.checkInventoryStock).toHaveBeenCalled();
    }));

    it('should open warning dialog when stock check returns warning', fakeAsync(() => {
      const warningResult = {
        currentStock: 2,
        minimal: 5,
        optimal: 10,
        requiredQty: 5,
        warningLevel: 'belowMinimal' as const,
        warningMessage: 'Stock is below minimal level'
      };
      apiSpy.checkInventoryStock.and.returnValue(of(warningResult));
      fixture.detectChanges();

      component.newItemForm.get('productType')!.setValue('RBC');
      component.newItemForm.get('bloodType')!.setValue('A+');
      component.newItemForm.get('requiredQty')!.setValue(5);
      tick(600);

      expect(dialogSpy.open).toHaveBeenCalled();
    }));
  });

  // ── onAddNewProducts ──

  describe('onAddNewProducts', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should auto-add current item if form is valid and dirty', () => {
      spyOn(component.itemAdded, 'emit');
      component.tiers.set([{ code: '1', description: 'Tier 1', unitPrice: 100 }]);
      component.showNewRow.set(true);
      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'A+',
        requiredQty: 5,
        specialFlag: 'Y',
        tier: '1'
      });
      component.newItemForm.markAsDirty();

      component.onAddNewProducts();
      expect(component.itemAdded.emit).toHaveBeenCalled();
    });

    it('should reset form and show new row', () => {
      component.showNewRow.set(false);
      component.onAddNewProducts();
      expect(component.showNewRow()).toBeTrue();
    });
  });

  // ── onItemComment ──

  describe('onItemComment', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open comments dialog with current comment', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of('Updated comment'));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      component.itemComments.set(['Initial comment']);

      component.onItemComment(0);
      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should update comment when dialog returns a result', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of('Updated comment'));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      component.itemComments.set(['Initial comment']);

      component.onItemComment(0);
      expect(component.itemComments()[0]).toBe('Updated comment');
    });

    it('should not update comment when dialog returns null', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      component.itemComments.set(['Original comment']);

      component.onItemComment(0);
      expect(component.itemComments()[0]).toBe('Original comment');
    });
  });
});
