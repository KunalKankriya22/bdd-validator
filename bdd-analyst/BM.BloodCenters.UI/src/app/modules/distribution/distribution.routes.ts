import { Routes } from '@angular/router';
import { packLabDiscardsGuard } from './pack-lab-discards/pack-lab-discards.guard';

export const DISTRIBUTION_ROUTES: Routes = [
  {
    path: 'box-details',
    loadChildren: () =>
      import('./box-details/box-details.routes').then((m) => m.BOX_DETAILS_ROUTES),
  },
  {
    path: 'rack-definition',
    loadComponent: () =>
      import('./rack-definition/rack-definition').then((m) => m.RackDefinitionComponent),
  },
  {
    path: 'customer-debit-credit/debit-credit-query',
    loadComponent: () => import('./customer-debit-credit-query/debit-credit-query').then(m => m.DebitCreditQuery)
  },
  {
    path: 'storage-device-details',
    loadComponent: () =>
      import('./storage-device-details/storage-device-details').then(
        (m) => m.StorageDeviceDetailsComponent,
      ),
  },
  {
    path: 'lab-batch-transfer',
    loadComponent: () =>
      import('./lab-batch-transfer/lab-batch-transfer').then((m) => m.LabBatchTransferComponent),
  },
  {
    path: 'product-storage-definition',
    loadComponent: () => import('./product-storage-definition/product-storage-definition').then(m => m.ProductStorageDefinitionComponent)
  },
  {
    path: 'packrp',
    loadComponent: () => import('./packrp/pack-recovered-plasma').then(m => m.PackRecoveredPlasmaComponent)
  },
  {
    path: 'regenerate-electronic-plasma-file',
    loadComponent: () => import('./regenerate-electronic-plasma-file/regenerate-electronic-plasma-file').then(m => m.RegenerateElectronicPlasmaFileComponent)
  },
  {
    path: 'cancel-unfilled-orders',
    loadComponent: () => import('./cancel-unfilled-orders/cancel-unfilled-orders').then(m => m.CancelUnfilledOrdersComponent)
  },
  {
    path: 'ship-products',
    loadComponent: () => import('./ship-products/ship-products').then(m => m.ShipProductsComponent)
  },
  {
    path: 'ship-discard-salvage',
    loadComponent: () => import('./ship-discard-salvage/ship-discard-salvage').then(m => m.ShipDiscardSalvageComponent)
  },
  {
    path: 'pack-lab-discards',
    loadComponent: () => import('./pack-lab-discards/pack-lab-discards.component').then(m => m.PackLabDiscardsComponent),
    canDeactivate: [packLabDiscardsGuard],
    data: { discardOption: 'DI', headerTitle: 'Pack Lab Discards to Discard' }
  },
  {
    path: 'pack-lab-discards-to-salvage',
    loadComponent: () => import('./pack-lab-discards/pack-lab-discards.component').then(m => m.PackLabDiscardsComponent),
    canDeactivate: [packLabDiscardsGuard],
    data: { discardOption: 'RD', headerTitle: 'Pack Lab Discards to Salvage' }
  },
  {
    path: 'close-box',
    loadComponent: () => import('./close-box/close-box').then(m => m.CloseBoxComponent)
  },
  {
    path: 'delivered-shipments',
    loadComponent: () => import('./delivered-shipments/delivered-shipments').then(m => m.DeliveredShipmentsComponent)
  },
  {
    path: 'order-charges-by-order-no',
    loadComponent: () => import('./order-charges-by-order-no/order-charges-by-order-no').then(m => m.OrderChargesByOrderNoComponent),
    children: [
      {
        path: 'order-details/:orderNo',
        loadComponent: () => import('./order-charges-by-order-no/order-details-page/order-details-page').then(m => m.OrderDetailsPageComponent)
      }
    ]
  },
  {
    path: 'enter-standing-order',
    loadChildren: () => import('./enter-standing-order/enter-standing-order.routes').then(m => m.ENTER_STANDING_ORDER_ROUTES)
  },
  {
    path: 'transport-batch-query',
    loadComponent: () =>
      import('./transport-batch-query/transport-batch-query').then(
        (m) => m.TransportBatchQuery,
      ),
  },
  {
    path: 'oeqpdord',
    loadComponent: () => import('./ocq/ocq').then(m => m.OcqComponent)
  },
  {
    path: 'inventory-management/inventory-queries/available-products-query',
    loadComponent: () =>
      import(
        './inventory-management/inventory-queries/available-products-query/available-products-query'
      ).then((m) => m.AvailableProductsQuery),
  },
  {
    path: 'offline-product-packing',
    loadComponent: () =>
      import('./offline-product-packing/offline-product-packing').then(
        (m) => m.OfflineProductPackingComponent,
      ),
  },
  {
    path: 'schedule-auto-directed-order',
    loadComponent: () =>
      import('./schedule-auto-directed-order/schedule-auto-directed-order').then(
        (m) => m.ScheduleAutoDirectedOrderComponent,
      ),
  },
  {
    path: 'shipments-by-ship-date',
    loadComponent: () =>
      import('./distribution-module/distribution-queries/shipments-by-ship-date/shipments-by-ship-date').then(
        (m) => m.ShipmentsByShipDateComponent,
      ),
  },
  {
    path: 'xml-error-log-file',
    loadComponent: () =>
      import('./distribution-module/shipping-functions/xml-error-log-file/xml-error-log-file').then(
        (m) => m.XmlErrorLogFileComponent,
      ),
  },
];
