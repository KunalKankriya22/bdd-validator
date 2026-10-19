import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, Input, Output, EventEmitter, signal, NO_ERRORS_SCHEMA } from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';

import { AddCustomerWizardComponent } from './add-customer-wizard';
import { CustomerProfileDto } from '../models/customer-profile.model';
import { CustomerProfileListStateService } from '../services/customer-profile-list-state.service';
import { HeaderService } from '@shared/services/header.service';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { RouteKey } from '@core/constants/route-keys';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { StepCustomerProfileComponent } from './step-customer-profile/step-customer-profile';
import { StepPayeeDetailsComponent } from './step-payee-details/step-payee-details';
import { StepConsigneeDetailsComponent } from './step-consignee-details/step-consignee-details';
import { StepContractDetailsComponent } from './step-contract-details/step-contract-details';
import { StepContactNamesComponent } from './step-contact-names/step-contact-names';

// ── Stubs ─────────────────────────────────────────────────────────────────────

@Component({ selector: 'app-page-header-with-breadcrumb', template: '', standalone: true })
class PageHeaderStub { @Input() config: any; }

@Component({ selector: 'app-step-customer-profile', template: '', standalone: true })
class CustomerProfileStub {
  @Input() savedData: any;
  @Output() saveSuccess = new EventEmitter<any>();
  @Output() savingChange = new EventEmitter<boolean>();
  @Output() loadingChange = new EventEmitter<boolean>();
}

@Component({ selector: 'app-step-payee-details', template: '', standalone: true })
class PayeeDetailsStub {
  @Input() customerId = '';
  @Input() savedData: any;
  @Output() stepComplete = new EventEmitter<any>();
  @Output() savingChange = new EventEmitter<boolean>();
  @Output() loadingChange = new EventEmitter<boolean>();
}

@Component({ selector: 'app-step-consignee-details', template: '', standalone: true })
class ConsigneeDetailsStub {
  @Input() customerId = '';
  @Input() savedData: any[] = [];
  @Output() stepComplete = new EventEmitter<any>();
  @Output() savingChange = new EventEmitter<boolean>();
  @Output() loadingChange = new EventEmitter<boolean>();
}

@Component({ selector: 'app-step-contract-details', template: '', standalone: true })
class ContractDetailsStub {
  @Input() customerId = '';
  @Input() savedData: any;
  @Output() stepComplete = new EventEmitter<any>();
  @Output() savingChange = new EventEmitter<boolean>();
  @Output() loadingChange = new EventEmitter<boolean>();
}

@Component({ selector: 'app-step-contact-names', template: '', standalone: true })
class ContactNamesStub {
  @Input() customerId = '';
  @Input() savedData: any[] = [];
  @Output() saveSuccess = new EventEmitter<any>();
  @Output() savingChange = new EventEmitter<boolean>();
  @Output() loadingChange = new EventEmitter<boolean>();
  isSaving = signal(false);
  onSaveAndFinish = jasmine.createSpy('onSaveAndFinish');
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const mockCustomer: CustomerProfileDto = {
  customerId: 'CUST-001',
  chapterId: '0001',
  name: 'Test Customer',
  customerType: 'HO',
  customerTypeDesc: 'Hospital',
  shortName: 'TEST',
  alphaKey: 'TEST',
  intFlag: 'N',
  address1: '123 Main St',
  address2: null, address3: null,
  city: 'Dallas', state: 'TX', zip: '75201', country: 'USA',
  phoneNo: '214-555-0100', phoneExt: null, faxNo: null,
  intPhone: null, telexNo: null,
  codFlag: 'N', returnAcceptedFlag: 'Y',
  arAccount: 'AR001', fiPriceSchNo: '01',
  priceChangeFlag: null, ednGenFlag: null, plasmaFileType: null,
  phApprFlag: null, insApprFlag: null,
  effDate: '2024-01-01', termDate: null,
  lastModifiedDate: null, payeeId: null
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('AddCustomerWizardComponent', () => {
  let component: AddCustomerWizardComponent;
  let fixture: ComponentFixture<AddCustomerWizardComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let listStateServiceSpy: jasmine.SpyObj<CustomerProfileListStateService>;
  let chapterChanged$: Subject<void>;

  beforeEach(() => {

    routerSpy = jasmine.createSpyObj('Router', { navigate: Promise.resolve(true) });
    listStateServiceSpy = jasmine.createSpyObj('CustomerProfileListStateService', ['clear', 'save', 'restore', 'hasSavedState']);
    chapterChanged$ = new Subject<void>();

    const headerServiceMock = {
      chapterChanged$: chapterChanged$.asObservable(),
      chapterTimeZone: signal('America/Chicago')
    };



      TestBed.configureTestingModule({
      imports: [AddCustomerWizardComponent, NoopAnimationsModule, MatSnackBarModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
        { provide: CustomerProfileListStateService, useValue: listStateServiceSpy },
        { provide: HeaderService, useValue: headerServiceMock },
      ],
    })
      .overrideComponent(AddCustomerWizardComponent, {
        remove: {
          imports: [
            PageHeaderWithBreadcrumb,
            StepCustomerProfileComponent,
            StepPayeeDetailsComponent,
            StepConsigneeDetailsComponent,
            StepContractDetailsComponent,
            StepContactNamesComponent,
          ]
        },
        add: {
          imports: [
            PageHeaderStub,
            CustomerProfileStub,
            PayeeDetailsStub,
            ConsigneeDetailsStub,
            ContractDetailsStub,
            ContactNamesStub
          ]
        },
      });


    


      listStateServiceSpy.clear.calls.reset();


      listStateServiceSpy.save.calls.reset();


      listStateServiceSpy.restore.calls.reset();


      listStateServiceSpy.hasSavedState.calls.reset();


    fixture = TestBed.createComponent(AddCustomerWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  // ── Initialisation ────────────────────────────────────────────────────────


  it('should start on step 0', () => {
    expect(component.currentStep()).toBe(0);
  });

  it('should have 5 steps', () => {
    expect(component.steps().length).toBe(5);
  });

  it('should have no completed steps initially', () => {
    expect(component.steps().every(s => !s.completed)).toBeTrue();
  });

  it('should have no createdCustomer initially', () => {
    expect(component.createdCustomer()).toBeNull();
  });

  // ── Step navigation ───────────────────────────────────────────────────────

  describe('goToStep', () => {
    it('should not navigate to an incomplete future step', () => {
      component.goToStep(3);
      expect(component.currentStep()).toBe(0);
    });

    it('should not navigate to step 1 when it is not completed', () => {
      component.goToStep(1);
      expect(component.currentStep()).toBe(0);
    });

    it('should navigate to a completed step', () => {
      // Mark step 0 as completed
      const updatedSteps = [...component.steps()];
      updatedSteps[0] = { ...updatedSteps[0], completed: true };
      component.steps.set(updatedSteps);
      component.currentStep.set(1);

      component.goToStep(0);
      expect(component.currentStep()).toBe(0);
    });

    it('should stay on current step (re-navigating to current step)', () => {
      component.goToStep(0);
      expect(component.currentStep()).toBe(0);
    });
  });

  describe('goToPreviousStep', () => {
    it('should not go below step 0', () => {
      component.goToPreviousStep();
      expect(component.currentStep()).toBe(0);
    });

    it('should go back one step', () => {
      component.currentStep.set(2);
      component.goToPreviousStep();
      expect(component.currentStep()).toBe(1);
    });
  });

  // ── Step 0 save ───────────────────────────────────────────────────────────

  describe('onStepSaveSuccess', () => {
    beforeEach(() => {
      component.onStepSaveSuccess(mockCustomer);
    });

    it('should store the created customer', () => {
      expect(component.createdCustomer()).toEqual(mockCustomer);
    });

    it('should mark step 0 as completed', () => {
      expect(component.steps()[0].completed).toBeTrue();
    });

    it('should store the customer ID as the step generatedId', () => {
      expect(component.steps()[0].generatedId).toBe('CUST-001');
    });

    it('should advance to step 1', () => {
      expect(component.currentStep()).toBe(1);
    });
  });

  // ── onStepComplete ────────────────────────────────────────────────────────

  describe('onStepComplete', () => {
    it('should mark the given step as completed', () => {
      component.currentStep.set(1);
      component.onStepComplete(1);
      expect(component.steps()[1].completed).toBeTrue();
    });

    it('should advance to the next step', () => {
      component.currentStep.set(1);
      component.onStepComplete(1);
      expect(component.currentStep()).toBe(2);
    });


  });

  // ── triggerContactSave / isContactStepSaving ──────────────────────────────

  describe('triggerContactSave', () => {
    it('should not throw when contactNamesStep is undefined', () => {
      expect(() => component.triggerContactSave()).not.toThrow();
    });
  });

  describe('isContactStepSaving', () => {
    it('should return false when contactNamesStep is undefined', () => {
      expect(component.isContactStepSaving()).toBeFalse();
    });
  });

  // ── customerId binding ────────────────────────────────────────────────────

  it('should pass empty customerId to contact step before step 0 completes', () => {
    component.currentStep.set(4);
    fixture.detectChanges();
    const contactStep = fixture.debugElement.query(
      sel => sel.name === 'app-step-contact-names'
    );
    expect(contactStep?.componentInstance?.customerId ?? '').toBe('');
  });

  it('should pass customerId from createdCustomer to contact step after step 0 completes', () => {
    component.onStepSaveSuccess(mockCustomer);
    component.currentStep.set(4);
    fixture.detectChanges();
    const contactStep = fixture.debugElement.query(
      sel => sel.name === 'app-step-contact-names'
    );
    expect(contactStep?.componentInstance?.customerId).toBe('CUST-001');
  });

  // ── Chapter change regression ─────────────────────────────────────────────
});
