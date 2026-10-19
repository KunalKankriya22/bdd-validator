import { Routes } from '@angular/router';
import { ROUTE_REGISTRY } from '../../core/constants/route-registry';
import { RouteKey } from '../../core/constants/route-keys';
import { removePathPrefix } from '../../core/utils/route-utils';

/**
 * APIs & Integration Routes
 * All routes are dynamically configured from ROUTE_REGISTRY
 * to support backend-driven menu system
 *
 * Pre-compute paths as constants to avoid runtime evaluation issues on page refresh
 */

// Pre-compute Lab API Interface paths
const LAB_API_PREFIX = '/apis-integration/lab-api-interfaces/';
const manualDonorInterfacePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ManualDonorInterface].path,
  LAB_API_PREFIX
);
const uploadTestResultsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.UploadTestResultsFromOutsideSource].path,
  LAB_API_PREFIX
);
const instrumentInterfaceApiManagerPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.InstrumentInterfaceApiManager].path,
  LAB_API_PREFIX
);
const apiTestSchedulingPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ApiTestSchedulingByMachineId].path,
  LAB_API_PREFIX
);
const driveInterfacePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DriveInterfaceDonorLab].path,
  LAB_API_PREFIX
);
const voidDonorInterfacePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.VoidDonorInterface].path,
  LAB_API_PREFIX
);
const reInterfaceDonorToLabPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ReInterfaceDonorToLab].path,
  LAB_API_PREFIX
);

// Pre-compute Common API Interface paths
const COMMON_API_PREFIX = '/apis-integration/common-api-interfaces/';
const apiLogQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ApiLogQuery].path,
  COMMON_API_PREFIX
);
const apiTempDataQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ApiTempDataQuery].path,
  COMMON_API_PREFIX
);
const externalBcDataTranslatePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ExternalBcDataTranslate].path,
  COMMON_API_PREFIX
);

// Pre-compute Vista Interface Status path
const APIS_INTEGRATION_PREFIX = '/apis-integration/';
const vistaInterfaceStatusPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.VistaInterfaceStatus].path,
  APIS_INTEGRATION_PREFIX
);

export const APIS_AND_INTEGRATION_ROUTES: Routes = [
  { path: '', redirectTo: 'lab-api-interfaces', pathMatch: 'full' },

  // Lab API Interfaces
  {
    path: 'lab-api-interfaces',
    children: [
      {
        path: '',
        redirectTo: manualDonorInterfacePath,
        pathMatch: 'full'
      },
      {
        path: manualDonorInterfacePath,
        loadComponent: ROUTE_REGISTRY[RouteKey.ManualDonorInterface].loadComponent,
      },
      {
        path: uploadTestResultsPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.UploadTestResultsFromOutsideSource].loadComponent,
      },
      {
        path: instrumentInterfaceApiManagerPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.InstrumentInterfaceApiManager].loadComponent,
      },
      {
        path: apiTestSchedulingPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.ApiTestSchedulingByMachineId].loadComponent,
      },
      {
        path: driveInterfacePath,
        loadComponent: ROUTE_REGISTRY[RouteKey.DriveInterfaceDonorLab].loadComponent,
      },
      {
        path: voidDonorInterfacePath,
        loadComponent: ROUTE_REGISTRY[RouteKey.VoidDonorInterface].loadComponent,
      },
      {
        path: reInterfaceDonorToLabPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.ReInterfaceDonorToLab].loadComponent,
      }
    ]
  },

  // Common API Interfaces
  {
    path: 'common-api-interfaces',
    children: [
      {
        path: '',
        redirectTo: apiLogQueryPath,
        pathMatch: 'full'
      },
      {
        path: apiLogQueryPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.ApiLogQuery].loadComponent,
      },
      {
        path: apiTempDataQueryPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.ApiTempDataQuery].loadComponent,
      },
      {
        path: externalBcDataTranslatePath,
        loadComponent: ROUTE_REGISTRY[RouteKey.ExternalBcDataTranslate].loadComponent,
      }
    ]
  },

  // Vista Interface Status (top-level route)
  {
    path: vistaInterfaceStatusPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.VistaInterfaceStatus].loadComponent,
  }
];
