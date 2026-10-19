import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, EMPTY, takeUntil, debounceTime, switchMap } from 'rxjs';
import { HeaderService } from '@shared/services/header.service';
import { NavigationNode, MenuParameter } from '../models/menu-item.model';
import { AddFunctionsService, AddFunction } from '../../menu-admin/add-functions/services/add-functions.service';

export interface MenuItemDialogData {
  mode: 'add' | 'edit';
  menuType: 'web' | 'onsite';
  menuItem?: NavigationNode;
  parentMenuOptions?: ParentMenuOption[];
  allMenuItems?: NavigationNode[]; // Full tree for calculating sequence options
}

export interface ParentMenuOption {
  id: string;
  label: string;
  level: number;
  displayLabel?: string;
}

export interface MenuItemDialogResult {
  menuType: 'web' | 'onsite';
  fcnId: number;
  function_name: string;
  label: string;
  mnemonic?: string | null;
  accessLevel?: string | null;
  parameter_1?: MenuParameter | null;
  parameter_2?: MenuParameter | null;
  parameter_3?: MenuParameter | null;
  remarks?: string | null;
  parentId: string;
  sequence: number;
  hidden: boolean;
}

@Component({
  selector: 'app-add-edit-menu-item',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatIconModule,
    MatRadioModule,
    FormsModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './add-edit-menu-item.component.html',
  styleUrls: ['./add-edit-menu-item.component.scss']
})
export class AddEditMenuItemDialogComponent implements OnInit, OnDestroy {
  dialogTitle: string;
  saveRequest = new Subject<MenuItemDialogResult>();

  // Form fields
  menuType: 'web' | 'onsite' = 'web';
  selectFunction: string = '';
  displayName: string = '';

  // Function selection (add mode)
  filteredFunctions: AddFunction[] = [];
  functionSearchControl = new FormControl('');
  selectedFcnId: string = '';
  functionsLoading: boolean = false;

  // Parameters (stored as separate key/value for UI, converted to MenuParameter on save)
  parameter1Key: string = '';
  parameter1Value: string = '';
  parameter2Key: string = '';
  parameter2Value: string = '';
  parameter3Key: string = '';
  parameter3Value: string = '';

  remarks: string = '';
  mnemonic: string = '';
  accessLevel: string = '';
  addToParentId: string = '';
  sequence: number | null = null;
  hideMenuItem: boolean = false;

  // Validation state (touched flags)
  selectFunctionTouched: boolean = false;
  displayNameTouched: boolean = false;
  addToTouched: boolean = false;
  sequenceTouched: boolean = false;

  // Parent menu options (with root level added)
  parentMenuOptions: ParentMenuOption[] = [];
  parentMenuSearchControl = new FormControl('');
  filteredParentMenuOptions: ParentMenuOption[] = [];

  // Sequence options (dynamically populated based on selected parent)
  sequenceOptions: number[] = [];

  // Store tree data for finding children count
  private allMenuItems: NavigationNode[] = [];

  private destroy$ = new Subject<void>();

  // Initial values snapshot for edit mode dirty tracking
  private initialValues: {
    displayName: string;
    mnemonic: string;
    accessLevel: string;
    parameter1Key: string; parameter1Value: string;
    parameter2Key: string; parameter2Value: string;
    parameter3Key: string; parameter3Value: string;
    remarks: string;
    addToParentId: string;
    sequence: number | null;
    hideMenuItem: boolean;
  } | null = null;

  constructor(
    public dialogRef: MatDialogRef<AddEditMenuItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MenuItemDialogData,
    private headerService: HeaderService,
    private addFunctionsService: AddFunctionsService
  ) {
    this.dialogTitle = data.mode === 'add' ? 'Add Menu Item' : 'Edit Menu Item';
    this.menuType = data.menuType;

    // Store tree data for calculating sequence options
    this.allMenuItems = data.allMenuItems || [];

    // Add root level option to parent menu options
    this.parentMenuOptions = [
      {
        id: '0',
        label: 'Main Menu',
        level: 0,
        displayLabel: '0. Main Menu'
      },
      ...(data.parentMenuOptions || [])
    ];

    // Populate fields if editing
    if (data.mode === 'edit' && data.menuItem) {
      const item = data.menuItem;
      this.selectFunction = item.function_name || '';
      this.displayName = item.label || '';

      // Extract parameters from MenuParameter objects
      if (item.parameter_1) {
        this.parameter1Key = item.parameter_1.key || '';
        this.parameter1Value = item.parameter_1.value || '';
      }
      if (item.parameter_2) {
        this.parameter2Key = item.parameter_2.key || '';
        this.parameter2Value = item.parameter_2.value || '';
      }
      if (item.parameter_3) {
        this.parameter3Key = item.parameter_3.key || '';
        this.parameter3Value = item.parameter_3.value || '';
      }

      this.remarks = item.remarks || '';
      this.mnemonic = item.mnemonic || '';
      this.accessLevel = item.accessLevel || '';

      // Get parentId from the data (passed from parent component)
      this.addToParentId = (item as any).parentId || '0';

      this.sequence = item.sequence || null;
      this.hideMenuItem = item.hidden || false;

      // Snapshot initial values for dirty tracking
      this.initialValues = {
        displayName: this.displayName,
        mnemonic: this.mnemonic,
        accessLevel: this.accessLevel,
        parameter1Key: this.parameter1Key, parameter1Value: this.parameter1Value,
        parameter2Key: this.parameter2Key, parameter2Value: this.parameter2Value,
        parameter3Key: this.parameter3Key, parameter3Value: this.parameter3Value,
        remarks: this.remarks,
        addToParentId: this.addToParentId,
        sequence: this.sequence,
        hideMenuItem: this.hideMenuItem
      };
    }
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();

    // Initialize filtered parent menu options
    this.filteredParentMenuOptions = [...this.parentMenuOptions];

    // Setup search functionality
    this.setupParentMenuSearch();

    // Setup server-side function search for add mode
    if (this.data.mode === 'add') {
      this.setupFunctionSearch();
    }

    // Initialize sequence options if parent is already selected
    if (this.addToParentId) {
      this.updateSequenceOptions();
    } else if (this.data.mode === 'add') {
      // Default to root level for add mode
      this.addToParentId = '0';
      this.updateSequenceOptions();
      this.sequence = 1; // Default to sequence 1
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to chapter change events from header
   * Empty subscription as this is a dialog with no dropdown data to reload
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Empty subscription - no dropdown data to reload
      });
  }

  private setupParentMenuSearch(): void {
    this.parentMenuSearchControl.valueChanges.subscribe(searchTerm => {
      const term = (searchTerm as string || '').toLowerCase();
      this.filteredParentMenuOptions = this.parentMenuOptions.filter(option =>
        option.label.toLowerCase().includes(term) ||
        option.id.toLowerCase().includes(term) ||
        (option.displayLabel && option.displayLabel.toLowerCase().includes(term))
      );
    });
  }

  private setupFunctionSearch(): void {
    // Load initial results
    this.searchFunctions('');

    // Server-side search with debounce
    this.functionSearchControl.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$),
        switchMap(searchTerm => {
          const term = (searchTerm as string || '').trim();
          if (this.selectedFcnId && !term) {
            return EMPTY;
          }
          this.functionsLoading = true;
          return this.addFunctionsService.getAddFunctions(0, 50, {
            searchKeyword: term || undefined
          });
        })
      )
      .subscribe({
        next: (response) => {
          this.filteredFunctions = response.data || [];
          this.functionsLoading = false;
        },
        error: () => {
          this.filteredFunctions = [];
          this.functionsLoading = false;
        }
      });
  }

  private searchFunctions(keyword: string): void {
    this.functionsLoading = true;
    this.addFunctionsService.getAddFunctions(0, 50, {
      searchKeyword: keyword || undefined
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.filteredFunctions = response.data || [];
          this.functionsLoading = false;
        },
        error: () => {
          this.filteredFunctions = [];
          this.functionsLoading = false;
        }
      });
  }

  onFunctionSelected(): void {
    const selected = this.filteredFunctions.find(f => f.fcnId === this.selectedFcnId);
    if (selected) {
      this.selectFunction = selected.execName;
      this.parameter1Key = selected.p1Name || '';
      this.parameter2Key = selected.p2Name || '';
      this.parameter3Key = selected.p3Name || '';
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    // Mark all required fields as touched for validation display
    this.selectFunctionTouched = true;
    this.displayNameTouched = true;
    this.addToTouched = true;
    this.sequenceTouched = true;

    // Validate all required fields
    if (!this.isFormValid()) {
      return;
    }

    // Build MenuParameter objects only if both key and value are provided
    const param1 = this.parameter1Key.trim() && this.parameter1Value.trim()
      ? { key: this.parameter1Key.trim(), value: this.parameter1Value.trim() }
      : null;

    const param2 = this.parameter2Key.trim() && this.parameter2Value.trim()
      ? { key: this.parameter2Key.trim(), value: this.parameter2Value.trim() }
      : null;

    const param3 = this.parameter3Key.trim() && this.parameter3Value.trim()
      ? { key: this.parameter3Key.trim(), value: this.parameter3Value.trim() }
      : null;

    const result: MenuItemDialogResult = {
      menuType: this.menuType,
      fcnId: this.selectedFcnId ? parseInt(this.selectedFcnId) : 0,
      function_name: this.selectFunction.trim(),
      label: this.displayName.trim(),
      mnemonic: this.mnemonic.trim() || null,
      accessLevel: this.accessLevel || null,
      parameter_1: param1,
      parameter_2: param2,
      parameter_3: param3,
      remarks: this.remarks.trim() || null,
      parentId: this.addToParentId || '0',
      sequence: this.sequence || 1,
      hidden: this.hideMenuItem
    };

    this.saveRequest.next(result);
  }

  /**
   * Update sequence options when parent menu changes
   */
  private updateSequenceOptions(): void {
    if (!this.addToParentId) {
      this.sequenceOptions = [];
      return;
    }

    // Find the parent node in the tree
    const parent = this.findMenuById(this.allMenuItems, this.addToParentId);
    if (!parent) {
      this.sequenceOptions = [1];
      return;
    }

    // Get children of the selected parent
    const siblings = parent.id === '0' ? this.allMenuItems : (parent.children || []);

    // For add mode, max sequence is children count + 1 (to add at the end)
    // For edit mode, max sequence is children count (item already exists)
    const maxSequence = this.data.mode === 'add' ? siblings.length + 1 : siblings.length;

    // Generate sequence options from 1 to maxSequence
    this.sequenceOptions = Array.from({ length: maxSequence }, (_, i) => i + 1);
  }

  /**
   * Find a menu item by ID in the tree
   */
  private findMenuById(nodes: NavigationNode[], id: string): NavigationNode | null {
    if (id === '0') {
      // Return a virtual root node
      return {
        id: '0',
        label: 'Main Menu',
        type: 'MENU',
        sequence: 0,
        access_lvl: 0,
        hidden: false,
        function_name: '',
        children: nodes
      };
    }

    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = this.findMenuById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  isFormValid(): boolean {
    return this.isSelectFunctionValid() &&
           this.isDisplayNameValid();
  }

  hasChanges(): boolean {
    if (!this.initialValues) return true; // add mode — always enabled
    return this.displayName !== this.initialValues.displayName ||
           this.parameter1Key !== this.initialValues.parameter1Key ||
           this.parameter1Value !== this.initialValues.parameter1Value ||
           this.parameter2Key !== this.initialValues.parameter2Key ||
           this.parameter2Value !== this.initialValues.parameter2Value ||
           this.parameter3Key !== this.initialValues.parameter3Key ||
           this.parameter3Value !== this.initialValues.parameter3Value ||
           this.remarks !== this.initialValues.remarks ||
           this.addToParentId !== this.initialValues.addToParentId ||
           this.sequence !== this.initialValues.sequence ||
           this.hideMenuItem !== this.initialValues.hideMenuItem;
  }

  // Validation methods
  isSelectFunctionValid(): boolean {
    if (this.data.mode === 'add') {
      return !!this.selectedFcnId;
    }
    return true;
  }

  isDisplayNameValid(): boolean {
    return this.displayName.trim().length > 0;
  }

  isAddToValid(): boolean {
    return this.addToParentId !== null && this.addToParentId !== undefined && this.addToParentId !== '';
  }

  isSequenceValid(): boolean {
    return this.sequence !== null && this.sequence > 0;
  }

  // Error message getters
  getSelectFunctionError(): string {
    if (!this.selectFunctionTouched) return '';
    if (!this.isSelectFunctionValid()) {
      return 'Select Function is required';
    }
    return '';
  }

  getDisplayNameError(): string {
    if (!this.displayNameTouched) return '';
    if (!this.isDisplayNameValid()) {
      return 'Display Name is required';
    }
    return '';
  }

  getAddToError(): string {
    if (!this.addToTouched) return '';
    if (!this.isAddToValid()) {
      return 'Add to parent menu is required';
    }
    return '';
  }

  getSequenceError(): string {
    if (!this.sequenceTouched) return '';
    if (!this.isSequenceValid()) {
      return 'Sequence is required';
    }
    return '';
  }

  // Touch handlers
  onSelectFunctionBlur(): void {
    this.selectFunctionTouched = true;
  }

  onDisplayNameBlur(): void {
    this.displayNameTouched = true;
  }

  onAddToChange(): void {
    this.addToTouched = true;
    // Update sequence options when parent changes
    this.updateSequenceOptions();
    // Reset sequence to 1 when parent changes
    this.sequence = 1;
  }

  onSequenceChange(): void {
    this.sequenceTouched = true;
  }

  // Input sanitization handlers
  onDisplayNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    // Limit to 40 characters (enforced by maxlength attribute)
    if (value.length > 40) {
      this.displayName = value.substring(0, 40);
      input.value = this.displayName;
    }
  }

  onRemarksInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    // Limit to 120 characters (enforced by maxlength attribute)
    if (value.length > 120) {
      this.remarks = value.substring(0, 120);
      input.value = this.remarks;
    }
  }

  onParameterInput(event: Event, parameterType: 'key' | 'value', parameterNumber: 1 | 2 | 3): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    // Limit to 20 characters (enforced by maxlength attribute)
    if (value.length > 20) {
      const sanitized = value.substring(0, 20);

      if (parameterNumber === 1) {
        if (parameterType === 'key') {
          this.parameter1Key = sanitized;
        } else {
          this.parameter1Value = sanitized;
        }
      } else if (parameterNumber === 2) {
        if (parameterType === 'key') {
          this.parameter2Key = sanitized;
        } else {
          this.parameter2Value = sanitized;
        }
      } else if (parameterNumber === 3) {
        if (parameterType === 'key') {
          this.parameter3Key = sanitized;
        } else {
          this.parameter3Value = sanitized;
        }
      }

      input.value = sanitized;
    }
  }

  // Helper properties for error state classes
  get hasSelectFunctionError(): boolean {
    return this.selectFunctionTouched && !this.isSelectFunctionValid();
  }

  get hasDisplayNameError(): boolean {
    return this.displayNameTouched && !this.isDisplayNameValid();
  }

  get hasAddToError(): boolean {
    return this.addToTouched && !this.isAddToValid();
  }

  get hasSequenceError(): boolean {
    return this.sequenceTouched && !this.isSequenceValid();
  }

  // Get indented label for parent menu options based on level
  getIndentedLabel(option: ParentMenuOption): string {
    const indent = '  '.repeat(option.level);
    return indent + (option.displayLabel || option.label);
  }
  
}