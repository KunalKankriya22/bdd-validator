import { Component, OnInit, OnDestroy, Inject, inject, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin, of, catchError, Subject, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { RegisterSpecialDonationRequestService } from '../register-special-donation-request.service';
import { LookupItem, SpecialDonorItem, AddSpecialDonorRequest, SpecialPatientDetail } from '../register-special-donation-request.models';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';

export interface AddDonorsDialogData {
  surgId: string;
  existingDonors: SpecialDonorItem[];
  patient?: SpecialPatientDetail | null;
}

@Component({
  selector: 'app-add-donors-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule,
    MatSnackBarModule, NgxMatSelectSearchModule, DataTable,
  ],
  templateUrl: './add-donors-dialog.html',
  styleUrls: ['../add-request-dialog/add-request-dialog.scss', './add-donors-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddDonorsDialogComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private service = inject(RegisterSpecialDonationRequestService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  form!: FormGroup;
  surgId: string;
  productTypes = signal<LookupItem[]>([]);

  readonly prodType1SearchControl = new FormControl('');
  readonly prodType2SearchControl = new FormControl('');
  readonly prodType3SearchControl = new FormControl('');
  private readonly prodType1Search = signal('');
  private readonly prodType2Search = signal('');
  private readonly prodType3Search = signal('');

  private filterProdTypes(search: string): LookupItem[] {
    const items = this.productTypes();
    if (!search) return items;
    return items.filter(p => (p.code || '').toLowerCase().includes(search) || (p.description || '').toLowerCase().includes(search));
  }

  readonly filteredProdTypes1 = computed(() => this.filterProdTypes(this.prodType1Search().toLowerCase()));
  readonly filteredProdTypes2 = computed(() => this.filterProdTypes(this.prodType2Search().toLowerCase()));
  readonly filteredProdTypes3 = computed(() => this.filterProdTypes(this.prodType3Search().toLowerCase()));
  pendingDonors = signal<AddSpecialDonorRequest[]>([]);
  isSaving = signal(false);
  sortConfig = signal<{ column: string; direction: string }>({ column: 'lastName', direction: 'A' });

  sortedPendingDonors = computed(() => {
    const donors = this.pendingDonors();
    const sort = this.sortConfig();
    if (!donors.length || sort.direction === 'default') return donors;
    return [...donors].sort((a, b) => {
      const valA = ((a as any)[sort.column] || '').toLowerCase();
      const valB = ((b as any)[sort.column] || '').toLowerCase();
      const cmp = valA.localeCompare(valB);
      return sort.direction === 'A' ? cmp : -cmp;
    });
  });

  donorTableConfig: DataTableConfig<AddSpecialDonorRequest> = {
    columns: [
      { key: 'lastName', header: 'Last Name', sortable: true },
      { key: 'firstName', header: 'First Name' },
      { key: 'contactPhoneNo', header: 'Phone' },
      { key: 'intlContactPhoneNo', header: 'International Phone' },
      { key: 'prodType1', header: 'Product Type 1' },
      { key: 'prodType2', header: 'Product Type 2' },
      { key: 'prodType3', header: 'Product Type 3' },
    ],
    rowActions: [
      { icon: 'delete', action: 'delete', ariaLabel: 'Remove donor' },
    ],
    sortConfig: { column: 'lastName', direction: 'A' },
    showPagination: false,
    enableRowHighlight: false,
  };

  constructor(
    private dialogRef: MatDialogRef<AddDonorsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddDonorsDialogData,
  ) {
    this.surgId = data.surgId;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      lastName: ['', [Validators.required, Validators.maxLength(30)]],
      firstName: ['', [Validators.required, Validators.maxLength(25)]],
      contactPhoneNo: ['', [Validators.maxLength(10), Validators.pattern(/^\d*$/)]],
      intlContactPhoneNo: ['', [Validators.maxLength(20), Validators.pattern(/^\d*$/)]],
      prodType1: [''],
      prodType2: [''],
      prodType3: [''],
    });

    // FMB WNBI: auto-populate FIRST donor row only when AU and no existing donors
    if (this.data?.patient?.patType === 'AU' && (!this.data.existingDonors || this.data.existingDonors.length === 0)) {
      this.form.patchValue({
        lastName: this.data.patient.patLastName,
        firstName: this.data.patient.patFirstName,
        contactPhoneNo: ((this.data.patient.contactAreaCode || '') + (this.data.patient.contactPhoneNo || '')) || null,
      });
    }

    // FIX-21: Auto-uppercase for name fields
    this.form.get('lastName')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => {
      if (v !== v?.toUpperCase()) {
        this.form.get('lastName')?.setValue(v?.toUpperCase(), { emitEvent: false });
      }
    });
    this.form.get('firstName')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => {
      if (v !== v?.toUpperCase()) {
        this.form.get('firstName')?.setValue(v?.toUpperCase(), { emitEvent: false });
      }
    });

    // FIX-11: International phone clears domestic phone
    this.form.get('intlContactPhoneNo')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => {
      if (v) {
        this.form.patchValue({ contactPhoneNo: null }, { emitEvent: false });
      }
    });

    this.prodType1SearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.prodType1Search.set(v || ''));
    this.prodType2SearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.prodType2Search.set(v || ''));
    this.prodType3SearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.prodType3Search.set(v || ''));

    this.service.getProductTypes().pipe(takeUntil(this.destroy$)).subscribe((r) => {
      this.productTypes.set(r?.data || []);
      this.cdr.markForCheck();
    });
  }

  onDropdownClosed(control: FormControl): void {
    control.setValue('');
  }

  addDonor(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.value;
    const donor: AddSpecialDonorRequest = {
      surgId: this.surgId,
      lastName: v.lastName,
      firstName: v.firstName,
      phone: v.contactPhoneNo || undefined,
      intlContactPhoneNo: v.intlContactPhoneNo || undefined,
      prodType1: v.prodType1 || undefined,
      prodType2: v.prodType2 || undefined,
      prodType3: v.prodType3 || undefined,
    };

    this.pendingDonors.update(list => [...list, donor]);
    this.form.reset();
  }

  onDonorSortChange(event: TableSortEvent): void {
    this.donorTableConfig = {
      ...this.donorTableConfig,
      sortConfig: { column: event.column, direction: event.direction },
    };
    this.sortConfig.set({ column: event.column, direction: event.direction });
  }

  onDonorRowAction(event: TableRowActionEvent<AddSpecialDonorRequest>): void {
    if (event.action === 'delete') {
      this.pendingDonors.update(list => list.filter(d => d !== event.row));
    }
  }

  onSave(): void {
    const donors = this.pendingDonors();
    if (donors.length === 0) {
      this.showSnackbar('Add at least one donor before saving');
      return;
    }

    this.isSaving.set(true);

    forkJoin(
      donors.map(donor =>
        this.service.addDonor(donor).pipe(catchError(() => of({ __error: true })))
      )
    ).subscribe(results => {
      const failed = results.filter(r => (r as any).__error).length;
      const saved = results.length - failed;
      this.isSaving.set(false);
      this.showSnackbar(failed ? `${saved} saved, ${failed} failed` : `${saved} donor(s) added successfully`);
      if (saved > 0) this.dialogRef.close(true);
      this.cdr.markForCheck();
    });
  }

  onCancel(): void { this.dialogRef.close(false); }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }
}
