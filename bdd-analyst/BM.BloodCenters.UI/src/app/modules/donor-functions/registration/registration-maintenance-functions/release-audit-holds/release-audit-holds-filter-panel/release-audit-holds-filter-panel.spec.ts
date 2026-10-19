import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { ReleaseAuditHoldsFilterPanel } from './release-audit-holds-filter-panel';
import { ReleaseAuditHoldsService } from '../services/release-audit-holds.service';
import { HeaderService } from '@shared/services/header.service';
import { AuditHoldFilterValue, DropdownOption } from '../models/release-audit-holds.model';

describe('ReleaseAuditHoldsFilterPanel', () => {
  let component: ReleaseAuditHoldsFilterPanel;
  let fixture: ComponentFixture<ReleaseAuditHoldsFilterPanel>;
  let mockService: jasmine.SpyObj<ReleaseAuditHoldsService>;
  let mockHeaderService: { chapterChanged$: Subject<void> };

  const today = moment();

  const mockDonationTypes: DropdownOption[] = [
    { value: 'AL', label: 'Allogeneic' },
    { value: 'AU', label: 'Autologous' }
  ];

  const mockDonationProcedures: DropdownOption[] = [
    { value: 'PP', label: 'Plateletpheresis' },
    { value: 'WB', label: 'Whole Blood' }
  ];

  const mockAuditHoldTypes: DropdownOption[] = [
    { value: 'BHOLD', label: 'Blood Hold' },
    { value: 'AHOLD', label: 'Audit Hold' }
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('ReleaseAuditHoldsService', [
      'getDonationTypes',
      'getDonationProcedures',
      'getAuditHoldTypes'
    ]);
    mockService.getDonationTypes.and.returnValue(of(mockDonationTypes));
    mockService.getDonationProcedures.and.returnValue(of(mockDonationProcedures));
    mockService.getAuditHoldTypes.and.returnValue(of(mockAuditHoldTypes));

    mockHeaderService = {
      chapterChanged$: new Subject<void>()
    };



      TestBed.configureTestingModule({
imports: [
        ReleaseAuditHoldsFilterPanel,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        MatDatepickerModule,
        MatNativeDateModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ReleaseAuditHoldsService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });


    });



  beforeEach(() => {


      mockService.getDonationTypes.calls.reset();


      mockService.getDonationProcedures.calls.reset();


      mockService.getAuditHoldTypes.calls.reset();


      mockService.getDonationTypes.and.returnValue(of(mockDonationTypes));


      mockService.getDonationProcedures.and.returnValue(of(mockDonationProcedures));


      mockService.getAuditHoldTypes.and.returnValue(of(mockAuditHoldTypes));


    fixture = TestBed.createComponent(ReleaseAuditHoldsFilterPanel);
    component = fixture.componentInstance;
    component.donationTypeOptionsInput = mockDonationTypes;
    component.donationProcedureOptionsInput = mockDonationProcedures;
    component.auditHoldTypeOptionsInput = mockAuditHoldTypes;
    fixture.detectChanges();


    });

  /* -------------------------------- INITIALIZATION -------------------------------- */

  describe('Initialization', () => {
    it('should initialize form with default null values', () => {
      expect(component.filterForm).toBeDefined();
      expect(component.filterForm.get('donationType')?.value).toBeNull();
      expect(component.filterForm.get('donationProcedure')?.value).toBeNull();
      expect(component.filterForm.get('auditHoldType')?.value).toBeNull();
      expect(component.filterForm.get('collectionDate')?.value).toBeNull();
    });

    it('should load filter options from inputs on init', () => {
      expect(component.donationTypeOptions.length).toBe(2);
      expect(component.donationProcedureOptions.length).toBe(2);
      expect(component.auditHoldTypeOptions.length).toBe(2);
    });




    it('should initialize filtered options as copies of loaded options', () => {
      expect(component.filteredDonationTypeOptions.length).toBe(2);
      expect(component.filteredDonationProcedureOptions.length).toBe(2);
      expect(component.filteredAuditHoldTypeOptions.length).toBe(2);
    });


    it('should parse collection date from current filters', () => {
      const dateStr = today.format('DD-MMM-YYYY').toUpperCase();
      const panel = TestBed.createComponent(ReleaseAuditHoldsFilterPanel);
      const comp = panel.componentInstance;
      comp.currentFilters = { collectionDate: dateStr };
      panel.detectChanges();

      expect(comp.filterForm.get('collectionDate')?.value).toBeTruthy();
    });
  });

  /* -------------------------------- FILTER OPTIONS LOADING -------------------------------- */

  describe('Filter Options Loading', () => {

    it('should set empty donation procedures on error', () => {
      mockService.getDonationProcedures.and.returnValue(throwError(() => new Error('fail')));

      const panel = TestBed.createComponent(ReleaseAuditHoldsFilterPanel);
      panel.detectChanges();

      expect(panel.componentInstance.donationProcedureOptions).toEqual([]);
    });

    it('should set empty audit hold types on error', () => {
      mockService.getAuditHoldTypes.and.returnValue(throwError(() => new Error('fail')));

      const panel = TestBed.createComponent(ReleaseAuditHoldsFilterPanel);
      panel.detectChanges();

      expect(panel.componentInstance.auditHoldTypeOptions).toEqual([]);
    });

  });

  /* -------------------------------- SEARCH CONTROLS -------------------------------- */

  describe('Search Controls', () => {




    it('should show all options when search term is empty', () => {
      component.donationTypeSearchControl.setValue('');
      expect(component.filteredDonationTypeOptions.length).toBe(2);
    });

    it('should show no options when search has no match', () => {
      component.donationTypeSearchControl.setValue('ZZZZZ');
      expect(component.filteredDonationTypeOptions.length).toBe(0);
    });

    it('should be case insensitive in search', () => {
      component.donationTypeSearchControl.setValue('allogeneic');
      expect(component.filteredDonationTypeOptions.length).toBe(1);
    });
  });

  /* -------------------------------- ACTIONS -------------------------------- */
  /* -------------------------------- VALIDATION -------------------------------- */

  describe('Validation', () => {





    it('should treat empty string as no selection', () => {
      component.filterForm.patchValue({ donationType: '' });
      expect(component.isApplyDisabled).toBe(true);
    });
  });

  /* -------------------------------- DATE INPUT -------------------------------- */

  describe('Date Input', () => {
    it('should handle date input blur without error', () => {
      const control = component.filterForm.get('collectionDate');
      control?.setValue(today.clone());
      expect(() => component.onDateInputBlur()).not.toThrow();
    });

    it('should not throw when collection date input is triggered', () => {
      const mockEvent = { target: { value: '15-JAN-2025' } } as unknown as Event;
      expect(() => component.onCollectionDateInput(mockEvent)).not.toThrow();
    });
  });

  /* -------------------------------- CHAPTER CHANGES -------------------------------- */
  /* -------------------------------- DESTROY -------------------------------- */
});
