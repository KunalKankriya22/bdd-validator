import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoginService } from '@shared/services/login.service';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { PathogenReductionManagerService } from '../services/pathogen-reduction-manager.service';
import { InitialSterileDockingPanelComponent, InitialSterileDockingData } from './initial-sterile-docking-panel.component';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import { UnitIdFieldStub } from '@shared/testing/component-stubs';

describe('InitialSterileDockingPanelComponent', () => {
  let component: InitialSterileDockingPanelComponent;
  let fixture: ComponentFixture<InitialSterileDockingPanelComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<InitialSterileDockingPanelComponent>>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockLoginService: jasmine.SpyObj<LoginService>;
  let mockPRService: jasmine.SpyObj<PathogenReductionManagerService>;

  beforeEach(() => {

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockSnackbarService = createMockSnackbarService();
    mockLoginService = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    mockLoginService.getStoredUsername.and.returnValue('TESTUSER');

    mockPRService = jasmine.createSpyObj('PathogenReductionManagerService', [
      'getSterileDockingMachines',
      'getWaferLotNumbers',
      'getSetLotNumbers',
      'insertSterileDocking'
    ]);
    mockPRService.getSterileDockingMachines.and.returnValue(of([]));
    mockPRService.getWaferLotNumbers.and.returnValue(of([]));
    mockPRService.getSetLotNumbers.and.returnValue(of([]));
    mockPRService.insertSterileDocking.and.returnValue(of({} as any));

      TestBed.configureTestingModule({
imports: [
        InitialSterileDockingPanelComponent,
        ReactiveFormsModule,
        HttpClientTestingModule,
        UnitIdFieldComponent
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: LoginService, useValue: mockLoginService },
        { provide: PathogenReductionManagerService, useValue: mockPRService }
      ]
    })
    .overrideComponent(InitialSterileDockingPanelComponent, {
      remove: { imports: [UnitIdFieldComponent] },
      add: { imports: [UnitIdFieldStub] },
    });

    });

  beforeEach(() => {

      mockDialogRef.close.calls.reset();

      mockLoginService.getStoredUsername.calls.reset();

      mockPRService.getSterileDockingMachines.calls.reset();

      mockPRService.getWaferLotNumbers.calls.reset();

      mockPRService.getSetLotNumbers.calls.reset();

      mockPRService.insertSterileDocking.calls.reset();

      mockLoginService.getStoredUsername.and.returnValue('TESTUSER');

      mockPRService.getSterileDockingMachines.and.returnValue(of([]));

      mockPRService.getWaferLotNumbers.and.returnValue(of([]));

      mockPRService.getSetLotNumbers.and.returnValue(of([]));

      mockPRService.insertSterileDocking.and.returnValue(of({} as any));

    fixture = TestBed.createComponent(InitialSterileDockingPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    });

  it('should set validatedUnitId when unit ID is validated', () => {
    const response: UnitValidationResponse = {
      parsedUnitId: 'UNIT123',
      checkDigit: null,
      codeScheme: 'I',
      manualUnitId: 'UNIT123',
      codabarUnitScheme: null,
      entryMode: 'S',
      barcodeType: 'CODE128',
      chapterScheme: 'I'
    };

    component.onUnitIdValidated(response);

    expect(component['validatedUnitId']).toBe('UNIT123');
  });

  it('should invalidate form when unitId is not set', () => {
    component['validatedUnitId'] = null;
    component.form.patchValue({
      process: 'Process',
      weldMachine: 'Machine1'
    });

    expect(component.isFormValid()).toBeFalse();
  });

  it('should save and close dialog with valid data', () => {
    component['validatedUnitId'] = 'UNIT123';
    component.form.patchValue({
      weldMachine: 'Machine1',
      waferLot: 'WL001',
      setLot: 'SL001',
      weldSealOk: 'Yes'
    });

    component.onSave();

    expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Initial Sterile Docking saved successfully');
    expect(mockDialogRef.close).toHaveBeenCalled();
    expect(component.isSaving).toBeFalse();
  });

  it('should have all form controls initialized', () => {
    expect(component.form.get('process')).toBeDefined();
    expect(component.form.get('weldMachine')?.value).toBe('');
    expect(component.form.get('waferLot')?.value).toBe('');
    expect(component.form.get('setLot')?.value).toBe('');
    expect(component.form.get('weldSealOk')?.value).toBe('');
  });

  describe('onCancel', () => {
    it('should call dialogRef.close()', () => {
      component.onCancel();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('getFieldError', () => {
    it('should return null when control is valid', () => {
      expect(component.getFieldError('weldMachine')).toBeNull();
    });

    it('should return null when control is invalid but not touched/dirty', () => {
      const control = component.form.get('weldMachine');
      control?.setErrors({ required: true });

      expect(component.getFieldError('weldMachine')).toBeNull();
    });

    it('should return error message when control has required error and is touched', () => {
      const control = component.form.get('weldMachine');
      control?.setErrors({ required: true });
      control?.markAsTouched();

      expect(component.getFieldError('weldMachine')).toBe('This field is required');
    });

    it('should return error message when control has required error and is dirty', () => {
      const control = component.form.get('weldMachine');
      control?.setErrors({ required: true });
      control?.markAsDirty();

      expect(component.getFieldError('weldMachine')).toBe('This field is required');
    });

    it('should return null for non-existent field', () => {
      expect(component.getFieldError('nonExistent')).toBeNull();
    });
  });

  describe('ngOnDestroy', () => {
    it('should clean up subscriptions', () => {
      const nextSpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('onUnitIdCleared', () => {
    it('should set validatedUnitId to null', () => {
      component['validatedUnitId'] = 'UNIT123';

      component.onUnitIdCleared();

      expect(component['validatedUnitId']).toBeNull();
    });
  });

  describe('Weld machine search filtering', () => {
    it('should filter weld machines by code', () => {
      component.sterileDockingMachines = [
        { code: 'M001', codeDesc: 'Machine One' },
        { code: 'M002', codeDesc: 'Machine Two' },
        { code: 'M003', codeDesc: 'Machine Three' }
      ];
      component.filteredWeldMachines = [...component.sterileDockingMachines];

      component.weldMachineSearchControl.setValue('M001');

      expect(component.filteredWeldMachines.length).toBe(1);
      expect(component.filteredWeldMachines[0].code).toBe('M001');
    });

    it('should filter weld machines by description', () => {
      component.sterileDockingMachines = [
        { code: 'M001', codeDesc: 'Machine One' },
        { code: 'M002', codeDesc: 'Machine Two' }
      ];
      component.filteredWeldMachines = [...component.sterileDockingMachines];

      component.weldMachineSearchControl.setValue('Two');

      expect(component.filteredWeldMachines.length).toBe(1);
      expect(component.filteredWeldMachines[0].code).toBe('M002');
    });

    it('should show all machines when search is empty', () => {
      component.sterileDockingMachines = [
        { code: 'M001', codeDesc: 'Machine One' },
        { code: 'M002', codeDesc: 'Machine Two' }
      ];
      component.filteredWeldMachines = [];

      component.weldMachineSearchControl.setValue('');

      expect(component.filteredWeldMachines.length).toBe(2);
    });
  });

  describe('Wafer lot search filtering', () => {
    it('should filter wafer lots by lot number', () => {
      component.waferLotNumbers = [
        { lotNumber: 'WL001' },
        { lotNumber: 'WL002' },
        { lotNumber: 'WL003' }
      ];
      component.filteredWaferLots = [...component.waferLotNumbers];

      component.waferLotSearchControl.setValue('WL002');

      expect(component.filteredWaferLots.length).toBe(1);
      expect(component.filteredWaferLots[0].lotNumber).toBe('WL002');
    });

    it('should show all wafer lots when search is empty', () => {
      component.waferLotNumbers = [
        { lotNumber: 'WL001' },
        { lotNumber: 'WL002' }
      ];
      component.filteredWaferLots = [];

      component.waferLotSearchControl.setValue('');

      expect(component.filteredWaferLots.length).toBe(2);
    });
  });

  describe('Set lot search filtering', () => {
    it('should filter set lots by lot number', () => {
      component.setLotNumbers = [
        { lotNumber: 'SL001' },
        { lotNumber: 'SL002' },
        { lotNumber: 'SL003' }
      ];
      component.filteredSetLots = [...component.setLotNumbers];

      component.setLotSearchControl.setValue('SL003');

      expect(component.filteredSetLots.length).toBe(1);
      expect(component.filteredSetLots[0].lotNumber).toBe('SL003');
    });

    it('should show all set lots when search is empty', () => {
      component.setLotNumbers = [
        { lotNumber: 'SL001' },
        { lotNumber: 'SL002' }
      ];
      component.filteredSetLots = [];

      component.setLotSearchControl.setValue('');

      expect(component.filteredSetLots.length).toBe(2);
    });
  });

  describe('loadSterileDockingMachines', () => {
    it('should populate sterileDockingMachines on success', () => {
      const machines = [
        { code: 'M001', codeDesc: 'Machine 1' },
        { code: 'M002', codeDesc: 'Machine 2' }
      ];
      mockPRService.getSterileDockingMachines.and.returnValue(of(machines));

      component['loadSterileDockingMachines']();

      expect(component.sterileDockingMachines).toEqual(machines);
      expect(component.filteredWeldMachines).toEqual(machines);
    });

    it('should show error on failure', () => {
      const { throwError } = require('rxjs');
      mockPRService.getSterileDockingMachines.and.returnValue(throwError(() => new Error('fail')));

      component['loadSterileDockingMachines']();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load sterile docking machines');
    });
  });

  describe('loadWaferLotNumbers', () => {
    it('should populate waferLotNumbers on success', () => {
      const waferLots = [{ lotNumber: 'WL001' }, { lotNumber: 'WL002' }];
      mockPRService.getWaferLotNumbers.and.returnValue(of(waferLots));

      component['loadWaferLotNumbers']();

      expect(component.waferLotNumbers).toEqual(waferLots);
      expect(component.filteredWaferLots).toEqual(waferLots);
    });

    it('should show error on failure', () => {
      const { throwError } = require('rxjs');
      mockPRService.getWaferLotNumbers.and.returnValue(throwError(() => new Error('fail')));

      component['loadWaferLotNumbers']();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load wafer lot numbers');
    });
  });

  describe('loadSetLotNumbers', () => {
    it('should populate setLotNumbers on success', () => {
      const setLots = [{ lotNumber: 'SL001' }];
      mockPRService.getSetLotNumbers.and.returnValue(of(setLots));

      component['loadSetLotNumbers']('VTS1');

      expect(mockPRService.getSetLotNumbers).toHaveBeenCalledWith('VTS1');
      expect(component.setLotNumbers).toEqual(setLots);
      expect(component.filteredSetLots).toEqual(setLots);
    });

    it('should show error on failure', () => {
      const { throwError } = require('rxjs');
      mockPRService.getSetLotNumbers.and.returnValue(throwError(() => new Error('fail')));

      component['loadSetLotNumbers']('VTS1');

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load set lot numbers');
    });

    it('should clear set lots when volumeTypeSet is empty', () => {
      component.setLotNumbers = [{ lotNumber: 'SL001' }];
      component.filteredSetLots = [{ lotNumber: 'SL001' }];

      component['loadSetLotNumbers']('');

      expect(component.setLotNumbers).toEqual([]);
      expect(component.filteredSetLots).toEqual([]);
    });
  });

  describe('onSave with invalid form', () => {
    it('should mark all controls as touched and show error when form is invalid', () => {
      component.form.get('weldMachine')?.setErrors({ required: true });
      spyOn(component.form, 'markAllAsTouched');

      component.onSave();

      expect(component.form.markAllAsTouched).toHaveBeenCalled();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Please fill in all required fields');
    });

    it('should not call insertSterileDocking when form is invalid', () => {
      component.form.get('weldMachine')?.setErrors({ required: true });

      component.onSave();

      expect(mockPRService.insertSterileDocking).not.toHaveBeenCalled();
    });
  });

  describe('onSave error path', () => {
    it('should show error and reset isSaving on API error', () => {
      const { throwError } = require('rxjs');
      component['validatedUnitId'] = 'UNIT123';
      component.form.patchValue({
        weldMachine: 'M001',
        waferLot: 'WL001',
        setLot: 'SL001',
        weldSealOk: 'Yes'
      });
      mockPRService.insertSterileDocking.and.returnValue(throwError(() => ({ error: { errorResponse: { error: 'Some error' } } })));

      component.onSave();

      expect(component.isSaving).toBeFalse();
      expect(mockSnackbarService.showError).toHaveBeenCalled();
    });
  });

  describe('isFormValid', () => {
    it('should return true when validatedUnitId is set and form is valid', () => {
      component['validatedUnitId'] = 'UNIT123';

      expect(component.isFormValid()).toBeTrue();
    });

    it('should return false when validatedUnitId is null', () => {
      component['validatedUnitId'] = null;

      expect(component.isFormValid()).toBeFalse();
    });

    it('should return false when form is invalid', () => {
      component['validatedUnitId'] = 'UNIT123';
      component.form.get('weldMachine')?.setErrors({ required: true });

      expect(component.isFormValid()).toBeFalse();
    });
  });

  describe('Initialization with dialog data', () => {
    it('should set savedUnitId and validatedUnitId from dialog data', () => {
      // Re-create with dialog data
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          InitialSterileDockingPanelComponent,
          ReactiveFormsModule,
          HttpClientTestingModule,
          UnitIdFieldComponent
        ],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: { unitId: 'UNIT456', manualUnitId: 'UNIT456-CD', volumeTypeSet: 'VTS1' } },
          { provide: SnackbarService, useValue: mockSnackbarService },
          { provide: LoginService, useValue: mockLoginService },
          { provide: PathogenReductionManagerService, useValue: mockPRService }
        ]
      })
      .overrideComponent(InitialSterileDockingPanelComponent, {
        remove: { imports: [UnitIdFieldComponent] },
        add: { imports: [UnitIdFieldStub] },
      });

      const f = TestBed.createComponent(InitialSterileDockingPanelComponent);
      const comp = f.componentInstance;
      f.detectChanges();

      expect(comp.savedUnitId).toBe('UNIT456');
      expect(comp.savedManualUnitId).toBe('UNIT456-CD');
      expect(comp.savedVolumeTypeSet).toBe('VTS1');
      expect(comp['validatedUnitId']).toBe('UNIT456');
    });
  });

  describe('weldSealOk conversion in onSave', () => {
    it('should convert "Yes" to "Y" in payload', () => {
      component['validatedUnitId'] = 'UNIT123';
      component.form.patchValue({
        weldMachine: 'M001',
        waferLot: 'WL001',
        setLot: 'SL001',
        weldSealOk: 'Yes'
      });

      component.onSave();

      const payload = mockPRService.insertSterileDocking.calls.mostRecent().args[0];
      expect(payload.weldOk).toBe('Y');
    });

    it('should convert "No" to "N" in payload', () => {
      component['validatedUnitId'] = 'UNIT123';
      component.form.patchValue({
        weldMachine: 'M001',
        waferLot: 'WL001',
        setLot: 'SL001',
        weldSealOk: 'No'
      });

      component.onSave();

      const payload = mockPRService.insertSterileDocking.calls.mostRecent().args[0];
      expect(payload.weldOk).toBe('N');
    });
  });

  describe('onUnitIdValidated edge cases', () => {
    it('should not update validatedUnitId when parsedUnitId is null', () => {
      component['validatedUnitId'] = 'EXISTING';
      const response: UnitValidationResponse = {
        parsedUnitId: null as any,
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: '',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      };

      component.onUnitIdValidated(response);

      expect(component['validatedUnitId']).toBe('EXISTING');
    });

    it('should not update validatedUnitId when parsedUnitId is empty string', () => {
      component['validatedUnitId'] = 'EXISTING';
      const response: UnitValidationResponse = {
        parsedUnitId: '',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: '',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      };

      component.onUnitIdValidated(response);

      expect(component['validatedUnitId']).toBe('EXISTING');
    });
  });

  describe('onSave username fallback', () => {
    it('should use "SYSTEM" when getStoredUsername returns null', () => {
      mockLoginService.getStoredUsername.and.returnValue(null as any);
      component['validatedUnitId'] = 'UNIT123';
      component.form.patchValue({
        weldMachine: 'M001',
        waferLot: 'WL001',
        setLot: 'SL001',
        weldSealOk: 'Yes'
      });

      component.onSave();

      const payload = mockPRService.insertSterileDocking.calls.mostRecent().args[0];
      expect(payload.dockUser).toBe('SYSTEM');
    });

    it('should use "SYSTEM" when getStoredUsername returns empty string', () => {
      mockLoginService.getStoredUsername.and.returnValue('');
      component['validatedUnitId'] = 'UNIT123';
      component.form.patchValue({
        weldMachine: 'M001',
        waferLot: 'WL001',
        setLot: 'SL001',
        weldSealOk: 'No'
      });

      component.onSave();

      const payload = mockPRService.insertSterileDocking.calls.mostRecent().args[0];
      expect(payload.dockUser).toBe('SYSTEM');
    });
  });

  describe('getFieldError edge cases', () => {
    it('should return null when control has non-required error and is touched', () => {
      const control = component.form.get('weldMachine');
      control?.setErrors({ minlength: { requiredLength: 3, actualLength: 1 } });
      control?.markAsTouched();

      expect(component.getFieldError('weldMachine')).toBeNull();
    });
  });

  describe('onSave payload structure', () => {
    it('should include correct procCode and dockDate in payload', () => {
      component['validatedUnitId'] = 'UNIT789';
      component.form.patchValue({
        weldMachine: 'M002',
        waferLot: 'WL002',
        setLot: 'SL002',
        weldSealOk: 'Yes'
      });

      component.onSave();

      const payload = mockPRService.insertSterileDocking.calls.mostRecent().args[0];
      expect(payload.unitId).toBe('UNIT789');
      expect(payload.procCode).toBe('SUITABILITY');
      expect(payload.weldMachine).toBe('M002');
      expect(payload.waferLotNo).toBe('WL002');
      expect(payload.setLotNo).toBe('SL002');
      expect(payload.dockDate).toBeTruthy();
      expect(payload.dockUser).toBe('TESTUSER');
    });

    it('should set isSaving to true during save', () => {
      const { Subject } = require('rxjs');
      const saveSubject = new Subject();
      mockPRService.insertSterileDocking.and.returnValue(saveSubject.asObservable());
      component['validatedUnitId'] = 'UNIT123';

      component.onSave();

      expect(component.isSaving).toBeTrue();

      saveSubject.next({});
      saveSubject.complete();

      expect(component.isSaving).toBeFalse();
    });
  });

  describe('ngOnInit without dialog data', () => {
    it('should set savedUnitId to null when no dialog data', () => {
      expect(component.savedUnitId).toBeNull();
      expect(component.savedManualUnitId).toBeNull();
      expect(component.savedVolumeTypeSet).toBeNull();
      expect(component['validatedUnitId']).toBeNull();
    });

    it('should not call loadSetLotNumbers when no volumeTypeSet', () => {
      // The default setup has null dialog data, so loadSetLotNumbers should not be called
      // (getSterileDockingMachines and getWaferLotNumbers ARE called, but getSetLotNumbers is NOT)
      expect(mockPRService.getSetLotNumbers).not.toHaveBeenCalled();
    });

    it('should call loadSterileDockingMachines during init', () => {
      expect(mockPRService.getSterileDockingMachines).toHaveBeenCalled();
    });

    it('should call loadWaferLotNumbers during init', () => {
      expect(mockPRService.getWaferLotNumbers).toHaveBeenCalled();
    });
  });

  describe('Initialization with dialog data calls loadSetLotNumbers', () => {
    it('should call loadSetLotNumbers when volumeTypeSet is present', () => {
      TestBed.resetTestingModule();

      mockPRService.getSterileDockingMachines.and.returnValue(of([]));
      mockPRService.getWaferLotNumbers.and.returnValue(of([]));
      mockPRService.getSetLotNumbers.and.returnValue(of([]));

      TestBed.configureTestingModule({
        imports: [
          InitialSterileDockingPanelComponent,
          ReactiveFormsModule,
          HttpClientTestingModule,
          UnitIdFieldComponent
        ],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: { unitId: 'U1', volumeTypeSet: 'VTS2' } },
          { provide: SnackbarService, useValue: mockSnackbarService },
          { provide: LoginService, useValue: mockLoginService },
          { provide: PathogenReductionManagerService, useValue: mockPRService }
        ]
      })
      .overrideComponent(InitialSterileDockingPanelComponent, {
        remove: { imports: [UnitIdFieldComponent] },
        add: { imports: [UnitIdFieldStub] },
      });

      const f = TestBed.createComponent(InitialSterileDockingPanelComponent);
      f.detectChanges();

      expect(mockPRService.getSetLotNumbers).toHaveBeenCalledWith('VTS2');
    });
  });

  describe('process field', () => {
    it('should have process field disabled with value SUITABILITY', () => {
      const processControl = component.form.get('process');
      expect(processControl?.value).toBe('SUITABILITY');
      expect(processControl?.disabled).toBeTrue();
    });
  });

  describe('ngAfterViewInit', () => {
    it('should be callable without error', () => {
      expect(() => component.ngAfterViewInit()).not.toThrow();
    });
  });

  describe('search control filtering with null value', () => {
    it('should reset weld machines filter when search value is null', () => {
      component.sterileDockingMachines = [
        { code: 'M001', codeDesc: 'Machine One' }
      ];
      component.filteredWeldMachines = [];

      component.weldMachineSearchControl.setValue(null as any);

      expect(component.filteredWeldMachines).toEqual(component.sterileDockingMachines);
    });

    it('should reset wafer lots filter when search value is null', () => {
      component.waferLotNumbers = [{ lotNumber: 'WL001' }];
      component.filteredWaferLots = [];

      component.waferLotSearchControl.setValue(null as any);

      expect(component.filteredWaferLots).toEqual(component.waferLotNumbers);
    });

    it('should reset set lots filter when search value is null', () => {
      component.setLotNumbers = [{ lotNumber: 'SL001' }];
      component.filteredSetLots = [];

      component.setLotSearchControl.setValue(null as any);

      expect(component.filteredSetLots).toEqual(component.setLotNumbers);
    });
  });

  describe('onSave successful result structure', () => {
    it('should close dialog with correct formData on success', () => {
      component['validatedUnitId'] = 'UNIT999';
      component.form.patchValue({
        weldMachine: 'MACH1',
        waferLot: 'WF1',
        setLot: 'ST1',
        weldSealOk: 'Yes'
      });

      component.onSave();

      const closedData = mockDialogRef.close.calls.mostRecent().args[0];
      expect(closedData).toEqual(jasmine.objectContaining({
        unitId: 'UNIT999',
        weldMachine: 'MACH1',
        waferLot: 'WF1',
        setLot: 'ST1',
        weldSealOk: 'Yes'
      }));
    });
  });
});
