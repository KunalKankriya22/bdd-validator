import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { AttachDonorPhlebotomyDetailsDialogComponent, PhlebotomyDetailsDialogInput } from './phlebotomy-details-dialog';
import { RegisteredDonationsQueryService } from '../../../registered-donations-query/services/registered-donations-query.service';
import { PhlebotomyDetailsDto } from '../../../registered-donations-query/models/registered-donations-query.model';
import { DonationEntryDetailsService } from '@shared/services/donation-entry-details.service';
import { DonationEntryDetailsWithDonor } from '@shared/models/donation-entry-details.model';

describe('AttachDonorPhlebotomyDetailsDialogComponent', () => {
  let component: AttachDonorPhlebotomyDetailsDialogComponent;
  let fixture: ComponentFixture<AttachDonorPhlebotomyDetailsDialogComponent>;
  let mockPhlebService: jasmine.SpyObj<RegisteredDonationsQueryService>;
  let mockEntryService: jasmine.SpyObj<DonationEntryDetailsService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AttachDonorPhlebotomyDetailsDialogComponent>>;

  const mockDialogData: PhlebotomyDetailsDialogInput = {
    transactionId: 'TXN001',
    unitId: 'W63332508I210',
    collDate: '2020-03-11',
  };

  const mockPhlebDetails: PhlebotomyDetailsDto = {
    armUsed: 'L',
    collDate: '2020-03-11T00:00:00',
    doubleStickId: null,
    driveId: 'DRV001',
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
  };

  const mockEntryDetails: DonationEntryDetailsWithDonor = {
    donationDetails: {
      donationType: 'AL',
      procedureCode: 'WB',
      screenerId: 'CJH',
      physicalId: 'CJH',
      lookupId: 'CJH',
      reactionCode: undefined,
      venipunctureId: undefined,
      deferralReason: undefined,
      deferralThru: undefined,
      rbcLoss: 5,
      plasmaLoss: 10,
    },
    donorInfo: {},
  };

  beforeEach(() => {

    mockPhlebService = jasmine.createSpyObj('RegisteredDonationsQueryService', [
      'getPhlebotomyDetails',
    ]);
    mockEntryService = jasmine.createSpyObj('DonationEntryDetailsService', [
      'getEntryDetails',
    ]);
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    mockPhlebService.getPhlebotomyDetails.and.returnValue(of(mockPhlebDetails));
    mockEntryService.getEntryDetails.and.returnValue(of(mockEntryDetails));



      TestBed.configureTestingModule({
      imports: [AttachDonorPhlebotomyDetailsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: RegisteredDonationsQueryService, useValue: mockPhlebService },
        { provide: DonationEntryDetailsService, useValue: mockEntryService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    });


    


      mockPhlebService.getPhlebotomyDetails.calls.reset();


      mockEntryService.getEntryDetails.calls.reset();


      mockDialogRef.close.calls.reset();


      mockPhlebService.getPhlebotomyDetails.and.returnValue(of(mockPhlebDetails));


      mockEntryService.getEntryDetails.and.returnValue(of(mockEntryDetails));


    fixture = TestBed.createComponent(AttachDonorPhlebotomyDetailsDialogComponent);
    component = fixture.componentInstance;


    });




  describe('Initialization', () => {
    it('should start in loading state', () => {
      expect(component.loading()).toBeTrue();
    });

    it('should have no error initially', () => {
      expect(component.error()).toBeNull();
    });

    it('should have no phlebDetails initially', () => {
      expect(component.phlebDetails()).toBeNull();
    });
  });

  describe('loadData (ngOnInit)', () => {
    it('should call both APIs with correct parameters', () => {
      fixture.detectChanges();
      expect(mockPhlebService.getPhlebotomyDetails).toHaveBeenCalledWith('TXN001');
      expect(mockEntryService.getEntryDetails).toHaveBeenCalledWith('W63332508I210', '2020-03-11');
    });

    it('should set phlebDetails and donationDetails on success', () => {
      fixture.detectChanges();
      expect(component.phlebDetails()).toEqual(mockPhlebDetails);
      expect(component.donationDetails()).toEqual(mockEntryDetails.donationDetails!);
      expect(component.loading()).toBeFalse();
      expect(component.error()).toBeNull();
    });

    it('should still load donation details when phlebotomy API fails', () => {
      mockPhlebService.getPhlebotomyDetails.and.returnValue(
        throwError(() => ({ message: 'Not found' }))
      );
      fixture.detectChanges();

      expect(component.phlebDetails()).toBeTruthy();
      expect(component.phlebDetails()!.armUsed).toBeNull();
      expect(component.donationDetails()).toEqual(mockEntryDetails.donationDetails!);
      expect(component.loading()).toBeFalse();
      expect(component.error()).toBeNull();
    });

    it('should still load phlebotomy details when entry details API fails', () => {
      mockEntryService.getEntryDetails.and.returnValue(
        throwError(() => ({ message: 'Not found' }))
      );
      fixture.detectChanges();

      expect(component.phlebDetails()).toEqual(mockPhlebDetails);
      expect(component.donationDetails()).toEqual({});
      expect(component.loading()).toBeFalse();
    });

    it('should show empty phlebDetails when both APIs fail', () => {
      mockPhlebService.getPhlebotomyDetails.and.returnValue(
        throwError(() => ({ message: 'Error 1' }))
      );
      mockEntryService.getEntryDetails.and.returnValue(
        throwError(() => ({ message: 'Error 2' }))
      );
      fixture.detectChanges();

      expect(component.phlebDetails()).toBeTruthy();
      expect(component.phlebDetails()!.l1BleedStart).toBeNull();
      expect(component.donationDetails()).toEqual({});
      expect(component.loading()).toBeFalse();
    });


  });

  describe('formatTime', () => {
    it('should format a valid date string to HH:mm', () => {
      expect(component.formatTime('2020-03-11T14:00:00')).toBe('14:00');
    });






  });

  describe('formatDate', () => {
    it('should format a valid date to DD-MON-YYYY', () => {
      expect(component.formatDate('2020-03-11T00:00:00')).toBe('11-MAR-2020');
    });




  });

  describe('formatValue', () => {
    it('should return the value as string', () => {
      expect(component.formatValue('ET1234')).toBe('ET1234');
    });



    it('should return "--" for empty string', () => {
      expect(component.formatValue('')).toBe('--');
    });



    it('should convert number to string', () => {
      expect(component.formatValue(42)).toBe('42');
    });
  });
  describe('onRetry', () => {
    it('should reload data on retry', () => {
      fixture.detectChanges();
      mockPhlebService.getPhlebotomyDetails.calls.reset();
      mockEntryService.getEntryDetails.calls.reset();
      mockPhlebService.getPhlebotomyDetails.and.returnValue(of(mockPhlebDetails));
      mockEntryService.getEntryDetails.and.returnValue(of(mockEntryDetails));

      component.onRetry();

      expect(mockPhlebService.getPhlebotomyDetails).toHaveBeenCalledWith('TXN001');
      expect(mockEntryService.getEntryDetails).toHaveBeenCalledWith('W63332508I210', '2020-03-11');
    });
  });
  describe('Template rendering', () => {








    it('should show arm sections when details are loaded', () => {
      fixture.detectChanges();
      const armLabels = fixture.nativeElement.querySelectorAll('.arm-label');
      expect(armLabels.length).toBe(3);
      expect(armLabels[0].textContent.trim()).toBe('L');
      expect(armLabels[1].textContent.trim()).toBe('R');
      expect(armLabels[2].textContent.trim()).toBe('O');
    });

    it('should render bottom info grid with donation details', () => {
      fixture.detectChanges();
      const infoValues = fixture.nativeElement.querySelectorAll('.info-value');
      const values = Array.from(infoValues).map((el: any) => el.textContent.trim());
      expect(values).toContain('AL');
      expect(values).toContain('WB');
      expect(values).toContain('CJH');
    });

    it('should render drive ID from phlebDetails', () => {
      fixture.detectChanges();
      const infoValues = fixture.nativeElement.querySelectorAll('.info-value');
      const values = Array.from(infoValues).map((el: any) => el.textContent.trim());
      expect(values).toContain('DRV001');
    });

    it('should show START and END column headers', () => {
      fixture.detectChanges();
      const headers = fixture.nativeElement.querySelectorAll('.col-header');
      expect(headers.length).toBe(2);
      expect(headers[0].textContent).toContain('S T A R T');
      expect(headers[1].textContent).toContain('E N D');
    });
  });
});
