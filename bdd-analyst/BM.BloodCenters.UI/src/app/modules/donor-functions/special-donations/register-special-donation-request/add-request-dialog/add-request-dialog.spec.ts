import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AddRequestDialogComponent } from './add-request-dialog';
import { RegisterSpecialDonationRequestService } from '../register-special-donation-request.service';

describe('AddRequestDialogComponent', () => {
  let component: AddRequestDialogComponent;
  let fixture: ComponentFixture<AddRequestDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddRequestDialogComponent>>;
  let serviceSpy: jasmine.SpyObj<RegisterSpecialDonationRequestService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    serviceSpy = jasmine.createSpyObj('RegisterSpecialDonationRequestService', [
      'getPatientTypes',
      'getSurgeryTypes',
      'getProductTypes',
      'getHospitals',
      'getShipLocations',
      'getPhysicians',
      'getConsignees',
      'generateSurgeryId',
      'createPatientWithSurgery',
      'getAboTypes',
      'getPatientStatuses',
    ]);
    serviceSpy.getPatientTypes.and.returnValue(of({ data: [] }));
    serviceSpy.getSurgeryTypes.and.returnValue(of({ data: [] }));
    serviceSpy.getProductTypes.and.returnValue(of({ data: [] }));
    serviceSpy.getHospitals.and.returnValue(of({ data: [] }));
    serviceSpy.getShipLocations.and.returnValue(of({ data: [] }));
    serviceSpy.getPhysicians.and.returnValue(of({ data: [] }));
    serviceSpy.getConsignees.and.returnValue(of({ data: [] }));
    serviceSpy.generateSurgeryId.and.returnValue(of({ data: ['SURG001'] }));
    serviceSpy.createPatientWithSurgery.and.returnValue(of({ success: true }));
    serviceSpy.getAboTypes.and.returnValue(of({ data: [] }));
    serviceSpy.getPatientStatuses.and.returnValue(of({ data: [] }));

    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [AddRequestDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: RegisterSpecialDonationRequestService, useValue: serviceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddRequestDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize patient and surgery forms', () => {
    expect(component.patientForm).toBeTruthy();
    expect(component.surgeryForm).toBeTruthy();
  });

  it('should require patient last name, first name, sex, patType, and status', () => {
    component.patientForm.markAllAsTouched();
    expect(component.patientForm.get('patLastName')?.hasError('required')).toBeTrue();
    expect(component.patientForm.get('patFirstName')?.hasError('required')).toBeTrue();
    expect(component.patientForm.get('sex')?.hasError('required')).toBeTrue();
    expect(component.patientForm.get('patType')?.hasError('required')).toBeTrue();
  });

  it('should default status to Active', () => {
    expect(component.patientForm.get('status')?.value).toBe('A');
  });

  it('should require surgery date, physician, shipId, and unitsRequired', () => {
    component.surgeryForm.markAllAsTouched();
    expect(component.surgeryForm.get('surgDate')?.hasError('required')).toBeTrue();
    expect(component.surgeryForm.get('phyId')?.hasError('required')).toBeTrue();
    expect(component.surgeryForm.get('shipId')?.hasError('required')).toBeTrue();
    expect(component.surgeryForm.get('unitsRequired')?.hasError('required')).toBeTrue();
  });

  it('should load lookups on init', () => {
    expect(serviceSpy.getPatientTypes).toHaveBeenCalled();
    expect(serviceSpy.getSurgeryTypes).toHaveBeenCalled();
    expect(serviceSpy.getHospitals).toHaveBeenCalled();
    expect(serviceSpy.getShipLocations).toHaveBeenCalled();
    expect(serviceSpy.getPhysicians).toHaveBeenCalled();
  });

  it('should generate surgery ID on init', () => {
    expect(serviceSpy.generateSurgeryId).toHaveBeenCalled();
    expect(component.generatedSurgId).toBe('SURG001');
  });

  it('should close dialog with false on cancel', () => {
    component.onCancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
  });

  it('should not save when surgery form is invalid', () => {
    component.onSavePatientAndSurgery();
    expect(serviceSpy.createPatientWithSurgery).not.toHaveBeenCalled();
  });

  it('should navigate to physician list and close on openNewPhysician', () => {
    component.openNewPhysician();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/donor-functions/maintain-physician-list']);
    expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
  });

  it('should create patient and surgery on valid save', fakeAsync(() => {
    component.patientForm.patchValue({
      patLastName: 'SMITH',
      patFirstName: 'JOHN',
      sex: 'M',
      patType: 'A',
      status: 'A',
    });

    // Simulate stepper by providing a mock
    (component as any).stepper = { next: jasmine.createSpy('next'), selectedIndex: 0 };

    // Call onNext to set patientFormData (required before save)
    component.onNext();

    component.surgeryForm.patchValue({
      surgDate: new Date(),
      phyId: 'PHY001',
      shipId: 'SHIP01',
      unitsRequired: '2',
    });

    component.onSavePatientAndSurgery();
    tick();

    expect(serviceSpy.createPatientWithSurgery).toHaveBeenCalled();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  }));
});
