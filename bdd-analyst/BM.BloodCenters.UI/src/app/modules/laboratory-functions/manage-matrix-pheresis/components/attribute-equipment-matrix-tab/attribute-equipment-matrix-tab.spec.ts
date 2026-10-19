/**
 * Unit Tests for Attribute Equipment Matrix Tab Component
 * JIRA: MLT-12856
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { AttributeEquipmentMatrixTabComponent } from './attribute-equipment-matrix-tab';
import { MatrixPheresisService } from '../../services/matrix-pheresis.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { createMockTranslateService } from '@shared/testing/common-mocks';

describe('AttributeEquipmentMatrixTabComponent', () => {
  let component: AttributeEquipmentMatrixTabComponent;
  let fixture: ComponentFixture<AttributeEquipmentMatrixTabComponent>;
  let mockService: jasmine.SpyObj<MatrixPheresisService>;

  const mockAttributeGroups = [
    { attributeGroup: 'PHERESIS', description: 'Pheresis Procedures' }
  ];

  const mockEquipmentTypes = [
    { equipmentType: 'EQUIP001', description: 'Equipment 1' }
  ];

  const mockParameterCodes = [
    { parameterCode: 'PARAM001', description: 'Parameter 1' }
  ];

  const mockRecords = [
    {
      attribGroup: 'PHERESIS',
      attribGroupDesc: 'Pheresis Procedures',
      attribCode: 'ATTR001',
      attribCodeDesc: 'Attribute 1',
      equipType: 'EQUIP001',
      equipDesc: 'Equipment 1',
      parmCode: 'PARAM001',
      parmDesc: 'Parameter 1',
      effDate: '2024-06-01'
    }
  ];

  const mockResponse = {
    data: mockRecords,
    totalCount: 1
  };

  beforeEach(() => {

    const mockTranslateService = createMockTranslateService();
    mockService = jasmine.createSpyObj('MatrixPheresisService', [
      'getAttributeGroups',
      'getEquipmentTypes',
      'getParameterCodes',
      'getAttributeEquipmentRecords',
      'getAttributeCodes'
    ]);

    mockService.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
    mockService.getEquipmentTypes.and.returnValue(of(mockEquipmentTypes));
    mockService.getParameterCodes.and.returnValue(of(mockParameterCodes));



      TestBed.configureTestingModule({
      imports: [
        AttributeEquipmentMatrixTabComponent,
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


    


      mockService.getAttributeGroups.calls.reset();


      mockService.getEquipmentTypes.calls.reset();


      mockService.getParameterCodes.calls.reset();


      mockService.getAttributeEquipmentRecords.calls.reset();


      mockService.getAttributeCodes.calls.reset();


      mockService.getAttributeGroups.and.returnValue(of(mockAttributeGroups));


      mockService.getEquipmentTypes.and.returnValue(of(mockEquipmentTypes));


      mockService.getParameterCodes.and.returnValue(of(mockParameterCodes));


    fixture = TestBed.createComponent(AttributeEquipmentMatrixTabComponent);
    component = fixture.componentInstance;


    });




  it('should load records when retrieve is clicked with attribute group selected', () => {
    mockService.getAttributeEquipmentRecords.and.returnValue(of(mockResponse));
    fixture.detectChanges();

    component.filterForm.patchValue({ attributeGroup: 'PHERESIS' });
    component.onRetrieve();

    expect(mockService.getAttributeEquipmentRecords).toHaveBeenCalledWith(
      jasmine.any(Number),
      jasmine.any(Number),
      'PHERESIS',
      jasmine.anything(),
      jasmine.anything()
    );
  });

  it('should show error when retrieve is clicked without attribute group', () => {
    fixture.detectChanges();
    spyOn<any>(component, 'handleError');

    component.onRetrieve();

    expect(component['handleError']).toHaveBeenCalledWith('Please select an attribute group');
  });



  it('should open add panel when add new is clicked', () => {
    fixture.detectChanges();

    // Set attribute group (required for adding new records)
    component.filterForm.patchValue({ attributeGroup: 'PHERESIS' });

    component.onAddNew();

    expect(component.showPanel()).toBeTrue();
    expect(component.panelMode()).toBe('add');
  });

  it('should open edit panel when edit is clicked', () => {
    fixture.detectChanges();

    component.onEdit(mockResponse.data[0]);

    expect(component.showPanel()).toBeTrue();
    expect(component.panelMode()).toBe('edit');
    expect(component.selectedRecord()).toEqual(mockResponse.data[0]);
  });



  it('should handle empty date formatting', () => {
    const formatted = component.formatDate('');
    expect(formatted).toBe('-');
  });

  describe('Accessibility', () => {
    it('should render component successfully', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement;

      // Check that component renders
      expect(compiled).toBeTruthy();
      expect(component).toBeTruthy();
    });
  });
});
