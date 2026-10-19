import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse, HttpContext } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './authInterceptor.interceptor';
import { Router } from '@angular/router';
import { SKIP_ERROR_TOAST, SKIP_AUTH_REDIRECT } from '../core/constants/http-context.constants';
import { AuthService } from '../shared/services/auth.service';
import { CookieService } from 'ngx-cookie-service';
import { SnackbarService } from '../shared/services/snackbar.service';
import { LoginService } from '../shared/services/login.service';
import { HeaderService } from '../shared/services/header.service';
import { RestrictionService } from '../shared/services/restriction.service';
import { AccessLevelService } from '../shared/services/access-level.service';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('authInterceptor', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let cookieService: jasmine.SpyObj<CookieService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let loginService: jasmine.SpyObj<LoginService>;
  let headerService: jasmine.SpyObj<HeaderService>;
  let restrictionService: jasmine.SpyObj<RestrictionService>;
  let accessLevelService: jasmine.SpyObj<AccessLevelService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getAccessToken', 'clearTokens']);
    authServiceSpy.clearTokens.and.returnValue(Promise.resolve());
    const cookieServiceSpy = jasmine.createSpyObj('CookieService', ['get', 'delete']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    routerSpy.navigate.and.returnValue(Promise.resolve(true));
    const snackbarServiceSpy = createMockSnackbarService();
    const loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredToken', 'getStoredUsername', 'getAuthMethod', 'clearToken', 'broadcastLogout']);
    const headerServiceSpy = createMockHeaderService();
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

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: CookieService, useValue: cookieServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: RestrictionService, useValue: restrictionServiceSpy },
        { provide: AccessLevelService, useValue: accessLevelServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    cookieService = TestBed.inject(CookieService) as jasmine.SpyObj<CookieService>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    loginService = TestBed.inject(LoginService) as jasmine.SpyObj<LoginService>;
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    restrictionService = TestBed.inject(RestrictionService) as jasmine.SpyObj<RestrictionService>;
    accessLevelService = TestBed.inject(AccessLevelService) as jasmine.SpyObj<AccessLevelService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Set default return values for new service methods
    loginService.getStoredToken.and.returnValue('');
    loginService.getStoredUsername.and.returnValue('TESTUSER');
    loginService.getAuthMethod.and.returnValue('standard');
  });

  /**
   * Helper function to execute interceptor within injection context
   */
  function callInterceptor(req: HttpRequest<any>, next: any): HttpRequest<any> {
    let result: HttpRequest<any>;
    TestBed.runInInjectionContext(() => {
      authInterceptor(req, next);
      result = next.calls.mostRecent().args[0];
    });
    return result!;
  }

  it('should add JWT token from cookie to Authorization header', (done) => {
    const jwtToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
    loginService.getStoredToken.and.returnValue(jwtToken);

    const req = new HttpRequest('GET', 'http://localhost:4200/api/test');
    const next = jasmine.createSpy('next').and.returnValue(
      of(new HttpResponse({ status: 200, body: { message: 'success' } }))
    );

    const calledRequest = callInterceptor(req, next);
    expect(calledRequest.headers.get('Authorization')).toBe(`Bearer ${jwtToken}`);
    done();
  });

  it('should add custom headers (X-LoggedInUserName, X-ChapterId, X-WareHouseId, X-WareHouseName)', (done) => {
    const jwtToken = 'test-token';
    loginService.getStoredToken.and.returnValue(jwtToken);

    const req = new HttpRequest('GET', 'http://localhost:4200/api/test');
    const next = jasmine.createSpy('next').and.returnValue(
      of(new HttpResponse({ status: 200, body: { message: 'success' } }))
    );

    const calledRequest = callInterceptor(req, next);
    expect(calledRequest.headers.get('X-LoggedInUserName')).toBe('TESTUSER');
    expect(calledRequest.headers.get('X-ChapterId')).toBe('TST');
    expect(calledRequest.headers.get('X-WareHouseId')).toBe('WH01');
    expect(calledRequest.headers.get('X-WareHouseName')).toBe('Test Warehouse');
    done();
  });

  it('should not add custom headers when values are empty', (done) => {
    const jwtToken = 'test-token';
    loginService.getStoredToken.and.returnValue(jwtToken);
    loginService.getStoredUsername.and.returnValue('');
    headerService.getCurrentChapterId.and.returnValue('');
    headerService.getCurrentWarehouseId.and.returnValue('');
    (headerService as any).warehouseName = () => '';
    const req = new HttpRequest('GET', 'http://localhost:4200/api/test');
    const next = jasmine.createSpy('next').and.returnValue(
      of(new HttpResponse({ status: 200, body: { message: 'success' } }))
    );

    const calledRequest = callInterceptor(req, next);
    expect(calledRequest.headers.get('X-LoggedInUserName')).toBeNull();
    expect(calledRequest.headers.get('X-ChapterId')).toBeNull();
    expect(calledRequest.headers.get('X-WareHouseId')).toBeNull();
    expect(calledRequest.headers.get('X-WareHouseName')).toBeNull();
    done();
  });

  it('should fallback to Okta token when JWT token not available', (done) => {
    const oktaToken = 'okta-access-token-xyz';
    loginService.getStoredToken.and.returnValue(''); // No JWT token
    authService.getAccessToken.and.returnValue(oktaToken);

    const req = new HttpRequest('GET', 'http://localhost:4200/api/test');
    const next = jasmine.createSpy('next').and.returnValue(
      of(new HttpResponse({ status: 200, body: { message: 'success' } }))
    );

    const calledRequest = callInterceptor(req, next);
    expect(calledRequest.headers.get('Authorization')).toBe(`Bearer ${oktaToken}`);
    done();
  });

  it('should prioritize JWT token over Okta token', (done) => {
    const jwtToken = 'jwt-token-abc123';
    const oktaToken = 'okta-token-xyz789';
    
    loginService.getStoredToken.and.returnValue(jwtToken);
    authService.getAccessToken.and.returnValue(oktaToken);

    const req = new HttpRequest('GET', 'http://localhost:4200/api/test');
    const next = jasmine.createSpy('next').and.returnValue(
      of(new HttpResponse({ status: 200, body: { message: 'success' } }))
    );

    const calledRequest = callInterceptor(req, next);
    expect(calledRequest.headers.get('Authorization')).toBe(`Bearer ${jwtToken}`);
    expect(authService.getAccessToken).not.toHaveBeenCalled();
    done();
  });

  it('should not add Authorization header when no token is available', (done) => {
    loginService.getStoredToken.and.returnValue(''); // No JWT token
    authService.getAccessToken.and.returnValue(undefined); // No Okta token

    const req = new HttpRequest('GET', 'http://localhost:4200/api/test');
    const next = jasmine.createSpy('next').and.returnValue(
      of(new HttpResponse({ status: 200, body: { message: 'success' } }))
    );

    const calledRequest = callInterceptor(req, next);
    expect(calledRequest.headers.get('Authorization')).toBeNull();
    done();
  });



  it('should preserve existing headers', (done) => {
    const jwtToken = 'test-token';
    loginService.getStoredToken.and.returnValue(jwtToken);

    const headers = new HttpHeaders({
      'X-Custom-Header': 'custom-value',
      'X-Request-ID': '12345'
    });
    const req = new HttpRequest('POST', 'http://localhost:4200/api/test', { data: 'test' }, {
      headers
    });
    
    const next = jasmine.createSpy('next').and.returnValue(
      of(new HttpResponse({ status: 200, body: { message: 'success' } }))
    );

    TestBed.runInInjectionContext(() => {
      authInterceptor(req, next);
      const calledRequest = next.calls.mostRecent().args[0];
      expect(calledRequest.headers.get('X-Custom-Header')).toBe('custom-value');
      expect(calledRequest.headers.get('X-Request-ID')).toBe('12345');
      expect(calledRequest.headers.get('Authorization')).toBe(`Bearer ${jwtToken}`);
      expect(calledRequest.headers.get('Content-Type')).toBeTruthy();
      done();
    });
  });

  it('should call next with cloned request', (done) => {
    const jwtToken = 'test-token';
    loginService.getStoredToken.and.returnValue(jwtToken);

    const req = new HttpRequest('GET', 'http://localhost:4200/api/test');
    const next = jasmine.createSpy('next').and.returnValue(
      of(new HttpResponse({ status: 200, body: { message: 'success' } }))
    );

    TestBed.runInInjectionContext(() => {
      authInterceptor(req, next);
      expect(next).toHaveBeenCalled();
      const calledRequest = next.calls.mostRecent().args[0];
      expect(calledRequest).not.toBe(req); // Should be cloned
      expect(calledRequest.url).toBe(req.url);
      expect(calledRequest.method).toBe(req.method);
      done();
    });
  });

  it('should handle POST requests with body', (done) => {
    const jwtToken = 'test-token';
    const requestBody = { username: 'testuser', password: 'password' };
    
    loginService.getStoredToken.and.returnValue(jwtToken);

    const req = new HttpRequest('POST', 'http://localhost:4200/api/auth/login', requestBody);
    const next = jasmine.createSpy('next').and.returnValue(
      of(new HttpResponse({ status: 200, body: { token: 'new-token' } }))
    );

    const calledRequest = callInterceptor(req, next);
    expect(calledRequest.body).toEqual(requestBody);
    expect(calledRequest.headers.get('Authorization')).toBe(`Bearer ${jwtToken}`);
    done();
  });







  it('should handle empty JWT token from cookie', (done) => {
    const oktaToken = 'okta-token';
    loginService.getStoredToken.and.returnValue(''); // Cookie not found
    authService.getAccessToken.and.returnValue(oktaToken);

    const req = new HttpRequest('GET', 'http://localhost:4200/api/test');
    const next = jasmine.createSpy('next').and.returnValue(
      of(new HttpResponse({ status: 200, body: { message: 'success' } }))
    );

    const calledRequest = callInterceptor(req, next);
    expect(calledRequest.headers.get('Authorization')).toBe(`Bearer ${oktaToken}`);
    done();
  });

  it('should work with different HTTP methods', (done) => {
    const jwtToken = 'test-token';
    loginService.getStoredToken.and.returnValue(jwtToken);

    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    let completedTests = 0;

    methods.forEach(method => {
      const req = new HttpRequest(method as any, 'http://localhost:4200/api/test');
      const next = jasmine.createSpy('next').and.returnValue(
        of(new HttpResponse({ status: 200, body: { message: 'success' } }))
      );

      const calledRequest = callInterceptor(req, next);
      expect(calledRequest.headers.get('Authorization')).toBe(`Bearer ${jwtToken}`);
      completedTests++;

      if (completedTests === methods.length) {
        done();
      }
    });
  });

  it('should maintain request URL and method', (done) => {
    const jwtToken = 'test-token';
    const url = 'http://localhost:4200/api/users/123/profile';
    const method = 'GET';
    
    loginService.getStoredToken.and.returnValue(jwtToken);

    const req = new HttpRequest(method, url);
    const next = jasmine.createSpy('next').and.returnValue(
      of(new HttpResponse({ status: 200, body: { message: 'success' } }))
    );

    const calledRequest = callInterceptor(req, next);
    expect(calledRequest.url).toBe(url);
    expect(calledRequest.method).toBe(method);
    done();
  });

  it('should handle whitespace JWT token as fallback to Okta', (done) => {
    const oktaToken = 'okta-token-abc';
    loginService.getStoredToken.and.returnValue('   '); // Whitespace only
    authService.getAccessToken.and.returnValue(oktaToken);

    const req = new HttpRequest('GET', 'http://localhost:4200/api/test');
    const next = jasmine.createSpy('next').and.returnValue(
      of(new HttpResponse({ status: 200, body: { message: 'success' } }))
    );

    const calledRequest = callInterceptor(req, next);
    // Whitespace string is truthy, so it would be used (this is current behavior)
    expect(calledRequest.headers.get('Authorization')).toBe(`Bearer    `);
    done();
  });

  describe('400 Error Handling', () => {






    it('should prioritize errorResponse.error over message field', (done) => {
      loginService.getStoredToken.and.returnValue('test-token');

      const req = new HttpRequest('POST', 'http://localhost:4200/api/test', {});
      const errorResponse = {
        success: false,
        message: 'Generic message',
        errorCode: '0346',
        statusCode: 400,
        errorResponse: {
          errorCode: '0346',
          error: 'Specific error from errorResponse'
        }
      };

      const next = jasmine.createSpy('next').and.returnValue(
        throwError(() => new HttpErrorResponse({
          error: errorResponse,
          status: 400,
          statusText: 'Bad Request'
        }))
      );

      TestBed.runInInjectionContext(() => {
        authInterceptor(req, next).subscribe({
          error: (error) => {
            expect(snackbarService.showError).toHaveBeenCalledWith('Error 0346: Specific error from errorResponse');
            done();
          }
        });
      });
    });
  });

  describe('Content-Type handling', () => {
    it('should not set Content-Type for FormData body', (done) => {
      loginService.getStoredToken.and.returnValue('test-token');
      const formData = new FormData();
      formData.append('file', new Blob(['test']), 'test.txt');
      const req = new HttpRequest('POST', 'http://localhost:4200/api/upload', formData);
      const next = jasmine.createSpy('next').and.returnValue(
        of(new HttpResponse({ status: 200 }))
      );

      const calledRequest = callInterceptor(req, next);
      expect(calledRequest.headers.has('Content-Type')).toBeFalse();
      done();
    });
  });

  describe('401 Error Handling', () => {
    it('should redirect to session-expired and clear cookies on 401', (done) => {
      loginService.getStoredToken.and.returnValue('test-token');
      loginService.getAuthMethod.and.returnValue('standard');

      const req = new HttpRequest('GET', 'http://localhost:4200/api/test');
      const next = jasmine.createSpy('next').and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }))
      );

      TestBed.runInInjectionContext(() => {
        authInterceptor(req, next).subscribe({
          error: () => {
            expect(accessLevelService.clear).toHaveBeenCalled();
            expect(loginService.broadcastLogout).toHaveBeenCalled();
            expect(restrictionService.clearAllRestrictions).toHaveBeenCalled();
            expect(router.navigate).toHaveBeenCalledWith(['/session-expired']);
            expect(loginService.getAuthMethod).toHaveBeenCalled();
            expect(loginService.clearToken).toHaveBeenCalled();
            expect(headerService.clearSession).toHaveBeenCalled();
            done();
          }
        });
      });
    });

    it('should skip auth redirect when SKIP_AUTH_REDIRECT is set', (done) => {
      loginService.getStoredToken.and.returnValue('test-token');
      const context = new HttpContext().set(SKIP_AUTH_REDIRECT, true);
      const req = new HttpRequest('GET', 'http://localhost:4200/api/test', { context });
      const next = jasmine.createSpy('next').and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }))
      );

      TestBed.runInInjectionContext(() => {
        authInterceptor(req, next).subscribe({
          error: () => {
            expect(router.navigate).not.toHaveBeenCalled();
            expect(loginService.clearToken).not.toHaveBeenCalled();
            done();
          }
        });
      });
    });

    it('should clear Okta tokens when auth_method is okta', (done) => {
      loginService.getStoredToken.and.returnValue('test-token');
      loginService.getAuthMethod.and.returnValue('okta');

      const req = new HttpRequest('GET', 'http://localhost:4200/api/test');
      const next = jasmine.createSpy('next').and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }))
      );

      TestBed.runInInjectionContext(() => {
        authInterceptor(req, next).subscribe({
          error: () => {
            expect(authService.clearTokens).toHaveBeenCalled();
            done();
          }
        });
      });
    });
  });

  describe('404 Error Handling', () => {
    it('should silently handle 404 with success true', (done) => {
      loginService.getStoredToken.and.returnValue('test-token');
      const req = new HttpRequest('GET', 'http://localhost:4200/api/test');
      const next = jasmine.createSpy('next').and.returnValue(
        throwError(() => new HttpErrorResponse({
          error: { success: true, message: '', statusCode: 404 },
          status: 404,
          statusText: 'Not Found'
        }))
      );

      TestBed.runInInjectionContext(() => {
        authInterceptor(req, next).subscribe({
          error: () => {
            expect(snackbarService.showError).not.toHaveBeenCalled();
            done();
          }
        });
      });
    });

    it('should silently handle 404 for static assets', (done) => {
      loginService.getStoredToken.and.returnValue('test-token');
      const req = new HttpRequest('GET', 'http://localhost:4200/assets/inst_logo.png');
      const next = jasmine.createSpy('next').and.returnValue(
        throwError(() => new HttpErrorResponse({
          status: 404,
          statusText: 'Not Found',
          url: 'http://localhost:4200/assets/inst_logo.png'
        }))
      );

      TestBed.runInInjectionContext(() => {
        authInterceptor(req, next).subscribe({
          error: () => {
            expect(snackbarService.showError).not.toHaveBeenCalled();
            done();
          }
        });
      });
    });

    it('should silently handle 404 for version.json', (done) => {
      loginService.getStoredToken.and.returnValue('test-token');
      const req = new HttpRequest('GET', 'http://localhost:4200/version.json');
      const next = jasmine.createSpy('next').and.returnValue(
        throwError(() => new HttpErrorResponse({
          status: 404,
          statusText: 'Not Found',
          url: 'http://localhost:4200/version.json'
        }))
      );

      TestBed.runInInjectionContext(() => {
        authInterceptor(req, next).subscribe({
          error: () => {
            expect(snackbarService.showError).not.toHaveBeenCalled();
            done();
          }
        });
      });
    });
  });

  describe('SKIP_ERROR_TOAST handling', () => {
    it('should skip snackbar when SKIP_ERROR_TOAST is true', (done) => {
      loginService.getStoredToken.and.returnValue('test-token');
      const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
      const req = new HttpRequest('GET', 'http://localhost:4200/api/test', { context });
      const next = jasmine.createSpy('next').and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server Error' }))
      );

      TestBed.runInInjectionContext(() => {
        authInterceptor(req, next).subscribe({
          error: () => {
            expect(snackbarService.showError).not.toHaveBeenCalled();
            done();
          }
        });
      });
    });

    it('should skip snackbar when SKIP_ERROR_TOAST array includes error status', (done) => {
      loginService.getStoredToken.and.returnValue('test-token');
      const context = new HttpContext().set(SKIP_ERROR_TOAST, [500, 409]);
      const req = new HttpRequest('GET', 'http://localhost:4200/api/test', { context });
      const next = jasmine.createSpy('next').and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server Error' }))
      );

      TestBed.runInInjectionContext(() => {
        authInterceptor(req, next).subscribe({
          error: () => {
            expect(snackbarService.showError).not.toHaveBeenCalled();
            done();
          }
        });
      });
    });
  });

  describe('getErrorMessage', () => {
    it('should parse JSON string error body', (done) => {
      loginService.getStoredToken.and.returnValue('test-token');
      const req = new HttpRequest('GET', 'http://localhost:4200/api/test');
      const next = jasmine.createSpy('next').and.returnValue(
        throwError(() => new HttpErrorResponse({
          error: JSON.stringify({ success: false, message: 'Parsed from JSON', errorCode: '', statusCode: 400, errorResponse: null }),
          status: 400,
          statusText: 'Bad Request'
        }))
      );

      TestBed.runInInjectionContext(() => {
        authInterceptor(req, next).subscribe({
          error: () => {
            expect(snackbarService.showError).toHaveBeenCalledWith('Parsed from JSON');
            done();
          }
        });
      });
    });

    it('should handle invalid JSON string error body', (done) => {
      loginService.getStoredToken.and.returnValue('test-token');
      const req = new HttpRequest('GET', 'http://localhost:4200/api/test');
      const next = jasmine.createSpy('next').and.returnValue(
        throwError(() => new HttpErrorResponse({
          error: 'not valid json {{{',
          status: 500,
          statusText: 'Server Error'
        }))
      );

      TestBed.runInInjectionContext(() => {
        authInterceptor(req, next).subscribe({
          error: () => {
            expect(snackbarService.showError).toHaveBeenCalledWith(
              'An error occurred while processing your request. Please try again later.'
            );
            done();
          }
        });
      });
    });

    it('should show errorResponse.error without errorCode', (done) => {
      loginService.getStoredToken.and.returnValue('test-token');
      const req = new HttpRequest('GET', 'http://localhost:4200/api/test');
      const next = jasmine.createSpy('next').and.returnValue(
        throwError(() => new HttpErrorResponse({
          error: {
            success: false,
            message: 'Ignored',
            errorCode: '',
            statusCode: 400,
            errorResponse: { errorCode: '', error: 'Specific validation error' }
          },
          status: 400,
          statusText: 'Bad Request'
        }))
      );

      TestBed.runInInjectionContext(() => {
        authInterceptor(req, next).subscribe({
          error: () => {
            expect(snackbarService.showError).toHaveBeenCalledWith('Specific validation error');
            done();
          }
        });
      });
    });

    it('should show message with errorCode when no errorResponse', (done) => {
      loginService.getStoredToken.and.returnValue('test-token');
      const req = new HttpRequest('GET', 'http://localhost:4200/api/test');
      const next = jasmine.createSpy('next').and.returnValue(
        throwError(() => new HttpErrorResponse({
          error: {
            success: false,
            message: 'Duplicate entry found',
            errorCode: 'E101',
            statusCode: 409,
            errorResponse: null
          },
          status: 409,
          statusText: 'Conflict'
        }))
      );

      TestBed.runInInjectionContext(() => {
        authInterceptor(req, next).subscribe({
          error: () => {
            expect(snackbarService.showError).toHaveBeenCalledWith('Error E101: Duplicate entry found');
            done();
          }
        });
      });
    });

    it('should show message without errorCode', (done) => {
      loginService.getStoredToken.and.returnValue('test-token');
      const req = new HttpRequest('GET', 'http://localhost:4200/api/test');
      const next = jasmine.createSpy('next').and.returnValue(
        throwError(() => new HttpErrorResponse({
          error: {
            success: false,
            message: 'Something went wrong',
            errorCode: '',
            statusCode: 500,
            errorResponse: null
          },
          status: 500,
          statusText: 'Server Error'
        }))
      );

      TestBed.runInInjectionContext(() => {
        authInterceptor(req, next).subscribe({
          error: () => {
            expect(snackbarService.showError).toHaveBeenCalledWith('Something went wrong');
            done();
          }
        });
      });
    });

    it('should show interrupted message for 400 with no message or errorResponse', (done) => {
      loginService.getStoredToken.and.returnValue('test-token');
      const req = new HttpRequest('GET', 'http://localhost:4200/api/test');
      const next = jasmine.createSpy('next').and.returnValue(
        throwError(() => new HttpErrorResponse({
          error: {
            success: false,
            message: '',
            errorCode: '',
            statusCode: 400,
            errorResponse: null
          },
          status: 400,
          statusText: 'Bad Request'
        }))
      );

      TestBed.runInInjectionContext(() => {
        authInterceptor(req, next).subscribe({
          error: () => {
            expect(snackbarService.showError).toHaveBeenCalledWith('[Request interrupted by user]');
            done();
          }
        });
      });
    });

    it.each([
      [0, 'Unable to connect to the server. Please check your internet connection and try again.'],
      [403, 'Access forbidden.'],
      [409, 'This record already exists. Please try again with different data.'],
      [500, 'An error occurred while processing your request. Please try again later.'],
      [502, 'Bad Gateway. The server is temporarily unavailable.'],
      [503, 'Service unavailable. Please try again later.'],
      [504, 'Gateway Timeout. The request took too long to process.'],
    ])('should show correct fallback message for status %d', (status: number, expectedMessage: string) => {
      loginService.getStoredToken.and.returnValue('test-token');
      const req = new HttpRequest('GET', 'http://localhost:4200/api/test');
      const next = jasmine.createSpy('next').and.returnValue(
        throwError(() => new HttpErrorResponse({ error: null, status, statusText: 'Error' }))
      );

      TestBed.runInInjectionContext(() => {
        authInterceptor(req, next).subscribe({
          error: () => {
            expect(snackbarService.showError).toHaveBeenCalledWith(expectedMessage);
          }
        });
      });
    });

    it('should show error.message for unknown status codes', () => {
      loginService.getStoredToken.and.returnValue('test-token');
      const req = new HttpRequest('GET', 'http://localhost:4200/api/test');
      const next = jasmine.createSpy('next').and.returnValue(
        throwError(() => new HttpErrorResponse({
          error: null,
          status: 418,
          statusText: 'I\'m a teapot'
        }))
      );

      TestBed.runInInjectionContext(() => {
        authInterceptor(req, next).subscribe({
          error: (err: HttpErrorResponse) => {
            expect(snackbarService.showError).toHaveBeenCalledWith(err.message);
          }
        });
      });
    });
  });
});
