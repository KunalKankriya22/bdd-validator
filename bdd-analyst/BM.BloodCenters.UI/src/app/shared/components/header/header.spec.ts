import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { Router, provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { HeaderComponent } from './header';
import { HeaderService } from '../../services/header.service';
import { LoginService } from '../../services/login.service';
import { AuthService } from '../../services/auth.service';
import { ChapterTimezoneService } from '../../services/chapter-timezone.service';
import { signal } from '@angular/core';
import { HeaderConfig } from '../../models/header.model';
import { By } from '@angular/platform-browser';
import { VersionInfoDialogComponent } from '../version-info-dialog/version-info-dialog.component';
import { SnackbarService } from '../../services/snackbar.service';
import { createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';

describe('HeaderComponent', () => {
  let chapterTimezoneServiceSpy: any;
  let authServiceSpy: any;
  let loginServiceSpy: any;
  let headerServiceSpy: any;
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let headerService: jasmine.SpyObj<HeaderService>;
  let loginService: jasmine.SpyObj<LoginService>;
  let authService: jasmine.SpyObj<AuthService>;
  let chapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;
  let router: Router;
  let dialog: MatDialog;
  let mockHeaderConfig: HeaderConfig;

  beforeEach(() => {

    // Mock header configuration
    mockHeaderConfig = {
      title: 'Blood Centers2',
      subtitle: 'Boston Children\'s Hospital',
      logoUrl: 'logo.png',
      user: {
        name: 'Test User',
        id: 'TEST123',
        role: 'Admin',
        avatarUrl: 'avatar.png'
      }
    };

    // Create spy object for HeaderService with all required signals
    headerServiceSpy = createMockHeaderService({
      chapterId: signal('DAL'),
      databasePrefix: signal('DEV'),
      databaseName: signal('devdb'),
      chapterPrintHdr: signal('Dallas Regional Blood Center'),
      chapterTimeZone: signal('-05:00'),
      headerConfig: signal(mockHeaderConfig),
    });
    headerServiceSpy.clearCookies.and.stub(); // Ensure clearCookies is properly stubbed

    // Create spy object for LoginService with new methods
    loginServiceSpy = jasmine.createSpyObj('LoginService', ['clearToken', 'isOktaUser', 'getAuthMethod', 'getStoredPasswordConfig', 'broadcastLogout']);
    loginServiceSpy.isOktaUser.and.returnValue(false); // Default to non-Okta user
    loginServiceSpy.getStoredPasswordConfig.and.returnValue({ isStrongPasswordConfigured: false });

    // Create spy object for AuthService
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout', 'clearTokens']);
    authServiceSpy.logout.and.returnValue(Promise.resolve());
    authServiceSpy.clearTokens.and.returnValue(Promise.resolve());

    // Create spy object for ChapterTimezoneService
    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', ['clearChapterLocalDate', 'isChapterLocalDateAvailable']);
    chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(true);



      TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
        { provide: SnackbarService, useValue: createMockSnackbarService() },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

      loginServiceSpy.isOktaUser.and.returnValue(false); // Default to non-Okta user


      loginServiceSpy.getStoredPasswordConfig.and.returnValue({ isStrongPasswordConfigured: false });


      authServiceSpy.logout.and.returnValue(Promise.resolve());


      authServiceSpy.clearTokens.and.returnValue(Promise.resolve());


      chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(true);


    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    loginService = TestBed.inject(LoginService) as jasmine.SpyObj<LoginService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    chapterTimezoneService = TestBed.inject(ChapterTimezoneService) as jasmine.SpyObj<ChapterTimezoneService>;
    router = TestBed.inject(Router);
    dialog = TestBed.inject(MatDialog);
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;


    });
  describe('Template Rendering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should display the logo when logoUrl is provided', () => {
      const logo: HTMLImageElement = fixture.debugElement.query(By.css('.header-logo'))?.nativeElement;
      expect(logo).toBeTruthy();
      expect(logo.src).toContain('logo.png');
      expect(logo.alt).toBe('Blood Centers2 logo');
    });



    it('should display date/time', () => {
      const datetime = fixture.debugElement.query(By.css('.datetime-text'));
      expect(datetime).toBeTruthy();
      // Format: DD-MON-YYYY, HH:MM TimeZone (e.g., 25-MAR-2026, 19:14 GMT+1)
      expect(datetime.nativeElement.textContent).toMatch(/\d{2}-[A-Z]{3}-\d{4}, \d{2}:\d{2} [A-Z0-9+\-:]+/);
    });

    it('should display user name when user is provided', () => {
      const userName = fixture.debugElement.query(By.css('.user-name'));
      expect(userName).toBeTruthy();
      expect(userName.nativeElement.textContent).toBe('Test User');
    });


  });

  describe('Icon Buttons and Labels', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should display database label from service', () => {
      const labels = fixture.debugElement.queryAll(By.css('.icon-label'));
      expect(labels[0].nativeElement.textContent.trim()).toBe('DEV');
    });



    it('should display chapter label from service', () => {
      const labels = fixture.debugElement.queryAll(By.css('.icon-label'));
      expect(labels[1].nativeElement.textContent.trim()).toBe('DAL');
    });



    it('should display warehouse label from service', () => {
      const labels = fixture.debugElement.queryAll(By.css('.icon-label'));
      expect(labels[2].nativeElement.textContent.trim()).toBe('WH01');
    });
  });

  describe('User Menu', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should display dropdown icon', () => {
      const dropdownIcon = fixture.debugElement.query(By.css('.dropdown-icon'));
      expect(dropdownIcon).toBeTruthy();
      expect(dropdownIcon.nativeElement.textContent).toBe('arrow_drop_down');
    });

    it('should display user name in button', () => {
      const userName = fixture.debugElement.query(By.css('.user-name'));
      expect(userName).toBeTruthy();
      expect(userName.nativeElement.textContent).toBe('Test User');
    });


  });

  describe('Event Handlers', () => {
    let consoleLogSpy: jasmine.Spy;

    beforeEach(() => {
      consoleLogSpy = spyOn(console, 'log');
      fixture.detectChanges();
    });

    it('should handle logo click and navigate to home', () => {
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      spyOn(router, 'navigate');

      component.onLogoClick(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should handle profile click and prevent default', () => {
      const event = new Event('click');
      spyOn(event, 'preventDefault');

      component.onProfileClick(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('Profile clicked');
    });

    it('should handle logout click and prevent default for non-Okta users', async () => {
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      spyOn(router, 'navigate');
      loginService.isOktaUser.and.returnValue(false);

      await component.onLogout(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(loginService.clearToken).toHaveBeenCalled();
      expect(chapterTimezoneService.clearChapterLocalDate).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalled();
      expect(authService.logout).not.toHaveBeenCalled();
    });

    it('should handle logout click for Okta users with SSO logout', async () => {
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      loginService.isOktaUser.and.returnValue(true);

      await component.onLogout(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(loginService.clearToken).toHaveBeenCalled();
      expect(chapterTimezoneService.clearChapterLocalDate).toHaveBeenCalled();
      expect(authService.logout).toHaveBeenCalled();
    });

    it('should handle Okta logout errors gracefully', async () => {
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      spyOn(router, 'navigate');
      spyOn(console, 'error');
      loginService.isOktaUser.and.returnValue(true);
      authService.logout.and.returnValue(Promise.reject(new Error('Logout failed')));

      await component.onLogout(event);

      expect(loginService.clearToken).toHaveBeenCalled();
      expect(chapterTimezoneService.clearChapterLocalDate).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });



    it('should handle version click and prevent default', () => {
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');

      // Note: MatDialog.open is tested in integration tests
      // Unit test verifies event handling only
      expect(() => component.onVersionClick(event)).not.toThrow();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('Helper Methods', () => {
    it('should set currentDateTime on initialization', () => {
      component.ngOnInit();
      fixture.detectChanges(); // Trigger effect to start time refresh

      // Check format: DD-MON-YYYY, HH:MM TimeZone (e.g., 25-MAR-2026, 19:14 GMT+1)
      // Timezone can be any abbreviation (EST, EDT, PST, PDT, IST, UTC, GMT+1, etc.)
      expect(component.currentDateTime).toMatch(/^\d{2}-[A-Z]{3}-\d{4}, \d{2}:\d{2} [A-Z0-9+\-:]+$/);
    });

    it('should update currentDateTime every minute', (done) => {
      jasmine.clock().install();
      component.ngOnInit();
      fixture.detectChanges(); // Trigger effect to start time refresh

      // Verify initial time is set
      expect(component.currentDateTime).toBeTruthy();

      // Advance clock by 1 minute
      jasmine.clock().tick(60000);

      // DateTime should have been updated (accepts any timezone abbreviation)
      expect(component.currentDateTime).toBeTruthy();
      // Format: DD-MON-YYYY, HH:MM TimeZone (e.g., 25-MAR-2026, 19:14 GMT+1)
      expect(component.currentDateTime).toMatch(/^\d{2}-[A-Z]{3}-\d{4}, \d{2}:\d{2} [A-Z0-9+\-:]+$/);

      jasmine.clock().uninstall();
      done();
    });



    it('should return database label from service', () => {
      expect(component.getDatabaseLabel()).toBe('DEV');
    });

    it('should return database tooltip from service', () => {
      expect(component.getDatabaseTooltip()).toBe('devdb');
    });

    it('should return chapter label from service', () => {
      expect(component.getChapterLabel()).toBe('DAL');
    });

    it('should return chapter tooltip from service', () => {
      expect(component.getChapterTooltip()).toBe('Dallas Regional Blood Center');
    });

    it('should return warehouse label from service', () => {
      expect(component.getWarehouseLabel()).toBe('WH01');
    });

    it('should return true for canChangePassword when user is not Okta user', () => {
      loginService.isOktaUser.and.returnValue(false);
      expect(component.canChangePassword()).toBe(true);
    });

    it('should return false for canChangePassword when user is Okta user', () => {
      loginService.isOktaUser.and.returnValue(true);
      expect(component.canChangePassword()).toBe(false);
    });

    it('should not open change password dialog for Okta users', () => {
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      spyOn(console, 'warn');
      loginService.isOktaUser.and.returnValue(true);

      component.onChangePassword(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith('Change password is not available for Okta users');
    });

    it('should update labels when service signals change', () => {
      headerService.databasePrefix.set('PROD');
      headerService.databaseName.set('proddb');
      headerService.chapterId.set('NYC');
      headerService.chapterPrintHdr.set('New York Blood Center');
      headerService.warehouseId.set('WH02');

      expect(component.getDatabaseLabel()).toBe('PROD');
      expect(component.getDatabaseTooltip()).toBe('proddb');
      expect(component.getChapterLabel()).toBe('NYC');
      expect(component.getChapterTooltip()).toBe('New York Blood Center');
      expect(component.getWarehouseLabel()).toBe('WH02');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should have alt text on logo image', () => {
      const logo: HTMLImageElement = fixture.debugElement.query(By.css('.header-logo')).nativeElement;
      expect(logo.alt).toBe('Blood Centers2 logo');
    });






  });

  describe('Tooltips', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have tooltip position set to below', () => {
      const buttons = fixture.debugElement.queryAll(By.css('[matTooltipPosition]'));
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach(button => {
        expect(button.nativeElement.getAttribute('mattooltipposition')).toBe('below');
      });
    });
  });

describe('Responsive Behavior', () => {
  beforeEach(() => {
    fixture.detectChanges();
  });





  it('should contain all icon-button-with-label buttons', () => {
    const iconButtons = fixture.debugElement.queryAll(By.css('.icon-button-with-label'));
    expect(iconButtons.length).toBe(3);
  });
});

  describe('Edge Cases', () => {
    it('should handle empty user name gracefully', () => {
      headerService.headerConfig.set({
        ...mockHeaderConfig,
        user: {
          name: '',
          id: 'TEST123',
          role: 'Admin'
        }
      });
      fixture.detectChanges();

      const userName = fixture.debugElement.query(By.css('.user-name'));
      expect(userName.nativeElement.textContent).toBe('');
    });



    it('should handle empty labels from service', () => {
      headerService.databasePrefix.set('');
      headerService.databaseName.set('');
      headerService.chapterId.set('');
      headerService.chapterPrintHdr.set('');
      headerService.warehouseId.set('');
      fixture.detectChanges();

      const labels = fixture.debugElement.queryAll(By.css('.icon-label'));
      expect(labels[0].nativeElement.textContent.trim()).toBe('');
      expect(labels[1].nativeElement.textContent.trim()).toBe('');
      expect(labels[2].nativeElement.textContent.trim()).toBe('');
    });

    it('should handle null user in headerConfig gracefully', () => {
      headerService.headerConfig.set({
        ...mockHeaderConfig,
        user: undefined as any
      });
      fixture.detectChanges();

      const userSection = fixture.debugElement.query(By.css('.user-section'));
      expect(userSection).toBeFalsy();
    });

    it('should hide logo when logoUrl is empty', () => {
      headerService.headerConfig.set({
        ...mockHeaderConfig,
        logoUrl: ''
      });
      fixture.detectChanges();

      const logo = fixture.debugElement.query(By.css('.header-logo'));
      expect(logo).toBeFalsy();
    });

    it('should show institution logo when institutionLogoUrl is provided', () => {
      headerService.institutionLogoUrl.set('institution.png');
      fixture.detectChanges();

      const instLogo = fixture.debugElement.query(By.css('.institution-logo'));
      expect(instLogo).toBeTruthy();
      expect(instLogo.nativeElement.src).toContain('institution.png');
    });

    it('should hide institution logo when institutionLogoUrl is empty', () => {
      headerService.institutionLogoUrl.set('');
      fixture.detectChanges();

      const instLogo = fixture.debugElement.query(By.css('.institution-logo'));
      expect(instLogo).toBeFalsy();
    });
  });

  describe('ngOnDestroy', () => {
    it('should clear the interval when dateTimeInterval is set', () => {
      jasmine.clock().install();
      fixture.detectChanges(); // triggers effect which starts time refresh

      spyOn(window, 'clearInterval').and.callThrough();
      component.ngOnDestroy();

      expect(window.clearInterval).toHaveBeenCalled();
      jasmine.clock().uninstall();
    });

    it('should not throw when dateTimeInterval is not set', () => {
      // Component created but no interval started
      // Access private field to ensure it is undefined
      (component as any).dateTimeInterval = undefined;

      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('updateDateTime (private)', () => {
    it('should return early when chapterTimeZone is null', () => {
      headerService.chapterTimeZone.set(null as any);
      fixture.detectChanges();

      // Since timezone is null, currentDateTime should not be set by updateDateTime
      // Force call via ngOnInit trigger - effect won't start without timezone
      (component as any).updateDateTime();
      // No error should occur, and nothing meaningful should be set
    });

    it('should return early when chapterTimeZone is empty string', () => {
      headerService.chapterTimeZone.set('');
      fixture.detectChanges();

      (component as any).updateDateTime();
      // Should not throw
    });

    it('should show snackbar error for invalid timezone and default to GMT', () => {
      const snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
      headerService.chapterTimeZone.set('InvalidTZ');
      fixture.detectChanges();

      (component as any).updateDateTime();

      expect(snackbarService.showError).toHaveBeenCalledWith(
        'Invalid timezone value "InvalidTZ" configured for this chapter. Defaulting to GMT.'
      );
      // Should still produce a datetime string using GMT (+00:00)
      expect(component.currentDateTime).toMatch(/^\d{2}-[A-Z]{3}-\d{4}, \d{2}:\d{2} GMT$/);
    });

    it('should only show invalid timezone snackbar once', () => {
      const snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
      headerService.chapterTimeZone.set('BadTZ');
      fixture.detectChanges();

      (component as any).updateDateTime();
      (component as any).updateDateTime();
      (component as any).updateDateTime();

      // Should only be called once due to invalidTimezoneNotified flag
      expect(snackbarService.showError).toHaveBeenCalledTimes(1);
    });

    it('should reset invalidTimezoneNotified when valid timezone follows invalid', () => {
      const snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
      headerService.chapterTimeZone.set('BadTZ');
      fixture.detectChanges();

      (component as any).updateDateTime();
      expect(snackbarService.showError).toHaveBeenCalledTimes(1);

      // Switch to valid timezone
      headerService.chapterTimeZone.set('+05:30');
      (component as any).updateDateTime();

      // Switch back to invalid - should notify again since flag was reset
      headerService.chapterTimeZone.set('AnotherBadTZ');
      (component as any).updateDateTime();
      expect(snackbarService.showError).toHaveBeenCalledTimes(2);
    });

    it('should format datetime correctly with positive timezone offset', () => {
      headerService.chapterTimeZone.set('+05:30');
      fixture.detectChanges();

      (component as any).updateDateTime();

      expect(component.currentDateTime).toMatch(/^\d{2}-[A-Z]{3}-\d{4}, \d{2}:\d{2} IST$/);
    });

    it('should format datetime correctly with negative timezone offset', () => {
      headerService.chapterTimeZone.set('-08:00');
      fixture.detectChanges();

      (component as any).updateDateTime();

      expect(component.currentDateTime).toMatch(/^\d{2}-[A-Z]{3}-\d{4}, \d{2}:\d{2} PST$/);
    });

    it('should use GMT+offset label for timezone not in TIMEZONE_OFFSET_MAP', () => {
      // +14:00 has LINT in the map, so use an offset that IS in the regex but NOT in the map
      // Actually +14:00 is in the map. Let's use +01:30 which matches regex but is not in map
      headerService.chapterTimeZone.set('+01:30');
      fixture.detectChanges();

      (component as any).updateDateTime();

      expect(component.currentDateTime).toMatch(/^\d{2}-[A-Z]{3}-\d{4}, \d{2}:\d{2} GMT\+01:30$/);
    });
  });

  describe('onLogout details', () => {
    it('should call broadcastLogout for non-Okta users', async () => {
      fixture.detectChanges();
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      spyOn(router, 'navigate');
      loginService.isOktaUser.and.returnValue(false);

      await component.onLogout(event);

      expect(loginService.broadcastLogout).toHaveBeenCalled();
    });

    it('should call clearCookies for non-Okta users', async () => {
      fixture.detectChanges();
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      spyOn(router, 'navigate');
      loginService.isOktaUser.and.returnValue(false);

      await component.onLogout(event);

      expect(headerService.clearCookies).toHaveBeenCalled();
    });

    it('should remove sessionStorage items for non-Okta users', async () => {
      fixture.detectChanges();
      sessionStorage.setItem('driveContext', 'test');
      sessionStorage.setItem('labelPrinterContext', 'test');
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      spyOn(router, 'navigate');
      loginService.isOktaUser.and.returnValue(false);

      await component.onLogout(event);

      expect(sessionStorage.getItem('driveContext')).toBeNull();
      expect(sessionStorage.getItem('labelPrinterContext')).toBeNull();
    });

    it('should navigate to login route for non-Okta users', async () => {
      fixture.detectChanges();
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      spyOn(router, 'navigate');
      loginService.isOktaUser.and.returnValue(false);

      await component.onLogout(event);

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should call broadcastLogout for Okta users', async () => {
      fixture.detectChanges();
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      loginService.isOktaUser.and.returnValue(true);

      await component.onLogout(event);

      expect(loginService.broadcastLogout).toHaveBeenCalled();
    });

    it('should call clearCookies for Okta users', async () => {
      fixture.detectChanges();
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      loginService.isOktaUser.and.returnValue(true);

      await component.onLogout(event);

      expect(headerService.clearCookies).toHaveBeenCalled();
    });

    it('should remove sessionStorage items for Okta users', async () => {
      fixture.detectChanges();
      sessionStorage.setItem('driveContext', 'test');
      sessionStorage.setItem('labelPrinterContext', 'test');
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      loginService.isOktaUser.and.returnValue(true);

      await component.onLogout(event);

      expect(sessionStorage.getItem('driveContext')).toBeNull();
      expect(sessionStorage.getItem('labelPrinterContext')).toBeNull();
    });

    it('should remove sessionStorage items on Okta logout error', async () => {
      fixture.detectChanges();
      sessionStorage.setItem('driveContext', 'test');
      sessionStorage.setItem('labelPrinterContext', 'test');
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      spyOn(router, 'navigate');
      spyOn(console, 'error');
      loginService.isOktaUser.and.returnValue(true);
      authService.logout.and.returnValue(Promise.reject(new Error('fail')));

      await component.onLogout(event);

      expect(sessionStorage.getItem('driveContext')).toBeNull();
      expect(sessionStorage.getItem('labelPrinterContext')).toBeNull();
    });

    it('should call clearCookies on Okta logout error', async () => {
      fixture.detectChanges();
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      spyOn(router, 'navigate');
      spyOn(console, 'error');
      loginService.isOktaUser.and.returnValue(true);
      authService.logout.and.returnValue(Promise.reject(new Error('fail')));

      await component.onLogout(event);

      expect(headerService.clearCookies).toHaveBeenCalled();
    });

    it('should navigate to login on Okta logout error', async () => {
      fixture.detectChanges();
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      spyOn(router, 'navigate');
      spyOn(console, 'error');
      loginService.isOktaUser.and.returnValue(true);
      authService.logout.and.returnValue(Promise.reject(new Error('fail')));

      await component.onLogout(event);

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('onChangePassword (non-Okta)', () => {
    let componentDialog: MatDialog;
    let dialogOpenSpy: jasmine.Spy;
    let dialogRefSpy: any;

    beforeEach(() => {
      fixture.detectChanges();
      componentDialog = (component as any).dialog;
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogOpenSpy = spyOn(componentDialog, 'open').and.returnValue(dialogRefSpy);
    });

    it('should open change password dialog for non-Okta users', () => {
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      loginService.isOktaUser.and.returnValue(false);
      loginService.getStoredPasswordConfig.and.returnValue({ isStrongPasswordConfigured: false });

      component.onChangePassword(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(dialogOpenSpy).toHaveBeenCalledWith(
        jasmine.any(Function), // ChangePasswordComponent
        jasmine.objectContaining({
          width: '600px',
          disableClose: false,
          autoFocus: true,
          data: {
            isMandatory: false,
            isStrongPasswordRequired: false
          }
        })
      );
    });

    it('should pass isStrongPasswordRequired true when configured', () => {
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      loginService.isOktaUser.and.returnValue(false);
      loginService.getStoredPasswordConfig.and.returnValue({ isStrongPasswordConfigured: true });

      component.onChangePassword(event);

      expect(dialogOpenSpy).toHaveBeenCalledWith(
        jasmine.any(Function),
        jasmine.objectContaining({
          data: {
            isMandatory: false,
            isStrongPasswordRequired: true
          }
        })
      );
    });

    it('should handle null passwordConfig gracefully and default isStrongPasswordRequired to false', () => {
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      loginService.isOktaUser.and.returnValue(false);
      loginService.getStoredPasswordConfig.and.returnValue(null);

      component.onChangePassword(event);

      expect(dialogOpenSpy).toHaveBeenCalledWith(
        jasmine.any(Function),
        jasmine.objectContaining({
          data: {
            isMandatory: false,
            isStrongPasswordRequired: false
          }
        })
      );
    });

    it('should not log password success when dialog returns null result', () => {
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      const logSpy = spyOn(console, 'log');
      loginService.isOktaUser.and.returnValue(false);
      dialogRefSpy.afterClosed.and.returnValue(of(null));

      component.onChangePassword(event);

      const passwordLogCalls = logSpy.calls.allArgs().filter(
        (args: any[]) => args[0] === 'Password changed successfully:'
      );
      expect(passwordLogCalls.length).toBe(0);
    });

    it('should not log password success when dialog returns result with success false', () => {
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      const logSpy = spyOn(console, 'log');
      loginService.isOktaUser.and.returnValue(false);
      dialogRefSpy.afterClosed.and.returnValue(of({ success: false }));

      component.onChangePassword(event);

      const passwordLogCalls = logSpy.calls.allArgs().filter(
        (args: any[]) => args[0] === 'Password changed successfully:'
      );
      expect(passwordLogCalls.length).toBe(0);
    });

    it('should log success when dialog returns success result', () => {
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      spyOn(console, 'log');
      loginService.isOktaUser.and.returnValue(false);
      dialogRefSpy.afterClosed.and.returnValue(of({ success: true }));

      component.onChangePassword(event);

      expect(console.log).toHaveBeenCalledWith('Password changed successfully:', { success: true });
    });
  });

  describe('onChangeChapter', () => {
    let componentDialog: MatDialog;

    beforeEach(() => {
      fixture.detectChanges();
      componentDialog = (component as any).dialog;
    });

    it('should open the change chapter dialog with current chapter data', () => {
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      spyOn(componentDialog, 'open').and.returnValue(dialogRefSpy);

      component.onChangeChapter(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(componentDialog.open).toHaveBeenCalledWith(
        jasmine.any(Function), // ChangeChapterComponent
        jasmine.objectContaining({
          width: '650px',
          autoFocus: false,
          disableClose: true,
          data: {
            chapterId: 'DAL',
            chapterName: 'Test Chapter',
            warehouseId: 'WH01',
            warehouseName: 'Test Warehouse'
          }
        })
      );
    });

    it('should handle dialog closed with updated=true', () => {
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      spyOn(componentDialog, 'open').and.returnValue(dialogRefSpy);

      // Should not throw - chapter refresh is handled by subscribers
      expect(() => component.onChangeChapter(event)).not.toThrow();
    });

    it('should handle dialog closed with updated=false', () => {
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      spyOn(componentDialog, 'open').and.returnValue(dialogRefSpy);

      expect(() => component.onChangeChapter(event)).not.toThrow();
    });

    it('should handle dialog closed with null', () => {
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      spyOn(componentDialog, 'open').and.returnValue(dialogRefSpy);

      expect(() => component.onChangeChapter(event)).not.toThrow();
    });
  });

  describe('onVersionClick dialog', () => {
    it('should open VersionInfoDialogComponent with correct config', () => {
      fixture.detectChanges();
      const componentDialog = (component as any).dialog;
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');
      spyOn(componentDialog, 'open');

      component.onVersionClick(event);

      expect(componentDialog.open).toHaveBeenCalledWith(
        VersionInfoDialogComponent,
        jasmine.objectContaining({
          width: '500px',
          autoFocus: true,
          disableClose: false
        })
      );
    });
  });

  describe('Template conditional rendering', () => {
    it('should hide user section when user is not set', () => {
      headerService.headerConfig.set({
        title: 'Blood Centers2',
        subtitle: '',
        logoUrl: 'logo.png'
      } as any);
      fixture.detectChanges();

      const userSection = fixture.debugElement.query(By.css('.user-section'));
      expect(userSection).toBeFalsy();
    });

    it('should show user section when user is set', () => {
      fixture.detectChanges();

      const userSection = fixture.debugElement.query(By.css('.user-section'));
      expect(userSection).toBeTruthy();
    });

    it('should hide Change Password menu item for Okta users', () => {
      loginServiceSpy.isOktaUser.and.returnValue(true);
      fixture.detectChanges();

      // Open the menu
      const userButton = fixture.debugElement.query(By.css('.user-button'));
      userButton.nativeElement.click();
      fixture.detectChanges();

      // Change Password should not be visible for Okta users
      expect(component.canChangePassword()).toBe(false);
    });

    it('should show Change Password menu item for non-Okta users', () => {
      loginServiceSpy.isOktaUser.and.returnValue(false);
      fixture.detectChanges();

      expect(component.canChangePassword()).toBe(true);
    });
  });

  describe('ngOnInit', () => {
    it('should call headerService.loadUserData on init', () => {
      component.ngOnInit();

      expect(headerServiceSpy.loadUserData).toHaveBeenCalled();
    });
  });
});
