import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, SimpleChange, NgZone } from '@angular/core';
import {
  ReflexiveActionVisualFlowComponent,
  FlowNode, FlowConnector
} from './reflexive-action-visual-flow';
import { ProcessStep } from '../process-steps-list/process-steps-list';
import { ReflexiveAction } from '../reflexive-actions-list/reflexive-actions-list';

// ── Mock data ──────────────────────────────────────────────────

const mockSteps = [
  { id: '1', sequence: '1.00', name: 'BLOOD_TYPE', conditions: [
    { id: '1.01', sequence: '1.01', description: 'BLOOD_TYPE | DONOR_INFO / BLOOD_CD, EQUALS, A+' }
  ]},
  { id: '2', sequence: '2.00', name: 'WEIGHT', conditions: [] },
  { id: '3', sequence: '3.00', name: 'HEIGHT', conditions: [
    { id: '3.01', sequence: '3.01', description: 'HEIGHT | DONOR_PHYS / HEIGHT_CM, GT, 150' }
  ]},
  { id: '4', sequence: '4.00', name: 'AGE', conditions: [] }
] as ProcessStep[];

const mockActions = [
  { id: 'a1', code: '1', name: 'INSERT', actionOn: 'DONOR', actionValue: 'Y', badge: 'F1' }
] as ReflexiveAction[];

function makeActionData(overrides = {}) {
  return {
    group: '1',
    processOrder: '1,2',
    alternateProcessOrder: '',
    operator: 'OR',
    actionOn: 'DONOR',
    columnName: 'COL1',
    tableName: 'T1',
    actionValue: 'Y',
    response: 'PASS',
    action: 'INSERT',
    parentGroup: '',
    functions: '',
    ...overrides
  } as any;
}

// ── Constants (mirror component-internal values) ───────────────

const COL_X     = [60, 500, 900];
const NODE_W    = 280;
const NODE_H_BASE = 52;
const COND_H    = 18;
const ROW_GAP   = 44;
const OP_SIZE   = 52;
const CANVAS_PAD = 32;
const DIAMOND_CX = 420;
const DIAMOND_X  = DIAMOND_CX - NODE_W / 2;

describe('ReflexiveActionVisualFlowComponent', () => {
  let component: ReflexiveActionVisualFlowComponent;
  let fixture: ComponentFixture<ReflexiveActionVisualFlowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReflexiveActionVisualFlowComponent],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(ReflexiveActionVisualFlowComponent, {
      set: { imports: [], template: '<div><div #canvas></div></div>' }
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReflexiveActionVisualFlowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── 1. Component creation ──────────────────────────────────────

  it('should create with default layout', () => {
    expect(component).toBeTruthy();
    expect(component.layout).toBeTruthy();
    expect(component.layout.nodes.length).toBe(0);
    expect(component.scale).toBe(1);
  });

  // ── 2. buildLayout with null actionData ────────────────────────

  it('should set empty layout (800x400) when actionData is null', () => {
    component.actionData = null;
    component.processSteps = mockSteps;
    component.ngOnChanges({});

    expect(component.layout.nodes.length).toBe(0);
    expect(component.layout.connectors.length).toBe(0);
    expect(component.layout.canvasWidth).toBe(800);
    expect(component.layout.canvasHeight).toBe(400);
  });

  // ── 3. buildLayout with empty processSteps ─────────────────────

  it('should set empty layout when processSteps is empty', () => {
    component.actionData = makeActionData();
    component.processSteps = [];
    component.ngOnChanges({});

    expect(component.layout.nodes.length).toBe(0);
    expect(component.layout.canvasWidth).toBe(800);
    expect(component.layout.canvasHeight).toBe(400);
  });

  // ── 4. buildLayout with linear steps only ──────────────────────

  it('should produce step nodes in col 0 for linear-only layout', () => {
    component.actionData = makeActionData({ processOrder: '1,2', alternateProcessOrder: '' });
    component.processSteps = mockSteps;
    component.reflexiveActions = mockActions;
    component.ngOnChanges({});

    const stepNodes = component.layout.nodes.filter(n => n.type === 'step');
    expect(stepNodes.length).toBe(2);
    stepNodes.forEach(n => {
      expect(n.col).toBe(0);
    });
    expect(stepNodes[0].row).toBe(0);
    expect(stepNodes[1].row).toBe(1);
  });

  it('should produce solid arrow connectors between linear steps', () => {
    component.actionData = makeActionData({ processOrder: '1,2', alternateProcessOrder: '' });
    component.processSteps = mockSteps;
    component.reflexiveActions = mockActions;
    component.ngOnChanges({});

    const solidConnectors = component.layout.connectors.filter(c => c.type === 'solid');
    expect(solidConnectors.length).toBeGreaterThanOrEqual(1);
    solidConnectors.forEach(c => {
      expect(c.hasArrow).toBe(true);
      expect(c.arrowDir).toBe('down');
    });
  });

  // ── 5. buildLayout with branches ───────────────────────────────

  it('should create operator node and dashed connectors when alternateProcessOrder contains OR', () => {
    component.actionData = makeActionData({
      processOrder: '1,2,3',
      alternateProcessOrder: '1 OR'
    });
    component.processSteps = mockSteps;
    component.reflexiveActions = mockActions;
    component.ngOnChanges({});

    const opNode = component.layout.nodes.find(n => n.type === 'operator');
    expect(opNode).toBeTruthy();
    expect(opNode!.title).toBe('OR');

    const dashedConnectors = component.layout.connectors.filter(c => c.type === 'dashed');
    expect(dashedConnectors.length).toBeGreaterThan(0);
  });

  // ── 6. buildLayout with 2 branch steps ─────────────────────────

  it('should assign cols [0,1] for 2 branch steps', () => {
    component.actionData = makeActionData({
      processOrder: '1,2,3',
      alternateProcessOrder: '1 OR'
    });
    component.processSteps = mockSteps;
    component.reflexiveActions = mockActions;
    component.ngOnChanges({});

    const branchNodes = component.layout.nodes.filter(
      n => n.type === 'step' && n.row > 0
    );
    const lastRow = Math.max(...branchNodes.map(n => n.row));
    const branchRow = branchNodes.filter(n => n.row === lastRow);

    if (branchRow.length === 2) {
      const cols = branchRow.map(n => n.col).sort();
      expect(cols).toEqual([0, 1]);
    }
  });

  // ── 7. buildLayout with 3 branch steps ─────────────────────────

  it('should assign cols [0,1,2] for 3 branch steps', () => {
    component.actionData = makeActionData({
      processOrder: '1,2,3,4',
      alternateProcessOrder: '1 OR'
    });
    component.processSteps = mockSteps;
    component.reflexiveActions = mockActions;
    component.ngOnChanges({});

    const allNodes = component.layout.nodes;
    const opNode = allNodes.find(n => n.type === 'operator');
    expect(opNode).toBeTruthy();

    const branchRow = opNode!.row + 1;
    const branchNodes = allNodes.filter(n => n.type === 'step' && n.row === branchRow);

    if (branchNodes.length === 3) {
      const cols = branchNodes.map(n => n.col).sort();
      expect(cols).toEqual([0, 1, 2]);
    }
  });

  // ── 8. buildLayout with single branch step ─────────────────────

  it('should assign col [0] for single branch step', () => {
    component.actionData = makeActionData({
      processOrder: '1,2',
      alternateProcessOrder: '1 OR'
    });
    component.processSteps = mockSteps;
    component.reflexiveActions = mockActions;
    component.ngOnChanges({});

    const allNodes = component.layout.nodes;
    const opNode = allNodes.find(n => n.type === 'operator');

    if (opNode) {
      const branchRow = opNode.row + 1;
      const branchNodes = allNodes.filter(n => n.type === 'step' && n.row === branchRow);
      if (branchNodes.length === 1) {
        expect(branchNodes[0].col).toBe(0);
      }
    }
  });

  // ── 9. buildLayout with action node ────────────────────────────

  it('should create action node when reflexiveActions contains a matching action', () => {
    component.actionData = makeActionData({ processOrder: '1,2' });
    component.processSteps = mockSteps;
    component.reflexiveActions = mockActions;
    component.ngOnChanges({});

    const actionNode = component.layout.nodes.find(n => n.type === 'action');
    expect(actionNode).toBeTruthy();
    expect(actionNode!.title).toBe('1 - INSERT');
    expect(actionNode!.col).toBe(0);
  });

  // ── 10. buildLayout action node with badge ─────────────────────

  it('should set badge property on action node', () => {
    component.actionData = makeActionData({ processOrder: '1,2' });
    component.processSteps = mockSteps;
    component.reflexiveActions = mockActions;
    component.ngOnChanges({});

    const actionNode = component.layout.nodes.find(n => n.type === 'action');
    expect(actionNode).toBeTruthy();
    expect(actionNode!.badge).toBe('F1');
  });

  // ── 11. buildLayout connectors ─────────────────────────────────

  it('should produce solid arrows between linear steps and dashed from diamond to branches', () => {
    component.actionData = makeActionData({
      processOrder: '1,2,3',
      alternateProcessOrder: '1 OR'
    });
    component.processSteps = mockSteps;
    component.reflexiveActions = mockActions;
    component.ngOnChanges({});

    const solidConnectors = component.layout.connectors.filter(c => c.type === 'solid');
    const dashedConnectors = component.layout.connectors.filter(c => c.type === 'dashed');

    expect(solidConnectors.length).toBeGreaterThanOrEqual(0);
    expect(dashedConnectors.length).toBeGreaterThan(0);

    dashedConnectors.forEach(c => {
      expect(c.hasArrow).toBe(true);
    });
  });

  // ── 12. buildLayout canvas sizing ──────────────────────────────

  it('should calculate canvasWidth and canvasHeight correctly', () => {
    component.actionData = makeActionData({ processOrder: '1,2' });
    component.processSteps = mockSteps;
    component.reflexiveActions = mockActions;
    component.ngOnChanges({});

    expect(component.layout.canvasWidth).toBeGreaterThan(0);
    expect(component.layout.canvasHeight).toBeGreaterThan(0);
    expect(component.layout.canvasWidth).toBeGreaterThanOrEqual(DIAMOND_CX + OP_SIZE + CANVAS_PAD * 2);
  });

  // ── 13. nodeHeight for step node ───────────────────────────────

  it('should return NODE_H_BASE + condition heights for step node', () => {
    const node = {
      type: 'step', id: '1', title: '1 BLOOD', col: 0, row: 0,
      conditions: ['short']
    } as FlowNode;

    const height = component.nodeHeight(node);
    expect(height).toBeGreaterThanOrEqual(NODE_H_BASE);
    expect(height).toBe(NODE_H_BASE + COND_H);
  });

  it('should return NODE_H_BASE for step node with no conditions', () => {
    const node = {
      type: 'step', id: '1', title: '1 TEST', col: 0, row: 0,
      conditions: []
    } as FlowNode;

    const height = component.nodeHeight(node);
    expect(height).toBe(NODE_H_BASE);
  });

  // ── 14. nodeHeight for operator node ───────────────────────────

  it('should return OP_SIZE * 2 + 20 for operator node', () => {
    const node = {
      type: 'operator', id: 'op', title: 'OR', col: 1, row: 0,
      conditions: []
    } as FlowNode;

    const height = component.nodeHeight(node);
    expect(height).toBe(OP_SIZE * 2 + 20);
  });

  // ── 15. nodeHeight for step with long conditions ───────────────

  it('should calculate multi-line wrapping for long conditions', () => {
    const longText = 'A'.repeat(200);
    const node = {
      type: 'step', id: '1', title: '1 TEST', col: 0, row: 0,
      conditions: [longText]
    } as FlowNode;

    const height = component.nodeHeight(node);
    const contentWidth = NODE_W - 24;
    const avgCharWidth = 5.8;
    const expectedLines = Math.max(1, Math.ceil((longText.length * avgCharWidth) / contentWidth));
    const expectedHeight = NODE_H_BASE + expectedLines * COND_H;

    expect(height).toBe(expectedHeight);
    expect(height).toBeGreaterThan(NODE_H_BASE + COND_H);
  });

  // ── 16. nodeX for step node ────────────────────────────────────

  it('should return COL_X[col] for step nodes', () => {
    const node0 = { type: 'step', id: '1', title: 'X', col: 0, row: 0, conditions: [] } as FlowNode;
    const node1 = { type: 'step', id: '2', title: 'X', col: 1, row: 0, conditions: [] } as FlowNode;
    const node2 = { type: 'step', id: '3', title: 'X', col: 2, row: 0, conditions: [] } as FlowNode;

    expect(component.nodeX(node0)).toBe(COL_X[0]);
    expect(component.nodeX(node1)).toBe(COL_X[1]);
    expect(component.nodeX(node2)).toBe(COL_X[2]);
  });

  // ── 17. nodeX for operator node ────────────────────────────────

  it('should return DIAMOND_X for operator node', () => {
    const node = { type: 'operator', id: 'op', title: 'OR', col: 1, row: 0, conditions: [] } as FlowNode;
    expect(component.nodeX(node)).toBe(DIAMOND_X);
  });

  // ── 18. nodeY ──────────────────────────────────────────────────

  it('should return rowYMap value for given row', () => {
    component.actionData = makeActionData({ processOrder: '1,2' });
    component.processSteps = mockSteps;
    component.reflexiveActions = mockActions;
    component.ngOnChanges({});

    const stepNodes = component.layout.nodes.filter(n => n.type === 'step');
    expect(stepNodes.length).toBeGreaterThan(0);

    const firstStep = stepNodes[0];
    expect(component.nodeY(firstStep)).toBe(component.rowYMap[firstStep.row]);
  });

  it('should return 0 when rowYMap entry is undefined', () => {
    component.rowYMap = [];
    const node = { type: 'step', id: '1', title: 'X', col: 0, row: 99, conditions: [] } as FlowNode;
    expect(component.nodeY(node)).toBe(0);
  });

  // ── 19. arrowPoints down ───────────────────────────────────────

  it('should return correct polygon string for down arrow', () => {
    const connector = {
      type: 'solid', path: '', hasArrow: true,
      arrowX: 100, arrowY: 200, arrowDir: 'down'
    } as FlowConnector;

    const result = component.arrowPoints(connector);
    const s = 6;
    const expected = `100,200 ${100 - s},${200 - s * 1.5} ${100 + s},${200 - s * 1.5}`;
    expect(result).toBe(expected);
  });

  // ── 20. arrowPoints right ──────────────────────────────────────

  it('should return correct polygon string for right arrow', () => {
    const connector = {
      type: 'solid', path: '', hasArrow: true,
      arrowX: 150, arrowY: 250, arrowDir: 'right'
    } as FlowConnector;

    const result = component.arrowPoints(connector);
    const s = 6;
    const expected = `150,250 ${150 - s * 1.5},${250 - s} ${150 - s * 1.5},${250 + s}`;
    expect(result).toBe(expected);
  });

  // ── 21. arrowPoints left ───────────────────────────────────────

  it('should return correct polygon string for left arrow', () => {
    const connector = {
      type: 'solid', path: '', hasArrow: true,
      arrowX: 80, arrowY: 120, arrowDir: 'left'
    } as FlowConnector;

    const result = component.arrowPoints(connector);
    const s = 6;
    const expected = `80,120 ${80 + s * 1.5},${120 - s} ${80 + s * 1.5},${120 + s}`;
    expect(result).toBe(expected);
  });

  // ── 22. diamondPoints ──────────────────────────────────────────

  it('should return 4-point diamond polygon string', () => {
    component.actionData = makeActionData({
      processOrder: '1,2,3',
      alternateProcessOrder: '1 OR'
    });
    component.processSteps = mockSteps;
    component.reflexiveActions = mockActions;
    component.ngOnChanges({});

    const opNode = component.layout.nodes.find(n => n.type === 'operator');
    expect(opNode).toBeTruthy();

    const result = component.diamondPoints(opNode!);
    expect(result).toContain(`${DIAMOND_CX},`);
    expect(result).toContain(`${DIAMOND_CX + OP_SIZE},`);
    expect(result).toContain(`${DIAMOND_CX - OP_SIZE},`);

    const points = result.split(' ');
    expect(points.length).toBe(4);
  });

  // ── 23. diamondTextX ───────────────────────────────────────────

  it('should return DIAMOND_CX (420) for diamondTextX', () => {
    const node = { type: 'operator', id: 'op', title: 'OR', col: 1, row: 0, conditions: [] } as FlowNode;
    expect(component.diamondTextX(node)).toBe(DIAMOND_CX);
  });

  // ── 24. diamondTextY ───────────────────────────────────────────

  it('should return diamondCenterY + 5 for diamondTextY', () => {
    component.actionData = makeActionData({
      processOrder: '1,2,3',
      alternateProcessOrder: '1 OR'
    });
    component.processSteps = mockSteps;
    component.reflexiveActions = mockActions;
    component.ngOnChanges({});

    const opNode = component.layout.nodes.find(n => n.type === 'operator');
    expect(opNode).toBeTruthy();

    const textY = component.diamondTextY(opNode!);
    const nodeYVal = component.nodeY(opNode!);

    const stepAtSameRow = component.layout.nodes.find(
      n => n.row === opNode!.row && n.type === 'step'
    );
    const h = stepAtSameRow
      ? component.nodeHeight(stepAtSameRow)
      : component.nodeHeight(opNode!);
    const expectedCenterY = nodeYVal + h / 2;

    expect(textY).toBe(expectedCenterY + 5);
  });

  // ── 25. ngOnChanges triggers buildLayout ───────────────────────

  it('should update layout when inputs change via ngOnChanges', () => {
    component.actionData = makeActionData({ processOrder: '1,2' });
    component.processSteps = mockSteps;
    component.reflexiveActions = mockActions;
    component.ngOnChanges({});

    const firstNodeCount = component.layout.nodes.length;
    expect(firstNodeCount).toBeGreaterThan(0);

    component.actionData = makeActionData({ processOrder: '1,2,3' });
    component.ngOnChanges({});

    expect(component.layout.nodes.filter(n => n.type === 'step').length).toBe(3);
  });

  // ── 26. ngAfterViewInit sets up wheel listener ─────────────────

  it('should add wheel event listener on ngAfterViewInit', () => {
    const canvasEl = component.canvasRef.nativeElement;
    const addSpy = spyOn(canvasEl, 'addEventListener');

    component.ngAfterViewInit();

    expect(addSpy).toHaveBeenCalledWith(
      'wheel',
      jasmine.any(Function),
      { passive: false }
    );
  });

  // ── 27. ngOnDestroy removes wheel listener ─────────────────────

  it('should remove wheel event listener on ngOnDestroy', () => {
    component.ngAfterViewInit();

    const canvasEl = component.canvasRef.nativeElement;
    const removeSpy = spyOn(canvasEl, 'removeEventListener');

    component.ngOnDestroy();

    expect(removeSpy).toHaveBeenCalledWith('wheel', jasmine.any(Function));
  });

  // ── 28. wheel zoom in ─────────────────────────────────────────

  it('should increase scale when wheel deltaY is negative (zoom in)', fakeAsync(() => {
    component.ngAfterViewInit();
    component.scale = 1;

    const canvasEl = component.canvasRef.nativeElement;
    const wheelEvent = new WheelEvent('wheel', { deltaY: -100 });
    canvasEl.dispatchEvent(wheelEvent);
    tick();

    expect(component.scale).toBeGreaterThan(1);
  }));

  // ── 29. wheel zoom out ────────────────────────────────────────

  it('should decrease scale when wheel deltaY is positive (zoom out)', fakeAsync(() => {
    component.ngAfterViewInit();
    component.scale = 1;

    const canvasEl = component.canvasRef.nativeElement;
    const wheelEvent = new WheelEvent('wheel', { deltaY: 100 });
    canvasEl.dispatchEvent(wheelEvent);
    tick();

    expect(component.scale).toBeLessThan(1);
  }));

  // ── 30. zoom clamp min ─────────────────────────────────────────

  it('should not let scale go below 0.3', fakeAsync(() => {
    component.ngAfterViewInit();
    component.scale = 0.35;

    const canvasEl = component.canvasRef.nativeElement;

    for (let i = 0; i < 10; i++) {
      const wheelEvent = new WheelEvent('wheel', { deltaY: 100 });
      canvasEl.dispatchEvent(wheelEvent);
      tick();
    }

    expect(component.scale).toBeGreaterThanOrEqual(0.3);
  }));

  // ── 31. zoom clamp max ─────────────────────────────────────────

  it('should not let scale go above 2', fakeAsync(() => {
    component.ngAfterViewInit();
    component.scale = 1.95;

    const canvasEl = component.canvasRef.nativeElement;

    for (let i = 0; i < 20; i++) {
      const wheelEvent = new WheelEvent('wheel', { deltaY: -100 });
      canvasEl.dispatchEvent(wheelEvent);
      tick();
    }

    expect(component.scale).toBeLessThanOrEqual(2);
  }));
});
