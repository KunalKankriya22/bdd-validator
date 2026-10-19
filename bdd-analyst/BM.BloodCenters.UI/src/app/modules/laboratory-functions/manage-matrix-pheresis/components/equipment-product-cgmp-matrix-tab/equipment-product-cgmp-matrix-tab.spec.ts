/**
 * Unit Tests for Equipment/Product cGMP Matrix Tab Component
 * JIRA: MLT-12865
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { EquipmentProductCgmpMatrixTabComponent } from './equipment-product-cgmp-matrix-tab';
import { MatrixPheresisService } from '../../services/matrix-pheresis.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { createMockTranslateService } from '@shared/testing/common-mocks';

describe('EquipmentProductCgmpMatrixTabComponent', () => {
  let component: EquipmentProductCgmpMatrixTabComponent;
  let fixture: ComponentFixture<EquipmentProductCgmpMatrixTabComponent>;
  let mockService: jasmine.SpyObj<MatrixPheresisService>;

  const mockEquipmentTypes = [
    { code: 'EQ01', codeDesc: 'Equipment One' },
    { code: 'EQ02', codeDesc: 'Equipment Two' }
  ];

  const mockProcedures = [
    { code: 'PH', codeDesc: 'Pheresis' },
    { code: 'WB', codeDesc: 'Whole Blood' }
  ];

  const mockProductTypes = [
    { productCode: 'PLT', productDesc: 'Platelets' },
    { productCode: 'RBC', productDesc: 'Red Blood Cells' }
  ];

  const mockParameterCodes = [
    { code: 'PM01', codeDesc: 'Parameter One' },
    { code: 'PM02', codeDesc: 'Parameter Two' }
  ];

  const mockRecords = [
    {
      equipType: 'EQ01',
      proc: 'PH',
      productCode: 'PLT',
      parmCode: 'PM01',
      acceptMin: 1.5,
      acceptMax: 5.0,
      effDate: '2025-01-01',
      termDate: '2025-12-31',
      lastModifyDate: '2025-06-15'
    }
  ];

  const mockResponse = {
    data: mockRecords,
    totalCount: 1
  };

  beforeEach(() => {

    const mockTranslateService = createMockTranslateService();
    mockService = jasmine.createSpyObj('MatrixPheresisService', [
      'getEquipmentTypesCgmp',
      'getProceduresCgmp',
      'getProductTypesCgmp',
      'getParameterCodesCgmp',
      'getEquipmentCgmpMatrixRecords'
    ]);

    mockService.getEquipmentTypesCgmp.and.returnValue(of(mockEquipmentTypes));
    mockService.getProceduresCgmp.and.returnValue(of(mockProcedures));
    mockService.getProductTypesCgmp.and.returnValue(of(mockProductTypes));
    mockService.getParameterCodesCgmp.and.returnValue(of(mockParameterCodes));



      TestBed.configureTestingModule({
      imports: [
        EquipmentProductCgmpMatrixTabComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatSnackBarModule
      ],
      providers: [
        { provide: MatrixPheresisService, useValue: mockService },
        { provide: TranslateService, useValue: mockTranslateService }
      ]
    });


    


      mockService.getEquipmentTypesCgmp.calls.reset();


      mockService.getProceduresCgmp.calls.reset();


      mockService.getProductTypesCgmp.calls.reset();


      mockService.getParameterCodesCgmp.calls.reset();


      mockService.getEquipmentCgmpMatrixRecords.calls.reset();


      mockService.getEquipmentTypesCgmp.and.returnValue(of(mockEquipmentTypes));


      mockService.getProceduresCgmp.and.returnValue(of(mockProcedures));


      mockService.getProductTypesCgmp.and.returnValue(of(mockProductTypes));


      mockService.getParameterCodesCgmp.and.returnValue(of(mockParameterCodes));


    fixture = TestBed.createComponent(EquipmentProductCgmpMatrixTabComponent);
    component = fixture.componentInstance;


    });


  describe('Initialization', () => {
    it('should load all dropdowns on init', () => {
      fixture.detectChanges();

      expect(mockService.getEquipmentTypesCgmp).toHaveBeenCalled();
      expect(mockService.getProceduresCgmp).toHaveBeenCalled();
      expect(mockService.getProductTypesCgmp).toHaveBeenCalled();
      expect(mockService.getParameterCodesCgmp).toHaveBeenCalled();
    });

    it('should populate equipment types signal after load', () => {
      fixture.detectChanges();

      expect(component.equipmentTypes()).toEqual(mockEquipmentTypes);
      expect(component.filteredEquipmentTypes()).toEqual(mockEquipmentTypes);
    });

    it('should populate procedures signal after load', () => {
      fixture.detectChanges();

      const expected = mockProcedures.map(p => ({ code: p.code, codeDesc: p.codeDesc }));
      expect(component.procedures()).toEqual(expected);
      expect(component.filteredProcedures()).toEqual(expected);
    });

    it('should populate product types signal after load', () => {
      fixture.detectChanges();

      const expected = mockProductTypes.map(p => ({ productCode: p.productCode, productDesc: p.productDesc }));
      expect(component.productTypes()).toEqual(expected);
      expect(component.filteredProductTypes()).toEqual(expected);
    });

    it('should populate parameter codes signal after load', () => {
      fixture.detectChanges();

      expect(component.parameterCodes()).toEqual(mockParameterCodes);
      expect(component.filteredParameterCodes()).toEqual(mockParameterCodes);
    });





    it('should handle equipment types load error', () => {
      mockService.getEquipmentTypesCgmp.and.returnValue(throwError(() => new Error('Server error')));
      fixture.detectChanges();

      expect(component.equipmentTypes().length).toBe(0);
    });

    it('should handle parameter codes load error and set isLoadingFilters to false', () => {
      mockService.getParameterCodesCgmp.and.returnValue(throwError(() => new Error('Server error')));
      fixture.detectChanges();

      expect(component.isLoadingFilters()).toBeFalse();
    });
  });

  describe('Retrieve', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load records when retrieve is clicked', () => {
      mockService.getEquipmentCgmpMatrixRecords.and.returnValue(of(mockResponse));

      component.filterForm.patchValue({ equipType: 'EQ01' });
      component.onRetrieve();

      expect(mockService.getEquipmentCgmpMatrixRecords).toHaveBeenCalledWith(
        jasmine.any(Number),
        jasmine.any(Number),
        jasmine.objectContaining({ equipType: 'EQ01' })
      );
    });

    it('should reset page to 0 on retrieve', () => {
      mockService.getEquipmentCgmpMatrixRecords.and.returnValue(of(mockResponse));
      component.currentPage.set(3);

      component.onRetrieve();

      expect(component.currentPage()).toBe(0);
    });

    it('should set matrixRecords and totalRecords from response', () => {
      mockService.getEquipmentCgmpMatrixRecords.and.returnValue(of(mockResponse));

      component.onRetrieve();

      expect(component.matrixRecords()).toEqual(mockRecords);
      expect(component.totalRecords()).toBe(1);
    });





    it('should pass all filter values to service', () => {
      mockService.getEquipmentCgmpMatrixRecords.and.returnValue(of(mockResponse));

      component.filterForm.patchValue({
        equipType: 'EQ01',
        proc: 'PH',
        productCode: 'PLT',
        parmCode: 'PM01'
      });
      component.onRetrieve();

      expect(mockService.getEquipmentCgmpMatrixRecords).toHaveBeenCalledWith(
        jasmine.any(Number),
        jasmine.any(Number),
        jasmine.objectContaining({
          equipType: 'EQ01',
          proc: 'PH',
          productCode: 'PLT',
          parmCode: 'PM01'
        })
      );
    });
  });

  describe('Clear All', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset filter form values', () => {
      component.filterForm.patchValue({
        equipType: 'EQ01',
        proc: 'PH',
        productCode: 'PLT',
        parmCode: 'PM01'
      });

      component.onClearAll();

      expect(component.filterForm.get('equipType')?.value).toBeNull();
      expect(component.filterForm.get('proc')?.value).toBeNull();
      expect(component.filterForm.get('productCode')?.value).toBeNull();
      expect(component.filterForm.get('parmCode')?.value).toBeNull();
    });

    it('should clear matrix records', () => {
      component.matrixRecords.set(mockRecords);
      component.onClearAll();

      expect(component.matrixRecords().length).toBe(0);
    });

    it('should reset totalRecords to 0', () => {
      component.totalRecords.set(10);
      component.onClearAll();

      expect(component.totalRecords()).toBe(0);
    });

    it('should reset page to 0', () => {
      component.currentPage.set(5);
      component.onClearAll();

      expect(component.currentPage()).toBe(0);
    });
  });



  describe('Panel Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should open edit panel on row action', () => {
      component.onRowAction({ action: 'edit', row: mockRecords[0] as any });

      expect(component.showPanel()).toBeTrue();
      expect(component.panelMode()).toBe('edit');
      expect(component.selectedRecord()).toEqual(mockRecords[0] as any);
    });

    it('should close panel and clear selected record', () => {
      component.showPanel.set(true);
      component.selectedRecord.set(mockRecords[0] as any);

      component.onPanelClose();

      expect(component.showPanel()).toBeFalse();
      expect(component.selectedRecord()).toBeNull();
    });

    it('should close panel and reload data on save success', () => {
      mockService.getEquipmentCgmpMatrixRecords.and.returnValue(of(mockResponse));
      component.showPanel.set(true);
      component.selectedRecord.set(mockRecords[0] as any);

      component.onPanelSaveSuccess();

      expect(component.showPanel()).toBeFalse();
      expect(component.selectedRecord()).toBeNull();
      expect(mockService.getEquipmentCgmpMatrixRecords).toHaveBeenCalled();
    });

    it('should ignore non-edit row actions', () => {
      component.onRowAction({ action: 'delete', row: mockRecords[0] as any });

      expect(component.showPanel()).toBeFalse();
    });
  });

  describe('Computed Signals', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false for hasData when no records', () => {
      expect(component.hasData()).toBeFalse();
    });

    it('should return true for hasData when records exist', () => {
      component.matrixRecords.set(mockRecords as any);

      expect(component.hasData()).toBeTrue();
    });

    it('should return false for hasFilters when no filters set', () => {
      expect(component.hasFilters()).toBeFalse();
    });

    it('should detect filters via form value check', () => {
      component.filterForm.patchValue({ equipType: 'EQ01' });
      const values = component.filterForm.value;

      expect(!!(values.equipType || values.proc || values.productCode || values.parmCode)).toBeTrue();
    });
  });

  describe('Table Configuration', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should show pagination', () => {
      expect(component.tableConfig().showPagination).toBeTrue();
    });


  });
  describe('Search Filters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should show all equipment types when search is cleared', () => {
      component.equipTypeSearchControl.setValue('One');
      component.equipTypeSearchControl.setValue('');

      expect(component.filteredEquipmentTypes().length).toBe(2);
    });






  });
  describe('Accessibility', () => {
    it('should render component successfully', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement;

      expect(compiled).toBeTruthy();
      expect(component).toBeTruthy();
    });




  });
});
