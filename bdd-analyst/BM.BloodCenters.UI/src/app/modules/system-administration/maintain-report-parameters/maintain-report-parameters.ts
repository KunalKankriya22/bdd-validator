import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from "@angular/forms";
import { noWhitespaceOnlyValidator, codeFieldValidator } from '@shared/validators/input.validators';

/* Angular Material */
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatListModule } from "@angular/material/list";
import { MatDialogModule } from "@angular/material/dialog";
import { MatDividerModule } from "@angular/material/divider";
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

/* Service */
import { ReportParameterService } from "../maintain-report-parameters/services/maintain-report-parameters";
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from '@angular/router';
import { ReportParameter } from "./models/report-parameter.model";
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { CodeType } from './models/code-type.model';
import { REPORT_PARAMETER_ERROR_MESSAGES } from './constants/error-messages';

@Component({
  selector: "app-maintain-report-parameters",
  standalone: true,
  templateUrl: "./maintain-report-parameters.html",
  styleUrls: ["./maintain-report-parameters.scss"],
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatListModule,
    MatDialogModule,
    MatDividerModule,
    PageHeaderWithBreadcrumb,
    NgxMatSelectSearchModule
  ],
})
export class MaintainReportParameters implements OnInit, OnDestroy {
  // Expose error messages for template
  readonly ERROR_MESSAGES = REPORT_PARAMETER_ERROR_MESSAGES;

  // Page header configuration
  readonly headerConfig: PageHeaderConfig = {
    title: 'Report Parameters (RESTRICTED)',
    subtitle: 'Set up and manage report parameters that are used in the report.',
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Maintain Report Master Table', link: null }
    ],
    actions: [
      {
        label: 'Add New Parameter',
        icon: 'add',
        onClick: () => this.onAddNew()
      }
    ]
  };

  /* =========================
     FORMS
  ========================= */
  form!: FormGroup;
  filterForm!: FormGroup;

  /* =========================
     FILTER OPTIONS
  ========================= */

  yesNoOptions = [
    { label: "Yes", value: true },
    { label: "No", value: false },
  ];

  // RMREPCD Code Types
  codeTypes: CodeType[] = [];
  filteredCodeTypes: CodeType[] = [];
  parameterTypeSearchControl = new FormControl('');
  parameterTypes: string[] = [];  // Keep for filtering compatibility
  isUpperOptions: { label: string; value: boolean }[] = [];
  isListOptions: { label: string; value: boolean }[] = [];

  /* =========================
     UI STATE
  ========================= */
  mode: "NONE" | "ADD" | "EDIT" = "NONE";
  selectedParameter: ReportParameter | null = null;
  parameters: ReportParameter[] = [];

  showFilter = false;



  constructor(
    private fb: FormBuilder,
    private reportParameterService: ReportParameterService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    /* MAIN FORM */
    this.form = this.fb.group({
      parameterCode: ["", [Validators.required, Validators.maxLength(5), codeFieldValidator()]],

      prompt: ["", [Validators.required, Validators.maxLength(40), noWhitespaceOnlyValidator()]],

      description: ["", [Validators.required, Validators.maxLength(30), noWhitespaceOnlyValidator()]],

      parameterType: ["", [Validators.required, Validators.maxLength(6)]],

      isList: [false, Validators.required],
      isUpper: [false, Validators.required],

      referenceTable: ["", Validators.maxLength(30)],
      referenceColumn: ["", [Validators.maxLength(30), this.refColumnRequiresTableValidator()]],
      defaultValue: ["", Validators.maxLength(15)],
      listFormName: ["", Validators.maxLength(8)],
    });

    // Watch for referenceTable changes to re-validate referenceColumn
    this.form.get('referenceTable')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.form.get('referenceColumn')?.updateValueAndValidity();
      });

    /* FILTER FORM (MATCHES BACKEND DTO) */
    this.filterForm = this.fb.group({
      keyword: [""],
      parameterType: [null],
      isUpper: [null],
      isList: [null],
    });
  }

  /* =========================
     LIFECYCLE
  ========================= */
  private destroy$ = new Subject<void>();

  /**
   * RMREPCD Validation: REF_COLUMN requires REF_TABLE
   */
  private refColumnRequiresTableValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.parent) {
        return null;
      }

      const refColumn = control.value;
      const refTable = control.parent.get('referenceTable')?.value;

      if (refColumn && !refTable) {
        return { tableNameNotEntered: true };
      }

      return null;
    };
  }

  ngOnInit(): void {
    this.loadParameters();
    this.loadFilterMasterData();
    this.loadCodeTypes();  // Load RMREPCD code types
    this.setupParameterTypeSearch();

    this.filterForm
      .get('keyword')!
      .valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((value) => {
        if (!value || !value.trim()) {
          this.loadParameters();
          return;
        }

        this.reportParameterService
          .search({ keyword: value.trim() })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res) => {
              this.parameters = res;
            }
          });
      });
  }

  private setupParameterTypeSearch(): void {
    this.parameterTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredCodeTypes = this.codeTypes.filter(type =>
          type.code.toLowerCase().includes(term)
        );
      });
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }


  /* =========================
     API CALLS
  ========================= */
  loadParameters(): void {
    this.reportParameterService.getReportParameters().subscribe((res) => {
      this.parameters = res.sort((a, b) =>
         a.parameterCode < b.parameterCode ? -1 : a.parameterCode > b.parameterCode ? 1 : 0,
      );
    });
  }

  loadFilterMasterData(): void {
    this.reportParameterService.getParameterTypes().subscribe((res) => {
      this.parameterTypes = res.parameterTypes;

      this.isUpperOptions = res.isUpperValues.map((v) => ({
        label: v ? "Yes" : "No",
        value: v,
      }));

      this.isListOptions = res.isListValues.map((v) => ({
        label: v ? "Yes" : "No",
        value: v,
      }));
    });
  }

  /**
   * Load code types from backend (RMREPCD CODE_TYPE LOV)
   */
  loadCodeTypes(): void {
    this.reportParameterService.getCodeTypes().subscribe({
      next: (types) => {
        this.codeTypes = types;
        this.filteredCodeTypes = [...types];
        // For backward compatibility with filters
        this.parameterTypes = types.map(t => t.code);
      }
    });
  }

  /** Check if Apply button should be disabled */
  get isApplyDisabled(): boolean {
    const f = this.filterForm?.value;

    // Check if at least one field has a value
    const hasKeyword = f?.keyword && f.keyword.trim() !== '';
    const hasParameterType = f?.parameterType !== null && f?.parameterType !== undefined;
    const hasIsUpper = f?.isUpper !== null && f?.isUpper !== undefined;
    const hasIsList = f?.isList !== null && f?.isList !== undefined;

    return !(hasKeyword || hasParameterType || hasIsUpper || hasIsList);
  }

  /** APPLY FILTER */
  onApplyFilter(): void {
    const f = this.filterForm.value;
    const params: any = {};

    if (f.keyword && f.keyword.trim()) {
      params.keyword = f.keyword.trim();
    }
    if (f.parameterType) {
      params.parameterType = f.parameterType;
    }
    if (f.isUpper !== null) {
      params.isUpper = f.isUpper;
    }
    if (f.isList !== null) {
      params.isList = f.isList;
    }

    this.reportParameterService.search(params).subscribe({
      next: (res) => {
        this.parameters = res;
        this.showFilter = false;
      }
    });
  }


  /** CLEAR ALL FILTERS */
  onClearFilter(): void {
    this.filterForm.reset({
      keyword: "",
      parameterType: null,
      isUpper: null,
      isList: null,
    });

    // reload full list
    this.loadParameters();

    this.showFilter = false;
  }

  toggleFilter(): void {
    this.showFilter = !this.showFilter;
  }

  /* =========================
     ACTIONS
  ========================= */

  /** Add New Parameter */
  onAddNew(): void {
    this.mode = "ADD";
    this.selectedParameter = null;

    this.form.reset({
      isUpper: false,
      isList: false,
    });

    this.form.get("parameterCode")?.enable();
  }

  /** Edit Existing Parameter */
  onSelectParameter(param: any): void {
    this.mode = "EDIT";
    this.selectedParameter = param;

    this.form.patchValue({
      parameterCode: param.parameterCode,
      description: param.description,
      parameterType: param.parameterType,
      prompt: param.prompt,
      isUpper: param.isUpper,
      isList: param.isList,
      referenceTable: param.referenceTable,
      referenceColumn: param.referenceColumn,
      listFormName: param.listFormName,
      defaultValue: param.defaultValue,
    });

    this.form.get("parameterCode")?.disable();
  }

  /** Sanitize input on typing: no leading spaces, single space between words */
  sanitizeInput(controlName: string): void {
    const control = this.form.get(controlName);
    if (!control) return;
    const value = control.value;
    if (typeof value !== 'string') return;

    const sanitized = value.replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
    if (sanitized !== value) {
      control.setValue(sanitized, { emitEvent: false });
    }
  }

  /** Trim trailing spaces on blur */
  trimInput(controlName: string): void {
    const control = this.form.get(controlName);
    if (!control) return;
    const value = control.value;
    if (typeof value !== 'string') return;

    const trimmed = value.trimEnd();
    if (trimmed !== value) {
      control.setValue(trimmed, { emitEvent: false });
    }
  }

  /** Clear Main Form */
  onClear(): void {
    const preservedCode = this.mode === "EDIT" ? this.form.getRawValue().parameterCode : "";

    this.form.reset({
      parameterCode: preservedCode,
      isUpper: false,
      isList: false,
    });

    if (this.mode === "ADD") {
      this.form.get("parameterCode")?.enable();
    }
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, "DISMISS", {
      duration: 3000,
      horizontalPosition: "right",
      verticalPosition: "top",
      panelClass: ["success-snackbar"],
    });
  }


  private showError(message: string): void {
    this.snackBar.open(message, "DISMISS", {
      duration: 4000,
      horizontalPosition: "right",
      verticalPosition: "top",
      panelClass: ["error-snackbar"],
    });
  }


  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showError(REPORT_PARAMETER_ERROR_MESSAGES.VALIDATION_FAILED);
      return;
    }

    const payload = this.form.getRawValue();

    if (this.mode === "ADD") {
      this.reportParameterService.create(payload).subscribe({
        next: () => {
          const msg = REPORT_PARAMETER_ERROR_MESSAGES.CREATE_SUCCESS.replace('{0}', payload.parameterCode);
          this.showSuccess(msg);
          this.loadParameters();
          this.mode = "NONE";
          this.form.reset();
        }
      });
    } else {
      this.reportParameterService
        .update(payload.parameterCode, payload)
        .subscribe({
          next: () => {
            const msg = REPORT_PARAMETER_ERROR_MESSAGES.UPDATE_SUCCESS.replace('{0}', payload.parameterCode);
            this.showSuccess(msg);
            this.loadParameters();
            this.mode = "NONE";
            this.form.reset();
          }
        });
    }
  }

}
