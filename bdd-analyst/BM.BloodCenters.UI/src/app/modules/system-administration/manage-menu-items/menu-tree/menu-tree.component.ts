import { Component, Input, Output, EventEmitter, signal, computed, inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { HeaderService } from '@shared/services/header.service';

import { NavigationNode, AccessLevelChange } from '../models/menu-item.model';
import { MenuItemService } from '../services/menu-item.service';
import { MenuService } from '@shared/services/menu.service';
import { TreeNodeComponent } from './tree-node/tree-node.component';

@Component({
  selector: 'app-menu-tree',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    TreeNodeComponent,
  ],
  templateUrl: './menu-tree.component.html',
  styleUrl: './menu-tree.component.scss',
})
export class MenuTreeComponent implements OnInit, OnDestroy, AfterViewInit {
  private menuItemService = inject(MenuItemService);
  private menuService = inject(MenuService);
  private snackBar = inject(MatSnackBar);
  private headerService = inject(HeaderService);

  private destroy$ = new Subject<void>();

  @ViewChild('menuTreeSearchContainer') searchContainer!: ElementRef;
  @ViewChild('searchInput', { read: MatAutocompleteTrigger }) autocompleteTrigger!: MatAutocompleteTrigger;

  @Input() set treeData(value: NavigationNode[]) {
    this.accessLevelChangesSignal.set([]);
    this.hasUnsavedChangesEvent.emit(false);

    if (value && value.length > 0) {
      this.treeDataSignal.set(value);
      this.storeOriginalAccessLevels(value);
      this.autoSelectFirstNode();
    } else {
      this.treeDataSignal.set([]);
      this.selectedNodeSignal.set(null);
    }
  }

  @Input() groupId: string | null = null;
  @Input() applId: string = 'DON';
  @Input() isLoading: boolean = false;

  @Output() nodeSelected = new EventEmitter<NavigationNode>();
  @Output() hasUnsavedChangesEvent = new EventEmitter<boolean>();

  private treeDataSignal = signal<NavigationNode[]>([]);
  readonly treeData$ = this.treeDataSignal.asReadonly();

  private selectedNodeSignal = signal<NavigationNode | null>(null);
  readonly selectedNode = this.selectedNodeSignal.asReadonly();

  private accessLevelChangesSignal = signal<AccessLevelChange[]>([]);
  readonly accessLevelChanges = this.accessLevelChangesSignal.asReadonly();

  readonly isUpdating = signal<boolean>(false);

  searchControl = new FormControl('');
  searchResults = signal<NavigationNode[]>([]);

  readonly hasData = computed(() => this.treeData$().length > 0);
  readonly hasChanges = computed(() => this.accessLevelChanges().length > 0);
  readonly showFooter = computed(() => this.hasChanges());
  readonly showWarningBanner = computed(() => this.checkIfParentSetToZero());
  readonly allExpanded = signal<boolean>(false);

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(term => {
        const searchTerm = typeof term === 'string' ? term : '';
        this.onSearch(searchTerm);
        if (searchTerm && searchTerm.trim().length > 0) {
          setTimeout(() => this.setAutocompleteWidth(), 50);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to chapter change events from header
   * Empty subscription as this component only renders the tree
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Empty subscription - no dropdown data to reload
      });
  }

  ngAfterViewInit(): void {
    if (this.autocompleteTrigger && this.searchContainer) {
      this.autocompleteTrigger.autocomplete.opened.subscribe(() => {
        this.setAutocompleteWidth();
      });
    }
  }

  private setAutocompleteWidth(): void {
    setTimeout(() => {
      if (this.searchContainer) {
        const containerRect = this.searchContainer.nativeElement.getBoundingClientRect();
        const width = containerRect.width;
        const left = containerRect.left;
        document.documentElement.style.setProperty('--search-container-width', `${width}px`);
        document.documentElement.style.setProperty('--search-container-left', `${left}px`);
        console.log('[Search] Set CSS variables: width =', width, 'px, left =', left, 'px');
      }
    }, 10);
  }

  displayFn = (): string => {
    return '';
  }

  private storeOriginalAccessLevels(nodes: NavigationNode[]): void {
    for (const node of nodes) {
      node._originalAccessLvl = node.access_lvl;
      if (node._isExpanded === undefined) {
        node._isExpanded = false;
      }
      if (node.children) {
        this.storeOriginalAccessLevels(node.children);
      }
    }
  }

  private autoSelectFirstNode(): void {
    const tree = this.treeData$();
    if (tree.length > 0) {
      setTimeout(() => {
        const firstNode = tree[0];
        this.selectedNodeSignal.set(firstNode);
        this.nodeSelected.emit(firstNode);
      }, 0);
    }
  }

  onNodeSelected(node: NavigationNode): void {
    this.selectedNodeSignal.set(node);
    this.nodeSelected.emit(node);
  }

  onAccessLevelChanged(event: {node: NavigationNode, newLevel: number}): void {
    const { node, newLevel } = event;
    const originalLevel = node._originalAccessLvl!;

    node.access_lvl = newLevel;

    const changes = [...this.accessLevelChanges()];
    const existingIndex = changes.findIndex(c => c.nodeId === node.id);

    if (originalLevel === newLevel) {
      if (existingIndex >= 0) {
        changes.splice(existingIndex, 1);
      }
    } else {
      const change: AccessLevelChange = {
        nodeId: node.id,
        originalLevel: originalLevel,
        currentLevel: newLevel
      };

      if (existingIndex >= 0) {
        changes[existingIndex] = change;
      } else {
        changes.push(change);
      }
    }

    this.accessLevelChangesSignal.set(changes);
    this.hasUnsavedChangesEvent.emit(changes.length > 0);
  }

  onToggleExpanded(node: NavigationNode): void {
    node._isExpanded = !node._isExpanded;
    this.treeDataSignal.set([...this.treeData$()]);
  }

  onExpandCollapseAll(): void {
    const shouldExpand = !this.allExpanded();
    this.setAllNodesExpanded(this.treeData$(), shouldExpand);
    this.allExpanded.set(shouldExpand);
    this.treeDataSignal.set([...this.treeData$()]);
  }

  private setAllNodesExpanded(nodes: NavigationNode[], expanded: boolean): void {
    for (const node of nodes) {
      node._isExpanded = expanded;
      if (node.children) {
        this.setAllNodesExpanded(node.children, expanded);
      }
    }
  }

  private onSearch(term: string): void {
    if (!term || typeof term !== 'string' || term.trim().length === 0) {
      this.searchResults.set([]);
      return;
    }

    const results = this.searchInTree(this.treeData$(), term.toLowerCase());
    this.searchResults.set(results);
  }

  private searchInTree(nodes: NavigationNode[], term: string): NavigationNode[] {
    const results: NavigationNode[] = [];

    for (const node of nodes) {
      const searchText = node.label.toLowerCase();
      if (searchText.includes(term)) {
        results.push(node);
      }

      if (node.children) {
        results.push(...this.searchInTree(node.children, term));
      }
    }

    return results;
  }

  onSearchResultSelected(node: NavigationNode): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.searchResults.set([]);
    this.expandPathToNode(this.treeData$(), node.id);
    this.selectedNodeSignal.set(node);
    this.nodeSelected.emit(node);
    this.treeDataSignal.set([...this.treeData$()]);
  }

  private expandPathToNode(nodes: NavigationNode[], targetId: string): boolean {
    for (const node of nodes) {
      if (node.id === targetId) {
        return true;
      }

      if (node.children) {
        if (this.expandPathToNode(node.children, targetId)) {
          node._isExpanded = true;
          return true;
        }
      }
    }

    return false;
  }

  onCancelChanges(): void {
    const changes = this.accessLevelChanges();

    changes.forEach(change => {
      const node = this.findNodeById(this.treeData$(), change.nodeId);
      if (node) {
        node.access_lvl = change.originalLevel;
      }
    });

    this.accessLevelChangesSignal.set([]);
    this.hasUnsavedChangesEvent.emit(false);
    this.treeDataSignal.set([...this.treeData$()]);
  }

  onUpdateAccess(): void {
    const changes = this.accessLevelChanges();

    if (changes.length === 0 || !this.groupId) {
      return;
    }

    this.isUpdating.set(true);

    this.menuItemService.updateAccessLevels(this.groupId, changes, this.applId)
      .subscribe({
        next: (response) => {
          this.showSuccessSnackbar(response.message);

          changes.forEach(change => {
            const node = this.findNodeById(this.treeData$(), change.nodeId);
            if (node) {
              node._originalAccessLvl = node.access_lvl;
            }
          });

          this.accessLevelChangesSignal.set([]);
          this.hasUnsavedChangesEvent.emit(false);
          this.isUpdating.set(false);

          // Refresh side menu to reflect access level changes
          this.menuService.refreshMenuItems();
        },
        error: (error) => {
          this.isUpdating.set(false);
        }
      });
  }

  private checkIfParentSetToZero(): boolean {
    const changes = this.accessLevelChanges();

    for (const change of changes) {
      if (change.currentLevel === 0) {
        const node = this.findNodeById(this.treeData$(), change.nodeId);
        if (node && node.children && node.children.length > 0) {
          return true;
        }
      }
    }

    return false;
  }

  private findNodeById(nodes: NavigationNode[], id: string): NavigationNode | null {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      if (node.children) {
        const found = this.findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  private showSuccessSnackbar(message: string): void {
    this.snackBar.open(
      message,
      'Dismiss',
      {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      }
    );
  }

  hasUnsavedChangesCheck(): boolean {
    return this.hasChanges();
  }
}
