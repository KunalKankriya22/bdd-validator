/**
 * Unit Tests for Add/Edit Attribute Equipment Panel Component
 * JIRA: MLT-12856
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import moment from 'moment';
import { AddEditAttributeEquipmentPanelComponent } from './add-edit-attribute-equipment-panel';
import { MatrixPheresisService } from '../../services/matrix-pheresis.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { HeaderService } from '@shared/services/header.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditAttributeEquipmentPanelComponent', () => {
  let component: AddEditAttributeEquipmentPanelComponent;
  let fixture: ComponentFixture<AddEditAttributeEquipmentPanelComponent>;
  let mockService: jasmine.SpyObj<MatrixPheresisService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  const mockAttributeCodes = [
    { attributeCode: 'ATTR001', description: 'Attribute 1' }
  ];

  const mockEquipmentTypes = [
    { equipmentType: 'EQUIP001', description: 'Equipment 1' }
  ];

  const mockParameterCodes = [
    { parameterCode: 'PARAM001', description: 'Parameter 1' }
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('MatrixPheresisService', [
      'createAttributeEquipment',
      'updateAttributeEquipment',
      'getAttributeCodes'
    ]);

    mockHeaderService = createMockHeaderService();
      TestBed.configureTestingModule({
      imports: [
        AddEditAttributeEquipmentPanelComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatSnackBarModule,
        NgxMatSelectSearchModule
      ],
      providers: [
        { provide: MatrixPheresisService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });


    


      mockService.createAttributeEquipment.calls.reset();


      mockService.updateAttributeEquipment.calls.reset();


      mockService.getAttributeCodes.calls.reset();


    fixture = TestBed.createComponent(AddEditAttributeEquipmentPanelComponent);
    component = fixture.componentInstance;
    component.equipmentTypes = mockEquipmentTypes;
    component.parameterCodes = mockParameterCodes;
    component.selectedAttributeGroup = 'PHERESIS';


    });


  describe('ADD Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockService.getAttributeCodes.and.returnValue(of(mockAttributeCodes));
      fixture.detectChanges();
    });

    it('should initialize form with all fields enabled', () => {
      expect(component.form.get('attributeCode')?.disabled).toBeFalsy();
      expect(component.form.get('equipmentType')?.disabled).toBeFalsy();
      expect(component.form.get('parameterCode')?.disabled).toBeFalsy();
      expect(component.form.get('effDate')?.disabled).toBeFalsy();
    });

    it('should load attribute codes when component initializes with attribute group', () => {
      expect(mockService.getAttributeCodes).toHaveBeenCalledWith('PHERESIS');
    });


  });

  describe('EDIT Mode', () => {
    const mockData = {
      attribGroup: 'PHERESIS',
      attribCode: 'ATTR001',
      attribCodeDesc: 'Attribute 1',
      equipType: 'EQUIP001',
      equipDesc: 'Equipment 1',
      parmCode: 'PARAM001',
      parmDesc: 'Parameter 1',
      effDate: '2024-06-01',
      termDate: '2024-12-31'
    };

    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockData;
      mockService.getAttributeCodes.and.returnValue(of(mockAttributeCodes));
      fixture.detectChanges();
    });

    it('should populate form values in edit mode', () => {
      expect(component.form.get('attributeCode')?.value).toBe('ATTR001');
      expect(component.form.get('equipmentType')?.value).toBe('EQUIP001');
      expect(component.form.get('parameterCode')?.value).toBe('PARAM001');
    });
  });
  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      mockService.getAttributeCodes.and.returnValue(of(mockAttributeCodes));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('[aria-label="Close panel"]')).toBeTruthy();
    });
  });
});
