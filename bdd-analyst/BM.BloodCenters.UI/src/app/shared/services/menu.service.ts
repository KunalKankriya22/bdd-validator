import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { API } from '../../core/constants/api.constants';
import { ApiService } from './api.service';
import { ApiMenuItem, getRouteKeyForMenuItem } from '../../core/constants/fcn-route-map';
import { ROUTE_REGISTRY } from '../../core/constants/route-registry';
import { RouteKey } from '../../core/constants/route-keys';
import { MenuWithAccessResponse, MenuAccessData } from '../../core/models/menu-access.model';
import { AccessLevelService } from './access-level.service';

export interface MenuItem {
  routeKey?: RouteKey;
  routePath?: string;
  label: string;
  breadcrumbLabel?: string;
  icon?: string;
  fcnIcon?: string;
  remarks?: string;
  subtitle?: string;
  hidden?: boolean;
  children?: MenuItem[];
  expanded?: boolean;
  active?: boolean;
  requiredAccessLevel?: number;
}

/**
 * Service for managing menu operations
 * Handles API calls for menu items
 */
@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private apiService = inject(ApiService);
  private accessLevelService = inject(AccessLevelService);

  // Store menu items in a signal
  private menuItemsSignal = signal<MenuItem[]>([]);
  private accessibleRoutes = new Set<string>();

  /**
   * Maps API response to internal MenuItem format
   * @param apiItem The API response menu item object
   * @returns Mapped MenuItem object
   */
  private mapApiMenuItemToMenuItem(apiItem: ApiMenuItem): MenuItem {
    const routeKey = getRouteKeyForMenuItem(apiItem);
    if (!routeKey && apiItem.mnemonic) {
      console.warn(`[MenuService] Unmapped mnemonic: "${apiItem.mnemonic}" | Label: "${apiItem.label}"`);
    }
    const routePath = routeKey ? ROUTE_REGISTRY[routeKey]?.path : undefined;

    const menuItem: MenuItem = {
      routeKey,
      routePath,
      label: apiItem.label,
      expanded: apiItem.expanded,
      hidden: this.isMenuItemHidden(apiItem),
      active: false,
      requiredAccessLevel: apiItem.requiredAccessLevel ?? 0
    };

    if (apiItem.breadcrumbLabel) {
      menuItem.breadcrumbLabel = apiItem.breadcrumbLabel;
    }

    if (apiItem.icon) {
      menuItem.icon = apiItem.icon;
    }

    if (apiItem.fcnIcon) {
      menuItem.fcnIcon = apiItem.fcnIcon;
    }

    if (apiItem.remarks) {
      menuItem.remarks = apiItem.remarks;
    }

    if (apiItem.subtitle) {
      menuItem.subtitle = apiItem.subtitle;
    }

    if (apiItem.children && apiItem.children.length > 0) {
      // Filter out hidden children and map remaining items
      menuItem.children = apiItem.children
        .filter(child => !this.isMenuItemHidden(child))
        .map(child => this.mapApiMenuItemToMenuItem(child));
    }

    return menuItem;
  }

  /**
   * Check if a menu item is hidden
   * @param item The API menu item
   * @returns true if hidden (hidden field is 'Y' or 'H'), false otherwise
   */
  private isMenuItemHidden(item: ApiMenuItem): boolean {
    return item.hidden === 'Y' || item.hidden === 'H';
  }

  /**
   * Fetches all menu items (filters out hidden items)
   * @returns Observable of MenuItem array
   */
  getMenuItems(): Observable<MenuItem[]> {
    return this.apiService.get<MenuWithAccessResponse>(API.MENU.MENU_ITEMS).pipe(
      map((response: MenuWithAccessResponse) => {
        const accessData = 'data' in response && response.data?.menuItems
          ? response.data
          : response as MenuAccessData;

        this.accessLevelService.setAccessInfo(
          accessData.userId,
          accessData.groupId,
          accessData.userAccessLevel
        );

        const mappedItems = accessData.menuItems
          .filter(item => !this.isMenuItemHidden(item))
          .map(item => this.mapApiMenuItemToMenuItem(item))
          .filter((item): item is MenuItem => item !== null);

        const routeAccessMap = new Map<string, number>();
        this.collectRouteAccessMap(mappedItems, routeAccessMap);
        this.accessLevelService.setRouteAccessMap(routeAccessMap);

        const filteredItems = this.filterByAccessLevel(mappedItems, accessData.userAccessLevel);

        this.accessibleRoutes.clear();
        this.collectRoutePaths(filteredItems, this.accessibleRoutes);

        return filteredItems;
      }),
      map(menuItems => {
        // TEMPORARY: Add test menu item for Create Drive from Temporary Drive
        const recruitmentMenu = menuItems.find(item => item.label === 'Donor Functions');
        if (recruitmentMenu && recruitmentMenu.children) {
          const recruitmentSubMenu = recruitmentMenu.children.find(item => item.label === 'Recruitment');
          if (recruitmentSubMenu && recruitmentSubMenu.children) {
            const generalFunctionsMenu = recruitmentSubMenu.children.find(item => item.label === 'Recruitment General Functions');
            if (generalFunctionsMenu) {
              if (!generalFunctionsMenu.children) {
                generalFunctionsMenu.children = [];
              }
              generalFunctionsMenu.children.push({
                routeKey: RouteKey.CreateDriveFromTemporaryDrive,
                routePath: ROUTE_REGISTRY[RouteKey.CreateDriveFromTemporaryDrive].path,
                label: 'Create Drive from Temporary Drive',
                breadcrumbLabel: 'Create Drive from Temporary Drive',
                hidden: false,
                active: false
              });
            }
          }
        }

        // TEMPORARY: Add equipment menu items until backend menu config includes their mnemonics
        this.addMenuItemIfMissing(
          menuItems,
          ['Laboratory Functions', 'Equipment Management', 'Short Equipment Mgmt'],
          {
            routeKey: RouteKey.EnterEquipmentDetails,
            routePath: ROUTE_REGISTRY[RouteKey.EnterEquipmentDetails].path,
            label: 'Enter Equipment Details',
            breadcrumbLabel: 'Enter Equipment Details',
            hidden: false,
            active: false
          }
        );

        this.addMenuItemIfMissing(
          menuItems,
          ['Laboratory Functions', 'Equipment Management', 'Short Equipment Mgmt'],
          {
            routeKey: RouteKey.EnterEquipmentMasterCodes,
            routePath: ROUTE_REGISTRY[RouteKey.EnterEquipmentMasterCodes].path,
            label: 'Enter Equipment Master Codes',
            breadcrumbLabel: 'Enter Equipment Master Codes',
            hidden: false,
            active: false
          }
        );

        return menuItems;
      }),
      tap(menuItems => {
        this.menuItemsSignal.set(menuItems);
      })
    );
  }

  private filterByAccessLevel(items: MenuItem[], userLevel: number): MenuItem[] {
    return items
      .filter(item => userLevel >= (item.requiredAccessLevel ?? 0))
      .map(item => {
        if (!item.children || item.children.length === 0) {
          return item;
        }
        const filteredChildren = this.filterByAccessLevel(item.children, userLevel);
        return {
          ...item,
          children: filteredChildren.length > 0 ? filteredChildren : undefined
        };
      });
  }

  private collectRouteAccessMap(items: MenuItem[], routeMap: Map<string, number>): void {
    for (const item of items) {
      if (item.routePath && item.requiredAccessLevel !== undefined) {
        routeMap.set(item.routePath, item.requiredAccessLevel);
      }
      if (item.children) {
        this.collectRouteAccessMap(item.children, routeMap);
      }
    }
  }

  private collectRoutePaths(items: MenuItem[], routes: Set<string>): void {
    for (const item of items) {
      if (item.routePath) {
        routes.add(item.routePath);
      }
      if (item.children) {
        this.collectRoutePaths(item.children, routes);
      }
    }
  }

  private addMenuItemIfMissing(
    menuItems: MenuItem[],
    parentPath: string[],
    newItem: MenuItem
  ): void {
    if (!newItem.routePath) return;
    if (this.accessibleRoutes.has(newItem.routePath)) return;

    const normalize = (s: string) => s.replace(/\s*[=\-]+\s*>+\s*/g, '').trim();

    let current: MenuItem[] = menuItems;
    for (const label of parentPath) {
      let found = current.find(item => normalize(item.label) === label);
      if (!found) {
        found = { label, children: [], hidden: false, active: false };
        current.push(found);
      }
      if (!found.children) found.children = [];
      current = found.children;
    }

    const alreadyExists = current.some(item => item.routePath === newItem.routePath);
    if (!alreadyExists) {
      current.push(newItem);
      this.accessibleRoutes.add(newItem.routePath);
    }
  }

  isRouteAccessible(url: string): boolean {
    if (this.accessibleRoutes.size === 0) return true;

    const path = url.split('?')[0].split('#')[0];

    if (this.accessibleRoutes.has(path)) return true;

    for (const route of this.accessibleRoutes) {
      if (path.startsWith(route + '/')) return true;
    }

    return false;
  }

  /**
   * Get menu items signal (read-only)
   */
  getMenuItemsSignal() {
    return this.menuItemsSignal.asReadonly();
  }

  /**
   * Refresh menu items from API
   * Used to update menu after changes (add/edit/delete operations)
   */
  refreshMenuItems(): void {
    this.getMenuItems().subscribe();
  }

  /**
   * Find a menu item by its route path
   * Supports both exact matching and parent path matching for child routes
   * Returns the most specific (longest) matching route path
   * @param path The route path to search for
   * @returns The matching MenuItem or undefined
   */
  findMenuItemByPath(path: string): MenuItem | undefined {
    const matches: MenuItem[] = [];

    const findInItems = (items: MenuItem[]): void => {
      for (const item of items) {
        // Exact match - highest priority
        if (item.routePath === path) {
          matches.push(item);
        }
        // Parent path match for child routes
        // Ensure proper segment boundary by checking for '/' suffix
        else if (item.routePath && path.startsWith(item.routePath + '/')) {
          matches.push(item);
        }

        // Recursively search children
        if (item.children && item.children.length > 0) {
          findInItems(item.children);
        }
      }
    };

    findInItems(this.menuItemsSignal());

    // Return the most specific match (longest routePath)
    // Exact matches will always be longest, so they take priority
    if (matches.length === 0) {
      return undefined;
    }

    return matches.reduce((mostSpecific, current) => {
      const currentLength = current.routePath?.length || 0;
      const mostSpecificLength = mostSpecific.routePath?.length || 0;
      return currentLength > mostSpecificLength ? current : mostSpecific;
    });
  }
}