import { Component, Output, EventEmitter, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { HeaderService } from '@shared/services/header.service';
import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DialogButton } from '@shared/interfaces/dialog.interface';
import { HealthHistoryDto } from '../../models/audit-donation.model';

/**
 * Comment Side Panel Component
 * Used to edit comments for health history responses in Audit Donation
 */
@Component({
  selector: 'app-comment-side-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    SidePanelBase
  ],
  templateUrl: './comment-side-panel.html',
  styleUrl: './comment-side-panel.scss'
})
export class CommentSidePanelComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  @Input() response: HealthHistoryDto | null = null;
  @Output() save = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  commentForm!: FormGroup;

  footerButtons: DialogButton[] = [
    {
      label: 'NO, CANCEL',
      action: 'cancel',
      variant: 'secondary'
    },
    {
      label: 'SAVE',
      action: 'save',
      variant: 'primary'
    }
  ];

  ngOnInit(): void {
    this.commentForm = this.fb.group({
      comments: [this.response?.comments || '', [Validators.maxLength(240)]]
    });
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cancel.emit();
      });
  }

  onButtonClick(action: string): void {
    if (action === 'save') {
      if (this.commentForm.valid) {
        this.save.emit(this.commentForm.value.comments);
      }
    } else if (action === 'cancel') {
      this.cancel.emit();
    }
  }

  onClose(): void {
    this.cancel.emit();
  }

  getCharactersRemaining(): string {
    const currentLength = this.commentForm.get('comments')?.value?.length || 0;
    return `${currentLength} / 240 characters`;
  }
}
