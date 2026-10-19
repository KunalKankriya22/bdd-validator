import { Component, inject, OnInit, OnDestroy, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InstitutionForms } from '../institution-form/institution-forms';
import { buildInstitutionForm } from '../../forms-factory/institution-form.factory';
import { InstitutionService } from '../../service/institution.service';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UI_INSTITUTION } from '../../../../../core/constants/ui.constants';
import { TranslateModule } from '@ngx-translate/core';
import { mapInstitutionApiToForm } from '../../mapper/institution-from-api.mapper';
import { ROUTES } from '../../../../../core/constants/route.constants';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { HeaderService } from '../../../../../shared/services/header.service';
import { UppercaseDatePipe } from '../../../../../shared/pipes/uppercase-date.pipe';
import { Subject, takeUntil } from 'rxjs';


type InstitutionMode = 'create' | 'edit';

interface InstitutionHeader {
  institutionName: string;
  lastUpdatedBy: string;
  lastUpdatedAt: Date;
  timeZone: string;
}

@Component({
  selector: 'app-institution-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InstitutionForms,
    MatIconModule,
    MatCardModule,
    MatProgressSpinner,
    MatSnackBarModule,
    TranslateModule,
    UppercaseDatePipe
  ],
  templateUrl: './institution-page.html',
  styleUrls: ['./institution-page.scss'],
})
export class InstitutionPageComponent implements OnInit, OnDestroy {
  @ViewChild('institutionFormComponent') institutionFormComponent!: InstitutionForms;
  UI = UI_INSTITUTION;

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private institutionService = inject(InstitutionService);
  private snackBar = inject(MatSnackBar);
  private sanitizer = inject(DomSanitizer);
  private headerService = inject(HeaderService);

  private institutionId!: string;

  mode: InstitutionMode = 'create';
  institutionForm!: FormGroup;

  isSubmitting = signal(false);
  isSubmitted = signal(false);
  isLoading = signal(false);
  isFormReady = signal(false);
  isSubmitDisabled = signal(true);
  private destroy$ = new Subject<void>();
  header: InstitutionHeader | null = null;
  logoUrl: SafeUrl | string = 'assets/DefaultImageInstitution.png';

  ngOnInit(): void {
    // Determine mode first, before building form
    const routePath = this.route.snapshot.routeConfig?.path;
    this.mode = routePath === 'edit' ? 'edit' : 'create';

    // Build form with mode (affects validators)
    this.institutionForm = buildInstitutionForm(this.fb, this.mode);

    // Note: programId is auto-set by backend to 'VDIINST' (ProgramIDConstant.Institutions)
    // No need to set it from frontend as it gets overridden server-side

    // Subscribe to form status/value changes to update submit button state
    this.institutionForm.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateSubmitDisabled());

    this.institutionForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateSubmitDisabled());

    // Load data based on mode
    if (this.mode === 'edit') {
      this.loadInstitution();
    } else {
      this.setCreateDefaults();
    }

    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reload institution data for the new chapter
        this.isFormReady.set(false);
        this.institutionForm.reset();
        if (this.mode === 'edit') {
          this.loadInstitution();
        } else {
          this.setCreateDefaults();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateSubmitDisabled(): void {
    const disabled = this.isSubmitting() || !this.isFormReady() ||
      this.institutionForm.invalid ||
      (this.mode === 'edit' && this.institutionForm.pristine);
    this.isSubmitDisabled.set(disabled);
  }

  // CREATE MODE
  private setCreateDefaults(): void {
    this.institutionForm.patchValue({
      institutionId: 'WDLN',
      systemName: 'Blood Centers',
    });
    setTimeout(() => {
      this.isFormReady.set(true);
      this.updateSubmitDisabled();
    });
  }

  // EDIT MODE
  private loadInstitution(): void {
    this.isLoading.set(true);

    this.institutionService.getInstitution().pipe(takeUntil(this.destroy$)).subscribe({
      next: (institution) => {
        this.isLoading.set(false);

        if (!institution) {
          return;
        }

        this.institutionId = institution.instId;

        this.header = {
          institutionName: institution.instName,
          lastUpdatedBy: institution.lastModifiedBy || 'System',
          lastUpdatedAt: new Date(institution.lastModifiedDate),
          timeZone: this.formatTimezone(this.headerService.getCurrentChapterTimezone())
        };

        // Map API response to form structure
        // Convert GMT dates to chapter local timezone (mimics Oracle Forms behavior)
        const chapterTimezone = this.headerService.getCurrentChapterTimezone();
        const formData = mapInstitutionApiToForm(institution, chapterTimezone);

        console.log('Institution from API:', institution);
        console.log('Mapped form data:', formData);

        // Populate form with data
        this.institutionForm.patchValue(formData);
        this.formatInitialPhoneNumbers();

        // Disable effective date field in EDIT mode (matches Oracle Forms behavior)
        this.institutionForm.get('registrationInfo.effectiveDate')?.disable();

        // Mark form ready after population (prevents NG0100 on disabled binding)
        setTimeout(() => {
      this.isFormReady.set(true);
      this.updateSubmitDisabled();
    });

        // Load the logo
        this.loadLogo();
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error loading institution:', error);
        // TODO: Show error message to user
      }
    });
  }

  private loadLogo(cacheBust: boolean = true): void {
    this.institutionService.downloadLogo('inst_logo.png', cacheBust).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.logoUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
      },
      error: (err) => {
        this.logoUrl = 'assets/DefaultImageInstitution.png';
      }
    });
  }

  private formatInitialPhoneNumbers(): void {
    const phoneControl = this.institutionForm.get('contactInfo.phoneNumber');
    const faxControl = this.institutionForm.get('contactInfo.fax');

    // Format phone number
    if (phoneControl?.value) {
      const digitsOnly = phoneControl.value.replace(/\D/g, '');
      if (digitsOnly.length === 10) {
        const formatted = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
        phoneControl.setValue(formatted, { emitEvent: false });
      }
    }

    // Format fax number
    if (faxControl?.value) {
      const digitsOnly = faxControl.value.replace(/\D/g, '');
      if (digitsOnly.length === 10) {
        const formatted = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
        faxControl.setValue(formatted, { emitEvent: false });
      } else {
        faxControl.setValue(digitsOnly, { emitEvent: false });
      }
    }
  }

  // ACTIONS
  onSubmit(): void {
    this.isSubmitted.set(true);

    if (this.institutionForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.institutionForm.getRawValue();

    const request$ =
      this.mode === 'edit'
        ? this.institutionService.updateInstitution(
          this.institutionId,
          formValue
        )
        : this.institutionService.createInstitution(formValue);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        // Show success message
        const message = response?.message ||
          (this.mode === 'edit' ? 'Institution updated successfully' : 'Institution created successfully');

        this.snackBar.open(message, 'DISMISS', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });

        // Upload logo if a file is selected
        const selectedFile = this.institutionFormComponent?.selectedFile();

        if (selectedFile) {
          // Convert image to PNG and rename to inst_logo.png before uploading
          this.convertImageToPNG(selectedFile).then((convertedFile: File) => {
            // Update logo instantly from the converted file (before upload)
            const objectUrl = URL.createObjectURL(convertedFile);
            this.logoUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);

            this.institutionService.uploadLogo(convertedFile).subscribe({
              next: (fileName) => {
                // Refresh the global header logo
                this.headerService.loadInstitutionLogo();
                this.isSubmitting.set(false);
                this.router.navigate([ROUTES.APPLICATION_ADMIN.COMMON_VALIDATION.VIEW_INSTITUTION]);
              },
              error: (error) => {
                console.error('Error uploading logo:', error);
                this.isSubmitting.set(false);
                // Navigate anyway since the institution update/create was successful
                this.router.navigate([ROUTES.APPLICATION_ADMIN.COMMON_VALIDATION.VIEW_INSTITUTION]);
              }
            });
          }).catch((error: Error) => {
            console.error('Error converting image to PNG:', error);
            this.isSubmitting.set(false);
            this.router.navigate([ROUTES.APPLICATION_ADMIN.COMMON_VALIDATION.VIEW_INSTITUTION]);
          });
        } else {
          this.isSubmitting.set(false);
          this.router.navigate([ROUTES.APPLICATION_ADMIN.COMMON_VALIDATION.VIEW_INSTITUTION]);
        }
      },
      error: (error) => {
        this.isSubmitting.set(false);
        // Error is already displayed by the authInterceptor
        console.error('Error updating institution:', error);
      }
    });
  }

  onLogoRemoved(): void {
    this.isSubmitted.set(false);
  }

  onCancel(): void {
    if (this.mode === 'edit') {
      this.router.navigate([ROUTES.APPLICATION_ADMIN.COMMON_VALIDATION.VIEW_INSTITUTION]);
    } else {
      this.router.navigate(['/home']);
    }
  }

  onClearAll(): void {
    // Clear the uploaded file
    this.institutionFormComponent.removeFile();

    // Reset the form completely
    this.institutionForm.reset();

    // Reset form validation state
    this.institutionFormComponent.resetFormValidation(this.institutionForm);

    // Reset submitted state
    this.isSubmitted.set(false);

    // Set defaults only for create mode
    if (this.mode === 'create') {
      this.setCreateDefaults();
    }
  }

  onSkipAndAddChapters(): void {
    this.router.navigate(['/application-administration/create-chapter']);
  }

  onBack(): void {
    this.router.navigate([ROUTES.APPLICATION_ADMIN.COMMON_VALIDATION.VIEW_INSTITUTION]);
  }

  /**
   * Formats timezone for display, validating and sanitizing invalid values
   * @param timezone - Raw timezone value from API
   * @returns Formatted timezone string
   */
  private formatTimezone(timezone: string | undefined): string {
    if (!timezone) {
      return 'UTC';
    }

    // If it's a valid IANA timezone (e.g., "America/Chicago"), return as-is
    if (timezone.includes('/')) {
      return timezone;
    }

    // If it starts with GMT, return as-is (e.g., "GMT-06:00")
    if (timezone.toUpperCase().startsWith('GMT')) {
      return timezone;
    }

    // If it's just a timezone abbreviation (e.g., "PST", "EST", "CST"), return as-is
    if (/^[A-Z]{2,5}$/i.test(timezone)) {
      return timezone.toUpperCase();
    }

    // If it's a raw offset (e.g., "-06:00", "+05:30", "-23:00"), validate and format
    const offsetMatch = timezone.match(/^([+-])?(\d{1,2}):?(\d{2})?$/);
    if (offsetMatch) {
      const sign = offsetMatch[1] || '+';
      const hours = parseInt(offsetMatch[2], 10);
      const minutes = offsetMatch[3] ? parseInt(offsetMatch[3], 10) : 0;

      // Validate offset range: -12:00 to +14:00
      if (hours < 0 || hours > 14 || (hours === 14 && minutes > 0) || minutes >= 60) {
        console.warn(`Invalid timezone offset: ${timezone}. Using UTC.`);
        return 'UTC';
      }

      // Format as GMT±HH:MM
      const formattedHours = hours.toString().padStart(2, '0');
      const formattedMinutes = minutes.toString().padStart(2, '0');
      return `GMT${sign}${formattedHours}:${formattedMinutes}`;
    }

    // If we can't parse it, log warning and use UTC
    console.warn(`Unable to parse timezone: ${timezone}. Using UTC.`);
    return 'UTC';
  }

  /**
   * Converts an image file to PNG format and renames it to inst_logo.png
   * @param file - Original image file
   * @returns Promise<File> - Converted PNG file
   */
  private convertImageToPNG(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event: ProgressEvent<FileReader>) => {
        const img = new Image();

        img.onload = () => {
          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw image on canvas
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0);

          // Convert canvas to blob (PNG format)
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to convert image to PNG'));
                return;
              }

              // Create new File with PNG extension and inst_logo name
              const pngFile = new File([blob], 'inst_logo.png', {
                type: 'image/png',
                lastModified: Date.now()
              });

              resolve(pngFile);
            },
            'image/png',
            1.0 // Maximum quality
          );
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        img.src = event.target?.result as string;
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }
}
