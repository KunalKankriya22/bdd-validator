import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { EnterReagentsIntoRepositoryComponent } from './enter-reagents-into-repository';
import { EnterReagentsApiService } from './services/enter-reagents-into-repository-api.service';
import { ReagentQueryService } from '../reagent-query/services/reagent-query.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoginService } from '@shared/services/login.service';
import { ApiService } from '@shared/services/api.service';
import { ReagentStoreDto } from './models/enter-reagents-into-repository.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('EnterReagentsIntoRepositoryComponent', () => {
  let menuSpy: any;
  let headerSpy: any;
  let sharedApiSpy: any;
  let loginSpy: any;
  let reagentQuerySpy: any;
  let apiSpy: any;
  const tomorrow = moment().add(1, 'day').startOf('day');

  let component: EnterReagentsIntoRepositoryComponent;
  let fixture: ComponentFixture<EnterReagentsIntoRepositoryComponent>;
  let apiService: jasmine.SpyObj<EnterReagentsApiService>;
  let reagentQueryService: jasmine.SpyObj<ReagentQueryService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let loginService: jasmine.SpyObj<LoginService>;
  let sharedApiService: jasmine.SpyObj<ApiService>;

  const mockReagent: ReagentStoreDto = {
    reagentId: 'R5077',
    testId: 'TEST001',
    reagentType: 'R',
    reagentDesc: 'Reagent',
    reagentCode: 'RG001',
    reagentName: 'Anti-A Reagent',
    reagentStatus: 'R',
    receivedDate: '2026-01-15T00:00:00Z',
    expiryDate: '2027-01-15T00:00:00Z',
    supplierCode: 'SUP01',
    supplierName: 'ABC Suppliers',
    kitLotNumber: 'KIT123',
    lotNumber: 'LOT456',
    containerId: 'CONT1',
    containerName: 'Refrigerator',
    controlInd: null,
    minStorageTemp: 2,
    maxStorageTemp: 8,
    storageLocation: 'REF01',
    storageLocName: 'Main Refrigerator',
    noOfTests: 100,
    remainingTests: 100,
    visualQcFlag: 'Y',
    rejectReasonCode: null,
    rejectReasonDesc: '',
    disposition: 'HOLD',
    licensedApproved: 'L',
    packageInsertDate: '2026-01-01T00:00:00Z',
    labCode: '01',
    chapterId: 'CH01',
    noteId: 1001,
    note: 'Test note',
    receivedBy: 'USER01',
    prepRequired: 'I',
  };

  const chapterChanged$ = new Subject<void>();

  beforeEach(() => {

    apiSpy = jasmine.createSpyObj('EnterReagentsApiService', [
      'getAll', 'getById', 'create', 'update',
      'getTests', 'getReagentTypes', 'getReagentCodes', 'getSuppliers',
      'getContainerTypes', 'getStorageLocations', 'getRejectReasons', 'getControlIndicators',
    ]);
    reagentQuerySpy = jasmine.createSpyObj('ReagentQueryService', [
      'getTestsFromStore', 'getReagentTypes', 'getReagentCodeDetails',
      'getSuppliers', 'getContainerTypes', 'getStorageLocations',
      'getControlIndicators', 'getRejectReasons', 'getReagentStoreIds',
    ]);
    const snackbarSpy = createMockSnackbarService();
    loginSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    sharedApiSpy = jasmine.createSpyObj('ApiService', ['get']);
    headerSpy = createMockHeaderService();
    menuSpy = jasmine.createSpyObj('MenuService', ['getMenuItemsSignal', 'findMenuItemByPath']);

    reagentQuerySpy.getTestsFromStore.and.returnValue(of([]));
    reagentQuerySpy.getReagentTypes.and.returnValue(of([]));
    reagentQuerySpy.getSuppliers.and.returnValue(of([]));
    reagentQuerySpy.getContainerTypes.and.returnValue(of([]));
    reagentQuerySpy.getStorageLocations.and.returnValue(of([]));
    reagentQuerySpy.getControlIndicators.and.returnValue(of([]));
    reagentQuerySpy.getRejectReasons.and.returnValue(of([]));
    reagentQuerySpy.getReagentCodeDetails.and.returnValue(of([]));
    reagentQuerySpy.getReagentStoreIds.and.returnValue(of([]));
    loginSpy.getStoredUsername.and.returnValue('USER01');
    sharedApiSpy.get.and.returnValue(of({ item: { labCode: '01' } }));
    menuSpy.getMenuItemsSignal.and.returnValue(() => []);



      TestBed.configureTestingModule({
      imports: [
        EnterReagentsIntoRepositoryComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
      ],
    })
    .overrideProvider(EnterReagentsApiService, { useValue: apiSpy })
    .overrideProvider(ReagentQueryService, { useValue: reagentQuerySpy })
    .overrideProvider(SnackbarService, { useValue: snackbarSpy })
    .overrideProvider(LoginService, { useValue: loginSpy })
    .overrideProvider(ApiService, { useValue: sharedApiSpy })
    .overrideProvider(HeaderService, { useValue: headerSpy })
    .overrideProvider(MenuService, { useValue: menuSpy })
    .overrideProvider(ActivatedRoute, { useValue: { snapshot: { paramMap: { get: () => null } } } });


    


      apiSpy.getAll.calls.reset();


      apiSpy.getById.calls.reset();


      apiSpy.create.calls.reset();


      apiSpy.update.calls.reset();


      apiSpy.getTests.calls.reset();


      apiSpy.getReagentTypes.calls.reset();


      apiSpy.getReagentCodes.calls.reset();


      apiSpy.getSuppliers.calls.reset();


      apiSpy.getContainerTypes.calls.reset();


      apiSpy.getStorageLocations.calls.reset();


      apiSpy.getRejectReasons.calls.reset();


      apiSpy.getControlIndicators.calls.reset();


      reagentQuerySpy.getTestsFromStore.calls.reset();


      reagentQuerySpy.getReagentTypes.calls.reset();


      reagentQuerySpy.getReagentCodeDetails.calls.reset();


      reagentQuerySpy.getSuppliers.calls.reset();


      reagentQuerySpy.getContainerTypes.calls.reset();


      reagentQuerySpy.getStorageLocations.calls.reset();


      reagentQuerySpy.getControlIndicators.calls.reset();


      reagentQuerySpy.getRejectReasons.calls.reset();


      reagentQuerySpy.getReagentStoreIds.calls.reset();


      loginSpy.getStoredUsername.calls.reset();


      sharedApiSpy.get.calls.reset();


      menuSpy.getMenuItemsSignal.calls.reset();


      menuSpy.findMenuItemByPath.calls.reset();


      reagentQuerySpy.getTestsFromStore.and.returnValue(of([]));


      reagentQuerySpy.getReagentTypes.and.returnValue(of([]));


      reagentQuerySpy.getSuppliers.and.returnValue(of([]));


      reagentQuerySpy.getContainerTypes.and.returnValue(of([]));


      reagentQuerySpy.getStorageLocations.and.returnValue(of([]));


      reagentQuerySpy.getControlIndicators.and.returnValue(of([]));


      reagentQuerySpy.getRejectReasons.and.returnValue(of([]));


      reagentQuerySpy.getReagentCodeDetails.and.returnValue(of([]));


      reagentQuerySpy.getReagentStoreIds.and.returnValue(of([]));


      loginSpy.getStoredUsername.and.returnValue('USER01');


      sharedApiSpy.get.and.returnValue(of({ item: { labCode: '01' } }));


      menuSpy.getMenuItemsSignal.and.returnValue(() => []);


    apiService = TestBed.inject(EnterReagentsApiService) as jasmine.SpyObj<EnterReagentsApiService>;
    reagentQueryService = TestBed.inject(ReagentQueryService) as jasmine.SpyObj<ReagentQueryService>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    loginService = TestBed.inject(LoginService) as jasmine.SpyObj<LoginService>;
    sharedApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    fixture = TestBed.createComponent(EnterReagentsIntoRepositoryComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {


    it('should initialize search form with required validators', () => {
      fixture.detectChanges();
      expect(component.searchForm).toBeTruthy();
      expect(component.searchForm.get('testId')).toBeTruthy();
      expect(component.searchForm.get('reagentId')).toBeTruthy();
    });

    it('should initialize reagent form with required validators', () => {
      fixture.detectChanges();
      expect(component.reagentForm).toBeTruthy();
      expect(component.reagentForm.get('reagentType')?.hasError('required')).toBeTrue();
      expect(component.reagentForm.get('reagentCode')?.hasError('required')).toBeTrue();
      expect(component.reagentForm.get('reagentLot')?.hasError('required')).toBeTrue();
      expect(component.reagentForm.get('visualQc')?.hasError('required')).toBeTrue();
      expect(component.reagentForm.get('noOfTests')?.hasError('required')).toBeTrue();
      expect(component.reagentForm.get('receivedDate')?.hasError('required')).toBeTrue();
      expect(component.reagentForm.get('expiryDate')?.hasError('required')).toBeTrue();
      expect(component.reagentForm.get('storageLocation')?.hasError('required')).toBeTrue();
      expect(component.reagentForm.get('packageInsertDate')?.hasError('required')).toBeTrue();
    });

    it('should default to non-supervisor mode', () => {
      fixture.detectChanges();
      expect(component.isSupervisor).toBeFalse();
    });

    it('should set isSupervisor to true when labCode is 99', () => {
      sharedApiService.get.and.returnValue(of({ item: { labCode: '99' } }));
      fixture.detectChanges();
      expect(component.isSupervisor).toBeTrue();
    });

    it('should load lookup data on init', () => {
      fixture.detectChanges();
      expect(reagentQueryService.getTestsFromStore).toHaveBeenCalled();
      expect(reagentQueryService.getReagentTypes).toHaveBeenCalled();
      expect(reagentQueryService.getSuppliers).toHaveBeenCalled();
      expect(reagentQueryService.getContainerTypes).toHaveBeenCalled();
      expect(reagentQueryService.getStorageLocations).toHaveBeenCalled();
      expect(reagentQueryService.getControlIndicators).toHaveBeenCalled();
      expect(reagentQueryService.getRejectReasons).toHaveBeenCalled();
    });
  });

  describe('Retrieve', () => {
    beforeEach(() => fixture.detectChanges());

    it('should show form in new mode when reagentId is NEW', () => {
      component.searchForm.patchValue({ testId: 'TEST001', reagentId: 'NEW' });
      component.onRetrieve();
      expect(component.isNewMode).toBeTrue();
      expect(component.showForm).toBeTrue();
      expect(component.isFormReadOnly).toBeFalse();
    });



    it('should populate form from API response', fakeAsync(() => {
      apiService.getById.and.returnValue(of(mockReagent));
      component.searchForm.patchValue({ testId: 'TEST001', reagentId: 'R5077' });
      component.onRetrieve();
      tick();

      expect(component.showForm).toBeTrue();
      expect(component.isNewMode).toBeFalse();
      expect(component.reagentForm.get('reagentType')?.value).toBe('R');
      expect(component.reagentForm.get('reagentCode')?.value).toBe('RG001');
      expect(component.reagentForm.get('lotNumber') || component.reagentForm.get('reagentLot')).toBeTruthy();
      expect(component.reagentForm.get('controlIndicator')?.value).toBe('');
      expect(component.reagentForm.get('disposition')?.value).toBe('HOLD');
      expect(component.reagentForm.get('licensedApproved')?.value).toBe('L');
    }));





    it('should set form to read-only for non-supervisor', fakeAsync(() => {
      apiService.getById.and.returnValue(of(mockReagent));
      component.isSupervisor = false;
      component.searchForm.get('testId')?.setValue('TEST001', { emitEvent: false });
      component.searchForm.get('reagentId')?.setValue('R5077', { emitEvent: false });
      component.onRetrieve();
      tick();

      expect(component.isFormReadOnly).toBeTrue();
      expect(component.reagentForm.get('reagentType')?.disabled).toBeTrue();
      expect(component.reagentForm.get('reagentCode')?.disabled).toBeTrue();
      expect(component.reagentForm.get('reagentLot')?.disabled).toBeTrue();
    }));

    it('should set form to editable for supervisor', fakeAsync(() => {
      apiService.getById.and.returnValue(of(mockReagent));
      component.isSupervisor = true;
      component.searchForm.get('testId')?.setValue('TEST001', { emitEvent: false });
      component.searchForm.get('reagentId')?.setValue('R5077', { emitEvent: false });
      component.onRetrieve();
      tick();

      expect(component.isFormReadOnly).toBeFalse();
      expect(component.reagentForm.enabled).toBeTrue();
    }));
  });

  describe('Form Validations', () => {
    beforeEach(() => fixture.detectChanges());

    it('should require control indicator when reagent type is C', () => {
      component.reagentForm.get('reagentType')?.setValue('C');
      expect(component.reagentForm.get('controlIndicator')?.hasError('required')).toBeTrue();
    });

    it('should not require control indicator when reagent type is R', () => {
      component.reagentForm.get('reagentType')?.setValue('R');
      expect(component.reagentForm.get('controlIndicator')?.hasError('required')).toBeFalsy();
    });

    it('should always require supplier code', () => {
      expect(component.reagentForm.get('supplierCode')?.hasError('required')).toBeTrue();
    });

    it('should require kit lot when masterLotRequired is Y', () => {
      component.reagentCodeOptions = [{ reagentCode: 'RG001', reagentName: 'Test', preparationFlag: 'N', masterLotRequired: 'Y' }];
      component.reagentForm.get('reagentCode')?.setValue('RG001');
      expect(component.isKitLotRequired).toBeTrue();
      expect(component.reagentForm.get('kitLot')?.hasError('required')).toBeTrue();
    });

    it('should not require kit lot when masterLotRequired is N', () => {
      component.reagentCodeOptions = [{ reagentCode: 'RG002', reagentName: 'Test', preparationFlag: 'N', masterLotRequired: 'N' }];
      component.reagentForm.get('reagentCode')?.setValue('RG002');
      expect(component.isKitLotRequired).toBeFalse();
    });





    it('should validate min temp <= max temp', () => {
      component.reagentForm.patchValue({ minTemp: 10, maxTemp: 5 });
      component.reagentForm.updateValueAndValidity();
      expect(component.reagentForm.hasError('minTempGreaterThanMax')).toBeTrue();
    });

    it('should pass when min temp <= max temp', () => {
      component.reagentForm.patchValue({ minTemp: 2, maxTemp: 8 });
      component.reagentForm.updateValueAndValidity();
      expect(component.reagentForm.hasError('minTempGreaterThanMax')).toBeFalse();
    });

    it('should validate expiry date not before received date', () => {
      component.reagentForm.patchValue({
        receivedDate: tomorrow.clone(),
        expiryDate: '10-JUN-2026 00:00',
      });
      component.reagentForm.updateValueAndValidity();
      expect(component.reagentForm.hasError('expiryBeforeReceived')).toBeTrue();
    });

    it('should pass when expiry date is after received date', () => {
      component.reagentForm.patchValue({
        receivedDate: tomorrow.clone(),
        expiryDate: '15-JUN-2027 00:00',
      });
      component.reagentForm.updateValueAndValidity();
      expect(component.reagentForm.hasError('expiryBeforeReceived')).toBeFalse();
    });
  });

  describe('Save - Create', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.isNewMode = true;
      component.isSupervisor = false;
    });

    it('should block supervisor from creating', () => {
      component.isSupervisor = true;
      component.onSave();
      expect(snackbarService.showError).toHaveBeenCalledWith('Supervisors cannot create new reagents');
    });

    it('should block non-supervisor from updating', () => {
      component.isNewMode = false;
      component.isSupervisor = false;
      component.onSave();
      expect(snackbarService.showError).toHaveBeenCalledWith('Only supervisors can update existing reagents');
    });



    it('should include controlInd, status, and licensedApproved in create DTO', fakeAsync(() => {
      apiService.create.and.returnValue(of({ success: true, data: [{ reagentId: 'R5078' }] } as any));
      reagentQueryService.getReagentStoreIds.and.returnValue(of([]));
      component.searchForm.patchValue({ testId: 'TEST001', reagentId: 'NEW' });

      component.reagentForm.patchValue({
        reagentType: 'C',
        reagentCode: 'RG001',
        receivedDate: moment('2026-01-15'),
        expiryDate: '15-JAN-2027 00:00',
        supplierCode: 'SUP01',
        reagentLot: 'LOT456',
        controlIndicator: 'POS',
        minTemp: 2,
        maxTemp: 8,
        storageLocation: 'REF01',
        noOfTests: 100,
        visualQc: 'Y',
        disposition: 'HOLD',
        licensedApproved: 'L',
        packageInsertDate: 'JAN-2026',
      });

      component.onSave();
      tick();

      expect(apiService.create).toHaveBeenCalled();
      const dto = apiService.create.calls.mostRecent().args[0];
      expect(dto.controlInd).toBe('POS');
      expect(dto.status).toBe('HOLD');
      expect(dto.licensedApproved).toBe('L');
    }));



    it('should refresh reagent IDs after successful create', fakeAsync(() => {
      apiService.create.and.returnValue(of({ success: true, data: [{ reagentId: 'R5077' }] } as any));
      reagentQueryService.getReagentStoreIds.and.returnValue(of([{ reagentId: 'R5077', lotNumber: 'LOT456' }]));
      component.searchForm.patchValue({ testId: 'TEST001', reagentId: 'NEW' });

      component.reagentForm.patchValue({
        reagentType: 'R',
        reagentCode: 'RG001',
        receivedDate: moment('2026-01-15'),
        expiryDate: '15-JAN-2027 00:00',
        supplierCode: 'SUP01',
        reagentLot: 'LOT456',
        minTemp: 2,
        maxTemp: 8,
        storageLocation: 'REF01',
        noOfTests: 100,
        visualQc: 'Y',
        packageInsertDate: 'JAN-2026',
      });

      component.onSave();
      tick();

      expect(component.showForm).toBeFalse();
    }));


  });

  describe('Save - Update', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.isNewMode = false;
      component.isSupervisor = true;
      component.searchForm.patchValue({ testId: 'TEST001', reagentId: 'R5077' });
      component.currentReagent = mockReagent;
    });

    it('should call update API for supervisor editing existing reagent', fakeAsync(() => {
      apiService.update.and.returnValue(of({ success: true } as any));

      component.reagentForm.patchValue({
        reagentType: 'R',
        reagentCode: 'RG001',
        receivedDate: moment('2026-01-15'),
        expiryDate: '15-JAN-2027 00:00',
        supplierCode: 'SUP01',
        reagentLot: 'LOT456',
        minTemp: 2,
        maxTemp: 8,
        storageLocation: 'REF01',
        noOfTests: 95,
        visualQc: 'Y',
        packageInsertDate: 'JAN-2026',
      });

      component.onSave();
      tick();

      expect(apiService.update).toHaveBeenCalled();
      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Reagent updated successfully');
    }));
  });

  describe('Clear and Cancel', () => {
    beforeEach(() => fixture.detectChanges());

    it('should reset all state on clearAll', () => {
      component.showForm = true;
      component.isNewMode = true;
      component.currentReagent = mockReagent;
      component.reagentIdOptions = [{ value: 'R5077', label: 'R5077' }];

      component.clearAll();

      expect(component.showForm).toBeFalse();
      expect(component.isNewMode).toBeFalse();
      expect(component.currentReagent).toBeNull();
      expect(component.reagentIdOptions.length).toBe(0);
    });

    it('should hide form on cancel', () => {
      component.showForm = true;
      component.currentReagent = mockReagent;

      component.onCancel();

      expect(component.showForm).toBeFalse();
      expect(component.currentReagent).toBeNull();
    });

    it('should reset originalNote on clearAll', () => {
      component.originalNote = 'existing note';
      component.clearAll();
      expect(component.originalNote).toBe('');
    });

    it('should reset originalNote on clearForm', () => {
      component.originalNote = 'existing note';
      component.clearForm();
      expect(component.originalNote).toBe('');
    });
  });

  describe('GAP 1 - Min/Max Temp required', () => {
    beforeEach(() => fixture.detectChanges());

    it('should require minTemp', () => {
      expect(component.reagentForm.get('minTemp')?.hasError('required')).toBeTrue();
    });

    it('should require maxTemp', () => {
      expect(component.reagentForm.get('maxTemp')?.hasError('required')).toBeTrue();
    });

    it('should clear required error when value is set', () => {
      component.reagentForm.get('minTemp')?.setValue(5);
      expect(component.reagentForm.get('minTemp')?.hasError('required')).toBeFalse();
    });
  });

  describe('GAP 3 - Null lab code check', () => {
    it('should disable search form when labCode is empty', () => {
      sharedApiService.get.and.returnValue(of({ item: { labCode: '' } }));
      fixture.detectChanges();
      expect(component.searchForm.disabled).toBeTrue();
      expect(snackbarService.showError).toHaveBeenCalledWith('No testing lab code assigned. Access denied.');
    });

    it('should disable search form when labCode is null', () => {
      sharedApiService.get.and.returnValue(of({ item: { labCode: null } }));
      fixture.detectChanges();
      expect(component.searchForm.disabled).toBeTrue();
    });

    it('should not disable search form when labCode exists', () => {
      sharedApiService.get.and.returnValue(of({ item: { labCode: '01' } }));
      fixture.detectChanges();
      expect(component.searchForm.disabled).toBeFalse();
    });
  });

  describe('GAP 4 - Note append-only', () => {
    beforeEach(() => fixture.detectChanges());

    it('should store originalNote when populating form', fakeAsync(() => {
      apiService.getById.and.returnValue(of(mockReagent));
      component.searchForm.patchValue({ testId: 'TEST001', reagentId: 'R5077' });
      component.isSupervisor = true;
      component.onRetrieve();
      tick();
      expect(component.originalNote).toBe('Test note');
    }));

    it('should allow appending to original note', fakeAsync(() => {
      component.originalNote = 'Original';
      component.reagentForm.get('notes')?.setValue('Original - appended');
      tick();
      expect(component.reagentForm.get('notes')?.value).toBe('Original - appended');
    }));

    it('should revert note when original is removed', fakeAsync(() => {
      component.originalNote = 'Original';
      component.reagentForm.get('notes')?.setValue('Changed completely');
      tick();
      expect(component.reagentForm.get('notes')?.value).toBe('Original');
    }));

    it('should reset originalNote for NEW mode', () => {
      component.originalNote = 'old note';
      component.searchForm.patchValue({ testId: 'TEST001', reagentId: 'NEW' });
      component.onRetrieve();
      expect(component.originalNote).toBe('');
    });
  });

  describe('GAP 5 - Filter reagent codes by type', () => {
    beforeEach(() => fixture.detectChanges());

    it('should reload reagent codes when reagent type changes', () => {
      component.searchForm.get('testId')?.setValue('TEST001', { emitEvent: false });
      component.reagentForm.get('reagentType')?.setValue('R');
      expect(reagentQueryService.getReagentCodeDetails).toHaveBeenCalledWith('TEST001', 'R');
    });

    it('should clear reagent code when reagent type changes', () => {
      component.reagentForm.get('reagentCode')?.setValue('RG001', { emitEvent: false });
      component.searchForm.get('testId')?.setValue('TEST001', { emitEvent: false });
      component.reagentForm.get('reagentType')?.setValue('C');
      expect(component.reagentForm.get('reagentCode')?.value).toBe('');
    });
  });

  describe('Search subscriptions', () => {
    beforeEach(() => fixture.detectChanges());

    it('should update description when testId changes', () => {
      component.testOptions = [{ testId: 'T1', testDesc: 'Test One' }];
      component.searchForm.get('testId')?.setValue('T1');
      expect(component.searchForm.get('description')?.value).toBe('Test One');
    });

    it('should clear reagentId when testId changes', () => {
      component.searchForm.get('reagentId')?.setValue('R1', { emitEvent: false });
      component.searchForm.get('testId')?.setValue('T1');
      expect(component.searchForm.get('reagentId')?.value).toBe('');
    });

    it('should filter test options by search text', () => {
      component.testOptions = [
        { testId: 'ABORH', testDesc: 'ABO and Rh' },
        { testId: 'RH2', testDesc: 'Molecular C' },
      ];
      component.testSearchCtrl.setValue('abo');
      expect(component.filteredTestOptions.length).toBe(1);
      expect(component.filteredTestOptions[0].testId).toBe('ABORH');
    });

    it('should filter reagent code options by search text', () => {
      component.reagentCodeOptions = [
        { reagentCode: 'RG001', reagentName: 'Anti-A', preparationFlag: 'N', masterLotRequired: 'N' },
        { reagentCode: 'RG002', reagentName: 'Anti-B', preparationFlag: 'N', masterLotRequired: 'N' },
      ];
      component.reagentCodeSearchCtrl.setValue('Anti-A');
      expect(component.filteredReagentCodeOptions.length).toBe(1);
    });

    it('should filter reagent ID options by search text', () => {
      component.reagentIdOptions = [
        { value: 'R5077', label: 'R5077' },
        { value: 'R5078', label: 'R5078' },
      ];
      component.reagentIdSearchCtrl.setValue('5078');
      expect(component.filteredReagentIdOptions.length).toBe(1);
    });

    it('should filter reagent type options by search text', () => {
      component.reagentTypeOptions = [
        { code: 'R', description: 'Reagent' },
        { code: 'C', description: 'Control' },
      ];
      component.reagentTypeSearchCtrl.setValue('Control');
      expect(component.filteredReagentTypeOptions.length).toBe(1);
    });

    it('should filter supplier options by search text', () => {
      component.supplierOptions = [{ supplierCode: 'SUP01', supplierName: 'ABC Suppliers' }];
      component.supplierSearchCtrl.setValue('ABC');
      expect(component.filteredSupplierOptions.length).toBe(1);
    });

    it('should filter container options by search text', () => {
      component.containerOptions = [{ code: 'C1', description: 'Fridge' }];
      component.containerSearchCtrl.setValue('Fridge');
      expect(component.filteredContainerOptions.length).toBe(1);
    });

    it('should filter storage location options by search text', () => {
      component.storageLocationOptions = [{ code: 'SL1', description: 'Main' }];
      component.storageLocationSearchCtrl.setValue('Main');
      expect(component.filteredStorageLocationOptions.length).toBe(1);
    });

    it('should filter control indicator options by search text', () => {
      component.controlIndicatorOptions = [{ code: 'POS', description: 'Positive' }];
      component.controlIndicatorSearchCtrl.setValue('Pos');
      expect(component.filteredControlIndicatorOptions.length).toBe(1);
    });

    it('should filter reject reason options by search text', () => {
      component.rejectReasonOptions = [{ code: 'RR1', description: 'Contaminated' }];
      component.rejectReasonSearchCtrl.setValue('Contam');
      expect(component.filteredRejectReasonOptions.length).toBe(1);
    });
  });

  describe('Form field subscriptions', () => {
    beforeEach(() => fixture.detectChanges());

    it('should set reagent type description on type change', () => {
      component.reagentTypeOptions = [{ code: 'R', description: 'Reagent' }];
      component.reagentForm.get('reagentType')?.setValue('R');
      expect(component.reagentForm.get('reagentTypeDesc')?.value).toBe('Reagent');
    });

    it('should set supplier description on supplier change', () => {
      component.supplierOptions = [{ supplierCode: 'SUP01', supplierName: 'ABC' }];
      component.reagentForm.get('supplierCode')?.setValue('SUP01');
      expect(component.reagentForm.get('supplierDesc')?.value).toBe('ABC');
    });

    it('should set container type description on container change', () => {
      component.containerOptions = [{ code: 'C1', description: 'Fridge' }];
      component.reagentForm.get('containerType')?.setValue('C1');
      expect(component.reagentForm.get('containerTypeDesc')?.value).toBe('Fridge');
    });

    it('should set storage location description on location change', () => {
      component.storageLocationOptions = [{ code: 'SL1', description: 'Main Fridge' }];
      component.reagentForm.get('storageLocation')?.setValue('SL1');
      expect(component.reagentForm.get('storageLocationDesc')?.value).toBe('Main Fridge');
    });

    it('should require reject reason when visualQc is N', () => {
      component.reagentForm.get('visualQc')?.setValue('N');
      expect(component.reagentForm.get('rejectReason')?.hasError('required')).toBeTrue();
    });

    it('should clear and disable reject reason when visualQc is Y', () => {
      component.reagentForm.get('visualQc')?.setValue('N');
      component.reagentForm.get('rejectReason')?.setValue('RR1');
      component.reagentForm.get('visualQc')?.setValue('Y');
      expect(component.reagentForm.get('rejectReason')?.value).toBe('');
      expect(component.reagentForm.get('rejectReason')?.disabled).toBeTrue();
    });

    it('should set reject reason description on reason change', () => {
      component.rejectReasonOptions = [{ code: 'RR1', description: 'Contaminated' }];
      component.reagentForm.get('visualQc')?.setValue('N');
      component.reagentForm.get('rejectReason')?.setValue('RR1');
      expect(component.reagentForm.get('rejectReasonDesc')?.value).toBe('Contaminated');
    });
  });

  describe('Date input handling', () => {
    beforeEach(() => fixture.detectChanges());

    it('should handle date input for receivedDate', () => {
      const event = { target: { value: '15-JAN-2026' } } as any;
      expect(() => component.onDateInput(event, 'receivedDate')).not.toThrow();
    });
  });

  describe('Number input handling', () => {
    beforeEach(() => fixture.detectChanges());

    it('should allow numeric keys in noOfTests', () => {
      const event = new KeyboardEvent('keydown', { key: '5' });
      const input = document.createElement('input');
      input.value = '10';
      Object.defineProperty(event, 'target', { value: input });
      expect(() => component.onNoOfTestsKeydown(event)).not.toThrow();
    });

    it('should allow backspace in noOfTests', () => {
      const event = new KeyboardEvent('keydown', { key: 'Backspace' });
      expect(() => component.onNoOfTestsKeydown(event)).not.toThrow();
    });

    it('should strip non-numeric characters on noOfTests input', () => {
      const input = document.createElement('input');
      input.value = '12abc34';
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: input });
      component.onNoOfTestsInput(event);
      expect(component.reagentForm.get('noOfTests')?.value).toBe(1234);
    });
  });

  describe('Save error handling', () => {
    beforeEach(() => fixture.detectChanges());

    it('should show error when form is invalid on save', () => {
      component.isNewMode = true;
      component.isSupervisor = false;
      component.onSave();
      expect(snackbarService.showError).toHaveBeenCalledWith('Please fill in all required fields');
    });

    it('should handle create API error', fakeAsync(() => {
      apiService.create.and.returnValue(throwError(() => new Error('API Error')));
      component.isNewMode = true;
      component.isSupervisor = false;

      component.reagentForm.patchValue({
        reagentType: 'R', reagentCode: 'RG001', receivedDate: moment('2026-01-15'),
        expiryDate: '15-JAN-2027 00:00', supplierCode: 'SUP01', reagentLot: 'LOT456',
        minTemp: 2, maxTemp: 8, storageLocation: 'REF01', noOfTests: 100,
        visualQc: 'Y', packageInsertDate: 'JAN-2026',
      });
      component.onSave();
      tick();
      expect(component.isSaving).toBeFalse();
    }));

    it('should handle update API error', fakeAsync(() => {
      apiService.update.and.returnValue(throwError(() => new Error('API Error')));
      component.isNewMode = false;
      component.isSupervisor = true;
      component.currentReagent = mockReagent;
      component.searchForm.get('testId')?.setValue('TEST001', { emitEvent: false });
      component.searchForm.get('reagentId')?.setValue('R5077', { emitEvent: false });

      component.reagentForm.patchValue({
        reagentType: 'R', reagentCode: 'RG001', receivedDate: moment('2026-01-15'),
        expiryDate: '15-JAN-2027 00:00', supplierCode: 'SUP01', reagentLot: 'LOT456',
        minTemp: 2, maxTemp: 8, storageLocation: 'REF01', noOfTests: 95,
        visualQc: 'Y', packageInsertDate: 'JAN-2026',
      });
      component.onSave();
      tick();
      expect(component.isSaving).toBeFalse();
    }));

    it('should show warning when create returns error code 0224', fakeAsync(() => {
      apiService.create.and.returnValue(of({
        success: true,
        data: [{ reagentId: 'R5099' }],
        errorCode: '0224',
        errorResponse: { errorCode: '0224', error: 'Reagent expiry date has passed' },
      } as any));
      component.isNewMode = true;
      component.isSupervisor = false;

      component.reagentForm.patchValue({
        reagentType: 'R', reagentCode: 'RG001', receivedDate: moment('2026-01-15'),
        expiryDate: '15-JAN-2027 00:00', supplierCode: 'SUP01', reagentLot: 'LOT456',
        minTemp: 2, maxTemp: 8, storageLocation: 'REF01', noOfTests: 100,
        visualQc: 'Y', packageInsertDate: 'JAN-2026',
      });
      component.onSave();
      tick();
      expect(snackbarService.showInfo).toHaveBeenCalled();
    }));
  });

  describe('Retrieve edge cases', () => {
    beforeEach(() => fixture.detectChanges());

    it('should show error when no reagentId selected', () => {
      component.searchForm.patchValue({ testId: 'TEST001', reagentId: '' });
      component.onRetrieve();
      expect(snackbarService.showError).toHaveBeenCalledWith('Please select a Reagent ID');
    });

    it('should handle retrieve API error', fakeAsync(() => {
      apiService.getById.and.returnValue(throwError(() => new Error('Not found')));
      component.searchForm.patchValue({ testId: 'TEST001', reagentId: 'R9999' });
      component.onRetrieve();
      tick();
      expect(component.isLoading).toBeFalse();
    }));
  });

  describe('Lifecycle', () => {
    it('should clean up on destroy', () => {
      fixture.detectChanges();
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
