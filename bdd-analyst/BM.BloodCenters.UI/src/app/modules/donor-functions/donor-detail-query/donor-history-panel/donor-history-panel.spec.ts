import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { DonorHistoryPanelComponent } from './donor-history-panel';
import { DonorHistoryPanelData, DonorHistoryRecord } from './donor-history-panel.model';
import { DonationDetailsApiService } from '../../donor-profile/donation-details/services/donation-details-api.service';
import { DonorDetailQueryService } from '../services/donor-detail-query.service';

describe('DonorHistoryPanelComponent', () => {
  let component: DonorHistoryPanelComponent;
  let fixture: ComponentFixture<DonorHistoryPanelComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<DonorHistoryPanelComponent>>;
  let mockDonationService: jasmine.SpyObj<DonationDetailsApiService>;
  let mockDonorDetailService: jasmine.SpyObj<DonorDetailQueryService>;

  const mockDialogData: DonorHistoryPanelData = { donorId: 'D001' };

  const mockDonorHeaderResponse = {
    success: true,
    data: [{
      name: 'DOE, JOHN',
      dateOfBirth: '1990-01-01',
      sex: 'M',
      abo: 'O+',
    }],
  };

  const mockDonationsResponse = {
    success: true,
    data: [
      { donationType: 'AL', procedureCode: 'WB', unitId: 'U001', collDate: '2025-01-15' },
      { donationType: 'PL', procedureCode: 'PP', unitId: 'U002', collDate: '2025-02-20' },
    ],
  };

  const mockDonorDetailResponse = {
    donor: {
      statistics: { lifeDonations: 42 },
      address: { line1: '123 MAIN ST' },
    },
    eligibility: [
      { proc: 'WB', status: 'Yes', eligibilityDate: '2025-06-01', reason: '' },
      { proc: 'PP', status: 'NO', eligibilityDate: '2025-07-01', reason: 'Deferred' },
    ],
    attributes: [],
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockDonationService = jasmine.createSpyObj('DonationDetailsApiService', [
      'getDonorHeader',
      'getDonationDetails',
    ]);
    mockDonorDetailService = jasmine.createSpyObj('DonorDetailQueryService', [
      'getDonorDetail',
      'formatDate',
    ]);

    // Default successful mock responses
    mockDonationService.getDonorHeader.and.returnValue(of(mockDonorHeaderResponse as any));
    mockDonationService.getDonationDetails.and.returnValue(of(mockDonationsResponse as any));
    mockDonorDetailService.getDonorDetail.and.returnValue(of(mockDonorDetailResponse as any));
    mockDonorDetailService.formatDate.and.callFake((d: string) => d);

    await TestBed.configureTestingModule({
      imports: [DonorHistoryPanelComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: DonationDetailsApiService, useValue: mockDonationService },
        { provide: DonorDetailQueryService, useValue: mockDonorDetailService },
      ],
    })
    .overrideComponent(DonorHistoryPanelComponent, {
      set: { template: '' },
    })
    .compileComponents();

    fixture = TestBed.createComponent(DonorHistoryPanelComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loadData - success', () => {
    beforeEach(() => {
      fixture.detectChanges(); // triggers ngOnInit -> loadData
    });

    it('should set donor header info from response', () => {
      expect(component.donorName()).toBe('DOE, JOHN');
      expect(component.donorSex()).toBe('Male');
      expect(component.donorAbo()).toBe('O+');
    });

    it('should map donations to records and auto-select the first row', () => {
      const donations = component.donations();
      expect(donations.length).toBe(2);

      expect(donations[0].unitId).toBe('U001');
      expect(donations[0].cholLevel).toBe('-');
      expect(donations[0].bp).toBe('-');

      const selected = component.selectedRow();
      expect(selected).not.toBeNull();
      expect(selected!.unitId).toBe('U001');
    });

    it('should set eligibility from the first record with status Yes', () => {
      expect(component.eligibleFor()).toBe('WB');
    });

    it('should set lifetimeDonations from donor statistics', () => {
      expect(component.lifetimeDonations()).toBe(42);
    });

    it('should set printerId from donor address line1', () => {
      expect(component.printerId()).toBe('123 MAIN ST');
    });

    it('should set loading to false after successful load', () => {
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
    });
  });

  describe('loadData - eligibility fallback', () => {
    it('should fall back to first eligibility record when no Yes status found', () => {
      const noYesEligibility = {
        ...mockDonorDetailResponse,
        eligibility: [
          { proc: 'PP', status: 'NO', eligibilityDate: '2025-07-01', reason: 'Deferred' },
          { proc: 'AP', status: 'NO', eligibilityDate: '2025-08-01', reason: 'Deferred' },
        ],
      };
      mockDonorDetailService.getDonorDetail.and.returnValue(of(noYesEligibility as any));

      fixture.detectChanges();

      expect(component.eligibleFor()).toBe('PP');
    });
  });

  describe('loadData - error handling', () => {
    it('should set error message when forkJoin fails', () => {
      mockDonationService.getDonorHeader.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      fixture.detectChanges();

      expect(component.error()).toBe('Failed to load donor history. Please try again.');
      expect(component.loading()).toBe(false);
    });
  });

  describe('onClose', () => {
    it('should close the dialog', () => {
      component.onClose();

      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('onButtonClick', () => {
    it('should close dialog when action is close', () => {
      component.onButtonClick('close');

      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
    });

    it('should call window.print when action is printCard', () => {
      const printSpy = spyOn(window, 'print');

      component.onButtonClick('printCard');

      expect(printSpy).toHaveBeenCalledTimes(1);
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should do nothing for unknown actions', () => {
      mockDialogRef.close.calls.reset();

      component.onButtonClick('unknown');

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('onRowClick', () => {
    it('should set the selected row', () => {
      const row: DonorHistoryRecord = {
        collDate: '2025-01-15',
        unitId: 'U001',
        cholLevel: '180',
        bp: '120/80',
      };

      component.onRowClick(row);

      expect(component.selectedRow()).toBe(row);
    });
  });

  describe('isSelectedRow', () => {
    it('should return true when row matches selected by unitId and collDate', () => {
      const row: DonorHistoryRecord = {
        collDate: '2025-01-15',
        unitId: 'U001',
        cholLevel: '180',
        bp: '120/80',
      };
      component.selectedRow.set(row);

      const matchingRow: DonorHistoryRecord = {
        collDate: '2025-01-15',
        unitId: 'U001',
        cholLevel: '999',
        bp: '999/999',
      };

      expect(component.isSelectedRow(matchingRow)).toBe(true);
    });

    it('should return false when no row is selected', () => {
      component.selectedRow.set(null);

      const row: DonorHistoryRecord = {
        collDate: '2025-01-15',
        unitId: 'U001',
        cholLevel: '180',
        bp: '120/80',
      };

      expect(component.isSelectedRow(row)).toBe(false);
    });

    it('should return false when unitId does not match', () => {
      component.selectedRow.set({
        collDate: '2025-01-15',
        unitId: 'U001',
        cholLevel: '180',
        bp: '120/80',
      });

      expect(component.isSelectedRow({
        collDate: '2025-01-15',
        unitId: 'U999',
        cholLevel: '180',
        bp: '120/80',
      })).toBe(false);
    });

    it('should return false when collDate does not match', () => {
      component.selectedRow.set({
        collDate: '2025-01-15',
        unitId: 'U001',
        cholLevel: '180',
        bp: '120/80',
      });

      expect(component.isSelectedRow({
        collDate: '2099-12-31',
        unitId: 'U001',
        cholLevel: '180',
        bp: '120/80',
      })).toBe(false);
    });
  });

  describe('onPrinterIdChange', () => {
    it('should update the printerId signal', () => {
      component.onPrinterIdChange('PRINTER-42');

      expect(component.printerId()).toBe('PRINTER-42');
    });

    it('should accept an empty string', () => {
      component.printerId.set('OLD');

      component.onPrinterIdChange('');

      expect(component.printerId()).toBe('');
    });
  });

  describe('mapSex (via loadData)', () => {
    it('should map M to Male', () => {
      fixture.detectChanges();
      expect(component.donorSex()).toBe('Male');
    });

    it('should map F to Female', () => {
      mockDonationService.getDonorHeader.and.returnValue(of({
        success: true,
        data: [{ name: 'DOE, JANE', dateOfBirth: '1990-01-01', sex: 'F', abo: 'A-' }],
      } as any));

      fixture.detectChanges();
      expect(component.donorSex()).toBe('Female');
    });

    it('should map U to Unknown', () => {
      mockDonationService.getDonorHeader.and.returnValue(of({
        success: true,
        data: [{ name: 'DOE, X', dateOfBirth: '1990-01-01', sex: 'U', abo: 'AB+' }],
      } as any));

      fixture.detectChanges();
      expect(component.donorSex()).toBe('Unknown');
    });

    it('should return original code for unrecognized values', () => {
      mockDonationService.getDonorHeader.and.returnValue(of({
        success: true,
        data: [{ name: 'DOE, Z', dateOfBirth: '1990-01-01', sex: 'X', abo: 'B+' }],
      } as any));

      fixture.detectChanges();
      expect(component.donorSex()).toBe('X');
    });
  });
});
