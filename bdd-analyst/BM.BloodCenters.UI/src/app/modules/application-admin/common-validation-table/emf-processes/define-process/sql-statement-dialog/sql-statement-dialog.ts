import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ProcessStep } from '../process-steps-list/process-steps-list';
import { ReflexiveAction } from '../reflexive-actions-list/reflexive-actions-list';
import { ReflexiveActionDetailsData } from '../reflexive-action-details/reflexive-action-details';

export interface SqlStatementDialogData {
  processCode: string;
  processSteps: ProcessStep[];
  reflexiveActions: ReflexiveAction[];
  selectedActionData: ReflexiveActionDetailsData | null;
}

@Component({
  selector: 'app-sql-statement-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule],
  templateUrl: './sql-statement-dialog.html',
  styleUrls: ['./sql-statement-dialog.scss']
})
export class SqlStatementDialogComponent {
  sql: string = '';
  copied = false;

  constructor(
    public dialogRef: MatDialogRef<SqlStatementDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SqlStatementDialogData
  ) {
    this.sql = this.generateSql();
  }

  private parseOrder(str: string): number[] {
    if (!str) return [];
    return str.replace(/[^0-9,]/g, ' ')
      .split(/[\s,]+/)
      .map(s => parseInt(s, 10))
      .filter(n => !isNaN(n));
  }

  private findStep(num: number): ProcessStep | undefined {
    return this.data.processSteps.find(s => Math.floor(parseFloat(s.sequence)) === num);
  }

  private generateSql(): string {
    const { processCode, selectedActionData: ad, reflexiveActions } = this.data;
    if (!ad) return '-- No action selected';

    const action = reflexiveActions.find(a => a.code === ad.group);
    const actionName = action ? `${action.code} - ${action.name}` : ad.group;
    const operator = (ad.operator || 'OR').toUpperCase();

    const mainNums = this.parseOrder(ad.processOrder);
    const altOrder = ad.alternateProcessOrder || '';
    const opIdx = altOrder.toUpperCase().indexOf(operator);

    let linearNums: number[] = [];
    let branchNums: number[] = [];

    if (opIdx > -1) {
      linearNums = this.parseOrder(altOrder.substring(0, opIdx));
      branchNums = mainNums.filter(n => !linearNums.includes(n));
    } else {
      linearNums = mainNums;
    }

    const allStepNums = [...linearNums, ...branchNums];
    const lines: string[] = [];

    // Header
    lines.push(`-- Process: ${actionName}`);
    lines.push(`-- Define Process - ${processCode}`);
    lines.push(`-- Generated SQL for Process Steps`);

    // One SELECT block per step
    for (const num of allStepNums) {
      const step = this.findStep(num);
      if (!step) continue;

      lines.push('');
      lines.push(`-- Step ${step.sequence}: ${step.name}`);

      // One comment line per condition
      for (const cond of step.conditions) {
        const desc = cond.description.includes('|')
          ? cond.description.split('|')[1].trim()
          : cond.description;
        lines.push(`-- ${cond.sequence} ${desc}`);
      }

      lines.push(`SELECT *`);
      lines.push(`FROM ${ad.tableName}`);

      // Build WHERE clauses from conditions
      const whereParts: string[] = [];
      for (const cond of step.conditions) {
        const raw = cond.description.includes('|')
          ? cond.description.split('|')[1].trim()
          : cond.description;
        const parts = raw.split(',').map(p => p.trim());
        if (parts.length >= 3) {
          const colPart = parts[0].split('/').map(p => p.trim());
          const col = colPart[colPart.length - 1];
          const op = parts[1];
          const val = parts[2];
          if (op === 'IS' && val === 'NULL') {
            whereParts.push(`${col} IS NULL`);
          } else {
            whereParts.push(`${col} = '${val}'`);
          }
        }
      }

      // For the action node step, add action-level WHERE clauses
      const isLastStep = num === allStepNums[allStepNums.length - 1];
      if (isLastStep && action) {
        whereParts.push(`Action = '${ad.action}'`);
        whereParts.push(`Process_Order = '${ad.processOrder}'`);
        whereParts.push(`Alternate_Process_Order IN ('${altOrder}')`);
        if (ad.response) whereParts.push(`Response = '${ad.response}'`);
        if (action.badge) whereParts.push(`Functions = '${action.badge}'`);
      }

      if (whereParts.length > 0) {
        lines.push(`WHERE ${whereParts[0]}`);
        for (let i = 1; i < whereParts.length; i++) {
          lines.push(`  AND ${whereParts[i]}`);
        }
        lines[lines.length - 1] += ';';
      }
    }

    return lines.join('\n');
  }

  onCopy(): void {
    navigator.clipboard.writeText(this.sql);
    this.copied = true;
    setTimeout(() => this.copied = false, 1000);
  }

  onGenerateSql(): void {
    this.sql = this.generateSql();
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
