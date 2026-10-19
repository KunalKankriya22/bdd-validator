import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { ValidAntigenOption, AntigenCriteriaPair } from '../../models/products-with-antigens.models';

export interface AntigenFilterDialogData {
  validAntigens: ValidAntigenOption[];
  currentCriteria: AntigenCriteriaPair[];
}

export interface AntigenFilterDialogResult {
  criteria: AntigenCriteriaPair[];
}

interface ResultOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-antigen-filter-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './antigen-filter-dialog.component.html',
  styleUrl: './antigen-filter-dialog.component.scss'
})
export class AntigenFilterDialogComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AntigenFilterDialogComponent>);
  readonly data = inject<AntigenFilterDialogData>(MAT_DIALOG_DATA);

  filterForm!: FormGroup;
  readonly MAX_ROWS = 14;

  readonly resultOptions: ResultOption[] = [
    { value: 'N', label: 'Negative' },
    { value: 'P', label: 'Positive' }
  ];

  readonly antigenSearchCtrl = new FormControl<string>('');
  readonly resultSearchCtrl = new FormControl<string>('');

  private readonly antigenSearch = signal<string>('');
  private readonly resultSearch = signal<string>('');

  readonly filteredAntigens = computed(() => {
    const search = this.antigenSearch().toLowerCase();
    const antigens = this.data.validAntigens || [];
    if (!search) return antigens;
    return antigens.filter(a =>
      a.testId.toLowerCase().includes(search) ||
      (a.testDescription?.toLowerCase().includes(search) ?? false)
    );
  });

  readonly filteredResults = computed(() => {
    const search = this.resultSearch().toLowerCase();
    if (!search) return this.resultOptions;
    return this.resultOptions.filter(r =>
      r.value.toLowerCase().includes(search) ||
      r.label.toLowerCase().includes(search)
    );
  });

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initForm();
    this.subscribeToSearchControls();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      criteria: this.fb.array([])
    });

    // Initialize with existing criteria or empty rows
    if (this.data.currentCriteria && this.data.currentCriteria.length > 0) {
      this.data.currentCriteria.forEach(c => {
        this.addRow(c.antigenId, c.result);
      });
    }

    // Ensure we have exactly MAX_ROWS rows
    for (let i = this.criteriaArray.length; i < this.MAX_ROWS; i++) {
      this.addRow();
    }
  }

  private subscribeToSearchControls(): void {
    this.antigenSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.antigenSearch.set(value || ''));

    this.resultSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.resultSearch.set(value || ''));
  }

  get criteriaArray(): FormArray {
    return this.filterForm.get('criteria') as FormArray;
  }

  addRow(antigenId = '', result = ''): void {
    if (this.criteriaArray.length >= this.MAX_ROWS) return;

    const row = this.fb.group({
      antigenId: [antigenId],
      result: [result]
    });

    this.criteriaArray.push(row);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSelectAndRetrieve(): void {
    const formValue = this.filterForm.value;

    // Filter out empty rows and map to criteria pairs
    const validCriteria: AntigenCriteriaPair[] = formValue.criteria
      .filter((row: any) => row.antigenId && row.result)
      .map((row: any) => ({
        antigenId: row.antigenId,
        result: row.result as 'P' | 'N'
      }));

    this.dialogRef.close({ criteria: validCriteria } as AntigenFilterDialogResult);
  }
}
