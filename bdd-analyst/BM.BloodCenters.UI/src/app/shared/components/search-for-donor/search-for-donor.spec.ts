import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { SearchForDonorDialog } from './search-for-donor';
import { SearchForDonorService } from './search-for-donor.service';
import { DonorSearchResult } from './search-for-donor.model';

const makeDonor = (overrides: Partial<DonorSearchResult> = {}): DonorSearchResult => ({
  donorId: 'DN00000087',
  lastName: 'SMITH',
  firstName: 'JASON',
  middleName: 'MARY',
  dateOfBirth: '1990-01-15T00:00:00',
  gender: 'M',
  bloodType: 'O POS',
  address: '1234 MEDICAL DISTRICT DR',
  suiteApt: null,
  city: 'DALLAS',
  state: 'TX',
  zip: '75201',
  country: null,
  alternateId: null,
  alternateIdType: null,
  homeAreaCode: '214',
  homePhone: '2345678',
  dayAreaCode: null,
  dayPhone: null,
  mobileAreaCode: null,
  mobilePhone: null,
  intlHomePhone: null,
  intlWorkPhone: null,
  intlAddrFlag: 'N',
  preferredContactFlag: 'H',
  ...overrides
});

describe('SearchForDonorDialog', () => {
  let component: SearchForDonorDialog;
  let fixture: ComponentFixture<SearchForDonorDialog>;
  let mockSearchService: jasmine.SpyObj<SearchForDonorService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<SearchForDonorDialog>>;

  const mockSearchResults: DonorSearchResult[] = [
    makeDonor(),
    makeDonor({
      donorId: 'DN00000157',
      lastName: 'SMITH',
      firstName: 'JOHNSON',
      middleName: null,
      dateOfBirth: '1990-01-15T00:00:00',
      bloodType: null,
      address: null,
      city: null,
      state: null,
      zip: null,
      homeAreaCode: null,
      homePhone: null,
      intlAddrFlag: null,
      preferredContactFlag: null
    })
  ];

  beforeEach(() => {

    mockSearchService = jasmine.createSpyObj('SearchForDonorService', ['searchDonors']);
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);



      TestBed.configureTestingModule({
      imports: [
        SearchForDonorDialog,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatTableModule,
        MatIconModule,
        MatProgressSpinnerModule,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: SearchForDonorService, useValue: mockSearchService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    });


    


      mockSearchService.searchDonors.calls.reset();


      mockDialogRef.close.calls.reset();


    fixture = TestBed.createComponent(SearchForDonorDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  // ─── Creation ───────────────────────────────────────────────────────────────


  // ─── Form initialisation ─────────────────────────────────────────────────────



  // ─── Sex options labels ───────────────────────────────────────────────────────

  it('should expose MALE and FEMALE as uppercase sex option labels', () => {
    expect(component.sexOptions).toEqual([
      { value: 'M', label: 'MALE' },
      { value: 'F', label: 'FEMALE' }
    ]);
  });

  // ─── stripNonAlpha ────────────────────────────────────────────────────────────

  describe('stripNonAlpha', () => {
    it('should convert value to uppercase', () => {
      component.searchForm.patchValue({ lastName: 'smith' });
      component.stripNonAlpha('lastName');
      expect(component.searchForm.get('lastName')?.value).toBe('SMITH');
    });

    it('should strip non-alpha characters and uppercase', () => {
      component.searchForm.patchValue({ firstName: 'john123' });
      component.stripNonAlpha('firstName');
      expect(component.searchForm.get('firstName')?.value).toBe('JOHN');
    });

    it('should preserve spaces, hyphens and apostrophes while uppercasing', () => {
      component.searchForm.patchValue({ lastName: "o'brien-smith" });
      component.stripNonAlpha('lastName');
      expect(component.searchForm.get('lastName')?.value).toBe("O'BRIEN-SMITH");
    });

    it('should not modify an already-clean uppercase value', () => {
      component.searchForm.patchValue({ lastName: 'JONES' });
      component.stripNonAlpha('lastName');
      expect(component.searchForm.get('lastName')?.value).toBe('JONES');
    });
  });

  // ─── hasAnySearchCriteria ────────────────────────────────────────────────────

  it('should return false for hasAnySearchCriteria when form is empty', () => {
    component.searchForm.reset();
    expect(component.hasAnySearchCriteria()).toBe(false);
  });

  it('should return true for hasAnySearchCriteria when form has values', () => {
    component.searchForm.patchValue({ lastName: 'SMITH' });
    expect(component.hasAnySearchCriteria()).toBe(true);
  });

  // ─── onRetrieve ──────────────────────────────────────────────────────────────

  it('should call search service with correct criteria on retrieve', () => {
    component.searchForm.patchValue({ lastName: 'SMITH', firstName: 'JASON', sex: 'M' });
    mockSearchService.searchDonors.and.returnValue(of({ data: mockSearchResults, total: 2 }));

    component.onRetrieve();

    expect(mockSearchService.searchDonors).toHaveBeenCalledWith({
      lastName: 'SMITH',
      firstName: 'JASON',
      gender: 'M'
    });
  });

  it('should display results after successful search', () => {
    component.searchForm.patchValue({ lastName: 'SMITH' });
    mockSearchService.searchDonors.and.returnValue(of({ data: mockSearchResults, total: 2 }));

    component.onRetrieve();

    expect(component.results).toEqual(mockSearchResults);
    expect(component.hasSearched).toBe(true);
    expect(component.loading).toBe(false);
  });

  it('should handle error response with error code', () => {
    const errorResponse = {
      error: {
        errorResponse: {
          errorCode: '11090',
          error: 'Criteria returns too many matches, select additional criteria.'
        }
      }
    };
    component.searchForm.patchValue({ lastName: 'SMITH' });
    mockSearchService.searchDonors.and.returnValue(throwError(() => errorResponse));

    component.onRetrieve();

    expect(component.errorCode).toBe('11090');
    expect(component.errorMessage).toBe('Criteria returns too many matches, select additional criteria.');
    expect(component.results).toEqual([]);
  });

  // ─── isNameMismatch ───────────────────────────────────────────────────────────
  // Returns true when a name field was searched but the result value differs
  // (soundex / nickname / partial match from the backend).
  // Returns false when names match exactly or the field was not searched.

  describe('isNameMismatch', () => {
    beforeEach(() => {
      mockSearchService.searchDonors.and.returnValue(of({ data: [], total: 0 }));
    });

    it('should return false when firstName exactly matches the searched term', () => {
      component.searchForm.patchValue({ firstName: 'JASON' });
      component.onRetrieve();
      expect(component.isNameMismatch(makeDonor({ firstName: 'JASON' }), 'firstName')).toBe(false);
    });

    it('should return true when firstName does not exactly match (soundex/fuzzy result)', () => {
      component.searchForm.patchValue({ firstName: 'JASON' });
      component.onRetrieve();
      expect(component.isNameMismatch(makeDonor({ firstName: 'JASPER' }), 'firstName')).toBe(true);
    });

    it('should return false when lastName exactly matches the searched term', () => {
      component.searchForm.patchValue({ lastName: 'SMITH' });
      component.onRetrieve();
      expect(component.isNameMismatch(makeDonor({ lastName: 'SMITH' }), 'lastName')).toBe(false);
    });

    it('should return true when lastName is a soundex/fuzzy result that differs', () => {
      component.searchForm.patchValue({ lastName: 'SMITH' });
      component.onRetrieve();
      expect(component.isNameMismatch(makeDonor({ lastName: 'SMYTHE' }), 'lastName')).toBe(true);
    });

    it('should return false when the field was not part of the search', () => {
      component.searchForm.patchValue({ lastName: 'SMITH' });
      component.onRetrieve();
      expect(component.isNameMismatch(makeDonor({ firstName: 'JASON' }), 'firstName')).toBe(false);
    });

    it('should return false when result matches searched term case-insensitively', () => {
      component.searchForm.patchValue({ firstName: 'JASON' });
      component.onRetrieve();
      expect(component.isNameMismatch(makeDonor({ firstName: 'jason' }), 'firstName')).toBe(false);
    });
  });

  // ─── isDobMismatch ───────────────────────────────────────────────────────────
  // Returns true when a DOB was searched but the result's DOB is not an exact
  // match (i.e. the backend returned it via flexible/partial matching).
  // Returns false when DOB was not searched or when it is an exact match.

  describe('isDobMismatch', () => {
    const setSearchedDob = (dob: string) => {
      (component as any).searchedCriteria = { dob };
    };

    it('should return false when dateOfBirth exactly matches the searched DOB (no mismatch to highlight)', () => {
      setSearchedDob('01/15/1990');
      expect(component.isDobMismatch(makeDonor({ dateOfBirth: '1990-01-15T00:00:00' }))).toBe(false);
    });

    it('should return false when dateOfBirth has no time component and exactly matches', () => {
      setSearchedDob('01/15/1990');
      expect(component.isDobMismatch(makeDonor({ dateOfBirth: '1990-01-15' }))).toBe(false);
    });

    it('should return true when dateOfBirth is a flexible/partial match (different from searched DOB)', () => {
      setSearchedDob('01/15/1990');
      expect(component.isDobMismatch(makeDonor({ dateOfBirth: '1985-05-20T00:00:00' }))).toBe(true);
    });

    it('should return true when only month+year match but day differs (flexible match)', () => {
      setSearchedDob('01/15/1990');
      expect(component.isDobMismatch(makeDonor({ dateOfBirth: '1990-01-20T00:00:00' }))).toBe(true);
    });

    it('should return true when month and day are swapped relative to searched DOB', () => {
      setSearchedDob('03/15/1990');
      // backend returns swapped-month/day flexible match
      expect(component.isDobMismatch(makeDonor({ dateOfBirth: '1990-15-03T00:00:00' }))).toBe(true);
    });

    it('should return false when no DOB was searched', () => {
      (component as any).searchedCriteria = {};
      expect(component.isDobMismatch(makeDonor())).toBe(false);
    });


  });

  // ─── getFullAddress ───────────────────────────────────────────────────────────

  describe('getFullAddress', () => {
    it('should return only street when city/state/zip are null', () => {
      const donor = makeDonor({ address: '1 MAIN ST', suiteApt: null, city: null, state: null, zip: null, country: null });
      expect(component.getFullAddress(donor)).toBe('1 MAIN ST');
    });

    it('should append #suiteApt to street when present', () => {
      const donor = makeDonor({ address: '1 MAIN ST', suiteApt: '5', city: null, state: null, zip: null, country: null });
      expect(component.getFullAddress(donor)).toBe('1 MAIN ST #5');
    });

    it('should format street, city, state and zip correctly', () => {
      const donor = makeDonor({ address: '1 MAIN ST', suiteApt: null, city: 'CHICAGO', state: 'IL', zip: '60601', country: null });
      expect(component.getFullAddress(donor)).toBe('1 MAIN ST, CHICAGO, IL 60601');
    });

    it('should include suiteApt with full address', () => {
      const donor = makeDonor({ address: '1 MAIN ST', suiteApt: '5', city: 'CHICAGO', state: 'IL', zip: '60601', country: null });
      expect(component.getFullAddress(donor)).toBe('1 MAIN ST #5, CHICAGO, IL 60601');
    });

    it('should append country when present', () => {
      const donor = makeDonor({ address: '1 MAIN ST', suiteApt: null, city: 'CHICAGO', state: 'IL', zip: '60601', country: 'USA' });
      expect(component.getFullAddress(donor)).toBe('1 MAIN ST, CHICAGO, IL 60601, USA');
    });

    it('should return - when all address fields are null', () => {
      const donor = makeDonor({ address: null, suiteApt: null, city: null, state: null, zip: null, country: null });
      expect(component.getFullAddress(donor)).toBe('-');
    });

    it('should handle city and state without zip', () => {
      const donor = makeDonor({ address: '1 MAIN ST', suiteApt: null, city: 'CHICAGO', state: 'IL', zip: null, country: null });
      expect(component.getFullAddress(donor)).toBe('1 MAIN ST, CHICAGO, IL');
    });
  });

  // ─── Row selection ────────────────────────────────────────────────────────────

  it('should select donor when row is clicked', () => {
    const donor = mockSearchResults[0];
    component.onRowSelect(donor);
    expect(component.selectedDonor).toEqual(donor);
  });

  it('should return true for isRowSelected when donor matches', () => {
    const donor = mockSearchResults[0];
    component.selectedDonor = donor;
    expect(component.isRowSelected(donor)).toBe(true);
  });

  // ─── onClear ──────────────────────────────────────────────────────────────────

  it('should clear form and results on clear', () => {
    component.searchForm.patchValue({ lastName: 'SMITH' });
    component.results = mockSearchResults;
    component.selectedDonor = mockSearchResults[0];
    component.hasSearched = true;

    component.onClear();

    expect(component.searchForm.get('lastName')?.value).toBeNull();
    expect(component.results).toEqual([]);
    expect(component.selectedDonor).toBeNull();
    expect(component.hasSearched).toBe(false);
  });

  // ─── Dialog actions ───────────────────────────────────────────────────────────





  it('should close error message when closeError is called', () => {
    component.errorMessage = 'Test error';
    component.errorCode = '11090';

    component.closeError();

    expect(component.errorMessage).toBeNull();
    expect(component.errorCode).toBeNull();
  });

  // ─── formatDate ───────────────────────────────────────────────────────────────

  it('should format date string correctly', () => {
    expect(component.formatDate('1990-01-15')).toBe('15-JAN-1990');
  });

  it('should format ISO datetime string correctly', () => {
    expect(component.formatDate('1990-01-15T00:00:00')).toBe('15-JAN-1990');
  });

  // ─── Button state ─────────────────────────────────────────────────────────────

  describe('isRetrieveDisabled', () => {
    it('should return true when loading', () => {
      component.loading = true;
      component.searchForm.patchValue({ lastName: 'SMITH' });
      expect(component.isRetrieveDisabled).toBe(true);
    });

    it('should return true when no search criteria', () => {
      component.searchForm.reset();
      expect(component.isRetrieveDisabled).toBe(true);
    });

    it('should return true when form is invalid', () => {
      component.searchForm.patchValue({ phoneNumber: 'abcdef' });
      component.searchForm.get('phoneNumber')?.setErrors({ pattern: true });
      expect(component.isRetrieveDisabled).toBe(true);
    });

    it('should return true when deferralId has value but not validated', () => {
      component.searchForm.patchValue({ deferralId: 'ABC123' });
      expect(component.isRetrieveDisabled).toBe(true);
    });

    it('should return true when dob has futureDob error', () => {
      component.searchForm.patchValue({ lastName: 'SMITH' });
      component.searchForm.get('dob')?.setErrors({ futureDob: true });
      expect(component.isRetrieveDisabled).toBe(true);
    });

    it('should return true when dob has invalidDate error', () => {
      component.searchForm.patchValue({ lastName: 'SMITH' });
      component.searchForm.get('dob')?.setErrors({ invalidDate: true });
      expect(component.isRetrieveDisabled).toBe(true);
    });

    it('should return false when criteria is valid', () => {
      component.searchForm.patchValue({ lastName: 'SMITH' });
      expect(component.isRetrieveDisabled).toBe(false);
    });
  });

  describe('isSelectDisabled', () => {
    it('should return true when no donor selected', () => {
      component.selectedDonor = null;
      expect(component.isSelectDisabled).toBe(true);
    });

    it('should return false when donor is selected', () => {
      component.selectedDonor = makeDonor();
      expect(component.isSelectDisabled).toBe(false);
    });
  });

  describe('onSelect', () => {
    it('should close dialog with selected donor', () => {
      const donor = makeDonor();
      component.selectedDonor = donor;
      component.onSelect();
      expect(mockDialogRef.close).toHaveBeenCalledWith({
        action: 'select',
        donor
      });
    });

    it('should not close dialog when no donor selected', () => {
      component.selectedDonor = null;
      component.onSelect();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    it('should close dialog with cancel action', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith({ action: 'cancel' });
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('onUnitIdValidated', () => {
    it('should store parsed donation ID', () => {
      component.onUnitIdValidated({ parsedUnitId: 'U12345' } as any);
      expect((component as any).parsedDonationId).toBe('U12345');
    });
  });

  describe('onUnitIdCleared', () => {
    it('should clear parsed donation ID', () => {
      (component as any).parsedDonationId = 'U12345';
      component.onUnitIdCleared();
      expect((component as any).parsedDonationId).toBeNull();
    });
  });

  describe('hasAnySearchCriteria - edge cases', () => {
    it('should return true when parsedDonationId is set', () => {
      component.searchForm.reset();
      (component as any).parsedDonationId = 'U12345';
      expect(component.hasAnySearchCriteria()).toBe(true);
    });

    it('should return true when validatedDeferralId is set', () => {
      component.searchForm.reset();
      (component as any).validatedDeferralId = 'D12345';
      expect(component.hasAnySearchCriteria()).toBe(true);
    });
  });

  describe('validateDob', () => {
    it('should have no errors when dob is empty', () => {
      component.searchForm.patchValue({ dob: '' });
      expect(component.searchForm.get('dob')?.errors).toBeNull();
    });

    it('should set futureDob error when dob is in the future', () => {
      const futureDate = moment().add(1, 'year');
      component.searchForm.get('dob')?.setValue(futureDate);
      component.validateDob();
      expect(component.searchForm.get('dob')?.hasError('futureDob')).toBe(true);
    });

    it('should clear futureDob error when dob is in the past', () => {
      const dob = component.searchForm.get('dob')!;
      const futureDate = moment().add(1, 'year');
      dob.setValue(futureDate);
      component.validateDob();
      expect(dob.hasError('futureDob')).toBe(true);
      dob.setValue(moment('1990-01-15'));
      component.validateDob();
      expect(dob.hasError('futureDob')).toBe(false);
    });
  });

  describe('onDobInput', () => {
    it('should clear value and errors when input is empty', () => {
      const dob = component.searchForm.get('dob')!;
      dob.setValue(moment('1990-01-15'));
      const event = { target: { value: '' } } as unknown as Event;
      component.onDobInput(event);
      expect(dob.value).toBeNull();
      expect(dob.errors).toBeNull();
    });

    it('should set invalidDate error when input has text but control value is null', () => {
      const dob = component.searchForm.get('dob')!;
      dob.setValue(null);
      const event = { target: { value: 'invalid' } } as unknown as Event;
      component.onDobInput(event);
      expect(dob.hasError('invalidDate')).toBe(true);
      expect(dob.touched).toBe(true);
    });

    it('should not set error when input has text and control has valid value', () => {
      const dob = component.searchForm.get('dob')!;
      dob.setValue(moment('1990-01-15'));
      const event = { target: { value: '15-JAN-1990' } } as unknown as Event;
      component.onDobInput(event);
      expect(dob.hasError('invalidDate')).toBeFalsy();
    });
  });

  describe('onDonorIdInput', () => {
    it('should uppercase donorId value', () => {
      component.searchForm.patchValue({ donorId: 'dn001' });
      component.onDonorIdInput();
      expect(component.searchForm.get('donorId')?.value).toBe('DN001');
    });

    it('should do nothing when donorId is empty', () => {
      component.searchForm.patchValue({ donorId: '' });
      component.onDonorIdInput();
      expect(component.searchForm.get('donorId')?.value).toBe('');
    });
  });

  describe('onDeferralIdBlur', () => {
    it('should clear validatedDeferralId when deferralId is empty', () => {
      (component as any).validatedDeferralId = 'D123';
      component.searchForm.patchValue({ deferralId: '' });
      component.onDeferralIdBlur();
      expect((component as any).validatedDeferralId).toBeNull();
    });

    it('should clear validatedDeferralId when deferralId is whitespace', () => {
      (component as any).validatedDeferralId = 'D123';
      component.searchForm.patchValue({ deferralId: '   ' });
      component.onDeferralIdBlur();
      expect((component as any).validatedDeferralId).toBeNull();
    });
  });

  describe('getPhoneNumber', () => {
    it('should return formatted home phone with HP prefix when preferred', () => {
      const donor = makeDonor({ homeAreaCode: '214', homePhone: '2345678', preferredContactFlag: 'H' });
      const result = component.getPhoneNumber(donor);
      expect(result).toContain('(HP)');
      expect(result).toContain('214');
    });

    it('should return formatted home phone with H prefix when not preferred', () => {
      const donor = makeDonor({ homeAreaCode: '214', homePhone: '2345678', preferredContactFlag: 'W' });
      const result = component.getPhoneNumber(donor);
      expect(result).toContain('(H)');
    });

    it('should return formatted day phone with WP prefix when preferred', () => {
      const donor = makeDonor({ homePhone: null, dayAreaCode: '972', dayPhone: '1234567', preferredContactFlag: 'W' });
      const result = component.getPhoneNumber(donor);
      expect(result).toContain('(WP)');
    });

    it('should return formatted mobile phone with MP prefix when preferred', () => {
      const donor = makeDonor({ homePhone: null, mobileAreaCode: '469', mobilePhone: '9876543', preferredContactFlag: 'M' });
      const result = component.getPhoneNumber(donor);
      expect(result).toContain('(MP)');
    });

    it('should return international phones when intlAddrFlag is Y', () => {
      const donor = makeDonor({ intlAddrFlag: 'Y', intlHomePhone: '+44 20 7946 0958', intlWorkPhone: '+44 20 7946 0959', preferredContactFlag: 'H' });
      const result = component.getPhoneNumber(donor);
      expect(result).toContain('(HP)');
      expect(result).toContain('+44 20 7946 0958');
      expect(result).toContain('(W)');
    });

    it('should return international work phone with WP prefix when preferred', () => {
      const donor = makeDonor({ intlAddrFlag: 'Y', intlHomePhone: null, intlWorkPhone: '+44 20 7946 0959', preferredContactFlag: 'W' });
      const result = component.getPhoneNumber(donor);
      expect(result).toContain('(WP)');
    });

    it('should return dash when no phones available', () => {
      const donor = makeDonor({ homePhone: null, dayPhone: null, mobilePhone: null, intlHomePhone: null, intlWorkPhone: null, intlAddrFlag: 'N' });
      expect(component.getPhoneNumber(donor)).toBe('-');
    });

    it('should handle multiple domestic phones', () => {
      const donor = makeDonor({ homeAreaCode: '214', homePhone: '2345678', dayAreaCode: '972', dayPhone: '1234567', preferredContactFlag: 'H' });
      const result = component.getPhoneNumber(donor);
      expect(result).toContain('(HP)');
      expect(result).toContain('(W)');
    });
  });

  describe('formatDate - edge cases', () => {
    it('should return - for null input', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return - for undefined input', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('should return - for empty string', () => {
      expect(component.formatDate('')).toBe('-');
    });

    it('should return original string for invalid date', () => {
      expect(component.formatDate('not-a-date')).toBe('not-a-date');
    });
  });

  describe('onRetrieve - edge cases', () => {
    it('should do nothing when no search criteria', () => {
      component.searchForm.reset();
      (component as any).parsedDonationId = null;
      (component as any).validatedDeferralId = null;
      component.onRetrieve();
      expect(mockSearchService.searchDonors).not.toHaveBeenCalled();
    });

    it('should send dob formatted for API', () => {
      component.searchForm.patchValue({ lastName: 'SMITH', dob: '01/15/1990' });
      mockSearchService.searchDonors.and.returnValue(of({ data: [], total: 0 }));
      component.onRetrieve();
      const args = mockSearchService.searchDonors.calls.mostRecent().args[0];
      expect(args.dob).toBe('01/15/1990');
    });

    it('should send phone number with area code for 10-digit input', () => {
      component.searchForm.patchValue({ areaCode: '214', phoneNumber: '2345678' });
      mockSearchService.searchDonors.and.returnValue(of({ data: [], total: 0 }));
      component.onRetrieve();
      const args = mockSearchService.searchDonors.calls.mostRecent().args[0];
      expect(args.areaCode).toBe('214');
      expect(args.phoneNo).toBe('2345678');
    });

    it('should send phone number without area code for shorter input', () => {
      component.searchForm.patchValue({ phoneNumber: '2345678' });
      mockSearchService.searchDonors.and.returnValue(of({ data: [], total: 0 }));
      component.onRetrieve();
      const args = mockSearchService.searchDonors.calls.mostRecent().args[0];
      expect(args.areaCode).toBeUndefined();
      expect(args.phoneNo).toBe('2345678');
    });

    it('should send address when provided', () => {
      component.searchForm.patchValue({ address: '123 Main St' });
      mockSearchService.searchDonors.and.returnValue(of({ data: [], total: 0 }));
      component.onRetrieve();
      const args = mockSearchService.searchDonors.calls.mostRecent().args[0];
      expect(args.address).toBe('123 Main St');
    });

    it('should send donorId when provided', () => {
      component.searchForm.patchValue({ donorId: 'DN001' });
      mockSearchService.searchDonors.and.returnValue(of({ data: [], total: 0 }));
      component.onRetrieve();
      const args = mockSearchService.searchDonors.calls.mostRecent().args[0];
      expect(args.donorId).toBe('DN001');
    });

    it('should send unitId when parsedDonationId is set and unitIdField has value', () => {
      (component as any).parsedDonationId = 'U12345';
      (component as any).unitIdField = { unitIdControl: { value: 'U12345' }, isValid: true, clear: () => {} };
      component.searchForm.patchValue({ lastName: 'SMITH' });
      mockSearchService.searchDonors.and.returnValue(of({ data: [], total: 0 }));
      component.onRetrieve();
      const args = mockSearchService.searchDonors.calls.mostRecent().args[0];
      expect(args.unitId).toBe('U12345');
    });

    it('should send deferralId when validatedDeferralId is set', () => {
      (component as any).validatedDeferralId = 'D12345';
      component.searchForm.patchValue({ lastName: 'SMITH' });
      mockSearchService.searchDonors.and.returnValue(of({ data: [], total: 0 }));
      component.onRetrieve();
      const args = mockSearchService.searchDonors.calls.mostRecent().args[0];
      expect(args.deferralId).toBe('D12345');
    });

    it('should handle generic error without errorResponse', () => {
      component.searchForm.patchValue({ lastName: 'SMITH' });
      mockSearchService.searchDonors.and.returnValue(throwError(() => new Error('Network error')));
      component.onRetrieve();
      expect(component.errorMessage).toBe('An error occurred while searching for donors');
      expect(component.errorCode).toBeNull();
    });
  });

  describe('onAlphaKeyPress', () => {
    it('should allow letters', () => {
      const event = { key: 'a', ctrlKey: false, altKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      component.onAlphaKeyPress(event);
      expect((event as any).preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent numbers', () => {
      const event = { key: '1', ctrlKey: false, altKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      component.onAlphaKeyPress(event);
      expect((event as any).preventDefault).toHaveBeenCalled();
    });

    it('should allow spaces', () => {
      const event = { key: ' ', ctrlKey: false, altKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      component.onAlphaKeyPress(event);
      expect((event as any).preventDefault).not.toHaveBeenCalled();
    });

    it('should allow apostrophes and hyphens', () => {
      const event1 = { key: "'", ctrlKey: false, altKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      component.onAlphaKeyPress(event1);
      expect((event1 as any).preventDefault).not.toHaveBeenCalled();

      const event2 = { key: '-', ctrlKey: false, altKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      component.onAlphaKeyPress(event2);
      expect((event2 as any).preventDefault).not.toHaveBeenCalled();
    });

    it('should allow ctrl/alt/meta key combinations', () => {
      const event = { key: 'v', ctrlKey: true, altKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      component.onAlphaKeyPress(event);
      expect((event as any).preventDefault).not.toHaveBeenCalled();
    });

    it('should allow multi-char keys', () => {
      const event = { key: 'Backspace', ctrlKey: false, altKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      component.onAlphaKeyPress(event);
      expect((event as any).preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('onNumericKeyPress', () => {
    it('should allow digit keys', () => {
      const event = { key: '0', ctrlKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect((event as any).preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent letter keys', () => {
      const event = { key: 'a', ctrlKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect((event as any).preventDefault).toHaveBeenCalled();
    });

    it('should allow navigation keys (backspace, tab, delete, escape, enter)', () => {
      ['Backspace', 'Tab', 'Delete', 'Escape', 'Enter'].forEach(key => {
        const event = { key, ctrlKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
        component.onNumericKeyPress(event);
        expect((event as any).preventDefault).not.toHaveBeenCalled();
      });
    });

    it('should allow ctrl+A/C/V/X', () => {
      ['a', 'c', 'v', 'x'].forEach(key => {
        const event = { key, ctrlKey: true, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
        component.onNumericKeyPress(event);
        expect((event as any).preventDefault).not.toHaveBeenCalled();
      });
    });
  });

  describe('stripNonNumeric', () => {
    it('should strip non-numeric characters', () => {
      component.searchForm.patchValue({ phoneNumber: '214-234-5678' });
      component.stripNonNumeric('phoneNumber');
      expect(component.searchForm.get('phoneNumber')?.value).toBe('2142345678');
    });

    it('should not modify already-numeric value', () => {
      component.searchForm.patchValue({ phoneNumber: '12345' });
      component.stripNonNumeric('phoneNumber');
      expect(component.searchForm.get('phoneNumber')?.value).toBe('12345');
    });
  });

  describe('formatDobForApi (private)', () => {
    it('should return empty string for null', () => {
      expect((component as any).formatDobForApi(null)).toBe('');
    });

    it('should return string as-is', () => {
      expect((component as any).formatDobForApi('01/15/1990')).toBe('01/15/1990');
    });

    it('should convert Moment object to MM/DD/YYYY', () => {
      expect((component as any).formatDobForApi(moment('1990-01-15'))).toBe('01/15/1990');
    });

    it('should convert Date object to MM/DD/YYYY', () => {
      expect((component as any).formatDobForApi(new Date(1990, 0, 15))).toBe('01/15/1990');
    });
  });

  describe('isDobMismatch - invalid format', () => {
    it('should return false when dob format is not MM/DD/YYYY', () => {
      (component as any).searchedCriteria = { dob: '1990-01-15' };
      expect(component.isDobMismatch(makeDonor())).toBe(false);
    });
  });

  describe('isRowSelected - edge cases', () => {
    it('should return false when no donor selected', () => {
      component.selectedDonor = null;
      expect(component.isRowSelected(makeDonor())).toBe(false);
    });
  });

  describe('onClear - edge cases', () => {
    it('should clear error state and IDs', () => {
      component.errorMessage = 'Some error';
      component.errorCode = '11090';
      (component as any).parsedDonationId = 'U123';
      (component as any).validatedDeferralId = 'D123';
      (component as any).searchedCriteria = { lastName: 'SMITH' };

      component.onClear();

      expect(component.errorMessage).toBeNull();
      expect(component.errorCode).toBeNull();
      expect((component as any).parsedDonationId).toBeNull();
      expect((component as any).validatedDeferralId).toBeNull();
      expect((component as any).searchedCriteria).toEqual({});
    });
  });



});

// ─── Prefilled dialog ──────────────────────────────────────────────────────────



});
