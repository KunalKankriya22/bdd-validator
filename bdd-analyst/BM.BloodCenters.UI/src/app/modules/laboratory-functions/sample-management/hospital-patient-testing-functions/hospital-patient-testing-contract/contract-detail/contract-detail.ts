import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
  TemplateRef,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, forkJoin } from 'rxjs';

import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';
import { SnackbarService } from '@shared/services/snackbar.service';

import { HospitalPatientTestingContractService } from '../services/hospital-patient-testing-contract.service';
import {
  TestingContractDetail,
  ContractContact,
  DropdownOption
} from '../models/hospital-patient-testing-contract.model';
import { EditContractDetailDialogComponent } from '../edit-contract-detail-dialog/edit-contract-detail-dialog';
import { AddEditContactDialogComponent } from '../add-edit-contact-dialog/add-edit-contact-dialog';

@Component({
  selector: 'app-contract-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    DataTable,
    EditContractDetailDialogComponent,
    AddEditContactDialogComponent
  ],
  templateUrl: './contract-detail.html',
  styleUrls: ['./contract-detail.scss']
})
export class ContractDetailComponent implements OnInit, OnDestroy {
  @ViewChild('expandTemplate', { static: false }) expandTemplate!: TemplateRef<any>;

  @Input() contractId = '';
  @Output() back = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  private readonly service = inject(HospitalPatientTestingContractService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  readonly contractDetail = signal<TestingContractDetail | null>(null);
  readonly contacts = signal<ContractContact[]>([]);
  readonly isLoading = signal<boolean>(false);

  readonly hasContractDetail = computed(() => !!this.contractDetail());

  // Side panel state
  readonly isEditContractPanelOpen = signal(false);
  readonly isContactPanelOpen = signal(false);
  readonly contactPanelMode = signal<'add' | 'edit'>('add');
  readonly selectedContact = signal<ContractContact | null>(null);

  expandedRows = new Set<string>();
  expandRowKey = 'contactType';

  contactTypes: DropdownOption[] = [];

  private static readonly DISPLAY_MAPS: Record<string, Record<string, string>> = {
    unitScheme: { 'N': 'N - Codabar numeric', 'I': 'I - ISBT 128', 'V': 'V - Codabar alpha-numeric' },
    ediInput: { 'Y': 'Y - Yes' },
    resultsInd: { 'R': 'R - Reports', 'E': 'E - Electronic Mail', 'B': 'B - Both' },
    confirmTest: { 'Y': 'Y - Yes' }
  };

  displayValue(field: string, code: string | undefined | null): string {
    if (!code || code === '-') return '-';
    const map = ContractDetailComponent.DISPLAY_MAPS[field];
    return map?.[code] || code;
  }

  contactTableConfig: DataTableConfig<ContractContact> = {
    columns: this.getContactColumns(),
    rowActions: this.getContactRowActions(),
    stickyHeader: true,
    showPagination: false,
    emptyMessage: 'No contacts available',
    emptySubMessage: 'Click "ADD NEW CONTACT" to add a contact.'
  };

  ngOnInit(): void {
    this.loadContractData();
    this.loadContactTypes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadContractData(): void {
    if (!this.contractId) return;

    this.isLoading.set(true);

    forkJoin({
      detail: this.service.getContractDetail(this.contractId),
      contacts: this.service.getContractContacts(this.contractId)
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.contractDetail.set(result.detail);
          this.contacts.set(result.contacts);
          this.isLoading.set(false);
          this.cdr.detectChanges();
        },
        error: () => {
          this.snackbarService.showError('Failed to load contract details');
          this.isLoading.set(false);
          this.cdr.detectChanges();
        }
      });
  }

  private loadContacts(): void {
    if (!this.contractId) return;

    this.service.getContractContacts(this.contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contacts) => {
          this.contacts.set(contacts);
          this.cdr.detectChanges();
        },
        error: () => {
          this.snackbarService.showError('Failed to load contacts');
        }
      });
  }

  private loadContactTypes(): void {
    this.service.getContactTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => { this.contactTypes = types; },
        error: () => { this.contactTypes = []; }
      });
  }

  private getContactColumns(): TableColumn<ContractContact>[] {
    return [
      { key: 'contactTypeDesc', header: 'Type of Contact', width: '180px' },
      { key: 'lastName', header: 'Last Name', width: '160px' },
      { key: 'firstName', header: 'First Name', width: '160px' },
      { key: 'title', header: 'Title', width: '150px' }
    ];
  }

  private getContactRowActions(): RowAction<ContractContact>[] {
    return [
      { icon: 'edit', label: 'Edit contact', ariaLabel: 'Edit contact', action: 'edit' }
    ];
  }

  onRowAction(event: TableRowActionEvent<ContractContact>): void {
    if (event.action === 'edit') {
      this.openEditContactPanel(event.row);
    }
  }

  onRowExpandToggle(row: ContractContact): void {
    const key = row.contactType;
    if (!key) return;
    if (this.expandedRows.has(key)) {
      this.expandedRows.delete(key);
    } else {
      this.expandedRows.add(key);
    }
    this.cdr.detectChanges();
  }

  onExpandAllToggle(expanded: boolean): void {
    if (expanded) {
      this.contacts().forEach(contact => {
        const key = contact.contactType;
        if (key) this.expandedRows.add(key);
      });
    } else {
      this.expandedRows.clear();
    }
    this.cdr.detectChanges();
  }

  // ============================================================================
  // SIDE PANEL ACTIONS
  // ============================================================================

  openEditContractPanel(): void {
    if (!this.contractDetail()) return;
    this.isEditContractPanelOpen.set(true);
  }

  onEditContractSaved(): void {
    this.isEditContractPanelOpen.set(false);
    this.snackbarService.showSuccess('Contract detail updated successfully');
    this.loadContractData();
    this.updated.emit();
  }

  onEditContractCancelled(): void {
    this.isEditContractPanelOpen.set(false);
  }

  openAddContactPanel(): void {
    this.contactPanelMode.set('add');
    this.selectedContact.set(null);
    this.isContactPanelOpen.set(true);
  }

  openEditContactPanel(contact: ContractContact): void {
    this.contactPanelMode.set('edit');
    this.selectedContact.set(contact);
    this.isContactPanelOpen.set(true);
  }

  onContactSaved(): void {
    this.isContactPanelOpen.set(false);
    this.snackbarService.showSuccess(
      this.contactPanelMode() === 'add' ? 'Contact created successfully' : 'Contact updated successfully'
    );
    this.loadContacts();
  }

  onContactCancelled(): void {
    this.isContactPanelOpen.set(false);
  }

  onBack(): void {
    this.back.emit();
  }
}
