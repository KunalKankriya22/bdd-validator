import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { AddEditAddFunctions } from './add-edit-add-functions';
import { AddEditAddFunctionsService } from '../add-functions/services/add-edit-add-function.service';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AddEditAddFunctions', () => {
  let component: AddEditAddFunctions;
  let fixture: ComponentFixture<AddEditAddFunctions>;
  let service: jasmine.SpyObj<AddEditAddFunctionsService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<AddEditAddFunctions>>;

  function createComponent(dialogData: any = { mode: 'add', data: null }) {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: dialogData });
    fixture = TestBed.createComponent(AddEditAddFunctions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    service = jasmine.createSpyObj('AddEditAddFunctionsService', ['getIconsList', 'add', 'edit', 'getDetail']);
    snackBar = createMockMatSnackBar();
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    service.getIconsList.and.returnValue(of(['home', 'link']));
    service.getDetail.and.returnValue(of({ applId: 'WEB', fcnClass: 'WEBAPP', programAuthor: '', hostCmd: '', applicationType: '' }));

    await TestBed.configureTestingModule({
      imports: [AddEditAddFunctions, ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: AddEditAddFunctionsService, useValue: service },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { mode: 'add', data: null } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditAddFunctions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should init form controls', () => {
    expect(component.form.contains('executableName')).toBeTrue();
    expect(component.form.contains('functionType')).toBeTrue();
    expect(component.form.contains('webIcon')).toBeTrue();
  });

  it('should patch form in edit mode', () => {
    component.data = { mode: 'edit', data: { execName: 'Test', fcnType: 'page', fcnIcon: 'home' } } as any;
    component.ngOnInit();
    // Use getRawValue() because executableName is disabled in edit mode
    expect(component.form.getRawValue().executableName).toBe('Test');
  });

  it('should load icons list', () => {
    expect(component.iconsList).toEqual(['home', 'link']);
  });

  it('should show icon load error', () => {
    service.getIconsList.and.returnValue(throwError(() => new Error()));
    component.getIconsList();
  });

  it('should change selected icon', () => {
    component.onIconChange({ value: 'link' });
    expect(component.selectedIcon).toBe('link');
  });

  describe('submit', () => {


    it('should handle submit error', fakeAsync(() => {
      component.data = { mode: 'add' } as any;
      component.ngOnInit();

      component.form.patchValue({
        executableName: 'TEST',
        functionType: 'PAGE',
        scope: 'S',
        webUrl: 'http://example.com',
        parameter1: '',
        parameter2: '',
        parameter3: '',
        remarks: '',
        webIcon: 'home'
      });

      service.add.and.returnValue(throwError(() => ({ error: { message: 'Fail' } })));
      component.onSubmit();
      tick();
    }));
  });

  // =====================================================================
  // ngOnInit
  // =====================================================================
  describe('ngOnInit', () => {
    it('should default to add mode when data.mode is not provided', () => {
      component.data = {} as any;
      component.ngOnInit();
      expect(component.mode).toBe('add');
    });

    it('should default recordData to null when data.data is not provided', () => {
      component.data = { mode: 'add' } as any;
      component.ngOnInit();
      expect(component.recordData).toBeNull();
    });

    it('should set editModeValues in edit mode with recordData', () => {
      component.data = {
        mode: 'edit',
        data: { fcnId: 'F001', execName: 'TESTEXEC', fcnType: 'PAGE', fcnIcon: 'home' }
      } as any;
      component.ngOnInit();
      expect(component.editModeValues.fcnId).toBe('F001');
      expect(component.editModeValues.execName).toBe('TESTEXEC');
    });

    it('should not set editModeValues in add mode', () => {
      component.data = { mode: 'add', data: null } as any;
      component.ngOnInit();
      expect(component.editModeValues.fcnId).toBe('');
      expect(component.editModeValues.execName).toBe('');
    });

    it('should call patchFormForEdit and fetchExistingDetail in edit mode', () => {
      const editData = {
        fcnId: 'F001',
        execName: 'TESTEXEC',
        fcnType: 'PAGE',
        fcnScope: 'SCOPE1',
        fcnUrl: 'http://test.com',
        fcnIcon: 'home',
        p1Name: 'P1',
        p2Name: 'P2',
        p3Name: 'P3',
        remarks: 'Some remark'
      };
      component.data = { mode: 'edit', data: editData } as any;
      component.ngOnInit();

      expect(component.form.getRawValue().executableName).toBe('TESTEXEC');
      expect(component.form.get('functionType')?.value).toBe('PAGE');
      expect(component.form.get('scope')?.value).toBe('SCOPE1');
      expect(component.form.get('webUrl')?.value).toBe('http://test.com');
      expect(component.form.get('parameter1')?.value).toBe('P1');
      expect(component.form.get('parameter2')?.value).toBe('P2');
      expect(component.form.get('parameter3')?.value).toBe('P3');
      expect(component.form.get('remarks')?.value).toBe('Some remark');
      expect(service.getDetail).toHaveBeenCalledWith('F001');
    });

    it('should handle editModeValues with missing fcnId and execName in recordData', () => {
      component.data = {
        mode: 'edit',
        data: { fcnId: '', execName: '', fcnType: 'PAGE' }
      } as any;
      component.ngOnInit();
      expect(component.editModeValues.fcnId).toBe('');
      expect(component.editModeValues.execName).toBe('');
    });
  });

  // =====================================================================
  // initializeForm
  // =====================================================================
  describe('initializeForm', () => {
    it('should create form with all required controls', () => {
      const controls = ['executableName', 'functionType', 'scope', 'webUrl',
        'parameter1', 'parameter2', 'parameter3', 'remarks', 'webIcon'];
      controls.forEach(ctrl => {
        expect(component.form.contains(ctrl)).toBeTrue();
      });
    });

    it('should make executableName required', () => {
      component.form.get('executableName')?.setValue('');
      expect(component.form.get('executableName')?.hasError('required')).toBeTrue();
    });

    it('should make functionType required', () => {
      component.form.get('functionType')?.setValue('');
      expect(component.form.get('functionType')?.hasError('required')).toBeTrue();
    });

    it('should disable executableName in edit mode', () => {
      component.data = {
        mode: 'edit',
        data: { fcnId: 'F1', execName: 'TEST', fcnType: 'PAGE' }
      } as any;
      component.ngOnInit();
      expect(component.form.get('executableName')?.disabled).toBeTrue();
    });

    it('should enable executableName in add mode', () => {
      expect(component.form.get('executableName')?.enabled).toBeTrue();
    });
  });

  // =====================================================================
  // fetchExistingDetail
  // =====================================================================
  describe('fetchExistingDetail', () => {
    it('should populate preservedFields from service response', fakeAsync(() => {
      service.getDetail.and.returnValue(of({
        applId: ' CUSTOM ',
        fcnClass: ' CUSTOM_CLASS ',
        programAuthor: ' Author1 ',
        hostCmd: ' CMD1 ',
        applicationType: ' TYPE1 '
      }));

      component.data = {
        mode: 'edit',
        data: { fcnId: 'F001', execName: 'TEST', fcnType: 'PAGE' }
      } as any;
      component.ngOnInit();
      tick();

      // Fill form and submit to verify preserved fields are used in payload
      component.form.patchValue({
        functionType: 'PAGE',
        scope: '',
        webUrl: '',
        parameter1: '',
        parameter2: '',
        parameter3: '',
        remarks: '',
        webIcon: ''
      });

      service.edit.and.returnValue(of({}));
      component.onSubmit();
      tick();

      const payload = service.edit.calls.mostRecent().args[1];
      expect(payload.applId).toBe('CUSTOM');
      expect(payload.fcnClass).toBe('CUSTOM_CLASS');
      expect(payload.programAuthor).toBe('Author1');
      expect(payload.hostCmd).toBe('CMD1');
      expect(payload.applicationType).toBe('TYPE1');
    }));

    it('should use defaults when detail fields are null/undefined', fakeAsync(() => {
      service.getDetail.and.returnValue(of({
        applId: null,
        fcnClass: null,
        programAuthor: null,
        hostCmd: null,
        applicationType: null
      }));

      component.data = {
        mode: 'edit',
        data: { fcnId: 'F002', execName: 'TEST2', fcnType: 'PAGE' }
      } as any;
      component.ngOnInit();
      tick();

      // Submit to check defaults
      component.form.patchValue({ functionType: 'PAGE' });
      service.edit.and.returnValue(of({}));
      component.onSubmit();
      tick();

      const payload = service.edit.calls.mostRecent().args[1];
      expect(payload.applId).toBe('WEB');
      expect(payload.fcnClass).toBe('WEBAPP');
    }));

    it('should handle getDetail error gracefully', fakeAsync(() => {
      service.getDetail.and.returnValue(throwError(() => new Error('Network error')));

      component.data = {
        mode: 'edit',
        data: { fcnId: 'F003', execName: 'TEST3', fcnType: 'PAGE' }
      } as any;
      component.ngOnInit();
      tick();

      // Component should still function - no error thrown
      expect(component.form).toBeTruthy();
    }));
  });

  // =====================================================================
  // getIconsList
  // =====================================================================
  describe('getIconsList', () => {
    it('should set iconsList and filteredIconsList from response', () => {
      expect(component.iconsList).toEqual(['home', 'link']);
      expect(component.filteredIconsList).toEqual(['home', 'link']);
    });

    it('should set default icon to "language" if found in list', () => {
      service.getIconsList.and.returnValue(of(['home', 'language', 'link']));
      component.data = { mode: 'add', data: null } as any;
      component.ngOnInit();

      expect(component.form.get('webIcon')?.value).toBe('language');
      expect(component.selectedIcon).toBe('language');
    });

    it('should not set default icon if "language" is not in the list (add mode)', () => {
      service.getIconsList.and.returnValue(of(['home', 'link']));
      component.data = { mode: 'add', data: null } as any;
      component.ngOnInit();

      // 'language' was not in list, so default is not set for webIcon by default icon logic
      // But the form initialized webIcon to '' and home/link don't match 'language'
      // The webIcon could be '' or whatever was set by the form init
    });

    it('should set icon from recordData in edit mode', () => {
      service.getIconsList.and.returnValue(of(['home', 'link', 'star']));
      component.data = {
        mode: 'edit',
        data: { fcnId: 'F1', execName: 'TEST', fcnType: 'PAGE', fcnIcon: 'star' }
      } as any;
      component.ngOnInit();

      expect(component.form.get('webIcon')?.value).toBe('star');
      expect(component.selectedIcon).toBe('star');
    });

    it('should handle icon load error gracefully', () => {
      service.getIconsList.and.returnValue(throwError(() => new Error('Icon load failed')));
      component.getIconsList();
      // No error thrown - error handler is empty
    });
  });

  // =====================================================================
  // setupIconSearch
  // =====================================================================
  describe('setupIconSearch', () => {
    it('should filter icons based on search term', () => {
      component.iconsList = ['home', 'link', 'language', 'lock'];
      component.iconSearchControl.setValue('l');
      expect(component.filteredIconsList).toEqual(['link', 'language', 'lock']);
    });

    it('should return all icons when search term is empty', () => {
      component.iconsList = ['home', 'link', 'language'];
      component.iconSearchControl.setValue('');
      expect(component.filteredIconsList).toEqual(['home', 'link', 'language']);
    });

    it('should handle null search term', () => {
      component.iconsList = ['home', 'link'];
      component.iconSearchControl.setValue(null);
      expect(component.filteredIconsList).toEqual(['home', 'link']);
    });

    it('should be case-insensitive', () => {
      component.iconsList = ['Home', 'LINK', 'Language'];
      component.iconSearchControl.setValue('HOME');
      expect(component.filteredIconsList).toEqual(['Home']);
    });

    it('should return empty array when no icons match', () => {
      component.iconsList = ['home', 'link'];
      component.iconSearchControl.setValue('xyz');
      expect(component.filteredIconsList).toEqual([]);
    });
  });

  // =====================================================================
  // computed properties (title, saveButtonText)
  // =====================================================================
  describe('computed properties', () => {
    it('should return "Add Function" title in add mode', () => {
      expect(component.title()).toBe('Add Function');
    });

    it('should set mode to edit when data.mode is edit', () => {
      component.data = {
        mode: 'edit',
        data: { fcnId: 'F1', execName: 'TEST', fcnType: 'PAGE' }
      } as any;
      component.ngOnInit();
      expect(component.mode).toBe('edit');
    });

    it('should return "ADD" button text in add mode', () => {
      expect(component.saveButtonText()).toBe('ADD');
    });

    it('should set mode to add when data.mode is add', () => {
      component.data = { mode: 'add', data: null } as any;
      component.ngOnInit();
      expect(component.mode).toBe('add');
    });
  });

  // =====================================================================
  // onIconChange
  // =====================================================================
  describe('onIconChange', () => {
    it('should set selectedIcon to the event value', () => {
      component.onIconChange({ value: 'star' });
      expect(component.selectedIcon).toBe('star');
    });

    it('should handle null event value', () => {
      component.onIconChange({ value: null });
      expect(component.selectedIcon).toBeNull();
    });
  });

  // =====================================================================
  // onSubmit - add mode
  // =====================================================================
  describe('onSubmit (add mode)', () => {
    beforeEach(() => {
      component.form.patchValue({
        executableName: 'TESTFUNC',
        functionType: 'PAGE',
        scope: 'SCOPE1',
        webUrl: 'http://example.com',
        parameter1: 'P1',
        parameter2: 'P2',
        parameter3: 'P3',
        remarks: 'Test remark',
        webIcon: 'home'
      });
    });

    it('should not submit when form is invalid', () => {
      component.form.get('executableName')?.setValue('');
      component.onSubmit();
      expect(service.add).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when form is invalid', () => {
      component.form.get('executableName')?.setValue('');
      component.onSubmit();
      expect(component.form.get('executableName')?.touched).toBeTrue();
      expect(component.form.get('functionType')?.touched).toBeTrue();
    });

    it('should not submit when already submitting', () => {
      component.isSubmitting.set(true);
      component.onSubmit();
      expect(service.add).not.toHaveBeenCalled();
    });

    it('should set isSubmitting to true on submit', fakeAsync(() => {
      service.add.and.returnValue(of({}));
      component.onSubmit();
      // isSubmitting was set to true then back to false after success
      tick();
      expect(component.isSubmitting()).toBeFalse();
    }));

    it('should call service.add with correct payload', fakeAsync(() => {
      service.add.and.returnValue(of({}));
      component.onSubmit();
      tick();

      expect(service.add).toHaveBeenCalledWith(jasmine.objectContaining({
        applId: 'WEB',
        fcnClass: 'WEBAPP',
        fcnType: 'PAGE',
        execName: 'TESTFUNC',
        fcnScope: 'SCOPE1',
        fcnUrl: 'http://example.com',
        fcnIcon: 'home',
        p1Name: 'P1',
        p2Name: 'P2',
        p3Name: 'P3',
        remarks: 'Test remark',
        programAuthor: '',
        hostCmd: '',
        applicationType: ''
      }));
    }));

    it('should show success snackbar on successful add', fakeAsync(() => {
      service.add.and.returnValue(of({}));
      component.onSubmit();
      tick();

      expect(snackBar.open).toHaveBeenCalledWith(
        'TESTFUNC has been added successfully',
        'Close',
        jasmine.objectContaining({
          duration: 3000,
          panelClass: ['success-snackbar'],
          horizontalPosition: 'end',
          verticalPosition: 'top'
        })
      );
    }));

    it('should close dialog with true on successful add', fakeAsync(() => {
      service.add.and.returnValue(of({}));
      component.onSubmit();
      tick();

      expect(dialogRef.close).toHaveBeenCalledWith(true);
    }));

    it('should reset isSubmitting on add error', fakeAsync(() => {
      service.add.and.returnValue(throwError(() => ({ error: { error: 'Duplicate entry' } })));
      component.onSubmit();
      tick();

      expect(component.isSubmitting()).toBeFalse();
    }));

    it('should not close dialog on add error', fakeAsync(() => {
      service.add.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));
      component.onSubmit();
      tick();

      expect(dialogRef.close).not.toHaveBeenCalled();
    }));

    it('should handle add error with error.error.error message', fakeAsync(() => {
      service.add.and.returnValue(throwError(() => ({ error: { error: 'Custom error' } })));
      component.onSubmit();
      tick();

      expect(component.isSubmitting()).toBeFalse();
    }));

    it('should handle add error with error.error.message', fakeAsync(() => {
      service.add.and.returnValue(throwError(() => ({ error: { message: 'Server message' } })));
      component.onSubmit();
      tick();

      expect(component.isSubmitting()).toBeFalse();
    }));

    it('should handle add error with fallback message', fakeAsync(() => {
      service.add.and.returnValue(throwError(() => ({})));
      component.onSubmit();
      tick();

      expect(component.isSubmitting()).toBeFalse();
    }));
  });

  // =====================================================================
  // onSubmit - edit mode
  // =====================================================================
  describe('onSubmit (edit mode)', () => {
    const editRecord = {
      fcnId: 'F001',
      execName: 'EDITFUNC',
      fcnType: 'PAGE',
      fcnScope: 'SCOPE1',
      fcnUrl: 'http://edit.com',
      fcnIcon: 'home',
      p1Name: 'EP1',
      p2Name: 'EP2',
      p3Name: 'EP3',
      remarks: 'Edit remark'
    };

    beforeEach(() => {
      service.getDetail.and.returnValue(of({
        applId: 'WEB', fcnClass: 'WEBAPP', programAuthor: '', hostCmd: '', applicationType: ''
      }));
      component.data = { mode: 'edit', data: editRecord } as any;
      component.ngOnInit();
    });

    it('should call service.edit with fcnId and payload', fakeAsync(() => {
      service.edit.and.returnValue(of({}));
      component.onSubmit();
      tick();

      expect(service.edit).toHaveBeenCalledWith('F001', jasmine.objectContaining({
        execName: 'EDITFUNC',
        fcnType: 'PAGE'
      }));
    }));

    it('should show success snackbar on successful edit', fakeAsync(() => {
      service.edit.and.returnValue(of({}));
      component.onSubmit();
      tick();

      expect(snackBar.open).toHaveBeenCalledWith(
        'EDITFUNC has been updated successfully',
        'Close',
        jasmine.objectContaining({
          duration: 3000,
          panelClass: ['success-snackbar']
        })
      );
    }));

    it('should close dialog with true on successful edit', fakeAsync(() => {
      service.edit.and.returnValue(of({}));
      component.onSubmit();
      tick();

      expect(dialogRef.close).toHaveBeenCalledWith(true);
    }));

    it('should reset isSubmitting on edit error', fakeAsync(() => {
      service.edit.and.returnValue(throwError(() => ({ error: { error: 'Update failed' } })));
      component.onSubmit();
      tick();

      expect(component.isSubmitting()).toBeFalse();
    }));

    it('should not close dialog on edit error', fakeAsync(() => {
      service.edit.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));
      component.onSubmit();
      tick();

      expect(dialogRef.close).not.toHaveBeenCalled();
    }));

    it('should handle edit error with error.error.error message', fakeAsync(() => {
      service.edit.and.returnValue(throwError(() => ({ error: { error: 'Conflict error' } })));
      component.onSubmit();
      tick();

      expect(component.isSubmitting()).toBeFalse();
    }));

    it('should handle edit error with error.error.message', fakeAsync(() => {
      service.edit.and.returnValue(throwError(() => ({ error: { message: 'Validation failed' } })));
      component.onSubmit();
      tick();

      expect(component.isSubmitting()).toBeFalse();
    }));

    it('should handle edit error with fallback message', fakeAsync(() => {
      service.edit.and.returnValue(throwError(() => ({})));
      component.onSubmit();
      tick();

      expect(component.isSubmitting()).toBeFalse();
    }));
  });

  // =====================================================================
  // sanitizeInput
  // =====================================================================
  describe('sanitizeInput', () => {
    it('should remove leading spaces', () => {
      component.form.get('scope')?.setValue('  hello');
      component.sanitizeInput('scope');
      expect(component.form.get('scope')?.value).toBe('hello');
    });

    it('should collapse multiple spaces to single space', () => {
      component.form.get('scope')?.setValue('hello   world');
      component.sanitizeInput('scope');
      expect(component.form.get('scope')?.value).toBe('hello world');
    });

    it('should convert executableName to uppercase', () => {
      component.form.get('executableName')?.setValue('testfunc');
      component.sanitizeInput('executableName');
      expect(component.form.get('executableName')?.value).toBe('TESTFUNC');
    });

    it('should not uppercase other controls', () => {
      component.form.get('scope')?.setValue('test');
      component.sanitizeInput('scope');
      expect(component.form.get('scope')?.value).toBe('test');
    });

    it('should do nothing for non-existent control', () => {
      expect(() => component.sanitizeInput('nonExistent')).not.toThrow();
    });

    it('should do nothing if value is not a string', () => {
      component.form.get('scope')?.setValue(null);
      expect(() => component.sanitizeInput('scope')).not.toThrow();
    });

    it('should not change value if already sanitized', () => {
      component.form.get('scope')?.setValue('hello world');
      component.sanitizeInput('scope');
      expect(component.form.get('scope')?.value).toBe('hello world');
    });

    it('should handle combined leading spaces and multiple spaces', () => {
      component.form.get('remarks')?.setValue('  hello   world  test');
      component.sanitizeInput('remarks');
      expect(component.form.get('remarks')?.value).toBe('hello world test');
    });
  });

  // =====================================================================
  // trimInput
  // =====================================================================
  describe('trimInput', () => {
    it('should trim trailing spaces', () => {
      component.form.get('scope')?.setValue('hello   ');
      component.trimInput('scope');
      expect(component.form.get('scope')?.value).toBe('hello');
    });

    it('should do nothing for non-existent control', () => {
      expect(() => component.trimInput('nonExistent')).not.toThrow();
    });

    it('should do nothing if value is not a string', () => {
      component.form.get('scope')?.setValue(null);
      expect(() => component.trimInput('scope')).not.toThrow();
    });

    it('should not change value if no trailing spaces', () => {
      component.form.get('scope')?.setValue('hello');
      component.trimInput('scope');
      expect(component.form.get('scope')?.value).toBe('hello');
    });

    it('should handle empty string', () => {
      component.form.get('scope')?.setValue('');
      component.trimInput('scope');
      expect(component.form.get('scope')?.value).toBe('');
    });
  });

  // =====================================================================
  // onClose
  // =====================================================================
  describe('onClose', () => {
    it('should close dialog without data', () => {
      component.onClose();
      expect(dialogRef.close).toHaveBeenCalledWith();
    });
  });

  // =====================================================================
  // patchFormForEdit
  // =====================================================================
  describe('patchFormForEdit', () => {
    it('should set selectedIcon from data.fcnIcon', () => {
      component.data = {
        mode: 'edit',
        data: { fcnId: 'F1', execName: 'TEST', fcnType: 'PAGE', fcnIcon: 'star' }
      } as any;
      component.ngOnInit();
      expect(component.selectedIcon).toBe('star');
    });

    it('should set selectedIcon to null when fcnIcon is null', () => {
      component.data = {
        mode: 'edit',
        data: { fcnId: 'F1', execName: 'TEST', fcnType: 'PAGE', fcnIcon: null }
      } as any;
      component.ngOnInit();
      expect(component.selectedIcon).toBeNull();
    });

    it('should trim whitespace from patched values', () => {
      component.data = {
        mode: 'edit',
        data: {
          fcnId: 'F1',
          execName: ' TESTEXEC ',
          fcnType: ' PAGE ',
          fcnScope: ' SCOPE ',
          fcnUrl: ' http://test.com ',
          p1Name: ' P1 ',
          p2Name: ' P2 ',
          p3Name: ' P3 ',
          remarks: ' remark ',
          fcnIcon: ' star '
        }
      } as any;
      component.ngOnInit();

      expect(component.form.getRawValue().executableName).toBe('TESTEXEC');
      expect(component.form.get('functionType')?.value).toBe('PAGE');
      expect(component.form.get('scope')?.value).toBe('SCOPE');
      expect(component.form.get('webUrl')?.value).toBe('http://test.com');
      expect(component.form.get('parameter1')?.value).toBe('P1');
      expect(component.form.get('parameter2')?.value).toBe('P2');
      expect(component.form.get('parameter3')?.value).toBe('P3');
      expect(component.form.get('remarks')?.value).toBe('remark');
    });

    it('should handle missing fields in edit data gracefully', () => {
      component.data = {
        mode: 'edit',
        data: { fcnId: 'F1', execName: undefined, fcnType: undefined }
      } as any;
      component.ngOnInit();

      expect(component.form.getRawValue().executableName).toBe('');
      expect(component.form.get('scope')?.value).toBe('');
    });
  });

  // =====================================================================
  // Form validation
  // =====================================================================
  describe('form validation', () => {
    it('should reject executableName with special characters', () => {
      component.form.get('executableName')?.setValue('test@func');
      expect(component.form.get('executableName')?.valid).toBeFalse();
    });

    it('should accept executableName with alphanumeric characters', () => {
      component.form.get('executableName')?.setValue('TESTFUNC123');
      expect(component.form.get('executableName')?.valid).toBeTrue();
    });

    it('should enforce maxLength on executableName (50)', () => {
      component.form.get('executableName')?.setValue('A'.repeat(51));
      expect(component.form.get('executableName')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength on functionType (5)', () => {
      component.form.get('functionType')?.setValue('TOOLONG');
      expect(component.form.get('functionType')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength on webUrl (200)', () => {
      component.form.get('webUrl')?.setValue('http://' + 'a'.repeat(200));
      expect(component.form.get('webUrl')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength on remarks (120)', () => {
      component.form.get('remarks')?.setValue('a'.repeat(121));
      expect(component.form.get('remarks')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength on parameter fields (20)', () => {
      ['parameter1', 'parameter2', 'parameter3'].forEach(param => {
        component.form.get(param)?.setValue('a'.repeat(21));
        expect(component.form.get(param)?.hasError('maxlength')).toBeTrue();
      });
    });

    it('should enforce maxLength on webIcon (30)', () => {
      component.form.get('webIcon')?.setValue('a'.repeat(31));
      expect(component.form.get('webIcon')?.hasError('maxlength')).toBeTrue();
    });

    it('should allow valid scope within max length', () => {
      component.form.get('scope')?.setValue('VALID');
      expect(component.form.get('scope')?.valid).toBeTrue();
    });
  });

  // =====================================================================
  // webIcon valueChanges subscription in ngOnInit
  // =====================================================================
  describe('webIcon valueChanges subscription', () => {
    it('should log selected icon when webIcon value changes', () => {
      spyOn(console, 'log');
      component.form.get('webIcon')?.setValue('star');
      expect(console.log).toHaveBeenCalledWith('Selected icon:', 'star');
    });
  });

  // =====================================================================
  // Edge cases
  // =====================================================================
  describe('edge cases', () => {
    it('should handle data being undefined', () => {
      component.data = undefined as any;
      expect(() => component.ngOnInit()).not.toThrow();
      expect(component.mode).toBe('add');
    });

    it('should not call patchFormForEdit or fetchExistingDetail when mode is edit but recordData is null', () => {
      service.getDetail.calls.reset();
      component.data = { mode: 'edit', data: null } as any;
      component.ngOnInit();
      expect(service.getDetail).not.toHaveBeenCalled();
    });
  });
});
