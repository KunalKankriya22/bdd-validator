import { CanDeactivateFn } from '@angular/router';
import { EnterExportOrderComponent } from './enter-export-order';

export const enterExportOrderGuard: CanDeactivateFn<EnterExportOrderComponent> = (component) => {
  return component.canDeactivate();
};
