import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { NavigationNode } from '../../models/menu-item.model';

@Component({
  selector: 'app-tree-node',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './tree-node.component.html',
  styleUrl: './tree-node.component.scss',
})
export class TreeNodeComponent {
  readonly accessLevels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  @Input() node!: NavigationNode;
  @Input() level: number = 0;
  @Input() parentSequence: string = '';
  @Input() selectedNodeId: string | null = null;
  @Input() isLastSibling: boolean = false;
  @Input() ancestorHasSiblings: boolean[] = [];

  @Output() nodeSelected = new EventEmitter<NavigationNode>();
  @Output() accessLevelChanged = new EventEmitter<{node: NavigationNode, newLevel: number}>();
  @Output() toggleExpanded = new EventEmitter<NavigationNode>();

  isSelected(): boolean {
    return this.selectedNodeId === this.node?.id;
  }

  hasChildren(): boolean {
    return !!(this.node?.children && this.node.children.length > 0);
  }

  isExpanded(): boolean {
    return this.node?._isExpanded === true;
  }

  get displaySequence(): string {
    if (!this.node) return '';
    return this.parentSequence
      ? `${this.parentSequence}.${this.node.sequence}`
      : `${this.node.sequence}`;
  }

  get chevronIcon(): string {
    return this.isExpanded() ? 'expand_more' : 'chevron_right';
  }

  onNodeClick(): void {
    this.nodeSelected.emit(this.node);
  }

  onChevronClick(event: Event): void {
    event.stopPropagation();
    this.toggleExpanded.emit(this.node);
  }

  onAccessLevelChange(newLevel: number): void {
    this.accessLevelChanged.emit({ node: this.node, newLevel });
  }

  getAncestorChevronArray(): number[] {
    return this.level > 1 ? Array.from({ length: this.level - 1 }, (_, i) => i) : [];
  }

  getAncestorHasSiblings(isChildLast: boolean): boolean[] {
    const newArray = [...this.ancestorHasSiblings];
    newArray.push(!isChildLast);
    return newArray;
  }

  shouldShowContinuationLine(ancestorLevel: number): boolean {
    return this.ancestorHasSiblings[ancestorLevel] || false;
  }

  getIndentArray(): number[] {
    return this.level > 0 ? [0] : [];
  }

  shouldShowVerticalLine(indentLevel: number): boolean {
    return true;
  }
}
