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
 * Edit Interdiction Panel Component
 * Slide-out panel for editing an existing interdiction code
 */
@Component({
  selector: 'app-edit-interdiction-panel',
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
  templateUrl: './edit-interdiction-panel.html',
  styleUrl: './edit-interdiction-panel.scss',
})
export class EditInterdictionPanel implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `edit-interdiction-panel-${EditInterdictionPanel.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependencies
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(GroupInterdictionApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  // Inputs
  interdiction = input.required<InterdictionDto>();
  activeInterdictions = input.required<ValidInterdictionDto[]>();
  controlMode = input.required<ControlMode>();
  selectionValue = input.required<string>();

  // Outputs
  closed = output<boolean>(); // Emits true if saved, false if cancelled

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

  // Computed values
  protected readonly canSave = computed(() => !this.loading() && this.form?.valid);

  ngOnInit(): void {
    this.initForm();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    const currentInterdiction = this.interdiction();

    this.form = this.fb.group({
      interdictionCode: [currentInterdiction.interCode, [Validators.required]],
    });

    // Set initial selected interdiction
    const interdiction = this.activeInterdictions().find(
      (i) => i.interCode === currentInterdiction.interCode
    );
    this.selectedInterdiction.set(interdiction || null);
  }

  private setupFormListeners(): void {
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

  protected onSave(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      this.snackbarService.showError('Please correct the errors in the form.');
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    const newCode = this.form.get('interdictionCode')?.value;
    const oldCode = this.interdiction().interCode;

    if (newCode === oldCode) {
      this.snackbarService.showInfo('No changes were made.');
      this.closed.emit(false);
      return;
    }

    this.loading.set(true);

    // NOTE: True edit (remove old + add new) requires a backend release/delete endpoint that does not yet exist.
    // Currently this only places the new interdiction code without removing the old one.

    const request: PlaceGroupInterdictionRequestDto = {
      controlMode: this.controlMode(),
      selectionValue: this.selectionValue(),
      interdictionCodes: [newCode],
    };

    this.apiService
      .placeInterdictions(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.snackbarService.showSuccess('Interdiction updated successfully.');
          this.loading.set(false);
          this.closed.emit(true);
        },
        error: (err) => {
          console.error('Error updating interdiction:', err);
          const errorMessage = err?.error?.message || 'Failed to update interdiction.';
          this.snackbarService.showError(errorMessage);
          this.loading.set(false);
        },
      });
  }
}
