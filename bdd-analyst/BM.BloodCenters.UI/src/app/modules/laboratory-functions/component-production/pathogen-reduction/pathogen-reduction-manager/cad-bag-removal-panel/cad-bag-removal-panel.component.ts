import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { PathogenReductionManagerService } from '../services/pathogen-reduction-manager.service';
import { SnackbarService } from '../../../../../../shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { LoginService } from '../../../../../../shared/services/login.service';
import { SterileDockingRequestDto } from '../models/pathogen-reduction.model';

export interface CadBagRemovalData {
  unitId: string; // Manual unit ID with check digit (for display)
  parsedUnitId: string; // Parsed unit ID without check digit (for API)
  suitProdCode: string;
}

@Component({
  selector: 'app-cad-bag-removal-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule
  ],
  templateUrl: './cad-bag-removal-panel.component.html',
  styleUrl: './cad-bag-removal-panel.component.scss'
})
export class CadBagRemovalPanelComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CadBagRemovalPanelComponent>);
  private data = inject<CadBagRemovalData>(MAT_DIALOG_DATA, { optional: true });
  private pathogenService = inject(PathogenReductionManagerService);
  private snackbarService = inject(SnackbarService);
  private loginService = inject(LoginService);

  cadRemovalForm!: FormGroup;
  isSaving = false;

  // Display values for read-only fields (matching Illumination pattern)
  unitIdDisplay = ''; // Manual unit ID with check digit (for display)
  parsedUnitIdForApi = ''; // Parsed unit ID without check digit (for API)
  processDisplay = '';
  weldMachineDisplay = '';
  waferLotDisplay = '';
  setLotDisplay = '';

  ngOnInit(): void {

    // Get saved unit ID from dialog data (if passed)
    if (this.data?.unitId) {
      this.unitIdDisplay = this.data.unitId; // Display with check digit
    } else {
    }

    // Get parsed unit ID for API call (without check digit)
    if (this.data?.parsedUnitId) {
      this.parsedUnitIdForApi = this.data.parsedUnitId;
    }

    // Set default Process value to CAD
    this.processDisplay = 'CAD';

    this.initializeForm();
  }

  private initializeForm(): void {
    // Match Illumination pattern - only Weld/Seal OK is in the form
    this.cadRemovalForm = this.fb.group({
      weldSealOK: ['']
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    // Match Illumination pattern - validate form
    if (this.cadRemovalForm.invalid) {
      this.cadRemovalForm.markAllAsTouched();
      this.snackbarService.showError('Please fill in all required fields');
      return;
    }

    this.isSaving = true;

    // Convert "Yes"/"No" to "Y"/"N" for API (matching Illumination)
    const weldSealOkValue = this.cadRemovalForm.value.weldSealOK === 'Yes' ? 'Y' : 'N';
    // Send date in ISO format - backend will convert from chapter-local to GMT
    const currentDateTime = new Date().toISOString();
    const currentUser = this.loginService.getStoredUsername() || 'SYSTEM';

    // API call with CAD process code and empty values (matching Illumination pattern)
    const payload: SterileDockingRequestDto = {
      unitId: this.parsedUnitIdForApi || '', // Use parsed unit ID (without check digit) for API
      procCode: 'CAD', // Process code is CAD
      weldMachine: '', // Empty for CAD bag removal
      waferLotNo: '', // Empty for CAD bag removal
      setLotNo: '', // Empty for CAD bag removal
      weldOk: weldSealOkValue, // Convert "Yes"/"No" to "Y"/"N"
      dockDate: currentDateTime,
      dockUser: currentUser // Get current logged-in user
    };

    this.pathogenService.insertSterileDocking(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.snackbarService.showSuccess('CAD Bag Removal saved successfully');

        // Close and return success
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.isSaving = false;
        const errorMessage = HttpErrorHandler.extractErrorMessage(error, 'Failed to save CAD bag removal');
        this.snackbarService.showError(errorMessage);
      }
    });
  }
}
