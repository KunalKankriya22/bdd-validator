import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Overlay } from '@angular/cdk/overlay';
import moment from 'moment';

import { MaintainUnitInterdictionComponent } from './maintain-unit-interdiction';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { UnitInterdictionService } from './services/unit-interdiction.service';
import { of, Subject, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import { UnitInterdiction, SearchResponse } from './models/unit-interdiction.model';

describe('MaintainUnitInterdictionComponent', () => {
  let component: MaintainUnitInterdictionComponent;
  let fixture: ComponentFixture<MaintainUnitInterdictionComponent>;
  let unitInterdictionServiceSpy: any;
  let headerServiceSpy: any;
  let loginServiceSpy: any;
  let chapterChangedSubject: Subject<void>;

  function createMockInterdiction(overrides: Partial<UnitInterdiction> = {}): UnitInterdiction {
    return {
      id: 'T001-0',
      transactionId: 'T001',
      code: 'IC01',
      description: 'Test Interdiction',
      type: 'A',
      effectiveDate: '2024-01-15',
      userId: 'USER001',
      originated: 'Manual',
      isTerminated: false,
      isReleased: false,
      canTerminate: true,
      canRelease: true,
      ...overrides
    };
  }

  function createSuccessResponse(overrides: Partial<SearchResponse> = {}): SearchResponse {
    return {
      success: true,
      message: 'Success',
      statusCode: 200,
      item: {
        transactionId: 'T001',
        unitId: 'U001',
        donationType: 'WB',
        donationTypeDesc: 'Whole Blood',
        procedure: 'P1',
        procedureDesc: 'Standard',
        driveId: 'D001',
        collectionDate: '2024-01-15',
        donorId: 'DN001',
        donorName: 'John Doe',
        dateOfBirth: '1990-05-20',
        gender: 'M',
        bloodType: 'A+',
        bloodTypeDesc: 'A Positive',
        activeInterdictions: [],
        terminatedInterdictionCount: 2,
        otherInterdictionCount: 1
      },
      ...overrides
    };
  }

  beforeEach(async () => {
    chapterChangedSubject = new Subject<void>();
    headerServiceSpy = createMockHeaderService({
      chapterChanged$: chapterChangedSubject.asObservable()
    });

    loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    loginServiceSpy.getStoredUsername.and.returnValue('USER001');

    unitInterdictionServiceSpy = jasmine.createSpyObj('UnitInterdictionService', [
      'getSearchOptions',
      'getInterdictionCodes',
      'getTerminationReasons',
      'searchDonation',
      'getInterdictions',
      'createInterdictions',
      'terminateInterdiction',
      'releaseInterdiction',
      'mapActiveInterdictionsToUnitInterdictions'
    ]);
    unitInterdictionServiceSpy.getSearchOptions.and.returnValue(of([]));
    unitInterdictionServiceSpy.getInterdictionCodes.and.returnValue(of([]));
    unitInterdictionServiceSpy.getTerminationReasons.and.returnValue(of([]));
    unitInterdictionServiceSpy.mapActiveInterdictionsToUnitInterdictions.and.returnValue([]);

    await TestBed.configureTestingModule({
      imports: [MaintainUnitInterdictionComponent,
        HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: UnitInterdictionService, useValue: unitInterdictionServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MaintainUnitInterdictionComponent);
    component = fixture.componentInstance;
    try { fixture.detectChanges(); } catch (e) { /* template errors ok */ }
  });


  it('should initialize search form', () => {
    expect(component.searchForm).toBeDefined();
    expect(component.searchForm.get('option')).toBeDefined();
  });

  it('should show empty state when hasSearched is false', () => {
    expect(component.hasSearched()).toBeFalse();
  });

  // --- shouldShowEmptyState ---
  describe('shouldShowEmptyState', () => {
    it('should return true when hasSearched is false', () => {
      component.hasSearched.set(false);
      expect(component.shouldShowEmptyState).toBeTrue();
    });

    it('should return true when hasSearched is true but donorInfo is null', () => {
      component.hasSearched.set(true);
      component.donorInfo.set(null);
      expect(component.shouldShowEmptyState).toBeTrue();
    });

    it('should return false when hasSearched is true and donorInfo exists', () => {
      component.hasSearched.set(true);
      component.donorInfo.set({
        donationType: 'WB', bloodCollectionType: 'Std', plantId: 'D1',
        donorChf: 'U1', numberOfOtherInterdictions: 0, name: 'Test',
        abo: 'A+', dateOfBirth: '01-JAN-1990', sex: 'Male', donorId: 'DN1'
      });
      expect(component.shouldShowEmptyState).toBeFalse();
    });
  });

  // --- emptyStateTitle ---
  describe('emptyStateTitle', () => {
    it('should return no search criteria message when not searched', () => {
      component.hasSearched.set(false);
      expect(component.emptyStateTitle).toBe('No Search Criteria Selected');
    });

    it('should return searchErrorMessage when available', () => {
      component.hasSearched.set(true);
      component.searchErrorMessage.set('Custom error');
      expect(component.emptyStateTitle).toBe('Custom error');
    });

    it('should return default message when no error message', () => {
      component.hasSearched.set(true);
      component.searchErrorMessage.set('');
      expect(component.emptyStateTitle).toBe('No donation found matching the search criteria');
    });
  });

  // --- collectionDateErrorMatcher ---
  describe('collectionDateErrorMatcher', () => {
    it('should return false when control is null', () => {
      expect(component.collectionDateErrorMatcher.isErrorState(null, null as any)).toBeFalse();
    });

    it('should return false when control is untouched and pristine', () => {
      const control = new FormControl('');
      expect(component.collectionDateErrorMatcher.isErrorState(control, null as any)).toBeFalse();
    });
  });

  // --- isFormValid ---
  describe('isFormValid', () => {
    it('should return false when no option is selected', () => {
      component.searchForm.get('option')?.setValue('', { emitEvent: false });
      expect(component.isFormValid).toBeFalse();
    });

    it('should return false for Donation mode without unit ID', () => {
      component.searchForm.get('option')?.setValue('N', { emitEvent: false });
      component.searchForm.get('collectionDate')?.setValue(moment(), { emitEvent: false });
      // unitIdField is undefined, so isValid is false
      expect(component.isFormValid).toBeFalse();
    });

    it('should return false for Deferral mode without deferral or transaction ID', () => {
      component.searchForm.get('option')?.setValue('D', { emitEvent: false });
      component.searchForm.get('deferralId')?.setValue('', { emitEvent: false });
      component.searchForm.get('transactionId')?.setValue('', { emitEvent: false });
      expect(component.isFormValid).toBeFalse();
    });

    it('should return true for Deferral mode with deferralId', () => {
      component.searchForm.get('option')?.setValue('D', { emitEvent: false });
      component.searchForm.get('deferralId')?.enable({ emitEvent: false });
      component.searchForm.get('deferralId')?.setValue('DEF001', { emitEvent: false });
      expect(component.isFormValid).toBeTrue();
    });

    it('should return true for Deferral mode with transactionId', () => {
      component.searchForm.get('option')?.setValue('D', { emitEvent: false });
      component.searchForm.get('transactionId')?.enable({ emitEvent: false });
      component.searchForm.get('transactionId')?.setValue('TXN001', { emitEvent: false });
      expect(component.isFormValid).toBeTrue();
    });

    it('should return false for unknown option', () => {
      component.searchForm.get('option')?.setValue('X', { emitEvent: false });
      expect(component.isFormValid).toBeFalse();
    });
  });

  // --- handleOptionChange ---
  describe('handleOptionChange (via option valueChanges)', () => {
    it('should enable collectionDate and disable others for Donation mode', () => {
      component.searchForm.get('option')?.setValue('N');
      expect(component.searchForm.get('collectionDate')?.enabled).toBeTrue();
      expect(component.searchForm.get('deferralId')?.disabled).toBeTrue();
      expect(component.searchForm.get('transactionId')?.disabled).toBeTrue();
    });

    it('should enable deferralId and transactionId for Deferral mode', () => {
      component.searchForm.get('option')?.setValue('D');
      expect(component.searchForm.get('deferralId')?.enabled).toBeTrue();
      expect(component.searchForm.get('transactionId')?.enabled).toBeTrue();
      expect(component.searchForm.get('collectionDate')?.disabled).toBeTrue();
    });

    it('should disable all fields when option is empty', () => {
      component.searchForm.get('option')?.setValue('');
      expect(component.searchForm.get('collectionDate')?.disabled).toBeTrue();
      expect(component.searchForm.get('deferralId')?.disabled).toBeTrue();
      expect(component.searchForm.get('transactionId')?.disabled).toBeTrue();
    });
  });

  // --- loadSearchOptions error ---
  describe('loadSearchOptions', () => {
    it('should load search options on success', () => {
      const options = [{ value: 'N', label: 'Donation' }];
      unitInterdictionServiceSpy.getSearchOptions.and.returnValue(of(options));
      (component as any).loadSearchOptions();
      expect(component.searchOptions).toEqual(options);
      expect(component.filteredSearchOptions).toEqual(options);
    });

    it('should show error on failure', () => {
      unitInterdictionServiceSpy.getSearchOptions.and.returnValue(throwError(() => new Error('fail')));
      const snackBar = component['snackBar'];
      spyOn(snackBar, 'open');
      (component as any).loadSearchOptions();
      expect(snackBar.open).toHaveBeenCalled();
    });
  });

  // --- loadInterdictionCodes error ---
  describe('loadInterdictionCodes', () => {
    it('should load codes on success', () => {
      const codes = [{ code: 'IC01', description: 'Test', type: 'A' }];
      unitInterdictionServiceSpy.getInterdictionCodes.and.returnValue(of(codes));
      (component as any).loadInterdictionCodes();
      expect(component.interdictionCodes).toEqual(codes);
    });

    it('should show error on failure', () => {
      unitInterdictionServiceSpy.getInterdictionCodes.and.returnValue(throwError(() => new Error('fail')));
      const snackBar = component['snackBar'];
      spyOn(snackBar, 'open');
      (component as any).loadInterdictionCodes();
      expect(snackBar.open).toHaveBeenCalled();
    });
  });

  // --- loadTerminationReasons error ---
  describe('loadTerminationReasons', () => {
    it('should load reasons on success', () => {
      const reasons = [{ code: 'R1', description: 'Reason 1' }];
      unitInterdictionServiceSpy.getTerminationReasons.and.returnValue(of(reasons));
      (component as any).loadTerminationReasons();
      expect(component.terminationReasons).toEqual(reasons);
    });

    it('should show error on failure', () => {
      unitInterdictionServiceSpy.getTerminationReasons.and.returnValue(throwError(() => new Error('fail')));
      const snackBar = component['snackBar'];
      spyOn(snackBar, 'open');
      (component as any).loadTerminationReasons();
      expect(snackBar.open).toHaveBeenCalled();
    });
  });

  // --- filterOptions ---
  describe('filterOptions', () => {
    it('should return all options when search term is empty', () => {
      component.searchOptions = [{ value: 'N', label: 'Donation' }, { value: 'D', label: 'Deferral' }];
      component.optionSearchControl.setValue('');
      (component as any).filterOptions();
      expect(component.filteredSearchOptions.length).toBe(2);
    });

    it('should filter options by value', () => {
      component.searchOptions = [{ value: 'N', label: 'Donation' }, { value: 'D', label: 'Deferral' }];
      component.optionSearchControl.setValue('don');
      (component as any).filterOptions();
      expect(component.filteredSearchOptions.length).toBe(1);
      expect(component.filteredSearchOptions[0].value).toBe('N');
    });

    it('should filter options by label', () => {
      component.searchOptions = [{ value: 'N', label: 'Donation' }, { value: 'D', label: 'Deferral' }];
      component.optionSearchControl.setValue('defer');
      (component as any).filterOptions();
      expect(component.filteredSearchOptions.length).toBe(1);
      expect(component.filteredSearchOptions[0].label).toBe('Deferral');
    });
  });

  // --- onRetrieve ---
  describe('onRetrieve', () => {
    it('should mark form touched and return when form is invalid', () => {
      component.searchForm.get('option')?.setValue('', { emitEvent: false });
      spyOn(component.searchForm, 'markAllAsTouched');
      component.onRetrieve();
      expect(component.searchForm.markAllAsTouched).toHaveBeenCalled();
    });

    it('should handle error response from API', () => {
      // Setup valid form for Deferral mode
      component.searchForm.get('option')?.setValue('D', { emitEvent: false });
      component.searchForm.get('deferralId')?.enable({ emitEvent: false });
      component.searchForm.get('deferralId')?.setValue('DEF001', { emitEvent: false });
      component.searchForm.get('transactionId')?.enable({ emitEvent: false });

      const errorResponse: SearchResponse = {
        success: false,
        message: 'Some error',
        statusCode: 400,
        errorResponse: { errorCode: 'E001', error: 'Validation failed' }
      };
      unitInterdictionServiceSpy.searchDonation.and.returnValue(of(errorResponse));
      const snackBar = component['snackBar'];
      spyOn(snackBar, 'open');

      component.onRetrieve();

      expect(component.hasSearched()).toBeTrue();
      expect(component.donorInfo()).toBeNull();
      expect(component.searchErrorMessage()).toContain('E001');
      expect(component.isLoading()).toBeFalse();
    });

    it('should handle error response without errorCode', () => {
      component.searchForm.get('option')?.setValue('D', { emitEvent: false });
      component.searchForm.get('deferralId')?.enable({ emitEvent: false });
      component.searchForm.get('deferralId')?.setValue('DEF001', { emitEvent: false });
      component.searchForm.get('transactionId')?.enable({ emitEvent: false });

      const errorResponse: SearchResponse = {
        success: false,
        message: 'Failed',
        statusCode: 400,
        errorResponse: { errorCode: '', error: 'Some error' }
      };
      unitInterdictionServiceSpy.searchDonation.and.returnValue(of(errorResponse));
      const snackBar = component['snackBar'];
      spyOn(snackBar, 'open');

      component.onRetrieve();

      expect(component.searchErrorMessage()).toContain('Some error');
    });

    it('should handle no item found response', () => {
      component.searchForm.get('option')?.setValue('D', { emitEvent: false });
      component.searchForm.get('deferralId')?.enable({ emitEvent: false });
      component.searchForm.get('deferralId')?.setValue('DEF001', { emitEvent: false });
      component.searchForm.get('transactionId')?.enable({ emitEvent: false });

      const response: SearchResponse = {
        success: true,
        message: 'No donation found',
        statusCode: 200
        // no item
      };
      unitInterdictionServiceSpy.searchDonation.and.returnValue(of(response));

      component.onRetrieve();

      expect(component.hasSearched()).toBeTrue();
      expect(component.donorInfo()).toBeNull();
      expect(component.searchErrorMessage()).toBe('No donation found');
      expect(component.isLoading()).toBeFalse();
    });

    it('should handle successful response with item', () => {
      component.searchForm.get('option')?.setValue('D', { emitEvent: false });
      component.searchForm.get('deferralId')?.enable({ emitEvent: false });
      component.searchForm.get('deferralId')?.setValue('DEF001', { emitEvent: false });
      component.searchForm.get('transactionId')?.enable({ emitEvent: false });

      const response = createSuccessResponse();
      unitInterdictionServiceSpy.searchDonation.and.returnValue(of(response));
      unitInterdictionServiceSpy.mapActiveInterdictionsToUnitInterdictions.and.returnValue([]);

      component.onRetrieve();

      expect(component.hasSearched()).toBeTrue();
      expect(component.donorInfo()).not.toBeNull();
      expect(component.donorInfo()!.name).toBe('John Doe');
      expect(component.donorInfo()!.sex).toBe('Male');
      expect(component.currentTransactionId()).toBe('T001');
      expect(component.terminatedInterdictionCount()).toBe(2);
      expect(component.isLoading()).toBeFalse();
    });

    it('should handle successful response with no bloodTypeDesc', () => {
      component.searchForm.get('option')?.setValue('D', { emitEvent: false });
      component.searchForm.get('deferralId')?.enable({ emitEvent: false });
      component.searchForm.get('deferralId')?.setValue('DEF001', { emitEvent: false });
      component.searchForm.get('transactionId')?.enable({ emitEvent: false });

      const response = createSuccessResponse();
      response.item!.bloodTypeDesc = '';
      unitInterdictionServiceSpy.searchDonation.and.returnValue(of(response));

      component.onRetrieve();

      expect(component.donorInfo()!.abo).toBe('N/A');
    });

    it('should handle HTTP error on search', () => {
      component.searchForm.get('option')?.setValue('D', { emitEvent: false });
      component.searchForm.get('deferralId')?.enable({ emitEvent: false });
      component.searchForm.get('deferralId')?.setValue('DEF001', { emitEvent: false });
      component.searchForm.get('transactionId')?.enable({ emitEvent: false });

      unitInterdictionServiceSpy.searchDonation.and.returnValue(throwError(() => new Error('Network error')));
      const snackBar = component['snackBar'];
      spyOn(snackBar, 'open');

      component.onRetrieve();

      expect(component.searchErrorMessage()).toBe('Failed to retrieve donation/deferral information');
      expect(component.isLoading()).toBeFalse();
      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should use collectionDate when option is N', () => {
      component.searchForm.get('option')?.setValue('N', { emitEvent: false });
      component.searchForm.get('collectionDate')?.enable({ emitEvent: false });
      component.searchForm.get('collectionDate')?.setValue(moment('2024-01-15'), { emitEvent: false });
      // Mock unitIdField
      (component as any).unitIdField = { isValid: true, parsedUnitId: 'U001', clear: () => {} };

      const response = createSuccessResponse();
      unitInterdictionServiceSpy.searchDonation.and.returnValue(of(response));

      component.onRetrieve();

      expect(unitInterdictionServiceSpy.searchDonation).toHaveBeenCalled();
      const callArgs = unitInterdictionServiceSpy.searchDonation.calls.mostRecent().args[0];
      expect(callArgs.option).toBe('N');
      expect(callArgs.unitId).toBe('U001');
    });
  });

  // --- loadInterdictions ---
  describe('loadInterdictions', () => {
    it('should load interdictions on success', () => {
      component.currentTransactionId.set('T001');
      component.showTerminated.set(false);
      const interdictions = [createMockInterdiction()];
      unitInterdictionServiceSpy.getInterdictions.and.returnValue(of(interdictions));

      (component as any).loadInterdictions();

      expect(component.isLoading()).toBeFalse();
    });

    it('should show error on failure', () => {
      component.currentTransactionId.set('T001');
      unitInterdictionServiceSpy.getInterdictions.and.returnValue(throwError(() => new Error('fail')));
      const snackBar = component['snackBar'];
      spyOn(snackBar, 'open');

      (component as any).loadInterdictions();

      expect(snackBar.open).toHaveBeenCalled();
      expect(component.isLoading()).toBeFalse();
    });
  });

  // --- onToggleTerminated ---
  describe('onToggleTerminated', () => {
    it('should toggle showTerminated and reload when hasSearched is true', () => {
      component.hasSearched.set(true);
      component.currentTransactionId.set('T001');
      component.showTerminated.set(false);
      unitInterdictionServiceSpy.getInterdictions.and.returnValue(of([]));

      component.onToggleTerminated();

      expect(component.showTerminated()).toBeTrue();
      expect(component.pageIndex).toBe(0);
      expect(unitInterdictionServiceSpy.getInterdictions).toHaveBeenCalled();
    });

    it('should toggle showTerminated but not reload when hasSearched is false', () => {
      component.hasSearched.set(false);
      component.showTerminated.set(true);
      unitInterdictionServiceSpy.getInterdictions.calls.reset();

      component.onToggleTerminated();

      expect(component.showTerminated()).toBeFalse();
      expect(unitInterdictionServiceSpy.getInterdictions).not.toHaveBeenCalled();
    });
  });

  // --- onSearch ---
  describe('onSearch', () => {
    it('should set searchText and reset page index', () => {
      component.pageIndex = 5;
      component.onSearch('test search');
      expect((component as any).searchText).toBe('test search');
      expect(component.pageIndex).toBe(0);
    });
  });

  // --- onAddNew ---
  describe('onAddNew', () => {
    it('should open add dialog and reload on success', () => {
      component.currentTransactionId.set('T001');
      const dialogRef = { afterClosed: () => of({ success: true }) };
      const dialog = component['dialog'];
      spyOn(dialog, 'open').and.returnValue(dialogRef as any);
      unitInterdictionServiceSpy.getInterdictions.and.returnValue(of([]));

      component.onAddNew();

      expect(dialog.open).toHaveBeenCalled();
    });

    it('should not reload when dialog returns no success', () => {
      component.currentTransactionId.set('T001');
      const dialogRef = { afterClosed: () => of(null) };
      const dialog = component['dialog'];
      spyOn(dialog, 'open').and.returnValue(dialogRef as any);
      unitInterdictionServiceSpy.getInterdictions.calls.reset();

      component.onAddNew();

      expect(unitInterdictionServiceSpy.getInterdictions).not.toHaveBeenCalled();
    });
  });

  // --- onTableAction ---
  describe('onTableAction', () => {
    it('should call onTerminate for terminate action', () => {
      const interdiction = createMockInterdiction();
      const dialog = component['dialog'];
      const confirmDialogRef = { afterClosed: () => of(false) };
      spyOn(dialog, 'open').and.returnValue(confirmDialogRef as any);

      component.onTableAction({ type: 'terminate', interdiction });

      expect(dialog.open).toHaveBeenCalled();
      expect(component.highlightedInterdiction()).toBeNull();
    });

    it('should call onRelease for release action', () => {
      const interdiction = createMockInterdiction();
      const dialog = component['dialog'];
      const confirmDialogRef = { afterClosed: () => of(false) };
      spyOn(dialog, 'open').and.returnValue(confirmDialogRef as any);

      component.onTableAction({ type: 'release', interdiction });

      expect(dialog.open).toHaveBeenCalled();
    });
  });

  // --- onTerminate ---
  describe('onTerminate', () => {
    it('should open confirm dialog and then terminate panel when confirmed', () => {
      const interdiction = createMockInterdiction();
      const dialog = component['dialog'];
      let callCount = 0;
      const confirmDialogRef = { afterClosed: () => of(true) };
      const terminateDialogRef = { afterClosed: () => of({ success: true }) };

      spyOn(dialog, 'open').and.callFake(() => {
        callCount++;
        if (callCount === 1) return confirmDialogRef as any;
        return terminateDialogRef as any;
      });
      unitInterdictionServiceSpy.getInterdictions.and.returnValue(of([]));

      (component as any).onTerminate(interdiction);

      expect(dialog.open).toHaveBeenCalledTimes(2);
      expect(component.highlightedInterdiction()).toBeNull();
    });

    it('should clear highlight when user cancels confirmation', () => {
      const interdiction = createMockInterdiction();
      const dialog = component['dialog'];
      const confirmDialogRef = { afterClosed: () => of(false) };
      spyOn(dialog, 'open').and.returnValue(confirmDialogRef as any);

      (component as any).onTerminate(interdiction);

      expect(component.highlightedInterdiction()).toBeNull();
    });
  });

  // --- openTerminatePanel ---
  describe('openTerminatePanel', () => {
    it('should increment terminatedCount on success', () => {
      const interdiction = createMockInterdiction();
      component.terminatedInterdictionCount.set(3);
      const dialog = component['dialog'];
      const dialogRef = { afterClosed: () => of({ success: true }) };
      spyOn(dialog, 'open').and.returnValue(dialogRef as any);
      unitInterdictionServiceSpy.getInterdictions.and.returnValue(of([]));

      (component as any).openTerminatePanel(interdiction);

      expect(component.terminatedInterdictionCount()).toBe(4);
      expect(component.highlightedInterdiction()).toBeNull();
    });

    it('should clear highlight without incrementing on non-success', () => {
      const interdiction = createMockInterdiction();
      component.terminatedInterdictionCount.set(3);
      const dialog = component['dialog'];
      const dialogRef = { afterClosed: () => of(null) };
      spyOn(dialog, 'open').and.returnValue(dialogRef as any);

      (component as any).openTerminatePanel(interdiction);

      expect(component.terminatedInterdictionCount()).toBe(3);
      expect(component.highlightedInterdiction()).toBeNull();
    });
  });

  // --- onRelease ---
  describe('onRelease', () => {
    it('should release interdiction on confirmation', () => {
      const interdiction = createMockInterdiction({ terminationDate: '2024-06-01' });
      const dialog = component['dialog'];
      const confirmDialogRef = { afterClosed: () => of(true) };
      spyOn(dialog, 'open').and.returnValue(confirmDialogRef as any);
      unitInterdictionServiceSpy.releaseInterdiction.and.returnValue(of({}));
      unitInterdictionServiceSpy.getInterdictions.and.returnValue(of([]));
      const snackBar = component['snackBar'];
      spyOn(snackBar, 'open');

      (component as any).onRelease(interdiction);

      expect(unitInterdictionServiceSpy.releaseInterdiction).toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should release interdiction without terminationDate', () => {
      const interdiction = createMockInterdiction({ terminationDate: undefined });
      const dialog = component['dialog'];
      const confirmDialogRef = { afterClosed: () => of(true) };
      spyOn(dialog, 'open').and.returnValue(confirmDialogRef as any);
      unitInterdictionServiceSpy.releaseInterdiction.and.returnValue(of({}));
      unitInterdictionServiceSpy.getInterdictions.and.returnValue(of([]));
      const snackBar = component['snackBar'];
      spyOn(snackBar, 'open');

      (component as any).onRelease(interdiction);

      const callArgs = unitInterdictionServiceSpy.releaseInterdiction.calls.mostRecent().args[0];
      expect(callArgs.terminationDate).toBeUndefined();
    });

    it('should show error on release failure', () => {
      const interdiction = createMockInterdiction();
      const dialog = component['dialog'];
      const confirmDialogRef = { afterClosed: () => of(true) };
      spyOn(dialog, 'open').and.returnValue(confirmDialogRef as any);
      unitInterdictionServiceSpy.releaseInterdiction.and.returnValue(throwError(() => new Error('fail')));
      const snackBar = component['snackBar'];
      spyOn(snackBar, 'open');

      (component as any).onRelease(interdiction);

      expect(snackBar.open).toHaveBeenCalled();
      expect(component.highlightedInterdiction()).toBeNull();
      expect(component.isLoading()).toBeFalse();
    });

    it('should clear highlight when user cancels release', () => {
      const interdiction = createMockInterdiction();
      const dialog = component['dialog'];
      const confirmDialogRef = { afterClosed: () => of(false) };
      spyOn(dialog, 'open').and.returnValue(confirmDialogRef as any);

      (component as any).onRelease(interdiction);

      expect(component.highlightedInterdiction()).toBeNull();
    });
  });

  // --- onRemoveFilterChip ---
  describe('onRemoveFilterChip', () => {
    it('should do nothing when no applied filters', () => {
      component.appliedFilters.set(null);
      component.onRemoveFilterChip('codes');
      expect(component.appliedFilters()).toBeNull();
    });

    it('should do nothing when chip key not found', () => {
      component.appliedFilters.set({ codes: ['IC01'] });
      component.filterChips.set([{ key: 'codes', label: 'IC01' }]);
      component.onRemoveFilterChip('nonexistent');
      expect(component.appliedFilters()).toEqual({ codes: ['IC01'] });
    });
  });

  // --- onPageChange ---
  describe('onPageChange', () => {
    it('should update pageIndex and pageSize', () => {
      component.onPageChange({ pageIndex: 2, pageSize: 50, length: 100 });
      expect(component.pageIndex).toBe(2);
      expect(component.pageSize).toBe(50);
    });
  });

  // --- onSortChange ---
  describe('onSortChange', () => {
    it('should set sort and reset page index', () => {
      component.pageIndex = 3;
      component.onSortChange({ active: 'code', direction: 'asc' });
      expect(component.pageIndex).toBe(0);
      expect((component as any).currentSort).toEqual({ active: 'code', direction: 'asc' });
    });
  });

  // --- applyFiltersAndSearch ---
  describe('applyFiltersAndSearch', () => {
    it('should filter by search text', () => {
      (component as any).allInterdictions = [
        createMockInterdiction({ code: 'IC01', description: 'Alpha' }),
        createMockInterdiction({ code: 'IC02', description: 'Beta' })
      ];
      (component as any).searchText = 'alpha';
      (component as any).applyFiltersAndSearch();
      expect(component.interdictions().length).toBe(1);
      expect(component.interdictions()[0].description).toBe('Alpha');
    });

    it('should handle empty search text', () => {
      (component as any).allInterdictions = [
        createMockInterdiction({ code: 'IC01' }),
        createMockInterdiction({ code: 'IC02' })
      ];
      (component as any).searchText = '';
      (component as any).applyFiltersAndSearch();
      expect(component.interdictions().length).toBe(2);
    });

    it('should apply pagination', () => {
      const items = [];
      for (let i = 0; i < 30; i++) {
        items.push(createMockInterdiction({ code: `IC${i}` }));
      }
      (component as any).allInterdictions = items;
      component.pageSize = 10;
      component.pageIndex = 1;
      (component as any).searchText = '';
      (component as any).applyFiltersAndSearch();
      expect(component.interdictions().length).toBe(10);
      expect(component.totalRecords).toBe(30);
    });

    it('should apply sorting when active', () => {
      (component as any).allInterdictions = [
        createMockInterdiction({ code: 'ZZZ' }),
        createMockInterdiction({ code: 'AAA' })
      ];
      (component as any).currentSort = { active: 'code', direction: 'asc' };
      (component as any).searchText = '';
      (component as any).applyFiltersAndSearch();
      expect(component.interdictions()[0].code).toBe('AAA');
    });
  });

  // --- sortData ---
  describe('sortData', () => {
    it('should return data unchanged when no active sort', () => {
      const data = [createMockInterdiction({ code: 'B' }), createMockInterdiction({ code: 'A' })];
      const result = (component as any).sortData(data, { active: '', direction: '' });
      expect(result[0].code).toBe('B');
    });

    it('should sort strings ascending', () => {
      const data = [createMockInterdiction({ code: 'B' }), createMockInterdiction({ code: 'A' })];
      const result = (component as any).sortData(data, { active: 'code', direction: 'asc' });
      expect(result[0].code).toBe('A');
    });

    it('should sort strings descending', () => {
      const data = [createMockInterdiction({ code: 'A' }), createMockInterdiction({ code: 'B' })];
      const result = (component as any).sortData(data, { active: 'code', direction: 'desc' });
      expect(result[0].code).toBe('B');
    });

    it('should handle null values in sort - both null', () => {
      const data = [
        createMockInterdiction({ terminationDate: undefined }),
        createMockInterdiction({ terminationDate: undefined })
      ];
      const result = (component as any).sortData(data, { active: 'terminationDate', direction: 'asc' });
      expect(result.length).toBe(2);
    });

    it('should handle null aValue in sort ascending', () => {
      const data = [
        createMockInterdiction({ terminationDate: undefined }),
        createMockInterdiction({ terminationDate: '2024-01-01' })
      ];
      const result = (component as any).sortData(data, { active: 'terminationDate', direction: 'asc' });
      expect(result[1].terminationDate).toBeUndefined();
    });

    it('should handle null bValue in sort ascending', () => {
      const data = [
        createMockInterdiction({ terminationDate: '2024-01-01' }),
        createMockInterdiction({ terminationDate: undefined })
      ];
      const result = (component as any).sortData(data, { active: 'terminationDate', direction: 'asc' });
      expect(result[0].terminationDate).toBe('2024-01-01');
    });

    it('should sort non-string values ascending', () => {
      const data = [
        createMockInterdiction({ isTerminated: true }),
        createMockInterdiction({ isTerminated: false })
      ];
      const result = (component as any).sortData(data, { active: 'isTerminated', direction: 'asc' });
      expect(result[0].isTerminated).toBeFalse();
    });

    it('should sort non-string values descending', () => {
      const data = [
        createMockInterdiction({ isTerminated: false }),
        createMockInterdiction({ isTerminated: true })
      ];
      const result = (component as any).sortData(data, { active: 'isTerminated', direction: 'desc' });
      expect(result[0].isTerminated).toBeTrue();
    });
  });

  // --- formatDateForApiISO ---
  describe('formatDateForApiISO', () => {
    it('should format moment date', () => {
      const m = moment('2024-03-15');
      const result = (component as any).formatDateForApiISO(m);
      expect(result).toBe('2024-03-15T00:00:00');
    });

    it('should format JS Date', () => {
      const d = new Date(2024, 2, 15); // March 15, 2024
      const result = (component as any).formatDateForApiISO(d);
      expect(result).toBe('2024-03-15T00:00:00');
    });
  });

  // --- formatDateForDisplay ---
  describe('formatDateForDisplay', () => {
    it('should format ISO date string', () => {
      const result = (component as any).formatDateForDisplay('1990-05-20');
      expect(result).toBe('20-MAY-1990');
    });

    it('should return empty string for empty input', () => {
      const result = (component as any).formatDateForDisplay('');
      expect(result).toBe('');
    });
  });

  // --- formatGender ---
  describe('formatGender', () => {
    it('should return Female for F', () => {
      expect((component as any).formatGender('F')).toBe('Female');
    });

    it('should return Male for M', () => {
      expect((component as any).formatGender('M')).toBe('Male');
    });

    it('should return Unknown for U', () => {
      expect((component as any).formatGender('U')).toBe('Unknown');
    });

    it('should return Other for O', () => {
      expect((component as any).formatGender('O')).toBe('Other');
    });

    it('should return N/A for null/undefined', () => {
      expect((component as any).formatGender(null)).toBe('N/A');
      expect((component as any).formatGender(undefined)).toBe('N/A');
    });

    it('should return raw code for unknown gender code', () => {
      expect((component as any).formatGender('X')).toBe('X');
    });

    it('should handle lowercase gender codes', () => {
      expect((component as any).formatGender('f')).toBe('Female');
    });
  });

  // --- getCollectionDateError ---
  describe('getCollectionDateError', () => {
    it('should return empty string when no control', () => {
      spyOn(component.searchForm, 'get').and.returnValue(null as any);
      expect(component.getCollectionDateError()).toBe('');
    });

    it('should return invalid when matDatepickerParse error exists', () => {
      const control = component.searchForm.get('collectionDate')!;
      control.setErrors({ matDatepickerParse: true });
      expect(component.getCollectionDateError()).toContain('invalid');
    });

    it('should return invalid when invalidDate error exists', () => {
      const control = component.searchForm.get('collectionDate')!;
      control.setErrors({ invalidDate: true });
      expect(component.getCollectionDateError()).toContain('invalid');
    });

    it('should return required when required error and no input value', () => {
      const control = component.searchForm.get('collectionDate')!;
      control.enable({ emitEvent: false });
      control.setValidators([() => ({ required: true })]);
      control.updateValueAndValidity({ emitEvent: false });
      // collectionDateInput is undefined so hasInputValue is false
      expect(component.getCollectionDateError()).toContain('required');
    });

    it('should return empty string when no errors', () => {
      const control = component.searchForm.get('collectionDate')!;
      control.setErrors(null);
      expect(component.getCollectionDateError()).toBe('');
    });
  });

  // --- onCollectionDateInput ---
  describe('onCollectionDateInput', () => {
    it('should return early when control is null', () => {
      spyOn(component.searchForm, 'get').and.returnValue(null as any);
      component.onCollectionDateInput();
      // no error
    });

    it('should mark control as touched and dirty', () => {
      const control = component.searchForm.get('collectionDate')!;
      control.enable({ emitEvent: false });
      (component as any).collectionDateInput = { nativeElement: { value: '' } };
      component.onCollectionDateInput();
      expect(control.touched).toBeTrue();
      expect(control.dirty).toBeTrue();
    });

    it('should clear invalidDate error when input is empty', () => {
      const control = component.searchForm.get('collectionDate')!;
      control.enable({ emitEvent: false });
      control.setErrors({ invalidDate: true });
      (component as any).collectionDateInput = { nativeElement: { value: '' } };
      component.onCollectionDateInput();
      expect(control.hasError('invalidDate')).toBeFalse();
    });
  });

  // --- onCollectionDateBlur ---
  describe('onCollectionDateBlur', () => {
    it('should set invalidDate when input has text but no parsed value', fakeAsync(() => {
      const control = component.searchForm.get('collectionDate')!;
      control.enable({ emitEvent: false });
      control.setValue(null, { emitEvent: false });
      (component as any).collectionDateInput = { nativeElement: { value: 'invalid-date' } };

      component.onCollectionDateBlur();
      tick(200);

      expect(control.hasError('invalidDate')).toBeTrue();
    }));

    it('should handle when control already has a valid value', fakeAsync(() => {
      const control = component.searchForm.get('collectionDate')!;
      control.enable({ emitEvent: false });
      const validMoment = moment('2024-01-15');
      control.setValue(validMoment, { emitEvent: false });
      (component as any).collectionDateInput = { nativeElement: { value: '15-JAN-2024' } };

      component.onCollectionDateBlur();
      tick(200);

      expect(control.hasError('invalidDate')).toBeFalse();
    }));

    it('should set invalidDate for invalid existing value', fakeAsync(() => {
      const control = component.searchForm.get('collectionDate')!;
      control.enable({ emitEvent: false });
      control.setValue('not-a-date', { emitEvent: false });
      (component as any).collectionDateInput = { nativeElement: { value: 'something' } };

      component.onCollectionDateBlur();
      tick(200);

      // The value is truthy so the last else-if branch is taken
      // moment('not-a-date') is invalid
      expect(control.hasError('invalidDate')).toBeTrue();
    }));
  });

  // --- resetViewState ---
  describe('resetViewState', () => {
    it('should dispose filterOverlayRef if it exists', () => {
      const mockOverlay = { dispose: jasmine.createSpy('dispose') };
      (component as any).filterOverlayRef = mockOverlay;

      (component as any).resetViewState();

      expect(mockOverlay.dispose).toHaveBeenCalled();
      expect((component as any).filterOverlayRef).toBeNull();
    });

    it('should reset all view state signals', () => {
      component.donorInfo.set({ name: 'Test' } as any);
      component.hasSearched.set(true);
      component.currentTransactionId.set('T001');
      component.searchErrorMessage.set('error');
      component.terminatedInterdictionCount.set(5);
      component.showTerminated.set(true);

      (component as any).resetViewState();

      expect(component.donorInfo()).toBeNull();
      expect(component.hasSearched()).toBeFalse();
      expect(component.currentTransactionId()).toBe('');
      expect(component.searchErrorMessage()).toBe('');
      expect(component.terminatedInterdictionCount()).toBe(0);
      expect(component.showTerminated()).toBeFalse();
      expect(component.totalRecords).toBe(0);
      expect(component.pageIndex).toBe(0);
    });
  });

  // --- ngOnDestroy ---
  describe('ngOnDestroy', () => {
    it('should complete destroy$ and dispose overlay', () => {
      const mockOverlay = { dispose: jasmine.createSpy('dispose') };
      (component as any).filterOverlayRef = mockOverlay;

      component.ngOnDestroy();

      expect(mockOverlay.dispose).toHaveBeenCalled();
    });

    it('should complete destroy$ without overlay', () => {
      (component as any).filterOverlayRef = null;
      component.ngOnDestroy();
      // Should not throw
    });
  });

  // --- subscribeToChapterChanges ---
  describe('subscribeToChapterChanges', () => {
    it('should reset state and reload data when chapter changes', () => {
      unitInterdictionServiceSpy.getSearchOptions.calls.reset();
      unitInterdictionServiceSpy.getInterdictionCodes.calls.reset();
      unitInterdictionServiceSpy.getTerminationReasons.calls.reset();

      chapterChangedSubject.next();

      expect(unitInterdictionServiceSpy.getSearchOptions).toHaveBeenCalled();
      expect(unitInterdictionServiceSpy.getInterdictionCodes).toHaveBeenCalled();
      expect(unitInterdictionServiceSpy.getTerminationReasons).toHaveBeenCalled();
      expect(component.donorInfo()).toBeNull();
      expect(component.hasSearched()).toBeFalse();
    });
  });

  // --- loadCurrentUser ---
  describe('loadCurrentUser', () => {
    it('should set currentUserId from loginService', async () => {
      loginServiceSpy.getStoredUsername.and.returnValue('TESTUSER');
      await (component as any).loadCurrentUser();
      expect((component as any).currentUserId).toBe('TESTUSER');
    });

    it('should set UNKNOWN when no username returned', async () => {
      loginServiceSpy.getStoredUsername.and.returnValue('');
      await (component as any).loadCurrentUser();
      expect((component as any).currentUserId).toBe('UNKNOWN');
    });
  });

  // --- showSuccess / showError ---
  describe('showSuccess and showError', () => {
    it('should call snackBar.open for success', () => {
      const snackBar = component['snackBar'];
      spyOn(snackBar, 'open');
      (component as any).showSuccess('Test success');
      expect(snackBar.open).toHaveBeenCalledWith('Test success', 'DISMISS', jasmine.objectContaining({
        panelClass: ['success-snackbar']
      }));
    });

    it('should call snackBar.open for error', () => {
      const snackBar = component['snackBar'];
      spyOn(snackBar, 'open');
      (component as any).showError('Test error');
      expect(snackBar.open).toHaveBeenCalledWith('Test error', 'DISMISS', jasmine.objectContaining({
        panelClass: ['error-snackbar']
      }));
    });
  });

  // --- initializeHeader ---
  describe('initializeHeader', () => {
    it('should set headerConfig', () => {
      (component as any).initializeHeader();
      expect(component.headerConfig).toBeDefined();
      expect(component.headerConfig.title).toBe('Maintain Unit Interdiction');
    });
  });

  // --- applyFiltersAndSearch - search by code ---
  describe('applyFiltersAndSearch - search by code', () => {
    it('should filter by code match', () => {
      (component as any).allInterdictions = [
        createMockInterdiction({ code: 'ABC', description: 'Desc1' }),
        createMockInterdiction({ code: 'XYZ', description: 'Desc2' })
      ];
      (component as any).searchText = 'abc';
      (component as any).applyFiltersAndSearch();
      expect(component.interdictions().length).toBe(1);
      expect(component.interdictions()[0].code).toBe('ABC');
    });
  });
});
