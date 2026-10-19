import {
  Component,
  OnInit,
  OnDestroy,
  EventEmitter,
  Output,
  ViewChild,
  ElementRef,
  signal,
  computed,
  inject,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HospitalPatientTestingContractService } from '../services/hospital-patient-testing-contract.service';
import { RouteKey } from '@core/constants/route-keys';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { StepCustomerContactInfoComponent } from './step-customer-contact-info/step-customer-contact-info';
import { StepContractInfoComponent } from './step-contract-info/step-contract-info';
import { StepContactInfoComponent } from './step-contact-info/step-contact-info';

export interface WizardStep {
  label: string;
  completed: boolean;
  generatedId?: string;
}

@Component({
  selector: 'app-add-new-contract-wizard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    LoadingSpinnerComponent,
    StepCustomerContactInfoComponent,
    StepContractInfoComponent,
    StepContactInfoComponent
  ],
  templateUrl: './add-new-contract-wizard.html',
  styleUrls: ['./add-new-contract-wizard.scss']
})
export class AddNewContractWizardComponent implements OnInit, OnDestroy {
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly contractService = inject(HospitalPatientTestingContractService);
  private readonly destroy$ = new Subject<void>();

  @Output() cancel = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  @ViewChild('stepContent') stepContent!: ElementRef<HTMLDivElement>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/' },
      { label: 'Hospital/Patient Testing Contract', link: ROUTE_REGISTRY[RouteKey.HospitalPatientTestingContract].path },
      { label: 'Add New Contract', link: '' }
    ],
    title: 'Add New Contract',
    subtitle: 'Create a new hospital/patient testing contract with contact information.',
    showBackButton: true,
    onBackClick: () => this.onCancel()
  };

  currentStep = signal<number>(0);
  saving = signal<boolean>(false);
  loading = signal<boolean>(false);

  private scrollEffect = effect(() => {
    this.currentStep();
    setTimeout(() => this.stepContent?.nativeElement?.scrollTo(0, 0));
  });

  savedCustomerContactData = signal<any>(null);
  savedContractInfoData = signal<any>(null);
  savedContactInfoData = signal<any[]>([]);
  createdContractId = signal<string>('');

  steps = signal<WizardStep[]>([
    { label: 'Customer Contact Information', completed: false },
    { label: 'Contract Information', completed: false },
    { label: 'Contact Information', completed: false }
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
        this.onCancel();
      });
  }

  onStepComplete(stepIndex: number, data?: any): void {
    if (stepIndex === 0) this.savedCustomerContactData.set(data);
    if (stepIndex === 1) {
      this.savedContractInfoData.set(data);
      if (data?.contractId) {
        this.createdContractId.set(data.contractId);
      }
    }
    if (stepIndex === 2) this.savedContactInfoData.set(Array.isArray(data) ? data : [data]);

    let generatedId = '';
    if (stepIndex === 1) generatedId = data?.contractId || '';

    const updatedSteps = [...this.steps()];
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      completed: true,
      generatedId
    };
    this.steps.set(updatedSteps);

    if (stepIndex < this.steps().length - 1) {
      this.currentStep.set(stepIndex + 1);
    } else {
      this.onFinish();
    }
  }

  onSaveCurrentStep(): void {
    const stepContent = document.querySelector('.step-content');
    if (stepContent) {
      const formElement = stepContent.querySelector('form');
      if (formElement) {
        formElement.requestSubmit();
        return;
      }
    }
    const anyForm = document.querySelector('form[novalidate]') as HTMLFormElement;
    if (anyForm) {
      anyForm.requestSubmit();
    }
  }

  goToPreviousStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  goToStep(index: number): void {
    const steps = this.steps();
    if (index === this.currentStep() || steps[index]?.completed) {
      this.currentStep.set(index);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onFinish(): void {
    this.snackbarService.showSuccess('Contract created successfully!');
    this.created.emit();
  }
}
