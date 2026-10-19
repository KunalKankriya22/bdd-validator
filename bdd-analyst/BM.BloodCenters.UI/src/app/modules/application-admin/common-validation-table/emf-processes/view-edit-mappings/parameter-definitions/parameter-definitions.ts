import { Component, EventEmitter, Output, Input, OnInit, OnChanges, SimpleChanges, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ParameterDefinitionService } from '../../services/parameter-definition.service';
import { ParameterDefinitionDto } from '../../interfaces/parameter-definition.interface';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

export interface ParameterDefinition {
  id: number;
  code: string;
  type: string;
  referenceTable: string;
  referenceColumn: string;
  defaultValue: string;
}

@Component({
  selector: 'app-parameter-definitions',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTableModule, MatTooltipModule],
  templateUrl: './parameter-definitions.html',
  styleUrls: ['./parameter-definitions.scss']
})
export class ParameterDefinitionsComponent implements OnInit, OnChanges {
  @Input() processCode = '';
  @Output() addNew = new EventEmitter<void>();
  @Output() editParam = new EventEmitter<ParameterDefinitionDto>();

  parameters = signal<ParameterDefinitionDto[]>([]);
  isLoading = signal(false);

  displayedColumns = ['code', 'type', 'referenceTable', 'referenceColumn', 'defaultValue', 'actions'];

  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  get count(): number { return this.parameters().length; }

  constructor(private paramService: ParameterDefinitionService) {}

  ngOnInit(): void {
    if (this.processCode) {
      this.loadParameters();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['processCode'] && !changes['processCode'].firstChange) {
      this.loadParameters();
    }
  }

  loadParameters(): void {
    if (!this.processCode) return;

    this.isLoading.set(true);
    this.paramService
      .getParameters(this.processCode)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => {
          this.parameters.set(data);
        },
        error: () => {
          this.parameters.set([]);
        }
      });
  }

  onAddNew(): void { this.addNew.emit(); }

  onEdit(param: ParameterDefinitionDto): void { this.editParam.emit(param); }

  onDelete(param: ParameterDefinitionDto): void {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Confirm Delete',
        message: `Are you sure you want to delete parameter "${param.parmCode}"?`,
        detail: 'This action cannot be undone. The parameter will be permanently removed from the system.',
        confirmText: 'DELETE PARAMETER',
        cancelText: 'CANCEL'
      } as ConfirmActionDialogData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.deleteParameter(param);
      }
    });
  }

  private deleteParameter(param: ParameterDefinitionDto): void {
    this.isLoading.set(true);
    this.paramService
      .deleteParameter(param.procCode, param.parmNo)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.loadParameters();
          this.showSuccess(`Parameter "${param.parmCode}" deleted successfully`);
        },
        error: () => {}
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

  trackById(_i: number, p: ParameterDefinitionDto): string {
    return `${p.procCode}-${p.parmNo}`;
  }
}
