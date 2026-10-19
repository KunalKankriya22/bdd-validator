import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  signal,
  computed,
  inject,
  ElementRef,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

import { HeaderService } from '@shared/services/header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { StepCustomerProfileComponent } from './step-customer-profile/step-customer-profile';
import { StepPayeeDetailsComponent } from './step-payee-details/step-payee-details';
import { StepConsigneeDetailsComponent } from './step-consignee-details/step-consignee-details';
import { StepContractDetailsComponent } from './step-contract-details/step-contract-details';
import { StepContactNamesComponent } from './step-contact-names/step-contact-names';
import { CustomerProfileDto } from '../models/customer-profile.model';
import { RouteKey } from '@core/constants/route-keys';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { CustomerProfileListStateService } from '../services/customer-profile-list-state.service';
import { AddCustomerWizardApiService } from './add-customer-wizard-api.service';

export interface WizardStep {
  label: string;
  completed: boolean;
  generatedId?: string;
}

@Component({
  selector: 'app-add-customer-wizard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
    LoadingSpinnerComponent,
    StepCustomerProfileComponent,
    StepPayeeDetailsComponent,
    StepConsigneeDetailsComponent,
    StepContractDetailsComponent,
    StepContactNamesComponent
  ],
  templateUrl: './add-customer-wizard.html',
  styleUrls: ['./add-customer-wizard.scss']
})
export class AddCustomerWizardComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly apiService = inject(AddCustomerWizardApiService);
  private readonly headerService = inject(HeaderService);
  private readonly listStateService = inject(CustomerProfileListStateService);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/' },
      { label: 'Manage Customer Details', link: ROUTE_REGISTRY[RouteKey.CustomerProfile].path },
      { label: 'Add New Customer', link: '' }
    ],
    title: 'Add New Customer',
    subtitle: 'Add a new customer with associated locations and contact information.',
    showBackButton: true,
    onBackClick: () => this.onCancel()
  };

  @ViewChild('stepContent') stepContent!: ElementRef<HTMLDivElement>;
  contactNamesStep?: { onSaveAndFinish(): void; isSaving(): boolean };

  currentStep = signal<number>(0);
  saving = signal<boolean>(false);
  loading = signal<boolean>(false);

  private scrollEffect = effect(() => {
    this.currentStep();
    setTimeout(() => this.stepContent?.nativeElement?.scrollTo(0, 0));
  });
  createdCustomer = signal<CustomerProfileDto | null>(null);
  savedPayeeData = signal<any>(null);
  savedConsigneeData = signal<any[]>([]);
  savedContractData = signal<any>(null);
  savedContactData = signal<any[]>([]);


  steps = signal<WizardStep[]>([
    { label: 'Customer Profile', completed: false },
    { label: 'Payee Details', completed: false },
    { label: 'Consignee Details', completed: false },
    { label: 'Contract Details', completed: false },
    { label: 'Contact Names', completed: false }
  ]);

  isFirstStep = computed(() => this.currentStep() === 0);
  isLastStep = computed(() => this.currentStep() === this.steps().length - 1);

  ngOnInit(): void {
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.listStateService.clear();
        this.onCancel();
      });
  }

  onStepSaveSuccess(customer: CustomerProfileDto): void {
    this.createdCustomer.set(customer);

    const updatedSteps = [...this.steps()];
    updatedSteps[0] = {
      ...updatedSteps[0],
      completed: true,
      generatedId: customer.customerId
    };
    this.steps.set(updatedSteps);

    this.snackBar.open(
      `Customer ${customer.name} (${customer.customerId}) has been saved.`,
      'DISMISS',
      { horizontalPosition: 'end', verticalPosition: 'top', duration: 5000 }
    );

    this.currentStep.set(1);
  }

  onStepComplete(stepIndex: number, data?: any): void {
    // Store saved data for each step so we can reload on PREVIOUS
    if (stepIndex === 1) this.savedPayeeData.set(data);
    if (stepIndex === 2) this.savedConsigneeData.set(Array.isArray(data) ? data : [data]);
    if (stepIndex === 3) this.savedContractData.set(data);
    if (stepIndex === 4) this.savedContactData.set(Array.isArray(data) ? data : [data]);

    let generatedId = '';
    if (stepIndex === 1) generatedId = data?.customerId || '';
    if (stepIndex === 2) generatedId = Array.isArray(data) ? data[0]?.consigneeId || '' : data?.consigneeId || '';
    if (stepIndex === 3) generatedId = data?.contractId || '';
    if (stepIndex === 4) generatedId = Array.isArray(data) ? data[0]?.instId || '' : '';

    const updatedSteps = [...this.steps()];
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      completed: true,
      generatedId
    };
    this.steps.set(updatedSteps);

    // Step 1 (index 1) is Payee Details - wire payee to main customer
    if (stepIndex === 1 && data?.customerId && this.createdCustomer()) {
      const mainCustomerId = this.createdCustomer()!.customerId;
      const currentCustomerData = this.createdCustomer()!;

      // Update the main customer with the payee ID
      const updatePayload = {
        name: currentCustomerData.name,
        customerType: currentCustomerData.customerType,
        shortName: currentCustomerData.shortName,
        alphaKey: currentCustomerData.alphaKey,
        intFlag: currentCustomerData.intFlag,
        address1: currentCustomerData.address1,
        address2: currentCustomerData.address2,
        address3: currentCustomerData.address3,
        city: currentCustomerData.city,
        state: currentCustomerData.state,
        zip: currentCustomerData.zip,
        country: currentCustomerData.country,
        phoneNo: currentCustomerData.phoneNo,
        phoneExt: currentCustomerData.phoneExt,
        faxNo: currentCustomerData.faxNo,
        intPhone: currentCustomerData.intPhone,
        telexNo: currentCustomerData.telexNo,
        codFlag: currentCustomerData.codFlag,
        returnAcceptedFlag: currentCustomerData.returnAcceptedFlag,
        arAccount: currentCustomerData.arAccount,
        fiPriceSchNo: currentCustomerData.fiPriceSchNo,
        priceChangeFlag: currentCustomerData.priceChangeFlag,
        ednGenFlag: currentCustomerData.ednGenFlag,
        plasmaFileType: currentCustomerData.plasmaFileType,
        phApprFlag: currentCustomerData.phApprFlag,
        insApprFlag: currentCustomerData.insApprFlag,
        effDate: currentCustomerData.effDate,
        termDate: currentCustomerData.termDate,
        payeeId: data.customerId // Link the payee
      };

      this.saving.set(true);
      this.apiService.updateCustomerProfile(mainCustomerId, updatePayload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedCustomer) => {
            this.saving.set(false);
            this.createdCustomer.set(updatedCustomer);
            this.snackBar.open(
              'Payee details saved successfully',
              'DISMISS',
              { horizontalPosition: 'end', verticalPosition: 'top', duration: 3000 }
            );
            if (stepIndex < this.steps().length - 1) {
              this.currentStep.set(stepIndex + 1);
            } else {
              this.onFinish();
            }
          },
          error: (err) => {
            this.saving.set(false);
            console.error('Error linking payee to customer:', err);
            this.snackBar.open(
              'Payee saved but failed to link to customer. Please update manually.',
              'DISMISS',
              { horizontalPosition: 'end', verticalPosition: 'top', duration: 5000 }
            );
            if (stepIndex < this.steps().length - 1) {
              this.currentStep.set(stepIndex + 1);
            } else {
              this.onFinish();
            }
          }
        });
    } else {
      // For other steps, just move to next step
      if (stepIndex < this.steps().length - 1) {
        this.currentStep.set(stepIndex + 1);
      } else {
        this.onFinish();
      }
    }
  }

  goToPreviousStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  goToStep(index: number): void {
    const steps = this.steps();
    // allow navigation only to the current step or any already-completed step
    if (index === this.currentStep() || steps[index]?.completed) {
      this.currentStep.set(index);
    }
  }

  triggerContactSave(): void {
    this.contactNamesStep?.onSaveAndFinish();
  }

  isContactStepSaving(): boolean {
    return this.contactNamesStep?.isSaving() ?? false;
  }

  onSaveCurrentStep(): void {
    // Find the form inside the step content and trigger submit
    const stepContent = document.querySelector('.step-content');
    if (stepContent) {
      const formElement = stepContent.querySelector('form');
      if (formElement) {
        formElement.requestSubmit();
        return;
      }
    }
    // Fallback: try any form on the page
    const anyForm = document.querySelector('form[novalidate]') as HTMLFormElement;
    if (anyForm) {
      anyForm.requestSubmit();
    }
  }

  onCancel(): void {
    this.router.navigate([ROUTE_REGISTRY[RouteKey.CustomerProfile].path]);
  }

  onFinish(): void {
    const customer = this.createdCustomer();
    const message = customer
      ? `Customer ${customer.name} (${customer.customerId}) has been saved.`
      : 'Customer created successfully!';
    this.snackBar.open(message, 'DISMISS', {
      horizontalPosition: 'end', verticalPosition: 'top', duration: 5000
    });
    this.router.navigate([ROUTE_REGISTRY[RouteKey.CustomerProfile].path]);
  }
}
