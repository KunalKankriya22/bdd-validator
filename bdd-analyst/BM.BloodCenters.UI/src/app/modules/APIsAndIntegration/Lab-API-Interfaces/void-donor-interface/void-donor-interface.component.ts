import { Component, OnInit, OnDestroy, inject, ViewChild, effect } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { LoggingService } from '@shared/services/logging.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { ROUTES } from '../../../../core/constants/route.constants';
import { UnitIdFieldComponent, UnitIdPostValidateEvent } from '@shared/components/unit-id-field';

import { VoidDonorInterfaceApiService } from './services/void-donor-interface-api.service';
import { UnitDetail, DinErrorCode } from './models/void-donor-interface.model';

@Component({
  selector: 'app-void-donor-interface',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
  ],
  templateUrl: './void-donor-interface.component.html',
  styleUrl: './void-donor-interface.component.scss',
})
export class VoidDonorInterfaceComponent implements OnInit, OnDestroy {
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private destroy$ = new Subject<void>();
  private apiService = inject(VoidDonorInterfaceApiService);
  private snackBar = inject(MatSnackBar);
  private loggingService = inject(LoggingService);
  private headerService = inject(HeaderService);
  private pageHeaderService = inject(PageHeaderService);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: ROUTES.HOME },
    ],
    title: '',
    subtitle: '',
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: ROUTES.HOME },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  unitDetail?: UnitDetail;
  canVoid = false;
  isVoidLoading = false;

  collectionDate: string | null = null;
  interfaceTimestamp: string | null = null;

  ngOnInit(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onClearAll());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Called by the shared unit ID field after the 1st API (validate-unit) passes.
   * Chains the screen-specific 2nd API (getUnitDetails).
   * The shared component stays in "Validating..." until confirm() or reject() is called.
   */
  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    const parsedUnitId = event.data.parsedUnitId;
    if (!parsedUnitId) {
      event.reject('Invalid unit ID');
      return;
    }

    this.apiService.getUnitDetails(parsedUnitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.item) {
            this.populateUnitDetail(response.item);
            event.confirm();
          } else {
            event.reject(response.message || 'Unit verification failed');
          }
        },
        error: (error) => {
          event.reject(HttpErrorHandler.extractErrorMessage(error, 'Failed to load unit details'));
        }
      });
  }

  /** Called after both APIs pass and the shared component marks the field valid. */
  onUnitValidated(): void {
    // Collection date, interface timestamp, and canVoid are already set in onUnitPostValidate.
  }

  /** Called when the unit ID field is programmatically cleared. */
  onUnitCleared(): void {
    this.unitDetail = undefined;
    this.canVoid = false;
    this.collectionDate = null;
    this.interfaceTimestamp = null;
  }

  private populateUnitDetail(data: UnitDetail): void {
    this.unitDetail = data;
    this.canVoid = !!data.donorToLabInterfacePerformedOn;
    this.collectionDate = this.formatDate(data.collectionDate);
    this.interfaceTimestamp = data.donorToLabInterfacePerformedOn
      ? this.formatDateTime(data.donorToLabInterfacePerformedOn)
      : null;
  }

  onVoidInterface(): void {
    if (!this.canVoid || !this.unitDetail || !this.unitIdField?.isValid) return;

    this.isVoidLoading = true;

    this.apiService.voidInterface({
      unitId: this.unitIdField.parsedUnitId!,
      collectionDate: this.unitDetail.collectionDate,
      confirmed: 'Y',
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isVoidLoading = false;
          if (response.success) {
            this.snackBar.open('Interface voided successfully.', 'DISMISS', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
            });
            timer(3000).pipe(takeUntil(this.destroy$)).subscribe(() => this.onClearAll());
          } else {
            const errorMessage = response.errorResponse?.error || response.message || 'Void operation failed';
            this.snackBar.open(errorMessage, 'DISMISS', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar'],
            });
          }
        },
        error: (error) => {
          this.isVoidLoading = false;
          const errorMessage = HttpErrorHandler.extractErrorMessage(error, 'Failed to void interface');
          this.snackBar.open(`${DinErrorCode.TRANSACTION_FAILED}: ${errorMessage}`, 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
          this.loggingService.error('Void interface operation failed', error);
        },
      });
  }

  onClearAll(): void {
    this.unitIdField?.clear();
    this.unitDetail = undefined;
    this.canVoid = false;
    this.collectionDate = null;
    this.interfaceTimestamp = null;
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '---';
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      this.loggingService.error('Date formatting error', error);
      return '---';
    }
  }

  private formatDateTime(dateStr: string): string {
    if (!dateStr) return '---';
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      this.loggingService.error('DateTime formatting error', error);
      return '---';
    }
  }
}
