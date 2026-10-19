/**
 * Unit tests for ManageMatrixPheresisComponent
 * JIRA: MLT-12847
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ManageMatrixPheresisComponent } from './manage-matrix-pheresis';
import { MatrixPheresisService } from '../services/matrix-pheresis.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PageHeaderService } from '@shared/services/page-header.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { createMockMatSnackBar, createMockMatDialog } from '@shared/testing/common-mocks';

describe('ManageMatrixPheresisComponent', () => {
  let component: ManageMatrixPheresisComponent;
  let fixture: ComponentFixture<ManageMatrixPheresisComponent>;
  let mockService: jasmine.SpyObj<MatrixPheresisService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockActivatedRoute: any;

  beforeEach(() => {

    mockService = jasmine.createSpyObj('MatrixPheresisService', [
      'getMatrixRecords',
      'getProcedures',
      'getProductTypes',
      'deleteMatrix',
      'getAttributeGroups',
      'getEquipmentTypes',
      'getParameterCodes',
      'getAttributeEquipmentRecords',
      'getAttributeCodes',
      'getEquipmentTypesCgmp',
      'getProceduresCgmp',
      'getProductTypesCgmp',
      'getParameterCodesCgmp',
      'getEquipmentCgmpMatrixRecords'
    ]);

    // Setup default return values for child component service calls
    mockService.getAttributeGroups.and.returnValue(of([]));
    mockService.getEquipmentTypes.and.returnValue(of([]));
    mockService.getParameterCodes.and.returnValue(of([]));
    mockService.getEquipmentTypesCgmp.and.returnValue(of([]));
    mockService.getProceduresCgmp.and.returnValue(of([]));
    mockService.getProductTypesCgmp.and.returnValue(of([]));
    mockService.getParameterCodesCgmp.and.returnValue(of([]));
    mockService.getEquipmentCgmpMatrixRecords.and.returnValue(of({ data: [], totalCount: 0 }));

    mockSnackBar = createMockMatSnackBar();
    mockDialog = createMockMatDialog();
    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({
        title: 'Manage Matrix - Pheresis',
        subtitle: 'Configure pheresis product-procedure mappings'
      })
    });
    mockActivatedRoute = {
      snapshot: { params: {} }
    };



      TestBed.configureTestingModule({
      imports: [ManageMatrixPheresisComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: MatrixPheresisService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MatDialog, useValue: mockDialog },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    });


    


      mockService.getMatrixRecords.calls.reset();


      mockService.getProcedures.calls.reset();


      mockService.getProductTypes.calls.reset();


      mockService.deleteMatrix.calls.reset();


      mockService.getAttributeGroups.calls.reset();


      mockService.getEquipmentTypes.calls.reset();


      mockService.getParameterCodes.calls.reset();


      mockService.getAttributeEquipmentRecords.calls.reset();


      mockService.getAttributeCodes.calls.reset();


      mockService.getEquipmentTypesCgmp.calls.reset();


      mockService.getProceduresCgmp.calls.reset();


      mockService.getProductTypesCgmp.calls.reset();


      mockService.getParameterCodesCgmp.calls.reset();


      mockService.getEquipmentCgmpMatrixRecords.calls.reset();


      mockService.getAttributeGroups.and.returnValue(of([]));


      mockService.getEquipmentTypes.and.returnValue(of([]));


      mockService.getParameterCodes.and.returnValue(of([]));


      mockService.getEquipmentTypesCgmp.and.returnValue(of([]));


      mockService.getProceduresCgmp.and.returnValue(of([]));


      mockService.getProductTypesCgmp.and.returnValue(of([]));


      mockService.getParameterCodesCgmp.and.returnValue(of([]));


      mockService.getEquipmentCgmpMatrixRecords.and.returnValue(of({ data: [], totalCount: 0 }));


    fixture = TestBed.createComponent(ManageMatrixPheresisComponent);
    component = fixture.componentInstance;


    });




  it('should update product description on selection', () => {
    const mockProductTypes = [{ productCode: 'PLT', productDesc: 'Platelets' }];
    component.productTypes.set(mockProductTypes);
    component.filterForm = component['fb'].group({ productType: ['PLT'] });

    component.onProductTypeChange();

    expect(component.selectedProductTypeDescription()).toBe('Platelets');
  });

  it('should update procedure description on selection', () => {
    const mockProcedures = [{ code: 'PH', codeDesc: 'Pheresis' }];
    component.procedures.set(mockProcedures);
    component.filterForm = component['fb'].group({ proc: ['PH'] });

    component.onProcedureChange();

    expect(component.selectedProcedureDescription()).toBe('Pheresis');
  });

  it('should clear filters and descriptions on clear all', () => {
    component.filterForm = component['fb'].group({
      productType: ['PLT'],
      proc: ['PH']
    });
    component.selectedProductTypeDescription.set('Platelets');
    component.selectedProcedureDescription.set('Pheresis');

    mockService.getMatrixRecords.and.returnValue(of({ data: [], totalCount: 0 }));

    component.onClearAll();

    expect(component.filterForm.get('productType')?.value).toBeNull();
    expect(component.filterForm.get('proc')?.value).toBeNull();
    expect(component.selectedProductTypeDescription()).toBe('');
    expect(component.selectedProcedureDescription()).toBe('');
  });





  it('should open edit panel with record', () => {
    const mockRecord = {
      proc: 'PH',
      procDesc: 'Pheresis',
      productType: 'PLT',
      productDesc: 'Platelets',
      numberProducts: '2',
      effDate: '2025-01-01',
      termDate: undefined
    };

    component.onEdit(mockRecord);

    expect(component.showPanel()).toBe(true);
    expect(component.panelMode()).toBe('edit');
    expect(component.selectedRecord()).toEqual(mockRecord);
  });
});
