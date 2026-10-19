import { TextFieldModule } from '@angular/cdk/text-field';
import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, signal, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { InputValidationUtil } from '@shared/utils/input-validation.util';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DonorCommunicationsService } from '../../services/donor-communications.service';
import {
  SendLetterDialogData,
  LetterCode
} from '../../models/donor-communications.model';

@Component({
  selector: 'app-send-letter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    TextFieldModule
  ],
  templateUrl: './send-letter.html',
  styleUrls: ['./send-letter.scss']
})
export class SendLetterDialogComponent implements OnInit, OnDestroy {
  private readonly service = inject(DonorCommunicationsService);
  private readonly fb = inject(FormBuilder);
  private readonly snackbarService = inject(SnackbarService);
  private readonly loggingService = inject(LoggingService);
  private destroy$ = new Subject<void>();

  form!: FormGroup;
  loading = signal(false);
  loadingCodes = signal(false);
  loadingLetterCodes = signal(false);

  // Dropdown options - converted to signals
  communicationTypes = signal<{ value: string; label: string }[]>([]);
  communicationCodes = signal<{ value: string; label: string }[]>([]);
  letterCodes = signal<{ value: string; label: string }[]>([]);

  // Search controls
  comTypeSearchControl = new FormControl('');
  filteredComTypes = signal<{ value: string; label: string }[]>([]);

  comCodeSearchControl = new FormControl('');
  filteredComCodes = signal<{ value: string; label: string }[]>([]);

  letterCodeSearchControl = new FormControl('');
  filteredLetterCodes = signal<{ value: string; label: string }[]>([]);

  // Descriptions
  selectedTypeDesc = signal('');
  selectedCodeDesc = signal('');
  selectedLetterCodeDesc = signal('');

  // Letter template info
  versionNumber = signal('');
  versionDate = signal('');
  letterText = signal('');

  // States
  isRetrieved = signal(false);
  isGenerated = signal(false);

  constructor(
    public dialogRef: MatDialogRef<SendLetterDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SendLetterDialogData
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupSearchControls();
    this.loadLookups();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      communicationType: ['', Validators.required],
      communicationCode: ['', Validators.required],
      comments: ['', Validators.maxLength(500)],
      letterCode: ['', Validators.required]
    });

    // Type change handler
    this.form.get('communicationType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(type => this.onTypeChange(type));

    // Code change handler
    this.form.get('communicationCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(code => this.onCodeChange(code));

    // Letter code change handler
    this.form.get('letterCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(code => this.onLetterCodeChange(code));
  }

  private setupSearchControls(): void {
    // Communication type search
    this.comTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredComTypes.set(!term
          ? [...this.communicationTypes()]
          : this.communicationTypes().filter(type =>
              type.label.toLowerCase().includes(term) ||
              type.value.toLowerCase().includes(term)
            ));
      });

    // Communication code search
    this.comCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredComCodes.set(!term
          ? [...this.communicationCodes()]
          : this.communicationCodes().filter(code =>
              code.label.toLowerCase().includes(term) ||
              code.value.toLowerCase().includes(term)
            ));
      });

    // Letter code search
    this.letterCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredLetterCodes.set(!term
          ? [...this.letterCodes()]
          : this.letterCodes().filter(code =>
              code.label.toLowerCase().includes(term) ||
              code.value.toLowerCase().includes(term)
            ));
      });
  }

  private loadLookups(): void {
    // Load communication types
    this.service.getCommunicationTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          const typesData = types.map(t => ({
            value: t.code,
            label: `${t.code} - ${t.description}`
          }));
          this.communicationTypes.set(typesData);
          this.filteredComTypes.set([...typesData]);
        },
        error: (error) => {
          this.loggingService.error('Failed to load communication types', error);
        }
      });

    // Load letter codes
    this.loadingLetterCodes.set(true);
    this.service.getLetterCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          const codesData = codes.map(c => ({
            value: c.code,
            label: `${c.code} - ${c.description}`
          }));
          this.letterCodes.set(codesData);
          this.filteredLetterCodes.set([...codesData]);
          this.loadingLetterCodes.set(false);
        },
        error: (error) => {
          this.loggingService.error('Failed to load letter codes', error);
          this.loadingLetterCodes.set(false);
        }
      });
  }

  private onTypeChange(type: string): void {
    if (!type) {
      this.communicationCodes.set([]);
      this.filteredComCodes.set([]);
      this.selectedTypeDesc.set('');
      this.form.patchValue({ communicationCode: '' });
      return;
    }

    const typeOption = this.communicationTypes().find(t => t.value === type);
    this.selectedTypeDesc.set(typeOption ? typeOption.label.split(' - ')[1] || '' : '');

    // Load codes for this type
    this.loadingCodes.set(true);
    this.service.getCommunicationCodes(type)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          const codesData = codes.map(c => ({
            value: c.code,
            label: `${c.code} - ${c.description}`
          }));
          this.communicationCodes.set(codesData);
          this.filteredComCodes.set([...codesData]);
          this.loadingCodes.set(false);
        },
        error: (error) => {
          this.loggingService.error('Failed to load communication codes', error);
          this.loadingCodes.set(false);
        }
      });

    this.form.patchValue({ communicationCode: '' });
    this.selectedCodeDesc.set('');
    this.resetGeneration();
  }

  private onCodeChange(code: string): void {
    if (!code) {
      this.selectedCodeDesc.set('');
      return;
    }

    const codeOption = this.communicationCodes().find(c => c.value === code);
    this.selectedCodeDesc.set(codeOption ? codeOption.label.split(' - ')[1] || '' : '');
    this.resetGeneration();
  }

  private onLetterCodeChange(code: string): void {
    if (!code) {
      this.selectedLetterCodeDesc.set('');
      return;
    }

    const codeOption = this.letterCodes().find(c => c.value === code);
    this.selectedLetterCodeDesc.set(codeOption ? codeOption.label.split(' - ')[1] || '' : '');
    this.resetRetrieval();
  }

  /**
   * Retrieve letter template
   */
  onRetrieve(): void {
    const letterCode = this.form.get('letterCode')?.value;
    if (!letterCode) {
      this.snackbarService.showError('Please select a letter code');
      return;
    }

    this.loading.set(true);
    this.service.retrieveLetterTemplate(letterCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (template: LetterCode) => {
          this.versionNumber.set(template.versionNumber || '');
          this.versionDate.set(template.versionDate ? this.formatDate(template.versionDate) : '');
          this.letterText.set(template.letterText || '');
          this.isRetrieved.set(true);
          this.loading.set(false);
        },
        error: (error) => {
          this.loggingService.error('Failed to retrieve letter template', error);
          this.snackbarService.showError('Failed to retrieve letter template');
          this.loading.set(false);
        }
      });
  }

  /**
   * Generate letter (merge with communication data)
   */
  onGenerate(): void {
    if (!this.validateForGenerate()) {
      return;
    }

    const templateText = this.letterText();
    if (!templateText) {
      this.snackbarService.showError('Please retrieve the letter template first');
      return;
    }

    const formValue = this.form.getRawValue();
    this.loading.set(true);

    this.service.generateLetter(
      this.data.donorId,
      formValue.letterCode,
      formValue.communicationType,
      formValue.communicationCode,
      templateText
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (generatedText: string) => {
          this.letterText.set(generatedText);
          this.isGenerated.set(true);
          this.loading.set(false);
          this.snackbarService.showSuccess('Letter generated successfully');
        },
        error: (error) => {
          this.loggingService.error('Failed to generate letter', error);
          this.snackbarService.showError('Failed to generate letter');
          this.loading.set(false);
        }
      });
  }

  /**
   * Save and print letter
   */
  onSaveAndPrint(): void {
    if (!this.validateForSave()) {
      return;
    }

    const formValue = this.form.getRawValue();
    this.loading.set(true);

    this.service.saveAndPrintLetter(
      this.data.donorId,
      formValue.letterCode,
      formValue.communicationType,
      formValue.communicationCode,
      this.letterText(),
      formValue.comments
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.snackbarService.showSuccess('Letter saved and queued for printing');
          this.dialogRef.close({ action: 'save' });
        },
        error: (error) => {
          this.loggingService.error('Failed to save and print letter', error);
          this.snackbarService.showError('Failed to save and print letter');
          this.loading.set(false);
        }
      });
  }

  /**
   * Validate form for generate
   */
  private validateForGenerate(): boolean {
    if (!this.isRetrieved()) {
      this.snackbarService.showError('Please retrieve a letter template first');
      return false;
    }

    if (!this.form.get('communicationType')?.value) {
      this.snackbarService.showError('Communication Type is required');
      return false;
    }

    if (!this.form.get('communicationCode')?.value) {
      this.snackbarService.showError('Communication Code is required');
      return false;
    }

    return true;
  }

  /**
   * Validate form for save
   */
  private validateForSave(): boolean {
    if (!this.isGenerated()) {
      this.snackbarService.showError('Please generate the letter first');
      return false;
    }

    return true;
  }

  /**
   * Reset retrieval state
   */
  private resetRetrieval(): void {
    this.versionNumber.set('');
    this.versionDate.set('');
    this.letterText.set('');
    this.isRetrieved.set(false);
    this.isGenerated.set(false);
  }

  /**
   * Reset generation state
   */
  private resetGeneration(): void {
    this.isGenerated.set(false);
  }

  onCancel(): void {
    this.dialogRef.close({ action: 'cancel' });
  }

  preventLeadingAndMultipleSpaces(event: KeyboardEvent, controlName: string): void {
    const control = this.form.get(controlName);
    if (control) {
      InputValidationUtil.preventLeadingAndMultipleSpaces(event, control);
    }
  }

  trimTrailingSpaces(controlName: string): void {
    const control = this.form.get(controlName);
    if (control) {
      InputValidationUtil.trimTrailingSpaces(control);
    }
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  trackByValue(_index: number, item: { value: string; label: string }): string {
    return item.value;
  }
}
