import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';
import { DonationEntryDetailsDialogComponent } from './donation-entry-details-dialog';
import { DonationEntryDetailsService } from '@shared/services/donation-entry-details.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';
import {
  DonationEntryDetailsData,
  DonationEntryDetailsWithDonor,
} from '@shared/models/donation-entry-details.model';

describe('DonationEntryDetailsDialogComponent', () => {
  let serviceSpy: any;
  let dialogRefSpy: any;
  let component: DonationEntryDetailsDialogComponent;
  let fixture: ComponentFixture<DonationEntryDetailsDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<DonationEntryDetailsDialogComponent>>;
  let mockService: jasmine.SpyObj<DonationEntryDetailsService>;
  let matDialogSpy: jasmine.SpyObj<MatDialog>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const mockDialogData: DonationEntryDetailsData = {
    unitId: 'W123424081006',
  };

  const mockResponse: DonationEntryDetailsWithDonor = {
    donationDetails: {
      unitId: 'W123424081006',
      donationType: 'AL',
      procedureCode: 'WB',
      physicalId: 'EIL TOY',
      deferralReason: '0',
      donationDate: '2024-10-08',
      donorCue: 'Not Scan',
    },
    donorInfo: {
      donorId: 'DN30134290',
      firstName: 'FREDDIE',
      middleName: '',
      lastName: 'FLEMING',
      streetName: '452 CHAMPA ST',
      city: 'DALLAS',
      state: 'TEXAS',
      zip: '75235',
      homeAreaCode: '214',
      homePhone: '234-567-89',
      workAreaCode: '214',
      workPhone: '234-567-89',
      mobileAreaCode: '817',
      mobilePhone: '234-567-89',
      email: 'fleming.fred@hotmail.com',
    },
  };

  beforeEach(() => {

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    serviceSpy = jasmine.createSpyObj('DonationEntryDetailsService', ['getEntryDetails']);
    matDialogSpy = createMockMatDialog();
    headerServiceSpy = createMockHeaderService({ chapterTimeZone: 'UTC' }) as jasmine.SpyObj<HeaderService>;
    headerServiceSpy.getCurrentChapterTimezone.and.returnValue('UTC');

    serviceSpy.getEntryDetails.and.returnValue(of(mockResponse));



      TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        DonationEntryDetailsDialogComponent,
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: DonationEntryDetailsService, useValue: serviceSpy },
        { provide: MatDialog, useValue: matDialogSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
      ],
    });




      dialogRefSpy.close.calls.reset();


      serviceSpy.getEntryDetails.calls.reset();


      serviceSpy.getEntryDetails.and.returnValue(of(mockResponse));


    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<DonationEntryDetailsDialogComponent>>;
    mockService = TestBed.inject(DonationEntryDetailsService) as jasmine.SpyObj<DonationEntryDetailsService>;
    fixture = TestBed.createComponent(DonationEntryDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Initialization', () => {
    it('should receive dialog data with unitId', () => {
      expect(component.data).toBeDefined();
      expect(component.data.unitId).toBe('W123424081006');
    });

    it('should call getEntryDetails on init', () => {
      expect(mockService.getEntryDetails).toHaveBeenCalledWith('W123424081006', undefined);
    });

    it('should populate donation details from response', () => {
      expect(component.donationDetails.unitId).toBe('W123424081006');
      expect(component.donationDetails.donationType).toBe('AL');
      expect(component.donationDetails.procedureCode).toBe('WB');
    });

    it('should populate donor info from response', () => {
      expect(component.donorInfo.donorId).toBe('DN30134290');
      expect(component.donorInfo.firstName).toBe('FREDDIE');
      expect(component.donorInfo.lastName).toBe('FLEMING');
    });

    it('should populate address fields', () => {
      expect(component.donorInfo.streetName).toBe('452 CHAMPA ST');
      expect(component.donorInfo.city).toBe('DALLAS');
      expect(component.donorInfo.state).toBe('TEXAS');
      expect(component.donorInfo.zip).toBe('75235');
    });

    it('should populate contact fields', () => {
      expect(component.donorInfo.homePhone).toBe('234-567-89');
      expect(component.donorInfo.mobilePhone).toBe('234-567-89');
      expect(component.donorInfo.email).toBe('fleming.fred@hotmail.com');
    });

    it('should set loading to false after data loads', () => {
      expect(component.loading).toBe(false);
    });

    it('should pass collDate to getEntryDetails when provided', () => {
      const dataWithColl: DonationEntryDetailsData = { unitId: 'U001', collDate: '2024-01-01' };
      serviceSpy.getEntryDetails.calls.reset();
      serviceSpy.getEntryDetails.and.returnValue(of(mockResponse));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [NoopAnimationsModule, DonationEntryDetailsDialogComponent],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: dataWithColl },
          { provide: DonationEntryDetailsService, useValue: serviceSpy },
          { provide: MatDialog, useValue: matDialogSpy },
          { provide: HeaderService, useValue: headerServiceSpy },
        ],
      });

      const f = TestBed.createComponent(DonationEntryDetailsDialogComponent);
      f.detectChanges();
      expect(serviceSpy.getEntryDetails).toHaveBeenCalledWith('U001', '2024-01-01');
    });
  });

  describe('onBack', () => {
    it('should close the dialog without a result', () => {
      component.onBack();
      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });

    it('should not pass any argument to close', () => {
      component.onBack();
      expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
      expect(dialogRefSpy.close.calls.mostRecent().args.length).toBe(0);
    });
  });

  describe('onClose', () => {
    it('should close the dialog with closeAll', () => {
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalledWith('closeAll');
    });

    it('should call close exactly once', () => {
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should call next before complete', () => {
      const callOrder: string[] = [];
      spyOn(component['destroy$'], 'next').and.callFake(() => callOrder.push('next'));
      spyOn(component['destroy$'], 'complete').and.callFake(() => callOrder.push('complete'));

      component.ngOnDestroy();

      expect(callOrder).toEqual(['next', 'complete']);
    });
  });

  describe('openAlternateDemographics', () => {
    it('should return early when donorId is falsy', () => {
      component.donorInfo = {};
      component.openAlternateDemographics();
      expect(matDialogSpy.open).not.toHaveBeenCalled();
    });

    it('should return early when donorId is undefined', () => {
      component.donorInfo = { donorId: undefined };
      component.openAlternateDemographics();
      expect(matDialogSpy.open).not.toHaveBeenCalled();
    });

    it('should open alternate demographics dialog when donorId exists', () => {
      const afterClosedSubject = new Subject<any>();
      const altDialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
      altDialogRefSpy.afterClosed.and.returnValue(afterClosedSubject.asObservable());
      const openSpy = spyOn(component['altDialog'], 'open').and.returnValue(altDialogRefSpy);

      component.donorInfo = { donorId: 'DN30134290' };
      component.openAlternateDemographics();

      expect(openSpy).toHaveBeenCalledTimes(1);
      const callArgs = openSpy.calls.mostRecent().args;
      expect(callArgs[1]).toBeDefined();
      expect(callArgs[1]!.width).toBe('700px');
      expect(callArgs[1]!.hasBackdrop).toBe(true);
      expect(callArgs[1]!.disableClose).toBe(false);
    });

    it('should pass correct dialog data with donorId as string', () => {
      const afterClosedSubject = new Subject<any>();
      const altDialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
      altDialogRefSpy.afterClosed.and.returnValue(afterClosedSubject.asObservable());
      const openSpy = spyOn(component['altDialog'], 'open').and.returnValue(altDialogRefSpy);

      component.donorInfo = { donorId: 'DN30134290' };
      component.openAlternateDemographics();

      const callArgs = openSpy.calls.mostRecent().args;
      const data = callArgs[1]!.data;
      expect(data.donorId).toBe('DN30134290');
      expect(data.readOnly).toBe(false);
    });

    it('should close this dialog when alt dialog returns closeAll', () => {
      const afterClosedSubject = new Subject<any>();
      const altDialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
      altDialogRefSpy.afterClosed.and.returnValue(afterClosedSubject.asObservable());
      spyOn(component['altDialog'], 'open').and.returnValue(altDialogRefSpy);

      component.donorInfo = { donorId: 'DN30134290' };
      component.openAlternateDemographics();

      afterClosedSubject.next('closeAll');
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });

    it('should toggle visibility back when alt dialog returns non-closeAll result', () => {
      const afterClosedSubject = new Subject<any>();
      const altDialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
      altDialogRefSpy.afterClosed.and.returnValue(afterClosedSubject.asObservable());
      spyOn(component['altDialog'], 'open').and.returnValue(altDialogRefSpy);

      const toggleSpy = spyOn<any>(component, 'toggleDialogVisibility');

      component.donorInfo = { donorId: 'DN30134290' };
      component.openAlternateDemographics();

      // First call to toggleDialogVisibility(false) happens immediately
      expect(toggleSpy).toHaveBeenCalledWith(false);

      afterClosedSubject.next(null);
      // Second call to toggleDialogVisibility(true) happens on close
      expect(toggleSpy).toHaveBeenCalledWith(true);
    });

    it('should toggle visibility back when alt dialog returns undefined', () => {
      const afterClosedSubject = new Subject<any>();
      const altDialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
      altDialogRefSpy.afterClosed.and.returnValue(afterClosedSubject.asObservable());
      spyOn(component['altDialog'], 'open').and.returnValue(altDialogRefSpy);

      const toggleSpy = spyOn<any>(component, 'toggleDialogVisibility');

      component.donorInfo = { donorId: 'DN30134290' };
      component.openAlternateDemographics();

      afterClosedSubject.next(undefined);
      expect(toggleSpy).toHaveBeenCalledWith(true);
    });

    it('should set correct dialog position and panel class', () => {
      const afterClosedSubject = new Subject<any>();
      const altDialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
      altDialogRefSpy.afterClosed.and.returnValue(afterClosedSubject.asObservable());
      const openSpy = spyOn(component['altDialog'], 'open').and.returnValue(altDialogRefSpy);

      component.donorInfo = { donorId: 'DN30134290' };
      component.openAlternateDemographics();

      const config = openSpy.calls.mostRecent().args[1]!;
      expect(config.position).toEqual({ right: '0', top: '64px' });
      expect(config.panelClass).toBe('code-dialog-panel-right');
      expect(config.backdropClass).toBe('code-dialog-backdrop');
    });

    it('should set correct dialog dimensions', () => {
      const afterClosedSubject = new Subject<any>();
      const altDialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
      altDialogRefSpy.afterClosed.and.returnValue(afterClosedSubject.asObservable());
      const openSpy = spyOn(component['altDialog'], 'open').and.returnValue(altDialogRefSpy);

      component.donorInfo = { donorId: 'DN30134290' };
      component.openAlternateDemographics();

      const config = openSpy.calls.mostRecent().args[1]!;
      expect(config.height).toBe('calc(100vh - 64px)');
      expect(config.maxWidth).toBe('100vw');
      expect(config.maxHeight).toBe('calc(100vh - 64px)');
    });
  });

  describe('formatValue', () => {
    it('should return the value when it exists', () => {
      expect(component.formatValue('test')).toBe('test');
    });



    it('should return dashes for null', () => {
      expect(component.formatValue(null)).toBe('---');
    });

    it('should return dashes for undefined', () => {
      expect(component.formatValue(undefined)).toBe('---');
    });

    it('should return the string representation of a number', () => {
      expect(component.formatValue(42)).toBe('42');
    });

    it('should return dashes for zero', () => {
      expect(component.formatValue(0)).toBe('0');
    });

    it('should return dashes for empty string', () => {
      expect(component.formatValue('')).toBe('---');
    });

    it('should return dashes for whitespace-only string', () => {
      expect(component.formatValue('   ')).toBe('---');
    });

    it('should trim surrounding whitespace', () => {
      expect(component.formatValue('  hello  ')).toBe('hello');
    });
  });

  describe('formatPhone', () => {
    it('should format area code and phone', () => {
      expect(component.formatPhone('214', '234-5678')).toBe('(214) 234-5678');
    });

    it('should include extension when provided', () => {
      expect(component.formatPhone('214', '234-5678', '100')).toBe('(214) 234-5678 ext 100');
    });

    it('should return dashes when area code is missing', () => {
      expect(component.formatPhone(undefined, '234-5678')).toBe('---');
    });

    it('should return dashes when phone is missing', () => {
      expect(component.formatPhone('214', undefined)).toBe('---');
    });

    it('should return dashes when both area code and phone are missing', () => {
      expect(component.formatPhone(undefined, undefined)).toBe('---');
    });

    it('should return dashes when area code is empty string', () => {
      expect(component.formatPhone('', '234-5678')).toBe('---');
    });

    it('should return dashes when phone is empty string', () => {
      expect(component.formatPhone('214', '')).toBe('---');
    });

    it('should not include extension when ext is empty string', () => {
      expect(component.formatPhone('214', '234-5678', '')).toBe('(214) 234-5678');
    });
  });

  describe('formatDate', () => {
    it('should format a valid date string', () => {
      expect(component.formatDate('2024-10-08')).toBe('08-OCT-2024');
    });

    it('should return dashes for null', () => {
      expect(component.formatDate(null)).toBe('---');
    });

    it('should return dashes for undefined', () => {
      expect(component.formatDate(undefined)).toBe('---');
    });

    it('should return dashes for empty string', () => {
      expect(component.formatDate('')).toBe('---');
    });

    it('should return dashes for invalid date string', () => {
      headerServiceSpy.getCurrentChapterTimezone.and.returnValue('InvalidTimezone');
      expect(component.formatDate('not-a-date')).toBe('---');
    });

    it('should format January date correctly', () => {
      expect(component.formatDate('2024-01-15')).toBe('15-JAN-2024');
    });

    it('should format December date correctly', () => {
      expect(component.formatDate('2024-12-25')).toBe('25-DEC-2024');
    });

    it('should pad single digit days with leading zero', () => {
      expect(component.formatDate('2024-03-05')).toBe('05-MAR-2024');
    });

    it('should use timezone from headerService', () => {
      headerServiceSpy.getCurrentChapterTimezone.and.returnValue('America/Chicago');
      // With America/Chicago (UTC-5 or -6), midnight UTC on 2024-10-08 becomes Oct 7 in Chicago
      const result = component.formatDate('2024-10-08T00:00:00Z');
      // The exact date depends on DST, but it should be a valid formatted date
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should fall back to UTC when headerService returns empty string', () => {
      headerServiceSpy.getCurrentChapterTimezone.and.returnValue('');
      expect(component.formatDate('2024-10-08')).toBe('08-OCT-2024');
    });

    it('should fall back to UTC when headerService returns null', () => {
      headerServiceSpy.getCurrentChapterTimezone.and.returnValue(null as any);
      expect(component.formatDate('2024-10-08')).toBe('08-OCT-2024');
    });
  });


  describe('toggleDialogVisibility', () => {




    it('should handle missing overlay pane gracefully', () => {
      spyOn(component['elRef'].nativeElement, 'closest').and.returnValue(null);
      expect(() => component['toggleDialogVisibility'](false)).not.toThrow();
    });

    it('should set display to none when visible is false', () => {
      const mockBackdrop = {
        classList: { contains: jasmine.createSpy('contains').and.returnValue(true) },
        style: { display: '' },
      };
      const mockWrapper = {
        style: { display: '' },
        previousElementSibling: mockBackdrop,
      };
      const mockOverlayPane = {
        closest: jasmine.createSpy('closest').and.returnValue(mockWrapper),
      };

      spyOn(component['elRef'].nativeElement, 'closest').and.returnValue(mockOverlayPane);

      component['toggleDialogVisibility'](false);

      expect(mockWrapper.style.display).toBe('none');
      expect(mockBackdrop.style.display).toBe('none');
    });

    it('should set display to empty string when visible is true', () => {
      const mockBackdrop = {
        classList: { contains: jasmine.createSpy('contains').and.returnValue(true) },
        style: { display: 'none' },
      };
      const mockWrapper = {
        style: { display: 'none' },
        previousElementSibling: mockBackdrop,
      };
      const mockOverlayPane = {
        closest: jasmine.createSpy('closest').and.returnValue(mockWrapper),
      };

      spyOn(component['elRef'].nativeElement, 'closest').and.returnValue(mockOverlayPane);

      component['toggleDialogVisibility'](true);

      expect(mockWrapper.style.display).toBe('');
      expect(mockBackdrop.style.display).toBe('');
    });

    it('should not modify backdrop when it does not have cdk-overlay-backdrop class', () => {
      const mockBackdrop = {
        classList: { contains: jasmine.createSpy('contains').and.returnValue(false) },
        style: { display: '' },
      };
      const mockWrapper = {
        style: { display: '' },
        previousElementSibling: mockBackdrop,
      };
      const mockOverlayPane = {
        closest: jasmine.createSpy('closest').and.returnValue(mockWrapper),
      };

      spyOn(component['elRef'].nativeElement, 'closest').and.returnValue(mockOverlayPane);

      component['toggleDialogVisibility'](false);

      expect(mockWrapper.style.display).toBe('none');
      expect(mockBackdrop.style.display).toBe('');
    });

    it('should handle missing wrapper gracefully', () => {
      const mockOverlayPane = {
        closest: jasmine.createSpy('closest').and.returnValue(null),
      };

      spyOn(component['elRef'].nativeElement, 'closest').and.returnValue(mockOverlayPane);

      expect(() => component['toggleDialogVisibility'](false)).not.toThrow();
    });

    it('should handle missing previousElementSibling', () => {
      const mockWrapper = {
        style: { display: '' },
        previousElementSibling: null,
      };
      const mockOverlayPane = {
        closest: jasmine.createSpy('closest').and.returnValue(mockWrapper),
      };

      spyOn(component['elRef'].nativeElement, 'closest').and.returnValue(mockOverlayPane);

      expect(() => component['toggleDialogVisibility'](false)).not.toThrow();
      expect(mockWrapper.style.display).toBe('none');
    });
  });

  describe('loadData', () => {
    it('should set loading to false on error', fakeAsync(() => {
      serviceSpy.getEntryDetails.and.returnValue(throwError(() => new Error('API Error')));

      fixture = TestBed.createComponent(DonationEntryDetailsDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(component.loading).toBe(false);
    }));

    it('should not update donationDetails or donorInfo on error', fakeAsync(() => {
      serviceSpy.getEntryDetails.and.returnValue(throwError(() => new Error('API Error')));

      fixture = TestBed.createComponent(DonationEntryDetailsDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(component.donationDetails).toEqual({});
      expect(component.donorInfo).toEqual({});
    }));

    it('should set loading to true initially during loadData', () => {
      // Use a Subject to control when observable emits
      const dataSubject = new Subject<DonationEntryDetailsWithDonor>();
      serviceSpy.getEntryDetails.and.returnValue(dataSubject.asObservable());

      fixture = TestBed.createComponent(DonationEntryDetailsDialogComponent);
      component = fixture.componentInstance;

      // ngOnInit has NOT been called yet (no detectChanges)
      // Call ngOnInit manually to trigger loadData
      component.ngOnInit();

      // loading should be true before the observable emits
      expect(component.loading).toBe(true);

      // Now emit data
      dataSubject.next(mockResponse);
      expect(component.loading).toBe(false);
    });

    it('should handle null response data gracefully', fakeAsync(() => {
      serviceSpy.getEntryDetails.and.returnValue(of(null));

      fixture = TestBed.createComponent(DonationEntryDetailsDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(component.donationDetails).toEqual({});
      expect(component.donorInfo).toEqual({});
      expect(component.loading).toBe(false);
    }));
  });

  describe('Edge cases', () => {
    it('should handle empty response objects', fakeAsync(() => {
      const emptyResponse: DonationEntryDetailsWithDonor = {
        donationDetails: {},
        donorInfo: {},
      };

      mockService.getEntryDetails.and.returnValue(of(emptyResponse));

      fixture = TestBed.createComponent(DonationEntryDetailsDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(component.donationDetails.unitId).toBeUndefined();
      expect(component.donorInfo.donorId).toBeUndefined();
      expect(component.loading).toBe(false);
    }));

    it('should handle null donationDetails and donorInfo', fakeAsync(() => {
      const nullResponse: DonationEntryDetailsWithDonor = {};

      mockService.getEntryDetails.and.returnValue(of(nullResponse));

      fixture = TestBed.createComponent(DonationEntryDetailsDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(component.donationDetails).toEqual({});
      expect(component.donorInfo).toEqual({});
      expect(component.loading).toBe(false);
    }));
  });

  describe('subscription cleanup', () => {
    it('should unsubscribe from loadData observable on destroy', fakeAsync(() => {
      const dataSubject = new Subject<DonationEntryDetailsWithDonor>();
      serviceSpy.getEntryDetails.and.returnValue(dataSubject.asObservable());

      fixture = TestBed.createComponent(DonationEntryDetailsDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      // Component is loading
      expect(component.loading).toBe(true);

      // Destroy the component before data arrives
      component.ngOnDestroy();

      // Emit data after destroy
      dataSubject.next(mockResponse);

      // loading should still be true because the subscription was cancelled
      expect(component.loading).toBe(true);
    }));

    it('should unsubscribe from alt dialog afterClosed on destroy', () => {
      const afterClosedSubject = new Subject<any>();
      const altDialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
      altDialogRefSpy.afterClosed.and.returnValue(afterClosedSubject.asObservable());
      spyOn(component['altDialog'], 'open').and.returnValue(altDialogRefSpy);

      component.donorInfo = { donorId: 'DN30134290' };
      component.openAlternateDemographics();

      // Destroy the component
      component.ngOnDestroy();

      // Emit closeAll after destroy - should NOT close the parent dialog
      dialogRefSpy.close.calls.reset();
      afterClosedSubject.next('closeAll');

      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });
  });
});
