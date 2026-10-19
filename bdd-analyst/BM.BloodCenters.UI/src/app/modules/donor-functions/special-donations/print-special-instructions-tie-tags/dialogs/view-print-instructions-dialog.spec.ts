import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import {
  ViewPrintInstructionsDialogComponent,
  ViewPrintInstructionsDialogData,
} from './view-print-instructions-dialog';

describe('ViewPrintInstructionsDialogComponent', () => {
  let component: ViewPrintInstructionsDialogComponent;
  let fixture: ComponentFixture<ViewPrintInstructionsDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ViewPrintInstructionsDialogComponent>>;

  const mockInstructions = [
    { sequence: 3, printInstruction: 'Apply special label' },
    { sequence: 1, printInstruction: 'Check donor ID' },
    { sequence: 2, printInstruction: 'Verify blood type' },
  ];

  const mockDialogData: ViewPrintInstructionsDialogData = {
    instructions: mockInstructions as any,
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ViewPrintInstructionsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewPrintInstructionsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default sort state', () => {
    expect(component.sortState()).toBe('default');
  });

  it('should return instructions in original order by default', () => {
    const sorted = component.sortedInstructions();
    expect(sorted.length).toBe(3);
    expect(sorted[0].sequence).toBe(3);
  });

  it('should sort instructions ascending on first toggle', () => {
    component.toggleSort();
    expect(component.sortState()).toBe('asc');
    const sorted = component.sortedInstructions();
    expect(sorted[0].sequence).toBe(1);
    expect(sorted[1].sequence).toBe(2);
    expect(sorted[2].sequence).toBe(3);
  });

  it('should sort instructions descending on second toggle', () => {
    component.toggleSort(); // asc
    component.toggleSort(); // desc
    expect(component.sortState()).toBe('desc');
    const sorted = component.sortedInstructions();
    expect(sorted[0].sequence).toBe(3);
    expect(sorted[1].sequence).toBe(2);
    expect(sorted[2].sequence).toBe(1);
  });

  it('should return to default sort on third toggle', () => {
    component.toggleSort(); // asc
    component.toggleSort(); // desc
    component.toggleSort(); // default
    expect(component.sortState()).toBe('default');
  });

  it('should close dialog on onClose', () => {
    component.onClose();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should handle empty instructions array', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ViewPrintInstructionsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { instructions: [] } },
      ],
    });
    const emptyFixture = TestBed.createComponent(ViewPrintInstructionsDialogComponent);
    const emptyComponent = emptyFixture.componentInstance;
    emptyFixture.detectChanges();
    expect(emptyComponent.sortedInstructions().length).toBe(0);
  });
});
