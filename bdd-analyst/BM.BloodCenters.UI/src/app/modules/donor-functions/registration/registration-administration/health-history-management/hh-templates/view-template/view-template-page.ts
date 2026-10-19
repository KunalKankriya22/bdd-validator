import { Component, OnInit, OnDestroy, inject, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, ErrorStateMatcher } from '@angular/material/core';
import moment from 'moment';
import { Subject, takeUntil, finalize } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { MenuService } from '@shared/services/menu.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableColumn } from '@shared/interfaces/data-table.interface';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { ROUTE_REGISTRY } from 'src/app/core/constants/route-registry';
import { RouteKey } from 'src/app/core/constants/route-keys';

import { HealthHistoryService } from '../../services/health-history.service';
import { HHTemplateModel, HHTemplateQuestionDto } from '../../models/health-history.model';

@Component({
  selector: 'app-view-template-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
    DataTable
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './view-template-page.html',
  styleUrls: ['./view-template-page.scss']
})
export class ViewTemplatePage implements OnInit, OnDestroy {
  @ViewChild('termDateInput', { read: ElementRef }) termDateInput!: ElementRef<HTMLInputElement>;

  private destroy$ = new Subject<void>();
  private router = inject(Router);
  private menuService = inject(MenuService);
  private hhService = inject(HealthHistoryService);
  private snackBar = inject(MatSnackBar);
  private chapterTimezoneService = inject(ChapterTimezoneService);
  private dateAdapter = inject(DateAdapter);

  private readonly hhManagementPath = ROUTE_REGISTRY[RouteKey.HealthHistoryManagement].path;
  private readonly backLink = `${this.hhManagementPath}?tab=2`;

  templateData: HHTemplateModel | null = null;
  assignedQuestions: HHTemplateQuestionDto[] = [];
  isLoading = false;
  isSaving = false;

  termDateControl = new FormControl<moment.Moment | null>(null);
  today!: Date;
  isEditable = false;
  isTermDateDirty = false;

  termDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      return (control.touched || control.dirty) && !!this.getTermDateError();
    }
  };

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Health History Management', link: this.backLink },
      { label: '', link: null }
    ],
    title: '',
    subtitle: '',
    actions: []
  };

  detailTableConfig: DataTableConfig = {
    columns: this.getDetailColumns(),
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    stickyHeader: true,
    showPagination: true,
    emptyMessage: 'No questions assigned'
  };

  constructor() {
    this.loadRouteState();

    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();
      if (menuItems.length > 0) {
        const menuItem = this.menuService.findMenuItemByPath(this.hhManagementPath);
        if (menuItem && this.templateData) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: '/home' },
              { label: menuItem.label, link: this.backLink },
              { label: this.templateData.templateId, link: null }
            ]
          };
        }
      }
    });
  }

  ngOnInit(): void {
    if (!this.templateData) {
      this.router.navigate([this.hhManagementPath], { queryParams: { tab: 2 } });
      return;
    }

    this.today = this.chapterTimezoneService.getChapterLocalDate().toDate();

    const status = this.templateData.status?.toUpperCase();
    this.isEditable = status === 'ACTIVE' || status === 'FUTURE';

    if (this.isEditable && this.templateData.terminationDate) {
      const parsed = moment.utc(this.templateData.terminationDate);
      if (parsed.isValid()) {
        this.termDateControl.setValue(parsed);
      }
    }

    this.termDateControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isTermDateDirty = true;
      });

    this.loadTemplateQuestions();
    this.headerConfig = {
      ...this.headerConfig,
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: 'Health History Management', link: this.backLink },
        { label: this.templateData.templateId, link: null }
      ]
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRouteState(): void {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;
    if (state?.data) {
      this.templateData = state.data;
    }
  }

  private loadTemplateQuestions(): void {
    if (!this.templateData) return;
    this.isLoading = true;

    this.hhService.getTemplateQuestions(this.templateData.templateId, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (questions) => {
          this.assignedQuestions = questions;
          this.detailTableConfig = {
            ...this.detailTableConfig,
            pagination: {
              ...this.detailTableConfig.pagination!,
              totalRecords: questions.length
            }
          };
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.assignedQuestions = [];
        }
      });
  }

  onUpdateTermDate(): void {
    if (!this.templateData || !this.isEditable) return;

    this.termDateControl.markAsTouched();
    const error = this.getTermDateError();
    if (error) return;

    const termDate = this.termDateControl.value;
    if (!termDate || !moment.isMoment(termDate) || !termDate.isValid()) {
      this.termDateControl.setErrors({ invalidDate: true });
      return;
    }

    this.isSaving = true;
    const formattedDate = termDate.format('YYYY-MM-DD');

    this.hhService.updateTemplateTermDate(
      this.templateData.templateId,
      this.templateData.donationType,
      formattedDate
    )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.isSaving = false; })
      )
      .subscribe({
        next: () => {
          this.templateData!.terminationDate = formattedDate;
          this.isTermDateDirty = false;

          this.snackBar.open('Termination date updated successfully.', 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          this.loadTemplateQuestions();
        },
        error: (error) => {
          const errorBody = error?.error || error;
          const errorMessage = errorBody?.message || 'Failed to update termination date.';

          this.snackBar.open(errorMessage, 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  onTermDateInput(): void {
    const control = this.termDateControl;
    const inputElement = this.termDateInput?.nativeElement;
    const inputValue = inputElement?.value?.trim() || '';

    control.markAsTouched();
    control.markAsDirty();

    if (!inputValue) {
      if (control.hasError('pastDate') || control.hasError('invalidDate')) {
        control.setErrors(null);
      }
      return;
    }

    const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
      ? DD_MON_YYYY_FORMATS.parse.dateInput
      : [DD_MON_YYYY_FORMATS.parse.dateInput];

    const parsed = this.dateAdapter.parse(inputValue, formats);

    if (parsed && moment.isMoment(parsed) && parsed.isValid()) {
      const chapterToday = this.chapterTimezoneService.getChapterLocalDate().startOf('day');
      if (parsed.isBefore(chapterToday)) {
        control.setErrors({ pastDate: true });
      } else if (control.hasError('pastDate')) {
        control.setErrors(null);
      }
    }
  }

  onTermDateChange(event: any): void {
    const selectedDate = event.value;
    if (selectedDate && moment.isMoment(selectedDate)) {
      const chapterToday = this.chapterTimezoneService.getChapterLocalDate().startOf('day');
      if (selectedDate.isBefore(chapterToday)) {
        this.termDateControl.setErrors({ pastDate: true });
      }
    }
  }

  onTermDateBlur(): void {
    setTimeout(() => {
      const control = this.termDateControl;
      const inputElement = this.termDateInput?.nativeElement;
      const inputValue = inputElement?.value?.trim() || '';

      control.markAsTouched();

      const chapterToday = this.chapterTimezoneService.getChapterLocalDate().startOf('day');

      if (inputValue && !control.value) {
        const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
          ? DD_MON_YYYY_FORMATS.parse.dateInput
          : [DD_MON_YYYY_FORMATS.parse.dateInput];

        const parsed = this.dateAdapter.parse(inputValue, formats);

        if (parsed && moment.isMoment(parsed) && parsed.isValid()) {
          if (parsed.isBefore(chapterToday)) {
            control.setErrors({ pastDate: true });
          } else {
            control.setValue(parsed);
          }
        } else {
          control.setErrors({ invalidDate: true });
        }
      } else if (control.value) {
        const dateValue = moment.isMoment(control.value) ? control.value : moment(control.value);
        if (dateValue.isValid() && dateValue.isBefore(chapterToday)) {
          control.setErrors({ pastDate: true });
        }
      }
    }, 100);
  }

  getTermDateError(): string {
    const control = this.termDateControl;
    if (!control) return '';

    if (control.hasError('pastDate')) {
      return 'Termination Date cannot be in the past';
    }

    if (control.hasError('invalidDate')) {
      return 'Termination Date is invalid';
    }

    if (control.hasError('matDatepickerParse')) {
      return 'Termination Date is invalid';
    }

    const inputElement = this.termDateInput?.nativeElement;
    const hasInputValue = inputElement && inputElement.value && inputElement.value.trim() !== '';
    if (hasInputValue && !control.value) {
      return 'Termination Date is invalid';
    }

    return '';
  }

  private getDetailColumns(): TableColumn[] {
    return [
      { key: 'questionCode', header: 'Question Code', sortable: true, width: '110px' },
      { key: 'screenerAsk', header: 'Ask', width: '60px' },
      { key: 'abbrFlag', header: 'Abbreviation Flag', width: '120px' },
      { key: 'abbrDispSeq', header: 'Abbreviated Sequence', width: '140px' },
      { key: 'repeatHhFlag', header: 'Repeated', width: '90px' },
      { key: 'gender', header: 'Sex', width: '60px' },
      { key: 'displayOrder', header: 'Sequence', width: '90px' },
      { key: 'sortSequence', header: 'Question number', width: '120px' },
      { key: 'parentQuestionCode', header: 'Parent Question', width: '130px' },
      { key: 'parentRespFlag', header: 'Response', width: '80px' },
      { key: 'subQuestionFlag', header: 'Sub Flag', width: '80px' },
      { key: 'gotoNotes', header: 'Go To Notes', width: '140px' },
      {
        key: 'effDate', header: 'Effective Date', width: '120px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate', header: 'Termination Date', width: '130px',
        valueFormatter: (value) => value ? this.formatDate(value) : ''
      }
    ];
  }

  onBack(): void {
    this.router.navigate([this.hhManagementPath], { queryParams: { tab: 2 } });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return moment.utc(dateStr).format('DD-MMM-YYYY').toUpperCase();
  }
}
