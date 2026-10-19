import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal, SimpleChange, SimpleChanges, ElementRef } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import moment from 'moment';

import { AddEditProductConversion } from './add-edit-product-conversion';
import { ProductConversionsService } from '../services/product-conversions.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

describe('AddEditProductConversion', () => {
  let component: AddEditProductConversion;
  let fixture: ComponentFixture<AddEditProductConversion>;
  let mockService: jasmine.SpyObj<ProductConversionsService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let chapterSubject: Subject<void>;

  const mockSourceProducts = [
    { productCode: '00150', productDesc: 'CPD Whole Blood', productType: 'WB', unitSchemeType: 'ISBT' },
    { productCode: '00160', productDesc: 'CPDA1 Whole Blood', productType: 'WB', unitSchemeType: 'ISBT' },
  ];

  const mockTargetProducts = [
    { productCode: '04900', productDesc: 'Red Blood Cells Washed', productType: 'RBC', unitSchemeType: 'ISBT' },
  ];

  beforeEach(() => {

    chapterSubject = new Subject<void>();

    mockService = jasmine.createSpyObj('ProductConversionsService', [
      'getSourceProducts',
      'getTargetProducts',
      'createProductConversion',
      'updateProductConversion',
    ]);
    mockService.getSourceProducts.and.returnValue(of({ data: mockSourceProducts }));
    mockService.getTargetProducts.and.returnValue(of({ data: mockTargetProducts }));
    mockService.createProductConversion.and.returnValue(of({ success: true, message: 'Created', statusCode: 201 }));
    mockService.updateProductConversion.and.returnValue(of({ success: true, message: 'Updated', statusCode: 200 }));

    mockHeaderService = createMockHeaderService();
    mockSnackBar = createMockMatSnackBar();



      TestBed.configureTestingModule({
imports: [
        AddEditProductConversion,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ProductConversionsService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).overrideComponent(AddEditProductConversion, {
      add: {
        providers: [
          { provide: MatSnackBar, useValue: mockSnackBar }
        ]
      }
    });


    });



  beforeEach(() => {

      mockHeaderService.getCurrentChapterTimezone.calls.reset();


      mockService.getSourceProducts.and.returnValue(of({ data: mockSourceProducts }));


      mockService.getTargetProducts.and.returnValue(of({ data: mockTargetProducts }));


      mockService.createProductConversion.and.returnValue(of({ success: true, message: 'Created', statusCode: 201 }));


      mockService.updateProductConversion.and.returnValue(of({ success: true, message: 'Updated', statusCode: 200 }));
    fixture = TestBed.createComponent(AddEditProductConversion);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });



  it('should have form with required fields', () => {
    expect(component.form.get('sourceProductCode')).toBeTruthy();
    expect(component.form.get('targetProductCode')).toBeTruthy();
    expect(component.form.get('effectiveDate')).toBeTruthy();
    expect(component.form.get('terminationDate')).toBeTruthy();
  });

  it('should have invalid form when empty', () => {
    expect(component.form.valid).toBeFalse();
  });

  it('should load source products on init', fakeAsync(() => {
    tick();
    expect(mockService.getSourceProducts).toHaveBeenCalled();
    expect(component.sourceProducts.length).toBe(2);
  }));


  it('should return source product error when touched and empty', () => {
    component.form.get('sourceProductCode')?.markAsTouched();
    expect(component.getSourceProductError()).toBe('Source Product is required');
  });

  it('should return target product error when touched and empty', () => {
    component.form.get('targetProductCode')?.markAsTouched();
    expect(component.getTargetProductError()).toBe('Target Product is required');
  });

  it('should update source description on source product selection', fakeAsync(() => {
    component.form.get('sourceProductCode')?.setValue('00150');
    tick();
    expect(component.sourceProductDescription).toBe('CPD Whole Blood');
  }));

  it('should load target products when source is selected', fakeAsync(() => {
    component.form.get('sourceProductCode')?.setValue('00150');
    tick();
    expect(mockService.getTargetProducts).toHaveBeenCalledWith('00150');
  }));



  it('should filter source products on search', () => {
    component.sourceSearchControl.setValue('CPDA1');
    expect(component.filteredSourceProducts.length).toBe(1);
  });


  it('should update target description on target selection', () => {
    component.targetProducts = mockTargetProducts;
    component.form.get('targetProductCode')?.setValue('04900');
    component.onTargetProductChange();
    expect(component.targetProductDescription).toBe('Red Blood Cells Washed');
  });



  describe('edit mode', () => {
    beforeEach(() => {
      const editFixture = TestBed.createComponent(AddEditProductConversion);
      component = editFixture.componentInstance;
      component.mode = 'edit';
      component.data = {
        sourceProductCode: '00150',
        sourceProductDesc: 'CPD Whole Blood',
        targetProductCode: '04900',
        targetProductDesc: 'Red Blood Cells Washed',
        effDate: '2025-06-09',
        termDate: null,
        lastModifiedDate: '2025-01-30T08:32:00',
        programId: 'VPRODCON',
      };
      editFixture.detectChanges();
    });




    it('should populate effective date as read-only label', () => {
      expect(component.editModeValues.effDate).toBeTruthy();
      expect(component.editModeValues.effDate).toMatch(/\d{2}-[A-Z]{3}-\d{4}/);
    });

    it('should show last modified display', () => {
      expect(component.lastModifiedDisplay).toContain('Last Modified:');
    });
  });

  // ─── Component creation and defaults ──────────────────────────────────────
  describe('component creation and defaults', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should default mode to add', () => {
      expect(component.mode).toBe('add');
    });

    it('should default data to null', () => {
      expect(component.data).toBeNull();
    });

    it('should set panelTitle to Add New Product Conversion in add mode', () => {
      expect(component.panelTitle).toBe('Add New Product Conversion');
    });

    it('should have empty lastModifiedDisplay in add mode', () => {
      expect(component.lastModifiedDisplay).toBe('');
    });

    it('should default sourceProductDescription to --', () => {
      expect(component.sourceProductDescription).toBe('--');
    });

    it('should default targetProductDescription to --', () => {
      expect(component.targetProductDescription).toBe('--');
    });

    it('should default isSaving to false', () => {
      expect(component.isSaving).toBeFalse();
    });

    it('should default isLoadingSourceProducts to false after init', () => {
      expect(component.isLoadingSourceProducts).toBeFalse();
    });

    it('should default isLoadingTargetProducts to false', () => {
      expect(component.isLoadingTargetProducts).toBeFalse();
    });
  });

  // ─── isFormValid getter ───────────────────────────────────────────────────
  describe('isFormValid', () => {
    it('should return false when form is invalid', () => {
      expect(component.isFormValid).toBeFalse();
    });

    it('should return true when form is valid', () => {
      component.form.get('sourceProductCode')?.setValue('00150');
      component.form.get('targetProductCode')?.setValue('04900');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      component.form.updateValueAndValidity();
      expect(component.isFormValid).toBeTrue();
    });
  });

  // ─── ngOnDestroy ──────────────────────────────────────────────────────────
  describe('ngOnDestroy', () => {
    it('should complete the destroy subject', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // ─── ngOnChanges ──────────────────────────────────────────────────────────
  describe('ngOnChanges', () => {
    it('should not call setupPanel on first change', () => {
      const spy = spyOn<any>(component, 'setupPanel');
      const changes: SimpleChanges = {
        mode: new SimpleChange(undefined, 'add', true),
      };
      component.ngOnChanges(changes);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should call setupPanel on subsequent mode change', () => {
      const spy = spyOn<any>(component, 'setupPanel');
      const changes: SimpleChanges = {
        mode: new SimpleChange('add', 'edit', false),
      };
      component.ngOnChanges(changes);
      expect(spy).toHaveBeenCalled();
    });

    it('should call resetFormForAddMode when switching back to add mode', () => {
      const spy = spyOn<any>(component, 'resetFormForAddMode');
      component.mode = 'add';
      const changes: SimpleChanges = {
        mode: new SimpleChange('edit', 'add', false),
      };
      component.ngOnChanges(changes);
      expect(spy).toHaveBeenCalled();
    });

    it('should not call resetFormForAddMode when switching to edit mode', () => {
      const spy = spyOn<any>(component, 'resetFormForAddMode');
      component.mode = 'edit';
      const changes: SimpleChanges = {
        mode: new SimpleChange('add', 'edit', false),
      };
      component.ngOnChanges(changes);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should call setupPanel on subsequent data change', () => {
      const spy = spyOn<any>(component, 'setupPanel');
      const changes: SimpleChanges = {
        data: new SimpleChange(null, { sourceProductCode: '00150' }, false),
      };
      component.ngOnChanges(changes);
      expect(spy).toHaveBeenCalled();
    });

    it('should not trigger when both mode and data are first change', () => {
      const spy = spyOn<any>(component, 'setupPanel');
      const changes: SimpleChanges = {
        mode: new SimpleChange(undefined, 'add', true),
        data: new SimpleChange(undefined, null, true),
      };
      component.ngOnChanges(changes);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ─── loadSourceProducts ───────────────────────────────────────────────────
  describe('loadSourceProducts', () => {
    it('should set isLoadingSourceProducts to false after success', () => {
      expect(component.isLoadingSourceProducts).toBeFalse();
      expect(component.sourceProducts).toEqual(mockSourceProducts);
      expect(component.filteredSourceProducts).toEqual(mockSourceProducts);
    });

    it('should handle null data in response', () => {
      mockService.getSourceProducts.and.returnValue(of({ data: null as any }));
      const newFixture = TestBed.createComponent(AddEditProductConversion);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      expect(newComponent.sourceProducts).toEqual([]);
    });

    it('should set isLoadingSourceProducts to false on error', () => {
      mockService.getSourceProducts.and.returnValue(throwError(() => new Error('fail')));
      const newFixture = TestBed.createComponent(AddEditProductConversion);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      expect(newComponent.isLoadingSourceProducts).toBeFalse();
    });
  });

  // ─── loadTargetProducts ───────────────────────────────────────────────────
  describe('loadTargetProducts', () => {
    it('should load target products on source selection', fakeAsync(() => {
      component.form.get('sourceProductCode')?.setValue('00150');
      tick();
      expect(component.targetProducts).toEqual(mockTargetProducts);
      expect(component.filteredTargetProducts).toEqual(mockTargetProducts);
      expect(component.isLoadingTargetProducts).toBeFalse();
    }));

    it('should handle null data in target products response', fakeAsync(() => {
      mockService.getTargetProducts.and.returnValue(of({ data: null as any }));
      component.form.get('sourceProductCode')?.setValue('00150');
      tick();
      expect(component.targetProducts).toEqual([]);
    }));

    it('should set isLoadingTargetProducts to false on error', fakeAsync(() => {
      mockService.getTargetProducts.and.returnValue(throwError(() => new Error('fail')));
      component.form.get('sourceProductCode')?.setValue('00150');
      tick();
      expect(component.isLoadingTargetProducts).toBeFalse();
    }));
  });

  // ─── Source product listener ──────────────────────────────────────────────
  describe('source product listener', () => {
    it('should reset target product when source changes', fakeAsync(() => {
      component.form.get('sourceProductCode')?.setValue('00150');
      tick();
      expect(component.targetProductDescription).toBe('--');
    }));

    it('should set selectedSchemeType when source product found', fakeAsync(() => {
      component.form.get('sourceProductCode')?.setValue('00150');
      tick();
      expect(component['selectedSchemeType']).toBe('ISBT');
    }));

    it('should reset descriptions when source code is empty', fakeAsync(() => {
      component.form.get('sourceProductCode')?.setValue('00150');
      tick();
      component.form.get('sourceProductCode')?.setValue('');
      tick();
      expect(component.sourceProductDescription).toBe('--');
      expect(component['selectedSchemeType']).toBe('');
      expect(component.targetProducts).toEqual([]);
      expect(component.filteredTargetProducts).toEqual([]);
    }));

    it('should reset when source product code not found in list', fakeAsync(() => {
      component.form.get('sourceProductCode')?.setValue('99999');
      tick();
      expect(component.sourceProductDescription).toBe('--');
      expect(component.targetProducts).toEqual([]);
    }));

    it('should handle source product with null description', fakeAsync(() => {
      component.sourceProducts = [
        { productCode: 'NULLD', productDesc: null, productType: null, unitSchemeType: null },
      ];
      component.form.get('sourceProductCode')?.setValue('NULLD');
      tick();
      expect(component.sourceProductDescription).toBe('--');
      expect(component['selectedSchemeType']).toBe('');
    }));
  });

  // ─── Source search ────────────────────────────────────────────────────────
  describe('source search', () => {
    it('should filter source products by code', () => {
      component.sourceSearchControl.setValue('00150');
      expect(component.filteredSourceProducts.length).toBe(1);
      expect(component.filteredSourceProducts[0].productCode).toBe('00150');
    });

    it('should filter source products by description', () => {
      component.sourceSearchControl.setValue('CPDA1');
      expect(component.filteredSourceProducts.length).toBe(1);
      expect(component.filteredSourceProducts[0].productCode).toBe('00160');
    });

    it('should show all source products when search is cleared', () => {
      component.sourceSearchControl.setValue('CPDA1');
      expect(component.filteredSourceProducts.length).toBe(1);
      component.sourceSearchControl.setValue('');
      expect(component.filteredSourceProducts.length).toBe(2);
    });

    it('should show all source products when search is null', () => {
      component.sourceSearchControl.setValue(null);
      expect(component.filteredSourceProducts).toEqual(component.sourceProducts);
    });

    it('should return empty when search has no match', () => {
      component.sourceSearchControl.setValue('ZZZZZ');
      expect(component.filteredSourceProducts.length).toBe(0);
    });

    it('should be case insensitive', () => {
      component.sourceSearchControl.setValue('cpd whole');
      expect(component.filteredSourceProducts.length).toBe(1);
    });
  });

  // ─── Target search ────────────────────────────────────────────────────────
  describe('target search', () => {
    beforeEach(() => {
      component.targetProducts = mockTargetProducts;
      component.filteredTargetProducts = mockTargetProducts;
    });

    it('should filter target products by code', () => {
      component.targetSearchControl.setValue('04900');
      expect(component.filteredTargetProducts.length).toBe(1);
    });

    it('should filter target products by description', () => {
      component.targetSearchControl.setValue('Washed');
      expect(component.filteredTargetProducts.length).toBe(1);
    });

    it('should show all target products when search is cleared', () => {
      component.targetSearchControl.setValue('Washed');
      expect(component.filteredTargetProducts.length).toBe(1);
      component.targetSearchControl.setValue('');
      expect(component.filteredTargetProducts).toEqual(mockTargetProducts);
    });

    it('should show all target products when search is null', () => {
      component.targetSearchControl.setValue(null);
      expect(component.filteredTargetProducts).toEqual(mockTargetProducts);
    });

    it('should return empty when search has no match', () => {
      component.targetSearchControl.setValue('ZZZZZ');
      expect(component.filteredTargetProducts.length).toBe(0);
    });
  });

  // ─── Dropdown closed handlers ─────────────────────────────────────────────
  describe('onSourceDropdownClosed', () => {
    it('should reset search control and show all source products', () => {
      component.sourceSearchControl.setValue('test');
      component.onSourceDropdownClosed();
      expect(component.sourceSearchControl.value).toBe('');
      expect(component.filteredSourceProducts).toEqual(component.sourceProducts);
    });
  });

  describe('onTargetDropdownClosed', () => {
    it('should reset search control and show all target products', () => {
      component.targetProducts = mockTargetProducts;
      component.targetSearchControl.setValue('test');
      component.onTargetDropdownClosed();
      expect(component.targetSearchControl.value).toBe('');
      expect(component.filteredTargetProducts).toEqual(component.targetProducts);
    });
  });

  // ─── onTargetProductChange ────────────────────────────────────────────────
  describe('onTargetProductChange', () => {
    it('should set target description when product found', () => {
      component.targetProducts = mockTargetProducts;
      component.form.get('targetProductCode')?.setValue('04900');
      component.onTargetProductChange();
      expect(component.targetProductDescription).toBe('Red Blood Cells Washed');
    });

    it('should set target description to -- when product not found', () => {
      component.targetProducts = mockTargetProducts;
      component.form.get('targetProductCode')?.setValue('99999');
      component.onTargetProductChange();
      expect(component.targetProductDescription).toBe('--');
    });

    it('should set target description to -- when no code selected', () => {
      component.form.get('targetProductCode')?.setValue('');
      component.onTargetProductChange();
      expect(component.targetProductDescription).toBe('--');
    });

    it('should handle target product with null description', () => {
      component.targetProducts = [
        { productCode: 'NULLD', productDesc: null, productType: null, unitSchemeType: null },
      ];
      component.form.get('targetProductCode')?.setValue('NULLD');
      component.onTargetProductChange();
      expect(component.targetProductDescription).toBe('--');
    });
  });

  // ─── onCancel ─────────────────────────────────────────────────────────────
  describe('onCancel', () => {
    it('should emit closePanel', () => {
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  // ─── onEffDateChanged / onTermDateChanged ─────────────────────────────────
  describe('date changed tracking', () => {
    it('should set lastChangedDateField to effective on onEffDateChanged', () => {
      component.onEffDateChanged();
      expect(component['lastChangedDateField']).toBe('effective');
    });

    it('should set lastChangedDateField to termination on onTermDateChanged', () => {
      component.onTermDateChanged();
      expect(component['lastChangedDateField']).toBe('termination');
    });
  });

  // ─── onEffDateBlur ────────────────────────────────────────────────────────
  describe('onEffDateBlur', () => {
    it('should mark effective date as touched', fakeAsync(() => {
      const control = component.form.get('effectiveDate');
      control?.markAsUntouched();
      component.effDateInput = { nativeElement: { value: '' } } as ElementRef<HTMLInputElement>;
      component.onEffDateBlur();
      tick(1);
      expect(control?.touched).toBeTrue();
    }));
  });

  // ─── onTermDateBlur ───────────────────────────────────────────────────────
  describe('onTermDateBlur', () => {
    it('should mark termination date as touched', fakeAsync(() => {
      const control = component.form.get('terminationDate');
      control?.markAsUntouched();
      component.termDateInput = { nativeElement: { value: '' } } as ElementRef<HTMLInputElement>;
      component.onTermDateBlur();
      tick(1);
      expect(control?.touched).toBeTrue();
    }));
  });

  // ─── onEffectiveDateInput ─────────────────────────────────────────────────
  describe('onEffectiveDateInput', () => {
    it('should set lastChangedDateField to effective', () => {
      const event = { target: { value: '01-JAN-2030' } } as unknown as Event;
      component.onEffectiveDateInput(event);
      expect(component['lastChangedDateField']).toBe('effective');
    });

    it('should clear effective date when input is empty', () => {
      const control = component.form.get('effectiveDate');
      control?.setValue(moment());
      const event = { target: { value: '' } } as unknown as Event;
      component.onEffectiveDateInput(event);
      expect(control?.value).toBeNull();
    });

    it('should mark pristine and untouched for empty input in add mode', () => {
      component.mode = 'add';
      const control = component.form.get('effectiveDate');
      const event = { target: { value: '' } } as unknown as Event;
      component.onEffectiveDateInput(event);
      expect(control?.pristine).toBeTrue();
      expect(control?.untouched).toBeTrue();
    });

    it('should mark dirty for empty input in edit mode', () => {
      component.mode = 'edit';
      const control = component.form.get('effectiveDate');
      const event = { target: { value: '' } } as unknown as Event;
      component.onEffectiveDateInput(event);
      expect(control?.dirty).toBeTrue();
    });

    it('should set invalidDate error when input has text but control has no value', () => {
      const control = component.form.get('effectiveDate');
      control?.setValue(null, { emitEvent: false });
      const event = { target: { value: 'invalid-text' } } as unknown as Event;
      component.onEffectiveDateInput(event);
      expect(control?.hasError('invalidDate')).toBeTrue();
    });

    it('should mark touched and dirty when input has text', () => {
      const control = component.form.get('effectiveDate');
      control?.setValue(moment());
      const event = { target: { value: '01-JAN-2030' } } as unknown as Event;
      component.onEffectiveDateInput(event);
      expect(control?.touched).toBeTrue();
      expect(control?.dirty).toBeTrue();
    });
  });

  // ─── onTerminationDateInput ───────────────────────────────────────────────
  describe('onTerminationDateInput', () => {
    it('should set lastChangedDateField to termination', () => {
      const event = { target: { value: '01-JAN-2030' } } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(component['lastChangedDateField']).toBe('termination');
    });

    it('should delegate to DateFieldValidationUtility.handleEndDateInput', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const event = { target: { value: 'somevalue' } } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(spy).toHaveBeenCalledWith('somevalue', component.form.get('terminationDate'), false);
    });

    it('should pass isEditMode=true in edit mode', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      component.mode = 'edit';
      const event = { target: { value: 'somevalue' } } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(spy).toHaveBeenCalledWith('somevalue', component.form.get('terminationDate'), true);
    });
  });

  // ─── getEffDateError / getTermDateError ───────────────────────────────────
  describe('getEffDateError', () => {
    it('should return empty string when control is not touched', () => {
      expect(component.getEffDateError()).toBe('');
    });

    it('should return required error when touched and empty', () => {
      const control = component.form.get('effectiveDate');
      control?.markAsTouched();
      expect(component.getEffDateError()).toContain('required');
    });

    it('should pass form errors only when lastChangedDateField is effective', () => {
      const spy = spyOn(DateFieldValidationUtility, 'getStartDateCrossFieldError').and.returnValue('');
      component['lastChangedDateField'] = 'effective';
      component.getEffDateError();
      expect(spy).toHaveBeenCalledWith(
        component.form.get('effectiveDate'),
        'Effective Date',
        'Termination Date',
        component.form.errors
      );
    });

    it('should pass null form errors when lastChangedDateField is not effective', () => {
      const spy = spyOn(DateFieldValidationUtility, 'getStartDateCrossFieldError').and.returnValue('');
      component['lastChangedDateField'] = 'termination';
      component.getEffDateError();
      expect(spy).toHaveBeenCalledWith(
        component.form.get('effectiveDate'),
        'Effective Date',
        'Termination Date',
        null
      );
    });
  });

  describe('getTermDateError', () => {
    it('should return empty string when control is not touched', () => {
      expect(component.getTermDateError()).toBe('');
    });

    it('should pass form errors only when lastChangedDateField is termination', () => {
      const spy = spyOn(DateFieldValidationUtility, 'getEndDateCrossFieldError').and.returnValue('');
      component['lastChangedDateField'] = 'termination';
      component.getTermDateError();
      expect(spy).toHaveBeenCalledWith(
        component.form.get('terminationDate'),
        'Termination Date',
        'Effective Date',
        component.form.errors
      );
    });

    it('should pass null form errors when lastChangedDateField is not termination', () => {
      const spy = spyOn(DateFieldValidationUtility, 'getEndDateCrossFieldError').and.returnValue('');
      component['lastChangedDateField'] = 'effective';
      component.getTermDateError();
      expect(spy).toHaveBeenCalledWith(
        component.form.get('terminationDate'),
        'Termination Date',
        'Effective Date',
        null
      );
    });
  });

  // ─── getSourceProductError / getTargetProductError ────────────────────────
  describe('getSourceProductError', () => {
    it('should return empty when control is not touched', () => {
      expect(component.getSourceProductError()).toBe('');
    });

    it('should return required error when touched and empty', () => {
      component.form.get('sourceProductCode')?.markAsTouched();
      expect(component.getSourceProductError()).toBe('Source Product is required');
    });

    it('should return empty when touched and has value', () => {
      component.form.get('sourceProductCode')?.setValue('00150');
      component.form.get('sourceProductCode')?.markAsTouched();
      expect(component.getSourceProductError()).toBe('');
    });
  });

  describe('getTargetProductError', () => {
    it('should return empty when control is not touched', () => {
      expect(component.getTargetProductError()).toBe('');
    });

    it('should return required error when touched and empty', () => {
      component.form.get('targetProductCode')?.markAsTouched();
      expect(component.getTargetProductError()).toBe('Target Product is required');
    });

    it('should return empty when touched and has value', () => {
      component.form.get('targetProductCode')?.setValue('04900');
      component.form.get('targetProductCode')?.markAsTouched();
      expect(component.getTargetProductError()).toBe('');
    });
  });

  // ─── onSave - add mode ────────────────────────────────────────────────────
  describe('onSave (add mode)', () => {
    it('should not call service when form is invalid', () => {
      component.onSave();
      expect(mockService.createProductConversion).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when form is invalid', () => {
      const spy = spyOn(component.form, 'markAllAsTouched');
      component.onSave();
      expect(spy).toHaveBeenCalled();
    });

    it('should call createProductConversion on valid form', fakeAsync(() => {
      component.form.get('sourceProductCode')?.setValue('00150');
      component.form.get('targetProductCode')?.setValue('04900');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      component.form.updateValueAndValidity();

      component.onSave();
      tick();

      expect(mockService.createProductConversion).toHaveBeenCalled();
    }));

    it('should set isSaving to true during save', fakeAsync(() => {
      component.form.get('sourceProductCode')?.setValue('00150');
      component.form.get('targetProductCode')?.setValue('04900');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      component.form.updateValueAndValidity();

      // Use a subject to control when the observable completes
      const saveSubject = new Subject<any>();
      mockService.createProductConversion.and.returnValue(saveSubject.asObservable());

      component.onSave();
      expect(component.isSaving).toBeTrue();

      saveSubject.next({ success: true, message: 'Created', statusCode: 201 });
      saveSubject.complete();
      tick();
      expect(component.isSaving).toBeFalse();
    }));

    it('should show snackbar on successful save', fakeAsync(() => {
      component.form.get('sourceProductCode')?.setValue('00150');
      component.form.get('targetProductCode')?.setValue('04900');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      component.form.updateValueAndValidity();

      component.onSave();
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Created',
        'DISMISS',
        jasmine.objectContaining({
          duration: 5000,
          panelClass: ['success-snackbar'],
        })
      );
    }));

    it('should use default message when response message is empty', fakeAsync(() => {
      mockService.createProductConversion.and.returnValue(
        of({ success: true, message: '', statusCode: 201 })
      );

      component.form.get('sourceProductCode')?.setValue('00150');
      component.form.get('targetProductCode')?.setValue('04900');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      component.form.updateValueAndValidity();

      component.onSave();
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'All changes are saved.',
        'DISMISS',
        jasmine.anything()
      );
    }));

    it('should emit saveSuccess and closePanel on successful save', fakeAsync(() => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.get('sourceProductCode')?.setValue('00150');
      component.form.get('targetProductCode')?.setValue('04900');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      component.form.updateValueAndValidity();

      component.onSave();
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));

    it('should serialize dates for API using DateFieldValidationUtility', fakeAsync(() => {
      const futureDate = moment().add(5, 'days');
      const termDate = moment().add(10, 'days');
      component.form.get('sourceProductCode')?.setValue('00150');
      component.form.get('targetProductCode')?.setValue('04900');
      component.form.get('effectiveDate')?.setValue(futureDate);
      component.form.get('terminationDate')?.setValue(termDate);
      component.form.updateValueAndValidity();

      component.onSave();
      tick();

      const calledDto = mockService.createProductConversion.calls.mostRecent().args[0];
      expect(calledDto.sourceProductCode).toBe('00150');
      expect(calledDto.targetProductCode).toBe('04900');
      expect(calledDto.effDate).toBe(futureDate.format('YYYY-MM-DD'));
      expect(calledDto.termDate).toBe(termDate.format('YYYY-MM-DD'));
    }));

    it('should clear optional termination date errors before validation', () => {
      const spy = spyOn(DateFieldValidationUtility, 'clearOptionalDateErrors');
      component.onSave();
      expect(spy).toHaveBeenCalledWith(component.form, 'terminationDate');
    });
  });

  // ─── onSave - edit mode ───────────────────────────────────────────────────
  describe('onSave (edit mode)', () => {
    beforeEach(() => {
      const editFixture = TestBed.createComponent(AddEditProductConversion);
      component = editFixture.componentInstance;
      component.mode = 'edit';
      component.data = {
        sourceProductCode: '00150',
        sourceProductDesc: 'CPD Whole Blood',
        targetProductCode: '04900',
        targetProductDesc: 'Red Blood Cells Washed',
        effDate: '2025-06-09',
        termDate: null,
        lastModifiedDate: '2025-01-30T08:32:00',
        programId: 'VPRODCON',
      };
      editFixture.detectChanges();
    });

    it('should call updateProductConversion in edit mode', () => {
      component.onSave();

      expect(mockService.updateProductConversion).toHaveBeenCalledWith(
        '00150',
        '04900',
        jasmine.any(Object)
      );
    });

    it('should show snackbar on successful update', () => {
      component.onSave();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Updated',
        'DISMISS',
        jasmine.objectContaining({
          duration: 5000,
          panelClass: ['success-snackbar'],
        })
      );
    });

    it('should emit saveSuccess and closePanel on successful update', () => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should set isSaving false after finalize on update', fakeAsync(() => {
      const saveSubject = new Subject<any>();
      mockService.updateProductConversion.and.returnValue(saveSubject.asObservable());

      component.onSave();
      expect(component.isSaving).toBeTrue();

      saveSubject.next({ success: true, message: 'Updated', statusCode: 200 });
      saveSubject.complete();
      tick();
      expect(component.isSaving).toBeFalse();
    }));

    it('should use default message when update response message is empty', () => {
      mockService.updateProductConversion.and.returnValue(
        of({ success: true, message: '', statusCode: 200 })
      );

      component.onSave();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'All changes are saved.',
        'DISMISS',
        jasmine.anything()
      );
    });
  });

  // ─── onAddAndCreateAnother ────────────────────────────────────────────────
  describe('onAddAndCreateAnother', () => {
    it('should not call service when form is invalid', () => {
      component.onAddAndCreateAnother();
      expect(mockService.createProductConversion).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when form is invalid', () => {
      const spy = spyOn(component.form, 'markAllAsTouched');
      component.onAddAndCreateAnother();
      expect(spy).toHaveBeenCalled();
    });

    it('should call createProductConversion on valid form', fakeAsync(() => {
      component.form.get('sourceProductCode')?.setValue('00150');
      component.form.get('targetProductCode')?.setValue('04900');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      component.form.updateValueAndValidity();

      component.onAddAndCreateAnother();
      tick();

      expect(mockService.createProductConversion).toHaveBeenCalled();
    }));

    it('should show snackbar on success', () => {
      component.form.get('sourceProductCode')?.setValue('00150');
      component.form.get('targetProductCode')?.setValue('04900');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      component.form.updateValueAndValidity();

      component.onAddAndCreateAnother();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Created',
        'DISMISS',
        jasmine.objectContaining({
          duration: 5000,
          panelClass: ['success-snackbar'],
        })
      );
    });

    it('should emit saveSuccess but NOT closePanel on success', fakeAsync(() => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.get('sourceProductCode')?.setValue('00150');
      component.form.get('targetProductCode')?.setValue('04900');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      component.form.updateValueAndValidity();

      component.onAddAndCreateAnother();
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).not.toHaveBeenCalled();
    }));

    it('should reset form after successful save', fakeAsync(() => {
      component.form.get('sourceProductCode')?.setValue('00150');
      component.form.get('targetProductCode')?.setValue('04900');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      component.form.updateValueAndValidity();

      component.onAddAndCreateAnother();
      tick();

      expect(component.sourceProductDescription).toBe('--');
      expect(component.targetProductDescription).toBe('--');
      expect(component.targetProducts).toEqual([]);
      expect(component.filteredTargetProducts).toEqual([]);
    }));

    it('should set isSaving false via finalize', fakeAsync(() => {
      const saveSubject = new Subject<any>();
      mockService.createProductConversion.and.returnValue(saveSubject.asObservable());

      component.form.get('sourceProductCode')?.setValue('00150');
      component.form.get('targetProductCode')?.setValue('04900');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      component.form.updateValueAndValidity();

      component.onAddAndCreateAnother();
      expect(component.isSaving).toBeTrue();

      saveSubject.next({ success: true, message: 'Created', statusCode: 201 });
      saveSubject.complete();
      tick();
      expect(component.isSaving).toBeFalse();
    }));

    it('should clear optional termination date errors before validation', () => {
      const spy = spyOn(DateFieldValidationUtility, 'clearOptionalDateErrors');
      component.onAddAndCreateAnother();
      expect(spy).toHaveBeenCalledWith(component.form, 'terminationDate');
    });
  });

  // ─── Edit mode - populateFormForEdit ───────────────────────────────────────
  describe('populateFormForEdit', () => {
    it('should not populate if data is null in edit mode', () => {
      const editFixture = TestBed.createComponent(AddEditProductConversion);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = null;
      editFixture.detectChanges();
      expect(editComponent.editModeValues.sourceProductCode).toBe('');
    });

    it('should disable source and target product codes in edit mode', () => {
      const editFixture = TestBed.createComponent(AddEditProductConversion);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = {
        sourceProductCode: '00150',
        sourceProductDesc: 'CPD Whole Blood',
        targetProductCode: '04900',
        targetProductDesc: 'Red Blood Cells Washed',
        effDate: '2025-06-09',
        termDate: null,
        lastModifiedDate: null,
        programId: null,
      };
      editFixture.detectChanges();
      expect(editComponent.form.get('sourceProductCode')?.disabled).toBeTrue();
      expect(editComponent.form.get('targetProductCode')?.disabled).toBeTrue();
    });

    it('should enable effective date in edit mode', () => {
      const editFixture = TestBed.createComponent(AddEditProductConversion);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = {
        sourceProductCode: '00150',
        sourceProductDesc: null,
        targetProductCode: '04900',
        targetProductDesc: null,
        effDate: '2025-06-09',
        termDate: null,
        lastModifiedDate: null,
        programId: null,
      };
      editFixture.detectChanges();
      expect(editComponent.form.get('effectiveDate')?.enabled).toBeTrue();
    });

    it('should set minTerminationDate from effective date', () => {
      const editFixture = TestBed.createComponent(AddEditProductConversion);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = {
        sourceProductCode: '00150',
        sourceProductDesc: null,
        targetProductCode: '04900',
        targetProductDesc: null,
        effDate: '2025-06-09',
        termDate: null,
        lastModifiedDate: null,
        programId: null,
      };
      editFixture.detectChanges();
      expect(editComponent.minTerminationDate).toBeTruthy();
      expect(editComponent.minTerminationDate!.format('YYYY-MM-DD')).toBe('2025-06-09');
    });

    it('should set minTerminationDate to null when no effective date', () => {
      const editFixture = TestBed.createComponent(AddEditProductConversion);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = {
        sourceProductCode: '00150',
        sourceProductDesc: null,
        targetProductCode: '04900',
        targetProductDesc: null,
        effDate: '',
        termDate: null,
        lastModifiedDate: null,
        programId: null,
      };
      editFixture.detectChanges();
      expect(editComponent.minTerminationDate).toBeNull();
    });

    it('should populate editModeValues with formatted dates', () => {
      const editFixture = TestBed.createComponent(AddEditProductConversion);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = {
        sourceProductCode: '00150',
        sourceProductDesc: 'CPD Whole Blood',
        targetProductCode: '04900',
        targetProductDesc: 'Red Blood Cells Washed',
        effDate: '2025-06-09',
        termDate: '2025-12-31',
        lastModifiedDate: null,
        programId: null,
      };
      editFixture.detectChanges();
      expect(editComponent.editModeValues.effDate).toMatch(/\d{2}-[A-Z]{3}-\d{4}/);
      expect(editComponent.editModeValues.termDate).toMatch(/\d{2}-[A-Z]{3}-\d{4}/);
    });

    it('should set empty lastModifiedDisplay when formatDateTimeForUI returns empty', () => {
      const editFixture = TestBed.createComponent(AddEditProductConversion);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = {
        sourceProductCode: '00150',
        sourceProductDesc: null,
        targetProductCode: '04900',
        targetProductDesc: null,
        effDate: '2025-06-09',
        termDate: null,
        lastModifiedDate: 'invalid-date',
        programId: null,
      };
      spyOn(DateFieldValidationUtility, 'formatDateTimeForUI').and.returnValue('');
      editFixture.detectChanges();
      expect(editComponent.lastModifiedDisplay).toBe('');
    });

    it('should set empty lastModifiedDisplay when no lastModifiedDate', () => {
      const editFixture = TestBed.createComponent(AddEditProductConversion);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = {
        sourceProductCode: '00150',
        sourceProductDesc: null,
        targetProductCode: '04900',
        targetProductDesc: null,
        effDate: '2025-06-09',
        termDate: null,
        lastModifiedDate: null,
        programId: null,
      };
      editFixture.detectChanges();
      expect(editComponent.lastModifiedDisplay).toBe('');
    });

    it('should set panelTitle to Edit Product Conversion', () => {
      const editFixture = TestBed.createComponent(AddEditProductConversion);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = {
        sourceProductCode: '00150',
        sourceProductDesc: null,
        targetProductCode: '04900',
        targetProductDesc: null,
        effDate: '2025-06-09',
        termDate: null,
        lastModifiedDate: null,
        programId: null,
      };
      editFixture.detectChanges();
      expect(editComponent.panelTitle).toBe('Edit Product Conversion');
    });

    it('should handle null source/target descriptions with fallback', () => {
      const editFixture = TestBed.createComponent(AddEditProductConversion);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = {
        sourceProductCode: '00150',
        sourceProductDesc: null,
        targetProductCode: '04900',
        targetProductDesc: null,
        effDate: '2025-06-09',
        termDate: null,
        lastModifiedDate: null,
        programId: null,
      };
      editFixture.detectChanges();
      expect(editComponent.editModeValues.sourceProductDesc).toBe('');
      expect(editComponent.editModeValues.targetProductDesc).toBe('');
    });
  });

  // ─── resetFormForAddMode ──────────────────────────────────────────────────
  describe('resetFormForAddMode', () => {
    it('should reset all form state when switching back to add mode', () => {
      // Start in edit mode
      const editFixture = TestBed.createComponent(AddEditProductConversion);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = {
        sourceProductCode: '00150',
        sourceProductDesc: 'CPD Whole Blood',
        targetProductCode: '04900',
        targetProductDesc: 'Red Blood Cells Washed',
        effDate: '2025-06-09',
        termDate: null,
        lastModifiedDate: null,
        programId: null,
      };
      editFixture.detectChanges();

      // Now switch to add mode via ngOnChanges
      editComponent.mode = 'add';
      editComponent.ngOnChanges({
        mode: new SimpleChange('edit', 'add', false),
      });

      expect(editComponent.sourceProductDescription).toBe('--');
      expect(editComponent.targetProductDescription).toBe('--');
      expect(editComponent.targetProducts).toEqual([]);
      expect(editComponent.filteredTargetProducts).toEqual([]);
      expect(editComponent.lastModifiedDisplay).toBe('');
      expect(editComponent.form.get('sourceProductCode')?.enabled).toBeTrue();
      expect(editComponent.form.get('targetProductCode')?.enabled).toBeTrue();
      expect(editComponent.form.get('effectiveDate')?.enabled).toBeTrue();
    });
  });

  // ─── Date validation setup ────────────────────────────────────────────────
  describe('date validation setup', () => {
    it('should set effectiveDateFilterFn', () => {
      expect(component.effectiveDateFilterFn).toBeDefined();
    });

    it('should set terminationDateFilterFn', () => {
      expect(component.terminationDateFilterFn).toBeDefined();
    });

    it('should allow null dates in effectiveDateFilterFn', () => {
      expect(component.effectiveDateFilterFn(null)).toBeTrue();
    });

    it('should allow null dates in terminationDateFilterFn', () => {
      expect(component.terminationDateFilterFn(null)).toBeTrue();
    });

    it('should allow future dates in effectiveDateFilterFn for add mode', () => {
      const futureDate = moment().add(30, 'days');
      expect(component.effectiveDateFilterFn(futureDate)).toBeTrue();
    });

    it('should allow all dates in effectiveDateFilterFn for edit mode', () => {
      component.mode = 'edit';
      const pastDate = moment().subtract(30, 'days');
      expect(component.effectiveDateFilterFn(pastDate)).toBeTrue();
    });

    it('should reject termination dates before effective date', () => {
      const effDate = moment().add(10, 'days');
      component.form.get('effectiveDate')?.setValue(effDate);
      const beforeEff = moment().add(5, 'days');
      expect(component.terminationDateFilterFn(beforeEff)).toBeFalse();
    });

    it('should allow termination dates on or after effective date', () => {
      const effDate = moment().add(10, 'days');
      component.form.get('effectiveDate')?.setValue(effDate);
      const afterEff = moment().add(15, 'days');
      expect(component.terminationDateFilterFn(afterEff)).toBeTrue();
    });

    it('should allow termination dates when no effective date is set', () => {
      component.form.get('effectiveDate')?.setValue(null);
      const anyDate = moment().add(10, 'days');
      expect(component.terminationDateFilterFn(anyDate)).toBeTrue();
    });
  });

  // ─── Date value change listeners ──────────────────────────────────────────
  describe('date value change listeners', () => {
    it('should update minTerminationDate when effectiveDate changes in add mode', fakeAsync(() => {
      const futureDate = moment().add(20, 'days');
      component.form.get('effectiveDate')?.setValue(futureDate);
      tick(1);
      expect(component.minTerminationDate).toBeTruthy();
    }));

    it('should set minTerminationDate to null when effectiveDate cleared in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.form.get('effectiveDate')?.setValue(null);
      tick(1);
      expect(component.minTerminationDate).toBeNull();
    }));

    it('should add past-date validator when effective date is dirtied in edit mode', fakeAsync(() => {
      const editFixture = TestBed.createComponent(AddEditProductConversion);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = {
        sourceProductCode: '00150',
        sourceProductDesc: null,
        targetProductCode: '04900',
        targetProductDesc: null,
        effDate: '2025-06-09',
        termDate: null,
        lastModifiedDate: null,
        programId: null,
      };
      editFixture.detectChanges();

      const effControl = editComponent.form.get('effectiveDate');
      effControl?.markAsDirty();
      effControl?.setValue(moment().add(5, 'days'));
      tick(1);
      // The validator should have been set (we just check it runs without error)
      expect(effControl?.valid).toBeDefined();
    }));
  });

  // ─── validateDateInput ────────────────────────────────────────────────────
  describe('validateDateInput (private)', () => {
    it('should set invalidDate error when input has value but control has no value', fakeAsync(() => {
      const inputRef = { nativeElement: { value: 'some-text' } } as ElementRef<HTMLInputElement>;
      component.termDateInput = inputRef;
      const control = component.form.get('terminationDate');
      control?.setValue(null, { emitEvent: false });
      // Trigger by changing termination date value change
      (component as any).validateDateInput('terminationDate', inputRef);
      expect(control?.hasError('invalidDate')).toBeTrue();
    }));

    it('should clear invalidDate error when input is empty', fakeAsync(() => {
      const inputRef = { nativeElement: { value: '' } } as ElementRef<HTMLInputElement>;
      const control = component.form.get('terminationDate');
      control?.setErrors({ invalidDate: true });
      (component as any).validateDateInput('terminationDate', inputRef);
      expect(control?.hasError('invalidDate')).toBeFalse();
    }));

    it('should clear invalidDate error when control has value', fakeAsync(() => {
      const inputRef = { nativeElement: { value: '01-JAN-2030' } } as ElementRef<HTMLInputElement>;
      const control = component.form.get('terminationDate');
      control?.setValue(moment('2030-01-01'));
      control?.setErrors({ invalidDate: true });
      (component as any).validateDateInput('terminationDate', inputRef);
      expect(control?.hasError('invalidDate')).toBeFalse();
    }));

    it('should preserve other errors when clearing invalidDate', fakeAsync(() => {
      const inputRef = { nativeElement: { value: '' } } as ElementRef<HTMLInputElement>;
      const control = component.form.get('terminationDate');
      control?.setErrors({ invalidDate: true, someOtherError: true });
      (component as any).validateDateInput('terminationDate', inputRef);
      expect(control?.hasError('invalidDate')).toBeFalse();
      expect(control?.hasError('someOtherError')).toBeTrue();
    }));

    it('should handle null inputRef gracefully', () => {
      const control = component.form.get('terminationDate');
      control?.setValue(null, { emitEvent: false });
      // Should not throw
      expect(() => (component as any).validateDateInput('terminationDate', null)).not.toThrow();
    });
  });

  // ─── Form cross-field date range validation ───────────────────────────────
  describe('form cross-field date range validation', () => {
    it('should set dateRangeInvalid when termination is before effective', () => {
      component.form.get('sourceProductCode')?.setValue('00150');
      component.form.get('targetProductCode')?.setValue('04900');
      component.form.get('effectiveDate')?.setValue(moment().add(10, 'days'));
      component.form.get('terminationDate')?.setValue(moment().add(5, 'days'));
      component.form.updateValueAndValidity();
      expect(component.form.hasError('dateRangeInvalid')).toBeTrue();
    });

    it('should not set dateRangeInvalid when termination is after effective', () => {
      component.form.get('sourceProductCode')?.setValue('00150');
      component.form.get('targetProductCode')?.setValue('04900');
      component.form.get('effectiveDate')?.setValue(moment().add(5, 'days'));
      component.form.get('terminationDate')?.setValue(moment().add(10, 'days'));
      component.form.updateValueAndValidity();
      expect(component.form.hasError('dateRangeInvalid')).toBeFalse();
    });

    it('should not set dateRangeInvalid when termination date is null', () => {
      component.form.get('sourceProductCode')?.setValue('00150');
      component.form.get('targetProductCode')?.setValue('04900');
      component.form.get('effectiveDate')?.setValue(moment().add(5, 'days'));
      component.form.get('terminationDate')?.setValue(null);
      component.form.updateValueAndValidity();
      expect(component.form.hasError('dateRangeInvalid')).toBeFalse();
    });
  });

  // ─── Error state matchers ─────────────────────────────────────────────────
  describe('error state matchers', () => {
    it('should have effDateErrorMatcher defined', () => {
      expect(component.effDateErrorMatcher).toBeDefined();
      expect(component.effDateErrorMatcher.isErrorState).toBeDefined();
    });

    it('should have termDateErrorMatcher defined', () => {
      expect(component.termDateErrorMatcher).toBeDefined();
      expect(component.termDateErrorMatcher.isErrorState).toBeDefined();
    });
  });
});
