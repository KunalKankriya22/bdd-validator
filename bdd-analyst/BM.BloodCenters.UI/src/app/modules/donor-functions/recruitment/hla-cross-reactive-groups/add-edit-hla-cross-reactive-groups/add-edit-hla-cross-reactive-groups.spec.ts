import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { AddEditHlaCrossReactiveGroups } from './add-edit-hla-cross-reactive-groups';
import { HlaCrossReactiveGroupsService } from '../services/hla-cross-reactive-groups.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { createMockHeaderService, createMockMatSnackBar } from '@shared/testing/common-mocks';
import {
  HlaCrossReactiveGroupModel,
  ApiResponse
} from '../models/hla-cross-reactive-groups.model';

describe('AddEditHlaCrossReactiveGroups', () => {
  let mockSnackBarRef: any;
  let component: AddEditHlaCrossReactiveGroups;
  let fixture: ComponentFixture<AddEditHlaCrossReactiveGroups>;
  let serviceSpy: jasmine.SpyObj<HlaCrossReactiveGroupsService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;
  let loginServiceSpy: jasmine.SpyObj<LoginService>;

  const mockGroup: HlaCrossReactiveGroupModel = {
    publicEpitopeId: 'A1',
    description: 'A1 Pel-Freeze',
    publicEpitopeDescription: 'A1 Pel-Freeze',
    associatedEpitopeId: '187',
    hlaStandard: 'AABB',
    effectiveDate: '2024-01-01',
    terminationDate: '2025-12-31'
  };

  const mockPublicEpitopeOptions = [
    { code: 'A1', description: 'A1 Pel-Freeze' },
    { code: 'A2', description: 'A2 Pel-Freeze' }
  ];

  const mockHlaStandardOptions = [
    { code: 'AABB', description: 'AABB - Standard' },
    { code: 'CREG', description: 'CREG - Standard' }
  ];

  const chapterChanged$ = new Subject<void>();

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('HlaCrossReactiveGroupsService', [
      'createHlaCrossReactiveGroup',
      'updateHlaCrossReactiveGroup'
    ]);
    snackBarSpy = createMockMatSnackBar();

    // Setup MatSnackBar mock to return a proper MatSnackBarRef
    mockSnackBarRef = jasmine.createSpyObj('MatSnackBarRef', ['onAction', 'dismiss']);
    mockSnackBarRef.onAction.and.returnValue(of(undefined));
    snackBarSpy.open.and.returnValue(mockSnackBarRef);

    headerServiceSpy = createMockHeaderService();
    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', [], {
      chapterTimeZone: signal('-05:00')
    });
    loginServiceSpy = jasmine.createSpyObj('LoginService', [], {
      authenticationData: signal({ chapterId: 1 })
    });



      TestBed.configureTestingModule({
      imports: [AddEditHlaCrossReactiveGroups, ReactiveFormsModule],
      providers: [
        provideNoopAnimations(),
        { provide: HlaCrossReactiveGroupsService, useValue: serviceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy }
      ]
    });


    


      serviceSpy.createHlaCrossReactiveGroup.calls.reset();


      serviceSpy.updateHlaCrossReactiveGroup.calls.reset();


      mockSnackBarRef.onAction.calls.reset();


      mockSnackBarRef.dismiss.calls.reset();


      headerServiceSpy.getCurrentChapterId.calls.reset();


      mockSnackBarRef.onAction.and.returnValue(of(undefined));


      snackBarSpy.open.and.returnValue(mockSnackBarRef);
    fixture = TestBed.createComponent(AddEditHlaCrossReactiveGroups);
    component = fixture.componentInstance;
    component.hlaStandardOptions = mockHlaStandardOptions;
    component.publicEpitopeOptions = mockPublicEpitopeOptions;
    component.associatedEpitopeOptions = [
      { locus: 'A', epitopeId: '1' },
      { locus: 'A', epitopeId: '2' },
      { locus: 'B', epitopeId: '5' }
    ];
    component.mode = 'add';
    fixture.detectChanges();


    });


  describe('Form Initialization - Add Mode', () => {






    it('should have dropdown options', () => {
      expect(component.publicEpitopeOptions.length).toBe(2);
      expect(component.hlaStandardOptions.length).toBe(2);
      expect(component.filteredPublicEpitopeOptions.length).toBe(2);
      expect(component.filteredHlaStandardOptions.length).toBe(2);
    });
  });

  describe('Form Initialization - Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockGroup;
      component.ngOnChanges({
        mode: { currentValue: 'edit', previousValue: 'add', firstChange: false, isFirstChange: () => false },
        data: { currentValue: mockGroup, previousValue: null, firstChange: false, isFirstChange: () => false }
      });
      fixture.detectChanges();
    });



    it('should keep public epitope ID enabled in edit mode', () => {
      const publicEpitopeIdControl = component.form.get('publicEpitopeId');
      // Public Epitope ID remains enabled in edit mode (can be modified)
      expect(publicEpitopeIdControl?.disabled).toBe(false);
    });
  });

  describe('Panel Title', () => {
    it('should return "Add New Cross-Reactive Group" for add mode', () => {
      component.mode = 'add';
      component.ngOnChanges({
        mode: { currentValue: 'add', previousValue: null, firstChange: true, isFirstChange: () => true }
      });
      expect(component.panelTitle).toBe('Add New Cross-Reactive Group');
    });

    it('should return "Edit Cross-Reactive Group" for edit mode', () => {
      component.mode = 'edit';
      component.data = mockGroup;
      component.ngOnChanges({
        mode: { currentValue: 'edit', previousValue: 'add', firstChange: false, isFirstChange: () => false },
        data: { currentValue: mockGroup, previousValue: null, firstChange: false, isFirstChange: () => false }
      });
      expect(component.panelTitle).toBe('Edit Cross-Reactive Group');
    });
  });
  describe('Date Validation', () => {
    it('should have effective date error message for required', () => {
      component.form.get('effectiveDate')?.markAsTouched();
      const error = component.getEffectiveDateError();
      expect(error).toBeTruthy();
      expect(error).toContain('Effective Date is required');
    });

    it('should have termination date validation', () => {
      const effectiveDateControl = component.form.get('effectiveDate');
      const terminationDateControl = component.form.get('terminationDate');

      // Set effective date first (future date)
      effectiveDateControl?.setValue(moment().add(10, 'days'));
      fixture.detectChanges();

      // Set termination date to earlier than effective date
      terminationDateControl?.setValue(moment().add(5, 'days'));
      terminationDateControl?.markAsTouched();
      terminationDateControl?.markAsDirty();
      fixture.detectChanges();

      // Cross-field validator on form group detects effective > termination
      const error = component.getTerminationDateError();
      expect(error).toContain('Termination Date must be greater than or equal to Effective Date');
    });
  });

  describe('Public Epitope Selection', () => {
    it('should update description when public epitope is selected', () => {
      component.form.patchValue({
        publicEpitopeId: 'A1'
      });

      expect(component.form.get('description')?.value).toBe('A1 Pel-Freeze');
    });


  });

  describe('Save Functionality - Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.form.patchValue({
        publicEpitopeId: 'A1',
        associatedEpitopeId: '187',
        hlaStandard: 'AABB',
        effectiveDate: moment().add(1, 'days'),
        terminationDate: null
      });
    });

    it('should call createHlaCrossReactiveGroup on save', fakeAsync(() => {
      const mockResponse: ApiResponse<string> = {
        success: true,
        message: 'Created successfully',
        statusCode: 201,
        data: 'Success'
      };
      serviceSpy.createHlaCrossReactiveGroup.and.returnValue(of(mockResponse));

      spyOn(component.saveSuccess, 'emit');

      component.onSave();
      tick();

      expect(serviceSpy.createHlaCrossReactiveGroup).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
    }));

    it('should handle save failure gracefully', fakeAsync(() => {
      serviceSpy.createHlaCrossReactiveGroup.and.returnValue(
        throwError(() => ({ error: { message: 'Duplicate entry' } }))
      );

      component.onSave();
      tick();

      // Error is handled by global interceptor, not local snackbar
      expect(component.isSaving).toBe(false);
    }));

    it('should keep panel open when duplicate record error (HTTP 200 with success: false)', fakeAsync(() => {
      const mockDuplicateResponse: ApiResponse<string> = {
        success: false,
        message: 'Duplicate entry not allowed',
        error: 'Duplicate entry not allowed',
        errorCode: '0319',
        statusCode: 400,
        item: false,
        errorResponse: {
          errorCode: '0319',
          error: 'Duplicate entry not allowed'
        },
        data: ''
      };
      serviceSpy.createHlaCrossReactiveGroup.and.returnValue(of(mockDuplicateResponse));

      spyOn(component.closePanel, 'emit');
      spyOn(component.saveSuccess, 'emit');

      component.onSave();
      tick();

      // Panel should NOT close on duplicate error
      expect(component.closePanel.emit).not.toHaveBeenCalled();
      // Save success should NOT be emitted
      expect(component.saveSuccess.emit).not.toHaveBeenCalled();
      // Error message should be shown with error code format (via snackbar service)
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error 0319: Duplicate entry not allowed',
        jasmine.any(String),
        jasmine.any(Object)
      );
      expect(component.isSaving).toBe(false);
    }));


  });

  describe('Edit Mode - Save Functionality', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockGroup;
      component.ngOnChanges({
        mode: { currentValue: 'edit', previousValue: 'add', firstChange: false, isFirstChange: () => false },
        data: { currentValue: mockGroup, previousValue: null, firstChange: false, isFirstChange: () => false }
      });
      component.form.patchValue({
        publicEpitopeId: 'A1',
        associatedEpitopeId: '187',
        hlaStandard: 'AABB',
        effectiveDate: moment().add(1, 'days'),
        terminationDate: null
      });
    });

    it('should keep panel open when duplicate record error in edit mode', fakeAsync(() => {
      const mockDuplicateResponse: ApiResponse<string> = {
        success: false,
        message: 'Duplicate entry not allowed',
        error: 'Duplicate entry not allowed',
        errorCode: '0319',
        statusCode: 400,
        item: false,
        errorResponse: {
          errorCode: '0319',
          error: 'Duplicate entry not allowed'
        },
        data: ''
      };
      serviceSpy.updateHlaCrossReactiveGroup.and.returnValue(of(mockDuplicateResponse));

      spyOn(component.closePanel, 'emit');
      spyOn(component.saveSuccess, 'emit');

      component.onSave();
      tick();

      // Panel should NOT close on duplicate error
      expect(component.closePanel.emit).not.toHaveBeenCalled();
      // Save success should NOT be emitted
      expect(component.saveSuccess.emit).not.toHaveBeenCalled();
      // Error message should be shown with error code format
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error 0319: Duplicate entry not allowed',
        jasmine.any(String),
        jasmine.any(Object)
      );
      expect(component.isSaving).toBe(false);
    }));

    it('should call updateHlaCrossReactiveGroup on save in edit mode', fakeAsync(() => {
      const mockResponse: ApiResponse<string> = {
        success: true,
        message: 'Updated successfully',
        statusCode: 200,
        data: 'Success'
      };
      serviceSpy.updateHlaCrossReactiveGroup.and.returnValue(of(mockResponse));

      spyOn(component.saveSuccess, 'emit');

      component.onSave();
      tick();

      expect(serviceSpy.updateHlaCrossReactiveGroup).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
    }));
  });

  describe('Error Message Formatting', () => {
    it('should format error message with error code', () => {
      const result = (component as any).formatErrorMessage('0319', 'Duplicate entry not allowed');
      expect(result).toBe('Error 0319: Duplicate entry not allowed');
    });

    it('should return message without code when error code is undefined', () => {
      const result = (component as any).formatErrorMessage(undefined, 'Some error occurred');
      expect(result).toBe('Some error occurred');
    });


  });

  describe('Cancel Functionality', () => {


    it('should not save data on cancel', () => {
      component.form.patchValue({
        publicEpitopeId: 'A1',
        associatedEpitopeId: '187',
        hlaStandard: 'AABB',
        effectiveDate: moment().add(1, 'days')
      });

      component.onCancel();

      expect(serviceSpy.createHlaCrossReactiveGroup).not.toHaveBeenCalled();
      expect(serviceSpy.updateHlaCrossReactiveGroup).not.toHaveBeenCalled();
    });
  });

  describe('Dropdown Search Functionality', () => {




    it('should show all options when search is cleared', () => {
      component.publicEpitopeSearchControl.setValue('');
      fixture.detectChanges();

      expect(component.filteredPublicEpitopeOptions.length).toBe(2);
    });
  });
});
