import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { PhlebotomyDetailsDialogComponent } from './phlebotomy-details-dialog';
import { RegisteredDonationsQueryService } from '../services/registered-donations-query.service';
import { PhlebotomyDetailsDto } from '../models/registered-donations-query.model';

describe('PhlebotomyDetailsDialogComponent', () => {
  let component: PhlebotomyDetailsDialogComponent;
  let fixture: ComponentFixture<PhlebotomyDetailsDialogComponent>;
  let mockService: jasmine.SpyObj<RegisteredDonationsQueryService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<PhlebotomyDetailsDialogComponent>>;

  const mockDialogData = { transactionId: 'TXN001' };

  const mockDetails: PhlebotomyDetailsDto = {
    armUsed: 'L',
    collDate: '2020-03-11T00:00:00',
    l1BleedStart: '2020-03-11T14:00:00',
    l1BleedEnd: '2020-03-11T14:10:00',
    l2BleedStart: null,
    l2BleedEnd: null,
    r1BleedStart: null,
    r1BleedEnd: null,
    r2BleedStart: null,
    r2BleedEnd: null,
    phleb1Id: 'ET1234',
    phleb2Id: null,
    phleb3Id: null,
    phleb4Id: null,
    phlebEnd1Id: 'ET1234',
    phlebEnd2Id: null,
    phlebEnd3Id: null,
    phlebEnd4Id: null,
    otherStartTime: null,
    otherEndTime: null,
    otherStartPhleb: null,
    otherEndPhleb: null,
    driveStartTime: '2020-03-11T07:30:00',
    rbcLoss: null,
    plasmaLoss: null,
    doubleStickId: null,
    driveId: null,
  };

  beforeEach(() => {
    mockService = jasmine.createSpyObj('RegisteredDonationsQueryService', [
      'getPhlebotomyDetails',
    ]);
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockService.getPhlebotomyDetails.and.returnValue(of(mockDetails));

    TestBed.configureTestingModule({
      imports: [PhlebotomyDetailsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: RegisteredDonationsQueryService, useValue: mockService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    });

    mockService.getPhlebotomyDetails.calls.reset();
    mockDialogRef.close.calls.reset();
    mockService.getPhlebotomyDetails.and.returnValue(of(mockDetails));

    fixture = TestBed.createComponent(PhlebotomyDetailsDialogComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should start in loading state', () => {
      expect(component.loading()).toBeTrue();
    });

    it('should have no error initially', () => {
      expect(component.error()).toBeNull();
    });

    it('should have no details initially', () => {
      expect(component.details()).toBeNull();
    });
  });

  describe('loadData (ngOnInit)', () => {
    it('should call getPhlebotomyDetails with correct transactionId', () => {
      fixture.detectChanges();
      expect(mockService.getPhlebotomyDetails).toHaveBeenCalledWith('TXN001');
    });

    it('should set details and stop loading on success', () => {
      fixture.detectChanges();
      expect(component.details()).toEqual(mockDetails);
      expect(component.loading()).toBeFalse();
      expect(component.error()).toBeNull();
    });

    it('should set error and stop loading on API failure', () => {
      mockService.getPhlebotomyDetails.and.returnValue(
        throwError(() => ({ message: 'Server error' }))
      );
      fixture.detectChanges();
      expect(component.error()).toBe('Server error');
      expect(component.loading()).toBeFalse();
      expect(component.details()).toBeNull();
    });

    it('should use fallback message when error has no message', () => {
      mockService.getPhlebotomyDetails.and.returnValue(
        throwError(() => ({}))
      );
      fixture.detectChanges();
      expect(component.error()).toBe('Failed to load phlebotomy details');
    });
  });

  describe('formatTime', () => {
    it('should format a valid date string to HH:mm', () => {
      const result = component.formatTime('2020-03-11T14:00:00');
      expect(result).toBe('14:00');
    });

    it('should return "--" when formatTime receives null', () => {
      const result = component.formatTime(null);
      expect(result).toBe('--');
    });
  });

  describe('formatDate', () => {
    it('should format a valid date to DD-MON-YYYY', () => {
      const result = component.formatDate('2020-03-11T00:00:00');
      expect(result).toBe('11-MAR-2020');
    });

    it('should return "--" when formatDate receives null', () => {
      const result = component.formatDate(null);
      expect(result).toBe('--');
    });
  });

  describe('formatValue', () => {
    it('should return the value as string', () => {
      expect(component.formatValue('ET1234')).toBe('ET1234');
    });

    it('should return "--" when formatValue receives null', () => {
      expect(component.formatValue(null)).toBe('--');
    });

    it('should return "--" for empty string', () => {
      expect(component.formatValue('')).toBe('--');
    });
  });

  describe('onRetry', () => {
    it('should reload data on retry', () => {
      fixture.detectChanges();
      mockService.getPhlebotomyDetails.calls.reset();
      mockService.getPhlebotomyDetails.and.returnValue(of(mockDetails));

      component.onRetry();

      expect(mockService.getPhlebotomyDetails).toHaveBeenCalledWith('TXN001');
    });
  });

  describe('onClose', () => {
    it('should close dialog when onClose is called', () => {
      component.onClose();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('Template rendering', () => {
    it('should show collection date when details are loaded', () => {
      fixture.detectChanges();
      const dateEl = fixture.nativeElement.querySelector('.collection-date');
      expect(dateEl?.textContent).toContain('11-MAR-2020');
    });

    it('should show error message on failure', () => {
      mockService.getPhlebotomyDetails.and.returnValue(
        throwError(() => ({ message: 'Network error' }))
      );
      fixture.detectChanges();
      const errorEl = fixture.nativeElement.querySelector('.error-message');
      expect(errorEl?.textContent).toContain('Network error');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy subject on ngOnDestroy', () => {
      const destroyNext = spyOn((component as any).destroy$, 'next');
      const destroyComplete = spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroyNext).toHaveBeenCalled();
      expect(destroyComplete).toHaveBeenCalled();
    });
  });
});
