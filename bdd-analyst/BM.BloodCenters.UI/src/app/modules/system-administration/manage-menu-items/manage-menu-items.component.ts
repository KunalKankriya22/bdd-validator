import { Component, signal, computed, inject, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { PageHeaderService } from '@shared/services/page-header.service';
import { MenuService } from '@shared/services/menu.service';
import { SnackbarService } from '@shared/services/snackbar.service';

import { ROUTES } from '../../../core/constants/route.constants';
import { UI } from '../../../core/constants/ui.constants';
import { Group, NavigationNode } from './models/menu-item.model';
import { GroupSelectionEvent } from './interfaces/selection-event.interface';
import { MenuItemService } from './services/menu-item.service';
import { CanComponentDeactivate } from './guards/unsaved-changes.guard';
import { MatDialog } from '@angular/material/dialog';
import { UnsavedChangesDialogComponent } from './unsaved-changes-dialog/unsaved-changes-dialog.component';
import {
  AddEditMenuItemDialogComponent,
  MenuItemDialogData,
  MenuItemDialogResult,
  ParentMenuOption
} from './add-edit-menu-item/add-edit-menu-item.component';

import { GroupsListComponent } from './groups-list/groups-list.component';
import { MenuTreeComponent } from './menu-tree/menu-tree.component';
import { MenuDetailsComponent } from './menu-details/menu-details.component';

@Component({
  selector: 'app-manage-menu-items',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatSnackBarModule,
    TranslateModule,
    GroupsListComponent,
    MenuTreeComponent,
    MenuDetailsComponent,
  ],
  templateUrl: './manage-menu-items.component.html',
  styleUrl: './manage-menu-items.component.scss',
})
export class ManageMenuItemsComponent implements CanComponentDeactivate, OnDestroy {
  // Injected services
  private menuItemService = inject(MenuItemService);
  private menuService = inject(MenuService);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  private dialog = inject(MatDialog);
  private pageHeaderService = inject(PageHeaderService);
  private snackbarService = inject(SnackbarService);

  private destroy$ = new Subject<void>();

  // Constants
  readonly ROUTES = ROUTES;
  readonly UI = UI.SYSTEM_ADMIN.MANAGE_MENU_ITEMS;

  // Page header signals
  private pageTitleSignal = signal<string>('');
  readonly pageTitle = this.pageTitleSignal.asReadonly();

  private pageSubtitleSignal = signal<string>('');
  readonly pageSubtitle = this.pageSubtitleSignal.asReadonly();

  selectedTabIndex = 0;
  private previousTabIndex = 0;
  isTabSwitchPending = false;

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        const tabLabel = this.selectedTabIndex === 0 ? 'Web' : 'On-Site';
        this.pageTitleSignal.set(`${pageData.title} - ${tabLabel}`);
        this.pageSubtitleSignal.set(pageData.subtitle ?? '');
      }
    });
  }

  private selectedGroupSignal = signal<Group | null>(null);
  readonly selectedGroup = this.selectedGroupSignal.asReadonly();

  readonly forceGroupSelection = signal<string | null>(null);

  private menuTreeDataSignal = signal<NavigationNode[]>([]);
  readonly menuTreeData = this.menuTreeDataSignal.asReadonly();

  private selectedMenuNodeSignal = signal<NavigationNode | null>(null);
  readonly selectedMenuNode = this.selectedMenuNodeSignal.asReadonly();

  readonly isLoadingGroups = signal<boolean>(true);
  readonly isLoadingTree = signal<boolean>(false);
  readonly isLoadingContent = computed(() => this.isLoadingGroups() || this.isLoadingTree());
  readonly hasTreeData = computed(() => this.menuTreeData().length > 0);

  private hasUnsavedChangesSignal = signal<boolean>(false);
  readonly hasUnsavedChanges = this.hasUnsavedChangesSignal.asReadonly();

  // Store parent node map for determining parent IDs
  private parentNodeMap = new Map<string, string>(); // nodeId -> parentId

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle add new menu item button click
   * Opens the Add Menu Item dialog
   */
  onAddMenuItem(): void {
    // Get parent menu options from current tree
    const parentMenuOptions = this.buildParentMenuOptions(this.menuTreeData());

    const dialogData: MenuItemDialogData = {
      mode: 'add',
      menuType: this.selectedTabIndex === 0 ? 'web' : 'onsite',
      parentMenuOptions: parentMenuOptions,
      allMenuItems: this.menuTreeData() // Pass full tree for sequence calculation
    };

    const dialogRef = this.dialog.open(AddEditMenuItemDialogComponent, {
      width: '745px',
      height: '100vh',
      maxWidth: '100vw',
      position: { right: '0' },
      disableClose: true,
      panelClass: 'side-panel-dialog',
      hasBackdrop: true,
      data: dialogData
    });

    dialogRef.componentInstance.saveRequest
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: MenuItemDialogResult) => {
        const parentMenuId = result.parentId === '0' ? 0 : parseInt(result.parentId);

        const payload = {
          applId: result.menuType === 'onsite' ? 'WEB' : 'DON',
          fcnId: result.fcnId,
          label: result.label,
          parentMenuId: parentMenuId,
          sequence: result.sequence,
          parameter1Value: result.parameter_1?.value || '',
          parameter2Value: result.parameter_2?.value || '',
          parameter3Value: result.parameter_3?.value || '',
          hidden: result.hidden ? 'Y' : '',
          remarks: result.remarks || ''
        };

        this.menuItemService.addMenuItem(payload).subscribe({
          next: () => {
            dialogRef.close();
            this.snackbarService.showSuccess(`${result.label} has been successfully added.`);
            const currentGroup = this.selectedGroup();
            if (currentGroup) {
              this.loadMenuTree(currentGroup.groupId);
            }
            this.menuService.refreshMenuItems();
          },
          error: (error) => {
            const errorResponse = error.error?.errorResponse;
            const errorMessage = errorResponse
              ? `Error ${errorResponse.errorCode}: ${errorResponse.error}`
              : (error.error?.message || error.message || 'Failed to add menu item. Please try again.');
            this.snackbarService.showError(errorMessage);
          }
        });
      });
  }

  /**
   * Handle edit menu item (to be called from menu tree component)
   * @param menuItem - The menu item to edit
   */
  onEditMenuItem(menuItem: NavigationNode): void {
    // Get parent menu options from current tree
    const parentMenuOptions = this.buildParentMenuOptions(this.menuTreeData());

    // Create a copy with parentId set from our map
    const menuItemWithParent = {
      ...menuItem,
      parentId: this.parentNodeMap.get(menuItem.id)
    };

    const dialogData: MenuItemDialogData = {
      mode: 'edit',
      menuType: this.selectedTabIndex === 0 ? 'web' : 'onsite',
      menuItem: menuItemWithParent as NavigationNode,
      parentMenuOptions: parentMenuOptions,
      allMenuItems: this.menuTreeData() // Pass full tree for sequence calculation
    };

    const dialogRef = this.dialog.open(AddEditMenuItemDialogComponent, {
      width: '745px',
      height: '100vh',
      maxWidth: '100vw',
      position: { right: '0' },
      disableClose: true,
      panelClass: 'side-panel-dialog',
      hasBackdrop: true,
      data: dialogData
    });

    dialogRef.componentInstance.saveRequest
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: MenuItemDialogResult) => {
        const parentMenuId = result.parentId === '0' ? 0 : parseInt(result.parentId);

        const payload = {
          applId: result.menuType === 'onsite' ? 'WEB' : 'DON',
          label: result.label,
          sequence: result.sequence,
          parentMenuId: parentMenuId,
          mnemonic: result.mnemonic || '',
          accessLevel: result.accessLevel || '',
          parameter1Key: result.parameter_1?.key || '',
          parameter1Value: result.parameter_1?.value || '',
          parameter2Key: result.parameter_2?.key || '',
          parameter2Value: result.parameter_2?.value || '',
          parameter3Key: result.parameter_3?.key || '',
          parameter3Value: result.parameter_3?.value || '',
          hidden: result.hidden ? 'Y' : '',
          remarks: result.remarks || ''
        };

        this.menuItemService.updateMenuItem(menuItem.id, payload).subscribe({
          next: () => {
            dialogRef.close();
            this.showSuccessSnackbar(result.label, 'updated');
            const currentGroup = this.selectedGroup();
            if (currentGroup) {
              this.loadMenuTree(currentGroup.groupId);
            }
            this.menuService.refreshMenuItems();
          },
          error: (error) => {
            const errorResponse = error.error?.errorResponse;
            const errorMessage = errorResponse
              ? `Error ${errorResponse.errorCode}: ${errorResponse.error}`
              : (error.error?.message || error.message || 'Failed to update menu item. Please try again.');
            this.snackbarService.showError(errorMessage);
          }
        });
      });
  }

  /**
   * Build parent menu options from tree data and populate parent map
   * Creates a flat list with indentation levels and sequence numbers
   * @param nodes - Tree nodes to process
   * @param level - Current level (for indentation)
   * @param parentId - Parent ID for tracking relationships
   * @param parentPrefix - Parent sequence prefix (for hierarchical numbering)
   * @returns Array of parent menu options
   */
  private buildParentMenuOptions(
    nodes: NavigationNode[],
    level: number = 0,
    parentId: string | null = null,
    parentPrefix: string = ''
  ): ParentMenuOption[] {
    let options: ParentMenuOption[] = [];

    // Sort nodes by sequence to match tree display order
    const sortedNodes = [...nodes].sort((a, b) => a.sequence - b.sequence);

    sortedNodes.forEach((node) => {
      // Store parent relationship
      if (parentId) {
        this.parentNodeMap.set(node.id, parentId);
      }

      // Use actual sequence number for prefix (e.g., "3", "3.1", "3.1.2")
      const prefix = parentPrefix ? `${parentPrefix}.${node.sequence}` : `${node.sequence}`;

      // Add current node as a parent option
      options.push({
        id: node.id,
        label: node.label,
        level: level,
        displayLabel: `${prefix}. ${node.label}`
      });

      // Recursively add children
      if (node.children && node.children.length > 0) {
        options = options.concat(
          this.buildParentMenuOptions(node.children, level + 1, node.id, prefix)
        );
      }
    });

    return options;
  }

  onTabClick(event: MouseEvent, targetIndex: number): void {
    if (targetIndex === this.selectedTabIndex) {
      return;
    }

    if (this.hasUnsavedChanges()) {
      event.stopPropagation();
      event.preventDefault();

      if (this.isTabSwitchPending) {
        return;
      }
      this.isTabSwitchPending = true;

      this.showUnsavedChangesDialog().subscribe((confirmed: boolean) => {
        this.isTabSwitchPending = false;

        if (confirmed) {
          this.previousTabIndex = targetIndex;
          this.selectedTabIndex = targetIndex;
          this.handleTabSwitch(targetIndex);
        } else {
          console.log('Tab change cancelled, staying on:', this.previousTabIndex === 0 ? 'web' : 'onsite');
        }
      });
    }
  }

  onTabChange(event: MatTabChangeEvent): void {
    const newIndex = event.index;

    if (this.previousTabIndex === newIndex) {
      return;
    }

    this.previousTabIndex = newIndex;
    this.selectedTabIndex = newIndex;
    this.handleTabSwitch(newIndex);
  }

  private handleTabSwitch(tabIndex: number): void {
    this.selectedGroupSignal.set(null);
    this.menuTreeDataSignal.set([]);
    this.selectedMenuNodeSignal.set(null);
    this.hasUnsavedChangesSignal.set(false);

    const pageData = this.pageHeaderService.pageHeaderData();
    if (pageData) {
      const tabLabel = tabIndex === 0 ? 'Web' : 'On-Site';
      this.pageTitleSignal.set(`${pageData.title} - ${tabLabel}`);
    }
  }

  /**
   * Handle request to change group selection (BEFORE child changes selection)
   * This is called when checkBeforeSelect is true
   * @param event - Request event with callback
   */
  onRequestGroupChange(event: { group: Group, index: number, callback: (allowed: boolean) => void }): void {
    if (this.hasUnsavedChanges()) {
      this.showUnsavedChangesDialog().subscribe((confirmed: boolean) => {
        event.callback(confirmed);
      });
    } else {
      event.callback(true);
    }
  }

  onGroupsLoadingChange(isLoading: boolean): void {
    this.isLoadingGroups.set(isLoading);
  }

  /**
   * Handle group selection from Card 1 (called after selection is confirmed)
   * Loads menu tree for the selected group
   * @param event - Group selection event
   */
  onGroupSelected(event: GroupSelectionEvent): void {
    console.log('Group selected:', event.group.groupId, event.group.description);
    this.selectedGroupSignal.set(event.group);
    this.loadMenuTree(event.group.groupId);
  }

  /**
   * Handle menu node selection from Card 2
   * Updates Card 3 with selected node data (no API call needed)
   * @param node - Selected navigation node
   */
  onMenuNodeSelected(node: NavigationNode): void {
    console.log('Menu node selected:', node.id, node.label);
    this.selectedMenuNodeSignal.set(node);
  }

  /**
   * Handle unsaved changes notification from Card 2
   * Used by navigation guard to prevent accidental data loss
   * @param hasChanges - Whether Card 2 has unsaved changes
   */
  onTreeHasUnsavedChanges(hasChanges: boolean): void {
    console.log('Tree has unsaved changes:', hasChanges);
    this.hasUnsavedChangesSignal.set(hasChanges);
  }

  onMenuMoved(): void {
    console.log('Menu item moved, refreshing tree');
    const currentGroup = this.selectedGroup();
    if (currentGroup) {
      this.loadMenuTree(currentGroup.groupId);
    }
    // Refresh side menu to reflect changes
    this.menuService.refreshMenuItems();
  }

  /**
   * Required by CanComponentDeactivate interface
   * Called by navigation guard to check if there are unsaved changes
   * @returns true if there are unsaved changes, false otherwise
   */
  hasUnsavedChangesCheck(): boolean {
    return this.hasUnsavedChanges();
  }

  /**
   * Show unsaved changes confirmation dialog
   * @returns Observable<boolean> - true if user confirms to discard changes, false to stay
   */
  private showUnsavedChangesDialog(): any {
    const dialogRef = this.dialog.open(UnsavedChangesDialogComponent, {
      width: '464px',
      disableClose: true,
      panelClass: 'unsaved-changes-dialog'
    });

    return dialogRef.afterClosed();
  }

  /**
   * Get tab icon based on active state
   * Returns different icons for active vs inactive tabs
   * @param tabName - Name of the tab ('web' or 'onsite')
   * @returns Path to the icon image
   */
  getTabIcon(tabName: string): string {
    const isActive = (tabName === 'web' && this.selectedTabIndex === 0) ||
                     (tabName === 'onsite' && this.selectedTabIndex === 1);

    if (isActive) {
      return `assets/images/menu-items/${tabName}.svg`;
    } else {
      const inactiveImageMap: { [key: string]: string } = {
        'web': 'language',
        'onsite': 'location_on'
      };
      return `assets/images/menu-items/${inactiveImageMap[tabName]}.svg`;
    }
  }

  // === Private Methods ===

  /**
   * Load menu tree from API for given group
   * Single API call provides complete tree with all node details
   * @param groupId - The group ID to load tree for
   */
  private loadMenuTree(groupId: string): void {
    this.isLoadingTree.set(true);

    // Clear parent map before loading new tree
    this.parentNodeMap.clear();

    const applId = this.selectedTabIndex === 0 ? 'DON' : 'WEB';
    this.menuItemService.getMenuTreeForGroup(groupId, applId)
      .pipe(finalize(() => this.isLoadingTree.set(false)))
      .subscribe({
        next: (tree) => {
          console.log('Menu tree loaded successfully for group:', groupId);
          this.menuTreeDataSignal.set(tree);

          // Build parent map
          this.buildParentMenuOptions(tree);

          // Auto-select first leaf node for Card 3 display
          const firstNode = this.findFirstLeafNode(tree);
          if (firstNode) {
            this.selectedMenuNodeSignal.set(firstNode);
            console.log('Auto-selected first node:', firstNode.id, firstNode.label);
          } else {
            this.selectedMenuNodeSignal.set(null);
          }
        },
        error: (error) => {
          console.error('Error loading menu tree for group:', groupId, error);
          this.menuTreeDataSignal.set([]);
          this.selectedMenuNodeSignal.set(null);
        }
      });
  }

  /**
   * Find first leaf node in tree (for auto-selection)
   * Traverses depth-first to find first node without children
   * @param nodes - The tree nodes to search
   * @returns First leaf node or null if tree is empty
   */
  private findFirstLeafNode(nodes: NavigationNode[]): NavigationNode | null {
    if (!nodes || nodes.length === 0) return null;

    const first = nodes[0];

    if (first.children && first.children.length > 0) {
      return this.findFirstLeafNode(first.children);
    }

    return first;
  }
  
  /**
   * Show success snackbar for successful operations
   * @param displayName - Display name of the menu item
     @param action - Action performed ('added' or 'updated')
   */
  private showSuccessSnackbar(displayName: string, action: 'added' | 'updated' = 'added'): void {
    const message = `${displayName} has been successfully ${action}`;
    this.snackBar.open(
      message,
      this.translate.instant('COMMON.DISMISS'),
      {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      }
    );
  }
}