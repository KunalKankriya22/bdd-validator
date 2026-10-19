import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import moment from 'moment';

import { AddEditDonationProcedureComponent } from './add-edit-donation-procedure';
import { DefineDonationProceduresService } from '../services/define-donation-procedures.service';
import { DefineDonationProceduresModel } from '../models/define-donation-procedures.model';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditDonationProcedureComponent', () => {
  let component: AddEditDonationProcedureComponent;
  let fixture: ComponentFixture<AddEditDonationProcedureComponent>;
  let mockService: jasmine.SpyObj<DefineDonationProceduresService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockLoginService: jasmine.SpyObj<LoginService>;

  // Use relative dates for test stability
  const tomorrow = moment().add(1, 'days').toDate();
  const nextYear = moment().add(1, 'year').toDate();

  const mockDonationProcedureData: DefineDonationProceduresModel = {
    donationType: 'WB',
    donationTypeDescription: 'Whole Blood',
    procedureCode: 'P001',
    procedureCodeDescription: 'Standard Collection',
    effectiveDate: tomorrow,
    terminationDate: nextYear
  };

  const mockLookupData = {
    donationTypes: [
      { key: 'WB', value: 'Whole Blood' },
      { key: 'PL', value: 'Platelets' }
    ],
    procedureCodes: [
      { key: 'P001', value: 'Standard Collection' },
      { key: 'P002', value: 'Apheresis Collection' }
    ]
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DefineDonationProceduresService', [
      'getLookupDropdownValues',
      'addDonationProcedure',
      'updateDonationProcedure'
    ]);

    mockSnackBar = createMockMatSnackBar();
    mockHeaderService = createMockHeaderService();
    mockLoginService = jasmine.createSpyObj('LoginService', ['getStoredUsername']);

    // Setup default return values
    mockService.getLookupDropdownValues.and.returnValue(of(mockLookupData));
    mockLoginService.getStoredUsername.and.returnValue('testuser');



      TestBed.configureTestingModule({
imports: [
        AddEditDonationProcedureComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        { provide: DefineDonationProceduresService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: LoginService, useValue: mockLoginService }
      ]
    });


    });



  beforeEach(() => {


      mockHeaderService.getCurrentChapterId.calls.reset();
      mockService.getLookupDropdownValues.and.returnValue(of(mockLookupData));
      mockLoginService.getStoredUsername.and.returnValue('testuser');


    fixture = TestBed.createComponent(AddEditDonationProcedureComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {


    it('should load lookup data on init', () => {
      component.mode = 'add';
      fixture.detectChanges();

      expect(mockService.getLookupDropdownValues).toHaveBeenCalled();
      expect(component.donationTypes.length).toBe(2);
      expect(component.procedureCodes.length).toBe(2);
    });

  });

  describe('Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should have all fields enabled in add mode', () => {
      expect(component.donationProcedureForm.get('donationType')?.enabled).toBe(true);
      expect(component.donationProcedureForm.get('procedureCodeSelect')?.enabled).toBe(true);
      expect(component.donationProcedureForm.get('effectiveDate')?.enabled).toBe(true);
    });

    it('should initialize with empty form values', () => {
      expect(component.donationProcedureForm.get('donationType')?.value).toBe('');
      expect(component.donationProcedureForm.get('procedureCodeSelect')?.value).toEqual([]);
      expect(component.donationProcedureForm.get('effectiveDate')?.value).toBeNull();
    });

    it('should have required validator on donationType', () => {
      const control = component.donationProcedureForm.get('donationType');
      control?.setValue('');
      control?.markAsTouched();

      expect(control?.hasError('required')).toBe(true);
    });

    it('should have required validator on effectiveDate', () => {
      const control = component.donationProcedureForm.get('effectiveDate');
      control?.setValue(null);
      control?.markAsTouched();

      expect(control?.hasError('required')).toBe(true);
    });

    it('should update selected procedure codes when selection changes', () => {
      component.donationProcedureForm.patchValue({
        procedureCodeSelect: ['P001', 'P002']
      });

      expect(component.selectedProcedureCodes.length).toBe(2);
      expect(component.selectedProcedureCodes[0].code).toBe('P001');
      expect(component.selectedProcedureCodes[1].code).toBe('P002');
    });

    it('should update donation type description when donation type changes', () => {
      component.donationProcedureForm.patchValue({
        donationType: 'WB'
      });

      expect(component.selectedDonationTypeDescription).toBe('Whole Blood');
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockDonationProcedureData;
      fixture.detectChanges();
    });





    it('should populate selected procedure codes array', () => {
      expect(component.selectedProcedureCodes.length).toBe(1);
      expect(component.selectedProcedureCodes[0].code).toBe('P001');
      expect(component.selectedProcedureCodes[0].description).toBe('Standard Collection');
    });

    it('should set donation type description after data is loaded', () => {
      expect(component.selectedDonationTypeDescription).toBe('Whole Blood');
    });
  });

  describe('Edit Mode - Null Termination Date', () => {
    it('should handle null terminationDate', () => {
      const dataWithoutTermDate = { ...mockDonationProcedureData, terminationDate: null };
      component.mode = 'edit';
      component.data = dataWithoutTermDate;
      fixture.detectChanges();

      expect(component.donationProcedureForm.get('terminationDate')?.value).toBeNull();
    });
  });

  describe('Form Interactions', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });


    it('should not remove code if not in selection', () => {
      component.donationProcedureForm.patchValue({
        procedureCodeSelect: ['P001']
      });

      component.removeProcedureCode('P002');

      const codes = component.donationProcedureForm.get('procedureCodeSelect')?.value;
      expect(codes).toEqual(['P001']);
    });

    it('should handle empty procedure code selection', () => {
      component.donationProcedureForm.patchValue({
        procedureCodeSelect: []
      });

      expect(component.selectedProcedureCodes).toEqual([]);
    });
  });

  describe('Save Functionality - Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should save new record with valid data', () => {
      mockService.addDonationProcedure.and.returnValue(of({ success: true }));

      const effectiveDate = moment().add(2, 'days');

      component.donationProcedureForm.patchValue({
        donationType: 'WB',
        procedureCodeSelect: ['P001', 'P002'],
        effectiveDate: effectiveDate,
        terminationDate: null
      });

      component.onSave();

      expect(mockService.addDonationProcedure).toHaveBeenCalled();
      const payload = mockService.addDonationProcedure.calls.mostRecent().args[0];
      expect(payload.donationType).toBe('WB');
      expect(payload.procedureCodes).toEqual(['P001', 'P002']);
    });

    it('should emit saveSuccess on successful save', () => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');
      mockService.addDonationProcedure.and.returnValue(of({ success: true }));

      const effectiveDate = moment().add(2, 'days');

      component.donationProcedureForm.patchValue({
        donationType: 'WB',
        procedureCodeSelect: ['P001'],
        effectiveDate: effectiveDate
      });

      component.onSave();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });


  });

  describe('Save Functionality - Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockDonationProcedureData;
      fixture.detectChanges();
    });

    it('should update record with valid data', () => {
      mockService.updateDonationProcedure.and.returnValue(of({ success: true }));

      const terminationDate = moment().add(1, 'year').toDate();

      component.donationProcedureForm.patchValue({
        terminationDate: terminationDate
      });
      component.donationProcedureForm.markAsDirty();

      component.onSave();

      expect(mockService.updateDonationProcedure).toHaveBeenCalled();
      const payload = mockService.updateDonationProcedure.calls.mostRecent().args[0];
      expect(payload.donationType).toBe('WB');
      expect(payload.procedureCode).toBe('P001');
    });

    it('should emit saveSuccess on successful update', () => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');
      mockService.updateDonationProcedure.and.returnValue(of({ success: true }));

      component.donationProcedureForm.markAsDirty();
      component.onSave();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

  });


  describe('Date Formatting', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should format date for display', () => {
      const date = moment().add(20, 'days').date(20).toDate();
      const formatted = component['formatDateForDisplay'](date);
      const expectedYear = moment(date).year();
      const expectedMonth = moment(date).format('MMM').toUpperCase();
      expect(formatted).toBe(`20-${expectedMonth}-${expectedYear}`);
    });


    it('should pad single digit months and days', () => {
      const date = moment().month(5).date(5).toDate(); // June 5th
      const formatted = component['formatDateForDisplay'](date);
      const expectedYear = moment(date).year();
      expect(formatted).toBe(`05-JUN-${expectedYear}`);
    });
  });



  describe('Form Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });


    it('should accept valid form values', () => {
      const effectiveDate = moment().add(2, 'days');

      component.donationProcedureForm.patchValue({
        donationType: 'WB',
        procedureCodeSelect: ['P001'],
        effectiveDate: effectiveDate,
        terminationDate: null
      });

      expect(component.donationProcedureForm.valid).toBe(true);
    });

    it('should validate termination date is optional', () => {
      const effectiveDate = moment().add(2, 'days');

      component.donationProcedureForm.patchValue({
        donationType: 'WB',
        procedureCodeSelect: ['P001'],
        effectiveDate: effectiveDate,
        terminationDate: null
      });

      const terminationControl = component.donationProcedureForm.get('terminationDate');
      expect(terminationControl?.hasError('required')).toBeFalsy();
    });
  });

  describe('Error Message Methods', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return effective date required error', () => {
      const control = component.donationProcedureForm.get('effectiveDate');
      control?.setValue(null);
      control?.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    });


  });
});
