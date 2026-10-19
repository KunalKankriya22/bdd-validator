import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { AddEditZipDialog, AddEditZipDialogData } from './add-edit-zip-dialog';
import { CityStateZipQueryService } from '../../services/city-state-zip-query.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditZipDialog', () => {
  let component: AddEditZipDialog;
  let fixture: ComponentFixture<AddEditZipDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddEditZipDialog>>;
  let serviceSpy: jasmine.SpyObj<CityStateZipQueryService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const addModeData: AddEditZipDialogData = { mode: 'add' };

  function createComponent(data: AddEditZipDialogData): void {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: data });
    fixture = TestBed.createComponent(AddEditZipDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    serviceSpy = jasmine.createSpyObj('CityStateZipQueryService', [
      'getStates',
      'getCities',
      'getCounties',
      'create',
      'update',
    ]);
    serviceSpy.getStates.and.returnValue(of([]));
    serviceSpy.getCities.and.returnValue(of([]));
    serviceSpy.getCounties.and.returnValue(of([]));
    serviceSpy.create.and.returnValue(of({}));
    serviceSpy.update.and.returnValue(of({}));

    headerServiceSpy = createMockHeaderService();

    await TestBed.configureTestingModule({
      imports: [AddEditZipDialog, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: addModeData },
        { provide: CityStateZipQueryService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
      ],
    }).compileComponents();
  });

  describe('Add Mode', () => {
    beforeEach(() => {
      createComponent({ mode: 'add' });
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should set dialog title to "Add New Zip Code"', () => {
      expect(component.dialogTitle).toBe('Add New Zip Code');
    });

    it('should initialize form with empty values', () => {
      expect(component.form.get('state')?.value).toBe('');
      expect(component.form.get('zip')?.value).toBe('');
    });

    it('should require state, city, zip, county, and effectiveDate', () => {
      component.form.markAllAsTouched();
      expect(component.form.get('state')?.hasError('required')).toBeTrue();
      expect(component.form.get('city')?.hasError('required')).toBeTrue();
      expect(component.form.get('zip')?.hasError('required')).toBeTrue();
      expect(component.form.get('county')?.hasError('required')).toBeTrue();
      expect(component.form.get('effectiveDate')?.hasError('required')).toBeTrue();
    });

    it('should validate zip code must be exactly 5 digits', () => {
      component.form.get('zip')?.setValue('123');
      expect(component.form.get('zip')?.hasError('pattern')).toBeTrue();
      component.form.get('zip')?.setValue('12345');
      expect(component.form.get('zip')?.hasError('pattern')).toBeFalse();
    });

    it('should close dialog with success false on cancel', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith({ success: false });
    });

    it('should not submit when form is invalid', () => {
      component.onSubmit();
      expect(serviceSpy.create).not.toHaveBeenCalled();
    });

    it('should call create and close on valid submit', fakeAsync(() => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      component.form.patchValue({
        state: 'TX',
        city: 'Dallas',
        zip: '75201',
        county: 'Dallas',
        effectiveDate: futureDate,
      });
      component.onSubmit();
      tick();
      expect(serviceSpy.create).toHaveBeenCalled();
      expect(dialogRefSpy.close).toHaveBeenCalledWith({ success: true });
    }));

    it('should handle create error', fakeAsync(() => {
      serviceSpy.create.and.returnValue(throwError(() => ({ error: { message: 'Duplicate' } })));
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      component.form.patchValue({
        state: 'TX',
        city: 'Dallas',
        zip: '75201',
        county: 'Dallas',
        effectiveDate: futureDate,
      });
      component.onSubmit();
      tick();
      expect(component.isSaving).toBeFalse();
      expect(component.form.hasError('serverError')).toBeTrue();
    }));
  });

  describe('Edit Mode', () => {
    const editData: AddEditZipDialogData = {
      mode: 'edit',
      record: {
        uspsId: 'USPS001',
        state: 'TX',
        city: 'Dallas',
        zip: '75201',
        county: 'Dallas',
        commonlyUsedFlag: 'Y',
        effectiveDate: '2025-01-01',
        terminationDate: null,
      } as any,
    };

    beforeEach(() => {
      createComponent(editData);
    });

    it('should set dialog title to "Edit Zip Code"', () => {
      expect(component.dialogTitle).toBe('Edit Zip Code');
    });

    it('should populate form with record data', () => {
      expect(component.form.get('state')?.value).toBe('TX');
      expect(component.form.get('city')?.value).toBe('Dallas');
      expect(component.form.get('zip')?.value).toBe('75201');
    });

    it('should call update on valid submit in edit mode', fakeAsync(() => {
      component.onSubmit();
      tick();
      expect(serviceSpy.update).toHaveBeenCalledWith('USPS001', jasmine.any(Object));
      expect(dialogRefSpy.close).toHaveBeenCalledWith({ success: true });
    }));
  });
});
