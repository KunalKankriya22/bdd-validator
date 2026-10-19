import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { SurgeryDialogComponent, SurgeryDialogData } from './surgery-dialog';
import { RegisterSpecialDonationRequestService } from '../register-special-donation-request.service';

describe('SurgeryDialogComponent', () => {
  let component: SurgeryDialogComponent;
  let fixture: ComponentFixture<SurgeryDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<SurgeryDialogComponent>>;
  let serviceSpy: jasmine.SpyObj<RegisterSpecialDonationRequestService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let routerSpy: jasmine.SpyObj<Router>;

  const addModeData: SurgeryDialogData = {
    mode: 'add',
    patId: 'PAT001',
  };

  function createComponent(data: SurgeryDialogData): void {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: data });
    fixture = TestBed.createComponent(SurgeryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    serviceSpy = jasmine.createSpyObj('RegisterSpecialDonationRequestService', [
      'getSurgeryTypes',
      'getHospitals',
      'getShipLocations',
      'getPhysicians',
      'getConsignees',
      'getPatientDetail',
      'generateSurgeryId',
      'createSurgery',
      'updateSurgery',
    ]);
    serviceSpy.getSurgeryTypes.and.returnValue(of({ data: [] }));
    serviceSpy.getHospitals.and.returnValue(of({ data: [] }));
    serviceSpy.getShipLocations.and.returnValue(of({ data: [] }));
    serviceSpy.getPhysicians.and.returnValue(of({ data: [] }));
    serviceSpy.getConsignees.and.returnValue(of({ data: [] }));
    serviceSpy.getPatientDetail.and.returnValue(of({ item: null }));
    serviceSpy.generateSurgeryId.and.returnValue(of({ data: ['SURG001'] }));
    serviceSpy.createSurgery.and.returnValue(of({}));
    serviceSpy.updateSurgery.and.returnValue(of({}));

    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [SurgeryDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: addModeData },
        { provide: RegisterSpecialDonationRequestService, useValue: serviceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();
  });

  describe('Add Mode', () => {
    beforeEach(() => {
      createComponent(addModeData);
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should set mode to add', () => {
      expect(component.mode).toBe('add');
    });

    it('should set dialog title for add mode', () => {
      expect(component.dialogTitle).toContain('Add New Surgery Details');
    });

    it('should initialize form with required fields', () => {
      expect(component.form).toBeTruthy();
      component.form.markAllAsTouched();
      expect(component.form.get('surgDate')?.hasError('required')).toBeTrue();
      expect(component.form.get('phyId')?.hasError('required')).toBeTrue();
      expect(component.form.get('shipId')?.hasError('required')).toBeTrue();
      expect(component.form.get('unitsRequired')?.hasError('required')).toBeTrue();
    });

    it('should validate comments maxLength of 240', () => {
      component.form.get('comments')?.setValue('A'.repeat(241));
      expect(component.form.get('comments')?.hasError('maxlength')).toBeTrue();
    });

    it('should generate surgery ID on init', () => {
      expect(serviceSpy.generateSurgeryId).toHaveBeenCalled();
    });

    it('should close dialog with false on cancel', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
    });

    it('should not save when form is invalid', () => {
      component.onSave();
      expect(serviceSpy.createSurgery).not.toHaveBeenCalled();
    });

    it('should create surgery on valid save', fakeAsync(() => {
      component.form.patchValue({
        surgDate: new Date('2025-06-01'),
        phyId: 'PHY001',
        shipId: 'SHIP01',
        unitsRequired: '2',
      });
      component.onSave();
      tick();
      expect(serviceSpy.createSurgery).toHaveBeenCalled();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    }));

    it('should navigate to physician list on openNewPhysician', () => {
      component.openNewPhysician();
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/donor-functions/maintain-physician-list'],
        jasmine.objectContaining({ state: jasmine.any(Object) })
      );
    });
  });

  describe('Edit Mode', () => {
    const editData: SurgeryDialogData = {
      mode: 'edit',
      patId: 'PAT001',
      surgery: {
        surgId: 'SURG001',
        surgDate: '2025-03-15',
        phyId: 'PHY001',
        phyAuthDate: null,
        hospitalId: 'H001',
        shipId: 'SHIP01',
        unitsRequired: '3',
        surgType: 'T1',
        dateNeededBy: null,
        closedDate: null,
        comments: 'Test surgery',
      } as any,
    };

    beforeEach(() => {
      createComponent(editData);
    });

    it('should set mode to edit', () => {
      expect(component.mode).toBe('edit');
    });

    it('should set dialog title with surgery ID', () => {
      expect(component.dialogTitle).toContain('SURG001');
    });

    it('should populate form from surgery data', () => {
      expect(component.form.get('phyId')?.value).toBe('PHY001');
      expect(component.form.get('shipId')?.value).toBe('SHIP01');
    });

    it('should call updateSurgery on save in edit mode', fakeAsync(() => {
      // Ensure form is valid before saving
      component.form.patchValue({
        surgType: 'T1',
        surgDate: new Date('2025-03-15'),
        phyId: 'PHY001',
        hospitalId: 'H001',
        shipId: 'SHIP01',
        unitsRequired: '3',
      });
      component.form.updateValueAndValidity();

      // Reset the mismatch flag that was set during populateForm
      // (the mock getConsignees returns empty data, causing a false mismatch)
      component.hospitalConsigneeMismatch = false;

      component.onSave();
      tick();
      expect(serviceSpy.updateSurgery).toHaveBeenCalled();
    }));
  });
});
