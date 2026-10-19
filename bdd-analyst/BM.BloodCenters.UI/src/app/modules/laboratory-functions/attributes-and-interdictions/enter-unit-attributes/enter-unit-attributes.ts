import {
  Component, OnInit, OnDestroy, inject, signal, effect, ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatTable, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

import { UnitAttributeApiService } from './services/unit-attribute-api.service';
import {
  UnitValidationResult,
  UnitAttributeRow,
  AttributeGroupOption,
  AttributeCodeOption,
  CreateUnitAttributeRequest,
} from './models/unit-attribute.model';

@Component({
  selector: 'app-enter-unit-attributes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatPaginatorModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
  ],
  templateUrl: './enter-unit-attributes.html',
  styleUrl: './enter-unit-attributes.scss',
  providers: [
    UnitAttributeApiService,
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MatPaginatorIntl, useFactory: () => { const intl = new MatPaginatorIntl(); intl.itemsPerPageLabel = 'Rows per page:'; return intl; } },
  ],
})
export class EnterUnitAttributesComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(UnitAttributeApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(UnitIdFieldComponent) unitIdFieldComponent!: UnitIdFieldComponent;
  @ViewChild('attrTable') attrTable!: MatTable<FormGroup>;

  readonly unitValidation = signal<UnitValidationResult | null>(null);
  readonly dataSource = signal<UnitAttributeRow[]>([]);
  readonly isLoading = signal(false);
  readonly isEditMode = signal(false);
  readonly saving = signal(false);
  // SER-01: live region text — bound to aria-live="polite" region in template
  statusAnnouncement = '';
  readonly attributeGroups = signal<AttributeGroupOption[]>([]);

  attributesForm = this.fb.group({
    attributes: this.fb.array([]),
  });

  displayedColumns = ['attribGroup', 'attribGroupDesc', 'attribCode', 'attribCodeDesc', 'actions'];

  // Keyed by FormGroup reference — stable across insert/delete
  private rowCodesMap = new WeakMap<FormGroup, AttributeCodeOption[]>();
  private rowGroupSearchMap = new WeakMap<FormGroup, FormControl>();
  private rowCodeSearchMap = new WeakMap<FormGroup, FormControl>();

  currentCodeScheme = '';
  currentAlertSpFlag = '';

  pageSize = 25;
  pageIndex = 0;
  totalRecords = 0;

  pageHeaderConfig: PageHeaderConfig = {
    title: '',
    subtitle: '',
    breadcrumbs: [
      { label: 'Home', link: '/home' },
    ],
  };

  get attributesArray(): FormArray {
    return this.attributesForm.get('attributes') as FormArray;
  }

  get collectionDateDisplay(): string {
    const val = this.unitValidation();
    if (!val?.collDate) return '-';
    const d = new Date(val.collDate);
    if (isNaN(d.getTime())) return val.collDate;
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
  }

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          ...this.pageHeaderConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onClearAll());
  }

  // --- Unit ID ---

  onUnitValidated(event: UnitValidationResponse): void {
    if (!event.parsedUnitId) return;

    this.currentCodeScheme = event.codeScheme || 'I';
    this.statusAnnouncement = 'Loading attributes…';
    this.isLoading.set(true);

    this.apiService.validateUnit(event.parsedUnitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.unitValidation.set(result);
          this.currentAlertSpFlag = result.alertSpFlag || '';
          this.loadAttributes(result.unitId, result.collDate);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  onUnitCleared(): void {
    this.resetAll();
  }

  // --- Data Loading ---

  private loadAttributes(unitId: string, collDate: string): void {
    const skip = this.pageIndex * this.pageSize;

    this.apiService.getAttributes(unitId, collDate, this.currentCodeScheme, this.pageSize, skip)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource.set(response.data);
          this.totalRecords = response.totalRecords;
          this.rebuildFormArray(response.data);
          this.isLoading.set(false);
          this.statusAnnouncement = `${response.totalRecords} attribute record${response.totalRecords !== 1 ? 's' : ''} loaded.`;

        },
        error: (error) => {
          this.isLoading.set(false);
          if (error.status === 404) {
            this.dataSource.set([]);
            this.totalRecords = 0;
            this.rebuildFormArray([]);
            this.statusAnnouncement = 'No attribute records found for this unit.';
          }

        },
      });
  }

  private rebuildFormArray(data: UnitAttributeRow[]): void {
    this.attributesArray.clear();
    data.forEach(row => {
      this.attributesArray.push(this.createRowFormGroup(row, false));
    });
    this.refreshTable();
  }

  private createRowFormGroup(row: Partial<UnitAttributeRow> | null, isNew: boolean): FormGroup {
    return this.fb.group({
      attribGroup: [row?.attribGroup || '', isNew ? Validators.required : []],
      attribGroupDesc: [{ value: row?.attribGroupDesc || '', disabled: true }],
      attribCode: [row?.attribCode || '', isNew ? Validators.required : []],
      attribCodeDesc: [{ value: row?.attribCodeDesc || '', disabled: true }],
      isNew: [isNew],
    });
  }

  private refreshTable(): void {
    this.attrTable?.renderRows();
  }

  // --- Edit Mode ---

  onToggleEdit(): void {
    this.isEditMode.set(true);
    this.statusAnnouncement = 'Edit mode active. Use Add New Row to insert an attribute.';
    this.pageIndex = 0;

    const newGroup = this.createRowFormGroup(null, true);
    this.attributesArray.insert(0, newGroup);
    this.refreshTable();

    this.apiService.getAttributeGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (groups) => {
          this.attributeGroups.set(groups);

        },
        error: () => {
          this.isEditMode.set(false);
        },
      });
  }

  onCancelEdit(): void {
    this.isEditMode.set(false);
    const val = this.unitValidation();
    if (val) {
      this.loadAttributes(val.unitId, val.collDate);
    }
  }

  onAddAttribute(): void {
    const newGroup = this.createRowFormGroup(null, true);
    this.attributesArray.insert(0, newGroup);
    this.pageIndex = 0;
    this.refreshTable();
    // SER-04: move focus to the new row's first select after render
    setTimeout(() => {
      const firstSelect = document.querySelector<HTMLElement>(
        '.attributes-table mat-select[aria-label="Attribute Group"]'
      );
      firstSelect?.focus();
    }, 50);
  }

  onDeleteAttribute(index: number): void {
    const group = this.attributesArray.at(index) as FormGroup;
    const isNew = group.get('isNew')?.value;

    if (isNew) {
      this.attributesArray.removeAt(index);
      this.refreshTable();
      // SER-04: restore focus after row removal
      setTimeout(() => {
        const nextBtn = document.querySelector<HTMLElement>(
          `.attributes-table tr:nth-child(${index + 2}) button`
        ) ?? document.querySelector<HTMLElement>('.add-new-btn');
        nextBtn?.focus();
      }, 50);
    } else {
      const val = this.unitValidation();
      if (!val) return;

      const attribGroup = group.get('attribGroup')?.value;
      const attribCode = group.get('attribCode')?.value;

      this.saving.set(true);
      this.isLoading.set(true);
      this.apiService.deleteAttribute(val.unitId, attribGroup, attribCode, val.collDate)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackbarService.showSuccess('Attribute deleted successfully');
            this.statusAnnouncement = 'Attribute deleted successfully.';
            this.saving.set(false);
            this.loadAttributes(val.unitId, val.collDate);
          },
          error: () => {
            this.saving.set(false);
            this.isLoading.set(false);
          },
        });
    }
  }

  // --- Dropdown Handling (keyed by FormGroup ref — stable across insert/delete) ---

  getGroupSearchControl(control: FormGroup): FormControl {
    if (!this.rowGroupSearchMap.has(control)) {
      this.rowGroupSearchMap.set(control, new FormControl(''));
    }
    return this.rowGroupSearchMap.get(control)!;
  }

  getFilteredGroups(control: FormGroup): AttributeGroupOption[] {
    const search = this.getGroupSearchControl(control).value?.toLowerCase() || '';
    if (!search) return this.attributeGroups();
    return this.attributeGroups().filter(g =>
      g.code.toLowerCase().includes(search) || g.description.toLowerCase().includes(search)
    );
  }

  getCodeSearchControl(control: FormGroup): FormControl {
    if (!this.rowCodeSearchMap.has(control)) {
      this.rowCodeSearchMap.set(control, new FormControl(''));
    }
    return this.rowCodeSearchMap.get(control)!;
  }

  getFilteredCodes(control: FormGroup): AttributeCodeOption[] {
    const codes = this.rowCodesMap.get(control) || [];
    const search = this.getCodeSearchControl(control).value?.toLowerCase() || '';
    if (!search) return codes;
    return codes.filter(c =>
      c.code.toLowerCase().includes(search) || c.description.toLowerCase().includes(search)
    );
  }

  onGroupChange(control: FormGroup): void {
    const groupCode = control.get('attribGroup')?.value;
    const selectedGroup = this.attributeGroups().find(g => g.code === groupCode);
    control.get('attribGroupDesc')?.setValue(selectedGroup?.description || '');
    control.get('attribCode')?.setValue('');
    control.get('attribCodeDesc')?.setValue('');
    this.rowCodesMap.set(control, []);

    if (groupCode) {
      this.loadCodesForRow(control, groupCode);
    }
  }

  onCodeChange(control: FormGroup): void {
    const codeValue = control.get('attribCode')?.value;
    const codes = this.rowCodesMap.get(control) || [];
    const selected = codes.find(c => c.code === codeValue);
    control.get('attribCodeDesc')?.setValue(selected?.description || '');
  }

  private loadCodesForRow(row: FormGroup, groupCode: string): void {
    this.apiService.getAttributeCodes(groupCode, this.currentAlertSpFlag, this.currentCodeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.rowCodesMap.set(row, codes);

        },
        error: () => {},
      });
  }

  // --- Save ---

  onSaveAll(): void {
    const val = this.unitValidation();
    if (!val) return;

    const newRows: FormGroup[] = [];
    for (let i = 0; i < this.attributesArray.length; i++) {
      const group = this.attributesArray.at(i) as FormGroup;
      if (group.get('isNew')?.value) {
        const attribGroup = group.get('attribGroup')?.value;
        const attribCode = group.get('attribCode')?.value;

        if (!attribGroup || !attribCode) {
          const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
            data: {
              title: 'Warning',
              message: 'Err: 1701: Record must be entered or deleted first – Missing data',
              confirmText: 'OK',
              cancelText: 'CANCEL',
            },
          });

          dialogRef.afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe((result) => {
              if (result) {
                this.onCancelEdit();
              }
            });
          return;
        }

        newRows.push(group);
      }
    }

    if (newRows.length === 0) {
      this.isEditMode.set(false);
      this.snackbarService.showSuccess('Record saved successfully');
            this.statusAnnouncement = 'Attributes saved successfully.';
      const v = this.unitValidation();
      if (v) {
        this.isLoading.set(true);
        this.loadAttributes(v.unitId, v.collDate);
      }
      return;
    }

    this.saving.set(true);
    this.isLoading.set(true);

    const requests = newRows.map(group => {
      const dto: CreateUnitAttributeRequest = {
        unitId: val.unitId,
        collDate: val.collDate,
        attribGroup: group.get('attribGroup')?.value,
        attribCode: group.get('attribCode')?.value,
      };
      return this.apiService.createAttribute(dto, this.currentCodeScheme);
    });

    forkJoin(requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.isEditMode.set(false);
          this.snackbarService.showSuccess('Record saved successfully');
            this.statusAnnouncement = 'Attributes saved successfully.';
          const v = this.unitValidation();
          if (v) {
            this.loadAttributes(v.unitId, v.collDate);
          } else {
            this.isLoading.set(false);
          }
        },
        error: () => {
          this.saving.set(false);
          this.isLoading.set(false);
        },
      });
  }

  // --- Commit Session ---

  onCommitSession(): void {
    this.unitIdFieldComponent?.clear();
    this.resetAll();
  }

  // --- Clear All ---

  onClearAll(): void {
    this.unitIdFieldComponent?.clear();
    this.resetAll();
  }

  private resetAll(): void {
    this.unitValidation.set(null);
    this.dataSource.set([]);
    this.isEditMode.set(false);
    this.saving.set(false);
    this.attributesArray.clear();
    this.attributeGroups.set([]);
    this.currentCodeScheme = '';
    this.currentAlertSpFlag = '';
    this.pageIndex = 0;
    this.totalRecords = 0;
  }

  get hasFormData(): boolean {
    return !!this.unitValidation() || this.unitIdFieldComponent?.parsedUnitId != null;
  }

  // --- Pagination ---

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    const val = this.unitValidation();
    if (val) {
      this.isLoading.set(true);
      this.loadAttributes(val.unitId, val.collDate);
    }
  }
}
