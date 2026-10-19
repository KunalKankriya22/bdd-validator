import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionExpiredComponent } from './session-expired';
import { HeaderService } from '../../services/header.service';
import { LoginService } from '../../services/login.service';
import { provideRouter } from '@angular/router';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('SessionExpiredComponent', () => {
  let component: SessionExpiredComponent;
  let fixture: ComponentFixture<SessionExpiredComponent>;
  let headerService: jasmine.SpyObj<HeaderService>;

  beforeEach(async () => {
    const headerServiceSpy = createMockHeaderService();
    (headerServiceSpy as any).clearSession = jasmine.createSpy('clearSession');
    const loginServiceSpy = jasmine.createSpyObj('LoginService', ['clearToken']);

    await TestBed.configureTestingModule({
      imports: [SessionExpiredComponent],
      providers: [
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionExpiredComponent);
    component = fixture.componentInstance;
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
