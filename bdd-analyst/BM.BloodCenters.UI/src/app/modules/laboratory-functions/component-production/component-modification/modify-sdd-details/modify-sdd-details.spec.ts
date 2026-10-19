import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Component, Input, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';

import { ModifySddDetailsComponent } from './modify-sdd-details';
import { ModifySddDetailsService } from './modify-sdd-details.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { UnitValidationResponse } from '@shared/components/unit-id-field';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ProductCodeOption,
  LotNumberOption,
  WaferLotOption,
  MachineOption,
  SddFormData,
  ItemInd,
} from './modify-sdd-details.model';

@Component({ selector: 'app-page-header-with-breadcrumb', template: '', standalone: true })
class PageHeaderStub {
  @Input() config: any;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_UNIT_ID = 'W6333 19 030301-X';

const mockUnitValidation: UnitValidationResponse = {
  parsedUnitId: MOCK_UNIT_ID,
  checkDigit: null,
  codeScheme: 'I',
  manualUnitId: MOCK_UNIT_ID,
  codabarUnitScheme: null,
  entryMode: 'S',
  barcodeType: 'CODE128',
  chapterScheme: 'I',
};

const mockProductCodes: ProductCodeOption[] = [
  {
    productCode: 'PC001',
    productDescription: 'Sterile docking bags only',
    sdcWsNumber: '031218-SD1002',
    itemInd: 'FI',
    itemIndDescription: 'Sterile Docking Bags only',
  },
];

const mockLotNumbers: LotNumberOption[] = [{ lotNumber: 'LOT-001', numberOfItems: 5 }];
const mockWaferLots: WaferLotOption[] = [{ lotNumber: 'WL-001' }];
const mockMachines: MachineOption[] = [{ code: 'MCH-01', codeDescription: 'Machine 01' }];

const mockFormData: SddFormData = {
  sdcWsNumber: '031218-SD1002',
  productCode: 'PC001',
  productDescription: 'Sterile docking bags only',
  itemInd: 'FI',
  lotNumber: 'LOT-001',
  waferLotNumber: 'WL-001',
  sterileMachine: 'MCH-01',
  numberOfBags: 0,
  numberOfItems: 5,
  weldFlag: 'Y',
  bagsUsed: 0,
  isLotNumberValid: true,
  isWaferLotValid: true,
};

const mockPageHeaderServiceStub = {
  pageHeaderData: signal<{ title: string; subtitle?: string } | undefined>({
    title: 'Modify SDD Details',
    subtitle: 'Update batch and unit information.',
  }),
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('ModifySddDetailsComponent', () => {
  let component: ModifySddDetailsComponent;
  let fixture: ComponentFixture<ModifySddDetailsComponent>;
  let serviceSpy: jasmine.SpyObj<ModifySddDetailsService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let chapterChanged$: Subject<void>;
  let headerServiceStub: { chapterChanged$: Subject<void> };

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();
    headerServiceStub = { chapterChanged$ };

    serviceSpy = jasmine.createSpyObj('ModifySddDetailsService', [
      'getProductsByUnit',
      'getFormData',
      'getLotNumbers',
      'getWaferLotNumbers',
      'getSterileMachines',
      'update',
    ]);
    serviceSpy.getProductsByUnit.and.returnValue(of(mockProductCodes));
    serviceSpy.getFormData.and.returnValue(of(mockFormData));
    serviceSpy.getLotNumbers.and.returnValue(of(mockLotNumbers));
    serviceSpy.getWaferLotNumbers.and.returnValue(of(mockWaferLots));
    serviceSpy.getSterileMachines.and.returnValue(of(mockMachines));
    serviceSpy.update.and.returnValue(of(undefined as unknown as void));

    snackbarSpy = createMockSnackbarService();



      TestBed.configureTestingModule({
      imports: [
        ModifySddDetailsComponent,
        NoopAnimationsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        CommonModule,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ModifySddDetailsService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerServiceStub },
        { provide: PageHeaderService, useValue: mockPageHeaderServiceStub },
      ],
    })
      .overrideComponent(ModifySddDetailsComponent, {
        remove: { imports: [PageHeaderWithBreadcrumb] },
        add: { imports: [PageHeaderStub] },
      });


    


      serviceSpy.getProductsByUnit.calls.reset();


      serviceSpy.getFormData.calls.reset();


      serviceSpy.getLotNumbers.calls.reset();


      serviceSpy.getWaferLotNumbers.calls.reset();


      serviceSpy.getSterileMachines.calls.reset();


      serviceSpy.update.calls.reset();


      serviceSpy.getProductsByUnit.and.returnValue(of(mockProductCodes));


      serviceSpy.getFormData.and.returnValue(of(mockFormData));


      serviceSpy.getLotNumbers.and.returnValue(of(mockLotNumbers));


      serviceSpy.getWaferLotNumbers.and.returnValue(of(mockWaferLots));


      serviceSpy.getSterileMachines.and.returnValue(of(mockMachines));


      serviceSpy.update.and.returnValue(of(undefined as unknown as void));


    fixture = TestBed.createComponent(ModifySddDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  // ── Initialisation ────────────────────────────────────────────────────────


  it('should initialise with empty state (no results)', () => {
    expect(component.hasResults()).toBeFalse();
  });

  it('should initialise filter form with productCode field', () => {
    const form = component.filterForm;
    expect(form).toBeDefined();
    expect(form.get('productCode')).toBeTruthy();
  });

  it('should initialise detail form with required fields', () => {
    const form = component.detailForm;
    expect(form).toBeDefined();
    expect(form.get('lotNumber')).toBeTruthy();
    expect(form.get('waferLotNumber')).toBeTruthy();
    expect(form.get('machine')).toBeTruthy();
    expect(form.get('weld')).toBeTruthy();
  });

  it('should initialise read-only display signals with "--"', () => {
    expect(component.productDescription()).toBe('--');
    expect(component.worksheetNo()).toBe('--');
    expect(component.worksheetDescription()).toBe('--');
  });

  it('should load wafer lots and machines on init', () => {
    expect(serviceSpy.getWaferLotNumbers).toHaveBeenCalled();
    expect(serviceSpy.getSterileMachines).toHaveBeenCalled();
    expect(component.waferLotOptions().length).toBeGreaterThan(0);
    expect(component.machineOptions().length).toBeGreaterThan(0);
  });

  // ── Unique ID generation ──────────────────────────────────────────────────

  it('should generate unique component IDs across instances', () => {
    const fixture2 = TestBed.createComponent(ModifySddDetailsComponent);
    const component2 = fixture2.componentInstance;
    expect(component['componentId']).not.toEqual(component2['componentId']);
  });

  it('should generate element IDs using componentId prefix', () => {
    const id = component['elementId']('unitId');
    expect(id).toContain('unitId');
    expect(id).toContain(component['componentId']);
  });

  it('should generate error IDs using componentId prefix', () => {
    const id = component['errorId']('unitId');
    expect(id).toContain('error');
    expect(id).toContain(component['componentId']);
  });

  // ── Page header config ────────────────────────────────────────────────────





  // ── Unit validation ───────────────────────────────────────────────────────

  it('should set validatedUnitId from validated response', () => {
    component.onUnitValidated(mockUnitValidation);
    expect(component.validatedUnitId()).toBe(MOCK_UNIT_ID);
  });

  it('should load product codes when a unit is validated', fakeAsync(() => {
    component.onUnitValidated(mockUnitValidation);
    tick();
    expect(serviceSpy.getProductsByUnit).toHaveBeenCalledWith(MOCK_UNIT_ID);
    expect(component.productCodeOptions().length).toBeGreaterThan(0);
  }));



  it('should reset all state when unit is cleared', fakeAsync(() => {
    component.onUnitValidated(mockUnitValidation);
    tick();
    component.onUnitCleared();
    expect(component.validatedUnitId()).toBe('');
    expect(component.productDescription()).toBe('--');
    expect(component.worksheetNo()).toBe('--');
    expect(component.worksheetDescription()).toBe('--');
    expect(component.hasResults()).toBeFalse();
  }));

  // ── Product code selection (triggers results display) ─────────────────────

  function loadResults(): void {
    component.onUnitValidated(mockUnitValidation);
    tick();
    component.onProductCodeChange('PC001');
    tick();
    fixture.detectChanges();
  }

  it('should populate read-only fields when a product code is selected', fakeAsync(() => {
    loadResults();
    expect(component.productDescription()).toBe('Sterile docking bags only');
    expect(component.worksheetNo()).toBe('031218-SD1002');
    expect(component.worksheetDescription()).toBe('Sterile Docking Bags only');
  }));

  it('should show results after selecting a valid product code', fakeAsync(() => {
    loadResults();
    expect(component.hasResults()).toBeTrue();
  }));

  it('should set detailUnitId from the validated unit after product code selection', fakeAsync(() => {
    loadResults();
    expect(component.detailUnitId()).toBe(MOCK_UNIT_ID);
  }));

  it('should compute detail section title from unit ID', fakeAsync(() => {
    loadResults();
    expect(component.detailSectionTitle()).toContain(MOCK_UNIT_ID);
  }));

  it('should load lot numbers after product code selection', fakeAsync(() => {
    loadResults();
    expect(component.lotNumberOptions().length).toBeGreaterThan(0);
  }));

  it('should clear loading and still patch form when getLotNumbers fails', fakeAsync(() => {
    serviceSpy.getLotNumbers.and.returnValue(throwError(() => new Error('network')));
    component.onUnitValidated(mockUnitValidation);
    tick();
    component.onProductCodeChange('PC001');
    tick();
    expect(component.isLoading()).toBeFalse();
    expect(component.lotNumberOptions().length).toBe(0);
    expect(component.productDescription()).toBe('Sterile docking bags only');
  }));

  it('should clear loading and still populate lot numbers when getFormData fails', fakeAsync(() => {
    serviceSpy.getFormData.and.returnValue(throwError(() => new Error('network')));
    component.onUnitValidated(mockUnitValidation);
    tick();
    component.onProductCodeChange('PC001');
    tick();
    expect(component.isLoading()).toBeFalse();
    expect(component.lotNumberOptions().length).toBeGreaterThan(0);
  }));

  it('should not show results when no product code is selected', () => {
    expect(component.hasResults()).toBeFalse();
  });

  it('should do nothing when an empty product code is passed', () => {
    component.onProductCodeChange('');
    expect(component.hasResults()).toBeFalse();
  });

  // ── Save ──────────────────────────────────────────────────────────────────

  it('should not call update when detail form is invalid', fakeAsync(() => {
    loadResults();
    component.detailForm.get('lotNumber')?.setValue('');
    component.detailForm.get('weld')?.setValue('');
    component.onSave();
    tick();
    expect(serviceSpy.update).not.toHaveBeenCalled();
    expect(component.isSaving()).toBeFalse();
  }));

  it('should mark all fields as touched when saving with invalid form', fakeAsync(() => {
    loadResults();
    component.detailForm.get('lotNumber')?.setValue('');
    component.onSave();
    expect(component.detailForm.get('lotNumber')?.touched).toBeTrue();
  }));

  it('should call update service and show success on save', fakeAsync(() => {
    loadResults();
    component.onSave();
    tick();
    expect(serviceSpy.update).toHaveBeenCalled();
    expect(snackbarSpy.showSuccess).toHaveBeenCalled();
  }));

  it('should reset state after successful save', fakeAsync(() => {
    loadResults();
    component.onSave();
    tick();
    expect(component.hasResults()).toBeFalse();
    expect(component.isSaving()).toBeFalse();
  }));

  // ── Cancel resets state ───────────────────────────────────────────────────

  it('should reset all state on cancel', fakeAsync(() => {
    loadResults();
    expect(component.hasResults()).toBeTrue();

    component.onCancel();
    expect(component.hasResults()).toBeFalse();
    expect(component.productDescription()).toBe('--');
    expect(component.worksheetNo()).toBe('--');
    expect(component.worksheetDescription()).toBe('--');
    expect(component.detailUnitId()).toBe('');
  }));

  // ── Dropdown options ──────────────────────────────────────────────────────

  it('should have product code options after unit validation', fakeAsync(() => {
    component.onUnitValidated(mockUnitValidation);
    tick();
    expect(component.productCodeOptions().length).toBeGreaterThan(0);
  }));

  it('should have lot number options after product code selection', fakeAsync(() => {
    loadResults();
    expect(component.lotNumberOptions().length).toBeGreaterThan(0);
  }));

  it('should have wafer lot options loaded on init', () => {
    expect(component.waferLotOptions().length).toBeGreaterThan(0);
  });

  it('should have machine options loaded on init', () => {
    expect(component.machineOptions().length).toBeGreaterThan(0);
  });

  it('should have weld options with Yes and No', () => {
    const labels = component.weldOptions.map(o => o.label);
    expect(labels).toContain('Yes');
    expect(labels).toContain('No');
  });

  it('should have weld options using Y/N values', () => {
    const values = component.weldOptions.map(o => o.value);
    expect(values).toContain('Y');
    expect(values).toContain('N');
  });

  // ── Numeric input helpers ─────────────────────────────────────────────────

  it('should allow numeric keypress', () => {
    const event = new KeyboardEvent('keypress', { key: '5' });
    expect(component.onlyNumbers(event)).toBeTrue();
  });

  it('should block non-numeric keypress', () => {
    const event = new KeyboardEvent('keypress', { key: 'a' });
    expect(component.onlyNumbers(event)).toBeFalse();
  });

  // ── Chapter change ────────────────────────────────────────────────────────

  it('should reset all state and reload dropdowns when chapter changes', fakeAsync(() => {
    component.onUnitValidated(mockUnitValidation);
    tick();
    component.onProductCodeChange('PC001');
    tick();
    expect(component.hasResults()).toBeTrue();

    serviceSpy.getWaferLotNumbers.calls.reset();
    serviceSpy.getSterileMachines.calls.reset();

    chapterChanged$.next();
    tick();

    expect(component.hasResults()).toBeFalse();
    expect(component.validatedUnitId()).toBe('');
    expect(serviceSpy.getWaferLotNumbers).toHaveBeenCalled();
    expect(serviceSpy.getSterileMachines).toHaveBeenCalled();
  }));

  // ── Number of Bags validation by docking type ─────────────────────────────

  describe('Number of Bags validation varies by docking type', () => {
    function loadResultsWith(itemInd: string, bagsUsed = 0): void {
      const productCode = `PC-${itemInd}`;
      serviceSpy.getProductsByUnit.and.returnValue(of([{
        productCode,
        productDescription: `Product (${itemInd})`,
        sdcWsNumber: '031218-SD1002',
        itemInd,
        itemIndDescription: `${itemInd} Description`,
      } as ProductCodeOption]));
      serviceSpy.getFormData.and.returnValue(of({ ...mockFormData, itemInd, numberOfBags: 0, bagsUsed } as SddFormData));

      component.onUnitValidated(mockUnitValidation);
      tick();
      component.onProductCodeChange(productCode);
      tick();
      fixture.detectChanges();
    }

    it('should keep numberOfBags enabled and reject values > 0 for FI (Filters Only)', fakeAsync(() => {
      loadResultsWith(ItemInd.FiltersOnly);
      const ctrl = component.detailForm.get('numberOfBags');
      expect(ctrl?.enabled).toBeTrue();
      ctrl?.setValue(1);
      expect(ctrl?.valid).toBeFalse();
      ctrl?.setValue(0);
      expect(ctrl?.valid).toBeTrue();
    }));

    it('should keep numberOfBags enabled and reject values > 0 for SE (Segments Only)', fakeAsync(() => {
      loadResultsWith(ItemInd.SegmentsOnly);
      const ctrl = component.detailForm.get('numberOfBags');
      expect(ctrl?.enabled).toBeTrue();
      ctrl?.setValue(1);
      expect(ctrl?.valid).toBeFalse();
      ctrl?.setValue(0);
      expect(ctrl?.valid).toBeTrue();
    }));

    it('should enable numberOfBags and allow 0–9 for BA (Bags Only)', fakeAsync(() => {
      loadResultsWith(ItemInd.BagsOnly);
      const ctrl = component.detailForm.get('numberOfBags');
      expect(ctrl?.enabled).toBeTrue();
      ctrl?.setValue(0);  expect(ctrl?.valid).toBeTrue();
      ctrl?.setValue(9);  expect(ctrl?.valid).toBeTrue();
      ctrl?.setValue(10); expect(ctrl?.valid).toBeFalse();
      ctrl?.setValue(-1); expect(ctrl?.valid).toBeFalse();
    }));

    it('should enable numberOfBags and allow 0–9 for FB (Filters With Bags)', fakeAsync(() => {
      loadResultsWith(ItemInd.FiltersWithBags);
      const ctrl = component.detailForm.get('numberOfBags');
      expect(ctrl?.enabled).toBeTrue();
      ctrl?.setValue(0);  expect(ctrl?.valid).toBeTrue();
      ctrl?.setValue(9);  expect(ctrl?.valid).toBeTrue();
      ctrl?.setValue(10); expect(ctrl?.valid).toBeFalse();
    }));

    it('isBagsDisabledByType should be true for FI and SE only', fakeAsync(() => {
      loadResultsWith(ItemInd.FiltersOnly);
      expect(component.isBagsDisabledByType()).toBeTrue();

      loadResultsWith(ItemInd.SegmentsOnly);
      expect(component.isBagsDisabledByType()).toBeTrue();

      loadResultsWith(ItemInd.BagsOnly);
      expect(component.isBagsDisabledByType()).toBeFalse();

      loadResultsWith(ItemInd.FiltersWithBags);
      expect(component.isBagsDisabledByType()).toBeFalse();
    }));

    it('numberOfBagsLabel should show "(0)" for FI/SE and "(0–9)" for BA/FB', fakeAsync(() => {
      loadResultsWith(ItemInd.FiltersOnly);
      expect(component.numberOfBagsLabel()).toBe('Number of Bags (0)');

      loadResultsWith(ItemInd.SegmentsOnly);
      expect(component.numberOfBagsLabel()).toBe('Number of Bags (0)');

      loadResultsWith(ItemInd.BagsOnly);
      expect(component.numberOfBagsLabel()).toBe('Number of Bags (0–9)');

      loadResultsWith(ItemInd.FiltersWithBags);
      expect(component.numberOfBagsLabel()).toBe('Number of Bags (0–9)');
    }));
  });

  // ── labelId helper ────────────────────────────────────────────────────────

  it('should generate label IDs using componentId prefix', () => {
    const id = component['labelId']('unitId');
    expect(id).toContain('label');
    expect(id).toContain(component['componentId']);
  });

  // ── Page header config computed ──────────────────────────────────────────

  it('should return populated header config when pageHeaderData has data', () => {
    const config = component.headerConfig();
    expect(config.title).toBe('Modify SDD Details');
    expect(config.subtitle).toBe('Update batch and unit information.');
    expect(config.breadcrumbs.length).toBe(2);
    expect(config.breadcrumbs[0].label).toBe('Home');
    expect(config.breadcrumbs[0].link).toBe('/home');
    expect(config.breadcrumbs[1].label).toBe('Modify SDD Details');
    expect(config.breadcrumbs[1].link).toBeNull();
  });

  it('should return empty header config when pageHeaderData is undefined', () => {
    mockPageHeaderServiceStub.pageHeaderData.set(undefined);
    const config = component.headerConfig();
    expect(config.title).toBe('');
    expect(config.subtitle).toBe('');
    expect(config.breadcrumbs).toEqual([]);
    // Restore for other tests
    mockPageHeaderServiceStub.pageHeaderData.set({
      title: 'Modify SDD Details',
      subtitle: 'Update batch and unit information.',
    });
  });

  it('should return empty subtitle when pageHeaderData has no subtitle', () => {
    mockPageHeaderServiceStub.pageHeaderData.set({ title: 'Test Title' });
    const config = component.headerConfig();
    expect(config.title).toBe('Test Title');
    expect(config.subtitle).toBe('');
    // Restore for other tests
    mockPageHeaderServiceStub.pageHeaderData.set({
      title: 'Modify SDD Details',
      subtitle: 'Update batch and unit information.',
    });
  });

  // ── onUnitValidated error path ───────────────────────────────────────────

  it('should handle getProductsByUnit error and clear options', fakeAsync(() => {
    serviceSpy.getProductsByUnit.and.returnValue(throwError(() => new Error('server error')));
    component.onUnitValidated(mockUnitValidation);
    tick();
    expect(component.isLoading()).toBeFalse();
    expect(component.productCodeOptions()).toEqual([]);
    expect(component.filteredProductCodes()).toEqual([]);
    expect(component.noProductsFound()).toBeTrue();
  }));

  it('should set noProductsFound when getProductsByUnit returns empty array', fakeAsync(() => {
    serviceSpy.getProductsByUnit.and.returnValue(of([]));
    component.onUnitValidated(mockUnitValidation);
    tick();
    expect(component.noProductsFound()).toBeTrue();
    expect(component.productCodeOptions()).toEqual([]);
  }));

  it('should not auto-select product code when multiple products returned', fakeAsync(() => {
    const multipleProducts: ProductCodeOption[] = [
      { productCode: 'PC001', productDescription: 'Desc1', sdcWsNumber: 'WS1', itemInd: 'FI', itemIndDescription: 'Desc1' },
      { productCode: 'PC002', productDescription: 'Desc2', sdcWsNumber: 'WS2', itemInd: 'BA', itemIndDescription: 'Desc2' },
    ];
    serviceSpy.getProductsByUnit.and.returnValue(of(multipleProducts));
    component.onUnitValidated(mockUnitValidation);
    tick();
    expect(component.productCodeOptions().length).toBe(2);
    expect(component.filterForm.get('productCode')?.value).toBe('');
    expect(component.hasResults()).toBeFalse();
  }));

  it('should auto-select product code when single product returned', fakeAsync(() => {
    serviceSpy.getProductsByUnit.and.returnValue(of(mockProductCodes));
    component.onUnitValidated(mockUnitValidation);
    tick();
    expect(component.filterForm.get('productCode')?.value).toBe('PC001');
    expect(component.hasResults()).toBeTrue();
  }));

  it('should handle parsedUnitId being undefined', fakeAsync(() => {
    const validationNoParsed: UnitValidationResponse = {
      ...mockUnitValidation,
      parsedUnitId: undefined as any,
    };
    component.onUnitValidated(validationNoParsed);
    tick();
    expect(component.validatedUnitId()).toBe('');
    expect(serviceSpy.getProductsByUnit).toHaveBeenCalledWith('');
  }));

  // ── onProductCodeChange edge cases ───────────────────────────────────────

  it('should do nothing when product code does not match any option', fakeAsync(() => {
    const multipleProducts: ProductCodeOption[] = [
      { productCode: 'PC001', productDescription: 'Desc1', sdcWsNumber: 'WS1', itemInd: 'FI', itemIndDescription: 'D1' },
      { productCode: 'PC002', productDescription: 'Desc2', sdcWsNumber: 'WS2', itemInd: 'BA', itemIndDescription: 'D2' },
    ];
    serviceSpy.getProductsByUnit.and.returnValue(of(multipleProducts));
    component.onUnitValidated(mockUnitValidation);
    tick();
    // With multiple products, no auto-select happens, so hasResults is false
    expect(component.hasResults()).toBeFalse();
    component.onProductCodeChange('NONEXISTENT');
    expect(component.hasResults()).toBeFalse();
    expect(component.productDescription()).toBe('--');
  }));

  it('should set worksheetDescription to "--" when match has no itemIndDescription', fakeAsync(() => {
    const productsNoDesc: ProductCodeOption[] = [
      { productCode: 'PC001', productDescription: 'Desc', sdcWsNumber: 'WS1', itemInd: 'FI', itemIndDescription: undefined as any },
    ];
    serviceSpy.getProductsByUnit.and.returnValue(of(productsNoDesc));
    component.onUnitValidated(mockUnitValidation);
    tick();
    // Manually set options to match component state
    component.onProductCodeChange('PC001');
    tick();
    expect(component.worksheetDescription()).toBe('--');
  }));

  it('should not load form data when validatedUnitId is empty', fakeAsync(() => {
    // Set up product code options without unit validation
    component['productCodeOptions'].set(mockProductCodes);
    component.onProductCodeChange('PC001');
    tick();
    expect(serviceSpy.getLotNumbers).not.toHaveBeenCalled();
    expect(serviceSpy.getFormData).not.toHaveBeenCalled();
    expect(component.hasResults()).toBeFalse();
  }));

  it('should lock numberOfBags when bagsUsed > 0', fakeAsync(() => {
    const formDataWithBags: SddFormData = { ...mockFormData, bagsUsed: 3, itemInd: 'BA' };
    serviceSpy.getFormData.and.returnValue(of(formDataWithBags));
    component.onUnitValidated(mockUnitValidation);
    tick();
    component.onProductCodeChange('PC001');
    tick();
    expect(component.numberOfBagsLocked()).toBeTrue();
    expect(component.detailForm.get('numberOfBags')?.disabled).toBeTrue();
  }));

  it('should patch segment fields from formData', fakeAsync(() => {
    const formDataWithSegments: SddFormData = {
      ...mockFormData,
      itemInd: 'SE',
      segmentRemFlag: 'Y',
      segmentNumber: '42',
    };
    serviceSpy.getFormData.and.returnValue(of(formDataWithSegments));
    component.onUnitValidated(mockUnitValidation);
    tick();
    component.onProductCodeChange('PC001');
    tick();
    expect(component.detailForm.get('segmentRemFlag')?.value).toBe('Y');
    expect(component.detailForm.get('segmentNumber')?.value).toBe('42');
  }));

  it('should default segment fields to empty when formData has null values', fakeAsync(() => {
    const formDataNoSegments: SddFormData = {
      ...mockFormData,
      itemInd: 'FI',
      segmentRemFlag: undefined,
      segmentNumber: undefined,
    };
    serviceSpy.getFormData.and.returnValue(of(formDataNoSegments));
    component.onUnitValidated(mockUnitValidation);
    tick();
    component.onProductCodeChange('PC001');
    tick();
    expect(component.detailForm.get('segmentRemFlag')?.value).toBe('');
    expect(component.detailForm.get('segmentNumber')?.value).toBe('');
  }));

  it('should handle forkJoin error in onProductCodeChange', fakeAsync(() => {
    serviceSpy.getLotNumbers.and.returnValue(throwError(() => new Error('err')));
    serviceSpy.getFormData.and.returnValue(throwError(() => new Error('err')));
    component.onUnitValidated(mockUnitValidation);
    tick();
    component.onProductCodeChange('PC001');
    tick();
    // catchError turns errors into defaults, so forkJoin still succeeds
    expect(component.isLoading()).toBeFalse();
    expect(component.lotNumberOptions()).toEqual([]);
  }));

  // ── onLotNumberChange ────────────────────────────────────────────────────

  it('should set numberOfItems when matching lot number has a value', fakeAsync(() => {
    loadResults();
    component.onLotNumberChange('LOT-001');
    expect(component.detailForm.get('numberOfItems')?.value).toBe(5);
  }));

  it('should not set numberOfItems when lot number does not match', fakeAsync(() => {
    loadResults();
    const originalValue = component.detailForm.get('numberOfItems')?.value;
    component.onLotNumberChange('NONEXISTENT');
    expect(component.detailForm.get('numberOfItems')?.value).toBe(originalValue);
  }));

  it('should not set numberOfItems when matching lot has null numberOfItems', fakeAsync(() => {
    const lotsWithNull: LotNumberOption[] = [{ lotNumber: 'LOT-NULL', numberOfItems: null }];
    serviceSpy.getLotNumbers.and.returnValue(of(lotsWithNull));
    component.onUnitValidated(mockUnitValidation);
    tick();
    component.onProductCodeChange('PC001');
    tick();
    component.detailForm.get('numberOfItems')?.setValue(10);
    component.onLotNumberChange('LOT-NULL');
    expect(component.detailForm.get('numberOfItems')?.value).toBe(10);
  }));

  // ── onSave with segment type ─────────────────────────────────────────────

  it('should include segment fields in payload when isSegmentType is true', fakeAsync(() => {
    const seProduct: ProductCodeOption = {
      productCode: 'PC-SE',
      productDescription: 'Segment product',
      sdcWsNumber: 'WS-SE',
      itemInd: 'SE',
      itemIndDescription: 'Segments Only',
    };
    const seFormData: SddFormData = {
      ...mockFormData,
      itemInd: 'SE',
      segmentRemFlag: 'Y',
      segmentNumber: '7',
      numberOfBags: 0,
    };
    serviceSpy.getProductsByUnit.and.returnValue(of([seProduct]));
    serviceSpy.getFormData.and.returnValue(of(seFormData));
    serviceSpy.getLotNumbers.and.returnValue(of(mockLotNumbers));

    component.onUnitValidated(mockUnitValidation);
    tick();
    component.onProductCodeChange('PC-SE');
    tick();

    component.detailForm.patchValue({
      segmentRemFlag: 'N',
      segmentNumber: '3',
    });

    component.onSave();
    tick();

    const payload = serviceSpy.update.calls.mostRecent().args[0];
    expect(payload.segmentRemFlag).toBe('N');
    expect(payload.segmentNumber).toBe('3');
  }));

  it('should not include segment fields in payload when isSegmentType is false', fakeAsync(() => {
    loadResults();
    component.onSave();
    tick();

    const payload = serviceSpy.update.calls.mostRecent().args[0];
    expect(payload.segmentRemFlag).toBeUndefined();
    expect(payload.segmentNumber).toBeUndefined();
  }));

  it('should set isSaving to false on save error', fakeAsync(() => {
    loadResults();
    serviceSpy.update.and.returnValue(throwError(() => new Error('save failed')));
    component.onSave();
    tick();
    expect(component.isSaving()).toBeFalse();
    expect(snackbarSpy.showSuccess).not.toHaveBeenCalled();
  }));

  it('should construct save payload with correct field mappings', fakeAsync(() => {
    loadResults();
    component.onSave();
    tick();
    const payload = serviceSpy.update.calls.mostRecent().args[0];
    expect(payload.unitId).toBe(MOCK_UNIT_ID);
    expect(payload.productCode).toBe('PC001');
    expect(payload.sdcWsNumber).toBe('031218-SD1002');
    expect(payload.sterileMachine).toBeDefined();
    expect(payload.weldFlag).toBeDefined();
  }));

  // ── onCancel details ─────────────────────────────────────────────────────

  it('should clear unitIdField on cancel', fakeAsync(() => {
    loadResults();
    spyOn(component['unitIdField'], 'clear');
    component.onCancel();
    expect(component['unitIdField'].clear).toHaveBeenCalled();
  }));

  it('should reset numberOfBagsLocked on cancel', fakeAsync(() => {
    const formDataWithBags: SddFormData = { ...mockFormData, bagsUsed: 3, itemInd: 'BA' };
    serviceSpy.getFormData.and.returnValue(of(formDataWithBags));
    component.onUnitValidated(mockUnitValidation);
    tick();
    component.onProductCodeChange('PC001');
    tick();
    expect(component.numberOfBagsLocked()).toBeTrue();
    component.onCancel();
    expect(component.numberOfBagsLocked()).toBeFalse();
  }));

  it('should reset noProductsFound on cancel', fakeAsync(() => {
    serviceSpy.getProductsByUnit.and.returnValue(of([]));
    component.onUnitValidated(mockUnitValidation);
    tick();
    expect(component.noProductsFound()).toBeTrue();
    component.onCancel();
    expect(component.noProductsFound()).toBeFalse();
  }));

  it('should clear all search controls on cancel', fakeAsync(() => {
    component.productCodeSearchControl.setValue('test');
    component.lotNumberSearchControl.setValue('test');
    component.waferLotSearchControl.setValue('test');
    component.machineSearchControl.setValue('test');
    component.onCancel();
    expect(component.productCodeSearchControl.value).toBe('');
    expect(component.lotNumberSearchControl.value).toBe('');
    expect(component.waferLotSearchControl.value).toBe('');
    expect(component.machineSearchControl.value).toBe('');
  }));

  it('should enable detail form on cancel', fakeAsync(() => {
    loadResults();
    component.detailForm.disable();
    component.onCancel();
    expect(component.detailForm.enabled).toBeTrue();
  }));

  // ── Search control filtering ─────────────────────────────────────────────

  it('should filter product codes by search term', fakeAsync(() => {
    component.onUnitValidated(mockUnitValidation);
    tick();
    component.productCodeSearchControl.setValue('PC001');
    expect(component.filteredProductCodes().length).toBe(1);
    expect(component.filteredProductCodes()[0].productCode).toBe('PC001');
  }));

  it('should show all product codes when search term is empty', fakeAsync(() => {
    component.onUnitValidated(mockUnitValidation);
    tick();
    component.productCodeSearchControl.setValue('PC001');
    component.productCodeSearchControl.setValue('');
    expect(component.filteredProductCodes().length).toBe(component.productCodeOptions().length);
  }));

  it('should show all product codes when search term is null', fakeAsync(() => {
    component.onUnitValidated(mockUnitValidation);
    tick();
    component.productCodeSearchControl.setValue(null as any);
    expect(component.filteredProductCodes().length).toBe(component.productCodeOptions().length);
  }));

  it('should filter lot numbers by search term', fakeAsync(() => {
    loadResults();
    component.lotNumberSearchControl.setValue('LOT');
    expect(component.filteredLotNumbers().length).toBe(1);
    component.lotNumberSearchControl.setValue('NONEXIST');
    expect(component.filteredLotNumbers().length).toBe(0);
  }));

  it('should show all lot numbers when search term is empty', fakeAsync(() => {
    loadResults();
    component.lotNumberSearchControl.setValue('LOT');
    component.lotNumberSearchControl.setValue('');
    expect(component.filteredLotNumbers().length).toBe(component.lotNumberOptions().length);
  }));

  it('should filter wafer lots by search term', () => {
    component.waferLotSearchControl.setValue('WL');
    expect(component.filteredWaferLots().length).toBe(1);
    component.waferLotSearchControl.setValue('NONEXIST');
    expect(component.filteredWaferLots().length).toBe(0);
  });

  it('should show all wafer lots when search term is empty', () => {
    component.waferLotSearchControl.setValue('WL');
    component.waferLotSearchControl.setValue('');
    expect(component.filteredWaferLots().length).toBe(component.waferLotOptions().length);
  });

  it('should filter machines by code', () => {
    component.machineSearchControl.setValue('MCH');
    expect(component.filteredMachines().length).toBe(1);
  });

  it('should filter machines by description', () => {
    component.machineSearchControl.setValue('Machine 01');
    expect(component.filteredMachines().length).toBe(1);
  });

  it('should show all machines when search term is empty', () => {
    component.machineSearchControl.setValue('MCH');
    component.machineSearchControl.setValue('');
    expect(component.filteredMachines().length).toBe(component.machineOptions().length);
  });

  it('should return no machines for non-matching search term', () => {
    component.machineSearchControl.setValue('ZZZZZ');
    expect(component.filteredMachines().length).toBe(0);
  });

  // ── loadWaferLotNumbers error path ───────────────────────────────────────

  it('should set empty wafer lots on load error', fakeAsync(() => {
    serviceSpy.getWaferLotNumbers.and.returnValue(throwError(() => new Error('err')));
    component['loadWaferLotNumbers']();
    tick();
    expect(component.waferLotOptions()).toEqual([]);
    expect(component.filteredWaferLots()).toEqual([]);
  }));

  // ── loadSterileMachines error path ───────────────────────────────────────

  it('should set empty machines on load error', fakeAsync(() => {
    serviceSpy.getSterileMachines.and.returnValue(throwError(() => new Error('err')));
    component['loadSterileMachines']();
    tick();
    expect(component.machineOptions()).toEqual([]);
    expect(component.filteredMachines()).toEqual([]);
  }));

  // ── onPasteNumbers ───────────────────────────────────────────────────────

  it('should allow paste of numeric-only text', () => {
    const event = {
      clipboardData: { getData: () => '12345' },
      preventDefault: jasmine.createSpy('preventDefault'),
    } as unknown as ClipboardEvent;
    component.onPasteNumbers(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should prevent paste of non-numeric text', () => {
    const event = {
      clipboardData: { getData: () => 'abc123' },
      preventDefault: jasmine.createSpy('preventDefault'),
    } as unknown as ClipboardEvent;
    component.onPasteNumbers(event);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should prevent paste of text with special characters', () => {
    const event = {
      clipboardData: { getData: () => '12.34' },
      preventDefault: jasmine.createSpy('preventDefault'),
    } as unknown as ClipboardEvent;
    component.onPasteNumbers(event);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should handle paste with no clipboard data', () => {
    const event = {
      clipboardData: null,
      preventDefault: jasmine.createSpy('preventDefault'),
    } as unknown as ClipboardEvent;
    component.onPasteNumbers(event);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  // ── ngAfterViewInit ──────────────────────────────────────────────────────

  it('should call onUnitCleared when unitIdControl value becomes falsy after validation', fakeAsync(() => {
    component.onUnitValidated(mockUnitValidation);
    tick();
    expect(component.validatedUnitId()).toBe(MOCK_UNIT_ID);

    // Simulate unitIdControl value becoming empty (falsy)
    component.unitIdField.unitIdControl.setValue('');
    tick();

    expect(component.validatedUnitId()).toBe('');
  }));

  it('should not call onUnitCleared when unitIdControl value becomes falsy but no validated unit', fakeAsync(() => {
    // validatedUnitId is already empty
    expect(component.validatedUnitId()).toBe('');
    component.unitIdField.unitIdControl.setValue('');
    tick();
    // Should still be empty, no error thrown
    expect(component.validatedUnitId()).toBe('');
  }));

  // ── ngOnDestroy ──────────────────────────────────────────────────────────

  it('should complete destroy$ subject on destroy', () => {
    const destroySpy = spyOn(component['destroy$'], 'next');
    const completeSpy = spyOn(component['destroy$'], 'complete');
    component.ngOnDestroy();
    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  // ── df accessor ──────────────────────────────────────────────────────────

  it('should return detailForm controls via df getter', () => {
    expect(component.df).toBe(component.detailForm.controls);
    expect(component.df['lotNumber']).toBeTruthy();
    expect(component.df['numberOfBags']).toBeTruthy();
  });

  // ── isSegmentType computed ───────────────────────────────────────────────

  it('should return true for isSegmentType when selectedItemInd is SE', fakeAsync(() => {
    const seProduct: ProductCodeOption = {
      productCode: 'PC-SE',
      productDescription: 'Segment product',
      sdcWsNumber: 'WS-SE',
      itemInd: 'SE',
      itemIndDescription: 'Segments Only',
    };
    const seFormData: SddFormData = { ...mockFormData, itemInd: 'SE', numberOfBags: 0 };
    serviceSpy.getProductsByUnit.and.returnValue(of([seProduct]));
    serviceSpy.getFormData.and.returnValue(of(seFormData));
    component.onUnitValidated(mockUnitValidation);
    tick();
    component.onProductCodeChange('PC-SE');
    tick();
    expect(component.isSegmentType()).toBeTrue();
  }));

  it('should return false for isSegmentType when selectedItemInd is not SE', fakeAsync(() => {
    loadResults();
    expect(component.isSegmentType()).toBeFalse();
  }));

  // ── segmentRemFlagOptions ────────────────────────────────────────────────

  it('should have segmentRemFlagOptions with Yes and No', () => {
    const labels = component.segmentRemFlagOptions.map(o => o.label);
    expect(labels).toContain('Yes');
    expect(labels).toContain('No');
    const values = component.segmentRemFlagOptions.map(o => o.value);
    expect(values).toContain('Y');
    expect(values).toContain('N');
  });

  // ── resetBelowUnitState ──────────────────────────────────────────────────

  it('should enable and reset detail form when resetBelowUnitState is called', fakeAsync(() => {
    loadResults();
    component.detailForm.disable();
    component['resetBelowUnitState']();
    expect(component.detailForm.enabled).toBeTrue();
    expect(component.hasResults()).toBeFalse();
    expect(component.detailUnitId()).toBe('');
    expect(component.detailProductCode()).toBe('');
    expect(component.numberOfBagsLocked()).toBeFalse();
  }));

  // ── applyBagsDisableRule direct ──────────────────────────────────────────

  it('should handle applyBagsDisableRule when numberOfBags control does not exist', () => {
    const originalGet = component.detailForm.get.bind(component.detailForm);
    spyOn(component.detailForm, 'get').and.callFake((path: any) => {
      if (path === 'numberOfBags') return null;
      return originalGet(path);
    });
    // Should not throw
    expect(() => component['applyBagsDisableRule']()).not.toThrow();
  });

  // ── Chapter change reloads dropdowns ─────────────────────────────────────

  it('should reload wafer lots and machines after chapter change', fakeAsync(() => {
    serviceSpy.getWaferLotNumbers.calls.reset();
    serviceSpy.getSterileMachines.calls.reset();
    chapterChanged$.next();
    tick();
    expect(serviceSpy.getWaferLotNumbers).toHaveBeenCalledTimes(1);
    expect(serviceSpy.getSterileMachines).toHaveBeenCalledTimes(1);
  }));

  // ── Form validation ──────────────────────────────────────────────────────

  it('should mark filterForm productCode as required', () => {
    component.filterForm.get('productCode')?.setValue('');
    expect(component.filterForm.get('productCode')?.hasError('required')).toBeTrue();
    component.filterForm.get('productCode')?.setValue('PC001');
    expect(component.filterForm.get('productCode')?.valid).toBeTrue();
  });

  it('should validate numberOfItems with min 1 and max 99', () => {
    const ctrl = component.detailForm.get('numberOfItems');
    ctrl?.setValue(0);
    expect(ctrl?.hasError('min')).toBeTrue();
    ctrl?.setValue(1);
    expect(ctrl?.valid).toBeTrue();
    ctrl?.setValue(99);
    expect(ctrl?.valid).toBeTrue();
    ctrl?.setValue(100);
    expect(ctrl?.hasError('max')).toBeTrue();
  });

  it('should validate lotNumber as required', () => {
    const ctrl = component.detailForm.get('lotNumber');
    ctrl?.setValue('');
    expect(ctrl?.hasError('required')).toBeTrue();
    ctrl?.setValue('LOT-001');
    expect(ctrl?.valid).toBeTrue();
  });

  it('should validate waferLotNumber as required', () => {
    const ctrl = component.detailForm.get('waferLotNumber');
    ctrl?.setValue('');
    expect(ctrl?.hasError('required')).toBeTrue();
    ctrl?.setValue('WL-001');
    expect(ctrl?.valid).toBeTrue();
  });

  it('should validate weld as required', () => {
    const ctrl = component.detailForm.get('weld');
    ctrl?.setValue('');
    expect(ctrl?.hasError('required')).toBeTrue();
    ctrl?.setValue('Y');
    expect(ctrl?.valid).toBeTrue();
  });

  it('should validate numberOfBags with min 0 and max 9', () => {
    const ctrl = component.detailForm.get('numberOfBags');
    ctrl?.setValue(-1);
    expect(ctrl?.hasError('min')).toBeTrue();
    ctrl?.setValue(0);
    expect(ctrl?.valid).toBeTrue();
    ctrl?.setValue(9);
    expect(ctrl?.valid).toBeTrue();
    ctrl?.setValue(10);
    expect(ctrl?.hasError('max')).toBeTrue();
  });

  // ── ItemInd constant ─────────────────────────────────────────────────────

  it('should expose ItemInd constants on the component', () => {
    expect(component['ItemInd']).toBe(ItemInd);
    expect(component['ItemInd'].FiltersOnly).toBe('FI');
    expect(component['ItemInd'].SegmentsOnly).toBe('SE');
    expect(component['ItemInd'].BagsOnly).toBe('BA');
    expect(component['ItemInd'].FiltersWithBags).toBe('FB');
  });

  // ── onlyNumbers additional cases ─────────────────────────────────────────

  it('should block special character keypress', () => {
    expect(component.onlyNumbers(new KeyboardEvent('keypress', { key: '!' }))).toBeFalse();
    expect(component.onlyNumbers(new KeyboardEvent('keypress', { key: '-' }))).toBeFalse();
    expect(component.onlyNumbers(new KeyboardEvent('keypress', { key: '.' }))).toBeFalse();
    expect(component.onlyNumbers(new KeyboardEvent('keypress', { key: ' ' }))).toBeFalse();
  });

  it('should allow all single digit keys', () => {
    for (let i = 0; i <= 9; i++) {
      expect(component.onlyNumbers(new KeyboardEvent('keypress', { key: String(i) }))).toBeTrue();
    }
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  it('should render filter form in a region with aria-label containing "SDD"', () => {
    const el = fixture.nativeElement.querySelector('[role="search"]');
    expect(el).toBeTruthy();
    expect(el.getAttribute('aria-label')).toContain('SDD');
  });


});
