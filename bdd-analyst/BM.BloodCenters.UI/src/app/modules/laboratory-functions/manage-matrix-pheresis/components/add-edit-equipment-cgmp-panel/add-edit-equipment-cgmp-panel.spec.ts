/**
 * Unit Tests for Add/Edit Equipment cGMP Panel Component
 * JIRA: MLT-12865
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { SimpleChange } from '@angular/core';
import moment from 'moment';
import { AddEditEquipmentCgmpPanelComponent } from './add-edit-equipment-cgmp-panel';
import { MatrixPheresisService } from '../../services/matrix-pheresis.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HeaderService } from '@shared/services/header.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditEquipmentCgmpPanelComponent', () => {
  let component: AddEditEquipmentCgmpPanelComponent;
  let fixture: ComponentFixture<AddEditEquipmentCgmpPanelComponent>;
  let mockService: jasmine.SpyObj<MatrixPheresisService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

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

  const mockEditData = {
    equipType: 'EQ01',
    proc: 'PH',
    productCode: 'PLT',
    parmCode: 'PM01',
    acceptMin: 1.5,
    acceptMax: 5.0,
    effDate: '2025-01-01',
    termDate: '2025-12-31',
    lastModifyDate: '2025-06-15T10:30:00Z'
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('MatrixPheresisService', [
      'createEquipmentCgmpMatrix',
      'updateEquipmentCgmpMatrix'
    ]);
    mockSnackBar = createMockMatSnackBar();
    mockHeaderService = createMockHeaderService();
      TestBed.configureTestingModule({
      imports: [
        AddEditEquipmentCgmpPanelComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatSnackBarModule,
        NgxMatSelectSearchModule
      ],
      providers: [
        { provide: MatrixPheresisService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });


    


      mockService.createEquipmentCgmpMatrix.calls.reset();


      mockService.updateEquipmentCgmpMatrix.calls.reset();


    fixture = TestBed.createComponent(AddEditEquipmentCgmpPanelComponent);
    component = fixture.componentInstance;
    component.equipmentTypes = mockEquipmentTypes;
    component.procedures = mockProcedures;
    component.productTypes = mockProductTypes;
    component.parameterCodes = mockParameterCodes;


    });


  describe('ADD Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should initialize form with all fields enabled', () => {
      expect(component.form.get('equipType')?.disabled).toBeFalse();
      expect(component.form.get('proc')?.disabled).toBeFalse();
      expect(component.form.get('productCode')?.disabled).toBeFalse();
      expect(component.form.get('parmCode')?.disabled).toBeFalse();
      expect(component.form.get('effDate')?.disabled).toBeFalse();
      expect(component.form.get('termDate')?.disabled).toBeFalse();
      expect(component.form.get('acceptMin')?.disabled).toBeFalse();
      expect(component.form.get('acceptMax')?.disabled).toBeFalse();
    });



    it('should not require acceptMin and acceptMax', () => {
      component.form.markAllAsTouched();

      expect(component.form.get('acceptMin')?.hasError('required')).toBeFalsy();
      expect(component.form.get('acceptMax')?.hasError('required')).toBeFalsy();
    });

    it('should not require termDate', () => {
      component.form.markAllAsTouched();

      expect(component.form.get('termDate')?.hasError('required')).toBeFalsy();
    });







    it('should set isSaving to false on create error', () => {
      mockService.createEquipmentCgmpMatrix.and.returnValue(throwError(() => new Error('Server error')));

      const futureDate = moment().add(1, 'year').startOf('day');
      component.form.patchValue({
        equipType: 'EQ01',
        proc: 'PH',
        productCode: 'PLT',
        parmCode: 'PM01',
        effDate: futureDate
      });
      component.form.updateValueAndValidity();

      component.onSubmit();

      expect(component.isSaving()).toBeFalse();
    });
  });

  describe('EDIT Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData as any;
      fixture.detectChanges();
    });

    it('should populate form values in edit mode', () => {
      expect(component.form.get('equipType')?.value).toBe('EQ01');
      expect(component.form.get('proc')?.value).toBe('PH');
      expect(component.form.get('productCode')?.value).toBe('PLT');
      expect(component.form.get('parmCode')?.value).toBe('PM01');
      expect(component.form.get('acceptMin')?.value).toBe(1.5);
      expect(component.form.get('acceptMax')?.value).toBe(5.0);
    });

    it('should disable composite PK fields and effDate in edit mode', () => {
      expect(component.form.get('equipType')?.disabled).toBeTrue();
      expect(component.form.get('proc')?.disabled).toBeTrue();
      expect(component.form.get('productCode')?.disabled).toBeTrue();
      expect(component.form.get('parmCode')?.disabled).toBeTrue();
      expect(component.form.get('effDate')?.disabled).toBeTrue();
    });

    it('should keep acceptMin, acceptMax, and termDate enabled in edit mode', () => {
      expect(component.form.get('acceptMin')?.disabled).toBeFalse();
      expect(component.form.get('acceptMax')?.disabled).toBeFalse();
      expect(component.form.get('termDate')?.disabled).toBeFalse();
    });

    it('should set last modified date in edit mode', () => {
      expect(component.lastModifiedDate()).toBeTruthy();
    });

    it('should set selected descriptions from dropdown data', () => {
      expect(component.selectedEquipTypeDescription()).toBe('Equipment One');
      expect(component.selectedProcDescription()).toBe('Pheresis');
      expect(component.selectedProductCodeDescription()).toBe('Platelets');
      expect(component.selectedParmCodeDescription()).toBe('Parameter One');
    });

    it('should call update service when updateRecord is invoked', () => {
      mockService.updateEquipmentCgmpMatrix.and.returnValue(of({
        success: true,
        statusCode: 200
      }));

      spyOn(component.saveSuccess, 'emit');

      (component as any).updateRecord();

      expect(mockService.updateEquipmentCgmpMatrix).toHaveBeenCalledWith(
        'EQ01', 'PH', 'PLT', 'PM01',
        jasmine.any(Object)
      );
    });



    it('should set isSaving to false on update error', () => {
      mockService.updateEquipmentCgmpMatrix.and.returnValue(throwError(() => new Error('Server error')));

      component.form.get('acceptMax')?.setValue(10);
      component.form.get('acceptMax')?.markAsDirty();
      component.form.updateValueAndValidity();

      component.onSubmit();

      expect(component.isSaving()).toBeFalse();
    });
  });

  describe('Min/Max Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should show error when min > max', () => {
      component.form.patchValue({ acceptMin: 10, acceptMax: 5 });
      component.form.updateValueAndValidity();

      expect(component.form.hasError('minMaxInvalid')).toBeTrue();
      expect(component.getMinMaxError()).toBe('Minimum value cannot be greater than maximum value');
    });

    it('should not show error when min <= max', () => {
      component.form.patchValue({ acceptMin: 3, acceptMax: 5 });
      component.form.updateValueAndValidity();

      expect(component.form.hasError('minMaxInvalid')).toBeFalse();
      expect(component.getMinMaxError()).toBe('');
    });

    it('should not show error when min or max is empty', () => {
      component.form.patchValue({ acceptMin: 10, acceptMax: null });
      component.form.updateValueAndValidity();

      expect(component.form.hasError('minMaxInvalid')).toBeFalse();
    });

    it('should mark fields touched on blur', () => {
      component.onMinMaxBlur();

      expect(component.form.get('acceptMin')?.touched).toBeTrue();
      expect(component.form.get('acceptMax')?.touched).toBeTrue();
    });
  });

  describe('Description Updates', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should update equipment type description on selection', () => {
      component.form.get('equipType')?.setValue('EQ01');
      component.updateEquipTypeDescription();

      expect(component.selectedEquipTypeDescription()).toBe('Equipment One');
    });

    it('should update procedure description on selection', () => {
      component.form.get('proc')?.setValue('PH');
      component.updateProcDescription();

      expect(component.selectedProcDescription()).toBe('Pheresis');
    });

    it('should update product code description on selection', () => {
      component.form.get('productCode')?.setValue('PLT');
      component.updateProductCodeDescription();

      expect(component.selectedProductCodeDescription()).toBe('Platelets');
    });

    it('should update parameter code description on selection', () => {
      component.form.get('parmCode')?.setValue('PM01');
      component.updateParmCodeDescription();

      expect(component.selectedParmCodeDescription()).toBe('Parameter One');
    });


  });

  describe('Date Handling', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should mark effective date as touched and dirty on change', () => {
      component.onEffectiveDateChange();

      expect(component.form.get('effDate')?.touched).toBeTrue();
      expect(component.form.get('effDate')?.dirty).toBeTrue();
    });

    it('should mark termination date as touched and dirty on change', () => {
      component.onTerminationDateChange();

      expect(component.form.get('termDate')?.touched).toBeTrue();
      expect(component.form.get('termDate')?.dirty).toBeTrue();
    });
  });
  describe('Format Date For Display', () => {
    it('should format moment objects', () => {
      const m = moment('2025-06-15');
      expect(component.formatDateForDisplay(m)).toBe('15-Jun-2025');
    });

    it('should return - for null', () => {
      expect(component.formatDateForDisplay(null)).toBe('-');
    });

    it('should return - for undefined', () => {
      expect(component.formatDateForDisplay(undefined)).toBe('-');
    });

    it('should format string dates', () => {
      const result = component.formatDateForDisplay('2025-03-15');
      expect(result).toContain('15-MAR-2025');
    });
  });

  describe('Mode Changes via ngOnChanges', () => {
    it('should switch from add to edit mode', () => {
      component.mode = 'add';
      component.ngOnInit();

      component.mode = 'edit';
      component.data = mockEditData as any;
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, mockEditData, false)
      });

      expect(component.form.get('equipType')?.value).toBe('EQ01');
      expect(component.form.get('equipType')?.disabled).toBeTrue();
    });

    it('should reset form values when switching from edit to add mode', () => {
      component.mode = 'edit';
      component.data = mockEditData as any;
      component.ngOnInit();

      component.mode = 'add';
      component.data = null;
      component.ngOnChanges({
        mode: new SimpleChange('edit', 'add', false)
      });

      expect(component.form.get('equipType')?.value).toBeNull();
      expect(component.selectedEquipTypeDescription()).toBe('');
      expect(component.selectedProcDescription()).toBe('');
    });

    it('should update filtered lists when input arrays change', () => {
      component.mode = 'add';
      component.ngOnInit();

      const newEquipTypes = [{ code: 'EQ03', codeDesc: 'Equipment Three' }];
      component.equipmentTypes = newEquipTypes;
      component.ngOnChanges({
        equipmentTypes: new SimpleChange(mockEquipmentTypes, newEquipTypes, false)
      });

      expect(component.filteredEquipmentTypes()).toEqual(newEquipTypes);
    });
  });

});
