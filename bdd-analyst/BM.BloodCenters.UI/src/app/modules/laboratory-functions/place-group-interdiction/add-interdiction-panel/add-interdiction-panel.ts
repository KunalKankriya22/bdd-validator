import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { SnackbarService } from '@shared/services/snackbar.service';
import { GroupInterdictionApiService } from '../services/group-interdiction-api.service';
import {
  ValidInterdictionDto,
  InterdictionDto,
  ControlMode,
  PlaceGroupInterdictionRequestDto,
} from '../models/group-interdiction.model';

/**
 * Add Interdiction Panel Component
 * Slide-out panel for adding interdiction codes to a group
 */
@Component({
  selector: 'app-add-interdiction-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './add-interdiction-panel.html',
  styleUrl: './add-interdiction-panel.scss',
})
export class AddInterdictionPanel implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `add-interdiction-panel-${AddInterdictionPanel.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependencies
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(GroupInterdictionApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  // Inputs
  activeInterdictions = input.required<ValidInterdictionDto[]>();
  currentInterdictions = input.required<InterdictionDto[]>();
  controlMode = input.required<ControlMode>();
  selectionValue = input.required<string>();

  // Outputs
  closed = output<boolean>();
  interdictionPlaced = output<InterdictionDto>();

  // Form
  form!: FormGroup;

  // Search
  protected readonly interdictionSearchCtrl = new FormControl('');
  private readonly interdictionSearch = signal('');
  protected readonly filteredInterdictions = computed(() => {
    const search = this.interdictionSearch().toLowerCase();
    const all = [...this.activeInterdictions()].sort((a, b) => a.interCode.localeCompare(b.interCode));
    if (!search) return all;
    return all.filter(i => i.interCode.toLowerCase().startsWith(search));
  });

  // Signals
  protected readonly loading = signal<boolean>(false);
  protected readonly submitted = signal<boolean>(false);
  protected readonly selectedInterdiction = signal<ValidInterdictionDto | null>(null);
  protected readonly formValid = signal(false);

  // Computed values
  protected readonly canSave = computed(() => !this.loading() && this.formValid());

  ngOnInit(): void {
    this.initForm();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      interdictionCode: [null, [Validators.required]],
    });
  }

  private setupFormListeners(): void {
    this.form.statusChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.formValid.set(this.form.valid));

    this.interdictionSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.interdictionSearch.set(v || ''));

    this.form.get('interdictionCode')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((code) => {
      const interdiction = this.activeInterdictions().find((i) => i.interCode === code);
      this.selectedInterdiction.set(interdiction || null);
    });
  }

  protected get f() {
    return this.form.controls;
  }

  protected onCancel(): void {
    this.closed.emit(false);
  }

  protected onAdd(createAnother: boolean = false): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      this.snackbarService.showError('Please correct the errors in the form.');
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    // Check for duplicate interdiction code
    const selectedCode = this.form.get('interdictionCode')?.value;
    const isDuplicate = this.currentInterdictions().some(i => i.interCode === selectedCode);

    if (isDuplicate) {
      this.snackbarService.showError('0069: Duplicate values.');
      return;
    }

    this.loading.set(true);

    const isCollDate = this.controlMode() === 'COLL DATE';
    const request: PlaceGroupInterdictionRequestDto = {
      controlMode: this.controlMode(),
      selectionValue: isCollDate ? undefined : this.selectionValue(),
      collectionDate: isCollDate ? this.selectionValue() : undefined,
      interdictionCodes: [this.form.get('interdictionCode')?.value],
    };

    this.apiService
      .placeInterdictions(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const selected = this.selectedInterdiction();
          if (!selected) {
            this.snackbarService.showError('Unable to determine interdiction details.');
            this.loading.set(false);
            return;
          }

          this.snackbarService.showSuccess('Unit interdiction placed successfully.');
          this.loading.set(false);

          const placed: InterdictionDto = {
            interCode: selected.interCode,
            interDesc: selected.interDesc,
            interType: selected.interType,
          };
          this.interdictionPlaced.emit(placed);

          if (createAnother) {
            this.form.reset();
            this.submitted.set(false);
            this.selectedInterdiction.set(null);
          } else {
            this.closed.emit(true);
          }
        },
        error: (err) => {
          console.error('Error placing interdiction:', err);
          const errorMessage = err?.error?.message || 'Failed to place interdiction.';
          this.snackbarService.showError(errorMessage);
          this.loading.set(false);
        },
      });
  }

  protected onAddAndCreateAnother(): void {
    this.onAdd(true);
  }
}
