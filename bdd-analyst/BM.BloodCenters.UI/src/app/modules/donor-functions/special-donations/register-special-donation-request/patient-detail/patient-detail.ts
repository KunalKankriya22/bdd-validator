import { Component, OnInit, OnDestroy, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { RegisterSpecialDonationRequestService } from '../register-special-donation-request.service';
import { SpecialPatientDetail, SpecialSurgeryDetail, SpecialDonorItem } from '../register-special-donation-request.models';
import { EditPatientDialogComponent } from '../edit-patient-dialog/edit-patient-dialog';
import { SurgeryDialogComponent, SurgeryDialogData } from '../surgery-dialog/surgery-dialog';
import { AddDonorsDialogComponent, AddDonorsDialogData } from '../add-donors-dialog/add-donors-dialog';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderWithBreadcrumb,
    DataTable,
  ],
  templateUrl: './patient-detail.html',
  styleUrls: ['./patient-detail.scss'],
})
export class PatientDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(RegisterSpecialDonationRequestService);
  private dialog = inject(MatDialog);

  patId = '';
  patient = signal<SpecialPatientDetail | null>(null);
  isLoading = signal(true);
  donorTableConfigs: DataTableConfig<SpecialDonorItem>[] = [];
  sortedDonors: SpecialDonorItem[][] = [];
  selectedSurgeryIndex = 0;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Register Special Donation Request', link: '/donor-functions/special-donations/register-special-donation-request' },
    ],
    title: '',
    subtitle: '',
    actions: [],
    showBackButton: true,
    onBackClick: () => this.goBack(),
  };

  ngOnInit(): void {
    this.patId = this.route.snapshot.params['patId'];
    this.headerConfig = {
      ...this.headerConfig,
      breadcrumbs: [
        ...this.headerConfig.breadcrumbs,
        { label: this.patId, link: null },
      ],
      title: this.patId,
    };
    const savedState = (history.state as any)?.restoreState;
    if (savedState) {
      const savedIndex = savedState.selectedSurgeryIndex ?? 0;
      history.replaceState({}, '');
      this.loadDetail(() => {
        this.selectedSurgeryIndex = savedIndex;
      });
    } else {
      this.loadDetail();
    }
    this.checkReturnAction();
  }

  private checkReturnAction(): void {
    const state = (history.state as any);
    if (state?.returnAction === 'reopen-surgery-dialog' && state?.surgeryDialogData) {
      const dialogData: SurgeryDialogData = {
        mode: state.surgeryDialogData.mode,
        patId: state.surgeryDialogData.patId,
        surgery: state.surgeryDialogData.formValues
          ? ({ ...state.surgeryDialogData.formValues, surgId: state.surgeryDialogData.surgId } as any)
          : undefined,
        newPhysicianId: state.surgeryDialogData.newPhysicianId,
      };
      // Clear the state so re-navigating doesn't re-trigger
      history.replaceState({}, '');
      // Open surgery dialog only after patient detail has fully loaded
      this.loadDetail(() => {
        const ref = this.dialog.open(SurgeryDialogComponent, {
          width: '55vw',
          minWidth: '700px',
          height: 'calc(100vh - 64px)',
          maxWidth: '100vw',
          maxHeight: 'calc(100vh - 64px)',
          disableClose: false,
          panelClass: 'code-dialog-panel-right',
          position: { right: '0', top: '64px' },
          hasBackdrop: true,
          backdropClass: 'code-dialog-backdrop',
          data: dialogData
        });
        ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((r) => { if (r) this.loadDetail(); });
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDetail(onComplete?: () => void): void {
    this.isLoading.set(true);
    this.service
      .getPatientDetail(this.patId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const detail = res?.item || res?.data?.[0] || null;
          this.patient.set(detail);
          this.buildDonorTableConfigs(detail);
          this.isLoading.set(false);
          onComplete?.();
        },
        error: () => this.isLoading.set(false),
      });
  }

  goBack(): void {
    this.router.navigate(['/donor-functions/special-donations/register-special-donation-request']);
  }

  editPatient(): void {
    const ref = this.dialog.open(EditPatientDialogComponent, {
      width: '55vw',
      minWidth: '700px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: { patId: this.patId },
    });
    ref.afterClosed().subscribe((r) => { if (r) this.loadDetail(); });
  }

  editSurgery(surgery: SpecialSurgeryDetail): void {
    const data: SurgeryDialogData = { mode: 'edit', patId: this.patId, surgery };
    const ref = this.dialog.open(SurgeryDialogComponent, {
      width: '55vw',
      minWidth: '700px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data,
    });
    ref.afterClosed().subscribe((r) => { if (r) this.loadDetail(); });
  }

  addSurgery(): void {
    const data: SurgeryDialogData = { mode: 'add', patId: this.patId };
    const ref = this.dialog.open(SurgeryDialogComponent, {
      width: '55vw',
      minWidth: '700px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data,
    });
    ref.afterClosed().subscribe((r) => { if (r) this.loadDetail(); });
  }

  addDonors(surgery: SpecialSurgeryDetail): void {
    const data: AddDonorsDialogData = { surgId: surgery.surgId, existingDonors: surgery.donors || [], patient: this.patient() };
    const ref = this.dialog.open(AddDonorsDialogComponent, {
      width: '55vw',
      minWidth: '700px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data,
    });
    ref.afterClosed().subscribe((r) => { if (r) this.loadDetail(); });
  }

  viewPatientDocument(): void {
    this.saveStateAndNavigateToDocLibrary(this.patId);
  }

  uploadPatientDocument(): void {
    this.saveStateAndNavigateToDocLibrary(this.patId);
  }

  viewSurgeryDocument(surgery: SpecialSurgeryDetail): void {
    this.saveStateAndNavigateToDocLibrary(surgery.surgId);
  }

  uploadSurgeryDocument(surgery: SpecialSurgeryDetail): void {
    this.saveStateAndNavigateToDocLibrary(surgery.surgId);
  }

  private saveStateAndNavigateToDocLibrary(linkedValue: string): void {
    history.replaceState({
      restoreState: {
        selectedSurgeryIndex: this.selectedSurgeryIndex,
      },
    }, '');
    this.router.navigate(['/system-administration/user-admin/lab-dist-user-admin/user-utilities/document-library'], {
      queryParams: { linkedValue },
    });
  }

  private buildDonorTableConfigs(detail: SpecialPatientDetail | null): void {
    if (!detail?.surgeries) {
      this.donorTableConfigs = [];
      this.sortedDonors = [];
      return;
    }
    this.donorTableConfigs = detail.surgeries.map(() => this.createDonorTableConfig());
    this.sortedDonors = detail.surgeries.map((s, i) =>
      this.sortDonors(s.donors || [], this.donorTableConfigs[i].sortConfig!)
    );
  }

  private createDonorTableConfig(): DataTableConfig<SpecialDonorItem> {
    return {
      columns: [
        { key: 'lastName', header: 'Last Name', sortable: true },
        { key: 'firstName', header: 'First Name' },
        { key: 'contactPhoneNo', header: 'Phone' },
        { key: 'intlContactPhoneNo', header: 'International Phone' },
        { key: 'prodType1', header: 'Product Type 1' },
        { key: 'prodType2', header: 'Product Type 2' },
        { key: 'prodType3', header: 'Product Type 3' },
      ],
      sortConfig: { column: 'lastName', direction: 'A' },
      showPagination: false,
      noDataIcon: 'search',
      emptyMessage: 'No donors linked to this surgery.',
      enableRowHighlight: false,
    };
  }

  onDonorSortChange(event: TableSortEvent, index: number): void {
    this.donorTableConfigs[index] = {
      ...this.donorTableConfigs[index],
      sortConfig: { column: event.column, direction: event.direction },
    };
    const surgery = this.patient()?.surgeries?.[index];
    if (surgery) {
      this.sortedDonors[index] = this.sortDonors(surgery.donors || [], event);
    }
  }

  private sortDonors(donors: SpecialDonorItem[], sort: { column: string; direction: string }): SpecialDonorItem[] {
    if (!donors.length || sort.direction === 'default') return [...donors];
    return [...donors].sort((a, b) => {
      const valA = ((a as any)[sort.column] || '').toLowerCase();
      const valB = ((b as any)[sort.column] || '').toLowerCase();
      const cmp = valA.localeCompare(valB);
      return sort.direction === 'A' ? cmp : -cmp;
    });
  }

  get selectedSurgery(): SpecialSurgeryDetail | null {
    return this.patient()?.surgeries?.[this.selectedSurgeryIndex] ?? null;
  }

  get surgeryCount(): number {
    return this.patient()?.surgeries?.length ?? 0;
  }

  prevSurgery(): void {
    if (this.selectedSurgeryIndex > 0) this.selectedSurgeryIndex--;
  }

  nextSurgery(): void {
    if (this.selectedSurgeryIndex < this.surgeryCount - 1) this.selectedSurgeryIndex++;
  }

  getPatientFullName(): string {
    const p = this.patient();
    if (!p) return '';
    return `${p.patFirstName || ''} ${p.patLastName || ''}`.trim();
  }

  getSexLabel(sex?: string): string {
    return sex === 'M' ? 'Male' : sex === 'F' ? 'Female' : sex || '';
  }

  getStatusLabel(status?: string): string {
    return status === 'A' ? 'Active' : status === 'I' ? 'Inactive' : status || '';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
  }

  getPatientPhone(): string {
    const p = this.patient();
    if (!p) return '-';
    if (p.contactAreaCode && p.contactPhoneNo) return `${p.contactAreaCode} ${p.contactPhoneNo}`;
    return p.contactPhoneNo || '-';
  }
}
