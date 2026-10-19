import {
  Component,
  OnInit,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableColumn } from '@shared/interfaces/data-table.interface';
import { ReagentQueryService } from '../services/reagent-query.service';
import { TestKitDto } from '../models/reagent-query.model';

export interface TestKitsDialogData {
  reagentId: string;
  testId: string;
}

@Component({
  selector: 'app-test-kits-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DataTable
  ],
  templateUrl: './test-kits-dialog.html',
  styleUrl: './test-kits-dialog.scss'
})
export class TestKitsDialogComponent implements OnInit {
  private static nextId = 0;
  protected readonly componentId = `test-kits-dialog-${TestKitsDialogComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly dialogRef = inject(MatDialogRef<TestKitsDialogComponent>);
  private readonly data = inject<TestKitsDialogData>(MAT_DIALOG_DATA);
  private readonly reagentQueryService = inject(ReagentQueryService);
  private readonly router = inject(Router);

  protected readonly testKits = signal<TestKitDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedKit = signal<TestKitDto | null>(null);

  protected readonly isEmpty = computed(() => this.testKits().length === 0 && !this.loading());
  protected readonly reagentId = computed(() => this.data.reagentId);

  protected tableConfig: DataTableConfig<TestKitDto> = {
    columns: [
      {
        key: 'kitId',
        header: 'Kit ID',
        sortable: false,
        type: 'text',
        minWidth: '120px',
        valueFormatter: (value: string | null) => value || '–'
      },
      {
        key: 'qcStatus',
        header: 'QC Status',
        sortable: false,
        type: 'text',
        minWidth: '150px',
        valueFormatter: (value: string | null) => value || '–'
      }
    ],
    stickyHeader: true,
    showPagination: false,
    enableRowHighlight: true,
    emptyMessage: 'No test kits found for this reagent.',
    noDataIcon: 'info'
  };

  ngOnInit(): void {
    this.loadTestKits();
  }

  private loadTestKits(): void {
    this.loading.set(true);
    this.error.set(null);

    this.reagentQueryService.getTestKits(this.data.reagentId, this.data.testId).subscribe({
      next: (response) => {
        const kits = response.kits || [];
        this.testKits.set(kits);
        if (kits.length > 0) {
          this.selectedKit.set(kits[0]);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load test kits. Please try again.');
        this.loading.set(false);
      }
    });
  }

  protected onKitRowClick(kit: TestKitDto): void {
    this.selectedKit.set(kit);
  }

  protected onKitDetails(): void {
    const kit = this.selectedKit();
    if (!kit) return;
    this.dialogRef.close();
    this.router.navigate(
      ['/laboratory-functions/testing-modules/reagent-qualification/reagent-query'],
      {
        queryParams: {
          testId: this.data.testId,
          reagentId: this.data.reagentId,
          kitId: kit.kitId
        }
      }
    );
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
