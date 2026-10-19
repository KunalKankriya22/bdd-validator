import { Component, OnInit, OnDestroy, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, Subject, of, takeUntil } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';
import moment from 'moment';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { ManualDonorInterfaceApiService } from './services/manual-donor-interface-api.service';
import { TestResultOption } from './models/manual-donor-interface.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

@Component({
  selector: 'app-manual-donor-interface',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
    NgxMatSelectSearchModule,
    UnitIdFieldComponent
  ],
  templateUrl: './manual-donor-interface.html',
  styleUrls: ['./manual-donor-interface.scss']
})
export class ManualDonorInterfaceComponent implements OnInit, OnDestroy {
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' }
    ],
    title: '',
    subtitle: '',
    actions: []
  };

  @ViewChild('aboSelect', { static: false }) aboSelect?: MatSelect;
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  donorForm!: FormGroup;
  testResults: TestResultOption[] = [];
  filteredTestResults$: Observable<TestResultOption[]> = of([]);
  aboSearchControl = new FormControl('');
  isLoading = false;
  isSubmitting = false;
  currentDate: string = '';
  collectionDate: string = '';

  private destroy$ = new Subject<void>();
  private unitIdScan$ = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private apiService: ManualDonorInterfaceApiService,
    private snackBar: MatSnackBar,
    private pageHeaderService: PageHeaderService,
    private chapterTimezoneService: ChapterTimezoneService
  ) {
    this.initializeForm();
    this.currentDate = this.chapterTimezoneService.getChapterLocalDate().format('DD-MMM-YYYY').toUpperCase();

    effect(() => {
      const ld = this.chapterTimezoneService.chapterLocalDate();
      if (ld && ld.isValid()) {
        this.currentDate = ld.format('DD-MMM-YYYY').toUpperCase();
      }
    });

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
          actions: []
        };
      }
    });
  }

  ngOnInit(): void {
    this.unitIdScan$.pipe(
      switchMap(id => this.apiService.getUnitDetails(id)),
      takeUntil(this.destroy$)
    ).subscribe(unit => {
      this.collectionDate = unit?.collDate
        ? moment(unit.collDate).format('DD-MMM-YYYY').toUpperCase()
        : '';
    });
    this.loadTestResults();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.donorForm = this.fb.group({
      donorVerified: ['', Validators.required],
      hasAssertion: ['', Validators.required],
      priorTestResult: ['']
    });
  }

  private loadTestResults(): void {
    this.isLoading = true;
    this.apiService.getTestResults()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          this.testResults = results;
          this.isLoading = false;
          this.setupAboFilter();
        },
        error: () => {
          this.isLoading = false;
          this.filteredTestResults$ = of([]);
        }
      });
  }

  private setupAboFilter(): void {
    this.filteredTestResults$ = this.aboSearchControl.valueChanges.pipe(
      startWith(''),
      map(searchText => {
        const text = (searchText || '').toLowerCase();
        if (!text) return this.testResults;
        return this.testResults.filter(o =>
          o.code.toLowerCase().includes(text) ||
          o.description.toLowerCase().includes(text)
        );
      })
    );
  }

  compareTestResult = (a: TestResultOption, b: TestResultOption): boolean => {
    return !!a && !!b && a.code === b.code;
  };

  onAboSelectOpened(opened: boolean): void {
    if (opened && this.aboSelect) {
      this.aboSelect._keyManager?.setActiveItem(-1);
    }
  }

  get priorTestResultControl(): FormControl<TestResultOption | null> {
    return this.donorForm.get('priorTestResult') as FormControl<TestResultOption | null>;
  }

  onUnitValidated(data: UnitValidationResponse): void {
    this.unitIdScan$.next(data.parsedUnitId);
  }

  onUnitCleared(): void {
    this.collectionDate = '';
  }

  onSave(): void {
    if (this.donorForm.invalid) {
      this.donorForm.markAllAsTouched();
      return;
    }

    if (!this.unitIdField.isValid) {
      return;
    }

    this.isSubmitting = true;
    const formValue = this.donorForm.value;

    this.apiService.submitManualDonorInterface(
      this.unitIdField.parsedUnitId!,
      formValue.donorVerified,
      formValue.hasAssertion,
      formValue.priorTestResult?.code ?? ''
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response.success) {
            this.snackBar.open(response.message || 'Donor information submitted successfully', 'DISMISS', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
            this.onClearAll();
          } else {
            const errorMessage = response?.message || 'Failed to submit donor information';
            this.snackBar.open(errorMessage, 'DISMISS', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          }
        },
        error: () => {
          this.isSubmitting = false;
        }
      });
  }

  onClearAll(): void {
    this.unitIdField.clear();
    this.donorForm.reset({
      donorVerified: '',
      hasAssertion: '',
      priorTestResult: ''
    });
    this.aboSearchControl.setValue('');
    this.collectionDate = '';
  }

  formatDate(date: Date): string {
    return DateFieldValidationUtility.formatDateForUI(date);
  }
}
