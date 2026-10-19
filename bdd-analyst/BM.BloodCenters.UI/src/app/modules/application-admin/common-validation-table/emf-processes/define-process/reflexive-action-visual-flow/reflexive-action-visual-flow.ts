import {
  Component, Input, OnChanges, SimpleChanges,
  ElementRef, ViewChild, AfterViewInit, NgZone, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProcessStep } from '../process-steps-list/process-steps-list';
import { ReflexiveAction } from '../reflexive-actions-list/reflexive-actions-list';
import { ReflexiveActionDetailsData } from '../reflexive-action-details/reflexive-action-details';

export interface FlowNode {
  type: 'step' | 'operator' | 'action';
  id: string;
  title: string;
  conditions: string[];
  badge?: string;
  // layout
  col: number; // 0=left, 1=center, 2=right
  row: number; // grid row
}

export interface FlowLayout {
  nodes: FlowNode[];
  // SVG connector descriptors
  connectors: FlowConnector[];
  canvasWidth: number;
  canvasHeight: number;
}

export interface FlowConnector {
  type: 'solid' | 'dashed';
  path: string; // SVG path d attribute
  hasArrow: boolean;
  arrowX: number;
  arrowY: number;
  arrowDir: 'down' | 'right' | 'left';
}

// Layout constants
const COL_X     = [60, 500, 900];   // col 0=left branch, col 1=right branch, col 2=far-right
const NODE_W    = 280;
const NODE_H_BASE = 52;
const COND_H    = 18;
const ROW_GAP   = 44;
const OP_SIZE   = 52;               // diamond half-diagonal px
const CANVAS_PAD = 32;

// Diamond center-X sits between col-0 right-edge and col-1 left-edge
// col-0 right = 60+280=340, col-1 left = 500  → midpoint = (340+500)/2 = 420
const DIAMOND_CX = 420;             // diamond center-x
const DIAMOND_X  = DIAMOND_CX - NODE_W / 2; // left-x of bounding box for nodeX()

@Component({
  selector: 'app-reflexive-action-visual-flow',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reflexive-action-visual-flow.html',
  styleUrls: ['./reflexive-action-visual-flow.scss']
})
export class ReflexiveActionVisualFlowComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() actionData: ReflexiveActionDetailsData | null = null;
  @Input() processSteps: ProcessStep[] = [];
  @Input() reflexiveActions: ReflexiveAction[] = [];

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLDivElement>;

  layout: FlowLayout = { nodes: [], connectors: [], canvasWidth: 1000, canvasHeight: 600 };

  // zoom state
  scale = 1;
  rowYMap: number[] = [];   // rowIndex -> Y px, populated in buildLayout
  private wheelListener!: (e: WheelEvent) => void;

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.wheelListener = (e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        this.zone.run(() => {
          this.scale = Math.min(2, Math.max(0.3, this.scale + delta));
        });
      };
      this.canvasRef?.nativeElement.addEventListener('wheel', this.wheelListener, { passive: false });
    });
  }

  ngOnDestroy(): void {
    this.canvasRef?.nativeElement.removeEventListener('wheel', this.wheelListener);
  }

  ngOnChanges(_: SimpleChanges): void {
    this.buildLayout();
  }

  // ── Layout builder ──────────────────────────────────────────────────────────

  private buildLayout(): void {
    if (!this.actionData || !this.processSteps.length) {
      this.layout = { nodes: [], connectors: [], canvasWidth: 800, canvasHeight: 400 };
      return;
    }

    const nodes: FlowNode[] = [];
    const connectors: FlowConnector[] = [];

    const mainNums = this.parseOrder(this.actionData.processOrder);
    const altOrder = this.actionData.alternateProcessOrder || '';
    const operator = (this.actionData.operator || 'OR').toUpperCase();

    // Determine linear steps (before OR) and branch steps
    let linearNums: number[] = [];
    let branchNums: number[] = [];

    const opIdx = altOrder.toUpperCase().indexOf(operator);
    if (opIdx > -1) {
      linearNums = this.parseOrder(altOrder.substring(0, opIdx));
      branchNums = mainNums.filter(n => !linearNums.includes(n));
    } else {
      linearNums = mainNums;
    }

    // Row heights map: rowIndex -> height in px
    const rowHeights: number[] = [];

    // ── Place linear steps in col 0 ──────────────────────────────────────────
    let currentRow = 0;
    for (const num of linearNums) {
      const step = this.findStep(num);
      if (!step) continue;
      const node = this.makeStepNode(step, 0, currentRow);
      nodes.push(node);
      rowHeights[currentRow] = this.nodeHeight(node);
      currentRow++;
    }

    // ── Place OR diamond in col 1, same row as last linear step ─────────────
    let opRow = -1;
    if (branchNums.length > 0) {
      opRow = currentRow - 1; // same row as last linear step
      const opNode: FlowNode = {
        type: 'operator', id: 'op', title: operator, conditions: [],
        col: 1, row: opRow
      };
      nodes.push(opNode);
      // ensure row height fits diamond
      rowHeights[opRow] = Math.max(rowHeights[opRow] || 0, OP_SIZE * 2 + 20);
    }

    // ── Place branch steps in cols 0,1,2 ────────────────────────────────────
    let branchRow = -1;
    if (branchNums.length > 0) {
      branchRow = currentRow;
      const cols = branchNums.length === 3 ? [0, 1, 2] : branchNums.length === 2 ? [0, 1] : [0];
      branchNums.forEach((num, i) => {
        const step = this.findStep(num);
        if (!step) return;
        const node = this.makeStepNode(step, cols[i] ?? i, branchRow);
        nodes.push(node);
        rowHeights[branchRow] = Math.max(rowHeights[branchRow] || 0, this.nodeHeight(node));
      });
      currentRow++;
    }

    // ── Place action node in col 0 ───────────────────────────────────────────
    const action = this.reflexiveActions.find(a => a.code === this.actionData?.group);
    let actionRow = -1;
    if (action) {
      actionRow = currentRow;
      const actionNode: FlowNode = {
        type: 'action',
        id: action.id,
        title: `${action.code} - ${action.name}`,
        conditions: this.getActionConditions(),
        badge: action.badge,
        col: 0,
        row: actionRow
      };
      nodes.push(actionNode);
      rowHeights[actionRow] = this.nodeHeight(actionNode);
      currentRow++;
    }

    // ── Compute Y positions ──────────────────────────────────────────────────
    const rowY: number[] = [];
    let y = CANVAS_PAD;
    for (let r = 0; r < currentRow; r++) {
      rowY[r] = y;
      y += (rowHeights[r] || NODE_H_BASE) + ROW_GAP;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    const cx  = (col: number) => COL_X[col] + NODE_W / 2;  // center-x of col
    const bot = (row: number, col: number) => {             // bottom-y of node
      const n = nodes.find(nd => nd.row === row && nd.col === col);
      return rowY[row] + (n ? this.nodeHeight(n) : NODE_H_BASE);
    };
    const top = (row: number) => rowY[row];                 // top-y of row
    const mcy = (row: number, col: number) => {             // mid-y of node
      const n = nodes.find(nd => nd.row === row && nd.col === col);
      return rowY[row] + (n ? this.nodeHeight(n) : NODE_H_BASE) / 2;
    };

    // ── Solid arrows between linear steps (col 0) ────────────────────────────
    for (let i = 0; i < linearNums.length - 1; i++) {
      const x  = cx(0);
      const y1 = bot(i, 0);
      const y2 = top(i + 1) - 8;   // stop 8px short, arrowhead tip lands at node top
      connectors.push(this.solidArrow(`M ${x} ${y1} V ${y2}`, x, y2));
    }

    if (branchNums.length > 0 && opRow > -1) {
      // Diamond anchor points — center diamond at the step node's midpoint
      const opCX    = DIAMOND_CX;
      const lastLinStep = nodes.find(n => n.row === opRow && n.type === 'step');
      const opCY    = rowY[opRow] + (lastLinStep ? this.nodeHeight(lastLinStep) : (rowHeights[opRow] || OP_SIZE * 2 + 20)) / 2;
      const opBot   = opCY + OP_SIZE;
      const opLeft  = opCX - OP_SIZE;
      const opRight = opCX + OP_SIZE;

      const lastLinRow = linearNums.length - 1;
      const stepRightX = COL_X[0] + NODE_W;  // right edge of last linear step
      const stepMidY   = mcy(lastLinRow, 0);

      // ── Dashed: last linear step right-edge → diamond LEFT point ─────────
      // Stop 8px before left point so arrowhead tip lands exactly on it
      connectors.push(this.dashedPath(
        `M ${stepRightX} ${stepMidY} H ${opLeft - 20} V ${opCY} H ${opLeft - 8}`,
        opLeft - 8, opCY, 'right'
      ));

      // ── Dashed: diamond → each branch step ───────────────────────────────
      const branchCols = branchNums.length === 3 ? [0, 1, 2]
                       : branchNums.length === 2 ? [0, 1] : [0];

      branchNums.forEach((_, i) => {
        const col = branchCols[i] ?? i;
        const bx  = cx(col);
        const by  = top(branchRow);

        if (col === 0) {
          // diamond BOTTOM → down to midpoint between diamond and branch → left to col-0 center → down to branch top
          const midY = opBot + ROW_GAP / 2;
          connectors.push(this.dashedPath(
            `M ${opCX} ${opBot} V ${midY} H ${bx} V ${by - 8}`,
            bx, by - 8, 'down'
          ));
        } else {
          // diamond RIGHT → horizontal to branch center-X → down to branch top
          connectors.push(this.dashedPath(
            `M ${opRight} ${opCY} H ${bx} V ${by - 8}`,
            bx, by - 8, 'down'
          ));
        }
      });

    }

    // ── Solid arrow: last block before action → action top ─────────────────
    if (actionRow > 0) {
      const prevRow = actionRow - 1;
      const x  = cx(0);
      const y1 = bot(prevRow, 0);
      const y2 = top(actionRow) - 8;
      if (y2 > y1) {
        connectors.push(this.solidArrow(`M ${x} ${y1} V ${y2}`, x, y2));
      }
    }

    // Expose rowY for template helpers
    this.rowYMap = rowY;

    // Canvas size — account for diamond position and all branch columns
    const maxNodeX = Math.max(
      ...nodes.filter(n => n.type !== 'operator').map(n => COL_X[n.col] + NODE_W),
      DIAMOND_CX + OP_SIZE + CANVAS_PAD
    );
    const maxX = maxNodeX + CANVAS_PAD;
    const maxY = y + CANVAS_PAD;

    this.layout = { nodes, connectors, canvasWidth: maxX, canvasHeight: maxY };
  }

  // ── Node helpers ─────────────────────────────────────────────────────────────

  private makeStepNode(step: ProcessStep, col: number, row: number): FlowNode {
    return {
      type: 'step',
      id: step.id,
      title: `${step.sequence} ${step.name}`,
      conditions: step.conditions.map(c => {
        const parts = c.description.split('|');
        const desc = parts.length === 2 ? parts[1].trim() : c.description;
        return `${c.sequence} ${desc}`;
      }),
      col, row
    };
  }

  nodeHeight(node: FlowNode): number {
    if (node.type === 'operator') return OP_SIZE * 2 + 20;
    const contentWidth = NODE_W - 24;
    const avgCharWidth = 5.8;
    let condHeight = 0;
    for (const cond of node.conditions) {
      const lines = Math.max(1, Math.ceil((cond.length * avgCharWidth) / contentWidth));
      condHeight += lines * COND_H;
    }
    return NODE_H_BASE + condHeight;
  }

  nodeX(node: FlowNode): number {
    return node.type === 'operator' ? DIAMOND_X : COL_X[node.col];
  }

  nodeY(node: FlowNode): number { return this.rowYMap[node.row] ?? 0; }

  private getActionConditions(): string[] {
    if (!this.actionData) return [];
    return [
      `4.01 ${this.actionData.actionOn} / ${this.actionData.columnName}, EQ, CHAG`,
      `4.02 ${this.actionData.actionOn} / result_code, IS, NULL`
    ];
  }

  // ── Connector builders ───────────────────────────────────────────────────────

  private solidArrow(path: string, ax: number, ay: number): FlowConnector {
    return { type: 'solid', path, hasArrow: true, arrowX: ax, arrowY: ay, arrowDir: 'down' };
  }

  private dashedPath(path: string, ax: number, ay: number, dir: 'down' | 'right' | 'left'): FlowConnector {
    return { type: 'dashed', path, hasArrow: true, arrowX: ax, arrowY: ay, arrowDir: dir };
  }


  // ── Utilities ────────────────────────────────────────────────────────────────

  private parseOrder(str: string): number[] {
    if (!str) return [];
    return str.replace(/[^0-9,]/g, ' ')
      .split(/[\s,]+/)
      .map(s => parseInt(s, 10))
      .filter(n => !isNaN(n));
  }

  private findStep(num: number): ProcessStep | undefined {
    return this.processSteps.find(s => Math.floor(parseFloat(s.sequence)) === num);
  }

  arrowPoints(c: FlowConnector): string {
    const s = 6;
    const { arrowX: x, arrowY: y, arrowDir: dir } = c;
    if (dir === 'down')  return `${x},${y} ${x - s},${y - s * 1.5} ${x + s},${y - s * 1.5}`;
    if (dir === 'right') return `${x},${y} ${x - s * 1.5},${y - s} ${x - s * 1.5},${y + s}`;
    return `${x},${y} ${x + s * 1.5},${y - s} ${x + s * 1.5},${y + s}`;
  }

  diamondPoints(node: FlowNode): string {
    const cy = this.diamondCenterY(node);
    return `${DIAMOND_CX},${cy - OP_SIZE} ${DIAMOND_CX + OP_SIZE},${cy} ${DIAMOND_CX},${cy + OP_SIZE} ${DIAMOND_CX - OP_SIZE},${cy}`;
  }

  diamondTextX(_node: FlowNode): number { return DIAMOND_CX; }
  diamondTextY(node: FlowNode): number  { return this.diamondCenterY(node) + 5; }

  private diamondCenterY(node: FlowNode): number {
    const stepNode = this.layout.nodes.find(n => n.row === node.row && n.type === 'step');
    const h = stepNode ? this.nodeHeight(stepNode) : this.nodeHeight(node);
    return this.nodeY(node) + h / 2;
  }
}
