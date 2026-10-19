import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ResetPasswordService, GenerateTempPasswordResponse, SendTempPasswordResponse, PasswordResetResponse } from './reset-password.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('ResetPasswordService', () => {
  let service: ResetPasswordService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['post']);

    TestBed.configureTestingModule({
      providers: [
        ResetPasswordService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(ResetPasswordService);
  });

  describe('generateTempPassword', () => {
    it('should post generate temp password request', (done) => {
      // Arrange
      const mockResponse: GenerateTempPasswordResponse = {
        success: true,
        message: 'Generated',
        userId: 'U001',
        temporaryPassword: 'Tmp123',
      };
      apiSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.generateTempPassword('U001').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse);
        expect(apiSpy.post).toHaveBeenCalledWith(
          API.SYSTEM_ADMIN.GENERATE_TEMP_PASSWORD,
          { UserId: 'U001' }
        );
        done();
      });
    });
  });

  describe('sendTempPassword', () => {
    it('should post send temp password request with all params', (done) => {
      // Arrange
      const mockResponse: SendTempPasswordResponse = { success: true, message: 'Sent' };
      apiSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.sendTempPassword('U001', 'Tmp123', 'user@test.com', 'jdoe', 'John Doe').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse);
        expect(apiSpy.post).toHaveBeenCalledWith(
          API.SYSTEM_ADMIN.SEND_TEMP_PASSWORD,
          {
            UserId: 'U001',
            TemporaryPassword: 'Tmp123',
            Email: 'user@test.com',
            Username: 'jdoe',
            UserFullName: 'John Doe',
          }
        );
        done();
      });
    });

    it('should post send temp password request without optional params', (done) => {
      // Arrange
      apiSpy.post.and.returnValue(of({ success: true, message: 'Sent' }));

      // Act
      service.sendTempPassword('U001', 'Tmp123', 'user@test.com').subscribe((result) => {
        // Assert
        expect(result.success).toBe(true);
        expect(apiSpy.post).toHaveBeenCalledWith(
          API.SYSTEM_ADMIN.SEND_TEMP_PASSWORD,
          {
            UserId: 'U001',
            TemporaryPassword: 'Tmp123',
            Email: 'user@test.com',
            Username: undefined,
            UserFullName: undefined,
          }
        );
        done();
      });
    });
  });

  describe('resetPassword', () => {
    it('should post password reset request', (done) => {
      // Arrange
      const mockResponse: PasswordResetResponse = { success: true, message: 'Reset', userId: 'U001' };
      apiSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.resetPassword('U001').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse);
        expect(apiSpy.post).toHaveBeenCalledWith(
          API.SYSTEM_ADMIN.PASSWORD_RESET,
          { userId: 'U001' }
        );
        done();
      });
    });
  });
});
