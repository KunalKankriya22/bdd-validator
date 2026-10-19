import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { UnitQueryPanelRecord } from '../unit-query.model';
import { InterdictionQueryApiService } from '../../attributes-and-interdictions/interdiction-query/services/interdiction-query-api.service';

@Component({
  selector: 'app-attributes-interdictions-panel',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatProgressSpinnerModule, SidePanelBase],
  providers: [DatePipe],
  template: `
    <app-side-panel-base [title]="panelTitle" width="900px" [showFooter]="false" (closePanel)="closePanel.emit()">
      <div panelContent>
        @if (loading) {
          <div class="panel-loading"><mat-spinner diameter="40"></mat-spinner></div>
        } @else if (error) {
          <p class="panel-error">{{ error }}</p>
        } @else {
          <h4 class="section-title">Unit Attributes</h4>
          <table mat-table [dataSource]="unitAttributes" class="panel-table">
            <ng-container matColumnDef="attribGroup"><th mat-header-cell *matHeaderCellDef>Group</th><td mat-cell *matCellDef="let row">{{ row.attribGroup || '-' }}</td></ng-container>
            <ng-container matColumnDef="attribCode"><th mat-header-cell *matHeaderCellDef>Code</th><td mat-cell *matCellDef="let row">{{ row.attribCode || '-' }}</td></ng-container>
            <ng-container matColumnDef="attribDesc"><th mat-header-cell *matHeaderCellDef>Description</th><td mat-cell *matCellDef="let row">{{ row.attribDesc || '-' }}</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="unitAttrColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: unitAttrColumns;"></tr>
          </table>
          @if (unitAttributes.length === 0) { <p class="panel-empty">No unit attributes.</p> }

          <h4 class="section-title">Unit Interdictions</h4>
          <table mat-table [dataSource]="unitInterdictions" class="panel-table">
            <ng-container matColumnDef="interCode"><th mat-header-cell *matHeaderCellDef>Code</th><td mat-cell *matCellDef="let row">{{ row.interCode || '-' }}</td></ng-container>
            <ng-container matColumnDef="interDesc"><th mat-header-cell *matHeaderCellDef>Description</th><td mat-cell *matCellDef="let row">{{ row.interDesc || '-' }}</td></ng-container>
            <ng-container matColumnDef="interType"><th mat-header-cell *matHeaderCellDef>Type</th><td mat-cell *matCellDef="let row">{{ row.interType || '-' }}</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="unitInterColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: unitInterColumns;"></tr>
          </table>
          @if (unitInterdictions.length === 0) { <p class="panel-empty">No unit interdictions.</p> }

          @if (isComponentContext) {
            <h4 class="section-title">Component Attributes — {{ selectedProductCode }}</h4>
            <table mat-table [dataSource]="componentAttributes" class="panel-table">
              <ng-container matColumnDef="productCode"><th mat-header-cell *matHeaderCellDef>Product</th><td mat-cell *matCellDef="let row">{{ row.productCode || '-' }}</td></ng-container>
              <ng-container matColumnDef="attribGroup"><th mat-header-cell *matHeaderCellDef>Group</th><td mat-cell *matCellDef="let row">{{ row.attribGroup || '-' }}</td></ng-container>
              <ng-container matColumnDef="attribCode"><th mat-header-cell *matHeaderCellDef>Code</th><td mat-cell *matCellDef="let row">{{ row.attribCode || '-' }}</td></ng-container>
              <ng-container matColumnDef="attribDesc"><th mat-header-cell *matHeaderCellDef>Description</th><td mat-cell *matCellDef="let row">{{ row.attribDesc || '-' }}</td></ng-container>
              <tr mat-header-row *matHeaderRowDef="compAttrColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: compAttrColumns;"></tr>
            </table>
            @if (componentAttributes.length === 0) { <p class="panel-empty">No component attributes.</p> }

            <h4 class="section-title">Component Interdictions — {{ selectedProductCode }}</h4>
            <table mat-table [dataSource]="componentInterdictions" class="panel-table">
              <ng-container matColumnDef="productCode"><th mat-header-cell *matHeaderCellDef>Product</th><td mat-cell *matCellDef="let row">{{ row.productCode || '-' }}</td></ng-container>
              <ng-container matColumnDef="interCode"><th mat-header-cell *matHeaderCellDef>Code</th><td mat-cell *matCellDef="let row">{{ row.interCode || '-' }}</td></ng-container>
              <ng-container matColumnDef="interDesc"><th mat-header-cell *matHeaderCellDef>Description</th><td mat-cell *matCellDef="let row">{{ row.interDesc || '-' }}</td></ng-container>
              <ng-container matColumnDef="interType"><th mat-header-cell *matHeaderCellDef>Type</th><td mat-cell *matCellDef="let row">{{ row.interType || '-' }}</td></ng-container>
              <tr mat-header-row *matHeaderRowDef="compInterColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: compInterColumns;"></tr>
            </table>
            @if (componentInterdictions.length === 0) { <p class="panel-empty">No component interdictions.</p> }
          }
        }
      </div>
    </app-side-panel-base>
  `,
  styles: [`
    .panel-loading { display: flex; justify-content: center; padding: 40px; }
    .panel-error { color: #d32f2f; padding: 16px; }
    .panel-empty { color: #666; padding: 16px; text-align: center; }
    .panel-table { width: 100%; }
    .section-title { font-size: 14px; font-weight: 600; color: #333; margin: 16px 0 8px; padding: 0 16px; }
  `],
})
export class AttributesInterdictionsPanelComponent implements OnInit, OnDestroy {
  @Input() record!: UnitQueryPanelRecord;
  @Input() selectedProductCode: string | null = null;
  @Output() closePanel = new EventEmitter<void>();

  private readonly service = inject(InterdictionQueryApiService);
  private readonly datePipe = inject(DatePipe);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  loading = true;
  error = '';

  unitAttributes: any[] = [];
  unitInterdictions: any[] = [];
  componentAttributes: any[] = [];
  componentInterdictions: any[] = [];

  unitAttrColumns = ['attribGroup', 'attribCode', 'attribDesc'];
  unitInterColumns = ['interCode', 'interDesc', 'interType'];
  compAttrColumns = ['productCode', 'attribGroup', 'attribCode', 'attribDesc'];
  compInterColumns = ['productCode', 'interCode', 'interDesc', 'interType'];

  get isComponentContext(): boolean {
    return !!this.selectedProductCode;
  }

  get panelTitle(): string {
    return this.isComponentContext
      ? `Unit & Component Attributes & Interdictions`
      : 'Unit Attributes & Interdictions';
  }

  ngOnInit(): void {
    const collDateStr = this.datePipe.transform(this.record.collDate, 'yyyy-MM-dd') ?? undefined;

    this.service.queryInterdictions({
      unitId: this.record.unitId,
      productCode: this.selectedProductCode ?? undefined,
      collectionDate: collDateStr,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.unitAttributes = res?.unitAttributes ?? [];
          this.unitInterdictions = res?.unitInterdictions ?? [];
          this.componentAttributes = res?.componentAttributes ?? [];
          this.componentInterdictions = res?.componentInterdictions ?? [];
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.error = err?.error?.message || 'Failed to load attributes/interdictions.';
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
