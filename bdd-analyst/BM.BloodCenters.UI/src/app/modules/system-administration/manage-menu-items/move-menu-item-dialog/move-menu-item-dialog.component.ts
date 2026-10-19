import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { NavigationNode } from '../models/menu-item.model';
import { MoveMenuItemService } from '../services/move-menu-item.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface MoveMenuItemDialogData {
  menuItem: NavigationNode;
  allMenuItems: NavigationNode[];
  groupId: string;
}

export interface MenuOption {
  id: string;
  label: string;
  displayLabel: string;
  sequence: number;
  level: number;
  parentId: string | null;
  childrenCount: number;
}

@Component({
  selector: 'app-move-menu-item-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    FormsModule,
    TranslateModule
  ],
  templateUrl: './move-menu-item-dialog.component.html',
  styleUrl: './move-menu-item-dialog.component.scss'
})
export class MoveMenuItemDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<MoveMenuItemDialogComponent>);
  private data = inject<MoveMenuItemDialogData>(MAT_DIALOG_DATA);
  private moveMenuItemService = inject(MoveMenuItemService);
  private snackBar = inject(MatSnackBar);

  menuItem = this.data.menuItem;
  allMenuItems = this.data.allMenuItems;
  groupId = this.data.groupId;

  selectedParentId = signal<string | null>(null);
  selectedSequence = signal<number>(1);

  menuOptions = signal<MenuOption[]>([]);
  sequenceOptions = signal<number[]>([]);

  isSubmitting = signal<boolean>(false);

  // Computed property to check if a parent menu item is being moved to a sub-menu position
  readonly isMovingParentToSub = computed(() => {
    const currentParentId = this.getCurrentParentId();
    const targetParentId = this.selectedParentId();
    return currentParentId === '0' && targetParentId !== null && targetParentId !== '0';
  });

  // Computed property to check if the selection is valid
  readonly isValidSelection = computed(() => {
    const parentId = this.selectedParentId();
    const currentParentId = this.getCurrentParentId();
    const currentSequence = this.menuItem.sequence;
    const newSequence = this.selectedSequence();

    // If same parent and same sequence, it's not a valid change
    if (parentId === currentParentId && currentSequence === newSequence) {
      return false;
    }

    return parentId !== null;
  });

  // Computed property for new menu order preview
  readonly newMenuOrder = computed(() => {
    const parentId = this.selectedParentId();
    const targetSequence = this.selectedSequence();

    if (!parentId) return [];

    // Find the target parent
    const parent = this.findMenuById(this.allMenuItems, parentId);
    if (!parent) return [];

    // Get all children of the target parent
    const siblings = parent.id === '0'
      ? this.allMenuItems
      : (parent.children || []);

    // Filter out the current item if it's already a child
    const filteredSiblings = siblings.filter(s => s.id !== this.menuItem.id);

    // Insert the current item at the target sequence
    const newOrder = [...filteredSiblings];
    newOrder.splice(targetSequence - 1, 0, this.menuItem);

    // Get the parent's prefix for hierarchical numbering
    const parentPrefix = this.getParentPrefix(parentId);

    return newOrder.map((item, index) => ({
      ...item,
      sequence: index + 1,
      displaySequence: parentPrefix ? `${parentPrefix}.${index + 1}` : `${index + 1}`
    }));
  });

  // Get the hierarchical prefix for the selected parent
  private getParentPrefix(parentId: string): string {
    if (parentId === '0') {
      return ''; // Root level, no prefix
    }

    const parentOption = this.menuOptions().find(o => o.id === parentId);
    if (parentOption) {
      // Extract the prefix from displayLabel (e.g., "2.1. Donor" -> "2.1")
      const match = parentOption.displayLabel.match(/^([\d.]+)\./);
      return match ? match[1] : '';
    }

    return '';
  }

  ngOnInit(): void {
    this.buildMenuOptions();
    this.initializeDefaults();
  }

  private initializeDefaults(): void {
    const currentParentId = this.getCurrentParentId();
    this.selectedParentId.set(currentParentId);
    this.updateSequenceOptions();
    this.selectedSequence.set(this.menuItem.sequence);
  }

  getCurrentParentId(): string | null {
    // Find parent by checking which node contains this item in its children
    const parent = this.findParentNode(this.allMenuItems, this.menuItem.id);
    return parent ? parent.id : '0'; // '0' represents root level
  }

  private findParentNode(nodes: NavigationNode[], targetId: string): NavigationNode | null {
    for (const node of nodes) {
      if (node.children) {
        if (node.children.some(child => child.id === targetId)) {
          return node;
        }
        const found = this.findParentNode(node.children, targetId);
        if (found) return found;
      }
    }
    return null;
  }

  private buildMenuOptions(): void {
    const options: MenuOption[] = [];

    // Add root level option
    options.push({
      id: '0',
      label: 'Main Menu',
      displayLabel: '0. Main Menu',
      sequence: 0,
      level: 0,
      parentId: null,
      childrenCount: this.allMenuItems.length
    });

    // Add all menu items recursively
    this.buildMenuOptionsRecursive(this.allMenuItems, options, 0, '');

    this.menuOptions.set(options);
  }

  private buildMenuOptionsRecursive(
    nodes: NavigationNode[],
    options: MenuOption[],
    level: number,
    parentPrefix: string
  ): void {
    nodes.forEach((node, index) => {
      const prefix = parentPrefix ? `${parentPrefix}.${index + 1}` : `${index + 1}`;
      const isDisabled = this.isMenuItemOrDescendant(node, this.menuItem.id);
      const isMenuType = node.type === 'MENU';

      // Only add MENU type items (exclude FRM types as they are end forms and can't contain children)
      if (!isDisabled && isMenuType) {
        options.push({
          id: node.id,
          label: node.label,
          displayLabel: `${prefix}. ${node.label}`,
          sequence: node.sequence,
          level: level + 1,
          parentId: this.getCurrentParentId(),
          childrenCount: node.children?.length || 0
        });
      }

      if (node.children && node.children.length > 0) {
        this.buildMenuOptionsRecursive(node.children, options, level + 1, prefix);
      }
    });
  }

  private isMenuItemOrDescendant(node: NavigationNode, targetId: string): boolean {
    if (node.id === targetId) return true;

    if (node.children) {
      return node.children.some(child => this.isMenuItemOrDescendant(child, targetId));
    }

    return false;
  }

  private findMenuById(nodes: NavigationNode[], id: string): NavigationNode | null {
    if (id === '0') {
      // Return a virtual root node
      return {
        id: '0',
        label: 'Main Menu',
        type: 'MENU',
        sequence: 0,
        access_lvl: 0,
        hidden: false,
        function_name: '',
        children: nodes
      };
    }

    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = this.findMenuById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  onParentChange(): void {
    this.updateSequenceOptions();
    // Set default sequence to 1 when parent changes
    this.selectedSequence.set(1);
  }

  private updateSequenceOptions(): void {
    const parentId = this.selectedParentId();
    if (!parentId) {
      this.sequenceOptions.set([]);
      return;
    }

    const parent = this.findMenuById(this.allMenuItems, parentId);
    if (!parent) {
      this.sequenceOptions.set([]);
      return;
    }

    const siblings = parent.id === '0'
      ? this.allMenuItems
      : (parent.children || []);

    // If the item is already a child of this parent, the max sequence is the current count
    // Otherwise, it's current count + 1
    const isAlreadyChild = siblings.some(s => s.id === this.menuItem.id);
    const maxSequence = isAlreadyChild ? siblings.length : siblings.length + 1;

    const options = Array.from({ length: maxSequence }, (_, i) => i + 1);
    this.sequenceOptions.set(options);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (!this.isValidSelection()) {
      return;
    }

    this.isSubmitting.set(true);

    const targetParentMenuId = this.selectedParentId() === '0' ? 0 : parseInt(this.selectedParentId()!);
    const targetSequence = this.selectedSequence();

    this.moveMenuItemService.moveMenuItem(parseInt(this.menuItem.id), {
      targetParentMenuId,
      targetSequence
    }).subscribe({
      next: (response) => {
        console.log('Menu item moved successfully:', response);
        this.snackBar.open(
          'Menu item moved successfully',
          'Dismiss',
          {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          }
        );
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error moving menu item:', error);
        const errorMessage = error.error?.message || error.error || 'Failed to move menu item';
        this.isSubmitting.set(false);
      }
    });
  }
}
