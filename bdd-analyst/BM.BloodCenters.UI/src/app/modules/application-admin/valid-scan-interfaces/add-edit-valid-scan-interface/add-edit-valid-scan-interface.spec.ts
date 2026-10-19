import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { SnackbarService } from '@shared/services/snackbar.service';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { fakeAsync, tick } from '@angular/core/testing';
import moment from 'moment';

import { AddEditValidScanInterface } from './add-edit-valid-scan-interface';
import { ValidScanInterfaceService } from '../services/valid-scan-interface.service';
import { ValidScanInterfaceModel } from '../models/valid-scan-interface.model';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('AddEditValidScanInterface', () => {
  let serviceSpy: any;
  let component: AddEditValidScanInterface;
  let fixture: ComponentFixture<AddEditValidScanInterface>;
  let validScanInterfaceService: jasmine.SpyObj<ValidScanInterfaceService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('ValidScanInterfaceService', [
      'addValidScanInterface',
      'updateValidScanInterface',
      'getScanTypeLookup'
    ]);
    serviceSpy.getScanTypeLookup.and.returnValue(of([]));
    const snackBarSpy = createMockSnackbarService();



      TestBed.configureTestingModule({
      imports: [
        AddEditValidScanInterface,
        ReactiveFormsModule
      ],
      providers: [
        { provide: ValidScanInterfaceService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackBarSpy },
        provideAnimations(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });


    


      serviceSpy.addValidScanInterface.calls.reset();


      serviceSpy.updateValidScanInterface.calls.reset();


    validScanInterfaceService = TestBed.inject(ValidScanInterfaceService) as jasmine.SpyObj<ValidScanInterfaceService>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;


    
    fixture = TestBed.createComponent(AddEditValidScanInterface);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  describe('Form Initialization', () => {


    it('should initialize form with data in edit mode', () => {
      const mockData: ValidScanInterfaceModel = {
        scanType: 'TYPE1',
        startCount: 2,
        startCode: 'AB',
        stopSize: 1,
        stopCode: 'X',
        stringSize: 10,
        effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD')),
        terminationDate: null,
        modificationDate: new Date()
      };

      component.mode = 'edit';
      component.data = mockData;
      component.ngOnInit();

      expect(component.form.get('scanType')?.value).toBe('TYPE1');
      expect(component.form.get('startCount')?.value).toBe(2);
      expect(component.form.get('scanType')?.disabled).toBe(true);
      expect(component.panelTitle).toBe('Edit Scale Configuration');
    });
  });

  describe('Form Validation', () => {


    it('should validate positive integer for numeric fields', () => {
      const startCountControl = component.form.get('startCount');

      startCountControl?.setValue(-1);
      expect(startCountControl?.hasError('positiveInteger')).toBe(true);

      startCountControl?.setValue(0);
      expect(startCountControl?.hasError('positiveInteger')).toBe(true);

      startCountControl?.setValue(5);
      expect(startCountControl?.hasError('positiveInteger')).toBe(false);
    });


  });

  describe('Save Functionality', () => {



    it('should call addValidScanInterface and show success snackbar on save in add mode', fakeAsync(() => {
      validScanInterfaceService.addValidScanInterface.and.returnValue(
        of({ success: true, message: 'Record created successfully' })
      );
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.mode = 'add';
      component.form.patchValue({
        scanType: 'TYPE1',
        startCount: 2,
        startCode: 'AB',
        stopSize: 1,
        stopCode: 'X',
        stringSize: 10,
        effectiveDate: moment().add(1, 'day'),
        terminationDate: null
      });

      component.onSave();
      tick();

      expect(validScanInterfaceService.addValidScanInterface).toHaveBeenCalled();
      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Record created successfully');
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));

    it('should call updateValidScanInterface on save in edit mode', fakeAsync(() => {
      const mockRecord: ValidScanInterfaceModel = {
        scanType: 'TYPE1', startCount: 2, startCode: 'AB',
        stopSize: 1, stopCode: 'X', stringSize: 10,
        effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD')), terminationDate: null, modificationDate: new Date()
      };

      validScanInterfaceService.updateValidScanInterface.and.returnValue(
        of({ success: true, message: 'Record updated successfully' })
      );
      spyOn(component.saveSuccess, 'emit');

      component.mode = 'edit';
      component.data = mockRecord;
      component.ngOnInit();
      component.form.get('startCount')?.setValue(5);

      component.onSave();
      tick();

      expect(validScanInterfaceService.updateValidScanInterface).toHaveBeenCalled();
      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Record updated successfully');
    }));
  });

  describe('Save and Create Another', () => {
    it('should reset form after save and create another in add mode', fakeAsync(() => {
      validScanInterfaceService.addValidScanInterface.and.returnValue(
        of({ success: true, message: 'Created' })
      );
      spyOn(component.closePanel, 'emit');
      spyOn(component.saveSuccess, 'emit');

      component.mode = 'add';
      component.form.patchValue({
        scanType: 'TYPE1', startCount: 2, startCode: 'AB',
        stopSize: 1, stopCode: 'X', stringSize: 10,
        effectiveDate: moment().add(1, 'day')
      });

      component.onSaveAndCreateAnother();
      tick();

      expect(validScanInterfaceService.addValidScanInterface).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).not.toHaveBeenCalled();
    }));

    it('should switch to add mode after save and create another in edit mode', fakeAsync(() => {
      const mockRecord: ValidScanInterfaceModel = {
        scanType: 'TYPE1', startCount: 2, startCode: 'AB',
        stopSize: 1, stopCode: 'X', stringSize: 10,
        effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD')), terminationDate: null, modificationDate: new Date()
      };

      validScanInterfaceService.updateValidScanInterface.and.returnValue(
        of({ success: true, message: 'Updated' })
      );
      spyOn(component.modeChange, 'emit');

      component.mode = 'edit';
      component.data = mockRecord;
      component.ngOnInit();
      component.form.get('startCount')?.setValue(5);

      component.onSaveAndCreateAnother();
      tick();

      expect(component.mode).toBe('add');
      expect(component.modeChange.emit).toHaveBeenCalledWith('add');
    }));
  });
  describe('Error Messages', () => {
    it('should return correct error message for scan type', () => {
      const control = component.form.get('scanType');
      control?.markAsTouched();
      control?.setValue('');

      expect(component.getScanTypeError()).toBe('Scan Type is required');
    });

    it('should return correct error message for leading char count', () => {
      const control = component.form.get('startCount');
      control?.markAsTouched();
      control?.setValue(-1);

      expect(component.getLeadingCharCountError()).toBe('Must be a positive integer');
    });

    it('should return correct error message for termination date', () => {
      const effectiveControl = component.form.get('effectiveDate');
      const terminationControl = component.form.get('terminationDate');

      effectiveControl?.setValue(moment().add(100, 'days'));
      terminationControl?.setValue(moment().add(10, 'days'));
      terminationControl?.markAsTouched();

      component.form.updateValueAndValidity();

      expect(component.getTerminationDateError()).toBe('Termination Date must be greater than or equal to Effective Date');
    });
  });

  describe('Scan Type uppercase conversion', () => {
    it('should convert lowercase input to uppercase', () => {
      const input = document.createElement('input');
      input.value = 'abc';
      const event = { target: input } as any;

      component.onScanTypeInput(event);

      expect(input.value).toBe('ABC');
      expect(component.form.get('scanType')?.value).toBe('ABC');
    });

    it('should not modify already uppercase input', () => {
      const input = document.createElement('input');
      input.value = 'TYPE1';
      const event = { target: input } as any;

      component.onScanTypeInput(event);

      expect(input.value).toBe('TYPE1');
    });

    it('should convert mixed case to uppercase', () => {
      const input = document.createElement('input');
      input.value = 'aBc12';
      const event = { target: input } as any;

      component.onScanTypeInput(event);

      expect(input.value).toBe('ABC12');
      expect(component.form.get('scanType')?.value).toBe('ABC12');
    });
  });

  describe('character validation VARCHAR2(5)', () => {


    it('should not truncate leading characters up to 5', () => {
      const input = document.createElement('input');
      input.value = 'ABCDE';
      const event = { target: input } as any;

      component.onLeadingCharactersInput(event);

      // Should not modify input or form when length <= 5
      expect(input.value).toBe('ABCDE');
    });



    it('should not truncate trailing characters up to 5', () => {
      const input = document.createElement('input');
      input.value = '12345';
      const event = { target: input } as any;

      component.onTrailingCharactersInput(event);

      // Should not modify input or form when length <= 5
      expect(input.value).toBe('12345');
    });




  });

  describe('numeric input NUMBER(2,0)', () => {
    it('should allow only digits in leading character count', () => {
      const input = document.createElement('input');
      input.value = 'abc25';
      const event = { target: input } as any;

      component.onLeadingCharCountInput(event);

      // Should remove non-digits and set value to 25
      expect(component.form.get('startCount')?.value).toBe(25);
    });





    it('should limit leading character count to 2 digits', () => {
      const input = document.createElement('input');
      input.value = '999';
      const event = { target: input } as any;

      component.onLeadingCharCountInput(event);

      expect(input.value.length).toBe(2);
    });

    it('should allow only digits in trailing character count', () => {
      const input = document.createElement('input');
      input.value = 'xyz35';
      const event = { target: input } as any;

      component.onTrailingCharCountInput(event);

      // Should remove non-digits and set value to 35
      expect(component.form.get('stopSize')?.value).toBe(35);
    });





    it('should limit trailing character count to 2 digits', () => {
      const input = document.createElement('input');
      input.value = '888';
      const event = { target: input } as any;

      component.onTrailingCharCountInput(event);

      expect(input.value.length).toBe(2);
    });




  });

  describe('string size NUMBER(2,0)', () => {
    it('should allow only digits in string size', () => {
      const input = document.createElement('input');
      input.value = 'abc50';
      const event = { target: input } as any;

      component.onStringSizeInput(event);

      expect(component.form.get('stringSize')?.value).toBe(50);
    });





    it('should limit string size to 2 digits', () => {
      const input = document.createElement('input');
      input.value = '1234';
      const event = { target: input } as any;

      component.onStringSizeInput(event);

      expect(input.value.length).toBeLessThanOrEqual(2);
    });



    it('should handle empty input for string size', () => {
      const input = document.createElement('input');
      input.value = '';
      const event = { target: input } as any;

      component.onStringSizeInput(event);

      // Empty input should not update form control
      expect(input.value).toBe('');
    });

    it('should remove non-numeric characters from string size', () => {
      const input = document.createElement('input');
      input.value = '3a5b';
      const event = { target: input } as any;

      component.onStringSizeInput(event);

      expect(component.form.get('stringSize')?.value).toBe(35);
    });
  });

  describe('input handlers edge cases', () => {
    it('should handle empty leading character count input', () => {
      const input = document.createElement('input');
      input.value = '';
      const event = { target: input } as any;

      component.onLeadingCharCountInput(event);

      expect(input.value).toBe('');
    });

    it('should handle empty trailing character count input', () => {
      const input = document.createElement('input');
      input.value = '';
      const event = { target: input } as any;

      component.onTrailingCharCountInput(event);

      expect(input.value).toBe('');
    });





    it('should handle all non-numeric characters in count field', () => {
      const input = document.createElement('input');
      input.value = 'abcdef';
      const event = { target: input } as any;

      component.onLeadingCharCountInput(event);

      expect(input.value).toBe('');
    });
  });
});
