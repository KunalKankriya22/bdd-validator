import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router } from '@angular/router';
import { AccessLevelService } from '../shared/services/access-level.service';

export const accessLevelGuard: CanActivateFn = (route) => {
  const accessLevelService = inject(AccessLevelService);
  const router = inject(Router);

  const requiredLevel = route.data?.['requiredAccessLevel'] as number | undefined;

  if (requiredLevel === undefined || requiredLevel === null) {
    return true;
  }

  if (accessLevelService.canAccess(requiredLevel)) {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};

export const accessLevelChildGuard: CanActivateChildFn = (_route, state) => {
  const accessLevelService = inject(AccessLevelService);
  const router = inject(Router);

  if (!accessLevelService.isLoaded()) {
    return true;
  }

  if (accessLevelService.canAccessRoute(state.url)) {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};
