import { Component, signal, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ChapterTimezoneService } from './shared/services/chapter-timezone.service';
import { DateFieldValidationUtility } from './shared/components/DateFieldUtility/date-field-validation.utility';
import { LoginService } from './shared/services/login.service';
import { HeaderService } from './shared/services/header.service';
import { ROUTES } from './core/constants/route.constants';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private translate = inject(TranslateService);
  private chapterTimezoneService = inject(ChapterTimezoneService);
  private loginService = inject(LoginService);
  private headerService = inject(HeaderService);
  private router = inject(Router);
  protected readonly title = signal('blood-center-app');

  constructor() {
    this.translate.setDefaultLang('en');
    this.translate.use('en');

    // Initialize DateFieldValidationUtility with ChapterTimezoneService
    // This allows all date validators to use chapter local date
    DateFieldValidationUtility.setChapterTimezoneService(this.chapterTimezoneService);

    // Clear chunk reload flag on successful app initialization
    // This ensures the auto-reload mechanism works properly for future chunk errors
    sessionStorage.removeItem('chunk-load-error-reload');

    this.loginService.listenForCrossTabLogout(() => {
      this.loginService.clearToken();
      this.headerService.clearSession();
      this.chapterTimezoneService.clearChapterLocalDate();
      this.router.navigate([ROUTES.AUTH.LOGIN]);
    });
  }
}
