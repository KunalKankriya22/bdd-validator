import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { EnterComponentDifferentialComponent } from './enter-component-differential';
import { EnterComponentDifferentialService } from './services/enter-component-differential.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import type { UnitValidationResponse } from '@shared/components/unit-id-field';
import { createMockSnackbarService, createMockPageHeaderService } from '@shared/testing/common-mocks';

describe('EnterComponentDifferentialComponent', () => {
  let component: EnterComponentDifferentialComponent;
  let fixture: ComponentFixture<EnterComponentDifferentialComponent>;
  let mockService: jasmine.SpyObj<EnterComponentDifferentialService>;
  let mockSnackbar: jasmine.SpyObj<SnackbarService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let chapterChangedSubject: Subject<void>;

  const mockUnitValidation: UnitValidationResponse = {
    parsedUnitId: 'W1234-18-031311-Z',
    checkDigit: null,
    codeScheme: 'I',
    manualUnitId: 'W1234-18-031311-Z',
    codabarUnitScheme: null,
    entryMode: 'S',
    barcodeType: 'CODE128',
    chapterScheme: 'I',
  };

  function simulateUnitValidated(unitId = 'W1234-18-031311-Z'): void {
    component.onUnitValidated({ ...mockUnitValidation, parsedUnitId: unitId });
  }

  function selectProcessCode(code: string): void {
    component.searchForm.patchValue({ processCode: code }, { emitEvent: false });
    component.onProcessCodeChange();
  }

  function selectStageCode(code: string): void {
    component.searchForm.patchValue({ stageCode: code }, { emitEvent: false });
    component.onStageCodeChange();
  }

  function selectProductCode(code: string): void {
    component.searchForm.patchValue({ productCode: code }, { emitEvent: false });
    component.onProductCodeChange();
  }

  beforeEach(() => {

    mockService = jasmine.createSpyObj('EnterComponentDifferentialService', [
      'getProcessCodes',
      'getStageCodes',
      'getProductCodes',
      'getCellCodes',
      'getUnitInfo',
      'getComponentInfo',
      'search',
      'getById',
      'create',
      'update',
    ]);
    mockSnackbar = createMockSnackbarService();
    mockPageHeaderService = createMockPageHeaderService();
    Object.defineProperty(mockPageHeaderService, 'pageHeaderData', {
      value: signal({ title: 'Enter Component Differential', subtitle: '' }),
      writable: false,
    });

    chapterChangedSubject = new Subject<void>();

    mockPageHeaderService.getTitle.and.returnValue('Enter Component Differential');
    mockPageHeaderService.getSubtitle.and.returnValue('');

    mockService.getProcessCodes.and.returnValue(of([
      { processCode: 'FROZ', description: 'Frozen' },
      { processCode: 'LIQD', description: 'Liquid' },
    ]));
    mockService.getStageCodes.and.returnValue(of([
      { stageCode: '01', description: 'Stage 01' },
      { stageCode: '02', description: 'Stage 02' },
    ]));
    mockService.getProductCodes.and.returnValue(of([
      { productCode: 'E0385V00', productDesc: 'FROZEN PLASMA', componentPrefix: '00' },
    ]));
    mockService.getCellCodes.and.returnValue(of([
      { cellCode: 'GRAN', description: 'Granulocytes' },
      { cellCode: 'MONO', description: 'Monocytes' },
      { cellCode: 'LYMP', description: 'Lymphocytes' },
    ]));
    mockService.getUnitInfo.and.returnValue(of({ collDate: '2025-09-18T00:00:00' }));
    mockService.getComponentInfo.and.returnValue(of({ aboRh: 'O POS', expiryDate: '2026-09-14T00:00:00' }));
    mockService.search.and.returnValue(of({
      data: [{ differentialId: 1431, unitId: 'W1234-18-031311-Z', collDate: '2025-09-18T00:00:00',
               productCode: 'E0385V00', componentPrefix: '00', processCode: 'FROZ', stageCode: '01',
               insertDats: '2025-09-24T00:00:00', insertUserId: 'NITOR1' }],
      total: 1,
    }));
    mockService.getById.and.returnValue(of({
      differentialId: 1431, unitId: 'W1234-18-031311-Z', collDate: '2025-09-18T00:00:00',
      productCode: 'E0385V00', componentPrefix: '00', processCode: 'FROZ', stageCode: '01',
      insertDats: '2025-09-24T00:00:00', insertUserId: 'NITOR1',
      details: [
        { differentialId: 1431, cellCode: 'GRAN', cellCodeDesc: 'Granulocytes', cellCount: 60, originalCellCode: 'GRAN' },
        { differentialId: 1431, cellCode: 'LYMP', cellCodeDesc: 'Lymphocytes', cellCount: 30, originalCellCode: 'LYMP' },
        { differentialId: 1431, cellCode: 'BASO', cellCodeDesc: 'Basophils', cellCount: 10, originalCellCode: 'BASO' },
      ],
    }));
    mockService.create.and.returnValue(of({
      success: true, message: 'Created', statusCode: 201,
      data: { differentialId: 1432, cellCode: 'MONO' },
    }));
    mockService.update.and.returnValue(of({
      success: true, message: 'Updated', statusCode: 200,
      data: { differentialId: 1431, cellCode: 'GRAN' },
    }));
    mockPageHeaderService.getCurrentMenuItem.and.returnValue(undefined);



      TestBed.configureTestingModule({
      imports: [
        EnterComponentDifferentialComponent,
        NoopAnimationsModule,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EnterComponentDifferentialService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbar },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: { chapterChanged$: chapterChangedSubject.asObservable() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
      ],
    });


    


      mockService.getProcessCodes.calls.reset();


      mockService.getStageCodes.calls.reset();


      mockService.getProductCodes.calls.reset();


      mockService.getCellCodes.calls.reset();


      mockService.getUnitInfo.calls.reset();


      mockService.getComponentInfo.calls.reset();


      mockService.search.calls.reset();


      mockService.getById.calls.reset();


      mockService.create.calls.reset();


      mockService.update.calls.reset();


      mockPageHeaderService.getTitle.calls.reset();


      mockPageHeaderService.getSubtitle.calls.reset();


      mockPageHeaderService.getCurrentMenuItem.calls.reset();


      mockPageHeaderService.getTitle.and.returnValue('Enter Component Differential');


      mockPageHeaderService.getSubtitle.and.returnValue('');


      mockService.getUnitInfo.and.returnValue(of({ collDate: '2025-09-18T00:00:00' }));


      mockService.getComponentInfo.and.returnValue(of({ aboRh: 'O POS', expiryDate: '2026-09-14T00:00:00' }));


      mockPageHeaderService.getCurrentMenuItem.and.returnValue(undefined);


    fixture = TestBed.createComponent(EnterComponentDifferentialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });




  it('should load cell codes on init', () => {
    expect(mockService.getCellCodes).toHaveBeenCalled();
    expect(component.cellCodes().length).toBe(3);
  });

  it('should load stage codes when process code is selected', () => {
    selectProcessCode('FROZ');
    expect(mockService.getStageCodes).toHaveBeenCalledWith('FROZ');
    expect(component.stageCodes().length).toBe(2);
    expect(component.filteredStageCodes.length).toBe(2);
  });

  it('should call getUnitInfo when unit is validated', () => {
    selectProcessCode('FROZ');
    simulateUnitValidated();
    expect(mockService.getUnitInfo).toHaveBeenCalledWith('W1234-18-031311-Z');
  });

  it('should load product codes after unit info returns collDate', () => {
    selectProcessCode('FROZ');
    simulateUnitValidated();
    expect(mockService.getProductCodes).toHaveBeenCalledWith('W1234-18-031311-Z', '2025-09-18T00:00:00', 'FROZ');
    expect(component.productCodes().length).toBe(1);
  });

  it('should set componentPrefix when product code is selected', () => {
    selectProcessCode('FROZ');
    simulateUnitValidated();
    selectProductCode('E0385V00');
    expect(component.selectedComponentPrefix()).toBe('00');
  });

  it('should load component info when product code is selected', () => {
    selectProcessCode('FROZ');
    simulateUnitValidated();
    selectProductCode('E0385V00');
    expect(mockService.getComponentInfo).toHaveBeenCalled();
    expect(component.aboRhValue()).toBe('O POS');
  });

  it('should clear stage codes when process code is cleared', () => {
    selectProcessCode('FROZ');
    expect(component.stageCodes().length).toBe(2);
    selectProcessCode('');
    expect(component.stageCodes().length).toBe(0);
    expect(component.filteredStageCodes.length).toBe(0);
  });









  describe('retrieve', () => {
    beforeEach(() => {
      component.selectedProcessCode.set('FROZ');
      component.selectedStageCode.set('01');
      component.selectedUnitId.set('W1234-18-031311-Z');
      component.selectedProductCode.set('E0385V00');
      component.selectedComponentPrefix.set('00');
      component.collDate.set('2025-09-18T00:00:00');
    });

    it('should call search and getById to populate table data', () => {
      component.onRetrieve();
      expect(mockService.search).toHaveBeenCalled();
      expect(mockService.getById).toHaveBeenCalledWith(1431);
      expect(component.cellCountRows().length).toBe(3);
      expect(component.hasSearched()).toBeTrue();
      expect(component.differentialId()).toBe(1431);
    });

    it('should handle empty search results', () => {
      mockService.search.and.returnValue(of({ data: [], total: 0 }));
      component.onRetrieve();
      expect(component.differentialId()).toBeNull();
      expect(component.cellCountRows().length).toBe(0);
    });


  });

  describe('side panel', () => {
    beforeEach(() => {
      component.selectedProcessCode.set('FROZ');
      component.selectedStageCode.set('01');
      component.selectedUnitId.set('W1234-18-031311-Z');
      component.selectedProductCode.set('E0385V00');
      component.selectedComponentPrefix.set('00');
      component.collDate.set('2025-09-18T00:00:00');
      component.onRetrieve();
    });



    it('should open side panel in edit mode on row action', () => {
      const row = component.cellCountRows()[0];
      component.onRowAction({ action: 'edit', row });
      expect(component.sidePanelOpen()).toBeTrue();
      expect(component.sidePanelMode()).toBe('edit');
      expect(component.sidePanelData()).toBe(row);
    });


  });

  describe('create cell count', () => {
    beforeEach(() => {
      component.selectedProcessCode.set('FROZ');
      component.selectedStageCode.set('01');
      component.selectedUnitId.set('W1234-18-031311-Z');
      component.selectedProductCode.set('E0385V00');
      component.selectedComponentPrefix.set('00');
      component.collDate.set('2025-09-18T00:00:00');
      component.hasSearched.set(true);
    });

    it('should call create service and show success snackbar', () => {
      component.onAddNew();
      component.onSidePanelSave({ cellCode: 'MONO', cellCount: 5 });

      expect(mockService.create).toHaveBeenCalledWith(jasmine.objectContaining({
        unitId: 'W1234-18-031311-Z',
        collDate: '2025-09-18T00:00:00',
        productCode: 'E0385V00',
        componentPrefix: '00',
        processCode: 'FROZ',
        stageCode: '01',
        cellCode: 'MONO',
        cellCount: 5,
      }));
      expect(mockSnackbar.showSuccess).toHaveBeenCalled();
    });

    it('should close side panel after successful create', () => {
      component.onAddNew();
      component.onSidePanelSave({ cellCode: 'MONO', cellCount: 5 });
      expect(component.sidePanelOpen()).toBeFalse();
    });

    it('should handle create error gracefully', () => {
      mockService.create.and.returnValue(throwError(() => ({ error: { message: 'fail' } })));
      component.onAddNew();
      component.onSidePanelSave({ cellCode: 'MONO', cellCount: 5 });
      expect(component.saving()).toBeFalse();
      expect(mockSnackbar.showError).toHaveBeenCalled();
    });
  });

  describe('update cell count', () => {
    beforeEach(() => {
      component.selectedProcessCode.set('FROZ');
      component.selectedStageCode.set('01');
      component.selectedUnitId.set('W1234-18-031311-Z');
      component.selectedProductCode.set('E0385V00');
      component.selectedComponentPrefix.set('00');
      component.collDate.set('2025-09-18T00:00:00');
      component.differentialId.set(1431);
      component.cellCountRows.set([
        { differentialId: 1431, cellCode: 'GRAN', cellCodeDesc: 'Granulocytes', cellCount: 60, originalCellCode: 'GRAN' },
      ]);
      component.hasSearched.set(true);
    });

    it('should call update service with correct params', () => {
      const row = component.cellCountRows()[0];
      component.onRowAction({ action: 'edit', row });
      component.onSidePanelSave({ cellCode: 'GRAN', cellCount: 65 });

      expect(mockService.update).toHaveBeenCalledWith(1431, 'GRAN', { cellCount: 65 });
      expect(mockSnackbar.showSuccess).toHaveBeenCalled();
    });
  });

  describe('clear all', () => {
    it('should reset all forms and state', () => {
      selectProcessCode('FROZ');
      component.selectedStageCode.set('01');
      component.selectedUnitId.set('W1234-18-031311-Z');
      component.collDate.set('2025-09-18T00:00:00');

      component.onClearAll();

      expect(component.searchForm.get('processCode')?.value).toBeFalsy();
      expect(component.searchForm.get('stageCode')?.value).toBeFalsy();
      expect(component.hasSearched()).toBeFalse();
      expect(component.cellCountRows().length).toBe(0);
      expect(component.stageCodes().length).toBe(0);
      expect(component.productCodes().length).toBe(0);
      expect(component.filteredStageCodes.length).toBe(0);
      expect(component.filteredProductCodes.length).toBe(0);
      expect(component.selectedUnitId()).toBe('');
      expect(component.selectedProcessCode()).toBe('');
      expect(component.selectedStageCode()).toBe('');
      expect(component.selectedProductCode()).toBe('');
      expect(component.collDate()).toBe('');
      expect(component.differentialId()).toBeNull();
      expect(component.aboRhValue()).toBe('--');
      expect(component.expiryDateValue()).toBe('--');
    });
  });

  describe('cascading disabled state', () => {












    it('should disable RETRIEVE when not all fields are filled', () => {
      expect(component.retrieveDisabled()).toBeTrue();
      component.selectedProcessCode.set('FROZ');
      expect(component.retrieveDisabled()).toBeTrue();
    });

    it('should enable RETRIEVE when all required fields are filled', () => {
      component.selectedProcessCode.set('FROZ');
      component.selectedStageCode.set('01');
      component.selectedUnitId.set('W1234-18-031311-Z');
      component.selectedProductCode.set('E0385V00');
      expect(component.retrieveDisabled()).toBeFalse();
    });
  });

  describe('chapter change', () => {
    it('should clear all and reload data when chapter changes', () => {
      component.selectedProcessCode.set('FROZ');
      component.selectedStageCode.set('01');
      component.selectedUnitId.set('W1234-18-031311-Z');
      component.selectedProductCode.set('E0385V00');

      mockService.getProcessCodes.calls.reset();
      mockService.getCellCodes.calls.reset();
      chapterChangedSubject.next();

      expect(component.selectedProcessCode()).toBe('');
      expect(component.selectedStageCode()).toBe('');
      expect(component.selectedUnitId()).toBe('');
      expect(component.selectedProductCode()).toBe('');
      expect(mockService.getProcessCodes).toHaveBeenCalledTimes(1);
      expect(mockService.getCellCodes).toHaveBeenCalledTimes(1);
    });
  });

  describe('page header', () => {


    it('should use menu item label when available', () => {
      mockPageHeaderService.getCurrentMenuItem.and.returnValue({ label: 'Custom Title' } as any);
      component.ngOnInit();
      expect(component.pageHeaderConfig.breadcrumbs[1].label).toBe('Custom Title');
    });
  });
});
