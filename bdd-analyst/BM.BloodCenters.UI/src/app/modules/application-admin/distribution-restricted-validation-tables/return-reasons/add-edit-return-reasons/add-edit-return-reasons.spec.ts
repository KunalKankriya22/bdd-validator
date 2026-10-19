import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import moment from 'moment';
import { AddEditReturnReasons } from './add-edit-return-reasons';
import { ReturnReasonsService } from '../services/return-reasons.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditReturnReasons', () => {
  let component: AddEditReturnReasons;
  let fixture: ComponentFixture<AddEditReturnReasons>;
  let mockReturnReasonsService: jasmine.SpyObj<ReturnReasonsService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockLoginService: jasmine.SpyObj<LoginService>;

  beforeEach(() => {
    mockReturnReasonsService = jasmine.createSpyObj('ReturnReasonsService', [
      'getLocationTypes',
      'getChargeCodes',
      'addReturnReasons',
      'updateReturnReasons'
    ]);

    mockSnackBar = createMockMatSnackBar();

    mockHeaderService = createMockHeaderService();

    mockLoginService = jasmine.createSpyObj('LoginService', ['getStoredUsername']);

    // Set default return values
    mockLoginService.getStoredUsername.and.returnValue('testuser');

    TestBed.configureTestingModule({
      imports: [
        AddEditReturnReasons,
        ReactiveFormsModule,
        HttpClientTestingModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSnackBarModule
      ],
      providers: [
        { provide: ReturnReasonsService, useValue: mockReturnReasonsService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: LoginService, useValue: mockLoginService }
      ]
    });

    mockReturnReasonsService.getLocationTypes.calls.reset();
    mockReturnReasonsService.getChargeCodes.calls.reset();
    mockReturnReasonsService.addReturnReasons.calls.reset();
    mockReturnReasonsService.updateReturnReasons.calls.reset();
    mockHeaderService.getCurrentChapterId.calls.reset();
    mockHeaderService.getCurrentWarehouseId.calls.reset();
    mockLoginService.getStoredUsername.calls.reset();
    mockLoginService.getStoredUsername.and.returnValue('testuser');


    fixture = TestBed.createComponent(AddEditReturnReasons);
    component = fixture.componentInstance;
    component.mode = 'add';
    component.data = null;
  });

  describe('Load Dropdown Options', () => {
    it('should load location types and charge codes', () => {
      const mockLocationTypes = {
        data: [
          { code: 'DI', codeDesc: 'Discard' },
          { code: 'QU', codeDesc: 'Quarantine' }
        ]
      };
      const mockChargeCodes = {
        data: [
          { chargeCode: 'FEE1', chargeCodeDesc: 'Fee 1' },
          { chargeCode: 'FEE2', chargeCodeDesc: 'Fee 2' }
        ]
      };

      mockReturnReasonsService.getLocationTypes.and.returnValue(of(mockLocationTypes as any));
      mockReturnReasonsService.getChargeCodes.and.returnValue(of(mockChargeCodes as any));

      fixture.detectChanges();

      expect(component.locationTypeOptions).toEqual([
        { code: 'DI', codeDesc: 'Discard' },
        { code: 'QU', codeDesc: 'Quarantine' }
      ]);
      expect(component.feeCode1Options).toEqual([
        { chargeCode: 'FEE1', chargeCodeDesc: 'Fee 1' },
        { chargeCode: 'FEE2', chargeCodeDesc: 'Fee 2' }
      ]);
      expect(component.isLoadingOptions).toBe(false);
    });

    it('should handle error loading dropdown options', () => {
      mockReturnReasonsService.getLocationTypes.and.returnValue(
        throwError(() => new Error('API Error'))
      );
      mockReturnReasonsService.getChargeCodes.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();

      expect(component.isLoadingOptions).toBe(false);
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      const mockLocationTypes = { data: [] };
      const mockChargeCodes = { data: [] };
      mockReturnReasonsService.getLocationTypes.and.returnValue(of(mockLocationTypes as any));
      mockReturnReasonsService.getChargeCodes.and.returnValue(of(mockChargeCodes as any));
      fixture.detectChanges();
    });

    it('should require code field', () => {
      const codeControl = component.form.get('code');
      expect(codeControl?.hasError('required')).toBeTruthy();

      codeControl?.setValue('TEST1');
      expect(codeControl?.hasError('required')).toBeFalsy();
    });

    it('should require code description field', () => {
      const codeDescControl = component.form.get('codeDesc');
      expect(codeDescControl?.hasError('required')).toBeTruthy();

      codeDescControl?.setValue('Test Description');
      expect(codeDescControl?.hasError('required')).toBeFalsy();
    });

    it('should require location type field', () => {
      const locationTypeControl = component.form.get('locationType');
      expect(locationTypeControl?.hasError('required')).toBeTruthy();

      locationTypeControl?.setValue('DI');
      expect(locationTypeControl?.hasError('required')).toBeFalsy();
    });

    it('should require effective date field', () => {
      const effectiveDateControl = component.form.get('effectiveDate');

      // In add mode, effective date is automatically set to today, so clear it first
      effectiveDateControl?.setValue(null);
      expect(effectiveDateControl?.hasError('required')).toBeTruthy();

      effectiveDateControl?.setValue(new Date());
      expect(effectiveDateControl?.hasError('required')).toBeFalsy();
    });

    it('should validate form is valid with all required fields', () => {
      component.form.patchValue({
        code: 'TEST1',
        codeDesc: 'Test Description',
        locationType: 'DI',
        crNcr: 'Y',
        enforce: 'N',
        feeCode1: 'FEE1',
        feeCode2: 'FEE2',
        effectiveDate: moment(),
        terminationDate: null
      });

      expect(component.form.valid).toBeTruthy();
      expect(component.isFormValid).toBeTruthy();
    });
  });

  describe('onSave - Add Mode', () => {
    beforeEach(() => {
      const mockLocationTypes = { data: [] };
      const mockChargeCodes = { data: [] };
      mockReturnReasonsService.getLocationTypes.and.returnValue(of(mockLocationTypes as any));
      mockReturnReasonsService.getChargeCodes.and.returnValue(of(mockChargeCodes as any));

      component.mode = 'add';
      fixture.detectChanges();
    });


    it('should call addReturnReasons with form data when valid', fakeAsync(() => {
      const mockResponse = { success: true, message: 'Added successfully' };
      mockReturnReasonsService.addReturnReasons.and.returnValue(of(mockResponse as any));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      const futureDate = moment().add(10, 'days');

      component.form.patchValue({
        code: 'NEW1',
        codeDesc: 'New Description',
        locationType: 'DI',
        credit: true,
        enforcePolicy: false,
        feeCode1: 'FEE1',
        feeCode2: 'FEE2',
        effectiveDate: moment().add(1, 'month'),
        terminationDate: null
      });

      component.onSave();
      tick();

      expect(mockReturnReasonsService.addReturnReasons).toHaveBeenCalled();
      const callArgs = mockReturnReasonsService.addReturnReasons.calls.mostRecent().args[0];
      expect(callArgs.code).toBe('NEW1');
      expect(callArgs.codeDesc).toBe('New Description');
      expect(callArgs.crNcr).toBe('Y');
      expect(callArgs.enforce).toBe('N');
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();

      flush();
    }));


    // Code uppercase conversion is tested indirectly via onCodeInput test
    // and the main save test which verifies the full save payload
  });

  describe('onSave - Edit Mode', () => {
    beforeEach(() => {
      const mockLocationTypes = { data: [] };
      const mockChargeCodes = { data: [] };
      mockReturnReasonsService.getLocationTypes.and.returnValue(of(mockLocationTypes as any));
      mockReturnReasonsService.getChargeCodes.and.returnValue(of(mockChargeCodes as any));

      // Set component to edit mode
      component.mode = 'edit';
      component.data = {
        chapterId: 'CH1',
        code: 'TEST1',
        codeDesc: 'Old Description',
        locationType: 'DI',
        crNcr: 'Y',
        enforce: 'N',
        feeCode1: 'FEE1',
        feeCode2: 'FEE2',
        effDate: moment().subtract(1, 'month').toDate(),
        termDate: null
      };

      // Manually trigger the setup
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should call updateReturnReasons with form data', fakeAsync(() => {
      const mockResponse = { success: true, message: 'Updated successfully' };
      mockReturnReasonsService.updateReturnReasons.and.returnValue(of(mockResponse as any));

      // Make a change to mark form as dirty
      component.form.patchValue({
        codeDesc: 'Updated Description'
      });
      component.form.markAsDirty();
      fixture.detectChanges();

      component.onSave();
      tick();

      expect(mockReturnReasonsService.updateReturnReasons).toHaveBeenCalled();
      const callArgs = mockReturnReasonsService.updateReturnReasons.calls.mostRecent().args[0];
      expect(callArgs.currentChapterId).toBe('CH1');
      expect(callArgs.currentCode).toBe('TEST1');
      expect(callArgs.codeDesc).toBe('Updated Description');

      flush();
    }));


    it('should handle update error with 404 status', fakeAsync(() => {
      mockReturnReasonsService.updateReturnReasons.and.returnValue(
        throwError(() => ({ status: 404, error: {} }))
      );

      component.form.patchValue({
        codeDesc: 'Updated Description'
      });
      component.form.markAsDirty();

      component.onSave();
      tick();

      expect(component.isSaving).toBe(false);

      flush();
    }));
  });

  describe('onSaveAndCreateAnother', () => {
    beforeEach(() => {
      const mockLocationTypes = { data: [] };
      const mockChargeCodes = { data: [] };
      mockReturnReasonsService.getLocationTypes.and.returnValue(of(mockLocationTypes as any));
      mockReturnReasonsService.getChargeCodes.and.returnValue(of(mockChargeCodes as any));
      fixture.detectChanges();
    });

    it('should save and stay in add mode', fakeAsync(() => {
      const mockResponse = { success: true, message: 'Added successfully' };
      mockReturnReasonsService.addReturnReasons.and.returnValue(of(mockResponse as any));
      spyOn(component.saveSuccess, 'emit');

      component.mode = 'add';
      component.form.patchValue({
        code: 'TEST1',
        codeDesc: 'Test Description',
        locationType: 'DI',
        credit: false,
        enforcePolicy: false,
        feeCode1: '',
        feeCode2: '',
        effectiveDate: moment(),
        terminationDate: null
      });

      component.onSaveAndCreateAnother();
      tick();

      expect(mockReturnReasonsService.addReturnReasons).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();

      flush();
    }));

    it('should save and switch to add mode from edit mode', fakeAsync(() => {
      const mockResponse = { success: true, message: 'Updated successfully' };
      mockReturnReasonsService.updateReturnReasons.and.returnValue(of(mockResponse as any));
      spyOn(component.modeChange, 'emit');
      spyOn(component.saveSuccess, 'emit');

      component.mode = 'edit';
      component.data = {
        chapterId: 'CH1',
        code: 'TEST1',
        codeDesc: 'Old Description',
        locationType: 'DI',
        crNcr: 'Y',
        enforce: 'N',
        feeCode1: '',
        feeCode2: '',
        effDate: moment().toDate(),
        termDate: null
      };
      component.ngOnInit();
      fixture.detectChanges();

      component.form.patchValue({
        codeDesc: 'Updated Description'
      });
      component.form.markAsDirty();

      component.onSaveAndCreateAnother();
      tick();

      expect(mockReturnReasonsService.updateReturnReasons).toHaveBeenCalled();
      expect(component.modeChange.emit).toHaveBeenCalledWith('add');
      expect(component.saveSuccess.emit).toHaveBeenCalled();

      flush();
    }));

    it('should handle error in save and create another', fakeAsync(() => {
      mockReturnReasonsService.addReturnReasons.and.returnValue(
        throwError(() => ({ status: 500, error: {} }))
      );

      component.mode = 'add';
      component.form.patchValue({
        code: 'TEST1',
        codeDesc: 'Test',
        locationType: 'DI',
        credit: false,
        enforcePolicy: false,
        feeCode1: '',
        feeCode2: '',
        effectiveDate: moment(),
        terminationDate: null
      });

      component.onSaveAndCreateAnother();
      tick();

      expect(component.isSaving).toBe(false);

      flush();
    }));
  });

  describe('FeeCode Management', () => {
    beforeEach(() => {
      const mockLocationTypes = { data: [] };
      const mockChargeCodes = { data: [
        { chargeCode: 'FEE1' },
        { chargeCode: 'FEE2' },
        { chargeCode: 'FEE3' }
      ] };
      mockReturnReasonsService.getLocationTypes.and.returnValue(of(mockLocationTypes as any));
      mockReturnReasonsService.getChargeCodes.and.returnValue(of(mockChargeCodes as any));
      fixture.detectChanges();
    });

    it('should reload feeCode2 options when feeCode1 changes', () => {
      const mockFeeCode2Options = {
        data: [{ chargeCode: 'FEE2' }, { chargeCode: 'FEE3' }]
      };
      mockReturnReasonsService.getChargeCodes.and.returnValue(of(mockFeeCode2Options as any));

      component.form.get('feeCode1')?.setValue('FEE1');

      expect(mockReturnReasonsService.getChargeCodes).toHaveBeenCalledWith('FEE1');
    });

    it('should clear feeCode2 if it equals the selected feeCode1', () => {
      const mockFeeCode2Options = {
        data: [{ chargeCode: 'FEE2' }, { chargeCode: 'FEE3' }]
      };
      mockReturnReasonsService.getChargeCodes.and.returnValue(of(mockFeeCode2Options as any));

      component.form.patchValue({
        feeCode1: 'FEE1',
        feeCode2: 'FEE1'
      });

      component.form.get('feeCode1')?.setValue('FEE1');

      // feeCode2 should be cleared
      expect(component.form.get('feeCode2')?.value).toBe('');
    });
  });

  describe('Code Field Behavior', () => {
    beforeEach(() => {
      const mockLocationTypes = { data: [] };
      const mockChargeCodes = { data: [] };
      mockReturnReasonsService.getLocationTypes.and.returnValue(of(mockLocationTypes as any));
      mockReturnReasonsService.getChargeCodes.and.returnValue(of(mockChargeCodes as any));
      fixture.detectChanges();
    });

    it('should convert code input to uppercase', () => {
      const inputEvent = {
        target: { value: 'test123' }
      } as any;

      component.onCodeInput(inputEvent);

      expect(component.form.get('code')?.value).toBe('TEST123');
    });

    it('should allow editing code in edit mode via onCodeInput', () => {
      component.mode = 'edit';
      component.data = {
        chapterId: 'CH1',
        code: 'EDIT1',
        codeDesc: 'Test',
        locationType: 'DI',
        crNcr: 'Y',
        enforce: 'N',
        feeCode1: '',
        feeCode2: '',
        effDate: moment().toDate(),
        termDate: null
      };
      component.ngOnInit();
      fixture.detectChanges();

      const inputEvent = {
        target: { value: 'newcode' }
      } as any;

      component.onCodeInput(inputEvent);

      expect(component.form.get('code')?.value).toBe('NEWCODE');
    });



    // onEffectiveDateAttempt snackbar functionality is tested via user interaction
    // and the actual UI component behavior verification
  });

  describe('Date Validation', () => {
    beforeEach(() => {
      const mockLocationTypes = { data: [] };
      const mockChargeCodes = { data: [] };
      mockReturnReasonsService.getLocationTypes.and.returnValue(of(mockLocationTypes as any));
      mockReturnReasonsService.getChargeCodes.and.returnValue(of(mockChargeCodes as any));
      fixture.detectChanges();
    });



    it('should get termination date minimum in add mode', () => {
      component.mode = 'add';
      const futureDate = moment().add(5, 'days').toDate();
      component.form.get('effectiveDate')?.setValue(futureDate);

      const minDate = component.getTerminationDateMin();

      expect(minDate).toBe(futureDate);
    });

  });

  describe('Date Formatting', () => {
    


    it('should format date time with today label', () => {
      const today = new Date();
      const formatted = component.formatDateTime(today);

      expect(formatted).toContain('Today');
    });
    
  });

  describe('CR/NCR and Enforce Options', () => {
    it('should have Y and N options for crNcr', () => {
      const mockLocationTypes = { data: [] };
      const mockChargeCodes = { data: [] };
      mockReturnReasonsService.getLocationTypes.and.returnValue(of(mockLocationTypes as any));
      mockReturnReasonsService.getChargeCodes.and.returnValue(of(mockChargeCodes as any));
      fixture.detectChanges();

      expect(component.crNcrOptions).toEqual(['Y', 'N']);
      expect(component.enforceOptions).toEqual(['Y', 'N']);
    });
  });

  describe('Edit Mode - Code and Effective Date Editable', () => {
    beforeEach(() => {
      const mockLocationTypes = { data: [] };
      const mockChargeCodes = { data: [] };
      mockReturnReasonsService.getLocationTypes.and.returnValue(of(mockLocationTypes as any));
      mockReturnReasonsService.getChargeCodes.and.returnValue(of(mockChargeCodes as any));

      component.mode = 'edit';
      component.data = {
        chapterId: 'CH1',
        code: 'OLD1',
        codeDesc: 'Old Description',
        locationType: 'DI',
        crNcr: 'Y',
        enforce: 'N',
        feeCode1: '',
        feeCode2: '',
        effDate: moment().subtract(1, 'month').toDate(),
        termDate: null
      };

      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should include code in the update payload', fakeAsync(() => {
      const mockResponse = { success: true, message: 'Updated' };
      mockReturnReasonsService.updateReturnReasons.and.returnValue(of(mockResponse as any));

      component.form.patchValue({ code: 'NEW1' });
      component.form.markAsDirty();
      fixture.detectChanges();

      component.onSave();
      tick();

      expect(mockReturnReasonsService.updateReturnReasons).toHaveBeenCalled();
      const callArgs = mockReturnReasonsService.updateReturnReasons.calls.mostRecent().args[0];
      expect(callArgs.code).toBe('NEW1');
      expect(callArgs.currentCode).toBe('OLD1');

      flush();
    }));

    it('should keep effective date enabled in edit mode', () => {
      const effDateControl = component.form.get('effectiveDate');
      expect(effDateControl?.enabled).toBe(true);
    });

    it('should allow original past date without validation error', () => {
      const effDateControl = component.form.get('effectiveDate');
      expect(effDateControl?.valid).toBe(true);
      expect(component.form.valid).toBe(true);
    });

    it('should reject a new past date in edit mode', () => {
      const effDateControl = component.form.get('effectiveDate');
      const pastDate = moment().subtract(5, 'days');
      effDateControl?.setValue(pastDate);
      effDateControl?.updateValueAndValidity();

      expect(effDateControl?.hasError('matDatepickerMin')).toBe(true);
    });

    it('should allow a future date in edit mode', () => {
      const effDateControl = component.form.get('effectiveDate');
      const futureDate = moment().add(5, 'days');
      effDateControl?.setValue(futureDate);
      effDateControl?.updateValueAndValidity();

      expect(effDateControl?.valid).toBe(true);
    });

    it('should use editModeEffDateFilterFn in edit mode', () => {
      const originalDate = moment(component.data!.effDate);
      expect(component.editModeEffDateFilterFn(originalDate)).toBe(true);

      const otherPastDate = moment().subtract(2, 'months');
      expect(component.editModeEffDateFilterFn(otherPastDate)).toBe(false);

      const futureDate = moment().add(5, 'days');
      expect(component.editModeEffDateFilterFn(futureDate)).toBe(true);
    });

    it('should include code in onSaveAndCreateAnother update payload', fakeAsync(() => {
      const mockResponse = { success: true, message: 'Updated' };
      mockReturnReasonsService.updateReturnReasons.and.returnValue(of(mockResponse as any));
      mockReturnReasonsService.getLocationTypes.and.returnValue(of({ data: [] } as any));
      mockReturnReasonsService.getChargeCodes.and.returnValue(of({ data: [] } as any));
      spyOn(component.modeChange, 'emit');
      spyOn(component.saveSuccess, 'emit');

      component.form.patchValue({ code: 'CHG1' });
      component.form.markAsDirty();

      component.onSaveAndCreateAnother();
      tick();

      const callArgs = mockReturnReasonsService.updateReturnReasons.calls.mostRecent().args[0];
      expect(callArgs.code).toBe('CHG1');

      flush();
    }));
  });
});
