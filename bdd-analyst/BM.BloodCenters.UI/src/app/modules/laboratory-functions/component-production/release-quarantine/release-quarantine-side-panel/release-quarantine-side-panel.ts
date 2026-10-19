import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ReleaseQuarantineApiService } from '../services/release-quarantine-api.service';
import {
  QuarantineProductInfoDto,
  ReleaseQuarantineProductDto,
  QuarantineReasonDto,
  StorageDevice,
  StorageRack,
  StorageTray,
  RejectCode,
  UnitGridItem,
  SaveReleaseResponse,
  RemoveReasonsRequest,
  Warning,
  HARD_ERROR_CODES,
} from '../models/release-quarantine.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { WarningDialogComponent, WarningDialogData, WarningDialogResult } from '../warning-dialog/warning-dialog';

/**
 * Side panel component for releasing products from quarantine
 * Opens when a valid product is found after scanning Unit ID and Product Code
 */
@Component({
  selector: 'app-release-quarantine-side-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    DataTable,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './release-quarantine-side-panel.html',
  styleUrl: './release-quarantine-side-panel.scss',
})
export class ReleaseQuarantineSidePanelComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `release-quarantine-panel-${ReleaseQuarantineSidePanelComponent.nextId++}`;

  protected readonly elementId = (name: string) =>
    `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) =>
    `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) =>
    `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ReleaseQuarantineApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  // Warehouse display from header
  protected readonly warehouseDisplay = computed(() => {
    const id = this.headerService.warehouseId();
    const name = this.headerService.warehouseName();
    if (!id) return '-';
    return name ? `${id} - ${name}` : id;
  });

  // Inputs
  @Input() productInfo: QuarantineProductInfoDto | null = null;
  @Input() quarantineType: string = '';
  @Input() gridRowData: UnitGridItem | null = null; // Hidden fields from grid
  @Input() rejectCodes: RejectCode[] = []; // Pre-loaded reject codes
  @Input() codeScheme: string = 'I';

  // Outputs
  @Output() released = new EventEmitter<SaveReleaseResponse>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() reasonsUpdated = new EventEmitter<QuarantineReasonDto[]>();

  // Adaptive dropdown sentinel constants
  readonly selectPanelLoadingValue = '__PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__PANEL_EMPTY__';

  // Signal-based state
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal<boolean>(false);
  protected readonly reasonsTableData = signal<QuarantineReasonDto[]>([]);
  protected readonly selectedReasonCodes = signal<Set<string>>(new Set());
  protected readonly formValid = signal<boolean>(false);

  // Storage location signals
  protected readonly storageDevices = signal<StorageDevice[]>([]);
  protected readonly storageRacks = signal<StorageRack[]>([]);
  protected readonly storageTrays = signal<StorageTray[]>([]);
  protected readonly rejectCodeOptions = signal<RejectCode[]>([]);
  protected readonly selectedDeviceType = signal<string | null>(null);
  protected readonly hideStorageFields = signal<boolean>(false);

  // Per-dropdown loading flags
  protected readonly isLoadingDevices = signal(false);
  protected readonly isLoadingRacks = signal(false);
  protected readonly isLoadingTrays = signal(false);

  // Adaptive dropdown search controls
  readonly rejectCodeSearchControl = new FormControl('');
  readonly deviceSearchControl = new FormControl('');
  readonly rackSearchControl = new FormControl('');
  readonly traySearchControl = new FormControl('');

  readonly rejectCodeSearch = signal('');
  readonly deviceSearch = signal('');
  readonly rackSearch = signal('');
  readonly traySearch = signal('');

  // Computed filtered lists for adaptive dropdowns
  readonly filteredRejectCodes = computed(() => {
    const search = this.rejectCodeSearch().toLowerCase();
    const options = this.rejectCodeOptions();
    if (!search) return options;
    return options.filter(o =>
      o.code?.toLowerCase().includes(search) || o.description?.toLowerCase().includes(search)
    );
  });

  readonly filteredDevices = computed(() => {
    const search = this.deviceSearch().toLowerCase();
    const options = this.storageDevices();
    if (!search) return options;
    return options.filter(o =>
      o.deviceNumber?.toLowerCase().includes(search) || o.description?.toLowerCase().includes(search)
    );
  });

  readonly filteredRacks = computed(() => {
    const search = this.rackSearch().toLowerCase();
    const options = this.storageRacks();
    if (!search) return options;
    return options.filter(o =>
      o.rackNumber?.toLowerCase().includes(search) || o.description?.toLowerCase().includes(search)
    );
  });

  readonly filteredTrays = computed(() => {
    const search = this.traySearch().toLowerCase();
    const options = this.storageTrays();
    if (!search) return options;
    return options.filter(o =>
      o.trayNumber?.toLowerCase().includes(search) || o.description?.toLowerCase().includes(search)
    );
  });

  // Accumulated override codes across warning retries
  private accumulatedOverrides: string[] = [];

  // Computed
  protected readonly allReasonsSelected = computed(() => {
    const total = this.reasonsTableData().length;
    return total > 0 && this.selectedReasonCodes().size === total;
  });

  protected readonly hasPartialSelection = computed(() => {
    return this.selectedReasonCodes().size > 0
      && !this.allReasonsSelected()
      && this.quarantineType === 'IT';
  });

  protected readonly saveButtonLabel = computed(() => {
    return this.hasPartialSelection() ? 'REMOVE REASONS' : 'SAVE';
  });

  protected readonly isSaveDisabled = computed(() => {
    if (this.loading() || this.isLoadingDevices() || this.isLoadingRacks() || this.isLoadingTrays()) {
      return true;
    }
    if (this.hasPartialSelection()) {
      return false;
    }
    return !this.formValid() || !this.allReasonsSelected();
  });

  // Form
  form!: FormGroup;

  // Reasons Table Configuration
  reasonsTableConfig: DataTableConfig<QuarantineReasonDto> = {
    columns: [
      { key: 'reasonCode', header: 'Quarantine', sortable: false, width: '100px' },
      { key: 'reasonDescription', header: 'Reason and Description', sortable: false },
    ],
    enableSelection: true,
    selectionKey: 'reasonCode',
    showPagination: false,
    stickyHeader: false,
  };

  ngOnInit(): void {
    // Populate reject code signal from @Input
    this.rejectCodeOptions.set(this.rejectCodes || []);

    // Wire search controls to signals
    this.rejectCodeSearchControl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.rejectCodeSearch.set(v || ''));
    this.deviceSearchControl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.deviceSearch.set(v || ''));
    this.rackSearchControl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.rackSearch.set(v || ''));
    this.traySearchControl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.traySearch.set(v || ''));

    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    if (this.productInfo?.reasons) {
      this.reasonsTableData.set(this.productInfo.reasons);
    }

    this.form = this.fb.group({
      restockFlag: [{ value: '', disabled: true }],
      rejectCode: [''],
      deviceType: [''],
      deviceNumber: [''],
      rackNumber: [''],
      trayNumber: [''],
      description: [{ value: '', disabled: true }],
    });

    // Watch all form value changes to update formValid signal
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.formValid.set(this.form.valid);
      });

    // Watch form status changes (for when validators are added/removed)
    this.form.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.formValid.set(this.form.valid);
      });

    // Watch restockFlag changes to manage conditional validation and load storage
    this.form.get('restockFlag')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value === 'Y') {
          if (this.quarantineType === 'RT' && this.gridRowData?.inventoryClass === 'SP') {
            this.snackbarService.showError('This is a Special Inventory Class product and cannot be restocked.');
            this.form.patchValue({ restockFlag: 'N' });
            return;
          }
          this.form.get('rejectCode')?.clearValidators();
          this.form.patchValue({ rejectCode: '' });
          this.loadStorageDevices();
        } else if (value === 'N') {
          this.form.get('rejectCode')?.setValidators([Validators.required]);
          this.clearStorageFields();
        } else {
          this.form.get('rejectCode')?.clearValidators();
          this.clearStorageFields();
        }

        this.form.get('rejectCode')?.updateValueAndValidity({ emitEvent: false });
        this.form.get('deviceNumber')?.updateValueAndValidity({ emitEvent: false });
        this.form.get('rackNumber')?.updateValueAndValidity({ emitEvent: false });
        this.form.get('trayNumber')?.updateValueAndValidity({ emitEvent: false });
      });

    // Watch deviceNumber changes to load racks
    this.form.get('deviceNumber')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((deviceNumber) => {
        // Clear dependent fields and search controls
        this.form.patchValue({ rackNumber: '', trayNumber: '', description: '' });
        this.storageRacks.set([]);
        this.storageTrays.set([]);
        this.rackSearchControl.setValue('');
        this.traySearchControl.setValue('');

        if (deviceNumber) {
          // Find the selected device to get deviceType and description
          const device = this.storageDevices().find(d => d.deviceNumber === deviceNumber);
          if (device) {
            this.selectedDeviceType.set(device.deviceType);
            this.form.patchValue({
              deviceType: device.deviceType,
              description: device.description,
            });
            this.form.get('rackNumber')?.enable({ emitEvent: false });
            this.form.get('trayNumber')?.disable({ emitEvent: false });
            this.loadStorageRacks();
          }
        } else {
          this.selectedDeviceType.set(null);
          this.form.get('rackNumber')?.disable({ emitEvent: false });
          this.form.get('trayNumber')?.disable({ emitEvent: false });
        }
      });

    // Watch rackNumber changes to load trays and update description
    this.form.get('rackNumber')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((rackNumber) => {
        // Clear dependent fields and search controls
        this.form.patchValue({ trayNumber: '' });
        this.storageTrays.set([]);
        this.traySearchControl.setValue('');

        if (rackNumber) {
          const rack = this.storageRacks().find(r => r.rackNumber === rackNumber);
          if (rack) {
            this.form.patchValue({ description: rack.description });
          }
          this.form.get('trayNumber')?.enable({ emitEvent: false });
          this.loadStorageTrays();
        } else {
          this.form.get('trayNumber')?.disable({ emitEvent: false });
        }
      });

    // Watch trayNumber changes to update description
    this.form.get('trayNumber')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((trayNumber) => {
        if (trayNumber) {
          const tray = this.storageTrays().find(t => t.trayNumber === trayNumber);
          if (tray) {
            this.form.patchValue({ description: tray.description });
          }
        }
      });

    // Initialize formValid signal
    this.formValid.set(this.form.valid);
  }

  get f() {
    return this.form.controls;
  }

  private clearStorageFields(): void {
    this.form.get('deviceType')?.clearValidators();
    this.form.get('deviceNumber')?.clearValidators();
    this.form.get('rackNumber')?.clearValidators();
    this.form.get('trayNumber')?.clearValidators();

    this.form.patchValue({
      deviceType: '',
      deviceNumber: '',
      rackNumber: '',
      trayNumber: '',
      description: '',
    });

    this.storageDevices.set([]);
    this.storageRacks.set([]);
    this.storageTrays.set([]);
    this.selectedDeviceType.set(null);
    this.hideStorageFields.set(false);
  }

  private loadStorageDevices(): void {
    if (!this.gridRowData?.productType) {
      this.snackbarService.showError('Product type information is missing.');
      return;
    }

    this.isLoadingDevices.set(true);

    this.apiService
      .getStorageDevices(this.gridRowData.productType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (devices) => {
          this.isLoadingDevices.set(false);
          this.storageDevices.set(devices);

          // Check if all devices are type "N" (no storage location needed)
          const allDevicesTypeN = devices.every(d => d.deviceType === 'N');

          if (allDevicesTypeN && devices.length > 0) {
            // Hide storage fields and auto-select device type N
            this.hideStorageFields.set(true);
            this.selectedDeviceType.set('N');
            this.form.patchValue({ deviceType: 'N' });
          } else {
            this.hideStorageFields.set(false);
            this.form.get('deviceNumber')?.setValidators([Validators.required]);
            this.form.get('rackNumber')?.setValidators([Validators.required]);
            this.form.get('trayNumber')?.setValidators([Validators.required]);
            this.form.get('deviceNumber')?.updateValueAndValidity();
            this.form.get('rackNumber')?.disable({ emitEvent: false });
            this.form.get('rackNumber')?.updateValueAndValidity({ emitEvent: false });
            this.form.get('trayNumber')?.disable({ emitEvent: false });
            this.form.get('trayNumber')?.updateValueAndValidity({ emitEvent: false });
          }
        },
        error: (err) => {
          this.isLoadingDevices.set(false);
        },
      });
  }

  private loadStorageRacks(): void {
    if (!this.gridRowData) {
      return;
    }

    const deviceType = this.selectedDeviceType();
    const deviceNumber = this.form.get('deviceNumber')?.value;

    if (!deviceType || !deviceNumber) {
      return;
    }

    this.isLoadingRacks.set(true);

    this.apiService
      .getStorageRacks(
        deviceType,
        deviceNumber,
        this.gridRowData.productType,
        this.gridRowData.bloodType,
        this.gridRowData.inventoryClass // Maps to storageClass
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (racks) => {
          this.isLoadingRacks.set(false);
          this.storageRacks.set(racks);
        },
        error: (err) => {
          this.isLoadingRacks.set(false);
        },
      });
  }

  private loadStorageTrays(): void {
    if (!this.gridRowData) {
      return;
    }

    const deviceType = this.selectedDeviceType();
    const deviceNumber = this.form.get('deviceNumber')?.value;
    const rackNumber = this.form.get('rackNumber')?.value;

    if (!deviceType || !deviceNumber || !rackNumber) {
      return;
    }

    this.isLoadingTrays.set(true);

    this.apiService
      .getStorageTrays(
        deviceType,
        deviceNumber,
        rackNumber,
        this.gridRowData.productType,
        this.gridRowData.bloodType,
        this.gridRowData.inventoryClass
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (trays) => {
          this.isLoadingTrays.set(false);
          this.storageTrays.set(trays);
        },
        error: (err) => {
          this.isLoadingTrays.set(false);
        },
      });
  }


  onReasonsSelectionChange(selectedRows: QuarantineReasonDto[]): void {
    const selected = new Set(selectedRows.map(r => r.reasonCode));
    this.selectedReasonCodes.set(selected);

    const allSelected = selected.size === this.reasonsTableData().length && selected.size > 0;

    if (!allSelected) {
      // Not all reasons selected — disable restock and reset everything below
      this.form.patchValue({ restockFlag: '', rejectCode: '' });
      this.form.get('restockFlag')?.disable({ emitEvent: false });
      this.form.get('restockFlag')?.clearValidators();
      this.form.get('restockFlag')?.updateValueAndValidity({ emitEvent: false });
      this.form.get('rejectCode')?.clearValidators();
      this.form.get('rejectCode')?.updateValueAndValidity();
      this.clearStorageFields();
      this.formValid.set(this.form.valid);
    } else if (this.productInfo?.isExpired) {
      // All selected + expired → force Restock to No, lock it
      // Enable briefly to allow patchValue to emit valueChanges (sets up reject code path)
      this.form.get('restockFlag')?.enable({ emitEvent: false });
      this.form.patchValue({ restockFlag: 'N' });
      this.form.get('restockFlag')?.disable({ emitEvent: false });
    } else {
      // All selected + not expired → enable Restock
      this.form.get('restockFlag')?.enable({ emitEvent: false });
      this.form.get('restockFlag')?.setValidators([Validators.required]);
      this.form.get('restockFlag')?.updateValueAndValidity();
      this.formValid.set(this.form.valid);
    }
  }

  onSubmit(): void {
    this.submitted.set(true);

    if (!this.productInfo) {
      this.snackbarService.showError('Product information not available.');
      return;
    }

    if (this.hasPartialSelection()) {
      this.performRemoveReasons();
      return;
    }

    // Mark all fields as touched to show validation errors
    this.form.markAllAsTouched();

    if (!this.allReasonsSelected()) {
      this.snackbarService.showError('Please select all reasons.');
      return;
    }

    if (this.form.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      this.snackbarService.showError('Please fill in all required fields.');
      return;
    }

    this.accumulatedOverrides = [];
    this.performSave([]);
  }

  private performRemoveReasons(): void {
    const request: RemoveReasonsRequest = {
      unitId: this.productInfo!.unitId,
      productCode: this.productInfo!.productCode,
      aliquot: this.productInfo!.aliquot || '',
      reasonCodes: Array.from(this.selectedReasonCodes()),
    };

    this.loading.set(true);
    this.error.set(null);

    this.apiService
      .removeReasons(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          const remaining = response.remainingReasons.map(r => ({
            reasonCode: r.reasonCode!,
            reasonDescription: r.reasonDescription!,
          }));
          this.reasonsTableData.set(remaining);
          this.selectedReasonCodes.set(new Set());
          this.submitted.set(false);
          this.reasonsUpdated.emit(remaining);
          this.snackbarService.showSuccess(
            `${response.removedCount} reason(s) removed. ${remaining.length} remaining.`
          );
        },
        error: (err) => {
          this.loading.set(false);
        },
      });
  }

  private performSave(overrides: string[]): void {
    const formValue = this.form.getRawValue(); // Use getRawValue to get disabled fields

    const dto: ReleaseQuarantineProductDto = {
      releaseType: this.quarantineType,
      unitId: this.productInfo!.unitId,
      productCode: this.productInfo!.productCode,
      aliquot: this.productInfo!.aliquot || '',
      selectedReasonCodes: Array.from(this.selectedReasonCodes()),
      restock: formValue.restockFlag === 'Y',
      deviceType: formValue.deviceType || null,
      deviceNumber: formValue.deviceNumber || null,
      rackNumber: formValue.rackNumber || null,
      trayNumber: formValue.trayNumber || null,
      rejectCode: formValue.rejectCode || null,
      codeScheme: this.codeScheme || null,
      overrides: overrides,
    };

    this.loading.set(true);
    this.error.set(null);

    this.apiService
      .save(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);

          if (response.status === 'WARNING' && response.warnings.length > 0) {
            const hardErrors = response.warnings.filter(w => HARD_ERROR_CODES.has(w.code));
            const overridableWarnings = response.warnings.filter(w => !HARD_ERROR_CODES.has(w.code));

            if (hardErrors.length > 0) {
              const messages = hardErrors.map(e => e.message).join('; ');
              this.snackbarService.showError(messages);
              return;
            }

            if (overridableWarnings.length > 0) {
              this.showWarningDialog(overridableWarnings);
              return;
            }
          } else {
            // Success - emit released event
            this.snackbarService.showSuccess('Product released successfully.');
            this.released.emit(response);
          }
        },
        error: (err) => {
          this.loading.set(false);
        },
      });
  }

  private showWarningDialog(warnings: Warning[]): void {
    const dialogRef = this.dialog.open(WarningDialogComponent, {
      width: '500px',
      disableClose: true,
      data: { warnings } as WarningDialogData,
    });

    dialogRef.afterClosed().subscribe((result: WarningDialogResult) => {
      if (result === 'override') {
        const newCodes = warnings.map(w => w.code);
        this.accumulatedOverrides = [...new Set([...this.accumulatedOverrides, ...newCodes])];
        this.performSave(this.accumulatedOverrides);
      }
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
