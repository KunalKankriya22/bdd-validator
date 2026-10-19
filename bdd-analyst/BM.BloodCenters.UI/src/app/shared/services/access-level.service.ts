import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AccessLevelService {
  private _userAccessLevel = signal<number>(0);
  private _groupId = signal<string>('');
  private _userId = signal<string>('');
  private _routeAccessMap = signal<Map<string, number>>(new Map());

  readonly userAccessLevel = this._userAccessLevel.asReadonly();
  readonly groupId = this._groupId.asReadonly();
  readonly userId = this._userId.asReadonly();
  readonly isLoaded = computed(() => this._userId() !== '');

  setAccessInfo(userId: string, groupId: string, accessLevel: number): void {
    this._userId.set(userId);
    this._groupId.set(groupId);
    this._userAccessLevel.set(accessLevel);
  }

  setRouteAccessMap(map: Map<string, number>): void {
    this._routeAccessMap.set(map);
  }

  canAccess(requiredLevel: number): boolean {
    return this._userAccessLevel() >= requiredLevel;
  }

  canAccessRoute(url: string): boolean {
    const map = this._routeAccessMap();
    if (map.size === 0) return true;

    const path = url.split('?')[0];

    if (map.has(path)) {
      return this.canAccess(map.get(path)!);
    }

    let bestMatch = '';
    let bestLevel: number | undefined;
    for (const [route, level] of map) {
      if (path.startsWith(route + '/') && route.length > bestMatch.length) {
        bestMatch = route;
        bestLevel = level;
      }
    }

    if (bestLevel !== undefined) {
      return this.canAccess(bestLevel);
    }

    return true;
  }

  clear(): void {
    this._userId.set('');
    this._groupId.set('');
    this._userAccessLevel.set(0);
    this._routeAccessMap.set(new Map());
  }
}
