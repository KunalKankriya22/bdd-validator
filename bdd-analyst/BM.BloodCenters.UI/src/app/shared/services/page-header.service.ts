import { Injectable, inject, computed, Signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { MenuService, MenuItem } from './menu.service';

export interface PageHeaderData {
  title: string;
  subtitle?: string;
}

/**
 * Service for managing page header data based on current route
 * Automatically fetches title and subtitle from menu items
 */
@Injectable({
  providedIn: 'root'
})
export class PageHeaderService {
  private router = inject(Router);
  private menuService = inject(MenuService);

  // Current route path as a signal (stripped of query parameters)
  private currentPathSignal = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.stripQueryParams(this.router.url)),
      startWith(this.stripQueryParams(this.router.url))
    ),
    { initialValue: this.stripQueryParams(this.router.url) }
  );

  /**
   * Strip query parameters and hash fragments from URL
   * @param url The full URL with potential query params
   * @returns Clean path without query params or hash
   */
  private stripQueryParams(url: string | undefined): string {
    if (!url) {
      return '';
    }
    return url.split('?')[0].split('#')[0];
  }

  /**
   * Current page header data (title and subtitle) based on current route
   */
  pageHeaderData: Signal<PageHeaderData | undefined> = computed(() => {
    const currentPath = this.currentPathSignal();
    // const menuItems = this.menuService.getMenuItemsSignal()();

    const menuItem = this.menuService.findMenuItemByPath(currentPath);

    if (menuItem) {
      return {
        title: menuItem.label,
        // Subtitle priority: remarks (if not empty) > subtitle
        subtitle: menuItem.remarks?.trim() || menuItem.subtitle?.trim()
      };
    }

    return undefined;
  });

  /**
   * Get title for current route
   */
  getTitle(): string | undefined {
    return this.pageHeaderData()?.title;
  }

  /**
   * Get subtitle for current route
   */
  getSubtitle(): string | undefined {
    return this.pageHeaderData()?.subtitle;
  }

  /**
   * Get menu item for current route
   */
  getCurrentMenuItem(): MenuItem | undefined {
    return this.menuService.findMenuItemByPath(this.currentPathSignal());
  }
}