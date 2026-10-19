import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { ModifyCheckInBatchApiService } from '../services/modify-check-in-batch-api.service';
import { BatchCommentDto, CreateBatchCommentRequest, UpdateBatchCommentRequest } from '../models/modify-check-in-batch.model';

@Component({
  selector: 'app-batch-comments-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './batch-comments-panel.html',
  styleUrls: ['./batch-comments-panel.scss'],
})
export class BatchCommentsPanelComponent implements OnInit, OnDestroy, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ModifyCheckInBatchApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @Input() batchId: string | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() dataChanged = new EventEmitter<void>();

  commentForm!: FormGroup;
  editForm!: FormGroup;
  comments: BatchCommentDto[] = [];
  isLoading = false;
  editingAuditKey: number | null = null;

  ngOnInit(): void {
    this.commentForm = this.fb.group({
      note: ['', [Validators.required, Validators.maxLength(240)]],
    });
    this.editForm = this.fb.group({
      note: ['', [Validators.required, Validators.maxLength(240)]],
    });

    if (this.batchId) {
      this.loadComments();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['batchId'] && !changes['batchId'].firstChange && this.batchId) {
      this.loadComments();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onClose(): void {
    this.closePanel.emit();
  }

  onAddComment(): void {
    if (this.commentForm.invalid || !this.batchId) return;

    const text = this.commentForm.value.note?.trim();
    if (!text) return;

    const request: CreateBatchCommentRequest = { note: text };

    this.service.createBatchComment(this.batchId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.commentForm.reset();
          this.loadComments();
          this.dataChanged.emit();
        },
        error: (error) => {
          console.error('Error adding comment:', error);
          this.showSnackbar('Failed to add comment');
        },
      });
  }

  startEdit(comment: BatchCommentDto): void {
    this.editingAuditKey = comment.auditKey;
    this.editForm.patchValue({ note: comment.note });
  }

  cancelEdit(): void {
    this.editingAuditKey = null;
    this.editForm.reset();
  }

  saveEdit(comment: BatchCommentDto): void {
    if (this.editForm.invalid || !this.batchId || !comment.auditKey) return;

    const text = this.editForm.value.note?.trim();
    if (!text) return;

    const request: UpdateBatchCommentRequest = { note: text };

    this.service.updateBatchComment(this.batchId, String(comment.auditKey), request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.editingAuditKey = null;
          this.editForm.reset();
          this.loadComments();
          this.dataChanged.emit();
        },
        error: (error) => {
          console.error('Error updating comment:', error);
          this.showSnackbar('Failed to update comment');
        },
      });
  }

  deleteComment(comment: BatchCommentDto): void {
    if (!this.batchId || !comment.auditKey) return;

    this.service.deleteBatchComment(this.batchId, String(comment.auditKey))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadComments();
          this.dataChanged.emit();
        },
        error: (error) => {
          console.error('Error deleting comment:', error);
          this.showSnackbar('Failed to delete comment');
        },
      });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const m = moment(dateStr);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateStr;
  }

  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getCommentVersionInfo(comment: BatchCommentDto): string {
    const date = this.formatDate(comment.insertDate);
    return `${comment.noteSeq}.0 | ${date}`;
  }

  private loadComments(): void {
    if (!this.batchId) return;

    this.isLoading = true;

    this.service.getBatchComments(this.batchId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.comments = data || [];
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading comments:', error);
          this.comments = [];
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
