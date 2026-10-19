import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';

import { DonationDeferralAuditDrawerComponent } from './donation-deferral-audit-drawer';
import { DonationDeferralAuditService } from '../../services/donation-deferral-audit.service';
import { DonationDeferralAuditDto, DonationDeferralAuditDrawerData } from '../../models/donation-deferral-audit.model';
import { HeaderService } from '@shared/services/header.service';

describe('DonationDeferralAuditDrawerComponent', () => {
  let component: DonationDeferralAuditDrawerComponent;
  let fixture: ComponentFixture<DonationDeferralAuditDrawerComponent>;
  let auditService: jasmine.SpyObj<DonationDeferralAuditService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<DonationDeferralAuditDrawerComponent>>;

  const mockChapterTimeZoneSignal = signal<string>('');

  const mockDialogData: DonationDeferralAuditDrawerData = {
    transactionId: 'TR02867427',
  };

  const mockAuditData: DonationDeferralAuditDto = {
    transactionId: 'TR02867427',
    unitId: 'U001',
    deferralId: null,
    signatureFlag: 'Y',
    donationType: 'Alogenic',
    procedureCode: 'PP',
    auditDate: new Date('2019-03-03T19:57:00Z'),
    auditUserName: 'Hunter, Celeste',
    isAbbreviatedDhq: false,
    healthHistory: [
      {
        questionCode: 'HQ0071',
        questionSequence: '1',
        response: 'Yes',
        answerCode: '4WAY4',
        answerDescription: '4-Way Cold Tablets',
        startDate: new Date('2019-02-28'),
        endDate: new Date('2019-03-03'),
        interCode: null,
        incidentDate: new Date('2019-03-03'),
        deferralThruDate: new Date('2019-03-03'),
        deferralPeriod: null,
        periodType: null,
        comments: 'Test comment',
      },
    ],
    physicalFindings: [
      {
        physicalCode: 'HQ0071',
        codeDescription: 'Arm Check',
        physicalValue: '120',
        interCode: null,
        interDescription: null,
        comments: 'Test physical comment',
      },
    ],
  };

  beforeEach(() => {

    auditService = jasmine.createSpyObj('DonationDeferralAuditService', ['getAuditDetails']);
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    auditService.getAuditDetails.and.returnValue(of(mockAuditData));

    mockChapterTimeZoneSignal.set('');

      TestBed.configureTestingModule({
      imports: [DonationDeferralAuditDrawerComponent, NoopAnimationsModule, MatDialogModule],
      providers: [
        { provide: DonationDeferralAuditService, useValue: auditService },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        {
          provide: HeaderService,
          useValue: {
            chapterTimeZone: mockChapterTimeZoneSignal,
          },
        },
      ],
    });




      auditService.getAuditDetails.calls.reset();


      dialogRef.close.calls.reset();


      auditService.getAuditDetails.and.returnValue(of(mockAuditData));


    fixture = TestBed.createComponent(DonationDeferralAuditDrawerComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {


    it('should load audit details on init', () => {
      fixture.detectChanges();

      expect(auditService.getAuditDetails).toHaveBeenCalledWith('TR02867427');
      expect(component.auditData).toEqual(mockAuditData);
    });

    it('should set loading to false after successful load', () => {
      fixture.detectChanges();

      expect(component.loading).toBe(false);
    });

    it('should reset selected indices after successful load', () => {
      component.selectedHealthHistoryIndex = 5;
      component.selectedPhysicalFindingIndex = 3;

      fixture.detectChanges();

      expect(component.selectedHealthHistoryIndex).toBe(0);
      expect(component.selectedPhysicalFindingIndex).toBe(0);
    });

    it('should have correct default property values before init', () => {
      expect(component.loading).toBe(false);
      expect(component.auditData).toBeNull();
      expect(component.errorMessage).toBeNull();
      expect(component.selectedTabIndex).toBe(0);
      expect(component.selectedHealthHistoryIndex).toBe(0);
      expect(component.selectedPhysicalFindingIndex).toBe(0);
    });

    it('should define healthHistoryColumns', () => {
      expect(component.healthHistoryColumns).toEqual([
        'question',
        'response',
        'answer',
        'description',
        'startDate',
        'endDate',
        'interdictionCode',
        'incident',
        'deferredThroughDate',
      ]);
    });

    it('should define physicalFindingsColumns', () => {
      expect(component.physicalFindingsColumns).toEqual([
        'physicalCode',
        'description',
        'value',
        'interdictionCode',
        'interdictionDescription',
      ]);
    });

  });

  describe('Loading State', () => {
    it('should set loading to true while fetching audit details', () => {
      const subject = new Subject<DonationDeferralAuditDto>();
      auditService.getAuditDetails.and.returnValue(subject.asObservable());

      fixture.detectChanges();

      expect(component.loading).toBe(true);
      expect(component.errorMessage).toBeNull();

      subject.next(mockAuditData);
      subject.complete();

      expect(component.loading).toBe(false);
    });

    it('should display loading spinner when loading is true', () => {
      const subject = new Subject<DonationDeferralAuditDto>();
      auditService.getAuditDetails.and.returnValue(subject.asObservable());

      fixture.detectChanges();

      const spinner = fixture.debugElement.query(By.css('.loading-container'));
      expect(spinner).toBeTruthy();
    });
  });

  describe('Error State', () => {
    it('should display error message on error', () => {
      const errorMessage = 'An error occurred while retrieving audit details';
      auditService.getAuditDetails.and.returnValue(
        throwError(() => ({ error: { message: errorMessage } }))
      );

      fixture.detectChanges();

      expect(component.errorMessage).toBe(errorMessage);

      const errorContainer = fixture.debugElement.query(By.css('.error-container'));
      expect(errorContainer).toBeTruthy();
      expect(errorContainer.nativeElement.textContent).toContain(errorMessage);
    });

    it('should display default error message when error details missing', () => {
      auditService.getAuditDetails.and.returnValue(throwError(() => ({})));

      fixture.detectChanges();

      expect(component.errorMessage).toContain('An error occurred while retrieving audit details');
    });

    it('should handle missing transaction ID', () => {
      component.data = { transactionId: '' };
      auditService.getAuditDetails.calls.reset();
      component.ngOnInit();

      expect(component.errorMessage).toBe('Transaction ID is required');
      expect(auditService.getAuditDetails).not.toHaveBeenCalled();
    });

    it('should set loading to false on error', () => {
      auditService.getAuditDetails.and.returnValue(
        throwError(() => ({ error: { message: 'fail' } }))
      );

      fixture.detectChanges();

      expect(component.loading).toBe(false);
    });

    it('should handle null data property', () => {
      component.data = null as any;
      auditService.getAuditDetails.calls.reset();
      component.ngOnInit();

      expect(component.errorMessage).toBe('Transaction ID is required');
      expect(auditService.getAuditDetails).not.toHaveBeenCalled();
    });

    it('should handle error with null error property', () => {
      auditService.getAuditDetails.and.returnValue(
        throwError(() => ({ error: null }))
      );

      fixture.detectChanges();

      expect(component.errorMessage).toBe(
        'An error occurred while retrieving audit details. Please try again.'
      );
    });

    it('should handle error with no message in error object', () => {
      auditService.getAuditDetails.and.returnValue(
        throwError(() => ({ error: { code: 500 } }))
      );

      fixture.detectChanges();

      expect(component.errorMessage).toBe(
        'An error occurred while retrieving audit details. Please try again.'
      );
    });
  });

  describe('Data Display', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display transaction ID in field values', () => {
      const fieldValues = fixture.debugElement.queryAll(By.css('.field-value'));
      const transactionField = fieldValues[0];
      expect(transactionField.nativeElement.textContent.trim()).toContain('TR02867427');
    });

    it('should display audit user name', () => {
      const dialogBody = fixture.debugElement.query(By.css('.dialog-body'));
      expect(dialogBody).toBeTruthy();
      expect(dialogBody.nativeElement.textContent).toContain('Hunter, Celeste');
    });

    it('should display signature as Yes', () => {
      const dialogBody = fixture.debugElement.query(By.css('.dialog-body'));
      expect(dialogBody).toBeTruthy();
      expect(dialogBody.nativeElement.textContent).toContain('Yes');
    });



    it('should display selected comment', () => {
      const commentBox = fixture.debugElement.query(By.css('.comment-box'));
      expect(commentBox.nativeElement.textContent.trim()).toBe('Test comment');
    });
  });

  describe('Empty State', () => {
    it('should display no data message when health history is empty', () => {
      const dataWithEmptyHistory: DonationDeferralAuditDto = {
        ...mockAuditData,
        healthHistory: [],
      };

      auditService.getAuditDetails.and.returnValue(of(dataWithEmptyHistory));
      fixture.detectChanges();

      const noDataMessage = fixture.debugElement.query(By.css('.no-data-message'));
      expect(noDataMessage).toBeTruthy();
      expect(noDataMessage.nativeElement.textContent).toContain('No health history data available');
    });

    it('should compute hasHealthHistory correctly', () => {
      fixture.detectChanges();
      expect(component.hasHealthHistory).toBe(true);

      component.auditData = {
        ...mockAuditData,
        healthHistory: [],
      };

      expect(component.hasHealthHistory).toBe(false);
    });

    it('should compute hasPhysicalFindings correctly', () => {
      fixture.detectChanges();
      expect(component.hasPhysicalFindings).toBe(true);

      component.auditData = {
        ...mockAuditData,
        physicalFindings: [],
      };

      expect(component.hasPhysicalFindings).toBe(false);
    });

    it('should return false for hasHealthHistory when auditData is null', () => {
      component.auditData = null;
      expect(component.hasHealthHistory).toBe(false);
    });

    it('should return false for hasPhysicalFindings when auditData is null', () => {
      component.auditData = null;
      expect(component.hasPhysicalFindings).toBe(false);
    });

    it('should return false for hasHealthHistory when healthHistory is undefined', () => {
      component.auditData = { ...mockAuditData, healthHistory: undefined as any };
      expect(component.hasHealthHistory).toBe(false);
    });

    it('should return false for hasPhysicalFindings when physicalFindings is undefined', () => {
      component.auditData = { ...mockAuditData, physicalFindings: undefined as any };
      expect(component.hasPhysicalFindings).toBe(false);
    });
  });

  describe('Date Formatting', () => {
    it('should format dates as DD-MMM-YYYY', () => {
      const formattedDate = component.formatDate(new Date('2019-03-03'));
      expect(formattedDate).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should format datetime as DD-MMM-YYYY HH:mm', () => {
      const formattedDateTime = component.formatDateTime(new Date('2019-03-03T19:57:00Z'));
      expect(formattedDateTime).toMatch(/^\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}$/);
    });

    it('should return --- for null date in formatDate', () => {
      expect(component.formatDate(null)).toBe('---');
    });

    it('should return --- for undefined date in formatDate', () => {
      expect(component.formatDate(undefined)).toBe('---');
    });

    it('should return --- for empty string in formatDate', () => {
      expect(component.formatDate('')).toBe('---');
    });

    it('should return --- for invalid date string in formatDate', () => {
      expect(component.formatDate('not-a-date')).toBe('---');
    });

    it('should return --- for null date in formatDateTime', () => {
      expect(component.formatDateTime(null)).toBe('---');
    });

    it('should return --- for undefined date in formatDateTime', () => {
      expect(component.formatDateTime(undefined)).toBe('---');
    });

    it('should return --- for empty string in formatDateTime', () => {
      expect(component.formatDateTime('')).toBe('---');
    });

    it('should return --- for invalid date string in formatDateTime', () => {
      expect(component.formatDateTime('invalid-date')).toBe('---');
    });

    it('should use convertUTCToTimezone when chapterTimeZone is set for formatDate', () => {
      mockChapterTimeZoneSignal.set('America/Chicago');
      const result = component.formatDate('2019-03-03T19:57:00Z');
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should use new Date when chapterTimeZone is empty for formatDate', () => {
      mockChapterTimeZoneSignal.set('');
      const result = component.formatDate('2019-03-03T19:57:00Z');
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should use convertUTCToTimezone when chapterTimeZone is set for formatDateTime', () => {
      mockChapterTimeZoneSignal.set('America/New_York');
      const result = component.formatDateTime('2019-03-03T19:57:00Z');
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}$/);
    });

    it('should use new Date when chapterTimeZone is empty for formatDateTime', () => {
      mockChapterTimeZoneSignal.set('');
      const result = component.formatDateTime('2019-03-03T19:57:00Z');
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}$/);
    });

    it('should format date with string input for formatDate', () => {
      mockChapterTimeZoneSignal.set('');
      const result = component.formatDate('2019-06-15T00:00:00Z');
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-2019$/);
    });

    it('should include hours and minutes in formatDateTime', () => {
      mockChapterTimeZoneSignal.set('');
      const result = component.formatDateTime(new Date('2019-03-03T14:30:00Z'));
      expect(result).toContain(':');
    });
  });

  describe('Value Formatting', () => {
    it('should display value when present', () => {
      expect(component.formatValue('Test Value')).toBe('Test Value');
    });

    it('should display --- for null values', () => {
      expect(component.formatValue(null)).toBe('---');
    });

    it('should display --- for undefined values', () => {
      expect(component.formatValue(undefined)).toBe('---');
    });

    it('should display --- for empty strings', () => {
      expect(component.formatValue('')).toBe('---');
    });

    it('should convert numbers to strings', () => {
      expect(component.formatValue(123)).toBe('123');
    });

    it('should trim whitespace-only strings to ---', () => {
      expect(component.formatValue('   ')).toBe('---');
    });

    it('should trim leading/trailing whitespace from values', () => {
      expect(component.formatValue('  hello  ')).toBe('hello');
    });

    it('should handle zero as a number', () => {
      expect(component.formatValue(0)).toBe('0');
    });
  });

  describe('Signature Formatting', () => {
    it('should format Y as Yes', () => {
      expect(component.formatSignature('Y')).toBe('Yes');
    });

    it('should format N as No', () => {
      expect(component.formatSignature('N')).toBe('No');
    });



    it('should return --- for null', () => {
      expect(component.formatSignature(null)).toBe('---');
    });

    it('should return original value for unknown flags', () => {
      expect(component.formatSignature('X')).toBe('X');
    });

    it('should return --- for undefined', () => {
      expect(component.formatSignature(undefined)).toBe('---');
    });

    it('should return --- for empty string', () => {
      expect(component.formatSignature('')).toBe('---');
    });

    it('should handle lowercase y as Yes', () => {
      expect(component.formatSignature('y')).toBe('Yes');
    });

    it('should handle lowercase n as No', () => {
      expect(component.formatSignature('n')).toBe('No');
    });
  });

  describe('Response Formatting', () => {
    it('should format Y as Yes', () => {
      expect(component.formatResponse('Y')).toBe('Yes');
    });

    it('should format N as No', () => {
      expect(component.formatResponse('N')).toBe('No');
    });

    it('should return --- for null', () => {
      expect(component.formatResponse(null)).toBe('---');
    });

    it('should return --- for undefined', () => {
      expect(component.formatResponse(undefined)).toBe('---');
    });

    it('should return --- for empty string', () => {
      expect(component.formatResponse('')).toBe('---');
    });

    it('should return the original trimmed value for other responses', () => {
      expect(component.formatResponse('Maybe')).toBe('Maybe');
    });

    it('should handle lowercase y as Yes', () => {
      expect(component.formatResponse('y')).toBe('Yes');
    });

    it('should handle lowercase n as No', () => {
      expect(component.formatResponse('n')).toBe('No');
    });

    it('should trim whitespace from values', () => {
      expect(component.formatResponse('  Yes  ')).toBe('Yes');
    });

    it('should return --- for whitespace-only string', () => {
      expect(component.formatResponse('   ')).toBe('---');
    });
  });

  describe('Selected Comment', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return health history comment when on first tab', () => {
      component.selectedTabIndex = 0;
      component.selectedHealthHistoryIndex = 0;
      expect(component.selectedComment).toBe('Test comment');
    });

    it('should return physical finding comment when on second tab', () => {
      component.selectedTabIndex = 1;
      component.selectedPhysicalFindingIndex = 0;
      expect(component.selectedComment).toBe('Test physical comment');
    });

    it('should return empty string when auditData is null', () => {
      component.auditData = null;
      expect(component.selectedComment).toBe('');
    });

    it('should return empty string when health history item has null comments', () => {
      component.selectedTabIndex = 0;
      component.auditData = {
        ...mockAuditData,
        healthHistory: [{ ...mockAuditData.healthHistory![0], comments: null }],
      };
      expect(component.selectedComment).toBe('');
    });

    it('should return empty string when physical finding item has null comments', () => {
      component.selectedTabIndex = 1;
      component.auditData = {
        ...mockAuditData,
        physicalFindings: [{ ...mockAuditData.physicalFindings![0], comments: null }],
      };
      expect(component.selectedComment).toBe('');
    });

    it('should return empty string when selected index is out of bounds for health history', () => {
      component.selectedTabIndex = 0;
      component.selectedHealthHistoryIndex = 99;
      expect(component.selectedComment).toBe('');
    });

    it('should return empty string when selected index is out of bounds for physical findings', () => {
      component.selectedTabIndex = 1;
      component.selectedPhysicalFindingIndex = 99;
      expect(component.selectedComment).toBe('');
    });

    it('should return empty string when health history has whitespace-only comments', () => {
      component.selectedTabIndex = 0;
      component.auditData = {
        ...mockAuditData,
        healthHistory: [{ ...mockAuditData.healthHistory![0], comments: '   ' }],
      };
      expect(component.selectedComment).toBe('');
    });

    it('should return empty string when physical findings has whitespace-only comments', () => {
      component.selectedTabIndex = 1;
      component.auditData = {
        ...mockAuditData,
        physicalFindings: [{ ...mockAuditData.physicalFindings![0], comments: '   ' }],
      };
      expect(component.selectedComment).toBe('');
    });

    it('should return trimmed comment from health history', () => {
      component.selectedTabIndex = 0;
      component.auditData = {
        ...mockAuditData,
        healthHistory: [{ ...mockAuditData.healthHistory![0], comments: '  trimmed comment  ' }],
      };
      expect(component.selectedComment).toBe('trimmed comment');
    });

    it('should return comment for any non-zero tab index from physical findings', () => {
      component.selectedTabIndex = 2;
      component.selectedPhysicalFindingIndex = 0;
      expect(component.selectedComment).toBe('Test physical comment');
    });
  });

  describe('Row Selection', () => {
    it('should update selected health history index', () => {
      component.selectHealthHistoryRow(2);
      expect(component.selectedHealthHistoryIndex).toBe(2);
    });

    it('should update selected physical finding index', () => {
      component.selectPhysicalFindingRow(3);
      expect(component.selectedPhysicalFindingIndex).toBe(3);
    });

    it('should update health history index to 0', () => {
      component.selectedHealthHistoryIndex = 5;
      component.selectHealthHistoryRow(0);
      expect(component.selectedHealthHistoryIndex).toBe(0);
    });

    it('should update physical finding index to 0', () => {
      component.selectedPhysicalFindingIndex = 5;
      component.selectPhysicalFindingRow(0);
      expect(component.selectedPhysicalFindingIndex).toBe(0);
    });
  });

  describe('Tab Change', () => {
    it('should update selected tab index', () => {
      component.onTabChange(1);
      expect(component.selectedTabIndex).toBe(1);
    });

    it('should update selected tab index to 0', () => {
      component.selectedTabIndex = 1;
      component.onTabChange(0);
      expect(component.selectedTabIndex).toBe(0);
    });
  });

  describe('Dialog Actions', () => {
    it('should close dialog without argument on onBack', () => {
      component.onBack();
      expect(dialogRef.close).toHaveBeenCalledWith();
    });

    it('should close dialog with closeAll on onClose', () => {
      component.onClose();
      expect(dialogRef.close).toHaveBeenCalledWith('closeAll');
    });

    it('should go back when footer close button clicked', () => {
      fixture.detectChanges();

      const cancelButton = fixture.debugElement.query(By.css('.dialog-footer .cancel-btn'));
      cancelButton.nativeElement.click();

      expect(dialogRef.close).toHaveBeenCalledWith();
    });

    it('should go back when back arrow button clicked', () => {
      fixture.detectChanges();

      const backButton = fixture.debugElement.query(By.css('.header-left .icon-btn'));
      backButton.nativeElement.click();

      expect(dialogRef.close).toHaveBeenCalledWith();
    });

    it('should close all when header close button clicked', () => {
      fixture.detectChanges();

      const closeButtons = fixture.debugElement.queryAll(By.css('.dialog-header > .icon-btn'));
      expect(closeButtons.length).toBe(1);
      closeButtons[0].nativeElement.click();

      expect(dialogRef.close).toHaveBeenCalledWith('closeAll');
    });
  });



  describe('Component Cleanup', () => {
    it('should complete destroy$ on component destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });

    it('should unsubscribe from audit service on destroy', () => {
      const subject = new Subject<DonationDeferralAuditDto>();
      auditService.getAuditDetails.and.returnValue(subject.asObservable());

      fixture.detectChanges();
      component.ngOnDestroy();

      // After destroy, emitting a value should not update the component
      subject.next({ ...mockAuditData, transactionId: 'NEW_ID' });
      expect(component.auditData).toBeNull();
    });
  });
});
