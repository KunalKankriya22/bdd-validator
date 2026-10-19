import {
  Component,
  ChangeDetectionStrategy,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { FilterCriteria, ParameterDatatype } from '../../models/tstparm.model';

@Component({
  selector: 'app-tstparm-filter-panel',
  standalone: true,
  templateUrl: './tstparm-filter-panel.component.html',
  styleUrls: ['./tstparm-filter-panel.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TstparmFilterPanelComponent implements OnInit {
  private static nextId = 0;
  protected readonly componentId = `tstparm-filter-panel-${TstparmFilterPanelComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @Input() currentFilters: FilterCriteria | null = null;
  @Output() apply = new EventEmitter<FilterCriteria>();
  @Output() close = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly dialogData = inject<{ currentFilters: FilterCriteria | null; relatedCodes: string[]; voidCodes: string[] }>(MAT_DIALOG_DATA, { optional: true });

  filterForm!: FormGroup;

  readonly datatypes: ParameterDatatype[] = ['NUMERIC', 'DATETIME', 'DEVICE', 'REAGENT'];
  readonly relatedCodes: string[] = this.dialogData?.relatedCodes ?? [];
  readonly voidCodes: string[] = this.dialogData?.voidCodes ?? [];
  readonly periods = ['Before', 'After'];

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      datatype: [null],
      relatedCode: [null],
      voidCode: [null],
      effDatePeriod: [null],
      effDate: [null],
      termDatePeriod: [null],
      termDate: [null]
    });

    const filters = this.currentFilters ?? this.dialogData?.currentFilters;
    if (filters) {
      this.filterForm.patchValue(filters);
    }
  }

  onApply(): void {
    const raw = this.filterForm.value;
    const filters: FilterCriteria = {};
    if (raw.datatype) filters.datatype = raw.datatype;
    if (raw.relatedCode) filters.relatedCode = raw.relatedCode;
    if (raw.voidCode) filters.voidCode = raw.voidCode;
    if (raw.effDatePeriod) filters.effDatePeriod = raw.effDatePeriod;
    if (raw.effDate) filters.effDate = raw.effDate;
    if (raw.termDatePeriod) filters.termDatePeriod = raw.termDatePeriod;
    if (raw.termDate) filters.termDate = raw.termDate;
    this.apply.emit(filters);
  }

  onClearAll(): void {
    this.filterForm.reset();
  }

  onClose(): void {
    this.close.emit();
  }

  get hasActiveFilters(): boolean {
    return Object.values(this.filterForm.value).some(v => v !== null && v !== undefined);
  }
}
