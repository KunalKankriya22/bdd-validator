import { Component, Input, Output, EventEmitter, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';

import { Subject, takeUntil } from 'rxjs';
import { HeaderService } from '@shared/services/header.service';
import { NavigationNode, MenuParameter } from '../models/menu-item.model';
import { MoveMenuItemDialogComponent } from '../move-menu-item-dialog/move-menu-item-dialog.component';

@Component({
  selector: 'app-menu-details',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './menu-details.component.html',
  styleUrl: './menu-details.component.scss',
})
export class MenuDetailsComponent implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private headerService = inject(HeaderService);

  private destroy$ = new Subject<void>();

  private selectedNodeSignal = signal<NavigationNode | null>(null);
  readonly selectedNode = this.selectedNodeSignal.asReadonly();

  readonly hasData = computed(() => this.selectedNode() !== null);
  readonly displaySequence = computed(() => {
    const node = this.selectedNode();
    return node ? `Sequence ${node.sequence}` : '';
  });

  @Input() isLoading: boolean = false;
  @Input() allMenuItems: NavigationNode[] = [];
  @Input() groupId: string = '';

  @Output() menuMoved = new EventEmitter<void>();
  @Output() menuItemEdit = new EventEmitter<NavigationNode>();

  ngOnInit(): void {
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to chapter change events from header
   * Empty subscription as this component only displays details
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Empty subscription - no dropdown data to reload
      });
  }

  @Input() set menuNode(value: NavigationNode | null) {
    this.selectedNodeSignal.set(value);
    if (value) {
      console.log('Menu node selected for display:', value.id, value.label);
    }
  }

  onEdit(): void {
    const node = this.selectedNode();
    if (!node) {
      console.error('No node selected for edit');
      return;
    }
    console.log('Edit button clicked for node:', node.id);
    this.menuItemEdit.emit(node);
  }

  onReorder(): void {
    const node = this.selectedNode();
    console.log('Reorder button clicked for node:', node?.id);

    if (!node || !this.allMenuItems.length || !this.groupId) {
      console.error('Missing required data for move dialog');
      return;
    }

    const dialogRef = this.dialog.open(MoveMenuItemDialogComponent, {
      width: '700px',
      disableClose: true,
      data: {
        menuItem: node,
        allMenuItems: this.allMenuItems,
        groupId: this.groupId
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      (document.activeElement as HTMLElement)?.blur();
      if (result) {
        console.log('Menu item moved successfully, refreshing tree');
        this.menuMoved.emit();
      }
    });
  }

  formatParameter(parameter: MenuParameter | null | undefined): string {
    if (!parameter) {
      return '-';
    }
    return `${parameter.key}, ${parameter.value}`;
  }

  formatNullableField(value: string | null | undefined): string {
    return value || '-';
  }
}
