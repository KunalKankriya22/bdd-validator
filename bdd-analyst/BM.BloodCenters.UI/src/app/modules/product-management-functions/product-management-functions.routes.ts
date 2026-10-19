import { Routes } from '@angular/router';
import { AntigenPricingMatrixComponent } from './internal-administration/antigen-pricing-matrix/antigen-pricing-matrix.component';
import { ROUTE_REGISTRY } from '../../core/constants/route-registry';
import { RouteKey } from '../../core/constants/route-keys';
import { removePathPrefix } from '../../core/utils/route-utils';

const trayDefinitionPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.TrayDefinition].path,
  '/product-management-functions/inventory-management'
);

export const PRODUCT_MANAGEMENT_FUNCTIONS_ROUTES: Routes = [
  { path: '', redirectTo: 'internal-administration', pathMatch: 'full' },

  {
    path: 'internal-administration',
    children: [
      {
        path: 'antigen-pricing-matrix',
        component: AntigenPricingMatrixComponent,
      },
      {
        path: 'rchkin',
        loadComponent: ROUTE_REGISTRY[RouteKey.ReleaseReturnedProductQuarantine].loadComponent,
      },
    ],
  },

  {
    path: 'customer-&-internal-administration/internal-administration',
    children: [
      {
        path: 'enter-product-service-codes',
        loadComponent: () =>
          import('./internal-administration/enter-product-service-codes/enter-product-service-codes.component').then(
            (m) => m.EnterProductServiceCodesComponent
          ),
      },
      {
        path: 'setup-inventory-levels-for-blood-center',
        loadComponent: () =>
          import('./internal-administration/setup-inventory-levels-for-blood-center/setup-inventory-levels-for-blood-center').then(
            (m) => m.SetupInventoryLevelsForBloodCenterComponent
          ),
      },
      {
        path: 'enter-standard-tier-pricing',
        loadComponent: () =>
          import('./standard-tier-pricing/enter-standard-tier-pricing.component').then(
            (m) => m.EnterStandardTierPricingComponent
          ),
      },
      {
        path: 'ltrcnfws',
        loadComponent: ROUTE_REGISTRY[RouteKey.EnterAttributeServiceCodes].loadComponent,
      },
    ],
  },

  {
    path: 'inventory-management',
    children: [
      {
        path: 'reject-inventory-products',
        loadComponent: () =>
          import('./inventory-management/reject-inventory-products/reject-inventory-products').then(
            (m) => m.RejectInventoryProducts
          ),
      },
      {
        path: 'pack-inv-rejects-to-salvage',
        loadComponent: () =>
          import('./inventory-management/pack-inv-rejects-to-salvage/pack-inv-rejects-to-salvage').then(
            (m) => m.PackInvRejectsToSalvageComponent
          ),
      },
      {
        path: 'restock-unshipped-products',
        loadComponent: () =>
          import('./inventory-management/restock-unshipped-products/restock-unshipped-products').then(
            (m) => m.RestockUnshippedProducts
          ),
      },
      {
        path: 'odtoff',
        loadComponent: ROUTE_REGISTRY[RouteKey.RemovalFromOutdateList].loadComponent,
      },
      {
        path: 'inventory-queries/products-with-antigens',
        loadComponent: ROUTE_REGISTRY[RouteKey.ProductsWithAntigens].loadComponent,
      },
      {
        path: 'checkin-discard-products',
        loadComponent: () =>
          import('./inventory-management/checkin-discard-products/checkin-discard-products').then(
            (m) => m.CheckinDiscardProducts
          ),
      },
      {
        path: 'product-current-status',
        loadComponent: () =>
          import('./inventory-management/product-current-status/product-current-status').then(
            (m) => m.ProductCurrentStatusComponent
          ),
      },
      {
        path: trayDefinitionPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.TrayDefinition].loadComponent,
      },
      {
        path: 'warehouse-checkin',
        loadComponent: ROUTE_REGISTRY[RouteKey.WarehouseCheckIn].loadComponent,
      },
      {
        path: 'warehouse-check-out',
        loadComponent: ROUTE_REGISTRY[RouteKey.WarehouseCheckOut].loadComponent,
      },
      {
        path: 'inventory-queries/unit-and-product-history',
        loadComponent: ROUTE_REGISTRY[RouteKey.UnitAndProductHistory].loadComponent,
      },
      {
        path: 'inventory-queries/quq',
        loadComponent: ROUTE_REGISTRY[RouteKey.ProductsInQuarantine].loadComponent,
      },
      {
        path: 'special-order-allocation',
        loadComponent: ROUTE_REGISTRY[RouteKey.SpecialOrderAllocation].loadComponent,
      },
      {
        path: 'special-order-allocation/matching-products',
        loadComponent: ROUTE_REGISTRY[RouteKey.MatchingProductsFound].loadComponent,
      },
    ],
  },

  {
    path: 'customer-&-internal-administration/customer-administration',
    children: [
      {
        path: 'customer-consignee-product-details',
        loadComponent: () =>
          import('./customer-administration/customer-consignee-product-details/customer-consignee-product-details.component').then(
            (m) => m.CustomerConsigneeProductDetailsComponent
          ),
      },
      {
        path: 'enter-customer-tier-pricing',
        loadComponent: () =>
          import('./customer-administration/enter-customer-tier-pricing/enter-customer-tier-pricing.component').then(
            (m) => m.EnterCustomerTierPricingComponent
          ),
      },
      {
        path: 'cdcan',
        loadComponent: ROUTE_REGISTRY[RouteKey.CancelDebitCreditAdvice].loadComponent,
      },
      {
        path: 'customer-product-tier-pricing-query',
        loadComponent: ROUTE_REGISTRY[RouteKey.CustomerProductTierPricingQuery].loadComponent,
      },
      {
        path: 'create-customer-profile',
        loadComponent: () =>
          import('./customer-administration/customer-profile/customer-profile-list/customer-profile-list').then(
            (m) => m.CustomerProfileListComponent
          ),
      },
      {
        path: 'create-customer-profile/add',
        loadComponent: () =>
          import('./customer-administration/customer-profile/add-customer-wizard/add-customer-wizard').then(
            (m) => m.AddCustomerWizardComponent
          ),
      },
      {
        path: 'create-customer-profile/:customerId',
        loadComponent: () =>
          import('./customer-administration/customer-profile/customer-profile-details/customer-profile-details').then(
            (m) => m.CustomerProfileDetailsComponent
          ),
      },
    ],
  },

  {
    path: 'inventory-management',
    children: [
      {
        path: 'product-management',
        children: [
          {
            path: 'check-in-from-lab',
            loadComponent: ROUTE_REGISTRY[RouteKey.CheckInFromLab].loadComponent,
          },
          {
            path: 'move-outdates-to-outdate-location',
            loadComponent: ROUTE_REGISTRY[RouteKey.MoveOutdatesToOutdateLocation].loadComponent,
          },
          {
            path: 'unit-transfer-to-transfusion',
            loadComponent: ROUTE_REGISTRY[RouteKey.UnitTransferToTransfusionSystem].loadComponent,
          },
          {
            path: 'enter-product-attributes',
            loadComponent: ROUTE_REGISTRY[RouteKey.EnterProductAttributes].loadComponent,
          },
          {
            path: 'generate-outdates-picklist',
            loadComponent: () =>
              import('./inventory-management/generate-outdates-picklist/generate-outdates-picklist').then(
                (m) => m.GenerateOutdatesPicklist
              ),
          },
          {
            path: 'change-inventory-class',
            loadComponent: () =>
              import(
                './inventory-management/product-management/change-inventory-class/change-inventory-class'
              ).then((m) => m.ChangeInventoryClassComponent),
          },
          {
            path: 'interdicted-active-stock',
            loadComponent: ROUTE_REGISTRY[RouteKey.InterdictedActiveStock].loadComponent,
          },
        ],
      },
      {
        path: 'inventory-queries/find-units-and-products',
        loadComponent: ROUTE_REGISTRY[RouteKey.FindUnitsAndProducts].loadComponent,
      },
    ],
  },

  {
    path: 'customer-debit-credit',
    children: [
      {
        path: 'blood-product-credit',
        loadComponent: () =>
          import('./customer-debit-credit/blood-product-credit/blood-product-credit').then(
            (m) => m.BloodProductCredit
          ),
      },
      {
        // Mnemonic: CDSVC | FMB: CSISDBCR
        // Navigation: Product Management Functions => Customer Debit/Credit => Order and Services Debit/Credit
        path: 'order-services-debit-credit',
        loadComponent: () =>
          import('../distribution/order-services-debit-credit/order-services-debit-credit').then(
            (m) => m.OrderServicesDebitCreditComponent
          ),
      },
    ],
  },

  {
    path: 'offline-data-entry-functions',
    children: [
      {
        path: 'offline-product-check-in',
        loadComponent: ROUTE_REGISTRY[RouteKey.ChkOff].loadComponent,
      },
      {
        path: 'offline-product-shipment',
        loadComponent: ROUTE_REGISTRY[RouteKey.OfflineProductShipment].loadComponent,
      },
    ],
  },

  {
    path: 'order-management',
    children: [
      {
        path: 'enter-regular-order',
        loadComponent: () =>
          import('./order-management/enter-regular-order/enter-regular-order').then(
            (m) => m.EnterRegularOrderComponent
          ),
      },
      {
        path: 'enter-special-order',
        loadComponent: () =>
          import('./order-management/enter-special-order/enter-special-order').then(
            (m) => m.EnterSpecialOrderComponent
          ),
      },
      {
        path: 'enter-export-order',
        loadComponent: () =>
          import('./order-management/enter-export-order/enter-export-order').then(
            (m) => m.EnterExportOrderComponent
          ),
      },
    ],
  },

  {
    path: 'order-module/order-maintenance',
    children: [
      {
        path: 'change-or-cancel-order',
        loadComponent: () =>
          import('./order-management/change-cancel-order/change-cancel-order').then(
            (m) => m.ChangeCancelOrderComponent
          ),
      },
      {
        path: 'enter-order-charges',
        loadComponent: () =>
          import('./order-module/order-maintenance/enter-order-charges/enter-order-charges').then(
            (m) => m.EnterOrderChargesComponent
          ),
      },
    ],
  },

  {
    path: 'order-module/order-queries',
    children: [
      {
        path: 'standing-orders-query',
        loadComponent: () =>
          import('./order-queries/standing-orders-query/standing-orders-query').then(
            (m) => m.StandingOrdersQueryComponent
          ),
      },
      {
        path: 'finance-interface-details',
        loadComponent: () =>
          import('./order-queries/finance-interface-details/finance-interface-details').then(
            (m) => m.FinanceInterfaceDetailsComponent
          ),
      },
      {
        path: 'order-history---single-order',
        loadComponent: () =>
          import('./order-queries/order-history-single-order/order-history-single-order').then(
            (m) => m.OrderHistorySingleOrderComponent
          ),
      },
    ],
  },

  {
    path: 'inventory-management/product-management',
    children: [
      {
        path: 'release-product-quarantine',
        loadComponent: () =>
          import('./inventory-management/rusysint/release-product-quarantine.component').then(
            (m) => m.ReleaseProductQuarantineComponent
          ),
      },
      {
        path: 'place-product-quarantine',
        loadComponent: ROUTE_REGISTRY[RouteKey.PlaceProductQuarantine].loadComponent,
      },
    ],
  },

  {
    path: 'distribution-module',
    children: [
      {
        path: 'packing-functions',
        children: [
          {
            path: 'pack-products',
            loadComponent: ROUTE_REGISTRY[RouteKey.PackProduct].loadComponent,
          },
          {
            path: 'packod',
            loadComponent: ROUTE_REGISTRY[RouteKey.PackInvRejectsToDiscard].loadComponent,
          },
        ],
      },
    ],
  },

  {
    path: 'order-module',
    children: [
      {
        path: 'order-maintenance',
        children: [
          {
            path: 'release-standing-orders-batch',
            loadComponent: ROUTE_REGISTRY[RouteKey.ReleaseStandingOrdersBatch].loadComponent,
          },
        ],
      },
    ],
  },

  {
    path: 'order-management',
    children: [
      {
        path: 'order-processing-status',
        loadComponent: () =>
          import('./order-management/order-processing-status/order-processing-status').then(
            (m) => m.OrderProcessingStatusComponent
          ),
      },
    ],
  },

  {
    path: 'order-module/transfer-orders',
    children: [
      {
        path: 'initiate-hospital-transfer',
        loadComponent: () =>
          import('./order-module/transfer-orders/initiate-hospital-transfer/initiate-hospital-transfer').then(
            (m) => m.InitiateHospitalTransferComponent
          ),
      },
      {
        path: 'close-hospital-transfer',
        loadComponent: () =>
          import('./order-module/transfer-orders/close-hospital-transfer/close-hospital-transfer').then(
            (m) => m.CloseHospitalTransferComponent
          ),
      },
    ],
  },

  {
    path: 'distribution-module/distribution-queries/shipments-in-transit',
    loadComponent: () =>
      import(
        '../distribution/distribution-module/distribution-queries/shipments-in-transit/shipments-in-transit'
      ).then((m) => m.ShipmentsInTransitComponent),
  },
  {
    path: 'distribution-module/distribution-queries/shipments-by-ship-date',
    loadComponent: () =>
      import(
        '../distribution/distribution-module/distribution-queries/shipments-by-ship-date/shipments-by-ship-date'
      ).then((m) => m.ShipmentsByShipDateComponent),
  },
  {
    path: 'distribution-module/shipping-functions/xml-error-log-file',
    loadComponent: () =>
      import(
        '../distribution/distribution-module/shipping-functions/xml-error-log-file/xml-error-log-file'
      ).then((m) => m.XmlErrorLogFileComponent),
  },
  {
    path: 'distribution-module/shipping-functions/delivery-confirmation',
    loadComponent: () =>
      import(
        './internal-administration/delivery-confirmation/delivery-confirmation'
      ).then((m) => m.DeliveryConfirmation),
  },
];
