import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';
import { SimpleChange, SimpleChanges } from '@angular/core';

import { AddEditProcessStage } from './add-edit-process-stage';
import { ProcessStagesService } from '../services/process-stages.service';
import { HeaderService } from '@shared/services/header.service';
import { ProcessStageDto, DropdownDto } from '../models/process-stages.model';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditProcessStage', () => {
  let processStagesService: any;
  let component: AddEditProcessStage;
  let fixture: ComponentFixture<AddEditProcessStage>;
  let processStagesServiceSpy: jasmine.SpyObj<ProcessStagesService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const mockProcessCodes: DropdownDto[] = [
    { code: 'PROC1', description: 'Process Type 1' },
    { code: 'PROC2', description: 'Process Type 2' },
  ];

  const mockStageCodes: DropdownDto[] = [
    { code: 'ST1', description: 'Stage 1' },
    { code: 'ST2', description: 'Stage 2' },
  ];

  const mockProcessStage: ProcessStageDto = {
    processCode: 'PROC1',
    stageCode: 'ST1',
    stageSequence: 1,
    effDate: '15-Jan-2024',
    termDate: null,
    insertDate: '01-Jan-2024',
    insertUser: 'ADMIN',
    auditKey: 123456,
  };

  beforeEach(() => {

    processStagesService = jasmine.createSpyObj('ProcessStagesService', [
      'getProcessCodes',
      'getStageCodes',
      'createProcessStage',
      'updateProcessStage',
    ]);
    const snackBar = createMockMatSnackBar();
    const headerService = createMockHeaderService();



      TestBed.configureTestingModule({
imports: [AddEditProcessStage, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: ProcessStagesService, useValue: processStagesService },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: HeaderService, useValue: headerService },
      ],
    });


    });



  beforeEach(() => {


      processStagesService.getProcessCodes.calls.reset();


      processStagesService.getStageCodes.calls.reset();


      processStagesService.createProcessStage.calls.reset();


      processStagesService.updateProcessStage.calls.reset();


    processStagesServiceSpy = TestBed.inject(ProcessStagesService) as jasmine.SpyObj<ProcessStagesService>;
    snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    headerServiceSpy = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;

    processStagesServiceSpy.getProcessCodes.and.returnValue(of({ data: mockProcessCodes }));
    processStagesServiceSpy.getStageCodes.and.returnValue(of({ data: mockStageCodes }));

    fixture = TestBed.createComponent(AddEditProcessStage);
    component = fixture.componentInstance;

    // Override the component's snackBar with the spy since the standalone
    // component's MatSnackBarModule provides its own MatSnackBar instance
    (component as any).snackBar = snackBarSpy;


    });

  describe('Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should initialize with add mode', () => {
      expect(component.panelTitle).toBe('Add New Process Stage');
      expect(component.form.get('processCode')?.enabled).toBeTrue();
      expect(component.form.get('stageCode')?.enabled).toBeTrue();
    });


    it('should load stage codes on init', () => {
      expect(processStagesServiceSpy.getStageCodes).toHaveBeenCalled();
      expect(component.stageCodes).toEqual(mockStageCodes);
    });

    it('should update process description when process code is selected', () => {
      component.form.patchValue({ processCode: 'PROC1' });
      expect(component.processDescription).toBe('Process Type 1');
    });

    it('should update stage description when stage code is selected', () => {
      component.form.patchValue({ stageCode: 'ST1' });
      expect(component.stageDescription).toBe('Stage 1');
    });




    it('should create process stage on save', () => {
      processStagesServiceSpy.createProcessStage.and.returnValue(
        of({ success: true, message: 'Created successfully', statusCode: 201 })
      );

      component.form.patchValue({
        processCode: 'PROC1',
        stageCode: 'ST1',
        stageSequence: 1,
        effectiveDate: moment('2099-06-01'),
        terminationDate: null,
      });
      component.form.updateValueAndValidity();

      component.onSave();

      expect(component.form.valid).toBeTrue();
      expect(processStagesServiceSpy.createProcessStage).toHaveBeenCalled();
    });



    it('should block non-numeric input in stage sequence', () => {
      const event = { which: 65, keyCode: 65, preventDefault: jasmine.createSpy('preventDefault') } as any;

      const result = component.onlyNumbers(event);

      expect(result).toBeFalse();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow numeric input in stage sequence', () => {
      const event = { which: 49, keyCode: 49, preventDefault: jasmine.createSpy('preventDefault') } as any;
      const result = component.onlyNumbers(event);
      expect(result).toBeTrue();
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockProcessStage;
      fixture.detectChanges();
    });

    it('should initialize with edit mode', () => {
      expect(component.panelTitle).toBe('Edit Process Stage');
      expect(component.form.get('processCode')?.disabled).toBeTrue();
      expect(component.form.get('stageCode')?.disabled).toBeTrue();
    });


    it('should update process stage on save', () => {
      processStagesServiceSpy.updateProcessStage.and.returnValue(
        of({ success: true, message: 'Updated successfully', statusCode: 200 })
      );

      component.form.patchValue({
        stageSequence: 2,
        effectiveDate: moment('2099-01-01'),
        terminationDate: moment('2099-12-31'),
      });

      component.onSave();

      expect(processStagesServiceSpy.updateProcessStage).toHaveBeenCalledWith(
        'PROC1',
        'ST1',
        jasmine.objectContaining({
          stageSequence: 2,
        })
      );
    });

  });

  describe('Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return error for missing process code', () => {
      component.form.get('processCode')?.markAsTouched();
      expect(component.getProcessCodeError()).toBe('Process Code is required');
    });

    it('should return error for missing stage code', () => {
      component.form.get('stageCode')?.markAsTouched();
      expect(component.getStageCodeError()).toBe('Stage Code is required');
    });

    it('should validate process code max length', () => {
      component.form.patchValue({ processCode: 'TOOLONG' });
      component.form.get('processCode')?.markAsTouched();
      expect(component.getProcessCodeError()).toBe('Process Code cannot exceed 5 characters');
    });

    it('should validate stage code max length', () => {
      component.form.patchValue({ stageCode: 'TOOLONG' });
      component.form.get('stageCode')?.markAsTouched();
      expect(component.getStageCodeError()).toBe('Stage Code cannot exceed 5 characters');
    });
  });

  // ─── NEW TESTS ────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should complete the destroy$ subject', () => {
      const destroySub = (component as any).destroy$ as Subject<void>;
      const nextSpy = spyOn(destroySub, 'next');
      const completeSpy = spyOn(destroySub, 'complete');

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should skip setup when firstChange is true for both mode and data', () => {
      const changes: SimpleChanges = {
        mode: new SimpleChange(undefined, 'add', true),
        data: new SimpleChange(undefined, null, true),
      };
      const panelTitleBefore = component.panelTitle;
      component.ngOnChanges(changes);
      expect(component.panelTitle).toBe(panelTitleBefore);
    });

    it('should call setupPanel when mode changes and is not firstChange', () => {
      component.mode = 'edit';
      component.data = mockProcessStage;
      const changes: SimpleChanges = {
        mode: new SimpleChange('add', 'edit', false),
      };
      component.ngOnChanges(changes);
      expect(component.panelTitle).toBe('Edit Process Stage');
    });

    it('should call setupPanel when data changes and is not firstChange', () => {
      const changes: SimpleChanges = {
        data: new SimpleChange(null, mockProcessStage, false),
      };
      component.mode = 'edit';
      component.data = mockProcessStage;
      component.ngOnChanges(changes);
      expect(component.panelTitle).toBe('Edit Process Stage');
    });

    it('should reset form for add mode when mode changes to add', () => {
      component.mode = 'add';
      const changes: SimpleChanges = {
        mode: new SimpleChange('edit', 'add', false),
      };
      component.ngOnChanges(changes);
      expect(component.panelTitle).toBe('Add New Process Stage');
      expect(component.processDescription).toBe('-');
      expect(component.stageDescription).toBe('-');
    });
  });

  describe('onCancel', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should emit closePanel event', () => {
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  describe('isFormValid getter', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return false when form is invalid', () => {
      expect(component.isFormValid).toBeFalse();
    });

    it('should return true when form is valid', () => {
      component.form.patchValue({
        processCode: 'PROC1',
        stageCode: 'ST1',
        effectiveDate: moment('2099-06-01'),
      });
      component.form.updateValueAndValidity();
      expect(component.isFormValid).toBeTrue();
    });
  });

  describe('onSave - Add Mode Error Handling', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should not save when form is invalid', () => {
      component.onSave();
      expect(processStagesServiceSpy.createProcessStage).not.toHaveBeenCalled();
    });

    it('should show error snackbar on create failure', () => {
      processStagesServiceSpy.createProcessStage.and.returnValue(
        throwError(() => ({ error: { message: 'Duplicate record' } }))
      );

      component.form.patchValue({
        processCode: 'PROC1',
        stageCode: 'ST1',
        effectiveDate: moment('2099-06-01'),
      });
      component.form.updateValueAndValidity();

      component.onSave();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Duplicate record',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should show default error message when error has no message', () => {
      processStagesServiceSpy.createProcessStage.and.returnValue(
        throwError(() => ({}))
      );

      component.form.patchValue({
        processCode: 'PROC1',
        stageCode: 'ST1',
        effectiveDate: moment('2099-06-01'),
      });
      component.form.updateValueAndValidity();

      component.onSave();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Failed to create process stage. Please try again.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should set isSaving to false after create error via finalize', () => {
      processStagesServiceSpy.createProcessStage.and.returnValue(
        throwError(() => ({ error: { message: 'Error' } }))
      );

      component.form.patchValue({
        processCode: 'PROC1',
        stageCode: 'ST1',
        effectiveDate: moment('2099-06-01'),
      });
      component.form.updateValueAndValidity();

      component.onSave();

      expect(component.isSaving).toBeFalse();
    });

    it('should emit saveSuccess and closePanel on create success', () => {
      processStagesServiceSpy.createProcessStage.and.returnValue(
        of({ success: true, message: 'Created', statusCode: 201 })
      );
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        processCode: 'PROC1',
        stageCode: 'ST1',
        effectiveDate: moment('2099-06-01'),
      });
      component.form.updateValueAndValidity();

      component.onSave();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should use default success message when response has no message', () => {
      processStagesServiceSpy.createProcessStage.and.returnValue(
        of({ success: true, message: '', statusCode: 201 })
      );

      component.form.patchValue({
        processCode: 'PROC1',
        stageCode: 'ST1',
        effectiveDate: moment('2099-06-01'),
      });
      component.form.updateValueAndValidity();

      component.onSave();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'All changes are saved.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    });

    it('should set isSaving to true during save', () => {
      const saveSubject = new Subject<any>();
      processStagesServiceSpy.createProcessStage.and.returnValue(saveSubject.asObservable());

      component.form.patchValue({
        processCode: 'PROC1',
        stageCode: 'ST1',
        effectiveDate: moment('2099-06-01'),
      });
      component.form.updateValueAndValidity();

      component.onSave();

      expect(component.isSaving).toBeTrue();

      saveSubject.next({ success: true, message: 'ok', statusCode: 201 });
      saveSubject.complete();

      expect(component.isSaving).toBeFalse();
    });
  });

  describe('onSave - Edit Mode Error Handling', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockProcessStage;
      fixture.detectChanges();
    });

    it('should show error snackbar on update failure', () => {
      processStagesServiceSpy.updateProcessStage.and.returnValue(
        throwError(() => ({ error: { message: 'Update failed' } }))
      );

      component.form.patchValue({
        stageSequence: 2,
        effectiveDate: moment('2099-01-01'),
        terminationDate: moment('2099-12-31'),
      });

      component.onSave();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Update failed',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should show default error message on update failure without message', () => {
      processStagesServiceSpy.updateProcessStage.and.returnValue(
        throwError(() => ({}))
      );

      component.form.patchValue({
        stageSequence: 2,
        effectiveDate: moment('2099-01-01'),
        terminationDate: moment('2099-12-31'),
      });

      component.onSave();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Failed to update process stage. Please try again.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should set isSaving to false after update error via finalize', () => {
      processStagesServiceSpy.updateProcessStage.and.returnValue(
        throwError(() => ({ error: { message: 'Error' } }))
      );

      component.form.patchValue({
        stageSequence: 2,
        effectiveDate: moment('2099-01-01'),
        terminationDate: moment('2099-12-31'),
      });

      component.onSave();

      expect(component.isSaving).toBeFalse();
    });

    it('should emit saveSuccess and closePanel on update success', () => {
      processStagesServiceSpy.updateProcessStage.and.returnValue(
        of({ success: true, message: 'Updated', statusCode: 200 })
      );
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        stageSequence: 2,
        effectiveDate: moment('2099-01-01'),
        terminationDate: moment('2099-12-31'),
      });

      component.onSave();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should use default success message when update response has no message', () => {
      processStagesServiceSpy.updateProcessStage.and.returnValue(
        of({ success: true, message: '', statusCode: 200 })
      );

      component.form.patchValue({
        stageSequence: 2,
        effectiveDate: moment('2099-01-01'),
        terminationDate: moment('2099-12-31'),
      });

      component.onSave();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'All changes are saved.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    });
  });

  describe('onAddAndCreateAnother', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should not save when form is invalid', () => {
      component.onAddAndCreateAnother();
      expect(processStagesServiceSpy.createProcessStage).not.toHaveBeenCalled();
    });

    it('should create process stage and reset form on success', () => {
      processStagesServiceSpy.createProcessStage.and.returnValue(
        of({ success: true, message: 'Created', statusCode: 201 })
      );
      spyOn(component.saveSuccess, 'emit');

      component.form.patchValue({
        processCode: 'PROC1',
        stageCode: 'ST1',
        stageSequence: 1,
        effectiveDate: moment('2099-06-01'),
      });
      component.form.updateValueAndValidity();

      component.onAddAndCreateAnother();

      expect(processStagesServiceSpy.createProcessStage).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.processDescription).toBe('-');
      expect(component.stageDescription).toBe('-');
    });

    it('should show success snackbar with response message', () => {
      processStagesServiceSpy.createProcessStage.and.returnValue(
        of({ success: true, message: 'Saved!', statusCode: 201 })
      );

      component.form.patchValue({
        processCode: 'PROC1',
        stageCode: 'ST1',
        effectiveDate: moment('2099-06-01'),
      });
      component.form.updateValueAndValidity();

      component.onAddAndCreateAnother();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Saved!',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    });

    it('should show default message when response message is empty', () => {
      processStagesServiceSpy.createProcessStage.and.returnValue(
        of({ success: true, message: '', statusCode: 201 })
      );

      component.form.patchValue({
        processCode: 'PROC1',
        stageCode: 'ST1',
        effectiveDate: moment('2099-06-01'),
      });
      component.form.updateValueAndValidity();

      component.onAddAndCreateAnother();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'All changes are saved.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    });

    it('should show error snackbar on failure', () => {
      processStagesServiceSpy.createProcessStage.and.returnValue(
        throwError(() => ({ error: { message: 'Duplicate' } }))
      );

      component.form.patchValue({
        processCode: 'PROC1',
        stageCode: 'ST1',
        effectiveDate: moment('2099-06-01'),
      });
      component.form.updateValueAndValidity();

      component.onAddAndCreateAnother();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Duplicate',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should show default error message when error has no message', () => {
      processStagesServiceSpy.createProcessStage.and.returnValue(
        throwError(() => ({}))
      );

      component.form.patchValue({
        processCode: 'PROC1',
        stageCode: 'ST1',
        effectiveDate: moment('2099-06-01'),
      });
      component.form.updateValueAndValidity();

      component.onAddAndCreateAnother();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Failed to create process stage. Please try again.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should set isSaving to false after error via finalize', () => {
      processStagesServiceSpy.createProcessStage.and.returnValue(
        throwError(() => ({ error: { message: 'Error' } }))
      );

      component.form.patchValue({
        processCode: 'PROC1',
        stageCode: 'ST1',
        effectiveDate: moment('2099-06-01'),
      });
      component.form.updateValueAndValidity();

      component.onAddAndCreateAnother();

      expect(component.isSaving).toBeFalse();
    });

    it('should not emit closePanel on success (stays open)', () => {
      processStagesServiceSpy.createProcessStage.and.returnValue(
        of({ success: true, message: 'Created', statusCode: 201 })
      );
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        processCode: 'PROC1',
        stageCode: 'ST1',
        effectiveDate: moment('2099-06-01'),
      });
      component.form.updateValueAndValidity();

      component.onAddAndCreateAnother();

      expect(component.closePanel.emit).not.toHaveBeenCalled();
    });
  });

  describe('Dropdown Search Filtering', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should filter process codes by code', () => {
      component.processSearchControl.setValue('PROC1');
      expect(component.filteredProcessCodes.length).toBe(1);
      expect(component.filteredProcessCodes[0].code).toBe('PROC1');
    });

    it('should filter process codes by description', () => {
      component.processSearchControl.setValue('Type 2');
      expect(component.filteredProcessCodes.length).toBe(1);
      expect(component.filteredProcessCodes[0].code).toBe('PROC2');
    });

    it('should reset filtered process codes when search is cleared', () => {
      component.processSearchControl.setValue('PROC1');
      expect(component.filteredProcessCodes.length).toBe(1);
      component.processSearchControl.setValue('');
      expect(component.filteredProcessCodes.length).toBe(2);
    });

    it('should filter stage codes by code', () => {
      component.stageSearchControl.setValue('ST1');
      expect(component.filteredStageCodes.length).toBe(1);
      expect(component.filteredStageCodes[0].code).toBe('ST1');
    });

    it('should filter stage codes by description', () => {
      component.stageSearchControl.setValue('Stage 2');
      expect(component.filteredStageCodes.length).toBe(1);
      expect(component.filteredStageCodes[0].code).toBe('ST2');
    });

    it('should reset filtered stage codes when search is cleared', () => {
      component.stageSearchControl.setValue('ST1');
      expect(component.filteredStageCodes.length).toBe(1);
      component.stageSearchControl.setValue('');
      expect(component.filteredStageCodes.length).toBe(2);
    });

    it('should return empty array when search matches nothing', () => {
      component.processSearchControl.setValue('NONEXISTENT');
      expect(component.filteredProcessCodes.length).toBe(0);
    });

    it('should be case insensitive in process search', () => {
      component.processSearchControl.setValue('proc1');
      expect(component.filteredProcessCodes.length).toBe(1);
    });

    it('should be case insensitive in stage search', () => {
      component.stageSearchControl.setValue('stage 1');
      expect(component.filteredStageCodes.length).toBe(1);
    });
  });

  describe('Dropdown Close Handlers', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should reset process search and filtered list on dropdown close', () => {
      component.processSearchControl.setValue('PROC1');
      expect(component.filteredProcessCodes.length).toBe(1);

      component.onProcessDropdownClosed();

      expect(component.processSearchControl.value).toBe('');
      expect(component.filteredProcessCodes).toEqual(component.processCodes);
    });

    it('should reset stage search and filtered list on dropdown close', () => {
      component.stageSearchControl.setValue('ST1');
      expect(component.filteredStageCodes.length).toBe(1);

      component.onStageDropdownClosed();

      expect(component.stageSearchControl.value).toBe('');
      expect(component.filteredStageCodes).toEqual(component.stageCodes);
    });
  });

  describe('Load Dropdowns - Error Handling', () => {
    it('should set isLoadingProcessCodes to false on error', () => {
      processStagesServiceSpy.getProcessCodes.and.returnValue(throwError(() => new Error('fail')));
      processStagesServiceSpy.getStageCodes.and.returnValue(of({ data: mockStageCodes }));

      fixture = TestBed.createComponent(AddEditProcessStage);
      component = fixture.componentInstance;
      component.mode = 'add';
      fixture.detectChanges();

      expect(component.isLoadingProcessCodes).toBeFalse();
    });

    it('should set isLoadingStageCodes to false on error', () => {
      processStagesServiceSpy.getProcessCodes.and.returnValue(of({ data: mockProcessCodes }));
      processStagesServiceSpy.getStageCodes.and.returnValue(throwError(() => new Error('fail')));

      fixture = TestBed.createComponent(AddEditProcessStage);
      component = fixture.componentInstance;
      component.mode = 'add';
      fixture.detectChanges();

      expect(component.isLoadingStageCodes).toBeFalse();
    });

    it('should handle null data in process codes response', () => {
      processStagesServiceSpy.getProcessCodes.and.returnValue(of({ data: null } as any));
      processStagesServiceSpy.getStageCodes.and.returnValue(of({ data: mockStageCodes }));

      fixture = TestBed.createComponent(AddEditProcessStage);
      component = fixture.componentInstance;
      component.mode = 'add';
      fixture.detectChanges();

      expect(component.processCodes).toEqual([]);
    });

    it('should handle null data in stage codes response', () => {
      processStagesServiceSpy.getProcessCodes.and.returnValue(of({ data: mockProcessCodes }));
      processStagesServiceSpy.getStageCodes.and.returnValue(of({ data: null } as any));

      fixture = TestBed.createComponent(AddEditProcessStage);
      component = fixture.componentInstance;
      component.mode = 'add';
      fixture.detectChanges();

      expect(component.stageCodes).toEqual([]);
    });
  });

  describe('Process/Stage Description Updates', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should set processDescription to dash when no process code selected', () => {
      component.form.patchValue({ processCode: '' });
      expect(component.processDescription).toBe('-');
    });

    it('should set processDescription to dash when code not found in list', () => {
      component.form.patchValue({ processCode: 'UNKNOWN' });
      expect(component.processDescription).toBe('-');
    });

    it('should set stageDescription to dash when no stage code selected', () => {
      component.form.patchValue({ stageCode: '' });
      expect(component.stageDescription).toBe('-');
    });

    it('should set stageDescription to dash when code not found in list', () => {
      component.form.patchValue({ stageCode: 'UNKNOWN' });
      expect(component.stageDescription).toBe('-');
    });
  });

  describe('Edit Mode - populateFormForEdit', () => {
    it('should populate editModeValues with data', () => {
      component.mode = 'edit';
      component.data = mockProcessStage;
      fixture.detectChanges();

      expect(component.editModeValues.processCode).toBe('PROC1');
      expect(component.editModeValues.stageCode).toBe('ST1');
      expect(component.editModeValues.stageSequence).toBe(1);
    });

    it('should set lastModifiedDisplay from insertDate', () => {
      component.mode = 'edit';
      component.data = { ...mockProcessStage, insertDate: '2024-01-15T10:30:00' };
      fixture.detectChanges();

      expect(component.lastModifiedDisplay).toContain('Last Modified:');
      expect(component.lastModifiedDisplay).toContain('PST');
    });

    it('should handle null insertDate', () => {
      component.mode = 'edit';
      component.data = { ...mockProcessStage, insertDate: '' };
      fixture.detectChanges();

      expect(component.lastModifiedDisplay).toBe('');
    });

    it('should populate form with data values in edit mode', () => {
      component.mode = 'edit';
      component.data = mockProcessStage;
      fixture.detectChanges();

      const rawValue = component.form.getRawValue();
      expect(rawValue.processCode).toBe('PROC1');
      expect(rawValue.stageCode).toBe('ST1');
      expect(rawValue.stageSequence).toBe(1);
    });

    it('should handle data with termDate', () => {
      const stageWithTerm: ProcessStageDto = {
        ...mockProcessStage,
        termDate: '31-Dec-2099',
      };
      component.mode = 'edit';
      component.data = stageWithTerm;
      fixture.detectChanges();

      expect(component.editModeValues.termDate).toBeTruthy();
      const rawValue = component.form.getRawValue();
      expect(rawValue.terminationDate).toBeTruthy();
    });

    it('should handle empty effDate and termDate strings', () => {
      const stageWithEmptyDates: ProcessStageDto = {
        ...mockProcessStage,
        effDate: '',
        termDate: '',
      };
      component.mode = 'edit';
      component.data = stageWithEmptyDates;
      fixture.detectChanges();

      expect(component.editModeValues.effDate).toBe('');
      expect(component.editModeValues.termDate).toBe('');
    });

    it('should not populate form when data is null', () => {
      component.mode = 'edit';
      component.data = null;
      fixture.detectChanges();

      expect(component.panelTitle).toBe('Edit Process Stage');
      expect(component.editModeValues.processCode).toBe('');
    });
  });

  describe('Date Error Messages', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return effective date error message', () => {
      component.form.get('effectiveDate')?.markAsTouched();
      component.form.get('effectiveDate')?.setErrors({ required: true });
      const error = component.getEffDateError();
      expect(error).toBe('Effective Date is required');
    });

    it('should return termination date error message for invalidDate', () => {
      component.form.get('terminationDate')?.markAsTouched();
      component.form.get('terminationDate')?.setErrors({ invalidDate: true });
      const error = component.getTermDateError();
      expect(error).toBe('Termination date is invalid');
    });

    it('should return empty string for getEffDateError when control not touched', () => {
      const error = component.getEffDateError();
      expect(error).toBe('');
    });

    it('should return empty string for getTermDateError when control not touched', () => {
      const error = component.getTermDateError();
      expect(error).toBe('');
    });
  });

  describe('Validation Error Messages - getProcessCodeError', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return empty when control is not touched', () => {
      expect(component.getProcessCodeError()).toBe('');
    });

    it('should return empty when control has no errors and is touched', () => {
      component.form.patchValue({ processCode: 'OK' });
      component.form.get('processCode')?.markAsTouched();
      expect(component.getProcessCodeError()).toBe('');
    });
  });

  describe('Validation Error Messages - getStageCodeError', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return empty when control is not touched', () => {
      expect(component.getStageCodeError()).toBe('');
    });

    it('should return empty when control has no errors and is touched', () => {
      component.form.patchValue({ stageCode: 'OK' });
      component.form.get('stageCode')?.markAsTouched();
      expect(component.getStageCodeError()).toBe('');
    });
  });

  describe('onlyNumbers - edge cases', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should allow digit 0 (charCode 48)', () => {
      const event = { which: 48, keyCode: 48, preventDefault: jasmine.createSpy() } as any;
      expect(component.onlyNumbers(event)).toBeTrue();
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow digit 9 (charCode 57)', () => {
      const event = { which: 57, keyCode: 57, preventDefault: jasmine.createSpy() } as any;
      expect(component.onlyNumbers(event)).toBeTrue();
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should block charCode 47 (just below 0)', () => {
      const event = { which: 47, keyCode: 47, preventDefault: jasmine.createSpy() } as any;
      expect(component.onlyNumbers(event)).toBeFalse();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should block charCode 58 (just above 9)', () => {
      const event = { which: 58, keyCode: 58, preventDefault: jasmine.createSpy() } as any;
      expect(component.onlyNumbers(event)).toBeFalse();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should use keyCode when which is 0', () => {
      const event = { which: 0, keyCode: 50, preventDefault: jasmine.createSpy() } as any;
      expect(component.onlyNumbers(event)).toBeTrue();
    });
  });

  describe('onEffDateBlur and onTermDateBlur', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
      component.effDateInput = { nativeElement: { value: '' } } as any;
      component.termDateInput = { nativeElement: { value: '' } } as any;
    });

    it('should mark effectiveDate as touched on blur', fakeAsync(() => {
      component.onEffDateBlur();
      tick(0);

      expect(component.form.get('effectiveDate')?.touched).toBeTrue();
    }));

    it('should mark terminationDate as touched on blur', fakeAsync(() => {
      component.onTermDateBlur();
      tick(0);

      expect(component.form.get('terminationDate')?.touched).toBeTrue();
    }));
  });

  describe('validateDateInput (via effectiveDate/terminationDate listeners)', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should set invalidDate error when input has value but control value is null', fakeAsync(() => {
      component.effDateInput = { nativeElement: { value: 'invalid-text' } } as any;

      component.form.get('effectiveDate')?.setValue(null, { emitEvent: true });
      tick(0);

      expect(component.form.get('effectiveDate')?.hasError('invalidDate')).toBeTrue();
    }));

    it('should clear invalidDate error when input is empty', fakeAsync(() => {
      component.effDateInput = { nativeElement: { value: '' } } as any;

      const control = component.form.get('effectiveDate');
      control?.setErrors({ invalidDate: true });
      control?.setValue(moment('2099-06-01'), { emitEvent: true });
      tick(0);

      expect(control?.hasError('invalidDate')).toBeFalse();
    }));

    it('should handle terminationDate input validation', fakeAsync(() => {
      component.termDateInput = { nativeElement: { value: 'bad-date' } } as any;

      component.form.get('terminationDate')?.setValue(null, { emitEvent: true });
      tick(0);

      expect(component.form.get('terminationDate')?.hasError('invalidDate')).toBeTrue();
    }));
  });

  describe('updateTerminationMinDate', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
      component.effDateInput = { nativeElement: { value: '' } } as any;
      component.termDateInput = { nativeElement: { value: '' } } as any;
    });

    it('should set terminationMinDate to effDate when effDate is after minDate', () => {
      const futureDate = moment().add(10, 'days');
      component.form.get('effectiveDate')?.setValue(futureDate);

      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(futureDate.format('YYYY-MM-DD'));
    });

    it('should set terminationMinDate to minDate when effDate is before minDate', () => {
      const pastDate = moment('2000-01-01');
      component.form.get('effectiveDate')?.setValue(pastDate);

      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
    });

    it('should set terminationMinDate to minDate when effDate is null', () => {
      component.form.get('effectiveDate')?.setValue(null);

      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
    });
  });

  describe('stageSequence listener', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should mark stageSequence as touched when value changes', () => {
      component.form.get('stageSequence')?.setValue(5);
      expect(component.form.get('stageSequence')?.touched).toBeTrue();
    });
  });

  describe('Load Process Codes on init', () => {
    it('should load process codes and set filteredProcessCodes', () => {
      component.mode = 'add';
      fixture.detectChanges();

      expect(processStagesServiceSpy.getProcessCodes).toHaveBeenCalled();
      expect(component.processCodes).toEqual(mockProcessCodes);
      expect(component.filteredProcessCodes).toEqual(mockProcessCodes);
      expect(component.isLoadingProcessCodes).toBeFalse();
    });

    it('should load stage codes and set filteredStageCodes', () => {
      component.mode = 'add';
      fixture.detectChanges();

      expect(processStagesServiceSpy.getStageCodes).toHaveBeenCalled();
      expect(component.stageCodes).toEqual(mockStageCodes);
      expect(component.filteredStageCodes).toEqual(mockStageCodes);
      expect(component.isLoadingStageCodes).toBeFalse();
    });
  });

  describe('Edit Mode - form state', () => {
    it('should disable processCode and stageCode in edit mode', () => {
      component.mode = 'edit';
      component.data = mockProcessStage;
      fixture.detectChanges();

      expect(component.form.get('processCode')?.disabled).toBeTrue();
      expect(component.form.get('stageCode')?.disabled).toBeTrue();
    });

    it('should enable processCode and stageCode in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();

      expect(component.form.get('processCode')?.enabled).toBeTrue();
      expect(component.form.get('stageCode')?.enabled).toBeTrue();
    });
  });

  describe('Form Initialization', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should create form with required validators on processCode', () => {
      const control = component.form.get('processCode');
      control?.setValue('');
      expect(control?.valid).toBeFalse();
    });

    it('should create form with required validators on stageCode', () => {
      const control = component.form.get('stageCode');
      control?.setValue('');
      expect(control?.valid).toBeFalse();
    });

    it('should create form with required validators on effectiveDate', () => {
      const control = component.form.get('effectiveDate');
      control?.setValue(null);
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should create form with optional terminationDate', () => {
      const control = component.form.get('terminationDate');
      control?.setValue(null);
      expect(control?.valid).toBeTrue();
    });

    it('should create form with optional stageSequence', () => {
      const control = component.form.get('stageSequence');
      expect(control?.value).toBeNull();
      expect(control?.valid).toBeTrue();
    });
  });

  describe('Process search filtering with null description', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
      component.processCodes = [
        { code: 'A', description: '' },
        { code: 'B', description: '' },
      ];
      component.stageCodes = [
        { code: 'X', description: '' },
        { code: 'Y', description: '' },
      ];
    });

    it('should handle process codes with empty description during search', () => {
      component.processSearchControl.setValue('A');
      expect(component.filteredProcessCodes.length).toBe(1);
    });

    it('should handle stage codes with empty description during search', () => {
      component.stageSearchControl.setValue('X');
      expect(component.filteredStageCodes.length).toBe(1);
    });
  });

  describe('Edit mode with termination date populated', () => {
    it('should store originalTerminationDate when data has termDate', () => {
      const stageWithTerm: ProcessStageDto = {
        ...mockProcessStage,
        termDate: '2099-12-31',
      };
      component.mode = 'edit';
      component.data = stageWithTerm;
      fixture.detectChanges();

      expect((component as any).originalTerminationDate).toBe(
        moment('2099-12-31').format('YYYY-MM-DD')
      );
    });

    it('should set originalTerminationDate to null when data has no termDate', () => {
      component.mode = 'edit';
      component.data = { ...mockProcessStage, termDate: null };
      fixture.detectChanges();

      expect((component as any).originalTerminationDate).toBeNull();
    });
  });

  describe('effDateInput/termDateInput not yet initialized', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should handle effDateBlur when effDateInput is undefined', fakeAsync(() => {
      (component as any).effDateInput = undefined;
      expect(() => {
        component.onEffDateBlur();
        tick(0);
      }).not.toThrow();
    }));

    it('should handle termDateBlur when termDateInput is undefined', fakeAsync(() => {
      (component as any).termDateInput = undefined;
      expect(() => {
        component.onTermDateBlur();
        tick(0);
      }).not.toThrow();
    }));
  });
});
