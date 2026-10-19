import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { signal } from '@angular/core';
import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';
import { AddEditResourceDialog, ResourceDialogData } from './add-edit-resource-dialog';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditResourceDialog', () => {
  let component: AddEditResourceDialog;
  let fixture: ComponentFixture<AddEditResourceDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddEditResourceDialog>>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const today = moment();
  const todayStr = today.format('YYYY-MM-DD');

  const addModeData: ResourceDialogData = {
    mode: 'add',
    code: 'Q001'
  };

  const editModeData: ResourceDialogData = {
    mode: 'edit',
    code: 'Q001',
    locationLink: 'http://example.com/resource',
    description: 'Existing Resource',
    effectiveDate: todayStr,
    terminationDate: null
  };

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    headerServiceSpy = createMockHeaderService();

    TestBed.configureTestingModule({
      imports: [AddEditResourceDialog, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: addModeData },
        { provide: HeaderService, useValue: headerServiceSpy }
      ],
});
  });

  function createComponent(dialogData: ResourceDialogData): void {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: dialogData });

    fixture = TestBed.createComponent(AddEditResourceDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    dialogRefSpy.close.calls.reset();
  });

  describe('Add Mode', () => {
    beforeEach(() => createComponent(addModeData));




    it('should require locationLink', () => {
      const control = component.form.get('locationLink');
      control?.setValue('');
      control?.markAsTouched();
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require description', () => {
      const control = component.form.get('description');
      control?.setValue('');
      control?.markAsTouched();
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require effectiveDate', () => {
      const control = component.form.get('effectiveDate');
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should not require terminationDate', () => {
      const control = component.form.get('terminationDate');
      expect(control?.hasError('required')).toBeFalsy();
    });




    it('should return location link error when touched and empty', () => {
      component.form.get('locationLink')?.markAsTouched();
      expect(component.getLocationLinkError()).toContain('Location Link is required');
    });

    it('should return description error when touched and empty', () => {
      component.form.get('description')?.markAsTouched();
      expect(component.getDescriptionError()).toContain('Description is required');
    });

  });

  describe('Edit Mode', () => {
    beforeEach(() => createComponent(editModeData));






    it('should include currentCode and currentLocationLink in save result', () => {
      component.form.get('description')?.setValue('Changed');
      component.onSave();

      expect(dialogRefSpy.close).toHaveBeenCalledWith(jasmine.objectContaining({
        mode: 'edit',
        currentCode: 'Q001',
        currentLocationLink: 'http://example.com/resource'
      }));
    });
  });

  describe('Date Display', () => {
    beforeEach(() => createComponent(addModeData));


    it('should return formatted date when effective date is set', () => {
      component.form.get('effectiveDate')?.setValue(moment('2026-01-15'));
      const display = component.getEffectiveDateDisplay();
      expect(display).toBe('15-JAN-2026');
    });
  });

});
