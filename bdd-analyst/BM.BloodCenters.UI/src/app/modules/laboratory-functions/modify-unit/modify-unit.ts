import { Component, OnInit, OnDestroy, ViewChild, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Subject, takeUntil, forkJoin, firstValueFrom } from 'rxjs';
import moment, { Moment } from 'moment';
import { MatDialog } from '@angular/material/dialog';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { UnitIdFieldComponent, UnitValidationResponse, UnitIdPostValidateEvent } from '@shared/components/unit-id-field';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { Time24hrDirective } from '@shared/directives/time-24hr.directive';

import { MatDialogModule } from '@angular/material/dialog';
import { ModifyUnitWarningDialogComponent, WarningDialogData, WarningDialogResult } from './dialogs/warning-dialog';
import { ModifyUnitApiService } from './services/modify-unit-api.service';
import {
  ModifyUnitDetails, ModifyUnitCollectionDate, ModifyUnitAttributeRow,
  ModifyUnitEquipmentRow, ModifyUnitUpdateRequest, ModifyUnitAttributeRequest,
  ModifyUnitEquipmentRequest, DriveOption, GroupSiteOption, AboOption,
  CatalogOption, LotOption, BatchOption, AttrGroupOption, AttrCodeOption,
  EquipTypeOption, SerialNumberOption, DdCodeOption, YES_NO_OPTIONS,
} from './models/modify-unit.model';

interface EditableAttributeRow extends ModifyUnitAttributeRow {
  isNew?: boolean;
  codesForRow?: AttrCodeOption[];
}

interface EditableEquipmentRow extends ModifyUnitEquipmentRow {
  equipTypesForRow?: EquipTypeOption[];
  serialNumbersForRow?: SerialNumberOption[];
}

@Component({
  selector: 'app-modify-unit',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    MatFormFieldModule, MatSelectModule, MatInputModule,
    MatButtonModule, MatIconModule, MatDatepickerModule, MatDialogModule,
    PageHeaderWithBreadcrumb, UnitIdFieldComponent, Time24hrDirective,
  ],
  templateUrl: './modify-unit.html',
  styleUrl: './modify-unit.scss',
  providers: [
    ModifyUnitApiService,
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
})
export class ModifyUnitComponent implements OnInit, OnDestroy {
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private readonly apiService = inject(ModifyUnitApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  // State signals
  readonly unitDetails = signal<ModifyUnitDetails | null>(null);
  readonly collectionDates = signal<ModifyUnitCollectionDate[]>([]);
  readonly isRetrieved = signal(false);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);

  // LOV signals
  readonly drives = signal<DriveOption[]>([]);
  readonly groupSites = signal<GroupSiteOption[]>([]);
  readonly aboValues = signal<AboOption[]>([]);
  readonly catalogs = signal<CatalogOption[]>([]);
  readonly lots = signal<LotOption[]>([]);
  readonly batches = signal<BatchOption[]>([]);
  readonly attributeGroups = signal<AttrGroupOption[]>([]);
  readonly donorDecisionCodes = signal<DdCodeOption[]>([]);

  // Attribute + equipment editable state
  readonly attributeRows = signal<EditableAttributeRow[]>([]);
  readonly visibleEquipment = signal<EditableEquipmentRow[]>([]);
  private deletedAttributes: ModifyUnitAttributeRow[] = [];

  // Unit context (signals for computed tracking)
  private currentCodeScheme: string | null = null;
  readonly currentParsedUnitId = signal<string | null>(null);
  private currentCollDate: string | null = null;

  // Contract info (populated after unit validation, before retrieve)
  readonly contractId = signal<string | null>(null);
  readonly contractName = signal<string | null>(null);

  readonly yesNoOptions = YES_NO_OPTIONS;

  // Forms
  readonly collDateControl = new FormControl<string>('');

  // FMB VALIDATE_RECORD: driveId, bleedStartDate+Time, bleedEndDate+Time,
  // donorDecisionCode are mandatory (show_error('0010') if null)
  readonly editForm = new FormGroup({
    driveId: new FormControl<string>('', Validators.required),
    groupSiteId: new FormControl<string>(''),
    bleedStartDate: new FormControl<Moment | null>(null, Validators.required),
    bleedStartTime: new FormControl<string>('', Validators.required),
    bleedEndDate: new FormControl<Moment | null>(null, Validators.required),
    bleedEndTime: new FormControl<string>('', Validators.required),
    qcCheckinDate: new FormControl<string>({ value: '', disabled: true }),
    qcCheckinTime: new FormControl<string>({ value: '', disabled: true }),
    qcCheckinFlag: new FormControl<string>(''),
    donorFormAbo: new FormControl<string>(''),
    donorDecisionCode: new FormControl<string>('', Validators.required),
    catalogNumber: new FormControl<string>(''),
    lotNumber: new FormControl<string>(''),
    batchId: new FormControl<string>(''),
    redTubeFlag: new FormControl<string>(''),
    redTube2: new FormControl<string>(''),
    purpleTubeFlag: new FormControl<string>(''),
    serumPlasmaInd: new FormControl<string>(''),
  });

  // Page header
  pageHeaderConfig: PageHeaderConfig = {
    title: '',
    subtitle: '',
    breadcrumbs: [{ label: 'Home', link: '/home' }],
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          ...this.pageHeaderConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  ngOnInit(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onClearAll());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Unit ID Field Events ──

  onPostValidate(event: UnitIdPostValidateEvent): void {
    this.apiService.getCollectionDates(event.data.parsedUnitId).subscribe({
      next: (dates) => {
        if (dates.length === 0) {
          event.reject('Unit not found for current chapter');
          return;
        }
        this.collectionDates.set(dates);
        this.currentCodeScheme = event.data.codeScheme || null;

        this.contractId.set(dates[0].contractId);
        this.contractName.set(dates[0].contractName);

        if (dates.length === 1) {
          this.collDateControl.setValue(dates[0].collDate);
          event.confirm();
          setTimeout(() => this.onRetrieve());
          return;
        } else {
          this.collDateControl.setValue('');
        }

        event.confirm();
      },
      error: () => event.reject('Error validating unit'),
    });
  }

  onUnitValidated(data: UnitValidationResponse): void {
    this.currentParsedUnitId.set(data.parsedUnitId);
  }

  onUnitCleared(): void {
    this.resetAll();
  }

  // ── Search Card ──

  onCollDateSelected(): void {
    if (this.collDateControl.value) {
      this.onRetrieve();
    }
  }

  onClearAbo(event: Event): void {
    event.stopPropagation();
    this.editForm.controls.donorFormAbo.setValue('');
    this.editForm.markAsDirty();
  }

  onRetrieve(): void {
    if (!this.currentParsedUnitId() || !this.collDateControl.value) return;
    this.currentCollDate = this.collDateControl.value;
    this.isLoading.set(true);

    this.apiService.getDetails(this.currentParsedUnitId()!, this.currentCollDate).subscribe({
      next: (details) => {
        if (!details) {
          this.isLoading.set(false);
          return;
        }
        this.unitDetails.set(details);
        this.isRetrieved.set(true);
        if (details.codeScheme) {
          this.currentCodeScheme = details.codeScheme;
        }
        this.populateForm(details);
        const attrRows: EditableAttributeRow[] = details.attributes.map((a) => ({
          ...a, isNew: false, codesForRow: [],
        }));
        this.attributeRows.set(attrRows);
        this.loadCodesForExistingAttributes(attrRows);
        const equipRows: EditableEquipmentRow[] = details.equipment.map((e) => ({
          ...e, equipTypesForRow: [], serialNumbersForRow: [],
        }));

        for (const attr of details.attributes) {
          if (attr.requiresEquipment && attr.parmCode) {
            const hasEquip = equipRows.some(e => e.parmCode === attr.parmCode);
            if (!hasEquip) {
              equipRows.push({
                parmCode: attr.parmCode,
                equipReference: null,
                equipType: null,
                equipTypeDescription: null,
                serialNumber: null,
                equipTypesForRow: [],
                serialNumbersForRow: [],
              });
            }
          }
        }

        this.visibleEquipment.set(equipRows);
        this.loadEquipmentLovsForExisting(details);

        for (const attr of details.attributes) {
          if (attr.requiresEquipment && attr.parmCode) {
            const equip = equipRows.find(e => e.parmCode === attr.parmCode);
            if (equip && !equip.equipType) {
              this.loadEquipTypesForRow(attr.attribGroup, attr.attribCode, attr.parmCode);
            }
          }
        }
        this.deletedAttributes = [];
        this.loadAllLovs(details);
        this.isLoading.set(false);
      },
      error: () => { this.isLoading.set(false); },
    });
  }

  onClearAll(): void {
    this.unitIdField?.clear();
    this.resetAll();
  }

  // ── Form Population ──

  private populateForm(d: ModifyUnitDetails): void {
    this.editForm.enable({ emitEvent: false });

    this.editForm.patchValue({
      driveId: d.driveId || '',
      groupSiteId: d.groupSiteId || '',
      bleedStartDate: d.bleedStartDate ? moment(d.bleedStartDate, 'DD-MMM-YYYY') : null,
      bleedStartTime: d.bleedStartTime || '',
      bleedEndDate: d.bleedEndDate ? moment(d.bleedEndDate, 'DD-MMM-YYYY') : null,
      bleedEndTime: d.bleedEndTime || '',
      qcCheckinDate: d.qcCheckinDate || '',
      qcCheckinTime: d.qcCheckinTime || '',
      qcCheckinFlag: d.qcCheckinFlag || '',
      donorFormAbo: d.donorFormAbo || '',
      donorDecisionCode: d.donorDecisionCode || '',
      catalogNumber: d.catalogNumber || '',
      lotNumber: d.lotNumber || '',
      batchId: d.batchId || '',
      redTubeFlag: d.redTubeFlag || '',
      redTube2: d.redTube2 || '',
      purpleTubeFlag: d.purpleTubeFlag || '',
      serumPlasmaInd: d.serumPlasmaInd || '',
    });

    this.editForm.controls.qcCheckinDate.disable({ emitEvent: false });
    this.editForm.controls.qcCheckinTime.disable({ emitEvent: false });

    if (d.isBleedTimeLocked) {
      this.editForm.controls.bleedStartDate.disable({ emitEvent: false });
      this.editForm.controls.bleedStartTime.disable({ emitEvent: false });
      this.editForm.controls.bleedEndDate.disable({ emitEvent: false });
      this.editForm.controls.bleedEndTime.disable({ emitEvent: false });
    }

    if (d.isQcFlagDisabled) {
      this.editForm.controls.qcCheckinFlag.disable({ emitEvent: false });
    }

    if (d.isCatalogLocked) {
      this.editForm.controls.catalogNumber.disable({ emitEvent: false });
    }

    if (d.isCatalogNull) {
      this.editForm.controls.lotNumber.disable({ emitEvent: false });
      this.editForm.controls.batchId.disable({ emitEvent: false });
    }

    // G11 FIX: FMB BLEED_START_TIME PRE-TEXT-ITEM — if bleed_start_time is null,
    // default the date portion to collection date
    if (!d.bleedStartDate && d.collDate) {
      this.editForm.controls.bleedStartDate.setValue(moment(d.collDate, 'DD-MMM-YYYY'));
    }
    if (!d.bleedEndDate && d.bleedStartDate) {
      this.editForm.controls.bleedEndDate.setValue(
        moment(d.bleedStartDate, 'DD-MMM-YYYY')
      );
    } else if (!d.bleedEndDate && d.collDate) {
      this.editForm.controls.bleedEndDate.setValue(moment(d.collDate, 'DD-MMM-YYYY'));
    }

    this.editForm.markAsPristine();
  }

  // G9 FIX: FMB LOV9 shows inter_type decode (NFT/Hold/BIO/Initial)
  getInterTypeLabel(interType: string | null): string {
    if (!interType) return '';
    switch (interType) {
      case 'N': return 'NFT';
      case 'H': return 'Hold';
      case 'B': return 'BIO';
      case 'I': return 'Initial';
      default: return interType;
    }
  }

  getAttrCodeDisplayLabel(code: AttrCodeOption): string {
    const desc = code.description || '';
    const interLabel = this.getInterTypeLabel(code.interType);
    const okIndicator = !code.interCode ? 'OK' : '';
    const parts = [code.attribCode, desc];
    if (okIndicator) parts.push(okIndicator);
    if (interLabel) parts.push(interLabel);
    return parts.join(' — ');
  }

  private loadAllLovs(details: ModifyUnitDetails): void {
    const collDate = this.currentCollDate!;

    forkJoin({
      drives: this.apiService.getDrives(collDate),
      aboValues: this.apiService.getAboValues(),
      catalogs: this.apiService.getCatalogs(),
      batches: this.apiService.getBatches(),
      attributeGroups: this.apiService.getAttributeGroups(),
      donorDecisionCodes: this.apiService.getDonorDecisionCodes(),
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (lovs) => {
        this.drives.set(lovs.drives);
        this.aboValues.set(lovs.aboValues);
        this.catalogs.set(lovs.catalogs);
        this.batches.set(lovs.batches);
        this.attributeGroups.set(lovs.attributeGroups);
        this.donorDecisionCodes.set(lovs.donorDecisionCodes);

        if (details.driveId) { this.loadGroupSites(details.driveId); }
        if (details.catalogNumber) { this.loadLots(details.catalogNumber); }
      },
    });
  }

  // ── LOV Cascading ──

  onDriveChanged(): void {
    const driveId = this.editForm.controls.driveId.value;
    this.editForm.controls.groupSiteId.setValue('');
    this.groupSites.set([]);
    if (driveId) {
      this.loadGroupSites(driveId);
      const drive = this.drives().find((d) => d.driveId === driveId);
      if (drive?.groupSiteId) {
        this.editForm.controls.groupSiteId.setValue(drive.groupSiteId);
      }
    }
  }

  onCatalogChanged(): void {
    const catalog = this.editForm.controls.catalogNumber.value;
    this.editForm.controls.lotNumber.setValue('');
    this.lots.set([]);
    if (catalog) { this.loadLots(catalog); }
  }

  private loadGroupSites(driveId: string): void {
    this.apiService.getGroupSites(driveId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (sites) => this.groupSites.set(sites) });
  }

  private loadLots(catalogNumber: string): void {
    this.apiService.getLots(catalogNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (l) => this.lots.set(l) });
  }

  // ── Description Helpers ──

  getGroupSiteDescription(): string {
    const gsId = this.editForm.controls.groupSiteId.value;
    return this.groupSites().find((gs) => gs.groupSiteId === gsId)?.siteName || '';
  }

  getAboDescription(): string {
    const abo = this.editForm.controls.donorFormAbo.value;
    return this.aboValues().find((a) => a.aboLabel === abo)?.aboShortName || '';
  }

  getDdDescription(): string {
    const dd = this.editForm.controls.donorDecisionCode.value;
    return this.donorDecisionCodes().find((d) => d.code === dd)?.description || '';
  }

  getEquipTypeDescription(equip: EditableEquipmentRow): string {
    return equip.equipTypesForRow?.find((et) => et.equipType === equip.equipType)?.description || equip.equipTypeDescription || '';
  }

  formatCollDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()].toUpperCase()}-${d.getFullYear()}`;
  }

  // ── Attributes ──

  onAddAttribute(): void {
    const rows = [...this.attributeRows()];
    rows.push({
      attribGroup: '', attribCode: '',
      groupDescription: null, codeDescription: null,
      interCode: null, interType: null,
      requiresEquipment: false, parmCode: null,
      isNew: true, codesForRow: [],
    });
    this.attributeRows.set(rows);
    this.editForm.markAsDirty();
  }

  onDeleteAttribute(index: number): void {
    const rows = [...this.attributeRows()];
    const removed = rows.splice(index, 1)[0];
    if (!removed.isNew && removed.attribGroup && removed.attribCode) {
      this.deletedAttributes.push(removed);
    }
    this.attributeRows.set(rows);

    if (removed.parmCode) {
      const stillNeeded = rows.some(r => r.parmCode === removed.parmCode);
      if (!stillNeeded) {
        const equipRows = this.visibleEquipment().filter(e => e.parmCode !== removed.parmCode);
        this.visibleEquipment.set(equipRows);
      }
    }

    this.editForm.markAsDirty();
  }

  onAttrGroupChanged(index: number): void {
    const rows = [...this.attributeRows()];
    const row = rows[index];
    const group = this.attributeGroups().find((g) => g.code === row.attribGroup);
    row.groupDescription = group?.description || null;
    row.attribCode = '';
    row.codeDescription = null;
    row.interCode = null;
    row.codesForRow = [];
    this.attributeRows.set(rows);
    this.editForm.markAsDirty();

    if (row.attribGroup) {
      this.apiService.getAttributeCodes(row.attribGroup, this.currentCodeScheme || undefined)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (codes) => {
            const updated = [...this.attributeRows()];
            updated[index] = { ...updated[index], codesForRow: codes };
            this.attributeRows.set(updated);
          },
        });
    }
  }

  onAttrCodeChanged(index: number): void {
    const rows = [...this.attributeRows()];
    const row = rows[index];
    const code = row.codesForRow?.find((c) => c.attribCode === row.attribCode);
    const prevRequiresEquip = row.requiresEquipment;
    const prevParmCode = row.parmCode;

    row.codeDescription = code?.description || null;
    row.interCode = code?.interCode || null;
    row.requiresEquipment = code?.requiresEquipment || false;
    row.parmCode = code?.parmCode || null;
    this.attributeRows.set(rows);
    this.editForm.markAsDirty();

    if (row.requiresEquipment && row.parmCode) {
      const equipRows = [...this.visibleEquipment()];
      const existingIdx = equipRows.findIndex(e => e.parmCode === row.parmCode);
      if (existingIdx === -1) {
        equipRows.push({
          parmCode: row.parmCode,
          equipReference: null,
          equipType: null,
          equipTypeDescription: null,
          serialNumber: null,
          equipTypesForRow: [],
          serialNumbersForRow: [],
        });
        this.visibleEquipment.set(equipRows);
        this.loadEquipTypesForRow(row.attribGroup, row.attribCode, row.parmCode);
      }
    } else if (prevRequiresEquip && prevParmCode && !row.requiresEquipment) {
      const equipRows = this.visibleEquipment().filter(e => e.parmCode !== prevParmCode);
      this.visibleEquipment.set(equipRows);
    }
  }

  onEquipTypeChanged(equip: EditableEquipmentRow): void {
    const equipRows = [...this.visibleEquipment()];
    const idx = equipRows.findIndex(e => e.parmCode === equip.parmCode);
    if (idx !== -1) {
      equipRows[idx] = { ...equipRows[idx], equipType: equip.equipType, serialNumber: null, serialNumbersForRow: [] };
      this.visibleEquipment.set(equipRows);
    }
    this.editForm.markAsDirty();
    if (equip.equipType) {
      this.apiService.getSerialNumbers(equip.equipType)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (serials) => {
            const rows = [...this.visibleEquipment()];
            const i = rows.findIndex(e => e.parmCode === equip.parmCode);
            if (i !== -1) {
              rows[i] = { ...rows[i], serialNumbersForRow: serials };
              this.visibleEquipment.set(rows);
            }
          },
        });
    }
  }

  onSerialNumberChanged(equip: EditableEquipmentRow): void {
    const equipRows = [...this.visibleEquipment()];
    const idx = equipRows.findIndex(e => e.parmCode === equip.parmCode);
    if (idx !== -1) {
      equipRows[idx] = { ...equipRows[idx], serialNumber: equip.serialNumber };
      this.visibleEquipment.set(equipRows);
    }
    this.editForm.markAsDirty();
  }

  private loadEquipmentLovsForExisting(details: ModifyUnitDetails): void {
    for (const equip of details.equipment) {
      const attr = details.attributes.find(a => a.parmCode === equip.parmCode && a.requiresEquipment);
      if (attr) {
        this.loadEquipTypesForRow(attr.attribGroup, attr.attribCode, equip.parmCode);
      }
      if (equip.equipType) {
        this.apiService.getSerialNumbers(equip.equipType)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (serials) => {
              const equipRows = [...this.visibleEquipment()];
              const idx = equipRows.findIndex(e => e.parmCode === equip.parmCode);
              if (idx !== -1) {
                equipRows[idx] = { ...equipRows[idx], serialNumbersForRow: serials };
                this.visibleEquipment.set(equipRows);
              }
            },
          });
      }
    }
  }

  private loadEquipTypesForRow(attribGroup: string, attribCode: string, parmCode: string): void {
    this.apiService.getEquipmentTypes(attribGroup, attribCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          const equipRows = [...this.visibleEquipment()];
          const idx = equipRows.findIndex(e => e.parmCode === parmCode);
          if (idx !== -1) {
            equipRows[idx] = { ...equipRows[idx], equipTypesForRow: types };
            this.visibleEquipment.set(equipRows);
          }
        },
      });
  }

  isAttrRowIncomplete(row: EditableAttributeRow): boolean {
    if (!row.attribGroup && !row.attribCode) return false;
    return !row.attribGroup || !row.attribCode;
  }

  readonly saveBlocked = computed(() => {
    const attrs = this.attributeRows();
    const equips = this.visibleEquipment();

    const hasIncompleteAttr = attrs.some(r => {
      if (!r.attribGroup && !r.attribCode) return false;
      return !r.attribGroup || !r.attribCode;
    });

    const hasIncompleteEquip = attrs.some(r =>
      r.requiresEquipment && r.parmCode &&
      !equips.some(e =>
        e.parmCode === r.parmCode && e.equipType && e.serialNumber
      )
    );

    return hasIncompleteAttr || hasIncompleteEquip;
  });

  private loadCodesForExistingAttributes(rows: EditableAttributeRow[]): void {
    const uniqueGroups = [...new Set(rows.map((r) => r.attribGroup).filter(Boolean))];
    const savedCodes = rows.map((r) => ({
      group: r.attribGroup, code: r.attribCode, description: r.codeDescription,
    }));

    uniqueGroups.forEach((group) => {
      this.apiService.getAttributeCodes(group, this.currentCodeScheme || undefined)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (codes) => {
            const rowsForGroup = savedCodes.filter((s) => s.group === group);
            let mergedCodes = [...codes];

            rowsForGroup.forEach((saved) => {
              if (saved.code && !mergedCodes.some((c) => c.attribCode === saved.code)) {
                mergedCodes.push({
                  attribCode: saved.code,
                  description: saved.description,
                  interCode: null, interType: null,
                  requiresEquipment: false, parmCode: null,
                });
              }
            });

            const cleared = this.attributeRows().map((row, i) =>
              row.attribGroup === group
                ? { ...row, codesForRow: mergedCodes, attribCode: '' }
                : row
            );
            this.attributeRows.set(cleared);

            setTimeout(() => {
              const restored = this.attributeRows().map((row, i) =>
                row.attribGroup === group && row.attribCode === '' && savedCodes[i]
                  ? { ...row, attribCode: savedCodes[i].code }
                  : row
              );
              this.attributeRows.set(restored);
              this.editForm.markAsPristine();
            });
          },
        });
    });
  }

  getAttrCodesForRow(index: number): AttrCodeOption[] {
    return this.attributeRows()[index]?.codesForRow || [];
  }

  hasEquipmentData(): boolean {
    return this.visibleEquipment().length > 0;
  }

  getEquipTypesForRow(equip: EditableEquipmentRow): EquipTypeOption[] {
    return equip.equipTypesForRow || [];
  }

  // ── Save ──

  onSave(): void {
    if (!this.currentParsedUnitId() || !this.currentCollDate) return;
    this.saveWithOverrides([]);
  }

  private saveWithOverrides(overrides: string[]): void {
    this.isSaving.set(true);

    const fv = this.editForm.getRawValue();
    const formatDate = (m: Moment | null): string | null =>
      m && moment.isMoment(m) ? m.format('DD-MMM-YYYY') : (m as string | null);

    const request: ModifyUnitUpdateRequest = {
      unitId: this.currentParsedUnitId()!,
      collDate: this.currentCollDate!,
      driveId: fv.driveId,
      groupSiteId: fv.groupSiteId,
      bleedStartDate: formatDate(fv.bleedStartDate),
      bleedStartTime: fv.bleedStartTime,
      bleedEndDate: formatDate(fv.bleedEndDate),
      bleedEndTime: fv.bleedEndTime,
      qcCheckinDate: fv.qcCheckinDate,
      qcCheckinTime: fv.qcCheckinTime,
      qcCheckinFlag: fv.qcCheckinFlag,
      donorFormAbo: fv.donorFormAbo,
      donorDecisionCode: fv.donorDecisionCode,
      catalogNumber: fv.catalogNumber,
      lotNumber: fv.lotNumber,
      batchId: fv.batchId,
      redTubeFlag: fv.redTubeFlag,
      redTube2: fv.redTube2,
      purpleTubeFlag: fv.purpleTubeFlag,
      serumPlasmaInd: fv.serumPlasmaInd,
      attributes: this.attributeRows()
        .filter((r) => r.attribGroup && r.attribCode)
        .map((r) => {
          const equip = this.visibleEquipment().find(
            (e) => e.parmCode === r.parmCode && r.parmCode
          );
          return {
            attribGroup: r.attribGroup,
            attribCode: r.attribCode,
            interCode: r.interCode,
            parmCode: r.parmCode,
            equipReference: equip?.equipReference || null,
          } as ModifyUnitAttributeRequest;
        }),
      deletedAttributes: this.deletedAttributes.map((r) => ({
        attribGroup: r.attribGroup,
        attribCode: r.attribCode,
        interCode: r.interCode,
        parmCode: r.parmCode,
        equipReference: null,
      } as ModifyUnitAttributeRequest)),
      equipment: this.visibleEquipment()
        .filter((e) => e.equipType && e.serialNumber)
        .map((e) => ({
          parmCode: e.parmCode,
          equipReference: e.equipReference || null,
          equipType: e.equipType,
          serialNumber: e.serialNumber,
        } as ModifyUnitEquipmentRequest)),
      overrides,
    };

    this.apiService.update(request).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.isSaving.set(false);
        if (response.status === 'WARNING') {
          this.handleWarnings(response.warnings);
          return;
        }
        this.snackbarService.showSuccess(response.message || 'Transaction committed');
        this.onRetrieve();
      },
      error: () => { this.isSaving.set(false); },
    });
  }

  private async handleWarnings(warnings: { code: string; message: string }[]): Promise<void> {
    const accepted: string[] = [];

    for (const w of warnings) {
      const ref = this.dialog.open(ModifyUnitWarningDialogComponent, {
        width: '450px',
        disableClose: true,
        ariaLabelledBy: 'warning-dialog-title',
        ariaDescribedBy: 'warning-dialog-desc',
        data: { code: w.code, message: w.message } as WarningDialogData,
      });

      const result = await firstValueFrom(ref.afterClosed()) as WarningDialogResult | null;

      if (result?.override) {
        accepted.push(w.code);
      } else {
        return;
      }
    }

    this.saveWithOverrides(accepted);
  }

  onCancel(): void {
    const details = this.unitDetails();
    if (details) {
      this.populateForm(details);
      const attrRows: EditableAttributeRow[] = details.attributes.map((a) => ({
        ...a, isNew: false, codesForRow: [],
      }));
      this.attributeRows.set(attrRows);
      this.loadCodesForExistingAttributes(attrRows);
      this.visibleEquipment.set(
        details.equipment.map((e) => ({ ...e, equipTypesForRow: [], serialNumbersForRow: [] }))
      );
      this.loadEquipmentLovsForExisting(details);
      this.deletedAttributes = [];
    }
  }

  // ── Reset ──

  private resetAll(): void {
    this.unitDetails.set(null);
    this.collectionDates.set([]);
    this.isRetrieved.set(false);
    this.isLoading.set(false);
    this.currentParsedUnitId.set(null);
    this.currentCollDate = null;
    this.currentCodeScheme = null;
    this.contractId.set(null);
    this.contractName.set(null);
    this.collDateControl.setValue('');
    this.editForm.reset();
    this.attributeRows.set([]);
    this.visibleEquipment.set([]);
    this.deletedAttributes = [];
    this.drives.set([]);
    this.groupSites.set([]);
    this.aboValues.set([]);
    this.catalogs.set([]);
    this.lots.set([]);
    this.batches.set([]);
    this.attributeGroups.set([]);
    this.donorDecisionCodes.set([]);
  }
}
