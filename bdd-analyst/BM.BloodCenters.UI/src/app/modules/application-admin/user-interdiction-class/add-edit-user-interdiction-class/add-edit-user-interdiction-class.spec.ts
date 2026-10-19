import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleChange } from '@angular/core';
import { AddEditUserInterdictionClass } from './add-edit-user-interdiction-class';
import { AssignUserInterdictionClassService } from '../services/assign-user-interdiction-class.service';
import { HeaderService } from '@shared/services/header.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import moment from 'moment';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

describe('AddEditUserInterdictionClass', () => {
  let headerServiceSpy: any;
  let serviceSpy: any;
  let component: AddEditUserInterdictionClass;
  let fixture: ComponentFixture<AddEditUserInterdictionClass>;
  let service: jasmine.SpyObj<AssignUserInterdictionClassService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  // Compute dynamic dates once per suite to avoid timezone-sensitive hardcoding
  const futureEffectiveDate = moment().add(60, 'days').startOf('day');
  const futureTerminationDate = moment().add(210, 'days').startOf('day');
  const pastModifiedDate = moment().subtract(15, 'days').startOf('day');

  const mockUsers = [
    { userId: 'USER001', userName: 'John Doe', displayName: 'USER001 - John Doe' },
    { userId: 'USER002', userName: 'Jane Smith', displayName: 'USER002 - Jane Smith' }
  ];

  const mockClasses = [
    { code: 'SYS', description: 'System Interdictions' },
    { code: 'LAB', description: 'Lab Interdictions' }
  ];

  const mockRecord = {
    userId: 'USER001',
    userName: 'John Doe',
    interClass: 'SYS',
    interClassDesc: 'System Interdictions',
    effectiveDate: futureEffectiveDate.toDate(),
    terminationDate: futureTerminationDate.toDate(),
    lastModifiedDate: pastModifiedDate.toDate(),
    isActive: true
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('AssignUserInterdictionClassService', [
      'getUsers',
      'getInterdictionClasses',
      'getInterdictionClassByCode',
      'addUserInterdictionClass',
      'updateUserInterdictionClass'
    ]);
    const snackBarSpy = createMockMatSnackBar();

    headerServiceSpy = createMockHeaderService();
    headerServiceSpy.chapterTimeZone = jasmine.createSpy('chapterTimeZone').and.returnValue('UTC');

      TestBed.configureTestingModule({
      imports: [AddEditUserInterdictionClass, HttpClientTestingModule, NoopAnimationsModule],
      providers: [
        { provide: AssignUserInterdictionClassService, useValue: serviceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });



      serviceSpy.getUsers.calls.reset();

      serviceSpy.getInterdictionClasses.calls.reset();

      serviceSpy.getInterdictionClassByCode.calls.reset();

      serviceSpy.addUserInterdictionClass.calls.reset();

      serviceSpy.updateUserInterdictionClass.calls.reset();

    fixture = TestBed.createComponent(AddEditUserInterdictionClass);
    component = fixture.componentInstance;
    service = TestBed.inject(AssignUserInterdictionClassService) as jasmine.SpyObj<AssignUserInterdictionClassService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    service.getUsers.and.returnValue(of(mockUsers));
    service.getInterdictionClasses.and.returnValue(of(mockClasses));
    service.getInterdictionClassByCode.and.returnValue(of({ code: 'SYS', description: 'System Interdictions' }));

    });

  afterEach(() => {
    fixture.destroy();
  });

  /** Helper: spy on the component's actual snackBar (bypasses standalone injector scoping). */
  function spyOnComponentSnackBar(): jasmine.Spy {
    return spyOn((component as any).snackBar, 'open');
  }

  it('should load users on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(service.getUsers).toHaveBeenCalled();
    expect(component.userOptions.length).toBe(2);
  }));

  it('should load interdiction classes on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(service.getInterdictionClasses).toHaveBeenCalled();
    expect(component.interdictionClassOptions.length).toBe(2);
  }));

  it('should call updateUserInterdictionClass in edit mode', fakeAsync(() => {
    component.mode = 'edit';
    component.data = mockRecord;
    service.updateUserInterdictionClass.and.returnValue(of({ success: true, message: 'Success' }));
    fixture.detectChanges();

    component.form.patchValue({
      effectiveDate: futureEffectiveDate.clone(),
      terminationDate: futureTerminationDate.clone()
    });
    tick();

    component.onSave();
    tick();

    expect(service.updateUserInterdictionClass).toHaveBeenCalledWith('USER001', 'SYS', jasmine.any(Object));
  }));

  describe('terminationMinDate', () => {
    it('should return minDate when no effective date is set', () => {
      fixture.detectChanges();
      component.form.patchValue({ effectiveDate: null });
      expect(component.terminationMinDate).toEqual(component.minDate);
    });

    it('should return effective date when it is after minDate', () => {
      fixture.detectChanges();
      const futureDate = moment().add(10, 'days');
      component.form.patchValue({ effectiveDate: futureDate });
      expect(moment.isMoment(component.terminationMinDate)).toBe(true);
      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(futureDate.format('YYYY-MM-DD'));
    });

    it('should return minDate when effective date is before minDate', () => {
      fixture.detectChanges();
      const pastDate = moment().subtract(30, 'days');
      component.form.patchValue({ effectiveDate: pastDate });
      expect(component.terminationMinDate).toEqual(component.minDate);
    });
  });

  /* COMPONENT INITIALIZATION */

  describe('Component Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should default mode to add', () => {
      expect(component.mode).toBe('add');
    });

    it('should default data to null', () => {
      expect(component.data).toBeNull();
    });

    it('should initialize form with correct controls', () => {
      expect(component.form.get('user')).toBeTruthy();
      expect(component.form.get('interdictionClass')).toBeTruthy();
      expect(component.form.get('description')).toBeTruthy();
      expect(component.form.get('effectiveDate')).toBeTruthy();
      expect(component.form.get('terminationDate')).toBeTruthy();
      expect(component.form.get('modificationDate')).toBeTruthy();
    });

    it('should have description control disabled by default', () => {
      expect(component.form.get('description')?.disabled).toBe(true);
    });

    it('should have modificationDate control disabled by default', () => {
      expect(component.form.get('modificationDate')?.disabled).toBe(true);
    });

    it('should have user control as required', () => {
      const control = component.form.get('user');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should have interdictionClass control as required', () => {
      const control = component.form.get('interdictionClass');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should have effectiveDate control as required', () => {
      const control = component.form.get('effectiveDate');
      control?.setValue(null);
      expect(control?.hasError('required')).toBe(true);
    });

    it('should not require terminationDate', () => {
      const control = component.form.get('terminationDate');
      control?.setValue(null);
      expect(control?.hasError('required')).toBeFalsy();
    });

    it('should initialize isSaving as false', () => {
      expect(component.isSaving).toBe(false);
    });

    it('should initialize savingAction as null', () => {
      expect(component.savingAction).toBeNull();
    });

    it('should initialize loadingUsers as false before detectChanges', () => {
      expect(component.loadingUsers).toBe(false);
    });

    it('should initialize loadingInterdictionClasses as false before detectChanges', () => {
      expect(component.loadingInterdictionClasses).toBe(false);
    });
  });

  /* ADD MODE SETUP */

  describe('Add Mode Setup', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should set panelTitle for add mode', () => {
      expect(component.panelTitle).toBe('Assign User Interdiction Class');
    });

    it('should set lastUpdated to empty string in add mode', () => {
      expect(component.lastUpdated).toBe('');
    });

    it('should have user control enabled in add mode', () => {
      expect(component.form.get('user')?.disabled).toBe(false);
    });

    it('should populate filteredUserOptions with all users', () => {
      expect(component.filteredUserOptions.length).toBe(2);
    });

    it('should populate filteredInterdictionClassOptions with all classes', () => {
      expect(component.filteredInterdictionClassOptions.length).toBe(2);
    });

    it('should set loadingUsers to false after loading', () => {
      expect(component.loadingUsers).toBe(false);
    });

    it('should set loadingInterdictionClasses to false after loading', () => {
      expect(component.loadingInterdictionClasses).toBe(false);
    });
  });

  /* EDIT MODE SETUP */

  describe('Edit Mode Setup', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockRecord;
      fixture.detectChanges();
      tick();
    }));

    it('should set panelTitle for edit mode', () => {
      expect(component.panelTitle).toBe('Edit User Interdiction Class');
    });

    it('should set lastUpdated with modification date', () => {
      expect(component.lastUpdated).toContain('Last Updated:');
    });

    it('should disable user control in edit mode', () => {
      expect(component.form.get('user')?.disabled).toBe(true);
    });

    it('should populate editModeValues from data', () => {
      expect(component.editModeValues.userId).toBe('USER001');
      expect(component.editModeValues.userName).toBe('John Doe');
      expect(component.editModeValues.interClass).toBe('SYS');
      expect(component.editModeValues.interClassDesc).toBe('System Interdictions');
    });

    it('should populate form with data values', () => {
      const rawValues = component.form.getRawValue();
      expect(rawValues.user).toBe('USER001 - John Doe');
      expect(rawValues.interdictionClass).toBe('SYS');
      expect(rawValues.description).toBe('System Interdictions');
    });

    it('should convert dates to moment objects in edit mode', () => {
      const effectiveDate = component.form.get('effectiveDate')?.value;
      const terminationDate = component.form.get('terminationDate')?.value;
      expect(moment.isMoment(effectiveDate)).toBe(true);
      expect(moment.isMoment(terminationDate)).toBe(true);
    });

    it('should re-enable effective date in edit mode', () => {
      expect(component.form.get('effectiveDate')?.disabled).toBe(false);
    });

    it('should use current date for lastUpdated when data has no lastModifiedDate', fakeAsync(() => {
      component.mode = 'edit';
      component.data = { ...mockRecord, lastModifiedDate: null };
      component['setupPanel']();
      tick();
      expect(component.lastUpdated).toContain('Last Updated:');
    }));

    it('should handle data with null effectiveDate', fakeAsync(() => {
      component.mode = 'edit';
      component.data = { ...mockRecord, effectiveDate: null };
      expect(() => {
        component['setupPanel']();
        tick();
      }).not.toThrow();
      expect(component.editModeValues.effectiveDate).toBe('');
    }));

    it('should handle data with null terminationDate', fakeAsync(() => {
      component.mode = 'edit';
      component.data = { ...mockRecord, terminationDate: null };
      expect(() => {
        component['setupPanel']();
        tick();
      }).not.toThrow();
    }));
  });

  /* LOAD DATA FROM API */

  describe('Load Data From API', () => {
    it('should handle user loading error', fakeAsync(() => {
      service.getUsers.and.returnValue(throwError(() => new Error('API Error')));
      spyOn(console, 'error');

      fixture.detectChanges();
      tick();

      expect(console.error).toHaveBeenCalledWith('Error loading users:', jasmine.any(Error));
      expect(component.loadingUsers).toBe(false);
    }));

    it('should handle interdiction classes loading error', fakeAsync(() => {
      service.getInterdictionClasses.and.returnValue(throwError(() => new Error('API Error')));
      spyOn(console, 'error');

      fixture.detectChanges();
      tick();

      expect(console.error).toHaveBeenCalledWith('Error loading interdiction classes:', jasmine.any(Error));
      expect(component.loadingInterdictionClasses).toBe(false);
    }));

    it('should handle both API errors simultaneously', fakeAsync(() => {
      service.getUsers.and.returnValue(throwError(() => new Error('User Error')));
      service.getInterdictionClasses.and.returnValue(throwError(() => new Error('Class Error')));
      spyOn(console, 'error');

      fixture.detectChanges();
      tick();

      expect(component.loadingUsers).toBe(false);
      expect(component.loadingInterdictionClasses).toBe(false);
      expect(component.userOptions.length).toBe(0);
      expect(component.interdictionClassOptions.length).toBe(0);
    }));
  });

  /* SEARCH FUNCTIONALITY */

  describe('Search Functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should filter users by userId', fakeAsync(() => {
      component.userSearchControl.setValue('USER001');
      tick();
      expect(component.filteredUserOptions.length).toBe(1);
      expect(component.filteredUserOptions[0].userId).toBe('USER001');
    }));

    it('should filter users by userName', fakeAsync(() => {
      component.userSearchControl.setValue('jane');
      tick();
      expect(component.filteredUserOptions.length).toBe(1);
      expect(component.filteredUserOptions[0].userName).toBe('Jane Smith');
    }));

    it('should be case-insensitive for user search', fakeAsync(() => {
      component.userSearchControl.setValue('JOHN');
      tick();
      expect(component.filteredUserOptions.length).toBe(1);
      expect(component.filteredUserOptions[0].userId).toBe('USER001');
    }));

    it('should return all users when search term is empty', fakeAsync(() => {
      component.userSearchControl.setValue('');
      tick();
      expect(component.filteredUserOptions.length).toBe(2);
    }));

    it('should return no users when search term matches nothing', fakeAsync(() => {
      component.userSearchControl.setValue('NONEXISTENT');
      tick();
      expect(component.filteredUserOptions.length).toBe(0);
    }));

    it('should filter interdiction classes by code', fakeAsync(() => {
      component.interdictionClassSearchControl.setValue('SYS');
      tick();
      expect(component.filteredInterdictionClassOptions.length).toBe(1);
      expect(component.filteredInterdictionClassOptions[0].code).toBe('SYS');
    }));

    it('should filter interdiction classes by description', fakeAsync(() => {
      component.interdictionClassSearchControl.setValue('lab');
      tick();
      expect(component.filteredInterdictionClassOptions.length).toBe(1);
      expect(component.filteredInterdictionClassOptions[0].code).toBe('LAB');
    }));

    it('should return all classes when search term is empty', fakeAsync(() => {
      component.interdictionClassSearchControl.setValue('');
      tick();
      expect(component.filteredInterdictionClassOptions.length).toBe(2);
    }));

    it('should return no classes when search term matches nothing', fakeAsync(() => {
      component.interdictionClassSearchControl.setValue('NONEXISTENT');
      tick();
      expect(component.filteredInterdictionClassOptions.length).toBe(0);
    }));

    it('should handle null search term for users', fakeAsync(() => {
      component.userSearchControl.setValue(null);
      tick();
      expect(component.filteredUserOptions.length).toBe(2);
    }));

    it('should handle null search term for interdiction classes', fakeAsync(() => {
      component.interdictionClassSearchControl.setValue(null);
      tick();
      expect(component.filteredInterdictionClassOptions.length).toBe(2);
    }));
  });

  /* INTERDICTION CLASS CHANGE LISTENER */

  describe('Interdiction Class Change Listener', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should update description when class is selected from loaded options', fakeAsync(() => {
      component.form.get('interdictionClass')?.setValue('SYS');
      tick();
      expect(component.form.getRawValue().description).toBe('System Interdictions');
    }));

    it('should clear description when class is cleared', fakeAsync(() => {
      component.form.get('interdictionClass')?.setValue('SYS');
      tick();
      component.form.get('interdictionClass')?.setValue('');
      tick();
      expect(component.form.getRawValue().description).toBe('');
    }));

    it('should fetch description from API when class not in loaded options', fakeAsync(() => {
      service.getInterdictionClassByCode.and.returnValue(of({ code: 'NEW', description: 'New Class' }));
      component.form.get('interdictionClass')?.setValue('NEW');
      tick();
      expect(service.getInterdictionClassByCode).toHaveBeenCalledWith('NEW');
      expect(component.form.getRawValue().description).toBe('New Class');
    }));

    it('should handle API error when fetching class description', fakeAsync(() => {
      service.getInterdictionClassByCode.and.returnValue(throwError(() => new Error('API Error')));
      spyOn(console, 'error');
      component.form.get('interdictionClass')?.setValue('UNKNOWN');
      tick();
      expect(console.error).toHaveBeenCalledWith('Error fetching interdiction class description:', jasmine.any(Error));
      expect(component.form.getRawValue().description).toBe('');
    }));

    it('should handle API response with no description', fakeAsync(() => {
      service.getInterdictionClassByCode.and.returnValue(of({ code: 'EMPTY', description: '' }));
      component.form.get('interdictionClass')?.setValue('EMPTY');
      tick();
      expect(component.form.getRawValue().description).toBe('');
    }));
  });

  /* CANCEL */

  describe('onCancel', () => {
    it('should emit closePanel when no dialogRef', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));
  });

  /* DATE INPUT HANDLERS */

  describe('Date Input Handlers', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should call handleStartDateInput for effective date input', () => {
      spyOn(DateFieldValidationUtility, 'handleStartDateInput');
      const mockEvent = { target: { value: '01-Jan-2099' } } as unknown as Event;
      component.onEffectiveDateInput(mockEvent);
      expect(DateFieldValidationUtility.handleStartDateInput).toHaveBeenCalledWith(
        '01-Jan-2099', component.form.get('effectiveDate')
      );
    });

    it('should call handleEndDateInput for termination date input in add mode', () => {
      spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const mockEvent = { target: { value: '31-Dec-2099' } } as unknown as Event;
      component.onTerminationDateInput(mockEvent);
      expect(DateFieldValidationUtility.handleEndDateInput).toHaveBeenCalledWith(
        '31-Dec-2099', component.form.get('terminationDate'), false
      );
    });

    it('should call handleEndDateInput with isEditMode true in edit mode', () => {
      component.mode = 'edit';
      spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const mockEvent = { target: { value: '31-Dec-2099' } } as unknown as Event;
      component.onTerminationDateInput(mockEvent);
      expect(DateFieldValidationUtility.handleEndDateInput).toHaveBeenCalledWith(
        '31-Dec-2099', component.form.get('terminationDate'), true
      );
    });
  });

  /* DATE VALIDATION LISTENERS */

  describe('Date Validation Listeners', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set lastChangedDateField to termination when termination date changes', fakeAsync(() => {
      component.form.get('terminationDate')?.setValue(moment().add(30, 'days'));
      tick();
      expect(component['lastChangedDateField']).toBe('termination');
    }));

    it('should update lastChangedDateField based on the last changed date field', fakeAsync(() => {
      // Setting effective date may also trigger termination update via template [min] binding,
      // so verify that explicitly setting termination AFTER effective gives 'termination'
      component.form.get('effectiveDate')?.setValue(moment().add(5, 'days'));
      tick();
      component.form.get('terminationDate')?.setValue(moment().add(30, 'days'));
      tick();
      expect(component['lastChangedDateField']).toBe('termination');
    }));
  });

  /* SAVE (ADD MODE) */

  describe('Save - Add Mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      service.addUserInterdictionClass.and.returnValue(of({ success: true, message: 'Success' }));
      fixture.detectChanges();
      tick();
    }));

    it('should not save when form is invalid', fakeAsync(() => {
      component.onSave();
      tick();
      expect(service.addUserInterdictionClass).not.toHaveBeenCalled();
    }));

    it('should mark all fields as touched on save attempt', fakeAsync(() => {
      component.onSave();
      tick();
      expect(component.form.get('user')?.touched).toBe(true);
      expect(component.form.get('interdictionClass')?.touched).toBe(true);
      expect(component.form.get('effectiveDate')?.touched).toBe(true);
    }));

    it('should not save when form has date range validation error', fakeAsync(() => {
      component.form.get('user')?.setValue('USER001');
      component.form.get('interdictionClass')?.setValue('SYS');
      component.form.get('effectiveDate')?.setValue(moment().add(100, 'days'));
      component.form.get('terminationDate')?.setValue(moment().add(5, 'days'));
      tick();

      component.onSave();
      tick();

      expect(service.addUserInterdictionClass).not.toHaveBeenCalled();
    }));

    it('should call addUserInterdictionClass with correct DTO', fakeAsync(() => {
      component.form.get('user')?.setValue('USER001');
      component.form.get('interdictionClass')?.setValue('SYS');
      component.form.get('effectiveDate')?.setValue(futureEffectiveDate.clone());
      tick();

      component.onSave();
      tick();

      expect(service.addUserInterdictionClass).toHaveBeenCalled();
      const dto = service.addUserInterdictionClass.calls.argsFor(0)[0];
      expect(dto.userId).toBe('USER001');
      expect(dto.interClass).toBe('SYS');
      expect(dto.effectiveDate).toContain('T00:00:00');
    }));

    it('should reset isSaving after save completes', fakeAsync(() => {
      component.form.get('user')?.setValue('USER001');
      component.form.get('interdictionClass')?.setValue('SYS');
      component.form.get('effectiveDate')?.setValue(futureEffectiveDate.clone());
      tick();

      component.onSave();
      tick();

      expect(component.isSaving).toBe(false);
      expect(component.savingAction).toBeNull();
    }));

    it('should show success snackbar on successful add', fakeAsync(() => {
      const openSpy = spyOnComponentSnackBar();

      component.form.get('user')?.setValue('USER001');
      component.form.get('interdictionClass')?.setValue('SYS');
      component.form.get('effectiveDate')?.setValue(futureEffectiveDate.clone());
      tick();

      component.onSave();
      tick();

      expect(openSpy).toHaveBeenCalledWith(
        'User interdiction class has been assigned successfully.',
        'DISMISS',
        jasmine.objectContaining({ duration: 3000 })
      );
    }));

    it('should emit saveSuccess on successful add', fakeAsync(() => {
      spyOn(component.saveSuccess, 'emit');
      component.form.get('user')?.setValue('USER001');
      component.form.get('interdictionClass')?.setValue('SYS');
      component.form.get('effectiveDate')?.setValue(futureEffectiveDate.clone());
      tick();

      component.onSave();
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        userId: 'USER001',
        userName: 'John Doe',
        interdictionClass: 'SYS'
      }));
    }));

    it('should emit closePanel on successful add without dialogRef', fakeAsync(() => {
      spyOn(component.closePanel, 'emit');
      component.form.get('user')?.setValue('USER001');
      component.form.get('interdictionClass')?.setValue('SYS');
      component.form.get('effectiveDate')?.setValue(futureEffectiveDate.clone());
      tick();

      component.onSave();
      tick();

      expect(component.closePanel.emit).toHaveBeenCalled();
    }));

    it('should handle save API error', fakeAsync(() => {
      service.addUserInterdictionClass.and.returnValue(throwError(() => new Error('Save Error')));
      spyOn(console, 'error');

      component.form.get('user')?.setValue('USER001');
      component.form.get('interdictionClass')?.setValue('SYS');
      component.form.get('effectiveDate')?.setValue(futureEffectiveDate.clone());
      tick();

      component.onSave();
      tick();

      expect(console.error).toHaveBeenCalledWith('Error saving user interdiction class:', jasmine.any(Error));
      expect(component.isSaving).toBe(false);
    }));

    it('should look up userName from userOptions', fakeAsync(() => {
      spyOn(component.saveSuccess, 'emit');
      component.form.get('user')?.setValue('USER002');
      component.form.get('interdictionClass')?.setValue('SYS');
      component.form.get('effectiveDate')?.setValue(futureEffectiveDate.clone());
      tick();

      component.onSave();
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        userId: 'USER002',
        userName: 'Jane Smith'
      }));
    }));

    it('should set userName to empty when user not found in options', fakeAsync(() => {
      spyOn(component.saveSuccess, 'emit');
      component.form.get('user')?.setValue('UNKNOWN');
      component.form.get('interdictionClass')?.setValue('SYS');
      component.form.get('effectiveDate')?.setValue(futureEffectiveDate.clone());
      tick();

      component.onSave();
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        userId: 'UNKNOWN',
        userName: ''
      }));
    }));

    it('should include terminationDate in DTO when provided', fakeAsync(() => {
      component.form.get('user')?.setValue('USER001');
      component.form.get('interdictionClass')?.setValue('SYS');
      component.form.get('effectiveDate')?.setValue(futureEffectiveDate.clone());
      component.form.get('terminationDate')?.setValue(futureTerminationDate.clone());
      tick();

      component.onSave();
      tick();

      const dto = service.addUserInterdictionClass.calls.argsFor(0)[0];
      expect(dto.terminationDate).toContain('T00:00:00');
    }));

    it('should set terminationDate to null in DTO when not provided', fakeAsync(() => {
      component.form.get('user')?.setValue('USER001');
      component.form.get('interdictionClass')?.setValue('SYS');
      component.form.get('effectiveDate')?.setValue(futureEffectiveDate.clone());
      tick();

      component.onSave();
      tick();

      const dto = service.addUserInterdictionClass.calls.argsFor(0)[0];
      expect(dto.terminationDate).toBeNull();
    }));
  });

  /* SAVE (EDIT MODE) */

  describe('Save - Edit Mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockRecord;
      service.updateUserInterdictionClass.and.returnValue(of({ success: true, message: 'Success' }));
      fixture.detectChanges();
      tick();
    }));

    it('should call updateUserInterdictionClass with correct args', fakeAsync(() => {
      component.form.patchValue({
        effectiveDate: futureEffectiveDate.clone(),
        terminationDate: futureTerminationDate.clone()
      });
      tick();

      component.onSave();
      tick();

      expect(service.updateUserInterdictionClass).toHaveBeenCalledWith(
        'USER001',
        'SYS',
        jasmine.objectContaining({
          effectiveDate: jasmine.any(String),
          terminationDate: jasmine.any(String)
        })
      );
    }));

    it('should show update success message on save', fakeAsync(() => {
      const openSpy = spyOnComponentSnackBar();

      component.form.patchValue({
        effectiveDate: futureEffectiveDate.clone(),
        terminationDate: futureTerminationDate.clone()
      });
      tick();

      component.onSave();
      tick();

      expect(openSpy).toHaveBeenCalledWith(
        'User interdiction class has been updated successfully.',
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should use editModeValues for userId and userName in edit mode', fakeAsync(() => {
      spyOn(component.saveSuccess, 'emit');
      component.form.patchValue({
        effectiveDate: futureEffectiveDate.clone(),
        terminationDate: futureTerminationDate.clone()
      });
      tick();

      component.onSave();
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        userId: 'USER001',
        userName: 'John Doe'
      }));
    }));

    it('should handle update API error', fakeAsync(() => {
      service.updateUserInterdictionClass.and.returnValue(throwError(() => new Error('Update Error')));
      spyOn(console, 'error');

      component.form.patchValue({
        effectiveDate: futureEffectiveDate.clone(),
        terminationDate: futureTerminationDate.clone()
      });
      tick();

      component.onSave();
      tick();

      expect(console.error).toHaveBeenCalledWith('Error saving user interdiction class:', jasmine.any(Error));
      expect(component.isSaving).toBe(false);
    }));
  });

  /* SAVE AND CREATE ANOTHER (ADD MODE) */

  describe('Save and Create Another - Add Mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      service.addUserInterdictionClass.and.returnValue(of({ success: true, message: 'Success' }));
      fixture.detectChanges();
      tick();
    }));

    it('should not save when form is invalid', fakeAsync(() => {
      component.onSaveAndCreateAnother();
      tick();
      expect(service.addUserInterdictionClass).not.toHaveBeenCalled();
    }));

    it('should mark all fields as touched on save attempt', fakeAsync(() => {
      component.onSaveAndCreateAnother();
      tick();
      expect(component.form.get('user')?.touched).toBe(true);
    }));

    it('should not save when form has date range validation error', fakeAsync(() => {
      component.form.get('user')?.setValue('USER001');
      component.form.get('interdictionClass')?.setValue('SYS');
      component.form.get('effectiveDate')?.setValue(moment().add(100, 'days'));
      component.form.get('terminationDate')?.setValue(moment().add(5, 'days'));
      tick();

      component.onSaveAndCreateAnother();
      tick();

      expect(service.addUserInterdictionClass).not.toHaveBeenCalled();
    }));

    it('should call addUserInterdictionClass on valid form', fakeAsync(() => {
      component.form.get('user')?.setValue('USER001');
      component.form.get('interdictionClass')?.setValue('SYS');
      component.form.get('effectiveDate')?.setValue(futureEffectiveDate.clone());
      tick();

      component.onSaveAndCreateAnother();
      tick();

      expect(service.addUserInterdictionClass).toHaveBeenCalled();
    }));

    it('should reset savingAction after save completes', fakeAsync(() => {
      component.form.get('user')?.setValue('USER001');
      component.form.get('interdictionClass')?.setValue('SYS');
      component.form.get('effectiveDate')?.setValue(futureEffectiveDate.clone());
      tick();

      component.onSaveAndCreateAnother();
      tick();

      // After finalize
      expect(component.savingAction).toBeNull();
    }));

    it('should emit saveSuccess on successful save and create another', fakeAsync(() => {
      spyOn(component.saveSuccess, 'emit');
      component.form.get('user')?.setValue('USER001');
      component.form.get('interdictionClass')?.setValue('SYS');
      component.form.get('effectiveDate')?.setValue(futureEffectiveDate.clone());
      tick();

      component.onSaveAndCreateAnother();
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
    }));

    it('should reset form after successful save in add mode', fakeAsync(() => {
      component.form.get('user')?.setValue('USER001');
      component.form.get('interdictionClass')?.setValue('SYS');
      component.form.get('effectiveDate')?.setValue(futureEffectiveDate.clone());
      tick();

      component.onSaveAndCreateAnother();
      tick();

      const rawValues = component.form.getRawValue();
      expect(rawValues.user).toBeFalsy();
      expect(rawValues.interdictionClass).toBeFalsy();
      expect(rawValues.effectiveDate).toBeNull();
    }));

    it('should not emit closePanel on save and create another', fakeAsync(() => {
      spyOn(component.closePanel, 'emit');
      component.form.get('user')?.setValue('USER001');
      component.form.get('interdictionClass')?.setValue('SYS');
      component.form.get('effectiveDate')?.setValue(futureEffectiveDate.clone());
      tick();

      component.onSaveAndCreateAnother();
      tick();

      expect(component.closePanel.emit).not.toHaveBeenCalled();
    }));

    it('should show success snackbar on save and create another', fakeAsync(() => {
      const openSpy = spyOnComponentSnackBar();

      component.form.get('user')?.setValue('USER001');
      component.form.get('interdictionClass')?.setValue('SYS');
      component.form.get('effectiveDate')?.setValue(futureEffectiveDate.clone());
      tick();

      component.onSaveAndCreateAnother();
      tick();

      expect(openSpy).toHaveBeenCalledWith(
        'User interdiction class has been assigned successfully.',
        'DISMISS',
        jasmine.objectContaining({ duration: 3000 })
      );
    }));

    it('should handle save and create another API error', fakeAsync(() => {
      service.addUserInterdictionClass.and.returnValue(throwError(() => new Error('Save Error')));
      spyOn(console, 'error');

      component.form.get('user')?.setValue('USER001');
      component.form.get('interdictionClass')?.setValue('SYS');
      component.form.get('effectiveDate')?.setValue(futureEffectiveDate.clone());
      tick();

      component.onSaveAndCreateAnother();
      tick();

      expect(console.error).toHaveBeenCalledWith('Error saving user interdiction class:', jasmine.any(Error));
      expect(component.isSaving).toBe(false);
    }));
  });

  /* SAVE AND CREATE ANOTHER (EDIT MODE) */

  describe('Save and Create Another - Edit Mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockRecord;
      service.updateUserInterdictionClass.and.returnValue(of({ success: true, message: 'Success' }));
      fixture.detectChanges();
      tick();
    }));

    it('should call updateUserInterdictionClass in edit mode', fakeAsync(() => {
      component.form.patchValue({
        effectiveDate: futureEffectiveDate.clone(),
        terminationDate: futureTerminationDate.clone()
      });
      tick();

      component.onSaveAndCreateAnother();
      tick();

      expect(service.updateUserInterdictionClass).toHaveBeenCalled();
    }));

    it('should switch to add mode after save and create another in edit mode', fakeAsync(() => {
      component.form.patchValue({
        effectiveDate: futureEffectiveDate.clone(),
        terminationDate: futureTerminationDate.clone()
      });
      tick();

      component.onSaveAndCreateAnother();
      tick();

      expect(component.mode).toBe('add');
    }));

    it('should emit modeChange when switching from edit to add', fakeAsync(() => {
      spyOn(component.modeChange, 'emit');
      component.form.patchValue({
        effectiveDate: futureEffectiveDate.clone(),
        terminationDate: futureTerminationDate.clone()
      });
      tick();

      component.onSaveAndCreateAnother();
      tick();

      expect(component.modeChange.emit).toHaveBeenCalledWith('add');
    }));

    it('should update panelTitle after switching to add mode', fakeAsync(() => {
      component.form.patchValue({
        effectiveDate: futureEffectiveDate.clone(),
        terminationDate: futureTerminationDate.clone()
      });
      tick();

      component.onSaveAndCreateAnother();
      tick();

      expect(component.panelTitle).toBe('Assign User Interdiction Class');
    }));

    it('should re-enable user control after switching to add mode', fakeAsync(() => {
      component.form.patchValue({
        effectiveDate: futureEffectiveDate.clone(),
        terminationDate: futureTerminationDate.clone()
      });
      tick();

      component.onSaveAndCreateAnother();
      tick();

      expect(component.form.get('user')?.disabled).toBe(false);
    }));

    it('should show update success message in edit mode', fakeAsync(() => {
      const openSpy = spyOnComponentSnackBar();

      component.form.patchValue({
        effectiveDate: futureEffectiveDate.clone(),
        terminationDate: futureTerminationDate.clone()
      });
      tick();

      component.onSaveAndCreateAnother();
      tick();

      expect(openSpy).toHaveBeenCalledWith(
        'User interdiction class has been updated successfully.',
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should reset editModeValues after switching to add mode', fakeAsync(() => {
      component.form.patchValue({
        effectiveDate: futureEffectiveDate.clone(),
        terminationDate: futureTerminationDate.clone()
      });
      tick();

      component.onSaveAndCreateAnother();
      tick();

      expect(component.editModeValues.userId).toBe('');
      expect(component.editModeValues.userName).toBe('');
    }));
  });

  /* LIFECYCLE HOOKS */

  describe('Lifecycle Hooks', () => {
    it('should handle ngOnChanges when mode changes from add to edit (not firstChange)', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.mode = 'edit';
      component.data = mockRecord;

      const changes = {
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, mockRecord, false)
      };

      component.ngOnChanges(changes);
      fixture.detectChanges();

      expect(component.panelTitle).toBe('Edit User Interdiction Class');
    }));

    it('should skip setupPanel on firstChange', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const changes = {
        mode: new SimpleChange(undefined, 'add', true),
        data: new SimpleChange(undefined, null, true)
      };

      const originalTitle = component.panelTitle;
      component.ngOnChanges(changes);

      // panelTitle shouldn't change from what was set in ngOnInit
      expect(component.panelTitle).toBe(originalTitle);
    }));

    it('should reset form when changing to add mode via ngOnChanges', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockRecord;
      fixture.detectChanges();
      tick();

      component.mode = 'add';
      component.data = null;

      const changes = {
        mode: new SimpleChange('edit', 'add', false)
      };

      component.ngOnChanges(changes);
      fixture.detectChanges();

      expect(component.panelTitle).toBe('Assign User Interdiction Class');
      expect(component.form.get('user')?.disabled).toBe(false);
    }));

    it('should call ngOnDestroy without error', () => {
      fixture.detectChanges();
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should complete destroy$ on ngOnDestroy', () => {
      fixture.detectChanges();
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  /* FORM CONTROL GETTERS */

  describe('Form Control Getters', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return user control', () => {
      expect(component.userControl).toBe(component.form.get('user'));
    });

    it('should return interdictionClass control', () => {
      expect(component.interdictionClassControl).toBe(component.form.get('interdictionClass'));
    });

    it('should return description control', () => {
      expect(component.descriptionControl).toBe(component.form.get('description'));
    });

    it('should return effectiveDate control', () => {
      expect(component.effectiveDateControl).toBe(component.form.get('effectiveDate'));
    });

    it('should return terminationDate control', () => {
      expect(component.terminationDateControl).toBe(component.form.get('terminationDate'));
    });
  });

  /* ERROR MESSAGE METHODS */

  describe('Error Message Methods', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    describe('getUserError', () => {
      it('should return empty string when control not touched', () => {
        expect(component.getUserError()).toBe('');
      });

      it('should return required error when touched and empty', () => {
        const control = component.form.get('user');
        control?.setValue('');
        control?.markAsTouched();
        expect(component.getUserError()).toBe('User is required');
      });

      it('should return empty string when control has value', () => {
        const control = component.form.get('user');
        control?.setValue('USER001');
        control?.markAsTouched();
        expect(component.getUserError()).toBe('');
      });
    });

    describe('getInterdictionClassError', () => {
      it('should return empty string when control not touched', () => {
        expect(component.getInterdictionClassError()).toBe('');
      });

      it('should return required error when touched and empty', () => {
        const control = component.form.get('interdictionClass');
        control?.setValue('');
        control?.markAsTouched();
        expect(component.getInterdictionClassError()).toBe('Interdiction Class is required');
      });

      it('should return empty string when control has value', () => {
        const control = component.form.get('interdictionClass');
        control?.setValue('SYS');
        control?.markAsTouched();
        expect(component.getInterdictionClassError()).toBe('');
      });
    });

    describe('getEffectiveDateError', () => {
      it('should return empty string when control not touched', () => {
        expect(component.getEffectiveDateError()).toBe('');
      });

      it('should return required error when touched and null', () => {
        const control = component.form.get('effectiveDate');
        control?.setValue(null);
        control?.markAsTouched();
        expect(component.getEffectiveDateError()).toBe('Effective Date is required');
      });

      it('should return past date error when effectiveDatePast error is set', () => {
        const control = component.form.get('effectiveDate');
        control?.setValue(moment('2020-01-01'));
        control?.setErrors({ effectiveDatePast: true });
        control?.markAsTouched();
        component['lastChangedDateField'] = 'effective';
        expect(component.getEffectiveDateError()).toBe('Effective Date cannot be past date');
      });
    });

    describe('getTerminationDateError', () => {
      it('should return empty string when control not touched', () => {
        expect(component.getTerminationDateError()).toBe('');
      });

      it('should return date range error when lastChangedDateField is termination and dateRangeInvalid', fakeAsync(() => {
        component.form.get('effectiveDate')?.setValue(moment().add(100, 'days'));
        component.form.get('terminationDate')?.setValue(moment().add(5, 'days'));
        component.form.get('terminationDate')?.markAsTouched();
        component['lastChangedDateField'] = 'termination';
        tick();

        const error = component.getTerminationDateError();
        expect(error).toBe('Termination Date must be greater than or equal to Effective Date');
      }));
    });
  });

  /* FORMAT METHODS */

  describe('Format Methods', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    describe('formatDate', () => {
      it('should return dash for null date', () => {
        expect(component.formatDate(null)).toBe('-');
      });

      it('should format valid date as DD-MMM-YYYY', () => {
        const date = new Date(2099, 0, 15);
        const result = component.formatDate(date);
        expect(result).toBe('15-Jan-2099');
      });
    });

    describe('formatDateTime', () => {
      it('should return empty string for null date', () => {
        expect(component.formatDateTime(null)).toBe('');
      });

      it('should format today date with Today prefix', () => {
        const today = new Date();
        const result = component.formatDateTime(today);
        expect(result).toContain('Today');
        expect(result).toContain('PST');
      });

      it('should format past date with DD-MMM-YYYY format', () => {
        const pastDate = pastModifiedDate.toDate();
        const result = component.formatDateTime(pastDate);
        expect(result.toUpperCase()).toContain(pastModifiedDate.format('DD-MMM-YYYY').toUpperCase());
        expect(result).toContain('PST');
      });
    });
  });

  /* isFormValid */

  describe('isFormValid', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return false for invalid form in add mode', () => {
      component.mode = 'add';
      expect(component.isFormValid).toBe(false);
    });

    it('should return true for valid form in add mode', fakeAsync(() => {
      component.mode = 'add';
      component.form.get('user')?.setValue('USER001');
      component.form.get('interdictionClass')?.setValue('SYS');
      component.form.get('effectiveDate')?.setValue(futureEffectiveDate.clone());
      tick();
      component.form.updateValueAndValidity();
      tick();

      if (component.form.valid) {
        expect(component.isFormValid).toBe(true);
      }
    }));

    it('should return false in edit mode when form has not changed', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockRecord;
      component['setupPanel']();
      tick();

      // Form is populated but hasn't changed from initial values
      expect(component.isFormValid).toBe(false);
    }));

    it('should return true in edit mode when form has changed', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockRecord;
      component['setupPanel']();
      tick();

      // Change a date to make it different from initial values
      component.form.get('effectiveDate')?.setValue(moment().add(999, 'days'));
      tick();
      component.form.updateValueAndValidity();
      tick();

      if (component.form.valid) {
        expect(component.isFormValid).toBe(true);
      }
    }));

    it('should return false when form has dateRangeInvalid error', fakeAsync(() => {
      component.mode = 'add';
      component.form.get('user')?.setValue('USER001');
      component.form.get('interdictionClass')?.setValue('SYS');
      component.form.get('effectiveDate')?.setValue(moment().add(100, 'days'));
      component.form.get('terminationDate')?.setValue(moment().add(5, 'days'));
      tick();
      component.form.updateValueAndValidity();
      tick();

      expect(component.isFormValid).toBe(false);
    }));
  });

  /* hasFormChanged */

  describe('hasFormChanged (private)', () => {
    it('should return true in add mode', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.mode = 'add';
      expect(component['hasFormChanged']()).toBe(true);
    }));

    it('should return true when initialFormValues is null', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.mode = 'edit';
      component['initialFormValues'] = null;
      expect(component['hasFormChanged']()).toBe(true);
    }));

    it('should return false in edit mode when dates have not changed', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockRecord;
      fixture.detectChanges();
      tick();

      expect(component['hasFormChanged']()).toBe(false);
    }));

    it('should return true in edit mode when effective date changes', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockRecord;
      fixture.detectChanges();
      tick();

      component.form.get('effectiveDate')?.setValue(moment().add(999, 'days'));
      tick();

      expect(component['hasFormChanged']()).toBe(true);
    }));

    it('should return true in edit mode when termination date changes', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockRecord;
      fixture.detectChanges();
      tick();

      component.form.get('terminationDate')?.setValue(moment().add(999, 'days'));
      tick();

      expect(component['hasFormChanged']()).toBe(true);
    }));

    it('should handle non-moment effective date value', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockRecord;
      fixture.detectChanges();
      tick();

      component.form.get('effectiveDate')?.setValue('not-a-moment');
      tick();

      expect(component['hasFormChanged']()).toBe(true);
    }));
  });

  /* RESET FORM FOR ADD MODE */

  describe('resetFormForAddMode (private)', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockRecord;
      fixture.detectChanges();
      tick();
    }));

    it('should clear editModeValues', () => {
      component['resetFormForAddMode']();
      expect(component.editModeValues.userId).toBe('');
      expect(component.editModeValues.userName).toBe('');
      expect(component.editModeValues.interClass).toBe('');
      expect(component.editModeValues.interClassDesc).toBe('');
      expect(component.editModeValues.effectiveDate).toBe('');
    });

    it('should reset form controls', () => {
      component['resetFormForAddMode']();
      expect(component.form.pristine).toBe(true);
      expect(component.form.untouched).toBe(true);
    });

    it('should enable user control', () => {
      component['resetFormForAddMode']();
      expect(component.form.get('user')?.disabled).toBe(false);
    });

    it('should disable description control', () => {
      component['resetFormForAddMode']();
      expect(component.form.get('description')?.disabled).toBe(true);
    });
  });

  /* POPULATE FORM FOR EDIT */

  describe('populateFormForEdit (private)', () => {
    it('should not populate form when data is null', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.data = null;
      component['populateFormForEdit']();
      expect(component.form.get('user')?.value).toBeFalsy();
    }));

    it('should handle data with empty strings', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.data = {
        userId: '',
        userName: '',
        interClass: '',
        interClassDesc: '',
        effectiveDate: null,
        terminationDate: null,
        lastModifiedDate: null,
        isActive: false
      };
      expect(() => component['populateFormForEdit']()).not.toThrow();
    }));
  });

  /* TERMINATION MIN DATE - additional non-moment input */

  describe('terminationMinDate with non-moment date', () => {
    it('should handle plain Date object for effective date', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      component.form.patchValue({ effectiveDate: futureDate });
      expect(component.terminationMinDate).toBeTruthy();
    }));
  });

  /* EDGE CASES */

  describe('Edge Cases', () => {
    it('should handle null data in edit mode without error', fakeAsync(() => {
      component.mode = 'edit';
      component.data = null;
      expect(() => {
        fixture.detectChanges();
        tick();
      }).not.toThrow();
    }));

    it('should handle empty form values in DTO gracefully', fakeAsync(() => {
      service.addUserInterdictionClass.and.returnValue(of({ success: true, message: 'Success' }));
      fixture.detectChanges();
      tick();

      component.form.get('user')?.setValue('USER001');
      component.form.get('interdictionClass')?.setValue('SYS');
      component.form.get('effectiveDate')?.setValue(futureEffectiveDate.clone());
      component.form.get('terminationDate')?.setValue(null);
      tick();

      component.onSave();
      tick();

      const dto = service.addUserInterdictionClass.calls.argsFor(0)[0];
      expect(dto.terminationDate).toBeNull();
    }));

    it('should handle data with missing optional fields in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        userId: 'USER001',
        userName: 'John Doe',
        interClass: 'SYS',
        interClassDesc: 'System Interdictions',
        effectiveDate: futureEffectiveDate.toDate(),
        terminationDate: null,
        lastModifiedDate: null,
        isActive: true
      };
      expect(() => {
        fixture.detectChanges();
        tick();
      }).not.toThrow();
    }));

    it('should handle interdiction class with no description in options', fakeAsync(() => {
      service.getInterdictionClasses.and.returnValue(of([
        { code: 'NODESC', description: '' }
      ]));
      fixture.detectChanges();
      tick();

      component.form.get('interdictionClass')?.setValue('NODESC');
      tick();

      expect(component.form.getRawValue().description).toBe('');
    }));
  });

  /* ERROR STATE MATCHERS */

  describe('Error State Matchers', () => {
    it('should have effDateErrorMatcher defined', () => {
      expect(component.effDateErrorMatcher).toBeTruthy();
      expect(component.effDateErrorMatcher.isErrorState).toBeDefined();
    });

    it('should have termDateErrorMatcher defined', () => {
      expect(component.termDateErrorMatcher).toBeTruthy();
      expect(component.termDateErrorMatcher.isErrorState).toBeDefined();
    });
  });

  /* DIALOG TESTS - placed at the end to avoid TestBed conflicts with other tests */

  describe('onCancel with dialogRef', () => {
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddEditUserInterdictionClass>>;
    let dialogFixture: ComponentFixture<AddEditUserInterdictionClass>;
    let dialogComponent: AddEditUserInterdictionClass;

    beforeEach(() => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddEditUserInterdictionClass, HttpClientTestingModule, NoopAnimationsModule],
        providers: [
          { provide: AssignUserInterdictionClassService, useValue: serviceSpy },
          { provide: MatSnackBar, useValue: createMockMatSnackBar() },
          { provide: HeaderService, useValue: headerServiceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: { mode: 'add', data: null } }
        ]
      });

      const dialogService = TestBed.inject(AssignUserInterdictionClassService) as jasmine.SpyObj<AssignUserInterdictionClassService>;
      dialogService.getUsers.and.returnValue(of(mockUsers));
      dialogService.getInterdictionClasses.and.returnValue(of(mockClasses));

      dialogFixture = TestBed.createComponent(AddEditUserInterdictionClass);
      dialogComponent = dialogFixture.componentInstance;
    });

    afterEach(() => {
      dialogFixture.destroy();
    });

    it('should close dialogRef when dialogRef is present', fakeAsync(() => {
      dialogFixture.detectChanges();
      tick();
      dialogComponent.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    }));

    it('should set mode from dialogData', () => {
      expect(dialogComponent.mode).toBe('add');
    });
  });

  describe('Dialog with edit mode data', () => {
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddEditUserInterdictionClass>>;
    let dialogFixture: ComponentFixture<AddEditUserInterdictionClass>;
    let dialogComponent: AddEditUserInterdictionClass;

    beforeEach(() => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddEditUserInterdictionClass, HttpClientTestingModule, NoopAnimationsModule],
        providers: [
          { provide: AssignUserInterdictionClassService, useValue: serviceSpy },
          { provide: MatSnackBar, useValue: createMockMatSnackBar() },
          { provide: HeaderService, useValue: headerServiceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: { mode: 'edit', data: mockRecord } }
        ]
      });

      const dialogService = TestBed.inject(AssignUserInterdictionClassService) as jasmine.SpyObj<AssignUserInterdictionClassService>;
      dialogService.getUsers.and.returnValue(of(mockUsers));
      dialogService.getInterdictionClasses.and.returnValue(of(mockClasses));

      dialogFixture = TestBed.createComponent(AddEditUserInterdictionClass);
      dialogComponent = dialogFixture.componentInstance;
    });

    afterEach(() => {
      dialogFixture.destroy();
    });

    it('should set mode and data from dialogData', () => {
      expect(dialogComponent.mode).toBe('edit');
      expect(dialogComponent.data).toBe(mockRecord);
    });
  });

  describe('Save with DialogRef', () => {
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddEditUserInterdictionClass>>;
    let dialogFixture: ComponentFixture<AddEditUserInterdictionClass>;
    let dialogComponent: AddEditUserInterdictionClass;

    beforeEach(() => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddEditUserInterdictionClass, HttpClientTestingModule, NoopAnimationsModule],
        providers: [
          { provide: AssignUserInterdictionClassService, useValue: serviceSpy },
          { provide: MatSnackBar, useValue: createMockMatSnackBar() },
          { provide: HeaderService, useValue: headerServiceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: { mode: 'add', data: null } }
        ]
      });

      const dialogService = TestBed.inject(AssignUserInterdictionClassService) as jasmine.SpyObj<AssignUserInterdictionClassService>;
      dialogService.getUsers.and.returnValue(of(mockUsers));
      dialogService.getInterdictionClasses.and.returnValue(of(mockClasses));
      dialogService.addUserInterdictionClass.and.returnValue(of({ success: true, message: 'Success' }));

      dialogFixture = TestBed.createComponent(AddEditUserInterdictionClass);
      dialogComponent = dialogFixture.componentInstance;
    });

    afterEach(() => {
      dialogFixture.destroy();
    });

    it('should close dialogRef with success on save', fakeAsync(() => {
      dialogFixture.detectChanges();
      tick();

      dialogComponent.form.get('user')?.setValue('USER001');
      dialogComponent.form.get('interdictionClass')?.setValue('SYS');
      dialogComponent.form.get('effectiveDate')?.setValue(futureEffectiveDate.clone());
      tick();

      dialogComponent.onSave();
      tick();

      expect(dialogRefSpy.close).toHaveBeenCalledWith({ success: true });
    }));
  });
});
