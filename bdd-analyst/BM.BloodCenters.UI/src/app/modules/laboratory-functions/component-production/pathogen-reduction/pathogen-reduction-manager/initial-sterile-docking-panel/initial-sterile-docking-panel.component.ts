import { Component, OnInit, inject, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
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
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoginService } from '@shared/services/login.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { PathogenReductionManagerService } from '../services/pathogen-reduction-manager.service';
import { SterileDockingRequestDto } from '../models/pathogen-reduction.model';

export interface InitialSterileDockingData {
  unitId: string;
  volumeTypeSet?: string; // Volume type set from parent form
  process: string;
  weldMachine: string;
  waferLot: string;
  setLot: string;
  weldSealOk: string;
}

@Component({
  selector: 'app-initial-sterile-docking-panel',
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
    MatSelectModule,
    NgxMatSelectSearchModule,
    UnitIdFieldComponent
  ],
  templateUrl: './initial-sterile-docking-panel.component.html',
  styleUrl: './initial-sterile-docking-panel.component.scss'
})
export class InitialSterileDockingPanelComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<InitialSterileDockingPanelComponent>);
  private readonly snackbarService = inject(SnackbarService);
  private readonly loginService = inject(LoginService);
  private readonly prService = inject(PathogenReductionManagerService);
  private readonly destroy$ = new Subject<void>();
  readonly data = inject(MAT_DIALOG_DATA, { optional: true });

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  form!: FormGroup;
  isSaving = false;
  private validatedUnitId: string | null = null;
  savedUnitId: string | null = null; // Read-only unit ID from parent (parsed format)
  savedManualUnitId: string | null = null; // Manual unit ID with check digit for display
  savedVolumeTypeSet: string | null = null; // Volume type set from parent form
  processHint = ''; // Hint text for Process field (similar to Unit ID)

  // Sterile docking machines from API
  sterileDockingMachines: Array<{ code: string; codeDesc: string }> = [];
  filteredWeldMachines: Array<{ code: string; codeDesc: string }> = [];
  weldMachineSearchControl = new FormControl('');

  // Wafer Lot Numbers from API
  waferLotNumbers: Array<{ lotNumber: string }> = [];
  filteredWaferLots: Array<{ lotNumber: string }> = [];
  waferLotSearchControl = new FormControl('');

  // Set Lot Numbers from API
  setLotNumbers: Array<{ lotNumber: string }> = [];
  filteredSetLots: Array<{ lotNumber: string }> = [];
  setLotSearchControl = new FormControl('');

  ngOnInit(): void {
    // Get saved unit ID and volume type set from dialog data
    this.savedUnitId = this.data?.unitId || null;
    this.savedManualUnitId = this.data?.manualUnitId || null;
    this.savedVolumeTypeSet = this.data?.volumeTypeSet || null;

    // Set validatedUnitId directly since we're using read-only display (no unit-id-field component)
    if (this.savedUnitId) {
      this.validatedUnitId = this.savedUnitId;
    }

    this.initializeForm();
    this.loadSterileDockingMachines();
    this.loadWaferLotNumbers();
    // Load set lots only if we have a volume type set
    if (this.savedVolumeTypeSet) {
      this.loadSetLotNumbers(this.savedVolumeTypeSet);
    }
    this.setupWeldMachineSearch();
    this.setupWaferLotSearch();
    this.setupSetLotSearch();
  }

  ngAfterViewInit(): void {
    // No longer needed - validatedUnitId is set directly in ngOnInit
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      process: [{ value: 'SUITABILITY', disabled: true }], // Hardcoded value, disabled
      weldMachine: [''],
      waferLot: [''],
      setLot: [''],
      weldSealOk: ['']
    });
  }

  /**
   * Load sterile docking machines from API
   */
  private loadSterileDockingMachines(): void {
    this.prService.getSterileDockingMachines()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (machines) => {
          this.sterileDockingMachines = machines;
          this.filteredWeldMachines = machines;
        },
        error: () => {
          this.snackbarService.showError('Failed to load sterile docking machines');
        }
      });
  }

  /**
   * Setup search filtering for Weld Machine dropdown
   */
  private setupWeldMachineSearch(): void {
    this.weldMachineSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchText) => {
        this.filterWeldMachines(searchText || '');
      });
  }

  /**
   * Filter weld machines based on search text
   */
  private filterWeldMachines(searchText: string): void {
    if (!searchText) {
      this.filteredWeldMachines = this.sterileDockingMachines;
      return;
    }

    const search = searchText.toLowerCase();
    this.filteredWeldMachines = this.sterileDockingMachines.filter(machine =>
      machine.code.toLowerCase().includes(search) ||
      machine.codeDesc.toLowerCase().includes(search)
    );
  }

  /**
   * Load wafer lot numbers from API
   */
  private loadWaferLotNumbers(): void {
    this.prService.getWaferLotNumbers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (waferLots) => {
          this.waferLotNumbers = waferLots;
          this.filteredWaferLots = waferLots;
        },
        error: () => {
          this.snackbarService.showError('Failed to load wafer lot numbers');
        }
      });
  }

  /**
   * Setup search filtering for Wafer Lot dropdown
   */
  private setupWaferLotSearch(): void {
    this.waferLotSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchText) => {
        this.filterWaferLots(searchText || '');
      });
  }

  /**
   * Filter wafer lots based on search text
   */
  private filterWaferLots(searchText: string): void {
    if (!searchText) {
      this.filteredWaferLots = this.waferLotNumbers;
      return;
    }

    const search = searchText.toLowerCase();
    this.filteredWaferLots = this.waferLotNumbers.filter(wafer =>
      wafer.lotNumber.toLowerCase().includes(search)
    );
  }

  /**
   * Setup search filtering for Set Lot dropdown
   */
  private setupSetLotSearch(): void {
    this.setLotSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchText) => {
        this.filterSetLots(searchText || '');
      });
  }

  /**
   * Filter set lots based on search text
   */
  private filterSetLots(searchText: string): void {
    if (!searchText) {
      this.filteredSetLots = this.setLotNumbers;
      return;
    }

    const search = searchText.toLowerCase();
    this.filteredSetLots = this.setLotNumbers.filter(setLot =>
      setLot.lotNumber.toLowerCase().includes(search)
    );
  }

  /**
   * Load set lot numbers from API based on volume type set
   * @param volumeTypeSet - Volume type set code from parent form
   */
  private loadSetLotNumbers(volumeTypeSet: string): void {
    if (!volumeTypeSet) {
      // No volume type set available, clear the set lots
      this.setLotNumbers = [];
      this.filteredSetLots = [];
      return;
    }

    this.prService.getSetLotNumbers(volumeTypeSet)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (setLots) => {
          this.setLotNumbers = setLots;
          this.filteredSetLots = setLots;
        },
        error: () => {
          this.snackbarService.showError('Failed to load set lot numbers');
        }
      });
  }

  onUnitIdValidated(response: UnitValidationResponse): void {
    if (response.parsedUnitId) {
      this.validatedUnitId = response.parsedUnitId;
    }
  }

  onUnitIdCleared(): void {
    this.validatedUnitId = null;
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
    return !!this.validatedUnitId && this.form.valid;
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

    const payload: SterileDockingRequestDto = {
      unitId: this.validatedUnitId!, // Non-null assertion - always set in ngOnInit
      procCode: 'SUITABILITY', // Always send "SUITABILITY"
      weldMachine: this.form.value.weldMachine,
      waferLotNo: this.form.value.waferLot,
      setLotNo: this.form.value.setLot,
      weldOk: weldSealOkValue, // Convert "Yes"/"No" to "Y"/"N"
      dockDate: currentDateTime,
      dockUser: currentUser
    };

    this.prService.insertSterileDocking(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving = false;
          this.snackbarService.showSuccess('Initial Sterile Docking saved successfully');

          const formData: InitialSterileDockingData = {
            unitId: this.validatedUnitId!,
            process: this.form.value.process,
            weldMachine: this.form.value.weldMachine,
            waferLot: this.form.value.waferLot,
            setLot: this.form.value.setLot,
            weldSealOk: this.form.value.weldSealOk
          };

          this.dialogRef.close(formData);
        },
        error: (error) => {
          this.isSaving = false;
          const errorMessage = HttpErrorHandler.extractErrorMessage(error, 'Failed to save sterile docking');
          this.snackbarService.showError(errorMessage);
        }
      });
  }
}
