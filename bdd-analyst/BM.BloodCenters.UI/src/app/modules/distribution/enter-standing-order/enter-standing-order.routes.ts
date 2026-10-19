import { Routes } from '@angular/router';

export const ENTER_STANDING_ORDER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/standing-order-list/standing-order-list').then(
        (m) => m.StandingOrderListComponent
      )
  },
  {
    path: 'items/:contractId/:consigneeId/:weekDay',
    loadComponent: () =>
      import('./components/standing-order-item-list/standing-order-item-list').then(
        (m) => m.StandingOrderItemListComponent
      )
  }
];
