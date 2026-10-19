import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangePasswordService, UpdatePasswordRequest, PasswordConfiguration } from './change-password.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';

describe('ChangePasswordService', () => {
  let service: ChangePasswordService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ChangePasswordService,
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ChangePasswordService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('updatePassword', () => {
    it('should call ApiService.post with correct endpoint and data', () => {
      const request: UpdatePasswordRequest = {
        userId: 'user123',
        oldPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!'
      };

      const mockResponse = {
        success: true,
        message: 'Password updated successfully',
        data: [{ isMatch: true }]
      };

      service.updatePassword(request).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.success).toBeTruthy();
        expect(response.data[0].isMatch).toBeTruthy();
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.UPDATE_PASSWORD);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should handle incorrect current password (isMatch: false)', () => {
      const request: UpdatePasswordRequest = {
        userId: 'user123',
        oldPassword: 'WrongPassword123!',
        newPassword: 'NewPassword123!'
      };

      const mockResponse = {
        success: false,
        message: 'Incorrect password',
        data: [{ isMatch: false }]
      };

      service.updatePassword(request).subscribe(response => {
        expect(response.success).toBeFalsy();
        expect(response.data[0].isMatch).toBeFalsy();
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.UPDATE_PASSWORD);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });


    it('should handle validation errors from server', () => {
      const request: UpdatePasswordRequest = {
        userId: 'user123',
        oldPassword: 'OldPassword123!',
        newPassword: 'weak'
      };

      const mockResponse = {
        success: false,
        message: 'Password does not meet requirements',
        errors: ['Password too short', 'Missing special characters']
      };

      service.updatePassword(request).subscribe(response => {
        expect(response.success).toBeFalsy();
        expect(response.errors).toBeDefined();
        expect(response.errors.length).toBe(2);
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.UPDATE_PASSWORD);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should send request with empty userId when not provided', () => {
      const request: UpdatePasswordRequest = {
        userId: '',
        oldPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!'
      };

      service.updatePassword(request).subscribe();

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.UPDATE_PASSWORD);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(jasmine.objectContaining({ userId: '' }));
      req.flush({ success: false });
    });
  });

  describe('getPasswordConfiguration', () => {
    it('should call ApiService.get with correct endpoint', () => {
      const mockConfig: PasswordConfiguration = {
        pwd_History: 5,
        pwd_Min_Length: 8,
        pwd_Min_Caps: 1,
        pwd_Min_Lower: 1,
        pwd_Min_Number: 1,
        pwd_Min_Special: 1,
        pwd_Min_Char_Chg: 3,
        pwd_Lockout: 5,
        pwd_Intrvl: 90,
        pwd_Method: 'Y',
        pwd_Special: "&'%@",
        pwd_War_Msg: 7,
        pwd_Lockout_Interval: 30,
        pwd_Lockout_Period: 60
      };

      service.getPasswordConfiguration().subscribe(config => {
        expect(config).toEqual(mockConfig);
        expect(config.pwd_Min_Length).toBe(8);
        expect(config.pwd_Min_Caps).toBe(1);
        expect(config.pwd_Min_Lower).toBe(1);
        expect(config.pwd_Min_Number).toBe(1);
        expect(config.pwd_Min_Special).toBe(1);
        expect(config.pwd_Special).toBe("&'%@");
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.PASSWORD_CONFIGURATION);
      expect(req.request.method).toBe('GET');
      req.flush(mockConfig);
    });

    it('should handle configuration with minimum values', () => {
      const mockConfig: PasswordConfiguration = {
        pwd_History: 0,
        pwd_Min_Length: 2,
        pwd_Min_Caps: 0,
        pwd_Min_Lower: 0,
        pwd_Min_Number: 0,
        pwd_Min_Special: 0,
        pwd_Min_Char_Chg: 1,
        pwd_Lockout: 0,
        pwd_Intrvl: 30,
        pwd_Method: 'N',
        pwd_Special: '&',
        pwd_War_Msg: 1,
        pwd_Lockout_Interval: 0,
        pwd_Lockout_Period: 0
      };

      service.getPasswordConfiguration().subscribe(config => {
        expect(config.pwd_Min_Length).toBe(2);
        expect(config.pwd_Min_Caps).toBe(0);
        expect(config.pwd_Method).toBe('N');
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.PASSWORD_CONFIGURATION);
      expect(req.request.method).toBe('GET');
      req.flush(mockConfig);
    });

    it('should handle configuration with maximum values', () => {
      const mockConfig: PasswordConfiguration = {
        pwd_History: 24,
        pwd_Min_Length: 46,
        pwd_Min_Caps: 10,
        pwd_Min_Lower: 10,
        pwd_Min_Number: 10,
        pwd_Min_Special: 10,
        pwd_Min_Char_Chg: 20,
        pwd_Lockout: 10,
        pwd_Intrvl: 365,
        pwd_Method: 'Y',
        pwd_Special: "&'%@",
        pwd_War_Msg: 30,
        pwd_Lockout_Interval: 60,
        pwd_Lockout_Period: 120
      };

      service.getPasswordConfiguration().subscribe(config => {
        expect(config.pwd_Min_Length).toBe(46);
        expect(config.pwd_History).toBe(24);
        expect(config.pwd_Intrvl).toBe(365);
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.PASSWORD_CONFIGURATION);
      expect(req.request.method).toBe('GET');
      req.flush(mockConfig);
    });

    it('should handle API error when loading configuration', () => {
      service.getPasswordConfiguration().subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(err).toBeTruthy();
          expect(err.error).toBe('Failed to load configuration');
        }
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.PASSWORD_CONFIGURATION);
      expect(req.request.method).toBe('GET');
      req.flush('Failed to load configuration', { status: 500, statusText: 'Server Error' });
    });

    it('should handle different special character configurations', () => {
      const mockConfig: PasswordConfiguration = {
        pwd_History: 5,
        pwd_Min_Length: 8,
        pwd_Min_Caps: 1,
        pwd_Min_Lower: 1,
        pwd_Min_Number: 1,
        pwd_Min_Special: 2,
        pwd_Min_Char_Chg: 3,
        pwd_Lockout: 5,
        pwd_Intrvl: 90,
        pwd_Method: 'Y',
        pwd_Special: '&@',
        pwd_War_Msg: 7,
        pwd_Lockout_Interval: 30,
        pwd_Lockout_Period: 60
      };

      service.getPasswordConfiguration().subscribe(config => {
        expect(config.pwd_Special).toBe('&@');
        expect(config.pwd_Min_Special).toBe(2);
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.PASSWORD_CONFIGURATION);
      expect(req.request.method).toBe('GET');
      req.flush(mockConfig);
    });

    it('should handle password expiration disabled (pwd_Method = N)', () => {
      const mockConfig: PasswordConfiguration = {
        pwd_History: 5,
        pwd_Min_Length: 8,
        pwd_Min_Caps: 1,
        pwd_Min_Lower: 1,
        pwd_Min_Number: 1,
        pwd_Min_Special: 1,
        pwd_Min_Char_Chg: 3,
        pwd_Lockout: 5,
        pwd_Intrvl: 0,
        pwd_Method: 'N',
        pwd_Special: "&'%@",
        pwd_War_Msg: 0,
        pwd_Lockout_Interval: 30,
        pwd_Lockout_Period: 60
      };

      service.getPasswordConfiguration().subscribe(config => {
        expect(config.pwd_Method).toBe('N');
        expect(config.pwd_Intrvl).toBe(0);
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.PASSWORD_CONFIGURATION);
      expect(req.request.method).toBe('GET');
      req.flush(mockConfig);
    });

    it('should handle account lockout disabled', () => {
      const mockConfig: PasswordConfiguration = {
        pwd_History: 5,
        pwd_Min_Length: 8,
        pwd_Min_Caps: 1,
        pwd_Min_Lower: 1,
        pwd_Min_Number: 1,
        pwd_Min_Special: 1,
        pwd_Min_Char_Chg: 3,
        pwd_Lockout: 0,
        pwd_Intrvl: 90,
        pwd_Method: 'Y',
        pwd_Special: "&'%@",
        pwd_War_Msg: 7,
        pwd_Lockout_Interval: 0,
        pwd_Lockout_Period: 0
      };

      service.getPasswordConfiguration().subscribe(config => {
        expect(config.pwd_Lockout).toBe(0);
        expect(config.pwd_Lockout_Interval).toBe(0);
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.PASSWORD_CONFIGURATION);
      expect(req.request.method).toBe('GET');
      req.flush(mockConfig);
    });

  });

  describe('Integration Scenarios', () => {
    it('should load configuration and then update password', (done) => {
      const mockConfig: PasswordConfiguration = {
        pwd_History: 5,
        pwd_Min_Length: 8,
        pwd_Min_Caps: 1,
        pwd_Min_Lower: 1,
        pwd_Min_Number: 1,
        pwd_Min_Special: 1,
        pwd_Min_Char_Chg: 3,
        pwd_Lockout: 5,
        pwd_Intrvl: 90,
        pwd_Method: 'Y',
        pwd_Special: "&'%@",
        pwd_War_Msg: 7,
        pwd_Lockout_Interval: 30,
        pwd_Lockout_Period: 60
      };

      const request: UpdatePasswordRequest = {
        userId: 'user123',
        oldPassword: 'OldPassword123!',
        newPassword: 'NewPassword123@'
      };

      const mockResponse = {
        success: true,
        message: 'Password updated',
        data: [{ isMatch: true }]
      };

      service.getPasswordConfiguration().subscribe(config => {
        expect(config.pwd_Min_Length).toBe(8);

        service.updatePassword(request).subscribe(response => {
          expect(response.success).toBeTruthy();
          done();
        });

        const updateReq = httpMock.expectOne(API.SYSTEM_ADMIN.UPDATE_PASSWORD);
        expect(updateReq.request.method).toBe('POST');
        updateReq.flush(mockResponse);
      });

      const configReq = httpMock.expectOne(API.SYSTEM_ADMIN.PASSWORD_CONFIGURATION);
      expect(configReq.request.method).toBe('GET');
      configReq.flush(mockConfig);
    });
  });
});
