import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { UnitQueryService } from './unit-query.service';
import {
  UnitQueryResult,
  ComponentResult,
  UnitQueryMode,
  QuickLink,
  UnitQueryPanelRecord,
} from './unit-query.model';
import { UnitTestDetailsPanelComponent } from './panels/unit-test-details-panel';
import { AttributesInterdictionsPanelComponent } from './panels/attributes-interdictions-panel';
import { UnitNotesPanelComponent } from './panels/unit-notes-panel';
import { ComponentNotesPanelComponent } from './panels/component-notes-panel';
import { FreezeDetailsPanelComponent } from './panels/freeze-details-panel';
import { SeparationTimePanelComponent } from './panels/separation-time-panel';
import { AddedBagsPanelComponent } from './panels/added-bags-panel';
import { EquipmentSupplyPanelComponent } from './panels/equipment-supply-panel';
import { PathogenReductionPanelComponent } from './panels/pathogen-reduction-panel';

@Component({
  selector: 'app-unit-query',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
    SidePanelBase,
    RouterOutlet,
    UnitTestDetailsPanelComponent,
    AttributesInterdictionsPanelComponent,
    UnitNotesPanelComponent,
    ComponentNotesPanelComponent,
    FreezeDetailsPanelComponent,
    SeparationTimePanelComponent,
    AddedBagsPanelComponent,
    EquipmentSupplyPanelComponent,
    PathogenReductionPanelComponent,
  ],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    DatePipe,
  ],
  templateUrl: './unit-query.component.html',
  styleUrls: ['./unit-query.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitQueryComponent implements OnInit, OnDestroy {
  private readonly service = inject(UnitQueryService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbar = inject(SnackbarService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly datePipe = inject(DatePipe);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  protected readonly isChildRouteActive = signal(false);
  protected readonly activeChildTitle = signal<string | null>(null);

  @ViewChild('unitIdField') unitIdField!: UnitIdFieldComponent;

  protected readonly loading = signal(false);
  protected readonly unit = signal<UnitQueryResult | null>(null);
  protected readonly components = signal<ComponentResult[]>([]);
  protected readonly hasQueried = signal(false);
  protected readonly selectedComponent = signal<ComponentResult | null>(null);

  protected readonly mode = signal<UnitQueryMode>('REGULAR');

  protected readonly headerConfig = computed<PageHeaderConfig>(() => {
    const data = this.pageHeaderService.pageHeaderData();
    const isSuper = this.mode() === 'SUPER';
    const parentTitle = isSuper ? 'Unit Information' : 'Unit Query';
    const childTitle = this.activeChildTitle();
    const title = childTitle ?? parentTitle;
    const parentPath = isSuper ? '/laboratory-functions/unit-information' : '/laboratory-functions/unit-query';
    return {
      title: data?.title || title,
      subtitle:
        data?.subtitle ||
        (childTitle
          ? `${childTitle} for Unit ${this.unit()?.unitId ?? ''}`
          : 'Use the Unit Query or Unit Information screens to review complete information that has been entered for a particular unit.'),
      breadcrumbs: childTitle
        ? [
            { label: 'Home', link: '/' },
            { label: parentTitle, link: parentPath },
            { label: childTitle },
          ]
        : [
            { label: 'Home', link: '/' },
            { label: parentTitle },
          ],
    };
  });

  protected searchForm!: FormGroup;

  protected readonly intrAttrLabel = computed(() => {
    const u = this.unit();
    if (!u) return '';
    if (u.hasAttributes && u.hasInterdictions) return 'Both';
    if (u.hasAttributes) return 'Attributes';
    if (u.hasInterdictions) return 'Interdiction';
    return 'None';
  });

  protected readonly quickLinksLeft = computed<QuickLink[]>(() => {
    const u = this.unit();
    const c = this.selectedComponent();
    const hasUnitLevel = u?.hasAttributes || u?.hasInterdictions || false;
    const hasComponentLevel = c?.hasAttributes || c?.hasInterdictions || false;
    return [
      {
        label: 'Unit Test Details',
        icon: 'science',
        enabled: !!u,
        action: 'unitTestDetails',
      },
      {
        label: 'Attributes and Interdictions',
        icon: 'checklist',
        enabled: hasUnitLevel || hasComponentLevel,
        action: 'attributesAndInterdictions',
      },
      {
        label: 'Component Details',
        icon: 'inventory_2',
        enabled: u?.hasComponents ?? false,
        action: 'componentDetails',
      },
      {
        label: 'Unit Notes',
        icon: 'sticky_note_2',
        enabled: u?.noteId != null,
        action: 'unitNotes',
      },
      {
        label: 'Component Notes',
        icon: 'note',
        enabled: u?.hasComponents ?? false,
        action: 'componentNotes',
      },
      {
        label: 'Freeze Details',
        icon: 'ac_unit',
        enabled: u?.hasFreezeDetails ?? false,
        action: 'freezeDetails',
      },
      {
        label: 'Separation Time',
        icon: 'timer',
        enabled: !!u,
        action: 'separationTime',
      },
    ];
  });

  protected readonly quickLinksRight = computed<QuickLink[]>(() => {
    const u = this.unit();
    return [
      {
        label: 'Added Bags',
        icon: 'shopping_bag',
        enabled: u?.hasAddOnBags ?? false,
        action: 'addedBags',
      },
      {
        label: 'Antigens',
        icon: 'bloodtype',
        enabled: !!u && (u.hasAntigensPermission ?? false),
        action: 'antigens',
      },
      {
        label: 'Equipment and Supply Details',
        icon: 'precision_manufacturing',
        enabled: !!u,
        action: 'equipmentSupply',
      },
      {
        label: 'Pathogen Reduction',
        icon: 'sanitizer',
        enabled: u?.hasPathogenDetails ?? false,
        action: 'pathogenReduction',
      },
      {
        label: 'Product History',
        icon: 'history',
        enabled: !!u,
        action: 'productHistory',
      },
      {
        label: 'Documents',
        icon: 'description',
        enabled: u?.hasDocuments ?? false,
        action: 'documents',
      },
    ];
  });

  protected readonly tableConfig: DataTableConfig = {
    columns: [
      { key: 'warehouseId', header: '', headerIcon: 'warehouse', width: '50px' },
      { key: 'productCode', header: 'Product Code'},
      { key: 'productDescription', header: 'Product Description'},
      { key: 'productType', header: 'Product Type'},
      { key: 'interdictionAttr', header: 'Interdiction/ Attributes' },
      { key: 'systemLabelDecisionDescription', header: 'System Label Decision'},
      { key: 'expirationDate', header: 'Expiration Date', type: 'date' },
      { key: 'rejectReasonCode', header: 'Reject Code'},
      { key: 'bagsUsed', header: 'No. of Bags' },
      { key: 'invProductType', header: 'Inventory Product Type' },
      { key: 'componentStatusDescription', header: 'Custom Status' },
    ],
    pagination: {
      pageSize: 10,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50],
    },
    showPagination: true,
    emptyMessage: 'No components found',
  };

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      unitId: [''],
      collDate: [null],
      osUnit: ['', [Validators.maxLength(15)]],
      checkInDate: [null],
    });

    const routeData = this.route.snapshot.data;
    if (routeData['mode'] === 'SUPER') {
      this.mode.set('SUPER');
    }

    this.headerService.chapterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.clearAll();
    });

    this.detectChildRoute();
  }

  private readonly childRouteTitleMap: Record<string, string> = {
    'product-history': 'Product History',
    'antigens': 'Antigens',
    'documents': 'Documents',
    'component-query': 'Component Query',
  };

  private detectChildRoute(): void {
    this.updateChildRouteState();
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.updateChildRouteState();
        this.cdr.markForCheck();
      });
  }

  private updateChildRouteState(): void {
    const hasChild = this.route.children.length > 0;
    this.isChildRouteActive.set(hasChild);
    if (hasChild) {
      const childPath = this.route.children[0]?.snapshot?.url?.[0]?.path ?? '';
      this.activeChildTitle.set(this.childRouteTitleMap[childPath] ?? childPath);
    } else {
      this.activeChildTitle.set(null);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onUnitValidated(data: UnitValidationResponse): void {
    this.searchForm.patchValue({ unitId: data.parsedUnitId });
    this.onRetrieve();
  }

  protected onUnitCleared(): void {
    this.searchForm.patchValue({ unitId: '' });
  }

  protected onRetrieve(): void {
    const unitId = this.searchForm.get('unitId')?.value?.trim() || this.unitIdField?.parsedUnitId;
    const osUnit = this.searchForm.get('osUnit')?.value?.trim();

    if (this.searchForm.invalid) {
      return;
    }

    if (!unitId && !osUnit) {
      this.snackbar.showError('Please enter a Unit ID or OS Unit to search.');
      return;
    }

    this.loading.set(true);
    this.hasQueried.set(true);

    if (unitId) {
      const collDate = this.searchForm.get('collDate')?.value;
      const collDateStr = collDate
        ? this.datePipe.transform(collDate, 'yyyy-MM-dd') ?? undefined
        : undefined;

      this.service
        .getByUnitId(unitId, collDateStr)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            this.unit.set(result);
            if (result) {
              this.searchForm.patchValue({
                collDate: result.collDate,
                checkInDate: result.receivedDate,
              });
              this.loadComponents(result.unitId, result.collDate);
            } else {
              this.components.set([]);
              this.snackbar.showError('Unit not found.');
            }
            this.loading.set(false);
          },
          error: (err) => {
            this.loading.set(false);
            const msg = err?.error?.message ?? err?.error?.Message ?? 'Error retrieving unit.';
            this.snackbar.showError(msg);
          },
        });
    } else if (osUnit) {
      const checkInDate = this.searchForm.get('checkInDate')?.value;
      const receivedDateStr = checkInDate
        ? this.datePipe.transform(checkInDate, 'yyyy-MM-dd') ?? undefined
        : undefined;

      this.service
        .getByOsUnitId(osUnit, receivedDateStr)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (results) => {
            if (results.length === 1) {
              this.unit.set(results[0]);
              this.searchForm.patchValue({
                unitId: results[0].unitId,
                collDate: results[0].collDate,
                checkInDate: results[0].receivedDate,
              });
              this.loadComponents(results[0].unitId, results[0].collDate);
            } else if (results.length > 1) {
              this.unit.set(results[0]);
              this.searchForm.patchValue({
                unitId: results[0].unitId,
                collDate: results[0].collDate,
              });
              this.loadComponents(results[0].unitId, results[0].collDate);
              this.snackbar.showInfo(
                `Found ${results.length} units matching OS Unit ID. Showing the most recent.`,
              );
            } else {
              this.unit.set(null);
              this.components.set([]);
              this.snackbar.showError('No units found for the specified OS Unit ID.');
            }
            this.loading.set(false);
          },
          error: (err) => {
            this.loading.set(false);
            const msg = err?.error?.message ?? err?.error?.Message ?? 'Error retrieving units.';
            this.snackbar.showError(msg);
          },
        });
    }
  }

  protected clearAll(): void {
    this.searchForm.reset();
    this.unitIdField?.clear();
    this.unit.set(null);
    this.components.set([]);
    this.hasQueried.set(false);
    this.selectedComponent.set(null);
  }

  protected readonly activePanelAction = signal<string | null>(null);

  protected readonly panelRecord = computed<UnitQueryPanelRecord | null>(() => {
    const u = this.unit();
    if (!u) return null;
    return {
      unitId: u.unitId,
      collDate: u.collDate,
      chapterId: u.chapterId,
      unitSchemeType: u.unitSchemeType,
      noteId: u.noteId,
    };
  });

  protected readonly componentPanelRecord = computed(() => {
    const u = this.unit();
    const c = this.selectedComponent();
    if (!u) return null;
    return {
      unitId: u.unitId,
      collDate: u.collDate,
      chapterId: u.chapterId,
      productCode: c?.productCode ?? null,
    };
  });

  protected onComponentRowClick(row: ComponentResult): void {
    if (this.selectedComponent()?.productCode === row.productCode &&
        this.selectedComponent()?.componentPrefix === row.componentPrefix) {
      this.selectedComponent.set(null);
    } else {
      this.selectedComponent.set(row);
    }
  }

  private readonly panelTitleMap: Record<string, string> = {
    unitTestDetails: 'Unit Test Details',
    attributesAndInterdictions: 'Attributes and Interdictions',
    unitNotes: 'Unit Notes',
    componentNotes: 'Component Notes',
    freezeDetails: 'Freeze Details',
    separationTime: 'Separation Time',
    addedBags: 'Added Bags',
    equipmentSupply: 'Equipment and Supply Details',
    pathogenReduction: 'Pathogen Reduction',
  };

  protected readonly activePanelTitle = computed(() => {
    const action = this.activePanelAction();
    return action ? this.panelTitleMap[action] ?? '' : '';
  });

  protected onQuickLinkClick(link: QuickLink): void {
    if (!link.enabled) {
      if (link.action === 'unitTestDetails' && this.mode() === 'REGULAR') {
        this.snackbar.showError('Test details are not accessible in Unit Query mode. Use Unit Information instead.');
      }
      return;
    }

    const unitId = this.unit()?.unitId;
    const queryParams = unitId ? { unitId } : {};

    switch (link.action) {
      case 'productHistory':
        this.router.navigate(['product-history'], { relativeTo: this.route, queryParams });
        break;
      case 'antigens':
        this.router.navigate(['antigens'], { relativeTo: this.route, queryParams });
        break;
      case 'documents':
        this.router.navigate(['documents'], {
          relativeTo: this.route,
          queryParams: unitId ? { linkedValue: unitId } : {},
        });
        break;
      case 'componentDetails':
        this.router.navigate(['component-query'], { relativeTo: this.route, queryParams });
        break;
      case 'componentNotes':
      case 'freezeDetails':
      case 'pathogenReduction':
        if (!this.selectedComponent()) {
          this.snackbar.showError('Please select a component row first.');
          return;
        }
        this.activePanelAction.set(link.action);
        break;
      default:
        this.activePanelAction.set(link.action);
        break;
    }
  }

  protected closeSidePanel(): void {
    this.activePanelAction.set(null);
  }

  protected formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '--';
    try {
      return this.datePipe.transform(dateStr, 'dd-MMM-yyyy') ?? '--';
    } catch {
      return '--';
    }
  }

  protected formatDateTime(dateStr: string | null | undefined): string {
    if (!dateStr) return '--';
    try {
      return this.datePipe.transform(dateStr, 'dd-MMM-yyyy, hh:mm a') ?? '--';
    } catch {
      return '--';
    }
  }

  protected formatFlagDate(flag: string | null | undefined, dateStr: string | null | undefined): string {
    const flagDisplay = flag === 'Y' ? 'Yes' : flag === 'N' ? 'No' : flag ?? '--';
    const dateDisplay = this.formatDate(dateStr);
    return dateDisplay !== '--' ? `${flagDisplay}, ${dateDisplay}` : flagDisplay;
  }

  protected formatNursingStatus(status: string | null | undefined): string {
    if (!status) return '--';
    switch (status.toUpperCase()) {
      case 'O': return 'OK';
      case 'P': return 'Problem';
      case 'N': return 'Not Checked';
      case 'H': return 'Hold';
      default: return status;
    }
  }

  protected formatAuditFlag(flag: string | null | undefined): string {
    if (!flag) return '--';
    return flag === 'Y' ? 'Yes' : flag === 'N' ? 'No' : flag;
  }

  protected formatTubeFlag(flag: string | null | undefined): string {
    if (!flag) return '-';
    return flag;
  }

  private loadComponents(unitId: string, collDate: string): void {
    const collDateStr = this.datePipe.transform(collDate, 'yyyy-MM-dd') ?? collDate;
    this.service
      .getComponents(unitId, collDateStr)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (comps) => {
          const mapped = comps.map((c) => ({
            ...c,
            interdictionAttr:
              c.hasAttributes && c.hasInterdictions
                ? 'Both'
                : c.hasAttributes
                  ? 'Attr'
                  : c.hasInterdictions
                    ? 'Inter'
                    : '--',
          }));
          this.components.set(mapped);
        },
        error: () => {
          this.components.set([]);
          this.snackbar.showError('Error loading components.');
        },
      });
  }
}
