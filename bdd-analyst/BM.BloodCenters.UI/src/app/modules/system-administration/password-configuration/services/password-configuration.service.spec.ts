import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PasswordConfigurationService } from './password-configuration.service';

describe('PasswordConfigurationService', () => {
  let service: PasswordConfigurationService;
  let httpMock: HttpTestingController;

  const API_URL = '/api/v1/system-admin/password-configuration';

  // --- Fixtures ---

  /** Helper to create API responses with custom overrides. */
  const createMockApiResponse = (overrides: Record<string, any> = {}) => ({
    pwd_History: 24,
    pwd_Min_Length: 15,
    pwd_Min_Caps: 2,
    pwd_Min_Lower: 2,
    pwd_Min_Number: 2,
    pwd_Min_Special: 2,
    pwd_Min_Char_Chg: 3,
    pwd_Lockout: 3,
    pwd_Intrvl: 365,
    pwd_Method: 'Y',
    pwd_Special: '!#$',
    pwd_War_Msg: 5,
    pwd_Lockout_Interval: 3,
    pwd_Lockout_Period: 3,
    strong_Pwd_Enabled: 'Y',
    ...overrides
  });

  /** API response representing a fully-enabled configuration. */
  const enabledApiResponse: any = {
    pwd_Min_Length: 8,
    pwd_Min_Caps: 2,
    pwd_Min_Lower: 2,
    pwd_Min_Number: 1,
    pwd_Min_Special: 1,
    pwd_Special: '!@#$%',
    pwd_Min_Char_Chg: 3,
    pwd_Lockout: 5,
    pwd_History: 10,
    pwd_Intrvl: 90,
    pwd_Method: 'Y',
    pwd_War_Msg: 14
  };

  /** API response representing a fully-disabled configuration. */
  const disabledApiResponse: any = {
    pwd_Min_Length: 0,
    pwd_Min_Caps: 0,
    pwd_Min_Lower: 0,
    pwd_Min_Number: 0,
    pwd_Min_Special: 0,
    pwd_Special: '',
    pwd_Min_Char_Chg: 0,
    pwd_Lockout: 0,
    pwd_History: 0,
    pwd_Intrvl: 0,
    pwd_Method: 'N',
    pwd_War_Msg: 0
  };

  /** UI payload with all toggles ON. */
  const enabledUiPayload: any = {
    passwordRequirements: {
      minLength: 8,
      requireUpper: true,
      minUppers: 2,
      requireLower: true,
      minLowers: 2,
      requireNumeric: true,
      minNumeric: 1,
      requireSpecial: true,
      minSpecials: 1,
      allowedSpecialChars: '!@#$%'
    },
    securityPolicies: {
      minCharsToChange: 3,
      enableAccountLockout: true,
      failedLoginAttempts: 5,
      enablePasswordHistory: true,
      passwordHistoryCount: 10
    },
    expirationNotifications: {
      enablePasswordExpiration: true,
      passwordValidityDays: 90,
      warningNoticeDays: 14
    }
  };

  /** UI payload with all toggles OFF. */
  const disabledUiPayload: any = {
    passwordRequirements: {
      minLength: 6,
      requireUpper: false,
      minUppers: 0,
      requireLower: false,
      minLowers: 0,
      requireNumeric: false,
      minNumeric: 0,
      requireSpecial: false,
      minSpecials: 0,
      allowedSpecialChars: ''
    },
    securityPolicies: {
      minCharsToChange: 0,
      enableAccountLockout: false,
      failedLoginAttempts: 0,
      enablePasswordHistory: false,
      passwordHistoryCount: 0
    },
    expirationNotifications: {
      enablePasswordExpiration: false,
      passwordValidityDays: 0,
      warningNoticeDays: 0
    }
  };

  /** /current endpoint response with all policies enabled. */
  const enabledCurrentResponse: any = {
    securityPolicies: {
      accountLockoutEnabled: true,
      failedLoginAttemptsBeforeLockout: 5,
      passwordHistoryEnabled: true,
      previousPasswordsToRemember: 10
    },
    expirationNotifications: {
      passwordExpirationEnabled: true,
      passwordValidityDays: 90
    }
  };

  /** /current endpoint response with all policies disabled. */
  const disabledCurrentResponse: any = {
    securityPolicies: {
      accountLockoutEnabled: false,
      failedLoginAttemptsBeforeLockout: 0,
      passwordHistoryEnabled: false,
      previousPasswordsToRemember: 0
    },
    expirationNotifications: {
      passwordExpirationEnabled: false,
      passwordValidityDays: 0
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PasswordConfigurationService]
    });
    service = TestBed.inject(PasswordConfigurationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ------------------------------------------------------------------
  // strongPasswordEnabled$
  // ------------------------------------------------------------------

  describe('strongPasswordEnabled$', () => {
    it('should emit false as the initial value', (done) => {
      service.strongPasswordEnabled$.subscribe(value => {
        expect(value).toBe(false);
        done();
      });
    });
  });

  // ------------------------------------------------------------------
  // getConfiguration - strong password flag mapping
  // ------------------------------------------------------------------

  describe('getConfiguration - strong password flag mapping', () => {
    it('should map strong_Pwd_Enabled Y to isStrongPasswordEnabled true', () => {
      service.getConfiguration().subscribe(config => {
        expect(config.isStrongPasswordEnabled).toBeTrue();
      });

      const req = httpMock.expectOne(API_URL);
      expect(req.request.method).toBe('GET');
      req.flush(createMockApiResponse({ strong_Pwd_Enabled: 'Y' }));
    });

    it('should map strong_Pwd_Enabled N to isStrongPasswordEnabled false', () => {
      service.getConfiguration().subscribe(config => {
        expect(config.isStrongPasswordEnabled).toBeFalse();
      });

      const req = httpMock.expectOne(API_URL);
      req.flush(createMockApiResponse({ strong_Pwd_Enabled: 'N' }));
    });

    it('should handle strong_Pwd_Enabled with leading/trailing whitespace', () => {
      service.getConfiguration().subscribe(config => {
        expect(config.isStrongPasswordEnabled).toBeTrue();
      });

      const req = httpMock.expectOne(API_URL);
      req.flush(createMockApiResponse({ strong_Pwd_Enabled: ' Y ' }));
    });

    it('should handle lowercase strong_Pwd_Enabled value', () => {
      service.getConfiguration().subscribe(config => {
        expect(config.isStrongPasswordEnabled).toBeTrue();
      });

      const req = httpMock.expectOne(API_URL);
      req.flush(createMockApiResponse({ strong_Pwd_Enabled: 'y' }));
    });

    it('should map undefined strong_Pwd_Enabled to false', () => {
      service.getConfiguration().subscribe(config => {
        expect(config.isStrongPasswordEnabled).toBeFalse();
      });

      const req = httpMock.expectOne(API_URL);
      const response = createMockApiResponse();
      delete (response as any).strong_Pwd_Enabled;
      req.flush(response);
    });

    it('should map empty string strong_Pwd_Enabled to false', () => {
      service.getConfiguration().subscribe(config => {
        expect(config.isStrongPasswordEnabled).toBeFalse();
      });

      const req = httpMock.expectOne(API_URL);
      req.flush(createMockApiResponse({ strong_Pwd_Enabled: '' }));
    });
  });

  // ------------------------------------------------------------------
  // getConfiguration - strongPasswordEnabled$ subject
  // ------------------------------------------------------------------

  describe('getConfiguration - strongPasswordEnabled$ subject', () => {
    it('should update strongPasswordEnabled$ to true when Y', () => {
      let subjectValue: boolean | undefined;
      service.strongPasswordEnabled$.subscribe(val => subjectValue = val);

      expect(subjectValue).toBeFalse();

      service.getConfiguration().subscribe();

      const req = httpMock.expectOne(API_URL);
      req.flush(createMockApiResponse({ strong_Pwd_Enabled: 'Y' }));

      expect(subjectValue).toBeTrue();
    });

    it('should update strongPasswordEnabled$ to false when N', () => {
      let subjectValue: boolean | undefined;
      service.strongPasswordEnabled$.subscribe(val => subjectValue = val);

      service.getConfiguration().subscribe();

      const req = httpMock.expectOne(API_URL);
      req.flush(createMockApiResponse({ strong_Pwd_Enabled: 'N' }));

      expect(subjectValue).toBeFalse();
    });
  });

  // ------------------------------------------------------------------
  // getConfiguration  (+ mapApiToUi coverage)
  // ------------------------------------------------------------------

  describe('getConfiguration', () => {
    it('should call GET and map an enabled API response to the UI model', (done) => {
      service.getConfiguration().subscribe(result => {
        // passwordRequirements
        expect(result.passwordRequirements.minLength).toBe(8);
        expect(result.passwordRequirements.requireUpper).toBe(true);
        expect(result.passwordRequirements.minUppers).toBe(2);
        expect(result.passwordRequirements.requireLower).toBe(true);
        expect(result.passwordRequirements.minLowers).toBe(2);
        expect(result.passwordRequirements.requireNumeric).toBe(true);
        expect(result.passwordRequirements.minNumeric).toBe(1);
        expect(result.passwordRequirements.requireSpecial).toBe(true);
        expect(result.passwordRequirements.minSpecials).toBe(1);
        expect(result.passwordRequirements.allowedSpecialChars).toBe('!@#$%');

        // alias fields
        expect(result.passwordRequirements.minimumLength).toBe(8);
        expect(result.passwordRequirements.requireUpperCase).toBe(true);
        expect(result.passwordRequirements.minimumUpperCase).toBe(2);
        expect(result.passwordRequirements.requireLowerCase).toBe(true);
        expect(result.passwordRequirements.minimumLowerCase).toBe(2);
        expect(result.passwordRequirements.minimumNumeric).toBe(1);
        expect(result.passwordRequirements.requireSpecialCharacters).toBe(true);
        expect(result.passwordRequirements.minimumSpecialCharacters).toBe(1);
        expect(result.passwordRequirements.allowedSpecialCharacters).toBe('!@#$%');

        // securityPolicies
        expect(result.securityPolicies.minCharsToChange).toBe(3);
        expect(result.securityPolicies.enableAccountLockout).toBe(true);
        expect(result.securityPolicies.failedLoginAttempts).toBe(5);
        expect(result.securityPolicies.enablePasswordHistory).toBe(true);
        expect(result.securityPolicies.passwordHistoryCount).toBe(10);
        expect(result.securityPolicies.minimumCharactersToChange).toBe(3);
        expect(result.securityPolicies.accountLockoutEnabled).toBe(true);
        expect(result.securityPolicies.failedLoginAttemptsBeforeLockout).toBe(5);
        expect(result.securityPolicies.passwordHistoryEnabled).toBe(true);
        expect(result.securityPolicies.previousPasswordsToRemember).toBe(10);

        // expirationNotifications
        expect(result.expirationNotifications.enablePasswordExpiration).toBe(true);
        expect(result.expirationNotifications.passwordValidityDays).toBe(90);
        expect(result.expirationNotifications.warningNoticeDays).toBe(14);
        expect(result.expirationNotifications.passwordExpirationEnabled).toBe(true);
        expect(result.expirationNotifications.passwordValidityPeriodDays).toBe(90);
        expect(result.expirationNotifications.warningNoticeBeforeExpirationDays).toBe(14);

        // metadata
        expect(result.metadata.changedBy).toBe('');
        expect(result.metadata.changedAt).toBe('');

        done();
      });

      const req = httpMock.expectOne(API_URL);
      expect(req.request.method).toBe('GET');
      req.flush(enabledApiResponse);
    });

    it('should map a disabled API response correctly (all zeros)', (done) => {
      service.getConfiguration().subscribe(result => {
        expect(result.passwordRequirements.minLength).toBe(0);
        expect(result.passwordRequirements.requireUpper).toBe(false);
        expect(result.passwordRequirements.minUppers).toBe(0);
        expect(result.passwordRequirements.requireLower).toBe(false);
        expect(result.passwordRequirements.minLowers).toBe(0);
        expect(result.passwordRequirements.requireNumeric).toBe(false);
        expect(result.passwordRequirements.minNumeric).toBe(0);
        expect(result.passwordRequirements.requireSpecial).toBe(false);
        expect(result.passwordRequirements.minSpecials).toBe(0);
        expect(result.passwordRequirements.allowedSpecialChars).toBe('');

        expect(result.securityPolicies.enableAccountLockout).toBe(false);
        expect(result.securityPolicies.failedLoginAttempts).toBe(0);
        expect(result.securityPolicies.enablePasswordHistory).toBe(false);
        expect(result.securityPolicies.passwordHistoryCount).toBe(0);

        expect(result.expirationNotifications.enablePasswordExpiration).toBe(false);
        expect(result.expirationNotifications.passwordValidityDays).toBe(0);
        expect(result.expirationNotifications.warningNoticeDays).toBe(0);

        done();
      });

      const req = httpMock.expectOne(API_URL);
      req.flush(disabledApiResponse);
    });

    it('should treat string numeric values as numbers via parseNumeric', (done) => {
      const apiWithStrings: any = {
        pwd_Min_Length: '12',
        pwd_Min_Caps: '3',
        pwd_Min_Lower: '4',
        pwd_Min_Number: '2',
        pwd_Min_Special: '1',
        pwd_Special: '@!',
        pwd_Min_Char_Chg: '5',
        pwd_Lockout: '7',
        pwd_History: '15',
        pwd_Intrvl: '60',
        pwd_Method: 'Y',
        pwd_War_Msg: '10'
      };

      service.getConfiguration().subscribe(result => {
        expect(result.passwordRequirements.minLength).toBe(12);
        expect(result.passwordRequirements.minUppers).toBe(3);
        expect(result.passwordRequirements.minLowers).toBe(4);
        expect(result.passwordRequirements.minNumeric).toBe(2);
        expect(result.passwordRequirements.minSpecials).toBe(1);
        expect(result.securityPolicies.minCharsToChange).toBe(5);
        expect(result.securityPolicies.failedLoginAttempts).toBe(7);
        expect(result.securityPolicies.passwordHistoryCount).toBe(15);
        expect(result.expirationNotifications.passwordValidityDays).toBe(60);
        expect(result.expirationNotifications.warningNoticeDays).toBe(10);
        done();
      });

      const req = httpMock.expectOne(API_URL);
      req.flush(apiWithStrings);
    });

    it('should treat null and undefined values as 0 via parseNumeric', (done) => {
      const apiWithNulls: any = {
        pwd_Min_Length: null,
        pwd_Min_Caps: undefined,
        pwd_Min_Lower: null,
        pwd_Min_Number: undefined,
        pwd_Min_Special: null,
        pwd_Special: null,
        pwd_Min_Char_Chg: null,
        pwd_Lockout: undefined,
        pwd_History: null,
        pwd_Intrvl: undefined,
        pwd_Method: 'N',
        pwd_War_Msg: null
      };

      service.getConfiguration().subscribe(result => {
        expect(result.passwordRequirements.minLength).toBe(0);
        expect(result.passwordRequirements.requireUpper).toBe(false);
        expect(result.passwordRequirements.minUppers).toBe(0);
        expect(result.passwordRequirements.requireLower).toBe(false);
        expect(result.passwordRequirements.requireNumeric).toBe(false);
        expect(result.passwordRequirements.requireSpecial).toBe(false);
        expect(result.securityPolicies.enableAccountLockout).toBe(false);
        expect(result.securityPolicies.enablePasswordHistory).toBe(false);
        expect(result.expirationNotifications.enablePasswordExpiration).toBe(false);
        expect(result.passwordRequirements.allowedSpecialChars).toBe('');
        done();
      });

      const req = httpMock.expectOne(API_URL);
      req.flush(apiWithNulls);
    });

    it('should treat empty string values as 0 via parseNumeric', (done) => {
      const apiWithEmptyStrings: any = {
        pwd_Min_Length: '',
        pwd_Min_Caps: '',
        pwd_Min_Lower: '',
        pwd_Min_Number: '',
        pwd_Min_Special: '',
        pwd_Special: '',
        pwd_Min_Char_Chg: '',
        pwd_Lockout: '',
        pwd_History: '',
        pwd_Intrvl: '',
        pwd_Method: 'N',
        pwd_War_Msg: ''
      };

      service.getConfiguration().subscribe(result => {
        expect(result.passwordRequirements.minLength).toBe(0);
        expect(result.passwordRequirements.requireUpper).toBe(false);
        expect(result.passwordRequirements.requireLower).toBe(false);
        expect(result.passwordRequirements.requireNumeric).toBe(false);
        expect(result.passwordRequirements.requireSpecial).toBe(false);
        expect(result.securityPolicies.enableAccountLockout).toBe(false);
        expect(result.securityPolicies.enablePasswordHistory).toBe(false);
        expect(result.expirationNotifications.enablePasswordExpiration).toBe(false);
        done();
      });

      const req = httpMock.expectOne(API_URL);
      req.flush(apiWithEmptyStrings);
    });

    it('should treat non-parseable strings as 0 via parseNumeric', (done) => {
      const apiWithBadStrings: any = {
        pwd_Min_Length: 'abc',
        pwd_Min_Caps: 'xyz',
        pwd_Min_Lower: 'bad',
        pwd_Min_Number: 'NaN',
        pwd_Min_Special: '!!',
        pwd_Special: '!@#',
        pwd_Min_Char_Chg: 'nope',
        pwd_Lockout: 'n/a',
        pwd_History: 'none',
        pwd_Intrvl: 'forever',
        pwd_Method: 'N',
        pwd_War_Msg: 'never'
      };

      service.getConfiguration().subscribe(result => {
        expect(result.passwordRequirements.minLength).toBe(0);
        expect(result.passwordRequirements.requireUpper).toBe(false);
        expect(result.passwordRequirements.requireLower).toBe(false);
        expect(result.passwordRequirements.requireNumeric).toBe(false);
        expect(result.passwordRequirements.requireSpecial).toBe(false);
        expect(result.securityPolicies.enableAccountLockout).toBe(false);
        expect(result.securityPolicies.enablePasswordHistory).toBe(false);
        done();
      });

      const req = httpMock.expectOne(API_URL);
      req.flush(apiWithBadStrings);
    });
  });

  // ------------------------------------------------------------------
  // getConfiguration - password requirements mapping
  // ------------------------------------------------------------------

  describe('getConfiguration - password requirements mapping', () => {
    it('should map password requirements from API response', () => {
      service.getConfiguration().subscribe(config => {
        expect(config.passwordRequirements.minLength).toBe(15);
        expect(config.passwordRequirements.requireUpper).toBeTrue();
        expect(config.passwordRequirements.minUppers).toBe(2);
        expect(config.passwordRequirements.requireLower).toBeTrue();
        expect(config.passwordRequirements.minLowers).toBe(2);
        expect(config.passwordRequirements.requireNumeric).toBeTrue();
        expect(config.passwordRequirements.minNumeric).toBe(2);
        expect(config.passwordRequirements.requireSpecial).toBeTrue();
        expect(config.passwordRequirements.minSpecials).toBe(2);
        expect(config.passwordRequirements.allowedSpecialChars).toBe('!#$');
      });

      const req = httpMock.expectOne(API_URL);
      req.flush(createMockApiResponse());
    });

    it('should set requireUpper to false when pwd_Min_Caps is 0', () => {
      service.getConfiguration().subscribe(config => {
        expect(config.passwordRequirements.requireUpper).toBeFalse();
        expect(config.passwordRequirements.minUppers).toBe(0);
      });

      const req = httpMock.expectOne(API_URL);
      req.flush(createMockApiResponse({ pwd_Min_Caps: 0 }));
    });

    it('should set requireLower to false when pwd_Min_Lower is 0', () => {
      service.getConfiguration().subscribe(config => {
        expect(config.passwordRequirements.requireLower).toBeFalse();
        expect(config.passwordRequirements.minLowers).toBe(0);
      });

      const req = httpMock.expectOne(API_URL);
      req.flush(createMockApiResponse({ pwd_Min_Lower: 0 }));
    });

    it('should set requireNumeric to false when pwd_Min_Number is 0', () => {
      service.getConfiguration().subscribe(config => {
        expect(config.passwordRequirements.requireNumeric).toBeFalse();
        expect(config.passwordRequirements.minNumeric).toBe(0);
      });

      const req = httpMock.expectOne(API_URL);
      req.flush(createMockApiResponse({ pwd_Min_Number: 0 }));
    });

    it('should set requireSpecial to false when pwd_Min_Special is 0', () => {
      service.getConfiguration().subscribe(config => {
        expect(config.passwordRequirements.requireSpecial).toBeFalse();
        expect(config.passwordRequirements.minSpecials).toBe(0);
      });

      const req = httpMock.expectOne(API_URL);
      req.flush(createMockApiResponse({ pwd_Min_Special: 0 }));
    });
  });

  // ------------------------------------------------------------------
  // getConfiguration - security policies mapping
  // ------------------------------------------------------------------

  describe('getConfiguration - security policies mapping', () => {
    it('should map security policies from API response', () => {
      service.getConfiguration().subscribe(config => {
        expect(config.securityPolicies.minCharsToChange).toBe(3);
        expect(config.securityPolicies.enableAccountLockout).toBeTrue();
        expect(config.securityPolicies.failedLoginAttempts).toBe(3);
        expect(config.securityPolicies.enablePasswordHistory).toBeTrue();
        expect(config.securityPolicies.passwordHistoryCount).toBe(24);
      });

      const req = httpMock.expectOne(API_URL);
      req.flush(createMockApiResponse());
    });

    it('should set enableAccountLockout to false when pwd_Lockout is 0', () => {
      service.getConfiguration().subscribe(config => {
        expect(config.securityPolicies.enableAccountLockout).toBeFalse();
        expect(config.securityPolicies.failedLoginAttempts).toBe(0);
      });

      const req = httpMock.expectOne(API_URL);
      req.flush(createMockApiResponse({ pwd_Lockout: 0 }));
    });

    it('should set enablePasswordHistory to false when pwd_History is 0', () => {
      service.getConfiguration().subscribe(config => {
        expect(config.securityPolicies.enablePasswordHistory).toBeFalse();
        expect(config.securityPolicies.passwordHistoryCount).toBe(0);
      });

      const req = httpMock.expectOne(API_URL);
      req.flush(createMockApiResponse({ pwd_History: 0 }));
    });
  });

  // ------------------------------------------------------------------
  // getConfiguration - expiration notifications mapping
  // ------------------------------------------------------------------

  describe('getConfiguration - expiration notifications mapping', () => {
    it('should map expiration notifications from API response', () => {
      service.getConfiguration().subscribe(config => {
        expect(config.expirationNotifications.enablePasswordExpiration).toBeTrue();
        expect(config.expirationNotifications.passwordValidityDays).toBe(365);
        expect(config.expirationNotifications.warningNoticeDays).toBe(5);
      });

      const req = httpMock.expectOne(API_URL);
      req.flush(createMockApiResponse());
    });

    it('should set enablePasswordExpiration to false when pwd_Method is N', () => {
      service.getConfiguration().subscribe(config => {
        expect(config.expirationNotifications.enablePasswordExpiration).toBeFalse();
      });

      const req = httpMock.expectOne(API_URL);
      req.flush(createMockApiResponse({ pwd_Method: 'N' }));
    });
  });

  // ------------------------------------------------------------------
  // createConfiguration  (+ mapUiToApi coverage)
  // ------------------------------------------------------------------

  describe('createConfiguration', () => {
    it('should call POST with the mapped payload when all toggles are enabled', (done) => {
      const mockResponse = { success: true };

      service.createConfiguration(enabledUiPayload).subscribe(result => {
        expect(result).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(API_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        pwd_History: 10,
        pwd_Min_Length: 8,
        pwd_Min_Caps: 2,
        pwd_Min_Lower: 2,
        pwd_Min_Number: 1,
        pwd_Min_Special: 1,
        pwd_Min_Char_Chg: 3,
        pwd_Lockout: 5,
        pwd_Intrvl: 90,
        pwd_Method: 'Y',
        pwd_Special: '!@#$%',
        pwd_War_Msg: 14,
        pwd_Lockout_Interval: 5,
        pwd_Lockout_Period: 5
      });
      req.flush(mockResponse);
    });

    it('should send empty strings for disabled toggles in the mapped payload', (done) => {
      const mockResponse = { success: true };

      service.createConfiguration(disabledUiPayload).subscribe(result => {
        expect(result).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(API_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.pwd_History).toBe('');
      expect(req.request.body.pwd_Min_Caps).toBe('');
      expect(req.request.body.pwd_Min_Lower).toBe('');
      expect(req.request.body.pwd_Min_Number).toBe('');
      expect(req.request.body.pwd_Min_Special).toBe('');
      expect(req.request.body.pwd_Lockout).toBe('');
      expect(req.request.body.pwd_Intrvl).toBe('');
      expect(req.request.body.pwd_Method).toBe('N');
      expect(req.request.body.pwd_War_Msg).toBe('');
      expect(req.request.body.pwd_Lockout_Interval).toBe('');
      expect(req.request.body.pwd_Lockout_Period).toBe('');
      // minLength should always be passed regardless of toggle
      expect(req.request.body.pwd_Min_Length).toBe(6);
      req.flush(mockResponse);
    });

    it('should map allowedSpecialChars as empty string when not provided', (done) => {
      const payload: any = {
        ...enabledUiPayload,
        passwordRequirements: {
          ...enabledUiPayload.passwordRequirements,
          allowedSpecialChars: undefined
        }
      };

      service.createConfiguration(payload).subscribe(() => done());

      const req = httpMock.expectOne(API_URL);
      expect(req.request.body.pwd_Special).toBe('');
      req.flush({ success: true });
    });
  });

  // ------------------------------------------------------------------
  // updateConfiguration
  // ------------------------------------------------------------------

  describe('updateConfiguration', () => {
    it('should call PUT with the mapped payload', (done) => {
      const mockResponse = { success: true };

      service.updateConfiguration(enabledUiPayload).subscribe(result => {
        expect(result).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(API_URL);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.pwd_Min_Length).toBe(8);
      expect(req.request.body.pwd_Method).toBe('Y');
      expect(req.request.body.pwd_Lockout).toBe(5);
      req.flush(mockResponse);
    });

    it('should call PUT with disabled toggles mapped to empty strings', (done) => {
      const mockResponse = { success: true };

      service.updateConfiguration(disabledUiPayload).subscribe(result => {
        expect(result).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(API_URL);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.pwd_Method).toBe('N');
      expect(req.request.body.pwd_Lockout).toBe('');
      expect(req.request.body.pwd_History).toBe('');
      expect(req.request.body.pwd_Intrvl).toBe('');
      req.flush(mockResponse);
    });
  });

  // ------------------------------------------------------------------
  // getAuditLog
  // ------------------------------------------------------------------

  describe('getAuditLog', () => {
    it('should call GET with the default limit of 50', (done) => {
      const mockLogs = [{ id: 1, action: 'update' }, { id: 2, action: 'create' }];

      service.getAuditLog().subscribe(result => {
        expect(result).toEqual(mockLogs);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/audit-log?limit=50`);
      expect(req.request.method).toBe('GET');
      req.flush(mockLogs);
    });

    it('should call GET with a custom limit', (done) => {
      const mockLogs = [{ id: 1, action: 'update' }];

      service.getAuditLog(10).subscribe(result => {
        expect(result).toEqual(mockLogs);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/audit-log?limit=10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockLogs);
    });

    it('should propagate the error when the API call fails', (done) => {
      service.getAuditLog().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${API_URL}/audit-log?limit=50`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ------------------------------------------------------------------
  // getAccountLockoutThreshold
  // ------------------------------------------------------------------

  describe('getAccountLockoutThreshold', () => {
    it('should return the threshold when account lockout is enabled', (done) => {
      service.getAccountLockoutThreshold().subscribe(result => {
        expect(result).toBe(5);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/current`);
      expect(req.request.method).toBe('GET');
      req.flush(enabledCurrentResponse);
    });

    it('should return 0 when account lockout is disabled', (done) => {
      service.getAccountLockoutThreshold().subscribe(result => {
        expect(result).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/current`);
      req.flush(disabledCurrentResponse);
    });

    it('should return 0 when the API call fails', (done) => {
      service.getAccountLockoutThreshold().subscribe(result => {
        expect(result).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/current`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ------------------------------------------------------------------
  // getPasswordValidityPeriod
  // ------------------------------------------------------------------

  describe('getPasswordValidityPeriod', () => {
    it('should return the validity days when password expiration is enabled', (done) => {
      service.getPasswordValidityPeriod().subscribe(result => {
        expect(result).toBe(90);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/current`);
      expect(req.request.method).toBe('GET');
      req.flush(enabledCurrentResponse);
    });

    it('should return 0 when password expiration is disabled', (done) => {
      service.getPasswordValidityPeriod().subscribe(result => {
        expect(result).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/current`);
      req.flush(disabledCurrentResponse);
    });

    it('should return 0 when the API call fails', (done) => {
      service.getPasswordValidityPeriod().subscribe(result => {
        expect(result).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/current`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ------------------------------------------------------------------
  // getPasswordHistoryCount
  // ------------------------------------------------------------------

  describe('getPasswordHistoryCount', () => {
    it('should return the history count when password history is enabled', (done) => {
      service.getPasswordHistoryCount().subscribe(result => {
        expect(result).toBe(10);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/current`);
      expect(req.request.method).toBe('GET');
      req.flush(enabledCurrentResponse);
    });

    it('should return 0 when password history is disabled', (done) => {
      service.getPasswordHistoryCount().subscribe(result => {
        expect(result).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/current`);
      req.flush(disabledCurrentResponse);
    });

    it('should return 0 when the API call fails', (done) => {
      service.getPasswordHistoryCount().subscribe(result => {
        expect(result).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/current`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ------------------------------------------------------------------
  // validatePasswordHistory
  // ------------------------------------------------------------------

  describe('validatePasswordHistory', () => {
    it('should post userId and newPassword and return true when allowed', (done) => {
      service.validatePasswordHistory('user123', 'NewPass1!').subscribe(result => {
        expect(result).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/validate-history`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ userId: 'user123', newPassword: 'NewPass1!' });
      req.flush({ allowed: true });
    });

    it('should return false when the password is not allowed', (done) => {
      service.validatePasswordHistory('user123', 'OldPass1!').subscribe(result => {
        expect(result).toBe(false);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/validate-history`);
      req.flush({ allowed: false });
    });

    it('should propagate the error when the API call fails', (done) => {
      service.validatePasswordHistory('user123', 'Pass1!').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(`${API_URL}/validate-history`);
      req.flush('Bad request', { status: 400, statusText: 'Bad Request' });
    });
  });

  // ------------------------------------------------------------------
  // validatePasswordChange  (pure function - no HTTP)
  // ------------------------------------------------------------------

  describe('validatePasswordChange', () => {
    it('should return true when enough characters differ', () => {
      const result = service.validatePasswordChange('abc', 'xyz', 3);
      expect(result).toBe(true);
    });

    it('should return false when identical passwords do not meet the minimum', () => {
      const result = service.validatePasswordChange('abc', 'abc', 1);
      expect(result).toBe(false);
    });

    it('should return true when exactly the minimum number of characters differ', () => {
      const result = service.validatePasswordChange('abc', 'axc', 1);
      expect(result).toBe(true);
    });

    it('should return false when fewer than the minimum number of characters differ', () => {
      const result = service.validatePasswordChange('abc', 'axc', 2);
      expect(result).toBe(false);
    });

    it('should count trailing characters of the longer password as differences', () => {
      const result = service.validatePasswordChange('abc', 'abcdef', 3);
      expect(result).toBe(true);
    });

    it('should count missing trailing characters in the new password as differences', () => {
      const result = service.validatePasswordChange('abcdef', 'abc', 3);
      expect(result).toBe(true);
    });

    it('should handle empty old password', () => {
      const result = service.validatePasswordChange('', 'abc', 3);
      expect(result).toBe(true);
    });

    it('should handle empty new password', () => {
      const result = service.validatePasswordChange('abc', '', 3);
      expect(result).toBe(true);
    });

    it('should handle both passwords empty with minimum 0', () => {
      const result = service.validatePasswordChange('', '', 0);
      expect(result).toBe(true);
    });

    it('should return false when both passwords are empty and minimum is greater than 0', () => {
      const result = service.validatePasswordChange('', '', 1);
      expect(result).toBe(false);
    });

    it('should handle single character difference', () => {
      const result = service.validatePasswordChange('a', 'b', 1);
      expect(result).toBe(true);
    });

    it('should compare character-by-character across full length', () => {
      const result = service.validatePasswordChange('Password1!', 'Password2@', 2);
      expect(result).toBe(true);
    });

    it('should return true when minimum is 0 regardless of passwords', () => {
      const result = service.validatePasswordChange('same', 'same', 0);
      expect(result).toBe(true);
    });
  });

  // ------------------------------------------------------------------
  // mapApiToUi - additional edge cases via getConfiguration
  // ------------------------------------------------------------------

  describe('mapApiToUi edge cases', () => {
    it('should set require flags to true only when the count is greater than 0', (done) => {
      const mixedApi: any = {
        pwd_Min_Length: 6,
        pwd_Min_Caps: 1,
        pwd_Min_Lower: 0,
        pwd_Min_Number: 2,
        pwd_Min_Special: 0,
        pwd_Special: '#',
        pwd_Min_Char_Chg: 0,
        pwd_Lockout: 3,
        pwd_History: 0,
        pwd_Intrvl: 30,
        pwd_Method: 'Y',
        pwd_War_Msg: 7
      };

      service.getConfiguration().subscribe(result => {
        expect(result.passwordRequirements.requireUpper).toBe(true);
        expect(result.passwordRequirements.minUppers).toBe(1);
        expect(result.passwordRequirements.requireLower).toBe(false);
        expect(result.passwordRequirements.minLowers).toBe(0);
        expect(result.passwordRequirements.requireNumeric).toBe(true);
        expect(result.passwordRequirements.minNumeric).toBe(2);
        expect(result.passwordRequirements.requireSpecial).toBe(false);
        expect(result.passwordRequirements.minSpecials).toBe(0);

        expect(result.securityPolicies.enableAccountLockout).toBe(true);
        expect(result.securityPolicies.failedLoginAttempts).toBe(3);
        expect(result.securityPolicies.enablePasswordHistory).toBe(false);
        expect(result.securityPolicies.passwordHistoryCount).toBe(0);

        expect(result.expirationNotifications.enablePasswordExpiration).toBe(true);
        expect(result.expirationNotifications.passwordValidityDays).toBe(30);
        expect(result.expirationNotifications.warningNoticeDays).toBe(7);
        done();
      });

      const req = httpMock.expectOne(API_URL);
      req.flush(mixedApi);
    });

    it('should set enablePasswordExpiration to false when pwd_Method is not Y', (done) => {
      const apiNotY: any = {
        ...enabledApiResponse,
        pwd_Method: 'N'
      };

      service.getConfiguration().subscribe(result => {
        expect(result.expirationNotifications.enablePasswordExpiration).toBe(false);
        expect(result.expirationNotifications.passwordExpirationEnabled).toBe(false);
        expect(result.expirationNotifications.passwordValidityDays).toBe(90);
        expect(result.expirationNotifications.warningNoticeDays).toBe(14);
        done();
      });

      const req = httpMock.expectOne(API_URL);
      req.flush(apiNotY);
    });
  });

  // ------------------------------------------------------------------
  // mapUiToApi - additional edge cases via createConfiguration
  // ------------------------------------------------------------------

  describe('mapUiToApi edge cases', () => {
    it('should map mixed toggle states correctly', (done) => {
      const mixedPayload: any = {
        passwordRequirements: {
          minLength: 10,
          requireUpper: true,
          minUppers: 3,
          requireLower: false,
          minLowers: 2,
          requireNumeric: true,
          minNumeric: 1,
          requireSpecial: false,
          minSpecials: 1,
          allowedSpecialChars: '!@#'
        },
        securityPolicies: {
          minCharsToChange: 4,
          enableAccountLockout: true,
          failedLoginAttempts: 3,
          enablePasswordHistory: false,
          passwordHistoryCount: 5
        },
        expirationNotifications: {
          enablePasswordExpiration: false,
          passwordValidityDays: 60,
          warningNoticeDays: 7
        }
      };

      service.createConfiguration(mixedPayload).subscribe(() => done());

      const req = httpMock.expectOne(API_URL);
      const body = req.request.body;

      // Enabled toggles should pass through values
      expect(body.pwd_Min_Caps).toBe(3);
      expect(body.pwd_Min_Number).toBe(1);
      expect(body.pwd_Lockout).toBe(3);

      // Disabled toggles should send empty string
      expect(body.pwd_Min_Lower).toBe('');
      expect(body.pwd_Min_Special).toBe('');
      expect(body.pwd_History).toBe('');
      expect(body.pwd_Intrvl).toBe('');
      expect(body.pwd_Method).toBe('N');
      expect(body.pwd_War_Msg).toBe('');

      // Always-present fields
      expect(body.pwd_Min_Length).toBe(10);
      expect(body.pwd_Min_Char_Chg).toBe(4);
      expect(body.pwd_Special).toBe('!@#');

      req.flush({ success: true });
    });

    it('should set pwd_Lockout_Interval and pwd_Lockout_Period equal to failedLoginAttempts when lockout is enabled', (done) => {
      service.createConfiguration(enabledUiPayload).subscribe(() => done());

      const req = httpMock.expectOne(API_URL);
      expect(req.request.body.pwd_Lockout_Interval).toBe(5);
      expect(req.request.body.pwd_Lockout_Period).toBe(5);
      req.flush({ success: true });
    });

    it('should set pwd_Lockout_Interval and pwd_Lockout_Period to empty string when lockout is disabled', (done) => {
      service.createConfiguration(disabledUiPayload).subscribe(() => done());

      const req = httpMock.expectOne(API_URL);
      expect(req.request.body.pwd_Lockout_Interval).toBe('');
      expect(req.request.body.pwd_Lockout_Period).toBe('');
      req.flush({ success: true });
    });
  });
});
