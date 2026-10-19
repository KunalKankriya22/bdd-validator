import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatNativeDateModule } from '@angular/material/core';
import { SimpleChange, SimpleChanges } from '@angular/core';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { AddEditABOProdCompatibility } from './add-edit-abo-prod-compatibility';
import { ABOProdCompatibilityService } from '../services/abo-prod-compatibility.service';
import { ABOProdCompatibilityModel } from '../models/abo-prod-compatibility.model';
import { HeaderService } from '@shared/services/header.service';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';
import { HttpErrorResponse } from '@angular/common/http';

describe('AddEditABOProdCompatibility', () => {
  let tomorrow: any;
  let mockDropdownResponse: any;
  let component: AddEditABOProdCompatibility;
  let fixture: ComponentFixture<AddEditABOProdCompatibility>;
  let mockABOProdCompatibilityService: jasmine.SpyObj<ABOProdCompatibilityService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  function createComponent(mode: 'add' | 'edit', data?: ABOProdCompatibilityModel): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [
        AddEditABOProdCompatibility,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatSelectModule,
        MatDatepickerModule,
        MatIconModule,
        MatSnackBarModule,
        MatNativeDateModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ABOProdCompatibilityService, useValue: mockABOProdCompatibilityService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditABOProdCompatibility);
    component = fixture.componentInstance;
    component.mode = mode;
    component.data = data || null;
  }

  beforeEach(() => {
    mockABOProdCompatibilityService = jasmine.createSpyObj('ABOProdCompatibilityService', [
      'getAddDropdownValues',
      'addABOProdCompatibility',
      'updateABOProdCompatibility'
    ]);

    mockSnackBar = createMockMatSnackBar();

    mockHeaderService = createMockHeaderService();
    TestBed.configureTestingModule({
      imports: [
        AddEditABOProdCompatibility,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatSelectModule,
        MatDatepickerModule,
        MatIconModule,
        MatSnackBarModule,
        MatNativeDateModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ABOProdCompatibilityService, useValue: mockABOProdCompatibilityService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditABOProdCompatibility);
    component = fixture.componentInstance;
    component.mode = 'add';
    component.data = null;
  });

  describe('Form Initialization', () => {
    it('should initialize form with required validators in add mode', () => {
      mockDropdownResponse = {
        item: {
          productTypes: [],
          aboCodes: []
        }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));

      fixture.detectChanges();

      expect(component.form).toBeDefined();
      expect(component.form.get('productType')?.hasError('required')).toBe(true);
      expect(component.form.get('requestABO')?.hasError('required')).toBe(true);
      expect(component.form.get('compatibleABO')?.hasError('required')).toBe(true);
      expect(component.form.get('effectiveDate')?.hasError('required')).toBe(true);
      expect(component.form.get('terminationDate')?.hasError('required')).toBe(false);
    });


  });

  describe('loadDropdownOptions', () => {
    it('should load dropdown values from response.item', () => {
      const mockResponse = {
        item: {
          productTypes: [
            { productType: 'RBC', description: 'Red Blood Cells' },
            { productType: 'PLT', description: 'Platelets' }
          ],
          aboCodes: [
            { key: 'A', value: 'Type A' },
            { key: 'B', value: 'Type B' },
            { key: 'O', value: 'Type O' }
          ]
        }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(component.productTypeOptionsSignal()).toEqual(mockResponse.item.productTypes);
      expect(component.aboCodeOptionsSignal()).toEqual(mockResponse.item.aboCodes);
      expect(component.isLoadingOptions).toBe(false);
    });

    it('should handle error when loading dropdown values', () => {
      const errorResponse = { status: 500, statusText: 'Server Error', error: {} };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(
        throwError(() => errorResponse)
      );

      fixture.detectChanges();

      expect(component.productTypeOptionsSignal()).toEqual([]);
      expect(component.aboCodeOptionsSignal()).toEqual([]);
      expect(component.isLoadingOptions).toBe(false);
    });

    it('should load dropdown values from response.data[0]', () => {
      const mockResponse = {
        data: [{
          productTypes: [
            { productType: 'PLT', description: 'Platelets' }
          ],
          aboCodes: [
            { key: 'AB', value: 'Type AB' }
          ]
        }]
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(component.productTypeOptionsSignal()).toEqual(mockResponse.data[0].productTypes);
      expect(component.aboCodeOptionsSignal()).toEqual(mockResponse.data[0].aboCodes);
      expect(component.isLoadingOptions).toBe(false);
    });

    it('should load dropdown values from response directly when response.productTypes exists', () => {
      const mockResponse = {
        productTypes: [
          { productType: 'FFP', description: 'Fresh Frozen Plasma' }
        ],
        aboCodes: [
          { key: 'O', value: 'Type O' }
        ]
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(component.productTypeOptionsSignal()).toEqual(mockResponse.productTypes);
      expect(component.aboCodeOptionsSignal()).toEqual(mockResponse.aboCodes);
      expect(component.isLoadingOptions).toBe(false);
    });

    it('should warn when no dropdown data found in response', () => {
      const mockResponse = { someOtherKey: 'value' };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockResponse as any));

      spyOn(console, 'warn');
      fixture.detectChanges();

      expect(console.warn).toHaveBeenCalledWith('No dropdown data found in response');
      expect(component.isLoadingOptions).toBe(false);
    });
  });

  describe('populateFormForEdit', () => {

    it('should store original values for update API', () => {
      mockDropdownResponse = {
        item: {
          productTypes: [],
          aboCodes: []
        }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));

      tomorrow = moment().add(1, 'day').toDate();

      const testData: ABOProdCompatibilityModel = {
        productType: 'RBC',
        requestABO: 'A',
        compatibleABO: 'O',
        effectiveDate: tomorrow,
        terminationDate: null
      };

      createComponent('edit', testData);

      fixture.detectChanges();

      expect(component['originalValues'].productType).toBe('RBC');
      expect(component['originalValues'].requestABO).toBe('A');
      expect(component['originalValues'].compatibleABO).toBe('O');
    });

    it('should disable non-editable fields in edit mode', () => {
      mockDropdownResponse = {
        item: {
          productTypes: [],
          aboCodes: []
        }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));

      tomorrow = moment().add(1, 'day').toDate();

      const testData: ABOProdCompatibilityModel = {
        productType: 'RBC',
        requestABO: 'A',
        compatibleABO: 'O',
        effectiveDate: tomorrow
      };

      createComponent('edit', testData);

      fixture.detectChanges();

      expect(component.form.get('productType')?.disabled).toBe(true);
      expect(component.form.get('requestABO')?.disabled).toBe(true);
      expect(component.form.get('compatibleABO')?.disabled).toBe(true);
      // effectiveDate is re-enabled in setupPanel for this component (lines 301-309)
      expect(component.form.get('effectiveDate')?.enabled).toBe(true);
    });

    it('should populate editModeValues with display values', () => {
      mockDropdownResponse = {
        item: { productTypes: [], aboCodes: [] }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));

      const testData: ABOProdCompatibilityModel = {
        productType: 'RBC',
        productDescription: 'Red Blood Cells',
        requestABO: 'A',
        requestABODisplay: 'A - Type A',
        compatibleABO: 'O',
        compatibleABODisplay: 'O - Type O',
        effectiveDate: new Date('2026-06-15'),
        terminationDate: new Date('2026-12-31')
      };

      createComponent('edit', testData);
      fixture.detectChanges();

      expect(component.editModeValues.productType).toBe('RBC');
      expect(component.editModeValues.description).toBe('Red Blood Cells');
      expect(component.editModeValues.requestABO).toBe('A - Type A');
      expect(component.editModeValues.compatibleABO).toBe('O - Type O');
      expect(component.editModeValues.effectiveDate).not.toBe('');
      expect(component.editModeValues.terminationDate).not.toBe('');
    });

    it('should use fallback values when display values are missing', () => {
      mockDropdownResponse = {
        item: { productTypes: [], aboCodes: [] }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));

      const testData: ABOProdCompatibilityModel = {
        productType: 'RBC',
        requestABO: 'A',
        compatibleABO: 'O',
        effectiveDate: new Date('2026-06-15')
      };

      createComponent('edit', testData);
      fixture.detectChanges();

      expect(component.editModeValues.requestABO).toBe('A');
      expect(component.editModeValues.compatibleABO).toBe('O');
      expect(component.editModeValues.terminationDate).toBe('');
    });

    it('should store initial form values to track changes', () => {
      mockDropdownResponse = {
        item: { productTypes: [], aboCodes: [] }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));

      const testData: ABOProdCompatibilityModel = {
        productType: 'RBC',
        requestABO: 'A',
        compatibleABO: 'O',
        effectiveDate: new Date('2026-06-15'),
        terminationDate: new Date('2026-12-31')
      };

      createComponent('edit', testData);
      fixture.detectChanges();

      expect(component['initialFormValues']).not.toBeNull();
      expect(component['initialFormValues']!.effectiveDate).not.toBeNull();
      expect(component['initialFormValues']!.terminationDate).not.toBeNull();
    });

    it('should handle null data gracefully when data has null fields', () => {
      mockDropdownResponse = {
        item: { productTypes: [], aboCodes: [] }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));

      const testData: ABOProdCompatibilityModel = {
        productType: undefined,
        requestABO: undefined,
        compatibleABO: undefined,
        effectiveDate: null,
        terminationDate: null
      };

      createComponent('edit', testData);
      fixture.detectChanges();

      expect(component['originalValues'].productType).toBe('');
      expect(component['originalValues'].requestABO).toBe('');
      expect(component['originalValues'].compatibleABO).toBe('');
    });
  });

  describe('onCancel', () => {
    beforeEach(() => {
      mockDropdownResponse = {
        item: { productTypes: [], aboCodes: [] }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));
      fixture.detectChanges();
    });

    it('should emit closePanel event', () => {
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  describe('onSave - Add Mode', () => {
    beforeEach(() => {
      mockDropdownResponse = {
        item: {
          productTypes: [],
          aboCodes: []
        }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));
      fixture.detectChanges();
    });

    it('should not call API when form is invalid', () => {
      component.onSave();

      expect(mockABOProdCompatibilityService.addABOProdCompatibility).not.toHaveBeenCalled();
      expect(mockABOProdCompatibilityService.updateABOProdCompatibility).not.toHaveBeenCalled();
    });

    it('should call add API with correct payload', () => {
      const mockResponse = {
        success: true,
        message: 'Record added successfully'
      };

      mockABOProdCompatibilityService.addABOProdCompatibility.and.returnValue(of(mockResponse));

      tomorrow = moment().add(1, 'day');
      const thirtyDaysFromNow = moment().add(30, 'days');

      component.form.patchValue({
        productType: 'RBC',
        requestABO: 'A',
        compatibleABO: 'O',
        effectiveDate: tomorrow,
        terminationDate: thirtyDaysFromNow
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSave();

      expect(mockABOProdCompatibilityService.addABOProdCompatibility).toHaveBeenCalled();
      const payload = (mockABOProdCompatibilityService.addABOProdCompatibility as jasmine.Spy).calls.mostRecent().args[0];

      expect(payload.inventoryProductType).toBe('RBC');
      expect(payload.requestedABO).toBe('A');
      expect(payload.compatibleABO).toBe('O');
      expect(typeof payload.effectiveDate).toBe('string');
      expect(typeof payload.terminationDate).toBe('string');
    });

    it('should close panel and emit success on successful save', () => {
      const mockResponse = {
        success: true,
        message: 'Record added successfully'
      };

      mockABOProdCompatibilityService.addABOProdCompatibility.and.returnValue(of(mockResponse));

      spyOn(component.closePanel, 'emit');
      spyOn(component.saveSuccess, 'emit');

      tomorrow = moment().add(1, 'day');
      const thirtyDaysFromNow = moment().add(30, 'days');

      component.form.patchValue({
        productType: 'RBC',
        requestABO: 'A',
        compatibleABO: 'O',
        effectiveDate: tomorrow,
        terminationDate: thirtyDaysFromNow
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSave();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should set isSaving to true during save and false after finalize', () => {
      mockABOProdCompatibilityService.addABOProdCompatibility.and.returnValue(of({ success: true }));

      tomorrow = moment().add(1, 'day');
      component.form.patchValue({
        productType: 'RBC',
        requestABO: 'A',
        compatibleABO: 'O',
        effectiveDate: tomorrow
      });
      component.form.updateValueAndValidity();

      component.onSave();

      // After synchronous observable completes, isSaving should be false via finalize
      expect(component.isSaving).toBe(false);
    });

    it('should show snackbar with add success message', () => {
      mockABOProdCompatibilityService.addABOProdCompatibility.and.returnValue(of({ success: true }));

      const snackBarSpy = spyOn(component['snackBar'], 'open');

      tomorrow = moment().add(1, 'day');
      component.form.patchValue({
        productType: 'RBC',
        requestABO: 'A',
        compatibleABO: 'O',
        effectiveDate: tomorrow
      });
      component.form.updateValueAndValidity();

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('successfully added'),
        'Close',
        jasmine.objectContaining({ duration: 3000 })
      );
    });

    it('should handle 409 conflict error', () => {
      const errorResponse = new HttpErrorResponse({
        status: 409,
        statusText: 'Conflict',
        error: {}
      });
      mockABOProdCompatibilityService.addABOProdCompatibility.and.returnValue(throwError(() => errorResponse));

      spyOn(console, 'error');

      tomorrow = moment().add(1, 'day');
      component.form.patchValue({
        productType: 'RBC',
        requestABO: 'A',
        compatibleABO: 'O',
        effectiveDate: tomorrow
      });
      component.form.updateValueAndValidity();

      component.onSave();

      expect(console.error).toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
    });

    it('should handle 404 not found error', () => {
      const errorResponse = new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found',
        error: {}
      });
      mockABOProdCompatibilityService.addABOProdCompatibility.and.returnValue(throwError(() => errorResponse));

      spyOn(console, 'error');

      tomorrow = moment().add(1, 'day');
      component.form.patchValue({
        productType: 'RBC',
        requestABO: 'A',
        compatibleABO: 'O',
        effectiveDate: tomorrow
      });
      component.form.updateValueAndValidity();

      component.onSave();

      expect(console.error).toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
    });

    it('should handle generic error without error.error.message', () => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        statusText: 'Server Error',
        error: {}
      });
      mockABOProdCompatibilityService.addABOProdCompatibility.and.returnValue(throwError(() => errorResponse));

      spyOn(console, 'error');

      tomorrow = moment().add(1, 'day');
      component.form.patchValue({
        productType: 'RBC',
        requestABO: 'A',
        compatibleABO: 'O',
        effectiveDate: tomorrow
      });
      component.form.updateValueAndValidity();

      component.onSave();

      expect(console.error).toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
    });

    it('should use error.error.message when available', () => {
      const errorResponse = new HttpErrorResponse({
        status: 400,
        statusText: 'Bad Request',
        error: { message: 'Custom server error message' }
      });
      mockABOProdCompatibilityService.addABOProdCompatibility.and.returnValue(throwError(() => errorResponse));

      spyOn(console, 'error');

      tomorrow = moment().add(1, 'day');
      component.form.patchValue({
        productType: 'RBC',
        requestABO: 'A',
        compatibleABO: 'O',
        effectiveDate: tomorrow
      });
      component.form.updateValueAndValidity();

      component.onSave();

      expect(console.error).toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
    });

    it('should handle save with null terminationDate', () => {
      mockABOProdCompatibilityService.addABOProdCompatibility.and.returnValue(of({ success: true }));

      tomorrow = moment().add(1, 'day');
      component.form.patchValue({
        productType: 'RBC',
        requestABO: 'A',
        compatibleABO: 'O',
        effectiveDate: tomorrow,
        terminationDate: null
      });
      component.form.updateValueAndValidity();

      component.onSave();

      expect(mockABOProdCompatibilityService.addABOProdCompatibility).toHaveBeenCalled();
    });
  });

  describe('onSave - Edit Mode', () => {
    beforeEach(() => {
      mockDropdownResponse = {
        item: {
          productTypes: [],
          aboCodes: []
        }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));

      tomorrow = moment().add(1, 'day').toDate();

      createComponent('edit', {
        productType: 'RBC',
        requestABO: 'A',
        compatibleABO: 'O',
        effectiveDate: tomorrow,
        terminationDate: null
      });

      fixture.detectChanges();
    });

    it('should call update API with correct payload including current values', () => {
      const mockResponse = {
        success: true,
        message: 'Record updated successfully'
      };

      mockABOProdCompatibilityService.updateABOProdCompatibility.and.returnValue(of(mockResponse));

      tomorrow = moment().add(1, 'day');
      const oneYearFromNow = moment().add(1, 'year');

      component.form.patchValue({
        productType: 'RBC',
        requestABO: 'A',
        compatibleABO: 'AB',
        effectiveDate: tomorrow,
        terminationDate: oneYearFromNow
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSave();

      expect(mockABOProdCompatibilityService.updateABOProdCompatibility).toHaveBeenCalled();
      const payload = (mockABOProdCompatibilityService.updateABOProdCompatibility as jasmine.Spy).calls.mostRecent().args[0];

      expect(payload.currentInventoryProductType).toBe('RBC');
      expect(payload.currentRequestedABO).toBe('A');
      expect(payload.currentCompatibleABO).toBe('O');
      expect(payload.newCompatibleABO).toBe('AB');
      expect(typeof payload.newTerminationDate).toBe('string');
    });

    it('should show snackbar with update success message', () => {
      mockABOProdCompatibilityService.updateABOProdCompatibility.and.returnValue(of({ success: true }));

      const snackBarSpy = spyOn(component['snackBar'], 'open');

      const oneYearFromNow = moment().add(1, 'year');
      component.form.patchValue({ terminationDate: oneYearFromNow });
      component.form.updateValueAndValidity();

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('successfully updated'),
        'Close',
        jasmine.objectContaining({ duration: 3000 })
      );
    });

    it('should handle update API error with 409 conflict', () => {
      const errorResponse = new HttpErrorResponse({
        status: 409,
        statusText: 'Conflict',
        error: {}
      });
      mockABOProdCompatibilityService.updateABOProdCompatibility.and.returnValue(throwError(() => errorResponse));

      spyOn(console, 'error');

      const oneYearFromNow = moment().add(1, 'year');
      component.form.patchValue({ terminationDate: oneYearFromNow });
      component.form.updateValueAndValidity();

      component.onSave();

      expect(console.error).toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
    });

    it('should set newEffectiveDate to null when effective date has not changed', () => {
      mockABOProdCompatibilityService.updateABOProdCompatibility.and.returnValue(of({ success: true }));

      // Only change termination date, not effective date
      const oneYearFromNow = moment().add(1, 'year');
      component.form.patchValue({ terminationDate: oneYearFromNow });
      component.form.updateValueAndValidity();

      component.onSave();

      const payload = (mockABOProdCompatibilityService.updateABOProdCompatibility as jasmine.Spy).calls.mostRecent().args[0];
      expect(payload.newEffectiveDate).toBeNull();
    });
  });

  describe('onSaveAndCreateAnother', () => {
    describe('Add Mode', () => {
      beforeEach(() => {
        mockDropdownResponse = {
          item: { productTypes: [], aboCodes: [] }
        };
        mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));
        fixture.detectChanges();
      });

      it('should not call API when form is invalid', () => {
        component.onSaveAndCreateAnother();

        expect(mockABOProdCompatibilityService.addABOProdCompatibility).not.toHaveBeenCalled();
      });

      it('should call add API and reset form on success in add mode', () => {
        mockABOProdCompatibilityService.addABOProdCompatibility.and.returnValue(of({ success: true }));

        spyOn(component.saveSuccess, 'emit');

        tomorrow = moment().add(1, 'day');
        component.form.patchValue({
          productType: 'RBC',
          requestABO: 'A',
          compatibleABO: 'O',
          effectiveDate: tomorrow
        });
        component.form.updateValueAndValidity();

        component.onSaveAndCreateAnother();

        expect(mockABOProdCompatibilityService.addABOProdCompatibility).toHaveBeenCalled();
        expect(component.saveSuccess.emit).toHaveBeenCalled();
        // Form should be reset for next entry
        expect(component.form.get('productType')?.value).toBeFalsy();
      });

      it('should show snackbar with add success message', () => {
        mockABOProdCompatibilityService.addABOProdCompatibility.and.returnValue(of({ success: true }));

        const snackBarSpy = spyOn(component['snackBar'], 'open');

        tomorrow = moment().add(1, 'day');
        component.form.patchValue({
          productType: 'RBC',
          requestABO: 'A',
          compatibleABO: 'O',
          effectiveDate: tomorrow
        });
        component.form.updateValueAndValidity();

        component.onSaveAndCreateAnother();

        expect(snackBarSpy).toHaveBeenCalledWith(
          jasmine.stringContaining('successfully added'),
          'Close',
          jasmine.objectContaining({ duration: 3000 })
        );
      });

      it('should set isSaving to false after finalize', () => {
        mockABOProdCompatibilityService.addABOProdCompatibility.and.returnValue(of({ success: true }));

        tomorrow = moment().add(1, 'day');
        component.form.patchValue({
          productType: 'RBC',
          requestABO: 'A',
          compatibleABO: 'O',
          effectiveDate: tomorrow
        });
        component.form.updateValueAndValidity();

        component.onSaveAndCreateAnother();

        expect(component.isSaving).toBe(false);
      });

      it('should handle 409 error on save and create another', () => {
        const errorResponse = new HttpErrorResponse({
          status: 409,
          statusText: 'Conflict',
          error: {}
        });
        mockABOProdCompatibilityService.addABOProdCompatibility.and.returnValue(throwError(() => errorResponse));

        spyOn(console, 'error');

        tomorrow = moment().add(1, 'day');
        component.form.patchValue({
          productType: 'RBC',
          requestABO: 'A',
          compatibleABO: 'O',
          effectiveDate: tomorrow
        });
        component.form.updateValueAndValidity();

        component.onSaveAndCreateAnother();

        expect(console.error).toHaveBeenCalled();
        expect(component.isSaving).toBe(false);
      });

      it('should handle 404 error on save and create another', () => {
        const errorResponse = new HttpErrorResponse({
          status: 404,
          statusText: 'Not Found',
          error: {}
        });
        mockABOProdCompatibilityService.addABOProdCompatibility.and.returnValue(throwError(() => errorResponse));

        spyOn(console, 'error');

        tomorrow = moment().add(1, 'day');
        component.form.patchValue({
          productType: 'RBC',
          requestABO: 'A',
          compatibleABO: 'O',
          effectiveDate: tomorrow
        });
        component.form.updateValueAndValidity();

        component.onSaveAndCreateAnother();

        expect(console.error).toHaveBeenCalled();
      });

      it('should handle generic error on save and create another', () => {
        const errorResponse = new HttpErrorResponse({
          status: 500,
          statusText: 'Server Error',
          error: {}
        });
        mockABOProdCompatibilityService.addABOProdCompatibility.and.returnValue(throwError(() => errorResponse));

        spyOn(console, 'error');

        tomorrow = moment().add(1, 'day');
        component.form.patchValue({
          productType: 'RBC',
          requestABO: 'A',
          compatibleABO: 'O',
          effectiveDate: tomorrow
        });
        component.form.updateValueAndValidity();

        component.onSaveAndCreateAnother();

        expect(console.error).toHaveBeenCalled();
      });

      it('should use error.error.message when available on save and create another', () => {
        const errorResponse = new HttpErrorResponse({
          status: 400,
          statusText: 'Bad Request',
          error: { message: 'Custom error' }
        });
        mockABOProdCompatibilityService.addABOProdCompatibility.and.returnValue(throwError(() => errorResponse));

        spyOn(console, 'error');

        tomorrow = moment().add(1, 'day');
        component.form.patchValue({
          productType: 'RBC',
          requestABO: 'A',
          compatibleABO: 'O',
          effectiveDate: tomorrow
        });
        component.form.updateValueAndValidity();

        component.onSaveAndCreateAnother();

        expect(console.error).toHaveBeenCalled();
      });
    });

    describe('Edit Mode', () => {
      beforeEach(() => {
        mockDropdownResponse = {
          item: { productTypes: [], aboCodes: [] }
        };
        mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));

        tomorrow = moment().add(1, 'day').toDate();

        createComponent('edit', {
          productType: 'RBC',
          requestABO: 'A',
          compatibleABO: 'O',
          effectiveDate: tomorrow,
          terminationDate: null
        });

        fixture.detectChanges();
      });

      it('should switch to add mode and reset form on successful save in edit mode', () => {
        mockABOProdCompatibilityService.updateABOProdCompatibility.and.returnValue(of({ success: true }));

        spyOn(component.saveSuccess, 'emit');
        spyOn(component.modeChange, 'emit');

        const oneYearFromNow = moment().add(1, 'year');
        component.form.patchValue({ terminationDate: oneYearFromNow });
        component.form.updateValueAndValidity();

        component.onSaveAndCreateAnother();

        expect(component.saveSuccess.emit).toHaveBeenCalled();
        expect(component.mode).toBe('add');
        expect(component.modeChange.emit).toHaveBeenCalledWith('add');
      });

      it('should show snackbar with update success message', () => {
        mockABOProdCompatibilityService.updateABOProdCompatibility.and.returnValue(of({ success: true }));

        const snackBarSpy = spyOn(component['snackBar'], 'open');

        const oneYearFromNow = moment().add(1, 'year');
        component.form.patchValue({ terminationDate: oneYearFromNow });
        component.form.updateValueAndValidity();

        component.onSaveAndCreateAnother();

        expect(snackBarSpy).toHaveBeenCalledWith(
          jasmine.stringContaining('successfully updated'),
          'Close',
          jasmine.objectContaining({ duration: 3000 })
        );
      });

      it('should call update API with correct payload', () => {
        mockABOProdCompatibilityService.updateABOProdCompatibility.and.returnValue(of({ success: true }));

        const oneYearFromNow = moment().add(1, 'year');
        component.form.patchValue({ terminationDate: oneYearFromNow });
        component.form.updateValueAndValidity();

        component.onSaveAndCreateAnother();

        expect(mockABOProdCompatibilityService.updateABOProdCompatibility).toHaveBeenCalled();
        const payload = (mockABOProdCompatibilityService.updateABOProdCompatibility as jasmine.Spy).calls.mostRecent().args[0];

        expect(payload.currentInventoryProductType).toBe('RBC');
        expect(payload.currentRequestedABO).toBe('A');
        expect(payload.currentCompatibleABO).toBe('O');
      });
    });
  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      mockDropdownResponse = {
        item: { productTypes: [], aboCodes: [] }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));
      fixture.detectChanges();
    });

    it('should not call setupPanel on first change', () => {
      const changes: SimpleChanges = {
        mode: new SimpleChange(undefined, 'add', true)
      };

      // panelTitle is already set from ngOnInit, so capture it
      const previousTitle = component.panelTitle;
      component.ngOnChanges(changes);

      // Should not have been called again (title should remain the same as set by ngOnInit)
      expect(component.panelTitle).toBe(previousTitle);
    });

    it('should call setupPanel when mode changes (non-firstChange)', () => {
      const changes: SimpleChanges = {
        mode: new SimpleChange('edit', 'add', false)
      };

      component.ngOnChanges(changes);

      expect(component.panelTitle).toBe('Add New Record');
    });

    it('should reset form when switching to add mode', () => {
      component.mode = 'add';
      const changes: SimpleChanges = {
        mode: new SimpleChange('edit', 'add', false)
      };

      component.ngOnChanges(changes);

      expect(component.form.get('productType')?.enabled).toBe(true);
      expect(component.form.get('requestABO')?.enabled).toBe(true);
      expect(component.form.get('compatibleABO')?.enabled).toBe(true);
    });

    it('should not reset form when data changes in edit mode', () => {
      component.mode = 'edit';
      const changes: SimpleChanges = {
        data: new SimpleChange(null, { productType: 'RBC' }, false)
      };

      component.ngOnChanges(changes);

      expect(component.panelTitle).toBe('Edit Record');
    });

    it('should ignore changes without mode or data keys', () => {
      const changes: SimpleChanges = {
        someOtherInput: new SimpleChange(null, 'value', false)
      };

      const previousTitle = component.panelTitle;
      component.ngOnChanges(changes);
      expect(component.panelTitle).toBe(previousTitle);
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      mockDropdownResponse = {
        item: { productTypes: [], aboCodes: [] }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));
      fixture.detectChanges();
    });

    it('should emit and complete destroy$ subject', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('setupPanel', () => {
    it('should set panel title for add mode', () => {
      mockDropdownResponse = {
        item: { productTypes: [], aboCodes: [] }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));

      fixture.detectChanges();

      expect(component.panelTitle).toBe('Add New Record');
      expect(component.lastUpdated).toBe('');
    });

    it('should set panel title and last updated for edit mode', () => {
      mockDropdownResponse = {
        item: { productTypes: [], aboCodes: [] }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));

      const modDate = moment().subtract(1, 'day').toDate();
      createComponent('edit', {
        productType: 'RBC',
        requestABO: 'A',
        compatibleABO: 'O',
        effectiveDate: moment().add(1, 'day').toDate(),
        modificationDate: modDate
      });

      fixture.detectChanges();

      expect(component.panelTitle).toBe('Edit Record');
      expect(component.lastUpdated).toContain('Last Updated:');
    });

    it('should set empty lastUpdated when modificationDate is null', () => {
      mockDropdownResponse = {
        item: { productTypes: [], aboCodes: [] }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));

      createComponent('edit', {
        productType: 'RBC',
        requestABO: 'A',
        compatibleABO: 'O',
        effectiveDate: moment().add(1, 'day').toDate(),
        modificationDate: null
      });

      fixture.detectChanges();

      expect(component.lastUpdated).toBe('');
    });
  });

  describe('setupSubscriptions', () => {
    beforeEach(() => {
      mockDropdownResponse = {
        item: { productTypes: [], aboCodes: [] }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));
      fixture.detectChanges();
    });

    it('should track lastChangedDateField as effective when effectiveDate changes', () => {
      component.form.get('effectiveDate')?.setValue(moment().add(5, 'days'));

      expect(component['lastChangedDateField']).toBe('effective');
    });

    it('should track lastChangedDateField as termination when terminationDate changes', () => {
      component.form.get('terminationDate')?.setValue(moment().add(30, 'days'));

      expect(component['lastChangedDateField']).toBe('termination');
    });

    it('should update productTypeSearch signal when search control changes', () => {
      component.productTypeSearchCtrl.setValue('RBC');

      expect(component.productTypeSearch()).toBe('RBC');
    });

    it('should update requestABOSearch signal when search control changes', () => {
      component.requestABOSearchCtrl.setValue('Type A');

      expect(component.requestABOSearch()).toBe('Type A');
    });

    it('should update compatibleABOSearch signal when search control changes', () => {
      component.compatibleABOSearchCtrl.setValue('Type O');

      expect(component.compatibleABOSearch()).toBe('Type O');
    });

    it('should set empty string when search control value is null', () => {
      component.productTypeSearchCtrl.setValue(null);

      expect(component.productTypeSearch()).toBe('');
    });

    it('should set empty string when requestABO search control value is null', () => {
      component.requestABOSearchCtrl.setValue(null);

      expect(component.requestABOSearch()).toBe('');
    });

    it('should set empty string when compatibleABO search control value is null', () => {
      component.compatibleABOSearchCtrl.setValue(null);

      expect(component.compatibleABOSearch()).toBe('');
    });
  });

  describe('Date Validation', () => {
    beforeEach(() => {
      mockDropdownResponse = {
        item: {
          productTypes: [],
          aboCodes: []
        }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));
      fixture.detectChanges();
    });

    it('should use chapter timezone for date validation in add mode', () => {
      expect(mockHeaderService.chapterTimeZone()).toBe('America/New_York');
    });

    it('should validate termination date is not before effective date', () => {
      const tenDaysFromNow = moment().add(10, 'days');
      tomorrow = moment().add(1, 'day');

      component.form.patchValue({
        productType: 'RBC',
        requestABO: 'A',
        compatibleABO: 'O',
        effectiveDate: tenDaysFromNow,
        terminationDate: tomorrow
      });
      fixture.detectChanges();

      expect(component.form.hasError('dateRangeInvalid')).toBe(true);
    });

    it('should return effective date as terminationMinDate when effective date is after today', () => {
      const fiveDaysFromNow = moment().add(5, 'days');

      component.form.patchValue({ effectiveDate: fiveDaysFromNow });

      const minDate = component.terminationMinDate;

      expect(minDate.isSame(fiveDaysFromNow, 'day')).toBe(true);
    });

    it('should return today as terminationMinDate when effective date is today or before', () => {
      const today = moment();

      component.form.patchValue({ effectiveDate: today });

      const minDate = component.terminationMinDate;

      expect(minDate.isSame(today, 'day')).toBe(true);
    });

    it('should return minDate when no effective date is set', () => {
      component.form.patchValue({ effectiveDate: null });

      const result = component.terminationMinDate;

      expect(result).toBeTruthy();
      expect(result.isSame(component.minDate, 'day')).toBe(true);
    });
  });

  describe('terminationDateFilterFn', () => {
    beforeEach(() => {
      mockDropdownResponse = {
        item: { productTypes: [], aboCodes: [] }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));
      fixture.detectChanges();
    });

    it('should return true for null date', () => {
      expect(component.terminationDateFilterFn(null)).toBe(true);
    });

    it('should return false for date before minDate', () => {
      const pastDate = moment().subtract(30, 'days');
      expect(component.terminationDateFilterFn(pastDate)).toBe(false);
    });

    it('should return false for date before effective date', () => {
      const effectiveDate = moment().add(10, 'days');
      component.form.patchValue({ effectiveDate });

      const beforeEffective = moment().add(5, 'days');
      expect(component.terminationDateFilterFn(beforeEffective)).toBe(false);
    });

    it('should return true for date on or after effective date', () => {
      const effectiveDate = moment().add(5, 'days');
      component.form.patchValue({ effectiveDate });

      const afterEffective = moment().add(10, 'days');
      expect(component.terminationDateFilterFn(afterEffective)).toBe(true);
    });

    it('should return true for future date when no effective date is set', () => {
      component.form.patchValue({ effectiveDate: null });

      const futureDate = moment().add(30, 'days');
      expect(component.terminationDateFilterFn(futureDate)).toBe(true);
    });
  });

  describe('Cross-field date error display (cached properties)', () => {
    beforeEach(() => {
      const mockDropdownResponse = {
        item: {
          productTypes: [],
          aboCodes: []
        }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));
      fixture.detectChanges();
    });

    it('should show cross-field error only on effective date when effective date was last changed', () => {
      const tenDaysFromNow = moment().add(10, 'days');
      const tomorrow = moment().add(1, 'day');

      component.form.patchValue({
        effectiveDate: tenDaysFromNow,
        terminationDate: tomorrow
      });
      component.form.get('effectiveDate')?.markAsTouched();
      component.form.get('terminationDate')?.markAsTouched();

      component['lastChangedDateField'] = 'effective';
      component.updateDateErrors();

      expect(component.effectiveDateError).toContain('must be less than or equal to');
      expect(component.terminationDateError).toBe('');
    });

    it('should show cross-field error only on termination when termination was last changed', () => {
      const tenDaysFromNow = moment().add(10, 'days');
      const tomorrow = moment().add(1, 'day');

      component.form.patchValue({
        effectiveDate: tenDaysFromNow,
        terminationDate: tomorrow
      });
      component.form.get('effectiveDate')?.markAsTouched();
      component.form.get('terminationDate')?.markAsTouched();
      component.form.get('terminationDate')?.markAsDirty();

      component['lastChangedDateField'] = 'termination';
      component.updateDateErrors();

      expect(component.effectiveDateError).toBe('');
      expect(component.terminationDateError).toContain('must be greater than or equal to');
    });

    it('should not flip lastChangedDateField when termination re-emits same date via updateValueAndValidity', () => {
      const tomorrow = moment().add(1, 'day');
      const tenDaysFromNow = moment().add(10, 'days');

      component.form.patchValue({
        effectiveDate: tomorrow,
        terminationDate: tenDaysFromNow
      });

      component.form.get('effectiveDate')?.setValue(moment().add(20, 'days'));
      expect(component['lastChangedDateField']).toBe('effective');

      // Simulate [min] cascade: updateValueAndValidity re-emits the same date value
      // distinctUntilChanged with date comparator should filter this
      component.form.get('terminationDate')?.updateValueAndValidity();
      expect(component['lastChangedDateField']).toBe('effective');
    });

    it('should update lastChangedDateField when termination date value actually changes', () => {
      const tomorrow = moment().add(1, 'day');
      const tenDaysFromNow = moment().add(10, 'days');

      component.form.patchValue({
        effectiveDate: tomorrow,
        terminationDate: tenDaysFromNow
      });

      component.form.get('effectiveDate')?.setValue(moment().add(3, 'days'));
      expect(component['lastChangedDateField']).toBe('effective');

      component.form.get('terminationDate')?.setValue(moment().add(30, 'days'));
      expect(component['lastChangedDateField']).toBe('termination');
    });
  });

  describe('Search Filtering', () => {
    beforeEach(() => {
      const mockDropdownResponse = {
        item: {
          productTypes: [
            { productType: 'RBC', description: 'Red Blood Cells' },
            { productType: 'PLT', description: 'Platelets' },
            { productType: 'PLASMA', description: 'Fresh Frozen Plasma' }
          ],
          aboCodes: [
            { key: 'A', value: 'Type A' },
            { key: 'B', value: 'Type B' },
            { key: 'O', value: 'Type O' },
            { key: 'AB', value: 'Type AB' }
          ]
        }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));
      fixture.detectChanges();
    });

    it('should filter product types when search matches code', () => {
      component.productTypeSearch.set('RB');

      const filtered = component.filteredProductTypes();

      expect(filtered.length).toBe(1);
      expect(filtered[0].productType).toBe('RBC');
    });


    it('should filter request ABO codes when search matches short code', () => {
      component.requestABOSearch.set('A');

      const filtered = component.filteredRequestABOOptions();

      expect(filtered.length).toBe(2);
    });

    it('should filter request ABO codes when search is 3+ characters', () => {
      component.requestABOSearch.set('Type A');

      const filtered = component.filteredRequestABOOptions();

      expect(filtered.length).toBe(2); // Matches "Type A" and "Type AB"
    });

    it('should filter compatible ABO codes when search matches short code', () => {
      component.compatibleABOSearch.set('O');

      const filtered = component.filteredCompatibleABOOptions();

      expect(filtered.length).toBe(1);
    });

    it('should filter compatible ABO codes independently when search is 3+ characters', () => {
      component.compatibleABOSearch.set('Type O');

      const filtered = component.filteredCompatibleABOOptions();

      expect(filtered.length).toBe(1); // Matches only "Type O"
    });

    it('should return all product types when search is empty', () => {
      component.productTypeSearch.set('');

      const filtered = component.filteredProductTypes();

      expect(filtered.length).toBe(3);
    });

    it('should return all request ABO options when search is empty', () => {
      component.requestABOSearch.set('');

      const filtered = component.filteredRequestABOOptions();

      expect(filtered.length).toBe(4);
    });

    it('should return all compatible ABO options when search is empty', () => {
      component.compatibleABOSearch.set('');

      const filtered = component.filteredCompatibleABOOptions();

      expect(filtered.length).toBe(4);
    });

    it('should filter product types by description', () => {
      component.productTypeSearch.set('platelets');

      const filtered = component.filteredProductTypes();

      expect(filtered.length).toBe(1);
      expect(filtered[0].productType).toBe('PLT');
    });

    it('should filter request ABO by value', () => {
      component.requestABOSearch.set('type b');

      const filtered = component.filteredRequestABOOptions();

      expect(filtered.length).toBe(1);
      expect(filtered[0].key).toBe('B');
    });

    it('should return empty array when search matches nothing', () => {
      component.productTypeSearch.set('ZZZZZ');

      const filtered = component.filteredProductTypes();

      expect(filtered.length).toBe(0);
    });
  });

  describe('formatDateTime - Dynamic Timezone', () => {
    beforeEach(() => {
      const mockDropdownResponse = {
        item: {
          productTypes: [],
          aboCodes: []
        }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));
      fixture.detectChanges();
    });

    it('should use chapter timezone from HeaderService', () => {
      const yesterday = moment().subtract(1, 'day').toDate();
      const formatted = component.formatDateTime(yesterday);

      expect(formatted).toContain('America/New_York');
    });

    it('should fall back to PST when chapter timezone is not available', () => {
      (mockHeaderService.chapterTimeZone as any).set('');
      const yesterday = moment().subtract(1, 'day').toDate();
      const formatted = component.formatDateTime(yesterday);

      expect(formatted).toContain('PST');
    });

    it('should handle different timezones correctly', () => {
      const yesterday = moment().subtract(1, 'day').toDate();

      // Test CST
      (mockHeaderService.chapterTimeZone as any).set('CST');
      expect(component.formatDateTime(yesterday)).toContain('CST');

      // Test MST
      (mockHeaderService.chapterTimeZone as any).set('MST');
      expect(component.formatDateTime(yesterday)).toContain('MST');
    });

    it('should return empty string for null date', () => {
      expect(component.formatDateTime(null)).toBe('');
    });

    it('should show "Today" for today\'s date', () => {
      const today = new Date();
      const formatted = component.formatDateTime(today);

      expect(formatted).toContain('Today');
    });

    it('should show formatted date for non-today date', () => {
      const yesterday = moment().subtract(1, 'day').toDate();
      const formatted = component.formatDateTime(yesterday);

      expect(formatted).not.toContain('Today');
      // Should contain date formatted as DD-MMM-YYYY
      expect(formatted).toMatch(/\d{2}-\w{3}-\d{4}/);
    });
  });

  describe('formatDateForDisplay', () => {
    beforeEach(() => {
      mockDropdownResponse = {
        item: { productTypes: [], aboCodes: [] }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));
      fixture.detectChanges();
    });

    it('should return empty string for null date', () => {
      expect(component['formatDateForDisplay'](null)).toBe('');
    });

    it('should return empty string for undefined date', () => {
      expect(component['formatDateForDisplay'](undefined)).toBe('');
    });

    it('should format valid date as DD-MMM-YYYY uppercase', () => {
      const date = new Date('2026-03-15');
      const result = component['formatDateForDisplay'](date);

      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });
  });

  describe('Control Getters', () => {
    beforeEach(() => {
      mockDropdownResponse = {
        item: { productTypes: [], aboCodes: [] }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));
      fixture.detectChanges();
    });

    it('should return productType control', () => {
      expect(component.productTypeControl).toBe(component.form.get('productType'));
    });

    it('should return requestABO control', () => {
      expect(component.requestABOControl).toBe(component.form.get('requestABO'));
    });

    it('should return compatibleABO control', () => {
      expect(component.compatibleABOControl).toBe(component.form.get('compatibleABO'));
    });

    it('should return effectiveDate control', () => {
      expect(component.effectiveDateControl).toBe(component.form.get('effectiveDate'));
    });

    it('should return terminationDate control', () => {
      expect(component.terminationDateControl).toBe(component.form.get('terminationDate'));
    });
  });

  describe('Error Messages', () => {
    beforeEach(() => {
      mockDropdownResponse = {
        item: { productTypes: [], aboCodes: [] }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));
      fixture.detectChanges();
    });

    describe('getInventoryProductTypeError', () => {
      it('should return empty string when control is not touched', () => {
        expect(component.getInventoryProductTypeError()).toBe('');
      });

      it('should return required error when touched and empty', () => {
        component.form.get('productType')?.markAsTouched();

        expect(component.getInventoryProductTypeError()).toBe('Inventory Product Type is required');
      });

      it('should return empty string when control has value', () => {
        component.form.get('productType')?.setValue('RBC');
        component.form.get('productType')?.markAsTouched();

        expect(component.getInventoryProductTypeError()).toBe('');
      });
    });

    describe('getRequestedABOError', () => {
      it('should return empty string when control is not touched', () => {
        expect(component.getRequestedABOError()).toBe('');
      });

      it('should return required error when touched and empty', () => {
        component.form.get('requestABO')?.markAsTouched();

        expect(component.getRequestedABOError()).toBe('Requested ABO is required');
      });

      it('should return empty string when control has value', () => {
        component.form.get('requestABO')?.setValue('A');
        component.form.get('requestABO')?.markAsTouched();

        expect(component.getRequestedABOError()).toBe('');
      });
    });

    describe('getCompatibleABOError', () => {
      it('should return empty string when control is not touched', () => {
        expect(component.getCompatibleABOError()).toBe('');
      });

      it('should return required error when touched and empty', () => {
        component.form.get('compatibleABO')?.markAsTouched();

        expect(component.getCompatibleABOError()).toBe('Compatible ABO is required');
      });

      it('should return empty string when control has value', () => {
        component.form.get('compatibleABO')?.setValue('O');
        component.form.get('compatibleABO')?.markAsTouched();

        expect(component.getCompatibleABOError()).toBe('');
      });
    });

    describe('getEffectiveDateError', () => {
      it('should pass form errors when lastChangedDateField is effective', () => {
        component['lastChangedDateField'] = 'effective';
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.get('effectiveDate')?.setValue(null);

        const result = component.getEffectiveDateError();
        // Should return an error string (required)
        expect(typeof result).toBe('string');
      });

      it('should pass null formErrors when lastChangedDateField is not effective', () => {
        component['lastChangedDateField'] = 'termination';
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.get('effectiveDate')?.setValue(null);

        const result = component.getEffectiveDateError();
        expect(typeof result).toBe('string');
      });

      it('should pass null formErrors when lastChangedDateField is null', () => {
        component['lastChangedDateField'] = null;
        const result = component.getEffectiveDateError();
        expect(typeof result).toBe('string');
      });
    });

    describe('getTerminationDateError', () => {
      it('should pass form errors when lastChangedDateField is termination', () => {
        component['lastChangedDateField'] = 'termination';
        component.form.get('terminationDate')?.markAsTouched();

        const result = component.getTerminationDateError();
        expect(typeof result).toBe('string');
      });

      it('should pass null formErrors when lastChangedDateField is not termination', () => {
        component['lastChangedDateField'] = 'effective';
        component.form.get('terminationDate')?.markAsTouched();

        const result = component.getTerminationDateError();
        expect(typeof result).toBe('string');
      });
    });
  });

  describe('Date Input Handlers', () => {
    beforeEach(() => {
      mockDropdownResponse = {
        item: { productTypes: [], aboCodes: [] }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));
      fixture.detectChanges();
    });

    describe('onEffectiveDateInput', () => {
      it('should handle input event', () => {
        const event = { target: { value: '15-JAN-2027' } } as unknown as Event;

        component.onEffectiveDateInput(event);

        // Should not throw and the control should be touched
        expect(component.form.get('effectiveDate')?.touched).toBe(true);
      });

      it('should handle empty input', () => {
        const event = { target: { value: '' } } as unknown as Event;

        component.onEffectiveDateInput(event);

        expect(component.form.get('effectiveDate')?.touched).toBe(true);
      });
    });

    describe('onTerminationDateInput', () => {
      it('should handle input event in add mode', () => {
        component.mode = 'add';
        const event = { target: { value: '30-JUN-2027' } } as unknown as Event;

        component.onTerminationDateInput(event);

        expect(component.form.get('terminationDate')?.touched).toBe(true);
      });

      it('should handle input event in edit mode', () => {
        component.mode = 'edit';
        const event = { target: { value: '30-JUN-2027' } } as unknown as Event;

        component.onTerminationDateInput(event);

        expect(component.form.get('terminationDate')?.touched).toBe(true);
      });

      it('should handle empty input in add mode', () => {
        component.mode = 'add';
        const event = { target: { value: '' } } as unknown as Event;

        component.onTerminationDateInput(event);

        // empty input in add mode for optional field should mark pristine
        expect(component.form.get('terminationDate')?.pristine).toBe(true);
      });

      it('should handle empty input in edit mode', () => {
        component.mode = 'edit';
        const event = { target: { value: '' } } as unknown as Event;

        component.onTerminationDateInput(event);

        // empty input in edit mode should mark dirty
        expect(component.form.get('terminationDate')?.dirty).toBe(true);
      });
    });
  });

  describe('resetFormForAddMode', () => {
    beforeEach(() => {
      mockDropdownResponse = {
        item: { productTypes: [], aboCodes: [] }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));
      fixture.detectChanges();
    });

    it('should reset editModeValues', () => {
      // Set some values first
      component.editModeValues = {
        productType: 'RBC',
        description: 'Red Blood Cells',
        requestABO: 'A',
        compatibleABO: 'O',
        effectiveDate: '15-JAN-2027',
        terminationDate: '30-JUN-2027'
      };

      component['resetFormForAddMode']();

      expect(component.editModeValues.productType).toBe('');
      expect(component.editModeValues.description).toBe('');
      expect(component.editModeValues.requestABO).toBe('');
      expect(component.editModeValues.compatibleABO).toBe('');
      expect(component.editModeValues.effectiveDate).toBe('');
      expect(component.editModeValues.terminationDate).toBe('');
    });

    it('should reset form to untouched and pristine', () => {
      component.form.markAllAsTouched();
      component.form.markAsDirty();

      component['resetFormForAddMode']();

      expect(component.form.untouched).toBe(true);
      expect(component.form.pristine).toBe(true);
    });

    it('should enable all fields', () => {
      component.form.get('productType')?.disable();
      component.form.get('requestABO')?.disable();
      component.form.get('compatibleABO')?.disable();
      component.form.get('effectiveDate')?.disable();

      component['resetFormForAddMode']();

      expect(component.form.get('productType')?.enabled).toBe(true);
      expect(component.form.get('requestABO')?.enabled).toBe(true);
      expect(component.form.get('compatibleABO')?.enabled).toBe(true);
      expect(component.form.get('effectiveDate')?.enabled).toBe(true);
    });

    it('should restore required validators', () => {
      component['resetFormForAddMode']();

      expect(component.form.get('productType')?.hasError('required')).toBe(true);
      expect(component.form.get('requestABO')?.hasError('required')).toBe(true);
      expect(component.form.get('compatibleABO')?.hasError('required')).toBe(true);
    });
  });

  describe('hasDateChanged', () => {
    beforeEach(() => {
      mockDropdownResponse = {
        item: { productTypes: [], aboCodes: [] }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));
      fixture.detectChanges();
    });

    it('should return false when both dates are same day', () => {
      const date1 = moment('2026-06-15');
      const date2 = moment('2026-06-15');

      expect(component['hasDateChanged'](date1, date2)).toBe(false);
    });

    it('should return true when dates are different days', () => {
      const date1 = moment('2026-06-15');
      const date2 = moment('2026-06-20');

      expect(component['hasDateChanged'](date1, date2)).toBe(true);
    });

    it('should return true when current is null and initial is not', () => {
      expect(component['hasDateChanged'](null, moment('2026-06-15'))).toBe(true);
    });

    it('should return true when current is not null and initial is null', () => {
      expect(component['hasDateChanged'](moment('2026-06-15'), null)).toBe(true);
    });

    it('should return false when both are null', () => {
      expect(component['hasDateChanged'](null, null)).toBe(false);
    });
  });

  describe('hasFormChanged', () => {
    it('should return true in add mode', () => {
      mockDropdownResponse = {
        item: { productTypes: [], aboCodes: [] }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));
      fixture.detectChanges();

      expect(component['hasFormChanged']()).toBe(true);
    });

    it('should return false in edit mode when no dates changed', () => {
      mockDropdownResponse = {
        item: { productTypes: [], aboCodes: [] }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));

      createComponent('edit', {
        productType: 'RBC',
        requestABO: 'A',
        compatibleABO: 'O',
        effectiveDate: moment().add(1, 'day').toDate(),
        terminationDate: moment().add(30, 'days').toDate()
      });

      fixture.detectChanges();

      expect(component['hasFormChanged']()).toBe(false);
    });

    it('should return true in edit mode when effective date changed', () => {
      mockDropdownResponse = {
        item: { productTypes: [], aboCodes: [] }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));

      createComponent('edit', {
        productType: 'RBC',
        requestABO: 'A',
        compatibleABO: 'O',
        effectiveDate: moment().add(1, 'day').toDate(),
        terminationDate: null
      });

      fixture.detectChanges();

      component.form.patchValue({ effectiveDate: moment().add(10, 'days') });

      expect(component['hasFormChanged']()).toBe(true);
    });

    it('should return true in edit mode when termination date changed', () => {
      mockDropdownResponse = {
        item: { productTypes: [], aboCodes: [] }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));

      createComponent('edit', {
        productType: 'RBC',
        requestABO: 'A',
        compatibleABO: 'O',
        effectiveDate: moment().add(1, 'day').toDate(),
        terminationDate: null
      });

      fixture.detectChanges();

      component.form.patchValue({ terminationDate: moment().add(60, 'days') });

      expect(component['hasFormChanged']()).toBe(true);
    });

    it('should return true in edit mode when initialFormValues is null', () => {
      mockDropdownResponse = {
        item: { productTypes: [], aboCodes: [] }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));
      fixture.detectChanges();

      component.mode = 'edit';
      component['initialFormValues'] = null;

      expect(component['hasFormChanged']()).toBe(true);
    });
  });

  describe('isFormValid - Save button enablement', () => {
    describe('Add Mode', () => {
      beforeEach(() => {
        const mockDropdownResponse = {
          item: {
            productTypes: [{ productType: 'RBC', description: 'Red Blood Cells' }],
            aboCodes: [
              { key: 'A', value: 'Type A' },
              { key: 'O', value: 'Type O' }
            ]
          }
        };
        mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));
        createComponent('add');
      });


      it('should return true when all required fields are filled', () => {
        component.form.patchValue({
          productType: 'RBC',
          requestABO: 'A',
          compatibleABO: 'O',
          effectiveDate: moment().add(1, 'day')
        });

        expect(component.isFormValid).toBe(true);
      });

      it('should return false when form is invalid', () => {
        // Form is empty, so invalid
        expect(component.isFormValid).toBe(false);
      });
    });

    describe('Edit Mode', () => {
      const mockEditData: ABOProdCompatibilityModel = {
        productType: 'RBC',
        productDescription: 'Red Blood Cells',
        requestABO: 'A',
        requestABODisplay: 'Type A',
        compatibleABO: 'O',
        compatibleABODisplay: 'Type O',
        effectiveDate: new Date('2026-01-15'),
        terminationDate: new Date('2026-12-31'),
        modificationDate: new Date('2026-01-01')
      };

      beforeEach(() => {
        const mockDropdownResponse = {
          item: {
            productTypes: [{ productType: 'RBC', description: 'Red Blood Cells' }],
            aboCodes: [
              { key: 'A', value: 'Type A' },
              { key: 'O', value: 'Type O' }
            ]
          }
        };
        mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));
        createComponent('edit', mockEditData);
      });

      it('should return false when form has not changed (save button disabled by default)', () => {
        expect(component.isFormValid).toBe(false);
      });

      it('should return true when terminationDate changes', () => {
        fixture.detectChanges(); // Trigger ngOnInit to set initialFormValues

        const newTerminationDate = moment('2027-06-30');
        component.form.patchValue({ terminationDate: newTerminationDate });

        expect(component.isFormValid).toBe(true);
      });

      it('should return false when terminationDate is changed to same value', () => {
        fixture.detectChanges(); // Trigger ngOnInit to set initialFormValues

        const originalTerminationDate = moment(mockEditData.terminationDate);
        component.form.patchValue({ terminationDate: originalTerminationDate });

        expect(component.isFormValid).toBe(false);
      });



      it('should detect changes even with moment date objects', () => {
        fixture.detectChanges(); // Trigger ngOnInit to set initialFormValues

        const newTerminationDate = moment('2027-01-01');
        component.form.patchValue({ terminationDate: newTerminationDate });

        expect(component.isFormValid).toBe(true);
      });

    });
  });

  describe('Error State Matchers', () => {
    beforeEach(() => {
      mockDropdownResponse = {
        item: { productTypes: [], aboCodes: [] }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));
      fixture.detectChanges();
    });

    it('should have effDateErrorMatcher defined', () => {
      expect(component.effDateErrorMatcher).toBeDefined();
      expect(component.effDateErrorMatcher.isErrorState).toBeDefined();
    });

    it('should have termDateErrorMatcher defined', () => {
      expect(component.termDateErrorMatcher).toBeDefined();
      expect(component.termDateErrorMatcher.isErrorState).toBeDefined();
    });
  });

  describe('terminationMinDate with non-moment effective date', () => {
    beforeEach(() => {
      mockDropdownResponse = {
        item: { productTypes: [], aboCodes: [] }
      };
      mockABOProdCompatibilityService.getAddDropdownValues.and.returnValue(of(mockDropdownResponse));
      fixture.detectChanges();
    });

    it('should handle Date object as effective date', () => {
      const futureDate = moment().add(10, 'days');
      component.form.patchValue({ effectiveDate: futureDate.toDate() });

      const result = component.terminationMinDate;

      expect(result).toBeTruthy();
    });
  });
});
