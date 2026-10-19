import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, switchMap, finalize } from 'rxjs/operators';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { TestTypesApiService } from './services/test-types-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { TestListPanelComponent } from './components/test-list-panel';
import { TestTypesGridComponent } from './components/test-types-grid';
import {
  MultipleObservationTestTypeDto,
  TestLookupDto,
  DefaultControlValueLookupDto,
  CreateMultipleObservationTestTypeDto,
  UpdateMultipleObservationTestTypeDto
} from './models/test-types.model';

@Component({
  selector: 'app-multiple-observation-test-types-by-mfg',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    TestListPanelComponent,
    TestTypesGridComponent
  ],
  templateUrl: './multiple-observation-test-types-by-mfg.component.html',
  styleUrl: './multiple-observation-test-types-by-mfg.component.scss'
})
export class MultipleObservationTestTypesByMfgComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `multiple-observation-test-types-${MultipleObservationTestTypesByMfgComponent.nextId++}`;

  private readonly testTypesApiService = inject(TestTypesApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly destroy$ = new Subject<void>();

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }]
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          ...this.pageHeaderConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  protected readonly selectedTest = signal<TestLookupDto | null>(null);
  protected readonly testTypes = signal<MultipleObservationTestTypeDto[]>([]);
  protected readonly originalTestTypes = signal<MultipleObservationTestTypeDto[]>([]);
  protected readonly controlValues = signal<DefaultControlValueLookupDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly saving = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  protected readonly selectedTestId = computed(() => this.selectedTest()?.testId || null);
  protected readonly selectedTestDesc = computed(() => this.selectedTest()?.testDesc || '');
  protected readonly hasSelection = computed(() => this.selectedTest() !== null);

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTestSelected(test: TestLookupDto): void {
    this.selectedTest.set(test);
    this.loadTestTypes(test.testId);
    this.loadControlValues(test.testId);
  }

  private loadTestTypes(testId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.testTypesApiService
      .getTestTypes(testId, { includeInactive: true, take: 9999 })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (types) => {
          this.testTypes.set(types);
          this.originalTestTypes.set(JSON.parse(JSON.stringify(types)));
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load test types');
          this.snackbarService.showError('Failed to load test types. Please try again.');
        }
      });
  }

  private loadControlValues(testId: string): void {
    this.testTypesApiService
      .getControlValues(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (values) => this.controlValues.set(values),
        error: (err) => console.error('Failed to load control values:', err)
      });
  }

  onSave(payload: { modified: MultipleObservationTestTypeDto[]; deleted: string[] }): void {
    if (!this.selectedTest()) return;

    const testId = this.selectedTest()!.testId;
    this.saving.set(true);

    const saveOperations = payload.modified.map(testType => {
      const isNew = !this.originalTestTypes().some(
        orig => orig.testId === testType.testId && orig.testType === testType.testType
      );

      if (isNew) {
        const createDto: CreateMultipleObservationTestTypeDto = {
          testId: testType.testId,
          testType: testType.testType,
          testTypeDesc: testType.testTypeDesc,
          defaultControlValue: testType.defaultControlValue,
          resUpdate: testType.resUpdate,
          othBnd: testType.othBnd,
          fullTechTwo: testType.fullTechTwo,
          effDate: testType.effDate,
          termDate: testType.termDate
        };
        return this.testTypesApiService.createTestType(createDto);
      } else {
        const updateDto: UpdateMultipleObservationTestTypeDto = {
          testTypeDesc: testType.testTypeDesc,
          defaultControlValue: testType.defaultControlValue,
          resUpdate: testType.resUpdate,
          othBnd: testType.othBnd,
          fullTechTwo: testType.fullTechTwo,
          effDate: testType.effDate,
          termDate: testType.termDate
        };
        return this.testTypesApiService.updateTestType(testType.testId, testType.testType, updateDto);
      }
    });

    const allOperations = [...saveOperations];

    if (allOperations.length === 0) {
      this.saving.set(false);
      return;
    }

    forkJoin(allOperations)
      .pipe(
        switchMap(() =>
          this.testTypesApiService.getTestTypes(testId, { includeInactive: true, take: 9999 })
        ),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: (types) => {
          this.testTypes.set(types);
          this.originalTestTypes.set(JSON.parse(JSON.stringify(types)));
          this.snackbarService.showSuccess(
            `Test Types updated successfully for test ${testId}.`
          );
        },
        error: (err) => {
          const errorMessage = this.extractErrorMessage(err);
          this.snackbarService.showError(errorMessage);
        }
      });
  }

  onCancel(): void {
    this.testTypes.set(JSON.parse(JSON.stringify(this.originalTestTypes())));
  }

  onClearAll(): void {
    // Reset grid to original saved data (not empty)
    this.testTypes.set(JSON.parse(JSON.stringify(this.originalTestTypes())));
  }

  @ViewChild(TestTypesGridComponent) private testTypesGrid?: TestTypesGridComponent;

  canDeactivate(): boolean {
    if (this.saving()) return false;
    return !(this.testTypesGrid?.hasUnsavedChanges() ?? false);
  }

  private extractErrorMessage(error: any): string {
    if (error?.error?.errorResponse?.error) {
      return error.error.errorResponse.error;
    }
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    return 'Failed to save test types. Please try again.';
  }

  protected elementId(name: string): string {
    return `${this.componentId}-${name}`;
  }
}
