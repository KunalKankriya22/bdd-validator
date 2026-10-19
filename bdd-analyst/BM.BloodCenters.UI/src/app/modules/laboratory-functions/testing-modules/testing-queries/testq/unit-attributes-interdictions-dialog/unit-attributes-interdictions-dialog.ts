import { Component, Inject, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { InterdictionQueryApiService } from '../../../../attributes-and-interdictions/interdiction-query/services/interdiction-query-api.service';
import { UnitAttribute, UnitInterdiction } from '../../../../attributes-and-interdictions/interdiction-query/models/interdiction-query.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';

export interface UnitAttributesInterdictionsDialogData {
  unitId: string;
  collectionDate?: string;
}

@Component({
  selector: 'app-unit-attributes-interdictions-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './unit-attributes-interdictions-dialog.html',
  styleUrl: './unit-attributes-interdictions-dialog.scss',
})
export class UnitAttributesInterdictionsDialogComponent implements OnInit, OnDestroy {
  private readonly interdictionService = inject(InterdictionQueryApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  protected readonly isLoading = signal<boolean>(false);
  protected readonly attributes = signal<UnitAttribute[]>([]);
  protected readonly interdictions = signal<UnitInterdiction[]>([]);

  readonly attributeColumns = ['attribGroup', 'attribGroupDesc', 'attribCode', 'attribDesc'];
  readonly interdictionColumns = ['interCode', 'interDesc', 'interType'];

  constructor(
    public dialogRef: MatDialogRef<UnitAttributesInterdictionsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UnitAttributesInterdictionsDialogData
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.isLoading.set(true);

    this.interdictionService
      .queryInterdictions({ unitId: this.data.unitId, collectionDate: this.data.collectionDate })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.attributes.set(result?.unitAttributes ?? []);
          this.interdictions.set(result?.unitInterdictions ?? []);
          this.isLoading.set(false);
        },
        error: (err) => {
          const errorMsg = HttpErrorHandler.extractErrorMessage(err, 'Failed to load attributes and interdictions.');
          this.snackbarService.showError(errorMsg);
          this.isLoading.set(false);
        },
      });
  }

  close(): void {
    this.dialogRef.close();
  }
}
