import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { MappingDetailPanel, MappingDetailPayload } from '../mapping-detail-panel/mapping-detail-panel';
import { ParameterDefinitionsComponent } from '../parameter-definitions/parameter-definitions';
import { AddParameterPanel, AddParameterPayload } from '../add-parameter-panel/add-parameter-panel';
import { ProcessMappingService } from '../../services/process-mapping.service';
import { ProcessMappingDto } from '../../interfaces/process-mapping.interface';
import { ParameterDefinitionService } from '../../services/parameter-definition.service';
import { ParameterDefinitionDto } from '../../interfaces/parameter-definition.interface';


@Component({
  selector: 'app-process-code-mappings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb,
    MappingDetailPanel,
    ParameterDefinitionsComponent,
    AddParameterPanel
  ],
  templateUrl: './process-code-mappings.html',
  styleUrls: ['./process-code-mappings.scss']
})
export class ProcessCodeMappingsComponent implements OnInit {
  @ViewChild(ParameterDefinitionsComponent) parameterDefsComponent?: ParameterDefinitionsComponent;

  processCode = '';

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchText = '';
  allMappings: ProcessMappingDto[] = [];
  filteredMappings: ProcessMappingDto[] = [];
  selectedMapping: ProcessMappingDto | null = null;

  isLoading = signal(false);
  totalRecords = 0;
  currentPage = 0;
  pageSize = 100;

  isDetailPanelOpen = false;
  detailPanelMode: 'add' | 'edit' = 'add';
  detailEditData: ProcessMappingDto | null = null;
  activeTab: 'mappings' | 'parameters' = 'mappings';

  // Parameters panel state
  isParamPanelOpen = false;
  paramPanelMode: 'add' | 'edit' = 'add';
  paramEditData: ParameterDefinitionDto | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mappingService: ProcessMappingService,
    private paramService: ParameterDefinitionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.processCode = this.route.snapshot.paramMap.get('code') ?? '';
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: 'EMF Processes', link: '/application-administration/common-validation/emf-processes' },
        { label: `Mappings-${this.processCode}`, link: null }
      ],
      title: `Mappings-${this.processCode}`,
      subtitle: '',
      actions: []
    };
    this.loadMappings();
  }

  loadMappings(autoSelect: boolean = true): void {
    this.isLoading.set(true);
    const skip = this.currentPage * this.pageSize;
    this.mappingService
      .getMappings(this.pageSize, skip, { processCode: this.processCode })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.allMappings = response.data;
          this.totalRecords = response.totalRecords;
          this.filteredMappings = [...this.allMappings];
          if (autoSelect && this.filteredMappings.length > 0) {
            this.onSelectMapping(this.filteredMappings[0]);
          }
        },
        error: () => {
          this.allMappings = [];
          this.filteredMappings = [];
        }
      });
  }

  onSearchInput(): void {
    const term = this.searchText.trim().toLowerCase();
    this.filteredMappings = !term
      ? [...this.allMappings]
      : this.allMappings.filter(m =>
          m.mappingName.toLowerCase().includes(term) ||
          (m.dataTableName && m.dataTableName.toLowerCase().includes(term)) ||
          (m.dataColumnName && m.dataColumnName.toLowerCase().includes(term)) ||
          (m.sqlStmt && m.sqlStmt.toLowerCase().includes(term))
        );
  }

  /**
   * Trim leading and trailing spaces when search input loses focus
   */
  onSearchBlur(): void {
    if (this.searchText) {
      const trimmedText = this.searchText.trim();
      if (this.searchText !== trimmedText) {
        this.searchText = trimmedText;
        // Re-filter with trimmed value
        this.onSearchInput();
      }
    }
  }

  /**
   * Prevent leading spaces from being typed
   */
  onSearchKeyDown(event: KeyboardEvent): void {
    if (event.key === ' ' || event.code === 'Space') {
      const input = event.target as HTMLInputElement;
      const cursorPosition = input.selectionStart || 0;

      // Prevent leading space (cursor at position 0)
      if (cursorPosition === 0) {
        event.preventDefault();
        return;
      }
    }
  }

  onAddMapping(): void {
    this.selectedMapping = null;
    this.detailEditData = null;
    this.detailPanelMode = 'add';
    this.isDetailPanelOpen = true;
  }

  onSelectMapping(item: ProcessMappingDto): void {
    this.selectedMapping = item;
    this.detailEditData = item;
    this.detailPanelMode = 'edit';
    this.isDetailPanelOpen = true;
  }

  onDetailPanelCancel(): void {
    this.isDetailPanelOpen = false;
    this.selectedMapping = null;
    this.detailEditData = null;
  }

  onDetailPanelSave(payload: MappingDetailPayload): void {
    if (this.detailPanelMode === 'add') {
      this.createMapping(payload);
    } else {
      this.updateMapping(payload);
    }
  }

  onDetailPanelSaveAndCreateAnother(payload: MappingDetailPayload): void {
    this.createMapping(payload, true);
  }

  private createMapping(payload: MappingDetailPayload, stayOpen = false): void {
    this.isLoading.set(true);
    this.mappingService
      .createMapping({
        processCode: this.processCode,
        mappingName: payload.mappingName,
        dataTableName: payload.dataTableName,
        dataColumnName: payload.dataColumnName,
        whereClause: payload.whereClause,
        sqlStmt: payload.sqlStmt
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.showSuccess(`Mapping "${payload.mappingName}" created successfully`);
          if (!stayOpen) {
            this.loadMappings();
            this.isDetailPanelOpen = false;
            this.selectedMapping = null;
            this.detailEditData = null;
          } else {
            // Keep panel open in add mode with empty form
            this.loadMappings(false);
            this.selectedMapping = null;
            this.detailEditData = null;
            this.detailPanelMode = 'add';
            this.isDetailPanelOpen = true;
          }
        }
      });
  }

  private updateMapping(payload: MappingDetailPayload): void {
    if (!this.selectedMapping) return;

    this.isLoading.set(true);
    this.mappingService
      .updateMapping(
        this.selectedMapping.processCode,
        this.selectedMapping.mappingName,
        {
          processCode: this.processCode,
          mappingName: payload.mappingName,
          originalMappingName: this.selectedMapping.mappingName !== payload.mappingName
            ? this.selectedMapping.mappingName
            : undefined,
          dataTableName: payload.dataTableName,
          dataColumnName: payload.dataColumnName,
          whereClause: payload.whereClause,
          sqlStmt: payload.sqlStmt
        }
      )
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.loadMappings();
          this.showSuccess(`Mapping "${payload.mappingName}" updated successfully`);
          this.isDetailPanelOpen = false;
          this.selectedMapping = null;
          this.detailEditData = null;
        }
      });
  }

  onParamAddNew(): void {
    this.paramEditData = null;
    this.paramPanelMode = 'add';
    this.isParamPanelOpen = true;
  }

  onParamEdit(param: ParameterDefinitionDto): void {
    this.paramEditData = param;
    this.paramPanelMode = 'edit';
    this.isParamPanelOpen = true;
  }

  onParamPanelCancel(): void {
    this.isParamPanelOpen = false;
    this.paramEditData = null;
  }

  closeSidePanel(): void {
    this.isParamPanelOpen = false;
    this.paramEditData = null;
  }

  onParamPanelSave(payload: AddParameterPayload): void {
    if (this.paramPanelMode === 'add') {
      this.createParameter(payload);
    } else {
      this.updateParameter(payload);
    }
  }

  private createParameter(payload: AddParameterPayload): void {
    this.isLoading.set(true);
    this.paramService
      .createParameter({
        procCode: this.processCode,
        parmNo: payload.parmNo,
        parmCode: payload.parmCode,
        parmType: payload.parmType,
        refTable: payload.refTable,
        refColumn: payload.refColumn,
        defaultValue: payload.defaultValue
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.closeSidePanel();
          this.parameterDefsComponent?.loadParameters();
          this.showSuccess(`Parameter "${payload.parmCode}" created successfully`);
        }
      });
  }

  private updateParameter(payload: AddParameterPayload): void {
    if (!this.paramEditData) return;

    this.isLoading.set(true);
    this.paramService
      .updateParameter(
        this.processCode,
        this.paramEditData.parmNo,
        {
          procCode: this.processCode,
          parmNo: payload.parmNo,
          parmCode: payload.parmCode,
          parmType: payload.parmType,
          refTable: payload.refTable,
          refColumn: payload.refColumn,
          defaultValue: payload.defaultValue,
          oldParmCode: payload.oldParmCode
        }
      )
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.closeSidePanel();
          this.parameterDefsComponent?.loadParameters();
          this.showSuccess(`Parameter "${payload.parmCode}" updated successfully`);
        }
      });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  trackById(_i: number, item: ProcessMappingDto): string {
    return `${item.processCode}-${item.mappingName}`;
  }

  getTableNameFromSql(sqlStmt?: string): string {
    if (!sqlStmt) return '';

    // Try to extract table name from SQL statement
    // Look for "FROM tablename" or "FROM schema.tablename"
    const fromMatch = sqlStmt.match(/FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
    if (fromMatch) {
      return fromMatch[1];
    }

    return '';
  }

  getDisplayPath(item: ProcessMappingDto): string {
    if (item.dataTableName) {
      return `${item.dataTableName} / ${item.mappingName}`;
    }

    if (item.sqlStmt) {
      const tableName = this.getTableNameFromSql(item.sqlStmt);
      return tableName ? `${tableName} / ${item.mappingName}` : item.mappingName;
    }

    return item.mappingName;
  }
}
