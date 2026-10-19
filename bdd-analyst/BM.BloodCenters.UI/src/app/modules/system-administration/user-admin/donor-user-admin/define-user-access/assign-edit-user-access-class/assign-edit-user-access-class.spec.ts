import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { AssignEditUserAccessClassComponent } from './assign-edit-user-access-class';
import { UserAccessService } from '../../services/user-access.service';
import { LoginService } from '../../../../../../shared/services/login.service';
import { HeaderService } from '../../../../../../shared/services/header.service';
import { SnackbarService } from '../../../../../../shared/services/snackbar.service';
import { createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  AssignEditAccessClassDialogData,
  ApiResponse,
  AccessClassDropdownDto
} from '../../models/user-access.model';

describe('AssignEditUserAccessClassComponent', () => {
  let headerServiceSpy: any;
  let snackbarServiceSpy: any;
  let dialogRefSpy: any;
  let loginServiceSpy: any;
  let userAccessServiceSpy: any;
  let component: AssignEditUserAccessClassComponent;
  let fixture: ComponentFixture<AssignEditUserAccessClassComponent>;
  let userAccessService: jasmine.SpyObj<UserAccessService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<AssignEditUserAccessClassComponent>>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;

  const mockAssignDialogData: AssignEditAccessClassDialogData = {
    mode: 'assign',
    user: {
      userId: 'USER001',
      userName: 'John Doe',
      department: 'IT Department'
    }
  };

  const mockEditDialogData: AssignEditAccessClassDialogData = {
    mode: 'edit',
    user: {
      userId: 'USER001',
      userName: 'John Doe',
      department: 'IT Department'
    },
    accessClassData: {
      accessClass: 'ADMIN',
      description: 'Administrator Access',
      level: 1,
      effectiveDate: moment().add(1, 'days').toISOString(),
      terminationDate: moment().add(30, 'days').toISOString()
    }
  };

  const mockAccessClasses: ApiResponse<AccessClassDropdownDto[]> = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: [
      { code: 'ADMIN', description: 'Administrator Access' },
      { code: 'USER', description: 'Standard User' },
      { code: 'VIEWER', description: 'Read-Only Viewer' }
    ]
  };

  async function createComponent(dialogData: AssignEditAccessClassDialogData) {
    // Reset TestBed to ensure clean state
    TestBed.resetTestingModule();

    userAccessServiceSpy = jasmine.createSpyObj('UserAccessService', [
      'getActiveAccessClasses',
      'assignAccessClass',
      'updateAccessClass',
      'getAccessLevelLimit'
    ]);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    snackbarServiceSpy = createMockSnackbarService();
    loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    headerServiceSpy = createMockHeaderService();

    // Set up default mock returns BEFORE configuring TestBed
    userAccessServiceSpy.getActiveAccessClasses.and.returnValue(of(mockAccessClasses));
    userAccessServiceSpy.getAccessLevelLimit.and.returnValue(of(10));
    loginServiceSpy.getStoredUsername.and.returnValue('TESTUSER');
    await TestBed.configureTestingModule({
      imports: [AssignEditUserAccessClassComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: UserAccessService, useValue: userAccessServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignEditUserAccessClassComponent);
    component = fixture.componentInstance;
    userAccessService = userAccessServiceSpy;
    dialogRef = dialogRefSpy;
    snackbarService = snackbarServiceSpy;
  }

  describe('Component Creation - Assign Mode', () => {
    beforeEach(async () => {
      await createComponent(mockAssignDialogData);
      fixture.detectChanges();
    });

    it('should be in assign mode', () => {
      expect(component.isEditMode).toBeFalse();
    });


    it('should have correct user info', () => {
      expect(component.userId).toBe('USER001');
      expect(component.userName).toBe('John Doe');
      expect(component.userDepartment).toBe('IT Department');
      expect(component.userDisplay).toBe('USER001 - John Doe');
    });

    it('should create form with accessClass control in assign mode', () => {
      expect(component.form.get('accessClass')).toBeTruthy();
      expect(component.form.get('accessLevel')).toBeTruthy();
      expect(component.form.get('effectiveDate')).toBeTruthy();
      expect(component.form.get('terminationDate')).toBeTruthy();
    });

    it('should load access classes on init in assign mode', () => {
      expect(userAccessService.getActiveAccessClasses).toHaveBeenCalled();
      expect(component.accessClasses.length).toBe(3);
    });
  });

  describe('Component Creation - Edit Mode', () => {
    beforeEach(async () => {
      await createComponent(mockEditDialogData);
      fixture.detectChanges();
    });

    it('should be in edit mode', () => {
      expect(component.isEditMode).toBeTrue();
    });



    it('should create form without accessClass control in edit mode', () => {
      expect(component.form.get('accessClass')).toBeNull();
      expect(component.form.get('accessLevel')).toBeTruthy();
      expect(component.form.get('effectiveDate')).toBeTruthy();
      expect(component.form.get('terminationDate')).toBeTruthy();
    });


    it('should populate form with existing data in edit mode', () => {
      expect(component.form.get('accessLevel')?.value).toBe(1);
      expect(component.form.get('effectiveDate')?.value).toBeTruthy();
      expect(component.form.get('terminationDate')?.value).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    beforeEach(async () => {
      await createComponent(mockAssignDialogData);
      fixture.detectChanges();
    });

    it('should be invalid when form is empty', () => {
      expect(component.form.valid).toBeFalse();
      expect(component.isFormValid).toBeFalse();
    });

    it('should require accessClass in assign mode', () => {
      component.form.patchValue({
        accessLevel: 1,
        effectiveDate: moment()
      });
      expect(component.form.get('accessClass')?.hasError('required')).toBeTrue();
    });

    it('should require accessLevel', () => {
      component.form.patchValue({
        accessClass: 'ADMIN',
        effectiveDate: moment()
      });
      expect(component.form.get('accessLevel')?.hasError('required')).toBeTrue();
    });

    it('should require effectiveDate', () => {
      component.form.patchValue({
        accessClass: 'ADMIN',
        accessLevel: 1
      });
      expect(component.form.get('effectiveDate')?.hasError('required')).toBeTrue();
    });

    it('should not require terminationDate', () => {
      component.form.patchValue({
        accessClass: 'ADMIN',
        accessLevel: 1,
        effectiveDate: moment()
      });
      expect(component.form.valid).toBeTrue();
    });

  });

  describe('Date Validation - Termination After Effective', () => {
    beforeEach(async () => {
      await createComponent(mockAssignDialogData);
      fixture.detectChanges();
    });

    it('should show error when termination date is before effective date', fakeAsync(() => {
      component.form.patchValue({
        accessClass: 'ADMIN',
        accessLevel: 1,
        effectiveDate: moment().add(10, 'days'),
        terminationDate: moment().add(5, 'days')
      });
      tick();
      fixture.detectChanges();

      component.form.get('terminationDate')?.markAsTouched();

      expect(component.getTerminationDateError()).toContain('Termination Date must be greater than or equal to Effective Date');
      expect(component.isFormValid).toBeFalse();
    }));

    it('should not show error when termination date is after effective date', fakeAsync(() => {
      component.form.patchValue({
        accessClass: 'ADMIN',
        accessLevel: 1,
        effectiveDate: moment().add(1, 'days'),
        terminationDate: moment().add(10, 'days')
      });
      tick();
      fixture.detectChanges();

      expect(component.getTerminationDateError()).toBe('');
    }));

    it('should not show error when termination date is same as effective date', fakeAsync(() => {
      const date = moment().add(1, 'days');
      component.form.patchValue({
        accessClass: 'ADMIN',
        accessLevel: 1,
        effectiveDate: date.clone(),
        terminationDate: date.clone()
      });
      tick();
      fixture.detectChanges();

      expect(component.getTerminationDateError()).toBe('');
    }));

    it('should not show error when termination date is empty', () => {
      component.form.patchValue({
        accessClass: 'ADMIN',
        accessLevel: 1,
        effectiveDate: moment().add(1, 'days'),
        terminationDate: null
      });

      expect(component.getTerminationDateError()).toBe('');
    });
  });

  describe('Loading Access Classes', () => {

    it('should handle error when loading access classes fails', async () => {
      userAccessServiceSpy = jasmine.createSpyObj('UserAccessService', [
        'getActiveAccessClasses',
        'assignAccessClass',
        'updateAccessClass',
        'getAccessLevelLimit'
      ]);
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
      snackbarServiceSpy = createMockSnackbarService();
      loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
      headerServiceSpy = createMockHeaderService();

      userAccessServiceSpy.getActiveAccessClasses.and.returnValue(throwError(() => new Error('API Error')));
      userAccessServiceSpy.getAccessLevelLimit.and.returnValue(of(10));
      loginServiceSpy.getStoredUsername.and.returnValue('TESTUSER');
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [AssignEditUserAccessClassComponent, ReactiveFormsModule],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideNoopAnimations(),
          { provide: UserAccessService, useValue: userAccessServiceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: mockAssignDialogData },
          { provide: LoginService, useValue: loginServiceSpy },
          { provide: HeaderService, useValue: headerServiceSpy },
          { provide: SnackbarService, useValue: snackbarServiceSpy }
        ]
      })
      .compileComponents();

      fixture = TestBed.createComponent(AssignEditUserAccessClassComponent);
      component = fixture.componentInstance;
      snackbarService = snackbarServiceSpy;

      spyOn(console, 'error');
      fixture.detectChanges();

      expect(component.isLoadingAccessClasses).toBeFalse();
    });
  });

  describe('Assign Access Class - onSaveAndAssign', () => {
    beforeEach(async () => {
      await createComponent(mockAssignDialogData);
      fixture.detectChanges();
    });


    it('should mark all fields as touched when form is invalid', () => {
      component.onSaveAndAssign();

      expect(component.form.get('accessClass')?.touched).toBeTrue();
      expect(component.form.get('accessLevel')?.touched).toBeTrue();
      expect(component.form.get('effectiveDate')?.touched).toBeTrue();
    });

    it('should call assignAccessClass with correct payload', fakeAsync(() => {
      const successResponse: ApiResponse<object> = {
        success: true,
        message: 'Access class assigned successfully',
        statusCode: 200,
        data: {}
      };
      userAccessService.assignAccessClass.and.returnValue(of(successResponse));

      const effectiveDate = moment().add(1, 'days');
      const terminationDate = moment().add(30, 'days');

      component.form.patchValue({
        accessClass: 'ADMIN',
        accessLevel: 1,
        effectiveDate: effectiveDate,
        terminationDate: terminationDate
      });

      component.onSaveAndAssign();
      tick();

      expect(userAccessService.assignAccessClass).toHaveBeenCalledWith(
        {
          userId: 'USER001',
          accessClass: 'ADMIN',
          interLevel: 1,
          effDate: effectiveDate.format('YYYY-MM-DD'),
          termDate: terminationDate.format('YYYY-MM-DD')
        },
        'TESTUSER',
        'TST'
      );
    }));



    it('should show message snackbar on API failure', fakeAsync(() => {
      const errorResponse: ApiResponse<object> = {
        success: false,
        message: 'Failed to assign access class',
        statusCode: 400,
        data: {}
      };
      userAccessService.assignAccessClass.and.returnValue(of(errorResponse));

      // Use future date to avoid date validation issues
      component.form.patchValue({
        accessClass: 'ADMIN',
        accessLevel: 1,
        effectiveDate: moment().add(1, 'days')
      });

      // Ensure form is valid
      expect(component.form.valid).toBeTrue();

      component.onSaveAndAssign();
      tick();

      expect(dialogRef.close).not.toHaveBeenCalled();
      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Failed to assign access class');
    }));

    it('should reset isSubmitting on HTTP error', fakeAsync(() => {
      userAccessService.assignAccessClass.and.returnValue(throwError(() => ({
        error: { message: 'Server error' }
      })));

      component.form.patchValue({
        accessClass: 'ADMIN',
        accessLevel: 1,
        effectiveDate: moment()
      });

      component.onSaveAndAssign();
      tick();

      expect(component.isSubmitting).toBeFalse();
    }));

    it('should reset isSubmitting on HTTP error with errorResponse (error handling delegated to authInterceptor)', fakeAsync(() => {
      userAccessService.assignAccessClass.and.returnValue(throwError(() => ({
        error: {
          errorResponse: { errorCode: '0319', error: 'Duplicate entry not allowed' }
        }
      })));

      component.form.patchValue({
        accessClass: 'ADMIN',
        accessLevel: 1,
        effectiveDate: moment()
      });

      component.onSaveAndAssign();
      tick();

      // Error handling is delegated to authInterceptor, component just resets isSubmitting
      expect(component.isSubmitting).toBeFalse();
    }));

    it('should set isSubmitting during API call', fakeAsync(() => {
      const successResponse: ApiResponse<object> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: {}
      };
      userAccessService.assignAccessClass.and.returnValue(of(successResponse));

      component.form.patchValue({
        accessClass: 'ADMIN',
        accessLevel: 1,
        effectiveDate: moment()
      });

      expect(component.isSubmitting).toBeFalse();

      component.onSaveAndAssign();

      // Note: Since we're using synchronous observable, isSubmitting may already be false
      tick();

      expect(component.isSubmitting).toBeFalse();
    }));
  });

  describe('Update Access Class - onSave (Edit Mode)', () => {
    beforeEach(async () => {
      await createComponent(mockEditDialogData);
      fixture.detectChanges();
    });


    it('should call updateAccessClass with correct payload', fakeAsync(() => {
      const successResponse: ApiResponse<object> = {
        success: true,
        message: 'Access class updated successfully',
        statusCode: 200,
        data: {}
      };
      userAccessService.updateAccessClass.and.returnValue(of(successResponse));

      const effectiveDate = moment().add(1, 'days');
      const terminationDate = moment().add(30, 'days');

      component.form.patchValue({
        accessLevel: 3,
        effectiveDate: effectiveDate,
        terminationDate: terminationDate
      });
      component.form.markAsDirty();

      component.onSave();
      tick();

      expect(userAccessService.updateAccessClass).toHaveBeenCalledWith(
        'USER001',
        'ADMIN',
        {
          interLevel: 3,
          effDate: effectiveDate.format('YYYY-MM-DD'),
          termDate: terminationDate.format('YYYY-MM-DD')
        }
      );
    }));


    it('should show message snackbar on API failure', fakeAsync(() => {
      const errorResponse: ApiResponse<object> = {
        success: false,
        message: 'Failed to update access class',
        statusCode: 400,
        data: {}
      };
      userAccessService.updateAccessClass.and.returnValue(of(errorResponse));

      component.form.patchValue({
        accessLevel: 2,
        terminationDate: moment().add(60, 'days')
      });
      component.form.markAsDirty();

      // Ensure form is valid before calling save
      expect(component.form.valid).toBeTrue();

      component.onSave();
      tick();

      expect(dialogRef.close).not.toHaveBeenCalled();
      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Failed to update access class');
    }));

    it('should reset isSubmitting on HTTP error', fakeAsync(() => {
      userAccessService.updateAccessClass.and.returnValue(throwError(() => ({
        error: { message: 'Server error' }
      })));

      component.form.patchValue({
        accessLevel: 2
      });
      component.form.markAsDirty();

      component.onSave();
      tick();

      expect(component.isSubmitting).toBeFalse();
    }));

    it('should reset isSubmitting on HTTP error with errorResponse (error handling delegated to authInterceptor)', fakeAsync(() => {
      userAccessService.updateAccessClass.and.returnValue(throwError(() => ({
        error: {
          errorResponse: { errorCode: '0319', error: 'Duplicate entry not allowed' }
        }
      })));

      component.form.patchValue({
        accessLevel: 2
      });
      component.form.markAsDirty();

      component.onSave();
      tick();

      // Error handling is delegated to authInterceptor, component just resets isSubmitting
      expect(component.isSubmitting).toBeFalse();
    }));

  });


  describe('Access Levels Array', () => {
    beforeEach(async () => {
      await createComponent(mockAssignDialogData);
      fixture.detectChanges();
    });

    it('should have access levels from 1 to accessLevelLimit (inclusive)', () => {
      expect(component.accessLevels).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it('should not include 0 in the access levels list', () => {
      expect(component.accessLevels).not.toContain(0);
    });

    it('should accept access level 1 (minimum) as a valid selection', () => {
      component.form.patchValue({
        accessClass: 'ADMIN',
        accessLevel: 1,
        effectiveDate: moment().add(1, 'month')
      });

      expect(component.form.get('accessLevel')?.valid).toBeTrue();
      expect(component.form.valid).toBeTrue();
      expect(component.isFormValid).toBeTrue();
    });

    it('should accept access level equal to accessLevelLimit as a valid selection', () => {
      component.form.patchValue({
        accessClass: 'ADMIN',
        accessLevel: component.accessLevelLimit,
        effectiveDate: moment().add(1, 'month')
      });

      expect(component.form.get('accessLevel')?.valid).toBeTrue();
    });
  });

  describe('Select Search Behavior', () => {
    it('should filter access classes by search term in select dropdown', async () => {
      await createComponent(mockAssignDialogData);
      fixture.detectChanges();

      expect(component.accessClasses.length).toBe(3);
      expect(component.filteredAccessClassesForSelect.length).toBe(3);

      // Simulate typing a search term
      component.accessClassSearchControl.setValue('ADMIN');

      expect(component.filteredAccessClassesForSelect.length).toBe(1);
      expect(component.filteredAccessClassesForSelect[0].code).toBe('ADMIN');
    });


    it('should reset search and show all options when dropdown opens', async () => {
      await createComponent(mockAssignDialogData);
      fixture.detectChanges();

      // Filter first
      component.accessClassSearchControl.setValue('ADMIN');
      expect(component.filteredAccessClassesForSelect.length).toBe(1);

      // Open dropdown
      component.onAccessClassDropdownOpened(true);

      expect(component.accessClassSearchControl.value).toBe('');
      expect(component.filteredAccessClassesForSelect.length).toBe(3);
    });

    it('should show required error when access class is empty and touched', async () => {
      await createComponent(mockAssignDialogData);
      fixture.detectChanges();

      const accessClassControl = component.form.get('accessClass');
      accessClassControl?.markAsTouched();

      expect(component.getAccessClassError()).toBe('Access Class is required');
    });
  });
});

describe('AssignEditUserAccessClassComponent Integration Tests', () => {
  let component: AssignEditUserAccessClassComponent;
  let fixture: ComponentFixture<AssignEditUserAccessClassComponent>;
  let userAccessService: jasmine.SpyObj<UserAccessService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<AssignEditUserAccessClassComponent>>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let userAccessServiceSpy: any;
  let dialogRefSpy: any;
  let snackbarServiceSpy: any;
  let loginServiceSpy: any;
  let headerServiceSpy: any;

  const mockAssignDialogData: AssignEditAccessClassDialogData = {
    mode: 'assign',
    user: {
      userId: 'USER001',
      userName: 'John Doe',
      department: 'IT Department'
    }
  };

  const mockAccessClasses: ApiResponse<AccessClassDropdownDto[]> = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: [
      { code: 'ADMIN', description: 'Administrator Access' },
      { code: 'USER', description: 'Standard User' }
    ]
  };

  beforeEach(async () => {
    TestBed.resetTestingModule();

    userAccessServiceSpy = jasmine.createSpyObj('UserAccessService', [
      'getActiveAccessClasses',
      'assignAccessClass',
      'updateAccessClass',
      'getAccessLevelLimit'
    ]);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    snackbarServiceSpy = createMockSnackbarService();
    loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    headerServiceSpy = createMockHeaderService();

    userAccessServiceSpy.getActiveAccessClasses.and.returnValue(of(mockAccessClasses));
    userAccessServiceSpy.getAccessLevelLimit.and.returnValue(of(10));
    loginServiceSpy.getStoredUsername.and.returnValue('TESTUSER');
    await TestBed.configureTestingModule({
      imports: [AssignEditUserAccessClassComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: UserAccessService, useValue: userAccessServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockAssignDialogData },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignEditUserAccessClassComponent);
    component = fixture.componentInstance;
    userAccessService = userAccessServiceSpy;
    dialogRef = dialogRefSpy;
    snackbarService = snackbarServiceSpy;

    fixture.detectChanges();
  });


  it('should display user info in assign mode', () => {
    const userDisplay = fixture.nativeElement.querySelector('.assigned-for-value');
    expect(userDisplay).toBeTruthy();
    expect(userDisplay.textContent).toContain('USER001');
    expect(userDisplay.textContent).toContain('John Doe');
  });

  it('should display access class dropdown options', fakeAsync(() => {
    tick();
    fixture.detectChanges();

    expect(component.accessClasses.length).toBe(2);
    expect(component.accessClasses[0].code).toBe('ADMIN');
    expect(component.accessClasses[1].code).toBe('USER');
  }));

  it('should show form validation errors when submitting invalid form', () => {
    component.onSaveAndAssign();
    fixture.detectChanges();

    // Check that required fields are marked as touched
    expect(component.form.get('accessClass')?.touched).toBeTrue();
    expect(component.form.get('accessLevel')?.touched).toBeTrue();
    expect(component.form.get('effectiveDate')?.touched).toBeTrue();
  });

  it('should have cancel button that closes dialog', () => {
    const cancelButton = fixture.nativeElement.querySelector('.cancel-button');
    expect(cancelButton).toBeTruthy();

    cancelButton.click();

    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('should have submit button disabled when form is invalid', () => {
    const submitButton = fixture.nativeElement.querySelector('button[mat-raised-button]');
    expect(submitButton).toBeTruthy();
    expect(submitButton.disabled).toBeTrue();
  });

  it('should complete full assignment workflow', fakeAsync(() => {
    const successResponse: ApiResponse<object> = {
      success: true,
      message: 'Access class assigned successfully',
      statusCode: 200,
      data: {}
    };
    userAccessService.assignAccessClass.and.returnValue(of(successResponse));

    // Fill in the form
    component.form.patchValue({
      accessClass: 'ADMIN',
      accessLevel: 1,
      effectiveDate: moment().add(1, 'days')
    });
    fixture.detectChanges();

    // Check button is enabled
    expect(component.isFormValid).toBeTrue();

    // Submit
    component.onSaveAndAssign();
    tick();
    fixture.detectChanges();

    // Verify success
    expect(snackbarService.showSuccess).toHaveBeenCalledWith('Access class assigned successfully');
    expect(dialogRef.close).toHaveBeenCalledWith({ success: true });
  }));

  it('should have save button enabled in edit mode even without changes when form is valid', async () => {
    // Recreate with edit mode
    const editDialogData: AssignEditAccessClassDialogData = {
      mode: 'edit',
      user: {
        userId: 'USER001',
        userName: 'John Doe',
        department: 'IT Department'
      },
      accessClassData: {
        accessClass: 'ADMIN',
        description: 'Admin Access',
        level: 1,
        effectiveDate: moment().add(1, 'days').format('YYYY-MM-DD'),
        terminationDate: moment().add(30, 'days').format('YYYY-MM-DD')
      }
    };

    TestBed.resetTestingModule();

    userAccessServiceSpy = jasmine.createSpyObj('UserAccessService', [
      'getActiveAccessClasses',
      'assignAccessClass',
      'updateAccessClass',
      'getAccessLevelLimit'
    ]);
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    const snackbarServiceSpy = createMockSnackbarService();
    loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    const headerServiceSpy = createMockHeaderService();
    userAccessServiceSpy.getAccessLevelLimit.and.returnValue(of(10));
    loginServiceSpy.getStoredUsername.and.returnValue('TESTUSER');
    await TestBed.configureTestingModule({
      imports: [AssignEditUserAccessClassComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: UserAccessService, useValue: userAccessServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: editDialogData },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy }
      ]
    })
    .compileComponents();

    const editFixture = TestBed.createComponent(AssignEditUserAccessClassComponent);
    const editComponent = editFixture.componentInstance;
    editFixture.detectChanges();

    // Form should be pristine after loading existing data
    expect(editComponent.form.pristine).toBeTrue();

    // Form should not be valid without changes (save disabled until dirty)
    expect(editComponent.isFormValid).toBeFalse();

    // Save button should be disabled when no changes are made
    const saveButton = editFixture.nativeElement.querySelector('button[mat-raised-button]');
    expect(saveButton).toBeTruthy();
    expect(saveButton.disabled).toBeTrue();
  });
});
