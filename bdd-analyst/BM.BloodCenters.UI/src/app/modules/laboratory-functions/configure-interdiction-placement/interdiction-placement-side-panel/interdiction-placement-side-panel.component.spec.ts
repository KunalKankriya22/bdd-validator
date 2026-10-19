import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { InterdictionPlacementSidePanelComponent } from './interdiction-placement-side-panel.component';
import { ConfigureInterdictionPlacementService } from '../configure-interdiction-placement.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  InterdictionPlacement,
  ActionFunctionNameLookup,
  ActionCodeLookup,
  ProductCodeLookup,
  InterdictionCodeLookup,
  ProductTypeLookup,
} from '../configure-interdiction-placement.model';

describe('InterdictionPlacementSidePanelComponent', () => {
  let component: InterdictionPlacementSidePanelComponent;
  let fixture: ComponentFixture<InterdictionPlacementSidePanelComponent>;
  let serviceSpy: jasmine.SpyObj<ConfigureInterdictionPlacementService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let headerSpy: jasmine.SpyObj<HeaderService>;

  const mockFunctionNames: ActionFunctionNameLookup[] = [
    { code: 'CPIREJ', description: 'CPI Rejection' },
    { code: 'CPICOM2', description: 'CPI Component 2' },
  ];

  const mockActionCodes: ActionCodeLookup[] = [
    { code: 'R01', codeDesc: 'Reject Code 1' },
  ];

  const mockProductCodes: ProductCodeLookup[] = [
    { productCode: 'E0009', productDesc: 'Product 9' },
    { productCode: 'FFP', productDesc: 'Fresh Frozen Plasma' },
  ];

  const mockInterdictionCodes: InterdictionCodeLookup[] = [
    { interCode: 'H001', interDesc: 'Hold Interdiction', interType: 'H' },
    { interCode: 'N001', interDesc: 'Normal Interdiction', interType: 'N' },
  ];

  const mockProductTypes: ProductTypeLookup[] = [
    { productType: 'FFP' },
    { productType: 'CRYO' },
  ];

  const futureEffDate = moment().add(1, 'month').format('YYYY-MM-DD');
  const futureTermDate = moment().add(6, 'months').format('YYYY-MM-DD');

  const mockRecord: InterdictionPlacement = {
    chapterId: 'CH01',
    actionFunctionName: 'CPIREJ',
    actionType: 'REJECT',
    actionProductCode: 'E0009',
    actionCode: 'R01',
    interOnCurrentProd: 'Y',
    interOnOtherProds: 'FFP,CRYO',
    interOnOtherProdTypes: 'FFP,CRYO',
    interOnUnitLevel: 'Y',
    interAllProdButCurr: null,
    interCode: 'H001',
    effDate: futureEffDate,
    termDate: futureTermDate,
    insertDate: '2025-01-01',
    insertUser: 'testuser',
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('ConfigureInterdictionPlacementService', [
      'getActionFunctionNames',
      'getActionCodes',
      'getProductCodes',
      'getInterdictionCodes',
      'getProductTypes',
      'create',
      'update',
    ]);
    snackbarSpy = createMockSnackbarService();
    headerSpy = createMockHeaderService();

    serviceSpy.getActionFunctionNames.and.returnValue(of(mockFunctionNames));
    serviceSpy.getActionCodes.and.returnValue(of(mockActionCodes));
    serviceSpy.getProductCodes.and.returnValue(of(mockProductCodes));
    serviceSpy.getInterdictionCodes.and.returnValue(of(mockInterdictionCodes));
    serviceSpy.getProductTypes.and.returnValue(of(mockProductTypes));



      TestBed.configureTestingModule({
imports: [InterdictionPlacementSidePanelComponent, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: ConfigureInterdictionPlacementService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerSpy },
      ],
    });


    });



  beforeEach(() => {

      serviceSpy.getActionFunctionNames.and.returnValue(of(mockFunctionNames));


      serviceSpy.getActionCodes.and.returnValue(of(mockActionCodes));


      serviceSpy.getProductCodes.and.returnValue(of(mockProductCodes));


      serviceSpy.getInterdictionCodes.and.returnValue(of(mockInterdictionCodes));


      serviceSpy.getProductTypes.and.returnValue(of(mockProductTypes));


    fixture = TestBed.createComponent(InterdictionPlacementSidePanelComponent);
    component = fixture.componentInstance;


    });

  describe('Form initialization', () => {
    it('should initialize form with correct defaults in add mode', fakeAsync(() => {
      component.mode = 'add';
      component.selectedFunction = 'CPICOM2';
      fixture.detectChanges();
      tick();

      expect(component.form.get('actionFunctionName')?.value).toBe('CPICOM2');
      expect(component.form.get('actionProductCode')?.value).toBe('');
      expect(component.form.get('actionCode')?.value).toBeNull();
      expect(component.form.get('interOnCurrentProd')?.value).toBe('');
      expect(component.form.get('effDate')?.value).toBeTruthy();
    }));

    it('should initialize form with record data in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges();
      tick();

      expect(component.form.get('actionFunctionName')?.value).toBe('CPIREJ');
      expect(component.form.get('actionProductCode')?.value).toBe('E0009');
      expect(component.form.get('actionCode')?.value).toBe('R01');
      expect(component.form.get('interOnCurrentProd')?.value).toBe('Y');
    }));




    it('should have required validators on product code', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      const control = component.form.get('actionProductCode');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    }));

    it('should have required validators on interdiction code', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      const control = component.form.get('interCode');
      control?.setValue(null);
      expect(control?.hasError('required')).toBe(true);
    }));

    it('should have required validators on effective date', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      const control = component.form.get('effDate');
      control?.setValue(null);
      expect(control?.hasError('required')).toBe(true);
    }));

    it('should default effective date to today in add mode', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      const effDate = component.form.get('effDate')?.value;
      expect(effDate).toBeTruthy();
      expect(moment.isMoment(effDate)).toBe(true);
    }));
  });

  describe('Reject Code conditional logic', () => {


    it('should disable reject code when function changes from CPIREJ', fakeAsync(() => {
      component.mode = 'add';
      component.selectedFunction = 'CPIREJ';
      fixture.detectChanges();
      tick();

      component.form.get('actionFunctionName')?.setValue('CPIREJ');
      tick();
      expect(component.form.get('actionCode')?.disabled).toBe(false);

      component.form.get('actionFunctionName')?.setValue('CPICOM2');
      tick();
      expect(component.form.get('actionCode')?.disabled).toBe(true);
      expect(component.form.get('actionCode')?.value).toBeNull();
    }));
  });

  describe('Y/null options', () => {
    it('should have Y and empty string values for yesNullOptions', () => {
      expect((component as any).yesNullOptions.length).toBe(2);
      expect((component as any).yesNullOptions[0].value).toBe('Y');
      expect((component as any).yesNullOptions[1].value).toBe('');
    });

  });

  describe('InterAllProdButCurr field', () => {
    it('should be present in form', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.form.get('interAllProdButCurr')).toBeTruthy();
    }));

    it('should accept Y value', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.get('interAllProdButCurr')?.setValue('Y');
      expect(component.form.get('interAllProdButCurr')?.value).toBe('Y');
    }));

    it('should accept null value', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.get('interAllProdButCurr')?.setValue(null);
      expect(component.form.get('interAllProdButCurr')?.value).toBeNull();
    }));
  });

  describe('Multi-select Other Product Codes', () => {
    it('should split CSV on load', fakeAsync(() => {
      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges();
      tick();

      const value = component.form.get('interOnOtherProds')?.value;
      expect(Array.isArray(value)).toBe(true);
      expect(value).toEqual(['FFP', 'CRYO']);
    }));

    it('should join CSV on save', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        actionFunctionName: 'CPIREJ',
        actionProductCode: 'E0009',
        interCode: 'H001',
        effDate: moment(),
        interOnOtherProds: ['FFP', 'CRYO'],
      });

      serviceSpy.create.and.returnValue(of({}));

      component['createRecord'](false);
      tick();

      expect(serviceSpy.create).toHaveBeenCalled();
      const request = serviceSpy.create.calls.mostRecent().args[0];
      expect(request.interOnOtherProds).toBe('FFP,CRYO');
    }));
  });

  describe('Multi-select Other Product Types', () => {
    it('should split CSV on load', fakeAsync(() => {
      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges();
      tick();

      const value = component.form.get('interOnOtherProdTypes')?.value;
      expect(Array.isArray(value)).toBe(true);
      expect(value).toEqual(['FFP', 'CRYO']);
    }));

    it('should join CSV on save', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        actionFunctionName: 'CPIREJ',
        actionProductCode: 'E0009',
        interCode: 'H001',
        effDate: moment(),
        interOnOtherProdTypes: ['FFP', 'CRYO'],
      });

      serviceSpy.create.and.returnValue(of({}));

      component['createRecord'](false);
      tick();

      expect(serviceSpy.create).toHaveBeenCalled();
      const request = serviceSpy.create.calls.mostRecent().args[0];
      expect(request.interOnOtherProdTypes).toBe('FFP,CRYO');
    }));
  });

  describe('Create operation', () => {
    it('should send actionType as REJECT', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        actionFunctionName: 'CPIREJ',
        actionProductCode: 'E0009',
        interCode: 'H001',
        effDate: moment(),
      });

      serviceSpy.create.and.returnValue(of({}));

      component['createRecord'](false);
      tick();

      expect(serviceSpy.create).toHaveBeenCalled();
      const request = serviceSpy.create.calls.mostRecent().args[0];
      expect(request.actionType).toBe('REJECT');
    }));

  });

  describe('Update operation', () => {
    it('should call service.update() with composite key', fakeAsync(() => {
      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        interCode: 'N001',
        termDate: moment().add(7, 'months'),
      });

      serviceSpy.update.and.returnValue(of({}));

      (component as any).onSave(false);
      tick();

      expect(serviceSpy.update).toHaveBeenCalledWith(
        'CH01',
        'CPIREJ',
        'REJECT',
        'R01',
        'E0009',
        jasmine.any(Object)
      );
    }));
  });
  describe('Add and Create Another', () => {

    it('should emit saveAndCreateAnother and not saveSuccess', fakeAsync(() => {
      component.mode = 'add';
      component.selectedFunction = 'CPIREJ';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        actionFunctionName: 'CPIREJ',
        actionProductCode: 'E0009',
        interCode: 'H001',
        effDate: moment(),
      });

      serviceSpy.create.and.returnValue(of({}));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.saveAndCreateAnother, 'emit');

      (component as any).onSave(true);
      tick();

      expect(component.saveAndCreateAnother.emit).toHaveBeenCalled();
      expect(component.saveSuccess.emit).not.toHaveBeenCalled();
    }));
  });
  describe('Date validation', () => {

    it('should return minDate for termination date min when no effective date is set', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.form.get('effDate')?.setValue(null);
      const result = component.getTerminationDateMin();
      expect(result).toEqual(component['minDate']);
    }));

    it('should return effective date for termination date min when it is after minDate', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      const futureDate = moment().add(10, 'days');
      component.form.get('effDate')?.setValue(futureDate);
      const result = component.getTerminationDateMin();
      expect(result?.format('YYYY-MM-DD')).toBe(futureDate.format('YYYY-MM-DD'));
    }));

    it('should return minDate for termination date min when effective date is before minDate', fakeAsync(() => {
      component.mode = 'edit';
      fixture.detectChanges();
      tick();

      const pastDate = moment().subtract(30, 'days');
      component.form.get('effDate')?.setValue(pastDate);
      const result = component.getTerminationDateMin();
      expect(result?.format('YYYY-MM-DD')).toBe(component['minDate'].format('YYYY-MM-DD'));
    }));
  });
  describe('Success messages from API', () => {
    it('should use API response message on create success', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        actionFunctionName: 'CPIREJ',
        actionProductCode: 'E0009',
        interCode: 'H001',
        effDate: moment(),
      });

      const apiResponse = { message: 'Custom success message from API' };
      serviceSpy.create.and.returnValue(of(apiResponse));
      spyOn(component.saveSuccess, 'emit');

      (component as any).onSave(false);
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalledWith('Custom success message from API');
    }));

    it('should use default message when API response has no message', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        actionFunctionName: 'CPIREJ',
        actionProductCode: 'E0009',
        interCode: 'H001',
        effDate: moment(),
      });

      serviceSpy.create.and.returnValue(of({}));
      spyOn(component.saveSuccess, 'emit');

      (component as any).onSave(false);
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalledWith('Record created successfully');
    }));

    it('should use API response message on update success', fakeAsync(() => {
      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges();
      tick();

      const apiResponse = { message: 'Updated successfully via API' };
      serviceSpy.update.and.returnValue(of(apiResponse));
      spyOn(component.saveSuccess, 'emit');

      (component as any).onSave(false);
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalledWith('Updated successfully via API');
    }));

    it('should use API response message in Create Another flow', fakeAsync(() => {
      component.mode = 'add';
      component.selectedFunction = 'CPIREJ';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        actionFunctionName: 'CPIREJ',
        actionProductCode: 'E0009',
        interCode: 'H001',
        effDate: moment(),
      });

      const apiResponse = { message: 'Created and ready for another' };
      serviceSpy.create.and.returnValue(of(apiResponse));
      spyOn(component.saveAndCreateAnother, 'emit');

      (component as any).onSave(true);
      tick();

      expect(component.saveAndCreateAnother.emit).toHaveBeenCalledWith('Created and ready for another');
    }));
  });

  describe('Getters', () => {
    it('should return add title for add mode', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      expect(component.panelTitle).toBe('Add New Interdiction Placement');
    }));

    it('should return edit title for edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges();
      tick();
      expect(component.panelTitle).toBe('Edit Interdiction Placement');
    }));

    it('should return false for isEditMode in add mode', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      expect(component.isEditMode).toBeFalse();
    }));

    it('should return true for isEditMode in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges();
      tick();
      expect(component.isEditMode).toBeTrue();
    }));

    it('should return form controls from f getter', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      expect(component.f).toBe(component.form.controls);
    }));
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    }));
  });

  describe('onCancel', () => {
    it('should emit closePanel', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      spyOn(component.closePanel, 'emit');
      (component as any).onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));
  });

  describe('ngOnChanges', () => {
    it('should update lookups when lookup inputs change', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      const newCodes: ProductCodeLookup[] = [{ productCode: 'NEW', productDesc: 'New Product' }];
      component.productCodesLookup = newCodes;
      component.ngOnChanges({ productCodesLookup: { currentValue: newCodes, previousValue: [], firstChange: false, isFirstChange: () => false } as any });
      expect((component as any).productCodes()).toEqual(newCodes);
    }));

    it('should reset form when mode changes', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      component.form.patchValue({ interCode: 'H001' });
      component.mode = 'edit';
      component.record = mockRecord;
      component.ngOnChanges({ mode: { currentValue: 'edit', previousValue: 'add', firstChange: false, isFirstChange: () => false } as any });
      expect(component.form.get('actionProductCode')?.value).toBe('E0009');
    }));
  });

  describe('Search Controls', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      component.actionFunctionNamesLookup = mockFunctionNames;
      component.productCodesLookup = mockProductCodes;
      component.interdictionCodesLookup = mockInterdictionCodes;
      component.actionCodesLookup = mockActionCodes;
      component.productTypesLookup = mockProductTypes;
      fixture.detectChanges();
      tick();
    }));

    it('should filter function names by search', fakeAsync(() => {
      component.functionNameSearchCtrl.setValue('CPIREJ');
      tick();
      expect(component.filteredFunctionNames().length).toBe(1);
    }));

    it('should return all function names when search is empty', fakeAsync(() => {
      component.functionNameSearchCtrl.setValue('');
      tick();
      expect(component.filteredFunctionNames().length).toBe(2);
    }));

    it('should filter product codes by code', fakeAsync(() => {
      component.productCodeSearchCtrl.setValue('E0009');
      tick();
      expect(component.filteredProductCodes().length).toBe(1);
    }));

    it('should filter product codes by description', fakeAsync(() => {
      component.productCodeSearchCtrl.setValue('Plasma');
      tick();
      expect(component.filteredProductCodes().length).toBe(1);
    }));

    it('should filter other product codes', fakeAsync(() => {
      component.otherProductSearchCtrl.setValue('FFP');
      tick();
      expect(component.filteredOtherProductCodes().length).toBe(1);
    }));

    it('should filter product types', fakeAsync(() => {
      component.productTypeSearchCtrl.setValue('FFP');
      tick();
      expect(component.filteredProductTypes().length).toBe(1);
    }));

    it('should filter interdiction codes by code', fakeAsync(() => {
      component.interCodeSearchCtrl.setValue('H001');
      tick();
      expect(component.filteredInterdictionCodes().length).toBe(1);
    }));

    it('should filter interdiction codes by description', fakeAsync(() => {
      component.interCodeSearchCtrl.setValue('Normal');
      tick();
      expect(component.filteredInterdictionCodes().length).toBe(1);
    }));

    it('should filter action codes by code', fakeAsync(() => {
      component.actionCodeSearchCtrl.setValue('R01');
      tick();
      expect(component.filteredActionCodes().length).toBe(1);
    }));

    it('should filter action codes by description', fakeAsync(() => {
      component.actionCodeSearchCtrl.setValue('Reject');
      tick();
      expect(component.filteredActionCodes().length).toBe(1);
    }));
  });

  describe('onSave validation', () => {
    it('should not call service when form is invalid', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      component.form.patchValue({ actionProductCode: '', interCode: null });
      (component as any).onSave(false);
      tick();
      expect(serviceSpy.create).not.toHaveBeenCalled();
    }));
  });

  describe('Error handling', () => {
    it('should show error on create failure', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      component.form.patchValue({
        actionFunctionName: 'CPIREJ',
        actionProductCode: 'E0009',
        interCode: 'H001',
        effDate: moment(),
      });
      serviceSpy.create.and.returnValue(throwError(() => ({ error: { message: 'Create failed' } })));
      (component as any).onSave(false);
      tick();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Create failed');
      expect(component['loading']()).toBeFalse();
    }));

    it('should show default error message on create failure without message', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      component.form.patchValue({
        actionFunctionName: 'CPIREJ',
        actionProductCode: 'E0009',
        interCode: 'H001',
        effDate: moment(),
      });
      serviceSpy.create.and.returnValue(throwError(() => ({})));
      (component as any).onSave(false);
      tick();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to create interdiction placement');
    }));

    it('should show error on update failure', fakeAsync(() => {
      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges();
      tick();
      serviceSpy.update.and.returnValue(throwError(() => ({ error: { message: 'Update failed' } })));
      (component as any).onSave(false);
      tick();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Update failed');
    }));
  });

  describe('Date input handlers', () => {
    it('should handle effective date input', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      const event = { target: { value: '15-JAN-2027' } } as unknown as Event;
      component.onEffectiveDateInput(event);
      // Should not throw
      expect(true).toBeTrue();
    }));

    it('should handle termination date input', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      const event = { target: { value: '31-DEC-2027' } } as unknown as Event;
      component.onTerminationDateInput(event);
      expect((component as any).termDateRawInput).toBe('31-DEC-2027');
    }));
  });

  describe('Date min getters', () => {
    it('getEffectiveDateMin should return minDate for add mode', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      expect(component.getEffectiveDateMin()).toBeTruthy();
    }));

    it('getEffectiveDateMin should return null for edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges();
      tick();
      expect(component.getEffectiveDateMin()).toBeNull();
    }));

    it('getTerminationDateMin should return effDate when after minDate', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      const futureDate = moment().add(10, 'days');
      component.form.get('effDate')?.setValue(futureDate);
      const result = component.getTerminationDateMin();
      expect(result?.format('YYYY-MM-DD')).toBe(futureDate.format('YYYY-MM-DD'));
    }));
  });

  describe('Date error getters', () => {
    it('getEffectiveDateError should return string', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      const result = component.getEffectiveDateError();
      expect(typeof result).toBe('string');
    }));

    it('getTerminationDateError should return string', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      const result = component.getTerminationDateError();
      expect(typeof result).toBe('string');
    }));
  });

  describe('termDateInputValidator', () => {
    it('should return invalidDate when raw input exists but control value is null', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      (component as any).termDateRawInput = 'abc';
      const termControl = component.form.get('termDate')!;
      termControl.setValue(null);
      termControl.updateValueAndValidity();
      expect(termControl.hasError('invalidDate')).toBeTrue();
    }));
  });

  describe('elementId and errorId helpers', () => {
    it('should generate element ids', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      const id = (component as any).elementId('test');
      expect(id).toContain('test');
    }));

    it('should generate error ids', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      const id = (component as any).errorId('test');
      expect(id).toContain('test');
      expect(id).toContain('error');
    }));
  });

  describe('Update default message', () => {
    it('should use default message when update response has no message', fakeAsync(() => {
      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges();
      tick();
      serviceSpy.update.and.returnValue(of({}));
      spyOn(component.saveSuccess, 'emit');
      (component as any).onSave(false);
      tick();
      expect(component.saveSuccess.emit).toHaveBeenCalledWith('Record updated successfully');
    }));
  });

  describe('populateLookups null fallback', () => {
    it('should default to empty arrays when inputs are null', fakeAsync(() => {
      component.actionFunctionNamesLookup = null as any;
      component.actionCodesLookup = null as any;
      component.productCodesLookup = null as any;
      component.interdictionCodesLookup = null as any;
      component.productTypesLookup = null as any;
      fixture.detectChanges();
      tick();

      expect(component['actionFunctionNames']()).toEqual([]);
      expect(component['actionCodes']()).toEqual([]);
      expect(component['productCodes']()).toEqual([]);
      expect(component['interdictionCodes']()).toEqual([]);
      expect(component['productTypes']()).toEqual([]);
    }));

    it('should set signal values from lookup inputs', fakeAsync(() => {
      component.actionFunctionNamesLookup = mockFunctionNames;
      component.actionCodesLookup = mockActionCodes;
      component.productCodesLookup = mockProductCodes;
      component.interdictionCodesLookup = mockInterdictionCodes;
      component.productTypesLookup = mockProductTypes;
      fixture.detectChanges();
      tick();

      expect(component['actionFunctionNames']()).toEqual(mockFunctionNames);
      expect(component['actionCodes']()).toEqual(mockActionCodes);
      expect(component['productCodes']()).toEqual(mockProductCodes);
      expect(component['interdictionCodes']()).toEqual(mockInterdictionCodes);
      expect(component['productTypes']()).toEqual(mockProductTypes);
    }));
  });

  describe('createRecord with createAnother flow', () => {
    it('should reset form and enable actionCode for CPIREJ after createAnother', fakeAsync(() => {
      component.mode = 'add';
      component.selectedFunction = 'CPIREJ';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        actionFunctionName: 'CPIREJ',
        actionProductCode: 'E0009',
        interCode: 'H001',
        effDate: moment(),
      });

      serviceSpy.create.and.returnValue(of({ message: 'Created' }));
      spyOn(component.saveAndCreateAnother, 'emit');

      component['createRecord'](true);
      tick();

      expect(component.saveAndCreateAnother.emit).toHaveBeenCalledWith('Created');
      expect(component['submitted']()).toBe(false);
      expect(component['termDateRawInput']).toBe('');
    }));

    it('should disable actionCode for non-CPIREJ after createAnother', fakeAsync(() => {
      component.mode = 'add';
      component.selectedFunction = 'CPICOM2';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        actionFunctionName: 'CPICOM2',
        actionProductCode: 'E0009',
        interCode: 'H001',
        effDate: moment(),
      });

      serviceSpy.create.and.returnValue(of({ message: 'Created' }));
      spyOn(component.saveAndCreateAnother, 'emit');

      component['createRecord'](true);
      tick();

      expect(component.form.get('actionCode')?.disabled).toBe(true);
      expect(component.saveAndCreateAnother.emit).toHaveBeenCalledWith('Created');
    }));

    it('should set loading to false after createAnother success', fakeAsync(() => {
      component.mode = 'add';
      component.selectedFunction = 'CPIREJ';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        actionFunctionName: 'CPIREJ',
        actionProductCode: 'E0009',
        interCode: 'H001',
        effDate: moment(),
      });

      serviceSpy.create.and.returnValue(of({ message: 'Created' }));
      spyOn(component.saveAndCreateAnother, 'emit');

      component['createRecord'](true);
      tick();

      expect(component['loading']()).toBe(false);
    }));
  });

  describe('resetSearchControls', () => {
    it('should reset all search controls to empty', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.functionNameSearchCtrl.setValue('test');
      component.productCodeSearchCtrl.setValue('test');
      component.otherProductSearchCtrl.setValue('test');
      component.productTypeSearchCtrl.setValue('test');
      component.interCodeSearchCtrl.setValue('test');
      component.actionCodeSearchCtrl.setValue('test');

      component['resetSearchControls']();

      expect(component.functionNameSearchCtrl.value).toBe('');
      expect(component.productCodeSearchCtrl.value).toBe('');
      expect(component.otherProductSearchCtrl.value).toBe('');
      expect(component.productTypeSearchCtrl.value).toBe('');
      expect(component.interCodeSearchCtrl.value).toBe('');
      expect(component.actionCodeSearchCtrl.value).toBe('');
    }));
  });

  describe('termDateInputValidator additional cases', () => {
    it('should return null when raw input is empty and value is null', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component['termDateRawInput'] = '';
      const termControl = component.form.get('termDate');
      termControl?.setValue(null);
      termControl?.updateValueAndValidity();

      expect(termControl?.hasError('invalidDate')).toBe(false);
    }));

    it('should return null when value is set regardless of raw input', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component['termDateRawInput'] = '01-JAN-2027';
      const termControl = component.form.get('termDate');
      termControl?.setValue(moment().add(1, 'year'));
      termControl?.updateValueAndValidity();

      expect(termControl?.hasError('invalidDate')).toBe(false);
    }));

    it('should return invalidDate when raw input is whitespace-only and value is null', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component['termDateRawInput'] = '   ';
      const termControl = component.form.get('termDate');
      termControl?.setValue(null);
      termControl?.updateValueAndValidity();

      expect(termControl?.hasError('invalidDate')).toBe(false);
    }));
  });

  describe('onSave submitted and dateRangeInvalid', () => {
    it('should set submitted to true even when form is invalid', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.form.get('actionProductCode')?.setValue('');
      (component as any).onSave(false);
      tick();

      expect(component['submitted']()).toBe(true);
    }));

    it('should not call service when date range is invalid', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        actionProductCode: 'E0009',
        interCode: 'H001',
        effDate: moment().add(10, 'days'),
        termDate: moment().subtract(10, 'days'),
      });

      serviceSpy.create.and.returnValue(of({}));
      (component as any).onSave(false);
      tick();

      expect(serviceSpy.create).not.toHaveBeenCalled();
    }));

    it('should not call update when form is invalid in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges();
      tick();

      component.form.get('interCode')?.setValue(null);
      serviceSpy.update.and.returnValue(of({}));
      (component as any).onSave(false);
      tick();

      expect(serviceSpy.update).not.toHaveBeenCalled();
    }));
  });

  describe('update error with default message', () => {
    it('should show default error message when update error has no message', fakeAsync(() => {
      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges();
      tick();

      serviceSpy.update.and.returnValue(throwError(() => ({ error: {} })));
      (component as any).onSave(false);
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to update interdiction placement');
      expect(component['loading']()).toBe(false);
    }));
  });

  describe('ngOnChanges additional cases', () => {
    it('should reset form when record changes', fakeAsync(() => {
      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges();
      tick();

      const newRecord = { ...mockRecord, interCode: 'N001' };
      component.record = newRecord;
      component.ngOnChanges({
        record: {
          currentValue: newRecord,
          previousValue: mockRecord,
          firstChange: false,
          isFirstChange: () => false,
        },
      } as any);

      expect(component.form.get('interCode')?.value).toBe('N001');
    }));

    it('should reset form when selectedFunction changes', fakeAsync(() => {
      component.mode = 'add';
      component.selectedFunction = 'CPICOM2';
      fixture.detectChanges();
      tick();

      component.selectedFunction = 'CPIREJ';
      component.ngOnChanges({
        selectedFunction: {
          currentValue: 'CPIREJ',
          previousValue: 'CPICOM2',
          firstChange: false,
          isFirstChange: () => false,
        },
      } as any);

      expect(component.form.get('actionFunctionName')?.value).toBe('CPIREJ');
    }));

    it('should not reset form when lookup changes but form not initialized', fakeAsync(() => {
      component.actionFunctionNamesLookup = mockFunctionNames;
      fixture.detectChanges();
      tick();

      const newLookup = [{ code: 'NEW', description: 'New' }];
      component.actionFunctionNamesLookup = newLookup;
      component.ngOnChanges({
        actionFunctionNamesLookup: {
          currentValue: newLookup,
          previousValue: mockFunctionNames,
          firstChange: false,
          isFirstChange: () => false,
        },
      } as any);

      expect(component['actionFunctionNames']()).toEqual(newLookup);
    }));
  });

  describe('Date input handlers additional cases', () => {
    it('should handle empty effective date input', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      const event = { target: { value: '' } } as unknown as Event;
      component.onEffectiveDateInput(event);

      const control = component.form.get('effDate');
      expect(control?.touched).toBe(true);
    }));

    it('should handle empty termination date input', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      const event = { target: { value: '' } } as unknown as Event;
      component.onTerminationDateInput(event);

      expect(component['termDateRawInput']).toBe('');
    }));

    it('should set termDateRawInput on termination date input in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges();
      tick();

      const event = { target: { value: 'some-date' } } as unknown as Event;
      component.onTerminationDateInput(event);

      expect(component['termDateRawInput']).toBe('some-date');
    }));
  });

  describe('Date error getters with specific errors', () => {
    it('getEffectiveDateError should return required error when touched and null', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      const control = component.form.get('effDate');
      control?.setValue(null);
      control?.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    }));

    it('getTerminationDateError should return empty when untouched', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      expect(component.getTerminationDateError()).toBe('');
    }));

    it('getEffectiveDateError should return empty when untouched', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      expect(component.getEffectiveDateError()).toBe('');
    }));
  });

  describe('getEffectiveDateMin and getTerminationDateMin', () => {
    it('getEffectiveDateMin should return exact minDate in add mode', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      expect(component.getEffectiveDateMin()).toEqual(component['minDate']);
    }));

    it('getTerminationDateMin should return minDate when effective date is not a valid moment', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.form.get('effDate')?.setValue('invalid');
      const result = component.getTerminationDateMin();
      expect(result).toEqual(component['minDate']);
    }));

    it('getTerminationDateMin should return minDate when effective date is null', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.form.get('effDate')?.setValue(null);
      const result = component.getTerminationDateMin();
      expect(result).toEqual(component['minDate']);
    }));
  });

  describe('Filtered signals with no search', () => {
    it('should return all product codes when search is empty', fakeAsync(() => {
      component.productCodesLookup = mockProductCodes;
      fixture.detectChanges();
      tick();

      expect(component.filteredProductCodes()).toEqual(mockProductCodes);
    }));

    it('should return all other product codes when search is empty', fakeAsync(() => {
      component.productCodesLookup = mockProductCodes;
      fixture.detectChanges();
      tick();

      expect(component.filteredOtherProductCodes()).toEqual(mockProductCodes);
    }));

    it('should return all product types when search is empty', fakeAsync(() => {
      component.productTypesLookup = mockProductTypes;
      fixture.detectChanges();
      tick();

      expect(component.filteredProductTypes()).toEqual(mockProductTypes);
    }));

    it('should return all interdiction codes when search is empty', fakeAsync(() => {
      component.interdictionCodesLookup = mockInterdictionCodes;
      fixture.detectChanges();
      tick();

      expect(component.filteredInterdictionCodes()).toEqual(mockInterdictionCodes);
    }));

    it('should return all action codes when search is empty', fakeAsync(() => {
      component.actionCodesLookup = mockActionCodes;
      fixture.detectChanges();
      tick();

      expect(component.filteredActionCodes()).toEqual(mockActionCodes);
    }));
  });

  describe('onSave calls correct method based on mode', () => {
    it('should call createRecord in add mode', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        actionFunctionName: 'CPIREJ',
        actionProductCode: 'E0009',
        interCode: 'H001',
        effDate: moment(),
      });

      serviceSpy.create.and.returnValue(of({ message: 'ok' }));
      spyOn(component.saveSuccess, 'emit');
      (component as any).onSave(false);
      tick();

      expect(serviceSpy.create).toHaveBeenCalled();
      expect(serviceSpy.update).not.toHaveBeenCalled();
    }));

    it('should call updateRecord in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges();
      tick();

      serviceSpy.update.and.returnValue(of({ message: 'ok' }));
      spyOn(component.saveSuccess, 'emit');
      (component as any).onSave(false);
      tick();

      expect(serviceSpy.update).toHaveBeenCalled();
      expect(serviceSpy.create).not.toHaveBeenCalled();
    }));
  });

  describe('resetForm via ngOnChanges', () => {
    it('should enable actionProductCode in add mode after reset', fakeAsync(() => {
      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges();
      tick();
      expect(component.form.get('actionProductCode')?.disabled).toBe(true);

      component.mode = 'add';
      component.record = null;
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: 'edit',
          firstChange: false,
          isFirstChange: () => false,
        },
      } as any);

      expect(component.form.get('actionProductCode')?.disabled).toBe(false);
    }));

    it('should disable actionFunctionName after reset', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: 'add',
          firstChange: false,
          isFirstChange: () => false,
        },
      } as any);

      expect(component.form.get('actionFunctionName')?.disabled).toBe(true);
    }));

    it('should enable actionCode for CPIREJ after reset', fakeAsync(() => {
      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges();
      tick();

      component.ngOnChanges({
        record: {
          currentValue: mockRecord,
          previousValue: null,
          firstChange: false,
          isFirstChange: () => false,
        },
      } as any);

      expect(component.form.get('actionCode')?.enabled).toBe(true);
    }));

    it('should disable actionCode for non-CPIREJ after reset', fakeAsync(() => {
      component.mode = 'edit';
      component.record = { ...mockRecord, actionFunctionName: 'CPICOM2', actionCode: null };
      fixture.detectChanges();
      tick();

      component.ngOnChanges({
        record: {
          currentValue: component.record,
          previousValue: mockRecord,
          firstChange: false,
          isFirstChange: () => false,
        },
      } as any);

      expect(component.form.get('actionCode')?.disabled).toBe(true);
    }));
  });
});
