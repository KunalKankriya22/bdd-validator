import {
  Component,
  inject,
  signal,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import moment from 'moment';

import { DD_MON_YYYY_FORMATS } from '../../../../../../shared/date/date-formats';
import { ContractFilter } from '../../../models/regional-testing-contract.models';

/**
 * Filter Dialog Component
 * Dialog for filtering regional testing contracts
 */
@Component({
  selector: 'app-filter-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatIconModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './filter-dialog.component.html',
  styleUrl: './filter-dialog.component.scss'
})
export class FilterDialogComponent implements OnInit {
  private static nextId = 0;
  protected readonly componentId = `filter-dialog-${FilterDialogComponent.nextId++}`;

  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<FilterDialogComponent>);

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  form!: FormGroup;

  // TODO: Replace with actual chapter lookup from API
  protected readonly chapters = signal([
    { chapterId: 'All', chapterName: 'All' },
    { chapterId: 'OBK', chapterName: 'OBK' },
    { chapterId: 'DAL', chapterName: 'DAL' },
    { chapterId: 'EX', chapterName: 'EX' },
    { chapterId: 'MG', chapterName: 'MG' }
  ]);

  protected readonly periodOptions = signal([
    { code: 'effectiveDate', description: 'Effective Date' },
    { code: 'terminationDate', description: 'Termination Date' }
  ]);

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      clientChapter: ['All'],
      periodAfter: ['effectiveDate'],
      periodAfterDate: [null],
      periodBefore: ['terminationDate'],
      periodBeforeDate: [null]
    });
  }

  get f() {
    return this.form.controls;
  }

  onClearAll(): void {
    this.form.reset({
      clientChapter: 'All',
      periodAfter: 'effectiveDate',
      periodAfterDate: null,
      periodBefore: 'terminationDate',
      periodBeforeDate: null
    });
  }

  onApply(): void {
    const formValue = this.form.value;

    const filter: ContractFilter = {
      clientChapter: formValue.clientChapter !== 'All' ? formValue.clientChapter : null,
      periodAfter: formValue.periodAfter,
      periodBefore: formValue.periodBefore,
      effectiveDateAfter: formValue.periodAfter === 'effectiveDate' && formValue.periodAfterDate
        ? moment(formValue.periodAfterDate).format('YYYY-MM-DD')
        : null,
      effectiveDateBefore: formValue.periodBefore === 'effectiveDate' && formValue.periodBeforeDate
        ? moment(formValue.periodBeforeDate).format('YYYY-MM-DD')
        : null,
      terminationDateAfter: formValue.periodAfter === 'terminationDate' && formValue.periodAfterDate
        ? moment(formValue.periodAfterDate).format('YYYY-MM-DD')
        : null,
      terminationDateBefore: formValue.periodBefore === 'terminationDate' && formValue.periodBeforeDate
        ? moment(formValue.periodBeforeDate).format('YYYY-MM-DD')
        : null
    };

    this.dialogRef.close(filter);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
