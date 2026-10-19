import { Component, OnInit, OnDestroy, Inject, inject, signal, computed, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { A11yModule } from '@angular/cdk/a11y';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LetterTemplateService } from '@shared/services/letter-template.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '../confirm-action-dialog/confirm-action-dialog.component';
import { AuthorizeNotificationLetterApiService } from './authorize-notification-letter-api.service';
import { DonorInterdictionsContentComponent } from '../../../modules/donor-functions/donor-profile/donor-interdictions/donor-interdictions-content.component';
import { DonorWithinTestDialogComponent } from '../../../modules/donor-functions/donor-within-test/donor-within-test-dialog.component';
import { SearchBar, SearchBarConfig } from '../search-bar/search-bar';
import {
  AuthorizeNotificationLetterDialogData,
  NotificationLetterDto,
  DonorInfoDto,
  LetterDropdownDto,
  SaveLetterRequestDto,
} from './authorize-notification-letter-dialog.model';

@Component({
  selector: 'app-authorize-notification-letter-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    A11yModule,
    NgxMatSelectSearchModule,
    DonorInterdictionsContentComponent,
    DonorWithinTestDialogComponent,
    SearchBar,
  ],
  templateUrl: './authorize-notification-letter-dialog.html',
  styleUrl: './authorize-notification-letter-dialog.scss',
})
export class AuthorizeNotificationLetterDialog implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(AuthorizeNotificationLetterApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly letterTemplateService = inject(LetterTemplateService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  readonly letterData = signal<NotificationLetterDto | null>(null);
  readonly donorInfo = signal<DonorInfoDto | null>(null);
  readonly lettersDropdown = signal<LetterDropdownDto[]>([]);
  readonly filteredLetters = signal<LetterDropdownDto[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly donationsViewed = signal<boolean>(false);
  readonly interdictionsViewed = signal<boolean>(false);
  readonly letterTextModified = signal<boolean>(false);
  readonly originalLetterText = signal<string>('');
  readonly currentSubPanel = signal<'interdictions' | 'test-results' | 'notification-logs' | null>(null);

  // Notification logs comments
  readonly authorizationComments = signal<string>('');
  readonly commentsSearch = signal<string>('');

  readonly nlSearchConfig: SearchBarConfig = {
    placeholder: 'Search',
    ariaLabel: 'Search notification logs',
    searchOnEnterOnly: true,
  };

  // Track if letter has been generated
  readonly letterGenerated = signal<boolean>(false);

  // Track if letter has been saved
  readonly letterSaved = signal<boolean>(false);

  // Track if letter has been retrieved (SUPER mode one-time action)
  readonly letterRetrieved = signal<boolean>(false);

  // Track selected letter (from dropdown)
  readonly selectedLetterId = signal<string>('');
  readonly selectedLetterItem = signal<LetterDropdownDto | null>(null);

  // Mode-based visibility
  readonly isUserMode = computed(() => this.data.mode === 'USER');
  readonly isSuperMode = computed(() => this.data.mode === 'SUPER');

  // Address overflow detection
  @ViewChild('addressValue') addressValueRef!: ElementRef<HTMLSpanElement>;
  isAddressOverflowing = false;

  // Search control for letter dropdown
  readonly letterSearchControl = new FormControl('');

  // Computed values for workflow
  readonly canGenerate = computed(() => {
    const letter = this.letterData();
    const isAuthorized = letter?.authorizationStatus === 'AUTHORIZED';
    const isRejected = letter?.authorizationStatus === 'REJECTED';

    // Disable Generate if:
    // - Letter already generated AND not modified
    // - Letter is authorized or rejected
    // - Loading state
    return !this.letterGenerated() && !isAuthorized && !isRejected && !this.loading();
  });

  readonly canViewDonationsInterdictions = computed(
    () => (this.isSuperMode() || this.letterGenerated()) && !this.loading()
  );

  readonly canSave = computed(() => {
    const letter = this.letterData();
    const isAuthorized = letter?.authorizationStatus === 'AUTHORIZED';
    const isRejected = letter?.authorizationStatus === 'REJECTED';

    // Can save if:
    // - Letter is generated
    // - Both donations and interdictions viewed
    // - Letter text exists
    // - Letter not already saved (or was modified after save)
    // - Letter not authorized or rejected
    // - Not loading
    return (
      this.letterGenerated() &&
      this.donationsViewed() &&
      this.interdictionsViewed() &&
      this.form.get('letterText')?.value &&
      !this.letterSaved() &&
      !isAuthorized &&
      !isRejected &&
      !this.loading()
    );
  });

  readonly canAuthorize = computed(() => {
    const letter = this.letterData();
    const letterSeqNo = this.data.letterSeqNo;
    const isAuthorized = letter?.authorizationStatus === 'AUTHORIZED';
    const isRejected = letter?.authorizationStatus === 'REJECTED';

    // Can authorize if:
    // - Letter is saved (has letterSeqNo)
    // - Letter is in PENDING status (not authorized or rejected)
    // - Not loading
    return (
      !!letterSeqNo &&
      this.letterSaved() &&
      this.donationsViewed() &&
      this.interdictionsViewed() &&
      !isAuthorized &&
      !isRejected &&
      !this.loading()
    );
  });

  readonly canReject = computed(() => {
    const letter = this.letterData();
    const letterSeqNo = this.data.letterSeqNo;
    const isAuthorized = letter?.authorizationStatus === 'AUTHORIZED';
    const isRejected = letter?.authorizationStatus === 'REJECTED';

    return (
      this.isSuperMode() &&
      !!letterSeqNo &&
      this.letterSaved() &&
      !isAuthorized &&
      !isRejected &&
      !this.loading()
    );
  });

  readonly isLetterEditable = computed(() => {
    const letter = this.letterData();
    const isAuthorized = letter?.authorizationStatus === 'AUTHORIZED';
    const isRejected = letter?.authorizationStatus === 'REJECTED';

    // Letter is editable only if not authorized or rejected
    return !isAuthorized && !isRejected;
  });

  // Form
  form!: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<AuthorizeNotificationLetterDialog>,
    @Inject(MAT_DIALOG_DATA) public data: AuthorizeNotificationLetterDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();

    if (this.data.donorId && !this.donorInfo()) {
      this.loadDonorInfo();
    }

    if (this.lettersDropdown().length === 0) {
      if (this.isSuperMode()) {
        this.loadLettersDropdownOnly();
      } else {
        this.loadLettersDropdownThenLoadLetter();
      }
    } else if (this.data.donorId && this.data.letterSeqNo && this.isUserMode()) {
      this.loadLetterData();
    }

    this.setupLetterCodeChange();
    this.setupLetterSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkAddressOverflow(): void {
    setTimeout(() => {
      if (this.addressValueRef?.nativeElement) {
        const el = this.addressValueRef.nativeElement;
        this.isAddressOverflowing = el.scrollWidth > el.clientWidth;
        this.cdr.markForCheck();
      }
    }, 100);
  }

  private initForm(): void {
    this.form = this.fb.group({
      letterCode: ['', [Validators.required]],
      letterText: [{ value: '', disabled: true }, [Validators.maxLength(30000)]],
    });
  }

  private loadDonorInfo(): void {
    this.loading.set(true);
    this.apiService
      .getDonorInfo(this.data.donorId, this.data.unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (donorInfo) => {
          this.donorInfo.set(donorInfo);
          this.loading.set(false);
          this.checkAddressOverflow();
        },
        error: (err) => {
          // Don't show error state - show empty form with labels
          this.donorInfo.set(null);
          this.loading.set(false);

          // Show warning message in snackbar instead of error screen
          this.snackbarService.showError(
            err.message || 'Failed to load donor info'
          );

          // Don't set error() signal - let the dialog render with empty fields
        },
      });
  }

  private loadLettersDropdown(): void {
    // Load letters dropdown
    this.apiService
      .getLettersDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (letters) => {
          this.lettersDropdown.set(letters);
          this.filteredLetters.set(letters);
        },
        error: () => {
          // Dropdown failure doesn't block the dialog
        },
      });
  }

  /**
   * Load letters dropdown FIRST, then load letter data if letterSeqNo exists
   */
  private loadLettersDropdownThenLoadLetter(): void {
    if (this.data.letterSeqNo) {
      this.loading.set(true);
    }
    this.apiService
      .getLettersDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (letters) => {
          this.lettersDropdown.set(letters);
          this.filteredLetters.set(letters);

          if (this.data.donorId && this.data.letterSeqNo) {
            this.loadLetterData();
          }
        },
        error: () => {
          this.snackbarService.showError('Failed to load letters dropdown');
          if (this.data.donorId && this.data.letterSeqNo) {
            this.loadLetterData();
          }
        },
      });
  }

  private loadLettersDropdownOnly(): void {
    this.apiService
      .getLettersDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (letters) => {
          this.lettersDropdown.set(letters);
          this.filteredLetters.set(letters);
          this.autoSelectLetterCode(letters);
        },
        error: () => {
          this.snackbarService.showError('Failed to load letters dropdown');
        },
      });
  }

  private autoSelectLetterCode(letters: LetterDropdownDto[]): void {
    if (!this.data.interCode && !this.data.donationType) return;

    const match = letters.find(
      (l) =>
        (!this.data.donationType || l.donationType === this.data.donationType) &&
        (!this.data.interCode || l.interCode === this.data.interCode)
    );

    if (match) {
      const compositeKey = this.getLetterOptionKey(match);
      this.form.patchValue({ letterCode: compositeKey });
      this.selectedLetterId.set(match.letterId);
      this.selectedLetterItem.set(match);
    }
  }

  private setupLetterSearch(): void {
    this.letterSearchControl.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((searchTerm) => {
        const term = (searchTerm ?? '').toLowerCase();
        this.filteredLetters.set(
          this.lettersDropdown().filter(
            (letter) =>
              letter.letterCode.toLowerCase().includes(term) ||
              letter.letterTitle.toLowerCase().includes(term) ||
              (letter.donationType || '').toLowerCase().includes(term) ||
              (letter.interCode || '').toLowerCase().includes(term)
          )
        );
      });
  }

  protected loadLetterData(): void {
    // Only called when letterSeqNo exists (checked in ngOnInit)
    if (!this.data.letterSeqNo) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // Load letter details and donor info
    this.apiService
      .getLetterDetails(this.data.donorId, this.data.letterSeqNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (letter) => {
          if (letter) {
            this.letterData.set(letter);
            this.donorInfo.set(letter.donorInfo || null);
            this.checkAddressOverflow();
            this.originalLetterText.set(letter.letterText);

            // Find matching dropdown item to build composite key
            const matchingDropdown = this.lettersDropdown().find(
              (l) => l.letterCode === letter.letterCode &&
                     (!this.data.donationType || l.donationType === this.data.donationType) &&
                     (!this.data.interCode || l.interCode === this.data.interCode)
            ) || this.lettersDropdown().find((l) => l.letterCode === letter.letterCode);

            const compositeKey = matchingDropdown
              ? this.getLetterOptionKey(matchingDropdown)
              : letter.letterCode;

            if (matchingDropdown) {
              this.selectedLetterItem.set(matchingDropdown);
            }

            this.form.patchValue({
              letterCode: compositeKey,
              letterText: letter.letterText,
            });

            // Mark as saved/retrieved since we're loading existing letter
            this.letterSaved.set(true);
            this.letterGenerated.set(true);
            this.letterRetrieved.set(true);

            // Enable/disable letter text based on status
            if (letter.authorizationStatus === 'PENDING') {
              this.form.get('letterText')?.enable();
            } else {
              this.form.get('letterText')?.disable();
            }
          }
          this.loading.set(false);
        },
        error: (err) => {
          // Don't show error state - show empty form with labels
          this.letterData.set(null);
          this.donorInfo.set(null);
          this.loading.set(false);

          // Show warning message in snackbar instead of error screen
          this.snackbarService.showError(
            err.message || 'Failed to load letter details'
          );

          // Don't set error() signal - let the dialog render with empty fields
        },
      });
  }

  /** Builds a composite key for a dropdown item to handle duplicate letterId/letterCode entries */
  getLetterOptionKey(letter: LetterDropdownDto): string {
    return `${letter.letterCode}||${letter.donationType || ''}||${letter.interCode || ''}`;
  }

  private setupLetterCodeChange(): void {
    this.form
      .get('letterCode')
      ?.valueChanges.pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged()
      )
      .subscribe((compositeKey) => {
        if (compositeKey) {
          const selectedLetter = this.lettersDropdown().find(
            (l) => this.getLetterOptionKey(l) === compositeKey
          );

          if (selectedLetter) {
            this.selectedLetterId.set(selectedLetter.letterId);
            this.selectedLetterItem.set(selectedLetter);

            // Only reset workflow state in USER mode (generating new letter)
            // In SUPER mode, the letter is already saved — don't reset
            if (this.isUserMode()) {
              this.letterGenerated.set(false);
              this.letterSaved.set(false);
              this.donationsViewed.set(false);
              this.interdictionsViewed.set(false);
              this.letterTextModified.set(false);
              this.form.get('letterText')?.setValue('');
              this.form.get('letterText')?.disable();
              this.originalLetterText.set('');
            }

            if (this.letterData()) {
              const currentData = this.letterData();
              if (currentData) {
                this.letterData.set({
                  ...currentData,
                  letterId: selectedLetter.letterId,
                  letterCode: selectedLetter.letterCode,
                  letterTitle: selectedLetter.letterTitle,
                });
              }
            }
          }
        }
      });
  }

  private loadLetterTemplateForCode(letterId: string, letterCode: string): void {
    // Check if donor info is available first
    const donorInfoData = this.donorInfo();

    if (!donorInfoData) {
      console.warn('Donor info not available yet when trying to load template');
      this.snackbarService.showError('Please wait for donor information to load before generating letter');
      return;
    }

    this.loading.set(true);
    this.apiService
      .getLetterTemplate(letterId, letterCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (template) => {
          this.loading.set(false);

          if (!template || !template.letterTemplate) {
            this.snackbarService.showError('No letter template found for this code');
            return;
          }

          const customMapping = this.buildBookmarkMapping(donorInfoData);
          const processedTemplate = this.letterTemplateService.replaceTemplatePlaceholders(
            template.letterTemplate,
            donorInfoData as any,
            customMapping
          );

          if (!processedTemplate || processedTemplate.trim().length === 0) {
            this.snackbarService.showError('Processed template is empty');
            return;
          }

          // Populate the letter text field with the processed template
          this.form.patchValue({
            letterText: processedTemplate,
          });
          this.originalLetterText.set(processedTemplate);
          this.letterTextModified.set(false);
          this.letterGenerated.set(true);
          this.letterSaved.set(false); // Reset saved state when generating new letter
          // Enable letter text field for editing
          this.form.get('letterText')?.enable();
        },
        error: (err) => {
          this.loading.set(false);
          this.snackbarService.showError(
            err.message || 'Failed to load letter template'
          );
        },
      });
  }

  private buildBookmarkMapping(donorInfoData: DonorInfoDto | null): Record<string, () => string> {
    const chapterDate = this.chapterTimezoneService.getChapterLocalDate();
    const chapterDateStr = chapterDate.format('MMMM DD, YYYY');
    const donationDateStr = this.data.lastDonationDate || donorInfoData?.lastDonationDate;
    const donationDate = donationDateStr ? moment(donationDateStr, ['YYYY-MM-DDTHH:mm:ss', 'DD-MMM-YYYY', 'MM-DD-YY'], true) : null;
    const salutation = donorInfoData?.salutation || '';
    const signature = donorInfoData?.signature || ' ';
    const donorName = donorInfoData?.name || '';

    return {
      'PrintDate': () => chapterDateStr,
      'CurrentDate': () => chapterDateStr,
      'TodayDate': () => chapterDateStr,
      'Today': () => chapterDateStr,
      'UnitID': () => this.data.unitId || ' ',
      'SDonorName': () => salutation ? `${salutation} ${donorName}`.trim() : donorName || ' ',
      'Signature': () => signature,
      'DonDate56d': () => donationDate?.isValid()
        ? donationDate.clone().add(56, 'days').format('MM-DD-YY') : ' ',
      'DonDate6m': () => donationDate?.isValid()
        ? donationDate.clone().add(6, 'months').format('MM-DD-YY') : ' ',
      'DonDate12m': () => donationDate?.isValid()
        ? donationDate.clone().add(12, 'months').format('MM-DD-YY') : ' ',
    };
  }

  private static readonly SEX_MAP: Record<string, string> = {
    'M': 'Male', 'F': 'Female',
    'Male': 'Male', 'Female': 'Female'
  };

  formatSex(value?: string | null): string {
    if (!value) return '---';
    return AuthorizeNotificationLetterDialog.SEX_MAP[value] || value;
  }

  formatDateUpperMonth(value?: string | null): string {
    if (!value) return '---';
    return value.replace(/(-[A-Za-z]{3}-)/, match => match.toUpperCase());
  }

  get f() {
    return this.form.controls;
  }

  get selectedLetterTitle(): string {
    const selected = this.selectedLetterItem();
    if (selected) return selected.letterTitle;
    return this.letterData()?.letterTitle || '';
  }

  onLetterTextChange(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const newText = textarea.value;

    // Check if text has been modified from original
    if (newText !== this.originalLetterText()) {
      this.letterTextModified.set(true);
      // If letter was saved but user modifies it, allow saving again
      this.letterSaved.set(false);
    } else {
      this.letterTextModified.set(false);
    }
  }

  onViewDonations(): void {
    this.currentSubPanel.set('test-results');
  }

  onViewInterdictions(): void {
    this.currentSubPanel.set('interdictions');
  }

  onSubPanelClose(): void {
    const panel = this.currentSubPanel();
    if (panel === 'interdictions') {
      this.interdictionsViewed.set(true);
    } else if (panel === 'test-results') {
      this.donationsViewed.set(true);
    }
    this.currentSubPanel.set(null);
  }

  onRetrieve(): void {
    this.loadLetterData();
  }

  onGenerate(): void {
    const compositeKey = this.form.get('letterCode')?.value;
    if (!compositeKey) {
      this.snackbarService.showError('Please select a letter code first');
      return;
    }

    const selectedLetter = this.selectedLetterItem();
    if (!selectedLetter) {
      this.snackbarService.showError('Selected letter not found');
      return;
    }

    this.loadLetterTemplateForCode(selectedLetter.letterId, selectedLetter.letterCode);
  }

  onSave(): void {
    if (!this.canSave()) {
      let message = 'Cannot save: ';
      if (!this.letterGenerated()) message += 'Please generate letter first. ';
      if (!this.donationsViewed()) message += 'Please view donations. ';
      if (!this.interdictionsViewed()) message += 'Please view interdictions. ';
      this.snackbarService.showError(message);
      return;
    }

    this.showSaveConfirmationDialog();
  }

  private showSaveConfirmationDialog(): void {
    // Create custom three-button dialog data
    const dialogData: ConfirmActionDialogData = {
      title: 'Save Notification Letter',
      message: 'Have you modified the contents of this notification letter?',
      confirmText: 'Yes',
      noButtonText: 'No',
      threeButton: true,
    };

    const dialogRef = this.dialog.open<ConfirmActionDialogComponent, ConfirmActionDialogData, string>(
      ConfirmActionDialogComponent,
      {
        width: '450px',
        data: dialogData,
        disableClose: true,
      }
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'yes') {
        // Yes - Save changed letter text
        this.saveLetter(true);
      } else if (result === 'no') {
        // No - Save letter as is (use original template)
        this.saveLetter(false);
      } else {
        // Cancel - Do nothing
        // User clicked Cancel or closed dialog
      }
    });
  }

  private saveLetter(letterModified: boolean): void {
    const compositeKey = this.form.get('letterCode')?.value;
    const letterText = this.form.get('letterText')?.value;
    const selected = this.selectedLetterItem();

    if (!compositeKey || !letterText || !selected) {
      this.snackbarService.showError('Letter code and text are required');
      return;
    }

    this.loading.set(true);

    const request: SaveLetterRequestDto = {
      donorId: this.data.donorId,
      letterCode: selected.letterCode,
      letterText: letterModified ? letterText : this.originalLetterText(),
      donationsViewed: this.donationsViewed(),
      interdictionsViewed: this.interdictionsViewed(),
      modifyInd: letterModified ? 'Y' : 'N',
      interCode: selected.interCode || this.data.interCode,
      unitId: this.data.unitId,
    };

    this.apiService
      .saveLetter(this.data.donorId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (saveResponse) => {
          // After successful save, retrieve the saved letter to display
          const letterSeqNo = saveResponse.letterSeqNo;

          // Update dialog data with letterSeqNo for future operations
          this.data.letterSeqNo = letterSeqNo;

          // Load the saved letter from database
          this.apiService
            .getLetterDetails(this.data.donorId, letterSeqNo)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (letter) => {
                this.loading.set(false);

                if (letter) {
                  // Update letter data
                  this.letterData.set(letter);

                  // Populate form with saved letter text (only refresh letter text area)
                  this.form.patchValue({
                    letterText: letter.letterText
                  });

                  // Update original text to match saved version
                  this.originalLetterText.set(letter.letterText);
                  this.letterTextModified.set(false);

                  // Mark letter as saved to disable Save button
                  this.letterSaved.set(true);

                  this.snackbarService.showSuccess('Notification letter saved successfully');
                } else {
                  this.snackbarService.showError('Letter saved but could not retrieve saved content');
                }

                // Do not close dialog - just refresh the letter text area
              },
              error: (err) => {
                this.loading.set(false);
                this.snackbarService.showError(
                  'Letter saved but failed to load saved content: ' + (err.message || 'Unknown error')
                );
                // Do not close dialog on error
              }
            });
        },
        error: (err) => {
          this.loading.set(false);
          this.snackbarService.showError(
            err.message || 'Failed to save notification letter'
          );
        },
      });
  }

  onAuthorize(): void {
    if (!this.canAuthorize()) {
      this.snackbarService.showError(
        'You must view both donations and interdictions before authorizing'
      );
      return;
    }

    const letterSeqNo = this.data.letterSeqNo;
    if (!letterSeqNo) {
      this.snackbarService.showError('Cannot authorize: No letter sequence number');
      return;
    }

    this.authorizationComments.set('');
    this.commentsSearch.set('');
    this.currentSubPanel.set('notification-logs');
  }

  onNotificationLogsOk(): void {
    const letterSeqNo = this.data.letterSeqNo;
    if (!letterSeqNo) return;
    this.currentSubPanel.set(null);
    this.executeAuthorize(letterSeqNo, this.authorizationComments());
  }

  onNotificationLogsCancel(): void {
    this.currentSubPanel.set(null);
  }

  onNotificationLogsSearch(term: string): void {
    this.commentsSearch.set(term);
  }

  private executeAuthorize(letterSeqNo: string, comments: string): void {
    this.loading.set(true);
    this.apiService
      .authorizeLetter({
        donorId: this.data.donorId,
        letterSeqNo,
        donationsViewed: this.donationsViewed(),
        interdictionsViewed: this.interdictionsViewed(),
        comments,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const currentData = this.letterData();
          if (currentData) {
            this.letterData.set({ ...currentData, authorizationStatus: 'AUTHORIZED' });
          }
          this.form.get('letterText')?.disable();
          this.loading.set(false);
          this.snackbarService.showSuccess('Notification letter authorized successfully');
        },
        error: (err) => {
          this.loading.set(false);
          const errRes = err.error?.errorResponse;
          const code = errRes?.errorCode?.trim();
          const msg = errRes?.error || err.error?.message;
          const apiMessage = code && msg ? `Error ${code}: ${msg}` : msg;
          this.snackbarService.showError(
            apiMessage || 'Failed to authorize notification letter'
          );
        },
      });
  }

  onReject(): void {
    // Show rejection confirmation dialog with optional reason
    const dialogRef = this.dialog.open<ConfirmActionDialogComponent, ConfirmActionDialogData, boolean>(
      ConfirmActionDialogComponent,
      {
        width: '400px',
        data: {
          title: 'Reject Notification Letter',
          message: 'Are you sure you want to reject this notification letter?',
          detail: 'This action cannot be undone.',
          confirmText: 'Reject',
          cancelText: 'Cancel',
        },
      }
    );

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.rejectLetter();
      }
    });
  }

  private rejectLetter(rejectionReason?: string): void {
    const letterSeqNo = this.data.letterSeqNo;
    if (!letterSeqNo) {
      this.snackbarService.showError('Cannot reject: No letter sequence number');
      return;
    }

    this.loading.set(true);
    this.apiService
      .rejectLetter({
        donorId: this.data.donorId,
        letterSeqNo,
        rejectionReason,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const currentData = this.letterData();
          if (currentData) {
            this.letterData.set({ ...currentData, authorizationStatus: 'REJECTED' });
          }
          this.form.get('letterText')?.disable();
          this.loading.set(false);
          this.snackbarService.showSuccess('Notification letter rejected successfully');
        },
        error: (err) => {
          this.loading.set(false);
          const errRes = err.error?.errorResponse;
          const code = errRes?.errorCode?.trim();
          const msg = errRes?.error || err.error?.message;
          const apiMessage = code && msg ? `Error ${code}: ${msg}` : msg;
          this.snackbarService.showError(
            apiMessage || 'Failed to reject notification letter'
          );
        },
      });
  }

  onClose(): void {
    this.dialogRef.close({ authorized: false, rejected: false });
  }
}
