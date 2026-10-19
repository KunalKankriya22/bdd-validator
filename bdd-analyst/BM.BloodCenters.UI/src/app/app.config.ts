import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  importProvidersFrom,
  ErrorHandler,
  Injector
} from '@angular/core';

import { provideRouter } from '@angular/router';
import { OKTA_AUTH, OKTA_CONFIG } from '@okta/okta-angular';
import { OktaAuth } from '@okta/okta-auth-js';
import { environment } from '../environments/environment';

const oktaAuthInstance = new OktaAuth({
  ...environment.okta,
  tokenManager: {
    storage: 'sessionStorage'
  }
});
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';

import { TranslateModule } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/authInterceptor.interceptor';
import { devTransferMockInterceptor } from './interceptors/dev-transfer-mock.interceptor';
import { globalErrorHandlerFactory } from './interceptors/global-error-handler-factory';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideNativeDateAdapter(),
    provideHttpClient(withInterceptors([
      ...(environment.production ? [] : [devTransferMockInterceptor]),
      authInterceptor,
    ])),
    // Provide OktaAuth instance and the Okta config for okta-angular
    { provide: OKTA_AUTH, useValue: oktaAuthInstance },
    { provide: OKTA_CONFIG, useValue: environment.okta },
    {
      provide: ErrorHandler,
      useFactory: globalErrorHandlerFactory ,
      deps: [Injector]
    },
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'en'
      })
    ),
      provideTranslateHttpLoader({
      prefix: 'assets/',
      suffix: '.json'
    })
  ]
};
  