import { Component, EventEmitter, Input, OnInit, OnDestroy, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { SendLetterApiService } from './send-letter-api.service';
import {
  SendLetterDialogData,
  SendLetterResult,
  CommunicationCode,
  LetterListItem,
  LetterDetail,
  DialogState,
} from './send-letter-dialog.model';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-send-letter-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './send-letter-dialog.html',
  styleUrl: './send-letter-dialog.scss',
})
export class SendLetterDialog implements OnInit, OnDestroy {
  @Input() data!: SendLetterDialogData;
  @Output() closePanel = new EventEmitter<SendLetterResult>();

  private destroy$ = new Subject<void>();
  private apiService = inject(SendLetterApiService);
  private snackbarService = inject(SnackbarService);
  private headerService = inject(HeaderService);

  dialogState: DialogState = 'INITIAL';
  loading = false;

  commTypes: CommunicationCode[] = [];
  filteredCommTypes: CommunicationCode[] = [];
  commTypeSearchCtrl = new FormControl('');

  commCodes: CommunicationCode[] = [];
  filteredCommCodes: CommunicationCode[] = [];
  commCodeSearchCtrl = new FormControl('');

  lettersList: LetterListItem[] = [];
  filteredLetters: LetterListItem[] = [];
  letterSearchCtrl = new FormControl('');

  letterDetail: LetterDetail | null = null;
  templateText = '';
  mergedText = '';
  mergedTextTouched = false;
  donorId = '';

  form = new FormGroup({
    commType: new FormControl('', Validators.required),
    commCode: new FormControl({ value: '', disabled: true }, Validators.required),
    comments: new FormControl(''),
    letterCode: new FormControl('', Validators.required),
  });

  ngOnInit(): void {
    this.loadCommTypes();
    this.loadLettersList();
    this.setupSearchFilters();
    this.setupCommTypeChange();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get commTypeDescription(): string {
    const code = this.form.get('commType')?.value;
    return this.commTypes.find((t) => t.code === code)?.description ?? '';
  }

  get commCodeDescription(): string {
    const code = this.form.get('commCode')?.value;
    return this.commCodes.find((c) => c.code === code)?.description ?? '';
  }

  get letterDescription(): string {
    const code = this.form.get('letterCode')?.value;
    return this.lettersList.find((l) => l.letterCode === code)?.letterTitle ?? '';
  }

  get isRetrieveEnabled(): boolean {
    return this.dialogState === 'INITIAL'
      && !!this.form.get('commType')?.value
      && !!this.form.get('commCode')?.value
      && !!this.form.get('letterCode')?.value;
  }

  get isGenerateEnabled(): boolean {
    return this.dialogState === 'RETRIEVED';
  }

  get isSaveEnabled(): boolean {
    return this.dialogState === 'GENERATED'
      && !!this.form.get('commCode')?.value
      && !!this.mergedText.trim();
  }

  get displayText(): string {
    if (this.dialogState === 'GENERATED' || this.dialogState === 'SAVED') {
      return this.mergedText;
    }
    return this.templateText;
  }

  get isContentEditable(): boolean {
    return this.dialogState === 'GENERATED';
  }

  get mergedTextError(): boolean {
    return this.mergedTextTouched && !this.mergedText.trim();
  }

  onRetrieve(): void {
    const letterCode = this.form.get('letterCode')?.value;
    if (!letterCode) return;

    this.loading = true;
    this.apiService
      .getLetterDetail(letterCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detail) => {
          this.loading = false;
          if (detail) {
            this.letterDetail = detail;
            this.templateText = detail.letterContent;
            this.mergedText = '';
            this.dialogState = 'RETRIEVED';
            this.snackbarService.showSuccess('Letter template retrieved.');
          }
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  onGenerate(): void {
    if (!this.letterDetail) return;

    this.loading = true;
    this.apiService
      .generateLetter({
        donorIds: this.data.donorIds,
        letterCode: this.letterDetail.letterCode,
        templateText: this.letterDetail.letterContent,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.mergedText = response.mergedText;
          this.donorId = response.donorId;
          this.dialogState = 'GENERATED';
          this.snackbarService.showSuccess('Letter generated successfully.');
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  onSaveAndPrint(): void {
    const raw = this.form.getRawValue();
    const commType = raw.commType ?? '';
    const commCode = raw.commCode ?? '';
    const comments = raw.comments ?? '';
    const letterCode = raw.letterCode ?? '';

    this.loading = true;
    this.apiService
      .saveLetter({
        donorId: this.donorId,
        commType,
        commCode,
        comments: comments || null,
        letterCode,
        mergedText: this.mergedText,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.dialogState = 'SAVED';
          this.generatePdf(this.mergedText, this.donorId);
          this.snackbarService.showSuccess('Letter saved successfully.');
          this.closePanel.emit({ letterSent: true, letterSeqNo: response.letterSeqNo });
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  onCancel(): void {
    this.closePanel.emit({ letterSent: false });
  }

  onSaveAttempt(): void {
    if (this.dialogState === 'GENERATED' && !this.mergedText.trim()) {
      this.mergedTextTouched = true;
    }
  }

  onMergedTextChange(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.mergedText = textarea.value;
  }

  onMergedTextBlur(): void {
    this.mergedTextTouched = true;
  }

  private loadCommTypes(): void {
    this.apiService
      .getCommunicationTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.commTypes = types;
          this.filteredCommTypes = [...types];
        },
        error: () => {},
      });
  }

  private loadLettersList(): void {
    this.apiService
      .getLettersList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (letters) => {
          this.lettersList = letters;
          this.filteredLetters = [...letters];
        },
        error: () => {},
      });
  }

  private setupCommTypeChange(): void {
    this.form
      .get('commType')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((commType) => {
        const commCodeCtrl = this.form.get('commCode');
        commCodeCtrl?.setValue('');
        this.commCodes = [];
        this.filteredCommCodes = [];

        if (commType) {
          commCodeCtrl?.enable();
          this.loadCommCodes(commType);
        } else {
          commCodeCtrl?.disable();
        }

        this.resetToInitial();
      });

    this.form
      .get('letterCode')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetToInitial();
      });
  }

  private loadCommCodes(commType: string): void {
    this.apiService
      .getCommunicationCodes(commType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.commCodes = codes;
          this.filteredCommCodes = [...codes];
        },
        error: () => {},
      });
  }

  private setupSearchFilters(): void {
    this.commTypeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((search) => {
      this.filteredCommTypes = this.filterList(this.commTypes, search, 'code', 'description');
    });

    this.commCodeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((search) => {
      this.filteredCommCodes = this.filterList(this.commCodes, search, 'code', 'description');
    });

    this.letterSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((search) => {
      this.filteredLetters = this.filterList(this.lettersList, search, 'letterCode', 'letterTitle');
    });
  }

  private filterList<T>(items: T[], search: string | null, ...keys: (keyof T)[]): T[] {
    const term = (search ?? '').toLowerCase();
    if (!term) return [...items];
    return items.filter((item) =>
      keys.some((key) => String(item[key] ?? '').toLowerCase().includes(term))
    );
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.form.reset({ commType: '', commCode: '', comments: '', letterCode: '' });
        this.form.get('commCode')?.disable();
        this.commCodes = [];
        this.filteredCommCodes = [];
        this.resetToInitial();
        this.loadCommTypes();
        this.loadLettersList();
      });
  }

  private resetToInitial(): void {
    this.dialogState = 'INITIAL';
    this.templateText = '';
    this.mergedText = '';
    this.mergedTextTouched = false;
    this.letterDetail = null;
  }

  private generatePdf(text: string, donorId: string): void {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter',
      });

      pdf.setFont('courier');
      pdf.setFontSize(10);

      const lines = text.split('\n');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const lineHeight = 5;
      const margin = 15;
      const maxLineWidth = pageWidth - margin * 2;
      let yPosition = margin;

      lines.forEach((line) => {
        const wrappedLines = pdf.splitTextToSize(line || ' ', maxLineWidth);
        wrappedLines.forEach((wrappedLine: string) => {
          if (yPosition + lineHeight > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(wrappedLine, margin, yPosition);
          yPosition += lineHeight;
        });
      });

      const blobUrl = pdf.output('bloburl');
      window.open(blobUrl.toString(), '_blank');
    } catch {
      this.snackbarService.showError('Failed to generate PDF.');
    }
  }
}
