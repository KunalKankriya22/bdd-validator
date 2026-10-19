import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  ReconciliationUnitDto,
  ValidTestResultDto
} from '../models/test-result-reconciliation.model';

@Component({
  selector: 'app-override-test-result-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './override-test-result-panel.html',
  styleUrl: './override-test-result-panel.scss'
})
export class OverrideTestResultPanel implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `override-panel-${OverrideTestResultPanel.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @Input() tbId!: string;
  @Input() testId!: string;
  @Input() testDesc!: string;
  @Input() unit!: ReconciliationUnitDto;
  @Input() validResults: ValidTestResultDto[] = [];

  @Output() closePanel = new EventEmitter<void>();
  @Output() confirmReconciliation = new EventEmitter<{ supervisorResult: string }>();

  protected readonly loading = signal<boolean>(false);
  protected readonly submitted = signal<boolean>(false);
  protected readonly filteredResults = signal<ValidTestResultDto[]>([]);
  protected readonly selectedSupervisorResult = signal<string | null>(null);

  form!: FormGroup;
  resultSearchCtrl = new FormControl<string>('');

  private destroy$ = new Subject<void>();

  constructor(private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
    this.filteredResults.set(this.validResults);

    this.form.get('supervisorResult')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value: string) => {
        this.selectedSupervisorResult.set(value || null);
      });

    this.resultSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        if (!search) {
          this.filteredResults.set(this.validResults);
        } else {
          const lower = search.toLowerCase();
          this.filteredResults.set(
            this.validResults.filter(r =>
              r.resultStatus.toLowerCase().includes(lower) ||
              r.codeDesc.toLowerCase().includes(lower)
            )
          );
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      supervisorResult: ['', [Validators.required]]
    });
  }

  get f() {
    return this.form.controls;
  }

  onClose(): void {
    this.closePanel.emit();
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onConfirm(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    this.confirmReconciliation.emit({
      supervisorResult: this.form.value.supervisorResult
    });
  }

  isTech1Matched(): boolean {
    const selected = this.selectedSupervisorResult();
    if (!selected || !this.unit?.tempResult1) return false;
    return selected === this.unit.tempResult1;
  }

  isTech2Matched(): boolean {
    const selected = this.selectedSupervisorResult();
    if (!selected || !this.unit?.tempResult2 || this.unit.tempResult2 === 'NULL') return false;
    return selected === this.unit.tempResult2;
  }

  isNullMarker(value: string | null | undefined): boolean {
    return !value || value === 'NULL';
  }

  formatUnitId(): string {
    if (!this.unit) return '';

    if (this.unit.checkDigit) {
      return `${this.unit.unitId}-${this.unit.checkDigit}`;
    }
    return this.unit.unitId;
  }
}
