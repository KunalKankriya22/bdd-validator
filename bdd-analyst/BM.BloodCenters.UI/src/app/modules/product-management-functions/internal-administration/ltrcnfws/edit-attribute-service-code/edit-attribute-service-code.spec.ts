import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

import { EditAttributeServiceCodeComponent } from './edit-attribute-service-code';
import { AttributeServiceCodeApiService } from '../services/attribute-service-code-api.service';
import { AttributeServiceCodeModel } from '../models/attribute-service-code.model';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('EditAttributeServiceCodeComponent', () => {
  let component: EditAttributeServiceCodeComponent;
  let fixture: ComponentFixture<EditAttributeServiceCodeComponent>;
  let apiServiceSpy: jasmine.SpyObj<AttributeServiceCodeApiService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  const mockData: AttributeServiceCodeModel = {
    attribGroup: 'BLOOD',
    attribCode: '1234',
    attribDesc: 'RED BLOOD CELLS | AS3/450mL/refq | Open',
    attribCustom: 'Y',
    normalStockFlag: 'N',
    price: 125.50,
    serviceCode: 'SVC001',
    creditFlag: 'Y',
    lastModifiedDate: '2026-05-30T10:30:00Z',
    programId: 'SFIATTR'
  };

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('AttributeServiceCodeApiService', [
      'updateAttributeServiceCode'
    ]);
    snackBarSpy = createMockMatSnackBar();



      TestBed.configureTestingModule({
      imports: [EditAttributeServiceCodeComponent, NoopAnimationsModule],
      providers: [
        { provide: AttributeServiceCodeApiService, useValue: apiServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    });


    


      apiServiceSpy.updateAttributeServiceCode.calls.reset();


    fixture = TestBed.createComponent(EditAttributeServiceCodeComponent);
    component = fixture.componentInstance;
    component.data = mockData;


    });

  describe('Component Initialization', () => {




    it('should populate form when data is provided', () => {
      component.ngOnChanges();
      fixture.detectChanges();

      expect(component.form.get('attribCode')?.value).toBe('1234');
      expect(component.form.get('attribDesc')?.value).toBe(mockData.attribDesc);
      expect(component.form.get('price')?.value).toBe(125.50);
      expect(component.form.get('serviceCode')?.value).toBe('SVC001');
      expect(component.form.get('creditFlag')?.value).toBe('Y');
    });


  });

  describe('Form Validation', () => {
    beforeEach(() => {
      component.ngOnChanges();
      fixture.detectChanges();
    });

    it('should validate price minimum value', () => {
      component.form.get('price')?.setValue(-1);
      expect(component.form.get('price')?.hasError('min')).toBeTrue();
    });

    it('should validate price maximum value', () => {
      component.form.get('price')?.setValue(10000000000);
      expect(component.form.get('price')?.hasError('max')).toBeTrue();
    });

    it('should allow price up to 9999999999.99', () => {
      component.form.get('price')?.setValue(9999999999.99);
      expect(component.form.get('price')?.hasError('max')).toBeFalse();
    });

    it('should validate price pattern (10 digits, 2 decimals)', () => {
      component.form.get('price')?.setValue('invalid');
      expect(component.form.get('price')?.hasError('pattern')).toBeTrue();
    });

    it('should validate service code max length', () => {
      component.form.get('serviceCode')?.setValue('123456789');
      expect(component.form.get('serviceCode')?.hasError('maxlength')).toBeTrue();
    });

    it('should accept valid service code', () => {
      component.form.get('serviceCode')?.setValue('SVC12345');
      expect(component.form.get('serviceCode')?.valid).toBeTrue();
    });

    it('should accept valid price', () => {
      component.form.get('price')?.setValue(1234.56);
      expect(component.form.get('price')?.valid).toBeTrue();
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      component.ngOnChanges();
      fixture.detectChanges();
    });



    it('should submit valid form data', fakeAsync(() => {
      apiServiceSpy.updateAttributeServiceCode.and.returnValue(of({}));
      spyOn(component.saved, 'emit');

      component.form.patchValue({
        price: 150.00,
        serviceCode: 'NEW001',
        creditFlag: 'N'
      });

      component.onSubmit();
      tick();

      expect(apiServiceSpy.updateAttributeServiceCode).toHaveBeenCalledWith(
        'BLOOD',
        '1234',
        {
          price: 150.00,
          serviceCode: 'NEW001',
          creditFlag: 'N'
        }
      );
      expect(component.saved.emit).toHaveBeenCalled();
    }));

    it('should show success message on successful save', fakeAsync(() => {
      apiServiceSpy.updateAttributeServiceCode.and.returnValue(of({}));

      component.onSubmit();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Changes in master code 1234 have been saved.',
        'DISMISS',
        jasmine.objectContaining({
          horizontalPosition: 'end',
          verticalPosition: 'top'
        })
      );
    }));



    it('should set loading state during submission', fakeAsync(() => {
      const subject = new Subject<{}>();
      apiServiceSpy.updateAttributeServiceCode.and.returnValue(subject.asObservable());

      expect((component as any).loading()).toBe(false);

      component.onSubmit();
      expect((component as any).loading()).toBe(true);

      subject.next({});
      subject.complete();
      tick();
      expect((component as any).loading()).toBe(false);
    }));
  });

  describe('Clear All Functionality', () => {
    beforeEach(() => {
      component.ngOnChanges();
      fixture.detectChanges();
    });

    it('should clear all editable fields', () => {
      component.form.patchValue({
        price: 150.00,
        serviceCode: 'TEST123',
        creditFlag: 'Y'
      });

      component.onClearAll();

      expect(component.form.get('price')?.value).toBeNull();
      expect(component.form.get('serviceCode')?.value).toBe('');
      expect(component.form.get('creditFlag')?.value).toBe('');
    });



    it('should not clear read-only fields', () => {
      const originalCode = component.form.get('attribCode')?.value;
      const originalDesc = component.form.get('attribDesc')?.value;

      component.onClearAll();

      expect(component.form.get('attribCode')?.value).toBe(originalCode);
      expect(component.form.get('attribDesc')?.value).toBe(originalDesc);
    });
  });

  describe('Close Panel', () => {


    it('should reset form on close', () => {
      component.ngOnChanges();
      fixture.detectChanges();

      component.form.patchValue({
        price: 999.99,
        serviceCode: 'TEST',
        creditFlag: 'Y'
      });

      component.close();

      expect(component.form.pristine).toBeTrue();
    });


  });

  describe('Numeric Input Handling', () => {
    it('should allow numeric keys', () => {
      const event = new KeyboardEvent('keypress');
      Object.defineProperty(event, 'which', { value: 53 });
      const result = component.onlyNumbers(event);
      expect(result).toBeTrue();
    });

    it('should block non-numeric keys', () => {
      const event = new KeyboardEvent('keypress');
      Object.defineProperty(event, 'which', { value: 65 });
      spyOn(event, 'preventDefault');

      const result = component.onlyNumbers(event);

      expect(result).toBeFalse();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow decimal point', () => {
      const event = new KeyboardEvent('keypress');
      Object.defineProperty(event, 'which', { value: 110 });
      const result = component.onlyNumbers(event);
      expect(result).toBeTrue();
    });

    it('should allow control keys (backspace, delete)', () => {
      const backspaceEvent = new KeyboardEvent('keypress');
      Object.defineProperty(backspaceEvent, 'which', { value: 8 });
      expect(component.onlyNumbers(backspaceEvent)).toBeTrue();

      const deleteEvent = new KeyboardEvent('keypress');
      Object.defineProperty(deleteEvent, 'which', { value: 46 });
      expect(component.onlyNumbers(deleteEvent)).toBeTrue();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      component.ngOnChanges();
      fixture.detectChanges();
    });





    it('should have unique IDs for all form fields', () => {
      const priceInput = fixture.debugElement.query(By.css(`[id$="-price"]`));
      const serviceCodeInput = fixture.debugElement.query(By.css(`[id$="-serviceCode"]`));

      expect(priceInput).toBeTruthy();
      expect(serviceCodeInput).toBeTruthy();
      expect(priceInput.nativeElement.id).not.toBe(serviceCodeInput.nativeElement.id);
    });


  });

  describe('Multiple Instances', () => {


    it('should generate unique element IDs across instances', () => {
      const fixture2 = TestBed.createComponent(EditAttributeServiceCodeComponent);
      const component2 = fixture2.componentInstance;

      expect((component as any).elementId('price')).not.toBe((component2 as any).elementId('price'));
    });
  });
});
