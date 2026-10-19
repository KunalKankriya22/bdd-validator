import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  OnDestroy,
  Output,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, startWith, takeUntil } from 'rxjs';
import type { CellCodeItem, CellCountRow } from '../models/enter-component-differential.model';

@Component({
  selector: 'app-add-edit-cell-count',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './add-edit-cell-count.html',
  styleUrls: ['./add-edit-cell-count.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditCellCountComponent implements OnInit, OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: CellCountRow | null = null;
  @Input() cellCodes: CellCodeItem[] = [];
  @Input() saving = false;

  @Output() save = new EventEmitter<{ cellCode: string; cellCount: number }>();
  @Output() saveAndCreateAnother = new EventEmitter<{ cellCode: string; cellCount: number }>();
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  isSubmitting = false;
  savingAction: 'save' | 'saveAndAnother' | null = null;
  cellDescription = '--';

  readonly cellCodeSearch = new FormControl('');
  filteredCellCodes: CellCodeItem[] = [];

  ngOnInit(): void {
    this.initializeForm();
    this.setupCellCodeSearch();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cellCodes']) {
      this.filteredCellCodes = [...this.cellCodes];
    }
    if ((changes['mode'] || changes['data']) && this.form) {
      this.initializeForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    if (this.mode === 'edit' && this.data) {
      const formatted = this.data.cellCount != null ? this.data.cellCount.toFixed(2) : '';
      this.form = this.fb.group({
        cellCode: [this.data.cellCode, [Validators.required]],
        cellCount: [formatted, [Validators.required, Validators.pattern(/^\d{1,3}(\.\d{1,2})?$/), Validators.min(0), Validators.max(100)]],
      });
      this.cellDescription = this.data.cellCodeDesc || '--';
    } else {
      this.form = this.fb.group({
        cellCode: ['', [Validators.required]],
        cellCount: ['', [Validators.required, Validators.pattern(/^\d{1,3}(\.\d{1,2})?$/), Validators.min(0), Validators.max(100)]],
      });
      this.cellDescription = '--';
    }

    this.isSubmitting = false;
    this.savingAction = null;
    this.cellCodeSearch.setValue('', { emitEvent: true });
    this.cdr.markForCheck();
  }

  private setupCellCodeSearch(): void {
    this.cellCodeSearch.valueChanges.pipe(startWith(''), takeUntil(this.destroy$)).subscribe(q => {
      const s = (q || '').toLowerCase();
      this.filteredCellCodes = s
        ? this.cellCodes.filter(c => c.cellCode.toLowerCase().includes(s) || c.description.toLowerCase().includes(s))
        : [...this.cellCodes];
      this.cdr.markForCheck();
    });
  }

  onCellCodeDropdownOpenChange(opened: boolean): void {
    if (opened) {
      this.filteredCellCodes = [...this.cellCodes];
    } else {
      this.cellCodeSearch.setValue('', { emitEvent: false });
    }
  }

  onCellCodeChange(cellCode: string): void {
    const match = this.cellCodes.find((c) => c.cellCode === cellCode);
    this.cellDescription = match?.description ?? '--';
  }

  formatCellCount(): void {
    const val = this.form.get('cellCount')?.value;
    if (val != null && val !== '') {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        this.form.patchValue({ cellCount: num.toFixed(2) }, { emitEvent: false });
      }
    }
  }

  onSubmit(): void {
    if (this.isSubmitting || this.form.invalid) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.formatCellCount();
    this.isSubmitting = true;
    this.savingAction = 'save';
    const formValue = this.form.getRawValue();
    this.save.emit({ cellCode: formValue.cellCode, cellCount: parseFloat(formValue.cellCount) });
  }

  onSaveAndCreateAnother(): void {
    if (this.isSubmitting || this.form.invalid) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.formatCellCount();
    this.isSubmitting = true;
    this.savingAction = 'saveAndAnother';
    const formValue = this.form.getRawValue();
    this.saveAndCreateAnother.emit({ cellCode: formValue.cellCode, cellCount: parseFloat(formValue.cellCount) });
  }

  onClose(): void {
    this.close.emit();
  }

  resetForm(): void {
    this.form.reset({ cellCode: '', cellCount: '' });
    this.cellDescription = '--';
    this.isSubmitting = false;
    this.savingAction = null;
    this.cellCodeSearch.setValue('', { emitEvent: true });
    Object.keys(this.form.controls).forEach((key) => {
      this.form.get(key)?.markAsUntouched();
      this.form.get(key)?.markAsPristine();
    });
    this.cdr.markForCheck();
  }

  resetSubmitting(): void {
    this.isSubmitting = false;
    this.savingAction = null;
    this.cdr.markForCheck();
  }
}
