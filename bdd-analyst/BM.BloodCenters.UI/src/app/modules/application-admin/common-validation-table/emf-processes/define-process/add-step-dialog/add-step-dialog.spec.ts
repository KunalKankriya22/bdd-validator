import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { AddStepDialog, AddStepDialogData } from './add-step-dialog';

describe('AddStepDialog', () => {
  let component: AddStepDialog;
  let fixture: ComponentFixture<AddStepDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddStepDialog>>;

  const mockData: AddStepDialogData = {
    steps: [
      { id: '1', name: 'BLOOD_TYPE' },
      { id: '2', name: 'WEIGHT' },
      { id: '3', name: 'HEIGHT' }
    ],
    existingStepNames: ['BLOOD_TYPE'],
    processCode: 'PROC1'
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [AddStepDialog, ReactiveFormsModule, BrowserAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: mockDialogRef }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(AddStepDialog, {
      set: { imports: [ReactiveFormsModule], template: '<div></div>' }
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddStepDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should set filteredSteps from data', () => {
      expect(component.filteredSteps.length).toBe(3);
    });
  });

  describe('search filtering', () => {
    it('should filter steps by search term', fakeAsync(() => {
      component.searchControl.setValue('blood');
      tick();
      expect(component.filteredSteps.length).toBe(1);
      expect(component.filteredSteps[0].name).toBe('BLOOD_TYPE');
    }));

    it('should show all steps when search is empty', fakeAsync(() => {
      component.searchControl.setValue('blood');
      tick();
      component.searchControl.setValue('');
      tick();
      expect(component.filteredSteps.length).toBe(3);
    }));
  });

  describe('onSelectionChange', () => {
    it('should clear duplicateError', () => {
      component.duplicateError = 'some error';
      component.selectedStep = '2';
      component.onSelectionChange();
      expect(component.duplicateError).toBe('');
    });

    it('should set duplicateError when step name matches existing (case-insensitive)', () => {
      component.selectedStep = '1';
      component.onSelectionChange();
      expect(component.duplicateError).toContain('already exists');
    });

    it('should include processCode in error message', () => {
      component.selectedStep = '1';
      component.onSelectionChange();
      expect(component.duplicateError).toContain('PROC1');
    });

    it('should not set error when unique', () => {
      component.selectedStep = '2';
      component.onSelectionChange();
      expect(component.duplicateError).toBe('');
    });

    it('should return early when no selection', () => {
      component.selectedStep = '';
      component.onSelectionChange();
      expect(component.duplicateError).toBe('');
    });
  });

  describe('isAddDisabled', () => {
    it('should be true when no selection', () => {
      component.selectedStep = '';
      expect(component.isAddDisabled).toBe(true);
    });

    it('should be true when duplicateError exists', () => {
      component.selectedStep = '1';
      component.duplicateError = 'duplicate';
      expect(component.isAddDisabled).toBe(true);
    });

    it('should be false when valid selection with no duplicate', () => {
      component.selectedStep = '2';
      component.duplicateError = '';
      expect(component.isAddDisabled).toBe(false);
    });
  });

  describe('onCancel', () => {
    it('should close dialog without result', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('onAdd', () => {
    it('should close dialog with selected step data', () => {
      component.selectedStep = '2';
      component.duplicateError = '';
      component.onAdd();
      expect(mockDialogRef.close).toHaveBeenCalledWith({ id: '2', name: 'WEIGHT' });
    });

    it('should not close when duplicateError exists', () => {
      component.selectedStep = '1';
      component.duplicateError = 'duplicate';
      component.onAdd();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should not close when no selection', () => {
      component.selectedStep = '';
      component.onAdd();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });
});
