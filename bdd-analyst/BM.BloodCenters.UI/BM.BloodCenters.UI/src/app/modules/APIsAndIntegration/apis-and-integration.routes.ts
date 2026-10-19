import { Routes } from '@angular/router';
import { ROUTE_REGISTRY } from '../../core/constants/route-registry';
import { RouteKey } from '../../core/constants/route-keys';
import { removePathPrefix } from '../../core/utils/route-utils';

// Lab API Interfaces routes
const manualDonorInterfacePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ManualDonorInterface].path,
  '/apis-integration/lab-api-interfaces'
);

const uploadTestResultsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.UploadTestResultsFromOutsideSource].path,
  '/apis-integration/lab-api-interfaces'
);

const apiTestSchedulingByMachineIdPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ApiTestSchedulingByMachineId].path,
  '/apis-integration/lab-api-interfaces'
);

const driveInterfaceDonorLabPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DriveInterfaceDonorLab].path,
  '/apis-integration/lab-api-interfaces'
);

// Common API Interfaces routes
const apiLogQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ApiLogQuery].path,
  '/apis-integration/common-api-interfaces'
);

const apiTempDataQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ApiTempDataQuery].path,
  '/apis-integration/common-api-interfaces'
);

export const APIS_AND_INTEGRATION_ROUTES: Routes = [
  { path: '', redirectTo: 'lab-api-interfaces', pathMatch: 'full' },

  {
    path: 'lab-api-interfaces',
    children: [
      { path: '', redirectTo: 'manual-donor-interface', pathMatch: 'full' },
      {
        path: manualDonorInterfacePath,
        loadComponent: ROUTE_REGISTRY[RouteKey.ManualDonorInterface].loadComponent
      },
      {
        path: uploadTestResultsPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.UploadTestResultsFromOutsideSource].loadComponent
      },
      {
        path: apiTestSchedulingByMachineIdPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.ApiTestSchedulingByMachineId].loadComponent
      },
      {
        path: driveInterfaceDonorLabPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.DriveInterfaceDonorLab].loadComponent
      }
    ]
  },
  {
    path: 'common-api-interfaces',
    children: [
      {
        path: apiLogQueryPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.ApiLogQuery].loadComponent
      },
      {
        path: apiTempDataQueryPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.ApiTempDataQuery].loadComponent
      }
    ]
  }
];
