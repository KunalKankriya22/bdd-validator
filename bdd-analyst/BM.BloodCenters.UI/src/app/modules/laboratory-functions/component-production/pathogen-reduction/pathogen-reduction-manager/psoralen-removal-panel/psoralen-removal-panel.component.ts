import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil } from 'rxjs';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { LoginService } from '@shared/services/login.service';
import { PathogenReductionManagerService } from '../services/pathogen-reduction-manager.service';
import { SterileDockingRequestDto } from '../models/pathogen-reduction.model';

export interface PsoralenRemovalData {
  unitId: string;
  process: string;
  weldMachine: string;
  waferLot: string;
  setLot: string;
  weldSealOk: string;
}

@Component({
  selector: 'app-psoralen-removal-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './psoralen-removal-panel.component.html',
  styleUrl: './psoralen-removal-panel.component.scss'
})
export class PsoralenRemovalPanelComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<PsoralenRemovalPanelComponent>);
  private readonly snackbarService = inject(SnackbarService);
  private readonly loginService = inject(LoginService);
  private readonly prService = inject(PathogenReductionManagerService);
  private readonly destroy$ = new Subject<void>();
  readonly data = inject(MAT_DIALOG_DATA, { optional: true });

  form!: FormGroup;
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
    // Set default Process value to PSORALEN
    this.processDisplay = 'PSORALEN';

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
    this.form = this.fb.group({
      weldSealOk: ['']
    });
  }

  getFieldError(fieldName: string): string | null {
    const control = this.form.get(fieldName);
    if (control && control.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) {
        return 'This field is required';
      }
    }
    return null;
  }

  isFormValid(): boolean {
    return this.form.valid;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackbarService.showError('Please fill in all required fields');
      return;
    }

    this.isSaving = true;

    const currentUser = this.loginService.getStoredUsername() || 'SYSTEM';
    const currentDateTime = new Date().toISOString();

    // Convert "Yes"/"No" to "Y"/"N" for API
    const weldSealOkValue = this.form.value.weldSealOk === 'Yes' ? 'Y' : 'N';

    // API call with PSORALEN process code and null values for weldMachine, waferLotNo, setLotNo
    const payload: SterileDockingRequestDto = {
      unitId: this.parsedUnitId, // Use parsed unit ID (without check digit) for API
      procCode: 'PSORALEN', // Process code is PSORALEN for remove psoralen
      weldMachine: '', // Null/empty for remove psoralen
      waferLotNo: '', // Null/empty for remove psoralen
      setLotNo: '', // Null/empty for remove psoralen
      weldOk: weldSealOkValue, // Convert "Yes"/"No" to "Y"/"N"
      dockDate: currentDateTime,
      dockUser: currentUser
    };

    this.prService.insertSterileDocking(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving = false;
          this.snackbarService.showSuccess('Psoralen Removal saved successfully');

          const formData: PsoralenRemovalData = {
            unitId: this.unitIdDisplay,
            process: this.processDisplay,
            weldMachine: this.weldMachineDisplay,
            waferLot: this.waferLotDisplay,
            setLot: this.setLotDisplay,
            weldSealOk: this.form.value.weldSealOk
          };

          this.dialogRef.close(formData);
        },
        error: (error) => {
          this.isSaving = false;
          const errorMessage = HttpErrorHandler.extractErrorMessage(error, 'Failed to save psoralen removal');
          this.snackbarService.showError(errorMessage);
        }
      });
  }
}
