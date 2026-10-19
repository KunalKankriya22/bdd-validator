import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { A11yModule } from '@angular/cdk/a11y';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { forkJoin } from 'rxjs';

import { Report, ReportParameter, AtlasBreadcrumbDataSource } from '../models/report.model';
import { ReportService } from '../services/report.service';
import { FilterDialogComponent } from './filter-dialog/filter-dialog';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';

@Component({
  selector: 'app-report-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatListModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTooltipModule,
    DragDropModule,
    A11yModule,
    PageHeaderWithBreadcrumb,
    NgxMatSelectSearchModule
  ],
  templateUrl: './report-form.html',
  styleUrls: ['./report-form.scss']
})
export class ReportFormComponent implements OnInit {
  // Page header configuration
  readonly headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Reports (RESTRICTED)', link: null }
    ]
  };

  // Breadcrumb data
  public breadcrumbs = signal<AtlasBreadcrumbDataSource[]>([
    { title: 'Home', outlets: { primary: ['/'] } },
    { title: 'Report Master Table', outlets: { primary: ['/reports'] } }
  ]);

  // Form fields
  public reportId = signal<string>('');
  public title = signal<string>('');
  public subtitle = signal<string>('');
  public reportType = signal<string>('');
  public formType = signal<string>('');
  public batchQueue = signal<string>('');
  
  // Disabled states for form fields
  public titleDisabled = signal<boolean>(false);
  public subtitleDisabled = signal<boolean>(false);
  public reportTypeDisabled = signal<boolean>(false);
  public formTypeDisabled = signal<boolean>(false);
  public batchQueueDisabled = signal<boolean>(false);
  
  // Application ID from API response
  private applicationId = signal<string>('');
  
  // Parameters
  public availableParameters = signal<ReportParameter[]>([]);
  private originalAvailableParameters = signal<ReportParameter[]>([]);
  public assignedParameters = signal<ReportParameter[]>([]);
  private initialAssignedParameters = signal<ReportParameter[]>([]);

  // Initial form values for change detection
  private initialTitle = signal<string>('');
  private initialSubtitle = signal<string>('');
  private initialReportType = signal<string>('');
  private initialFormType = signal<string>('');
  private initialBatchQueue = signal<string>('');
  
  // Save button state
  public isSaveEnabled = signal<boolean>(false);
  
  // Options for dropdowns
  public reportTypes: string[] = [];
  public formTypes: string[] = [];
  public batchQueues: string[] = [];
  public parameterTypes: string[] = ['CHAR', 'NUMBER', 'DATE', 'DATETM', 'ODATE'];

  // Search controls and filtered arrays
  public reportIdSearchControl = new FormControl('');
  public filteredReports = signal<Report[]>([]);

  public reportTypeSearchControl = new FormControl('');
  public filteredReportTypes: string[] = [];

  public formTypeSearchControl = new FormControl('');
  public filteredFormTypes: string[] = [];

  public parameterTypeSearchControl = new FormControl('');
  public filteredParameterTypes: string[] = [];

  // Search term for parameter filtering
  public searchTerm = signal<string>('');

   /**
   * Handle report ID input
   * @param event Input event
   */
  public reports = signal<Report[]>([]);
  public reportIdError = signal<string | null>(null);
  public titleError = signal<string | null>(null);
  public subtitleError = signal<string | null>(null);
  public reportTypeError = signal<string | null>(null);
  public formTypeError = signal<string | null>(null);
  public batchQueueError = signal<string | null>(null);

  //filter report parameters from parametertype,uppper & list dropdowns
public filterParameterTypes = signal<string[]>([]);
public filterIsListValues = signal<boolean[]>([]);
public filterIsUpperValues = signal<boolean[]>([]);

  // Filter states
  public showFilter = false;
  public parameterTypeFilter: string | null = null;
  public upperFilter: string | null = null;
  public listFilter: string | null = null;

  // Applied filter states (to track what was last applied)
  private appliedParameterTypeFilter: string | null = null;
  private appliedUpperFilter: string | null = null;
  private appliedListFilter: string | null = null;

  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  
  constructor(private reportService: ReportService) {}
  
  ngOnInit(): void {
    // Initialize data
    this.reportService.getAvailableParameters().subscribe({
      next: (parameters) => {
        this.availableParameters.set(parameters);
        this.originalAvailableParameters.set(parameters);
        // Apply initial filters to ensure proper display
        this.applyFiltersToParameters();
      },
      error: (error) => {
        console.error('Error loading available parameters:', error);
      }
    });

    this.reportService.getReportNames().subscribe({
      next: (reports) => {
        this.reports.set(reports);
        this.filteredReports.set(reports);
      },
      error: (error) => {
        console.error('Error loading report names:', error);
      }
    });

    this.reportTypes = this.reportService.getReportTypes();
    this.filteredReportTypes = [...this.reportTypes];

    this.reportService.getFormTypes().subscribe({
      next: (types) => {
        this.formTypes = types;
        this.filteredFormTypes = [...this.formTypes];
      }
    });

    this.loadParameterTypes();
    this.setupSearchFunctionality();
  }

  private setupSearchFunctionality(): void {
    // Report ID search
    this.reportIdSearchControl.valueChanges.subscribe(searchTerm => {
      const term = (searchTerm as string || '').toLowerCase();
      this.filteredReports.set(
        this.reports().filter(report =>
          report.id.toLowerCase().includes(term)
        )
      );
    });

    // Report Type search
    this.reportTypeSearchControl.valueChanges.subscribe(searchTerm => {
      const term = (searchTerm as string || '').toLowerCase();
      this.filteredReportTypes = this.reportTypes.filter(type =>
        type.toLowerCase().includes(term)
      );
    });

    // Form Type search
    this.formTypeSearchControl.valueChanges.subscribe(searchTerm => {
      const term = (searchTerm as string || '').toLowerCase();
      this.filteredFormTypes = this.formTypes.filter(type =>
        type.toLowerCase().includes(term)
      );
    });

    // Parameter Type search (for filter panel)
    this.parameterTypeSearchControl.valueChanges.subscribe(searchTerm => {
      const term = (searchTerm as string || '').toLowerCase();
      this.filteredParameterTypes = this.parameterTypes.filter(type =>
        type.toLowerCase().includes(term)
      );
    });
  }
  
  /**
   * Load parameter types from API
   */
  private loadParameterTypes(): void {
    this.reportService.getParameterFilters().subscribe({
      next: (filters) => {
        this.parameterTypes = filters.parameterTypes;
        this.filteredParameterTypes = [...filters.parameterTypes];
      },
      error: (error) => {
        console.error('Error loading parameter types:', error);
      }
    });
  }

  /**
   * Validate report ID field when dropdown closes
   */
  public validateReportId(): void {
    if (!this.reportId()) {
      this.reportIdError.set('Please select Report ID');
    }
  }

  /**
   * Handle report ID selection and fetch report details
   * @param reportName The selected report name/ID
   */
  public handleReportIdChange(reportName: string): void {
    this.reportIdError.set(null); // clear validation error
    if (!reportName) {
      this.clearReportDetails();
      return;
    }
    
    this.reportId.set(reportName);
    
    // Fetch report details from API
    this.reportService.getReportDetails(reportName).subscribe({
      next: (reportDetails: any) => {
        // Extract and store application ID from response
        this.applicationId.set(
          reportDetails.appId ||
          reportDetails.applicationId || 
          '');
        
        // Map API response fields to form fields
        // The API returns: reporT_NAME, reporT_TYPE, title, subtitle, formS_TYPE
        this.title.set(reportDetails.title || '');
        this.titleDisabled.set(false); // Keep title input enabled

        this.subtitle.set(reportDetails.subtitle || '');
        this.subtitleDisabled.set(false); // Keep subtitle input enabled

        // Set report type and add to dropdown list if not already present
        const reportTypeValue = reportDetails.reportType || '';
        if (reportTypeValue && !this.reportTypes.includes(reportTypeValue)) {
          this.reportTypes = [...this.reportTypes, reportTypeValue];
        }
        this.reportType.set(reportTypeValue);
        this.reportTypeDisabled.set(false); // Keep report type dropdown enabled

        // Set form type from report details
        const formTypeValue = reportDetails.formsType || '';
        if (formTypeValue && !this.formTypes.includes(formTypeValue)) {
          this.formTypes = [...this.formTypes, formTypeValue];
          this.filteredFormTypes = [...this.formTypes];
        }
        this.formType.set(formTypeValue);
        this.formTypeDisabled.set(false);

        // Set batch queue value
        const batchQueueValue = reportDetails.batchQueue || '';
        this.batchQueue.set(batchQueueValue);
        this.batchQueueDisabled.set(false); // Keep batch queue input enabled

        // Store initial values for change detection
        this.initialTitle.set(reportDetails.title || '');
        this.initialSubtitle.set(reportDetails.subtitle || '');
        this.initialReportType.set(reportTypeValue);
        this.initialFormType.set(formTypeValue);
        this.initialBatchQueue.set(batchQueueValue);

        // Clear all validation error messages when report is loaded
        this.titleError.set(null);
        this.subtitleError.set(null);
        this.reportTypeError.set(null);
        this.formTypeError.set(null);
        this.batchQueueError.set(null);

        this.loadAssignedParameters(reportName);
      },
      error: (error) => {
        console.error('Error fetching report details:', error);
        this.clearReportDetails();
      }
    });
  }
  
  /**
   * Clear report details from form
   */
  private clearReportDetails(): void {
    this.title.set('');
    this.titleDisabled.set(false);

    this.subtitle.set('');
    this.subtitleDisabled.set(false);

    this.reportType.set('');
    this.formType.set('');
    this.batchQueue.set('');
    this.reportTypeDisabled.set(false);
    this.formTypeDisabled.set(false);
    this.batchQueueDisabled.set(false);

    // Clear error messages
    this.titleError.set(null);
    this.subtitleError.set(null);
    this.reportTypeError.set(null);
    this.formTypeError.set(null);
    this.batchQueueError.set(null);

    // Clear initial values
    this.initialTitle.set('');
    this.initialSubtitle.set('');
    this.initialReportType.set('');
    this.initialFormType.set('');
    this.initialBatchQueue.set('');
  }
  
  /**
   * Handle title input
   * @param event Input event
   */
  public handleTitleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Enforce 40 character limit
    if (value.length > 40) {
      this.title.set(value.substring(0, 40));
      this.titleError.set('Title cannot exceed 40 characters');
    } else {
      this.title.set(value);
      this.titleError.set(null); // Clear error on valid input
    }

    this.updateSaveButtonState(); // Check for changes
  }

  /**
   * Validate title field on blur
   */
  public validateTitle(): void {
    const titleValue = this.title();

    if (!titleValue) {
      this.titleError.set('Title is required');
    } else if (titleValue.trim() === '') {
      this.titleError.set('Title cannot contain only spaces');
    } else if (titleValue.length > 40) {
      this.titleError.set('Title cannot exceed 40 characters');
    }
  }

  /**
   * Handle subtitle input
   * @param event Input event
   */
  public handleSubtitleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Enforce 40 character limit
    if (value.length > 40) {
      this.subtitle.set(value.substring(0, 40));
      this.subtitleError.set('Subtitle cannot exceed 40 characters');
    } else {
      this.subtitle.set(value);
      this.subtitleError.set(null); // Clear error on valid input
    }

    this.updateSaveButtonState(); // Check for changes
  }

  /**
   * Validate subtitle field on blur
   */
  public validateSubtitle(): void {
    const subtitleValue = this.subtitle();

    if (subtitleValue && subtitleValue.length > 40) {
      this.subtitleError.set('Subtitle cannot exceed 40 characters');
    }
  }

  /**
   * Handle report type selection
   * @param event Selection event
   */
  public handleReportTypeChange(event: MatSelectChange): void {
    this.reportType.set(event.value);
    this.reportTypeError.set(null); // Clear error on change
    this.updateSaveButtonState(); // Check for changes
  }

  /**
   * Validate report type field when dropdown closes
   */
  public validateReportType(): void {
    if (!this.reportType()) {
      this.reportTypeError.set('Report Type is required');
    }
  }

  /**
   * Handle form type selection
   * @param event Selection event
   */
  public handleFormTypeChange(event: MatSelectChange): void {
    this.formType.set(event.value);
    this.formTypeError.set(null); // Clear error on change
    this.updateSaveButtonState(); // Check for changes
  }

  /**
   * Validate form type field when dropdown closes
   */
  public validateFormType(): void {
    if (!this.formType()) {
      this.formTypeError.set('Form Type is required');
    }
  }

  /**
   * Handle batch queue input
   * @param event Input event
   */
  public handleBatchQueueInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;

    // Enforce 25 character limit
    if (inputValue.length > 25) {
      this.batchQueue.set(inputValue.substring(0, 25));
      this.batchQueueError.set('Batch Queue cannot exceed 25 characters');
    } else {
      this.batchQueue.set(inputValue);
      this.batchQueueError.set(null); // Clear error on valid input
    }

    this.updateSaveButtonState(); // Check for changes
  }

  /**
   * Validate batch queue field on blur
   */
  public validateBatchQueue(): void {
    const batchQueueValue = this.batchQueue();

    if (batchQueueValue && batchQueueValue.length > 25) {
      this.batchQueueError.set('Batch Queue cannot exceed 25 characters');
    }
  }
  
  /**
   * Handle search input for parameters
   * @param event Input event
   */
  public handleSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.applyFiltersToParameters();
  }

  /**
   * Prevent leading whitespace in Search field
   * @param event Keyboard event
   */
  public preventLeadingSpaceSearch(event: KeyboardEvent): void {
    if (event.key === ' ' && !this.searchTerm()?.trim()) {
      event.preventDefault();
    }
  }
  
  /**
   * Clear all filters
   */
  public onClearFilter(): void {
    // Clear filter values
    this.parameterTypeFilter = null;
    this.upperFilter = null;
    this.listFilter = null;

    // Save cleared state as applied filters
    this.appliedParameterTypeFilter = null;
    this.appliedUpperFilter = null;
    this.appliedListFilter = null;

    // Apply the cleared filters to show all data
    this.applyFiltersToParameters();

    // Dismiss the filter panel
    this.showFilter = false;
  }

  /**
   * Apply filters
   */
  public onApplyFilter(): void {
    // Save current filter values as applied state
    this.appliedParameterTypeFilter = this.parameterTypeFilter;
    this.appliedUpperFilter = this.upperFilter;
    this.appliedListFilter = this.listFilter;

    this.applyFiltersToParameters();
    this.showFilter = false;
  }

  /**
   * Close filter panel without applying - revert to last applied state
   */
  public onCloseFilter(): void {
    // Revert to last applied filter values
    this.parameterTypeFilter = this.appliedParameterTypeFilter;
    this.upperFilter = this.appliedUpperFilter;
    this.listFilter = this.appliedListFilter;

    this.showFilter = false;
  }

  /**
   * Check if apply button should be disabled
   */
  public get isApplyDisabled(): boolean {
    return !this.parameterTypeFilter && !this.upperFilter && !this.listFilter;
  }
  
  /**
   * Apply filters to parameters
   */
  private applyFiltersToParameters(): void {
    const typeFilter = this.parameterTypeFilter;
    const upperFilterValue = this.upperFilter;
    const listFilterValue = this.listFilter;
    const term = this.searchTerm().toLowerCase();

    const all = this.originalAvailableParameters();

    const filtered = all.filter(p => {
      // Filter by parameter type (only filter if value is selected)
      if (typeFilter && p.parameterType !== typeFilter) return false;
      // Filter by isUpper (only filter if value is selected)
      if (upperFilterValue !== null) {
        if (upperFilterValue === 'yes' && !p.isUpper) return false;
        if (upperFilterValue === 'no' && p.isUpper) return false;
      }
      // Filter by isList (only filter if value is selected)
      if (listFilterValue !== null) {
        if (listFilterValue === 'yes' && !p.isList) return false;
        if (listFilterValue === 'no' && p.isList) return false;
      }

      // Filter by search term
      if (term) {
        return (
          p.parameterCode.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.prompt?.toLowerCase().includes(term)
        );
      }

      return true;
    });

    this.availableParameters.set(filtered);
  }

  
  /**
   * Filter parameters based on search term
   * @returns Filtered parameters
   */
  public get filteredParameters(): ReportParameter[] {
    return this.availableParameters();
  }
  
  /**
   * Select a parameter to assign to the report
   * @param parameter The parameter to select
   */
  public selectParameter(parameter: ReportParameter): void {
    // In a real app, we would clone the parameter to avoid reference issues
    const selectedParam = { ...parameter, selected: true };
    
    // Add to assigned parameters
    this.assignedParameters.update(params => [...params, selectedParam]);
    
    // Enable save button
    this.updateSaveButtonState();
    
    // Keep parameter in available list - do not remove it
  }
  
  /**
   * Check if a parameter is already assigned
   * @param parameter The parameter to check
   * @returns true if the parameter is in the assigned list
   */
  public isParameterAssigned(parameter: ReportParameter): boolean {
    return this.assignedParameters().some(p => p.parameterCode === parameter.parameterCode);
  }
  
  /**
   * Remove a parameter from the assigned list
   * @param parameter The parameter to remove
   */
  public removeParameter(parameter: ReportParameter): void {
    // Remove from assigned parameters
    this.assignedParameters.update(params => 
      params.filter(p => p.parameterCode !== parameter.parameterCode)
    );
    
    // Enable save button
    this.updateSaveButtonState();
    
    // Parameter stays in available list - no need to add it back
  }
  
  /**
   * Save the report configuration and parameter definitions
   */
  public saveReport(): void {
    // Trim leading and trailing whitespace from text fields before validation and save
    this.title.set(this.title().trim());
    this.subtitle.set(this.subtitle().trim());
    this.batchQueue.set(this.batchQueue().trim());

    // Reset all errors
    this.reportIdError.set(null);
    this.titleError.set(null);
        this.reportTypeError.set(null);
        this.formTypeError.set(null);

        let hasError = false;

        // Validate reportId (Required)
        if (!this.reportId()) {
          this.reportIdError.set('Please select Report ID');
          hasError = true;
        }

        // Validate title (Required and max length)
        if (!this.title()) {
          this.titleError.set('Title is required');
          hasError = true;
        } else if (this.title().trim() === '') {
          this.titleError.set('Title cannot contain only spaces');
          hasError = true;
        } else if (this.title().length > 40) {
          this.titleError.set('Title cannot exceed 40 characters');
          hasError = true;
        }

        // Validate subtitle (max length)
        if (this.subtitle() && this.subtitle().length > 40) {
          this.subtitleError.set('Subtitle cannot exceed 40 characters');
          hasError = true;
        }

        // Validate report type (Required)
        if (!this.reportType()) {
          this.reportTypeError.set('Report Type is required');
          hasError = true;
        }

        // Validate form type (Required)
        if (!this.formType()) {
          this.formTypeError.set('Form Type is required');
          hasError = true;
        }

        // Validate batch queue (max length)
        if (this.batchQueue() && this.batchQueue().length > 25) {
          this.batchQueueError.set('Batch Queue cannot exceed 25 characters');
          hasError = true;
        }

        // Validate parameters
        if (this.assignedParameters().length === 0) {
          this.snackBar.open('Please assign at least one parameter', 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['content-snackbar']
          });
          hasError = true;
        }

        // If any validation failed, stop here
        if (hasError) {
          return;
        }

    const appId = this.applicationId();

    if (!appId) {
      console.error('Missing application ID from report details API');
      return;
    }

    // Create the report object for updating master data
    const reportData: Report = {
      id: this.reportId(),
      title: this.title(),
      subtitle: this.subtitle(),
      reportType: this.reportType(),
      formType: this.formType(),
      batchQueue: this.batchQueue(),
      parameters: this.assignedParameters()
    };

    // Call both APIs in parallel
    forkJoin({
      masterUpdate: this.reportService.updateReportMaster(reportData),
      parameterDefinitions: this.reportService.saveReportParameterDefinitions(
        appId,
        this.reportId(),
        this.assignedParameters()
      )
    }).subscribe({
      next: (response) => {
        console.log('Saved successfully', response);
        this.snackBar.open(`Report ID ${this.reportId()} has been updated successfully.`, 'DISMISS', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['content-snackbar']
        });
        // Update initial values to current values after successful save
        this.initialAssignedParameters.set([...this.assignedParameters()]);
        this.initialTitle.set(this.title());
        this.initialSubtitle.set(this.subtitle());
        this.initialReportType.set(this.reportType());
        this.initialFormType.set(this.formType());
        this.initialBatchQueue.set(this.batchQueue());

        // Update save button state (should be disabled now since no changes)
        this.updateSaveButtonState();
      }
      // Error handling removed - global error handler will display API error messages
    });
  }
  
  /**
   * Cancel the form and revert to last saved state
   */
  public cancelForm(): void {
    // Revert form fields to initial saved values
    this.title.set(this.initialTitle());
    this.subtitle.set(this.initialSubtitle());
    this.reportType.set(this.initialReportType());
    this.formType.set(this.initialFormType());
    this.batchQueue.set(this.initialBatchQueue());

    // Revert assigned parameters to initial saved state
    this.assignedParameters.set([...this.initialAssignedParameters()]);

    // Reset filters (both UI and applied state)
    this.parameterTypeFilter = null;
    this.upperFilter = null;
    this.listFilter = null;
    this.appliedParameterTypeFilter = null;
    this.appliedUpperFilter = null;
    this.appliedListFilter = null;

    // Clear all error messages
    this.reportIdError.set(null);
    this.titleError.set(null);
    this.subtitleError.set(null);
    this.reportTypeError.set(null);
    this.formTypeError.set(null);
    this.batchQueueError.set(null);

    // Refresh available parameters list
    this.availableParameters.set(this.originalAvailableParameters());

    // Clear search
    this.searchTerm.set('');

    // Apply filters to refresh the view
    this.applyFiltersToParameters();

    // Update save button state (should be disabled since reverted to initial state)
    this.updateSaveButtonState();
  }

  /**
   * Handle drag and drop of assigned parameters
   * @param event CDK drag drop event
   */
  public onParameterDropped(event: CdkDragDrop<ReportParameter[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      const assigned = [...this.assignedParameters()];
      const [movedItem] = assigned.splice(event.previousIndex, 1);
      assigned.splice(event.currentIndex, 0, movedItem);
      this.assignedParameters.set(assigned);
      
      // Enable save button when drag occurs
      this.updateSaveButtonState();
    }
  }

  /**
   * Update save button state based on form validity and changes
   */
  private updateSaveButtonState(): void {
    const currentParams = this.assignedParameters();

    // Check if all required fields are filled and valid
    const requiredFieldsFilled =
      !!this.reportId() &&
      !!this.title() && this.title().trim() !== '' && this.title().length <= 40 &&
      (!this.subtitle() || this.subtitle().length <= 40) &&
      (!this.batchQueue() || this.batchQueue().length <= 25) &&
      !!this.reportType() &&
      !!this.formType() &&
      currentParams.length > 0;

    // Check if any changes have been made from initial values
    const hasChanges = this.hasFormChanges();

    // Enable save if all required fields are filled, valid, and changes have been made
    this.isSaveEnabled.set(requiredFieldsFilled && hasChanges);
  }

  /**
   * Check if any form values or parameters have changed from initial state
   */
  private hasFormChanges(): boolean {
    // Check if form fields have changed
    const titleChanged = this.title() !== this.initialTitle();
    const subtitleChanged = this.subtitle() !== this.initialSubtitle();
    const reportTypeChanged = this.reportType() !== this.initialReportType();
    const formTypeChanged = this.formType() !== this.initialFormType();
    const batchQueueChanged = this.batchQueue() !== this.initialBatchQueue();

    // Check if parameters have changed (added, removed, or reordered)
    const parametersChanged = this.haveParametersChanged();

    return titleChanged || subtitleChanged || reportTypeChanged || formTypeChanged || batchQueueChanged || parametersChanged;
  }

  /**
   * Check if assigned parameters have changed from initial state
   * Compares both the parameters and their order
   */
  private haveParametersChanged(): boolean {
    const current = this.assignedParameters();
    const initial = this.initialAssignedParameters();

    // If lengths differ, parameters have changed
    if (current.length !== initial.length) {
      return true;
    }

    // Check if parameters are in the same order with same codes
    for (let i = 0; i < current.length; i++) {
      if (current[i].parameterCode !== initial[i].parameterCode) {
        return true;
      }
    }

    return false;
  }

      private loadAssignedParameters(reportName: string): void {
      this.reportService.getAssignedParameters(reportName).subscribe({
        next: (savedParams) => {
          const allParams = this.originalAvailableParameters();

          // Match API results with full parameter objects (or empty array if no params)
          const mapped = savedParams
            .sort((a, b) => a.parameterNumber - b.parameterNumber)
            .map(sp => {
              const match = allParams.find(p => p.parameterCode === sp.parameterCode);
              return match ? { ...match, selected: true } : null;
            })
            .filter(Boolean) as ReportParameter[];

          this.assignedParameters.set(mapped);
          this.initialAssignedParameters.set([...mapped]);
          // Update save button state based on form validity
          this.updateSaveButtonState();
        },
        error: err => {
          console.error('Failed to load assigned parameters', err);
          this.assignedParameters.set([]);
          this.initialAssignedParameters.set([]);
        }
      });
    }

  /**
   * Navigate to home page
   */
  goHome(): void {
    this.router.navigate(['/home']);
  }
}