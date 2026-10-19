import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { SpecialDriveService } from '../services/special-drive.service';

export interface CancelDriveData {
  driveId: string;
}

export interface CancelCodeOption {
  value: string;
  label: string;
  description: string;
}

@Component({
  selector: 'app-cancel-drive-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './cancel-drive-dialog.html',
  styleUrls: ['./cancel-drive-dialog.scss']
})
export class CancelDriveDialogComponent implements OnInit, OnDestroy {
  cancelForm: FormGroup;
  cancelCodeOptions: CancelCodeOption[] = [];
  cancelCodeSearchCtrl: FormControl = new FormControl('');
  private _filteredCancelCodes: CancelCodeOption[] = [];
  selectedDescription = '-';
  isLoadingCancelCodes = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private specialDriveService: SpecialDriveService,
    public dialogRef: MatDialogRef<CancelDriveDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CancelDriveData
  ) {
    this.cancelForm = this.fb.group({
      cancelCode: ['', Validators.required],
      comments: ['']
    });

    this.cancelForm.get('cancelCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const selected = this.cancelCodeOptions.find(opt => opt.value === value);
        this.selectedDescription = selected ? selected.description : '-';
      });
  }

  ngOnInit(): void {
    this.loadCancelCodes();
    this.setupSearchFilter();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchFilter(): void {
    this.cancelCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterCancelCodes();
      });
  }

  private filterCancelCodes(): void {
    const search = this.cancelCodeSearchCtrl.value?.toLowerCase() || '';
    if (!search) {
      this._filteredCancelCodes = this.cancelCodeOptions.slice();
    } else {
      this._filteredCancelCodes = this.cancelCodeOptions.filter(option =>
        option.label.toLowerCase().includes(search) ||
        option.description.toLowerCase().includes(search)
      );
    }
  }

  filteredCancelCodeOptions(): CancelCodeOption[] {
    return this._filteredCancelCodes;
  }

  private loadCancelCodes(): void {
    this.isLoadingCancelCodes = true;
    this.specialDriveService.getCancelCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cancelCodes) => {
          this.cancelCodeOptions = cancelCodes.map(cc => ({
            value: cc.code,
            label: cc.code,
            description: cc.description
          }));
          this._filteredCancelCodes = this.cancelCodeOptions.slice();
          this.isLoadingCancelCodes = false;
        },
        error: (error) => {
          console.error('Failed to load cancel codes:', error);
          this.cancelCodeOptions = [];
          this._filteredCancelCodes = [];
          this.isLoadingCancelCodes = false;
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.cancelForm.valid) {
      this.dialogRef.close(this.cancelForm.value);
    }
  }
}
