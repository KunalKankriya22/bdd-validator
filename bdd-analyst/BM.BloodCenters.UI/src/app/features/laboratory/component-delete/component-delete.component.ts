import {
  Component as NgComponent,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
  signal,
  computed,
  ViewChild,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import moment from 'moment';
import { Observable, of, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ComponentDeleteService } from './services/component-delete.service';
import { Component as ComponentModel } from './models/component.model';
import { ProductCodeLov } from './models/product-code-lov.model';
import { ComponentDeleteRequest } from './models/component-delete-request.model';
import { ComponentDeleteErrorCodes } from './constants/component-delete-error-codes.constants';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import {
  ConfirmActionDialogComponent,
  ConfirmActionDialogData
} from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import {
  DeleteConfirmationWithNotesDialogComponent,
  DeleteConfirmationWithNotesDialogData,
  DeleteConfirmationWithNotesDialogResult
} from '@shared/components/delete-confirmation-with-notes-dialog/delete-confirmation-with-notes-dialog.component';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { ScanSelectFieldComponent } from '@shared/components/scan-select-field/scan-select-field.component';
import { ScanSelectOption } from '@shared/components/scan-select-field/scan-select-field.model';
import { SCAN_PATTERNS } from '@shared/utils/scan-pattern.util';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { MenuService } from '@shared/services/menu.service';
import { RouteKey } from '@core/constants/route-keys';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';

@NgComponent({
  selector: 'app-component-delete',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDatepickerModule,
    MatSnackBarModule,
    MatDialogModule,
    UnitIdFieldComponent,
    ScanSelectFieldComponent,
    PageHeaderWithBreadcrumb
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './component-delete.component.html',
  styleUrl: './component-delete.component.scss'
})
export class ComponentDeleteComponent implements OnInit, OnDestroy, AfterViewInit {
  private static nextId = 0;
  readonly componentId = `component-delete-${ComponentDeleteComponent.nextId++}`;

  readonly elementId = (name: string) => `${this.componentId}-${name}`;
  readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @ViewChild(UnitIdFieldComponent) unitIdField?: UnitIdFieldComponent;
  @ViewChild('productCodeField') productCodeField?: ScanSelectFieldComponent;

  private readonly fb = inject(FormBuilder);
  private readonly componentDeleteService = inject(ComponentDeleteService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly menuService = inject(MenuService);
  private readonly destroy$ = new Subject<void>();

  readonly SCAN_PATTERNS = SCAN_PATTERNS;

  // Signal-based state
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly componentData = signal<ComponentModel | null>(null);
  readonly productCodesLov = signal<ProductCodeLov[]>([]);
  readonly submitted = signal<boolean>(false);
  readonly validationResult = signal<{ canDelete: boolean; errorCode?: string; errorMessage?: string; requiresConfirmation?: boolean } | null>(null);
  readonly unitIdValid = signal<boolean>(false);
  readonly parsedUnitId = signal<string | null>(null);
  readonly codeScheme = signal<'I' | 'C'>('C');
  readonly collectionDate = signal<Date | null>(null);
  readonly userConfirmed = signal<boolean>(false);
  readonly selectedProductCode = signal<string | null>(null);

  readonly isComponentLoaded = computed(() => this.componentData() !== null);
  readonly canDelete = computed(() => {
    const result = this.validationResult();
    return result != null && result.canDelete === true;
  });
  readonly productDescription = computed(() => {
    const code = this.selectedProductCode();
    if (!code) return '-';
    const product = this.productCodesLov().find(p => p.productCode === code);
    return product?.productDesc || '-';
  });
  readonly productCodeOptions = computed<ScanSelectOption[]>(() =>
    this.productCodesLov().map(p => ({ code: p.productCode, description: p.productDesc }))
  );

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  searchForm!: FormGroup;

  readonly parseProductCode = (value: string): Observable<ScanSelectOption | null> => {
    const trimmed = value?.trim()?.toUpperCase();
    if (!trimmed) return of(null);
    const match = this.productCodeOptions().find(
      o => o.code.toUpperCase() === trimmed || o.code.toUpperCase().startsWith(trimmed)
    );
    return of(match ?? null);
  };

  constructor() {
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.DeleteComponent]?.path;
        const menuItem = basePath ? this.menuService.findMenuItemByPath(basePath) : null;

        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: '/home' },
              { label: menuItem.label, link: null }
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || menuItem.subtitle || ''
          };
        }
      }
    });
  }

  ngOnInit(): void {
    this.initForms();
    this.subscribeToChapterChanges();
  }

  ngAfterViewInit(): void {
    this.unitIdField?.unitIdControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.unitIdValid()) {
          this.onUnitIdCleared();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetState();
      });
  }

  clearAll(): void {
    this.resetState();
  }

  private resetState(): void {
    this.componentData.set(null);
    this.validationResult.set(null);
    this.productCodesLov.set([]);
    this.error.set(null);
    this.loading.set(false);
    this.unitIdValid.set(false);
    this.parsedUnitId.set(null);
    this.codeScheme.set('C');
    this.collectionDate.set(null);
    this.userConfirmed.set(false);
    this.selectedProductCode.set(null);

    this.searchForm.reset();
    this.unitIdField?.clear();
    this.productCodeField?.clear();
  }

  private initForms(): void {
    this.searchForm = this.fb.group({});
  }

  get sf() {
    return this.searchForm.controls;
  }

  onUnitIdValidated(response: UnitValidationResponse): void {
    this.unitIdValid.set(true);
    this.parsedUnitId.set(response.parsedUnitId);
    this.codeScheme.set(response.codeScheme);

    this.selectedProductCode.set(null);
    this.productCodesLov.set([]);
    this.componentData.set(null);
    this.validationResult.set(null);
    this.userConfirmed.set(false);
    this.productCodeField?.clear();

    this.loading.set(true);
    this.componentDeleteService.getInitData(response.parsedUnitId, response.codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (initData) => {
          const collDate = new Date(initData.collectionDate);
          this.collectionDate.set(collDate);
          this.productCodesLov.set(initData.productCodes);
          this.loading.set(false);
        },
        error: (err) => {
          this.showError(err.message || 'Failed to fetch component data.');
          this.loading.set(false);
        }
      });
  }

  onUnitIdCleared(): void {
    this.unitIdValid.set(false);
    this.parsedUnitId.set(null);
    this.codeScheme.set('C');
    this.collectionDate.set(null);

    this.productCodesLov.set([]);
    this.selectedProductCode.set(null);
    this.componentData.set(null);
    this.validationResult.set(null);
    this.userConfirmed.set(false);
    this.productCodeField?.clear();
  }

  onProductCodeSelected(option: ScanSelectOption | null): void {
    if (!option) {
      this.onProductCodeCleared();
      return;
    }

    this.selectedProductCode.set(option.code);
    this.componentData.set(null);

    const unitId = this.parsedUnitId();
    const collDate = this.collectionDate();

    if (unitId && collDate && option.code) {
      this.validationResult.set(null);
      this.userConfirmed.set(false);
      this.checkDeleteValidation(unitId, this.formatDateForApi(collDate), option.code);
    }
  }

  onProductCodeCleared(): void {
    this.selectedProductCode.set(null);
    this.componentData.set(null);
    this.validationResult.set(null);
    this.userConfirmed.set(false);
  }

  private fetchComponentDetailsAfterCheck(
    unitId: string,
    collDate: string,
    productCode: string
  ): void {
    this.loading.set(true);
    this.error.set(null);

    this.componentDeleteService.getComponentDetails(unitId, collDate, productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (component) => {
          this.componentData.set(component);
          this.loading.set(false);
        },
        error: (err) => {
          this.componentData.set(null);
          this.validationResult.set(null);
          this.showError(err.message || 'Component not found.');
          this.loading.set(false);
        }
      });
  }

  private checkDeleteValidation(
    unitId: string,
    collDate: string,
    productCode: string
  ): void {
    this.loading.set(true);
    this.error.set(null);

    this.componentDeleteService.checkDelete(unitId, collDate, productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.validationResult.set(result);

          if (!result.canDelete) {
            this.showError(result.errorMessage || 'An error occurred.');
            this.loading.set(false);
            return;
          }

          if (result.requiresConfirmation) {
            this.loading.set(false);
            this.showDeleteConfirmationDialog(
              unitId,
              collDate,
              productCode,
              result.errorMessage
            );
          } else {
            this.fetchComponentDetailsAfterCheck(unitId, collDate, productCode);
          }
        },
        error: (err) => {
          this.validationResult.set(null);
          this.showError(err.message || 'Validation failed.');
          this.loading.set(false);
        }
      });
  }

  private showDeleteConfirmationDialog(
    unitId: string,
    collDate: string,
    productCode: string,
    message?: string
  ): void {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        title: 'Warning',
        message: message || 'Product has been labeled, do you want to proceed?',
        confirmText: 'YES',
        cancelText: 'NO'
      } as ConfirmActionDialogData
    });

    dialogRef.afterClosed()
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe((confirmed) => {
        if (confirmed === true) {
          this.userConfirmed.set(true);
          this.fetchComponentDetailsAfterCheck(unitId, collDate, productCode);
        } else {
          this.userConfirmed.set(false);
          this.validationResult.set({
            canDelete: false,
            errorCode: undefined,
            errorMessage: 'Action cancelled by user.'
          });
          this.componentData.set(null);
        }
      });
  }

  onDelete(): void {
    if (!this.canDelete()) {
      return;
    }

    const unitId = this.parsedUnitId();
    if (!unitId) {
      this.showError('Unit ID is required.');
      return;
    }

    const collDate = this.collectionDate();
    if (!collDate) {
      this.showError('Collection date is required.');
      return;
    }

    const productCode = this.selectedProductCode();
    if (!productCode) {
      this.showError('Product Code is required.');
      return;
    }

    const dialogRef = this.dialog.open(DeleteConfirmationWithNotesDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        title: 'Comments',
        message: 'Please provide a reason for deleting this component.',
        noteLabel: 'Deletion Reason',
        noteMaxLength: 240,
        notePlaceholder: 'e.g., Wrong component selected during production',
        confirmText: 'ACCEPT',
        cancelText: 'CANCEL'
      } as DeleteConfirmationWithNotesDialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: DeleteConfirmationWithNotesDialogResult) => {
        if (result?.confirmed && result.note) {
          const request: ComponentDeleteRequest = {
            unitId,
            collDate: this.formatDateForApi(collDate),
            productCode,
            note: result.note,
            confirm: this.userConfirmed() ? 'Y' : undefined
          };

          this.loading.set(true);

          this.componentDeleteService.deleteComponent(request)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.showSuccess('Component deleted successfully.');
                this.resetState();
                this.setFocusToUnitId();
              },
              error: (err) => {
                this.showError(err.message || 'Failed to delete component.');
                this.loading.set(false);
              }
            });
        }
      });
  }

  private formatDateForApi(date: Date | moment.Moment | null): string {
    if (!date) {
      return '';
    }
    return moment(date).format('YYYY-MM-DD');
  }

  formatDateForDisplay(date: Date | string | null | undefined): string {
    if (!date) {
      return '-';
    }
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  private setFocusToUnitId(): void {
    setTimeout(() => this.unitIdField?.focus(), 0);
  }

  private showError(message: string): void {
    this.error.set(message);
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }
}
