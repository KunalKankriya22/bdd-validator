import { Component, OnInit, OnDestroy, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { SearchComponent, SearchResult } from './search/search.component';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { MenuService, MenuItem } from '../../services/menu.service';
import { NavigationService } from '../../services/navigation.service';
import { MenuTextFormatPipe } from '../../pipes/menu-text-format.pipe';

@Component({
  selector: 'app-left-sidenav',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterModule,
    SearchComponent,
    MenuTextFormatPipe
  ],
  templateUrl: './left-sidenav.html',
  styleUrl: './left-sidenav.scss',
})
export class LeftSidenav implements OnInit, OnDestroy {
  // 300ms chosen to filter out brief cursor passes while keeping hover response feeling immediate
  private static readonly HOVER_SUPPRESSION_DELAY_MS = 300;

  isCollapsed = false;
  isHovering = false;
  // Timestamp until which hover should be ignored (ms since epoch)
  suppressHoverUntil = 0;

  // Track current view state
  currentView: 'main' | 'submenu' = 'main';
  currentParentMenu: MenuItem | null = null;
  currentSubmenu: MenuItem | null = null;
  displayedMenuItems: MenuItem[] = [];
  hoveredItem: string | null = null;
  breadcrumbTrail: MenuItem[] = [];
  isLoadingMenu = false;
  menuLoadError: string | null = null;
  
  private routerSubscription?: Subscription;
  private menuSubscription?: Subscription;

  // Preserved state when collapsed (restored on hover)
  private preservedView: 'main' | 'submenu' = 'main';
  private preservedParentMenu: MenuItem | null = null;
  private preservedSubmenu: MenuItem | null = null;
  private preservedDisplayedItems: MenuItem[] = [];
  private preservedBreadcrumb: MenuItem[] = [];

  // ViewChild for search component
  searchComponent = viewChild(SearchComponent);


  constructor(
    private router: Router,
    private menuService: MenuService,
    private navigationService: NavigationService
  ) {
    // React to menu items signal changes (e.g., when menu is refreshed after add/edit)
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();
      if (menuItems.length > 0) {
        this.menuItems = menuItems;
        this.displayedMenuItems = menuItems;
        this.updateNavigationState();
      }
    });
  }

  ngOnInit() {
    // Load menu items from API
    this.loadMenuItems();

    // Subscribe to route changes to auto-update navigation state
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.clearSearch();
      this.updateNavigationState();
    });
  }

  /**
   * Load menu items from the API
   */
  private loadMenuItems(): void {
    this.isLoadingMenu = true;
    this.menuLoadError = null;

    this.menuSubscription = this.menuService.getMenuItems().subscribe({
      next: (menuItems) => {
        this.menuItems = menuItems;
        this.displayedMenuItems = menuItems;
        this.isLoadingMenu = false;

        // Check if current route is accessible after RBAC filtering
        const currentUrl = this.router.url.split('?')[0].split('#')[0];
        if (currentUrl !== '/home' && !this.menuService.isRouteAccessible(currentUrl)) {
          this.router.navigate(['/home']);
          return;
        }

        // Set initial navigation state based on current route
        this.updateNavigationState();
      },
      error: (error) => {
        console.error('Error loading menu items:', error);
        this.menuLoadError = 'Failed to load menu items. Please try refreshing the page.';
        this.isLoadingMenu = false;
        
        // Fallback to empty menu or show error state
        this.menuItems = [];
        this.displayedMenuItems = [];
      }
    });
  }

  /**
   * Clear search value (called on navigation)
   */
  private clearSearch(): void {
    const search = this.searchComponent();
    if (search) {
      search.clearSearchValue();
    }
  }

  /**
   * Update navigation state based on current route
   */
  private updateNavigationState(): void {
    const currentUrl = this.router.url.split('?')[0].split('#')[0];
    const item = this.findMenuItemByRoute(this.menuItems, currentUrl);

    if (item) {
      // Find the full path to this item in the menu tree
      const path = this.findMenuItemPath(this.menuItems, item, []);

      if (path && path.length > 0) {
        // Clear all active states first
        this.clearAllActiveStates(this.menuItems);

        // If item is at Level 1 (no parent), just set it as active and stay in main view
        if (path.length === 1) {
          path[0].active = true;
          this.currentView = 'main';
          this.breadcrumbTrail = [];
          this.displayedMenuItems = this.menuItems;
          this.currentParentMenu = null;
          this.currentSubmenu = null;
        } else {
          // Item has parent(s) - navigate to show the immediate parent's submenu
          const parentItem = path[path.length - 2]; // Immediate parent
          const selectedItem = path[path.length - 1]; // The selected leaf

          // Set up breadcrumb trail (all items except the leaf)
          this.breadcrumbTrail = path.slice(0, -1);

          // Set current view to submenu
          this.currentView = 'submenu';
          this.currentParentMenu = path[0]; // Top-level parent
          this.currentSubmenu = parentItem; // Immediate parent

          // Display the immediate parent's children (siblings of selected item)
          this.displayedMenuItems = parentItem.children || [];

          // Set the selected item as active
          selectedItem.active = true;
        }

        // Preserve state for collapsed view
        this.preservedView = this.currentView;
        this.preservedParentMenu = this.currentParentMenu;
        this.preservedSubmenu = this.currentSubmenu;
        this.preservedDisplayedItems = [...this.displayedMenuItems];
        this.preservedBreadcrumb = [...this.breadcrumbTrail];
      }
    }
  }

  /**
   * Find the path to a menu item in the tree
   * Returns array of items from root to target, or null if not found
   */
  private findMenuItemPath(
    items: MenuItem[],
    target: MenuItem,
    currentPath: MenuItem[]
  ): MenuItem[] | null {
    for (const item of items) {
      const newPath = [...currentPath, item];

      // Check if this is the target item (compare by route or label)
      if (
        (item.routePath && target.routePath && item.routePath === target.routePath) ||
        (item.label === target.label && item.routePath === target.routePath)
      ) {
        return newPath;
      }

      // Recursively search children
      if (item.children && item.children.length > 0) {
        const childPath = this.findMenuItemPath(item.children, target, newPath);
        if (childPath) {
          return childPath;
        }
      }
    }

    return null; // Not found
  }

  /**
   * Restore preserved navigation state (on hover or expand)
   */
  private restoreNavigationState(): void {
    if (this.preservedView !== 'main' || this.preservedParentMenu) {
      this.currentView = this.preservedView;
      this.currentParentMenu = this.preservedParentMenu;
      this.currentSubmenu = this.preservedSubmenu;
      this.displayedMenuItems = [...this.preservedDisplayedItems];
      this.breadcrumbTrail = [...this.preservedBreadcrumb];

      // Restore active states based on current route
      this.updateNavigationState();
    }
  }

  ngOnDestroy(): void {
    // Unsubscribe from router events to prevent memory leaks
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    
    // Unsubscribe from menu service
    if (this.menuSubscription) {
      this.menuSubscription.unsubscribe();
    }
  }

  clearAllActiveStates(items: MenuItem[]) {
    items.forEach(item => {
      item.active = false;
      if (item.children) {
        this.clearAllActiveStates(item.children);
      }
    });
  }

  /**
   * Find menu item by route URL
   * Returns the most specific (longest) matching route
   */
  private findMenuItemByRoute(items: MenuItem[], route: string): MenuItem | null {
    let bestMatch: MenuItem | null = null;
    let bestMatchLength = 0;

    for (const item of items) {
      // Check if this item's route matches exactly or if the current route starts with this item's route
      if (item.routePath) {
        if (item.routePath === route) {
          // Exact match - this is the best possible match
          return item;
        } else if (route.startsWith(item.routePath + '/') && item.routePath.length > bestMatchLength) {
          // Partial match - keep track of the longest match
          bestMatch = item;
          bestMatchLength = item.routePath.length;
        }
      }

      // Recursively search children
      if (item.children && item.children.length > 0) {
        const found = this.findMenuItemByRoute(item.children, route);
        if (found && found.routePath) {
          // If child match is more specific than current best match, use it
          if (found.routePath === route) {
            return found; // Exact match in children
          } else if (found.routePath.length > bestMatchLength) {
            bestMatch = found;
            bestMatchLength = found.routePath.length;
          }
        }
      }
    }

    return bestMatch;
  }

  /**
   * Process icon name from fcnIcon field: trim and lowercase
   * @param fcnIcon The raw icon name from API
   * @returns Processed icon name for Material Icons
   */
  getProcessedIcon(fcnIcon?: string): string {
    if (!fcnIcon) {
      return '';
    }
    return fcnIcon.trim().toLowerCase();
  }

  /**
   * Gets the appropriate icon path for a menu item.
   * Returns filled icon variant when item is hovered or is the active parent menu, otherwise returns regular icon.
   * Uses kebab-case naming convention: label -> assets/images/navigation/{label}.svg or assets/images/navigation/filled-{label}.svg
   * @deprecated Legacy method - use getProcessedIcon with fcnIcon instead
   */
  getMenuIcon(label: string): string {
    const iconName = this.labelToIconName(label);

    // Return filled icon if item is hovered or is the current parent menu
    if ((this.hoveredItem === label || this.currentParentMenu?.label === label) && iconName) {
      return `assets/images/navigation/filled-${iconName}.svg`;
    }

    return iconName ? `assets/images/navigation/${iconName}.svg` : '';
  }

  /**
   * Converts menu label to kebab-case icon filename.
   * Examples: "Donor Functions" -> "donor-functions", "APIs and Integration" -> "api-integration"
   * @deprecated Legacy method - use getProcessedIcon with fcnIcon instead
   */
  private labelToIconName(label: string): string {
    const iconMap: { [key: string]: string } = {
      'Donor Functions': 'donor-functions',
      'Lab': 'lab',
      'Distribution': 'distributions',
      'User Utilities': 'user-utilities',
      'APIs and Integration': 'api-integration',
      'Application Administration': 'app-administration',
      'System Administration': 'system-admin'
    };

    return iconMap[label] || '';
  }

  /**
   * Gets the parent menu icon when in collapsed submenu view.
   * Returns filled icon variant to show active state.
   * @deprecated Legacy method - use getProcessedIcon with fcnIcon instead
   */
  getParentMenuIcon(): string {
    if (this.currentParentMenu) {
      const iconName = this.labelToIconName(this.currentParentMenu.label);
      return iconName ? `assets/images/navigation/filled-${iconName}.svg` : '';
    }
    return '';
  }

  getCollapseIcon(): string {
    return this.isCollapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left';
  }

  onMenuItemMouseEnter(label: string): void {
    this.hoveredItem = label;
  }

  onMenuItemMouseLeave(): void {
    this.hoveredItem = null;
  }
  
  menuItems: MenuItem[] = [];

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    // If explicitly collapsing, clear hover state so "Stay Expanded" won't show
    if (this.isCollapsed) {
      // clear any pinned behavior (not used)
      this.isHovering = false;
      // suppress hover to avoid immediate reopen while cursor remains over sidebar
      this.suppressHoverUntil = Date.now() + LeftSidenav.HOVER_SUPPRESSION_DELAY_MS;
      // Collapse all expanded items when sidebar is collapsed
      this.menuItems.forEach(item => {
        if (item.children) {
          item.expanded = false;
        }
      });

      // ✅ Don't preserve here - use already preserved state from route sync
      // State is preserved in syncNavigationWithCurrentRoute() after each route change

      // Keep current submenu context when collapsing (don't reset to main menu)
    } else {
      // When expanding (via toggle button), restore preserved state
      this.restoreNavigationState();
    }
  }

  // keep sidebar expanded (called when user clicks "Stay Expanded")
  expand() {
    this.isCollapsed = false;
    // clear suppression so hover works normally afterwards
    this.suppressHoverUntil = 0;
    this.isHovering = false;
  }

  onMouseEnter() {
    // ignore hover if suppression window is active
    if (Date.now() < this.suppressHoverUntil) {
      return;
    }

    if (this.isCollapsed) {
      this.isHovering = true;

      // Restore preserved state on hover
      this.restoreNavigationState();
    }
  }

  onMouseLeave() {
    if (this.isHovering) {
      this.isHovering = false;

      // Preserve current active states before clearing them
      // (will be restored on next hover)

      // Show main menu with top-level selected when hover ends
      this.showMainMenuWithTopLevelSelected();
    }
  }

  toggleSubmenu(item: MenuItem) {
    if (item.children && (!this.isCollapsed || this.isHovering)) {
      // Just expand to show children, don't navigate yet
      // If we're in main view, navigate to first level submenu
      if (this.currentView === 'main') {
        // Clear all active states
        this.clearAllActiveStates(this.menuItems);

        // Set clicked item as active
        item.active = true;

        // Switch to submenu view
        this.currentView = 'submenu';
        this.currentParentMenu = item;
        this.currentSubmenu = null;
        this.displayedMenuItems = item.children;
        this.breadcrumbTrail = [item];
      }
      // If we're already in submenu view, navigate to nested submenu
      else if (this.currentView === 'submenu') {
        this.currentSubmenu = item;
        this.displayedMenuItems = item.children;
        this.breadcrumbTrail.push(item);
      }
    }
  }

  /**
   * Navigate to a child menu item (leaf item clicked)
   */
navigateToChild(child: MenuItem): void {
  const wasHovering = this.isHovering;

  const targetRoute = this.navigationService.getNavigationPath(child);
  if (targetRoute) {
    this.router.navigate([targetRoute]).then(() => {
      // ✅ Wait for next tick to ensure syncNavigationWithCurrentRoute() has run
      setTimeout(() => {
        if (wasHovering) {
          this.isCollapsed = true;
          this.isHovering = false;
          this.suppressHoverUntil = Date.now() + LeftSidenav.HOVER_SUPPRESSION_DELAY_MS;
          
          // Now show the collapsed menu with proper state
          this.showMainMenuWithTopLevelSelected();
        }
      }, 0);
    });
  } else {
    if (this.isHovering) {
      this.isCollapsed = true;
      this.isHovering = false;
      this.suppressHoverUntil = Date.now() + LeftSidenav.HOVER_SUPPRESSION_DELAY_MS;
      this.showMainMenuWithTopLevelSelected();
    }
  }
}

  navigateBack() {
    if (this.breadcrumbTrail.length > 1) {
      // Multiple levels deep: remove last level and show previous level's children
      this.breadcrumbTrail.pop();
      const currentItem = this.breadcrumbTrail[this.breadcrumbTrail.length - 1];
      this.currentSubmenu = currentItem;
      this.displayedMenuItems = currentItem.children || [];

      // Don't navigate - just change the submenu view
      // Navigation only happens when clicking leaf items
    } else if (this.breadcrumbTrail.length === 1) {
      // At first submenu level (Level 2) - go back to Level 1 (main menu)
      this.resetToMainMenu();
    } else {
      // No breadcrumb trail: already at main menu, shouldn't happen
      this.resetToMainMenu();
    }
  }

  navigateToBreadcrumb(index: number) {
    // Clicking breadcrumb should only change the submenu view, NOT navigate to routes
    // Only leaf items (with no children) should have routes
    this.currentView = 'submenu';

    if (index === 0) {
      // First level - show parent menu's children
      this.breadcrumbTrail = [this.breadcrumbTrail[0]];
      this.currentSubmenu = null;
      this.displayedMenuItems = this.breadcrumbTrail[0].children || [];

      // Don't navigate - breadcrumbs are folders, not pages
      // Navigation only happens when clicking leaf items in the menu
    } else {
      // Navigate to specific level
      this.breadcrumbTrail = this.breadcrumbTrail.slice(0, index + 1);
      const targetItem = this.breadcrumbTrail[index];
      this.currentSubmenu = targetItem;
      this.displayedMenuItems = targetItem.children || [];

      // Don't navigate - breadcrumbs are folders, not pages
      // Navigation only happens when clicking leaf items in the menu
    }
  }

  goToHome() {
    // Navigate to home route
    this.router.navigate(['/home']);

    // Reset to main menu view (don't wait for route change)
    // Since /home is not in menuItems tree, auto-detection won't interfere
    this.resetToMainMenu();

    // ✅ CRITICAL: Also reset preserved state to main menu
    // Otherwise hover will restore old submenu state
    this.preservedView = 'main';
    this.preservedParentMenu = null;
    this.preservedSubmenu = null;
    this.preservedDisplayedItems = [...this.menuItems];
    this.preservedBreadcrumb = [];
  }

  private resetToMainMenu(): void {
    this.currentView = 'main';
    this.currentParentMenu = null;
    this.currentSubmenu = null;
    this.displayedMenuItems = this.menuItems;
    this.breadcrumbTrail = [];
    this.clearAllActiveStates(this.menuItems);
  }

  /**
   * Show main menu with top-level item selected (for collapsed state)
   */
  private showMainMenuWithTopLevelSelected(): void {
    // Clear all active states first
    this.clearAllActiveStates(this.menuItems);

    // Find the currently selected leaf item by checking current route
    const currentUrl = this.router.url.split('?')[0].split('#')[0];
    const currentItem = this.findMenuItemByRoute(this.menuItems, currentUrl);

    if (currentItem) {
      // Find the top-level parent of current item
      const path = this.findMenuItemPath(this.menuItems, currentItem, []);
      if (path && path.length > 0) {
        // Mark top-level parent as active
        path[0].active = true;
        // Set currentParentMenu so collapsed icon shows active state
        this.currentParentMenu = path[0];
        // Update preserved state so it persists across hover cycles
        this.preservedParentMenu = path[0];
      }
    } else if (this.preservedParentMenu) {
      // Fallback: use preserved parent if current route not found in tree
      this.preservedParentMenu.active = true;
      this.currentParentMenu = this.preservedParentMenu;
    }
  }

  /**
   * Handle search result selection
   */
  onSearchResultSelected(result: SearchResult): void {
    const wasHovering = this.isHovering;

    const targetRoute = this.navigationService.getNavigationPath(result.item);
    if (targetRoute) {
      this.router.navigate([targetRoute]).then(() => {
        // Wait for next tick to ensure updateNavigationState() has run
        setTimeout(() => {
          if (wasHovering) {
            this.isCollapsed = true;
            this.isHovering = false;
            this.suppressHoverUntil = Date.now() + LeftSidenav.HOVER_SUPPRESSION_DELAY_MS;

            // Show collapsed menu with proper state
            this.currentView = 'main';
            this.displayedMenuItems = this.menuItems;
          }
        }, 0);
      });
    } else {
      if (this.isHovering) {
        this.isCollapsed = true;
        this.isHovering = false;
        this.suppressHoverUntil = Date.now() + LeftSidenav.HOVER_SUPPRESSION_DELAY_MS;
        this.currentView = 'main';
        this.displayedMenuItems = this.menuItems;
      }
    }
  }

  /**
   * Get whether sidebar is expanded (for search component)
   */
  get isSidebarExpanded(): boolean {
    return !this.isCollapsed || this.isHovering;
  }

  /**
   * Get whether sidebar is collapsed (for search component CSS)
   */
  get isSidebarCollapsed(): boolean {
    return this.isCollapsed && !this.isHovering;
  }
}