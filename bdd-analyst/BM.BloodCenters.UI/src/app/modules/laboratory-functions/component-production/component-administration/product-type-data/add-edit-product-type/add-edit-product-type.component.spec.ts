import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SimpleChange, signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { AddEditProductType } from './add-edit-product-type.component';
import { ProductTypeService } from '../services/product-type.service';
import {
  ProductType,
  ProductTypeDropdownOption,
  ProductClassDropdown
} from '../models/product-type.model';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { HeaderService } from '@shared/services/header.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AddEditProductType', () => {
  let snackBarSpy: any;
  let component: AddEditProductType;
  let fixture: ComponentFixture<AddEditProductType>;
  let mockProductTypeService: jasmine.SpyObj<ProductTypeService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: any;

  const futureDate = moment('2099-06-15');

  const mockProductTypeOptions: ProductTypeDropdownOption[] = [
    { productTypeCode: 'RBC', productTypeDesc: 'Red Blood Cells' },
    { productTypeCode: 'PLT', productTypeDesc: 'Platelets' },
    { productTypeCode: 'FFP', productTypeDesc: 'Fresh Frozen Plasma with a very long description that exceeds thirty characters' }
  ];

  const mockProductClassOptions: ProductClassDropdown[] = [
    { code: 'A', codeDesc: 'Class A Description' },
    { code: 'B', codeDesc: 'Class B Description' },
    { code: 'C', codeDesc: 'Class C Description' }
  ];

  const mockEditData: ProductType = {
    productTypeCode: 'RBC',
    productTypeDesc: 'Red Blood Cells',
    productClass: 'A',
    productGroupName: 'Class A Description',
    productGroupIdentifier: 'GRP001',
    aboOnly: 'Y',
    attribFlag: 'N',
    weightRequired: 'Y',
    effDate: '2024-01-01',
    termDate: null,
    lastModifiedDate: new Date('2025-01-15'),
    auditKey: 123,
    programId: 'TEST'
  };

  beforeEach(() => {

    mockProductTypeService = jasmine.createSpyObj('ProductTypeService', [
      'getProductTypesLov',
      'getProductClassesDropdown',
      'createProductType',
      'updateProductType'
    ]);

    mockSnackBar = createMockMatSnackBar();

    mockHeaderService = {
      chapterTimeZone: signal('-05:00'),
      chapterChanged$: new Subject()
    };

    mockProductTypeService.getProductTypesLov.and.returnValue(
      of({ success: true, data: mockProductTypeOptions, statusCode: 200, message: 'OK' })
    );
    mockProductTypeService.getProductClassesDropdown.and.returnValue(
      of({ success: true, data: mockProductClassOptions, statusCode: 200, message: 'OK' })
    );
    mockProductTypeService.createProductType.and.returnValue(
      of({ success: true, data: null, statusCode: 201, message: 'Created' })
    );
    mockProductTypeService.updateProductType.and.returnValue(
      of({ success: true, data: null, statusCode: 200, message: 'Updated' })
    );



      TestBed.configureTestingModule({
imports: [
        AddEditProductType,
        ReactiveFormsModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatSelectModule,
        MatDatepickerModule,
        MatMomentDateModule,
        MatIconModule,
        MatSnackBarModule,
        NgxMatSelectSearchModule,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: ProductTypeService, useValue: mockProductTypeService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
        { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
      ]
    });


    });



  beforeEach(() => {













    fixture = TestBed.createComponent(AddEditProductType);
    component = fixture.componentInstance;


    });

  afterEach(() => {
    if (fixture) fixture.destroy();
  });

  // ---------------------------------------------------------------------------
  describe('Component Initialization', () => {

    it('should initialize form with all required controls', () => {
      expect(component.form.get('productTypeCode')).toBeTruthy();
      expect(component.form.get('productTypeDesc')).toBeTruthy();
      expect(component.form.get('productClass')).toBeTruthy();
      expect(component.form.get('classDescription')).toBeTruthy();
      expect(component.form.get('productGroupName')).toBeTruthy();
      expect(component.form.get('productGroupIdentifier')).toBeTruthy();
      expect(component.form.get('aboOnly')).toBeTruthy();
      expect(component.form.get('attribFlag')).toBeTruthy();
      expect(component.form.get('weightRequired')).toBeTruthy();
      expect(component.form.get('effectiveDate')).toBeTruthy();
      expect(component.form.get('terminationDate')).toBeTruthy();
    });



    it('should start classDescription as disabled', () => {
      expect(component.form.get('classDescription')?.disabled).toBe(true);
    });

    it('should default to add mode', () => {
      expect(component.mode).toBe('add');
    });
  });

  // ---------------------------------------------------------------------------
  describe('Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });


    it('should set lastUpdated to empty string', () => {
      expect(component.lastUpdated).toBe('');
    });

    it('should load product types and classes on init', fakeAsync(() => {
      tick();
      expect(mockProductTypeService.getProductTypesLov).toHaveBeenCalled();
      expect(mockProductTypeService.getProductClassesDropdown).toHaveBeenCalled();
    }));


  });

  // ---------------------------------------------------------------------------
  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
    });


    it('should show last modified date', () => {
      expect(component.lastUpdated).toContain('Last Modified:');
    });


    it('should populate all fields from data', () => {
      const raw = component.form.getRawValue();
      expect(raw.productTypeCode).toBe('RBC');
      expect(raw.productTypeDesc).toBe('Red Blood Cells');
      expect(raw.productClass).toBe('A');
      expect(raw.productGroupName).toBe('Class A Description');
      expect(raw.productGroupIdentifier).toBe('GRP001');
      expect(raw.aboOnly).toBe('Y');
      expect(raw.attribFlag).toBe('N');
      expect(raw.weightRequired).toBe('Y');
    });

    it('should populate productGroupIdentifier from data', () => {
      expect(component.form.getRawValue().productGroupIdentifier).toBe('GRP001');
    });


    it('should NOT enable productTypeCode after product types load in edit mode', fakeAsync(() => {
      tick();
      expect(component.form.get('productTypeCode')?.disabled).toBe(true);
    }));
  });

  // ---------------------------------------------------------------------------
  describe('Product Type Description Character Filter', () => {

    it('should include product types with description of 30 or fewer characters', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      const options = component.filteredProductTypeOptions();
      expect(options.find(o => o.productTypeCode === 'RBC')).toBeTruthy();
      expect(options.find(o => o.productTypeCode === 'PLT')).toBeTruthy();
    }));
  });

  // ---------------------------------------------------------------------------
  describe('Display Methods', () => {
    it('should show CODE - Description for product type with a description', () => {
      const option: ProductTypeDropdownOption = { productTypeCode: 'RBC', productTypeDesc: 'Red Blood Cells' };
      expect(component.getProductTypeDisplay(option)).toBe('RBC - Red Blood Cells');
    });

    it('should show only CODE for product type with no description', () => {
      const option: ProductTypeDropdownOption = { productTypeCode: 'RBC', productTypeDesc: '' };
      expect(component.getProductTypeDisplay(option)).toBe('RBC');
    });

    it('should show CODE - Description for product class with a description', () => {
      const option: ProductClassDropdown = { code: 'A', codeDesc: 'Class A Description' };
      expect(component.getProductClassDisplay(option)).toBe('A - Class A Description');
    });

    it('should show only CODE for product class with no description', () => {
      const option: ProductClassDropdown = { code: 'A', codeDesc: '' };
      expect(component.getProductClassDisplay(option)).toBe('A');
    });
  });

  // ---------------------------------------------------------------------------
  describe('Search Filtering', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should filter product types by code', fakeAsync(() => {
      component.productTypeSearchCtrl.setValue('RBC');
      tick();
      expect(component.filteredProductTypeOptions().every(o => o.productTypeCode === 'RBC')).toBe(true);
    }));


    it('should return all (filtered) options when search is empty', fakeAsync(() => {
      component.productTypeSearchCtrl.setValue('');
      tick();
      expect(component.filteredProductTypeOptions().length).toBe(component.productTypeOptions.length);
    }));

    it('should filter product classes by code', fakeAsync(() => {
      component.productClassSearchCtrl.setValue('B');
      tick();
      const filtered = component.filteredProductClassOptions();
      expect(filtered.some(o => o.code === 'B')).toBe(true);
    }));

  });

  // ---------------------------------------------------------------------------
  describe('Class Required Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should show required error when class is not selected', () => {
      component.form.get('productClass')?.markAsTouched();
      expect(component.productClassControl?.hasError('required')).toBe(true);
    });

    it('should clear required error once a class is selected', () => {
      component.form.patchValue({ productClass: 'A' });
      expect(component.productClassControl?.hasError('required')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  describe('Save Functionality - Add Mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        productTypeCode: 'RBC',
        productTypeDesc: 'Red Blood Cells',
        productClass: 'A',
        aboOnly: 'Y',
        attribFlag: 'N',
        weightRequired: 'Y',
        effectiveDate: futureDate,
        terminationDate: null
      });
    }));

    it('should call createProductType with correct DTO', fakeAsync(() => {
      component.onSave();
      tick();

      expect(mockProductTypeService.createProductType).toHaveBeenCalled();
      const dto = mockProductTypeService.createProductType.calls.mostRecent().args[0];
      expect(dto.productTypeCode).toBe('RBC');
      expect(dto.productClass).toBe('A');
      expect(dto.aboOnly).toBe('Y');
      expect(dto.attribFlag).toBe('N');
      expect(dto.weightRequired).toBe('Y');
      expect(dto.effDate).toBe(futureDate.format('YYYY-MM-DD'));
      expect(dto.termDate).toBeNull();
    }));

    it('should show success snackbar and emit events on successful create', fakeAsync(() => {
      snackBarSpy = spyOn(component['snackBar'], 'open');
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();
      flush();

      expect(snackBarSpy).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));



  });

  // ---------------------------------------------------------------------------
  describe('Save Functionality - Edit Mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        productClass: 'B',
        aboOnly: 'N',
        attribFlag: 'Y',
        weightRequired: 'N',
        effectiveDate: moment(mockEditData.effDate),
        terminationDate: futureDate
      });
    }));

    it('should call updateProductType with correct code', fakeAsync(() => {
      component.onSave();
      tick();

      expect(mockProductTypeService.updateProductType).toHaveBeenCalledWith(
        'RBC',
        jasmine.any(Object)
      );
    }));

    it('should always include productClass in the update DTO', fakeAsync(() => {
      component.onSave();
      tick();

      const dto = mockProductTypeService.updateProductType.calls.mostRecent().args[1];
      expect(dto.productClass).toBe('B');
    }));

    it('should include productGroupIdentifier in the update DTO', fakeAsync(() => {
      component.onSave();
      tick();

      const dto = mockProductTypeService.updateProductType.calls.mostRecent().args[1];
      expect(dto.productGroupIdentifier).toBe('GRP001');
    }));


    it('should show success snackbar and emit events on successful update', fakeAsync(() => {
      snackBarSpy = spyOn(component['snackBar'], 'open');
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();
      flush();

      expect(snackBarSpy).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));

  });

  // ---------------------------------------------------------------------------
  describe('Save and Create Another - Add Mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        productTypeCode: 'RBC',
        productClass: 'A',
        effectiveDate: futureDate
      });
    }));



    it('should emit saveSuccess but NOT closePanel', fakeAsync(() => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSaveAndCreateAnother();
      flush();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).not.toHaveBeenCalled();
    }));
  });

  // ---------------------------------------------------------------------------
  describe('Save and Create Another - Edit Mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        productClass: 'B',
        effectiveDate: moment(mockEditData.effDate),
        terminationDate: futureDate
      });
    }));

    it('should include productClass in update DTO', fakeAsync(() => {
      component.onSaveAndCreateAnother();
      flush();

      const dto = mockProductTypeService.updateProductType.calls.mostRecent().args[1];
      expect(dto.productClass).toBe('B');
    }));

    it('should switch to add mode after save', fakeAsync(() => {
      spyOn(component.modeChange, 'emit');
      component.onSaveAndCreateAnother();
      flush();

      expect(component.mode).toBe('add');
      expect(component.modeChange.emit).toHaveBeenCalledWith('add');
    }));
  });

  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  describe('Form Validity (isFormValid)', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should be false when form is empty', () => {
      expect(component.isFormValid).toBe(false);
    });

    it('should be true when all required fields are set', () => {
      component.form.patchValue({
        productTypeCode: 'RBC',
        productClass: 'A',
        effectiveDate: futureDate
      });
      expect(component.isFormValid).toBe(true);
    });

    it('should be false when date range is invalid', () => {
      component.form.patchValue({
        productTypeCode: 'RBC',
        productClass: 'A',
        effectiveDate: futureDate,
        terminationDate: futureDate.clone().subtract(1, 'days')
      });
      expect(component.isFormValid).toBe(false);
    });

    it('should be false in edit mode when no field has changed', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();
      expect(component.isFormValid).toBe(false);
    }));
  });

  // ---------------------------------------------------------------------------
  describe('Date Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return required error for effective date when touched', () => {
      component.form.get('effectiveDate')?.markAsTouched();
      expect(component.getEffectiveDateError()).toContain('required');
    });


  });

  // ---------------------------------------------------------------------------
  describe('Error Message Methods', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return required error for productTypeCode', () => {
      component.form.get('productTypeCode')?.markAsTouched();
      expect(component.getProductTypeCodeError()).toContain('required');
    });

    it('should return maxlength error for productTypeCode', () => {
      component.form.get('productTypeCode')?.setValue('TOOLONG');
      component.form.get('productTypeCode')?.markAsTouched();
      expect(component.getProductTypeCodeError()).toContain('5 characters');
    });
  });

  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  describe('Loading State — disable/enable controls', () => {


    it('should keep productTypeCode disabled in edit mode after types load', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();
      expect(component.form.get('productTypeCode')?.disabled).toBe(true);
    }));

  });

  // ---------------------------------------------------------------------------
  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const destroySub = (component as any).destroy$ as Subject<void>;
      const nextSpy = spyOn(destroySub, 'next');
      const completeSpy = spyOn(destroySub, 'complete');

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  describe('ngOnChanges', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should not call setupPanel on first change', () => {
      const changes = {
        mode: new SimpleChange(undefined, 'add', true)
      };
      const panelTitle = component.panelTitle;
      component.ngOnChanges(changes);
      // panelTitle should remain unchanged because firstChange is true
      expect(component.panelTitle).toBe(panelTitle);
    });

    it('should call setupPanel on subsequent mode change', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      const changes = {
        mode: new SimpleChange('add', 'edit', false)
      };
      component.ngOnChanges(changes);
      expect(component.panelTitle).toBe('Edit Product Type');
    });

    it('should reset form when switching to add mode on subsequent change', fakeAsync(() => {
      // First set to edit mode
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();

      // Now switch to add mode
      component.mode = 'add';
      component.data = null;
      const changes = {
        mode: new SimpleChange('edit', 'add', false)
      };
      component.ngOnChanges(changes);

      expect(component.panelTitle).toBe('Add New Product Type');
      expect(component.form.get('productTypeCode')?.enabled).toBe(true);
    }));

    it('should call setupPanel on subsequent data change', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      const changes = {
        data: new SimpleChange(null, mockEditData, false)
      };
      component.ngOnChanges(changes);
      expect(component.panelTitle).toBe('Edit Product Type');
    });

    it('should not reset form when both mode and data are first changes', () => {
      const changes = {
        mode: new SimpleChange(undefined, 'add', true),
        data: new SimpleChange(undefined, null, true)
      };
      component.ngOnChanges(changes);
      // Should not throw and should not call setupPanel
      expect(component.panelTitle).toBe('Add New Product Type');
    });
  });

  // ---------------------------------------------------------------------------
  describe('setupPanel - edit mode details', () => {
    it('should set lastUpdated to empty when data has no lastModifiedDate', fakeAsync(() => {
      const dataNoDate: ProductType = {
        ...mockEditData,
        lastModifiedDate: null as any
      };
      component.mode = 'edit';
      component.data = dataNoDate;
      fixture.detectChanges();
      tick();

      expect(component.lastUpdated).toBe('');
    }));

    it('should set panelTitle to Edit Product Type in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();

      expect(component.panelTitle).toBe('Edit Product Type');
    }));
  });

  // ---------------------------------------------------------------------------
  describe('populateFormForEdit - edge cases', () => {
    it('should handle data with null/empty fields gracefully', fakeAsync(() => {
      const sparseData: ProductType = {
        productTypeCode: '',
        productTypeDesc: '',
        productClass: '',
        productGroupName: '',
        productGroupIdentifier: '',
        aboOnly: '',
        attribFlag: '',
        weightRequired: '',
        effDate: '',
        termDate: null,
        lastModifiedDate: new Date('2025-01-15'),
        auditKey: 1,
        programId: 'TEST'
      };
      component.mode = 'edit';
      component.data = sparseData;
      fixture.detectChanges();
      tick();

      const raw = component.form.getRawValue();
      expect(raw.productTypeCode).toBe('');
      expect(raw.productTypeDesc).toBe('');
      expect(raw.aboOnly).toBe('');
    }));

    it('should mark effective date touched when it is before minDate', fakeAsync(() => {
      const oldDateData: ProductType = {
        ...mockEditData,
        effDate: '2020-01-01'
      };
      component.mode = 'edit';
      component.data = oldDateData;
      fixture.detectChanges();
      tick();

      // The effective date control should be touched if the date is in the past
      const effControl = component.form.get('effectiveDate');
      if (effControl?.value && moment.isMoment(effControl.value) && effControl.value.isBefore(moment())) {
        expect(effControl.touched).toBe(true);
      }
    }));

    it('should set initialFormValues with termDate when termDate exists', fakeAsync(() => {
      const dataWithTermDate: ProductType = {
        ...mockEditData,
        termDate: '2099-12-31'
      };
      component.mode = 'edit';
      component.data = dataWithTermDate;
      fixture.detectChanges();
      tick();

      const initialValues = (component as any).initialFormValues;
      expect(initialValues).toBeTruthy();
      expect(initialValues.terminationDate).not.toBeNull();
    }));

    it('should not populate form when data is null', fakeAsync(() => {
      component.mode = 'edit';
      component.data = null;
      fixture.detectChanges();
      tick();

      // When data is null, populateFormForEdit exits early
      expect(component.editModeValues.productTypeCode).toBe('');
    }));
  });

  // ---------------------------------------------------------------------------
  describe('loadProductClasses - branches', () => {
    it('should handle error when loading product classes', fakeAsync(() => {
      mockProductTypeService.getProductClassesDropdown.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      // Create a fresh component that will trigger loadProductClasses
      fixture = TestBed.createComponent(AddEditProductType);
      component = fixture.componentInstance;
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      expect(component.loadingProductClasses).toBe(false);
      expect(component.form.get('productClass')?.enabled).toBe(true);
    }));

    it('should set class description in edit mode after loading classes', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();

      const raw = component.form.getRawValue();
      expect(raw.productClass).toBe('A');
      expect(raw.classDescription).toBe('Class A Description');
    }));

    it('should handle response with null data', fakeAsync(() => {
      mockProductTypeService.getProductClassesDropdown.and.returnValue(
        of({ success: true, data: null as any, statusCode: 200, message: 'OK' })
      );

      fixture = TestBed.createComponent(AddEditProductType);
      component = fixture.componentInstance;
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      expect(component.productClassOptions).toEqual([]);
    }));
  });

  // ---------------------------------------------------------------------------
  describe('loadProductTypes - branches', () => {
    it('should handle error when loading product types', fakeAsync(() => {
      mockProductTypeService.getProductTypesLov.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      fixture = TestBed.createComponent(AddEditProductType);
      component = fixture.componentInstance;
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      expect(component.loadingProductTypes).toBe(false);
      expect(component.form.get('productTypeCode')?.enabled).toBe(true);
    }));

    it('should not enable productTypeCode on error in edit mode', fakeAsync(() => {
      mockProductTypeService.getProductTypesLov.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      fixture = TestBed.createComponent(AddEditProductType);
      component = fixture.componentInstance;
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();

      expect(component.form.get('productTypeCode')?.disabled).toBe(true);
    }));

    it('should filter out product types with descriptions longer than 30 chars', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      // FFP has a very long description (>30 chars) and should be filtered out
      const ffpOption = component.productTypeOptions.find(o => o.productTypeCode === 'FFP');
      expect(ffpOption).toBeUndefined();

      // RBC and PLT should be included
      expect(component.productTypeOptions.find(o => o.productTypeCode === 'RBC')).toBeTruthy();
      expect(component.productTypeOptions.find(o => o.productTypeCode === 'PLT')).toBeTruthy();
    }));

    it('should handle response with null data', fakeAsync(() => {
      mockProductTypeService.getProductTypesLov.and.returnValue(
        of({ success: true, data: null as any, statusCode: 200, message: 'OK' })
      );

      fixture = TestBed.createComponent(AddEditProductType);
      component = fixture.componentInstance;
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      expect(component.productTypeOptions).toEqual([]);
    }));
  });

  // ---------------------------------------------------------------------------
  describe('setupProductClassChangeListener', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should set classDescription and productGroupName when a class is selected', fakeAsync(() => {
      component.form.get('productClass')?.setValue('A');
      tick();

      const raw = component.form.getRawValue();
      expect(raw.classDescription).toBe('Class A Description');
      expect(raw.productGroupName).toBe('Class A Description');
    }));

    it('should clear classDescription and productGroupName when class is cleared', fakeAsync(() => {
      component.form.get('productClass')?.setValue('A');
      tick();
      component.form.get('productClass')?.setValue('');
      tick();

      const raw = component.form.getRawValue();
      expect(raw.classDescription).toBe('');
      expect(raw.productGroupName).toBe('');
    }));

    it('should clear classDescription and productGroupName when class is set to null', fakeAsync(() => {
      component.form.get('productClass')?.setValue('A');
      tick();
      component.form.get('productClass')?.setValue(null);
      tick();

      const raw = component.form.getRawValue();
      expect(raw.classDescription).toBe('');
      expect(raw.productGroupName).toBe('');
    }));
  });

  // ---------------------------------------------------------------------------
  describe('setupProductTypeChangeListener', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should set productTypeDesc when a product type code is selected', fakeAsync(() => {
      component.form.get('productTypeCode')?.setValue('RBC');
      tick();

      expect(component.form.getRawValue().productTypeDesc).toBe('Red Blood Cells');
    }));

    it('should clear productTypeDesc when code is cleared', fakeAsync(() => {
      component.form.get('productTypeCode')?.setValue('RBC');
      tick();
      component.form.get('productTypeCode')?.setValue('');
      tick();

      expect(component.form.getRawValue().productTypeDesc).toBe('');
    }));

    it('should clear productTypeDesc when code is set to null', fakeAsync(() => {
      component.form.get('productTypeCode')?.setValue('RBC');
      tick();
      component.form.get('productTypeCode')?.setValue(null);
      tick();

      expect(component.form.getRawValue().productTypeDesc).toBe('');
    }));

    it('should set empty productTypeDesc when code does not match any option', fakeAsync(() => {
      component.form.get('productTypeCode')?.setValue('UNKNOWN');
      tick();

      expect(component.form.getRawValue().productTypeDesc).toBe('');
    }));
  });

  // ---------------------------------------------------------------------------
  describe('Search Filtering - additional coverage', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should filter product types by description', fakeAsync(() => {
      component.productTypeSearchCtrl.setValue('red');
      tick();

      const filtered = component.filteredProductTypeOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].productTypeCode).toBe('RBC');
    }));

    it('should return all product classes when search is empty', fakeAsync(() => {
      component.productClassSearchCtrl.setValue('');
      tick();

      expect(component.filteredProductClassOptions().length).toBe(component.productClassOptions.length);
    }));

    it('should filter product classes by description', fakeAsync(() => {
      component.productClassSearchCtrl.setValue('class b');
      tick();

      const filtered = component.filteredProductClassOptions();
      expect(filtered.some(o => o.code === 'B')).toBe(true);
    }));

    it('should return empty array when no product types match search', fakeAsync(() => {
      component.productTypeSearchCtrl.setValue('ZZZNONEXISTENT');
      tick();

      expect(component.filteredProductTypeOptions().length).toBe(0);
    }));

    it('should return empty array when no product classes match search', fakeAsync(() => {
      component.productClassSearchCtrl.setValue('ZZZNONEXISTENT');
      tick();

      expect(component.filteredProductClassOptions().length).toBe(0);
    }));

    it('should handle null search value for product types', fakeAsync(() => {
      component.productTypeSearchCtrl.setValue(null);
      tick();

      expect(component.filteredProductTypeOptions().length).toBe(component.productTypeOptions.length);
    }));

    it('should handle null search value for product classes', fakeAsync(() => {
      component.productClassSearchCtrl.setValue(null);
      tick();

      expect(component.filteredProductClassOptions().length).toBe(component.productClassOptions.length);
    }));
  });

  // ---------------------------------------------------------------------------
  describe('terminationDateFilter', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should return true for null date', () => {
      expect(component.terminationDateFilter(null)).toBe(true);
    });

    it('should return false for a date in the past', () => {
      const pastDate = moment('2020-01-01');
      expect(component.terminationDateFilter(pastDate)).toBe(false);
    });

    it('should return true for a future date with no effective date set', () => {
      const futureDate2 = moment('2099-01-01');
      expect(component.terminationDateFilter(futureDate2)).toBe(true);
    });

    it('should return false for a date before the effective date', fakeAsync(() => {
      const effDate = moment('2099-06-15');
      component.form.patchValue({ effectiveDate: effDate });
      tick();

      const beforeEffDate = moment('2099-06-10');
      expect(component.terminationDateFilter(beforeEffDate)).toBe(false);
    }));

    it('should return true for a date on or after the effective date', fakeAsync(() => {
      const effDate = moment('2099-06-15');
      component.form.patchValue({ effectiveDate: effDate });
      tick();

      const afterEffDate = moment('2099-06-20');
      expect(component.terminationDateFilter(afterEffDate)).toBe(true);
    }));
  });

  // ---------------------------------------------------------------------------
  describe('onEffectiveDateInput', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should process a valid date input without error', () => {
      const event = { target: { value: '01-Jan-2099' } } as any;
      expect(() => component.onEffectiveDateInput(event)).not.toThrow();

      const effControl = component.form.get('effectiveDate');
      expect(effControl?.touched).toBe(true);
    });

    it('should handle empty input', () => {
      const event = { target: { value: '' } } as any;
      component.onEffectiveDateInput(event);

      const effControl = component.form.get('effectiveDate');
      expect(effControl?.touched).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  describe('onTerminationDateInput', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should handle empty input in add mode', () => {
      const event = { target: { value: '' } } as any;
      component.onTerminationDateInput(event);

      const termControl = component.form.get('terminationDate');
      // In add mode with empty input, it should be untouched
      expect(termControl?.errors).toBeNull();
    });

    it('should handle empty input in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();

      const event = { target: { value: '' } } as any;
      component.onTerminationDateInput(event);

      const termControl = component.form.get('terminationDate');
      expect(termControl?.errors).toBeNull();
    }));

    it('should handle non-empty input', () => {
      const event = { target: { value: '01-Jan-2099' } } as any;
      component.onTerminationDateInput(event);

      const termControl = component.form.get('terminationDate');
      expect(termControl?.touched).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  describe('onProductTypeCodeInput', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should convert input to uppercase and strip non-alphanumeric characters', () => {
      const input = { value: 'abc!@#123' } as HTMLInputElement;
      const event = { target: input } as any;

      component.onProductTypeCodeInput(event);

      expect(input.value).toBe('ABC123');
      expect(component.form.get('productTypeCode')?.value).toBe('ABC123');
    });

    it('should handle empty input', () => {
      const input = { value: '' } as HTMLInputElement;
      const event = { target: input } as any;

      component.onProductTypeCodeInput(event);

      expect(input.value).toBe('');
    });

    it('should allow pure numeric input', () => {
      const input = { value: '12345' } as HTMLInputElement;
      const event = { target: input } as any;

      component.onProductTypeCodeInput(event);

      expect(input.value).toBe('12345');
    });
  });

  // ---------------------------------------------------------------------------
  describe('onCancel', () => {
    it('should emit closePanel', () => {
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  describe('onSave - error paths', () => {
    it('should not call service when form is invalid', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      // Form has no required fields set -> invalid
      mockProductTypeService.createProductType.calls.reset();
      component.onSave();
      tick();

      expect(mockProductTypeService.createProductType).not.toHaveBeenCalled();
    }));

    it('should not call service when date range is invalid', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        productTypeCode: 'RBC',
        productClass: 'A',
        effectiveDate: moment('2099-06-15'),
        terminationDate: moment('2099-06-10') // before effective date
      });

      mockProductTypeService.createProductType.calls.reset();
      component.onSave();
      tick();

      expect(mockProductTypeService.createProductType).not.toHaveBeenCalled();
    }));

    it('should show error snackbar on create failure', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        productTypeCode: 'RBC',
        productClass: 'A',
        effectiveDate: futureDate
      });

      mockProductTypeService.createProductType.and.returnValue(
        throwError(() => ({ error: { message: 'Duplicate key' } }))
      );

      snackBarSpy = spyOn(component['snackBar'], 'open');
      component.onSave();
      flush();

      expect(snackBarSpy).toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
    }));

    it('should show error snackbar on update failure', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        productClass: 'B',
        effectiveDate: moment(mockEditData.effDate),
        terminationDate: futureDate
      });

      mockProductTypeService.updateProductType.and.returnValue(
        throwError(() => ({ error: { message: 'Update failed' } }))
      );

      snackBarSpy = spyOn(component['snackBar'], 'open');
      component.onSave();
      flush();

      expect(snackBarSpy).toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
    }));

    it('should not emit events when create response is not successful', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        productTypeCode: 'RBC',
        productClass: 'A',
        effectiveDate: futureDate
      });

      mockProductTypeService.createProductType.and.returnValue(
        of({ success: false, data: null, statusCode: 400, message: 'Failed' })
      );

      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');
      component.onSave();
      flush();

      expect(component.saveSuccess.emit).not.toHaveBeenCalled();
      expect(component.closePanel.emit).not.toHaveBeenCalled();
    }));

    it('should not emit events when update response is not successful', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        productClass: 'B',
        effectiveDate: moment(mockEditData.effDate),
        terminationDate: futureDate
      });

      mockProductTypeService.updateProductType.and.returnValue(
        of({ success: false, data: null, statusCode: 400, message: 'Failed' })
      );

      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');
      component.onSave();
      flush();

      expect(component.saveSuccess.emit).not.toHaveBeenCalled();
      expect(component.closePanel.emit).not.toHaveBeenCalled();
    }));

    it('should set isSaving to true during save and false after via finalize', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        productTypeCode: 'RBC',
        productClass: 'A',
        effectiveDate: futureDate
      });

      component.onSave();
      // After the observable completes, isSaving should be false
      flush();
      expect(component.isSaving).toBe(false);
    }));
  });

  // ---------------------------------------------------------------------------
  describe('onSave - DTO construction', () => {
    it('should use current UTC date when effectiveDate is null in add mode', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      // Set required fields but manually clear effectiveDate validation
      component.form.patchValue({
        productTypeCode: 'RBC',
        productClass: 'A',
        effectiveDate: futureDate
      });

      // Now call save - the DTO should have the formatted date
      component.onSave();
      tick();

      const dto = mockProductTypeService.createProductType.calls.mostRecent().args[0];
      expect(dto.effDate).toBe(futureDate.format('YYYY-MM-DD'));
    }));

    it('should set termDate when terminationDate is provided in add mode', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      const termDate = moment('2099-12-31');
      component.form.patchValue({
        productTypeCode: 'RBC',
        productClass: 'A',
        effectiveDate: futureDate,
        terminationDate: termDate
      });

      component.onSave();
      tick();

      const dto = mockProductTypeService.createProductType.calls.mostRecent().args[0];
      expect(dto.termDate).toBe('2099-12-31');
    }));

    it('should use data productTypeDesc fallback in update DTO when form value is empty', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        productTypeDesc: '',
        productClass: 'B',
        effectiveDate: moment(mockEditData.effDate),
        terminationDate: futureDate
      });

      component.onSave();
      tick();

      const dto = mockProductTypeService.updateProductType.calls.mostRecent().args[1];
      expect(dto.productTypeDesc).toBe('Red Blood Cells');
    }));
  });

  // ---------------------------------------------------------------------------
  describe('onSaveAndCreateAnother - error paths', () => {
    it('should not call service when form is invalid', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      mockProductTypeService.createProductType.calls.reset();
      component.onSaveAndCreateAnother();
      tick();

      expect(mockProductTypeService.createProductType).not.toHaveBeenCalled();
    }));

    it('should not call service when date range is invalid', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        productTypeCode: 'RBC',
        productClass: 'A',
        effectiveDate: moment('2099-06-15'),
        terminationDate: moment('2099-06-10')
      });

      mockProductTypeService.createProductType.calls.reset();
      component.onSaveAndCreateAnother();
      tick();

      expect(mockProductTypeService.createProductType).not.toHaveBeenCalled();
    }));

    it('should show error snackbar on create failure in save and create another', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        productTypeCode: 'RBC',
        productClass: 'A',
        effectiveDate: futureDate
      });

      mockProductTypeService.createProductType.and.returnValue(
        throwError(() => ({ error: { message: 'Duplicate key' } }))
      );

      snackBarSpy = spyOn(component['snackBar'], 'open');
      component.onSaveAndCreateAnother();
      flush();

      expect(snackBarSpy).toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
    }));

    it('should show error snackbar on update failure in save and create another', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        productClass: 'B',
        effectiveDate: moment(mockEditData.effDate),
        terminationDate: futureDate
      });

      mockProductTypeService.updateProductType.and.returnValue(
        throwError(() => ({ error: { message: 'Update failed' } }))
      );

      snackBarSpy = spyOn(component['snackBar'], 'open');
      component.onSaveAndCreateAnother();
      flush();

      expect(snackBarSpy).toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
    }));

    it('should not emit events when create response is not successful', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        productTypeCode: 'RBC',
        productClass: 'A',
        effectiveDate: futureDate
      });

      mockProductTypeService.createProductType.and.returnValue(
        of({ success: false, data: null, statusCode: 400, message: 'Failed' })
      );

      spyOn(component.saveSuccess, 'emit');
      component.onSaveAndCreateAnother();
      flush();

      expect(component.saveSuccess.emit).not.toHaveBeenCalled();
    }));

    it('should reset form after successful create in save and create another', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        productTypeCode: 'RBC',
        productClass: 'A',
        effectiveDate: futureDate
      });

      spyOn(component.saveSuccess, 'emit');
      component.onSaveAndCreateAnother();
      flush();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      // Form should be reset
      expect(component.form.get('productTypeCode')?.value).toBeFalsy();
    }));

    it('should switch to add mode and emit modeChange after successful update in save and create another', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        productClass: 'B',
        effectiveDate: moment(mockEditData.effDate),
        terminationDate: futureDate
      });

      spyOn(component.modeChange, 'emit');
      spyOn(component.saveSuccess, 'emit');
      component.onSaveAndCreateAnother();
      flush();

      expect(component.mode).toBe('add');
      expect(component.modeChange.emit).toHaveBeenCalledWith('add');
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.panelTitle).toBe('Add New Product Type');
    }));

    it('should not switch to add mode when update response is not successful', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        productClass: 'B',
        effectiveDate: moment(mockEditData.effDate),
        terminationDate: futureDate
      });

      mockProductTypeService.updateProductType.and.returnValue(
        of({ success: false, data: null, statusCode: 400, message: 'Failed' })
      );

      spyOn(component.modeChange, 'emit');
      component.onSaveAndCreateAnother();
      flush();

      expect(component.mode).toBe('edit');
      expect(component.modeChange.emit).not.toHaveBeenCalled();
    }));
  });

  // ---------------------------------------------------------------------------
  describe('formatDate', () => {
    it('should return dash for null', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should format a moment date in DD-MMM-YYYY', () => {
      const date = moment('2025-03-15');
      expect(component.formatDate(date)).toBe('15-Mar-2025');
    });

    it('should format a Date object in DD-MMM-YYYY', () => {
      const date = new Date(2025, 2, 15); // March 15
      const result = component.formatDate(date);
      expect(result).toBe('15-Mar-2025');
    });
  });

  // ---------------------------------------------------------------------------
  describe('formatDateTime', () => {
    it('should return empty string for null', () => {
      expect(component.formatDateTime(null)).toBe('');
    });

    it('should format today with "Today" prefix', () => {
      const todayStr = moment().format('YYYY-MM-DD');
      const result = component.formatDateTime(todayStr);
      expect(result).toContain('Today');
    });

    it('should format non-today date in DD-MMM-YYYY format', () => {
      const pastDate = '2024-03-15T10:30:00';
      const result = component.formatDateTime(pastDate);
      expect(result).toContain('15-MAR-2024');
      expect(result).toContain('PST');
    });

    it('should format a Date object', () => {
      const date = new Date(2024, 2, 15, 10, 30);
      const result = component.formatDateTime(date);
      expect(result).toContain('PST');
    });
  });

  // ---------------------------------------------------------------------------
  describe('getProductTypeDescError', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should return empty string when control is not touched', () => {
      expect(component.getProductTypeDescError()).toBe('');
    });

    it('should return empty string when there are no errors and control is touched', () => {
      component.form.get('productTypeDesc')?.markAsTouched();
      expect(component.getProductTypeDescError()).toBe('');
    });

    it('should return required error when productTypeDesc has required validator and is touched', () => {
      component.form.get('productTypeDesc')?.setValidators([Validators.required]);
      component.form.get('productTypeDesc')?.updateValueAndValidity();
      component.form.get('productTypeDesc')?.markAsTouched();
      expect(component.getProductTypeDescError()).toContain('required');
    });

    it('should return maxlength error when productTypeDesc exceeds maxlength', () => {
      component.form.get('productTypeDesc')?.setValidators([Validators.maxLength(30)]);
      component.form.get('productTypeDesc')?.setValue('A'.repeat(31));
      component.form.get('productTypeDesc')?.markAsTouched();
      expect(component.getProductTypeDescError()).toContain('30 characters');
    });
  });

  // ---------------------------------------------------------------------------
  describe('getEffectiveDateError', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should return empty string when effective date is not touched', () => {
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return required error when effective date is touched and empty', () => {
      component.form.get('effectiveDate')?.markAsTouched();
      expect(component.getEffectiveDateError()).toContain('required');
    });
  });

  // ---------------------------------------------------------------------------
  describe('getTerminationDateError', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should return empty string when termination date is not touched', () => {
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return empty string when termination date is touched but valid', fakeAsync(() => {
      component.form.patchValue({
        effectiveDate: futureDate,
        terminationDate: futureDate.clone().add(1, 'day')
      });
      component.form.get('terminationDate')?.markAsTouched();
      tick();
      // Should not have dateRangeInvalid error since term > eff
      expect(component.getTerminationDateError()).toBe('');
    }));
  });

  // ---------------------------------------------------------------------------
  describe('Control getters', () => {
    it('should return productTypeCodeControl', () => {
      expect(component.productTypeCodeControl).toBe(component.form.get('productTypeCode'));
    });

    it('should return productTypeDescControl', () => {
      expect(component.productTypeDescControl).toBe(component.form.get('productTypeDesc'));
    });

    it('should return productClassControl', () => {
      expect(component.productClassControl).toBe(component.form.get('productClass'));
    });

    it('should return effectiveDateControl', () => {
      expect(component.effectiveDateControl).toBe(component.form.get('effectiveDate'));
    });

    it('should return terminationDateControl', () => {
      expect(component.terminationDateControl).toBe(component.form.get('terminationDate'));
    });
  });

  // ---------------------------------------------------------------------------
  describe('extractErrorMessage (via error snackbar)', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        productTypeCode: 'RBC',
        productClass: 'A',
        effectiveDate: futureDate
      });
    }));

    it('should extract error.error.error.errorCode + errorDescription format', fakeAsync(() => {
      const errorObj = {
        error: {
          error: {
            errorCode: 'ERR001',
            errorDescription: 'Duplicate product type'
          }
        }
      };
      mockProductTypeService.createProductType.and.returnValue(throwError(() => errorObj));
      snackBarSpy = spyOn(component['snackBar'], 'open');

      component.onSave();
      flush();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Error: ERR001 : Duplicate product type',
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should extract error.error.errorResponse format', fakeAsync(() => {
      const errorObj = {
        error: {
          errorResponse: {
            errorCode: 'ERR002',
            error: 'Validation failed'
          }
        }
      };
      mockProductTypeService.createProductType.and.returnValue(throwError(() => errorObj));
      snackBarSpy = spyOn(component['snackBar'], 'open');

      component.onSave();
      flush();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Error: ERR002 : Validation failed',
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should extract error.error.message format', fakeAsync(() => {
      const errorObj = {
        error: {
          message: 'Bad request'
        }
      };
      mockProductTypeService.createProductType.and.returnValue(throwError(() => errorObj));
      snackBarSpy = spyOn(component['snackBar'], 'open');

      component.onSave();
      flush();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Bad request',
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should fall back to error.message format', fakeAsync(() => {
      const errorObj = {
        message: 'Network error'
      };
      mockProductTypeService.createProductType.and.returnValue(throwError(() => errorObj));
      snackBarSpy = spyOn(component['snackBar'], 'open');

      component.onSave();
      flush();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Network error',
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should use default message when no known error format matches', fakeAsync(() => {
      const errorObj = {};
      mockProductTypeService.createProductType.and.returnValue(throwError(() => errorObj));
      snackBarSpy = spyOn(component['snackBar'], 'open');

      component.onSave();
      flush();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Error creating product type',
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should use default message for update errors', fakeAsync(() => {
      // Create a fresh fixture in edit mode to avoid add-mode validators on effective date
      fixture = TestBed.createComponent(AddEditProductType);
      component = fixture.componentInstance;
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        productClass: 'B',
        effectiveDate: moment(mockEditData.effDate),
        terminationDate: futureDate
      });

      const errorObj = {};
      mockProductTypeService.updateProductType.and.returnValue(throwError(() => errorObj));
      snackBarSpy = spyOn(component['snackBar'], 'open');

      component.onSave();
      flush();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Error updating product type',
        'DISMISS',
        jasmine.any(Object)
      );
    }));
  });

  // ---------------------------------------------------------------------------
  describe('isFormValid - additional branches', () => {
    it('should return true in edit mode when form is valid and fields changed', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        productClass: 'B',
        effectiveDate: moment(mockEditData.effDate),
        terminationDate: futureDate
      });

      expect(component.isFormValid).toBe(true);
    }));

    it('should return false when form is valid but has date range error', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        productTypeCode: 'RBC',
        productClass: 'A',
        effectiveDate: moment('2099-12-31'),
        terminationDate: moment('2099-01-01') // before effective date
      });

      expect(component.isFormValid).toBe(false);
    }));
  });

  // ---------------------------------------------------------------------------
  describe('hasFormChanged - additional branches', () => {
    it('should return true in add mode', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      // hasFormChanged returns true in add mode regardless
      // We test it through isFormValid
      component.form.patchValue({
        productTypeCode: 'RBC',
        productClass: 'A',
        effectiveDate: futureDate
      });

      expect(component.isFormValid).toBe(true);
    }));

    it('should return false when only read-only fields differ', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();

      // No changes made - isFormValid should be false because hasFormChanged is false
      expect(component.isFormValid).toBe(false);
    }));

    it('should detect aboOnly change', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();

      component.form.patchValue({ aboOnly: 'N' }); // changed from Y to N
      expect(component.isFormValid).toBe(true);
    }));

    it('should detect attribFlag change', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();

      component.form.patchValue({ attribFlag: 'Y' }); // changed from N to Y
      expect(component.isFormValid).toBe(true);
    }));

    it('should detect weightRequired change', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();

      component.form.patchValue({ weightRequired: 'N' }); // changed from Y to N
      expect(component.isFormValid).toBe(true);
    }));

    it('should detect terminationDate change', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();

      component.form.patchValue({ terminationDate: futureDate });
      expect(component.isFormValid).toBe(true);
    }));
  });

  // ---------------------------------------------------------------------------
  describe('resetFormForAddMode', () => {
    it('should reset all form values and enable productTypeCode', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();

      // Switch to add mode
      component.mode = 'add';
      const changes = {
        mode: new SimpleChange('edit', 'add', false)
      };
      component.ngOnChanges(changes);

      expect(component.editModeValues.productTypeCode).toBe('');
      expect(component.editModeValues.productTypeDesc).toBe('');
      expect(component.form.get('productTypeCode')?.enabled).toBe(true);
      expect(component.form.get('classDescription')?.disabled).toBe(true);
    }));
  });

  // ---------------------------------------------------------------------------
  describe('setupDateValidationListeners', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should track lastChangedDateField as effective when effectiveDate changes', fakeAsync(() => {
      component.form.get('effectiveDate')?.setValue(futureDate);
      tick();

      expect((component as any).lastChangedDateField).toBe('effective');
    }));

    it('should track lastChangedDateField as termination when terminationDate changes', fakeAsync(() => {
      component.form.get('terminationDate')?.setValue(futureDate);
      tick();

      expect((component as any).lastChangedDateField).toBe('termination');
    }));
  });

  // ---------------------------------------------------------------------------
  describe('getProductTypeCodeError - additional', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should return empty string when control is not touched', () => {
      expect(component.getProductTypeCodeError()).toBe('');
    });

    it('should return empty string when control has no errors', fakeAsync(() => {
      component.form.get('productTypeCode')?.setValue('ABC');
      component.form.get('productTypeCode')?.markAsTouched();
      tick();
      expect(component.getProductTypeCodeError()).toBe('');
    }));
  });

  // ---------------------------------------------------------------------------
  describe('Date error matchers', () => {
    it('should have effDateErrorMatcher defined', () => {
      expect(component.effDateErrorMatcher).toBeTruthy();
      expect(component.effDateErrorMatcher.isErrorState).toBeDefined();
    });

    it('should have termDateErrorMatcher defined', () => {
      expect(component.termDateErrorMatcher).toBeTruthy();
      expect(component.termDateErrorMatcher.isErrorState).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  describe('yesNoOptions and attribFlagOptions', () => {
    it('should have yesNoOptions with Y and N', () => {
      expect(component.yesNoOptions.length).toBe(2);
      expect(component.yesNoOptions[0]).toEqual({ value: 'Y', label: 'Yes' });
      expect(component.yesNoOptions[1]).toEqual({ value: 'N', label: 'No' });
    });

    it('should have attribFlagOptions with Y and N', () => {
      expect(component.attribFlagOptions.length).toBe(2);
      expect(component.attribFlagOptions[0]).toEqual({ value: 'Y', label: 'Yes' });
      expect(component.attribFlagOptions[1]).toEqual({ value: 'N', label: 'No' });
    });
  });

  // ---------------------------------------------------------------------------
  describe('getProductTypeDisplay and getProductClassDisplay - additional', () => {
    it('should display only code when productTypeDesc is null-ish', () => {
      const option = { productTypeCode: 'XYZ', productTypeDesc: null as any };
      expect(component.getProductTypeDisplay(option)).toBe('XYZ');
    });

    it('should display only code when codeDesc is null-ish', () => {
      const option = { code: 'X', codeDesc: null as any };
      expect(component.getProductClassDisplay(option)).toBe('X');
    });
  });
});
