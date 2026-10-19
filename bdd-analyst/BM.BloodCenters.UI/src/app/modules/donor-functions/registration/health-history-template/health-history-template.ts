import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { HeaderService } from '@shared/services/header.service';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

export interface HHTemplateQuestion {
  questionCode: string;
  ask: string;
  abbrFlag: string;
  abbrSeq: number | null;
  repeated: string;
  sequence: number;
  questionNumber: string;
  parentQuestion: string;
  responseFlag: string;
  subFlag: string;
  goToNotes: string;
}

@Component({
  selector: 'app-health-history-template',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    AlertComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './health-history-template.html',
  styleUrl: './health-history-template.scss',
})
export class HealthHistoryTemplate implements OnInit, OnDestroy {
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  // Page configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Donor Functions', link: '/donor-functions' },
      { label: 'Health History Template', link: null },
    ],
    title: 'Health History Template',
    subtitle: 'Manage health history questionnaire template configuration.',
    actions: [],
  };

  // State signals
  isLoading = signal<boolean>(false);
  searchTerm = signal<string>('');
  templateQuestions = signal<HHTemplateQuestion[]>([]);

  displayedColumns: string[] = [
    'questionCode',
    'ask',
    'abbrFlag',
    'abbrSeq',
    'repeated',
    'sequence',
    'questionNumber',
    'parentQuestion',
    'responseFlag',
    'subFlag',
    'goToNotes',
    'actions'
  ];

  // Computed states
  filteredQuestions = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const allQuestions = this.templateQuestions();

    if (!term) {
      return allQuestions;
    }

    return allQuestions.filter(q =>
      q.questionCode?.toLowerCase().includes(term) ||
      q.questionNumber?.toLowerCase().includes(term) ||
      q.parentQuestion?.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.loadTemplateQuestions();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load health history template questions
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.templateQuestions.set([]);
        this.searchTerm.set('');
        this.loadTemplateQuestions();
      });
  }

  private loadTemplateQuestions(): void {
    this.isLoading.set(true);

    // Mock data - in production, this would come from API
    const mockTemplateQuestions: HHTemplateQuestion[] = [
      {
        questionCode: 'Q001',
        ask: 'Y',
        abbrFlag: 'N',
        abbrSeq: null,
        repeated: 'N',
        sequence: 1,
        questionNumber: '1',
        parentQuestion: '',
        responseFlag: 'Y',
        subFlag: '',
        goToNotes: ''
      },
      {
        questionCode: 'Q002',
        ask: 'Y',
        abbrFlag: 'Y',
        abbrSeq: 1,
        repeated: 'N',
        sequence: 2,
        questionNumber: '2',
        parentQuestion: 'Q001',
        responseFlag: 'Y',
        subFlag: 'Y',
        goToNotes: 'See notes'
      },
      {
        questionCode: 'Q003',
        ask: 'Y',
        abbrFlag: 'N',
        abbrSeq: null,
        repeated: 'Y',
        sequence: 3,
        questionNumber: '3',
        parentQuestion: '',
        responseFlag: 'Y',
        subFlag: '',
        goToNotes: ''
      },
      {
        questionCode: 'Q004',
        ask: 'Y',
        abbrFlag: 'Y',
        abbrSeq: 2,
        repeated: 'N',
        sequence: 4,
        questionNumber: '4',
        parentQuestion: 'Q003',
        responseFlag: 'Y',
        subFlag: 'N',
        goToNotes: ''
      },
      {
        questionCode: 'Q005',
        ask: 'Y',
        abbrFlag: 'N',
        abbrSeq: null,
        repeated: 'N',
        sequence: 5,
        questionNumber: '5',
        parentQuestion: '',
        responseFlag: 'Y',
        subFlag: '',
        goToNotes: 'Travel history'
      }
    ];

    // Simulate API delay
    setTimeout(() => {
      this.templateQuestions.set(mockTemplateQuestions);
      this.isLoading.set(false);
    }, 500);
  }

  /**
   * Handle search input change
   */
  onSearchChange(): void {
    // Trigger recomputation of filteredQuestions
    this.searchTerm.set(this.searchTerm());
  }

  /**
   * Add new template question
   */
  onAddNew(): void {
    // TODO: Open dialog or navigate to add form
    this.showSuccessToast('Add New Template Question - Not yet implemented');
  }

  /**
   * Edit template question
   */
  onEdit(question: HHTemplateQuestion): void {
    // TODO: Open dialog or navigate to edit form
    this.showSuccessToast(`Edit question ${question.questionCode} - Not yet implemented`);
  }

  /**
   * Delete template question
   */
  async onDelete(question: HHTemplateQuestion): Promise<void> {
    const confirmed = await this.showConfirmationDialog(
      'Delete Template Question',
      `Are you sure you want to delete question "${question.questionCode}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    // TODO: Call API to delete
    this.templateQuestions.update(list =>
      list.filter(q => q.questionCode !== question.questionCode)
    );
    this.showSuccessToast('Template question deleted successfully');
  }

  /**
   * Show confirmation dialog
   */
  private async showConfirmationDialog(title: string, message: string): Promise<boolean> {
    const dialogData: ConfirmActionDialogData = {
      title,
      message,
      confirmText: 'DELETE',
      cancelText: 'CANCEL',
    };

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      data: dialogData,
      width: '400px',
      disableClose: true,
    });

    return new Promise((resolve) => {
      dialogRef.afterClosed().subscribe((result) => {
        resolve(result === true);
      });
    });
  }

  /**
   * Show success toast (top-right position)
   */
  private showSuccessToast(message: string): void {
    this.snackBar.open(message, 'Close', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
      duration: 3000,
    });
  }

  /**
   * Show error toast (top-right position)
   */
  private showErrorToast(message: string): void {
    this.snackBar.open(message, 'Close', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
      duration: 5000,
    });
  }
}
