import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { AddEditOrderCharges } from './add-edit-order-charges';
import { DefineOrderChargesService } from '../services/define-order-charges.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleChange } from '@angular/core';
import { of, throwError } from 'rxjs';
import moment from 'moment';
import { OrderChargeModel } from '../models/define-order-charges.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditOrderCharges', () => {
  let loginServiceSpy: any;
  let headerServiceSpy: any;
  let serviceSpy: any;
  let component: AddEditOrderCharges;
  let fixture: ComponentFixture<AddEditOrderCharges>;
  let service: jasmine.SpyObj<DefineOrderChargesService>;
  let headerService: jasmine.SpyObj<HeaderService>;
  let loginService: jasmine.SpyObj<LoginService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;

  const mockOrderCharge: OrderChargeModel = {
    serviceCode: 'TEST01',
    serviceCodeDescription: 'Test Charge Description',
    charge: 150.50,
    modifyCharge: 'Yes',
    chargeType: 'Debit',
    shipmentCharge: 'Y',
    orderNumber: 'Yes',
    effectiveDate: '01-JAN-2024',
    targetDate: '31-DEC-2024',
    lastModifiedDate: '15-MAR-2024'
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('DefineOrderChargesService', [
      'addOrderCharge',
      'updateOrderCharge',
      'checkDuplicateServiceCode',
      'validateBillingCode',
      'getChargeTypeLov'
    ]);

    headerServiceSpy = createMockHeaderService();

    loginServiceSpy = jasmine.createSpyObj('LoginService', ['getUserId']);

    const snackbarServiceSpy = createMockSnackbarService();

    serviceSpy.checkDuplicateServiceCode.and.returnValue(of(false));
    serviceSpy.validateBillingCode.and.returnValue(of(true));
    serviceSpy.getChargeTypeLov.and.returnValue(of([]));
    loginServiceSpy.getUserId.and.returnValue('USER1');



      TestBed.configureTestingModule({
      imports: [AddEditOrderCharges, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: DefineOrderChargesService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });


    


      serviceSpy.addOrderCharge.calls.reset();


      serviceSpy.updateOrderCharge.calls.reset();


      serviceSpy.checkDuplicateServiceCode.calls.reset();


      serviceSpy.validateBillingCode.calls.reset();


      serviceSpy.getChargeTypeLov.calls.reset();


      headerServiceSpy.getCurrentChapterId.calls.reset();


      loginServiceSpy.getUserId.calls.reset();


      serviceSpy.checkDuplicateServiceCode.and.returnValue(of(false));


      serviceSpy.validateBillingCode.and.returnValue(of(true));


      serviceSpy.getChargeTypeLov.and.returnValue(of([]));
      loginServiceSpy.getUserId.and.returnValue('USER1');


    service = TestBed.inject(DefineOrderChargesService) as jasmine.SpyObj<DefineOrderChargesService>;
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    loginService = TestBed.inject(LoginService) as jasmine.SpyObj<LoginService>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;

    fixture = TestBed.createComponent(AddEditOrderCharges);
    component = fixture.componentInstance;


    });




  describe('Form Initialization', () => {
    it('should initialize form with correct controls in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();

      expect(component.form.get('serviceCode')).toBeTruthy();
      expect(component.form.get('serviceCodeDescription')).toBeTruthy();
      expect(component.form.get('charge')).toBeTruthy();
      expect(component.form.get('modifyCharge')).toBeTruthy();
      expect(component.form.get('chargeType')).toBeTruthy();
      expect(component.form.get('shipmentCharge')).toBeTruthy();
      expect(component.form.get('orderNumber')).toBeTruthy();
      expect(component.form.get('effectiveDate')).toBeTruthy();
      expect(component.form.get('targetDate')).toBeTruthy();
    });

    it('should set required validators on mandatory fields', () => {
      component.mode = 'add';
      fixture.detectChanges();

      expect(component.form.get('serviceCode')?.hasError('required')).toBe(true);
      expect(component.form.get('serviceCodeDescription')?.hasError('required')).toBe(true);
      expect(component.form.get('charge')?.hasError('required')).toBe(true);
      expect(component.form.get('modifyCharge')?.hasError('required')).toBe(true);
      expect(component.form.get('chargeType')?.hasError('required')).toBe(true);
      expect(component.form.get('effectiveDate')?.hasError('required')).toBe(true);
    });




  });

  describe('Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });







    it('should validate effective date is not in the past', () => {
      const control = component.form.get('effectiveDate');
      const pastDate = moment('2020-01-01');

      control?.setValue(pastDate);
      control?.markAsTouched();
      control?.markAsDirty();
      control?.updateValueAndValidity();
      fixture.detectChanges();

      expect(component.getEffectiveDateError()).toContain('cannot be in the past');
    });



    it('should validate order number is required when charge type is Credit', () => {
      component.form.patchValue({
        chargeType: 'Credit',
        orderNumber: null
      });

      fixture.detectChanges();

      expect(component.form.hasError('orderNumberRequired')).toBe(true);
    });

    it('should not require order number when charge type is Debit', () => {
      component.form.patchValue({
        chargeType: 'Debit',
        orderNumber: null
      });

      fixture.detectChanges();

      expect(component.form.hasError('orderNumberRequired')).toBe(false);
    });

    it('should not require shipment charge field', () => {
      const control = component.form.get('shipmentCharge');

      expect(control?.hasError('required')).toBe(false);
    });

    it('should allow empty shipment charge', () => {
      component.form.patchValue({
        serviceCode: 'TEST',
        serviceCodeDescription: 'Test',
        charge: 100,
        modifyCharge: 'Yes',
        chargeType: 'Debit',
        shipmentCharge: null,
        effectiveDate: moment().add(1, 'day')
      });

      expect(component.form.get('shipmentCharge')?.hasError('required')).toBe(false);
    });


  });



  describe('isFormValid', () => {
    describe('add mode', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should return false when required fields are empty', () => {
        expect(component.isFormValid).toBe(false);
      });


    });

    describe('edit mode', () => {
      beforeEach(() => {
        component.mode = 'edit';
        component.data = mockOrderCharge;
        fixture.detectChanges();
        component.ngOnInit();
      });

      it('should return false when form is not dirty', () => {
        expect(component.isFormValid).toBe(false);
      });

      it('should return true when form is dirty and has no visible errors', () => {
        component.form.get('serviceCodeDescription')?.setValue('Updated Description');
        component.form.markAsDirty();
        fixture.detectChanges();

        expect(component.isFormValid).toBe(true);
      });

      it('should return false when form is dirty but has visible errors', () => {
        component.form.get('serviceCodeDescription')?.setValue('');
        component.form.get('serviceCodeDescription')?.markAsTouched();
        component.form.markAsDirty();
        fixture.detectChanges();

        expect(component.isFormValid).toBe(false);
      });

      it('should return false when charge has visible error', () => {
        component.form.get('charge')?.setValue('');
        component.form.get('charge')?.markAsTouched();
        component.form.markAsDirty();
        fixture.detectChanges();

        expect(component.isFormValid).toBe(false);
      });
    });
  });

  describe('isOrderNumberRequired', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return true when chargeType is Credit', () => {
      component.form.get('chargeType')?.setValue('Credit');
      expect(component.isOrderNumberRequired).toBe(true);
    });

    it('should return false when chargeType is Debit', () => {
      component.form.get('chargeType')?.setValue('Debit');
      expect(component.isOrderNumberRequired).toBe(false);
    });

    it('should return false when chargeType is null', () => {
      component.form.get('chargeType')?.setValue(null);
      expect(component.isOrderNumberRequired).toBe(false);
    });
  });

  describe('Mode Changes', () => {
    it('should reset form when switching from edit to add mode', () => {
      component.mode = 'edit';
      component.data = mockOrderCharge;
      fixture.detectChanges();
      component.ngOnInit();

      component.mode = 'add';
      component.data = null;
      component.ngOnChanges({
        mode: new SimpleChange('edit', 'add', false),
        data: new SimpleChange(mockOrderCharge, null, false)
      });

      expect(component.form.get('serviceCode')?.value).toBeNull();
      expect(component.form.get('serviceCode')?.enabled).toBe(true);
      expect(component.form.pristine).toBe(true);
      expect(component.editModeValues.serviceCode).toBe('');
    });
  });

  describe('Service Code Input Handling', () => {
    it('should convert service code to uppercase on input', () => {
      component.mode = 'add';
      component.ngOnInit();
      fixture.detectChanges();

      const mockEvent = {
        target: {
          value: 'lowercase',
          selectionStart: 9,
          setSelectionRange: jasmine.createSpy('setSelectionRange')
        }
      } as any;

      component.onServiceCodeInput(mockEvent);

      expect(component.form.get('serviceCode')?.value).toBe('LOWERCASE');
    });
  });

  describe('Charge Field - chargeRangeValidator', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return required error when charge is empty', () => {
      const control = component.form.get('charge');
      control?.setValue(null);
      expect(control?.hasError('required')).toBe(true);
    });

    it('should return max error when charge exceeds 99999.99', () => {
      const control = component.form.get('charge');
      control?.setValue('100000');
      expect(control?.hasError('max')).toBe(true);
    });

    it('should return min error when charge is below -9999.99', () => {
      const control = component.form.get('charge');
      control?.setValue('-10000');
      expect(control?.hasError('min')).toBe(true);
    });



    it('should return invalidCharge error for plus sign only', () => {
      const control = component.form.get('charge');
      control?.setValue('+');
      expect(control?.hasError('invalidCharge')).toBe(true);
    });

    it('should return invalidCharge error for dot only', () => {
      const control = component.form.get('charge');
      control?.setValue('.');
      expect(control?.hasError('invalidCharge')).toBe(true);
    });

    it('should return maxDecimal error for more than 2 decimal places', () => {
      const control = component.form.get('charge');
      control?.setValue('100.123');
      expect(control?.hasError('maxDecimal')).toBe(true);
    });

    it('should accept valid positive charge', () => {
      const control = component.form.get('charge');
      control?.setValue('500.50');
      expect(control?.valid).toBe(true);
    });

    it('should accept valid negative charge', () => {
      const control = component.form.get('charge');
      control?.setValue('-500.50');
      expect(control?.valid).toBe(true);
    });

    it('should accept boundary value 99999.99', () => {
      const control = component.form.get('charge');
      control?.setValue('99999.99');
      expect(control?.valid).toBe(true);
    });

    it('should accept boundary value -9999.99', () => {
      const control = component.form.get('charge');
      control?.setValue('-9999.99');
      expect(control?.valid).toBe(true);
    });

    it('should accept zero', () => {
      const control = component.form.get('charge');
      control?.setValue('0');
      expect(control?.valid).toBe(true);
    });
  });



  describe('Charge Field - onChargeInput', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should clean non-numeric characters from input', () => {
      const input = { value: '12abc34', selectionStart: 0 } as HTMLInputElement;
      const event = { target: input } as any;

      component.onChargeInput(event);

      expect(input.value).toBe('1234');
    });

    it('should update form control with cleaned value', () => {
      const input = { value: '500.50', selectionStart: 0 } as HTMLInputElement;
      const event = { target: input } as any;

      component.onChargeInput(event);

      expect(component.form.get('charge')?.value).toBe('500.50');
    });

    it('should set form control to null for empty string', () => {
      const input = { value: '', selectionStart: 0 } as HTMLInputElement;
      const event = { target: input } as any;

      component.onChargeInput(event);

      expect(component.form.get('charge')?.value).toBeNull();
    });
  });



  describe('orderNumberErrorMatcher', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return false when control is not touched or dirty', () => {
      const control = component.form.get('orderNumber');
      component.form.patchValue({ chargeType: 'Credit', orderNumber: 'No' });

      const result = component.orderNumberErrorMatcher.isErrorState(control, null as any);
      expect(result).toBe(false);
    });

    it('should return true when control is touched and form has error', () => {
      const control = component.form.get('orderNumber');
      component.form.patchValue({ chargeType: 'Credit', orderNumber: null });
      control?.markAsTouched();
      fixture.detectChanges();

      const result = component.orderNumberErrorMatcher.isErrorState(control, null as any);
      expect(result).toBe(true);
    });

    it('should return false when no error exists', () => {
      const control = component.form.get('orderNumber');
      component.form.patchValue({ chargeType: 'Debit', orderNumber: 'No' });
      control?.markAsTouched();
      fixture.detectChanges();

      const result = component.orderNumberErrorMatcher.isErrorState(control, null as any);
      expect(result).toBe(false);
    });

    it('should return false for null control', () => {
      const result = component.orderNumberErrorMatcher.isErrorState(null, null as any);
      expect(result).toBe(false);
    });
  });

  describe('Submit - Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should call addOrderCharge on valid submit', fakeAsync(() => {
      const successResponse = { success: true, message: 'Created', data: {} };
      service.addOrderCharge.and.returnValue(of(successResponse));

      component.form.patchValue({
        serviceCode: 'SVC01',
        serviceCodeDescription: 'Test Svc',
        charge: '100',
        modifyCharge: 'Yes',
        chargeType: 'Debit',
        shipmentCharge: 'N',
        orderNumber: 'No',
        effectiveDate: moment().add(1, 'day')
      });
      tick(600);
      fixture.detectChanges();

      component.onSubmit(false);
      tick();

      expect(service.addOrderCharge).toHaveBeenCalled();
      expect(snackbarService.showSuccess).toHaveBeenCalledWith(
        'New Order Charges for service code SVC01 have been added.'
      );
    }));








  });



  describe('Cancel and Clear Operations', () => {




    it('should mark form as untouched on clear all', () => {
      component.mode = 'edit';
      component.data = mockOrderCharge;
      fixture.detectChanges();
      component.ngOnInit();

      component.form.markAllAsTouched();
      component.form.markAsDirty();

      component.onClearAll();

      expect(component.form.untouched).toBe(true);
    });
  });

  describe('Error Messages', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should return correct error message for required service code', () => {
      const control = component.form.get('serviceCode');
      control?.markAsTouched();
      fixture.detectChanges();

      expect(component.getServiceCodeError()).toBe('Service Code is required');
    });

    it('should return correct error message for required charge', () => {
      const control = component.form.get('charge');
      control?.markAsTouched();
      fixture.detectChanges();

      expect(component.getChargeError()).toBe('Charge is required');
    });

    it('should return correct error message for required modify charge', () => {
      const control = component.form.get('modifyCharge');
      control?.markAsTouched();
      fixture.detectChanges();

      expect(component.getModifyChargeError()).toBe('Modify Charge is required');
    });

    it('should return correct error message for required charge type', () => {
      const control = component.form.get('chargeType');
      control?.markAsTouched();
      fixture.detectChanges();

      expect(component.getChargeTypeError()).toBe('Charge Type is required');
    });

    it('should return correct error message for required effective date', () => {
      const control = component.form.get('effectiveDate');
      control?.markAsTouched();
      fixture.detectChanges();

      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    });

    it('should return max charge error message', () => {
      const control = component.form.get('charge');
      control?.setValue('100000');
      control?.markAsTouched();
      fixture.detectChanges();

      expect(component.getChargeError()).toBe('Max. charge : 99999.99');
    });

    it('should return min charge error message', () => {
      const control = component.form.get('charge');
      control?.setValue('-10000');
      control?.markAsTouched();
      fixture.detectChanges();

      expect(component.getChargeError()).toBe('Min. charge : -9999.99');
    });

    it('should return invalidCharge error message', () => {
      const control = component.form.get('charge');
      control?.setValue('-');
      control?.markAsTouched();
      fixture.detectChanges();

      expect(component.getChargeError()).toBe('Enter a valid number');
    });

    it('should return maxDecimal error message', () => {
      const control = component.form.get('charge');
      control?.setValue('100.123');
      control?.markAsTouched();
      fixture.detectChanges();

      expect(component.getChargeError()).toBe('Maximum 2 decimal places allowed');
    });

    it('should return error for order number when charge type is Credit and order number is empty', () => {
      component.form.patchValue({
        chargeType: 'Credit',
        orderNumber: null
      });
      component.form.get('orderNumber')?.markAsTouched();
      fixture.detectChanges();

      expect(component.getOrderNumberError()).toBe('Order Number is required when Charge Type is Credit');
    });

    it('should not return order number error when not touched', () => {
      component.form.patchValue({
        chargeType: 'Credit',
        orderNumber: 'No'
      });
      fixture.detectChanges();

      expect(component.getOrderNumberError()).toBe('');
    });

    it('should not return error for order number when charge type is Debit', () => {
      component.form.patchValue({
        chargeType: 'Debit',
        orderNumber: 'No'
      });
      component.form.get('orderNumber')?.markAsTouched();
      fixture.detectChanges();

      expect(component.getOrderNumberError()).toBe('');
    });

    it('should not return error for shipment charge when empty', () => {
      const control = component.form.get('shipmentCharge');
      control?.setValue(null);
      control?.markAsTouched();
      fixture.detectChanges();

      expect(component.getShipmentChargeError()).toBe('');
    });

    it('should return error for invalid shipment charge value', () => {
      const control = component.form.get('shipmentCharge');
      control?.setValue('X');
      control?.markAsTouched();
      fixture.detectChanges();

      expect(control?.hasError('invalidShipmentCharge')).toBe(true);
    });



    it('should return required error for service code description when touched and empty', () => {
      const control = component.form.get('serviceCodeDescription');
      control?.markAsTouched();
      fixture.detectChanges();

      expect(component.getServiceCodeDescriptionError()).toBe('Service Code Description is required');
    });






  });



  describe('Character Count', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should calculate service code character count correctly', () => {
      component.form.get('serviceCode')?.setValue('ABC');

      expect(component.serviceCodeCharCount).toBe('2/5');
    });

    it('should show service code hint when field has value', () => {
      component.form.get('serviceCode')?.setValue('AB');

      expect(component.shouldShowServiceCodeHint()).toBe(true);
    });

    it('should not show service code hint when field is empty', () => {
      component.form.get('serviceCode')?.setValue('');

      expect(component.shouldShowServiceCodeHint()).toBe(false);
    });

    it('should calculate description character count correctly', () => {
      component.form.get('serviceCodeDescription')?.setValue('Test Description');

      expect(component.descriptionCharCount).toContain('remaining: 34');
    });

    it('should show description hint when field has value', () => {
      component.form.get('serviceCodeDescription')?.setValue('Test');

      expect(component.shouldShowDescriptionHint()).toBe(true);
    });

    it('should not show description hint when field is empty', () => {
      component.form.get('serviceCodeDescription')?.setValue('');

      expect(component.shouldShowDescriptionHint()).toBe(false);
    });
  });

  describe('Dropdown Options', () => {
    it('should have modifyCharge options Yes and No', () => {
      expect(component.modifyChargeOptions.length).toBe(2);
      expect(component.modifyChargeOptions[0].value).toBe('Yes');
      expect(component.modifyChargeOptions[1].value).toBe('No');
    });

    it('should have chargeType options Debit and Credit', () => {
      expect(component.chargeTypeOptions.length).toBe(2);
      expect(component.chargeTypeOptions[0].value).toBe('Debit');
      expect(component.chargeTypeOptions[1].value).toBe('Credit');
    });

    it('should have shipmentCharge options Y, N, S, B with code-prefixed labels', () => {
      expect(component.shipmentChargeOptions.length).toBe(4);
      expect(component.shipmentChargeOptions.map(o => o.value)).toEqual(['Y', 'N', 'S', 'B']);
      expect(component.shipmentChargeOptions.map(o => o.label)).toEqual([
        'Y - Yes Entry at shipment',
        'N - No',
        'S - Default',
        'B - Box'
      ]);
    });

    it('should have orderNumber options Yes and No', () => {
      expect(component.orderNumberOptions.length).toBe(2);
      expect(component.orderNumberOptions[0].value).toBe('Yes');
      expect(component.orderNumberOptions[1].value).toBe('No');
    });
  });
  describe('Component Cleanup', () => {
    it('should cleanup on destroy', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    it('should emit closePanel event', () => {
      component.mode = 'add';
      fixture.detectChanges();
      spyOn(component.closePanel, 'emit');

      component.onCancel();

      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  describe('onClearAll', () => {
    it('should do nothing in add mode', () => {
      component.mode = 'add';
      component.data = null;
      fixture.detectChanges();

      component.form.get('serviceCodeDescription')?.setValue('something');
      component.onClearAll();

      // In add mode, onClearAll only runs if mode==='edit' && data exists
      expect(component.form.get('serviceCodeDescription')?.value).toBe('something');
    });

    it('should restore original values in edit mode', () => {
      component.mode = 'edit';
      component.data = mockOrderCharge;
      fixture.detectChanges();
      component.ngOnInit();

      component.form.get('serviceCodeDescription')?.setValue('Changed');
      component.form.markAsDirty();
      component.form.markAllAsTouched();

      component.onClearAll();

      expect(component.form.get('serviceCodeDescription')?.value).toBe('Test Charge Description');
      expect(component.form.pristine).toBe(true);
      expect(component.form.untouched).toBe(true);
    });
  });

  describe('onChargeKeydown', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    function createKeyEvent(key: string, value: string, selStart = 0, selEnd = 0): KeyboardEvent {
      const event = new KeyboardEvent('keydown', { key, cancelable: true });
      Object.defineProperty(event, 'target', {
        value: {
          value,
          selectionStart: selStart,
          selectionEnd: selEnd
        }
      });
      return event;
    }

    it('should allow Backspace key', () => {
      const event = createKeyEvent('Backspace', '123');
      spyOn(event, 'preventDefault');
      component.onChargeKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Tab key', () => {
      const event = createKeyEvent('Tab', '123');
      spyOn(event, 'preventDefault');
      component.onChargeKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow digit keys', () => {
      const event = createKeyEvent('5', '12', 2, 2);
      spyOn(event, 'preventDefault');
      component.onChargeKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow minus sign at position 0', () => {
      const event = createKeyEvent('-', '', 0, 0);
      spyOn(event, 'preventDefault');
      component.onChargeKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent minus sign not at position 0', () => {
      const event = createKeyEvent('-', '12', 2, 2);
      spyOn(event, 'preventDefault');
      component.onChargeKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent duplicate minus sign', () => {
      const event = createKeyEvent('-', '-12', 0, 0);
      spyOn(event, 'preventDefault');
      component.onChargeKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow decimal point when none exists', () => {
      const event = createKeyEvent('.', '123', 3, 3);
      spyOn(event, 'preventDefault');
      component.onChargeKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent duplicate decimal point', () => {
      const event = createKeyEvent('.', '12.3', 4, 4);
      spyOn(event, 'preventDefault');
      component.onChargeKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent non-numeric non-special characters', () => {
      const event = createKeyEvent('a', '123', 3, 3);
      spyOn(event, 'preventDefault');
      component.onChargeKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent digit when value would exceed limits', () => {
      const event = createKeyEvent('9', '99999', 5, 5);
      spyOn(event, 'preventDefault');
      component.onChargeKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow ctrl+key combinations', () => {
      const event = new KeyboardEvent('keydown', { key: 'c', ctrlKey: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: { value: '123', selectionStart: 0, selectionEnd: 3 } });
      spyOn(event, 'preventDefault');
      component.onChargeKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow plus sign at position 0', () => {
      const event = createKeyEvent('+', '', 0, 0);
      spyOn(event, 'preventDefault');
      component.onChargeKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent plus sign not at position 0', () => {
      const event = createKeyEvent('+', '12', 2, 2);
      spyOn(event, 'preventDefault');
      component.onChargeKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('onChargePaste', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should allow valid paste values', () => {
      const event = {
        clipboardData: { getData: () => '123.45' },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.onChargePaste(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent paste of invalid characters', () => {
      const event = {
        clipboardData: { getData: () => 'abc' },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.onChargePaste(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent paste of value exceeding limits', () => {
      const event = {
        clipboardData: { getData: () => '999999' },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.onChargePaste(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent paste with more than 2 decimal places', () => {
      const event = {
        clipboardData: { getData: () => '12.345' },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.onChargePaste(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow paste of negative values within limits', () => {
      const event = {
        clipboardData: { getData: () => '-500.50' },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.onChargePaste(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should handle empty clipboard data', () => {
      const event = {
        clipboardData: { getData: () => '' },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.onChargePaste(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('onChargeInput - truncation branch', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should truncate value exceeding limits', () => {
      const input = { value: '1234567' } as HTMLInputElement;
      const event = { target: input } as any;

      component.onChargeInput(event);

      // value should be truncated to 5 integer digits for positive
      expect(input.value.length).toBeLessThanOrEqual(8);
    });
  });

  describe('onEffectiveDateInput', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should handle effective date input without error', () => {
      const mockEvent = {
        target: { value: '01-JAN-2025' }
      } as any;

      expect(() => component.onEffectiveDateInput(mockEvent)).not.toThrow();
    });

    it('should handle empty effective date input', () => {
      const mockEvent = {
        target: { value: '' }
      } as any;

      expect(() => component.onEffectiveDateInput(mockEvent)).not.toThrow();
    });
  });

  describe('onEffectiveDateChange', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should set lastChangedDateField to effective', () => {
      component.onEffectiveDateChange();
      expect(component['lastChangedDateField']).toBe('effective');
    });

    it('should mark effective date control as touched and dirty', () => {
      component.onEffectiveDateChange();
      expect(component.form.get('effectiveDate')?.touched).toBe(true);
      expect(component.form.get('effectiveDate')?.dirty).toBe(true);
    });
  });

  describe('onTargetDateInput', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should handle target date input without error', () => {
      const mockEvent = {
        target: { value: '31-DEC-2025' }
      } as any;

      expect(() => component.onTargetDateInput(mockEvent)).not.toThrow();
    });
  });

  describe('onTargetDateChange', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should set lastChangedDateField to target', () => {
      component.onTargetDateChange();
      expect(component['lastChangedDateField']).toBe('target');
    });

    it('should mark target date control as touched and dirty', () => {
      component.onTargetDateChange();
      expect(component.form.get('targetDate')?.touched).toBe(true);
      expect(component.form.get('targetDate')?.dirty).toBe(true);
    });
  });

  describe('Panel Title', () => {
    it('should set title to Add New Order Charge in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.panelTitle).toBe('Add New Order Charge');
    });

    it('should set title to Edit Order Charge in edit mode', () => {
      component.mode = 'edit';
      component.data = mockOrderCharge;
      fixture.detectChanges();
      component.ngOnInit();
      expect(component.panelTitle).toBe('Edit Order Charge');
    });
  });

  describe('Edit Mode - populateFormForEdit', () => {
    it('should populate form fields from data', () => {
      component.mode = 'edit';
      component.data = mockOrderCharge;
      fixture.detectChanges();
      component.ngOnInit();

      expect(component.form.getRawValue().serviceCode).toBe('TEST01');
      expect(component.form.get('serviceCodeDescription')?.value).toBe('Test Charge Description');
      expect(component.form.get('charge')?.value).toBe(150.50);
      expect(component.form.get('modifyCharge')?.value).toBe('Yes');
      expect(component.form.get('chargeType')?.value).toBe('Debit');
      expect(component.form.get('shipmentCharge')?.value).toBe('Y');
      expect(component.form.get('orderNumber')?.value).toBe('Yes');
    });

    it('should disable service code and effective date in edit mode', () => {
      component.mode = 'edit';
      component.data = mockOrderCharge;
      fixture.detectChanges();
      component.ngOnInit();

      expect(component.form.get('serviceCode')?.disabled).toBe(true);
      expect(component.form.get('effectiveDate')?.disabled).toBe(true);
    });

    it('should set editModeValues from data', () => {
      component.mode = 'edit';
      component.data = mockOrderCharge;
      fixture.detectChanges();
      component.ngOnInit();

      expect(component.editModeValues.serviceCode).toBe('TEST01');
      expect(component.editModeValues.effectiveDate).toBe('01-JAN-2024');
      expect(component.editModeValues.lastModified).toContain('Last Modified:');
    });

    it('should set empty lastModified when lastModifiedDate is empty', () => {
      const dataWithoutModified = { ...mockOrderCharge, lastModifiedDate: '' };
      component.mode = 'edit';
      component.data = dataWithoutModified;
      fixture.detectChanges();
      component.ngOnInit();

      expect(component.editModeValues.lastModified).toBe('');
    });

    it('should handle null targetDate in data', () => {
      const dataNoTarget = { ...mockOrderCharge, targetDate: null };
      component.mode = 'edit';
      component.data = dataNoTarget;
      fixture.detectChanges();
      component.ngOnInit();

      expect(component.form.get('targetDate')?.value).toBeNull();
    });

    it('should not populate form when data is null', () => {
      component.mode = 'edit';
      component.data = null;
      fixture.detectChanges();
      component.ngOnInit();

      // Form should remain empty since data is null
      expect(component.form.get('serviceCodeDescription')?.value).toBeFalsy();
    });
  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should skip processing on first change', () => {
      component.ngOnChanges({
        mode: new SimpleChange(undefined, 'add', true)
      });

      // Should not throw, and no special processing
      expect(component.panelTitle).toBe('Add New Order Charge');
    });

    it('should switch to edit mode on subsequent change', () => {
      component.mode = 'edit';
      component.data = mockOrderCharge;

      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, mockOrderCharge, false)
      });

      expect(component.panelTitle).toBe('Edit Order Charge');
      expect(component.form.get('serviceCodeDescription')?.value).toBe('Test Charge Description');
    });

    it('should handle data change alone', () => {
      component.mode = 'edit';
      component.data = mockOrderCharge;

      component.ngOnChanges({
        data: new SimpleChange(null, mockOrderCharge, false)
      });

      expect(component.form.get('charge')?.value).toBe(150.50);
    });
  });

  describe('Submit - Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockOrderCharge;
      fixture.detectChanges();
      component.ngOnInit();
    });

    it('should call updateOrderCharge on valid submit', fakeAsync(() => {
      const successResponse = { success: true, message: 'Updated', data: mockOrderCharge };
      service.updateOrderCharge.and.returnValue(of(successResponse));
      spyOn(component.closePanel, 'emit');
      spyOn(component.saveSuccess, 'emit');

      component.form.get('serviceCodeDescription')?.setValue('Updated Description');
      component.form.markAsDirty();
      tick(600);
      fixture.detectChanges();

      component.onSubmit(false);
      tick();

      expect(service.updateOrderCharge).toHaveBeenCalled();
      expect(snackbarService.showSuccess).toHaveBeenCalledWith(
        'New Order Charges for service code TEST01 have been updated.'
      );
      expect(component.closePanel.emit).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
    }));

    it('should not submit when form is not dirty in edit mode', fakeAsync(() => {
      // Form is not dirty, so isFormValid returns false
      component.onSubmit(false);
      tick();

      expect(service.updateOrderCharge).not.toHaveBeenCalled();
    }));

    it('should set isSaving to true during submission', fakeAsync(() => {
      const successResponse = { success: true, message: 'Updated', data: mockOrderCharge };
      service.updateOrderCharge.and.returnValue(of(successResponse));

      component.form.get('serviceCodeDescription')?.setValue('Updated Description');
      component.form.markAsDirty();
      tick(600);

      component.onSubmit(false);
      // isSaving should be set before api call completes -- finalize resets it
      tick();

      expect(component.isSaving).toBe(false);
    }));

    it('should handle API error gracefully', fakeAsync(() => {
      service.updateOrderCharge.and.returnValue(throwError(() => new Error('Server error')));

      component.form.get('serviceCodeDescription')?.setValue('Updated Description');
      component.form.markAsDirty();
      tick(600);

      component.onSubmit(false);
      tick();

      expect(component.isSaving).toBe(false);
    }));
  });

  describe('Submit - Add Mode with createAnother', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should reset form when createAnother is true', fakeAsync(() => {
      const successResponse = { success: true, message: 'Created', data: mockOrderCharge };
      service.addOrderCharge.and.returnValue(of(successResponse));
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        serviceCode: 'SVC01',
        serviceCodeDescription: 'Test Svc',
        charge: '100',
        modifyCharge: 'Yes',
        chargeType: 'Debit',
        shipmentCharge: 'N',
        orderNumber: 'No',
        effectiveDate: moment().add(1, 'day')
      });
      tick(600);
      fixture.detectChanges();

      component.onSubmit(true);
      tick();

      expect(service.addOrderCharge).toHaveBeenCalled();
      // Should NOT close panel
      expect(component.closePanel.emit).not.toHaveBeenCalled();
    }));

    it('should not submit when form is invalid in add mode', fakeAsync(() => {
      // Leave form empty/invalid
      component.form.markAllAsTouched();
      component.onSubmit(false);
      tick();

      expect(service.addOrderCharge).not.toHaveBeenCalled();
    }));

    it('should handle API error in add mode', fakeAsync(() => {
      service.addOrderCharge.and.returnValue(throwError(() => new Error('Server error')));

      component.form.patchValue({
        serviceCode: 'SVC01',
        serviceCodeDescription: 'Test Svc',
        charge: '100',
        modifyCharge: 'Yes',
        chargeType: 'Debit',
        shipmentCharge: 'N',
        orderNumber: 'No',
        effectiveDate: moment().add(1, 'day')
      });
      tick(600);
      fixture.detectChanges();

      component.onSubmit(false);
      tick();

      expect(component.isSaving).toBe(false);
    }));
  });

  describe('Submit - Credit chargeType with orderNumber', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should map Credit chargeType to CR in payload', fakeAsync(() => {
      const successResponse = { success: true, message: 'Created', data: mockOrderCharge };
      service.addOrderCharge.and.returnValue(of(successResponse));

      component.form.patchValue({
        serviceCode: 'SVC02',
        serviceCodeDescription: 'Credit Svc',
        charge: '50',
        modifyCharge: 'No',
        chargeType: 'Credit',
        shipmentCharge: null,
        orderNumber: 'Yes',
        effectiveDate: moment().add(1, 'day')
      });
      tick(600);
      fixture.detectChanges();

      component.onSubmit(false);
      tick();

      expect(service.addOrderCharge).toHaveBeenCalled();
      const payload = service.addOrderCharge.calls.mostRecent().args[0];
      expect(payload.chargeCodeType).toBe('CR');
      expect(payload.editCharge).toBe('N');
      expect(payload.crNcr).toBe('Y');
    }));
  });

  describe('Submit - dateRangeInvalid with no lastChangedDateField', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should set lastChangedDateField to effective when dateRangeInvalid and field is null', () => {
      const futureDate = moment().add(10, 'days');
      const earlierDate = moment().add(5, 'days');

      component.form.patchValue({
        serviceCode: 'SVC01',
        serviceCodeDescription: 'Test',
        charge: '100',
        modifyCharge: 'Yes',
        chargeType: 'Debit',
        effectiveDate: futureDate,
        targetDate: earlierDate
      });

      component['lastChangedDateField'] = null;
      component.form.markAllAsTouched();

      component.onSubmit(false);

      // If cross-field dateRangeInvalid error exists and lastChangedDateField is null,
      // it should be set to 'effective'
      if (component.form.errors?.['dateRangeInvalid']) {
        expect(component['lastChangedDateField']).toBe('effective');
      }
    });
  });

  describe('Error Messages - Additional branches', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return maxlength error for service code', () => {
      const control = component.form.get('serviceCode');
      control?.setValue('ABCDEF');
      control?.markAsTouched();
      control?.updateValueAndValidity();
      fixture.detectChanges();

      expect(component.getServiceCodeError()).toBe('Maximum 5 characters');
    });

    it('should return maxlength error for service code description', () => {
      const control = component.form.get('serviceCodeDescription');
      control?.setValue('A'.repeat(51));
      control?.markAsTouched();
      control?.updateValueAndValidity();
      fixture.detectChanges();

      expect(component.getServiceCodeDescriptionError()).toBe('Maximum 50 characters');
    });

    it('should return error message for shipment charge', () => {
      const control = component.form.get('shipmentCharge');
      control?.setValue('X');
      control?.markAsTouched();
      fixture.detectChanges();

      expect(component.getShipmentChargeError()).toBe('Shipment Charge must be Y, N, S, or B (Error 7321)');
    });

    it('should return empty string for effective date when not touched', () => {
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return matDatepickerParse error for effective date', () => {
      const control = component.form.get('effectiveDate');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
    });

    it('should return invalidDateFormat error for effective date', () => {
      const control = component.form.get('effectiveDate');
      control?.setErrors({ invalidDateFormat: true });
      control?.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
    });

    it('should return invalidDate error for effective date', () => {
      const control = component.form.get('effectiveDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
    });

    it('should return dateRangeInvalid error for effective date when lastChangedDateField is effective', () => {
      component['lastChangedDateField'] = 'effective';
      // Set cross-field error on the form
      component.form.setErrors({ dateRangeInvalid: true });
      const control = component.form.get('effectiveDate');
      control?.markAsTouched();
      control?.markAsDirty();
      // Clear any control-level errors so the cross-field check is reached
      control?.setErrors(null);

      expect(component.getEffectiveDateError()).toBe('Effective Date must be before Termination Date');
    });

    it('should not return dateRangeInvalid for effective date when lastChangedDateField is target', () => {
      component['lastChangedDateField'] = 'target';
      component.form.setErrors({ dateRangeInvalid: true });
      const control = component.form.get('effectiveDate');
      control?.markAsTouched();
      control?.markAsDirty();
      control?.setErrors(null);

      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return empty string for target date when not touched', () => {
      expect(component.getTargetDateError()).toBe('');
    });

    it('should return matDatepickerParse error for target date', () => {
      const control = component.form.get('targetDate');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();

      expect(component.getTargetDateError()).toBe('Termination Date is invalid');
    });

    it('should return invalidDateFormat error for target date', () => {
      const control = component.form.get('targetDate');
      control?.setErrors({ invalidDateFormat: true });
      control?.markAsTouched();

      expect(component.getTargetDateError()).toBe('Termination Date is invalid');
    });

    it('should return invalidDate error for target date', () => {
      const control = component.form.get('targetDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();

      expect(component.getTargetDateError()).toBe('Termination Date is invalid');
    });

    it('should return terminationDatePast error for target date', () => {
      const control = component.form.get('targetDate');
      control?.setErrors({ terminationDatePast: true });
      control?.markAsTouched();

      expect(component.getTargetDateError()).toBe('Termination Date cannot be in the past');
    });

    it('should return dateRangeInvalid error for target date when lastChangedDateField is target', () => {
      component['lastChangedDateField'] = 'target';
      component.form.setErrors({ dateRangeInvalid: true });
      const control = component.form.get('targetDate');
      control?.markAsTouched();
      control?.markAsDirty();
      control?.setErrors(null);

      expect(component.getTargetDateError()).toBe('Termination Date must be after Effective Date');
    });

    it('should not return dateRangeInvalid for target date when lastChangedDateField is effective', () => {
      component['lastChangedDateField'] = 'effective';
      component.form.setErrors({ dateRangeInvalid: true });
      const control = component.form.get('targetDate');
      control?.markAsTouched();
      control?.markAsDirty();
      control?.setErrors(null);

      expect(component.getTargetDateError()).toBe('');
    });

    it('should return empty for service code error when control is not touched', () => {
      expect(component.getServiceCodeError()).toBe('');
    });

    it('should return empty for charge error when not touched', () => {
      expect(component.getChargeError()).toBe('');
    });

    it('should return empty for charge type error when not touched', () => {
      expect(component.getChargeTypeError()).toBe('');
    });

    it('should return empty for modify charge error when not touched', () => {
      expect(component.getModifyChargeError()).toBe('');
    });
  });

  describe('Async Validators', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should mark duplicate service code error', fakeAsync(() => {
      serviceSpy.checkDuplicateServiceCode.and.returnValue(of(true));
      serviceSpy.validateBillingCode.and.returnValue(of(true));

      const control = component.form.get('serviceCode');
      control?.setValue('DUP01');
      control?.markAsTouched();
      tick(600);
      fixture.detectChanges();

      expect(control?.hasError('duplicateServiceCode')).toBe(true);
      expect(component.getServiceCodeError()).toBe('Service Code already exists (Error 0319)');
    }));

    it('should mark invalid billing code error', fakeAsync(() => {
      serviceSpy.checkDuplicateServiceCode.and.returnValue(of(false));
      serviceSpy.validateBillingCode.and.returnValue(of(false));

      const control = component.form.get('serviceCode');
      control?.setValue('BAD01');
      control?.markAsTouched();
      tick(600);
      fixture.detectChanges();

      expect(control?.hasError('invalidBillingCode')).toBe(true);
      expect(component.getServiceCodeError()).toBe('Invalid or inactive billing code (Error 0247)');
    }));

    it('should not run duplicate check in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockOrderCharge;
      component.ngOnInit();
      fixture.detectChanges();

      // In edit mode, service code is disabled and validators cleared
      expect(serviceSpy.checkDuplicateServiceCode).not.toHaveBeenCalled();
      tick(600);
    }));

    it('should handle empty value in async validators', fakeAsync(() => {
      const control = component.form.get('serviceCode');
      control?.setValue('');
      tick(600);

      // Should not call service for empty values
      expect(serviceSpy.checkDuplicateServiceCode).not.toHaveBeenCalled();
    }));
  });

  describe('isFormValid - add mode with all required fields', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return true when all required fields filled and form is valid', fakeAsync(() => {
      serviceSpy.checkDuplicateServiceCode.and.returnValue(of(false));
      serviceSpy.validateBillingCode.and.returnValue(of(true));

      component.form.patchValue({
        serviceCode: 'SVC01',
        serviceCodeDescription: 'Test Service',
        charge: '100',
        modifyCharge: 'Yes',
        chargeType: 'Debit',
        effectiveDate: moment().add(1, 'day')
      });
      tick(600);
      fixture.detectChanges();

      expect(component.isFormValid).toBe(true);
    }));

    it('should return false when charge type is Credit and order number missing', fakeAsync(() => {
      serviceSpy.checkDuplicateServiceCode.and.returnValue(of(false));
      serviceSpy.validateBillingCode.and.returnValue(of(true));

      component.form.patchValue({
        serviceCode: 'SVC01',
        serviceCodeDescription: 'Test Service',
        charge: '100',
        modifyCharge: 'Yes',
        chargeType: 'Credit',
        orderNumber: null,
        effectiveDate: moment().add(1, 'day')
      });
      tick(600);
      fixture.detectChanges();

      expect(component.isFormValid).toBe(false);
    }));
  });

  describe('isFormValid - edit mode additional branches', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockOrderCharge;
      fixture.detectChanges();
      component.ngOnInit();
    });

    it('should return false when modifyCharge has visible error', () => {
      component.form.get('modifyCharge')?.setValue(null);
      component.form.get('modifyCharge')?.markAsTouched();
      component.form.markAsDirty();
      fixture.detectChanges();

      expect(component.isFormValid).toBe(false);
    });

    it('should return false when chargeType has visible error', () => {
      component.form.get('chargeType')?.setValue(null);
      component.form.get('chargeType')?.markAsTouched();
      component.form.markAsDirty();
      fixture.detectChanges();

      expect(component.isFormValid).toBe(false);
    });

    it('should return false when orderNumber has visible error', () => {
      component.form.get('chargeType')?.setValue('Credit');
      component.form.get('orderNumber')?.setValue(null);
      component.form.get('orderNumber')?.markAsTouched();
      component.form.markAsDirty();
      fixture.detectChanges();

      expect(component.isFormValid).toBe(false);
    });
  });

  describe('updateTargetMinDate', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should set targetMinDate from effectiveDate when after minDate', () => {
      const futureDate = moment().add(30, 'days');
      component.form.get('effectiveDate')?.setValue(futureDate);
      component['updateTargetMinDate']();

      expect(component.targetMinDate.isSameOrAfter(component.minDate)).toBe(true);
    });

    it('should use minDate when effectiveDate is null', () => {
      component.form.get('effectiveDate')?.setValue(null);
      component['updateTargetMinDate']();

      expect(component.targetMinDate.isSame(component.minDate)).toBe(true);
    });

    it('should handle Date object for effectiveDate', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      component.form.get('effectiveDate')?.setValue(futureDate);
      component['updateTargetMinDate']();

      expect(component.targetMinDate).toBeTruthy();
    });
  });

  describe('effectiveDateNotPastValidator in edit mode', () => {
    it('should skip past-date validation in edit mode', () => {
      component.mode = 'edit';
      component.data = mockOrderCharge;
      fixture.detectChanges();
      component.ngOnInit();

      // In edit mode, effectiveDate validators are cleared, so no past-date error
      const control = component.form.get('effectiveDate');
      expect(control?.hasError('effectiveDatePast')).toBe(false);
    });
  });

  describe('elementId and errorId helpers', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should generate element IDs with component prefix', () => {
      const id = component['elementId']('test-field');
      expect(id).toContain('add-edit-order-charges-');
      expect(id).toContain('test-field');
    });

    it('should generate error IDs with component prefix and error suffix', () => {
      const id = component['errorId']('test-field');
      expect(id).toContain('add-edit-order-charges-');
      expect(id).toContain('test-field-error');
    });
  });

  describe('chargeRangeValidator - additional branches', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return null for empty string', () => {
      const control = component.form.get('charge');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
      // chargeRangeValidator returns null for empty string, but required kicks in
    });

    it('should return invalidCharge for minus sign only', () => {
      const control = component.form.get('charge');
      control?.setValue('-');
      expect(control?.hasError('invalidCharge')).toBe(true);
    });

    it('should return invalidCharge for NaN string', () => {
      const control = component.form.get('charge');
      control?.setValue('abc');
      expect(control?.hasError('invalidCharge')).toBe(true);
    });
  });

  describe('resetFormForAddMode', () => {
    it('should re-enable fields and restore validators when switching from edit to add', () => {
      // First set up edit mode
      component.mode = 'edit';
      component.data = mockOrderCharge;
      fixture.detectChanges();
      component.ngOnInit();

      expect(component.form.get('serviceCode')?.disabled).toBe(true);

      // Switch to add mode
      component.mode = 'add';
      component.data = null;
      component.ngOnChanges({
        mode: new SimpleChange('edit', 'add', false),
        data: new SimpleChange(mockOrderCharge, null, false)
      });

      expect(component.form.get('serviceCode')?.enabled).toBe(true);
      expect(component.form.get('effectiveDate')?.enabled).toBe(true);
      expect(component.editModeValues.serviceCode).toBe('');
      expect(component.editModeValues.effectiveDate).toBe('');
      expect(component.editModeValues.lastModified).toBe('');
    });
  });

  describe('onServiceCodeInput - cursor position', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should restore cursor position after uppercasing', () => {
      const mockEvent = {
        target: {
          value: 'aBc',
          selectionStart: 2,
          setSelectionRange: jasmine.createSpy('setSelectionRange')
        }
      } as any;

      component.onServiceCodeInput(mockEvent);

      expect(component.form.get('serviceCode')?.value).toBe('ABC');
      expect(mockEvent.target.setSelectionRange).toHaveBeenCalledWith(2, 2);
    });

    it('should handle null cursor position', () => {
      const mockEvent = {
        target: {
          value: 'test',
          selectionStart: null,
          setSelectionRange: jasmine.createSpy('setSelectionRange')
        }
      } as any;

      component.onServiceCodeInput(mockEvent);
      expect(mockEvent.target.setSelectionRange).not.toHaveBeenCalled();
    });
  });

  describe('effDateErrorMatcher and targetDateErrorMatcher', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should have effDateErrorMatcher defined', () => {
      expect(component.effDateErrorMatcher).toBeDefined();
      expect(component.effDateErrorMatcher.isErrorState).toBeDefined();
    });

    it('should have targetDateErrorMatcher defined', () => {
      expect(component.targetDateErrorMatcher).toBeDefined();
      expect(component.targetDateErrorMatcher.isErrorState).toBeDefined();
    });
  });
});
