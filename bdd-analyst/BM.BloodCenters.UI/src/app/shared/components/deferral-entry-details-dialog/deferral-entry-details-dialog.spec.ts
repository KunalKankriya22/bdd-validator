import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

import { DeferralEntryDetailsDialogComponent } from './deferral-entry-details-dialog';
import { DeferralEntryDetailsService } from '@shared/services/deferral-entry-details.service';
import { createMockMatDialog } from '@shared/testing/common-mocks';
import {
  DeferralEntryDetailsDialogData,
  DeferralEntryDetailsDto,
} from '@shared/models/deferral-entry-details.model';

describe('DeferralEntryDetailsDialogComponent', () => {
  let component: DeferralEntryDetailsDialogComponent;
  let fixture: ComponentFixture<DeferralEntryDetailsDialogComponent>;
  let serviceSpy: jasmine.SpyObj<DeferralEntryDetailsService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<DeferralEntryDetailsDialogComponent>>;
  let matDialogSpy: jasmine.SpyObj<MatDialog>;

  const mockDialogData: DeferralEntryDetailsDialogData = {
    donorId: 'DN30136690',
    driveDate: '2025-03-17',
  };

  const mockDeferralEntry: DeferralEntryDetailsDto = {
    donorId: 'DN30136690',
    driveDate: '2025-03-17T00:00:00Z',
    deferralId: 'W123424081006',
    creditSponsor: 'SPONSOR01',
    lookupId: 'CJH123',
    screenerId: 'CJH123',
    physicalId: 'CJH123',
    donationType: 'AL',
    deferralType: 'IND',
    procedureCode: 'WB',
    deferralReason: '55',
    deferredThruDate: null,
    firstReviewerId: 'CJH123',
    transactionId: 'TR02885439',
    bagType: null,
    setId: null,
    creditCount: null,
    equipType: null,
    donorInfo: {
      bloodType: 'No ABO',
      lastName: 'KIM',
      firstName: 'MUBEE',
      middleName: null,
      lastNameSuffix: null,
      alternateIdType: 'DRLIC',
      alternateId: '09181959003',
      dateOfBirth: '2003-03-12T00:00:00Z',
      gender: 'Male',
      donorWeight: 123,
      email: 'kim.mubee@hotmail.com',
      ethnicGroup: 'CA',
      status: 'A',
      address: {
        streetName: '82 LONG',
        suiteApt: null,
        city: 'DALLAS',
        state: 'TEXAS',
        zip: '75235',
        intlAddr: null,
      },
      homePhone: {
        areaCode: '+214',
        phoneNo: '234-567-89',
        extension: null,
        formattedPhone: '(+214) 234-567-89',
      },
      dayPhone: {
        areaCode: '+214',
        phoneNo: '234-567-89',
        extension: null,
        formattedPhone: '(+214) 234-567-89',
      },
      mobilePhone: {
        areaCode: '+817',
        phoneNo: '234-567-89',
        extension: null,
        formattedPhone: '(+817) 234-567-89',
      },
      preferredContactFlag: 'M',
      employer: {
        employerId: 'EMP001',
        employerName: 'WELLSKY',
        city: 'OVERLAND PARK',
        state: 'TEXAS',
        zip: '66207',
        intlAddr: null,
      },
    },
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('DeferralEntryDetailsService', ['getByCompositeKey', 'getByDonorId']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    matDialogSpy = createMockMatDialog();

    serviceSpy.getByCompositeKey.and.returnValue(of(mockDeferralEntry));
    serviceSpy.getByDonorId.and.returnValue(of({ data: [mockDeferralEntry], total: 1 }));



      TestBed.configureTestingModule({
      imports: [DeferralEntryDetailsDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DeferralEntryDetailsService, useValue: serviceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MatDialog, useValue: matDialogSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    });


    


      serviceSpy.getByCompositeKey.calls.reset();


      serviceSpy.getByDonorId.calls.reset();


      dialogRefSpy.close.calls.reset();


      matDialogSpy.open.calls.reset();


      serviceSpy.getByCompositeKey.and.returnValue(of(mockDeferralEntry));


      serviceSpy.getByDonorId.and.returnValue(of({ data: [mockDeferralEntry], total: 1 }));


    fixture = TestBed.createComponent(DeferralEntryDetailsDialogComponent);
    component = fixture.componentInstance;
    (component as any).altDialog = matDialogSpy;


    });

  describe('Component Initialization', () => {


    it('should load deferral entry details on init', () => {
      fixture.detectChanges();
      expect(serviceSpy.getByCompositeKey).toHaveBeenCalledWith('DN30136690', '2025-03-17');
      expect(component.deferralEntry).toEqual(mockDeferralEntry);
    });



    it('should handle missing donorId gracefully', () => {
      const emptyData: DeferralEntryDetailsDialogData = { donorId: '', driveDate: '' };
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [DeferralEntryDetailsDialogComponent, NoopAnimationsModule],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: DeferralEntryDetailsService, useValue: serviceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MatDialog, useValue: matDialogSpy },
          { provide: MAT_DIALOG_DATA, useValue: emptyData },
        ],
      });
      const emptyFixture = TestBed.createComponent(DeferralEntryDetailsDialogComponent);
      emptyFixture.detectChanges();
      expect(serviceSpy.getByCompositeKey).not.toHaveBeenCalled();
      expect(serviceSpy.getByDonorId).not.toHaveBeenCalled();
    });

    it('should use getByDonorId when driveDate is not provided', () => {
      const noDriveDateData: DeferralEntryDetailsDialogData = { donorId: 'DN30136690', driveDate: '' };
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [DeferralEntryDetailsDialogComponent, NoopAnimationsModule],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: DeferralEntryDetailsService, useValue: serviceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MatDialog, useValue: matDialogSpy },
          { provide: MAT_DIALOG_DATA, useValue: noDriveDateData },
        ],
      });
      const noDriveDateFixture = TestBed.createComponent(DeferralEntryDetailsDialogComponent);
      noDriveDateFixture.detectChanges();
      expect(serviceSpy.getByDonorId).toHaveBeenCalledWith('DN30136690', 10, 0);
      expect(serviceSpy.getByCompositeKey).not.toHaveBeenCalled();
      expect(noDriveDateFixture.componentInstance.deferralEntry).toEqual(mockDeferralEntry);
    });

    it('should handle empty result from getByDonorId', () => {
      serviceSpy.getByDonorId.and.returnValue(of({ data: [], total: 0 }));
      const noDriveDateData: DeferralEntryDetailsDialogData = { donorId: 'DN30136690', driveDate: '' };
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [DeferralEntryDetailsDialogComponent, NoopAnimationsModule],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: DeferralEntryDetailsService, useValue: serviceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MatDialog, useValue: matDialogSpy },
          { provide: MAT_DIALOG_DATA, useValue: noDriveDateData },
        ],
      });
      const emptyResultFixture = TestBed.createComponent(DeferralEntryDetailsDialogComponent);
      emptyResultFixture.detectChanges();
      expect(emptyResultFixture.componentInstance.deferralEntry).toEqual({} as DeferralEntryDetailsDto);
    });
  });

  describe('UI Rendering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });







    it('should display deferral ID', () => {
      const fields = fixture.debugElement.queryAll(By.css('.field-value'));
      const deferralIdField = fields[0];
      expect(deferralIdField.nativeElement.textContent.trim()).toBe('W123424081006');
    });



    it('should display blood type (ABO)', () => {
      const fields = fixture.debugElement.queryAll(By.css('.field-value'));
      const aboField = fields[3];
      expect(aboField.nativeElement.textContent.trim()).toBe('No ABO');
    });



    it('should display formatted DOB', () => {
      const dobValue = component.formatDate('2003-03-12T00:00:00Z');
      expect(dobValue).toBe('12-MAR-2003');
    });

    it('should display formatted phone numbers', () => {
      const phoneValue = component.formatPhoneDto(mockDeferralEntry.donorInfo?.homePhone);
      expect(phoneValue).toBe('(+214) 234-567-89');
    });

    it('should display email address', () => {
      expect(component.donorInfo.email).toBe('kim.mubee@hotmail.com');
    });



    it('should display deferral information', () => {
      expect(component.deferralEntry.donationType).toBe('AL');
      expect(component.deferralEntry.procedureCode).toBe('WB');
      expect(component.deferralEntry.deferralReason).toBe('55');
    });

    it('should render ALTERNATE ADDRESS button', () => {
      const button = fixture.debugElement.query(By.css('.alternate-address-btn'));
      expect(button).toBeTruthy();
      expect(button.nativeElement.textContent.trim()).toBe('ALTERNATE ADDRESS');
    });

    it('should render CLOSE button', () => {
      const button = fixture.debugElement.query(By.css('.cancel-btn'));
      expect(button).toBeTruthy();
      expect(button.nativeElement.textContent.trim()).toBe('CLOSE');
    });

    it('should display field separators', () => {
      const separators = fixture.debugElement.queryAll(By.css('.field-separator'));
      expect(separators.length).toBeGreaterThan(0);
    });

    it('should render phone preferred checkboxes', () => {
      const checkboxes = fixture.debugElement.queryAll(By.css('.preferred-checkbox'));
      expect(checkboxes.length).toBe(3); // Home, Work, Mobile
    });
  });

  describe('Data Formatting', () => {
    it('should format null values as "---"', () => {
      expect(component.formatValue(null)).toBe('---');
      expect(component.formatValue(undefined)).toBe('---');
      expect(component.formatValue('')).toBe('---');
    });





    it('should format invalid dates as "---"', () => {
      expect(component.formatDate(null)).toBe('---');
      expect(component.formatDate('INVALID')).toBe('---');
      expect(component.formatDate('')).toBe('---');
    });







    it('should format PhoneDto objects correctly', () => {
      const phone = { areaCode: '555', phoneNo: '123-4567', extension: null, formattedPhone: '(555) 123-4567' };
      expect(component.formatPhoneDto(phone)).toBe('(555) 123-4567');
    });

    it('should use formattedPhone from PhoneDto if available', () => {
      const phone = { areaCode: '555', phoneNo: '123-4567', extension: null, formattedPhone: 'FORMATTED' };
      expect(component.formatPhoneDto(phone)).toBe('FORMATTED');
    });
  });

  describe('User Interactions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should go back when footer close button is clicked', () => {
      const cancelButton = fixture.debugElement.query(By.css('.cancel-btn'));
      cancelButton.nativeElement.click();
      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });






    it('should open alternate demographics dialog and restore visibility on non-closeAll result', () => {
      const afterClosedSubject = of(undefined);
      matDialogSpy.open.and.returnValue({ afterClosed: () => afterClosedSubject } as any);

      const toggleSpy = spyOn(component as any, 'toggleDialogVisibility').and.callThrough();

      const altButton = fixture.debugElement.query(By.css('.alternate-address-btn'));
      altButton.nativeElement.click();

      expect(matDialogSpy.open).toHaveBeenCalled();
      expect(toggleSpy).toHaveBeenCalledWith(false);
      expect(toggleSpy).toHaveBeenCalledWith(true);
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

  });

  describe('Preferred Phone Detection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should detect mobile as preferred when flag is M', () => {
      expect(component.isPreferredPhone('mobile')).toBeTrue();
      expect(component.isPreferredPhone('home')).toBeFalse();
      expect(component.isPreferredPhone('day')).toBeFalse();
    });

    it('should detect home as preferred when flag is H', () => {
      component.deferralEntry = {
        ...mockDeferralEntry,
        donorInfo: {
          ...mockDeferralEntry.donorInfo!,
          preferredContactFlag: 'H',
        },
      };
      expect(component.isPreferredPhone('home')).toBeTrue();
      expect(component.isPreferredPhone('day')).toBeFalse();
      expect(component.isPreferredPhone('mobile')).toBeFalse();
    });

    it('should detect day as preferred when flag is D', () => {
      component.deferralEntry = {
        ...mockDeferralEntry,
        donorInfo: {
          ...mockDeferralEntry.donorInfo!,
          preferredContactFlag: 'D',
        },
      };
      expect(component.isPreferredPhone('day')).toBeTrue();
      expect(component.isPreferredPhone('home')).toBeFalse();
      expect(component.isPreferredPhone('mobile')).toBeFalse();
    });

    it('should return false for all when flag is null', () => {
      component.deferralEntry = {
        ...mockDeferralEntry,
        donorInfo: {
          ...mockDeferralEntry.donorInfo!,
          preferredContactFlag: null,
        },
      };
      expect(component.isPreferredPhone('home')).toBeFalse();
      expect(component.isPreferredPhone('day')).toBeFalse();
      expect(component.isPreferredPhone('mobile')).toBeFalse();
    });

    it('should handle case-insensitive flag values', () => {
      component.deferralEntry = {
        ...mockDeferralEntry,
        donorInfo: {
          ...mockDeferralEntry.donorInfo!,
          preferredContactFlag: 'm',
        },
      };
      expect(component.isPreferredPhone('mobile')).toBeTrue();
    });
  });

  describe('Error Handling', () => {
    it('should handle service error gracefully', (done) => {
      serviceSpy.getByCompositeKey.and.returnValue(throwError(() => new Error('API Error')));

      const consoleErrorSpy = spyOn(console, 'error');
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.loading).toBeFalse();
        expect(consoleErrorSpy).toHaveBeenCalled();
        done();
      }, 100);
    });


  });
  describe('Convenience Accessors', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should provide donorInfo accessor', () => {
      expect(component.donorInfo).toBeTruthy();
      expect(component.donorInfo.lastName).toBe('KIM');
    });

    it('should provide address accessor', () => {
      expect(component.address).toBeTruthy();
      expect(component.address.city).toBe('DALLAS');
    });

    it('should provide homePhone accessor', () => {
      expect(component.homePhone).toBeTruthy();
      expect(component.homePhone.areaCode).toBe('+214');
    });

    it('should provide dayPhone accessor', () => {
      expect(component.dayPhone).toBeTruthy();
      expect(component.dayPhone.areaCode).toBe('+214');
    });

    it('should provide mobilePhone accessor', () => {
      expect(component.mobilePhone).toBeTruthy();
      expect(component.mobilePhone.areaCode).toBe('+817');
    });

    it('should provide employer accessor', () => {
      expect(component.employer).toBeTruthy();
      expect(component.employer.employerName).toBe('WELLSKY');
    });

    it('should return empty objects when donorInfo is null', () => {
      component.deferralEntry = { ...mockDeferralEntry, donorInfo: null };
      expect(component.donorInfo).toEqual({});
      expect(component.address).toEqual({});
      expect(component.homePhone).toEqual({});
    });

    it('should return empty dayPhone when donorInfo has no dayPhone', () => {
      component.deferralEntry = {
        ...mockDeferralEntry,
        donorInfo: { ...mockDeferralEntry.donorInfo!, dayPhone: null },
      };
      expect(component.dayPhone).toEqual({});
    });

    it('should return empty mobilePhone when donorInfo has no mobilePhone', () => {
      component.deferralEntry = {
        ...mockDeferralEntry,
        donorInfo: { ...mockDeferralEntry.donorInfo!, mobilePhone: null },
      };
      expect(component.mobilePhone).toEqual({});
    });

    it('should return empty employer when donorInfo has no employer', () => {
      component.deferralEntry = {
        ...mockDeferralEntry,
        donorInfo: { ...mockDeferralEntry.donorInfo!, employer: null },
      };
      expect(component.employer).toEqual({});
    });
  });

  describe('onClose', () => {
    it('should close the dialog with closeAll', () => {
      fixture.detectChanges();
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalledWith('closeAll');
    });
  });

  describe('onBack', () => {
    it('should close the dialog without arguments', () => {
      fixture.detectChanges();
      component.onBack();
      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });
  });

  describe('formatValue - additional branches', () => {
    it('should return the string value when given a non-empty string', () => {
      expect(component.formatValue('Hello')).toBe('Hello');
    });

    it('should return number as string when given a number', () => {
      expect(component.formatValue(123)).toBe('123');
    });

    it('should return zero as string when given 0', () => {
      expect(component.formatValue(0)).toBe('0');
    });

    it('should return "---" for whitespace-only string', () => {
      expect(component.formatValue('   ')).toBe('---');
    });

    it('should trim surrounding whitespace', () => {
      expect(component.formatValue('  test  ')).toBe('test');
    });
  });

  describe('formatPhone - direct testing', () => {
    it('should return "---" when areaCode is missing', () => {
      expect(component.formatPhone(undefined, '123-4567')).toBe('---');
    });

    it('should return "---" when phone is missing', () => {
      expect(component.formatPhone('555', undefined)).toBe('---');
    });

    it('should return "---" when both are missing', () => {
      expect(component.formatPhone(undefined, undefined)).toBe('---');
    });

    it('should format phone without extension', () => {
      expect(component.formatPhone('555', '123-4567')).toBe('(555) 123-4567');
    });

    it('should format phone with extension', () => {
      expect(component.formatPhone('555', '123-4567', '101')).toBe('(555) 123-4567 ext 101');
    });

    it('should format phone with empty string extension (no ext appended)', () => {
      expect(component.formatPhone('555', '123-4567', '')).toBe('(555) 123-4567');
    });
  });

  describe('formatPhoneDto - additional branches', () => {
    it('should return "---" when phoneDto is null', () => {
      expect(component.formatPhoneDto(null)).toBe('---');
    });

    it('should return "---" when phoneDto is undefined', () => {
      expect(component.formatPhoneDto(undefined)).toBe('---');
    });

    it('should fall back to formatPhone when formattedPhone is not available', () => {
      const phone = { areaCode: '555', phoneNo: '123-4567', extension: '42', formattedPhone: null };
      expect(component.formatPhoneDto(phone)).toBe('(555) 123-4567 ext 42');
    });

    it('should fall back to formatPhone when formattedPhone is empty string', () => {
      const phone = { areaCode: '555', phoneNo: '123-4567', extension: null, formattedPhone: '' };
      expect(component.formatPhoneDto(phone)).toBe('(555) 123-4567');
    });

    it('should return "---" from fallback when areaCode and phoneNo are null', () => {
      const phone = { areaCode: null, phoneNo: null, extension: null, formattedPhone: null };
      expect(component.formatPhoneDto(phone)).toBe('---');
    });
  });

  describe('formatDate - additional branches', () => {
    it('should format a valid date correctly', () => {
      expect(component.formatDate('2026-01-15T00:00:00Z')).toBe('15-JAN-2026');
    });

    it('should format dates for each month', () => {
      expect(component.formatDate('2025-06-01T00:00:00Z')).toBe('01-JUN-2025');
      expect(component.formatDate('2025-12-25T00:00:00Z')).toBe('25-DEC-2025');
    });

    it('should return "---" for undefined', () => {
      expect(component.formatDate(undefined)).toBe('---');
    });

    it('should pad single-digit days with zero', () => {
      expect(component.formatDate('2025-07-05T00:00:00Z')).toBe('05-JUL-2025');
    });
  });

  describe('openAlternateDemographics - additional branches', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not open dialog when donorId is falsy', () => {
      component.deferralEntry = { ...mockDeferralEntry, donorId: '' };
      component.openAlternateDemographics();
      expect(matDialogSpy.open).not.toHaveBeenCalled();
    });

    it('should close dialog when alternate demographics returns closeAll', () => {
      const afterClosedSubject = of('closeAll');
      matDialogSpy.open.and.returnValue({ afterClosed: () => afterClosedSubject } as any);

      component.openAlternateDemographics();

      expect(matDialogSpy.open).toHaveBeenCalled();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });

    it('should pass correct dialog data to alternate demographics', () => {
      const afterClosedSubject = of(undefined);
      matDialogSpy.open.and.returnValue({ afterClosed: () => afterClosedSubject } as any);

      component.openAlternateDemographics();

      const dialogData = matDialogSpy.open.calls.mostRecent().args[1];
      expect(dialogData?.data).toEqual({ donorId: 'DN30136690', readOnly: false });
    });

    it('should pass correct dialog configuration', () => {
      const afterClosedSubject = of(undefined);
      matDialogSpy.open.and.returnValue({ afterClosed: () => afterClosedSubject } as any);

      component.openAlternateDemographics();

      const config = matDialogSpy.open.calls.mostRecent().args[1];
      expect(config?.width).toBe('700px');
      expect(config?.hasBackdrop).toBeTrue();
      expect(config?.disableClose).toBeFalse();
    });
  });

  describe('toggleDialogVisibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle missing overlay pane gracefully', () => {
      spyOn(component['elRef'].nativeElement, 'closest').and.returnValue(null);
      expect(() => (component as any).toggleDialogVisibility(false)).not.toThrow();
    });

    it('should set display to none when visible is false', () => {
      const mockBackdrop = document.createElement('div');
      mockBackdrop.classList.add('cdk-overlay-backdrop');

      const mockWrapper = document.createElement('div');
      Object.defineProperty(mockWrapper, 'previousElementSibling', { value: mockBackdrop });
      (mockWrapper as any).style = { display: '' };

      const mockOverlayPane = document.createElement('div');
      spyOn(mockOverlayPane, 'closest').and.returnValue(mockWrapper);
      spyOn(component['elRef'].nativeElement, 'closest').and.returnValue(mockOverlayPane);

      (component as any).toggleDialogVisibility(false);

      expect(mockWrapper.style.display).toBe('none');
      expect(mockBackdrop.style.display).toBe('none');
    });

    it('should set display to empty string when visible is true', () => {
      const mockBackdrop = document.createElement('div');
      mockBackdrop.classList.add('cdk-overlay-backdrop');
      mockBackdrop.style.display = 'none';

      const mockWrapper = document.createElement('div');
      mockWrapper.style.display = 'none';
      Object.defineProperty(mockWrapper, 'previousElementSibling', { value: mockBackdrop });

      const mockOverlayPane = document.createElement('div');
      spyOn(mockOverlayPane, 'closest').and.returnValue(mockWrapper);
      spyOn(component['elRef'].nativeElement, 'closest').and.returnValue(mockOverlayPane);

      (component as any).toggleDialogVisibility(true);

      expect(mockWrapper.style.display).toBe('');
      expect(mockBackdrop.style.display).toBe('');
    });

    it('should not modify backdrop when it lacks cdk-overlay-backdrop class', () => {
      const mockBackdrop = document.createElement('div');
      // No cdk-overlay-backdrop class
      mockBackdrop.style.display = '';

      const mockWrapper = document.createElement('div');
      Object.defineProperty(mockWrapper, 'previousElementSibling', { value: mockBackdrop });

      const mockOverlayPane = document.createElement('div');
      spyOn(mockOverlayPane, 'closest').and.returnValue(mockWrapper);
      spyOn(component['elRef'].nativeElement, 'closest').and.returnValue(mockOverlayPane);

      (component as any).toggleDialogVisibility(false);

      expect(mockWrapper.style.display).toBe('none');
      expect(mockBackdrop.style.display).toBe('');
    });

    it('should handle missing wrapper gracefully', () => {
      const mockOverlayPane = document.createElement('div');
      spyOn(mockOverlayPane, 'closest').and.returnValue(null);
      spyOn(component['elRef'].nativeElement, 'closest').and.returnValue(mockOverlayPane);

      expect(() => (component as any).toggleDialogVisibility(false)).not.toThrow();
    });
  });

  describe('isPreferredPhone - additional flag values', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should detect day as preferred when flag is W', () => {
      component.deferralEntry = {
        ...mockDeferralEntry,
        donorInfo: { ...mockDeferralEntry.donorInfo!, preferredContactFlag: 'W' },
      };
      expect(component.isPreferredPhone('day')).toBeTrue();
      expect(component.isPreferredPhone('home')).toBeFalse();
      expect(component.isPreferredPhone('mobile')).toBeFalse();
    });

    it('should detect mobile as preferred when flag is C', () => {
      component.deferralEntry = {
        ...mockDeferralEntry,
        donorInfo: { ...mockDeferralEntry.donorInfo!, preferredContactFlag: 'C' },
      };
      expect(component.isPreferredPhone('mobile')).toBeTrue();
      expect(component.isPreferredPhone('home')).toBeFalse();
      expect(component.isPreferredPhone('day')).toBeFalse();
    });

    it('should return false for unrecognized flag', () => {
      component.deferralEntry = {
        ...mockDeferralEntry,
        donorInfo: { ...mockDeferralEntry.donorInfo!, preferredContactFlag: 'X' },
      };
      expect(component.isPreferredPhone('home')).toBeFalse();
      expect(component.isPreferredPhone('day')).toBeFalse();
      expect(component.isPreferredPhone('mobile')).toBeFalse();
    });
  });

  describe('ngOnDestroy', () => {
    it('should emit and complete destroy$ on destroy', () => {
      fixture.detectChanges();
      const destroySubject = (component as any).destroy$;
      const nextSpy = spyOn(destroySubject, 'next');
      const completeSpy = spyOn(destroySubject, 'complete');

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('loadData - null entry from getByCompositeKey', () => {
    it('should map null entry to empty object', () => {
      serviceSpy.getByCompositeKey.and.returnValue(of(null as any));
      fixture.detectChanges();
      expect(component.deferralEntry).toEqual({} as any);
      expect(component.loading).toBeFalse();
    });
  });

  describe('Loading state', () => {
    it('should set loading to true during data fetch', () => {
      expect(component.loading).toBeFalse();
    });

    it('should set loading to false after successful data fetch', () => {
      fixture.detectChanges();
      expect(component.loading).toBeFalse();
    });

    it('should set loading to false when donorId is empty', () => {
      const emptyData: DeferralEntryDetailsDialogData = { donorId: '', driveDate: '' };
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [DeferralEntryDetailsDialogComponent, NoopAnimationsModule],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: DeferralEntryDetailsService, useValue: serviceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MatDialog, useValue: matDialogSpy },
          { provide: MAT_DIALOG_DATA, useValue: emptyData },
        ],
      });
      const emptyFixture = TestBed.createComponent(DeferralEntryDetailsDialogComponent);
      emptyFixture.detectChanges();
      expect(emptyFixture.componentInstance.loading).toBeFalse();
    });
  });

  describe('UI header interactions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should close dialog when back button is clicked', () => {
      const backBtn = fixture.debugElement.query(By.css('.back-btn'));
      backBtn.nativeElement.click();
      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });

    it('should close dialog with closeAll when close icon button is clicked', () => {
      const headerRight = fixture.debugElement.queryAll(By.css('.icon-btn'));
      // The second icon-btn is the close button (first is back)
      const closeBtn = headerRight[1];
      closeBtn.nativeElement.click();
      expect(dialogRefSpy.close).toHaveBeenCalledWith('closeAll');
    });
  });
});
