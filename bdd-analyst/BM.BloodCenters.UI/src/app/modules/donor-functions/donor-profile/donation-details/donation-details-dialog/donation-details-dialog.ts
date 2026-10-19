import { Component, ElementRef, Inject, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil, forkJoin } from 'rxjs';

import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DialogHeaderFields } from '@shared/components/dialog-header-fields/dialog-header-fields';
import { DialogButton, DialogHeaderField } from '@shared/interfaces/dialog.interface';
import { UppercaseDatePipe } from '@shared/pipes/uppercase-date.pipe';
import { DonationEntryDetailsDialogComponent } from '@shared/components/donation-entry-details-dialog/donation-entry-details-dialog';
import { DeferralEntryDetailsDialogComponent } from '@shared/components/deferral-entry-details-dialog/deferral-entry-details-dialog';
import { DonationDeferralAuditDrawerComponent } from '../../../registration/audit-donation/components/donation-deferral-audit-drawer/donation-deferral-audit-drawer';
import { DonationNotesDialog } from '@shared/components/donation-notes/donation-notes';
import { DonationDetailsApiService } from '../services/donation-details-api.service';
import { EquipSupplyDialogComponent } from '../equip-supply-dialog/equip-supply-dialog';
import { SponsorDetailsDialogComponent } from '../sponsor-details-dialog/sponsor-details-dialog';
import { ShowAttributesDialogComponent } from '../show-attributes-dialog/show-attributes-dialog';
import { ShowAuxUnitsDialogComponent } from '../show-aux-units-dialog/show-aux-units-dialog';
import { PhysicalFindingsCommentsDialogComponent } from '../physical-findings-comments-dialog/physical-findings-comments-dialog';
import {
  DonationRecord,
  PhysicalFinding,
  DonationHold,
  LabInterdiction,
  DonationDetailsData,
  DonorHeaderInfo,
  EquipSupplyDialogData,
  SponsorDetailsDialogData,
  ShowAttributesDialogData,
  ShowAuxUnitsDialogData,
  PhysicalFindingsCommentsDialogData,
} from '../models/donation-details.model';

@Component({
  selector: 'app-donation-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    SidePanelBase,
    DialogHeaderFields,
    UppercaseDatePipe,
  ],
  templateUrl: './donation-details-dialog.html',
  styleUrls: ['./donation-details-dialog.scss'],
})
export class DonationDetailsDialogComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `donation-details-dialog-${DonationDetailsDialogComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private destroy$ = new Subject<void>();

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly donations = signal<DonationRecord[]>([]);
  readonly selectedDonation = signal<DonationRecord | null>(null);
  readonly totalDonationCredits = signal<number>(0);

  readonly donorInfo = signal<DonorHeaderInfo | null>(null);

  private readonly datePipe = new UppercaseDatePipe();

  readonly headerFields = computed<DialogHeaderField[]>(() => {
    const info = this.donorInfo();
    if (!info) return [];
    return [
      { label: 'Name', value: (info.name ?? '').trim() },
      { label: 'Date of Birth', value: this.datePipe.transform(info.dateOfBirth, 'dd-MMM-yyyy') ?? '' },
      { label: 'Sex', value: info.sex ?? '' },
      { label: 'ABO', value: info.abo ?? '' },
      { label: 'Total Donation Credits', value: String(this.totalDonationCredits()) },
    ];
  });

  readonly physicalFindings = computed<PhysicalFinding[]>(() => {
    return this.selectedDonation()?.physicalFindings ?? [];
  });

  readonly holds = computed<DonationHold[]>(() => {
    return this.selectedDonation()?.donationInterdictions ?? [];
  });

  readonly labInterdictions = computed<LabInterdiction[]>(() => {
    return this.selectedDonation()?.labUnitInterdictions ?? [];
  });

  donationsColumns: string[] = [
    'unitId',
    'collectionDate',
    'donationType',
    'procedureCode',
    'sponsorId',
    'driveId',
    'lastInterface',
    'chapterId',
    'location',
  ];

  physicalFindingsColumns: string[] = [
    'physicalCode',
    'physicalValue',
    'repeat',
    'interdiction',
  ];

  holdsColumns: string[] = [
    'hold',
    'terminationDate',
    'releaseDate',
    'releaseUser',
  ];

  labInterdictionsColumns: string[] = [
    'interdictionCode',
    'insertDateTime',
  ];

  footerButtons: DialogButton[] = [
    { label: 'CLOSE', action: 'close', variant: 'secondary' },
    { label: 'SHOW AUX UNITS', action: 'showAuxUnits', variant: 'secondary' },
    { label: 'SHOW ATTRIBUTES', action: 'showAttributes', variant: 'secondary' },
    { label: 'NOTES', action: 'notes', variant: 'secondary' },
    { label: 'CONSENTS', action: 'consents', variant: 'secondary' },
    { label: 'DON/DEF AUDIT', action: 'donDefAudit', variant: 'secondary' },
    { label: 'DON/DEF ENTRY', action: 'donDefEntry', variant: 'secondary' },
  ];

  private readonly elRef = inject(ElementRef);

  constructor(
    public dialogRef: MatDialogRef<DonationDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DonationDetailsData,
    private readonly service: DonationDetailsApiService,
    private readonly snackBar: MatSnackBar,
    private readonly dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onButtonClick(action: string): void {
    if (action === 'close') {
      this.dialogRef.close();
      return;
    }

    const selected = this.selectedDonation();

    if (action === 'donDefEntry') {
      if (!selected?.unitId && !selected?.deferralId) {
        this.snackBar.open('Please select a donation or deferral first', 'OK', { duration: 3000 });
        return;
      }
      const childPanelConfig = {
        width: '1000px',
        height: 'calc(100vh - 64px)',
        maxWidth: '100vw',
        maxHeight: 'calc(100vh - 64px)',
        disableClose: false,
        panelClass: 'code-dialog-panel-right',
        position: { right: '0' as const, top: '64px' },
        hasBackdrop: true,
        backdropClass: 'code-dialog-backdrop',
      };
      if (selected.unitId) {
        this.openChildDialog(DonationEntryDetailsDialogComponent, {
          ...childPanelConfig,
          data: { unitId: selected.unitId, collDate: selected.collDate },
        });
      } else {
        this.openChildDialog(DeferralEntryDetailsDialogComponent, {
          ...childPanelConfig,
          width: '1200px',
          data: { donorId: this.data.donorId, driveDate: selected.collDate?.split('T')[0] },
        });
      }
      return;
    }

    if (action === 'donDefAudit') {
      if (!selected?.transactionId) {
        this.snackBar.open('Please select a donation first', 'OK', { duration: 3000 });
        return;
      }
      this.openChildDialog(DonationDeferralAuditDrawerComponent, {
        width: '1000px',
        height: 'calc(100vh - 64px)',
        maxWidth: '100vw',
        maxHeight: 'calc(100vh - 64px)',
        data: { transactionId: selected.transactionId },
        disableClose: false,
        panelClass: 'code-dialog-panel-right',
        position: { right: '0', top: '64px' },
        hasBackdrop: true,
        backdropClass: 'code-dialog-backdrop',
      });
      return;
    }

    if (action === 'notes') {
      if (!selected?.transactionId) {
        this.snackBar.open('Please select a donation first', 'OK', { duration: 3000 });
        return;
      }
      if (!selected.collDate) {
        this.snackBar.open('Collection Date is required to view notes', 'OK', { duration: 3000 });
        return;
      }
      this.openChildDialog(DonationNotesDialog, {
        width: '900px',
        height: 'calc(100vh - 64px)',
        maxWidth: '100vw',
        maxHeight: 'calc(100vh - 64px)',
        data: {
          unitId: selected.unitId ?? undefined,
          deferralId: selected.deferralId ?? undefined,
          transactionId: selected.transactionId,
          chapterId: selected.chapterId,
          collectionDate: selected.collDate,
        },
        disableClose: false,
        panelClass: 'code-dialog-panel-right',
        position: { right: '0', top: '64px' },
        hasBackdrop: true,
        backdropClass: 'code-dialog-backdrop',
      });
      return;
    }

    if (action === 'showAuxUnits') {
      this.openShowAuxUnitsDialog();
      return;
    }

    if (action === 'showAttributes') {
      if (!selected?.transactionId) {
        this.snackBar.open('Please select a donation first', 'OK', { duration: 3000 });
        return;
      }
      this.openShowAttributesDialog(selected);
      return;
    }

    if (action === 'equipSupply') {
      if (!selected?.transactionId) {
        this.snackBar.open('Please select a donation first', 'OK', { duration: 3000 });
        return;
      }
      this.openEquipSupplyDialog(selected);
      return;
    }

    if (action === 'viewComments') {
      if (!selected?.transactionId) {
        this.snackBar.open('Please select a donation first', 'OK', { duration: 3000 });
        return;
      }
      this.openPhysicalFindingsCommentsDialog(selected);
      return;
    }

    if (action === 'consents') {
      if (!this.data.donorId) return;
      const selected = this.selectedDonation();
      this.dialogRef.close({
        action: 'consents',
        donorId: this.data.donorId,
        sourceLabel: this.data.sourceLabel,
        sourcePath: this.data.sourcePath,
        unitId: selected?.unitId || null,
        collectionDate: selected?.collDate || null,
      });
      return;
    }

    this.snackBar.open('Not yet implemented', 'OK', { duration: 3000 });
  }

  openSponsorDetailsDialog(donation: DonationRecord): void {
    this.service.getAccess().pipe(takeUntil(this.destroy$)).subscribe({
      next: (accessResponse) => {
        this.openChildDialog(SponsorDetailsDialogComponent, {
          width: '900px',
          height: 'calc(100vh - 64px)',
          maxWidth: '100vw',
          maxHeight: 'calc(100vh - 64px)',
          data: {
            unitId: donation.unitId,
            collDate: donation.collDate,
            driveId: donation.driveId,
            creditSponsor: donation.creditSponsor,
            creditSponsorName: donation.creditSponsorName,
            canEditSponsor: accessResponse?.item?.canEditSponsor ?? false,
          } as SponsorDetailsDialogData,
          disableClose: false,
          panelClass: 'code-dialog-panel-right',
          position: { right: '0', top: '64px' },
          hasBackdrop: true,
          backdropClass: 'code-dialog-backdrop',
        }, () => this.loadData());
      },
    });
  }

  private openPhysicalFindingsCommentsDialog(donation: DonationRecord): void {
    this.openChildDialog(PhysicalFindingsCommentsDialogComponent, {
      width: '900px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: {
        transactionId: donation.transactionId,
        chapterId: donation.chapterId,
        unitId: donation.unitId,
        collDate: donation.collDate,
        physicalFindings: donation.physicalFindings ?? [],
      } as PhysicalFindingsCommentsDialogData,
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
    });
  }

  private openEquipSupplyDialog(donation: DonationRecord): void {
    this.openChildDialog(EquipSupplyDialogComponent, {
      width: '1000px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: {
        transactionId: donation.transactionId,
        chapterId: donation.chapterId,
      } as EquipSupplyDialogData,
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
    });
  }

  private openShowAttributesDialog(donation: DonationRecord): void {
    this.openChildDialog(ShowAttributesDialogComponent, {
      width: '1000px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: {
        transactionId: donation.transactionId,
        unitId: donation.unitId,
        donorInfo: this.donorInfo(),
        totalDonationCredits: this.totalDonationCredits(),
      } as ShowAttributesDialogData,
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
    });
  }

  private openShowAuxUnitsDialog(): void {
    this.openChildDialog(ShowAuxUnitsDialogComponent, {
      width: '900px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: {
        donorId: this.data.donorId,
        donorInfo: this.donorInfo(),
        totalDonationCredits: this.totalDonationCredits(),
      } as ShowAuxUnitsDialogData,
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
    });
  }

  onDonationRowClick(row: DonationRecord): void {
    this.selectedDonation.set(row);
  }

  isSelectedRow(row: DonationRecord): boolean {
    return this.selectedDonation()?.transactionId === row.transactionId;
  }

  getDisplayUnitId(row: DonationRecord): string {
    return row.displayUnitId ?? '';
  }

  private toggleDialogVisibility(visible: boolean): void {
    const overlayPane = this.elRef.nativeElement.closest('.cdk-overlay-pane');
    const wrapper = overlayPane?.closest('.cdk-global-overlay-wrapper');
    const backdrop = wrapper?.previousElementSibling;

    const display = visible ? '' : 'none';
    if (wrapper) wrapper.style.display = display;
    if (backdrop?.classList.contains('cdk-overlay-backdrop')) {
      backdrop.style.display = display;
    }
  }

  private openChildDialog(component: any, config: any, onSaved?: () => void): void {
    this.toggleDialogVisibility(false);

    this.dialog.open(component, config)
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result === 'closeAll') {
          this.dialogRef.close();
        } else {
          this.toggleDialogVisibility(true);
          if (result === 'saved' && onSaved) {
            onSaved();
          }
        }
      });
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      donorHeader: this.service.getDonorHeader(this.data.donorId),
      donations: this.service.getDonationDetails(this.data.donorId, 100, 0, {}),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ donorHeader, donations }) => {
          if (donorHeader?.success && donorHeader.data?.length) {
            this.donorInfo.set(donorHeader.data[0]);
          }

          if (donations?.success && donations.data) {
            this.donations.set(donations.data);
            this.totalDonationCredits.set(donations.total ?? 0);

            if (donations.data.length > 0) {
              this.selectedDonation.set(donations.data[0]);
            }
          }

          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load donation details. Please try again.');
          this.loading.set(false);
        },
      });
  }
}
