import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import * as moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import {
  ConfirmActionDialogComponent,
  ConfirmActionDialogData,
} from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

import { ScheduleAutoDirectedOrderService } from './services/schedule-auto-directed-order.service';
import { AvailableUnit, CustomerLookup, ConsigneeLookup, SelectedUnit } from './models/schedule-auto-directed-order.model';

@Component({
  selector: 'app-schedule-auto-directed-order',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    LoadingSpinnerComponent,
  ],
  templateUrl: './schedule-auto-directed-order.html',
  styleUrls: ['./schedule-auto-directed-order.scss'],
})
export class ScheduleAutoDirectedOrderComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `schedule-auto-directed-order-${ScheduleAutoDirectedOrderComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly destroy$ = new Subject<void>();
  private readonly orderService = inject(ScheduleAutoDirectedOrderService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly dialog = inject(MatDialog);

  headerConfig!: PageHeaderConfig;

  customerCtrl = new FormControl<string>('');
  consigneeCtrl = new FormControl<string>('');
  customerSearchCtrl = new FormControl<string>('');
  consigneeSearchCtrl = new FormControl<string>('');

  hospitalName = signal('—');
  consigneeName = signal('—');

  customers = signal<CustomerLookup[]>([]);
  consignees = signal<ConsigneeLookup[]>([]);
  filteredCustomers = signal<CustomerLookup[]>([]);
  filteredConsignees = signal<ConsigneeLookup[]>([]);

  units = signal<AvailableUnit[]>([]);
  selectedUnitKeys = signal<Set<string>>(new Set());
  loading = signal(false);
  scheduling = signal(false);
  loadingCustomers = signal(false);
  loadingConsignees = signal(false);
  hasRetrieved = signal(false);

  orderNumber = signal('—');
  pickSlipId = signal('—');

  pageSize = signal(25);
  pageIndex = signal(0);
  totalRecords = signal(0);

  readonly isAllSelected = computed(() => {
    const currentUnits = this.units();
    const selected = this.selectedUnitKeys();
    return currentUnits.length > 0 && currentUnits.every(u => selected.has(this.getUnitKey(u)));
  });

  readonly isIndeterminate = computed(() => {
    const currentUnits = this.units();
    const selected = this.selectedUnitKeys();
    const selectedCount = currentUnits.filter(u => selected.has(this.getUnitKey(u))).length;
    return selectedCount > 0 && selectedCount < currentUnits.length;
  });

  readonly selectedCount = computed(() => this.selectedUnitKeys().size);

  isRetrieveDisabled(): boolean {
    return !this.customerCtrl.value || !this.consigneeCtrl.value || this.loading() || this.scheduling();
  }

  isScheduleDisabled(): boolean {
    return this.selectedUnitKeys().size === 0 || this.scheduling();
  }

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
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
    this.initializeConfig();
    this.subscribeToChapterChanges();
    this.setupSearchFilters();
    this.loadCustomers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCustomerSelected(): void {
    const customerId = this.customerCtrl.value;
    if (customerId) {
      const customer = this.customers().find(c => c.customerId === customerId);
      this.hospitalName.set(customer?.name || '—');
      this.resetConsignee();
      this.resetGrid();
      this.loadConsignees(customerId);
    }
  }

  onConsigneeSelected(): void {
    const consigneeId = this.consigneeCtrl.value;
    if (consigneeId) {
      const consignee = this.consignees().find(c => c.consigneeId === consigneeId);
      this.consigneeName.set(consignee?.name || '—');
    }
  }

  onRetrieve(): void {
    const customerId = this.customerCtrl.value;
    const consigneeId = this.consigneeCtrl.value;

    if (!customerId || !consigneeId) {
      return;
    }

    this.loading.set(true);
    this.hasRetrieved.set(true);
    this.selectedUnitKeys.set(new Set());
    this.pageIndex.set(0);
    this.orderNumber.set('—');
    this.pickSlipId.set('—');

    this.orderService.getAvailableUnits({
      customerId,
      consigneeId,
      take: this.pageSize(),
      skip: 0,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          if (response.success) {
            this.units.set(response.data || []);
            this.totalRecords.set(response.total || 0);
          } else {
            this.units.set([]);
            this.totalRecords.set(0);
            if (response.message) {
              const errorMsg = response.errorCode?.trim()
                ? `Error ${response.errorCode}: ${response.message}`
                : response.message;
              this.snackbarService.showError(errorMsg);
            }
          }
        },
        error: (error: any) => {
          this.loading.set(false);
          this.units.set([]);
          this.totalRecords.set(0);
          const errorMsg = error?.error?.errorCode?.trim()
            ? `Error ${error.error.errorCode}: ${error.error.message}`
            : (error?.error?.message || 'Failed to retrieve available units');
          this.snackbarService.showError(errorMsg);
        },
      });
  }

  onClearAll(): void {
    this.customerCtrl.setValue('');
    this.hospitalName.set('—');
    this.consigneeCtrl.setValue('');
    this.consigneeName.set('—');
    this.consignees.set([]);
    this.filteredConsignees.set([]);
    this.units.set([]);
    this.selectedUnitKeys.set(new Set());
    this.hasRetrieved.set(false);
    this.pageIndex.set(0);
    this.totalRecords.set(0);
    this.orderNumber.set('—');
    this.pickSlipId.set('—');
  }

  onToggleAll(checked: boolean): void {
    if (checked) {
      const allKeys = new Set(this.units().map(u => this.getUnitKey(u)));
      this.selectedUnitKeys.set(allKeys);
    } else {
      this.selectedUnitKeys.set(new Set());
    }
  }

  onToggleUnit(unit: AvailableUnit, checked: boolean): void {
    const key = this.getUnitKey(unit);
    const current = new Set(this.selectedUnitKeys());
    if (checked) {
      current.add(key);
    } else {
      current.delete(key);
    }
    this.selectedUnitKeys.set(current);
  }

  isUnitSelected(unit: AvailableUnit): boolean {
    return this.selectedUnitKeys().has(this.getUnitKey(unit));
  }

  getUnitKey(unit: AvailableUnit): string {
    return `${unit.unitId}|${unit.productCode}|${unit.aliquot || ''}`;
  }

  onScheduleOrder(acknowledgeRestrictedProducts = false): void {
    const selectedKeys = this.selectedUnitKeys();
    if (selectedKeys.size === 0) {
      return;
    }

    const customerId = this.customerCtrl.value;
    const consigneeId = this.consigneeCtrl.value;
    if (!customerId || !consigneeId) {
      return;
    }

    const selectedUnits: SelectedUnit[] = this.units()
      .filter(u => selectedKeys.has(this.getUnitKey(u)))
      .map(u => ({ unitId: u.unitId, productCode: u.productCode, aliquot: u.aliquot }));

    if (selectedUnits.length === 0) {
      return;
    }

    this.scheduling.set(true);

    this.orderService.createOrder({
      customerId,
      consigneeId,
      selectedUnits,
      acknowledgeRestrictedProducts,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.scheduling.set(false);
          if (response.success) {
            const scheduled = response.data?.[0];
            if (scheduled) {
              this.orderNumber.set(scheduled.orderNo);
              this.pickSlipId.set(scheduled.pickSlipId);
            }
            const count = scheduled?.unitsScheduled ?? selectedUnits.length;
            this.snackbarService.showSuccess(
              `${count} selected orders has been scheduled successfully.`
            );
            const remaining = this.units().filter(u => !selectedKeys.has(this.getUnitKey(u)));
            this.units.set(remaining);
            this.totalRecords.update(total => total - selectedUnits.length);
            this.selectedUnitKeys.set(new Set());
          } else if (response.errorCode?.trim() === '3315') {
            this.showRestrictedProductWarning();
          } else {
            const errorMsg = response.errorCode?.trim()
              ? `Error ${response.errorCode}: ${response.message}`
              : (response.message || 'Failed to schedule order');
            this.snackbarService.showError(errorMsg);
          }
        },
        error: (error: any) => {
          this.scheduling.set(false);
          const errorMsg = error?.error?.errorCode?.trim()
            ? `Error ${error.error.errorCode}: ${error.error.message}`
            : (error?.error?.message || 'Failed to schedule order');
          this.snackbarService.showError(errorMsg);
        },
      });
  }

  private showRestrictedProductWarning(): void {
    const dialogData: ConfirmActionDialogData = {
      title: 'Restricted Product Warning',
      message: 'Some selected units contain restricted product types. Do you want to proceed with scheduling?',
      confirmText: 'Proceed',
      cancelText: 'Cancel',
    };
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '450px',
      data: dialogData,
      disableClose: true,
    });
    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result === true) {
          this.onScheduleOrder(true);
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
    this.selectedUnitKeys.set(new Set());
    this.fetchPage();
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    const m = moment.utc(dateStr);
    if (!m.isValid()) return dateStr;
    const local = this.chapterTimezoneService.convertGmtToLocal(m);
    return local.format('D-MMM-YYYY, hh:mm A').toUpperCase();
  }

  private setupSearchFilters(): void {
    this.customerSearchCtrl.valueChanges.pipe(
      startWith(''),
      map(search => this.filterCustomers(search)),
      takeUntil(this.destroy$)
    ).subscribe(filtered => this.filteredCustomers.set(filtered));

    this.consigneeSearchCtrl.valueChanges.pipe(
      startWith(''),
      map(search => this.filterConsignees(search)),
      takeUntil(this.destroy$)
    ).subscribe(filtered => this.filteredConsignees.set(filtered));
  }

  private filterCustomers(search: string | null): CustomerLookup[] {
    const all = this.customers();
    if (!search) return all;
    const upper = search.toUpperCase();
    return all.filter(c =>
      c.customerId.toUpperCase().includes(upper) ||
      c.name.toUpperCase().includes(upper)
    );
  }

  private filterConsignees(search: string | null): ConsigneeLookup[] {
    const all = this.consignees();
    if (!search) return all;
    const upper = search.toUpperCase();
    return all.filter(c =>
      c.consigneeId.toUpperCase().includes(upper) ||
      c.name.toUpperCase().includes(upper)
    );
  }

  private loadCustomers(): void {
    this.loadingCustomers.set(true);
    this.orderService.getCustomersLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loadingCustomers.set(false);
          if (response.success) {
            this.customers.set(response.data || []);
            this.filteredCustomers.set(response.data || []);
          }
        },
        error: (error: any) => {
          this.loadingCustomers.set(false);
          const errorMsg = error?.error?.errorCode?.trim()
            ? `Error ${error.error.errorCode}: ${error.error.message}`
            : (error?.error?.message || 'Failed to load customers');
          this.snackbarService.showError(errorMsg);
        },
      });
  }

  private loadConsignees(customerId: string): void {
    this.loadingConsignees.set(true);
    this.orderService.getConsigneesLookup(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loadingConsignees.set(false);
          if (response.success) {
            this.consignees.set(response.data || []);
            this.filteredConsignees.set(response.data || []);
          }
        },
        error: (error: any) => {
          this.loadingConsignees.set(false);
          const errorMsg = error?.error?.errorCode?.trim()
            ? `Error ${error.error.errorCode}: ${error.error.message}`
            : (error?.error?.message || 'Failed to load consignees');
          this.snackbarService.showError(errorMsg);
        },
      });
  }

  private resetConsignee(): void {
    this.consigneeCtrl.setValue('');
    this.consigneeName.set('—');
    this.consignees.set([]);
    this.filteredConsignees.set([]);
  }

  private resetGrid(): void {
    this.units.set([]);
    this.selectedUnitKeys.set(new Set());
    this.hasRetrieved.set(false);
    this.pageIndex.set(0);
    this.totalRecords.set(0);
    this.orderNumber.set('—');
    this.pickSlipId.set('—');
  }

  private fetchPage(): void {
    const customerId = this.customerCtrl.value;
    const consigneeId = this.consigneeCtrl.value;

    if (!customerId || !consigneeId) return;

    this.loading.set(true);

    this.orderService.getAvailableUnits({
      customerId,
      consigneeId,
      take: this.pageSize(),
      skip: this.pageIndex() * this.pageSize(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          if (response.success) {
            this.units.set(response.data || []);
            this.totalRecords.set(response.total || 0);
          } else {
            this.units.set([]);
            this.totalRecords.set(0);
          }
        },
        error: (error: any) => {
          this.loading.set(false);
          this.units.set([]);
          this.totalRecords.set(0);
          const errorMsg = error?.error?.errorCode?.trim()
            ? `Error ${error.error.errorCode}: ${error.error.message}`
            : (error?.error?.message || 'Failed to retrieve available units');
          this.snackbarService.showError(errorMsg);
        },
      });
  }

  private initializeConfig(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: 'Schedule Auto/Directed Order', link: null },
      ],
      title: 'Schedule Auto/Directed Order',
      subtitle: 'Select available units and assign orders for patient transfusion scheduling and delivery.',
    };
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadCustomers();
      });
  }
}
