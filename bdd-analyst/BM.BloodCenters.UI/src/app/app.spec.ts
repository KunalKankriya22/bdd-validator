import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter } from '@angular/router';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { LoginService } from './shared/services/login.service';
import { HeaderService } from './shared/services/header.service';
import { RestrictionService } from './shared/services/restriction.service';
import { AccessLevelService } from './shared/services/access-level.service';

class MockTranslateLoader implements TranslateLoader {
  getTranslation(lang: string) {
    return of({
      AUTH: {
        FOOTER: {
          SUPPORT_TITLE: 'Blood Centers Support',
          PHONE_LABEL: 'Phone Support:',
          PHONE_NUMBER: '877-399-6538',
          HOURS: 'Mon—Fri • 7:00 AM—7:00 PM (CST)',
          COPYRIGHT: 'Copyright © 2025 WellSky. All rights reserved.',
          VERSION: '({{version}})'
        }
      }
    });
  }
}

describe('App', () => {
  beforeEach(async () => {
    const loginServiceSpy = jasmine.createSpyObj('LoginService', [
      'clearToken', 'listenForCrossTabLogout', 'broadcastLogout'
    ]);
    const headerServiceSpy = jasmine.createSpyObj('HeaderService', ['clearCookies']);
    const restrictionServiceSpy = jasmine.createSpyObj('RestrictionService', [
      'setOktaRestrictionActive',
      'isOktaRestricted',
      'clearOktaRestriction',
      'setAccessDeniedActive',
      'isAccessDenied',
      'clearAccessDenied',
      'clearAllRestrictions'
    ]);
    const accessLevelServiceSpy = jasmine.createSpyObj('AccessLevelService', ['clear']);

    await TestBed.configureTestingModule({
      imports: [
        App,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: MockTranslateLoader }
        })
      ],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: RestrictionService, useValue: restrictionServiceSpy },
        { provide: AccessLevelService, useValue: accessLevelServiceSpy },
      ]
    }).compileComponents();

    const translateService = TestBed.inject(TranslateService);
    translateService.use('en');
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render router outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
