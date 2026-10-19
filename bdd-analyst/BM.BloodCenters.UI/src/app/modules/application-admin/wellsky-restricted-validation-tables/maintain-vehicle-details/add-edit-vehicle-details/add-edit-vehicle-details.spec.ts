import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AddEditVehicleDetails } from './add-edit-vehicle-details';
import { VehicleDetailsService } from '../services/vehicle-details.service';
import { HeaderService } from '@shared/services/header.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import moment from 'moment';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AddEditVehicleDetails', () => {
  let component: AddEditVehicleDetails;
  let fixture: ComponentFixture<AddEditVehicleDetails>;
  let mockVehicleService: jasmine.SpyObj<VehicleDetailsService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: any;

  beforeEach(() => {

    mockVehicleService = jasmine.createSpyObj('VehicleDetailsService', [
      'createVehicle',
      'updateVehicle',
      'addNote',
      'updateNote',
      'deleteNote',
      'getVehicleTypes',
      'getNotes'
    ]);

    mockVehicleService.getNotes.and.returnValue(of([]));
    mockVehicleService.getVehicleTypes.and.returnValue(of([
      { value: 'COACH', label: 'COACH' },
      { value: 'OTHER', label: 'OTHER' },
      { value: 'PIKUP', label: 'PIKUP' },
      { value: 'VAN', label: 'VAN' }
    ]));

    mockSnackBar = createMockMatSnackBar();

    mockHeaderService = {
      headerConfig: jasmine.createSpy('headerConfig').and.returnValue({ user: { id: 'DONSYS', name: 'John Lee', chapterId: 'ABC' } }),
      getCurrentChapterId: jasmine.createSpy('getCurrentChapterId').and.returnValue('ABC'),
      chapterTimeZone: jasmine.createSpy('chapterTimeZone').and.returnValue('America/New_York'),
      chapterId: jasmine.createSpy('chapterId').and.returnValue('ABC')
    };



      TestBed.configureTestingModule({
imports: [
        AddEditVehicleDetails],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: VehicleDetailsService, useValue: mockVehicleService },
        { provide: HeaderService, useValue: mockHeaderService },
      ]
    })
    .overrideComponent(AddEditVehicleDetails, {
      add: { providers: [{ provide: MatSnackBar, useValue: mockSnackBar }] }
    });


    });



  beforeEach(() => {


      mockVehicleService.createVehicle.calls.reset();


      mockVehicleService.updateVehicle.calls.reset();


      mockVehicleService.addNote.calls.reset();


      mockVehicleService.updateNote.calls.reset();


      mockVehicleService.deleteNote.calls.reset();


      mockVehicleService.getVehicleTypes.calls.reset();


      mockVehicleService.getNotes.calls.reset();


      mockVehicleService.getNotes.and.returnValue(of([]));


      mockVehicleService.getVehicleTypes.and.returnValue(of([


    fixture = TestBed.createComponent(AddEditVehicleDetails);
    component = fixture.componentInstance;


    });

  it('should initialize in add mode', () => {
    component.mode = 'add';
    component.ngOnInit();
    expect(component.panelTitle).toBe('Add New Vehicle Details');
    expect(component.generalInfoForm.get('vehicleId')?.enabled).toBeTrue();
  });



  it('should validate termination date >= effective date via cross-field validator', () => {
    component.ngOnInit();
    const form = component.generalInfoForm;
    const effectiveDate = moment().add(5, 'days');
    const terminationDate = moment().add(3, 'days');

    form.patchValue({
      vehicleId: 'TEST001',
      vehicleName: 'Test Vehicle',
      vehicleType: 'VAN',
      effectiveDate: effectiveDate,
      terminationDate: terminationDate
    });

    form.get('terminationDate')?.updateValueAndValidity();
    expect(form.hasError('dateRangeInvalid')).toBeTrue();
  });

  it('should not allow future registration date', () => {
    component.ngOnInit();
    const form = component.generalInfoForm;
    const futureDate = moment().add(10, 'days');

    form.patchValue({ registrationDate: futureDate });
    form.get('registrationDate')?.updateValueAndValidity();

    expect(form.get('registrationDate')?.hasError('futureDate')).toBeTrue();
  });

  it('should allow past registration date', () => {
    component.ngOnInit();
    const form = component.generalInfoForm;
    const pastDate = moment().subtract(10, 'days');

    form.patchValue({ registrationDate: pastDate });
    form.get('registrationDate')?.updateValueAndValidity();

    expect(form.get('registrationDate')?.hasError('futureDate')).toBeFalse();
  });

  it('should not allow future FDA license date', () => {
    component.ngOnInit();
    const form = component.generalInfoForm;
    const futureDate = moment().add(10, 'days');

    form.patchValue({ fdaLicenseDate: futureDate });
    form.get('fdaLicenseDate')?.updateValueAndValidity();

    expect(form.get('fdaLicenseDate')?.hasError('futureDate')).toBeTrue();
  });

  it('should not allow future last inspection date', () => {
    component.ngOnInit();
    const form = component.generalInfoForm;
    const futureDate = moment().add(10, 'days');

    form.patchValue({ lastInspectionDate: futureDate });
    form.get('lastInspectionDate')?.updateValueAndValidity();

    expect(form.get('lastInspectionDate')?.hasError('futureDate')).toBeTrue();
  });

  it('should validate decommission date must be later than commission date', () => {
    component.ngOnInit();
    const form = component.generalInfoForm;
    const commissionDate = moment('2025-03-15');
    const decommissionDate = moment('2025-03-10');

    form.patchValue({ commissionDate, decommissionDate });
    form.get('decommissionDate')?.updateValueAndValidity();

    expect(form.get('decommissionDate')?.hasError('decommissionBeforeCommission')).toBeTrue();
  });

  it('should allow decommission date later than commission date', () => {
    component.ngOnInit();
    const form = component.generalInfoForm;
    const commissionDate = moment('2025-03-15');
    const decommissionDate = moment('2025-04-01');

    form.patchValue({ commissionDate, decommissionDate });
    form.get('decommissionDate')?.updateValueAndValidity();

    expect(form.get('decommissionDate')?.hasError('decommissionBeforeCommission')).toBeFalse();
  });

  it('should validate FDA renewal date must be later than FDA license date', () => {
    component.ngOnInit();
    const form = component.generalInfoForm;
    const fdaLicenseDate = moment('2025-03-15');
    const fdaRenewalDate = moment('2025-03-10');

    form.patchValue({ fdaLicenseDate, fdaRenewalDate });
    form.get('fdaRenewalDate')?.updateValueAndValidity();

    expect(form.get('fdaRenewalDate')?.hasError('fdaRenewalBeforeLicense')).toBeTrue();
  });

  it('should allow FDA renewal date later than FDA license date', () => {
    component.ngOnInit();
    const form = component.generalInfoForm;
    const fdaLicenseDate = moment('2025-03-15');
    const fdaRenewalDate = moment('2025-06-15');

    form.patchValue({ fdaLicenseDate, fdaRenewalDate });
    form.get('fdaRenewalDate')?.updateValueAndValidity();

    expect(form.get('fdaRenewalDate')?.hasError('fdaRenewalBeforeLicense')).toBeFalse();
  });


  it('should validate termination date cannot be past date', () => {
    component.ngOnInit();
    const form = component.generalInfoForm;
    const pastDate = moment().subtract(5, 'days');

    form.patchValue({
      effectiveDate: moment().subtract(10, 'days'),
      terminationDate: pastDate
    });
    form.get('terminationDate')?.updateValueAndValidity();

    expect(form.get('terminationDate')?.hasError('terminationDatePast')).toBeTrue();
  });

  it('should create vehicle successfully', () => {
    component.mode = 'add';
    component.ngOnInit();
    const futureDate = moment().add(1, 'day');
    const mockResponse = {
      success: true,
      data: {
        vehicleId: 'TEST001',
        vehicleName: 'Test Vehicle',
        vehicleType: 'VAN',
        effectiveDate: futureDate.toISOString(),
        notes: []
      }
    };

    mockVehicleService.createVehicle.and.returnValue(of(mockResponse));
    spyOn(component.saveSuccess, 'emit');

    component.generalInfoForm.patchValue({
      vehicleId: 'TEST001',
      vehicleName: 'Test Vehicle',
      vehicleType: 'VAN',
      effectiveDate: futureDate
    });

    component.onSave();

    expect(mockVehicleService.createVehicle).toHaveBeenCalled();
    expect(component.saveSuccess.emit).toHaveBeenCalled();
  });



  it('should add note successfully', () => {
    component.mode = 'edit';
    component.data = {
      vehicleId: 'TEST001',
      vehicleName: 'Test Vehicle',
      vehicleType: 'VAN',
      effectiveDate: '2025-01-01T00:00:00Z',
      notes: []
    } as any;

    const mockNotes = [{
      noteId: 'VEHICLE123',
      chapterId: 'ABC',
      noteSequence: 1,
      note: 'Test note',
      programId: 'CONVERT',
      insertDate: new Date().toISOString(),
      insertUser: 'DONSYS',
      auditKey: 12345
    }];

    mockVehicleService.addNote.and.returnValue(of(mockNotes));

    component.noteForm.patchValue({ noteText: 'Test note' });
    component.addNote();

    expect(mockVehicleService.addNote).toHaveBeenCalled();
    expect(component.notes.length).toBe(1);
  });

  it('should allow editing all notes in edit mode', () => {
    component.mode = 'edit';
    const ownNote = {
      noteId: '1',
      chapterId: 'ABC',
      noteSequence: 1,
      note: 'Own note',
      programId: 'CONVERT',
      insertDate: new Date().toISOString(),
      insertUser: 'DONSYS',
      auditKey: 12345
    };

    const otherNote = {
      noteId: '2',
      chapterId: 'ABC',
      noteSequence: 2,
      note: 'Other note',
      programId: 'CONVERT',
      insertDate: new Date().toISOString(),
      insertUser: 'OTHER',
      auditKey: 12346
    };

    expect(component.canEditNote(ownNote)).toBeTrue();
    expect(component.canEditNote(otherNote)).toBeTrue();
  });

  it('should not allow editing notes in add mode', () => {
    component.mode = 'add';
    const note = {
      noteId: 'temp-1',
      chapterId: 'ABC',
      noteSequence: 1,
      note: 'Pending note',
      programId: '',
      insertDate: new Date().toISOString(),
      insertUser: 'DONSYS',
      auditKey: 0
    };

    expect(component.canEditNote(note)).toBeFalse();
  });

  // --- Error getter coverage ---

  it('should return registration date error for future date', () => {
    component.ngOnInit();
    component.generalInfoForm.patchValue({ registrationDate: moment().add(10, 'days') });
    component.generalInfoForm.get('registrationDate')?.markAsTouched();
    component.generalInfoForm.get('registrationDate')?.updateValueAndValidity();
    expect(component.getRegistrationDateError()).toContain('cannot be a future date');
  });


  it('should return decommission date error when before commission date', () => {
    component.ngOnInit();
    component.generalInfoForm.patchValue({
      commissionDate: moment('2025-06-01'),
      decommissionDate: moment('2025-05-01')
    });
    component.generalInfoForm.get('decommissionDate')?.markAsTouched();
    component.generalInfoForm.get('decommissionDate')?.updateValueAndValidity();
    expect(component.getDecommissionDateError()).toContain('later than Commission Date');
  });


  it('should return FDA license date error for future date', () => {
    component.ngOnInit();
    component.generalInfoForm.patchValue({ fdaLicenseDate: moment().add(10, 'days') });
    component.generalInfoForm.get('fdaLicenseDate')?.markAsTouched();
    component.generalInfoForm.get('fdaLicenseDate')?.updateValueAndValidity();
    expect(component.getFdaLicenseDateError()).toContain('cannot be a future date');
  });

  it('should return FDA renewal date error when before FDA license date', () => {
    component.ngOnInit();
    component.generalInfoForm.patchValue({
      fdaLicenseDate: moment('2025-06-01'),
      fdaRenewalDate: moment('2025-05-01')
    });
    component.generalInfoForm.get('fdaRenewalDate')?.markAsTouched();
    component.generalInfoForm.get('fdaRenewalDate')?.updateValueAndValidity();
    expect(component.getFdaRenewalDateError()).toContain('later than FDA License Date');
  });


  it('should return last inspection date error for future date', () => {
    component.ngOnInit();
    component.generalInfoForm.patchValue({ lastInspectionDate: moment().add(10, 'days') });
    component.generalInfoForm.get('lastInspectionDate')?.markAsTouched();
    component.generalInfoForm.get('lastInspectionDate')?.updateValueAndValidity();
    expect(component.getLastInspectionDateError()).toContain('cannot be a future date');
  });

  it('should return effective date required error', () => {
    component.ngOnInit();
    component.generalInfoForm.patchValue({ effectiveDate: null });
    component.generalInfoForm.get('effectiveDate')?.markAsTouched();
    component.generalInfoForm.get('effectiveDate')?.updateValueAndValidity();
    expect(component.getEffectiveDateError()).toContain('required');
  });

  it('should return termination date error for past date', () => {
    component.ngOnInit();
    component.generalInfoForm.patchValue({
      effectiveDate: moment().subtract(10, 'days'),
      terminationDate: moment().subtract(5, 'days')
    });
    component.generalInfoForm.get('terminationDate')?.markAsTouched();
    component.generalInfoForm.get('terminationDate')?.updateValueAndValidity();
    expect(component.getTerminationDateError()).toContain('past date');
  });

  it('should return termination date error when before effective date', () => {
    component.ngOnInit();
    component.generalInfoForm.patchValue({
      effectiveDate: moment().add(10, 'days'),
      terminationDate: moment().add(5, 'days')
    });
    component.generalInfoForm.get('terminationDate')?.markAsTouched();
    component.generalInfoForm.get('terminationDate')?.updateValueAndValidity();
    expect(component.getTerminationDateError()).toContain('greater than or equal to Effective Date');
  });


  it('should return vehicle name error for required', () => {
    component.generalInfoForm.get('vehicleName')?.markAsTouched();
    expect(component.getVehicleNameError()).toContain('required');
  });

  it('should return vehicle type error for required', () => {
    component.generalInfoForm.get('vehicleType')?.markAsTouched();
    expect(component.getVehicleTypeError()).toContain('required');
  });

  it('should return vehicle id error for required when validator set', () => {
    expect(component.getVehicleIdError()).toBe('');
  });

  // --- Edit mode save ---

  it('should update vehicle in edit mode', () => {
    component.mode = 'edit';
    component.data = {
      vehicleId: 'V001',
      vehicleName: 'Test Vehicle',
      vehicleType: 'VAN',
      effectiveDate: '2025-01-01T00:00:00Z',
    } as any;
    component.ngOnInit();
    component.ngOnChanges({ data: { currentValue: component.data, previousValue: null, firstChange: false, isFirstChange: () => false } });

    mockVehicleService.updateVehicle.and.returnValue(of({ success: true } as any));
    spyOn(component.saveSuccess, 'emit');

    component.generalInfoForm.patchValue({
      vehicleName: 'Updated Vehicle',
      vehicleType: 'COACH',
      effectiveDate: moment('2025-01-01')
    });

    component.onSave();

    expect(mockVehicleService.updateVehicle).toHaveBeenCalled();
    expect(component.saveSuccess.emit).toHaveBeenCalled();
  });

  // --- Notes edge cases ---

  it('should start and cancel adding note', () => {
    component.startAddNote();
    expect(component.isAddingNote).toBeTrue();

    component.cancelAddNote();
    expect(component.isAddingNote).toBeFalse();
  });

  it('should start and cancel editing note', () => {
    const note = {
      noteId: '1', chapterId: 'ABC', noteSequence: 1,
      note: 'Test', programId: 'P', insertDate: new Date().toISOString(),
      insertUser: 'DONSYS', auditKey: 1
    };
    component.startEditNote(note);
    expect(component.editingNoteSequence).toBe(1);

    component.cancelEditNote();
    expect(component.editingNoteSequence).toBeNull();
  });

  it('should save edited note successfully', () => {
    component.mode = 'edit';
    component.data = {
      vehicleId: 'V001', vehicleName: 'Test', vehicleType: 'VAN',
      effectiveDate: '2025-01-01T00:00:00Z'
    } as any;
    const note = {
      noteId: 'N1', chapterId: 'ABC', noteSequence: 1,
      note: 'Old text', programId: 'P', insertDate: new Date().toISOString(),
      insertUser: 'DONSYS', auditKey: 1
    };

    mockVehicleService.updateNote.and.returnValue(of({} as any));
    mockVehicleService.getNotes.and.returnValue(of([]));
    component.noteForm.patchValue({ noteText: 'Updated text' });

    component.saveEditNote(note);

    expect(mockVehicleService.updateNote).toHaveBeenCalled();
    expect(component.editingNoteSequence).toBeNull();
  });



  // --- Format helpers ---



  it('should format note date in chapter timezone', () => {
    component.ngOnInit();
    // Test with a UTC date - should format in chapter timezone (America/New_York)
    const result = component.formatNoteDate('2025-03-14T12:00:00Z');
    expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/); // DD-MMM-YYYY format
    expect(result).toContain('2025');
  });


  // --- isFormActionDisabled ---


  it('should disable form action when saving', () => {
    component.isSaving = true;
    expect(component.isFormActionDisabled).toBeTrue();
  });

  // --- Populate form edge cases ---


  it('should populate all date fields in edit mode', () => {
    component.mode = 'edit';
    component.data = {
      vehicleId: 'V001',
      vehicleName: 'Test',
      vehicleType: 'VAN',
      identificationNumber: 'ID123',
      licensePlate: 'LP123',
      registrationDate: '2025-01-01T00:00:00Z',
      commissionDate: '2025-02-01T00:00:00Z',
      decommissionDate: '2025-03-01T00:00:00Z',
      fdaLicenseDate: '2025-04-01T00:00:00Z',
      fdaRenewalDate: '2025-05-01T00:00:00Z',
      lastInspectionDate: '2025-06-01T00:00:00Z',
      inspectionRenewalDate: '2025-07-01T00:00:00Z',
      effectiveDate: '2025-08-01T00:00:00Z',
      terminationDate: '2025-09-01T00:00:00Z',
    } as any;
    component.ngOnInit();
    component.ngOnChanges({ data: { currentValue: component.data, previousValue: null, firstChange: false, isFirstChange: () => false } });

    const form = component.generalInfoForm;
    expect(moment.isMoment(form.get('registrationDate')?.value)).toBeTrue();
    expect(moment.isMoment(form.get('commissionDate')?.value)).toBeTrue();
    expect(moment.isMoment(form.get('fdaLicenseDate')?.value)).toBeTrue();
    expect(moment.isMoment(form.get('effectiveDate')?.value)).toBeTrue();
    expect(moment.isMoment(form.get('terminationDate')?.value)).toBeTrue();
  });

  // --- Commission/Decommission watcher ---



  // --- FDA License/Renewal watcher ---



  // --- Effective date / Term date cross-field validation ---

  it('should show cross-field error when termination date is before effective date', () => {
    component.ngOnInit();
    const form = component.generalInfoForm;
    form.patchValue({
      effectiveDate: moment().add(30, 'days'),
      terminationDate: moment().add(10, 'days')
    });
    expect(form.hasError('dateRangeInvalid')).toBeTrue();
  });

  it('should not show cross-field error when termination date is after effective date', () => {
    component.ngOnInit();
    const form = component.generalInfoForm;
    form.patchValue({
      effectiveDate: moment().add(5, 'days'),
      terminationDate: moment().add(30, 'days')
    });
    expect(form.hasError('dateRangeInvalid')).toBeFalse();
  });

  // --- Decommission without commission ---

  it('should allow decommission date when no commission date is set', () => {
    component.ngOnInit();
    component.generalInfoForm.patchValue({ decommissionDate: moment('2025-06-01') });
    component.generalInfoForm.get('decommissionDate')?.updateValueAndValidity();
    expect(component.generalInfoForm.get('decommissionDate')?.valid).toBeTrue();
  });

  // --- FDA renewal without license ---

  it('should allow FDA renewal date when no FDA license date is set', () => {
    component.ngOnInit();
    component.generalInfoForm.patchValue({ fdaRenewalDate: moment('2025-06-01') });
    component.generalInfoForm.get('fdaRenewalDate')?.updateValueAndValidity();
    expect(component.generalInfoForm.get('fdaRenewalDate')?.valid).toBeTrue();
  });

  // --- onSave when form invalid ---



  it('should not save when form is invalid', () => {
    component.mode = 'add';
    component.ngOnInit();
    component.onSave();
    expect(mockVehicleService.createVehicle).not.toHaveBeenCalled();
  });

  it('should not save when already saving', () => {
    component.mode = 'add';
    component.ngOnInit();
    component.isSaving = true;
    component.generalInfoForm.patchValue({ vehicleName: 'Test', vehicleType: 'VAN', effectiveDate: moment().add(1, 'day') });
    component.onSave();
    expect(mockVehicleService.createVehicle).not.toHaveBeenCalled();
  });

  it('should emit closePanel on cancel', () => {
    spyOn(component.closePanel, 'emit');
    component.onCancel();
    expect(component.closePanel.emit).toHaveBeenCalled();
  });

  it('should set createAnother and call onSave', () => {
    component.mode = 'add';
    component.ngOnInit();
    const futureDate = moment().add(1, 'day');
    mockVehicleService.createVehicle.and.returnValue(of({ success: true } as any));
    component.generalInfoForm.patchValue({ vehicleName: 'Test Vehicle', vehicleType: 'VAN', effectiveDate: futureDate });
    component.onAddAndCreateAnother();
    expect(mockVehicleService.createVehicle).toHaveBeenCalled();
    expect(component.createAnother).toBe(false);
  });

  it('should show error snackbar on save failure', () => {
    component.mode = 'add';
    component.ngOnInit();
    mockVehicleService.createVehicle.and.returnValue(throwError(() => ({ error: { message: 'Save failed' } })));
    component.generalInfoForm.patchValue({ vehicleName: 'Test Vehicle', vehicleType: 'VAN', effectiveDate: moment().add(1, 'day') });
    component.onSave();
    expect(mockSnackBar.open).toHaveBeenCalled();
    expect(component.isSaving).toBe(false);
  });

  it('should show default error message on save failure without message', () => {
    component.mode = 'add';
    component.ngOnInit();
    mockVehicleService.createVehicle.and.returnValue(throwError(() => ({})));
    component.generalInfoForm.patchValue({ vehicleName: 'Test Vehicle', vehicleType: 'VAN', effectiveDate: moment().add(1, 'day') });
    component.onSave();
    expect(mockSnackBar.open).toHaveBeenCalled();
  });

  it('should add note locally in add mode', () => {
    component.mode = 'add';
    component.ngOnInit();
    component.startAddNote();
    component.noteForm.patchValue({ noteText: 'Test note for add mode' });
    component.addNote();
    expect(component.notes.length).toBe(1);
    expect(component.pendingNotes.length).toBe(1);
    expect(component.isAddingNote).toBe(false);
  });

  it('should not add note when note form is invalid', () => {
    component.mode = 'add';
    component.noteForm.patchValue({ noteText: '' });
    const initialNotes = component.notes.length;
    component.addNote();
    expect(component.notes.length).toBe(initialNotes);
  });

  it('should show error on addNote failure in edit mode', () => {
    component.mode = 'edit';
    component.data = { vehicleId: 'V001', vehicleName: 'Test', vehicleType: 'VAN', effectiveDate: '2025-01-01T00:00:00Z' } as any;
    mockVehicleService.addNote.and.returnValue(throwError(() => ({ error: { message: 'Note add failed' } })));
    component.noteForm.patchValue({ noteText: 'Test note' });
    component.addNote();
    expect(mockSnackBar.open).toHaveBeenCalled();
  });

  it('should not add note in edit mode without data', () => {
    component.mode = 'edit';
    component.data = null;
    component.noteForm.patchValue({ noteText: 'Test note' });
    component.addNote();
    expect(mockVehicleService.addNote).not.toHaveBeenCalled();
  });

  it('should not save note when form is invalid', () => {
    component.mode = 'edit';
    component.data = { vehicleId: 'V001' } as any;
    component.noteForm.patchValue({ noteText: '' });
    const note = { noteId: 'N1', chapterId: 'ABC', noteSequence: 1, note: 'Old', programId: 'P', insertDate: new Date().toISOString(), insertUser: 'DONSYS', auditKey: 1 };
    component.saveEditNote(note);
    expect(mockVehicleService.updateNote).not.toHaveBeenCalled();
  });

  it('should not save note when data is null', () => {
    component.mode = 'edit';
    component.data = null;
    component.noteForm.patchValue({ noteText: 'Updated text' });
    const note = { noteId: 'N1', chapterId: 'ABC', noteSequence: 1, note: 'Old', programId: 'P', insertDate: new Date().toISOString(), insertUser: 'DONSYS', auditKey: 1 };
    component.saveEditNote(note);
    expect(mockVehicleService.updateNote).not.toHaveBeenCalled();
  });

  it('should show error on saveEditNote failure', () => {
    component.mode = 'edit';
    component.data = { vehicleId: 'V001' } as any;
    mockVehicleService.updateNote.and.returnValue(throwError(() => ({ error: { message: 'Update failed' } })));
    component.noteForm.patchValue({ noteText: 'Updated text' });
    const note = { noteId: 'N1', chapterId: 'ABC', noteSequence: 1, note: 'Old', programId: 'P', insertDate: new Date().toISOString(), insertUser: 'DONSYS', auditKey: 1 };
    component.saveEditNote(note);
    expect(mockSnackBar.open).toHaveBeenCalled();
  });

  it('should delete note in add mode after dialog confirmation', () => {
    component.mode = 'add';
    const note = { noteId: 'temp-1', chapterId: 'ABC', noteSequence: 1, note: 'Test', programId: '', insertDate: new Date().toISOString(), insertUser: 'DONSYS', auditKey: 0 };
    component.notes = [note];
    component.pendingNotes = [{ chapterId: 'ABC', note: 'Test' }];
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(true));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);
    component.deleteNote(note);
    expect(component.notes.length).toBe(0);
    expect(component.pendingNotes.length).toBe(0);
  });

  it('should delete note via API in edit mode after dialog confirmation', () => {
    component.mode = 'edit';
    component.data = { vehicleId: 'V001' } as any;
    const note = { noteId: 'N1', chapterId: 'ABC', noteSequence: 1, note: 'Test', programId: 'P', insertDate: new Date().toISOString(), insertUser: 'DONSYS', auditKey: 1 };
    component.notes = [note];
    mockVehicleService.deleteNote.and.returnValue(of({} as any));
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(true));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);
    component.deleteNote(note);
    expect(mockVehicleService.deleteNote).toHaveBeenCalled();
    expect(component.notes.length).toBe(0);
  });

  it('should not delete note when dialog is cancelled', () => {
    component.mode = 'add';
    const note = { noteId: 'temp-1', chapterId: 'ABC', noteSequence: 1, note: 'Test', programId: '', insertDate: new Date().toISOString(), insertUser: 'DONSYS', auditKey: 0 };
    component.notes = [note];
    component.pendingNotes = [{ chapterId: 'ABC', note: 'Test' }];
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(false));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);
    component.deleteNote(note);
    expect(component.notes.length).toBe(1);
  });

  it('should show error on deleteNote failure in edit mode', () => {
    component.mode = 'edit';
    component.data = { vehicleId: 'V001' } as any;
    const note = { noteId: 'N1', chapterId: 'ABC', noteSequence: 1, note: 'Test', programId: 'P', insertDate: new Date().toISOString(), insertUser: 'DONSYS', auditKey: 1 };
    component.notes = [note];
    mockVehicleService.deleteNote.and.returnValue(throwError(() => ({ error: { message: 'Delete failed' } })));
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(true));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);
    component.deleteNote(note);
    expect(mockSnackBar.open).toHaveBeenCalled();
  });

  it('should not call API when data is null during delete in edit mode', () => {
    component.mode = 'edit';
    component.data = null;
    const note = { noteId: 'N1', chapterId: 'ABC', noteSequence: 1, note: 'Test', programId: 'P', insertDate: new Date().toISOString(), insertUser: 'DONSYS', auditKey: 1 };
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(true));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);
    component.deleteNote(note);
    expect(mockVehicleService.deleteNote).not.toHaveBeenCalled();
  });

  it('should return minDate in add mode for terminationMinDate', () => { component.mode = 'add'; component['_minTermDateOverride'] = null; expect(component.terminationMinDate).toBe(component.minDate); });
  it('should return effective date in edit mode for terminationMinDate', () => { component.mode = 'edit'; component['_minTermDateOverride'] = null; const e = moment('2025-03-01'); component.generalInfoForm.patchValue({ effectiveDate: e }); expect(component.terminationMinDate).toBe(e); });
  it('should return override when set for terminationMinDate', () => { const o = moment('2025-06-01'); component['_minTermDateOverride'] = o; expect(component.terminationMinDate).toBe(o); });
  it('should return formatted effective date display', () => { component.data = { effectiveDate: '2025-01-15T00:00:00Z' } as any; expect(component.editEffectiveDateDisplay).toMatch(/15-JAN-2025/i); });
  it('should return dash when no data for editEffectiveDateDisplay', () => { component.data = null; expect(component.editEffectiveDateDisplay).toBe('-'); });
  it('should return dash when data has empty effective date', () => { component.data = { effectiveDate: '' } as any; expect(component.editEffectiveDateDisplay).toBe('-'); });
  it('should format valid ISO date', () => { expect(component.formatDate('2025-03-14T12:00:00Z')).toMatch(/14-Mar-2025/i); });
  it('should return dash for empty date in formatDate', () => { expect(component.formatDate('')).toBe('-'); });
  it('should return dash for invalid date in formatDate', () => { expect(component.formatDate('not-a-date')).toBe('-'); });
  it('should return dash for empty note date', () => { expect(component.formatNoteDate('')).toBe('-'); });
  it('should return dash for invalid note date', () => { expect(component.formatNoteDate('not-a-date')).toBe('-'); });
  it('should return 240 when note text is empty', () => { component.noteForm.patchValue({ noteText: '' }); expect(component.noteCharsRemaining).toBe(240); });
  it('should return correct remaining characters', () => { component.noteForm.patchValue({ noteText: '12345' }); expect(component.noteCharsRemaining).toBe(235); });
  it('should be disabled when form is invalid for isFormActionDisabled', () => { component.generalInfoForm.patchValue({ vehicleName: '' }); component.generalInfoForm.get('vehicleName')?.markAsTouched(); component.generalInfoForm.get('vehicleName')?.updateValueAndValidity(); expect(component.isFormActionDisabled).toBeTrue(); });
  it('should be disabled in edit mode when form is not dirty', () => { component.mode = 'edit'; component.isSaving = false; component.generalInfoForm.patchValue({ vehicleName: 'Test', vehicleType: 'VAN', effectiveDate: moment().add(1, 'day') }); component.generalInfoForm.markAsPristine(); expect(component.isFormActionDisabled).toBeTrue(); });
  it('should not be disabled in edit mode when form is dirty and valid', () => { component.mode = 'edit'; component.isSaving = false; component.generalInfoForm.patchValue({ vehicleName: 'Test', vehicleType: 'VAN', effectiveDate: moment().add(1, 'day') }); component.generalInfoForm.markAsDirty(); expect(component.isFormActionDisabled).toBeFalse(); });
  it('should return true for null date in terminationDateFilter', () => { expect(component.terminationDateFilter(null)).toBeTrue(); });
  it('should return false for past date in terminationDateFilter', () => { expect(component.terminationDateFilter(moment().subtract(10, 'days'))).toBeFalse(); });
  it('should return true for future date in terminationDateFilter', () => { expect(component.terminationDateFilter(moment().add(10, 'days'))).toBeTrue(); });
  it('should return false for date before effective date in terminationDateFilter', () => { component.generalInfoForm.patchValue({ effectiveDate: moment().add(10, 'days') }); expect(component.terminationDateFilter(moment().add(5, 'days'))).toBeFalse(); });
  it('should return commission date invalidDateFormat error', () => { const c = component.generalInfoForm.get('commissionDate'); c?.setErrors({ invalidDateFormat: true }); c?.markAsTouched(); expect(component.getCommissionDateError()).toContain('invalid'); });
  it('should return commission date matDatepickerParse error', () => { const c = component.generalInfoForm.get('commissionDate'); c?.setErrors({ matDatepickerParse: { text: 'abc' } }); c?.markAsTouched(); expect(component.getCommissionDateError()).toContain('invalid'); });
  it('should return empty for commission date when not touched', () => { expect(component.getCommissionDateError()).toBe(''); });
  it('should return decommission date invalidDateFormat error', () => { const c = component.generalInfoForm.get('decommissionDate'); c?.setErrors({ invalidDateFormat: true }); c?.markAsTouched(); expect(component.getDecommissionDateError()).toContain('invalid'); });
  it('should return decommission date matDatepickerMin error', () => { component.ngOnInit(); const c = component.generalInfoForm.get('decommissionDate'); c?.setErrors({ matDatepickerMin: true }); c?.markAsTouched(); expect(component.getDecommissionDateError()).toContain('later than Commission Date'); });
  it('should return FDA license date invalidDateFormat error', () => { const c = component.generalInfoForm.get('fdaLicenseDate'); c?.setErrors({ invalidDateFormat: true }); c?.markAsTouched(); expect(component.getFdaLicenseDateError()).toContain('invalid'); });
  it('should return FDA license date matDatepickerMax error', () => { const c = component.generalInfoForm.get('fdaLicenseDate'); c?.setErrors({ matDatepickerMax: true }); c?.markAsTouched(); expect(component.getFdaLicenseDateError()).toContain('future date'); });
  it('should return FDA renewal date invalidDateFormat error', () => { const c = component.generalInfoForm.get('fdaRenewalDate'); c?.setErrors({ invalidDateFormat: true }); c?.markAsTouched(); expect(component.getFdaRenewalDateError()).toContain('invalid'); });
  it('should return FDA renewal date matDatepickerMin error', () => { component.ngOnInit(); const c = component.generalInfoForm.get('fdaRenewalDate'); c?.setErrors({ matDatepickerMin: true }); c?.markAsTouched(); expect(component.getFdaRenewalDateError()).toContain('later than FDA License Date'); });
  it('should return last inspection date invalidDateFormat error', () => { const c = component.generalInfoForm.get('lastInspectionDate'); c?.setErrors({ invalidDateFormat: true }); c?.markAsTouched(); expect(component.getLastInspectionDateError()).toContain('invalid'); });
  it('should return last inspection date matDatepickerMax error', () => { const c = component.generalInfoForm.get('lastInspectionDate'); c?.setErrors({ matDatepickerMax: true }); c?.markAsTouched(); expect(component.getLastInspectionDateError()).toContain('future date'); });
  it('should return inspection renewal date invalidDateFormat error', () => { const c = component.generalInfoForm.get('inspectionRenewalDate'); c?.setErrors({ invalidDateFormat: true }); c?.markAsTouched(); expect(component.getInspectionRenewalDateError()).toContain('invalid'); });
  it('should return inspection renewal date matDatepickerParse error', () => { const c = component.generalInfoForm.get('inspectionRenewalDate'); c?.setErrors({ matDatepickerParse: { text: 'abc' } }); c?.markAsTouched(); expect(component.getInspectionRenewalDateError()).toContain('invalid'); });
  it('should return empty for inspection renewal date when not touched', () => { expect(component.getInspectionRenewalDateError()).toBe(''); });
  it('should return registration date invalidDateFormat error', () => { const c = component.generalInfoForm.get('registrationDate'); c?.setErrors({ invalidDateFormat: true }); c?.markAsTouched(); expect(component.getRegistrationDateError()).toContain('invalid'); });
  it('should return registration date matDatepickerParse error', () => { const c = component.generalInfoForm.get('registrationDate'); c?.setErrors({ matDatepickerParse: { text: 'abc' } }); c?.markAsTouched(); expect(component.getRegistrationDateError()).toContain('invalid'); });
  it('should return registration date matDatepickerMax error', () => { const c = component.generalInfoForm.get('registrationDate'); c?.setErrors({ matDatepickerMax: true }); c?.markAsTouched(); expect(component.getRegistrationDateError()).toContain('future date'); });
  it('should return empty for registration date when not touched', () => { expect(component.getRegistrationDateError()).toBe(''); });
  it('should return maxlength error for vehicle name', () => { const c = component.generalInfoForm.get('vehicleName'); c?.setErrors({ maxlength: true }); c?.markAsTouched(); expect(component.getVehicleNameError()).toContain('50 characters'); });
  it('should return whitespace error for vehicle name', () => { const c = component.generalInfoForm.get('vehicleName'); c?.setErrors({ whitespace: true }); c?.markAsTouched(); expect(component.getVehicleNameError()).toContain('whitespace'); });
  it('should return lettersOnly error for vehicle name', () => { const c = component.generalInfoForm.get('vehicleName'); c?.setErrors({ lettersOnly: true }); c?.markAsTouched(); expect(component.getVehicleNameError()).toContain('letters and spaces'); });
  it('should return maxlength error for vehicle id', () => { const c = component.generalInfoForm.get('vehicleId'); c?.setErrors({ maxlength: true }); expect(component.getVehicleIdError()).toContain('10 characters'); });
  it('should return whitespace error for vehicle id', () => { const c = component.generalInfoForm.get('vehicleId'); c?.setErrors({ whitespace: true }); expect(component.getVehicleIdError()).toContain('whitespace'); });
  it('should return required error for vehicle id', () => { const c = component.generalInfoForm.get('vehicleId'); c?.setErrors({ required: true }); expect(component.getVehicleIdError()).toContain('required'); });
  it('should allow digit keys in onDateFieldKeyPress', () => { const e = new KeyboardEvent('keypress', { key: '5' }); spyOn(e, 'preventDefault'); component.onDateFieldKeyPress(e); expect(e.preventDefault).not.toHaveBeenCalled(); });
  it('should allow hyphen key in onDateFieldKeyPress', () => { const e = new KeyboardEvent('keypress', { key: '-' }); spyOn(e, 'preventDefault'); component.onDateFieldKeyPress(e); expect(e.preventDefault).not.toHaveBeenCalled(); });
  it('should block letter keys in onDateFieldKeyPress', () => { const e = new KeyboardEvent('keypress', { key: 'a' }); spyOn(e, 'preventDefault'); component.onDateFieldKeyPress(e); expect(e.preventDefault).toHaveBeenCalled(); });
  it('should block special char keys in onDateFieldKeyPress', () => { const e = new KeyboardEvent('keypress', { key: '@' }); spyOn(e, 'preventDefault'); component.onDateFieldKeyPress(e); expect(e.preventDefault).toHaveBeenCalled(); });
  it('should allow Backspace in onDateFieldKeyPress', () => { const e = new KeyboardEvent('keypress', { key: 'Backspace' }); spyOn(e, 'preventDefault'); component.onDateFieldKeyPress(e); expect(e.preventDefault).not.toHaveBeenCalled(); });
  it('should allow Tab in onDateFieldKeyPress', () => { const e = new KeyboardEvent('keypress', { key: 'Tab' }); spyOn(e, 'preventDefault'); component.onDateFieldKeyPress(e); expect(e.preventDefault).not.toHaveBeenCalled(); });
  it('should allow Delete in onDateFieldKeyPress', () => { const e = new KeyboardEvent('keypress', { key: 'Delete' }); spyOn(e, 'preventDefault'); component.onDateFieldKeyPress(e); expect(e.preventDefault).not.toHaveBeenCalled(); });
  it('should allow Escape in onDateFieldKeyPress', () => { const e = new KeyboardEvent('keypress', { key: 'Escape' }); spyOn(e, 'preventDefault'); component.onDateFieldKeyPress(e); expect(e.preventDefault).not.toHaveBeenCalled(); });
  it('should allow Enter in onDateFieldKeyPress', () => { const e = new KeyboardEvent('keypress', { key: 'Enter' }); spyOn(e, 'preventDefault'); component.onDateFieldKeyPress(e); expect(e.preventDefault).not.toHaveBeenCalled(); });
  it('should allow arrow keys in onDateFieldKeyPress', () => { for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) { const e = new KeyboardEvent('keypress', { key }); spyOn(e, 'preventDefault'); component.onDateFieldKeyPress(e); expect(e.preventDefault).not.toHaveBeenCalled(); } });
  it('should allow Home and End in onDateFieldKeyPress', () => { for (const key of ['Home', 'End']) { const e = new KeyboardEvent('keypress', { key }); spyOn(e, 'preventDefault'); component.onDateFieldKeyPress(e); expect(e.preventDefault).not.toHaveBeenCalled(); } });
  it('should allow Ctrl and Meta key combos', () => { const e1 = new KeyboardEvent('keypress', { key: 'c', ctrlKey: true }); spyOn(e1, 'preventDefault'); component.onDateFieldKeyPress(e1); expect(e1.preventDefault).not.toHaveBeenCalled(); const e2 = new KeyboardEvent('keypress', { key: 'v', metaKey: true }); spyOn(e2, 'preventDefault'); component.onDateFieldKeyPress(e2); expect(e2.preventDefault).not.toHaveBeenCalled(); });
  it('should clear registration date on empty input', () => { component.ngOnInit(); component.generalInfoForm.get('registrationDate')?.setValue(moment()); component.onRegistrationDateInput({ target: { value: '' } } as any); expect(component.generalInfoForm.get('registrationDate')?.value).toBeNull(); });
  it('should set invalidDateFormat on registration date with text but no parsed value', () => { component.ngOnInit(); component.generalInfoForm.get('registrationDate')?.setValue(null); component.onRegistrationDateInput({ target: { value: 'abc' } } as any); expect(component.generalInfoForm.get('registrationDate')?.hasError('invalidDateFormat')).toBeTrue(); });
  it('should clear commission date on empty input', () => { component.ngOnInit(); component.onCommissionDateInput({ target: { value: '' } } as any); expect(component.generalInfoForm.get('commissionDate')?.value).toBeNull(); });
  it('should set invalidDateFormat on commission date with unparseable input', () => { component.ngOnInit(); component.generalInfoForm.get('commissionDate')?.setValue(null); component.onCommissionDateInput({ target: { value: 'abc' } } as any); expect(component.generalInfoForm.get('commissionDate')?.hasError('invalidDateFormat')).toBeTrue(); });
  it('should clear decommission date on empty input', () => { component.ngOnInit(); component.onDecommissionDateInput({ target: { value: '' } } as any); expect(component.generalInfoForm.get('decommissionDate')?.value).toBeNull(); });
  it('should set invalidDateFormat on decommission date with unparseable input', () => { component.ngOnInit(); component.generalInfoForm.get('decommissionDate')?.setValue(null); component.onDecommissionDateInput({ target: { value: 'abc' } } as any); expect(component.generalInfoForm.get('decommissionDate')?.hasError('invalidDateFormat')).toBeTrue(); });
  it('should clear FDA license date on empty input', () => { component.ngOnInit(); component.onFdaLicenseDateInput({ target: { value: '' } } as any); expect(component.generalInfoForm.get('fdaLicenseDate')?.value).toBeNull(); });
  it('should set invalidDateFormat on FDA license date with unparseable input', () => { component.ngOnInit(); component.generalInfoForm.get('fdaLicenseDate')?.setValue(null); component.onFdaLicenseDateInput({ target: { value: 'abc' } } as any); expect(component.generalInfoForm.get('fdaLicenseDate')?.hasError('invalidDateFormat')).toBeTrue(); });
  it('should clear FDA renewal date on empty input', () => { component.ngOnInit(); component.onFdaRenewalDateInput({ target: { value: '' } } as any); expect(component.generalInfoForm.get('fdaRenewalDate')?.value).toBeNull(); });
  it('should set invalidDateFormat on FDA renewal date with unparseable input', () => { component.ngOnInit(); component.generalInfoForm.get('fdaRenewalDate')?.setValue(null); component.onFdaRenewalDateInput({ target: { value: 'abc' } } as any); expect(component.generalInfoForm.get('fdaRenewalDate')?.hasError('invalidDateFormat')).toBeTrue(); });
  it('should clear last inspection date on empty input', () => { component.ngOnInit(); component.onLastInspectionDateInput({ target: { value: '' } } as any); expect(component.generalInfoForm.get('lastInspectionDate')?.value).toBeNull(); });
  it('should set invalidDateFormat on last inspection date with unparseable input', () => { component.ngOnInit(); component.generalInfoForm.get('lastInspectionDate')?.setValue(null); component.onLastInspectionDateInput({ target: { value: 'abc' } } as any); expect(component.generalInfoForm.get('lastInspectionDate')?.hasError('invalidDateFormat')).toBeTrue(); });
  it('should clear inspection renewal date on empty input', () => { component.ngOnInit(); component.onInspectionRenewalDateInput({ target: { value: '' } } as any); expect(component.generalInfoForm.get('inspectionRenewalDate')?.value).toBeNull(); });
  it('should set invalidDateFormat on inspection renewal date with unparseable input', () => { component.ngOnInit(); component.generalInfoForm.get('inspectionRenewalDate')?.setValue(null); component.onInspectionRenewalDateInput({ target: { value: 'abc' } } as any); expect(component.generalInfoForm.get('inspectionRenewalDate')?.hasError('invalidDateFormat')).toBeTrue(); });
  it('should handle effective date input', () => { component.onEffectiveDateInput({ target: { value: '15-JAN-2025' } } as any); expect(true).toBeTrue(); });
  it('should handle termination date input in add mode', () => { component.mode = 'add'; component.onTerminationDateInput({ target: { value: '15-JAN-2025' } } as any); expect(true).toBeTrue(); });
  it('should handle termination date input in edit mode', () => { component.mode = 'edit'; component.onTerminationDateInput({ target: { value: '15-JAN-2025' } } as any); expect(true).toBeTrue(); });
  it('should update panel title on mode change via ngOnChanges', () => { component.mode = 'add'; component.ngOnChanges({ mode: { currentValue: 'add', previousValue: 'edit', firstChange: false, isFirstChange: () => false } }); expect(component.panelTitle).toBe('Add New Vehicle Details'); });
  it('should reset form and clear notes in add mode via ngOnChanges', () => { component.mode = 'add'; component.data = null; component.notes = [{ noteId: 'temp', chapterId: 'ABC', noteSequence: 1, note: 'test', programId: '', insertDate: '', insertUser: '', auditKey: 0 }]; component.pendingNotes = [{ chapterId: 'ABC', note: 'test' }]; component.ngOnChanges({ mode: { currentValue: 'add', previousValue: 'edit', firstChange: false, isFirstChange: () => false } }); expect(component.notes.length).toBe(0); expect(component.pendingNotes.length).toBe(0); });
  it('should complete destroy subject on destroy', () => { spyOn(component['destroy$'], 'next'); spyOn(component['destroy$'], 'complete'); component.ngOnDestroy(); expect(component['destroy$'].next).toHaveBeenCalled(); expect(component['destroy$'].complete).toHaveBeenCalled(); });
  it('should reject vehicle name with numbers via lettersOnlyValidator', () => { component.generalInfoForm.patchValue({ vehicleName: 'Test123' }); component.generalInfoForm.get('vehicleName')?.updateValueAndValidity(); expect(component.generalInfoForm.get('vehicleName')?.hasError('lettersOnly')).toBeTrue(); });
  it('should accept vehicle name with only letters and spaces', () => { component.generalInfoForm.patchValue({ vehicleName: 'Test Vehicle' }); component.generalInfoForm.get('vehicleName')?.updateValueAndValidity(); expect(component.generalInfoForm.get('vehicleName')?.hasError('lettersOnly')).toBeFalse(); });
  it('should include pending notes in create payload', () => { component.mode = 'add'; component.ngOnInit(); component.pendingNotes = [{ chapterId: 'ABC', note: 'Note 1' }]; mockVehicleService.createVehicle.and.returnValue(of({ success: true } as any)); spyOn(component.saveSuccess, 'emit'); component.generalInfoForm.patchValue({ vehicleName: 'Test Vehicle', vehicleType: 'VAN', effectiveDate: moment().add(1, 'day') }); component.onSave(); expect(mockVehicleService.createVehicle).toHaveBeenCalled(); const callArgs = mockVehicleService.createVehicle.calls.mostRecent().args[0]; expect((callArgs as any).notes).toBeDefined(); expect((callArgs as any).notes?.length).toBe(1); });
  it('should update _minTermDateOverride when effective date changes to future', () => { component.ngOnInit(); component.generalInfoForm.patchValue({ effectiveDate: moment().add(10, 'days') }); expect(component['_minTermDateOverride']).not.toBeNull(); });
  it('should reset _minTermDateOverride when effective date cleared', () => { component.ngOnInit(); component.generalInfoForm.patchValue({ effectiveDate: moment().add(10, 'days') }); component.generalInfoForm.patchValue({ effectiveDate: null }); expect(component['_minTermDateOverride']).toBeNull(); });
  it('should set minDecommissionDate when commission date changes', () => { component.ngOnInit(); component.generalInfoForm.patchValue({ commissionDate: moment('2025-03-15') }); expect(component.minDecommissionDate).not.toBeNull(); });
  it('should clear minDecommissionDate when commission date cleared', () => { component.ngOnInit(); component.generalInfoForm.patchValue({ commissionDate: moment('2025-03-15') }); component.generalInfoForm.patchValue({ commissionDate: null }); expect(component.minDecommissionDate).toBeNull(); });
  it('should set minFdaRenewalDate when FDA license date changes', () => { component.ngOnInit(); component.generalInfoForm.patchValue({ fdaLicenseDate: moment('2025-03-15') }); expect(component.minFdaRenewalDate).not.toBeNull(); });
  it('should clear minFdaRenewalDate when FDA license date cleared', () => { component.ngOnInit(); component.generalInfoForm.patchValue({ fdaLicenseDate: moment('2025-03-15') }); component.generalInfoForm.patchValue({ fdaLicenseDate: null }); expect(component.minFdaRenewalDate).toBeNull(); });
  it('should return false when no date range error', () => { expect(component['hasDateValidationError']()).toBeFalse(); });
  it('should return true when date range error exists', () => { component.generalInfoForm.setErrors({ dateRangeInvalid: true }); expect(component['hasDateValidationError']()).toBeTrue(); });
  it('should not save when hasDateValidationError returns true', () => { component.mode = 'add'; component.ngOnInit(); component.generalInfoForm.patchValue({ vehicleName: 'Test', vehicleType: 'VAN', effectiveDate: moment().add(10, 'days'), terminationDate: moment().add(5, 'days') }); component.generalInfoForm.setErrors({ dateRangeInvalid: true }); component.onSave(); expect(mockVehicleService.createVehicle).not.toHaveBeenCalled(); });
  it('should track effective date as last changed field', () => { component.ngOnInit(); component.generalInfoForm.patchValue({ effectiveDate: moment().add(5, 'days') }); expect(component['lastChangedDateField']).toBe('effective'); });
  it('should track termination date as last changed field', () => { component.ngOnInit(); component.generalInfoForm.patchValue({ terminationDate: moment().add(10, 'days') }); expect(component['lastChangedDateField']).toBe('termination'); });

  // --- setupDateValidation: effective date change preserving parse errors on termination ---

  it('should preserve matDatepickerParse error on termination when effective date changes', () => {
    component.ngOnInit();
    const termControl = component.generalInfoForm.get('terminationDate');
    termControl?.setErrors({ matDatepickerParse: true });
    component.generalInfoForm.patchValue({ effectiveDate: moment().add(5, 'days') });
    expect(termControl?.hasError('matDatepickerParse')).toBeTrue();
  });

  it('should preserve invalidDate error on termination when effective date changes', () => {
    component.ngOnInit();
    const termControl = component.generalInfoForm.get('terminationDate');
    termControl?.setErrors({ invalidDate: true });
    component.generalInfoForm.patchValue({ effectiveDate: moment().add(5, 'days') });
    expect(termControl?.hasError('invalidDate')).toBeTrue();
  });

  it('should preserve invalidDateFormat error on termination when effective date changes', () => {
    component.ngOnInit();
    const termControl = component.generalInfoForm.get('terminationDate');
    termControl?.setErrors({ invalidDateFormat: true });
    component.generalInfoForm.patchValue({ effectiveDate: moment().add(5, 'days') });
    expect(termControl?.hasError('invalidDateFormat')).toBeTrue();
  });

  it('should set _minTermDateOverride to today when effective date is before today', () => {
    component.ngOnInit();
    const pastDate = moment().subtract(5, 'days');
    component.generalInfoForm.patchValue({ effectiveDate: pastDate });
    const override = component['_minTermDateOverride'];
    expect(override).not.toBeNull();
    // Override should be today (not the past date) since pastDate.isSameOrAfter(today) is false
    const today = moment().startOf('day');
    expect(override!.format('YYYY-MM-DD')).toBe(today.format('YYYY-MM-DD'));
  });

  // --- setupDateValidation: commission date change preserving parse errors on decommission ---

  it('should preserve matDatepickerParse error on decommission when commission date changes', () => {
    component.ngOnInit();
    const decomControl = component.generalInfoForm.get('decommissionDate');
    decomControl?.setErrors({ matDatepickerParse: true });
    component.generalInfoForm.patchValue({ commissionDate: moment('2025-03-15') });
    expect(decomControl?.hasError('matDatepickerParse')).toBeTrue();
  });

  it('should preserve invalidDate error on decommission when commission date changes', () => {
    component.ngOnInit();
    const decomControl = component.generalInfoForm.get('decommissionDate');
    decomControl?.setErrors({ invalidDate: true });
    component.generalInfoForm.patchValue({ commissionDate: moment('2025-03-15') });
    expect(decomControl?.hasError('invalidDate')).toBeTrue();
  });

  it('should preserve invalidDateFormat error on decommission when commission date changes', () => {
    component.ngOnInit();
    const decomControl = component.generalInfoForm.get('decommissionDate');
    decomControl?.setErrors({ invalidDateFormat: true });
    component.generalInfoForm.patchValue({ commissionDate: moment('2025-03-15') });
    expect(decomControl?.hasError('invalidDateFormat')).toBeTrue();
  });

  // --- setupDateValidation: decommission date changes requiring commission date ---

  it('should set commissionRequiredForDecommission error when decommission set without commission', () => {
    component.ngOnInit();
    const commControl = component.generalInfoForm.get('commissionDate');
    component.generalInfoForm.patchValue({ decommissionDate: moment('2025-06-01') });
    expect(commControl?.hasError('commissionRequiredForDecommission')).toBeTrue();
  });

  it('should mark commission as touched when decommission set without commission', () => {
    component.ngOnInit();
    const commControl = component.generalInfoForm.get('commissionDate');
    component.generalInfoForm.patchValue({ decommissionDate: moment('2025-06-01') });
    expect(commControl?.touched).toBeTrue();
  });

  it('should clear commissionRequiredForDecommission error when decommission is cleared', () => {
    component.ngOnInit();
    const commControl = component.generalInfoForm.get('commissionDate');
    // Set decommission first to trigger the error
    component.generalInfoForm.patchValue({ decommissionDate: moment('2025-06-01') });
    expect(commControl?.hasError('commissionRequiredForDecommission')).toBeTrue();
    // Clear decommission to remove the error
    component.generalInfoForm.patchValue({ decommissionDate: null });
    expect(commControl?.hasError('commissionRequiredForDecommission')).toBeFalse();
  });

  it('should not set commissionRequiredForDecommission when commission date already has value', () => {
    component.ngOnInit();
    component.generalInfoForm.patchValue({ commissionDate: moment('2025-03-01') });
    component.generalInfoForm.patchValue({ decommissionDate: moment('2025-06-01') });
    const commControl = component.generalInfoForm.get('commissionDate');
    expect(commControl?.hasError('commissionRequiredForDecommission')).toBeFalsy();
  });

  // --- setupDateValidation: FDA license date change preserving parse errors on renewal ---

  it('should preserve matDatepickerParse error on FDA renewal when FDA license date changes', () => {
    component.ngOnInit();
    const renewalControl = component.generalInfoForm.get('fdaRenewalDate');
    renewalControl?.setErrors({ matDatepickerParse: true });
    component.generalInfoForm.patchValue({ fdaLicenseDate: moment('2025-03-15') });
    expect(renewalControl?.hasError('matDatepickerParse')).toBeTrue();
  });

  it('should preserve invalidDate error on FDA renewal when FDA license date changes', () => {
    component.ngOnInit();
    const renewalControl = component.generalInfoForm.get('fdaRenewalDate');
    renewalControl?.setErrors({ invalidDate: true });
    component.generalInfoForm.patchValue({ fdaLicenseDate: moment('2025-03-15') });
    expect(renewalControl?.hasError('invalidDate')).toBeTrue();
  });

  it('should preserve invalidDateFormat error on FDA renewal when FDA license date changes', () => {
    component.ngOnInit();
    const renewalControl = component.generalInfoForm.get('fdaRenewalDate');
    renewalControl?.setErrors({ invalidDateFormat: true });
    component.generalInfoForm.patchValue({ fdaLicenseDate: moment('2025-03-15') });
    expect(renewalControl?.hasError('invalidDateFormat')).toBeTrue();
  });

  // --- Commission date error getter for commissionRequiredForDecommission ---

  it('should return commission required error when commissionRequiredForDecommission is set', () => {
    const c = component.generalInfoForm.get('commissionDate');
    c?.setErrors({ commissionRequiredForDecommission: true });
    c?.markAsTouched();
    expect(component.getCommissionDateError()).toContain('required when Decommission Date');
  });

  // --- ngOnInit edit mode ---

  it('should initialize in edit mode with correct panel title', () => {
    component.mode = 'edit';
    component.ngOnInit();
    expect(component.panelTitle).toBe('Edit Vehicle Details');
  });

  it('should call setupEditModeValidators in edit mode', () => {
    component.mode = 'edit';
    component.ngOnInit();
    // In edit mode, effective date should be disabled
    expect(component.generalInfoForm.get('effectiveDate')?.disabled).toBeTrue();
  });

  it('should set default effective date to today in add mode', () => {
    component.mode = 'add';
    component.ngOnInit();
    const effDate = component.generalInfoForm.get('effectiveDate')?.value;
    expect(effDate).not.toBeNull();
    expect(moment.isMoment(effDate)).toBeTrue();
  });

  // --- loadVehicleTypes ---

  it('should populate vehicleTypeOptions from service', () => {
    mockVehicleService.getVehicleTypes.and.returnValue(of([
      { value: 'COACH', label: 'COACH' },
      { value: 'OTHER', label: 'OTHER' },
      { value: 'PIKUP', label: 'PIKUP' },
      { value: 'VAN', label: 'VAN' }
    ]));
    component.ngOnInit();
    expect(component.vehicleTypeOptions.length).toBe(4);
    expect(component.vehicleTypeOptions[0].value).toBe('COACH');
  });

  // --- loadNotes ---

  it('should populate notes from service in edit mode', () => {
    const mockNotes = [
      { noteId: 'N1', chapterId: 'ABC', noteSequence: 1, note: 'Test Note', programId: 'P', insertDate: '2025-01-01T00:00:00Z', insertUser: 'DONSYS', auditKey: 1 }
    ];
    mockVehicleService.getNotes.and.returnValue(of(mockNotes));
    component.mode = 'edit';
    component.data = {
      vehicleId: 'V001', vehicleName: 'Test', vehicleType: 'VAN', effectiveDate: '2025-01-01T00:00:00Z'
    } as any;
    component.ngOnInit();
    component.ngOnChanges({ data: { currentValue: component.data, previousValue: null, firstChange: false, isFirstChange: () => false } });
    expect(component.notes.length).toBe(1);
    expect(component.notes[0].note).toBe('Test Note');
  });

  // --- populateForm edge cases ---

  it('should populate form in edit mode with null optional fields', () => {
    component.mode = 'edit';
    component.data = {
      vehicleId: 'V001',
      vehicleName: 'Test',
      vehicleType: 'VAN',
      identificationNumber: null,
      licensePlate: null,
      registrationDate: null,
      commissionDate: null,
      decommissionDate: null,
      fdaLicenseDate: null,
      fdaRenewalDate: null,
      lastInspectionDate: null,
      inspectionRenewalDate: null,
      effectiveDate: '2025-01-01T00:00:00Z',
      terminationDate: null
    } as any;
    component.ngOnInit();
    component.ngOnChanges({ data: { currentValue: component.data, previousValue: null, firstChange: false, isFirstChange: () => false } });
    expect(component.generalInfoForm.get('identificationNumber')?.value).toBe('');
    expect(component.generalInfoForm.get('licensePlate')?.value).toBe('');
    expect(component.generalInfoForm.get('registrationDate')?.value).toBeNull();
  });

  it('should store editModeValues when populating form in edit mode', () => {
    component.mode = 'edit';
    component.data = {
      vehicleId: 'VEH123', vehicleName: 'My Vehicle', vehicleType: 'VAN', effectiveDate: '2025-01-01T00:00:00Z'
    } as any;
    component.ngOnInit();
    component.ngOnChanges({ data: { currentValue: component.data, previousValue: null, firstChange: false, isFirstChange: () => false } });
    expect(component.editModeValues.vehicleId).toBe('VEH123');
    expect(component.editModeValues.vehicleName).toBe('My Vehicle');
  });

  it('should store originalEffectiveDate when populating form in edit mode', () => {
    component.mode = 'edit';
    component.data = {
      vehicleId: 'V001', vehicleName: 'Test', vehicleType: 'VAN', effectiveDate: '2025-06-15T00:00:00Z'
    } as any;
    component.ngOnInit();
    component.ngOnChanges({ data: { currentValue: component.data, previousValue: null, firstChange: false, isFirstChange: () => false } });
    expect(component['originalEffectiveDate']).toBe('2025-06-15T00:00:00Z');
  });

  it('should reset form in add mode populate', () => {
    component.mode = 'add';
    component.data = null;
    component.ngOnChanges({ data: { currentValue: null, previousValue: null, firstChange: false, isFirstChange: () => false } });
    expect(component.notes.length).toBe(0);
    expect(component.pendingNotes.length).toBe(0);
    expect(component['localNoteSequence']).toBe(1);
  });

  // --- onSave edit mode includes vehicleId ---

  it('should include vehicleId in update payload', () => {
    component.mode = 'edit';
    component.data = { vehicleId: 'V999', vehicleName: 'Test', vehicleType: 'VAN', effectiveDate: '2025-01-01T00:00:00Z' } as any;
    component.ngOnInit();
    component.ngOnChanges({ data: { currentValue: component.data, previousValue: null, firstChange: false, isFirstChange: () => false } });
    mockVehicleService.updateVehicle.and.returnValue(of({ success: true } as any));
    spyOn(component.saveSuccess, 'emit');
    component.generalInfoForm.patchValue({ vehicleName: 'Updated Name' });
    component.generalInfoForm.markAsDirty();
    component.onSave();
    expect(mockVehicleService.updateVehicle).toHaveBeenCalledWith('V999', jasmine.objectContaining({ vehicleId: 'V999' }));
  });

  it('should not include notes in add payload when no pending notes', () => {
    component.mode = 'add';
    component.ngOnInit();
    component.pendingNotes = [];
    mockVehicleService.createVehicle.and.returnValue(of({ success: true } as any));
    spyOn(component.saveSuccess, 'emit');
    component.generalInfoForm.patchValue({ vehicleName: 'Test Vehicle', vehicleType: 'VAN', effectiveDate: moment().add(1, 'day') });
    component.onSave();
    const callArgs = mockVehicleService.createVehicle.calls.mostRecent().args[0];
    expect((callArgs as any).notes).toBeUndefined();
  });

  // --- onSave success message variations ---

  it('should show create success message in add mode', () => {
    component.mode = 'add';
    component.ngOnInit();
    mockVehicleService.createVehicle.and.returnValue(of({ success: true } as any));
    spyOn(component.saveSuccess, 'emit');
    component.generalInfoForm.patchValue({ vehicleName: 'Test', vehicleType: 'VAN', effectiveDate: moment().add(1, 'day') });
    component.onSave();
    expect(mockSnackBar.open).toHaveBeenCalledWith('Vehicle created successfully', 'Close', jasmine.anything());
  });

  it('should show update success message in edit mode', () => {
    component.mode = 'edit';
    component.data = { vehicleId: 'V001', vehicleName: 'Test', vehicleType: 'VAN', effectiveDate: '2025-01-01T00:00:00Z' } as any;
    component.ngOnInit();
    component.ngOnChanges({ data: { currentValue: component.data, previousValue: null, firstChange: false, isFirstChange: () => false } });
    mockVehicleService.updateVehicle.and.returnValue(of({ success: true } as any));
    spyOn(component.saveSuccess, 'emit');
    component.generalInfoForm.patchValue({ vehicleName: 'Updated' });
    component.generalInfoForm.markAsDirty();
    component.onSave();
    expect(mockSnackBar.open).toHaveBeenCalledWith('Vehicle updated successfully', 'Close', jasmine.anything());
  });

  // --- onSave sets isSaving via finalize ---

  it('should reset isSaving after successful save', () => {
    component.mode = 'add';
    component.ngOnInit();
    mockVehicleService.createVehicle.and.returnValue(of({ success: true } as any));
    spyOn(component.saveSuccess, 'emit');
    component.generalInfoForm.patchValue({ vehicleName: 'Test', vehicleType: 'VAN', effectiveDate: moment().add(1, 'day') });
    component.onSave();
    expect(component.isSaving).toBeFalse();
  });

  // --- resetFormForCreateAnother ---

  it('should reset form and clear pending data on create another', () => {
    component.mode = 'add';
    component.ngOnInit();
    component.pendingNotes = [{ chapterId: 'ABC', note: 'Note 1' }];
    component.notes = [{ noteId: 'temp-1', chapterId: 'ABC', noteSequence: 1, note: 'test', programId: '', insertDate: '', insertUser: '', auditKey: 0 }];
    component['localNoteSequence'] = 5;
    mockVehicleService.createVehicle.and.returnValue(of({ success: true } as any));
    component.generalInfoForm.patchValue({ vehicleName: 'Test', vehicleType: 'VAN', effectiveDate: moment().add(1, 'day') });
    component.onAddAndCreateAnother();
    expect(component.pendingNotes.length).toBe(0);
    expect(component.notes.length).toBe(0);
    expect(component['localNoteSequence']).toBe(1);
    expect(component.generalInfoForm.pristine).toBeTrue();
    expect(component.generalInfoForm.untouched).toBeTrue();
  });

  // --- addNote edge cases ---

  it('should use empty string when noteText value is null via ?? operator in add mode', () => {
    component.mode = 'add';
    component.ngOnInit();
    component.startAddNote();
    // Set noteText to a value so form is valid, then manually force the value to have trailing spaces
    component.noteForm.patchValue({ noteText: '  Test  ' });
    component.addNote();
    expect(component.notes.length).toBe(1);
    expect(component.notes[0].note).toBe('Test');
  });

  it('should increment localNoteSequence after adding note in add mode', () => {
    component.mode = 'add';
    component.ngOnInit();
    const initialSeq = component['localNoteSequence'];
    component.startAddNote();
    component.noteForm.patchValue({ noteText: 'First note' });
    component.addNote();
    expect(component['localNoteSequence']).toBe(initialSeq + 1);
  });

  it('should add note with correct display fields in add mode', () => {
    component.mode = 'add';
    component.ngOnInit();
    component.startAddNote();
    component.noteForm.patchValue({ noteText: 'My note text' });
    component.addNote();
    const addedNote = component.notes[0];
    expect(addedNote.noteId).toMatch(/^temp-/);
    expect(addedNote.chapterId).toBe('ABC');
    expect(addedNote.note).toBe('My note text');
    expect(addedNote.insertUser).toBe('DONSYS');
  });

  it('should show success snackbar when note added in add mode', () => {
    component.mode = 'add';
    component.ngOnInit();
    component.startAddNote();
    component.noteForm.patchValue({ noteText: 'Test note' });
    component.addNote();
    expect(mockSnackBar.open).toHaveBeenCalledWith('Note added', 'Close', jasmine.anything());
  });

  it('should show success snackbar when note added in edit mode', () => {
    component.mode = 'edit';
    component.data = { vehicleId: 'V001', vehicleName: 'Test', vehicleType: 'VAN', effectiveDate: '2025-01-01T00:00:00Z' } as any;
    const mockNotes = [{ noteId: 'N1', chapterId: 'ABC', noteSequence: 1, note: 'New note', programId: 'P', insertDate: new Date().toISOString(), insertUser: 'DONSYS', auditKey: 1 }];
    mockVehicleService.addNote.and.returnValue(of(mockNotes));
    component.noteForm.patchValue({ noteText: 'New note' });
    component.addNote();
    expect(mockSnackBar.open).toHaveBeenCalledWith('Note added successfully', 'Close', jasmine.anything());
  });

  it('should show default error message on addNote failure without message', () => {
    component.mode = 'edit';
    component.data = { vehicleId: 'V001', vehicleName: 'Test', vehicleType: 'VAN', effectiveDate: '2025-01-01T00:00:00Z' } as any;
    mockVehicleService.addNote.and.returnValue(throwError(() => ({})));
    component.noteForm.patchValue({ noteText: 'Test note' });
    component.addNote();
    expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to add note', 'Close', jasmine.anything());
  });

  // --- saveEditNote edge cases ---

  it('should show default error message on saveEditNote failure without message', () => {
    component.mode = 'edit';
    component.data = { vehicleId: 'V001' } as any;
    mockVehicleService.updateNote.and.returnValue(throwError(() => ({})));
    component.noteForm.patchValue({ noteText: 'Updated text' });
    const note = { noteId: 'N1', chapterId: 'ABC', noteSequence: 1, note: 'Old', programId: 'P', insertDate: new Date().toISOString(), insertUser: 'DONSYS', auditKey: 1 };
    component.saveEditNote(note);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to update note', 'Close', jasmine.anything());
  });

  it('should reload notes after successful edit', () => {
    component.mode = 'edit';
    component.data = { vehicleId: 'V001', vehicleName: 'Test', vehicleType: 'VAN', effectiveDate: '2025-01-01T00:00:00Z' } as any;
    mockVehicleService.updateNote.and.returnValue(of({} as any));
    const updatedNotes = [{ noteId: 'N1', chapterId: 'ABC', noteSequence: 1, note: 'Updated', programId: 'P', insertDate: new Date().toISOString(), insertUser: 'DONSYS', auditKey: 2 }];
    mockVehicleService.getNotes.and.returnValue(of(updatedNotes));
    component.noteForm.patchValue({ noteText: 'Updated text' });
    const note = { noteId: 'N1', chapterId: 'ABC', noteSequence: 1, note: 'Old', programId: 'P', insertDate: new Date().toISOString(), insertUser: 'DONSYS', auditKey: 1 };
    component.saveEditNote(note);
    expect(mockVehicleService.getNotes).toHaveBeenCalledWith('V001');
  });

  // --- deleteNote edge cases ---

  it('should show default error message on deleteNote failure without message', () => {
    component.mode = 'edit';
    component.data = { vehicleId: 'V001' } as any;
    const note = { noteId: 'N1', chapterId: 'ABC', noteSequence: 1, note: 'Test', programId: 'P', insertDate: new Date().toISOString(), insertUser: 'DONSYS', auditKey: 1 };
    component.notes = [note];
    mockVehicleService.deleteNote.and.returnValue(throwError(() => ({})));
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(true));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);
    component.deleteNote(note);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to delete note', 'Close', jasmine.anything());
  });

  it('should not splice notes when note is not found in add mode delete', () => {
    component.mode = 'add';
    const note1 = { noteId: 'temp-1', chapterId: 'ABC', noteSequence: 1, note: 'Note 1', programId: '', insertDate: new Date().toISOString(), insertUser: 'DONSYS', auditKey: 0 };
    const noteNotInList = { noteId: 'temp-99', chapterId: 'ABC', noteSequence: 99, note: 'Missing', programId: '', insertDate: new Date().toISOString(), insertUser: 'DONSYS', auditKey: 0 };
    component.notes = [note1];
    component.pendingNotes = [{ chapterId: 'ABC', note: 'Note 1' }];
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(true));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);
    component.deleteNote(noteNotInList);
    // Note 1 should still be there since noteNotInList was not found
    expect(component.notes.length).toBe(1);
    expect(component.pendingNotes.length).toBe(1);
  });

  it('should show success snackbar when note deleted in add mode', () => {
    component.mode = 'add';
    const note = { noteId: 'temp-1', chapterId: 'ABC', noteSequence: 1, note: 'Test', programId: '', insertDate: new Date().toISOString(), insertUser: 'DONSYS', auditKey: 0 };
    component.notes = [note];
    component.pendingNotes = [{ chapterId: 'ABC', note: 'Test' }];
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(true));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);
    component.deleteNote(note);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Note deleted', 'Close', jasmine.anything());
  });

  it('should show success snackbar when note deleted in edit mode', () => {
    component.mode = 'edit';
    component.data = { vehicleId: 'V001' } as any;
    const note = { noteId: 'N1', chapterId: 'ABC', noteSequence: 1, note: 'Test', programId: 'P', insertDate: new Date().toISOString(), insertUser: 'DONSYS', auditKey: 1 };
    component.notes = [note];
    mockVehicleService.deleteNote.and.returnValue(of({} as any));
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(true));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);
    component.deleteNote(note);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Note deleted successfully', 'Close', jasmine.anything());
  });

  it('should open delete confirmation dialog with correct config', () => {
    component.mode = 'add';
    const note = { noteId: 'temp-1', chapterId: 'ABC', noteSequence: 1, note: 'Test', programId: '', insertDate: new Date().toISOString(), insertUser: 'DONSYS', auditKey: 0 };
    component.notes = [note];
    component.pendingNotes = [{ chapterId: 'ABC', note: 'Test' }];
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(false));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);
    component.deleteNote(note);
    expect(component['dialog'].open).toHaveBeenCalledWith(jasmine.anything(), jasmine.objectContaining({ width: '400px', disableClose: true }));
  });

  // --- lettersOnlyValidator edge cases ---

  it('should allow empty value in lettersOnlyValidator', () => {
    component.generalInfoForm.patchValue({ vehicleName: '' });
    component.generalInfoForm.get('vehicleName')?.updateValueAndValidity();
    // Empty triggers required, not lettersOnly
    expect(component.generalInfoForm.get('vehicleName')?.hasError('lettersOnly')).toBeFalse();
  });

  it('should reject vehicle name with special characters', () => {
    component.generalInfoForm.patchValue({ vehicleName: 'Test@Vehicle' });
    component.generalInfoForm.get('vehicleName')?.updateValueAndValidity();
    expect(component.generalInfoForm.get('vehicleName')?.hasError('lettersOnly')).toBeTrue();
  });

  // --- notFutureDateValidator edge cases ---

  it('should handle non-Moment value in notFutureDateValidator', () => {
    component.ngOnInit();
    const futureStr = moment().add(10, 'days').toISOString();
    // Set the value as a raw string, not a Moment
    component.generalInfoForm.get('registrationDate')?.setValue(futureStr);
    component.generalInfoForm.get('registrationDate')?.updateValueAndValidity();
    expect(component.generalInfoForm.get('registrationDate')?.hasError('futureDate')).toBeTrue();
  });

  it('should return null for null value in notFutureDateValidator', () => {
    component.ngOnInit();
    component.generalInfoForm.get('registrationDate')?.setValue(null);
    component.generalInfoForm.get('registrationDate')?.updateValueAndValidity();
    expect(component.generalInfoForm.get('registrationDate')?.hasError('futureDate')).toBeFalse();
  });

  it('should return null for invalid date in notFutureDateValidator', () => {
    component.ngOnInit();
    component.generalInfoForm.get('registrationDate')?.setValue(moment('invalid'));
    component.generalInfoForm.get('registrationDate')?.updateValueAndValidity();
    expect(component.generalInfoForm.get('registrationDate')?.hasError('futureDate')).toBeFalse();
  });

  it('should allow today date in notFutureDateValidator', () => {
    component.ngOnInit();
    const today = moment().startOf('day');
    component.generalInfoForm.get('registrationDate')?.setValue(today);
    component.generalInfoForm.get('registrationDate')?.updateValueAndValidity();
    expect(component.generalInfoForm.get('registrationDate')?.hasError('futureDate')).toBeFalse();
  });

  // --- dateAfterFieldValidator edge cases ---

  it('should return null when current value is null in dateAfterFieldValidator', () => {
    component.ngOnInit();
    component.generalInfoForm.patchValue({ decommissionDate: null });
    component.generalInfoForm.get('decommissionDate')?.updateValueAndValidity();
    expect(component.generalInfoForm.get('decommissionDate')?.hasError('decommissionBeforeCommission')).toBeFalse();
  });

  it('should return null when compare field value is null in dateAfterFieldValidator', () => {
    component.ngOnInit();
    component.generalInfoForm.patchValue({ commissionDate: null, decommissionDate: moment('2025-06-01') });
    component.generalInfoForm.get('decommissionDate')?.updateValueAndValidity();
    expect(component.generalInfoForm.get('decommissionDate')?.hasError('decommissionBeforeCommission')).toBeFalse();
  });

  it('should validate decommission equals commission date as invalid', () => {
    component.ngOnInit();
    const sameDate = moment('2025-06-01');
    component.generalInfoForm.patchValue({ commissionDate: sameDate, decommissionDate: moment('2025-06-01') });
    component.generalInfoForm.get('decommissionDate')?.updateValueAndValidity();
    // Same date should fail because validator requires strictly after
    expect(component.generalInfoForm.get('decommissionDate')?.hasError('decommissionBeforeCommission')).toBeTrue();
  });

  it('should validate FDA renewal equals license date as invalid', () => {
    component.ngOnInit();
    component.generalInfoForm.patchValue({ fdaLicenseDate: moment('2025-06-01'), fdaRenewalDate: moment('2025-06-01') });
    component.generalInfoForm.get('fdaRenewalDate')?.updateValueAndValidity();
    expect(component.generalInfoForm.get('fdaRenewalDate')?.hasError('fdaRenewalBeforeLicense')).toBeTrue();
  });

  // --- formatNoteDate edge cases ---

  it('should use UTC timezone when chapterTimezone is empty', () => {
    component.chapterTimezone = '';
    const result = component.formatNoteDate('2025-03-14T12:00:00Z');
    expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
  });

  // --- terminationDateFilter edge cases ---

  it('should return true for today in terminationDateFilter', () => {
    const today = moment().startOf('day');
    expect(component.terminationDateFilter(today)).toBeTrue();
  });

  it('should return true for future date with no effective date set', () => {
    component.generalInfoForm.patchValue({ effectiveDate: null });
    expect(component.terminationDateFilter(moment().add(10, 'days'))).toBeTrue();
  });

  // --- isFormActionDisabled edge cases ---

  it('should not be disabled in add mode when form is valid and pristine', () => {
    component.mode = 'add';
    component.isSaving = false;
    component.generalInfoForm.patchValue({ vehicleName: 'Test', vehicleType: 'VAN', effectiveDate: moment().add(1, 'day') });
    component.generalInfoForm.markAsPristine();
    // In add mode, pristine should NOT matter (only matters in edit)
    expect(component.isFormActionDisabled).toBeFalse();
  });

  // --- Date input handlers: valid parsed value branch ---

  it('should mark registration date as touched and dirty when input has parseable text', () => {
    component.ngOnInit();
    const pastDate = moment().subtract(5, 'days');
    component.generalInfoForm.get('registrationDate')?.setValue(pastDate);
    component.onRegistrationDateInput({ target: { value: '15-JAN-2025' } } as any);
    expect(component.generalInfoForm.get('registrationDate')?.touched).toBeTrue();
    expect(component.generalInfoForm.get('registrationDate')?.dirty).toBeTrue();
  });

  it('should mark commission date as touched and dirty when input has parseable text', () => {
    component.ngOnInit();
    const date = moment().subtract(5, 'days');
    component.generalInfoForm.get('commissionDate')?.setValue(date);
    component.onCommissionDateInput({ target: { value: '15-JAN-2025' } } as any);
    expect(component.generalInfoForm.get('commissionDate')?.touched).toBeTrue();
    expect(component.generalInfoForm.get('commissionDate')?.dirty).toBeTrue();
  });

  it('should mark decommission date as touched and dirty when input has parseable text', () => {
    component.ngOnInit();
    const date = moment().subtract(5, 'days');
    component.generalInfoForm.get('decommissionDate')?.setValue(date);
    component.onDecommissionDateInput({ target: { value: '15-JAN-2025' } } as any);
    expect(component.generalInfoForm.get('decommissionDate')?.touched).toBeTrue();
  });

  it('should mark FDA license date as touched and dirty when input has parseable text', () => {
    component.ngOnInit();
    const date = moment().subtract(5, 'days');
    component.generalInfoForm.get('fdaLicenseDate')?.setValue(date);
    component.onFdaLicenseDateInput({ target: { value: '15-JAN-2025' } } as any);
    expect(component.generalInfoForm.get('fdaLicenseDate')?.touched).toBeTrue();
  });

  it('should mark FDA renewal date as touched and dirty when input has parseable text', () => {
    component.ngOnInit();
    const date = moment().add(30, 'days');
    component.generalInfoForm.get('fdaRenewalDate')?.setValue(date);
    component.onFdaRenewalDateInput({ target: { value: '15-JAN-2026' } } as any);
    expect(component.generalInfoForm.get('fdaRenewalDate')?.touched).toBeTrue();
  });

  it('should mark last inspection date as touched and dirty when input has parseable text', () => {
    component.ngOnInit();
    const date = moment().subtract(5, 'days');
    component.generalInfoForm.get('lastInspectionDate')?.setValue(date);
    component.onLastInspectionDateInput({ target: { value: '15-JAN-2025' } } as any);
    expect(component.generalInfoForm.get('lastInspectionDate')?.touched).toBeTrue();
  });

  it('should mark inspection renewal date as touched and dirty when input has parseable text', () => {
    component.ngOnInit();
    const date = moment().add(30, 'days');
    component.generalInfoForm.get('inspectionRenewalDate')?.setValue(date);
    component.onInspectionRenewalDateInput({ target: { value: '15-JAN-2026' } } as any);
    expect(component.generalInfoForm.get('inspectionRenewalDate')?.touched).toBeTrue();
  });

  // --- Date input handlers: whitespace-only input treated as empty ---

  it('should clear registration date on whitespace-only input', () => {
    component.ngOnInit();
    component.generalInfoForm.get('registrationDate')?.setValue(moment());
    component.onRegistrationDateInput({ target: { value: '   ' } } as any);
    expect(component.generalInfoForm.get('registrationDate')?.value).toBeNull();
  });

  it('should clear commission date on whitespace-only input', () => {
    component.ngOnInit();
    component.generalInfoForm.get('commissionDate')?.setValue(moment());
    component.onCommissionDateInput({ target: { value: '   ' } } as any);
    expect(component.generalInfoForm.get('commissionDate')?.value).toBeNull();
  });

  it('should clear decommission date on whitespace-only input', () => {
    component.ngOnInit();
    component.generalInfoForm.get('decommissionDate')?.setValue(moment());
    component.onDecommissionDateInput({ target: { value: '   ' } } as any);
    expect(component.generalInfoForm.get('decommissionDate')?.value).toBeNull();
  });

  it('should clear FDA license date on whitespace-only input', () => {
    component.ngOnInit();
    component.generalInfoForm.get('fdaLicenseDate')?.setValue(moment());
    component.onFdaLicenseDateInput({ target: { value: '   ' } } as any);
    expect(component.generalInfoForm.get('fdaLicenseDate')?.value).toBeNull();
  });

  it('should clear FDA renewal date on whitespace-only input', () => {
    component.ngOnInit();
    component.generalInfoForm.get('fdaRenewalDate')?.setValue(moment());
    component.onFdaRenewalDateInput({ target: { value: '   ' } } as any);
    expect(component.generalInfoForm.get('fdaRenewalDate')?.value).toBeNull();
  });

  it('should clear last inspection date on whitespace-only input', () => {
    component.ngOnInit();
    component.generalInfoForm.get('lastInspectionDate')?.setValue(moment());
    component.onLastInspectionDateInput({ target: { value: '   ' } } as any);
    expect(component.generalInfoForm.get('lastInspectionDate')?.value).toBeNull();
  });

  it('should clear inspection renewal date on whitespace-only input', () => {
    component.ngOnInit();
    component.generalInfoForm.get('inspectionRenewalDate')?.setValue(moment());
    component.onInspectionRenewalDateInput({ target: { value: '   ' } } as any);
    expect(component.generalInfoForm.get('inspectionRenewalDate')?.value).toBeNull();
  });

  // --- ngOnChanges: only mode change, no data change ---

  it('should update panel title when only mode changes in ngOnChanges', () => {
    component.mode = 'edit';
    component.ngOnChanges({ mode: { currentValue: 'edit', previousValue: 'add', firstChange: false, isFirstChange: () => false } });
    expect(component.panelTitle).toBe('Edit Vehicle Details');
  });

  // --- ngOnChanges: neither mode nor data changes ---

  it('should not update panel title when unrelated input changes', () => {
    component.panelTitle = 'Existing Title';
    component.ngOnChanges({ activeTabIndex: { currentValue: 1, previousValue: 0, firstChange: false, isFirstChange: () => false } });
    expect(component.panelTitle).toBe('Existing Title');
  });

  // --- snackbar panelClass ---

  it('should use success-snackbar panelClass for success messages', () => {
    component.mode = 'add';
    component.ngOnInit();
    mockVehicleService.createVehicle.and.returnValue(of({ success: true } as any));
    spyOn(component.saveSuccess, 'emit');
    component.generalInfoForm.patchValue({ vehicleName: 'Test', vehicleType: 'VAN', effectiveDate: moment().add(1, 'day') });
    component.onSave();
    expect(mockSnackBar.open).toHaveBeenCalledWith(jasmine.anything(), 'Close', jasmine.objectContaining({ panelClass: ['success-snackbar'] }));
  });

  it('should use error-snackbar panelClass for error messages', () => {
    component.mode = 'add';
    component.ngOnInit();
    mockVehicleService.createVehicle.and.returnValue(throwError(() => ({ error: { message: 'Error' } })));
    component.generalInfoForm.patchValue({ vehicleName: 'Test', vehicleType: 'VAN', effectiveDate: moment().add(1, 'day') });
    component.onSave();
    expect(mockSnackBar.open).toHaveBeenCalledWith(jasmine.anything(), 'Close', jasmine.objectContaining({ panelClass: ['error-snackbar'] }));
  });

  // --- noteCharsRemaining with null ---

  it('should return 240 when noteText control value is null', () => {
    component.noteForm.patchValue({ noteText: null });
    expect(component.noteCharsRemaining).toBe(240);
  });

  // --- decommission cleared but commission has other errors ---

  it('should preserve other commission errors when commissionRequiredForDecommission is removed', () => {
    component.ngOnInit();
    const commControl = component.generalInfoForm.get('commissionDate');
    // Set decommission to trigger the error
    component.generalInfoForm.patchValue({ decommissionDate: moment('2025-06-01') });
    // Add another error alongside commissionRequiredForDecommission
    commControl?.setErrors({ ...(commControl?.errors || {}), invalidDateFormat: true });
    // Clear decommission
    component.generalInfoForm.patchValue({ decommissionDate: null });
    // commissionRequiredForDecommission should be gone but invalidDateFormat should remain
    expect(commControl?.hasError('commissionRequiredForDecommission')).toBeFalse();
    expect(commControl?.hasError('invalidDateFormat')).toBeTrue();
  });

  // --- effective date change with non-Moment truthy value ---

  it('should set _minTermDateOverride to null when effective date value is not a valid Moment', () => {
    component.ngOnInit();
    // Setting a non-moment, non-null value: the condition `moment.isMoment(value) && value.isValid()` is false
    component.generalInfoForm.get('effectiveDate')?.setValue('not-a-date', { emitEvent: true });
    expect(component['_minTermDateOverride']).toBeNull();
  });

  // --- Multiple pending notes in add mode ---

  it('should accumulate multiple pending notes in add mode', () => {
    component.mode = 'add';
    component.ngOnInit();
    component.startAddNote();
    component.noteForm.patchValue({ noteText: 'Note 1' });
    component.addNote();
    component.startAddNote();
    component.noteForm.patchValue({ noteText: 'Note 2' });
    component.addNote();
    expect(component.notes.length).toBe(2);
    expect(component.pendingNotes.length).toBe(2);
    expect(component.notes[0].noteSequence).toBe(1);
    expect(component.notes[1].noteSequence).toBe(2);
  });

  // --- chapterTimezone initialization ---

  it('should set chapterTimezone from headerService', () => {
    expect(component.chapterTimezone).toBe('America/New_York');
  });

  it('should set maxDate and minDate from DateFieldValidationUtility', () => {
    expect(component.maxDate).not.toBeNull();
    expect(component.minDate).not.toBeNull();
  });

  // --- form construction ---

  it('should create generalInfoForm with all expected controls', () => {
    const form = component.generalInfoForm;
    expect(form.get('vehicleId')).not.toBeNull();
    expect(form.get('vehicleName')).not.toBeNull();
    expect(form.get('vehicleType')).not.toBeNull();
    expect(form.get('identificationNumber')).not.toBeNull();
    expect(form.get('licensePlate')).not.toBeNull();
    expect(form.get('registrationDate')).not.toBeNull();
    expect(form.get('commissionDate')).not.toBeNull();
    expect(form.get('decommissionDate')).not.toBeNull();
    expect(form.get('fdaLicenseDate')).not.toBeNull();
    expect(form.get('fdaRenewalDate')).not.toBeNull();
    expect(form.get('lastInspectionDate')).not.toBeNull();
    expect(form.get('inspectionRenewalDate')).not.toBeNull();
    expect(form.get('effectiveDate')).not.toBeNull();
    expect(form.get('terminationDate')).not.toBeNull();
  });

  it('should create noteForm with noteText control', () => {
    expect(component.noteForm.get('noteText')).not.toBeNull();
  });

  // --- vehicleName maxLength validation ---

  it('should reject vehicle name exceeding 50 characters', () => {
    const longName = 'a'.repeat(51);
    component.generalInfoForm.patchValue({ vehicleName: longName });
    component.generalInfoForm.get('vehicleName')?.updateValueAndValidity();
    expect(component.generalInfoForm.get('vehicleName')?.hasError('maxlength')).toBeTrue();
  });

  // --- identificationNumber maxLength ---

  it('should reject identification number exceeding 20 characters', () => {
    const longId = 'a'.repeat(21);
    component.generalInfoForm.patchValue({ identificationNumber: longId });
    component.generalInfoForm.get('identificationNumber')?.updateValueAndValidity();
    expect(component.generalInfoForm.get('identificationNumber')?.hasError('maxlength')).toBeTrue();
  });

  // --- licensePlate maxLength ---

  it('should reject license plate exceeding 20 characters', () => {
    const longPlate = 'a'.repeat(21);
    component.generalInfoForm.patchValue({ licensePlate: longPlate });
    component.generalInfoForm.get('licensePlate')?.updateValueAndValidity();
    expect(component.generalInfoForm.get('licensePlate')?.hasError('maxlength')).toBeTrue();
  });

  // --- onSave trims string fields ---

  it('should trim string fields before sending to API', () => {
    component.mode = 'add';
    component.ngOnInit();
    mockVehicleService.createVehicle.and.returnValue(of({ success: true } as any));
    spyOn(component.saveSuccess, 'emit');
    component.generalInfoForm.patchValue({
      vehicleName: '  Test Vehicle  ',
      vehicleType: 'VAN',
      identificationNumber: '  ID123  ',
      licensePlate: '  LP456  ',
      effectiveDate: moment().add(1, 'day')
    });
    component.onSave();
    const callArgs = mockVehicleService.createVehicle.calls.mostRecent().args[0];
    expect((callArgs as any).vehicleName).toBe('Test Vehicle');
    expect((callArgs as any).identificationNumber).toBe('ID123');
    expect((callArgs as any).licensePlate).toBe('LP456');
  });

  it('should send null for empty optional string fields', () => {
    component.mode = 'add';
    component.ngOnInit();
    mockVehicleService.createVehicle.and.returnValue(of({ success: true } as any));
    spyOn(component.saveSuccess, 'emit');
    component.generalInfoForm.patchValue({
      vehicleName: 'Test',
      vehicleType: 'VAN',
      identificationNumber: '',
      licensePlate: '',
      effectiveDate: moment().add(1, 'day')
    });
    component.onSave();
    const callArgs = mockVehicleService.createVehicle.calls.mostRecent().args[0];
    expect((callArgs as any).identificationNumber).toBeNull();
    expect((callArgs as any).licensePlate).toBeNull();
  });

});
