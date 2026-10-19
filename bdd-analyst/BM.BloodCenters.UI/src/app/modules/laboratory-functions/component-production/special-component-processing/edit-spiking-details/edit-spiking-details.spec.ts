import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Component, Input, Output, EventEmitter } from '@angular/core';

import { EditSpikingDetailsComponent } from './edit-spiking-details';
import { EditSpikingDetailsService } from './services/edit-spiking-details.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';
import {
  ComponentSpikingDto,
  ProcessCodeDropdownDto,
  SpikingTypeDropdownDto,
  LotNumberDropdownDto,
  ProductCodeDropdownDto,
} from './models/edit-spiking-details.model';

// Mock UnitIdFieldComponent with different selector to avoid conflict
@Component({
  selector: 'app-unit-id-field',
  template: '<div class="mock-unit-id-field"></div>',
  standalone: true,
})
class MockUnitIdFieldComponent {
  @Input() validateFfValue: string = 'N';
  @Input() showBarcodeIcon = false;
  @Output() validated = new EventEmitter<any>();
  @Output() cleared = new EventEmitter<void>();

  isValid = false;

  clear(): void {
    this.cleared.emit();
  }
}

describe('EditSpikingDetailsComponent', () => {
  let component: EditSpikingDetailsComponent;
  let fixture: ComponentFixture<EditSpikingDetailsComponent>;
  let serviceSpy: jasmine.SpyObj<EditSpikingDetailsService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  const mockProcessCodes: ProcessCodeDropdownDto[] = [
    { code: 'FROZ', codeDesc: 'Freezing' },
    { code: 'REG', codeDesc: 'Regular Component Production' },
  ];

  const mockSpikingTypes: SpikingTypeDropdownDto[] = [
    { code: 'REG', codeDesc: 'Regular Spiking' },
    { code: 'SPL', codeDesc: 'Special Spiking' },
  ];

  const mockLotNumbers: LotNumberDropdownDto[] = [
    { lotNumber: 'LOT001' },
    { lotNumber: 'LOT002' },
  ];

  const mockProductCodes: ProductCodeDropdownDto[] = [
    { productCode: 'E0385V00', productDesc: 'Test Product', componentPrefix: 'A' },
  ];

  const mockSpikingData: ComponentSpikingDto = {
    unitId: 'W123418031306-P',
    collDate: '2025-12-05',
    chapterId: 'DAL',
    productCode: 'E0385V00',
    componentPrefix: 'A',
    processCode: 'FROZ',
    spikingType: 'REG',
    spikingTypeDesc: 'Regular Spiking',
    bagLotNumber: 'FEDONUT01',
    filterLotNumber: '37.5 C',
    bagsSpiked: 1,
    bagsForComponents: 1,
    bagsUsed: 1,
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('EditSpikingDetailsService', [
      'getByKey',
      'update',
      'getProcessCodes',
      'getSpikingTypes',
      'getBagLotNumbers',
      'getFilterLotNumbers',
      'getProductCodes',
      'getComponentPrefixes',
      'getUnitCollectionDates',
    ]);

    snackBarSpy = createMockMatSnackBar();

    serviceSpy.getProcessCodes.and.returnValue(of(mockProcessCodes));
    serviceSpy.getSpikingTypes.and.returnValue(of(mockSpikingTypes));
    serviceSpy.getBagLotNumbers.and.returnValue(of(mockLotNumbers));
    serviceSpy.getFilterLotNumbers.and.returnValue(of(mockLotNumbers));
    serviceSpy.getProductCodes.and.returnValue(of(mockProductCodes));
    serviceSpy.getUnitCollectionDates.and.returnValue(of([{ collDate: '2025-12-05' }]));
    serviceSpy.getByKey.and.returnValue(of(mockSpikingData));
    serviceSpy.update.and.returnValue(
      of({ success: true, message: 'Updated successfully', statusCode: 200, data: mockSpikingData })
    );

    const headerServiceMock = {
      chapterChanged$: new Subject<void>(),
      chapterTimeZone: () => 'UTC',
      getCurrentChapterId: () => 'DAL',
    };

    const pageHeaderServiceMock = {
      getCurrentMenuItem: () => ({ label: 'Edit Spiking Details' }),
      getTitle: () => 'Edit Spiking Details',
      getSubtitle: () => '',
    };



      TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
      ],
      providers: [
        provideHttpClient(),
        { provide: EditSpikingDetailsService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceMock },
        { provide: PageHeaderService, useValue: pageHeaderServiceMock },
        { provide: MatSnackBar, useValue: snackBarSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) },
        },
      ],
    })
      .overrideComponent(EditSpikingDetailsComponent, {
        remove: { imports: [UnitIdFieldComponent] },
        add: { imports: [MockUnitIdFieldComponent] },
      });


    


      serviceSpy.getByKey.calls.reset();


      serviceSpy.update.calls.reset();


      serviceSpy.getProcessCodes.calls.reset();


      serviceSpy.getSpikingTypes.calls.reset();


      serviceSpy.getBagLotNumbers.calls.reset();


      serviceSpy.getFilterLotNumbers.calls.reset();


      serviceSpy.getProductCodes.calls.reset();


      serviceSpy.getComponentPrefixes.calls.reset();


      serviceSpy.getUnitCollectionDates.calls.reset();


      serviceSpy.getProcessCodes.and.returnValue(of(mockProcessCodes));


      serviceSpy.getSpikingTypes.and.returnValue(of(mockSpikingTypes));


      serviceSpy.getBagLotNumbers.and.returnValue(of(mockLotNumbers));


      serviceSpy.getFilterLotNumbers.and.returnValue(of(mockLotNumbers));


      serviceSpy.getProductCodes.and.returnValue(of(mockProductCodes));


      serviceSpy.getUnitCollectionDates.and.returnValue(of([{ collDate: '2025-12-05' }]));


      serviceSpy.getByKey.and.returnValue(of(mockSpikingData));


    fixture = TestBed.createComponent(EditSpikingDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });




  it('should initialize forms', () => {
    expect(component.filterForm).toBeTruthy();
    expect(component.editForm).toBeTruthy();
    expect(component.filterForm.get('processCode')).toBeTruthy();
    expect(component.filterForm.get('productCode')).toBeTruthy();
    expect(component.filterForm.get('componentPrefix')).toBeTruthy();
  });

  it('should validate filter form - all fields required', () => {
    component.filterForm.setValue({ processCode: '', productCode: '', componentPrefix: '' });
    expect(component.filterForm.invalid).toBeTrue();

    component.filterForm.setValue({ processCode: 'FROZ', productCode: 'PROD001', componentPrefix: 'A' });
    expect(component.filterForm.valid).toBeTrue();
  });











  it('should handle retrieve error with snackbar', fakeAsync(() => {
    const showErrorSpy = spyOn<any>(component, 'showErrorSnackbar').and.callThrough();
    serviceSpy.getByKey.and.returnValue(throwError(() => ({ error: { message: 'Not found' } })));
    component.filterForm.setValue({ processCode: 'FROZ', productCode: 'PROD001', componentPrefix: 'A' });
    component.validatedUnitData = { parsedUnitId: 'INVALID', isValid: true } as any;
    component.selectedCollDate = '2025-12-05';

    // Mock unitIdField
    (component as any).unitIdField = { isValid: true, clear: () => {} };

    component.onRetrieve();
    tick();
    fixture.detectChanges();
    expect(showErrorSpy).toHaveBeenCalled();
    expect(component.showEditForm).toBeFalse();
  }));

  it('should validate edit form - bags spiked range', () => {
    component.editForm.patchValue({ bagsSpiked: 100 });
    expect(component.editForm.get('bagsSpiked')?.invalid).toBeTrue();

    component.editForm.patchValue({ bagsSpiked: 50 });
    expect(component.editForm.get('bagsSpiked')?.invalid).toBeFalse();
  });

  it('should validate edit form - bags for components range', () => {
    component.editForm.patchValue({ bagsForComponents: -1 });
    expect(component.editForm.get('bagsForComponents')?.invalid).toBeTrue();

    component.editForm.patchValue({ bagsForComponents: 25 });
    expect(component.editForm.get('bagsForComponents')?.invalid).toBeFalse();
  });

  it('should cancel edit and reset form', () => {
    component.showEditForm = true;
    component.currentData = mockSpikingData;
    component.onCancel();
    expect(component.showEditForm).toBeFalse();
    expect(component.currentData).toBeNull();
  });

  it('should clear all fields', () => {
    component.showEditForm = true;
    component.currentData = mockSpikingData;
    component.productCodes = [{ productCode: 'P001', productDesc: 'Test', componentPrefix: 'A' }];

    // Mock unitIdField
    (component as any).unitIdField = { clear: jasmine.createSpy('clear') };

    component.clearAll();
    expect(component.showEditForm).toBeFalse();
    expect(component.currentData).toBeNull();
    expect(component.productCodes.length).toBe(0);
  });

  it('should get spiking type description', () => {
    component.spikingTypes = mockSpikingTypes;
    component.editForm.patchValue({ spikingType: 'REG' });
    expect(component.getSpikingTypeDescription()).toBe('Regular Spiking');
  });



  it('should prevent save if bags spiked is less than bags used', fakeAsync(() => {
    // Spy on private method through component instance
    const showErrorSpy = spyOn<any>(component, 'showErrorSnackbar').and.callThrough();

    component.currentData = { ...mockSpikingData, bagsUsed: 5 };
    component.showEditForm = true;
    component.editForm.setValue({
      spikingType: 'REG',
      bagLotNumber: 'LOT001',
      filterLotNumber: '',
      bagsSpiked: 2,
      bagsForComponents: 2,
    });
    component.onSave();
    tick();
    fixture.detectChanges();
    expect(serviceSpy.update).not.toHaveBeenCalled();
    expect(showErrorSpy).toHaveBeenCalledWith('Bags spiked cannot be less than bags used.');
  }));

  it('should prevent save if bags for components exceeds bags spiked', fakeAsync(() => {
    const showErrorSpy = spyOn<any>(component, 'showErrorSnackbar').and.callThrough();

    component.currentData = mockSpikingData;
    component.showEditForm = true;
    component.editForm.setValue({
      spikingType: 'REG',
      bagLotNumber: 'LOT001',
      filterLotNumber: '',
      bagsSpiked: 2,
      bagsForComponents: 5,
    });
    component.onSave();
    tick();
    fixture.detectChanges();
    expect(serviceSpy.update).not.toHaveBeenCalled();
    expect(showErrorSpy).toHaveBeenCalledWith('Bags for components cannot exceed bags spiked.');
  }));

  it('should check filter field invalid state', () => {
    component.filterForm.get('processCode')?.markAsTouched();
    expect(component.isFilterFieldInvalid('processCode')).toBeTrue();

    component.filterForm.patchValue({ processCode: 'FROZ' });
    expect(component.isFilterFieldInvalid('processCode')).toBeFalse();
  });

  it('should check edit field invalid state', () => {
    component.editForm.get('spikingType')?.markAsTouched();
    expect(component.isEditFieldInvalid('spikingType')).toBeTrue();

    component.editForm.patchValue({ spikingType: 'REG' });
    expect(component.isEditFieldInvalid('spikingType')).toBeFalse();
  });







  it('should check if bag lot is in list', () => {
    component.bagLotNumbers = mockLotNumbers;
    expect(component.isBagLotInList('LOT001')).toBeTrue();
    expect(component.isBagLotInList('NOTINLIST')).toBeFalse();
  });

  it('should check if filter lot is in list', () => {
    component.filterLotNumbers = mockLotNumbers;
    expect(component.isFilterLotInList('LOT001')).toBeTrue();
    expect(component.isFilterLotInList('NOTINLIST')).toBeFalse();
  });

  it('should convert search value to uppercase', () => {
    component.bagLotSearchControl.setValue('lowercase');
    expect(component.bagLotSearchValue).toBe('LOWERCASE');
  });

  // ── ngOnInit / lifecycle ──────────────────────────────────────────

  it('should call getProcessCodes on init', () => {
    // getProcessCodes is called during fixture creation (ngOnInit)
    expect(serviceSpy.getProcessCodes).toHaveBeenCalled();
  });

  it('should load process codes and assign to processCodes on init', () => {
    expect(component.processCodes).toEqual(mockProcessCodes);
    expect(component.filteredProcessCodes).toEqual(mockProcessCodes);
  });

  it('should handle getProcessCodes error on init', () => {
    serviceSpy.getProcessCodes.and.returnValue(throwError(() => new Error('fail')));
    fixture = TestBed.createComponent(EditSpikingDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.processCodes).toEqual([]);
    expect(component.filteredProcessCodes).toEqual([]);
  });

  it('should complete destroy$ on ngOnDestroy', () => {
    const destroySpy = spyOn((component as any).destroy$, 'next');
    const completeSpy = spyOn((component as any).destroy$, 'complete');
    component.ngOnDestroy();
    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  // ── updatePageHeader ──────────────────────────────────────────────

  it('should set page title from menu item label', () => {
    expect(component.pageTitle).toBe('Edit Spiking Details');
  });

  it('should default pageTitle when getCurrentMenuItem returns null', () => {
    const pageHeaderSvc = TestBed.inject(PageHeaderService);
    (pageHeaderSvc as any).getCurrentMenuItem = () => null;

    // Re-invoke the private method via ngOnInit path
    (component as any).updatePageHeader();
    expect(component.pageTitle).toBe('Edit Spiking Details');
  });

  it('should set pageSubtitle from menu item subtitle', () => {
    const pageHeaderSvc = TestBed.inject(PageHeaderService);
    (pageHeaderSvc as any).getCurrentMenuItem = () => ({ label: 'Custom Title', subtitle: 'Sub' });
    (component as any).updatePageHeader();
    expect(component.pageTitle).toBe('Custom Title');
    expect(component.pageSubtitle).toBe('Sub');
  });

  it('should default pageSubtitle to empty string when menuItem has no subtitle', () => {
    const pageHeaderSvc = TestBed.inject(PageHeaderService);
    (pageHeaderSvc as any).getCurrentMenuItem = () => ({ label: 'Title' });
    (component as any).updatePageHeader();
    expect(component.pageSubtitle).toBe('');
  });

  // ── subscribeToChapterChanges ─────────────────────────────────────

  it('should call clearAll and loadProcessCodes when chapter changes', () => {
    const clearSpy = spyOn(component, 'clearAll');
    const headerSvc = TestBed.inject(HeaderService);
    serviceSpy.getProcessCodes.calls.reset();

    // Mock unitIdField so clearAll doesn't blow up
    (component as any).unitIdField = { clear: jasmine.createSpy('clear') };

    (headerSvc.chapterChanged$ as Subject<void>).next();

    expect(clearSpy).toHaveBeenCalled();
    expect(serviceSpy.getProcessCodes).toHaveBeenCalled();
  });

  // ── getProcessDescription ─────────────────────────────────────────

  it('should return empty string when no processCode selected', () => {
    component.filterForm.patchValue({ processCode: '' });
    expect(component.getProcessDescription()).toBe('');
  });

  it('should return process description when processCode matches', () => {
    component.processCodes = mockProcessCodes;
    component.filterForm.patchValue({ processCode: 'FROZ' });
    expect(component.getProcessDescription()).toBe('Freezing');
  });

  it('should return empty string when processCode not found in list', () => {
    component.processCodes = mockProcessCodes;
    component.filterForm.patchValue({ processCode: 'UNKNOWN' });
    expect(component.getProcessDescription()).toBe('');
  });

  // ── getSpikingTypeDescription ─────────────────────────────────────

  it('should return empty string when no spikingType selected', () => {
    component.editForm.patchValue({ spikingType: '' });
    expect(component.getSpikingTypeDescription()).toBe('');
  });

  it('should return empty string when spikingType not found in list', () => {
    component.spikingTypes = mockSpikingTypes;
    component.editForm.patchValue({ spikingType: 'UNKNOWN' });
    expect(component.getSpikingTypeDescription()).toBe('');
  });

  // ── onProcessChange ───────────────────────────────────────────────

  it('should reset productCode, componentPrefix, productCodes, and clear unit on process change', () => {
    component.filterForm.patchValue({ productCode: 'P1', componentPrefix: 'A' });
    component.productCodes = mockProductCodes;
    component.validatedUnitData = { parsedUnitId: 'U1' } as any;
    component.selectedCollDate = '2025-01-01';
    (component as any).unitIdField = { clear: jasmine.createSpy('clear') };

    component.onProcessChange();

    expect(component.filterForm.get('productCode')?.value).toBe('');
    expect(component.filterForm.get('componentPrefix')?.value).toBe('');
    expect(component.productCodes).toEqual([]);
    expect(component.validatedUnitData).toBeNull();
    expect(component.selectedCollDate).toBe('');
    expect((component as any).unitIdField.clear).toHaveBeenCalled();
  });

  // ── onUnitValidated ───────────────────────────────────────────────

  it('should set validatedUnitData and load product codes on unit validation', () => {
    // Return multiple products so auto-select does not trigger
    const multipleProducts: ProductCodeDropdownDto[] = [
      { productCode: 'P001', productDesc: 'Prod 1', componentPrefix: 'A' },
      { productCode: 'P002', productDesc: 'Prod 2', componentPrefix: 'B' },
    ];
    serviceSpy.getProductCodes.and.returnValue(of(multipleProducts));

    const mockValidation = { parsedUnitId: 'W123418031306-P', isValid: true } as any;
    component.filterForm.patchValue({ processCode: 'FROZ', productCode: 'OLD' });
    component.productCodes = mockProductCodes;

    component.onUnitValidated(mockValidation);

    expect(component.validatedUnitData).toEqual(mockValidation);
    // productCode is cleared before loadProductCodes fires
    // After load, no auto-select since multiple products returned
    expect(component.productCodes.length).toBe(2);
  });

  // ── onUnitCleared ─────────────────────────────────────────────────

  it('should clear validatedUnitData, productCodes, and selectedCollDate on unit cleared', () => {
    component.validatedUnitData = { parsedUnitId: 'U1' } as any;
    component.filterForm.patchValue({ productCode: 'P1', componentPrefix: 'A' });
    component.productCodes = mockProductCodes;
    component.selectedCollDate = '2025-01-01';

    component.onUnitCleared();

    expect(component.validatedUnitData).toBeNull();
    expect(component.filterForm.get('productCode')?.value).toBe('');
    expect(component.productCodes).toEqual([]);
    expect(component.selectedCollDate).toBe('');
  });

  // ── loadProductCodes ──────────────────────────────────────────────

  it('should not load product codes if no unitId', () => {
    component.validatedUnitData = null;
    component.filterForm.patchValue({ processCode: 'FROZ' });
    serviceSpy.getUnitCollectionDates.calls.reset();

    (component as any).loadProductCodes();

    expect(serviceSpy.getUnitCollectionDates).not.toHaveBeenCalled();
  });

  it('should not load product codes if no processCode', () => {
    component.validatedUnitData = { parsedUnitId: 'U1' } as any;
    component.filterForm.patchValue({ processCode: '' });
    serviceSpy.getUnitCollectionDates.calls.reset();

    (component as any).loadProductCodes();

    expect(serviceSpy.getUnitCollectionDates).not.toHaveBeenCalled();
  });

  it('should load product codes successfully with collection dates', fakeAsync(() => {
    component.validatedUnitData = { parsedUnitId: 'W123418031306-P' } as any;
    component.filterForm.patchValue({ processCode: 'FROZ' });
    serviceSpy.getUnitCollectionDates.and.returnValue(of([{ collDate: '2025-12-05' }]));
    serviceSpy.getProductCodes.and.returnValue(of(mockProductCodes));

    (component as any).loadProductCodes();
    tick();

    expect(component.selectedCollDate).toBe('2025-12-05');
    expect(component.productCodes).toEqual(mockProductCodes);
    expect(component.filteredProductCodes).toEqual(mockProductCodes);
    expect(component.isLoadingProductCodes).toBeFalse();
  }));

  it('should auto-select product code when only one is returned', fakeAsync(() => {
    component.validatedUnitData = { parsedUnitId: 'W123418031306-P' } as any;
    component.filterForm.patchValue({ processCode: 'FROZ' });
    const singleProduct: ProductCodeDropdownDto[] = [
      { productCode: 'SINGLE', productDesc: 'Only one', componentPrefix: 'X' },
    ];
    serviceSpy.getUnitCollectionDates.and.returnValue(of([{ collDate: '2025-12-05' }]));
    serviceSpy.getProductCodes.and.returnValue(of(singleProduct));

    (component as any).loadProductCodes();
    tick();

    expect(component.filterForm.get('productCode')?.value).toBe('SINGLE');
    expect(component.filterForm.get('componentPrefix')?.value).toBe('X');
  }));

  it('should handle empty collection dates', fakeAsync(() => {
    component.validatedUnitData = { parsedUnitId: 'W123418031306-P' } as any;
    component.filterForm.patchValue({ processCode: 'FROZ' });
    serviceSpy.getUnitCollectionDates.and.returnValue(of([]));

    (component as any).loadProductCodes();
    tick();

    expect(component.productCodes).toEqual([]);
    expect(component.selectedCollDate).toBe('');
    expect(component.isLoadingProductCodes).toBeFalse();
  }));

  it('should handle loadProductCodes error', fakeAsync(() => {
    component.validatedUnitData = { parsedUnitId: 'W123418031306-P' } as any;
    component.filterForm.patchValue({ processCode: 'FROZ' });
    serviceSpy.getUnitCollectionDates.and.returnValue(throwError(() => new Error('fail')));

    (component as any).loadProductCodes();
    tick();

    expect(component.productCodes).toEqual([]);
    expect(component.selectedCollDate).toBe('');
    expect(component.isLoadingProductCodes).toBeFalse();
  }));

  // ── onProductCodeChange ───────────────────────────────────────────

  it('should clear componentPrefix when no product code selected', () => {
    component.filterForm.patchValue({ productCode: '', componentPrefix: 'A' });
    component.onProductCodeChange();
    expect(component.filterForm.get('componentPrefix')?.value).toBe('');
  });

  it('should set componentPrefix from selected product code', () => {
    component.productCodes = mockProductCodes;
    component.filterForm.patchValue({ productCode: 'E0385V00' });
    component.onProductCodeChange();
    expect(component.filterForm.get('componentPrefix')?.value).toBe('A');
  });

  it('should not set componentPrefix if product not found', () => {
    component.productCodes = mockProductCodes;
    component.filterForm.patchValue({ productCode: 'NOTFOUND', componentPrefix: '' });
    component.onProductCodeChange();
    expect(component.filterForm.get('componentPrefix')?.value).toBe('');
  });

  // ── onRetrieve ────────────────────────────────────────────────────

  it('should show error if filter form is invalid on retrieve', () => {
    const showErrorSpy = spyOn<any>(component, 'showErrorSnackbar');
    component.filterForm.setValue({ processCode: '', productCode: '', componentPrefix: '' });
    component.onRetrieve();
    expect(showErrorSpy).toHaveBeenCalledWith('Please fill all required fields.');
  });

  it('should show error if unit ID is not valid on retrieve', () => {
    const showErrorSpy = spyOn<any>(component, 'showErrorSnackbar');
    component.filterForm.setValue({ processCode: 'FROZ', productCode: 'P1', componentPrefix: 'A' });
    component.validatedUnitData = null;
    (component as any).unitIdField = { isValid: false, clear: () => {} };
    component.onRetrieve();
    expect(showErrorSpy).toHaveBeenCalledWith('Please enter a valid Unit ID.');
  });

  it('should show error if no collection date on retrieve', () => {
    const showErrorSpy = spyOn<any>(component, 'showErrorSnackbar');
    component.filterForm.setValue({ processCode: 'FROZ', productCode: 'P1', componentPrefix: 'A' });
    component.validatedUnitData = { parsedUnitId: 'U1', isValid: true } as any;
    component.selectedCollDate = '';
    (component as any).unitIdField = { isValid: true, clear: () => {} };
    component.onRetrieve();
    expect(showErrorSpy).toHaveBeenCalledWith('No collection date found for this unit.');
  });

  it('should retrieve spiking data successfully', fakeAsync(() => {
    component.filterForm.setValue({ processCode: 'FROZ', productCode: 'E0385V00', componentPrefix: 'A' });
    component.validatedUnitData = { parsedUnitId: 'W123418031306-P', isValid: true } as any;
    component.selectedCollDate = '2025-12-05';
    (component as any).unitIdField = { isValid: true, clear: () => {} };

    serviceSpy.getByKey.and.returnValue(of(mockSpikingData));
    serviceSpy.getSpikingTypes.and.returnValue(of(mockSpikingTypes));
    serviceSpy.getBagLotNumbers.and.returnValue(of(mockLotNumbers));
    serviceSpy.getFilterLotNumbers.and.returnValue(of(mockLotNumbers));

    component.onRetrieve();
    tick();

    expect(component.currentData).toEqual(mockSpikingData);
    expect(component.showEditForm).toBeTrue();
    expect(component.isLoading).toBeFalse();
  }));

  it('should show error when retrieve returns null data', fakeAsync(() => {
    const showErrorSpy = spyOn<any>(component, 'showErrorSnackbar');
    component.filterForm.setValue({ processCode: 'FROZ', productCode: 'P1', componentPrefix: 'A' });
    component.validatedUnitData = { parsedUnitId: 'U1', isValid: true } as any;
    component.selectedCollDate = '2025-12-05';
    (component as any).unitIdField = { isValid: true, clear: () => {} };

    serviceSpy.getByKey.and.returnValue(of(null as any));

    component.onRetrieve();
    tick();

    expect(showErrorSpy).toHaveBeenCalledWith('No spiking record found for the specified criteria.');
    expect(component.showEditForm).toBeFalse();
  }));

  it('should show default error message on retrieve error without message', fakeAsync(() => {
    const showErrorSpy = spyOn<any>(component, 'showErrorSnackbar');
    component.filterForm.setValue({ processCode: 'FROZ', productCode: 'P1', componentPrefix: 'A' });
    component.validatedUnitData = { parsedUnitId: 'U1', isValid: true } as any;
    component.selectedCollDate = '2025-12-05';
    (component as any).unitIdField = { isValid: true, clear: () => {} };

    serviceSpy.getByKey.and.returnValue(throwError(() => ({})));

    component.onRetrieve();
    tick();

    expect(showErrorSpy).toHaveBeenCalledWith('An error occurred while retrieving spiking details.');
  }));

  // ── loadEditDropdowns ─────────────────────────────────────────────

  it('should load edit dropdowns and populate form on success', fakeAsync(() => {
    serviceSpy.getSpikingTypes.and.returnValue(of(mockSpikingTypes));
    serviceSpy.getBagLotNumbers.and.returnValue(of(mockLotNumbers));
    serviceSpy.getFilterLotNumbers.and.returnValue(of(mockLotNumbers));

    (component as any).loadEditDropdowns(mockSpikingData);
    tick();

    expect(component.spikingTypes).toEqual(mockSpikingTypes);
    expect(component.filteredSpikingTypes).toEqual(mockSpikingTypes);
    expect(component.bagLotNumbers.length).toBeGreaterThan(0);
    expect(component.filterLotNumbers.length).toBeGreaterThan(0);
    expect(component.isLoadingDropdowns).toBeFalse();
    expect(component.editForm.get('spikingType')?.value).toBe('REG');
    expect(component.editForm.get('bagsSpiked')?.value).toBe(1);
    expect(component.editForm.get('bagsForComponents')?.value).toBe(1);
  }));

  it('should handle loadEditDropdowns error and still populate form', fakeAsync(() => {
    serviceSpy.getSpikingTypes.and.returnValue(throwError(() => new Error('fail')));

    (component as any).loadEditDropdowns(mockSpikingData);
    tick();

    expect(component.spikingTypes).toEqual([]);
    expect(component.filteredSpikingTypes).toEqual([]);
    expect(component.isLoadingDropdowns).toBeFalse();
    // populateEditForm is still called, which adds the data's bagLotNumber
    expect(component.bagLotNumbers.some(l => l.lotNumber === 'FEDONUT01')).toBeTrue();
    // populateEditForm should still be called
    expect(component.editForm.get('spikingType')?.value).toBe('REG');
  }));

  // ── populateEditForm ──────────────────────────────────────────────

  it('should add bagLotNumber to list if not present', () => {
    component.bagLotNumbers = [{ lotNumber: 'LOT001' }];
    const data = { ...mockSpikingData, bagLotNumber: 'NEWLOT' };

    (component as any).populateEditForm(data);

    expect(component.bagLotNumbers.some(l => l.lotNumber === 'NEWLOT')).toBeTrue();
  });

  it('should add filterLotNumber to list if not present', () => {
    component.filterLotNumbers = [{ lotNumber: 'LOT001' }];
    const data = { ...mockSpikingData, filterLotNumber: 'NEWFILTER' };

    (component as any).populateEditForm(data);

    expect(component.filterLotNumbers.some(l => l.lotNumber === 'NEWFILTER')).toBeTrue();
  });

  it('should not duplicate bagLotNumber if already in list', () => {
    component.bagLotNumbers = [{ lotNumber: 'FEDONUT01' }];
    const originalLength = component.bagLotNumbers.length;

    (component as any).populateEditForm(mockSpikingData);

    expect(component.bagLotNumbers.length).toBe(originalLength);
  });

  it('should handle null filterLotNumber without adding to list', () => {
    component.filterLotNumbers = [{ lotNumber: 'LOT001' }];
    const data = { ...mockSpikingData, filterLotNumber: null as any };

    (component as any).populateEditForm(data);

    // filterLotNumber is empty string (falsy), so no addition
    expect(component.editForm.get('filterLotNumber')?.value).toBe('');
  });

  // ── onSave ────────────────────────────────────────────────────────

  it('should not save if edit form is invalid', () => {
    component.currentData = mockSpikingData;
    component.editForm.patchValue({ spikingType: '' });
    component.onSave();
    expect(serviceSpy.update).not.toHaveBeenCalled();
  });

  it('should not save if currentData is null', () => {
    component.currentData = null;
    component.editForm.setValue({
      spikingType: 'REG',
      bagLotNumber: 'LOT001',
      filterLotNumber: '',
      bagsSpiked: 5,
      bagsForComponents: 3,
    });
    component.onSave();
    expect(serviceSpy.update).not.toHaveBeenCalled();
  });

  it('should save successfully and call clearAll', fakeAsync(() => {
    const clearSpy = spyOn(component, 'clearAll');
    component.currentData = { ...mockSpikingData, bagsUsed: 0 };
    component.editForm.setValue({
      spikingType: 'REG',
      bagLotNumber: 'LOT001',
      filterLotNumber: 'FILTER1',
      bagsSpiked: 5,
      bagsForComponents: 3,
    });

    serviceSpy.update.and.returnValue(of({ success: true, message: 'ok', statusCode: 200, data: mockSpikingData }));

    component.onSave();
    tick();

    expect(serviceSpy.update).toHaveBeenCalled();
    expect(clearSpy).toHaveBeenCalled();
    expect(component.isSaving).toBeFalse();
  }));

  it('should show success snackbar on save success', fakeAsync(() => {
    const successSpy = spyOn<any>(component, 'showSuccessSnackbar');
    spyOn(component, 'clearAll');
    component.currentData = { ...mockSpikingData, bagsUsed: 0 };
    component.editForm.setValue({
      spikingType: 'REG',
      bagLotNumber: 'LOT001',
      filterLotNumber: '',
      bagsSpiked: 5,
      bagsForComponents: 3,
    });

    serviceSpy.update.and.returnValue(of({ success: true, message: 'ok', statusCode: 200, data: mockSpikingData }));

    component.onSave();
    tick();

    expect(successSpy).toHaveBeenCalledWith(
      jasmine.stringContaining('updated successfully')
    );
  }));

  it('should show error snackbar on save error with message', fakeAsync(() => {
    const errorSpy = spyOn<any>(component, 'showErrorSnackbar');
    component.currentData = { ...mockSpikingData, bagsUsed: 0 };
    component.editForm.setValue({
      spikingType: 'REG',
      bagLotNumber: 'LOT001',
      filterLotNumber: '',
      bagsSpiked: 5,
      bagsForComponents: 3,
    });

    serviceSpy.update.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));

    component.onSave();
    tick();

    expect(errorSpy).toHaveBeenCalledWith('Server error');
    expect(component.isSaving).toBeFalse();
  }));

  it('should show default error message on save error without message', fakeAsync(() => {
    const errorSpy = spyOn<any>(component, 'showErrorSnackbar');
    component.currentData = { ...mockSpikingData, bagsUsed: 0 };
    component.editForm.setValue({
      spikingType: 'REG',
      bagLotNumber: 'LOT001',
      filterLotNumber: '',
      bagsSpiked: 5,
      bagsForComponents: 3,
    });

    serviceSpy.update.and.returnValue(throwError(() => ({})));

    component.onSave();
    tick();

    expect(errorSpy).toHaveBeenCalledWith('An error occurred while updating spiking details.');
  }));

  it('should pass null for filterLotNumber in dto when empty', fakeAsync(() => {
    spyOn(component, 'clearAll');
    component.currentData = { ...mockSpikingData, bagsUsed: 0 };
    component.editForm.setValue({
      spikingType: 'REG',
      bagLotNumber: 'LOT001',
      filterLotNumber: '',
      bagsSpiked: 5,
      bagsForComponents: 3,
    });

    serviceSpy.update.and.returnValue(of({ success: true, message: 'ok', statusCode: 200, data: mockSpikingData }));

    component.onSave();
    tick();

    const updateCall = serviceSpy.update.calls.mostRecent();
    const dto = updateCall.args[5];
    expect(dto.filterLotNumber).toBeNull();
  }));

  // ── onNumericKeyPress ─────────────────────────────────────────────

  it('should allow digit key press', () => {
    const event = { which: 50, keyCode: 50, preventDefault: jasmine.createSpy('preventDefault'), target: { value: '1', selectionStart: 1, selectionEnd: 1 } } as any;
    component.onNumericKeyPress(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should prevent non-digit key press', () => {
    const event = { which: 65, keyCode: 65, preventDefault: jasmine.createSpy('preventDefault'), target: { value: '', selectionStart: 0, selectionEnd: 0 } } as any;
    component.onNumericKeyPress(event);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should prevent key press when input already has 2 digits and no selection', () => {
    const event = { which: 51, keyCode: 51, preventDefault: jasmine.createSpy('preventDefault'), target: { value: '12', selectionStart: 2, selectionEnd: 2 } } as any;
    component.onNumericKeyPress(event);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should allow key press when input has 2 digits but text is selected', () => {
    const event = { which: 51, keyCode: 51, preventDefault: jasmine.createSpy('preventDefault'), target: { value: '12', selectionStart: 0, selectionEnd: 2 } } as any;
    component.onNumericKeyPress(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  // ── onPasteNumeric ────────────────────────────────────────────────

  it('should paste only numeric values and truncate to 2 characters', () => {
    const inputEl = { value: '', dispatchEvent: jasmine.createSpy('dispatchEvent') } as any;
    const event = {
      preventDefault: jasmine.createSpy('preventDefault'),
      clipboardData: { getData: () => 'abc123def456' },
      target: inputEl,
    } as any;

    component.onPasteNumeric(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(inputEl.value).toBe('12');
    expect(inputEl.dispatchEvent).toHaveBeenCalled();
  });

  it('should handle paste with no clipboard data', () => {
    const inputEl = { value: '', dispatchEvent: jasmine.createSpy('dispatchEvent') } as any;
    const event = {
      preventDefault: jasmine.createSpy('preventDefault'),
      clipboardData: null,
      target: inputEl,
    } as any;

    component.onPasteNumeric(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(inputEl.value).toBe('');
  });

  // ── isBagLotInList / isFilterLotInList edge cases ─────────────────

  it('should return true for empty value in isBagLotInList', () => {
    component.bagLotNumbers = mockLotNumbers;
    expect(component.isBagLotInList('')).toBeTrue();
  });

  it('should return true for empty value in isFilterLotInList', () => {
    component.filterLotNumbers = mockLotNumbers;
    expect(component.isFilterLotInList('')).toBeTrue();
  });

  it('should be case-insensitive for isBagLotInList', () => {
    component.bagLotNumbers = mockLotNumbers;
    expect(component.isBagLotInList('lot001')).toBeTrue();
    expect(component.isBagLotInList('LOT001')).toBeTrue();
  });

  it('should be case-insensitive for isFilterLotInList', () => {
    component.filterLotNumbers = mockLotNumbers;
    expect(component.isFilterLotInList('lot002')).toBeTrue();
    expect(component.isFilterLotInList('LOT002')).toBeTrue();
  });

  // ── search control subscriptions (filter methods) ─────────────────

  it('should filter process codes by code', () => {
    component.processCodes = mockProcessCodes;
    component.processSearchControl.setValue('FROZ');
    expect(component.filteredProcessCodes.length).toBe(1);
    expect(component.filteredProcessCodes[0].code).toBe('FROZ');
  });

  it('should filter process codes by description', () => {
    component.processCodes = mockProcessCodes;
    component.processSearchControl.setValue('Regular');
    expect(component.filteredProcessCodes.length).toBe(1);
    expect(component.filteredProcessCodes[0].code).toBe('REG');
  });

  it('should return all process codes when search is empty', () => {
    component.processCodes = mockProcessCodes;
    component.processSearchControl.setValue('');
    expect(component.filteredProcessCodes.length).toBe(mockProcessCodes.length);
  });

  it('should filter product codes by productCode', () => {
    component.productCodes = mockProductCodes;
    component.productSearchControl.setValue('E0385');
    expect(component.filteredProductCodes.length).toBe(1);
  });

  it('should return all product codes when search is empty', () => {
    component.productCodes = mockProductCodes;
    component.productSearchControl.setValue('');
    expect(component.filteredProductCodes.length).toBe(mockProductCodes.length);
  });

  it('should filter spiking types by code', () => {
    component.spikingTypes = mockSpikingTypes;
    component.spikingTypeSearchControl.setValue('SPL');
    expect(component.filteredSpikingTypes.length).toBe(1);
    expect(component.filteredSpikingTypes[0].code).toBe('SPL');
  });

  it('should filter spiking types by description', () => {
    component.spikingTypes = mockSpikingTypes;
    component.spikingTypeSearchControl.setValue('Special');
    expect(component.filteredSpikingTypes.length).toBe(1);
    expect(component.filteredSpikingTypes[0].code).toBe('SPL');
  });

  it('should return all spiking types when search is empty', () => {
    component.spikingTypes = mockSpikingTypes;
    component.spikingTypeSearchControl.setValue('');
    expect(component.filteredSpikingTypes.length).toBe(mockSpikingTypes.length);
  });

  // ── bag lot search control subscription ───────────────────────────

  it('should filter bag lots by search value', () => {
    component.bagLotNumbers = mockLotNumbers;
    component.bagLotSearchControl.setValue('LOT001');
    expect(component.filteredBagLotNumbers.length).toBe(1);
    expect(component.filteredBagLotNumbers[0].lotNumber).toBe('LOT001');
  });

  it('should return all bag lots when search is empty', () => {
    component.bagLotNumbers = mockLotNumbers;
    component.bagLotSearchControl.setValue('');
    expect(component.filteredBagLotNumbers).toEqual(mockLotNumbers);
  });

  // ── filter lot search control subscription ────────────────────────

  it('should convert filter lot search value to uppercase', () => {
    component.filterLotSearchControl.setValue('lowercase');
    expect(component.filterLotSearchValue).toBe('LOWERCASE');
  });

  it('should filter filter lots by search value', () => {
    component.filterLotNumbers = mockLotNumbers;
    component.filterLotSearchControl.setValue('LOT002');
    expect(component.filteredFilterLotNumbers.length).toBe(1);
    expect(component.filteredFilterLotNumbers[0].lotNumber).toBe('LOT002');
  });

  it('should return all filter lots when search is empty', () => {
    component.filterLotNumbers = mockLotNumbers;
    component.filterLotSearchControl.setValue('');
    expect(component.filteredFilterLotNumbers).toEqual(mockLotNumbers);
  });

  // ── bagLotNumber value change subscription (custom value) ─────────

  it('should add custom bagLotNumber to list when value is not in list', () => {
    component.bagLotNumbers = [{ lotNumber: 'LOT001' }];
    component.editForm.get('bagLotNumber')?.setValue('CUSTOM_LOT');
    expect(component.bagLotNumbers.some(l => l.lotNumber === 'CUSTOM_LOT')).toBeTrue();
  });

  it('should not add duplicate bagLotNumber when already in list', () => {
    component.bagLotNumbers = [{ lotNumber: 'LOT001' }];
    const initialLength = component.bagLotNumbers.length;
    component.editForm.get('bagLotNumber')?.setValue('LOT001');
    expect(component.bagLotNumbers.length).toBe(initialLength);
  });

  // ── filterLotNumber value change subscription (custom value) ──────

  it('should add custom filterLotNumber to list when value is not in list', () => {
    component.filterLotNumbers = [{ lotNumber: 'LOT001' }];
    component.editForm.get('filterLotNumber')?.setValue('CUSTOM_FILTER');
    expect(component.filterLotNumbers.some(l => l.lotNumber === 'CUSTOM_FILTER')).toBeTrue();
  });

  it('should not add duplicate filterLotNumber when already in list', () => {
    component.filterLotNumbers = [{ lotNumber: 'LOT001' }];
    const initialLength = component.filterLotNumbers.length;
    component.editForm.get('filterLotNumber')?.setValue('LOT001');
    expect(component.filterLotNumbers.length).toBe(initialLength);
  });

  // ── edit form validators ──────────────────────────────────────────

  it('should require spikingType in edit form', () => {
    component.editForm.patchValue({ spikingType: '' });
    expect(component.editForm.get('spikingType')?.hasError('required')).toBeTrue();
  });

  it('should require bagLotNumber in edit form', () => {
    component.editForm.patchValue({ bagLotNumber: '' });
    expect(component.editForm.get('bagLotNumber')?.hasError('required')).toBeTrue();
  });

  it('should not require filterLotNumber in edit form', () => {
    component.editForm.patchValue({ filterLotNumber: '' });
    expect(component.editForm.get('filterLotNumber')?.hasError('required')).toBeFalsy();
  });

  it('should reject negative bagsSpiked', () => {
    component.editForm.patchValue({ bagsSpiked: -1 });
    expect(component.editForm.get('bagsSpiked')?.invalid).toBeTrue();
  });

  it('should accept zero bagsSpiked', () => {
    component.editForm.patchValue({ bagsSpiked: 0 });
    expect(component.editForm.get('bagsSpiked')?.invalid).toBeFalse();
  });

  it('should accept max bagsSpiked of 99', () => {
    component.editForm.patchValue({ bagsSpiked: 99 });
    expect(component.editForm.get('bagsSpiked')?.invalid).toBeFalse();
  });

  it('should reject bagsForComponents of 100', () => {
    component.editForm.patchValue({ bagsForComponents: 100 });
    expect(component.editForm.get('bagsForComponents')?.invalid).toBeTrue();
  });

  // ── isFilterFieldInvalid / isEditFieldInvalid edge cases ──────────

  it('should return false for non-existent filter field', () => {
    expect(component.isFilterFieldInvalid('nonExistentField')).toBeFalse();
  });

  it('should return false for non-existent edit field', () => {
    expect(component.isEditFieldInvalid('nonExistentField')).toBeFalse();
  });

  it('should return false for filter field that is invalid but untouched', () => {
    component.filterForm.patchValue({ processCode: '' });
    expect(component.isFilterFieldInvalid('processCode')).toBeFalse();
  });

  it('should return false for edit field that is invalid but untouched', () => {
    component.editForm.patchValue({ spikingType: '' });
    // Reset touched state
    component.editForm.get('spikingType')?.markAsUntouched();
    expect(component.isEditFieldInvalid('spikingType')).toBeFalse();
  });

  // ── showSuccessSnackbar / showErrorSnackbar ───────────────────────

  it('should call snackBar.open with success panelClass', () => {
    const injectedSnackBar = (component as any).snackBar;
    const openSpy = spyOn(injectedSnackBar, 'open');
    (component as any).showSuccessSnackbar('Test success');
    expect(openSpy).toHaveBeenCalledWith(
      'Test success',
      'DISMISS',
      jasmine.objectContaining({
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar'],
      })
    );
  });

  it('should call snackBar.open with error panelClass', () => {
    const injectedSnackBar = (component as any).snackBar;
    const openSpy = spyOn(injectedSnackBar, 'open');
    (component as any).showErrorSnackbar('Test error');
    expect(openSpy).toHaveBeenCalledWith(
      'Test error',
      'DISMISS',
      jasmine.objectContaining({
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar'],
      })
    );
  });

  // ── clearAll with unitIdField undefined ────────────────────────────

  it('should handle clearAll when unitIdField is undefined', () => {
    (component as any).unitIdField = undefined;
    expect(() => component.clearAll()).not.toThrow();
    expect(component.showEditForm).toBeFalse();
    expect(component.currentData).toBeNull();
  });

  // ── onProcessChange when unitIdField is undefined ─────────────────

  it('should handle onProcessChange when unitIdField is undefined', () => {
    (component as any).unitIdField = undefined;
    expect(() => component.onProcessChange()).not.toThrow();
    expect(component.productCodes).toEqual([]);
  });

  // ── onCancel resets edit form values ───────────────────────────────

  it('should reset edit form values on cancel', () => {
    component.editForm.setValue({
      spikingType: 'REG',
      bagLotNumber: 'LOT001',
      filterLotNumber: 'FILTER1',
      bagsSpiked: 10,
      bagsForComponents: 5,
    });
    component.showEditForm = true;
    component.currentData = mockSpikingData;

    component.onCancel();

    expect(component.editForm.get('spikingType')?.value).toBeNull();
    expect(component.editForm.get('bagLotNumber')?.value).toBeNull();
    expect(component.showEditForm).toBeFalse();
    expect(component.currentData).toBeNull();
  });

  // ── onRetrieve sets isLoading correctly ───────────────────────────

  it('should set isLoading to false after retrieve completes', fakeAsync(() => {
    component.filterForm.setValue({ processCode: 'FROZ', productCode: 'P1', componentPrefix: 'A' });
    component.validatedUnitData = { parsedUnitId: 'U1', isValid: true } as any;
    component.selectedCollDate = '2025-12-05';
    (component as any).unitIdField = { isValid: true, clear: () => {} };

    serviceSpy.getByKey.and.returnValue(of(mockSpikingData));
    serviceSpy.getSpikingTypes.and.returnValue(of(mockSpikingTypes));
    serviceSpy.getBagLotNumbers.and.returnValue(of(mockLotNumbers));
    serviceSpy.getFilterLotNumbers.and.returnValue(of(mockLotNumbers));

    expect(component.isLoading).toBeFalse();
    component.onRetrieve();
    // isLoading should be true right after onRetrieve call before tick
    // (synchronous setting before async finalize)
    tick();
    expect(component.isLoading).toBeFalse();
  }));

});
