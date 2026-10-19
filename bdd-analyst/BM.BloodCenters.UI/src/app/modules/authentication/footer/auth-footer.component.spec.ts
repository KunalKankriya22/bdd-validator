import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { AuthFooterComponent } from './auth-footer.component';
import { of } from 'rxjs';

// Mock translation loader
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

describe('AuthFooterComponent', () => {
  let component: AuthFooterComponent;
  let fixture: ComponentFixture<AuthFooterComponent>;
  let translateService: TranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AuthFooterComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: MockTranslateLoader }
        })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthFooterComponent);
    component = fixture.componentInstance;
    translateService = TestBed.inject(TranslateService);
    translateService.use('en');
    fixture.detectChanges();
  });

  it('should display support information', fakeAsync(() => {
    translateService.use('en');
    tick();
    fixture.detectChanges();
    tick(100);
    
    const compiled = fixture.nativeElement as HTMLElement;
    const footerText = compiled.textContent || '';
    expect(footerText).toContain('Blood Centers Support');
  }));

  it('should display phone number', fakeAsync(() => {
    translateService.use('en');
    tick();
    fixture.detectChanges();
    tick(100);
    
    const compiled = fixture.nativeElement as HTMLElement;
    const phoneElement = compiled.textContent;
    expect(phoneElement).toContain('877-399-6538');
  }));

  it('should display support hours', fakeAsync(() => {
    translateService.use('en');
    tick();
    fixture.detectChanges();
    tick(100);
    
    const compiled = fixture.nativeElement as HTMLElement;
    const hoursElement = compiled.textContent;
    expect(hoursElement).toContain('Mon—Fri');
    expect(hoursElement).toContain('7:00 AM—7:00 PM');
  }));

  it('should display copyright information', fakeAsync(() => {
    translateService.use('en');
    tick();
    fixture.detectChanges();
    tick(100);
    
    const compiled = fixture.nativeElement as HTMLElement;
    const copyrightElement = compiled.textContent;
    expect(copyrightElement).toContain('2025');
    expect(copyrightElement).toContain('WellSky');
  }));
});
