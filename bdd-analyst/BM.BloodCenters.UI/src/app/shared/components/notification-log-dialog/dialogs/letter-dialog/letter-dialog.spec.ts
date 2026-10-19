import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { LetterDialogComponent, LetterDialogData } from './letter-dialog';
import { DonorCommunication, LetterDetails } from '../../../../models/notification-log.interface';
import { NotificationLogService } from '../../../../services/notification-log.service';

describe('LetterDialogComponent', () => {
  let serviceSpy: any;
  let dialogRefSpy: any;
  let component: LetterDialogComponent;
  let fixture: ComponentFixture<LetterDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<LetterDialogComponent>>;
  let notificationLogService: jasmine.SpyObj<NotificationLogService>;

  const mockCommunication: DonorCommunication = {
    // ✅ PATTERN: Required fields matching actual API response
    dateAndTime: '2026-04-28T10:30:00',
    communicationType: 'NOTFY',
    communicationTypeDescription: 'Donor Notification',
    communicationCode: 'RFI',
    communicationCodeDescription: 'Request for Information',
    actionCode: '',
    actionCodeDescription: '',
    comments: 'Test letter communication',
    staffId: 'S001',
    staffName: 'Smith, John',
    insertUserName: 'HUNTER, CELESTE',
    letterId: 'LSQ0545603', // String format as per actual API response
  };

  const mockLetterDetails: LetterDetails = {
    letterCode: '18.03',
    description: 'Donor Comments',
    generatedBy: 'CELHUN',
    generatedName: 'HUNTER, CELESTE',
    generatedOn: '2026-04-28T09:37:00Z',
    authorizedBy: 'CINCUL',
    authorizedName: 'CULLUM, CINDY',
    authorizedOn: '2026-04-26T10:37:00Z',
    reprintBy: undefined,
    reprintName: undefined,
    reprintOn: undefined,
    letterText: 'Dear Donor,\n\nThank you for your donation.\n\nSincerely,\nBlood Center Team',
    modifyIndicator: 'Y',
  };

  const mockData: LetterDialogData = {
    communication: mockCommunication,
    donorId: 'D12345',
  };

  beforeEach(() => {

    if (typeof URL.createObjectURL === 'undefined') {
      URL.createObjectURL = jest.fn(() => 'blob:http://localhost/fake-pdf');
    }
    if (typeof URL.revokeObjectURL === 'undefined') {
      URL.revokeObjectURL = jest.fn();
    }

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    serviceSpy = jasmine.createSpyObj('NotificationLogService', ['getLetterDetails', 'reprintLetter']);
    serviceSpy.getLetterDetails.and.returnValue(of(mockLetterDetails));



      TestBed.configureTestingModule({
      imports: [
        LetterDialogComponent,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: NotificationLogService, useValue: serviceSpy },
      ]
    });


    


      dialogRefSpy.close.calls.reset();


      serviceSpy.getLetterDetails.calls.reset();


      serviceSpy.reprintLetter.calls.reset();


      serviceSpy.getLetterDetails.and.returnValue(of(mockLetterDetails));


    fixture = TestBed.createComponent(LetterDialogComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<LetterDialogComponent>>;
    notificationLogService = TestBed.inject(NotificationLogService) as jasmine.SpyObj<NotificationLogService>;


    });


  it('should display correct dialog title', () => {
    // Act
    fixture.detectChanges();

    // Assert
    expect(component.dialogTitle).toBe('Display Notification Letter - LSQ0545603');
  });

  it('should load letter details on init', fakeAsync(() => {
    // Act
    fixture.detectChanges();
    tick(); // Wait for observable to complete

    // Assert
    expect(notificationLogService.getLetterDetails).toHaveBeenCalledWith('D12345', 'LSQ0545603');
    expect(component.loading()).toBe(false); // Loading completes after successful fetch
    expect(component.letterDetails()).toBeTruthy();
    expect(component.letterDetails()?.letterCode).toBe('18.03');
  }));





  it('should populate letter details from API', fakeAsync(() => {
    // Act
    fixture.detectChanges();
    tick();

    // Assert
    expect(component.letterDetails()?.generatedBy).toBe('CELHUN');
    expect(component.letterDetails()?.generatedName).toBe('HUNTER, CELESTE');
    expect(component.letterDetails()?.authorizedBy).toBe('CINCUL');
    expect(component.letterDetails()?.authorizedName).toBe('CULLUM, CINDY');
  }));

  it('should display letter text from API', fakeAsync(() => {
    // Act
    fixture.detectChanges();
    tick();

    // Assert
    expect(component.letterDetails()?.letterText).toContain('Dear Donor');
    expect(component.letterDetails()?.letterText).toContain('Thank you for your donation');
  }));





  describe('onReprint', () => {
    it('should reprint letter successfully and update metadata', fakeAsync(() => {
      // Arrange
      const updatedDetails: LetterDetails = {
        ...mockLetterDetails,
        reprintBy: 'ADS',
        reprintName: 'SMITH, JOHN',
        reprintOn: '2026-05-05T14:22:00Z',
      };
      notificationLogService.reprintLetter.and.returnValue(of(updatedDetails));
      spyOn(window, 'open'); // Mock window.open for PDF generation

      fixture.detectChanges();
      tick();

      // Act
      component.onReprint();
      tick();

      // Assert
      expect(notificationLogService.reprintLetter).toHaveBeenCalledWith('D12345', 'LSQ0545603');
      expect(component.letterDetails()?.reprintBy).toBe('ADS');
      expect(component.letterDetails()?.reprintName).toBe('SMITH, JOHN');
      expect(component.letterDetails()?.reprintOn).toBe('2026-05-05T14:22:00Z');
      expect(component.reprinting()).toBe(false);
      expect(window.open).toHaveBeenCalled(); // PDF generated
    }));



    it('should show error when letter ID is missing', fakeAsync(() => {
      // Arrange
      const dataWithoutLetterId: LetterDialogData = {
        communication: { ...mockCommunication, letterId: '' },
        donorId: 'D12345'
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [LetterDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRef },
          { provide: MAT_DIALOG_DATA, useValue: dataWithoutLetterId },
          { provide: NotificationLogService, useValue: notificationLogService },
        ]
      });
      fixture = TestBed.createComponent(LetterDialogComponent);
      component = fixture.componentInstance;
      spyOn(console, 'error');

      fixture.detectChanges();
      tick();

      // Act
      component.onReprint();

      // Assert
      expect(console.error).toHaveBeenCalledWith('No letter ID available for reprint');
      expect(notificationLogService.reprintLetter).not.toHaveBeenCalled();
    }));

    it('should show error when letter text is missing', fakeAsync(() => {
      // Arrange
      const detailsWithoutText: LetterDetails = { ...mockLetterDetails, letterText: '' };
      notificationLogService.getLetterDetails.and.returnValue(of(detailsWithoutText));
      spyOn(console, 'error');

      fixture.detectChanges();
      tick();

      // Act
      component.onReprint();

      // Assert
      expect(console.error).toHaveBeenCalledWith('No letter text available for reprint');
      expect(notificationLogService.reprintLetter).not.toHaveBeenCalled();
    }));

    it('should handle reprint API error', fakeAsync(() => {
      // Arrange
      notificationLogService.reprintLetter.and.returnValue(
        throwError(() => new Error('Reprint failed'))
      );
      spyOn(console, 'error');

      fixture.detectChanges();
      tick();

      // Act
      component.onReprint();
      tick();

      // Assert
      expect(notificationLogService.reprintLetter).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Reprint failed:', jasmine.any(Error));
      expect(component.reprinting()).toBe(false); // Reset loading state
    }));




  });
  describe('formatName', () => {
    it('should return dash for undefined input', () => {
      expect(component.formatName(undefined)).toBe('-');
    });





    it('should return dash for whitespace-padded comma', () => {
      expect(component.formatName('  ,  ')).toBe('-');
    });

    it('should return name for valid name string', () => {
      expect(component.formatName('HUNTER, CELESTE')).toBe('HUNTER, CELESTE');
    });

    it('should return name unchanged when it contains more than a comma', () => {
      expect(component.formatName('SMITH, JOHN')).toBe('SMITH, JOHN');
    });
  });



  it('should handle communication without letter ID', () => {
    // Arrange
    const dataWithoutLetterId: LetterDialogData = {
      communication: { ...mockCommunication, letterId: '' },
      donorId: 'D12345'
    };
    const serviceSpy = jasmine.createSpyObj('NotificationLogService', ['getLetterDetails']);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [LetterDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dataWithoutLetterId },
        { provide: NotificationLogService, useValue: serviceSpy },
      ]
    });
    fixture = TestBed.createComponent(LetterDialogComponent);
    component = fixture.componentInstance;

    // Act
    fixture.detectChanges();

    // Assert
    expect(component.dialogTitle).toContain('Unknown');
    expect(serviceSpy.getLetterDetails).not.toHaveBeenCalled();
  });



  it('should show reprinted metadata when available', fakeAsync(() => {
    // Arrange
    const detailsWithReprint: LetterDetails = {
      ...mockLetterDetails,
      reprintBy: 'TESTUSER',
      reprintName: 'TEST, USER',
      reprintOn: '2026-04-29T10:00:00Z',
    };
    notificationLogService.getLetterDetails.and.returnValue(of(detailsWithReprint));

    // Act
    fixture.detectChanges();
    tick();

    // Assert
    expect(component.letterDetails()?.reprintBy).toBe('TESTUSER');
    expect(component.letterDetails()?.reprintName).toBe('TEST, USER');
    expect(component.letterDetails()?.reprintOn).toBe('2026-04-29T10:00:00Z');
  }));

  it('should not show modified banner when modifyIndicator is N', fakeAsync(() => {
    // Arrange
    const detailsNotModified: LetterDetails = {
      ...mockLetterDetails,
      modifyIndicator: 'N',
    };
    notificationLogService.getLetterDetails.and.returnValue(of(detailsNotModified));

    // Act
    fixture.detectChanges();
    tick();

    // Assert
    expect(component.showModifiedBanner()).toBe(false);
  }));

  describe('Modified Banner Icon', () => {
    it('should render custom SVG image icon in modified banner', fakeAsync(() => {
      // Arrange
      fixture.detectChanges();
      tick();
      fixture.detectChanges(); // Trigger change detection after signal updates

      // Act
      const compiled = fixture.nativeElement as HTMLElement;
      const imgIcon = compiled.querySelector('.info-banner .banner-icon') as HTMLImageElement;

      // Assert
      expect(component.showModifiedBanner()).toBe(true); // Verify banner is shown
      expect(imgIcon).toBeTruthy('Image icon should exist');
      expect(imgIcon?.tagName.toLowerCase()).toBe('img');
      expect(imgIcon?.src).toContain('images/change-chapter/inform.svg');
      expect(imgIcon?.alt).toBe('Info');
    }));

    it('should apply correct CSS class to icon image', fakeAsync(() => {
      // Arrange
      fixture.detectChanges();
      tick();
      fixture.detectChanges(); // Trigger change detection after signal updates

      // Act
      const compiled = fixture.nativeElement as HTMLElement;
      const imgIcon = compiled.querySelector('.banner-icon');

      // Assert
      expect(imgIcon).toBeTruthy('Image icon should exist');
      expect(imgIcon?.classList.contains('banner-icon')).toBe(true);
    }));

    it('should display banner text alongside icon', fakeAsync(() => {
      // Arrange
      fixture.detectChanges();
      tick();
      fixture.detectChanges(); // Trigger change detection after signal updates

      // Act
      const compiled = fixture.nativeElement as HTMLElement;
      const bannerContent = compiled.querySelector('.info-banner .banner-content');
      const bannerText = compiled.querySelector('.info-banner .banner-text');

      // Assert
      expect(bannerContent).toBeTruthy('Banner content should exist');
      expect(bannerText).toBeTruthy('Banner text should exist');
      expect(bannerText?.textContent).toContain('This letter was modified.');
    }));
  });
});
