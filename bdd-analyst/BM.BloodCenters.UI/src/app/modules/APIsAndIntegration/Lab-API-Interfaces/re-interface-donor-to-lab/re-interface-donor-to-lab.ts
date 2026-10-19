import { Component, ViewChild, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { UnitIdFieldComponent, UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';

import { ReInterfaceDonorToLabApiService } from './services/re-interface-donor-to-lab-api.service';
import { ReInterfaceDonorToLabUnit } from './models/re-interface-donor-to-lab.model';

@Component({
  selector: 'app-re-interface-donor-to-lab',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent
  ],
  templateUrl: './re-interface-donor-to-lab.html',
  styleUrls: ['./re-interface-donor-to-lab.scss']
})
export class ReInterfaceDonorToLabComponent {
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' }
    ],
    title: '',
    subtitle: '',
    actions: []
  };

  protected readonly units = signal<ReInterfaceDonorToLabUnit[]>([]);
  protected readonly processing = signal<boolean>(false);
  protected sortDirection: 'A' | 'D' | 'default' = 'default';

  protected readonly hasUnits = computed(() => this.units().length > 0);
  protected readonly unitCount = computed(() => this.units().length);
  protected readonly canReInterface = computed(() => this.hasUnits() && !this.processing());
  protected readonly sortedUnits = computed(() => {
    const data = [...this.units()];
    if (this.sortDirection === 'default') return data;
    return data.sort((a, b) =>
      this.sortDirection === 'A' ? a.sequence - b.sequence : b.sequence - a.sequence
    );
  });

  displayedColumns: string[] = [
    'sequence', 'unitId', 'collectionDate', 'interdictionExist', 'interfaceId', 'interdictionState'
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ReInterfaceDonorToLabApiService,
    private snackbarService: SnackbarService,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService
  ) {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private pendingUnit: ReInterfaceDonorToLabUnit | null = null;

  onPostValidate(event: UnitIdPostValidateEvent): void {
    const parsedUnitId = event.data.parsedUnitId;

    if (this.units().some(u => u.unitId === parsedUnitId)) {
      event.reject('Unit is already in the list');
      return;
    }

    this.apiService.getUnitData(parsedUnitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (unit) => {
          this.pendingUnit = {
            ...unit,
            sequence: this.units().length + 1,
            collectionDate: this.formatDate(unit.collectionDate)
          };
          event.confirm();
        },
        error: (error) => {
          const errorCode = error?.error?.errorResponse?.errorCode;
          const errorMessage = error?.error?.message || error?.error?.errorResponse?.error;
          if (errorMessage) {
            this.snackbarService.showError(errorCode ? `${errorCode}: ${errorMessage}` : errorMessage);
          }
          event.reject('');
          if (this.unitIdField) {
            this.unitIdField.validationState = 'idle';
            this.unitIdField.validationError = null;
            this.unitIdField.unitIdControl.setErrors(null);
          }
        }
      });
  }

  onUnitValidated(_response: UnitValidationResponse): void {
    if (this.pendingUnit) {
      this.units.update(list => [...list, this.pendingUnit!]);
      this.pendingUnit = null;
      this.clearInput();
    }
  }

  onUnitCleared(): void {
    // No action needed when input is cleared
  }

  toggleSort(): void {
    this.sortDirection = this.sortDirection === 'default' ? 'A'
      : this.sortDirection === 'A' ? 'D' : 'default';
    this.units.update(u => [...u]);
  }

  getSortIcon(): string {
    switch (this.sortDirection) {
      case 'A': return 'arrow_upward';
      case 'D': return 'arrow_downward';
      default: return 'unfold_more';
    }
  }

  onReInterface(): void {
    const currentUnits = this.units();
    if (currentUnits.length === 0) return;

    this.processing.set(true);

    const requests = currentUnits.map(unit =>
      this.apiService.executeReInterface({
        unitId: unit.unitId,
        collectionDate: unit.collectionDate
      })
    );

    forkJoin(requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responses) => {
          this.processing.set(false);

          const updatedUnits = currentUnits.map((unit, index) => {
            const response = responses[index];
            const resultItem = response.item ?? response.data?.[0];
            if (response.success && resultItem) {
              return {
                ...unit,
                interfaceId: resultItem.interfaceId ?? unit.interfaceId,
                interdictionState: resultItem.interdictionState ?? unit.interdictionState
              };
            }
            return unit;
          });

          this.units.set(updatedUnits);

          const successCount = responses.filter(r => r.success).length;
          this.snackbarService.showSuccess(
            `Re-interfaced ${successCount} units to Lab successfully.`
          );
        },
        error: (error) => {
          this.processing.set(false);
          const errorMessage = error?.error?.message
            || error?.error?.errorResponse?.error
            || 'Failed to re-interface units';
          this.snackbarService.showError(errorMessage);
        }
      });
  }

  onClearAll(): void {
    this.units.set([]);
    this.clearInput();
  }

  onCancel(): void {
    this.units.set([]);
    this.clearInput();
  }

  private clearInput(): void {
    if (this.unitIdField) {
      this.unitIdField.clear();
    }
  }

  private formatDate(dateString: string): string {
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
  }
}
