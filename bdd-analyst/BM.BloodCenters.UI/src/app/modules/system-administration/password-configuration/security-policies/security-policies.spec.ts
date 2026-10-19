import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormGroup, FormBuilder, ControlContainer } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { SecurityPolicies } from './security-policies';

describe('SecurityPolicies', () => {
  let component: SecurityPolicies;
  let fixture: ComponentFixture<SecurityPolicies>;
  let formBuilder: FormBuilder;
  let mockControlContainer: any;

  beforeEach(async () => {
    formBuilder = new FormBuilder();
    
    // Create a mock ControlContainer with a FormGroup
    const mockFormGroup = formBuilder.group({
      minCharsToChange: [1],
      enableAccountLockout: [false],
      failedLoginAttempts: [3],
      enablePasswordHistory: [false],
      passwordHistoryCount: [5]
    });
    
    mockControlContainer = {
      control: mockFormGroup
    };

    await TestBed.configureTestingModule({
      imports: [SecurityPolicies, ReactiveFormsModule, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        FormBuilder,
        {
          provide: ControlContainer,
          useValue: mockControlContainer
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecurityPolicies);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
