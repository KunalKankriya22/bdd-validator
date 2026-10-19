import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormGroup, FormBuilder, ControlContainer } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ExpirationNotifications } from './expiration-notifications';

describe('ExpirationNotifications', () => {
  let component: ExpirationNotifications;
  let fixture: ComponentFixture<ExpirationNotifications>;
  let formBuilder: FormBuilder;
  let mockControlContainer: any;

  beforeEach(async () => {
    formBuilder = new FormBuilder();
    
    // Create a mock ControlContainer with a FormGroup
    const mockFormGroup = formBuilder.group({
      enablePasswordExpiration: [false],
      passwordValidityDays: [90],
      warningNoticeDays: [30]
    });
    
    mockControlContainer = {
      control: mockFormGroup
    };

    await TestBed.configureTestingModule({
      imports: [ExpirationNotifications, ReactiveFormsModule, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        FormBuilder,
        {
          provide: ControlContainer,
          useValue: mockControlContainer
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpirationNotifications);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
