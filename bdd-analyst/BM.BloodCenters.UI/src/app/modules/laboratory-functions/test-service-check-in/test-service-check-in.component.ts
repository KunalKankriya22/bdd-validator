import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TestServiceCheckInApiService } from './services/test-service-check-in-api.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { HeaderService } from '../../../shared/services/header.service';
import { TestServiceContract } from './models/test-service-check-in.model';
import { collectionDateValidator, receivedDateValidator } from './validators/date.validators';

@Component({
  selector: 'app-test-service-check-in',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './test-service-check-in.component.html',
  styleUrls: ['./test-service-check-in.component.scss']
})
export class TestServiceCheckInComponent implements OnInit, OnDestroy {
  // Dependency injection
  private readonly apiService = inject(TestServiceCheckInApiService);
  private readonly fb = inject(FormBuilder);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  // Form
  checkInForm!: FormGroup;

  // Signal-based state
  selectedContract = signal<TestServiceContract | null>(null);
  batchId = signal<string | null>(null);
  isNewBatch = computed(() => this.batchId() === null);
  loading = signal<boolean>(false);
  contractLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.initForm();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.checkInForm = this.fb.group({
      contractId: ['', [Validators.required]],
      batchId: [null],
      collectionDate: ['', [Validators.required, collectionDateValidator]],
      receivedDate: ['', [Validators.required]]
    }, {
      validators: [receivedDateValidator('collectionDate')]
    });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetForm();
      });
  }

  onContractSelected(): void {
    const contractId = this.checkInForm.get('contractId')?.value;
    if (!contractId || contractId.trim() === '') {
      this.selectedContract.set(null);
      return;
    }

    this.contractLoading.set(true);
    this.apiService.validateContract(contractId.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contract) => {
          this.selectedContract.set(contract);
          this.contractLoading.set(false);
          this.snackbarService.showSuccess('Contract loaded successfully');
        },
        error: (err) => {
          this.selectedContract.set(null);
          this.contractLoading.set(false);
          this.snackbarService.showError(err.error?.message || 'Contract not found (Error 1147)');
        }
      });
  }

  onContractBlur(): void {
    this.onContractSelected();
  }

  resetForm(): void {
    this.checkInForm.reset({
      contractId: '',
      batchId: null,
      collectionDate: '',
      receivedDate: ''
    });
    this.selectedContract.set(null);
    this.batchId.set(null);
  }

  get f() {
    return this.checkInForm.controls;
  }
}
