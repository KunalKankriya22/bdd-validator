import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { OktaCallbackComponent } from './okta-callback.component';
import { AuthService } from '../../../shared/services/auth.service';
import { HeaderService } from '../../../shared/services/header.service';
import { LoginService } from '../../../shared/services/login.service';
import { RestrictionService } from '../../../shared/services/restriction.service';

describe('OktaCallbackComponent', () => {
  let component: OktaCallbackComponent;
  let fixture: ComponentFixture<OktaCallbackComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockLoginService: jasmine.SpyObj<LoginService>;
  let mockRestrictionService: jasmine.SpyObj<RestrictionService>;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['handleLoginRedirect', 'getUser']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockHeaderService = jasmine.createSpyObj('HeaderService', [
      'fetchSystemUserByEmail', 'clearSession'
    ]);
    mockLoginService = jasmine.createSpyObj('LoginService', [
      'checkPasswordConfig', 'storePasswordConfig', 'storeUsername', 'storeAuthMethod'
    ]);
    mockRestrictionService = jasmine.createSpyObj('RestrictionService', [
      'setAccessDeniedActive', 'setOktaRestrictionActive'
    ]);

    TestBed.configureTestingModule({
      imports: [OktaCallbackComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: LoginService, useValue: mockLoginService },
        { provide: RestrictionService, useValue: mockRestrictionService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(OktaCallbackComponent);
    component = fixture.componentInstance;
  });

  it('should navigate to access-denied when Okta user is null', async () => {
    // Arrange
    mockAuthService.handleLoginRedirect.and.returnValue(Promise.resolve());
    mockAuthService.getUser.and.returnValue(Promise.resolve(null));

    // Act
    await component.ngOnInit();

    // Assert
    expect(mockRestrictionService.setAccessDeniedActive).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/access-denied']);
  });

  it('should navigate to home on successful authentication flow', async () => {
    // Arrange
    mockAuthService.handleLoginRedirect.and.returnValue(Promise.resolve());
    mockAuthService.getUser.and.returnValue(Promise.resolve({ email: 'test@example.com' }));
    mockHeaderService.fetchSystemUserByEmail.and.returnValue(of({ userId: 'user01' }));
    mockLoginService.checkPasswordConfig.and.returnValue(of({ isResetPasswordRequested: false }));

    // Act
    await component.ngOnInit();

    // Assert
    expect(mockHeaderService.fetchSystemUserByEmail).toHaveBeenCalledWith('test@example.com');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
  });
});
