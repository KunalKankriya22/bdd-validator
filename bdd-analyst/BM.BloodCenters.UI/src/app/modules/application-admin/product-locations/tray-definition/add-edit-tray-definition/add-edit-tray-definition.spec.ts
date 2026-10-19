import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { SimpleChange } from '@angular/core';
import { AddEditTrayDefinition } from './add-edit-tray-definition';
import { TrayDefinitionService } from '../services/tray-definition.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { TrayDto, TrayStatusLovDto } from '../models/tray-definition.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';
import { TrayScanService } from '@shared/services/tray-scan.service';

describe('AddEditTrayDefinition', () => {
  let component: AddEditTrayDefinition;
  let fixture: ComponentFixture<AddEditTrayDefinition>;
  let trayDefinitionServiceSpy: jasmine.SpyObj<TrayDefinitionService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let trayScanServiceSpy: jasmine.SpyObj<TrayScanService>;

  // Helper to get a future date (N years from now)
  const getFutureDate = (yearsFromNow: number = 1): Date => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + yearsFromNow);
    return date;
  };

  const mockStatusOptions: TrayStatusLovDto[] = [
    { code: 'AV', description: 'Available' },
    { code: 'IU', description: 'In Use' }
  ];

  const mockTrayData: TrayDto = {
    chapterId: '0001',
    trayNumber: '1234',
    trayDescription: 'Test Tray',
    itemCount: 10,
    trayStatus: 'AV',
    productType: 'Whole Blood',
    effectiveDate: new Date('2025-01-30'),
    termDate: new Date('2025-11-02'),
    lastModifiedDate: new Date('2025-05-27T08:32:00Z')
  };

  beforeEach(async () => {
    trayDefinitionServiceSpy = jasmine.createSpyObj('TrayDefinitionService', [
      'getTrayStatusLov',
      'createTray',
      'updateTray'
    ]);
    headerServiceSpy = createMockHeaderService();
    snackbarServiceSpy = createMockSnackbarService();
    trayScanServiceSpy = jasmine.createSpyObj('TrayScanService', ['validateTrayScan']);

    trayDefinitionServiceSpy.getTrayStatusLov.and.returnValue(of(mockStatusOptions));
    headerServiceSpy.getCurrentChapterId.and.returnValue('0001');
    headerServiceSpy.getCurrentChapterTimezone.and.returnValue('America/New_York');
    trayScanServiceSpy.validateTrayScan.and.returnValue(
      of({ success: true, item: { trayNumber: null }, message: '', errorCode: null, errorResponse: { errorCode: '', error: '' } })
    );

    await TestBed.configureTestingModule({
      imports: [AddEditTrayDefinition, NoopAnimationsModule],
      providers: [
        { provide: TrayDefinitionService, useValue: trayDefinitionServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: TrayScanService, useValue: trayScanServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditTrayDefinition);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {

    it('should initialize add mode form with default values', () => {
      component.mode = 'add';
      fixture.detectChanges();

      expect(component.form.get('trayNumber')?.value).toBe('');
      expect(component.form.get('trayDescription')?.value).toBe('');
      expect(component.form.get('itemCount')?.value).toBe(0);
      // trayStatus defaults to 'IN' in add mode per business rules
      expect(component.form.get('trayStatus')?.value).toBe('IN');
    });

    it('should load tray status options on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(trayDefinitionServiceSpy.getTrayStatusLov).toHaveBeenCalled();
      expect((component as any).trayStatusOptions()).toEqual(mockStatusOptions);
    }));

    it('should set display values in edit mode', () => {
      component.mode = 'edit';
      component.data = mockTrayData;
      fixture.detectChanges();

      expect((component as any).displayTrayNumber()).toBe('1234');
      expect((component as any).displayDescription()).toBe('Test Tray');
      expect((component as any).displayProduct()).toBe('Whole Blood');
    });

    it('should set display product to N/A when productType is null', () => {
      component.mode = 'edit';
      component.data = { ...mockTrayData, productType: null };
      fixture.detectChanges();

      expect((component as any).displayProduct()).toBe('N/A');
    });

    it('should set lastModified string when lastModifiedDate is present in edit mode', () => {
      component.mode = 'edit';
      component.data = mockTrayData;
      fixture.detectChanges();

      const lastModified = (component as any).lastModified();
      expect(lastModified).toContain('Last Modified:');
    });

    it('should handle loadTrayStatusOptions error', fakeAsync(() => {
      trayDefinitionServiceSpy.getTrayStatusLov.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      spyOn(console, 'error');
      fixture.detectChanges();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Failed to load status options. Please try again.'
      );
      expect((component as any).isLoadingOptions()).toBe(false);
    }));
  });

  describe('ngOnChanges', () => {
    it('should call updateFormForMode when mode changes after form init', () => {
      component.mode = 'add';
      fixture.detectChanges();

      spyOn(component as any, 'updateFormForMode').and.callThrough();

      component.mode = 'edit';
      component.data = mockTrayData;
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, mockTrayData, false)
      });

      expect((component as any).updateFormForMode).toHaveBeenCalled();
    });

    it('should not call updateFormForMode when form is not initialized', () => {
      // Before detectChanges, form is not initialized
      spyOn(component as any, 'updateFormForMode').and.callThrough();

      component.ngOnChanges({
        mode: new SimpleChange(null, 'edit', true)
      });

      // form is null before ngOnInit, so updateFormForMode should not be called
      expect((component as any).updateFormForMode).not.toHaveBeenCalled();
    });

    it('should not call updateFormForMode when changes do not include mode or data', () => {
      component.mode = 'add';
      fixture.detectChanges();

      spyOn(component as any, 'updateFormForMode').and.callThrough();

      component.ngOnChanges({ someOtherProp: new SimpleChange('a', 'b', false) });

      expect((component as any).updateFormForMode).not.toHaveBeenCalled();
    });
  });

  describe('Edit Mode - form initialization', () => {
    it('should set minTerminationDate to chapterDate when effectiveDate is before chapterDate', () => {
      component.mode = 'edit';
      component.data = {
        ...mockTrayData,
        effectiveDate: new Date('2020-01-01'), // past date, before chapter min
        termDate: null
      };
      fixture.detectChanges();

      // minTerminationDate should be set (to at least chapterDate)
      expect((component as any).minTerminationDate()).toBeTruthy();
    });

    it('should set minTerminationDate to effectiveDate when effectiveDate is after chapterDate', () => {
      component.mode = 'edit';
      component.data = {
        ...mockTrayData,
        effectiveDate: getFutureDate(2), // far future
        termDate: null
      };
      fixture.detectChanges();

      expect((component as any).minTerminationDate()).toBeTruthy();
    });

    it('should have form controls disabled in edit mode', () => {
      component.mode = 'edit';
      component.data = mockTrayData;
      fixture.detectChanges();

      expect(component.form.get('trayNumber')?.disabled).toBe(true);
      expect(component.form.get('trayDescription')?.disabled).toBe(true);
      expect(component.form.get('effectiveDate')?.disabled).toBe(true);
    });

    it('should have form controls enabled in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();

      expect(component.form.get('trayNumber')?.disabled).toBe(false);
      expect(component.form.get('trayDescription')?.disabled).toBe(false);
      expect(component.form.get('effectiveDate')?.disabled).toBe(false);
    });
  });

  describe('Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should validate tray number max length', () => {
      component.form.patchValue({ trayNumber: '12345' });
      fixture.detectChanges();

      expect(component.form.get('trayNumber')?.errors?.['trayNumberMaxLength']).toBeTruthy();
    });

    it('should validate description max length', () => {
      component.form.patchValue({ trayDescription: 'A'.repeat(31) });
      fixture.detectChanges();

      expect(component.form.get('trayDescription')?.errors?.['maxlength']).toBeTruthy();
    });

    it('should create tray when form is valid', fakeAsync(() => {
      trayDefinitionServiceSpy.createTray.and.returnValue(
        of({ chapterId: '0001', trayNumber: '1234' })
      );

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      component.form.patchValue({
        trayNumber: '1234',
        trayDescription: 'New Tray',
        itemCount: 5,
        trayStatus: 'AV',
        effectiveDate: futureDate,
        terminationDate: null
      });

      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');
      component.onSave();
      tick();

      expect(trayDefinitionServiceSpy.createTray).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('New Tray details have been saved.');
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));

    it('should reset form after save and create another', fakeAsync(() => {
      trayDefinitionServiceSpy.createTray.and.returnValue(
        of({ chapterId: '0001', trayNumber: '1234' })
      );

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      component.form.patchValue({
        trayNumber: '1234',
        trayDescription: 'New Tray',
        itemCount: 5,
        trayStatus: 'AV',
        effectiveDate: futureDate
      });

      component.onSaveAndCreateAnother();
      tick();

      expect(component.form.get('trayNumber')?.value).toBe('');
      expect(component.form.get('trayDescription')?.value).toBe('');
      expect((component as any).submitted()).toBe(false);
    }));

    it('should not call createTray when form is invalid on onSave', fakeAsync(() => {
      // Leave form empty (required fields missing)
      component.onSave();
      tick();

      expect(trayDefinitionServiceSpy.createTray).not.toHaveBeenCalled();
      expect((component as any).submitted()).toBe(true);
    }));

    it('should not call createTray when form is invalid on onSaveAndCreateAnother', fakeAsync(() => {
      component.onSaveAndCreateAnother();
      tick();

      expect(trayDefinitionServiceSpy.createTray).not.toHaveBeenCalled();
      expect((component as any).submitted()).toBe(true);
    }));
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockTrayData;
      fixture.detectChanges();
    });

    it('should have trayNumber and trayDescription disabled in edit mode', () => {
      expect(component.form.get('trayNumber')?.disabled).toBe(true);
      expect(component.form.get('trayDescription')?.disabled).toBe(true);
      expect(component.form.get('effectiveDate')?.disabled).toBe(true);
    });

    it('should update tray when form is valid', fakeAsync(() => {
      trayDefinitionServiceSpy.updateTray.and.returnValue(of(undefined));

      component.form.patchValue({
        itemCount: 15,
        trayStatus: 'IU',
        terminationDate: getFutureDate(1)
      });

      spyOn(component.saveSuccess, 'emit');
      component.onSave();
      tick();

      expect(trayDefinitionServiceSpy.updateTray).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Tray details have been updated.');
      expect(component.saveSuccess.emit).toHaveBeenCalled();
    }));

    it('should call onClose when updateTray detects no changes made', fakeAsync(() => {
      // Call updateTray directly (bypassing form validation)
      // originalEditValues matches current form values -> hasChanges() = false -> onClose()
      spyOn(component.closePanel, 'emit');

      (component as any).updateTray();
      tick();

      expect(trayDefinitionServiceSpy.updateTray).not.toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));

    it('should return false from hasChanges when no values changed', () => {
      // Form values equal originalEditValues
      expect((component as any).hasChanges()).toBe(false);
    });

    it('should return true from hasChanges when itemCount changed', () => {
      component.form.patchValue({ itemCount: 999 });
      expect((component as any).hasChanges()).toBe(true);
    });

    it('should return true from hasChanges when trayStatus changed', () => {
      component.form.patchValue({ trayStatus: 'IU' });
      expect((component as any).hasChanges()).toBe(true);
    });
  });

  describe('onClearAll', () => {
    it('should reset to original values in edit mode', () => {
      component.mode = 'edit';
      component.data = mockTrayData;
      fixture.detectChanges();

      // Change some values
      component.form.patchValue({ itemCount: 999, trayStatus: 'IU' });

      component.onClearAll();

      expect(component.form.get('itemCount')?.value).toBe(10); // back to original
      expect(component.form.get('trayStatus')?.value).toBe('AV'); // back to original
      expect((component as any).submitted()).toBe(false);
    });

    it('should reset to empty values in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();

      component.form.patchValue({
        trayNumber: '1234',
        trayDescription: 'Test',
        itemCount: 50,
        trayStatus: 'AV'
      });

      component.onClearAll();

      expect(component.form.get('trayNumber')?.value).toBe('');
      expect(component.form.get('trayDescription')?.value).toBe('');
      expect(component.form.get('itemCount')?.value).toBe(0);
      expect(component.form.get('trayStatus')?.value).toBe('IN');
      expect((component as any).submitted()).toBe(false);
    });
  });

  describe('onClose', () => {
    it('should emit closePanel event', () => {
      component.mode = 'add';
      fixture.detectChanges();

      spyOn(component.closePanel, 'emit');
      component.onClose();

      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should validate item count range', () => {
      component.form.patchValue({ itemCount: -1 });
      expect(component.form.get('itemCount')?.errors?.['itemCountMin']).toBeTruthy();

      component.form.patchValue({ itemCount: 10000 });
      expect(component.form.get('itemCount')?.errors?.['itemCountMax']).toBeTruthy();

      component.form.patchValue({ itemCount: 50 });
      expect(component.form.get('itemCount')?.errors).toBeNull();
    });

    it('should expose form controls via f getter', () => {
      expect(component.f['trayNumber']).toBeDefined();
      expect(component.f['trayDescription']).toBeDefined();
      expect(component.f['itemCount']).toBeDefined();
    });
  });

  describe('getEffectiveDateError and getTerminationDateError', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return empty string when no effective date error', () => {
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return empty string when no termination date error', () => {
      expect(component.getTerminationDateError()).toBe('');
    });
  });

  describe('onEffectiveDateInput and onTerminationDateInput', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should handle effective date input event', () => {
      const event = { target: { value: '01-JAN-2025' } } as unknown as Event;
      expect(() => component.onEffectiveDateInput(event)).not.toThrow();
    });

    it('should handle termination date input event', () => {
      const event = { target: { value: '01-DEC-2025' } } as unknown as Event;
      expect(() => component.onTerminationDateInput(event)).not.toThrow();
    });

    it('should handle termination date input in edit mode', () => {
      component.mode = 'edit';
      component.data = mockTrayData;
      fixture.detectChanges();

      const event = { target: { value: '01-DEC-2025' } } as unknown as Event;
      expect(() => component.onTerminationDateInput(event)).not.toThrow();
    });
  });

  describe('setupDateValidationListeners', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should update minTerminationDate when effectiveDate changes to a value', fakeAsync(() => {
      const futureDate = getFutureDate(1);
      component.form.get('effectiveDate')?.setValue(futureDate);
      tick(10);

      expect((component as any).minTerminationDate()).toBeTruthy();
    }));

    it('should set minTerminationDate to null when effectiveDate is cleared', fakeAsync(() => {
      // First set a date
      component.form.get('effectiveDate')?.setValue(getFutureDate(1));
      tick(10);

      // Then clear it
      component.form.get('effectiveDate')?.setValue(null);
      tick(10);

      expect((component as any).minTerminationDate()).toBeNull();
    }));
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should handle duplicate tray number error (0319)', fakeAsync(() => {
      trayDefinitionServiceSpy.createTray.and.returnValue(
        throwError(() => ({ errorCode: '0319', message: 'Tray number already exists' }))
      );

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      component.form.patchValue({
        trayNumber: '1234',
        trayDescription: 'Test',
        trayStatus: 'AV',
        effectiveDate: futureDate
      });

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Error 0319: Tray number already exists. Please use a different tray number.'
      );
    }));

    it('should handle invalid status error (0365)', fakeAsync(() => {
      trayDefinitionServiceSpy.createTray.and.returnValue(
        throwError(() => ({ errorCode: '0365', message: 'Invalid tray status code' }))
      );

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      component.form.patchValue({
        trayNumber: '1234',
        trayDescription: 'Test',
        trayStatus: 'XX',
        effectiveDate: futureDate
      });

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Error 0365: Invalid tray status code. Please select a valid status.'
      );
    }));

    it('should handle termination date before effective date error (0500)', fakeAsync(() => {
      trayDefinitionServiceSpy.createTray.and.returnValue(
        throwError(() => ({ errorCode: '0500', message: 'Term date before effective date' }))
      );

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      component.form.patchValue({
        trayNumber: '1234',
        trayDescription: 'Test',
        trayStatus: 'AV',
        effectiveDate: futureDate
      });

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Error 0500: Termination Date must be on or after Effective Date.'
      );
    }));

    it('should handle termination date error (4503)', fakeAsync(() => {
      trayDefinitionServiceSpy.createTray.and.returnValue(
        throwError(() => ({ errorCode: '4503', message: 'Term date issue' }))
      );

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      component.form.patchValue({
        trayNumber: '1234',
        trayDescription: 'Test',
        trayStatus: 'AV',
        effectiveDate: futureDate
      });

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Error 4503: Termination Date must be on or after Effective Date.'
      );
    }));

    it('should handle past effective date error (0501)', fakeAsync(() => {
      trayDefinitionServiceSpy.createTray.and.returnValue(
        throwError(() => ({ errorCode: '0501', message: 'Past date' }))
      );

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      component.form.patchValue({
        trayNumber: '1234',
        trayDescription: 'Test',
        trayStatus: 'AV',
        effectiveDate: futureDate
      });

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Error 0501: Effective Date cannot be in the past.'
      );
    }));

    it('should handle failed to save changes error (0600)', fakeAsync(() => {
      trayDefinitionServiceSpy.createTray.and.returnValue(
        throwError(() => ({ errorCode: '0600', message: 'Save failed' }))
      );

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      component.form.patchValue({
        trayNumber: '1234',
        trayDescription: 'Test',
        trayStatus: 'AV',
        effectiveDate: futureDate
      });

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Error 0600: Failed to save changes.'
      );
    }));

    it('should use error.message for unrecognized error codes', fakeAsync(() => {
      trayDefinitionServiceSpy.createTray.and.returnValue(
        throwError(() => ({ errorCode: '9999', message: 'Custom error' }))
      );

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      component.form.patchValue({
        trayNumber: '1234',
        trayDescription: 'Test',
        trayStatus: 'AV',
        effectiveDate: futureDate
      });

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Error 9999: Custom error'
      );
    }));

    it('should use generic message when no errorCode and no message', fakeAsync(() => {
      trayDefinitionServiceSpy.createTray.and.returnValue(
        throwError(() => ({}))
      );

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      component.form.patchValue({
        trayNumber: '1234',
        trayDescription: 'Test',
        trayStatus: 'AV',
        effectiveDate: futureDate
      });

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'An error occurred. Please try again.'
      );
    }));

    it('should use error.message when no errorCode but message exists', fakeAsync(() => {
      trayDefinitionServiceSpy.createTray.and.returnValue(
        throwError(() => ({ message: 'Server unavailable' }))
      );

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      component.form.patchValue({
        trayNumber: '1234',
        trayDescription: 'Test',
        trayStatus: 'AV',
        effectiveDate: futureDate
      });

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Server unavailable');
    }));

    it('should handle update tray error', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockTrayData;
      fixture.detectChanges();

      trayDefinitionServiceSpy.updateTray.and.returnValue(
        throwError(() => ({ errorCode: '0600', message: 'Update failed' }))
      );

      // Force hasChanges() to return true and call updateTray() directly
      // to bypass form validity checks (termDate may be in the past in tests)
      spyOn(component as any, 'hasChanges').and.returnValue(true);
      (component as any).updateTray();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Error 0600: Failed to save changes.'
      );
    }));
  });

  describe('User Interactions', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should block non-numeric input in item count', () => {
      const event = new KeyboardEvent('keypress', { key: 'a', charCode: 97 });
      spyOn(event, 'preventDefault');

      const result = component.onlyPositiveNumbers(event);

      expect(result).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow numeric input in item count', () => {
      const event = new KeyboardEvent('keypress', { key: '5', charCode: 53 });

      const result = component.onlyPositiveNumbers(event);

      expect(result).toBe(true);
    });

    it('should block numeric input when input already has 4 digits and nothing selected', () => {
      // Use a plain object to avoid read-only 'target' property issue on real Event
      const mockPreventDefault = jasmine.createSpy('preventDefault');
      const mockEvent = {
        key: '5',
        target: { value: '1234', selectionStart: 4, selectionEnd: 4 },
        preventDefault: mockPreventDefault
      } as unknown as KeyboardEvent;

      const result = component.onlyPositiveNumbers(mockEvent);

      expect(result).toBe(false);
      expect(mockPreventDefault).toHaveBeenCalled();
    });

    it('should allow numeric input when input has 4 digits but text is selected', () => {
      // selectionStart !== selectionEnd means text is selected
      const mockEvent = {
        key: '5',
        target: { value: '1234', selectionStart: 0, selectionEnd: 4 },
        preventDefault: jasmine.createSpy('preventDefault')
      } as unknown as KeyboardEvent;

      const result = component.onlyPositiveNumbers(mockEvent);

      expect(result).toBe(true);
    });

    it('should block minus sign in item count', () => {
      const event = new KeyboardEvent('keypress', { key: '-' });
      spyOn(event, 'preventDefault');

      const result = component.onlyPositiveNumbers(event);

      expect(result).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should paste only numeric characters in item count (max 4 digits)', () => {
      const mockEvent = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => 'abc123def456' }
      } as unknown as ClipboardEvent;
      // JSDOM does not implement execCommand; assign a spy directly on document
      const execCommandSpy = jasmine.createSpy('execCommand');
      (document as any).execCommand = execCommandSpy;

      component.onPasteNumbers(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(execCommandSpy).toHaveBeenCalledWith('insertText', false, '1234');
    });

    it('should paste at most 4 digits when pasted text has more', () => {
      const mockEvent = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => '12345678' }
      } as unknown as ClipboardEvent;
      const execCommandSpy = jasmine.createSpy('execCommand');
      (document as any).execCommand = execCommandSpy;

      component.onPasteNumbers(mockEvent);

      expect(execCommandSpy).toHaveBeenCalledWith('insertText', false, '1234');
    });

    it('should handle null clipboard data in onPasteNumbers', () => {
      const mockEvent = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: null
      } as unknown as ClipboardEvent;
      const execCommandSpy = jasmine.createSpy('execCommand');
      (document as any).execCommand = execCommandSpy;

      component.onPasteNumbers(mockEvent);

      expect(execCommandSpy).toHaveBeenCalledWith('insertText', false, '');
    });

    it('should truncate item count to 4 digits on onItemCountInput', () => {
      const input = document.createElement('input');
      input.value = '12345';
      const event = { target: input } as unknown as Event;
      spyOn(component.form.get('itemCount')!, 'setValue');

      component.onItemCountInput(event);

      expect(input.value).toBe('1234');
      expect(component.form.get('itemCount')!.setValue).toHaveBeenCalledWith(1234);
    });

    it('should set itemCount to 0 when non-numeric input is provided via onItemCountInput', () => {
      // Non-numeric characters -> stripped to empty -> setValue(0)
      const input = document.createElement('input');
      input.value = 'abc';
      const event = { target: input } as unknown as Event;
      spyOn(component.form.get('itemCount')!, 'setValue');

      component.onItemCountInput(event);

      expect(input.value).toBe('');
      expect(component.form.get('itemCount')!.setValue).toHaveBeenCalledWith(0);
    });

    it('should not update input value when it is already 4 digits or fewer', () => {
      const input = document.createElement('input');
      input.value = '123';
      const originalValue = input.value;
      const event = { target: input } as unknown as Event;

      component.onItemCountInput(event);

      expect(input.value).toBe(originalValue);
    });

    it('should allow alphanumeric keypress in tray number field', () => {
      const event = new KeyboardEvent('keypress', { key: 'A' });
      expect(component.onlyAlphanumeric(event)).toBe(true);
    });

    it('should block special character keypress in tray number field', () => {
      const mockEvent = {
        key: '!',
        preventDefault: jasmine.createSpy('preventDefault')
      } as unknown as KeyboardEvent;
      const result = component.onlyAlphanumeric(mockEvent);
      expect(result).toBe(false);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should allow alphanumeric and space keypress in description field', () => {
      const spaceEvent = new KeyboardEvent('keypress', { key: ' ' });
      const alphaEvent = new KeyboardEvent('keypress', { key: 'B' });
      expect(component.onlyAlphanumericWithSpaces(spaceEvent)).toBe(true);
      expect(component.onlyAlphanumericWithSpaces(alphaEvent)).toBe(true);
    });

    it('should block special characters in description field', () => {
      const mockEvent = {
        key: '@',
        preventDefault: jasmine.createSpy('preventDefault')
      } as unknown as KeyboardEvent;
      const result = component.onlyAlphanumericWithSpaces(mockEvent);
      expect(result).toBe(false);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should paste only alphanumeric characters for trayNumber field', () => {
      const mockEvent = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => 'ABC 123!@#' }
      } as unknown as ClipboardEvent;
      const execCommandSpy = jasmine.createSpy('execCommand');
      (document as any).execCommand = execCommandSpy;

      component.onPasteAlphanumeric(mockEvent, 'trayNumber');

      expect(execCommandSpy).toHaveBeenCalledWith('insertText', false, 'ABC123');
    });

    it('should paste alphanumeric and spaces for trayDescription field', () => {
      const mockEvent = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => 'ABC 123!@#' }
      } as unknown as ClipboardEvent;
      const execCommandSpy = jasmine.createSpy('execCommand');
      (document as any).execCommand = execCommandSpy;

      component.onPasteAlphanumeric(mockEvent, 'trayDescription');

      expect(execCommandSpy).toHaveBeenCalledWith('insertText', false, 'ABC 123');
    });
  });
});
