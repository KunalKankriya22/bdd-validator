import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { SnackbarService } from '@shared/services/snackbar.service';

import { AddEditHtfMapping } from './add-edit-htf-mapping';
import { HtfMappingService } from '../services/htf-mapping.service';
import { HtfMappingDto } from '../models/htf-mapping.model';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('AddEditHtfMapping', () => {
  let component: AddEditHtfMapping;
  let fixture: ComponentFixture<AddEditHtfMapping>;
  let mockService: jasmine.SpyObj<HtfMappingService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;

  const mockRecord: HtfMappingDto = {
    sequenceNo: 1,
    headerName: 'HBSAG',
    testDesc: 'Hepatitis B Surface Antigen',
    startPos: 15,
    endPos: 18,
    modifiedUser: 'admin',
    modifiedDate: '2025-01-01',
  };

  const mockTestIds = [
    { testId: 'HBSAG', testDesc: 'Hepatitis B Surface Antigen' },
    { testId: 'HIV-1/2', testDesc: 'HIV Antibody' },
    { testId: 'HBC', testDesc: 'Hepatitis B Core' },
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('HtfMappingService', [
      'getAll',
      'create',
      'update',
      'delete',
      'getTestIdsDropdown',
      'getNextSequenceNo',
    ]);
    mockService.getTestIdsDropdown.and.returnValue(of(mockTestIds));
    mockService.getNextSequenceNo.and.returnValue(of(10));

    mockSnackbarService = createMockSnackbarService();



      TestBed.configureTestingModule({
imports: [
        AddEditHtfMapping,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HtfMappingService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbarService },
      ],
    });


    });



  beforeEach(() => {


      mockService.getAll.calls.reset();


      mockService.create.calls.reset();


      mockService.update.calls.reset();


      mockService.delete.calls.reset();


      mockService.getTestIdsDropdown.calls.reset();


      mockService.getNextSequenceNo.calls.reset();


      mockService.getTestIdsDropdown.and.returnValue(of(mockTestIds));


      mockService.getNextSequenceNo.and.returnValue(of(10));


    fixture = TestBed.createComponent(AddEditHtfMapping);
    component = fixture.componentInstance;


    });

  describe('Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.totalRecords = 9;
      fixture.detectChanges();
    });


    it('should fetch sequence from API', () => {
      expect(mockService.getNextSequenceNo).toHaveBeenCalled();
      expect(component.sequenceDisplay).toBe('10');
    });

    it('should load test ID dropdown options', () => {
      expect(mockService.getTestIdsDropdown).toHaveBeenCalled();
      expect(component.testIdOptions.length).toBe(3);
    });


    it('should require headerName', () => {
      component.form.get('headerName')?.markAsTouched();
      expect(component.getHeaderNameError()).toBe('Test ID is required');
    });

    it('should require startPos', () => {
      component.form.get('startPos')?.markAsTouched();
      expect(component.getStartPosError()).toBe('Start Position is required');
    });

    it('should require endPos', () => {
      component.form.get('endPos')?.markAsTouched();
      expect(component.getEndPosError()).toBe('End Position is required');
    });



    it('should show cross-field error when start equals end', () => {
      component.form.patchValue({ startPos: 15, endPos: 15 });
      component.form.get('startPos')?.markAsTouched();
      component['lastChangedPositionField'] = 'startPos';

      expect(component.getStartPosError()).toBe('Start Position must be less than End Position');
    });



    it('should call create on save', fakeAsync(() => {
      mockService.create.and.returnValue(of({ success: true, message: 'Created' } as any));

      component.form.patchValue({ headerName: 'HBC', startPos: 23, endPos: 25 });
      component.onSave();
      tick();

      expect(mockService.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          sequenceNo: 10,
          headerName: 'HBC',
          startPos: 23,
          endPos: 25,
        })
      );
    }));

    it('should emit saveSuccess and closePanel on successful create', fakeAsync(() => {
      mockService.create.and.returnValue(of({ success: true, message: 'Created' } as any));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({ headerName: 'HBC', startPos: 23, endPos: 25 });
      component.onSave();
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));




    it('should reset form on save and create another', fakeAsync(() => {
      mockService.create.and.returnValue(of({ success: true, message: 'Created' } as any));
      mockService.getNextSequenceNo.and.returnValue(of(11));

      component.form.patchValue({ headerName: 'HBC', startPos: 23, endPos: 25 });
      component.onSaveAndCreateAnother();
      tick();

      expect(component.form.get('headerName')?.value).toBeFalsy();
      expect(mockService.getNextSequenceNo).toHaveBeenCalled();
      expect(component.sequenceDisplay).toBe('11');
    }));
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = { ...mockRecord };
      component.totalRecords = 9;
      fixture.detectChanges();
    });


    it('should display sequence from data', () => {
      expect(component.sequenceDisplay).toBe('1');
    });

    it('should keep headerName editable in edit mode', () => {
      expect(component.form.get('headerName')?.enabled).toBeTrue();
      expect(component.form.get('headerName')?.value).toBe('HBSAG');
    });


    it('should call update on save', fakeAsync(() => {
      mockService.update.and.returnValue(of({ success: true, message: 'Updated' } as any));

      component.form.get('startPos')?.setValue(10);
      component.onSave();
      tick();

      expect(mockService.update).toHaveBeenCalledWith(
        1,
        jasmine.objectContaining({ startPos: 10, endPos: 18 })
      );
    }));

    it('should emit saveSuccess and closePanel on successful update', fakeAsync(() => {
      mockService.update.and.returnValue(of({ success: true, message: 'Updated' } as any));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));
  });
  describe('Input Validation', () => {






    it('should reject standalone minus in startPos on save', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.form.patchValue({ headerName: 'HBC', startPos: '-', endPos: 10 });
      component.onSave();

      expect(component.form.get('startPos')?.hasError('integer')).toBeTrue();
      expect(mockService.create).not.toHaveBeenCalled();
    });

    it('should reject standalone minus in endPos on save', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.form.patchValue({ headerName: 'HBC', startPos: 5, endPos: '-' });
      component.onSave();

      expect(component.form.get('endPos')?.hasError('integer')).toBeTrue();
      expect(mockService.create).not.toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should emit closePanel', () => {
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should complete destroy$ subject', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('isFormValid', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return false when form is invalid', () => {
      expect(component.isFormValid).toBe(false);
    });

    it('should return true when form is valid', () => {
      component.form.patchValue({ headerName: 'TEST', startPos: 1, endPos: 5 });
      expect(component.isFormValid).toBe(true);
    });
  });

  describe('onTestIdDropdownClosed', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should reset search and show all options', () => {
      component.testIdSearchControl.setValue('HBC');
      component.onTestIdDropdownClosed();
      expect(component.testIdSearchControl.value).toBe('');
      expect(component.filteredTestIdOptions.length).toBe(3);
    });
  });

  describe('onlyNumbersWithMinus', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should allow digits', () => {
      const event = new KeyboardEvent('keydown', { key: '5' });
      spyOn(event, 'preventDefault');
      component.onlyNumbersWithMinus(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow minus', () => {
      const event = new KeyboardEvent('keydown', { key: '-' });
      spyOn(event, 'preventDefault');
      component.onlyNumbersWithMinus(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent letters', () => {
      const event = new KeyboardEvent('keydown', { key: 'a' });
      spyOn(event, 'preventDefault');
      component.onlyNumbersWithMinus(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('onPasteNumbersWithMinus', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should allow valid integer paste', () => {
      const event = { clipboardData: { getData: () => '-123' }, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onPasteNumbersWithMinus(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent invalid paste', () => {
      const event = { clipboardData: { getData: () => 'abc' }, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onPasteNumbersWithMinus(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Error State Matchers', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('startPosErrorMatcher should return false for null control', () => {
      expect(component.startPosErrorMatcher.isErrorState(null, null as any)).toBe(false);
    });

    it('startPosErrorMatcher should return true when cross-field error and lastChanged is startPos', () => {
      component.form.patchValue({ headerName: 'TEST', startPos: 10, endPos: 5 });
      const control = component.form.get('startPos') as any;
      control.markAsTouched();
      component['lastChangedPositionField'] = 'startPos';
      expect(component.startPosErrorMatcher.isErrorState(control, null as any)).toBe(true);
    });

    it('endPosErrorMatcher should return false for null control', () => {
      expect(component.endPosErrorMatcher.isErrorState(null, null as any)).toBe(false);
    });

    it('endPosErrorMatcher should return true when cross-field error and lastChanged is endPos', () => {
      component.form.patchValue({ headerName: 'TEST', startPos: 10, endPos: 5 });
      const control = component.form.get('endPos') as any;
      control.markAsTouched();
      component['lastChangedPositionField'] = 'endPos';
      expect(component.endPosErrorMatcher.isErrorState(control, null as any)).toBe(true);
    });
  });

  describe('Error messages', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('getHeaderNameError should return empty when not touched', () => {
      expect(component.getHeaderNameError()).toBe('');
    });

    it('getStartPosError should return empty when not touched', () => {
      expect(component.getStartPosError()).toBe('');
    });

    it('getEndPosError should return empty when not touched', () => {
      expect(component.getEndPosError()).toBe('');
    });

    it('getEndPosError should return cross-field error when endPos is lastChanged', () => {
      component.form.patchValue({ startPos: 10, endPos: 5 });
      component.form.get('endPos')?.markAsTouched();
      component['lastChangedPositionField'] = 'endPos';
      expect(component.getEndPosError()).toBe('End Position must be greater than Start Position');
    });

    it('getStartPosError should return integer error', () => {
      component.form.get('startPos')?.markAsTouched();
      component.form.get('startPos')?.setErrors({ integer: true });
      expect(component.getStartPosError()).toBe('Start Position is invalid');
    });

    it('getEndPosError should return integer error', () => {
      component.form.get('endPos')?.markAsTouched();
      component.form.get('endPos')?.setErrors({ integer: true });
      expect(component.getEndPosError()).toBe('End Position is invalid');
    });
  });

  describe('API error handling', () => {
    it('should handle getNextSequenceNo error', () => {
      mockService.getNextSequenceNo.and.returnValue(throwError(() => new Error('fail')));
      component.mode = 'add';
      component.totalRecords = 5;
      fixture.detectChanges();

      expect(component.sequenceDisplay).toBe('6');
    });

    it('should handle getTestIdsDropdown error', () => {
      mockService.getTestIdsDropdown.and.returnValue(throwError(() => new Error('fail')));
      component.mode = 'add';
      fixture.detectChanges();

      expect(component.testIdOptions).toEqual([]);
      expect(component.filteredTestIdOptions).toEqual([]);
    });

    it('should handle create error', fakeAsync(() => {
      mockService.create.and.returnValue(throwError(() => new Error('fail')));
      component.mode = 'add';
      fixture.detectChanges();

      component.form.patchValue({ headerName: 'HBC', startPos: 1, endPos: 5 });
      component.onSave();
      tick();

      expect(component.isSaving).toBe(false);
    }));

    it('should handle update error', fakeAsync(() => {
      mockService.update.and.returnValue(throwError(() => new Error('fail')));
      component.mode = 'edit';
      component.data = { ...mockRecord };
      fixture.detectChanges();

      component.onSave();
      tick();

      expect(component.isSaving).toBe(false);
    }));

    it('should handle saveAndCreateAnother error', fakeAsync(() => {
      mockService.create.and.returnValue(throwError(() => new Error('fail')));
      component.mode = 'add';
      fixture.detectChanges();

      component.form.patchValue({ headerName: 'HBC', startPos: 1, endPos: 5 });
      component.onSaveAndCreateAnother();
      tick();

      expect(component.isSaving).toBe(false);
    }));
  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should re-setup panel on non-first mode change', () => {
      component.mode = 'edit';
      component.data = { ...mockRecord };
      component.ngOnChanges({
        mode: {
          previousValue: 'add',
          currentValue: 'edit',
          firstChange: false,
          isFirstChange: () => false
        },
        data: {
          previousValue: null,
          currentValue: mockRecord,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      expect(component.panelTitle).toBe('Edit Test Mapping');
    });

    it('should not re-setup on first change', () => {
      const titleBefore = component.panelTitle;
      component.ngOnChanges({
        mode: {
          previousValue: undefined,
          currentValue: 'add',
          firstChange: true,
          isFirstChange: () => true
        }
      });
      expect(component.panelTitle).toBe(titleBefore);
    });
  });

  describe('Test ID search', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should filter test IDs by testId', () => {
      component.testIdSearchControl.setValue('hbc');
      expect(component.filteredTestIdOptions.length).toBe(1);
      expect(component.filteredTestIdOptions[0].testId).toBe('HBC');
    });

    it('should filter test IDs by description', () => {
      component.testIdSearchControl.setValue('hepatitis');
      expect(component.filteredTestIdOptions.length).toBe(2);
    });

    it('should show all when search is cleared', () => {
      component.testIdSearchControl.setValue('hbc');
      component.testIdSearchControl.setValue('');
      expect(component.filteredTestIdOptions.length).toBe(3);
    });
  });

  describe('Position cross-validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should set lastChangedPositionField to startPos on startPos change', fakeAsync(() => {
      component.form.get('startPos')?.setValue(5);
      tick();
      expect(component['lastChangedPositionField']).toBe('startPos');
    }));

    it('should set lastChangedPositionField to endPos on endPos change', fakeAsync(() => {
      component.form.get('endPos')?.setValue(10);
      tick();
      expect(component['lastChangedPositionField']).toBe('endPos');
    }));
  });

  describe('onSave cross-field default', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should set lastChangedPositionField to startPos when error and no field changed', () => {
      component.form.patchValue({ headerName: 'TEST', startPos: 10, endPos: 5 });
      component['lastChangedPositionField'] = null;
      component.onSave();
      expect(component['lastChangedPositionField']).toBe('startPos');
    });
  });

  describe('onSaveAndCreateAnother validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should not save when form is invalid', () => {
      component.form.patchValue({ headerName: '', startPos: null, endPos: null });
      component.onSaveAndCreateAnother();
      expect(mockService.create).not.toHaveBeenCalled();
    });

    it('should set lastChangedPositionField default for cross-field error', () => {
      component.form.patchValue({ headerName: 'TEST', startPos: 10, endPos: 5 });
      component['lastChangedPositionField'] = null;
      component.onSaveAndCreateAnother();
      expect(component['lastChangedPositionField']).toBe('startPos');
    });
  });

  describe('startLessThanEndValidator', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return null when start is less than end', () => {
      component.form.patchValue({ startPos: 1, endPos: 5 });
      expect(component.form.hasError('startNotLessThanEnd')).toBe(false);
    });

    it('should return error when start equals end', () => {
      component.form.patchValue({ startPos: 5, endPos: 5 });
      expect(component.form.hasError('startNotLessThanEnd')).toBe(true);
    });

    it('should return error when start > end', () => {
      component.form.patchValue({ startPos: 10, endPos: 5 });
      expect(component.form.hasError('startNotLessThanEnd')).toBe(true);
    });

    it('should return null when start or end is empty', () => {
      component.form.patchValue({ startPos: null, endPos: 5 });
      expect(component.form.hasError('startNotLessThanEnd')).toBe(false);
    });
  });
});
