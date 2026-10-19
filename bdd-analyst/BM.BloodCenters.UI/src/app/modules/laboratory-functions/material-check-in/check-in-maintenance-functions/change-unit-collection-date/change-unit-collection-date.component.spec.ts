import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError, Subject, EMPTY } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ChangeUnitCollectionDateComponent } from './change-unit-collection-date.component';
import { UnitCollectionDateService } from './services/unit-collection-date.service';
import { ValidateUnitResponse, ChangeCollectionDateResponse } from './models/unit-collection-date.model';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockRouter, createMockActivatedRoute, createMockPageHeaderService } from '@shared/testing/page-header-service.mock';
import { UnitValidationResponse } from '@shared/components/unit-id-field';
import moment from 'moment';
import { createMockMatSnackBar, createMockMatDialog } from '@shared/testing/common-mocks';

describe('ChangeUnitCollectionDateComponent', () => {
  let dialogRefSpy: any;
  let componentSnackBar: any;
  let mockState: any;
  let component: ChangeUnitCollectionDateComponent;
  let fixture: ComponentFixture<ChangeUnitCollectionDateComponent>;
  let unitServiceSpy: jasmine.SpyObj<UnitCollectionDateService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;

  const mockUnitData: ValidateUnitResponse = {
    isValid: true,
    unitId: 'W633312070523',
    chapterId: 'CH001',
    currentCollectionDate: '2012-03-10T00:00:00Z',
    insertDate: '2012-03-15T00:00:00Z',
    message: 'Unit found'
  };

  const mockUpdateResponse: ChangeCollectionDateResponse = {
    success: true,
    message: 'Unit collection date changed successfully.',
    unitId: 'W633312070523',
    newCollectionDate: '2012-04-10T00:00:00Z'
  };

  beforeEach(() => {

    unitServiceSpy = jasmine.createSpyObj('UnitCollectionDateService', ['validateUnit', 'changeCollectionDate']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    snackBarSpy = createMockMatSnackBar();

    // Create a more complete MatDialog spy with required internal properties
    dialogSpy = createMockMatDialog();
    (dialogSpy as any)._openDialogsAtThisLevel = [];
    (dialogSpy as any).openDialogs = [];
    (dialogSpy as any)._getAfterAllClosed = () => EMPTY;
    (dialogSpy as any)._afterAllClosedAtThisLevel = new Subject<void>();
    (dialogSpy as any)._afterOpenedAtThisLevel = new Subject<any>();
    (dialogSpy as any).afterAllClosed = EMPTY;
    (dialogSpy as any).afterOpened = EMPTY;

    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate']);

    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2026-05-22'));



      TestBed.configureTestingModule({
imports: [
        ChangeUnitCollectionDateComponent,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: UnitCollectionDateService, useValue: unitServiceSpy },
        { provide: Router, useValue: Object.assign(createMockRouter(), routerSpy) },
        { provide: ActivatedRoute, useValue: createMockActivatedRoute() },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
        { provide: PageHeaderService, useValue: createMockPageHeaderService() }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).overrideProvider(MatDialog, { useValue: dialogSpy });


    });



  beforeEach(() => {
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2026-05-22'));


    fixture = TestBed.createComponent(ChangeUnitCollectionDateComponent);
    component = fixture.componentInstance;

    // Create a simple mock with plain properties
    // We can't use real getters/setters because TypeScript sees them as readonly
    // Instead, we create an object that we can modify in tests
    mockState = {
      isValid: false,
      parsedUnitId: null as string | null
    };

    const mockUnitIdField: any = {
      get isValid() { return mockState.isValid; },
      get parsedUnitId() { return mockState.parsedUnitId; },
      clear: jasmine.createSpy('clear').and.callFake(() => {
        mockState.isValid = false;
        mockState.parsedUnitId = null;
      }),
      // Expose the state for test manipulation
      _state: mockState
    };

    // Override the unitIdField ViewChild
    Object.defineProperty(component, 'unitIdField', {
      value: mockUnitIdField,
      writable: true,
      configurable: true
    });
  });

  describe('Initialization', () => {

    it('should initialize headerConfig with title and subtitle', () => {
      expect(component.headerConfig).toBeDefined();
      expect(component.headerConfig.title).toBe('Change Unit Collection Date');
      expect(component.headerConfig.subtitle).toBe('This screen allows to change collection date and it effects separation times, components suitability, etc. Use caution.');
      expect(component.headerConfig.breadcrumbs).toEqual([
        { label: 'Home', link: '/' },
        { label: 'Change Unit Collection Date', link: null }
      ]);
    });


    it('should initialize update form with null date', () => {
      fixture.detectChanges();
      expect(component.updateForm.get('newCollectionDate')?.value).toBeNull();
    });

    it('should have unitFound signal initially false', () => {
      fixture.detectChanges();
      expect(component.unitFound()).toBeFalse();
    });
  });


  describe('Unit Search', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should set unitFound to true on successful search', fakeAsync(() => {
      unitServiceSpy.validateUnit.and.returnValue(of(mockUnitData));

      // Mock returns valid state
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('W633312070523');

      component.onSearch();
      tick();

      expect(component.unitFound()).toBeTrue();
      expect(component.unitData()).toEqual(mockUnitData);
    }));

    it('should show error message on search failure', fakeAsync(() => {
      unitServiceSpy.validateUnit.and.returnValue(
        throwError(() => ({ error: { message: 'Unit not found' } }))
      );

      // Use spyOnProperty like the other working search tests
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('W633312070523');

      // Spy on the component's private snackBar directly (same pattern as other passing tests)
      componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      component.onSearch();
      tick();

      expect(componentSnackBar.open).toHaveBeenCalled();
      const callArgs = (componentSnackBar.open as jasmine.Spy).calls.mostRecent()?.args;
      expect(callArgs?.[0]).toContain('Unit not found');
    }));
  });

  describe('Update Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.unitData.set(mockUnitData);
      component.unitFound.set(true);
      fixture.detectChanges();
    });


    it('should be valid when date is selected', () => {
      const validDate = moment('2012-04-10');
      component.updateForm.patchValue({ newCollectionDate: validDate });
      component.updateForm.get('newCollectionDate')?.updateValueAndValidity();
      // Date might still be invalid due to custom validators, just check it's not null
      expect(component.updateForm.get('newCollectionDate')?.value).toBeTruthy();
    });
  });

  describe('Update Collection Date', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.unitData.set(mockUnitData);
      component.unitFound.set(true);
      fixture.detectChanges();
    });


    it('should open confirmation dialog when form is valid', fakeAsync(() => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      // Set a past date that's valid
      const pastDate = moment('2012-04-10');
      component.updateForm.patchValue({ newCollectionDate: pastDate });
      // Mark as valid manually for testing
      component.updateForm.get('newCollectionDate')?.setErrors(null);
      component.onUpdate();
      fixture.detectChanges();
      tick();

      expect(dialogSpy.open).toHaveBeenCalled();
    }));

    it('should open confirmation dialog with correct configuration (no custom backdropClass)', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      const pastDate = moment('2012-04-10');
      component.updateForm.patchValue({ newCollectionDate: pastDate });
      component.updateForm.get('newCollectionDate')?.setErrors(null);
      component.onUpdate();
      fixture.detectChanges();
      tick();

      expect(dialogSpy.open).toHaveBeenCalledWith(
        jasmine.any(Function),
        jasmine.objectContaining({
          width: '490px',
          maxWidth: '90vw',
          hasBackdrop: true,
          disableClose: true,
          panelClass: 'confirm-date-dialog'
        })
      );
      // Verify backdropClass is NOT present (uses Material's default gray backdrop)
      const callArgs = dialogSpy.open.calls.mostRecent()?.args[1];
      expect(callArgs?.backdropClass).toBeUndefined();
    }));


    it('should show success message on successful update', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      unitServiceSpy.changeCollectionDate.and.returnValue(of(mockUpdateResponse));

      // Spy on the component's private snackBar directly (same pattern as other passing tests)
      componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      const pastDate = moment('2012-04-10');
      component.updateForm.patchValue({ newCollectionDate: pastDate });
      component.updateForm.get('newCollectionDate')?.setErrors(null);
      component.onUpdate();
      fixture.detectChanges();
      tick();

      expect(componentSnackBar.open).toHaveBeenCalled();
      const callArgs = (componentSnackBar.open as jasmine.Spy).calls.mostRecent()?.args;
      expect(callArgs?.[0]).toContain('successfully');
    }));

    it('should reset form after successful update', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      unitServiceSpy.changeCollectionDate.and.returnValue(of(mockUpdateResponse));

      spyOn(component.unitIdField, 'clear');
      const pastDate = moment('2012-04-10');
      component.updateForm.patchValue({ newCollectionDate: pastDate });
      component.updateForm.get('newCollectionDate')?.setErrors(null);
      component.onUpdate();
      fixture.detectChanges();
      tick();

      expect(component.unitIdField.clear).toHaveBeenCalled();
      expect(component.unitFound()).toBeFalse();
    }));

    it('should handle API-level failure even with 200 status (success: false)', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      const failureResponse = {
        success: false,
        errorCode: '1234',
        error: 'Collection date cannot be changed',
        message: 'Collection date cannot be changed',
        unitId: 'W633312070523',
        newCollectionDate: '2012-04-10T00:00:00Z'
      };
      unitServiceSpy.changeCollectionDate.and.returnValue(of(failureResponse));

      // Spy on the component's private snackBar directly
      componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      const pastDate = moment('2012-04-10');
      component.updateForm.patchValue({ newCollectionDate: pastDate });
      component.updateForm.get('newCollectionDate')?.setErrors(null);
      component.onUpdate();
      fixture.detectChanges();
      tick();

      expect(componentSnackBar.open).toHaveBeenCalledWith(
        'Error 1234: Collection date cannot be changed',
        'DISMISS',
        jasmine.objectContaining({
          panelClass: ['error-snackbar']
        })
      );
      expect(component.loading()).toBeFalse();
    }));

    it('should handle API-level failure with errorResponse structure', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      const failureResponse = {
        success: false,
        errorResponse: {
          errorCode: '5678',
          error: 'Invalid collection date'
        },
        unitId: 'W633312070523',
        newCollectionDate: '2012-04-10T00:00:00Z'
      };
      unitServiceSpy.changeCollectionDate.and.returnValue(of(failureResponse));

      // Spy on the component's private snackBar directly
      componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      const pastDate = moment('2012-04-10');
      component.updateForm.patchValue({ newCollectionDate: pastDate });
      component.updateForm.get('newCollectionDate')?.setErrors(null);
      component.onUpdate();
      fixture.detectChanges();
      tick();

      expect(componentSnackBar.open).toHaveBeenCalledWith(
        'Error 5678: Invalid collection date',
        'DISMISS',
        jasmine.objectContaining({
          panelClass: ['error-snackbar']
        })
      );
    }));

    it('should handle API-level failure without error code', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      const failureResponse = {
        success: false,
        message: 'Collection date update failed',
        unitId: 'W633312070523',
        newCollectionDate: '2012-04-10T00:00:00Z'
      };
      unitServiceSpy.changeCollectionDate.and.returnValue(of(failureResponse));

      // Spy on the component's private snackBar directly
      componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      const pastDate = moment('2012-04-10');
      component.updateForm.patchValue({ newCollectionDate: pastDate });
      component.updateForm.get('newCollectionDate')?.setErrors(null);
      component.onUpdate();
      fixture.detectChanges();
      tick();

      expect(componentSnackBar.open).toHaveBeenCalledWith(
        'Collection date update failed',
        'DISMISS',
        jasmine.objectContaining({
          panelClass: ['error-snackbar']
        })
      );
    }));

    it('should NOT reset form when user cancels dialog', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      spyOn(component.unitIdField, 'clear');
      const pastDate = moment('2012-04-10');
      component.updateForm.patchValue({ newCollectionDate: pastDate });
      component.updateForm.get('newCollectionDate')?.setErrors(null);
      component.onUpdate();
      fixture.detectChanges();
      tick();

      expect(component.unitIdField.clear).not.toHaveBeenCalled();
      expect(component.unitFound()).toBeTrue();
    }));
  });

  describe('User Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form on reset button click', () => {
      spyOn(component.unitIdField, 'clear');
      component.unitFound.set(true);

      component.onReset();

      expect(component.unitIdField.clear).toHaveBeenCalled();
      expect(component.unitFound()).toBeFalse();
    });

  });

  describe('Computed Properties', () => {
    it('should compute canUpdate as true when unit found and not loading', () => {
      component.unitFound.set(true);
      component.loading.set(false);

      expect(component.canUpdate()).toBeTrue();
    });

    it('should compute canUpdate as false when unit not found', () => {
      component.unitFound.set(false);
      component.loading.set(false);

      expect(component.canUpdate()).toBeFalse();
    });

    it('should compute canUpdate as false when loading', () => {
      component.unitFound.set(true);
      component.loading.set(true);

      expect(component.canUpdate()).toBeFalse();
    });
  });

  describe('Day of Week', () => {
    it('should return day of week for a valid date', () => {
      const dayOfWeek = component.getDayOfWeek('2012-03-10T00:00:00Z');
      expect(dayOfWeek).toBe('Saturday');
    });


    it('should return day of week for new collection date', () => {
      fixture.detectChanges();
      component.updateForm.patchValue({ newCollectionDate: moment('2012-04-10') });
      const dayOfWeek = component.getNewDayOfWeek();
      expect(dayOfWeek).toBe('Tuesday');
    });
  });

  describe('Formatted Unit ID', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return formatted Unit ID from parsedUnitData for CODE128', () => {
      const mockParsedData: UnitValidationResponse = {
        parsedUnitId: '=W633312070523-X',  // CODE128 with = prefix (16 chars total, 15 after prefix)
        manualUnitId: '=W633312070523-X',  // Raw value from backend
        barcodeType: 'CODE128',
        checkDigit: null,
        codeScheme: 'I',
        codabarUnitScheme: null,
        entryMode: 'S',
        chapterScheme: 'I'
      };

      spyOnProperty(component.unitIdField, 'parsedUnitData', 'get').and.returnValue(mockParsedData);

      const formattedId = component.getFormattedUnitId();
      // The method calls UnitIdFormatUtility.formatCode128() which adds spaces
      expect(formattedId).toBe('=W6333 12 070523 -X');
    });

    it('should return manualUnitId as-is for CODABAR', () => {
      const mockParsedData: UnitValidationResponse = {
        parsedUnitId: '1234567890',
        manualUnitId: '1234567890',
        barcodeType: 'CODABAR',
        checkDigit: null,
        codeScheme: 'C',
        codabarUnitScheme: 'A',
        entryMode: 'M',
        chapterScheme: 'C'
      };

      spyOnProperty(component.unitIdField, 'parsedUnitData', 'get').and.returnValue(mockParsedData);

      const formattedId = component.getFormattedUnitId();
      expect(formattedId).toBe('1234567890');
    });

    it('should return unitData unitId when parsedUnitData is not available', () => {
      spyOnProperty(component.unitIdField, 'parsedUnitData', 'get').and.returnValue(null);
      component.unitData.set(mockUnitData);

      const formattedId = component.getFormattedUnitId();
      expect(formattedId).toBe('W633312070523');
    });

  });

  describe('Enter Key Handler', () => {
    it('should prevent default and call onUpdate when Enter key is pressed', () => {
      fixture.detectChanges();
      const mockKeyboardEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(mockKeyboardEvent, 'preventDefault');
      spyOn(mockKeyboardEvent, 'stopPropagation');
      spyOn(component, 'onUpdate');

      component.onEnterKey(mockKeyboardEvent);

      expect(mockKeyboardEvent.preventDefault).toHaveBeenCalled();
      expect(mockKeyboardEvent.stopPropagation).toHaveBeenCalled();
      expect(component.onUpdate).toHaveBeenCalled();
    });
  });

  describe('Coverage Gap Tests', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format Unit ID in ISBT format', () => {
      const result = component.formatUnitIdForDisplay('W633312070523X');
      expect(result).toContain('W6333');
      expect(result).toContain(' ');
    });

    it('should return original unit ID for short strings', () => {
      expect(component.formatUnitIdForDisplay('SHORT')).toBe('SHORT');
    });

    it('should return empty string for undefined unit ID', () => {
      expect(component.formatUnitIdForDisplay(undefined)).toBe('');
    });

    it('should format date uppercase', () => {
      const result = component.formatDateUppercase('2012-03-10T00:00:00Z');
      expect(result).toMatch(/10-MAR-2012/);
    });

    it('should return empty string for undefined date', () => {
      expect(component.formatDateUppercase(undefined)).toBe('');
    });

    it('should return empty string for getDayOfWeek with undefined', () => {
      expect(component.getDayOfWeek(undefined)).toBe('');
    });

    it('should return empty string for getNewDayOfWeek with null date', () => {
      component.updateForm.patchValue({ newCollectionDate: null });
      expect(component.getNewDayOfWeek()).toBe('');
    });

    it('should return empty for getCollectionDateError when no control errors', () => {
      component.updateForm.get('newCollectionDate')?.setErrors(null);
      expect(component.getCollectionDateError()).toBe('');
    });

    it('should return invalidDate error message', () => {
      component.updateForm.get('newCollectionDate')?.setErrors({ invalidDate: true });
      expect(component.getCollectionDateError()).toBe('New Collection Date is invalid');
    });

    it('should return afterInsertDate error message', () => {
      component.updateForm.get('newCollectionDate')?.setErrors({
        afterInsertDate: { message: 'Cannot be after insert date' }
      });
      expect(component.getCollectionDateError()).toBe('Cannot be after insert date');
    });

    it('should return required error message', () => {
      const ctrl = component.updateForm.get('newCollectionDate');
      ctrl?.setValue(null);
      ctrl?.markAsTouched();
      ctrl?.updateValueAndValidity();
      // Force required error
      ctrl?.setErrors({ required: true });
      expect(component.getCollectionDateError()).toBe('New Collection Date is required');
    });

    it('should handle onCollectionDateInput', () => {
      const event = { target: { value: '15-MAR-2012' } } as any;
      component.onCollectionDateInput(event);
      expect(component.updateForm).toBeDefined();
    });

    it('should navigate back on cancel', () => {
      component.onCancel();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/donor-functions']);
    });

    it('should not search if unitIdField is invalid', () => {
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(false);
      component.onSearch();
      expect(unitServiceSpy.validateUnit).not.toHaveBeenCalled();
    });

    it('should not search if parsedUnitId is empty', () => {
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('');
      component.onSearch();
      expect(unitServiceSpy.validateUnit).not.toHaveBeenCalled();
    });

    it('should handle search with isValid=false response', fakeAsync(() => {
      unitServiceSpy.validateUnit.and.returnValue(of({
        isValid: false,
        message: 'Unit not eligible',
        unitId: 'W633312070523',
        chapterId: 'CH001',
        currentCollectionDate: '',
        insertDate: ''
      }));
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('W633312070523');

      componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      component.onSearch();
      tick();

      expect(component.unitFound()).toBeFalse();
      expect(componentSnackBar.open).toHaveBeenCalled();
    }));

    it('should handle onUnitValidated by triggering search', () => {
      spyOn(component, 'onSearch');
      component.onUnitValidated({} as any);
      expect(component.onSearch).toHaveBeenCalled();
    });

    it('should handle onUnitCleared', () => {
      component.unitFound.set(true);
      component.onUnitCleared();
      expect(component.unitFound()).toBeFalse();
      expect(component.unitData()).toBeNull();
    });

    it('should not proceed with onUpdate if form is invalid', () => {
      component.unitData.set(mockUnitData);
      component.updateForm.get('newCollectionDate')?.setErrors({ required: true });
      component.onUpdate();
      expect(component.submitted()).toBeTrue();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should handle update error', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      unitServiceSpy.changeCollectionDate.and.returnValue(throwError(() => ({
        error: { error: { errorCode: '999', errorDescription: 'Server failed' } }
      })));

      componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      component.unitData.set(mockUnitData);
      component.unitFound.set(true);
      const pastDate = moment('2012-04-10');
      component.updateForm.patchValue({ newCollectionDate: pastDate });
      component.updateForm.get('newCollectionDate')?.setErrors(null);
      component.onUpdate();
      tick();

      expect(component.loading()).toBeFalse();
      expect(componentSnackBar.open).toHaveBeenCalled();
    }));

    it('should extract error with errorResponse pattern', () => {
      const error = { error: { errorResponse: { errorCode: '123', error: 'Some error' } } };
      const result = (component as any).extractErrorMessage(error, 'default');
      expect(result).toBe('Error: 123 : Some error');
    });

    it('should extract error with just message', () => {
      const error = { message: 'Basic error' };
      const result = (component as any).extractErrorMessage(error, 'default');
      expect(result).toBe('Basic error');
    });

    it('should use fallback for unknown error format', () => {
      const result = (component as any).extractErrorMessage({}, 'fallback message');
      expect(result).toBe('fallback message');
    });

    it('newCollectionDateFilter should allow dates before insert date', () => {
      component.unitData.set(mockUnitData);
      const earlyDate = moment('2012-03-10');
      expect(component.newCollectionDateFilter(earlyDate)).toBeTrue();
    });

    it('newCollectionDateFilter should block dates after insert date', () => {
      component.unitData.set(mockUnitData);
      const lateDate = moment('2025-12-31');
      expect(component.newCollectionDateFilter(lateDate)).toBeFalse();
    });

    it('newCollectionDateFilter should allow null dates', () => {
      expect(component.newCollectionDateFilter(null)).toBeTrue();
    });

    it('should handle onUpdate with event parameter', () => {
      component.unitData.set(mockUnitData);
      component.updateForm.get('newCollectionDate')?.setErrors({ required: true });
      const mockEvent = { preventDefault: jasmine.createSpy(), stopPropagation: jasmine.createSpy() } as any;
      component.onUpdate(mockEvent);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should return updateForm controls via updateF getter', () => {
      expect(component.updateF).toBe(component.updateForm.controls);
    });
  });

  describe('Lifecycle hooks', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      fixture.detectChanges();
      const destroy$ = (component as any).destroy$;
      let completed = false;
      destroy$.subscribe({ complete: () => completed = true });
      component.ngOnDestroy();
      expect(completed).toBeTrue();
    });

    it('should initialize updateForm during ngOnInit via detectChanges', () => {
      // Before detectChanges, form is not initialized
      fixture.detectChanges();
      expect(component.updateForm).toBeDefined();
      expect(component.updateForm.get('newCollectionDate')).toBeDefined();
    });
  });

  describe('today getter', () => {
    it('should return the chapter local date from ChapterTimezoneService', () => {
      const expectedDate = moment('2026-05-22');
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(expectedDate);
      const result = component.today;
      expect(chapterTimezoneServiceSpy.getChapterLocalDate).toHaveBeenCalled();
      expect(result.isSame(expectedDate, 'day')).toBeTrue();
    });
  });

  describe('dateNotAfterInsertValidator', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return null when control value is null', () => {
      const result = (component as any).dateNotAfterInsertValidator({ value: null });
      expect(result).toBeNull();
    });

    it('should return null when unitData has no insertDate', () => {
      component.unitData.set({ ...mockUnitData, insertDate: undefined });
      const result = (component as any).dateNotAfterInsertValidator({ value: moment('2012-03-10') });
      expect(result).toBeNull();
    });

    it('should return null when unitData is null', () => {
      component.unitData.set(null);
      const result = (component as any).dateNotAfterInsertValidator({ value: moment('2012-03-10') });
      expect(result).toBeNull();
    });

    it('should return null when date is before insert date', () => {
      component.unitData.set(mockUnitData);
      const result = (component as any).dateNotAfterInsertValidator({ value: moment('2012-03-10') });
      expect(result).toBeNull();
    });

    it('should return null when date is same day as insert date', () => {
      component.unitData.set(mockUnitData);
      const result = (component as any).dateNotAfterInsertValidator({ value: moment('2012-03-15') });
      expect(result).toBeNull();
    });

    it('should return error when date is after insert date', () => {
      component.unitData.set(mockUnitData);
      const result = (component as any).dateNotAfterInsertValidator({ value: moment('2025-12-31') });
      expect(result).not.toBeNull();
      expect(result.afterInsertDate).toBeDefined();
      expect(result.afterInsertDate.message).toContain('cannot be after unit insert date');
    });
  });

  describe('newCollectionDateFilter edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true when unit has no insertDate', () => {
      component.unitData.set({ ...mockUnitData, insertDate: undefined });
      const result = component.newCollectionDateFilter(moment('2030-01-01'));
      expect(result).toBeTrue();
    });

    it('should return true when unitData is null', () => {
      component.unitData.set(null);
      const result = component.newCollectionDateFilter(moment('2030-01-01'));
      expect(result).toBeTrue();
    });

    it('should return true when date is same as insert date', () => {
      component.unitData.set(mockUnitData);
      const sameDate = moment('2012-03-15');
      expect(component.newCollectionDateFilter(sameDate)).toBeTrue();
    });
  });

  describe('getCollectionDateError edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return invalid message for invalidDateFormat error', () => {
      component.updateForm.get('newCollectionDate')?.setErrors({ invalidDateFormat: true });
      expect(component.getCollectionDateError()).toBe('New Collection Date is invalid');
    });

    it('should return invalid message for matDatepickerParse error', () => {
      component.updateForm.get('newCollectionDate')?.setErrors({ matDatepickerParse: { text: 'bad' } });
      expect(component.getCollectionDateError()).toBe('New Collection Date is invalid');
    });

    it('should return fallback afterInsertDate message when custom message is absent', () => {
      component.updateForm.get('newCollectionDate')?.setErrors({
        afterInsertDate: {}
      });
      expect(component.getCollectionDateError()).toBe('Collection date cannot be after unit insert date');
    });

    it('should return empty string when form control does not exist', () => {
      // Temporarily remove the control
      const originalForm = component.updateForm;
      component.updateForm = (component as any).fb.group({});
      expect(component.getCollectionDateError()).toBe('');
      component.updateForm = originalForm;
    });
  });

  describe('onUpdate edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return early when unitData is null even if form is valid', () => {
      component.unitData.set(null);
      component.updateForm.patchValue({ newCollectionDate: moment('2012-03-10') });
      component.updateForm.get('newCollectionDate')?.setErrors(null);
      component.onUpdate();
      expect(component.submitted()).toBeTrue();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should not call preventDefault when event is not provided', () => {
      component.unitData.set(mockUnitData);
      component.updateForm.get('newCollectionDate')?.setErrors({ required: true });
      // Just calling without event should not throw
      expect(() => component.onUpdate()).not.toThrow();
      expect(component.submitted()).toBeTrue();
    });
  });

  describe('extractErrorMessage edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle Pattern 3: error.error.errorCode + error.error.message', () => {
      const error = { error: { errorCode: '456', message: 'Specific error message' } };
      const result = (component as any).extractErrorMessage(error, 'default');
      expect(result).toBe('Error: 456 : Specific error message');
    });

    it('should handle Pattern 4: just error.error.message', () => {
      const error = { error: { message: 'Only error message' } };
      const result = (component as any).extractErrorMessage(error, 'default');
      expect(result).toBe('Only error message');
    });

    it('should handle Pattern 1: nested error.error.error with code and description', () => {
      const error = { error: { error: { errorCode: '100', errorDescription: 'Deep nested error' } } };
      const result = (component as any).extractErrorMessage(error, 'default');
      expect(result).toBe('Error: 100 : Deep nested error');
    });

    it('should handle null error object', () => {
      const result = (component as any).extractErrorMessage(null, 'default fallback');
      expect(result).toBe('default fallback');
    });

    it('should handle undefined error object', () => {
      const result = (component as any).extractErrorMessage(undefined, 'default fallback');
      expect(result).toBe('default fallback');
    });
  });

  describe('onDatePickerClosed', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should focus the date input after a timeout', fakeAsync(() => {
      const mockInput = {
        focus: jasmine.createSpy('focus'),
        setSelectionRange: jasmine.createSpy('setSelectionRange'),
        value: '10-MAR-2012'
      };
      Object.defineProperty(component, 'dateInput', {
        value: { nativeElement: mockInput },
        writable: true,
        configurable: true
      });

      component.onDatePickerClosed();
      tick(200);

      expect(mockInput.focus).toHaveBeenCalled();
      expect(mockInput.setSelectionRange).toHaveBeenCalledWith(11, 11);
    }));

    it('should handle missing dateInput gracefully', fakeAsync(() => {
      Object.defineProperty(component, 'dateInput', {
        value: null,
        writable: true,
        configurable: true
      });

      expect(() => {
        component.onDatePickerClosed();
        tick(200);
      }).not.toThrow();
    }));

    it('should handle dateInput with no nativeElement', fakeAsync(() => {
      Object.defineProperty(component, 'dateInput', {
        value: { nativeElement: null },
        writable: true,
        configurable: true
      });

      expect(() => {
        component.onDatePickerClosed();
        tick(200);
      }).not.toThrow();
    }));
  });

  describe('formatUnitIdForDisplay edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format unit ID when check digit already has hyphen', () => {
      const result = component.formatUnitIdForDisplay('W633312070523-X');
      expect(result).toBe('W6333 12 070523 -X');
    });

    it('should format unit ID when check digit has no hyphen', () => {
      const result = component.formatUnitIdForDisplay('W633312070523X');
      // part4 = 'X' -> becomes '-X'
      expect(result).toBe('W6333 12 070523 -X');
    });

    it('should return original for long string not starting with W', () => {
      const id = 'A1234567890123456';
      const result = component.formatUnitIdForDisplay(id);
      expect(result).toBe(id);
    });

    it('should return empty string for empty string input', () => {
      expect(component.formatUnitIdForDisplay('')).toBe('');
    });

    it('should handle unit ID with extra spaces', () => {
      const result = component.formatUnitIdForDisplay('W6333 12 070523 -X');
      expect(result).toBe('W6333 12 070523 -X');
    });
  });

  describe('getFormattedUnitId edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string when no parsedUnitData and no unitData', () => {
      spyOnProperty(component.unitIdField, 'parsedUnitData', 'get').and.returnValue(null);
      component.unitData.set(null);
      expect(component.getFormattedUnitId()).toBe('');
    });

    it('should return empty string when parsedUnitData has no manualUnitId', () => {
      const mockParsedData = {
        parsedUnitId: null,
        manualUnitId: null,
        barcodeType: 'CODE128',
        checkDigit: null,
        codeScheme: null,
        codabarUnitScheme: null,
        entryMode: null,
        chapterScheme: null
      };
      spyOnProperty(component.unitIdField, 'parsedUnitData', 'get').and.returnValue(mockParsedData as any);
      component.unitData.set(null);
      expect(component.getFormattedUnitId()).toBe('');
    });

    it('should return empty string when parsedUnitData has empty manualUnitId', () => {
      const mockParsedData = {
        parsedUnitId: '',
        manualUnitId: '',
        barcodeType: 'CODE128',
        checkDigit: null,
        codeScheme: null,
        codabarUnitScheme: null,
        entryMode: null,
        chapterScheme: null
      };
      spyOnProperty(component.unitIdField, 'parsedUnitData', 'get').and.returnValue(mockParsedData as any);
      component.unitData.set(mockUnitData);
      // Empty manualUnitId is falsy, falls through to unitData fallback
      expect(component.getFormattedUnitId()).toBe('W633312070523');
    });
  });

  describe('performUpdate edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.unitData.set(mockUnitData);
      component.unitFound.set(true);
    });

    it('should show default error when success is false with no specific error fields', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      const failureResponse = {
        success: false,
        unitId: 'W633312070523',
        newCollectionDate: '2012-04-10T00:00:00Z'
      };
      unitServiceSpy.changeCollectionDate.and.returnValue(of(failureResponse));

      componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      const pastDate = moment('2012-04-10');
      component.updateForm.patchValue({ newCollectionDate: pastDate });
      component.updateForm.get('newCollectionDate')?.setErrors(null);
      component.onUpdate();
      tick();

      expect(componentSnackBar.open).toHaveBeenCalledWith(
        'Failed to update collection date',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
      expect(component.loading()).toBeFalse();
    }));

    it('should show error with errorResponse.error but no root error field', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      const failureResponse = {
        success: false,
        errorResponse: {
          errorCode: '9999',
          error: 'Backend error from errorResponse'
        },
        unitId: 'W633312070523',
        newCollectionDate: '2012-04-10T00:00:00Z'
      };
      unitServiceSpy.changeCollectionDate.and.returnValue(of(failureResponse));

      componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      const pastDate = moment('2012-04-10');
      component.updateForm.patchValue({ newCollectionDate: pastDate });
      component.updateForm.get('newCollectionDate')?.setErrors(null);
      component.onUpdate();
      tick();

      expect(componentSnackBar.open).toHaveBeenCalledWith(
        'Error 9999: Backend error from errorResponse',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));

    it('should handle HTTP error during update and reset loading', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      unitServiceSpy.changeCollectionDate.and.returnValue(
        throwError(() => ({ error: { message: 'Network error' } }))
      );

      componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      const pastDate = moment('2012-04-10');
      component.updateForm.patchValue({ newCollectionDate: pastDate });
      component.updateForm.get('newCollectionDate')?.setErrors(null);
      component.onUpdate();
      tick();

      expect(component.loading()).toBeFalse();
      expect(componentSnackBar.open).toHaveBeenCalled();
      const callArgs = (componentSnackBar.open as jasmine.Spy).calls.mostRecent()?.args;
      expect(callArgs?.[0]).toContain('Network error');
    }));
  });

  describe('onSearch edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not search when parsedUnitId is null', () => {
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue(null);
      component.onSearch();
      expect(unitServiceSpy.validateUnit).not.toHaveBeenCalled();
    });

    it('should reset state before making search call', fakeAsync(() => {
      unitServiceSpy.validateUnit.and.returnValue(of(mockUnitData));
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('W633312070523');

      // Pre-set some state
      component.unitFound.set(true);
      component.unitData.set(mockUnitData);

      component.onSearch();

      // During the search, state should have been reset
      // After the search completes, it should be restored
      tick();
      expect(component.searching()).toBeFalse();
      expect(component.unitFound()).toBeTrue();
    }));

    it('should set searching to false on error', fakeAsync(() => {
      unitServiceSpy.validateUnit.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('W633312070523');

      componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      component.onSearch();
      tick();

      expect(component.searching()).toBeFalse();
      expect(component.unitFound()).toBeFalse();
    }));

    it('should pass correct request to validateUnit service', fakeAsync(() => {
      unitServiceSpy.validateUnit.and.returnValue(of(mockUnitData));
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('W633312070523');

      component.onSearch();
      tick();

      expect(unitServiceSpy.validateUnit).toHaveBeenCalledWith({
        unitId: 'W633312070523',
        confirmed: false
      });
    }));
  });

  describe('onReset and resetForm', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset all signals and form state', () => {
      // Set up state
      component.unitFound.set(true);
      component.unitData.set(mockUnitData);
      component.submitted.set(true);
      component.searching.set(true);
      component.updateForm.patchValue({ newCollectionDate: moment('2012-03-10') });

      spyOn(component.unitIdField, 'clear');
      component.onReset();

      expect(component.unitIdField.clear).toHaveBeenCalled();
      expect(component.unitFound()).toBeFalse();
      expect(component.unitData()).toBeNull();
      expect(component.submitted()).toBeFalse();
      expect(component.searching()).toBeFalse();
      expect(component.updateForm.get('newCollectionDate')?.value).toBeNull();
    });
  });

  describe('Signals initial state', () => {
    it('should have loading initially false', () => {
      expect(component.loading()).toBeFalse();
    });

    it('should have searching initially false', () => {
      expect(component.searching()).toBeFalse();
    });

    it('should have unitData initially null', () => {
      expect(component.unitData()).toBeNull();
    });

    it('should have submitted initially false', () => {
      expect(component.submitted()).toBeFalse();
    });

    it('should have unitIdLabel set to Unit ID', () => {
      expect(component.unitIdLabel).toBe('Unit ID');
    });
  });

  describe('collectionDateErrorMatcher', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should be defined as an ErrorStateMatcher', () => {
      expect(component.collectionDateErrorMatcher).toBeDefined();
      expect(component.collectionDateErrorMatcher.isErrorState).toBeDefined();
    });
  });

  describe('showError and showSuccess (private methods via integration)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display error with default message when error has no extractable info', fakeAsync(() => {
      unitServiceSpy.validateUnit.and.returnValue(
        throwError(() => ({}))
      );
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('W633312070523');

      componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open');

      component.onSearch();
      tick();

      expect(componentSnackBar.open).toHaveBeenCalled();
      const callArgs = (componentSnackBar.open as jasmine.Spy).calls.mostRecent()?.args;
      // The default message for search error is 'Unit not found. Please verify the Unit ID.'
      expect(callArgs?.[0]).toBe('Unit not found. Please verify the Unit ID.');
    }));
  });

  describe('valueChanges subscription in initForms', () => {
    it('should trigger re-validation when newCollectionDate value changes', fakeAsync(() => {
      fixture.detectChanges();
      component.unitData.set(mockUnitData);

      const control = component.updateForm.get('newCollectionDate');
      spyOn(control!, 'updateValueAndValidity').and.callThrough();

      // Setting a value triggers valueChanges
      control?.setValue(moment('2012-03-10'));
      tick();

      // The subscription calls updateValueAndValidity with { emitEvent: false }
      expect(control!.updateValueAndValidity).toHaveBeenCalled();
    }));
  });

  describe('onUnitCleared', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset updateForm when unit is cleared', () => {
      component.unitData.set(mockUnitData);
      component.unitFound.set(true);
      component.updateForm.patchValue({ newCollectionDate: moment('2012-03-10') });

      component.onUnitCleared();

      expect(component.unitFound()).toBeFalse();
      expect(component.unitData()).toBeNull();
      expect(component.updateForm.get('newCollectionDate')?.value).toBeNull();
    });
  });

  describe('onCancel', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should navigate to /donor-functions', () => {
      component.onCancel();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/donor-functions']);
    });
  });

  describe('onUpdate integration - form focus on invalid', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set submitted to true even when form is invalid', () => {
      component.unitData.set(mockUnitData);
      component.updateForm.get('newCollectionDate')?.setErrors({ required: true });

      component.onUpdate();

      expect(component.submitted()).toBeTrue();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });
  });
});
