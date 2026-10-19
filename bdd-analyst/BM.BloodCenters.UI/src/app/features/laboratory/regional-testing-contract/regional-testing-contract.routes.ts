import { Routes } from '@angular/router';

/**
 * Regional Testing Contract Routes
 *
 * Routes:
 * - /laboratory/regional-testing-contract → Contract List
 * - /laboratory/regional-testing-contract/create → Create New Contract
 * - /laboratory/regional-testing-contract/edit/:contractId → Edit Existing Contract
 */
export const REGIONAL_TESTING_CONTRACT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/contract-list/contract-list.component').then(m => m.ContractListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./components/contract-form/contract-form.component').then(m => m.ContractFormComponent)
  },
  {
    path: 'edit/:contractId',
    loadComponent: () => import('./components/contract-form/contract-form.component').then(m => m.ContractFormComponent)
  }
];
