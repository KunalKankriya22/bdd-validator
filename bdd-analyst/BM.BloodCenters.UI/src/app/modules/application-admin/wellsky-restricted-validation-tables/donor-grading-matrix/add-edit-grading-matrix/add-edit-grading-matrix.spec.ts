import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AddEditGradingMatrix } from './add-edit-grading-matrix';
import { DonorGradingMatrixService } from '../services/donor-grading-matrix.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';
import { SimpleChange } from '@angular/core';
import { DonorGradingMatrix } from '../models/donor-grading-matrix.model';

describe('AddEditGradingMatrix', () => {
  let component: AddEditGradingMatrix;
  let fixture: ComponentFixture<AddEditGradingMatrix>;
  let mockService: jasmine.SpyObj<DonorGradingMatrixService>;

  const mockEditData: DonorGradingMatrix = {
    dgmId: 1,
    lastnameMatch: 'SAME',
    firstnameMatch: 'SIMM',
    dobMatch: 'SAME',
    genderMatch: 'M',
    grade: 1
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DonorGradingMatrixService', [
      'addDonorGradingMatrix',
      'updateDonorGradingMatrix'
    ]);
    mockService.addDonorGradingMatrix.and.returnValue(of({ success: true, message: 'Created' }));
    mockService.updateDonorGradingMatrix.and.returnValue(of({ success: true, message: 'Updated' }));



      TestBed.configureTestingModule({
      imports: [AddEditGradingMatrix],
      providers: [
        provideAnimationsAsync(),
        { provide: DonorGradingMatrixService, useValue: mockService }
      ]
    });


    


      mockService.addDonorGradingMatrix.calls.reset();


      mockService.updateDonorGradingMatrix.calls.reset();


      mockService.addDonorGradingMatrix.and.returnValue(of({ success: true, message: 'Created' }));


      mockService.updateDonorGradingMatrix.and.returnValue(of({ success: true, message: 'Updated' }));


    fixture = TestBed.createComponent(AddEditGradingMatrix);
    component = fixture.componentInstance;


    });


  it('should default to add mode', () => {
    expect(component.mode).toBe('add');
  });

  it('should have all form controls', () => {
    fixture.detectChanges();
    expect(component.form.get('lastnameMatch')).toBeDefined();
    expect(component.form.get('firstnameMatch')).toBeDefined();
    expect(component.form.get('dobMatch')).toBeDefined();
    expect(component.form.get('genderMatch')).toBeDefined();
    expect(component.form.get('grade')).toBeDefined();
  });



  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
    });



    it('should have empty last updated', () => {
      expect(component.lastUpdated).toBe('');
    });



    it('should store dgmId in editModeValues', () => {
      expect(component.editModeValues.dgmId).toBe(1);
    });

    it('should mark form as pristine', () => {
      expect(component.form.pristine).toBe(true);
    });
  });
  describe('onSave - Add', () => {
    beforeEach(() => { fixture.detectChanges(); });



    it('should call add service when valid', fakeAsync(() => {
      component.form.patchValue({
        lastnameMatch: 'SAME', firstnameMatch: 'DIFF', dobMatch: 'SAME', genderMatch: 'F', grade: 2
      });
      component.onSave();
      tick();
      expect(mockService.addDonorGradingMatrix).toHaveBeenCalledWith(jasmine.objectContaining({
        lastnameMatch: 'SAME', grade: 2
      }));
    }));

    it('should emit saveSuccess and closePanel on success', fakeAsync(() => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');
      component.form.patchValue({
        lastnameMatch: 'SAME', firstnameMatch: 'SAME', dobMatch: 'SAME', genderMatch: 'M', grade: 1
      });
      component.onSave();
      tick();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));
  });

  describe('onSave - Edit', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
    });

    it('should call update with dgmId', fakeAsync(() => {
      component.form.patchValue({ grade: 3 });
      component.form.markAsDirty();
      component.onSave();
      tick();
      expect(mockService.updateDonorGradingMatrix).toHaveBeenCalledWith(1, jasmine.objectContaining({ grade: 3 }));
    }));
  });

  describe('onSaveAndCreateAnother', () => {
    beforeEach(() => { fixture.detectChanges(); });



    it('should switch to add mode from edit', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      component['setupPanel']();
      spyOn(component.modeChange, 'emit');
      component.form.patchValue({ grade: 5 });
      component.form.markAsDirty();
      component.onSaveAndCreateAnother();
      tick();
      expect(component.mode).toBe('add');
      expect(component.modeChange.emit).toHaveBeenCalledWith('add');
    }));
  });

  describe('Error handling', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should handle 409 duplicate', fakeAsync(() => {
      mockService.addDonorGradingMatrix.and.returnValue(throwError(() => ({
        status: 409, error: { message: 'Duplicate' }
      })));
      component.form.patchValue({
        lastnameMatch: 'SAME', firstnameMatch: 'SAME', dobMatch: 'SAME', genderMatch: 'M', grade: 1
      });
      component.onSave();
      tick();
      expect(component.isSaving).toBe(false);
    }));
  });

  describe('isFormActionDisabled', () => {
    beforeEach(() => { fixture.detectChanges(); });





    it('should be true in edit mode when not dirty', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      component['setupPanel']();
      expect(component.isFormActionDisabled).toBe(true);
    });

    it('should be false in edit mode when valid and dirty', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      component.form.get('grade')?.setValue(5);
      Object.keys(component.form.controls).forEach(key => {
        const control = component.form.get(key);
        if (control?.errors) control.setErrors(null);
      });
      component.form.markAsDirty();
      component.form.updateValueAndValidity();
      expect(component.isFormActionDisabled).toBe(false);
    });
  });

  describe('getFieldError', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should return empty when not touched', () => {
      expect(component.getFieldError('lastnameMatch', 'Last Name')).toBe('');
    });

    it('should return required error', () => {
      component.form.get('lastnameMatch')?.markAsTouched();
      expect(component.getFieldError('lastnameMatch', 'Last Name')).toBe('Last Name is required');
    });
  });


});
