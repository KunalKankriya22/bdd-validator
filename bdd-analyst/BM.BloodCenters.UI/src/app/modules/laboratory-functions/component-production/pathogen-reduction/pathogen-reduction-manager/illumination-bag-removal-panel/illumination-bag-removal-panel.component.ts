import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { LoginService } from '@shared/services/login.service';
import { PathogenReductionManagerService } from '../services/pathogen-reduction-manager.service';
import { SterileDockingRequestDto } from '../models/pathogen-reduction.model';

export interface IlluminationBagRemovalData {
  unitId: string;
  process: string;
  weldMachine: string;
  waferLot: string;
  setLot: string;
  weldSealOk: string;
}

@Component({
  selector: 'app-illumination-bag-removal-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './illumination-bag-removal-panel.component.html',
  styleUrls: ['./illumination-bag-removal-panel.component.scss']
})
export class IlluminationBagRemovalPanelComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<IlluminationBagRemovalPanelComponent>);
  private readonly snackbarService = inject(SnackbarService);
  private readonly loginService = inject(LoginService);
  private readonly prService = inject(PathogenReductionManagerService);
  private readonly destroy$ = new Subject<void>();
  readonly data = inject(MAT_DIALOG_DATA, { optional: true });

  illuminationForm!: FormGroup;
  isSaving = false;

  // Display values for read-only fields (populated from data)
  unitIdDisplay = ''; // Formatted manual unit ID for display
  parsedUnitId = ''; // Parsed unit ID for API
  processDisplay = '';
  weldMachineDisplay = '';
  waferLotDisplay = '';
  setLotDisplay = '';

  ngOnInit(): void {
    // Get saved unit ID from dialog data
    if (this.data?.unitId) {
      this.parsedUnitId = this.data.unitId; // Store parsed for API
      // Use manual unit ID for display if available, otherwise use parsed
      this.unitIdDisplay = this.data.manualUnitId || this.data.unitId;
    }
    // Set default Process value to ILLUMINATION
    this.processDisplay = 'ILLUMINATION';

    // Populate other display fields from dialog data if available
    if (this.data?.weldMachine) {
      this.weldMachineDisplay = this.data.weldMachine;
    }
    if (this.data?.waferLot) {
      this.waferLotDisplay = this.data.waferLot;
    }
    if (this.data?.setLot) {
      this.setLotDisplay = this.data.setLot;
    }

    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.illuminationForm = this.fb.group({
      weldSealOK: ['']
    });
  }

  getFieldError(fieldName: string): string | null {
    const control = this.illuminationForm.get(fieldName);
    if (control && control.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) {
        return 'This field is required';
      }
    }
    return null;
  }

  isFormValid(): boolean {
    return this.illuminationForm.valid;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onUpdate(): void {
    if (this.illuminationForm.valid) {
      // Handle update logic
    }
  }

  onSave(): void {
    if (this.illuminationForm.invalid) {
      this.illuminationForm.markAllAsTouched();
      this.snackbarService.showError('Please fill in all required fields');
      return;
    }

    this.isSaving = true;

    const currentUser = this.loginService.getStoredUsername() || 'SYSTEM';
    const currentDateTime = new Date().toISOString();

    // Convert "Yes"/"No" to "Y"/"N" for API
    const weldSealOkValue = this.illuminationForm.value.weldSealOK === 'Yes' ? 'Y' : 'N';

    // API call with ILLUMINATION process code and null values for weldMachine, waferLotNo, setLotNo
    const payload: SterileDockingRequestDto = {
      unitId: this.parsedUnitId, // Use parsed unit ID (without check digit) for API
      procCode: 'ILLUMINATION', // Process code is ILLUMINATION for remove illumination
      weldMachine: '', // Null/empty for remove illumination
      waferLotNo: '', // Null/empty for remove illumination
      setLotNo: '', // Null/empty for remove illumination
      weldOk: weldSealOkValue, // Convert "Yes"/"No" to "Y"/"N"
      dockDate: currentDateTime,
      dockUser: currentUser
    };

    this.prService.insertSterileDocking(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving = false;
          this.snackbarService.showSuccess('Illumination Bag Removal saved successfully');

          const formData: IlluminationBagRemovalData = {
            unitId: this.unitIdDisplay,
            process: this.processDisplay,
            weldMachine: this.weldMachineDisplay,
            waferLot: this.waferLotDisplay,
            setLot: this.setLotDisplay,
            weldSealOk: this.illuminationForm.value.weldSealOK
          };

          this.dialogRef.close(formData);
        },
        error: (error) => {
          this.isSaving = false;
          const errorMessage = HttpErrorHandler.extractErrorMessage(error, 'Failed to save illumination bag removal');
          this.snackbarService.showError(errorMessage);
        }
      });
  }
}
