import { Component, OnInit, ViewChild, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { ConfigurationFormComponent } from './configuration-form/configuration-form.component';
import { ConfigurationSummaryComponent } from './configuration-summary/configuration-summary.component';
import { UnitEntryFormComponent } from './unit-entry-form/unit-entry-form.component';
import { DerivedProductsTableComponent } from './derived-products-table/derived-products-table.component';
import { SterileDockingDefinitionService } from './services/sterile-docking-definition.service';
import { SterileDockingLovService } from './services/sterile-docking-lov.service';
import {
  DockingConfigurationDto,
  DockingConfigurationComplete,
  DockingType,
  UnitEntryDto,
  DerivedProductDto,
  ProductCodeLovOption
} from './models/sterile-docking-definition.model';
import { MenuService } from '@shared/services/menu.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { RouteKey } from '@core/constants/route-keys';
import { ROUTES } from '@core/constants/route.constants';

type WorkflowPhase = 'configuration' | 'unit-entry' | 'results';

@Component({
  selector: 'app-sterile-docking-definition',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    ConfigurationFormComponent,
    ConfigurationSummaryComponent,
    UnitEntryFormComponent,
    DerivedProductsTableComponent
  ],
  templateUrl: './sterile-docking-definition.component.html',
  styleUrl: './sterile-docking-definition.component.scss'
})
export class SterileDockingDefinitionComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly snackbarService = inject(SnackbarService);
  private readonly service = inject(SterileDockingDefinitionService);
  private readonly lovService = inject(SterileDockingLovService);
  private readonly menuService = inject(MenuService);

  @ViewChild(UnitEntryFormComponent) private unitEntryForm?: UnitEntryFormComponent;

  private productCodesCache: ProductCodeLovOption[] = [];

  // Workflow state
  currentPhase = signal<WorkflowPhase>('configuration');

  // Session data
  configuration = signal<DockingConfigurationComplete | null>(null);
  derivedProducts = signal<DerivedProductDto[]>([]);
  worksheetId = signal<string | null>(null);

  // Units saved via API (tracked for display and limit enforcement)
  enteredUnits = signal<UnitEntryDto[]>([]);

  // UI state
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  reprintEligible = signal(false);
  derivedProductError = signal<string | null>(null);

  existingUnitIds = computed(() => this.enteredUnits().map(u => u.unitId));

  showReprintLabel = computed(() => {
    const dockingType = this.configuration()?.itemInd;
    return dockingType === DockingType.FB || dockingType === DockingType.BF;
  });

  lastDerivedProduct = computed(() => {
    const products = this.derivedProducts();
    return products.length > 0 ? products[products.length - 1].derivedProduct : undefined;
  });

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/' },
      { label: 'Laboratory Functions', link: '/laboratory-functions' },
      { label: 'Component Production', link: '/laboratory-functions/component-production' },
      { label: 'Component Modification', link: null },
      { label: 'Sterile Docking Definition', link: null }
    ],
    title: 'Sterile Docking Definition',
    subtitle: ''
  };

  constructor() {
    // Load subtitle from menu-items API
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.SterileDockingDefinition].path;
        const menuItem = this.menuService.findMenuItemByPath(basePath);

        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: ROUTES.HOME },
              { label: menuItem.label, link: null }
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || menuItem.subtitle || ''
          };
        }
      }
    });
  }

  ngOnInit(): void {
    this.lovService.getProductCodes().subscribe(codes => {
      this.productCodesCache = codes;
    });
  }

  private getShortName(productCode: string): string {
    const match = this.productCodesCache.find(p => p.code === productCode);
    return match?.shortName || match?.description || '';
  }

  onConfigurationComplete(event: { configData: any; formData: any }): void {
    console.log('[SterileDockingDefinitionComponent] onConfigurationComplete() called');
    console.log('[SterileDockingDefinitionComponent] Configuration data received:', event.configData);
    console.log('[SterileDockingDefinitionComponent] Form data received:', event.formData);

    // Store configuration in memory ONLY (no database save yet)
    const completeConfig: DockingConfigurationComplete = {
      chapterId: event.configData.chapterId,
      collDate: event.configData.collDate,
      itemInd: event.configData.dockingType,
      description: event.configData.description,
      sterileMachine: event.configData.sterileMachine,
      waferLotNumber: event.configData.waferLotNumber,
      bagCatalogNumber: event.configData.bagCatalogNumber,
      lotNumber: event.configData.lotNumber,
      filterType: event.configData.filterType,
      filterLotNumber: event.configData.filterLotNumber,
      numberOfItems: event.configData.numberOfItems,
      numberOfComponents: event.configData.numberOfComponents,
      attributeCode: event.configData.attributeCode,
      attribCode: event.configData.attribCode,
      attribGroup: event.configData.attribGroup,
      attributeDescription: event.configData.attributeDescription,
      processDate: event.configData.processDate,
      processDateDisplay: event.configData.processDateDisplay,
      segmentRemFlag: event.configData.segmentRemFlag,
      segmentNumber: event.configData.segmentNumber,
      productType: event.configData.productType,
      weldFlag: 'Y',
      programId: 'CPISDDFN'
    };

    this.configuration.set(completeConfig);

    // Move to unit-entry phase (no API call)
    this.currentPhase.set('unit-entry');

    console.log('[SterileDockingDefinitionComponent] Configuration stored in memory, moving to unit-entry phase');

    this.snackbarService.showSuccess('Configuration complete. Please scan or enter unit IDs...');
  }

  onUnitAdded(unitEntry: UnitEntryDto): void {
    const config = this.configuration();
    if (!config) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const dto = this.buildUnitDto(config, unitEntry, this.worksheetId() || undefined);

    this.service.create(dto).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);

        const responseData = response.item || response.data || response.Item || response;

        if (!this.worksheetId()) {
          const wsId = responseData?.sdcWsNumber || responseData?.SdcWsNumber || responseData?.SDC_WS_NUMBER;
          if (wsId) {
            this.worksheetId.set(wsId);
          }
        }

        this.enteredUnits.update(units => [...units, unitEntry]);

        const derivedProduct: DerivedProductDto = {
          id: responseData?.id || `${Date.now()}`,
          unitId: unitEntry.unitId,
          originalProductCode: unitEntry.originalProductCode,
          derivedProduct: responseData?.derivedProduct || responseData?.DerivedProduct || unitEntry.originalProductCode,
          shortName: responseData?.productShortName || responseData?.ProductShortName || this.getShortName(unitEntry.originalProductCode),
          weldOk: unitEntry.weldOk,
          verifyProduct: unitEntry.verifyProduct
        };

        this.derivedProducts.update(products => [...products, derivedProduct]);

        const unitCount = this.enteredUnits().length;
        const maxUnits = config.numberOfItems || 0;
        const countLabel = maxUnits > 0 ? ` (${unitCount}/${maxUnits})` : '';

        this.snackbarService.showSuccess(`Unit saved${countLabel}`);

        this.unitEntryForm?.resetFormForNextEntry();
      },
      error: (error) => {
        this.isLoading.set(false);
        const errorBody = error.error;
        const errorCode = errorBody?.errorCode || '';
        const msg = errorBody?.message || 'Failed to save unit';
        const displayMsg = errorCode ? `[${errorCode}] ${msg}` : msg;
        this.errorMessage.set(displayMsg);
        this.snackbarService.showError(displayMsg);

        this.unitEntryForm?.onSaveError();
      }
    });
  }

  onRemoveProduct(unitId: string): void {
    this.derivedProducts.update(products => products.filter(p => p.unitId !== unitId));
    this.enteredUnits.update(units => units.filter(u => u.unitId !== unitId));
    this.snackbarService.showSuccess('Unit removed');
  }

  onClearAll(): void {
    this.resetState();
  }

  onCancel(): void {
    if (this.currentPhase() === 'configuration') {
      this.router.navigate(['/laboratory-functions']);
    } else {
      this.resetState();
    }
  }

  onReprintEligibleChange(eligible: boolean): void {
    this.reprintEligible.set(eligible);
  }

  onDerivedProductErrorChange(error: string | null): void {
    this.derivedProductError.set(error);
  }

  onReprintLabels(): void {
    if (this.enteredUnits().length === 0) {
      this.snackbarService.showError('No units to print labels for');
      return;
    }

    // TODO: Call label reprint API when available
    this.snackbarService.showSuccess(
      `Label reprint queued for ${this.enteredUnits().length} unit(s) (Worksheet: ${this.worksheetId()})`
    );
  }

  private buildUnitDto(
    config: DockingConfigurationComplete,
    unit: UnitEntryDto,
    sdcWsNumber?: string
  ): DockingConfigurationDto {
    return {
      ...(sdcWsNumber && { sdcWsNumber }),
      unitId: unit.unitId,
      chapterId: config.chapterId!,
      collDate: config.collDate!,
      itemInd: config.itemInd!,
      sterileMachine: config.sterileMachine,
      waferLotNumber: config.waferLotNumber,
      lotNumber: config.lotNumber,
      numberOfItems: config.numberOfItems,
      weldFlag: unit.weldOk,
      productCode: unit.originalProductCode,
      programId: config.programId,
      catalogNumber: config.bagCatalogNumber || config.catalogNumber,
      filterType: config.filterType,
      filterLotNumber: config.filterLotNumber,
      attribCode: config.attributeCode || config.attribCode,
      processDate: config.processDate,
      numberOfUnitsEntered: config.numberOfItems,
      numberOfBags: config.numberOfComponents || config.numberOfBags,
      oldProductCode: unit.originalProductCode,
      segmentRemFlag: config.segmentRemFlag,
      segmentNumber: config.segmentNumber
    };
  }

  private resetState(): void {
    this.configuration.set(null);
    this.derivedProducts.set([]);
    this.worksheetId.set(null);
    this.enteredUnits.set([]);
    this.isLoading.set(false);
    this.errorMessage.set(null);
    this.derivedProductError.set(null);
    this.reprintEligible.set(false);
    this.productCodesCache = [];
    this.lovService.clearCache();
    this.currentPhase.set('configuration');
  }
}
