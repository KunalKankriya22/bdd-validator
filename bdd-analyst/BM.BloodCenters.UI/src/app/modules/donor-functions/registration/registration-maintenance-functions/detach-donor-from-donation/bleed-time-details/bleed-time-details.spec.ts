import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { BleedTimeDetailsComponent, BleedTimeDetailsDialogInput } from './bleed-time-details';
import { DetachDonorFromDonationService } from '../services/detach-donor-from-donation.service';
import { DonationEntryDetailsService } from '@shared/services/donation-entry-details.service';
import { BleedTimeDetailsDto, ReturnResult } from '../models/detach-donor-from-donation.model';

describe('BleedTimeDetailsComponent', () => {
  let component: BleedTimeDetailsComponent;
  let fixture: ComponentFixture<BleedTimeDetailsComponent>;
  let bleedServiceSpy: jasmine.SpyObj<DetachDonorFromDonationService>;
  let entryDetailsServiceSpy: jasmine.SpyObj<DonationEntryDetailsService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<BleedTimeDetailsComponent>>;

  const mockDialogData: BleedTimeDetailsDialogInput = {
    unitId: 'W633319030301',
    collDate: '2025-01-01'
  };

  const mockBleedDetails: BleedTimeDetailsDto = {
    armUsed: 'L',
    collDate: '2025-01-01T00:00:00',
    doubleStickId: null,
    l1BleedStart: '2025-01-01T08:00:00',
    l1BleedEnd: '2025-01-01T08:30:00',
    l2BleedStart: null, l2BleedEnd: null,
    r1BleedStart: null, r1BleedEnd: null,
    r2BleedStart: null, r2BleedEnd: null,
    phleb1Id: 'PH01', phleb2Id: null, phleb3Id: null, phleb4Id: null,
    phlebEnd1Id: null, phlebEnd2Id: null,
    otherPhleb1Id: null, otherPhleb2Id: null
  };

  const mockBleedResult: ReturnResult<BleedTimeDetailsDto> = {
    success: true, message: 'OK', error: '', errorCode: undefined,
    statusCode: 200, data: [], item: mockBleedDetails, total: 1
  };

  const mockEntryResult = {
    donationDetails: { screenerId: 'SCR01', physicalId: 'PHY01' }
  } as any;

  beforeEach(async () => {
    bleedServiceSpy = jasmine.createSpyObj('DetachDonorFromDonationService', [
      'getDonationsByUnitId', 'validateDonation', 'getBleedTimeDetails', 'detachDonor'
    ]);
    entryDetailsServiceSpy = jasmine.createSpyObj('DonationEntryDetailsService', ['getEntryDetails']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    bleedServiceSpy.getBleedTimeDetails.and.returnValue(of(mockBleedResult));
    entryDetailsServiceSpy.getEntryDetails.and.returnValue(of(mockEntryResult));

    await TestBed.configureTestingModule({
      imports: [BleedTimeDetailsComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: DetachDonorFromDonationService, useValue: bleedServiceSpy },
        { provide: DonationEntryDetailsService, useValue: entryDetailsServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BleedTimeDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ==================== Initialization ====================

  describe('Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should call getBleedTimeDetails on init', () => {
      expect(bleedServiceSpy.getBleedTimeDetails).toHaveBeenCalledWith('W633319030301');
    });

    it('should call getEntryDetails on init', () => {
      expect(entryDetailsServiceSpy.getEntryDetails).toHaveBeenCalledWith('W633319030301', '2025-01-01');
    });

    it('should set loading to false after data loads', fakeAsync(() => {
      tick();
      expect(component.loading).toBeFalse();
    }));

    it('should populate details from bleed service response', fakeAsync(() => {
      tick();
      expect(component.details).toEqual(mockBleedDetails);
    }));

    it('should populate donationDetails from entry service response', fakeAsync(() => {
      tick();
      expect(component.donationDetails).toEqual({ screenerId: 'SCR01', physicalId: 'PHY01' });
    }));
  });

  // ==================== loadData error path ====================

  describe('loadData error path', () => {
    it('should set loading to false on forkJoin error', fakeAsync(() => {
      bleedServiceSpy.getBleedTimeDetails.and.returnValue(throwError(() => new Error('Network error')));

      fixture = TestBed.createComponent(BleedTimeDetailsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(component.loading).toBeFalse();
    }));

    it('should handle null item in bleed response', fakeAsync(() => {
      bleedServiceSpy.getBleedTimeDetails.and.returnValue(of({ ...mockBleedResult, item: null as any }));

      fixture = TestBed.createComponent(BleedTimeDetailsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(component.details).toBeNull();
    }));

    it('should handle null donationDetails in entry response', fakeAsync(() => {
      entryDetailsServiceSpy.getEntryDetails.and.returnValue(of({ donationDetails: undefined } as any));

      fixture = TestBed.createComponent(BleedTimeDetailsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(component.donationDetails).toEqual({});
    }));
  });

  // ==================== ngOnDestroy ====================

  describe('ngOnDestroy', () => {
    it('should call next and complete on destroy$', () => {
      const nextSpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // ==================== onClose ====================

  describe('onClose', () => {
    it('should close the dialog', () => {
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });

  // ==================== formatValue ====================

  describe('formatValue', () => {
    it('should return "--" for null', () => {
      expect(component.formatValue(null)).toBe('--');
    });

    it('should return "--" for undefined', () => {
      expect(component.formatValue(undefined)).toBe('--');
    });

    it('should return "--" for empty string', () => {
      expect(component.formatValue('')).toBe('--');
    });

    it('should return "--" for whitespace-only string', () => {
      expect(component.formatValue('   ')).toBe('--');
    });

    it('should return the value as string when valid', () => {
      expect(component.formatValue('PH01')).toBe('PH01');
    });

    it('should return number as string', () => {
      expect(component.formatValue(42)).toBe('42');
    });
  });

  // ==================== formatTime ====================

  describe('formatTime', () => {
    it('should return "--" for null', () => {
      expect(component.formatTime(null)).toBe('--');
    });

    it('should return "--" for undefined', () => {
      expect(component.formatTime(undefined)).toBe('--');
    });

    it('should return "--" for empty string', () => {
      expect(component.formatTime('')).toBe('--');
    });

    it('should return raw string for invalid date', () => {
      expect(component.formatTime('not-a-date')).toBe('not-a-date');
    });

    it('should format a valid ISO string to HH:MM', () => {
      const result = component.formatTime('2025-01-15T08:30:00');
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  // ==================== formatDate ====================

  describe('formatDate', () => {
    it('should return "--" for null', () => {
      expect(component.formatDate(null)).toBe('--');
    });

    it('should return "--" for undefined', () => {
      expect(component.formatDate(undefined)).toBe('--');
    });

    it('should return "--" for empty string', () => {
      expect(component.formatDate('')).toBe('--');
    });

    it('should return raw string for invalid date', () => {
      expect(component.formatDate('not-a-date')).toBe('not-a-date');
    });

    it('should format a valid ISO date string to DD-MON-YYYY', () => {
      const result = component.formatDate('2025-01-15T00:00:00');
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should return correct month abbreviation', () => {
      const result = component.formatDate('2025-06-20T00:00:00');
      expect(result).toContain('JUN');
    });
  });
});
