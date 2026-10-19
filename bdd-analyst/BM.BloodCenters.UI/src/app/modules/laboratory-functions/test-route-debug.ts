import { ROUTE_REGISTRY } from '../../core/constants/route-registry';
import { RouteKey } from '../../core/constants/route-keys';
import { removePathPrefix } from '../../core/utils/route-utils';

const path = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.PlaceReleaseMultipleUnitInterdiction].path,
  '/laboratory-functions'
);

console.log('🔍 Route Debug:');
console.log('RouteKey:', RouteKey.PlaceReleaseMultipleUnitInterdiction);
console.log('Full path from registry:', ROUTE_REGISTRY[RouteKey.PlaceReleaseMultipleUnitInterdiction].path);
console.log('Path after removePathPrefix:', path);
console.log('LoadComponent function exists:', !!ROUTE_REGISTRY[RouteKey.PlaceReleaseMultipleUnitInterdiction].loadComponent);
