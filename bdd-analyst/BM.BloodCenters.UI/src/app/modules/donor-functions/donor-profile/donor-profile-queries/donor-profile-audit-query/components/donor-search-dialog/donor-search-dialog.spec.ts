import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { DonorSearchDialog } from './donor-search-dialog';
import { DonorProfileAuditQueryService } from '../../services/donor-profile-audit-query.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import moment from 'moment';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('DonorSearchDialog', () => {
  let component: DonorSearchDialog;
  let fixture: ComponentFixture<DonorSearchDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<DonorSearchDialog>>;
  let mockService: jasmine.SpyObj<DonorProfileAuditQueryService>;
  let mockSnackbar: jasmine.SpyObj<SnackbarService>;
  let mockTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;

  const mockDonors = [
    {
      donorId: 'DN30120859',
      lastName: 'SMITH',
      firstName: 'JOHN',
      middleName: 'A',
      dateOfBirth: '1980-05-15',
      alternateId: 'ALT123',
      sex: 'Male',
      aboRh: 'O POS',
      address: '123 Main St',
      phoneNumber: '5551234567'
    },
    {
      donorId: 'DN30120860',
      lastName: 'SAINT',
      firstName: 'JANE',
      middleName: 'B',
      dateOfBirth: '1985-03-20',
      alternateId: 'ALT456',
      sex: 'Female',
      aboRh: 'A POS',
      address: '456 Oak Ave',
      phoneNumber: '5559876543'
    }
  ];

  beforeEach(() => {

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockService = jasmine.createSpyObj('DonorProfileAuditQueryService', ['searchDonors']);
    mockSnackbar = createMockSnackbarService();
    mockTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate']);

    mockTimezoneService.getChapterLocalDate.and.returnValue(moment());
    mockService.searchDonors.and.returnValue(of(mockDonors));



      TestBed.configureTestingModule({
imports: [DonorSearchDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: DonorProfileAuditQueryService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbar },
        { provide: ChapterTimezoneService, useValue: mockTimezoneService }
      ]
    });


    });



  beforeEach(() => {


      mockDialogRef.close.calls.reset();


      mockService.searchDonors.calls.reset();


      mockTimezoneService.getChapterLocalDate.calls.reset();


      mockTimezoneService.getChapterLocalDate.and.returnValue(moment());


      mockService.searchDonors.and.returnValue(of(mockDonors));


    fixture = TestBed.createComponent(DonorSearchDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Donor Search', () => {
    it('should search donors with valid criteria', () => {
      component.searchForm.patchValue({
        lastName: 'SMITH',
        firstName: 'JOHN'
      });

      component.onRetrieve();

      expect(mockService.searchDonors).toHaveBeenCalled();
      expect(component.matchingDonors().length).toBe(2);
    });


  });

  describe('Donor Selection', () => {
    beforeEach(() => {
      component.matchingDonors.set(mockDonors);
      fixture.detectChanges();
    });

    it('should select donor on row click', () => {
      component.onRowClick(mockDonors[0]);

      expect(component.selectedDonor()).toEqual(mockDonors[0]);
    });


  });

  describe('Form Validation', () => {
    it('should validate donor ID length', () => {
      component.searchForm.patchValue({ donorId: '123456789012345678901' });

      expect(component['validateForm']()).toBe('Donor ID cannot exceed 20 characters');
    });

    it('should validate unit ID length', () => {
      component.searchForm.patchValue({ unitId: '123456789012345678901' });

      expect(component['validateForm']()).toBe('Unit ID cannot exceed 15 characters');
    });

    it('should validate phone number', () => {
      component.searchForm.patchValue({ phoneNumber: '12345' });
      component.validatePhoneInput();

      expect(component.f['phoneNumber'].hasError('phoneMin')).toBe(true);
    });
  });

  describe('Clear and Cancel', () => {
    it('should clear form and results', () => {
      component.searchForm.patchValue({ lastName: 'SMITH' });
      component.matchingDonors.set(mockDonors);
      component.selectedDonor.set(mockDonors[0]);
      component.searchedFields.set(new Set(['lastName']));

      component.onClear();

      expect(component.f['lastName'].value).toBe('');
      expect(component.matchingDonors().length).toBe(0);
      expect(component.selectedDonor()).toBeNull();
      expect(component.searchedFields().size).toBe(0);
    });

  });

  describe('Exact Match Detection', () => {
    beforeEach(() => {
      component.matchingDonors.set(mockDonors);
      fixture.detectChanges();
    });




    it('should be case-insensitive for exact match', () => {
      component.searchForm.patchValue({ lastName: 'smith' });
      component.searchedFields.set(new Set(['lastName']));

      expect(component.isExactMatch(mockDonors[0])).toBe(true);
    });



  });

  describe('Field-Specific Highlighting', () => {
    beforeEach(() => {
      component.matchingDonors.set(mockDonors);
      fixture.detectChanges();
    });



    it('should highlight multiple fields when multiple criteria searched', () => {
      component.searchForm.patchValue({
        lastName: 'SMITH',
        firstName: 'JOHN'
      });
      component.searchedFields.set(new Set(['lastName', 'firstName']));

      expect(component.shouldHighlightField(mockDonors[1], 'lastName')).toBe(true);
      expect(component.shouldHighlightField(mockDonors[1], 'firstName')).toBe(true);
      expect(component.shouldHighlightField(mockDonors[1], 'donorId')).toBe(false);
    });

    it('should not highlight exact match even for searched fields', () => {
      component.searchForm.patchValue({ lastName: 'SMITH' });
      component.searchedFields.set(new Set(['lastName']));

      expect(component.shouldHighlightField(mockDonors[0], 'lastName')).toBe(false);
    });
  });

  describe('SearchedFields Tracking', () => {
    it('should track searched fields during executeSearch', () => {
      component.searchForm.patchValue({
        lastName: 'SMITH',
        firstName: 'JOHN'
      });

      component.onRetrieve();

      const searchedFields = component.searchedFields();
      expect(searchedFields.has('lastName')).toBe(true);
      expect(searchedFields.has('firstName')).toBe(true);
      expect(searchedFields.has('donorId')).toBe(false);
    });

  });
});
