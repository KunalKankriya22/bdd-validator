import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { AddEditDriveChecklistComponent } from './add-edit-drive-checklist';
import { DefineDefaultDriveChecklistService } from '../services/define-default-drive-checklist.service';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';
import {
  DefineDefaultDriveChecklistModel,
  DriveChecklistAddDropdownLov
} from '../models/define-default-drive-checklist.model';

describe('AddEditDriveChecklistComponent', () => {
  let component: AddEditDriveChecklistComponent;
  let fixture: ComponentFixture<AddEditDriveChecklistComponent>;
  let mockService: jasmine.SpyObj<DefineDefaultDriveChecklistService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockDropdownData: DriveChecklistAddDropdownLov = {
    actionCodes: [
      { key: 'Book Venue', value: 'BOOK_VENUE' },
      { key: 'Send Notice', value: 'SEND_NOTICE' }
    ],
    timeline: [
      { key: 'Before Drive', value: 'BD' },
      { key: 'After Drive', value: 'AD' }
    ],
    nextSequence: 3
  };

  const mockEditData: DefineDefaultDriveChecklistModel = {
    sortSeq: 1,
    actionCode: 'BOOK_VENUE',
    actionDescription: 'Book Venue',
    targetDays: 30,
    timeFlag: 'BD',
    timeFlagDescription: 'Before Drive',
    chapterId: 'CH001'
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DefineDefaultDriveChecklistService', [
      'getDriveChecklistAddDropdowns',
      'addDriveChecklist',
      'updateDriveChecklist'
    ]);
    mockSnackBar = createMockMatSnackBar();

    mockService.getDriveChecklistAddDropdowns.and.returnValue(of(mockDropdownData));



      TestBed.configureTestingModule({
imports: [
        AddEditDriveChecklistComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: DefineDefaultDriveChecklistService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    });


    });



  beforeEach(() => {


      mockService.getDriveChecklistAddDropdowns.and.returnValue(of(mockDropdownData));


    fixture = TestBed.createComponent(AddEditDriveChecklistComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {


    it('should load dropdown data on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockService.getDriveChecklistAddDropdowns).toHaveBeenCalled();
      expect(component.actionCodeOptions.length).toBe(2);
      expect(component.timelineOptions.length).toBe(2);
      expect(component.nextSequence).toBe(3);
    }));


  });

  describe('Form Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should invalidate form when actionCode is empty', () => {
      component.form.patchValue({
        actionCode: '',
        actionDescription: 'Test',
        targetDays: 10,
        timeFlag: 'BD',
        sortSeq: 1
      });

      expect(component.form.valid).toBeFalse();
      expect(component.form.get('actionCode')?.hasError('required')).toBeTrue();
    });

    it('should invalidate form when targetDays is negative', () => {
      component.form.patchValue({
        actionCode: 'BOOK_VENUE',
        actionDescription: 'Book Venue',
        targetDays: -5,
        timeFlag: 'BD',
        sortSeq: 1
      });

      expect(component.form.valid).toBeFalse();
      expect(component.form.get('targetDays')?.hasError('min')).toBeTrue();
    });

    it('should validate form when all required fields are filled correctly', () => {
      component.form.patchValue({
        actionCode: 'BOOK_VENUE',
        actionDescription: 'Book Venue',
        targetDays: 30,
        timeFlag: 'BD',
        sortSeq: 1
      });

      expect(component.form.valid).toBeTrue();
    });
  });

  describe('Add Mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      component.chapterId = 'CH001';
      fixture.detectChanges();
      tick();
    }));

    it('should auto-populate action description when action is selected', fakeAsync(() => {
      component.form.patchValue({ actionCode: 'BOOK_VENUE' });
      tick();

      expect(component.form.get('actionDescription')?.value).toBe('Book Venue');
    }));

    it('should set sequence to next available number', fakeAsync(() => {
      tick();
      expect(component.form.get('sortSeq')?.value).toBe(3);
    }));

    it('should make actionCode field enabled in add mode', fakeAsync(() => {
      tick();
      expect(component.form.get('actionCode')?.disabled).toBeFalse();
    }));

    it('should make actionDescription field enabled in add mode', fakeAsync(() => {
      tick();
      expect(component.form.get('actionDescription')?.disabled).toBeFalse();
    }));

    it('should call addDriveChecklist on save', fakeAsync(() => {
      mockService.addDriveChecklist.and.returnValue(of({ success: true, statusCode: 200, message: 'Added successfully', data: [], total: 0, error: null }));

      component.form.patchValue({
        actionCode: 'BOOK_VENUE',
        actionDescription: 'Book Venue',
        targetDays: 30,
        timeFlag: 'BD',
        sortSeq: 3
      });

      component.onSave();
      tick();

      expect(mockService.addDriveChecklist).toHaveBeenCalledWith(jasmine.objectContaining({
        actionCode: 'BOOK_VENUE',
        targetDays: 30,
        timeFlag: 'BD',
        chapterId: 'CH001'
      }));
    }));

    it('should emit saveSuccess and close panel on successful save', fakeAsync(() => {
      mockService.addDriveChecklist.and.returnValue(of({ success: true, statusCode: 200, message: 'Added successfully', data: [], total: 0, error: null }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        actionCode: 'BOOK_VENUE',
        actionDescription: 'Book Venue',
        targetDays: 30,
        timeFlag: 'BD',
        sortSeq: 3
      });

      component.onSave();
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));

  });

  describe('Edit Mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.chapterId = 'CH001';
      fixture.detectChanges();
      tick();
    }));




    it('should call updateDriveChecklist on save', fakeAsync(() => {
      mockService.updateDriveChecklist.and.returnValue(of({ success: true, statusCode: 200, message: 'Updated successfully', data: [], total: 0, error: null }));

      component.form.patchValue({ targetDays: 45 });
      component.onSave();
      tick();

      expect(mockService.updateDriveChecklist).toHaveBeenCalledWith(jasmine.objectContaining({
        originalActionCode: 'BOOK_VENUE',
        chapterId: 'CH001',
        targetDays: 45,
        timeFlag: 'BD'
      }));
    }));

    it('should emit saveSuccess and close panel on successful update', fakeAsync(() => {
      mockService.updateDriveChecklist.and.returnValue(of({ success: true, statusCode: 200, message: 'Updated successfully', data: [], total: 0, error: null }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));

    it('should not show save and create another button in edit mode', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).not.toContain('ADD AND CREATE ANOTHER');
    });
  });


  describe('Error Handling', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      component.chapterId = 'CH001';
      fixture.detectChanges();
      tick();
    }));

    it('should display action error message', () => {
      component.form.get('actionCode')?.markAsTouched();
      component.form.get('actionCode')?.setValue('');
      fixture.detectChanges();

      expect(component.getActionError()).toBe('Action is required');
    });

    it('should display description error message', () => {
      component.form.get('actionDescription')?.markAsTouched();
      component.form.get('actionDescription')?.setValue('');
      fixture.detectChanges();

      expect(component.getDescriptionError()).toBe('Description is required');
    });

    it('should display no of days required error', () => {
      component.form.get('targetDays')?.markAsTouched();
      component.form.get('targetDays')?.setValue(null);
      fixture.detectChanges();

      expect(component.getNoOfDaysError()).toBe('No. of Days is required');
    });

    it('should display no of days minimum error', () => {
      component.form.get('targetDays')?.markAsTouched();
      component.form.get('targetDays')?.setValue(-1);
      fixture.detectChanges();

      expect(component.getNoOfDaysError()).toBe('No. of Days must be 0 or greater');
    });

    it('should display timeline error message', () => {
      component.form.get('timeFlag')?.markAsTouched();
      component.form.get('timeFlag')?.setValue('');
      fixture.detectChanges();

      expect(component.getTimelineError()).toBe('Timeline is required');
    });
  });


  describe('OnChanges Lifecycle', () => {
    it('should reload data when mode changes from add to edit', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: 'add',
          firstChange: false,
          isFirstChange: () => false
        }
      });
      tick();

      expect(component.form.get('actionCode')?.value).toBe('BOOK_VENUE');
    }));

    it('should reload data when data input changes', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();

      const newData = { ...mockEditData, targetDays: 60 };
      component.data = newData;
      component.ngOnChanges({
        data: {
          currentValue: newData,
          previousValue: mockEditData,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      tick();

      expect(component.form.get('targetDays')?.value).toBe(60);
    }));
  });
});
