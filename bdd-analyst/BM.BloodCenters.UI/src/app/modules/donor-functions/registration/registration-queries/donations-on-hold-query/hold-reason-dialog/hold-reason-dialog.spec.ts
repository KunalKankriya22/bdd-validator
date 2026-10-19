import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { HoldReasonDialogComponent } from './hold-reason-dialog';
import { DonationsOnHoldQueryService } from '../services/donations-on-hold-query.service';
import {
  DonationHoldDetail,
  DonorHoldDetail,
  HoldReasonDialogData,
} from '../models/donations-on-hold-query.model';

describe('HoldReasonDialogComponent', () => {
  let component: HoldReasonDialogComponent;
  let fixture: ComponentFixture<HoldReasonDialogComponent>;
  let mockService: jasmine.SpyObj<DonationsOnHoldQueryService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<HoldReasonDialogComponent>>;

  const mockDialogData: HoldReasonDialogData = {
    unitId: 'W633317102804-L',
    collDate: '2025-01-11',
    donorId: 'DN30120470',
    donorName: 'Smith, John',
    transactionId: 'TXN001',
  };

  const mockDonationHolds: DonationHoldDetail[] = [
    {
      interType: 'HOLDS',
      holdCode: 'H001',
      description: 'Test hold reason',
      effectiveDate: '2025-01-01',
      terminationDate: '',
      comments: 'Some comments',
      status: 'Active',
      createdBy: 'ADMIN',
      createdDate: '2025-01-01T09:00:00',
    },
  ];

  const mockDonorHolds: DonorHoldDetail[] = [
    {
      interType: 'HOLDS',
      holdCode: 'DH001',
      description: 'Donor hold reason',
      effectiveDate: '2025-01-01',
      terminationDate: '2025-12-31',
      status: 'Active',
      interdictionCode: 'IC001',
      donorId: 'DN30120470',
      createdBy: 'ADMIN',
      createdDate: '2025-01-01T10:00:00',
    },
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DonationsOnHoldQueryService', [
      'getDonationHolds',
      'getDonorHolds',
    ]);
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    mockService.getDonationHolds.and.returnValue(of(mockDonationHolds));
    mockService.getDonorHolds.and.returnValue(of(mockDonorHolds));



      TestBed.configureTestingModule({
      imports: [HoldReasonDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: DonationsOnHoldQueryService, useValue: mockService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    });


    


      mockService.getDonationHolds.calls.reset();


      mockService.getDonorHolds.calls.reset();


      mockDialogRef.close.calls.reset();


      mockService.getDonationHolds.and.returnValue(of(mockDonationHolds));


      mockService.getDonorHolds.and.returnValue(of(mockDonorHolds));


    fixture = TestBed.createComponent(HoldReasonDialogComponent);
    component = fixture.componentInstance;


    });


  describe('Initialization', () => {
    it('should load donation holds on init', () => {
      component.ngOnInit();
      expect(mockService.getDonationHolds).toHaveBeenCalledWith('TXN001', true);
      expect(component.donationHolds).toEqual(mockDonationHolds);
    });

    it('should load donor holds when donorId is present', () => {
      component.ngOnInit();
      expect(mockService.getDonorHolds).toHaveBeenCalledWith('TXN001', 'DN30120470', true);
      expect(component.donorHolds).toEqual(mockDonorHolds);
    });




  });

  describe('Filter Changes', () => {
    it('should reload donation holds when filter changes to All', () => {
      component.onDonationHoldFilterChange('L');
      expect(component.donationHoldFilter).toBe('L');
      expect(mockService.getDonationHolds).toHaveBeenCalledWith('TXN001', false);
    });

    it('should reload donor holds when filter changes to All', () => {
      component.onDonorHoldFilterChange('L');
      expect(component.donorHoldFilter).toBe('L');
      expect(mockService.getDonorHolds).toHaveBeenCalledWith('TXN001', 'DN30120470', false);
    });
  });
  describe('Date Formatting', () => {


    it('should format datetime correctly', () => {
      const result = component.formatDateTime('2025-01-11T09:05:00');
      expect(result).toContain('11-JAN-2025');
    });



    it('should format collection date from dialog data', () => {
      expect(component.formatCollDate()).toBe('11-JAN-2025');
    });
  });
});
