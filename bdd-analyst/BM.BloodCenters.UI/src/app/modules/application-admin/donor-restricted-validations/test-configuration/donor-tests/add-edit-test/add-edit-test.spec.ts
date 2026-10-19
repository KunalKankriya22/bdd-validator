import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { DonorAddEditTestComponent, DonorTestDialogData } from './add-edit-test';
import { DonorTestsApiService } from '../services/donor-tests-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoginService } from '@shared/services/login.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('DonorAddEditTestComponent', () => {
  let component: DonorAddEditTestComponent;
  let fixture: ComponentFixture<DonorAddEditTestComponent>;
  let mockService: jasmine.SpyObj<DonorTestsApiService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<DonorAddEditTestComponent>>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockLoginService: jasmine.SpyObj<LoginService>;

  const mockAntigenTypes = [
    { value: 'ABO', display: 'ABO' },
    { value: 'RH', display: 'RH' }
  ];
  const mockAntigenGroups = [
    { value: 'GRP1', display: 'GRP1' },
    { value: 'GRP2', display: 'GRP2' }
  ];
  const mockTestGroups = [
    { value: 'BLOOD', display: 'BLOOD - Blood Group' },
    { value: 'SEROL', display: 'SEROL - Serology' }
  ];
  const VIEW_LEVEL_LIMIT = 9;

  const addModeData: DonorTestDialogData = {
    mode: 'add'
  };

  // Use future date to avoid validation issues in edit mode
  const futureEffectiveDate = new Date();
  futureEffectiveDate.setDate(futureEffectiveDate.getDate() + 90);

  const editModeData: DonorTestDialogData = {
    mode: 'edit',
    testId: 'ABID',
    description: 'ABORHBloodTyping',
    shortId: 'ABI',
    profileTest: 'Yes',
    antigenType: 'ABO',
    antigenGroup: 'GRP1',
    testGroup: 'BLOOD',
    viewLevel: 2,
    effectiveDate: futureEffectiveDate,
    terminationDate: null
  };

  function createComponent(dialogData: DonorTestDialogData, storedUsername: string = 'TESTUSER') {
    mockService = jasmine.createSpyObj('DonorTestsApiService', [
      'getDropdowns', 'getAntigenTypes', 'getAntigenGroups', 'getTestGroups',
      'getViewLevelLimit', 'createTest', 'updateTest'
    ]);
    mockService.getDropdowns.and.returnValue(of({ profileTest: [], antigenType: [], antigenGroup: [], testGroup: [], viewLevel: [] }));
    mockService.getAntigenTypes.and.returnValue(of(mockAntigenTypes));
    mockService.getAntigenGroups.and.returnValue(of(mockAntigenGroups));
    mockService.getTestGroups.and.returnValue(of(mockTestGroups));
    mockService.getViewLevelLimit.and.returnValue(of(VIEW_LEVEL_LIMIT));
    mockService.createTest.and.returnValue(of({ success: true, message: 'Record created successfully' }));
    mockService.updateTest.and.returnValue(of({ success: true, message: 'Record updated successfully' }));

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockSnackbarService = createMockSnackbarService();
    mockLoginService = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    mockLoginService.getStoredUsername.and.returnValue(storedUsername);

    TestBed.configureTestingModule({
      imports: [DonorAddEditTestComponent],
      providers: [
        provideHttpClient(),
        { provide: DonorTestsApiService, useValue: mockService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: LoginService, useValue: mockLoginService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DonorAddEditTestComponent);
    component = fixture.componentInstance;
  }

  describe('Add Mode', () => {
    beforeEach(() => {
      createComponent(addModeData);
    });




    it('should initialize profileTest with no default value', () => {
      expect(component.form.get('profileTest')?.value).toBeNull();
    });


    it('should not have required validator on optional fields', () => {
      component.form.markAllAsTouched();

      expect(component.form.get('profileTest')?.hasError('required')).toBe(false);
      expect(component.form.get('antigenType')?.hasError('required')).toBe(false);
      expect(component.form.get('antigenGroup')?.hasError('required')).toBe(false);
      expect(component.form.get('terminationDate')?.hasError('required')).toBe(false);
    });


    it('should validate testId maxLength', () => {
      component.form.get('testId')?.setValue('ABCDEFGHIJK'); // 11 chars
      expect(component.form.get('testId')?.hasError('maxlength')).toBe(true);
    });

    it('should validate description maxLength', () => {
      component.form.get('description')?.setValue('A'.repeat(51));
      expect(component.form.get('description')?.hasError('maxlength')).toBe(true);
    });

    it('should validate shortId maxLength', () => {
      component.form.get('shortId')?.setValue('ABCDEFG'); // 7 chars
      expect(component.form.get('shortId')?.hasError('maxlength')).toBe(true);
    });

    it('should reject special characters in shortId', () => {
      component.form.get('shortId')?.setValue('AB@#$');
      component.form.get('shortId')?.markAsTouched();
      expect(component.form.get('shortId')?.hasError('alphanumericOnly')).toBe(true);
    });

    it('should accept alphanumeric characters with spaces in shortId', () => {
      component.form.get('shortId')?.setValue('AB 12');
      component.form.get('shortId')?.markAsTouched();
      expect(component.form.get('shortId')?.hasError('alphanumericOnly')).toBe(false);
    });

    it('should accept hyphens in shortId', () => {
      component.form.get('shortId')?.setValue('AB-12');
      component.form.get('shortId')?.markAsTouched();
      expect(component.form.get('shortId')?.hasError('alphanumericOnly')).toBe(false);
    });

    it('should accept alphanumeric with spaces and hyphens in shortId', () => {
      component.form.get('shortId')?.setValue('AB-CD 12');
      component.form.get('shortId')?.markAsTouched();
      expect(component.form.get('shortId')?.hasError('alphanumericOnly')).toBe(false);
    });













    it('should trim description before sending', fakeAsync(() => {
      component.form.patchValue({
        testId: 'NEW01',
        description: 'NewTest',
        shortId: 'NT1',
        testGroup: 'BLOOD',
        viewLevel: 1,
        effectiveDate: moment().add(10, 'days')
      });

      component.onSave();
      tick();

      const dto = mockService.createTest.calls.mostRecent().args[0];
      expect(dto.TestId).toBe('NEW01');
      expect(dto.Description).toBe('NewTest');
      expect(dto.ShortId).toBe('NT1');
    }));


    it('should include InsertUser from cookie in create payload', fakeAsync(() => {
      component.form.patchValue({
        testId: 'NEW01',
        description: 'NewTest',
        shortId: 'NT1',
        testGroup: 'BLOOD',
        viewLevel: 1,
        effectiveDate: moment().add(10, 'days')
      });

      component.onSave();
      tick();

      const dto = mockService.createTest.calls.mostRecent().args[0];
      expect(dto.InsertUser).toBe('TESTUSER');
      expect(mockLoginService.getStoredUsername).toHaveBeenCalled();
    }));
  });

  describe('Add Mode - InsertUser fallback', () => {
    beforeEach(() => {
      createComponent(addModeData, '');
    });

    it('should use DONSYS as fallback when cookie is empty', fakeAsync(() => {
      component.ngOnInit();
      tick();

      component.form.patchValue({
        testId: 'NEW01',
        description: 'NewTest',
        shortId: 'NT1',
        testGroup: 'BLOOD',
        viewLevel: 1,
        effectiveDate: moment().add(10, 'days')
      });

      component.onSave();
      tick();

      const dto = mockService.createTest.calls.mostRecent().args[0];
      expect(dto.InsertUser).toBe('DONSYS');
    }));
  });

  describe('View Level dropdown', () => {
    beforeEach(() => {
      createComponent(addModeData);
    });


    it('should generate viewLevels 1..N after loading limit', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(component.viewLevelLimit).toBe(VIEW_LEVEL_LIMIT);
      expect(component.viewLevels.length).toBe(VIEW_LEVEL_LIMIT);
      expect(component.viewLevels[0]).toBe(1);
      expect(component.viewLevels[VIEW_LEVEL_LIMIT - 1]).toBe(VIEW_LEVEL_LIMIT);
    }));

    it('should set filteredViewLevels equal to viewLevels on load', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(component.filteredViewLevels).toEqual(component.viewLevels);
    }));

    it('should filter filteredViewLevels based on search term', fakeAsync(() => {
      component.ngOnInit();
      tick();

      component.viewLevelSearchControl.setValue('5');
      tick(300);

      expect(component.filteredViewLevels).toContain(5);
      expect(component.filteredViewLevels.length).toBe(1);
    }));

    it('should restore all levels when search is cleared', fakeAsync(() => {
      component.ngOnInit();
      tick();

      component.viewLevelSearchControl.setValue('5');
      tick(300);
      component.viewLevelSearchControl.setValue('');
      tick(300);

      expect(component.filteredViewLevels.length).toBe(VIEW_LEVEL_LIMIT);
    }));

    it('should handle getViewLevelLimit error gracefully', fakeAsync(() => {
      mockService.getViewLevelLimit.and.returnValue(throwError(() => new Error('API error')));

      component.ngOnInit();
      tick();

      expect(component.viewLevelLimit).toBe(0);
      expect(component.viewLevels.length).toBe(0);
      expect(component.filteredViewLevels.length).toBe(0);
    }));

    it('should accept a valid viewLevel selection', () => {
      component.form.get('viewLevel')?.setValue(3);
      expect(component.form.get('viewLevel')?.valid).toBe(true);
    });

  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      createComponent(editModeData);
    });




    it('should convert Yes/No profileTest to boolean', () => {
      expect(component.form.get('profileTest')?.value).toBe(true);
    });

    it('should set viewLevel as number', () => {
      expect(component.form.get('viewLevel')?.value).toBe(2);
    });

    it('should convert date to moment for effectiveDate', () => {
      const effValue = component.form.get('effectiveDate')?.value;
      expect(moment.isMoment(effValue)).toBe(true);
    });

    it('should set terminationDate to null when not provided', () => {
      expect(component.form.get('terminationDate')?.value).toBeNull();
    });


    it('should update test successfully', fakeAsync(() => {
      component.ngOnInit();
      tick();

      component.onSave();
      tick();

      expect(mockService.updateTest).toHaveBeenCalledWith('ABID', jasmine.any(Object));
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Record updated successfully');
      expect(mockDialogRef.close).toHaveBeenCalledWith({ success: true });
    }));


    it('should have pristine form after initialization', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(component.form.pristine).toBe(true);
    }));

  });

  describe('Date Range Validation', () => {
    beforeEach(() => {
      createComponent(addModeData);
    });

    it('should pass when termination date is after effective date', () => {
      component.form.patchValue({
        effectiveDate: moment().add(10, 'days'),
        terminationDate: moment('2026-12-01')
      });

      expect(component.form.hasError('dateRangeInvalid')).toBe(false);
    });

    it('should fail when termination date is before effective date', () => {
      component.form.patchValue({
        effectiveDate: moment().add(10, 'days'),
        terminationDate: moment('2026-05-01')
      });

      expect(component.form.hasError('dateRangeInvalid')).toBe(true);
    });

    it('should pass when termination date is null', () => {
      component.form.patchValue({
        effectiveDate: moment().add(10, 'days'),
        terminationDate: null
      });

      expect(component.form.hasError('dateRangeInvalid')).toBe(false);
    });
  });

  describe('getFieldError', () => {
    beforeEach(() => {
      createComponent(addModeData);
    });


    it('should return required error with label', () => {
      component.form.get('testId')?.markAsTouched();
      expect(component.getFieldError('testId')).toBe('Test ID is required');
    });

    it('should return correct labels for each required field', () => {
      const requiredFields = [
        { name: 'testId', label: 'Test ID' },
        { name: 'description', label: 'Description' },
        { name: 'shortId', label: 'Short ID' },
        { name: 'testGroup', label: 'Test Group' },
        { name: 'viewLevel', label: 'View Level' },
        { name: 'effectiveDate', label: 'Effective Date' }
      ];

      requiredFields.forEach(field => {
        component.form.get(field.name)?.markAsTouched();
        expect(component.getFieldError(field.name)).toBe(`${field.label} is required`);
      });
    });
  });



  describe('null selection for optional dropdowns', () => {
    beforeEach(() => {
      createComponent(addModeData);
    });

    it('should accept null for profileTest', () => {
      component.form.get('profileTest')?.setValue(null);
      expect(component.form.get('profileTest')?.valid).toBe(true);
      expect(component.form.get('profileTest')?.value).toBeNull();
    });

    it('should accept null for antigenType', () => {
      component.form.get('antigenType')?.setValue(null);
      expect(component.form.get('antigenType')?.valid).toBe(true);
      expect(component.form.get('antigenType')?.value).toBeNull();
    });

    it('should accept null for antigenGroup', () => {
      component.form.get('antigenGroup')?.setValue(null);
      expect(component.form.get('antigenGroup')?.valid).toBe(true);
      expect(component.form.get('antigenGroup')?.value).toBeNull();
    });

  });

});
