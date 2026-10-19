import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { MaintainGroupInterdictionsService } from '../../services/maintain-group-interdictions.service';
import {
  RemoveInterdictionDialogData,
  RemoveInterdictionDialogResult,
  GroupInterdictionLookupDto
} from '../../models/maintain-group-interdictions.model';
import { RemoveInterdictionConfirmationDialogComponent } from './remove-interdiction-confirmation-dialog.component';

@Component({
  selector: 'app-remove-interdiction-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './remove-interdiction-dialog.component.html',
  styleUrls: ['./remove-interdiction-dialog.component.scss']
})
export class RemoveInterdictionDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MaintainGroupInterdictionsService);
  private readonly dialogRef = inject(MatDialogRef<RemoveInterdictionDialogComponent>);
  private readonly dialog = inject(MatDialog);
  readonly data: RemoveInterdictionDialogData = inject(MAT_DIALOG_DATA);

  context: 'donor' | 'donation' = 'donation';
  reasonForm!: FormGroup;
  reasonSearchControl = new FormControl<string>('');
  reasons = signal<GroupInterdictionLookupDto[]>([]);
  filteredReasons = signal<GroupInterdictionLookupDto[]>([]);
  selectedReasonCode = signal<string>('');
  selectedReasonDescription = signal<string>('');
  isFormValid = signal<boolean>(false);

  isRemoveDisabled = computed(() => {
    return !this.selectedReasonCode() || !this.isFormValid();
  });

  ngOnInit(): void {
    if (this.data?.context) {
      this.context = this.data.context;
    }

    this.reasonForm = this.fb.group({
      reasonCode: ['', Validators.required]
    });

    this.loadReasons();
    this.setupReasonSearch();

    this.reasonForm.get('reasonCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(code => {
        this.selectedReasonCode.set(code || '');
        const reason = this.reasons().find(r => r.code === code);
        this.selectedReasonDescription.set(reason?.description || '');
      });

    // Track form validity
    this.reasonForm.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isFormValid.set(this.reasonForm.valid);
      });

    // Set initial validity
    this.isFormValid.set(this.reasonForm.valid);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRemove(): void {
    if (this.reasonForm.invalid) {
      this.reasonForm.markAllAsTouched();
      return;
    }

    // Show confirmation dialog
    const confirmDialogRef = this.dialog.open(RemoveInterdictionConfirmationDialogComponent, {
      width: '490px',
      maxWidth: '90vw',
      hasBackdrop: true,
      disableClose: true,
      panelClass: 'remove-interdiction-confirm-dialog'
    });

    confirmDialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed === true) {
          const result: RemoveInterdictionDialogResult = {
            confirmed: true,
            reasonCode: this.reasonForm.get('reasonCode')?.value,
            reasonDescription: this.selectedReasonDescription()
          };
          this.dialogRef.close(result);
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  private setupReasonSearch(): void {
    this.reasonSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        this.filteredReasons.set(this.filterReasons(search));
      });
  }

  private filterReasons(search: string | null): GroupInterdictionLookupDto[] {
    if (!search || search.length === 0) {
      return this.reasons();
    }
    const searchLower = search.toLowerCase();
    return this.reasons().filter(r =>
      r.code.toLowerCase().includes(searchLower) ||
      (r.description || '').toLowerCase().includes(searchLower)
    );
  }

  private loadReasons(): void {
    const reasonObservable = this.context === 'donor'
      ? this.service.getDonorTermReasons()
      : this.service.getTermReasons();

    reasonObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reasons) => {
          this.reasons.set(reasons);
          this.filteredReasons.set(reasons);
        },
        error: () => {
          this.reasons.set([]);
          this.filteredReasons.set([]);
        }
      });
  }
}
