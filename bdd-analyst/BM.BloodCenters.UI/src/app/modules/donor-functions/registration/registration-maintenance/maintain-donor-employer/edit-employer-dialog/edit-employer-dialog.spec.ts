import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';

import { EditEmployerDialog } from './edit-employer-dialog';
import { DonorEmployerService } from '../services/donor-employer.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('EditEmployerDialog', () => {
  let component: EditEmployerDialog;
  let fixture: ComponentFixture<EditEmployerDialog>;
  let employerServiceSpy: jasmine.SpyObj<DonorEmployerService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  const mockEmployer = {
    employerId: 'EMP001',
    employerName: 'Test Employer Inc',
    effDate: '2026-01-01',
    termDate: null,
    uspsId: 'USPS01',
    city: 'Dallas',
    zip: '75201',
    intlAddrFlag: 'N',
    intlCity: null,
    intlState: null,
    intlPostalCode: null,
    intlCountryName: null,
    address: '123 Main St, Dallas TX',
    internationalAddress: null,
  } as any;

  beforeEach(async () => {
    employerServiceSpy = jasmine.createSpyObj('DonorEmployerService', ['update']);
    employerServiceSpy.update.and.returnValue(of({}));
    headerServiceSpy = createMockHeaderService();
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [EditEmployerDialog, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DonorEmployerService, useValue: employerServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditEmployerDialog);
    component = fixture.componentInstance;
    component.employer = mockEmployer;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with employer date data', () => {
    expect(component.form).toBeTruthy();
    expect(component.form.get('effDate')).toBeTruthy();
    expect(component.form.get('termDate')).toBeTruthy();
    // Employer name is read-only from the input, not a form control
    expect(component.employer?.employerName).toBe('Test Employer Inc');
  });

  it('should have effDate control in the form', () => {
    const effDateCtrl = component.form.get('effDate');
    expect(effDateCtrl).toBeTruthy();
    expect(effDateCtrl?.value).toBeTruthy();
  });

  it('should have termDate control in the form', () => {
    const termDateCtrl = component.form.get('termDate');
    expect(termDateCtrl).toBeTruthy();
  });

  it('should display address from employer data', () => {
    expect(component.displayAddress).toBe('123 Main St, Dallas TX');
  });

  it('should display international address when intlAddrFlag is Y', () => {
    component.employer = { ...mockEmployer, intlAddrFlag: 'Y', internationalAddress: '99 Intl Blvd' } as any;
    expect(component.displayAddress).toBe('99 Intl Blvd');
  });

  it('should emit save event on successful submit', fakeAsync(() => {
    spyOn(component.save, 'emit');
    component.form.get('employerName')?.setValue('Updated Employer');
    component.form.markAsDirty();
    component.onSubmit();
    tick();
    expect(employerServiceSpy.update).toHaveBeenCalled();
    expect(component.save.emit).toHaveBeenCalledWith(jasmine.objectContaining({ message: jasmine.any(String) }));
  }));

  it('should not submit when form is invalid', () => {
    // Make form invalid by setting a form-level error
    component.form.setErrors({ dateRangeInvalid: true });
    component.onSubmit();
    expect(employerServiceSpy.update).not.toHaveBeenCalled();
  });

  it('should emit close event on cancel', () => {
    spyOn(component.close, 'emit');
    component.onCancel();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should handle update error and show snackbar', fakeAsync(() => {
    employerServiceSpy.update.and.returnValue(throwError(() => ({ error: { message: 'Update failed' } })));
    const openSpy = spyOn((component as any)['snackBar'], 'open');
    component.form.get('employerName')?.setValue('Changed Name');
    component.form.markAsDirty();
    component.onSubmit();
    tick();
    expect(component.isSaving).toBeFalse();
    expect(openSpy).toHaveBeenCalled();
  }));

  it('should not throw when convertToUpperCase is called', () => {
    const mockEvent = {
      target: {
        value: 'test',
        selectionStart: 4,
        setSelectionRange: jasmine.createSpy('setSelectionRange'),
      },
    } as any;
    // convertToUpperCase handles missing form controls gracefully
    expect(() => component.convertToUpperCase(mockEvent, 'anyField')).not.toThrow();
  });
});
