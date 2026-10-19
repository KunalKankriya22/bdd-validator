import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { PasswordConfigurationComponent } from './password-configuration';
import { PasswordConfigurationService } from './services/password-configuration.service';

describe('PasswordConfigurationComponent', () => {
  let component: PasswordConfigurationComponent;
  let fixture: ComponentFixture<PasswordConfigurationComponent>;
  let mockConfigService: jasmine.SpyObj<PasswordConfigurationService>;

  const createMockConfig = (isStrong: boolean) => ({
    isStrongPasswordEnabled: isStrong,
    passwordRequirements: {
      minimumLength: 15,
      requireUpperCase: true,
      minimumUpperCase: 2,
      requireLowerCase: true,
      minimumLowerCase: 2,
      requireNumeric: true,
      minimumNumeric: 2,
      requireSpecialCharacters: true,
      minimumSpecialCharacters: 2,
      allowedSpecialCharacters: '!#$'
    },
    securityPolicies: {
      minimumCharactersToChange: 3,
      accountLockoutEnabled: true,
      failedLoginAttemptsBeforeLockout: 3,
      passwordHistoryEnabled: true,
      previousPasswordsToRemember: 24
    },
    expirationNotifications: {
      passwordExpirationEnabled: true,
      passwordValidityPeriodDays: 365,
      warningNoticeBeforeExpirationDays: 5
    }
  });

  beforeEach(() => {
    mockConfigService = jasmine.createSpyObj('PasswordConfigurationService', [
      'getConfiguration',
      'updateConfiguration'
    ]);
    mockConfigService.getConfiguration.and.returnValue(of(createMockConfig(false)));

    TestBed.configureTestingModule({
      imports: [PasswordConfigurationComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: PasswordConfigurationService, useValue: mockConfigService }
      ]
    });

    fixture = TestBed.createComponent(PasswordConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default isStrongPasswordEnabled to false', () => {
    expect(component.isStrongPasswordEnabled).toBeFalse();
  });

  describe('populateForm', () => {
    it('should set isStrongPasswordEnabled to true when config flag is true', () => {
      (component as any).populateForm(createMockConfig(true));
      expect(component.isStrongPasswordEnabled).toBeTrue();
    });

    it('should set isStrongPasswordEnabled to false when config flag is false', () => {
      (component as any).populateForm(createMockConfig(false));
      expect(component.isStrongPasswordEnabled).toBeFalse();
    });

    it('should default isStrongPasswordEnabled to false when flag is missing', () => {
      const config = createMockConfig(false);
      delete (config as any).isStrongPasswordEnabled;
      (component as any).populateForm(config);
      expect(component.isStrongPasswordEnabled).toBeFalse();
    });

    it('should not throw when config is null', () => {
      expect(() => (component as any).populateForm(null)).not.toThrow();
    });

    it('should populate form fields from config', () => {
      (component as any).populateForm(createMockConfig(true));
      const formValue = component.form.getRawValue();
      expect(formValue.passwordRequirements.minLength).toBe(15);
      expect(formValue.passwordRequirements.minUppers).toBe(2);
      expect(formValue.passwordRequirements.minLowers).toBe(2);
      expect(formValue.securityPolicies.failedLoginAttempts).toBe(3);
      expect(formValue.expirationNotifications.passwordValidityDays).toBe(365);
    });
  });

  describe('loadConfiguration', () => {
    it('should set isStrongPasswordEnabled from API response', () => {
      mockConfigService.getConfiguration.and.returnValue(of(createMockConfig(true)));
      (component as any).loadConfiguration();
      expect(component.isStrongPasswordEnabled).toBeTrue();
      expect(component.isLoading).toBeFalse();
    });

    it('should set isLoading to false after load', () => {
      mockConfigService.getConfiguration.and.returnValue(of(createMockConfig(false)));
      (component as any).loadConfiguration();
      expect(component.isLoading).toBeFalse();
    });
  });
});
