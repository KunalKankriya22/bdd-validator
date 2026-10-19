import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TextFieldModule } from '@angular/cdk/text-field';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import {
  OverrideDialogData,
  MasterCodeDto,
  SccOverrideRequestDto
} from '../../models/additional-test-scheduling.model';
import { AdditionalTestSchedulingApiService } from '../../services/additional-test-scheduling-api.service';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-override-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TextFieldModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './override-dialog.html',
  styleUrl: './override-dialog.scss'
})
export class OverrideDialogComponent implements OnInit, OnDestroy {
  // Fix #4: typed ViewChild so .focus() calls the MatSelect API, not a raw DOM focus
  @ViewChild('reasonCodeSel') reasonCodeSel?: MatSelect;

  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<OverrideDialogComponent>);
  protected readonly data = inject<OverrideDialogData>(MAT_DIALOG_DATA);
  private readonly apiService = inject(AdditionalTestSchedulingApiService);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  protected overrideForm!: FormGroup;
  // Fix #6: submitting and error are now mutated — spinner and inline error are live
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  // Reason codes (CFRSN) — required
  protected readonly reasonCodes = signal<MasterCodeDto[]>([]);
  protected readonly reasonSearchCtrl = new FormControl('');
  private readonly reasonSearchText = signal('');
  protected readonly filteredReasonCodes = computed(() => {
    const s = this.reasonSearchText().toLowerCase();
    return !s ? this.reasonCodes() : this.reasonCodes().filter(c =>
      c.code.toLowerCase().includes(s) || (c.description?.toLowerCase().includes(s) ?? false)
    );
  });
  // Fix #10: track selected code as a signal so computed description stays reactive
  private readonly selectedReasonCode = signal<string | null>(null);
  protected readonly selectedReasonDesc = computed(() =>
    this.reasonCodes().find(c => c.code === this.selectedReasonCode())?.description ?? null
  );

  // Hold codes (CFHLD) — optional
  protected readonly holdCodes = signal<MasterCodeDto[]>([]);
  protected readonly holdSearchCtrl = new FormControl('');
  private readonly holdSearchText = signal('');
  protected readonly filteredHoldCodes = computed(() => {
    const s = this.holdSearchText().toLowerCase();
    return !s ? this.holdCodes() : this.holdCodes().filter(c =>
      c.code.toLowerCase().includes(s) || (c.description?.toLowerCase().includes(s) ?? false)
    );
  });
  // Fix #10: description below hold code select
  private readonly selectedHoldCode = signal<string | null>(null);
  protected readonly selectedHoldDesc = computed(() => {
    const code = this.selectedHoldCode();
    return code ? (this.holdCodes().find(c => c.code === code)?.description ?? null) : null;
  });

  ngOnInit(): void {
    this.overrideForm = this.fb.group({
      superUserId: ['', Validators.required],
      password:    ['', Validators.required],
      reasonCode:  ['', Validators.required],
      holdCode:    [null],
      // FMB CFCOM is a free-text multiline field; LOV provides optional suggestions
      comments:    ['']
    });

    this.loadLookups();

    // Force uppercase in model (FMB CaseRestriction=Upper)
    this.overrideForm.get('superUserId')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => {
        if (v && v !== v.toUpperCase()) {
          this.overrideForm.get('superUserId')!.setValue(v.toUpperCase(), { emitEvent: false });
        }
      });

    // Fix #10: keep description signals in sync with form value changes
    this.overrideForm.get('reasonCode')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.selectedReasonCode.set(v));

    this.overrideForm.get('holdCode')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.selectedHoldCode.set(v));

    this.reasonSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.reasonSearchText.set(v || ''));

    this.holdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.holdSearchText.set(v || ''));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadLookups(): void {
    const chapterId = this.headerService.getCurrentChapterId();
    this.apiService.getMasterCodes('CFRSN', chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: codes => this.reasonCodes.set(codes),
        error: () => this.error.set('Failed to load reason codes. Please close and try again.')
      });
    this.apiService.getMasterCodes('CFHLD', chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: codes => this.holdCodes.set(codes), error: () => {} });
  }

  // Fix #4: advance focus to Reason Code select using MatSelect.focus() (not raw DOM)
  onPasswordEnter(event: Event): void {
    event.preventDefault();
    this.reasonCodeSel?.focus();
  }

  // Fix #1: API call is made inside the dialog.
  // On credential failure the server error is shown inline; dialog stays open for retry.
  // Only closes (with true) after the server confirms the override.
  async onConfirm(): Promise<void> {
    if (this.overrideForm.invalid) {
      this.overrideForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);

    const { superUserId, password, reasonCode, holdCode, comments } = this.overrideForm.value;
    const dto: SccOverrideRequestDto = {
      unitId: this.data.unitId,
      testId: this.data.testId,
      chapterId: this.data.chapterId,
      superUserId,
      password,
      reasonCode,
      holdCode: holdCode || null,
      comments,
      skip: false
    };

    try {
      await firstValueFrom(this.apiService.submitSccOverride(dto));
      this.dialogRef.close(true);
    } catch (err: any) {
      this.error.set(err?.error?.message || err?.message || 'Override failed. Check credentials and try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  // FMB KEY-EXIT: sets status_flag='U' (skip this test's override)
  async onSkip(): Promise<void> {
    this.submitting.set(true);
    this.error.set(null);

    const dto: SccOverrideRequestDto = {
      unitId: this.data.unitId,
      testId: this.data.testId,
      chapterId: this.data.chapterId,
      superUserId: '',
      password: '',
      reasonCode: '',
      holdCode: null,
      comments: '',
      skip: true
    };

    try {
      await firstValueFrom(this.apiService.submitSccOverride(dto));
      this.dialogRef.close(false);
    } catch (err: any) {
      this.error.set(err?.error?.message || err?.message || 'Skip failed. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }
}
