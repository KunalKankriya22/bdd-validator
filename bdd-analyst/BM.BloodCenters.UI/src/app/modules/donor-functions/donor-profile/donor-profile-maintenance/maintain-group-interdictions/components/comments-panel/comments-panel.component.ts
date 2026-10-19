import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import moment from 'moment';

import {
  GroupInterdictionLookupDto,
  DonorGroupInterdictionComment
} from '../../models/maintain-group-interdictions.model';
import { MaintainGroupInterdictionsService } from '../../services/maintain-group-interdictions.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

interface CommentRecord {
  date: string;
  user: string;
  text: string;
  type: 'comment' | 'note';
}

@Component({
  selector: 'app-comments-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './comments-panel.component.html',
  styleUrls: ['./comments-panel.component.scss']
})
export class CommentsPanelComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MaintainGroupInterdictionsService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);

  @Input() interdiction: GroupInterdictionLookupDto | null = null;
  @Input() selectedInterdictions: GroupInterdictionLookupDto[] = [];
  @Input() groupMode: string = '';
  @Input() groupValue: string = '';
  @Output() closePanel = new EventEmitter<void>();

  commentForm: FormGroup;
  comments: CommentRecord[] = [];
  isLoading = false;

  constructor() {
    this.commentForm = this.fb.group({
      commentText: ['', [Validators.required, Validators.maxLength(200)]]
    });
  }

  ngOnInit(): void {
    this.loadComments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onClose(): void {
    this.closePanel.emit();
  }

  onSaveComment(): void {
    const codes = this.getInterCodes();
    if (!this.commentForm.valid || codes.length === 0) return;

    const chapterLocalDate = this.chapterTimezoneService.getChapterLocalDate();
    const insertDate = DateFieldValidationUtility.serializeDateForApi(chapterLocalDate) || '';
    const commentText = this.commentForm.value.commentText;

    const requests = codes.map(code =>
      this.service.addDonorInterdictionComment({
        groupMode: this.groupMode,
        groupValue: this.groupValue,
        interCode: code,
        comment: commentText,
        insertDate: insertDate
      })
    );

    forkJoin(requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.commentForm.reset();
          this.loadComments();
        },
        error: (error) => {
          console.error('Error adding comment:', error);
        }
      });
  }

  private getInterCodes(): string[] {
    if (this.selectedInterdictions.length > 0) {
      return this.selectedInterdictions.map(i => i.code);
    }
    return this.interdiction ? [this.interdiction.code] : [];
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
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  private loadComments(): void {
    if (!this.interdiction?.code || !this.groupMode || !this.groupValue) {
      return;
    }

    this.isLoading = true;

    this.service.getDonorInterdictionComments({
      groupMode: this.groupMode,
      groupValue: this.groupValue,
      interCode: this.interdiction.code
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.comments = this.transformComments(data);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading comments:', error);
          this.isLoading = false;
        }
      });
  }

  private transformComments(data: DonorGroupInterdictionComment[]): CommentRecord[] {
    const records: CommentRecord[] = [];

    data.forEach(item => {
      // If both fields have the same value, only add one record to avoid duplicates
      if (item.comments && item.centralNote && item.comments === item.centralNote) {
        records.push({
          date: this.formatDate(item.insertDate),
          user: item.insertUser || 'Unknown',
          text: item.comments,
          type: 'comment'
        });
      } else {
        // Add short comment if present and different from central note
        if (item.comments) {
          records.push({
            date: this.formatDate(item.insertDate),
            user: item.insertUser || 'Unknown',
            text: item.comments,
            type: 'comment'
          });
        }

        // Add central note if present and different from comment
        if (item.centralNote) {
          records.push({
            date: this.formatDate(item.insertDate),
            user: item.insertUser || 'Unknown',
            text: item.centralNote,
            type: 'note'
          });
        }
      }
    });

    return records;
  }
}
