import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { HlaRbcRequestQueryComponent } from './hla-rbc-request-query';
import { HlaRbcRequestQueryService } from './services/hla-rbc-request-query.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatDialog } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { RequestListItem, RequestDetails } from './models/hla-rbc-request-query.model';
import { createMockSnackbarService, createMockPageHeaderService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('HlaRbcRequestQueryComponent', () => {
  let headerServiceSpy: any;
  let serviceSpy: any;
  let component: HlaRbcRequestQueryComponent;
  let fixture: ComponentFixture<HlaRbcRequestQueryComponent>;
  let service: jasmine.SpyObj<HlaRbcRequestQueryService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let dialog: jasmine.SpyObj<MatDialog>;

  const mockRequests: RequestListItem[] = [
    {
      requestId: 'REQ001',
      patientName: 'Smith, John',
      patientId: 'PAT123',
      hospitalName: 'General Hospital',
      status: 'OPEN',
      insertDate: '2026-05-15 10:30:00',
      requestType: 'HLA'
    }
  ];

  const mockRequestDetails: RequestDetails = {
    requestId: 'REQ001',
    patientName: 'Smith, John',
    patientId: 'PAT123',
    hospital: 'General Hospital',
    requestType: 'HLA PHENO',
    donorCount: 5,
    unitCount: 12,
    lastSearchDateTime: '2026-05-15 09:30:00',
    expectedTransfusionDates: [
      { date: '05-20-2026', quantity: 2 }
    ],
    unitRequest: 'Y',
    exactMatch: 'N',
    status: 'OPEN',
    hlaPheno: '1,19,5,40',
    hlaAnti: null,
    rbcAnti: 'K',
    rbcPheno: 'K1,Negative'
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('HlaRbcRequestQueryService', [
      'getRequestList',
      'getRequestDetails',
      'getMatchedDonors',
      'getMatchedUnits',
      'closeRequest',
      'getPatientDetail'
    ]);
    const snackbarSpy = createMockSnackbarService();
    const dialogSpy = createMockMatDialog();
    headerServiceSpy = createMockHeaderService();
    const pageHeaderServiceSpy = createMockPageHeaderService();



      TestBed.configureTestingModule({
      imports: [
        HlaRbcRequestQueryComponent,
        HttpClientTestingModule],
      providers: [
        { provide: HlaRbcRequestQueryService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        Overlay
      ]
    });





      serviceSpy.getRequestList.calls.reset();


      serviceSpy.getRequestDetails.calls.reset();


      serviceSpy.getMatchedDonors.calls.reset();


      serviceSpy.getMatchedUnits.calls.reset();


      serviceSpy.closeRequest.calls.reset();


      serviceSpy.getPatientDetail.calls.reset();
    service = TestBed.inject(HlaRbcRequestQueryService) as jasmine.SpyObj<HlaRbcRequestQueryService>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    fixture = TestBed.createComponent(HlaRbcRequestQueryComponent);
    component = fixture.componentInstance;


    });






  describe('Initialization', () => {
    it('should load available requests on init', () => {
      service.getRequestList.and.returnValue(of(mockRequests));
      dialog.open.and.returnValue({ afterClosed: () => of(null) } as any);

      component.onOpenRequestLookup();

      expect(service.getRequestList).toHaveBeenCalledWith({ status: 'OPEN' });
    });

    it('should handle error loading requests', () => {
      service.getRequestDetails.and.returnValue(throwError(() => new Error('API Error')));

      component.ngOnInit();
      component.requestIdControl.setValue('REQ001');
      component.onRetrieve();

      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to load request details');
    });

    it('should initialize table columns on init', () => {
      component.ngOnInit();

      expect(component.donorsTableConfig.columns.length).toBeGreaterThan(0);
      expect(component.unitsTableConfig.columns.length).toBeGreaterThan(0);
    });
  });

  describe('onRetrieve', () => {
    beforeEach(() => {
      service.getRequestList.and.returnValue(of(mockRequests));
      service.getRequestDetails.and.returnValue(of(mockRequestDetails));
      service.getMatchedDonors.and.returnValue(of([]));
      service.getMatchedUnits.and.returnValue(of([]));
      service.getPatientDetail.and.returnValue(of(null));
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should retrieve request details', () => {
      component.requestIdControl.setValue('REQ001');
      component.onRetrieve();

      expect(service.getRequestDetails).toHaveBeenCalledWith('REQ001');
      expect(component.requestDetails()).toBeTruthy();
    });



    it('should load donors and units after retrieving details', () => {
      component.requestIdControl.setValue('REQ001');
      component.onRetrieve();

      expect(service.getMatchedDonors).toHaveBeenCalledWith('REQ001');
      expect(service.getMatchedUnits).toHaveBeenCalledWith('REQ001');
    });
  });

  describe('onCloseRequest', () => {
    beforeEach(() => {
      service.getRequestList.and.returnValue(of(mockRequests));
      service.closeRequest.and.returnValue(of(true));
      component.ngOnInit();
      component.requestIdControl.setValue('REQ001');
    });



    it('should close request when confirmed', () => {
      dialog.open.and.returnValue({ afterClosed: () => of(true) } as any);
      component.onCloseRequest();

      expect(service.closeRequest).toHaveBeenCalledWith('REQ001');
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to units tab', () => {
      component.onTabChange(1);
      expect(component.activeTab()).toBe('units');
    });

    it('should switch to donors tab', () => {
      component.onTabChange(0);
      expect(component.activeTab()).toBe('donors');
    });
  });

  describe('Accessibility', () => {

    it('should have proper role attributes', () => {
      service.getRequestList.and.returnValue(of([]));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const sections = compiled.querySelectorAll('[role="region"]');

      expect(sections.length).toBeGreaterThan(0);
    });
  });

  describe('onClear', () => {
    it('should reset all form controls and state', () => {
      component.requestIdControl.setValue('REQ001');
      component.requestDetails.set({} as any);

      component.onClear();

      expect(component.requestIdControl.value).toBeNull();
      expect(component.requestDetails()).toBeNull();
      expect(component.allDonors().length).toBe(0);
      expect(component.allUnits().length).toBe(0);
    });
  });

  describe('onOpenRequestLookup', () => {
    it('should open the generic lookup dialog with correct config', () => {
      service.getRequestList.and.returnValue(of(mockRequests));
      dialog.open.and.returnValue({ afterClosed: () => of(null) } as any);

      component.onOpenRequestLookup();

      expect(dialog.open).toHaveBeenCalled();
      const callArgs = dialog.open.calls.mostRecent().args;
      const dialogConfig = callArgs[1];
      expect(dialogConfig.data.title).toBe('Request ID');
      expect(dialogConfig.data.selectionMode).toBe('single');
      expect(dialogConfig.data.selectionKey).toBe('requestId');
      expect(dialogConfig.panelClass).toBe('right-side-panel-dialog');
    });

    it('should set request ID and retrieve when item is selected', () => {
      service.getRequestList.and.returnValue(of(mockRequests));
      service.getRequestDetails.and.returnValue(of(mockRequestDetails));
      service.getMatchedDonors.and.returnValue(of([]));
      service.getMatchedUnits.and.returnValue(of([]));
      service.getPatientDetail.and.returnValue(of(null));
      component.ngOnInit();

      const selectedItem = mockRequests[0];
      dialog.open.and.returnValue({
        afterClosed: () => of({ cancelled: false, selectedItem })
      } as any);

      component.onOpenRequestLookup();

      expect(component.requestIdControl.value).toBe('REQ001');
      expect(service.getRequestDetails).toHaveBeenCalledWith('REQ001');
    });
  });

  describe('Computed Properties', () => {
    it('should correctly compute isRequestClosed', () => {
      component.requestDetails.set({ status: 'CLOSE' } as any);
      expect(component.isRequestClosed()).toBe(true);

      component.requestDetails.set({ status: 'OPEN' } as any);
      expect(component.isRequestClosed()).toBe(false);
    });

    it('should correctly compute hasRequestDetails', () => {
      component.requestDetails.set(null);
      expect(component.hasRequestDetails()).toBe(false);

      component.requestDetails.set({} as any);
      expect(component.hasRequestDetails()).toBe(true);
    });
  });

  describe('onRetrieve - additional cases', () => {
    beforeEach(() => {
      service.getRequestList.and.returnValue(of(mockRequests));
      component.ngOnInit();
    });

    it('should show error when no request ID is selected', () => {
      component.requestIdControl.setValue(null, { emitEvent: false });
      component.onRetrieve();
      expect(snackbarService.showError).toHaveBeenCalledWith('Please select a request ID');
    });

    it('should show error when request details not found', () => {
      service.getRequestDetails.and.returnValue(of(null as any));
      service.getMatchedDonors.and.returnValue(of([]));
      service.getMatchedUnits.and.returnValue(of([]));
      component.requestIdControl.setValue('REQ999', { emitEvent: false });
      component.onRetrieve();
      expect(snackbarService.showError).toHaveBeenCalledWith('Request not found');
    });

    it('should handle error loading request details', () => {
      service.getRequestDetails.and.returnValue(throwError(() => new Error('API Error')));
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      component.onRetrieve();
      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to load request details');
      expect(component.isLoadingDetails()).toBe(false);
    });
  });

  describe('loadPatientAntigenData', () => {
    beforeEach(() => {
      service.getRequestList.and.returnValue(of(mockRequests));
      service.getMatchedDonors.and.returnValue(of([]));
      service.getMatchedUnits.and.returnValue(of([]));
    });

    it('should load and map patient antigen data with all result codes', () => {
      const patientDetail = {
        patId: 'PAT123', patLastName: 'Smith', patFirstName: 'John',
        sex: 'M', dob: null, aboType: 'O+', status: 'A', comments: null,
        hlaAntigens: { a1: '1', a2: '19', b1: '5', b2: '40' },
        hlaAntibodies: [{ locus: 'A', epitopeId: 'A1' }],
        rbcAntibodies: [{ testId: 'K' }],
        rbcAntigens: [
          { testId: 'K1', resultCode: 'P' },
          { testId: 'E', resultCode: 'N' },
          { testId: 'C', resultCode: 'X' }
        ]
      };
      service.getRequestDetails.and.returnValue(of(mockRequestDetails));
      service.getPatientDetail.and.returnValue(of(patientDetail));

      component.ngOnInit();
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      component.onRetrieve();

      const details = component.requestDetails();
      expect(details).toBeTruthy();
      expect(details!.hlaPheno).toEqual({ a1: '1', a2: '19', b1: '5', b2: '40' });
      expect(details!.hlaAntiList).toEqual([{ locus: 'A', antigen: 'A1' }]);
      expect(details!.rbcAntiList).toEqual([{ antibody: 'K' }]);
      expect(details!.rbcPhenoList.length).toBe(3);
      expect(details!.rbcPhenoList[0].testResult).toBe('+');
      expect(details!.rbcPhenoList[1].testResult).toBe('-');
      expect(details!.rbcPhenoList[2].testResult).toBe('X');
    }, 15000);

    it('should handle patient detail with no HLA antigens', () => {
      const patientDetail = {
        patId: 'PAT123', patLastName: 'Smith', patFirstName: 'John',
        sex: null, dob: null, aboType: null, status: null, comments: null,
        hlaAntigens: null, hlaAntibodies: null, rbcAntibodies: null, rbcAntigens: null
      };
      service.getRequestDetails.and.returnValue(of(mockRequestDetails));
      service.getPatientDetail.and.returnValue(of(patientDetail));

      component.ngOnInit();
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      component.onRetrieve();

      const details = component.requestDetails();
      expect(details).toBeTruthy();
      expect(details!.hlaPheno).toBeNull();
      expect(details!.hlaAntiList).toEqual([]);
      expect(details!.rbcAntiList).toEqual([]);
      expect(details!.rbcPhenoList).toEqual([]);
    }, 15000);

    it('should handle error loading patient antigen data', () => {
      service.getRequestDetails.and.returnValue(of(mockRequestDetails));
      service.getPatientDetail.and.returnValue(throwError(() => new Error('API Error')));

      component.ngOnInit();
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      component.onRetrieve();

      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to load patient antigen data');
    }, 15000);
  });

  describe('loadMatchingResults - error paths', () => {
    beforeEach(() => {
      service.getRequestList.and.returnValue(of(mockRequests));
      service.getRequestDetails.and.returnValue(of(mockRequestDetails));
      service.getPatientDetail.and.returnValue(of(null));
      component.ngOnInit();
    });

    it('should handle error loading matched donors', () => {
      service.getMatchedDonors.and.returnValue(throwError(() => new Error('Donor Error')));
      service.getMatchedUnits.and.returnValue(of([]));

      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      component.onRetrieve();

      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to load matched donors');
      expect(component.isLoadingDonors()).toBe(false);
    });

    it('should handle error loading matched units', () => {
      service.getMatchedDonors.and.returnValue(of([]));
      service.getMatchedUnits.and.returnValue(throwError(() => new Error('Unit Error')));

      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      component.onRetrieve();

      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to load matched units');
      expect(component.isLoadingUnits()).toBe(false);
    });
  });

  describe('Donor Search', () => {
    beforeEach(() => {
      service.getRequestList.and.returnValue(of(mockRequests));
      component.ngOnInit();
      component.allDonors.set([
        { donorId: 'DON001', lastName: 'Doe', firstName: 'John', gender: 'M', grade: 'A', gradeLevel: 1, pattern: 'EXACT', bloodType: 'O+', antigens: 'K-', cmvStatus: 'NEG', selected: false } as any,
        { donorId: 'DON002', lastName: 'Smith', firstName: 'Jane', gender: 'F', grade: 'B', gradeLevel: 2, pattern: 'PARTIAL', bloodType: 'A+', antigens: 'K+', cmvStatus: 'POS', selected: false } as any
      ]);
    });

    it('should filter donors by search text', () => {
      component.onDonorSearch('DON001');
      expect(component.filteredDonors().length).toBe(1);
      expect(component.filteredDonors()[0].donorId).toBe('DON001');
    });

    it('should reset donors when search text is empty', () => {
      component.onDonorSearch('');
      expect(component.filteredDonors().length).toBe(2);
    });

    it('should clear donor search', () => {
      component.filteredDonors.set([]);
      component.onDonorSearchCleared();
      expect(component.filteredDonors().length).toBe(2);
    });
  });

  describe('Unit Search', () => {
    beforeEach(() => {
      service.getRequestList.and.returnValue(of(mockRequests));
      component.ngOnInit();
      component.allUnits.set([
        { unitId: 'UNIT001', collectionDate: '05-10-2026', donorId: 'DON001', grade: 'A', gradeLevel: 1, match: 'EXACT', bloodType: 'O+', antigenString: 'K-', warehouseCode: 'WH01', inventoryClass: 'RBC', productType: 'PRBC', cmvStatus: 'NEG' } as any,
        { unitId: 'UNIT002', collectionDate: '05-11-2026', donorId: 'DON002', grade: 'B', gradeLevel: 2, match: 'PARTIAL', bloodType: 'A+', antigenString: 'K+', warehouseCode: 'WH02', inventoryClass: 'RBC', productType: 'PRBC', cmvStatus: 'POS' } as any
      ]);
    });

    it('should filter units by search text', () => {
      component.onUnitSearch('UNIT001');
      expect(component.filteredUnits().length).toBe(1);
      expect(component.filteredUnits()[0].unitId).toBe('UNIT001');
    });

    it('should reset units when search text is empty', () => {
      component.onUnitSearch('');
      expect(component.filteredUnits().length).toBe(2);
    });

    it('should clear unit search', () => {
      component.filteredUnits.set([]);
      component.onUnitSearchCleared();
      expect(component.filteredUnits().length).toBe(2);
    });
  });

  describe('Selection handling', () => {
    it('should update selected donors', () => {
      const donors = [{ donorId: 'DON001' }] as any[];
      component.onDonorSelectionChange(donors);
      expect(component.selectedDonors()).toEqual(donors);
    });

    it('should update selected units', () => {
      const units = [{ unitId: 'UNIT001' }] as any[];
      component.onUnitSelectionChange(units);
      expect(component.selectedUnits()).toEqual(units);
    });
  });

  describe('Sort handling', () => {
    beforeEach(() => {
      service.getRequestList.and.returnValue(of(mockRequests));
      service.getMatchedDonors.and.returnValue(of([]));
      service.getMatchedUnits.and.returnValue(of([]));
      component.ngOnInit();
    });

    it('should cycle donor sort through default -> A -> D -> default', () => {
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      service.getMatchedDonors.and.returnValue(of([]));

      component.onDonorSortChange({ column: 'grade', direction: 'A' });
      expect(component.donorsTableConfig.sortConfig?.direction).toBe('A');

      component.onDonorSortChange({ column: 'grade', direction: 'D' });
      expect(component.donorsTableConfig.sortConfig?.direction).toBe('D');

      component.onDonorSortChange({ column: 'grade', direction: 'default' as any });
      expect(component.donorsTableConfig.sortConfig?.direction).toBe('default');
    });

    it('should handle donor sort error', () => {
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      service.getMatchedDonors.and.returnValue(throwError(() => new Error('Sort Error')));

      component.onDonorSortChange({ column: 'grade', direction: 'A' });

      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to sort donors');
      expect(component.isLoadingDonors()).toBe(false);
    });

    it('should cycle unit sort through default -> A -> D -> default', () => {
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      service.getMatchedUnits.and.returnValue(of([]));

      component.onUnitSortChange({ column: 'unitId', direction: 'A' });
      expect(component.unitsTableConfig.sortConfig?.direction).toBe('A');

      component.onUnitSortChange({ column: 'unitId', direction: 'D' });
      expect(component.unitsTableConfig.sortConfig?.direction).toBe('D');

      component.onUnitSortChange({ column: 'unitId', direction: 'default' as any });
      expect(component.unitsTableConfig.sortConfig?.direction).toBe('default');
    });

    it('should handle unit sort error', () => {
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      service.getMatchedUnits.and.returnValue(throwError(() => new Error('Sort Error')));

      component.onUnitSortChange({ column: 'unitId', direction: 'A' });

      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to sort units');
      expect(component.isLoadingUnits()).toBe(false);
    });

    it('should not call API for donor sort when no requestId', () => {
      component.requestIdControl.setValue(null, { emitEvent: false });
      service.getMatchedDonors.calls.reset();

      component.onDonorSortChange({ column: 'grade', direction: 'A' });

      expect(service.getMatchedDonors).not.toHaveBeenCalled();
    });

    it('should not call API for unit sort when no requestId', () => {
      component.requestIdControl.setValue(null, { emitEvent: false });
      service.getMatchedUnits.calls.reset();

      component.onUnitSortChange({ column: 'unitId', direction: 'A' });

      expect(service.getMatchedUnits).not.toHaveBeenCalled();
    });

    it('should pass current filters to donor sort API call', () => {
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      component.appliedFilters.set({ grades: ['A', 'B'], level: 3 });
      service.getMatchedDonors.and.returnValue(of([]));

      component.onDonorSortChange({ column: 'grade', direction: 'A' });

      const callArgs = service.getMatchedDonors.calls.mostRecent().args;
      expect(callArgs[0]).toBe('REQ001');
      expect(callArgs[1].grades).toBe('A,B');
      expect(callArgs[1].maxGradeLevel).toBe(3);
    });

    it('should pass current filters to unit sort API call', () => {
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      component.appliedFilters.set({ grades: ['C'], level: 2 });
      service.getMatchedUnits.and.returnValue(of([]));

      component.onUnitSortChange({ column: 'unitId', direction: 'A' });

      const callArgs = service.getMatchedUnits.calls.mostRecent().args;
      expect(callArgs[0]).toBe('REQ001');
      expect(callArgs[1].grades).toBe('C');
      expect(callArgs[1].maxGradeLevel).toBe(2);
    });
  });

  describe('Print functionality', () => {
    beforeEach(() => {
      service.getRequestList.and.returnValue(of(mockRequests));
      component.ngOnInit();
      (service as any).printDonors = jasmine.createSpy('printDonors');
      (service as any).printUnits = jasmine.createSpy('printUnits');
    });

    it('should print donors when on donors tab', () => {
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      component.activeTab.set('donors');
      (service as any).printDonors.and.returnValue(of({}));

      component.onPrint();

      expect((service as any).printDonors).toHaveBeenCalledWith('REQ001');
      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Donor list has been generated successfully.');
    });

    it('should print units when on units tab', () => {
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      component.activeTab.set('units');
      (service as any).printUnits.and.returnValue(of({}));

      component.onPrint();

      expect((service as any).printUnits).toHaveBeenCalledWith('REQ001');
      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Unit list has been generated successfully.');
    });

    it('should handle print error with message', () => {
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      component.activeTab.set('donors');
      (service as any).printDonors.and.returnValue(throwError(() => ({ error: { message: 'Print error occurred' } })));

      component.onPrint();

      expect(snackbarService.showError).toHaveBeenCalledWith('Print error occurred');
    });

    it('should show default error when print error has no message', () => {
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      component.activeTab.set('donors');
      (service as any).printDonors.and.returnValue(throwError(() => ({})));

      component.onPrint();

      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to generate print report');
    });

    it('should not print when no requestId', () => {
      component.requestIdControl.setValue(null, { emitEvent: false });
      component.onPrint();
      expect((service as any).printDonors).not.toHaveBeenCalled();
      expect((service as any).printUnits).not.toHaveBeenCalled();
    });
  });

  describe('Call list creation', () => {
    beforeEach(() => {
      service.getRequestList.and.returnValue(of(mockRequests));
      component.ngOnInit();
      (service as any).createCallList = jasmine.createSpy('createCallList');
      spyOn(component['snackBar'], 'dismiss');
    });

    it('should not create call list when no requestId', () => {
      component.requestIdControl.setValue(null, { emitEvent: false });
      component.onCreateCallList();
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('should show error when no donors selected', () => {
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      component.selectedDonors.set([]);
      component.onCreateCallList();
      expect(snackbarService.showError).toHaveBeenCalledWith('Please select at least one donor');
    });

    it('should open list generation dialog when donors selected', () => {
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      component.selectedDonors.set([{ donorId: 'DON001' } as any]);
      dialog.open.and.returnValue({ afterClosed: () => of(null) } as any);

      component.onCreateCallList();

      expect(component['snackBar'].dismiss).toHaveBeenCalled();
      expect(dialog.open).toHaveBeenCalled();
    });

    it('should submit call list when dialog returns payload', () => {
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      component.selectedDonors.set([{ donorId: 'DON001' } as any]);
      const payload = { listName: 'Test', selectedDonorIds: ['DON001'] };
      dialog.open.and.returnValue({ afterClosed: () => of(payload) } as any);
      (service as any).createCallList.and.returnValue(of({ listId: 'L1', listSeq: 1, donorsAdded: 1 }));

      component.onCreateCallList();

      expect((service as any).createCallList).toHaveBeenCalledWith('REQ001', payload);
      expect(snackbarService.showSuccess).toHaveBeenCalledWith('List generated successfully.');
    });
  });

  describe('Close request - additional cases', () => {
    beforeEach(() => {
      service.getRequestList.and.returnValue(of(mockRequests));
      component.ngOnInit();
    });

    it('should not close request when no requestId', () => {
      component.requestIdControl.setValue(null, { emitEvent: false });
      component.onCloseRequest();
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('should not close request when dialog is cancelled', () => {
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      dialog.open.and.returnValue({ afterClosed: () => of(false) } as any);

      component.onCloseRequest();

      expect(service.closeRequest).not.toHaveBeenCalled();
    });

    it('should handle close request error', () => {
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      dialog.open.and.returnValue({ afterClosed: () => of(true) } as any);
      service.closeRequest.and.returnValue(throwError(() => new Error('Close Error')));

      component.onCloseRequest();

      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to close request');
    });

    it('should show success and clear on successful close', () => {
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      dialog.open.and.returnValue({ afterClosed: () => of(true) } as any);
      service.closeRequest.and.returnValue(of(true));

      component.onCloseRequest();

      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Request ID REQ001 has been closed successfully');
      expect(component.requestDetails()).toBeNull();
    });
  });

  describe('Dialog methods', () => {
    it('should open donor antigen dialog', () => {
      const donor = { donorId: 'DON001' } as any;
      component.onDonorAntigenClick(donor);
      expect(dialog.open).toHaveBeenCalled();
    });

    it('should open unit antigen dialog', () => {
      const unit = { unitId: 'UNIT001' } as any;
      component.onUnitRowClick(unit);
      expect(dialog.open).toHaveBeenCalled();
    });
  });

  describe('Filter handling', () => {
    beforeEach(() => {
      service.getRequestList.and.returnValue(of(mockRequests));
      service.getMatchedDonors.and.returnValue(of([]));
      service.getMatchedUnits.and.returnValue(of([]));
      component.ngOnInit();
    });

    it('should apply donor filters', () => {
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      component.activeTab.set('donors');
      service.getMatchedDonors.and.returnValue(of([]));

      component['applyFilters']({ grades: ['A', 'B'], level: 3 });

      expect(service.getMatchedDonors).toHaveBeenCalled();
      expect(component.appliedFilters()).toEqual({ grades: ['A', 'B'], level: 3 });
    });

    it('should apply unit filters', () => {
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      component.activeTab.set('units');
      service.getMatchedUnits.and.returnValue(of([]));

      component['applyFilters']({ grades: ['A'], level: 2, pattern: 'EXACT', abo: 'O+', antigens: 'K-' });

      expect(service.getMatchedUnits).toHaveBeenCalled();
    });

    it('should handle donor filter error', () => {
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      component.activeTab.set('donors');
      service.getMatchedDonors.and.returnValue(throwError(() => new Error('Filter Error')));

      component['applyFilters']({ grades: ['A'] });

      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to apply filters');
      expect(component.isLoadingDonors()).toBe(false);
    });

    it('should handle unit filter error', () => {
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      component.activeTab.set('units');
      service.getMatchedUnits.and.returnValue(throwError(() => new Error('Filter Error')));

      component['applyFilters']({ grades: ['A'] });

      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to apply filters');
      expect(component.isLoadingUnits()).toBe(false);
    });

    it('should not apply filters when no requestId', () => {
      component.requestIdControl.setValue(null, { emitEvent: false });
      service.getMatchedDonors.calls.reset();
      service.getMatchedUnits.calls.reset();

      component['applyFilters']({ grades: ['A'] });

      expect(service.getMatchedDonors).not.toHaveBeenCalled();
      expect(service.getMatchedUnits).not.toHaveBeenCalled();
    });

    it('should remove a filter chip and reapply remaining filters', () => {
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      component.activeTab.set('donors');
      component.appliedFilters.set({ grades: ['A', 'B'], level: 3 });
      service.getMatchedDonors.and.returnValue(of([]));

      component.onRemoveFilterChip('level');

      expect(component.appliedFilters()).toBeTruthy();
    });

    it('should clear all filters when last filter chip is removed', () => {
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      component.appliedFilters.set({ grades: ['A'] });
      service.getMatchedDonors.and.returnValue(of([]));
      service.getMatchedUnits.and.returnValue(of([]));

      component.onRemoveFilterChip('grades');

      expect(component.appliedFilters()).toBeNull();
      expect(component.filterChips()).toEqual([]);
    });

    it('should not remove filter when no filters applied', () => {
      component.appliedFilters.set(null);
      component.onRemoveFilterChip('grades');
      expect(component.appliedFilters()).toBeNull();
    });

    it('should clear all filters via onClearAllFilters', () => {
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      component.appliedFilters.set({ grades: ['A'] });
      component.filterChips.set([{ label: 'Grades: A', key: 'grades', value: 'A' }]);
      service.getMatchedDonors.and.returnValue(of([]));
      service.getMatchedUnits.and.returnValue(of([]));

      component.onClearAllFilters();

      expect(component.appliedFilters()).toBeNull();
      expect(component.filterChips()).toEqual([]);
    });

    it('should report hasActiveFilters correctly', () => {
      component.appliedFilters.set(null);
      expect(component.hasActiveFilters()).toBe(false);

      component.appliedFilters.set({ grades: ['A'] });
      expect(component.hasActiveFilters()).toBe(true);
    });
  });

  describe('Computed properties - donor/unit options', () => {
    it('should compute donorGradeOptions from allDonors', () => {
      component.allDonors.set([
        { donorId: 'D1', grade: 'A', gradeLevel: 1 } as any,
        { donorId: 'D2', grade: 'B', gradeLevel: 2 } as any,
        { donorId: 'D3', grade: 'A', gradeLevel: 1 } as any
      ]);
      const options = component.donorGradeOptions();
      expect(options).toEqual([{ value: 'A', label: 'A' }, { value: 'B', label: 'B' }]);
    });

    it('should compute donorLevelOptions from allDonors', () => {
      component.allDonors.set([
        { donorId: 'D1', grade: 'A', gradeLevel: 2 } as any,
        { donorId: 'D2', grade: 'B', gradeLevel: 1 } as any,
        { donorId: 'D3', grade: 'A', gradeLevel: 2 } as any
      ]);
      const options = component.donorLevelOptions();
      expect(options).toEqual([1, 2]);
    });

    it('should compute unitGradeOptions from allUnits', () => {
      component.allUnits.set([
        { unitId: 'U1', grade: 'B' } as any,
        { unitId: 'U2', grade: 'A' } as any
      ]);
      const options = component.unitGradeOptions();
      expect(options).toEqual([{ value: 'A', label: 'A' }, { value: 'B', label: 'B' }]);
    });

    it('should compute unitPatternOptions from allUnits', () => {
      component.allUnits.set([
        { unitId: 'U1', match: 'EXACT' } as any,
        { unitId: 'U2', match: 'PARTIAL' } as any,
        { unitId: 'U3', match: 'EXACT' } as any
      ]);
      const options = component.unitPatternOptions();
      expect(options).toEqual(['EXACT', 'PARTIAL']);
    });

    it('should compute unitAboOptions from allUnits', () => {
      component.allUnits.set([
        { unitId: 'U1', bloodType: 'O+' } as any,
        { unitId: 'U2', bloodType: 'A+' } as any
      ]);
      const options = component.unitAboOptions();
      expect(options).toEqual(['A+', 'O+']);
    });

    it('should compute unitAntigenOptions from allUnits', () => {
      component.allUnits.set([
        { unitId: 'U1', antigenString: 'K-,E-' } as any,
        { unitId: 'U2', antigenString: 'K+' } as any
      ]);
      const options = component.unitAntigenOptions();
      expect(options).toEqual(['K+', 'K-,E-']);
    });

    it('should compute unitLevelOptions from allUnits', () => {
      component.allUnits.set([
        { unitId: 'U1', gradeLevel: 3 } as any,
        { unitId: 'U2', gradeLevel: 1 } as any
      ]);
      const options = component.unitLevelOptions();
      expect(options).toEqual([1, 3]);
    });

    it('should compute showEmptyState', () => {
      component.requestDetails.set(null);
      expect(component.showEmptyState()).toBe(true);

      component.requestDetails.set({ status: 'CLOSE' } as any);
      expect(component.showEmptyState()).toBe(true);

      component.requestDetails.set({ status: 'OPEN' } as any);
      expect(component.showEmptyState()).toBe(false);
    });
  });

  describe('Detail card computed data', () => {
    it('should compute hlaPhenoData with data', () => {
      component.requestDetails.set({ hlaPheno: { a1: '1', a2: '19', b1: '5', b2: '40' } } as any);
      const data = component.hlaPhenoData();
      expect(data).toEqual([{ a1: '1', a2: '19', b1: '5', b2: '40' }]);
    });

    it('should compute hlaPhenoData with null values in hlaPheno', () => {
      component.requestDetails.set({ hlaPheno: { a1: null, a2: null, b1: null, b2: null } } as any);
      const data = component.hlaPhenoData();
      expect(data).toEqual([{ a1: '-', a2: '-', b1: '-', b2: '-' }]);
    });

    it('should compute hlaPhenoData with no requestDetails', () => {
      component.requestDetails.set(null);
      const data = component.hlaPhenoData();
      expect(data).toEqual([{ a1: '-', a2: '-', b1: '-', b2: '-' }]);
    });

    it('should compute hlaAntiData with data', () => {
      component.requestDetails.set({ hlaAntiList: [{ locus: 'A', antigen: 'A1' }] } as any);
      expect(component.hlaAntiData()).toEqual([{ locus: 'A', antigen: 'A1' }]);
    });

    it('should compute hlaAntiData with null values', () => {
      component.requestDetails.set({ hlaAntiList: [{ locus: null, antigen: null }] } as any);
      expect(component.hlaAntiData()).toEqual([{ locus: '-', antigen: '-' }]);
    });

    it('should compute hlaAntiData with empty list', () => {
      component.requestDetails.set({ hlaAntiList: [] } as any);
      expect(component.hlaAntiData()).toEqual([{ locus: '-', antigen: '-' }]);
    });

    it('should compute rbcAntiData with data', () => {
      component.requestDetails.set({ rbcAntiList: [{ antibody: 'K' }] } as any);
      expect(component.rbcAntiData()).toEqual([{ antibody: 'K' }]);
    });

    it('should compute rbcAntiData with null value', () => {
      component.requestDetails.set({ rbcAntiList: [{ antibody: null }] } as any);
      expect(component.rbcAntiData()).toEqual([{ antibody: '-' }]);
    });

    it('should compute rbcAntiData with empty list', () => {
      component.requestDetails.set({ rbcAntiList: [] } as any);
      expect(component.rbcAntiData()).toEqual([{ antibody: '-' }]);
    });

    it('should compute rbcPhenoData with data', () => {
      component.requestDetails.set({ rbcPhenoList: [{ antigen: 'K1', testResult: '+' }] } as any);
      expect(component.rbcPhenoData()).toEqual([{ antigen: 'K1', testResult: '+' }]);
    });

    it('should compute rbcPhenoData with null values', () => {
      component.requestDetails.set({ rbcPhenoList: [{ antigen: null, testResult: null }] } as any);
      expect(component.rbcPhenoData()).toEqual([{ antigen: '-', testResult: '-' }]);
    });

    it('should compute rbcPhenoData with empty list', () => {
      component.requestDetails.set({ rbcPhenoList: [] } as any);
      expect(component.rbcPhenoData()).toEqual([{ antigen: '-', testResult: '-' }]);
    });

    it('should compute scheduledDatesData with data', () => {
      component.requestDetails.set({ scheduledDates: [{ targetDate: '05-20-2026', units: 2 }] } as any);
      expect(component.scheduledDatesData()).toEqual([{ targetDate: '05-20-2026', units: '2' }]);
    });

    it('should compute scheduledDatesData with no details', () => {
      component.requestDetails.set(null);
      expect(component.scheduledDatesData()).toEqual([]);
    });
  });

  describe('Private utility methods', () => {
    it('should format date/time correctly', () => {
      const result = component['formatDateTime']('2026-05-15T09:30:00');
      expect(result).toContain('MAY');
      expect(result).toContain('2026');
      expect(result).toContain(':');
    });

    it('should return dash for null date/time', () => {
      expect(component['formatDateTime'](null)).toBe('-');
    });

    it('should return dash for empty date/time', () => {
      expect(component['formatDateTime']('')).toBe('-');
    });

    it('should return original value for invalid date/time', () => {
      expect(component['formatDateTime']('not-a-date')).toBe('not-a-date');
    });

    it('should format date correctly', () => {
      const result = component['formatDate']('2026-05-15');
      expect(result).toContain('MAY');
      expect(result).toContain('2026');
    });

    it('should return dash for null date', () => {
      expect(component['formatDate'](null)).toBe('-');
    });

    it('should return dash for empty date', () => {
      expect(component['formatDate']('')).toBe('-');
    });

    it('should return original value for invalid date', () => {
      expect(component['formatDate']('not-a-date')).toBe('not-a-date');
    });

    it('should get next sort direction: default -> A', () => {
      expect(component['getNextSortDirection']('default')).toBe('A');
    });

    it('should get next sort direction: A -> D', () => {
      expect(component['getNextSortDirection']('A')).toBe('D');
    });

    it('should get next sort direction: D -> default', () => {
      expect(component['getNextSortDirection']('D')).toBe('default');
    });

    it('should sort data ascending by string', () => {
      const data = [{ name: 'B' }, { name: 'A' }];
      const result = component['sortData'](data, { column: 'name', direction: 'A' });
      expect(result[0].name).toBe('A');
    });

    it('should sort data descending by string', () => {
      const data = [{ name: 'A' }, { name: 'B' }];
      const result = component['sortData'](data, { column: 'name', direction: 'D' });
      expect(result[0].name).toBe('B');
    });

    it('should sort data ascending by numeric values', () => {
      const data = [{ value: 3 }, { value: 1 }, { value: 2 }];
      const result = component['sortData'](data, { column: 'value', direction: 'A' });
      expect(result[0].value).toBe(1);
      expect(result[2].value).toBe(3);
    });

    it('should sort data descending by numeric values', () => {
      const data = [{ value: 1 }, { value: 3 }, { value: 2 }];
      const result = component['sortData'](data, { column: 'value', direction: 'D' });
      expect(result[0].value).toBe(3);
      expect(result[2].value).toBe(1);
    });

    it('should calculate dialog center position', () => {
      const pos = component['getDialogCenterPosition'](900, 339);
      expect(pos.left).toContain('px');
      expect(pos.top).toContain('px');
    });
  });

  describe('Lifecycle methods', () => {
    it('should clean up on destroy', () => {
      service.getRequestList.and.returnValue(of(mockRequests));
      component.ngOnInit();
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should set up column templates in ngAfterViewInit', () => {
      spyOn(window, 'setTimeout').and.callFake((fn: Function) => { fn(); return 0 as any; });
      component.ngAfterViewInit();
      // Verify that the column config update code ran without error
      expect(window.setTimeout).toHaveBeenCalled();
    });
  });

  describe('Tab change - filter clearing', () => {
    it('should clear filters and set active tab when switching tabs', () => {
      component.appliedFilters.set({ grades: ['A'] });
      component.filterChips.set([{ label: 'Grades: A', key: 'grades', value: 'A' }]);

      component.onTabChange(1);

      expect(component.appliedFilters()).toBeNull();
      expect(component.filterChips()).toEqual([]);
      expect(component.activeTab()).toBe('units');
    });
  });

  describe('Request search subscription', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should filter requests by search term', () => {
      service.getRequestList.and.returnValue(of(mockRequests));
      dialog.open.and.returnValue({ afterClosed: () => of(null) } as any);
      component.requestIdControl.setValue('REQ001');
      component.onOpenRequestLookup();

      const config = dialog.open.calls.mostRecent().args[1].data;
      expect(config.searchFields).toContain('requestId');
      expect(config.initialSearchTerm).toBe('REQ001');
    });

    it('should show all requests when search is empty', () => {
      service.getRequestList.and.returnValue(of(mockRequests));
      dialog.open.and.returnValue({ afterClosed: () => of(null) } as any);
      component.requestIdControl.setValue('');
      component.onOpenRequestLookup();

      const config = dialog.open.calls.mostRecent().args[1].data;
      expect(config.initialSearchTerm).toBe('');
    });

    it('should handle null search term', () => {
      service.getRequestList.and.returnValue(of(mockRequests));
      dialog.open.and.returnValue({ afterClosed: () => of(null) } as any);
      component.requestIdControl.setValue(null);
      component.onOpenRequestLookup();

      const config = dialog.open.calls.mostRecent().args[1].data;
      expect(config.initialSearchTerm).toBe('');
    });

    it('should filter case-insensitively', () => {
      service.getRequestList.and.returnValue(of(mockRequests));
      dialog.open.and.returnValue({ afterClosed: () => of(null) } as any);
      component.requestIdControl.setValue('req001');
      component.onOpenRequestLookup();

      const config = dialog.open.calls.mostRecent().args[1].data;
      expect(config.initialSearchTerm).toBe('req001');
      expect(config.searchFields.length).toBeGreaterThan(0);
    });
  });

  describe('Chapter changes subscription', () => {
    it('should reload requests on chapter change', () => {
      const chapterSubject = new Subject<void>();
      (headerServiceSpy as any).chapterChanged$ = chapterSubject.asObservable();

      component.ngOnInit();
      component.requestIdControl.setValue('REQ001');
      component.requestDetails.set({} as any);

      chapterSubject.next();

      expect(component.requestIdControl.value).toBeNull();
      expect(component.requestDetails()).toBeNull();
    });
  });

  describe('mapRequestDetailsToDisplay', () => {
    it('should map request details with inventorySearch N and exactMatch Y', () => {
      const details: RequestDetails = {
        ...mockRequestDetails,
        unitRequest: 'N',
        exactMatch: 'Y',
        hlaPheno: 'Y',
        hlaAnti: 'Y',
        rbcAnti: 'N',
        rbcPheno: 'N',
        lastSearchDateTime: null
      };

      const result = component['mapRequestDetailsToDisplay'](details);

      expect(result.requestId).toBe('REQ001');
      expect(result.inventorySearch).toBe(false);
      expect(result.exactMatch).toBe(true);
      expect(result.hlaPhenoEnabled).toBe(true);
      expect(result.hlaAntiEnabled).toBe(true);
      expect(result.rbcAntiEnabled).toBe(false);
      expect(result.rbcPhenoEnabled).toBe(false);
      expect(result.lastSearch).toBe('-');
      expect(result.scheduledDates.length).toBe(1);
      expect(result.status).toBe('OPEN');
    });

    it('should map request details with all Y flags', () => {
      const details: RequestDetails = {
        ...mockRequestDetails,
        unitRequest: 'Y',
        exactMatch: 'Y',
        hlaPheno: 'Y',
        hlaAnti: 'Y',
        rbcAnti: 'Y',
        rbcPheno: 'Y'
      };

      const result = component['mapRequestDetailsToDisplay'](details);

      expect(result.inventorySearch).toBe(true);
      expect(result.exactMatch).toBe(true);
      expect(result.hlaPhenoEnabled).toBe(true);
      expect(result.hlaAntiEnabled).toBe(true);
      expect(result.rbcAntiEnabled).toBe(true);
      expect(result.rbcPhenoEnabled).toBe(true);
    });
  });

  describe('Pagination updates', () => {
    beforeEach(() => {
      service.getRequestList.and.returnValue(of(mockRequests));
      component.ngOnInit();
    });

    it('should update donors table pagination', () => {
      component.filteredDonors.set([
        { donorId: 'D1' } as any,
        { donorId: 'D2' } as any
      ]);
      component['updateDonorsTablePagination']();
      expect(component.donorsTableConfig.pagination?.totalRecords).toBe(2);
    });

    it('should update units table pagination', () => {
      component.filteredUnits.set([
        { unitId: 'U1' } as any,
        { unitId: 'U2' } as any,
        { unitId: 'U3' } as any
      ]);
      component['updateUnitsTablePagination']();
      expect(component.unitsTableConfig.pagination?.totalRecords).toBe(3);
    });
  });

  describe('ID generation methods', () => {
    it('should generate element IDs', () => {
      const id = component.elementId('test');
      expect(id).toContain('hla-rbc-request-query-');
      expect(id).toContain('-test');
    });

    it('should generate error IDs', () => {
      const id = component.errorId('field');
      expect(id).toContain('-field-error');
    });

    it('should generate label IDs', () => {
      const id = component.labelId('field');
      expect(id).toContain('-field-label');
    });
  });

  describe('Edge cases for branch coverage', () => {
    beforeEach(() => {
      service.getRequestList.and.returnValue(of(mockRequests));
      component.ngOnInit();
    });

    it('should handle onClearAllFilters without requestId', () => {
      component.requestIdControl.setValue(null, { emitEvent: false });
      component.appliedFilters.set({ grades: ['A'] });
      component.filterChips.set([{ label: 'Grades: A', key: 'grades', value: 'A' }]);

      component.onClearAllFilters();

      expect(component.appliedFilters()).toBeNull();
      expect(component.filterChips()).toEqual([]);
    });

    it('should handle scheduledDatesData with null targetDate', () => {
      component.requestDetails.set({
        scheduledDates: [{ targetDate: null, units: 5 }]
      } as any);
      const data = component.scheduledDatesData();
      expect(data).toEqual([{ targetDate: '-', units: '5' }]);
    });

    it('should close filter panels via closeFilterPanel', () => {
      // Ensure closeFilterPanel does not throw when no panels are open
      expect(() => component['closeFilterPanel']()).not.toThrow();
    });

    it('should handle closeDonorFilterPanel when no overlay exists', () => {
      component['donorFilterOverlayRef'] = null;
      expect(() => component['closeDonorFilterPanel']()).not.toThrow();
    });

    it('should handle closeUnitFilterPanel when no overlay exists', () => {
      component['unitFilterOverlayRef'] = null;
      expect(() => component['closeUnitFilterPanel']()).not.toThrow();
    });

    it('should handle closeDonorFilterPanel when overlay exists', () => {
      const mockOverlay = { dispose: jasmine.createSpy('dispose') };
      component['donorFilterOverlayRef'] = mockOverlay as any;
      component['closeDonorFilterPanel']();
      expect(mockOverlay.dispose).toHaveBeenCalled();
      expect(component['donorFilterOverlayRef']).toBeNull();
    });

    it('should handle closeUnitFilterPanel when overlay exists', () => {
      const mockOverlay = { dispose: jasmine.createSpy('dispose') };
      component['unitFilterOverlayRef'] = mockOverlay as any;
      component['closeUnitFilterPanel']();
      expect(mockOverlay.dispose).toHaveBeenCalled();
      expect(component['unitFilterOverlayRef']).toBeNull();
    });

    it('should handle sortData with null/undefined values', () => {
      const data = [{ col: null }, { col: 'A' }, { col: undefined }];
      const result = component['sortData'](data, { column: 'col', direction: 'A' });
      expect(result.length).toBe(3);
    });

    it('should compute donorGradeOptions filtering out falsy grades', () => {
      component.allDonors.set([
        { donorId: 'D1', grade: 'A', gradeLevel: 1 } as any,
        { donorId: 'D2', grade: '', gradeLevel: 2 } as any,
        { donorId: 'D3', grade: null, gradeLevel: 3 } as any
      ]);
      const options = component.donorGradeOptions();
      expect(options).toEqual([{ value: 'A', label: 'A' }]);
    });

    it('should compute donorLevelOptions filtering out null levels', () => {
      component.allDonors.set([
        { donorId: 'D1', grade: 'A', gradeLevel: 1 } as any,
        { donorId: 'D2', grade: 'B', gradeLevel: null } as any
      ]);
      const options = component.donorLevelOptions();
      expect(options).toEqual([1]);
    });

    it('should compute unitPatternOptions filtering out falsy matches', () => {
      component.allUnits.set([
        { unitId: 'U1', match: 'EXACT' } as any,
        { unitId: 'U2', match: '' } as any,
        { unitId: 'U3', match: null } as any
      ]);
      const options = component.unitPatternOptions();
      expect(options).toEqual(['EXACT']);
    });

    it('should compute unitAboOptions filtering out falsy blood types', () => {
      component.allUnits.set([
        { unitId: 'U1', bloodType: 'O+' } as any,
        { unitId: 'U2', bloodType: '' } as any,
        { unitId: 'U3', bloodType: null } as any
      ]);
      const options = component.unitAboOptions();
      expect(options).toEqual(['O+']);
    });

    it('should compute unitAntigenOptions filtering out falsy antigen strings', () => {
      component.allUnits.set([
        { unitId: 'U1', antigenString: 'K-' } as any,
        { unitId: 'U2', antigenString: '' } as any,
        { unitId: 'U3', antigenString: null } as any
      ]);
      const options = component.unitAntigenOptions();
      expect(options).toEqual(['K-']);
    });

    it('should compute unitLevelOptions filtering out null levels', () => {
      component.allUnits.set([
        { unitId: 'U1', gradeLevel: 2 } as any,
        { unitId: 'U2', gradeLevel: null } as any
      ]);
      const options = component.unitLevelOptions();
      expect(options).toEqual([2]);
    });

    it('should compute unitGradeOptions filtering out falsy grades', () => {
      component.allUnits.set([
        { unitId: 'U1', grade: 'A' } as any,
        { unitId: 'U2', grade: '' } as any,
        { unitId: 'U3', grade: null } as any
      ]);
      const options = component.unitGradeOptions();
      expect(options).toEqual([{ value: 'A', label: 'A' }]);
    });

    it('should handle onOpenFilterPanel for donor tab toggling existing panel', () => {
      component.activeTab.set('donors');
      const mockOverlay = { dispose: jasmine.createSpy('dispose') };
      component['donorFilterOverlayRef'] = mockOverlay as any;

      const mockEvent = { currentTarget: document.createElement('button') } as any;
      component.onOpenFilterPanel(mockEvent);

      expect(mockOverlay.dispose).toHaveBeenCalled();
      expect(component['donorFilterOverlayRef']).toBeNull();
    });

    it('should handle onOpenFilterPanel for unit tab toggling existing panel', () => {
      component.activeTab.set('units');
      const mockOverlay = { dispose: jasmine.createSpy('dispose') };
      component['unitFilterOverlayRef'] = mockOverlay as any;

      const mockEvent = { currentTarget: document.createElement('button') } as any;
      component.onOpenFilterPanel(mockEvent);

      expect(mockOverlay.dispose).toHaveBeenCalled();
      expect(component['unitFilterOverlayRef']).toBeNull();
    });

    it('should handle updateDonorsTablePagination when no pagination config', () => {
      const origPagination = component.donorsTableConfig.pagination;
      component.donorsTableConfig.pagination = undefined as any;
      expect(() => component['updateDonorsTablePagination']()).not.toThrow();
      component.donorsTableConfig.pagination = origPagination;
    });

    it('should handle updateUnitsTablePagination when no pagination config', () => {
      const origPagination = component.unitsTableConfig.pagination;
      component.unitsTableConfig.pagination = undefined as any;
      expect(() => component['updateUnitsTablePagination']()).not.toThrow();
      component.unitsTableConfig.pagination = origPagination;
    });

    it('should apply donor filters and update base donors on success', () => {
      const mockDonors = [
        { donorId: 'D1', grade: 'A', gradeLevel: 1, pattern: 'EXACT', bloodType: 'O+', antigens: 'K-', cmvStatus: 'NEG' } as any
      ];
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      component.activeTab.set('donors');
      service.getMatchedDonors.and.returnValue(of(mockDonors));

      component['applyFilters']({ grades: ['A'], level: 1 });

      expect(component.filteredDonors().length).toBe(1);
      expect(component.isLoadingDonors()).toBe(false);
    });

    it('should apply unit filters and update base units on success', () => {
      const mockUnits = [
        { unitId: 'U1', grade: 'A', gradeLevel: 1, match: 'EXACT', bloodType: 'O+', antigenString: 'K-', warehouseCode: 'WH01', inventoryClass: 'RBC', productType: 'PRBC', cmvStatus: 'NEG' } as any
      ];
      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      component.activeTab.set('units');
      service.getMatchedUnits.and.returnValue(of(mockUnits));

      component['applyFilters']({ grades: ['A'], level: 1, pattern: 'EXACT', abo: 'O+', antigens: 'K-' });

      expect(component.filteredUnits().length).toBe(1);
      expect(component.isLoadingUnits()).toBe(false);
    });

    it('should handle getDialogCenterPosition with no sidebar element', () => {
      const pos = component['getDialogCenterPosition'](900, 339);
      expect(pos.left).toContain('px');
      expect(pos.top).toContain('px');
    });

    it('should handle loadMatchingResults success with real donor and unit data', () => {
      const donors = [
        { donorId: 'D1', grade: 'A', gradeLevel: 1, pattern: 'EXACT', bloodType: 'O+', antigens: 'K-', cmvStatus: 'NEG', lastName: 'Doe', firstName: 'John', gender: 'M', selected: false } as any
      ];
      const units = [
        { unitId: 'U1', collectionDate: '05-10-2026', donorId: 'D1', grade: 'A', gradeLevel: 1, match: 'EXACT', bloodType: 'O+', antigenString: 'K-', warehouseCode: 'WH01', inventoryClass: 'RBC', productType: 'PRBC', cmvStatus: 'NEG' } as any
      ];

      service.getRequestDetails.and.returnValue(of(mockRequestDetails));
      service.getMatchedDonors.and.returnValue(of(donors));
      service.getMatchedUnits.and.returnValue(of(units));
      service.getPatientDetail.and.returnValue(of(null));

      component.requestIdControl.setValue('REQ001', { emitEvent: false });
      component.onRetrieve();

      expect(component.allDonors().length).toBe(1);
      expect(component.filteredDonors().length).toBe(1);
      expect(component.allUnits().length).toBe(1);
      expect(component.filteredUnits().length).toBe(1);
      expect(component.isLoadingDonors()).toBe(false);
      expect(component.isLoadingUnits()).toBe(false);
    });
  });
});
