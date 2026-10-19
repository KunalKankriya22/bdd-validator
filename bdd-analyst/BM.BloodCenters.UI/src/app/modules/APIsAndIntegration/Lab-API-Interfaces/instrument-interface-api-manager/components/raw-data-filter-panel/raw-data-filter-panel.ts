import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { InstrumentInterfaceService } from '../../services/instrument-interface.service';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

export interface RawDataFilterValue {
  fileId: string | null;
}

@Component({
  selector: 'app-raw-data-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './raw-data-filter-panel.html',
  styleUrls: ['./raw-data-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RawDataFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: RawDataFilterValue | null = null;
  @Input() chapterId: string = '';
  @Input() instrumentId: string = '';
  @Input() rawDataList: any[] = [];
  @Output() apply = new EventEmitter<RawDataFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;
  hasChanges = false;
  hasActiveFilters = false;

  fileIdOptions: string[] = [];
  filteredFileIdOptions: string[] = [];
  loadingFileIds = false;

  readonly fileIdSearchControl = new FormControl('');

  private appliedFilterSnapshot!: string;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private instrumentService: InstrumentInterfaceService
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      fileId: [this.currentFilters?.fileId || null]
    });

    this.appliedFilterSnapshot = this.normalizeFormValue(this.filterForm.value);
    this.hasActiveFilters = this.checkHasActiveFilters();

    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.hasChanges = this.normalizeFormValue(this.filterForm.value) !== this.appliedFilterSnapshot;
        this.hasActiveFilters = this.checkHasActiveFilters();
        this.cdr.markForCheck();
      });

    this.setupFileIdSearch();
    this.loadFileIds();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private normalizeFormValue(formValue: any): string {
    return JSON.stringify({
      fileId: formValue.fileId || null
    });
  }

  private checkHasActiveFilters(): boolean {
    const formValue = this.filterForm.value;
    return !!(formValue.fileId);
  }

  private setupFileIdSearch(): void {
    this.fileIdSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        if (search && search.length >= 1) {
          const lower = search.toLowerCase();
          this.filteredFileIdOptions = this.fileIdOptions.filter(opt =>
            opt.toLowerCase().includes(lower)
          );
        } else {
          this.filteredFileIdOptions = [...this.fileIdOptions];
        }
        this.cdr.markForCheck();
      });
  }

  loadFileIds(): void {
    // Extract unique File IDs from the raw data list
    if (this.rawDataList && this.rawDataList.length > 0) {
      const uniqueFileIds = [...new Set(this.rawDataList.map((item: any) => item.fileId))];
      this.fileIdOptions = uniqueFileIds.filter(id => id).sort();
      this.filteredFileIdOptions = [...this.fileIdOptions];
      this.loadingFileIds = false;
      this.cdr.markForCheck();
    } else {
      // Fallback to API call if no raw data is available
      if (!this.chapterId || !this.instrumentId) {
        return;
      }

      this.loadingFileIds = true;
      this.instrumentService
        .getFileIds(this.chapterId, this.instrumentId, 'both')
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.fileIdOptions = response.data?.map((item: any) => item.fileId || item) || [];
            this.filteredFileIdOptions = [...this.fileIdOptions];
            this.loadingFileIds = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.loadingFileIds = false;
            this.cdr.markForCheck();
          }
        });
    }
  }

  onApply(): void {
    const formValue = this.filterForm.value;

    const filters: RawDataFilterValue = {
      fileId: formValue.fileId || null
    };

    this.appliedFilterSnapshot = this.normalizeFormValue(this.filterForm.value);
    this.hasChanges = false;
    this.cdr.markForCheck();

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      fileId: null
    });
    this.fileIdSearchControl.reset();
    this.filteredFileIdOptions = [...this.fileIdOptions];
  }

  onClose(): void {
    this.close.emit();
  }
}
