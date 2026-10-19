import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Overlay } from '@angular/cdk/overlay';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { HoldDetailsPanel } from './hold-details-panel';
import { AuditHoldRecord, HoldDetailRecord, HoldDetailsFilterValue } from '../models/release-audit-holds.model';
import { ReleaseAuditHoldsService } from '../services/release-audit-holds.service';
import { HeaderService } from '@shared/services/header.service';
import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';

describe('HoldDetailsPanel', () => {
  let serviceSpy: any;
  let component: HoldDetailsPanel;
  let fixture: ComponentFixture<HoldDetailsPanel>;
  let service: jasmine.SpyObj<ReleaseAuditHoldsService>;
  let mockHeaderService: { chapterChanged$: Subject<void> };

  const today = moment();

  const mockRecord: AuditHoldRecord = {
    unitId: 'W633225031610-P',
    collectionDate: today.format('DD-MMM-YYYY').toUpperCase(),
    name: 'Poole, Deborah',
    dateOfBirth: '18-FEB-1988',
    sex: 'M',
    donorId: 'DN00008855',
    donationType: 'AL',
    donationProcedure: 'PP',
    hold: 'BHOLD',
    origin: 'BPSY',
    reason: '10',
    removed: null,
    transactionId: 'TXN001',
    interDescription: 'Blood hold description',
    groupId: 'GRP01',
    groupMode: 'A',
    sourceCode: 'SRC01',
    holdSource: 'UNIT',
    effectiveDate: today.format('DD-MMM-YYYY').toUpperCase(),
    insertDate: today.format('DD-MMM-YYYY').toUpperCase(),
    termDate: null,
    releaseUser: null
  };

  const mockUnitHolds: HoldDetailRecord[] = [
    {
      type: 'BHOLD',
      code: 'AH',
      description: 'Audit Hold',
      unitId: null,
      entryDate: today.format('YYYY-MM-DD'),
      terminationDate: null,
      insUser: 'admin',
      relDate: null,
      relUser: null
    }
  ];

  const mockDonorHolds: HoldDetailRecord[] = [
    {
      type: 'DHOLD',
      code: 'DH',
      description: 'Donor Hold',
      unitId: null,
      entryDate: today.format('YYYY-MM-DD'),
      terminationDate: today.format('YYYY-MM-DD'),
      insUser: 'admin',
      relDate: today.format('YYYY-MM-DD'),
      relUser: 'admin'
    }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('ReleaseAuditHoldsService', [
      'buildHoldDetails',
      'getUnitHolds',
      'getDonorHolds'
    ]);
    serviceSpy.getUnitHolds.and.returnValue(of(mockUnitHolds));
    serviceSpy.getDonorHolds.and.returnValue(of(mockDonorHolds));

    mockHeaderService = {
      chapterChanged$: new Subject<void>()
    };



      TestBed.configureTestingModule({
      imports: [
        HoldDetailsPanel,
        NoopAnimationsModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        SidePanelBase
      ],
      providers: [
        { provide: ReleaseAuditHoldsService, useValue: serviceSpy },
        { provide: HeaderService, useValue: mockHeaderService },
        Overlay
      ]
    });


    


      serviceSpy.buildHoldDetails.calls.reset();


      serviceSpy.getUnitHolds.calls.reset();


      serviceSpy.getDonorHolds.calls.reset();


      serviceSpy.getUnitHolds.and.returnValue(of(mockUnitHolds));


      serviceSpy.getDonorHolds.and.returnValue(of(mockDonorHolds));


    service = TestBed.inject(ReleaseAuditHoldsService) as jasmine.SpyObj<ReleaseAuditHoldsService>;
    fixture = TestBed.createComponent(HoldDetailsPanel);
    component = fixture.componentInstance;
    component.record = mockRecord;
    fixture.detectChanges();


    });


  /* -------------------------------- INITIALIZATION -------------------------------- */

  describe('Initialization', () => {
    it('should initialize footer buttons', () => {
      expect(component.footerButtons.length).toBe(1);
      expect(component.footerButtons[0].label).toBe('CLOSE');
      expect(component.footerButtons[0].action).toBe('close');
    });

    it('should display unit table columns correctly', () => {
      expect(component.unitDisplayedColumns).toEqual([
        'type', 'code', 'description', 'entryDate',
        'terminationDate', 'insUser', 'relDate', 'relUser'
      ]);
    });

    it('should display donor table columns', () => {
      expect(component.donorDisplayedColumns).toEqual([
        'type', 'code', 'description', 'entryDate',
        'terminationDate', 'insUser', 'relDate', 'relUser'
      ]);
    });

    it('should initialize hold details on init', () => {
      expect(component.holdDetails).toBeDefined();
      expect(component.holdDetails?.unitHolds.unitId).toBe(mockRecord.unitId);
    });

    it('should load unit holds on init', () => {
      expect(service.getUnitHolds).toHaveBeenCalled();
      expect(component.filteredUnitHolds.length).toBe(1);
    });

    it('should load donor holds on init', () => {
      expect(service.getDonorHolds).toHaveBeenCalled();
      expect(component.filteredDonorHolds.length).toBe(1);
    });

    it('should initialize filtered data arrays', () => {
      expect(component.filteredUnitHolds).toBeDefined();
      expect(component.filteredDonorHolds).toBeDefined();
    });

    it('should initialize filter state', () => {
      expect(component.unitHoldsFilters).toBeNull();
      expect(component.donorHoldsFilters).toBeNull();
      expect(component.unitFilterChips).toEqual([]);
      expect(component.donorFilterChips).toEqual([]);
    });
  });

  /* -------------------------------- LOADING STATE -------------------------------- */
  /* -------------------------------- ERROR HANDLING -------------------------------- */

  describe('Error Handling', () => {
    it('should handle unit holds error', () => {
      service.getUnitHolds.and.returnValue(
        throwError(() => ({ error: { message: 'Unit holds error' } }))
      );

      component.ngOnInit();

      expect(component.hasUnitHoldsError).toBe(true);
      expect(component.unitHoldsErrorMessage).toBe('Unit holds error');
      expect(component.isLoadingUnitHolds).toBe(false);
    });

    it('should use fallback error message for unit holds', () => {
      service.getUnitHolds.and.returnValue(throwError(() => ({})));
      component.ngOnInit();

      expect(component.unitHoldsErrorMessage).toBe('Failed to load unit holds.');
    });

    it('should handle donor holds error', () => {
      service.getDonorHolds.and.returnValue(
        throwError(() => ({ error: { message: 'Donor holds error' } }))
      );

      component.ngOnInit();

      expect(component.hasDonorHoldsError).toBe(true);
      expect(component.donorHoldsErrorMessage).toBe('Donor holds error');
      expect(component.isLoadingDonorHolds).toBe(false);
    });

    it('should use fallback error message for donor holds', () => {
      service.getDonorHolds.and.returnValue(throwError(() => ({})));
      component.ngOnInit();

      expect(component.donorHoldsErrorMessage).toBe('Failed to load donor holds.');
    });
  });

  /* -------------------------------- PANEL ACTIONS -------------------------------- */
  /* -------------------------------- FILTERS -------------------------------- */

  describe('Filters', () => {
    it('should clear unit holds filters and reload', () => {
      component.unitHoldsFilters = { holds: 'active' };
      component.unitFilterChips = [{ key: 'holds', label: 'Active', value: 'active' }];

      service.getUnitHolds.calls.reset();
      component.onClearUnitFilters();

      expect(component.unitHoldsFilters).toBeNull();
      expect(component.unitFilterChips).toEqual([]);
      expect(service.getUnitHolds).toHaveBeenCalled();
    });

    it('should clear donor holds filters and reload', () => {
      component.donorHoldsFilters = { holds: 'active' };
      component.donorFilterChips = [{ key: 'holds', label: 'Active', value: 'active' }];

      service.getDonorHolds.calls.reset();
      component.onClearDonorFilters();

      expect(component.donorHoldsFilters).toBeNull();
      expect(component.donorFilterChips).toEqual([]);
      expect(service.getDonorHolds).toHaveBeenCalled();
    });

    it('should remove unit filter by chip key', () => {
      component.unitHoldsFilters = { holds: 'active', entryDatePeriod: 'after', entryDate: today.toDate() };
      service.getUnitHolds.calls.reset();

      component.onRemoveUnitFilterChip('holds');

      expect(component.unitHoldsFilters?.holds).toBeUndefined();
      expect(service.getUnitHolds).toHaveBeenCalled();
    });



    it('should remove donor filter by chip key', () => {
      component.donorHoldsFilters = { holds: 'active', entryDatePeriod: 'after', entryDate: today.toDate() };
      service.getDonorHolds.calls.reset();

      component.onRemoveDonorFilterChip('holds');

      expect(component.donorHoldsFilters?.holds).toBeUndefined();
      expect(service.getDonorHolds).toHaveBeenCalled();
    });




  });

  /* -------------------------------- CHAPTER CHANGES -------------------------------- */
  /* -------------------------------- DESTROY -------------------------------- */

  describe('ngOnDestroy', () => {
    it('should clean up subscriptions', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });


  });
});
